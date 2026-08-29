<template>
  <div class="pipeline-view">
    <div class="page-header">
      <h2>需求开发 Pipeline</h2>
      <el-button type="primary" @click="showStartDialog = true">启动 Pipeline</el-button>
    </div>

    <el-table :data="pipelines" stripe v-loading="loading">
      <el-table-column prop="tfsWorkItemId" label="TFS #" width="90">
        <template #default="{ row }">
          <a :href="getWorkItemUrl(row.tfsWorkItemId)" target="_blank" class="tfs-link" style="color: var(--el-color-primary); text-decoration: none;">{{ row.tfsWorkItemId }}</a>
        </template>
      </el-table-column>
      <el-table-column prop="tfsTitle" label="需求标题" min-width="200" show-overflow-tooltip />
      <el-table-column prop="skillName" label="Skill" width="120" show-overflow-tooltip>
        <template #default="{ row }">
          <span v-if="row.skillName">{{ row.skillName }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column label="当前阶段" width="120">
        <template #default="{ row }">
          <span v-if="row.currentStage">{{ stageDisplayName(row.currentStage) }}</span>
          <span v-else>-</span>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态" width="110">
        <template #default="{ row }">
          <el-tag :type="pipelineStatusType(row.status)" size="small">{{ pipelineStatusLabel(row.status) }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="retryCount" label="重试" width="60" />
      <el-table-column prop="createdAt" label="创建时间" width="160">
        <template #default="{ row }">
          {{ formatDate(row.createdAt) }}
        </template>
      </el-table-column>
      <!-- 操作收敛（规范 §3.1）：状态动作+详情明面保留，查看类/删除收进「更多」 -->
      <el-table-column label="操作" width="230" fixed="right">
        <template #default="{ row }">
          <el-button type="primary" link size="small" @click="showDetail(row)">详情</el-button>
          <el-button v-if="row.status === 'WAITING_CONFIRM'" type="warning" link size="small" @click="openConfirm(row)">确认</el-button>
          <el-button v-if="row.status === 'PAUSED_ON_FAILURE'" type="warning" link size="small" @click="openContinueDialog(row)">补充输入并继续</el-button>
          <el-button v-if="row.status === 'FAILED'" type="warning" link size="small" @click="handleRetry(row)">重试</el-button>
          <el-dropdown trigger="click" @command="(cmd: string) => handleRowCommand(cmd, row)">
            <el-button link size="small">
              更多<el-icon class="el-icon--right"><ArrowDown /></el-icon>
            </el-button>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="steps">步骤</el-dropdown-item>
                <el-dropdown-item command="changes">变更</el-dropdown-item>
                <el-dropdown-item command="artifacts">过程文件</el-dropdown-item>
                <el-dropdown-item command="logs">日志</el-dropdown-item>
                <el-dropdown-item command="delete" divided>
                  <span style="color: var(--el-color-danger)">删除</span>
                </el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </template>
      </el-table-column>
    </el-table>

    <el-empty v-if="!loading && pipelines.length === 0" description="暂无 Pipeline 任务" />

    <!-- Start Dialog -->
    <el-dialog v-model="showStartDialog" title="启动 Pipeline" width="460px" @open="loadStartFormData">
      <el-form ref="startFormRef" :model="startForm" :rules="startRules" label-width="100px">
        <el-form-item label="TFS 需求号" prop="workItemId">
          <el-input-number v-model="startForm.workItemId" :min="1" placeholder="请输入需求号" style="width: 100%" controls-position="right" />
        </el-form-item>
        <el-form-item label="选择工作流" prop="workflowId">
          <el-select v-model="startForm.workflowId" placeholder="选择工作流" clearable filterable style="width: 100%">
            <el-option v-for="wf in workflows" :key="wf.id" :label="wf.name" :value="wf.id" />
          </el-select>
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showStartDialog = false">取消</el-button>
        <el-button type="primary" @click="handleStart" :loading="starting">启动</el-button>
      </template>
    </el-dialog>

    <!-- Detail Dialog -->
    <el-dialog v-model="showDetailDialog" title="Pipeline 详情" width="80%">
      <div v-if="selectedPipeline">
        <el-tabs v-model="detailActiveTab" @tab-change="handleDetailTabChange">
          <!-- Tab 1: Basic Info -->
          <el-tab-pane label="基本信息" name="basic">
            <el-descriptions :column="2" border size="small">
              <el-descriptions-item label="TFS">#{{ selectedPipeline.tfsWorkItemId }}</el-descriptions-item>
              <el-descriptions-item label="标题">{{ selectedPipeline.tfsTitle }}</el-descriptions-item>
              <el-descriptions-item label="状态">
                <el-tag :type="pipelineStatusType(selectedPipeline.status)" size="small">{{ pipelineStatusLabel(selectedPipeline.status) }}</el-tag>
              </el-descriptions-item>
              <el-descriptions-item label="重试次数">{{ selectedPipeline.retryCount }}</el-descriptions-item>
              <el-descriptions-item label="Skill">
                {{ selectedPipeline.skillName || '-' }}
              </el-descriptions-item>
              <el-descriptions-item label="仓库 IDs">
                {{ selectedPipeline.repoIds || '-' }}
              </el-descriptions-item>
            </el-descriptions>
            <div v-if="selectedPipeline.error" class="pipeline-error">
              <h4>错误信息</h4>
              <pre>{{ selectedPipeline.error }}</pre>
            </div>
          </el-tab-pane>

          <!-- Tab 2: Steps - 工作流定义节点进度 -->
          <el-tab-pane label="执行步骤" name="steps">
            <!-- 工作流定义节点进度 -->
            <div v-if="workflowDefinitionNodes.length > 0" class="workflow-nodes">
              <el-timeline>
                <el-timeline-item
                  v-for="node in workflowDefinitionNodes"
                  :key="node.id"
                  :type="getWorkflowNodeTimelineType(node)"
                  placement="top"
                  :class="{ 'current-node': isCurrentWorkflowNode(node) }"
                >
                  <div class="workflow-node-item">
                    <div class="workflow-node-header" @click="toggleNodeLogs(node)" style="cursor: pointer">
                      <el-tag :type="getWorkflowNodeTypeTag(node)" size="small">{{ getWorkflowNodeTypeLabel(node) }}</el-tag>
                      <strong>{{ node.data?.label || node.id }}</strong>
                      <el-tag :type="getWorkflowNodeStatusType(node)" size="small" style="margin-left: 8px">
                        {{ getWorkflowNodeStatusLabel(node) }}
                      </el-tag>
                      <el-icon style="margin-left: 8px">
                        <ArrowDown v-if="!expandedNodeLogs.has(node.id)" />
                        <ArrowUp v-else />
                      </el-icon>
                      <el-button
                        v-if="canRetryWorkflowNode(node)"
                        type="warning"
                        link
                        size="small"
                        style="margin-left: 8px"
                        @click.stop="handleRetryWorkflowNode(node)"
                        :loading="retryingNodeId === node.id"
                      >重试节点</el-button>
                      <el-button
                        v-if="canContinueWorkflowNode(node)"
                        type="warning"
                        link
                        size="small"
                        style="margin-left: 8px"
                        @click.stop="openContinueDialogFromNode(node)"
                        :loading="continuing"
                      >补充输入并继续</el-button>
                    </div>
                    <div v-if="isCurrentWorkflowNode(node)" class="node-running-indicator">
                      <el-icon class="is-loading"><Loading /></el-icon>
                      <span>正在执行...</span>
                    </div>
                    <div v-if="getExecNodeForDefNode(node)?.supplementalInput" class="node-supplemental-input">
                      <div class="node-supplemental-label">用户补充输入</div>
                      <pre>{{ getExecNodeForDefNode(node).supplementalInput }}</pre>
                    </div>
                    <!-- 展开显示该节点的日志 -->
                    <div v-if="expandedNodeLogs.has(node.id)" class="node-logs">
                      <div v-if="getNodeLogs(node).length > 0">
                        <div v-for="step in getNodeLogs(node)" :key="step.id" class="node-log-item">
                          <el-tag :type="stepTypeTag(step.type)" size="small">{{ stepTypeLabel(step.type) }}</el-tag>
                          <span class="node-log-title">{{ step.title }}</span>
                          <el-tag :type="stepStatusType(step.status)" size="small">{{ stepStatusLabel(step.status) }}</el-tag>
                          <div v-if="step.detail" class="node-log-detail" @click.stop="toggleStepDetail(step.id)">
                            <pre v-if="expandedSteps.has(step.id)">{{ step.detail }}</pre>
                          </div>
                        </div>
                      </div>
                      <el-empty v-else description="暂无日志" :image-size="40" />
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
            <el-empty v-else-if="!selectedPipeline?.workflowDefinitionId" description="暂无工作流定义（Skill链模式）" />
            <el-empty v-else description="暂无工作流节点" />

            <!-- 如果没有工作流节点但有 detailSteps，显示所有日志（Skill链模式兼容） -->
            <div v-if="workflowDefinitionNodes.length === 0 && detailSteps.length > 0" style="margin-top: 16px">
              <el-timeline>
                <el-timeline-item v-for="step in detailSteps" :key="step.id" :type="stepTimelineType(step.type, step.status)" :timestamp="formatDate(step.completedAt || step.startedAt)" placement="top">
                  <div class="step-item" @click="toggleStepDetail(step.id)" style="cursor: pointer">
                    <div class="step-header">
                      <el-tag :type="stepTypeTag(step.type)" size="small">{{ stepTypeLabel(step.type) }}</el-tag>
                      <strong>{{ step.title }}</strong>
                      <el-tag :type="stepStatusType(step.status)" size="small" style="margin-left: 8px">{{ stepStatusLabel(step.status) }}</el-tag>
                    </div>
                    <div v-if="expandedSteps.has(step.id) && step.detail" class="step-detail">
                      <pre>{{ step.detail }}</pre>
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>

            <!-- Legacy stage results -->
            <div class="stages" v-if="selectedPipeline.stageResults && selectedPipeline.stageResults.length > 0">
              <h4>执行阶段</h4>
              <el-timeline>
                <el-timeline-item
                  v-for="stage in allStages"
                  :key="stage.key"
                  :type="getStageTimelineType(stage.key)"
                  :timestamp="getStageTimestamp(stage.key)"
                  placement="top"
                >
                  <div class="stage-item">
                    <strong>{{ stage.label }}</strong>
                    <el-tag :type="getStageStatusType(stage.key)" size="small" style="margin-left: 8px">
                      {{ getStageStatusLabel(stage.key) }}
                    </el-tag>
                    <div v-if="getStageOutput(stage.key)" class="stage-output">
                      <pre>{{ getStageOutput(stage.key) }}</pre>
                    </div>
                    <div v-if="getStageError(stage.key)" class="stage-error">
                      {{ getStageError(stage.key) }}
                    </div>
                  </div>
                </el-timeline-item>
              </el-timeline>
            </div>
          </el-tab-pane>

          <!-- Tab 3: Changes -->
          <el-tab-pane label="文件变更" name="changes">
            <div class="detail-tab-toolbar">
              <el-button size="small" @click="refreshDetailChanges" :loading="detailChangesLoading">刷新</el-button>
              <span v-if="detailChanges.length > 0" class="detail-tab-count">共 {{ detailChanges.length }} 个变更</span>
            </div>
            <div v-loading="detailChangesLoading && detailChanges.length === 0">
              <el-empty v-if="detailChanges.length === 0 && !detailChangesLoading" description="暂无文件变更" />
              <div v-else class="changes-list">
                <div v-for="change in detailChanges" :key="change.id" class="change-item">
                  <div class="change-header" @click="toggleDetailChange(change.id)">
                    <div class="change-info">
                      <el-tag :type="changeTypeTag(change.changeType)" size="small">{{ changeTypeLabel(change.changeType) }}</el-tag>
                      <span class="change-filepath">{{ change.filePath }}</span>
                    </div>
                    <div class="change-meta">
                      <span v-if="change.repoId" class="change-repo">仓库: {{ change.repoId }}</span>
                      <span v-if="change.branch" class="change-branch">分支: {{ change.branch }}</span>
                      <el-icon :class="{ 'expanded': expandedDetailChanges.has(change.id) }"><ArrowRight /></el-icon>
                    </div>
                  </div>
                  <div v-if="expandedDetailChanges.has(change.id)" class="change-diff">
                    <div v-if="change.summary" class="change-summary">
                      <strong>摘要：</strong>{{ change.summary }}
                    </div>
                    <div class="diff-container">
                      <div class="diff-side" v-if="change.oldContent != null">
                        <div class="diff-label">旧内容</div>
                        <pre class="diff-old">{{ change.oldContent }}</pre>
                      </div>
                      <div v-else class="diff-side diff-new-file">
                        <div class="diff-label">新增文件</div>
                        <pre class="diff-new">{{ change.newContent }}</pre>
                      </div>
                      <div class="diff-side" v-if="change.newContent != null">
                        <div class="diff-label">新内容</div>
                        <pre class="diff-new">{{ change.newContent }}</pre>
                      </div>
                      <div v-else class="diff-side diff-deleted-file">
                        <div class="diff-label">删除文件</div>
                        <pre class="diff-old">{{ change.oldContent }}</pre>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Tab 4: Artifacts -->
          <el-tab-pane label="过程文件" name="artifacts">
            <div class="detail-tab-toolbar">
              <el-button size="small" @click="refreshDetailArtifacts" :loading="detailArtifactsLoading">刷新</el-button>
              <span v-if="detailArtifacts.length > 0" class="detail-tab-count">共 {{ detailArtifacts.length }} 个文件</span>
            </div>
            <div v-loading="detailArtifactsLoading && detailArtifacts.length === 0">
              <el-empty v-if="detailArtifacts.length === 0 && !detailArtifactsLoading" description="暂无过程文件" />
              <div v-else class="artifacts-list">
                <div v-for="artifact in detailArtifacts" :key="artifact.id" class="artifact-item">
                  <div class="artifact-header" @click="toggleDetailArtifact(artifact.id)">
                    <div class="artifact-info">
                      <el-tag :type="artifactTypeTag(artifact.artifactType)" size="small">{{ artifactTypeLabel(artifact.artifactType) }}</el-tag>
                      <span class="artifact-filepath">{{ artifact.filePath }}</span>
                    </div>
                    <div class="artifact-meta">
                      <span v-if="artifact.repoId" class="artifact-repo">仓库: {{ artifact.repoId }}</span>
                      <span v-if="artifact.branch" class="artifact-branch">分支: {{ artifact.branch }}</span>
                      <el-icon :class="{ 'expanded': expandedDetailArtifacts.has(artifact.id) }"><ArrowRight /></el-icon>
                    </div>
                  </div>
                  <div v-if="expandedDetailArtifacts.has(artifact.id)" class="artifact-content">
                    <div v-if="artifact.summary" class="artifact-summary">
                      <strong>摘要：</strong>{{ artifact.summary }}
                    </div>
                    <div v-if="artifact.content" class="artifact-code">
                      <pre>{{ artifact.content }}</pre>
                    </div>
                    <div v-else class="artifact-no-content">无内容</div>
                  </div>
                </div>
              </div>
            </div>
          </el-tab-pane>

          <!-- Tab 5: Confirm (conditional) -->
          <el-tab-pane v-if="selectedPipeline.status === 'WAITING_CONFIRM'" label="确认" name="confirm">
            <div class="confirm-section" v-if="selectedPipeline.confirmMessage">
              <h4>确认消息</h4>
              <div class="confirm-message">
                <pre>{{ selectedPipeline.confirmMessage }}</pre>
              </div>
            </div>
            <div v-else class="confirm-section">
              <p>无确认消息</p>
            </div>
            <div class="confirm-actions">
              <el-button type="success" @click="handleConfirm(selectedPipeline, true)" :loading="confirming">通过</el-button>
              <el-button type="danger" @click="showRejectFromDetail = true">拒绝</el-button>
            </div>
            <div v-if="showRejectFromDetail" class="reject-section">
              <el-input v-model="rejectComment" type="textarea" :rows="2" placeholder="可选拒绝原因" />
              <el-button type="danger" size="small" @click="handleConfirm(selectedPipeline!, false)" :loading="confirming" style="margin-top: 8px">确认拒绝</el-button>
            </div>
          </el-tab-pane>

          <!-- Tab 6: Logs -->
          <el-tab-pane label="日志" name="logs">
            <div class="detail-tab-toolbar">
              <el-button size="small" @click="refreshDetailLogs" :loading="detailLogsLoading">刷新</el-button>
              <span v-if="detailLogs.length > 0" class="detail-tab-count">共 {{ detailLogs.length }} 条日志</span>
            </div>
            <div v-loading="detailLogsLoading && detailLogs.length === 0">
              <el-empty v-if="detailLogs.length === 0 && !detailLogsLoading" description="暂无日志" />
              <div v-else class="logs-list">
                <div v-for="(log, idx) in detailLogs" :key="idx" class="log-item" :class="'log-level-' + (log.level || 'INFO').toLowerCase()">
                  <span class="log-timestamp">{{ log.timestamp ? log.timestamp.substring(11, 19) : '' }}</span>
                  <el-tag :type="logLevelType(log.level)" size="small" class="log-level-tag">{{ log.level || 'INFO' }}</el-tag>
                  <span class="log-message">{{ log.message }}</span>
                </div>
              </div>
            </div>
          </el-tab-pane>
        </el-tabs>
      </div>
    </el-dialog>

    <!-- Steps Dialog -->
    <el-dialog v-model="showStepsDialog" title="执行步骤" width="900px">
      <div class="steps-toolbar">
        <el-button size="small" @click="refreshSteps" :loading="stepsLoading">刷新</el-button>
        <span v-if="stepsPipeline" class="steps-pipeline-info">
          Pipeline #{{ stepsPipeline.tfsWorkItemId }} - {{ stepsPipeline.tfsTitle }}
        </span>
      </div>
      <div v-loading="stepsLoading && stepsList.length === 0">
        <el-empty v-if="stepsList.length === 0 && !stepsLoading" description="暂无执行步骤" />
        <el-timeline v-else>
          <el-timeline-item
            v-for="step in stepsList"
            :key="step.id"
            :color="stepColor(step.type)"
            :timestamp="formatDate(step.completedAt || step.startedAt)"
            placement="top"
          >
            <div class="step-item" @click="toggleStepDetail(step.id)" style="cursor: pointer">
              <div class="step-header">
                <el-tag :type="stepTypeTag(step.type)" size="small" class="step-type-tag">{{ stepTypeLabel(step.type) }}</el-tag>
                <strong>{{ step.title }}</strong>
                <el-tag :type="stepStatusType(step.status)" size="small" style="margin-left: 8px">{{ stepStatusLabel(step.status) }}</el-tag>
              </div>
              <div v-if="expandedSteps.has(step.id) && step.detail" class="step-detail">
                <pre>{{ step.detail }}</pre>
              </div>
              <div v-if="expandedSteps.has(step.id) && step.metadata" class="step-metadata">
                <el-collapse>
                  <el-collapse-item title="Metadata">
                    <pre class="metadata-content">{{ step.metadata }}</pre>
                  </el-collapse-item>
                </el-collapse>
              </div>
            </div>
          </el-timeline-item>
        </el-timeline>
      </div>
    </el-dialog>

    <!-- Confirm Dialog -->
    <el-dialog v-model="showConfirmDialog" title="Pipeline 确认" width="700px">
      <div v-if="confirmPipeline" class="confirm-dialog">
        <el-descriptions :column="2" border size="small" style="margin-bottom: 16px">
          <el-descriptions-item label="TFS">#{{ confirmPipeline.tfsWorkItemId }}</el-descriptions-item>
          <el-descriptions-item label="标题">{{ confirmPipeline.tfsTitle }}</el-descriptions-item>
          <el-descriptions-item label="Skill">{{ confirmPipeline.skillName || '-' }}</el-descriptions-item>
          <el-descriptions-item label="状态">
            <el-tag type="warning" size="small">等待确认</el-tag>
          </el-descriptions-item>
        </el-descriptions>
        <h4>确认消息</h4>
        <div class="confirm-message-scroll">
          <pre>{{ confirmPipeline.confirmMessage || '无确认消息' }}</pre>
        </div>
        <div class="confirm-reject-section" v-if="showRejectInput">
          <el-input v-model="rejectComment" type="textarea" :rows="3" placeholder="请输入拒绝原因（可选）" />
        </div>
        <div class="confirm-dialog-actions">
          <el-button type="success" size="large" @click="handleConfirm(confirmPipeline, true)" :loading="confirming">
            通过
          </el-button>
          <el-button v-if="!showRejectInput" type="danger" size="large" @click="showRejectInput = true">
            拒绝
          </el-button>
          <template v-else>
            <el-button type="danger" size="large" @click="handleConfirm(confirmPipeline, false)" :loading="confirming">
              确认拒绝
            </el-button>
            <el-button size="large" @click="showRejectInput = false">取消</el-button>
          </template>
        </div>
      </div>
    </el-dialog>

    <!-- Continue Dialog -->
    <el-dialog v-model="showContinueDialog" title="补充输入并继续" width="600px">
      <div v-if="continuePipeline" class="continue-dialog">
        <el-descriptions :column="2" border size="small" style="margin-bottom: 16px">
          <el-descriptions-item label="TFS">#{{ continuePipeline.tfsWorkItemId }}</el-descriptions-item>
          <el-descriptions-item label="标题">{{ continuePipeline.tfsTitle }}</el-descriptions-item>
          <el-descriptions-item label="暂停节点">{{ continueNodeId }}</el-descriptions-item>
        </el-descriptions>
        <el-input v-model="continueInput" type="textarea" :rows="6" placeholder="请输入补充信息，帮助 Agent 修正方向..." />
      </div>
      <template #footer>
        <el-button @click="showContinueDialog = false">取消</el-button>
        <el-button type="primary" @click="handleContinue" :loading="continuing">提交并继续</el-button>
      </template>
    </el-dialog>

    <!-- Changes Dialog -->
    <el-dialog v-model="showChangesDialog" title="文件变更" width="80%">
      <div class="changes-toolbar">
        <el-button size="small" @click="refreshChanges" :loading="changesLoading">刷新</el-button>
        <span v-if="changesPipeline" class="changes-pipeline-info">
          Pipeline #{{ changesPipeline.tfsWorkItemId }}
        </span>
        <span v-if="changesList.length > 0" class="changes-count">共 {{ changesList.length }} 个文件变更</span>
      </div>
      <div v-loading="changesLoading && changesList.length === 0">
        <el-empty v-if="changesList.length === 0 && !changesLoading" description="暂无文件变更" />
        <div v-else class="changes-list">
          <div v-for="change in changesList" :key="change.id" class="change-item">
            <div class="change-header" @click="toggleChange(change.id)">
              <div class="change-info">
                <el-tag :type="changeTypeTag(change.changeType)" size="small">{{ changeTypeLabel(change.changeType) }}</el-tag>
                <span class="change-filepath">{{ change.filePath }}</span>
              </div>
              <div class="change-meta">
                <span v-if="change.repoId" class="change-repo">仓库: {{ change.repoId }}</span>
                <span v-if="change.branch" class="change-branch">分支: {{ change.branch }}</span>
                <el-icon :class="{ 'expanded': expandedChanges.has(change.id) }"><ArrowRight /></el-icon>
              </div>
            </div>
            <div v-if="expandedChanges.has(change.id)" class="change-diff">
              <div v-if="change.summary" class="change-summary">
                <strong>摘要：</strong>{{ change.summary }}
              </div>
              <div class="diff-container">
                <div class="diff-side" v-if="change.oldContent != null">
                  <div class="diff-label">旧内容</div>
                  <pre class="diff-old">{{ change.oldContent }}</pre>
                </div>
                <div v-else class="diff-side diff-new-file">
                  <div class="diff-label">新增文件</div>
                  <pre class="diff-new">{{ change.newContent }}</pre>
                </div>
                <div class="diff-side" v-if="change.newContent != null">
                  <div class="diff-label">新内容</div>
                  <pre class="diff-new">{{ change.newContent }}</pre>
                </div>
                <div v-else class="diff-side diff-deleted-file">
                  <div class="diff-label">删除文件</div>
                  <pre class="diff-old">{{ change.oldContent }}</pre>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- Artifacts Dialog -->
    <el-dialog v-model="showArtifactsDialog" title="过程文件" width="900px">
      <div class="artifacts-toolbar">
        <el-button size="small" @click="refreshArtifacts" :loading="artifactsLoading">刷新</el-button>
        <span v-if="artifactsPipeline" class="artifacts-pipeline-info">
          Pipeline #{{ artifactsPipeline.tfsWorkItemId }}
        </span>
      </div>
      <div v-loading="artifactsLoading && artifactsList.length === 0">
        <el-empty v-if="artifactsList.length === 0 && !artifactsLoading" description="暂无过程文件" />
        <div v-else class="artifacts-list">
          <div v-for="artifact in artifactsList" :key="artifact.id" class="artifact-item">
            <div class="artifact-header" @click="toggleArtifact(artifact.id)">
              <div class="artifact-info">
                <el-tag :type="artifactTypeTag(artifact.artifactType)" size="small">{{ artifactTypeLabel(artifact.artifactType) }}</el-tag>
                <span class="artifact-filepath">{{ artifact.filePath }}</span>
              </div>
              <div class="artifact-meta">
                <span v-if="artifact.repoId" class="artifact-repo">仓库: {{ artifact.repoId }}</span>
                <span v-if="artifact.branch" class="artifact-branch">分支: {{ artifact.branch }}</span>
                <el-icon :class="{ 'expanded': expandedArtifacts.has(artifact.id) }"><ArrowRight /></el-icon>
              </div>
            </div>
            <div v-if="expandedArtifacts.has(artifact.id)" class="artifact-content">
              <div v-if="artifact.summary" class="artifact-summary">
                <strong>摘要：</strong>{{ artifact.summary }}
              </div>
              <div v-if="artifact.content" class="artifact-code">
                <pre>{{ artifact.content }}</pre>
              </div>
              <div v-else class="artifact-no-content">无内容</div>
            </div>
          </div>
        </div>
      </div>
    </el-dialog>

    <!-- Logs Dialog (structured list) -->
    <el-dialog v-model="showLogDialog" :title="logPipeline ? `Pipeline #${logPipeline.tfsWorkItemId} - 日志` : 'Pipeline 日志'" width="900px">
      <div class="logs-toolbar">
        <el-button size="small" @click="refreshLogs" :loading="logsLoading">刷新</el-button>
        <span v-if="logPipeline" class="logs-pipeline-info">
          Pipeline #{{ logPipeline.tfsWorkItemId }} - {{ logPipeline.tfsTitle }}
        </span>
        <span v-if="logs.length > 0" class="logs-count">共 {{ logs.length }} 条日志</span>
      </div>
      <div v-loading="logsLoading && logs.length === 0">
        <el-empty v-if="logs.length === 0 && !logsLoading" description="暂无日志" />
        <div v-else class="logs-list">
          <div v-for="(log, idx) in logs" :key="idx" class="log-item" :class="'log-level-' + (log.level || 'INFO').toLowerCase()">
            <span class="log-timestamp">{{ log.timestamp ? log.timestamp.substring(11, 19) : '' }}</span>
            <el-tag :type="logLevelType(log.level)" size="small" class="log-level-tag">{{ log.level || 'INFO' }}</el-tag>
            <span class="log-message">{{ log.message }}</span>
          </div>
        </div>
      </div>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted, onUnmounted, watch } from 'vue'
import { ElMessage, ElMessageBox } from 'element-plus'
import type { FormInstance, FormRules } from 'element-plus'
import { useConfirmDelete } from '@/composables/useConfirmDelete'

const { confirmDelete } = useConfirmDelete()
import { ArrowRight, ArrowDown, ArrowUp, Loading } from '@element-plus/icons-vue'
import http from '@/api/http'
import { getConfigMap } from '@/api/systemConfig'
import {
  pipelineApi,
  type PipelineTask,
  type PipelineLog,
  type PipelineExecutionStep,
  type PipelineFileChange,
  type PipelineArtifact
} from '@/api/pipeline'
import { formatDateTime } from '@/utils/format'

// ======================== TFS server URL ========================
const DEFAULT_TFS_URL = 'http://tfs2018-web.winning.com.cn:8080/tfs/WINNING-6.0'
const tfsServerUrl = ref(DEFAULT_TFS_URL)

function getWorkItemUrl(workItemId: number | string) {
  return `${tfsServerUrl.value}/_workitems/edit/${workItemId}`
}

async function loadTfsServerUrl() {
  try {
    const configMap = await getConfigMap()
    if (configMap['tfs.serverUrl']) {
      tfsServerUrl.value = configMap['tfs.serverUrl']
    }
  } catch {
    // fallback to default
  }
}

// ======================== Table & list ========================
const pipelines = ref<PipelineTask[]>([])
const loading = ref(false)
const showStartDialog = ref(false)
const startForm = reactive({
  workItemId: null as number | null,
  workflowId: null as number | null,
})
const startFormRef = ref<FormInstance>()
const startRules: FormRules = {
  workItemId: [{ required: true, message: '请填写需求号', trigger: 'change' }],
  workflowId: [{ required: true, message: '请选择工作流', trigger: 'change' }]
}
const workflows = ref<any[]>([])
const starting = ref(false)

async function loadStartFormData() {
  await loadWorkflows()
}

async function loadWorkflows() {
  try {
    const res = await http.get('/workflows')
    workflows.value = res.data || []
  } catch {
    workflows.value = []
  }
}

const allStages = [
  { key: 'REQUIREMENT_ANALYSIS', label: '需求分析' },
  { key: 'CODE_ANALYSIS', label: '代码分析' },
  { key: 'CODE_GENERATION', label: '代码生成' },
  { key: 'BUILD_VERIFY', label: '构建验证' }
]

function stageDisplayName(stage: string) {
  const found = allStages.find(s => s.key === stage)
  return found ? found.label : stage
}

function pipelineStatusType(status: string) {
  const map: Record<string, string> = {
    RUNNING: 'warning',
    SUCCESS: 'success',
    FAILED: 'danger',
    PENDING: 'info',
    WAITING_CONFIRM: 'warning',
    PAUSED_ON_FAILURE: 'warning'
  }
  return (map[status] || 'info') as any
}

function pipelineStatusLabel(status: string) {
  const map: Record<string, string> = {
    RUNNING: '运行中',
    SUCCESS: '成功',
    FAILED: '失败',
    PENDING: '等待',
    WAITING_CONFIRM: '等待确认',
    PAUSED_ON_FAILURE: '等待补充输入'
  }
  return map[status] || status
}

function formatDate(dateStr?: string): string {
  return dateStr ? formatDateTime(dateStr) : '-'
}

// ======================== Detail Dialog ========================
const showDetailDialog = ref(false)
const selectedPipeline = ref<PipelineTask | null>(null)
const detailSteps = ref<PipelineExecutionStep[]>([])
const expandedSteps = reactive(new Set<number>())
// 工作流节点数据（执行记录）
const workflowNodes = ref<any[]>([])
const expandedNodes = reactive(new Set<string>())
// 工作流定义数据
const workflowDefinition = ref<any>(null)
const workflowExecNodes = ref<any[]>([])
const showRejectFromDetail = ref(false)
const rejectComment = ref('')
const confirming = ref(false)
let detailTimer: ReturnType<typeof setInterval> | null = null

// Detail dialog tab state
const detailActiveTab = ref('basic')
const detailChanges = ref<PipelineFileChange[]>([])
const detailArtifacts = ref<PipelineArtifact[]>([])
const detailChangesLoading = ref(false)
const detailArtifactsLoading = ref(false)
const detailLogs = ref<PipelineLog[]>([])
const detailLogsLoading = ref(false)
const expandedDetailChanges = reactive(new Set<number>())
const expandedDetailArtifacts = reactive(new Set<number>())
const expandedNodeLogs = reactive(new Set<string>())
const retryingNodeId = ref<string | null>(null)

// Continue dialog state
const showContinueDialog = ref(false)
const continuePipeline = ref<PipelineTask | null>(null)
const continueNodeId = ref('')
const continueInput = ref('')
const continuing = ref(false)

function handleDetailTabChange(tab: string) {
  if (!selectedPipeline.value) return
  const id = selectedPipeline.value.id
  if (tab === 'changes' && detailChanges.value.length === 0) {
    detailChangesLoading.value = true
    pipelineApi.getChanges(id).then(data => { detailChanges.value = data }).catch(() => {}).finally(() => { detailChangesLoading.value = false })
  }
  if (tab === 'artifacts' && detailArtifacts.value.length === 0) {
    detailArtifactsLoading.value = true
    pipelineApi.getArtifacts(id).then(data => { detailArtifacts.value = data }).catch(() => {}).finally(() => { detailArtifactsLoading.value = false })
  }
  if (tab === 'logs' && detailLogs.value.length === 0) {
    detailLogsLoading.value = true
    pipelineApi.getLogs(id).then(data => { detailLogs.value = data }).catch(() => {}).finally(() => { detailLogsLoading.value = false })
  }
}

async function refreshDetailChanges() {
  if (!selectedPipeline.value) return
  detailChangesLoading.value = true
  try {
    detailChanges.value = await pipelineApi.getChanges(selectedPipeline.value.id)
  } catch {
    ElMessage.error('加载文件变更失败')
  } finally {
    detailChangesLoading.value = false
  }
}

async function refreshDetailArtifacts() {
  if (!selectedPipeline.value) return
  detailArtifactsLoading.value = true
  try {
    detailArtifacts.value = await pipelineApi.getArtifacts(selectedPipeline.value.id)
  } catch {
    ElMessage.error('加载过程文件失败')
  } finally {
    detailArtifactsLoading.value = false
  }
}

async function refreshDetailLogs() {
  if (!selectedPipeline.value) return
  detailLogsLoading.value = true
  try {
    detailLogs.value = await pipelineApi.getLogs(selectedPipeline.value.id)
  } catch {
    ElMessage.error('加载日志失败')
  } finally {
    detailLogsLoading.value = false
  }
}

// 获取某个工作流节点的日志
function getNodeLogs(node: any): any[] {
  const nodeName = node.data?.label || node.id
  // 匹配逻辑：step 的 title 包含节点名称，或者 step 的 detail 包含节点名称
  return detailSteps.value.filter((step: any) => {
    const title = step.title || ''
    const detail = step.detail || ''
    return title.includes(nodeName) || detail.includes(nodeName)
  })
}

// 展开/折叠节点日志
function toggleNodeLogs(node: any) {
  const nodeId = node.id
  if (expandedNodeLogs.has(nodeId)) {
    expandedNodeLogs.delete(nodeId)
  } else {
    expandedNodeLogs.add(nodeId)
  }
}

function toggleDetailChange(id: number) {
  if (expandedDetailChanges.has(id)) {
    expandedDetailChanges.delete(id)
  } else {
    expandedDetailChanges.add(id)
  }
}

function toggleDetailArtifact(id: number) {
  if (expandedDetailArtifacts.has(id)) {
    expandedDetailArtifacts.delete(id)
  } else {
    expandedDetailArtifacts.add(id)
  }
}

function toggleStepDetail(stepId: number) {
  if (expandedSteps.has(stepId)) {
    expandedSteps.delete(stepId)
  } else {
    expandedSteps.add(stepId)
  }
}

async function loadWorkflowNodes(pipeline: PipelineTask) {
  if (!pipeline.workflowExecutionId) {
    workflowNodes.value = []
    return
  }
  try {
    const res = await http.get(`/workflows/executions/${pipeline.workflowExecutionId}/nodes`)
    workflowNodes.value = res.data || []
    setTimeout(() => scrollToCurrentNode(), 100)
  } catch {
    workflowNodes.value = []
  }
}

function scrollToCurrentNode() {
  const el = document.querySelector('.current-node')
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }
}

