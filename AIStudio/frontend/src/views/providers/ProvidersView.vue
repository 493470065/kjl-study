<template>
  <div class="providers-view">
    <div class="page-header">
      <h2>LLM Provider 管理</h2>
      <el-button type="primary" @click="showCreate">新增 Provider</el-button>
    </div>

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
            <div v-if="!p.users || p.users.length === 0" class="no-users">暂无用户使用</div>
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

    <div v-if="!providers.length" class="empty-text">暂无 Provider 配置</div>

    <!-- 新增/编辑对话框 -->
    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑 Provider' : '新增 Provider'" width="500px">
      <el-form :model="form" label-width="100px">
        <el-form-item label="名称" required>
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
        <el-form-item label="API 地址" required>
          <el-input v-model="form.baseUrl" placeholder="https://api.example.com/v1" />
        </el-form-item>
        <el-form-item label="模型名称" required>
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
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
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

async function handleSave() {
  if (!form.name.trim() || !form.baseUrl.trim() || !form.modelName.trim()) {
    ElMessage.warning('请填写必填项')
    return
  }
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
  try {
    await ElMessageBox.confirm(`确定删除 Provider "${p.displayName}"？`, '确认')
    await llmProviderApi.deleteProvider(p.id)
    ElMessage.success('已删除')
    await loadProviders()
  } catch {}
}

onMounted(loadProviders)
</script>

<style scoped>
.providers-view { padding: 0; }
.page-header { display: flex; justify-content: space-between; align-items: center; margin-bottom: 16px; }
.page-header h2 { font-size: 18px; font-weight: 600; color: #303133; }
.el-card { margin-bottom: 16px; }
.default-card { border-color: #67c23a; }
.card-header { display: flex; justify-content: space-between; align-items: center; }
.provider-info { font-size: 13px; line-height: 2; color: #606266; }
.provider-info .label { color: #909399; }
.provider-users { margin-top: 10px; padding-top: 10px; border-top: 1px dashed #e4e7ed; font-size: 13px; }
.provider-users .label { color: #909399; margin-bottom: 6px; }
.no-users { color: #c0c4cc; font-size: 12px; }
.user-list { display: flex; flex-wrap: wrap; gap: 6px; }
.user-tag { cursor: default; }
.user-model { color: #909399; font-size: 11px; }
.card-actions { margin-top: 12px; display: flex; gap: 8px; }
.api-key-masked { font-family: Consolas, Menlo, monospace; font-size: 12px; color: #606266; }
.api-key-tag { margin-left: 6px; }
.form-tip { font-size: 12px; color: #909399; line-height: 1.4; margin-top: 4px; }
.empty-text { text-align: center; color: #909399; padding: 40px; }
</style>
