import { createRouter, createWebHistory } from 'vue-router';
import { startProgress, doneProgress } from '@/utils/routerProgress';
import { useAuthStore } from '@/stores/auth';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: "/login",
      name: "login",
      component: () => import("@/views/login/LoginView.vue"),
      meta: { public: true }
    },
    {
      // 首页已从菜单隐藏，改挂 /dashboard（URL 直达仍可访问）；
      // 根路径 "/" 在守卫中按登录落地口径跳转首个可访问菜单
      path: "/dashboard",
      name: "dashboard",
      component: () => import("@/views/dashboard/DashboardView.vue"),
      meta: { title: "首页", skipMenuCheck: true }
    },
    {
      path: "/monitor",
      name: "monitor",
      component: () => import("@/views/monitor/MonitorView.vue"),
      meta: { title: "运行时监控" }
    },
    {
      path: "/tfs-dashboard",
      name: "tfsDashboard",
      component: () => import("@/views/tfs/TfsDashboardView.vue"),
      meta: { title: "TFS 看板" }
    },
    {
      path: "/chat",
      name: "chat",
      component: () => import("@/views/chat/ChatView.vue"),
      meta: { title: "AI 对话" }
    },
    {
      path: "/requirements",
      name: "requirements",
      component: () => import("@/views/requirements/RequirementsView.vue"),
      meta: { title: "需求看板" }
    },
    {
      path: "/req-collect",
      name: "reqCollect",
      component: () => import("@/views/requirements/RequirementCollectView.vue"),
      meta: { title: "需求归集" }
    },
    {
      path: "/todos",
      name: "todos",
      component: () => import("@/views/todo/TodoView.vue"),
      meta: { title: "待办事项", skipMenuCheck: true }
    },
    {
      path: "/knowledge",
      name: "knowledge",
      component: () => import("@/views/knowledge/KnowledgeView.vue"),
      meta: { title: "知识库" }
    },
    {
      path: "/mcp",
      name: "mcp",
      component: () => import("@/views/mcp/McpManagementView.vue"),
      meta: { title: "MCP 管理" }
    },
    {
      path: "/automate",
      name: "automate",
      component: () => import("@/views/automate/AutomateView.vue"),
      meta: { title: "自动化管理" }
    },
    {
      path: "/agents",
      name: "agents",
      component: () => import("@/views/agent/AgentConfigView.vue"),
      meta: { title: "Agent 管理" }
    },
    {
      path: "/skills",
      name: "skills",
      component: () => import("@/views/skills/SkillsView.vue"),
      meta: { title: "Skill 管理" }
    },
    {
      path: "/sandbox",
      name: "sandbox",
      component: () => import("@/views/sandbox/SandboxView.vue"),
      meta: { title: "沙箱管理" }
    },
    {
      path: "/users",
      name: "users",
      component: () => import("@/views/user/UserManagementView.vue"),
      meta: { title: "账户管理" }
    },
    {
      path: "/audit",
      name: "audit",
      component: () => import("@/views/audit/AuditView.vue"),
      meta: { title: "审计日志" }
    },
    {
      path: "/team",
      name: "team",
      component: () => import("@/views/team/TeamView.vue"),
      meta: { title: "团队协作" }
    },
    {
      path: "/providers",
      name: "providers",
      component: () => import("@/views/providers/ProvidersView.vue"),
      meta: { title: "LLM 管理" }
    },
    {
      path: "/workflows",
      name: "workflows",
      component: () => import("@/views/workflows/WorkflowsView.vue"),
      meta: { title: "工作流编排" }
    },
    {
      path: "/repository",
      name: "repository",
      component: () => import("@/views/repository/RepositoryView.vue"),
      meta: { title: "仓库管理" }
    },
    {
      path: "/product-lines",
      name: "productLines",
      component: () => import("@/views/productline/ProductLineView.vue"),
      meta: { title: "产品线管理" }
    },
    {
      path: "/ops-dashboard",
      name: "opsDashboard",
      component: () => import("@/views/ops/OpsDashboardView.vue"),
      meta: { title: "运营看板" }
    },
    {
      path: "/dev-env",
      name: "devEnv",
      component: () => import("@/views/ops/DevEnvView.vue"),
      meta: { title: "开发环境" }
    },
    {
      path: "/scheduled-tasks",
      name: "scheduledTasks",
      component: () => import("@/views/schedule/ScheduledTaskView.vue"),
      meta: { title: "定时任务" }
    },
    {
      path: "/webhook",
      name: "webhook",
      component: () => import("@/views/webhook/WebhookView.vue"),
      meta: { title: "Webhook 通知" }
    },
    {
      path: "/evaluation",
      name: "evaluation",
      component: () => import("@/views/evaluation/EvaluationView.vue"),
      meta: { title: "AI 评估" }
    },
    {
      path: "/compute",
      name: "compute",
      component: () => import("@/views/compute/ComputeView.vue"),
      meta: { title: "本地算力" }
    },
    {
      path: "/structured",
      name: "structured",
      component: () => import("@/views/structured/StructuredView.vue"),
      meta: { title: "结构化输出" }
    },
    {
      path: "/403",
      name: "forbidden",
      component: () => import("@/views/error/ErrorView.vue"),
      props: { code: 403 },
      meta: { title: "无权访问", skipMenuCheck: true }
    },
    {
      path: "/:pathMatch(.*)*",
      name: "notFound",
      component: () => import("@/views/error/ErrorView.vue"),
      props: { code: 404 },
      meta: { title: "页面不存在", skipMenuCheck: true }
    }
  ]
});

/**
 * 安全读取登录态：storage 中的 auth 若为损坏 JSON，清理后按未登录处理，
 * 避免守卫抛错导致全站白屏死循环。
 */
function readAuth(): { token?: string; user?: any } | null {
  const raw = localStorage.getItem("auth") || sessionStorage.getItem("auth");
  if (!raw) return null;
  try {
    const data = JSON.parse(raw);
    return data && typeof data === "object" ? data : null;
  } catch {
    localStorage.removeItem("auth");
    sessionStorage.removeItem("auth");
    return null;
  }
}

router.beforeEach((to) => {
  startProgress();
  const authData = readAuth();
  const isLoggedIn = !!authData?.token;

  if (!to.meta.public && !isLoggedIn) {
    // 携带回跳地址，登录后回到原页面
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (isLoggedIn && to.name === "login") {
    return { path: "/chat" };
  }

  // 首页已隐藏：已登录访问根路径时，按登录落地口径跳首个可访问菜单（未登录仍走上方登录回跳）
  if (isLoggedIn && to.path === "/") {
    return useAuthStore().firstAccessibleMenu();
  }

  // 细粒度菜单权限：无权访问时给出 403 页，而不是踢回登录页
  if (isLoggedIn && !to.meta.public && !to.meta.skipMenuCheck) {
    const user = authData?.user;
    if (user && user.role !== "ADMIN" && user.allowedMenus && user.allowedMenus !== "*") {
      const menus = Array.isArray(user.allowedMenus) ? user.allowedMenus : [];
      if (!menus.includes("*") && !menus.includes(to.path)) {
        return { path: "/403" };
      }
    }
  }
});

router.afterEach((to) => {
  doneProgress();
  const title = to.meta.title as string | undefined;
  document.title = title ? `${title} · 景磊的AI工作站` : "景磊的AI工作站";
});

router.onError(() => doneProgress());

export default router;
