<template>
  <div class="gr-wrap" v-loading="loading">
    <!-- 加载/错误态 -->
    <el-alert v-if="error" type="error" :title="error" :closable="false" />

    <template v-if="report">
      <!-- ===== 报告头 ===== -->
      <el-card shadow="never" class="gr-card">
        <div class="gr-head">
          <div class="gr-head__main">
            <div class="gr-head__title">
              <span>{{ report.name }}</span>
              <el-tag type="primary" effect="dark" size="small">{{ report.issue }}</el-tag>
            </div>
            <el-descriptions :column="4" size="small" class="gr-head__meta">
              <el-descriptions-item v-for="[k, v] in report.meta" :key="k" :label="k">{{ v }}</el-descriptions-item>
            </el-descriptions>
          </div>
          <div class="gr-head__ops">
            <el-button size="small" :icon="Refresh" @click="load(props.dataUrl)">刷新</el-button>
            <el-button size="small" type="primary" :icon="Download" @click="exportMd">导出 MD</el-button>
          </div>
        </div>
        <el-alert type="info" :closable="false" class="gr-statement">
          <b>填报说明</b>：{{ report.statement }}
        </el-alert>
      </el-card>

      <!-- ===== 亮点 ===== -->
      <el-card shadow="never" class="gr-card">
        <template #header><span class="gr-card__title">本期工作亮点 / 做法</span></template>
        <ol class="gr-highlights">
          <li v-for="(h, i) in report.highlights" :key="i" v-html="renderBold(h)" />
        </ol>
      </el-card>

      <!-- ===== 各章节 ===== -->
      <el-card v-for="sec in report.sections" :key="sec.title" shadow="never" class="gr-card">
        <template #header><span class="gr-card__title">{{ sec.title }}</span></template>
        <template v-for="(block, bi) in sec.blocks" :key="bi">
          <!-- 表格块 -->
          <div v-if="block.type === 'table'" class="gr-block">
            <div class="gr-block__head">
              <span class="gr-block__title">{{ block.title }}</span>
              <div v-if="block.filterable" class="gr-block__filter">
                <el-input v-model="filterKeyword" placeholder="搜索 TFS号 / 标题 / 负责人" clearable size="small"
                  style="width: 220px" :prefix-icon="Search" />
              </div>
            </div>
            <div v-if="block.note" class="gr-block__note">{{ block.note }}</div>
            <el-table :data="tableRows(block)" border size="small" class="gr-table">
              <el-table-column v-for="(col, ci) in block.columns" :key="col" :label="col" :min-width="colWidth(col, block.columns)">
                <template #default="{ row }">
                  <el-tag v-if="col === '状态'" :type="stateTag(row[ci]).type" size="small">{{ stateTag(row[ci]).text }}</el-tag>
                  <el-tag v-else-if="col === '本期变化'" :type="changeTag(row[ci])" size="small" effect="plain">{{ row[ci] }}</el-tag>
                  <span v-else>{{ row[ci] }}</span>
                </template>
              </el-table-column>
            </el-table>
          </div>
          <!-- 说明块 -->
          <el-alert v-else-if="block.type === 'note'" type="warning" :closable="false" class="gr-block gr-note">
            {{ block.text }}
          </el-alert>
        </template>
      </el-card>

      <!-- ===== 图例 ===== -->
      <div v-if="report.legend?.length" class="gr-legend">
        <el-tag v-for="l in report.legend" :key="l" size="small" type="info" effect="plain">{{ l }}</el-tag>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { Search, Refresh, Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'

interface TableBlock {
  type: 'table'
  title: string
  note?: string
  columns: string[]
  rows: string[][]
  filterable?: boolean
}
interface NoteBlock { type: 'note'; text: string }
type Block = TableBlock | NoteBlock

interface ReportData {
  key: string
  name: string
  issue: string
  meta: [string, string][]
  statement: string
  highlights: string[]
  sections: { title: string; blocks: Block[] }[]
  legend?: string[]
}

const props = defineProps<{ dataUrl: string }>()

const loading = ref(false)
const error = ref('')
const report = ref<ReportData | null>(null)
const filterKeyword = ref('')

async function load(url: string) {
  loading.value = true
  error.value = ''
  filterKeyword.value = ''
  try {
    const res = await fetch(url, { cache: 'no-store' })
    if (!res.ok) throw new Error(`加载报告数据失败：HTTP ${res.status}`)
    report.value = await res.json()
  } catch (e: any) {
    error.value = e?.message || '加载报告数据失败'
    report.value = null
  } finally {
    loading.value = false
  }
}

watch(() => props.dataUrl, url => load(url), { immediate: true })

/** 明细表过滤：filterable 块支持关键词搜索（任一单元格命中） */
function tableRows(block: TableBlock): string[][] {
  if (!block.filterable) return block.rows
  const kw = filterKeyword.value.trim().toLowerCase()
  if (!kw) return block.rows
  return block.rows.filter(r => r.some(c => String(c).toLowerCase().includes(kw)))
}

/** ✅/🔄/⏳/❌ → 标签 */
function stateTag(v: string): { type: 'success' | 'warning' | 'info' | 'danger' | 'primary'; text: string } {
  if (v === '✅') return { type: 'success', text: '已完成' }
  if (v === '🔄') return { type: 'warning', text: '进行中' }
  if (v === '⏳') return { type: 'info', text: '待开始' }
  if (v === '❌') return { type: 'danger', text: '已取消/暂缓' }
  return { type: 'info', text: v }
}

/** 本期变化 → 标签色 */
function changeTag(v: string): 'success' | 'primary' | 'warning' | 'info' {
  if (v === '本期完成') return 'success'
  if (v === '本期新增并完成') return 'primary'
  if (v === '推进至已解决') return 'warning'
  if (v === '本期新增') return 'info'
  return 'info'
}

function colWidth(col: string, columns: string[]): number {
  if (col === '标题' || col === '本期变化' || col === '备注' || col === '指标') return 240
  if (col === '序号') return 60
  return Math.max(90, Math.floor(1000 / columns.length))
}

/** 亮点里的 **加粗** → <b> */
function renderBold(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\*\*(.+?)\*\*/g, '<b>$1</b>')
}