// 从工作流定义解析节点（排除 START 和 END）
const workflowDefinitionNodes = computed(() => {
  if (!workflowDefinition.value?.definitionJson) return []
  try {
    const def = JSON.parse(workflowDefinition.value.definitionJson)
    const nodes = def.nodes || []
    return nodes.filter((n: any) => {
      const t = (n.type || '').toUpperCase()
      return t !== 'START' && t !== 'END'
    })
  } catch { return [] }
})

function getExecNodeForDefNode(defNode: any) {
  const label = defNode.data?.label || defNode.id
  return workflowExecNodes.value.find((en: any) => en.nodeName === label || en.nodeId === defNode.id)
}

function isCurrentWorkflowNode(defNode: any) {
  const execNode = getExecNodeForDefNode(defNode)
  if (execNode) return execNode.status === 'RUNNING'
  // Skill链模式：通过当前 skill 名称匹配节点
  if (!selectedPipeline.value?.workflowExecutionId && selectedPipeline.value) {
    const label = defNode.data?.label || defNode.id
    if (selectedPipeline.value.skillName === label) return true
  }
  return false
}

function getWorkflowNodeTimelineType(defNode: any): string {
  const execNode = getExecNodeForDefNode(defNode)
  if (execNode) {
    if (execNode.status === 'COMPLETED' || execNode.status === 'SUCCESS') return 'success'
    if (execNode.status === 'RUNNING') return 'primary'
    if (execNode.status === 'FAILED') return 'danger'
  }
  return 'info'
}

