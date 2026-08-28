<template>
  <div class="productline-view">
    <!-- Three-column layout when a product line is selected -->
    <template v-if="selectedLine">
      <!-- Left Panel: Product Line List -->
      <div class="panel panel-left">
        <div class="panel-header">
          <div class="header-btns">
            <el-button size="small" type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
            <el-button size="small" @click="handleSeed">预置数据</el-button>
          </div>
        </div>
        <div class="pl-list" v-loading="loading">
          <div
            v-for="pl in productLines"
            :key="pl.id"
            :class="['pl-card', { active: selectedLine?.id === pl.id }]"
            @click="selectProductLine(pl)"
          >
            <div class="pl-card__header">
              <span class="pl-card__name">{{ pl.displayName }}</span>
            </div>
            <div class="pl-card__desc">{{ pl.description || '暂无描述' }}</div>
            <div class="pl-card__meta">
              <el-tag v-if="pl.docsPath" size="small" type="success">文档目录</el-tag>
              <el-tag v-else size="small" type="info">仅 CLAUDE.md</el-tag>
            </div>
          </div>
          <el-empty v-if="!loading && productLines.length === 0" description="暂无产品线" :image-size="60" />
        </div>
        <div class="panel-footer">
          <el-button size="small" text @click="clearSelection">返回列表视图</el-button>
        </div>
      </div>

      <!-- Middle Panel: File Tree -->
      <div class="panel panel-middle">
        <template v-if="selectedLine">
          <div class="tree-header">
            <div class="tree-header__info">
              <span class="tree-header__name">{{ selectedLine.displayName }}</span>
              <el-button size="small" text @click="handleEdit(selectedLine)">编辑信息</el-button>
            </div>
            <div v-if="selectedLine.docsPath" class="tree-header__path">
              <el-icon><Folder /></el-icon>
              <el-tooltip :content="selectedLine.docsPath" placement="right">
                <span class="tree-header__path-text">{{ selectedLine.docsPath }}</span>
              </el-tooltip>
            </div>
          </div>
          <div class="tree-actions" v-if="selectedLine.docsPath">
            <el-button size="small" text type="primary" :icon="Refresh" @click="loadFileTree">刷新</el-button>
          </div>
          <div class="file-tree" v-loading="loadingTree">
            <template v-if="selectedLine.docsPath">
              <el-tree
                v-if="fileTree.length > 0"
                :data="fileTree"
                :props="treeProps"
                node-key="path"
                highlight-current
                :expand-on-click-node="true"
                @node-click="onNodeClick"
              >
                <template #default="{ data }">
                  <span :class="['tree-node', { 'tree-node--dir': data.type === 'directory' }]">
                    <el-icon v-if="data.type === 'directory'" :size="14"><Folder /></el-icon>
                    <el-icon v-else :size="14"><Document /></el-icon>
                    <span class="tree-node__label">{{ data.name }}</span>
                  </span>
                </template>
              </el-tree>
              <el-empty v-else-if="!loadingTree" description="目录为空或不存在" :image-size="40" />
            </template>
            <el-empty v-else description="未配置文档目录路径" :image-size="40">
              <el-button size="small" @click="handleEdit(selectedLine)">配置 docsPath</el-button>
            </el-empty>
          </div>
        </template>
      </div>

      <!-- Right Panel: File Editor -->
      <div class="panel panel-right">
        <div class="editor" v-if="selectedFilePath && !fileContentLoading">
          <div class="editor__header">
            <span class="editor__path">
              <el-icon><Document /></el-icon>
              {{ selectedFilePath }}
            </span>
            <div class="editor__actions">
              <el-button size="small" type="primary" :loading="saving" @click="saveFile">保存</el-button>
            </div>
          </div>
          <div class="editor__body">
            <textarea
              v-model="fileContent"
              class="editor__textarea"
              spellcheck="false"
              :placeholder="`编辑 ${selectedFilePath}...`"
            />
          </div>
        </div>
        <div v-else-if="fileContentLoading" class="editor-placeholder">
          <div v-loading="true" class="editor-loading" />
        </div>
        <div v-else-if="selectedLine" class="editor-placeholder">
          <el-empty description="请从文件树选择一个文件" :image-size="80" />
        </div>
        <div v-else class="editor-placeholder">
          <el-empty description="选择产品线和文件后开始编辑" :image-size="100" />
        </div>
      </div>
    </template>

    <!-- Table view when no product line is selected -->
    <template v-else>
      <div class="page-header">
        <h2>产品线管理</h2>
        <div class="toolbar">
          <el-input
            v-model="searchText"
            placeholder="搜索产品线名称"
            clearable
            style="width: 220px"
            @change="loadData"
            @keyup.enter="loadData"
          />
          <el-button :icon="Refresh" @click="loadData">刷新</el-button>
          <el-button @click="handleSeed">预置数据</el-button>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
        </div>
      </div>

      <el-table :data="productLines" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="displayName" label="产品线名称" min-width="150" />
        <el-table-column prop="name" label="英文名" min-width="150" />
        <el-table-column prop="description" label="描述" min-width="200">
          <template #default="{ row }">
            {{ row.description || '-' }}
          </template>
        </el-table-column>
        <el-table-column prop="docsPath" label="文档目录" min-width="180">
          <template #default="{ row }">
            <el-tag v-if="row.docsPath" size="small" type="success">已配置</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="createdAt" label="创建时间" width="180">
          <template #default="{ row }">
            {{ row.createdAt ? row.createdAt.replace('T', ' ').substring(0, 19) : '-' }}
          </template>
        </el-table-column>
        <el-table-column label="操作" width="220" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="handleViewDocs(row)">文档</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- Edit Dialog -->
    <el-dialog
      v-model="dialogVisible"
      :title="isEdit ? '编辑产品线' : '新增产品线'"
      width="600px"
      @close="resetForm"
    >
      <el-form :model="form" label-width="120px">
        <el-form-item label="英文名" required>
          <el-input v-model="form.name" placeholder="如 outpatient" />
        </el-form-item>
        <el-form-item label="产品线名称" required>
          <el-input v-model="form.displayName" placeholder="如 门诊病历" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="form.description" type="textarea" :rows="3" placeholder="产品线描述" />
        </el-form-item>
        <el-form-item label="文档目录路径">
          <el-input v-model="form.docsPath" placeholder="如 D:/workspace/claudecode/codes/emr-opt/sr-before" />
          <div class="form-tip">包含 claude.md 和 docs/ 子目录的根路径</div>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="dialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSave" :loading="savingLine">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, Folder, Document } from '@element-plus/icons-vue'
