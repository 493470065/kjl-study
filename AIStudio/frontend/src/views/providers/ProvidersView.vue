<template>
  <page-container title="LLM 管理" no-card>
    <template #actions>
      <el-button type="primary" @click="showCreate">新增 Provider</el-button>
    </template>

    <el-row :gutter="16">
      <el-col :span="8" v-for="p in providers" :key="p.id">
        <el-card shadow="hover" :class="{ 'default-card': p.isDefault }">
          <template #header>
            <div class="card-header">
              <span>{{ p.displayName }}</span>
              <el-tag v-if="p.isDefault" type="success" size="small">默认</el-tag>
            </div>
          </template>
          <div class="provider-info">
            <div><span class="label">名称：</span>{{ p.name }}</div>
            <div><span class="label">类型：</span>{{ p.providerType }}</div>
            <div><span class="label">模型：</span>{{ p.modelName }}</div>
            <div><span class="label">地址：</span>{{ p.baseUrl }}</div>
            <div>
              <span class="label">API Key：</span>
              <template v-if="p.hasApiKey">
                <span class="api-key-masked">{{ p.apiKeyMasked }}</span>
                <el-tag type="success" size="small" class="api-key-tag">已配置</el-tag>
              </template>
              <el-tag v-else type="warning" size="small" class="api-key-tag">未配置</el-tag>
            </div>
          </div>
          <div class="provider-users">
            <div class="label">用户：</div>
            <el-empty v-if="!p.users || p.users.length === 0" description="暂无用户使用" :image-size="40" />
            <div v-else class="user-list">
              <el-tag v-for="u in p.users" :key="u.username" size="small" :type="u.enabled ? '' : 'info'" class="user-tag">
                {{ u.displayName }}
                <span v-if="u.modelName" class="user-model">（{{ u.modelName }}）</span>
              </el-tag>
            </div>
          </div>
          <div class="card-actions">
            <el-button v-if="!p.isDefault" size="small" type="success" @click="activate(p)">激活</el-button>
            <el-button size="small" @click="showEdit(p)">编辑</el-button>
            <el-button size="small" type="danger" @click="handleDelete(p)">删除</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <el-empty v-if="!providers.length" description="暂无 Provider 配置" />

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑 Provider' : '新增 Provider'" width="500px">
      <el-form ref="formRef" :model="form" :rules="providerRules" label-width="100px">
        <el-form-item label="名称" prop="name">
          <el-input v-model="form.name" :disabled="isEdit" placeholder="唯一标识" />
        </el-form-item>
        <el-form-item label="显示名称">
          <el-input v-model="form.displayName" placeholder="显示用的名称" />
        </el-form-item>
        <el-form-item label="类型">
          <el-select v-model="form.providerType">
            <el-option label="OpenAI Compatible" value="OPENAI_COMPATIBLE" />
            <el-option label="Ollama" value="OLLAMA" />
          </el-select>
        </el-form-item>
        <el-form-item label="API 地址" prop="baseUrl">
          <el-input v-model="form.baseUrl" placeholder="https://api.example.com/v1" />
        </el-form-item>
        <el-form-item label="模型名称" prop="modelName">
          <el-input v-model="form.modelName" placeholder="glm-5 / gpt-4 / llama3" />
        </el-form-item>
        <el-form-item label="API Key">
          <el-input
            v-model="form.apiKey"
            type="password"
            show-password
            autocomplete="new-password"
            :placeholder="isEdit ? '留空表示不修改原 Key' : '请输入 API Key'"
          />
          <div v-if="isEdit" class="form-tip">保存后将使用新 Key；留空则保留原有 Key 不变</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="handleSave">确定</el-button>
      </template>
    </el-dialog>
  </page-container>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useConfirmDelete } from '@/composables/useConfirmDelete'

const { confirmDelete } = useConfirmDelete()
import { llmProviderApi, type LlmProvider } from '@/api/llmProvider'

const providers = ref<LlmProvider[]>([])
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const saving = ref(false)

const form = reactive({
  name: '', displayName: '', providerType: 'OPENAI_COMPATIBLE',
  baseUrl: '', modelName: '', apiKey: ''
})

async function loadProviders() {
  try { providers.value = await llmProviderApi.listProviders() } catch {}
}

function showCreate() {
  isEdit.value = false
  editingId.value = null
  Object.assign(form, { name: '', displayName: '', providerType: 'OPENAI_COMPATIBLE', baseUrl: '', modelName: '', apiKey: '' })
  dialogVisible.value = true
}

function showEdit(p: LlmProvider) {
  isEdit.value = true
  editingId.value = p.id
  // API Key 不回显明文：留空提交表示保留原 Key
  Object.assign(form, { name: p.name, displayName: p.displayName, providerType: p.providerType, baseUrl: p.baseUrl, modelName: p.modelName, apiKey: '' })
  dialogVisible.value = true
}

const formRef = ref<FormInstance>()

// 统一表单规范：:rules + validate()，错误落在字段上，不再用提交时 ElMessage 兜底
const providerRules: FormRules = {
  name: [{ required: true, message: '请输入名称', trigger: 'blur' }],
  baseUrl: [{ required: true, message: '请输入 API 地址', trigger: 'blur' }],
  modelName: [{ required: true, message: '请输入模型名称', trigger: 'blur' }]
}

async function handleSave() {
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    if (isEdit.value && editingId.value) {
      await llmProviderApi.updateProvider(editingId.value, { ...form })
      ElMessage.success('更新成功')
    } else {
      await llmProviderApi.createProvider({ ...form, enabled: true, isDefault: providers.value.length === 0 })
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadProviders()
  } catch (e: any) { ElMessage.error(e.response?.data?.error || '操作失败') } finally { saving.value = false }
}

async function activate(p: LlmProvider) {
  try {
    await llmProviderApi.activateProvider(p.id)
    ElMessage.success(`已激活 ${p.displayName}`)
    await loadProviders()
  } catch (e: any) { ElMessage.error(e.response?.data?.error || '激活失败') }
}

async function handleDelete(p: LlmProvider) {
  if (!await confirmDelete(`Provider "${p.displayName}"`)) return
  try {
    await llmProviderApi.deleteProvider(p.id)
    ElMessage.success('已删除')
    await loadProviders()
  } catch {
    // 接口错误已由统一错误出口提示
  }
}

onMounted(loadProviders)
</script>

<style scoped>
.providers-view { padding: 0; }
.el-card { margin-bottom: 16px; }
.default-card { border-color: #67c23a; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.provider-info { font-size: 13px; line-height: 2; color: var(--ink-text-regular); }
.provider-info .label { color: var(--ink-text-secondary); }
.provider-users { margin-top: 10px; padding-top: 10px; border-top: 1px dashed var(--paper-border); font-size: 13px; }
.provider-users .label { color: var(--ink-text-secondary); margin-bottom: 6px; }
.no-users { color: #b8b1a0; font-size: 12px; }
.user-list { display: flex; flex-wrap: wrap; gap: 6px; }
.user-tag { cursor: default; }
.user-model { color: var(--ink-text-secondary); font-size: 11px; }
.card-actions { margin-top: 12px; display: flex; gap: 8px; }
.api-key-masked { font-family: var(--app-font-mono); font-size: 12px; color: var(--ink-text-regular); }
.api-key-tag { margin-left: 6px; }
.form-tip { font-size: 12px; color: var(--ink-text-secondary); line-height: 1.4; margin-top: 4px; }
.empty-text { text-align: center; color: var(--ink-text-secondary); padding: 40px; }
</style>
