import { createRouter, createWebHistory } from 'vue-router';
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
      path: "/",
      redirect: "/chat"
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
      component: () => import("@/views/chat/ChatView.vue")
    },
    {
      path: "/requirements",
      name: "requirements",
      component: () => import("@/views/requirements/RequirementsView.vue")
    },
    {
      path: "/knowledge",
      name: "knowledge",
      component: () => import("@/views/knowledge/KnowledgeView.vue")
    },
    {
      path: "/mcp",
      name: "mcp",
      component: () => import("@/views/mcp/McpManagementView.vue")
    },
    {
      path: "/automate",
      name: "automate",
      component: () => import("@/views/automate/AutomateView.vue")
    },
    {
      path: "/agents",
      name: "agents",
      component: () => import("@/views/agent/AgentConfigView.vue")
    },
    {
      path: "/skills",
      name: "skills",
      component: () => import("@/views/skills/SkillsView.vue")
    },
    {
      path: "/sandbox",
      name: "sandbox",
      component: () => import("@/views/sandbox/SandboxView.vue")
    },
    {
      path: "/settings",
      name: "settings",
      component: () => import("@/views/settings/SettingsView.vue")
    },
    {
      path: "/personal-config",
      name: "personalConfig",
      component: () => import("@/views/settings/PersonalConfigView.vue")
    },
    {
      path: "/users",
      name: "users",
      component: () => import("@/views/user/UserManagementView.vue")
    },
    {
      path: "/audit",
      name: "audit",
      component: () => import("@/views/audit/AuditView.vue")
    },
    {
      path: "/team",
      name: "team",
      component: () => import("@/views/team/TeamView.vue")
    },
    {
      path: "/providers",
      name: "providers",
      component: () => import("@/views/providers/ProvidersView.vue")
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
      meta: { title: "运营平台看板" }
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
    }
  ]
});
router.beforeEach((to) => {
  const raw = localStorage.getItem("auth") || sessionStorage.getItem("auth");
  const isLoggedIn = raw && JSON.parse(raw).token;
  if (!to.meta.public && !isLoggedIn) {
    return { name: "login" };
  }
  if (isLoggedIn && !to.meta.public) {
    try {
      const authData = JSON.parse(raw);
      if (authData?.user) {
        const user = authData.user;
        if (user.role !== "ADMIN" && user.allowedMenus && user.allowedMenus !== "*") {
          const menus = Array.isArray(user.allowedMenus) ? user.allowedMenus : [];
          const targetPath = to.path;
          if (!menus.includes(targetPath)) {
            return { name: "login" };
          }
        }
      }
    } catch {
    }
  }
});
export default router;

