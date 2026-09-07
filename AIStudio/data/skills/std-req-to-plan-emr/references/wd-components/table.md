## Table 表格

用于展示多条结构类似的数据， 可对数据进行排序、筛选、对比或其他自定义操作。

### 示例

:::demo 当 `w-table` 元素中注入 `data` 对象数组后，在 `w-table-column` 中用 `prop` 属性来对应对象中的键名即可填入数据，用 `label` 属性来定义表格的列名。 可以使用 `width` 属性来定义列宽。当内容太长时，它会分成多行。您可以使用 show-overflow-tooltip 将其保留在一行中。属性 show-overflow-tooltip 接受一个布尔值。 为 true 时多余的内容会在 hover 时以 tooltip 的形式显示出来。

```vue
<template>
  <w-radio-group v-model="size" class="mb-4">
    <w-radio value="extra-large">超大(40px)</w-radio>
    <w-radio value="large">大(36px)</w-radio>
    <w-radio value="default">默认(32px)</w-radio>
    <w-radio value="small">小(28px)</w-radio>
    <w-radio value="mini">超小(20px)</w-radio>
  </w-radio-group>
  <w-table :size="size" :data="tableData" style="width: 100%">
    <w-table-column
      width="120"
      prop="name"
      label="药品名称"
      show-overflow-tooltip
    />
    <w-table-column width="180" prop="size" label="规格" />
    <w-table-column width="180" prop="unit" label="单位" />
    <w-table-column prop="count" label="数量" />
    <w-table-column prop="price" label="单价(元)" align="right" />
  </w-table>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const tableData = [
  {
    name: '炔诺酮片',
    size: '625微克/片',
    count: '10',
    unit: '片',
    price: '10.00',
    total: '100.00',
    status: true,
    date: '2024-04-18 12:00',
  },
  {
    name: '扶达胶囊',
    size: '100毫克/粒',
    count: '5',
    unit: '粒',
    price: '12.00',
    total: '60.00',
    status: false,
    date: '2024-04-18 12:00',
  },
  {
    name: '百士欣胶囊',
    size: '10毫克/粒',
    count: '2',
    unit: '粒',
    price: '22.50',
    total: '45.00',
    status: true,
    date: '2024-04-18 12:00',
  },
  {
    name: '别嘌醇片',
    size: '100毫克/片',
    count: '10',
    unit: '片',
    price: '14.50',
    total: '145.00',
    status: false,
    date: '2024-04-18 12:00',
  },
  {
    name: '复方维生素注射液',
    size: '2毫升/支',
    count: '10',
    unit: '支',
    price: '12.73',
    total: '127.30',
    status: true,
    date: '2024-04-18 12:00',
  },
]

const size = ref('default')
</script>
```

:::

:::demo 可以通过指定 Table 组件的 `row-class-name` 属性来为 Table 中的某一行添加 class， 这样就可以自定义每一行的样式了。

```vue
<template>
  <w-table
    :data="tableData"
    style="width: 100%"
    :row-class-name="tableRowClassName"
  >
    <w-table-column prop="date" label="Date" width="180" />
    <w-table-column prop="name" label="Name" width="180" />
    <w-table-column prop="address" label="Address" />
  </w-table>
</template>

<script lang="ts" setup>
interface User {
  date: string
  name: string
  address: string
}

const tableRowClassName = ({
  row,
  rowIndex,
}: {
  row: User
  rowIndex: number
}) => {
  if (rowIndex === 1) {
    return 'warning-row'
  } else if (rowIndex === 3) {
    return 'success-row'
  }
  return ''
}

const tableData: User[] = [
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
]
</script>

<style>
.w3-table .warning-row {
  --w3-table-tr-bg-color: var(--w3-color-warning-plain);
}
.w3-table .success-row {
  --w3-table-tr-bg-color: var(--w3-color-success-plain);
}
</style>
```

:::

:::demo 只要在 `w-table` 元素中定义了 `height` 属性，即可实现固定表头的表格，而不需要额外的代码。固定列需要使用 `fixed` 属性，它接受 `Boolean` 值。 如果为 `true`, 列将被左侧固定. 它还接受传入字符串，left 或 right，表示左边固定还是右边固定。

```vue
<template>
  <w-table
    :data="tableData"
    style="width: 100%"
    height="200"
    :h-scrollbar-size="12"
    :scrollbar-size="12"
  >
    <w-table-column fixed prop="date" label="Date" width="150" />
    <w-table-column prop="name" label="Name" width="120" />
    <w-table-column prop="state" label="State" width="120" />
    <w-table-column prop="city" label="City" width="320" />
    <w-table-column prop="address" label="Address" width="600" />
    <w-table-column prop="zip" fixed="right" label="Zip" width="120" />
  </w-table>
</template>

<script lang="ts" setup>
const tableData = [
  {
    date: '2016-05-03',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
  {
    date: '2016-05-08',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
  {
    date: '2016-05-06',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
  {
    date: '2016-05-07',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
]
</script>
```

:::

:::demo 通过设置 `max-height` 属性为 `w-table` 指定最大高度。 此时若表格所需的高度大于最大高度，则会显示一个滚动条。

```vue
<template>
  <w-table :data="tableData" style="width: 100%" max-height="250">
    <w-table-column fixed prop="date" label="Date" width="150" />
    <w-table-column prop="name" label="Name" width="120" />
    <w-table-column prop="state" label="State" width="120" />
    <w-table-column prop="city" label="City" width="120" />
    <w-table-column prop="address" label="Address" width="600" />
    <w-table-column prop="zip" label="Zip" width="120" />
    <w-table-column fixed="right" label="Operations" min-width="120">
      <template #default="scope">
        <w-button
          link
          type="primary"
          size="small"
          @click.prevent="deleteRow(scope.$index)"
        >
          Remove
        </w-button>
      </template>
    </w-table-column>
  </w-table>
  <w-button class="mt-4" style="width: 100%" @click="onAddItem">
    Add Item
  </w-button>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import dayjs from 'dayjs'

const now = new Date()

const tableData = ref([
  {
    date: '2016-05-01',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
  {
    date: '2016-05-03',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
])

const deleteRow = (index: number) => {
  tableData.value.splice(index, 1)
}

const onAddItem = () => {
  now.setDate(now.getDate() + 1)
  tableData.value.push({
    date: dayjs(now).format('YYYY-MM-DD'),
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  })
}
</script>
```

:::

:::demo 只需要将 w-table-column 放置于 w-table-column 中，你可以实现组头。

```vue
<template>
  <w-table :data="tableData" style="width: 100%">
    <w-table-column prop="date" label="Date" width="150" />
    <w-table-column label="Delivery Info">
      <w-table-column prop="name" label="Name" width="120" />
      <w-table-column label="Address Info">
        <w-table-column prop="state" label="State" width="120" />
        <w-table-column prop="city" label="City" width="120" />
        <w-table-column prop="address" label="Address" />
        <w-table-column prop="zip" label="Zip" width="120" />
      </w-table-column>
    </w-table-column>
  </w-table>
</template>

<script lang="ts" setup>
const tableData = [
  {
    date: '2016-05-03',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
  {
    date: '2016-05-08',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
  {
    date: '2016-05-06',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
  {
    date: '2016-05-07',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
  },
]
</script>
```

:::

:::demo Table 组件提供了单选的支持， 只需要配置 `highlight-current-row` 属性即可实现单选。 之后由 `current-change` 事件来管理选中时触发的事件，它会传入 `currentRow`，`oldCurrentRow`。 如果需要显示索引，可以增加一列 `w-table-column`，设置 `type` 属性为 `index` 即可显示从 1 开始的索引号。

```vue
<template>
  <w-table
    ref="singleTableRef"
    :data="tableData"
    highlight-current-row
    style="width: 100%"
    @current-change="handleCurrentChange"
  >
    <w-table-column type="index" width="50" />
    <w-table-column property="date" label="Date" width="150" />
    <w-table-column property="name" label="Name" width="120" />
    <w-table-column property="address" label="Address" />
  </w-table>
  <div style="margin-top: 20px">
    <w-button @click="setCurrent(tableData[1])">Select second row</w-button>
    <w-button @click="setCurrent()">Clear selection</w-button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { WTable } from 'win-design-next'

interface User {
  date: string
  name: string
  address: string
}

const currentRow = ref()
const singleTableRef = ref<InstanceType<typeof WTable>>()

const setCurrent = (row?: User) => {
  singleTableRef.value!.setCurrentRow(row)
}
const handleCurrentChange = (val: User | undefined) => {
  currentRow.value = val
}
const tableData: User[] = [
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
]
</script>
```

:::

:::demo 实现多选非常简单: 手动添加一个 `w-table-column`，设 `type` 属性为 `selection` 即可；

```vue
<template>
  <w-table
    ref="multipleTableRef"
    :data="tableData"
    row-key="id"
    style="width: 100%"
    @selection-change="handleSelectionChange"
  >
    <w-table-column type="selection" width="50" :selectable="selectable" />
    <w-table-column width="200" prop="name" label="药品名称" />
    <w-table-column prop="size" label="规格" />
    <w-table-column prop="count" label="数量" />
    <w-table-column prop="price" label="单价(元)" align="right" />
    <w-table-column prop="total" label="金额(元)" align="right" />
  </w-table>
  <div style="margin-top: 20px">
    <w-button @click="toggleSelection([tableData[1], tableData[2]])">
      选中 1、2 行
    </w-button>
    <w-button @click="toggleSelection([tableData[1], tableData[2]], false)">
      取消选中 1、2 行
    </w-button>
    <w-button @click="toggleSelection()">取消选中所有行</w-button>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { TableInstance } from 'win-design-next'

interface User {
  id: number
  name: string
  size: string
  count: string
  unit: string
  price: string
  total: string
}

const multipleTableRef = ref<TableInstance>()
const multipleSelection = ref<User[]>([])

const selectable = (row: User) => ![3].includes(row.id)
const toggleSelection = (rows?: User[], ignoreSelectable?: boolean) => {
  if (rows) {
    rows.forEach((row) => {
      multipleTableRef.value!.toggleRowSelection(
        row,
        undefined,
        ignoreSelectable
      )
    })
  } else {
    multipleTableRef.value!.clearSelection()
  }
}
const handleSelectionChange = (val: User[]) => {
  multipleSelection.value = val
}

const tableData: User[] = [
  {
    id: 3,
    name: '炔诺酮片',
    size: '625微克/片',
    count: '10',
    unit: '片',
    price: '10.00',
    total: '100.00',
  },
  {
    id: 4,
    name: '扶达胶囊',
    size: '100毫克/粒',
    count: '5',
    unit: '粒',
    price: '12.00',
    total: '60.00',
  },
  {
    id: 5,
    name: '百士欣胶囊',
    size: '10毫克/粒',
    count: '2',
    unit: '粒',
    price: '22.50',
    total: '45.00',
  },
  {
    id: 6,
    name: '别嘌醇片',
    size: '100毫克/片',
    count: '10',
    unit: '片',
    price: '14.50',
    total: '145.00',
  },
  {
    id: 7,
    name: '复方维生素注射液',
    size: '2毫升/支',
    count: '10',
    unit: '支',
    price: '12.73',
    total: '127.30',
  },
  {
    id: 8,
    name: '注射用盐酸多巴胺',
    size: '20毫升/支',
    count: '6',
    unit: '支',
    price: '49.80',
    total: '298.80',
  },
]
</script>
```

:::

:::demo 在列中设置 `sortable` 属性即可实现以该列为基准的排序， 接受一个 `Boolean`，默认为 `false`。 可以通过 Table 的 `default-sort` 属性设置默认的排序列和排序顺序。 可以使用 `sort-method` 或者 `sort-by` 使用自定义的排序规则。 如果需要后端排序，需将 `sortable` 设置为 `custom`，同时在 Table 上监听 `sort-change` 事件， 在事件回调中可以获取当前排序的字段名和排序顺序，从而向接口请求排序后的表格数据。 在本例中，我们还使用了 `formatter` 属性，它用于格式化指定列的值， 接受一个 `Function`，会传入两个参数：`row` 和 `column`， 可以根据自己的需求进行处理。

```vue
<template>
  <w-table
    :data="tableData"
    :default-sort="{ prop: 'date', order: 'descending' }"
    style="width: 100%"
  >
    <w-table-column prop="date" label="Date" sortable width="180" />
    <w-table-column prop="name" label="Name" width="180" />
    <w-table-column prop="address" label="Address" :formatter="formatter" />
  </w-table>
</template>

<script lang="ts" setup>
import type { TableColumnCtx } from 'win-design-next'

interface User {
  date: string
  name: string
  address: string
}

const formatter = (row: User, column: TableColumnCtx<User>) => {
  return row.address
}

const tableData: User[] = [
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
]
</script>
```

