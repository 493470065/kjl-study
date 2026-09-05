package com.racc.skill.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.racc.skill.dto.SkillExecRequest;
import com.racc.skill.dto.SkillExecResult;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.*;
import java.util.concurrent.TimeUnit;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * 技能执行服务：运行技能目录内的脚本并返回输出
 *
 * 执行约定：
 *   - 入口解析优先级：请求 entry → SKILL.md frontmatter 的 entry: 字段 → scripts/ 自动探测
 *     （自动探测优先 run/main/index.*，否则 scripts 下唯一脚本；多个候选时报错并列出）
 *   - 运行时按扩展名选择：.js/.mjs/.cjs → node，.py/.pyw → python，
 *     .ps1 → powershell，.cmd/.bat → cmd /c，.sh → sh；运行时路径可在 racc.skills.exec 配置
 *   - 参数：请求 args 为 JSON 数组时逐项作为 CLI 参数；对象参数不进 CLI（Windows 命令行解析会剥掉
 *     双引号导致 JSON 损坏），仅通过环境变量 SKILL_ARGS_JSON 传递，脚本从该变量读取完整 JSON
 *   - 安全：脚本路径必须位于技能目录内、扩展名白名单；技能被 .disabled 禁用时拒绝执行
 *   - 输出：stdout/stderr 各截断至 2MB；stdout 可解析为 JSON（对象/数组）时填充 data 字段
 */
@Service
public class SkillExecService {

    private static final Logger log = LoggerFactory.getLogger(SkillExecService.class);

    private static final Set<String> ALLOWED_EXT =
            Set.of("js", "mjs", "cjs", "py", "pyw", "ps1", "cmd", "bat", "sh");
    private static final String[] AUTO_DETECT_NAMES = {"run", "main", "index"};
    private static final int OUTPUT_LIMIT = 2 * 1024 * 1024;

    private final Path skillsBaseDir;
    private final ObjectMapper objectMapper = new ObjectMapper();

    private final String nodePath;
    private final String pythonPath;
    private final long defaultTimeoutMs;

    public SkillExecService(
            @Value("${racc.skills.dir}") String skillsDir,
            @Value("${racc.skills.exec.node:node}") String nodePath,
            @Value("${racc.skills.exec.python:python}") String pythonPath,
            @Value("${racc.skills.exec.timeout-ms:120000}") long defaultTimeoutMs) {
        this.skillsBaseDir = Paths.get(skillsDir).normalize();
        this.nodePath = nodePath;
        this.pythonPath = pythonPath;
        this.defaultTimeoutMs = defaultTimeoutMs;
    }

    /** 执行技能脚本 */
    public SkillExecResult exec(String name, SkillExecRequest req) throws Exception {
        SkillExecRequest request = req != null ? req : new SkillExecRequest();

        Path skillDir = resolveSkillDir(name);
        if (!Files.isDirectory(skillDir)) {
            throw new NoSuchElementException("技能不存在: " + name);
        }
        if (Files.exists(skillDir.resolve(".disabled"))) {
            throw new IllegalStateException("技能已禁用: " + name);
        }

        EntryResolution er = resolveEntry(skillDir, request.getEntry());

        List<String> command = buildCommand(er.path);
        command.addAll(buildArgs(request.getArgs()));

        long timeoutMs = request.getTimeoutMs() != null && request.getTimeoutMs() > 0
                ? request.getTimeoutMs() : defaultTimeoutMs;

        SkillExecResult result = new SkillExecResult();
        result.setEntry(er.relPath);
        result.setDetectedEntries(er.candidates);

        log.info("执行技能: name={}, entry={}, timeout={}ms", name, er.relPath, timeoutMs);
        long begin = System.currentTimeMillis();
        Process proc;
        try {
            ProcessBuilder pb = new ProcessBuilder(command);
            pb.directory(skillDir.toFile());
            pb.environment().put("SKILL_NAME", name);
            pb.environment().put("SKILL_ARGS_JSON", request.getArgs() == null ? "" : objectMapper.writeValueAsString(request.getArgs()));
            proc = pb.start();
        } catch (Exception e) {
            result.setSuccess(false);
            result.setStderr("无法启动脚本进程: " + e.getMessage());
            result.setDurationMs(System.currentTimeMillis() - begin);
            return result;
        }

        StringBuilder out = new StringBuilder();
        StringBuilder err = new StringBuilder();
        Thread tOut = drain(proc, out, true);
        Thread tErr = drain(proc, err, false);

        boolean finished = proc.waitFor(timeoutMs, TimeUnit.MILLISECONDS);
        tOut.join(2000);
        tErr.join(2000);

        result.setDurationMs(System.currentTimeMillis() - begin);
        if (!finished) {
            proc.descendants().forEach(ProcessHandle::destroyForcibly);
            proc.destroyForcibly();
            result.setTimedOut(true);
            result.setSuccess(false);
            result.setExitCode(null);
            result.setStdout(cap(out.toString()));
            result.setStderr(cap("执行超时（" + timeoutMs + "ms），已终止进程。\n" + err));
            return result;
        }

        result.setExitCode(proc.exitValue());
        result.setSuccess(proc.exitValue() == 0);
        result.setStdout(cap(out.toString()));
        result.setStderr(cap(err.toString()));
        result.setData(tryParseJson(result.getStdout()));

        log.info("技能执行完成: name={}, exit={}, duration={}ms, success={}",
                name, result.getExitCode(), result.getDurationMs(), result.isSuccess());
        return result;
    }

