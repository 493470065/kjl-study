<template>
  <page-container title="Skill 管理" no-card>
   <div class="skills-page">
    <!-- Left Panel: Skill List -->
    <div class="panel panel-left">
      <div class="panel-header">
        <div class="header-btns">
          <el-button size="small" @click="createDialogVisible = true">新建</el-button>
          <el-button size="small" @click="uploadDialogVisible = true">上传 Zip</el-button>
          <el-button size="small" :icon="Refresh" @click="handleRefreshSkills" :loading="loadingSkills">刷新</el-button>
        </div>
      </div>
      <div class="skill-list" v-loading="loadingSkills">
        <div
          v-for="skill in skillList"
          :key="skill.name"
          :class="['skill-card', { active: selectedSkillName === skill.name, disabled: skill.disabled }]"
          @click="selectSkill(skill.name)"
          @contextmenu.prevent="openContextMenu($event, skill.name)"
        >
          <div class="skill-card__header">
            <span class="skill-card__name">{{ skill.name }}</span>
            <el-tag v-if="skill.version" size="small" type="info">{{ skill.version }}</el-tag>
            <el-tag v-if="skill.commitId" size="small" type="info" style="margin-left: 4px; font-family: monospace">
              <el-tooltip :content="skill.commitId" placement="top">
                {{ skill.commitId.substring(0, 7) }}
              </el-tooltip>
            </el-tag>
          </div>
          <div v-if="skill.description" class="skill-card__desc">{{ skill.description }}</div>
          <div v-else class="skill-card__desc skill-card__desc--empty">无描述</div>
          <div class="skill-card__actions">
            <el-button v-if="skill.disabled" type="success" size="small" link @click.stop="handleEnableSkill(skill.name)">
              启用
            </el-button>
            <el-button v-else type="warning" size="small" link @click.stop="handleDisableSkill(skill.name)">
              停用
            </el-button>
            <el-button v-if="skill.copyEnabled" type="primary" size="small" link @click.stop="handleDisableCopySkill(skill.name)">
              取消复制
            </el-button>
            <el-button v-else type="info" size="small" link @click.stop="handleEnableCopySkill(skill.name)">
              启用复制
            </el-button>
          </div>
        </div>
        <el-empty v-if="!loadingSkills && skillList.length === 0" description="暂无 Skill" :image-size="60" />
      </div>
    </div>

    <!-- Middle Panel: Git Info + File Tree -->
    <div class="panel panel-middle">
      <template v-if="selectedSkillName">
        <div class="git-info" v-loading="loadingDetail">
          <div class="git-info__row" v-if="gitInfo.branch">
            <el-icon><Connection /></el-icon>
            <span class="git-info__label">分支</span>
            <span class="git-info__value">{{ gitInfo.branch }}</span>
          </div>
          <div class="git-info__row" v-if="gitInfo.lastCommit">
            <el-icon><Clock /></el-icon>
            <span class="git-info__label">提交</span>
            <el-tooltip :content="gitInfo.lastCommit" placement="right">
              <span class="git-info__value git-info__commit">{{ gitInfo.lastCommit.substring(0, 7) }}</span>
            </el-tooltip>
          </div>
          <div class="git-info__row" v-if="gitInfo.remoteUrl">
            <el-icon><Link /></el-icon>
            <el-tooltip :content="gitInfo.remoteUrl" placement="right">
              <span class="git-info__value git-info__url">{{ gitInfo.remoteUrl }}</span>
            </el-tooltip>
          </div>
        </div>
        <div class="tree-actions">
          <el-dropdown trigger="click" @command="handleTreeAction">
            <el-button size="small" text type="primary">
              操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <!-- 更新 (git pull) 暂隐藏：该功能仅对 git 仓库技能有效，zip 上传的技能无意义 -->
                <el-dropdown-item command="delete" :icon="Delete" divided>删除 Skill</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="file-tree" v-loading="loadingDetail">
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
          <el-empty v-else-if="!loadingDetail" description="无文件" :image-size="40" />
        </div>
      </template>
      <el-empty v-else description="请选择一个 Skill" :image-size="80" />
    </div>

    <!-- Right Panel: File Editor -->
    <div class="panel panel-right">
      <div class="editor" v-if="selectedFilePath && !fileContentLoading">
        <div class="editor__header">
          <span class="editor__path">
            <el-icon><Document /></el-icon>
            {{ filePathBreadcrumb }}
          </span>
          <div class="editor__actions">
            <el-button
              v-if="isMarkdownFile"
              size="small"
              :type="previewMode ? 'primary' : 'default'"
              @click="togglePreview"
            >{{ previewMode ? '编辑' : '预览' }}</el-button>
            <el-button size="small" type="primary" :loading="saving" @click="saveFile">保存</el-button>
          </div>
        </div>
        <div class="editor__body">
          <div v-if="previewMode" class="editor__preview markdown-body" v-html="markdownPreview" />
          <textarea
            v-else
            v-model="fileContent"
            class="editor__textarea"
            spellcheck="false"
            :placeholder="`编辑 ${selectedFilePath}...`"
          />
        </div>
      </div>
      <div v-else-if="selectedSkillName && !selectedFilePath" class="editor-placeholder">
        <el-empty description="请从左侧文件树选择一个文件" :image-size="80" />
      </div>
      <div v-else-if="fileContentLoading" class="editor-placeholder">
        <div v-loading="true" class="editor-loading" />
      </div>
      <div v-else class="editor-placeholder">
        <el-empty description="选择 Skill 和文件后开始编辑" :image-size="100" />
      </div>
    </div>

    <!-- Context Menu -->
    <div
      v-if="contextMenuVisible"
      class="ctx-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
    >
      <!-- 更新 (git pull) 暂隐藏：该功能仅对 git 仓库技能有效，zip 上传的技能无意义 -->
      <div class="ctx-menu__divider" />
      <div class="ctx-menu__item ctx-menu__item--danger" @click="handleDelete(contextMenuSkill)">
        <el-icon><Delete /></el-icon> 删除
      </div>
    </div>

    <!-- Create Dialog -->
    <el-dialog v-model="createDialogVisible" title="新建 Skill" width="420px">
      <el-form @submit.prevent="submitCreate">
        <el-form-item label="名称">
          <el-input v-model="createName" placeholder="Skill 名称（英文，如 my-skill）" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="creating" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- Upload Zip Dialog -->
    <el-dialog v-model="uploadDialogVisible" title="上传 Skill (Zip)" width="480px">
      <el-form label-width="80px" @submit.prevent="submitUpload">
        <el-form-item label="名称">
          <el-input v-model="uploadName" placeholder="Skill 名称（英文，如 my-skill）" />
        </el-form-item>
        <el-form-item label="Zip 文件">
          <el-upload
            ref="uploadRef"
            :auto-upload="false"
            :limit="1"
            accept=".zip"
            :on-change="onUploadFileChange"
            :on-remove="onUploadFileRemove"
          >
            <el-button type="primary">选择 Zip 文件</el-button>
            <template #tip>
              <div class="el-upload__tip">上传包含 SKILL.md 的 zip 文件，将覆盖同名 Skill</div>
            </template>
          </el-upload>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="uploadDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="uploading" @click="submitUpload">上传</el-button>
      </template>
    </el-dialog>
   </div>
  </page-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, markRaw, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import {
  Folder, Document, Refresh, Delete, Connection, Clock, Link, ArrowDown
} from '@element-plus/icons-vue'
import { skillApi, type SkillSummary, type FileTreeNode } from '@/api/skill'
import { useMarkdown } from '@/composables/useMarkdown'

