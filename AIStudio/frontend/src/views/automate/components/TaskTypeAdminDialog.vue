<template>
  <el-dialog
    :model-value="modelValue"
    title="任务类型管理"
    width="960px"
    top="4vh"
    @update:model-value="$emit('update:modelValue', $event)"
    @open="loadAll"
  >
    <!-- 列表视图 -->
    <div v-if="!editing">
      <div class="admin-toolbar">
        <el-button type="primary" size="small" @click="openCreate">新增类型</el-button>
        <span class="admin-tip">类型定义启动入口与表单；停用后卡片不可启动</span>
      </div>
      <el-table :data="types" stripe v-loading="loading" size="small">
        <el-table-column label="" width="46">
          <template #default="{ row }">{{ row.icon || '⚙️' }}</template>
        </el-table-column>
        <el-table-column prop="name" label="名称" width="130" />
        <el-table-column prop="code" label="编码" width="150" />
        <el-table-column label="绑定" min-width="200">
          <template #default="{ row }">
            <el-tag v-if="row.skillName" size="small" type="info">Skill: {{ row.skillName }}</el-tag>
            <el-tag v-else-if="row.workflowDefinitionId" size="small" type="info">
              工作流: {{ workflowName(row.workflowDefinitionId) }}
            </el-tag>
            <span v-else class="admin-empty">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="sortOrder" label="排序" width="60" />
        <el-table-column label="启用" width="70">
          <template #default="{ row }">
            <el-switch :model-value="row.enabled" @change="(v: boolean) => toggleEnabled(row, v)" />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button type="primary" link size="small" @click="openEdit(row)">编辑</el-button>
            <el-button type="danger" link size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </div>

    <!-- 编辑视图 -->
    <div v-else>
      <el-form ref="draftFormRef" :model="draft" :rules="draftRules" label-width="100px" size="default">
        <el-row :gutter="12">
          <el-col :span="8">
            <el-form-item label="编码" prop="code">
              <el-input v-model="draft.code" :disabled="isEdit" placeholder="如 req-analysis" />
            </el-form-item>
          </el-col>
          <el-col :span="8">
            <el-form-item label="名称" prop="name">
              <el-input v-model="draft.name" placeholder="如 需求分析" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="图标">
              <el-input v-model="draft.icon" placeholder="emoji" />
            </el-form-item>
          </el-col>
          <el-col :span="4">
            <el-form-item label="排序">
              <el-input-number v-model="draft.sortOrder" :min="0" controls-position="right" style="width: 100%" />
            </el-form-item>
          </el-col>
        </el-row>
        <el-form-item label="描述">
          <el-input v-model="draft.description" type="textarea" :rows="2" placeholder="卡片上显示的类型说明" />
        </el-form-item>

        <el-form-item label="绑定执行">
          <el-radio-group v-model="bindingMode">
            <el-radio value="skill">技能（LLM 执行）</el-radio>
            <el-radio value="workflow">工作流</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item v-if="bindingMode === 'skill'" label="技能">
          <el-select v-model="draft.skillName" filterable clearable placeholder="选择 data/skills 中的技能" style="width: 100%">
            <el-option v-for="s in skills" :key="s.name" :label="s.name + (s.description ? '（' + s.description + '）' : '')" :value="s.name" />
          </el-select>
        </el-form-item>
        <el-form-item v-else label="工作流">
          <el-select v-model="draft.workflowDefinitionId" filterable clearable placeholder="选择已启用的工作流" style="width: 100%">
            <el-option v-for="w in workflows" :key="w.id" :label="w.name" :value="w.id" />
          </el-select>
        </el-form-item>

        <el-form-item v-if="bindingMode === 'skill'" label="LLM 模型">
          <el-select v-model="draft.model" filterable clearable placeholder="留空 = 全局模型（环境变量配置）" style="width: 100%">
            <el-option
              v-for="p in providers"
              :key="p.id"
              :label="`${p.displayName}（${p.modelName}）`"
              :value="p.modelName"
            />
          </el-select>
          <div class="model-tip">在「LLM 管理」页面维护 Provider；所选模型不可用时会回退全局模型</div>
        </el-form-item>

        <!-- 启动表单字段编辑器 -->
        <el-form-item label="启动表单">
          <div class="field-editor">
            <div v-for="(f, idx) in draftFields" :key="idx" class="field-row">
              <el-input v-model="f.key" placeholder="key" style="width: 120px" size="small" />
              <el-input v-model="f.label" placeholder="显示名" style="width: 120px" size="small" />
              <el-select v-model="f.type" style="width: 110px" size="small">
                <el-option label="数字" value="number" />
                <el-option label="单行文本" value="text" />
                <el-option label="多行文本" value="textarea" />
                <el-option label="下拉" value="select" />
              </el-select>
              <el-checkbox v-model="f.required" size="small">必填</el-checkbox>
              <el-input v-model="f.default" placeholder="默认值" style="width: 150px" size="small" />
              <el-input v-model="f.placeholder" placeholder="占位提示" style="flex: 1; min-width: 140px" size="small" />
              <el-button-group size="small">
                <el-button :disabled="idx === 0" @click="moveField(idx, -1)">↑</el-button>
                <el-button :disabled="idx === draftFields.length - 1" @click="moveField(idx, 1)">↓</el-button>
                <el-button type="danger" @click="draftFields.splice(idx, 1)">删</el-button>
              </el-button-group>
            </div>
            <el-button size="small" @click="draftFields.push(emptyField())">+ 添加字段</el-button>
            <div class="field-tip">key 为 tfsWorkItemId 时，该值会写入任务的 TFS 需求号并自动抓取工作项信息</div>
          </div>
        </el-form-item>
      </el-form>
    </div>

    <template #footer>
      <template v-if="editing">
        <el-button @click="editing = false">返回列表</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">保存</el-button>
      </template>
      <el-button v-else @click="$emit('update:modelValue', false)">关闭</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useConfirmDelete } from '@/composables/useConfirmDelete'

