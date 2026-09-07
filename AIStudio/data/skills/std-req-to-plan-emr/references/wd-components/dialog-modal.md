## <WBadge value="同 Modal">Dialog 弹出框</WBadge>

在保留当前页面状态的情况下，告知用户并承载相关操作。

### 示例

:::demo 需要设置 `model-value / v-model` 属性，它接收 `Boolean`，当为 `true` 时显示 Dialog。 Dialog 分为两个部分：`body` 和 `footer`，`footer` 需要具名为 `footer` 的 `slot`。 `title` 属性用于定义标题，它是可选的，默认值为空。 最后，本例还展示了 `before-close` 的用法。

```vue
<template>
  <w-button plain @click="dialogVisible1 = true"> 基础 Dialog </w-button>
  <w-button plain @click="dialogVisible2 = true"> 彩色 Dialog </w-button>
  <w-button plain @click="dialogVisible3 = true"> 无多余边距 Dialog </w-button>

  <w-dialog
    v-model="dialogVisible1"
    title="基础 Dialog"
    subtitle="这是一个副标题"
    width="500"
    :before-close="handleClose"
  >
    <span>Dialog 内容</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible1 = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible1 = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>

  <w-dialog
    v-model="dialogVisible2"
    title="彩色 Dialog"
    width="500"
    color
    :before-close="handleClose"
  >
    <span>Dialog 内容</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible2 = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible2 = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>

  <w-dialog
    v-model="dialogVisible3"
    title="无多余边距 Dialog"
    width="500"
    vertical-paddingless
    horizontal-paddingless
    :before-close="handleClose"
  >
    <div
      style="
        background-color: #e9e9e9;
        height: 150px;
        border-radius: 0 0 4px 4px;
      "
    >
      Modal 内容
    </div>
  </w-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { WMessageBox } from 'win-design-next'

const dialogVisible1 = ref(false)
const dialogVisible2 = ref(false)
const dialogVisible3 = ref(false)

const handleClose = (done: () => void) => {
  WMessageBox.confirm('确认关闭 Dialog?')
    .then(() => {
      done()
    })
    .catch(() => {
      // catch error
    })
}
</script>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="dialogVisible1 = true"> 基础 Modal </w-button>
  <w-button plain @click="dialogVisible2 = true"> 第一个 Modal </w-button>
  <w-button plain @click="dialogVisible3 = true"> 第二个 Modal </w-button>
  <w-dialog
    v-model="dialogVisible1"
    title="基础 Dialog"
    subtitle="这是一个副标题"
    width="500"
    :modal="false"
    :close-on-click-modal="false"
    click-modal-other
  >
    <span>Dialog 内容</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible1 = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible1 = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>

  <w-dialog
    v-model="dialogVisible2"
    title="第一个 Dialog"
    width="500"
    :modal="false"
    :close-on-click-modal="false"
    click-modal-other
    draggable
    overflow
    click-to-front
  >
    <span>Dialog 内容</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible2 = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible2 = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>

  <w-dialog
    v-model="dialogVisible3"
    title="第二个 Dialog"
    width="500"
    :modal="false"
    :close-on-click-modal="false"
    click-modal-other
    draggable
    overflow
    click-to-front
  >
    <span>Dialog 内容</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible3 = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible3 = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const dialogVisible1 = ref(false)
const dialogVisible2 = ref(false)
const dialogVisible3 = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="dialogVisible = true"> 打开 可缩放 Modal </w-button>

  <w-dialog
    v-model="dialogVisible"
    title="标题"
    width="500"
    resize
    :max-height="700"
    :resize-min-width="300"
    :resize-min-height="200"
    @before-resize-change="handleBeforeResizeChange"
    @after-resize-change="hanldeAfterResizeChange"
  >
    <div>
      WinDesign
      是一套专为医疗行业打造的标准化解决方案，遵循协同、便捷、高效的设计理念。技术上基于
      Vue.js，由卫宁UED团队开发维护，拥有 80+
      组件，与医疗业务深度绑定，支持国际化项目、动态换肤和响应式设计，具备良好的文档和社区支持等，适用于快速构建医疗行业中后台系统或复杂的前端应用。
    </div>
    <div>
      WinDesign
      整合了全面的设计规范，为产品设计、开发到测试的全流程提供专业指导。
      内容涵盖 WiNEX Copilot 规范、多语言设计规范、产品开发执行规范
      ，以及移动端和自助机等多场景的设计标准。点击相应模块，即可查阅详情。
    </div>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const dialogVisible = ref(false)

const handleBeforeResizeChange = (val) => {
  console.log(val)
}

const hanldeAfterResizeChange = (val) => {
  console.log(val)
}
</script>
```

:::

:::demo 设置`draggable`属性为`true`以做到拖拽 设置 `overflow` 为 `true` 可以让拖拽范围超出可视区。

```vue
<template>
  <w-button plain @click="dialogVisible = true"> 打开拖拽对话框 </w-button>

  <w-button plain @click="dialogOverflowVisible = true">
    打开拖拽对话框（拖拽到屏幕外）
  </w-button>

  <w-dialog v-model="dialogVisible" title="Dialog 标题" width="500" draggable>
    <span>这是一个拖拽对话框</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>

  <w-dialog
    v-model="dialogOverflowVisible"
    title="Dialog 标题"
    width="500"
    draggable
    overflow
    class="custom-dragging-style"
  >
    <span
      >这是一个拖拽对话框，设置 overflow 为 true
      可以让拖拽范围超出可视区。</span
    >
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogOverflowVisible = false">取消</w-button>
        <w-button type="primary" @click="dialogOverflowVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const dialogVisible = ref(false)
const dialogOverflowVisible = ref(false)
</script>

<style scoped>
:global(.custom-dragging-style.is-dragging) {
  border: 2px dashed var(--w3-color-primary);
  opacity: 0.8;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="dialogVisible = true"> 打开对话框 </w-button>

  <w-dialog
    v-model="dialogVisible"
    title="标题"
    fullscreen
    top="40vh"
    width="70%"
    draggable
  >
    <span>这是一个全屏对话框</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const dialogVisible = ref(false)
</script>
```

:::

:::demo 示例包括缩放（scale）、滑动（slide）、淡入淡出（fade）、弹跳（bounce）动画，以及带有自定义事件处理器的基于对象的配置。

```vue
<template>
  <w-button plain @click="openDialog('fade')"> Default </w-button>
  <w-button plain @click="openDialog('scale')"> Scale </w-button>
  <w-button plain @click="openDialog('slide')"> Slide </w-button>
  <w-button plain @click="openDialog('bounce')"> Bounce </w-button>
  <w-button plain @click="openDialogWithObject"> Object Config </w-button>

  <w-dialog
    v-model="dialogVisible"
    :title="`${currentAnimation} 动画`"
    width="50%"
    :transition="transitionConfig"
    class="custom-transition-dialog"
  >
    <span>Dialog 内容</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

import type { DialogTransition } from 'win-design-next'

const dialogVisible = ref(false)
const currentAnimation = ref('fade')
const isObjectConfig = ref(false)

const transitionConfig = computed<DialogTransition>(() => {
  if (isObjectConfig.value) {
    return {
      name: 'dialog-custom-object',
      appear: true,
      mode: 'out-in',
      duration: 500,
    }
  }
  return `dialog-${currentAnimation.value}`
})

const openDialog = (type: string) => {
  currentAnimation.value = type
  isObjectConfig.value = false
  dialogVisible.value = true
}

const openDialogWithObject = () => {
  currentAnimation.value = 'object-config'
  isObjectConfig.value = true
  dialogVisible.value = true
}
</script>

<style>
/* Scale Animation */
.dialog-scale-enter-active,
.dialog-scale-leave-active,
.dialog-scale-enter-active .w3-dialog,
.dialog-scale-leave-active .w3-dialog {
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.dialog-scale-enter-from,
.dialog-scale-leave-to {
  opacity: 0;
}

.dialog-scale-enter-from .w3-dialog,
.dialog-scale-leave-to .w3-dialog {
  transform: scale(0.5);
  opacity: 0;
}

/* Slide Animation */
.dialog-slide-enter-active,
.dialog-slide-leave-active,
.dialog-slide-enter-active .w3-dialog,
.dialog-slide-leave-active .w3-dialog {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.dialog-slide-enter-from,
.dialog-slide-leave-to {
  opacity: 0;
}

.dialog-slide-enter-from .w3-dialog,
.dialog-slide-leave-to .w3-dialog {
  transform: translateY(-100px);
  opacity: 0;
}

/* Bounce Animation */
.dialog-bounce-enter-active,
.dialog-bounce-leave-active,
.dialog-bounce-enter-active .w3-dialog,
.dialog-bounce-leave-active .w3-dialog {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.dialog-bounce-enter-from,
.dialog-bounce-leave-to {
  opacity: 0;
}

.dialog-bounce-enter-from .w3-dialog,
.dialog-bounce-leave-to .w3-dialog {
  transform: scale(0.3) translateY(-50px);
  opacity: 0;
}

/* Object Configuration Animation */
.dialog-custom-object-enter-active,
.dialog-custom-object-leave-active,
.dialog-custom-object-enter-active .w3-dialog,
.dialog-custom-object-leave-active .w3-dialog {
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.dialog-custom-object-enter-from,
.dialog-custom-object-leave-to {
  opacity: 0;
}

.dialog-custom-object-enter-from .w3-dialog,
.dialog-custom-object-leave-to .w3-dialog {
  transform: rotate(180deg) scale(0.5);
  opacity: 0;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="visible = true">
    打开 Dialog with customized header
  </w-button>

  <w-dialog v-model="visible" title="标题" :show-close="false" width="500">
    <template #header="{ close, titleId, titleClass }">
      <div class="my-header">
        <h4 :id="titleId" :class="titleClass">自定义头部</h4>
        <w-button type="danger" @click="close">
          <w-icon class="w3-icon--left"><CircleCloseFilled /></w-icon>
          关闭
        </w-button>
      </div>
    </template>
    内容区域...
  </w-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { WButton, WDialog } from 'win-design-next'
import { CircleCloseFilled } from '@win-design-next/icons-vue'

const visible = ref(false)
</script>

<style scoped>
.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 16px;
}
</style>
```

