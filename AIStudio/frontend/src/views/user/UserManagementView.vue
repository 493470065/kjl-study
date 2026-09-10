<template>
  <page-container title="账户管理" no-card>

    <el-tabs v-model="activeTab">
      <!-- ==================== 用户管理 ==================== -->
      <el-tab-pane label="用户管理" name="users">
        <div class="tab-toolbar">
          <el-input v-model="searchText" placeholder="搜索姓名 / 登录账号 / 工号" clearable
                    style="width: 240px;" :prefix-icon="Search" />
          <el-select v-model="roleFilter" placeholder="全部角色" clearable style="width: 160px;">
            <el-option v-for="r in roles" :key="r.role" :label="r.label" :value="r.role" />
          </el-select>
          <el-button type="primary" @click="openCreate">新增用户</el-button>
          <div class="toolbar-spacer" />
          <span class="count-hint">共 {{ filteredUsers.length }} 个用户</span>
        </div>

        <el-table :data="filteredUsers" v-loading="loading" stripe>
          <el-table-column prop="empNo" label="工号" width="100" />
          <el-table-column prop="username" label="登录账号" width="140" />
          <el-table-column prop="displayName" label="姓名" width="120" />
          <el-table-column label="角色" width="140">
            <template #default="{ row }">
              <el-tooltip :content="row.role" placement="top" :hide-after="0">
                <el-tag :type="roleTagType(row.role)" size="small">{{ roleLabel(row.role) }}</el-tag>
              </el-tooltip>
            </template>
          </el-table-column>
          <el-table-column label="可见菜单" min-width="110">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="showUserMenus(row)">
                {{ menusCount(row) }} 项
              </el-button>
            </template>
          </el-table-column>
          <el-table-column prop="enabled" label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="row.enabled ? 'success' : 'warning'" size="small">
                {{ row.enabled ? '启用' : '禁用' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="170">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" min-width="240" fixed="right">
            <template #default="{ row }">
              <el-button link type="primary" size="small" @click="openEdit(row)">编辑</el-button>
              <el-button link type="primary" size="small" @click="handleResetPassword(row)">重置密码</el-button>
              <el-button v-if="row.llmProvider" link type="info" size="small" @click="showLlmConfig(row)">LLM</el-button>
              <el-button link type="danger" size="small" @click="handleDelete(row)"
                         :disabled="row.username === 'admin'">删除</el-button>
            </template>
          </el-table-column>
        </el-table>

        <el-alert type="info" :closable="false" show-icon style="margin-top: 14px;">
          用户的可见菜单由其<b>角色配置</b>决定；调整角色菜单后，用户重新登录即可生效。
        </el-alert>
      </el-tab-pane>

      <!-- ==================== 角色管理 ==================== -->
      <el-tab-pane label="角色管理" name="roles">
        <el-row :gutter="20">
          <!-- 左：角色列表 -->
          <el-col :span="8">
            <el-card shadow="hover" class="role-list-card">
              <template #header>
                <div class="card-header">
                  <span class="card-title">角色列表</span>
                  <el-button type="primary" size="small" @click="openRoleCreate">新增角色</el-button>
                </div>
              </template>
              <div v-for="r in roles" :key="r.role"
                   class="role-item" :class="{ active: r.role === selectedRole }"
                   @click="selectRole(r.role)">
                <div class="role-item-head">
                  <span class="role-item-label">{{ r.label }}</span>
                  <el-tag v-if="r.role === 'SUPER_ADMIN'" type="danger" size="small">超级</el-tag>
                  <el-tag v-else-if="r.builtin" type="warning" size="small">内置</el-tag>
                  <span class="role-item-actions" @click.stop>
                    <el-button link type="primary" size="small" @click="openRoleEdit">编辑</el-button>
                    <el-button v-if="!r.builtin" link type="danger" size="small" @click="handleRoleDelete">删除</el-button>
                  </span>
                </div>
                <div class="role-item-code">{{ r.role }}</div>
                <div v-if="r.description" class="role-item-desc">{{ r.description }}</div>
                <div class="role-item-menus">
                  {{ r.allowedMenus === '*' ? '全部菜单' : `${(r.allowedMenus || []).length} 项菜单` }}
                </div>
              </div>
            </el-card>
          </el-col>

          <!-- 右：菜单权限配置 -->
          <el-col :span="16">
            <el-card shadow="hover" v-if="currentRole">
              <template #header>
                <div class="card-header">
                  <span class="card-title">菜单权限 · {{ currentRole.label }}</span>
                  <el-tag size="small" type="info">{{ currentRole.role }}</el-tag>
                </div>
              </template>

              <el-alert v-if="currentRole.role === 'SUPER_ADMIN'" type="warning" :closable="false" show-icon
                        style="margin-bottom: 14px;">
                超级管理员固定拥有全部菜单，无需配置。
              </el-alert>
              <template v-else>
                <div class="checkbox-toolbar">
                  <el-button size="small" @click="selectAllMenus">全选</el-button>
                  <el-button size="small" @click="editingMenus = []">清空</el-button>
                  <span class="select-hint">已选 {{ editingMenus.length }} 项</span>
                </div>

                <div class="menu-tree">
                  <div v-for="g in MENU_GROUPS" :key="g.key" class="menu-group-block">
                    <div class="menu-group-head">
                      <el-checkbox :model-value="isGroupChecked(g)"
                                   :indeterminate="isGroupIndeterminate(g)"
                                   @change="toggleGroup(g, $event as boolean)">
                        <b>{{ g.label }}</b>
                      </el-checkbox>
                    </div>
                    <div class="menu-group-items">
                      <el-checkbox v-for="i in g.items" :key="i.path" :value="i.path"
                                   v-model="menuCheckModel[i.path]">
                        {{ i.label }}<span v-if="i.visible === false" class="menu-hidden-tag">未开放</span>
                      </el-checkbox>
                    </div>
                  </div>
                </div>

                <div class="save-footer">
                  <el-button type="primary" :loading="roleSaving" @click="handleSaveRoleMenus">
                    保存「{{ currentRole.label }}」菜单权限
                  </el-button>
                </div>
              </template>
            </el-card>
            <el-empty v-else description="请在左侧选择一个角色" />
          </el-col>
        </el-row>
      </el-tab-pane>
    </el-tabs>

    <!-- 新建/编辑用户对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑用户' : '新增用户'" width="480px" destroy-on-close>
      <el-form :model="form" :rules="rules" ref="formRef" label-width="90px">
        <el-form-item label="工号" prop="empNo">
          <el-input v-model="form.empNo" placeholder="请输入工号" />
        </el-form-item>
        <el-form-item label="登录账号" prop="username">
          <el-input v-model="form.username" placeholder="请输入登录账号" />
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
            <el-option v-for="r in roles" :key="r.role"
                       :label="`${r.label} (${r.role})`" :value="r.role" />
          </el-select>
          <div v-if="formRoleMenusHint" class="form-hint">{{ formRoleMenusHint }}</div>
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

    <!-- 新建/编辑角色对话框 -->
    <el-dialog v-model="roleDialogVisible" :title="roleIsEdit ? '编辑角色' : '新增角色'" width="460px" destroy-on-close>
      <el-form :model="roleForm" :rules="roleRules" ref="roleFormRef" label-width="90px">
        <el-form-item label="角色编码" prop="role">
          <el-input v-model="roleForm.role" :disabled="roleIsEdit"
                    placeholder="大写字母/数字/下划线，如 VIEWER" />
        </el-form-item>
        <el-form-item label="角色术语" prop="label">
          <el-input v-model="roleForm.label" placeholder="界面显示名，如：只读访客" maxlength="20" show-word-limit />
        </el-form-item>
        <el-form-item label="说明" prop="description">
          <el-input v-model="roleForm.description" type="textarea" :rows="2" maxlength="100" show-word-limit
                    placeholder="角色用途说明（可选）" />
        </el-form-item>
        <el-form-item label="排序" prop="sortOrder">
          <el-input-number v-model="roleForm.sortOrder" :min="1" :max="99" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="roleDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="roleFormSaving" @click="handleSaveRoleForm">确定</el-button>
      </template>
    </el-dialog>

    <!-- 用户可见菜单抽屉 -->
    <el-drawer v-model="menusDrawerVisible" :title="menusDrawerTitle" size="340px">
      <template v-if="menusDrawerList === '*'">
        <el-alert type="warning" :closable="false" show-icon style="margin-bottom: 12px;">该用户拥有全部菜单</el-alert>
        <div v-for="g in MENU_GROUPS" :key="g.key" class="drawer-group">
          <div class="drawer-group-title">{{ g.label }}</div>
          <el-tag v-for="i in g.items" :key="i.path" size="small" style="margin: 0 6px 6px 0;">{{ i.label }}</el-tag>
        </div>
      </template>
      <template v-else-if="menusDrawerList.length === 0">
        <el-empty description="该角色未配置菜单" :image-size="80" />
      </template>
      <template v-else>
        <div v-for="g in MENU_GROUPS" :key="g.key" class="drawer-group">
          <template v-if="g.items.some(i => menusDrawerList.includes(i.path))">
            <div class="drawer-group-title">{{ g.label }}</div>
            <el-tag v-for="i in g.items.filter(x => menusDrawerList.includes(x.path))"
                    :key="i.path" size="small" style="margin: 0 6px 6px 0;">{{ i.label }}</el-tag>
          </template>
        </div>
      </template>
    </el-drawer>

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
import { ref, reactive, computed, onMounted, watch } from 'vue'
import { ElMessage, ElMessageBox, type FormInstance, type FormRules } from 'element-plus'
import { Search } from '@element-plus/icons-vue'
import { userApi, type UserInfo } from '@/api/user'
import { getRolePermissions, createRole, updateRole, deleteRole, type RoleDef } from '@/api/rolePermission'
import { MENU_GROUPS, ALL_MENU_ITEMS, menuLabel } from '@/config/menus'
import http from '@/api/http'
import { formatDateTime } from '@/utils/format'
import { useConfirmDelete } from '@/composables/useConfirmDelete'

const { confirmDelete } = useConfirmDelete()

const activeTab = ref('users')

function formatTime(s?: string): string {
  return s ? formatDateTime(s) : ''
}

// ==================== 角色字典 ====================
const roles = ref<RoleDef[]>([])

async function loadRoles() {
  try {
    roles.value = await getRolePermissions()
    if (!selectedRole.value && roles.value.length) {
      selectRole(roles.value[0].role)
    }
  } catch (e: any) {
    ElMessage.error('加载角色列表失败: ' + (e.response?.data?.error || e.message))
  }
}

function roleLabel(code: string): string {
  return roles.value.find(r => r.role === code)?.label || code
}

function roleTagType(code: string): 'danger' | 'primary' | 'info' {
  if (code === 'SUPER_ADMIN') return 'danger'
  if (code === 'ADMIN') return 'primary'
  return 'info'
}

// ==================== 用户管理 ====================
const users = ref<UserInfo[]>([])
const loading = ref(false)
const searchText = ref('')
const roleFilter = ref('')
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
  empNo: [{ required: true, message: '请输入工号', trigger: 'blur' }],
  username: [{ required: true, message: '请输入登录账号', trigger: 'blur' }],
  displayName: [{ required: true, message: '请输入姓名', trigger: 'blur' }],
  password: [{
    required: true, message: '请输入密码', trigger: 'blur',
    validator: (_rule, value, callback) => {
      if (!isEdit.value && (!value || !value.trim())) {
        callback(new Error('请输入密码'))
      } else {
        callback()
      }
    }
  }]
}

const filteredUsers = computed(() => {
  const kw = searchText.value.trim().toLowerCase()
  return users.value.filter(u => {
    if (roleFilter.value && u.role !== roleFilter.value) return false
    if (!kw) return true
    return [u.username, u.displayName, u.empNo].some(v => (v || '').toLowerCase().includes(kw))
  })
})

/** 角色下拉下方的提示：该角色将看到的菜单数 */
const formRoleMenusHint = computed(() => {
  const r = roles.value.find(x => x.role === form.role)
  if (!r) return ''
  return r.allowedMenus === '*'
    ? '该角色可见全部菜单'
    : `该角色可见 ${(r.allowedMenus || []).length} 项菜单（${(r.allowedMenus || []).slice(0, 4).map(menuLabel).join('、')}${(r.allowedMenus || []).length > 4 ? '…' : ''}）`
})

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

// ==================== 用户可见菜单预览 ====================
const menusDrawerVisible = ref(false)
const menusDrawerTitle = ref('')
const menusDrawerList = ref<string[] | '*'>('')

function menusCount(row: UserInfo): string {
  return row.allowedMenus === '*' ? '全部' : String(Array.isArray(row.allowedMenus) ? row.allowedMenus.length : 0)
}

function showUserMenus(row: UserInfo) {
  menusDrawerTitle.value = `${row.displayName || row.username} 的可见菜单`
  menusDrawerList.value = row.allowedMenus === '*' ? '*' : (Array.isArray(row.allowedMenus) ? row.allowedMenus : [])
  menusDrawerVisible.value = true
}

// ==================== LLM 配置查看 ====================
const llmDialogVisible = ref(false)
const llmConfig = ref<any>(null)

async function showLlmConfig(row: UserInfo) {
  try {
    const res = await http.get(`/users/${row.id}/llm-config`)
    llmConfig.value = res.data
    llmDialogVisible.value = true
  } catch {
    ElMessage.error('加载 LLM 配置失败')
  }
}

// ==================== 角色管理 ====================
const selectedRole = ref('')
const currentRole = computed(() => roles.value.find(r => r.role === selectedRole.value) || null)
const editingMenus = ref<string[]>([])
const roleSaving = ref(false)

/** checkbox 双向绑定桥：editingMenus ↔ 每项 model */
const menuCheckModel = reactive<Record<string, boolean>>({})

watch(editingMenus, (list) => {
  for (const item of ALL_MENU_ITEMS) {
    menuCheckModel[item.path] = list.includes(item.path)
  }
}, { immediate: true })

watch(menuCheckModel, () => {
  const checked = ALL_MENU_ITEMS.filter(i => menuCheckModel[i.path]).map(i => i.path)
  if (checked.length !== editingMenus.value.length || checked.some(p => !editingMenus.value.includes(p))) {
    editingMenus.value = checked
  }
})

function selectRole(code: string) {
  selectedRole.value = code
  const r = roles.value.find(x => x.role === code)
  editingMenus.value = r && r.allowedMenus !== '*' ? [...(r.allowedMenus || [])] : []
}

function isGroupChecked(g: typeof MENU_GROUPS[number]): boolean {
  return g.items.every(i => editingMenus.value.includes(i.path))
}

function isGroupIndeterminate(g: typeof MENU_GROUPS[number]): boolean {
  const n = g.items.filter(i => editingMenus.value.includes(i.path)).length
  return n > 0 && n < g.items.length
}

function toggleGroup(g: typeof MENU_GROUPS[number], checked: boolean) {
  const paths = g.items.map(i => i.path)
  const set = new Set(editingMenus.value)
  if (checked) {
    for (const p of paths) set.add(p)
  } else {
    for (const p of paths) set.delete(p)
  }
  editingMenus.value = [...set]
}

function selectAllMenus() {
  editingMenus.value = ALL_MENU_ITEMS.map(i => i.path)
}

async function handleSaveRoleMenus() {
  const r = currentRole.value
  if (!r) return
  roleSaving.value = true
  try {
    await updateRole(r.role, { allowedMenus: editingMenus.value })
    ElMessage.success(`「${r.label}」菜单权限已保存，用户重新登录后生效`)
    loadRoles()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.response?.data?.error || e.message))
  } finally {
    roleSaving.value = false
  }
}

