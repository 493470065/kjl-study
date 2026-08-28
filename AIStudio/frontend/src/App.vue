<template>
  <el-container class="app-container" :class="{ 'login-layout': isLogin }">
    <el-aside v-if="!isLogin" width="200px">
      <div class="logo">景磊的AI工作站</div>
      <el-menu :default-active="activeMenu" router :default-openeds="systemSubMenuOpen"
          background-color="#1e293b" text-color="#cbd5e1" active-text-color="#fff">
        <!-- 工作区 -->
        <el-menu-item-group>
          <el-menu-item v-if="auth.hasMenuAccess('/chat')" index="/chat">
            <el-icon><ChatDotRound /></el-icon>
            <span>AI 对话</span>
          </el-menu-item>
          <el-menu-item v-if="auth.hasMenuAccess('/requirements')" index="/requirements">
            <el-icon><Document /></el-icon>
            <span>需求看板</span>
          </el-menu-item>
        </el-menu-item-group>

        <!-- 资产与能力 -->
        <el-menu-item-group>
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

        <!-- 业务编排 -->
        <el-menu-item-group>
          <el-menu-item v-if="auth.hasMenuAccess('/workflows')" index="/workflows">
            <el-icon><Share /></el-icon>
            <span>工作流编排</span>
          </el-menu-item>
          <el-menu-item v-if="auth.hasMenuAccess('/automate')" index="/automate">
            <el-icon><List /></el-icon>
            <span>自动化管理</span>
          </el-menu-item>
        </el-menu-item-group>

        <!-- 连接与基座 -->
        <el-menu-item-group>
          <el-menu-item v-if="auth.hasMenuAccess('/mcp')" index="/mcp">
            <el-icon><Connection /></el-icon>
            <span>MCP 管理</span>
          </el-menu-item>
          <el-menu-item v-if="auth.hasMenuAccess('/providers')" index="/providers">
            <el-icon><Cpu /></el-icon>
            <span>LLM管理</span>
          </el-menu-item>
        </el-menu-item-group>

        <!-- 隐藏菜单（保留代码，v-if="false" 永不显示，改 true 即可恢复） -->
        <template v-if="false">
        <el-menu-item index="/">
          <el-icon><HomeFilled /></el-icon>
          <span>首页</span>
        </el-menu-item>
        <el-menu-item index="/skills">
          <el-icon><Files /></el-icon>
          <span>Skill 管理</span>
        </el-menu-item>
        <el-menu-item index="/monitor">
          <el-icon><Monitor /></el-icon>
          <span>运行时监控</span>
        </el-menu-item>
        <el-menu-item index="/sandbox">
          <el-icon><Monitor /></el-icon>
          <span>沙箱管理</span>
        </el-menu-item>
        <el-menu-item index="/audit">
          <el-icon><DataLine /></el-icon>
          <span>审计日志</span>
        </el-menu-item>
        <el-menu-item index="/evaluation">
          <el-icon><DataAnalysis /></el-icon>
          <span>AI 评估</span>
        </el-menu-item>
        <el-menu-item index="/structured">
          <el-icon><DataAnalysis /></el-icon>
          <span>结构化输出</span>
        </el-menu-item>
        <el-menu-item index="/compute">
          <el-icon><Monitor /></el-icon>
          <span>本地算力</span>
        </el-menu-item>
        <el-menu-item index="/team">
          <el-icon><OfficeBuilding /></el-icon>
          <span>团队协作</span>
        </el-menu-item>
        </template>
        <template v-if="false">
        <el-menu-item index="/ops-dashboard">
          <el-icon><DataBoard /></el-icon>
          <span>运营平台</span>
        </el-menu-item>
        <el-menu-item index="/dev-env">
          <el-icon><Monitor /></el-icon>
          <span>开发环境</span>
        </el-menu-item>
        <el-sub-menu index="system-group">
          <template #title>
            <el-icon><Setting /></el-icon>
            <span>系统配置</span>
          </template>
          <el-menu-item index="/settings">系统配置</el-menu-item>
          <el-menu-item index="/scheduled-tasks">定时任务</el-menu-item>
          <el-menu-item index="/webhook">Webhook 通知</el-menu-item>
          <el-menu-item index="/product-lines">产品线管理</el-menu-item>
          <el-menu-item index="/repository">仓库管理</el-menu-item>
          <el-menu-item index="/users">账户管理</el-menu-item>
        </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>
    <el-container>
      <el-header v-if="!isLogin">
        <div class="header-left">
          <span class="header-title">景磊的AI工作站</span>
        </div>
        <div class="header-right">
          <el-dropdown trigger="click">
            <span class="header-user-dropdown">
              <el-avatar :size="32" shape="square" style="background: #6366f1; vertical-align: middle;">
                {{ (auth.user?.displayName || auth.user?.username || '?').charAt(0).toUpperCase() }}
              </el-avatar>
              <span class="header-user-name">{{ auth.user?.displayName || auth.user?.username }}</span>
              <el-tag size="small" :type="auth.isAdmin ? 'danger' : 'info'">{{ auth.user?.role }}</el-tag>
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
    <p style="color: #909399; font-size: 13px; margin-bottom: 16px;">用于 MCP 服务认证，请妥善保管，泄露后可重新生成。</p>
    <div style="display: flex; align-items: center; gap: 8px; margin-bottom: 16px;">
      <el-input :model-value="myToken" readonly style="font-family: monospace;">
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
import { computed, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import type { FormInstance, FormRules } from 'element-plus'
import { ElMessage, ElMessageBox } from 'element-plus'
import { HomeFilled, ChatDotRound, Document, Collection, Connection, List, User, Monitor, Setting, DataLine, OfficeBuilding, Cpu, Files, Key, Share, DataBoard, DataAnalysis, ArrowDown, Lock, SwitchButton } from '@element-plus/icons-vue'
import { useAuthStore } from '@/stores/auth'
import { changePassword, getMyToken, regenerateToken } from '@/api/user'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const activeMenu = computed(() => route.path)
const systemSubMenuOpen = computed(() =>
  ['/settings', '/scheduled-tasks', '/product-lines', '/repository', '/users', '/webhook'].includes(route.path) ? ['system-group'] : []
)
const isLogin = computed(() => route.path === '/login')

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
  --el-color-primary: #6366f1;
  --el-color-primary-light-3: #818cf8;
  --el-color-primary-light-5: #a5b4fc;
  --el-color-primary-light-7: #c7d2fe;
  --el-color-primary-light-8: #dde3fe;
  --el-color-primary-light-9: #eef2ff;
  --el-color-primary-dark-2: #4f46e5;
  --el-border-radius-base: 8px;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body, #app {
  height: 100%;
}