:::

:::demo 通常我们不建议使用嵌套对话框。 如果你需要在页面上呈现多个对话框，你可以简单地打平它们，以便它们彼此之间是平级关系。 如果必须要在一个对话框内展示另一个对话框，可以将内部嵌套的对话框属性 `append-to-body` 设置为 true，嵌套的对话框将附加到 body 而不是其父节点，这样两个对话框都可以被正确地渲染。

```vue
<template>
  <w-button plain @click="outerVisible = true"> 打开嵌套对话框 </w-button>

  <w-dialog v-model="outerVisible" title="Outer Dialog" width="800">
    <span>这是一个嵌套对话框</span>
    <w-dialog
      v-model="innerVisible"
      width="500"
      title="第二个对话框"
      append-to-body
    >
      <span>内容区域</span>
    </w-dialog>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="outerVisible = false">取消</w-button>
        <w-button type="primary" @click="innerVisible = true">
          打开第二个对话框
        </w-button>
      </div>
    </template>
  </w-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const outerVisible = ref(false)
const innerVisible = ref(false)
</script>
```

:::

:::demo 设置 `align-center` 为 `true` 使对话框水平垂直居中。 由于对话框垂直居中在弹性盒子中，所以`top`属性将不起作用。

```vue
<template>
  <w-button plain @click="centerDialogVisible = true">
    点击打开Dialog
  </w-button>

  <w-dialog v-model="centerDialogVisible" title="标题" width="500" align-center>
    <span>设置 align-center 为 true 使对话框水平垂直居中</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="centerDialogVisible = false">取消</w-button>
        <w-button type="primary" @click="centerDialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const centerDialogVisible = ref(false)
</script>
```

:::

:::demo 需要注意的是，当这个属性被启用时，在 `transition.beforeEnter` 事件卸载前，除了 `overlay`、`header (可选)`与`footer(可选)` ，Dialog 内不会有其它任何其它的 DOM 节点存在。

```vue
<template>
  <w-button plain @click="centerDialogVisible = true"> 打开对话框 </w-button>

  <w-dialog
    v-model="centerDialogVisible"
    title="标题"
    width="500"
    destroy-on-close
    center
  >
    <span>
      启用此功能时，默认栏位下的内容将使用 v-if 指令销毁。
      当出现性能问题时，可以启用此功能。 需要注意的是，当这个属性被启用时，在
      transition.beforeEnter 事件卸载前，除了 overlay、header
      (可选)与footer(可选)，Dialog 内不会有其它任何其它的 DOM 节点存在。
    </span>

    <template #footer>
      <div class="dialog-footer">
        <w-button @click="centerDialogVisible = false">取消</w-button>
        <w-button type="primary" @click="centerDialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const centerDialogVisible = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="dialogVisible = true">
    打开 the modal Dialog
  </w-button>

  <w-dialog v-model="dialogVisible" :modal="false" title="标题">
    <span>这是一个 modal Dialog</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const dialogVisible = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="dialogVisible = true"> 打开 event Dialog </w-button>

  <w-dialog
    v-model="dialogVisible"
    title="标题"
    modal-class="overide-animation"
    :before-close="
      (doneFn) => {
        console.log('before-close'), doneFn()
      }
    "
    @open="console.log('open')"
    @open-auto-focus="console.log('open-auto-focus')"
    @opened="console.log('opened')"
    @close="console.log('close')"
    @close-auto-focus="console.log('close-auto-focus')"
    @closed="console.log('closed')"
  >
    <span>这是一个 event Dialog</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const dialogVisible = ref(false)
</script>
```

:::

:::demo 将`center`设置为`true`即可使标题和底部居中。 `center`仅影响标题和底部区域。 Dialog 的内容是任意的，在一些情况下，内容并不适合居中布局。 如果需要内容也水平居中，请自行为其添加 CSS 样式。

```vue
<template>
  <w-button plain @click="centerDialogVisible = true">
    点击打开Dialog
  </w-button>

  <w-dialog v-model="centerDialogVisible" title="标题" width="500" center>
    <span> 应该注意的是，默认情况下，内容不会在中心对齐 </span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="centerDialogVisible = false">取消</w-button>
        <w-button type="primary" @click="centerDialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-dialog>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const centerDialogVisible = ref(false)
</script>
```

:::

### API 文档

### Attributes

| 属性名                          | 说明                                                                                            | 类型                                | 默认  |
| ------------------------------- | ----------------------------------------------------------------------------------------------- | ----------------------------------- | ----- |
| model-value / v-model           | 是否显示 Dialog                                                                                 | ^[boolean]                          | —     |
| title                           | Dialog 对话框 Dialog 的标题， 也可通过具名 slot （见下表）传入                                  | ^[string]                           | ''    |
| width                           | 对话框的宽度，默认值为 50%                                                                      | ^[string] / ^[number]               | ''    |
| fullscreen                      | 是否为全屏 Dialog                                                                               | ^[boolean]                          | false |
| top                             | dialog CSS 中的 margin-top 值，默认为 15vh                                                      | ^[string]                           | ''    |
| modal                           | 是否需要遮罩层                                                                                  | ^[boolean]                          | true  |
| modal-class                     | 遮罩的自定义类名                                                                                | ^[string]                           | —     |
| header-class                    | header 部分的自定义 class 名                                                                    | ^[string]                           | —     |
| body-class                      | body 部分的自定义 class 名                                                                      | ^[string]                           | —     |
| footer-class                    | footer 部分的自定义 class 名                                                                    | ^[string]                           | —     |
| append-to-body                  | Dialog 自身是否插入至 body 元素上。 嵌套的 Dialog 必须指定该属性并赋值为 `true`                 | ^[boolean]                          | false |
| append-to                       | Dialog 挂载到哪个 DOM 元素 将覆盖 `append-to-body`                                              | ^[string] / ^[HTMLElement]          | body  |
| lock-scroll                     | 是否在 Dialog 出现时将 body 滚动锁定                                                            | ^[boolean]                          | true  |
| open-delay                      | dialog 打开的延时时间，单位毫秒                                                                 | ^[number]                           | 0     |
| close-delay                     | dialog 关闭的延时时间，单位毫秒                                                                 | ^[number]                           | 0     |
| close-on-click-modal            | 是否可以通过点击 modal 关闭 Dialog                                                              | ^[boolean]                          | true  |
| close-on-press-escape           | 是否可以通过按下 ESC 关闭 Dialog                                                                | ^[boolean]                          | true  |
| show-close                      | 是否显示关闭按钮                                                                                | ^[boolean]                          | true  |
| before-close                    | 关闭前的回调，会暂停 Dialog 的关闭. 回调函数内执行 done 参数方法的时候才是真正关闭对话框的时候. | ^[Function]`(done: DoneFn) => void` | —     |
| draggable                       | 为 Dialog 启用可拖拽功能                                                                        | ^[boolean]                          | false |
| overflow                        | 拖动范围可以超出可视区                                                                          | ^[boolean]                          | false |
| center                          | 是否让 Dialog 的 header 和 footer 部分居中排列                                                  | ^[boolean]                          | false |
| align-center                    | 是否水平垂直对齐对话框                                                                          | ^[boolean]                          | false |
| destroy-on-close                | 当关闭 Dialog 时，销毁其中的元素                                                                | ^[boolean]                          | false |
| close-icon                      | 自定义关闭图标，默认 Close                                                                      | ^[string] / ^[Component]            | —     |
| z-index                         | 和原生的 CSS 的 z-index 相同，改变 z 轴的顺序                                                   | ^[number]                           | —     |
| header-aria-level ^(a11y)       | header 的 `aria-level` 属性                                                                     | ^[string]                           | 2     |
| custom-class ^(deprecated)      | Dialog 的自定义类名                                                                             | ^[string]                           | ''    |
| subtitle ^(1.0.0)               | 对话框的副标题                                                                                  | ^[string]                           | ''    |
| color ^(1.0.0)                  | 是否为彩色对话框                                                                                | ^[boolean]                          | false |
| transition ^(1.0.0)             | 自定义动画类名                                                                                  | ^[string]                           | —     |
| click-modal-other ^(1.0.0)      | 关闭遮罩时是否可以操作其它功能区域                                                              | ^[boolean]                          | false |
| click-to-front ^(1.0.0)         | 多个 Modal 并存时点击置顶显示                                                                   | ^[boolean]                          | false |
| resize ^(1.0.0)                 | 是否允许拖拽改变大小                                                                            | ^[boolean]                          | false |
| resize-min-width ^(1.0.0)       | 拖拽改变大小时的最小宽度                                                                        | ^[number]                           | 300   |
| resize-min-height ^(1.0.0)      | 拖拽改变大小时的最小高度                                                                        | ^[number]                           | 150   |
| height ^(1.0.0)                 | 对话框的高度                                                                                    | ^[number]                           |       |
| max-height ^(1.0.0)             | 对话框的最大高度                                                                                | ^[number]                           |       |
| horizontal-paddingless ^(1.0.4) | 是否移除对话框的左右边距                                                                        | ^[boolean]                          | false |
| vertical-paddingless ^(1.0.4)   | 是否移除对话框的上下边距                                                                        | ^[boolean]                          | false |

### Slots

| 插槽名              | 说明                                                   |
| ------------------- | ------------------------------------------------------ |
| default             | 对话框的默认内容                                       |
| header              | 对话框标题的内容；会替换标题部分，但不会移除关闭按钮。 |
| footer              | Dialog 按钮操作区的内容                                |
| title ^(deprecated) | 与 header 作用相同 请使用 header                       |

### 事件