import {
  listProductLines,
  createProductLine,
  updateProductLine,
  deleteProductLine,
  seedProductLines,
  getProductLineFiles,
  readProductLineFile,
  writeProductLineFile,
  type ProductLine,
  type ProductLineFile
} from '@/api/productLine'

const loading = ref(false)
const productLines = ref<ProductLine[]>([])
const searchText = ref('')

// Selection state for three-column view
const selectedLine = ref<ProductLine | null>(null)
const loadingTree = ref(false)
const fileTree = ref<ProductLineFile[]>([])
const treeProps = {
  children: 'children',
  label: 'name',
  isLeaf: (node: ProductLineFile) => node.type === 'file'
}

// File editor state
const selectedFilePath = ref('')
const fileContent = ref('')
const fileContentLoading = ref(false)
const saving = ref(false)

// Dialog state
const dialogVisible = ref(false)
const isEdit = ref(false)
const editingId = ref<number | null>(null)
const savingLine = ref(false)

function defaultForm() {
  return { name: '', displayName: '', description: '', docsPath: '' }
}
const form = reactive(defaultForm())

async function loadData() {
  loading.value = true
  try {
    productLines.value = await listProductLines(searchText.value || undefined)
  } catch (e: any) {
    ElMessage.error('加载产品线列表失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    loading.value = false
  }
}

function handleAdd() {
  isEdit.value = false
  editingId.value = null
  Object.assign(form, defaultForm())
  dialogVisible.value = true
}

function handleEdit(row: ProductLine) {
  isEdit.value = true
  editingId.value = row.id
  Object.assign(form, {
    name: row.name,
    displayName: row.displayName,
    description: row.description || '',
    docsPath: row.docsPath || ''
  })
  dialogVisible.value = true
}

function resetForm() {
  Object.assign(form, defaultForm())
}

async function handleSave() {
  if (!form.name || !form.displayName) {
    ElMessage.warning('英文名和产品线名称为必填项')
    return
  }
  savingLine.value = true
  try {
    const payload: Partial<ProductLine> = {
      name: form.name,
      displayName: form.displayName,
      description: form.description,
      docsPath: form.docsPath || undefined
    }
    if (isEdit.value && editingId.value) {
      await updateProductLine(editingId.value, payload)
      ElMessage.success('更新成功')
      // If we're in three-column view and editing the selected line, refresh it
      if (selectedLine.value && selectedLine.value.id === editingId.value) {
        selectedLine.value = { ...selectedLine.value, ...payload }
        await loadFileTree()
      }
    } else {
      await createProductLine(payload)
      ElMessage.success('创建成功')
    }
    dialogVisible.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    savingLine.value = false
  }
}

async function handleDelete(row: ProductLine) {
  try {
    await ElMessageBox.confirm(`确定删除产品线 "${row.displayName}"？`, '确认删除', { type: 'warning' })
    await deleteProductLine(row.id)
    ElMessage.success('已删除')
    if (selectedLine.value?.id === row.id) {
      selectedLine.value = null
    }
    await loadData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败: ' + (e?.response?.data?.error || e.message))
    }
  }
}

async function handleSeed() {
  try {
    const result = await seedProductLines() as any
    ElMessage.success(`预置数据初始化完成: 新增 ${result.created}, 跳过 ${result.skipped}`)
    await loadData()
  } catch (e: any) {
    ElMessage.error('操作失败: ' + (e?.response?.data?.error || e.message))
  }
}

