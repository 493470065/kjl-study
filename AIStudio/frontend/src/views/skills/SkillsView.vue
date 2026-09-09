<template>
  <page-container title="Skill 管理" no-card>
   <div class="skills-page">
    <!-- Left Panel: Skill List（搜索 + 状态筛选 + 自动分组，便于大量 Skill 快速定位） -->
    <div class="panel panel-left">
      <div class="panel-header">
        <el-input
          v-model="skillKeyword"
          placeholder="搜索名称或描述"
          clearable
          size="small"
          class="skill-search"
        >
          <template #prefix><el-icon><Search /></el-icon></template>
        </el-input>
        <el-radio-group v-model="statusFilter" size="small" class="status-filter">
          <el-radio-button value="all">全部 {{ skillList.length }}</el-radio-button>
          <el-radio-button value="enabled">启用 {{ enabledCount }}</el-radio-button>
          <el-radio-button value="disabled">停用 {{ disabledCount }}</el-radio-button>
        </el-radio-group>
        <div class="header-btns">
          <el-button size="small" @click="uploadDialogVisible = true">上传 Zip</el-button>
          <el-button size="small" :icon="Refresh" @click="handleRefreshSkills" :loading="loadingSkills">刷新</el-button>
        </div>
        <div class="group-ops">
          <el-button size="small" text @click="expandAll">展开全部</el-button>
          <el-button size="small" text @click="collapseAll">收起全部</el-button>
        </div>
      </div>
      <div class="skill-list" v-loading="loadingSkills">
        <el-collapse
          v-if="groupedSkills.length > 0"
          :model-value="expandedGroups"
          @change="onCollapseChange"
          class="skill-collapse"
        >
          <el-collapse-item v-for="g in groupedSkills" :key="g.key" :name="g.key">
            <template #title>
              <span class="skill-group__title">
                <span class="skill-group__arrow" :class="{ 'is-expanded': isExpanded(g.key) }">
                  <el-icon><ArrowRight /></el-icon>
                </span>
                <span
                  v-if="g.key !== UNTAGGED_KEY"
                  class="skill-group__dot"
                  :style="{ background: tagColorOf(g.label).fg }"
                />
                <span class="skill-group__name">{{ g.label }}</span>
                <span class="skill-group__count">{{ g.items.length }}</span>
              </span>
            </template>
            <div
              v-for="skill in g.items"
              :key="skill.name"
              :class="['skill-card', { active: selectedSkillName === skill.name, disabled: skill.disabled }]"
              role="button"
              tabindex="0"
              :aria-label="'选择 Skill：' + skill.name"
              @click="selectSkill(skill.name)"
              @keydown.enter.prevent="selectSkill(skill.name)"
              @contextmenu.prevent="openContextMenu($event, skill.name)"
            >
              <div class="skill-card__header">
                <span
                  class="skill-card__dot"
                  :class="skill.disabled ? 'is-off' : 'is-on'"
                  :title="skill.disabled ? '已停用' : '已启用'"
                />
                <span class="skill-card__name" :title="skill.name" v-html="highlight(skill.name)" />
                <el-tag v-if="skill.version" size="small" type="info" class="skill-card__ver">v{{ skill.version }}</el-tag>
              </div>
              <div
                class="skill-card__desc"
                :class="{ 'skill-card__desc--empty': !skill.description }"
                v-html="highlight(skill.description || '无描述')"
              />
              <div class="skill-card__footer">
                <span v-if="skill.commitId" class="skill-card__commit" :title="skill.commitId">
                  {{ skill.commitId.substring(0, 7) }}
                </span>
                <button
                  class="skill-tag"
                  :class="{ 'skill-tag--empty': !skill.tag }"
                  :style="skill.tag ? { background: tagColorOf(skill.tag).bg, color: tagColorOf(skill.tag).fg } : {}"
                  :title="skill.tag ? '点击修改标识' : '点击设置标识'"
                  @click.stop="openTagDialog(skill)"
                >
                  {{ skill.tag || '+ 标识' }}
                </button>
                <span class="skill-card__spacer" />
                <span class="skill-card__actions">
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
                </span>
              </div>
            </div>
          </el-collapse-item>
        </el-collapse>
        <el-empty
          v-else-if="!loadingSkills"
          :description="skillList.length ? '没有匹配的 Skill' : '暂无 Skill'"
          :image-size="60"
        />
      </div>
      <div class="list-footer">
        显示 {{ filteredSkills.length }} / {{ skillList.length }} 个 Skill
      </div>
    </div>

    <!-- Middle Panel: Git Info + File Tree -->
    <div class="panel panel-middle">
      <template v-if="selectedSkillName">
        <div class="mid-header">
          <span class="mid-header__name" :title="selectedSkillName">{{ selectedSkillName }}</span>
          <el-dropdown trigger="click" @command="handleTreeAction">
            <el-button size="small" text type="primary">
              操作<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <!-- 更新 (git pull) 暂隐藏：该功能仅对 git 仓库技能有效，zip 上传的技能无意义 -->
                <el-dropdown-item command="tag" :icon="PriceTag">设置标识</el-dropdown-item>
                <el-dropdown-item command="delete" :icon="Delete" divided>删除 Skill</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
        <div class="git-info" v-loading="loadingDetail">
          <el-tooltip v-if="gitInfo.branch" :content="'分支：' + gitInfo.branch" placement="bottom">
            <span class="git-chip"><el-icon><Connection /></el-icon>{{ gitInfo.branch }}</span>
          </el-tooltip>
          <el-tooltip v-if="gitInfo.lastCommit" :content="gitInfo.lastCommit" placement="bottom">
            <span class="git-chip"><el-icon><Clock /></el-icon>{{ gitInfo.lastCommit.substring(0, 7) }}</span>
          </el-tooltip>
          <el-tooltip v-if="gitInfo.remoteUrl" :content="gitInfo.remoteUrl" placement="bottom">
            <span class="git-chip"><el-icon><Link /></el-icon>远端</span>
          </el-tooltip>
          <span v-if="!gitInfo.branch && !gitInfo.lastCommit && !gitInfo.remoteUrl" class="git-chip git-chip--muted">无 Git 信息</span>
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
      <div class="ctx-menu__item" role="menuitem" tabindex="0"
           @click="openTagDialog(skillList.find(s => s.name === contextMenuSkill))"
           @keydown.enter.prevent="openTagDialog(skillList.find(s => s.name === contextMenuSkill))">
        <el-icon><PriceTag /></el-icon> 设置标识
      </div>
      <div class="ctx-menu__divider" />
      <div class="ctx-menu__item ctx-menu__item--danger" role="menuitem" tabindex="0"
           @click="handleDelete(contextMenuSkill)" @keydown.enter.prevent="handleDelete(contextMenuSkill)">
        <el-icon><Delete /></el-icon> 删除
      </div>
    </div>

    <!-- Upload Zip Dialog -->
    <el-dialog v-model="uploadDialogVisible" title="上传 Skill (Zip)" width="480px">
      <el-form ref="uploadFormRef" :model="uploadFormModel" :rules="uploadRules" label-width="80px" @submit.prevent="submitUpload">
        <el-form-item label="名称" prop="name">
          <el-input v-model="uploadName" placeholder="Skill 名称（英文，如 my-skill）" />
        </el-form-item>
        <el-form-item label="Zip 文件" prop="file">
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

    <!-- Tag Dialog：人工维护分类标识 -->
    <el-dialog v-model="tagDialogVisible" title="设置分类标识" width="440px" @keyup.enter="submitTag">
      <p class="tag-dialog__hint">为该 Skill 指定一个分类标识，左侧列表将按标识分组，每个分组支持展开 / 收起。</p>
      <el-select
        v-model="tagEditValue"
        placeholder="输入或选择标识，如：需求治理 / 文档生成 / 测试"
        filterable
        allow-create
        default-first-option
        clearable
        style="width: 100%"
      >
        <el-option v-for="t in knownTags" :key="t" :label="t" :value="t" />
      </el-select>
      <template #footer>
        <el-button @click="tagDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="tagSaving" @click="submitTag">保存</el-button>
      </template>
    </el-dialog>
   </div>
  </page-container>
