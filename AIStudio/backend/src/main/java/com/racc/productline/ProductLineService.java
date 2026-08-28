package com.racc.productline;

import com.racc.common.dto.FileNode;
import com.racc.productline.entity.ProductLineEntity;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.File;
import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

/**
 * 产品线管理服务
 */
@Service
@Transactional
public class ProductLineService {

    private final ProductLineRepository repo;

    public ProductLineService(ProductLineRepository repo) {
        this.repo = repo;
    }

    // ==================== 产品线 CRUD ====================

    public List<ProductLineEntity> listProductLines(String search) {
        if (search != null && !search.isEmpty()) {
            return repo.search(search);
        }
        return repo.findAll();
    }

    public ProductLineEntity getProductLine(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("产品线不存在: " + id));
    }

    public ProductLineEntity createProductLine(ProductLineEntity entity) {
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        return repo.save(entity);
    }

    public ProductLineEntity updateProductLine(Long id, ProductLineEntity updates) {
        ProductLineEntity entity = getProductLine(id);
        if (updates.getName() != null) entity.setName(updates.getName());
        if (updates.getDisplayName() != null) entity.setDisplayName(updates.getDisplayName());
        if (updates.getDescription() != null) entity.setDescription(updates.getDescription());
        if (updates.getClaudeMd() != null) entity.setClaudeMd(updates.getClaudeMd());
        if (updates.getDocsPath() != null) entity.setDocsPath(updates.getDocsPath());
        entity.setUpdatedAt(LocalDateTime.now());
        return repo.save(entity);
    }

    public void deleteProductLine(Long id) {
        repo.deleteById(id);
    }

    // ==================== CLAUDE.md ====================

    public void saveClaudeMd(Long id, String claudeMd) {
        ProductLineEntity entity = getProductLine(id);
        entity.setClaudeMd(claudeMd);
        entity.setUpdatedAt(LocalDateTime.now());
        repo.save(entity);
    }

    // ==================== 文件操作 ====================

    public List<FileNode> getFileTree(Long id) {
        ProductLineEntity entity = getProductLine(id);
        String docsPath = entity.getDocsPath();
        if (docsPath == null || docsPath.isEmpty()) {
            return Collections.emptyList();
        }
        File base = new File(docsPath);
        if (!base.exists() || !base.isDirectory()) {
            return Collections.emptyList();
        }
        return buildFileTree(base, "");
    }

    public String readFile(Long id, String filePath) {
        ProductLineEntity entity = getProductLine(id);
        String docsPath = entity.getDocsPath();
        if (docsPath == null || docsPath.isEmpty()) {
            throw new NoSuchElementException("产品线未配置文档路径");
        }
        Path fullPath = resolvePath(docsPath, filePath);
        try {
            return Files.readString(fullPath, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("读取文件失败: " + filePath, e);
        }
    }

    public void writeFile(Long id, String filePath, String content) {
        ProductLineEntity entity = getProductLine(id);
        String docsPath = entity.getDocsPath();
        if (docsPath == null || docsPath.isEmpty()) {
            throw new NoSuchElementException("产品线未配置文档路径");
        }
        Path fullPath = resolvePath(docsPath, filePath);
        try {
            Files.createDirectories(fullPath.getParent());
            Files.writeString(fullPath, content, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("写入文件失败: " + filePath, e);
        }
    }

    // ==================== 预置数据 ====================

    /**
     * 预置病历片区核心产品线：住院病历 / 门诊病历 / 急诊病历。
     * 注意：分类（category，如 spec）是知识库文档维度的自由文本，不在本 seed 管理，
     * 由 knowledge_documents 实际数据驱动前端下拉。
     */
    public void seed() {
        if (repo.count() > 0) return;

        seedOne("inpatient-emr", "住院病历", "住院病历产品线，涵盖入院记录、病程记录、手术记录、出院小结等");
        seedOne("outpatient-emr", "门诊病历", "门诊病历产品线，涵盖门诊初诊、复诊、急诊门诊、专科门诊病历等");
        seedOne("emergency-emr", "急诊病历", "急诊病历产品线，涵盖急诊登记、急诊留观病历、抢救记录等");
    }

    private void seedOne(String name, String displayName, String description) {
        ProductLineEntity e = new ProductLineEntity();
        e.setName(name);
        e.setDisplayName(displayName);
        e.setDescription(description);
        e.setCreatedAt(LocalDateTime.now());
        e.setUpdatedAt(LocalDateTime.now());
        repo.save(e);
    }

    // ==================== helpers ====================

    private List<FileNode> buildFileTree(File dir, String relativePath) {
        File[] files = dir.listFiles();
        if (files == null) return Collections.emptyList();

        List<FileNode> nodes = new ArrayList<>();
        Arrays.sort(files, (a, b) -> {
            if (a.isDirectory() != b.isDirectory()) {
                return a.isDirectory() ? -1 : 1;
            }
            return a.getName().compareToIgnoreCase(b.getName());
        });

        for (File f : files) {
            String childPath = relativePath.isEmpty() ? f.getName() : relativePath + "/" + f.getName();
            if (f.isDirectory()) {
                List<FileNode> children = buildFileTree(f, childPath);
                nodes.add(new FileNode(childPath, f.getName(), 0, "directory", children));
            } else {
                nodes.add(new FileNode(childPath, f.getName(), f.length(), "file", null));
            }
        }
        return nodes;
    }

    private Path resolvePath(String basePath, String filePath) {
        String normalized = filePath.replace("\\", "/");
        if (normalized.startsWith("/")) {
            normalized = normalized.substring(1);
        }
        Path resolved = Paths.get(basePath, normalized).normalize();
        Path base = Paths.get(basePath).normalize();
        if (!resolved.startsWith(base)) {
            throw new IllegalArgumentException("非法的文件路径: " + filePath);
        }
        return resolved;
    }
}