<template>
  <div class="structured-view">
    <h2>结构化输出</h2>

    <el-tabs v-model="activeTab">
      <!-- Tab 1: 需求分析结构化 -->
      <el-tab-pane label="需求分析结构化" name="requirement">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon style="vertical-align: middle; margin-right: 6px;"><DataAnalysis /></el-icon>需求分析</span>
            </div>
          </template>
          <el-form :model="reqForm" label-width="100px" :rules="reqRules" ref="reqFormRef">
            <el-form-item label="需求文本" prop="requirement">
              <el-input v-model="reqForm.requirement" type="textarea" :rows="6" placeholder="请输入需求描述文本，例如：&#10;作为门诊医生，我希望在书写病历时能自动获取患者的历史诊断信息，减少重复录入。" />
            </el-form-item>
            <el-form-item label="上下文">
              <el-input v-model="reqForm.context" type="textarea" :rows="3" placeholder="可选，提供业务背景或系统约束信息" />
            </el-form-item>
            <el-form-item>
              <div style="display: flex; gap: 12px;">
                <el-button type="primary" @click="handleAnalyzeRequirement" :loading="reqAnalyzing" :icon="DataAnalysis">分析</el-button>
                <el-button size="small" @click="showSchemaDialog('requirement')" :icon="CopyDocument">查看 Schema</el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- Requirement Analysis Result -->
        <div v-if="reqResult" style="margin-top: 20px;">
          <el-card shadow="never" class="result-card">
            <template #header>
              <div class="card-header">
                <span><el-icon style="vertical-align: middle; margin-right: 6px;"><Document /></el-icon>分析结果</span>
              </div>
            </template>
            <el-descriptions :column="2" border>
              <el-descriptions-item label="概要" :span="2">
                {{ reqResult.summary }}
              </el-descriptions-item>
              <el-descriptions-item label="复杂度">
                <el-tag :type="complexityTagType(reqResult.complexity)" size="small">
                  {{ reqResult.complexity }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="风险等级">
                <el-tag :type="riskTagType(reqResult.riskLevel)" size="small">
                  {{ reqResult.riskLevel }}
                </el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="预估工时（人天）">
                {{ reqResult.estimatedEffort }}
              </el-descriptions-item>
              <el-descriptions-item label="涉及模块">
                <span v-if="reqResult.involvedModules && reqResult.involvedModules.length">
                  <el-tag v-for="mod in reqResult.involvedModules" :key="mod" size="small" style="margin-right: 6px; margin-bottom: 4px;">{{ mod }}</el-tag>
                </span>
                <span v-else style="color: #909399;">无</span>
              </el-descriptions-item>
            </el-descriptions>

            <el-divider />

            <h4 style="margin-bottom: 12px;">修改点</h4>
            <ol v-if="reqResult.modificationPoints && reqResult.modificationPoints.length" style="padding-left: 20px; line-height: 2;">
              <li v-for="(point, idx) in reqResult.modificationPoints" :key="idx">{{ point }}</li>
            </ol>
            <p v-else style="color: #909399;">无</p>

            <el-divider />

            <h4 style="margin-bottom: 12px;">技术建议</h4>
            <el-alert
              :title="reqResult.technicalSuggestion || '无'"
              type="info"
              :closable="false"
              show-icon
            />
          </el-card>
        </div>
        <div v-else-if="!reqAnalyzing" style="margin-top: 20px;">
          <el-card shadow="never" class="placeholder-card">
            <div class="placeholder-content">
              <el-icon class="placeholder-icon"><DataAnalysis /></el-icon>
              <p>输入需求文本并点击"分析"按钮，查看结构化分析结果</p>
            </div>
          </el-card>
        </div>
      </el-tab-pane>

      <!-- Tab 2: 代码分析结构化 -->
      <el-tab-pane label="代码分析结构化" name="code">
        <el-card>
          <template #header>
            <div class="card-header">
              <span><el-icon style="vertical-align: middle; margin-right: 6px;"><Document /></el-icon>代码分析</span>
            </div>
          </template>
          <el-form :model="codeForm" label-width="100px" :rules="codeRules" ref="codeFormRef">
            <el-form-item label="代码" prop="code">
              <el-input v-model="codeForm.code" type="textarea" :rows="8" placeholder="请输入需要分析的代码&#10;例如：&#10;public class HelloWorld {&#10;    public static void main(String[] args) {&#10;        System.out.println(&quot;Hello, World!&quot;);&#10;    }&#10;}" />
            </el-form-item>
            <el-form-item label="文件名">
              <el-input v-model="codeForm.fileName" placeholder="文件名（可选，默认 unknown.java）" />
            </el-form-item>
            <el-form-item label="上下文">
              <el-input v-model="codeForm.context" type="textarea" :rows="2" placeholder="可选，提供代码上下文信息" />
            </el-form-item>
            <el-form-item>
              <div style="display: flex; gap: 12px;">
                <el-button type="primary" @click="handleAnalyzeCode" :loading="codeAnalyzing" :icon="DataAnalysis">分析</el-button>
                <el-button size="small" @click="showSchemaDialog('code')" :icon="CopyDocument">查看 Schema</el-button>
              </div>
            </el-form-item>
          </el-form>
        </el-card>

        <!-- Code Analysis Result -->
        <div v-if="codeResult" style="margin-top: 20px;">
          <el-card shadow="never" class="result-card">
            <template #header>
              <div class="card-header">
                <span><el-icon style="vertical-align: middle; margin-right: 6px;"><Document /></el-icon>分析结果</span>
              </div>
            </template>

            <el-descriptions :column="1" border>
              <el-descriptions-item label="概述">
                {{ codeResult.overview }}
              </el-descriptions-item>
              <el-descriptions-item label="质量评分">
                <div style="display: flex; align-items: center; gap: 12px;">
                  <el-progress
                    :percentage="codeResult.qualityScore"
                    :color="qualityScoreColor"
                    :stroke-width="18"
                    :text-inside="true"
                    style="width: 200px;"
                  />
                  <span :style="{ fontWeight: 'bold', color: qualityScoreColor(codeResult.qualityScore) }">
                    {{ codeResult.qualityScore }}分
                  </span>
                </div>
              </el-descriptions-item>
            </el-descriptions>

            <el-divider />

            <h4 style="margin-bottom: 12px;">代码问题</h4>
            <el-table
              v-if="codeResult.issues && codeResult.issues.length"
              :data="codeResult.issues"
              border
              stripe
              size="small"
              style="width: 100%;"
            >
              <el-table-column label="类型" width="120">
                <template #default="{ row }">
                  <el-tag size="small">{{ row.type }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column label="严重程度" width="110">
                <template #default="{ row }">
                  <el-tag
                    size="small"
                    :type="severityTagType(row.severity)"
                  >
                    {{ row.severity }}
                  </el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="description" label="描述" />
              <el-table-column label="行号" width="80" align="center">
                <template #default="{ row }">
                  <el-tag size="small" type="info">{{ row.lineNumber }}</el-tag>
                </template>
              </el-table-column>
              <el-table-column prop="suggestion" label="建议" />
            </el-table>
            <p v-else style="color: #909399;">无问题</p>

            <el-divider />

            <h4 style="margin-bottom: 12px;">改进建议</h4>
            <ul v-if="codeResult.improvements && codeResult.improvements.length" style="padding-left: 20px; line-height: 2;">
              <li v-for="(imp, idx) in codeResult.improvements" :key="idx">{{ imp }}</li>
            </ul>
            <p v-else style="color: #909399;">无</p>

            <el-divider />

            <h4 style="margin-bottom: 12px;">依赖项</h4>
            <span v-if="codeResult.dependencies && codeResult.dependencies.length">
              <el-tag
                v-for="dep in codeResult.dependencies"
                :key="dep"
                size="small"
                type="warning"
                style="margin-right: 6px; margin-bottom: 4px;"
              >
                {{ dep }}
              </el-tag>
            </span>
            <p v-else style="color: #909399;">无</p>
          </el-card>
        </div>
        <div v-else-if="!codeAnalyzing" style="margin-top: 20px;">
          <el-card shadow="never" class="placeholder-card">
            <div class="placeholder-content">
              <el-icon class="placeholder-icon"><Document /></el-icon>
              <p>输入代码并点击"分析"按钮，查看结构化分析结果</p>
            </div>
          </el-card>
        </div>
      </el-tab-pane>
    </el-tabs>

    <!-- Schema Dialog -->
    <el-dialog v-model="schemaDialogVisible" :title="schemaDialogTitle" width="700px">
      <pre class="schema-pre">{{ schemaContent }}</pre>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElMessage } from 'element-plus'
import { DataAnalysis, Document, CopyDocument } from '@element-plus/icons-vue'
import type { FormInstance, FormRules } from 'element-plus'
import {
  analyzeRequirement,
  analyzeCode,
  getSchemas,
  type RequirementAnalysisResult,
  type CodeAnalysisResult
} from '@/api/structured'

const activeTab = ref('requirement')

// ========== Tab 1: 需求分析 ==========
const reqFormRef = ref<FormInstance>()
const reqForm = reactive({
  requirement: '',
  context: ''
})
const reqRules: FormRules = {
  requirement: [{ required: true, message: '请输入需求文本', trigger: 'blur' }]
}
const reqAnalyzing = ref(false)
const reqResult = ref<RequirementAnalysisResult | null>(null)

async function handleAnalyzeRequirement() {
  const valid = await reqFormRef.value?.validate().catch(() => false)
  if (!valid) return
  reqAnalyzing.value = true
  reqResult.value = null
  try {
    const res = await analyzeRequirement(reqForm.requirement, reqForm.context || undefined)
    reqResult.value = res.data
    ElMessage.success('需求分析完成')
  } catch (e: any) {
    ElMessage.error('分析失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    reqAnalyzing.value = false
  }
}

// ========== Tab 2: 代码分析 ==========
const codeFormRef = ref<FormInstance>()
const codeForm = reactive({
  code: '',
  fileName: 'unknown.java',
  context: ''
})
const codeRules: FormRules = {
  code: [{ required: true, message: '请输入代码', trigger: 'blur' }]
}
const codeAnalyzing = ref(false)
const codeResult = ref<CodeAnalysisResult | null>(null)

async function handleAnalyzeCode() {
  const valid = await codeFormRef.value?.validate().catch(() => false)
  if (!valid) return
  codeAnalyzing.value = true
  codeResult.value = null
  try {
    const res = await analyzeCode(codeForm.code, codeForm.fileName || undefined, codeForm.context || undefined)
    codeResult.value = res.data
    ElMessage.success('代码分析完成')
  } catch (e: any) {
    ElMessage.error('分析失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    codeAnalyzing.value = false
  }
}

// ========== Schema Dialog ==========
const schemaDialogVisible = ref(false)
const schemaDialogTitle = ref('')
const schemaContent = ref('')

async function showSchemaDialog(type: string) {
  schemaDialogTitle.value = type === 'requirement' ? '需求分析 Schema' : '代码分析 Schema'
  schemaContent.value = '加载中...'
  schemaDialogVisible.value = true
  try {
    const res = await getSchemas()
    const schemas = res.data || {}
    const key = type === 'requirement' ? 'requirementAnalysis' : 'codeAnalysis'
    schemaContent.value = JSON.stringify(schemas[key] || schemas, null, 2)
  } catch {
    schemaContent.value = '无法加载 Schema'
  }
}

// ========== Helpers ==========
function complexityTagType(v: string): string {
  if (v === '简单' || v === '低') return 'success'
  if (v === '中等' || v === '中') return 'warning'
  if (v === '复杂' || v === '高') return 'danger'
  return 'info'
}

function riskTagType(v: string): string {
  if (v === '低') return 'success'
  if (v === '中') return 'warning'
  if (v === '高') return 'danger'
  return 'info'
}

function severityTagType(v: string): string {
  if (v === 'critical' || v === '严重') return 'danger'
  if (v === 'major' || v === '主要') return 'warning'
  if (v === 'minor' || v === '次要') return 'primary'
  return 'info'
}

function qualityScoreColor(score: number): string {
  if (score >= 80) return '#67c23a'
  if (score >= 60) return '#e6a23c'
  return '#f56c6c'
}
</script>

<style scoped>
.structured-view {
  padding: 0;
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.result-card {
  border: 1px solid #e4e7ed;
  background-color: #fafafa;
}

.placeholder-card {
  border: 1px dashed #dcdfe6;
  background-color: #fafafa;
}

.placeholder-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 48px 0;
  color: #c0c4cc;
}

.placeholder-icon {
  font-size: 48px;
  margin-bottom: 16px;
}

.placeholder-content p {
  font-size: 14px;
  color: #909399;
}

.schema-pre {
  background-color: #f5f7fa;
  border: 1px solid #e4e7ed;
  border-radius: 4px;
  padding: 16px;
  font-size: 13px;
  line-height: 1.6;
  overflow-x: auto;
  max-height: 500px;
  white-space: pre-wrap;
  word-break: break-all;
  font-family: 'Courier New', Courier, monospace;
}

h4 {
  font-size: 14px;
  color: #303133;
}

.el-divider {
  margin: 20px 0;
}
</style>