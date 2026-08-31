package com.racc.sandbox;

import com.racc.audit.AuditTaskExecutionRepository;
import com.racc.audit.entity.AuditTaskExecutionEntity;
import jakarta.annotation.PostConstruct;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Sort;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;

import java.io.IOException;
import java.nio.charset.Charset;
import java.nio.file.Paths;
import java.time.Duration;
import java.time.LocalDateTime;
import java.util.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.AtomicInteger;

/**
 * 沙箱服务。
 *
 * 两级模型：沙箱实例（命名执行环境，独立工作目录）+ 执行记录（沙箱内每条命令的异步执行）。
 * 引擎：LOCAL=本地进程沙箱（真实引擎，开箱即用）；DOCKER=容器隔离（预留，配置开启且本机
 * Docker 可用时启用，不可用自动降级 LOCAL——对齐平台 LLM/Neo4j/Redis 的降级家法）。
 *
 * 异步执行照 PipelineService/PipelineExecutionService 家法：事务提交后（afterCommit）投递
 * 有界线程池；worker 不加事务，每次落库独立短事务（Hikari 连接有限）。
 */
@Service
public class SandboxService {

    private static final Logger log = LoggerFactory.getLogger(SandboxService.class);

    private final SandboxRepository sandboxRepo;
    private final SandboxExecutionRepository execRepo;
    private final AuditTaskExecutionRepository auditRepo;
    private final LocalSandboxExecutor localExecutor;
    private final DockerSandboxExecutor dockerExecutor;

    @Value("${racc.sandbox.enabled:true}")
    private boolean sandboxEnabled;

    /** 运行时开关有效值：初始化取自 application.yml 的 racc.sandbox.enabled，运行时可经 /api/sandbox/config 切换（内存态，重启回退 yml） */
    private volatile boolean effectiveSandboxEnabled = true;

    @Value("${racc.sandbox.dir:data/sandbox}")
    private String sandboxDir;

    @Value("${racc.sandbox.default-timeout-seconds:600}")
    private int defaultTimeoutSeconds;

    @Value("${racc.sandbox.max-output-chars:65536}")
    private int maxOutputChars;

    /** executionId → 存活进程（销毁时按沙箱维度追杀） */
    private record LiveExec(long sandboxId, Process process) {}
    private final ConcurrentHashMap<Long, LiveExec> liveExecs = new ConcurrentHashMap<>();

    /** 有界执行池：Hikari 连接有限（10），并发必须小；队列满直接拒绝并置失败 */
    private final ThreadPoolExecutor pool;

    public SandboxService(SandboxRepository sandboxRepo,
                          SandboxExecutionRepository execRepo,
                          AuditTaskExecutionRepository auditRepo,
                          LocalSandboxExecutor localExecutor,
                          DockerSandboxExecutor dockerExecutor) {
        this.sandboxRepo = sandboxRepo;
        this.execRepo = execRepo;
        this.auditRepo = auditRepo;
        this.localExecutor = localExecutor;
        this.dockerExecutor = dockerExecutor;

        AtomicInteger seq = new AtomicInteger(1);
        ThreadFactory factory = r -> {
            Thread t = new Thread(r, "sandbox-exec-" + seq.getAndIncrement());
            t.setDaemon(true);
            return t;
        };
        this.pool = new ThreadPoolExecutor(1, 2, 60L, TimeUnit.SECONDS,
                new LinkedBlockingQueue<>(20), factory, new ThreadPoolExecutor.AbortPolicy());
    }

    // ========== 状态 ==========

