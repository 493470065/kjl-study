# WinDesign Next 组件库速查参考

> 本文件包含前端设计所需的核心信息（设计规范、高频组件速查、典型布局模式）。
> 如需特定组件的详细 API（如所有 props/events/slots），读取 `wd-components/` 目录下对应的组件文件。
> **严禁读取已废弃的 win-design-next-docs.md（1.3MB / 36879 行），会导致上下文溢出。**

---

## 一、设计规范

### 1.1 尺寸与字体

| 项目 | 值 |
|------|---|
| 标准尺寸 | 1920 × 1080px |
| 最小适配 | 1366 × 768px |
| 基础字号 | 14px |
| 小字 | 12px |
| 标题 | 16px |
| 间距规范 | 16px / 12px / 8px / 4px |

### 1.2 CSS 变量（主题色）

```css
--w3-color-primary: #2d5afa;           /* 主题蓝 */
--w3-color-primary-hover: #5175f4;
--w3-color-primary-press: #1d39c4;
--w3-color-primary-plain: #eaeefe;
--w3-color-primary-active-bg: #c9d6fb;
--w3-color-success: #00ab44;           /* 成功绿 */
--w3-color-warning: #ff8c00;           /* 警告黄 */
--w3-color-danger: #ec0000;            /* 危险红 */
--w3-color-error: #ec0000;             /* 错误红 */
--w3-color-info: #999999;              /* 信息灰 */
--w3-bg-color: #ffffff;                /* 页面背景 */
--w3-bg-color-page: var(--w3-color-primary-plain);
--w3-font-color-normal: #000000;       /* 主文字 */
--w3-font-color-second: #666666;       /* 次文字 */
--w3-font-color-third: #999999;        /* 辅助文字 */
--w3-border-color: #c9c9c9;            /* 边框色 */
```

### 1.3 组件引入方式

```typescript
// 完整引入（推荐）
import WinDesign from 'win-design-next'
import 'win-design-next/dist/index.css'
app.use(WinDesign)
```

---

## 二、高频组件速查

> 列出设计中最常用的组件及其核心用法。组件标签统一使用 `w-` 前缀。

### 2.1 表单类

**w-form 表单**
```vue
<w-form :model="form" :rules="rules" ref="formRef" label-width="100px">
  <w-form-item label="字段名" prop="fieldName">
    <w-input v-model="form.fieldName" placeholder="请输入" clearable />
  </w-form-item>
</w-form>
```
- 验证: `formRef.value.validate()` / `formRef.value.resetFields()`
- 行内验证: `:rules` 中 `required`, `min`, `max`, `pattern`, `validator`

**w-input 输入框**
```vue
<w-input v-model="value" placeholder="请输入" clearable />
<w-input type="textarea" v-model="value" :rows="4" />
```
- 常用属性: `clearable`, `disabled`, `maxlength`, `show-word-limit`, `prefix-icon`, `suffix-icon`

**w-select 选择器**
```vue
<w-select v-model="value" placeholder="请选择" clearable filterable>
  <w-option v-for="item in options" :key="item.value" :label="item.label" :value="item.value" />
</w-select>
```
- 常用属性: `clearable`, `filterable`, `multiple`, `disabled`

**w-date-picker 日期选择**
```vue
<w-date-picker v-model="date" type="date" placeholder="选择日期" />
<w-date-picker v-model="range" type="daterange" start-placeholder="开始" end-placeholder="结束" />
```
- type: `date` / `datetime` / `month` / `year` / `daterange` / `datetimerange`

**w-input-number 数字输入**
```vue
<w-input-number v-model="num" :min="0" :max="100" :step="1" />
```

**w-radio / w-checkbox**
```vue
<w-radio-group v-model="radio">
  <w-radio :label="1">选项1</w-radio>
  <w-radio :label="2">选项2</w-radio>
</w-radio-group>

<w-checkbox-group v-model="checked">
  <w-checkbox :label="1">选项1</w-checkbox>
  <w-checkbox :label="2">选项2</w-checkbox>
</w-checkbox-group>
```

