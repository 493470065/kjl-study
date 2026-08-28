<template>
  <div class="sandbox-view">
    <div class="page-header">
      <h2>沙箱管理</h2>
      <el-button @click="loadData">刷新</el-button>
    </div>

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
              {{ row.status }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="操作" width="120">
          <template #default="{ row }">
            <el-popconfirm
              title="确定销毁此沙箱？"
              @confirm="handleDestroy(row.taskId)"
            >
              <template #reference>
                <el-button size="small" type="danger">销毁</el-button>
              </template>
            </el-popconfirm>
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
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { ElMessage } from 'element-plus'
import { sandboxApi, SandboxInfo, SandboxStatus } from '@/api/sandbox'

const sandboxStatus = ref<SandboxStatus>({ enabled: false })
const activeSandboxes = ref<SandboxInfo[]>([])

function getStatusType(status: string): 'success' | 'warning' | 'danger' | 'info' {
  switch (status) {
    case 'RUNNING': return 'success'
    case 'CREATING': return 'warning'
    case 'ERROR': return 'danger'
    default: return 'info'
  }
}

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
  try {
    await sandboxApi.destroySandbox(taskId)
    ElMessage.success('沙箱已销毁')
    await loadData()
  } catch (e: any) {
    ElMessage.error('销毁失败')
  }
}

onMounted(loadData)
</script>

<style scoped>
.sandbox-view {
  padding: 20px;
}

.page-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.page-header h2 {
  margin: 0;
  font-size: 18px;
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
  background: #f5f7fa;
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
  font-family: monospace;
  font-size: 12px;
  color: #999;
  margin-left: 8px;
}
</style>
