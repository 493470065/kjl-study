## Checkbox 多选框

在一组备选项中进行多选。

### 示例

:::demo `checkbox-group`元素能把多个 checkbox 管理为一组，只需要在 Group 中使用 `v-model` 绑定 `Array` 类型的变量即可。 只有一个选项时的默认值类型为 `Boolean`，当选中时值为`true`。 `w-checkbox` 标签中的内容将成为复选框按钮之后的描述。

```vue
<template>
  <div class="">
    <w-title class="mb-4">默认</w-title>
    <div class="mb-4">
      <w-checkbox v-model="checked2" label="选项 1" size="large" />
      <w-checkbox v-model="checked1" label="选项 2" />
      <w-checkbox v-model="checked3" label="选项 3" size="small" />
    </div>
    <w-title>禁用：设置 disabled 属性即可。</w-title>
    <div class="mb-4">
      <w-checkbox v-model="checked4" disabled size="large" label="选项 4" />
      <w-checkbox v-model="checked5" disabled size="default" label="选项 5" />
      <w-checkbox v-model="checked6" disabled size="small" label="选项 6" />
    </div>
    <w-title>带边框：设置border属性可以渲染为带有边框的多选框。</w-title>
    <div class="mb-4">
      <w-checkbox v-model="checked7" label="选项 7" size="large" border />
      <w-checkbox v-model="checked8" label="选项 8" size="large" border />
      <w-checkbox v-model="checked9" label="选项 9" border />
      <w-checkbox v-model="checked10" label="选项 10" border />
      <w-checkbox v-model="checked11" label="选项 11" border />
      <w-checkbox v-model="checked12" label="选项 12" border />
      <w-checkbox v-model="checked13" label="选项 13" border disabled />
      <w-checkbox v-model="checked14" label="选项 14" border disabled />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const checked1 = ref(true)
const checked2 = ref(false)
const checked3 = ref(true)
const checked4 = ref(false)
const checked5 = ref(true)
const checked6 = ref(true)
const checked7 = ref(false)
const checked8 = ref(true)
const checked9 = ref(false)
const checked10 = ref(true)
const checked11 = ref(true)
const checked12 = ref(false)
const checked13 = ref(true)
const checked14 = ref(false)
</script>

<style scoped lang="scss">
.w3-checkbox {
  margin-bottom: 12px;
}
</style>
```

:::

:::demo 在 `w-checkbox` 元素中定义 `v-model` 绑定变量，单一的 `checkbox` 中，默认绑定变量的值会是 `Boolean`，选中为 `true`。 在 `w-checkbox` 组件中，`value` 是选择框的值。 如果该组件下没有被传入内容，那么 `label` 将会作为 checkbox 按钮后的介绍。 `value` 也与数组中的元素值相对应。 如果指定的值存在于数组中，就处于选择状态，反之亦然。

```vue
<template>
  <w-checkbox-group v-model="checkList">
    <w-checkbox label="选项 A" value="Value A" />
    <w-checkbox label="选项 B" value="Value B" />
    <w-checkbox label="选项 C" value="Value C" />
    <w-checkbox label="禁用" value="Value disabled" disabled />
    <w-checkbox
      label="已选中且禁用"
      value="Value selected and disabled"
      disabled
    />
  </w-checkbox-group>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const checkList = ref(['Value selected and disabled', 'Value A'])
</script>
```

:::

:::demo

```vue
<template>
  <w-checkbox
    v-model="checkAll"
    :indeterminate="isIndeterminate"
    @change="handleCheckAllChange"
  >
    全选
  </w-checkbox>
  <w-checkbox-group v-model="checkedCities" @change="handleCheckedCitiesChange">
    <w-checkbox v-for="city in cities" :key="city" :label="city" :value="city">
      {{ city }}
    </w-checkbox>
  </w-checkbox-group>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { CheckboxValueType } from 'win-design-next'

const checkAll = ref(false)
const isIndeterminate = ref(true)
const checkedCities = ref(['内科', '外科'])
const cities = ['内科', '外科', '妇产科', '新生儿科']

const handleCheckAllChange = (val: CheckboxValueType) => {
  checkedCities.value = val ? cities : []
  isIndeterminate.value = false
}
const handleCheckedCitiesChange = (value: CheckboxValueType[]) => {
  const checkedCount = value.length
  checkAll.value = checkedCount === cities.length
  isIndeterminate.value = checkedCount > 0 && checkedCount < cities.length
}
</script>
```

:::

:::demo

```vue
<template>
  <w-checkbox-group v-model="checkedCities" :min="1" :max="2">
    <w-checkbox v-for="city in cities" :key="city" :label="city" :value="city">
      {{ city }}
    </w-checkbox>
  </w-checkbox-group>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const checkedCities = ref(['外科', '内科'])
const cities = ['内科', '外科', '妇产科', '新生儿科']
</script>
```

