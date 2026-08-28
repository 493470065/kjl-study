<template>
  <div class="repository-view">
    <!-- Three-column layout when docs mode is active -->
    <template v-if="docsModeRepo">
      <!-- Left Panel: Repository List -->
      <div class="panel panel-left">
        <div class="panel-header">
          <div class="header-btns">
            <el-button size="small" type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
            <el-button size="small" :icon="Refresh" @click="loadData">刷新</el-button>
          </div>
        </div>
        <div class="repo-list" v-loading="loading">
          <div
            v-for="repo in displayRepositories"
            :key="repo.id"
            :class="['repo-card', { active: docsModeRepo?.id === repo.id }]"
            @click="selectRepoForDocs(repo)"
          >
            <div class="repo-card__header">
              <span class="repo-card__name">{{ repo.displayName }}</span>
            </div>
            <div class="repo-card__desc">{{ repo.name }}</div>
            <div class="repo-card__meta">
              <el-tag v-if="repo.docsPath" size="small" type="success">文档目录</el-tag>
              <el-tag v-else size="small" type="info">仅 CLAUDE.md</el-tag>
            </div>
          </div>
          <el-empty v-if="!loading && displayRepositories.length === 0" description="暂无仓库" :image-size="60" />
        </div>
        <div class="panel-footer">
          <el-button size="small" text @click="clearDocsMode">返回列表视图</el-button>
        </div>
      </div>

      <!-- Middle Panel: File Tree -->
      <div class="panel panel-middle">
        <template v-if="docsModeRepo">
          <div class="tree-header">
            <div class="tree-header__info">
              <span class="tree-header__name">{{ docsModeRepo.displayName }}</span>
              <el-button size="small" text @click="handleEdit(docsModeRepo)">编辑信息</el-button>
            </div>
            <div v-if="docsModeRepo.docsPath" class="tree-header__path">
              <el-icon><Folder /></el-icon>
              <el-tooltip :content="docsModeRepo.docsPath" placement="right">
                <span class="tree-header__path-text">{{ docsModeRepo.docsPath }}</span>
              </el-tooltip>
            </div>
          </div>
          <div class="tree-actions" v-if="docsModeRepo.docsPath">
            <el-button size="small" text type="primary" :icon="Refresh" @click="loadFileTree">刷新</el-button>
          </div>
          <div class="file-tree" v-loading="loadingTree">
            <template v-if="docsModeRepo.docsPath">
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
              <el-button size="small" @click="handleEdit(docsModeRepo)">配置 docsPath</el-button>
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
              <el-button size="small" type="primary" :loading="savingFile" @click="saveFile">保存</el-button>
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
        <div v-else-if="docsModeRepo" class="editor-placeholder">
          <el-empty description="请从文件树选择一个文件" :image-size="80" />
        </div>
        <div v-else class="editor-placeholder">
          <el-empty description="选择仓库和文件后开始编辑" :image-size="100" />
        </div>
      </div>
    </template>

    <!-- Normal table view when docs mode is not active -->
    <template v-else>
      <div class="page-header">
        <h2>仓库管理</h2>
        <div class="toolbar">
          <el-input
            v-model="searchText"
            placeholder="搜索仓库名/英文名"
            clearable
            style="width: 220px"
            @change="loadData"
            @keyup.enter="loadData"
          />
          <el-select v-model="filterTag" placeholder="业务标记筛选" clearable style="width: 160px" @change="loadData">
            <el-option v-for="tag in allTags" :key="tag" :label="tag" :value="tag" />
          </el-select>
          <el-select v-model="filterProductLineIds" placeholder="产品线筛选（可多选）" clearable multiple collapse-tags collapse-tags-tooltip style="width: 260px" @change="loadData">
            <el-option v-for="pl in productLines" :key="pl.id" :label="pl.displayName" :value="pl.id" />
          </el-select>
          <el-button :icon="Refresh" @click="loadData">刷新</el-button>
          <el-button type="primary" :icon="Plus" @click="handleAdd">新增</el-button>
          <el-dropdown @command="handleSyncCommand">
            <el-button>
              同步操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="seed">预置数据</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>

      <!-- 主表格 -->
      <el-table :data="displayRepositories" stripe style="width: 100%" v-loading="loading">
        <el-table-column prop="displayName" label="中文名" min-width="130" />
        <el-table-column prop="name" label="英文名" min-width="150" />
        <el-table-column prop="tfsPath" label="TFS 路径" min-width="220">
          <template #default="{ row }">
            <el-tooltip :content="row.tfsPath" placement="top" :show-after="300">
              <span class="truncate-text">{{ row.tfsPath }}</span>
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column prop="branch" label="分支" width="100" />
        <el-table-column label="业务标记" min-width="200">
          <template #default="{ row }">
            <template v-if="row.businessTags">
              <el-tag
                v-for="tag in row.businessTags.split(',')"
                :key="tag"
                size="small"
                style="margin: 2px 4px 2px 0"
              >{{ tag }}</el-tag>
            </template>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column prop="productLineNames" label="产品线" min-width="200">
          <template #default="{ row }">
            <div class="product-line-checkboxes">
              <el-checkbox
                v-for="pl in productLines"
                :key="pl.id"
                :model-value="isProductLineSelected(row, pl.id)"
                @change="(val: boolean) => handleProductLineChange(row, pl.id, val)"
              >{{ pl.displayName }}</el-checkbox>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="projectName" label="TFS 项目名" width="120" />
        <el-table-column label="文档" width="80" align="center">
          <template #default="{ row }">
            <el-tag v-if="row.docsPath" size="small" type="success">已配置</el-tag>
            <span v-else class="text-muted">-</span>
          </template>
        </el-table-column>
        <el-table-column label="纳入图谱扫描" width="130" align="center">
          <template #default="{ row }">
            <el-tooltip
              :content="row.branch === 'sr-next' ? '开关后定时扫描该仓库提交并更新知识图谱' : '仅 sr-next 分支支持图谱扫描'"
              placement="top"
              :show-after="300"
            >
              <el-switch
                :model-value="!!row.scanEnabled"
                :disabled="row.branch !== 'sr-next'"
                @change="(val: boolean | string | number) => handleScanEnabledChange(row, !!val)"
              />
            </el-tooltip>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="300" fixed="right">
          <template #default="{ row }">
            <el-button link type="primary" size="small" @click="handleEdit(row)">编辑</el-button>
            <el-button link type="warning" size="small" @click="handleDocs(row)">文档</el-button>
            <el-button link type="info" size="small" @click="handleEditClaudeMd(row)">CLAUDE.md</el-button>
            <el-button link type="primary" size="small" @click="handleModules(row)">子模块</el-button>
            <el-button link type="danger" size="small" @click="handleDelete(row)">删除</el-button>
          </template>
        </el-table-column>
      </el-table>
    </template>

    <!-- 仓库编辑弹窗 -->
    <el-dialog
      v-model="repoDialogVisible"
      :title="isEdit ? '编辑仓库' : '新增仓库'"
      width="600px"
      @close="resetRepoForm"
    >
      <el-form :model="repoForm" label-width="120px">
        <el-form-item label="仓库中文名" required>
          <el-input v-model="repoForm.displayName" placeholder="请输入仓库中文名" />
        </el-form-item>
        <el-form-item label="仓库英文名" required>
          <el-input v-model="repoForm.name" placeholder="请输入仓库英文名" />
        </el-form-item>
        <el-form-item label="TFS 路径" required>
          <el-input v-model="repoForm.tfsPath" placeholder="请输入 TFS 路径" />
        </el-form-item>
        <el-form-item label="分支版本">
          <el-input v-model="repoForm.branch" placeholder="sr-next" />
        </el-form-item>
        <el-form-item label="纳入图谱扫描">
          <el-switch v-model="repoForm.scanEnabled" />
          <div class="form-tip">开启后定时扫描该仓库提交并更新知识图谱（仅 sr-next 分支支持）</div>
        </el-form-item>
        <el-form-item label="TFS 项目名">
          <el-input v-model="repoForm.projectName" placeholder="W.in-MVP" />
        </el-form-item>
        <el-form-item label="仓库标识 UUID">
          <el-input v-model="repoForm.repoId" placeholder="可选，自动生成" />
        </el-form-item>
        <el-form-item label="产品线">
          <el-select v-model="repoFormProductLineIds" placeholder="请选择产品线（可多选）" clearable multiple collapse-tags collapse-tags-tooltip style="width: 100%">
            <el-option v-for="pl in productLines" :key="pl.id" :label="pl.displayName" :value="pl.id" />
          </el-select>
        </el-form-item>
        <el-form-item label="文档目录路径">
          <el-input v-model="repoForm.docsPath" placeholder="如 D:/workspace/project/docs-root" />
          <div class="form-tip">包含 claude.md 和 docs/ 子目录的根路径</div>
        </el-form-item>
        <el-form-item label="业务标记">
          <el-checkbox-group v-model="selectedTags">
            <el-checkbox v-for="opt in tagOptions" :key="opt" :label="opt" :value="opt">{{ opt }}</el-checkbox>
          </el-checkbox-group>
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="repoForm.description" type="textarea" :rows="3" placeholder="仓库描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="repoDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveRepo" :loading="saving">保存</el-button>
      </template>
    </el-dialog>

    <!-- 子模块管理弹窗 -->
    <el-dialog v-model="moduleDialogVisible" title="子模块管理" width="820px" @close="moduleDialogVisible = false">
      <div style="margin-bottom: 12px">
        <span style="color: #606266">当前仓库：</span>
        <strong>{{ currentRepoName }}</strong>
      </div>

      <el-table :data="modules" stripe style="width: 100%" v-loading="modulesLoading" max-height="360">
        <el-table-column prop="moduleName" label="模块名" min-width="180" />
        <el-table-column prop="moduleType" label="类型" width="130" />
        <el-table-column prop="iteration" label="迭代" width="100" />
        <el-table-column prop="parentModule" label="母模块" width="160">
          <template #default="{ row }">
            {{ row.parentModule || '-' }}
          </template>
        </el-table-column>
        <el-table-column label="启用" width="80" align="center">
          <template #default="{ row }">
            <el-switch
              v-model="row.enabled"
              @change="handleToggleModule(row)"
            />
          </template>
        </el-table-column>
        <el-table-column label="操作" width="80" align="center">
          <template #default="{ $index }">
            <el-button link type="danger" size="small" @click="handleRemoveModule($index)">移除</el-button>
          </template>
        </el-table-column>
      </el-table>

      <!-- 添加模块表单 -->
      <div class="add-module-form">
        <div class="add-module-fields">
          <el-input v-model="newModule.moduleName" placeholder="模块名" style="width: 180px" />
          <el-select v-model="newModule.moduleType" placeholder="类型" style="width: 130px">
            <el-option label="WINNING_MS" value="WINNING_MS" />
            <el-option label="WINNING_MD" value="WINNING_MD" />
            <el-option label="FRONTEND" value="FRONTEND" />
          </el-select>
          <el-input v-model="newModule.iteration" placeholder="迭代" style="width: 100px" />
          <el-input v-model="newModule.parentModule" placeholder="母模块" style="width: 150px" />
          <el-button type="primary" :icon="Plus" @click="handleAddModule">添加</el-button>
        </div>
      </div>

      <template #footer>
        <el-button @click="moduleDialogVisible = false">关闭</el-button>
        <el-button type="primary" @click="handleSaveModules" :loading="modulesSaving">保存</el-button>
      </template>
    </el-dialog>

    <!-- CLAUDE.md 编辑弹窗 (保留向后兼容) -->
    <el-dialog
      v-model="claudeMdDialogVisible"
      :title="`${currentRepo?.displayName} - CLAUDE.md`"
      width="800px"
    >
      <textarea
        v-model="claudeMdContent"
        class="claude-md-editor"
        placeholder="输入 CLAUDE.md 内容..."
      ></textarea>
      <template #footer>
        <el-button @click="claudeMdDialogVisible = false">取消</el-button>
        <el-button type="primary" @click="handleSaveClaudeMd" :loading="claudeMdSaving">保存</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import { Plus, Refresh, ArrowDown, Folder, Document } from '@element-plus/icons-vue'
