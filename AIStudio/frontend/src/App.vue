<template>
  <el-container class="app-container" :class="{ 'login-layout': isLogin }">
    <el-aside v-if="!isLogin" :width="sidebarCollapsed ? '64px' : '200px'" :class="{ collapsed: sidebarCollapsed }">
      <div class="logo">
        <span v-if="!sidebarCollapsed">景磊的AI工作站</span>
        <span v-else>站</span>
      </div>
      <el-menu :default-active="activeMenu" router :default-openeds="systemSubMenuOpen"
          :collapse="sidebarCollapsed" :collapse-transition="false"
          background-color="transparent" text-color="#d8d2c2" active-text-color="var(--paper)">
        <!-- 工作台：用户每天打开处理事务的入口 -->
        <el-menu-item-group v-if="anyAccess(['/chat', '/requirements', '/todos'])">
          <template #title><el-divider class="menu-group-divider" /></template>
          <el-menu-item v-if="auth.hasMenuAccess('/chat')" index="/chat">
            <el-icon><ChatDotRound /></el-icon>
            <span>AI 对话</span>
          </el-menu-item>
          <el-menu-item v-if="auth.hasMenuAccess('/requirements')" index="/requirements">
            <el-icon><Document /></el-icon>
            <span>需求看板</span>
          </el-menu-item>
          <el-menu-item v-if="auth.hasMenuAccess('/todos')" index="/todos">
            <el-icon><Bell /></el-icon>
            <span>待办事项</span>
          </el-menu-item>
        </el-menu-item-group>

        <!-- 智能资产：平台沉淀的可复用 AI 能力 -->
        <el-menu-item-group v-if="anyAccess(['/knowledge', '/skills', '/agents'])">
          <template #title><el-divider class="menu-group-divider" /></template>
          <el-menu-item v-if="auth.hasMenuAccess('/knowledge')" index="/knowledge">
            <el-icon><Collection /></el-icon>
            <span>知识库</span>
          </el-menu-item>
          <el-menu-item v-if="auth.hasMenuAccess('/skills')" index="/skills">
            <el-icon><Files /></el-icon>
            <span>Skill 管理</span>
          </el-menu-item>
          <el-menu-item v-if="auth.hasMenuAccess('/agents')" index="/agents">
            <el-icon><User /></el-icon>
            <span>Agent 管理</span>
          </el-menu-item>
        </el-menu-item-group>

        <!-- 自动化编排：把能力串联并落地执行 -->
        <el-menu-item-group v-if="anyAccess(['/workflows', '/automate', '/sandbox'])">
          <template #title><el-divider class="menu-group-divider" /></template>
          <el-menu-item v-if="auth.hasMenuAccess('/workflows')" index="/workflows">
            <el-icon><Share /></el-icon>
            <span>工作流编排</span>
          </el-menu-item>
          <el-menu-item v-if="auth.hasMenuAccess('/automate')" index="/automate">
            <el-icon><List /></el-icon>
            <span>自动化管理</span>
          </el-menu-item>
          <el-menu-item v-if="auth.hasMenuAccess('/sandbox')" index="/sandbox">
            <el-icon><Box /></el-icon>
            <span>沙箱管理</span>
          </el-menu-item>
        </el-menu-item-group>

        <!-- 集成与基座：对外连接与模型底座（MCP 连接 + LLM 基座） -->
        <el-menu-item-group v-if="anyAccess(['/mcp', '/providers'])">
          <template #title><el-divider class="menu-group-divider" /></template>
          <el-menu-item v-if="auth.hasMenuAccess('/mcp')" index="/mcp">
            <el-icon><Connection /></el-icon>
            <span>MCP 管理</span>
          </el-menu-item>
          <el-menu-item v-if="auth.hasMenuAccess('/providers')" index="/providers">
            <el-icon><Cpu /></el-icon>
            <span>LLM 管理</span>
          </el-menu-item>
        </el-menu-item-group>

        <!--
          其余页面（首页、运行时监控、审计、评估、结构化输出、本地算力、团队协作、
          运营看板、开发环境、定时任务、Webhook、产品线、仓库、账户管理、TFS 看板）
          维持隐藏：路由仍可直接通过 URL 访问，需要开放时在此按 hasMenuAccess 添加即可。
        -->
      </el-menu>
    </el-aside>
    <el-container>
      <el-header v-if="!isLogin">
        <div class="header-left">
          <el-button text class="sidebar-collapse-btn"
                     :aria-label="sidebarCollapsed ? '展开侧栏' : '收起侧栏'"
                     @click="sidebarCollapsed = !sidebarCollapsed">
            <el-icon><Fold v-if="!sidebarCollapsed" /><Expand v-else /></el-icon>
          </el-button>
          <span class="header-title">景磊的AI工作站</span>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click">
            <span class="header-user-dropdown">
              <el-avatar :size="32" shape="square" style="background: var(--seal); vertical-align: middle;">
                {{ (auth.user?.displayName || auth.user?.username || '?').charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="header-user-name">{{ auth.user?.displayName || auth.user?.username }}</span>
              <el-tag size="small" :type="auth.isAdmin ? 'primary' : 'info'">{{ auth.user?.role }}</el-tag>
              <el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </span>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item @click="pwdDialogVisible = true">
                  <el-icon><Lock /></el-icon>修改密码
                </el-dropdown-item>
                <el-dropdown-item @click="handleShowToken">
                  <el-icon><Key /></el-icon>查看令牌
                </el-dropdown-item>
                <el-dropdown-item divided @click="handleLogout">
                  <el-icon><SwitchButton /></el-icon>退出登录
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </el-header>
      <el-main>
        <router-view />
      </el-main>
    </el-container>
  </el-container>

  <!-- 修改密码弹窗 -->
  <el-dialog v-if="!isLogin" v-model="pwdDialogVisible" title="修改密码" width="420px" @close="resetPwdForm">
    <el-form :model="pwdForm" label-width="100px" :rules="pwdRules" ref="pwdFormRef">
      <el-form-item label="当前密码" prop="oldPassword">
        <el-input v-model="pwdForm.oldPassword" type="password" show-password placeholder="输入当前密码" />
      </el-form-item>
      <el-form-item label="新密码" prop="newPassword">
        <el-input v-model="pwdForm.newPassword" type="password" show-password placeholder="输入新密码" />
      </el-form-item>
      <el-form-item label="确认新密码" prop="confirmPassword">
        <el-input v-model="pwdForm.confirmPassword" type="password" show-password placeholder="再次输入新密码" />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="pwdDialogVisible = false">取消</el-button>
      <el-button type="primary" @click="handleChangePassword" :loading="pwdSaving">确认修改</el-button>
    </template>
  </el-dialog>

  <!-- 个人令牌弹窗 -->
  <el-dialog v-if="!isLogin" v-model="tokenDialogVisible" title="个人 API 令牌" width="480px">
    <p style="color: var(--ink-text-secondary); font-size: 13px; margin-bottom: 16px;">用于 MCP 服务认证，请妥善保管，泄露后可重新生成。</p>
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
      <el-input :model-value="myToken" readonly style="font-family: var(--app-font-mono);">
        <template #append>
          <el-button @click="handleCopyToken">复制</el-button>
        </template>
      </el-input>
    </div>
    <template #footer>
      <el-button @click="tokenDialogVisible = false">关闭</el-button>
      <el-button type="warning" @click="handleRegenerateToken" :loading="tokenRegenerating">重新生成令牌</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { HomeFilled, ChatDotRound, Document, Collection, Connection, List, User, Monitor, Setting, DataLine, OfficeBuilding, Cpu, Files, Key, Share, DataAnalysis, ArrowDown, Lock, SwitchButton, Fold, Expand, Clock, Link, Box, Bell } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { changePassword, getMyToken, regenerateToken } from '@/api/user'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const activeMenu = computed(() => route.path)
const systemSubMenuOpen = computed(() =>
  ['/scheduled-tasks', '/product-lines', '/repository', '/users', '/webhook'].includes(route.path) ? ['system-group'] : []
)
const isLogin = computed(() => route.path === '/login')

/** 分组内任一菜单可访问时显示该分组（权限过滤后避免出现空分组/孤立分隔线） */
function anyAccess(paths: string[]): boolean {
  return auth.isAdmin || paths.some(p => auth.hasMenuAccess(p))
}

// 侧栏折叠：窄屏（≤1280px）自动收起为图标栏，可手动切换
const sidebarCollapsed = ref(window.innerWidth <= 1280)
onMounted(() => {
  const mq = window.matchMedia('(max-width: 1280px)')
  const onChange = (e: MediaQueryListEvent) => { sidebarCollapsed.value = e.matches }
  mq.addEventListener?.('change', onChange)
})

function handleLogout() {
  auth.logout()
  router.push('/login')
}

// 修改密码
const pwdDialogVisible = ref(false)
const pwdSaving = ref(false)
const pwdFormRef = ref<FormInstance>()
const pwdForm = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
})

