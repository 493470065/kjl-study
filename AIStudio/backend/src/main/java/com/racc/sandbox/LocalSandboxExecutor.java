package com.racc.sandbox;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Component;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Comparator;
import java.util.List;
import java.util.stream.Stream;

/**
 * 本地进程沙箱执行器（真实引擎，无外部依赖）。
 *
 * 每个沙箱拥有独立工作目录（{racc.sandbox.dir}/{id}），命令经系统 shell 解释
 * （Windows: cmd.exe /c；POSIX: sh -c），在沙箱工作目录内启动子进程。
 *
 * 隔离边界说明：本地模式不做权限/网络隔离，子进程与后端同权限运行，
 * 隔离性来自"独立工作目录 + 超时强杀 + 输出留痕"，页面文案须如实说明。
 */
@Component
public class LocalSandboxExecutor {

    private static final Logger log = LoggerFactory.getLogger(LocalSandboxExecutor.class);

    private static final boolean WINDOWS =
            System.getProperty("os.name").toLowerCase().contains("win");

    /** 创建沙箱环境：建工作目录。失败抛 RuntimeException（事务回滚不留行） */
    public void create(SandboxEntity sandbox) {
        try {
            Files.createDirectories(Paths.get(sandbox.getWorkdir()));
        } catch (IOException e) {
            throw new RuntimeException("创建沙箱工作目录失败: " + e.getMessage(), e);
        }
    }

    /**
     * 在沙箱内启动一条命令的进程（不等待结束，调用方负责注册/超时/收尾）。
     * 命令串以单元素传给 shell，不做二次引号包裹（管道/&& 由 shell 解释）。
     */
    public Process start(SandboxEntity sandbox, String command) throws IOException {
        List<String> cmd = WINDOWS
                ? List.of("cmd.exe", "/c", command)
                : List.of("sh", "-c", command);
        ProcessBuilder pb = new ProcessBuilder(cmd);
        pb.directory(new File(sandbox.getWorkdir()));
        pb.redirectErrorStream(true);
        return pb.start();
    }

    /** 销毁：递归删除工作目录。尽力而为——文件被占用仅记日志不抛错（Windows 句柄释放有延迟） */
    public void cleanupWorkdir(SandboxEntity sandbox) {
        String wd = sandbox.getWorkdir();
        if (wd == null || wd.isBlank()) {
            return;
        }
        Path root = Paths.get(wd);
        if (!Files.exists(root)) {
            return;
        }
        try (Stream<Path> walk = Files.walk(root)) {
            walk.sorted(Comparator.reverseOrder()).forEach(p -> {
                try {
                    Files.delete(p);
                } catch (IOException e) {
                    log.warn("沙箱目录残留（删除失败，可人工清理）: {}", p);
                }
            });
        } catch (IOException e) {
            log.warn("清理沙箱工作目录失败: {}", wd, e);
        }
    }
}