// ==================== 导出 MD ====================

/** 表格单元格转 MD：竖线转义，空值补空 */
function mdCell(v: string): string {
  return String(v ?? '').replace(/\|/g, '\\|').replace(/\n/g, ' ')
}

function mdTable(columns: string[], rows: string[][]): string[] {
  const lines: string[] = []
  lines.push(`| ${columns.join(' | ')} |`)
  lines.push(`|${columns.map(() => '------').join('|')}|`)
  for (const r of rows) lines.push(`| ${columns.map((_, i) => mdCell(r[i])).join(' | ')} |`)
  return lines
}

/** 报告 JSON → Markdown（与模板 F:/spec-autodev-biweekly-report-template.md 同构） */
function buildMarkdown(r: ReportData): string {
  const L: string[] = []
  L.push(`# ${r.name}（${r.issue}）`)
  L.push('')
  for (const [k, v] of r.meta || []) L.push(`> ${k}：${v}`)
  L.push('')
  L.push(`> **填报说明**：${r.statement || ''}`)
  L.push('')
  L.push('---')
  L.push('')
  L.push('## 一、本期工作亮点 / 做法')
  L.push('')
  ;(r.highlights || []).forEach((h, i) => L.push(`${i + 1}. ${h}`))
  L.push('')
  L.push('---')
  L.push('')
  for (const sec of r.sections || []) {
    L.push(`## ${sec.title}`)
    L.push('')
    for (const block of sec.blocks || []) {
      if (block.type === 'table') {
        if (block.title) { L.push(`### ${block.title}`); L.push('') }
        if ((block as TableBlock).note) { L.push(`> ${(block as TableBlock).note}`); L.push('') }
        L.push(...mdTable((block as TableBlock).columns, (block as TableBlock).rows))
        L.push('')
      } else if (block.type === 'note') {
        L.push(`> ${(block as NoteBlock).text}`)
        L.push('')
      }
    }
    L.push('---')
    L.push('')
  }
  if (r.legend?.length) {
    L.push(`> ${r.legend.join('　')}`)
    L.push('')
  }
  return L.join('\n')
}

/** 导出当前报告为 MD 文件下载 */
function exportMd() {
  if (!report.value) return
  const r = report.value
  const metaDept = (r.meta || []).find(([k]) => k === '填报部门')?.[1] || ''
  const issueTag = String(r.issue || '').replace(/\s+/g, '')
  const filename = `${metaDept ? `【${metaDept}】` : ''}${r.name}（${issueTag}）.md`.replace(/[\\/:*?"<>|]/g, '_')
  const blob = new Blob(['\ufeff' + buildMarkdown(r)], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
  ElMessage.success(`已导出：${filename}`)
}
</script>

<style scoped>
.gr-wrap { display: flex; flex-direction: column; gap: 14px; }
.gr-card { border-radius: 8px; }
.gr-card__title { font-weight: 600; }
.gr-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
.gr-head__ops { flex-shrink: 0; display: flex; gap: 8px; }
.gr-head__title { display: flex; align-items: center; gap: 10px; font-size: 17px; font-weight: 600; margin-bottom: 10px; }
.gr-head__meta { margin-bottom: 4px; }
.gr-statement { border-radius: 6px; }
.gr-highlights { margin: 0; padding-left: 20px; line-height: 2; color: var(--el-text-color-regular); }
.gr-block { margin-bottom: 18px; }
.gr-block:last-child { margin-bottom: 0; }
.gr-block__head { display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px; }
.gr-block__title { font-weight: 600; font-size: 14px; }
.gr-block__note { font-size: 12px; color: var(--el-text-color-secondary); margin-bottom: 8px; line-height: 1.7; }
.gr-note { border-radius: 6px; }
.gr-table { width: 100%; }
.gr-legend { display: flex; gap: 8px; padding: 2px 4px 8px; }
</style>