    // ==================== 入口解析 ====================

    private static class EntryResolution {
        Path path;                 // 绝对路径
        String relPath;            // 相对技能目录路径（返回给前端）
        List<String> candidates;   // 自动探测时发现的候选脚本
    }

    private EntryResolution resolveEntry(Path skillDir, String entryParam) throws Exception {
        EntryResolution er = new EntryResolution();
        er.candidates = Collections.emptyList();

        if (entryParam != null && !entryParam.isBlank()) {
            Path p = resolveWithin(skillDir, entryParam);
            if (!Files.isRegularFile(p)) {
                throw new IllegalArgumentException("入口脚本不存在: " + entryParam);
            }
            checkExtension(p);
            er.path = p;
            er.relPath = skillDir.relativize(p).toString().replace('\\', '/');
            return er;
        }

        // frontmatter entry: 字段
        String fmEntry = readFrontmatterEntry(skillDir);
        if (fmEntry != null && !fmEntry.isBlank()) {
            Path p = resolveWithin(skillDir, fmEntry);
            if (Files.isRegularFile(p)) {
                checkExtension(p);
                er.path = p;
                er.relPath = skillDir.relativize(p).toString().replace('\\', '/');
                return er;
            }
        }

        // scripts/ 自动探测
        Path scripts = skillDir.resolve("scripts");
        List<Path> scriptsList = new ArrayList<>();
        if (Files.isDirectory(scripts)) {
            try (Stream<Path> s = Files.list(scripts)) {
                scriptsList = s.filter(Files::isRegularFile)
                        .filter(p -> ALLOWED_EXT.contains(ext(p)))
                        .sorted()
                        .collect(Collectors.toList());
            }
        }
        if (scriptsList.isEmpty()) {
            throw new IllegalArgumentException("未指定入口且 scripts/ 下无可执行脚本（支持 " + ALLOWED_EXT + "）");
        }
        for (String base : AUTO_DETECT_NAMES) {
            for (Path p : scriptsList) {
                String fn = p.getFileName().toString().toLowerCase(Locale.ROOT);
                if (fn.startsWith(base + ".")) {
                    er.path = p;
                    er.relPath = skillDir.relativize(p).toString().replace('\\', '/');
                    return er;
                }
            }
        }
        if (scriptsList.size() == 1) {
            er.path = scriptsList.get(0);
            er.relPath = skillDir.relativize(er.path).toString().replace('\\', '/');
            return er;
        }
        er.candidates = scriptsList.stream()
                .map(p -> "scripts/" + p.getFileName())
                .collect(Collectors.toList());
        throw new IllegalArgumentException("scripts/ 下有多个候选脚本且无 run/main/index 入口，请在请求中指定 entry，候选: " + er.candidates);
    }

    private void checkExtension(Path p) {
        if (!ALLOWED_EXT.contains(ext(p))) {
            throw new IllegalArgumentException("不支持的脚本类型: " + p.getFileName() + "（允许 " + ALLOWED_EXT + "）");
        }
    }

    // ==================== 命令构建 ====================

    private List<String> buildCommand(Path script) {
        String e = ext(script);
        List<String> cmd = new ArrayList<>();
        switch (e) {
            case "js", "mjs", "cjs" -> cmd.add(nodePath);
            case "py", "pyw" -> cmd.add(pythonPath);
            case "ps1" -> { cmd.add("powershell"); cmd.add("-NoProfile"); cmd.add("-ExecutionPolicy"); cmd.add("Bypass"); cmd.add("-File"); }
            case "cmd", "bat" -> { cmd.add("cmd"); cmd.add("/c"); }
            case "sh" -> cmd.add("sh");
            default -> throw new IllegalArgumentException("不支持的脚本类型: " + e);
        }
        cmd.add(script.toAbsolutePath().toString());
        return cmd;
    }