// ── Markdown ──────────────────────────────────────────────────────────────────
const { renderMarkdown } = useMarkdown()
const mdRenderer = markRaw({ render: renderMarkdown })

// ── Skill List ────────────────────────────────────────────────────────────────
const skillList = ref<SkillSummary[]>([])
const loadingSkills = ref(false)

// ── Selection State ───────────────────────────────────────────────────────────
const selectedSkillName = ref('')
const skillDetail = ref<{ name: string; directory: string; frontmatter: Record<string, any>; content: string; fileTree: FileTreeNode[] } | null>(null)
const gitInfo = ref<{ lastCommit?: string; remoteUrl?: string; branch?: string }>({})
const loadingDetail = ref(false)

// ── File Editor ───────────────────────────────────────────────────────────────
const selectedFilePath = ref('')
const fileContent = ref('')
const fileContentLoading = ref(false)
const saving = ref(false)
const previewMode = ref(false)

// ── File Tree Config ──────────────────────────────────────────────────────────
const treeProps = { children: 'children', label: 'name', isLeaf: (node: FileTreeNode) => node.type === 'file' }

// ── Dialogs ───────────────────────────────────────────────────────────────────
const createDialogVisible = ref(false)
const createName = ref('')
const creating = ref(false)

const uploadDialogVisible = ref(false)
const uploadName = ref('')
const uploading = ref(false)
const uploadFile = ref<File | null>(null)

