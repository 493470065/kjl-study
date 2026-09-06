package com.racc.common;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.boot.CommandLineRunner;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.DirectoryStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.LinkedHashMap;
import java.util.Map;

/**
 * 启动自检：打印所有文件型数据目录的"解析后绝对路径"及内容计数。
 *
 * 背景：data-dir 曾是相对路径 ../data，依赖后端进程 cwd——从不同目录启动 jar 会导致
 * skills/uploads 等数据"凭空消失"（实际是找错目录）。data-dir 已改为绝对路径，
 * 本自检确保任何残留的路径配置问题在启动日志中一眼可见，而不是用户点开页面才发现。
 */
@Component
@Order(100)
public class StartupSelfCheck implements CommandLineRunner {

    private static final Logger log = LoggerFactory.getLogger(StartupSelfCheck.class);

    @Value("${racc.data-dir}")
    private String dataDir;

    @Value("${racc.skills.dir}")
    private String skillsDir;

    @Override
    public void run(String... args) {
        Path data = Paths.get(dataDir).normalize().toAbsolutePath();
        Path skills = Paths.get(skillsDir).normalize().toAbsolutePath();

        Map<String, Path> dirs = new LinkedHashMap<>();
        dirs.put("data-dir", data);
        dirs.put("skills", skills);
        dirs.put("uploads", data.resolve("uploads"));
        dirs.put("mcp", data.resolve("mcp"));
        dirs.put("pipeline", data.resolve("pipeline"));
        dirs.put("sandbox", data.resolve("sandbox"));

        log.info("==============================================================");
        log.info("[自检] 文件型数据目录解析结果（cwd = {}）：", System.getProperty("user.dir"));
        for (Map.Entry<String, Path> e : dirs.entrySet()) {
            Path p = e.getValue();
            String status;
            if (!Files.isDirectory(p)) {
                status = "目录不存在（首次使用时会自动创建，属正常）";
            } else {
                status = countChildren(p) + " 个子项";
            }
            log.info("[自检]   {} = {}  →  {}", e.getKey(), p, status);
        }

        // skills 是本次事故的核心数据源，单独强调
        long skillCount = countChildren(skills);
        if (skillCount == 0) {
            log.warn("[自检] ⚠ 技能目录为空：{} —— 如页面 Skill 列表为空，优先核对 racc.data-dir / racc.skills.dir 是否解析到正确位置", skills);
        } else {
            log.info("[自检] ✔ 技能目录正常：{} 个技能", skillCount);
        }
        log.info("==============================================================");
    }

    /** 统计目录下的直接子项数（含文件与子目录） */
    private long countChildren(Path dir) {
        try (DirectoryStream<Path> ds = Files.newDirectoryStream(dir)) {
            long n = 0;
            for (Path ignored : ds) n++;
            return n;
        } catch (IOException e) {
            return -1;
        }
    }
}
