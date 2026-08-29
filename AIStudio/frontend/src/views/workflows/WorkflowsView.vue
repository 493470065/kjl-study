<template>
  <div class="workflows-page">
    <!-- Top area: three panels -->
    <div class="top-area">
    <!-- Left Panel: Workflow List -->
    <div class="panel panel-left">
      <div class="panel-header">
        <el-button size="small" type="primary" style="width: 100%" @click="createDialogVisible = true">
          新建工作流
        </el-button>
        <!-- 编排 → 触发器出口：工作流可绑定定时任务自动运行 -->
        <el-button size="small" text style="width: 100%; margin-top: 6px; margin-left: 0"
                   @click="router.push('/scheduled-tasks')">
          定时任务 →
        </el-button>
      </div>
      <div class="workflow-list" v-loading="loadingWorkflows">
        <div
          v-for="wf in workflows"
          :key="wf.id"
          :class="['workflow-card', { active: currentWorkflow?.id === wf.id }]"
          @click="loadWorkflow(wf)"
          @contextmenu.prevent="openContextMenu($event, wf)"
        >
          <div class="workflow-card__name">{{ wf.name }}</div>
          <div class="workflow-card__desc">{{ wf.description || '无描述' }}</div>
          <div class="workflow-card__meta">
            <span class="workflow-card__nodes">{{ nodeCounts[wf.id] || 0 }} 节点</span>
            <el-tooltip
              v-if="latestExecMap[wf.id]"
              :content="'最近执行: ' + execStatusLabel(latestExecMap[wf.id])"
              placement="top"
            >
              <span
                class="workflow-card__exec-dot"
                :style="{ background: execDotColor(latestExecMap[wf.id]) }"
              />
            </el-tooltip>
            <span class="workflow-card__time">{{ formatDate(wf.createdAt) }}</span>
            <el-tooltip :content="wf.enabled ? '已启用（点击停用）' : '已停用（点击启用）'" placement="top">
              <el-switch
                :model-value="wf.enabled"
                size="small"
                class="workflow-card__switch"
                @click.stop
                @change="toggleEnabled(wf, $event)"
              />
            </el-tooltip>
          </div>
        </div>
        <el-empty v-if="!loadingWorkflows && workflows.length === 0" description="暂无工作流" :image-size="60" />
      </div>
    </div>

    <!-- Middle: Canvas Area -->
    <div class="panel panel-middle">
      <!-- Canvas Toolbar -->
      <div class="canvas-toolbar">
        <el-button size="small" type="primary" :disabled="!currentWorkflow" @click="handleSave">
          <el-icon><Check /></el-icon> 保存
        </el-button>
        <el-button size="small" type="success" :disabled="!currentWorkflow" @click="executeDialogVisible = true">
          <el-icon><VideoPlay /></el-icon> 执行
        </el-button>
        <el-dropdown trigger="click" @command="addNode">
          <el-button size="small" :disabled="!currentWorkflow">
            添加节点<el-icon class="el-icon--right"><ArrowDown /></el-icon>
          </el-button>
          <template #dropdown>
            <el-dropdown-menu>
              <el-dropdown-item command="AGENT">Agent 节点</el-dropdown-item>
              <el-dropdown-item command="CONDITION">条件节点</el-dropdown-item>
              <el-dropdown-item command="PARALLEL">并行节点</el-dropdown-item>
              <el-dropdown-item command="MERGE">合并节点</el-dropdown-item>
            </el-dropdown-menu>
          </template>
        </el-dropdown>

        <el-divider direction="vertical" />

        <el-tooltip content="撤销 (Ctrl+Z)" placement="bottom">
          <el-button size="small" :icon="RefreshLeft" aria-label="撤销" :disabled="!canUndo" @click="undo" />
        </el-tooltip>
        <el-tooltip content="重做 (Ctrl+Shift+Z / Ctrl+Y)" placement="bottom">
          <el-button size="small" :icon="RefreshRight" aria-label="重做" :disabled="!canRedo" @click="redo" />
        </el-tooltip>

        <el-divider direction="vertical" />

        <el-tooltip content="自动整理布局" placement="bottom">
          <el-button size="small" :icon="SetUp" :disabled="!currentWorkflow" @click="autoLayout">
            自动布局
          </el-button>
        </el-tooltip>
        <el-tooltip content="缩放至适应画布" placement="bottom">
          <el-button size="small" :icon="FullScreen" :disabled="!currentWorkflow" @click="handleFitView">
            适应视图
          </el-button>
        </el-tooltip>
      </div>

      <!-- VueFlow Canvas -->
      <div class="canvas-wrapper">
        <VueFlow
          v-if="currentWorkflow"
          id="wf-canvas"
          v-model:nodes="flowNodes"
          v-model:edges="flowEdges"
          :default-viewport="{ zoom: 1, x: 0, y: 0 }"
          :min-zoom="0.2"
          :max-zoom="4"
          fit-view-on-init
          @node-click="onNodeClick"
          @edge-click="onEdgeClick"
          @pane-click="onPaneClick"
          @connect="onConnect"
        >
          <!-- START node: green circle -->
          <template #node-START="{ label }">
            <div class="custom-node node-start">
              <div class="node-circle start-circle">{{ label || 'START' }}</div>
              <Handle type="source" :position="Position.Right" />
            </div>
          </template>

          <!-- END node: red circle -->
          <template #node-END="{ label }">
            <div class="custom-node node-end">
              <Handle type="target" :position="Position.Left" />
              <div class="node-circle end-circle">{{ label || 'END' }}</div>
            </div>
          </template>

          <!-- AGENT node: blue rectangle -->
          <template #node-AGENT="{ data, label }">
            <div class="custom-node node-agent">
              <Handle type="target" :position="Position.Left" />
              <div class="node-rect agent-rect">
                <div class="node-label">{{ label || 'Agent' }}</div>
                <div class="node-sub" v-if="data.agentId">{{ data.agentId }}</div>
              </div>
              <Handle type="source" :position="Position.Right" />
            </div>
          </template>

          <!-- PARALLEL node: yellow diamond -->
          <template #node-PARALLEL="{ label }">
            <div class="custom-node node-parallel">
              <Handle type="target" :position="Position.Left" />
              <div class="node-diamond parallel-diamond">
                <span>{{ label || 'Parallel' }}</span>
              </div>
              <Handle type="source" :position="Position.Right" />
            </div>
          </template>

          <!-- CONDITION node: orange diamond -->
          <template #node-CONDITION="{ label }">
            <div class="custom-node node-condition">
              <Handle type="target" :position="Position.Left" />
              <div class="node-diamond condition-diamond">
                <span>{{ label || 'Condition' }}</span>
              </div>
              <Handle type="source" :position="Position.Right" />
            </div>
          </template>

          <!-- MERGE node: gray diamond -->
          <template #node-MERGE="{ label }">
            <div class="custom-node node-merge">
              <Handle type="target" :position="Position.Left" />
              <div class="node-diamond merge-diamond">
                <span>{{ label || 'Merge' }}</span>
              </div>
              <Handle type="source" :position="Position.Right" />
            </div>
          </template>

          <Background />
          <Controls />
          <!-- 底部执行面板展开时画布纵向空间紧张，隐藏 MiniMap 避免拥挤 -->
          <MiniMap v-if="!bottomPanelVisible" />
        </VueFlow>
        <div v-else class="canvas-placeholder">
          <el-empty description="请选择或创建一个工作流" :image-size="100" />
        </div>
      </div>
    </div>

    <!-- Right Panel: Node Properties -->
    <div class="panel panel-right">
      <div class="props-header">节点属性</div>
      <div class="props-body" v-if="selectedNode">
        <!-- START / END: read-only -->
        <template v-if="selectedNode.type === 'START' || selectedNode.type === 'END'">
          <div class="props-field">
            <label>节点 ID</label>
            <el-input :model-value="selectedNode.id" disabled size="small" />
          </div>
          <div class="props-field">
            <label>类型</label>
            <el-tag :type="selectedNode.type === 'START' ? 'success' : 'danger'" size="small">
              {{ nodeTypeLabels[selectedNode.type as NodeType] }}
            </el-tag>
          </div>
        </template>

        <!-- AGENT properties -->
        <template v-else-if="selectedNode.type === 'AGENT'">
          <div class="props-field">
            <label>Agent</label>
            <el-select
              :model-value="(selectedNode.data as any).agentId"
              placeholder="选择 Agent"
              size="small"
              style="width: 100%"
              @update:model-value="updateNodeProp('agentId', $event)"
            >
              <el-option
                v-for="agent in agents"
                :key="agent.name"
                :label="agent.name"
                :value="agent.name"
              />
            </el-select>
          </div>
          <div class="props-field">
            <label>Input Mapping</label>
            <el-input
              :model-value="(selectedNode.data as any).inputMapping"
              type="textarea"
              :rows="3"
              placeholder='JSON, 如 {"query": "$.input"}'
              size="small"
              @update:model-value="updateNodeProp('inputMapping', $event)"
            />
          </div>
          <div class="props-field">
            <label>Output Key</label>
            <el-input
              :model-value="(selectedNode.data as any).outputKey"
              placeholder="输出键名"
              size="small"
              @update:model-value="updateNodeProp('outputKey', $event)"
            />
          </div>
        </template>

        <!-- CONDITION properties -->
        <template v-else-if="selectedNode.type === 'CONDITION'">
          <div class="props-field">
            <label>判断模式</label>
            <el-select
              :model-value="(selectedNode.data as any).mode"
              placeholder="选择模式"
              size="small"
              style="width: 100%"
              @update:model-value="updateNodeProp('mode', $event)"
            >
              <el-option label="表达式 (EXPRESSION)" value="EXPRESSION" />
              <el-option label="LLM 判断" value="LLM" />
            </el-select>
          </div>
          <div class="props-field" v-if="(selectedNode.data as any).mode === 'EXPRESSION'">
            <label>表达式</label>
            <el-input
              :model-value="(selectedNode.data as any).expression"
              type="textarea"
              :rows="3"
              placeholder="条件表达式"
              size="small"
              @update:model-value="updateNodeProp('expression', $event)"
            />
          </div>
          <div class="props-field" v-if="(selectedNode.data as any).mode === 'LLM'">
            <label>LLM 描述</label>
            <el-input
              :model-value="(selectedNode.data as any).description"
              type="textarea"
              :rows="3"
              placeholder="让 LLM 判断的描述"
              size="small"
              @update:model-value="updateNodeProp('description', $event)"
            />
          </div>
          <div class="props-field">
            <label>True 节点 ID</label>
            <el-input
              :model-value="(selectedNode.data as any).trueNodeId"
              placeholder="条件为真时跳转的节点 ID"
              size="small"
              @update:model-value="updateNodeProp('trueNodeId', $event)"
            />
          </div>
          <div class="props-field">
            <label>False 节点 ID</label>
            <el-input
              :model-value="(selectedNode.data as any).falseNodeId"
              placeholder="条件为假时跳转的节点 ID"
              size="small"
              @update:model-value="updateNodeProp('falseNodeId', $event)"
            />
          </div>
        </template>

        <!-- PARALLEL properties -->
        <template v-else-if="selectedNode.type === 'PARALLEL'">
          <div class="props-field">
            <label>并行分支</label>
            <el-select
              :model-value="(selectedNode.data as any).branches || []"
              multiple
              placeholder="选择分支节点"
              size="small"
              style="width: 100%"
              @update:model-value="updateNodeProp('branches', $event)"
            >
              <el-option
                v-for="n in otherNodes"
                :key="n.id"
                :label="`${n.label || n.id} (${n.type})`"
                :value="n.id"
              />
            </el-select>
          </div>
          <div class="props-field">
            <label>合并策略</label>
            <el-select
              :model-value="(selectedNode.data as any).mergeStrategy"
              placeholder="选择策略"
              size="small"
              style="width: 100%"
              @update:model-value="updateNodeProp('mergeStrategy', $event)"
            >
              <el-option label="等待全部 (ALL)" value="ALL" />
              <el-option label="任一完成 (ANY)" value="ANY" />
            </el-select>
          </div>
        </template>

        <!-- MERGE: minimal properties -->
        <template v-else-if="selectedNode.type === 'MERGE'">
          <div class="props-field">
            <label>节点 ID</label>
            <el-input :model-value="selectedNode.id" disabled size="small" />
          </div>
        </template>
      </div>
      <div v-else class="props-empty">
        <el-empty description="选中节点查看属性" :image-size="60" />
      </div>
    </div>
    </div><!-- end top-area -->

    <!-- Context Menu -->
    <div
      v-if="contextMenuVisible"
      class="ctx-menu"
      :style="{ left: contextMenuX + 'px', top: contextMenuY + 'px' }"
    >
      <div class="ctx-menu__item" role="menuitem" tabindex="0" @click="handleContextAction('edit')" @keydown.enter.prevent="handleContextAction('edit')">
        <el-icon><Edit /></el-icon> 编辑
      </div>
      <div class="ctx-menu__divider" />
      <div class="ctx-menu__item ctx-menu__item--danger" role="menuitem" tabindex="0" @click="handleContextAction('delete')" @keydown.enter.prevent="handleContextAction('delete')">
        <el-icon><Delete /></el-icon> 删除
      </div>
      <div class="ctx-menu__divider" />
      <div class="ctx-menu__item" role="menuitem" tabindex="0" @click="handleContextAction('execute')" @keydown.enter.prevent="handleContextAction('execute')">
        <el-icon><VideoPlay /></el-icon> 执行
      </div>
    </div>

    <!-- Create Workflow Dialog -->
    <el-dialog v-model="createDialogVisible" title="新建工作流" width="440px">
      <el-form ref="createFormRef" :model="createForm" :rules="createRules" label-width="80px" @submit.prevent="submitCreate">
        <el-form-item label="名称" prop="name">
          <el-input v-model="createForm.name" placeholder="工作流名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="createForm.description" type="textarea" :rows="3" placeholder="工作流描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="createDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitCreate">创建</el-button>
      </template>
    </el-dialog>

    <!-- Edit Workflow Dialog -->
    <el-dialog v-model="editDialogVisible" title="编辑工作流" width="440px">
      <el-form label-width="80px" @submit.prevent="submitEdit">
        <el-form-item label="名称">
          <el-input v-model="editForm.name" placeholder="工作流名称" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editForm.description" type="textarea" :rows="3" placeholder="工作流描述" />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="editDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="saving" @click="submitEdit">保存</el-button>
      </template>
    </el-dialog>

    <!-- Execute Dialog -->
    <el-dialog v-model="executeDialogVisible" title="执行工作流" width="500px">
      <p style="margin-bottom: 12px; color: var(--ink-text-regular); font-size: 14px;">输入初始上下文（JSON 格式）：</p>
      <el-input
        v-model="executeContext"
        type="textarea"
        :rows="8"
        placeholder='{"key": "value"}'
        style="font-family: var(--app-font-mono);"
      />
      <template #footer>
        <el-button @click="executeDialogVisible = false">取消</el-button>
        <el-button type="primary" :loading="executing" @click="handleExecute">执行</el-button>
      </template>
    </el-dialog>

    <!-- Execution Detail Dialog -->
    <el-dialog
      v-model="executionDetailVisible"
      :title="`执行明细 #${selectedExecution?.id || ''}`"
      width="860px"
      destroy-on-close
      @close="onDetailDialogClose"
    >
      <el-tabs v-if="selectedExecution" type="border-card">
        <!-- Tab 1: Basic Info -->
        <el-tab-pane label="基本信息">
          <el-descriptions :column="2" border size="small">
            <el-descriptions-item label="执行 ID">{{ selectedExecution.id }}</el-descriptions-item>
            <el-descriptions-item label="工作流 ID">{{ selectedExecution.workflowDefinitionId }}</el-descriptions-item>
            <el-descriptions-item label="状态">
              <el-tag :type="execStatusType(selectedExecution.status)" size="small">{{ selectedExecution.status }}</el-tag>
            </el-descriptions-item>
            <el-descriptions-item label="启动人">{{ selectedExecution.startedBy || '-' }}</el-descriptions-item>
            <el-descriptions-item label="开始时间">{{ formatDate(selectedExecution.startedAt) }}</el-descriptions-item>
            <el-descriptions-item label="完成时间">{{ formatDate(selectedExecution.completedAt) }}</el-descriptions-item>
            <el-descriptions-item label="耗时">{{ formatDuration(selectedExecution.startedAt, selectedExecution.completedAt) }}</el-descriptions-item>
          </el-descriptions>
          <div v-if="selectedExecution.error" style="margin-top: 12px;">
            <el-alert :title="selectedExecution.error" type="error" :closable="false" show-icon />
          </div>
        </el-tab-pane>

        <!-- Tab 2: Execution Steps -->
        <el-tab-pane label="执行步骤">
          <el-timeline v-if="executionNodes.length > 0">
            <el-timeline-item
              v-for="node in executionNodes"
              :key="node.id"
              :timestamp="formatDate(node.startedAt)"
              :color="nodeTypeColor(node.nodeType)"
            >
              <div class="exec-step">
                <div class="exec-step__header">
                  <span class="exec-step__name">{{ node.nodeName || node.nodeId }}</span>
                  <el-tag
                    :type="node.status === 'SUCCESS' ? 'success' : node.status === 'FAILED' ? 'danger' : node.status === 'RUNNING' ? 'warning' : 'info'"
                    size="small"
                    :class="{ 'is-loading': node.status === 'RUNNING' }"
                  >
                    {{ node.status === 'RUNNING' ? '执行中' : node.status === 'SUCCESS' ? '完成' : node.status === 'FAILED' ? '失败' : '跳过' }}
                  </el-tag>
                  <span class="exec-step__duration">{{ formatDuration(node.startedAt, node.completedAt) }}</span>
                  <el-tag v-if="node.nodeType" size="small" type="info" style="margin-left: 4px;">{{ node.nodeType }}</el-tag>
                </div>
                <div v-if="node.agentId" class="exec-step__agent">
                  Agent: {{ node.agentId }}
                </div>
                <div v-if="node.output" class="exec-step__output">
                  <el-collapse>
                    <el-collapse-item title="查看输出">
                      <pre class="exec-step__pre">{{ node.output }}</pre>
                    </el-collapse-item>
                  </el-collapse>
                </div>
                <div v-if="node.error" class="exec-step__error">
                  {{ node.error }}
                </div>
              </div>
            </el-timeline-item>
          </el-timeline>
          <el-empty v-else description="暂无执行步骤" :image-size="60" />
        </el-tab-pane>

        <!-- Tab 3: Process Files -->
        <el-tab-pane label="过程文件">
          <el-collapse v-if="executionNodes.filter((n: any) => n.nodeType === 'AGENT' && n.output).length > 0">
            <el-collapse-item
              v-for="node in executionNodes.filter((n: any) => n.nodeType === 'AGENT' && n.output)"
              :key="'artifact-' + node.id"
              :title="node.nodeName || node.nodeId"
            >
              <pre class="exec-step__pre" style="max-height: 400px; overflow-y: auto;">{{ node.output }}</pre>
            </el-collapse-item>
          </el-collapse>
          <el-empty v-else description="暂无过程文件" :image-size="60" />
        </el-tab-pane>

        <!-- Tab 4: Changed Files (placeholder) -->
        <el-tab-pane label="变更文件">
          <el-empty description="暂未实现" :image-size="60" />
        </el-tab-pane>
      </el-tabs>
    </el-dialog>

    <!-- Bottom Panel: Execution Records -->
    <div class="bottom-panel" v-if="bottomPanelVisible">
      <div class="bottom-panel__header">
        <span class="bottom-panel__title">执行记录</span>
        <el-button link size="small" @click="bottomPanelVisible = false">收起</el-button>
      </div>
      <div class="bottom-panel__body" v-loading="loadingExecutions">
        <el-table :data="executions" stripe size="small" v-if="executions.length > 0">
          <el-table-column type="expand">
            <template #default="{ row }">
              <div style="padding: 8px 16px;">
                <div v-if="row.context" style="margin-bottom: 8px;">
                  <strong>上下文:</strong>
                  <pre style="background: var(--el-fill-color); padding: 8px; border-radius: 4px; font-size: 12px; overflow-x: auto;">{{ typeof row.context === 'string' ? row.context : JSON.stringify(row.context, null, 2) }}</pre>
                </div>
                <div v-if="row.result">
                  <strong>结果:</strong>
                  <pre style="background: var(--el-fill-color); padding: 8px; border-radius: 4px; font-size: 12px; overflow-x: auto;">{{ typeof row.result === 'string' ? row.result : JSON.stringify(row.result, null, 2) }}</pre>
                </div>
                <div v-if="row.error">
                  <strong style="color: #f56c6c;">错误:</strong>
                  <pre style="background: #fef0f0; padding: 8px; border-radius: 4px; font-size: 12px; color: #f56c6c; overflow-x: auto;">{{ row.error }}</pre>
                </div>
              </div>
            </template>
          </el-table-column>
          <el-table-column prop="id" label="ID" width="60" />
          <el-table-column prop="workflowId" label="工作流 ID" width="90" />
          <el-table-column label="状态" width="90">
            <template #default="{ row }">
              <el-tag :type="execStatusType(row.status)" size="small">{{ execStatusLabel(row.status) }}</el-tag>
            </template>
          </el-table-column>
          <el-table-column label="开始时间" width="160">
            <template #default="{ row }">{{ formatDate(row.startedAt) }}</template>
          </el-table-column>
          <el-table-column label="完成时间" width="160">
            <template #default="{ row }">{{ formatDate(row.completedAt) }}</template>
          </el-table-column>
          <el-table-column label="操作" width="120">
            <template #default="{ row }">
              <el-button type="primary" link size="small" @click="openExecutionDetail(row)">明细</el-button>
              <el-button
                v-if="row.status === 'RUNNING'"
                type="danger"
                link
                size="small"
                @click="handleCancelExec(row)"
              >取消</el-button>
            </template>
          </el-table-column>
        </el-table>
        <el-empty v-else-if="!loadingExecutions" description="暂无执行记录" :image-size="40" />
      </div>
    </div>

    <!-- Bottom Panel Toggle (when collapsed) -->
    <div class="bottom-panel-toggle" v-if="!bottomPanelVisible && currentWorkflow">
      <el-button link size="small" @click="bottomPanelVisible = true; loadExecutions()">
        展开执行记录
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from 'vue'
import { ElMessage } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { Check, VideoPlay, ArrowDown, Edit, Delete, RefreshLeft, RefreshRight, SetUp, FullScreen } from '@element-plus/icons-vue'
import { useRouter } from 'vue-router'
import { useConfirmDelete } from '@/composables/useConfirmDelete'
import { useStatusTag } from '@/composables/useStatusTag'