watch(uploadDialogVisible, (val) => {
  if (val) {
    uploadName.value = ''
    uploadFile.value = null
  }
})

// ── Context Menu ──────────────────────────────────────────────────────────────
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuSkill = ref('')

// ── Computed ──────────────────────────────────────────────────────────────────
const fileTree = computed(() => skillDetail.value?.fileTree ?? [])

const filePathBreadcrumb = computed(() => selectedFilePath.value || '')

const isMarkdownFile = computed(() => selectedFilePath.value.endsWith('.md'))

const markdownPreview = computed(() => {
  if (!isMarkdownFile.value || !fileContent.value) return ''
  return mdRenderer.render(fileContent.value)
})

// ── Load Skills ───────────────────────────────────────────────────────────────
async function loadSkillList() {
  loadingSkills.value = true
  try {
    skillList.value = await skillApi.listSkills()
  } catch {
    ElMessage.error('加载 Skill 列表失败')
  } finally {
    loadingSkills.value = false
  }
}

async function handleRefreshSkills() {
  await loadSkillList()
  ElMessage.success('Skill 列表已刷新')
}

async function handleDisableSkill(name: string) {
  try {
    await skillApi.disableSkill(name)
    ElMessage.success(`已停用: ${name}`)
    await loadSkillList()
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleEnableSkill(name: string) {
  try {
    await skillApi.enableSkill(name)
    ElMessage.success(`已启用: ${name}`)
    await loadSkillList()
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleEnableCopySkill(name: string) {
  try {
    await skillApi.enableCopySkill(name)
    ElMessage.success(`已启用复制: ${name}`)
    await loadSkillList()
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleDisableCopySkill(name: string) {
  try {
    await skillApi.disableCopySkill(name)
    ElMessage.success(`已取消复制: ${name}`)
    await loadSkillList()
  } catch {
    ElMessage.error('操作失败')
  }
}

// ── Select Skill ──────────────────────────────────────────────────────────────
async function selectSkill(name: string) {
  selectedSkillName.value = name
  selectedFilePath.value = ''
  fileContent.value = ''
  previewMode.value = false
  loadingDetail.value = true
  try {
    const [detail, git] = await Promise.all([
      skillApi.getSkillDetail(name),
      skillApi.getGitInfo(name).catch(() => ({}))
    ])
    skillDetail.value = detail
    gitInfo.value = git
    // Auto-select SKILL.md
    const skillMd = detail.fileTree.find(f => f.name === 'SKILL.md')
    if (skillMd) {
      await nextTick()
      await loadFileContent(skillMd.path)
    }
  } catch {
    ElMessage.error('加载 Skill 详情失败')
    skillDetail.value = null
    gitInfo.value = {}
  } finally {
    loadingDetail.value = false
  }
}

// ── File Tree Click ───────────────────────────────────────────────────────────
function onNodeClick(data: FileTreeNode) {
  if (data.type === 'file') {
    loadFileContent(data.path)
  }
}

async function loadFileContent(path: string) {
  selectedFilePath.value = path
  fileContentLoading.value = true
  previewMode.value = false
  try {
    const res = await skillApi.readFile(selectedSkillName.value, path)
    fileContent.value = res.content
  } catch {
    ElMessage.error('加载文件内容失败')
    fileContent.value = ''
  } finally {
    fileContentLoading.value = false
  }
}

// ── Save File ─────────────────────────────────────────────────────────────────
async function saveFile() {
  if (!selectedSkillName.value || !selectedFilePath.value) return
  saving.value = true
  try {
    await skillApi.writeFile(selectedSkillName.value, selectedFilePath.value, fileContent.value)
    ElMessage.success('保存成功')
    // Refresh detail if SKILL.md was saved
    if (selectedFilePath.value === 'SKILL.md') {
      const detail = await skillApi.getSkillDetail(selectedSkillName.value)
      skillDetail.value = detail
    }
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// ── Create Skill ──────────────────────────────────────────────────────────────
async function submitCreate() {
  const name = createName.value.trim()
  if (!name) {
    ElMessage.warning('请输入 Skill 名称')
    return
  }
  creating.value = true
  try {
    await skillApi.createSkill({ name })
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    createName.value = ''
    await loadSkillList()
    selectSkill(name)
  } catch {
    ElMessage.error('创建失败')
  } finally {
    creating.value = false
  }
}

// ── Upload Zip ─────────────────────────────────────────────────────────────
function onUploadFileChange(file: any) {
  if (file.raw) {
    uploadFile.value = file.raw
  }
}

function onUploadFileRemove() {
  uploadFile.value = null
}

async function submitUpload() {
  const name = uploadName.value.trim()
  if (!name) {
    ElMessage.warning('请输入 Skill 名称')
    return
  }
  if (!uploadFile.value) {
    ElMessage.warning('请选择 Zip 文件')
    return
  }
  uploading.value = true
  try {
    const result = await skillApi.uploadSkill(name, uploadFile.value)
    ElMessage.success(`上传成功: ${result.name}`)
    uploadDialogVisible.value = false
    uploadName.value = ''
    uploadFile.value = null
    await loadSkillList()
    selectSkill(result.name)
  } catch (err: any) {
    const msg = err?.response?.data?.error || err?.message || ''
    if (msg.includes('SKILL.md') || msg.includes('skill.md')) {
      ElMessage.error(msg)
    } else if (msg.includes('已存在')) {
      ElMessage.error(msg)
    } else {
      ElMessage.error('上传失败，请确保 Zip 文件根目录包含 SKILL.md')
    }
  } finally {
    uploading.value = false
  }
}

// ── Pull (Update) ─────────────────────────────────────────────────────────────
async function handlePull(name?: string) {
  const target = name || selectedSkillName.value
  if (!target) return
  contextMenuVisible.value = false
  try {
    await ElMessageBox.confirm(`确定要从远程仓库更新 "${target}" 吗？`, '更新 Skill', {
      confirmButtonText: '更新',
      cancelButtonText: '取消',
      type: 'info'
    })
    const result = await skillApi.pullSkill(target)
    if (result.success) {
      ElMessage.success('更新成功')
      selectSkill(target)
    } else {
      ElMessage.warning('更新完成，但可能有变更需要处理')
    }
    if (result.output) {
      console.log('[git pull output]', result.output)
    }
  } catch {
    // cancelled or failed
  }
}

// ── Delete Skill ──────────────────────────────────────────────────────────────
async function handleDelete(name?: string) {
  const target = name || selectedSkillName.value
  if (!target) return
  contextMenuVisible.value = false
  try {
    await ElMessageBox.confirm(`确定要删除 Skill "${target}" 吗？此操作不可恢复。`, '删除 Skill', {
      confirmButtonText: '删除',
      cancelButtonText: '取消',
      type: 'warning'
    })
    await skillApi.deleteSkill(target)
    ElMessage.success('已删除')
    if (selectedSkillName.value === target) {
      selectedSkillName.value = ''
      skillDetail.value = null
      gitInfo.value = {}
      selectedFilePath.value = ''
      fileContent.value = ''
    }
    await loadSkillList()
  } catch {
    // cancelled or failed
  }
}

// ── Tree Dropdown Action ──────────────────────────────────────────────────────
function handleTreeAction(command: string) {
  if (command === 'pull') handlePull()
  else if (command === 'delete') handleDelete()
}

// ── Preview Toggle ────────────────────────────────────────────────────────────
function togglePreview() {
  previewMode.value = !previewMode.value
}

// ── Context Menu ──────────────────────────────────────────────────────────────
function openContextMenu(e: MouseEvent, name: string) {
  e.preventDefault()
  contextMenuSkill.value = name
  contextMenuX.value = e.clientX
  contextMenuY.value = e.clientY
  contextMenuVisible.value = true
}

function onDocClick() {
  contextMenuVisible.value = false
}

// ── Lifecycle ─────────────────────────────────────────────────────────────────
let keydownHandler: ((e: KeyboardEvent) => void) | null = null

onMounted(() => {
  loadSkillList()
  document.addEventListener('click', onDocClick)
  keydownHandler = (e: KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault()
      if (selectedFilePath.value && !saving.value) {
        saveFile()
      }
    }
  }
  document.addEventListener('keydown', keydownHandler)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler)
  }
})
</script>

<style scoped>
/* 全宽页面，不受 PageContainer 全局 max-width: 1400px 限制 */
.page-container {
  max-width: 100%;
}

/* ── Page Layout ───────────────────────────────────────────────────────────── */
.skills-page {
  display: flex;
  height: calc(100vh - 200px);
  min-height: 500px;
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
  width: 250px;
  min-width: 200px;
  flex-shrink: 0;
}

.panel-middle {
  width: 220px;
  min-width: 180px;
  flex-shrink: 0;
}

.panel-right {
  flex: 1;
  min-width: 300px;
}

/* ── Left Panel: Skill List ────────────────────────────────────────────────── */
.panel-header {
  padding: 10px 12px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.header-btns {
  display: flex;
  gap: 8px;
}

.skill-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.skill-card {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  margin-bottom: 4px;
  transition: background 0.15s, border-color 0.15s;
}

.skill-card:hover {
  background: #f5f7fa;
}

.skill-card.active {
  background: #ecf5ff;
  border-color: #409eff;
}

.skill-card__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.skill-card__name {
  font-weight: 600;
  font-size: 13px;
  color: #303133;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
}

.skill-card__desc {
  font-size: 12px;
  color: #909399;
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.skill-card__desc--empty {
  color: #c0c4cc;
  font-style: italic;
}

.skill-card.disabled {
  opacity: 0.5;
  background: #f5f5f5;
}

.skill-card.disabled .skill-card__name {
  text-decoration: line-through;
  color: #999;
}

.skill-card__actions {
  margin-top: 4px;
  display: flex;
  justify-content: flex-end;
}

/* ── Middle Panel: Git Info + File Tree ────────────────────────────────────── */
.git-info {
  padding: 10px 12px 6px;
  border-bottom: 1px solid #ebeef5;
  flex-shrink: 0;
}

.git-info__row {
  display: flex;
  align-items: center;
  gap: 5px;
  font-size: 12px;
  color: #606266;
  margin-bottom: 5px;
}

.git-info__label {
  color: #909399;
  flex-shrink: 0;
}

.git-info__value {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.git-info__commit {
  font-family: 'Consolas', 'Monaco', monospace;
  color: #409eff;
}

.git-info__url {
  cursor: default;
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

/* ── Right Panel: Editor ───────────────────────────────────────────────────── */
.editor {
  flex: 1;
  min-height: 0;
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
  min-height: 0;
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

.editor__preview {
  padding: 16px 24px;
  overflow-y: auto;
  height: 100%;
  font-size: 14px;
  line-height: 1.7;
  color: #303133;
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

/* ── Context Menu ──────────────────────────────────────────────────────────── */
.ctx-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid #e4e7ed;
  border-radius: 6px;
  padding: 4px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  min-width: 160px;
}

.ctx-menu__item {
  padding: 8px 16px;
  font-size: 13px;
  color: #303133;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.15s;
}

.ctx-menu__item:hover {
  background: #f5f7fa;
}

.ctx-menu__item--danger {
  color: #f56c6c;
}

.ctx-menu__item--danger:hover {
  background: #fef0f0;
}

.ctx-menu__divider {
  height: 1px;
  background: #ebeef5;
  margin: 4px 0;
}

/* ── Scrollbar ─────────────────────────────────────────────────────────────── */
.skill-list::-webkit-scrollbar,
.file-tree::-webkit-scrollbar,
.editor__preview::-webkit-scrollbar {
  width: 5px;
}

.skill-list::-webkit-scrollbar-thumb,
.file-tree::-webkit-scrollbar-thumb,
.editor__preview::-webkit-scrollbar-thumb {
  background: #dcdfe6;
  border-radius: 3px;
}

.skill-list::-webkit-scrollbar-thumb:hover,
.file-tree::-webkit-scrollbar-thumb:hover,
.editor__preview::-webkit-scrollbar-thumb:hover {
  background: #c0c4cc;
}
</style>