</template>

<script lang="ts">
// ===== 模块级缓存：技能列表不随组件销毁丢失 =====
// 重新进入页面时直接展示上次数据，不再等待 3s（后端要为 23 个技能各起一个 git 子进程）；
// 数据更新由工具栏「刷新」按钮人工触发，或超过 TTL 后后台静默刷新。
import type { SkillSummary } from '@/api/skill'

interface SkillListSnapshot {
  list: SkillSummary[]
  fetchedAt: number
}
const skillListSnapshot: { value: SkillListSnapshot | null } = { value: null }
/** 快照有效期：超过则重进页面时后台静默刷新一次（不显示 loading） */
const SKILL_SNAPSHOT_TTL_MS = 5 * 60 * 1000
/** 上次选中的技能：重进页面保持原位，不再每次跳回第一个重拉详情 */
const lastSelected: { name: string } = { name: '' }

export default {}
</script>

<script setup lang="ts">
import { ref, computed, onMounted, onBeforeUnmount, nextTick, markRaw, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import {
  Folder, Document, Refresh, Delete, Connection, Clock, Link, ArrowDown, Search, PriceTag, ArrowRight
} from '@element-plus/icons-vue'
import { skillApi, type SkillSummary, type FileTreeNode } from '@/api/skill'
import { useMarkdown } from '@/composables/useMarkdown'
import { useConfirmDelete } from '@/composables/useConfirmDelete'

const { confirmDelete } = useConfirmDelete()

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
const uploadFormRef = ref<FormInstance>()
const uploadFormModel = computed(() => ({ name: uploadName.value, file: uploadFile.value }))
const uploadRules: FormRules = {
  name: [{ required: true, message: '请输入 Skill 名称', trigger: 'blur' }],
  file: [{
    validator: (_rule: any, value: any, callback: any) => {
      if (!value) callback(new Error('请选择 Zip 文件'))
      else callback()
    },
    trigger: 'change'
  }]
}

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

// ── 列表检索 / 分组（Skill 数量较多时用于快速定位） ────────────────────────────
const skillKeyword = ref('')
/** 状态筛选：all 全部 / enabled 已启用 / disabled 已停用 */
const statusFilter = ref<'all' | 'enabled' | 'disabled'>('all')

const enabledCount = computed(() => skillList.value.filter(s => !s.disabled).length)
const disabledCount = computed(() => skillList.value.length - enabledCount.value)

const filteredSkills = computed(() => {
  const kw = skillKeyword.value.trim().toLowerCase()
  return skillList.value.filter(s => {
    if (statusFilter.value === 'enabled' && s.disabled) return false
    if (statusFilter.value === 'disabled' && !s.disabled) return false
    if (!kw) return true
    return s.name.toLowerCase().includes(kw) ||
      (s.description || '').toLowerCase().includes(kw)
  })
})

/** 按人工标识分组：有标识的按标识归类，无标识的统一进「未分类」（始终排最后） */
const UNTAGGED_KEY = '__untagged__'

const groupedSkills = computed(() => {
  const buckets = new Map<string, SkillSummary[]>()
  let untagged: SkillSummary[] = []
  for (const s of filteredSkills.value) {
    const t = (s.tag || '').trim()
    if (!t) { untagged.push(s); continue }
    if (!buckets.has(t)) buckets.set(t, [])
    buckets.get(t)!.push(s)
  }
  const groups: { key: string; label: string; items: SkillSummary[] }[] = []
  for (const [tag, items] of buckets) {
    groups.push({ key: tag, label: tag, items: items.sort((a, b) => a.name.localeCompare(b.name)) })
  }
  // 有标识的分组按名称排序，保证顺序稳定（不随筛选跳动）
  groups.sort((a, b) => a.label.localeCompare(b.label, 'zh-Hans-CN'))
  if (untagged.length) {
    untagged.sort((a, b) => a.name.localeCompare(b.name))
    groups.push({ key: UNTAGGED_KEY, label: '未分类', items: untagged })
  }
  return groups
})

/** 折叠状态：默认全部展开，记住用户手动收起的分组 */
const LS_COLLAPSE_KEY = 'skills.collapsed.v1'
const collapsedGroups = ref<string[]>([])
try {
  const raw = localStorage.getItem(LS_COLLAPSE_KEY)
  if (raw) {
    const arr = JSON.parse(raw)
    if (Array.isArray(arr)) collapsedGroups.value = arr.filter(x => typeof x === 'string')
  }
} catch { /* 忽略损坏的缓存 */ }
function isExpanded(key: string) {
  return expandedGroups.value.includes(key)
}
function persistCollapsed() {
  try { localStorage.setItem(LS_COLLAPSE_KEY, JSON.stringify(collapsedGroups.value)) } catch { /* 忽略容量错误 */ }
}
/** el-collapse 的 change 事件携带的是「当前展开」的面板名集合，需换算为「收起」集合 */
function onCollapseChange(expandedKeys: string[]) {
  const all = groupedSkills.value.map(g => g.key)
  collapsedGroups.value = all.filter(k => !expandedKeys.includes(k))
  persistCollapsed()
}
/** el-collapse 的 model-value 是「展开的面板名」，与记录的「收起集合」取反 */
const expandedGroups = computed(() =>
  groupedSkills.value.map(g => g.key).filter(k => !collapsedGroups.value.includes(k))
)

function expandAll() {
  collapsedGroups.value = []
  try { localStorage.removeItem(LS_COLLAPSE_KEY) } catch { /* ignore */ }
}
function collapseAll() {
  collapsedGroups.value = groupedSkills.value.map(g => g.key)
  persistCollapsed()
}

/** 标识色：按名称散列出稳定色，同标识在任何位置颜色一致 */
const TAG_PALETTE = [
  { bg: '#e6f1fb', fg: '#185fa5' },
  { bg: '#eaf3de', fg: '#4a7c1f' },
  { bg: '#faeeda', fg: '#a8641a' },
  { bg: '#f3e8f7', fg: '#7b4397' },
  { bg: '#e0f0ef', fg: '#12796f' },
  { bg: '#fde8e8', fg: '#b03a3a' }
]
function tagColorOf(tag: string) {
  let h = 0
  for (let i = 0; i < tag.length; i++) h = (h * 31 + tag.charCodeAt(i)) >>> 0
  return TAG_PALETTE[h % TAG_PALETTE.length]
}

// ── 标识编辑（人工维护） ──────────────────────────────────────────────────────
const tagDialogVisible = ref(false)
const tagEditSkill = ref('')
const tagEditValue = ref('')
const tagSaving = ref(false)
const knownTags = ref<string[]>([])

async function openTagDialog(skill?: SkillSummary) {
  tagEditSkill.value = skill?.name || selectedSkillName.value
  tagEditValue.value = (skill?.tag || '').trim()
  if (knownTags.value.length === 0) {
    try { knownTags.value = await skillApi.listTags() } catch { knownTags.value = [] }
  }
  tagDialogVisible.value = true
}

async function submitTag() {
  if (!tagEditSkill.value) return
  tagSaving.value = true
  try {
    await skillApi.setSkillTag(tagEditSkill.value, tagEditValue.value.trim())
    const t = tagEditValue.value.trim()
    if (t && !knownTags.value.includes(t)) knownTags.value.push(t)
    ElMessage.success(t ? `已设置标识「${t}」` : '已清除标识')
    tagDialogVisible.value = false
    await loadSkillList({ force: true })
  } catch (e: any) {
    ElMessage.error('保存标识失败：' + (e?.response?.data?.error || e?.message || '未知错误'))
  } finally {
    tagSaving.value = false
  }
}

/** 搜索命中高亮（先转义再包 <mark>，避免注入） */
function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c] as string))
}
function highlight(text: string) {
  const kw = skillKeyword.value.trim()
  if (!kw) return escapeHtml(text)
  const idx = text.toLowerCase().indexOf(kw.toLowerCase())
  if (idx < 0) return escapeHtml(text)
  return `${escapeHtml(text.slice(0, idx))}<mark class="skill-hl">${escapeHtml(text.slice(idx, idx + kw.length))}</mark>${escapeHtml(text.slice(idx + kw.length))}`
}

