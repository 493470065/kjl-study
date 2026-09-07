## Box 盒子

通常情况下, 圆角为 4px。

### 示例

:::demo

```vue
<template>
  <w-row :gutter="12" class="demo-radius">
    <w-col
      v-for="(radius, i) in radiusGroup"
      :key="i"
      :span="6"
      :xs="{ span: 12 }"
    >
      <div class="title">{{ radius.name }}</div>
      <div class="value">
        <code>
          border-radius:
          {{
            radius.type
              ? useCssVar(`--w3-border-radius-${radius.type}`)
              : '"0px"'
          }}
        </code>
      </div>
      <div
        class="radius"
        :style="{
          borderRadius: radius.type
            ? `var(--w3-border-radius-${radius.type})`
            : '',
        }"
      />
    </w-col>
  </w-row>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useCssVar } from '@vueuse/core'

const radiusGroup = ref([
  {
    name: '无圆角',
    type: '',
  },
  {
    name: '小圆角',
    type: 'small',
  },
  {
    name: '默认圆角',
    type: 'base',
  },
  {
    name: 'Round Radius',
    type: 'round',
  },
])
</script>

<style scoped>
.demo-radius .title {
  color: var(--w3-font-color-second);
  font-size: 18px;
  margin: 10px 0;
}
.demo-radius .value {
  color: var(--w3-font-color-normal);
  font-size: 16px;
  margin: 10px 0;
}
.demo-radius .radius {
  height: 32px;
  width: 70%;
  border: 1px solid var(--w3-border-color);
  border-radius: 0;
  margin-top: 20px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="flex justify-between items-center flex-wrap">
    <div
      v-for="(shadow, i) in shadowGroup"
      :key="i"
      class="flex flex-col justify-center items-center"
      m="auto"
      w="46"
    >
      <div
        class="inline-flex"
        h="30"
        w="30"
        m="2"
        :style="{
          boxShadow: `var(${getCssVarName(shadow.type)})`,
        }"
      />
      <span p="y-4" class="demo-shadow-text" text="sm">
        {{ shadow.name }}
      </span>
      <code text="xs">
        {{ getCssVarName(shadow.type) }}
      </code>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const shadowGroup = ref([
  {
    name: 'Basic Shadow',
    type: '',
  },
  {
    name: 'Light Shadow',
    type: 'light',
  },
  {
    name: 'Lighter Shadow',
    type: 'lighter',
  },
  {
    name: 'Dark Shadow',
    type: 'dark',
  },
])

const getCssVarName = (type: string) => {
  return `--w3-box-shadow${type ? '-' : ''}${type}`
}
</script>
```

:::

---

## Container 布局容器

用于布局的容器组件，方便快速搭建页面的基本结构：

### 示例

:::demo

```vue
<template>
  <div class="common-layout">
    <w-container>
      <w-header>Header</w-header>
      <w-main>Main</w-main>
    </w-container>
  </div>
</template>
```

:::

:::demo

```vue
<template>
  <div class="common-layout">
    <w-container>
      <w-header>Header</w-header>
      <w-main>Main</w-main>
      <w-footer>Footer</w-footer>
    </w-container>
  </div>
</template>
```

:::

:::demo

```vue
<template>
  <div class="common-layout">
    <w-container>
      <w-aside width="200px">Aside</w-aside>
      <w-main>Main</w-main>
      <w-aside width="200px">Aside</w-aside>
    </w-container>
  </div>
</template>
```

:::

:::demo

```vue
<template>
  <div class="common-layout">
    <w-container>
      <w-header>Header</w-header>
      <w-container>
        <w-aside width="200px">Aside</w-aside>
        <w-main>Main</w-main>
      </w-container>
    </w-container>
  </div>
</template>
```

:::

:::demo

```vue
<template>
  <div class="common-layout">
    <w-container>
      <w-header>Header</w-header>
      <w-container>
        <w-aside width="200px">Aside</w-aside>
        <w-container>
          <w-main>Main</w-main>
          <w-footer>Footer</w-footer>
        </w-container>
      </w-container>
    </w-container>
  </div>
</template>
```

:::

:::demo

```vue
<template>
  <div class="common-layout">
    <w-container>
      <w-aside width="200px">Aside</w-aside>
      <w-container>
        <w-header>Header</w-header>
        <w-main>Main</w-main>
      </w-container>
    </w-container>
  </div>
</template>
```

:::

:::demo

```vue
<template>
  <div class="common-layout">
    <w-container>
      <w-aside width="200px">Aside</w-aside>
      <w-container>
        <w-header>Header</w-header>
        <w-main>Main</w-main>
        <w-footer>Footer</w-footer>
      </w-container>
    </w-container>
  </div>
</template>
```

:::

:::demo

