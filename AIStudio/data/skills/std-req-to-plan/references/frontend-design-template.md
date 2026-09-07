# 前端设计文档

## 一、设计概述

| 字段 | 内容 |
|------|------|
| 需求编号 | [工作项ID] |
| 技术栈 | Vue 3 + WinDesign 3.0 (win-design-next) + TypeScript |
| UI 框架 | WinDesign Next (w3- 组件前缀) |
| 设计日期 | [日期] |

### 1.1 WinDesign 3.0 设计规范

> 官方文档: http://wued.winning-health.com.cn:8088/win-design-next/

**设计稿标准:**
- 标准尺寸: 1920 x 1080px
- 最小适配尺寸: 1366 x 768px
- 基础字号: 14px，小字: 12px，标题: 16px
- 间距规范: 16px / 12px / 8px / 4px

**主题色 (CSS 变量):**
```css
--w3-color-primary: #2d5afa;           /* 主题蓝 */
--w3-color-success: #00ab44;           /* 成功绿 */
--w3-color-warning: #ff8c00;           /* 警告黄 */
--w3-color-danger: #ec0000;            /* 危险红 */
--w3-color-info: #999999;              /* 信息灰 */
--w3-bg-color: #ffffff;                /* 页面背景 */
--w3-bg-color-page: var(--w3-color-primary-plain); /* 页面底色 */
--w3-font-color-normal: #000000;       /* 主文字 */
--w3-font-color-second: #666666;       /* 次文字 */
--w3-font-color-third: #999999;        /* 辅助文字 */
--w3-border-color: #c9c9c9;            /* 边框色 */
```

### 1.2 设计原则
- 使用 WinDesign Next 组件库 (`w-` 前缀组件)，优先使用组件库提供的组件而非自行实现
- 复用项目现有组件和工具函数，遵循项目已有的编码规范和目录结构
- 组件设计保持单一职责，Composition API 风格编写
- 使用 TypeScript 增强类型安全

### 1.3 WinDesign Next 组件映射表

| 功能 | 组件标签 | 备注 |
|------|---------|------|
| 按钮 | `<w-button>` | type: primary/success/warning/danger/text |
| 输入框 | `<w-input>` | clearable, prefix-icon, suffix-icon |
| 选择器 | `<w-select>` + `<w-option>` | |
| 日期选择 | `<w-date-picker>` | type: date/datetime/month/year |
| 数字输入 | `<w-input-number>` | :min, :max, :step |
| 文本域 | `<w-input type="textarea">` | :rows |
| 表单 | `<w-form>` | :model, :rules, label-width |
| 表单项 | `<w-form-item>` | label, prop |
| 表格 | `<w-table>` | :data, border, stripe, 使用 min-width |
| 表格列 | `<w-table-column>` | prop, label, min-width |
| 分页 | `<w-pagination>` | :current-page, :page-size, :total |
| 对话框 | `<w-dialog>` | v-model 控制显示, title, width |
| 面板 | `<w-panel>` | title, :collapsible |
| 标签页 | `<w-tabs>` | v-model |
| 标签页面 | `<w-tab-pane>` | label, name |
| 栅格 | `<w-row>` + `<w-col>` | :gutter, :span (24格) |
| 单选 | `<w-radio-group>` + `<w-radio>` | v-model, label |
| 多选 | `<w-checkbox-group>` + `<w-checkbox>` | v-model, label |
| 开关 | `<w-switch>` | v-model |
| 描述列表 | `<w-descriptions>` + `<w-descriptions-item>` | :column, border |
| 卡片 | `<w-card>` | shadow: hover/never |
| 步骤 | `<w-steps>` + `<w-step>` | :active, title, description |
| 标签 | `<w-tag>` | type: success/info/warning/danger |
| 菜单 | `<w-menu>` + `<w-menu-item>` | :default-active |
| 时间线 | `<w-timeline>` + `<w-timeline-item>` | timestamp |
| 分割线 | `<w-divider>` | |

---

## 二、页面/组件结构

### 2.1 页面清单

