## Alert 提示

用于页面中展示重要的提示信息。

### 示例

:::demo Alert 组件提供四种类型，由 `type` 属性指定，默认值为 `info`。

```vue
<template>
  <div class="flex gap-4">
    <div class="flex-1">
      <w-title>默认样式</w-title>
      <w-alert
        show-icon
        title="WinDesign 是一套专为医疗行业打造的标准化解决方案，遵循协同、便捷、高效的设计理念。技术上基于 Vue.js，由卫宁UED团队开发维护，拥有 80+ 组件，与医疗业务深度绑定，支持国际化项目、动态换肤和响应式设计，具备良好的文档和社区支持等，适用于快速构建医疗行业中后台系统或复杂的前端应用。"
        type="success"
      />
      <w-alert title="普通提示内容" type="info" />
      <w-alert title="警告的提示内容" type="warning" />
      <w-alert title="错误的提示内容" type="error" />
      <w-alert title="错误的提示内容" type="danger" />
      <w-alert title="主要的提示内容" type="primary" show-icon>
        <template #icon>
          <Search />
        </template>
      </w-alert>
    </div>
    <div class="flex-1">
      <w-title>通过设置 effect 属性来改变主题，默认为 light。</w-title>
      <w-alert title="成功的提示内容" type="success" effect="dark" />
      <w-alert title="普通提示内容" type="info" effect="dark" />
      <w-alert title="警告的提示内容" type="warning" effect="dark" />
      <w-alert title="错误的提示内容" type="error" effect="dark" />
      <w-alert title="主要的提示内容" type="primary" effect="dark" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { Search } from '@win-design-next/icons-vue'
</script>

<style scoped>
.w3-alert {
  margin: 20px 0 0;
}
.w3-alert:first-child {
  margin: 0;
}
</style>
```

:::

:::demo

```vue
<template>
  <div style="max-width: 600px">
    <w-alert
      title="Primary alert that appearance after 5000 milliseconds"
      type="primary"
      :show-after="5000"
      show-icon
      @open="console.log('open')"
    >
      <template #icon>
        <Search />
      </template>
    </w-alert>
    <w-alert
      title="Success alert that disappear after 5000 milliseconds"
      type="success"
      :hide-after="5000"
    />
    <w-alert
      title="Info alert that in 5000 milliseconds to be hidden"
      type="info"
      :closable="false"
      :auto-close="5000"
    />
  </div>
</template>

<script lang="ts" setup>
import { Search } from '@win-design-next/icons-vue'
</script>

<style scoped>
.w3-alert {
  margin: 20px 0 0;
}
.w3-alert:first-child {
  margin: 0;
}
</style>
```

:::

:::demo 你可以设置 Alert 组件是否为可关闭状态， 关闭按钮的内容以及关闭时的回调函数同样可以定制。 `closable` 属性决定 Alert 组件是否可关闭， 该属性接受一个 `Boolean`，默认为 `false`。 你可以设置 `close-text` 属性来代替右侧的关闭图标， 需要注意的是 `close-text` 必须是一个字符串。 当 Alert 组件被关闭时会触发 `close` 事件。

```vue
<template>
  <div style="max-width: 600px">
    <w-alert title="不显示关闭按钮" type="success" :closable="false" />
    <w-alert
      title="自定义关闭按钮：文字"
      effect="dark"
      type="info"
      close-text="Gotcha"
    />
    <w-alert title="关闭触发事件" type="warning" @close="hello" />
  </div>
</template>

<script lang="ts" setup>
const hello = () => {
  // eslint-disable-next-line no-alert
  alert('Hello World!')
}
</script>

<style scoped>
.w3-alert {
  margin: 20px 0 0;
}
.w3-alert:first-child {
  margin: 0;
}
</style>
```

:::

:::demo 通过设置 `show-icon` 属性来显示 Alert 的 icon，这能更有效地向用户展示你的显示意图。

```vue
<template>
  <div style="max-width: 600px">
    <w-alert title="成功的提示内容" type="success" show-icon />
    <w-alert title="普通提示内容" type="info" show-icon />
    <w-alert title="警告的提示内容" effect="dark" type="warning" show-icon />
    <w-alert title="错误的提示内容" type="error" show-icon />
    <w-alert title="主要的提示内容" type="primary" show-icon />
  </div>
</template>

<style scoped>
.w3-alert {
  margin: 20px 0 0;
}
.w3-alert:first-child {
  margin: 0;
}
</style>
```

:::

:::demo

```vue
<template>
  <div style="max-width: 600px">
    <w-alert title="成功的提示内容" type="success" center show-icon />
    <w-alert title="普通提示内容" type="info" center show-icon />
    <w-alert
      title="警告的提示内容"
      effect="dark"
      type="warning"
      center
      show-icon
    />
    <w-alert title="错误的提示内容" type="error" center show-icon />
    <w-alert title="主要的提示内容" type="primary" center show-icon />
  </div>
</template>

<style scoped>
.w3-alert {
  margin: 20px 0 0;
}
.w3-alert:first-child {
  margin: 0;
}
</style>
```

:::

:::demo 除了必填的 `title` 属性外，你可以设置 `description` 属性来帮助你更好地介绍，我们称之为辅助性文字。 辅助性文字只能存放文本内容，当内容超出长度限制时会自动换行显示。

```vue
<template>
  <div style="max-width: 600px">
    <w-alert
      title="成功的提示内容"
      type="primary"
      description="这是一段文字描述"
    />
    <w-alert
      title="成功的提示内容"
      type="success"
      description="这是一段文字描述"
      show-icon
    />
    <w-alert
      title="普通的提示内容"
      type="info"
      effect="dark"
      description="这是一段文字描述"
      show-icon
    />
    <w-alert
      title="警告的提示内容"
      type="warning"
      description="这是一段文字描述"
      show-icon
    />
    <w-alert
      title="错误的提示内容"
      type="error"
      description="这是一段文字描述"
      show-icon
    />
  </div>
</template>

<style scoped>
.w3-alert {
  margin: 20px 0 0;
}
.w3-alert:first-child {
  margin: 0;
}
</style>
```

:::

### API 文档

### 属性

| 名称                 | 说明                               | 类型                                                                          | 默认值 |
| -------------------- | ---------------------------------- | ----------------------------------------------------------------------------- | ------ |
| title                | Alert 标题。                       | ^[string]                                                                     | —      |
| type                 | Alert 类型。                       | ^[enum]`'success' \| 'warning' \| 'primary' \| 'danger' \| 'info' \| 'error'` | info   |
| description          | 描述性文本                         | ^[string]                                                                     | —      |
| closable             | 是否可以关闭                       | ^[boolean]                                                                    | true   |
| center               | 文字是否居中                       | ^[boolean]                                                                    | false  |
| close-text           | 自定义关闭按钮文本                 | ^[string]                                                                     | —      |
| show-icon            | 是否显示类型图标                   | ^[boolean]                                                                    | false  |
| effect               | 主题样式                           | ^[enum]`'light' \| 'dark'`                                                    | light  |
| show-after ^(0.0.11) | 在触发后多久显示内容，单位毫秒     | ^[number]                                                                     | 0      |
| hide-after ^(0.0.11) | 延迟关闭，单位毫秒                 | ^[number]                                                                     | 200    |
| auto-close ^(0.0.11) | alert 出现后自动隐藏延时，单位毫秒 | ^[number]                                                                     | 0      |

### Events

| 名称           | 描述                    | 类型                                     |
| -------------- | ----------------------- | ---------------------------------------- |
| close          | 关闭 Alert 时触发的事件 | ^[Function]`(event: MouseEvent) => void` |
| open ^(0.0.11) | 开启 Alert 时触发的事件 | ^[Function]`() => void`                  |

### Slots

| 名称           | 描述           |
| -------------- | -------------- |
| default        | Alert 内容描述 |
| title          | 标题的内容     |
| icon ^(0.0.11) | icon 的内容    |

---

## Empty 空状态

空状态时的占位提示。

### 示例

:::demo

```vue
<template>
  <w-space style="width: 100%" fill :fill-ratio="0">
    <w-empty
      description="暂无数据"
      message="暂时未找到相关信息，请联系管理员！"
    />
    <w-empty type="empty-carnation" description="暂无数据" />
  </w-space>
</template>
```

:::

:::demo