function getWorkflowNodeStatusType(defNode: any): string {
  const execNode = getExecNodeForDefNode(defNode)
  if (!execNode) return 'info'
  const map: Record<string, string> = { COMPLETED: 'success', SUCCESS: 'success', RUNNING: 'warning', FAILED: 'danger', PAUSED: 'warning' }
  return (map[execNode.status] || 'info') as any
}

function getWorkflowNodeStatusLabel(defNode: any): string {
  const execNode = getExecNodeForDefNode(defNode)
  if (!execNode) return '等待'
  const map: Record<string, string> = { COMPLETED: '完成', SUCCESS: '完成', RUNNING: '执行中', FAILED: '失败', PAUSED: '暂停' }
  return map[execNode.status] || execNode.status
}

function getWorkflowNodeTypeTag(defNode: any): string {
  const type = (defNode.type || defNode.data?.type || '').toUpperCase()
  const map: Record<string, string> = { AGENT: 'primary', CONDITION: 'warning', ROUTER: 'warning', PARALLEL: 'warning', MERGE: 'info' }
  return (map[type] || 'info') as any
}

function getWorkflowNodeTypeLabel(defNode: any): string {
  const type = (defNode.type || defNode.data?.type || '').toUpperCase()
  const map: Record<string, string> = { AGENT: 'Agent', CONDITION: '条件', ROUTER: '路由', PARALLEL: '并行', MERGE: '合并' }
  return map[type] || type
}

