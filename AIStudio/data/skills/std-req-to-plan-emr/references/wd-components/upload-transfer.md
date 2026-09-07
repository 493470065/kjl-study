## ColorPicker 颜色选择器

用于颜色选择，支持多种格式。

### 示例

:::demo 使用 v-model 与 Vue 实例中的一个变量进行双向绑定，绑定的变量需要是字符串类型。

```vue
<template>
  <div class="demo-color-block">
    <span class="demonstration">With default value</span>
    <w-color-picker v-model="color1" />
  </div>
  <div class="demo-color-block">
    <span class="demonstration">With no default value</span>
    <w-color-picker v-model="color2" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const color1 = ref('#2d5afa')
const color2 = ref()
</script>

<style>
.demo-color-block {
  display: flex;
  align-items: center;
  margin-bottom: 16px;
}
.demo-color-block .demonstration {
  margin-right: 16px;
}
</style>
```

:::

:::demo ColorPicker 支持普通颜色，也支持带 Alpha 通道的颜色，通过`show-alpha`属性即可控制是否支持透明度的选择。 要启用 Alpha 选择，只需添加 `show-alpha` 属性。

```vue
<template>
  <w-color-picker v-model="color" show-alpha />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const color = ref('rgba(19, 206, 102, 0.8)')
</script>
```

:::

:::demo ColorPicker 支持预定义颜色

```vue
<template>
  <w-color-picker v-model="color" show-alpha :predefine="predefineColors" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const color = ref('rgba(255, 69, 0, 0.68)')
const predefineColors = ref([
  '#ff4500',
  '#ff8c00',
  '#ffd700',
  '#90ee90',
  '#00ced1',
  '#1e90ff',
  '#c71585',
  'rgba(255, 69, 0, 0.68)',
  'rgb(255, 120, 0)',
  'hsv(51, 100, 98)',
  'hsva(120, 40, 94, 0.5)',
  'hsl(181, 100%, 37%)',
  'hsla(209, 100%, 56%, 0.73)',
  '#c7158577',
])
</script>
```

:::

:::demo

```vue
<template>
  <div class="demo-color-sizes">
    <w-color-picker v-model="color" size="large" />
    <w-color-picker v-model="color" />
    <w-color-picker v-model="color" size="small" />
    <w-color-picker v-model="color" size="mini" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const color = ref('2d5afa')
</script>

<style>
.demo-color-sizes .w3-color-picker:not(:last-child) {
  margin-right: 16px;
}
</style>
```

:::

### API 文档

### Attributes

| 属性名                      | 说明                                    | 类型                                                                                                             | 默认值 |
| --------------------------- | --------------------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------ |
| model-value / v-model       | 选中项绑定值                            | ^[string]                                                                                                        | —      |
| disabled                    | 是否禁用                                | ^[boolean]                                                                                                       | false  |
| size                        | 尺寸                                    | ^[enum]`'large' \| 'default' \| 'mini' \| 'small'`                                                               | —      |
| show-alpha                  | 是否支持透明度选择                      | ^[boolean]                                                                                                       | false  |
| color-format                | 写入 v-model 的颜色的格式               | ^[enum]`'hsl' \| 'hsv' \| 'hex' \| 'rgb' \| 'hex' (when show-alpha is false) \| 'rgb' (when show-alpha is true)` | —      |
| popper-class                | ColorPicker 下拉框的类名                | ^[string]                                                                                                        | —      |
| predefine                   | 预定义颜色                              | ^[object]`string[]`                                                                                              | —      |
| validate-event              | 输入时是否触发表单的校验                | ^[boolean]                                                                                                       | true   |
| tabindex                    | ColorPicker 的 tabindex                 | ^[string] / ^[number]                                                                                            | 0      |
| aria-label ^(a11y)          | ColorPicker 的 aria-label               | ^[string]                                                                                                        | —      |
| id                          | ColorPicker 的 id                       | ^[string]                                                                                                        | —      |
| teleported                  | 是否将 popover 的下拉列表渲染至 body 下 | ^[boolean]                                                                                                       | true   |
| label ^(a11y) ^(deprecated) | ColorPicker 的 aria-label               | ^[string]                                                                                                        | —      |

### Events

| 事件名        | 说明                               | 类型                                     |
| ------------- | ---------------------------------- | ---------------------------------------- |
| change        | 当绑定值变化时触发                 | ^[Function]`(value: string) => void`     |
| active-change | 面板中当前显示的颜色发生改变时触发 | ^[Function]`(value: string) => void`     |
| focus         | 当获得焦点时触发                   | ^[Function]`(event: FocusEvent) => void` |
| blur          | 当失去焦点时触发                   | ^[Function]`(event: FocusEvent) => void` |

### Exposes

| 名称  | 说明               | 类型                    |
| ----- | ------------------ | ----------------------- |
| color | 当前色彩对象       | ^[object]`Color`        |
| show  | 手动显示颜色选择器 | ^[Function]`() => void` |
| hide  | 手动隐藏颜色选择器 | ^[Function]`() => void` |
| focus | 使 picker 获得焦点 | ^[Function]`() => void` |
| blur  | 使 picker 失去焦点 | ^[Function]`() => void` |