```vue
<template>
  <w-space style="width: 100%" fill :fill-ratio="0">
    <w-empty type="cost" description="无费用信息" />
  </w-space>
  <w-space style="width: 100%" fill :fill-ratio="0">
    <w-empty type="loading" description="加载中" />
    <w-empty type="loading-carnation" description="加载中" />
  </w-space>
  <w-space style="width: 100%" fill :fill-ratio="0">
    <w-empty type="data" description="数据为空" />
    <w-empty type="data-carnation" description="数据为空" />
  </w-space>
  <w-space style="width: 100%" fill :fill-ratio="0">
    <w-empty type="patient" description="当前没有患者" />
    <w-empty type="patient-carnation" description="当前没有患者" />
  </w-space>
  <w-space style="width: 100%" fill :fill-ratio="0">
    <w-empty type="search" description="搜索结果为空" />
    <w-empty type="search-carnation" description="搜索结果为空" />
  </w-space>
  <w-space style="width: 100%" fill :fill-ratio="0">
    <w-empty type="left" description="请先在左侧选中科目我才会出现哦" />
    <w-empty
      type="left-carnation"
      description="请先在左侧选中科目我才会出现哦"
    />
  </w-space>
  <w-space style="width: 100%" fill :fill-ratio="0">
    <w-empty type="error" description="抱歉，您访问的页面不存在" />
    <w-empty type="error-carnation" description="抱歉，您访问的页面不存在" />
  </w-space>
</template>
```

:::

:::demo

```vue
<template>
  <w-space style="width: 100%" fill :fill-ratio="0">
    <w-empty :image-size="200" />
    <w-empty image="/win-design-next/imgs/banner-bg.png" />
    <w-empty>
      <w-button type="primary">默认按钮</w-button>
    </w-empty>
  </w-space>
</template>
```

:::

### API 文档

### Attributes

| 属性名      | 说明             | 类型      | 可选值                                                                                                                                                                             | 默认值 |
| ----------- | ---------------- | --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| image       | 图像地址         | ^[string] |                                                                                                                                                                                    | ''     |
| image-size  | 图像尺寸（宽度） | ^[number] |                                                                                                                                                                                    | —      |
| description | 描述信息         | ^[string] |                                                                                                                                                                                    | ''     |
| message     | 补充信息         | ^[string] |                                                                                                                                                                                    | ''     |
| type        | 不同类型         | ^[string] | empty、empty-carnation、error、error-carnation、left、left-carnation、loading、loading-carnation、search、search-carnation、data、data-carnation、cost、patient、patient-carnation | empty  |

### 插槽

| 插槽名      | 描述说明           |
| ----------- | ------------------ |
| default     | 作为底部内容的内容 |
| image       | 作为图像的内容     |
| description | 作为描述的内容     |
| message     | 作为补充的内容     |

---

## Loading 加载

加载数据时显示动效。

### 示例

:::demo WinDesign Next 提供了两种调用 Loading 的方法：指令和服务。 对于自定义指令 `v-loading`，只需要绑定 `boolean` 值即可。 默认状况下，Loading 遮罩会插入到绑定元素的子节点。 通过添加 `body` 修饰符，可以使遮罩插入至 Dom 中的 body 上。

```vue
<template>
  <w-table v-loading="loading" :data="tableData" style="width: 100%">
    <w-table-column prop="date" label="Date" width="180" />
    <w-table-column prop="name" label="Name" width="180" />
    <w-table-column prop="address" label="Address" />
  </w-table>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const loading = ref(true)

const tableData = [
  {
    date: '2016-05-02',
    name: 'John Smith',
    address: 'No.1518,  Jinshajiang Road, Putuo District',
  },
  {
    date: '2016-05-04',
    name: 'John Smith',
    address: 'No.1518,  Jinshajiang Road, Putuo District',
  },
  {
    date: '2016-05-01',
    name: 'John Smith',
    address: 'No.1518,  Jinshajiang Road, Putuo District',
  },
]
</script>

<style>
body {
  margin: 0;
}
.example-showcase .w3-loading-mask {
  z-index: 9;
}
</style>
```

:::

:::demo 在绑定了`v-loading`指令的元素上添加`win-loading-text`属性，其值会被渲染为加载文案，并显示在加载图标的下方。 类似地，`win-loading-spinner`、`win-loading-background` 和 `win-loading-svg` 属性分别用来设定 svg 图标、背景色值、加载图标。

```vue
<template>
  <w-table
    v-loading="loading"
    win-loading-text="Loading..."
    :win-loading-spinner="svg"
    win-loading-svg-view-box="-10, -10, 50, 50"
    win-loading-background="rgba(122, 122, 122, 0.8)"
    :data="tableData"
    style="width: 100%"
  >
    <w-table-column prop="date" label="Date" width="180" />
    <w-table-column prop="name" label="Name" width="180" />
    <w-table-column prop="address" label="Address" />
  </w-table>
  <w-table
    v-loading="loading"
    :win-loading-svg="svg"
    class="custom-loading-svg"
    win-loading-svg-view-box="-10, -10, 50, 50"
    :data="tableData"
    style="width: 100%"
  >
    <w-table-column prop="date" label="Date" width="180" />
    <w-table-column prop="name" label="Name" width="180" />
    <w-table-column prop="address" label="Address" />
  </w-table>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const loading = ref(true)
const svg = `
        <path class="path" d="
          M 30 15
          L 28 17
          M 25.61 25.61
          A 15 15, 0, 0, 1, 15 30
          A 15 15, 0, 1, 1, 27.99 7.5
          L 15 15
        " style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"/>
      `
const tableData = [
  {
    date: '2016-05-02',
    name: 'John Smith',
    address: 'No.1518,  Jinshajiang Road, Putuo District',
  },
  {
    date: '2016-05-04',
    name: 'John Smith',
    address: 'No.1518,  Jinshajiang Road, Putuo District',
  },
  {
    date: '2016-05-01',
    name: 'John Smith',
    address: 'No.1518,  Jinshajiang Road, Putuo District',
  },
]
</script>

<style>
.example-showcase .w3-loading-mask {
  z-index: 9;
}
</style>
```

:::

:::demo 当使用指令方式时，全屏遮罩需要添加`fullscreen`修饰符（遮罩会插入至 body 上） 此时若需要锁定屏幕的滚动，可以使用`lock`修饰符； 当使用服务方式时，遮罩默认即为全屏，无需额外设置。

```vue
<template>
  <w-button
    v-loading.fullscreen.lock="fullscreenLoading"
    type="primary"
    @click="openFullScreen1"
  >
    As a directive
  </w-button>
  <w-button type="primary" @click="openFullScreen2"> As a service </w-button>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { WLoading } from 'win-design-next'

const fullscreenLoading = ref(false)
const openFullScreen1 = () => {
  fullscreenLoading.value = true
  setTimeout(() => {
    fullscreenLoading.value = false
  }, 2000)
}

const openFullScreen2 = () => {
  const loading = WLoading.service({
    lock: true,
    text: 'Loading',
    background: 'rgba(0, 0, 0, 0.7)',
  })
  setTimeout(() => {
    loading.close()
  }, 2000)
}
</script>
```

:::

### API 文档

### 配置项

| 名称        | 说明                                                                                                                                         | 类型                       | 默认          |
| ----------- | -------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------- | ------------- |
| target      | Loading 需要覆盖的 DOM 节点。 可传入一个 DOM 对象或字符串； 若传入字符串，则会将其作为参数传入 `document.querySelector`以获取到对应 DOM 节点 | ^[string] / ^[HTMLElement] | document.body |
| body        | 同 `v-loading` 指令中的 `body` 修饰符                                                                                                        | ^[boolean]                 | false         |
| fullscreen  | 同 `v-loading` 指令中的 `fullscreen` 修饰符                                                                                                  | ^[boolean]                 | true          |
| lock        | 同 `v-loading` 指令中的 `lock` 修饰符                                                                                                        | ^[boolean]                 | false         |
| text        | 显示在加载图标下方的加载文案                                                                                                                 | ^[string]                  | —             |
| spinner     | 自定义加载图标类名                                                                                                                           | ^[string]                  | —             |
| background  | 遮罩背景色                                                                                                                                   | ^[string]                  | —             |
| customClass | Loading 的自定义类名                                                                                                                         | ^[string]                  | —             |
| svg         | 自定义 SVG 元素覆盖默认加载器                                                                                                                | ^[string]                  | —             |
| svgViewBox  | 设置用于加载 svg 元素的 viewBox 属性                                                                                                         | ^[string]                  | —             |
| beforeClose | Loading 关闭之前执行的函数。 如果此函数返回 false ，关闭过程将被中止。 反之，loading 将被关闭。                                              | ^[Function]`() => boolean` | —             |
| closed      | Loading 完全关闭后触发的函数                                                                                                                 | ^[Function]`() => void`    | —             |