| 名称                          | 详情                               | Type                    |
| ----------------------------- | ---------------------------------- | ----------------------- |
| open                          | Dialog 打开的回调                  | ^[Function]`() => void` |
| opened                        | Dialog 打开动画结束时的回调        | ^[Function]`() => void` |
| close                         | Dialog 关闭的回调                  | ^[Function]`() => void` |
| closed                        | Dialog 关闭动画结束时的回调        | ^[Function]`() => void` |
| open-auto-focus               | 输入焦点聚焦在 Dialog 内容时的回调 | ^[Function]`() => void` |
| close-auto-focus              | 输入焦点从 Dialog 内容失焦时的回调 | ^[Function]`() => void` |
| before-resize-change ^(1.0.0) | 拖拽改变大小时的回调               | ^[Function]`() => void` |
| after-resize-change ^(1.0.0)  | 拖拽改变大小结束时的回调           | ^[Function]`() => void` |

### Exposes

| 名称          | 详情     | 类型                    |
| ------------- | -------- | ----------------------- |
| resetPosition | 重置位置 | ^[Function]`() => void` |

---

## Drawer 抽屉

有些时候, `Dialog` 组件并不满足我们的需求, 比如你的表单很长, 亦或是你需要临时展示一些文档, `Drawer` 拥有和 `Dialog` 几乎相同的 API, 在 UI 上带来不一样的体验.

### 示例

:::demo 你必须像 `Dialog`一样为 `Drawer` 设置 `model-value` 属性来控制 `Drawer` 的显示与隐藏状态，该属性接受一个 `boolean` 类型。 `Drawer` 包含三部分: `title` & `body` & `footer`, 其中 `title` 是一个具名 slot, 你还可以通过 `title` 属性来设置标题, 默认情况下它是一个空字符串, 其中 `body` 部分是 `Drawer` 组件的主区域, 它包含了用户定义的主要内容. footer 和 title 用法一致, 用来显示页脚信息. 当 `Drawer` 打开时，默认设置是**从右至左**打开 **30%** 浏览器宽度。 你可以通过传入对应的 `direction` 和 `size` 属性来修改这一默认行为。 下面一个示例将展示如何使用 `before-close` API，更多详细用法请参考页面底部的 API 部分。

```vue
<template>
  <w-radio-group v-model="direction">
    <w-radio value="ltr">left to right</w-radio>
    <w-radio value="rtl">right to left</w-radio>
    <w-radio value="ttb">top to bottom</w-radio>
    <w-radio value="btt">bottom to top</w-radio>
  </w-radio-group>

  <w-button type="primary" style="margin-left: 16px" @click="drawer = true">
    打开
  </w-button>
  <w-button type="primary" style="margin-left: 16px" @click="drawer2 = true">
    带 footer
  </w-button>

  <w-drawer
    v-model="drawer"
    title="标题"
    :direction="direction"
    :before-close="handleClose"
  >
    <span>内容</span>
  </w-drawer>
  <w-drawer v-model="drawer2" :direction="direction">
    <template #header>
      <h4>set title by slot</h4>
    </template>
    <template #default>
      <div>
        <w-radio v-model="radio1" value="Option 1" size="large">
          Option 1
        </w-radio>
        <w-radio v-model="radio1" value="Option 2" size="large">
          Option 2
        </w-radio>
      </div>
    </template>
    <template #footer>
      <div style="flex: auto">
        <w-button @click="cancelClick">cancel</w-button>
        <w-button type="primary" @click="confirmClick">confirm</w-button>
      </div>
    </template>
  </w-drawer>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { WMessageBox } from 'win-design-next'
import type { DrawerProps } from 'win-design-next'

const drawer = ref(false)
const drawer2 = ref(false)
const direction = ref<DrawerProps['direction']>('rtl')
const radio1 = ref('Option 1')
const handleClose = (done: () => void) => {
  WMessageBox.confirm('Are you sure you want to close this?')
    .then(() => {
      done()
    })
    .catch(() => {
      // catch error
    })
}
function cancelClick() {
  drawer2.value = false
}
function confirmClick() {
  WMessageBox.confirm(`Are you confirm to chose ${radio1.value} ?`)
    .then(() => {
      drawer2.value = false
    })
    .catch(() => {
      // catch error
    })
}
</script>
```

:::

:::demo 通过设置 `with-header` 属性为 **false** 来控制是否显示标题。 如果你的应用需要具备可访问性，请务必设置好 `title`。

```vue
<template>
  <w-button type="primary" style="margin-left: 16px" @click="drawer = true">
    open
  </w-button>

  <w-drawer v-model="drawer" title="标题" :with-header="false">
    <span>Hi there!</span>
  </w-drawer>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const drawer = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-button text @click="table = true">Open Drawer with nested table</w-button>
  <w-button text @click="dialog = true">Open Drawer with nested form</w-button>
  <w-drawer
    v-model="table"
    title="I have a nested table inside!"
    direction="rtl"
    size="50%"
  >
    <w-table :data="gridData">
      <w-table-column property="date" label="Date" width="150" />
      <w-table-column property="name" label="Name" width="200" />
      <w-table-column property="address" label="Address" />
    </w-table>
  </w-drawer>

  <w-drawer
    v-model="dialog"
    title="I have a nested form inside!"
    :before-close="handleClose"
    direction="ltr"
    class="demo-drawer"
  >
    <div class="demo-drawer__content">
      <w-form :model="form">
        <w-form-item label="Name" :label-width="formLabelWidth">
          <w-input v-model="form.name" autocomplete="off" />
        </w-form-item>
        <w-form-item label="Area" :label-width="formLabelWidth">
          <w-select
            v-model="form.region"
            placeholder="Please select activity area"
          >
            <w-option label="Area1" value="shanghai" />
            <w-option label="Area2" value="beijing" />
          </w-select>
        </w-form-item>
        <w-form-item content-position="right">
          <w-button @click="cancelForm">取消</w-button>
          <w-button type="primary" :loading="loading" @click="onClick">
            {{ loading ? '提交中 ...' : '提交' }}
          </w-button>
        </w-form-item>
      </w-form>
    </div>
  </w-drawer>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import { WDrawer, WMessageBox } from 'win-design-next'

const formLabelWidth = '80px'
let timer

const table = ref(false)
const dialog = ref(false)
const loading = ref(false)

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

const gridData = [
  {
    date: '2016-05-02',
    name: 'Peter Parker',
    address: 'Queens, New York City',
  },
  {
    date: '2016-05-04',
    name: 'Peter Parker',
    address: 'Queens, New York City',
  },
  {
    date: '2016-05-01',
    name: 'Peter Parker',
    address: 'Queens, New York City',
  },
  {
    date: '2016-05-03',
    name: 'Peter Parker',
    address: 'Queens, New York City',
  },
]

const onClick = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
    dialog.value = false
  }, 400)
}

const handleClose = (done) => {
  if (loading.value) {
    return
  }
  WMessageBox.confirm('Do you want to submit?')
    .then(() => {
      loading.value = true
      timer = setTimeout(() => {
        done()
        // 动画关闭需要一定的时间
        setTimeout(() => {
          loading.value = false
        }, 400)
      }, 2000)
    })
    .catch(() => {
      // catch error
    })
}

const cancelForm = () => {
  loading.value = false
  dialog.value = false
  clearTimeout(timer)
}
</script>
```

:::

:::demo

```vue
<template>
  <w-button @click="visible = true">
    Open Drawer with customized header
  </w-button>
  <w-drawer v-model="visible" :show-close="false">
    <template #header="{ close, titleId, titleClass }">
      <h4 :id="titleId" :class="titleClass">This is a custom header!</h4>
      <w-button type="danger" @click="close">
        <w-icon class="w3-icon--left"><CircleCloseFilled /></w-icon>
        Close
      </w-button>
    </template>
    This is drawer content.
  </w-drawer>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { WButton, WDrawer } from 'win-design-next'
import { CircleCloseFilled } from '@win-design-next/icons-vue'

const visible = ref(false)
</script>
```

:::

:::demo 如果你需要在不同图层中多个抽屉，你必须设置 `append-to-body` 属性到 **true**

```vue
<template>
  <w-button type="primary" style="margin-left: 16px" @click="drawer = true">
    open
  </w-button>

  <w-drawer v-model="drawer" title="I'm outer Drawer" size="50%">
    <div>
      <w-button @click="innerDrawer = true">点击!</w-button>
      <w-drawer
        v-model="innerDrawer"
        title="I'm inner Drawer"
        :append-to-body="true"
        :before-close="handleClose"
      >
        <p>_(:зゝ∠)_</p>
      </w-drawer>
    </div>
  </w-drawer>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { WMessageBox } from 'win-design-next'

const drawer = ref(false)
const innerDrawer = ref(false)

const handleClose = (done: () => void) => {
  WMessageBox.confirm('You still have unsaved data, proceed?')
    .then(() => {
      done()
    })
    .catch(() => {
      // catch error
    })
}
</script>
```

:::

### API 文档

### 属性