const { confirmDelete } = useConfirmDelete()
const router = useRouter()
import { VueFlow, Position, Handle, useVueFlow } from '@vue-flow/core'
import { Background } from '@vue-flow/background'
import { Controls } from '@vue-flow/controls'
import { MiniMap } from '@vue-flow/minimap'
import '@vue-flow/core/dist/style.css'
import '@vue-flow/core/dist/theme-default.css'
import '@vue-flow/controls/dist/style.css'
import '@vue-flow/minimap/dist/style.css'
import {
  getWorkflows,
  getWorkflow,
  createWorkflow,
  updateWorkflow,
  deleteWorkflow,
  executeWorkflow,
  getExecutions,
  getExecution,
  cancelExecution,
  getExecutionNodes
} from '@/api/workflow'
import http from '@/api/http'
import { formatDateTime } from '@/utils/format'

// ── Types ──────────────────────────────────────────────────────────────────────
type NodeType = 'START' | 'END' | 'AGENT' | 'PARALLEL' | 'CONDITION' | 'MERGE'

interface WorkflowItem {
  id: number
  name: string
  description: string
  definitionJson: string
  enabled: boolean
  createdAt: string
}

// ── State ──────────────────────────────────────────────────────────────────────
const currentWorkflow = ref<WorkflowItem | null>(null)
const workflows = ref<WorkflowItem[]>([])
const loadingWorkflows = ref(false)

