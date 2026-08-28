package com.racc.skill.service;

import com.racc.skill.dto.*;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.*;
import java.nio.charset.StandardCharsets;
import java.nio.file.*;
import java.nio.file.attribute.BasicFileAttributes;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * 技能管理服务
 *
 * 技能文件存储在 ${racc.skills.dir}/{name}/ 目录下
 *   - skill.md              : 主文档（含 YAML frontmatter）
 *   - .disabled             : 存在表示禁用
 *   - .copy-enabled         : 存在表示允许复制
 */
@Service
public class SkillService {

    private static final Logger log = LoggerFactory.getLogger(SkillService.class);

    private final Path skillsBaseDir;

    public SkillService(@Value("${racc.skills.dir}") String skillsDir) {
        this.skillsBaseDir = Paths.get(skillsDir).normalize();
        try {
            Files.createDirectories(this.skillsBaseDir);
        } catch (IOException e) {
            throw new RuntimeException("无法创建技能存储目录: " + skillsDir, e);
        }
    }

    // ==================== 列表 ====================

    public List<SkillSummary> listSkills() {
        File[] dirs = skillsBaseDir.toFile().listFiles(File::isDirectory);
        if (dirs == null) return Collections.emptyList();

        return Arrays.stream(dirs)
                .map(this::buildSummary)
                .sorted(Comparator.comparing(SkillSummary::getName))
                .collect(Collectors.toList());
    }

    // ==================== 详情 ====================

    public SkillDetail getSkillDetail(String name) {
        Path skillDir = resolveSkillDir(name);
        if (!Files.exists(skillDir)) {
            throw new NoSuchElementException("技能不存在: " + name);
        }

        SkillDetail detail = new SkillDetail();
        detail.setName(name);
        detail.setDirectory(skillDir.toString());

        // 读取主文档（兼容 skill.md / SKILL.md 命名）
        Path mainFile = resolveMainDoc(skillDir);
        if (mainFile != null) {
            try {
                String content = Files.readString(mainFile, StandardCharsets.UTF_8);
                detail.setContent(content);
                detail.setFrontmatter(parseFrontmatter(content));
            } catch (IOException e) {
                log.warn("读取主文档失败: {}", e.getMessage());
            }
        }

        // 构建文件树
        detail.setFileTree(buildFileTree(skillDir, ""));

        return detail;
    }

    // ==================== 创建 ====================

    public Map<String, String> createSkill(String name) {
        Path skillDir = resolveSkillDir(name);
        if (Files.exists(skillDir)) {
            throw new IllegalArgumentException("技能已存在: " + name);
        }
        try {
            Files.createDirectories(skillDir);
            // 创建默认 skill.md
            String defaultContent = "---\n" +
                    "name: " + name + "\n" +
                    "description: \"\"\n" +
                    "version: \"0.1.0\"\n" +
                    "---\n\n# " + name + "\n\n";
            Files.writeString(skillDir.resolve("skill.md"), defaultContent, StandardCharsets.UTF_8);
            return Map.of("name", name, "directory", skillDir.toString());
        } catch (IOException e) {
            throw new RuntimeException("创建技能失败: " + name, e);
        }
    }

    // ==================== 删除 ====================

    public void deleteSkill(String name) {
        Path skillDir = resolveSkillDir(name);
        if (!Files.exists(skillDir)) {
            throw new NoSuchElementException("技能不存在: " + name);
        }
        try {
            deleteDirectory(skillDir);
        } catch (IOException e) {
            throw new RuntimeException("删除技能失败: " + name, e);
        }
    }

    // ==================== Git Pull ====================

    public Map<String, Object> pullSkill(String name) {
        Path skillDir = resolveSkillDir(name);
        if (!Files.exists(skillDir)) {
            throw new NoSuchElementException("技能不存在: " + name);
        }
        // 执行 git pull
        try {
            ProcessBuilder pb = new ProcessBuilder("git", "pull")
                    .directory(skillDir.toFile())
                    .redirectErrorStream(true);
            Process process = pb.start();
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
            int exitCode = process.waitFor();
            return Map.of("output", output, "success", exitCode == 0);
        } catch (Exception e) {
            return Map.of("output", e.getMessage(), "success", false);
        }
    }

    // ==================== Git 信息 ====================

    public GitInfo getGitInfo(String name) {
        Path skillDir = resolveSkillDir(name);
        if (!Files.exists(skillDir)) {
            throw new NoSuchElementException("技能不存在: " + name);
        }
        GitInfo info = new GitInfo();
        info.setLastCommit(execGit(skillDir, "log", "--oneline", "-1"));
        info.setRemoteUrl(execGit(skillDir, "config", "--get", "remote.origin.url"));
        info.setBranch(execGit(skillDir, "rev-parse", "--abbrev-ref", "HEAD"));
        return info;
    }

