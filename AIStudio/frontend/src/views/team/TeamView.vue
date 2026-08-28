<template>
  <div class="team-view">
    <div class="page-header">
      <h2>团队协作</h2>
      <el-button type="primary" @click="showCreateWorkspace">新建工作空间</el-button>
    </div>

    <el-row :gutter="20">
      <el-col :span="8">
        <el-card>
          <template #header>工作空间</template>
          <div v-if="!workspaces.length" class="empty-text">暂无工作空间</div>
          <div v-for="ws in workspaces" :key="ws.id"
               class="ws-item" :class="{ active: selectedWs?.id === ws.id }"
               @click="selectWorkspace(ws)">
            <div class="ws-name">{{ ws.name }}</div>
            <div class="ws-meta">{{ ws.memberCount }} 成员 / {{ ws.projectCount }} 项目</div>
          </div>
        </el-card>
      </el-col>

      <el-col :span="16" v-if="selectedWs">
        <el-card>
          <template #header>
            <div class="card-header">
              <span>{{ selectedWs.name }} - 成员管理</span>
              <el-button size="small" type="primary" @click="showAddMember">添加成员</el-button>
            </div>
          </template>
          <el-table :data="members" border stripe>
            <el-table-column prop="displayName" label="姓名" />
            <el-table-column prop="username" label="用户名" />
            <el-table-column prop="role" label="角色" width="120">
              <template #default="{ row }">
                <el-select v-model="row.role" size="small" @change="updateMemberRole(row)">
                  <el-option label="管理员" value="ADMIN" />
                  <el-option label="开发者" value="DEVELOPER" />
                  <el-option label="观察者" value="OBSERVER" />
                </el-select>
              </template>
            </el-table-column>
            <el-table-column prop="joinedAt" label="加入时间" width="180">
              <template #default="{ row }">{{ formatTime(row.joinedAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button size="small" type="danger" link @click="removeMember(row)">移除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>

        <el-card style="margin-top: 16px">
          <template #header>
            <div class="card-header">
              <span>项目列表</span>
              <el-button size="small" type="primary" @click="showCreateProject">新建项目</el-button>
            </div>
          </template>
          <el-table :data="projects" border stripe>
            <el-table-column prop="name" label="名称" />
            <el-table-column prop="description" label="描述" />
            <el-table-column prop="createdAt" label="创建时间" width="180">
              <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
            </el-table-column>
            <el-table-column label="操作" width="80">
              <template #default="{ row }">
                <el-button size="small" type="danger" link @click="deleteProject(row)">删除</el-button>
              </template>
            </el-table-column>
          </el-table>
        </el-card>
      </el-col>
    </el-row>

    <!-- 新建工作空间对话框 -->
    <el-dialog v-model="wsDialogVisible" title="新建工作空间" width="420px">
      <el-form :model="wsForm" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="wsForm.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="wsForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="wsDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createWorkspace">创建</el-button>
      </template>
    </el-dialog>

    <!-- 添加成员对话框 -->
    <el-dialog v-model="memberDialogVisible" title="添加成员" width="400px">
      <el-form :model="memberForm" label-width="80px">
        <el-form-item label="用户名" required>
          <el-input v-model="memberForm.username" placeholder="输入用户名" />
        </el-form-item>
        <el-form-item label="角色">
          <el-select v-model="memberForm.role">
            <el-option label="开发者" value="DEVELOPER" />
            <el-option label="管理员" value="ADMIN" />
            <el-option label="观察者" value="OBSERVER" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="memberDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="addMember">添加</el-button>
      </template>
    </el-dialog>

    <!-- 新建项目对话框 -->
    <el-dialog v-model="projectDialogVisible" title="新建项目" width="420px">
      <el-form :model="projectForm" label-width="80px">
        <el-form-item label="名称" required>
          <el-input v-model="projectForm.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="projectForm.description" type="textarea" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="projectDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="createProject">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { teamApi, type Workspace, type TeamMember, type Project } from '@/api/team'

const workspaces = ref<Workspace[]>([])
const selectedWs = ref<Workspace | null>(null)
const members = ref<TeamMember[]>([])
const projects = ref<Project[]>([])