// ── Computed ──────────────────────────────────────────────────────────────────
const fileTree = computed(() => skillDetail.value?.fileTree ?? [])

const filePathBreadcrumb = computed(() => selectedFilePath.value || '')

const isMarkdownFile = computed(() => selectedFilePath.value.endsWith('.md'))

const markdownPreview = computed(() => {
  if (!isMarkdownFile.value || !fileContent.value) return ''
  return mdRenderer.render(fileContent.value)
})

// ── Load Skills ───────────────────────────────────────────────────────────────
/**
 * @param silent 静默刷新：不显示加载态（后台 SWR 用）
 * @param force  强制重扫：忽略前端快照与后端 60s 缓存（用户点「刷新」用）
 */
async function loadSkillList(opts: { silent?: boolean, force?: boolean } = {}) {
  const snap = skillListSnapshot.value
  // 有未过期快照：直接秒显，不进 loading
  if (!opts.force && snap && Date.now() - snap.fetchedAt < SKILL_SNAPSHOT_TTL_MS) {
    skillList.value = snap.list
    ensureSelection()
    return
  }
  if (!opts.silent) loadingSkills.value = true
  try {
    const list = await skillApi.listSkills(!!opts.force)
    skillList.value = list
    skillListSnapshot.value = { list, fetchedAt: Date.now() }
    ensureSelection()
  } catch {
    if (!opts.silent) ElMessage.error('加载 Skill 列表失败')
  } finally {
    if (!opts.silent) loadingSkills.value = false
  }
}

