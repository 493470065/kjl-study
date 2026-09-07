## Button 按钮

常用的操作按钮。

### 示例

:::demo 使用 `type`、`plain`、`round`、`circle` 、 `link` 和 `text` 来定义按钮的样式。使用 `disabled` 属性来控制按钮是否为禁用状态。 该属性接受一个 `Boolean` 类型的值。通过 tight 属性设置紧凑版，调整左右间距均为 8px，适用于空间位置不够时使用。

```vue
<template>
  <div class="mb-4">
    <w-title>默认样式</w-title>
    <div class="flex">
      <div class="mr-8">
        <w-button>默认按钮</w-button>
        <w-button type="primary">主要按钮</w-button>
        <w-button type="success">成功按钮</w-button>
        <w-button type="warning">警告按钮</w-button>
        <w-button type="danger">危险按钮</w-button>
        <w-button type="error">危险按钮</w-button>
        <w-button type="info">信息按钮</w-button>
      </div>
      <div class="">
        <w-button disabled>默认按钮</w-button>
        <w-button disabled type="primary">主要按钮</w-button>
        <w-button disabled type="success">成功按钮</w-button>
        <w-button disabled type="warning">警告按钮</w-button>
        <w-button disabled type="danger">危险按钮</w-button>
        <w-button disabled type="info">信息按钮</w-button>
      </div>
    </div>
    <w-divider />
  </div>

  <div class="mb-4">
    <w-title>轻量按钮：plain: boolean</w-title>
    <div class="flex">
      <div class="mr-8">
        <w-button plain>轻量按钮</w-button>
        <w-button type="primary" plain>主要按钮</w-button>
        <w-button type="success" plain>成功按钮</w-button>
        <w-button type="warning" plain>警告按钮</w-button>
        <w-button type="danger" plain>危险按钮</w-button
        ><w-button type="info" plain>信息按钮</w-button>
      </div>
      <div class="">
        <w-button disabled plain>轻量按钮</w-button>
        <w-button disabled type="primary" plain>主要按钮</w-button>
        <w-button disabled type="success" plain>成功按钮</w-button>
        <w-button disabled type="warning" plain>警告按钮</w-button>
        <w-button disabled type="danger" plain>危险按钮</w-button
        ><w-button disabled type="info" plain>信息按钮</w-button>
      </div>
    </div>
    <w-divider />
  </div>

  <div class="mb-4">
    <w-title>链接按钮：link: boolean</w-title>
    <div class="flex">
      <div class="mr-8">
        <w-button link>默认按钮</w-button>
        <w-button type="primary" link>主要按钮</w-button>
        <w-button type="success" link>成功按钮</w-button>
        <w-button type="warning" link>警告按钮</w-button>
        <w-button type="danger" link>危险按钮</w-button>
        <w-button type="info" link>信息按钮</w-button>
      </div>
      <div class="">
        <w-button disabled link>默认按钮</w-button>
        <w-button disabled type="primary" link>主要按钮</w-button>
        <w-button disabled type="success" link>成功按钮</w-button>
        <w-button disabled type="warning" link>警告按钮</w-button>
        <w-button disabled type="danger" link>危险按钮</w-button>
        <w-button disabled type="info" link>信息按钮</w-button>
      </div>
    </div>
    <w-divider />
  </div>

  <div class="mb-4">
    <w-title>
      文字按钮：由于 type 属性会同时控制按钮的样式， 因此我们通过一个新的 API
      text: boolean 来控制文字按钮
    </w-title>
    <div class="flex">
      <div class="mr-8">
        <w-button text>默认按钮</w-button>
        <w-button type="primary" text>主要按钮</w-button>
        <w-button type="success" text>成功按钮</w-button>
        <w-button type="warning" text>警告按钮</w-button>
        <w-button type="danger" text>危险按钮</w-button>
        <w-button type="info" text>信息按钮</w-button>
      </div>
      <div class="mr-8">
        <w-button bg text>默认按钮</w-button>
        <w-button bg type="primary" text>主要按钮</w-button>
        <w-button bg type="success" text>成功按钮</w-button>
        <w-button bg type="warning" text>警告按钮</w-button>
        <w-button bg type="danger" text>危险按钮</w-button>
        <w-button bg type="info" text>信息按钮</w-button>
      </div>
      <div class="">
        <w-button disabled bg text>默认按钮</w-button>
        <w-button disabled bg type="primary" text>主要按钮</w-button>
        <w-button disabled bg type="success" text>成功按钮</w-button>
        <w-button disabled bg type="warning" text>警告按钮</w-button>
        <w-button disabled bg type="danger" text>危险按钮</w-button>
        <w-button disabled bg type="info" text>信息按钮</w-button>
      </div>
    </div>
    <w-divider />
  </div>

  <div class="mb-4">
    <w-title>圆形按钮：circle: boolean</w-title>
    <w-button :icon="Search" circle />
    <w-button type="primary" :icon="Edit" circle />
    <w-button type="success" :icon="Check" circle />
    <w-button type="info" :icon="Date" circle />
    <w-button type="warning" :icon="Star" circle />
    <w-button type="danger" :icon="Delete" circle />
    <w-divider />
  </div>

  <div class="mb-4">
    <w-title>圆角按钮：round: boolean</w-title>
    <w-button round>默认按钮</w-button>
    <w-button type="primary" round>主要按钮</w-button>
    <w-button type="success" round>成功按钮</w-button>
    <w-button type="warning" round>警告按钮</w-button>
    <w-button type="danger" round>危险按钮</w-button>
    <w-button type="info" round>信息按钮</w-button>
    <w-divider />
  </div>

  <div class="mb-4">
    <w-title>🎉 紧凑模式：tight: Boolean 默认是开启的</w-title>
    <div class="mb-4">
      <w-button tight>默认是开启的</w-button>
      <w-button :tight="false" type="primary">关闭紧凑模式</w-button>
    </div>
  </div>
</template>

<script lang="ts" setup>
import {
  Check,
  Date,
  Delete,
  Edit,
  Search,
  Star,
} from '@win-design-next/icons-vue'
</script>

<style scoped lang="scss">
.w3-button {
  margin: 0 12px 12px 0;
  & + .w3-button {
    margin-left: 0;
  }
}
</style>
```