```vue
<template>
  <w-container class="layout-container-demo" style="height: 500px">
    <w-aside width="200px">
      <w-scrollbar>
        <w-menu :default-openeds="['1', '3']">
          <w-sub-menu index="1">
            <template #title>
              <w-icon><Computer /></w-icon>Navigator One
            </template>
            <w-menu-item-group>
              <template #title>Group 1</template>
              <w-menu-item index="1-1">Option 1</w-menu-item>
              <w-menu-item index="1-2">Option 2</w-menu-item>
            </w-menu-item-group>
            <w-menu-item-group title="Group 2">
              <w-menu-item index="1-3">Option 3</w-menu-item>
            </w-menu-item-group>
            <w-sub-menu index="1-4">
              <template #title>Option4</template>
              <w-menu-item index="1-4-1">Option 4-1</w-menu-item>
            </w-sub-menu>
          </w-sub-menu>
          <w-sub-menu index="2">
            <template #title>
              <w-icon><list /></w-icon>Navigator Two
            </template>
            <w-menu-item-group>
              <template #title>Group 1</template>
              <w-menu-item index="2-1">Option 1</w-menu-item>
              <w-menu-item index="2-2">Option 2</w-menu-item>
            </w-menu-item-group>
            <w-menu-item-group title="Group 2">
              <w-menu-item index="2-3">Option 3</w-menu-item>
            </w-menu-item-group>
            <w-sub-menu index="2-4">
              <template #title>Option 4</template>
              <w-menu-item index="2-4-1">Option 4-1</w-menu-item>
            </w-sub-menu>
          </w-sub-menu>
          <w-sub-menu index="3">
            <template #title>
              <w-icon><setting /></w-icon>Navigator Three
            </template>
            <w-menu-item-group>
              <template #title>Group 1</template>
              <w-menu-item index="3-1">Option 1</w-menu-item>
              <w-menu-item index="3-2">Option 2</w-menu-item>
            </w-menu-item-group>
            <w-menu-item-group title="Group 2">
              <w-menu-item index="3-3">Option 3</w-menu-item>
            </w-menu-item-group>
            <w-sub-menu index="3-4">
              <template #title>Option 4</template>
              <w-menu-item index="3-4-1">Option 4-1</w-menu-item>
            </w-sub-menu>
          </w-sub-menu>
        </w-menu>
      </w-scrollbar>
    </w-aside>

    <w-container>
      <w-header style="text-align: right; font-size: 12px">
        <div class="toolbar">
          <w-dropdown>
            <w-icon style="margin-right: 8px; margin-top: 1px">
              <setting />
            </w-icon>
            <template #dropdown>
              <w-dropdown-menu>
                <w-dropdown-item>View</w-dropdown-item>
                <w-dropdown-item>Add</w-dropdown-item>
                <w-dropdown-item>Delete</w-dropdown-item>
              </w-dropdown-menu>
            </template>
          </w-dropdown>
          <span>Tom</span>
        </div>
      </w-header>

      <w-main>
        <w-scrollbar>
          <w-table :data="tableData">
            <w-table-column prop="date" label="Date" width="140" />
            <w-table-column prop="name" label="Name" width="120" />
            <w-table-column prop="address" label="Address" />
          </w-table>
        </w-scrollbar>
      </w-main>
    </w-container>
  </w-container>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Computer, List, Setting } from '@win-design-next/icons-vue'

const item = {
  date: '2016-05-02',
  name: 'Tom',
  address: 'No. 189, Grove St, Los Angeles',
}
const tableData = ref(Array.from({ length: 20 }).fill(item))
</script>

<style scoped>
.layout-container-demo .w3-header {
  position: relative;
  background-color: var(--w3-color-primary-active-bg);
  color: var(--w3-font-color-normal);
}
.layout-container-demo .w3-aside {
  color: var(--w3-font-color-normal);
  background: var(--w3-color-primary-active-bg);
}
.layout-container-demo .w3-menu {
  border-right: none;
}
.layout-container-demo .w3-main {
  padding: 0;
}
.layout-container-demo .toolbar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  right: 20px;
}
</style>
```

:::

### API 文档

### Attributes

| 属性名       | 说明       | 类型                                   | 默认值                                                        |
| --------- | -------- | ------------------------------------ | ---------------------------------------------------------- |
| direction | 子元素的排列方向 | ^[enum]`'horizontal' \| 'vertical'` | 子元素中有 `w-header` 或 `w-footer` 时为 vertical，否则为 horizontal |

### Slots

| 插槽名     | 说明      | 子标签                                        |
| ------- | ------- | ------------------------------------------ |
| default | 自定义默认内容 | Container / Header / Aside / Main / Footer |

## Header API

### Attributes

| 属性名    | 说明   | 类型        | 默认值  |
| ------ | ---- | --------- | ---- |
| height | 顶栏高度 | ^[string] | 60px |

### Slots

| 插槽名     | 说明      |
| ------- | ------- |
| default | 自定义默认内容 |

## Aside API

### Attributes

| 属性名   | 说明    | 类型        | 默认值   |
| ----- | ----- | --------- | ----- |
| width | 侧边栏宽度 | ^[string] | 300px |

### Slots

| 插槽名     | 说明      |
| ------- | ------- |
| default | 自定义默认内容 |

## Main API

### Slots

| 插槽名     | 说明      |
| ------- | ------- |
| default | 自定义默认内容 |

## Footer API

### Attributes

| 属性名    | 说明   | 类型        | 默认值  |
| ------ | ---- | --------- | ---- |
| height | 底栏高度 | ^[string] | 60px |

### Slots

| 插槽名     | 说明      |
| ------- | ------- |
| default | 自定义默认内容 |

---

## Divider 分割线

区隔内容的分割线。

### 示例

:::demo

```vue
<template>
  <div>
    <span>
      WinDesign
      是一套符合医疗行业特性的标准化解决方案，遵循协同、便捷、高效的设计理念。通过标准化、模块化组件降低生产成本，提高沟通效率及用户体验；
    </span>
    <w-divider />
    <span>
      技术上基于 Vue.js3.x，覆盖了开发中常见的 UI 套件及交互功能,
      统一前端在基础组件 UI 上的落地效果，提升研发效率。
    </span>
  </div>
</template>
```

:::

:::demo

```vue
<template>
  <div>
    <span
      >WinDesign
      是一套符合医疗行业特性的标准化解决方案，遵循协同、便捷、高效的设计理念。通过标准化、模块化组件降低生产成本，提高沟通效率及用户体验；
    </span>
    <w-divider content-position="left">WinDesign Next</w-divider>
    <span>
      WinDesign
      是一套符合医疗行业特性的标准化解决方案，遵循协同、便捷、高效的设计理念。通过标准化、模块化组件降低生产成本，提高沟通效率及用户体验；
    </span>
    <w-divider>
      <w-icon><star-filled /></w-icon>
    </w-divider>
    <span
      >WinDesign
      是一套符合医疗行业特性的标准化解决方案，遵循协同、便捷、高效的设计理念。通过标准化、模块化组件降低生产成本，提高沟通效率及用户体验；
    </span>
    <w-divider content-position="right">WinDesign Next</w-divider>
  </div>
</template>

<script lang="ts" setup>
import { StarFilled } from '@win-design-next/icons-vue'
</script>
```

:::

:::demo

```vue
<template>
  <div>
    <span
      >WinDesign
      是一套符合医疗行业特性的标准化解决方案，遵循协同、便捷、高效的设计理念。通过标准化、模块化组件降低生产成本，提高沟通效率及用户体验；
    </span>
    <w-divider border-style="dashed" />
    <span
      >WinDesign
      是一套符合医疗行业特性的标准化解决方案，遵循协同、便捷、高效的设计理念。通过标准化、模块化组件降低生产成本，提高沟通效率及用户体验；
    </span>
  </div>
  <w-divider border-style="dotted" />
  <span
    >WinDesign
    是一套符合医疗行业特性的标准化解决方案，遵循协同、便捷、高效的设计理念。通过标准化、模块化组件降低生产成本，提高沟通效率及用户体验；
  </span>
  <w-divider border-style="double" />
  <span
    >WinDesign
    是一套符合医疗行业特性的标准化解决方案，遵循协同、便捷、高效的设计理念。通过标准化、模块化组件降低生产成本，提高沟通效率及用户体验；
  </span>
</template>
```