import {
  listRepositories,
  getRepository,
  createRepository,
  updateRepository,
  deleteRepository,
  getAllTags,
  getModules,
  saveModules,
  toggleModule,
  seedRepositories,
  saveRepoClaudeMd,
  getRepoFiles,
  readRepoFile,
  writeRepoFile,
  type CodeRepository,
  type RepoModule,
  type RepoFile
} from '@/api/repository'
import { listProductLines, type ProductLine } from '@/api/productLine'

const loading = ref(false)
const saving = ref(false)
const repositories = ref<CodeRepository[]>([])
const allTags = ref<string[]>([])
const searchText = ref('')
const filterTag = ref('')
const filterProductLineIds = ref<number[]>([])
const productLines = ref<ProductLine[]>([])

// 显示列表（客户端按产品线 ID 过滤，支持多选）
const displayRepositories = computed(() => {
  if (!filterProductLineIds.value || filterProductLineIds.value.length === 0) return repositories.value
  return repositories.value.filter(r => {
    if (!r.productLineIds) return false
    const repoIds = r.productLineIds.split(',').filter(Boolean).map(Number)
    return repoIds.some(id => filterProductLineIds.value.includes(id))
  })
})

// 仓库编辑弹窗
const repoDialogVisible = ref(false)
const isEdit = ref(false)
const editingRepoId = ref<number | null>(null)