:::

:::demo 使用 `smart` 属性额外配置智能按钮组，根据容器宽度自动排版、空间不够时折叠到”更多“中。使用 `discrete` 设置按钮组是否离散，使用 `position` 设置左/右侧.

```vue
<template>
  <w-switch
    v-model="isAuto"
    active-text="宽度：自动"
    inactive-text="宽度：400px"
  />
  <div class="card" :style="{ width: isAuto ? '' : '400px' }">
    <w-button-group smart discrete>
      <w-button type="primary" @click="handleClick('查对医嘱')"
        >查对医嘱</w-button
      >
      <w-button type="primary" @click="handleClick('通知医生')"
        >通知医生</w-button
      >
      <w-button>一键记账</w-button>
      <w-button>表格设置</w-button>
      <w-button>单据打印</w-button>
      <w-button>标本采集</w-button>
      <w-button>医嘱打印</w-button>
      <w-button>医嘱打印新</w-button>
    </w-button-group>
  </div>

  <w-table :data="tableData" border style="width: 100%" size="mini">
    <w-table-column
      prop="name"
      label="药品名称"
      show-overflow-tooltip
      overflow-tooltip-inherit
    />
    <w-table-column prop="size" width="120" label="规格" />
    <w-table-column prop="count" label="数量" />
    <w-table-column prop="price" label="单价(元)" align="right" />
    <w-table-column label="操作">
      <template #default>
        <w-button-group
          discrete
          smart
          smart-link
          smart-type="primary"
          size="small"
        >
          <w-button type="primary" link>一键记账</w-button>
          <w-button type="primary" link>表格设置</w-button>
          <w-button type="primary" link>单据打印</w-button>
          <w-button type="primary" link>标本采集</w-button>
          <w-button type="primary" link>医嘱打印</w-button>
          <w-button type="primary" link>医嘱打印新</w-button>
          <w-button link type="primary" @click="handleClick('查对医嘱')"
            >查对医嘱</w-button
          >
          <w-button link type="primary" @click="handleClick('通知医生')"
            >通知医生</w-button
          >
        </w-button-group>
      </template>
    </w-table-column>
  </w-table>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const isAuto = ref(false)

const tableData = ref([
  {
    name: '布洛芬颗粒(贝贝清)',
    size: '0.2g*9包',
    count: '10',
    unit: '包',
    price: '10.00',
    total: '100.00',
  },
  {
    name: '氯化钾颗粒',
    size: '1.57:1.5g*4袋',
    count: '10',
    unit: '袋',
    price: '10.00',
    total: '100.00',
  },
  {
    name: '炔诺酮片',
    size: '625微克/片',
    count: '10',
    unit: '片',
    price: '10.00',
    total: '100.00',
  },
  {
    name: '扶达胶囊',
    size: '100毫克/粒',
    count: '5',
    unit: '粒',
    price: '12.00',
    total: '60.00',
  },
  {
    name: '百士欣胶囊',
    size: '10毫克/粒',
    count: '2',
    unit: '粒',
    price: '22.50',
    total: '45.00',
  },
  {
    name: '别嘌醇片',
    size: '100毫克/片',
    count: '10',
    unit: '片',
    price: '14.50',
    total: '145.00',
  },
  {
    name: '复方维生素注射液',
    size: '2毫升/支',
    count: '10',
    unit: '支',
    price: '12.73',
    total: '127.30',
  },
])

const handleClick = (val: string) => {
  console.log('点击：', val)
}
</script>

<style lang="scss" scoped>
.card {
  margin-top: 20px;
  padding-bottom: 16px;
}
</style>
```

