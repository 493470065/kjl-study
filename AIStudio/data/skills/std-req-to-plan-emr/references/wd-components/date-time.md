## Calendar 日历

显示日期

### 示例

:::demo 设置 `value` 来指定当前显示的月份。 如果 `value` 未指定，则显示当月。 `value` 支持 `v-model` 双向绑定。

```vue
<template>
  <w-calendar v-model="value" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const value = ref(new Date())
</script>
```

:::

:::demo 通过设置名为 `date-cell` 的 `scoped-slot` 来自定义日历单元格中显示的内容。 在 `scoped-slot` 可以获取到 date（当前单元格的日期）, data（包括 type，isSelected，day 属性）。 详情解释参考下方的 API 文档。

```vue
<template>
  <w-calendar>
    <template #date-cell="{ data }">
      <p :class="data.isSelected ? 'is-selected' : ''">
        {{ data.day.split('-').slice(1).join('-') }}
        {{ data.isSelected ? '✔️' : '' }}
      </p>
    </template>
  </w-calendar>
</template>

<style>
.is-selected {
  color: #2d5afa;
}
</style>
```

:::

:::demo 设置 `range` 属性指定日历的显示范围。 开始时间必须是周起始日，结束时间必须是周结束日，且时间跨度不能超过两个月。

```vue
<template>
  <w-calendar :range="[new Date(2019, 2, 4), new Date(2019, 2, 24)]" />
</template>
```

:::

:::demo

```vue
<template>
  <w-calendar ref="calendar">
    <template #header="{ date }">
      <span>Custom header content</span>
      <span>{{ date }}</span>
      <w-button-group>
        <w-button size="small" @click="selectDate('prev-year')">
          去年
        </w-button>
        <w-button size="small" @click="selectDate('prev-month')">
          上个月
        </w-button>
        <w-button size="small" @click="selectDate('today')">今天</w-button>
        <w-button size="small" @click="selectDate('next-month')">
          下个月
        </w-button>
        <w-button size="small" @click="selectDate('next-year')">
          明年
        </w-button>
      </w-button-group>
    </template>
  </w-calendar>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { CalendarDateType, CalendarInstance } from 'win-design-next'

const calendar = ref<CalendarInstance>()
const selectDate = (val: CalendarDateType) => {
  if (!calendar.value) return
  calendar.value.selectDate(val)
}
</script>
```

:::

### API 文档

### Attributes

| 属性名                | 说明                                                                                                          | 类型                   | 默认值 |
| --------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------- | ------ |
| model-value / v-model | 选中项绑定值                                                                                                  | ^[Date]                | —      |
| range                 | 时间范围，包括开始时间与结束时间。 开始时间必须是周起始日，结束时间必须是周结束日，且时间跨度不能超过两个月。 | ^[array]`[Date, Date]` | —      |

### Slots

| 插槽名    | 说明                                                                                                                                                                               | 类型                                                                                                                         |
| --------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| date-cell | `type` 表示该日期的所属月份，可选值有 prev-month、current-month 和 next-month；`isSelected` 标明该日期是否被选中；`day` 是格式化的日期，格式为 `yyyy-MM-dd`；`date` 是单元格的日期 | ^[object]`{ data: { type: 'prev-month' \| 'current-month' \| 'next-month', isSelected: boolean, day: string, date: Date } }` |
| header    | 卡片标题内容                                                                                                                                                                       | ^[object]`{ date: string }`                                                                                                  |

### 暴露

| 名称                        | 说明                               | 类型                                                                                          |
| --------------------------- | ---------------------------------- | --------------------------------------------------------------------------------------------- |
| selectedDay                 | 当前已选日期                       | ^[object]`ComputedRef<Dayjs \| undefined>`                                                    |
| pickDay                     | 选择一个具体日期                   | ^[Function]`(day: dayjs.Dayjs) => void`                                                       |
| selectDate                  | 选择日期                           | ^[Function]`(type: CalendarDateType) => void`                                                 |
| calculateValidatedDateRange | 根据开始与结束日期计算验证日期范围 | ^[Function]`(startDayjs: dayjs.Dayjs, endDayjs: dayjs.Dayjs) => [dayjs.Dayjs, dayjs.Dayjs][]` |

## DatePicker 日期选择器

用于选择或输入日期

### 示例

:::demo 基本单位由 `type` 属性指定。 通过 `shortcuts` 配置快捷选项， 通过 `disabledDate` 函数，来设置禁用掉的日期。

```vue
<template>
  <w-radio-group v-model="size" aria-label="size control">
    <w-radio-button value="large">large</w-radio-button>
    <w-radio-button value="default">default</w-radio-button>
    <w-radio-button value="small">small</w-radio-button>
    <w-radio-button value="mini">mini</w-radio-button>
  </w-radio-group>
  <div class="flex flex-wrap gap-4">
    <div class="block">
      <span class="demonstration">默认</span>
      <w-date-picker
        v-model="value1"
        type="date"
        placeholder="请选择日期"
        :size="size"
      />
    </div>
    <div class="block">
      <span class="demonstration">带快捷选项</span>
      <w-date-picker
        v-model="value2"
        type="date"
        placeholder="请选择日期"
        :disabled-date="disabledDate"
        :shortcuts="shortcuts"
        :size="size"
      />
    </div>
    <div class="block">
      <span class="demonstration">🎉 点击尾部</span>
      <w-date-picker
        v-model="value3"
        type="date"
        placeholder="请选择日期"
        trigger-suffix
        :size="size"
      />
    </div>
    <div class="block">
      <span class="demonstration">🎉 轻量化</span>
      <w-date-picker
        v-model="value3"
        type="date"
        placeholder="请选择日期"
        plain
        :size="size"
      />
    </div>
    <div class="block">
      <span class="demonstration">禁用</span>
      <w-date-picker
        v-model="value3"
        disabled
        type="date"
        placeholder="请选择日期"
        :size="size"
      />
    </div>
    <div class="block">
      <span class="demonstration">禁用</span>
      <w-date-picker
        v-model="value1"
        disabled
        type="date"
        placeholder="请选择日期"
        :size="size"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const size = ref<'default' | 'large' | 'small'>('default')

const value1 = ref('')
const value2 = ref('')
const value3 = ref('2025-07-21')

const shortcuts = [
  {
    text: '今天',
    value: new Date(),
  },
  {
    text: '昨天',
    value: () => {
      const date = new Date()
      date.setTime(date.getTime() - 3600 * 1000 * 24)
      return date
    },
  },
  {
    text: '一周前',
    value: () => {
      const date = new Date()
      date.setTime(date.getTime() - 3600 * 1000 * 24 * 7)
      return date
    },
  },
]

const disabledDate = (time: Date) => {
  return time.getTime() > Date.now()
}
</script>

<style scoped>
.block {
  padding-top: 20px;
  text-align: center;
}

.demonstration {
  display: block;
  color: var(--w3-font-color-second);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

:::

:::demo 通过属性 `emit-formatted-value` 来获取格式化后的日期值。Ps: F12 打开控制台查看输出

```vue
<template>
  <w-space class="flex mb-8">
    <div class="block">
      <span class="demonstration">日期选择器</span>
      <w-date-picker
        v-model="value1"
        type="date"
        format="YYYY-MM-DD"
        emit-formatted-value
        placeholder="请选择日期"
        @change="handleCurrentChange1"
      />
    </div>
    <div class="block">
      <span class="demonstration">周选择器</span>
      <w-date-picker
        v-model="value2"
        type="week"
        format="ww [周]"
        emit-formatted-value
        placeholder="请选择周"
        @change="handleCurrentChange2"
      />
    </div>
    <div class="block">
      <span class="demonstration">时间选择器</span>
      <w-time-picker
        v-model="value3"
        emit-formatted-value
        format="HH:mm:ss"
        placeholder="请选择时间"
        @change="handleCurrentChange3"
      />
    </div>
  </w-space>
  <w-space class="flex">
    <div class="block">
      <span class="demonstration">范围选择器</span>
      <w-date-picker
        v-model="value4"
        type="daterange"
        range-separator="-"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        emit-formatted-value
        format="YYYY/MM/DD"
        @change="handleCurrentChange4"
      />
    </div>
  </w-space>
</template>

<script lang="ts" setup>
import { ref, watch } from 'vue'

const value1 = ref('')
const value2 = ref('')
const value3 = ref('')
const value4 = ref(['2025-07-01', '2025-08-30'])

watch(value4, (val, oldVal) => {
  console.log('数据变化：', val, oldVal)
})

const handleCurrentChange1 = (val: Date, format: string) => {
  console.log(`current date: ${val}, format: ${format}`)
}