function canRetryWorkflowNode(node: any): boolean {
  if (!selectedPipeline.value?.workflowExecutionId) return false
  if (selectedPipeline.value.status === 'RUNNING') return false
  const execNode = getExecNodeForDefNode(node)
  if (!execNode) return false
  const status = execNode.status
  return status === 'SUCCESS' || status === 'COMPLETED' || status === 'FAILED'
}

function canContinueWorkflowNode(node: any): boolean {
  if (!selectedPipeline.value?.workflowExecutionId) return false
  const execNode = getExecNodeForDefNode(node)
  if (!execNode) return false
  return execNode.status === 'PAUSED'
}

function openContinueDialogFromNode(node: any) {
  if (!selectedPipeline.value) return
  continuePipeline.value = selectedPipeline.value
  continueNodeId.value = node.id || ''
  continueInput.value = ''
  showContinueDialog.value = true
}

async function handleRetryWorkflowNode(node: any) {
  if (!selectedPipeline.value) return
  retryingNodeId.value = node.id
  try {
    await pipelineApi.retryWorkflowNode(selectedPipeline.value.id, node.id)
    ElMessage.success('已重试节点，Pipeline 将重新执行该节点及下游节点')
    // Refresh detail and ensure auto-refresh is running
    await refreshDetailDataSmart()
    startDetailAutoRefresh()
  } catch {
    ElMessage.error('重试节点失败')
  } finally {
    retryingNodeId.value = null
  }
}