:::

:::demo 使用 `debounce` 属性额外配置防抖，通过 `debounce-time` 来配置防抖时间，单位为毫秒。

```vue
<template>
  <div class="mb-4">
    <w-switch
      v-model="debounce"
      active-text="开启防抖"
      inactive-text="关闭防抖"
    />
  </div>
  <div class="mb-4 flex">
    <div style="width: 140px; font-weight: 700">输入防抖时间：</div>
    <w-input-number
      v-model="debounceTime"
      style="width: 240px"
      placeholder="请输入防抖时间（毫秒）"
      :min="1000"
      :max="10000"
      :controls="false"
      @change="handleChange"
    />
  </div>
  <div class="mb-4 flex">
    <w-button
      :debounce="debounce"
      :debounce-time="debounceTime"
      type="primary"
      @click="handleButtonClick"
      >主要按钮</w-button
    >
    <w-button
      :debounce="debounce"
      :debounce-time="debounceTime"
      type="success"
      @click="handleButtonClick"
      >成功按钮</w-button
    >
    <w-button
      :debounce="debounce"
      :debounce-time="debounceTime"
      type="warning"
      @click="handleButtonClick"
      >警告按钮</w-button
    >
    <w-button
      :debounce="debounce"
      :debounce-time="debounceTime"
      type="danger"
      @click="handleButtonClick"
      >危险按钮</w-button
    >
    <w-button
      :debounce="debounce"
      :debounce-time="debounceTime"
      type="info"
      @click="handleButtonClick"
      >信息按钮</w-button
    >
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { WMessage } from 'win-design-next'

const debounce = ref(true)
const debounceTime = ref(1000)

const handleChange = (val) => {
  console.log('输入框的值：', val)
}

const handleButtonClick = () => {
  console.log('点击事件')
  WMessage({
    message: '点击事件',
    type: 'success',
  })
}
</script>
```

:::

:::demo

```vue
<template>
  <div class="flex mb-8">
    <w-button type="primary" loading>加载中</w-button>
  </div>
  <div class="flex mb-8">
    <w-button loading-ball loading>加载中</w-button>
    <w-button loading-ball loading>加载中</w-button>
    <w-button loading-ball type="primary" loading>加载中</w-button>
    <w-button loading-ball size="large" type="primary" loading>加载中</w-button>
  </div>
  <div class="flex">
    <w-button type="primary" :loading-icon="RefreshRight" loading
      >加载中</w-button
    >
    <w-button type="primary" loading>
      <template #loading>
        <div class="custom-loading">
          <svg class="circular" viewBox="-10, -10, 50, 50">
            <path
              class="path"
              d="
            M 30 15
            L 28 17
            M 25.61 25.61
            A 15 15, 0, 0, 1, 15 30
            A 15 15, 0, 1, 1, 27.99 7.5
            L 15 15
          "
              style="stroke-width: 4px; fill: rgba(0, 0, 0, 0)"
            />
          </svg>
        </div>
      </template>
      加载中
    </w-button>
  </div>
</template>

<script lang="ts" setup>
import { RefreshRight } from '@win-design-next/icons-vue'
</script>

<style scoped>
.w3-button .custom-loading .circular {
  margin-right: 6px;
  width: 18px;
  height: 18px;
  animation: loading-rotate 2s linear infinite;
}
.w3-button .custom-loading .circular .path {
  animation: loading-dash 1.5s ease-in-out infinite;
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-width: 2;
  stroke: var(--w3-button-font-color);
  stroke-linecap: round;
}
</style>
```

