## Cascader 级联选择器

当一个数据集合有清晰的层级结构时，可通过级联选择器逐级查看并选择。

### 示例

:::demo 只需为 Cascader 的`options`属性指定选项数组即可渲染出一个级联选择器。 通过 `props.expandTrigger` 属性控制子节点的展开方式

```vue
<template>
  <w-title>基础用法</w-title>
  <div class="flex">
    <div class="mr-4">
      <p>默认点击触发</p>
      <w-cascader v-model="value" :options="options" @change="handleChange" />
    </div>
    <div class="mr-4">
      <p>鼠标悬浮触发</p>
      <w-cascader
        v-model="value"
        size="large"
        :options="options"
        :props="props"
        @change="handleChange"
      />
    </div>
  </div>
  <w-divider />
  <w-title>禁用：disabled</w-title>
  <w-cascader
    v-model="value"
    size="small"
    disabled
    :options="options"
    @change="handleChange"
  />
  <w-cascader
    v-model="value2"
    class="ml-4"
    size="small"
    disabled
    :options="options"
    @change="handleChange"
  />
  <w-divider />
  <w-title
    >禁用选项：通过在数据源中设置 `disabled` 字段来声明该选项是禁用的。</w-title
  >
  <w-cascader
    v-model="value"
    size="mini"
    :options="options"
    @change="handleChange"
  />
  <w-divider />
  <w-title>可清空：通过 clearable 设置输入框可清空</w-title>
  <w-cascader
    v-model="value"
    clearable
    :options="options"
    @change="handleChange"
  />
  <w-divider />
  <w-title
    >仅显示最后一级：`show-all-levels`定义了是否显示完整的路径， 将其赋值为
    `false` 则仅显示最后一级</w-title
  >
  <w-cascader
    v-model="value"
    :show-all-levels="false"
    clearable
    :options="options"
    @change="handleChange"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref([])
const value2 = ref(['1', '1-1', '1-1-1'])

const props = {
  expandTrigger: 'hover' as const,
}

const handleChange = (value) => {
  console.log(value)
}

const options = [
  {
    value: '1',
    label: '安徽',
    children: [
      {
        value: '1-1',
        label: '安徽医科大学附属医院',
        children: [
          {
            value: '1-1-1',
            label: '肿瘤科',
          },
          {
            value: '1-1-2',
            label: '口腔科',
          },
          {
            value: '1-1-3',
            label: '内科',
          },
          {
            value: '1-1-4',
            label: '外科',
          },
        ],
      },
      {
        value: '2-1',
        label: '省立医院',
        children: [
          {
            value: '2-1-1',
            label: '肿瘤科',
          },
          {
            value: '2-1-2',
            label: '口腔科',
          },
          {
            value: '2-1-3',
            label: '内科',
          },
          {
            value: '2-1-4',
            label: '外科',
          },
        ],
      },
    ],
  },
  {
    value: '2',
    label: '上海',
    disabled: true,
    children: [
      {
        value: '2-1',
        label: '上海大华医院',
        children: [
          {
            value: '2-1-1',
            label: '肿瘤科',
          },
          {
            value: '2-1-2',
            label: '口腔科',
          },
          {
            value: '2-1-3',
            label: '内科',
          },
          {
            value: '2-1-4',
            label: '外科',
          },
        ],
      },
      {
        value: '2-2',
        label: '上海龙华医院',
        children: [
          {
            value: '2-2-1',
            label: '肿瘤科',
          },
          {
            value: '2-2-2',
            label: '口腔科',
          },
          {
            value: '2-2-3',
            label: '内科',
          },
          {
            value: '2-2-4',
            label: '外科',
          },
        ],
      },
    ],
  },
]
</script>
```

:::

:::demo 使用多选时，所有选中的标签将默认显示。 您可以设置 `collapse = true` 将选中的标签折叠。 您可以设置 `max-collapse-tags` 来显示最大 tag 数量，默认 1。 您可以使用 `collapse-tags-tooltip` 属性来启用鼠标悬停折叠文字以显示具体所选值的行为。

```vue
<template>
  <div class="flex flex-wrap">
    <div class="mr-4 mb-4">
      <p>默认</p>
      <w-cascader :options="options" :props="props" clearable />
    </div>
  </div>
  <div class="flex">
    <div class="mr-4 mb-4">
      <p>Collapse tags</p>
      <w-cascader
        size="small"
        tag-type="error"
        :options="options"
        :props="props"
        collapse-tags
        clearable
      />
    </div>
    <div class="mr-4 mb-4">
      <p>Collapse tags tooltip</p>
      <w-cascader
        :options="options"
        size="mini"
        :props="props"
        collapse-tags
        collapse-tags-tooltip
        clearable
      />
    </div>
  </div>
  <div class="flex">
    <div class="mr-4 mb-4">
      <p>最大折叠标签数量</p>
      <w-cascader
        :options="options"
        :props="props"
        collapse-tags
        size="large"
        collapse-tags-tooltip
        :max-collapse-tags="3"
        clearable
      />
    </div>
    <div class="mr-4 mb-4">
      <p>🎉 带「全选」按钮</p>
      <w-cascader
        :options="options"
        :props="props1"
        collapse-tags
        collapse-tags-tooltip
        clearable
      />
    </div>
  </div>
  <div class="flex flex-wrap">
    <div class="mr-4 mb-4">
      <p>禁用</p>
      <w-cascader disabled :options="options" :props="props" clearable />
      <w-cascader
        v-model="value2"
        disabled
        class="ml-4"
        :options="options"
        :props="props"
        clearable
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const props = { multiple: true }

const value2 = ref(['1', '1-1', '1-1-1'])

const props1 = {
  checkAll: true,
  multiple: true,
}

const options = [
  {
    value: '1',
    label: '安徽',
    children: [
      {
        value: '1-1',
        label: '安徽医科大学附属医院',
        children: [
          {
            value: '1-1-1',
            label: '肿瘤科',
          },
          {
            value: '1-1-2',
            label: '口腔科',
          },
          {
            value: '1-1-3',
            label: '内科',
          },
          {
            value: '1-1-4',
            label: '外科',
          },
        ],
      },
      {
        value: '2-1',
        label: '省立医院',
        children: [
          {
            value: '2-1-1',
            label: '肿瘤科',
          },
          {
            value: '2-1-2',
            label: '口腔科',
          },
          {
            value: '2-1-3',
            label: '内科',
          },
          {
            value: '2-1-4',
            label: '外科',
          },
        ],
      },
    ],
  },
  {
    value: '2',
    label: '上海',
    children: [
      {
        value: '2-1',
        label: '上海大华医院',
        children: [
          {
            value: '2-1-1',
            label: '肿瘤科',
          },
          {
            value: '2-1-2',
            label: '口腔科',
          },
          {
            value: '2-1-3',
            label: '内科',
          },
          {
            value: '2-1-4',
            label: '外科',
          },
        ],
      },
      {
        value: '2-2',
        label: '上海龙华医院',
        children: [
          {
            value: '2-2-1',
            label: '肿瘤科',
          },
          {
            value: '2-2-2',
            label: '口腔科',
          },
          {
            value: '2-2-3',
            label: '内科',
          },
          {
            value: '2-2-4',
            label: '外科',
          },
        ],
      },
    ],
  },
]
</script>
```

:::

:::demo 可通过 `props.checkStrictly = true` 来设置父子节点取消选中关联，从而达到选择任意一级选项的目的。

```vue
<template>
  <div class="flex">
    <div class="mr-4 mb-4">
      <p>单选</p>
      <w-cascader :options="options" :props="props1" clearable />
    </div>
    <div class="mr-4 mb-4">
      <p>多选</p>
      <w-cascader :options="options" :props="props2" clearable />
    </div>
  </div>
</template>

<script lang="ts" setup>
const props1 = {
  checkStrictly: true,
}

const props2 = {
  multiple: true,
  checkStrictly: true,
}

const options = [
  {
    value: '1',
    label: '安徽',
    children: [
      {
        value: '1-1',
        label: '安徽医科大学附属医院',
        children: [
          {
            value: '1-1-1',
            label: '肿瘤科',
          },
          {
            value: '1-1-2',
            label: '口腔科',
          },
          {
            value: '1-1-3',
            label: '内科',
          },
          {
            value: '1-1-4',
            label: '外科',
          },
        ],
      },
      {
        value: '2-1',
        label: '省立医院',
        children: [
          {
            value: '2-1-1',
            label: '肿瘤科',
          },
          {
            value: '2-1-2',
            label: '口腔科',
          },
          {
            value: '2-1-3',
            label: '内科',
          },
          {
            value: '2-1-4',
            label: '外科',
          },
        ],
      },
    ],
  },
  {
    value: '2',
    label: '上海',
    children: [
      {
        value: '2-1',
        label: '上海大华医院',
        children: [
          {
            value: '2-1-1',
            label: '肿瘤科',
          },
          {
            value: '2-1-2',
            label: '口腔科',
          },
          {
            value: '2-1-3',
            label: '内科',
          },
          {
            value: '2-1-4',
            label: '外科',
          },
        ],
      },
      {
        value: '2-2',
        label: '上海龙华医院',
        children: [
          {
            value: '2-2-1',
            label: '肿瘤科',
          },
          {
            value: '2-2-2',
            label: '口腔科',
          },
          {
            value: '2-2-3',
            label: '内科',
          },
          {
            value: '2-2-4',
            label: '外科',
          },
        ],
      },
    ],
  },
]
</script>
```

:::

:::demo 通过`lazy`开启动态加载，并通过`lazyload`来设置加载数据源的方法。 `lazyload`方法有两个参数，第一个参数`node`为当前点击的节点，第二个`resolve`为数据加载完成的回调(必须调用)。 为了更准确的显示节点的状态，还可以对节点数据添加是否为叶子节点的标志位 (默认字段为`leaf`，可通过`props.leaf`修改)。 否则，将以有无子节点来判断其是否为叶子节点。

```vue
<template>
  <w-cascader v-model="value" :props="props" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { CascaderProps } from 'win-design-next'

const value = ref([1, 2, 4])

let id = 0
const props: CascaderProps = {
  lazy: true,
  lazyLoad(node, resolve) {
    const { level } = node
    setTimeout(() => {
      const nodes = Array.from({ length: level + 1 }).map((item) => ({
        value: ++id,
        label: `Option - ${id}`,
        leaf: level >= 2,
      }))
      resolve(nodes)
    }, 300)
  },
}
</script>
```

:::

:::demo 通过添加`filterable`来启用过滤。 Cascader 会匹配所有节点的标签和它们的亲节点的标签，是否包含有输入的关键字。 你也可以用`filter-method`自定义搜索逻辑，接受一个函数，第一个参数是节点`node`，第二个参数是搜索关键词`keyword`，通过返回布尔值表示是否命中。

```vue
<template>
  <div class="flex">
    <div class="mr-4 mb-4">
      <p>单选</p>
      <w-cascader placeholder="输入关键词搜索" :options="options" filterable />
    </div>
    <div class="mr-4 mb-4">
      <p>多选</p>
      <w-cascader
        placeholder="输入关键词搜索"
        :options="options"
        :props="props"
        filterable
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
const props = {
  multiple: true,
}

const options = [
  {
    value: '1',
    label: '安徽',
    children: [
      {
        value: '1-1',
        label: '安徽医科大学附属医院',
        children: [
          {
            value: '1-1-1',
            label: '肿瘤科',
          },
          {
            value: '1-1-2',
            label: '口腔科',
          },
          {
            value: '1-1-3',
            label: '内科',
          },
          {
            value: '1-1-4',
            label: '外科',
          },
        ],
      },
      {
        value: '2-1',
        label: '省立医院',
        children: [
          {
            value: '2-1-1',
            label: '肿瘤科',
          },
          {
            value: '2-1-2',
            label: '口腔科',
          },
          {
            value: '2-1-3',
            label: '内科',
          },
          {
            value: '2-1-4',
            label: '外科',
          },
        ],
      },
    ],
  },
  {
    value: '2',
    label: '上海',
    children: [
      {
        value: '2-1',
        label: '上海大华医院',
        children: [
          {
            value: '2-1-1',
            label: '肿瘤科',
          },
          {
            value: '2-1-2',
            label: '口腔科',
          },
          {
            value: '2-1-3',
            label: '内科',
          },
          {
            value: '2-1-4',
            label: '外科',
          },
        ],
      },
      {
        value: '2-2',
        label: '上海龙华医院',
        children: [
          {
            value: '2-2-1',
            label: '肿瘤科',
          },
          {
            value: '2-2-2',
            label: '口腔科',
          },
          {
            value: '2-2-3',
            label: '内科',
          },
          {
            value: '2-2-4',
            label: '外科',
          },
        ],
      },
    ],
  },
]
</script>
```

:::

:::demo 你可以通过 `scoped slot` 自定义节点的内容。 您可以访问 scope 中的 `node` 和 `data` 属性，分别表示当前节点的 Node 对象和当前节点的数据。

```vue
<template>
  <w-cascader :options="options">
    <template #default="{ node, data }">
      <span>{{ data.label }}</span>
      <span v-if="!node.isLeaf"> ({{ data.children.length }}) </span>
    </template>
  </w-cascader>
</template>

<script lang="ts" setup>
const options = [
  {
    value: '1',
    label: '安徽',
    children: [
      {
        value: '1-1',
        label: '安徽医科大学附属医院',
        children: [
          {
            value: '1-1-1',
            label: '肿瘤科',
          },
          {
            value: '1-1-2',
            label: '口腔科',
          },
          {
            value: '1-1-3',
            label: '内科',
          },
          {
            value: '1-1-4',
            label: '外科',
          },
        ],
      },
      {
        value: '2-1',
        label: '省立医院',
        children: [
          {
            value: '2-1-1',
            label: '肿瘤科',
          },
          {
            value: '2-1-2',
            label: '口腔科',
          },
          {
            value: '2-1-3',
            label: '内科',
          },
          {
            value: '2-1-4',
            label: '外科',
          },
        ],
      },
    ],
  },
  {
    value: '2',
    label: '上海',
    children: [
      {
        value: '2-1',
        label: '上海大华医院',
        children: [
          {
            value: '2-1-1',
            label: '肿瘤科',
          },
          {
            value: '2-1-2',
            label: '口腔科',
          },
          {
            value: '2-1-3',
            label: '内科',
          },
          {
            value: '2-1-4',
            label: '外科',
          },
        ],
      },
      {
        value: '2-2',
        label: '上海龙华医院',
        children: [
          {
            value: '2-2-1',
            label: '肿瘤科',
          },
          {
            value: '2-2-2',
            label: '口腔科',
          },
          {
            value: '2-2-3',
            label: '内科',
          },
          {
            value: '2-2-4',
            label: '外科',
          },
        ],
      },
    ],
  },
]
</script>
```

:::

:::demo 和级联选择器一样，通过 `options` 来指定选项，也可通过 `props` 来设置多选、动态加载等功能，具体详情见下方 API 表格。

```vue
<template>
  <w-cascader-panel style="width: fit-content" :options="options" />
</template>

<script lang="ts" setup>
const options = [
  {
    value: '1',
    label: '安徽',
    children: [
      {
        value: '1-1',
        label: '安徽医科大学附属医院',
        children: [
          {
            value: '1-1-1',
            label: '肿瘤科',
          },
          {
            value: '1-1-2',
            label: '口腔科',
          },
          {
            value: '1-1-3',
            label: '内科',
          },
          {
            value: '1-1-4',
            label: '外科',
          },
        ],
      },
      {
        value: '2-1',
        label: '省立医院',
        children: [
          {
            value: '2-1-1',
            label: '肿瘤科',
          },
          {
            value: '2-1-2',
            label: '口腔科',
          },
          {
            value: '2-1-3',
            label: '内科',
          },
          {
            value: '2-1-4',
            label: '外科',
          },
        ],
      },
    ],
  },
  {
    value: '2',
    label: '上海',
    children: [
      {
        value: '2-1',
        label: '上海大华医院',
        children: [
          {
            value: '2-1-1',
            label: '肿瘤科',
          },
          {
            value: '2-1-2',
            label: '口腔科',
          },
          {
            value: '2-1-3',
            label: '内科',
          },
          {
            value: '2-1-4',
            label: '外科',
          },
        ],
      },
      {
        value: '2-2',
        label: '上海龙华医院',
        children: [
          {
            value: '2-2-1',
            label: '肿瘤科',
          },
          {
            value: '2-2-2',
            label: '口腔科',
          },
          {
            value: '2-2-3',
            label: '内科',
          },
          {
            value: '2-2-4',
            label: '外科',
          },
        ],
      },
    ],
  },
]
</script>
```