    /** 沙箱启用状态与引擎能力（"enabled" 键保留在最前，兼容旧前端契约） */
    public Map<String, Object> getStatus() {
        boolean dockerAvailable = dockerExecutor.available();
        Map<String, Object> status = new LinkedHashMap<>();
        status.put("enabled", isEffectivelyEnabled());
        status.put("enabledSource", enabledSource());
        status.put("engine", dockerAvailable ? "DOCKER" : "LOCAL");
        status.put("dockerEnabled", dockerExecutor.isDockerEffectivelyEnabled());
        status.put("dockerEnabledSource", dockerExecutor.enabledSource());
        status.put("dockerAvailable", dockerAvailable);
        status.put("imagePresent", dockerExecutor.imagePresent());
        status.put("activeCount", sandboxRepo.countByStatus("RUNNING"));

        Map<String, Object> docker = new LinkedHashMap<>();
        docker.put("image", dockerExecutor.getImage());
        docker.put("memory", dockerExecutor.getMemory());
        docker.put("cpus", dockerExecutor.getCpus());

        Map<String, Object> defaults = new LinkedHashMap<>();
        defaults.put("dir", sandboxDir);
        defaults.put("timeoutSeconds", defaultTimeoutSeconds);
        defaults.put("maxOutputChars", maxOutputChars);
        defaults.put("docker", docker);
        status.put("defaults", defaults);
        return status;
    }

    // ========== 沙箱 CRUD ==========

    @Transactional(readOnly = true)
    public List<SandboxEntity> listSandboxes() {
        return sandboxRepo.findAll(Sort.by(Sort.Direction.DESC, "id"));
    }

    /** 活跃沙箱列表（旧契约：每项含 taskId + status，附加 id/name/mode 等） */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listActive() {
        List<Map<String, Object>> result = new ArrayList<>();
        for (SandboxEntity s : sandboxRepo.findAll(Sort.by(Sort.Direction.DESC, "id"))) {
            if ("DESTROYED".equals(s.getStatus())) {
                continue;
            }
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("taskId", s.getTaskId() != null ? s.getTaskId() : String.valueOf(s.getId()));
            item.put("status", s.getStatus());
            item.put("id", s.getId());
            item.put("name", s.getName());
            item.put("mode", s.getMode());
            item.put("workdir", s.getWorkdir());
            item.put("createdAt", s.getCreatedAt());
            result.add(item);
        }
        return result;
    }