**w-switch 开关**
```vue
<w-switch v-model="enabled" active-text="开" inactive-text="关" />
```

### 2.2 数据展示类

**w-table 表格**
```vue
<w-table :data="tableData" border stripe>
  <w-table-column prop="name" label="名称" min-width="120" />
  <w-table-column prop="status" label="状态" min-width="80">
    <template #default="{ row }">
      <w-tag :type="row.status === 1 ? 'success' : 'danger'">
        {{ row.status === 1 ? '启用' : '禁用' }}
      </w-tag>
    </template>
  </w-table-column>
  <w-table-column label="操作" min-width="150" fixed="right">
    <template #default="{ row }">
      <w-button type="primary" text @click="handleEdit(row)">编辑</w-button>
      <w-button type="danger" text @click="handleDelete(row)">删除</w-button>
    </template>
  </w-table-column>
</w-table>
```
- 使用 `min-width` 而非 `width`，配合响应式
- `fixed="right"` 固定操作列
- 排序: `sortable` 属性
- 选择列: `type="selection"` 列 + `@selection-change` 事件

**w-pagination 分页**
```vue
<w-pagination
  v-model:current-page="page.pageNum"
  v-model:page-size="page.pageSize"
  :total="total"
  :page-sizes="[10, 20, 50, 100]"
  layout="total, sizes, prev, pager, next, jumper"
/>
```

**w-descriptions 描述列表**
```vue
<w-descriptions :column="2" border>
  <w-descriptions-item label="名称">{{ data.name }}</w-descriptions-item>
  <w-descriptions-item label="状态">{{ data.status }}</w-descriptions-item>
</w-descriptions>
```

**w-tag 标签**
```vue
<w-tag type="success">启用</w-tag>
<w-tag type="danger">禁用</w-tag>
<w-tag type="warning">待审</w-tag>
<w-tag type="info">草稿</w-tag>
```

### 2.3 反馈类

**w-dialog 对话框**
```vue
<w-dialog v-model="dialogVisible" title="标题" width="600px" :before-close="handleClose">
  <!-- 内容 -->
  <template #footer>
    <w-button @click="dialogVisible = false">取消</w-button>
    <w-button type="primary" @click="handleConfirm">确认</w-button>
  </template>
</w-dialog>
```
- Vue 3 写法: 使用 `v-model` 控制显示（不是 `:visible.sync`）

**w-drawer 抽屉**
```vue
<w-drawer v-model="drawerVisible" title="标题" size="50%">
  <!-- 内容 -->
</w-drawer>
```

**w-message 消息提示**
```typescript
import { WMessage } from 'win-design-next'
WMessage.success('操作成功')
WMessage.error('操作失败')
WMessage.warning('警告信息')
WMessage.info('提示信息')
```

**w-message-box 确认框**
```typescript
import { WMessageBox } from 'win-design-next'
WMessageBox.confirm('确定删除吗？', '提示', { type: 'warning' })
  .then(() => { /* 确认 */ })
  .catch(() => { /* 取消 */ })
```

### 2.4 布局类

**w-row / w-col 栅格**
```vue
<w-row :gutter="16">
  <w-col :span="12">左半</w-col>
  <w-col :span="12">右半</w-col>
</w-row>
```

**w-panel 面板**
```vue
<w-panel title="面板标题" :collapsible="true">
  <!-- 内容 -->
</w-panel>
```

**w-tabs 标签页**
```vue
<w-tabs v-model="activeTab">
  <w-tab-pane label="标签1" name="tab1">内容1</w-tab-pane>
  <w-tab-pane label="标签2" name="tab2">内容2</w-tab-pane>
</w-tabs>
```

**w-card 卡片**
```vue
<w-card shadow="hover">
  <template #header>标题</template>
  <!-- 内容 -->
</w-card>
```

**w-steps 步骤条**
```vue
<w-steps :active="activeStep">
  <w-step title="步骤1" description="描述" />
  <w-step title="步骤2" />
  <w-step title="步骤3" />
</w-steps>
```