// ==================== 角色新增/编辑/删除 ====================
const roleDialogVisible = ref(false)
const roleIsEdit = ref(false)
const roleFormSaving = ref(false)
const roleFormRef = ref<FormInstance>()
const roleForm = reactive({ role: '', label: '', description: '', sortOrder: 99 })

const roleRules: FormRules = {
  role: [
    { required: true, message: '请输入角色编码', trigger: 'blur' },
    { pattern: /^[A-Z][A-Z0-9_]{1,31}$/, message: '大写字母/数字/下划线，2-32 位且以字母开头', trigger: 'blur' }
  ],
  label: [{ required: true, message: '请输入角色术语（界面显示名）', trigger: 'blur' }]
}

function openRoleCreate() {
  roleIsEdit.value = false
  Object.assign(roleForm, { role: '', label: '', description: '', sortOrder: 99 })
  roleDialogVisible.value = true
}

function openRoleEdit() {
  const r = currentRole.value
  if (!r) return
  roleIsEdit.value = true
  Object.assign(roleForm, { role: r.role, label: r.label, description: r.description || '', sortOrder: r.sortOrder || 99 })
  roleDialogVisible.value = true
}

async function handleSaveRoleForm() {
  if (!roleFormRef.value) return
  try { await roleFormRef.value.validate() } catch { return }
  roleFormSaving.value = true
  try {
    if (roleIsEdit.value) {
      await updateRole(roleForm.role, {
        label: roleForm.label,
        description: roleForm.description,
        sortOrder: roleForm.sortOrder
      })
      ElMessage.success('角色已更新')
    } else {
      await createRole({
        role: roleForm.role,
        label: roleForm.label,
        description: roleForm.description,
        sortOrder: roleForm.sortOrder,
        allowedMenus: []
      })
      ElMessage.success('角色已创建，请在右侧配置菜单权限')
      selectedRole.value = roleForm.role
    }
    roleDialogVisible.value = false
    loadRoles()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e.response?.data?.error || e.message))
  } finally {
    roleFormSaving.value = false
  }
}

