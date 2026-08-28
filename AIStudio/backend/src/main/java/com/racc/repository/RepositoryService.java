package com.racc.repository;

import com.racc.common.dto.FileNode;
import com.racc.repository.entity.CodeRepositoryEntity;
import com.racc.repository.entity.RepoModuleEntity;
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
import java.util.stream.Collectors;

/**
 * 仓库管理服务
 */
@Service
@Transactional
public class RepositoryService {

    private final CodeRepositoryRepository repo;
    private final RepoModuleRepository moduleRepo;

    public RepositoryService(CodeRepositoryRepository repo, RepoModuleRepository moduleRepo) {
        this.repo = repo;
        this.moduleRepo = moduleRepo;
    }

    // ==================== 仓库 CRUD ====================

    public List<CodeRepositoryEntity> listRepositories(String search, String tag) {
        List<CodeRepositoryEntity> list;
        if (search != null && !search.isEmpty()) {
            list = repo.search(search);
        } else {
            list = repo.findAll();
        }
        // 按 tag 过滤
        if (tag != null && !tag.isEmpty()) {
            list = list.stream()
                    .filter(r -> r.getBusinessTags() != null && r.getBusinessTags().contains(tag))
                    .collect(Collectors.toList());
        }
        return list;
    }

    public CodeRepositoryEntity getRepository(Long id) {
        return repo.findById(id)
                .orElseThrow(() -> new NoSuchElementException("仓库不存在: " + id));
    }

    public CodeRepositoryEntity createRepository(CodeRepositoryEntity entity) {
        entity.setCreatedAt(LocalDateTime.now());
        entity.setUpdatedAt(LocalDateTime.now());
        if (entity.getScanEnabled() == null) {
            entity.setScanEnabled(true);
        }
        return repo.save(entity);
    }

    public CodeRepositoryEntity updateRepository(Long id, CodeRepositoryEntity updates) {
        CodeRepositoryEntity entity = getRepository(id);
        if (updates.getName() != null) entity.setName(updates.getName());
        if (updates.getDisplayName() != null) entity.setDisplayName(updates.getDisplayName());
        if (updates.getTfsPath() != null) entity.setTfsPath(updates.getTfsPath());
        if (updates.getBranch() != null) entity.setBranch(updates.getBranch());
        if (updates.getBusinessTags() != null) entity.setBusinessTags(updates.getBusinessTags());
        if (updates.getProjectName() != null) entity.setProjectName(updates.getProjectName());
        if (updates.getRepoId() != null) entity.setRepoId(updates.getRepoId());
        if (updates.getOpsAppId() != null) entity.setOpsAppId(updates.getOpsAppId());
        if (updates.getProductLine() != null) entity.setProductLine(updates.getProductLine());
        if (updates.getProductLineId() != null) entity.setProductLineId(updates.getProductLineId());
        if (updates.getProductLineName() != null) entity.setProductLineName(updates.getProductLineName());
        if (updates.getProductLineIds() != null) entity.setProductLineIds(updates.getProductLineIds());
        if (updates.getProductLineNames() != null) entity.setProductLineNames(updates.getProductLineNames());
        if (updates.getDescription() != null) entity.setDescription(updates.getDescription());
        if (updates.getClaudeMd() != null) entity.setClaudeMd(updates.getClaudeMd());
        if (updates.getDocsPath() != null) entity.setDocsPath(updates.getDocsPath());
        if (updates.getScanEnabled() != null) entity.setScanEnabled(updates.getScanEnabled());
        if (updates.getLastScannedCommitId() != null) entity.setLastScannedCommitId(updates.getLastScannedCommitId());
        if (updates.getLastScannedAt() != null) entity.setLastScannedAt(updates.getLastScannedAt());
        entity.setUpdatedAt(LocalDateTime.now());
        return repo.save(entity);
    }

    public void deleteRepository(Long id) {
        moduleRepo.deleteByRepoId(id);
        repo.deleteById(id);
    }

    // ==================== 业务标记 ====================

