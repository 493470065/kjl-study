## Affix 固钉

将页面元素固定在特定可视区域。

### 示例

:::demo 通过设置 `offset` 属性来改变吸顶距离，默认值为 0。

```vue
<template>
  <w-affix :offset="120">
    <w-button type="primary">Offset top 120px</w-button>
  </w-affix>
</template>
```

:::

:::demo 请注意容器避免出现滚动条。

```vue
<template>
  <div class="affix-container">
    <w-affix target=".affix-container" :offset="80">
      <w-button type="primary">Target container</w-button>
    </w-affix>
  </div>
</template>

<style scoped>
.affix-container {
  text-align: center;
  height: 400px;
  border-radius: 4px;
  background: var(--w3-color-primary-plain);
}
</style>
```

:::

:::demo 通过设置 `position` 属性来改变固定位置，默认值为 `top` 。

```vue
<template>
  <w-affix position="bottom" :offset="20">
    <w-button type="primary">Offset bottom 20px</w-button>
  </w-affix>
</template>
```

:::

### API 文档

### 属性

| 名称       | 说明            | 类型                          | 默认值 |
| -------- | ------------- | --------------------------- | --- |
| offset   | 偏移距离          | ^[number]                   | 0   |
| position | 固钉位置          | ^[enum]`'top' \| 'bottom'` | top |
| target   | 指定容器（CSS 选择器） | ^[string]                   | —   |
| z-index  | `z-index`     | ^[number]                   | 100 |

### 事件

| 名称     | 说明           | 类型                                                                     |
| ------ | ------------ | ---------------------------------------------------------------------- |
| change | 固钉状态改变时触发的事件 | ^[Function]`(fixed: boolean) => void`                               |
| scroll | 滚动时触发的事件     | ^[Function]`(value: { scrollTop: number, fixed: boolean }) => void` |

### 插槽

| 插槽名     | 说明      |
| ------- | ------- |
| default | 自定义默认内容 |

### 暴露

| 名称         | 说明            | 类型                         |
| ---------- | ------------- | -------------------------- |
| update     | 手动更新固钉状态      | ^[Function]`() => void` |
| updateRoot | 手动更新根元素的盒模型信息 | ^[Function]`() => void` |

---

## Anchor 锚点

通过锚点，您可以很快找到当前页面上信息内容的位置。

### 示例

:::demo

```vue
<template>
  <w-anchor :offset="70">
    <w-anchor-link :href="`#${locale['basic-usage']}`">
      {{ locale['Basic Usage'] }}
    </w-anchor-link>
    <w-anchor-link :href="`#${locale['horizontal-mode']}`">
      {{ locale['Horizontal Mode'] }}
    </w-anchor-link>
    <w-anchor-link :href="`#${locale['scroll-container']}`">
      {{ locale['Scroll Container'] }}
    </w-anchor-link>
    <w-anchor-link :href="`#${locale['anchor-api']}`">
      {{ locale['Anchor API'] }}
      <template #sub-link>
        <w-anchor-link :href="`#${locale['anchor-attributes']}`">
          {{ locale['Anchor Attributes'] }}
        </w-anchor-link>
        <w-anchor-link :href="`#${locale['anchor-events']}`">
          {{ locale['Anchor Events'] }}
        </w-anchor-link>
      </template>
    </w-anchor-link>
  </w-anchor>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import anchorLocale from '../../.vitepress/i18n/component/anchor.json'
import { useLang } from '~/composables/lang'

const lang = useLang()
const locale = computed(() => anchorLocale[lang.value])
</script>
```

:::

:::demo

```vue
<template>
  <w-anchor :offset="70" direction="horizontal">
    <w-anchor-link :href="`#${locale['basic-usage']}`">
      {{ locale['Basic Usage'] }}
    </w-anchor-link>
    <w-anchor-link :href="`#${locale['horizontal-mode']}`">
      {{ locale['Horizontal Mode'] }}
    </w-anchor-link>
    <w-anchor-link :href="`#${locale['scroll-container']}`">
      {{ locale['Scroll Container'] }}
    </w-anchor-link>
  </w-anchor>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import anchorLocale from '../../.vitepress/i18n/component/anchor.json'
import { useLang } from '~/composables/lang'

const lang = useLang()
const locale = computed(() => anchorLocale[lang.value])
</script>
```

:::

:::demo

```vue
<template>
  <div>
    <w-row>
      <w-col :span="18">
        <div
          style="
            height: 30px;
            width: 70%;
            background: #000;
            position: absolute;
            top: 0;
            left: 0;
            color: #fff;
          "
        >
          Fixed Top Block
        </div>
        <div ref="containerRef" style="height: 300px; overflow-y: auto">
          <div
            id="part1"
            style="
              height: 300px;
              background: rgba(255, 0, 0, 0.02);
              margin-top: 30px;
            "
          >
            part1
          </div>
          <div
            id="part2"
            style="
              height: 300px;
              background: rgba(0, 255, 0, 0.02);
              margin-top: 30px;
            "
          >
            part2
          </div>
          <div
            id="part3"
            style="
              height: 300px;
              background: rgba(0, 0, 255, 0.02);
              margin-top: 30px;
            "
          >
            part3
          </div>
        </div>
      </w-col>
      <w-col :span="6">
        <w-anchor
          :container="containerRef"
          direction="vertical"
          :offset="30"
          class="ml-4"
          @click="handleClick"
        >
          <w-anchor-link href="#part1" title="part1" />
          <w-anchor-link href="#part2" title="part2" />
          <w-anchor-link href="#part3" title="part3" />
        </w-anchor>
      </w-col>
    </w-row>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const containerRef = ref<HTMLElement | null>(null)

const handleClick = (e: MouseEvent) => {
  e.preventDefault()
}
</script>
```

:::

:::demo

```vue
<template>
  <w-anchor :offset="70" @change="handleChange">
    <w-anchor-link :href="`#${locale['basic-usage']}`">
      {{ locale['Basic Usage'] }}
    </w-anchor-link>
    <w-anchor-link :href="`#${locale['horizontal-mode']}`">
      {{ locale['Horizontal Mode'] }}
    </w-anchor-link>
    <w-anchor-link :href="`#${locale['scroll-container']}`">
      {{ locale['Scroll Container'] }}
    </w-anchor-link>
    <w-anchor-link :href="`#${locale['anchor-api']}`">
      {{ locale['Anchor API'] }}
      <template #sub-link>
        <w-anchor-link :href="`#${locale['anchor-attributes']}`">
          {{ locale['Anchor Attributes'] }}
        </w-anchor-link>
        <w-anchor-link :href="`#${locale['anchor-events']}`">
          {{ locale['Anchor Events'] }}
        </w-anchor-link>
      </template>
    </w-anchor-link>
  </w-anchor>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import anchorLocale from '../../.vitepress/i18n/component/anchor.json'
import { useLang } from '~/composables/lang'

const lang = useLang()
const locale = computed(() => anchorLocale[lang.value])

const handleChange = (href: string) => {
  console.log(`anchor change: ${href}`)
}
</script>
```

:::

:::demo

```vue
<template>
  <w-anchor type="underline" :offset="70">
    <w-anchor-link :href="`#${locale['basic-usage']}`">
      {{ locale['Basic Usage'] }}
    </w-anchor-link>
    <w-anchor-link :href="`#${locale['horizontal-mode']}`">
      {{ locale['Horizontal Mode'] }}
    </w-anchor-link>
    <w-anchor-link :href="`#${locale['scroll-container']}`">
      {{ locale['Scroll Container'] }}
    </w-anchor-link>
    <w-anchor-link :href="`#${locale['anchor-api']}`">
      {{ locale['Anchor API'] }}
      <template #sub-link>
        <w-anchor-link :href="`#${locale['anchor-attributes']}`">
          {{ locale['Anchor Attributes'] }}
        </w-anchor-link>
        <w-anchor-link :href="`#${locale['anchor-events']}`">
          {{ locale['Anchor Events'] }}
        </w-anchor-link>
      </template>
    </w-anchor-link>
  </w-anchor>
</template>

<script lang="ts" setup>
import { computed } from 'vue'
import anchorLocale from '../../.vitepress/i18n/component/anchor.json'
import { useLang } from '~/composables/lang'

const lang = useLang()
const locale = computed(() => anchorLocale[lang.value])
</script>
```

:::

:::demo

```vue
<template>
  <w-affix :offset="60">
    <w-anchor :offset="70" style="width: 300px">
      <w-anchor-link :href="`#${locale['basic-usage']}`">
        {{ locale['Basic Usage'] }}
      </w-anchor-link>
      <w-anchor-link :href="`#${locale['horizontal-mode']}`">
        {{ locale['Horizontal Mode'] }}
      </w-anchor-link>
      <w-anchor-link :href="`#${locale['scroll-container']}`">
        {{ locale['Scroll Container'] }}
      </w-anchor-link>
      <w-anchor-link :href="`#${locale['anchor-api']}`">
        {{ locale['Anchor API'] }}
        <template #sub-link>
          <w-anchor-link :href="`#${locale['anchor-attributes']}`">
            {{ locale['Anchor Attributes'] }}
          </w-anchor-link>
          <w-anchor-link :href="`#${locale['anchor-events']}`">
            {{ locale['Anchor Events'] }}
          </w-anchor-link>
        </template>
      </w-anchor-link>
    </w-anchor>
  </w-affix>
</template>
<script lang="ts" setup>
import { computed } from 'vue'
import anchorLocale from '../../.vitepress/i18n/component/anchor.json'
import { useLang } from '~/composables/lang'

