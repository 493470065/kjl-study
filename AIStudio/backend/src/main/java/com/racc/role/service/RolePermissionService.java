package com.racc.role.service;

import com.racc.role.entity.RolePermissionEntity;
import com.racc.role.repository.RolePermissionRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.*;

/**
 * 角色权限服务：角色术语可配置 + 角色菜单配置 + 用户按角色获得菜单。
 * <p>
 * 约定：
 * - SUPER_ADMIN 为内置超级管理员，固定拥有全部菜单（"*"），菜单不可修改、不可删除；
 * - ADMIN / USER 为内置角色，可改术语与菜单，但不可删除；
 * - 其余为自定义角色，可自由增删与配置菜单。
 */
@Service
@Transactional
public class RolePermissionService {

    public static final String SUPER_ADMIN = RolePermissionEntity.SUPER_ADMIN;

    private final RolePermissionRepository repository;

    public RolePermissionService(RolePermissionRepository repository) {
        this.repository = repository;
    }

    /** 内置角色默认术语与说明（用于首次播种 / 补齐历史数据） */
    private static final Map<String, String[]> BUILTIN_LABELS = new LinkedHashMap<>();
    static {
        BUILTIN_LABELS.put(SUPER_ADMIN, new String[]{"超级管理员", "内置角色，固定拥有全部菜单，不可删除"});
        BUILTIN_LABELS.put("ADMIN", new String[]{"管理员", "内置角色，可配置菜单权限"});
        BUILTIN_LABELS.put("USER", new String[]{"普通用户", "内置角色，可配置菜单权限"});
    }

    /** USER 角色首次创建时的默认菜单（避免新账号登录后侧栏空空如也） */
    private static final String DEFAULT_USER_MENUS =
            "[\"/chat\", \"/todos\", \"/requirements\", \"/knowledge\"]";

    /**
     * 启动时保证内置角色存在，并为历史数据补齐术语/内置标记/排序（幂等）。
     */
    public void ensureBuiltinRoles() {
        int sort = 1;
        for (Map.Entry<String, String[]> e : BUILTIN_LABELS.entrySet()) {
            String role = e.getKey();
            RolePermissionEntity entity = repository.findByRole(role).orElse(null);
            if (entity == null) {
                entity = new RolePermissionEntity();
                entity.setRole(role);
                entity.setAllowedMenus(SUPER_ADMIN.equals(role) ? "*"
                        : ("ADMIN".equals(role) ? "*" : DEFAULT_USER_MENUS));
            }
            if (entity.getLabel() == null || entity.getLabel().isBlank()) {
                entity.setLabel(e.getValue()[0]);
            }
            if (entity.getDescription() == null || entity.getDescription().isBlank()) {
                entity.setDescription(e.getValue()[1]);
            }
            entity.setBuiltin(true);
            // 无条件覆盖：实体字段默认 99 会让 null 判断失效
            entity.setSortOrder(sort);
            repository.save(entity);
            sort++;
        }
        // 历史自定义角色（非内置）也应有术语，缺省用角色编码兜底
        for (RolePermissionEntity entity : repository.findAll()) {
            if (entity.getLabel() == null || entity.getLabel().isBlank()) {
                entity.setLabel(entity.getRole());
                repository.save(entity);
            }
        }
    }

    /**
     * 获取所有角色定义（含术语、菜单），按 sortOrder、id 排序。
     * 返回：[{role, label, description, builtin, sortOrder, allowedMenus}]
     */
    @Transactional(readOnly = true)
    public List<Map<String, Object>> getAllRolePermissions() {
        List<RolePermissionEntity> all = repository.findAll();
        all.sort(Comparator
                .comparing((RolePermissionEntity e) -> e.getSortOrder() == null ? 99 : e.getSortOrder())
                .thenComparing(e -> e.getId() == null ? 0L : e.getId()));
        List<Map<String, Object>> result = new ArrayList<>();
        for (RolePermissionEntity entity : all) {
            result.add(toMap(entity));
        }
        return result;
    }

    /**
     * 解析某角色可见的菜单：SUPER_ADMIN 恒定 "*"，其余取配置。
     * 供登录 / 用户信息接口使用 —— 用户通过角色获得菜单。
     */
    @Transactional(readOnly = true)
    public Object resolveMenusForRole(String role) {
        if (role == null || role.isBlank()) return Collections.emptyList();
        String key = role.trim().toUpperCase();
        if (SUPER_ADMIN.equals(key)) return "*";
        return parseMenus(repository.findByRole(key)
                .map(RolePermissionEntity::getAllowedMenus).orElse(null));
    }

    /** 角色术语：无配置时返回角色编码 */
    @Transactional(readOnly = true)
    public String resolveRoleLabel(String role) {
        if (role == null || role.isBlank()) return "";
        return repository.findByRole(role.trim().toUpperCase())
                .map(e -> (e.getLabel() == null || e.getLabel().isBlank()) ? e.getRole() : e.getLabel())
                .orElse(role);
    }