    public List<String> getAllTags() {
        List<String> raw = repo.findAllBusinessTags();
        Set<String> tags = new LinkedHashSet<>();
        for (String s : raw) {
            if (s == null || s.isEmpty()) continue;
            for (String tag : s.split(",")) {
                String t = tag.trim();
                if (!t.isEmpty()) tags.add(t);
            }
        }
        return new ArrayList<>(tags);
    }

    // ==================== 子模块 ====================

    public List<RepoModuleEntity> getModules(Long repoId) {
        return moduleRepo.findByRepoId(repoId);
    }

    public List<RepoModuleEntity> saveModules(Long repoId, List<RepoModuleEntity> modules) {
        moduleRepo.deleteByRepoId(repoId);
        for (RepoModuleEntity m : modules) {
            m.setId(null);
            m.setRepoId(repoId);
            if (m.getEnabled() == null) {
                m.setEnabled(true);
            }
        }
        return moduleRepo.saveAll(modules);
    }

    public RepoModuleEntity toggleModule(Long moduleId) {
        RepoModuleEntity entity = moduleRepo.findById(moduleId)
                .orElseThrow(() -> new NoSuchElementException("子模块不存在: " + moduleId));
        entity.setEnabled(!Boolean.TRUE.equals(entity.getEnabled()));
        return moduleRepo.save(entity);
    }

    // ==================== CLAUDE.md ====================

    public void saveClaudeMd(Long id, String claudeMd) {
        CodeRepositoryEntity entity = getRepository(id);
        entity.setClaudeMd(claudeMd);
        entity.setUpdatedAt(LocalDateTime.now());
        repo.save(entity);
    }

    // ==================== 文件操作 ====================

    public List<FileNode> getFileTree(Long id) {
        CodeRepositoryEntity entity = getRepository(id);
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
        CodeRepositoryEntity entity = getRepository(id);
        String docsPath = entity.getDocsPath();
        if (docsPath == null || docsPath.isEmpty()) {
            throw new NoSuchElementException("仓库未配置文档路径");
        }
        Path fullPath = resolvePath(docsPath, filePath);
        try {
            return Files.readString(fullPath, StandardCharsets.UTF_8);
        } catch (IOException e) {
            throw new RuntimeException("读取文件失败: " + filePath, e);
        }
    }

    public void writeFile(Long id, String filePath, String content) {
        CodeRepositoryEntity entity = getRepository(id);
        String docsPath = entity.getDocsPath();
        if (docsPath == null || docsPath.isEmpty()) {
            throw new NoSuchElementException("仓库未配置文档路径");
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

    public void seed() {
        if (repo.count() > 0) return;

        CodeRepositoryEntity r1 = new CodeRepositoryEntity();
        r1.setName("sr-next");
        r1.setDisplayName("护理文书（sr-next）");
        r1.setTfsPath("$/WiNEX-6.0/Code/01 WiNEX 医护站/03 护理文书/sr-next");
        r1.setBranch("main");
        r1.setBusinessTags("护理,文书,winnext");
        r1.setProjectName("护理文书");
        r1.setScanEnabled(true);
        r1.setCreatedAt(LocalDateTime.now());
        r1.setUpdatedAt(LocalDateTime.now());
        repo.save(r1);

        CodeRepositoryEntity r2 = new CodeRepositoryEntity();
        r2.setName("emr-next");
        r2.setDisplayName("住院病历（emr-next）");
        r2.setTfsPath("$/WiNEX-6.0/Code/01 WiNEX 医护站/02 住院病历/emr-next");
        r2.setBranch("develop");
        r2.setBusinessTags("住院,病历,emr");
        r2.setProjectName("住院病历");
        r2.setScanEnabled(true);
        r2.setCreatedAt(LocalDateTime.now());
        r2.setUpdatedAt(LocalDateTime.now());
        repo.save(r2);
    }

    // ==================== helpers ====================

    private List<FileNode> buildFileTree(File dir, String relativePath) {
        File[] files = dir.listFiles();
        if (files == null) return Collections.emptyList();

        List<FileNode> nodes = new ArrayList<>();
        // 目录在前，文件在后
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
        // 防止路径穿越
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