:::

:::demo 只需要把 `w-checkbox` 元素替换为 `w-checkbox-button` 元素即可。 此外，WinDesign Next 还提供了`size`属性。

```vue
<template>
  <div>
    <w-checkbox-group v-model="checkboxGroup1" size="large">
      <w-checkbox-button v-for="city in cities" :key="city" :value="city">
        {{ city }}
      </w-checkbox-button>
    </w-checkbox-group>
  </div>
  <div class="demo-button-style">
    <w-checkbox-group v-model="checkboxGroup2">
      <w-checkbox-button v-for="city in cities" :key="city" :value="city">
        {{ city }}
      </w-checkbox-button>
    </w-checkbox-group>
  </div>
  <div class="demo-button-style">
    <w-checkbox-group v-model="checkboxGroup3" size="small">
      <w-checkbox-button
        v-for="city in cities"
        :key="city"
        :value="city"
        :disabled="city === 'Beijing'"
      >
        {{ city }}
      </w-checkbox-button>
    </w-checkbox-group>
  </div>
  <div class="demo-button-style">
    <w-checkbox-group v-model="checkboxGroup4" size="mini" disabled>
      <w-checkbox-button v-for="city in cities" :key="city" :value="city">
        {{ city }}
      </w-checkbox-button>
    </w-checkbox-group>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const checkboxGroup1 = ref(['内科'])
const checkboxGroup2 = ref(['内科'])
const checkboxGroup3 = ref(['内科'])
const checkboxGroup4 = ref(['内科'])
const cities = ['内科', '外科', '妇产科', '新生儿科']
</script>

<style scoped>
.demo-button-style {
  margin-top: 24px;
}
</style>
```

:::

### API 文档

### Attributes