    // ==================== 开关控制 ====================

    public void toggleSkill(String name, String action) {
        Path skillDir = resolveSkillDir(name);
        if (!Files.exists(skillDir)) {
            throw new NoSuchElementException("技能不存在: " + name);
        }
        try {
            switch (action) {
                case "disable" -> Files.createFile(skillDir.resolve(".disabled"));
                case "enable" -> Files.deleteIfExists(skillDir.resolve(".disabled"));
                case "enable-copy" -> Files.createFile(skillDir.resolve(".copy-enabled"));
                case "disable-copy" -> Files.deleteIfExists(skillDir.resolve(".copy-enabled"));
                default -> throw new IllegalArgumentException("不支持的操作: " + action);
            }
        } catch (IOException e) {
            throw new RuntimeException("切换技能状态失败: " + name, e);
        }
    }

    // ==================== 文件读写 ====================

    public SkillFileContent readFile(String name, String filePath) {
        Path skillDir = resolveSkillDir(name);
        if (!Files.exists(skillDir)) {
            throw new NoSuchElementException("技能不存在: " + name);
        }
        Path fullPath = resolvePath(skillDir, filePath);
        if (!Files.exists(fullPath) || Files.isDirectory(fullPath)) {
            throw new NoSuchElementException("文件不存在: " + filePath);
        }
        try {
            return new SkillFileContent(filePath, Files.readString(fullPath, StandardCharsets.UTF_8));
        } catch (IOException e) {
            throw new RuntimeException("读取文件失败: " + filePath, e);
        }
    }

    public void writeFile(String name, String filePath, String content) {
        Path skillDir = resolveSkillDir(name);
        if (!Files.exists(skillDir)) {
            throw new NoSuchElementException("技能不存在: " + name);
        }
        Path fullPath = resolvePath(skillDir, filePath);
        try {
            Files.createDirectories(fullPath.getParent());
            Files.writeString(fullPath, content, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("写入文件失败: " + filePath, e);
        }
    }

    public void deleteFile(String name, String filePath) {
        Path skillDir = resolveSkillDir(name);
        if (!Files.exists(skillDir)) {
            throw new NoSuchElementException("技能不存在: " + name);
        }
        Path fullPath = resolvePath(skillDir, filePath);
        try {
            Files.deleteIfExists(fullPath);
        } catch (IOException e) {
            throw new RuntimeException("删除文件失败: " + filePath, e);
        }
    }

    // ==================== 克隆 ====================

    public Map<String, String> cloneSkill(String gitUrl, String name, String branch) {
        String skillName = (name != null && !name.isBlank()) ? name : deriveNameFromUrl(gitUrl);
        Path skillDir = resolveSkillDir(skillName);
        if (Files.exists(skillDir)) {
            throw new IllegalArgumentException("技能已存在: " + skillName);
        }
        try {
            List<String> cmd = new ArrayList<>(List.of("git", "clone", gitUrl, skillDir.toString()));
            if (branch != null && !branch.isBlank()) {
                cmd.add("--branch");
                cmd.add(branch);
            }
            ProcessBuilder pb = new ProcessBuilder(cmd)
                    .redirectErrorStream(true);
            Process process = pb.start();
            int exitCode = process.waitFor();
            if (exitCode != 0) {
                String err = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8);
                // 清理可能残留的目录
                deleteDirectory(skillDir);
                throw new RuntimeException("克隆失败: " + err);
            }
            return Map.of("name", skillName, "directory", skillDir.toString());
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException("克隆被中断", e);
        } catch (IOException e) {
            throw new RuntimeException("克隆失败", e);
        }
    }

    // ==================== 上传 ====================

    public Map<String, String> uploadSkill(String name, MultipartFile file) {
        String skillName = (name != null && !name.isBlank()) ? name : deriveNameFromFilename(file.getOriginalFilename());
        Path skillDir = resolveSkillDir(skillName);
        if (Files.exists(skillDir)) {
            throw new IllegalArgumentException("技能已存在: " + skillName);
        }
        try {
            // 保存到临时文件后解压
            Path tempFile = Files.createTempFile("skill-upload-", ".zip");
            file.transferTo(tempFile.toFile());

            // 解压到技能目录
            unzip(tempFile, skillDir);

            // 处理 Zip 包含顶层目录的情况：如果 skillDir 下只有一个子目录且其中包含 SKILL.md，则提升内容
            normalizeSkillDir(skillDir);

            // 验证解压后是否包含 SKILL.md 或 skill.md
            if (!hasMainDoc(skillDir)) {
                // 清理已解压的文件
                deleteDirectory(skillDir);
                throw new IllegalArgumentException("上传的 Zip 文件中未找到 SKILL.md 或 skill.md，请确保 Zip 根目录包含主文档");
            }

            Files.deleteIfExists(tempFile);
            return Map.of("name", skillName, "directory", skillDir.toString());
        } catch (IllegalArgumentException e) {
            throw e;
        } catch (IOException e) {
            throw new RuntimeException("上传技能失败", e);
        }
    }