const flowNodes = ref<any[]>([])
const flowEdges = ref<any[]>([])

const agents = ref<any[]>([])

const selectedNodeId = ref<string | null>(null)
const selectedNode = computed(() => flowNodes.value.find(n => n.id === selectedNodeId.value) || null)

const otherNodes = computed(() =>
  flowNodes.value.filter(n => n.id !== selectedNodeId.value && n.type !== 'START' && n.type !== 'END')
)

const nodeTypeLabels: Record<NodeType, string> = {
  START: '开始',
  END: '结束',
  AGENT: 'Agent',
  PARALLEL: '并行',
  CONDITION: '条件',
  MERGE: '合并'
}

// Execution panel
const executions = ref<any[]>([])
const loadingExecutions = ref(false)
const bottomPanelVisible = ref(false)

// Execution detail dialog
const executionDetailVisible = ref(false)
const selectedExecution = ref<any>(null)
const executionNodes = ref<any[]>([])
let executionRefreshTimer: number | null = null

// Dialogs
const createDialogVisible = ref(false)
const createForm = ref({ name: '', description: '' })
const createFormRef = ref<FormInstance>()
const createRules: FormRules = {
  name: [{ required: true, message: '请输入工作流名称', trigger: 'blur' }]
}
const editDialogVisible = ref(false)
const editForm = ref({ name: '', description: '' })
const executeDialogVisible = ref(false)
const executeContext = ref('{}')
const saving = ref(false)
const executing = ref(false)