const pwdRules: FormRules = {
  oldPassword: [{ required: true, message: '请输入当前密码', trigger: 'blur' }],
  newPassword: [{ required: true, message: '请输入新密码', trigger: 'blur' }],
  confirmPassword: [
    { required: true, message: '请确认新密码', trigger: 'blur' },
    {
      validator: (_rule: any, value: string, callback: any) => {
        if (value !== pwdForm.newPassword) {
          callback(new Error('两次输入的密码不一致'))
        } else {
          callback()
        }
      },
      trigger: 'blur'
    }
  ]
}

function resetPwdForm() {
  pwdForm.oldPassword = ''
  pwdForm.newPassword = ''
  pwdForm.confirmPassword = ''
  pwdFormRef.value?.clearValidate()
}

// ========== 个人令牌 ==========
const tokenDialogVisible = ref(false)
const myToken = ref('')
const tokenRegenerating = ref(false)

async function handleShowToken() {
  try {
    const data = await getMyToken()
    myToken.value = data.token
    tokenDialogVisible.value = true
  } catch (e: any) {
    ElMessage.error('获取令牌失败')
  }
}

async function handleRegenerateToken() {
  try {
    await ElMessageBox.confirm('重新生成后，旧令牌立即失效。确定继续？', '确认', { type: 'warning' })
    tokenRegenerating.value = true
    const data = await regenerateToken()
    myToken.value = data.token
    ElMessage.success('令牌已重新生成')
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('重新生成失败')
  } finally {
    tokenRegenerating.value = false
  }
}