const { confirmDelete } = useConfirmDelete()
import { taskTypeApi, type AutomateTaskType, type AutomateFormField } from '@/api/automate'
import { skillApi, type SkillSummary } from '@/api/skill'
import { getWorkflows } from '@/api/workflow'
import { llmProviderApi, type LlmProvider } from '@/api/llmProvider'

defineProps<{ modelValue: boolean }>()
const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'changed'): void
}>()

interface FieldDraft extends AutomateFormField {
  default?: string
}

const types = ref<AutomateTaskType[]>([])
const loading = ref(false)
const skills = ref<SkillSummary[]>([])
const workflows = ref<{ id: number; name: string; enabled: boolean }[]>([])
const providers = ref<LlmProvider[]>([])

const editing = ref(false)
const isEdit = ref(false)
const saving = ref(false)
const editingId = ref<number | null>(null)
const bindingMode = ref<'skill' | 'workflow'>('skill')
const draft = ref<any>({ code: '', name: '', icon: '', description: '', sortOrder: 0, skillName: '', workflowDefinitionId: null })
const draftFormRef = ref<FormInstance>()
const draftRules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  code: [{
    validator: (_rule: any, value: any, callback: any) => {
      if (!isEdit.value && !(value || '').trim()) callback(new Error('请输入编码'))
      else callback()
    },
    trigger: 'blur'
  }]
}
const draftFields = ref<FieldDraft[]>([])

function emptyField(): FieldDraft {
  return { key: '', label: '', type: 'text', required: false, default: '', placeholder: '' }
}

