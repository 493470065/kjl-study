package com.racc.config;

import com.racc.automate.entity.AutomateTaskTypeEntity;
import com.racc.automate.repository.AutomateTaskTypeRepository;
import com.racc.llm.entity.LlmProviderEntity;
import com.racc.llm.repository.LlmProviderRepository;
import com.racc.role.entity.RolePermissionEntity;
import com.racc.role.repository.RolePermissionRepository;
import com.racc.user.UserRepository;
import com.racc.user.entity.UserEntity;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

import java.time.LocalDateTime;

/**
 * 首次启动 seed：
 * - admin/admin123（ADMIN，全部菜单）
 * - role_permissions 初始记录（ADMIN/* 和 USER/空）
 * - 默认 LLM Provider（样例，只播种一次：写入 seed_state 标记后，
 *   用户删除的默认 Provider 不会在重启时被重新插入）
 * - 自动化任务类型（需求分析/生成Spec/需求归集/功能点健康度，只播种一次）
 */
@Component
public class DataSeeder implements CommandLineRunner {

    private static final String LLM_SEED_FLAG = "llm_providers_seeded";
    private static final String AUTOMATE_TYPES_SEED_FLAG = "automate_task_types_seeded";

    private final UserRepository users;
    private final PasswordEncoder encoder;
    private final RolePermissionRepository rolePermissionRepository;
    private final LlmProviderRepository llmProviderRepository;
    private final SeedStateRepository seedStateRepository;
    private final AutomateTaskTypeRepository automateTaskTypeRepository;

    public DataSeeder(UserRepository users,
                      PasswordEncoder encoder,
                      RolePermissionRepository rolePermissionRepository,
                      LlmProviderRepository llmProviderRepository,
                      SeedStateRepository seedStateRepository,
                      AutomateTaskTypeRepository automateTaskTypeRepository) {
        this.users = users;
        this.encoder = encoder;
        this.rolePermissionRepository = rolePermissionRepository;
        this.llmProviderRepository = llmProviderRepository;
        this.seedStateRepository = seedStateRepository;
        this.automateTaskTypeRepository = automateTaskTypeRepository;
    }

    @Override
    public void run(String... args) {
        seedAdmin();
        seedRolePermissions();
        seedDefaultLlmProviders();
        seedAutomateTaskTypes();
    }

    private void seedAdmin() {
        if (!users.existsByUsername("admin")) {
            UserEntity admin = new UserEntity();
            admin.setUsername("admin");
            admin.setPassword(encoder.encode("admin123"));
            admin.setDisplayName("管理员");
            admin.setEmpNo("admin");
            admin.setRole("ADMIN");
            admin.setAllowedMenus("*");
            admin.setEnabled(true);
            users.save(admin);
        }
    }

    private void seedRolePermissions() {
        if (!rolePermissionRepository.existsByRole("ADMIN")) {
            RolePermissionEntity adminRole = new RolePermissionEntity();
            adminRole.setRole("ADMIN");
            adminRole.setAllowedMenus("*");
            rolePermissionRepository.save(adminRole);
        }
        if (!rolePermissionRepository.existsByRole("USER")) {
            RolePermissionEntity userRole = new RolePermissionEntity();
            userRole.setRole("USER");
            userRole.setAllowedMenus("[]");
            rolePermissionRepository.save(userRole);
        }
    }

    private void seedDefaultLlmProviders() {
        // 只播种一次：已播种过则跳过，用户删除的默认 Provider 重启后不再补种
        if (seedStateRepository.findById(LLM_SEED_FLAG).isPresent()) {
            return;
        }
        if (!llmProviderRepository.existsByName("openai")) {
            LlmProviderEntity openai = new LlmProviderEntity();
            openai.setName("openai");
            openai.setDisplayName("OpenAI");
            openai.setProviderType("openai");
            openai.setBaseUrl("https://api.openai.com/v1");
            openai.setModelName("gpt-4o");
            openai.setEnabled(true);
            openai.setIsDefault(true);
            llmProviderRepository.save(openai);
        }
        if (!llmProviderRepository.existsByName("ollama")) {
            LlmProviderEntity ollama = new LlmProviderEntity();
            ollama.setName("ollama");
            ollama.setDisplayName("Ollama");
            ollama.setProviderType("openai");
            ollama.setBaseUrl("http://localhost:11434/v1");
            ollama.setModelName("llama3");
            ollama.setEnabled(true);
            ollama.setIsDefault(false);
            llmProviderRepository.save(ollama);
        }
        // 记录播种标记
        SeedStateEntity flag = new SeedStateEntity();
        flag.setSeedKey(LLM_SEED_FLAG);
        flag.setSeedValue("true");
        flag.setSeededAt(LocalDateTime.now());
        seedStateRepository.save(flag);
    }

