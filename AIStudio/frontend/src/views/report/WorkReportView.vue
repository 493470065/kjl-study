<template>
  <page-container title="工作汇报">
    <div class="wr-layout">
      <!-- ===== 左侧：汇报类型列表 ===== -->
      <div class="wr-side">
        <div class="wr-side__title">汇报类型（{{ types.length }}）</div>
        <div v-for="t in types" :key="t.key" class="wr-type"
          :class="{ 'is-active': t.key === activeKey, 'is-disabled': !t.enabled }"
          @click="activeKey = t.key">
          <div class="wr-type__name">
            <el-icon v-if="t.enabled" class="wr-type__icon"><Memo /></el-icon>
            <el-icon v-else class="wr-type__icon is-muted"><Clock /></el-icon>
            <span>{{ t.name }}</span>
          </div>
          <div class="wr-type__desc">{{ t.description }}</div>
          <div class="wr-type__tags">
            <el-tag size="small" :type="t.enabled ? 'primary' : 'info'" effect="plain">
              {{ t.enabled ? executorOf(t).owner || t.owner : '待接入' }}
            </el-tag>
            <el-tag v-if="executorOf(t).skill" size="small" type="success" effect="plain">技能已绑定</el-tag>
          </div>
          <div class="wr-type__ops" @click.stop>
            <el-tooltip content="配置：技能 / Agent / 工作流 / 默认参数" placement="top">
              <el-button size="small" text :icon="Setting" @click="openConfig(t)" />
            </el-tooltip>
            <el-tooltip :content="executorOf(t).skill ? '手动触发：采集数据并生成本期报告' : '未绑定技能，先点击齿轮配置'" placement="top">
              <span>
                <el-button size="small" text type="primary" :icon="VideoPlay"
                  :disabled="!executorOf(t).skill" :loading="generatingKey === t.key"
                  @click="openGenerate(t)" />
              </span>
            </el-tooltip>
          </div>
        </div>

        <!-- 扩展入口 -->
        <el-tooltip content="扩展方式：生成端按统一 JSON Schema 输出到 public/reports/<key>.json，并在 src/config/reports.ts 注册（含 executor 绑定），页面自动识别" placement="bottom">
          <div class="wr-type wr-type--new">
            <el-icon><Plus /></el-icon>
            <span>更多汇报类型（按 Schema 扩展）</span>
          </div>
        </el-tooltip>
      </div>

      <!-- ===== 右侧：报告内容 ===== -->
      <div class="wr-main">
        <ReportRenderer v-if="activeType" :key="`${activeType.key}#${refreshTick}`" :data-url="activeType.dataUrl" />
        <el-card v-else shadow="never">
          <el-empty description="请选择左侧汇报类型" />
        </el-card>
      </div>
    </div>

    <!-- ===== 生成链路配置对话框 ===== -->
    <el-dialog v-model="cfgVisible" :title="`生成链路配置 — ${cfgTypeName}`" width="560px" destroy-on-close>
      <el-form label-width="110px" size="small">
        <el-form-item label="技能">
          <el-input v-model="cfgForm.skill" placeholder="AIStudio 技能名（data/skills/<技能名>），留空 = 未绑定" clearable />
        </el-form-item>
        <el-form-item label="执行入口">
          <el-input v-model="cfgForm.entry" placeholder="如 scripts/run.cjs（留空 = 按技能 frontmatter 自动探测）" clearable />
        </el-form-item>
        <el-form-item label="Agent">
          <el-input v-model="cfgForm.agent" placeholder="关联 Agent 名称（可空）" clearable />
        </el-form-item>
        <el-form-item label="工作流">
          <el-input v-model="cfgForm.workflow" placeholder="关联工作流名称（可空）" clearable />
        </el-form-item>
        <el-form-item label="填报人">
          <el-input v-model="cfgForm.owner" placeholder="默认填报人" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="填报部门">
          <el-input v-model="cfgForm.dept" placeholder="默认填报部门" clearable style="width: 200px" />
        </el-form-item>
        <el-form-item label="默认亮点">
          <el-input v-model="cfgForm.highlightsText" type="textarea" :rows="3"
            placeholder="每次生成的固定亮点，每行一条（可空）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button size="small" @click="cfgVisible = false">取消</el-button>
        <el-button size="small" type="primary" @click="saveConfig">保存</el-button>
      </template>
      <div class="wr-cfg-hint">配置按用户保存（后端偏好 workreport.executor.v1），仅覆盖注册表默认值。</div>
    </el-dialog>

    <!-- ===== 手动生成对话框 ===== -->
    <el-dialog v-model="genVisible" :title="`手动生成报告 — ${genTypeName}`" width="560px" destroy-on-close :close-on-click-modal="false">
      <el-form label-width="110px" size="small">
        <el-form-item label="统计起始日">
          <el-date-picker v-model="genForm.from" type="date" value-format="YYYY-MM-DD" style="width: 200px" />
        </el-form-item>
        <el-form-item label="统计截止日">
          <el-date-picker v-model="genForm.to" type="date" value-format="YYYY-MM-DD" style="width: 200px" />
        </el-form-item>
        <el-form-item label="期数">
          <el-input-number v-model="genForm.issue" :min="1" style="width: 140px" placeholder="留空自动推断" controls-position="right" />
          <span class="wr-gen-hint">不填则按当前报告期数 +1 自动推断</span>
        </el-form-item>
        <el-form-item label="填报人">
          <el-input v-model="genForm.owner" style="width: 200px" />
        </el-form-item>
        <el-form-item label="填报部门">
          <el-input v-model="genForm.dept" style="width: 200px" />
        </el-form-item>
        <el-form-item label="本期亮点">
          <el-input v-model="genForm.highlightsText" type="textarea" :rows="4"
            placeholder="本期自定义亮点，每行一条（自动亮点会追加在后面）" />
        </el-form-item>
      </el-form>

      <el-alert v-if="genResult" :type="genResult.ok ? 'success' : 'error'" :closable="false" class="wr-gen-result">
        <template v-if="genResult.ok">
          <div><b>生成成功</b>（耗时 {{ Math.round(genResult.durationMs / 1000) }} 秒）</div>
          <div class="wr-gen-path">报告：{{ genResult.mdPath }}</div>
          <div class="wr-gen-path">数据：{{ genResult.jsonPath }}（点击下方"刷新"查看）</div>
          <pre v-if="genResult.genTail" class="wr-gen-tail">{{ genResult.genTail }}</pre>
        </template>
        <template v-else>
          <div><b>生成失败</b></div>
          <pre class="wr-gen-tail">{{ genResult.error }}</pre>
        </template>
      </el-alert>

      <template #footer>
        <el-button size="small" @click="genVisible = false">关闭</el-button>
        <el-button v-if="genResult?.ok" size="small" @click="refreshTick++">刷新</el-button>
        <el-button size="small" type="primary" :loading="generating" @click="runGenerate">
          {{ generating ? '生成中（TFS 采集约 10~60 秒）…' : '开始生成' }}
        </el-button>
      </template>
    </el-dialog>
  </page-container>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue'
