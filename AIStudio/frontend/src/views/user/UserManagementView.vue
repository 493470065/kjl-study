<template>
  <page-container title="账户管理" no-card>

    <el-tabs v-model="activeTab">
      <el-tab-pane label="用户管理" name="users">
        <div class="tab-toolbar">
          <el-button type="primary" @click="openCreate">新增用户</el-button>
        </div>

        <el-table :data="users" v-loading="loading" stripe>
          <el-table-column prop="empNo" label="工号" width="100" />
          <el-table-column prop="username" label="域账户" width="140" />
          <el-table-column prop="displayName" label="姓名" width="120" />
          <el-table-column prop="role" label="角色" width="120">
            <template #default="{ row }">
              <!-- danger 仅留给失败/危险：管理员角色用主题色标识 -->
              <el-tag :type="row.role === 'ADMIN' ? 'primary' : 'info'" size="small">
                {{ row.role === 'ADMIN' ? '管理员' : '普通用户' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="enabled" label="状态" width="100">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'warning'" size="small">
                {{ row.enabled ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column label="LLM" min-width="180">
            <template #default="{ row }">
              <template v-if="row.llmProvider">
                <div style="font-size: 13px;">{{ row.llmProvider }}</div>
                <div style="font-size: 11px; color: var(--ink-text-secondary);" v-if="row.llmModel">{{ row.llmModel }}</div>
              </template>
              <span v-else style="color: #b8b1a0;">未配置</span>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">
              {{ formatTime(row.createdAt) }}
            </template>
          </el-table-column>
          <el-table-column label="操作" min-width="320">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button link type="primary" size="small" @click="handleResetPassword(row)">重置密码</el-button>
              <el-button v-if="row.llmProvider" link type="info" size="small" @click="showLlmConfig(row)">LLM</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)"
                         :disabled="row.username === 'admin'">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <el-tab-pane label="角色管理" name="roles">
        <el-row :gutter="20">
          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-tag type="danger" size="large">ADMIN</el-tag>
                  <span class="role-desc">管理员</span>
                </div>
              </template>
              <el-alert type="info" :closable="false" show-icon style="margin-bottom: 16px;">
                管理员默认拥有全部菜单权限，无需单独配置。
              </el-alert>
              <el-checkbox-group v-model="adminMenus" disabled>
                <template v-for="item in groupedMenuOptions" :key="'admin-' + item.path">
                  <div v-if="item.isGroupHeader" style="font-weight: bold; margin: 12px 0 4px; color: var(--ink-text); font-size: 13px; border-bottom: 1px solid var(--el-border-color-lighter); padding-bottom: 4px;">
                    {{ item.label }}
                  </div>
                  <div v-else class="menu-checkbox">
                    <el-checkbox :label="item.path" :disabled="true">{{ item.label }}</el-checkbox>
                  </div>
                </template>
              </el-checkbox-group>
            </el-card>
          </el-col>

          <el-col :span="12">
            <el-card shadow="hover">
              <template #header>
                <div class="card-header">
                  <el-tag type="info" size="large">USER</el-tag>
                  <span class="role-desc">普通用户</span>
                </div>
              </template>
              <div class="checkbox-toolbar">
                <el-button size="small" @click="userMenus = menuOptions.map(m => m.path)">全选</el-button>
                <el-button size="small" @click="userMenus = []">清空</el-button>
              </div>
              <el-checkbox-group v-model="userMenus">
                <template v-for="item in groupedMenuOptions" :key="'user-' + item.path">
                  <div v-if="item.isGroupHeader" style="font-weight: bold; margin: 12px 0 4px; color: var(--ink-text); font-size: 13px; border-bottom: 1px solid var(--el-border-color-lighter); padding-bottom: 4px;">
                    {{ item.label }}
                  </div>
                  <div v-else class="menu-checkbox">
                    <el-checkbox :label="item.path">{{ item.label }}</el-checkbox>
                  </div>
                </template>
              </el-checkbox-group>
              <div class="save-footer">
                <el-button type="primary" :loading="roleSaving" @click="handleSaveRole">保存 USER 角色权限</el-button>
              </div>
            </el-card>
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- 新建/编辑用户对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="460px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="工号" prop="empNo">
          <el-input v-model="form.empNo" placeholder="请输入工号" />
        </el-form-item>
        <el-form-item label="域账户" prop="username">
          <el-input v-model="form.username" placeholder="请输入域账户" />
        </el-form-item>
        <el-form-item label="姓名" prop="displayName">
          <el-input v-model="form.displayName" placeholder="请输入姓名" />
        </el-form-item>
        <el-form-item v-if="!isEdit" label="密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="登录密码" />
        </el-form-item>
        <el-form-item v-if="isEdit" label="新密码" prop="password">
          <el-input v-model="form.password" type="password" show-password placeholder="留空则不修改" />
        </el-form-item>
        <el-form-item label="角色" prop="role">
          <el-select v-model="form.role" style="width: 100%">
            <el-option label="管理员 (ADMIN)" value="ADMIN" />
            <el-option label="普通用户 (USER)" value="USER" />
          </el-select>
        </el-form-item>
        <el-form-item v-if="isEdit" label="状态" prop="enabled">
          <el-switch v-model="form.enabled" active-text="启用" inactive-text="禁用" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>

    <!-- LLM 配置查看对话框 -->
    <el-dialog v-model="llmDialogVisible" title="用户 LLM 配置" width="480px">
      <el-descriptions :column="1" border v-if="llmConfig">
        <el-descriptions-item label="Provider">{{ llmConfig.providerName }}</el-descriptions-item>
        <el-descriptions-item label="模型">{{ llmConfig.modelName }}</el-descriptions-item>
        <el-descriptions-item label="API Key">
          <span style="font-family: var(--app-font-mono); word-break: break-all;">{{ llmConfig.apiKey }}</span>
        </el-descriptions-item>
        <el-descriptions-item label="状态">
          <el-tag :type="llmConfig.enabled ? 'success' : 'warning'" size="small">
            {{ llmConfig.enabled ? '启用' : '禁用' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <template #footer>
        <el-button @click="llmDialogVisible = false">关闭</el-button>
      </template>
    </el-dialog>
  </page-container>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { useConfirmDelete } from '@/composables/useConfirmDelete'

const { confirmDelete } = useConfirmDelete()
import { userApi, type UserInfo } from '@/api/user'
import { getRolePermissions, updateRolePermission } from '@/api/rolePermission'
import http from '@/api/http'
import { formatDateTime } from '@/utils/format'

const activeTab = ref('users')

const menuOptions = [
  { label: '首页', path: '/' },
  { label: 'AI 对话', path: '/chat' },
  { label: '需求看板', path: '/requirements' },
  { label: '知识库', path: '/knowledge' },
  { label: 'MCP 管理', path: '/mcp' },
  { label: '自动化管理', path: '/automate' },
  { label: 'Agent 管理', path: '/agents' },
  { label: 'Skill 管理', path: '/skills' },
  { label: '沙箱管理', path: '/sandbox' },
  { label: '运营平台', path: '/ops-dashboard' },
  { label: '开发环境', path: '/dev-env' },
  { label: '账户管理', path: '/users', group: 'system-config' },
  { label: '仓库管理', path: '/repository', group: 'system-config' },
  { label: '定时任务', path: '/scheduled-tasks', group: 'system-config' },
  { label: '系统配置', path: '/settings', group: 'system-config' },
  { label: '个人配置', path: '/personal-config' },
  { label: '审计日志', path: '/audit' },
  { label: '团队协作', path: '/team' },
  { label: 'LLM Provider', path: '/providers' },
  { label: '工作流编排', path: '/workflows' },
]

const groupedMenuOptions = computed(() => {
  const result: Array<{ label: string; path: string; isGroupHeader?: boolean }> = []
  const groupItems: Array<{ label: string; path: string }> = []
  for (const menu of menuOptions) {
    if ((menu as any).group) {
      groupItems.push({ label: menu.label, path: menu.path })
    } else {
      result.push({ label: menu.label, path: menu.path })
    }
  }
  if (groupItems.length > 0) {
    result.push({ label: '系统配置', path: '', isGroupHeader: true })
    result.push(...groupItems)
  }
  return result
})

// === 用户管理 ===
const users = ref<UserInfo[]>([])
const loading = ref(false)
const dialogVisible = ref(false)
const saving = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const formRef = ref<FormInstance>()

const form = reactive({
  empNo: '',
  username: '',
  displayName: '',
  password: '',
  role: 'USER',
  enabled: true,
})

const rules: FormRules = {
  empNo: [
    { required: true, message: '请输入工号', trigger: 'blur' },
  ],
  username: [
    { required: true, message: '请输入域账户', trigger: 'blur' },
  ],
  displayName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur',
    validator: (_rule, value, callback) => {
      if (!isEdit.value && (!value || !value.trim())) {
        callback(new Error('请输入密码'))
      } else {
        callback()
      }
    }
  }]
}

function formatTime(s?: string): string {
  return s ? formatDateTime(s) : ''
}

async function loadUsers() {
  loading.value = true
  try {
    users.value = await userApi.listUsers()
  } catch (e: any) {
    ElMessage.error('加载用户列表失败: ' + (e.response?.data?.error || e.message))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  isEdit.value = false
  editingId.value = null
  Object.assign(form, { empNo: '', username: '', displayName: '', password: '', role: 'USER', enabled: true })
  dialogVisible.value = true
}

function openEdit(row: UserInfo) {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(form, {
    empNo: row.empNo || '',
    username: row.username,
    displayName: row.displayName,
    password: '',
    role: row.role,
    enabled: row.enabled,
  })
  dialogVisible.value = true
}

async function handleSave() {
  if (!formRef.value) return
  try {
    await formRef.value.validate()
  } catch { return }

  saving.value = true
  try {
    if (isEdit.value && editingId.value) {
      const data: any = { displayName: form.displayName, role: form.role, enabled: form.enabled, empNo: form.empNo, username: form.username }
      if (form.password && form.password.trim()) {
        data.password = form.password
      }
      await userApi.updateUser(editingId.value, data)
      ElMessage.success('更新成功')
    } else {
      await userApi.createUser({
        username: form.username,
        password: form.password,
        role: form.role,
        displayName: form.displayName,
        empNo: form.empNo,
      })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    loadUsers()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '操作失败')
  } finally {
    saving.value = false
  }
}

async function handleResetPassword(row: UserInfo) {
  const { value } = await ElMessageBox.prompt(`请输入 ${row.username} 的新密码`, '重置密码', {
    inputPattern: /.+/,
    inputErrorMessage: '密码不能为空',
    inputType: 'password'
  })
  try {
    await userApi.resetPassword(row.id, value)
    ElMessage.success('密码已重置')
  } catch (e: any) {
    ElMessage.error('重置失败: ' + (e.response?.data?.error || e.message))
  }
}

async function handleDelete(row: UserInfo) {
  if (!await confirmDelete(`用户 "${row.username}"`, '确认删除')) return
  try {
    await userApi.deleteUser(row.id)
    ElMessage.success('已删除')
    loadUsers()
  } catch {
    // 接口错误已由统一错误出口提示
  }
}

// === LLM 配置查看 ===
const llmDialogVisible = ref(false)
const llmConfig = ref<any>(null)

async function showLlmConfig(row: UserInfo) {
  try {
    const res = await http.get(`/users/${row.id}/llm-config`)
    llmConfig.value = res.data
    llmDialogVisible.value = true
  } catch (e: any) {
    ElMessage.error('加载 LLM 配置失败')
  }
}

// === 角色管理 ===
const adminMenus = ref<string[]>(menuOptions.map(m => m.path))
const userMenus = ref<string[]>([])
const roleSaving = ref(false)

async function loadRolePermissions() {
  try {
    const data = await getRolePermissions()
    if (data && Array.isArray(data)) {
      const userPerm = data.find((p: any) => p.role === 'USER')
      if (userPerm) {
        const menus = userPerm.allowedMenus
        if (menus === '*' || (Array.isArray(menus) && menus.includes('*'))) {
          userMenus.value = menuOptions.map(m => m.path)
        } else if (Array.isArray(menus)) {
          userMenus.value = menus
        }
      }
    }
  } catch {}
}

async function handleSaveRole() {
  roleSaving.value = true
  try {
    await updateRolePermission('USER', userMenus.value)
    ElMessage.success('USER 角色权限已保存')
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.response?.data?.error || e.message))
  } finally {
    roleSaving.value = false
  }
}

onMounted(() => {
  loadUsers()
  loadRolePermissions()
})
</script>

<style scoped>
.user-management {
  padding: 0;
}
.tab-toolbar {
  margin-bottom: 16px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.role-desc {
  font-size: 15px;
  color: var(--ink-text-regular);
}
.checkbox-toolbar {
  margin-bottom: 12px;
}
.menu-checkbox {
  margin-bottom: 6px;
}
.save-footer {
  margin-top: 20px;
  text-align: right;
  padding-top: 16px;
  border-top: 1px solid #ede8da;
}
</style>