const handleCurrentChange2 = (val: Date, format: string) => {
  console.log(`current date: ${val}, format: ${format}`)
}

const handleCurrentChange3 = (val: Date, format: string) => {
  console.log(`current date: ${val}, format: ${format}`)
}

const handleCurrentChange4 = (val: Date, format: string) => {
  console.log(`current date: ${val}, format: ${format}`)
}
</script>

<style scoped>
.block {
  padding-top: 20px;
  text-align: center;
}

.demonstration {
  display: block;
  color: var(--w3-font-color-second);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="demo-date-picker">
    <div class="container">
      <div class="block">
        <span class="demonstration">周</span>
        <w-date-picker
          v-model="value1"
          type="week"
          format="ww [周]"
          placeholder="选择周"
        />
      </div>
      <div class="block">
        <span class="demonstration">多个日期</span>
        <w-date-picker
          v-model="value2"
          type="dates"
          placeholder="选择多个日期"
        />
      </div>
    </div>
    <div class="container">
      <div class="block">
        <span class="demonstration">年</span>
        <w-date-picker v-model="value3" type="year" placeholder="选择年" />
      </div>
      <div class="block">
        <span class="demonstration">多个年</span>
        <w-date-picker v-model="value4" type="years" placeholder="选择多个年" />
      </div>
    </div>
    <div class="container">
      <div class="block">
        <span class="demonstration">月</span>
        <w-date-picker v-model="value5" type="month" placeholder="选择月" />
      </div>
      <div class="block">
        <span class="demonstration">多个月</span>
        <w-date-picker
          v-model="value6"
          type="months"
          placeholder="选择多个月"
        />
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref('')
const value2 = ref('')
const value3 = ref('')
const value4 = ref('')
const value5 = ref('')
const value6 = ref('')
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}

.demo-date-picker .block {
  padding: 30px 0;
  text-align: center;
  flex: 1;
}

.demo-date-picker .container {
  flex: 1;
}

.demo-date-picker .demonstration {
  display: block;
  color: var(--w3-font-color-third);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

:::

:::demo 在选择日期范围时，默认情况下左右面板会联动。 如果希望两个面板各自独立切换当前月份，可以使用 `unlink-panels` 属性解除联动。

```vue
<template>
  <w-radio-group v-model="size" aria-label="size control">
    <w-radio-button value="large">large</w-radio-button>
    <w-radio-button value="default">default</w-radio-button>
    <w-radio-button value="small">small</w-radio-button>
    <w-radio-button value="mini">mini</w-radio-button>
  </w-radio-group>
  <w-space class="flex">
    <div class="block">
      <span class="demonstration">默认</span>
      <w-date-picker
        v-model="value1"
        type="daterange"
        range-separator="-"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :size="size"
      />
    </div>
    <div class="block">
      <span class="demonstration">快捷选项</span>
      <w-date-picker
        v-model="value2"
        type="daterange"
        unlink-panels
        range-separator="-"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :shortcuts="shortcuts"
        :size="size"
      />
    </div>
  </w-space>
  <w-space class="flex">
    <div class="block">
      <span class="demonstration">🎉 轻量化</span>
      <w-date-picker
        v-model="value3"
        plain
        type="daterange"
        unlink-panels
        range-separator="-"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :shortcuts="shortcuts"
        :size="size"
      />
    </div>
  </w-space>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const size = ref<'default' | 'large' | 'small'>('default')

const value1 = ref('')
const value2 = ref('')
const value3 = ref('')

const shortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 7)
      return [start, end]
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 30)
      return [start, end]
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setTime(start.getTime() - 3600 * 1000 * 24 * 90)
      return [start, end]
    },
  },
]
</script>

<style scoped>
.block {
  padding-top: 20px;
  text-align: center;
  flex: 1;
}

.demonstration {
  display: block;
  color: var(--w3-font-color-second);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

:::

:::demo 在选择月份范围时，默认情况下左右面板会联动。 如果希望两个面板各自独立切换当前年份，可以使用 `unlink-panels` 属性解除联动。

```vue
<template>
  <div class="demo-date-picker">
    <div class="block">
      <span class="demonstration">默认</span>
      <w-date-picker
        v-model="value1"
        type="monthrange"
        range-separator="-"
        start-placeholder="开始月份"
        end-placeholder="结束月份"
      />
    </div>
    <div class="block">
      <span class="demonstration">快捷选项</span>
      <w-date-picker
        v-model="value2"
        type="monthrange"
        unlink-panels
        range-separator="-"
        start-placeholder="开始月份"
        end-placeholder="结束月份"
        :shortcuts="shortcuts"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref('')
const value2 = ref('')

const shortcuts = [
  {
    text: '最近一个月',
    value: [new Date(), new Date()],
  },
  {
    text: '最近一年',
    value: () => {
      const end = new Date()
      const start = new Date(new Date().getFullYear(), 0)
      return [start, end]
    },
  },
  {
    text: '最近六个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 6)
      return [start, end]
    },
  },
]
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}
.demo-date-picker .block {
  padding-top: 20px;
  text-align: center;
  flex: 1;
}
.demo-date-picker .demonstration {
  display: block;
  color: var(--w3-font-color-second);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

:::

:::demo 在选择范围时，默认情况下左右面板会联动。 如果希望两个面板各自独立切换当前年份，可以使用 `unlink-panels` 属性解除联动。

```vue
<template>
  <div class="demo-date-picker">
    <div class="block">
      <span class="demonstration">默认</span>
      <w-date-picker
        v-model="value1"
        type="yearrange"
        range-separator="-"
        start-placeholder="开始年份"
        end-placeholder="结束年份"
      />
    </div>
    <div class="block">
      <span class="demonstration">快捷选项</span>
      <w-date-picker
        v-model="value2"
        type="yearrange"
        unlink-panels
        range-separator="-"
        start-placeholder="开始年份"
        end-placeholder="结束年份"
        :shortcuts="shortcuts"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref()
const value2 = ref()

const shortcuts = [
  {
    text: '近一年',
    value: [new Date(), new Date()],
  },
  {
    text: '近十年',
    value: () => {
      const end = new Date()
      const start = new Date(
        new Date().setFullYear(new Date().getFullYear() - 10)
      )
      return [start, end]
    },
  },
  {
    text: '近50年',
    value: () => {
      const start = new Date()
      const end = new Date(
        new Date().setFullYear(new Date().getFullYear() + 50)
      )
      return [start, end]
    },
  },
]
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}
.demo-date-picker .block {
  padding-top: 20px;
  text-align: center;
  flex: 1;
}

.demo-date-picker .demonstration {
  display: block;
  color: var(--w3-font-color-second);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="demo-date-picker">
    <div class="block">
      <span class="demonstration">设置默认值</span>
      <w-date-picker
        v-model="value1"
        type="date"
        placeholder="请选择日期"
        :default-value="new Date(2010, 9, 1)"
      />
    </div>
    <div class="block">
      <span class="demonstration">日期范围</span>
      <w-date-picker
        v-model="value2"
        type="daterange"
        start-placeholder="请选择开始日期"
        end-placeholder="请选择结束日期"
        :default-value="[new Date(2010, 9, 1), new Date(2010, 10, 1)]"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref('')
const value2 = ref('')
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}
.demo-date-picker .block {
  padding: 30px 0;
  text-align: center;
  flex: 1;
}
.demo-date-picker .demonstration {
  display: block;
  color: var(--w3-font-color-second);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="demo-date-picker">
    <div class="block">
      <span class="demonstration">Date object</span>
      <div class="demonstration">{{ value1 }}</div>
      <w-date-picker
        v-model="value1"
        type="date"
        placeholder="请选择日期"
        format="YYYY/MM/DD"
      />
    </div>
    <div class="block">
      <span class="demonstration">value-format</span>
      <div class="demonstration">{{ value2 }}</div>
      <w-date-picker
        v-model="value2"
        type="date"
        placeholder="请选择日期"
        format="YYYY/MM/DD"
        value-format="YYYY-MM-DD"
      />
    </div>
    <div class="block">
      <span class="demonstration">Timestamp</span>
      <div class="demonstration">{{ value3 }}</div>
      <w-date-picker
        v-model="value3"
        type="date"
        placeholder="请选择日期"
        format="YYYY/MM/DD"
        value-format="x"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref('')
const value2 = ref('')
const value3 = ref('')
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}
.demo-date-picker .block {
  padding: 30px 0;
  text-align: center;
  flex: 1;
}
.demo-date-picker .demonstration {
  display: block;
  color: var(--w3-font-color-second);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

:::

:::demo 默认情况下，开始日期和结束日期的时间部分都是选择日期当日的 `00:00:00`。 通过 `default-time` 可以分别指定开始日期和结束日期的具体时刻。 它接受最多两个日期对象的数组。 其中第一项控制起始日期的具体时刻，第二项控制结束日期的具体时刻。

```vue
<template>
  <div class="demo-date-picker">
    <div class="block">
      <p>{{ value }}</p>
      <w-date-picker
        v-model="value"
        type="daterange"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
        :default-time="defaultTime"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref('')
const defaultTime = ref<[Date, Date]>([
  new Date(2000, 1, 1, 0, 0, 0),
  new Date(2000, 2, 1, 23, 59, 59),
])
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}
.demo-date-picker .block {
  padding: 30px 0;
  text-align: center;
  flex: 1;
}
</style>
```

:::

:::demo 当你从其他 vue 组件或由渲染函数生成的组件中导入组件时, 你可以设置`suffix-icon` 属性来定制后缀内容。

```vue
<template>
  <div class="demo-date-picker">
    <div class="block">
      <span class="demonstration">set suffix-icon</span>
      <w-date-picker
        v-model="value1"
        type="date"
        placeholder="请选择日期"
        :prefix-icon="customPrefix"
        :suffix-icon="Search"
      />
    </div>
    <div class="block">
      <span class="demonstration">set suffix-icon</span>
      <w-date-picker
        v-model="value2"
        type="daterange"
        :suffix-icon="Search"
        :prefix-icon="customPrefix"
        start-placeholder="开始日期"
        end-placeholder="结束日期"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { h, ref, shallowRef } from 'vue'