import { Memo, Clock, Plus, Setting, VideoPlay } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import { REPORT_TYPES, WORKREPORT_EXECUTOR_PREF_KEY, type ReportExecutor, type ReportTypeMeta } from '@/config/reports'
import { loadPref, savePref } from '@/utils/userPrefs'
import { skillApi } from '@/api/skill'
import ReportRenderer from './ReportRenderer.vue'

// ===== 类型与执行链路（注册表默认值 + 用户覆盖合并） =====
const types = REPORT_TYPES
const activeKey = ref(types.find(t => t.enabled)?.key ?? types[0]?.key ?? '')
const activeType = computed(() => types.find(t => t.key === activeKey.value))
const refreshTick = ref(0)

/** 用户覆盖：{ [typeKey]: Partial<ReportExecutor> }，持久化后端偏好 */
type ExecutorOverrides = Record<string, Partial<ReportExecutor> & { defaultArgs?: Partial<ReportExecutor['defaultArgs']> }>
const overrides = ref<ExecutorOverrides>(loadPref<ExecutorOverrides>(WORKREPORT_EXECUTOR_PREF_KEY, {}))

function executorOf(t: ReportTypeMeta): ReportExecutor {
  const base: ReportExecutor = t.executor || { skill: '', entry: '', agent: '', workflow: '', defaultArgs: { owner: t.owner, dept: '', highlights: [] } }
  const ov = overrides.value[t.key] || {}
  return {
    skill: ov.skill ?? base.skill,
    entry: ov.entry ?? base.entry,
    agent: ov.agent ?? base.agent,
    workflow: ov.workflow ?? base.workflow,
    defaultArgs: {
      owner: ov.defaultArgs?.owner ?? base.defaultArgs.owner,
      dept: ov.defaultArgs?.dept ?? base.defaultArgs.dept,
      highlights: ov.defaultArgs?.highlights ?? base.defaultArgs.highlights
    }
  }
}