| 属性名                     | 说明                                                                                                                       | 类型                                                                                                                                                     | 默认值 |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------- | ------ |
| model-value / v-model      | 是否显示 Drawer                                                                                                            | ^[boolean]                                                                                                                                               | false  |
| append-to-body             | Drawer 自身是否插入至 body 元素上。嵌套的 Drawer 必须指定该属性并赋值为 **true**                                           | ^[boolean]                                                                                                                                               | false  |
| append-to                  | 挂载到哪个 DOM 元素 将覆盖 `append-to-body`                                                                                | ^[string]                                                                                                                                                | body   |
| lock-scroll                | 是否在 Drawer 出现时将 body 滚动锁定                                                                                       | ^[boolean]                                                                                                                                               | true   |
| before-close               | 关闭前的回调，会暂停 Drawer 的关闭                                                                                         | ^[Function]`(done: (cancel?: boolean) => void) => void(done 是个 function type 接受一个 boolean 参数, 执行 done 使用 true 参数或不提供参数将会终止关闭)` | —      |
| close-on-click-modal       | 是否可以通过点击 modal 关闭 Drawer                                                                                         | ^[boolean]                                                                                                                                               | true   |
| close-on-press-escape      | 是否可以通过按下 ESC 关闭 Drawer                                                                                           | ^[boolean]                                                                                                                                               | true   |
| open-delay                 | Drawer 打开的延时时间，单位毫秒                                                                                            | ^[number]                                                                                                                                                | 0      |
| close-delay                | Drawer 关闭的延时时间，单位毫秒                                                                                            | ^[number]                                                                                                                                                | 0      |
| destroy-on-close           | 控制是否在关闭 Drawer 之后将子元素全部销毁                                                                                 | ^[boolean]                                                                                                                                               | false  |
| modal                      | 是否需要遮罩层                                                                                                             | ^[boolean]                                                                                                                                               | true   |
| direction                  | Drawer 打开的方向                                                                                                          | ^[enum]`'rtl' \| 'ltr' \| 'ttb' \| 'btt'`                                                                                                                | rtl    |
| show-close                 | 是否显示关闭按钮                                                                                                           | ^[boolean]                                                                                                                                               | true   |
| size                       | Drawer 窗体的大小, 当使用 `number` 类型时, 以像素为单位, 当使用 `string` 类型时, 请传入 'x%', 否则便会以 `number` 类型解释 | ^[number] / ^[string]                                                                                                                                    | 30%    |
| title                      | Drawer 的标题，也可通过具名 slot （见下表）传入                                                                            | ^[string]                                                                                                                                                | —      |
| with-header                | 控制是否显示 header 栏, 默认为 true, 当此项为 false 时, title attribute 和 title slot 均不生效                             | ^[boolean]                                                                                                                                               | true   |
| modal-class                | 遮罩层的自定义类名                                                                                                         | ^[string]                                                                                                                                                | —      |
| header-class               | header 部分的自定义 class 名                                                                                               | ^[string]                                                                                                                                                | —      |
| body-class                 | body 部分的自定义 class 名                                                                                                 | ^[string]                                                                                                                                                | —      |
| footer-class               | footer 部分的自定义 class 名                                                                                               | ^[string]                                                                                                                                                | —      |
| z-index                    | 设置 z-index                                                                                                               | ^[number]                                                                                                                                                | —      |
| header-aria-level ^(a11y)  | header 的 `aria-level` 属性                                                                                                | ^[string]                                                                                                                                                | 2      |
| custom-class ^(deprecated) | Drawer 的自定义类名                                                                                                        | ^[string]                                                                                                                                                | —      |

:::warning

`custom-class` 已被 **弃用**，**将会于** 移除, 请使用 `class`。

:::

### 事件

| 事件名称         | 说明                               | 类型                    |
| ---------------- | ---------------------------------- | ----------------------- |
| open             | Drawer 打开的回调                  | ^[Function]`() => void` |
| opened           | Drawer 打开动画结束时的回调        | ^[Function]`() => void` |
| close            | Drawer 关闭的回调                  | ^[Function]`() => void` |
| closed           | Drawer 关闭动画结束时的回调        | ^[Function]`() => void` |
| open-auto-focus  | 输入焦点聚焦在 Drawer 内容时的回调 | ^[Function]`() => void` |
| close-auto-focus | 输入焦点从 Drawer 内容失焦时的回调 | ^[Function]`() => void` |

### 插槽

| 名称                | 说明                                                    |
| ------------------- | ------------------------------------------------------- |
| default             | Drawer 的内容                                           |
| header              | Drawer 标题的内容；会替换标题部分，但不会移除关闭按钮。 |
| footer              | Drawer 页脚部分                                         |
| title ^(deprecated) | 与 header 作用相同 请使用 header                        |

### 暴露

| 名称        | 详情                                                    |
| ----------- | ------------------------------------------------------- |
| handleClose | 用于关闭 Drawer, 该方法会调用传入的 `before-close` 方法 |

---

## <WBadge value="同 Dialog">Modal 弹出框</WBadge>

在保留当前页面状态的情况下，告知用户并承载相关操作。

### 示例

:::demo 需要设置 `model-value / v-model` 属性，它接收 `Boolean`，当为 `true` 时显示 Modal。 Modal 分为两个部分：`body` 和 `footer`，`footer` 需要具名为 `footer` 的 `slot`。 `title` 属性用于定义标题，它是可选的，默认值为空。 最后，本例还展示了 `before-close` 的用法。

```vue
<template>
  <w-button plain @click="dialogVisible1 = true"> 基础 Modal </w-button>
  <w-button plain @click="dialogVisible2 = true"> 彩色 Modal </w-button>
  <w-button plain @click="dialogVisible3 = true"> 无多余边距 Modal </w-button>

  <w-modal
    v-model="dialogVisible1"
    title="基础 Modal"
    subtitle="这是一个副标题"
    width="500"
    :before-close="handleClose"
  >
    <span>Modal 内容</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible1 = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible1 = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>

  <w-modal
    v-model="dialogVisible2"
    title="彩色 Modal"
    width="500"
    color
    :before-close="handleClose"
  >
    <span>Modal 内容</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible2 = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible2 = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>

  <w-modal
    v-model="dialogVisible3"
    title="无多余边距 Modal"
    width="500"
    vertical-paddingless
    horizontal-paddingless
    :before-close="handleClose"
  >
    <div
      style="
        background-color: #e9e9e9;
        height: 150px;
        border-radius: 0 0 4px 4px;
      "
    >
      Modal 内容
    </div>
  </w-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { WMessageBox } from 'win-design-next'

const dialogVisible1 = ref(false)
const dialogVisible2 = ref(false)
const dialogVisible3 = ref(false)

const handleClose = (done: () => void) => {
  WMessageBox.confirm('确认关闭 Modal?')
    .then(() => {
      done()
    })
    .catch(() => {
      // catch error
    })
}
</script>
```

:::

:::demo 设置`draggable`属性为`true`以做到拖拽 设置 `overflow` 为 `true` 可以让拖拽范围超出可视区。

```vue
<template>
  <w-button plain @click="dialogVisible = true"> 打开拖拽对话框 </w-button>

  <w-button plain @click="dialogOverflowVisible = true">
    打开拖拽对话框（拖拽到屏幕外）
  </w-button>

  <w-modal v-model="dialogVisible" title="Dialog 标题" width="500" draggable>
    <span>这是一个拖拽对话框</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>

  <w-modal
    v-model="dialogOverflowVisible"
    title="Dialog 标题"
    width="500"
    draggable
    overflow
    class="custom-dragging-style"
  >
    <span
      >这是一个拖拽对话框，设置 overflow 为 true
      可以让拖拽范围超出可视区。</span
    >
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogOverflowVisible = false">取消</w-button>
        <w-button type="primary" @click="dialogOverflowVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const dialogVisible = ref(false)
const dialogOverflowVisible = ref(false)
</script>

<style scoped>
:global(.custom-dragging-style.is-dragging) {
  border: 2px dashed var(--w3-color-primary);
  opacity: 0.8;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="dialogVisible = true"> 打开 可缩放 Modal </w-button>

  <w-modal
    v-model="dialogVisible"
    width="500"
    title="标题"
    :max-height="700"
    resize
    :resize-min-width="300"
    :resize-min-height="200"
    @before-resize-change="handleBeforeResizeChange"
    @after-resize-change="hanldeAfterResizeChange"
  >
    <div>
      WinDesign
      是一套专为医疗行业打造的标准化解决方案，遵循协同、便捷、高效的设计理念。技术上基于
      Vue.js，由卫宁UED团队开发维护，拥有 80+
      组件，与医疗业务深度绑定，支持国际化项目、动态换肤和响应式设计，具备良好的文档和社区支持等，适用于快速构建医疗行业中后台系统或复杂的前端应用。
    </div>
    <div>
      WinDesign
      整合了全面的设计规范，为产品设计、开发到测试的全流程提供专业指导。
      内容涵盖 WiNEX Copilot 规范、多语言设计规范、产品开发执行规范
      ，以及移动端和自助机等多场景的设计标准。点击相应模块，即可查阅详情。
    </div>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const dialogVisible = ref(false)

const handleBeforeResizeChange = (val) => {
  console.log(val)
}

const hanldeAfterResizeChange = (val) => {
  console.log(val)
}
</script>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="dialogVisible1 = true"> 基础 Modal </w-button>
  <w-button plain @click="dialogVisible2 = true"> 第一个 Modal </w-button>
  <w-button plain @click="dialogVisible3 = true"> 第二个 Modal </w-button>
  <w-modal
    v-model="dialogVisible1"
    title="基础 Dialog"
    subtitle="这是一个副标题"
    width="500"
    :modal="false"
    :close-on-click-modal="false"
    click-modal-other
  >
    <span>Modal 内容</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible1 = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible1 = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>

  <w-modal
    v-model="dialogVisible2"
    title="第一个 Dialog"
    width="500"
    :modal="false"
    :close-on-click-modal="false"
    click-modal-other
    draggable
    overflow
    click-to-front
  >
    <span>Modal 内容</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible2 = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible2 = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>

  <w-modal
    v-model="dialogVisible3"
    title="第二个 Dialog"
    width="500"
    :modal="false"
    :close-on-click-modal="false"
    click-modal-other
    draggable
    overflow
    click-to-front
  >
    <span>Modal 内容</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible3 = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible3 = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const dialogVisible1 = ref(false)
const dialogVisible2 = ref(false)
const dialogVisible3 = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="dialogVisible = true"> 打开对话框 </w-button>

  <w-modal
    v-model="dialogVisible"
    title="标题"
    fullscreen
    top="40vh"
    width="70%"
    draggable
  >
    <span>这是一个全屏对话框</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const dialogVisible = ref(false)
</script>
```

:::

:::demo 示例包括缩放（scale）、滑动（slide）、淡入淡出（fade）、弹跳（bounce）动画，以及带有自定义事件处理器的基于对象的配置。