function openContinueDialog(row: PipelineTask) {
  continuePipeline.value = row
  continueNodeId.value = row.currentStage || ''
  continueInput.value = ''
  showContinueDialog.value = true
}

async function handleContinue() {
  if (!continuePipeline.value) return
  if (!continueNodeId.value.trim()) {
    ElMessage.warning('暂停节点 ID 不能为空')
    return
  }
  continuing.value = true
  try {
    await pipelineApi.continueWorkflowNode(continuePipeline.value.id, continueNodeId.value, continueInput.value)
    ElMessage.success('已提交补充输入，继续执行')
    showContinueDialog.value = false
    await loadPipelines()
    if (showDetailDialog.value && selectedPipeline.value?.id === continuePipeline.value.id) {
      await refreshDetailDataSmart()
      startDetailAutoRefresh()
    }
  } catch {
    ElMessage.error('提交补充输入失败')
  } finally {
    continuing.value = false
  }
}

async function loadWorkflowDefinition(pipeline: PipelineTask, forceReload = false) {
  // 如果不是强制重载，且已加载过，则只更新执行节点
  if (!forceReload && workflowDefinition.value && pipeline.workflowDefinitionId === workflowDefinition.value.id) {
    // 只更新执行节点（增量更新）
    if (pipeline.workflowExecutionId) {
      try {
        const res = await http.get(`/workflows/executions/${pipeline.workflowExecutionId}/nodes`)
        const newNodes = res.data || []
        // 比较节点变化，只更新有变化的节点
        if (JSON.stringify(workflowExecNodes.value) !== JSON.stringify(newNodes)) {
          workflowExecNodes.value = newNodes
          setTimeout(() => scrollToCurrentNode(), 100)
        }
      } catch {
        // ignore
      }
    }
    return
  }

  // 首次加载或强制重载
  workflowDefinition.value = null
  workflowExecNodes.value = []
  if (!pipeline.workflowDefinitionId) return
  try {
    const res = await http.get(`/workflows/${pipeline.workflowDefinitionId}`)
    workflowDefinition.value = res.data
  } catch {
    // ignore
  }
  // 加载执行记录节点
  if (pipeline.workflowExecutionId) {
    try {
      const res = await http.get(`/workflows/executions/${pipeline.workflowExecutionId}/nodes`)
      workflowExecNodes.value = res.data || []
      setTimeout(() => scrollToCurrentNode(), 100)
    } catch {
      workflowExecNodes.value = []
    }
  }
}

function getStageResult(stageKey: string) {
  if (!selectedPipeline.value?.stageResults) return null
  return selectedPipeline.value.stageResults.find(r => r.stage === stageKey)
}

function getStageTimelineType(stageKey: string) {
  const result = getStageResult(stageKey)
  if (!result) {
    const idx = allStages.findIndex(s => s.key === stageKey)
    const currentIdx = allStages.findIndex(s => s.key === selectedPipeline.value?.currentStage)
    if (idx < currentIdx) return 'success'
    if (idx === currentIdx) return 'primary'
    return 'info'
  }
  if (result.status === 'SUCCESS') return 'success'
  if (result.status === 'FAILED') return 'danger'
  if (result.status === 'RUNNING') return 'primary'
  return 'info'
}

function getStageStatusType(stageKey: string) {
  const result = getStageResult(stageKey)
  if (!result) return 'info'
  const map: Record<string, string> = { SUCCESS: 'success', FAILED: 'danger', RUNNING: 'warning', RETRY: 'warning' }
  return (map[result.status] || 'info') as any
}

function getStageStatusLabel(stageKey: string) {
  const result = getStageResult(stageKey)
  if (!result) return '等待'
  const map: Record<string, string> = { SUCCESS: '完成', FAILED: '失败', RUNNING: '执行中', RETRY: '重试' }
  return map[result.status] || result.status
}

function getStageTimestamp(stageKey: string) {
  const result = getStageResult(stageKey)
  if (!result) return ''
  return formatDate(result.completedAt || result.startedAt)
}

function getStageOutput(stageKey: string) {
  const result = getStageResult(stageKey)
  return result?.output || ''
}

function getStageError(stageKey: string) {
  const result = getStageResult(stageKey)
  return result?.status === 'FAILED' ? result.error : ''
}

