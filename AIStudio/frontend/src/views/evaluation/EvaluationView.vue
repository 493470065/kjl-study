<template>
  <div class="evaluation-view">
    <h2>AI 评估</h2>

    <el-tabs v-model="activeTab">
      <!-- Tab 1: 在线评估 -->
      <el-tab-pane label="在线评估" name="online">
        <el-card>
          <template #header>在线评估</template>
          <el-form :model="evalForm" label-width="100px" :rules="evalRules" ref="evalFormRef">
            <el-form-item label="问题" prop="question">
              <el-input v-model="evalForm.question" type="textarea" :rows="3" placeholder="请输入需要评估的问题" />
            </el-form-item>
            <el-form-item label="回答" prop="answer">
              <el-input v-model="evalForm.answer" type="textarea" :rows="3" placeholder="请输入需要评估的回答" />
            </el-form-item>
            <el-form-item label="上下文">
              <el-input v-model="evalForm.context" type="textarea" :rows="2" placeholder="可选，用于 faithfulness 评估" />
            </el-form-item>
            <el-form-item label="期望答案">
              <el-input v-model="evalForm.groundTruth" type="textarea" :rows="2" placeholder="可选，用于 correctness 评估" />
            </el-form-item>
            <el-form-item label="评估器">
              <el-select v-model="evalForm.evaluator" placeholder="全部" clearable style="width: 300px;">
                <el-option label="全部" value="" />
                <el-option v-for="e in evaluators" :key="e" :label="e" :value="e" />
              </el-select>
            </el-form-item>
            <el-form-item>
              <el-button type="primary" @click="handleEvaluate" :loading="evaluating" :icon="DataAnalysis">开始评估</el-button>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- Evaluation Results Cards -->
        <div v-if="evalResults.length > 0" style="margin-top: 20px;">
          <h3>评估结果</h3>
          <el-row :gutter="16">
            <el-col :span="8" v-for="item in evalResults" :key="item.evaluatorName" style="margin-bottom: 16px;">
              <el-card shadow="hover" :class="['eval-card', item.passed ? 'card-passed' : 'card-failed']">
                <div class="eval-card-header">
                  <span class="eval-evaluator-name">{{ item.evaluatorName }}</span>
                  <el-tag :type="item.passed ? 'success' : 'danger'" size="small">
                    {{ item.passed ? '通过' : '未通过' }}
                  </el-tag>
                </div>
                <div class="eval-score-section">
                  <div class="eval-score-value" :style="{ color: item.passed ? '#67c23a' : '#f56c6c' }">
                    {{ Math.round(item.score) }}%
                  </div>
                  <el-progress
                    :percentage="Math.round(item.score)"
                    :color="item.passed ? '#67c23a' : '#f56c6c'"
                    :stroke-width="12"
                    :text-inside="true"
                    style="margin-top: 8px;"
                  />
                </div>
                <div class="eval-explanation">{{ item.explanation }}</div>
              </el-card>
            </el-col>
          </el-row>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 评估结果 -->
      <el-tab-pane label="评估结果" name="results">
        <!-- Stats Summary -->
        <el-row :gutter="20" style="margin-bottom: 20px;">
          <el-col :span="8">
            <el-card shadow="hover">
              <div class="stat-label">总评估次数</div>
              <div class="stat-value">{{ stats?.totalEvaluations || 0 }}</div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <div class="stat-label">通过率</div>
              <div class="stat-value" :style="{ color: (stats?.passRate || 0) >= 0.8 ? '#67c23a' : '#f56c6c' }">
                {{ ((stats?.passRate || 0) * 100).toFixed(1) }}%
              </div>
            </el-card>
          </el-col>
          <el-col :span="8">
            <el-card shadow="hover">
              <div class="stat-label">平均分</div>
              <div class="stat-value">{{ ((stats?.averageScore || 0)).toFixed(1) }}</div>
            </el-card>
          </el-col>
        </el-row>

        <!-- Per-Evaluator Stats -->
        <el-card v-if="stats?.byEvaluator?.length" style="margin-bottom: 16px;">
          <template #header>各评估器统计</template>
          <el-table :data="stats.byEvaluator" size="small" stripe>
            <el-table-column prop="evaluatorName" label="评估器" />
            <el-table-column prop="count" label="评估次数" width="120" />
            <el-table-column label="通过率" width="120">
              <template #default="{ row }">{{ (row.passRate * 100).toFixed(1) }}%</template>
            </el-table-column>
            <el-table-column label="平均分" width="120">
              <template #default="{ row }">{{ row.averageScore.toFixed(1) }}</template>
            </el-table-column>
          </el-table>
        </el-card>

        <div style="margin-bottom: 12px; display: flex; justify-content: flex-end;">
          <el-button type="danger" size="small" :icon="Delete" @click="handleClearResults" :disabled="!results.length">清除全部</el-button>
        </div>

        <el-table :data="results" v-loading="loadingResults" border stripe @row-click="handleRowClick">
          <el-table-column prop="evaluatorName" label="评估器" width="140" />
          <el-table-column prop="question" label="问题" show-overflow-tooltip />
          <el-table-column prop="score" label="分数" width="80">
            <template #default="{ row }">{{ row.score.toFixed(1) }}</template>
          </el-table-column>
          <el-table-column prop="threshold" label="阈值" width="80">
            <template #default="{ row }">{{ row.threshold }}</template>
          </el-table-column>
          <el-table-column prop="passed" label="结果" width="80">
            <template #default="{ row }">
              <el-tag :type="row.passed ? 'success' : 'danger'" size="small">
                {{ row.passed ? '通过' : '未通过' }}
              </el-tag>
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="时间" width="180">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
        </el-table>
      </el-tab-pane>

      <!-- Tab 3: 数据集管理 -->
      <el-tab-pane label="数据集管理" name="datasets">
        <div style="margin-bottom: 12px; display: flex; justify-content: flex-end;">
          <el-button type="primary" :icon="Plus" @click="showCreateDialog">新建数据集</el-button>
        </div>

        <el-table :data="datasets" v-loading="loadingDatasets" border stripe>
          <el-table-column prop="name" label="名称" />
          <el-table-column prop="description" label="描述" show-overflow-tooltip />
          <el-table-column label="条目数" width="100">
            <template #default="{ row }">
              {{ parseItemsCount(row.items) }}
            </template>
          </el-table-column>
          <el-table-column prop="createdAt" label="创建时间" width="180">
            <template #default="{ row }">{{ formatTime(row.createdAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="220" fixed="right">
            <template #default="{ row }">
              <el-button size="small" :icon="View" @click="handleViewDataset(row)">查看</el-button>
              <el-button size="small" type="primary" :icon="DataAnalysis" @click="handleRunDataset(row)">运行评估</el-button>
              <el-button size="small" type="danger" :icon="Delete" @click="handleDeleteDataset(row)">删除</el-button>
            </template>
          </el-table-column>
        </el-table>
      </el-tab-pane>
    </el-tabs>

    <!-- Result Detail Drawer -->
    <el-drawer v-model="drawerVisible" title="评估详情" size="500px">
      <template v-if="selectedResult">
        <el-descriptions :column="1" border>
          <el-descriptions-item label="评估器">{{ selectedResult.evaluatorName }}</el-descriptions-item>
          <el-descriptions-item label="分数">{{ selectedResult.score.toFixed(1) }}</el-descriptions-item>
          <el-descriptions-item label="阈值">{{ selectedResult.threshold }}</el-descriptions-item>
          <el-descriptions-item label="结果">
            <el-tag :type="selectedResult.passed ? 'success' : 'danger'" size="small">
              {{ selectedResult.passed ? '通过' : '未通过' }}
            </el-tag>
          </el-descriptions-item>
          <el-descriptions-item label="时间">{{ formatTime(selectedResult.createdAt) }}</el-descriptions-item>
        </el-descriptions>
        <el-divider />
        <h4>问题</h4>
        <p style="white-space: pre-wrap; background: #f5f7fa; padding: 12px; border-radius: 4px;">{{ selectedResult.question }}</p>
        <h4>回答</h4>
        <p style="white-space: pre-wrap; background: #f5f7fa; padding: 12px; border-radius: 4px;">{{ selectedResult.answer }}</p>
        <h4>说明</h4>
        <p style="white-space: pre-wrap; background: #f5f7fa; padding: 12px; border-radius: 4px;">{{ selectedResult.explanation }}</p>
        <div v-if="selectedResult.details">
          <h4>详细信息</h4>
          <p style="white-space: pre-wrap; background: #f5f7fa; padding: 12px; border-radius: 4px;">{{ selectedResult.details }}</p>
        </div>
      </template>
    </el-drawer>

    <!-- Dataset Detail Dialog -->
    <el-dialog v-model="datasetDetailVisible" :title="'数据集: ' + currentDataset?.name" width="700px">
      <template v-if="currentDataset">
        <p v-if="currentDataset.description" style="margin-bottom: 16px; color: #909399;">{{ currentDataset.description }}</p>
        <el-table :data="parsedItems(currentDataset.items)" size="small" border stripe>
          <el-table-column type="index" label="#" width="50" />
          <el-table-column prop="question" label="问题" show-overflow-tooltip />
          <el-table-column prop="context" label="上下文" show-overflow-tooltip />
          <el-table-column prop="groundTruth" label="期望答案" show-overflow-tooltip />
        </el-table>
      </template>
    </el-dialog>

    <!-- Create Dataset Dialog -->
    <el-dialog v-model="createDialogVisible" title="新建数据集" width="700px" @close="resetCreateForm">
      <el-form :model="createForm" label-width="100px" :rules="createRules" ref="createFormRef">
        <el-form-item label="名称" prop="name">
          <el-input v-model="createForm.name" placeholder="数据集名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="2" placeholder="可选描述" />
        </el-form-item>
        <el-form-item label="条目">
          <div style="width: 100%;">
            <div v-for="(item, idx) in createForm.items" :key="idx" style="border: 1px solid #ebeef5; border-radius: 4px; padding: 12px; margin-bottom: 12px;">
              <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
                <strong>条目 {{ idx + 1 }}</strong>
                <el-button size="small" type="danger" link :icon="Delete" @click="removeItem(idx)">移除</el-button>
              </div>
              <el-form-item :label="'问题'" :prop="'items.' + idx + '.question'" :rules="[{ required: true, message: '请输入问题', trigger: 'blur' }]" style="margin-bottom: 8px;">
                <el-input v-model="item.question" type="textarea" :rows="2" placeholder="问题" />
              </el-form-item>
              <el-form-item label="上下文" style="margin-bottom: 8px;">
                <el-input v-model="item.context" type="textarea" :rows="1" placeholder="可选" />
              </el-form-item>
              <el-form-item label="期望答案">
                <el-input v-model="item.groundTruth" type="textarea" :rows="1" placeholder="可选" />
              </el-form-item>
            </div>
            <el-button :icon="Plus" size="small" @click="addItem">添加条目</el-button>
          </div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleCreateDataset" :loading="creating">创建</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { DataAnalysis, Delete, Plus, View } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import {
  getEvaluators,
  evaluate,
  getResults,
  getStats,
  clearResults,
  getDatasets,
  getDataset,
  createDataset,
  deleteDataset,
  runDataset,
  type EvaluationRequest,
  type EvaluationScore,
  type EvaluationResult,
  type EvaluationDataset,
  type EvaluationStats
} from '@/api/evaluation'