:::

:::demo 使用 `size` 属性额外配置尺寸，可使用 `large`、`small` 和 `mini` 三种值。

```vue
<template>
  <w-radio-group v-model="size" class="mb-4">
    <w-radio value="large">Large</w-radio>
    <w-radio value="default">Default</w-radio>
    <w-radio value="small">Small</w-radio>
    <w-radio value="mini">Mini</w-radio>
  </w-radio-group>
  <div class="mb-4">
    <w-button :size="size" type="primary">主要按钮</w-button>
    <w-button :size="size" type="success">成功按钮</w-button>
    <w-button :size="size" type="warning">警告按钮</w-button>
    <w-button :size="size" type="danger">危险按钮</w-button>
    <w-button :size="size" type="info">信息按钮</w-button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const size = ref('default')
</script>
```

:::

:::demo 使用 `icon` 属性来为按钮添加图标。 您可以在我们的 Icon 组件中找到所需图标。 通过向右方添加`<i>`标签来添加图标， 你也可以使用自定义图标。

```vue
<template>
  <div>
    <w-button type="primary" :icon="Edit" />
    <w-button type="primary" :icon="Search" />
    <w-button type="primary" :icon="Edit" />
    <w-button type="primary" :icon="Search">搜索</w-button>
  </div>
</template>

<script setup lang="ts">
import { Edit, Search } from '@win-design-next/icons-vue'
</script>
```

:::

:::demo 使用 `<w-button-group>` 对多个按钮分组。

```vue
<template>
  <w-button-group>
    <w-button type="primary" :icon="ArrowLeft">上一页</w-button>
    <w-button type="primary">
      下一页<w-icon class="w3-icon--right"><ArrowRight /></w-icon>
    </w-button>
  </w-button-group>

  <w-button-group class="ml-4">
    <w-button type="primary" :icon="Edit" />
    <w-button type="primary" :icon="Share" />
    <w-button type="primary" :icon="Delete" />
  </w-button-group>

  <w-button-group class="ml-4" discrete>
    <w-button type="primary" :icon="Edit" />
    <w-button type="primary" :icon="Share" />
    <w-button type="primary" :icon="Delete" />
  </w-button-group>
</template>

<script setup lang="ts">
import {
  ArrowLeft,
  ArrowRight,
  Delete,
  Edit,
  Share,
} from '@win-design-next/icons-vue'
</script>
```

:::

:::demo

```vue
<template>
  <w-button>button</w-button>
  <w-button tag="div" role="button" tabindex="0">div</w-button>
  <w-button
    type="primary"
    tag="a"
    href="http://wued.winning-health.com.cn:8088/win-design/"
    target="_blank"
    rel="noopener noreferrer"
  >
    a
  </w-button>
</template>
```

:::

:::demo

```vue
<script lang="ts" setup>
import { isDark } from '~/composables/dark'
</script>

<template>
  <div>
    <w-button color="#626aef" :dark="isDark">默认</w-button>
    <w-button color="#626aef" :dark="isDark" plain>轻量</w-button>

    <w-button color="#626aef" :dark="isDark" disabled>禁用</w-button>
    <w-button color="#626aef" :dark="isDark" disabled plain>
      禁用轻量
    </w-button>
  </div>
</template>
```

:::

### API 文档

### Attributes