```vue
<template>
  <w-button plain @click="openDialog('fade')"> Default </w-button>
  <w-button plain @click="openDialog('scale')"> Scale </w-button>
  <w-button plain @click="openDialog('slide')"> Slide </w-button>
  <w-button plain @click="openDialog('bounce')"> Bounce </w-button>
  <w-button plain @click="openDialogWithObject"> Object Config </w-button>

  <w-modal
    v-model="dialogVisible"
    :title="`${currentAnimation} 动画`"
    width="50%"
    class="custom-transition-dialog"
    :transition="transitionConfig"
  >
    <span>Modal 内容</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

import type { DialogTransition } from 'win-design-next'

const dialogVisible = ref(false)
const currentAnimation = ref('fade')
const isObjectConfig = ref(false)

const transitionConfig = computed<DialogTransition>(() => {
  if (isObjectConfig.value) {
    return {
      name: 'dialog-custom-object',
      appear: true,
      mode: 'out-in',
      duration: 500,
    }
  }
  return `dialog-${currentAnimation.value}`
})

const openDialog = (type: string) => {
  currentAnimation.value = type
  isObjectConfig.value = false
  dialogVisible.value = true
}

const openDialogWithObject = () => {
  currentAnimation.value = 'object-config'
  isObjectConfig.value = true
  dialogVisible.value = true
}
</script>

<style>
/* Scale Animation */
.dialog-scale-enter-active,
.dialog-scale-leave-active,
.dialog-scale-enter-active .w3-dialog,
.dialog-scale-leave-active .w3-dialog {
  transition: all 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
}

.dialog-scale-enter-from,
.dialog-scale-leave-to {
  opacity: 0;
}

.dialog-scale-enter-from .w3-dialog,
.dialog-scale-leave-to .w3-dialog {
  transform: scale(0.5);
  opacity: 0;
}

/* Slide Animation */
.dialog-slide-enter-active,
.dialog-slide-leave-active,
.dialog-slide-enter-active .w3-dialog,
.dialog-slide-leave-active .w3-dialog {
  transition: all 0.3s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.dialog-slide-enter-from,
.dialog-slide-leave-to {
  opacity: 0;
}

.dialog-slide-enter-from .w3-dialog,
.dialog-slide-leave-to .w3-dialog {
  transform: translateY(-100px);
  opacity: 0;
}

/* Bounce Animation */
.dialog-bounce-enter-active,
.dialog-bounce-leave-active,
.dialog-bounce-enter-active .w3-dialog,
.dialog-bounce-leave-active .w3-dialog {
  transition: all 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275);
}

.dialog-bounce-enter-from,
.dialog-bounce-leave-to {
  opacity: 0;
}

.dialog-bounce-enter-from .w3-dialog,
.dialog-bounce-leave-to .w3-dialog {
  transform: scale(0.3) translateY(-50px);
  opacity: 0;
}

/* Object Configuration Animation */
.dialog-custom-object-enter-active,
.dialog-custom-object-leave-active,
.dialog-custom-object-enter-active .w3-dialog,
.dialog-custom-object-leave-active .w3-dialog {
  transition: all 0.5s cubic-bezier(0.25, 0.8, 0.25, 1);
}

.dialog-custom-object-enter-from,
.dialog-custom-object-leave-to {
  opacity: 0;
}

.dialog-custom-object-enter-from .w3-dialog,
.dialog-custom-object-leave-to .w3-dialog {
  transform: rotate(180deg) scale(0.5);
  opacity: 0;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="visible = true">
    打开 Modal with customized header
  </w-button>

  <w-modal v-model="visible" title="标题" :show-close="false" width="500">
    <template #header="{ close, titleId, titleClass }">
      <div class="my-header">
        <h4 :id="titleId" :class="titleClass">自定义头部</h4>
        <w-button type="danger" @click="close">
          <w-icon class="w3-icon--left"><CircleCloseFilled /></w-icon>
          关闭
        </w-button>
      </div>
    </template>
    内容区域...
  </w-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { WButton, WDialog } from 'win-design-next'
import { CircleCloseFilled } from '@win-design-next/icons-vue'

const visible = ref(false)
</script>

<style scoped>
.my-header {
  display: flex;
  flex-direction: row;
  justify-content: space-between;
  gap: 16px;
}
</style>
```

:::

:::demo 通常我们不建议使用嵌套对话框。 如果你需要在页面上呈现多个对话框，你可以简单地打平它们，以便它们彼此之间是平级关系。 如果必须要在一个对话框内展示另一个对话框，可以将内部嵌套的对话框属性 `append-to-body` 设置为 true，嵌套的对话框将附加到 body 而不是其父节点，这样两个对话框都可以被正确地渲染。

```vue
<template>
  <w-button plain @click="outerVisible = true"> 打开嵌套对话框 </w-button>

  <w-modal v-model="outerVisible" title="Outer Dialog" width="800">
    <span>这是一个嵌套对话框</span>
    <w-modal
      v-model="innerVisible"
      width="500"
      title="第二个对话框"
      append-to-body
    >
      <span>内容区域</span>
    </w-modal>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="outerVisible = false">取消</w-button>
        <w-button type="primary" @click="innerVisible = true">
          打开第二个对话框
        </w-button>
      </div>
    </template>
  </w-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const outerVisible = ref(false)
const innerVisible = ref(false)
</script>
```

:::

:::demo 设置 `align-center` 为 `true` 使对话框水平垂直居中。 由于对话框垂直居中在弹性盒子中，所以`top`属性将不起作用。

```vue
<template>
  <w-button plain @click="centerDialogVisible = true"> 点击打开Modal </w-button>

  <w-modal v-model="centerDialogVisible" title="标题" width="500" align-center>
    <span>设置 align-center 为 true 使对话框水平垂直居中</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="centerDialogVisible = false">取消</w-button>
        <w-button type="primary" @click="centerDialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const centerDialogVisible = ref(false)
</script>
```

:::

:::demo 需要注意的是，当这个属性被启用时，在 `transition.beforeEnter` 事件卸载前，除了 `overlay`、`header (可选)`与`footer(可选)` ，Modal 内不会有其它任何其它的 DOM 节点存在。

```vue
<template>
  <w-button plain @click="centerDialogVisible = true"> 打开对话框 </w-button>

  <w-modal
    v-model="centerDialogVisible"
    title="标题"
    width="500"
    destroy-on-close
    center
  >
    <span>
      启用此功能时，默认栏位下的内容将使用 v-if 指令销毁。
      当出现性能问题时，可以启用此功能。 需要注意的是，当这个属性被启用时，在
      transition.beforeEnter 事件卸载前，除了 overlay、header
      (可选)与footer(可选)，Dialog 内不会有其它任何其它的 DOM 节点存在。
    </span>

    <template #footer>
      <div class="dialog-footer">
        <w-button @click="centerDialogVisible = false">取消</w-button>
        <w-button type="primary" @click="centerDialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const centerDialogVisible = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="dialogVisible = true">
    打开 the modal Dialog
  </w-button>

  <w-modal v-model="dialogVisible" :modal="false" title="标题">
    <span>这是一个 modal Dialog</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const dialogVisible = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-button plain @click="dialogVisible = true"> 打开 event Dialog </w-button>

  <w-modal
    v-model="dialogVisible"
    title="标题"
    modal-class="overide-animation"
    :before-close="
      (doneFn) => {
        console.log('before-close'), doneFn()
      }
    "
    @open="console.log('open')"
    @open-auto-focus="console.log('open-auto-focus')"
    @opened="console.log('opened')"
    @close="console.log('close')"
    @close-auto-focus="console.log('close-auto-focus')"
    @closed="console.log('closed')"
  >
    <span>这是一个 event Dialog</span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="dialogVisible = false">取消</w-button>
        <w-button type="primary" @click="dialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const dialogVisible = ref(false)
</script>
```

:::

:::demo 将`center`设置为`true`即可使标题和底部居中。 `center`仅影响标题和底部区域。 Modal 的内容是任意的，在一些情况下，内容并不适合居中布局。 如果需要内容也水平居中，请自行为其添加 CSS 样式。

```vue
<template>
  <w-button plain @click="centerDialogVisible = true"> 点击打开Modal </w-button>

  <w-modal v-model="centerDialogVisible" title="标题" width="500" center>
    <span> 应该注意的是，默认情况下，内容不会在中心对齐 </span>
    <template #footer>
      <div class="dialog-footer">
        <w-button @click="centerDialogVisible = false">取消</w-button>
        <w-button type="primary" @click="centerDialogVisible = false">
          确定
        </w-button>
      </div>
    </template>
  </w-modal>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const centerDialogVisible = ref(false)
</script>
```

:::

### API 文档

### Attributes

