package com.racc.sandbox;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import jakarta.annotation.PostConstruct;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.util.List;
import java.util.concurrent.TimeUnit;

/**
 * Docker 沙箱执行器（预留引擎）。
 *
 * 配置开启（racc.sandbox.docker.enabled=true）且本机 docker CLI 可用且镜像存在时才启用；
 * 任一条件不满足，SandboxService 自动降级为本地进程沙箱（对齐平台"有则用、无则降级"家法）。
 *
 * 容器生命周期全部经 docker CLI 驱动（不引入 docker-java 依赖），容器约束：
 * --memory / --cpus 资源限制、--network none 禁止外网、--read-only 只读根文件系统、
 * 沙箱工作目录挂载到 /work 作为唯一可写区。
 *
 * 注意：本机无 Docker 时此路径仅验证"检测→报告不可用→降级"，容器命令未在真机验证。
 */
@Component
public class DockerSandboxExecutor {

    private static final Logger log = LoggerFactory.getLogger(DockerSandboxExecutor.class);

    /** 探测结果缓存时长（docker info 较慢，/status 轮询不能每次都跑） */
    private static final long PROBE_CACHE_MS = 5 * 60 * 1000L;

    @Value("${racc.sandbox.docker.enabled:false}")
    private boolean dockerEnabled;

    /** 运行时开关有效值：初始化来自 application.yml，运行时可切换（内存态） */
    private volatile boolean effectiveDockerEnabled = false;

    @Value("${racc.sandbox.docker.image:agentos-sandbox:latest}")
    private String image;

    @Value("${racc.sandbox.docker.memory:512m}")
    private String memory;

    @Value("${racc.sandbox.docker.cpus:1}")
    private String cpus;

    private volatile long probeAt = 0L;
    private volatile boolean probeDockerOk = false;
    private volatile boolean probeImageOk = false;

    @PostConstruct
    public void initRuntimeSwitch() {
        this.effectiveDockerEnabled = dockerEnabled;
    }

    // ========== 运行时开关 ==========

    /**
     * 生效的 Docker 引擎开关：取内存态开关（初始化来自 application.yml 的 racc.sandbox.docker.enabled，
     * 运行时可切换，重启后回退 yml）。
     */
    public boolean isDockerEffectivelyEnabled() {
        return effectiveDockerEnabled;
    }

    /** 开关来源：application.yml（静态）+ 内存运行时覆盖 */
    public String enabledSource() {
        return "application.yml";
    }

    /** 设置运行时开关（内存态，立即失效探测缓存，重启后回退 application.yml） */
    @Transactional
    public void setRuntimeEnabled(boolean enabled) {
        this.effectiveDockerEnabled = enabled;
        invalidateProbe();
        log.info("沙箱 Docker 引擎运行时开关已更新（内存态）: enabled={}", enabled);
    }

    /** 失效探测缓存（切换开关后立即重新探测） */
    public void invalidateProbe() {
        probeAt = 0L;
    }

    // ========== 能力探测 ==========

    /** 配置生效开启 且 docker info 成功 且 镜像存在（探测结果缓存 5 分钟） */
    public boolean available() {
        if (!isDockerEffectivelyEnabled()) {
            return false;
        }
        ensureProbed();
        return probeDockerOk && probeImageOk;
    }

    public boolean imagePresent() {
        if (!isDockerEffectivelyEnabled()) {
            return false;
        }
        ensureProbed();
        return probeImageOk;
    }

    /** 双重检查探测：docker info + 镜像存在性，结果缓存 */
    private void ensureProbed() {
        long now = System.currentTimeMillis();
        if (now - probeAt < PROBE_CACHE_MS) {
            return;
        }
        synchronized (this) {
            if (System.currentTimeMillis() - probeAt < PROBE_CACHE_MS) {
                return;
            }
            probeDockerOk = runCli(List.of("docker", "info"), 10) == 0;
            probeImageOk = probeDockerOk && runCli(List.of("docker", "image", "inspect", image), 10) == 0;
            probeAt = System.currentTimeMillis();
        }
    }

    /** 兼容旧调用名：返回生效的 Docker 引擎开关 */
    public boolean isDockerEnabled() { return isDockerEffectivelyEnabled(); }
    public String getImage() { return image; }
    public String getMemory() { return memory; }
    public String getCpus() { return cpus; }

    // ========== 容器生命周期 ==========

    /** 创建并启动容器（工作目录挂载到 /work；-v 挂载必须用绝对路径） */
    public void create(SandboxEntity sandbox) {
        String name = containerName(sandbox);
        String hostDir = java.nio.file.Paths.get(sandbox.getWorkdir())
                .toAbsolutePath().normalize().toString();
        int rc = runCli(List.of("docker", "create",
                "--name", name,
                "--memory", memory,
                "--cpus", cpus,
                "--network", "none",
                "--read-only",
                "-v", hostDir + ":/work:rw",
                "-w", "/work",
                image,
                "sleep", "infinity"), 30);
        if (rc != 0) {
            throw new RuntimeException("docker create 失败（退出码 " + rc + "），镜像: " + image);
        }
        rc = runCli(List.of("docker", "start", name), 30);
        if (rc != 0) {
            runCli(List.of("docker", "rm", "-f", name), 10);
            throw new RuntimeException("docker start 失败（退出码 " + rc + "）");
        }
    }

    /** 在容器内执行命令（不等待结束，调用方负责注册/超时/收尾） */
    public Process start(SandboxEntity sandbox, String command) throws IOException {
        ProcessBuilder pb = new ProcessBuilder(
                "docker", "exec", containerName(sandbox), "sh", "-c", command);
        pb.redirectErrorStream(true);
        return pb.start();
    }

    /** 强制删除容器（尽力而为，失败仅记日志） */
    public void destroyContainer(SandboxEntity sandbox) {
        int rc = runCli(List.of("docker", "rm", "-f", containerName(sandbox)), 15);
        if (rc != 0) {
            log.warn("docker rm -f 退出码 {}（容器 {} 可能已不存在）", rc, containerName(sandbox));
        }
    }

    // ========== 内部辅助 ==========

    private String containerName(SandboxEntity sandbox) {
        return "racc-sandbox-" + sandbox.getId();
    }

    /** 跑一条 docker 命令，返回退出码；超时/异常返回 -1 */
    private int runCli(List<String> cmd, long timeoutSeconds) {
        try {
            Process p = new ProcessBuilder(cmd).redirectErrorStream(true).start();
            // 抽干输出防管道阻塞
            Thread drainer = new Thread(() -> {
                try {
                    p.getInputStream().transferTo(java.io.OutputStream.nullOutputStream());
                } catch (IOException ignored) {
                    // 进程结束时流关闭，忽略
                }
            }, "docker-cli-drain");
            drainer.setDaemon(true);
            drainer.start();
            if (!p.waitFor(timeoutSeconds, TimeUnit.SECONDS)) {
                p.destroyForcibly();
                log.warn("docker 命令超时 {}s: {}", timeoutSeconds, String.join(" ", cmd));
                return -1;
            }
            return p.exitValue();
        } catch (IOException e) {
            log.warn("docker 命令执行失败: {} ({})", String.join(" ", cmd), e.getMessage());
            return -1;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            return -1;
        }
    }
}