const lang = useLang()
const locale = computed(() => anchorLocale[lang.value])
</script>
```

:::

### API 文档

### Attributes

| 属性              | 说明                               | 类型                                   | 默认值     |
| ----------------- | ---------------------------------- | -------------------------------------- | ---------- |
| container         | 滚动的容器                         | `string` \| `HTMLElement` \| `Window ` | —          |
| offset            | 设置锚点滚动的偏移量               | `number`                               | 0          |
| bound             | 触发锚点的元素的位置偏移量         | `number`                               | 15         |
| duration          | 设置容器滚动持续时间，单位为毫秒。 | `number`                               | 300        |
| marker            | 是否显示标记                       | ^[boolean]                             | true       |
| type              | 设置锚点类型                       | ^[enum]`'default' \| 'underline'`      | `default`  |
| direction         | 设置锚点方向                       | ^[enum]`'vertical' \| 'horizontal'`    | `vertical` |
| select-scroll-top | 滚动时，链接是否选中位于顶部       | ^[boolean]                             | false      |

### Events

| 事件名 | 说明                 | 类型                                                |
| ------ | -------------------- | --------------------------------------------------- |
| change | step 改变时的回调    | ^[Function]`(href: string) => void`                 |
| click  | 当用户点击链接时触发 | ^[Function]`(e: MouseEvent, href?: string) => void` |

### Methods

| 名称     | 说明                 | 类型                                |
| -------- | -------------------- | ----------------------------------- |
| scrollTo | 手动滚动到特定位置。 | ^[Function]`(href: string) => void` |

### Slots

| 名称    | 说明                |
| ------- | ------------------- |
| default | AnchorLink 组件列表 |

## AnchorLink API

### Attributes

| 属性  | 说明             | 类型     | 默认值 |
| ----- | ---------------- | -------- | ------ |
| title | 链接的文本内容。 | `string` | —      |
| href  | 链接的地址。     | `string` | —      |

### Slots

| 名称     | 说明           |
| -------- | -------------- |
| default  | 链接的内容     |
| sub-link | 子链接的槽位。 |

---

## Backtop 回到顶部

返回页面顶部的操作按钮。

### 示例

:::demo

```vue
<template>
  Scroll down to see the bottom-right button.
  <w-backtop :right="100" :bottom="100" />
</template>
```

:::

:::demo

```vue
<template>
  Scroll down to see the bottom-right button.
  <w-backtop :bottom="100">
    <div
      style="
        height: 100%;
        width: 100%;
        background-color: var(--w3-bg-color-overlay);
        box-shadow: var(--w3-box-shadow-lighter);
        text-align: center;
        line-height: 40px;
        color: #1989fa;
      "
    >
      UP
    </div>
  </w-backtop>
</template>
```

:::

### API 文档

### Attributes

| 名称                | 说明               | 类型        | 默认值 |
| ----------------- | ---------------- | --------- | --- |
| target            | 触发滚动的对象          | ^[string] | —   |
| visibility-height | 滚动高度达到此参数值才出现    | ^[number] | 200 |
| right             | 控制其显示位置，距离页面右边距  | ^[number] | 40  |
| bottom            | 控制其显示位置，距离页面底部距离 | ^[number] | 40  |

### Events

| 名称    | 说明        | 回调参数                                      |
| ----- | --------- | ----------------------------------------- |
| click | 点击按钮触发的事件 | ^[Function]`(evt: MouseEvent) => void` |

### Slots

| 插槽名     | 说明      |
| ------- | ------- |
| default | 自定义默认内容 |

---

## Breadcrumb 面包屑

显示当前页面的路径，快速返回之前的任意页面。

### 示例

:::demo 在 `w-breadcrumb` 中使用 `w-breadcrumb-item` 标签表示从首页开始的每一级。 该组件接受一个 `String` 类型的参数 `separator`来作为分隔符。 默认值为 '/'。

```vue
<template>
  <w-breadcrumb separator="/">
    <w-breadcrumb-item :to="{ path: '/' }">首页</w-breadcrumb-item>
    <w-breadcrumb-item>
      <a href="/">列表页面</a>
    </w-breadcrumb-item>
    <w-breadcrumb-item>详情页面</w-breadcrumb-item>
    <w-breadcrumb-item>详情页面</w-breadcrumb-item>
  </w-breadcrumb>
</template>
```

:::

:::demo 通过设置 `separator-class` 可使用相应的 `iconfont` 作为分隔符，注意这将使 `separator` 失效。

```vue
<template>
  <w-breadcrumb :separator-icon="ArrowRight">
    <w-breadcrumb-item :to="{ path: '/' }">首页</w-breadcrumb-item>
    <w-breadcrumb-item>列表页面</w-breadcrumb-item>
    <w-breadcrumb-item>详情页面</w-breadcrumb-item>
    <w-breadcrumb-item>详情页面</w-breadcrumb-item>
  </w-breadcrumb>
</template>

<script lang="ts" setup>
import { ArrowRight } from '@win-design-next/icons-vue'
</script>
```

:::

### API 文档

### Attributes

| 属性名         | 说明                     | 类型                     | 默认值 |
| -------------- | ------------------------ | ------------------------ | ------ |
| separator      | 分隔符                   | ^[string]                | /      |
| separator-icon | 图标分隔符的组件或组件名 | ^[string] / ^[Component] | —      |

### Slots

| 插槽名  | 说明           | 子标签          |
| ------- | -------------- | --------------- |
| default | 自定义默认内容 | Breadcrumb Item |

## Breadcrumb-Item API

### Attributes

| 属性名  | 说明                                            | 类型                                    | 默认值 |
| ------- | ----------------------------------------------- | --------------------------------------- | ------ |
| to      | 路由跳转目标，同 `vue-router` 的 `to` 属性      | ^[string] / ^[object]`RouteLocationRaw` | ''     |
| replace | 如果设置该属性为 `true`, 导航将不会留下历史记录 | ^[boolean]                              | false  |

### Slots

| 插槽名  | 说明           |
| ------- | -------------- |
| default | 自定义默认内容 |

---

## Dropdown 下拉菜单

将动作或菜单折叠到下拉菜单中。

### 示例

:::demo 通过组件 `slot` 来设置下拉触发的元素以及需要通过具名 `slot` 为 `dropdown` 来设置下拉菜单。 默认情况下，只需要悬停在触发菜单的元素上即可，无需点击也会显示下拉菜单。

```vue
<template>
  <w-dropdown @visible-change="(val: boolean) => (visible = val)">
    <span class="w3-dropdown-link">
      点击下拉列表
      <w-fake-arrow :is-active="visible" />
    </span>
    <template #dropdown>
      <w-dropdown-menu>
        <w-dropdown-item>待就诊</w-dropdown-item>
        <w-dropdown-item>就诊中</w-dropdown-item>
        <w-dropdown-item>检查中</w-dropdown-item>
        <w-dropdown-item disabled>检验中</w-dropdown-item>
        <w-dropdown-item divided>退出</w-dropdown-item>
      </w-dropdown-menu>
    </template>
  </w-dropdown>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const visible = ref(false)
</script>

<style scoped>
.example-showcase .w3-dropdown-link {
  cursor: pointer;
  color: var(--w3-color-primary);
  display: flex;
  align-items: center;
}
</style>
```

:::

:::demo 设置 `placement` 属性，使下拉菜单出现在不同位置。

```vue
<template>
  <div class="flex flex-wrap items-center gap-4">
    <w-dropdown placement="top-start">
      <w-button> topStart </w-button>
      <template #dropdown>
        <w-dropdown-menu>
          <w-dropdown-item>The Action 1st</w-dropdown-item>
          <w-dropdown-item>The Action 2st</w-dropdown-item>
          <w-dropdown-item>The Action 3st</w-dropdown-item>
        </w-dropdown-menu>
      </template>
    </w-dropdown>
    <w-dropdown placement="top">
      <w-button> top </w-button>
      <template #dropdown>
        <w-dropdown-menu>
          <w-dropdown-item>The Action 1st</w-dropdown-item>
          <w-dropdown-item>The Action 2st</w-dropdown-item>
          <w-dropdown-item>The Action 3st</w-dropdown-item>
        </w-dropdown-menu>
      </template>
    </w-dropdown>
    <w-dropdown placement="top-end">
      <w-button> topEnd </w-button>
      <template #dropdown>
        <w-dropdown-menu>
          <w-dropdown-item>The Action 1st</w-dropdown-item>
          <w-dropdown-item>The Action 2st</w-dropdown-item>
          <w-dropdown-item>The Action 3st</w-dropdown-item>
        </w-dropdown-menu>
      </template>
    </w-dropdown>
    <w-dropdown placement="bottom-start">
      <w-button> bottomStart </w-button>
      <template #dropdown>
        <w-dropdown-menu>
          <w-dropdown-item>The Action 1st</w-dropdown-item>
          <w-dropdown-item>The Action 2st</w-dropdown-item>
          <w-dropdown-item>The Action 3st</w-dropdown-item>
        </w-dropdown-menu>
      </template>
    </w-dropdown>
    <w-dropdown placement="bottom">
      <w-button> bottom </w-button>
      <template #dropdown>
        <w-dropdown-menu>
          <w-dropdown-item>The Action 1st</w-dropdown-item>
          <w-dropdown-item>The Action 2st</w-dropdown-item>
          <w-dropdown-item>The Action 3st</w-dropdown-item>
        </w-dropdown-menu>
      </template>
    </w-dropdown>
    <w-dropdown placement="bottom-end">
      <w-button> bottomEnd </w-button>
      <template #dropdown>
        <w-dropdown-menu>
          <w-dropdown-item>The Action 1st</w-dropdown-item>
          <w-dropdown-item>The Action 2st</w-dropdown-item>
          <w-dropdown-item>The Action 3st</w-dropdown-item>
        </w-dropdown-menu>
      </template>
    </w-dropdown>
  </div>