### 指令

| 名称                     | 说明                                         | 类型                           |
| ------------------------ | -------------------------------------------- | ------------------------------ |
| v-loading                | 是否显示动画                                 | ^[boolean] / ^[LoadingOptions] |
| win-loading-text         | 显示在加载图标下方的加载文案                 | ^[string]                      |
| win-loading-spinner      | 自定义加载图标                               | ^[string]                      |
| win-loading-svg          | 自定义加载图标 (与 win-loading-spinner 相同) | ^[string]                      |
| win-loading-svg-view-box | 设置用于加载 svg 元素的 viewBox 属性         | ^[string]                      |
| win-loading-background   | 背景遮罩的颜色                               | ^[string]                      |
| win-loading-custom-class | loading 的自定义类名                         | ^[string]                      |

---

## Message 消息提示

常用于主动操作后的反馈提示。 与 Notification 的区别是后者更多用于系统级通知的被动提醒。

### 示例

:::demo Message 在配置上与 Notification 非常类似，所以部分 options 在此不做详尽解释。 文末有 options 列表，可以结合 Notification 的文档理解它们。 WinDesign Next 注册了一个全局的 `$message`方法用于调用。 Message 可以接收一个字符串或一个 VNode 作为参数，它会被显示为正文内容。

```vue
<template>
  <w-button :plain="true" @click="open">默认消息</w-button>
  <w-button :plain="true" @click="openVn">VNode</w-button>
  <w-button :plain="true" @click="openClose">不可关闭</w-button>
  <w-button :plain="true" @click="openDetail">带详情(默认收起)</w-button>
  <w-button :plain="true" @click="openDetail2">带详情(设置展开)</w-button>
  <w-button :plain="true" @click="openOther">兼容Message</w-button>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import { Message, WMessage } from 'win-design-next'

const open = () => {
  WMessage('This is a message.')
}

const openOther = () => {
  Message('This is a message.')
}

const openClose = () => {
  WMessage({
    message:
      'WinDesign Next 是一套符合医疗行业特性的标准化解决方案，遵循协同、便捷、高效的设计理念。通过标准化、模块化组件降低生产成本，提高沟通效率及用户体验；技术上基于 Vue.js3.x，覆盖了开发中常见的 UI 套件及交互功能, 统一前端在基础组件 UI 上的落地效果，提升研发效率。WinDesign Next 包含 80+组件的工具包，与业务深度绑定，支持多语言、主题切换、图表展示和常用组件的标准化，从界面设计到功能交互，每一个组件都经过精心打磨，以适应医疗场景下的特殊需求，为医疗软件产品设计者及开发者提供一站式便捷服务。',
    duration: 0,
    showClose: true,
  })
}

const openVn = () => {
  WMessage({
    message: h('div', { style: 'line-height: 1.5; font-size: 14px' }, [
      h('span', null, 'Message can be '),
      h('i', { style: 'color: teal' }, 'VNode'),
    ]),
  })
}

const openDetail = () => {
  WMessage({
    message: '系统错误，请稍后重试!',
    detail: '这是一条系统错误提示信息详情...',
    duration: 0,
    showClose: true,
  })
}

const openDetail2 = () => {
  WMessage({
    type: 'error',
    message: '系统错误，请稍后重试!',
    detail: '这是一条系统错误提示信息详情...',
    detailVisible: true,
    duration: 0,
    showClose: true,
  })
}
</script>
```

:::

:::demo 当需要自定义更多属性时，Message 也可以接收一个对象为参数。 比如，设置 `type` 字段可以定义不同的状态，默认为`primary`。 此时正文内容以 `message` 的值传入。 同时，我们也为 Message 的各种 type 注册了方法，可以在不传入 type 字段的情况下像 `open4` 那样直接调用。

```vue
<template>
  <w-button :plain="true" @click="open2">Success</w-button>
  <w-button :plain="true" @click="open3">Warning</w-button>
  <w-button :plain="true" @click="open1">Message</w-button>
  <w-button :plain="true" @click="open4">Error</w-button>
  <w-button :plain="true" @click="open6">Danger</w-button>
  <w-button :plain="true" @click="open5">Info</w-button>
</template>

<script lang="ts" setup>
import { WMessage } from 'win-design-next'

const open1 = () => {
  WMessage('This is a message.')
}
const open2 = () => {
  WMessage({
    message: 'Congrats, this is a success message.',
    type: 'success',
  })
}
const open3 = () => {
  WMessage({
    message: 'Warning, this is a warning message.',
    type: 'warning',
  })
}
const open4 = () => {
  WMessage.error('Oops, this is a error message.')
}

const open6 = () => {
  WMessage.danger('Oops, this is a error message.')
}

const open5 = () => {
  WMessage.info('Oops, this is a info message.')
}
</script>
```

:::

:::demo

```vue
<template>
  <div class="flex flex-wrap gap-1">
    <w-button class="!ml-0" :plain="true" @click="openMsg()"> Top </w-button>
    <w-button class="!ml-0" :plain="true" @click="openMsg('top-left')">
      Top Left
    </w-button>
    <w-button class="!ml-0" :plain="true" @click="openMsg('top-right')">
      Top Right
    </w-button>
    <w-button class="!ml-0" :plain="true" @click="openMsg('bottom')">
      Bottom
    </w-button>
    <w-button class="!ml-0" :plain="true" @click="openMsg('bottom-left')">
      Bottom Left
    </w-button>
    <w-button class="!ml-0" :plain="true" @click="openMsg('bottom-right')">
      Bottom Right
    </w-button>
  </div>
</template>

<script lang="ts" setup>
import { WMessage } from 'win-design-next'

import type { MessagePlacement, MessageType } from 'win-design-next'

let topCount = 0
let bottomCount = 0
let topLeftCount = 0
let topRightCount = 0
let bottomLeftCount = 0
let bottomRightCount = 0

const openMsg = (placement: MessagePlacement = 'top') => {
  let count = 0
  let type: MessageType = 'success'

  switch (placement) {
    case 'top':
      count = ++topCount
      type = 'success'
      break
    case 'bottom':
      count = ++bottomCount
      type = 'warning'
      break
    case 'top-left':
      count = ++topLeftCount
      type = 'info'
      break
    case 'top-right':
      count = ++topRightCount
      type = 'primary'
      break
    case 'bottom-left':
      count = ++bottomLeftCount
      type = 'warning'
      break
    case 'bottom-right':
      count = ++bottomRightCount
      type = 'error'
      break
  }

  WMessage({
    message: `消息提示： ${placement} ${count}`,
    type,
    placement,
  })
}
</script>
```

:::

:::demo

```vue
<template>
  <w-button :plain="true" @click="open1">Success</w-button>
  <w-button :plain="true" @click="open2">Warning</w-button>
  <w-button :plain="true" @click="open3">Message</w-button>
  <w-button :plain="true" @click="open4">Error</w-button>
  <w-button :plain="true" @click="open5">Info</w-button>
</template>

<script lang="ts" setup>
import { WMessage } from 'win-design-next'

const open1 = () => {
  WMessage({
    message: 'Congrats, this is a success message.',
    type: 'success',
    plain: true,
  })
}
const open2 = () => {
  WMessage({
    message: 'Warning, this is a warning message.',
    type: 'warning',
    plain: true,
  })
}
const open3 = () => {
  WMessage({
    message: 'This is a message.',
    type: 'primary',
    plain: true,
  })
}
const open4 = () => {
  WMessage({
    message: 'Oops, this is a error message.',
    type: 'error',
    plain: true,
  })
}

const open5 = () => {
  WMessage({
    message: 'Oops, this is a info message.',
    type: 'info',
    plain: true,
  })
}
</script>
```

:::

