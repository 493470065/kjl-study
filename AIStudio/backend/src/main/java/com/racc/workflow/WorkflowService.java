package com.racc.workflow;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.racc.agent.service.AgentRuntimeService;
import com.racc.workflow.entity.WorkflowEntity;
import com.racc.workflow.entity.WorkflowExecutionEntity;
import com.racc.workflow.entity.WorkflowNodeEntity;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;

/**
 * 工作流服务：CRUD、顺序执行引擎、执行记录管理
 */
@Service
public class WorkflowService {

    private static final Logger log = LoggerFactory.getLogger(WorkflowService.class);

    private final WorkflowRepository workflowRepository;
    private final WorkflowExecutionRepository executionRepository;
    private final WorkflowNodeRepository nodeRepository;
    private final ObjectMapper objectMapper;
    private final AgentRuntimeService agentRuntimeService;

    public WorkflowService(WorkflowRepository workflowRepository,
                           WorkflowExecutionRepository executionRepository,
                           WorkflowNodeRepository nodeRepository,
                           ObjectMapper objectMapper,
                           AgentRuntimeService agentRuntimeService) {
        this.workflowRepository = workflowRepository;
        this.executionRepository = executionRepository;
        this.nodeRepository = nodeRepository;
        this.objectMapper = objectMapper;
        this.agentRuntimeService = agentRuntimeService;
    }

    // ========== 工作流 CRUD ==========

    public List<WorkflowEntity> listWorkflows() {
        return workflowRepository.findAll();
    }