async function showDetail(pipeline: PipelineTask) {
  try {
    selectedPipeline.value = await pipelineApi.get(pipeline.id)
    showDetailDialog.value = true
    showRejectFromDetail.value = false
    rejectComment.value = ''
    // Reset tab state
    detailActiveTab.value = 'basic'
    detailChanges.value = []
    detailArtifacts.value = []
    detailLogs.value = []
    expandedDetailChanges.clear()
    expandedDetailArtifacts.clear()
    // Load steps for the detail dialog
    try {
      detailSteps.value = await pipelineApi.getSteps(pipeline.id)
    } catch {
      detailSteps.value = []
    }
    // 加载工作流节点（兼容旧逻辑）
    await loadWorkflowNodes(selectedPipeline.value)
    // 加载工作流定义（用于"执行步骤" Tab 显示定义节点）
    await loadWorkflowDefinition(selectedPipeline.value)
    // 主动加载过程文件和文件变更
    try {
      detailChanges.value = await pipelineApi.getChanges(pipeline.id)
    } catch {
      detailChanges.value = []
    }
    try {
      detailArtifacts.value = await pipelineApi.getArtifacts(pipeline.id)
    } catch {
      detailArtifacts.value = []
    }
    // Start auto-refresh if pipeline is active
    startDetailAutoRefresh()
  } catch {
    ElMessage.error('获取详情失败')
  }
}

function startDetailAutoRefresh() {
  stopDetailAutoRefresh()
  // 启用自动刷新，但只在数据变化时更新界面
  if (selectedPipeline.value &&
      (selectedPipeline.value.status === 'RUNNING' || selectedPipeline.value.status === 'WAITING_CONFIRM')) {
    detailTimer = setInterval(refreshDetailDataSmart, 5000)
  }
}

function stopDetailAutoRefresh() {
  if (detailTimer) {
    clearInterval(detailTimer)
    detailTimer = null
  }
}

async function refreshDetailDataSmart() {
  if (!selectedPipeline.value) return
  const id = selectedPipeline.value.id
  try {
    const newData = await pipelineApi.get(id)

    // 只在状态变化时更新基本信息，避免不必要的重渲染
    let pipelineChanged = false
    if (selectedPipeline.value.status !== newData.status ||
        selectedPipeline.value.currentStage !== newData.currentStage ||
        selectedPipeline.value.retryCount !== newData.retryCount) {
      selectedPipeline.value = newData
      pipelineChanged = true
    }

    // 只刷新当前活动的 tab
    if (detailActiveTab.value === 'steps') {
      const newSteps = await pipelineApi.getSteps(id)
      // 只在 pipeline 状态变化时重新加载工作流定义节点，避免频繁刷新
      if (pipelineChanged) {
        await loadWorkflowDefinition(selectedPipeline.value)
      }
      if (JSON.stringify(detailSteps.value) !== JSON.stringify(newSteps)) {
        detailSteps.value = newSteps
      }
    } else if (detailActiveTab.value === 'changes') {
      const newChanges = await pipelineApi.getChanges(id)
      if (JSON.stringify(detailChanges.value) !== JSON.stringify(newChanges)) {
        detailChanges.value = newChanges
      }
    } else if (detailActiveTab.value === 'artifacts') {
      const newArtifacts = await pipelineApi.getArtifacts(id)
      if (JSON.stringify(detailArtifacts.value) !== JSON.stringify(newArtifacts)) {
        detailArtifacts.value = newArtifacts
      }
    } else if (detailActiveTab.value === 'logs') {
      const newLogs = await pipelineApi.getLogs(id)
      if (JSON.stringify(detailLogs.value) !== JSON.stringify(newLogs)) {
        detailLogs.value = newLogs
      }
    }

    if (newData.status !== 'RUNNING' && newData.status !== 'WAITING_CONFIRM') {
      stopDetailAutoRefresh()
    }
  } catch {
    // ignore refresh errors
  }
}

// ======================== Steps Dialog ========================
const showStepsDialog = ref(false)
const stepsPipeline = ref<PipelineTask | null>(null)
const stepsList = ref<PipelineExecutionStep[]>([])
const stepsLoading = ref(false)
let stepsTimer: ReturnType<typeof setInterval> | null = null

function stepColor(type: string): string {
  const map: Record<string, string> = {
    SKILL_LOAD: 'var(--el-color-primary)',
    SKILL_START: 'var(--el-color-primary)',
    SKILL_END: '#67c23a',
    CONTEXT_BUILD: 'var(--el-color-primary)',
    CLAUDE_MD_LOAD: 'var(--viz-blue)',
    CLAUDE_MD_SKIP: 'var(--viz-orange)',
    LLM_CALL: '#67c23a',
    TOOL_CALL: 'var(--viz-purple)',
    AGENT_RESPONSE: '#e6a23c',
    CONFIRM_REQUEST: '#e6a23c',
    STAGE_START: 'var(--viz-cyan)',
    STAGE_COMPLETE: 'var(--viz-cyan)',
    PIPELINE_START: 'var(--el-color-primary)',
    PIPELINE_COMPLETE: '#67c23a',
    INFO: 'var(--ink-text-secondary)',
    ERROR: '#f56c6c'
  }
  return map[type] || 'var(--ink-text-secondary)'
}

function stepTypeTag(type: string): string {
  const map: Record<string, string> = {
    SKILL_LOAD: '',
    SKILL_START: '',
    SKILL_END: 'success',
    CONTEXT_BUILD: '',
    CLAUDE_MD_LOAD: '',
    CLAUDE_MD_SKIP: 'warning',
    LLM_CALL: 'success',
    TOOL_CALL: 'warning',
    AGENT_RESPONSE: 'warning',
    CONFIRM_REQUEST: 'warning',
    STAGE_START: 'info',
    STAGE_COMPLETE: 'info',
    PIPELINE_START: '',
    PIPELINE_COMPLETE: 'success',
    INFO: 'info',
    ERROR: 'danger'
  }
  return (map[type] || 'info') as any
}

function stepTypeLabel(type: string): string {
  const map: Record<string, string> = {
    SKILL_LOAD: '技能加载',
    SKILL_START: 'Skill开始',
    SKILL_END: 'Skill结束',
    SKILL_LINK: 'Skill链接',
    SKILL_COPY: 'Skill复制',
    SETTINGS_WRITE: '配置写入',
    CONTEXT_BUILD: '上下文构建',
    CLAUDE_MD_LOAD: 'CLAUDE.md',
    CLAUDE_MD_SKIP: 'CLAUDE.md跳过',
    LLM_CALL: 'LLM调用',
    TOOL_CALL: '工具调用',
    AGENT_RESPONSE: 'Agent响应',
    CONFIRM_REQUEST: '确认请求',
    STAGE_START: '阶段开始',
    STAGE_COMPLETE: '阶段完成',
    PIPELINE_START: '流水线开始',
    PIPELINE_COMPLETE: '流水线完成',
    INFO: '信息',
    ERROR: '错误'
  }
  return map[type] || type
}

function stepStatusType(status: string): string {
  const map: Record<string, string> = {
    RUNNING: 'warning',
    SUCCESS: 'success',
    FAILED: 'danger',
    WAITING: 'info'
  }
  return (map[status] || 'info') as any
}

function stepStatusLabel(status: string): string {
  const map: Record<string, string> = {
    RUNNING: '运行中',
    SUCCESS: '成功',
    FAILED: '失败',
    WAITING: '等待中'
  }
  return map[status] || status
}

function stepTimelineType(_type: string, status: string): string {
  if (status === 'SUCCESS') return 'success'
  if (status === 'FAILED') return 'danger'
  if (status === 'RUNNING') return 'primary'
  if (status === 'WAITING') return 'warning'
  return 'info'
}

async function openSteps(pipeline: PipelineTask) {
  stepsPipeline.value = pipeline
  showStepsDialog.value = true
  await refreshSteps()
  startStepsAutoRefresh(pipeline)
}

async function refreshSteps() {
  if (!stepsPipeline.value) return
  stepsLoading.value = true
  try {
    stepsList.value = await pipelineApi.getSteps(stepsPipeline.value.id)
  } catch {
    ElMessage.error('加载执行步骤失败')
  } finally {
    stepsLoading.value = false
  }
}

function startStepsAutoRefresh(pipeline: PipelineTask) {
  stopStepsAutoRefresh()
  if (pipeline.status === 'RUNNING' || pipeline.status === 'WAITING_CONFIRM') {
    stepsTimer = setInterval(() => {
      if (showStepsDialog.value) {
        refreshSteps()
      }
    }, 3000)
  }
}

function stopStepsAutoRefresh() {
  if (stepsTimer) {
    clearInterval(stepsTimer)
    stepsTimer = null
  }
}

watch(showDetailDialog, (val) => {
  if (!val) {
    stopDetailAutoRefresh()
    selectedPipeline.value = null
    workflowNodes.value = []
    expandedNodes.clear()
    expandedNodeLogs.clear()
    workflowDefinition.value = null
    workflowExecNodes.value = []
    detailLogs.value = []
    detailLogsLoading.value = false
  }
})