function handleCopyToken() {
  navigator.clipboard.writeText(myToken.value)
  ElMessage.success('已复制到剪贴板')
}

async function handleChangePassword() {
  const valid = await pwdFormRef.value?.validate().catch(() => false)
  if (!valid) return
  pwdSaving.value = true
  try {
    await changePassword(pwdForm.oldPassword, pwdForm.newPassword)
    ElMessage.success('密码修改成功')
    pwdDialogVisible.value = false
  } catch (e: any) {
    ElMessage.error('密码修改失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    pwdSaving.value = false
  }
}
</script>

<style>
:root {
  /* ===== 江南水墨主题 · 色板 ===== */
  /* 黛青：主题色（靛青颜料，沉稳如墨） */
  --el-color-primary: #41556d;
  --el-color-primary-light-3: #6e7f91;
  --el-color-primary-light-5: #93a1b1;
  --el-color-primary-light-7: #bcc4cf;
  --el-color-primary-light-8: #d5dae1;
  --el-color-primary-light-9: #edeff3;
  --el-color-primary-dark-2: #334356;
  /* 墨色：侧栏框架 */
  --ink-deep: #201f1c;
  --ink: #2c2a26;
  --ink-light: #4a4741;
  --ink-text-on-dark: #d8d2c2;
  /* 宣纸：页面底色 */
  --paper: #f6f3ec;
  --paper-light: #f0ebdf;
  --paper-card: #fbf9f4;
  --paper-border: #e3ddce;
  /* 朱砂：印章点缀 */
  --seal: #a8452f;
  /* 数据可视化色板：流程事件、图谱节点、图表系列专用（不属于语义色，不与状态色混用） */
  --viz-blue: #2196f3;
  --viz-indigo: #337ecc;
  --viz-orange: #ff9800;
  --viz-purple: #a855f7;
  --viz-violet: #722ed1;
  --viz-magenta: #eb2f96;
  --viz-cyan: #00bcd4;
  --viz-teal: #1abc9c;
  --viz-green: #2ecc71;
  --viz-slate: #34495e;
  --viz-gray: #73767a;
  /* 墨分五色：文本（次级文字加深至 ≥4.5:1，满足 WCAG AA） */
  --ink-text: #3d3a34;
  --ink-text-regular: #5f5b52;
  --ink-text-secondary: #6f6a5e;

  --el-border-radius-base: 8px;
  /* Element Plus 文本/边框/填充同步为水墨色板 */
  --el-text-color-primary: var(--ink-text);
  --el-text-color-regular: var(--ink-text-regular);
  --el-text-color-secondary: var(--ink-text-secondary);
  --el-text-color-placeholder: #b8b1a0;
  --el-border-color: #d8d0bf;
  --el-border-color-light: var(--paper-border);
  --el-border-color-lighter: #ebe6d8;
  --el-border-color-extra-light: #f1ede1;
  --el-fill-color: #f3efe4;
  --el-fill-color-light: #f5f2ea;
  --el-fill-color-lighter: #f8f5ed;
  --el-fill-color-extra-light: var(--paper-card);
  --el-bg-color: var(--paper-card);
  --el-bg-color-page: var(--paper);
  --el-card-bg-color: var(--paper-card);
  /* 全站统一字体：正文用系统字体栈（中文落到微软雅黑），等宽字体用于代码/密钥/ID */
  --app-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", sans-serif;
  --app-font-mono: Consolas, Menlo, Monaco, "Courier New", monospace;
  /* Element Plus 组件字体同步为全站正文字体 */
  --el-font-family: var(--app-font-sans);
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
}

body {
  font-family: var(--app-font-sans);
  color: var(--ink-text);
  /* 宣纸底 + 远山薄雾：黛色晕染由远及近，似江南烟雨 */
  background:
    radial-gradient(ellipse 52% 36% at 88% -6%, rgba(65, 85, 109, 0.08), transparent 65%),
    radial-gradient(ellipse 40% 30% at -4% 106%, rgba(65, 85, 109, 0.07), transparent 65%),
    linear-gradient(180deg, #f7f4ec 0%, var(--el-fill-color) 100%);
  background-attachment: fixed;
}

.app-container {
  height: 100%;
}

/* 侧栏：浓墨立轴，自上而下渐深 */
.el-aside {
  background: linear-gradient(180deg, #2e2c27 0%, #232220 55%, var(--ink-deep) 100%);
  overflow-y: auto;
}

.el-aside .el-menu {
  background-color: transparent !important;
}

/* 折叠态：窄栏图标菜单 */
.el-aside.collapsed .el-menu-item {
  margin: 2px 6px;
  width: calc(100% - 12px);
  padding: 0 !important;
  display: flex;
  justify-content: center;
}

.el-aside.collapsed .el-sub-menu__title {
  margin: 2px 6px;
  width: calc(100% - 12px);
  padding: 0 !important;
  display: flex;
  justify-content: center;
}

.el-aside.collapsed .logo {
  font-size: 18px;
  padding: 0;
}

.sidebar-collapse-btn {
  color: var(--ink-text-regular);
  font-size: 16px;
}

.el-aside .logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: bold;
  color: var(--paper);
  background: var(--ink-deep);
  border-bottom: 1px solid var(--ink-light);
  padding: 0 12px;
  text-align: center;
  letter-spacing: 0.5px;
}

/* Logo 末尾的朱砂小印 */
.el-aside .logo::after {
  content: '景';
  margin-left: 8px;
  width: 20px;
  height: 20px;
  flex: none;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--seal);
  color: var(--paper);
  font-size: 12px;
  font-weight: 600;
  border-radius: 3px;
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.25);
}