const wsDialogVisible = ref(false)
const memberDialogVisible = ref(false)
const projectDialogVisible = ref(false)

const wsForm = reactive({ name: '', description: '' })
const memberForm = reactive({ username: '', role: 'DEVELOPER' })
const projectForm = reactive({ name: '', description: '' })

function formatTime(s?: string) {
  if (!s) return ''
  return s.replace('T', ' ').substring(0, 19)
}

async function loadWorkspaces() {
  try { workspaces.value = await teamApi.listWorkspaces() } catch {}
}

async function selectWorkspace(ws: Workspace) {
  selectedWs.value = ws
  await Promise.all([loadMembers(), loadProjects()])
}

async function loadMembers() {
  if (!selectedWs.value) return
  try { members.value = await teamApi.listMembers(selectedWs.value.id) } catch {}
}

async function loadProjects() {
  if (!selectedWs.value) return
  try { projects.value = await teamApi.listProjects(selectedWs.value.id) } catch {}
}

function showCreateWorkspace() {
  wsForm.name = ''
  wsForm.description = ''
  wsDialogVisible.value = true
}

async function createWorkspace() {
  if (!wsForm.name.trim()) { ElMessage.warning('请输入名称'); return }
  try {
    const ws = await teamApi.createWorkspace({ name: wsForm.name, description: wsForm.description })
    wsDialogVisible.value = false
    await loadWorkspaces()
    selectWorkspace(ws)
    ElMessage.success('创建成功')
  } catch (e: any) { ElMessage.error(e.response?.data?.error || '创建失败') }
}

function showAddMember() {
  memberForm.username = ''
  memberForm.role = 'DEVELOPER'
  memberDialogVisible.value = true
}

async function addMember() {
  if (!memberForm.username.trim()) { ElMessage.warning('请输入用户名'); return }
  try {
    await teamApi.addMember(selectedWs.value!.id, { username: memberForm.username, role: memberForm.role })
    memberDialogVisible.value = false
    await loadMembers()
    ElMessage.success('添加成功')
  } catch (e: any) { ElMessage.error(e.response?.data?.error || '添加失败') }
}

async function updateMemberRole(member: TeamMember) {
  try {
    await teamApi.updateMember(selectedWs.value!.id, member.id, { role: member.role })
    ElMessage.success('已更新')
  } catch (e: any) { ElMessage.error('更新失败') }
}

async function removeMember(member: TeamMember) {
  try {
    await ElMessageBox.confirm(`确定移除 ${member.displayName || member.username}？`, '确认')
    await teamApi.removeMember(selectedWs.value!.id, member.id)
    await loadMembers()
    ElMessage.success('已移除')
  } catch {}
}

function showCreateProject() {
  projectForm.name = ''
  projectForm.description = ''
  projectDialogVisible.value = true
}

async function createProject() {
  if (!projectForm.name.trim()) { ElMessage.warning('请输入名称'); return }
  try {
    await teamApi.createProject({ name: projectForm.name, description: projectForm.description, workspaceId: selectedWs.value!.id })
    projectDialogVisible.value = false
    await loadProjects()
    await loadWorkspaces()
    ElMessage.success('创建成功')
  } catch (e: any) { ElMessage.error(e.response?.data?.error || '创建失败') }
}

async function deleteProject(project: Project) {
  try {
    await ElMessageBox.confirm(`确定删除项目 "${project.name}"？`, '确认')
    await teamApi.deleteProject(project.id)
    await loadProjects()
    await loadWorkspaces()
    ElMessage.success('已删除')
  } catch {}
}

onMounted(loadWorkspaces)
</script>

<style scoped>
.team-view { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { font-size: 18px; font-weight: 600; color: #303133; }
.ws-item { padding: 12px; border-radius: 6px; cursor: pointer; margin-bottom: 8px; border: 1px solid #ebeef5; }
.ws-item:hover { background: #f5f7fa; }
.ws-item.active { border-color: #409eff; background: #ecf5ff; }
.ws-name { font-weight: 600; font-size: 14px; }
.ws-meta { font-size: 12px; color: #909399; margin-top: 4px; }
.empty-text { text-align: center; color: #909399; padding: 20px; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
</style>