---

## ColorPickerPanel 选择器面板 ^(beta)

color-picker-panel/basic

### 示例

:::demo ColorPickerPanel 需要一个字符串类型的变量才能绑定到 v-model。

```vue
<template>
  <w-color-picker-panel v-model="color" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const color = ref('#2d5afa')
</script>
```

:::

:::demo ColorPickerPanel 支持 Alpha 通道选择。 要激活 Alpha 选择，只需添加 "show-alpha" 属性。

```vue
<template>
  <w-color-picker-panel v-model="color" show-alpha />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const color = ref('rgba(19, 206, 102, 0.8)')
</script>
```

:::

:::demo 颜色选择板支持预定义的颜色选项

```vue
<template>
  <w-color-picker-panel
    v-model="color"
    show-alpha
    :predefine="predefineColors"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const color = ref('rgba(255, 69, 0, 0.68)')
const predefineColors = [
  '#ff4500',
  '#ff8c00',
  '#ffd700',
  '#90ee90',
  '#00ced1',
  '#1e90ff',
  '#c71585',
  'rgba(255, 69, 0, 0.68)',
  'rgb(255, 120, 0)',
  'hsv(51, 100, 98)',
  'hsva(120, 40, 94, 0.5)',
  'hsl(181, 100%, 37%)',
  'hsla(209, 100%, 56%, 0.73)',
  '#c7158577',
]
</script>
```

:::

:::demo

```vue
<template>
  <div ref="containerRef">
    <div class="text-center">No border:</div>
    <w-divider />
    <div class="flex flex-wrap justify-center gap-4">
      <div class="p-5">
        <w-color-picker-panel v-model="value" :border="false" />
      </div>
      <w-divider
        class="h-auto"
        :direction="isNarrow ? 'horizontal' : 'vertical'"
      />
      <w-card>
        <w-color-picker-panel v-model="value" :border="false" />
      </w-card>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { useElementSize } from '@vueuse/core'

const value = ref('#ff6900')
const containerRef = ref<HTMLElement>()

const { width } = useElementSize(containerRef)

const isNarrow = computed(() => width.value < 815)
</script>
```

:::

:::demo

```vue
<template>
  <w-color-picker-panel
    v-model="color"
    disabled
    show-alpha
    :predefine="predefineColors"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const color = ref('#ff6900')
const predefineColors = [
  '#ff4500',
  '#ff8c00',
  '#ffd700',
  '#90ee90',
  '#00ced1',
  '#1e90ff',
  '#c71585',
]
</script>
```

:::

### API 文档

### Attributes

| Name                  | Description               | Type                                                                                                             | Default |
| --------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------- | ------- |
| model-value / v-model | 绑定值                    | ^[string]                                                                                                        | —       |
| border                | 颜色选择器面板是否有边框  | ^[boolean]                                                                                                       | true    |
| disabled              | 是否禁用                  | ^[boolean]                                                                                                       | false   |
| show-alpha            | 是否显示 alpha 滑块       | ^[boolean]                                                                                                       | false   |
| color-format          | 写入 v-model 的颜色的格式 | ^[enum]`'hsl' \| 'hsv' \| 'hex' \| 'rgb' \| 'hex' (when show-alpha is false) \| 'rgb' (when show-alpha is true)` | —       |
| predefine             | 预定义颜色                | ^[object]`string[]`                                                                                              | —       |

### Exposes

| Name     | Description      | Type                     |
| -------- | ---------------- | ------------------------ |
| color    | 当前色彩对象     | ^[object]`Color`         |
| inputRef | 自定义 input ref | ^[object]`InputInstance` |
| update   | 更新子组件       | ^[Function]`() => void`  |

---

## Transfer 穿梭框

transfer/basic

### 示例

:::demo Transfer 的数据通过 `data` 属性传入。 数据需要是一个对象数组，每个对象有以下属性：`key` 为数据的唯一性标识，`label` 为显示文本，`disabled` 表示该项数据是否禁止被操作。 目标列表中的数据项会同步到绑定至 `v-model` 的变量，值为数据项的 `key` 所组成的数组。 当然，如果希望在初始状态时目标列表不为空，可以像本例一样为 `v-model` 绑定的变量赋予一个初始值。

```vue
<template>
  <w-transfer v-model="value" :data="data" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

interface Option {
  key: number
  label: string
  disabled: boolean
}

const generateData = () => {
  const data: Option[] = []
  for (let i = 1; i <= 15; i++) {
    data.push({
      key: i,
      label: `选项 ${i}`,
      disabled: i % 4 === 0,
    })
  }
  return data
}

const data = ref<Option[]>(generateData())
const value = ref([])
</script>
```

:::

:::demo 通过 `show-pagination` 属性设置是否开启分页功能。通过 `panel-width` 属性设置 Transfer 的宽度。通过 `panel-height` 属性设置 Transfer 的高度。