/* 菜单项间距 */
.el-aside .el-menu-item {
  margin: 2px 8px;
  width: calc(100% - 16px);
  border-radius: 6px;
}

.el-aside .el-menu-item.is-active {
  background-color: var(--ink-light) !important;
  position: relative;
}

/* 激活菜单左侧一笔朱砂 */
.el-aside .el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: var(--seal);
  border-radius: 0 3px 3px 0;
}

.el-aside .el-menu-item:hover {
  background-color: var(--ink-light) !important;
}

/* 菜单分组：不再显示中文组名，改用贯通分隔符代替 */
.el-aside .el-menu-item-group__title {
  padding: 6px 14px 2px;
}

.el-aside .menu-group-divider {
  margin: 2px 0;
  border-top: 1px solid rgba(216, 210, 194, 0.18);
}

.el-aside.collapsed .el-menu-item-group__title {
  padding: 6px 0 2px;
}

.el-aside.collapsed .menu-group-divider {
  margin: 2px 6px;
}

.el-aside .el-menu-item-group {
  position: relative;
}

/* 子菜单适配墨色主题 */
.el-aside .el-sub-menu__title {
  color: var(--ink-text-on-dark) !important;
  margin: 2px 8px;
  width: calc(100% - 16px);
  border-radius: 6px;
}

.el-aside .el-sub-menu__title:hover {
  background-color: var(--ink-light) !important;
}

.el-aside .el-menu--inline .el-menu-item {
  background-color: var(--ink-deep) !important;
  margin: 1px 8px;
  padding-left: 48px !important;
}

.el-aside .el-menu--inline .el-menu-item.is-active {
  background-color: var(--ink) !important;
}

/* 顶栏：宣纸蒙纱，下缘一道淡墨 */
.el-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid var(--paper-border);
  background: rgba(251, 249, 244, 0.88);
  backdrop-filter: blur(8px);
  height: 58px !important;
  padding: 0 24px !important;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.header-user-dropdown {
  display: flex;
  align-items: center;
  gap: 10px;
  cursor: pointer;
  padding: 4px 12px 4px 4px;
  border-radius: 8px;
  transition: background 0.2s;
}

.header-user-dropdown:hover {
  background: var(--paper-light);
}

.header-user-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--ink-text);
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: var(--ink-text);
  letter-spacing: 1px;
}

/* 主内容区：透出宣纸与远山底色 */
.el-main {
  background: transparent;
  padding: 24px;
  min-height: 0;
}

.app-container > .el-main {
  padding: 24px;
}

.login-layout > .el-container > .el-main {
  padding: 0;
}
</style>