    // ==================== 内部 Helper ====================

    private SkillSummary buildSummary(File dir) {
        SkillSummary summary = new SkillSummary();
        summary.setName(dir.getName());
        summary.setDirectory(dir.getAbsolutePath());

        // 读取 frontmatter 获取描述和版本（兼容 skill.md / SKILL.md 命名）
        Path mainFile = resolveMainDoc(dir.toPath());
        if (mainFile != null) {
            try {
                String content = Files.readString(mainFile, StandardCharsets.UTF_8);
                Map<String, Object> fm = parseFrontmatter(content);
                summary.setDescription(fm.getOrDefault("description", "").toString());
                summary.setVersion(fm.getOrDefault("version", "").toString());
            } catch (IOException e) {
                // ignore
            }
        }

        // 标记文件
        summary.setDisabled(Files.exists(dir.toPath().resolve(".disabled")));
        summary.setCopyEnabled(Files.exists(dir.toPath().resolve(".copy-enabled")));

        // Git 信息
        summary.setCommitId(execGit(dir.toPath(), "log", "--oneline", "-1"));

        // 文件计数
        File[] files = dir.listFiles(f -> f.isFile() && !f.getName().startsWith("."));
        summary.setStageCount(files != null ? files.length : 0);
        summary.setReferenceCount(0); // 引用计数，后续可扩展

        return summary;
    }

    private Path resolveSkillDir(String name) {
        // 防止路径穿越
        String normalized = name.replace("\\", "/").replace("/", "").replace("..", "");
        if (normalized.isEmpty()) {
            throw new IllegalArgumentException("非法的技能名称");
        }
        return skillsBaseDir.resolve(normalized).normalize();
    }

    /**
     * 解析技能主文档：优先 skill.md，回退到 SKILL.md（大小写兼容，便于导入 WorkBuddy 等 SKILL.md 命名的技能）。
     */
    private Path resolveMainDoc(Path skillDir) {
        Path lower = skillDir.resolve("skill.md");
        if (Files.exists(lower)) return lower;
        Path upper = skillDir.resolve("SKILL.md");
        if (Files.exists(upper)) return upper;
        return null;
    }