.app-container {
  height: 100%;
}

.el-aside {
  background-color: #1e293b;
  overflow-y: auto;
}

.el-aside .logo {
  height: 60px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 15px;
  font-weight: bold;
  color: #f1f5f9;
  background: #0f172a;
  border-bottom: 1px solid #334155;
  padding: 0 12px;
  text-align: center;
  letter-spacing: 0.5px;
}

/* 菜单项间距 */
.el-aside .el-menu-item {
  margin: 2px 8px;
  width: calc(100% - 16px);
  border-radius: 6px;
}

.el-aside .el-menu-item.is-active {
  background-color: #334155 !important;
  position: relative;
}

.el-aside .el-menu-item.is-active::before {
  content: '';
  position: absolute;
  left: 0;
  top: 50%;
  transform: translateY(-50%);
  width: 3px;
  height: 20px;
  background: #6366f1;
  border-radius: 0 3px 3px 0;
}

.el-aside .el-menu-item:hover {
  background-color: #334155 !important;
}

/* 菜单分组分隔符（横线代替文字标题） */
.el-aside .el-menu-item-group__title {
  display: none;
}

.el-aside .el-menu-item-group {
  position: relative;
  margin-top: 8px;
  padding-top: 8px;
}

.el-aside .el-menu-item-group::before {
  content: '';
  position: absolute;
  top: 0;
  left: 16px;
  right: 16px;
  height: 1px;
  background: #334155;
}

.el-aside .el-menu-item-group:first-of-type {
  margin-top: 0;
  padding-top: 0;
}

.el-aside .el-menu-item-group:first-of-type::before {
  display: none;
}

/* 子菜单适配深色主题 */
.el-aside .el-sub-menu__title {
  color: #cbd5e1 !important;
  margin: 2px 8px;
  width: calc(100% - 16px);
  border-radius: 6px;
}

.el-aside .el-sub-menu__title:hover {
  background-color: #334155 !important;
}

.el-aside .el-menu--inline .el-menu-item {
  background-color: #0f172a !important;
  margin: 1px 8px;
  padding-left: 48px !important;
}

.el-aside .el-menu--inline .el-menu-item.is-active {
  background-color: #1e293b !important;
}

.el-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  border-bottom: 1px solid #e2e8f0;
  background: #fff;
  height: 58px !important;
  padding: 0 24px !important;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.header-right {
  display: flex;
  align-items: center;
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
  background: #f1f5f9;
}

.header-user-name {
  font-size: 14px;
  font-weight: 500;
  color: #1e293b;
}

.header-left {
  display: flex;
  align-items: center;
}

.header-title {
  font-size: 16px;
  font-weight: 600;
  color: #303133;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}

.el-main {
  background: #f8fafc;
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