    /** 新增自定义角色 */
    public Map<String, Object> createRole(Map<String, Object> body) {
        String role = str(body.get("role")).trim().toUpperCase();
        if (role.isEmpty()) throw new IllegalArgumentException("角色编码不能为空");
        if (!role.matches("[A-Z][A-Z0-9_]{1,31}")) {
            throw new IllegalArgumentException("角色编码需为大写字母/数字/下划线，2-32 位且以字母开头");
        }
        if (repository.findByRole(role).isPresent()) {
            throw new IllegalArgumentException("角色编码已存在: " + role);
        }
        RolePermissionEntity entity = new RolePermissionEntity();
        entity.setRole(role);
        entity.setLabel(nullSafe(str(body.get("label")), role));
        entity.setDescription(str(body.get("description")));
        entity.setBuiltin(false);
        Integer sort = intOrNull(body.get("sortOrder"));
        entity.setSortOrder(sort == null ? 99 : sort);
        entity.setAllowedMenus(toJsonArray(menuList(body.get("allowedMenus"))));
        repository.save(entity);
        return toMap(entity);
    }

    /** 更新角色：术语 / 说明 / 排序 / 菜单（SUPER_ADMIN 菜单强制 "*"） */
    public Map<String, Object> updateRole(String role, Map<String, Object> body) {
        String key = role == null ? "" : role.trim().toUpperCase();
        RolePermissionEntity entity = repository.findByRole(key)
                .orElseThrow(() -> new IllegalArgumentException("角色不存在: " + role));

        if (body.containsKey("label")) {
            String label = str(body.get("label")).trim();
            entity.setLabel(label.isEmpty() ? entity.getRole() : label);
        }
        if (body.containsKey("description")) entity.setDescription(str(body.get("description")));
        if (body.containsKey("sortOrder")) {
            Integer sort = intOrNull(body.get("sortOrder"));
            if (sort != null) entity.setSortOrder(sort);
        }
        if (SUPER_ADMIN.equals(key)) {
            // 超级管理员固定全部菜单，仅术语/说明可改
            entity.setAllowedMenus("*");
        } else if (body.containsKey("allowedMenus")) {
            entity.setAllowedMenus(toJsonArray(menuList(body.get("allowedMenus"))));
        }
        repository.save(entity);
        return toMap(entity);
    }

    /** 删除角色：内置角色与仍被用户引用的角色由调用方先行拦截 */
    public void deleteRole(String role) {
        String key = role == null ? "" : role.trim().toUpperCase();
        RolePermissionEntity entity = repository.findByRole(key)
                .orElseThrow(() -> new IllegalArgumentException("角色不存在: " + role));
        if (Boolean.TRUE.equals(entity.getBuiltin())) {
            throw new IllegalArgumentException("内置角色不可删除: " + key);
        }
        repository.delete(entity);
    }

    @Transactional(readOnly = true)
    public boolean exists(String role) {
        return role != null && repository.findByRole(role.trim().toUpperCase()).isPresent();
    }

    // ====================== 内部工具 ======================

    private Map<String, Object> toMap(RolePermissionEntity e) {
        Map<String, Object> item = new LinkedHashMap<>();
        item.put("role", e.getRole());
        item.put("label", (e.getLabel() == null || e.getLabel().isBlank()) ? e.getRole() : e.getLabel());
        item.put("description", e.getDescription());
        item.put("builtin", Boolean.TRUE.equals(e.getBuiltin()));
        item.put("sortOrder", e.getSortOrder() == null ? 99 : e.getSortOrder());
        item.put("allowedMenus", parseMenus(e.getAllowedMenus()));
        return item;
    }

    /** 把 "*" / JSON 数组 / 逗号串统一解析为 "*" 或 List<String> */
    private Object parseMenus(String menus) {
        if (menus == null || menus.isBlank()) return Collections.emptyList();
        String trimmed = menus.trim();
        if ("*".equals(trimmed)) return "*";
        String inner = trimmed;
        if (inner.startsWith("[") && inner.endsWith("]")) {
            inner = inner.substring(1, inner.length() - 1).trim();
        }
        if (inner.isBlank()) return Collections.emptyList();
        List<String> list = new ArrayList<>();
        for (String p : inner.split(",")) {
            String v = p.trim().replaceAll("^\"|\"$", "").trim();
            if (!v.isEmpty()) list.add(v);
        }
        return list;
    }

    @SuppressWarnings("unchecked")
    private List<String> menuList(Object raw) {
        if (raw == null) return Collections.emptyList();
        if (raw instanceof String s) {
            if ("*".equals(s.trim())) return Collections.singletonList("*");
            return Collections.singletonList(s.trim());
        }
        if (raw instanceof Collection<?> c) {
            List<String> list = new ArrayList<>();
            for (Object o : c) if (o != null) list.add(String.valueOf(o).trim());
            return list;
        }
        return Collections.emptyList();
    }

    private String toJsonArray(List<String> menus) {
        if (menus.contains("*")) return "[\"*\"]";
        StringBuilder sb = new StringBuilder("[");
        for (int i = 0; i < menus.size(); i++) {
            if (i > 0) sb.append(",");
            sb.append("\"").append(menus.get(i).replace("\"", "")).append("\"");
        }
        return sb.append("]").toString();
    }

    private String str(Object v) { return v == null ? "" : String.valueOf(v); }

    private String nullSafe(String v, String fallback) {
        return (v == null || v.isBlank()) ? fallback : v.trim();
    }

    private Integer intOrNull(Object v) {
        if (v == null) return null;
        try { return Integer.parseInt(String.valueOf(v).trim()); } catch (Exception e) { return null; }
    }
}