import { Search } from '@win-design-next/icons-vue'

const value1 = ref('')
const value2 = ref('')

const customPrefix = shallowRef({
  render() {
    return h('p', 'pre')
  },
})
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}
.demo-date-picker .block {
  padding: 30px 0;
  text-align: center;
  flex: 1;
}
.demo-date-picker .demonstration {
  display: block;
  color: var(--w3-font-color-second);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="demo-date-picker">
    <w-date-picker
      v-model="value"
      type="date"
      placeholder="请选择日期"
      format="YYYY/MM/DD"
      value-format="YYYY-MM-DD"
    >
      <template #default="cell">
        <div class="cell" :class="{ current: cell.isCurrent }">
          <span class="text">{{ cell.text }}</span>
          <span v-if="isHoliday(cell)" class="holiday" />
        </div>
      </template>
    </w-date-picker>
    <w-date-picker v-model="month" type="month" placeholder="请选择月份">
      <template #default="cell">
        <div class="w3-date-table-cell" :class="{ current: cell.isCurrent }">
          <span class="w3-date-table-cell__text">{{ cell.text + 1 }}期</span>
        </div>
      </template>
    </w-date-picker>
    <w-date-picker v-model="year" type="year" placeholder="请选择年份">
      <template #default="cell">
        <div class="w3-date-table-cell" :class="{ current: cell.isCurrent }">
          <span class="w3-date-table-cell__text">{{ cell.text + 1 }}y</span>
        </div>
      </template>
    </w-date-picker>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref('2021-10-29')
const month = ref('')
const year = ref('')
const holidays = [
  '2021-10-01',
  '2021-10-02',
  '2021-10-03',
  '2021-10-04',
  '2021-10-05',
  '2021-10-06',
  '2021-10-07',
]

const isHoliday = ({ dayjs }) => {
  return holidays.includes(dayjs.format('YYYY-MM-DD'))
}
</script>

<style scoped>
.demo-date-picker {
  display: flex;
  justify-content: space-between;
}

.cell {
  height: 30px;
  padding: 3px 0;
  box-sizing: border-box;
}

.cell .text {
  width: 24px;
  height: 24px;
  display: block;
  margin: 0 auto;
  line-height: 24px;
  position: absolute;
  left: 50%;
  transform: translateX(-50%);
  border-radius: 50%;
}

.cell.current .text {
  background: #626aef;
  color: #fff;
}

.cell .holiday {
  position: absolute;
  width: 6px;
  height: 6px;
  background: var(--w3-color-danger);
  border-radius: 50%;
  bottom: 0px;
  left: 50%;
  transform: translateX(-50%);
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="demo-date-picker-icon">
    <div class="container">
      <div class="block">
        <div class="demonstration">日期选择器</div>
        <w-date-picker
          v-model="value1"
          type="date"
          placeholder="请选择日期"
          format="YYYY/MM/DD"
          value-format="YYYY-MM-DD"
        >
          <template #prev-month>
            <w-icon><CaretLeft /></w-icon>
          </template>
          <template #next-month>
            <w-icon><CaretRight /></w-icon>
          </template>
          <template #prev-year>
            <w-icon>
              <svg
                viewBox="0 0 20 20"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g stroke-width="1" fill-rule="evenodd">
                  <g fill="currentColor">
                    <path
                      d="M8.73171,16.7949 C9.03264,17.0795 9.50733,17.0663 9.79196,16.7654 C10.0766,16.4644 10.0634,15.9897 9.76243,15.7051 L4.52339,10.75 L17.2471,10.75 C17.6613,10.75 17.9971,10.4142 17.9971,10 C17.9971,9.58579 17.6613,9.25 17.2471,9.25 L4.52112,9.25 L9.76243,4.29275 C10.0634,4.00812 10.0766,3.53343 9.79196,3.2325 C9.50733,2.93156 9.03264,2.91834 8.73171,3.20297 L2.31449,9.27241 C2.14819,9.4297 2.04819,9.62981 2.01448,9.8386 C2.00308,9.89058 1.99707,9.94459 1.99707,10 C1.99707,10.0576 2.00356,10.1137 2.01585,10.1675 C2.05084,10.3733 2.15039,10.5702 2.31449,10.7254 L8.73171,16.7949 Z"
                    />
                  </g>
                </g>
              </svg>
            </w-icon>
          </template>
          <template #next-year>
            <w-icon>
              <svg
                viewBox="0 0 20 20"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g stroke-width="1" fill-rule="evenodd">
                  <g fill="currentColor">
                    <path
                      d="M11.2654,3.20511 C10.9644,2.92049 10.4897,2.93371 10.2051,3.23464 C9.92049,3.53558 9.93371,4.01027 10.2346,4.29489 L15.4737,9.25 L2.75,9.25 C2.33579,9.25 2,9.58579 2,10.0000012 C2,10.4142 2.33579,10.75 2.75,10.75 L15.476,10.75 L10.2346,15.7073 C9.93371,15.9919 9.92049,16.4666 10.2051,16.7675 C10.4897,17.0684 10.9644,17.0817 11.2654,16.797 L17.6826,10.7276 C17.8489,10.5703 17.9489,10.3702 17.9826,10.1614 C17.994,10.1094 18,10.0554 18,10.0000012 C18,9.94241 17.9935,9.88633 17.9812,9.83246 C17.9462,9.62667 17.8467,9.42976 17.6826,9.27455 L11.2654,3.20511 Z"
                    />
                  </g>
                </g>
              </svg>
            </w-icon>
          </template>
        </w-date-picker>
      </div>
      <div class="line" />
      <div class="block">
        <div class="demonstration">日期范围选择器</div>
        <w-date-picker
          v-model="value2"
          type="daterange"
          start-placeholder="开始日期"
          end-placeholder="结束日期"
          format="YYYY/MM/DD"
          value-format="YYYY-MM-DD"
          unlink-panels
        >
          <template #prev-month>
            <w-icon><CaretLeft /></w-icon>
          </template>
          <template #next-month>
            <w-icon><CaretRight /></w-icon>
          </template>
          <template #prev-year>
            <w-icon>
              <svg
                viewBox="0 0 20 20"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g stroke-width="1" fill-rule="evenodd">
                  <g fill="currentColor">
                    <path
                      d="M8.73171,16.7949 C9.03264,17.0795 9.50733,17.0663 9.79196,16.7654 C10.0766,16.4644 10.0634,15.9897 9.76243,15.7051 L4.52339,10.75 L17.2471,10.75 C17.6613,10.75 17.9971,10.4142 17.9971,10 C17.9971,9.58579 17.6613,9.25 17.2471,9.25 L4.52112,9.25 L9.76243,4.29275 C10.0634,4.00812 10.0766,3.53343 9.79196,3.2325 C9.50733,2.93156 9.03264,2.91834 8.73171,3.20297 L2.31449,9.27241 C2.14819,9.4297 2.04819,9.62981 2.01448,9.8386 C2.00308,9.89058 1.99707,9.94459 1.99707,10 C1.99707,10.0576 2.00356,10.1137 2.01585,10.1675 C2.05084,10.3733 2.15039,10.5702 2.31449,10.7254 L8.73171,16.7949 Z"
                    />
                  </g>
                </g>
              </svg>
            </w-icon>
          </template>
          <template #next-year>
            <w-icon>
              <svg
                viewBox="0 0 20 20"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g stroke-width="1" fill-rule="evenodd">
                  <g fill="currentColor">
                    <path
                      d="M11.2654,3.20511 C10.9644,2.92049 10.4897,2.93371 10.2051,3.23464 C9.92049,3.53558 9.93371,4.01027 10.2346,4.29489 L15.4737,9.25 L2.75,9.25 C2.33579,9.25 2,9.58579 2,10.0000012 C2,10.4142 2.33579,10.75 2.75,10.75 L15.476,10.75 L10.2346,15.7073 C9.93371,15.9919 9.92049,16.4666 10.2051,16.7675 C10.4897,17.0684 10.9644,17.0817 11.2654,16.797 L17.6826,10.7276 C17.8489,10.5703 17.9489,10.3702 17.9826,10.1614 C17.994,10.1094 18,10.0554 18,10.0000012 C18,9.94241 17.9935,9.88633 17.9812,9.83246 C17.9462,9.62667 17.8467,9.42976 17.6826,9.27455 L11.2654,3.20511 Z"
                    />
                  </g>
                </g>
              </svg>
            </w-icon>
          </template>
        </w-date-picker>
      </div>
    </div>
    <div class="container">
      <div class="line" />
      <div class="block">
        <div class="demonstration">月份范围选择器</div>
        <w-date-picker
          v-model="value3"
          type="monthrange"
          start-placeholder="开始月份"
          end-placeholder="结束月份"
          format="YYYY/MM/DD"
          value-format="YYYY-MM-DD"
          unlink-panels
        >
          <template #prev-month>
            <w-icon><CaretLeft /></w-icon>
          </template>
          <template #next-month>
            <w-icon><CaretRight /></w-icon>
          </template>
          <template #prev-year>
            <w-icon>
              <svg
                viewBox="0 0 20 20"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g stroke-width="1" fill-rule="evenodd">
                  <g fill="currentColor">
                    <path
                      d="M8.73171,16.7949 C9.03264,17.0795 9.50733,17.0663 9.79196,16.7654 C10.0766,16.4644 10.0634,15.9897 9.76243,15.7051 L4.52339,10.75 L17.2471,10.75 C17.6613,10.75 17.9971,10.4142 17.9971,10 C17.9971,9.58579 17.6613,9.25 17.2471,9.25 L4.52112,9.25 L9.76243,4.29275 C10.0634,4.00812 10.0766,3.53343 9.79196,3.2325 C9.50733,2.93156 9.03264,2.91834 8.73171,3.20297 L2.31449,9.27241 C2.14819,9.4297 2.04819,9.62981 2.01448,9.8386 C2.00308,9.89058 1.99707,9.94459 1.99707,10 C1.99707,10.0576 2.00356,10.1137 2.01585,10.1675 C2.05084,10.3733 2.15039,10.5702 2.31449,10.7254 L8.73171,16.7949 Z"
                    />
                  </g>
                </g>
              </svg>
            </w-icon>
          </template>
          <template #next-year>
            <w-icon>
              <svg
                viewBox="0 0 20 20"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g stroke-width="1" fill-rule="evenodd">
                  <g fill="currentColor">
                    <path
                      d="M11.2654,3.20511 C10.9644,2.92049 10.4897,2.93371 10.2051,3.23464 C9.92049,3.53558 9.93371,4.01027 10.2346,4.29489 L15.4737,9.25 L2.75,9.25 C2.33579,9.25 2,9.58579 2,10.0000012 C2,10.4142 2.33579,10.75 2.75,10.75 L15.476,10.75 L10.2346,15.7073 C9.93371,15.9919 9.92049,16.4666 10.2051,16.7675 C10.4897,17.0684 10.9644,17.0817 11.2654,16.797 L17.6826,10.7276 C17.8489,10.5703 17.9489,10.3702 17.9826,10.1614 C17.994,10.1094 18,10.0554 18,10.0000012 C18,9.94241 17.9935,9.88633 17.9812,9.83246 C17.9462,9.62667 17.8467,9.42976 17.6826,9.27455 L11.2654,3.20511 Z"
                    />
                  </g>
                </g>
              </svg>
            </w-icon>
          </template>
        </w-date-picker>
      </div>
      <div class="line" />
      <div class="block">
        <div class="demonstration">年份范围选择器</div>
        <w-date-picker
          v-model="value4"
          type="yearrange"
          range-separator="-"
          start-placeholder="开始年份"
          end-placeholder="结束年份"
        >
          <template #prev-year>
            <w-icon>
              <svg
                viewBox="0 0 20 20"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g stroke-width="1" fill-rule="evenodd">
                  <g fill="currentColor">
                    <path
                      d="M8.73171,16.7949 C9.03264,17.0795 9.50733,17.0663 9.79196,16.7654 C10.0766,16.4644 10.0634,15.9897 9.76243,15.7051 L4.52339,10.75 L17.2471,10.75 C17.6613,10.75 17.9971,10.4142 17.9971,10 C17.9971,9.58579 17.6613,9.25 17.2471,9.25 L4.52112,9.25 L9.76243,4.29275 C10.0634,4.00812 10.0766,3.53343 9.79196,3.2325 C9.50733,2.93156 9.03264,2.91834 8.73171,3.20297 L2.31449,9.27241 C2.14819,9.4297 2.04819,9.62981 2.01448,9.8386 C2.00308,9.89058 1.99707,9.94459 1.99707,10 C1.99707,10.0576 2.00356,10.1137 2.01585,10.1675 C2.05084,10.3733 2.15039,10.5702 2.31449,10.7254 L8.73171,16.7949 Z"
                    />
                  </g>
                </g>
              </svg>
            </w-icon>
          </template>
          <template #next-year>
            <w-icon>
              <svg
                viewBox="0 0 20 20"
                version="1.1"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g stroke-width="1" fill-rule="evenodd">
                  <g fill="currentColor">
                    <path
                      d="M11.2654,3.20511 C10.9644,2.92049 10.4897,2.93371 10.2051,3.23464 C9.92049,3.53558 9.93371,4.01027 10.2346,4.29489 L15.4737,9.25 L2.75,9.25 C2.33579,9.25 2,9.58579 2,10.0000012 C2,10.4142 2.33579,10.75 2.75,10.75 L15.476,10.75 L10.2346,15.7073 C9.93371,15.9919 9.92049,16.4666 10.2051,16.7675 C10.4897,17.0684 10.9644,17.0817 11.2654,16.797 L17.6826,10.7276 C17.8489,10.5703 17.9489,10.3702 17.9826,10.1614 C17.994,10.1094 18,10.0554 18,10.0000012 C18,9.94241 17.9935,9.88633 17.9812,9.83246 C17.9462,9.62667 17.8467,9.42976 17.6826,9.27455 L11.2654,3.20511 Z"
                    />
                  </g>
                </g>
              </svg>
            </w-icon>
          </template>
        </w-date-picker>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { CaretLeft, CaretRight } from '@win-design-next/icons-vue'

const value1 = ref('')
const value2 = ref('')
const value3 = ref('')
const value4 = ref('')
</script>

<style scoped>
.demo-date-picker-icon {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}

.demo-date-picker-icon .block {
  padding: 30px 0;
  text-align: center;
  flex: 1;
}

.demo-date-picker-icon .container {
  flex: 1;
}

.demo-date-picker-icon .demonstration {
  display: block;
  color: var(--w3-font-color-second);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

:::

### API 文档

### 属性

| 参数                  | 说明                                                                                                              | 类型                                                                                                                                                           | 默认值              | Version |
| --------------------- | ----------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------- |
| model-value / v-model | 绑定值，如果它是数组，长度应该是 2                                                                                | ^[number] / ^[string] / ^[object]`Date \| [Date, Date] \| [string, string]`                                                                                    | ''                  |
| readonly              | 只读                                                                                                              | ^[boolean]                                                                                                                                                     | false               |
| disabled              | 禁用                                                                                                              | ^[boolean]                                                                                                                                                     | false               |
| size                  | 输入框尺寸                                                                                                        | ^[enum]`'' \| 'large' \| 'default' \| 'mini' \| 'small'`                                                                                                       | —                   |
| editable              | 文本框可输入                                                                                                      | ^[boolean]                                                                                                                                                     | true                |
| clearable             | 是否显示清除按钮                                                                                                  | ^[boolean]                                                                                                                                                     | true                |
| placeholder           | 非范围选择时的占位内容                                                                                            | ^[string]                                                                                                                                                      | ''                  |
| start-placeholder     | 范围选择时开始日期的占位内容                                                                                      | ^[string]                                                                                                                                                      | —                   |
| end-placeholder       | 范围选择时结束日期的占位内容                                                                                      | ^[string]                                                                                                                                                      | —                   |
| type                  | 显示类型                                                                                                          | ^[enum]`'year' \| 'years' \|'month' \| 'months' \| 'date' \| 'dates' \| 'datetime' \| 'week' \| 'datetimerange' \| 'daterange' \| 'monthrange' \| 'yearrange'` | date                |
| format                | 显示在输入框中的格式                                                                                              | 参见 [date formats](/zh-CN/component/date-picker#date-formats)                                                                                                 | YYYY-MM-DD          |
| popper-class          | DatePicker 下拉框的类名                                                                                           | ^[string]                                                                                                                                                      | —                   |
| popper-options        | 自定义 popper 选项，更多请参考 [popper.js](https://popper.js.org/docs/v2/)                                        | ^[object]`Partial<PopperOptions>`                                                                                                                              | {}                  |
| range-separator       | 选择范围时的分隔符                                                                                                | ^[string]                                                                                                                                                      | '-'                 |
| default-value         | 可选，选择器打开时默认显示的时间                                                                                  | ^[object]`Date \| [Date, Date]`                                                                                                                                | —                   |
| default-time          | 范围选择时选中日期所使用的当日内具体时刻                                                                          | ^[object]`Date \| [Date, Date]`                                                                                                                                | —                   |
| value-format          | 可选，绑定值的格式。 不指定则绑定值为 Date 对象                                                                   | 参见 [date formats](/zh-CN/component/date-picker#date-formats)                                                                                                 | —                   |
| id                    | 等价于原生 input `id` 属性                                                                                        | ^[string] / ^[object]`[string, string]`                                                                                                                        | —                   |
| name                  | 等价于原生 input `name` 属性                                                                                      | ^[string] / ^[object]`[string, string]`                                                                                                                        | ''                  |
| unlink-panels         | 在范围选择器里取消两个日期面板之间的联动                                                                          | ^[boolean]                                                                                                                                                     | false               |
| suffix-icon           | 自定义后缀图标                                                                                                    | ^[string] / ^[object]`Component`                                                                                                                               | ''                  |
| clear-icon            | 自定义清除图标                                                                                                    | ^[string] / ^[object]`Component`                                                                                                                               | `CircleCloseFilled` |
| validate-event        | 是否触发表单验证                                                                                                  | ^[boolean]                                                                                                                                                     | true                |
| disabled-date         | 一个用来判断该日期是否被禁用的函数，接受一个 Date 对象作为参数。 应该返回一个 Boolean 值。                        | ^[Function]`(data: Date) => boolean`                                                                                                                           | —                   |
| shortcuts             | 设置快捷选项，需要传入数组对象                                                                                    | ^[object]`Array<{ text: string, value: Date \| Function }>`                                                                                                    | []                  |
| cell-class-name       | 设置自定义类名                                                                                                    | ^[Function]`(data: Date) => string`                                                                                                                            | —                   |
| teleported            | 是否将 date-picker 的下拉列表插入至 body 元素                                                                     | ^[boolean]                                                                                                                                                     | true                |
| empty-values          | 组件的空值配置 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations)               | ^[array]                                                                                                                                                       | —                   |
| value-on-clear        | 清空选项的值 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations)                 | ^[string] / ^[number] / ^[boolean] / ^[Function]                                                                                                               | —                   |
| fallback-placements   | Tooltip 可用的 positions 请查看[popper.js 文档](https://popper.js.org/docs/v2/modifiers/flip/#fallbackplacements) | ^[arrary]`Placement[]`                                                                                                                                         | —                   |
| placement             | 下拉框出现的位置                                                                                                  | `Placement`                                                                                                                                                    | bottom              |
| trigger-suffix        | 点击后缀图标触发下拉框                                                                                            | ^[boolean]                                                                                                                                                     | false               | V0.0.8  |
| plain                 | 朴素的 DatePicker                                                                                                 | ^[boolean]                                                                                                                                                     | false               | V0.0.8  |
| emit-formatted-value  | 是否返回格式化后的日期值                                                                                          | ^[boolean]                                                                                                                                                     | false               | V0.0.8  |

### 事件

| 事件名          | 说明                                    | 类型                                                                                      |
| --------------- | --------------------------------------- | ----------------------------------------------------------------------------------------- |
| change          | 用户确认选定的值时触发                  | ^[Function]`(val: typeof v-model) => void`                                                |
| blur            | 在组件 Input 失去焦点时触发             | ^[Function]`(e: FocusEvent) => void`                                                      |
| focus           | 在组件 Input 获得焦点时触发             | ^[Function]`(e: FocusEvent) => void`                                                      |
| clear           | 可清空的模式下用户点击清空按钮时触发    | ^[Function]`() => void`                                                                   |
| calendar-change | 在日历所选日期更改时触发                | ^[Function]`(val: [Date, null \| Date]) => void`                                          |
| panel-change    | 当日期面板改变时触发。                  | ^[Function]`(date: Date \| [Date, Date], mode: 'month' \| 'year', view?: string) => void` |
| visible-change  | 当 DatePicker 的下拉列表出现/消失时触发 | ^[Function]`(visibility: boolean) => void`                                                |

### 插槽

| 名称            | 说明                 |
| --------------- | -------------------- |
| default         | 自定义单元格内容     |
| range-separator | 自定义范围分割符内容 |

### 暴露

| 插槽名      | 说明               | 类型                    |
| ----------- | ------------------ | ----------------------- |
| focus       | 使组件获取焦点     | ^[Function]`() => void` |
| blur        | 使组件失去焦点     | ^[Function]`() => void` |
| handleOpen  | 打开日期选择器弹窗 | ^[Function]`() => void` |
| handleClose | 关闭日期选择器弹窗 | ^[Function]`() => void` |

## DateTimePicker 日期时间选择器

在同一个选择器里选择日期和时间

### 示例

:::demo 通过设置`type`属性为`datetime`，即可在同一个选择器里同时进行日期和时间的选择。 快捷方式的使用方法与 Date Picker 相同。

```vue
<template>
  <w-radio-group v-model="size" aria-label="size control">
    <w-radio-button value="large">large</w-radio-button>
    <w-radio-button value="default">default</w-radio-button>
    <w-radio-button value="small">small</w-radio-button>
    <w-radio-button value="mini">mini</w-radio-button>
  </w-radio-group>
  <div class="demo-datetime-picker">
    <div class="block">
      <span class="demonstration">默认</span>
      <w-date-picker
        v-model="value1"
        :size="size"
        type="datetime"
        placeholder="请选择日期时间"
      />
    </div>
    <div class="block">
      <span class="demonstration">带快捷选项</span>
      <w-date-picker
        v-model="value2"
        :size="size"
        type="datetime"
        placeholder="请选择日期时间"
        :shortcuts="shortcuts"
      />
    </div>
  </div>
  <div class="demo-datetime-picker">
    <div class="block">
      <span class="demonstration">默认时间</span>
      <w-date-picker
        v-model="value3"
        type="datetime"
        :size="size"
        placeholder="请选择日期时间"
        :default-time="defaultTime"
      />
    </div>
    <div class="block">
      <span class="demonstration">轻量化</span>
      <w-date-picker
        v-model="value4"
        type="datetime"
        :size="size"
        plain
        placeholder="请选择日期时间"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const size = ref('default')
const value1 = ref('')
const value2 = ref('')
const value3 = ref('')
const value4 = ref('')
const defaultTime = new Date(2000, 1, 1, 12, 0, 0)

const shortcuts = [
  {
    text: '今天',
    value: new Date(),
  },
  {
    text: '昨天',
    value: () => {
      const date = new Date()
      date.setDate(date.getDate() - 1)
      return date
    },
  },
  {
    text: '一周前',
    value: () => {
      const date = new Date()
      date.setDate(date.getDate() - 7)
      return date
    },
  },
]
</script>

<style scoped>
.demo-datetime-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}
.demo-datetime-picker .block {
  padding: 30px 0;
  text-align: center;
  flex: 1;
}
.demo-datetime-picker .demonstration {
  display: block;
  color: var(--w3-font-color-second);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="demo-datetime-picker">
    <div class="block">
      <span class="demonstration">Emits Date object</span>
      <div class="demonstration">Value: {{ value1 }}</div>
      <w-date-picker
        v-model="value1"
        type="datetime"
        placeholder="请选择日期时间"
        format="YYYY/MM/DD HH:mm:ss"
      />
    </div>
    <div class="block">
      <span class="demonstration">Use value-format</span>
      <div class="demonstration">Value：{{ value2 }}</div>
      <w-date-picker
        v-model="value2"
        type="datetime"
        placeholder="请选择日期时间"
        format="YYYY/MM/DD hh:mm:ss"
        value-format="YYYY-MM-DD h:m:s a"
      />
    </div>
    <div class="block">
      <span class="demonstration">Timestamp</span>
      <div class="demonstration">Value：{{ value3 }}</div>
      <w-date-picker
        v-model="value3"
        type="datetime"
        placeholder="请选择日期时间"
        format="YYYY/MM/DD hh:mm:ss"
        value-format="x"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref('')
const value2 = ref('')
const value3 = ref('')
</script>

<style scoped>
.demo-datetime-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
}
.demo-datetime-picker .block {
  padding: 30px 0;
  text-align: center;
  flex: 1;
}
.demo-datetime-picker .demonstration {
  display: block;
  color: var(--w3-font-color-second);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="demo-datetime-picker">
    <div class="block">
      <w-date-picker
        v-model="value1"
        type="datetime"
        placeholder="请选择器日期时间"
        format="YYYY-MM-DD HH:mm:ss"
        date-format="MMM DD, YYYY"
        time-format="HH:mm"
      />
    </div>
    <div class="block">
      <w-date-picker
        v-model="value2"
        type="datetimerange"
        start-placeholder="请选择开始时间"
        end-placeholder="请选择结束时间"
        format="YYYY-MM-DD HH:mm:ss"
        date-format="YYYY/MM/DD ddd"
        time-format="A hh:mm:ss"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref('')
const value2 = ref('')
</script>

<style scoped>
.demo-datetime-picker {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: stretch;
}
.demo-datetime-picker .block {
  padding: 30px 0;
  text-align: center;
}
</style>
```

:::

:::demo 设置`type`为`datetimerange`即可选择日期和时间范围

```vue
<template>
  <div class="block">
    <span class="demonstration">默认</span>
    <w-date-picker
      v-model="value1"
      type="datetimerange"
      range-separator="-"
      start-placeholder="请选择开始时间"
      end-placeholder="请选择结束时间"
    />
  </div>
  <div class="block">
    <span class="demonstration">带快捷选项</span>
    <w-date-picker
      v-model="value2"
      type="datetimerange"
      :shortcuts="shortcuts"
      range-separator="-"
      start-placeholder="请选择开始时间"
      end-placeholder="请选择结束时间"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref<[Date, Date]>([
  new Date(2000, 10, 10, 10, 10),
  new Date(2000, 10, 11, 10, 10),
])
const value2 = ref('')

const shortcuts = [
  {
    text: '最近一周',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setDate(start.getDate() - 7)
      return [start, end]
    },
  },
  {
    text: '最近一个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 1)
      return [start, end]
    },
  },
  {
    text: '最近三个月',
    value: () => {
      const end = new Date()
      const start = new Date()
      start.setMonth(start.getMonth() - 3)
      return [start, end]
    },
  },
]
</script>

<style scoped>
.block {
  padding: 30px 0;
  text-align: center;
  flex: 1;
}
.block .demonstration {
  display: block;
  color: var(--w3-font-color-second);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

:::

:::demo 使用`datetimerange`进行范围选择时，在日期选择面板中选定起始与结束的日期，默认会使用该日期的`00:00:00`作为起始与结束的时刻；通过选项`default-time`可以控制选中起始与结束日期时所使用的具体时刻。 我们可以使用 `default-time` 属性来控制它。 `default-time`接受一个数组，其中第一项控制起始日期的具体时刻，第二项控制结束日期的具体时刻。 第一项控制开始日期的时间值，第二项控制结束日期的时间值。

```vue
<template>
  <div class="block">
    <span class="demonstration">默认时间为 12:00:00</span>
    <w-date-picker
      v-model="value1"
      type="datetimerange"
      start-placeholder="请选择开始时间"
      end-placeholder="请选择结束时间"
      :default-time="defaultTime1"
    />
  </div>
  <div class="block">
    <span class="demonstration"> 开始时间 12:00:00, 结束时间 08:00:00 </span>
    <w-date-picker
      v-model="value2"
      type="datetimerange"
      start-placeholder="请选择开始时间"
      end-placeholder="请选择结束时间"
      :default-time="defaultTime2"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref('')
const value2 = ref('')

const defaultTime1 = new Date(2000, 1, 1, 12, 0, 0) // '12:00:00'
const defaultTime2: [Date, Date] = [
  new Date(2000, 1, 1, 12, 0, 0),
  new Date(2000, 2, 1, 8, 0, 0),
] // '12:00:00', '08:00:00'
</script>

<style scoped>
.block {
  padding: 30px 0;
  text-align: center;
  flex: 1;
}
.block .demonstration {
  display: block;
  color: var(--w3-font-color-second);
  font-size: 14px;
  margin-bottom: 16px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="demo-datetime-picker-icon">
    <div class="block">
      <w-date-picker
        v-model="value1"
        type="datetime"
        placeholder="请选择日期时间"
        format="YYYY-MM-DD HH:mm:ss"
        date-format="MMM DD, YYYY"
        time-format="HH:mm"
      >
        <template #prev-month>
          <w-icon><CaretLeft /></w-icon>
        </template>
        <template #next-month>
          <w-icon><CaretRight /></w-icon>
        </template>
        <template #prev-year>
          <w-icon>
            <svg
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke-width="1" fill-rule="evenodd">
                <g fill="currentColor">
                  <path
                    d="M8.73171,16.7949 C9.03264,17.0795 9.50733,17.0663 9.79196,16.7654 C10.0766,16.4644 10.0634,15.9897 9.76243,15.7051 L4.52339,10.75 L17.2471,10.75 C17.6613,10.75 17.9971,10.4142 17.9971,10 C17.9971,9.58579 17.6613,9.25 17.2471,9.25 L4.52112,9.25 L9.76243,4.29275 C10.0634,4.00812 10.0766,3.53343 9.79196,3.2325 C9.50733,2.93156 9.03264,2.91834 8.73171,3.20297 L2.31449,9.27241 C2.14819,9.4297 2.04819,9.62981 2.01448,9.8386 C2.00308,9.89058 1.99707,9.94459 1.99707,10 C1.99707,10.0576 2.00356,10.1137 2.01585,10.1675 C2.05084,10.3733 2.15039,10.5702 2.31449,10.7254 L8.73171,16.7949 Z"
                  />
                </g>
              </g>
            </svg>
          </w-icon>
        </template>
        <template #next-year>
          <w-icon>
            <svg
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke-width="1" fill-rule="evenodd">
                <g fill="currentColor">
                  <path
                    d="M11.2654,3.20511 C10.9644,2.92049 10.4897,2.93371 10.2051,3.23464 C9.92049,3.53558 9.93371,4.01027 10.2346,4.29489 L15.4737,9.25 L2.75,9.25 C2.33579,9.25 2,9.58579 2,10.0000012 C2,10.4142 2.33579,10.75 2.75,10.75 L15.476,10.75 L10.2346,15.7073 C9.93371,15.9919 9.92049,16.4666 10.2051,16.7675 C10.4897,17.0684 10.9644,17.0817 11.2654,16.797 L17.6826,10.7276 C17.8489,10.5703 17.9489,10.3702 17.9826,10.1614 C17.994,10.1094 18,10.0554 18,10.0000012 C18,9.94241 17.9935,9.88633 17.9812,9.83246 C17.9462,9.62667 17.8467,9.42976 17.6826,9.27455 L11.2654,3.20511 Z"
                  />
                </g>
              </g>
            </svg>
          </w-icon>
        </template>
      </w-date-picker>
    </div>
    <div class="block">
      <w-date-picker
        v-model="value2"
        type="datetimerange"
        start-placeholder="请选择开始日期时间"
        end-placeholder="请选择结束日期时间"
        format="YYYY-MM-DD HH:mm:ss"
        date-format="YYYY/MM/DD ddd"
        time-format="A hh:mm:ss"
        unlink-panels
      >
        <template #prev-month>
          <w-icon><CaretLeft /></w-icon>
        </template>
        <template #next-month>
          <w-icon><CaretRight /></w-icon>
        </template>
        <template #prev-year>
          <w-icon>
            <svg
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke-width="1" fill-rule="evenodd">
                <g fill="currentColor">
                  <path
                    d="M8.73171,16.7949 C9.03264,17.0795 9.50733,17.0663 9.79196,16.7654 C10.0766,16.4644 10.0634,15.9897 9.76243,15.7051 L4.52339,10.75 L17.2471,10.75 C17.6613,10.75 17.9971,10.4142 17.9971,10 C17.9971,9.58579 17.6613,9.25 17.2471,9.25 L4.52112,9.25 L9.76243,4.29275 C10.0634,4.00812 10.0766,3.53343 9.79196,3.2325 C9.50733,2.93156 9.03264,2.91834 8.73171,3.20297 L2.31449,9.27241 C2.14819,9.4297 2.04819,9.62981 2.01448,9.8386 C2.00308,9.89058 1.99707,9.94459 1.99707,10 C1.99707,10.0576 2.00356,10.1137 2.01585,10.1675 C2.05084,10.3733 2.15039,10.5702 2.31449,10.7254 L8.73171,16.7949 Z"
                  />
                </g>
              </g>
            </svg>
          </w-icon>
        </template>
        <template #next-year>
          <w-icon>
            <svg
              viewBox="0 0 20 20"
              version="1.1"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke-width="1" fill-rule="evenodd">
                <g fill="currentColor">
                  <path
                    d="M11.2654,3.20511 C10.9644,2.92049 10.4897,2.93371 10.2051,3.23464 C9.92049,3.53558 9.93371,4.01027 10.2346,4.29489 L15.4737,9.25 L2.75,9.25 C2.33579,9.25 2,9.58579 2,10.0000012 C2,10.4142 2.33579,10.75 2.75,10.75 L15.476,10.75 L10.2346,15.7073 C9.93371,15.9919 9.92049,16.4666 10.2051,16.7675 C10.4897,17.0684 10.9644,17.0817 11.2654,16.797 L17.6826,10.7276 C17.8489,10.5703 17.9489,10.3702 17.9826,10.1614 C17.994,10.1094 18,10.0554 18,10.0000012 C18,9.94241 17.9935,9.88633 17.9812,9.83246 C17.9462,9.62667 17.8467,9.42976 17.6826,9.27455 L11.2654,3.20511 Z"
                  />
                </g>
              </g>
            </svg>
          </w-icon>
        </template>
      </w-date-picker>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { CaretLeft, CaretRight } from '@win-design-next/icons-vue'

const value1 = ref('')
const value2 = ref('')
</script>

<style scoped>
.demo-datetime-picker-icon {
  display: flex;
  width: 100%;
  padding: 0;
  flex-wrap: wrap;
  justify-content: space-around;
  align-items: stretch;
}
.demo-datetime-picker-icon .block {
  padding: 30px 0;
  text-align: center;
}
</style>
```

:::

### API 文档

### Attributes

| 参数                  | 说明                                                                                                | 类型                                                                                           | 默认值              | Version |
| --------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------- | ------- |
| model-value / v-model | 绑定值，如果它是数组，长度应该是 2                                                                  | ^[number] / ^[string] / ^[object]`Date \| [Date, Date] \| [string, string]`                    | —                   |
| readonly              | 只读                                                                                                | ^[boolean]                                                                                     | false               |
| disabled              | 禁用                                                                                                | ^[boolean]                                                                                     | false               |
| editable              | 文本框可输入                                                                                        | ^[boolean]                                                                                     | true                |
| clearable             | 是否显示清除按钮                                                                                    | ^[boolean]                                                                                     | true                |
| size                  | 输入框尺寸                                                                                          | ^[enum]`'large' \| 'default' \| 'mini' \| 'small'`                                             | default             |
| placeholder           | 非范围选择时的占位内容                                                                              | ^[string]                                                                                      | —                   |
| start-placeholder     | 范围选择时开始日期的占位内容                                                                        | ^[string]                                                                                      | —                   |
| end-placeholder       | 范围选择时结束日期的占位内容                                                                        | ^[string]                                                                                      | —                   |
| arrow-control         | 是否使用箭头进行时间选择                                                                            | ^[boolean]                                                                                     | false               |
| type                  | 显示类型                                                                                            | ^[enum]`'year' \| 'month' \| 'date' \| 'datetime' \| 'week' \| 'datetimerange' \| 'daterange'` | date                |
| format                | 显示在输入框中的格式                                                                                | ^[string] see [date formats](/zh-CN/component/date-picker#date-formats)                        | YYYY-MM-DD HH:mm:ss |
| popper-class          | DateTimePicker 下拉框的类名                                                                         | ^[string]                                                                                      | —                   |
| range-separator       | 选择范围时的分隔符                                                                                  | ^[string]                                                                                      | '-'                 |
| default-value         | 可选，选择器打开时默认显示的时间                                                                    | ^[object]`Date \| [Date, Date]`                                                                | —                   |
| default-time          | 选择日期后的默认时间值。 如未指定则默认时间值为 `00:00:00`                                          | ^[object]`Date \| [Date, Date]`                                                                | —                   |
| value-format          | 可选，绑定值的格式。 不指定则绑定值为 Date 对象                                                     | ^[string] see [date formats](https://day.js.org/docs/en/display/format)                        | —                   |
| date-format           | 可选，时间选择器下拉列表中显示的日期格式                                                            | ^[string] see [date formats](https://day.js.org/docs/en/display/format)                        | —                   |
| time-format           | 可选，时间选择器下拉列表中显示的时间格式                                                            | ^[string] see [date formats](https://day.js.org/docs/en/display/format)                        | —                   |
| id                    | 等价于原生 input `id` 属性                                                                          | ^[string] / ^[object]`[string, string]`                                                        | —                   |
| name                  | 等价于原生 input `name` 属性                                                                        | ^[string]                                                                                      | —                   |
| unlink-panels         | 在范围选择器里取消两个日期面板之间的联动                                                            | ^[boolean]                                                                                     | false               |
| prefix-icon           | 自定义前缀图标组件                                                                                  | ^[string] / `Component`                                                                        |                     |
| clear-icon            | 自定义清除图标                                                                                      | ^[string] / `Component`                                                                        | CircleCloseFilled   |
| shortcuts             | 设置快捷选项，需要传入数组对象                                                                      | ^[object]`Array<{ text: string, value: Date \| Function }>`                                    | —                   |
| disabled-date         | 一个用来判断该日期是否被禁用的函数，接受一个 Date 对象作为参数。 应该返回一个 Boolean 值。          | ^[Function]`(data: Date) => boolean`                                                           | —                   |
| cell-class-name       | 设置自定义类名                                                                                      | ^[Function]`(data: Date) => string`                                                            | —                   |
| teleported            | 是否将 datetime-picker 的下拉列表插入至 body 元素                                                   | ^[boolean]                                                                                     | true                |
| empty-values          | 组件的空值配置 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations) | ^[array]                                                                                       | —                   |
| value-on-clear        | 清空选项的值 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations)   | ^[string] / ^[number] / ^[boolean] / ^[Function]                                               | —                   |
| show-now              | 是否显示 now 按钮                                                                                   | ^[boolean]                                                                                     | true                |
| plain                 | 朴素的 DatePicker                                                                                   | ^[boolean]                                                                                     |
| false                 | V0.0.8                                                                                              |
| emit-formatted-value  | 是否返回格式化后的日期值                                                                            | ^[boolean]                                                                                     | false               | V0.0.8  |

### 事件

| 事件名          | 说明                                                                                                     | 回调参数                      |
| --------------- | -------------------------------------------------------------------------------------------------------- | ----------------------------- |
| change          | 用户确认选定的值时触发                                                                                   | value                         |
| blur            | 在组件 Input 失去焦点时触发                                                                              | `(e: FocusEvent)`             |
| focus           | 在组件 Input 获得焦点时触发                                                                              | `(e: FocusEvent)`             |
| clear           | 可清空的模式下用户点击清空按钮时触发                                                                     | ^[Function]`() => void`       |
| calendar-change | 如果用户没有选择日期，那默认展示当前日的月份。 选中日历日期后会执行的回调，只有当 `datetimerange` 才生效 | [Date, Date]                  |
| visible-change  | 当 DateTimePicker 的下拉列表出现/消失时触发                                                              | 出现时为 true，隐藏时为 false |

### Slots

| 插槽名          | 说明                 |
| --------------- | -------------------- |
| default         | 自定义单元格内容     |
| range-separator | 自定义范围分割符内容 |
| prev-month      | 上个月的图标         |
| next-month      | 下个月的图标         |
| prev-year       | 上一年图标           |
| next-year       | 下一年图标           |

### Exposes

| 方法名 | 说明           | 类型                    |
| ------ | -------------- | ----------------------- |
| focus  | 使组件获取焦点 | ^[Function]`() => void` |
| blur   | 使组件失去焦点 | ^[Function]`() => void` |

---

## TimePicker 时间选择器

用于选择或输入日期

### 示例

:::demo 提供了两种交互方式：默认情况下通过鼠标滚轮进行选择，打开`arrow-control`属性则通过界面上的箭头进行选择。通过`now`属性可以设置是否显示此刻按钮。

```vue
<template>
  <w-radio-group v-model="size" aria-label="size control">
    <w-radio-button value="large">large</w-radio-button>
    <w-radio-button value="default">default</w-radio-button>
    <w-radio-button value="small">small</w-radio-button>
    <w-radio-button value="mini">mini</w-radio-button>
  </w-radio-group>
  <div class="example-basic">
    <w-time-picker v-model="value1" :size="size" placeholder="请选择时间" />
    <w-time-picker v-model="value2" :size="size" now placeholder="请选择时间" />
  </div>
  <div class="example-basic">
    <w-time-picker
      v-model="value3"
      :size="size"
      arrow-control
      placeholder="请选择时间"
    />
    <w-time-picker
      v-model="value4"
      :size="size"
      plain
      placeholder="请选择时间"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref()
const value2 = ref()
const size = ref('default')
const value3 = ref('')
const value4 = ref('')
</script>

<style>
.example-basic .w3-date-editor {
  margin: 30px 8px 0 0;
}
</style>
```

:::

:::demo 通过 `disabledHours`，`disabledMinutes` 和 `disabledSeconds` 限制可选时间范围。,

```vue
<template>
  <div class="example-basic">
    <w-time-picker
      v-model="value1"
      :disabled-hours="disabledHours"
      :disabled-minutes="disabledMinutes"
      :disabled-seconds="disabledSeconds"
      placeholder="请选择时间"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref(new Date(2016, 9, 10, 18, 30))

const makeRange = (start: number, end: number) => {
  const result: number[] = []
  for (let i = start; i <= end; i++) {
    result.push(i)
  }
  return result
}
const disabledHours = () => {
  return makeRange(0, 16).concat(makeRange(19, 23))
}
const disabledMinutes = (hour: number) => {
  if (hour === 17) {
    return makeRange(0, 29)
  }
  if (hour === 18) {
    return makeRange(31, 59)
  }
}
const disabledSeconds = (hour: number, minute: number) => {
  if (hour === 18 && minute === 30) {
    return makeRange(1, 59)
  }
}
</script>

<style>
.example-basic .w3-date-editor {
  margin: 8px;
}
</style>
```

:::

:::demo 添加`is-range`属性即可选择时间范围。 同样支持 `arrow-control` 属性。

```vue
<template>
  <div class="demo-range">
    <w-time-picker
      v-model="value1"
      is-range
      range-separator="-"
      start-placeholder="开始时间"
      end-placeholder="结束时间"
    />
    <w-time-picker
      v-model="value2"
      is-range
      arrow-control
      range-separator="-"
      start-placeholder="开始时间"
      end-placeholder="结束时间"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref<[Date, Date]>([
  new Date(2016, 9, 10, 8, 40),
  new Date(2016, 9, 10, 9, 40),
])
const value2 = ref<[Date, Date]>([
  new Date(2016, 9, 10, 8, 40),
  new Date(2016, 9, 10, 9, 40),
])
</script>

<style>
.demo-range .w3-date-editor {
  margin: 8px;
}

.demo-range .w3-range-separator {
  box-sizing: content-box;
}
</style>
```

:::

### API 文档

### Attributes

| 参数                        | 说明                                                                                                | 类型                                                                                            | 默认值            | Version |
| --------------------------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------- | ------- |
| model-value / v-model       | 绑定值，如果它是数组，长度应该是 2                                                                  | ^[number] / ^[string] / ^[object]`Date \| [Date, Date] \| [number, number] \| [string, string]` | ''                |
| readonly                    | 完全只读                                                                                            | ^[boolean]                                                                                      | false             |
| disabled                    | 禁用                                                                                                | ^[boolean]                                                                                      | false             |
| editable                    | 文本框可输入                                                                                        | ^[boolean]                                                                                      | true              |
| clearable                   | 是否显示清除按钮                                                                                    | ^[boolean]                                                                                      | true              |
| size                        | 输入框尺寸                                                                                          | ^[enum]`'large' \| 'default' \| 'small' \| 'small'`                                             | —                 |
| placeholder                 | 非范围选择时的占位内容                                                                              | ^[string]                                                                                       | ''                |
| start-placeholder           | 范围选择时开始日期的占位内容                                                                        | ^[string]                                                                                       | —                 |
| end-placeholder             | 范围选择时结束日期的占位内容                                                                        | ^[string]                                                                                       | —                 |
| is-range                    | 是否为时间范围选择                                                                                  | ^[boolean]                                                                                      | false             |
| arrow-control               | 是否使用箭头进行时间选择                                                                            | ^[boolean]                                                                                      | false             |
| popper-class                | TimePicker 下拉框的类名                                                                             | ^[string]                                                                                       | ''                |
| range-separator             | 选择范围时的分隔符                                                                                  | ^[string]                                                                                       | '-'               |
| format                      | 显示在输入框中的格式                                                                                | ^[string] see [date formats](/zh-CN/component/date-picker#date-formats)                         | —                 |
| default-value               | 可选，选择器打开时默认显示的时间                                                                    | ^[Date] / ^[object]`[Date, Date]`                                                               | —                 |
| value-format                | 可选，绑定值的格式。 不指定则绑定值为 Date 对象                                                     | ^[string] 参考 [日期格式](/zh-CN/component/date-picker#date-formats)                            | —                 |
| id                          | 等价于原生 input `id` 属性                                                                          | ^[string] / ^[object]`[string, string]`                                                         | —                 |
| name                        | 等价于原生 input `name` 属性                                                                        | ^[string]                                                                                       | ''                |
| aria-label ^(a11y)          | 等价于原生 input `aria-label` 属性                                                                  | ^[string]                                                                                       | —                 |
| prefix-icon                 | 自定义前缀图标                                                                                      | ^[string] / ^[Component]                                                                        |                   |
| clear-icon                  | 自定义清除图标                                                                                      | ^[string] / ^[Component]                                                                        | CircleCloseFilled |
| disabled-hours              | 禁止选择部分小时选项                                                                                | ^[Function]`(role: string, comparingDate?: Dayjs) => number[]`                                  | —                 |
| disabled-minutes            | 禁止选择部分分钟选项                                                                                | ^[Function]`(hour: number, role: string, comparingDate?: Dayjs) => number[]`                    | —                 |
| disabled-seconds            | 禁止选择部分秒选项                                                                                  | ^[Function]`(hour: number, minute: number, role: string, comparingDate?: Dayjs) => number[]`    | —                 |
| teleported                  | 是否将 popover 的下拉列表镜像至 body 元素                                                           | ^[boolean]                                                                                      | true              |
| tabindex                    | 输入框的 tabindex                                                                                   | ^[string] / ^[number]                                                                           | 0                 |
| empty-values                | 组件的空值配置 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations) | ^[array]                                                                                        | —                 |
| value-on-clear              | 清空选项的值 [参考 config-provider](/zh-CN/component/config-provider#empty-values-configurations)   | ^[string] / ^[number] / ^[boolean] / ^[Function]                                                | —                 |
| label ^(a11y) ^(deprecated) | 等价于原生 input `aria-label` 属性                                                                  | ^[string]                                                                                       | —                 |
| plain                       | 朴素的 TimePicker                                                                                   | ^[boolean]                                                                                      | false             | V0.0.8  |
| emit-formatted-value        | 是否返回格式化后的日期值                                                                            | ^[boolean]                                                                                      | false             | V0.0.8  |

### 事件

| 事件名         | 说明                                    | 类型                                                                                                         |
| -------------- | --------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| change         | 用户确认选定的值时触发                  | ^[Function]`(val: number \| string \| Date \| [number, number] \| [string, string] \| [Date, Date]) => void` |
| blur           | 在组件 Input 失去焦点时触发             | ^[Function]`(e: FocusEvent) => void`                                                                         |
| focus          | 在组件 Input 获得焦点时触发             | ^[Function]`(e: FocusEvent) => void`                                                                         |
| clear          | 可清空的模式下用户点击清空按钮时触发    | ^[Function]`() => void`                                                                                      |
| visible-change | 当 TimePicker 的下拉列表出现/消失时触发 | ^[Function]`(visibility: boolean) => void`                                                                   |

### 暴露

| 名称        | 说明               | Type                    |
| ----------- | ------------------ | ----------------------- |
| focus       | 使组件获取焦点     | ^[Function]`() => void` |
| blur        | 使组件失去焦点     | ^[Function]`() => void` |
| handleOpen  | 打开时间选择器弹窗 | ^[Function]`() => void` |
| handleClose | 关闭时间选择器弹窗 | ^[Function]`() => void` |

---