:::demo 默认的 Message 是不可以被人工关闭的。 如果你需要手动关闭功能，你可以把 `showClose` 设置为 true 此外，和 Notification 一样，Message 拥有可控的 `duration`， 默认的关闭时间为 3000 毫秒，当把这个属性的值设置为`0`便表示该消息不会被自动关闭。

```vue
<template>
  <w-button :plain="true" @click="open1">Message</w-button>
  <w-button :plain="true" @click="open2">Success</w-button>
  <w-button :plain="true" @click="open3">Warning</w-button>
  <w-button :plain="true" @click="open4">Error</w-button>
</template>

<script lang="ts" setup>
import { WMessage } from 'win-design-next'

const open1 = () => {
  WMessage({
    showClose: true,
    message: 'This is a message.',
  })
}
const open2 = () => {
  WMessage({
    showClose: true,
    message: 'Congrats, this is a success message.',
    type: 'success',
  })
}
const open3 = () => {
  WMessage({
    showClose: true,
    message: 'Warning, this is a warning message.',
    type: 'warning',
  })
}
const open4 = () => {
  WMessage({
    showClose: true,
    message: 'Oops, this is a error message.',
    type: 'error',
  })
}
</script>
```

:::

:::demo 将`dangerouslyUseHTMLString`属性设置为 true,`message` 就会被当作 HTML 片段处理。

```vue
<template>
  <w-button :plain="true" @click="openHTML">Use HTML string</w-button>
</template>

<script lang="ts" setup>
import { WMessage } from 'win-design-next'

const openHTML = () => {
  WMessage({
    dangerouslyUseHTMLString: true,
    message: '<strong>This is <i>HTML</i> string</strong>',
  })
}
</script>
```

:::

:::demo 设置 `grouping` 为 true，内容相同的 `message` 将被合并。

```vue
<template>
  <w-button :plain="true" @click="open">Show message</w-button>
</template>

<script lang="ts" setup>
import { WMessage } from 'win-design-next'

const open = () => {
  WMessage({
    message: 'This is a message.',
    grouping: true,
    type: 'success',
  })
}
</script>
```

:::

### API 文档

### Message 配置项

| 名称                     | 说明                                                                    | 类型                                                                                       | 默认值  |
| ------------------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ | ------- |
| message                  | 消息文字                                                                | ^[string] / ^[VNode] / ^[Function]`() => VNode`                                            | ''      |
| type                     | 消息类型                                                                | ^[enum]`'success' \| 'warning' \| 'info' \| 'danger' \| 'error' \| 'primary'`              | primary |
| plain                    | 是否纯色                                                                | ^[boolean]                                                                                 | false   |
| icon                     | 自定义图标，该属性会覆盖 `type` 的图标。                                | ^[string] / ^[Component]                                                                   | —       |
| dangerouslyUseHTMLString | 是否将 message 属性作为 HTML 片段处理                                   | ^[boolean]                                                                                 | false   |
| customClass              | 自定义类名                                                              | ^[string]                                                                                  | ''      |
| duration                 | 显示时间，单位为毫秒。 设为 0 则不会自动关闭                            | ^[number]                                                                                  | 3000    |
| showClose                | 是否显示关闭按钮                                                        | ^[boolean]                                                                                 | false   |
| onClose                  | 关闭时的回调函数, 参数为被关闭的 message 实例                           | ^[Function]`() => void`                                                                    | —       |
| offset                   | Message 距离窗口顶部的偏移量                                            | ^[number]                                                                                  | 16      |
| appendTo                 | 设置 message 的根元素，默认为 `document.body`                           | ^[string] / ^[HTMLElement]                                                                 | —       |
| grouping                 | 合并内容相同的消息，不支持 VNode 类型的消息                             | ^[boolean]                                                                                 | false   |
| repeatNum                | 重复次数，类似于 Badge 。当和 `grouping` 属性一起使用时作为初始数量使用 | ^[number]                                                                                  | 1       |
| placement ^(1.0.2)       | 位置                                                                    | ^[enum]`'top' \| 'top-left' \| 'top-right' \| 'bottom' \| 'bottom-left' \| 'bottom-right'` | top     |
| detail ^(1.0.10)         | 详细信息，用于显示额外的消息内容                                        | ^[string]                                                                                  | —       |
| detailVisible ^(1.0.10)  | 是否默认展开额外的消息内容                                              | ^[boolean]                                                                                 | false   |

### Message 方法

调用 `Message` 或 `this.$message` 会返回当前 Message 的实例。 如果需要手动关闭实例，可以调用它的 `close` 方法。

| 名称  | 描述               | 类型                    |
| ----- | ------------------ | ----------------------- |
| close | 关闭当前的 Message | ^[Function]`() => void` |

---

## MessageBox 二次确认框

模拟系统的消息提示框而实现的一套模态对话框组件，用于消息提示、确认消息和提交内容。

### 示例

:::demo 调用 `WMessageBox.alert` 方法以打开 alert 框。 它模拟了系统的 `alert`，无法通过按下 ESC 或点击框外关闭。 此例中接收了两个参数，`message`和`title`。 值得一提的是，窗口被关闭后，它默认会返回一个`Promise`对象便于进行后续操作的处理。 若不确定浏览器是否支持`Promise`，可自行引入第三方 polyfill 或像本例一样使用回调进行后续处理。

```vue
<template>
  <w-button plain @click="open">打开 Message Box</w-button>
</template>

<script lang="ts" setup>
import { WMessage, WMessageBox } from 'win-design-next'
import type { Action } from 'win-design-next'

const open = () => {
  WMessageBox.alert('This is a message', '标题', {
    // if you want to disable its autofocus
    // autofocus: false,
    confirmButtonText: '确定',
    callback: (action: Action) => {
      WMessage({
        type: 'info',
        message: `action: ${action}`,
      })
    },
  })
}
</script>
```

:::

:::demo 通过 `show-other-button` 属性控制是否显示其它按钮。

```vue
<template>
  <w-button plain @click="open">打开 Message Box</w-button>
</template>

<script lang="ts" setup>
import { WMessage, WMessageBox } from 'win-design-next'

const open = () => {
  WMessageBox.confirm('保存控制类文件?', '提示', {
    confirmButtonText: '保存当前文件',
    cancelButtonText: '取消',
    showOtherButton: true,
    otherButtonText: '保存全部',
    otherButtonClass: 'custom-other-button',
    type: 'warning',
    beforeClose: (action, instance, done) => {
      if (action === 'other') {
        instance.otherButtonLoading = true
        instance.otherButtonText = '加载中...'
        setTimeout(() => {
          done()
          setTimeout(() => {
            instance.otherButtonLoading = false
          }, 300)
        }, 3000)
      } else {
        done()
      }
    },
  })
    .then(() => {
      WMessage({
        type: 'success',
        message: '保存成功',
      })
    })
    .catch(() => {
      WMessage({
        type: 'info',
        message: '取消保存',
      })
    })
}
</script>
```

:::

:::demo 调用 `WMessageBox.confirm` 方法以打开 confirm 框。它模拟了系统的 `confirm`。 Message Box 组件也拥有极高的定制性，我们可以传入 `options` 作为第三个参数，它是一个字面量对象。 `type` 字段表明消息类型，可以为`success`，`error`，`info`和 `warning`，无效的设置将会被忽略。 需要注意的是，第二个参数 `title` 必须定义为 `String` 类型，如果是 `Object`，会被当做为 `options`使用。 在这里我们返回了一个 `Promise` 来处理后续响应。

```vue
<template>
  <w-button plain @click="open">Click to open the Message Box</w-button>
</template>

<script lang="ts" setup>
import { WMessage, WMessageBox } from 'win-design-next'

const open = () => {
  WMessageBox.confirm(
    'proxy will permanently delete the file. Continue?',
    'Warning',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    }
  )
    .then(() => {
      WMessage({
        type: 'success',
        message: 'Delete completed',
      })
    })
    .catch(() => {
      WMessage({
        type: 'info',
        message: 'Delete canceled',
      })
    })
}
</script>
```

:::

:::demo 调用 `WMessageBox.prompt` 方法以打开 prompt 框。它模拟了系统的 `prompt`。 可以用 `inputPattern` 字段自己规定匹配模式， 使用 `inputValidator` 来指定验证方法，它应该返回 `Boolean` 或 `String`。 返回 `false` 或 `String` 表示验证失败， 返回的字符串将用作 `inputErrorMessage`，用来提示用户错误原因。 此外，可以用 `inputPlaceholder` 字段来定义输入框的占位符。