// Context menu
const contextMenuVisible = ref(false)
const contextMenuX = ref(0)
const contextMenuY = ref(0)
const contextMenuWorkflow = ref<WorkflowItem | null>(null)

// Node ID counter
let nodeIdCounter = 0

// ── VueFlow API（适应视图）──────────────────────────────────────────────────────
const { fitView } = useVueFlow('wf-canvas')

function handleFitView() {
  fitView({ padding: 0.2, duration: 300 })
}

// ── 撤销/重做历史栈 ─────────────────────────────────────────────────────────────
const history = ref<string[]>([])
const historyIndex = ref(-1)
let restoreFlag = false
let historyTimer: number | null = null

const canUndo = computed(() => historyIndex.value > 0)
const canRedo = computed(() => historyIndex.value < history.value.length - 1)

function canvasSnapshot(): string {
  return JSON.stringify({ n: flowNodes.value, e: flowEdges.value })
}

function pushSnapshot() {
  const s = canvasSnapshot()
  if (history.value[historyIndex.value] === s) return
  // 截断当前指针之后的"重做"分支
  history.value = history.value.slice(0, historyIndex.value + 1)
  history.value.push(s)
  if (history.value.length > 50) history.value.shift()
  historyIndex.value = history.value.length - 1
}

function resetHistory() {
  if (historyTimer) { window.clearTimeout(historyTimer); historyTimer = null }
  history.value = [canvasSnapshot()]
  historyIndex.value = 0
}