```vue
<template>
  <w-transfer
    v-model="value"
    :data="data"
    filterable
    :panel-width="['400px', '300px']"
    panel-height="200px"
    show-pagination
    :render-checked="renderChecked"
    :page-size="8"
    @left-page-change="onLeftPageChange"
    @right-page-change="onRightPageChange"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

interface Option {
  key: number
  label: string
  disabled: boolean
}

const generateData = () => {
  const data: Option[] = []
  for (let i = 1; i <= 50; i++) {
    data.push({
      key: i,
      label: `选项 ${i}`,
      disabled: i % 4 === 0,
    })
  }
  return data
}

const data = ref<Option[]>(generateData())
const value = ref([])

const onLeftPageChange = (val: number) => {
  console.log('left page change', val)
}

const onRightPageChange = (val: number) => {
  console.log('right page change', val)
}

const renderChecked = (checked: number, total: number, filed: any) => {
  if (filed === 'left') {
    return `<span>${checked}/${total}</span> (左侧)`
  }

  return `<span>${checked}/${total}</span> (右侧)`
}
</script>
```

:::

:::demo 设置 `filterable` 为 `true` 即可开启搜索模式。 默认情况下，若数据项的 `label` 属性包含搜索关键字，则会在搜索结果中显示。 你也可以使用 `filter-method` 定义自己的搜索逻辑。 `filter-method` 接收一个方法，当搜索关键字变化时，会将当前的关键字和每个数据项传给该方法。 若方法返回 `true`，则会在搜索结果中显示对应的数据项。

```vue
<template>
  <w-transfer
    v-model="value"
    filterable
    :filter-method="filterMethod"
    filter-placeholder="输入关键词搜索"
    :data="data"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

interface Option {
  key: number
  label: string
  initial: string
}

const generateData = () => {
  const data: Option[] = []
  const states = [
    'California',
    'Illinois',
    'Maryland',
    'Texas',
    'Florida',
    'Colorado',
    'Connecticut ',
  ]
  const initials = ['CA', 'IL', 'MD', 'TX', 'FL', 'CO', 'CT']
  states.forEach((city, index) => {
    data.push({
      label: city,
      key: index,
      initial: initials[index],
    })
  })
  return data
}

const data = ref<Option[]>(generateData())
const value = ref([])

const filterMethod = (query, item) => {
  return item.initial.toLowerCase().includes(query.toLowerCase())
}
</script>
```

:::

:::demo 可以使用 `titles`、`button-texts`、`render-content` 和 `format` 属性分别对列表标题文案、按钮文案、数据项的渲染函数和列表顶部的勾选状态文案进行自定义。 数据项的渲染还可以使用 `scoped-slot` 进行自定义。 对于列表底部的内容区，提供了两个具名 slot：`left-footer` 和 `right-footer`。 此外，如果希望某些数据项在初始化时就被勾选，可以使用 `left-default-checked` 和 `right-default-checked` 属性。 最后，本例还展示了 `change` 事件的用法。 注意，由于 JSFiddle 不支持 JSX 语法，故该示例无法在 JSFiddle 运行。 但是在实际的项目中，只要正确地配置了相关依赖，就可以正常运行。

```vue
<template>
  <div>
    <p>通过 render-content 自定义数据项</p>
    <w-transfer
      v-model="leftValue"
      style="text-align: left; display: inline-block"
      filterable
      :left-default-checked="[2, 3]"
      :right-default-checked="[1]"
      :render-content="renderFunc"
      :titles="['Source', 'Target']"
      :button-texts="['To left', 'To right']"
      :format="{
        noChecked: '${total}',
        hasChecked: '${checked}/${total}',
      }"
      :data="data"
      @change="handleChange"
    >
      <template #left-footer>
        <w-button class="transfer-footer" size="small">操作</w-button>
      </template>
      <template #right-footer>
        <w-button class="transfer-footer" size="small">操作</w-button>
      </template>
    </w-transfer>
    <p>通过 scoped slot 自定义数据项</p>
    <w-transfer
      v-model="rightValue"
      style="display: inline-block"
      filterable
      :left-default-checked="[2, 3]"
      :right-default-checked="[1]"
      :titles="['Source', 'Target']"
      :button-texts="['To left', 'To right']"
      :format="{
        noChecked: '${total}',
        hasChecked: '${checked}/${total}',
      }"
      :data="data"
      @change="handleChange"
    >
      <template #default="{ option }">
        <span>{{ option.key }} - {{ option.label }}</span>
      </template>
      <template #left-footer>
        <w-button class="transfer-footer" size="small">操作</w-button>
      </template>
      <template #right-footer>
        <w-button class="transfer-footer" size="small">操作</w-button>
      </template>
    </w-transfer>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type {
  TransferDirection,
  TransferKey,
  renderContent,
} from 'win-design-next'
interface Option {
  key: number
  label: string
  disabled: boolean
}

const generateData = (): Option[] => {
  const data: Option[] = []
  for (let i = 1; i <= 15; i++) {
    data.push({
      key: i,
      label: `选项 ${i}`,
      disabled: i % 4 === 0,
    })
  }
  return data
}

const data = ref(generateData())
const rightValue = ref([1])
const leftValue = ref([1])

const renderFunc: renderContent = (h, option) => h('span', null, option.label)

const handleChange = (
  value: TransferKey[],
  direction: TransferDirection,
  movedKeys: TransferKey[]
) => {
  console.log(value, direction, movedKeys)
}
</script>

<style>
.transfer-footer {
  margin-left: 8px;
  padding: 6px 5px;
}
</style>
```

