package com.racc.evaluation.service;

import com.racc.evaluation.entity.EvaluationDatasetEntity;
import com.racc.evaluation.entity.EvaluationResultEntity;
import com.racc.evaluation.repository.EvaluationDatasetRepository;
import com.racc.evaluation.repository.EvaluationResultRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.*;

/**
 * 评估服务。LLM 未配置时返回模拟数据。
 */
@Service
@Transactional
public class EvaluationService {

    private final EvaluationResultRepository resultRepo;
    private final EvaluationDatasetRepository datasetRepo;

    public EvaluationService(EvaluationResultRepository resultRepo,
                             EvaluationDatasetRepository datasetRepo) {
        this.resultRepo = resultRepo;
        this.datasetRepo = datasetRepo;
    }

    /** 获取评估器列表。 */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getEvaluators() {
        List<Map<String, Object>> evaluators = new ArrayList<>();

        Map<String, Object> exact = new LinkedHashMap<>();
        exact.put("name", "exact_match");
        exact.put("displayName", "精确匹配");
        exact.put("description", "判断答案是否与标准答案完全一致");
        exact.put("defaultThreshold", 1.0);
        evaluators.add(exact);

        Map<String, Object> contains = new LinkedHashMap<>();
        contains.put("name", "contains");
        contains.put("displayName", "包含匹配");
        contains.put("description", "判断答案是否包含关键信息");
        contains.put("defaultThreshold", 0.7);
        evaluators.add(contains);

        Map<String, Object> semantic = new LinkedHashMap<>();
        semantic.put("name", "semantic_similarity");
        semantic.put("displayName", "语义相似度");
        semantic.put("description", "基于文本语义相似度评估答案质量");
        semantic.put("defaultThreshold", 0.6);
        evaluators.add(semantic);

        Map<String, Object> llm = new LinkedHashMap<>();
        llm.put("name", "llm_judge");
        llm.put("displayName", "LLM 裁判");
        llm.put("description", "使用 LLM 对答案进行综合评判");
        llm.put("defaultThreshold", 0.5);
        evaluators.add(llm);

        return evaluators;
    }

    /** 执行单次评估。 */
    public Map<String, Object> evaluate(Map<String, Object> body) {
        String question = (String) body.getOrDefault("question", "");
        String answer = (String) body.getOrDefault("answer", "");
        String context = (String) body.get("context");
        String groundTruth = (String) body.get("groundTruth");
        String evaluator = (String) body.getOrDefault("evaluator", "exact_match");

        // 模拟评估逻辑
        double score = mockEvaluate(evaluator, answer, groundTruth);
        boolean passed = score >= 0.5;
        String explanation = generateExplanation(evaluator, score, passed);

        // 保存结果
        EvaluationResultEntity result = new EvaluationResultEntity();
        result.setEvaluatorName(evaluator);
        result.setQuestion(question);
        result.setAnswer(answer);
        result.setScore(score);
        result.setThreshold(0.5);
        result.setPassed(passed);
        result.setExplanation(explanation);
        result.setDetails("{\"method\": \"" + evaluator + "\", \"score\": " + score + "}");
        result.setContext(context);
        result.setGroundTruth(groundTruth);
        result.setCreatedAt(LocalDateTime.now());
        resultRepo.save(result);

        Map<String, Object> output = new LinkedHashMap<>();
        output.put("evaluatorName", evaluator);
        output.put("score", score);
        output.put("explanation", explanation);
        output.put("passed", passed);
        output.put("details", result.getDetails());
        return output;
    }

    /** 获取评估结果列表。 */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getResults() {
        List<EvaluationResultEntity> list = resultRepo.findAllByOrderByCreatedAtDesc();
        List<Map<String, Object>> result = new ArrayList<>();
        for (EvaluationResultEntity r : list) {
            result.add(toResultMap(r));
        }
        return result;
    }

    /** 获取统计信息。 */
    @Transactional(readOnly = true)
    public Map<String, Object> getStats() {
        List<EvaluationResultEntity> all = resultRepo.findAll();
        long total = all.size();
        long passed = all.stream().filter(r -> Boolean.TRUE.equals(r.getPassed())).count();
        double avgScore = all.stream().mapToDouble(EvaluationResultEntity::getScore).average().orElse(0.0);

        // 按评估器分组统计
        Map<String, List<EvaluationResultEntity>> byEvaluator = new LinkedHashMap<>();
        for (EvaluationResultEntity r : all) {
            byEvaluator.computeIfAbsent(r.getEvaluatorName(), k -> new ArrayList<>()).add(r);
        }
        List<Map<String, Object>> byEvaluatorList = new ArrayList<>();
        for (Map.Entry<String, List<EvaluationResultEntity>> entry : byEvaluator.entrySet()) {
            List<EvaluationResultEntity> evalList = entry.getValue();
            long evalPassed = evalList.stream().filter(r -> Boolean.TRUE.equals(r.getPassed())).count();
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("evaluatorName", entry.getKey());
            item.put("count", evalList.size());
            item.put("passRate", evalList.isEmpty() ? 0.0 : Math.round((double) evalPassed / evalList.size() * 1000.0) / 10.0);
            item.put("averageScore", evalList.isEmpty() ? 0.0 : Math.round(evalList.stream().mapToDouble(EvaluationResultEntity::getScore).average().orElse(0.0) * 100.0) / 100.0);
            byEvaluatorList.add(item);
        }

        Map<String, Object> stats = new LinkedHashMap<>();
        stats.put("totalEvaluations", total);
        stats.put("passRate", total == 0 ? 0.0 : Math.round((double) passed / total * 1000.0) / 10.0);
        stats.put("averageScore", Math.round(avgScore * 100.0) / 100.0);
        stats.put("byEvaluator", byEvaluatorList);
        return stats;
    }

