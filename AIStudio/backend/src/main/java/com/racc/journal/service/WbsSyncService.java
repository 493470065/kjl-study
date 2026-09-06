package com.racc.journal.service;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * 多语专项 WBS 同步服务：调用本机 kdocs-cli 读取金山文档
 * 「多语专项各条线任务跟踪表 - 公共技术中心WBS (每周填报)」，
 * 解析为一/二级里程碑列表（与前端甘特图数据模型一致）。
 *
 * 前置：本机已安装 kdocs-cli 且已完成授权（kdocs-cli auth login）。
 */
@Service
public class WbsSyncService {

    private static final Logger log = LoggerFactory.getLogger(WbsSyncService.class);

    private static final String FILE_ID = "2kufAWKJVrMNAWqL7wY4rxwQLgC3dTWku";
    private static final int SHEET_ID = 1;
    private static final int ROW_FROM = 2;   // 0=填写规范 1=标题 2=表头
    private static final int ROW_TO = 350;
    private static final int COL_TO = 12;
    private static final int CHUNK = 70;

    /** 阶段映射：按一级任务序号 */
    private static final Map<Integer, String> PHASE_MAP = Map.of(
            10, "需求合并", 6, "回归验证", 8, "回归验证", 9, "回归验证",
            11, "回归验证", 12, "回归验证", 13, "随版发布", 7, "上线支持");

    private static final Pattern P_ISO = Pattern.compile("(\\d{4})[/\\-](\\d{1,2})[/\\-](\\d{1,2})");
    private static final Pattern P_CN = Pattern.compile("(\\d{1,2})月(\\d{1,2})日");
    private static final Pattern P_NUM = Pattern.compile("(\\d+)");

    private final ObjectMapper om = new ObjectMapper();

    /** 解析 kdocs-cli 可执行文件路径 */
    private String resolveCli() {
        String env = System.getenv("KDOCS_CLI");
        if (env != null && !env.isBlank()) return env;
        String localAppData = System.getenv("LOCALAPPDATA");
        if (localAppData != null) {
            java.io.File f = new java.io.File(localAppData, "kdocs-cli/kdocs-cli.exe");
            if (f.exists()) return f.getAbsolutePath();
        }
        for (String dir : System.getenv("PATH").split(";")) {
            java.io.File f = new java.io.File(dir.trim(), "kdocs-cli.exe");
            if (f.exists()) return f.getAbsolutePath();
            java.io.File f2 = new java.io.File(dir.trim(), "kdocs-cli");
            if (f2.exists()) return f2.getAbsolutePath();
        }
        return "kdocs-cli";
    }

    /** 调用 CLI 读取一段区域，返回 (row,col)->text 网格 */
    private Map<Long, String> fetchChunk(int rowFrom, int rowTo) throws Exception {
        Map<String, Object> range = new LinkedHashMap<>();
        range.put("rowFrom", rowFrom);
        range.put("rowTo", rowTo);
        range.put("colFrom", 0);
        range.put("colTo", COL_TO);
        Map<String, Object> params = new LinkedHashMap<>();
        params.put("file_id", FILE_ID);
        params.put("sheetId", SHEET_ID);
        params.put("range", range);

        ProcessBuilder pb = new ProcessBuilder(resolveCli(), "sheet", "get-range-data",
                om.writeValueAsString(params), "--silent");
        pb.redirectErrorStream(false);
        Process proc = pb.start();
        StringBuilder out = new StringBuilder();
        StringBuilder err = new StringBuilder();
        Thread t1 = new Thread(() -> read(proc, out));
        Thread t2 = new Thread(() -> readErr(proc, err));
        t1.start(); t2.start();
        if (!proc.waitFor(120, java.util.concurrent.TimeUnit.SECONDS)) {
            proc.destroyForcibly();
            throw new IllegalStateException("kdocs-cli 调用超时（rows " + rowFrom + "-" + rowTo + "）");
        }
        t1.join(5000); t2.join(5000);
        int code = proc.exitValue();
        if (code != 0 || out.isEmpty()) {
            String e = err.toString();
            throw new IllegalStateException("kdocs-cli 调用失败(exit=" + code + ")：" + snippet(out + " " + e));
        }
        JsonNode root = om.readTree(out.toString());
        // 显式错误码（如 400006 鉴权失败）
        if (root.path("code").asInt(0) != 0) {
            throw new IllegalStateException(root.path("code").asInt() == 400006
                    ? "金山文档 Token 已失效，请在本机执行 kdocs-cli auth login 重新授权"
                    : "kdocs-cli 返回错误码 " + root.path("code").asInt() + "：" + snippet(out.toString()));
        }
        JsonNode cells = root.path("detail").path("rangeData");
        // 请求区域完全超出表格实际范围时 CLI 返回 rangeData:null，视为空区域
        if (cells.isMissingNode() || cells.isNull()) return Collections.emptyMap();
        if (!cells.isArray()) {
            throw new IllegalStateException("kdocs-cli 返回异常：" + snippet(out.toString()));
        }
        Map<Long, String> grid = new HashMap<>();
        for (JsonNode c : cells) {
            String text = c.path("cellText").asText("").trim();
            int rf = c.path("rowFrom").asInt(), rt = c.path("rowTo").asInt();
            int cf = c.path("colFrom").asInt(), ct = c.path("colTo").asInt();
            for (int r = rf; r <= rt; r++) {
                for (int col = cf; col <= ct; col++) {
                    boolean origin = (r == rf && col == cf);
                    grid.put((long) r * 100 + col, origin ? text : "");
                }
            }
        }
        return grid;
    }