const onPrefUpdated = (e: Event) => {
  try { overrides.value = (e as CustomEvent).detail || {} } catch { /* ignore */ }
}
onMounted(() => window.addEventListener(`userprefs-updated:${WORKREPORT_EXECUTOR_PREF_KEY}`, onPrefUpdated))
onUnmounted(() => window.removeEventListener(`userprefs-updated:${WORKREPORT_EXECUTOR_PREF_KEY}`, onPrefUpdated))

// ===== 配置对话框 =====
const cfgVisible = ref(false)
const cfgKey = ref('')
const cfgTypeName = computed(() => types.find(t => t.key === cfgKey.value)?.name || '')
const cfgForm = reactive({ skill: '', entry: '', agent: '', workflow: '', owner: '', dept: '', highlightsText: '' })

function openConfig(t: ReportTypeMeta) {
  cfgKey.value = t.key
  const ex = executorOf(t)
  cfgForm.skill = ex.skill
  cfgForm.entry = ex.entry
  cfgForm.agent = ex.agent
  cfgForm.workflow = ex.workflow
  cfgForm.owner = ex.defaultArgs.owner
  cfgForm.dept = ex.defaultArgs.dept
  cfgForm.highlightsText = ex.defaultArgs.highlights.join('\n')
  cfgVisible.value = true
}

function saveConfig() {
  const key = cfgKey.value
  overrides.value = {
    ...overrides.value,
    [key]: {
      skill: cfgForm.skill.trim(),
      entry: cfgForm.entry.trim(),
      agent: cfgForm.agent.trim(),
      workflow: cfgForm.workflow.trim(),
      defaultArgs: {
        owner: cfgForm.owner.trim(),
        dept: cfgForm.dept.trim(),
        highlights: cfgForm.highlightsText.split('\n').map(s => s.trim()).filter(Boolean)
      }
    }
  }
  savePref(WORKREPORT_EXECUTOR_PREF_KEY, overrides.value)
  cfgVisible.value = false
  ElMessage.success('生成链路配置已保存')
}

// ===== 手动生成对话框 =====
const genVisible = ref(false)
const genKey = ref('')
const genTypeName = computed(() => types.find(t => t.key === genKey.value)?.name || '')
const generating = ref(false)
const generatingKey = ref('')
const genResult = ref<{ ok: boolean; durationMs?: number; mdPath?: string; jsonPath?: string; genTail?: string; error?: string } | null>(null)
const genForm = reactive({ from: '', to: '', issue: undefined as number | undefined, owner: '', dept: '', highlightsText: '' })

function isoDate(d: Date): string { return d.toISOString().slice(0, 10) }

function openGenerate(t: ReportTypeMeta) {
  const ex = executorOf(t)
  genKey.value = t.key
  genResult.value = null
  const d14 = new Date(); d14.setDate(d14.getDate() - 13)
  genForm.from = isoDate(d14)
  genForm.to = isoDate(new Date())
  genForm.issue = undefined
  genForm.owner = ex.defaultArgs.owner
  genForm.dept = ex.defaultArgs.dept
  genForm.highlightsText = ex.defaultArgs.highlights.join('\n')
  genVisible.value = true
}