:::

:::demo 在列中设置 `filters` 和 `filter-method` 属性即可开启该列的筛选， filters 是一个数组，`filter-method` 是一个方法，它用于决定某些数据是否显示， 会传入三个参数：`value`, `row` 和 `column`。

```vue
<template>
  <w-button @click="resetDateFilter">清除 date filter</w-button>
  <w-button @click="clearFilter">清除全部 filters</w-button>
  <w-table
    ref="tableRef"
    class="mt-4"
    row-key="date"
    :data="tableData"
    style="width: 100%"
  >
    <w-table-column
      prop="date"
      label="Date"
      sortable
      width="180"
      column-key="date"
      :filters="[
        { text: '2016-05-01', value: '2016-05-01' },
        { text: '2016-05-02', value: '2016-05-02' },
        { text: '2016-05-03', value: '2016-05-03' },
        { text: '2016-05-04', value: '2016-05-04' },
      ]"
      :filter-method="filterHandler"
    />
    <w-table-column prop="name" label="Name" width="180" />
    <w-table-column prop="address" label="Address" :formatter="formatter" />

    <w-table-column
      prop="tag"
      label="Tag"
      width="100"
      :filters="[
        { text: 'Home', value: 'Home' },
        { text: 'Office', value: 'Office' },
      ]"
      :filter-method="filterTag"
      filter-placement="bottom-end"
    >
      <template #default="scope">
        <w-tag
          :type="scope.row.tag === 'Home' ? 'primary' : 'success'"
          disable-transitions
          >{{ scope.row.tag }}</w-tag
        >
      </template>
    </w-table-column>
  </w-table>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { TableColumnCtx, TableInstance } from 'win-design-next'

interface User {
  date: string
  name: string
  address: string
  tag: string
}

const tableRef = ref<TableInstance>()

const resetDateFilter = () => {
  tableRef.value!.clearFilter(['date'])
}
const clearFilter = () => {
  tableRef.value!.clearFilter()
}
const formatter = (row: User, column: TableColumnCtx<User>) => {
  return row.address
}
const filterTag = (value: string, row: User) => {
  return row.tag === value
}
const filterHandler = (
  value: string,
  row: User,
  column: TableColumnCtx<User>
) => {
  const property = column['property']
  return row[property] === value
}

const tableData: User[] = [
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
    tag: 'Home',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
    tag: 'Office',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
    tag: 'Home',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
    tag: 'Office',
  },
]
</script>
```

:::

:::demo 通过 `slot` 可以获取到 row, column, \$index 和 store（table 内部的状态管理）的数据，用法参考 demo。

```vue
<template>
  <w-table :data="tableData" style="width: 100%">
    <w-table-column label="Date" width="180">
      <template #default="scope">
        <div style="display: flex; align-items: center">
          <w-icon><Time /></w-icon>
          <span style="margin-left: 10px">{{ scope.row.date }}</span>
        </div>
      </template>
    </w-table-column>
    <w-table-column label="Name" width="180">
      <template #default="scope">
        <w-popover effect="light" trigger="hover" placement="top" width="auto">
          <template #default>
            <div>name: {{ scope.row.name }}</div>
            <div>address: {{ scope.row.address }}</div>
          </template>
          <template #reference>
            <w-tag>{{ scope.row.name }}</w-tag>
          </template>
        </w-popover>
      </template>
    </w-table-column>
    <w-table-column label="Operations">
      <template #default="scope">
        <w-button
          text
          type="primary"
          size="small"
          @click="handleEdit(scope.$index, scope.row)"
        >
          编辑
        </w-button>
        <w-button
          text
          size="small"
          type="danger"
          @click="handleDelete(scope.$index, scope.row)"
        >
          删除
        </w-button>
      </template>
    </w-table-column>
  </w-table>
</template>

<script lang="ts" setup>
import { Time } from '@win-design-next/icons-vue'

interface User {
  date: string
  name: string
  address: string
}

const handleEdit = (index: number, row: User) => {
  console.log(index, row)
}
const handleDelete = (index: number, row: User) => {
  console.log(index, row)
}

const tableData: User[] = [
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
]
</script>
```

:::