    public WorkflowEntity getWorkflow(Long id) {
        return workflowRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("工作流不存在: " + id));
    }

    @Transactional
    public WorkflowEntity createWorkflow(WorkflowEntity entity) {
        entity.setEnabled(true);
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        return workflowRepository.save(entity);
    }

    @Transactional
    public WorkflowEntity updateWorkflow(Long id, Map<String, Object> updates) {
        WorkflowEntity entity = getWorkflow(id);

        if (updates.containsKey("name")) entity.setName((String) updates.get("name"));
        if (updates.containsKey("description")) entity.setDescription((String) updates.get("description"));
        if (updates.containsKey("definitionJson")) entity.setDefinitionJson((String) updates.get("definitionJson"));
        if (updates.containsKey("enabled")) entity.setEnabled((Boolean) updates.get("enabled"));

        entity.setUpdatedAt(LocalDateTime.now());
        return workflowRepository.save(entity);
    }

    @Transactional
    public void deleteWorkflow(Long id) {
        if (!workflowRepository.existsById(id)) {
            throw new RuntimeException("工作流不存在: " + id);
        }
        workflowRepository.deleteById(id);
    }

    // ========== 工作流执行 ==========

    /**
     * 执行工作流：简单顺序执行引擎
     * definitionJson 格式: {nodes:[{id,type,position,data}], edges:[{id,source,target}]}
     * 节点类型: START / END / AGENT / CONDITION / PARALLEL / MERGE
     */
    @Transactional
    public WorkflowExecutionEntity executeWorkflow(Long id, Map<String, Object> context) {
        WorkflowEntity workflow = getWorkflow(id);

        // 解析定义
        Map<String, Object> definition;
        try {
            definition = objectMapper.readValue(workflow.getDefinitionJson(),
                    new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new RuntimeException("工作流定义解析失败: " + e.getMessage(), e);
        }

        List<Map<String, Object>> nodes = (List<Map<String, Object>>) definition.getOrDefault("nodes", List.of());

        // 兼容前端（connections: from/to）与历史（edges: source/target）两种字段名
        List<Map<String, Object>> rawEdges = (List<Map<String, Object>>) definition.getOrDefault("edges",
                definition.getOrDefault("connections", List.of()));
        List<Map<String, Object>> edges = new ArrayList<>();
        for (Map<String, Object> e : rawEdges) {
            Map<String, Object> ne = new LinkedHashMap<>(e);
            if (!ne.containsKey("source") && ne.containsKey("from")) ne.put("source", ne.get("from"));
            if (!ne.containsKey("target") && ne.containsKey("to")) ne.put("target", ne.get("to"));
            edges.add(ne);
        }

        if (nodes.isEmpty()) {
            throw new RuntimeException("工作流定义中没有节点");
        }

        // 创建执行记录
        WorkflowExecutionEntity execution = new WorkflowExecutionEntity();
        execution.setWorkflowId(id);
        execution.setStatus("RUNNING");
        execution.setContext(context != null ? toJson(context) : "{}");
        execution.setStartedAt(LocalDateTime.now());
        execution = executionRepository.save(execution);

        // 执行引擎
        try {
            // 构建节点映射
            Map<String, Map<String, Object>> nodeMap = new LinkedHashMap<>();
            for (Map<String, Object> node : nodes) {
                nodeMap.put((String) node.get("id"), node);
            }

            // 构建边映射：source -> [target]
            Map<String, List<String>> edgeMap = new LinkedHashMap<>();
            for (Map<String, Object> edge : edges) {
                String source = (String) edge.get("source");
                String target = (String) edge.get("target");
                edgeMap.computeIfAbsent(source, k -> new ArrayList<>()).add(target);
            }

            // 找到 START 节点
            String startNodeId = null;
            for (Map<String, Object> node : nodes) {
                if ("START".equalsIgnoreCase((String) node.get("type"))) {
                    startNodeId = (String) node.get("id");
                    break;
                }
            }

            if (startNodeId == null) {
                // 没有 START 节点则取第一个
                startNodeId = (String) nodes.get(0).get("id");
            }

            // 按边顺序遍历
            String currentNodeId = startNodeId;
            Map<String, Object> executionContext = new LinkedHashMap<>();
            if (context != null) {
                executionContext.putAll(context);
            }
            executionContext.put("__workflow_name", workflow.getName());
            executionContext.put("__execution_id", execution.getId());

            while (currentNodeId != null) {
                Map<String, Object> node = nodeMap.get(currentNodeId);
                if (node == null) break;

                String nodeType = (String) node.getOrDefault("type", "AGENT");
                String nodeLabel = (String) node.getOrDefault("id", currentNodeId);

                // 创建节点执行记录
                WorkflowNodeEntity nodeRecord = new WorkflowNodeEntity();
                nodeRecord.setExecutionId(execution.getId());
                nodeRecord.setNodeId(currentNodeId);
                nodeRecord.setType(nodeType);
                nodeRecord.setStatus("RUNNING");
                nodeRecord.setInput(toJson(executionContext));
                nodeRecord.setStartedAt(LocalDateTime.now());
                nodeRecord = nodeRepository.save(nodeRecord);

                try {
                    // 执行节点
                    Map<String, Object> nodeResult = executeNode(nodeType, node, executionContext);

                    // 更新节点记录
                    nodeRecord.setStatus("COMPLETED");
                    nodeRecord.setOutput(toJson(nodeResult));
                    nodeRecord.setCompletedAt(LocalDateTime.now());
                    nodeRepository.save(nodeRecord);

                    // 合并上下文
                    if (nodeResult != null) {
                        executionContext.putAll(nodeResult);
                    }

                } catch (Exception e) {
                    nodeRecord.setStatus("FAILED");
                    nodeRecord.setError(e.getMessage());
                    nodeRecord.setCompletedAt(LocalDateTime.now());
                    nodeRepository.save(nodeRecord);

                    // 执行失败
                    execution.setStatus("FAILED");
                    execution.setResult("{\"error\":\"" + e.getMessage() + "\"}");
                    execution.setCompletedAt(LocalDateTime.now());
                    executionRepository.save(execution);
                    log.error("工作流 [{}] 执行失败, node={}: {}", workflow.getName(), currentNodeId, e.getMessage());
                    return execution;
                }

                // 如果当前节点是 END 则终止
                if ("END".equalsIgnoreCase(nodeType)) {
                    break;
                }

                // 查找下一个节点
                List<String> targets = edgeMap.get(currentNodeId);
                if (targets == null || targets.isEmpty()) {
                    break;
                }
                // 对于 CONDITION 节点，根据结果选择分支
                if ("CONDITION".equalsIgnoreCase(nodeType)) {
                    String nextNode = selectConditionBranch(targets, executionContext);
                    currentNodeId = nextNode != null ? nextNode : targets.get(0);
                } else {
                    currentNodeId = targets.get(0);
                }
            }

            execution.setStatus("COMPLETED");
            execution.setResult(toJson(executionContext));
            execution.setCompletedAt(LocalDateTime.now());
            log.info("工作流 [{}] 执行完成", workflow.getName());

        } catch (Exception e) {
            execution.setStatus("FAILED");
            execution.setResult("{\"error\":\"" + e.getMessage() + "\"}");
            execution.setCompletedAt(LocalDateTime.now());
            log.error("工作流 [{}] 执行异常: {}", workflow.getName(), e.getMessage(), e);
        }

        return executionRepository.save(execution);
    }

    /**
     * 执行单个节点
     */
    private Map<String, Object> executeNode(String type, Map<String, Object> node,
                                            Map<String, Object> context) {
        Map<String, Object> data = (Map<String, Object>) node.getOrDefault("data", Map.of());

        switch (type.toUpperCase()) {
            case "START":
                // 起始节点：传递上下文
                return Map.of("__start", true);

            case "END":
                // 结束节点
                return Map.of("__end", true);

            case "AGENT":
                // Agent 节点：真正调用已配置的 Agent（chatWithAgent）
                String agentName = (String) data.getOrDefault("agentId", (String) data.get("agent"));
                if (agentName == null || agentName.isBlank()) {
                    log.warn("AGENT 节点 [{}] 未配置 agentId，跳过（视为空执行）", node.get("id"));
                    return Map.of("__agent_result", "skipped",
                            "__agent_output", "Agent 节点未配置 Agent，跳过执行");
                }
                // 构造发送给 Agent 的消息：优先用节点 data.message，否则取上下文 input 或节点标签
                String agentMessage = (String) data.get("message");
                if (agentMessage == null || agentMessage.isBlank()) {
                    Object ctxInput = context.get("input");
                    agentMessage = ctxInput != null ? String.valueOf(ctxInput) : "请执行任务：" + node.get("id");
                }
                log.info("执行 AGENT 节点 [{}], agent={}, message长度={}", node.get("id"), agentName, agentMessage.length());
                try {
                    Map<String, Object> agentReply = agentRuntimeService.chatWithAgent(
                            agentName, agentMessage, null, "workflow-engine");
                    Object content = agentReply.getOrDefault("content", "");
                    String text = (content != null) ? content.toString() : "";
                    String convId = agentReply.get("conversationId") != null
                            ? agentReply.get("conversationId").toString() : null;
                    log.info("AGENT 节点 [{}] 返回内容长度={}, conversation={}", node.get("id"), text.length(), convId);
                    // 把 Agent 回复写回上下文，供后续节点（如 CONDITION/END）使用
                    Map<String, Object> result = new LinkedHashMap<>();
                    result.put("__agent_result", "executed");
                    result.put("__agent_name", agentName);
                    result.put("__agent_output", text);
                    if (convId != null) result.put("__agent_conversation_id", convId);
                    return result;
                } catch (Exception e) {
                    log.error("AGENT 节点 [{}] 调用失败: {}", node.get("id"), e.getMessage());
                    throw new RuntimeException("Agent [" + agentName + "] 调用失败: " + e.getMessage(), e);
                }

            case "CONDITION":
                // 条件节点：根据上下文判断
                String condition = (String) data.getOrDefault("condition", "true");
                boolean result = evaluateCondition(condition, context);
                log.info("执行 CONDITION 节点, condition={}, result={}", condition, result);
                return Map.of("__condition_result", result);

            case "PARALLEL":
                // 并行节点（当前简化为串行，仅记录标记）
                log.info("执行 PARALLEL 节点");
                return Map.of("__parallel", true, "__parallel_nodes",
                        data.getOrDefault("branches", List.of()));

            case "MERGE":
                // 合并节点
                log.info("执行 MERGE 节点");
                return Map.of("__merge", true);

            default:
                log.warn("未知节点类型: {}", type);
                return Map.of("__unknown_type", type);
        }
    }

    /**
     * 条件分支选择（简单实现：根据上下文 key 选择）
     */
    private String selectConditionBranch(List<String> targets, Map<String, Object> context) {
        Boolean conditionResult = (Boolean) context.get("__condition_result");
        if (conditionResult != null && conditionResult && targets.size() > 0) {
            return targets.get(0);
        }
        if (targets.size() > 1) {
            return targets.get(1);
        }
        return targets.get(0);
    }

    /**
     * 条件评估（简单实现）
     */
    private boolean evaluateCondition(String condition, Map<String, Object> context) {
        if (condition == null || condition.isBlank() || "true".equals(condition)) {
            return true;
        }
        if ("false".equals(condition)) {
            return false;
        }
        // 简单变量查找：如果 condition 是上下文中的 key，取其布尔值
        Object value = context.get(condition);
        if (value instanceof Boolean) {
            return (Boolean) value;
        }
        if (value instanceof String) {
            return Boolean.parseBoolean((String) value);
        }
        return true;
    }

    // ========== 执行记录管理 ==========

    public List<WorkflowExecutionEntity> listExecutions() {
        return executionRepository.findAllByOrderByStartedAtDesc();
    }

    public WorkflowExecutionEntity getExecution(Long id) {
        return executionRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("执行记录不存在: " + id));
    }

    @Transactional
    public void cancelExecution(Long id) {
        WorkflowExecutionEntity execution = getExecution(id);
        if ("RUNNING".equals(execution.getStatus()) || "PENDING".equals(execution.getStatus())) {
            execution.setStatus("CANCELLED");
            execution.setCompletedAt(LocalDateTime.now());
            executionRepository.save(execution);
            log.info("执行记录 [{}] 已取消", id);
        } else {
            throw new RuntimeException("执行记录状态不允许取消: " + execution.getStatus());
        }
    }

    public List<WorkflowNodeEntity> getExecutionNodes(Long executionId) {
        return nodeRepository.findByExecutionIdOrderByIdAsc(executionId);
    }

    // ========== 内部工具 ==========

    private String toJson(Object obj) {
        try {
            return objectMapper.writeValueAsString(obj);
        } catch (Exception e) {
            return "{}";
        }
    }
}