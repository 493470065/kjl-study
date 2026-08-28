<template>
  <div class="task-type-section">
    <div class="section-header">
      <span class="section-title">任务类型</span>
      <el-button size="small" text type="primary" @click="$emit('manage')">
        <el-icon style="margin-right: 4px"><Setting /></el-icon>类型管理
      </el-button>
    </div>
    <el-row :gutter="16">
      <el-col v-for="t in taskTypes" :key="t.id" :xs="24" :sm="12" :md="8" :lg="6">
        <el-card shadow="hover" :class="['type-card', { 'type-card--disabled': !t.enabled }]">
          <div class="type-card__head">
            <span class="type-card__icon">{{ t.icon || '⚙️' }}</span>
            <span class="type-card__name">{{ t.name }}</span>
            <el-tag size="small" :type="t.enabled ? 'success' : 'info'" effect="plain">
              {{ t.enabled ? '可用' : '停用' }}
            </el-tag>
          </div>
          <div class="type-card__desc">{{ t.description || '暂无描述' }}</div>
          <div class="type-card__binding">
            <el-tag v-if="t.skillName" size="small" type="info">Skill: {{ t.skillName }}</el-tag>
            <el-tag v-else-if="t.workflowDefinitionId" size="small" type="info">工作流 #{{ t.workflowDefinitionId }}</el-tag>
            <el-tag v-if="t.model" size="small" effect="plain" style="margin-left: 4px">{{ t.model }}</el-tag>
            <span v-else-if="t.skillName" class="type-card__model-hint">（全局模型）</span>
          </div>
          <div class="type-card__actions">
            <el-button type="primary" size="small" :disabled="!t.enabled" @click="$emit('launch', t)">
              启动
            </el-button>
          </div>
        </el-card>
      </el-col>

      <!-- 内置：自定义任务（保留原 TFS 需求号 + 工作流 启动方式） -->
      <el-col :xs="24" :sm="12" :md="8" :lg="6">
        <el-card shadow="hover" class="type-card type-card--custom" @click="$emit('launch', null)">
          <div class="type-card__head">
            <span class="type-card__icon">🧩</span>
            <span class="type-card__name">自定义任务</span>
          </div>
          <div class="type-card__desc">自由选择 TFS 需求号与工作流启动，适合临时性 / 调试场景</div>
          <div class="type-card__actions">
            <el-button size="small">启动</el-button>
          </div>
        </el-card>
      </el-col>
    </el-row>
  </div>
</template>

<script setup lang="ts">
import { Setting } from '@element-plus/icons-vue'
import type { AutomateTaskType } from '@/api/automate'

defineProps<{
  taskTypes: AutomateTaskType[]
}>()

defineEmits<{
  (e: 'launch', type: AutomateTaskType | null): void
  (e: 'manage'): void
}>()
</script>

<style scoped>
.task-type-section {
  margin-bottom: 20px;
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.section-title {
  font-size: 15px;
  font-weight: 600;
  color: #1e293b;
}

.type-card {
  margin-bottom: 16px;
  border-radius: 10px;
  transition: border-color 0.2s;
}

.type-card:hover {
  border-color: #a5b4fc;
}

.type-card--disabled {
  opacity: 0.55;
}

.type-card--custom {
  border-style: dashed;
  cursor: pointer;
}

.type-card__head {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
}

.type-card__icon {
  font-size: 20px;
}

.type-card__name {
  font-weight: 600;
  font-size: 14px;
  color: #303133;
  flex: 1;
}

.type-card__desc {
  font-size: 12px;
  color: #909399;
  line-height: 1.6;
  min-height: 38px;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.type-card__binding {
  margin: 8px 0;
  min-height: 22px;
}

.type-card__model-hint {
  font-size: 12px;
  color: #c0c4cc;
}

.type-card__actions {
  display: flex;
  justify-content: flex-end;
}
</style>