:::

### API 文档

### Attributes

| 属性名                | 说明                                                                                                                                                           | 类型                                                                                                                                                                        | 默认值       |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| model-value / v-model | 选中项绑定值                                                                                                                                                   | ^[string]/^[number]/^[object]`string[] \| number[] \| any`                                                                                                                  | —            |
| options               | 选项的数据源， `value` 和 `label` 可以通过 `CascaderProps` 自定义.                                                                                             | ^[object]`Record<string, unknown>[]`                                                                                                                                        | —            |
| props                 | 配置选项, 请参阅下面 `CascaderProps` 表。                                                                                                                      | ^[object]`CascaderProps`                                                                                                                                                    | —            |
| size                  | 尺寸                                                                                                                                                           | ^[enum]`'large' \| 'default' \| 'small'`                                                                                                                                    | —            |
| placeholder           | 输入框占位文本                                                                                                                                                 | ^[string]                                                                                                                                                                   | —            |
| disabled              | 是否禁用                                                                                                                                                       | ^[boolean]                                                                                                                                                                  | —            |
| clearable             | 是否支持清空选项                                                                                                                                               | ^[boolean]                                                                                                                                                                  | —            |
| show-all-levels       | 输入框中是否显示选中值的完整路径                                                                                                                               | ^[boolean]                                                                                                                                                                  | true         |
| collapse-tags         | 多选模式下是否折叠 Tag                                                                                                                                         | ^[boolean]                                                                                                                                                                  | —            |
| collapse-tags-tooltip | 当鼠标悬停于折叠标签的文本时，是否显示所有选中的标签。 要使用此属性，`collapse-tags`属性必须设定为 true                                                        | ^[boolean]                                                                                                                                                                  | true         |
| separator             | 用于分隔选项的字符                                                                                                                                             | ^[string]                                                                                                                                                                   | ' / '        |
| filterable            | 该选项是否可以被搜索                                                                                                                                           | ^[boolean]                                                                                                                                                                  | —            |
| filter-method         | 自定义搜索逻辑，第一个参数是`node`，第二个参数是`keyword`，返回的布尔值表示是否保留该选项                                                                      | ^[Function]`(node: CascaderNode, keyword: string) => boolean`                                                                                                               | —            |
| debounce              | 搜索关键词正在输入时的去抖延迟，单位为毫秒                                                                                                                     | ^[number]                                                                                                                                                                   | 300          |
| before-filter         | 过滤函数调用前，所要调用的钩子函数，该函数接收要过滤的值作为参数。 如果该函数的返回值是 `false` 或者是一个被拒绝的 `Promise`，那么接下来的过滤逻辑便不会执行。 | ^[Function]`(value: string) => boolean`                                                                                                                                     | —            |
| popper-class          | 弹出内容的自定义类名                                                                                                                                           | ^[string]                                                                                                                                                                   | ''           |
| teleported            | 弹层是否使用 teleport                                                                                                                                          | ^[boolean]                                                                                                                                                                  | true         |
| tag-type              | 标签类型                                                                                                                                                       | ^[enum]`'success' \| 'info' \| 'warning' \| 'error' \| 'danger'`                                                                                                            | info         |
| tag-effect            | tag effect                                                                                                                                                     | ^[enum]`'light' \| 'dark' \| 'plain'`                                                                                                                                       | light        |
| validate-event        | 输入时是否触发表单的校验                                                                                                                                       | ^[boolean]                                                                                                                                                                  | true         |
| max-collapse-tags     | 需要显示的 Tag 的最大数量 只有当 `collapse-tags` 设置为 true 时才会生效。                                                                                      | ^[number]                                                                                                                                                                   | 1            |
| empty-values          | 组件的空值配置 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations)                                                            | ^[array]                                                                                                                                                                    | —            |
| value-on-clear        | 清空选项的值 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations)                                                              | ^[string] / ^[number] / ^[boolean] / ^[Function]                                                                                                                            | —            |
| persistent            | 当下拉框未被激活并且`persistent`设置为`false`，下拉框容器会被删除。                                                                                            | ^[boolean]                                                                                                                                                                  | true         |
| fallback-placements   | Tooltip 可用的 positions 请查看[popper.js 文档](https://popper.js.org/docs/v2/modifiers/flip/#fallbackplacements)                                              | ^[arrary]`Placement[]`                                                                                                                                                      | —            |
| placement             | 下拉框出现的位置                                                                                                                                               | ^[enum]`'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'` | bottom-start |

### Events

| 事件名         | 说明                                     | 类型                                                        |
| -------------- | ---------------------------------------- | ----------------------------------------------------------- |
| change         | 当绑定值变化时触发的事件                 | ^[Function]`(value: CascaderValue) => void`                 |
| expand-change  | 当展开节点发生变化时触发                 | ^[Function]`(value: CascaderValue) => void`                 |
| blur           | 当失去焦点时触发                         | ^[Function]`(event: FocusEvent) => void`                    |
| focus          | 当获得焦点时触发                         | ^[Function]`(event: FocusEvent) => void`                    |
| clear          | 可清空的单选模式下用户点击清空按钮时触发 | ^[Function]`() => void`                                     |
| visible-change | 下拉框出现/隐藏时触发                    | ^[Function]`(value: boolean) => void`                       |
| remove-tag     | 在多选模式下，移除 Tag 时触发            | ^[Function]`(value: CascaderNode['valueByOption']) => void` |

### Slots

| 插槽名  | 说明                                                     | 作用域                              |
| ------- | -------------------------------------------------------- | ----------------------------------- |
| default | 自定义备选项的节点内容，分别为当前节点的 Node 对象和数据 | ^[object]`{ node: any, data: any }` |
| empty   | 无匹配选项时的内容                                       | —                                   |
| prefix  | 输入框头部内容                                           | —                                   |

### Exposes

| 属性名              | 说明                                                                            | 类型                                                            |
| ------------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| getCheckedNodes     | 获取一个当前选中节点的数组。(仅仅是传单) 是否只返回叶选中的节点，默认是 `false` | ^[Function]`(leafOnly: boolean) => CascaderNode[] \| undefined` |
| cascaderPanelRef    | cascader 面板的 ref                                                             | ^[object]`ComputedRef<any>`                                     |
| togglePopperVisible | 切换 popper 可见状态                                                            | ^[Function]`(visible?: boolean) => void`                        |
| contentRef          | cascader 内容的 ref                                                             | ^[object]`ComputedRef<any>`                                     |
| presentText         | 选中的内容文本                                                                  | ^[object]`ComputedRef<string>`                                  |

## CascaderPanel API

### Attributes

| 属性名                | 说明                                                               | 类型                                                       | 默认值 |
| --------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- | ------ |
| model-value / v-model | 选中项绑定值                                                       | ^[string]/^[number]/^[object]`string[] \| number[] \| any` | —      |
| options               | 选项的数据源， `value` 和 `label` 可以通过 `CascaderProps` 自定义. | ^[object]`Record<string, unknown>[]`                       | —      |
| props                 | 配置选项, 请参阅下面 `CascaderProps` 表。                          | ^[object]`CascaderProps`                                   | —      |

### Events

| 事件名        | 说明                                               | Type                                                |
| ------------- | -------------------------------------------------- | --------------------------------------------------- |
| change        | 当选中节点变化时触发                               | ^[Function]`(value: CascaderValue) => void`         |
| expand-change | 当展开节点发生变化时触发                           | ^[Function]`(value: CascaderNodePathValue) => void` |
| close         | 面板的关闭事件，提供给 Cascader 以便做更好的判断。 | ^[Function]`() => void`                             |

### Slots

| 插槽名  | 说明                                                     | Scope                               |
| ------- | -------------------------------------------------------- | ----------------------------------- |
| default | 下级节点的自定义内容，它们分别是当前节点对象和节点数据。 | ^[object]`{ node: any, data: any }` |
| empty   | 没有数据时面板的内容。                                   | —                                   |

### Exposes

| 属性名            | 说明                                                                            | Type                                                            |
| ----------------- | ------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| getCheckedNodes   | 获取一个当前选中节点的数组。(仅仅是传单) 是否只返回叶选中的节点，默认是 `false` | ^[Function]`(leafOnly: boolean) => CascaderNode[] \| undefined` |
| clearCheckedNodes | 清空选中的节点                                                                  | ^[Function]`() => void`                                         |

## CascaderProps

| 参数           | 说明                                                                                               | 类型                                                | 默认值   | Version |
| -------------- | -------------------------------------------------------------------------------------------------- | --------------------------------------------------- | -------- | ------- |
| expandTrigger  | 次级菜单的展开方式                                                                                 | ^[enum]`'click' \| 'hover'`                         | click    |
| multiple       | 是否多选                                                                                           | ^[boolean]                                          | false    |
| checkStrictly  | 是否严格的遵守父子节点不互相关联                                                                   | ^[boolean]                                          | false    |
| emitPath       | 在选中节点改变时，是否返回由该节点所在的各级菜单的值所组成的数组，若设置 false，则只返回该节点的值 | ^[boolean]                                          | true     |
| lazy           | 是否动态加载子节点，需与 lazyLoad 方法结合使用                                                     | ^[boolean]                                          | false    |
| lazyLoad       | 加载动态数据的方法，仅在 lazy 为 true 时有效                                                       | ^[Function]`(node: Node, resolve: Resolve) => void` | —        |
| value          | 指定选项的值为选项对象的某个属性值                                                                 | ^[string]                                           | value    |
| label          | 指定选项标签为选项对象的某个属性值                                                                 | ^[string]                                           | label    |
| children       | 指定选项的子选项为选项对象的某个属性值                                                             | ^[string]                                           | children |
| disabled       | 指定选项的禁用为选项对象的某个属性值                                                               | ^[string]                                           | disabled |
| leaf           | 指定选项的叶子节点的标志位为选项对象的某个属性值                                                   | ^[string]                                           | leaf     |
| hoverThreshold | hover 时展开菜单的灵敏度阈值                                                                       | ^[number]                                           | 500      |
| checkAll       | 是否显示全选按钮                                                                                   | ^[boolean]                                          | false    | V0.0.9  |

## Select 选择器

当选项过多时，使用下拉菜单展示并选择内容。

### 示例

:::demo 适用广泛的基础单选 `v-model` 的值为当前被选中的 `w-option` 的 value 属性值

```vue
<template>
  <w-title>基础用法</w-title>
  <div class="flex flex-wrap gap-4 items-center">
    <w-select v-model="value" size="large" style="width: 240px">
      <w-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </w-select>
    <w-select v-model="value" placeholder="请选择" style="width: 240px">
      <w-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </w-select>
    <w-select
      v-model="value"
      placeholder="请选择"
      size="small"
      :suffix-icon="CaretBottom"
      style="width: 240px"
    >
      <w-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </w-select>
    <w-select
      v-model="value"
      placeholder="请选择"
      size="mini"
      :suffix-icon="Search"
      :suffix-icon-rotate="false"
      style="width: 240px"
    >
      <w-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </w-select>
  </div>
  <w-divider />
  <w-title
    >禁用状态：为 `w-select` 设置 `disabled`属性，则整个选择器不可用</w-title
  >
  <w-select v-model="value" disabled placeholder="请选择" style="width: 240px">
    <w-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </w-select>
  <w-select
    v-model="value4"
    disabled
    placeholder="请选择"
    style="width: 240px"
    class="ml-4"
  >
    <w-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </w-select>
  <w-divider />
  <w-title
    >禁用选项：在 w-option 中，设定 disabled 值为 true，即可禁用该选项</w-title
  >
  <w-select v-model="value1" placeholder="请选择" style="width: 240px">
    <w-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
      :disabled="item.disabled"
    />
  </w-select>
  <w-divider />
  <w-title>可清空：为 w-select 设置 clearable 属性，则可将选择器清空 </w-title>
  <w-select
    v-model="value2"
    clearable
    placeholder="请选择"
    style="width: 240px"
  >
    <w-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </w-select>
  <w-divider />
  <w-title>🎉 轻量化：为 w-select 设置 plain 属性 </w-title>
  <w-select
    v-model="value2"
    clearable
    plain
    placeholder="请选择"
    style="width: 240px"
  >
    <w-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </w-select>
  <w-select
    v-model="value2"
    class="ml-8"
    clearable
    plain
    disabled
    placeholder="请选择"
    style="width: 240px"
  >
    <w-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </w-select>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { CaretBottom, Search } from '@win-design-next/icons-vue'

const value = ref('')
const value1 = ref('')
const value2 = ref('')
const value4 = ref('option1')

const options = [
  {
    value: 'option1',
    label: '选项1',
  },
  {
    value: 'option2',
    label: '选项2',
  },
  {
    value: 'option3',
    label: '选项3',
  },
  {
    value: 'option4',
    label: '选项4',
  },
  {
    value: 'option5',
    label: '选项5',
    disabled: true,
  },
]
</script>
```

:::

:::demo `w-option` 基础用法. 你可以通过 `options` 属性自定义 `w-option` 的别名。

```vue
<template>
  <w-select
    v-model="value"
    :options="options"
    :props="props"
    placeholder="Select"
    style="width: 240px"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref('')

const props = {
  value: 'id',
  label: 'label',
  options: 'options',
  disabled: 'disabled',
}

const options = [
  {
    id: 'Option1',
    label: 'Option1',
  },
  {
    id: 'Option2',
    label: 'Option2',
    disabled: true,
  },
  {
    id: 'Option3',
    label: 'Option3',
  },
  {
    id: 'Option4',
    label: 'Option4',
    disabled: true,
  },
  {
    id: 'Option5',
    label: 'Option5',
  },
]
</script>
```

:::

:::demo 通过 `status` 属性可以设置选择器的不同状态。

```vue
<template>
  <div class="flex gap-4 items-center mb-8">
    <w-select
      v-model="value"
      style="width: 240px"
      status="success"
      tips="校验通过文本提示"
    >
      <w-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </w-select>
    <w-select
      v-model="value"
      style="width: 240px"
      status="error"
      tips="校验存在严重问题文本提示"
    >
      <w-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </w-select>
    <w-select
      v-model="value"
      style="width: 240px"
      status="danger"
      tips="校验存在严重问题文本提示"
    >
      <w-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </w-select>
    <w-select
      v-model="value"
      style="width: 240px"
      status="warning"
      tips="校验不通过文本提示"
    >
      <w-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </w-select>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref('')

const options = [
  {
    value: 'option1',
    label: '选项1',
  },
  {
    value: 'option2',
    label: '选项2',
  },
  {
    value: 'option3',
    label: '选项3',
  },
  {
    value: 'option4',
    label: '选项4',
  },
  {
    value: 'option5',
    label: '选项5',
    disabled: true,
  },
]
</script>
```

:::

:::demo 为 `w-select` 设置 `multiple` 属性即可启用多选， 此时 `v-model` 的值为当前选中值所组成的数组。 默认情况下选中值会以 Tag 组件的形式展现， 你也可以设置 `collapse-tags` 属性将它们合并为一段文字。 您可以使用 `collapse-tags-tooltip` 属性来启用鼠标悬停折叠文字以显示具体所选值的行为。

```vue
<template>
  <div class="mb-4">
    <w-title>基础用法</w-title>
    <div class="mr-4">
      <w-select
        v-model="value1"
        clearable
        multiple
        placeholder="请选择"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
          :disabled="item.disabled"
        />
      </w-select>
    </div>
  </div>
  <div class="flex">
    <div class="mr-4">
      <p>Large</p>
      <w-select
        v-model="value1"
        tag-type="danger"
        multiple
        size="large"
        placeholder="请选择"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </w-select>
    </div>
    <div class="mr-4">
      <p>Small</p>
      <w-select
        v-model="value1"
        multiple
        size="small"
        placeholder="请选择"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </w-select>
    </div>
    <div class="mr-4">
      <p>mini</p>
      <w-select
        v-model="value1"
        multiple
        size="mini"
        placeholder="请选择"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </w-select>
    </div>
  </div>
  <w-divider />
  <div class="flex">
    <div class="mr-4">
      <p>使用 collapse-tags</p>
      <w-select
        v-model="value2"
        multiple
        collapse-tags
        placeholder="请选择"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </w-select>
    </div>
    <div class="mr-4">
      <p>使用 collapse-tags-tooltip</p>
      <w-select
        v-model="value3"
        size="small"
        multiple
        collapse-tags
        collapse-tags-tooltip
        placeholder="请选择"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </w-select>
    </div>
    <div class="mr-4">
      <p>使用 max-collapse-tags</p>
      <w-select
        v-model="value4"
        multiple
        size="mini"
        collapse-tags
        collapse-tags-tooltip
        :max-collapse-tags="3"
        placeholder="请选择"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </w-select>
    </div>
  </div>
  <w-divider />
  <div class="mb-4">
    <w-title>禁用</w-title>
    <div class="mr-4 flex gap-4">
      <w-select
        v-model="value1"
        clearable
        multiple
        disabled
        placeholder="请选择"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </w-select>
      <w-select
        v-model="value5"
        clearable
        multiple
        disabled
        placeholder="请选择"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </w-select>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref([])
const value2 = ref([])
const value3 = ref([])
const value4 = ref([])
const value5 = ref(['option1', 'option2'])

const options = [
  {
    value: 'option1',
    label: '选项1',
    disabled: true,
  },
  {
    value: 'option2',
    label: '选项2',
  },
  {
    value: 'option3',
    label: '选项3',
    disabled: true,
  },
  {
    value: 'option4',
    label: '选项4',
  },
  {
    value: 'option5',
    label: '选项5',
  },
  {
    value: 'option6',
    label: '选项6',
    disabled: true,
  },
  {
    value: 'option7',
    label: '选项7',
  },
  {
    value: 'option8',
    label: '选项8',
  },
  {
    value: 'option9',
    label: '选项9',
  },
  {
    value: 'option10',
    label: '选项10',
  },
]
</script>
```

:::

:::demo 为`w-select`添加`filterable`属性即可启用搜索功能。 默认情况下，Select 会找出所有 `label` 属性包含输入值的选项。 如果希望使用其他的搜索逻辑，可以通过传入一个 `filter-method` 来实现。 `filter-method` 为一个 `Function`，它会在输入值发生变化时调用，参数为当前输入值。

```vue
<template>
  <div class="flex">
    <div class="mr-4">
      <p>单选</p>
      <w-select
        v-model="value"
        filterable
        placeholder="请选择"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </w-select>
    </div>
    <div class="mr-4">
      <p>多选</p>
      <w-select
        v-model="value1"
        multiple
        filterable
        placeholder="请选择"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </w-select>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref('')
const value1 = ref([])

const options = [
  {
    value: 'Option1',
    label: '选项1',
  },
  {
    value: 'Option2',
    label: '选项2',
  },
  {
    value: 'Option3',
    label: '选项3',
  },
  {
    value: 'Option4',
    label: '选项4',
  },
  {
    value: 'Option5',
    label: '选项5',
  },
]
</script>
```

:::

:::demo 从服务器搜索数据，输入关键字进行查找。为了启用远程搜索，需要将`filterable`和`remote`设置为`true`，同时传入一个`remote-method`。 `remote-method`为一个`Function`，它会在输入值发生变化时调用，参数为当前输入值。 需要注意的是，如果 `w-option` 是通过 `v-for` 指令渲染出来的，此时需要为 `w-option` 添加 `key` 属性， 且其值需具有唯一性，比如这个例子中的 `item.value`。

```vue
<template>
  <div class="flex flex-wrap">
    <div class="m-4">
      <p>default</p>
      <w-select
        v-model="value"
        multiple
        filterable
        remote
        reserve-keyword
        placeholder="输入关键词"
        :remote-method="remoteMethod"
        :loading="loading"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </w-select>
    </div>
    <div class="m-4">
      <p>use remote-show-suffix</p>
      <w-select
        v-model="value"
        multiple
        filterable
        remote
        reserve-keyword
        placeholder="输入关键词"
        remote-show-suffix
        :remote-method="remoteMethod"
        :loading="loading"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </w-select>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'

interface ListItem {
  value: string
  label: string
}

const list = ref<ListItem[]>([])
const options = ref<ListItem[]>([])
const value = ref<string[]>([])
const loading = ref(false)

onMounted(() => {
  list.value = states.map((item) => {
    return { value: `value:${item}`, label: `label:${item}` }
  })
})

const remoteMethod = (query: string) => {
  if (query) {
    loading.value = true
    setTimeout(() => {
      loading.value = false
      options.value = list.value.filter((item) => {
        return item.label.toLowerCase().includes(query.toLowerCase())
      })
    }, 200)
  } else {
    options.value = []
  }
}

const states = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
]
</script>
```

:::

:::demo 通过使用 `allow-create` 属性，用户可以通过输入框创建新项目。 为了使 `allow-create` 正常工作， `filterable` 的值必须为 `true`。 本例还使用了 `default-first-option` 属性， 在该属性为 `true` 的情况下，按下回车就可以选中当前选项列表中的第一个选项，无需使用鼠标或键盘方向键进行定位。

```vue
<template>
  <w-select
    v-model="value"
    multiple
    filterable
    allow-create
    default-first-option
    :reserve-keyword="false"
    placeholder="输入关键词创建"
    style="width: 240px"
  >
    <w-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </w-select>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref<string[]>([])
const options = [
  {
    value: 'HTML',
    label: 'HTML',
  },
  {
    value: 'CSS',
    label: 'CSS',
  },
  {
    value: 'JavaScript',
    label: 'JavaScript',
  },
]
</script>
```

:::

:::demo 通过使用 `value-key` 属性，可以正确处理带有重复 label 的数据。 这样虽然`label` 是重复的，但任可通过 `id` 来确认唯一性。

```vue
<template>
  <div class="m-4">
    <w-select
      v-model="value"
      value-key="id"
      placeholder="请选择"
      style="width: 240px"
    >
      <w-option
        v-for="item in options"
        :key="item.id"
        :label="item.label"
        :value="item"
      />
    </w-select>
    <p>
      selected option's description:
      {{ value ? value.desc : 'no select' }}
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type Option = {
  id: number
  label: string
  desc: string
}
const value = ref<Option>()
const options = ref([
  { id: 1, label: '选项 A', desc: 'Option A - 230506' },
  { id: 2, label: '选项 B', desc: 'Option B - 230506' },
  { id: 3, label: '选项 C', desc: 'Option C - 230506' },
  { id: 4, label: '选项 A', desc: 'Option A - 230507' },
])
</script>
```

:::

:::demo 将自定义的 HTML 模板插入 `w-option` 的 slot 中即可。

```vue
<template>
  <w-select v-model="value" placeholder="请选择" style="width: 240px">
    <w-option
      v-for="item in cities"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    >
      <span style="float: left">{{ item.label }}</span>
      <span
        style="float: right; color: var(--w3-font-color-third); font-size: 13px"
      >
        {{ item.value }}
      </span>
    </w-option>
  </w-select>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref('')
const cities = [
  {
    value: 'Beijing',
    label: 'Beijing',
  },
  {
    value: 'Shanghai',
    label: 'Shanghai',
  },
  {
    value: 'Nanjing',
    label: 'Nanjing',
  },
  {
    value: 'Chengdu',
    label: 'Chengdu',
  },
  {
    value: 'Shenzhen',
    label: 'Shenzhen',
  },
  {
    value: 'Guangzhou',
    label: 'Guangzhou',
  },
]
</script>
```

:::

:::demo 使用 `w-option-group` 对备选项进行分组，它的 `label` 属性为分组名

```vue
<template>
  <w-select v-model="value" placeholder="请选择" style="width: 240px">
    <w-option-group
      v-for="group in options"
      :key="group.label"
      :label="group.label"
    >
      <w-option
        v-for="item in group.options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </w-option-group>
  </w-select>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref('')
const options = [
  {
    label: 'Popular cities',
    options: [
      {
        value: 'Shanghai',
        label: 'Shanghai',
      },
      {
        value: 'Beijing',
        label: 'Beijing',
      },
    ],
  },
  {
    label: 'City name',
    options: [
      {
        value: 'Chengdu',
        label: 'Chengdu',
      },
      {
        value: 'Shenzhen',
        label: 'Shenzhen',
      },
      {
        value: 'Guangzhou',
        label: 'Guangzhou',
      },
      {
        value: 'Dalian',
        label: 'Dalian',
      },
    ],
  },
]
</script>
```

:::

:::demo 将自定义的标签插入 `w-select` 的 slot 中即可。 `collapse-tags`, `collapse-tags-tooltip`, `max-collapse-tags` 在此模式下不生效.

```vue
<template>
  <w-select v-model="value" multiple placeholder="请选择" style="width: 240px">
    <w-option
      v-for="item in colors"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    >
      <div class="flex items-center">
        <w-tag size="mini" :color="item.value" style="margin-right: 8px" />
        <span :style="{ color: item.value }">{{ item.label }}</span>
      </div>
    </w-option>
    <template #tag>
      <w-tag v-for="color in value" :key="color" size="mini" :color="color" />
    </template>
  </w-select>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref<string[]>([])
const colors = [
  {
    value: '#E63415',
    label: 'red',
  },
  {
    value: '#FF6600',
    label: 'orange',
  },
  {
    value: '#FFDE0A',
    label: 'yellow',
  },
  {
    value: '#1EC79D',
    label: 'green',
  },
  {
    value: '#14CCCC',
    label: 'cyan',
  },
  {
    value: '#4167F0',
    label: 'blue',
  },
  {
    value: '#6222C9',
    label: 'purple',
  },
]
colors.forEach((color) => {
  value.value.push(color.value)
})
</script>

<style scoped>
.w3-tag {
  border: none;
  aspect-ratio: 1;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="flex flex-wrap">
    <div class="m-4">
      <p>loading icon1</p>
      <w-select
        v-model="value"
        multiple
        filterable
        remote
        reserve-keyword
        placeholder="输入关键词"
        :remote-method="remoteMethod"
        :loading="loading"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
        <template #loading>
          <svg class="circular" viewBox="0 0 50 50">
            <circle class="path" cx="25" cy="25" r="20" fill="none" />
          </svg>
        </template>
      </w-select>
    </div>
    <div class="m-4">
      <p>loading icon2</p>
      <w-select
        v-model="value"
        multiple
        filterable
        remote
        reserve-keyword
        placeholder="输入关键词"
        :remote-method="remoteMethod"
        :loading="loading"
        style="width: 240px"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
        <template #loading>
          <w-icon class="is-loading">
            <svg class="circular" viewBox="0 0 20 20">
              <g
                class="path2 loading-path"
                stroke-width="0"
                style="animation: none; stroke: none"
              >
                <circle r="3.375" class="dot1" rx="0" ry="0" />
                <circle r="3.375" class="dot2" rx="0" ry="0" />
                <circle r="3.375" class="dot4" rx="0" ry="0" />
                <circle r="3.375" class="dot3" rx="0" ry="0" />
              </g>
            </svg>
          </w-icon>
        </template>
      </w-select>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'

interface ListItem {
  value: string
  label: string
}

const list = ref<ListItem[]>([])
const options = ref<ListItem[]>([])
const value = ref<string[]>([])
const loading = ref(false)

onMounted(() => {
  list.value = states.map((item) => {
    return { value: `value:${item}`, label: `label:${item}` }
  })
})

const remoteMethod = (query: string) => {
  if (query) {
    loading.value = true
    setTimeout(() => {
      loading.value = false
      options.value = list.value.filter((item) => {
        return item.label.toLowerCase().includes(query.toLowerCase())
      })
    }, 3000)
  } else {
    options.value = []
  }
}

const states = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
]
</script>

<style>
.w3-select-dropdown__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  font-size: 20px;
}

.circular {
  display: inline;
  height: 30px;
  width: 30px;
  animation: loading-rotate 2s linear infinite;
}
.path {
  animation: loading-dash 1.5s ease-in-out infinite;
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-width: 2;
  stroke: var(--w3-color-primary);
  stroke-linecap: round;
}
.loading-path .dot1 {
  transform: translate(3.75px, 3.75px);
  fill: var(--w3-color-primary);
  animation: custom-spin-move 1s infinite linear alternate;
  opacity: 0.3;
}
.loading-path .dot2 {
  transform: translate(calc(100% - 3.75px), 3.75px);
  fill: var(--w3-color-primary);
  animation: custom-spin-move 1s infinite linear alternate;
  opacity: 0.3;
  animation-delay: 0.4s;
}
.loading-path .dot3 {
  transform: translate(3.75px, calc(100% - 3.75px));
  fill: var(--w3-color-primary);
  animation: custom-spin-move 1s infinite linear alternate;
  opacity: 0.3;
  animation-delay: 1.2s;
}
.loading-path .dot4 {
  transform: translate(calc(100% - 3.75px), calc(100% - 3.75px));
  fill: var(--w3-color-primary);
  animation: custom-spin-move 1s infinite linear alternate;
  opacity: 0.3;
  animation-delay: 0.8s;
}
@keyframes loading-rotate {
  to {
    transform: rotate(360deg);
  }
}
@keyframes loading-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -40px;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -120px;
  }
}
@keyframes custom-spin-move {
  to {
    opacity: 1;
  }
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="flex flex-wrap gap-4 items-center">
    <w-select
      v-model="value1"
      placeholder="请选择"
      style="width: 240px"
      clearable
    >
      <template #label="{ label, value }">
        <span>{{ label }}: </span>
        <span style="font-weight: bold">{{ value }}</span>
      </template>
      <w-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </w-select>

    <w-select
      v-model="value2"
      placeholder="请选择"
      style="width: 240px"
      clearable
      multiple
    >
      <template #label="{ label, value }">
        <span>{{ label }}: </span>
        <span style="font-weight: bold">{{ value }}</span>
      </template>
      <w-option
        v-for="item in options"
        :key="item.value"
        :label="item.label"
        :value="item.value"
      />
    </w-select>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref<string>('Option1')
const value2 = ref<string[]>(['Option1'])
const options = [
  {
    value: 'Option1',
    label: '选项1',
  },
  {
    value: 'Option2',
    label: '选项2',
  },
  {
    value: 'Option3',
    label: '选项3',
  },
  {
    value: 'Option4',
    label: '选项4',
  },
  {
    value: 'Option5',
    label: '选项5',
  },
]
</script>

<style scoped></style>
```

:::

:::demo

```vue
<template>
  <w-select
    v-model="value"
    :empty-values="[null, undefined]"
    :value-on-clear="null"
    clearable
    placeholder="请选择"
    style="width: 240px"
    @clear="handleClear"
  >
    <w-option
      v-for="item in options"
      :key="item.value"
      :label="item.label"
      :value="item.value"
    />
  </w-select>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { WMessage } from 'win-design-next'

const value = ref('')

const options = [
  {
    value: '',
    label: '全部',
  },
  {
    value: 'Option1',
    label: '选项1',
  },
  {
    value: 'Option2',
    label: '选项2',
  },
  {
    value: 'Option3',
    label: '选项3',
  },
  {
    value: 'Option4',
    label: '选项4',
  },
  {
    value: 'Option5',
    label: '选项5',
  },
]

const handleClear = () => {
  WMessage.info(`The clear value is: ${value.value}`)
}
</script>
```

:::

### API 文档

### Attributes

| 参数                     | 说明                                                                                                               | 类型                                                                                                                                                                        | 默认值                                         | Version |
| ------------------------ | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------- |
| model-value / v-model    | 选中项绑定值                                                                                                       | ^[string] / ^[number] / ^[boolean] / ^[object] / ^[array]                                                                                                                   | —                                              |
| multiple                 | 是否多选                                                                                                           | ^[boolean]                                                                                                                                                                  | false                                          |
| disabled                 | 是否禁用                                                                                                           | ^[boolean]                                                                                                                                                                  | false                                          |
| value-key                | 作为 value 唯一标识的键名，绑定值为对象类型时必填                                                                  | ^[string]                                                                                                                                                                   | value                                          |
| size                     | 输入框尺寸                                                                                                         | ^[enum]`'' \| 'large' \| 'default' \| 'small'`                                                                                                                              | —                                              |
| clearable                | 是否可以清空选项                                                                                                   | ^[boolean]                                                                                                                                                                  | false                                          |
| collapse-tags            | 多选时是否将选中值按文字的形式展示                                                                                 | ^[boolean]                                                                                                                                                                  | false                                          |
| collapse-tags-tooltip    | 当鼠标悬停于折叠标签的文本时，是否显示所有选中的标签。 要使用此属性，`collapse-tags`属性必须设定为 true            | ^[boolean]                                                                                                                                                                  | true                                           |
| multiple-limit           | `multiple` 属性设置为 `true` 时，代表多选场景下用户最多可以选择的项目数， 为 0 则不限制                            | ^[number]                                                                                                                                                                   | 0                                              |
| name                     | Select 输入框的原生 name 属性                                                                                      | ^[string]                                                                                                                                                                   | —                                              |
| effect                   | tooltip 主题，内置了 `dark` / `light` 两种                                                                         | ^[enum]`'dark' \| 'light'` / ^[string]                                                                                                                                      | lighter                                        |
| autocomplete             | Select 输入框的原生 autocomplete 属性                                                                              | ^[string]                                                                                                                                                                   | off                                            |
| placeholder              | 占位符，默认为“Select”                                                                                             | ^[string]                                                                                                                                                                   | —                                              |
| filterable               | Select 组件是否可筛选                                                                                              | ^[boolean]                                                                                                                                                                  | false                                          |
| allow-create             | 是否允许用户创建新条目， 只有当 `filterable` 设置为 true 时才会生效。                                              | ^[boolean]                                                                                                                                                                  | false                                          |
| filter-method            | 自定义筛选方法                                                                                                     | ^[Function]`() => void`                                                                                                                                                     | —                                              |
| remote                   | 其中的选项是否从服务器远程加载                                                                                     | ^[boolean]                                                                                                                                                                  | false                                          |
| remote-method            | 自定义远程搜索方法                                                                                                 | ^[Function]`() => void`                                                                                                                                                     | —                                              |
| remote-show-suffix       | 远程搜索方法显示后缀图标                                                                                           | ^[boolean]                                                                                                                                                                  | false                                          |
| loading                  | 是否正在从远程获取数据                                                                                             | ^[boolean]                                                                                                                                                                  | false                                          |
| loading-text             | 从服务器加载数据时显示的文本，默认为“Loading”                                                                      | ^[string]                                                                                                                                                                   | —                                              |
| no-match-text            | 搜索条件无匹配时显示的文字，也可以使用 `empty` 插槽设置，默认是 “No matching data'”                                | ^[string]                                                                                                                                                                   | —                                              |
| no-data-text             | 无选项时显示的文字，也可以使用 `empty` 插槽设置自定义内容，默认是 “暂无数据”                                       | ^[string]                                                                                                                                                                   | —                                              |
| popper-class             | 选择器下拉菜单的自定义类名                                                                                         | ^[string]                                                                                                                                                                   | ''                                             |
| popper-style ^(1.1.1)    | 为 Select 下拉菜单和标签提示设置自定义样式                                                                         | ^[string] / ^[object]                                                                                                                                                       | —                                              |
| reserve-keyword          | 当 `multiple` 和 `filterable`被设置为 true 时，是否在选中一个选项后保留当前的搜索关键词                            | ^[boolean]                                                                                                                                                                  | true                                           |
| default-first-option     | 是否在输入框按下回车时，选择第一个匹配项。 需配合 `filterable` 或 `remote` 使用                                    | ^[boolean]                                                                                                                                                                  | false                                          |
| teleported               | 是否使用 teleport。设置成 `true`则会被追加到 `append-to` 的位置                                                    | ^[boolean]                                                                                                                                                                  | true                                           |
| append-to                | 下拉框挂载到哪个 DOM 元素                                                                                          | ^[string]                                                                                                                                                                   | —                                              |
| persistent               | 当下拉选择器未被激活并且`persistent`设置为`false`，选择器会被删除。                                                | ^[boolean]                                                                                                                                                                  | true                                           |
| automatic-dropdown       | 对于不可搜索的 Select，是否在输入框获得焦点后自动弹出选项菜单                                                      | ^[boolean]                                                                                                                                                                  | false                                          |
| clear-icon               | 自定义清除图标                                                                                                     | ^[string] / ^[object]`Component`                                                                                                                                            | CircleCloseFilled                              |
| fit-input-width          | 下拉框的宽度是否与输入框相同                                                                                       | ^[boolean]                                                                                                                                                                  | false                                          |
| suffix-icon              | 自定义后缀图标组件                                                                                                 | ^[string] / ^[object]`Component`                                                                                                                                            |                                                |
| suffix-icon-rotate       | 自定义后缀图标组件是否旋转                                                                                         | ^[boolean]                                                                                                                                                                  | true                                           |
| tag-type                 | 标签类型                                                                                                           | ^[enum]`'' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'danger'`                                                                                                      | info                                           |
| tag-effect               | 标签效果                                                                                                           | ^[enum]`'' \| 'light' \| 'dark' \| 'plain'`                                                                                                                                 | light                                          |
| validate-event           | 是否触发表单验证                                                                                                   | ^[boolean]                                                                                                                                                                  | true                                           |
| offset                   | 下拉面板偏移量                                                                                                     | ^[number]                                                                                                                                                                   | 12                                             |
| show-arrow               | 下拉菜单的内容是否有箭头                                                                                           | ^[boolean]                                                                                                                                                                  | false                                          |
| placement                | 下拉框出现的位置                                                                                                   | ^[enum]`'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'` | bottom-start                                   |
| fallback-placements      | dropdown 可用的 positions 请查看[popper.js 文档](https://popper.js.org/docs/v2/modifiers/flip/#fallbackplacements) | ^[array]`Placement[]`                                                                                                                                                       | ['bottom-start', 'top-start', 'right', 'left'] |
| max-collapse-tags        | 需要显示的 Tag 的最大数量 只有当 `collapse-tags` 设置为 true 时才会生效。                                          | ^[number]                                                                                                                                                                   | 1                                              |
| popper-options           | [popper.js](https://popper.js.org/docs/v2/) 参数                                                                   | ^[object]refer to [popper.js](https://popper.js.org/docs/v2/) doc                                                                                                           | {}                                             |
| aria-label ^(a11y)       | 等价于原生 input `aria-label` 属性                                                                                 | ^[string]                                                                                                                                                                   | —                                              |
| empty-values             | 组件的空值配置 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations)                | ^[array]                                                                                                                                                                    | —                                              |
| value-on-clear           | 清空选项的值 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations)                  | ^[string] / ^[number] / ^[boolean] / ^[Function]                                                                                                                            | —                                              |
| tabindex                 | input 的 tabindex                                                                                                  | ^[string] / ^[number]                                                                                                                                                       | —                                              |
| plain                    | 朴素的 Select                                                                                                      | ^[boolean]                                                                                                                                                                  | false                                          | V0.0.8  |
| options ^(1.1.1)         | 选项的数据源 `value` and `label` and `disabled` 可以通过 `props`自定义                                             | ^[array]`Array<{[key: string]: any}>`                                                                                                                                       | —                                              |
| [props](#props) ^(1.1.1) | 配置 options                                                                                                       | ^[object]                                                                                                                                                                   | —                                              |
| debounce ^(1.1.1)        | 远程搜索时的防抖延迟（以毫秒为单位）                                                                               | ^[number]                                                                                                                                                                   | 300                                            |

### props

| Attribute | Description                            | Type      | Default  |
| --------- | -------------------------------------- | --------- | -------- |
| value     | 指定选项的值为选项对象的某个属性值     | ^[string] | value    |
| label     | 指定节点标签为节点对象的某个属性值     | ^[string] | label    |
| options   | 指定选项的子选项为选项对象的某个属性值 | ^[string] | options  |
| disabled  | 指定选项的禁用为选项对象的某个属性值   | ^[string] | disabled |

### Events

| 事件名         | 说明                                     | Type                                                                |
| -------------- | ---------------------------------------- | ------------------------------------------------------------------- |
| change         | 选中值发生变化时触发                     | ^[Function]`(value: any) => void`                                   |
| visible-change | 下拉框出现/隐藏时触发                    | ^[Function]`(visible: boolean) => void`                             |
| remove-tag     | 多选模式下移除 tag 时触发                | ^[Function]`(tagValue: any) => void`                                |
| clear          | 可清空的单选模式下用户点击清空按钮时触发 | ^[Function]`() => void`                                             |
| blur           | 当 input 失去焦点时触发                  | ^[Function]`(event: FocusEvent) => void`                            |
| focus          | 当 input 获得焦点时触发                  | ^[Function]`(event: FocusEvent) => void`                            |
| popup-scroll   | 下拉滚动时触发                           | ^[Function]`(data:{scrollTop: number, scrollLeft: number}) => void` |

### Slots

| 插槽名  | 说明                           | 子标签                |
| ------- | ------------------------------ | --------------------- |
| default | option 组件列表                | Option Group / Option |
| header  | 下拉列表顶部的内容             | —                     |
| footer  | 下拉列表底部的内容             | —                     |
| prefix  | Select 组件头部内容            | —                     |
| empty   | 无选项时的列表                 | —                     |
| tag     | select 组件自定义标签内容      | —                     |
| loading | select 组件自定义 loading 内容 | —                     |
| label   | select 组件自定义标签内容      | —                     |

### Exposes

| 插槽名        | 说明                                   | 类型                                       |
| ------------- | -------------------------------------- | ------------------------------------------ |
| focus         | 使选择器的输入框获取焦点               | ^[Function]`() => void`                    |
| blur          | 使选择器的输入框失去焦点，并隐藏下拉框 | ^[Function]`() => void`                    |
| selectedLabel | 获取当前选中的标签                     | ^[object]`ComputedRef<string \| string[]>` |

## Option Group API

### Attributes

| 属性名   | 说明                           | Type       | Default |
| -------- | ------------------------------ | ---------- | ------- |
| label    | 分组的名称                     | ^[string]  | —       |
| disabled | 是否将该分组下所有选项置为禁用 | ^[boolean] | false   |

### Slots

| 属性名  | 说明           | Subtags |
| ------- | -------------- | ------- |
| default | 自定义默认内容 | Option  |

## Option API

### Attributes

| 名称     | 详情                                    | 类型                                           | 默认  |
| -------- | --------------------------------------- | ---------------------------------------------- | ----- |
| value    | 选项的值                                | ^[string] / ^[number] / ^[boolean] / ^[object] | —     |
| label    | 选项的标签，若不设置则默认与`value`相同 | ^[string] / ^[number]                          | —     |
| disabled | 是否禁用该选项                          | ^[boolean]                                     | false |

### Slots

| 名称    | 说明         |
| ------- | ------------ |
| default | 默认插槽内容 |

---

## Virtualized Select 虚拟化选择器

适用广泛的基础选择器

### 示例

:::demo

```vue
<template>
  <div class="flex flex-wrap gap-4 items-center">
    <w-select-v2
      v-model="value"
      :options="options"
      placeholder="请选择"
      size="large"
      style="width: 240px"
    />
    <w-select-v2
      v-model="value"
      :options="options"
      :suffix-icon="CaretBottom"
      placeholder="请选择"
      style="width: 240px"
    />
    <w-select-v2
      v-model="value"
      :suffix-icon="Search"
      :suffix-icon-rotate="false"
      :options="options"
      placeholder="请选择"
      size="small"
      style="width: 240px"
    />
    <w-select-v2
      v-model="value"
      :suffix-icon="Search"
      :suffix-icon-rotate="false"
      :options="options"
      placeholder="请选择"
      size="mini"
      style="width: 240px"
    />
    <w-select-v2
      v-model="value"
      plain
      :options="options"
      placeholder="请选择"
      style="width: 240px"
    />
    <w-select-v2
      v-model="value"
      plain
      disabled
      :options="options"
      placeholder="请选择"
      style="width: 240px"
    />
    <w-select-v2
      v-model="value2"
      disabled
      :options="options"
      placeholder="请选择"
      style="width: 240px"
    />
    <w-select-v2
      v-model="value"
      disabled
      :options="options"
      placeholder="请选择"
      style="width: 240px"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { CaretBottom, Search } from '@win-design-next/icons-vue'

const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

const value = ref()
const value2 = ref('Option 1')
const options = Array.from({ length: 1000 }).map((_, idx) => ({
  value: `Option ${idx + 1}`,
  label: `${initials[idx % 10]}${idx}`,
}))
</script>

<style scoped>
.example-showcase .w3-select-v2 {
  margin-right: 20px;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-select-v2
    v-model="value"
    :options="options"
    placeholder="请选择"
    style="width: 240px"
    multiple
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

const value = ref([])
const options = ref(
  Array.from({ length: 1000 }).map((_, idx) => ({
    value: `Option ${idx + 1}`,
    label: `${initials[idx % 10]}${idx}`,
  }))
)
</script>
```

:::

:::demo

```vue
<template>
  <div class="m-4">
    <p>use collapse-tags</p>
    <w-select-v2
      v-model="value"
      :options="options"
      placeholder="请选择"
      style="width: 240px"
      multiple
      collapse-tags
    />
  </div>
  <div class="m-4">
    <p>use collapse-tags-tooltip</p>
    <w-select-v2
      v-model="value2"
      :options="options"
      placeholder="请选择"
      style="width: 240px"
      multiple
      collapse-tags
      collapse-tags-tooltip
    />
  </div>
  <div class="m-4">
    <p>use max-collapse-tags</p>
    <w-select-v2
      v-model="value3"
      :options="options"
      placeholder="请选择"
      style="width: 240px"
      multiple
      collapse-tags
      collapse-tags-tooltip
      :max-collapse-tags="3"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

const value = ref([])
const value2 = ref([])
const value3 = ref([])
const options = Array.from({ length: 1000 }).map((_, idx) => ({
  value: `Option ${idx + 1}`,
  label: `${initials[idx % 10]}${idx}`,
}))
</script>
```

:::

:::demo

```vue
<template>
  <w-select-v2
    v-model="value"
    filterable
    :options="options"
    placeholder="请选择"
    style="width: 240px"
    multiple
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

const value = ref([])
const options = Array.from({ length: 1000 }).map((_, idx) => ({
  value: `Option${idx + 1}`,
  label: `${initials[idx % 10]}${idx}`,
}))
</script>
```

:::

:::demo

```vue
<template>
  <w-select-v2
    v-model="value"
    filterable
    :options="options"
    placeholder="请选择"
    style="width: 240px; margin-right: 16px; vertical-align: middle"
    multiple
  />
  <w-select-v2
    v-model="value"
    disabled
    filterable
    :options="options"
    placeholder="请选择"
    style="width: 240px; vertical-align: middle"
    multiple
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

const value = ref([])
const options = Array.from({ length: 1000 }).map((_, idx) => ({
  value: `Option${idx + 1}`,
  label: `${initials[idx % 10]}${idx}`,
  disabled: idx % 10 === 0,
}))
</script>
```

:::

:::demo

```vue
<template>
  <w-select-v2
    v-model="value"
    filterable
    :options="options"
    placeholder="请选择"
    style="width: 240px"
    multiple
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

const value = ref([])
const options = Array.from({ length: 10 }).map((_, idx) => {
  const label = idx + 1
  return {
    value: `Group ${label}`,
    label: `Group ${label}`,
    options: Array.from({ length: 10 }).map((_, idx) => ({
      value: `Option ${idx + 1 + 10 * label}`,
      label: `${initials[idx % 10]}${idx + 1 + 10 * label}`,
    })),
  }
})
</script>
```

:::

:::demo

```vue
<template>
  <w-select-v2
    v-model="value1"
    :options="options"
    placeholder="请选择"
    style="width: 240px; margin-right: 16px; vertical-align: middle"
    multiple
    clearable
  />
  <w-select-v2
    v-model="value2"
    :options="options"
    placeholder="请选择"
    style="width: 240px; vertical-align: middle"
    clearable
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

const value1 = ref([])
const value2 = ref()
const options = Array.from({ length: 1000 }).map((_, idx) => ({
  value: `Option ${idx + 1}`,
  label: `${initials[idx % 10]}${idx}`,
}))
</script>
```

:::

:::demo

```vue
<template>
  <w-select-v2
    v-model="value"
    filterable
    :options="options"
    placeholder="请选择"
    style="width: 240px"
    multiple
  >
    <template #default="{ item }">
      <span style="margin-right: 8px">{{ item.label }}</span>
      <span style="color: var(--w3-font-color-third); font-size: 13px">
        {{ item.value }}
      </span>
    </template>
  </w-select-v2>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

const value = ref([])
const options = Array.from({ length: 1000 }).map((_, idx) => ({
  value: `Option ${idx + 1}`,
  label: `${initials[idx % 10]}${idx}`,
}))
</script>
```

:::

:::demo

```vue
<template>
  <div style="flex: auto">
    <div>
      <w-select-v2
        v-model="value1"
        :options="options"
        placeholder="请选择"
        style="width: 240px; margin-right: 16px; vertical-align: middle"
        allow-create
        filterable
        multiple
        clearable
      />
      <w-select-v2
        v-model="value2"
        :options="options"
        placeholder="请选择"
        style="width: 240px; vertical-align: middle"
        allow-create
        filterable
        clearable
      />
    </div>
    <div>
      <p style="margin-top: 20px; margin-bottom: 8px">
        set reserve-keyword false
      </p>
      <w-select-v2
        v-model="value3"
        :options="options"
        placeholder="请选择"
        style="width: 240px; margin-right: 16px; vertical-align: middle"
        allow-create
        filterable
        multiple
        clearable
        :reserve-keyword="false"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

const value1 = ref([])
const value2 = ref()
const value3 = ref([])
const options = Array.from({ length: 1000 }).map((_, idx) => ({
  value: `Option ${idx + 1}`,
  label: `${initials[idx % 10]}${idx}`,
}))
</script>
```

:::

:::demo 从服务器搜索数据，输入关键字进行查找。为了启用远程搜索，需要将`filterable`和`remote`设置为`true`，同时传入一个`remote-method`。 `remote-method`为一个`Function`，它会在输入值发生变化时调用，参数为当前输入值。

```vue
<template>
  <w-select-v2
    v-model="value"
    style="width: 240px"
    multiple
    filterable
    remote
    :remote-method="remoteMethod"
    clearable
    :options="options"
    :loading="loading"
    placeholder="Please enter a keyword"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const states = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
]
const list = states.map((item): ListItem => {
  return { value: `value:${item}`, label: `label:${item}` }
})

interface ListItem {
  value: string
  label: string
}

const value = ref([])
const options = ref<ListItem[]>([])
const loading = ref(false)

const remoteMethod = (query: string) => {
  if (query !== '') {
    loading.value = true
    setTimeout(() => {
      loading.value = false
      options.value = list.filter((item) => {
        return item.label.toLowerCase().includes(query.toLowerCase())
      })
    }, 200)
  } else {
    options.value = []
  }
}
</script>
```

:::

:::demo

```vue
<template>
  <w-select-v2
    v-model="value"
    :options="options"
    placeholder="请选择"
    value-key="name"
    style="width: 240px"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

const value = ref({ name: 'Option 1', test: 'test 0' })
const options = Array.from({ length: 1000 }).map((_, idx) => ({
  value: {
    name: `Option ${idx + 1}`,
    test: `test ${idx % 3}`,
  },
  label: `${initials[idx % 10]}${idx}`,
}))
</script>

<style scoped>
.example-showcase .w3-select-v2 {
  margin-right: 20px;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-select-v2
    v-model="value"
    :options="options"
    :props="props"
    placeholder="请选择"
    style="width: 240px"
    filterable
    multiple
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
const props = {
  label: 'name',
  value: 'id',
}
const value = ref([])
const options = Array.from({ length: 1000 }).map((_, idx) => ({
  id: `Option ${idx + 1}`,
  name: `${initials[idx % 10]}${idx}`,
}))
</script>
```

:::

:::demo 将自定义的标签插入 `w-select` 的 slot 中即可。 `collapse-tags`, `collapse-tags-tooltip`, `max-collapse-tags` 在此模式下不生效.

```vue
<template>
  <w-select-v2
    v-model="value"
    multiple
    placeholder="Select"
    :options="colors"
    style="width: 240px"
  >
    <template #default="{ item }">
      <div class="flex items-center">
        <w-tag :color="item.value" style="margin-right: 8px" size="mini" />
        <span :style="{ color: item.value }">{{ item.label }}</span>
      </div>
    </template>
    <template #tag>
      <w-tag v-for="color in value" :key="color" size="mini" :color="color" />
    </template>
  </w-select-v2>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref<string[]>([])
const colors = [
  {
    value: '#E63415',
    label: 'red',
  },
  {
    value: '#FF6600',
    label: 'orange',
  },
  {
    value: '#FFDE0A',
    label: 'yellow',
  },
  {
    value: '#1EC79D',
    label: 'green',
  },
  {
    value: '#14CCCC',
    label: 'cyan',
  },
  {
    value: '#4167F0',
    label: 'blue',
  },
  {
    value: '#6222C9',
    label: 'purple',
  },
]
colors.forEach((color) => {
  value.value.push(color.value)
})
</script>

<style scoped>
.w3-tag {
  border: none;
  aspect-ratio: 1;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="flex flex-wrap">
    <div class="m-4">
      <p>loading icon1</p>
      <w-select-v2
        v-model="value"
        multiple
        filterable
        remote
        reserve-keyword
        placeholder="Please enter a keyword"
        :remote-method="remoteMethod"
        :loading="loading"
        :options="options"
        style="width: 240px"
      >
        <template #loading>
          <svg class="circular" viewBox="0 0 50 50">
            <circle class="path" cx="25" cy="25" r="20" fill="none" />
          </svg>
        </template>
      </w-select-v2>
    </div>
    <div class="m-4">
      <p>loading icon2</p>
      <w-select-v2
        v-model="value"
        multiple
        filterable
        remote
        reserve-keyword
        placeholder="Please enter a keyword"
        :remote-method="remoteMethod"
        :loading="loading"
        :options="options"
        style="width: 240px"
      >
        <template #loading>
          <w-icon class="is-loading">
            <svg class="circular" viewBox="0 0 20 20">
              <g
                class="path2 loading-path"
                stroke-width="0"
                style="animation: none; stroke: none"
              >
                <circle r="3.375" class="dot1" rx="0" ry="0" />
                <circle r="3.375" class="dot2" rx="0" ry="0" />
                <circle r="3.375" class="dot4" rx="0" ry="0" />
                <circle r="3.375" class="dot3" rx="0" ry="0" />
              </g>
            </svg>
          </w-icon>
        </template>
      </w-select-v2>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'

interface ListItem {
  value: string
  label: string
}

const list = ref<ListItem[]>([])
const options = ref<ListItem[]>([])
const value = ref<string[]>([])
const loading = ref(false)

onMounted(() => {
  list.value = states.map((item) => {
    return { value: `value:${item}`, label: `label:${item}` }
  })
})

const remoteMethod = (query: string) => {
  if (query) {
    loading.value = true
    setTimeout(() => {
      loading.value = false
      options.value = list.value.filter((item) => {
        return item.label.toLowerCase().includes(query.toLowerCase())
      })
    }, 3000)
  } else {
    options.value = []
  }
}

const states = [
  'Alabama',
  'Alaska',
  'Arizona',
  'Arkansas',
  'California',
  'Colorado',
  'Connecticut',
  'Delaware',
  'Florida',
  'Georgia',
  'Hawaii',
  'Idaho',
  'Illinois',
  'Indiana',
  'Iowa',
  'Kansas',
  'Kentucky',
  'Louisiana',
  'Maine',
  'Maryland',
  'Massachusetts',
  'Michigan',
  'Minnesota',
  'Mississippi',
  'Missouri',
  'Montana',
  'Nebraska',
  'Nevada',
  'New Hampshire',
  'New Jersey',
  'New Mexico',
  'New York',
  'North Carolina',
  'North Dakota',
  'Ohio',
  'Oklahoma',
  'Oregon',
  'Pennsylvania',
  'Rhode Island',
  'South Carolina',
  'South Dakota',
  'Tennessee',
  'Texas',
  'Utah',
  'Vermont',
  'Virginia',
  'Washington',
  'West Virginia',
  'Wisconsin',
  'Wyoming',
]
</script>

<style>
.w3-select-dropdown__loading {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100px;
  font-size: 20px;
}

.circular {
  display: inline;
  height: 30px;
  width: 30px;
  animation: loading-rotate 2s linear infinite;
}
.path {
  animation: loading-dash 1.5s ease-in-out infinite;
  stroke-dasharray: 90, 150;
  stroke-dashoffset: 0;
  stroke-width: 2;
  stroke: var(--w3-color-primary);
  stroke-linecap: round;
}
.loading-path .dot1 {
  transform: translate(3.75px, 3.75px);
  fill: var(--w3-color-primary);
  animation: custom-spin-move 1s infinite linear alternate;
  opacity: 0.3;
}
.loading-path .dot2 {
  transform: translate(calc(100% - 3.75px), 3.75px);
  fill: var(--w3-color-primary);
  animation: custom-spin-move 1s infinite linear alternate;
  opacity: 0.3;
  animation-delay: 0.4s;
}
.loading-path .dot3 {
  transform: translate(3.75px, calc(100% - 3.75px));
  fill: var(--w3-color-primary);
  animation: custom-spin-move 1s infinite linear alternate;
  opacity: 0.3;
  animation-delay: 1.2s;
}
.loading-path .dot4 {
  transform: translate(calc(100% - 3.75px), calc(100% - 3.75px));
  fill: var(--w3-color-primary);
  animation: custom-spin-move 1s infinite linear alternate;
  opacity: 0.3;
  animation-delay: 0.8s;
}
@keyframes loading-rotate {
  to {
    transform: rotate(360deg);
  }
}
@keyframes loading-dash {
  0% {
    stroke-dasharray: 1, 200;
    stroke-dashoffset: 0;
  }
  50% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -40px;
  }
  100% {
    stroke-dasharray: 90, 150;
    stroke-dashoffset: -120px;
  }
}
@keyframes custom-spin-move {
  to {
    opacity: 1;
  }
}
</style>
```

:::

:::demo

```vue
<template>
  <w-select-v2
    v-model="value"
    :options="options"
    :empty-values="[null, undefined]"
    :value-on-clear="null"
    clearable
    placeholder="Select"
    style="width: 240px"
    @clear="handleClear"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { WMessage } from 'win-design-next'

const value = ref('')

const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

const options = Array.from({ length: 1000 }).map((_, idx) => ({
  value: `Option ${idx + 1}`,
  label: `${initials[idx % 10]}${idx}`,
}))

options.unshift({
  value: '',
  label: 'All',
})

const handleClear = () => {
  WMessage.info(`The clear value is: ${value.value}`)
}
</script>
```

:::

:::demo

```vue
<template>
  <div class="flex flex-wrap gap-4 items-center">
    <w-select-v2
      v-model="value1"
      :options="options"
      placeholder="Select"
      style="width: 240px"
      clearable
    >
      <template #label="{ label, value }">
        <span>{{ label }}: </span>
        <span style="font-weight: bold">{{ value }}</span>
      </template>
    </w-select-v2>

    <w-select-v2
      v-model="value2"
      :options="options"
      placeholder="Select"
      style="width: 240px"
      clearable
      multiple
    >
      <template #label="{ label, value }">
        <span>{{ label }}: </span>
        <span style="font-weight: bold">{{ value }}</span>
      </template>
    </w-select-v2>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']
const value1 = ref<string>('Option 1')
const value2 = ref<string[]>(['Option 1'])
const options = Array.from({ length: 1000 }).map((_, idx) => ({
  value: `Option ${idx + 1}`,
  label: `${initials[idx % 10]}${idx}`,
}))
</script>

<style scoped></style>
```

:::

:::demo

```vue
<template>
  <div class="flex flex-wrap gap-4 items-center">
    <w-select-v2
      v-model="value"
      :options="options"
      placeholder="请选择"
      style="width: 240px"
      :fit-input-width="false"
    />

    <w-select-v2
      v-model="value"
      :options="options"
      placeholder="请选择"
      style="width: 240px"
      fit-input-width
    />

    <w-select-v2
      v-model="value"
      :options="options"
      placeholder="请选择"
      style="width: 240px"
      :fit-input-width="440"
    >
      <template #default="{ item }">
        <span>{{ item.value + item.label }}</span>
      </template>
    </w-select-v2>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const initials = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j']

const value = ref()
const options = Array.from({ length: 1000 }).map((_, idx) => ({
  value: `Option ${idx + 1}`,
  label: `${initials[idx % 10]}${idx}${'-'.repeat(Math.ceil(idx / 25))}`,
}))
</script>
```

:::

### API 文档

### Attributes

| 参数                  | 说明                                                                                                               | 类型                                                                                                                                                                        | 默认值                                         | Version |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------- |
| model-value / v-model | 选中项绑定值                                                                                                       | ^[string] / ^[number] / ^[boolean] / ^[object] / ^[array]                                                                                                                   | —                                              |
| options               | 选项的数据源， `value` 的 key 和 `label` 可以通过 `props`自定义.                                                   | ^[array]                                                                                                                                                                    | —                                              |
| props                 | 配置选项，具体看下表                                                                                               | ^[object]                                                                                                                                                                   | —                                              |
| multiple              | 是否多选                                                                                                           | ^[boolean]                                                                                                                                                                  | false                                          |
| disabled              | 是否禁用                                                                                                           | ^[boolean]                                                                                                                                                                  | false                                          |
| value-key             | 作为 value 唯一标识的键名，绑定值为对象类型时必填                                                                  | ^[string]                                                                                                                                                                   | value                                          |
| size                  | 组件大小                                                                                                           | ^[enum]`'' \| 'large' \| 'default' \| 'small'`                                                                                                                              | ''                                             |
| clearable             | 是否可以清空选项                                                                                                   | ^[boolean]                                                                                                                                                                  | false                                          |
| clear-icon            | 自定义清除图标                                                                                                     | ^[string] / ^[object]`Component`                                                                                                                                            | CircleCloseFilled                              |
| collapse-tags         | 多选时是否将选中值按文字的形式展示                                                                                 | ^[boolean]                                                                                                                                                                  | false                                          |
| multiple-limit        | 多选时可被选择的最大数目。 当被设置为 0 时，可被选择的数目不设限。                                                 | ^[number]                                                                                                                                                                   | 0                                              |
| name                  | 选择器的原生 name 属性                                                                                             | ^[string]                                                                                                                                                                   | —                                              |
| effect                | tooltip 主题，内置了 `dark` / `light` 两种                                                                         | ^[enum]`'dark' \| 'light'` / ^[string]                                                                                                                                      | lighter                                        |
| autocomplete          | 自动完成选择输入                                                                                                   | ^[string]                                                                                                                                                                   | off                                            |
| placeholder           | 占位文字                                                                                                           | ^[string]                                                                                                                                                                   | Please select                                  |
| filterable            | 是否可筛选                                                                                                         | ^[boolean]                                                                                                                                                                  | false                                          |
| allow-create          | 是否允许创建新条目， 当使用该属性时，`filterable`必须设置为`true`                                                  | ^[boolean]                                                                                                                                                                  | false                                          |
| filter-method         | 自定义筛选方法                                                                                                     | ^[Function]`() => void`                                                                                                                                                     | —                                              |
| loading               | 是否从远程加载数据                                                                                                 | ^[boolean]                                                                                                                                                                  | false                                          |
| loading-text          | 从服务器加载数据时显示的文本，默认为“Loading”                                                                      | ^[string]                                                                                                                                                                   | —                                              |
| reserve-keyword       | 筛选时，是否在选择选项后保留关键字                                                                                 | ^[boolean]                                                                                                                                                                  | true                                           |
| no-match-text         | 搜索条件无匹配时显示的文字，也可以使用 `empty` 插槽设置，默认是 “No matching data'”                                | ^[string]                                                                                                                                                                   | —                                              |
| no-data-text          | 当在没有数据时显示的文字，你同时可以使用 empty 插槽进行设置。                                                      | ^[string]                                                                                                                                                                   | No Data                                        |
| popper-class          | 选择器下拉菜单的自定义类名                                                                                         | ^[string]                                                                                                                                                                   | ''                                             |
| teleported            | 是否使用 teleport。设置成 `true`则会被追加到 `append-to` 的位置                                                    | ^[boolean]                                                                                                                                                                  | true                                           |
| append-to             | 下拉框挂载到哪个 DOM 元素                                                                                          | ^[string]                                                                                                                                                                   | —                                              |
| persistent            | 当下拉选择器未被激活并且`persistent`设置为`false`，选择器会被删除。                                                | ^[boolean]                                                                                                                                                                  | true                                           |
| popper-options        | [popper.js](https://popper.js.org/docs/v2/) parameters                                                             | ^[object]refer to [popper.js](https://popper.js.org/docs/v2/) doc                                                                                                           | {}                                             |
| automatic-dropdown    | 对于不可搜索的 Select，是否在输入框获得焦点后自动弹出选项菜单                                                      | ^[boolean]                                                                                                                                                                  | false                                          |
| fit-input-width       | 无论下拉框的宽度是否与输入框相同，如果值为`number`，则宽度是固定的。                                               | ^[boolean] / ^[number]                                                                                                                                                      | true                                           |
| height                | 下拉菜单的高度，每一个选项为 34px                                                                                  | ^[number]                                                                                                                                                                   | 274                                            |
| item-height           | 下拉项的高度                                                                                                       | ^[number]                                                                                                                                                                   | 34                                             |
| scrollbar-always-on   | 是否总是展示滚动条                                                                                                 | ^[boolean]                                                                                                                                                                  | false                                          |
| remote                | 是否从服务器获取数据                                                                                               | ^[boolean]                                                                                                                                                                  | false                                          |
| remote-method         | 当输入值发生变化时触发的函数。 它的参数就是当前的输入值。 当`filterable`设置为 true 时才会生效                     | ^[Function]`(keyword: string) => void`                                                                                                                                      | —                                              |
| validate-event        | 是否触发表单验证                                                                                                   | ^[boolean]                                                                                                                                                                  | true                                           |
| offset                | 下拉面板偏移量                                                                                                     | ^[number]                                                                                                                                                                   | 12                                             |
| show-arrow            | 下拉菜单的内容是否有箭头                                                                                           | ^[boolean]                                                                                                                                                                  | true                                           |
| placement             | 下拉框出现的位置                                                                                                   | ^[enum]`'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'` | bottom-start                                   |
| fallback-placements   | dropdown 可用的 positions 请查看[popper.js 文档](https://popper.js.org/docs/v2/modifiers/flip/#fallbackplacements) | ^[array]`Placement[]`                                                                                                                                                       | ['bottom-start', 'top-start', 'right', 'left'] |
| collapse-tags-tooltip | 当鼠标悬停于折叠标签的文本时，是否显示所有选中的标签。 只有当 `collapse-tags` 设置为 true 时才会生效。             | ^[boolean]                                                                                                                                                                  | true                                           |
| max-collapse-tags     | 需要显示的 Tag 的最大数量。 只有当 `collapse-tags` 设置为 true 时才会生效。                                        | ^[number]                                                                                                                                                                   | 1                                              |
| tag-type              | 标签类型                                                                                                           | ^[enum]`'' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'danger'`                                                                                                      | info                                           |
| tag-effect            | 标签效果                                                                                                           | ^[enum]`'' \| 'light' \| 'dark' \| 'plain'`                                                                                                                                 | light                                          |
| aria-label ^(a11y)    | 等价于原生 input `aria-label` 属性                                                                                 | ^[string]                                                                                                                                                                   | —                                              |
| empty-values          | 组件的空值配置 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations)                | ^[array]                                                                                                                                                                    | —                                              |
| value-on-clear        | 清空选项的值 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations)                  | ^[string] / ^[number] / ^[boolean] / ^[Function]                                                                                                                            | —                                              |
| tabindex              | input 的 tabindex                                                                                                  | ^[string] / ^[number]                                                                                                                                                       | —                                              |
| plain                 | 朴素的 Select                                                                                                      | ^[boolean]                                                                                                                                                                  | false                                          | V0.0.8  |

### props

| Attribute | 说明                                   | Type      | Default  |
| --------- | -------------------------------------- | --------- | -------- |
| value     | 指定选项的值为选项对象的某个属性值     | ^[string] | value    |
| label     | 指定节点标签为节点对象的某个属性值     | ^[string] | label    |
| options   | 指定选项的子选项为选项对象的某个属性值 | ^[string] | options  |
| disabled  | 指定选项的禁用为选项对象的某个属性值   | ^[string] | disabled |

### 事件

| 名称           | 说明                                                                       | 类型                                     |
| -------------- | -------------------------------------------------------------------------- | ---------------------------------------- |
| change         | 当所选值更改时触发，参数是当前选中的值                                     | ^[Function]`(val: any) => void`          |
| visible-change | 当下拉菜单出现/消失时触发器, 当它出现时, 参数将是 `true`, 否则将是 `false` | ^[Function]`(visible: boolean) => void`  |
| remove-tag     | 当一个标签在多个模式下被移除时触发，参数将被移除标签值                     | ^[Function]`(tagValue: any) => void`     |
| clear          | 可清空的单选模式下用户点击清空按钮时触发                                   | ^[Function]`() => void`                  |
| blur           | 当选择器的输入框失去焦点时触发                                             | ^[Function]`(event: FocusEvent) => void` |
| focus          | 当选择器的输入框获得焦点时触发                                             | ^[Function]`(event: FocusEvent) => void` |

### Slots

| 名称    | 详情                           |
| ------- | ------------------------------ |
| default | 自定义 Option 模板             |
| header  | 下拉列表顶部的内容             |
| footer  | 下拉列表底部的内容             |
| empty   | 自定义当选项为空时的内容       |
| prefix  | 输入框的前缀                   |
| tag     | select 组件自定义标签内容      |
| loading | select 组件自定义 loading 内容 |
| label   | select 组件自定义标签内容      |

### Exposes

| 名称          | 描述                                   | 类型                                       |
| ------------- | -------------------------------------- | ------------------------------------------ |
| focus         | 使选择器的输入框获取焦点               | ^[Function]`() => void`                    |
| blur          | 使选择器的输入框失去焦点，并隐藏下拉框 | ^[Function]`() => void`                    |
| selectedLabel | 获取当前选中的标签                     | ^[object]`ComputedRef<string \| string[]>` |

---

## Table-select 下拉表格

table-select/basic

### 示例

:::demo

```vue
<template>
  <div class="">
    <p>默认用法</p>
    <div class="flex flex-wrap gap-4 items-center">
      <w-table-select
        ref="selectTable"
        v-model="value1"
        clearable
        placeholder="请选择"
        style="width: 240px"
        :options="data"
        :columns="columns"
        :table-max-height="300"
        :props="{
          value: 'value',
          label: 'name',
          disabled: 'disabled',
        }"
        @change="handleChange"
      >
        <template #name="{ row }">
          <span style="color: var(--w3-color-primary)"
            >{{ row.name }} - {{ row.size }}</span
          >
        </template>
      </w-table-select>
      <w-table-select
        v-model="value1"
        style="width: 240px"
        disabled
        size="small"
        clearable
        placeholder="请选择"
        :options="data"
        :columns="columns"
        :table-max-height="300"
        :props="{
          value: 'value',
          label: 'name',
          disabled: 'disabled',
        }"
      >
        <template #name="{ row }">
          <span style="color: var(--w3-color-primary)"
            >{{ row.name }} - {{ row.size }}</span
          >
        </template>
      </w-table-select>
    </div>
  </div>
  <div class="mt-4">
    <p>搜索</p>
    <div class="flex flex-wrap gap-4 items-center">
      <w-table-select
        ref="selectTable"
        v-model="value1"
        clearable
        table-size="small"
        filterable
        placeholder="内置搜索"
        style="width: 240px"
        :options="data"
        :columns="columns"
        :table-max-height="300"
        :props="{
          value: 'value',
          label: 'name',
          disabled: 'disabled',
        }"
      >
        <template #label="{ label, value }">
          <span>{{ label }}: </span>
          <span style="font-weight: bold">{{ value }}</span>
        </template>
        <template #header> 表格高度：28px </template>
        <template #name="{ row }">
          <span style="color: var(--w3-color-primary)"
            >{{ row.name }} - {{ row.size }}</span
          >
        </template>
      </w-table-select>
      <w-table-select
        v-model="value2"
        clearable
        filterable
        placeholder="自定义搜索"
        style="width: 240px"
        :options="data1"
        :columns="columns"
        :filter-method="filterMethod"
        :table-max-height="300"
        :props="{
          value: 'value',
          label: 'name',
          disabled: 'disabled',
        }"
      />
      <w-table-select
        v-model="value3"
        clearable
        filterable
        remote
        :loading="loading"
        reserve-keyword
        placeholder="远程搜索"
        style="width: 240px"
        :options="data2"
        :columns="columns"
        :remote-method="remoteMethod"
        :table-max-height="300"
        :props="{
          value: 'value',
          label: 'name',
          disabled: 'disabled',
        }"
      >
        <template #loading>
          <w-icon class="is-loading">
            <Loading />
          </w-icon>
        </template>
      </w-table-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Loading } from '@win-design-next/icons-vue'

type Row = {
  value: string
  name: string
  size: string
  count: number
  unit: string
  price: string
  total: string
  disabled?: boolean
}

const value1 = ref('1')

const value2 = ref()

const value3 = ref()
const loading = ref(false)

const handleChange = (val: string) => {
  console.log(val)
}

const remoteMethod = (query: string) => {
  if (query) {
    loading.value = true
    setTimeout(() => {
      loading.value = false
      data2.value = data.value.filter((item) => {
        return item.name.toLowerCase().includes(query.toLowerCase())
      })
    }, 600)
  } else {
    data2.value = []
  }
}

const data1 = ref<Row[]>([])
const data2 = ref<Row[]>([])

const data = ref<Row[]>([
  {
    value: '1',
    name: '氯化钠注射液',
    size: '100ml/袋',
    count: 1,
    unit: '袋',
    price: '6.00',
    total: '6.00',
  },
  {
    value: '2',
    name: '葡萄糖注射液',
    size: '250ml/瓶',
    count: 1,
    unit: '瓶',
    price: '12.00',
    total: '12.00',
  },
  {
    value: '3',
    name: '补液盐III',
    size: '10g/袋',
    count: 2,
    unit: '袋',
    price: '3.00',
    total: '6.00',
  },
  {
    value: '4',
    name: '脑心通胶囊',
    size: '0.4g/粒',
    count: 24,
    unit: '粒',
    price: '1.50',
    total: '36.00',
  },
  {
    value: '5',
    name: '维生素C片',
    size: '100mg/片',
    count: 60,
    unit: '片',
    price: '0.30',
    total: '18.00',
  },
  {
    value: '6',
    name: '氨咖黄敏胶囊',
    size: '0.5g/粒',
    count: 12,
    unit: '粒',
    price: '1.20',
    total: '14.40',
  },
  {
    value: '7',
    name: '布洛芬缓释胶囊',
    size: '300mg/粒',
    count: 20,
    unit: '粒',
    price: '5.00',
    total: '100.00',
  },
  {
    value: '8',
    name: '阿莫西林胶囊',
    size: '250mg/粒',
    count: 24,
    unit: '粒',
    price: '3.50',
    total: '84.00',
  },
  {
    value: '9',
    name: '头孢克肟胶囊',
    size: '100mg/粒',
    count: 6,
    unit: '粒',
    price: '8.00',
    total: '48.00',
  },
  {
    value: '10',
    name: '蒙脱石散',
    size: '3g/袋',
    count: 12,
    unit: '袋',
    price: '4.50',
    total: '54.00',
  },
  {
    value: '11',
    name: '维生素B族片',
    size: '复合/片',
    count: 60,
    unit: '片',
    price: '0.40',
    total: '24.00',
  },
  {
    value: '12',
    name: '甲硝唑片',
    size: '200mg/片',
    count: 20,
    unit: '片',
    price: '0.50',
    total: '10.00',
  },
  {
    value: '13',
    name: '人工牛黄甲硝唑胶囊',
    size: '0.3g/粒',
    count: 24,
    unit: '粒',
    price: '1.80',
    total: '43.20',
  },
  {
    value: '14',
    name: '氯雷他定片',
    size: '10mg/片',
    count: 12,
    unit: '片',
    price: '1.20',
    total: '14.40',
  },
  {
    value: '15',
    name: '奥美拉唑肠溶胶囊',
    size: '20mg/粒',
    count: 14,
    unit: '粒',
    price: '2.50',
    total: '35.00',
  },
  {
    value: '16',
    name: '盐酸左氧氟沙星片',
    size: '100mg/片',
    count: 14,
    unit: '片',
    price: '2.80',
    total: '39.20',
  },
  {
    value: '17',
    name: '板蓝根颗粒',
    size: '10g/袋',
    count: 20,
    unit: '袋',
    price: '1.00',
    total: '20.00',
  },
  {
    value: '18',
    name: '感冒灵颗粒',
    size: '10g/袋',
    count: 12,
    unit: '袋',
    price: '1.50',
    total: '18.00',
  },
  {
    value: '19',
    name: '小儿氨酚黄那敏颗粒',
    size: '5g/袋',
    count: 12,
    unit: '袋',
    price: '1.80',
    total: '21.60',
  },
  {
    value: '20',
    name: '藿香正气水',
    size: '10ml/支',
    count: 10,
    unit: '支',
    price: '1.00',
    total: '10.00',
  },
  {
    value: '21',
    name: '蒲地蓝消炎口服液',
    size: '10ml/支',
    count: 6,
    unit: '支',
    price: '3.00',
    total: '18.00',
  },
  {
    value: '22',
    name: '健胃消食片',
    size: '0.5g/片',
    count: 32,
    unit: '片',
    price: '0.50',
    total: '16.00',
  },
  {
    value: '23',
    name: '复方甘草片',
    size: '0.3g/片',
    count: 100,
    unit: '片',
    price: '0.10',
    total: '10.00',
  },
  {
    value: '24',
    name: '氯化钾缓释片',
    size: '0.5g/片',
    count: 20,
    unit: '片',
    price: '0.80',
    total: '16.00',
  },
  {
    value: '25',
    name: '硫酸镁注射液',
    size: '10ml/支',
    count: 1,
    unit: '支',
    price: '4.00',
    total: '4.00',
  },
  {
    value: '26',
    name: '维生素D滴剂',
    size: '400IU/粒',
    count: 30,
    unit: '粒',
    price: '0.60',
    total: '18.00',
  },
  {
    value: '27',
    name: '复方阿司匹林片',
    size: '100mg/片',
    count: 20,
    unit: '片',
    price: '0.90',
    total: '18.00',
  },
  {
    value: '28',
    name: '止咳糖浆',
    size: '100ml/瓶',
    count: 1,
    unit: '瓶',
    price: '8.00',
    total: '8.00',
  },
  {
    value: '29',
    name: '黄连素片',
    size: '100mg/片',
    count: 24,
    unit: '片',
    price: '0.40',
    total: '9.60',
  },
  {
    value: '30',
    name: '清热消炎宁片',
    size: '0.4g/片',
    count: 24,
    unit: '片',
    price: '0.70',
    total: '16.80',
  },
])

const columns = ref([
  {
    prop: 'value',
    label: 'id',
    width: '60',
    fixed: 'left',
    showOverflowTooltip: true,
  },
  {
    prop: 'name',
    label: '药品名称',
    width: '130',
    showOverflowTooltip: true,
  },
  {
    label: '规格',
    prop: 'size',
    width: '130',
  },
  {
    label: '数量',
    prop: 'count',
    sortable: true,
    width: '90',
  },
  {
    label: '单价(元)',
    prop: 'price',
    width: '100',
    align: 'right',
  },
  {
    label: '金额(元)',
    prop: 'total',
    align: 'right',
    fixed: 'right',
  },
])

const filterMethod = (value: string, row: any) => {
  data1.value = data.value.filter((item) => item.name.includes(value))
}
</script>
```

:::

:::demo

```vue
<template>
  <div class="">
    <p>默认用法</p>
    <div class="flex flex-wrap gap-4 items-center">
      <w-table-select
        v-model="value1"
        clearable
        placeholder="请选择"
        multiple
        collapse-tags
        style="width: 240px"
        :options="options"
        :columns="columns"
        :table-max-height="300"
        :props="{
          value: 'value',
          label: 'name',
          disabled: 'disabled',
        }"
      >
        <template #name="{ row }">
          <span style="color: var(--w3-color-primary)"
            >{{ row.name }} - {{ row.size }}</span
          >
        </template>
        <template #footer>
          已选
          <span style="color: var(--w3-color-primary)">{{
            value1.length
          }}</span>
          条
        </template>
      </w-table-select>
      <w-table-select
        v-model="value4"
        clearable
        placeholder="请选择"
        multiple
        collapse-tags
        style="width: 240px"
        :options="options"
        :columns="columns"
        :table-max-height="300"
        :props="{
          value: 'value',
          label: 'name',
          disabled: 'disabled',
        }"
      >
        <template #tag="{ data }">
          <w-tag v-for="item in data" :key="item" size="mini">
            {{ item.currentLabel }} - {{ item.value }}
          </w-tag>
        </template>
        <template #name="{ row }">
          <span style="color: var(--w3-color-primary)"
            >{{ row.name }} - {{ row.size }}</span
          >
        </template>
        <template #footer>
          已选
          <span style="color: var(--w3-color-primary)">{{
            value1.length
          }}</span>
          条
        </template>
      </w-table-select>
      <w-table-select
        v-model="value1"
        style="width: 240px"
        disabled
        size="small"
        clearable
        multiple
        collapse-tags
        placeholder="请选择"
        :options="options"
        :columns="columns"
        :table-max-height="300"
        :props="{
          value: 'value',
          label: 'name',
          disabled: 'disabled',
        }"
      >
        <template #name="{ row }">
          <span style="color: var(--w3-color-primary)"
            >{{ row.name }} - {{ row.size }}</span
          >
        </template>
      </w-table-select>
    </div>
  </div>
  <div class="mt-4">
    <p>搜索</p>
    <div class="flex flex-wrap gap-4 items-center">
      <w-table-select
        v-model="value1"
        clearable
        multiple
        collapse-tags
        filterable
        placeholder="内置搜索"
        style="width: 240px"
        :options="options"
        :columns="columns"
        :table-max-height="300"
        :props="{
          value: 'value',
          label: 'name',
          disabled: 'disabled',
        }"
      >
        <template #label="{ label, value }">
          <span>{{ label }}: </span>
          <span style="font-weight: bold">{{ value }}</span>
        </template>
        <template #name="{ row }">
          <span style="color: var(--w3-color-primary)"
            >{{ row.name }} - {{ row.size }}</span
          >
        </template>
        <template #footer>
          已选
          <span style="color: var(--w3-color-primary)">{{
            value1.length
          }}</span>
          条
        </template>
      </w-table-select>
      <w-table-select
        v-model="value2"
        clearable
        filterable
        placeholder="自定义搜索"
        style="width: 240px"
        :options="data1"
        multiple
        collapse-tags
        :columns="columns"
        :filter-method="filterMethod"
        :table-max-height="300"
        :props="{
          value: 'value',
          label: 'name',
          disabled: 'disabled',
        }"
      >
        <template #footer>
          已选
          <span style="color: var(--w3-color-primary)">{{
            value1.length
          }}</span>
          条
        </template>
      </w-table-select>
      <w-table-select
        v-model="value3"
        clearable
        filterable
        remote
        multiple
        collapse-tags
        :loading="loading"
        reserve-keyword
        placeholder="远程搜索"
        style="width: 240px"
        :options="data2"
        :columns="columns"
        :remote-method="remoteMethod"
        :table-max-height="300"
        :props="{
          value: 'value',
          label: 'name',
          disabled: 'disabled',
        }"
      >
        <template #footer>
          已选
          <span style="color: var(--w3-color-primary)">{{
            value3.length
          }}</span>
          条
        </template>
      </w-table-select>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

type Row = {
  value: string
  name: string
  size: string
  count: string
  unit: string
  price: string
  total: string
  disabled?: boolean
}

const value1 = ref(['1'])

const value2 = ref([])

const value4 = ref([])

const value3 = ref([])
const loading = ref(false)

const remoteMethod = (query: string) => {
  if (query) {
    loading.value = true
    setTimeout(() => {
      loading.value = false
      data2.value = options.value.filter((item) => {
        return item.name.toLowerCase().includes(query.toLowerCase())
      })
    }, 600)
  } else {
    data2.value = []
  }
}

const data1 = ref<Row[]>([])
const data2 = ref<Row[]>([])

const options = ref<Row[]>([
  {
    value: '1',
    name: '炔诺酮片',
    size: '625微克/片',
    count: '10',
    unit: '片',
    price: '10.00',
    total: '100.00',
  },
  {
    value: '2',
    name: '布洛芬缓释胶囊',
    size: '300mg/粒',
    count: '20',
    unit: '粒',
    price: '5.00',
    total: '100.00',
  },
  {
    value: '3',
    name: '阿莫西林胶囊',
    size: '250mg/粒',
    count: '24',
    unit: '粒',
    price: '3.50',
    total: '84.00',
  },
  {
    value: '4',
    name: '维生素C片',
    size: '100mg/片',
    count: '60',
    unit: '片',
    price: '0.30',
    total: '18.00',
  },
  {
    value: '5',
    name: '葡萄糖注射液',
    size: '250ml/瓶',
    count: '1',
    unit: '瓶',
    price: '12.00',
    total: '12.00',
  },
  {
    value: '6',
    name: '氯化钠注射液',
    size: '100ml/袋',
    count: '1',
    unit: '袋',
    price: '6.00',
    total: '6.00',
  },
  {
    value: '7',
    name: '盐酸左氧氟沙星',
    size: '100mg/片',
    count: '14',
    unit: '片',
    price: '2.80',
    total: '39.20',
  },
  {
    value: '8',
    name: '蒙脱石散',
    size: '3g/袋',
    count: '12',
    unit: '袋',
    price: '4.50',
    total: '54.00',
  },
  {
    value: '9',
    name: '头孢克肟胶囊',
    size: '100mg/粒',
    count: '6',
    unit: '粒',
    price: '8.00',
    total: '48.00',
  },
  {
    value: '10',
    name: '氯雷他定片',
    size: '10mg/片',
    count: '12',
    unit: '片',
    price: '1.20',
    total: '14.40',
  },
  {
    value: '11',
    name: '奥美拉唑肠溶胶囊',
    size: '20mg/粒',
    count: '14',
    unit: '粒',
    price: '2.50',
    total: '35.00',
  },
  {
    value: '12',
    name: '甲硝唑片',
    size: '200mg/片',
    count: '20',
    unit: '片',
    price: '0.50',
    total: '10.00',
  },
  {
    value: '13',
    name: '复方甘草片',
    size: '0.3g/片',
    count: '100',
    unit: '片',
    price: '0.10',
    total: '10.00',
  },
  {
    value: '14',
    name: '维生素B族片',
    size: '复合/片',
    count: '60',
    unit: '片',
    price: '0.40',
    total: '24.00',
  },
  {
    value: '15',
    name: '人工牛黄甲硝唑胶囊',
    size: '0.3g/粒',
    count: '24',
    unit: '粒',
    price: '1.80',
    total: '43.20',
  },
])

const columns = ref([
  {
    prop: 'value',
    label: 'id',
    width: '60',
    fixed: 'left',
    showOverflowTooltip: true,
  },
  {
    prop: 'name',
    label: '药品名称',
    width: '130',
    showOverflowTooltip: true,
  },
  {
    label: '规格',
    prop: 'size',
    width: '130',
  },
  {
    label: '数量',
    prop: 'count',
    width: '90',
  },
  {
    label: '单价(元)',
    prop: 'price',
    width: '100',
    align: 'right',
  },
  {
    label: '金额(元)',
    prop: 'total',
    align: 'right',
    fixed: 'right',
  },
])

const filterMethod = (value: string, row: any) => {
  data1.value = options.value.filter((item) => item.name.includes(value))
}
</script>
```

:::

### API 文档

### Attributes

| 参数                  | 说明                                                                                                               | 类型                                                                                                                                                                        | 默认值                                         | Version |
| --------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------- |
| options               | 选项的数据源 `value` and `label` and `disabled` 可以通过 `props`自定义                                             | ^[array]`Array<{[key: string]: any}>`                                                                                                                                       | —                                              |
| columns               | 列配置项                                                                                                           | Array                                                                                                                                                                       | —                                              |
| table-size            | Table 的尺寸                                                                                                       | ^[enum]`'extra-large' \| 'large' \| 'default' \| 'small' \| 'mini'`                                                                                                         | default                                        |
| table-width           | table 宽度                                                                                                         | Number/String                                                                                                                                                               | 500                                            |
| table-max-height      | table 高度                                                                                                         | Number/String                                                                                                                                                               | 300                                            |
| model-value / v-model | 选中项绑定值                                                                                                       | ^[string] / ^[number] / ^[boolean] / ^[object] / ^[array]                                                                                                                   | —                                              |
| multiple              | 是否多选                                                                                                           | ^[boolean]                                                                                                                                                                  | false                                          |
| disabled              | 是否禁用                                                                                                           | ^[boolean]                                                                                                                                                                  | false                                          |
| size                  | 输入框尺寸                                                                                                         | ^[enum]`'' \| 'large' \| 'default' \| 'small'`                                                                                                                              | —                                              |
| clearable             | 是否可以清空选项                                                                                                   | ^[boolean]                                                                                                                                                                  | false                                          |
| collapse-tags         | 多选时是否将选中值按文字的形式展示                                                                                 | ^[boolean]                                                                                                                                                                  | false                                          |
| collapse-tags-tooltip | 当鼠标悬停于折叠标签的文本时，是否显示所有选中的标签。 要使用此属性，`collapse-tags`属性必须设定为 true            | ^[boolean]                                                                                                                                                                  | true                                           |
| multiple-limit        | `multiple` 属性设置为 `true` 时，代表多选场景下用户最多可以选择的项目数， 为 0 则不限制                            | ^[number]                                                                                                                                                                   | 0                                              |
| name                  | Select 输入框的原生 name 属性                                                                                      | ^[string]                                                                                                                                                                   | —                                              |
| effect                | tooltip 主题，内置了 `dark` / `light` 两种                                                                         | ^[enum]`'dark' \| 'light'` / ^[string]                                                                                                                                      | lighter                                        |
| autocomplete          | Select 输入框的原生 autocomplete 属性                                                                              | ^[string]                                                                                                                                                                   | off                                            |
| placeholder           | 占位符，默认为“Select”                                                                                             | ^[string]                                                                                                                                                                   | —                                              |
| filterable            | Select 组件是否可筛选                                                                                              | ^[boolean]                                                                                                                                                                  | false                                          |
| filter-method         | 自定义筛选方法                                                                                                     | ^[Function]`() => void`                                                                                                                                                     | —                                              |
| remote                | 其中的选项是否从服务器远程加载                                                                                     | ^[boolean]                                                                                                                                                                  | false                                          |
| remote-method         | 自定义远程搜索方法                                                                                                 | ^[Function]`() => void`                                                                                                                                                     | —                                              |
| remote-show-suffix    | 远程搜索方法显示后缀图标                                                                                           | ^[boolean]                                                                                                                                                                  | false                                          |
| loading               | 是否正在从远程获取数据                                                                                             | ^[boolean]                                                                                                                                                                  | false                                          |
| loading-text          | 从服务器加载数据时显示的文本，默认为“Loading”                                                                      | ^[string]                                                                                                                                                                   | —                                              |
| no-match-text         | 搜索条件无匹配时显示的文字，也可以使用 `empty` 插槽设置，默认是 “No matching data'”                                | ^[string]                                                                                                                                                                   | —                                              |
| no-data-text          | 无选项时显示的文字，也可以使用 `empty` 插槽设置自定义内容，默认是 “暂无数据”                                       | ^[string]                                                                                                                                                                   | —                                              |
| popper-class          | 选择器下拉菜单的自定义类名                                                                                         | ^[string]                                                                                                                                                                   | ''                                             |
| popper-style          | 为 Select 下拉菜单和标签提示设置自定义样式                                                                         | ^[string] / ^[object]                                                                                                                                                       | —                                              |
| reserve-keyword       | 当 `multiple` 和 `filterable`被设置为 true 时，是否在选中一个选项后保留当前的搜索关键词                            | ^[boolean]                                                                                                                                                                  | true                                           |
| default-first-option  | 是否在输入框按下回车时，选择第一个匹配项。 需配合 `filterable` 或 `remote` 使用                                    | ^[boolean]                                                                                                                                                                  | false                                          |
| teleported            | 是否使用 teleport。设置成 `true`则会被追加到 `append-to` 的位置                                                    | ^[boolean]                                                                                                                                                                  | true                                           |
| append-to             | 下拉框挂载到哪个 DOM 元素                                                                                          | ^[string]                                                                                                                                                                   | —                                              |
| persistent            | 当下拉选择器未被激活并且`persistent`设置为`false`，选择器会被删除。                                                | ^[boolean]                                                                                                                                                                  | true                                           |
| automatic-dropdown    | 对于不可搜索的 Select，是否在输入框获得焦点后自动弹出选项菜单                                                      | ^[boolean]                                                                                                                                                                  | false                                          |
| clear-icon            | 自定义清除图标                                                                                                     | ^[string] / ^[object]`Component`                                                                                                                                            | CircleCloseFilled                              |
| fit-input-width       | 下拉框的宽度是否与输入框相同                                                                                       | ^[boolean]                                                                                                                                                                  | false                                          |
| suffix-icon           | 自定义后缀图标组件                                                                                                 | ^[string] / ^[object]`Component`                                                                                                                                            |                                                |
| suffix-icon-rotate    | 自定义后缀图标组件是否旋转                                                                                         | ^[boolean]                                                                                                                                                                  | true                                           |
| tag-type              | 标签类型                                                                                                           | ^[enum]`'' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'danger'`                                                                                                      | info                                           |
| tag-effect            | 标签效果                                                                                                           | ^[enum]`'' \| 'light' \| 'dark' \| 'plain'`                                                                                                                                 | light                                          |
| validate-event        | 是否触发表单验证                                                                                                   | ^[boolean]                                                                                                                                                                  | true                                           |
| offset                | 下拉面板偏移量                                                                                                     | ^[number]                                                                                                                                                                   | 12                                             |
| show-arrow            | 下拉菜单的内容是否有箭头                                                                                           | ^[boolean]                                                                                                                                                                  | false                                          |
| placement             | 下拉框出现的位置                                                                                                   | ^[enum]`'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'` | bottom-start                                   |
| fallback-placements   | dropdown 可用的 positions 请查看[popper.js 文档](https://popper.js.org/docs/v2/modifiers/flip/#fallbackplacements) | ^[array]`Placement[]`                                                                                                                                                       | ['bottom-start', 'top-start', 'right', 'left'] |
| max-collapse-tags     | 需要显示的 Tag 的最大数量 只有当 `collapse-tags` 设置为 true 时才会生效。                                          | ^[number]                                                                                                                                                                   | 1                                              |
| aria-label ^(a11y)    | 等价于原生 input `aria-label` 属性                                                                                 | ^[string]                                                                                                                                                                   | —                                              |
| empty-values          | 组件的空值配置 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations)                | ^[array]                                                                                                                                                                    | —                                              |
| value-on-clear        | 清空选项的值 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations)                  | ^[string] / ^[number] / ^[boolean] / ^[Function]                                                                                                                            | —                                              |
| tabindex              | input 的 tabindex                                                                                                  | ^[string] / ^[number]                                                                                                                                                       | —                                              |
| plain                 | 朴素的 Select                                                                                                      | ^[boolean]                                                                                                                                                                  | false                                          | V0.0.8  |
| [props](#props)       | 配置 options                                                                                                       | ^[object]                                                                                                                                                                   | —                                              |
| debounce              | 远程搜索时的防抖延迟（以毫秒为单位）                                                                               | ^[number]                                                                                                                                                                   | 300                                            |

### props

| Attribute | Description                          | Type      | Default  |
| --------- | ------------------------------------ | --------- | -------- |
| value     | 指定选项的值为选项对象的某个属性值   | ^[string] | value    |
| label     | 指定节点标签为节点对象的某个属性值   | ^[string] | label    |
| disabled  | 指定选项的禁用为选项对象的某个属性值 | ^[string] | disabled |

### Events

| 事件名         | 说明                                     | Type                                     |
| -------------- | ---------------------------------------- | ---------------------------------------- |
| change         | 选中值发生变化时触发                     | ^[Function]`(value: any) => void`        |
| visible-change | 下拉框出现/隐藏时触发                    | ^[Function]`(visible: boolean) => void`  |
| remove-tag     | 多选模式下移除 tag 时触发                | ^[Function]`(tagValue: any) => void`     |
| clear          | 可清空的单选模式下用户点击清空按钮时触发 | ^[Function]`() => void`                  |
| blur           | 当 input 失去焦点时触发                  | ^[Function]`(event: FocusEvent) => void` |
| focus          | 当 input 获得焦点时触发                  | ^[Function]`(event: FocusEvent) => void` |

### Slots

| 插槽名  | 说明                           | 子标签 |
| ------- | ------------------------------ | ------ |
| header  | 下拉列表顶部的内容             | —      |
| footer  | 下拉列表底部的内容             | —      |
| prefix  | Select 组件头部内容            | —      |
| empty   | 无选项时的列表                 | —      |
| tag     | select 组件自定义标签内容      | —      |
| loading | select 组件自定义 loading 内容 | —      |
| label   | select 组件自定义标签内容      | —      |

### Exposes

| 插槽名        | 说明                                   | 类型                                       |
| ------------- | -------------------------------------- | ------------------------------------------ |
| focus         | 使选择器的输入框获取焦点               | ^[Function]`() => void`                    |
| blur          | 使选择器的输入框失去焦点，并隐藏下拉框 | ^[Function]`() => void`                    |
| selectedLabel | 获取当前选中的标签                     | ^[object]`ComputedRef<string \| string[]>` |

---

## TimeSelect 时间选择

用于选择或输入日期

### 示例

:::demo 使用 `w-time-select` 标签，然后通过`start`、`end`和`step`指定起始时间，结束时间和步长。

```vue
<template>
  <w-radio-group v-model="size" class="flex mb-8" aria-label="size control">
    <w-radio-button value="large">large</w-radio-button>
    <w-radio-button value="default">default</w-radio-button>
    <w-radio-button value="small">small</w-radio-button>
    <w-radio-button value="mini">mini</w-radio-button>
  </w-radio-group>
  <w-time-select
    v-model="value"
    :size="size"
    style="width: 240px"
    start="08:30"
    step="00:15"
    end="18:30"
    placeholder="请选择时间"
  />
  <w-time-select
    v-model="value1"
    class="ml-8"
    :size="size"
    style="width: 240px"
    start="08:30"
    step="00:15"
    end="18:30"
    plain
    placeholder="请选择时间"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const size = ref('default')

const value = ref('')
const value1 = ref('')
</script>
```

:::

:::demo

```vue
<template>
  <w-time-select
    v-model="value"
    style="width: 240px"
    start="00:00"
    step="00:30"
    end="23:59"
    placeholder="请选择时间"
    format="hh:mm A"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref('')
</script>
```

:::

:::demo

```vue
<template>
  <div class="demo-time-range">
    <w-time-select
      v-model="startTime"
      style="width: 240px"
      :max-time="endTime"
      class="mr-4"
      placeholder="开始时间"
      start="08:30"
      step="00:15"
      end="18:30"
    />
    <w-time-select
      v-model="endTime"
      :prefix-icon="Search"
      style="width: 240px"
      :min-time="startTime"
      placeholder="结束时间"
      start="08:30"
      step="00:15"
      end="18:30"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Search } from '@win-design-next/icons-vue'

const startTime = ref('')
const endTime = ref('')
</script>
```

:::

### API 文档

### Attributes

| 参数                  | 说明                                                                                                | 类型                                                                                             | 默认值            | Version |
| --------------------- | --------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------- | ------- |
| model-value / v-model | 选中项绑定值                                                                                        | ^[string]                                                                                        | —                 |
| disabled              | 禁用状态                                                                                            | ^[boolean]                                                                                       | false             |
| editable              | 文本框可输入                                                                                        | ^[boolean]                                                                                       | true              |
| clearable             | 是否显示清除按钮                                                                                    | ^[boolean]                                                                                       | true              |
| include-end-time      | 是否在选项中包含`end`                                                                               | ^[boolean]                                                                                       | false             |
| size                  | 输入框尺寸                                                                                          | ^[enum]`'large' \| 'default' \| 'small'`                                                         | default           |
| placeholder           | 非范围选择时的占位内容                                                                              | ^[string]                                                                                        | —                 |
| name                  | 原生属性                                                                                            | ^[string]                                                                                        | —                 |
| effect                | Tooltip 主题，内置了 `dark` / `light` 两种主题                                                      | ^[string] / ^[enum]`'dark' \| 'light'`                                                           | lighter           |
| prefix-icon           | 自定义前缀图标                                                                                      | ^[string] / ^[Component]                                                                         |                   |
| clear-icon            | 自定义清除图标                                                                                      | ^[string] / ^[Component]                                                                         | CircleCloseFilled |
| start                 | 开始时间                                                                                            | ^[string]                                                                                        | 09:00             |
| end                   | 结束时间                                                                                            | ^[string]                                                                                        | 18:00             |
| step                  | 间隔时间                                                                                            | ^[string]                                                                                        | 00:30             |
| min-time              | 最早时间点，早于该时间的时间段将被禁用                                                              | ^[string]                                                                                        | —                 |
| max-time              | 最晚时间点，晚于该时间的时间段将被禁用                                                              | ^[string]                                                                                        | —                 |
| format                | 设置时间格式                                                                                        | ^[string] see [formats](https://day.js.org/docs/en/display/format#list-of-all-available-formats) | HH:mm             |
| empty-values          | 组件的空值配置 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations) | ^[array]                                                                                         | —                 |
| value-on-clear        | 清空选项的值 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations)   | ^[string] / ^[number] / ^[boolean] / ^[Function]                                                 | —                 |
| plain                 | 朴素的 TimeSelect                                                                                   | ^[boolean]                                                                                       | false             | V0.0.8  |

### Events

| 事件名 | 说明                                     | 类型                                     |
| ------ | ---------------------------------------- | ---------------------------------------- |
| change | 用户确认选定的值时触发                   | ^[Function]`(value: string) => void`     |
| blur   | 在组件 Input 失去焦点时触发              | ^[Function]`(event: FocusEvent) => void` |
| focus  | 在组件 Input 获得焦点时触发              | ^[Function]`(event: FocusEvent) => void` |
| clear  | 可清空的单选模式下用户点击清空按钮时触发 | ^[Function]`() => void`                  |

### Exposes

| 方法名 | 说明              | 类型                    |
| ------ | ----------------- | ----------------------- |
| focus  | 使 input 获取焦点 | ^[Function]`() => void` |
| blur   | 使 input 失去焦点 | ^[Function]`() => void` |

---

## TreeSelect 树形选择

含有下拉菜单的树形选择器，结合了 `w-tree` 和 `w-select` 两个组件的功能。

### 示例

:::demo

```vue
<template>
  <div class="mb-4">
    <w-title>单选</w-title>
    <div class="flex gap-4 flex-wrap">
      <div>
        <div class="desc">基础用法：使用 disabled 字段禁用选项</div>
        <w-tree-select
          v-model="value1"
          :data="data"
          :render-after-expand="false"
          style="width: 240px"
        />
      </div>
      <div>
        <div class="desc">show checkbox</div>
        <w-tree-select
          v-model="value1"
          :data="data"
          :render-after-expand="false"
          show-checkbox
          style="width: 240px"
        />
      </div>
      <div>
        <div class="desc">禁用</div>
        <w-tree-select
          v-model="value1"
          :data="data"
          disabled
          :render-after-expand="false"
          style="width: 240px"
        />
      </div>
      <div>
        <div class="desc">禁用</div>
        <w-tree-select
          v-model="value4"
          :data="data"
          disabled
          :render-after-expand="false"
          style="width: 240px"
        />
      </div>
    </div>
  </div>
  <w-divider />
  <div class="mb-4">
    <w-title>多选</w-title>
    <div class="flex gap-4 flex-wrap">
      <div>
        <div class="desc">基础用法：使用 disabled 字段禁用选项</div>
        <w-tree-select
          v-model="value2"
          :data="data"
          multiple
          :render-after-expand="false"
          style="width: 240px"
        />
      </div>
      <div>
        <div class="desc">show checkbox</div>
        <w-tree-select
          v-model="value2"
          :data="data"
          multiple
          :render-after-expand="false"
          show-checkbox
          style="width: 240px"
        />
      </div>
      <div>
        <div class="desc">show checkbox with `check-strictly`:</div>
        <w-tree-select
          v-model="value3"
          :data="data"
          multiple
          :render-after-expand="false"
          show-checkbox
          check-strictly
          check-on-click-node
          style="width: 240px"
        />
      </div>
      <div>
        <div class="desc">禁用</div>
        <w-tree-select
          v-model="value2"
          disabled
          :data="data"
          multiple
          :render-after-expand="false"
          style="width: 240px"
        />
      </div>
      <div>
        <div class="desc">禁用</div>
        <w-tree-select
          v-model="value5"
          :data="data"
          multiple
          disabled
          :render-after-expand="false"
          style="width: 240px"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref()
const value4 = ref('1-1-1')
const value2 = ref([])
const value3 = ref([])
const value5 = ref(['1-1-1'])

const data = [
  {
    value: '1',
    label: '数据  one 1',
    children: [
      {
        value: '1-1',
        label: '数据  two 1-1',
        disabled: true,
        children: [
          {
            value: '1-1-1',
            label: '数据  three 1-1-1',
          },
        ],
      },
    ],
  },
  {
    value: '2',
    label: '数据  one 2',
    children: [
      {
        value: '2-1',
        label: '数据  two 2-1',
        children: [
          {
            value: '2-1-1',
            label: '数据  three 2-1-1',
            disabled: true,
          },
        ],
      },
      {
        value: '2-2',
        label: '数据  two 2-2',
        children: [
          {
            value: '2-2-1',
            label: '数据  three 2-2-1',
          },
        ],
      },
    ],
  },
  {
    value: '3',
    label: '数据  one 3',
    children: [
      {
        value: '3-1',
        label: '数据  two 3-1',
        children: [
          {
            value: '3-1-1',
            label: '数据  three 3-1-1',
          },
        ],
      },
      {
        value: '3-2',
        label: '数据  two 3-2',
        children: [
          {
            value: '3-2-1',
            label: '数据  three 3-2-1',
          },
        ],
      },
    ],
  },
]
</script>

<style lang="scss" scoped>
.desc {
  margin-bottom: 12px;
  font-size: 14px;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-tree-select
    v-model="value"
    :data="data"
    check-strictly
    :render-after-expand="false"
    style="width: 240px"
  />
  <w-divider />
  show checkbox(only click checkbox to select):
  <w-tree-select
    v-model="value"
    :data="data"
    check-strictly
    :render-after-expand="false"
    show-checkbox
    style="width: 240px"
  />
  <w-divider />
  show checkbox with `check-on-click-node`:
  <w-tree-select
    v-model="value"
    :data="data"
    check-strictly
    :render-after-expand="false"
    show-checkbox
    check-on-click-node
    style="width: 240px"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref()

const data = [
  {
    value: '1',
    label: '数据 one 1',
    children: [
      {
        value: '1-1',
        label: '数据 two 1-1',
        children: [
          {
            value: '1-1-1',
            label: '数据 three 1-1-1',
          },
        ],
      },
    ],
  },
  {
    value: '2',
    label: '数据 one 2',
    children: [
      {
        value: '2-1',
        label: '数据 two 2-1',
        children: [
          {
            value: '2-1-1',
            label: '数据 three 2-1-1',
          },
        ],
      },
      {
        value: '2-2',
        label: '数据 two 2-2',
        children: [
          {
            value: '2-2-1',
            label: '数据 three 2-2-1',
          },
        ],
      },
    ],
  },
  {
    value: '3',
    label: '数据 one 3',
    children: [
      {
        value: '3-1',
        label: '数据 two 3-1',
        children: [
          {
            value: '3-1-1',
            label: '数据 three 3-1-1',
          },
        ],
      },
      {
        value: '3-2',
        label: '数据 two 3-2',
        children: [
          {
            value: '3-2-1',
            label: '数据 three 3-2-1',
          },
        ],
      },
    ],
  },
]
</script>
```

:::

:::demo

```vue
<template>
  <w-tree-select v-model="value" :data="data" filterable style="width: 240px" />
  <w-divider />
  filter method:
  <w-tree-select
    v-model="value"
    :data="data"
    :filter-method="filterMethod"
    filterable
    style="width: 240px"
  />
  <w-divider />
  filter node method:
  <w-tree-select
    v-model="value"
    :data="data"
    :filter-node-method="filterNodeMethod"
    filterable
    style="width: 240px"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref()

const sourceData = [
  {
    value: '1',
    label: '数据 one 1',
    children: [
      {
        value: '1-1',
        label: '数据 two 1-1',
        children: [
          {
            value: '1-1-1',
            label: '数据 three 1-1-1',
          },
        ],
      },
    ],
  },
  {
    value: '2',
    label: '数据 one 2',
    children: [
      {
        value: '2-1',
        label: '数据 two 2-1',
        children: [
          {
            value: '2-1-1',
            label: '数据 three 2-1-1',
          },
        ],
      },
      {
        value: '2-2',
        label: '数据 two 2-2',
        children: [
          {
            value: '2-2-1',
            label: '数据 three 2-2-1',
          },
        ],
      },
    ],
  },
  {
    value: '3',
    label: '数据 one 3',
    children: [
      {
        value: '3-1',
        label: '数据 two 3-1',
        children: [
          {
            value: '3-1-1',
            label: '数据 three 3-1-1',
          },
        ],
      },
      {
        value: '3-2',
        label: '数据 two 3-2',
        children: [
          {
            value: '3-2-1',
            label: '数据 three 3-2-1',
          },
        ],
      },
    ],
  },
]
const data = ref(sourceData)

const filterMethod = (value) => {
  data.value = [...sourceData].filter((item) => item.label.includes(value))
}

const filterNodeMethod = (value, data) => data.label.includes(value)
</script>
```

:::

:::demo

```vue
<template>
  <w-tree-select v-model="value" :data="data" style="width: 240px">
    <template #default="{ data: { label } }">
      {{ label }}<span style="color: gray">(suffix)</span>
    </template>
  </w-tree-select>
  <w-divider />
  use render content:
  <w-tree-select
    v-model="value"
    :data="data"
    :render-content="renderContent"
    style="width: 240px"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref()

const renderContent = (h, { data }) => {
  return h(
    'span',
    {
      style: {
        color: '#626AEF',
      },
    },
    data.label
  )
}

const data = [
  {
    value: '1',
    label: '数据 one 1',
    children: [
      {
        value: '1-1',
        label: '数据 two 1-1',
        children: [
          {
            value: '1-1-1',
            label: '数据 three 1-1-1',
          },
        ],
      },
    ],
  },
  {
    value: '2',
    label: '数据 one 2',
    children: [
      {
        value: '2-1',
        label: '数据 two 2-1',
        children: [
          {
            value: '2-1-1',
            label: '数据 three 2-1-1',
          },
        ],
      },
      {
        value: '2-2',
        label: '数据 two 2-2',
        children: [
          {
            value: '2-2-1',
            label: '数据 three 2-2-1',
          },
        ],
      },
    ],
  },
  {
    value: '3',
    label: '数据 one 3',
    children: [
      {
        value: '3-1',
        label: '数据 two 3-1',
        children: [
          {
            value: '3-1-1',
            label: '数据 three 3-1-1',
          },
        ],
      },
      {
        value: '3-2',
        label: '数据 two 3-2',
        children: [
          {
            value: '3-2-1',
            label: '数据 three 3-2-1',
          },
        ],
      },
    ],
  },
]
</script>
```

:::

:::demo

```vue
<template>
  <w-tree-select
    v-model="value"
    lazy
    :load="load"
    :props="props"
    style="width: 240px"
  />
  <w-divider />
  show lazy load label:
  <w-tree-select
    v-model="value2"
    lazy
    :load="load"
    :props="props"
    :cache-data="cacheData"
    style="width: 240px"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref()
const value2 = ref(5)

const cacheData = [{ value: 5, label: 'lazy load node5' }]

const props = {
  label: 'label',
  children: 'children',
  isLeaf: 'isLeaf',
}

let id = 0

const load = (node, resolve) => {
  if (node.isLeaf) return resolve([])

  setTimeout(() => {
    resolve([
      {
        value: ++id,
        label: `lazy load node${id}`,
      },
      {
        value: ++id,
        label: `lazy load node${id}`,
        isLeaf: true,
      },
    ])
  }, 400)
}
</script>
```

:::

### API 文档

### Attributes

由于这个组件是`w-tree`和`w-select`的结合体，他们的原始属性未被更改，故不在此重复。请跳转查看原组件的相应文档。

| 属性                                    | 方法                          | 事件                                | 插槽                               |
| --------------------------------------- | ----------------------------- | ----------------------------------- | ---------------------------------- |
| [tree](./tree.md#attributes)            | [tree](./tree.md#method)      | [tree](./tree.md#events)            | [tree](./tree.md#slots)            |
| [select](./select.md#select-attributes) | [select](./select.md#methods) | [select](./select.md#select-events) | [select](./select.md#select-slots) |

#### Own Attributes

| 属性名    | 详情                                                           | 类型                     | 默认值 |
| --------- | -------------------------------------------------------------- | ------------------------ | ------ |
| cacheData | 懒加载节点的缓存数据，结构与数据相同，用于获取未加载数据的标签 | ^[object]`CacheOption[]` | []     |