watch(showStepsDialog, (val) => {
  if (!val) {
    stopStepsAutoRefresh()
    stepsPipeline.value = null
    stepsList.value = []
  }
})

// ======================== Confirm Dialog ========================
const showConfirmDialog = ref(false)
const confirmPipeline = ref<PipelineTask | null>(null)
const showRejectInput = ref(false)

async function openConfirm(pipeline: PipelineTask) {
  try {
    const fresh = await pipelineApi.get(pipeline.id)
    confirmPipeline.value = fresh
    showRejectInput.value = false
    rejectComment.value = ''
    showConfirmDialog.value = true
  } catch {
    ElMessage.error('获取 Pipeline 信息失败')
  }
}

async function handleConfirm(pipeline: PipelineTask, approved: boolean) {
  confirming.value = true
  try {
    await pipelineApi.confirm(pipeline.id, approved, rejectComment.value || undefined)
    ElMessage.success(approved ? '已通过' : '已拒绝')
    showConfirmDialog.value = false
    showRejectFromDetail.value = false
    rejectComment.value = ''
    showRejectInput.value = false
    await loadPipelines()
    // Refresh detail if open
    if (showDetailDialog.value && selectedPipeline.value?.id === pipeline.id) {
      selectedPipeline.value = await pipelineApi.get(pipeline.id)
    }
  } catch {
    ElMessage.error('操作失败')
  } finally {
    confirming.value = false
  }
}

// ======================== Changes Dialog ========================
const showChangesDialog = ref(false)
const changesPipeline = ref<PipelineTask | null>(null)
const changesList = ref<PipelineFileChange[]>([])
const changesLoading = ref(false)
const expandedChanges = reactive(new Set<number>())

function changeTypeTag(changeType: string): string {
  const map: Record<string, string> = { CREATE: 'success', MODIFY: 'warning', DELETE: 'danger' }
  return (map[changeType] || 'info') as any
}

function changeTypeLabel(changeType: string): string {
  const map: Record<string, string> = { CREATE: '新增', MODIFY: '修改', DELETE: '删除' }
  return map[changeType] || changeType
}

function toggleChange(id: number) {
  if (expandedChanges.has(id)) {
    expandedChanges.delete(id)
  } else {
    expandedChanges.add(id)
  }
}

async function openChanges(pipeline: PipelineTask) {
  changesPipeline.value = pipeline
  showChangesDialog.value = true
  await refreshChanges()
}

async function refreshChanges() {
  if (!changesPipeline.value) return
  changesLoading.value = true
  try {
    changesList.value = await pipelineApi.getChanges(changesPipeline.value.id)
  } catch {
    ElMessage.error('加载文件变更失败')
  } finally {
    changesLoading.value = false
  }
}

watch(showChangesDialog, (val) => {
  if (!val) {
    changesPipeline.value = null
    changesList.value = []
    expandedChanges.clear()
  }
})

// ======================== Artifacts Dialog ========================
const showArtifactsDialog = ref(false)
const artifactsPipeline = ref<PipelineTask | null>(null)
const artifactsList = ref<PipelineArtifact[]>([])
const artifactsLoading = ref(false)
const expandedArtifacts = reactive(new Set<number>())

function artifactTypeTag(artifactType: string): string {
  const map: Record<string, string> = { READ: '', GENERATED: 'success', INTERMEDIATE: 'warning' }
  return (map[artifactType] || 'info') as any
}

function artifactTypeLabel(artifactType: string): string {
  const map: Record<string, string> = { READ: '读取', GENERATED: '生成', INTERMEDIATE: '中间文件' }
  return map[artifactType] || artifactType
}

function toggleArtifact(id: number) {
  if (expandedArtifacts.has(id)) {
    expandedArtifacts.delete(id)
  } else {
    expandedArtifacts.add(id)
  }
}

async function openArtifacts(pipeline: PipelineTask) {
  artifactsPipeline.value = pipeline
  showArtifactsDialog.value = true
  await refreshArtifacts()
}

async function refreshArtifacts() {
  if (!artifactsPipeline.value) return
  artifactsLoading.value = true
  try {
    artifactsList.value = await pipelineApi.getArtifacts(artifactsPipeline.value.id)
  } catch {
    ElMessage.error('加载过程文件失败')
  } finally {
    artifactsLoading.value = false
  }
}

watch(showArtifactsDialog, (val) => {
  if (!val) {
    artifactsPipeline.value = null
    artifactsList.value = []
    expandedArtifacts.clear()
  }
})

// ======================== Logs Dialog ========================
const showLogDialog = ref(false)
const logs = ref<PipelineLog[]>([])
const logsLoading = ref(false)
const logPipeline = ref<PipelineTask | null>(null)
let logPipelineId: number | null = null
let logTimer: ReturnType<typeof setInterval> | null = null

async function openLogs(pipeline: PipelineTask) {
  logPipelineId = pipeline.id
  logPipeline.value = pipeline
  showLogDialog.value = true
  await refreshLogs()
  if (logTimer) clearInterval(logTimer)
  logTimer = setInterval(refreshLogs, 5000)
}

async function refreshLogs() {
  if (logPipelineId == null) return
  logsLoading.value = true
  try {
    logs.value = await pipelineApi.getLogs(logPipelineId)
  } catch {
    // ignore
  } finally {
    logsLoading.value = false
  }
}

function logLevelType(level: string): string {
  const map: Record<string, string> = { ERROR: 'danger', WARN: 'warning', INFO: 'info', DEBUG: '' }
  return (map[level] || 'info') as any
}

watch(showLogDialog, (val) => {
  if (!val) {
    if (logTimer) { clearInterval(logTimer); logTimer = null }
    logPipelineId = null
    logPipeline.value = null
    logs.value = []
  }
})

// ======================== Common Actions ========================
async function loadPipelines() {
  loading.value = true
  try {
    pipelines.value = await pipelineApi.list()
  } catch {
    ElMessage.error('加载 Pipeline 列表失败')
  } finally {
    loading.value = false
  }
}

async function loadPipelinesData() {
  try {
    return await pipelineApi.list()
  } catch {
    return pipelines.value
  }
}

async function handleStart() {
  const valid = await startFormRef.value?.validate().catch(() => false)
  if (!valid) return
  starting.value = true
  try {
    await pipelineApi.start(startForm.workItemId, undefined, undefined, undefined, undefined, startForm.workflowId)
    ElMessage.success('Pipeline 已启动')
    showStartDialog.value = false
    startForm.workItemId = null
    startForm.workflowId = null
    await loadPipelines()
  } catch (e: any) {
    ElMessage.error('启动失败: ' + (e.message || '未知错误'))
  } finally {
    starting.value = false
  }
}

async function handleRetry(pipeline: PipelineTask) {
  try {
    await pipelineApi.retry(pipeline.id)
    ElMessage.success('Pipeline 已重试')
    await loadPipelines()
  } catch {
    ElMessage.error('重试失败')
  }
}

/** 行操作「更多」下拉命令分发 */
function handleRowCommand(command: string, row: PipelineTask) {
  if (command === 'steps') openSteps(row)
  else if (command === 'changes') openChanges(row)
  else if (command === 'artifacts') openArtifacts(row)
  else if (command === 'logs') openLogs(row)
  else if (command === 'delete') handleDelete(row)
}

async function handleDelete(pipeline: PipelineTask) {
  if (!await confirmDelete(`Pipeline 任务「${pipeline.tfsTitle}」(#${pipeline.tfsWorkItemId})`, '删除确认')) return
  try {
    await pipelineApi.delete(pipeline.id)
    ElMessage.success('删除成功')
    await loadPipelines()
  } catch (e: any) {
    if (e !== 'cancel' && e?.toString() !== 'cancel') {
      ElMessage.error('删除失败')
    }
  }
}

// ======================== Auto-refresh table ========================
let tableTimer: ReturnType<typeof setInterval> | null = null

function startTableAutoRefresh() {
  stopTableAutoRefresh()
  // 启用自动刷新，但只在数据变化时更新
  tableTimer = setInterval(async () => {
    if (showDetailDialog.value) return
    const needsRefresh = pipelines.value.some(
      p => p.status === 'RUNNING' || p.status === 'WAITING_CONFIRM'
    )
    if (needsRefresh) {
      const newPipelines = await loadPipelinesData()
      // 只在数据真正变化时更新
      if (JSON.stringify(pipelines.value) !== JSON.stringify(newPipelines)) {
        pipelines.value = newPipelines
      }
    }
  }, 10000)
}

function stopTableAutoRefresh() {
  if (tableTimer) {
    clearInterval(tableTimer)
    tableTimer = null
  }
}

// ======================== Lifecycle ========================
onMounted(() => {
  loadPipelines()
  loadWorkflows()
  loadTfsServerUrl()
  startTableAutoRefresh()
})

onUnmounted(() => {
  stopTableAutoRefresh()
  stopStepsAutoRefresh()
  stopDetailAutoRefresh()
  if (logTimer) clearInterval(logTimer)
})
</script>