    /** args 为 JSON 数组 → 逐项作为 CLI 参数；对象参数不进 CLI（Windows 会剥掉双引号），只走 SKILL_ARGS_JSON 环境变量 */
    private List<String> buildArgs(Object args) throws Exception {
        List<String> list = new ArrayList<>();
        if (args == null) return list;
        if (args instanceof List<?> l) {
            for (Object o : l) list.add(o == null ? "" : String.valueOf(o));
        } else if (args instanceof String s) {
            String t = s.trim();
            if (t.startsWith("[") && t.endsWith("]")) {
                return buildArgs(objectMapper.readValue(t, List.class));
            }
            if (!t.isEmpty()) list.add(t);
        }
        return list;
    }

    // ==================== 工具方法 ====================

    private Path resolveSkillDir(String name) {
        String normalized = name.replace("\\", "/").replace("/", "").replace("..", "");
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("非法的技能名称");
        }
        return skillsBaseDir.resolve(normalized).normalize();
    }

    /** 在技能目录内解析相对路径，防穿越 */
    private Path resolveWithin(Path skillDir, String rel) {
        String cleaned = rel.replace('\\', '/');
        while (cleaned.startsWith("/")) cleaned = cleaned.substring(1);
        Path p = skillDir.resolve(cleaned).normalize();
        if (!p.startsWith(skillDir)) {
            throw new IllegalArgumentException("入口脚本必须位于技能目录内");
        }
        return p;
    }

    private String readFrontmatterEntry(Path skillDir) {
        for (String doc : List.of("SKILL.md", "skill.md")) {
            Path p = skillDir.resolve(doc);
            if (!Files.isRegularFile(p)) continue;
            try {
                List<String> lines = Files.readAllLines(p, StandardCharsets.UTF_8);
                if (!lines.isEmpty() && lines.get(0).trim().equals("---")) {
                    for (int i = 1; i < lines.size(); i++) {
                        String line = lines.get(i).trim();
                        if (line.equals("---")) break;
                        if (line.startsWith("entry:")) {
                            String v = line.substring("entry:".length()).trim();
                            if (v.length() >= 2 && ((v.startsWith("\"") && v.endsWith("\"")) || (v.startsWith("'") && v.endsWith("'")))) {
                                v = v.substring(1, v.length() - 1);
                            }
                            return v;
                        }
                    }
                }
            } catch (Exception ignored) { }
        }
        return null;
    }

    private Thread drain(Process proc, StringBuilder sink, boolean stdout) {
        Thread t = new Thread(() -> {
            try (BufferedReader r = new BufferedReader(new InputStreamReader(
                    stdout ? proc.getInputStream() : proc.getErrorStream(), StandardCharsets.UTF_8))) {
                char[] buf = new char[8192];
                int n;
                while ((n = r.read(buf)) != -1) {
                    if (sink.length() < OUTPUT_LIMIT + 8192) sink.append(buf, 0, n);
                }
            } catch (Exception ignored) { }
        });
        t.setDaemon(true);
        t.start();
        return t;
    }

    private String cap(String s) {
        return s != null && s.length() > OUTPUT_LIMIT
                ? s.substring(0, OUTPUT_LIMIT) + "\n…[输出已截断]"
                : s;
    }

    /** stdout 尝试解析为 JSON：直接解析，失败则从首个 { 或 [ 起尝试 */
    private Object tryParseJson(String stdout) {
        if (stdout == null || stdout.isBlank()) return null;
        String t = stdout.trim();
        for (String candidate : candidates(t)) {
            try {
                return objectMapper.readValue(candidate, Object.class);
            } catch (Exception ignored) { }
        }
        return null;
    }

    private List<String> candidates(String t) {
        List<String> list = new ArrayList<>();
        list.add(t);
        int i1 = indexOfAny(t, '{', '[');
        if (i1 > 0) list.add(t.substring(i1));
        int i2 = t.lastIndexOf('}');
        int i3 = t.lastIndexOf(']');
        int last = Math.max(i2, i3);
        if (i1 >= 0 && last > i1) list.add(t.substring(i1, last + 1));
        return list;
    }

    private int indexOfAny(String s, char a, char b) {
        int i = s.indexOf(a);
        int j = s.indexOf(b);
        if (i < 0) return j;
        if (j < 0) return i;
        return Math.min(i, j);
    }

    private String ext(Path p) {
        String fn = p.getFileName().toString();
        int i = fn.lastIndexOf('.');
        return i < 0 ? "" : fn.substring(i + 1).toLowerCase(Locale.ROOT);
    }
}