async function runGenerate() {
  const t = types.find(x => x.key === genKey.value)
  if (!t) return
  const ex = executorOf(t)
  generating.value = true
  generatingKey.value = t.key
  genResult.value = null
  try {
    const args: Record<string, unknown> = {
      from: genForm.from || undefined,
      to: genForm.to || undefined,
      issue: genForm.issue || undefined,
      owner: genForm.owner || undefined,
      dept: genForm.dept || undefined,
      highlights: genForm.highlightsText.split('\n').map(s => s.trim()).filter(Boolean)
    }
    const res = await skillApi.executeSkill(ex.skill, {
      entry: ex.entry || undefined,
      args,
      timeoutMs: 480000   // TFS 采集较慢（存储查询 37~51s），放宽到 8 分钟
    })
    const data = (res.data && typeof res.data === 'object' ? res.data : null) as any
    if (res.success && data?.ok) {
      genResult.value = { ok: true, durationMs: data.durationMs, mdPath: data.mdPath, jsonPath: data.jsonPath, genTail: data.genTail }
      refreshTick++
      ElMessage.success(`第 ${data.issue} 期报告已生成`)
    } else {
      const tail = res.stderr?.split('\n').slice(-8).join('\n') || res.stdout || '未知错误'
      genResult.value = { ok: false, error: res.timedOut ? '执行超时（8 分钟），可到技能目录手动重跑' : tail }
    }
  } catch (e: any) {
    genResult.value = { ok: false, error: e?.response?.data?.message || e?.message || '请求失败（后端不可达？）' }
  } finally {
    generating.value = false
    generatingKey.value = ''
  }
}
</script>

<style scoped>
.wr-layout {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}
.wr-side {
  width: 280px;
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.wr-side__title {
  font-size: 13px;
  color: var(--el-text-color-secondary);
  padding: 0 2px;
}
.wr-type {
  background: var(--el-bg-color);
  border: 1px solid var(--el-border-color-light);
  border-radius: 8px;
  padding: 12px 14px;
  cursor: pointer;
  transition: all 0.2s;
}
.wr-type:hover { border-color: var(--el-color-primary-light-5); }
.wr-type.is-active {
  border-color: var(--el-color-primary);
  box-shadow: 0 0 0 1px var(--el-color-primary-light-7);
}
.wr-type.is-disabled { opacity: 0.85; }
.wr-type--new {
  border-style: dashed;
  color: var(--el-text-color-secondary);
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  justify-content: center;
  cursor: default;
}
.wr-type__name {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 600;
  font-size: 14px;
  margin-bottom: 6px;
}
.wr-type__icon { color: var(--el-color-primary); }
.wr-type__icon.is-muted { color: var(--el-text-color-placeholder); }
.wr-type__desc { font-size: 12px; color: var(--el-text-color-secondary); line-height: 1.6; margin-bottom: 8px; }
.wr-type__tags { display: flex; gap: 6px; flex-wrap: wrap; }
.wr-type__ops {
  display: flex;
  justify-content: flex-end;
  gap: 2px;
  margin-top: 4px;
  border-top: 1px dashed var(--el-border-color-lighter);
  padding-top: 4px;
}
.wr-main { flex: 1; min-width: 0; }
.wr-cfg-hint { font-size: 12px; color: var(--el-text-color-secondary); padding: 0 4px; }
.wr-gen-hint { font-size: 12px; color: var(--el-text-color-secondary); margin-left: 8px; }
.wr-gen-result { margin-top: 4px; }
.wr-gen-path { font-size: 12px; word-break: break-all; }
.wr-gen-tail {
  font-size: 12px;
  background: var(--el-fill-color-light);
  padding: 8px;
  border-radius: 6px;
  max-height: 160px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
  margin: 6px 0 0;
}
</style>