/** 保证有选中项：优先沿用上次选中的技能，否则取列表第一项 */
function ensureSelection() {
  const first = groupedSkills.value[0]?.items[0]
  if (!first) return
  const prev = lastSelected.name
  if (prev && skillList.value.some(s => s.name === prev)) {
    if (prev !== selectedSkillName.value) selectSkill(prev)
    return
  }
  if (!skillList.value.some(s => s.name === selectedSkillName.value)) {
    selectSkill(first.name)
  }
}

async function handleRefreshSkills() {
  await loadSkillList({ force: true })
  ElMessage.success('Skill 列表已刷新')
}

async function handleDisableSkill(name: string) {
  try {
    await skillApi.disableSkill(name)
    ElMessage.success(`已停用: ${name}`)
    await loadSkillList({ force: true })
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleEnableSkill(name: string) {
  try {
    await skillApi.enableSkill(name)
    ElMessage.success(`已启用: ${name}`)
    await loadSkillList({ force: true })
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleEnableCopySkill(name: string) {
  try {
    await skillApi.enableCopySkill(name)
    ElMessage.success(`已启用复制: ${name}`)
    await loadSkillList({ force: true })
  } catch {
    ElMessage.error('操作失败')
  }
}

async function handleDisableCopySkill(name: string) {
  try {
    await skillApi.disableCopySkill(name)
    ElMessage.success(`已取消复制: ${name}`)
    await loadSkillList({ force: true })
  } catch {
    ElMessage.error('操作失败')
  }
}

// ── Select Skill ──────────────────────────────────────────────────────────────
async function selectSkill(name: string) {
  selectedSkillName.value = name
  lastSelected.name = name
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
  const valid = await uploadFormRef.value?.validate().catch(() => false)
  if (!valid) return
  const name = uploadName.value.trim()
  uploading.value = true
  try {
    const result = await skillApi.uploadSkill(name, uploadFile.value)
    ElMessage.success(`上传成功: ${result.name}`)
    uploadDialogVisible.value = false
    uploadName.value = ''
    uploadFile.value = null
    await loadSkillList({ force: true })
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
  if (!await confirmDelete(`Skill "${target}"`, '删除 Skill')) return
  try {
    await skillApi.deleteSkill(target)
    ElMessage.success('已删除')
    if (selectedSkillName.value === target) {
      selectedSkillName.value = ''
      skillDetail.value = null
      gitInfo.value = {}
      selectedFilePath.value = ''
      fileContent.value = ''
    }
    await loadSkillList({ force: true })
  } catch {
    ElMessage.error('删除失败，请稍后重试')
  }
}

// ── Tree Dropdown Action ──────────────────────────────────────────────────────
function handleTreeAction(command: string) {
  if (command === 'pull') handlePull()
  else if (command === 'tag') openTagDialog()
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
  // 有快照先秒显；超过 TTL 再后台静默刷新（不 loading），用户无感知
  const snap = skillListSnapshot.value
  if (snap && Date.now() - snap.fetchedAt < SKILL_SNAPSHOT_TTL_MS) {
    skillList.value = snap.list
    ensureSelection()
    loadSkillList({ silent: true })
  } else {
    loadSkillList()
  }
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
  background: var(--paper-border);
  border: 1px solid var(--paper-border);
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
  width: 300px;
  min-width: 240px;
  flex-shrink: 0;
}

.panel-middle {
  width: 240px;
  min-width: 200px;
  flex-shrink: 0;
}

.panel-right {
  flex: 1;
  min-width: 300px;
}

/* ── Left Panel: Skill List ────────────────────────────────────────────────── */
.panel-header {
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.skill-search :deep(.el-input__wrapper) {
  border-radius: 6px;
}

/* 状态筛选：三等分铺满，比默认按钮组更省横向空间 */
.status-filter {
  display: flex;
  width: 100%;
}
.status-filter :deep(.el-radio-button) {
  flex: 1;
}
.status-filter :deep(.el-radio-button__inner) {
  width: 100%;
  padding: 6px 4px;
  font-size: 12px;
}

.header-btns {
  display: flex;
  gap: 6px;
}
.header-btns .el-button {
  flex: 1;
  padding-left: 6px;
  padding-right: 6px;
}

.skill-list {
  flex: 1;
  overflow-y: auto;
  padding: 6px 8px;
}

/* 分组标题：滚动时吸顶，长列表下始终知道自己在哪个分组 */
.skill-group + .skill-group {
  margin-top: 8px;
}
.skill-group__title {
  position: sticky;
  top: 0;
  z-index: 2;
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 4px 4px 4px 2px;
  margin-bottom: 4px;
  background: #fff;
  font-size: 11.5px;
  font-weight: 600;
  letter-spacing: 0.3px;
  color: var(--ink-text-secondary);
  text-transform: uppercase;
  cursor: pointer;
}
.skill-group__title::after {
  content: '';
  flex: 1;
  height: 1px;
  background: var(--el-border-color-lighter);
}
.skill-group__count {
  order: 3;
  flex-shrink: 0;
  padding: 0 6px;
  border-radius: 8px;
  background: var(--el-fill-color);
  color: var(--ink-text-secondary);
  font-size: 11px;
  font-weight: 500;
  line-height: 16px;
}

.skill-card {
  padding: 8px 10px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  margin-bottom: 4px;
  transition: background 0.15s, border-color 0.15s, box-shadow 0.15s;
}

.skill-card:hover {
  background: var(--el-fill-color);
}

.skill-card:focus-visible {
  outline: 2px solid var(--el-color-primary);
  outline-offset: -1px;
}

.skill-card.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
  box-shadow: inset 2px 0 0 var(--el-color-primary);
}

.skill-card__header {
  display: flex;
  align-items: center;
  gap: 5px;
}

/* 启用/停用状态点：比给整张卡片降透明度更省眼力，停用也能看清内容 */
.skill-card__dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  flex-shrink: 0;
}
.skill-card__dot.is-on {
  background: var(--el-color-success);
  box-shadow: 0 0 0 2px var(--el-color-success-light-8);
}
.skill-card__dot.is-off {
  background: var(--el-color-info);
}

/* 分组标题前的小圆点：取标识色，与卡片标识 chip 同色，一眼知道该组归属 */
.skill-group__dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
}

.skill-card__name {
  font-weight: 600;
  font-size: 13px;
  color: var(--ink-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  flex: 1;
  font-family: var(--app-font-mono);
}

.skill-card__ver {
  flex-shrink: 0;
  transform: scale(0.9);
  transform-origin: right center;
}

.skill-card__desc {
  font-size: 12px;
  color: var(--ink-text-secondary);
  margin-top: 4px;
  margin-left: 11px;
  line-height: 1.5;
  /* 最多两行，超出省略：一屏能看到更多 Skill */
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
  word-break: break-word;
}

.skill-card__desc--empty {
  color: #b8b1a0;
  font-style: italic;
}

.skill-card__footer {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 4px;
  margin-left: 11px;
  min-height: 22px;
}
.skill-card__commit {
  font-family: var(--app-font-mono);
  font-size: 11px;
  color: var(--el-color-primary);
  background: var(--el-color-primary-light-9);
  padding: 1px 5px;
  border-radius: 3px;
}
.skill-card__spacer {
  flex: 1;
}

/* 卡片底部标识 chip：点击即可设置/修改分类标识 */
.skill-tag {
  flex-shrink: 0;
  max-width: 96px;
  padding: 1px 8px;
  border: none;
  border-radius: 10px;
  font-size: 11px;
  font-weight: 600;
  line-height: 18px;
  cursor: pointer;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  transition: filter 0.15s;
}
.skill-tag:hover {
  filter: brightness(0.94);
}
.skill-tag--empty {
  background: var(--el-fill-color);
  color: var(--el-text-color-placeholder);
  font-weight: 400;
  border: 1px dashed var(--el-border-color);
}

/* 分组操作条（展开全部 / 收起全部） */
.group-ops {
  display: flex;
  justify-content: flex-end;
  gap: 4px;
}
.group-ops .el-button {
  padding: 2px 6px;
  font-size: 12px;
}

/* 折叠面板：去边框、无圆角，让分组更紧凑；标题行满宽可点 */
.skill-collapse {
  border: none;
  --el-collapse-header-font-size: 12px;
}
.skill-collapse :deep(.el-collapse-item__header) {
  height: auto;
  line-height: normal;
  border-bottom: none;
  background: transparent;
  padding: 2px 2px;
}
.skill-collapse :deep(.el-collapse-item__wrap) {
  border-bottom: none;
}
.skill-collapse :deep(.el-collapse-item__content) {
  padding: 2px 0 4px;
}
/* 隐藏 el-collapse 默认箭头，改用左侧自定义箭头：点击目标更大、更精准 */
.skill-collapse :deep(.el-collapse-item__arrow) {
  display: none;
}
.skill-group__arrow {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 4px;
  color: var(--ink-text-secondary);
  transition: transform 0.18s ease, background 0.15s;
  flex-shrink: 0;
  cursor: pointer;
}
.skill-group__arrow:hover {
  background: var(--el-fill-color);
}
.skill-group__arrow.is-expanded {
  transform: rotate(90deg);
}

/* 标识编辑弹窗提示文案 */
.tag-dialog__hint {
  margin: 0 0 14px;
  font-size: 12.5px;
  color: var(--el-text-color-secondary);
  line-height: 1.6;
}

/* 操作按钮：平时弱化，悬停/选中/键盘聚焦时才提亮，避免每个卡片两个按钮的视觉噪音 */
.skill-card__actions {
  display: flex;
  gap: 0;
  opacity: 0.45;
  transition: opacity 0.15s;
}
.skill-card:hover .skill-card__actions,
.skill-card.active .skill-card__actions,
.skill-card:focus-within .skill-card__actions {
  opacity: 1;
}
.skill-card__actions :deep(.el-button + .el-button) {
  margin-left: 2px;
}

/* 停用卡片不再整体降透明度，只用删除线 + 状态点区分，保证文字可读 */
.skill-card.disabled .skill-card__name {
  text-decoration: line-through;
  color: var(--ink-text-secondary);
}

.skill-hl {
  background: #ffe58f;
  color: inherit;
  padding: 0 1px;
  border-radius: 2px;
}

.list-footer {
  flex-shrink: 0;
  padding: 6px 12px;
  border-top: 1px solid var(--el-border-color-lighter);
  font-size: 11.5px;
  color: var(--ink-text-secondary);
  background: var(--el-fill-color-lighter);
}

/* ── Middle Panel: Git Info + File Tree ────────────────────────────────────── */
.mid-header {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}
.mid-header__name {
  flex: 1;
  min-width: 0;
  font-size: 12.5px;
  font-weight: 600;
  color: var(--ink-text);
  font-family: var(--app-font-mono);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* Git 信息：三行图标列表 → 一行紧凑 chip，给文件树让出纵向空间 */
.git-info {
  padding: 8px 10px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
  min-height: 34px;
  align-items: center;
}

.git-chip {
  display: inline-flex;
  align-items: center;
  gap: 3px;
  max-width: 100%;
  padding: 2px 7px;
  border-radius: 10px;
  background: var(--el-fill-color);
  color: var(--ink-text-regular);
  font-size: 11.5px;
  line-height: 16px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  cursor: default;
}
.git-chip .el-icon {
  font-size: 12px;
  color: var(--ink-text-secondary);
}
.git-chip--muted {
  color: var(--ink-text-secondary);
  font-style: italic;
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
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  background: var(--el-fill-color-light);
}

.editor__path {
  font-size: 13px;
  color: var(--ink-text-regular);
  font-family: var(--app-font-mono);
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
  font-family: var(--app-font-mono);
  font-size: 13px;
  line-height: 1.7;
  color: var(--ink-text);
  background: #fff;
  tab-size: 2;
}

.editor__textarea::placeholder {
  color: #b8b1a0;
}

.editor__preview {
  padding: 16px 24px;
  overflow-y: auto;
  height: 100%;
  font-size: 14px;
  line-height: 1.7;
  color: var(--ink-text);
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
  border: 1px solid var(--paper-border);
  border-radius: 6px;
  padding: 4px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  min-width: 160px;
}

.ctx-menu__item {
  padding: 8px 16px;
  font-size: 13px;
  color: var(--ink-text);
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: background 0.15s;
}

.ctx-menu__item:hover {
  background: var(--el-fill-color);
}

.ctx-menu__item--danger {
  color: #f56c6c;
}

.ctx-menu__item--danger:hover {
  background: #fef0f0;
}

.ctx-menu__divider {
  height: 1px;
  background: var(--el-border-color-lighter);
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
  background: var(--el-border-color);
  border-radius: 3px;
}

.skill-list::-webkit-scrollbar-thumb:hover,
.file-tree::-webkit-scrollbar-thumb:hover,
.editor__preview::-webkit-scrollbar-thumb:hover {
  background: #b8b1a0;
}
</style>