async function loadAll() {
  loading.value = true
  try {
    const [t, s, w, p] = await Promise.all([
      taskTypeApi.list(false),
      skillApi.listSkills().catch(() => [] as SkillSummary[]),
      getWorkflows().then(r => r.data).catch(() => []),
      llmProviderApi.listProviders().catch(() => [] as LlmProvider[])
    ])
    types.value = t
    skills.value = (s || []).filter((x: SkillSummary) => !x.disabled)
    workflows.value = (w || []).filter((x: any) => x.enabled !== false)
    providers.value = (p || []).filter((x: LlmProvider) => x.enabled)
    editing.value = false
  } catch (e: any) {
    ElMessage.error('加载失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    loading.value = false
  }
}

function workflowName(id: number) {
  return workflows.value.find(w => w.id === id)?.name || ('#' + id)
}

function openCreate() {
  isEdit.value = false
  editingId.value = null
  bindingMode.value = 'skill'
  draft.value = { code: '', name: '', icon: '', description: '', sortOrder: types.value.length + 1, skillName: '', workflowDefinitionId: null, model: '' }
  draftFields.value = [emptyField()]
  editing.value = true
}

function openEdit(row: AutomateTaskType) {
  isEdit.value = true
  editingId.value = row.id
  bindingMode.value = row.skillName ? 'skill' : 'workflow'
  draft.value = {
    code: row.code,
    name: row.name,
    icon: row.icon || '',
    description: row.description || '',
    sortOrder: row.sortOrder,
    skillName: row.skillName || '',
    workflowDefinitionId: row.workflowDefinitionId || null,
    model: row.model || ''
  }
  try {
    draftFields.value = row.formSchema ? JSON.parse(row.formSchema) : []
  } catch {
    draftFields.value = []
  }
  editing.value = true
}

function moveField(idx: number, dir: number) {
  const target = idx + dir
  if (target < 0 || target >= draftFields.value.length) return
  const arr = draftFields.value
  ;[arr[idx], arr[target]] = [arr[target], arr[idx]]
}

function buildPayload() {
  const fields = draftFields.value
    .filter(f => f.key && f.key.trim())
    .map(f => {
      const out: Record<string, unknown> = { key: f.key.trim(), label: f.label || f.key.trim(), type: f.type || 'text' }
      if (f.required) out.required = true
      if (f.default !== undefined && String(f.default) !== '') out.default = f.default
      if (f.placeholder) out.placeholder = f.placeholder
      if (f.type === 'select') out.options = (f as any).options || []
      return out
    })
  return {
    code: draft.value.code,
    name: draft.value.name,
    icon: draft.value.icon || null,
    description: draft.value.description || null,
    sortOrder: draft.value.sortOrder ?? 0,
    skillName: bindingMode.value === 'skill' ? (draft.value.skillName || null) : null,
    workflowDefinitionId: bindingMode.value === 'workflow' ? (draft.value.workflowDefinitionId || null) : null,
    model: bindingMode.value === 'skill' ? (draft.value.model || null) : null,
    formSchema: JSON.stringify(fields)
  }
}

async function handleSave() {
  const valid = await draftFormRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const payload = buildPayload()
    if (isEdit.value && editingId.value != null) {
      await taskTypeApi.update(editingId.value, payload)
      ElMessage.success('已保存')
    } else {
      await taskTypeApi.create(payload)
      ElMessage.success('已创建')
    }
    editing.value = false
    await loadAll()
    emit('changed')
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    saving.value = false
  }
}

async function toggleEnabled(row: AutomateTaskType, v: boolean) {
  try {
    await taskTypeApi.update(row.id, { enabled: v })
    row.enabled = v
    emit('changed')
  } catch (e: any) {
    ElMessage.error('操作失败: ' + (e?.response?.data?.error || e.message))
  }
}

async function handleDelete(row: AutomateTaskType) {
  if (!await confirmDelete(`任务类型 "${row.name}"`)) return
  try {
    await taskTypeApi.remove(row.id)
    ElMessage.success('已删除')
    await loadAll()
    emit('changed')
  } catch {
    // 接口错误已由统一错误出口提示
  }
}
</script>

<style scoped>
.admin-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
}

.admin-tip {
  color: var(--ink-text-secondary);
  font-size: 12px;
}

.admin-empty {
  color: #b8b1a0;
}

.field-editor {
  width: 100%;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 6px;
  padding: 10px;
}

.field-row {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  flex-wrap: wrap;
}

.field-tip {
  color: var(--ink-text-secondary);
  font-size: 12px;
  margin-top: 8px;
}

.model-tip {
  color: var(--ink-text-secondary);
  font-size: 12px;
  line-height: 1.5;
  margin-top: 4px;
}
</style>