| 属性名                          | 说明                                                                                           | 类型                                | 默认  |
| ------------------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------- | ----- |
| model-value / v-model           | 是否显示 Modal                                                                                 | ^[boolean]                          | —     |
| title                           | Modal 对话框 Modal 的标题， 也可通过具名 slot （见下表）传入                                   | ^[string]                           | ''    |
| width                           | 对话框的宽度，默认值为 50%                                                                     | ^[string] / ^[number]               | ''    |
| fullscreen                      | 是否为全屏 Modal                                                                               | ^[boolean]                          | false |
| top                             | modal CSS 中的 margin-top 值，默认为 15vh                                                      | ^[string]                           | ''    |
| modal                           | 是否需要遮罩层                                                                                 | ^[boolean]                          | true  |
| modal-class                     | 遮罩的自定义类名                                                                               | ^[string]                           | —     |
| header-class                    | header 部分的自定义 class 名                                                                   | ^[string]                           | —     |
| body-class                      | body 部分的自定义 class 名                                                                     | ^[string]                           | —     |
| footer-class                    | footer 部分的自定义 class 名                                                                   | ^[string]                           | —     |
| append-to-body                  | Modal 自身是否插入至 body 元素上。 嵌套的 Modal 必须指定该属性并赋值为 `true`                  | ^[boolean]                          | false |
| append-to                       | Modal 挂载到哪个 DOM 元素 将覆盖 `append-to-body`                                              | ^[string] / ^[HTMLElement]          | body  |
| lock-scroll                     | 是否在 Modal 出现时将 body 滚动锁定                                                            | ^[boolean]                          | true  |
| open-delay                      | modal 打开的延时时间，单位毫秒                                                                 | ^[number]                           | 0     |
| close-delay                     | modal 关闭的延时时间，单位毫秒                                                                 | ^[number]                           | 0     |
| close-on-click-modal            | 是否可以通过点击 modal 关闭 Modal                                                              | ^[boolean]                          | true  |
| close-on-press-escape           | 是否可以通过按下 ESC 关闭 Modal                                                                | ^[boolean]                          | true  |
| show-close                      | 是否显示关闭按钮                                                                               | ^[boolean]                          | true  |
| before-close                    | 关闭前的回调，会暂停 Modal 的关闭. 回调函数内执行 done 参数方法的时候才是真正关闭对话框的时候. | ^[Function]`(done: DoneFn) => void` | —     |
| draggable                       | 为 Modal 启用可拖拽功能                                                                        | ^[boolean]                          | false |
| overflow                        | 拖动范围可以超出可视区                                                                         | ^[boolean]                          | false |
| center                          | 是否让 Modal 的 header 和 footer 部分居中排列                                                  | ^[boolean]                          | false |
| align-center                    | 是否水平垂直对齐对话框                                                                         | ^[boolean]                          | false |
| destroy-on-close                | 当关闭 Modal 时，销毁其中的元素                                                                | ^[boolean]                          | false |
| close-icon                      | 自定义关闭图标，默认 Close                                                                     | ^[string] / ^[Component]            | —     |
| z-index                         | 和原生的 CSS 的 z-index 相同，改变 z 轴的顺序                                                  | ^[number]                           | —     |
| header-aria-level ^(a11y)       | header 的 `aria-level` 属性                                                                    | ^[string]                           | 2     |
| custom-class ^(deprecated)      | Modal 的自定义类名                                                                             | ^[string]                           | ''    |
| subtitle ^(1.0.0)               | 对话框的副标题                                                                                 | ^[string]                           | ''    |
| color ^(1.0.0)                  | 是否为彩色对话框                                                                               | ^[boolean]                          | false |
| transition ^(1.0.0)             | 自定义动画类名                                                                                 | ^[string]                           | —     |
| click-modal-other ^(1.0.0)      | 关闭遮罩时是否可以操作其它功能区域                                                             | ^[boolean]                          | false |
| click-to-front ^(1.0.0)         | 多个 Modal 并存时点击置顶显示                                                                  | ^[boolean]                          | false |
| resize ^(1.0.0)                 | 是否允许拖拽改变大小                                                                           | ^[boolean]                          | false |
| resize-min-width ^(1.0.0)       | 拖拽改变大小时的最小宽度                                                                       | ^[number]                           | 300   |
| resize-min-height ^(1.0.0)      | 拖拽改变大小时的最小高度                                                                       | ^[number]                           | 150   |
| height ^(1.0.0)                 | 对话框的高度                                                                                   | ^[number]                           |       |
| max-height ^(1.0.0)             | 对话框的最大高度                                                                               | ^[number]                           |       |
| horizontal-paddingless ^(1.0.4) | 是否移除对话框的左右边距                                                                       | ^[boolean]                          | false |
| vertical-paddingless ^(1.0.4)   | 是否移除对话框的上下边距                                                                       | ^[boolean]                          | false |

### Slots

| 插槽名              | 说明                                                   |
| ------------------- | ------------------------------------------------------ |
| default             | 对话框的默认内容                                       |
| header              | 对话框标题的内容；会替换标题部分，但不会移除关闭按钮。 |
| footer              | Modal 按钮操作区的内容                                 |
| title ^(deprecated) | 与 header 作用相同 请使用 header                       |

### 事件

| 名称                          | 详情                              | Type                    |
| ----------------------------- | --------------------------------- | ----------------------- |
| open                          | Modal 打开的回调                  | ^[Function]`() => void` |
| opened                        | Modal 打开动画结束时的回调        | ^[Function]`() => void` |
| close                         | Modal 关闭的回调                  | ^[Function]`() => void` |
| closed                        | Modal 关闭动画结束时的回调        | ^[Function]`() => void` |
| open-auto-focus               | 输入焦点聚焦在 Modal 内容时的回调 | ^[Function]`() => void` |
| close-auto-focus              | 输入焦点从 Modal 内容失焦时的回调 | ^[Function]`() => void` |
| before-resize-change ^(1.0.0) | 拖拽改变大小时的回调              | ^[Function]`() => void` |
| after-resize-change ^(1.0.0)  | 拖拽改变大小结束时的回调          | ^[Function]`() => void` |

### Exposes

| 名称          | 详情     | 类型                    |
| ------------- | -------- | ----------------------- |
| resetPosition | 重置位置 | ^[Function]`() => void` |

---

## Popconfirm 二次确认框

点击某个元素弹出一个简单的气泡确认框

### 示例

:::demo 在 Popconfirm 中，只有 `title` 属性可用，`content` 属性会被忽略。

```vue
<template>
  <w-popconfirm title="确定要删除吗？">
    <template #reference>
      <w-button>删除</w-button>
    </template>
  </w-popconfirm>
</template>
```

:::

:::demo

```vue
<template>
  <w-popconfirm
    width="220"
    :icon="CircleInfoFilled"
    icon-color="#626AEF"
    title="确定要删除吗？"
    @cancel="onCancel"
  >
    <template #reference>
      <w-button>删除</w-button>
    </template>
    <template #actions="{ confirm, cancel }">
      <w-button size="small" @click="cancel">取消!</w-button>
      <w-button
        type="danger"
        size="small"
        :disabled="!clicked"
        @click="confirm"
      >
        确定
      </w-button>
    </template>
  </w-popconfirm>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { CircleInfoFilled } from '@win-design-next/icons-vue'

const clicked = ref(false)
function onCancel() {
  clicked.value = true
}
</script>
```

:::

:::demo

```vue
<template>
  <w-popconfirm
    confirm-button-text="确定"
    cancel-button-text="取消"
    :icon="CircleInfoFilled"
    icon-color="#626AEF"
    title="确定要删除吗？"
    @confirm="confirmEvent"
    @cancel="cancelEvent"
  >
    <template #reference>
      <w-button>删除</w-button>
    </template>
  </w-popconfirm>
</template>

<script setup lang="ts">
import { CircleInfoFilled } from '@win-design-next/icons-vue'

const confirmEvent = () => {
  console.log('confirm!')
}
const cancelEvent = () => {
  console.log('cancel!')
}
</script>
```

:::

### API 文档

### Attributes

| 属性名              | 说明                                                                                 | 类型                                                                                    | 默认           |
| ------------------- | ------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------- | -------------- |
| title               | 标题                                                                                 | ^[string]                                                                               | —              |
| confirm-button-text | 确认按钮文字                                                                         | ^[string]                                                                               | —              |
| cancel-button-text  | 取消按钮文字                                                                         | ^[string]                                                                               | —              |
| confirm-button-type | 确认按钮类型                                                                         | ^[enum]`'primary' \| 'success' \| 'warning' \| 'danger' \| 'error' \| 'info' \| 'text'` | primary        |
| cancel-button-type  | 取消按钮类型                                                                         | ^[enum]`'primary' \| 'success' \| 'warning' \| 'danger' \| 'error' \| 'info' \| 'text'` | default        |
| icon                | 自定义图标                                                                           | ^[string] / ^[Component]                                                                | QuestionFilled |
| icon-color          | Icon 颜色                                                                            | ^[string]                                                                               | #f90           |
| hide-icon           | 是否隐藏 Icon                                                                        | ^[boolean]                                                                              | false          |
| hide-after          | 关闭时的延迟                                                                         | ^[number]                                                                               | 200            |
| teleported          | 是否将 popover 的下拉列表插入至 body 元素                                            | ^[boolean]                                                                              | true           |
| persistent          | 当 popover 组件长时间不触发且 `persistent` 属性设置为 `false` 时, popover 将会被删除 | ^[boolean]                                                                              | false          |
| width               | 弹层宽度，最小宽度 150px                                                             | ^[string] / ^[number]                                                                   | 150            |

### Events

| 事件名  | 说明               | 类型                                 |
| ------- | ------------------ | ------------------------------------ |
| confirm | 点击确认按钮时触发 | ^[Function]`(e: MouseEvent) => void` |
| cancel  | 点击取消按钮时触发 | ^[Function]`(e: MouseEvent) => void` |

### Slots

| 插槽名    | 说明                             | 类型                                                                             |
| --------- | -------------------------------- | -------------------------------------------------------------------------------- |
| reference | 触发 Popconfirm 显示的 HTML 元素 | —                                                                                |
| actions   | 页脚的内容                       | ^[object]`{ confirm: (e: MouseEvent) => void, cancel: (e: MouseEvent) => void }` |

---

## Popover 悬浮框

Popover 是在 `WTooltip` 基础上开发出来的。 因此对于重复属性，请参考 Tooltip 的文档，在此文档中不做详尽解释。

### 示例

:::demo `trigger` 属性被用来决定 popover 的触发方式，支持的触发方式： `hover`、`click`、`focus` 或 `contextmenu`。 如果你想手动控制它，可以设置 `:visible` 属性。