:::

:::demo

```vue
<template>
  <div>
    <span>医保</span>
    <w-divider direction="vertical" />
    <span>自费</span>
    <w-divider direction="vertical" border-style="dashed" />
    <span>其它</span>
  </div>
</template>
```

:::

### API 文档

### Attributes

| 属性名              | 说明          | 类型                                                                                                                                              | 默认         |
| ---------------- | ----------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| direction        | 设置分割线方向     | ^[enum]`'horizontal' \| 'vertical'`                                                                                                            | horizontal |
| border-style     | 设置分隔符样式     | ^[enum]`'none' \| 'solid' \| 'hidden' \| 'dashed' \| ...` [css/border-style](https://developer.mozilla.org/zh-CN/docs/Web/CSS/border-style) | solid      |
| content-position | 自定义分隔线内容的位置 | ^[enum]`'left' \| 'right' \| 'center'`                                                                                                        | center     |

### Slots

| 插槽名     | 说明         |
| ------- | ---------- |
| default | 设置分割线文案的位置 |

---

## Layout 布局

通过基础的 24 分栏，迅速简便地创建布局。

### 示例

:::demo 通过 `row` 和 `col` 组件，并通过 col 组件的 `span` 属性我们就可以自由地组合布局。

```vue
<template>
  <w-row>
    <w-col :span="24">
      <div class="grid-content ep-bg-purple-dark" />
    </w-col>
  </w-row>
  <w-row>
    <w-col :span="12">
      <div class="grid-content ep-bg-purple" />
    </w-col>
    <w-col :span="12">
      <div class="grid-content ep-bg-purple-light" />
    </w-col>
  </w-row>
  <w-row>
    <w-col :span="8">
      <div class="grid-content ep-bg-purple" />
    </w-col>
    <w-col :span="8">
      <div class="grid-content ep-bg-purple-light" />
    </w-col>
    <w-col :span="8">
      <div class="grid-content ep-bg-purple" />
    </w-col>
  </w-row>
  <w-row>
    <w-col :span="6">
      <div class="grid-content ep-bg-purple" />
    </w-col>
    <w-col :span="6">
      <div class="grid-content ep-bg-purple-light" />
    </w-col>
    <w-col :span="6">
      <div class="grid-content ep-bg-purple" />
    </w-col>
    <w-col :span="6">
      <div class="grid-content ep-bg-purple-light" />
    </w-col>
  </w-row>
  <w-row>
    <w-col :span="4">
      <div class="grid-content ep-bg-purple" />
    </w-col>
    <w-col :span="4">
      <div class="grid-content ep-bg-purple-light" />
    </w-col>
    <w-col :span="4">
      <div class="grid-content ep-bg-purple" />
    </w-col>
    <w-col :span="4">
      <div class="grid-content ep-bg-purple-light" />
    </w-col>
    <w-col :span="4">
      <div class="grid-content ep-bg-purple" />
    </w-col>
    <w-col :span="4">
      <div class="grid-content ep-bg-purple-light" />
    </w-col>
  </w-row>
</template>

<style>
.w3-row {
  margin-bottom: 20px;
}

.w3-row:last-child {
  margin-bottom: 0;
}

.w3-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>
```

:::

:::demo 行提供 `gutter` 属性来指定列之间的间距，其默认值为 0。

```vue
<template>
  <w-row :gutter="20">
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
  </w-row>
</template>

<style>
.w3-row {
  margin-bottom: 20px;
}
.w3-row:last-child {
  margin-bottom: 0;
}
.w3-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-row :gutter="20">
    <w-col :span="16"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="8"><div class="grid-content ep-bg-purple" /></w-col>
  </w-row>
  <w-row :gutter="20">
    <w-col :span="8"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="8"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="4"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="4"><div class="grid-content ep-bg-purple" /></w-col>
  </w-row>
  <w-row :gutter="20">
    <w-col :span="4"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="16"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="4"><div class="grid-content ep-bg-purple" /></w-col>
  </w-row>
</template>

<style>
.w3-row {
  margin-bottom: 20px;
}
.w3-row:last-child {
  margin-bottom: 0;
}
.w3-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>
```

:::

:::demo 通过制定 col 组件的 `offset` 属性可以指定分栏偏移的栏数。

```vue
<template>
  <w-row :gutter="20">
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="6" :offset="6">
      <div class="grid-content ep-bg-purple" />
    </w-col>
  </w-row>
  <w-row :gutter="20">
    <w-col :span="6" :offset="6">
      <div class="grid-content ep-bg-purple" />
    </w-col>
    <w-col :span="6" :offset="6">
      <div class="grid-content ep-bg-purple" />
    </w-col>
  </w-row>
  <w-row :gutter="20">
    <w-col :span="12" :offset="6">
      <div class="grid-content ep-bg-purple" />
    </w-col>
  </w-row>
</template>

<style>
.w3-row {
  margin-bottom: 20px;
}
.w3-row:last-child {
  margin-bottom: 0;
}
.w3-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>
```

:::

:::demo 您可以通过`justify` 属性来定义子元素的排版方式，其取值为 start、center、end、space-between、space-around 或 space-evenly。

```vue
<template>
  <w-row class="row-bg">
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple-light" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
  </w-row>
  <w-row class="row-bg" justify="center">
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple-light" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
  </w-row>
  <w-row class="row-bg" justify="end">
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple-light" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
  </w-row>
  <w-row class="row-bg" justify="space-between">
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple-light" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
  </w-row>
  <w-row class="row-bg" justify="space-around">
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple-light" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
  </w-row>
  <w-row class="row-bg" justify="space-evenly">
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple-light" /></w-col>
    <w-col :span="6"><div class="grid-content ep-bg-purple" /></w-col>
  </w-row>
</template>

<style>
.w3-row {
  margin-bottom: 20px;
}
.w3-row:last-child {
  margin-bottom: 0;
}
.w3-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-row :gutter="10">
    <w-col :xs="8" :sm="6" :md="4" :lg="3" :xl="1">
      <div class="grid-content ep-bg-purple" />
    </w-col>
    <w-col :xs="4" :sm="6" :md="8" :lg="9" :xl="11">
      <div class="grid-content ep-bg-purple-light" />
    </w-col>
    <w-col :xs="4" :sm="6" :md="8" :lg="9" :xl="11">
      <div class="grid-content ep-bg-purple" />
    </w-col>
    <w-col :xs="8" :sm="6" :md="4" :lg="3" :xl="1">
      <div class="grid-content ep-bg-purple-light" />
    </w-col>
  </w-row>
</template>

<style>
.w3-col {
  border-radius: 4px;
}

.grid-content {
  border-radius: 4px;
  min-height: 36px;
}
</style>
```

:::

### API 文档

### Attributes

| 属性名  | 说明                      | 类型                                                                                         | 默认值 |
| ------- | ------------------------- | -------------------------------------------------------------------------------------------- | ------ |
| gutter  | 栅格间隔                  | ^[number]                                                                                    | 0      |
| justify | flex 布局下的水平排列方式 | ^[enum]`'start' \| 'end' \| 'center' \| 'space-around' \| 'space-between' \| 'space-evenly'` | start  |
| align   | flex 布局下的垂直排列方式 | ^[enum]`'top' \| 'middle' \| 'bottom'`                                                       | —      |
| tag     | 自定义元素标签            | ^[string]                                                                                    | div    |

### Slots

| 插槽名  | 说明           | 子标签 |
| ------- | -------------- | ------ |
| default | 自定义默认内容 | Col    |

## Col API

### Attributes

| 属性名 | 说明                                   | 类型                                                                                  | 默认值 |
| ------ | -------------------------------------- | ------------------------------------------------------------------------------------- | ------ |
| span   | 栅格占据的列数                         | ^[number]                                                                             | 24     |
| offset | 栅格左侧的间隔格数                     | ^[number]                                                                             | 0      |
| push   | 栅格向右移动格数                       | ^[number]                                                                             | 0      |
| pull   | 栅格向左移动格数                       | ^[number]                                                                             | 0      |
| xs     | `<768px` 响应式栅格数或者栅格属性对象  | ^[number] / ^[object]`{span?: number, offset?: number, pull?: number, push?: number}` | —      |
| sm     | `≥768px` 响应式栅格数或者栅格属性对象  | ^[number] / ^[object]`{span?: number, offset?: number, pull?: number, push?: number}` | —      |
| md     | `≥992px` 响应式栅格数或者栅格属性对象  | ^[number] / ^[object]`{span?: number, offset?: number, pull?: number, push?: number}` | —      |
| lg     | `≥1200px` 响应式栅格数或者栅格属性对象 | ^[number] / ^[object]`{span?: number, offset?: number, pull?: number, push?: number}` | —      |
| xl     | `≥1920px` 响应式栅格数或者栅格属性对象 | ^[number] / ^[object]`{span?: number, offset?: number, pull?: number, push?: number}` | —      |
| tag    | 自定义元素标签                         | ^[string]                                                                             | div    |

### Slots

| 插槽名  | 说明           |
| ------- | -------------- |
| default | 自定义默认内容 |

<style lang="scss">
@use '../../examples/layout/index.scss';
</style>

---

## Link 链接

文字超链接

### 示例

:::demo

```vue
<template>
  <div class="mb-4">
    <w-title>基础用法</w-title>
    <div>
      <div class="flex gap-4">
        <w-link
          href="http://wued.winning-health.com.cn:8088/win-design/"
          target="_blank"
          >默认链接</w-link
        >
        <w-link type="primary">主要链接</w-link>
        <w-link type="success">成功链接</w-link>
        <w-link type="warning">警告链接</w-link>
        <w-link type="danger">错误链接</w-link>
        <w-link type="error">错误链接</w-link>
        <w-link type="info">普通链接</w-link>
      </div>
      <div class="flex gap-4 mt-4">
        <w-link
          disabled
          href="http://wued.winning-health.com.cn:8088/win-design/"
          target="_blank"
          >默认链接</w-link
        >
        <w-link type="primary" disabled>主要链接</w-link>
        <w-link type="success" disabled>成功链接</w-link>
        <w-link type="warning" disabled>警告链接</w-link>
        <w-link type="danger" disabled>错误链接</w-link>
        <w-link type="info" disabled>普通链接</w-link>
      </div>
    </div>
  </div>
  <w-divider />
  <div class="">
    <w-title>去除下划线：:underline="false"</w-title>
    <div class="flex gap-4">
      <w-link
        :underline="false"
        href="http://wued.winning-health.com.cn:8088/win-design/"
        target="_blank"
        >默认链接</w-link
      >
      <w-link
        type="error"
        underline="hover"
        href="http://wued.winning-health.com.cn:8088/win-design/"
        target="_blank"
        >hover</w-link
      >
      <w-link
        type="primary"
        underline="always"
        href="http://wued.winning-health.com.cn:8088/win-design/"
        target="_blank"
        >always</w-link
      >
      <w-link
        type="success"
        underline="never"
        href="http://wued.winning-health.com.cn:8088/win-design/"
        target="_blank"
        >never</w-link
      >
    </div>
  </div>
</template>

<style scoped>
.w3-link + .w3-link {
  margin-left: 8px;
}
.w3-link .w3-icon--right.w3-icon {
  vertical-align: text-bottom;
}
</style>
```

:::

:::demo

```vue
<template>
  <div>
    <w-link :icon="Edit">编辑</w-link>
    <w-link>
      查看<w-icon class="w3-icon--right"><ViewSolid /></w-icon>
    </w-link>
  </div>
</template>

<script setup lang="ts">
import { Edit, ViewSolid } from '@win-design-next/icons-vue'
</script>

<style scoped>
.w3-link {
  margin-right: 8px;
}
</style>
```

:::

### API 文档

### Attributes

| 属性名    | 说明                 | 类型                                                                                       | 默认值  |
| --------- | -------------------- | ------------------------------------------------------------------------------------------ | ------- |
| type      | 类型                 | ^[enum]`'primary' \| 'success' \| 'warning' \| 'danger' \| 'error' \| 'info' \| 'default'` | default |
| underline | 是否下划线           | ^[enum]`'always' \| 'hover' \| 'never' \| boolean`                                         | true    |
| disabled  | 是否禁用状态         | ^[boolean]                                                                                 | false   |
| href      | 原生 href 属性       | ^[string]                                                                                  | —       |
| target    | 同原生 `target `属性 | ^[enum]`'_blank' \| '_parent' \| '_self' \| '_top'`                                        | \_self  |
| icon      | 图标组件             | ^[string] / ^[Component]                                                                   | —       |

### Slots

| 插槽名  | 说明           |
| ------- | -------------- |
| default | 自定义默认内容 |
| icon    | 自定义图标组件 |

---

## Scrollbar 滚动条

用于替换浏览器原生滚动条。

### 示例

:::demo 通过 `height` 属性设置滚动条高度，若不设置则根据父容器高度自适应。

```vue
<template>
  <w-scrollbar height="400px">
    <p v-for="item in 20" :key="item" class="scrollbar-demo-item">{{ item }}</p>
  </w-scrollbar>
</template>

<style scoped>
.scrollbar-demo-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  margin: 10px;
  text-align: center;
  border-radius: 4px;
  background: var(--w3-color-primary-plain);
  color: var(--w3-color-primary);
}
</style>
```

:::

:::demo 当元素宽度大于滚动条宽度时，会显示横向滚动条。

```vue
<template>
  <w-scrollbar>
    <div class="scrollbar-flex-content">
      <p v-for="item in 50" :key="item" class="scrollbar-demo-item">
        {{ item }}
      </p>
    </div>
  </w-scrollbar>
</template>

<style scoped>
.scrollbar-flex-content {
  display: flex;
}
.scrollbar-demo-item {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100px;
  height: 50px;
  margin: 10px;
  text-align: center;
  border-radius: 4px;
  background: var(--w3-color-danger-plain);
  color: var(--w3-color-danger);
}
</style>
```

:::

:::demo 当元素高度超过最大高度，才会显示滚动条。

```vue
<template>
  <w-button @click="add">Add Item</w-button>
  <w-button @click="onDelete">Delete Item</w-button>
  <w-scrollbar max-height="400px">
    <p v-for="item in count" :key="item" class="scrollbar-demo-item">
      {{ item }}
    </p>
  </w-scrollbar>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const count = ref(3)

const add = () => {
  count.value++
}
const onDelete = () => {
  if (count.value > 0) {
    count.value--
  }
}
</script>

<style scoped>
.scrollbar-demo-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  margin: 10px;
  text-align: center;
  border-radius: 4px;
  background: var(--w3-color-primary-plain);
  color: var(--w3-color-primary);
}
</style>
```

:::

:::demo 通过使用 `setScrollTop` 与 `setScrollLeft` 方法，可以手动控制滚动条滚动。

```vue
<template>
  <w-scrollbar ref="scrollbarRef" height="400px" always @scroll="scroll">
    <div ref="innerRef">
      <p v-for="item in 20" :key="item" class="scrollbar-demo-item">
        {{ item }}
      </p>
    </div>
  </w-scrollbar>

  <w-slider
    v-model="value"
    :max="max"
    :format-tooltip="formatTooltip"
    @input="inputSlider"
  />
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'

import type { ScrollbarInstance } from 'win-design-next'

type Arrayable<T> = T | T[]

const max = ref(0)
const value = ref(0)
const innerRef = ref<HTMLDivElement>()
const scrollbarRef = ref<ScrollbarInstance>()

onMounted(() => {
  max.value = innerRef.value!.clientHeight - 380
})

const inputSlider = (value: Arrayable<number>) => {
  scrollbarRef.value!.setScrollTop(value as number)
}
const scroll = ({ scrollTop }) => {
  value.value = scrollTop
}
const formatTooltip = (value: number) => `${value} px`
</script>

<style scoped>
.scrollbar-demo-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  margin: 10px;
  text-align: center;
  border-radius: 4px;
  background: var(--w3-color-primary-plain);
  color: var(--w3-color-primary);
}
.w3-slider {
  margin-top: 20px;
}
</style>
```

:::

### API 文档

### Attributes

| 属性名                   | 说明                                                                 | 类型                                                                  | 默认值 |
| ------------------------ | -------------------------------------------------------------------- | --------------------------------------------------------------------- | ------ |
| height                   | 滚动条高度                                                           | ^[string] / ^[number]                                                 | —      |
| max-height               | 滚动条最大高度                                                       | ^[string] / ^[number]                                                 | —      |
| native                   | 是否使用原生滚动条样式                                               | ^[boolean]                                                            | false  |
| wrap-style               | 包裹容器的自定义样式                                                 | ^[string] / ^[object]`CSSSProperties \| CSSSProperties[] \| string[]` | —      |
| wrap-class               | 包裹容器的自定义类名                                                 | ^[string]                                                             | —      |
| view-style               | 视图的自定义样式                                                     | ^[string] / ^[object]`CSSSProperties \| CSSSProperties[] \| string[]` | —      |
| view-class               | 视图的自定义类名                                                     | ^[string]                                                             | —      |
| noresize                 | 不响应容器尺寸变化，如果容器尺寸不会发生变化，最好设置它可以优化性能 | ^[boolean]                                                            | false  |
| tag                      | 视图的元素标签                                                       | ^[string]                                                             | div    |
| always                   | 滚动条总是显示                                                       | ^[boolean]                                                            | false  |
| min-size                 | 滚动条最小尺寸                                                       | ^[number]                                                             | 20     |
| id                       | 视图 ID                                                              | ^[string]                                                             | —      |
| role ^(a11y)             | 视图的角色                                                           | ^[string]                                                             | —      |
| aria-label ^(a11y)       | 视图的 aria-label                                                    | ^[string]                                                             | —      |
| aria-orientation ^(a11y) | 视图的 aria-orientation                                              | ^[enum]`'horizontal' \| 'vertical'`                                   | —      |
| tabindex                 | 容器的 tabindex                                                      | ^[number] / ^[string]                                                 | —      |

### Events

| 事件名 | 说明                             | 类型                                                             |
| ------ | -------------------------------- | ---------------------------------------------------------------- |
| scroll | 当触发滚动事件时，返回滚动的距离 | ^[Function]`({ scrollLeft: number, scrollTop: number }) => void` |

### Slots

| 插槽名  | 说明           |
| ------- | -------------- |
| default | 自定义默认内容 |

### Exposes

| 名称          | 说明                   | 类型                                                                       |
| ------------- | ---------------------- | -------------------------------------------------------------------------- |
| handleScroll  | 触发滚动事件           | ^[Function]`() => void`                                                    |
| scrollTo      | 滚动到一组特定坐标     | ^[Function]`(options: ScrollToOptions \| number, yCoord?: number) => void` |
| setScrollTop  | 设置滚动条到顶部的距离 | ^[Function]`(scrollTop: number) => void`                                   |
| setScrollLeft | 设置滚动条到左边的距离 | ^[Function]`(scrollLeft: number) => void`                                  |
| update        | 手动更新滚动条状态     | ^[Function]`() => void`                                                    |
| wrapRef       | 滚动条包裹的 ref 对象  | ^[object]`Ref<HTMLDivElement>`                                             |

---

## Space 间距

虽然我们拥有 [Divider 组件](/zh-CN/component/divider)，但很多时候我们需要不是一个被 [Divider 组件](/zh-CN/component/divider) 分割开的页面结构，因此我们会重复的使用很多的 [Divider 组件](/zh-CN/component/divider)，这在我们的开发效率上造成了一定的困扰。 **间距组件**就是为了解决这种困扰应运而生的。

### 示例

:::demo 通过间距组件来给多个组件之间提供间距

```vue
<template>
  <w-space wrap>
    <w-button type="primary">主要按钮</w-button>
    <w-button type="success">成功按钮</w-button>
    <w-button type="warning">警告按钮</w-button>
    <w-button type="error">危险按钮</w-button>
    <w-button plain>默认按钮</w-button>
    <w-button type="primary" plain>主要按钮</w-button>
    <w-button type="success" plain>成功按钮</w-button>
    <w-button type="warning" plain>警告按钮</w-button>
    <w-button type="error" plain>危险按钮</w-button>
    <w-button type="primary" round>主要按钮</w-button>
    <w-button type="success" round>成功按钮</w-button>
    <w-button type="warning" round>警告按钮</w-button>
    <w-button type="error" round>危险按钮</w-button>
  </w-space>
</template>
```

:::

:::demo 我们也提供垂直布局方式。

```vue
<template>
  <w-space direction="vertical">
    <w-button type="primary">主要按钮</w-button>
    <w-button type="success">成功按钮</w-button>
    <w-button type="warning">警告按钮</w-button>
    <w-button type="error">危险按钮</w-button>
  </w-space>
</template>
```

:::

:::demo

```vue
<template>
  <w-space direction="vertical" alignment="start" :size="30">
    <w-radio-group v-model="size">
      <w-radio value="large">Large</w-radio>
      <w-radio value="default">Default</w-radio>
      <w-radio value="small">Small</w-radio>
      <w-radio value="mini">Mini</w-radio>
    </w-radio-group>

    <w-space wrap :size="size">
      <w-button type="primary">主要按钮</w-button>
      <w-button type="success">成功按钮</w-button>
      <w-button type="warning">警告按钮</w-button>
      <w-button type="error">危险按钮</w-button>
    </w-space>
  </w-space>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { ComponentSize } from 'win-design-next'

const size = ref<ComponentSize>('default')
</script>
```

:::

:::demo

```vue
<template>
  <w-slider v-model="size" />
  <w-space wrap :size="size">
    <w-button type="primary">主要按钮</w-button>
    <w-button type="success">成功按钮</w-button>
    <w-button type="warning">警告按钮</w-button>
    <w-button type="error">危险按钮</w-button>
  </w-space>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const size = ref(20)
</script>
```

:::

:::demo 利用 `wrap` 属性控制换行

```vue
<template>
  <w-space wrap>
    <div v-for="i in 20" :key="i">
      <w-button text> Text button </w-button>
    </div>
  </w-space>
</template>
```

:::

:::demo

```vue
<template>
  <w-space :size="size" spacer="|">
    <div v-for="i in 2" :key="i">
      <w-button> button {{ i }} </w-button>
    </div>
  </w-space>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const size = ref(10)
</script>
```

:::

:::demo

```vue
<template>
  <w-space :size="size" :spacer="spacer">
    <div v-for="i in 2" :key="i">
      <w-button> button {{ i }} </w-button>
    </div>
  </w-space>
</template>

<script lang="ts" setup>
import { h, ref } from 'vue'
import { WDivider } from 'win-design-next'

const size = ref(10)
const spacer = h(WDivider, { direction: 'vertical' })
</script>
```

:::

:::demo 使用 `alignment` 属性来对齐

```vue
<template>
  <div class="alignment-container">
    <w-space>
      string
      <w-button> button </w-button>
      <w-card>
        <template #header> header </template>
        body
      </w-card>
    </w-space>
  </div>
  <div class="alignment-container">
    <w-space alignment="flex-start">
      string
      <w-button> button </w-button>
      <w-card>
        <template #header> header </template>
        body
      </w-card>
    </w-space>
  </div>
  <div class="alignment-container">
    <w-space alignment="flex-end">
      string
      <w-button> button </w-button>
      <w-card>
        <template #header> header </template>
        body
      </w-card>
    </w-space>
  </div>
</template>

<style>
.alignment-container {
  width: 240px;
  margin-bottom: 20px;
  padding: 8px;
  border: 1px solid var(--w3-border-color);
}
</style>
```

:::

:::demo 用 fill 属性让子节点自动填充容器

```vue
<template>
  <div>
    <div style="margin-bottom: 15px">fill: <w-switch v-model="fill" /></div>
    <w-space :fill="fill" wrap>
      <w-button type="primary">主要按钮</w-button>
      <w-button type="success">成功按钮</w-button>
      <w-button type="warning">警告按钮</w-button>
      <w-button type="error">危险按钮</w-button>
    </w-space>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const fill = ref(true)
</script>
```

:::

:::demo 用 fillRatio 自定义填充比例

```vue
<template>
  <div>
    <div style="margin-bottom: 15px">
      direction:
      <w-radio v-model="direction" value="horizontal">horizontal</w-radio>
      <w-radio v-model="direction" value="vertical">vertical</w-radio>
    </div>
    <div style="margin-bottom: 15px">
      fillRatio:<w-slider v-model="fillRatio" />
    </div>
    <w-space
      fill
      wrap
      :fill-ratio="fillRatio"
      :direction="direction"
      style="width: 100%"
    >
      <w-button type="primary">主要按钮</w-button>
      <w-button type="success">成功按钮</w-button>
      <w-button type="warning">警告按钮</w-button>
      <w-button type="error">危险按钮</w-button>
    </w-space>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { SpaceInstance } from 'win-design-next'

const direction = ref<SpaceInstance['direction']>('horizontal')
const fillRatio = ref(30)
</script>
```

:::

### API 文档

### Attributes

| 属性名     | 说明                      | 类型                                                                                                                          | 默认值     |
| ---------- | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------- | ---------- |
| alignment  | 对齐的方式                | ^[enum]`'center' \| 'normal' \| 'stretch' \| ...` [align-items](https://developer.mozilla.org/en-US/docs/Web/CSS/align-items) | center     |
| class      | className                 | ^[string] / ^[object] / ^[array]                                                                                              | —          |
| direction  | 排列的方向                | ^[enum]`'vertical' \| 'horizontal'`                                                                                           | horizontal |
| prefix-cls | 给 space-items 的类名前缀 | ^[string]                                                                                                                     | —          |
| style      | 额外样式                  | ^[string] / ^[object]`CSSProperties \| CSSProperties[] \| string[]`                                                           | —          |
| spacer     | 间隔符                    | ^[string] / ^[number] / ^[VNode]                                                                                              | —          |
| size       | 间隔大小                  | ^[enum]`'default' \| 'small' \| 'mini' \| 'large'` / ^[number] / ^[array]`[number, number]`                                   | default    |
| wrap       | 设置是否自动折行          | ^[boolean]                                                                                                                    | false      |
| fill       | 子元素是否填充父容器      | ^[boolean]                                                                                                                    | false      |
| fill-ratio | 填充父容器的比例          | ^[number]                                                                                                                     | 100        |

### Slots

| 名称    | 说明               |
| ------- | ------------------ |
| default | 需要添加间隔的元素 |

---

## Splitter 分隔面板

可将区域水平或垂直分隔，并可自由拖动以调整各个区域的大小。

### 示例

:::demo

```vue
<template>
  <div
    style="height: 250px; box-shadow: var(--w3-border-color-light) 0px 0px 10px"
  >
    <w-splitter>
      <w-splitter-panel size="30%">
        <div class="demo-panel">1</div>
      </w-splitter-panel>
      <w-splitter-panel :min="200">
        <div class="demo-panel">2</div>
      </w-splitter-panel>
    </w-splitter>
  </div>
</template>

<style scoped>
.demo-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
```

:::

:::demo

```vue
<template>
  <div
    style="height: 250px; box-shadow: var(--w3-border-color-light) 0px 0px 10px"
  >
    <w-splitter layout="vertical">
      <w-splitter-panel>
        <div class="demo-panel">1</div>
      </w-splitter-panel>
      <w-splitter-panel>
        <div class="demo-panel">2</div>
      </w-splitter-panel>
    </w-splitter>
  </div>
</template>

<style scoped>
.demo-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
```

:::

:::demo

```vue
<template>
  <div
    style="height: 250px; box-shadow: var(--w3-border-color-light) 0px 0px 10px"
  >
    <w-splitter>
      <w-splitter-panel collapsible min="50" title="患者列表1">
        <div class="demo-panel">1</div>
      </w-splitter-panel>
      <w-splitter-panel collapsible title="患者列表2">
        <div class="demo-panel">2</div>
      </w-splitter-panel>
      <w-splitter-panel title="患者列表3">
        <div class="demo-panel">3</div>
      </w-splitter-panel>
      <w-splitter-panel collapsible>
        <w-splitter layout="vertical">
          <w-splitter-panel collapsible title="患者列表4">
            <div class="demo-panel">4</div>
          </w-splitter-panel>
          <w-splitter-panel collapsible title="患者列表5">
            <div class="demo-panel">5</div>
          </w-splitter-panel>
        </w-splitter>
      </w-splitter-panel>
    </w-splitter>
  </div>
</template>

<style scoped>
.demo-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-switch
    v-model="resizable"
    active-text="enable"
    inactive-text="disable"
    inline-prompt
    class="mb-2"
  />
  <div
    style="height: 250px; box-shadow: var(--w3-border-color-light) 0px 0px 10px"
  >
    <w-splitter>
      <w-splitter-panel>
        <div class="demo-panel">1</div>
      </w-splitter-panel>
      <w-splitter-panel :resizable="resizable">
        <div class="demo-panel">
          drag {{ resizable ? 'enable' : 'disable' }}
        </div>
      </w-splitter-panel>
      <w-splitter-panel>
        <div class="demo-panel">3</div>
      </w-splitter-panel>
    </w-splitter>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const resizable = ref(false)
</script>

<style scoped>
.demo-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
```

:::

:::demo

```vue
<template>
  <div
    style="height: 250px; box-shadow: var(--w3-border-color-light) 0px 0px 10px"
  >
    <w-splitter
      @resize-start="handleResizeStart"
      @resize-end="handleResizeEnd"
      @resize="handleResize"
    >
      <w-splitter-panel>
        <div class="demo-panel">1</div>
      </w-splitter-panel>
      <w-splitter-panel v-model:size="size" :max="200" :min="50">
        <div class="demo-panel">{{ size }}px</div>
      </w-splitter-panel>
      <w-splitter-panel>
        <div class="demo-panel">3</div>
      </w-splitter-panel>
    </w-splitter>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const size = ref(100)

const handleResizeStart = (index: number, sizes: number[]) => {
  console.log('resizeStart', index, sizes)
}

const handleResize = (index: number, sizes: number[]) => {
  console.log('resize', index, sizes)
}

const handleResizeEnd = (index: number, sizes: number[]) => {
  console.log('resizeEnd', index, sizes)
}
</script>

<style scoped>
.demo-panel {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
```

:::

### API 文档

### Splitter Attributes

| 属性名 | 说明               | 类型                                | 默认值     |
| ------ | ------------------ | ----------------------------------- | ---------- |
| layout | 分隔面板的布局方向 | ^[enum]`'horizontal' \| 'vertical'` | horizontal |

### Splitter Events

| 事件名       | 说明                                           | 类型                                                  |
| ------------ | ---------------------------------------------- | ----------------------------------------------------- |
| resize-start | 开始调整面板大小时触发，`index` 是拖动条的索引 | ^[Function]`(index: number, sizes: number[]) => void` |
| resize       | 调整面板大小时触发，`index` 是拖动条的索引     | ^[Function]`(index: number, sizes: number[]) => void` |
| resize-end   | 面板调整大小时结束触发，`index` 是拖动条的索引 | ^[Function]`(index: number, sizes: number[]) => void` |

## SplitterPanel API

### SplitterPanel Attributes

| 属性名              | 说明                         | 类型                  | 默认值 |
| ------------------- | ---------------------------- | --------------------- | ------ |
| size / v-model:size | 面板大小(像素或百分比)       | ^[string] / ^[number] | -      |
| min                 | 面板的最小尺寸(像素或百分比) | ^[string] / ^[number] | -      |
| max                 | 面板的最大尺寸(像素或百分比) | ^[string] / ^[number] | -      |
| resizable           | 是否可以调整面板大小         | ^[boolean]            | true   |
| collapsible         | 面板是否可折叠               | ^[boolean]            | false  |

### SplitterPanel Events

| 事件名      | 说明                 | 类型                                |
| ----------- | -------------------- | ----------------------------------- |
| update:size | 当面板大小改变时触发 | ^[Function]`(size: number) => void` |

### SplitterPanel Slots

| 名称              | 说明                       |
| ----------------- | -------------------------- |
| default           | 面板的默认内容             |
| start-collapsible | 自定义起始折叠按钮的内容   |
| end-collapsible   | 结束可折叠按钮的自定义内容 |

---

## Watermark 水印

在页面上添加文本或图片等水印信息

### 示例

:::demo

```vue
<script setup lang="ts">
import { reactive, watch } from 'vue'
import { isDark } from '~/composables/dark'

const font = reactive({
  color: 'rgba(0, 0, 0, .15)',
})

watch(
  isDark,
  () => {
    font.color = isDark.value
      ? 'rgba(255, 255, 255, .15)'
      : 'rgba(0, 0, 0, .15)'
  },
  {
    immediate: true,
  }
)
</script>

<template>
  <w-watermark :font="font">
    <div style="height: 500px" />
  </w-watermark>
</template>
```

:::

:::demo

```vue
<script setup lang="ts">
import { reactive, watch } from 'vue'
import { isDark } from '~/composables/dark'

const font = reactive({
  color: 'rgba(0, 0, 0, .15)',
})

watch(
  isDark,
  () => {
    font.color = isDark.value
      ? 'rgba(255, 255, 255, .15)'
      : 'rgba(0, 0, 0, .15)'
  },
  {
    immediate: true,
  }
)
</script>
<template>
  <w-watermark :font="font" :content="['WinDesign+', 'WinDesign Next']">
    <div style="height: 500px" />
  </w-watermark>
</template>
```

:::

:::demo

```vue
<template>
  <w-watermark
    :width="130"
    :height="30"
    image="/win-design-next/imgs/winning-logo.png"
  >
    <div style="height: 500px" />
  </w-watermark>
</template>
```

:::

:::demo

```vue
<script setup lang="ts">
import { reactive } from 'vue'

const config = reactive({
  content: 'WinDesign Next',
  font: {
    fontSize: 16,
    color: 'rgba(0, 0, 0, 0.15)',
  },
  zIndex: -1,
  rotate: -22,
  gap: [100, 100] as [number, number],
  offset: [] as unknown as [number, number],
})
</script>

<template>
  <div class="wrapper">
    <w-watermark
      class="watermark"
      :content="config.content"
      :font="config.font"
      :z-index="config.zIndex"
      :rotate="config.rotate"
      :gap="config.gap"
      :offset="config.offset"
    >
      <div class="demo">
        <h1>WinDesign Next</h1>
        <h2>一个基于 Vue 3 的设计师和开发者组件库</h2>
        <img src="/imgs/banner-bg.png" alt="示例图片" />
      </div>
    </w-watermark>
    <w-form
      class="form"
      :model="config"
      label-position="top"
      label-width="50px"
    >
      <w-form-item label="Content">
        <w-input v-model="config.content" />
      </w-form-item>
      <w-form-item label="Color">
        <w-color-picker v-model="config.font.color" show-alpha />
      </w-form-item>
      <w-form-item label="FontSize">
        <w-slider v-model="config.font.fontSize" />
      </w-form-item>
      <w-form-item label="zIndex">
        <w-slider v-model="config.zIndex" />
      </w-form-item>
      <w-form-item label="Rotate">
        <w-slider v-model="config.rotate" :min="-180" :max="180" />
      </w-form-item>
      <w-form-item label="Gap">
        <w-space>
          <w-input-number v-model="config.gap[0]" controls-position="right" />
          <w-input-number v-model="config.gap[1]" controls-position="right" />
        </w-space>
      </w-form-item>
      <w-form-item label="Offset">
        <w-space>
          <w-input-number
            v-model="config.offset[0]"
            placeholder="offsetLeft"
            controls-position="right"
          />
          <w-input-number
            v-model="config.offset[1]"
            placeholder="offsetTop"
            controls-position="right"
          />
        </w-space>
      </w-form-item>
    </w-form>
  </div>
</template>

<style scoped>
.wrapper {
  display: flex;
}
.watermark {
  display: flex;
  flex: auto;
}
.demo {
  flex: auto;
}
.form {
  width: 330px;
  margin-left: 20px;
  border-left: 1px solid #eee;
  padding-left: 20px;
}

img {
  z-index: 10;
  width: 100%;
  max-width: 300px;
  position: relative;
}
</style>
```

:::

### API 文档

### 属性

| 属性名  | 描述                                          | 类型                          | 默认值                     |
| ------- | --------------------------------------------- | ----------------------------- | -------------------------- |
| width   | 水印的宽度， `content` 的默认值是它自己的宽度 | ^[number]                     | 120                        |
| height  | 水印的高度， `content` 的默认值是它自己的高度 | ^[number]                     | 64                         |
| rotate  | 水印的旋转角度, 单位 `°`                      | ^[number]                     | -22                        |
| zIndex  | 水印元素的 z-index 值                         | ^[number]                     | 9                          |
| image   | 水印图片，建议使用 2x 或 3x 图像              | ^[string]                     | —                          |
| content | 水印文本内容                                  | ^[string]/^[object]`string[]` | WinDesign Next             |
| font    | 文字样式                                      | [Font](#font)                 | [字体](#font)              |
| gap     | 水印之间的间距                                | ^[object]`[number, number]`   | \[100, 100\]               |
| offset  | 水印从容器左上角的偏移 默认值为 `gap/2`       | ^[object]`[number, number]`   | \[gap\[0\]/2, gap\[1\]/2\] |

### Font

| 名称         | 详情     | 类型                                                                                 | 默认            |
| ------------ | -------- | ------------------------------------------------------------------------------------ | --------------- |
| color        | 字体颜色 | ^[string]                                                                            | rgba(0,0,0,.15) |
| fontSize     | 字体大小 | ^[number] / ^[string]                                                                | 16              |
| fontWeight   | 字重     | ^[enum]`'normal' \| 'light' \| 'weight' \| number`                                   | normal          |
| fontFamily   | 字体     | ^[string]                                                                            | sans-serif      |
| fontStyle    | 字体样式 | ^[enum]`'none' \| 'normal' \| 'italic' \| 'oblique'`                                 | normal          |
| textAlign    | 文本对齐 | ^[enum]`'left' \| 'right' \| 'center' \| 'start' \| 'end'`                           | center          |
| textBaseline | 文本基线 | ^[enum]`'top' \| 'hanging' \| 'middle' \| 'alphabetic' \| 'ideographic' \| 'bottom'` | hanging         |

### Slots

| 名称 | 详情           |
| ---- | -------------- |
| 默认 | 添加水印的容器 |

---