    private Path resolvePath(Path skillDir, String filePath) {
        String normalized = filePath.replace("\\", "/");
        if (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        Path resolved = skillDir.resolve(normalized).normalize();
        if (!resolved.startsWith(skillDir)) {
            throw new IllegalArgumentException("非法的文件路径: " + filePath);
        }
        return resolved;
    }

    private List<SkillFileTreeNode> buildFileTree(Path dir, String relativePath) {
        File[] files = dir.toFile().listFiles();
        if (files == null) return Collections.emptyList();

        List<SkillFileTreeNode> nodes = new ArrayList<>();
        Arrays.sort(files, (a, b) -> {
            if (a.isDirectory() != b.isDirectory()) {
                return a.isDirectory() ? -1 : 1;
            }
            return a.getName().compareToIgnoreCase(b.getName());
        });

        for (File f : files) {
            // 跳过隐藏文件
            if (f.getName().startsWith(".")) continue;

            String childPath = relativePath.isEmpty() ? f.getName() : relativePath + "/" + f.getName();
            if (f.isDirectory()) {
                List<SkillFileTreeNode> children = buildFileTree(f.toPath(), childPath);
                nodes.add(new SkillFileTreeNode(f.getName(), "directory", childPath, children));
            } else {
                nodes.add(new SkillFileTreeNode(f.getName(), "file", childPath, null));
            }
        }
        return nodes;
    }

    /**
     * 解析 YAML frontmatter（简单实现，不引入 snakeyaml 依赖）
     */
    @SuppressWarnings("unchecked")
    private Map<String, Object> parseFrontmatter(String content) {
        Map<String, Object> result = new LinkedHashMap<>();
        if (content == null || !content.startsWith("---")) {
            return result;
        }
        int end = content.indexOf("---", 3);
        if (end < 0) return result;

        String frontmatter = content.substring(3, end).trim();
        for (String line : frontmatter.split("\n")) {
            line = line.trim();
            if (line.isEmpty()) continue;
            int colonIdx = line.indexOf(':');
            if (colonIdx > 0) {
                String key = line.substring(0, colonIdx).trim();
                String value = line.substring(colonIdx + 1).trim();
                // 去除引号
                if (value.startsWith("\"") && value.endsWith("\"")) {
                    value = value.substring(1, value.length() - 1);
                }
                result.put(key, value);
            }
        }
        return result;
    }

    private String execGit(Path dir, String... args) {
        try {
            List<String> cmd = new ArrayList<>(List.of("git"));
            cmd.addAll(Arrays.asList(args));
            ProcessBuilder pb = new ProcessBuilder(cmd)
                    .directory(dir.toFile())
                    .redirectErrorStream(true);
            Process process = pb.start();
            String output = new String(process.getInputStream().readAllBytes(), StandardCharsets.UTF_8).trim();
            int exitCode = process.waitFor();
            return exitCode == 0 ? output : null;
        } catch (Exception e) {
            return null;
        }
    }

    private void deleteDirectory(Path dir) throws IOException {
        if (Files.exists(dir)) {
            Files.walkFileTree(dir, new SimpleFileVisitor<>() {
                @Override
                public FileVisitResult visitFile(Path file, BasicFileAttributes attrs) throws IOException {
                    Files.delete(file);
                    return FileVisitResult.CONTINUE;
                }
                @Override
                public FileVisitResult postVisitDirectory(Path dir, IOException exc) throws IOException {
                    Files.delete(dir);
                    return FileVisitResult.CONTINUE;
                }
            });
        }
    }

    /**
     * 处理 Zip 包含顶层目录的情况。
     * 如果 skillDir 下只有一个子目录且其中包含 SKILL.md/skill.md，则将该子目录内容提升到 skillDir 根目录。
     */
    private void normalizeSkillDir(Path skillDir) throws IOException {
        if (!Files.isDirectory(skillDir)) return;
        // 已有主文档，无需调整
        if (hasMainDoc(skillDir)) return;

        File[] entries = skillDir.toFile().listFiles();
        if (entries == null || entries.length == 0) return;

        // 查找包含 SKILL.md 的子目录
        for (File entry : entries) {
            if (entry.isDirectory()) {
                Path subDir = entry.toPath();
                if (hasMainDoc(subDir)) {
                    // 提升子目录内容到 skillDir
                    try (Stream<Path> files = Files.list(subDir)) {
                        for (Path f : (Iterable<Path>) files::iterator) {
                            Path target = skillDir.resolve(f.getFileName());
                            Files.move(f, target, StandardCopyOption.REPLACE_EXISTING);
                        }
                    }
                    // 删除空的子目录
                    Files.deleteIfExists(subDir);
                    return;
                }
            }
        }
    }

    /**
     * 检查技能目录中是否存在主文档（SKILL.md 或 skill.md）
     */
    private boolean hasMainDoc(Path skillDir) {
        return Files.exists(skillDir.resolve("SKILL.md")) || Files.exists(skillDir.resolve("skill.md"));
    }

    private void unzip(Path zipFile, Path targetDir) throws IOException {
        try (java.util.zip.ZipInputStream zis = new java.util.zip.ZipInputStream(
                new BufferedInputStream(Files.newInputStream(zipFile)))) {
            java.util.zip.ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                Path resolved = targetDir.resolve(entry.getName()).normalize();
                if (!resolved.startsWith(targetDir)) {
                    throw new IOException("非法的 zip 条目: " + entry.getName());
                }
                if (entry.isDirectory()) {
                    Files.createDirectories(resolved);
                } else {
                    Files.createDirectories(resolved.getParent());
                    Files.copy(zis, resolved, StandardCopyOption.REPLACE_EXISTING);
                }
                zis.closeEntry();
            }
        }
    }

    private String deriveNameFromUrl(String gitUrl) {
        // Extract repo name from git URL: e.g., "https://github.com/user/repo.git" -> "repo"
        String url = gitUrl.replace('\\', '/');
        if (url.endsWith(".git")) {
            url = url.substring(0, url.length() - 4);
        }
        int lastSlash = url.lastIndexOf('/');
        return lastSlash >= 0 ? url.substring(lastSlash + 1) : url;
    }

    private String deriveNameFromFilename(String filename) {
        if (filename == null) return "untitled";
        if (filename.toLowerCase().endsWith(".zip")) {
            filename = filename.substring(0, filename.length() - 4);
        }
        return filename;
    }
}