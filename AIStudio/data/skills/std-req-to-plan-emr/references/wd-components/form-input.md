## Form 表单

表单包含 `输入框`, `单选框`, `下拉选择`, `多选框` 等用户输入的组件。 使用表单，您可以收集、验证和提交数据。

### 示例

:::demo 在每一个 `form` 组件中，你需要一个 `form-item` 字段作为输入项的容器，用于获取值与验证值。

```vue
<template>
  <w-form :model="form" label-width="60px" style="max-width: 600px">
    <w-form-item label="请输入名称">
      <w-input v-model="form.name" />
    </w-form-item>
    <w-form-item label="请选择所在区域">
      <w-select v-model="form.region" placeholder="请选择所在区域">
        <w-option label="Zone one" value="shanghai" />
        <w-option label="Zone two" value="beijing" />
      </w-select>
    </w-form-item>
    <w-form-item label="日期">
      <w-col :span="11">
        <w-date-picker
          v-model="form.date1"
          type="date"
          placeholder="选择日期"
          style="width: 100%"
        />
      </w-col>
      <w-col :span="2" class="text-center">
        <span class="text-gray-500">-</span>
      </w-col>
      <w-col :span="11">
        <w-time-picker
          v-model="form.date2"
          placeholder="选择时间"
          style="width: 100%"
        />
      </w-col>
    </w-form-item>
    <w-form-item label="启用">
      <w-switch v-model="form.delivery" />
    </w-form-item>
    <w-form-item label="类型">
      <w-checkbox-group v-model="form.type">
        <w-checkbox value="自费" name="type"> 自费 </w-checkbox>
        <w-checkbox value="医保" name="type"> 医保 </w-checkbox>
        <w-checkbox value="其它" name="type"> 其它 </w-checkbox>
      </w-checkbox-group>
    </w-form-item>
    <w-form-item label="来源">
      <w-radio-group v-model="form.resource">
        <w-radio value="Sponsor">门诊</w-radio>
        <w-radio value="Venue">住院</w-radio>
      </w-radio-group>
    </w-form-item>
    <w-form-item label="说明">
      <w-input v-model="form.desc" type="textarea" />
    </w-form-item>
    <w-form-item content-position="right">
      <w-button>取消</w-button>
      <w-button type="primary" @click="onSubmit">确定</w-button>
    </w-form-item>
  </w-form>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

// do not use same name with ref
const form = reactive({
  name: '',
  region: '',
  date1: '',
  date2: '',
  delivery: false,
  type: [],
  resource: '',
  desc: '',
})

const onSubmit = () => {
  console.log('submit!')
}
</script>
```

:::

:::demo 通过设置 `inline` 属性为 `true` 可以让表单域变为行内的表单域。

```vue
<template>
  <w-form :inline="true" :model="formInline" class="demo-form-inline">
    <w-form-item label="参与者">
      <w-input v-model="formInline.user" placeholder="参与者" clearable />
    </w-form-item>
    <w-form-item label="地址">
      <w-select v-model="formInline.region" placeholder="地址" clearable>
        <w-option label="Zone one" value="shanghai" />
        <w-option label="Zone two" value="beijing" />
      </w-select>
    </w-form-item>
    <w-form-item label="日期">
      <w-date-picker
        v-model="formInline.date"
        type="date"
        placeholder="选择日期"
        clearable
      />
    </w-form-item>
    <w-form-item>
      <w-button type="primary" @click="onSubmit">查询</w-button>
    </w-form-item>
  </w-form>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

const formInline = reactive({
  user: '',
  region: '',
  date: '',
})

const onSubmit = () => {
  console.log('submit!')
}
</script>

<style>
.demo-form-inline .w3-input {
  --w3-input-width: 220px;
}

.demo-form-inline .w3-select {
  --w3-select-width: 220px;
}
</style>
```

:::

:::demo 通过设置 `label-position` 属性可以改变表单域标签的位置，可选值为 `top`、`left`, 当设为 `top` 时标签会置于表单域的顶部

```vue
<template>
  <w-form
    :label-position="labelPosition"
    :content-position="contentPosition"
    label-width="auto"
    :model="formLabelAlign"
    style="max-width: 600px"
  >
    <w-form-item label="表单 label 对齐" label-position="right">
      <w-radio-group v-model="labelPosition" aria-label="label position">
        <w-radio-button value="left">Left</w-radio-button>
        <w-radio-button value="right">Right</w-radio-button>
        <w-radio-button value="top">Top</w-radio-button>
      </w-radio-group>
    </w-form-item>
    <w-form-item label="表单内 label 对齐" label-position="right">
      <w-radio-group
        v-model="itemLabelPosition"
        aria-label="item label position"
      >
        <w-radio-button value="">Empty</w-radio-button>
        <w-radio-button value="left">Left</w-radio-button>
        <w-radio-button value="right">Right</w-radio-button>
        <w-radio-button value="top">Top</w-radio-button>
      </w-radio-group>
    </w-form-item>
    <w-form-item label="表单 content 对齐" label-position="right">
      <w-radio-group v-model="contentPosition" aria-label="label position">
        <w-radio-button value="left">Left</w-radio-button>
        <w-radio-button value="right">Right</w-radio-button>
        <w-radio-button value="center">Center</w-radio-button>
      </w-radio-group>
    </w-form-item>
    <w-form-item label="表单内 content 对齐" label-position="right">
      <w-radio-group
        v-model="itemContentPosition"
        aria-label="item label position"
      >
        <w-radio-button value="left">Left</w-radio-button>
        <w-radio-button value="right">Right</w-radio-button>
        <w-radio-button value="center">Center</w-radio-button>
      </w-radio-group>
    </w-form-item>
    <w-form-item label="姓名" :label-position="itemLabelPosition">
      <w-input v-model="formLabelAlign.name" />
    </w-form-item>
    <w-form-item label="地址" :label-position="itemLabelPosition">
      <w-input v-model="formLabelAlign.region" />
    </w-form-item>
    <w-form-item label="类型" :label-position="itemLabelPosition">
      <w-input v-model="formLabelAlign.type" />
    </w-form-item>
    <w-form-item :content-position="itemContentPosition">
      <w-button>取消</w-button>
      <w-button type="primary">确定</w-button>
    </w-form-item>
  </w-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import type { FormItemProps, FormProps } from 'win-design-next'

const labelPosition = ref<FormProps['labelPosition']>('right')
const itemLabelPosition = ref<FormItemProps['labelPosition']>('')
const contentPosition = ref<FormProps['contentPosition']>('left')
const itemContentPosition = ref<FormItemProps['contentPosition']>('right')

const formLabelAlign = reactive({
  name: '',
  region: '',
  type: '',
})
</script>
```

:::

