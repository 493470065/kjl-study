<template>
  <page-container title="待办事项">
    <!-- 统计卡 -->
    <div class="stat-row">
      <el-card class="stat-card" shadow="never">
        <div class="stat-num">{{ stats.total }}</div>
        <div class="stat-label">全部</div>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-num" style="color: var(--viz-orange)">{{ stats.inProgress }}</div>
        <div class="stat-label">进行中</div>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-num" style="color: var(--viz-green)">{{ stats.completed }}</div>
        <div class="stat-label">已完成</div>
      </el-card>
      <el-card class="stat-card" shadow="never">
        <div class="stat-num" style="color: var(--seal)">{{ stats.overdue }}</div>
        <div class="stat-label">已逾期</div>
      </el-card>
    </div>

    <!-- 工具栏 -->
    <div class="toolbar">
      <el-input v-model="search" placeholder="搜索标题" clearable style="width: 220px">
        <template #prefix><el-icon><Search /></el-icon></template>
      </el-input>
      <el-select v-model="statusFilter" placeholder="状态" style="width: 130px">
        <el-option label="全部状态" value="" />
        <el-option label="待办" value="PENDING" />
        <el-option label="进行中" value="IN_PROGRESS" />
        <el-option label="已完成" value="COMPLETED" />
      </el-select>
      <el-select v-model="priorityFilter" placeholder="优先级" style="width: 130px">
        <el-option label="全部优先级" value="" />
        <el-option label="低" value="LOW" />
        <el-option label="中" value="MEDIUM" />
        <el-option label="高" value="HIGH" />
        <el-option label="紧急" value="URGENT" />
      </el-select>
      <el-button type="primary" @click="openCreate"><el-icon><Plus /></el-icon> 新增待办</el-button>
    </div>

    <!-- 列表 -->
    <div v-loading="loading" class="todo-list">
      <div v-if="filtered.length === 0" class="empty">
        <el-empty :description="todos.length === 0 ? '暂无待办，点击右上角新增' : '没有符合条件的待办'" />
      </div>
      <div v-for="t in filtered" :key="t.id" class="todo-item" :class="{ done: t.status === 'COMPLETED' }">
        <el-checkbox :model-value="t.status === 'COMPLETED'" @change="() => onToggle(t)" />
        <div class="todo-main">
          <div class="todo-title">{{ t.title }}</div>
          <div v-if="t.description" class="todo-desc">{{ t.description }}</div>
          <div class="todo-meta">
            <el-tag :type="priorityTag(t.priority)" size="small">{{ priorityLabel(t.priority) }}</el-tag>
            <el-tag v-if="t.status === 'IN_PROGRESS'" type="warning" size="small">进行中</el-tag>
            <span v-if="t.dueDate" class="due" :class="{ overdue: isOverdue(t) }">
              <el-icon><Clock /></el-icon> {{ formatDate(t.dueDate) }}
            </span>
          </div>
        </div>
        <div class="todo-actions">
          <el-button text size="small" @click="openEdit(t)"><el-icon><Edit /></el-icon></el-button>
          <el-button text size="small" type="danger" @click="onDelete(t)"><el-icon><Delete /></el-icon></el-button>
        </div>
      </div>
    </div>

    <!-- 新增 / 编辑弹窗 -->
    <el-dialog v-model="dialogVisible" :title="editing ? '编辑待办' : '新增待办'" width="480px">
      <el-form :model="form" label-width="80px" :rules="rules" ref="formRef">
        <el-form-item label="标题" prop="title">
          <el-input v-model="form.title" placeholder="请输入待办标题" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="可选" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="form.priority" style="width: 100%">
            <el-option label="低" value="LOW" />
            <el-option label="中" value="MEDIUM" />
            <el-option label="高" value="HIGH" />
            <el-option label="紧急" value="URGENT" />
          </el-select>
        </el-form-item>
        <el-form-item label="状态" v-if="editing">
          <el-select v-model="form.status" style="width: 100%">
            <el-option label="待办" value="PENDING" />
            <el-option label="进行中" value="IN_PROGRESS" />
            <el-option label="已完成" value="COMPLETED" />
          </el-select>
        </el-form-item>
        <el-form-item label="截止时间">
          <el-date-picker v-model="form.dueDate" type="datetime" placeholder="可选"
            format="YYYY-MM-DD HH:mm" value-format="YYYY-MM-DD HH:mm" style="width: 100%" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="save">保存</el-button>
      </template>
    </el-dialog>
  </page-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Search, Plus, Edit, Delete, Clock } from '@element-plus/icons-vue'
import { todoApi, type Todo, type TodoPayload, type TodoPriority, type TodoStatus } from '@/api/todo'

const todos = ref<Todo[]>([])
const loading = ref(false)
const search = ref('')
const statusFilter = ref('')
const priorityFilter = ref('')

const dialogVisible = ref(false)
const editing = ref<Todo | null>(null)
const saving = ref(false)
const formRef = ref<FormInstance>()

const form = ref<{
  title: string
  description: string | null
  priority: TodoPriority
  status: TodoStatus
  dueDate: string | null
}>({
  title: '',
  description: null,
  priority: 'MEDIUM',
  status: 'PENDING',
  dueDate: null
})