```vue
<template>
  <w-popover
    placement="top-start"
    title="标题"
    :width="200"
    trigger="hover"
    content="这是内容，这是内容，这是内容"
  >
    <template #reference>
      <w-button class="m-2">Hover 激活</w-button>
    </template>
  </w-popover>

  <w-popover
    placement="bottom"
    title="标题"
    :width="200"
    trigger="click"
    content="这是内容，这是内容，这是内容"
  >
    <template #reference>
      <w-button class="m-2">Click 激活</w-button>
    </template>
  </w-popover>

  <w-popover
    ref="popover"
    placement="right"
    title="标题"
    :width="200"
    trigger="focus"
    content="这是内容，这是内容，这是内容"
  >
    <template #reference>
      <w-button class="m-2">Focus 激活</w-button>
    </template>
  </w-popover>

  <w-popover
    ref="popover"
    title="标题"
    :width="200"
    trigger="contextmenu"
    content="这是内容，这是内容，这是内容"
  >
    <template #reference>
      <w-button class="m-2">contextmenu 激活</w-button>
    </template>
  </w-popover>

  <w-popover
    :visible="visible"
    placement="bottom"
    title="标题"
    :width="200"
    content="这是内容，这是内容，这是内容"
  >
    <template #reference>
      <w-button class="m-2" @click="visible = !visible"> Manual 激活 </w-button>
    </template>
  </w-popover>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const visible = ref(false)
</script>

<style scoped>
.w3-button + .w3-button {
  margin-left: 8px;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-button ref="buttonRef" v-click-outside="onClickOutside"> 点击 </w-button>

  <w-popover
    ref="popoverRef"
    :virtual-ref="buttonRef"
    trigger="click"
    title="标题"
    virtual-triggering
  >
    <span> 内容 </span>
  </w-popover>
</template>

<script setup lang="ts">
import { ref, unref } from 'vue'
import { ClickOutside as vClickOutside } from 'win-design-next'

const buttonRef = ref()
const popoverRef = ref()
const onClickOutside = () => {
  unref(popoverRef).popperRef?.delayHide?.()
}
</script>
```

:::

:::demo 利用插槽取代 `content` 属性

```vue
<template>
  <div style="display: flex; align-items: center">
    <w-popover placement="right" :width="400" trigger="click">
      <template #reference>
        <w-button style="margin-right: 16px">Click 激活</w-button>
      </template>
      <w-table :data="gridData">
        <w-table-column width="150" property="date" label="date" />
        <w-table-column width="100" property="name" label="name" />
        <w-table-column width="300" property="address" label="address" />
      </w-table>
    </w-popover>
  </div>
</template>

<script lang="ts" setup>
const gridData = [
  {
    date: '2016-05-02',
    name: 'Jack',
    address: 'New York City',
  },
  {
    date: '2016-05-04',
    name: 'Jack',
    address: 'New York City',
  },
  {
    date: '2016-05-01',
    name: 'Jack',
    address: 'New York City',
  },
  {
    date: '2016-05-03',
    name: 'Jack',
    address: 'New York City',
  },
]
</script>
```

:::

:::demo

```vue
<template>
  <w-popover :visible="visible" placement="top" :width="160">
    <p>确定要删除此项吗?</p>
    <div class="flex" style="justify-content: flex-end">
      <w-button size="mini" @click="visible = false">取消</w-button>
      <w-button size="mini" type="primary" @click="visible = false">
        确定
      </w-button>
    </div>
    <template #reference>
      <w-button @click="visible = true">Delete</w-button>
    </template>
  </w-popover>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const visible = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-button v-popover="popoverRef" v-click-outside="onClickOutside">
    点击
  </w-button>

  <w-popover
    ref="popoverRef"
    trigger="click"
    title="标题"
    virtual-triggering
    persistent
  >
    <span> 内容 </span>
  </w-popover>
</template>

<script setup lang="ts">
import { ref, unref } from 'vue'
import { ClickOutside as vClickOutside } from 'win-design-next'

const popoverRef = ref()
const onClickOutside = () => {
  unref(popoverRef).popperRef?.delayHide?.()
}
</script>
```

:::

### API 文档

### Attributes