//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImluZGV4LnRzIl0sInNvdXJjZXNDb250ZW50IjpbImltcG9ydCB7IGNyZWF0ZVJvdXRlciwgY3JlYXRlV2ViSGlzdG9yeSB9IGZyb20gJ3Z1ZS1yb3V0ZXInXG5cbmNvbnN0IHJvdXRlciA9IGNyZWF0ZVJvdXRlcih7XG4gIGhpc3Rvcnk6IGNyZWF0ZVdlYkhpc3RvcnkoKSxcbiAgcm91dGVzOiBbXG4gICAge1xuICAgICAgcGF0aDogJy9sb2dpbicsXG4gICAgICBuYW1lOiAnbG9naW4nLFxuICAgICAgY29tcG9uZW50OiAoKSA9PiBpbXBvcnQoJ0Avdmlld3MvbG9naW4vTG9naW5WaWV3LnZ1ZScpLFxuICAgICAgbWV0YTogeyBwdWJsaWM6IHRydWUgfVxuICAgIH0sXG4gICAge1xuICAgICAgcGF0aDogJy8nLFxuICAgICAgbmFtZTogJ2Rhc2hib2FyZCcsXG4gICAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9kYXNoYm9hcmQvRGFzaGJvYXJkVmlldy52dWUnKVxuICAgIH0sXG4gICAge1xuICAgICAgcGF0aDogJy9tb25pdG9yJyxcbiAgICAgIG5hbWU6ICdtb25pdG9yJyxcbiAgICAgIGNvbXBvbmVudDogKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL21vbml0b3IvTW9uaXRvclZpZXcudnVlJyksXG4gICAgICBtZXRhOiB7IHRpdGxlOiAn6L+Q6KGM5pe255uR5o6nJyB9XG4gICAgfSxcbiAgICB7XG4gICAgICBwYXRoOiAnL3Rmcy1kYXNoYm9hcmQnLFxuICAgICAgbmFtZTogJ3Rmc0Rhc2hib2FyZCcsXG4gICAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy90ZnMvVGZzRGFzaGJvYXJkVmlldy52dWUnKSxcbiAgICAgIG1ldGE6IHsgdGl0bGU6ICdURlMg55yL5p2/JyB9XG4gICAgfSxcbiAgICB7XG4gICAgICBwYXRoOiAnL2NoYXQnLFxuICAgICAgbmFtZTogJ2NoYXQnLFxuICAgICAgY29tcG9uZW50OiAoKSA9PiBpbXBvcnQoJ0Avdmlld3MvY2hhdC9DaGF0Vmlldy52dWUnKVxuICAgIH0sXG4gICAge1xuICAgICAgcGF0aDogJy9yZXF1aXJlbWVudHMnLFxuICAgICAgbmFtZTogJ3JlcXVpcmVtZW50cycsXG4gICAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9yZXF1aXJlbWVudHMvUmVxdWlyZW1lbnRzVmlldy52dWUnKVxuICAgIH0sXG4gICAge1xuICAgICAgcGF0aDogJy9rbm93bGVkZ2UnLFxuICAgICAgbmFtZTogJ2tub3dsZWRnZScsXG4gICAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9rbm93bGVkZ2UvS25vd2xlZGdlVmlldy52dWUnKVxuICAgIH0sXG4gICAge1xuICAgICAgcGF0aDogJy9tY3AnLFxuICAgICAgbmFtZTogJ21jcCcsXG4gICAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9tY3AvTWNwTWFuYWdlbWVudFZpZXcudnVlJylcbiAgICB9LFxuICAgIHtcbiAgICAgIHBhdGg6ICcvcGlwZWxpbmUnLFxuICAgICAgbmFtZTogJ3BpcGVsaW5lJyxcbiAgICAgIGNvbXBvbmVudDogKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL3BpcGVsaW5lL1BpcGVsaW5lVmlldy52dWUnKVxuICAgIH0sXG4gICAge1xuICAgICAgcGF0aDogJy9hZ2VudHMnLFxuICAgICAgbmFtZTogJ2FnZW50cycsXG4gICAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9hZ2VudC9BZ2VudENvbmZpZ1ZpZXcudnVlJylcbiAgICB9LFxuICAgIHtcbiAgICAgIHBhdGg6ICcvc2tpbGxzJyxcbiAgICAgIG5hbWU6ICdza2lsbHMnLFxuICAgICAgY29tcG9uZW50OiAoKSA9PiBpbXBvcnQoJ0Avdmlld3Mvc2tpbGxzL1NraWxsc1ZpZXcudnVlJylcbiAgICB9LFxuICAgIHtcbiAgICAgIHBhdGg6ICcvc2FuZGJveCcsXG4gICAgICBuYW1lOiAnc2FuZGJveCcsXG4gICAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9zYW5kYm94L1NhbmRib3hWaWV3LnZ1ZScpXG4gICAgfSxcbiAgICB7XG4gICAgICBwYXRoOiAnL3NldHRpbmdzJyxcbiAgICAgIG5hbWU6ICdzZXR0aW5ncycsXG4gICAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9zZXR0aW5ncy9TZXR0aW5nc1ZpZXcudnVlJylcbiAgICB9LFxuICAgIHtcbiAgICAgIHBhdGg6ICcvcGVyc29uYWwtY29uZmlnJyxcbiAgICAgIG5hbWU6ICdwZXJzb25hbENvbmZpZycsXG4gICAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9zZXR0aW5ncy9QZXJzb25hbENvbmZpZ1ZpZXcudnVlJylcbiAgICB9LFxuICAgIHtcbiAgICAgIHBhdGg6ICcvdXNlcnMnLFxuICAgICAgbmFtZTogJ3VzZXJzJyxcbiAgICAgIGNvbXBvbmVudDogKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL3VzZXIvVXNlck1hbmFnZW1lbnRWaWV3LnZ1ZScpXG4gICAgfSxcbiAgICB7XG4gICAgICBwYXRoOiAnL2F1ZGl0JyxcbiAgICAgIG5hbWU6ICdhdWRpdCcsXG4gICAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9hdWRpdC9BdWRpdFZpZXcudnVlJylcbiAgICB9LFxuICAgIHtcbiAgICAgIHBhdGg6ICcvdGVhbScsXG4gICAgICBuYW1lOiAndGVhbScsXG4gICAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy90ZWFtL1RlYW1WaWV3LnZ1ZScpXG4gICAgfSxcbiAgICB7XG4gICAgICBwYXRoOiAnL3Byb3ZpZGVycycsXG4gICAgICBuYW1lOiAncHJvdmlkZXJzJyxcbiAgICAgIGNvbXBvbmVudDogKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL3Byb3ZpZGVycy9Qcm92aWRlcnNWaWV3LnZ1ZScpXG4gICAgfSxcbiAgICB7XG4gICAgICBwYXRoOiAnL3dvcmtmbG93cycsXG4gICAgICBuYW1lOiAnd29ya2Zsb3dzJyxcbiAgICAgIGNvbXBvbmVudDogKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL3dvcmtmbG93cy9Xb3JrZmxvd3NWaWV3LnZ1ZScpLFxuICAgICAgbWV0YTogeyB0aXRsZTogJ+W3peS9nOa1gee8luaOkicgfVxuICAgIH0sXG4gICAge1xuICAgICAgcGF0aDogJy9yZXBvc2l0b3J5JyxcbiAgICAgIG5hbWU6ICdyZXBvc2l0b3J5JyxcbiAgICAgIGNvbXBvbmVudDogKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL3JlcG9zaXRvcnkvUmVwb3NpdG9yeVZpZXcudnVlJyksXG4gICAgICBtZXRhOiB7IHRpdGxlOiAn5LuT5bqT566h55CGJyB9XG4gICAgfSxcbiAgICB7XG4gICAgICBwYXRoOiAnL3Byb2R1Y3QtbGluZXMnLFxuICAgICAgbmFtZTogJ3Byb2R1Y3RMaW5lcycsXG4gICAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9wcm9kdWN0bGluZS9Qcm9kdWN0TGluZVZpZXcudnVlJyksXG4gICAgICBtZXRhOiB7IHRpdGxlOiAn5Lqn5ZOB57q/566h55CGJyB9XG4gICAgfSxcbiAgICB7XG4gICAgICBwYXRoOiAnL29wcy1kYXNoYm9hcmQnLFxuICAgICAgbmFtZTogJ29wc0Rhc2hib2FyZCcsXG4gICAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9vcHMvT3BzRGFzaGJvYXJkVmlldy52dWUnKSxcbiAgICAgIG1ldGE6IHsgdGl0bGU6ICfov5DokKXlubPlj7DnnIvmnb8nIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIHBhdGg6ICcvZGV2LWVudicsXG4gICAgICBuYW1lOiAnZGV2RW52JyxcbiAgICAgIGNvbXBvbmVudDogKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL29wcy9EZXZFbnZWaWV3LnZ1ZScpLFxuICAgICAgbWV0YTogeyB0aXRsZTogJ+W8gOWPkeeOr+WigycgfVxuICAgIH0sXG4gICAge1xuICAgICAgcGF0aDogJy9zY2hlZHVsZWQtdGFza3MnLFxuICAgICAgbmFtZTogJ3NjaGVkdWxlZFRhc2tzJyxcbiAgICAgIGNvbXBvbmVudDogKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL3NjaGVkdWxlL1NjaGVkdWxlZFRhc2tWaWV3LnZ1ZScpLFxuICAgICAgbWV0YTogeyB0aXRsZTogJ+WumuaXtuS7u+WKoScgfVxuICAgIH0sXG4gICAge1xuICAgICAgcGF0aDogJy93ZWJob29rJyxcbiAgICAgIG5hbWU6ICd3ZWJob29rJyxcbiAgICAgIGNvbXBvbmVudDogKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL3dlYmhvb2svV2ViaG9va1ZpZXcudnVlJyksXG4gICAgICBtZXRhOiB7IHRpdGxlOiAnV2ViaG9vayDpgJrnn6UnIH1cbiAgICB9LFxuICAgIHtcbiAgICAgIHBhdGg6ICcvZXZhbHVhdGlvbicsXG4gICAgICBuYW1lOiAnZXZhbHVhdGlvbicsXG4gICAgICBjb21wb25lbnQ6ICgpID0+IGltcG9ydCgnQC92aWV3cy9ldmFsdWF0aW9uL0V2YWx1YXRpb25WaWV3LnZ1ZScpLFxuICAgICAgbWV0YTogeyB0aXRsZTogJ0FJIOivhOS8sCcgfVxuICAgIH0sXG4gICAge1xuICAgICAgcGF0aDogJy9jb21wdXRlJyxcbiAgICAgIG5hbWU6ICdjb21wdXRlJyxcbiAgICAgIGNvbXBvbmVudDogKCkgPT4gaW1wb3J0KCdAL3ZpZXdzL2NvbXB1dGUvQ29tcHV0ZVZpZXcudnVlJyksXG4gICAgICBtZXRhOiB7IHRpdGxlOiAn5pys5Zyw566X5YqbJyB9XG4gICAgfSxcbiAgICB7XG4gICAgICBwYXRoOiAnL3N0cnVjdHVyZWQnLFxuICAgICAgbmFtZTogJ3N0cnVjdHVyZWQnLFxuICAgICAgY29tcG9uZW50OiAoKSA9PiBpbXBvcnQoJ0Avdmlld3Mvc3RydWN0dXJlZC9TdHJ1Y3R1cmVkVmlldy52dWUnKSxcbiAgICAgIG1ldGE6IHsgdGl0bGU6ICfnu5PmnoTljJbovpPlh7onIH1cbiAgICB9XG4gIF1cbn0pXG5cbnJvdXRlci5iZWZvcmVFYWNoKCh0bykgPT4ge1xuICBjb25zdCByYXcgPSBsb2NhbFN0b3JhZ2UuZ2V0SXRlbSgnYXV0aCcpIHx8IHNlc3Npb25TdG9yYWdlLmdldEl0ZW0oJ2F1dGgnKVxuICBjb25zdCBpc0xvZ2dlZEluID0gcmF3ICYmIEpTT04ucGFyc2UocmF3KS50b2tlblxuICBpZiAoIXRvLm1ldGEucHVibGljICYmICFpc0xvZ2dlZEluKSB7XG4gICAgcmV0dXJuIHsgbmFtZTogJ2xvZ2luJyB9XG4gIH1cblxuICAvLyDot6/nlLHmnYPpmZDlrojljavvvJrmnIkgdG9rZW4g5L2G5peg55uu5qCH6Lev55Sx5p2D6ZmQ5YiZ6Lez55m75b2VXG4gIGlmIChpc0xvZ2dlZEluICYmICF0by5tZXRhLnB1YmxpYykge1xuICAgIHRyeSB7XG4gICAgICBjb25zdCBhdXRoRGF0YSA9IEpTT04ucGFyc2UocmF3ISlcbiAgICAgIGlmIChhdXRoRGF0YT8udXNlcikge1xuICAgICAgICBjb25zdCB1c2VyID0gYXV0aERhdGEudXNlclxuICAgICAgICBpZiAodXNlci5yb2xlICE9PSAnQURNSU4nICYmIHVzZXIuYWxsb3dlZE1lbnVzICYmIHVzZXIuYWxsb3dlZE1lbnVzICE9PSAnKicpIHtcbiAgICAgICAgICBjb25zdCBtZW51cyA9IEFycmF5LmlzQXJyYXkodXNlci5hbGxvd2VkTWVudXMpID8gdXNlci5hbGxvd2VkTWVudXMgOiBbXVxuICAgICAgICAgIGNvbnN0IHRhcmdldFBhdGggPSB0by5wYXRoXG4gICAgICAgICAgaWYgKCFtZW51cy5pbmNsdWRlcyh0YXJnZXRQYXRoKSkge1xuICAgICAgICAgICAgcmV0dXJuIHsgbmFtZTogJ2xvZ2luJyB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfSBjYXRjaCB7fVxuICB9XG59KVxuXG5leHBvcnQgZGVmYXVsdCByb3V0ZXJcbiJdLCJtYXBwaW5ncyI6IkFBQUEsU0FBUyxjQUFjLHdCQUF3QjtBQUUvQyxNQUFNLFNBQVMsYUFBYTtBQUFBLEVBQzFC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