async function handleRoleDelete() {
  const r = currentRole.value
  if (!r) return
  if (!await confirmDelete(`角色 "${r.label} (${r.role})"`, '确认删除')) return
  try {
    await deleteRole(r.role)
    ElMessage.success('角色已删除')
    selectedRole.value = ''
    loadRoles()
  } catch (e: any) {
    ElMessage.error(e.response?.data?.error || '删除失败')
  }
}

onMounted(() => {
  loadUsers()
  loadRoles()
})
</script>

<style scoped>
.tab-toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 10px;
}
.toolbar-spacer {
  flex: 1;
}
.count-hint {
  color: var(--ink-text-secondary, #90897a);
  font-size: 13px;
}
.card-header {
  display: flex;
  align-items: center;
  gap: 10px;
}
.card-title {
  font-weight: 600;
}
.form-hint {
  font-size: 12px;
  color: var(--ink-text-secondary, #90897a);
  line-height: 1.5;
  margin-top: 4px;
}
/* 角色列表 */
.role-list-card :deep(.el-card__body) {
  padding: 8px;
  max-height: 560px;
  overflow-y: auto;
}
.role-item {
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  border: 1px solid transparent;
  transition: background 0.15s, border-color 0.15s;
}
.role-item:hover {
  background: rgba(0, 0, 0, 0.03);
}
.role-item.active {
  background: var(--el-color-primary-light-9, #ecf5ff);
  border-color: var(--el-color-primary-light-7, #d9ecff);
}
.role-item-head {
  display: flex;
  align-items: center;
  gap: 8px;
}
.role-item-actions {
  margin-left: auto;
  opacity: 0;
  transition: opacity 0.15s;
}
.role-item:hover .role-item-actions {
  opacity: 1;
}
.role-item-label {
  font-weight: 600;
  font-size: 14px;
}
.role-item-code {
  font-size: 11px;
  font-family: var(--app-font-mono, monospace);
  color: var(--ink-text-secondary, #90897a);
  margin-top: 2px;
}
.role-item-desc {
  font-size: 12px;
  color: var(--ink-text-secondary, #90897a);
  margin-top: 2px;
}
.role-item-menus {
  font-size: 12px;
  color: var(--el-color-primary);
  margin-top: 4px;
}
/* 菜单树 */
.checkbox-toolbar {
  margin-bottom: 12px;
  display: flex;
  align-items: center;
  gap: 8px;
}
.select-hint {
  font-size: 12px;
  color: var(--ink-text-secondary, #90897a);
  margin-left: 4px;
}
.menu-tree {
  max-height: 440px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter, #ebeef5);
  border-radius: 8px;
  padding: 4px 14px;
}
.menu-group-block {
  padding: 8px 0;
  border-bottom: 1px dashed var(--el-border-color-lighter, #ebeef5);
}
.menu-group-block:last-child {
  border-bottom: none;
}
.menu-group-head {
  margin-bottom: 4px;
}
.menu-group-items {
  display: flex;
  flex-wrap: wrap;
  padding-left: 22px;
  gap: 2px 18px;
}
.menu-hidden-tag {
  font-size: 10px;
  color: var(--el-color-info);
  margin-left: 6px;
}
.save-footer {
  margin-top: 20px;
  text-align: right;
  padding-top: 16px;
  border-top: 1px solid #ede8da;
}
/* 抽屉 */
.drawer-group {
  margin-bottom: 14px;
}
.drawer-group-title {
  font-weight: 600;
  font-size: 13px;
  margin-bottom: 6px;
  color: var(--ink-text, #303133);
}
</style>