// Select a product line and show three-column view
async function selectProductLine(pl: ProductLine) {
  selectedLine.value = pl
  selectedFilePath.value = ''
  fileContent.value = ''
  fileTree.value = []
  await loadFileTree()
}

// View docs for a product line (from table view)
async function handleViewDocs(row: ProductLine) {
  await selectProductLine(row)
}

// Clear selection and return to table view
function clearSelection() {
  selectedLine.value = null
  selectedFilePath.value = ''
  fileContent.value = ''
  fileTree.value = []
}

// Load file tree for the selected product line
async function loadFileTree() {
  if (!selectedLine.value) return
  loadingTree.value = true
  try {
    fileTree.value = await getProductLineFiles(selectedLine.value.id)
  } catch (e: any) {
    console.error('加载文件树失败:', e)
    fileTree.value = []
  } finally {
    loadingTree.value = false
  }
}

// Handle file tree node click
async function onNodeClick(data: ProductLineFile) {
  if (data.type === 'file') {
    await loadFileContent(data.path)
  }
}

// Load file content
async function loadFileContent(path: string) {
  if (!selectedLine.value) return
  selectedFilePath.value = path
  fileContentLoading.value = true
  try {
    fileContent.value = await readProductLineFile(selectedLine.value.id, path)
  } catch (e: any) {
    ElMessage.error('加载文件内容失败: ' + (e?.response?.data?.error || e.message))
    fileContent.value = ''
  } finally {
    fileContentLoading.value = false
  }
}

// Save file content
async function saveFile() {
  if (!selectedLine.value || !selectedFilePath.value) return
  saving.value = true
  try {
    await writeProductLineFile(selectedLine.value.id, selectedFilePath.value, fileContent.value)
    ElMessage.success('保存成功')
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    saving.value = false
  }
}

// Keyboard shortcut: Ctrl+S to save
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (selectedFilePath.value && !saving.value) {
      saveFile()
    }
  }
}

onMounted(() => {
  loadData()
  document.addEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.productline-view {
  height: calc(100vh - 110px);
  min-height: 500px;
}

/* Table view header */
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

.toolbar {
  display: flex;
  gap: 8px;
  align-items: center;
}

.text-muted {
  color: #c0c4cc;
}

/* Three-column layout */
.productline-view:has(.panel) {
  display: flex;
  gap: 1px;
  background: #e4e7ed;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  overflow: hidden;
}

.panel {
  background: #fff;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-left {
  width: 240px;
  min-width: 200px;
  flex-shrink: 0;
}

.panel-middle {
  width: 240px;
  min-width: 180px;
  flex-shrink: 0;
}

.panel-right {
  flex: 1;
  min-width: 300px;
}

/* Left panel: product line list */
.panel-header {
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.header-btns {
  display: flex;
  gap: 8px;
}

.panel-footer {
  padding: 8px 12px;
  border-top: 1px solid #ebeef5;
  flex-shrink: 0;
}

.pl-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.pl-card {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  margin-bottom: 4px;
  transition: background 0.15s, border-color 0.15s;
}

.pl-card:hover {
  background: #f5f7fa;
}

.pl-card.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.pl-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.pl-card__name {
  font-weight: 600;
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.pl-card__desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.pl-card__meta {
  margin-top: 6px;
}

/* Middle panel: file tree */
.tree-header {
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.tree-header__info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.tree-header__name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
}

.tree-header__path {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 11px;
  color: #909399;
  margin-top: 4px;
}

.tree-header__path-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 180px;
}

.tree-actions {
  padding: 4px 8px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
}

.file-tree {
  flex: 1;
  overflow-y: auto;
  padding: 4px 0;
}

.tree-node {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 13px;
  overflow: hidden;
}

.tree-node--dir {
  font-weight: 500;
}

.tree-node__label {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Right panel: editor */
.editor {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 16px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
  background: #fafafa;
}

.editor__path {
  font-size: 13px;
  color: #606266;
  font-family: 'Consolas', 'Monaco', monospace;
  display: flex;
  align-items: center;
  gap: 6px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.editor__actions {
  display: flex;
  gap: 8px;
  flex-shrink: 0;
}

.editor__body {
  flex: 1;
  overflow: hidden;
  position: relative;
}

.editor__textarea {
  width: 100%;
  height: 100%;
  border: none;
  outline: none;
  resize: none;
  padding: 16px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-size: 13px;
  line-height: 1.7;
  color: #303133;
  background: #fff;
  tab-size: 2;
}

.editor__textarea::placeholder {
  color: #c0c4cc;
}

.editor-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-loading {
  width: 40px;
  height: 40px;
}

/* Form tip */
.form-tip {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
}

/* Scrollbar */
.pl-list::-webkit-scrollbar,
.file-tree::-webkit-scrollbar {
  width: 5px;
}

.pl-list::-webkit-scrollbar-thumb,
.file-tree::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.pl-list::-webkit-scrollbar-thumb:hover,
.file-tree::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}
</style>