</template>
```

:::

:::demo 设置 `split-button` 属性来让触发下拉元素呈现为按钮组，左边是功能按钮，右边是触发下拉菜单的按钮，设置为 `true` 即可。 如果你想要在第三和第四个选项之间添加一个分隔符，你只需要为第四个选项添加一个 `divider` 的 CSS class。

```vue
<template>
  <div class="flex flex-wrap items-center">
    <w-dropdown>
      <w-button type="primary">
        下拉列表<w-icon class="w3-icon--right"><arrow-down /></w-icon>
      </w-button>
      <template #dropdown>
        <w-dropdown-menu>
          <w-dropdown-item>Action 1</w-dropdown-item>
          <w-dropdown-item>Action 2</w-dropdown-item>
          <w-dropdown-item>Action 3</w-dropdown-item>
          <w-dropdown-item>Action 4</w-dropdown-item>
          <w-dropdown-item>Action 5</w-dropdown-item>
        </w-dropdown-menu>
      </template>
    </w-dropdown>
    <w-dropdown split-button type="primary" @click="handleClick">
      下拉列表
      <template #dropdown>
        <w-dropdown-menu>
          <w-dropdown-item>Action 1</w-dropdown-item>
          <w-dropdown-item>Action 2</w-dropdown-item>
          <w-dropdown-item>Action 3</w-dropdown-item>
          <w-dropdown-item>Action 4</w-dropdown-item>
          <w-dropdown-item>Action 5</w-dropdown-item>
        </w-dropdown-menu>
      </template>
    </w-dropdown>
  </div>
</template>

<script lang="ts" setup>
import { ArrowDown } from '@win-design-next/icons-vue'

const handleClick = () => {
  // eslint-disable-next-line no-alert
  alert('button click')
}
</script>

<style scoped>
.example-showcase .w3-dropdown + .w3-dropdown {
  margin-left: 15px;
}
.example-showcase .w3-dropdown-link {
  cursor: pointer;
  color: var(--w3-color-primary);
  display: flex;
  align-items: center;
}
</style>
```

:::

:::demo 将 `trigger` 属性设置为 click 即可， 默认为 `hover`。

```vue
<template>
  <w-row class="block-col-2">
    <w-col :span="8">
      <span class="demonstration">hover to trigger</span>
      <w-dropdown>
        <span class="w3-dropdown-link">
          下拉列表<w-icon class="w3-icon--right"><arrow-down /></w-icon>
        </span>
        <template #dropdown>
          <w-dropdown-menu>
            <w-dropdown-item :icon="Plus">Action 1</w-dropdown-item>
            <w-dropdown-item :icon="CirclePlusFilled">
              Action 2
            </w-dropdown-item>
            <w-dropdown-item :icon="CirclePlus">Action 3</w-dropdown-item>
            <w-dropdown-item :icon="Check">Action 4</w-dropdown-item>
            <w-dropdown-item :icon="CircleCheck">Action 5</w-dropdown-item>
          </w-dropdown-menu>
        </template>
      </w-dropdown>
    </w-col>
    <w-col :span="8">
      <span class="demonstration">click to trigger</span>
      <w-dropdown trigger="click">
        <span class="w3-dropdown-link">
          下拉列表<w-icon class="w3-icon--right"><arrow-down /></w-icon>
        </span>
        <template #dropdown>
          <w-dropdown-menu>
            <w-dropdown-item :icon="Plus">Action 1</w-dropdown-item>
            <w-dropdown-item :icon="CirclePlusFilled">
              Action 2
            </w-dropdown-item>
            <w-dropdown-item :icon="CirclePlus">Action 3</w-dropdown-item>
            <w-dropdown-item :icon="Check">Action 4</w-dropdown-item>
            <w-dropdown-item :icon="CircleCheck">Action 5</w-dropdown-item>
          </w-dropdown-menu>
        </template>
      </w-dropdown>
    </w-col>
    <w-col :span="8">
      <span class="demonstration">right click to trigger</span>
      <w-dropdown trigger="contextmenu">
        <span class="w3-dropdown-link">
          下拉列表<w-icon class="w3-icon--right"><arrow-down /></w-icon>
        </span>
        <template #dropdown>
          <w-dropdown-menu>
            <w-dropdown-item :icon="Plus">Action 1</w-dropdown-item>
            <w-dropdown-item :icon="CirclePlusFilled">
              Action 2
            </w-dropdown-item>
            <w-dropdown-item :icon="CirclePlus">Action 3</w-dropdown-item>
            <w-dropdown-item :icon="Check">Action 4</w-dropdown-item>
            <w-dropdown-item :icon="CircleCheck">Action 5</w-dropdown-item>
          </w-dropdown-menu>
        </template>
      </w-dropdown>
    </w-col>
  </w-row>
</template>

<script lang="ts" setup>
import {
  ArrowDown,
  Check,
  CircleCheck,
  CirclePlus,
  CirclePlusFilled,
  Plus,
} from '@win-design-next/icons-vue'
</script>

<style scoped>
.block-col-2 .demonstration {
  display: block;
  color: var(--w3-font-color-second);
  font-size: 14px;
  margin-bottom: 20px;
}

.block-col-2 .w3-dropdown-link {
  display: flex;
  align-items: center;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-card class="content" @click="handleClick" @contextmenu="handleContextmenu">
    右键点击弹出菜单
  </w-card>
  <w-dropdown
    ref="dropdownRef"
    :virtual-ref="triggerRef"
    :show-arrow="false"
    :popper-options="{
      modifiers: [{ name: 'offset', options: { offset: [0, 0] } }],
    }"
    virtual-triggering
    trigger="contextmenu"
    placement="bottom-start"
  >
    <template #dropdown>
      <w-dropdown-menu>
        <w-dropdown-item>待就诊</w-dropdown-item>
        <w-dropdown-item>就诊中</w-dropdown-item>
        <w-dropdown-item>检查中</w-dropdown-item>
        <w-dropdown-item disabled>检验中</w-dropdown-item>
        <w-dropdown-item divided>退出</w-dropdown-item>
      </w-dropdown-menu>
    </template>
  </w-dropdown>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { DropdownInstance } from 'win-design-next'

const dropdownRef = ref<DropdownInstance>()
const position = ref({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
} as DOMRect)

const triggerRef = ref({
  getBoundingClientRect: () => position.value,
})

const handleClick = () => {
  dropdownRef.value?.handleClose()
}

const handleContextmenu = (event: MouseEvent) => {
  const { clientX, clientY } = event
  position.value = DOMRect.fromRect({
    x: clientX,
    y: clientY,
  })
  event.preventDefault()

  dropdownRef.value?.handleOpen()
}
</script>

<style scoped>
.content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200px;
}
</style>
```

:::

:::demo 下拉菜单默认在点击菜单项后会被隐藏，将 hide-on-click 属性设置为 false 可以关闭此功能。

```vue
<template>
  <w-dropdown :hide-on-click="false">
    <span class="w3-dropdown-link">
      下拉列表<w-icon class="w3-icon--right"><arrow-down /></w-icon>
    </span>
    <template #dropdown>
      <w-dropdown-menu>
        <w-dropdown-item>Action 1</w-dropdown-item>
        <w-dropdown-item>Action 2</w-dropdown-item>
        <w-dropdown-item>Action 3</w-dropdown-item>
        <w-dropdown-item disabled>Action 4</w-dropdown-item>
        <w-dropdown-item divided>Action 5</w-dropdown-item>
        <w-dropdown-item divided>Action 6</w-dropdown-item>
      </w-dropdown-menu>
    </template>
  </w-dropdown>
</template>

<script lang="ts" setup>
import { ArrowDown } from '@win-design-next/icons-vue'
</script>