| 页面 | 路由 | 说明 | 新增/修改 |
|------|------|------|----------|
| [页面名] | /path | [说明] | 新增 |
| [页面名] | /path | [说明] | 修改 |

### 2.2 新增组件清单

| 组件名 | 路径 | 说明 |
|--------|------|------|
| [ComponentName] | src/components/xxx/ | [用途说明] |

### 2.3 修改组件清单

| 组件名 | 路径 | 修改内容 |
|--------|------|---------|
| [ComponentName] | src/components/xxx/ | [修改说明] |

---

## 三、路由设计

### 3.1 新增路由

```typescript
// router 配置 (Vue Router 4)
{
  path: '/[route-path]',
  name: '[RouteName]',
  component: () => import('@/views/[path]'),
  meta: {
    title: '[页面标题]',
    requiresAuth: true,
    // 其他 meta 信息
  }
}
```

### 3.2 路由变更

[描述路由的修改，如参数变更、守卫变更等]

---

## 四、状态管理设计

### 4.1 Store 模块

```typescript
// stores/[moduleName].ts (Pinia)
import { defineStore } from 'pinia'

export const useModuleStore = defineStore('moduleName', () => {
  // state
  // actions
  // getters
})
```

| State 字段 | 类型 | 说明 |
|------------|------|------|
| [fieldName] | [type] | [说明] |

### 4.2 数据流图

```
Component → Store Action → API调用 → State更新 → 视图更新
```

[描述关键数据在组件间的流转]

---

## 五、API 调用层

### 5.1 API 函数定义

```typescript
// api/[moduleName].ts
import request from '@/utils/request'
import type { [RequestType], [ResponseType] } from '@/types/[moduleName]'

// [接口说明]
export function apiName(params: [RequestType]): Promise<[ResponseType]> {
  return request({
    url: '/api/v1/xxx',
    method: 'get',
    params
  })
}
```

### 5.2 请求/响应拦截

[是否需要特殊的请求拦截或响应处理]

---

## 六、组件详细设计

### 6.1 [组件名]

**文件路径:** `src/[path]/[ComponentName].vue`

**组件结构 (Composition API + `<script setup>`):**
```vue
<template>
  <!-- 使用 w- 前缀的 WinDesign Next 组件 -->
  <w-form :model="form" :rules="rules" label-width="100px">
    <w-form-item label="字段名" prop="fieldName">
      <w-input v-model="form.fieldName" placeholder="请输入" clearable />
    </w-form-item>
  </w-form>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'

// Props & Emits
interface Props {
  // ...
}
const props = defineProps<Props>()
const emit = defineEmits<{
  // ...
}>()

// 响应式数据
const form = reactive({
  // ...
})

// 方法
const handleSubmit = () => {
  // ...
}
</script>
```

**Props:**
| 属性 | 类型 | 必填 | 说明 |
|------|------|------|------|
| [propName] | [type] | 是/否 | [说明] |

**Events:**
| 事件名 | 参数 | 说明 |
|--------|------|------|
| [eventName] | [params] | [说明] |

**WinDesign 组件使用要点:**
- 使用 `<script setup lang="ts">` 语法
- 组件使用 `w-` 前缀 (如 `<w-button>`, `<w-table>`)
- 表格列使用 `min-width` 而非固定 `width`，配合 `table-layout: auto`
- 对话框使用 `v-model` 控制显示 (Vue 3 写法)
- 表单验证使用 `:rules` 和 `ref` 获取 form 实例

**关键交互逻辑:**
[描述用户操作后的交互流程]

---

## 七、新增依赖

| 依赖包 | 版本 | 用途 |
|--------|------|------|
| [package] | [version] | [用途说明] |

> 注意：WinDesign Next 已包含大部分常用组件，优先使用组件库组件而非引入第三方库

---

## 八、注意事项

- [需要注意的兼容性问题]
- [需要注意的性能问题]
- [需要和后端联调的接口]
- 所有组件必须使用 WinDesign Next 的 `w-` 前缀组件
- 使用 TypeScript 类型定义，保持类型安全
