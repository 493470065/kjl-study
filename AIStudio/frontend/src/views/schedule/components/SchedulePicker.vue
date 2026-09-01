<template>
  <div class="schedule-picker">
    <!-- 频率模式 -->
    <el-radio-group v-model="mode" size="small">
      <el-radio-button value="min">每分钟</el-radio-button>
      <el-radio-button value="hour">每小时</el-radio-button>
      <el-radio-button value="day">每天</el-radio-button>
      <el-radio-button value="week">每周</el-radio-button>
      <el-radio-button value="month">每月</el-radio-button>
      <el-radio-button value="custom">自定义</el-radio-button>
    </el-radio-group>

    <!-- 模式参数 -->
    <div class="picker-detail">
      <span v-if="mode === 'min'">每
        <el-input-number v-model="p.minInterval" :min="1" :max="59" size="small" controls-position="right" style="width: 84px" />
        分钟执行一次
      </span>
      <span v-else-if="mode === 'hour'">每
        <el-input-number v-model="p.hourInterval" :min="1" :max="23" size="small" controls-position="right" style="width: 84px" />
        小时的第
        <el-input-number v-model="p.hourMinute" :min="0" :max="59" size="small" controls-position="right" style="width: 84px" />
        分执行
      </span>
      <span v-else-if="mode === 'day'">每天 <el-time-picker v-model="p.time" format="HH:mm" value-format="HH:mm" size="small" style="width: 96px" /> 执行
      </span>
      <span v-else-if="mode === 'week'" class="week-line">
        <el-checkbox-group v-model="p.weekDays" size="small">
          <el-checkbox-button v-for="d in WEEK_DAYS" :key="d.value" :value="d.value">{{ d.label }}</el-checkbox-button>
        </el-checkbox-group>
        <span class="week-time"><el-time-picker v-model="p.time" format="HH:mm" value-format="HH:mm" size="small" style="width: 96px" /> 执行</span>
      </span>
      <span v-else-if="mode === 'month'">每月
        <el-input-number v-model="p.monthDay" :min="1" :max="28" size="small" controls-position="right" style="width: 84px" />
        号 <el-time-picker v-model="p.time" format="HH:mm" value-format="HH:mm" size="small" style="width: 96px" /> 执行
        <span class="picker-tip">（建议 1~28 号，避免小月跳过）</span>
      </span>
      <el-input v-else v-model="p.custom" size="small" placeholder="Spring Cron 6 位，如 0 0 2 * * ?" style="width: 260px" />
    </div>

    <!-- 结果预览：生成的表达式 + 接下来几次执行时间 -->
    <div class="picker-preview" v-loading="previewLoading">
      <code>{{ cron }}</code>
      <span v-if="invalid" class="pv-bad">✗ 表达式不合法</span>
      <span v-else-if="nextRuns.length" class="pv-ok">接下来执行：<b>{{ nextRuns.join('　') }}</b></span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue'
import { previewCron } from '@/api/scheduledTasks'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ (e: 'update:modelValue', v: string): void }>()

const WEEK_DAYS = [
  { value: 'MON', label: '一' }, { value: 'TUE', label: '二' }, { value: 'WED', label: '三' },
  { value: 'THU', label: '四' }, { value: 'FRI', label: '五' }, { value: 'SAT', label: '六' },
  { value: 'SUN', label: '日' },
]

type Mode = 'min' | 'hour' | 'day' | 'week' | 'month' | 'custom'
const mode = ref<Mode>('day')
const p = reactive({
  minInterval: 30,
  hourInterval: 1, hourMinute: 0,
  time: '02:00',
  weekDays: ['MON'] as string[],
  monthDay: 1,
  custom: '0 0 2 * * ?',
})

