<template>
  <div class="settings-view">
    <div class="page-header">
      <h2>系统配置</h2>
      <el-button type="primary" @click="handleAdd">
        <el-icon><Plus /></el-icon> 添加配置
      </el-button>
    </div>

    <el-tabs v-model="activeGroup" @tab-change="loadConfigs">
      <el-tab-pane label="全部" name="" />
      <el-tab-pane label="WxP" name="wxp" />
      <el-tab-pane label="TFS" name="tfs" />
      <el-tab-pane label="其他" name="other" />
    </el-tabs>

    <el-table :data="configs" stripe style="width: 100%" v-loading="loading">
      <el-table-column prop="configKey" label="配置键" width="200" />
      <el-table-column prop="configValue" label="配置值" min-width="250">
        <template #default="{ row }">
          <span v-if="isSensitive(row.configKey)" class="sensitive-value">
            {{ showValues[row.configKey] ? row.configValue : '••••••••' }}
            <el-button link size="small" @click="showValues[row.configKey] = !showValues[row.configKey]">
              <el-icon>
                <View v-if="!showValues[row.configKey]" />
                <Hide v-else />
              </el-icon>
            </el-button>
          </span>
          <span v-else>{{ row.configValue }}</span>
        </template>
      </el-table-column>
      <el-table-column prop="description" label="描述" width="200" />
      <el-table-column prop="configGroup" label="分组" width="100">
        <template #default="{ row }">
          <el-tag size="small">{{ row.configGroup || '-' }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column label="操作" width="150" fixed="right">
        <template #default="{ row }">
          <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
          <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>

    <el-dialog v-model="dialogVisible" :title="isEdit ? '编辑配置' : '添加配置'" width="500px">
      <el-form :model="form" label-width="80px">
        <el-form-item label="配置键">
          <el-input v-model="form.configKey" :disabled="isEdit" placeholder="如 wxp.usercode" />
        </el-form-item>
        <el-form-item label="配置值">
          <el-input v-model="form.configValue" type="textarea" :rows="3" placeholder="配置值" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" placeholder="配置说明" />
        </el-form-item>
        <el-form-item label="分组">
          <el-select v-model="form.configGroup" placeholder="选择分组" clearable>
            <el-option label="WxP" value="wxp" />
            <el-option label="TFS" value="tfs" />
            <el-option label="其他" value="other" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="saving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, View, Hide } from '@element-plus/icons-vue'
import { listConfigs, saveConfig, deleteConfig, type SystemConfig } from '@/api/systemConfig'

const loading = ref(false)
const saving = ref(false)
const configs = ref<SystemConfig[]>([])
const activeGroup = ref('')
const dialogVisible = ref(false)
const isEdit = ref(false)
const showValues = reactive<Record<string, boolean>>({})

const form = reactive<SystemConfig>({
  configKey: '',
  configValue: '',
  description: '',
  configGroup: '',
})

const SENSITIVE_KEYS = ['password', 'secret', 'token', 'pat', 'apikey']

function isSensitive(key: string): boolean {
  return SENSITIVE_KEYS.some(s => key.toLowerCase().includes(s))
}

async function loadConfigs() {
  loading.value = true
  try {
    configs.value = await listConfigs(activeGroup.value || undefined)
  } catch (e: any) {
    ElMessage.error('加载配置失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  isEdit.value = false
  form.configKey = ''
  form.configValue = ''
  form.description = ''
  form.configGroup = activeGroup.value || ''
  dialogVisible.value = true
}

function handleEdit(row: SystemConfig) {
  isEdit.value = true
  form.configKey = row.configKey
  form.configValue = row.configValue
  form.description = row.description || ''
  form.configGroup = row.configGroup || ''
  dialogVisible.value = true
}

async function handleSave() {
  if (!form.configKey || !form.configValue) {
    ElMessage.warning('配置键和配置值不能为空')
    return
  }
  saving.value = true
  try {
    await saveConfig({ ...form })
    ElMessage.success('保存成功')
    dialogVisible.value = false
    await loadConfigs()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: SystemConfig) {
  try {
    await ElMessageBox.confirm(`确定删除配置 "${row.configKey}" ?`, '确认删除', { type: 'warning' })
    await deleteConfig(row.id!)
    ElMessage.success('已删除')
    await loadConfigs()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

onMounted(() => loadConfigs())
</script>

<style scoped>
.settings-view {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
  color: #303133;
}

.sensitive-value {
  display: flex;
  align-items: center;
  gap: 4px;
  font-family: monospace;
}
</style>