const tagOptions = ['住院病历', '门诊病历', '会诊', '质控', '模板', '基础', '接口集成']
const selectedTags = ref<string[]>([])

function defaultRepoForm(): CodeRepository {
  return {
    name: '',
    displayName: '',
    tfsPath: '',
    branch: 'sr-next',
    businessTags: '',
    projectName: 'W.in-MVP',
    repoId: '',
    productLine: '',
    productLineId: undefined,
    description: '',
    docsPath: '',
    scanEnabled: false
  }
}

const repoForm = reactive<CodeRepository>(defaultRepoForm())
const repoFormProductLineIds = ref<number[]>([])

// 子模块弹窗
const moduleDialogVisible = ref(false)
const modulesLoading = ref(false)
const modulesSaving = ref(false)
const currentRepoId = ref<number>(0)
const currentRepoName = ref('')
const modules = ref<RepoModule[]>([])
const newModule = reactive<RepoModule>({
  moduleName: '',
  moduleType: 'WINNING_MS',
  iteration: '',
  parentModule: '',
  enabled: true
})

// ========== 数据加载 ==========

async function loadTags() {
  try {
    allTags.value = await getAllTags()
  } catch {
    // ignore
  }
}

async function loadData() {
  loading.value = true
  try {
    repositories.value = await listRepositories(searchText.value || undefined, filterTag.value || undefined)
  } catch (e: any) {
    ElMessage.error('加载仓库列表失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    loading.value = false
  }
}

// ========== 仓库编辑 ==========

function handleAdd() {
  isEdit.value = false
  editingRepoId.value = null
  Object.assign(repoForm, defaultRepoForm())
  selectedTags.value = []
  repoFormProductLineIds.value = []
  repoDialogVisible.value = true
}

function handleEdit(row: CodeRepository) {
  isEdit.value = true
  editingRepoId.value = row.id!
  Object.assign(repoForm, { ...row })
  selectedTags.value = row.businessTags ? row.businessTags.split(',').filter(Boolean) : []
  repoFormProductLineIds.value = row.productLineIds
    ? row.productLineIds.split(',').filter(Boolean).map(Number)
    : []
  repoDialogVisible.value = true
}

function resetRepoForm() {
  Object.assign(repoForm, defaultRepoForm())
  selectedTags.value = []
  repoFormProductLineIds.value = []
}

async function handleSaveRepo() {
  if (!repoForm.displayName || !repoForm.name || !repoForm.tfsPath) {
    ElMessage.warning('中文名、英文名和 TFS 路径为必填项')
    return
  }
  saving.value = true
  try {
    const payload: CodeRepository = {
      ...repoForm,
      businessTags: selectedTags.value.join(','),
      productLineIds: repoFormProductLineIds.value.join(',')
    }
    if (isEdit.value && editingRepoId.value) {
      await updateRepository(editingRepoId.value, payload)
      ElMessage.success('更新成功')
    } else {
      await createRepository(payload)
      ElMessage.success('创建成功')
    }
    repoDialogVisible.value = false
    await loadData()
    await loadTags()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    saving.value = false
  }
}

async function handleDelete(row: CodeRepository) {
  try {
    await ElMessageBox.confirm(`确定删除仓库 "${row.displayName}（${row.name}）"？`, '确认删除', { type: 'warning' })
    await deleteRepository(row.id!)
    ElMessage.success('已删除')
    await loadData()
  } catch (e: any) {
    if (e !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// ========== 图谱扫描开关 ==========

async function handleScanEnabledChange(row: CodeRepository, checked: boolean) {
  const target = !checked
  row.scanEnabled = checked
  try {
    await updateRepository(row.id!, { ...row, scanEnabled: checked })
    ElMessage.success(checked ? '已开启图谱扫描' : '已关闭图谱扫描')
  } catch (e: any) {
    row.scanEnabled = target
    ElMessage.error('切换失败: ' + (e?.response?.data?.error || e.message))
  }
}

// ========== 产品线快速修改（多选） ==========

function isProductLineSelected(row: CodeRepository, productLineId: number): boolean {
  if (!row.productLineIds) return false
  return row.productLineIds.split(',').filter(Boolean).includes(String(productLineId))
}

async function handleProductLineChange(row: CodeRepository, productLineId: number, checked: boolean) {
  const currentIds = row.productLineIds ? row.productLineIds.split(',').filter(Boolean) : []
  const idStr = String(productLineId)

  if (checked) {
    if (!currentIds.includes(idStr)) {
      currentIds.push(idStr)
    }
  } else {
    const idx = currentIds.indexOf(idStr)
    if (idx > -1) {
      currentIds.splice(idx, 1)
    }
  }

  const newProductLineIds = currentIds.join(',')
  row.productLineIds = newProductLineIds

  try {
    await updateRepository(row.id!, { ...row, productLineIds: newProductLineIds })
    ElMessage.success('产品线已更新')
  } catch (e: any) {
    ElMessage.error('更新产品线失败: ' + (e?.response?.data?.error || e.message))
  }
  await loadData()
}

// ========== 子模块管理 ==========

async function handleModules(row: CodeRepository) {
  currentRepoId.value = row.id!
  currentRepoName.value = `${row.displayName}（${row.name}）`
  moduleDialogVisible.value = true
  await loadModules()
}

async function loadModules() {
  modulesLoading.value = true
  try {
    modules.value = await getModules(currentRepoId.value)
  } catch (e: any) {
    ElMessage.error('加载子模块失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    modulesLoading.value = false
  }
}

async function handleSaveModules() {
  modulesSaving.value = true
  try {
    await saveModules(currentRepoId.value, modules.value)
    ElMessage.success('保存成功')
    await loadModules()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    modulesSaving.value = false
  }
}

function handleAddModule() {
  if (!newModule.moduleName) {
    ElMessage.warning('请输入模块名')
    return
  }
  modules.value.push({
    moduleName: newModule.moduleName,
    moduleType: newModule.moduleType,
    iteration: newModule.iteration,
    parentModule: newModule.parentModule,
    enabled: newModule.enabled,
    repoId: currentRepoId.value
  })
  newModule.moduleName = ''
  newModule.iteration = ''
  newModule.parentModule = ''
  newModule.moduleType = 'WINNING_MS'
  newModule.enabled = true
}

function handleRemoveModule(index: number) {
  modules.value.splice(index, 1)
}

async function handleToggleModule(row: RepoModule) {
  if (!row.id) return
  try {
    await toggleModule(row.id)
  } catch (e: any) {
    row.enabled = !row.enabled
    ElMessage.error('切换失败: ' + (e?.response?.data?.error || e.message))
  }
}

// ========== 同步操作 ==========

async function handleSyncCommand(command: string) {
  try {
    if (command === 'seed') {
      const result = await seedRepositories() as any
      ElMessage.success(`预置数据初始化完成: 新增 ${result.repoCreated || result.created}, 更新 ${result.repoUpdated || result.updated}, 模块 ${result.moduleCreated || 0}`)
      await loadData()
      await loadTags()
    }
  } catch (e: any) {
    ElMessage.error('操作失败: ' + (e?.response?.data?.error || e.message))
  }
}

onMounted(() => {
  loadData()
  loadTags()
  loadProductLines()
})

async function loadProductLines() {
  try {
    productLines.value = await listProductLines()
  } catch {
    // ignore
  }
}

// ========== CLAUDE.md ==========

const claudeMdDialogVisible = ref(false)
const claudeMdContent = ref('')
const claudeMdSaving = ref(false)
const currentRepo = ref<CodeRepository | null>(null)

async function handleEditClaudeMd(row: CodeRepository) {
  currentRepo.value = row
  try {
    const detail = await getRepository(row.id!)
    claudeMdContent.value = detail.claudeMd || ''
    claudeMdDialogVisible.value = true
  } catch (e: any) {
    ElMessage.error('加载 CLAUDE.md 失败')
  }
}

async function handleSaveClaudeMd() {
  if (!currentRepo.value) return
  claudeMdSaving.value = true
  try {
    await saveRepoClaudeMd(currentRepo.value.id!, claudeMdContent.value)
    ElMessage.success('保存成功')
    claudeMdDialogVisible.value = false
    await loadData()
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    claudeMdSaving.value = false
  }
}

// ========== 文档目录模式（三栏布局） ==========

const docsModeRepo = ref<CodeRepository | null>(null)
const loadingTree = ref(false)
const fileTree = ref<RepoFile[]>([])
const treeProps = {
  children: 'children',
  label: 'name',
  isLeaf: (node: RepoFile) => node.type === 'file'
}

const selectedFilePath = ref('')
const fileContent = ref('')
const fileContentLoading = ref(false)
const savingFile = ref(false)

async function handleDocs(row: CodeRepository) {
  await selectRepoForDocs(row)
}

async function selectRepoForDocs(repo: CodeRepository) {
  docsModeRepo.value = repo
  selectedFilePath.value = ''
  fileContent.value = ''
  fileTree.value = []
  await loadFileTree()
}

function clearDocsMode() {
  docsModeRepo.value = null
  selectedFilePath.value = ''
  fileContent.value = ''
  fileTree.value = []
}

async function loadFileTree() {
  if (!docsModeRepo.value) return
  loadingTree.value = true
  try {
    fileTree.value = await getRepoFiles(docsModeRepo.value.id!)
  } catch (e: any) {
    console.error('加载文件树失败:', e)
    fileTree.value = []
  } finally {
    loadingTree.value = false
  }
}

async function onNodeClick(data: RepoFile) {
  if (data.type === 'file') {
    await loadFileContent(data.path)
  }
}

async function loadFileContent(path: string) {
  if (!docsModeRepo.value) return
  selectedFilePath.value = path
  fileContentLoading.value = true
  try {
    fileContent.value = await readRepoFile(docsModeRepo.value.id!, path)
  } catch (e: any) {
    ElMessage.error('加载文件内容失败: ' + (e?.response?.data?.error || e.message))
    fileContent.value = ''
  } finally {
    fileContentLoading.value = false
  }
}

async function saveFile() {
  if (!docsModeRepo.value || !selectedFilePath.value) return
  savingFile.value = true
  try {
    await writeRepoFile(docsModeRepo.value.id!, selectedFilePath.value, fileContent.value)
    ElMessage.success('保存成功')
  } catch (e: any) {
    ElMessage.error('保存失败: ' + (e?.response?.data?.error || e.message))
  } finally {
    savingFile.value = false
  }
}

// Ctrl+S shortcut
function handleKeydown(e: KeyboardEvent) {
  if ((e.ctrlKey || e.metaKey) && e.key === 's') {
    e.preventDefault()
    if (selectedFilePath.value && !savingFile.value && docsModeRepo.value) {
      saveFile()
    }
  }
}

onMounted(() => {
  document.addEventListener('keydown', handleKeydown)
})
</script>

<style scoped>
.repository-view {
  padding: 20px;
  height: calc(100vh - 110px);
  min-height: 500px;
}

/* Three-column layout when docs mode is active */
.repository-view:has(.panel) {
  padding: 0;
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

.repo-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.repo-card {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  margin-bottom: 4px;
  transition: background 0.15s, border-color 0.15s;
}

.repo-card:hover {
  background: #f5f7fa;
}

.repo-card.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.repo-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.repo-card__name {
  font-weight: 600;
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.repo-card__desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.repo-card__meta {
  margin-top: 6px;
}

/* File tree panel */
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

/* Editor panel */
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

/* Normal table view styles */
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

.truncate-text {
  display: inline-block;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  vertical-align: middle;
}

.text-muted {
  color: #c0c4cc;
}

.product-line-checkboxes {
  display: flex;
  flex-wrap: wrap;
  gap: 4px 8px;
}

.product-line-checkboxes .el-checkbox {
  margin-right: 0;
}

.add-module-form {
  margin-top: 16px;
  padding: 12px;
  background: #f5f7fa;
  border-radius: 4px;
}

.add-module-fields {
  display: flex;
  gap: 8px;
  align-items: center;
  flex-wrap: wrap;
}

.claude-md-editor {
  width: 100%;
  min-height: 500px;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 13px;
  line-height: 1.6;
  padding: 12px;
  border: 1px solid #dcdfe6;
  border-radius: 4px;
  resize: vertical;
  box-sizing: border-box;
}

/* Scrollbar */
.repo-list::-webkit-scrollbar,
.file-tree::-webkit-scrollbar {
  width: 5px;
}

.repo-list::-webkit-scrollbar-thumb,
.file-tree::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.repo-list::-webkit-scrollbar-thumb:hover,
.file-tree::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}
</style>