:::

:::demo 使用 `left-empty` 和 `right-empty` 插槽来自定义每个面板的空内容。

```vue
<template>
  <w-transfer v-model="value" :data="data">
    <template #left-empty>
      <w-empty :image-size="60" description="暂无数据" />
    </template>
    <template #right-empty>
      <w-empty :image-size="60" description="暂无数据" />
    </template>
  </w-transfer>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
interface DataItem {
  key: number
  label: string
  disabled: boolean
}
const generateData = (): DataItem[] => {
  const data: DataItem[] = []
  for (let i = 1; i <= 15; i++) {
    data.push({
      key: i,
      label: `选项 ${i}`,
      disabled: i % 4 === 0,
    })
  }
  return data
}

const data = ref(generateData())
const value = ref([])
</script>
```

:::

:::demo 本例中的数据源没有 `key` 和 `label` 字段，在功能上与它们相同的字段名为 `value` 和 `desc`。 因此可以使用`props` 属性为 `key` 和 `label` 设置别名。

```vue
<template>
  <w-transfer
    v-model="value"
    :props="{
      key: 'value',
      label: 'desc',
    }"
    :data="data"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

interface Option {
  value: number
  desc: string
  disabled: boolean
}

const generateData = () => {
  const data: Option[] = []
  for (let i = 1; i <= 15; i++) {
    data.push({
      value: i,
      desc: `选项 ${i}`,
      disabled: i % 4 === 0,
    })
  }
  return data
}

const data = ref<Option[]>(generateData())
const value = ref([])
</script>
```

:::

### API 文档

### Attributes

| 参数                  | 说明                                                                                                                                              | 类型                                                               | 默认值             | Version |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------ | ------------------ | ------- |
| model-value / v-model | 选中项绑定值                                                                                                                                      | ^[object]`Array<string \| number>`                                 | []                 |
| data                  | Transfer 的数据源                                                                                                                                 | ^[object]`Record<string, any>[]`                                   | []                 |
| filterable            | 是否可搜索                                                                                                                                        | ^[boolean]                                                         | false              |
| filter-placeholder    | 搜索框占位符                                                                                                                                      | ^[string]                                                          | —                  |
| filter-method         | 自定义搜索方法                                                                                                                                    | ^[Function]`(query: string, item: Record<string, any>) => boolean` | —                  |
| target-order          | 右侧列表元素的排序策略： 若为 `original`，则保持与数据源相同的顺序； 若为 `push`，则新加入的元素排在最后； 若为 `unshift`，则新加入的元素排在最前 | ^[enum]`'original' \| 'push' \| 'unshift'`                         | original           |
| titles                | 自定义列表标题                                                                                                                                    | ^[object]`[string, string]`                                        | []                 |
| button-texts          | 自定义按钮文案                                                                                                                                    | ^[object]`[string, string]`                                        | []                 |
| render-content        | 自定义数据项渲染函数                                                                                                                              | ^[object]`renderContent`                                           | —                  |
| format                | 列表顶部勾选状态文案                                                                                                                              | ^[object]`TransferFormat`                                          | {}                 |
| props                 | 数据源的字段别名                                                                                                                                  | ^[object]`TransferPropsAlias`                                      | —                  |
| left-default-checked  | 初始状态下左侧列表的已勾选项的 key 数组                                                                                                           | ^[object]`Array<string \| number>`                                 | []                 |
| right-default-checked | 初始状态下右侧列表的已勾选项的 key 数组                                                                                                           | ^[object]`Array<string \| number>`                                 | []                 |
| validate-event        | 是否触发表单验证                                                                                                                                  | ^[boolean]                                                         | true               |
| show-pagination       | 是否显示分页                                                                                                                                      | ^[boolean]                                                         | false              | V0.0.9  |
| page-size             | 每页显示条数                                                                                                                                      | ^[number]                                                          | 10                 | V0.0.9  |
| panel-width           | 自定义面板宽度                                                                                                                                    | ^[array]                                                           | ['200px', '200px'] | V0.0.9  |
| panel-height          | 自定义面板高度                                                                                                                                    | ^[string]                                                          | '278px'            | V0.0.9  |
| render-checked        | 左、右列表顶部的勾选状态文案渲染 Function                                                                                                         | ^[Function]`(checked: number, total: number, filed: any) => void`  | —                  | V0.0.9  |

### Events