| 参数                | 说明                                                        | 类型                                                                           | 默认值  | Version |
| ------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------ | ------- | ------- |
| size                | 尺寸                                                        | ^[enum]`'large' \| 'default' \| 'small' \| 'mini'`                             | —       |
| type                | 按钮类型，在设置`color`时，后者优先。                       | ^[enum]`'primary' \| 'success' \| 'warning' \| 'danger' \| 'error' \| 'info' ` | —       |
| plain               | 是否为朴素按钮                                              | ^[boolean]                                                                     | false   |
| text                | 是否为文字按钮                                              | ^[boolean]                                                                     | false   |
| bg                  | 是否显示文字按钮背景颜色                                    | ^[boolean]                                                                     | false   |
| link                | 是否为链接按钮                                              | ^[boolean]                                                                     | false   |
| round               | 是否为圆角按钮                                              | ^[boolean]                                                                     | false   |
| circle              | 是否为圆形按钮                                              | ^[boolean]                                                                     | false   |
| loading             | 是否为加载中状态                                            | ^[boolean]                                                                     | false   |
| loading-icon        | 自定义加载中状态图标组件                                    | ^[string] / ^[Component]                                                       | Loading |
| disabled            | 按钮是否为禁用状态                                          | ^[boolean]                                                                     | false   |
| icon                | 图标组件                                                    | ^[string] / ^[Component]                                                       | —       |
| autofocus           | 原生 `autofocus` 属性                                       | ^[boolean]                                                                     | false   |
| native-type         | 原生 type 属性                                              | ^[enum]`'button' \| 'submit' \| 'reset'`                                       | button  |
| auto-insert-space   | 自动在两个中文字符之间插入空格                              | ^[boolean]                                                                     | —       |
| color               | 自定义按钮颜色, 并自动计算 `hover` 和 `active` 触发后的颜色 | ^[string]                                                                      | —       |
| dark                | dark 模式, 意味着自动设置 `color` 为 dark 模式的颜色        | ^[boolean]                                                                     | false   |
| tag                 | 自定义元素标签                                              | ^[string] / ^[Component]                                                       | button  |
| tight               | 是否为紧凑按钮                                              | ^[boolean]                                                                     | true    |
| debounce            | 是否开启防抖                                                | ^[boolean]                                                                     | false   | V0.0.7  |
| debounce-time       | 防抖时间                                                    | ^[number]                                                                      | 200     | V0.0.7  |
| loading-ball        | 是否显示加载中小球弹跳                                      | ^[boolean]                                                                     | false   | V1.0.0  |
| winmonitor ^(1.0.2) | 是否开启按钮点击上报日志                                    | ^[boolean]                                                                     | -       | V1.0.2  |

### Slots

| 插槽名  | 说明             |
| ------- | ---------------- |
| default | 自定义默认内容   |
| loading | 自定义加载中组件 |
| icon    | 自定义图标组件   |

### Exposes

| 属性名         | 说明                       | 类型                                                                                                           |
| -------------- | -------------------------- | -------------------------------------------------------------------------------------------------------------- |
| ref            | 按钮 html 元素             | ^[object]`Ref<HTMLButtonElement>`                                                                              |
| size           | 按钮尺寸                   | ^[object]`ComputedRef<'' \| 'small' \| 'default' \| 'large'>`                                                  |
| type           | 按钮类型                   | ^[object]`ComputedRef<'' \| 'default' \| 'primary' \| 'success' \| 'warning' \| 'info' \| 'danger' \| 'text'>` |
| disabled       | 按钮已禁用                 | ^[object]`ComputedRef<boolean>`                                                                                |
| shouldAddSpace | 是否在两个字符之间插入空格 | ^[object]`ComputedRef<boolean>`                                                                                |

## ButtonGroup API

### Attributes

| 参数       | 说明                         | 类型                                                               | 默认值 | Version |
| ---------- | ---------------------------- | ------------------------------------------------------------------ | ------ | ------- |
| size       | 用于控制该按钮组内按钮的大小 | ^[enum]`'large' \| 'default' \| 'mini' \| 'small'`                 | —      |
| type       | 用于控制该按钮组内按钮的类型 | ^[enum]`'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | —      |
| smart      | 是否开启智能按钮组           | ^[boolean]                                                         | false  | V0.0.8  |
| discrete   | 是否离散按钮组               | ^[boolean]                                                         | false  | V0.0.8  |
| position   | 按钮组位置                   | ^[enum]`'left' \| 'right'`                                         | left   | V0.0.8  |
| smart-link | 是否开启智能链接按钮组       | ^[boolean]                                                         | false  | V1.0.0  |
| smart-type | 智能按钮组类型               | ^[enum]`'primary' \| 'success' \| 'warning' \| 'danger' \| 'info'` | —      | V1.0.0  |

### Slots

| 插槽名  | 说明             | 子标签 |
| ------- | ---------------- | ------ |
| default | 自定义按钮组内容 | Button |

---

