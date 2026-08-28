import java.sql.*;
import java.util.*;

/**
 * 一次性迁移工具：SQLite (racc.db) → MySQL (racc)。
 *
 * 前置条件：
 * 1. MySQL 中 racc 库的表结构已由后端首次启动（Hibernate ddl-auto: update）创建；
 * 2. 迁移前后后端服务停止，避免并发写入。
 *
 * 行为：
 * - 遍历 sqlite_master 中所有用户表（跳过 sqlite_* 与 knowledge_fts* 全文索引影子表）；
 * - 逐表 TRUNCATE 后按 MySQL 目标列类型做类型适配批量插入（每批 500 行）；
 * - datetime/timestamp 兼容 'T' 分隔、小数秒截断到 6 位；
 * - 迁移后修正 AUTO_INCREMENT 续值为 max(id)+1；
 * - 全程 FOREIGN_KEY_CHECKS=0 / UNIQUE_CHECKS=0，结束恢复。
 *
 * 用法：
 *   javac -cp "sqlite-jdbc.jar;mysql-connector-j.jar" SqliteToMysql.java
 *   java  -cp ".;sqlite-jdbc.jar;mysql-connector-j.jar" SqliteToMysql
 */
public class SqliteToMysql {

    static final String SRC_URL = "jdbc:sqlite:E:/KjlStudy/AI/AIStudio/data/racc.db?busy_timeout=10000";
    static final String DST_URL = "jdbc:mysql://localhost:3306/racc?useUnicode=true&characterEncoding=utf8"
            + "&serverTimezone=Asia/Shanghai&useSSL=false&allowPublicKeyRetrieval=true&rewriteBatchedStatements=true";
    static final String DST_USER = "root";
    static final String DST_PASS = "racc123";
    static final int BATCH = 500;

    public static void main(String[] args) throws Exception {
        long start = System.currentTimeMillis();
        try (Connection src = DriverManager.getConnection(SRC_URL);
             Connection dst = DriverManager.getConnection(DST_URL, DST_USER, DST_PASS)) {

            dst.setAutoCommit(false);
            try (Statement st = dst.createStatement()) {
                st.execute("SET FOREIGN_KEY_CHECKS=0");
                st.execute("SET UNIQUE_CHECKS=0");
            }

            List<String> tables = new ArrayList<>();
            try (Statement st = src.createStatement();
                 ResultSet rs = st.executeQuery(
                         "SELECT name FROM sqlite_master WHERE type='table' "
                       + "AND name NOT LIKE 'sqlite_%' AND name NOT LIKE 'knowledge_fts%' ORDER BY name")) {
                while (rs.next()) tables.add(rs.getString(1));
            }
            System.out.println("SQLite 用户表共 " + tables.size() + " 张: " + tables);

            long total = 0;
            List<String> skipped = new ArrayList<>();
            for (String table : tables) {
                long n = migrateTable(src, dst, table);
                if (n < 0) skipped.add(table);
                else total += n;
            }

            try (Statement st = dst.createStatement()) {
                st.execute("SET FOREIGN_KEY_CHECKS=1");
                st.execute("SET UNIQUE_CHECKS=1");
            }
            dst.commit();

            System.out.println("=== 迁移完成：共 " + total + " 行，耗时 "
                    + (System.currentTimeMillis() - start) / 1000 + " 秒 ===");
            if (!skipped.isEmpty()) {
                System.out.println("!!! 跳过的表（MySQL 中不存在）: " + skipped);
            }
        }
    }

    /** @return 迁移行数；-1 表示目标表不存在（跳过） */
    static long migrateTable(Connection src, Connection dst, String table) throws SQLException {
        // 1) MySQL 目标列：名称 → 数据类型（小写）
        Map<String, String> dstTypes = new LinkedHashMap<>();
        String autoIncCol = null;
        try (PreparedStatement ps = dst.prepareStatement(
                "SELECT COLUMN_NAME, DATA_TYPE, EXTRA FROM information_schema.columns "
              + "WHERE table_schema = DATABASE() AND table_name = ? ORDER BY ORDINAL_POSITION")) {
            ps.setString(1, table);
            try (ResultSet rs = ps.executeQuery()) {
                while (rs.next()) {
                    String col = rs.getString(1);
                    dstTypes.put(col, rs.getString(2).toLowerCase());
                    if (rs.getString(3) != null && rs.getString(3).contains("auto_increment")) {
                        autoIncCol = col;
                    }
                }
            }
        }
        if (dstTypes.isEmpty()) {
            System.out.println("[跳过] " + table + "：MySQL 中不存在该表");
            return -1;
        }

        // 2) SQLite 源列
        List<String> srcCols = new ArrayList<>();
        try (Statement st = src.createStatement();
             ResultSet rs = st.executeQuery("PRAGMA table_info('" + table.replace("'", "''") + "')")) {
            while (rs.next()) srcCols.add(rs.getString("name"));
        }

        // 3) 交集列（保持 MySQL 列序），并报告两侧不一致的列
        List<String> cols = new ArrayList<>();
        for (String c : dstTypes.keySet()) {
            if (srcCols.contains(c)) cols.add(c);
        }
        for (String c : srcCols) {
            if (!dstTypes.containsKey(c)) {
                System.out.println("[警告] " + table + "." + c + " 仅存在于 SQLite，已忽略");
            }
        }
        if (cols.isEmpty()) {
            System.out.println("[跳过] " + table + "：无公共列");
            return -1;
        }

        // 4) 清空目标表
        try (Statement st = dst.createStatement()) {
            st.execute("TRUNCATE TABLE `" + table + "`");
        }

        // 5) 流式复制
        StringBuilder insSql = new StringBuilder("INSERT INTO `" + table + "` (");
        StringBuilder ph = new StringBuilder();
        for (int i = 0; i < cols.size(); i++) {
            if (i > 0) { insSql.append(", "); ph.append(", "); }
            insSql.append('`').append(cols.get(i)).append('`');
            ph.append('?');
        }
        insSql.append(") VALUES (").append(ph).append(')');

        StringBuilder selSql = new StringBuilder("SELECT ");
        for (int i = 0; i < cols.size(); i++) {
            if (i > 0) selSql.append(", ");
            selSql.append('"').append(cols.get(i)).append('"');
        }
        selSql.append(" FROM \"").append(table).append('"');

        long rows = 0;
        long maxId = 0;
        int idIdx = autoIncCol != null ? cols.indexOf(autoIncCol) : -1;

        try (Statement sel = src.createStatement();
             ResultSet rs = sel.executeQuery(selSql.toString());
             PreparedStatement ins = dst.prepareStatement(insSql.toString())) {

            while (rs.next()) {
                for (int i = 0; i < cols.size(); i++) {
                    Object v = rs.getObject(i + 1);
                    setParam(ins, i + 1, v, dstTypes.get(cols.get(i)));
                }
                ins.addBatch();
                rows++;
                if (idIdx >= 0) {
                    long id = rs.getLong(idIdx + 1);
                    if (id > maxId) maxId = id;
                }
                if (rows % BATCH == 0) {
                    ins.executeBatch();
                    dst.commit();
                }
            }
            if (rows % BATCH != 0) {
                ins.executeBatch();
                dst.commit();
            }
        }

        // 6) 修正 AUTO_INCREMENT 续值
        if (autoIncCol != null && maxId > 0) {
            try (Statement st = dst.createStatement()) {
                st.execute("ALTER TABLE `" + table + "` AUTO_INCREMENT = " + (maxId + 1));
            }
        }
        System.out.println("[完成] " + table + "：" + rows + " 行"
                + (autoIncCol != null ? "（" + autoIncCol + " 续值=" + (maxId + 1) + "）" : ""));
        return rows;
    }