<style scoped>
.example-showcase .w3-dropdown + .w3-dropdown {
  margin-left: 15px;
}
.example-showcase .w3-dropdown-link {
  cursor: pointer;
  color: var(--w3-color-primary);
  display: flex;
  align-items: center;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-dropdown @command="handleCommand">
    <span class="w3-dropdown-link">
      下拉列表<w-icon class="w3-icon--right"><arrow-down /></w-icon>
    </span>
    <template #dropdown>
      <w-dropdown-menu>
        <w-dropdown-item command="a">Action 1</w-dropdown-item>
        <w-dropdown-item command="b">Action 2</w-dropdown-item>
        <w-dropdown-item command="c">Action 3</w-dropdown-item>
        <w-dropdown-item command="d" disabled>Action 4</w-dropdown-item>
        <w-dropdown-item command="e" divided>Action 5</w-dropdown-item>
      </w-dropdown-menu>
    </template>
  </w-dropdown>
</template>

<script lang="ts" setup>
import { WMessage } from 'win-design-next'
import { ArrowDown } from '@win-design-next/icons-vue'

const handleCommand = (command: string | number | object) => {
  WMessage(`click on item ${command}`)
}
</script>

<style scoped>
.example-showcase .w3-dropdown-link {
  cursor: pointer;
  color: var(--w3-color-primary);
  display: flex;
  align-items: center;
}
</style>
```

:::

:::demo

```vue
<template>
  <div style="font-size: 14px">
    <p>open(close) the 下拉列表2 will close(open) the 下拉列表1.</p>
  </div>
  <div style="margin: 15px">
    <w-button @click="showClick">show</w-button>
  </div>
  <w-dropdown ref="dropdown1" trigger="contextmenu" style="margin-right: 30px">
    <span class="w3-dropdown-link"> 下拉列表1 </span>
    <template #dropdown>
      <w-dropdown-menu>
        <w-dropdown-item>Action 1</w-dropdown-item>
        <w-dropdown-item>Action 2</w-dropdown-item>
        <w-dropdown-item>Action 3</w-dropdown-item>
        <w-dropdown-item disabled>Action 4</w-dropdown-item>
        <w-dropdown-item divided>Action 5</w-dropdown-item>
      </w-dropdown-menu>
    </template>
  </w-dropdown>

  <w-dropdown trigger="contextmenu" @visible-change="handleVisible2">
    <span class="w3-dropdown-link"> 下拉列表2 </span>
    <template #dropdown>
      <w-dropdown-menu>
        <w-dropdown-item>Action 1</w-dropdown-item>
        <w-dropdown-item>Action 2</w-dropdown-item>
        <w-dropdown-item>Action 3</w-dropdown-item>
        <w-dropdown-item disabled>Action 4</w-dropdown-item>
        <w-dropdown-item divided>Action 5</w-dropdown-item>
      </w-dropdown-menu>
    </template>
  </w-dropdown>
</template>

<script setup lang="ts">
import { ref } from 'vue'

import type { DropdownInstance } from 'win-design-next'

const dropdown1 = ref<DropdownInstance>()
function handleVisible2(visible: any) {
  if (!dropdown1.value) return
  if (visible) {
    dropdown1.value.handleClose()
  } else {
    dropdown1.value.handleOpen()
  }
}
function showClick() {
  if (!dropdown1.value) return
  dropdown1.value.handleOpen()
}
</script>

<style scoped>
.example-showcase .w3-dropdown-link {
  cursor: pointer;
  color: var(--w3-color-primary);
  display: flex;
  align-items: center;
}
</style>
```

:::

:::demo 使用 `size` 属性配置尺寸，可选的尺寸大小有: `large`, `default` 或 `small`

```vue
<template>
  <w-dropdown size="large" split-button type="primary">
    Large
    <template #dropdown>
      <w-dropdown-menu>
        <w-dropdown-item>Action 1</w-dropdown-item>
        <w-dropdown-item>Action 2</w-dropdown-item>
        <w-dropdown-item>Action 3</w-dropdown-item>
        <w-dropdown-item>Action 4</w-dropdown-item>
      </w-dropdown-menu>
    </template>
  </w-dropdown>

  <w-dropdown split-button type="danger">
    Default
    <template #dropdown>
      <w-dropdown-menu>
        <w-dropdown-item>Action 1</w-dropdown-item>
        <w-dropdown-item>Action 2</w-dropdown-item>
        <w-dropdown-item>Action 3</w-dropdown-item>
        <w-dropdown-item>Action 4</w-dropdown-item>
      </w-dropdown-menu>
    </template>
  </w-dropdown>

  <w-dropdown size="small" split-button type="error">
    Small
    <template #dropdown>
      <w-dropdown-menu>
        <w-dropdown-item>Action 1</w-dropdown-item>
        <w-dropdown-item>Action 2</w-dropdown-item>
        <w-dropdown-item>Action 3</w-dropdown-item>
        <w-dropdown-item>Action 4</w-dropdown-item>
      </w-dropdown-menu>
    </template>
  </w-dropdown>

  <w-dropdown size="mini" split-button type="success">
    Mini
    <template #dropdown>
      <w-dropdown-menu>
        <w-dropdown-item>Action 1</w-dropdown-item>
        <w-dropdown-item>Action 2</w-dropdown-item>
        <w-dropdown-item>Action 3</w-dropdown-item>
        <w-dropdown-item>Action 4</w-dropdown-item>
      </w-dropdown-menu>
    </template>
  </w-dropdown>
</template>

<style scoped>
.example-showcase .w3-dropdown + .w3-dropdown {
  margin-left: 15px;
}
</style>
```

:::

### API 文档

### Attributes

| 属性名         | 说明                                                                                                     | 类型                                                                                                                    | Default                                                                    |
| -------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| type           | 菜单按钮类型，同 `Button` 组件一样，仅在 `split-button` 为 true 的情况下有效。                           | ^[enum]`'' \| 'default' \| 'primary' \| 'success' \| 'warning' \| 'info' \| 'danger' \| 'error' \| 'text' (deprecated)` | ''                                                                         |
| size           | 菜单尺寸，在 split-button 为 true 的情况下也对触发按钮生效。                                             | ^[enum]`'' \| 'large' \| 'default' \| 'small'`                                                                          | ''                                                                         |
| button-props   | 按钮组件的 props，参考 [按钮属性](./button.html#button-attributes)                                       | ^[object]                                                                                                               | —                                                                          |
| max-height     | 菜单最大高度                                                                                             | ^[string] / ^[number]                                                                                                   | ''                                                                         |
| split-button   | 下拉触发元素呈现为按钮组                                                                                 | ^[boolean]                                                                                                              | false                                                                      |
| disabled       | 是否禁用                                                                                                 | ^[boolean]                                                                                                              | false                                                                      |
| placement      | 菜单弹出位置                                                                                             | ^[enum]`'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end'`                                | bottom                                                                     |
| effect         | Tooltip 主题，内置了: `dark` / `lighter`                                                                 | ^[enum]`'dark' \| 'light'` / ^[string]                                                                                  | lighter                                                                    |
| trigger        | 触发下拉的行为                                                                                           | ^[enum]`'hover' \| 'click' \| 'contextmenu'`                                                                            | hover                                                                      |
| triggerKeys    | 指定键盘上哪些按键可以触发操作                                                                           | ^[array]`string[]`                                                                                                      | `['Enter', 'Space', 'ArrowDown', 'NumpadEnter']`                           |
| hide-on-click  | 是否在点击菜单项后隐藏菜单                                                                               | ^[boolean]                                                                                                              | true                                                                       |
| show-timeout   | 展开下拉菜单的延时，仅在 trigger 为 hover 时有效                                                         | ^[number]                                                                                                               | 150                                                                        |
| hide-timeout   | 收起下拉菜单的延时（仅在 trigger 为 hover 时有效）                                                       | ^[number]                                                                                                               | 150                                                                        |
| role           | 下拉菜单的 ARIA 属性。 根据具体场景，您可能想要将此更改为“navigation”                                    | ^[enum]`'dialog' \| 'grid' \| 'group' \| 'listbox' \| 'menu' \| 'navigation' \| 'tooltip' \| 'tree'`                    | menu                                                                       |
| tabindex       | Dropdown 组件的 [tabindex](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/tabindex) | ^[number] / ^[string]                                                                                                   | 0                                                                          |
| popper-class   | 自定义浮层类名                                                                                           | ^[string]                                                                                                               | ''                                                                         |
| popper-options | [popper.js](https://popper.js.org/docs/v2/) 参数                                                         | ^[object]                                                                                                               | `{modifiers: [{name: 'computeStyles',options: {gpuAcceleration: false}}]}` |
| teleported     | 是否将下拉列表插入至 body 元素                                                                           | ^[boolean]                                                                                                              | true                                                                       |
| persistent     | 当下拉菜单处于非活动状态且 persistent 为 false 时，下拉菜单将被销毁                                      | ^[boolean]                                                                                                              | true                                                                       |

### Slots

| 插槽名   | 说明                                                                                                              | 子标签        |
| -------- | ----------------------------------------------------------------------------------------------------------------- | ------------- |
| default  | 下拉菜单的内容。 注意：必须是有效的 html DOM 元素（例如 `<span>、<button>` 等）或 `w-component`，以附加监听触发器 | —             |
| dropdown | 下拉列表，通常是 `<w-dropdown-menu>` 组件                                                                         | Dropdown-Menu |

### Events

| 事件名         | 说明                                                                       | 类型                                  |
| -------------- | -------------------------------------------------------------------------- | ------------------------------------- |
| click          | `split-button` 为 true 时，点击左侧按钮的回调                              | ^[Function]`(e: MouseEvent) => void`  |
| command        | 当下拉项被点击时触发，参数是从下拉菜单中发送的命令                         | ^[Function]`(...args: any[]) => void` |
| visible-change | 当下拉菜单出现/消失时触发器, 当它出现时, 参数将是 `true`, 否则将是 `false` | ^[Function]`(val: boolean) => void`   |

### Exposes

| 方法名      | 说明         | Type                    |
| ----------- | ------------ | ----------------------- |
| handleOpen  | 打开下拉菜单 | ^[Function]`() => void` |
| handleClose | 关闭下拉菜单 | ^[Function]`() => void` |

## Dropdown-Menu API

### Slots

| 插槽名  | 说明           | 子标签        |
| ------- | -------------- | ------------- |
| default | 下拉菜单的内容 | Dropdown-Item |

## Dropdown-Item API

### Attributes

| 属性名   | 说明                              | Type                              | 默认值 |
| -------- | --------------------------------- | --------------------------------- | ------ |
| command  | 派发到`command`回调函数的指令参数 | ^[string] / ^[number] / ^[object] | —      |
| disabled | 是否禁用                          | ^[boolean]                        | false  |
| divided  | 是否显示分隔符                    | ^[boolean]                        | false  |
| icon     | 自定义图标                        | ^[string] / ^[Component]          | —      |

### Slots

| 插槽名  | 说明                      |
| ------- | ------------------------- |
| default | 自定义 Dropdown-Item 内容 |

---

## Menu 菜单

为网站提供导航功能的菜单。

### 示例

:::demo 导航菜单默认为垂直模式，通过将 mode 属性设置为 horizontal 来使导航菜单变更为水平模式。 另外，在菜单中通过 sub-menu 组件可以生成二级菜单。 Menu 还提供了`bg-color`、`item-text-color`和`item-active-text-color`，分别用于设置菜单的背景色、菜单的文字颜色和当前激活菜单的文字颜色。

```vue
<template>
  <w-menu
    :default-active="activeIndex"
    class="w3-menu-demo"
    mode="horizontal"
    @select="handleSelect"
  >
    <w-menu-item index="1">
      <w-icon><User /></w-icon>
      患者中心</w-menu-item
    >
    <w-sub-menu index="2">
      <template #title>特别关注</template>
      <w-menu-item index="2-1">一号患者</w-menu-item>
      <w-menu-item index="2-2">二号患者</w-menu-item>
      <w-menu-item index="2-3">三号患者</w-menu-item>
      <w-sub-menu index="2-4">
        <template #title>特殊患者</template>
        <w-menu-item index="2-4-1">一号患者</w-menu-item>
        <w-menu-item index="2-4-2">二号患者</w-menu-item>
        <w-menu-item index="2-4-3">三号患者</w-menu-item>
      </w-sub-menu>
    </w-sub-menu>
    <w-menu-item index="3" disabled>患者列表</w-menu-item>
    <w-menu-item index="4">个人设置</w-menu-item>
  </w-menu>
  <w-menu
    :default-active="activeIndex2"
    class="w3-menu-demo"
    mode="horizontal"
    bg-color="#2d5afa"
    item-text-color="#fff"
    item-active-text-color="#fff"
    item-hover-text-color="#fff"
    item-active-border-color="#ff8c00"
    @select="handleSelect"
  >
    <w-menu-item index="1">
      <w-icon><User /></w-icon>
      患者中心</w-menu-item
    >
    <w-sub-menu index="2">
      <template #title>特别关注</template>
      <w-menu-item index="2-1">一号患者</w-menu-item>
      <w-menu-item index="2-2">二号患者</w-menu-item>
      <w-menu-item index="2-3">三号患者</w-menu-item>
      <w-sub-menu index="2-4">
        <template #title>特殊患者</template>
        <w-menu-item index="2-4-1">一号患者</w-menu-item>
        <w-menu-item index="2-4-2">二号患者</w-menu-item>
        <w-menu-item index="2-4-3">三号患者</w-menu-item>
      </w-sub-menu>
    </w-sub-menu>
    <w-menu-item index="3" disabled>患者列表</w-menu-item>
    <w-menu-item index="4">个人设置</w-menu-item>
  </w-menu>
  <w-menu
    :default-active="activeIndex2"
    class="w3-menu-demo"
    mode="horizontal"
    bg-color="#2DB7A0"
    item-text-color="#fff"
    item-hover-text-color="#fff"
    item-active-text-color="#BFFFF4"
    item-hover-bg-color="#218875"
    item-active-border-color="#218775"
    item-active-bg-color="#218875"
    @select="handleSelect"
  >
    <w-menu-item index="1">
      <w-icon><User /></w-icon>
      患者中心</w-menu-item
    >
    <w-menu-item index="2">特殊关注</w-menu-item>
    <w-menu-item index="3">患者列表</w-menu-item>
    <w-menu-item index="4">个人设置</w-menu-item>
  </w-menu>
  <w-menu
    :default-active="activeIndex2"
    class="w3-menu-demo"
    mode="horizontal"
    bg-color="#2D5AFA"
    border-color="#2D5AFA"
    item-text-color="#fff"
    item-hover-text-color="#fff"
    item-hover-bg-color="#2D5AFA"
    item-active-text-color="#fff"
    item-active-border-color="#41EDFF"
    item-active-bg-color="linear-gradient(-180deg, rgba(255,255,255,0.00) 0%, rgba(255,255,255,0.20) 99%)"
    @select="handleSelect"
  >
    <w-menu-item index="1">
      <w-icon><User /></w-icon>
      患者中心</w-menu-item
    >
    <w-menu-item index="2">特殊关注</w-menu-item>
    <w-menu-item index="3">患者列表</w-menu-item>
    <w-menu-item index="4">个人设置</w-menu-item>
  </w-menu>
  <w-menu
    :default-active="activeIndex2"
    class="w3-menu-demo"
    inner
    round
    mode="horizontal"
    bg-color="#F24F86"
    border-color="#FFEEF5"
    item-text-color="#fff"
    item-hover-text-color="#fff"
    item-active-text-color="#000"
    item-active-border-color="#FFEEF5"
    item-active-bg-color="#FFEEF5"
    @select="handleSelect"
  >
    <w-menu-item index="1">
      <w-icon><User /></w-icon>
      患者中心</w-menu-item
    >
    <w-menu-item index="2">特殊关注</w-menu-item>
    <w-menu-item index="3">患者列表</w-menu-item>
    <w-menu-item index="4">个人设置</w-menu-item>
  </w-menu>
  <w-menu
    :default-active="activeIndex2"
    class="w3-menu-demo"
    inner
    round
    mode="horizontal"
    bg-color="#722ED1"
    border-color="#9E6EE1"
    item-text-color="#fff"
    item-active-text-color="#000"
    item-hover-text-color="#fff"
    item-active-border-color="#9E6EE1"
    item-active-bg-color="linear-gradient(-180deg, #F5EDFF 0%, #9E6EE1 100%)"
    @select="handleSelect"
  >
    <w-menu-item index="1">
      <w-icon><User /></w-icon>
      患者中心</w-menu-item
    >
    <w-menu-item index="2">特殊关注</w-menu-item>
    <w-menu-item index="3">患者列表</w-menu-item>
    <w-menu-item index="4">个人设置</w-menu-item>
  </w-menu>
  <w-menu
    :default-active="activeIndex2"
    class="w3-menu-demo"
    inner
    round
    mode="horizontal"
    bg-color="#2d5afa"
    border-color="#5175F4"
    item-text-color="#fff"
    item-hover-text-color="#fff"
    item-bg-color="rgba(0,0,0,0.2)"
    item-hover-bg-color="rgba(0,0,0,0.2)"
    item-active-text-color="rgba(0,0,0,0.7)"
    item-active-border-color="#5175F4"
    item-active-bg-color="linear-gradient(-180deg, #EAEEFE 0%, #5175F4 98%)"
    @select="handleSelect"
  >
    <w-menu-item index="1">
      <w-icon><User /></w-icon>
      患者中心</w-menu-item
    >
    <w-menu-item index="2">特殊关注</w-menu-item>
    <w-menu-item index="3">患者列表</w-menu-item>
    <w-menu-item index="4">个人设置</w-menu-item>
  </w-menu>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { User } from '@win-design-next/icons-vue'

const activeIndex = ref('1')
const activeIndex2 = ref('2')
const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>

<style lang="scss" scoped>
.w3-menu-demo {
  margin-bottom: 20px;

  > .w3-menu-item {
    padding-left: 46px;
    padding-right: 46px;
  }
}
</style>
```

:::

:::demo 通过 w-menu-item-group 组件可以实现菜单进行分组，分组名可以通过 title 属性直接设定，也可以通过具名 slot 来设定。

```vue
<template>
  <div class="left-nav">
    <div class="left-nav-header">
      <w-input placeholder="请输入搜索内容" />
    </div>
    <div class="w3-menu-vertical-demo">
      <w-menu default-active="2-2" @open="handleOpen" @close="handleClose">
        <w-menu-item index="1">
          <w-icon><Home /></w-icon>
          工作台</w-menu-item
        >
        <w-sub-menu index="2">
          <template #title
            ><w-icon><Star /></w-icon>会诊申请</template
          >
          <w-menu-item index="2-1">申请查询</w-menu-item>
          <w-menu-item index="2-2">新建会诊</w-menu-item>
        </w-sub-menu>
        <w-menu-item index="3" disabled
          ><w-icon><Home /></w-icon>会诊任务</w-menu-item
        >
        <w-menu-item index="4"
          ><w-icon><Computer /></w-icon>会诊审核</w-menu-item
        >
        <w-menu-item index="5"
          ><w-icon><Home /></w-icon>随访管理</w-menu-item
        >
        <w-menu-item index="6"
          ><w-icon><Computer /></w-icon>会诊统计</w-menu-item
        >
      </w-menu>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Computer, Home, Star } from '@win-design-next/icons-vue'