| 事件名             | 说明                                    | 类型                                                                                                | Version |
| ------------------ | --------------------------------------- | --------------------------------------------------------------------------------------------------- | ------- |
| change             | 右侧列表元素变化时触发                  | ^[Function]`(value: TransferKey[], direction: TransferDirection, movedKeys: TransferKey[]) => void` |
| left-check-change  | 左侧列表元素被用户选中 / 取消选中时触发 | ^[Function]`(value: TransferKey[], movedKeys?: TransferKey[]) => void`                              |
| right-check-change | 右侧列表元素被用户选中 / 取消选中时触发 | ^[Function]`(value: TransferKey[], movedKeys?: TransferKey[]) => void`                              |
| left-page-change   | 左侧列表分页变化时触发                  | ^[Function]`(value: number) => void`                                                                | V0.0.9  |
| right-page-change  | 右侧列表分页变化时触发                  | ^[Function]`(value: number) => void`                                                                | V0.0.9  |

### Slots

| 插槽名       | 说明                                       |
| ------------ | ------------------------------------------ |
| default      | 自定义数据项的内容， 参数为 `{ option }`   |
| left-footer  | 左侧列表底部的内容                         |
| right-footer | 右侧列表底部的内容                         |
| left-empty   | 左侧面板为空或没有数据符合筛选条件时的内容 |
| right-empty  | 右侧面板为空或没有数据符合筛选条件时的内容 |

### Exposes

| 名称       | 说明                     | 类型                                            |
| ---------- | ------------------------ | ----------------------------------------------- |
| clearQuery | 清空某个面板的搜索关键词 | ^[Function]`(which: TransferDirection) => void` |
| leftPanel  | 左侧面板 ref             | ^[object]`Ref<TransferPanelInstance>`           |
| rightPanel | 右侧面板 ref             | ^[object]`Ref<TransferPanelInstance>`           |

## Transfer Panel API

### Exposes

| 名称  | 描述       | 类型      |
| ----- | ---------- | --------- |
| query | 过滤关键词 | ^[string] |

## Upload 上传

通过点击或者拖拽上传文件。

### 示例

:::demo 通过 `slot` 你可以传入自定义的上传按钮类型和文字提示。 可通过设置 `limit` 和 `on-exceed` 来限制上传文件的个数和定义超出限制时的行为。 可通过设置 `before-remove` 来阻止文件移除操作。

```vue
<template>
  <w-upload
    v-model:file-list="fileList"
    class="upload-demo"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    multiple
    :on-preview="handlePreview"
    :on-remove="handleRemove"
    :before-remove="beforeRemove"
    :limit="3"
    :on-exceed="handleExceed"
  >
    <w-button type="primary">Click to upload</w-button>
    <template #tip>
      <div class="w3-upload__tip">只能上传jpg/png文件，且不超过500kb</div>
    </template>
  </w-upload>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { WMessage, WMessageBox } from 'win-design-next'

import type { UploadProps, UploadUserFile } from 'win-design-next'

const fileList = ref<UploadUserFile[]>([
  {
    name: 'win-design-next-logo.svg',
    url: 'https://cdn.dribbble.com/users/60166/screenshots/11442385/media/04245a13a17845b0bb38203e7bf4eac9.jpg?resize=2560x1080&vertical=center',
  },
  {
    name: 'win-design-next-logo2.svg',
    url: 'https://cdn.dribbble.com/userupload/3490202/file/original-1b4619bf6bcd2b67ba5fbf056cd64d03.jpg?resize=2560x1080',
  },
])

const handleRemove: UploadProps['onRemove'] = (file, uploadFiles) => {
  console.log(file, uploadFiles)
}

const handlePreview: UploadProps['onPreview'] = (uploadFile) => {
  console.log(uploadFile)
}

const handleExceed: UploadProps['onExceed'] = (files, uploadFiles) => {
  WMessage.warning(
    `The limit is 3, you selected ${files.length} files this time, add up to ${
      files.length + uploadFiles.length
    } totally`
  )
}

const beforeRemove: UploadProps['beforeRemove'] = (uploadFile, uploadFiles) => {
  return WMessageBox.confirm(`确定要删除 ${uploadFile.name} ?`).then(
    () => true,
    () => false
  )
}
</script>
```

:::

:::demo 设置 `limit` 和 `on-exceed` 可以在选中时自动替换上一个文件。

```vue
<template>
  <w-upload
    ref="upload"
    class="upload-demo"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    :limit="1"
    :on-exceed="handleExceed"
    :auto-upload="false"
  >
    <template #trigger>
      <w-button type="primary">select file</w-button>
    </template>
    <w-button class="ml-3" type="success" @click="submitUpload">
      upload to server
    </w-button>
    <template #tip>
      <div class="w3-upload__tip text-red">
        limit 1 file, new file will cover the old file
      </div>
    </template>
  </w-upload>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { genFileId } from 'win-design-next'

import type {
  UploadInstance,
  UploadProps,
  UploadRawFile,
} from 'win-design-next'

const upload = ref<UploadInstance>()

const handleExceed: UploadProps['onExceed'] = (files) => {
  upload.value!.clearFiles()
  const file = files[0] as UploadRawFile
  file.uid = genFileId()
  upload.value!.handleStart(file)
}

const submitUpload = () => {
  upload.value!.submit()
}
</script>
```