/** 由配置生成 Cron（编辑既有 Cron 时反解回参数） */
const cron = computed(() => {
  switch (mode.value) {
    case 'min': return `0 */${p.minInterval} * * * ?`
    case 'hour': return `0 ${p.hourMinute} */${p.hourInterval} * * ?`
    case 'day': { const [h, m] = (p.time || '02:00').split(':'); return `0 ${+m} ${+h} * * ?` }
    case 'week': {
      const [h, m] = (p.time || '02:00').split(':')
      const days = p.weekDays.length ? p.weekDays.join(',') : 'MON'
      return `0 ${+m} ${+h} ? * ${days}`
    }
    case 'month': { const [h, m] = (p.time || '02:00').split(':'); return `0 ${+m} ${+h} ${p.monthDay} * ?` }
    default: return p.custom.trim()
  }
})

function parseToMode(value: string): boolean {
  const v = (value || '').trim()
  if (!v) return false
  let m
  if ((m = v.match(/^0 \*\/(\d+) \* \* \* \?$/))) { mode.value = 'min'; p.minInterval = +m[1]; return true }
  if ((m = v.match(/^0 (\d+) \*\/(\d+) \* \* \?$/))) { mode.value = 'hour'; p.hourMinute = +m[1]; p.hourInterval = +m[2]; return true }
  if ((m = v.match(/^0 (\d+) (\d+) \* \* \?$/))) { mode.value = 'day'; p.time = `${m[2].padStart(2, '0')}:${m[1].padStart(2, '0')}`; return true }
  if ((m = v.match(/^0 (\d+) (\d+) \? \* ([A-Z]+(?:,[A-Z]+)*)$/))) {
    mode.value = 'week'; p.time = `${m[2].padStart(2, '0')}:${m[1].padStart(2, '0')}`
    p.weekDays = m[3].split(',').filter(d => WEEK_DAYS.some(w => w.value === d))
    return true
  }
  if ((m = v.match(/^0 (\d+) (\d+) (\d+) \* \?$/))) { mode.value = 'month'; p.time = `${m[2].padStart(2, '0')}:${m[1].padStart(2, '0')}`; p.monthDay = +m[3]; return true }
  mode.value = 'custom'; p.custom = v
  return true
}

// 初始值：父组件已有 cron 则反解，否则采用默认「每天 02:00」并立即回写
if (props.modelValue) parseToMode(props.modelValue)
else emit('update:modelValue', cron.value)

watch([mode, () => ({ ...p })], () => {
  emit('update:modelValue', cron.value)
  refreshPreview()
}, { deep: true })

// ===== 执行时间预览（防抖调用后端）=====
const nextRuns = ref<string[]>([])
const invalid = ref(false)
const previewLoading = ref(false)
let timer: ReturnType<typeof setTimeout> | null = null

function refreshPreview() {
  if (timer) clearTimeout(timer)
  timer = setTimeout(async () => {
    previewLoading.value = true
    try {
      const r = await previewCron(cron.value)
      nextRuns.value = r.next; invalid.value = false
    } catch {
      nextRuns.value = []; invalid.value = true
    } finally {
      previewLoading.value = false
    }
  }, 350)
}
refreshPreview()
</script>

<style scoped>
.schedule-picker { display: flex; flex-direction: column; gap: 8px; width: 100%; }
.picker-detail { display: flex; align-items: center; min-height: 32px; font-size: 13px; color: var(--ink-text-regular); }
.picker-detail :deep(.el-input-number .el-input__inner) { text-align: left; }
.week-line { display: flex; align-items: center; flex-wrap: wrap; gap: 8px; }
.week-time { display: inline-flex; align-items: center; gap: 4px; }
.picker-tip { color: var(--ink-text-secondary); font-size: 12px; }
.picker-preview { font-size: 12px; color: var(--ink-text-secondary); display: flex; align-items: center; gap: 8px; flex-wrap: wrap; min-height: 20px; }
.picker-preview code { background: var(--el-fill-color); padding: 2px 6px; border-radius: 3px; font-family: var(--app-font-mono); }
.pv-ok b { color: var(--el-color-primary); font-weight: 500; }
.pv-bad { color: var(--el-color-danger); }
</style>