```vue
<template>
  <w-button plain @click="open">Click to open Message Box</w-button>
</template>

<script lang="ts" setup>
import { WMessage, WMessageBox } from 'win-design-next'

const open = () => {
  WMessageBox.prompt('请输入 your e-mail', 'Tip', {
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    inputPattern:
      /[\w!#$%&'*+/=?^_`{|}~-]+(?:\.[\w!#$%&'*+/=?^_`{|}~-]+)*@(?:[\w](?:[\w-]*[\w])?\.)+[\w](?:[\w-]*[\w])?/,
    inputErrorMessage: 'Invalid Email',
  })
    .then(({ value }) => {
      WMessage({
        type: 'success',
        message: `Your email is:${value}`,
      })
    })
    .catch(() => {
      WMessage({
        type: 'info',
        message: 'Input canceled',
      })
    })
}
</script>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="open">Common VNode</w-button>
  <w-button plain @click="open1">Dynamic props</w-button>
</template>

<script lang="ts" setup>
import { h, ref } from 'vue'
import { WMessageBox, WSwitch } from 'win-design-next'

const open = () => {
  WMessageBox({
    title: 'Message',
    message: h('p', null, [
      h('span', null, 'Message can be '),
      h('i', { style: 'color: teal' }, 'VNode'),
    ]),
  })
}

const open1 = () => {
  const checked = ref<boolean | string | number>(false)
  WMessageBox({
    title: 'Message',
    // Should pass a function if VNode contains dynamic props
    message: () =>
      h(WSwitch, {
        modelValue: checked.value,
        'onUpdate:modelValue': (val: boolean | string | number) => {
          checked.value = val
        },
      }),
  })
}
</script>
```

:::

:::demo 上面提到的三个方法都是对 `WMessageBox` 方法的二次包装。 本例直接调用 `WMessageBox` 方法，使用了 `showCancelButton` 字段，用于显示取消按钮。 另外可使用 `cancelButtonClass` 为其添加自定义样式，使用 `cancelButtonText` 来自定义取消按钮文本（Confirm 按钮也具有相同的字段，在文末的 API 说明中有完整的字段列表）。 此例还使用了 `beforeClose` 属性， 当 beforeClose 被赋值且被赋值为一个回调函数时，在消息弹框被关闭之前将会被调用，并且可以通过该方法来阻止弹框被关闭。 它是一个接收三个参数：`action`、`instance` 和`done` 的方法。 使用它能够在关闭前对实例进行一些操作，比如为确定按钮添加 `loading` 状态等；此时若需要关闭实例，可以调用 `done` 方法（若在 `beforeClose` 中没有调用 `done`，则弹框便不会关闭）。

```vue
<template>
  <w-button plain @click="open">Click to open Message Box</w-button>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import { WMessage, WMessageBox } from 'win-design-next'

const open = () => {
  WMessageBox({
    title: 'Message',
    message: h('p', null, [
      h('span', null, 'Message can be '),
      h('i', { style: 'color: teal' }, 'VNode'),
    ]),
    showCancWButton: true,
    confirmButtonText: '确定',
    cancelButtonText: '取消',
    beforeClose: (action, instance, done) => {
      if (action === 'confirm') {
        instance.confirmButtonLoading = true
        instance.confirmButtonText = 'Loading...'
        setTimeout(() => {
          done()
          setTimeout(() => {
            instance.confirmButtonLoading = false
          }, 300)
        }, 3000)
      } else {
        done()
      }
    },
  }).then((action) => {
    WMessage({
      type: 'info',
      message: `action: ${action}`,
    })
  })
}
</script>
```

:::

:::demo 将 `dangerouslyUseHTMLString` 属性设置为 true，`message` 属性就会被当作 HTML 片段处理。

```vue
<template>
  <w-button plain @click="open">Click to open Message Box</w-button>
</template>

<script lang="ts" setup>
import { WMessageBox } from 'win-design-next'

const open = () => {
  WMessageBox.alert(
    '<strong>proxy is <i>HTML</i> string</strong>',
    'HTML String',
    {
      dangerouslyUseHTMLString: true,
    }
  )
}
</script>
```

:::

:::demo 默认情况下，当用户触发取消（点击取消按钮）和触发关闭（点击关闭按钮或遮罩层、按下 ESC 键）时，Promise 的 reject 回调和 `callback` 回调的参数均为 'cancel'。 如果将`distinguishCancelAndClose`属性设置为 true，则上述两种行为的参数分别为 'cancel' 和 'close'。

```vue
<template>
  <w-button plain @click="open">Click to open Message Box</w-button>
</template>

<script lang="ts" setup>
import { WMessage, WMessageBox } from 'win-design-next'
import type { Action } from 'win-design-next'

const open = () => {
  WMessageBox.confirm(
    'You have unsaved changes, save and proceed?',
    'Confirm',
    {
      distinguishCancelAndClose: true,
      confirmButtonText: 'Save',
      cancelButtonText: 'Discard Changes',
    }
  )
    .then(() => {
      WMessage({
        type: 'info',
        message: 'Changes saved. Proceeding to a new route.',
      })
    })
    .catch((action: Action) => {
      WMessage({
        type: 'info',
        message:
          action === 'cancel'
            ? 'Changes discarded. Proceeding to a new route.'
            : 'Stay in the current route',
      })
    })
}
</script>
```

:::

:::demo 将 `center` 属性设置为 `true` 可将内容居中显示。

```vue
<template>
  <w-button plain @click="open">Click to open Message Box</w-button>
</template>

<script lang="ts" setup>
import { WMessage, WMessageBox } from 'win-design-next'

const open = () => {
  WMessageBox.confirm(
    'proxy will permanently delete the file. Continue?',
    'Warning',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
      center: true,
    }
  )
    .then(() => {
      WMessage({
        type: 'success',
        message: 'Delete completed',
      })
    })
    .catch(() => {
      WMessage({
        type: 'info',
        message: 'Delete canceled',
      })
    })
}
</script>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="open">Click to open Message Box</w-button>
</template>

<script lang="ts" setup>
import { markRaw } from 'vue'
import { WMessageBox } from 'win-design-next'
import { Delete } from '@win-design-next/icons-vue'

const open = () => {
  WMessageBox.confirm(
    'It will permanently delete the file. Continue?',
    'Warning',
    {
      type: 'warning',
      icon: markRaw(Delete),
    }
  )
}
</script>
```

:::

:::demo 设置`draggable`属性为`true`来开启拖拽弹窗能力。 设置 `overflow` 为 `true` 可以让拖拽范围超出可视区。

```vue
<template>
  <w-button plain @click="open">在屏幕内拖拽</w-button>
  <w-button plain @click="open2"> 在屏幕外拖拽 </w-button>
</template>

<script lang="ts" setup>
import { WMessage, WMessageBox } from 'win-design-next'

const open = () => {
  WMessageBox.confirm(
    'proxy will permanently delete the file. Continue?',
    'Warning',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'danger',
      draggable: true,
    }
  )
    .then(() => {
      WMessage({
        type: 'success',
        message: 'Delete completed',
      })
    })
    .catch(() => {
      WMessage({
        type: 'info',
        message: 'Delete canceled',
      })
    })
}

