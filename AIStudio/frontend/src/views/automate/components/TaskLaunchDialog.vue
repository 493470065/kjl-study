<template>
  <el-dialog
    :model-value="modelValue"
    :title="taskType ? `启动「${taskType.name}」` : '启动自动化任务'"
    width="520px"
    @update:model-value="$emit('update:modelValue', $event)"
    @open="initForm"
  >
    <div v-if="taskType?.description" class="launch-desc">{{ taskType.description }}</div>
    <el-form ref="formRef" :model="formModel" :rules="rules" label-width="120px">
      <el-form-item
        v-for="field in fields"
        :key="field.key"
        :label="field.label"
        :prop="field.key"
      >
        <el-input-number
          v-if="field.type === 'number'"
          v-model="formModel[field.key]"
          :min="1"
          controls-position="right"
          :placeholder="field.placeholder"
          style="width: 100%"
        />
        <el-input
          v-else-if="field.type === 'textarea'"
          v-model="formModel[field.key]"
          type="textarea"
          :rows="4"
          :placeholder="field.placeholder"
        />
        <el-select
          v-else-if="field.type === 'select'"
          v-model="formModel[field.key]"
          :placeholder="field.placeholder || '请选择'"
          clearable
          style="width: 100%"
        >
          <el-option
            v-for="opt in field.options || []"
            :key="opt.value"
            :label="opt.label"
            :value="opt.value"
          />
        </el-select>
        <el-input
          v-else
          v-model="formModel[field.key]"
          :placeholder="field.placeholder"
          clearable
        />
      </el-form-item>
    </el-form>
    <template #footer>
      <el-button @click="$emit('update:modelValue', false)">取消</el-button>
      <el-button type="primary" :loading="launching" @click="handleLaunch">启动</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { automateApi, type AutomateTask, type AutomateFormField, type AutomateTaskType } from '@/api/automate'

const props = defineProps<{
  modelValue: boolean
  taskType: AutomateTaskType | null
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', v: boolean): void
  (e: 'launched', task: AutomateTask): void
}>()

const formRef = ref<FormInstance>()
const formModel = ref<Record<string, string | number>>({})
const launching = ref(false)

const fields = computed<AutomateFormField[]>(() => {
  if (!props.taskType?.formSchema) return []
  try {
    return JSON.parse(props.taskType.formSchema)
  } catch {
    return []
  }
})

const rules = computed<FormRules>(() => {
  const r: FormRules = {}
  for (const f of fields.value) {
    if (f.required) {
      r[f.key] = [{
        required: true,
        message: `请输入${f.label}`,
        trigger: f.type === 'select' ? 'change' : 'blur'
      }]
    }
  }
  return r
})

function initForm() {
  const model: Record<string, string | number> = {}
  for (const f of fields.value) {
    if (f.default !== undefined && f.default !== null && f.default !== '') {
      model[f.key] = f.default
    } else {
      model[f.key] = ''
    }
  }
  formModel.value = model
}

async function handleLaunch() {
  if (!props.taskType) return
  const valid = await formRef.value?.validate().catch(() => false)
  if (!valid) return
  launching.value = true
  try {
    // 过滤空值，保留 0 与有效数字
    const params: Record<string, unknown> = {}
    for (const [k, v] of Object.entries(formModel.value)) {
      if (v !== '' && v !== null && v !== undefined) params[k] = v
    }
    const task = await automateApi.startTyped(props.taskType.code, params)
    ElMessage.success('自动化任务已启动')
    emit('launched', task)
    emit('update:modelValue', false)
  } catch (e: any) {
    ElMessage.error('启动失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    launching.value = false
  }
}
</script>

<style scoped>
.launch-desc {
  color: #909399;
  font-size: 13px;
  margin-bottom: 16px;
  line-height: 1.6;
}
</style>