:::

:::demo

```vue
<template>
  <w-upload
    class="avatar-uploader"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    :show-file-list="false"
    :on-success="handleAvatarSuccess"
    :before-upload="beforeAvatarUpload"
  >
    <img v-if="imageUrl" :src="imageUrl" class="avatar" />
    <w-icon v-else class="avatar-uploader-icon"><Plus /></w-icon>
  </w-upload>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { WMessage } from 'win-design-next'
import { Plus } from '@win-design-next/icons-vue'

import type { UploadProps } from 'win-design-next'

const imageUrl = ref('')

const handleAvatarSuccess: UploadProps['onSuccess'] = (
  response,
  uploadFile
) => {
  imageUrl.value = URL.createObjectURL(uploadFile.raw!)
}

const beforeAvatarUpload: UploadProps['beforeUpload'] = (rawFile) => {
  if (rawFile.type !== 'image/jpeg') {
    WMessage.error('Avatar picture must be JPG format!')
    return false
  } else if (rawFile.size / 1024 / 1024 > 2) {
    WMessage.error('Avatar picture size can not exceed 2MB!')
    return false
  }
  return true
}
</script>

<style scoped>
.avatar-uploader .avatar {
  width: 148px;
  height: 148px;
  display: block;
}
</style>

<style>
.avatar-uploader .w3-upload {
  border: 1px dashed var(--w3-border-color);
  border-radius: 6px;
  cursor: pointer;
  position: relative;
  overflow: hidden;
  transition: var(--w3-transition-duration-fast);
}

.avatar-uploader .w3-upload:hover {
  border-color: var(--w3-color-primary);
}

.w3-icon.avatar-uploader-icon {
  font-size: 28px;
  color: #8c939d;
  width: 148px;
  height: 148px;
  text-align: center;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-upload
    v-model:file-list="fileList"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    list-type="picture-card"
    :on-preview="handlePictureCardPreview"
    :on-remove="handleRemove"
  >
    <w-icon><Plus /></w-icon>
  </w-upload>

  <w-dialog v-model="dialogVisible" :title="dialogImageTitle">
    <img w-full :src="dialogImageUrl" alt="Preview Image" />
  </w-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Plus } from '@win-design-next/icons-vue'

import type { UploadProps, UploadUserFile } from 'win-design-next'

const fileList = ref<UploadUserFile[]>([
  {
    name: 'food.jpeg',
    url: 'https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100',
  },
  {
    name: 'plant-1.png',
    url: '/win-design-next/imgs/plant-1.png',
  },
  {
    name: 'food.jpeg',
    url: 'https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100',
  },
  {
    name: 'plant-2.png',
    url: '/win-design-next/imgs/plant-2.png',
  },
  {
    name: 'food.jpeg',
    url: 'https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100',
  },
  {
    name: 'figure-1.png',
    url: '/win-design-next/imgs/figure-1.png',
  },
  {
    name: 'food.jpeg',
    url: 'https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100',
  },
  {
    name: 'figure-2.png',
    url: '/win-design-next/imgs/figure-2.png',
  },
])

const dialogImageUrl = ref('')
const dialogImageTitle = ref('')
const dialogVisible = ref(false)

const handleRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  console.log(uploadFile, uploadFiles)
}

const handlePictureCardPreview: UploadProps['onPreview'] = (uploadFile) => {
  dialogImageUrl.value = uploadFile.url!
  dialogVisible.value = true
  dialogImageTitle.value = uploadFile.name!
}
</script>
```

:::

:::demo

```vue
<template>
  <w-upload action="#" list-type="picture-card" :auto-upload="false">
    <w-icon><Plus /></w-icon>

    <template #file="{ file }">
      <div>
        <img class="w3-upload-list__item-thumbnail" :src="file.url" alt="" />
        <span class="w3-upload-list__item-actions">
          <span
            class="w3-upload-list__item-preview"
            @click="handlePictureCardPreview(file)"
          >
            <w-icon><zoom-in /></w-icon>
          </span>
          <span
            v-if="!disabled"
            class="w3-upload-list__item-delete"
            @click="handleDownload(file)"
          >
            <w-icon><Download /></w-icon>
          </span>
          <span
            v-if="!disabled"
            class="w3-upload-list__item-delete"
            @click="handleRemove(file)"
          >
            <w-icon><Delete /></w-icon>
          </span>
        </span>
      </div>
    </template>
  </w-upload>

  <w-dialog v-model="dialogVisible" :title="dialogImageUrl">
    <img w-full :src="dialogImageUrl" alt="Preview Image" />
  </w-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Delete, Download, Plus, ZoomIn } from '@win-design-next/icons-vue'

import type { UploadFile } from 'win-design-next'

const dialogImageUrl = ref('')
const dialogVisible = ref(false)
const disabled = ref(false)

const handleRemove = (file: UploadFile) => {
  console.log(file)
}

const handlePictureCardPreview = (file: UploadFile) => {
  dialogImageUrl.value = file.url!
  dialogVisible.value = true
}

const handleDownload = (file: UploadFile) => {
  console.log(file)
}
</script>
```