<style scoped>
.pipeline-view {
  padding: 0;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.page-header h2 {
  font-size: 20px;
  font-weight: 600;
}

.pipeline-detail {
  padding: 0 8px;
}

.detail-tab-toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 12px;
  padding: 8px;
  background: var(--el-fill-color);
  border-radius: 4px;
}

.detail-tab-count {
  font-size: 13px;
  color: var(--ink-text-secondary);
}

.stages {
  margin-top: 20px;
}

.stages h4 {
  margin-bottom: 12px;
}

.stage-item {
  font-size: 14px;
}

.stage-output {
  margin-top: 8px;
  max-height: 200px;
  overflow-y: auto;
}

.stage-output pre {
  background: var(--el-fill-color);
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
}

.stage-error {
  margin-top: 8px;
  color: #f56c6c;
  font-size: 13px;
}

.pipeline-error {
  margin-top: 20px;
}

.pipeline-error h4 {
  margin-bottom: 8px;
  color: #f56c6c;
}

.pipeline-error pre {
  background: #fef0f0;
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  color: #f56c6c;
  white-space: pre-wrap;
  word-break: break-all;
}

/* ======================== Steps ======================== */
.steps-toolbar,
.changes-toolbar,
.artifacts-toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.steps-pipeline-info,
.changes-pipeline-info,
.artifacts-pipeline-info {
  font-size: 14px;
  color: var(--ink-text-regular);
}

.changes-count {
  font-size: 13px;
  color: var(--ink-text-secondary);
}

.step-item {
  padding: 4px 0;
}

.step-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.step-type-tag {
  flex-shrink: 0;
}

.step-detail-toggle {
  margin-top: 4px;
}

.step-detail {
  margin-top: 8px;
}

.step-detail pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
}

.step-metadata {
  margin-top: 8px;
}

.step-metadata .metadata-content {
  background: var(--el-fill-color);
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

/* ======================== Confirm ======================== */
.confirm-section {
  margin-top: 20px;
  padding: 16px;
  background: #fdf6ec;
  border-radius: 8px;
  border: 1px solid #faecd8;
}

.confirm-section h4 {
  margin-bottom: 8px;
  color: #e6a23c;
}

.confirm-message pre,
.confirm-message-scroll pre {
  background: #fff;
  padding: 12px;
  border-radius: 4px;
  font-size: 13px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
}

.confirm-message-scroll {
  max-height: 400px;
  overflow-y: auto;
  margin-bottom: 16px;
}

.confirm-actions {
  margin-top: 12px;
  display: flex;
  gap: 12px;
}

.reject-section {
  margin-top: 12px;
}

.confirm-dialog {
  padding: 0 8px;
}

.confirm-dialog-actions {
  display: flex;
  gap: 12px;
  justify-content: center;
  margin-top: 16px;
}

.confirm-reject-section {
  margin-top: 12px;
}

/* ======================== Changes (Diff) ======================== */
.changes-list {
  max-height: 600px;
  overflow-y: auto;
}

.change-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  margin-bottom: 8px;
}

.change-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  background: var(--el-fill-color-light);
  transition: background 0.2s;
}

.change-header:hover {
  background: var(--el-fill-color);
}

.change-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.change-filepath {
  font-family: var(--app-font-mono);
  font-size: 13px;
  color: var(--ink-text);
}

.change-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--ink-text-secondary);
}

.change-meta .el-icon {
  transition: transform 0.2s;
}

.change-meta .el-icon.expanded {
  transform: rotate(90deg);
}

.change-diff {
  padding: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.change-summary {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--ink-text-regular);
}

.diff-container {
  display: flex;
  gap: 12px;
}

.diff-side {
  flex: 1;
  min-width: 0;
}

.diff-label {
  font-size: 12px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--ink-text-regular);
}

.diff-old {
  background: #fef0f0;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #fde2e2;
  color: #f56c6c;
}

.diff-new {
  background: #f0f9eb;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
  border: 1px solid #e1f3d8;
  color: #67c23a;
}

.diff-new-file .diff-label,
.diff-deleted-file .diff-label {
  color: var(--ink-text-secondary);
  font-style: italic;
}

/* ======================== Artifacts ======================== */
.artifacts-list {
  max-height: 600px;
  overflow-y: auto;
}

.artifact-item {
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
  margin-bottom: 8px;
}

.artifact-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 16px;
  cursor: pointer;
  background: var(--el-fill-color-light);
  transition: background 0.2s;
}

.artifact-header:hover {
  background: var(--el-fill-color);
}

.artifact-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.artifact-filepath {
  font-family: var(--app-font-mono);
  font-size: 13px;
  color: var(--ink-text);
}

.artifact-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--ink-text-secondary);
}

.artifact-meta .el-icon {
  transition: transform 0.2s;
}

.artifact-meta .el-icon.expanded {
  transform: rotate(90deg);
}

.artifact-content {
  padding: 16px;
  border-top: 1px solid var(--el-border-color-lighter);
}

.artifact-summary {
  margin-bottom: 12px;
  font-size: 13px;
  color: var(--ink-text-regular);
}

.artifact-code pre {
  background: #1e1e1e;
  color: #d4d4d4;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 400px;
  overflow-y: auto;
}

.artifact-no-content {
  color: var(--ink-text-secondary);
  font-size: 13px;
  text-align: center;
  padding: 16px;
}

/* ======================== Logs List ======================== */
.logs-toolbar {
  margin-bottom: 16px;
  display: flex;
  align-items: center;
  gap: 12px;
}

.logs-pipeline-info {
  font-size: 14px;
  color: var(--ink-text-regular);
}

.logs-count {
  font-size: 13px;
  color: var(--ink-text-secondary);
}

.logs-list {
  max-height: 600px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  border-radius: 4px;
}

.log-item {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 6px 12px;
  font-size: 13px;
  border-bottom: 1px solid var(--el-fill-color);
  font-family: var(--app-font-mono);
}

.log-item:last-child {
  border-bottom: none;
}

.log-item:hover {
  background: var(--el-fill-color);
}

.log-timestamp {
  color: var(--ink-text-secondary);
  flex-shrink: 0;
  font-size: 12px;
}

.log-level-tag {
  flex-shrink: 0;
  min-width: 50px;
  text-align: center;
}

.log-message {
  white-space: pre-wrap;
  word-break: break-all;
  color: var(--ink-text);
}

.log-level-error .log-message {
  color: #f56c6c;
}

.log-level-warn .log-message {
  color: #e6a23c;
}

/* ======================== Workflow Nodes ======================== */
.workflow-nodes {
  margin-top: 16px;
}

.workflow-node-item {
  padding: 4px 0;
}

.workflow-node-header {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.current-node {
  background: var(--el-color-primary-light-9);
  border-radius: 8px;
  padding: 8px;
  border: 2px solid var(--el-color-primary);
}

.node-running-indicator {
  display: flex;
  align-items: center;
  gap: 4px;
  margin-top: 8px;
  color: var(--el-color-primary);
  font-size: 13px;
}

.node-running-indicator .is-loading {
  animation: rotating 2s linear infinite;
}

@keyframes rotating {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.workflow-node-output {
  margin-top: 8px;
}

.node-output-content pre {
  background: var(--el-fill-color);
  padding: 8px;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
}

.workflow-node-error {
  margin-top: 8px;
  color: #f56c6c;
  font-size: 13px;
}

/* ======================== Node Logs (expandable) ======================== */
.node-logs {
  margin-top: 12px;
  padding: 8px 12px;
  background: var(--el-fill-color);
  border-radius: 6px;
  max-height: 400px;
  overflow-y: auto;
}

.node-log-item {
  padding: 4px 0;
  border-bottom: 1px solid var(--el-border-color-lighter);
  font-size: 13px;
}

.node-log-item:last-child {
  border-bottom: none;
}

.node-log-title {
  margin: 0 8px;
}

.node-log-detail {
  margin-top: 4px;
  cursor: pointer;
  color: var(--ink-text-secondary);
  font-size: 12px;
}

.node-log-detail pre {
  margin: 4px 0;
  padding: 8px;
  background: #fff;
  border-radius: 4px;
  font-size: 12px;
  max-height: 200px;
  overflow: auto;
  white-space: pre-wrap;
  word-break: break-all;
}

.node-supplemental-input {
  margin-top: 12px;
  padding: 12px;
  background: #fdf6ec;
  border: 1px solid #faecd8;
  border-radius: 6px;
}

.node-supplemental-label {
  font-size: 13px;
  font-weight: 600;
  color: #e6a23c;
  margin-bottom: 8px;
}

.node-supplemental-input pre {
  background: #fff;
  padding: 12px;
  border-radius: 4px;
  font-size: 12px;
  white-space: pre-wrap;
  word-break: break-all;
  max-height: 200px;
  overflow-y: auto;
  border: 1px solid var(--el-border-color-lighter);
  margin: 0;
}

.tfs-link:hover {
  text-decoration: underline;
}
</style>