const open2 = () => {
  WMessageBox.confirm(
    'proxy will permanently delete the file. Continue?',
    'Warning',
    {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'error',
      draggable: true,
      overflow: true,
    }
  )
    .then(() => {
      WMessage({
        type: 'success',
        message: 'Delete completed',
      })
    })
    .catch(() => {
      WMessage({
        type: 'info',
        message: 'Delete canceled',
      })
    })
}
</script>
```

:::

### API 文档

### 配置项

| 属性名                    | 说明                                                                                                                                                  | 类型                                                                               | 默认值                                          |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------------- |
| autofocus                 | 打开 MessageBox 时是否自动获得焦点                                                                                                                    | ^[boolean]                                                                         | true                                            |
| title                     | MessageBox 的标题                                                                                                                                     | ^[string]                                                                          | ''                                              |
| message                   | MessageBox 的正文内容                                                                                                                                 | ^[string] / ^[VNode] / ^[Function]`() => VNode`                                    | —                                               |
| dangerouslyUseHTMLString  | 是否将 `message` 作为 HTML 片段处理                                                                                                                   | ^[boolean]                                                                         | false                                           |
| type                      | 消息类型，用于图标显示                                                                                                                                | ^[enum]`'success' \| 'info' \| 'warning' \| 'error' \| 'danger' \| 'primary'`      | ''                                              |
| icon                      | 自定义图标组件，会覆盖 `type` 的类型                                                                                                                  | ^[string] / ^[Component]                                                           | ''                                              |
| customClass               | MessageBox 的自定义类名                                                                                                                               | ^[string]                                                                          | ''                                              |
| customStyle               | MessageBox 的自定义内联样式                                                                                                                           | ^[CSSProperties]                                                                   | {}                                              |
| modalClass                | 遮罩的自定义类名                                                                                                                                      | string                                                                             | —                                               |
| callback                  | 若不使用 Promise，可以使用此参数指定 MessageBox 关闭后的回调                                                                                          | ^[Function]`(value: string, action: Action) => any \| (action: Action) => any`     | null                                            |
| showClose                 | MessageBox 是否显示右上角关闭按钮                                                                                                                     | ^[boolean]                                                                         | true                                            |
| beforeClose               | messageBox 关闭前的回调，会暂停消息弹出框的关闭过程。                                                                                                 | ^[Function]`(action: Action, instance: MessageBoxState, done: () => void) => void` | null                                            |
| distinguishCancelAndClose | 是否将取消（点击取消按钮）与关闭（点击关闭按钮或遮罩层、按下 Esc 键）进行区分                                                                         | ^[boolean]                                                                         | false                                           |
| lockScroll                | 是否在 MessageBox 出现时将 body 滚动锁定                                                                                                              | ^[boolean]                                                                         | true                                            |
| showCancelButton          | 是否显示取消按钮                                                                                                                                      | ^[boolean]                                                                         | false（以 confirm 和 prompt 方式调用时为 true） |
| showConfirmButton         | 是否显示确定按钮                                                                                                                                      | ^[boolean]                                                                         | true                                            |
| cancelButtonText          | 取消按钮的文本内容                                                                                                                                    | ^[string]                                                                          | 取消                                            |
| confirmButtonText         | 确定按钮的文本内容                                                                                                                                    | ^[string]                                                                          | 确定                                            |
| cancelButtonLoadingIcon   | 取消按钮的加载图标内容                                                                                                                                | ^[string] / ^[Component]                                                           | Loading                                         |
| confirmButtonLoadingIcon  | 确认按钮的加载图标内容                                                                                                                                | ^[string] / ^[Component]                                                           | Loading                                         |
| cancelButtonClass         | 取消按钮的自定义类名                                                                                                                                  | ^[string]                                                                          | ''                                              |
| confirmButtonClass        | 确定按钮的自定义类名                                                                                                                                  | ^[string]                                                                          | ''                                              |
| closeOnClickModal         | 是否可通过点击遮罩层关闭 MessageBox                                                                                                                   | ^[boolean]                                                                         | true（以 alert 方式调用时为 false）             |
| closeOnPressEscape        | 是否可通过按下 ESC 键关闭 MessageBox                                                                                                                  | ^[boolean]                                                                         | true（以 alert 方式调用时为 false）             |
| closeOnHashChange         | 是否在 hash 改变时关闭 MessageBox                                                                                                                     | ^[boolean]                                                                         | true                                            |
| showInput                 | 是否显示输入框                                                                                                                                        | ^[boolean]                                                                         | false（以 prompt 方式调用时为 true）            |
| inputPlaceholder          | 输入框占位文本                                                                                                                                        | ^[string]                                                                          | ''                                              |
| inputType                 | 输入框的类型                                                                                                                                          | ^[string]                                                                          | text                                            |
| inputValue                | 输入框的初始文本                                                                                                                                      | ^[string]                                                                          | null                                            |
| inputPattern              | 输入框的校验表达式                                                                                                                                    | ^[regexp]                                                                          | null                                            |
| inputValidator            | 输入框的校验函数。 应该返回一个 boolean 或者 string， 如果返回的是一个 string 类型，那么该返回值会被赋值给 inputErrorMessage 用于向用户展示错误消息。 | ^[Function]`(value: string) => boolean \| string`                                  | null                                            |
| inputErrorMessage         | 校验未通过时的提示文本                                                                                                                                | ^[string]                                                                          | 输入的数据不合法!                               |
| center                    | 是否居中布局                                                                                                                                          | ^[boolean]                                                                         | false                                           |
| draggable                 | MessageBox 是否可拖放                                                                                                                                 | ^[boolean]                                                                         | false                                           |
| overflow                  | MessageBox 拖动范围可以超出可视区                                                                                                                     | ^[boolean]                                                                         | false                                           |
| roundButton               | 是否使用圆角按钮                                                                                                                                      | ^[boolean]                                                                         | false                                           |
| buttonSize                | 自定义确认按钮及取消按钮的大小                                                                                                                        | ^[string]`'small' \| 'default' \| 'large' \| 'mini'`                               | small                                           |
| appendTo                  | 设置组件的根元素                                                                                                                                      | ^[string] / ^[HTMLElement]                                                         | —                                               |

---

## Notification 通知

悬浮出现在页面角落，显示全局的通知提醒消息。

### 示例

:::demo WinDesign Next 注册了 `$notify` 方法并且它接受一个 Object 作为其参数。 在最简单的情况下，你可以通过设置 `title` 和 `message` 属性来设置通知的标题和正文内容。 默认情况下，通知在 4500 毫秒后自动关闭，但你可以通过设置 `duration` 属性来自定义通知的展示时间。 如果你将它设置为 `0`，那么通知将不会自动关闭。 需要注意的是 `duration` 接收一个 `Number`，单位为毫秒。

```vue
<template>
  <w-button plain @click="open1"> 可自动关闭 </w-button>
  <w-button plain @click="open2"> 不会自动关闭 </w-button>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import { WNotification } from 'win-design-next'

const open1 = () => {
  WNotification({
    title: '标题',
    message: h('i', { style: 'color: teal' }, 'This is a reminder'),
  })
}

const open2 = () => {
  WNotification({
    title: '标题',
    message: 'This is a message that does not automatically close',
    duration: 0,
  })
}
</script>
```

:::

:::demo WinDesign Next 为 Notification 组件准备了四种通知类型：`success`, `warning`, `info`, `error`。 他们可以设置 `type` 字段来修改，除上述的四个值之外的值会被忽略。 同时，我们也为 Notification 的各种 type 注册了单独的方法，可以在不传入 `type` 字段的情况下像 `open3` 和 `open4` 那样直接调用。

```vue
<template>
  <w-button plain @click="open1"> Success </w-button>
  <w-button plain @click="open2"> Warning </w-button>
  <w-button plain @click="open3"> Info </w-button>
  <w-button plain @click="open4"> Error </w-button>
  <w-button plain @click="open6"> Danger </w-button>
  <w-button plain @click="open5"> Primary </w-button>
</template>

<script lang="ts" setup>
import { WNotification } from 'win-design-next'

const open1 = () => {
  WNotification({
    title: 'Success',
    message: 'This is a success message',
    type: 'success',
  })
}

const open2 = () => {
  WNotification({
    title: 'Warning',
    message: 'This is a warning message',
    type: 'warning',
  })
}

const open3 = () => {
  WNotification({
    title: 'Info',
    message: 'This is an info message',
    type: 'info',
  })
}

const open4 = () => {
  WNotification({
    title: 'Error',
    message: 'This is an error message',
    type: 'error',
  })
}

const open6 = () => {
  WNotification({
    title: 'Error',
    message: 'This is an error message',
    type: 'danger',
  })
}

const open5 = () => {
  WNotification({
    title: 'Primary',
    message: 'This is an primary message',
    type: 'primary',
  })
}
</script>
```

:::

:::demo 使用 `position` 属性设置 Notification 的弹出位置， 支持四个选项：`top-right`、`top-left`、`bottom-right` 和 `bottom-left`， 默认为 `top-right`。

```vue
<template>
  <w-button plain @click="open1"> Top Right </w-button>
  <w-button plain @click="open2"> Bottom Right </w-button>
  <w-button plain @click="open3"> Bottom Left </w-button>
  <w-button plain @click="open4"> Top Left </w-button>