// 画布任何变更（增删节点/连线/属性编辑/拖拽）防抖后记录快照
watch([flowNodes, flowEdges], () => {
  if (restoreFlag) return
  if (historyTimer) window.clearTimeout(historyTimer)
  historyTimer = window.setTimeout(pushSnapshot, 400)
}, { deep: true })

function applySnapshot(s: string) {
  if (historyTimer) { window.clearTimeout(historyTimer); historyTimer = null }
  restoreFlag = true
  try {
    const obj = JSON.parse(s)
    flowNodes.value = obj.n || []
    flowEdges.value = obj.e || []
    selectedNodeId.value = null
  } finally {
    nextTick(() => { restoreFlag = false })
  }
}

function undo() {
  if (!canUndo.value) return
  historyIndex.value--
  applySnapshot(history.value[historyIndex.value])
}

function redo() {
  if (!canRedo.value) return
  historyIndex.value++
  applySnapshot(history.value[historyIndex.value])
}

// ── 自动布局（分层拓扑，无外部依赖）────────────────────────────────────────────
function autoLayout() {
  const nodes = flowNodes.value
  if (nodes.length === 0) return
  const edges = flowEdges.value

  const outMap = new Map<string, string[]>()
  const inDeg = new Map<string, number>()
  nodes.forEach(n => { outMap.set(n.id, []); inDeg.set(n.id, 0) })
  edges.forEach(e => {
    if (outMap.has(e.source) && inDeg.has(e.target)) {
      outMap.get(e.source)!.push(e.target)
      inDeg.set(e.target, (inDeg.get(e.target) || 0) + 1)
    }
  })

  // Kahn 拓扑排序求最长路径分层（入队时所有前驱已处理完，depth 即最长路径）
  const depth = new Map<string, number>()
  const queue: string[] = []
  const indegCopy = new Map(inDeg)
  nodes.forEach(n => {
    if ((inDeg.get(n.id) || 0) === 0) { queue.push(n.id); depth.set(n.id, 0) }
  })
  if (queue.length === 0) { queue.push(nodes[0].id); depth.set(nodes[0].id, 0) } // 全环兜底
  while (queue.length) {
    const id = queue.shift()!
    const d = depth.get(id) || 0
    for (const nxt of outMap.get(id) || []) {
      depth.set(nxt, Math.max(depth.get(nxt) ?? 0, d + 1))
      indegCopy.set(nxt, (indegCopy.get(nxt) || 0) - 1)
      if (indegCopy.get(nxt) === 0) queue.push(nxt)
    }
  }
  // 环中未访问节点追加到最后一层
  let maxDepth = 0
  depth.forEach(d => { if (d > maxDepth) maxDepth = d })
  nodes.forEach(n => { if (!depth.has(n.id)) depth.set(n.id, ++maxDepth) })

  // 按层分组并均匀分布
  const layers = new Map<number, string[]>()
  nodes.forEach(n => {
    const d = depth.get(n.id)!
    if (!layers.has(d)) layers.set(d, [])
    layers.get(d)!.push(n.id)
  })
  const X_GAP = 220, Y_GAP = 130
  const positions = new Map<string, { x: number; y: number }>()
  ;[...layers.keys()].sort((a, b) => a - b).forEach(d => {
    const ids = layers.get(d)!
    const totalH = (ids.length - 1) * Y_GAP
    ids.forEach((id, i) => {
      positions.set(id, { x: 80 + d * X_GAP, y: 260 - totalH / 2 + i * Y_GAP })
    })
  })
  flowNodes.value = flowNodes.value.map(n => ({ ...n, position: positions.get(n.id) || n.position }))
  nextTick(() => handleFitView())
}

// ── 卡片信息：节点数 / 最近执行状态 ─────────────────────────────────────────────
const nodeCounts = computed(() => {
  const m: Record<number, number> = {}
  workflows.value.forEach(w => {
    try {
      const def = w.definitionJson ? JSON.parse(w.definitionJson) : null
      m[w.id] = def?.nodes?.length || 0
    } catch { m[w.id] = 0 }
  })
  return m
})

// executions 已按 startedAt 倒序，每个工作流取第一条即最近一次
const latestExecMap = computed(() => {
  const m: Record<number, string> = {}
  for (const ex of executions.value) {
    if (ex.workflowId != null && !(ex.workflowId in m)) m[ex.workflowId] = ex.status
  }
  return m
})

function execDotColor(status: string): string {
  const map: Record<string, string> = { SUCCESS: '#67c23a', RUNNING: '#e6a23c', FAILED: '#f56c6c' }
  return map[status] || 'var(--ink-text-secondary)'
}

/* execStatusLabel 已由 useStatusTag 统一提供 */

async function toggleEnabled(wf: WorkflowItem, val: boolean | string | number) {
  try {
    await updateWorkflow(wf.id, {
      name: wf.name,
      description: wf.description,
      definitionJson: wf.definitionJson,
      enabled: !!val
    })
    wf.enabled = !!val
    ElMessage.success(val ? '已启用' : '已停用')
  } catch {
    ElMessage.error('更新启用状态失败')
  }
}

// ── Load Data ──────────────────────────────────────────────────────────────────
async function loadWorkflows() {
  loadingWorkflows.value = true
  try {
    const res = await getWorkflows()
    workflows.value = res.data as WorkflowItem[]
  } catch {
    ElMessage.error('加载工作流列表失败')
  } finally {
    loadingWorkflows.value = false
  }
}

async function loadAgents() {
  try {
    const res = await http.get('/agents/config')
    agents.value = res.data as any[]
  } catch {
    ElMessage.error('加载 Agent 列表失败')
  }
}

async function loadWorkflow(wf: WorkflowItem) {
  try {
    const res = await getWorkflow(wf.id)
    const detail = res.data as WorkflowItem
    currentWorkflow.value = detail
    definitionToCanvas(detail.definitionJson)
    selectedNodeId.value = null
    loadExecutions()
  } catch {
    ElMessage.error('加载工作流详情失败')
  }
}

function loadExecutions() {
  loadingExecutions.value = true
  getExecutions()
    .then(res => {
      executions.value = (res.data || []) as any[]
    })
    .catch(() => {
      executions.value = []
    })
    .finally(() => {
      loadingExecutions.value = false
    })
}