:::

:::demo

```vue
<template>
  <w-upload
    v-model:file-list="fileList"
    class="upload-demo"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    :on-preview="handlePreview"
    :on-remove="handleRemove"
    list-type="picture"
  >
    <w-button type="primary">Click to upload</w-button>
    <template #tip>
      <div class="w3-upload__tip">只能上传jpg/png文件，且不超过500kb</div>
    </template>
  </w-upload>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { UploadProps, UploadUserFile } from 'win-design-next'

const fileList = ref<UploadUserFile[]>([
  {
    name: 'food.jpeg',
    url: 'https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100',
  },
  {
    name: 'food2.jpeg',
    url: 'https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100',
  },
])

const handleRemove: UploadProps['onRemove'] = (uploadFile, uploadFiles) => {
  console.log(uploadFile, uploadFiles)
}

const handlePreview: UploadProps['onPreview'] = (file) => {
  console.log(file)
}
</script>
```

:::

:::demo

```vue
<template>
  <w-upload
    v-model:file-list="fileList"
    class="upload-demo"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    :on-change="handleChange"
  >
    <w-button type="primary">Click to upload</w-button>
    <template #tip>
      <div class="w3-upload__tip">只能上传jpg/png文件，且不超过500kb</div>
    </template>
  </w-upload>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { UploadProps, UploadUserFile } from 'win-design-next'

const fileList = ref<UploadUserFile[]>([
  {
    name: 'food.jpeg',
    url: 'https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100',
  },
  {
    name: 'food2.jpeg',
    url: 'https://fuss10.elemecdn.com/3/63/4e7f3a15429bfda99bce42a18cdd1jpeg.jpeg?imageMogr2/thumbnail/360x360/format/webp/quality/100',
  },
])

const handleChange: UploadProps['onChange'] = (uploadFile, uploadFiles) => {
  fileList.value = fileList.value.slice(-3)
}
</script>
```

:::

:::demo

```vue
<template>
  <w-upload
    class="upload-demo"
    drag
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    multiple
  >
    <w-icon class="w3-icon--upload"><Upload /></w-icon>
    <div class="w3-upload__text">
      Drop file here or <em>click to upload</em>
    </div>
    <template #tip>
      <div class="w3-upload__tip">只能上传jpg/png文件，且不超过500kb</div>
    </template>
  </w-upload>
</template>

<script setup lang="ts">
import { Upload } from '@win-design-next/icons-vue'
</script>
```

:::

:::demo

```vue
<template>
  <w-upload
    ref="uploadRef"
    class="upload-demo"
    action="https://run.mocky.io/v3/9d059bf9-4660-45f2-925d-ce80ad6c4d15"
    :auto-upload="false"
  >
    <template #trigger>
      <w-button type="primary">select file</w-button>
    </template>

    <w-button class="ml-3" type="success" @click="submitUpload">
      upload to server
    </w-button>

    <template #tip>
      <div class="w3-upload__tip">只能上传jpg/png文件，且不超过500kb</div>
    </template>
  </w-upload>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { UploadInstance } from 'win-design-next'

const uploadRef = ref<UploadInstance>()

const submitUpload = () => {
  uploadRef.value!.submit()
}
</script>
```

:::

### API 文档

### 属性