    /**
     * 播种预置自动化任务类型（只播种一次，之后由页面在线管理）
     */
    private void seedAutomateTaskTypes() {
        if (seedStateRepository.findById(AUTOMATE_TYPES_SEED_FLAG).isPresent()) {
            return;
        }
        seedType("req-analysis", "需求分析", "🔍",
                "对 TFS 需求进行正式需求分析：产品业务分析、深度分析，回写 Winning.Demand.Analysis",
                "std-req-analysis-emr-v5", null, 1, """
                [{"key":"tfsWorkItemId","label":"TFS 需求号","type":"number","required":true,"placeholder":"输入 TFS 需求号"}]""");
        seedType("spec-generation", "生成Spec", "📝",
                "基于资料区 + 代码仓库 + 方法论文档，为指定功能模块生成功能点 Spec 文档",
                "generate-spec-v1", null, 2, """
                [{"key":"moduleName","label":"功能模块名称","type":"text","required":true,"placeholder":"如：WiNEX 病历管理（住院）"},
                 {"key":"materialDir","label":"资料区路径","type":"text","required":false,"placeholder":"默认 E:\\\\37结构性问题治理\\\\01WiNEX 病历管理\\\\资料区"},
                 {"key":"methodologyDoc","label":"方法论文档路径","type":"text","required":false,"placeholder":"功能点划分方法论文档路径（可选）"},
                 {"key":"outputDir","label":"输出目录","type":"text","required":false,"placeholder":"按模块编码前缀自动确定（可选）"}]""");
        seedType("req-consolidation", "需求归集", "🗂️",
                "从 TFS 查询获取需求清单，按 Spec 知识库功能点结构归集，并输出功能点健康度基线",
                "consolidate-requirements-v1", null, 3, """
                [{"key":"queryUrl","label":"TFS 查询 URL","type":"text","required":false,"placeholder":"留空=默认「病历条线新增需求」查询；如需切换，粘贴 TFS 网页查询地址（需包含 id=xxx）"},
                 {"key":"outputDir","label":"输出路径","type":"text","required":false,"default":"E:\\\\37结构性问题治理\\\\07病历条线需求聚拢\\\\","placeholder":"默认 E:\\\\37结构性问题治理\\\\07病历条线需求聚拢\\\\"}]""");
        seedType("fp-health", "功能点健康度", "🩺",
                "五维评分 + 一票否决的功能点健康度 / 设计合理性分析，输出含优先级建议的完整报告",
                "rationality-analysis-v1", null, 4, """
                [{"key":"moduleName","label":"模块名称","type":"text","required":true,"placeholder":"如：病历归档"},
                 {"key":"refDocDir","label":"对照文档目录","type":"text","required":false,"placeholder":"默认 E:\\\\37结构性问题治理\\\\04参考资料\\\\{模块名}\\\\"},
                 {"key":"requirementsSource","label":"需求问题点来源","type":"textarea","required":false,"placeholder":"需求清单/问题点来源说明（可选）"}]""");

        SeedStateEntity flag = new SeedStateEntity();
        flag.setSeedKey(AUTOMATE_TYPES_SEED_FLAG);
        flag.setSeedValue("true");
        flag.setSeededAt(LocalDateTime.now());
        seedStateRepository.save(flag);
    }

    private void seedType(String code, String name, String icon, String description,
                          String skillName, Long workflowDefinitionId, int sortOrder, String formSchema) {
        if (automateTaskTypeRepository.existsByCode(code)) {
            return;
        }
        AutomateTaskTypeEntity type = new AutomateTaskTypeEntity();
        type.setCode(code);
        type.setName(name);
        type.setIcon(icon);
        type.setDescription(description);
        type.setSkillName(skillName);
        type.setWorkflowDefinitionId(workflowDefinitionId);
        type.setSortOrder(sortOrder);
        type.setFormSchema(formSchema);
        type.setEnabled(true);
        automateTaskTypeRepository.save(type);
    }
}