// ── Canvas Conversion ──────────────────────────────────────────────────────────
function definitionToCanvas(json: string) {
  if (!json) {
    flowNodes.value = [
      { id: 'start', type: 'START', label: 'START', position: { x: 80, y: 200 }, data: {} },
      { id: 'end', type: 'END', label: 'END', position: { x: 700, y: 200 }, data: {} }
    ]
    flowEdges.value = []
    nodeIdCounter = 0
    resetHistory()
    return
  }

    try {
      const def = JSON.parse(json)
      flowNodes.value = (def.nodes || []).map((n: any) => ({
        id: n.id,
        type: n.type,
        label: n.label || n.id,
        position: n.position || { x: 0, y: 0 },
        data: n.data || {}
      }))
      // 仅保留带有效 source/target 的连接；历史上存在 source/target 为
      // undefined 的占位边（id 形如 e-undefined-undefined-N），会导致连线不渲染。
      flowEdges.value = (def.connections || def.edges || [])
        .filter((c: any) => c && c.source && c.target)
        .map((c: any, idx: number) => ({
          id: c.id || `e-${c.source}-${c.target}-${idx}`,
          source: c.source,
          target: c.target,
          sourceHandle: c.sourceHandle ?? null,
          targetHandle: c.targetHandle ?? null,
          animated: true
        }))
      nodeIdCounter = (def.nodes || []).length
      resetHistory()
  } catch {
    flowNodes.value = [
      { id: 'start', type: 'START', label: 'START', position: { x: 80, y: 200 }, data: {} },
      { id: 'end', type: 'END', label: 'END', position: { x: 700, y: 200 }, data: {} }
    ]
    flowEdges.value = []
    nodeIdCounter = 0
    resetHistory()
  }
}

function canvasToDefinition(): string {
  const nodes = flowNodes.value.map(n => ({
    id: n.id,
    type: n.type,
    label: n.label,
    position: n.position,
    data: n.data
  }))
  const connections = flowEdges.value.map(e => ({
    id: e.id,
    source: e.source,
    target: e.target,
    sourceHandle: e.sourceHandle,
    targetHandle: e.targetHandle
  }))
  return JSON.stringify({ nodes, connections }, null, 2)
}

// ── Node Operations ────────────────────────────────────────────────────────────
function getNodeCount(type: NodeType): number {
  return flowNodes.value.filter(n => n.type === type).length
}

function addNode(type: NodeType) {
  nodeIdCounter++
  const count = getNodeCount(type) + 1
  const id = `${type.toLowerCase()}-${nodeIdCounter}`
  const baseY = 100 + getNodeCount(type) * 120

  const baseNode: any = {
    id,
    type,
    label: `${nodeTypeLabels[type]} ${count}`,
    position: { x: 300, y: baseY },
    data: {}
  }

  if (type === 'CONDITION') {
    baseNode.data = { mode: 'EXPRESSION', expression: '', description: '', trueNodeId: '', falseNodeId: '' }
  } else if (type === 'PARALLEL') {
    baseNode.data = { branches: [], mergeStrategy: 'ALL' }
  } else if (type === 'AGENT') {
    baseNode.data = { agentId: '', inputMapping: '', outputKey: '' }
  } else if (type === 'MERGE') {
    baseNode.data = {}
  }

  flowNodes.value = [...flowNodes.value, baseNode]
}

function onNodeClick({ node }: any) {
  selectedNodeId.value = node.id
}

function onEdgeClick() {
  selectedNodeId.value = null
}

function onPaneClick() {
  selectedNodeId.value = null
}

// 用户从一个节点的 Handle 拖拽到另一个节点时触发，追加一条连接线
function onConnect(params: any) {
  if (!params || !params.source || !params.target) return
  const newEdge = {
    id: `e-${params.source}-${params.target}-${flowEdges.value.length}`,
    source: params.source,
    target: params.target,
    sourceHandle: params.sourceHandle ?? null,
    targetHandle: params.targetHandle ?? null,
    animated: true
  }
  // 避免重复连接
  const exists = flowEdges.value.some(
    (e: any) => e.source === newEdge.source && e.target === newEdge.target
  )
  if (!exists) {
    flowEdges.value = [...flowEdges.value, newEdge]
  }
}

function updateNodeProp(prop: string, value: any) {
  if (!selectedNodeId.value) return
  flowNodes.value = flowNodes.value.map(n => {
    if (n.id === selectedNodeId.value) {
      return { ...n, data: { ...n.data, [prop]: value } }
    }
    return n
  })
}