:::demo 通过设置 [slot](https://v3.vuejs.org/guide/component-slots.html) 来自定义表头。

```vue
<template>
  <w-table :data="filterTableData" style="width: 100%">
    <w-table-column label="Date" prop="date" />
    <w-table-column label="Name" prop="name" />
    <w-table-column align="right">
      <template #header>
        <w-input v-model="search" size="small" placeholder="请输入关键词搜索" />
      </template>
      <template #default="scope">
        <w-button
          text
          type="primary"
          size="small"
          @click="handleEdit(scope.$index, scope.row)"
        >
          编辑
        </w-button>
        <w-button
          text
          size="small"
          type="danger"
          @click="handleDelete(scope.$index, scope.row)"
        >
          删除
        </w-button>
      </template>
    </w-table-column>
  </w-table>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

interface User {
  date: string
  name: string
  address: string
}

const search = ref('')
const filterTableData = computed(() =>
  tableData.filter(
    (data) =>
      !search.value ||
      data.name.toLowerCase().includes(search.value.toLowerCase())
  )
)
const handleEdit = (index: number, row: User) => {
  console.log(index, row)
}
const handleDelete = (index: number, row: User) => {
  console.log(index, row)
}

const tableData: User[] = [
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'John',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Morgan',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Jessy',
    address: 'No. 189, Grove St, Los Angeles',
  },
]
</script>
```

:::

:::demo 通过设置 type="expand" 和 slot 可以开启展开行功能， w-table-column 的模板会被渲染成为展开行的内容，展开行可访问的属性与使用自定义列模板时的 slot 相同。

```vue
<template>
  switch parent border: <w-switch v-model="parentBorder" /> switch child border:
  <w-switch v-model="childBorder" />
  <w-table
    class="mt-4"
    :data="tableData"
    :border="parentBorder"
    style="width: 100%"
  >
    <w-table-column type="expand">
      <template #default="props">
        <div m="4">
          <p m="t-0 b-2">State: {{ props.row.state }}</p>
          <p m="t-0 b-2">City: {{ props.row.city }}</p>
          <p m="t-0 b-2">Address: {{ props.row.address }}</p>
          <p m="t-0 b-2">Zip: {{ props.row.zip }}</p>
          <h3>Family</h3>
          <w-table :data="props.row.family" :border="childBorder">
            <w-table-column label="Name" prop="name" />
            <w-table-column label="State" prop="state" />
            <w-table-column label="City" prop="city" />
            <w-table-column label="Address" prop="address" />
            <w-table-column label="Zip" prop="zip" />
          </w-table>
        </div>
      </template>
    </w-table-column>
    <w-table-column label="Date" prop="date" />
    <w-table-column label="Name" prop="name" />
  </w-table>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const parentBorder = ref(true)
const childBorder = ref(true)
const tableData = [
  {
    date: '2016-05-03',
    name: 'Tom',
    state: 'California',
    city: 'San Francisco',
    address: '3650 21st St, San Francisco',
    zip: 'CA 94114',
    family: [
      {
        name: 'Jerry',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
      {
        name: 'Spike',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
      {
        name: 'Tyke',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
    ],
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    state: 'California',
    city: 'San Francisco',
    address: '3650 21st St, San Francisco',
    zip: 'CA 94114',
    family: [
      {
        name: 'Jerry',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
      {
        name: 'Spike',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
      {
        name: 'Tyke',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
    ],
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    state: 'California',
    city: 'San Francisco',
    address: '3650 21st St, San Francisco',
    zip: 'CA 94114',
    family: [
      {
        name: 'Jerry',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
      {
        name: 'Spike',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
      {
        name: 'Tyke',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
    ],
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    state: 'California',
    city: 'San Francisco',
    address: '3650 21st St, San Francisco',
    zip: 'CA 94114',
    family: [
      {
        name: 'Jerry',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
      {
        name: 'Spike',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
      {
        name: 'Tyke',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
    ],
  },
  {
    date: '2016-05-08',
    name: 'Tom',
    state: 'California',
    city: 'San Francisco',
    address: '3650 21st St, San Francisco',
    zip: 'CA 94114',
    family: [
      {
        name: 'Jerry',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
      {
        name: 'Spike',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
      {
        name: 'Tyke',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
    ],
  },
  {
    date: '2016-05-06',
    name: 'Tom',
    state: 'California',
    city: 'San Francisco',
    address: '3650 21st St, San Francisco',
    zip: 'CA 94114',
    family: [
      {
        name: 'Jerry',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
      {
        name: 'Spike',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
      {
        name: 'Tyke',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
    ],
  },
  {
    date: '2016-05-07',
    name: 'Tom',
    state: 'California',
    city: 'San Francisco',
    address: '3650 21st St, San Francisco',
    zip: 'CA 94114',
    family: [
      {
        name: 'Jerry',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
      {
        name: 'Spike',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
      {
        name: 'Tyke',
        state: 'California',
        city: 'San Francisco',
        address: '3650 21st St, San Francisco',
        zip: 'CA 94114',
      },
    ],
  },
]
</script>
```

:::

:::demo 支持树类型的数据的显示。 当 row 中包含 `children` 字段时，被视为树形数据。 渲染嵌套数据需要 prop 的 `row-key`。 此外，子行数据可以异步加载。 设置 Table 的`lazy`属性为 true 与加载函数 `load` 。 通过指定 row 中的`hasChildren`字段来指定哪些行是包含子节点。 `children` 与`hasChildren`都可以通过 `tree-props `配置。

```vue
<template>
  <div>
    <w-table
      :data="tableData"
      style="width: 100%; margin-bottom: 20px"
      row-key="id"
      border
      default-expand-all
    >
      <w-table-column prop="date" label="Date" sortable />
      <w-table-column prop="name" label="Name" sortable />
      <w-table-column prop="address" label="Address" sortable />
    </w-table>

    <w-table
      :data="tableData1"
      style="width: 100%"
      row-key="id"
      border
      lazy
      :load="load"
      :tree-props="{ children: 'children', hasChildren: 'hasChildren' }"
    >
      <w-table-column prop="date" label="Date" />
      <w-table-column prop="name" label="Name" />
      <w-table-column prop="address" label="Address" />
    </w-table>
  </div>
</template>

<script lang="ts" setup>
interface User {
  id: number
  date: string
  name: string
  address: string
  hasChildren?: boolean
  children?: User[]
}

const load = (
  row: User,
  treeNode: unknown,
  resolve: (data: User[]) => void
) => {
  setTimeout(() => {
    resolve([
      {
        id: 31,
        date: '2016-05-01',
        name: 'wangxiaohu',
        address: 'No. 189, Grove St, Los Angeles',
      },
      {
        id: 32,
        date: '2016-05-01',
        name: 'wangxiaohu',
        address: 'No. 189, Grove St, Los Angeles',
      },
    ])
  }, 1000)
}

const tableData: User[] = [
  {
    id: 1,
    date: '2016-05-02',
    name: 'wangxiaohu',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    id: 2,
    date: '2016-05-04',
    name: 'wangxiaohu',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    id: 3,
    date: '2016-05-01',
    name: 'wangxiaohu',
    address: 'No. 189, Grove St, Los Angeles',
    children: [
      {
        id: 31,
        date: '2016-05-01',
        name: 'wangxiaohu',
        address: 'No. 189, Grove St, Los Angeles',
      },
      {
        id: 32,
        date: '2016-05-01',
        name: 'wangxiaohu',
        address: 'No. 189, Grove St, Los Angeles',
      },
    ],
  },
  {
    id: 4,
    date: '2016-05-03',
    name: 'wangxiaohu',
    address: 'No. 189, Grove St, Los Angeles',
  },
]

const tableData1: User[] = [
  {
    id: 1,
    date: '2016-05-02',
    name: 'wangxiaohu',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    id: 2,
    date: '2016-05-04',
    name: 'wangxiaohu',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    id: 3,
    date: '2016-05-01',
    name: 'wangxiaohu',
    hasChildren: true,
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    id: 4,
    date: '2016-05-03',
    name: 'wangxiaohu',
    address: 'No. 189, Grove St, Los Angeles',
  },
]
</script>
```

:::

:::demo 当 `treeProps.checkStrictly` 为 true，父节点和子节点的选择状态不再关联， 也就是说，当选择父节点时，它的子节点将不被选择； 当 `treeProps.checkStrictly` 是 false，父节点和子节点的选择状态将与子节点的选择状态相关联， 也就是说，当选择父节点时，将选择其所有子节点。

```vue
<template>
  <w-radio-group v-model="treeProps.checkStrictly" class="mb-4">
    <w-radio-button :value="true" label="true" />
    <w-radio-button :value="false" label="false" />
  </w-radio-group>
  <w-table
    :data="tableData"
    :tree-props="treeProps"
    row-key="id"
    default-expand-all
  >
    <w-table-column type="selection" width="55" :selectable="selectable" />
    <w-table-column prop="date" label="Date" />
    <w-table-column prop="name" label="Name" />
    <w-table-column prop="address" label="Address" />
  </w-table>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

interface User {
  id: number
  date: string
  name: string
  address: string
  hasChildren?: boolean
  children?: User[]
}

const treeProps = reactive({
  checkStrictly: false,
})

const selectable = (row: User) => ![1, 31].includes(row.id)

const tableData: User[] = [
  {
    id: 1,
    date: '2016-05-02',
    name: 'wangxiaohu',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    id: 2,
    date: '2016-05-04',
    name: 'wangxiaohu',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    id: 3,
    date: '2016-05-01',
    name: 'wangxiaohu',
    address: 'No. 189, Grove St, Los Angeles',
    children: [
      {
        id: 31,
        date: '2016-05-01',
        name: 'wangxiaohu',
        address: 'No. 189, Grove St, Los Angeles',
      },
      {
        id: 32,
        date: '2016-05-01',
        name: 'wangxiaohu',
        address: 'No. 189, Grove St, Los Angeles',
      },
    ],
  },
  {
    id: 4,
    date: '2016-05-03',
    name: 'wangxiaohu',
    address: 'No. 189, Grove St, Los Angeles',
  },
]
</script>
```

:::

:::demo 将 `show-summary` 设置为`true`就会在表格尾部展示合计行。 默认情况下，对于合计行，第一列不进行数据求合操作，而是显示「合计」二字（可通过`sum-text`配置），其余列会将本列所有数值进行求合操作，并显示出来。 当然，你也可以定义自己的合计逻辑。 使用 `summary-method` 并传入一个方法，返回一个数组，这个数组中的各项就会显示在合计行的各列中，可以是一个 VNode 或 String， 具体可以参考本例中的第二个表格。

```vue
<template>
  <w-table :data="tableData" border show-summary style="width: 100%">
    <w-table-column prop="id" label="ID" width="180" />
    <w-table-column prop="name" label="Name" />
    <w-table-column prop="amount1" sortable label="Amount 1" />
    <w-table-column prop="amount2" sortable label="Amount 2" />
    <w-table-column prop="amount3" sortable label="Amount 3" />
  </w-table>

  <w-table
    :data="tableData"
    border
    height="200"
    :summary-method="getSummaries"
    show-summary
    style="width: 100%; margin-top: 20px"
  >
    <w-table-column prop="id" label="ID" width="180" />
    <w-table-column prop="name" label="Name" />
    <w-table-column prop="amount1" label="Cost 1 ($)" />
    <w-table-column prop="amount2" label="Cost 2 ($)" />
    <w-table-column prop="amount3" label="Cost 3 ($)" />
  </w-table>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import type { VNode } from 'vue'
import type { TableColumnCtx } from 'win-design-next'

interface Product {
  id: string
  name: string
  amount1: string
  amount2: string
  amount3: number
}

interface SummaryMethodProps<T = Product> {
  columns: TableColumnCtx<T>[]
  data: T[]
}

const getSummaries = (param: SummaryMethodProps) => {
  const { columns, data } = param
  const sums: (string | VNode)[] = []
  columns.forEach((column, index) => {
    if (index === 0) {
      sums[index] = h('div', { style: { textDecoration: 'underline' } }, [
        'Total Cost',
      ])
      return
    }
    const values = data.map((item) => Number(item[column.property]))
    if (!values.every((value) => Number.isNaN(value))) {
      sums[index] = `$ ${values.reduce((prev, curr) => {
        const value = Number(curr)
        if (!Number.isNaN(value)) {
          return prev + curr
        } else {
          return prev
        }
      }, 0)}`
    } else {
      sums[index] = 'N/A'
    }
  })

  return sums
}

const tableData: Product[] = [
  {
    id: '12987122',
    name: 'Tom',
    amount1: '234',
    amount2: '3.2',
    amount3: 10,
  },
  {
    id: '12987123',
    name: 'Tom',
    amount1: '165',
    amount2: '4.43',
    amount3: 12,
  },
  {
    id: '12987124',
    name: 'Tom',
    amount1: '324',
    amount2: '1.9',
    amount3: 9,
  },
  {
    id: '12987125',
    name: 'Tom',
    amount1: '621',
    amount2: '2.2',
    amount3: 17,
  },
  {
    id: '12987126',
    name: 'Tom',
    amount1: '539',
    amount2: '4.1',
    amount3: 15,
  },
]
</script>
```

:::

:::demo 通过给 table 传入`span-method`方法可以实现合并行或列， 方法的参数是一个对象，里面包含当前行` row`、当前列 ` column`、当前行号` rowIndex`、当前列号 ` columnIndex` 四个属性。 该函数可以返回一个包含两个元素的数组，第一个元素代表 ` rowspan`，第二个元素代表 ` colspan`。 也可以返回一个键名为` rowspan` 和` colspan` 的对象。

```vue
<template>
  <div>
    <w-table
      :data="tableData"
      :span-method="arraySpanMethod"
      border
      style="width: 100%"
    >
      <w-table-column prop="id" label="ID" width="180" />
      <w-table-column prop="name" label="Name" />
      <w-table-column prop="amount1" sortable label="Amount 1" />
      <w-table-column prop="amount2" sortable label="Amount 2" />
      <w-table-column prop="amount3" sortable label="Amount 3" />
    </w-table>

    <w-table
      :data="tableData"
      :span-method="objectSpanMethod"
      border
      style="width: 100%; margin-top: 20px"
    >
      <w-table-column prop="id" label="ID" width="180" />
      <w-table-column prop="name" label="Name" />
      <w-table-column prop="amount1" label="Amount 1" />
      <w-table-column prop="amount2" label="Amount 2" />
      <w-table-column prop="amount3" label="Amount 3" />
    </w-table>
  </div>
</template>

<script lang="ts" setup>
import type { TableColumnCtx } from 'win-design-next'

interface User {
  id: string
  name: string
  amount1: string
  amount2: string
  amount3: number
}

interface SpanMethodProps {
  row: User
  column: TableColumnCtx<User>
  rowIndex: number
  columnIndex: number
}

const arraySpanMethod = ({
  row,
  column,
  rowIndex,
  columnIndex,
}: SpanMethodProps) => {
  if (rowIndex % 2 === 0) {
    if (columnIndex === 0) {
      return [1, 2]
    } else if (columnIndex === 1) {
      return [0, 0]
    }
  }
}

const objectSpanMethod = ({
  row,
  column,
  rowIndex,
  columnIndex,
}: SpanMethodProps) => {
  if (columnIndex === 0) {
    if (rowIndex % 2 === 0) {
      return {
        rowspan: 2,
        colspan: 1,
      }
    } else {
      return {
        rowspan: 0,
        colspan: 0,
      }
    }
  }
}

const tableData: User[] = [
  {
    id: '12987122',
    name: 'Tom',
    amount1: '234',
    amount2: '3.2',
    amount3: 10,
  },
  {
    id: '12987123',
    name: 'Tom',
    amount1: '165',
    amount2: '4.43',
    amount3: 12,
  },
  {
    id: '12987124',
    name: 'Tom',
    amount1: '324',
    amount2: '1.9',
    amount3: 9,
  },
  {
    id: '12987125',
    name: 'Tom',
    amount1: '621',
    amount2: '2.2',
    amount3: 17,
  },
  {
    id: '12987126',
    name: 'Tom',
    amount1: '539',
    amount2: '4.1',
    amount3: 15,
  },
]
</script>
```

:::

:::demo 通过给` type=index` 的列传入 index 属性，可以自定义索引。 该属性传入数字时，将作为索引的起始值。 也可以传入一个方法，它提供当前行的行号（从 `0` 开始）作为参数，返回值将作为索引展示。

```vue
<template>
  <w-table :data="tableData" style="width: 100%">
    <w-table-column type="index" :index="indexMethod" />
    <w-table-column prop="date" label="Date" width="180" />
    <w-table-column prop="name" label="Name" width="180" />
    <w-table-column prop="address" label="Address" />
  </w-table>
</template>

<script lang="ts" setup>
const indexMethod = (index: number) => {
  return index * 2
}
const tableData = [
  {
    date: '2016-05-03',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
    tag: 'Home',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
    tag: 'Office',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
    tag: 'Home',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    state: 'California',
    city: 'Los Angeles',
    address: 'No. 189, Grove St, Los Angeles',
    zip: 'CA 90036',
    tag: 'Office',
  },
]
</script>
```

:::

:::demo

```vue
<template>
  <w-radio-group v-model="tableLayout" class="mb-4">
    <w-radio-button value="fixed">fixed</w-radio-button>
    <w-radio-button value="auto">auto</w-radio-button>
  </w-radio-group>
  <w-table :data="tableData" :table-layout="tableLayout">
    <w-table-column prop="date" label="Date" />
    <w-table-column prop="name" label="Name" />
    <w-table-column prop="address" label="Address" />
  </w-table>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { TableInstance } from 'win-design-next'

const tableLayout = ref<TableInstance['tableLayout']>('fixed')

const tableData = [
  {
    date: '2016-05-03',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-02',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-04',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
  {
    date: '2016-05-01',
    name: 'Tom',
    address: 'No. 189, Grove St, Los Angeles',
  },
]
</script>
```

:::

:::demo

```vue
<template>
  <w-table
    :data="tableData"
    show-overflow-tooltip
    :tooltip-formatter="tableRowFormatter"
    style="width: 100%"
  >
    <w-table-column
      prop="address"
      label="extends table formatter"
      width="240"
    />
    <w-table-column
      prop="tags"
      label="formatter object"
      width="240"
      :tooltip-formatter="({ row }) => row.tags.join(', ')"
    >
      <template #default="{ row }">
        <w-tag
          v-for="tag in row.tags"
          :key="tag"
          class="tag-item"
          type="primary"
        >
          {{ tag }}
        </w-tag>
      </template>
    </w-table-column>
    <w-table-column
      prop="url"
      label="with vnode"
      width="240"
      :tooltip-formatter="withVNode"
    />
  </w-table>
</template>

<script lang="ts" setup>
import { h } from 'vue'
import { type TableTooltipData, WLink } from 'win-design-next'

type TableData = {
  address: string
  tags: string[]
  url: string
}

const tableData: TableData[] = [
  {
    address: 'Lohrbergstr. 86c, Süd Lilli, Saarland',
    tags: ['Office', 'Home', 'Park', 'Garden'],
    url: 'http://wued.winning-health.com.cn:8088/win-design/',
  },
  {
    address: '760 A Street, South Frankfield, Illinois',
    tags: ['error', 'warning', 'success', 'info'],
    url: 'http://wued.winning-health.com.cn:8088/win-design/',
  },
  {
    address: 'Arnold-Ohletz-Str. 41a, Alt Malinascheid, Thüringen',
    tags: ['one', 'two', 'three', 'four', 'five'],
    url: 'http://wued.winning-health.com.cn:8088/win-design/',
  },
  {
    address: '23618 Windsor Drive, West Ricardoview, Idaho',
    tags: ['blue', 'white', 'dark', 'gray', 'red', 'bright'],
    url: 'http://wued.winning-health.com.cn:8088/win-design/',
  },
]

const tableRowFormatter = (data: TableTooltipData<TableData>) => {
  return `${data.cellValue}: table formatter`
}

const withVNode = (data: TableTooltipData<TableData>) => {
  return h(WLink, { type: 'primary', href: data.cellValue }, () =>
    h('span', null, data.cellValue)
  )
}
</script>

<style scoped>
p {
  margin: 10px;
  padding: 0;
}
.tag-item + .tag-item {
  margin-left: 5px;
}
</style>
```

:::

### API 文档

### Table 属性

| 属性名                  | 说明                                                                                                                                                                                                          | 类型                                                                                                                                                                | Default                                                                                                                 |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------- |
| data                    | 表数据                                                                                                                                                                                                        | ^[array]`any[]`                                                                                                                                                     | []                                                                                                                      |
| height                  | table 的高度。 默认为自动高度。 如果 height 为 number 类型，单位 px；如果 height 为 string 类型，则这个高度会设置为 Table 的 style.height 的值，Table 的高度会受控于外部样式。                                | ^[string] / ^[number]                                                                                                                                               | —                                                                                                                       |
| max-height              | table 的最大高度。 合法的值为数字或者单位为 px 的高度。                                                                                                                                                       | ^[string] / ^[number]                                                                                                                                               | —                                                                                                                       |
| stripe                  | 是否为斑马纹 table                                                                                                                                                                                            | ^[boolean]                                                                                                                                                          | false                                                                                                                   |
| border                  | 是否带有纵向边框                                                                                                                                                                                              | ^[boolean]                                                                                                                                                          | true                                                                                                                    |
| size ^(1.0.7)           | Table 的尺寸                                                                                                                                                                                                  | ^[enum]`'extra-large' \| 'large' \| 'default' \| 'small' \| 'mini'`                                                                                                 | default                                                                                                                 |
| fit                     | 列的宽度是否自撑开                                                                                                                                                                                            | ^[boolean]                                                                                                                                                          | true                                                                                                                    |
| show-header             | 是否显示表头                                                                                                                                                                                                  | ^[boolean]                                                                                                                                                          | true                                                                                                                    |
| highlight-current-row   | 是否要高亮当前行                                                                                                                                                                                              | ^[boolean]                                                                                                                                                          | false                                                                                                                   |
| current-row-key         | 当前行的 key，只写属性                                                                                                                                                                                        | ^[string] / ^[number]                                                                                                                                               | —                                                                                                                       |
| row-class-name          | 行的 className 的回调方法，也可以使用字符串为所有行设置一个固定的 className。                                                                                                                                 | ^[Function]`(data: { row: any, rowIndex: number }) => string` / ^[string]                                                                                           | —                                                                                                                       |
| row-style               | 行的 style 的回调方法，也可以使用一个固定的 Object 为所有行设置一样的 Style。                                                                                                                                 | ^[Function]`(data: { row: any, rowIndex: number }) => CSSProperties` / ^[object]`CSSProperties`                                                                     | —                                                                                                                       |
| cell-class-name         | 单元格的 className 的回调方法，也可以使用字符串为所有单元格设置一个固定的 className。                                                                                                                         | ^[Function]`(data: { row: any, column: any, rowIndex: number, columnIndex: number }) => string` / ^[string]                                                         | —                                                                                                                       |
| cell-style              | 单元格的 style 的回调方法，也可以使用一个固定的 Object 为所有单元格设置一样的 Style。                                                                                                                         | ^[Function]`(data: { row: any, column: any, rowIndex: number, columnIndex: number }) => CSSProperties` / ^[object]`CSSProperties`                                   | —                                                                                                                       |
| header-row-class-name   | 表头行的 className 的回调方法，也可以使用字符串为所有表头行设置一个固定的 className。                                                                                                                         | ^[Function]`(data: { row: any, rowIndex: number }) => string` / ^[string]                                                                                           | —                                                                                                                       |
| header-row-style        | 表头行的 style 的回调方法，也可以使用一个固定的 Object 为所有表头行设置一样的 Style。                                                                                                                         | ^[Function]`(data: { row: any, rowIndex: number }) => CSSProperties` / ^[object]`CSSProperties`                                                                     | —                                                                                                                       |
| header-cell-class-name  | 表头单元格的 className 的回调方法，也可以使用字符串为所有表头单元格设置一个固定的 className。                                                                                                                 | ^[Function]`(data: { row: any, column: any, rowIndex: number, columnIndex: number }) => string` / ^[string]                                                         | —                                                                                                                       |
| header-cell-style       | 表头单元格的 style 的回调方法，也可以使用一个固定的 Object 为所有表头单元格设置一样的 Style。                                                                                                                 | ^[Function]`(data: { row: any, column: any, rowIndex: number, columnIndex: number }) => CSSProperties` / ^[object]`CSSProperties`                                   | —                                                                                                                       |
| row-key                 | 行数据的 Key，用来优化 Table 的渲染； 在使用`reserve-selection`功能与显示树形数据时，该属性是必填的。 类型为 String 时，支持多层访问：`user.info.id`，但不支持 `user.info[0].id`，此种情况请使用 `Function`。 | ^[function]`(row: any) => string` / ^[string]                                                                                                                       | —                                                                                                                       |
| empty-text              | 空数据时显示的文本内容， 也可以通过 `#empty` 设置                                                                                                                                                             | ^[string]                                                                                                                                                           | No Data                                                                                                                 |
| default-expand-all      | 是否默认展开所有行，当 Table 包含展开行存在或者为树形表格时有效                                                                                                                                               | ^[boolean]                                                                                                                                                          | false                                                                                                                   |
| expand-row-keys         | 可以通过该属性设置 Table 目前的展开行，需要设置 row-key 属性才能使用，该属性为展开行的 keys 数组。                                                                                                            | ^[array]`string[]`                                                                                                                                                  | —                                                                                                                       |
| default-sort            | 默认的排序列的 prop 和顺序。 它的 `prop` 属性指定默认的排序的列，`order` 指定默认排序的顺序                                                                                                                   | ^[object]`Sort`                                                                                                                                                     | 如果设置了`prop`，但没有设置 `order`，那么 `order`将被默认设置为 ascending                                              |
| tooltip-effect          | 溢出的 tooltip 的 `effect`                                                                                                                                                                                    | ^[enum]`'dark' \| 'light'`                                                                                                                                          | dark                                                                                                                    |
| tooltip-options         | 溢出 tooltip 的选项，[参见下述 tooltip 组件](tooltip.html#attributes)                                                                                                                                         | ^[object]`Pick<WTooltipProps, 'effect' \| 'enterable' \| 'hideAfter' \| 'offset' \| 'placement' \| 'popperClass' \| 'popperOptions' \| 'showAfter' \| 'showArrow'>` | ^[object]`{ enterable: true, placement: 'top', showArrow: true, hideAfter: 200, popperOptions: { strategy: 'fixed' } }` |
| append-filter-panel-to  | 挂载到哪个 DOM 元素                                                                                                                                                                                           | ^[string]                                                                                                                                                           | —                                                                                                                       |
| show-summary            | 是否在表尾显示合计行                                                                                                                                                                                          | ^[boolean]                                                                                                                                                          | false                                                                                                                   |
| sum-text                | 显示摘要行第一列的文本                                                                                                                                                                                        | ^[string]                                                                                                                                                           | Sum                                                                                                                     |
| summary-method          | 自定义的合计计算方法                                                                                                                                                                                          | ^[Function]`(data: { columns: any[], data: any[] }) => (VNode \| string)[]`                                                                                         | —                                                                                                                       |
| span-method             | 合并行或列的计算方法                                                                                                                                                                                          | ^[Function]`(data: { row: any, column: any, rowIndex: number, columnIndex: number }) => number[] \| { rowspan: number, colspan: number } \| void`                   | —                                                                                                                       |
| select-on-indeterminate | 在多选表格中，当仅有部分行被选中时，点击表头的多选框时的行为。 若为 true，则选中所有行；若为 false，则取消选择所有行                                                                                          | ^[boolean]                                                                                                                                                          | true                                                                                                                    |
| indent                  | 展示树形数据时，树节点的缩进                                                                                                                                                                                  | ^[number]                                                                                                                                                           | 16                                                                                                                      |
| lazy                    | 是否懒加载子节点数据                                                                                                                                                                                          | ^[boolean]                                                                                                                                                          | false                                                                                                                   |
| load                    | 加载子节点数据的函数，`lazy` 为 true 时生效                                                                                                                                                                   | ^[Function]`(row: any, treeNode: TreeNode, resolve: (data: any[]) => void) => void`                                                                                 | —                                                                                                                       |
| tree-props              | 渲染嵌套数据的配置选项                                                                                                                                                                                        | ^[object]`{ hasChildren?: string, children?: string, checkStrictly?: boolean }`                                                                                     | ^[object]`{ hasChildren: 'hasChildren', children: 'children', checkStrictly: false }`                                   |
| table-layout            | 设置表格单元、行和列的布局方式                                                                                                                                                                                | ^[enum]`'fixed' \| 'auto'`                                                                                                                                          | fixed                                                                                                                   |
| scrollbar-always-on     | 总是显示滚动条                                                                                                                                                                                                | ^[boolean]                                                                                                                                                          | false                                                                                                                   |
| show-overflow-tooltip   | 是否隐藏额外内容并在单元格悬停时使用 Tooltip 显示它们。这将影响全部列的展示，详请参考[tooltip-options](#table-attributes)                                                                                     | ^[boolean] / [`object`](#table-attributes)                                                                                                                          | —                                                                                                                       |
| flexible                | 确保主轴的最小尺寸，以便不超过内容                                                                                                                                                                            | ^[boolean]                                                                                                                                                          | false                                                                                                                   |
| scrollbar-tabindex      | body 的滚动条的包裹容器 tabindex                                                                                                                                                                              | ^[string] / ^[number]                                                                                                                                               | —                                                                                                                       |
| allow-drag-last-column  | 是否允许拖动最后一列                                                                                                                                                                                          | ^[boolean]                                                                                                                                                          | true                                                                                                                    |
| tooltip-formatter       | 自定义 `show-overflow-tooltip` 时的 tooltip 内容                                                                                                                                                              | ^[Function]`(data: { row: any, column: any, cellValue: any }) => VNode \| string`                                                                                   | —                                                                                                                       |
| h-scrollbar-size        | 配置表格的水平滚动条大小，防止水平和垂直滚动条重叠。                                                                                                                                                          | `number`                                                                                                                                                            | 10                                                                                                                      |
| scrollbar-size          | 配置表格的垂直滚动条大小，防止水平和垂直滚动条重叠。                                                                                                                                                          | `number`                                                                                                                                                            | 10                                                                                                                      |

### Table 事件

| 事件名             | 说明                                                                                                                     | 类型                                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------- |
| select             | 当用户手动勾选数据行的 Checkbox 时触发的事件                                                                             | ^[Function]`<T = any>(selection: T[], row: T) => void`                                       |
| select-all         | 当用户手动勾选全选 Checkbox 时触发的事件                                                                                 | ^[Function]`(selection: any[]) => void`                                                      |
| selection-change   | 当选择项发生变化时会触发该事件                                                                                           | ^[Function]`(newSelection: any[]) => void`                                                   |
| cell-mouse-enter   | 当单元格 hover 进入时会触发该事件                                                                                        | ^[Function]`(row: any, column: any, cell: HTMLTableCellElement, event: Event) => void`       |
| cell-mouse-leave   | 当单元格 hover 退出时会触发该事件                                                                                        | ^[Function]`(row: any, column: any, cell: HTMLTableCellElement, event: Event) => void`       |
| cell-click         | 当某个单元格被点击时会触发该事件                                                                                         | ^[Function]`(row: any, column: any, cell: HTMLTableCellElement, event: Event) => void`       |
| cell-dblclick      | 当某个单元格被双击击时会触发该事件                                                                                       | ^[Function]`(row: any, column: any, cell: HTMLTableCellElement, event: Event) => void`       |
| cell-contextmenu   | 当某个单元格被鼠标右键点击时会触发该事件                                                                                 | ^[Function]`(row: any, column: any, cell: HTMLTableCellElement, event: Event) => void`       |
| row-click          | 当某一行被点击时会触发该事件                                                                                             | ^[Function]`(row: any, column: any, event: Event) => void`                                   |
| row-contextmenu    | 当某一行被鼠标右键点击时会触发该事件                                                                                     | ^[Function]`(row: any, column: any, event: Event) => void`                                   |
| row-dblclick       | 当某一行被双击时会触发该事件                                                                                             | ^[Function]`(row: any, column: any, event: Event) => void`                                   |
| header-click       | 当某一列的表头被点击时会触发该事件                                                                                       | ^[Function]`(column: any, event: Event) => void`                                             |
| header-contextmenu | 当某一列的表头被鼠标右键点击时触发该事件                                                                                 | ^[Function]`(column: any, event: Event) => void`                                             |
| sort-change        | 当表格的排序条件发生变化的时候会触发该事件                                                                               | ^[Function]`(data: {column: any, prop: string, order: any }) => void`                        |
| filter-change      | column 的 key， 如果需要使用 filter-change 事件，则需要此属性标识是哪个 column 的筛选条件                                | ^[Function]`(newFilters: any) => void`                                                       |
| current-change     | 当表格的当前行发生变化的时候会触发该事件，如果要高亮当前行，请打开表格的 highlight-current-row 属性                      | ^[Function]`(currentRow: any, oldCurrentRow: any) => void`                                   |
| header-dragend     | 当拖动表头改变了列的宽度的时候会触发该事件                                                                               | ^[Function]`(newWidth: number, oldWidth: number, column: any, event: MouseEvent) => void`    |
| expand-change      | 当用户对某一行展开或者关闭的时候会触发该事件（展开行时，回调的第二个参数为 expandedRows；树形表格时第二参数为 expanded） | ^[Function]`(row: any, expandedRows: any[]) => void & (row: any, expanded: boolean) => void` |
| scroll             | 表格被用户滚动后触发                                                                                                     | ^[Function]`({ scrollLeft: number, scrollTop: number }) => void`                             |

### Table 插槽

| 插槽名  | 说明                                                                                                                                    | 子标签       |
| ------- | --------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| default | 自定义默认内容                                                                                                                          | Table-column |
| append  | 插入至表格最后一行之后的内容， 如果需要对表格的内容进行无限滚动操作，可能需要用到这个 slot。 若表格有合计行，该 slot 会位于合计行之上。 | —            |
| empty   | 当数据为空时自定义的内容                                                                                                                | —            |

### Table Exposes

| 方法名             | 说明                                                                                                    | Type                                                                         |
| ------------------ | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| clearSelection     | 用于多选表格，清空用户的选择                                                                            | ^[Function]`() => void`                                                      |
| getSelectionRows   | 返回当前选中的行                                                                                        | ^[Function]`() => any[]`                                                     |
| toggleRowSelection | 用于多选表格，切换某一行的选中状态， 如果使用了第二个参数，则可直接设置这一行选中与否                   | ^[Function]`(row: any, selected?: boolean, ignoreSelectable = true) => void` |
| toggleAllSelection | 用于多选表格，切换全选和全不选                                                                          | ^[Function]`() => void`                                                      |
| toggleRowExpansion | 用于可扩展的表格或树表格，如果某行被扩展，则切换。 使用第二个参数，您可以直接设置该行应该被扩展或折叠。 | ^[Function]`(row: any, expanded?: boolean) => void`                          |
| setCurrentRow      | 用于单选表格，设定某一行为选中行， 如果调用时不加参数，则会取消目前高亮行的选中状态。                   | ^[Function]`(row: any) => void`                                              |
| clearSort          | 用于清空排序条件，数据会恢复成未排序的状态                                                              | ^[Function]`() => void`                                                      |
| clearFilter        | 传入由`columnKey` 组成的数组以清除指定列的过滤条件。 如果没有参数，清除所有过滤器                       | ^[Function]`(columnKeys?: string[]) => void`                                 |
| doLayout           | 对 Table 进行重新布局。 当表格可见性变化时，您可能需要调用此方法以获得正确的布局                        | ^[Function]`() => void`                                                      |
| sort               | 手动排序表格。 参数 `prop` 属性指定排序列，`order` 指定排序顺序。                                       | ^[Function]`(prop: string, order: string) => void`                           |
| scrollTo           | 滚动到一组特定坐标                                                                                      | ^[Function]`(options: number \| ScrollToOptions, yCoord?: number) => void`   |
| setScrollTop       | 设置垂直滚动位置                                                                                        | ^[Function]`(top?: number) => void`                                          |
| setScrollLeft      | 设置水平滚动位置                                                                                        | ^[Function]`(left?: number) => void`                                         |
| columns            | 获取表列的 context                                                                                      | ^[array]`TableColumnCtx<T>[]`                                                |
| updateKeyChildren  | 适用于 lazy Table, 需要设置 `rowKey`, 更新 key children                                                 | ^[Function]`(key: string, data: T[]) => void`                                |

## Table-column API

### Table-column 属性

| 属性名                | 说明                                                                                                                                                                                   | Type                                                                                                                                                                        | 默认值                            |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| type                  | 对应列的类型。 如果设置了`selection`则显示多选框； 如果设置了` index` 则显示该行的索引（从 1 开始计算）； 如果设置了` expand` 则显示为一个可展开的按钮                                 | ^[enum]`'default' \| 'selection' \| 'index' \| 'expand'`                                                                                                                    | default                           |
| index                 | 如果设置了 `type=index`，可以通过传递 `index` 属性来自定义索引                                                                                                                         | ^[number] / ^[Function]`(index: number) => number`                                                                                                                          | —                                 |
| label                 | 显示的标题                                                                                                                                                                             | ^[string]                                                                                                                                                                   | —                                 |
| column-key            | column 的 key， column 的 key， 如果需要使用 filter-change 事件，则需要此属性标识是哪个 column 的筛选条件                                                                              | ^[string]                                                                                                                                                                   | —                                 |
| prop                  | 字段名称 对应列内容的字段名， 也可以使用 `property`属性                                                                                                                                | ^[string]                                                                                                                                                                   | —                                 |
| width                 | 对应列的宽度                                                                                                                                                                           | ^[string] / ^[number]                                                                                                                                                       | ''                                |
| min-width             | 对应列的最小宽度， 对应列的最小宽度， 与 `width` 的区别是 `width` 是固定的，`min-width` 会把剩余宽度按比例分配给设置了 `min-width` 的列                                                | ^[string] / ^[number]                                                                                                                                                       | ''                                |
| fixed                 | 列是否固定在左侧或者右侧。 `true` 表示固定在左侧                                                                                                                                       | ^[enum]`'left' \| 'right'` / ^[boolean]                                                                                                                                     | false                             |
| render-header         | 列标题 Label 区域渲染使用的 Function                                                                                                                                                   | ^[Function]`(data: { column: any, $index: number }) => void`                                                                                                                | —                                 |
| sortable              | 对应列是否可以排序， 如果设置为 'custom'，则代表用户希望远程排序，需要监听 Table 的 sort-change 事件                                                                                   | ^[boolean] / ^[string]                                                                                                                                                      | false                             |
| sort-method           | 指定数据按照哪个属性进行排序，仅当`sortable`设置为`true`的时候有效。 应该如同 Array.sort 那样返回一个 Number                                                                           | ^[Function]`<T = any>(a: T, b: T) => number`                                                                                                                                | —                                 |
| sort-by               | 指定数据按照哪个属性进行排序，仅当 sortable 设置为 true 且没有设置 sort-method 的时候有效。 如果 sort-by 为数组，则先按照第 1 个属性排序，如果第 1 个相等，再按照第 2 个排序，以此类推 | ^[Function]`(row: any, index: number) => string` / ^[string] / ^[object]`string[]`                                                                                          | —                                 |
| sort-orders           | 数据在排序时所使用排序策略的轮转顺序，仅当 sortable 为 true 时有效。 需传入一个数组，随着用户点击表头，该列依次按照数组中元素的顺序进行排序                                            | ^[object]`('ascending' \| 'descending' \| null)[]`                                                                                                                          | ['ascending', 'descending', null] |
| resizable             | 对应列是否可以通过拖动改变宽度（需要在 el-table 上设置 border 属性为真）                                                                                                               | ^[boolean]                                                                                                                                                                  | true                              |
| formatter             | 用来格式化内容                                                                                                                                                                         | ^[function]`(row: any, column: any, cellValue: any, index: number) => VNode \| string`                                                                                      | —                                 |
| show-overflow-tooltip | 当内容过长被隐藏时显示 tooltip                                                                                                                                                         | ^[boolean] / [`object`](#table-attributes)                                                                                                                                  | undefined                         |
| align                 | 对齐方式                                                                                                                                                                               | ^[enum]`'left' \| 'center' \| 'right'`                                                                                                                                      | left                              |
| header-align          | 表头对齐方式， 若不设置该项，则使用表格的对齐方式                                                                                                                                      | ^[enum]`'left' \| 'center' \| 'right'`                                                                                                                                      | left                              |
| class-name            | 列的 className                                                                                                                                                                         | ^[string]                                                                                                                                                                   | —                                 |
| label-class-name      | 当前列标题的自定义类名                                                                                                                                                                 | ^[string]                                                                                                                                                                   | —                                 |
| selectable            | 仅对 type=selection 的列有效，类型为 Function，Function 的返回值用来决定这一行的 CheckBox 是否可以勾选                                                                                 | ^[Function]`(row: any, index: number) => boolean`                                                                                                                           | —                                 |
| reserve-selection     | 数据刷新后是否保留选项，仅对 ` type=selection` 的列有效， 请注意， 需指定 `row-key` 来让这个功能生效。                                                                                 | ^[boolean]                                                                                                                                                                  | false                             |
| filters               | 数据过滤的选项， 数组格式，数组中的元素需要有 text 和 value 属性。 数组中的每个元素都需要有 text 和 value 属性。                                                                       | ^[array]`Array<{text: string, value: string}>`                                                                                                                              | —                                 |
| filter-placement      | 过滤弹出框的定位                                                                                                                                                                       | ^[enum]`'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'` | —                                 |
| filter-class-name     | 过滤弹出框的 className                                                                                                                                                                 | ^[string]                                                                                                                                                                   | —                                 |
| filter-multiple       | 数据过滤的选项是否多选                                                                                                                                                                 | ^[boolean]                                                                                                                                                                  | true                              |
| filter-method         | 数据过滤使用的方法， 如果是多选的筛选项，对每一条数据会执行多次，任意一次返回 true 就会显示。                                                                                          | ^[function]`(value: any, row: any, column: any) => void`                                                                                                                    | —                                 |
| filtered-value        | 选中的数据过滤项，如果需要自定义表头过滤的渲染方式，可能会需要此属性。                                                                                                                 | ^[object]`string[]`                                                                                                                                                         | —                                 |
| tooltip-formatter     | 使用 `show-overflow-tooltip` 时自定义 tooltip 内容                                                                                                                                     | ^[Function]`(data: { row: any, column: any, cellValue: any }) => VNode \| string`                                                                                           | —                                 |

### Table-column 插槽

| 插槽名      | 说明               | 类型                                                 |
| ----------- | ------------------ | ---------------------------------------------------- |
| default     | 自定义列的内容     | ^[object]`{ row: any, column: any, $index: number }` |
| header      | 自定义表头的内容， | ^[object]`{ column: any, $index: number }`           |
| filter-icon | 自定义 filter 图标 | ^[object]`{ filterOpened: boolean }`                 |

## Virtualized Table 虚拟化表格

让我们演示虚拟化表的性能，用 10 列和 1 000 行渲染一个基本示例。

### 示例

:::demo

```vue
<template>
  <w-table-v2
    :columns="columns"
    :data="data"
    :width="700"
    :height="400"
    fixed
  />
</template>

<script lang="ts" setup>
const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
const data = generateData(columns, 1000)
</script>
```

:::

:::demo

```vue
<template>
  <div style="height: 400px">
    <w-auto-resizer>
      <template #default="{ height, width }">
        <w-table-v2
          :columns="columns"
          :data="data"
          :width="width"
          :h-scrollbar-size="8"
          :scrollbar-size="10"
          :height="height"
          fixed
        />
      </template>
    </w-auto-resizer>
  </div>
</template>

<script lang="ts" setup>
const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
const data = generateData(columns, 200)
</script>
```

:::

:::demo

```vue
<template>
  <w-table-v2
    :columns="columns"
    :data="data"
    :width="700"
    :height="400"
    fixed
  />
</template>

<script lang="tsx" setup>
import { ref } from 'vue'
import dayjs from 'dayjs'
import {
  TableV2FixedDir,
  WButton,
  WIcon,
  WTag,
  WTooltip,
} from 'win-design-next'
import { Time } from '@win-design-next/icons-vue'

import type { Column } from 'win-design-next'

let id = 0

const dataGenerator = () => ({
  id: `random-id-${++id}`,
  name: 'Tom',
  date: '2020-10-1',
})

const columns: Column<any>[] = [
  {
    key: 'date',
    title: '日期',
    dataKey: 'date',
    width: 150,
    fixed: TableV2FixedDir.LEFT,
    cellRenderer: ({ cellData: date }) => (
      <WTooltip content={dayjs(date).format('YYYY/MM/DD')}>
        {
          <span class="flex items-center">
            <WIcon class="mr-3">
              <Time />
            </WIcon>
            {dayjs(date).format('YYYY/MM/DD')}
          </span>
        }
      </WTooltip>
    ),
  },
  {
    key: 'name',
    title: '名称',
    dataKey: 'name',
    width: 350,
    align: 'center',
    cellRenderer: ({ cellData: name }) => <WTag>{name}</WTag>,
  },
  {
    key: 'operations',
    title: '操作',
    cellRenderer: () => (
      <>
        <WButton text size="small" type="primary">
          编辑
        </WButton>
        <WButton text size="small" type="danger">
          删除
        </WButton>
      </>
    ),
    width: 250,
    align: 'center',
  },
]

const data = ref(Array.from({ length: 200 }).map(dataGenerator))
</script>
```

:::

:::demo

```vue
<template>
  <div style="height: 400px">
    <w-auto-resizer>
      <template #default="{ height, width }">
        <w-table-v2
          :columns="columns"
          :data="data"
          :width="width"
          :height="height"
          fixed
        />
      </template>
    </w-auto-resizer>
  </div>
</template>

<script lang="tsx" setup>
import { ref, unref } from 'vue'
import { WCheckbox } from 'win-design-next'

import type { FunctionalComponent } from 'vue'
import type { CheckboxValueType, Column } from 'win-design-next'

type SelectionCellProps = {
  value: boolean
  intermediate?: boolean
  onChange: (value: CheckboxValueType) => void
}

const SelectionCell: FunctionalComponent<SelectionCellProps> = ({
  value,
  intermediate = false,
  onChange,
}) => {
  return (
    <WCheckbox
      onChange={onChange}
      modelValue={value}
      indeterminate={intermediate}
    />
  )
}

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        checked: false,
        parentId: null,
      }
    )
  })

const columns: Column<any>[] = generateColumns(10)
columns.unshift({
  key: 'selection',
  width: 50,
  cellRenderer: ({ rowData }) => {
    const onChange = (value: CheckboxValueType) => (rowData.checked = value)
    return <SelectionCell value={rowData.checked} onChange={onChange} />
  },

  headerCellRenderer: () => {
    const _data = unref(data)
    const onChange = (value: CheckboxValueType) =>
      (data.value = _data.map((row) => {
        row.checked = value
        return row
      }))
    const allSelected = _data.every((row) => row.checked)
    const containsChecked = _data.some((row) => row.checked)

    return (
      <SelectionCell
        value={allSelected}
        intermediate={containsChecked && !allSelected}
        onChange={onChange}
      />
    )
  },
})

const data = ref(generateData(columns, 200))
</script>
```

:::

:::demo

```vue
<template>
  <div style="height: 400px">
    <w-auto-resizer>
      <template #default="{ height, width }">
        <w-table-v2
          :columns="columns"
          :data="data"
          :width="width"
          :height="height"
          fixed
        />
      </template>
    </w-auto-resizer>
  </div>
</template>

<script lang="tsx" setup>
import { ref, withKeys } from 'vue'
import { WInput } from 'win-design-next'

import type { FunctionalComponent } from 'vue'
import type { Column, InputInstance } from 'win-design-next'

type SelectionCellProps = {
  value: string
  intermediate?: boolean
  onChange: (value: string) => void
  onBlur: () => void
  onKeydownEnter: () => void
  forwardRef: (el: InputInstance) => void
}

const InputCell: FunctionalComponent<SelectionCellProps> = ({
  value,
  onChange,
  onBlur,
  onKeydownEnter,
  forwardRef,
}) => {
  return (
    <WInput
      ref={forwardRef as any}
      onInput={onChange}
      onBlur={onBlur}
      onKeydown={withKeys(onKeydownEnter, ['enter'])}
      modelValue={value}
    />
  )
}

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        editing: false,
        parentId: null,
      }
    )
  })

const columns: Column<any>[] = generateColumns(10)
columns[0] = {
  ...columns[0],
  title: 'Editable Column',
  cellRenderer: ({ rowData, column }) => {
    const onChange = (value: string) => {
      rowData[column.dataKey!] = value
    }
    const onEnterEditMode = () => {
      rowData.editing = true
    }

    const onExitEditMode = () => (rowData.editing = false)
    const input = ref()
    const setRef = (el) => {
      input.value = el
      if (el) {
        el.focus?.()
      }
    }

    return rowData.editing ? (
      <InputCell
        forwardRef={setRef}
        value={rowData[column.dataKey!]}
        onChange={onChange}
        onBlur={onExitEditMode}
        onKeydownEnter={onExitEditMode}
      />
    ) : (
      <div class="table-v2-inline-editing-trigger" onClick={onEnterEditMode}>
        {rowData[column.dataKey!]}
      </div>
    )
  },
}

const data = ref(generateData(columns, 200))
</script>

<style>
.table-v2-inline-editing-trigger {
  border: 1px transparent dotted;
  padding: 4px;
}

.table-v2-inline-editing-trigger:hover {
  border-color: var(--w3-color-primary);
}
</style>
```

:::

:::demo

```vue
<template>
  <w-table-v2
    :columns="columns"
    :data="data"
    :row-class="rowClass"
    :width="700"
    :height="400"
  />
</template>

<script lang="tsx" setup>
import { ref } from 'vue'
import dayjs from 'dayjs'
import {
  TableV2FixedDir,
  WButton,
  WIcon,
  WTag,
  WTooltip,
} from 'win-design-next'
import { Time } from '@win-design-next/icons-vue'

import type { Column, RowClassNameGetter } from 'win-design-next'

let id = 0

const dataGenerator = () => ({
  id: `random-id-${++id}`,
  name: 'Tom',
  date: '2020-10-1',
})

const columns: Column<any>[] = [
  {
    key: 'date',
    title: '日期',
    dataKey: 'date',
    width: 250,
    fixed: TableV2FixedDir.LEFT,
    cellRenderer: ({ cellData: date }) => (
      <WTooltip content={dayjs(date).format('YYYY/MM/DD')}>
        {
          <span class="flex items-center">
            <WIcon class="mr-3">
              <Time />
            </WIcon>
            {dayjs(date).format('YYYY/MM/DD')}
          </span>
        }
      </WTooltip>
    ),
  },
  {
    key: 'name',
    title: '名称',
    dataKey: 'name',
    width: 250,
    align: 'center',
    cellRenderer: ({ cellData: name }) => <WTag>{name}</WTag>,
  },
  {
    key: 'operations',
    title: '操作',
    cellRenderer: () => (
      <>
        <WButton text size="small" type="primary">
          编辑
        </WButton>
        <WButton text size="small" type="danger">
          删除
        </WButton>
      </>
    ),
    width: 250,
    align: 'center',
    flexGrow: 1,
  },
]

const data = ref(Array.from({ length: 200 }).map(dataGenerator))

const rowClass = ({ rowIndex }: Parameters<RowClassNameGetter<any>>[0]) => {
  if (rowIndex % 10 === 5) {
    return 'bg-red-100'
  } else if (rowIndex % 10 === 0) {
    return 'bg-blue-200'
  }
  return ''
}
</script>
```

:::

:::demo

```vue
<template>
  <w-table-v2
    :columns="columns"
    :data="tableData"
    :fixed-data="fixedData"
    :width="700"
    :height="400"
    :row-class="rowClass"
    fixed
    @scroll="onScroll"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
const data = generateData(columns, 200)

const rowClass = ({ rowIndex }) => {
  if (rowIndex < 0 || (rowIndex + 1) % 5 === 0) return 'sticky-row'
}

const stickyIndex = ref(0)

const fixedData = computed(() =>
  data.slice(stickyIndex.value, stickyIndex.value + 1)
)

const tableData = computed(() => {
  return data.slice(1)
})

const onScroll = ({ scrollTop }) => {
  stickyIndex.value = Math.floor(scrollTop / 250) * 5
}
</script>

<style>
.w3-w-table-v2__fixed-header-row {
  background-color: var(--w3-color-primary-hover);
  font-weight: bold;
  color: var(--w3-color-white);
}
</style>
```

:::

:::demo

```vue
<template>
  <w-table-v2
    :columns="columns"
    :data="data"
    :sort-by="sortBy"
    :width="700"
    :height="400"
    fixed
    @column-sort="onSort"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { TableV2FixedDir, TableV2SortOrder } from 'win-design-next'

import type { SortBy } from 'win-design-next'

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
let data = generateData(columns, 200)

columns[0].fixed = true
columns[1].fixed = TableV2FixedDir.LEFT
columns[9].fixed = TableV2FixedDir.RIGHT

for (let i = 0; i < 3; i++) columns[i].sortable = true

const sortBy = ref<SortBy>({
  key: 'column-0',
  order: TableV2SortOrder.ASC,
})

const onSort = (_sortBy: SortBy) => {
  data = data.reverse()
  sortBy.value = _sortBy
}
</script>
```

:::

:::demo

```vue
<template>
  <w-table-v2
    fixed
    :columns="fixedColumns"
    :data="data"
    :header-height="[50, 40, 50]"
    :header-class="headerClass"
    :width="700"
    :height="400"
  >
    <template #header="props">
      <customized-header v-bind="props" />
    </template>
  </w-table-v2>
</template>

<script lang="tsx" setup>
import { TableV2FixedDir, TableV2Placeholder } from 'win-design-next'

import type { FunctionalComponent } from 'vue'
import type {
  HeaderClassNameGetter,
  TableV2CustomizedHeaderSlotParam,
} from 'win-design-next'

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })
const columns = generateColumns(15)
const data = generateData(columns, 200)

const fixedColumns = columns.map((column, columnIndex) => {
  let fixed: TableV2FixedDir | undefined = undefined
  if (columnIndex < 3) fixed = TableV2FixedDir.LEFT
  if (columnIndex > 12) fixed = TableV2FixedDir.RIGHT
  return { ...column, fixed, width: 100 }
})

const CustomizedHeader: FunctionalComponent<
  TableV2CustomizedHeaderSlotParam
> = ({ cells, columns, headerIndex }) => {
  if (headerIndex === 2) return cells

  const groupCells = [] as typeof cells
  let width = 0
  let idx = 0

  columns.forEach((column, columnIndex) => {
    if (column.placeholderSign === TableV2Placeholder)
      groupCells.push(cells[columnIndex])
    else {
      width += cells[columnIndex].props!.column.width
      idx++

      const nextColumn = columns[columnIndex + 1]
      if (
        columnIndex === columns.length - 1 ||
        nextColumn.placeholderSign === TableV2Placeholder ||
        idx === (headerIndex === 0 ? 4 : 2)
      ) {
        groupCells.push(
          <div
            class="flex items-center justify-center custom-header-cell"
            role="columnheader"
            style={{
              ...cells[columnIndex].props!.style,
              width: `${width}px`,
            }}
          >
            Group width {width}
          </div>
        )
        width = 0
        idx = 0
      }
    }
  })
  return groupCells
}

const headerClass = ({
  headerIndex,
}: Parameters<HeaderClassNameGetter<any>>[0]) => {
  if (headerIndex === 1) return 'w3-primary-color'
  return ''
}
</script>

<style>
.w3-w-table-v2__header-row .custom-header-cell {
  border-right: 1px solid var(--w3-border-color);
}

.w3-w-table-v2__header-row .custom-header-cell:last-child {
  border-right: none;
}

.w3-primary-color {
  background-color: var(--w3-color-primary);
  color: var(--w3-color-white);
  font-size: 14px;
  font-weight: bold;
}

.w3-primary-color .custom-header-cell {
  padding: 0 4px;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-table-v2
    fixed
    :columns="fixedColumns"
    :data="data"
    :width="700"
    :height="400"
  />
</template>

<script lang="tsx" setup>
import { ref } from 'vue'
import {
  TableV2FixedDir,
  WButton,
  WCheckbox,
  WIcon,
  WPopover,
} from 'win-design-next'
import { Filter } from '@win-design-next/icons-vue'

import type { HeaderCellSlotProps } from 'win-design-next'

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })
const columns = generateColumns(10)
const data = ref(generateData(columns, 200))

const shouldFilter = ref(false)
const popoverRef = ref()

const onFilter = () => {
  popoverRef.value.hide()
  if (shouldFilter.value) {
    data.value = generateData(columns, 100, 'filtered-')
  } else {
    data.value = generateData(columns, 200)
  }
}

const onReset = () => {
  shouldFilter.value = false
  onFilter()
}

columns[0].headerCellRenderer = (props: HeaderCellSlotProps) => {
  return (
    <div class="flex items-center justify-center">
      <span class="mr-2 text-xs">{props.column.title}</span>
      <WPopover ref={popoverRef} trigger="click" {...{ width: 200 }}>
        {{
          default: () => (
            <div class="filter-wrapper">
              <div class="filter-group">
                <WCheckbox v-model={shouldFilter.value}>Filter Text</WCheckbox>
              </div>
              <div class="w3-table-v2__demo-filter">
                <WButton text onClick={onFilter}>
                  Confirm
                </WButton>
                <WButton text onClick={onReset}>
                  Reset
                </WButton>
              </div>
            </div>
          ),
          reference: () => (
            <WIcon class="cursor-pointer">
              <Filter />
            </WIcon>
          ),
        }}
      </WPopover>
    </div>
  )
}

const fixedColumns = columns.map((column, columnIndex) => {
  let fixed: TableV2FixedDir | undefined = undefined
  if (columnIndex < 2) fixed = TableV2FixedDir.LEFT
  if (columnIndex > 9) fixed = TableV2FixedDir.RIGHT
  return { ...column, fixed, width: 100 }
})
</script>

<style>
.w3-table-v2__demo-filter {
  border-top: var(--w3-border);
  margin: 12px -12px -12px;
  padding: 0 12px;
  display: flex;
  justify-content: space-between;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-table-v2
    :columns="columns"
    :data="data"
    :sort-by="sortState"
    :width="700"
    :height="400"
    fixed
    @column-sort="onSort"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { TableV2SortOrder } from 'win-design-next'
import type { SortBy } from 'win-design-next'

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
let data = generateData(columns, 200)

columns[0].sortable = true

const sortState = ref<SortBy>({
  key: 'column-0',
  order: TableV2SortOrder.ASC,
})

const onSort = (sortBy: SortBy) => {
  console.log(sortBy)
  data = data.reverse()
  sortState.value = sortBy
}
</script>
```

:::

:::demo

```vue
<template>
  <w-table-v2
    v-model:sort-state="sortState"
    :columns="columns"
    :data="data"
    :width="700"
    :height="400"
    fixed
    @column-sort="onSort"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { TableV2SortOrder } from 'win-design-next'
import type { SortBy, SortState } from 'win-design-next'

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
const data = ref(generateData(columns, 200))

columns[0].sortable = true
columns[1].sortable = true

const sortState = ref<SortState>({
  'column-0': TableV2SortOrder.DESC,
  'column-1': TableV2SortOrder.ASC,
})

const onSort = ({ key, order }: SortBy) => {
  sortState.value[key] = order
  data.value = data.value.reverse()
}
</script>
```

:::

:::demo

```vue
<template>
  <div style="height: 400px">
    <w-auto-resizer>
      <template #default="{ height, width }">
        <w-table-v2
          :columns="columns"
          :cell-props="cellProps"
          :class="kls"
          :data="data"
          :width="width"
          :height="height"
        />
      </template>
    </w-auto-resizer>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
columns.unshift({
  key: 'column-n-1',
  width: 50,
  title: 'Row No.',
  cellRenderer: ({ rowIndex }) => `${rowIndex + 1}`,
  align: 'center',
})
const data = generateData(columns, 200)

const cellProps = ({ columnIndex }) => {
  const key = `hovering-col-${columnIndex}`
  return {
    ['data-key']: key,
    onMouseenter: () => {
      kls.value = key
    },
    onMouseleave: () => {
      kls.value = ''
    },
  }
}

const kls = ref<string>('')
</script>

<style>
.hovering-col-0 [data-key='hovering-col-0'],
.hovering-col-1 [data-key='hovering-col-1'],
.hovering-col-2 [data-key='hovering-col-2'],
.hovering-col-3 [data-key='hovering-col-3'],
.hovering-col-4 [data-key='hovering-col-4'],
.hovering-col-5 [data-key='hovering-col-5'],
.hovering-col-6 [data-key='hovering-col-6'],
.hovering-col-7 [data-key='hovering-col-7'],
.hovering-col-8 [data-key='hovering-col-8'],
.hovering-col-9 [data-key='hovering-col-9'],
.hovering-col-10 [data-key='hovering-col-10'] {
  background: var(--w3-table-row-hover-bg-color);
}

[data-key='hovering-col-0'] {
  font-weight: bold;
  user-select: none;
  pointer-events: none;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-table-v2 fixed :columns="columns" :data="data" :width="700" :height="400">
    <template #row="props">
      <Row v-bind="props" />
    </template>
  </w-table-v2>
</template>

<script lang="ts" setup>
import { cloneVNode } from 'vue'

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
const data = generateData(columns, 200)

const colSpanIndex = 1
columns[colSpanIndex].colSpan = ({ rowIndex }) => (rowIndex % 4) + 1
columns[colSpanIndex].align = 'center'

const Row = ({ rowData, rowIndex, cells, columns }) => {
  const colSpan = columns[colSpanIndex].colSpan({ rowData, rowIndex })
  if (colSpan > 1) {
    let width = Number.parseInt(cells[colSpanIndex].props.style.width)
    for (let i = 1; i < colSpan; i++) {
      width += Number.parseInt(cells[colSpanIndex + i].props.style.width)
      cells[colSpanIndex + i] = null
    }
    const style = {
      ...cells[colSpanIndex].props.style,
      width: `${width}px`,
      backgroundColor: 'var(--w3-color-primary-hover)',
      color: 'var(--w3-color-white)',
    }
    cells[colSpanIndex] = cloneVNode(cells[colSpanIndex], { style })
  }

  return cells
}
</script>
```

:::

:::demo

```vue
<template>
  <w-table-v2 fixed :columns="columns" :data="data" :width="700" :height="400">
    <template #row="props">
      <Row v-bind="props" />
    </template>
  </w-table-v2>
</template>

<script lang="ts" setup>
import { cloneVNode } from 'vue'

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
const data = generateData(columns, 200)

const rowSpanIndex = 0
columns[rowSpanIndex].rowSpan = ({ rowIndex }) =>
  rowIndex % 2 === 0 && rowIndex <= data.length - 2 ? 2 : 1

const Row = ({ rowData, rowIndex, cells, columns }) => {
  const rowSpan = columns[rowSpanIndex].rowSpan({ rowData, rowIndex })
  if (rowSpan > 1) {
    const cell = cells[rowSpanIndex]
    const style = {
      ...cell.props.style,
      backgroundColor: 'var(--w3-color-primary-hover)',
      height: `${rowSpan * 32 - 1}px`,
      alignSelf: 'flex-start',
      zIndex: 1,
      color: 'var(--w3-color-white)',
    }
    cells[rowSpanIndex] = cloneVNode(cell, { style })
  }
  return cells
}
</script>
```

:::

:::demo

```vue
<template>
  <w-table-v2 fixed :columns="columns" :data="data" :width="700" :height="400">
    <template #row="props">
      <Row v-bind="props" />
    </template>
  </w-table-v2>
</template>

<script lang="tsx" setup>
import { cloneVNode } from 'vue'

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
const data = generateData(columns, 200)

const colSpanIndex = 1
columns[colSpanIndex].colSpan = ({ rowIndex }) => (rowIndex % 4) + 1
columns[colSpanIndex].align = 'center'

const rowSpanIndex = 0
columns[rowSpanIndex].rowSpan = ({ rowIndex }) =>
  rowIndex % 2 === 0 && rowIndex <= data.length - 2 ? 2 : 1

const Row = ({ rowData, rowIndex, cells, columns }) => {
  const colSpan = columns[colSpanIndex].colSpan({ rowData, rowIndex })
  if (colSpan > 1) {
    let width = Number.parseInt(cells[colSpanIndex].props.style.width)
    for (let i = 1; i < colSpan; i++) {
      width += Number.parseInt(cells[colSpanIndex + i].props.style.width)
      cells[colSpanIndex + i] = null
    }
    const style = {
      ...cells[colSpanIndex].props.style,
      width: `${width}px`,
      backgroundColor: 'var(--w3-color-primary-hover)',
      color: 'var(--w3-color-white)',
    }
    cells[colSpanIndex] = cloneVNode(cells[colSpanIndex], { style })
  }

  const rowSpan = columns[rowSpanIndex].rowSpan({ rowData, rowIndex })
  if (rowSpan > 1) {
    const cell = cells[rowSpanIndex]
    const style = {
      ...cell.props.style,
      backgroundColor: 'var(--w3-color-danger-hover)',
      height: `${rowSpan * 32}px`,
      alignSelf: 'flex-start',
      zIndex: 1,
      color: 'var(--w3-color-white)',
    }
    cells[rowSpanIndex] = cloneVNode(cell, { style })
  } else {
    const style = cells[rowSpanIndex].props.style
    // override the cell here for creating a pure node without pollute the style
    cells[rowSpanIndex] = (
      <div style={{ ...style, width: `${style.width}px` }} />
    )
  }
  return cells
}
</script>
```

:::

:::demo

```vue
<template>
  <w-table-v2
    v-model:expanded-row-keys="expandedRowKeys"
    :columns="columns"
    :data="treeData"
    :width="700"
    :expand-column-key="expandColumnKey"
    :height="400"
    fixed
    @row-expand="onRowExpanded"
    @expanded-rows-change="onExpandedRowsChange"
  />
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { TableV2FixedDir } from 'win-design-next'

import type {
  ExpandedRowsChangeHandler,
  RowExpandHandler,
} from 'win-design-next'

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10).map((column, columnIndex) => {
  let fixed!: TableV2FixedDir
  if (columnIndex < 2) fixed = TableV2FixedDir.LEFT
  if (columnIndex > 8) fixed = TableV2FixedDir.RIGHT
  return { ...column, fixed }
})

const data = generateData(columns, 200)

const expandColumnKey = 'column-0'

// add some sub items
for (let i = 0; i < 50; i++) {
  data.push(
    {
      ...data[0],
      id: `${data[0].id}-sub-${i}`,
      parentId: data[0].id,
      [expandColumnKey]: `Sub ${i}`,
    },
    {
      ...data[2],
      id: `${data[2].id}-sub-${i}`,
      parentId: data[2].id,
      [expandColumnKey]: `Sub ${i}`,
    },
    {
      ...data[2],
      id: `${data[2].id}-sub-sub-${i}`,
      parentId: `${data[2].id}-sub-${i}`,
      [expandColumnKey]: `Sub-Sub ${i}`,
    }
  )
}

function unflatten(
  data: ReturnType<typeof generateData>,
  rootId = null,
  dataKey = 'id',
  parentKey = 'parentId'
) {
  const tree: any[] = []
  const childrenMap = {}

  for (const datum of data) {
    const item = { ...datum }
    const id = item[dataKey]
    const parentId = item[parentKey]

    if (Array.isArray(item.children)) {
      childrenMap[id] = item.children.concat(childrenMap[id] || [])
    } else if (!childrenMap[id]) {
      childrenMap[id] = []
    }
    item.children = childrenMap[id]

    if (parentId !== undefined && parentId !== rootId) {
      if (!childrenMap[parentId]) childrenMap[parentId] = []
      childrenMap[parentId].push(item)
    } else {
      tree.push(item)
    }
  }

  return tree
}

const treeData = computed(() => unflatten(data))

const expandedRowKeys = ref<string[]>([])

const onRowExpanded = ({ expanded }: Parameters<RowExpandHandler<any>>[0]) => {
  console.log('Expanded:', expanded)
}

const onExpandedRowsChange = (
  expandedKeys: Parameters<ExpandedRowsChangeHandler>[0]
) => {
  console.log(expandedKeys)
}
</script>
```

:::

:::demo

```vue
<template>
  <w-table-v2
    :columns="columns"
    :data="data"
    :sort-by="sort"
    :estimated-row-height="40"
    :width="700"
    :height="400"
    fixed
    @column-sort="onColumnSort"
  />
</template>

<script lang="tsx" setup>
import { ref } from 'vue'
import {
  TableV2FixedDir,
  TableV2SortOrder,
  WButton,
  WTag,
} from 'win-design-next'

import type { Column, SortBy } from '@win-design-next/components/table-v2'

const longText =
  'Quaerat ipsam necessitatibus eum quibusdam est id voluptatem cumque mollitia.'
const midText = 'Corrupti doloremque a quos vero delectus consequatur.'
const shortText = 'Eius optio fugiat.'

const textList = [shortText, midText, longText]

// generate random number in range 0 to 2

let id = 0

const dataGenerator = () => ({
  id: `random-${++id}`,
  name: 'Tom',
  date: '2016-05-03',
  description: textList[Math.floor(Math.random() * 3)],
})

const columns: Column<any>[] = [
  {
    key: 'id',
    title: 'Id',
    dataKey: 'id',
    width: 150,
    sortable: true,
    fixed: TableV2FixedDir.LEFT,
  },
  {
    key: 'name',
    title: '名称',
    dataKey: 'name',
    width: 150,
    align: 'center',
    cellRenderer: ({ cellData: name }) => <WTag>{name}</WTag>,
  },
  {
    key: 'description',
    title: 'Description',
    dataKey: 'description',
    width: 150,
    cellRenderer: ({ cellData: description }) => (
      <div style="padding: 10px 0;">{description}</div>
    ),
  },
  {
    key: 'operations',
    title: '操作',
    cellRenderer: () => (
      <>
        <WButton text size="small" type="primary">
          编辑
        </WButton>
        <WButton text size="small" type="danger">
          删除
        </WButton>
      </>
    ),
    width: 150,
    align: 'center',
  },
]
const data = ref(
  Array.from({ length: 200 })
    .map(dataGenerator)
    .sort((a, b) => (a.name > b.name ? 1 : -1))
)

const sort = ref<SortBy>({ key: 'name', order: TableV2SortOrder.ASC })

const onColumnSort = (sortBy: SortBy) => {
  const order = sortBy.order === 'asc' ? 1 : -1
  const dataClone = [...data.value]
  dataClone.sort((a, b) => (a[sortBy.key] > b[sortBy.key] ? order : -order))
  sort.value = sortBy
  data.value = dataClone
}
</script>
```

:::

:::demo

```vue
<template>
  <w-table-v2
    :columns="columns"
    :data="data"
    :estimated-row-height="50"
    :expand-column-key="columns[0].key"
    :width="700"
    :height="400"
  >
    <template #row="props">
      <Row v-bind="props" />
    </template>
  </w-table-v2>
</template>

<script lang="tsx" setup>
import { ref } from 'vue'

const detailedText = `Velit sed aspernatur tempora. Natus consequatur officiis dicta vel assumenda.
Itaque est temporibus minus quis. Ipsum commodiab porro vel voluptas illum.
Qui quam nulla et dolore autem itaque est.
Id consequatur ipsum ea fuga et odit eligendi impedit.
Maiores officiis occaecati et magnam et sapiente est velit sunt.
Non et tempore temporibus. Excepturi et quos. Minus distinctio aut.
Voluptatem ea excepturi omnis vel. Non aperiam sit sed laboriosam eaque omnis deleniti.
Est molestiae omnis non et nulla repudiandae fuga sit.`

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
const data = ref(
  generateData(columns, 200).map((data) => {
    data.children = [
      {
        id: `${data.id}-detail-content`,
        detail: detailedText,
      },
    ]
    return data
  })
)

const Row = ({ cells, rowData }) => {
  if (rowData.detail) return <div class="p-6">{rowData.detail}</div>
  return cells
}

Row.inheritAttrs = false
</script>

<style>
.w3-table-v2__row-depth-0 {
  height: 50px;
}

.w3-table-v2__cell-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-table-v2
    :columns="columns"
    :data="data"
    :row-height="40"
    :width="700"
    :height="400"
    :footer-height="50"
    fixed
  >
    <template #footer
      ><div
        class="flex items-center"
        style="
          justify-content: center;
          height: 100%;
          background-color: var(--w3-color-primary-active-bg);
        "
      >
        Display a message in the footer
      </div>
    </template>
  </w-table-v2>
</template>

<script lang="ts" setup>
const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
const data = generateData(columns, 200)
</script>
```

:::

:::demo

```vue
<template>
  <w-table-v2
    :columns="columns"
    :data="[]"
    :row-height="40"
    :width="700"
    :height="400"
    :footer-height="50"
  >
    <template #empty>
      <div class="flex items-center justify-center h-100%">
        <w-empty />
      </div>
    </template>
  </w-table-v2>
</template>

<script lang="tsx" setup>
const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const columns = generateColumns(10)
</script>
```

:::

:::demo

```vue
<template>
  <w-table-v2
    :columns="columns"
    :data="data"
    :row-height="40"
    :width="700"
    :height="400"
  >
    <template #overlay>
      <div
        class="w3-loading-mask"
        style="display: flex; align-items: center; justify-content: center"
      >
        <w-icon class="is-loading" color="var(--w3-color-primary)" :size="26">
          <loading-icon />
        </w-icon>
      </div>
    </template>
  </w-table-v2>
</template>

<script lang="ts" setup>
import { Loading as LoadingIcon } from '@win-design-next/icons-vue'

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
const data = generateData(columns, 200)
</script>

<style>
.example-showcase .w3-table-v2__overlay {
  z-index: 9;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="mb-4 flex items-center">
    <w-form-item label="Scroll pixels" class="mr-4">
      <w-input v-model="scrollDelta" />
    </w-form-item>
    <w-form-item label="Scroll rows">
      <w-input v-model="scrollRows" />
    </w-form-item>
  </div>
  <div class="mb-4 flex items-center">
    <w-button @click="scrollByPixels"> Scroll by pixels </w-button>
    <w-button @click="scrollByRows"> Scroll by rows </w-button>
  </div>
  <div style="height: 400px">
    <w-auto-resizer>
      <template #default="{ height, width }">
        <w-table-v2
          ref="tableRef"
          :columns="columns"
          :data="data"
          :width="width"
          :height="height"
          fixed
        />
      </template>
    </w-auto-resizer>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { TableV2Instance } from 'win-design-next'

const generateColumns = (length = 10, prefix = 'column-', props?: any) =>
  Array.from({ length }).map((_, columnIndex) => ({
    ...props,
    key: `${prefix}${columnIndex}`,
    dataKey: `${prefix}${columnIndex}`,
    title: `Column ${columnIndex}`,
    width: 150,
  }))

const generateData = (
  columns: ReturnType<typeof generateColumns>,
  length = 200,
  prefix = 'row-'
) =>
  Array.from({ length }).map((_, rowIndex) => {
    return columns.reduce(
      (rowData, column, columnIndex) => {
        rowData[column.dataKey] = `Row ${rowIndex} - Col ${columnIndex}`
        return rowData
      },
      {
        id: `${prefix}${rowIndex}`,
        parentId: null,
      }
    )
  })

const columns = generateColumns(10)
const data = generateData(columns, 200)
const tableRef = ref<TableV2Instance>()
const scrollDelta = ref(200)
const scrollRows = ref(10)

function scrollByPixels() {
  tableRef.value?.scrollToTop(scrollDelta.value)
}

function scrollByRows() {
  tableRef.value?.scrollToRow(scrollRows.value)
}
</script>
```

:::

### API 文档

### Attributes

| 属性名                    | 描述说明                                                                   | 类型                                                   | 默认值    |
| ------------------------- | -------------------------------------------------------------------------- | ------------------------------------------------------ | --------- |
| cache                     | 为了更好的渲染效果预先多加载的行数                                         | `number`                                               | 2         |
| estimated-row-height      | 渲染动态的单元格的预估高度                                                 | `number`                                               | —         |
| header-class              | header 部分的自定义 class 名                                               | `string` / Function<[HeaderClassGetter](#typings)>     | —         |
| header-props              | header 部分的自定义 props 名                                               | `object` / Function<[HeaderPropsGetter](#typings)>     | —         |
| header-cell-props         | header cell 部分的自定义 props 名                                          | `object` / Function<[HeaderCellPropsGetter](#typings)> | —         |
| header-height             | Header 的高度由`height`设置。 如果传入数组，它会使 header row 等于数组长度 | `number`/ `number[]`                                   | 50        |
| footer-height             | Footer 部分的高度，当传入值时，这部分将被计算入 table 的高度里             | `number`                                               | 0         |
| row-class                 | row wrapper 部分的自定义 class 名                                          | `string` / Function<[RowClassGetter](#typings)>        | —         |
| row-key                   | 每行的 key 值，如果不提供，将使用索引 index 代替                           | `string` / `Symbol` / `number`                         | id        |
| row-props                 | row component 部分的自定义 class 名                                        | `object` / Function<[RowPropsGetter](#typings)>        | —         |
| row-height                | 每行的高度, 用于计算表的总高度                                             | `number`                                               | 50        |
| cell-props                | 每个单元格 cell 的自定义 props (除了 header cell 以外)                     | `object` / Function<[CellPropsGetter](#typings)>       | —         |
| columns                   | 列 column 的配置数组                                                       | [Column[]](#column-attribute)                          | —         |
| data                      | 要在表中渲染的数据数组                                                     | [Data[]](#typings)                                     | []        |
| data-getter               | 一个自定义方法从数据源获取数据                                             | Function<[DataGetter\<T\>](#typings)>                  | —         |
| fixed-data                | 渲染行在表格主内容上方和 header 下方区域的数据                             | `object`\<[Data](#typings)\>                           | —         |
| expand-column-key         | 列的 key 来标记哪个行可以被展开                                            | `string`                                               | —         |
| expanded-row-keys         | 存放行展开状态的 key 的数组，可以和 `v-model` 搭配使用                     | [KeyType[]](#typings)                                  | —         |
| default-expanded-row-keys | 默认展开的行的 key 的数组, **这个数据不是响应式的**                        | [KeyType[]](#typings)                                  | —         |
| class                     | 表格的类名称，将应用于表格的全部的三个部分 (左、右、主)                    | `string` / `array` / `object`                          | —         |
| fixed                     | 单元格宽度是自适应还是固定                                                 | `boolean`                                              | false     |
| width ^(required)         | 表格的宽度                                                                 | `number`                                               | —         |
| height ^(required)        | 表格的高度                                                                 | `number`                                               | —         |
| max-height                | 表格的最大高度                                                             | `number`                                               | —         |
| indent-size               | 树形表的水平缩进                                                           | `number`                                               | 12        |
| h-scrollbar-size          | 配置表格的水平滚动条大小，防止水平和垂直滚动条重叠。                       | `number`                                               | 10        |
| scrollbar-size            | 配置表格的垂直滚动条大小，防止水平和垂直滚动条重叠。                       | `number`                                               | 10        |
| scrollbar-always-on       | 如果开启，滚动条将一直显示，反之只会在鼠标经过时显示。                     | `boolean`                                              | false     |
| sort-by                   | 排序方式                                                                   | `object`\<[SortBy](#typings)\>                         | {}        |
| sort-state                | 多个排序                                                                   | `object`\<[SortState](#typings)\>                      | undefined |

### Slots

| 插槽名      | 参数                                        |
| ----------- | ------------------------------------------- |
| cell        | `object`\<[CellSlotProps](#typings)\>       |
| header      | `object`\<[HeaderSlotProps](#typings)\>     |
| header-cell | `object`\<[HeaderCellSlotProps](#typings)\> |
| row         | `object`\<[RowSlotProps](#typings)\>        |
| footer      | —                                           |
| empty       | —                                           |
| overlay     | —                                           |

### Events

| 事件名               | 描述                               | 参数                                       |
| -------------------- | ---------------------------------- | ------------------------------------------ |
| column-sort          | 列排序时调用                       | `object`\<[ColumnSortParam](#typings)\>    |
| expanded-rows-change | 行展开状态改变时触发               | [KeyType[]](#typings)                      |
| end-reached          | 到达表格末尾时触发                 | —                                          |
| scroll               | 表格被用户滚动后触发               | `object`\<[ScrollParams](#typings)\>       |
| rows-rendered        | 当行被渲染后触发                   | `object`\<[RowsRenderedParams](#typings)\> |
| row-expand           | 点击箭头图标展开/折叠树节点时触发  | `object`\<[RowExpandParams](#typings)\>    |
| row-event-handlers   | 当每行添加了一系列事件处理器时触发 | `object`\<[RowEventHandlers](#typings)\>   |

### Methods

| 事件名       | 描述                           | 参数                                                                                   |
| ------------ | ------------------------------ | -------------------------------------------------------------------------------------- |
| scrollTo     | 滚动到给定位置                 | ^[Function]`(param: {scrollLeft?: number, scrollTop?: number}) => void`                |
| scrollToLeft | 滚动到给定的水平位置           | ^[Function]`(scrollLeft: number) => void`                                              |
| scrollToTop  | 滚动到给定的垂直位置           | ^[Function]`(scrollTop: number) => void`                                               |
| scrollToRow  | 使用给定的滚动策略滚动至指定行 | ^[Function]`(row: number, strategy?: 'center' \| 'end' \| 'start' \| 'smart') => void` |

:::tip

请注意：这些是 `JavaScript` 对象，所以您 **不能使用** 短横线命名法（kebab-case）来处理这些属性

:::

## Column API

### Attribute

| 属性名             | 描述                                         | 类型                                                             | 默认值 |
| ------------------ | -------------------------------------------- | ---------------------------------------------------------------- | ------ |
| align              | 表格单元格内容对齐方式                       | Alignment                                                        | left   |
| class              | 列的类名                                     | `string`                                                         | —      |
| key                | 唯一标志                                     | [KeyType](#typings)                                              | —      |
| dataKey            | data 的唯一标志符                            | [KeyType](#typings)                                              | —      |
| fixed              | 固定列位置                                   | `boolean` / FixedDir                                             | false  |
| flexGrow           | CSS 属性 flex grow, 仅当不是固定表时才生效   | `number`                                                         | 0      |
| flexShrink         | CSS 属性 flex shrink, 仅当不是固定表时才生效 | `number`                                                         | 1      |
| headerClass        | 自定义 header 头部类名                       | `string`                                                         | —      |
| hidden             | 此列是否不可见                               | `boolean`                                                        | —      |
| style              | 自定义列单元格的类名，将会与 gird 单元格合并 | ^[object]`CSSProperties`                                         | —      |
| sortable           | 设置列是否可排序                             | `boolean`                                                        | —      |
| title              | Header 头部单元格中的默认文本                | `string`                                                         | —      |
| maxWidth           | 列的最大宽度                                 | `number`                                                         | —      |
| minWidth           | 列的最小宽度                                 | `number`                                                         | —      |
| width ^(required)  | 列宽度                                       | `number`                                                         | —      |
| cellRenderer       | 自定义单元格渲染器                           | `VueComponent` / (props: [CellRenderProps](#typings)) => VNode   | —      |
| headerCellRenderer | 自定义头部渲染器                             | `VueComponent` / (props: [HeaderRenderProps](#typings)) => VNode | —      |