    @Transactional(readOnly = true)
    public SandboxEntity getSandbox(Long id) {
        return sandboxRepo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("沙箱不存在: " + id));
    }

    /**
     * 创建沙箱。
     * mode 裁决：显式 DOCKER 但不可用 → 降级 LOCAL（记日志，页面如实显示实际 mode）；
     * 未指定 → Docker 可用则 DOCKER，否则 LOCAL。
     * 环境创建失败整体回滚，不留残行。
     */
    @Transactional
    public SandboxEntity createSandbox(String name, String taskId, String mode, Integer timeoutSeconds) {
        if (!isEffectivelyEnabled()) {
            throw new IllegalStateException("沙箱功能未启用，可在页面「启用状态」开关开启，或在 application.yml 设置 racc.sandbox.enabled: true");
        }
        if (name == null || name.isBlank()) {
            throw new IllegalArgumentException("沙箱名称不能为空");
        }
        final String sandboxName = name.trim();
        sandboxRepo.findByName(sandboxName).ifPresent(s -> {
            throw new IllegalArgumentException("沙箱名称已存在: " + sandboxName);
        });

        boolean dockerUsable = dockerExecutor.available();
        String finalMode;
        if ("DOCKER".equalsIgnoreCase(mode)) {
            if (dockerUsable) {
                finalMode = "DOCKER";
            } else {
                log.warn("请求 DOCKER 模式但 Docker 不可用（配置未开/CLI 缺失/镜像不存在），沙箱 [{}] 降级为 LOCAL", sandboxName);
                finalMode = "LOCAL";
            }
        } else {
            finalMode = dockerUsable ? "DOCKER" : "LOCAL";
        }

        SandboxEntity sandbox = new SandboxEntity();
        sandbox.setName(sandboxName);
        sandbox.setTaskId(taskId != null && !taskId.isBlank() ? taskId.trim() : null);
        sandbox.setMode(finalMode);
        sandbox.setStatus("CREATING");
        sandbox.setTimeoutSeconds(timeoutSeconds != null && timeoutSeconds > 0
                ? timeoutSeconds : defaultTimeoutSeconds);
        sandbox.setCreatedBy(currentUsername());
        sandbox = sandboxRepo.save(sandbox);

        // workdir 依赖自增 id，先落库再回填
        String workdir = Paths.get(sandboxDir, String.valueOf(sandbox.getId())).toString();
        sandbox.setWorkdir(workdir);
        try {
            // 本地/容器模式都需要宿主机工作目录（DOCKER 模式挂载进容器）
            localExecutor.create(sandbox);
            if ("DOCKER".equals(finalMode)) {
                dockerExecutor.create(sandbox);
            }
        } catch (RuntimeException | Error e) {
            localExecutor.cleanupWorkdir(sandbox);
            throw e;
        }

        sandbox.setStatus("RUNNING");
        sandbox = sandboxRepo.save(sandbox);
        log.info("沙箱已创建: id={}, name={}, mode={}, workdir={}", sandbox.getId(), sandboxName, finalMode, workdir);
        return sandbox;
    }

    /**
     * 销毁沙箱（key 兼容：先按数字 id 解析，失败按 task_id 查——兼容旧 DELETE /{taskId} 契约）。
     * 杀存活进程 → 未完成执行置失败 → 移除容器（如有）→ 删工作目录 → 置 DESTROYED。
     */
    @Transactional
    public void destroySandboxByKey(String key) {
        SandboxEntity sandbox = null;
        try {
            sandbox = sandboxRepo.findById(Long.parseLong(key)).orElse(null);
        } catch (NumberFormatException ignored) {
            // key 不是数字，按 task_id 查
        }
        if (sandbox == null) {
            sandbox = sandboxRepo.findByTaskId(key).orElse(null);
        }
        if (sandbox == null) {
            throw new NoSuchElementException("沙箱不存在: " + key);
        }
        if ("DESTROYED".equals(sandbox.getStatus())) {
            throw new IllegalStateException("沙箱已销毁: " + key);
        }
        final Long sandboxId = sandbox.getId();

        // 1) 杀该沙箱全部存活执行：优雅退出，5 秒后强杀
        for (Map.Entry<Long, LiveExec> entry : liveExecs.entrySet()) {
            if (entry.getValue().sandboxId() == sandboxId) {
                Process p = entry.getValue().process();
                p.destroy();
                try {
                    if (!p.waitFor(5, TimeUnit.SECONDS)) {
                        p.destroyForcibly();
                    }
                } catch (InterruptedException e) {
                    Thread.currentThread().interrupt();
                    p.destroyForcibly();
                }
            }
        }

        // 2) 该沙箱 RUNNING 执行记录批量置 FAILED
        for (SandboxExecutionEntity exec : execRepo.findBySandboxIdAndStatus(sandboxId, "RUNNING")) {
            exec.setStatus("FAILED");
            exec.setFinishedAt(LocalDateTime.now());
            if (exec.getStartedAt() != null) {
                exec.setDurationMs(Duration.between(exec.getStartedAt(), exec.getFinishedAt()).toMillis());
            }
            exec.setOutput((exec.getOutput() == null ? "" : exec.getOutput()) + "\n[沙箱已销毁]");
            execRepo.save(exec);
        }

        // 3) 移除容器（DOCKER）+ 删工作目录（尽力而为）
        if ("DOCKER".equals(sandbox.getMode())) {
            dockerExecutor.destroyContainer(sandbox);
        }
        localExecutor.cleanupWorkdir(sandbox);

        // 4) 置 DESTROYED
        sandbox.setStatus("DESTROYED");
        sandboxRepo.save(sandbox);
        log.info("沙箱已销毁: id={}, name={}", sandboxId, sandbox.getName());
    }

    // ========== 命令执行 ==========

    /**
     * 在沙箱内异步执行命令：落执行记录（RUNNING）→ 事务提交后投递执行池，立即返回。
     */
    @Transactional
    public SandboxExecutionEntity execCommand(Long sandboxId, String command, Integer timeoutSeconds) {
        SandboxEntity sandbox = getSandbox(sandboxId);
        if (!"RUNNING".equals(sandbox.getStatus())) {
            throw new IllegalArgumentException("沙箱不可用（状态 " + sandbox.getStatus() + "），无法执行命令");
        }
        if (command == null || command.isBlank()) {
            throw new IllegalArgumentException("命令不能为空");
        }

        int timeout = timeoutSeconds != null && timeoutSeconds > 0
                ? timeoutSeconds : sandbox.getTimeoutSeconds();

        SandboxExecutionEntity exec = new SandboxExecutionEntity();
        exec.setSandboxId(sandboxId);
        exec.setSeqNo((int) execRepo.countBySandboxId(sandboxId) + 1);
        exec.setCommand(command);
        exec.setStatus("RUNNING");
        exec.setStartedAt(LocalDateTime.now());
        exec.setCreatedBy(currentUsername());
        exec = execRepo.save(exec);

        // 事务提交后再投递执行器，确保 worker 能读到执行记录行
        final Long executionId = exec.getId();
        if (TransactionSynchronizationManager.isSynchronizationActive()) {
            TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
                @Override
                public void afterCommit() {
                    submit(executionId, timeout);
                }
            });
        } else {
            submit(executionId, timeout);
        }
        return exec;
    }

    /** 投递到执行池；队列满直接拒绝并置失败 */
    private void submit(Long executionId, int timeoutSeconds) {
        try {
            pool.execute(() -> runExecution(executionId, timeoutSeconds));
        } catch (RejectedExecutionException e) {
            log.warn("沙箱执行器繁忙，执行 {} 被拒绝", executionId);
            markExecutionTerminal(executionId, "FAILED", "执行器繁忙，请稍后重试", -1);
        }
    }

    /** worker：启动进程 → 捕获输出 → 超时控制 → 终态回写 → 审计。非事务，每次落库独立短事务 */
    private void runExecution(Long executionId, int timeoutSeconds) {
        SandboxExecutionEntity exec = execRepo.findById(executionId).orElse(null);
        if (exec == null) {
            log.warn("执行记录不存在，跳过: {}", executionId);
            return;
        }
        SandboxEntity sandbox = sandboxRepo.findById(exec.getSandboxId()).orElse(null);
        if (sandbox == null || !"RUNNING".equals(sandbox.getStatus())) {
            markExecutionTerminal(executionId, "FAILED", "沙箱不存在或已销毁", -1);
            writeAudit(exec, "FAILED", 0L);
            return;
        }

        long startMs = System.currentTimeMillis();
        Process process;
        try {
            process = "DOCKER".equals(sandbox.getMode())
                    ? dockerExecutor.start(sandbox, exec.getCommand())
                    : localExecutor.start(sandbox, exec.getCommand());
        } catch (IOException e) {
            log.warn("沙箱 {} 启动进程失败: {}", sandbox.getId(), e.getMessage());
            long duration = System.currentTimeMillis() - startMs;
            markExecutionTerminal(executionId, "FAILED", "启动进程失败: " + e.getMessage(), duration);
            writeAudit(exec, "FAILED", duration);
            return;
        }

        liveExecs.put(executionId, new LiveExec(sandbox.getId(), process));
        // 输出按字节缓存、收尾统一解码：Windows 下不同命令的输出编码混杂
        //（cmd echo 走 OEM 代码页 GBK，ping 等系统工具重定向时输出 UTF-8），
        // 固定单一字符集必有一类乱码，故先严格试 UTF-8、失败回退平台默认字符集
        java.io.ByteArrayOutputStream raw = new java.io.ByteArrayOutputStream();
        final int maxOutputBytes = maxOutputChars * 3;
        final boolean[] truncated = {false};
        try {
            Thread reader = new Thread(() -> {
                try {
                    java.io.InputStream in = process.getInputStream();
                    byte[] buf = new byte[4096];
                    int n;
                    while ((n = in.read(buf)) != -1) {
                        synchronized (raw) {
                            int room = maxOutputBytes - raw.size();
                            if (room > 0) {
                                raw.write(buf, 0, Math.min(n, room));
                            }
                            if (n > room) {
                                truncated[0] = true;
                            }
                        }
                    }
                } catch (IOException ignored) {
                    // 进程结束时流关闭，忽略
                }
            }, "sandbox-output-" + executionId);
            reader.setDaemon(true);
            reader.start();

            boolean finished = process.waitFor(timeoutSeconds, TimeUnit.SECONDS);
            if (!finished) {
                process.destroy();
                if (!process.waitFor(5, TimeUnit.SECONDS)) {
                    process.destroyForcibly();
                }
            }
            reader.join(3000);

            String status;
            Integer exitCode = null;
            if (!finished) {
                status = "TIMEOUT";
            } else {
                exitCode = process.exitValue();
                status = exitCode == 0 ? "SUCCESS" : "FAILED";
            }

            long duration = System.currentTimeMillis() - startMs;
            String out;
            synchronized (raw) {
                out = decodeOutput(raw.toByteArray());
            }
            if (truncated[0]) {
                out = out + "\n...(输出超长已截断)";
            }
            if ("TIMEOUT".equals(status)) {
                out = out + "\n[执行超时（限制 " + timeoutSeconds + " 秒），进程已强制终止]";
            }

            // 终态回写前复查沙箱状态：与销毁并发时以销毁为准
            SandboxEntity recheck = sandboxRepo.findById(sandbox.getId()).orElse(null);
            if (recheck == null || "DESTROYED".equals(recheck.getStatus())) {
                status = "FAILED";
                out = out + "\n[沙箱已销毁]";
            }

            exec = execRepo.findById(executionId).orElse(exec);
            exec.setStatus(status);
            exec.setExitCode(exitCode);
            exec.setOutput(out);
            exec.setDurationMs(duration);
            exec.setFinishedAt(LocalDateTime.now());
            execRepo.save(exec);
            log.info("沙箱执行完成: executionId={}, sandboxId={}, status={}, exitCode={}, durationMs={}",
                    executionId, sandbox.getId(), status, exitCode, duration);

            writeAudit(exec, status, duration);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            process.destroyForcibly();
            markExecutionTerminal(executionId, "FAILED", "执行被中断", System.currentTimeMillis() - startMs);
        } finally {
            liveExecs.remove(executionId);
        }
    }

    /** 终态回写（拒绝/异常路径用）：追加说明到 output */
    private void markExecutionTerminal(Long executionId, String status, String note, long durationMs) {
        execRepo.findById(executionId).ifPresent(exec -> {
            exec.setStatus(status);
            exec.setExitCode(null);
            exec.setOutput((exec.getOutput() == null ? "" : exec.getOutput()) + "\n[" + note + "]");
            exec.setDurationMs(durationMs >= 0 ? durationMs : null);
            exec.setFinishedAt(LocalDateTime.now());
            execRepo.save(exec);
        });
    }

    /** 审计写入：首个真实生产者；失败仅记日志，不影响执行主流程 */
    private void writeAudit(SandboxExecutionEntity exec, String status, long latencyMs) {
        try {
            AuditTaskExecutionEntity audit = new AuditTaskExecutionEntity();
            audit.setTaskType("SANDBOX");
            audit.setStatus(status);
            audit.setLatencyMs(latencyMs);
            audit.setUsername(exec.getCreatedBy());
            SandboxEntity sandbox = sandboxRepo.findById(exec.getSandboxId()).orElse(null);
            if (sandbox != null) {
                audit.setProjectId(sandbox.getTaskId());
            }
            auditRepo.save(audit);
        } catch (Exception e) {
            log.warn("沙箱执行审计写入失败: executionId={}, {}", exec.getId(), e.getMessage());
        }
    }

    // ========== 执行记录查询 ==========

    /** 执行历史（不含 output 大字段，command 截 200 字预览，避免轮询拉全量） */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> listExecutions(Long sandboxId) {
        getSandbox(sandboxId);
        List<Map<String, Object>> result = new ArrayList<>();
        for (SandboxExecutionEntity exec : execRepo.findBySandboxIdOrderBySeqNoDesc(sandboxId)) {
            Map<String, Object> item = new LinkedHashMap<>();
            item.put("id", exec.getId());
            item.put("sandboxId", exec.getSandboxId());
            item.put("seqNo", exec.getSeqNo());
            String cmd = exec.getCommand() == null ? "" : exec.getCommand();
            item.put("commandPreview", cmd.length() > 200 ? cmd.substring(0, 200) + "..." : cmd);
            item.put("status", exec.getStatus());
            item.put("exitCode", exec.getExitCode());
            item.put("durationMs", exec.getDurationMs());
            item.put("startedAt", exec.getStartedAt());
            item.put("finishedAt", exec.getFinishedAt());
            item.put("createdBy", exec.getCreatedBy());
            result.add(item);
        }
        return result;
    }

    /** 执行详情（全量含 output） */
    @Transactional(readOnly = true)
    public SandboxExecutionEntity getExecution(Long executionId) {
        return execRepo.findById(executionId)
                .orElseThrow(() -> new NoSuchElementException("执行记录不存在: " + executionId));
    }

    // ========== 启动自愈 ==========

    @PostConstruct
    public void initRuntimeSwitches() {
        this.effectiveSandboxEnabled = sandboxEnabled;
    }

    /**
     * 后端重启对账：进程句柄随 JVM 消失，残留 RUNNING 执行置失败；
     * 创建中断的 CREATING 沙箱置销毁。RUNNING 沙箱保留（环境=目录，重启后仍有效）。
     */
    @PostConstruct
    public void reconcileOnStartup() {
        try {
            int fixedExecs = 0;
            for (SandboxExecutionEntity exec : execRepo.findByStatus("RUNNING")) {
                exec.setStatus("FAILED");
                exec.setFinishedAt(LocalDateTime.now());
                if (exec.getStartedAt() != null) {
                    exec.setDurationMs(Duration.between(exec.getStartedAt(), exec.getFinishedAt()).toMillis());
                }
                exec.setOutput((exec.getOutput() == null ? "" : exec.getOutput()) + "\n[后端重启，执行状态丢失]");
                execRepo.save(exec);
                fixedExecs++;
            }
            int fixedSandboxes = 0;
            for (SandboxEntity sandbox : sandboxRepo.findByStatus("CREATING")) {
                sandbox.setStatus("DESTROYED");
                sandboxRepo.save(sandbox);
                fixedSandboxes++;
            }
            if (fixedExecs > 0 || fixedSandboxes > 0) {
                log.info("沙箱启动对账: 修复 {} 条残留执行、{} 个中断创建的沙箱", fixedExecs, fixedSandboxes);
            }
        } catch (Exception e) {
            log.warn("沙箱启动对账失败（不影响启动）: {}", e.getMessage());
        }
    }

    // ========== 运行时开关 ==========

    /**
     * 生效的启用状态：取内存态开关（初始化来自 application.yml 的 racc.sandbox.enabled，
     * 运行时可经 /api/sandbox/config 切换，重启后回退 yml）。
     */
    public boolean isEffectivelyEnabled() {
        return effectiveSandboxEnabled;
    }

    /** 开关来源：application.yml（静态）+ 内存运行时覆盖 */
    private String enabledSource() {
        return "application.yml";
    }

    /** 设置运行时开关（内存态，即时生效，重启后回退 application.yml） */
    @Transactional
    public void setRuntimeEnabled(boolean enabled) {
        this.effectiveSandboxEnabled = enabled;
        log.info("沙箱运行时开关已更新（内存态）: enabled={}", enabled);
    }

    /** 设置 Docker 引擎运行时开关（委托执行器） */
    @Transactional
    public void setDockerRuntimeEnabled(boolean enabled) {
        dockerExecutor.setRuntimeEnabled(enabled);
    }

    // ========== 内部辅助 ==========

    /**
     * 输出字节解码：先严格试 UTF-8（ping 等系统工具重定向时的输出），
     * 失败回退平台默认字符集（Windows cmd echo 的 GBK/OEM 输出），两类命令均不乱码。
     */
    private String decodeOutput(byte[] bytes) {
        java.nio.charset.CharsetDecoder utf8 = java.nio.charset.StandardCharsets.UTF_8.newDecoder()
                .onMalformedInput(java.nio.charset.CodingErrorAction.REPORT)
                .onUnmappableCharacter(java.nio.charset.CodingErrorAction.REPORT);
        try {
            return utf8.decode(java.nio.ByteBuffer.wrap(bytes)).toString();
        } catch (java.nio.charset.CharacterCodingException e) {
            return new String(bytes, Charset.defaultCharset());
        }
    }

    private String currentUsername() {
        Object principal = SecurityContextHolder.getContext().getAuthentication() != null
                ? SecurityContextHolder.getContext().getAuthentication().getPrincipal()
                : null;
        return principal instanceof String ? (String) principal : "anonymous";
    }
}