    /** 按 MySQL 目标类型适配 SQLite 值 */
    static void setParam(PreparedStatement ps, int idx, Object v, String mysqlType) throws SQLException {
        if (v == null) {
            ps.setNull(idx, Types.NULL);
            return;
        }
        switch (mysqlType) {
            case "datetime":
            case "timestamp":
            case "date":
            case "time": {
                String s = toDatetime(v);
                if (s == null) ps.setNull(idx, Types.TIMESTAMP);
                else ps.setString(idx, s);
                break;
            }
            case "bit":
            case "tinyint":
            case "smallint":
            case "mediumint":
            case "int":
            case "bigint": {
                if (v instanceof Number) ps.setLong(idx, ((Number) v).longValue());
                else {
                    try { ps.setLong(idx, Long.parseLong(v.toString().trim())); }
                    catch (NumberFormatException e) {
                        // boolean 文本兜底
                        ps.setLong(idx, "true".equalsIgnoreCase(v.toString().trim()) ? 1 : 0);
                    }
                }
                break;
            }
            case "float":
            case "double":
            case "decimal":
            case "numeric": {
                if (v instanceof Number) ps.setDouble(idx, ((Number) v).doubleValue());
                else {
                    try { ps.setDouble(idx, Double.parseDouble(v.toString().trim())); }
                    catch (NumberFormatException e) { ps.setNull(idx, Types.DOUBLE); }
                }
                break;
            }
            case "blob":
            case "tinyblob":
            case "mediumblob":
            case "longblob":
            case "binary":
            case "varbinary": {
                if (v instanceof byte[]) ps.setBytes(idx, (byte[]) v);
                else ps.setString(idx, v.toString());
                break;
            }
            default: {
                // char / varchar / text 家族 / json / enum / set
                if (v instanceof byte[]) ps.setString(idx, new String((byte[]) v, java.nio.charset.StandardCharsets.UTF_8));
                else ps.setString(idx, v.toString());
            }
        }
    }

    /**
     * 归一化为 MySQL 日期时间文本：'yyyy-MM-dd HH:mm:ss[.ffffff]'。
     * 兼容 'T' 分隔、时区后缀（截掉，按本地时间入库）、小数秒（截断到 6 位）。
     * 数值型按 epoch（毫秒/秒）处理。
     */
    static String toDatetime(Object v) {
        if (v instanceof Number) {
            long n = ((Number) v).longValue();
            java.time.Instant ins = (n > 1_000_000_000_000L)
                    ? java.time.Instant.ofEpochMilli(n)
                    : java.time.Instant.ofEpochSecond(n);
            return java.time.LocalDateTime.ofInstant(ins, java.time.ZoneId.of("Asia/Shanghai"))
                    .format(java.time.format.DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
        }
        String s = v.toString().trim();
        if (s.isEmpty()) return null;
        s = s.replace('T', ' ');
        // 去除时区后缀：2026-08-25 13:36:21+08:00 / ...Z
        int z = s.indexOf('Z');
        if (z > 0) s = s.substring(0, z);
        int plus = s.indexOf('+');
        if (plus > 10) s = s.substring(0, plus);
        int minus = s.lastIndexOf('-');
        if (minus > 10) s = s.substring(0, minus); // 形如 2026-08-25 13:36:21-05:00
        // 小数秒截断到 6 位
        int dot = s.indexOf('.');
        if (dot >= 0) {
            int i = dot + 1;
            while (i < s.length() && Character.isDigit(s.charAt(i))) i++;
            String frac = s.substring(dot + 1, i);
            frac = frac.length() > 6 ? frac.substring(0, 6) : frac;
            s = frac.isEmpty() ? s.substring(0, dot) : s.substring(0, dot + 1) + frac;
        }
        return s;
    }
}