const rules: FormRules = {
  title: [{ required: true, message: '请输入标题', trigger: 'blur' }]
}

const priorityMap: Record<TodoPriority, string> = { LOW: '低', MEDIUM: '中', HIGH: '高', URGENT: '紧急' }
const priorityTagMap: Record<TodoPriority, 'info' | 'primary' | 'warning' | 'danger'> = {
  LOW: 'info', MEDIUM: 'primary', HIGH: 'warning', URGENT: 'danger'
}

const stats = computed(() => {
  const now = Date.now()
  let inProgress = 0, completed = 0, overdue = 0
  for (const t of todos.value) {
    if (t.status === 'IN_PROGRESS') inProgress++
    if (t.status === 'COMPLETED') completed++
    if (t.dueDate && t.status !== 'COMPLETED' && new Date(t.dueDate).getTime() < now) overdue++
  }
  return { total: todos.value.length, inProgress, completed, overdue }
})

const filtered = computed(() => {
  const kw = search.value.trim().toLowerCase()
  return todos.value.filter(t => {
    if (statusFilter.value && t.status !== statusFilter.value) return false
    if (priorityFilter.value && t.priority !== priorityFilter.value) return false
    if (kw && !t.title.toLowerCase().includes(kw)) return false
    return true
  })
})

function priorityLabel(p: TodoPriority): string {
  return priorityMap[p] || p
}
function priorityTag(p: TodoPriority): 'info' | 'primary' | 'warning' | 'danger' {
  return priorityTagMap[p] || 'info'
}
function isOverdue(t: Todo): boolean {
  return !!t.dueDate && t.status !== 'COMPLETED' && new Date(t.dueDate).getTime() < Date.now()
}
function formatDate(s: string): string {
  return s.replace('T', ' ').slice(0, 16)
}

async function load() {
  loading.value = true
  try {
    todos.value = await todoApi.list()
  } catch (e: any) {
    ElMessage.error('加载待办失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    loading.value = false
  }
}

function openCreate() {
  editing.value = null
  form.value = { title: '', description: null, priority: 'MEDIUM', status: 'PENDING', dueDate: null }
  dialogVisible.value = true
}

function openEdit(t: Todo) {
  editing.value = t
  form.value = {
    title: t.title,
    description: t.description ?? null,
    priority: t.priority,
    status: t.status,
    dueDate: t.dueDate ? t.dueDate.replace('T', ' ').slice(0, 16) : null
  }
  dialogVisible.value = true
}

async function save() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  const payload: TodoPayload = {
    title: form.value.title.trim(),
    description: form.value.description?.trim() || null,
    priority: form.value.priority,
    dueDate: form.value.dueDate || null
  }
  try {
    if (editing.value) {
      await todoApi.update(editing.value.id, { ...payload, status: form.value.status })
      ElMessage.success('已保存')
    } else {
      await todoApi.create(payload)
      ElMessage.success('已新增')
    }
    dialogVisible.value = false
    await load()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    saving.value = false
  }
}

async function onToggle(t: Todo) {
  try {
    await todoApi.toggle(t.id)
    await load()
  } catch (e: any) {
    ElMessage.error('操作失败: ' + (e?.response?.data?.error || e.message))
  }
}

async function onDelete(t: Todo) {
  try {
    await ElMessageBox.confirm(`确定删除待办「${t.title}」？`, '确认', { type: 'warning' })
    await todoApi.remove(t.id)
    ElMessage.success('已删除')
    await load()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('删除失败: ' + (e?.response?.data?.error || e.message))
  }
}

onMounted(load)
</script>

<style scoped>
.stat-row { display: flex; gap: 16px; margin-bottom: 20px; }
.stat-card { flex: 1; text-align: center; border: 1px solid var(--paper-light); }
.stat-num { font-size: 28px; font-weight: 700; line-height: 1.2; }
.stat-label { font-size: 13px; color: var(--ink-text-secondary); margin-top: 4px; }
.toolbar { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; }
.todo-list { display: flex; flex-direction: column; gap: 10px; }
.todo-item {
  display: flex; align-items: flex-start; gap: 12px;
  padding: 14px 16px; border: 1px solid var(--paper-border);
  border-radius: 10px; background: var(--paper-card);
}
.todo-item.done { opacity: 0.6; }
.todo-item.done .todo-title { text-decoration: line-through; }
.todo-main { flex: 1; min-width: 0; }
.todo-title { font-size: 15px; font-weight: 600; color: var(--ink-text); }
.todo-desc { font-size: 13px; color: var(--ink-text-secondary); margin-top: 4px; white-space: pre-wrap; word-break: break-all; }
.todo-meta { display: flex; align-items: center; gap: 10px; margin-top: 8px; flex-wrap: wrap; }
.todo-meta .due { display: inline-flex; align-items: center; gap: 4px; font-size: 12px; color: var(--ink-text-secondary); }
.todo-meta .due.overdue { color: var(--seal); font-weight: 600; }
.todo-actions { display: flex; gap: 4px; }
.empty { padding: 40px 0; }
</style>