| 名称                          | 描述                                                                                                                                 | 类型                                                                                                                                       | 默认值                                                                                                                                                                            |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| action ^(required)            | 请求 URL                                                                                                                             | ^[string]                                                                                                                                  | #                                                                                                                                                                                 |
| headers                       | 设置上传的请求头部                                                                                                                   | ^[object]`Headers \| Record<string, any>`                                                                                                  | —                                                                                                                                                                                 |
| method                        | 设置上传请求方法                                                                                                                     | ^[string]                                                                                                                                  | post                                                                                                                                                                              |
| multiple                      | 是否支持多选文件                                                                                                                     | ^[boolean]                                                                                                                                 | false                                                                                                                                                                             |
| data                          | 上传时附带的额外参数 从 v2.3.13 支持 `Awaitable` 数据，和 `Function`                                                                 | ^[object]`Record<string, any> \| Awaitable<Record<string, any>>` / ^[Function]`(rawFile: UploadRawFile) => Awaitable<Record<string, any>>` | {}                                                                                                                                                                                |
| name                          | 上传的文件字段名                                                                                                                     | ^[string]                                                                                                                                  | file                                                                                                                                                                              |
| with-credentials              | 支持发送 cookie 凭证信息                                                                                                             | ^[boolean]                                                                                                                                 | false                                                                                                                                                                             |
| show-file-list                | 是否显示已上传文件列表                                                                                                               | ^[boolean]                                                                                                                                 | true                                                                                                                                                                              |
| drag                          | 是否启用拖拽上传                                                                                                                     | ^[boolean]                                                                                                                                 | false                                                                                                                                                                             |
| accept                        | 接受上传的[文件类型](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#attr-accept)（thumbnail-mode 模式下此参数无效） | ^[string]                                                                                                                                  | ''                                                                                                                                                                                |
| crossorigin                   | 原生属性 [crossorigin](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin)                                     | ^[enum]`'' \| 'anonymous' \| 'use-credentials'`                                                                                            | —                                                                                                                                                                                 |
| on-preview                    | 点击文件列表中已上传的文件时的钩子                                                                                                   | ^[Function]`(uploadFile: UploadFile) => void`                                                                                              | —                                                                                                                                                                                 |
| on-remove                     | 文件列表移除文件时的钩子                                                                                                             | ^[Function]`(uploadFile: UploadFile, uploadFiles: UploadFiles) => void`                                                                    | —                                                                                                                                                                                 |
| on-success                    | 文件上传成功时的钩子                                                                                                                 | ^[Function]`(response: any, uploadFile: UploadFile, uploadFiles: UploadFiles) => void`                                                     | —                                                                                                                                                                                 |
| on-error                      | 文件上传失败时的钩子                                                                                                                 | ^[Function]`(error: Error, uploadFile: UploadFile, uploadFiles: UploadFiles) => void`                                                      | —                                                                                                                                                                                 |
| on-progress                   | 文件上传时的钩子                                                                                                                     | ^[Function]`(evt: UploadProgressEvent, uploadFile: UploadFile, uploadFiles: UploadFiles) => void`                                          | —                                                                                                                                                                                 |
| on-change                     | 文件状态改变时的钩子，添加文件、上传成功和上传失败时都会被调用                                                                       | ^[Function]`(uploadFile: UploadFile, uploadFiles: UploadFiles) => void`                                                                    | —                                                                                                                                                                                 |
| on-exceed                     | 当超出限制时，执行的钩子函数                                                                                                         | ^[Function]`(files: File[], uploadFiles: UploadUserFile[]) => void`                                                                        | —                                                                                                                                                                                 |
| before-upload                 | 上传文件之前的钩子，参数为上传的文件， 若返回`false`或者返回` Promise` 且被 reject，则停止上传。                                     | ^[Function]`(rawFile: UploadRawFile) => Awaitable<void \| undefined \| null \| boolean \| File \| Blob>`                                   | —                                                                                                                                                                                 |
| before-remove                 | 删除文件之前的钩子，参数为上传的文件和文件列表， 若返回 `false `或者返回 `Promise `且被 reject，则停止删除。                         | ^[Function]`(uploadFile: UploadFile, uploadFiles: UploadFiles) => Awaitable<boolean>`                                                      | —                                                                                                                                                                                 |
| file-list / v-model:file-list | 默认上传文件                                                                                                                         | ^[object]`UploadUserFile[]`                                                                                                                | []                                                                                                                                                                                |
| list-type                     | 文件列表的类型                                                                                                                       | ^[enum]`'text' \| 'picture' \| 'picture-card'`                                                                                             | text                                                                                                                                                                              |
| auto-upload                   | 是否自动上传文件                                                                                                                     | ^[boolean]                                                                                                                                 | true                                                                                                                                                                              |
| http-request                  | 覆盖默认的 Xhr 行为，允许自行实现上传文件的请求                                                                                      | ^[Function]`(options: UploadRequestOptions) => XMLHttpRequest \| Promise<unknown>`                                                         | [请参考 ajaxUpload](http://tfs2018-web.winning.com.cn:8080/tfs/WN_HIS/UED/_git/win-design-next?path=%2Fpackages%2Fcomponents%2Fupload%2Fsrc%2Fajax.ts&version=GBmain&_a=contents) |
| disabled                      | 是否禁用上传                                                                                                                         | ^[boolean]                                                                                                                                 | false                                                                                                                                                                             |
| limit                         | 允许上传文件的最大数量                                                                                                               | ^[number]                                                                                                                                  | —                                                                                                                                                                                 |

### 插槽

| 名称    | 描述                 | 类型                                           |
| ------- | -------------------- | ---------------------------------------------- |
| default | 自定义默认内容       | -                                              |
| trigger | 触发文件选择框的内容 | -                                              |
| tip     | 提示说明文字         | -                                              |
| file    | 缩略图模板的内容     | ^[object]`{ file: UploadFile, index: number }` |

### 外部方法

| 名称         | 描述                                                                        | 类型                                                                              |
| ------------ | --------------------------------------------------------------------------- | --------------------------------------------------------------------------------- |
| abort        | 取消上传请求                                                                | ^[Function]`(file: UploadFile) => void`                                           |
| submit       | 手动上传文件列表                                                            | ^[Function]`() => void`                                                           |
| clearFiles   | 清空已上传的文件列表（该方法不支持在 `before-upload` 中调用）               | ^[Function]`(status?: UploadStatus[]) => void`                                    |
| handleStart  | 手动选择文件                                                                | ^[Function]`(rawFile: UploadRawFile) => void`                                     |
| handleRemove | 手动移除文件。 `file` 和`rawFile` 已被合并。 `rawFile` 将在 `v2.2.0` 中移除 | ^[Function]`(file: UploadFile \| UploadRawFile, rawFile?: UploadRawFile) => void` |