:::demo `Form` 组件提供了表单验证的功能，只需为 `rules` 属性传入约定的验证规则，并将 `form-Item` 的 `prop` 属性设置为需要验证的特殊键值即可。 校验规则参见 [async-validator](https://github.com/yiminghe/async-validator)

```vue
<template>
  <w-form
    ref="ruleFormRef"
    style="max-width: 600px"
    :model="ruleForm"
    :rules="rules"
    label-width="auto"
    class="demo-ruleForm"
    :size="formSize"
    status-icon
  >
    <w-form-item label="名称" prop="name">
      <w-input v-model="ruleForm.name" />
    </w-form-item>
    <w-form-item label="地址" prop="region">
      <w-select v-model="ruleForm.region" placeholder="地址">
        <w-option label="Zone one" value="shanghai" />
        <w-option label="Zone two" value="beijing" />
      </w-select>
    </w-form-item>
    <w-form-item label="虚拟表格" prop="count">
      <w-select-v2
        v-model="ruleForm.count"
        placeholder="Activity count"
        :options="options"
      />
    </w-form-item>
    <w-form-item label="日期" required>
      <w-col :span="11">
        <w-form-item prop="date1">
          <w-date-picker
            v-model="ruleForm.date1"
            type="date"
            aria-label="选择日期"
            placeholder="选择日期"
            style="width: 100%"
          />
        </w-form-item>
      </w-col>
      <w-col class="text-center" :span="2">
        <span class="text-gray-500">-</span>
      </w-col>
      <w-col :span="11">
        <w-form-item prop="date2">
          <w-time-picker
            v-model="ruleForm.date2"
            aria-label="选择时间"
            placeholder="选择时间"
            style="width: 100%"
          />
        </w-form-item>
      </w-col>
    </w-form-item>
    <w-form-item label="是否启用" prop="delivery">
      <w-switch v-model="ruleForm.delivery" />
    </w-form-item>
    <w-form-item label="地址" prop="location">
      <w-segmented v-model="ruleForm.location" :options="locationOptions" />
    </w-form-item>
    <w-form-item label="类型" prop="type">
      <w-checkbox-group v-model="ruleForm.type">
        <w-checkbox value="Online activities" name="type">
          Online activities
        </w-checkbox>
        <w-checkbox value="Promotion activities" name="type">
          Promotion activities
        </w-checkbox>
        <w-checkbox value="Offline activities" name="type">
          Offline activities
        </w-checkbox>
        <w-checkbox value="Simple brand exposure" name="type">
          Simple brand exposure
        </w-checkbox>
      </w-checkbox-group>
    </w-form-item>
    <w-form-item label="来源" prop="resource">
      <w-radio-group v-model="ruleForm.resource">
        <w-radio value="Sponsorship">Sponsorship</w-radio>
        <w-radio value="Venue">Venue</w-radio>
      </w-radio-group>
    </w-form-item>
    <w-form-item label="备注" prop="desc">
      <w-input v-model="ruleForm.desc" :textarea-height="32" type="textarea" />
    </w-form-item>
    <w-form-item content-position="right">
      <w-button @click="resetForm(ruleFormRef)">重置</w-button>
      <w-button type="primary" @click="submitForm(ruleFormRef)">
        提交
      </w-button>
    </w-form-item>
  </w-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'

import type { ComponentSize, FormInstance, FormRules } from 'win-design-next'

interface RuleForm {
  name: string
  region: string
  count: string
  date1: string
  date2: string
  delivery: boolean
  location: string
  type: string[]
  resource: string
  desc: string
}

const formSize = ref<ComponentSize>('default')
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive<RuleForm>({
  name: 'Hello',
  region: '',
  count: '',
  date1: '',
  date2: '',
  delivery: false,
  location: '',
  type: [],
  resource: '',
  desc: '',
})

const locationOptions = ['Home', 'Company', 'School']

const rules = reactive<FormRules<RuleForm>>({
  name: [
    { required: true, message: '请输入 名称', trigger: 'blur' },
    { min: 3, max: 5, message: 'Length should be 3 to 5', trigger: 'blur' },
  ],
  region: [
    {
      required: true,
      message: 'Please select 地址',
      trigger: 'change',
    },
  ],
  count: [
    {
      required: true,
      message: 'Please select Activity count',
      trigger: 'change',
    },
  ],
  date1: [
    {
      type: 'date',
      required: true,
      message: 'Please pick a date',
      trigger: 'change',
    },
  ],
  date2: [
    {
      type: 'date',
      required: true,
      message: 'Please pick a time',
      trigger: 'change',
    },
  ],
  location: [
    {
      required: true,
      message: 'Please select a location',
      trigger: 'change',
    },
  ],
  type: [
    {
      type: 'array',
      required: true,
      message: 'Please select at least one 类型',
      trigger: 'change',
    },
  ],
  resource: [
    {
      required: true,
      message: 'Please select activity resource',
      trigger: 'change',
    },
  ],
  desc: [{ required: true, message: '请输入 activity form', trigger: 'blur' }],
})

const submitForm = async (formEl: FormInstance | undefined) => {
  if (!formEl) return
  await formEl.validate((valid, fields) => {
    if (valid) {
      console.log('submit!')
    } else {
      console.log('error submit!', fields)
    }
  })
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}

const options = Array.from({ length: 10000 }).map((_, idx) => ({
  value: `${idx + 1}`,
  label: `${idx + 1}`,
}))
</script>
```

:::

:::demo 本例还使用`status-icon`属性为输入框添加了表示校验结果的反馈图标。

```vue
<template>
  <w-form
    ref="ruleFormRef"
    style="max-width: 600px"
    :model="ruleForm"
    status-icon
    :rules="rules"
    label-width="auto"
    class="demo-ruleForm"
  >
    <w-form-item label="密码" prop="pass">
      <w-input v-model="ruleForm.pass" type="password" autocomplete="off" />
    </w-form-item>
    <w-form-item label="确认密码" prop="checkPass">
      <w-input
        v-model="ruleForm.checkPass"
        type="password"
        autocomplete="off"
      />
    </w-form-item>
    <w-form-item label="年龄" prop="age">
      <w-input v-model.number="ruleForm.age" />
    </w-form-item>
    <w-form-item content-position="right">
      <w-button @click="resetForm(ruleFormRef)">重置</w-button>
      <w-button type="primary" @click="submitForm(ruleFormRef)">
        确定
      </w-button>
    </w-form-item>
  </w-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'

import type { FormInstance, FormRules } from 'win-design-next'

const ruleFormRef = ref<FormInstance>()

const checkAge = (rule: any, value: any, callback: any) => {
  if (!value) {
    return callback(new Error('请输入 the age'))
  }
  setTimeout(() => {
    if (!Number.isInteger(value)) {
      callback(new Error('请输入 digits'))
    } else {
      if (value < 18) {
        callback(new Error('Age must be greater than 18'))
      } else {
        callback()
      }
    }
  }, 1000)
}

const validatePass = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请输入 the password'))
  } else {
    if (ruleForm.checkPass !== '') {
      if (!ruleFormRef.value) return
      ruleFormRef.value.validateField('checkPass')
    }
    callback()
  }
}
const validatePass2 = (rule: any, value: any, callback: any) => {
  if (value === '') {
    callback(new Error('请输入 the password again'))
  } else if (value !== ruleForm.pass) {
    callback(new Error("Two inputs don't match!"))
  } else {
    callback()
  }
}

const ruleForm = reactive({
  pass: '',
  checkPass: '',
  age: '',
})

const rules = reactive<FormRules<typeof ruleForm>>({
  pass: [{ validator: validatePass, trigger: 'blur' }],
  checkPass: [{ validator: validatePass2, trigger: 'blur' }],
  age: [{ validator: checkAge, trigger: 'blur' }],
})

const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate((valid) => {
    if (valid) {
      console.log('submit!')
    } else {
      console.log('error submit!')
    }
  })
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}
</script>
```

:::

:::demo 除了一次通过表单组件上的所有验证规则外. 您也可以动态地通过验证规则或删除单个表单字段的规则。

```vue
<template>
  <w-form
    ref="formRef"
    style="max-width: 600px"
    :model="dynamicValidateForm"
    label-width="auto"
    class="demo-dynamic"
  >
    <w-form-item
      prop="email"
      label="Email"
      :rules="[
        {
          required: true,
          message: '请输入 email address',
          trigger: 'blur',
        },
        {
          type: 'email',
          message: '请输入 correct email address',
          trigger: ['blur', 'change'],
        },
      ]"
    >
      <w-input v-model="dynamicValidateForm.email" />
    </w-form-item>
    <w-form-item
      v-for="(domain, index) in dynamicValidateForm.domains"
      :key="domain.key"
      :label="'Domain' + index"
      :prop="'domains.' + index + '.value'"
      :rules="{
        required: true,
        message: 'domain can not be null',
        trigger: 'blur',
      }"
    >
      <w-input v-model="domain.value" />
      <w-button class="mt-2" @click.prevent="removeDomain(domain)">
        Delete
      </w-button>
    </w-form-item>
    <w-form-item content-position="right">
      <w-button @click="addDomain">新增</w-button>
      <w-button @click="resetForm(formRef)">重置</w-button>
      <w-button type="primary" @click="submitForm(formRef)">确定</w-button>
    </w-form-item>
  </w-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import type { FormInstance } from 'win-design-next'

const formRef = ref<FormInstance>()
const dynamicValidateForm = reactive<{
  domains: DomainItem[]
  email: string
}>({
  domains: [
    {
      key: 1,
      value: '',
    },
  ],
  email: '',
})

interface DomainItem {
  key: number
  value: string
}

const removeDomain = (item: DomainItem) => {
  const index = dynamicValidateForm.domains.indexOf(item)
  if (index !== -1) {
    dynamicValidateForm.domains.splice(index, 1)
  }
}

const addDomain = () => {
  dynamicValidateForm.domains.push({
    key: Date.now(),
    value: '',
  })
}

const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate((valid) => {
    if (valid) {
      console.log('submit!')
    } else {
      console.log('error submit!')
    }
  })
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}
</script>
```

:::

:::demo 数字类型的验证需要在 `v-model` 处加上 `.number` 的修饰符，这是 Vue 自身提供的用于将绑定值转化为 number 类型的修饰符。

```vue
<template>
  <w-form
    ref="formRef"
    style="max-width: 600px"
    :model="numberValidateForm"
    label-width="auto"
    class="demo-ruleForm"
  >
    <w-form-item
      label="年龄"
      prop="age"
      :rules="[
        { required: true, message: 'age is required' },
        { type: 'number', message: 'age must be a number' },
      ]"
    >
      <w-input
        v-model.number="numberValidateForm.age"
        type="text"
        autocomplete="off"
      />
    </w-form-item>
    <w-form-item content-position="right">
      <w-button @click="resetForm(formRef)">重置</w-button>
      <w-button type="primary" @click="submitForm(formRef)">确定</w-button>
    </w-form-item>
  </w-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import type { FormInstance } from 'win-design-next'

const formRef = ref<FormInstance>()

const numberValidateForm = reactive({
  age: '',
})

const submitForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.validate((valid) => {
    if (valid) {
      console.log('submit!')
    } else {
      console.log('error submit!')
    }
  })
}

const resetForm = (formEl: FormInstance | undefined) => {
  if (!formEl) return
  formEl.resetFields()
}
</script>
```

:::

:::demo 如果希望某个表单项或某个表单组件的尺寸不同于 Form 上的 `size` 属性，直接为这个表单项或表单组件设置自己的 size 属性即可。

```vue
<template>
  <div>
    <w-radio-group v-model="size" aria-label="size control">
      <w-radio-button value="large">large</w-radio-button>
      <w-radio-button value="default">default</w-radio-button>
      <w-radio-button value="small">small</w-radio-button>
      <w-radio-button value="mini">mini</w-radio-button>
    </w-radio-group>
    <w-radio-group v-model="labelPosition" aria-label="position control">
      <w-radio-button value="left">Left</w-radio-button>
      <w-radio-button value="right">Right</w-radio-button>
      <w-radio-button value="top">Top</w-radio-button>
    </w-radio-group>
  </div>
  <br />
  <w-form
    style="max-width: 600px"
    :model="sizeForm"
    label-width="auto"
    :label-position="labelPosition"
    :size="size"
  >
    <w-form-item label="名称">
      <w-input v-model="sizeForm.name" />
    </w-form-item>
    <w-form-item label="地址">
      <w-select v-model="sizeForm.region" placeholder="请选择所在区域">
        <w-option label="Zone one" value="shanghai" />
        <w-option label="Zone two" value="beijing" />
      </w-select>
    </w-form-item>
    <w-form-item label="日期">
      <w-col :span="11">
        <w-date-picker
          v-model="sizeForm.date1"
          type="date"
          aria-label="选择日期"
          placeholder="选择日期"
          style="width: 100%"
        />
      </w-col>
      <w-col class="text-center" :span="1" style="margin: 0 0.5rem">-</w-col>
      <w-col :span="11">
        <w-time-picker
          v-model="sizeForm.date2"
          aria-label="选择时间"
          placeholder="选择时间"
          style="width: 100%"
        />
      </w-col>
    </w-form-item>
    <w-form-item label="类型">
      <w-checkbox-group v-model="sizeForm.type">
        <w-checkbox-button value="Online activities" name="type">
          Online activities
        </w-checkbox-button>
        <w-checkbox-button value="Promotion activities" name="type">
          Promotion activities
        </w-checkbox-button>
      </w-checkbox-group>
    </w-form-item>
    <w-form-item label="来源">
      <w-radio-group v-model="sizeForm.resource">
        <w-radio border value="Sponsor">Sponsor</w-radio>
        <w-radio border value="Venue">Venue</w-radio>
      </w-radio-group>
    </w-form-item>
    <w-form-item content-position="right">
      <w-button>取消</w-button>
      <w-button type="primary" @click="onSubmit">确定</w-button>
    </w-form-item>
  </w-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'

import type { ComponentSize, FormProps } from 'win-design-next'

const size = ref<ComponentSize>('default')
const labelPosition = ref<FormProps['labelPosition']>('right')

const sizeForm = reactive({
  name: '',
  region: '',
  date1: '',
  date2: '',
  delivery: false,
  type: [],
  resource: '',
  desc: '',
})

function onSubmit() {
  console.log('submit!')
}
</script>

<style>
.w3-radio-group {
  margin-right: 12px;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-form label-position="left" label-width="auto" style="max-width: 600px">
    <w-space fill>
      <w-alert type="info" show-icon :closable="false">
        <p>"Full Name" label is automatically attached to the input:</p>
      </w-alert>
      <w-form-item label="Full Name">
        <w-input v-model="formAccessibility.fullName" />
      </w-form-item>
    </w-space>
    <w-space fill>
      <w-alert type="info" show-icon :closable="false">
        <p>
          "Your Information" serves as a label for the group of inputs. <br />
          You must specify labels on the individal inputs. Placeholders are not
          replacements for using the "label" attribute.
        </p>
      </w-alert>
      <w-form-item label="Your Information">
        <w-row :gutter="20">
          <w-col :span="12">
            <w-input
              v-model="formAccessibility.firstName"
              aria-label="First Name"
              placeholder="First Name"
            />
          </w-col>
          <w-col :span="12">
            <w-input
              v-model="formAccessibility.lastName"
              aria-label="Last Name"
              placeholder="Last Name"
            />
          </w-col>
        </w-row>
      </w-form-item>
    </w-space>
  </w-form>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'

const formAccessibility = reactive({
  fullName: '',
  firstName: '',
  lastName: '',
})
</script>
```

:::

### API 文档

### Attributes

| 属性名                    | 说明                                                                                                                                                 | 类型                                           | 默认值 |
| ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------- | ------ |
| model                     | 表单数据对象                                                                                                                                         | ^[object]`Record<string, any>`                 | —      |
| rules                     | 表单验证规则                                                                                                                                         | ^[object]`FormRules`                           | —      |
| inline                    | 行内表单模式                                                                                                                                         | ^[boolean]                                     | false  |
| label-position            | 表单域标签的位置， 当设置为 `left` 或 `right` 时，则也需要设置 `label-width` 属性                                                                    | ^[enum]`'left' \| 'right' \| 'top'`            | right  |
| label-width               | 标签的长度，例如 `'50px'`。 作为 Form 直接子元素的 form-item 会继承该值。 可以使用 `auto`。                                                          | ^[string] / ^[number]                          | ''     |
| label-suffix              | 表单域标签的后缀                                                                                                                                     | ^[string]                                      | ''     |
| hide-required-asterisk    | 是否隐藏必填字段标签旁边的红色星号。                                                                                                                 | ^[boolean]                                     | false  |
| require-asterisk-position | 星号的位置。                                                                                                                                         | ^[enum]`'left' \| 'right'`                     | left   |
| show-message              | 是否显示校验错误信息                                                                                                                                 | ^[boolean]                                     | true   |
| inline-message            | 是否以行内形式展示校验信息                                                                                                                           | ^[boolean]                                     | false  |
| status-icon               | 是否在输入框中显示校验结果反馈图标                                                                                                                   | ^[boolean]                                     | false  |
| validate-on-rule-change   | 是否在 `rules` 属性改变后立即触发一次验证                                                                                                            | ^[boolean]                                     | true   |
| size                      | 用于控制该表单内组件的尺寸                                                                                                                           | ^[enum]`'' \| 'large' \| 'default' \| 'small'` | —      |
| disabled                  | 是否禁用该表单内的所有组件。 如果设置为 `true`, 它将覆盖内部组件的 `disabled` 属性                                                                   | ^[boolean]                                     | false  |
| scroll-to-error           | 当校验失败时，滚动到第一个错误表单项                                                                                                                 | ^[boolean]                                     | false  |
| scroll-into-view-options  | 当校验有失败结果时，滚动到第一个失败的表单项目 可通过 [scrollIntoView](https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView) 配置 | ^[object]`Record<string, any>` / ^[boolean]    | —      |

### Events

| 名称     | 说明                   | 类型                                                                         |
| -------- | ---------------------- | ---------------------------------------------------------------------------- |
| validate | 任一表单项被校验后触发 | ^[Function]`(prop: FormItemProp, isValid: boolean, message: string) => void` |

### Slots

| 事件名  | 说明           | 子标签   |
| ------- | -------------- | -------- |
| default | 自定义默认内容 | FormItem |

### Exposes

| 名称          | 说明                                                            | 类型                                                                                                                              |
| ------------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| validate      | 对整个表单的内容进行验证。 接收一个回调函数，或返回 `Promise`。 | ^[Function]`(callback?: FormValidateCallback) => Promise<void>`                                                                   |
| validateField | 验证具体的某个字段。                                            | ^[Function]`(props?: Arrayable<FormItemProp> \| undefined, callback?: FormValidateCallback \| undefined) => FormValidationResult` |
| resetFields   | 重置该表单项，将其值重置为初始值，并移除校验结果                | ^[Function]`(props?: Arrayable<FormItemProp> \| undefined) => void`                                                               |
| scrollToField | 滚动到指定的字段                                                | ^[Function]`(prop: FormItemProp) => void`                                                                                         |
| clearValidate | 清理某个字段的表单验证信息。                                    | ^[Function]`(props?: Arrayable<FormItemProp> \| undefined) => void`                                                               |
| fields        | 获取所有字段的 context                                          | ^[array]`FormItemContext[]`                                                                                                       |

## FormItem API

### Attributes

| 属性名          | 说明                                                                                                                                   | 类型                                                | Default |
| --------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------- | ------- |
| prop            | `model` 的键名。 它可以是一个属性的值(如 `a.b.0` 或 `['a', 'b', '0']`)。 在使用了 `validate`、`resetFields` 的方法时，该属性是必填的。 | ^[string] / ^[string&#91;&#93;]                     | —       |
| label           | 标签文本                                                                                                                               | ^[string]                                           | —       |
| label-position  | 表单域标签的位置， 当设置为 `left` 或 `right` 时，则也需要设置 `label-width` 属性 默认会继承 `Form`的`label-position`                  | ^[enum]`'left' \| 'right' \| 'top'`                 | ''      |
| label-width     | 标签宽度，例如 `'50px'`。 可以使用 `auto`。                                                                                            | ^[string] / ^[number]                               | ''      |
| required        | 是否为必填项，如不设置，则会根据校验规则确认                                                                                           | ^[boolean]                                          | —       |
| rules           | 表单验证规则, 具体配置见[下表](#formitemrule), 更多内容可以参考[async-validator](https://github.com/yiminghe/async-validator)          | ^[object]`Arrayable<FormItemRule>`                  | —       |
| error           | 表单域验证错误时的提示信息。设置该值会导致表单验证状态变为 error，并显示该错误信息。                                                   | ^[string]                                           | —       |
| show-message    | 是否显示校验错误信息                                                                                                                   | ^[boolean]                                          | true    |
| inline-message  | 是否在行内显示校验信息                                                                                                                 | ^[string] / ^[boolean]                              | ''      |
| size            | 用于控制该表单域下组件的默认尺寸                                                                                                       | ^[enum]`'' \| 'large' \| 'default' \| 'small'`      | —       |
| for             | 和原生标签相同能力                                                                                                                     | ^[string]                                           | —       |
| validate-status | formitem 校验的状态                                                                                                                    | ^[enum]`'' \| 'error' \| 'validating' \| 'success'` | —       |

#### FormItemRule

| 名称    | 说明               | 类型                        | 默认值 |
| ------- | ------------------ | --------------------------- | ------ |
| trigger | 验证逻辑的触发方式 | ^[enum]`'blur' \| 'change'` | —      |

:::tip

如果您不想根据输入事件触发验证器， 在相应的输入类型组件上设置 `validate-event` 属性为 `false` (`<w-input>`, `<w-radio>`, `<w-select>`, . ……).

:::

### Slots

| 插槽名  | 说明                   | 类型                         |
| ------- | ---------------------- | ---------------------------- |
| default | 表单的内容。           | —                            |
| label   | 标签位置显示的内容     | ^[object]`{ label: string }` |
| error   | 验证错误信息的显示内容 | ^[object]`{ error: string }` |

### Exposes

| 名称            | 说明                                                 | 类型                                                                                                 |
| --------------- | ---------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| size            | 表单项大小                                           | ^[object]`ComputedRef<'' \| 'large' \| 'default' \| 'small'>`                                        |
| validateMessage | 校验消息                                             | ^[object]`Ref<string>`                                                                               |
| validateState   | 校验状态                                             | ^[object]`Ref<'' \| 'error' \| 'validating' \| 'success'>`                                           |
| validate        | 验证表单项                                           | ^[Function]`(trigger: string, callback?: FormValidateCallback \| undefined) => FormValidationResult` |
| resetField      | 对该表单项进行重置，将其值重置为初始值并移除校验结果 | ^[Function]`() => void`                                                                              |
| clearValidate   | 移除该表单项的校验结果                               | ^[Function]`() => void`                                                                              |

## Input 输入框

通过鼠标或键盘输入字符

### 示例

:::demo

```vue
<template>
  <div class="mb-4">
    <w-title>基础样式</w-title>
    <div class="flex gap-4">
      <w-input v-model="input" style="width: 240px" placeholder="请输入" />
    </div>
  </div>
  <w-divider />
  <div class="mb-4">
    <w-title>禁用样式：通过 disabled 属性指定是否禁用 input 组件</w-title>
    <div class="flex gap-4 items-center">
      <w-input
        v-model="input1"
        style="width: 240px"
        disabled
        placeholder="请输入"
      />
      <w-input
        v-model="input2"
        style="width: 240px"
        disabled
        placeholder="请输入"
      />
    </div>
  </div>
  <w-divider />
  <div class="mb-4">
    <w-title>四种尺寸</w-title>
    <div class="flex gap-4 items-center">
      <w-input
        v-model="input3"
        style="width: 240px"
        size="large"
        placeholder="请输入"
        :suffix-icon="Search"
      />
      <w-input
        v-model="input4"
        style="width: 240px"
        placeholder="请输入"
        :suffix-icon="Search"
      />
      <w-input
        v-model="input5"
        style="width: 240px"
        size="small"
        placeholder="请输入"
        :suffix-icon="Search"
      />
      <w-input
        v-model="input6"
        style="width: 240px"
        size="mini"
        placeholder="请输入"
        :suffix-icon="Search"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Search } from '@win-design-next/icons-vue'

const input = ref('')
const input1 = ref('')
const input2 = ref('测试数据')
const input3 = ref('')
const input4 = ref('')
const input5 = ref('')
const input6 = ref('')
</script>
```

:::

:::demo 使用 `clearable` 属性即可得到一个可一键清空的输入框；使用 `clear-icon` 属性即可自定义删除按钮。

```vue
<template>
  <w-input
    v-model="input"
    style="width: 240px"
    placeholder="请输入"
    clearable
  />
  <w-input
    v-model="input"
    class="ml-4"
    style="width: 240px"
    placeholder="请输入"
    clearable
    :clear-icon="CircleClose"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { CircleClose } from '@win-design-next/icons-vue'

const input = ref('')
</script>
```

:::

:::demo 使用 `plain` 属性即可得到一个轻量化输入框。

```vue
<template>
  <div class="flex">
    <w-input
      v-model="input"
      plain
      :prefix-icon="User"
      style="width: 240px"
      placeholder="用户名/工号"
      clearable
    />

    <w-input
      v-model="input"
      class="ml-4"
      disabled
      plain
      style="width: 240px"
      :prefix-icon="User"
      placeholder="用户名/工号"
      clearable
    />
  </div>
  <div class="flex mt-4">
    <w-input
      v-model="psw"
      plain
      type="password"
      :prefix-icon="Lock"
      style="width: 240px"
      placeholder="密码"
      clearable
    />

    <w-input
      v-model="psw"
      class="ml-4"
      disabled
      plain
      type="password"
      :prefix-icon="Lock"
      style="width: 240px"
      placeholder="请输入密码"
      clearable
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import { Lock, User } from '@win-design-next/icons-vue'

const input = ref('')
const psw = ref('')
</script>
```

:::

:::demo 使用 `status` 为输入框添加状态，使用 `tips` 为状态添加提示信息。

```vue
<template>
  <div class="flex gap-4 items-center mb-8">
    <w-input v-model="input" placeholder="请输入" clearable tips="文本提示" />
    <w-input
      v-model="input"
      status="success"
      tips="校验通过文本提示"
      placeholder="请输入"
      clearable
    />
    <w-input
      v-model="input"
      status="error"
      tips="校验存在严重问题文本提示"
      placeholder="请输入"
      clearable
    />
    <w-input
      v-model="input"
      status="danger"
      tips="校验存在严重问题文本提示"
      placeholder="请输入"
      clearable
    />
    <w-input
      v-model="input"
      status="warning"
      tips="校验不通过文本提示"
      placeholder="请输入"
      clearable
    />
  </div>
  <div class="flex gap-4 items-center mb-8">
    <w-input
      v-model="textarea"
      :rows="2"
      type="textarea"
      placeholder="请输入"
    />
    <w-input
      v-model="textarea"
      :rows="2"
      type="textarea"
      status="success"
      tips="校验通过文本提示"
      placeholder="请输入"
    />
    <w-input
      v-model="textarea"
      :rows="2"
      type="textarea"
      status="error"
      tips="校验存在严重问题文本提示"
      placeholder="请输入"
    />
    <w-input
      v-model="textarea"
      :rows="2"
      type="textarea"
      status="danger"
      tips="校验存在严重问题文本提示"
      placeholder="请输入"
    />
    <w-input
      v-model="textarea"
      :rows="2"
      type="textarea"
      status="warning"
      tips="校验不通过文本提示"
      placeholder="请输入"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const input = ref('')
const textarea = ref('')
</script>
```

:::

:::demo

```vue
<template>
  <w-input
    v-model="input"
    style="width: 240px"
    placeholder="请输入"
    :formatter="(value) => `$ ${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')"
    :parser="(value) => value.replace(/\$\s?|(,*)/g, '')"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const input = ref('')
</script>
```

:::

:::demo 使用 `show-password` 属性即可得到一个可切换显示隐藏的密码框

```vue
<template>
  <w-input
    v-model="input"
    style="width: 240px"
    type="password"
    placeholder="请输入 password"
    show-password
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const input = ref('')
</script>
```

:::

:::demo 要在输入框中添加图标，你可以简单地使用 `prefix-icon` 和 `suffix-icon` 属性。 另外， `prefix` 和 `suffix` 命名的插槽也能正常工作。

```vue
<template>
  <div class="flex gap-4 mb-4">
    <span>使用属性</span>
    <w-input
      v-model="input1"
      style="width: 240px"
      placeholder="选择日期"
      :suffix-icon="Date"
    />
    <w-input
      v-model="input2"
      style="width: 240px"
      placeholder="输入关键字搜索"
      :prefix-icon="Search"
    />
  </div>
  <div class="flex mb-4 gap-4 flex-wrap">
    <span>使用插槽</span>
    <w-input v-model="input3" style="width: 240px" placeholder="选择日期">
      <template #suffix>
        <w-icon class="w3-input__icon"><Date /></w-icon>
      </template>
    </w-input>
    <w-input v-model="input4" style="width: 240px" placeholder="输入关键字搜索">
      <template #prefix>
        <w-icon class="w3-input__icon"><search /></w-icon>
      </template>
    </w-input>
  </div>
  <div class="flex gap-4 flex-wrap">
    <span>删除位置</span>
    <w-input
      v-model="input4"
      clearable
      style="width: 240px"
      placeholder="输入关键字搜索"
    >
      <template #prefix> <span>前缀</span> </template>
      <template #suffix> <span>后缀</span> </template>
    </w-input>
    <w-input
      v-model="input4"
      clearable
      prepend-clear
      style="width: 240px"
      placeholder="输入关键字搜索"
    >
      <template #prefix> <span>前缀</span> </template>
      <template #suffix> <span>后缀</span> </template>
    </w-input>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Date, Search } from '@win-design-next/icons-vue'

const input1 = ref('')
const input2 = ref('')
const input3 = ref('')
const input4 = ref('测试')
</script>
```

:::

:::demo 文本域高度可通过 `rows` 属性控制

```vue
<template>
  <div class="flex gap-4 flex-wrap">
    <w-input
      v-model="textarea"
      style="width: 240px"
      :rows="2"
      type="textarea"
      placeholder="请输入"
    />

    <w-input
      v-model="textarea"
      disabled
      style="width: 240px"
      :rows="2"
      type="textarea"
      placeholder="请输入"
    />

    <w-input
      v-model="textarea1"
      disabled
      style="width: 240px"
      :rows="2"
      type="textarea"
      placeholder="请输入"
    />
  </div>
  <div class="flex gap-4 flex-wrap mt-4">
    <w-input
      v-model="textarea2"
      style="width: 240px"
      :textarea-height="32"
      type="textarea"
      placeholder="请输入"
    />

    <w-input
      v-model="textarea3"
      style="width: 240px"
      :textarea-height="32"
      type="textarea"
      autosize
      placeholder="请输入"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const textarea = ref('')
const textarea1 = ref('测试')
const textarea2 = ref('通过 textarea-height 设置高度')
const textarea3 = ref('通过 textarea-height 设置高度')
</script>
```

:::

:::demo

```vue
<template>
  <w-input
    v-model="textarea1"
    style="width: 240px"
    autosize
    type="textarea"
    placeholder="请输入"
  />
  <div style="margin: 20px 0" />
  <w-input
    v-model="textarea2"
    style="width: 240px"
    :autosize="{ minRows: 2, maxRows: 4 }"
    type="textarea"
    placeholder="请输入"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const textarea1 = ref('')
const textarea2 = ref('')
</script>
```

:::

:::demo 可通过 `slot` 来指定在 Input 中分发的前置或者后置的内容。

```vue
<template>
  <div>
    <w-input v-model="input1" style="max-width: 600px" placeholder="请输入">
      <template #prepend>Http://</template>
    </w-input>
  </div>
  <div class="mt-4">
    <w-input v-model="input2" style="max-width: 600px" placeholder="请输入">
      <template #append>.com</template>
    </w-input>
  </div>
  <div class="mt-4">
    <w-input
      v-model="input3"
      style="max-width: 600px"
      placeholder="请输入"
      class="input-with-select"
    >
      <template #prepend>
        <w-select v-model="select" placeholder="Select" style="width: 115px">
          <w-option label="Restaurant" value="1" />
          <w-option label="Order No." value="2" />
          <w-option label="Tel" value="3" />
        </w-select>
      </template>
      <template #append>
        <w-button :icon="Search" />
      </template>
    </w-input>
  </div>
  <div class="mt-4">
    <w-input
      v-model="input3"
      style="max-width: 600px"
      placeholder="请输入"
      class="input-with-select"
    >
      <template #prepend>
        <w-button :icon="Search" />
      </template>
      <template #append>
        <w-select v-model="select" placeholder="Select" style="width: 115px">
          <w-option label="Restaurant" value="1" />
          <w-option label="Order No." value="2" />
          <w-option label="Tel" value="3" />
        </w-select>
      </template>
    </w-input>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@win-design-next/icons-vue'

const input1 = ref('')
const input2 = ref('')
const input3 = ref('')
const select = ref('')
</script>

<style>
.input-with-select .w3-input-group__prepend {
  background-color: var(--w3-fill-color-blank);
}
</style>
```

:::

:::demo 使用 `maxlength` 和 `minlength` 属性, 来控制输入内容的最大字数和最小字数。 "字符数"使用 JavaScript 字符串长度来衡量。 为文本或文本输入类型设置 `maxlength` prop 可以限制输入值的长度。 允许你通过设置 `show-word-limit` 到 `true` 来显示剩余字数。从 ^(1.0.6) 版本开始，你可以将 `word-limit-position` 设置为 `outside`，以在输入框外显示字数统计。

```vue
<template>
  <w-input
    v-model="text"
    style="width: 240px"
    maxlength="10"
    placeholder="请输入"
    show-word-limit
    type="text"
  />
  <w-input
    v-model="text"
    class="ml-4"
    style="width: 240px"
    maxlength="10"
    placeholder="请输入"
    show-word-limit
    word-limit-position="outside"
    type="text"
  />
  <div style="margin: 20px 0" />
  <w-input
    v-model="textarea"
    maxlength="30"
    style="width: 240px"
    placeholder="请输入"
    show-word-limit
    type="textarea"
  />
  <w-input
    v-model="textarea"
    class="ml-4"
    maxlength="30"
    style="width: 240px"
    placeholder="请输入"
    show-word-limit
    word-limit-position="outside"
    type="textarea"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const text = ref('')
const textarea = ref('')
</script>
```

:::

### API 文档

### Attributes

| 参数                         | 说明                                                                                                           | 类型                                                                                                                                                                                                                        | 默认值              | Version |
| ---------------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------- | ------- |
| type                         | 类型                                                                                                           | ^[string]`'text' \| 'textarea' \| 'password' \| 'button' \| 'checkbox' \| 'file' \| 'number' \| 'radio' \| ...` 等[原生 input 类型](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/input#Form_%3Cinput%3E_types) | text                |
| model-value / v-model        | 绑定值                                                                                                         | ^[string] / ^[number]                                                                                                                                                                                                       | —                   |
| model-modifiers ^(1.0.6)     | v-model 修饰符，参考 [Vue modifiers](https://vuejs.org/guide/essentials/forms.html#modifiers)                  | ^[object]`{ lazy?: boolean, number?: boolean, trim?: boolean }`                                                                                                                                                             | —                   |
| maxlength                    | 同原生 `maxlength` 属性                                                                                        | ^[string] / ^[number]                                                                                                                                                                                                       | —                   |
| minlength                    | 原生属性，最小输入长度                                                                                         | ^[string] / ^[number]                                                                                                                                                                                                       | —                   |
| show-word-limit              | 是否显示统计字数, 只在 `type` 为 'text' 或 'textarea' 的时候生效                                               | ^[boolean]                                                                                                                                                                                                                  | false               |
| word-limit-position ^(1.0.6) | 字数统计的位置，仅当 `show-word-limit` 为 `true` 时生效                                                        | ^[enum]`'inside' \| 'outside' `                                                                                                                                                                                             | "inside"            |
| placeholder                  | 输入框占位文本                                                                                                 | ^[string]                                                                                                                                                                                                                   | —                   |
| clearable                    | 是否显示清除按钮，只有当 `type` 不是 textarea 时生效                                                           | ^[boolean]                                                                                                                                                                                                                  | false               |
| formatter                    | 指定输入值的格式。(只有当 `type` 是"text"时才能工作)                                                           | ^[Function]`(value: string \| number) => string`                                                                                                                                                                            | —                   |
| parser                       | 指定从格式化器输入中提取的值。(仅当 `type` 是"text"时才起作用)                                                 | ^[Function]`(value: string) => string`                                                                                                                                                                                      | —                   |
| show-password                | 是否显示切换密码图标                                                                                           | ^[boolean]                                                                                                                                                                                                                  | false               |
| disabled                     | 是否禁用                                                                                                       | ^[boolean]                                                                                                                                                                                                                  | false               |
| size                         | 输入框尺寸，只在 `type` 不为 'textarea' 时有效                                                                 | ^[enum]`'large' \| 'default' \| 'mini' \| 'small'`                                                                                                                                                                          | —                   |
| prefix-icon                  | 自定义前缀图标                                                                                                 | ^[string] / ^[Component]                                                                                                                                                                                                    | —                   |
| suffix-icon                  | 自定义后缀图标                                                                                                 | ^[string] / ^[Component]                                                                                                                                                                                                    | —                   |
| textarea-height ^(1.0.11)    | 输入框高度，仅 `type` 为 'textarea' 时生效                                                                     | ^[number]                                                                                                                                                                                                                   | -                   |
| rows                         | 输入框行数，仅 `type` 为 'textarea' 时有效                                                                     | ^[number]                                                                                                                                                                                                                   | 2                   |
| autosize                     | textarea 高度是否自适应，仅 `type` 为 'textarea' 时生效。 可以接受一个对象，比如: `{ minRows: 2, maxRows: 6 }` | ^[boolean] / ^[object]`{ minRows?: number, maxRows?: number }`                                                                                                                                                              | false               |
| autocomplete                 | 原生 `autocomplete` 属性                                                                                       | ^[string]                                                                                                                                                                                                                   | off                 |
| name                         | 等价于原生 input `name` 属性                                                                                   | ^[string]                                                                                                                                                                                                                   | —                   |
| readonly                     | 原生 `readonly` 属性，是否只读                                                                                 | ^[boolean]                                                                                                                                                                                                                  | false               |
| max                          | 原生 `max` 属性，设置最大值                                                                                    | —                                                                                                                                                                                                                           | —                   |
| min                          | 原生属性，设置最小值                                                                                           | —                                                                                                                                                                                                                           | —                   |
| step                         | 原生属性，设置输入字段的合法数字间隔                                                                           | —                                                                                                                                                                                                                           | —                   |
| resize                       | 控制是否能被用户缩放                                                                                           | ^[enum]`'none' \| 'both' \| 'horizontal' \| 'vertical'`                                                                                                                                                                     | —                   |
| autofocus                    | 原生属性，自动获取焦点                                                                                         | ^[boolean]                                                                                                                                                                                                                  | false               |
| form                         | 原生属性                                                                                                       | `string`                                                                                                                                                                                                                    | —                   |
| aria-label ^(a11y)           | 等价于原生 input `aria-label` 属性                                                                             | ^[string]                                                                                                                                                                                                                   | —                   |
| tabindex                     | 输入框的 tabindex                                                                                              | ^[string] / ^[number]                                                                                                                                                                                                       | —                   |
| validate-event               | 输入时是否触发表单的校验                                                                                       | ^[boolean]                                                                                                                                                                                                                  | true                |
| input-style                  | input 元素或 textarea 元素的 style                                                                             | ^[string] / ^[object]`CSSProperties \| CSSProperties[] \| string[]`                                                                                                                                                         | {}                  |
| label ^(a11y) ^(deprecated)  | 等价于原生 input `aria-label` 属性                                                                             | ^[string]                                                                                                                                                                                                                   | —                   |
| clear-icon                   | 自定义清除图标                                                                                                 | ^[string] / ^[object]`Component`                                                                                                                                                                                            | `CircleCloseFilled` | V0.0.8  |
| status                       | 输入框状态                                                                                                     | ^[enum]`'success' \| 'warning' \| 'error' \| 'danger' \| 'default'`                                                                                                                                                         |                     |
| tips                         | 输入框状态提示信息                                                                                             | ^[string]                                                                                                                                                                                                                   | —                   |
| prepend-clear ^(1.1.5)       | 是否在输入框前置显示清除按钮                                                                                   | ^[boolean]                                                                                                                                                                                                                  | false               |

### Events

| 事件名 | 说明                                                          | 类型                                           |
| ------ | ------------------------------------------------------------- | ---------------------------------------------- |
| blur   | 当选择器的输入框失去焦点时触发                                | ^[Function]`(event: FocusEvent) => void`       |
| focus  | 当选择器的输入框获得焦点时触发                                | ^[Function]`(event: FocusEvent) => void`       |
| change | 仅当 modelValue 改变时，当输入框失去焦点或用户按 Enter 时触发 | ^[Function]`(value: string \| number) => void` |
| input  | 在 Input 值改变时触发                                         | ^[Function]`(value: string \| number) => void` |
| clear  | 在点击由 `clearable` 属性生成的清空按钮时触发                 | ^[Function]`() => void`                        |

### Slots

| 插槽名  | 说明                                          |
| ------- | --------------------------------------------- |
| prefix  | 输入框头部内容，只对非 `type="textarea"` 有效 |
| suffix  | 输入框尾部内容，只对非 `type="textarea"` 有效 |
| prepend | 输入框前置内容，只对非 `type="textarea"` 有效 |
| append  | 输入框后置内容，只对非 `type="textarea"` 有效 |

### Exposes

| 名称           | 说明                        | 类型                                                    |
| -------------- | --------------------------- | ------------------------------------------------------- |
| blur           | 使 input 失去焦点           | ^[Function]`() => void`                                 |
| clear          | 清除 input 值               | ^[Function]`() => void`                                 |
| focus          | 使 input 获取焦点           | ^[Function]`() => void`                                 |
| input          | Input HTML 元素             | ^[object]`Ref<HTMLInputElement>`                        |
| ref            | HTML 元素 input 或 textarea | ^[object]`Ref<HTMLInputElement \| HTMLTextAreaElement>` |
| resizeTextarea | 改变 textarea 大小          | ^[Function]`() => void`                                 |
| select         | 选中 input 中的文字         | ^[Function]`() => void`                                 |
| textarea       | HTML textarea 元素          | ^[object]`Ref<HTMLTextAreaElement>`                     |
| textareaStyle  | textarea 的样式             | ^[object]`Ref<StyleValue>`                              |
| isComposing    | 是否是输入 composing 状态   | ^[object]`Ref<boolean>`                                 |

## Input Number 数字输入框

仅允许输入标准的数字值，可定义范围

### 示例

:::demo 要使用它，只需要在 `<w-input-number>` 元素中使用 `v-model` 绑定变量即可，变量的初始值即为默认值。`disabled`属性接受一个 `Boolean`，设置为`true`即可禁用整个组件。 ，如果你只需要控制数值在某一范围内，可以设置 `min` 属性和 `max` 属性， 默认最小值为 `0`。

```vue
<template>
  <div class="mb-4">
    <w-title>基础样式</w-title>
    <div class="flex gap-4">
      <w-input-number
        v-model="num1"
        :min="1"
        :max="10"
        @change="handleChange"
      />
    </div>
  </div>
  <div class="mb-4">
    <w-title>禁用样式</w-title>
    <div class="flex gap-4">
      <w-input-number v-model="num2" :disabled="true" />
      <w-input-number v-model="num7" placeholder="请输入" :disabled="true" />
    </div>
  </div>
  <div class="mb-4">
    <w-title>四种尺寸</w-title>
    <div class="flex gap-4 items-center">
      <w-input-number v-model="num3" size="large" />
      <w-input-number v-model="num4" class="mx-4" />
      <w-input-number v-model="num5" size="small" />
      <w-input-number v-model="num6" size="mini" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const num1 = ref(1)

const num2 = ref(1)
const num3 = ref(1)
const num4 = ref(1)
const num5 = ref(1)
const num6 = ref(1)
const num7 = ref(null)

const handleChange = (value: number | undefined) => {
  console.log(value)
}
</script>
```

:::

:::demo 使用 `status` 为输入框添加状态，使用 `tips` 为状态添加提示信息。

```vue
<template>
  <div class="flex gap-4 items-center mb-8">
    <w-input-number
      v-model="input"
      placeholder="请输入"
      clearable
      tips="文本提示"
    />
    <w-input-number
      v-model="input"
      status="success"
      tips="校验通过文本提示"
      placeholder="请输入"
      clearable
    />
    <w-input-number
      v-model="input"
      status="error"
      tips="校验存在严重问题文本提示"
      placeholder="请输入"
      clearable
    />
    <w-input-number
      v-model="input"
      status="danger"
      tips="校验存在严重问题文本提示"
      placeholder="请输入"
      clearable
    />
    <w-input-number
      v-model="input"
      status="warning"
      tips="校验不通过文本提示"
      placeholder="请输入"
      clearable
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const input = ref(1)
</script>
```

:::

:::demo 设置 `controls-position` 属性可以控制按钮位置。

```vue
<template>
  <w-input-number
    v-model="num"
    :min="1"
    :max="10"
    controls-position=""
    size="large"
    @change="handleChange"
  />
  <w-input-number
    v-model="num"
    class="mx-4"
    :min="1"
    :max="10"
    controls-position=""
    @change="handleChange"
  />
  <w-input-number
    v-model="num"
    :min="1"
    class="mr-4"
    disabled
    :max="10"
    size="small"
    controls-position=""
    @change="handleChange"
  />
  <w-input-number
    v-model="num"
    :min="1"
    disabled
    :max="10"
    size="mini"
    controls-position=""
    @change="handleChange"
  />
</template>
<script lang="ts" setup>
import { ref } from 'vue'

const num = ref(1)
const handleChange = (value: number | undefined) => {
  console.log(value)
}
</script>
```

:::

:::demo 设置 `step` 属性可以控制步长。

```vue
<template>
  <w-input-number v-model="num" :step="2" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const num = ref(5)
</script>
```

:::

:::demo `step-strictly`属性接受一个`Boolean`。 如果这个属性被设置为 `true`，则只能输入步进的倍数。

```vue
<template>
  <w-input-number v-model="num" :step="2" step-strictly />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const num = ref(2)
</script>
```

:::

:::demo 设置 `precision` 属性可以控制数值精度，接收一个 `Number`。

```vue
<template>
  <w-input-number v-model="num" :precision="2" :step="0.1" :max="10" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const num = ref(1)
</script>
```

:::

:::demo 使用 `decrease-icon` 和 `increase-icon` 设置自定义图标。

```vue
<template>
  <w-space direction="vertical">
    <w-space>
      <w-input-number v-model="num" />
      <w-input-number v-model="num">
        <template #decrease-icon>
          <w-icon>
            <ArrowDown />
          </w-icon>
        </template>
        <template #increase-icon>
          <w-icon>
            <ArrowUp />
          </w-icon>
        </template>
      </w-input-number>
    </w-space>
    <w-space>
      <w-input-number v-model="num" controls-position="right" />
      <w-input-number v-model="num" controls-position="right">
        <template #decrease-icon>
          <w-icon>
            <Minus />
          </w-icon>
        </template>
        <template #increase-icon>
          <w-icon>
            <Plus />
          </w-icon>
        </template>
      </w-input-number>
    </w-space>
  </w-space>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { ArrowDown, ArrowUp, Minus, Plus } from '@win-design-next/icons-vue'

const num = ref(1)
</script>
```

:::

:::demo 使用前缀和标名后缀。

```vue
<template>
  <w-space>
    <w-input-number v-model="num" :min="1" :max="10">
      <template #prefix>
        <span>￥</span>
      </template>
    </w-input-number>
    <w-input-number v-model="num" :min="1" :max="10">
      <template #suffix>
        <span>RMB</span>
      </template>
    </w-input-number>
  </w-space>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const num = ref(1)
</script>
```

:::

### API 文档

### Attributes

| 属性名                      | 说明                                | 类型                                                                | 默认值    |
| --------------------------- | ----------------------------------- | ------------------------------------------------------------------- | --------- |
| model-value / v-model       | 选中项绑定值                        | ^[number]                                                           | —         |
| min                         | 设置计数器允许的最小值              | ^[number]                                                           | -Infinity |
| max                         | 设置计数器允许的最大值              | ^[number]                                                           | Infinity  |
| step                        | 计数器步长                          | ^[number]                                                           | 1         |
| step-strictly               | 是否只能输入 step 的倍数            | ^[boolean]                                                          | false     |
| precision                   | 数值精度                            | ^[number]                                                           | —         |
| size                        | 计数器尺寸                          | ^[enum]`'large' \| 'default' \| 'mini' \| 'small'`                  | default   |
| readonly                    | 原生 `readonly` 属性，是否只读      | ^[boolean]                                                          | false     |
| disabled                    | 是否禁用状态                        | ^[boolean]                                                          | false     |
| controls                    | 是否使用控制按钮                    | ^[boolean]                                                          | true      |
| controls-position           | 控制按钮位置                        | ^[enum]`'' \| 'right'`                                              | —         |
| name                        | 等价于原生 input `name` 属性        | ^[string]                                                           | —         |
| aria-label ^(a11y)          | 等价于原生 input `aria-label` 属性  | ^[string]                                                           | —         |
| placeholder                 | 等价于原生 input `placeholder` 属性 | ^[string]                                                           | —         |
| id                          | 等价于原生 input `id` 属性          | ^[string]                                                           | —         |
| value-on-clear              | 当输入框被清空时显示的值            | ^[number] / ^[null] / ^[enum]`'min' \| 'max'`                       | —         |
| validate-event              | 是否触发表单验证                    | ^[boolean]                                                          | true      |
| label ^(a11y) ^(deprecated) | 等价于原生 input `aria-label` 属性  | ^[string]                                                           | —         |
| status                      | 输入框状态                          | ^[enum]`'success' \| 'warning' \| 'error' \| 'danger' \| 'default'` |           |
| tips                        | 输入框状态提示信息                  | ^[string]                                                           | —         |

### Slots

| 事件名        | 说明                     |
| ------------- | ------------------------ |
| decrease-icon | 自定义输入框按钮减少图标 |
| increase-icon | 自定义输入框按钮增加图标 |
| prefix        | 输入框头部内容           |
| suffix        | 输入框尾部内容           |

### Events

| 名称   | 说明                        | 类型                                                                                    |
| ------ | --------------------------- | --------------------------------------------------------------------------------------- |
| change | 绑定值被改变时触发          | ^[Function]`(currentValue: number \| undefined, oldValue: number \| undefined) => void` |
| blur   | 在组件 Input 失去焦点时触发 | ^[Function]`(event: FocusEvent) => void`                                                |
| focus  | 在组件 Input 获得焦点时触发 | ^[Function]`(event: FocusEvent) => void`                                                |

### Exposes

| 名称  | 详情                  | 类型                    |
| ----- | --------------------- | ----------------------- |
| focus | 使 input 组件获得焦点 | ^[Function]`() => void` |
| blur  | 使 input 组件失去焦点 | ^[Function]`() => void` |

---

## InputTag 标签输入框

InputTag 组件允许用户添加内容作为标签

### 示例

:::demo

```vue
<template>
  <w-input-tag
    v-model="input"
    placeholder="请输入"
    aria-label="Please click the Enter key after input"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const input = ref<string[]>()
</script>
```

:::

:::demo

```vue
<template>
  <div>
    <w-segmented v-model="trigger" :options="options" />
  </div>
  <br />
  <w-input-tag v-model="input" :trigger="trigger" placeholder="请输入" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { EVENT_CODE } from 'win-design-next'

const trigger = ref<'Enter' | 'Space'>('Space')
const input = ref<string[]>()
const options = [EVENT_CODE.enter, EVENT_CODE.space]
</script>
```

:::

:::demo

```vue
<template>
  <w-input-tag v-model="input" :max="3" placeholder="enter up to 3 tags" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const input = ref<string[]>()
</script>
```

:::

:::demo

```vue
<template>
  <w-input-tag v-model="input" disabled placeholder="请输入" class="mb-8" />

  <w-input-tag v-model="input1" disabled placeholder="请输入" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const input = ref<string[]>(['tag1', 'tag2', 'tag3'])

const input1 = ref<string[]>([])
</script>
```

:::

:::demo

```vue
<template>
  <w-input-tag v-model="input" clearable placeholder="请输入" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const input = ref<string[]>(['tag1', 'tag2', 'tag3'])
</script>
```

:::

:::demo

```vue
<template>
  <w-input-tag v-model="input" draggable placeholder="请输入" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const input = ref<string[]>(['tag1', 'tag2', 'tag3'])
</script>
```

:::

:::demo

```vue
<template>
  <w-input-tag v-model="input" size="large" placeholder="请输入" />
  <br />
  <w-input-tag v-model="input" placeholder="请输入" />
  <br />
  <w-input-tag v-model="input" size="small" placeholder="请输入" />
  <br />
  <w-input-tag v-model="input" size="mini" placeholder="请输入" />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const input = ref<string[]>()
</script>
```

:::

:::demo

```vue
<template>
  <div>
    <w-segmented v-model="tagType" :options="type" class="mr-5" />
    <w-segmented v-model="tagEffect" :options="effect" />
  </div>
  <br />
  <w-input-tag
    v-model="input"
    :tag-type="tagType"
    :tag-effect="tagEffect"
    placeholder="请输入"
  >
    <template #tag="{ value }">
      <div class="flex items-center">
        <w-icon class="mr-1">
          <Edit />
        </w-icon>
        <span>{{ value }}</span>
      </div>
    </template>
  </w-input-tag>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Edit } from '@win-design-next/icons-vue'
import type { TagProps } from 'win-design-next'

const type: Array<TagProps['type']> = [
  'primary',
  'success',
  'info',
  'warning',
  'danger',
  'error',
]
const effect: Array<TagProps['effect']> = ['light', 'dark', 'plain']

const tagType = ref<TagProps['type']>('primary')
const tagEffect = ref<TagProps['effect']>('plain')
const input = ref<string[]>(['tag1', 'tag2', 'tag3'])
</script>
```

:::

:::demo

```vue
<template>
  <w-input-tag v-model="input" clearable placeholder="请输入">
    <template #prefix>
      <w-icon><Search /></w-icon>
    </template>
    <template #suffix>
      <w-icon><Search /></w-icon>
    </template>
  </w-input-tag>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Search } from '@win-design-next/icons-vue'

const input = ref<string[]>()
</script>
```

:::

### API 文档

### 属性

| 名称                  | 详情                                        | 类型                                                                                | 默认    |
| --------------------- | ------------------------------------------- | ----------------------------------------------------------------------------------- | ------- |
| model-value / v-model | 绑定值                                      | ^[array]`string[]`                                                                  | —       |
| max                   | 可添加标签的最大数量                        | ^[number]                                                                           | —       |
| tag-type              | 标签类型                                    | ^[enum]`'' \| 'success' \| 'info' \| 'warning' \| 'danger' \| 'error' \| 'primary'` | primary |
| tag-effect            | 标签效果                                    | ^[enum]`'' \| 'light' \| 'dark' \| 'plain'`                                         | light   |
| trigger               | 触发输入标签的按键                          | ^[enum]`'Enter' \| 'Space'`                                                         | Enter   |
| draggable             | 是否可以拖动标签                            | ^[boolean]                                                                          | false   |
| size                  | 输入框尺寸                                  | ^[enum]`'large' \| 'default' \| 'small' \| 'mini'`                                  | default |
| clearable             | 是否显示清除按钮                            | ^[boolean]                                                                          | false   |
| disabled              | 是否禁用                                    | ^[boolean]                                                                          | false   |
| validate-event        | 是否触发表单验证                            | ^[boolean]                                                                          | true    |
| readonly              | 等价于原生 <code>readonly</code> 属性       | ^[boolean]                                                                          | false   |
| autofocus             | 等价于原生 <code> autofocus </code> 属性    | ^[boolean]                                                                          | false   |
| id                    | 等价于原生 input <code>id</code> 属性       | ^[string]                                                                           | —       |
| tabindex              | 等价于原生 <code> tabindex </code> 属性     | ^[string] / ^[number]                                                               | —       |
| maxlength             | 等价于原生 <code> maxlength </code> 属性    | ^[string] / ^[number]                                                               | —       |
| minlength             | 等价于原生 <code> minlength </code> 属性    | ^[string] / ^[number]                                                               | —       |
| placeholder           | 输入框占位文本                              | ^[string]                                                                           | —       |
| autocomplete          | 等价于原生 <code> autocomplete </code> 属性 | ^[string]                                                                           | off     |
| aria-label ^(a11y)    | 等价于原生 <code> aria-label </code> 属性   | ^[string]                                                                           | —       |

### 事件

| 名称       | 详情                    | 类型                                     |
| ---------- | ----------------------- | ---------------------------------------- |
| change     | 绑定值变化时触发的事件  | ^[Function]`(value: string[]) => void`   |
| input      | 在 Input 值改变时触发   | ^[Function]`(value: string) => void`     |
| add-tag    | tag 被添加时触发        | ^[Function]`(value: string) => void`     |
| remove-tag | tag 被移除时触发        | ^[Function]`(value: string) => void`     |
| focus      | 在 Input 获得焦点时触发 | ^[Function]`(event: FocusEvent) => void` |
| blur       | 在 Input 失去焦点时触发 | ^[Function]`(event: FocusEvent) => void` |
| clear      | 点击清除图标时触发      | ^[Function]`() => void`                  |

### Slots

| 名称   | 详情              | 类型                                        |
| ------ | ----------------- | ------------------------------------------- |
| tag    | 作为 tag 的内容   | ^[object]`{ value: string, index: number }` |
| prefix | InputTag 头部内容 | —                                           |
| suffix | InputTag 尾部内容 | —                                           |

### 对外暴露的方法

| 名称  | 详情              | 类型                    |
| ----- | ----------------- | ----------------------- |
| focus | 使 input 获取焦点 | ^[Function]`() => void` |
| blur  | 使 input 失去焦点 | ^[Function]`() => void` |

---