const activeTab = ref('online')

// ========== Tab 1: 在线评估 ==========
const evalFormRef = ref<FormInstance>()
const evalForm = reactive<EvaluationRequest>({
  question: '',
  answer: '',
  context: '',
  groundTruth: '',
  evaluator: ''
})
const evalRules: FormRules = {
  question: [{ required: true, message: '请输入问题', trigger: 'blur' }],
  answer: [{ required: true, message: '请输入回答', trigger: 'blur' }]
}
const evaluators = ref<string[]>([])
const evaluating = ref(false)
const evalResults = ref<EvaluationScore[]>([])

async function loadEvaluators() {
  try {
    const res = await getEvaluators()
    evaluators.value = res.data || []
  } catch {
    // ignore
  }
}

async function handleEvaluate() {
  const valid = await evalFormRef.value?.validate().catch(() => false)
  if (!valid) return
  evaluating.value = true
  try {
    const payload: EvaluationRequest = {
      question: evalForm.question,
      answer: evalForm.answer
    }
    if (evalForm.context) payload.context = evalForm.context
    if (evalForm.groundTruth) payload.groundTruth = evalForm.groundTruth
    if (evalForm.evaluator) payload.evaluator = evalForm.evaluator

    const res = await evaluate(payload)
    evalResults.value = res.data || []
    ElMessage.success('评估完成')
  } catch (e: any) {
    ElMessage.error('评估失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    evaluating.value = false
  }
}

// ========== Tab 2: 评估结果 ==========
const loadingResults = ref(false)
const results = ref<EvaluationResult[]>([])
const stats = ref<EvaluationStats | null>(null)
const drawerVisible = ref(false)
const selectedResult = ref<EvaluationResult | null>(null)

async function loadResults() {
  loadingResults.value = true
  try {
    const [res, st] = await Promise.all([
      getResults(),
      getStats()
    ])
    results.value = res.data || []
    stats.value = st.data || null
  } catch {
    // ignore
  } finally {
    loadingResults.value = false
  }
}

function handleRowClick(row: EvaluationResult) {
  selectedResult.value = row
  drawerVisible.value = true
}

async function handleClearResults() {
  try {
    await ElMessageBox.confirm('确定清除全部评估结果？此操作不可恢复。', '确认', { type: 'warning' })
    await clearResults()
    ElMessage.success('已清除全部结果')
    await loadResults()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('清除失败')
  }
}

// ========== Tab 3: 数据集管理 ==========
const loadingDatasets = ref(false)
const datasets = ref<EvaluationDataset[]>([])
const createDialogVisible = ref(false)
const creating = ref(false)
const createFormRef = ref<FormInstance>()
const createForm = reactive({
  name: '',
  description: '',
  items: [] as Array<{ question: string; context: string; groundTruth: string }>
})
const createRules: FormRules = {
  name: [{ required: true, message: '请输入数据集名称', trigger: 'blur' }]
}
const datasetDetailVisible = ref(false)
const currentDataset = ref<EvaluationDataset | null>(null)

async function loadDatasets() {
  loadingDatasets.value = true
  try {
    const res = await getDatasets()
    datasets.value = res.data || []
  } catch {
    // ignore
  } finally {
    loadingDatasets.value = false
  }
}

function parseItemsCount(items: string): number {
  try {
    const parsed = JSON.parse(items)
    return Array.isArray(parsed) ? parsed.length : 0
  } catch {
    return 0
  }
}

function parsedItems(items: string): Array<{ question: string; context?: string; groundTruth?: string }> {
  try {
    const parsed = JSON.parse(items)
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function showCreateDialog() {
  createForm.name = ''
  createForm.description = ''
  createForm.items = [{ question: '', context: '', groundTruth: '' }]
  createDialogVisible.value = true
}

function addItem() {
  createForm.items.push({ question: '', context: '', groundTruth: '' })
}

function removeItem(idx: number) {
  createForm.items.splice(idx, 1)
}

async function handleCreateDataset() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  if (createForm.items.length === 0) {
    ElMessage.warning('请至少添加一个条目')
    return
  }
  creating.value = true
  try {
    const payload: EvaluationDataset = {
      name: createForm.name,
      description: createForm.description || undefined,
      items: JSON.stringify(createForm.items.map(item => ({
        question: item.question,
        context: item.context || undefined,
        groundTruth: item.groundTruth || undefined
      })))
    }
    await createDataset(payload)
    ElMessage.success('数据集创建成功')
    createDialogVisible.value = false
    await loadDatasets()
  } catch (e: any) {
    ElMessage.error('创建失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    creating.value = false
  }
}

function resetCreateForm() {
  createForm.name = ''
  createForm.description = ''
  createForm.items = []
  createFormRef.value?.clearValidate()
}

async function handleViewDataset(row: EvaluationDataset) {
  try {
    const res = await getDataset(row.id!)
    currentDataset.value = res.data
    datasetDetailVisible.value = true
  } catch {
    ElMessage.error('获取数据集详情失败')
  }
}

async function handleRunDataset(row: EvaluationDataset) {
  try {
    await ElMessageBox.confirm(`确定对数据集「${row.name}」运行评估？`, '确认', { type: 'info' })
    await runDataset(row.id!)
    ElMessage.success('评估任务已启动')
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('运行评估失败')
  }
}

async function handleDeleteDataset(row: EvaluationDataset) {
  try {
    await ElMessageBox.confirm(`确定删除数据集「${row.name}」？`, '确认', { type: 'warning' })
    await deleteDataset(row.id!)
    ElMessage.success('数据集已删除')
    await loadDatasets()
  } catch (e: any) {
    if (e !== 'cancel') ElMessage.error('删除失败')
  }
}

// ========== Helpers ==========
function formatTime(s?: string) {
  if (!s) return ''
  return s.replace('T', ' ').substring(0, 19)
}

// ========== Lifecycle ==========
onMounted(() => {
  loadEvaluators()
  loadResults()
  loadDatasets()
})
</script>

<style scoped>
.evaluation-view {
  padding: 0;
}

.stat-label {
  font-size: 13px;
  color: #909399;
  margin-bottom: 8px;
}

.stat-value {
  font-size: 28px;
  font-weight: bold;
  color: #409eff;
}

.eval-card {
  border-top: 3px solid transparent;
}

.eval-card.card-passed {
  border-top-color: #67c23a;
}

.eval-card.card-failed {
  border-top-color: #f56c6c;
}

.eval-card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.eval-evaluator-name {
  font-size: 15px;
  font-weight: 600;
  color: #303133;
}

.eval-score-section {
  text-align: center;
  margin-bottom: 12px;
}

.eval-score-value {
  font-size: 36px;
  font-weight: bold;
}

.eval-explanation {
  font-size: 13px;
  color: #606266;
  line-height: 1.6;
  max-height: 80px;
  overflow-y: auto;
}
</style>