// ── Save ───────────────────────────────────────────────────────────────────────
async function handleSave() {
  if (!currentWorkflow.value) return
  saving.value = true
  try {
    const definitionJson = canvasToDefinition()
    await updateWorkflow(currentWorkflow.value.id, {
      name: currentWorkflow.value.name,
      description: currentWorkflow.value.description,
      definitionJson,
      enabled: currentWorkflow.value.enabled ?? true
    })
    ElMessage.success('保存成功')
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// ── Create / Edit Workflow ─────────────────────────────────────────────────────
async function submitCreate() {
  const valid = await createFormRef.value?.validate().catch(() => false)
  if (!valid) return
  saving.value = true
  try {
    const res = await createWorkflow({
      name: createForm.value.name.trim(),
      description: createForm.value.description.trim(),
      definitionJson: JSON.stringify({
        nodes: [
          { id: 'start', type: 'START', label: 'START', position: { x: 80, y: 200 }, data: {} },
          { id: 'end', type: 'END', label: 'END', position: { x: 700, y: 200 }, data: {} }
        ],
        connections: []
      })
    })
    ElMessage.success('创建成功')
    createDialogVisible.value = false
    createForm.value = { name: '', description: '' }
    await loadWorkflows()
    const newWf = res.data as WorkflowItem
    if (newWf?.id) {
      await loadWorkflow(newWf)
    }
  } catch {
    ElMessage.error('创建失败')
  } finally {
    saving.value = false
  }
}

async function submitEdit() {
  if (!currentWorkflow.value) return
  saving.value = true
  try {
    await updateWorkflow(currentWorkflow.value.id, {
      name: editForm.value.name.trim(),
      description: editForm.value.description.trim(),
      definitionJson: canvasToDefinition(),
      enabled: currentWorkflow.value.enabled ?? true
    })
    ElMessage.success('保存成功')
    editDialogVisible.value = false
    currentWorkflow.value.name = editForm.value.name.trim()
    currentWorkflow.value.description = editForm.value.description.trim()
    await loadWorkflows()
  } catch {
    ElMessage.error('保存失败')
  } finally {
    saving.value = false
  }
}

// ── Execute ────────────────────────────────────────────────────────────────────
async function handleExecute() {
  if (!currentWorkflow.value) return
  executing.value = true
  try {
    let ctx: Record<string, any> = {}
    try {
      ctx = JSON.parse(executeContext.value || '{}')
    } catch {
      ElMessage.error('初始上下文 JSON 格式错误')
      executing.value = false
      return
    }
    await executeWorkflow(currentWorkflow.value.id, ctx)
    ElMessage.success('执行已启动')
    executeDialogVisible.value = false
    bottomPanelVisible.value = true
    loadExecutions()
  } catch {
    ElMessage.error('执行失败')
  } finally {
    executing.value = false
  }
}

async function handleCancelExec(row: any) {
  try {
    await cancelExecution(row.id)
    ElMessage.success('已取消')
    loadExecutions()
  } catch {
    ElMessage.error('取消失败')
  }
}

// ── Execution Detail ──────────────────────────────────────────────────────────
async function openExecutionDetail(execution: any) {
  selectedExecution.value = execution
  executionDetailVisible.value = true
  await refreshExecutionDetail()
  startExecutionAutoRefresh()
}

async function refreshExecutionDetail() {
  if (!selectedExecution.value) return
  try {
    const [execRes, nodesRes] = await Promise.all([
      getExecution(selectedExecution.value.id),
      getExecutionNodes(selectedExecution.value.id)
    ])
    selectedExecution.value = (execRes as any).data || execRes
    executionNodes.value = ((nodesRes as any).data || nodesRes) as any[]
    const status = selectedExecution.value?.status
    if (status === 'SUCCESS' || status === 'FAILED' || status === 'CANCELLED') {
      stopExecutionAutoRefresh()
    }
  } catch {
    // silently fail
  }
}

function startExecutionAutoRefresh() {
  stopExecutionAutoRefresh()
  executionRefreshTimer = window.setInterval(refreshExecutionDetail, 3000)
}

function stopExecutionAutoRefresh() {
  if (executionRefreshTimer) {
    clearInterval(executionRefreshTimer)
    executionRefreshTimer = null
  }
}

function formatDuration(start: string, end: string | null): string {
  if (!start) return '-'
  const s = new Date(start).getTime()
  const e = end ? new Date(end).getTime() : Date.now()
  const diff = Math.floor((e - s) / 1000)
  if (diff < 60) return `${diff}s`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ${diff % 60}s`
  return `${Math.floor(diff / 3600)}h ${Math.floor((diff % 3600) / 60)}m`
}

function nodeTypeColor(type: string): string {
  const map: Record<string, string> = { START: '#67c23a', END: '#f56c6c', AGENT: 'var(--el-color-primary)', CONDITION: '#e6a23c', MERGE: 'var(--ink-text-secondary)', PARALLEL: '#b88230' }
  return map[type] || 'var(--ink-text-secondary)'
}

function onDetailDialogClose() {
  stopExecutionAutoRefresh()
  selectedExecution.value = null
  executionNodes.value = []
}

// ── Context Menu ───────────────────────────────────────────────────────────────
function openContextMenu(e: MouseEvent, wf: WorkflowItem) {
  contextMenuWorkflow.value = wf
  contextMenuX.value = e.clientX
  contextMenuY.value = e.clientY
  contextMenuVisible.value = true
}

async function handleContextAction(action: string) {
  const wf = contextMenuWorkflow.value
  contextMenuVisible.value = false
  if (!wf) return

  if (action === 'edit') {
    editForm.value = { name: wf.name, description: wf.description }
    editDialogVisible.value = true
  } else if (action === 'delete') {
    if (!await confirmDelete(`工作流 "${wf.name}"`, '删除工作流')) return
    try {
      await deleteWorkflow(wf.id)
      ElMessage.success('已删除')
      if (currentWorkflow.value?.id === wf.id) {
        currentWorkflow.value = null
        flowNodes.value = []
        flowEdges.value = []
      }
      await loadWorkflows()
    } catch {
      ElMessage.error('删除失败，请稍后重试')
    }
  } else if (action === 'execute') {
    currentWorkflow.value = wf
    await loadWorkflow(wf)
    executeDialogVisible.value = true
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────
// 状态徽章统一走全站映射（useStatusTag）
const { statusType: tagTypeOf, statusLabel: execStatusLabel } = useStatusTag()
function execStatusType(status: string) {
  return tagTypeOf(status)
}

function formatDate(dateStr?: string): string {
  return dateStr ? formatDateTime(dateStr) : '-'
}

// ── Keyboard ───────────────────────────────────────────────────────────────────
let keydownHandler: ((e: KeyboardEvent) => void) | null = null

function handleKeydown(e: KeyboardEvent) {
  // 撤销/重做：Ctrl+Z / Ctrl+Shift+Z / Ctrl+Y（输入框内不拦截，交给浏览器原生行为）
  const target = e.target as HTMLElement
  const inField = target.tagName === 'INPUT' || target.tagName === 'TEXTAREA'
  if ((e.ctrlKey || e.metaKey) && !inField) {
    if (e.key === 'z' || e.key === 'Z') {
      e.preventDefault()
      if (e.shiftKey) redo(); else undo()
      return
    }
    if (e.key === 'y' || e.key === 'Y') {
      e.preventDefault()
      redo()
      return
    }
  }
  if ((e.key === 'Delete' || e.key === 'Backspace') && selectedNodeId.value) {
    const target = e.target as HTMLElement
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA') return
    flowNodes.value = flowNodes.value.filter(n => n.id !== selectedNodeId.value)
    flowEdges.value = flowEdges.value.filter(
      e => e.source !== selectedNodeId.value && e.target !== selectedNodeId.value
    )
    selectedNodeId.value = null
  }
}

// ── Document Click ─────────────────────────────────────────────────────────────
function onDocClick() {
  contextMenuVisible.value = false
}

// ── Lifecycle ──────────────────────────────────────────────────────────────────
onMounted(() => {
  loadWorkflows()
  loadAgents()
  loadExecutions() // 卡片上的"最近执行状态"需要
  document.addEventListener('click', onDocClick)
  keydownHandler = handleKeydown
  document.addEventListener('keydown', keydownHandler)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', onDocClick)
  if (keydownHandler) {
    document.removeEventListener('keydown', keydownHandler)
  }
  stopExecutionAutoRefresh()
})
</script>

<style scoped>
/* ── Page Layout ─────────────────────────────────────────────────────────────── */
.workflows-page {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 110px);
  min-height: 500px;
}

.top-area {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: 0;
}

.panel-left {
  width: 250px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid var(--paper-border);
  border-radius: 6px 0 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-middle {
  flex: 1;
  min-width: 400px;
  background: #fff;
  border-top: 1px solid var(--paper-border);
  border-right: 1px solid var(--paper-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.panel-right {
  width: 300px;
  flex-shrink: 0;
  background: #fff;
  border: 1px solid var(--paper-border);
  border-radius: 0 6px 0 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

/* ── Left Panel: Workflow List ───────────────────────────────────────────────── */
.panel-header {
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
}

.workflow-list {
  flex: 1;
  overflow-y: auto;
  padding: 8px;
}

.workflow-card {
  padding: 10px 12px;
  border-radius: 6px;
  cursor: pointer;
  border: 1px solid transparent;
  margin-bottom: 4px;
  transition: background 0.15s, border-color 0.15s;
}

.workflow-card:hover {
  background: var(--el-fill-color);
}

.workflow-card.active {
  background: var(--el-color-primary-light-9);
  border-color: var(--el-color-primary);
}

.workflow-card__name {
  font-weight: 600;
  font-size: 13px;
  color: var(--ink-text);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-card__desc {
  font-size: 12px;
  color: var(--ink-text-secondary);
  margin-top: 4px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-card__meta {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-top: 6px;
}

.workflow-card__nodes {
  font-size: 11px;
  color: var(--ink-text-secondary);
  background: #f0f2f5;
  border-radius: 8px;
  padding: 1px 6px;
  flex-shrink: 0;
}

.workflow-card__exec-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  flex-shrink: 0;
  cursor: default;
}

.workflow-card__time {
  font-size: 11px;
  color: #b8b1a0;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.workflow-card__switch {
  flex-shrink: 0;
  transform: scale(0.8);
}

/* ── Canvas Toolbar ──────────────────────────────────────────────────────────── */
.canvas-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  background: var(--el-fill-color-light);
}

.canvas-wrapper {
  flex: 1;
  position: relative;
  overflow: hidden;
}

.canvas-placeholder {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

/* ── Right Panel: Properties ─────────────────────────────────────────────────── */
.props-header {
  padding: 10px 12px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-weight: 600;
  font-size: 14px;
  color: var(--ink-text);
  flex-shrink: 0;
}

.props-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
}

.props-field {
  margin-bottom: 14px;
}

.props-field label {
  display: block;
  font-size: 12px;
  color: var(--ink-text-secondary);
  margin-bottom: 4px;
}

.props-empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* ── Bottom Panel ────────────────────────────────────────────────────────────── */
.bottom-panel {
  width: 100%;
  height: 250px;
  flex-shrink: 0;
  background: #fff;
  border-top: 2px solid var(--paper-border);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.bottom-panel__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 6px 16px;
  border-bottom: 1px solid var(--el-border-color-lighter);
  flex-shrink: 0;
  background: var(--el-fill-color-light);
}

.bottom-panel__title {
  font-weight: 600;
  font-size: 13px;
  color: var(--ink-text);
}

.bottom-panel__body {
  flex: 1;
  overflow-y: auto;
  padding: 8px 12px;
}

.bottom-panel-toggle {
  width: 100%;
  flex-shrink: 0;
  background: #fff;
  border-top: 1px solid var(--paper-border);
  padding: 4px 16px;
  text-align: left;
}

/* ── Custom Nodes ────────────────────────────────────────────────────────────── */
:deep(.vue-flow__node) {
  cursor: pointer;
}

:deep(.vue-flow__node.selected .node-circle),
:deep(.vue-flow__node.selected .node-rect),
:deep(.vue-flow__node.selected .node-diamond) {
  box-shadow: 0 0 0 3px rgba(64, 158, 255, 0.4);
}

.custom-node {
  display: flex;
  align-items: center;
  justify-content: center;
}

.node-circle {
  width: 56px;
  height: 56px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 700;
  color: #fff;
  text-align: center;
  user-select: none;
  line-height: 1.2;
}

.start-circle {
  background: linear-gradient(135deg, #67c23a, #529b2e);
  border: 2px solid #529b2e;
}

.end-circle {
  background: linear-gradient(135deg, #f56c6c, #c45656);
  border: 2px solid #c45656;
}

.node-rect {
  padding: 10px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  text-align: center;
  min-width: 100px;
  user-select: none;
}

.agent-rect {
  background: linear-gradient(135deg, var(--el-color-primary), var(--viz-indigo));
  border: 2px solid var(--viz-indigo);
}

.agent-rect .node-sub {
  font-size: 10px;
  font-weight: 400;
  opacity: 0.85;
  margin-top: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  max-width: 120px;
}

.node-diamond {
  width: 90px;
  height: 90px;
  transform: rotate(45deg);
  display: flex;
  align-items: center;
  justify-content: center;
  user-select: none;
  border: 2px solid;
}

.node-diamond span {
  transform: rotate(-45deg);
  font-size: 11px;
  font-weight: 600;
  color: #fff;
  white-space: nowrap;
  text-align: center;
}

.parallel-diamond {
  background: linear-gradient(135deg, #e6a23c, #b88230);
  border-color: #b88230;
}

.condition-diamond {
  background: linear-gradient(135deg, #f56c6c, #c45656);
  border-color: #c45656;
}

.merge-diamond {
  background: linear-gradient(135deg, var(--ink-text-secondary), var(--viz-gray));
  border-color: var(--viz-gray);
}

/* ── Handle Styling ──────────────────────────────────────────────────────────── */
:deep(.vue-flow__handle) {
  width: 10px;
  height: 10px;
  background: var(--el-color-primary);
  border: 2px solid #fff;
  border-radius: 50%;
}

/* ── Context Menu ────────────────────────────────────────────────────────────── */
.ctx-menu {
  position: fixed;
  z-index: 9999;
  background: #fff;
  border: 1px solid var(--paper-border);
  border-radius: 6px;
  padding: 4px 0;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.12);
  min-width: 150px;
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

/* ── Scrollbar ───────────────────────────────────────────────────────────────── */
.workflow-list::-webkit-scrollbar,
.props-body::-webkit-scrollbar,
.bottom-panel__body::-webkit-scrollbar {
  width: 5px;
}

.workflow-list::-webkit-scrollbar-thumb,
.props-body::-webkit-scrollbar-thumb,
.bottom-panel__body::-webkit-scrollbar-thumb {
  background: var(--el-border-color);
  border-radius: 3px;
}

.workflow-list::-webkit-scrollbar-thumb:hover,
.props-body::-webkit-scrollbar-thumb:hover,
.bottom-panel__body::-webkit-scrollbar-thumb:hover {
  background: #b8b1a0;
}

/* ── Execution Detail ──────────────────────────────────────────────────────── */
.exec-step {
  font-size: 13px;
}

.exec-step__header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
}

.exec-step__name {
  font-weight: 600;
  color: var(--ink-text);
}

.exec-step__duration {
  font-size: 12px;
  color: var(--ink-text-secondary);
}

.exec-step__agent {
  font-size: 12px;
  color: var(--ink-text-regular);
  margin-bottom: 4px;
}

.exec-step__output {
  margin-top: 4px;
}

.exec-step__pre {
  background: var(--el-fill-color);
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-family: var(--app-font-mono);
  white-space: pre-wrap;
  word-break: break-all;
  margin: 0;
}

.exec-step__error {
  margin-top: 4px;
  color: #f56c6c;
  font-size: 12px;
  background: #fef0f0;
  padding: 4px 8px;
  border-radius: 4px;
}

.is-loading {
  animation: pulse 1.5s ease-in-out infinite;
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.5; }
}
</style>
