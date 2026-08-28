package com.racc.knowledge.service;

import com.racc.knowledge.entity.KnowledgeDocumentEntity;
import com.racc.knowledge.repository.KnowledgeDocumentRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;

/**
 * 代码扫描服务。
 * 扫描指定目录中的 .md / .java / .xml / .json / .yml 文件，导入知识库。
 */
@Service
@Transactional
public class ScanService {

    /** 支持扫描的文件扩展名（小写） */
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(".md", ".java", ".xml", ".json", ".yml", ".yaml");

    private final KnowledgeDocumentRepository repository;

    public ScanService(KnowledgeDocumentRepository repository) {
        this.repository = repository;
    }

    /**
     * 预览扫描：列出目录中所有可导入的文件信息。
     */
    @Transactional(readOnly = true)
    public Map<String, Object> previewScan(String directory) {
        Path dir = resolveDirectory(directory);
        List<Map<String, Object>> files = new ArrayList<>();

        try (Stream<Path> stream = Files.walk(dir, 20)) {
            stream.filter(Files::isRegularFile)
                  .filter(p -> isAllowedExtension(p))
                  .forEach(p -> {
                      try {
                          Map<String, Object> fileInfo = new LinkedHashMap<>();
                          fileInfo.put("path", dir.relativize(p).toString().replace("\\", "/"));
                          fileInfo.put("size", Files.size(p));
                          String name = p.getFileName().toString();
                          int dot = name.lastIndexOf('.');
                          fileInfo.put("extension", dot >= 0 ? name.substring(dot) : "");
                          files.add(fileInfo);
                      } catch (IOException ignored) {
                          // skip
                      }
                  });
        } catch (IOException e) {
            throw new RuntimeException("扫描目录失败: " + directory, e);
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("files", files);
        return result;
    }

    /**
     * 执行扫描：将目录中可导入文件内容读入知识库。
     */
    public Map<String, Object> executeScan(String directory, String category) {
        Path dir = resolveDirectory(directory);
        List<String> errors = new ArrayList<>();
        List<Long> documentIds = new ArrayList<>();
        int totalFiles = 0;
        int importedFiles = 0;
        int skippedFiles = 0;

        try (Stream<Path> stream = Files.walk(dir, 20)) {
            List<Path> files = stream.filter(Files::isRegularFile)
                                     .filter(p -> isAllowedExtension(p))
                                     .collect(Collectors.toList());
            totalFiles = files.size();

            for (Path file : files) {
                try {
                    String content = Files.readString(file, StandardCharsets.UTF_8);
                    if (content.isBlank()) {
                        skippedFiles++;
                        continue;
                    }

                    String fileName = file.getFileName().toString();
                    String relativePath = dir.relativize(file).toString().replace("\\", "/");
                    // 标题：取相对路径（不含扩展名）
                    String title = relativePath;
                    int dot = title.lastIndexOf('.');
                    if (dot > 0) title = title.substring(0, dot);

                    // 自动推断 sourceType
                    String ext = fileName.contains(".") ? fileName.substring(fileName.lastIndexOf('.')).toLowerCase() : "";

                    KnowledgeDocumentEntity entity = new KnowledgeDocumentEntity();
                    entity.setTitle(title);
                    entity.setContent(content);
                    entity.setContentPreview(content.length() > 200 ? content.substring(0, 200) + "..." : content);
                    entity.setCategory(category);
                    entity.setSourceType("scan");
                    entity.setFileName(relativePath);
                    entity.setTags(ext.replace(".", ""));
                    entity.setCreatedAt(LocalDateTime.now());
                    entity.setUpdatedAt(LocalDateTime.now());

                    entity = repository.save(entity);
                    documentIds.add(entity.getId());
                    importedFiles++;
                } catch (IOException e) {
                    errors.add("读取失败: " + file.toString() + " - " + e.getMessage());
                    skippedFiles++;
                }
            }
        } catch (IOException e) {
            throw new RuntimeException("扫描目录失败: " + directory, e);
        }

        // 重建 FTS 索引
        try {
            reindexFts();
        } catch (Exception ignored) {
            // FTS 重建失败不影响主流程
        }

        Map<String, Object> result = new LinkedHashMap<>();
        result.put("totalFiles", totalFiles);
        result.put("importedFiles", importedFiles);
        result.put("skippedFiles", skippedFiles);
        result.put("errors", errors);
        result.put("documentIds", documentIds);
        return result;
    }

    // ==================== 内部方法 ====================

    private boolean isAllowedExtension(Path path) {
        String name = path.getFileName().toString().toLowerCase();
        for (String ext : ALLOWED_EXTENSIONS) {
            if (name.endsWith(ext)) return true;
        }
        return false;
    }

    private Path resolveDirectory(String directory) {
        if (directory == null || directory.isBlank()) {
            throw new IllegalArgumentException("扫描目录不能为空");
        }
        Path dir = Paths.get(directory).normalize();
        if (!Files.isDirectory(dir)) {
            throw new IllegalArgumentException("目录不存在或不可读: " + directory);
        }
        return dir;
    }

    private void reindexFts() {
        // MySQL FULLTEXT 索引随数据写入自动维护，无需手工重建（原 SQLite FTS5 影子表逻辑已移除）
    }
}