| 属性名                         | 说明                                                                                                                                                 | 类型                                           | 默认值 |
| ------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------ |
| model-value / v-model          | 选中项绑定值                                                                                                                                         | ^[string] / ^[number] / ^[boolean]             | —      |
| value                          | 选中状态的值（只有在`checkbox-group`或者绑定对象类型为`array`时有效）                                                                                | ^[string] / ^[number] / ^[boolean] / ^[object] | —      |
| label                          | 选中状态的值，只有在绑定对象类型为 `array` 时有效。 如果没有 value， `label`则作为`value`使用                                                        | ^[string] / ^[number] / ^[boolean] / ^[object] | —      |
| true-value                     | 选中时的值                                                                                                                                           | ^[string] / ^[number]                          | —      |
| false-value                    | 没有选中时的值                                                                                                                                       | ^[string] / ^[number]                          | —      |
| disabled                       | 是否禁用                                                                                                                                             | ^[boolean]                                     | false  |
| border                         | 是否显示边框                                                                                                                                         | ^[boolean]                                     | false  |
| size                           | Checkbox 的尺寸                                                                                                                                      | ^[enum]`'large' \| 'default' \| 'small'`       | —      |
| name                           | 原生 name 属性                                                                                                                                       | ^[string]                                      | —      |
| checked                        | 当前是否勾选                                                                                                                                         | ^[boolean]                                     | false  |
| indeterminate                  | 设置不确定状态，仅负责样式控制                                                                                                                       | ^[boolean]                                     | false  |
| validate-event                 | 输入时是否触发表单的校验                                                                                                                             | ^[boolean]                                     | true   |
| tabindex                       | 输入框的 tabindex                                                                                                                                    | ^[string] / ^[number]                          | —      |
| id                             | input id                                                                                                                                             | ^[string]                                      | —      |
| aria-controls ^(a11y)          | 与 [aria-control](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-controls)一致, 当 `indeterminate`为 `true`时生效   | ^[string]                                      | —      |
| true-label ^(deprecated)       | 选中时的值                                                                                                                                           | ^[string] / ^[number]                          | —      |
| false-label ^(deprecated)      | 没有选中时的值                                                                                                                                       | ^[string] / ^[number]                          | —      |
| controls ^(a11y) ^(deprecated) | 和 [aria-control](https://developer.mozilla.org/en-US/docs/Web/Accessibility/ARIA/Attributes/aria-controls)一致。当 `indeterminate` 为 `true` 时生效 | ^[string]                                      | —      |

### Events

| 事件名 | 说明                     | 类型                                                      |
| ------ | ------------------------ | --------------------------------------------------------- |
| change | 当绑定值变化时触发的事件 | ^[Function]`(value: string \| number \| boolean) => void` |

### Slots

| 插槽名  | 说明           |
| ------- | -------------- |
| default | 自定义默认内容 |

## CheckboxGroup API

### Attributes

| 属性名                      | 说明                               | 类型                                     | 默认值  |
| --------------------------- | ---------------------------------- | ---------------------------------------- | ------- |
| model-value / v-model       | 绑定值                             | ^[object]`string[] \| number[]`          | []      |
| size                        | 多选框组尺寸                       | ^[enum]`'large' \| 'default' \| 'small'` | —       |
| disabled                    | 是否禁用                           | ^[boolean]                               | false   |
| min                         | 可被勾选的 checkbox 的最小数量     | ^[number]                                | —       |
| max                         | 可被勾选的 checkbox 的最大数量     | ^[number]                                | —       |
| aria-label ^(a11y)          | 原生 `aria-label`属性              | ^[string]                                | —       |
| text-color                  | 当按钮为活跃状态时的字体颜色       | ^[string]                                | #ffffff |
| fill                        | 当按钮为活跃状态时的边框和背景颜色 | ^[string]                                | #2d5afa |
| tag                         | 复选框组元素标签                   | ^[string]                                | div     |
| validate-event              | 是否触发表单验证                   | ^[boolean]                               | true    |
| label ^(a11y) ^(deprecated) | 原生 `aria-label`属性              | ^[string]                                | —       |

### Events

| 事件名 | 说明                     | 类型                                               |
| ------ | ------------------------ | -------------------------------------------------- |
| change | 当绑定值变化时触发的事件 | ^[Function]`(value: string[] \| number[]) => void` |

### Slots

| 插槽名  | 说明           | 子标签                     |
| ------- | -------------- | -------------------------- |
| default | 自定义默认内容 | Checkbox / Checkbox-button |

## CheckboxButton API

### Attributes

| 名称                      | 详情                                                                                          | 类型                                           | 默认值 |
| ------------------------- | --------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------ |
| value                     | 选中状态的值，只有在绑定对象类型为 `array` 时有效。                                           | ^[string] / ^[number] / ^[boolean] / ^[object] | —      |
| label                     | 选中状态的值，只有在绑定对象类型为 `array` 时有效。 如果没有 value， `label`则作为`value`使用 | ^[string] / ^[number] / ^[boolean] / ^[object] | —      |
| true-value                | 选中时的值                                                                                    | ^[string] / ^[number]                          | —      |
| false-value               | 没有选中时的值                                                                                | ^[string] / ^[number]                          | —      |
| disabled                  | 是否禁用                                                                                      | ^[boolean]                                     | false  |
| name                      | 原生 name 属性                                                                                | ^[string]                                      | —      |
| checked                   | 当前是否勾选                                                                                  | ^[boolean]                                     | false  |
| true-label ^(deprecated)  | 选中时的值                                                                                    | ^[string] / ^[number]                          | —      |
| false-label ^(deprecated) | 没有选中时的值                                                                                | ^[string] / ^[number]                          | —      |

### Slots

| 插槽名  | 描述           |
| ------- | -------------- |
| default | 自定义默认内容 |

---

## Radio 单选框

在一组备选项中进行单选

### 示例

:::demo 要使用 Radio 组件，只需要设置`v-model`绑定变量， 选中意味着变量的值为相应 Radio `value`属性的值， `value`可以是`String`、`Number` 或 `Boolean`。

```vue
<template>
  <div>
    <w-title class="mb-4">默认</w-title>
    <div class="flex gap-4 mb-4">
      <w-radio-group v-model="radio1">
        <w-radio value="1" size="large">选项 1</w-radio>
        <w-radio value="2" size="large">选项 2</w-radio>
      </w-radio-group>
      <w-radio-group v-model="radio2">
        <w-radio value="1">选项 1</w-radio>
        <w-radio value="2">选项 2</w-radio>
      </w-radio-group>
      <w-radio-group v-model="radio3">
        <w-radio value="1" size="small">选项 1</w-radio>
        <w-radio value="2" size="small">选项 2</w-radio>
      </w-radio-group>
    </div>
    <w-title>禁用：设置 disabled 属性即可。</w-title>
    <div class="flex gap-4">
      <w-radio v-model="radio" disabled value="disabled">选项 A</w-radio>
      <w-radio v-model="radio" disabled value="selected and disabled">
        选项 B
      </w-radio>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const radio = ref('selected and disabled')
const radio1 = ref('1')
const radio2 = ref('1')
const radio3 = ref('1')
</script>
```

:::

:::demo 结合`w-radio-group`元素和子元素`w-radio`可以实现单选组， 为 `w-radio-group` 绑定 `v-model`，再为 每一个 `w-radio` 设置好 `label` 属性即可， 另外，还可以通过 `change` 事件来响应变化，它会传入一个参数 `value` 来表示改变之后的值。

```vue
<template>
  <w-radio-group v-model="radio">
    <w-radio :value="3">选项 A</w-radio>
    <w-radio :value="6">选项 B</w-radio>
    <w-radio :value="9">选项 C</w-radio>
  </w-radio-group>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const radio = ref(3)
</script>
```

:::

:::demo 只需要把 `w-radio` 元素换成 `w-radio-button` 元素即可， 此外，WinDesign Next 还提供了 `size` 属性用来控制单选框的大小。

```vue
<template>
  <div>
    <w-radio-group v-model="radio1" size="large">
      <w-radio-button label="自费" value="自费" />
      <w-radio-button label="医保" value="医保" />
      <w-radio-button label="本地" value="本地" />
      <w-radio-button label="其它" value="其它" />
    </w-radio-group>
  </div>
  <div style="margin-top: 20px">
    <w-radio-group v-model="radio2">
      <w-radio-button label="自费" value="自费" />
      <w-radio-button label="医保" value="医保" />
      <w-radio-button label="本地" value="本地" />
      <w-radio-button label="其它" value="其它" />
    </w-radio-group>
  </div>
  <div style="margin-top: 20px">
    <w-radio-group v-model="radio3" size="small">
      <w-radio-button label="自费" value="自费" />
      <w-radio-button label="医保" value="医保" disabled />
      <w-radio-button label="本地" value="本地" />
      <w-radio-button label="其它" value="其它" />
    </w-radio-group>
  </div>
  <div style="margin-top: 20px">
    <w-radio-group v-model="radio3" size="mini">
      <w-radio-button label="自费" value="自费" />
      <w-radio-button label="医保" value="医保" disabled />
      <w-radio-button label="本地" value="本地" />
      <w-radio-button label="其它" value="其它" />
    </w-radio-group>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const radio1 = ref('自费')
const radio2 = ref('自费')
const radio3 = ref('自费')
</script>
```

:::

:::demo 设置 `border` 属性为 true 可以渲染为带有边框的单选框。

```vue
<template>
  <div>
    <w-radio-group v-model="radio1">
      <w-radio value="1" size="large" border>选项 A</w-radio>
      <w-radio value="2" size="large" border>选项 B</w-radio>
    </w-radio-group>
  </div>
  <div style="margin-top: 20px">
    <w-radio-group v-model="radio2">
      <w-radio value="1" border>选项 A</w-radio>
      <w-radio value="2" border>选项 B</w-radio>
    </w-radio-group>
  </div>
  <div style="margin-top: 20px">
    <w-radio-group v-model="radio3" size="small">
      <w-radio value="1" border>选项 A</w-radio>
      <w-radio value="2" border disabled>选项 B</w-radio>
    </w-radio-group>
  </div>
  <div style="margin-top: 20px">
    <w-radio-group v-model="radio4" size="mini" disabled>
      <w-radio value="1" border>选项 A</w-radio>
      <w-radio value="2" border>选项 B</w-radio>
    </w-radio-group>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const radio1 = ref('1')
const radio2 = ref('1')
const radio3 = ref('1')
const radio4 = ref('1')
</script>
```

:::

### API 文档

### Attributes

| 属性名                | 说明                                                        | 类型                                     | 默认值 |
| --------------------- | ----------------------------------------------------------- | ---------------------------------------- | ------ |
| model-value / v-model | 选中项绑定值                                                | ^[string] / ^[number] / ^[boolean]       | —      |
| value                 | 单选框的值                                                  | ^[string] / ^[number] / ^[boolean]       | —      |
| label                 | 单选框的 label 如果`value`没有值， `label`则作为`value`使用 | ^[string] / ^[number] / ^[boolean]       | —      |
| disabled              | 是否禁用单选框                                              | ^[boolean]                               | false  |
| border                | 是否显示边框                                                | ^[boolean]                               | false  |
| size                  | 单选框的尺寸                                                | ^[enum]`'large' \| 'default' \| 'small'` | —      |
| name                  | 原始 `name` 属性                                            | ^[string]                                | —      |

### Events

| 事件名 | 说明                   | 类型                                                      |
| ------ | ---------------------- | --------------------------------------------------------- |
| change | 绑定值变化时触发的事件 | ^[Function]`(value: string \| number \| boolean) => void` |

### Slots

| 插槽名  | 说明           |
| ------- | -------------- |
| default | 自定义默认内容 |

## RadioGroup API

### Attributes

| 属性名                      | 说明                                     | 类型                               | 默认值  |
| --------------------------- | ---------------------------------------- | ---------------------------------- | ------- |
| model-value / v-model       | 绑定值                                   | ^[string] / ^[number] / ^[boolean] | —       |
| size                        | 单选框按钮或边框按钮的大小               | ^[string]                          | default |
| disabled                    | 是否禁用                                 | ^[boolean]                         | false   |
| text-color                  | 按钮形式的 Radio 激活时的文本颜色        | ^[string]                          | #ffffff |
| fill                        | 按钮形式的 Radio 激活时的填充色和边框色  | ^[string]                          | #2d5afa |
| validate-event              | 输入时是否触发表单的校验                 | ^[boolean]                         | true    |
| aria-label ^(a11y)          | 与 RadioGroup 中的 `aria-label` 属性相同 | ^[string]                          | —       |
| name                        | 原生 `name` 属性                         | ^[string]                          | —       |
| id                          | 原生 `id` 属性                           | ^[string]                          | —       |
| label ^(a11y) ^(deprecated) | 与 RadioGroup 中的 `aria-label` 属性相同 | ^[string]                          | —       |

### Events

| 事件名 | 说明                   | 类型                                                      |
| ------ | ---------------------- | --------------------------------------------------------- |
| change | 绑定值变化时触发的事件 | ^[Function]`(value: string \| number \| boolean) => void` |

### Slots

| 插槽名  | 说明           | 子标签              |
| ------- | -------------- | ------------------- |
| default | 自定义默认内容 | Radio / RadioButton |

## RadioButton API

### Attributes

| 属性名   | 说明                                                     | 类型                               | 默认  |
| -------- | -------------------------------------------------------- | ---------------------------------- | ----- |
| value    | 单选框的值                                               | ^[string] / ^[number] / ^[boolean] | —     |
| label    | 单选框的 label 如果没有 value， `label`则作为`value`使用 | ^[string] / ^[number] / ^[boolean] | —     |
| disabled | 是否禁用单选框                                           | ^[boolean]                         | false |
| name     | 原生 name 属性                                           | ^[string]                          | —     |

### Slots

| 插槽名  | 说明         |
| ------- | ------------ |
| default | 默认插槽内容 |

---

## Rate 评分

用于评分

### 示例

:::demo 评分默认被分为三个等级，可以利用颜色数组对分数及情感倾向进行分级（默认情况下不区分颜色）。 三个等级所对应的颜色用 `colors` 属性设置，而它们对应的两个阈值则通过 `low-threshold` 和 `high-threshold` 设定。

```vue
<template>
  <div class="demo-rate-block">
    <span class="demonstration">Default</span>
    <w-rate v-model="value1" />
  </div>
  <div class="demo-rate-block">
    <span class="demonstration">自定义颜色</span>
    <w-rate v-model="value2" :colors="colors" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref(0)
const value2 = ref(0)
const colors = ref(['#99A9BF', '#F7BA2A', '#FF9900']) // same as { 2: '#99A9BF', 4: { value: '#F7BA2A', excluded: true }, 5: '#FF9900' }
</script>

<style scoped>
.demo-rate-block {
  padding: 30px 0;
  text-align: center;
  border-right: solid 1px var(--w3-border-color);
  display: inline-block;
  width: 49%;
  box-sizing: border-box;
}
.demo-rate-block:last-child {
  border-right: none;
}
.demo-rate-block .demonstration {
  display: block;
  color: var(--w3-font-color-third);
  font-size: 14px;
  margin-bottom: 20px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="flex gap-4 items-center flex-wrap">
    <w-rate v-model="value" size="large" />
    <w-rate v-model="value" />
    <w-rate v-model="value" size="small" />
    <w-rate v-model="value" size="mini" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref(0)
</script>
```

:::

:::demo 属性 `allow-half` 允许出现半星

```vue
<template>
  <w-rate v-model="value" allow-half />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref()
</script>
```

:::

:::demo 为组件设置 `show-text` 属性会在右侧显示辅助文字。 通过设置 `texts` 可以为每一个分值指定对应的辅助文字。 `texts` 为一个数组，长度应等于最大值 `max`。

```vue
<template>
  <w-rate
    v-model="value"
    :texts="['oops', 'disappointed', 'normal', 'good', 'great']"
    show-text
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref()
</script>
```

:::

:::demo 当你再次点击相同的值时，可以将值重置为 `0`。

```vue
<template>
  <w-rate v-model="value" clearable />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref(3)
</script>
```

:::

:::demo 设置`icons`属性可以自定义不同分段的图标。 若传入数组，共有 3 个元素，为 3 个分段所对应的类名；若传入对象，可自定义分段，键名为分段的界限值，键值为对应的类名。 本例还使用 `void-icon` 指定了未选中时的图标类名。

```vue
<template>
  <w-rate
    v-model="value"
    :icons="icons"
    :void-icon="RightSolid"
    :colors="['#2d5afa', '#67c23a', '#FF9900']"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import {
  ArrowRightCircle,
  ArrowRightSolid,
  RightSolid,
} from '@win-design-next/icons-vue'

const value = ref()
const icons = [RightSolid, ArrowRightSolid, ArrowRightCircle]
</script>
```

:::

:::demo 为组件设置 `disabled` 属性表示组件为只读。 此时若设置 `show-score`，则会在右侧显示目前的分值。 此外，您可以使用属性 `score-template` 来提供评分模板。 模板为一个包含了 `{value}` 的字符串，`{value}` 会被替换为当前分值。

```vue
<template>
  <w-rate
    v-model="value"
    disabled
    show-score
    text-color="#ff9900"
    score-template="{value} points"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref(3.7)
</script>
```

:::

### API 文档

### Attributes

| 属性名                      | 说明                                                                                                                                    | 类型                                                                      | 默认值                                                             |
| --------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| model-value / v-model       | 选中项绑定值                                                                                                                            | ^[number]                                                                 | 0                                                                  |
| max                         | 最大分值                                                                                                                                | ^[number]                                                                 | 5                                                                  |
| size                        | 尺寸                                                                                                                                    | ^[enum]`'large' \| 'default' \| 'small'`                                  | —                                                                  |
| disabled                    | 是否为只读                                                                                                                              | ^[boolean]                                                                | false                                                              |
| allow-half                  | 是否允许半选                                                                                                                            | ^[boolean]                                                                | false                                                              |
| low-threshold               | 低分和中等分数的界限值， 值本身被划分在低分中                                                                                           | ^[number]                                                                 | 2                                                                  |
| high-threshold              | 高分和中等分数的界限值， 值本身被划分在高分中                                                                                           | ^[number]                                                                 | 4                                                                  |
| colors                      | icon 的颜色。 若传入数组，共有 3 个元素，为 3 个分段所对应的颜色；若传入对象，可自定义分段，键名为分段的界限值，键值为对应的颜色        | ^[object]`string[] \| Record<number, string>`                             | ['#f7ba2a', '#f7ba2a', '#f7ba2a']                                  |
| void-color                  | 未选中 icon 的颜色                                                                                                                      | ^[string]                                                                 | #c6d1de                                                            |
| disabled-void-color         | 只读时未选中 icon 的颜色                                                                                                                | ^[string]                                                                 | #eff2f7                                                            |
| icons                       | 图标组件 若传入数组，则需要传入 3 个元素，分别为 3 个部分所对应的类名；若传入对象，则可自定义分段，键名为分段的界限值，键值为对应的类名 | ^[object]`string[] \| Component[] \| Record<number, string \| Component>` | [StarFilled, StarFilled, StarFilled]                               |
| void-icon                   | 未被选中的图标组件                                                                                                                      | ^[string] / ^[Component]                                                  | Star                                                               |
| disabled-void-icon          | 禁用状态的未选择图标                                                                                                                    | ^[string] / ^[Component]                                                  | StarFilled                                                         |
| show-text                   | 是否显示辅助文字，若为真，则会从 texts 数组中选取当前分数对应的文字内容                                                                 | ^[boolean]                                                                | false                                                              |
| show-score                  | 是否显示当前分数， show-score 和 show-text 不能同时为真                                                                                 | ^[boolean]                                                                | false                                                              |
| text-color                  | 辅助文字的颜色                                                                                                                          | ^[string]                                                                 | ''                                                                 |
| texts                       | 辅助文字数组                                                                                                                            | ^[array]`string[]`                                                        | ['Extremely bad', 'Disappointed', 'Fair', 'Satisfied', 'Surprise'] |
| score-template              | 分数显示模板                                                                                                                            | ^[string]                                                                 | {value}                                                            |
| clearable                   | 是否可以重置值为 `0`                                                                                                                    | ^[boolean]                                                                | false                                                              |
| id                          | 原生 `id` 属性                                                                                                                          | ^[string]                                                                 | —                                                                  |
| aria-label ^(a11y)          | 和 Rate 的 `aria-label` 属性保持一致                                                                                                    | ^[string]                                                                 | —                                                                  |
| label ^(a11y) ^(deprecated) | 和 Rate 的 `aria-label` 属性保持一致                                                                                                    | ^[string]                                                                 | —                                                                  |

### Events

| 事件名 | 描述说明       | 类型                                 |
| ------ | -------------- | ------------------------------------ |
| change | 分值改变时触发 | ^[Function]`(value: number) => void` |

### Exposes

| 名称              | 描述       | 类型                                 |
| ----------------- | ---------- | ------------------------------------ |
| setCurrentValue   | 设置当前值 | ^[Function]`(value: number) => void` |
| resetCurrentValue | 重置当前值 | ^[Function]`() => void`              |

---

## Switch 开关

表示两种相互对立的状态间的切换，多用于触发「开/关」。

### 示例

:::demo 绑定 `v-model` 到一个 `Boolean` 类型的变量。 可以使用 `--w3-switch-on-color` 属性与 `--w3-switch-off-color` 属性来设置开关的背景色。

```vue
<template>
  <w-title>基础用法</w-title>
  <div class="flex gap-4 items-center">
    <w-switch v-model="value1" />
    <w-switch v-model="value1" size="large" />
    <w-switch v-model="value1" size="small" />
    <w-switch v-model="value1" size="mini" />
  </div>
  <w-divider />
  <w-title>自定义颜色</w-title>
  <w-switch
    v-model="value2"
    style="--w3-switch-on-color: #2d5afa; --w3-switch-off-color: #c9c9c9"
  />
  <w-divider />
  <w-title>禁用</w-title>
  <w-switch v-model="value2" disabled />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref(true)
const value2 = ref(true)
</script>
```

:::

:::demo 使用`active-text`属性与`inactive-text`属性来设置开关的文字描述。

```vue
<template>
  <w-switch
    v-model="value1"
    class="mb-2"
    active-text="启用"
    inactive-text="停用"
  />
  <br />
  <w-switch
    v-model="value2"
    class="mb-2"
    style="--w3-switch-on-color: #13ce66; --w3-switch-off-color: #ff4949"
    active-text="启用"
    inactive-text="停用"
  />
  <br />
  <w-switch
    v-model="value3"
    inline-prompt
    active-text="是"
    inactive-text="否"
  />
  <w-switch
    v-model="value4"
    class="ml-2"
    inline-prompt
    style="--w3-switch-on-color: #13ce66; --w3-switch-off-color: #ff4949"
    active-text="Y"
    inactive-text="N"
  />
  <w-switch
    v-model="value6"
    class="ml-2"
    width="60"
    inline-prompt
    active-text="超出省略"
    inactive-text="超出省略"
  />
  <w-switch
    v-model="value5"
    class="ml-2"
    inline-prompt
    style="--w3-switch-on-color: #13ce66; --w3-switch-off-color: #ff4949"
    active-text="完整展示多个内容"
    inactive-text="多个内容"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref(true)
const value2 = ref(true)
const value3 = ref(true)
const value4 = ref(true)
const value5 = ref(true)
const value6 = ref(true)
</script>
```

:::

:::demo 使用 `inactive-icon` 和 `active-icon` 属性来添加图标。 使用 `inline-prompt` 属性来控制图标显示在点内。

```vue
<template>
  <w-switch v-model="value1" :active-icon="Check" :inactive-icon="Close" />
  <br />
  <w-switch
    v-model="value2"
    class="mt-2"
    style="margin-left: 24px"
    inline-prompt
    :active-icon="Check"
    :inactive-icon="Close"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Check, Close } from '@win-design-next/icons-vue'

const value1 = ref(true)
const value2 = ref(true)
</script>
```

:::

:::demo 你可以设置 `active-value` 和 `inactive-value` 属性， 它们接受 `Boolean`、`String` 或 `Number` 类型的值。

```vue
<template>
  <w-tooltip :content="'Switch value: ' + value" placement="top">
    <w-switch
      v-model="value"
      style="--w3-switch-on-color: #13ce66; --w3-switch-off-color: #ff4949"
      active-value="100"
      inactive-value="0"
    />
  </w-tooltip>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref('100')
</script>
```

:::

:::demo 设置`loading`属性，接受一个`Boolean`，设置`true`即加载中状态。

```vue
<template>
  <w-switch v-model="value1" loading />
  <w-switch v-model="value2" loading class="ml-2" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref(true)
const value2 = ref(false)
</script>
```

:::

:::demo 设置`beforeChange`属性，若返回 false 或者返回 Promise 且被 reject，则停止切换。

```vue
<template>
  <w-switch
    v-model="value1"
    :loading="loading1"
    :before-change="beforeChange1"
  />
  <w-switch
    v-model="value2"
    class="ml-2"
    :loading="loading2"
    :before-change="beforeChange2"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { WMessage } from 'win-design-next'

const value1 = ref(false)
const value2 = ref(false)
const loading1 = ref(false)
const loading2 = ref(false)

const beforeChange1 = (): Promise<boolean> => {
  loading1.value = true
  return new Promise((resolve) => {
    setTimeout(() => {
      loading1.value = false
      WMessage.success('Switch success')
      return resolve(true)
    }, 1000)
  })
}

const beforeChange2 = (): Promise<boolean> => {
  loading2.value = true
  return new Promise((_, reject) => {
    setTimeout(() => {
      loading2.value = false
      WMessage.error('Switch failed')
      return reject(new Error('Error'))
    }, 1000)
  })
}
</script>
```

:::

:::demo 使用 `inactive-action-icon` 和 `active-action-icon` 属性来添加图标。

```vue
<template>
  <w-switch
    v-model="value1"
    :active-action-icon="ViewOff"
    :inactive-action-icon="ViewSolid"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { ViewOff, ViewSolid } from '@win-design-next/icons-vue'

const value1 = ref(true)
</script>
```

:::

:::demo 使用 `active-action` 和 `inactive-action` 属性来添加图标。

```vue
<template>
  <w-switch v-model="value1">
    <template #active-action>
      <span class="custom-active-action">T</span>
    </template>
    <template #inactive-action>
      <span class="custom-inactive-action">F</span>
    </template>
  </w-switch>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const value1 = ref(true)
</script>
```

:::

### API 文档

### Attributes

| 属性名                       | 说明                                                                             | 类型                                             | Default |
| ---------------------------- | -------------------------------------------------------------------------------- | ------------------------------------------------ | ------- |
| model-value / v-model        | 绑定值，必须等于 `active-value` 或 `inactive-value`，默认为 `Boolean` 类型       | ^[boolean] / ^[string] / ^[number]               | false   |
| disabled                     | 是否禁用                                                                         | ^[boolean]                                       | false   |
| loading                      | 是否显示加载中                                                                   | ^[boolean]                                       | false   |
| size                         | switch 的大小                                                                    | ^[enum]`'' \| 'large' \| 'default' \| 'small'`   | ''      |
| width                        | switch 的宽度                                                                    | ^[number] / ^[string]                            | ''      |
| inline-prompt                | 无论图标或文本是否显示在点内，只会呈现文本的第一个字符                           | ^[boolean]                                       | false   |
| active-icon                  | switch 状态为 `on` 时所显示图标，设置此项会忽略 `active-text`                    | ^[string] / ^[Component]                         | —       |
| inactive-icon                | switch 状态为 `off` 时所显示图标，设置此项会忽略 `inactive-text`                 | ^[string] / ^[Component]                         | —       |
| active-action-icon           | `on`状态下显示的图标组件                                                         | ^[string] / ^[Component]                         | —       |
| inactive-action-icon         | `off`状态下显示的图标组件                                                        | ^[string] / ^[Component]                         | —       |
| active-text                  | switch 打开时的文字描述                                                          | ^[string]                                        | ''      |
| inactive-text                | switch 的状态为 `off` 时的文字描述                                               | ^[string]                                        | ''      |
| active-value                 | switch 状态为 `on` 时的值                                                        | ^[boolean] / ^[string] / ^[number]               | true    |
| inactive-value               | switch 的状态为 `off` 时的值                                                     | ^[boolean] / ^[string] / ^[number]               | false   |
| name                         | switch 对应的 name 属性                                                          | ^[string]                                        | ''      |
| validate-event               | 是否触发表单验证                                                                 | ^[boolean]                                       | true    |
| before-change                | switch 状态改变前的钩子， 返回 `false` 或者返回 `Promise` 且被 reject 则停止切换 | ^[boolean] / ^[Function]`() => Promise<boolean>` | —       |
| id                           | input 的 id                                                                      | ^[string]                                        | —       |
| tabindex                     | input 的 tabindex                                                                | ^[string] / ^[number]                            | —       |
| aria-label ^(a11y)           | 等价于原生 input `aria-label` 属性                                               | ^[string]                                        | —       |
| active-color ^(deprecated)   | 当在 `on` 状态时的背景颜色(推荐使用 CSS var `--w3-switch-on-color` )             | ^[string]                                        | ''      |
| inactive-color ^(deprecated) | `off` 状态时的背景颜色(推荐使用 CSS var `--w3-switch-off-color` )                | ^[string]                                        | ''      |
| border-color ^(deprecated)   | 开关的边框颜色 ( 推荐使用 CSS var `--w3-switch-border-color` )                   | ^[string]                                        | ''      |
| label ^(a11y) ^(deprecated)  | 等价于原生 input `aria-label` 属性                                               | ^[string]                                        | —       |

### 事件

| 事件名 | 说明                            | Type                                                    |
| ------ | ------------------------------- | ------------------------------------------------------- |
| change | switch 状态发生变化时的回调函数 | ^[Function]`(val: boolean \| string \| number) => void` |

### Slots

| 名称            | 说明                 |
| --------------- | -------------------- |
| active-action   | 自定义 active 行为   |
| inactive-action | 自定义 inactive 行为 |

### Exposes

| 方法  | 详情                      | Type                    |
| ----- | ------------------------- | ----------------------- |
| focus | 手动 focus 到 switch 组件 | ^[Function]`() => void` |

---

