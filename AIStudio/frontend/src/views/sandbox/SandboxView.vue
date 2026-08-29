<template>
  <page-container title="沙箱管理" no-card>
    <template #actions>
      <el-button @click="loadData">刷新</el-button>
    </template>

    <el-card class="status-card">
      <template #header>
        <span>沙箱状态</span>
      </template>
      <el-descriptions :column="1" border>
        <el-descriptions-item label="启用状态">
          <el-tag :type="sandboxStatus.enabled ? 'success' : 'info'">
            {{ sandboxStatus.enabled ? '已启用' : '未启用' }}
          </el-tag>
        </el-descriptions-item>
      </el-descriptions>
      <div v-if="!sandboxStatus.enabled" class="hint">
        沙箱功能未在 application.yml 中启用。设置 agentos.sandbox.enabled: true 以启用。
      </div>
    </el-card>

    <el-card v-if="sandboxStatus.enabled" class="active-card">
      <template #header>
        <div class="card-header">
          <span>活跃沙箱</span>
          <el-tag>{{ activeSandboxes.length }}</el-tag>
        </div>
      </template>

      <el-table :data="activeSandboxes" stripe v-if="activeSandboxes.length > 0">
        <el-table-column prop="taskId" label="任务 ID" />
        <el-table-column prop="status" label="状态">
          <template #default="{ row }">
            <el-tag :type="getStatusType(row.status)" size="small">
              {{ getStatusLabel(row.status) }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-button size="small" type="danger" @click="handleDestroy(row.taskId)">销毁</el-button>
          </template>
        </el-table-column>
      </el-table>

      <el-empty v-else description="暂无活跃沙箱" />
    </el-card>

    <el-card class="config-card">
      <template #header>
        <span>配置说明</span>
      </template>
      <div class="config-info">
        <p><strong>基础镜像：</strong>agentos-sandbox:latest</p>
        <p class="build-hint">构建镜像：docker build -f Dockerfile.sandbox -t agentos-sandbox:latest .</p>
        <p><strong>资源限制：</strong></p>
        <ul>
          <li>内存：512MB</li>
          <li>CPU：1 核</li>
          <li>网络：none（无网络隔离）</li>
          <li>超时：600 秒</li>
        </ul>
        <p><strong>安全特性：</strong></p>
        <ul>
          <li>只读根文件系统</li>
          <li>仅工作目录可写</li>
          <li>网络隔离</li>
          <li>资源限制</li>
        </ul>
      </div>
    </el-card>
  </page-container>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { useStatusTag } from '@/composables/useStatusTag'
import { useConfirmDelete } from '@/composables/useConfirmDelete'

const { confirmDelete } = useConfirmDelete()
import { sandboxApi, SandboxInfo, SandboxStatus } from '@/api/sandbox'

const sandboxStatus = ref<SandboxStatus>({ enabled: false })
const activeSandboxes = ref<SandboxInfo[]>([])

// 状态徽章统一走全站映射（修正原 RUNNING=success 的语义错误）
const { statusType: getStatusType, statusLabel: getStatusLabel } = useStatusTag()

async function loadData() {
  try {
    sandboxStatus.value = await sandboxApi.getStatus()
    if (sandboxStatus.value.enabled) {
      activeSandboxes.value = await sandboxApi.listActive()
    }
  } catch (e: any) {
    ElMessage.error('加载沙箱状态失败')
  }
}

async function handleDestroy(taskId: string) {
  if (!await confirmDelete('该沙箱', '销毁确认')) return
  try {
    await sandboxApi.destroySandbox(taskId)
    ElMessage.success('沙箱已销毁')
    await loadData()
  } catch {
    // 接口错误已由统一错误出口提示
  }
}

onMounted(loadData)
</script>

<style scoped>
.sandbox-view {
  padding: 20px;
}



.status-card, .active-card, .config-card {
  margin-bottom: 16px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.hint {
  margin-top: 12px;
  padding: 12px;
  background: var(--el-fill-color);
  border-radius: 4px;
  color: #666;
  font-size: 13px;
}

.config-info {
  font-size: 14px;
  line-height: 1.8;
}

.config-info p {
  margin: 8px 0;
}

.config-info ul {
  margin: 4px 0 8px 20px;
}

.build-hint {
  font-family: var(--app-font-mono);
  font-size: 12px;
  color: var(--ink-text-secondary);
  margin-left: 8px;
}
</style>