### 2.5 其他常用

**w-button 按钮**
```vue
<w-button type="primary">主要按钮</w-button>
<w-button type="success">成功</w-button>
<w-button type="warning">警告</w-button>
<w-button type="danger">危险</w-button>
<w-button type="text">文字按钮</w-button>
<w-button :loading="loading" :disabled="disabled">加载中</w-button>
```

**w-upload 上传**
```vue
<w-upload action="/api/upload" :limit="1" :on-success="handleSuccess">
  <w-button type="primary">点击上传</w-button>
</w-upload>
```

**w-tooltip 文字提示**
```vue
<w-tooltip content="提示内容" placement="top">
  <w-button>悬浮提示</w-button>
</w-tooltip>
```

**w-divider 分割线**
```vue
<w-divider>分隔文字</w-divider>
```

**w-timeline 时间线**
```vue
<w-timeline>
  <w-timeline-item timestamp="2026-01-01">事件1</w-timeline-item>
  <w-timeline-item timestamp="2026-01-02">事件2</w-timeline-item>
</w-timeline>
```

---

## 三、典型页面布局模式

### 3.1 列表页（查询+表格+分页）

```vue
<template>
  <w-panel title="XX管理">
    <!-- 查询区域 -->
    <w-form :model="queryForm" inline>
      <w-form-item label="名称">
        <w-input v-model="queryForm.name" placeholder="请输入" clearable />
      </w-form-item>
      <w-form-item>
        <w-button type="primary" @click="handleQuery">查询</w-button>
        <w-button @click="handleReset">重置</w-button>
        <w-button type="primary" @click="handleAdd">新增</w-button>
      </w-form-item>
    </w-form>

    <!-- 表格 -->
    <w-table :data="tableData" border stripe v-loading="loading">
      <w-table-column type="index" label="序号" width="60" />
      <!-- 数据列 -->
      <w-table-column label="操作" min-width="150" fixed="right">
        <template #default="{ row }">
          <w-button type="primary" text @click="handleEdit(row)">编辑</w-button>
          <w-button type="danger" text @click="handleDelete(row)">删除</w-button>
        </template>
      </w-table-column>
    </w-table>

    <!-- 分页 -->
    <div style="margin-top: 16px; text-align: right;">
      <w-pagination
        v-model:current-page="page.pageNum"
        v-model:page-size="page.pageSize"
        :total="total"
        layout="total, sizes, prev, pager, next, jumper"
      />
    </div>
  </w-panel>
</template>
```

### 3.2 表单弹窗

```vue
<w-dialog v-model="dialogVisible" :title="dialogTitle" width="600px">
  <w-form ref="formRef" :model="form" :rules="rules" label-width="100px">
    <w-form-item label="名称" prop="name">
      <w-input v-model="form.name" maxlength="50" show-word-limit />
    </w-form-item>
  </w-form>
  <template #footer>
    <w-button @click="dialogVisible = false">取消</w-button>
    <w-button type="primary" :loading="submitting" @click="handleSubmit">确认</w-button>
  </template>
</w-dialog>
```

---

## 四、组件详细 API 文件索引

> 当精简参考不够用时，按以下映射读取 `wd-components/` 目录下对应的组件文件获取完整 API。