const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>

<style lang="scss" scoped>
.left-nav {
  display: flex;
  flex-direction: column;
  width: 200px;
  height: 400px;
  background: var(--w3-color-primary-plain);
  padding: 4px;
  overflow: auto;

  .left-nav-header {
    margin: 12px 0;
  }
}
</style>
```

:::

:::demo

```vue
<template>
  <w-radio-group v-model="isCollapse" style="margin-bottom: 20px">
    <w-radio-button :value="false">expand</w-radio-button>
    <w-radio-button :value="true">collapse</w-radio-button>
  </w-radio-group>
  <w-menu
    default-active="2-1"
    class="w3-menu-vertical-demo"
    :collapse="isCollapse"
    @open="handleOpen"
    @close="handleClose"
  >
    <w-menu-item index="1">
      <w-icon><Home /></w-icon>
      <template #title>工作台</template></w-menu-item
    >
    <w-sub-menu index="2">
      <template #title
        ><w-icon><Star /></w-icon>
        <span>会诊申请</span>
      </template>
      <w-menu-item index="2-1">申请查询</w-menu-item>
      <w-menu-item index="2-2">新建会诊</w-menu-item>
    </w-sub-menu>
    <w-menu-item index="3" disabled
      ><w-icon><Home /></w-icon
      ><template #title>会诊任务</template></w-menu-item
    >
    <w-menu-item index="4"
      ><w-icon><Computer /></w-icon
      ><template #title>会诊审核</template></w-menu-item
    >
    <w-menu-item index="5"
      ><w-icon><Home /></w-icon
      ><template #title>随访管理</template></w-menu-item
    >
    <w-menu-item index="6"
      ><w-icon><Computer /></w-icon
      ><template #title>会诊统计</template></w-menu-item
    >
  </w-menu>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Computer, Home, Star } from '@win-design-next/icons-vue'