</template>

<script lang="ts" setup>
import { WNotification } from 'win-design-next'

const open1 = () => {
  WNotification({
    title: 'Custom Position',
    message: "I'm at the top right corner",
  })
}

const open2 = () => {
  WNotification({
    title: 'Custom Position',
    message: "I'm at the bottom right corner",
    position: 'bottom-right',
  })
}

const open3 = () => {
  WNotification({
    title: 'Custom Position',
    message: "I'm at the bottom left corner",
    position: 'bottom-left',
  })
}

const open4 = () => {
  WNotification({
    title: 'Custom Position',
    message: "I'm at the top left corner",
    position: 'top-left',
  })
}
</script>
```

:::

:::demo Notification 提供设置偏移量的功能，通过设置 `offset` 字段，可以使弹出的消息距屏幕边缘偏移一段距离。 注意在同一时刻，每一个的 Notification 实例应当具有一个相同的偏移量。

```vue
<template>
  <w-button plain @click="open"> Notification with offset </w-button>
</template>

<script lang="ts" setup>
import { WNotification } from 'win-design-next'

const open = () => {
  WNotification.success({
    title: 'Success',
    message: 'This is a success message',
    offset: 100,
  })
}
</script>
```

:::

:::demo 将 `dangerouslyUseHTMLString` 属性设置为 true，`message` 属性就会被当作 HTML 片段处理。

```vue
<template>
  <w-button plain @click="open"> Use HTML String </w-button>
</template>

<script lang="ts" setup>
import { WNotification } from 'win-design-next'

const open = () => {
  WNotification({
    title: 'HTML String',
    dangerouslyUseHTMLString: true,
    message: '<strong>This is <i>HTML</i> string</strong>',
  })
}
</script>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="open">Common VNode</w-button>
  <w-button plain @click="open1">Dynamic props</w-button>
</template>

<script lang="ts" setup>
import { h, ref } from 'vue'
import { WNotification, WSwitch } from 'win-design-next'

const open = () => {
  WNotification({
    title: 'Use Vnode',
    message: h('p', null, [
      h('span', null, 'Message can be '),
      h('i', { style: 'color: teal' }, 'VNode'),
    ]),
  })
}

const open1 = () => {
  const checked = ref<boolean | string | number>(false)
  WNotification({
    title: 'Use Vnode',
    // Should pass a function if VNode contains dynamic props
    message: () =>
      h(WSwitch, {
        modelValue: checked.value,
        'onUpdate:modelValue': (val: boolean | string | number) => {
          checked.value = val
        },
      }),
  })
}
</script>
```

:::

:::demo 将 `showClose` 属性设置为 `false` 即可隐藏关闭按钮。

```vue
<template>
  <w-button plain @click="open"> Hide close button </w-button>
</template>

<script lang="ts" setup>
import { WNotification } from 'win-design-next'

const open = () => {
  WNotification.success({
    title: 'Info',
    message: 'This is a message without close button',
    showClose: false,
  })
}
</script>
```

:::

### API 文档

### 配置项

| 名称                     | 说明                                                                                          | 类型                                                                    | 默认      |
| ------------------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | --------- |
| title                    | 标题                                                                                          | ^[string]                                                               | ''        |
| message                  | 通知栏正文内容                                                                                | ^[string] / ^[VNode] / ^[Function]`() => VNode`                         | ''        |
| dangerouslyUseHTMLString | 是否将 message 属性作为 HTML 片段处理                                                         | ^[boolean]                                                              | false     |
| type                     | 通知的类型                                                                                    | ^[enum]`'success' \| 'warning' \| 'info' \| 'error' \| 'danger' \| 'primary' \| ''` | ''        |
| icon                     | 自定义图标。 若设置了 `type`，则 `icon` 会被覆盖                                              | ^[string] / ^[Component]                                                | —         |
| customClass              | 自定义类名                                                                                    | ^[string]                                                               | ''        |
| duration                 | 显示时间, 单位为毫秒。 值为 0 则不会自动关闭                                                  | ^[number]                                                               | 4500      |
| position                 | 自定义弹出位置                                                                                | ^[enum]`'top-right' \| 'top-left' \| 'bottom-right' \| 'bottom-left'`   | top-right |
| showClose                | 是否显示关闭按钮                                                                              | ^[boolean]                                                              | true      |
| onClose                  | 关闭时的回调函数                                                                              | ^[Function]`() => void`                                                 | —         |
| onClick                  | 点击 Notification 时的回调函数                                                                | ^[Function]`() => void`                                                 | —         |
| offset                   | 相对屏幕顶部的偏移量 偏移的距离，在同一时刻，所有的 Notification 实例应当具有一个相同的偏移量 | ^[number]                                                               | 0         |
| appendTo                 | 设置 notification 的根元素，默认为 `document.body`                                            | ^[string] / ^[HTMLElement]                                              | —         |
| zIndex                   | 初始 zIndex                                                                                   | ^[number]                                                               | 0         |

### 方法

`Notification` 和 `this.$notify` 都返回当前的 Notification 实例。 如果需要手动关闭实例，可以调用它的 `close` 方法。

| 名称  | 详情                    | 类型                    |
| ----- | ----------------------- | ----------------------- |
| close | 关闭当前的 Notification | ^[Function]`() => void` |

---

## Tour 漫游式引导

用于分步引导用户了解产品功能的气泡组件。 用来引导用户并介绍产品

### 示例

:::demo

```vue
<template>
  <w-button type="primary" @click="open = true">Begin Tour</w-button>

  <w-divider />

  <w-space>
    <w-button ref="ref1">Upload</w-button>
    <w-button ref="ref2" type="primary">Save</w-button>
    <w-button ref="ref3" :icon="Others" />
  </w-space>

  <w-tour v-model="open">
    <w-tour-step :target="ref1?.$el" title="Upload File">
      <img
        style="width: 240px"
        src="https://cdn.dribbble.com/users/60166/screenshots/11442385/media/04245a13a17845b0bb38203e7bf4eac9.jpg?resize=2560x1080&vertical=center"
        alt="tour.png"
      />
      <div>Put you files here.</div>
    </w-tour-step>
    <w-tour-step
      :target="ref2?.$el"
      title="Save"
      description="Save your changes"
    />
    <w-tour-step
      :target="ref3?.$el"
      title="Other Actions"
      description="Click to see other"
    />
  </w-tour>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Others } from '@win-design-next/icons-vue'
import type { ButtonInstance } from 'win-design-next'

const ref1 = ref<ButtonInstance>()
const ref2 = ref<ButtonInstance>()
const ref3 = ref<ButtonInstance>()

const open = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-button type="primary" @click="open = true">Begin Tour</w-button>

  <w-divider />

  <w-space>
    <w-button ref="ref1">Upload</w-button>
    <w-button ref="ref2" type="primary">Save</w-button>
    <w-button ref="ref3" :icon="Others" />
  </w-space>

  <w-tour v-model="open" type="primary" :mask="false">
    <w-tour-step
      :target="ref1?.$el"
      title="Upload File"
      description="Put you files here."
    />
    <w-tour-step
      :target="ref2?.$el"
      title="Save"
      description="Save your changes"
    />
    <w-tour-step
      :target="ref3?.$el"
      title="Other Actions"
      description="Click to see other"
    />
  </w-tour>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Others } from '@win-design-next/icons-vue'
import type { ButtonInstance } from 'win-design-next'

const ref1 = ref<ButtonInstance>()
const ref2 = ref<ButtonInstance>()
const ref3 = ref<ButtonInstance>()

const open = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-button ref="btnRef" type="primary" @click="open = true">
    Begin Tour
  </w-button>

  <w-tour v-model="open">
    <w-tour-step
      title="Center"
      description="Displayed in the center of screen."
    />
    <w-tour-step
      title="Right"
      description="On the right of target."
      placement="right"
      :target="btnRef?.$el"
    />
    <w-tour-step
      title="Top"
      description="On the top of target."
      placement="top"
      :target="btnRef?.$el"
    />
  </w-tour>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ButtonInstance } from 'win-design-next'

const btnRef = ref<ButtonInstance>()