    /** 清空评估结果。 */
    public void clearResults() {
        resultRepo.deleteAll();
    }

    // ==================== 数据集 ====================

    @Transactional(readOnly = true)
    public List<Map<String, Object>> getDatasets() {
        List<EvaluationDatasetEntity> list = datasetRepo.findAll();
        List<Map<String, Object>> result = new ArrayList<>();
        for (EvaluationDatasetEntity d : list) {
            result.add(toDatasetMap(d));
        }
        return result;
    }

    @Transactional(readOnly = true)
    public Map<String, Object> getDataset(Long id) {
        EvaluationDatasetEntity entity = datasetRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("数据集不存在: " + id));
        return toDatasetMap(entity);
    }

    public Map<String, Object> createDataset(Map<String, Object> body) {
        String name = (String) body.get("name");
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("数据集名称不能为空");
        }

        EvaluationDatasetEntity entity = new EvaluationDatasetEntity();
        entity.setName(name.trim());
        entity.setDescription((String) body.get("description"));
        entity.setItems((String) body.getOrDefault("items", "[]"));
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());

        entity = datasetRepo.save(entity);
        return toDatasetMap(entity);
    }

    public void deleteDataset(Long id) {
        if (!datasetRepo.existsById(id)) {
            throw new NoSuchElementException("数据集不存在: " + id);
        }
        datasetRepo.deleteById(id);
    }

    public Map<String, Object> runDataset(Long id) {
        EvaluationDatasetEntity entity = datasetRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("数据集不存在: " + id));

        // 模拟运行数据集：对每个 item 执行评估
        String items = entity.getItems();
        int itemCount = 0;
        if (items != null && !items.isBlank()) {
            try {
                String trimmed = items.trim();
                if (trimmed.startsWith("[")) {
                    itemCount = trimmed.split("\"question\"").length - 1;
                }
            } catch (Exception ignored) {}
        }

        // 模拟生成评估结果
        for (int i = 0; i < Math.max(itemCount, 1); i++) {
            EvaluationResultEntity result = new EvaluationResultEntity();
            result.setEvaluatorName("exact_match");
            result.setQuestion("数据集问题 #" + (i + 1));
            result.setAnswer("模拟答案 #" + (i + 1));
            result.setScore(0.8);
            result.setThreshold(0.5);
            result.setPassed(true);
            result.setExplanation("数据集评估通过（模拟）");
            result.setCreatedAt(LocalDateTime.now());
            resultRepo.save(result);
        }

        Map<String, Object> output = new LinkedHashMap<>();
        output.put("message", "数据集运行完成");
        output.put("datasetId", id);
        output.put("itemCount", Math.max(itemCount, 1));
        output.put("resultsGenerated", Math.max(itemCount, 1));
        return output;
    }

    // ---------- helpers ----------

    private double mockEvaluate(String evaluator, String answer, String groundTruth) {
        if (answer == null || answer.isBlank()) return 0.0;
        if (groundTruth == null || groundTruth.isBlank()) return 0.5;

        switch (evaluator) {
            case "exact_match":
                return answer.trim().equals(groundTruth.trim()) ? 1.0 : 0.0;
            case "contains":
                return groundTruth.contains(answer) || answer.contains(groundTruth) ? 0.9 : 0.3;
            case "semantic_similarity":
            case "llm_judge":
                // 模拟语义相似度：基于字面重叠率
                String a = answer.replaceAll("\\s+", "");
                String g = groundTruth.replaceAll("\\s+", "");
                if (a.isEmpty() || g.isEmpty()) return 0.0;
                int overlap = 0;
                for (char c : a.toCharArray()) {
                    if (g.indexOf(c) >= 0) overlap++;
                }
                return Math.round((double) overlap / Math.max(a.length(), g.length()) * 100.0) / 100.0;
            default:
                return 0.5;
        }
    }

    private String generateExplanation(String evaluator, double score, boolean passed) {
        return String.format("评估器: %s, 得分: %.2f, %s（当前为模拟评估，LLM 未配置）",
                evaluator, score, passed ? "通过" : "未通过");
    }

    private Map<String, Object> toResultMap(EvaluationResultEntity r) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", r.getId());
        map.put("evaluatorName", r.getEvaluatorName());
        map.put("question", r.getQuestion());
        map.put("answer", r.getAnswer());
        map.put("score", r.getScore());
        map.put("threshold", r.getThreshold());
        map.put("passed", r.getPassed());
        map.put("explanation", r.getExplanation());
        map.put("details", r.getDetails());
        map.put("createdAt", r.getCreatedAt() != null ? r.getCreatedAt().toString() : null);
        return map;
    }

    private Map<String, Object> toDatasetMap(EvaluationDatasetEntity d) {
        Map<String, Object> map = new LinkedHashMap<>();
        map.put("id", d.getId());
        map.put("name", d.getName());
        map.put("description", d.getDescription());
        map.put("items", d.getItems());
        map.put("createdAt", d.getCreatedAt() != null ? d.getCreatedAt().toString() : null);
        map.put("updatedAt", d.getUpdatedAt() != null ? d.getUpdatedAt().toString() : null);
        return map;
    }
}