const isCollapse = ref(true)
const handleOpen = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
const handleClose = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>

<style lang="scss" scoped>
.w3-menu-vertical-demo:not(.w3-menu--collapse) {
  width: 192px;
  min-height: 400px;
}
</style>
```

:::

:::demo 您可以将菜单项放置在左边或右边。

```vue
<template>
  <w-menu
    :default-active="activeIndex"
    class="w3-menu-demo"
    mode="horizontal"
    :ellipsis="false"
    @select="handleSelect"
  >
    <w-menu-item index="0">
      <img style="width: 100px" src="/imgs/logo.png" alt="WinDesign Logo" />
    </w-menu-item>
    <w-menu-item index="1">患者中心</w-menu-item>
    <w-sub-menu index="2">
      <template #title>特别关注</template>
      <w-menu-item index="2-1">一号患者</w-menu-item>
      <w-menu-item index="2-2">二号患者</w-menu-item>
      <w-menu-item index="2-3">三号患者</w-menu-item>
      <w-sub-menu index="2-4">
        <template #title>特殊患者</template>
        <w-menu-item index="2-4-1">一号患者</w-menu-item>
        <w-menu-item index="2-4-2">二号患者</w-menu-item>
        <w-menu-item index="2-4-3">三号患者</w-menu-item>
      </w-sub-menu>
    </w-sub-menu>
    <w-menu-item index="3" disabled>患者列表</w-menu-item>
    <w-menu-item index="4">个人设置</w-menu-item>
  </w-menu>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const activeIndex = ref('1')
const handleSelect = (key: string, keyPath: string[]) => {
  console.log(key, keyPath)
}
</script>