const open = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-button type="primary" @click="open = true">Begin Tour</w-button>

  <w-divider />

  <w-space>
    <w-button ref="ref1">Upload</w-button>
    <w-button ref="ref2" type="primary">Save</w-button>
    <w-button ref="ref3" :icon="Others" />
  </w-space>

  <w-tour
    v-model="open"
    :mask="{
      style: {
        boxShadow: 'inset 0 0 15px #333',
      },
      color: 'rgba(80, 255, 255, .4)',
    }"
  >
    <w-tour-step :target="ref1?.$el" title="Upload File">
      <img
        src="https://cdn.dribbble.com/users/60166/screenshots/11442385/media/04245a13a17845b0bb38203e7bf4eac9.jpg?resize=2560x1080&vertical=center"
        alt="tour.png"
      />
      <div>Put you files here.</div>
    </w-tour-step>
    <w-tour-step
      :target="ref2?.$el"
      title="Save"
      description="Save your changes"
      :mask="{
        style: {
          boxShadow: 'inset 0 0 15px #fff',
        },
        color: 'rgba(40, 0, 255, .4)',
      }"
    />
    <w-tour-step
      :target="ref3?.$el"
      title="Other Actions"
      description="Click to see other"
      :mask="false"
    />
  </w-tour>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Others } from '@win-design-next/icons-vue'
import type { ButtonInstance } from 'win-design-next'

const ref1 = ref<ButtonInstance>()
const ref2 = ref<ButtonInstance>()
const ref3 = ref<ButtonInstance>()

const open = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-button type="primary" @click="open = true">Begin Tour</w-button>

  <w-divider />

  <w-space>
    <w-button ref="ref1">Upload</w-button>
    <w-button ref="ref2" type="primary">Save</w-button>
    <w-button ref="ref3" :icon="Others" />
  </w-space>

  <w-tour v-model="open">
    <w-tour-step
      :target="ref1?.$el"
      title="Upload File"
      description="Put you files here."
    />
    <w-tour-step
      :target="ref2?.$el"
      title="Save"
      description="Save your changes"
    />
    <w-tour-step
      :target="ref3?.$el"
      title="Other Actions"
      description="Click to see other"
    />
    <template #indicators="{ current, total }">
      <span>{{ current + 1 }}/{{ total }}</span>
    </template>
  </w-tour>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Others } from '@win-design-next/icons-vue'
import type { ButtonInstance } from 'win-design-next'

const ref1 = ref<ButtonInstance>()
const ref2 = ref<ButtonInstance>()
const ref3 = ref<ButtonInstance>()

const open = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-button type="primary" @click="open = true">Begin Tour</w-button>

  <w-divider />

  <w-space>
    <w-button id="btn1">Upload</w-button>
    <w-button id="btn2" type="primary">Save</w-button>
    <w-button ref="btnRef" :icon="Others" />
  </w-space>

  <w-tour v-model="open">
    <w-tour-step
      target="#btn1"
      title="Upload File"
      description="Put you files here."
    />
    <w-tour-step :target="el" title="Save" description="Save your changes" />
    <w-tour-step
      :target="btnRef?.$el"
      title="Other Actions"
      description="Click to see other"
    />
  </w-tour>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Others } from '@win-design-next/icons-vue'
import type { ButtonInstance } from 'win-design-next'

const el = () => document.querySelector<HTMLElement>('#btn2')
const btnRef = ref<ButtonInstance>()

const open = ref(false)
</script>
```

:::

### API 文档

:::tip
tour-step 组件上相同名称配置的优先级更高。
:::

### Tour Attributes

| 属性名                    | 说明                                                             | 类型                                                                                                                                                                        | 默认值                         |
| ------------------------- | ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| show-arrow                | 是否显示箭头                                                     | `boolean`                                                                                                                                                                   | true                           |
| placement                 | 引导卡片相对于目标元素的位置                                     | ^[enum]`'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'` | `bottom`                       |
| content-style             | c 为 content 自定义样式                                          | `CSSProperties`                                                                                                                                                             | —                              |
| mask                      | 是否启用遮罩，通过自定义属性改变遮罩样式以及填充的颜色           | `boolean` \| ^[Object]`{ style?: CSSProperties; color?: string; }`                                                                                                          | `true`                         |
| type                      | 类型，影响底色与文字颜色                                         | `default` \| `primary`                                                                                                                                                      | `default`                      |
| model-value / v-model     | 打开引导                                                         | `boolean`                                                                                                                                                                   | —                              |
| current / v-model:current | 当前值                                                           | `number`                                                                                                                                                                    | —                              |
| scroll-into-view-options  | 是否支持当前元素滚动到视窗内，也可传入配置指定滚动视窗的相关参数 | `boolean` \| `ScrollIntoViewOptions`                                                                                                                                        | ^[Object]`{ block: 'center' }` |
| z-index                   | Tour 层级                                                        | `number`                                                                                                                                                                    | `2001`                         |
| show-close                | 是否显示关闭按钮                                                 | `boolean`                                                                                                                                                                   | `true`                         |
| close-icon                | 自定义关闭图标，默认 Close                                       | `string` \| `Component`                                                                                                                                                     | —                              |
| close-on-press-escape     | 是否可以通过按下 ESC 关闭引导                                    | `boolean`                                                                                                                                                                   | `true`                         |
| target-area-clickable     | 启用蒙层时，target 元素区域是否可以点击。                        | `boolean`                                                                                                                                                                   | `true`                         |

### Tour slots

| 插槽名     | 说明                                            |
| ---------- | ----------------------------------------------- |
| default    | tourStep 组件列表                               |
| indicators | 自定义指示器, scope 参数是 `{ current, total }` |

### Tour events

| 事件名 | 说明                           | 类型                                   |
| ------ | ------------------------------ | -------------------------------------- |
| close  | callback function on shutdown  | ^[Function]`(current: number) => void` |
| finish | callback function on finished  | ^[Function]`() => void`                |
| change | callback when the step changes | ^[Function]`(current: number) => void` |

### TourStep Attributes

| 属性名                   | 说明                                                                                                               | 类型                                                                                                                                                                        | 默认值    |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------- |
| target                   | 获取引导卡片指向的元素， 为空时居中于屏幕。 自以来支持字符串和函数类型。 字符串类型是文档.querySelector 的选择器。 | `HTMLElement` \| `string` \| ^[Function]`() => HTMLElement`                                                                                                                 | —         |
| show-arrow               | 是否显示箭头                                                                                                       | `boolean`                                                                                                                                                                   | `true`    |
| title                    | title                                                                                                              | `string`                                                                                                                                                                    | —         |
| description              | description                                                                                                        | `string`                                                                                                                                                                    | —         |
| placement                | 引导卡片相对于目标元素的位置                                                                                       | ^[enum]`'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'` | `bottom`  |
| content-style            | 为 content 自定义样式                                                                                              | `CSSProperties`                                                                                                                                                             | —         |
| mask                     | 是否启用蒙层，也可传入配置改变蒙层样式和填充色                                                                     | `boolean` \| ^[Object]`{ style?: CSSProperties; color?: string; }`                                                                                                          | `true`    |
| type                     | 类型，影响底色与文字颜色                                                                                           | `default` \| `primary`                                                                                                                                                      | `default` |
| next-button-props        | “下一步”按钮的属性                                                                                                 | ^[Object]`{ children: VueNode \| string; onClick: Function }`                                                                                                               | —         |
| prev-button-props        | “上一步”按钮的属性                                                                                                 | ^[Object]`{ children: VueNode \| string; onClick: Function }`                                                                                                               | —         |
| scroll-into-view-options | 是否支持当前元素滚动到视窗内，也可传入配置指定滚动视窗的相关参数，默认跟随 Tour 的                                 | `boolean` \| `ScrollIntoViewOptions`                                                                                                                                        | —         |
| show-close               | 是否显示关闭按钮                                                                                                   | `boolean`                                                                                                                                                                   | `true`    |
| close-icon               | 自定义关闭图标，默认 Close                                                                                         | `string` \| `Component`                                                                                                                                                     | —         |

### TourStep slots

| 插槽名  | 说明        |
| ------- | ----------- |
| default | description |
| header  | header      |

### TourStep events

| 事件名 | 说明                          | 参数                    |
| ------ | ----------------------------- | ----------------------- |
| close  | callback function on shutdown | ^[Function]`() => void` |

---