| 属性名                    | 说明                                                                                                               | 类型                                                                                                                                                                        | Default                                                                    |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| trigger                   | 触发方式                                                                                                           | ^[enum]`'click' \| 'focus' \| 'hover' \| 'contextmenu'`                                                                                                                     | hover                                                                      |
| title                     | 标题                                                                                                               | ^[string]                                                                                                                                                                   | —                                                                          |
| effect                    | Tooltip 主题，WinDesign Next 内置了 `dark` / `light` 两种主题                                                      | ^[enum]`'dark' \| 'light'` / ^[string]                                                                                                                                      | light                                                                      |
| content                   | 显示的内容，也可以通过写入默认 `slot` 修改显示内容                                                                 | ^[string]                                                                                                                                                                   | ''                                                                         |
| width                     | 宽度                                                                                                               | ^[string] / ^[number]                                                                                                                                                       | 150                                                                        |
| placement                 | 出现位置                                                                                                           | ^[enum]`'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'` | bottom                                                                     |
| disabled                  | Popover 是否可用                                                                                                   | ^[boolean]                                                                                                                                                                  | false                                                                      |
| visible / v-model:visible | Popover 是否显示                                                                                                   | ^[boolean] / ^[null]                                                                                                                                                        | null                                                                       |
| offset                    | 浮层偏移量, `Popover` 是在 `Tooltip`,基础上开发的， `Popover`的 offset 是 `undefined`, 但`Tooltip` 的 offset 是 12 | ^[number]                                                                                                                                                                   | undefined                                                                  |
| transition                | 定义渐变动画，默认是 w3-fade-in-linear                                                                             | ^[string]                                                                                                                                                                   | —                                                                          |
| show-arrow                | 是否显示 Tooltip 箭头， 欲了解更多信息，请参考 WPopper                                                             | ^[boolean]                                                                                                                                                                  | true                                                                       |
| popper-options            | [popper.js](https://popper.js.org/docs/v2/) 的参数                                                                 | ^[object]                                                                                                                                                                   | `{modifiers: [{name: 'computeStyles',options: {gpuAcceleration: false}}]}` |
| popper-class              | 为 popper 添加类名                                                                                                 | ^[string]                                                                                                                                                                   | —                                                                          |
| popper-style              | 为 popper 自定义样式                                                                                               | ^[string] / ^[object]                                                                                                                                                       | —                                                                          |
| show-after                | 在触发后多久显示内容，单位毫秒                                                                                     | ^[number]                                                                                                                                                                   | 0                                                                          |
| hide-after                | 延迟关闭，单位毫秒                                                                                                 | ^[number]                                                                                                                                                                   | 200                                                                        |
| auto-close                | tooltip 出现后自动隐藏延时，单位毫秒                                                                               | ^[number]                                                                                                                                                                   | 0                                                                          |
| tabindex                  | Popover 组件的 [tabindex](https://developer.mozilla.org/zh-CN/docs/Web/HTML/Global_attributes/tabindex)            | ^[number] / ^[string]                                                                                                                                                       | 0                                                                          |
| teleported                | 是否将 popover 的下拉列表插入至 body 元素                                                                          | ^[boolean]                                                                                                                                                                  | true                                                                       |
| persistent                | 当 popover 组件长时间不触发且 `persistent` 属性设置为 `false` 时, popover 将会被删除                               | ^[boolean]                                                                                                                                                                  | true                                                                       |

### Slots

| 插槽名    | 说明                          |
| --------- | ----------------------------- |
| default   | Popover 内嵌 HTML 文本        |
| reference | 触发 Popover 显示的 HTML 元素 |

### Events

| 事件名       | 说明                   | Type                    |
| ------------ | ---------------------- | ----------------------- |
| show         | 显示时触发             | ^[Function]`() => void` |
| before-enter | 显示动画播放前触发     | ^[Function]`() => void` |
| after-enter  | 显示动画播放完毕后触发 | ^[Function]`() => void` |
| hide         | 隐藏时触发             | ^[Function]`() => void` |
| before-leave | 隐藏动画播放前触发     | ^[Function]`() => void` |
| after-leave  | 隐藏动画播放完毕后触发 | ^[Function]`() => void` |

### Exposes

| 名称 | 详情         | 类型                    |
| ---- | ------------ | ----------------------- |
| hide | 隐藏 popover | ^[Function]`() => void` |

---

## Tooltip 文字提示

常用于展示鼠标 hover 时的提示信息。

### 示例

:::demo 使用 `content` 属性来决定 `hover` 时的提示信息。 由 `placement` 属性决定展示效果： `placement`属性值为：`[方向]-[对齐位置]`；四个方向：`top`、`left`、`right`、`bottom`；三种对齐位置：`start`, `end`，默认为空。 如 `placement="left-end"`，则提示信息出现在目标元素的左侧，且提示信息的底部与目标元素的底部对齐。

```vue
<template>
  <div class="tooltip-base-box">
    <div class="row center">
      <w-tooltip
        class="box-item"
        content="Top Left prompts info"
        placement="top-start"
      >
        <w-button>top-start</w-button>
      </w-tooltip>
      <w-tooltip
        class="box-item"
        content="Top Center prompts info"
        placement="top"
      >
        <w-button>top</w-button>
      </w-tooltip>
      <w-tooltip
        class="box-item"
        content="Top Right prompts info"
        placement="top-end"
      >
        <w-button>top-end</w-button>
      </w-tooltip>
    </div>
    <div class="row">
      <w-tooltip
        class="box-item"
        content="Left Top prompts info"
        placement="left-start"
      >
        <w-button>left-start</w-button>
      </w-tooltip>
      <w-tooltip
        class="box-item"
        content="Right Top prompts info"
        placement="right-start"
      >
        <w-button>right-start</w-button>
      </w-tooltip>
    </div>
    <div class="row">
      <w-tooltip
        class="box-item"
        content="Left Center prompts info"
        placement="left"
      >
        <w-button class="mt-3 mb-3">left</w-button>
      </w-tooltip>
      <w-tooltip
        class="box-item"
        content="Right Center prompts info"
        placement="right"
      >
        <w-button>right</w-button>
      </w-tooltip>
    </div>
    <div class="row">
      <w-tooltip
        class="box-item"
        content="Left Bottom prompts info"
        placement="left-end"
      >
        <w-button>left-end</w-button>
      </w-tooltip>
      <w-tooltip
        class="box-item"
        content="Right Bottom prompts info"
        placement="right-end"
      >
        <w-button>right-end</w-button>
      </w-tooltip>
    </div>
    <div class="row center">
      <w-tooltip
        class="box-item"
        content="Bottom Left prompts info"
        placement="bottom-start"
      >
        <w-button>bottom-start</w-button>
      </w-tooltip>
      <w-tooltip
        class="box-item"
        content="Bottom Center prompts info"
        placement="bottom"
      >
        <w-button>bottom</w-button>
      </w-tooltip>
      <w-tooltip
        class="box-item"
        content="Bottom Right prompts info"
        placement="bottom-end"
      >
        <w-button>bottom-end</w-button>
      </w-tooltip>
    </div>
  </div>
</template>

<style>
.tooltip-base-box {
  width: 600px;
}
.tooltip-base-box .row {
  display: flex;
  align-items: center;
  justify-content: space-between;
}
.tooltip-base-box .center {
  justify-content: center;
}
.tooltip-base-box .box-item {
  width: 110px;
  margin-top: 10px;
}
</style>
```

:::

:::demo 通过设置 `effect` 来修改主题，默认值为 `dark`.

```vue
<template>
  <w-tooltip content="Top center" placement="top" effect="dark">
    <w-button>Dark</w-button>
  </w-tooltip>
  <w-tooltip content="Bottom center" placement="bottom">
    <w-button>Light</w-button>
  </w-tooltip>

  <w-tooltip content="Bottom center" effect="customized">
    <w-button>Customized theme</w-button>
  </w-tooltip>
</template>

<style>
.w3-popper.is-customized {
  /* Set padding to ensure the height is 32px */
  padding: 6px 12px;
  background: linear-gradient(90deg, rgb(159, 229, 151), rgb(204, 229, 129));
}

.w3-popper.is-customized .w3-popper__arrow::before {
  background: linear-gradient(45deg, #b2e68d, #bce689);
  right: 0;
}
</style>
```

:::

:::demo 用具名 slot `content`，替代`tooltip`中的`content`属性。

```vue
<template>
  <w-tooltip placement="top">
    <template #content> multiple lines<br />second line </template>
    <w-button>Top center</w-button>
  </w-tooltip>
</template>
```

:::

:::demo

```vue
<template>
  <w-tooltip
    :disabled="disabled"
    content="click to close tooltip function"
    placement="bottom"
    effect="light"
  >
    <w-button @click="disabled = !disabled">
      click to {{ disabled ? 'active' : 'close' }} tooltip function
    </w-button>
  </w-tooltip>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const disabled = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-tooltip
    content="<span>The content can be <strong>HTML</strong></span>"
    raw-content
  >
    <w-button>hover me</w-button>
  </w-tooltip>
</template>
```

:::

:::demo

```vue
<template>
  <w-tooltip
    v-model:visible="visible"
    content="Bottom center"
    placement="bottom"
    effect="light"
    trigger="click"
    virtual-triggering
    :virtual-ref="triggerRef"
  />
  <w-button @click="visible = !visible">test</w-button>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, ref } from 'vue'

const visible = ref(false)
const position = ref({
  top: 0,
  left: 0,
  bottom: 0,
  right: 0,
} as DOMRect)

const triggerRef = ref({
  getBoundingClientRect: () => position.value,
})

const mousemoveHandler = ({ clientX, clientY }: MouseEvent) => {
  position.value = DOMRect.fromRect({
    x: clientX,
    y: clientY,
  })
}

onMounted(() => {
  document.addEventListener('mousemove', mousemoveHandler)
})

onUnmounted(() => {
  document.removeEventListener('mousemove', mousemoveHandler)
})
</script>
```

:::

:::demo

```vue
<template>
  <div>
    <w-button
      v-for="i in 3"
      :key="i"
      @mouseover="(e) => (buttonRef = e.currentTarget)"
      @click="visible = !visible"
      >Click 激活</w-button
    >
  </div>

  <w-tooltip
    ref="tooltipRef"
    :visible="visible"
    :popper-options="{
      modifiers: [
        {
          name: 'computeStyles',
          options: {
            adaptive: false,
            enabled: false,
          },
        },
      ],
    }"
    :virtual-ref="buttonRef"
    virtual-triggering
    popper-class="singleton-tooltip"
  >
    <template #content>
      <span> 内容 </span>
    </template>
  </w-tooltip>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const buttonRef = ref()
const tooltipRef = ref()

const visible = ref(false)
</script>

<style>
.singleton-tooltip {
  transition: transform 0.3s var(--w3-transition-function-fast-bezier);
}
</style>
```

:::

:::demo

```vue
<template>
  <w-tooltip :visible="visible">
    <template #content>
      <span>Content</span>
    </template>
    <w-button @mouseenter="visible = true" @mouseleave="visible = false">
      Hover me
    </w-button>
  </w-tooltip>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const visible = ref(false)
</script>
```

:::

:::demo

```vue
<template>
  <w-tooltip content="I am an w-tooltip" transition="slide-fade">
    <w-button>trigger me</w-button>
  </w-tooltip>
</template>

<script lang="ts" setup></script>

<style>
.slide-fade-enter-active {
  transition: all 0.3s ease-out;
}

.slide-fade-leave-active {
  transition: all 0.8s cubic-bezier(1, 0.5, 0.8, 1);
}

.slide-fade-enter-from,
.slide-fade-leave-to {
  transform: translateX(120px);
  opacity: 0;
}
</style>
```

:::

### API 文档

### Attributes

| 名称                      | 说明                                                                                                              | 类型                                                                                                                                                                        | 默认值            |
| ------------------------- | ----------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------- |
| append-to                 | 指示 Tooltip 的内容将附加在哪一个网页元素上                                                                       | ^[CSSSelector] / ^[HTMLElement]                                                                                                                                             | —                 |
| effect                    | Tooltip 主题，内置了 `dark` / `light` 两种                                                                        | ^[enum]`'dark' \| 'light'`                                                                                                                                                  | light             |
| content                   | 显示的内容，也可被 `slot#content` 覆盖                                                                            | ^[string]                                                                                                                                                                   | ''                |
| raw-content               | `content` 中的内容是否作为 HTML 字符串处理                                                                        | ^[boolean]                                                                                                                                                                  | false             |
| placement                 | Tooltip 组件出现的位置                                                                                            | ^[enum]`'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'` | bottom            |
| fallback-placements       | Tooltip 可用的 positions 请查看[popper.js 文档](https://popper.js.org/docs/v2/modifiers/flip/#fallbackplacements) | ^[array]`Placement[]`                                                                                                                                                       | —                 |
| visible / v-model:visible | Tooltip 组件可见性                                                                                                | ^[boolean]                                                                                                                                                                  | —                 |
| disabled                  | Tooltip 组件是否禁用                                                                                              | ^[boolean]                                                                                                                                                                  | —                 |
| offset                    | 出现位置的偏移量                                                                                                  | ^[number]                                                                                                                                                                   | 12                |
| transition                | 动画名称                                                                                                          | ^[string]                                                                                                                                                                   | —                 |
| popper-options            | [popper.js](https://popper.js.org/docs/v2/) 参数                                                                  | ^[object] 请参考 [popper.js](https://popper.js.org/docs/v2/) 文档                                                                                                           | {}                |
| show-after                | 在触发后多久显示内容，单位毫秒                                                                                    | ^[number]                                                                                                                                                                   | 0                 |
| show-arrow                | tooltip 的内容是否有箭头                                                                                          | ^[boolean]                                                                                                                                                                  | true              |
| hide-after                | 延迟关闭，单位毫秒                                                                                                | ^[number]                                                                                                                                                                   | 200               |
| auto-close                | tooltip 出现后自动隐藏延时，单位毫秒                                                                              | ^[number]                                                                                                                                                                   | 0                 |
| popper-class              | 为 Tooltip 的 popper 添加类名                                                                                     | ^[string]                                                                                                                                                                   | —                 |
| enterable                 | 鼠标是否可进入到 tooltip 中                                                                                       | ^[boolean]                                                                                                                                                                  | true              |
| teleported                | 是否使用 teleport。设置成 `true`则会被追加到 `append-to` 的位置                                                   | ^[boolean]                                                                                                                                                                  | true              |
| trigger                   | 如何触发 Tooltip                                                                                                  | ^[enum]`'hover' \| 'click' \| 'focus' \| 'contextmenu'`                                                                                                                     | hover             |
| virtual-triggering        | 用来标识虚拟触发是否被启用                                                                                        | ^[boolean]                                                                                                                                                                  | —                 |
| virtual-ref               | 标识虚拟触发时的触发元素                                                                                          | ^[HTMLElement]                                                                                                                                                              | —                 |
| trigger-keys              | 当鼠标点击或者聚焦在触发元素上时， 可以定义一组键盘按键并且通过它们来控制 Tooltip 的显示                          | ^[Array]                                                                                                                                                                    | ['Enter','Space'] |
| persistent                | 当 tooltip 组件长时间不触发且 `persistent` 属性设置为 `false` 时, popconfirm 将会被删除                           | ^[boolean]                                                                                                                                                                  | —                 |
| aria-label ^(a11y)        | 和 `aria-label` 属性保持一致                                                                                      | ^[string]                                                                                                                                                                   | —                 |
| arrow-offset ^(0.0.11)    | 控制 Tooltip 的箭头相对于弹出窗口的偏移                                                                           | ^[number]                                                                                                                                                                   | 5                 |

### Slots

| 插槽名  | 说明                      |
| ------- | ------------------------- |
| default | Tooltip 触发 & 引用的元素 |
| content | 自定义内容                |

### Exposes

| 名称                 | 详情                                            | 类型                                                |
| -------------------- | ----------------------------------------------- | --------------------------------------------------- |
| popperRef            | w-popper 组件实例                               | ^[object]`Ref<PopperInstance \| undefined>`         |
| contentRef           | w-tooltip-content 组件实例                      | ^[object]`Ref<TooltipContentInstance \| undefined>` |
| isFocusInsideContent | 验证当前焦点事件是否在 w-tooltip-content 中触发 | ^[Function]`() => boolean \| undefined`             |
| updatePopper         | 更新 w-popper 组件实例                          | ^[Function]`() => void`                             |
| onOpen               | onOpen 方法控制 w-tooltip 显示状态              | ^[Function]`(event?: Event \| undefined) => void`   |
| onClose              | onClose 方法控制 w-tooltip 显示状态             | ^[Function]`(event?: Event \| undefined) => void`   |
| hide                 | 提供 hide 方法                                  | ^[Function]`(event?: Event \| undefined) => void`   |

---