<style scoped>
.w3-menu--horizontal > .w3-menu-item:nth-child(1) {
  margin-right: auto;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-menu
    ellipsis
    class="w3-menu-popper-demo"
    mode="horizontal"
    :popper-offset="16"
    style="max-width: 600px"
  >
    <w-menu-item index="1">患者中心</w-menu-item>
    <w-sub-menu index="2">
      <template #title>患者列表</template>
      <w-menu-item index="2-1">菜单 one</w-menu-item>
      <w-menu-item index="2-2">菜单 two</w-menu-item>
      <w-menu-item index="2-3">菜单 three</w-menu-item>
      <w-sub-menu index="2-4">
        <template #title>菜单 four</template>
        <w-menu-item index="2-4-1">菜单 one</w-menu-item>
        <w-menu-item index="2-4-2">菜单 two</w-menu-item>
        <w-menu-item index="2-4-3">菜单 three</w-menu-item>
      </w-sub-menu>
    </w-sub-menu>
    <w-sub-menu index="3" :popper-offset="8">
      <template #title>Override Popper Offset</template>
      <w-menu-item index="3-1">菜单 one</w-menu-item>
      <w-menu-item index="3-2">菜单 two</w-menu-item>
      <w-menu-item index="3-3">菜单 three</w-menu-item>
      <w-sub-menu index="3-4" :popper-offset="20">
        <template #title>override child</template>
        <w-menu-item index="3-4-1">菜单 one</w-menu-item>
        <w-menu-item index="3-4-2">菜单 two</w-menu-item>
        <w-menu-item index="3-4-3">菜单 three</w-menu-item>
      </w-sub-menu>
    </w-sub-menu>
    <w-menu-item index="4">特别关注</w-menu-item>
    <w-menu-item index="5">个人设置</w-menu-item>
    <w-menu-item index="6">消息提示</w-menu-item>
  </w-menu>
</template>

<script lang="ts" setup></script>
```

:::

### API 文档

### Attributes

| 属性名                               | 说明                                                                                                                              | 类型                                   | Default  |
| ------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | -------- |
| mode                                 | 菜单展示模式                                                                                                                      | ^[enum]`'horizontal' \| 'vertical'`    | vertical |
| collapse                             | 是否水平折叠收起菜单（仅在 mode 为 vertical 时可用）                                                                              | ^[boolean]                             | false    |
| ellipsis                             | 是否省略多余的子项（仅在横向模式生效）                                                                                            | ^[boolean]                             | true     |
| ellipsis-icon                        | 自定义省略图标 (仅在水平模式下可用)                                                                                               | ^[string] / ^[Component]               | —        |
| popper-offset                        | 弹出层的偏移量(对所有子菜单有效)                                                                                                  | ^[number]                              | 6        |
| default-active                       | 页面加载时默认激活菜单的 index                                                                                                    | ^[string]                              | ''       |
| default-openeds                      | 默认打开的 sub-menu 的 index 的数组                                                                                               | ^[object]`string[]`                    | []       |
| unique-opened                        | 是否只保持一个子菜单的展开                                                                                                        | ^[boolean]                             | false    |
| menu-trigger                         | 子菜单打开的触发方式，只在 `mode` 为 horizontal 时有效。                                                                          | ^[enum]`'hover' \| 'click'`            | hover    |
| router                               | 是否启用 `vue-router` 模式。 启用该模式会在激活导航时以 index 作为 path 进行路由跳转 使用 `default-active` 来设置加载时的激活项。 | ^[boolean]                             | false    |
| collapse-transition                  | 是否开启折叠动画                                                                                                                  | ^[boolean]                             | true     |
| popper-effect                        | Tooltip 主题，内置了 `dark` / `light` 两种主题，当菜单折叠时生效。                                                                | ^[enum]`'dark' \| 'light'` / ^[string] | dark     |
| close-on-click-outside               | 可选，单击外部时是否折叠菜单                                                                                                      | ^[boolean]                             | false    |
| popper-class                         | 为 popper 添加类名                                                                                                                | ^[string]                              | —        |
| show-timeout                         | 菜单出现前的延迟                                                                                                                  | ^[number]                              | 300      |
| hide-timeout                         | 菜单消失前的延迟                                                                                                                  | ^[number]                              | 300      |
| bg-color ^(deprecated)               | 菜单的背景颜色 (十六进制格式) (推荐在样式类中使用 `--w3-menu-bg-color`)                                                           | ^[string]                              | #ffffff  |
| item-text-color ^(deprecated)        | 菜单的文字颜色 (十六进制格式) (推荐在样式类中使用 `--w3-menu-item-text-color`)                                                    | ^[string]                              | #000     |
| item-active-text-color ^(deprecated) | 活动菜单项的文本颜色（十六进制格式）（推荐使用 css var `--w3-menu-item-active-color`）                                            | ^[string]                              | #000     |

### Events

| 事件名 | 说明                | 类型                         |
| ------ | ------------------- | ---------------------------- |
| select | 菜单激活回调        | ^[Function]`MenuSelectEvent` |
| open   | sub-menu 展开的回调 | ^[Function]`MenuOpenEvent`   |
| close  | sub-menu 收起的回调 | ^[Function]`MenuCloseEvent`  |

### Slots

| 插槽名  | 说明           | 子标签                                |
| ------- | -------------- | ------------------------------------- |
| default | 自定义默认内容 | SubMenu / Menu-Item / Menu-Item-Group |

### Exposes

| 方法名 | 说明                                             | 类型                                 |
| ------ | ------------------------------------------------ | ------------------------------------ |
| open   | 打开一个特定的子菜单，参数是要打开的子菜单的索引 | ^[Function]`(index: string) => void` |
| close  | 关闭一个特定的子菜单，参数是要关闭子菜单的索引   | ^[Function]`(index: string) => void` |

## SubMenu API

### Attributes

| 属性名              | 说明                                                                                                | 类型                     | 默认值    |
| ------------------- | --------------------------------------------------------------------------------------------------- | ------------------------ | --------- |
| index ^(required)   | 唯一标志                                                                                            | ^[string]                | —         |
| popper-class        | 为 popper 添加类名                                                                                  | ^[string]                | —         |
| show-timeout        | 子菜单出现之前的延迟，(继承 menu 的 `show-timeout` 配置)                                            | ^[number]                | —         |
| hide-timeout        | 子菜单消失之前的延迟，(继承 menu 的 `hide-timeout` 配置)                                            | ^[number]                | —         |
| disabled            | 是否禁用                                                                                            | ^[boolean]               | false     |
| teleported          | 是否将弹出菜单挂载到 body 上，第一级 SubMenu 默认值为 true，其他 SubMenus 的值为 false              | ^[boolean]               | undefined |
| popper-offset       | 弹出窗口的偏移量 (覆盖 `popper`的菜单)                                                              | ^[number]                | —         |
| expand-close-icon   | 父菜单展开且子菜单关闭时的图标， `expand-close-icon` 和 `expand-open-icon` 需要一起配置才能生效     | ^[string] / ^[Component] | —         |
| expand-open-icon    | 父菜单展开且子菜单打开时的图标， `expand-open-icon` 和 `expand-close-icon` 需要一起配置才能生效     | ^[string] / ^[Component] | —         |
| collapse-close-icon | 父菜单收起且子菜单关闭时的图标， `collapse-close-icon` 和 `collapse-open-icon` 需要一起配置才能生效 | ^[string] / ^[Component] | —         |
| collapse-open-icon  | 父菜单收起且子菜单打开时的图标， `collapse-open-icon` 和 `collapse-close-icon` 需要一起配置才能生效 | ^[string] / ^[Component] | —         |

### Slots

| 插槽名  | 说明           | 子标签                                |
| ------- | -------------- | ------------------------------------- |
| default | 自定义默认内容 | SubMenu / Menu-Item / Menu-Item-Group |
| title   | 自定义标题内容 | —                                     |

## Menu-Item API

### Attributes

| 属性名   | 说明                   | 类型                  | 默认值 |
| -------- | ---------------------- | --------------------- | ------ |
| index    | 唯一标志               | ^[string] / ^[null]   | null   |
| route    | Vue Route 路由位置参数 | ^[string] / ^[object] | —      |
| disabled | 是否禁用               | ^[boolean]            | false  |

### Events

| 事件名 | 说明                                   | 类型                                            |
| ------ | -------------------------------------- | ----------------------------------------------- |
| click  | 点击菜单项时回调函数, 参数为菜单项实例 | ^[Function]`(item: MenuItemRegistered) => void` |

### Slots

| 插槽名  | 说明           |
| ------- | -------------- |
| default | 自定义默认内容 |
| title   | 自定义标题内容 |

## Menu-Item-Group API

### Attributes

| 属性名 | 说明   | 类型      | 默认值 |
| ------ | ------ | --------- | ------ |
| title  | 组标题 | ^[string] | —      |

### Slots

| 插槽名  | 说明             | 子标签    |
| ------- | ---------------- | --------- |
| default | 默认插槽内容     | Menu-Item |
| title   | 自定义组标题内容 | —         |

## Page Header 页头

如果页面的路径比较简单，推荐使用页头组件而非面包屑组件。

### 示例

:::demo

```vue
<template>
  <div aria-label="A complete example of page header">
    <w-page-header @back="onBack">
      <template #breadcrumb>
        <w-breadcrumb separator="/">
          <w-breadcrumb-item :to="{ path: './page-header.html' }">
            homepage
          </w-breadcrumb-item>
          <w-breadcrumb-item>
            <a href="./page-header.html">route 1</a>
          </w-breadcrumb-item>
          <w-breadcrumb-item>route 2</w-breadcrumb-item>
        </w-breadcrumb>
      </template>
      <template #content>
        <div class="flex items-center">
          <w-avatar
            class="mr-3"
            :size="32"
            src="https://cdn.dribbble.com/userupload/9645535/file/original-b7756b0958f420bef5cbf243c947f149.png?resize=752x"
          />
          <span class="text-large font-600 mr-3"> Title </span>
          <span class="text-sm mr-2" style="color: var(--w3-font-color-second)">
            Sub title
          </span>
          <w-tag>Default</w-tag>
        </div>
      </template>
      <template #extra>
        <div class="flex items-center">
          <w-button>打印</w-button>
          <w-button type="primary" class="ml-2">编辑</w-button>
        </div>
      </template>

      <w-descriptions :column="3" size="small" class="mt-4">
        <w-descriptions-item label="Username">
          kooriookami
        </w-descriptions-item>
        <w-descriptions-item label="Telephone">
          18100000000
        </w-descriptions-item>
        <w-descriptions-item label="Place">Suzhou</w-descriptions-item>
        <w-descriptions-item label="Remarks">
          <w-tag size="small">School</w-tag>
        </w-descriptions-item>
        <w-descriptions-item label="Address">
          No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province
        </w-descriptions-item>
      </w-descriptions>
      <p class="mt-4 text-sm">
        WinDesign Next team uses <b>weekly</b> release strategy under normal
        circumstance, but critical bug fixes would require hotfix so the actual
        release number <b>could be</b> more than 1 per week.
      </p>
    </w-page-header>
  </div>
</template>

<script setup lang="ts">
import { WNotification as notify } from 'win-design-next'

const onBack = () => {
  notify('Back')
}
</script>
```

:::

:::demo

```vue
<template>
  <w-page-header @back="goBack">
    <template #content>
      <span class="text-large font-600 mr-3"> Title </span>
    </template>
  </w-page-header>
</template>
<script lang="ts" setup>
const goBack = () => {
  console.log('go back')
}
</script>
```

:::

:::demo

```vue
<template>
  <w-page-header :icon="ArrowLeft">
    <template #content>
      <span class="text-large font-600 mr-3"> Title </span>
    </template>
  </w-page-header>
</template>

<script lang="ts" setup>
import { ArrowLeft } from '@win-design-next/icons-vue'
</script>
```

:::

:::demo

```vue
<template>
  <w-page-header icon="">
    <template #content>
      <span class="text-large font-600 mr-3"> Title </span>
    </template>
  </w-page-header>
</template>
```

:::

:::demo

```vue
<template>
  <w-page-header>
    <template #breadcrumb>
      <w-breadcrumb separator="/">
        <w-breadcrumb-item :to="{ path: './page-header.html' }">
          homepage
        </w-breadcrumb-item>
        <w-breadcrumb-item
          ><a href="./page-header.html">route 1</a></w-breadcrumb-item
        >
        <w-breadcrumb-item>route 2</w-breadcrumb-item>
      </w-breadcrumb>
    </template>
    <template #content>
      <span class="text-large font-600 mr-3"> Title </span>
    </template>
  </w-page-header>
</template>
```

:::

:::demo

```vue
<template>
  <w-page-header icon="">
    <template #content>
      <div class="flex items-center">
        <w-avatar
          :size="32"
          class="mr-3"
          src="https://cdn.dribbble.com/userupload/9645535/file/original-b7756b0958f420bef5cbf243c947f149.png?resize=752x"
        />
        <span class="text-large font-600 mr-3"> Title </span>
        <span class="text-sm mr-2" style="color: var(--w3-font-color-second)">
          Sub title
        </span>
        <w-tag>Default</w-tag>
      </div>
    </template>
    <template #extra>
      <div class="flex items-center">
        <w-button>打印</w-button>
        <w-button type="primary" class="ml-2">编辑</w-button>
      </div>
    </template>
  </w-page-header>
</template>
```

:::

:::demo

```vue
<template>
  <w-page-header>
    <template #content>
      <span class="text-large font-600 mr-3"> Title </span>
    </template>
    <div class="mt-4 text-sm font-bold">
      Your additional content can be added with default slot, You may put as
      many content as you want here.
    </div>
  </w-page-header>
</template>
```

:::

### API 文档

### Attributes

| 属性名  | 说明                                          | 类型                     | 默认 |
| ------- | --------------------------------------------- | ------------------------ | ---- |
| icon    | Page Header 的图标 Icon 组件                  | ^[string] / ^[Component] | Back |
| title   | Page Header 的主标题，默认是 Back (内置 a11y) | ^[string]                | ''   |
| content | Page Header 的内容                            | ^[string]                | ''   |

### 事件

| 事件名 | 说明             | 类型                    |
| ------ | ---------------- | ----------------------- |
| back   | 点击左侧区域触发 | ^[Function]`() => void` |

### 插槽

| 名称       | 说明           |
| ---------- | -------------- |
| icon       | 图标内容       |
| title      | 标题内容       |
| content    | 内容           |
| extra      | 扩展设置       |
| breadcrumb | 面包屑导航内容 |
| default    | 默认内容       |

---

## Tabs 标签页

分隔内容上有关联但属于不同类别的数据集合。

### 示例

:::demo Tabs 组件提供了选项卡功能， 默认选中第一个标签页，你也可以通过 `value` 属性来指定当前选中的标签页。

```vue
<template>
  <w-title>基础用法</w-title>
  <w-tabs v-model="activeName" class="demo-tabs" @tab-click="handleClick">
    <w-tab-pane label="待整改" name="first" />
    <w-tab-pane label="已完成" name="second" />
    <w-tab-pane label="已质控" name="third" />
  </w-tabs>
  <w-divider />
  <w-title>卡片风格：type="card"</w-title>
  <w-tabs
    v-model="activeName"
    type="card"
    class="demo-tabs"
    @tab-click="handleClick"
  >
    <w-tab-pane label="待整改" name="first" />
    <w-tab-pane label="已完成" name="second" />
    <w-tab-pane label="已质控" name="third" />
  </w-tabs>
  <w-divider />
  <w-title>边框卡片风格：type="border-card"</w-title>
  <w-tabs v-model="activeName" type="border-card">
    <w-tab-pane label="待整改" name="first" />
    <w-tab-pane label="已完成" name="second" />
    <w-tab-pane label="已质控" name="third" />
  </w-tabs>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { TabsPaneContext } from 'win-design-next'

const activeName = ref('first')

const handleClick = (tab: TabsPaneContext, event: Event) => {
  console.log(tab, event)
}
</script>

<style></style>
```

:::

:::demo 标签一共有四个方向的设置 `tabPosition="left|right|top|bottom"`

```vue
<template>
  <w-radio-group v-model="tabPosition" style="margin-bottom: 30px">
    <w-radio-button value="top">top</w-radio-button>
    <w-radio-button value="right">right</w-radio-button>
    <w-radio-button value="bottom">bottom</w-radio-button>
    <w-radio-button value="left">left</w-radio-button>
  </w-radio-group>

  <w-tabs :tab-position="tabPosition" style="height: 200px" class="demo-tabs">
    <w-tab-pane label="待整改" name="first" />
    <w-tab-pane label="已完成" name="second" />
    <w-tab-pane label="已质控" name="third" />
  </w-tabs>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { TabsInstance } from 'win-design-next'

const tabPosition = ref<TabsInstance['tabPosition']>('left')
</script>

<style>
.w3-tabs--right .w3-tabs__content,
.w3-tabs--left .w3-tabs__content {
  height: 100%;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-tabs type="border-card" class="demo-tabs">
    <w-tab-pane>
      <template #label>
        <span class="custom-tabs-label">
          <w-icon><date /></w-icon>
          <span>待整改</span>
        </span>
      </template>
    </w-tab-pane>
    <w-tab-pane label="已完成" name="second" />
    <w-tab-pane label="已质控" name="third" />
  </w-tabs>
</template>

<script lang="ts" setup>
import { Date } from '@win-design-next/icons-vue'
</script>

<style>
.demo-tabs .custom-tabs-label {
  display: flex;
  align-items: center;
}
.demo-tabs .custom-tabs-label span {
  margin-left: 8px;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-tabs
    v-model="editableTabsValue"
    type="card"
    editable
    class="demo-tabs"
    @edit="handleTabsEdit"
  >
    <w-tab-pane
      v-for="item in editableTabs"
      :key="item.name"
      :label="item.title"
      :name="item.name"
    >
      {{ item.content }}
    </w-tab-pane>
  </w-tabs>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { TabPaneName } from 'win-design-next'

let tabIndex = 2
const editableTabsValue = ref('2')
const editableTabs = ref([
  {
    title: 'Tab 1',
    name: '1',
    content: 'Tab 1 content',
  },
  {
    title: 'Tab 2',
    name: '2',
    content: 'Tab 2 content',
  },
])

const handleTabsEdit = (
  targetName: TabPaneName | undefined,
  action: 'remove' | 'add'
) => {
  if (action === 'add') {
    const newTabName = `${++tabIndex}`
    editableTabs.value.push({
      title: 'New Tab',
      name: newTabName,
      content: 'New Tab content',
    })
    editableTabsValue.value = newTabName
  } else if (action === 'remove') {
    const tabs = editableTabs.value
    let activeName = editableTabsValue.value
    if (activeName === targetName) {
      tabs.forEach((tab, index) => {
        if (tab.name === targetName) {
          const nextTab = tabs[index + 1] || tabs[index - 1]
          if (nextTab) {
            activeName = nextTab.name
          }
        }
      })
    }

    editableTabsValue.value = activeName
    editableTabs.value = tabs.filter((tab) => tab.name !== targetName)
  }
}
</script>

<style></style>
```

:::

:::demo

```vue
<template>
  <w-tabs
    v-model="editableTabsValue"
    type="card"
    class="demo-tabs"
    editable
    @edit="handleTabsEdit"
  >
    <template #add-icon>
      <w-icon><Check /></w-icon>
    </template>
    <w-tab-pane
      v-for="item in editableTabs"
      :key="item.name"
      :label="item.title"
      :name="item.name"
    >
      {{ item.content }}
    </w-tab-pane>
  </w-tabs>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Check } from '@win-design-next/icons-vue'

import type { TabPaneName } from 'win-design-next'

let tabIndex = 2
const editableTabsValue = ref('2')
const editableTabs = ref([
  {
    title: 'Tab 1',
    name: '1',
    content: 'Tab 1 content',
  },
  {
    title: 'Tab 2',
    name: '2',
    content: 'Tab 2 content',
  },
])

const handleTabsEdit = (
  targetName: TabPaneName | undefined,
  action: 'remove' | 'add'
) => {
  if (action === 'add') {
    const newTabName = `${++tabIndex}`
    editableTabs.value.push({
      title: 'New Tab',
      name: newTabName,
      content: 'New Tab content',
    })
    editableTabsValue.value = newTabName
  } else if (action === 'remove') {
    const tabs = editableTabs.value
    let activeName = editableTabsValue.value
    if (activeName === targetName) {
      tabs.forEach((tab, index) => {
        if (tab.name === targetName) {
          const nextTab = tabs[index + 1] || tabs[index - 1]
          if (nextTab) {
            activeName = nextTab.name
          }
        }
      })
    }

    editableTabsValue.value = activeName
    editableTabs.value = tabs.filter((tab) => tab.name !== targetName)
  }
}
</script>

<style></style>
```

:::

:::demo

```vue
<template>
  <div style="margin-bottom: 20px">
    <w-button size="small" @click="addTab(editableTabsValue)">
      add tab
    </w-button>
  </div>
  <w-tabs
    v-model="editableTabsValue"
    type="card"
    class="demo-tabs"
    closable
    @tab-remove="removeTab"
  >
    <w-tab-pane
      v-for="item in editableTabs"
      :key="item.name"
      :label="item.title"
      :name="item.name"
    >
      {{ item.content }}
    </w-tab-pane>
  </w-tabs>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { TabPaneName } from 'win-design-next'

let tabIndex = 2
const editableTabsValue = ref('2')
const editableTabs = ref([
  {
    title: 'Tab 1',
    name: '1',
    content: 'Tab 1 content',
  },
  {
    title: 'Tab 2',
    name: '2',
    content: 'Tab 2 content',
  },
])

const addTab = (targetName: string) => {
  const newTabName = `${++tabIndex}`
  editableTabs.value.push({
    title: 'New Tab',
    name: newTabName,
    content: 'New Tab content',
  })
  editableTabsValue.value = newTabName
}
const removeTab = (targetName: TabPaneName) => {
  const tabs = editableTabs.value
  let activeName = editableTabsValue.value
  if (activeName === targetName) {
    tabs.forEach((tab, index) => {
      if (tab.name === targetName) {
        const nextTab = tabs[index + 1] || tabs[index - 1]
        if (nextTab) {
          activeName = nextTab.name
        }
      }
    })
  }

  editableTabsValue.value = activeName
  editableTabs.value = tabs.filter((tab) => tab.name !== targetName)
}
</script>

<style></style>
```

:::

### API 文档

### Attributes

| 属性名                | 说明                                                                                  | 类型                                                                                             | Default    |
| --------------------- | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ---------- |
| model-value / v-model | 绑定值，选中选项卡的 name，默认值是第一个 tab 的 name                                 | ^[string] / ^[number]                                                                            | —          |
| type                  | 风格类型                                                                              | ^[enum]`'' \| 'card' \| 'border-card'`                                                           | ''         |
| closable              | 标签是否可关闭                                                                        | ^[boolean]                                                                                       | false      |
| addable               | 标签是否可增加                                                                        | ^[boolean]                                                                                       | false      |
| editable              | 标签是否同时可增加和关闭                                                              | ^[boolean]                                                                                       | false      |
| tab-position          | 选项卡所在位置                                                                        | ^[enum]`'top' \| 'right' \| 'bottom' \| 'left'`                                                  | top        |
| stretch               | 标签的宽度是否自撑开                                                                  | ^[boolean]                                                                                       | false      |
| before-leave          | 切换标签之前的钩子函数， 若返回 `false ` 或者返回被 reject 的 `Promise`，则阻止切换。 | ^[Function]`(activeName: TabPaneName, oldActiveName: TabPaneName) => Awaitable<void \| boolean>` | () => true |

### Events

| 事件名     | 说明                            | 回调参数                                                                             |
| ---------- | ------------------------------- | ------------------------------------------------------------------------------------ |
| tab-click  | tab 被选中时触发                | ^[Function]`(pane: TabsPaneContext, ev: Event) => void`                              |
| tab-change | `activeName` 改变时触发         | ^[Function]`(name: TabPaneName) => void`                                             |
| tab-remove | 点击 tab 移除按钮时触发         | ^[Function]`(name: TabPaneName) => void`                                             |
| tab-add    | 点击 tab 新增按钮时触发         | ^[Function]`() => void`                                                              |
| edit       | 点击 tab 的新增或移除按钮后触发 | ^[Function]`(paneName: TabPaneName \| undefined, action: 'remove' \| 'add') => void` |

### Slots

| 插槽名   | 说明               | 子标签   |
| -------- | ------------------ | -------- |
| default  | 默认插槽           | Tab-pane |
| add-icon | 自定义添加按钮图标 | —        |

## Tab-pane API

### Attributes

| 属性名   | 说明                                                                                            | 类型                  | 默认值 |
| -------- | ----------------------------------------------------------------------------------------------- | --------------------- | ------ |
| label    | 选项卡标题                                                                                      | ^[string]             | ''     |
| disabled | 是否禁用                                                                                        | ^[boolean]            | false  |
| name     | 与选项卡绑定值 value 对应的标识符，表示选项卡别名。默认值是 tab 面板的序列号，如第一个 tab 是 0 | ^[string] / ^[number] | —      |
| closable | 标签是否可关闭                                                                                  | ^[boolean]            | false  |
| lazy     | 标签是否延迟渲染                                                                                | ^[boolean]            | false  |

### Slots

| 插槽名  | 说明                |
| ------- | ------------------- |
| default | Tab-pane 的内容     |
| label   | Tab-pane 的标题内容 |

---