| 组件 | 标签 | 文件 | 说明 |
|------|------|------|------|
| Button | `<w-button>` | `button.md` | 按钮 + ButtonGroup |
| Form | `<w-form>` | `form-input.md` | 表单（含验证） |
| Input | `<w-input>` | `form-input.md` | 输入框 |
| InputNumber | `<w-input-number>` | `form-input.md` | 数字输入 |
| InputTag | `<w-input-tag>` | `form-input.md` | 标签输入 |
| Select | `<w-select>` | `select.md` | 选择器 |
| Cascader | `<w-cascader>` | `select.md` | 级联选择 |
| Checkbox | `<w-checkbox>` | `checkbox-radio-switch.md` | 多选 |
| Radio | `<w-radio>` | `checkbox-radio-switch.md` | 单选 |
| Switch | `<w-switch>` | `checkbox-radio-switch.md` | 开关 |
| Rate | `<w-rate>` | `checkbox-radio-switch.md` | 评分 |
| DatePicker | `<w-date-picker>` | `date-time.md` | 日期选择 |
| DateTimePicker | `<w-date-time-picker>` | `date-time.md` | 日期时间 |
| TimePicker | `<w-time-picker>` | `date-time.md` | 时间选择 |
| TimeSelect | `<w-time-select>` | `date-time.md` | 时间选择 |
| Calendar | `<w-calendar>` | `date-time.md` | 日历 |
| Table | `<w-table>` | `table.md` | 表格 |
| TableSelect | `<w-table-select>` | `table.md` | 下拉表格 |
| VirtualTable | `<w-virtual-table>` | `table.md` | 虚拟化表格 |
| Pagination | `<w-pagination>` | `other.md` | 分页 |
| Dialog | `<w-dialog>` | `dialog-modal.md` | 对话框 |
| Modal | `<w-modal>` | `dialog-modal.md` | 模态框 |
| Drawer | `<w-drawer>` | `dialog-modal.md` | 抽屉 |
| Popover | `<w-popover>` | `dialog-modal.md` | 悬浮框 |
| Popconfirm | `<w-popconfirm>` | `dialog-modal.md` | 二次确认 |
| Tooltip | `<w-tooltip>` | `dialog-modal.md` | 文字提示 |
| Message | `WMessage` | `message-feedback.md` | 消息提示 |
| MessageBox | `WMessageBox` | `message-feedback.md` | 确认框 |
| Notification | `WNotification` | `message-feedback.md` | 通知 |
| Alert | `<w-alert>` | `message-feedback.md` | 提示 |
| Loading | `v-loading` | `message-feedback.md` | 加载指令 |
| Menu | `<w-menu>` | `nav.md` | 菜单 |
| Tabs | `<w-tabs>` | `nav.md` | 标签页 |
| Dropdown | `<w-dropdown>` | `nav.md` | 下拉菜单 |
| Breadcrumb | `<w-breadcrumb>` | `nav.md` | 面包屑 |
| Anchor | `<w-anchor>` | `nav.md` | 锚点 |
| Card | `<w-card>` | `data-display.md` | 卡片 |
| Descriptions | `<w-descriptions>` | `data-display.md` | 描述列表 |
| Badge | `<w-badge>` | `data-display.md` | 徽章 |
| Tag | `<w-tag>` | `data-display.md` | 标签 |
| Steps | `<w-steps>` | `data-display.md` | 步骤条 |
| Timeline | `<w-timeline>` | `data-display.md` | 时间线 |
| Progress | `<w-progress>` | `data-display.md` | 进度条 |
| Skeleton | `<w-skeleton>` | `data-display.md` | 骨架屏 |
| Image | `<w-image>` | `data-display.md` | 图片 |
| Statistic | `<w-statistic>` | `data-display.md` | 统计组件 |
| Status | `<w-status>` | `data-display.md` | 状态 |
| Result | `<w-result>` | `data-display.md` | 结果 |
| Avatar | `<w-avatar>` | `data-display.md` | 头像 |
| Container | `<w-container>` | `layout.md` | 布局容器 |
| Layout | `<w-row>` | `layout.md` | 栅格布局 |
| Divider | `<w-divider>` | `layout.md` | 分割线 |
| Scrollbar | `<w-scrollbar>` | `layout.md` | 滚动条 |
| Upload | `<w-upload>` | `upload-transfer.md` | 上传 |
| Transfer | `<w-transfer>` | `upload-transfer.md` | 穿梭框 |
| Tree | `<w-tree>` | `tree.md` | 树形控件 |
| TreeSelect | `<w-tree-select>` | `tree.md` | 树形选择 |
| Slider | `<w-slider>` | `other.md` | 滑块 |
| Mention | `<w-mention>` | `other.md` | 提及 |
