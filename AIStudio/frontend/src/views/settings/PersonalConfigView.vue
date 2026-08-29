<template>
  <page-container title="个人配置">
    <!-- LLM 配置 -->
    <el-card class="config-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>我的 LLM 配置</span>
        </div>
      </template>
      <el-form
        :model="llmForm"
        label-width="140px"
        v-loading="llmLoading"
      >
        <el-form-item label="Provider">
          <el-select
            v-model="llmForm.providerId"
            placeholder="选择 Provider"
            clearable
            style="width: 100%"
          >
            <el-option
              v-for="p in providers"
              :key="p.id"
              :label="p.displayName || p.name"
              :value="p.id"
            />
          </el-select>
        </el-form-item>
        <el-form-item label="个人令牌">
          <el-input
            v-model="llmForm.apiKey"
            type="password"
            show-password
            placeholder="请输入您的个人 API 密钥"
          />
          <div v-if="!llmForm.apiKey" style="color: #e6a23c; font-size: 12px; margin-top: 4px;">
            未设置 API 密钥将无法使用 AI 对话功能
          </div>
        </el-form-item>
        <el-form-item label="模型名称覆盖">
          <el-input v-model="llmForm.modelName" placeholder="留空则使用默认模型" />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveLlm" :loading="llmSaving">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>

    <!-- TFS 配置 -->
    <el-card class="config-card">
      <template #header>
        <div class="card-header">
          <span>我的 TFS 配置</span>
        </div>
      </template>
      <el-form
        :model="tfsForm"
        label-width="160px"
        v-loading="tfsLoading"
      >
        <el-form-item label="TFS Server URL">
          <el-input v-model="tfsForm.tfsServerUrl" placeholder="如 http://tfs.example.com:8080/tfs" />
        </el-form-item>
        <el-form-item label="Personal Access Token">
          <el-input
            v-model="tfsForm.personalAccessToken"
            type="password"
            show-password
            placeholder="输入 PAT"
          />
        </el-form-item>
        <el-form-item label="Git 用户名">
          <el-input v-model="tfsForm.gitUsername" placeholder="输入 Git 用户名" />
        </el-form-item>
        <el-form-item label="Git 密码">
          <el-input
            v-model="tfsForm.gitPassword"
            type="password"
            show-password
            placeholder="输入 Git 密码"
          />
        </el-form-item>
        <el-form-item label="WxP 工号">
          <el-input v-model="tfsForm.wxpUsercode" placeholder="输入 WxP 工号" />
        </el-form-item>
        <el-form-item label="WxP 密码">
          <el-input
            v-model="tfsForm.wxpPassword"
            type="password"
            show-password
            placeholder="输入 WxP 密码"
          />
        </el-form-item>
        <el-form-item>
          <el-button type="primary" @click="saveTfs" :loading="tfsSaving">保存</el-button>
        </el-form-item>
      </el-form>
    </el-card>
  </page-container>
</template>

<script setup lang="ts">
import { reactive, ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { userConfigApi, type UserLlmConfig, type UserTfsConfig } from '@/api/userConfig'
import { llmProviderApi, type LlmProvider } from '@/api/llmProvider'

// LLM 配置
const llmLoading = ref(false)
const llmSaving = ref(false)
const providers = ref<LlmProvider[]>([])
const llmForm = reactive<UserLlmConfig>({
  providerId: undefined,
  apiKey: '',
  modelName: '',
  enabled: true
})

// TFS 配置
const tfsLoading = ref(false)
const tfsSaving = ref(false)
const tfsForm = reactive<UserTfsConfig>({
  tfsServerUrl: '',
  personalAccessToken: '',
  gitUsername: '',
  gitPassword: '',
  wxpUsercode: '',
  wxpPassword: '',
  enabled: true
})

async function loadProviders() {
  try {
    providers.value = await llmProviderApi.listProviders()
  } catch (e: any) {
    ElMessage.error('加载 Provider 列表失败: ' + (e?.response?.data?.error || e.message))
  }
}

async function loadLlmConfig() {
  llmLoading.value = true
  try {
    const data = await userConfigApi.getLlmConfig()
    if (data) {
      llmForm.providerId = data.providerId
      llmForm.apiKey = data.apiKey || ''
      llmForm.modelName = data.modelName || ''
      llmForm.enabled = data.enabled ?? true
    }
  } catch (e: any) {
    // 404 means no config yet, that's fine
    if (e?.response?.status !== 404) {
      ElMessage.error('加载 LLM 配置失败: ' + (e?.response?.data?.error || e.message))
    }
  } finally {
    llmLoading.value = false
  }
}

async function loadTfsConfig() {
  tfsLoading.value = true
  try {
    const data = await userConfigApi.getTfsConfig()
    if (data) {
      tfsForm.tfsServerUrl = data.tfsServerUrl || ''
      tfsForm.personalAccessToken = data.personalAccessToken || ''
      tfsForm.gitUsername = data.gitUsername || ''
      tfsForm.gitPassword = data.gitPassword || ''
      tfsForm.wxpUsercode = data.wxpUsercode || ''
      tfsForm.wxpPassword = data.wxpPassword || ''
      tfsForm.enabled = data.enabled ?? true
    }
  } catch (e: any) {
    if (e?.response?.status !== 404) {
      ElMessage.error('加载 TFS 配置失败: ' + (e?.response?.data?.error || e.message))
    }
  } finally {
    tfsLoading.value = false
  }
}

async function saveLlm() {
  llmSaving.value = true
  try {
    await userConfigApi.saveLlmConfig({ ...llmForm })
    ElMessage.success('LLM 配置保存成功')
  } catch (e: any) {
    ElMessage.error('LLM 配置保存失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    llmSaving.value = false
  }
}

async function saveTfs() {
  tfsSaving.value = true
  try {
    await userConfigApi.saveTfsConfig({ ...tfsForm })
    ElMessage.success('TFS 配置保存成功')
  } catch (e: any) {
    ElMessage.error('TFS 配置保存失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    tfsSaving.value = false
  }
}

onMounted(async () => {
  await loadProviders()
  await loadLlmConfig()
  await loadTfsConfig()
})
</script>

<style scoped>
.config-card {
  margin-bottom: 20px;
  border: 1px solid var(--paper-light);
}

.config-card:last-child {
  margin-bottom: 0;
}

.card-header {
  font-weight: 600;
  font-size: 16px;
}
</style>