    private void read(Process p, StringBuilder sb) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getInputStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line).append('\n');
        } catch (Exception ignore) { }
    }
    private void readErr(Process p, StringBuilder sb) {
        try (BufferedReader br = new BufferedReader(new InputStreamReader(p.getErrorStream(), StandardCharsets.UTF_8))) {
            String line;
            while ((line = br.readLine()) != null) sb.append(line).append('\n');
        } catch (Exception ignore) { }
    }
    private String snippet(String s) {
        s = s == null ? "" : s.replaceAll("\\s+", " ");
        return s.length() > 200 ? s.substring(0, 200) + "…" : s;
    }

    private String cell(Map<Long, String> g, int row, int col) {
        String v = g.get((long) row * 100 + col);
        return v == null ? "" : v.trim();
    }

    /** 日期归一：2026/7/27、2026-7-27、8月5日 → yyyy-MM-dd；无法解析返回 "" */
    private String parseDate(String s) {
        if (s == null) return "";
        s = s.trim();
        Matcher m = P_ISO.matcher(s);
        if (m.find()) return String.format("%04d-%02d-%02d", Integer.parseInt(m.group(1)),
                Integer.parseInt(m.group(2)), Integer.parseInt(m.group(3)));
        m = P_CN.matcher(s);
        if (m.find()) return String.format("2026-%02d-%02d", Integer.parseInt(m.group(1)), Integer.parseInt(m.group(2)));
        return "";
    }

    private String phaseOf(int top) {
        return PHASE_MAP.getOrDefault(top, "前期准备");
    }

    /** 拉取并解析全部 WBS 里程碑（一级+二级） */
    public List<Map<String, Object>> syncMilestones() throws Exception {
        Map<Long, String> grid = new HashMap<>();
        for (int start = ROW_FROM; start <= ROW_TO; start += CHUNK) {
            int end = Math.min(start + CHUNK - 1, ROW_TO);
            grid.putAll(fetchChunk(start, end));
        }

        String today = LocalDate.now().format(DateTimeFormatter.ISO_LOCAL_DATE);
        List<Map<String, Object>> result = new ArrayList<>();
        Set<String> usedIds = new HashSet<>();
        String curPhase = "";

        for (int r = ROW_FROM; r <= ROW_TO; r++) {
            String levelCell = cell(grid, r, 0);
            if (levelCell.equals("1")) curPhase = ""; // 重置，下面重算
            if (!levelCell.equals("1") && !levelCell.equals("2")) continue;
            String no = cell(grid, r, 1);
            String name = clean(cell(grid, r, 2));
            if (no.isEmpty() || name.isEmpty()) continue;
            String owner = clean(cell(grid, r, 3));
            String st = cell(grid, r, 4);
            String prog = cell(grid, r, 5);
            String ps = parseDate(cell(grid, r, 6));
            String pe = parseDate(cell(grid, r, 7));
            String note = clean(cell(grid, r, 8));

            int progress = 0;
            Matcher mn = P_NUM.matcher(prog);
            if (mn.find()) progress = Integer.parseInt(mn.group(1));

            String status;
            if (st.equals("完成") || progress >= 100) {
                status = "已完成";
                progress = Math.max(progress, 100);
            } else if (st.equals("进行中") || st.equals("未开始")) {
                status = st;
            } else if (!pe.isEmpty() && pe.compareTo(today) < 0) {
                status = "已延期";
            } else if (!ps.isEmpty() && ps.compareTo(today) <= 0) {
                status = "进行中";
            } else {
                status = "未开始";
            }

            int top;
            try { top = Integer.parseInt(no.split("\\.")[0]); } catch (Exception e) { top = 99; }
            boolean isL1 = levelCell.equals("1");
            String phase = isL1 ? phaseOf(top) : curPhase;
            if (isL1) curPhase = phase;

            String sid = "wbs-" + no.replace(".", "_");
            while (!usedIds.add(sid)) sid = sid + "x";

            Map<String, Object> ms = new LinkedHashMap<>();
            ms.put("id", sid);
            ms.put("name", isL1 ? no + " " + name : name);
            ms.put("phase", phase);
            ms.put("level", isL1 ? 1 : 2);
            ms.put("planStart", ps);
            ms.put("planEnd", pe);
            ms.put("status", status);
            ms.put("progress", progress);
            if (!owner.isEmpty()) ms.put("owner", owner);
            if (!note.isEmpty()) ms.put("note", note);
            result.add(ms);
        }
        log.info("WBS 同步完成：共 {} 条（一级+二级）", result.size());
        return result;
    }

    private String clean(String s) {
        return s == null ? "" : s.replace("\r", "").replace("\n", " ").trim();
    }
}
