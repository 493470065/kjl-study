## Avatar 头像

Avatar 组件可以用来代表人物或对象， 支持使用图片、图标或者文字作为 Avatar。

### 示例

:::demo

```vue
<template>
  <w-row class="demo-avatar demo-basic">
    <w-col :span="12">
      <div class="sub-title">circle</div>
      <div class="demo-basic--circle">
        <div class="block">
          <w-avatar :size="36" :src="circleUrl" />
        </div>
        <div v-for="size in sizeList" :key="size" class="block">
          <w-avatar :size="size" :src="circleUrl" />
        </div>
      </div>
    </w-col>
    <w-col :span="12">
      <div class="sub-title">square</div>
      <div class="demo-basic--circle">
        <div class="block">
          <w-avatar shape="square" :size="50" :src="squareUrl" />
        </div>
        <div v-for="size in sizeList" :key="size" class="block">
          <w-avatar shape="square" :size="size" :src="squareUrl" />
        </div>
      </div>
    </w-col>
  </w-row>
</template>

<script lang="ts" setup>
import { reactive, toRefs } from 'vue'

const state = reactive({
  circleUrl:
    'https://cube.elemecdn.com/3/7c/3ea6beec64369c2642b92c6726f1epng.png',
  squareUrl:
    'https://cube.elemecdn.com/9/c2/f0ee8a3c7c9638a54940382568c9dpng.png',
  sizeList: ['small', '', 'large'] as const,
})

const { circleUrl, squareUrl, sizeList } = toRefs(state)
</script>

<style scoped>
.demo-basic {
  text-align: center;
}
.demo-basic .sub-title {
  margin-bottom: 10px;
  font-size: 14px;
  color: var(--w3-font-color-third);
}
.demo-basic .demo-basic--circle,
.demo-basic .demo-basic--square {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
.demo-basic .block:not(:last-child) {
  border-right: 1px solid var(--w3-border-color);
}
.demo-basic .block {
  flex: 1;
}
.demo-basic .w3-col:not(:last-child) {
  border-right: 1px solid var(--w3-border-color);
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="demo-type">
    <div>
      <w-avatar :icon="User" />
    </div>
    <div>
      <w-avatar
        src="https://cdn.dribbble.com/userupload/9645535/file/original-b7756b0958f420bef5cbf243c947f149.png?resize=752x"
      />
    </div>
    <div>
      <w-avatar> user </w-avatar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { User } from '@win-design-next/icons-vue'
</script>

<style scoped>
.demo-type {
  display: flex;
}
.demo-type > div {
  flex: 1;
  text-align: center;
}

.demo-type > div:not(:last-child) {
  border-right: 1px solid var(--w3-border-color);
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="demo-type">
    <w-avatar :size="60" src="https://empty" @error="errorHandler">
      <img
        src="https://cube.elemecdn.com/e/fd/0fc7d20532fdaf769a25683617711png.png"
      />
    </w-avatar>
  </div>
</template>

<script lang="ts" setup>
const errorHandler = () => true
</script>
```

:::

:::demo

```vue
<template>
  <div class="demo-fit">
    <div v-for="fit in fits" :key="fit" class="block">
      <span class="title">{{ fit }}</span>
      <w-avatar shape="square" :size="100" :fit="fit" :src="url" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive, toRefs } from 'vue'

import type { ObjectFitProperty } from 'csstype'

const state = reactive({
  fits: [
    'fill',
    'contain',
    'cover',
    'none',
    'scale-down',
  ] as ObjectFitProperty[],
  url: 'https://cdn.dribbble.com/users/175710/screenshots/4982767/media/a874e5b7dbbe8bcc649024022fcf908a.png?resize=800x600&vertical=center',
})

const { fits, url } = toRefs(state)
</script>

<style scoped>
.demo-fit {
  display: flex;
  text-align: center;
  justify-content: space-between;
}
.demo-fit .block {
  flex: 1;
  display: flex;
  flex-direction: column;
  flex-grow: 0;
}

.demo-fit .title {
  margin-bottom: 10px;
  font-size: 14px;
  color: var(--w3-font-color-third);
}
</style>
```

:::

### API 文档

### Attributes

| 名称      | 说明                           | 类型                                                                    | 默认值     |
| ------- | ---------------------------- | --------------------------------------------------------------------- | ------- |
| icon    | 设置 Avatar 的图标类型，具体参考 Icon 组件 | ^[string] / ^[Component]                                              | —       |
| size    | Avatar 大小                    | ^[number] / ^[enum]`'large' \| 'default' \| 'small'`                | default |
| shape   | Avatar 形状                    | ^[enum]`'circle' \| 'square'`                                        | circle  |
| src     | Avatar 图片的源地址                | `string`                                                              | —       |
| src-set | 图片 Avatar 的原生 `srcset` 属性    | `string`                                                              | —       |
| alt     | 图片 Avatar 的原生 `alt` 属性       | `string`                                                              | —       |
| fit     | 当展示类型为图片的时候，设置图片如何适应容器       | ^[enum]`'fill' \| 'contain' \| 'cover' \| 'none' \| 'scale-down'` | cover   |

### Events

| 名称    | 说明        | 类型                                 |
| ----- | --------- | ---------------------------------- |
| error | 图片加载失败时触发 | ^[Function]`(e: Event) => void` |

### Slots

| 插槽名     | 说明        |
| ------- | --------- |
| default | 自定义头像展示内容 |

---

## Badge 徽章

按钮和图标上的数字或状态标记。

### 示例

:::demo 数量值可接受 Number 或 String。

```vue
<template>
  <w-badge :value="12" class="item">
    <w-button>comments</w-button>
  </w-badge>
  <w-badge :value="3" class="item" type="error">
    <w-button>replies</w-button>
  </w-badge>
  <w-badge :value="1" class="item" type="primary">
    <w-button>comments</w-button>
  </w-badge>
  <w-badge :value="2" class="item" type="warning">
    <w-button>replies</w-button>
  </w-badge>
  <w-badge :value="1" class="item" color="green">
    <w-button>custom background</w-button>
  </w-badge>
  <w-dropdown trigger="click">
    <span class="w3-dropdown-link">
      点击
      <w-icon class="w3-icon--right"><caret-bottom /></w-icon>
    </span>
    <template #dropdown>
      <w-dropdown-menu>
        <w-dropdown-item class="clearfix">
          comments
          <w-badge class="mark" :value="12" />
        </w-dropdown-item>
        <w-dropdown-item class="clearfix">
          replies
          <w-badge class="mark" :value="3" />
        </w-dropdown-item>
      </w-dropdown-menu>
    </template>
  </w-dropdown>
</template>

<script lang="ts" setup>
import { CaretBottom } from '@win-design-next/icons-vue'
</script>

<style scoped>
.item {
  margin-top: 10px;
  margin-right: 30px;
}

.w3-dropdown {
  margin-top: 1.1rem;
}
</style>
```

:::

:::demo 当 value 是 String 时，可以显示自定义文字。 或者使用 `content` 插槽。

```vue
<template>
  <w-badge value="new" class="item">
    <w-button>comments</w-button>
  </w-badge>
  <w-badge value="hot" class="item">
    <w-button>replies</w-button>
  </w-badge>
  <w-badge value="99" class="item">
    <w-button>share</w-button>
    <template #content="{ value }">
      <div class="custom-content">
        <w-icon>
          <Bell />
        </w-icon>
        <span>{{ value }}</span>
      </div>
    </template>
  </w-badge>
</template>

<script setup lang="ts">
import { Bell } from '@win-design-next/icons-vue'
</script>

<style scoped>
.item {
  margin-top: 10px;
  margin-right: 40px;
}

.custom-content {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}
</style>
```

:::

:::demo 使用 `is-dot` 属性。 是个布尔值。

```vue
<template>
  <w-badge is-dot class="item">query</w-badge>
  <w-badge is-dot class="item">
    <w-button class="share-button" :icon="Share" type="primary" />
  </w-badge>
</template>

<script lang="ts" setup>
import { Share } from '@win-design-next/icons-vue'
</script>

<style scoped>
.item {
  margin-top: 10px;
  margin-right: 40px;
}
</style>
```

:::

:::demo 设置徽章点的偏移，格式是[左，顶部]， 代表状态点从左侧和默认位置顶部的偏移。

```vue
<template>
  <w-badge class="item" :value="1" :offset="[10, 5]">
    <w-button> offset</w-button>
  </w-badge>
</template>

<style scoped>
.item {
  margin-top: 10px;
  margin-right: 30px;
}
</style>
```

:::

### API 文档

### Attributes

| 属性名      | 说明                                                                  | 类型                                                                          | 默认值 |
| ----------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------- | ------ |
| value       | 显示值                                                                | ^[string] / ^[number]                                                         | ''     |
| max         | 最大值，超过最大值会显示 `{max}+`。 只有当 value 是数字类型时起作用。 | ^[number]                                                                     | 99     |
| is-dot      | 是否显示小圆点。                                                      | ^[boolean]                                                                    | false  |
| hidden      | 是否隐藏 Badge。                                                      | ^[boolean]                                                                    | false  |
| type        | badge type.                                                           | ^[enum]`'primary' \| 'success' \| 'warning' \| 'danger' \| 'error' \| 'info'` | danger |
| show-zero   | 值为零时是否显示 Badge                                                | ^[boolean]                                                                    | true   |
| color       | 背景色                                                                | ^[string]                                                                     |        |
| offset      | badge 的偏移量                                                        | [ `number` , `number` ]                                                       | —      |
| badge-style | 自定义 badge 样式                                                     | ^[object]`CSSProperties`                                                      | —      |
| badge-class | 自定义 badge 类名                                                     | ^[string]                                                                     | —      |

### Slots

| 插槽名  | 说明           | 类型                         |
| ------- | -------------- | ---------------------------- |
| default | 自定义默认内容 | -                            |
| content | 自定义显示内容 | ^[object]`{ value: string }` |

---

## Card 卡片

将信息聚合在卡片容器中展示。

### 示例

:::demo Card 组件由 `header` `body` 和 `footer`组成。 `header` 和 `footer`是可选的，其内容取决于一个具名的 slot。

```vue
<template>
  <w-card style="max-width: 480px">
    <template #header>
      <div class="card-header">
        <span>标题</span>
      </div>
    </template>
    <p v-for="o in 2" :key="o" class="text item">{{ '列表 ' + o }}</p>
    <template #footer>Footer content</template>
  </w-card>
</template>
```

:::

:::demo 通过 `shadow` 属性设置卡片阴影出现的时机。 该属性的值可以是：`always`、`hover` 或 `never`。

```vue
<template>
  <div class="flex flex-wrap gap-4">
    <w-card style="width: 480px" shadow="always">Always</w-card>
    <w-card style="width: 480px" shadow="hover">Hover</w-card>
    <w-card style="width: 480px" shadow="never">Never</w-card>
    <w-card style="width: 480px" shadow="hover" interactive>interactive</w-card>
  </div>
</template>
```

:::

:::demo

```vue
<template>
  <w-card style="max-width: 480px">
    <p v-for="o in 2" :key="o" class="text item">{{ '选项 ' + o }}</p>
  </w-card>
</template>
```

:::

### API 文档

### Attributes

| 属性名      | 说明                                                                                          | 类型                              | 默认值 |
| ----------- | --------------------------------------------------------------------------------------------- | --------------------------------- | ------ |
| header      | 卡片的标题 你既可以通过设置 header 来修改标题，也可以通过 `slot#header` 传入 DOM 节点         | ^[string]                         | —      |
| footer      | 卡片页脚。 你既可以通过设置 footer 来修改卡片底部内容，也可以通过 `slot#footer` 传入 DOM 节点 | ^[string]                         | —      |
| body-style  | body 的 CSS 样式                                                                              | ^[object]`CSSProperties`          | —      |
| body-class  | body 的自定义类名                                                                             | ^[string]                         | —      |
| shadow      | 卡片阴影显示时机                                                                              | ^[enum]`always \| never \| hover` | always |
| interactive | 可交互式卡片                                                                                  | Boolean                           | false  |

### Slots

| 插槽名  | 说明           |
| ------- | -------------- |
| default | 自定义默认内容 |
| header  | 卡片标题内容   |
| footer  | 卡片页脚内容   |

---

## Carousel 走马灯

在有限空间内，循环播放同一类型的图片、文字等内容

### 示例

:::demo 结合使用 `w-carousel` 和 `w-carousel-item` 标签就得到了一个走马灯。 每一个页面的内容是完全可定制的，把你想要展示的内容放在 `w-carousel-item` 标签内。 默认情况下，在鼠标 hover 底部的指示器时就会触发切换。 通过设置 `trigger` 属性为 `click`，可以达到点击触发的效果。

```vue
<template>
  <div class="block text-center">
    <span class="demonstration">
      Switch when indicator is hovered (default)
    </span>
    <w-carousel height="150px">
      <w-carousel-item v-for="item in 4" :key="item">
        <h3 class="small justify-center" text="2xl">{{ item }}</h3>
      </w-carousel-item>
    </w-carousel>
  </div>
  <div class="block text-center" m="t-4">
    <span class="demonstration">Switch when indicator is clicked</span>
    <w-carousel trigger="click" height="150px">
      <w-carousel-item v-for="item in 4" :key="item">
        <h3 class="small justify-center" text="2xl">{{ item }}</h3>
      </w-carousel-item>
    </w-carousel>
  </div>
</template>

<style scoped>
.demonstration {
  color: var(--w3-font-color-second);
}

.w3-carousel__item h3 {
  color: #475669;
  opacity: 0.75;
  line-height: 150px;
  margin: 0;
  text-align: center;
}

.w3-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.w3-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}
</style>
```

:::

:::demo 启用动态模糊增强了走马灯的活力和流畅性。 `motion-blur` 的默认值是 `false`，手动激活此功能即可提供视觉感受上的提升。

```vue
<template>
  <div class="block text-center">
    <span class="demonstration">Motion blur the switch (default)</span>
    <w-carousel height="200px" motion-blur>
      <w-carousel-item v-for="item in 4" :key="item">
        <h3 class="small justify-center" text="2xl">{{ item }}</h3>
      </w-carousel-item>
    </w-carousel>
  </div>
  <p class="text-center demonstration">Vertical effect</p>
  <w-carousel height="200px" direction="vertical" motion-blur :autoplay="false">
    <w-carousel-item v-for="item in 4" :key="item">
      <h3 text="2xl" justify="center">{{ item }}</h3>
    </w-carousel-item>
  </w-carousel>
</template>

<style scoped>
.demonstration {
  color: var(--w3-font-color-third);
}

.w3-carousel__item h3 {
  color: #475669;
  opacity: 0.75;
  line-height: 200px;
  margin: 0;
  text-align: center;
}

.w3-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.w3-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}
</style>
```

:::

:::demo `indicator-position` 属性定义了指示器的位置。 默认情况下，它会显示在走马灯内部，设置为 `outside` 则会显示在外部；设置为 `none` 则不会显示指示器。

```vue
<template>
  <w-carousel indicator-position="outside">
    <w-carousel-item v-for="item in 4" :key="item">
      <h3 text="2xl" justify="center">{{ item }}</h3>
    </w-carousel-item>
  </w-carousel>
</template>

<style scoped>
.w3-carousel__item h3 {
  display: flex;
  color: #475669;
  opacity: 0.75;
  line-height: 300px;
  margin: 0;
}

.w3-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.w3-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}
</style>
```

:::

:::demo `arrow` 属性定义了切换箭头的显示时机。 默认情况下，切换箭头只有在鼠标 hover 到走马灯上时才会显示。 若将 `arrow` 设置为 `always`，则会一直显示；设置为 `never`，则会一直隐藏。

```vue
<template>
  <w-carousel :interval="5000" arrow="always">
    <w-carousel-item v-for="item in 4" :key="item">
      <h3 text="2xl" justify="center">{{ item }}</h3>
    </w-carousel-item>
  </w-carousel>
</template>

<style scoped>
.w3-carousel__item h3 {
  color: #475669;
  opacity: 0.75;
  line-height: 300px;
  margin: 0;
  text-align: center;
}

.w3-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.w3-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="block text-center" style="height: 300px">
    <span class="demonstration">each carousel-item has a different height</span>
    <w-carousel height="auto" autoplay>
      <w-carousel-item style="height: 100px">
        <h3 class="small justify-center" text="2xl">height 100px</h3>
      </w-carousel-item>
      <w-carousel-item style="height: 200px">
        <h3 class="small justify-center" text="2xl">height 200px</h3>
      </w-carousel-item>
      <w-carousel-item style="height: 300px">
        <h3 class="small justify-center" text="2xl">height 300px</h3>
      </w-carousel-item>
    </w-carousel>
  </div>
</template>

<style scoped>
.carousel-item {
  color: #475669;
  opacity: 0.75;
  margin: 0;
  text-align: center;
}

.w3-carousel__item h3 {
  color: #475669;
  opacity: 0.75;
  display: flex;
  align-items: center;
  margin: 0;
  text-align: center;
  height: 100%;
}

.w3-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.w3-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}
</style>
```

:::

:::demo 将 `type` 属性设置为 `card` 即可启用卡片模式。 从交互上来说，卡片模式和一般模式的最大区别在于，卡片模式可以通过直接点击两侧的幻灯片进行切换。

```vue
<template>
  <w-carousel :interval="4000" type="card" height="200px">
    <w-carousel-item v-for="item in 6" :key="item">
      <h3 text="2xl" justify="center">{{ item }}</h3>
    </w-carousel-item>
  </w-carousel>
</template>

<style scoped>
.w3-carousel__item h3 {
  color: #475669;
  opacity: 0.75;
  line-height: 200px;
  margin: 0;
  text-align: center;
}

.w3-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.w3-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}
</style>
```

:::

:::demo

```vue
<template>
  <p class="text-center demonstration">normal vertical layout</p>
  <w-carousel height="200px" direction="vertical" :autoplay="false">
    <w-carousel-item v-for="item in 4" :key="item">
      <h3 text="2xl" justify="center">{{ item }}</h3>
    </w-carousel-item>
  </w-carousel>
  <p class="text-center demonstration">card vertical layout</p>
  <w-carousel height="400px" direction="vertical" type="card" :autoplay="false">
    <w-carousel-item v-for="item in 4" :key="item">
      <h3 text="2xl" justify="center">{{ item }}</h3>
    </w-carousel-item>
  </w-carousel>
</template>

<style scoped>
.w3-carousel__item h3 {
  color: #475669;
  opacity: 0.75;
  line-height: 200px;
  margin: 0;
  text-align: center;
}

.w3-carousel__item:nth-child(2n) {
  background-color: #99a9bf;
}

.w3-carousel__item:nth-child(2n + 1) {
  background-color: #d3dce6;
}
</style>
```

:::

### API 文档

### Attributes

| 属性名             | 说明                                     | 类型                                    | Default    |
| ------------------ | ---------------------------------------- | --------------------------------------- | ---------- |
| height             | carousel 的高度                          | ^[string]                               | ''         |
| initial-index      | 初始状态激活的幻灯片的索引，从 0 开始    | ^[number]                               | 0          |
| trigger            | 指示器的触发方式                         | ^[enum]`'hover' \| 'click'`             | hover      |
| autoplay           | 是否自动切换                             | ^[boolean]                              | true       |
| interval           | 自动切换的时间间隔，单位为毫秒           | ^[number]                               | 3000       |
| indicator-position | 指示器的位置                             | ^[enum]`'' \| 'none' \| 'outside'`      | ''         |
| arrow              | 切换箭头的显示时机                       | ^[enum]`'always' \| 'hover' \| 'never'` | hover      |
| type               | carousel 的类型                          | ^[enum]`'' \| 'card'`                   | ''         |
| cardScale          | 当 type 为 card 时，二级卡的缩放大小     | ^[number]                               | 0.83       |
| loop               | 是否循环显示                             | ^[boolean]                              | true       |
| direction          | 展示的方向                               | ^[enum]`'horizontal' \| 'vertical'`     | horizontal |
| pause-on-hover     | 鼠标悬浮时暂停自动切换                   | ^[boolean]                              | true       |
| motion-blur        | 添加动态模糊以给走马灯注入活力和流畅性。 | ^[boolean]                              | false      |

### Events

| 事件名 | 说明                                                                                    | 类型                                                    |
| ------ | --------------------------------------------------------------------------------------- | ------------------------------------------------------- |
| change | 当前展示的幻灯片切换时触发，它有两个参数， 一个是新幻灯片的索引，另一个是旧幻灯片的索引 | ^[Function]`(current: number, prev: number) => boolean` |

### Slots

| 插槽名  | 说明           | 子标签        |
| ------- | -------------- | ------------- |
| default | 自定义默认内容 | Carousel-Item |

### Exposes

| 方法名        | 说明                                                                                             | 类型                                           |
| ------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| activeIndex   | 当前幻灯片的索引                                                                                 | ^[number]                                      |
| setActiveItem | 手动切换幻灯片，传入需要切换的幻灯片的索引，从 0 开始；或相应 `w-carousel-item` 的 `name` 属性值 | ^[Function]`(index: string \| number) => void` |
| prev          | 切换至上一张幻灯片                                                                               | ^[Function]`() => void`                        |
| next          | 切换至下一张幻灯片                                                                               | ^[Function]`() => void`                        |

## Carousel-Item API

### Attributes

| 属性名 | 说明                                        | 类型                  | 默认值 |
| ------ | ------------------------------------------- | --------------------- | ------ |
| name   | 幻灯片的名字，可用作 `setActiveItem` 的参数 | ^[string]             | ''     |
| label  | 该幻灯片所对应指示器的文本                  | ^[string] / ^[number] | ''     |

### Slots

| 插槽名  | 说明           |
| ------- | -------------- |
| default | 自定义默认内容 |

---

## Collapse 折叠面板

通过折叠面板收纳内容区域

### 示例

:::demo

```vue
<template>
  <div class="demo-collapse">
    <w-radio-group v-model="size" aria-label="size control">
      <w-radio-button value="large">large</w-radio-button>
      <w-radio-button value="default">default</w-radio-button>
      <w-radio-button value="small">small</w-radio-button>
    </w-radio-group>
    <w-checkbox-group v-model="style" style="margin: 16px 0">
      <w-checkbox :value="1">简洁风格</w-checkbox>
      <w-checkbox :value="2">描边</w-checkbox>
      <w-checkbox :value="3">圆角</w-checkbox>
    </w-checkbox-group>
    <w-collapse
      v-model="activeNames"
      :size="size"
      :plain="style.includes(1)"
      :border="style.includes(2)"
      :round="style.includes(3)"
      @change="handleChange"
    >
      <w-collapse-item title="主次分明" name="1">
        <div>合理区分信息，快速抓住用户眼球</div>
        <div>合理排布信息的优先级，突出主要信息，弱化次要信息</div>
      </w-collapse-item>
      <w-collapse-item disabled title="突出重点" name="2">
        <div>合理区分信息，快速抓住用户眼球</div>
        <div>合理排布信息的优先级，突出主要信息，弱化次要信息</div>
      </w-collapse-item>
      <w-collapse-item title="化繁为简" name="3">
        <div>合理区分信息，快速抓住用户眼球</div>
        <div>
          依据相似属性，划分同类信息，将繁杂的信息精简到几个分类，减少数量
        </div>
      </w-collapse-item>
      <w-collapse-item title="步步为营" name="4">
        <div>合理区分信息，快速抓住用户眼球</div>
        <div>对于有明确节点的任务，拆解步骤，一步一步进行，有条不紊</div>
      </w-collapse-item>
    </w-collapse>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { CollapseModelValue } from 'win-design-next'

const activeNames = ref(['1'])
const style = ref([2, 3])
const size = ref<'default' | 'large' | 'small'>('default')
const handleChange = (val: CollapseModelValue) => {
  console.log(val)
}
</script>
```

:::

:::demo 通过 `accordion` 属性来设置是否以手风琴模式显示。

```vue
<template>
  <div class="demo-collapse">
    <w-collapse v-model="activeName" accordion>
      <w-collapse-item title="Consistency" name="1">
        <div>
          Consistent with real life: in line with the process and logic of real
          life, and comply with languages and habits that the users are used to;
        </div>
        <div>
          Consistent within interface: all elements should be consistent, such
          as: design style, icons and texts, position of elements, etc.
        </div>
      </w-collapse-item>
      <w-collapse-item title="Feedback" name="2">
        <div>
          Operation feedback: enable the users to clearly perceive their
          operations by style updates and interactive effects;
        </div>
        <div>
          Visual feedback: reflect current state by updating or rearranging
          elements of the page.
        </div>
      </w-collapse-item>
      <w-collapse-item title="Efficiency" name="3">
        <div>
          Simplify the process: keep operating process simple and intuitive;
        </div>
        <div>
          Definite and clear: enunciate your intentions clearly so that the
          users can quickly understand and make decisions;
        </div>
        <div>
          Easy to identify: the interface should be straightforward, which helps
          the users to identify and frees them from memorizing and recalling.
        </div>
      </w-collapse-item>
      <w-collapse-item title="Controllability" name="4">
        <div>
          Decision making: giving advices about operations is acceptable, but do
          not make decisions for the users;
        </div>
        <div>
          Controlled consequences: users should be granted the freedom to
          operate, including canceling, aborting or terminating current
          operation.
        </div>
      </w-collapse-item>
    </w-collapse>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const activeName = ref('1')
</script>
```

:::

:::demo

```vue
<template>
  <div class="demo-collapse">
    <w-collapse accordion>
      <w-collapse-item name="1">
        <template #title>
          Consistency<w-icon class="header-icon">
            <circle-info-filled />
          </w-icon>
        </template>
        <div>
          Consistent with real life: in line with the process and logic of real
          life, and comply with languages and habits that the users are used to;
        </div>
        <div>
          Consistent within interface: all elements should be consistent, such
          as: design style, icons and texts, position of elements, etc.
        </div>
      </w-collapse-item>
      <w-collapse-item title="Feedback" name="2">
        <div>
          Operation feedback: enable the users to clearly perceive their
          operations by style updates and interactive effects;
        </div>
        <div>
          Visual feedback: reflect current state by updating or rearranging
          elements of the page.
        </div>
      </w-collapse-item>
      <w-collapse-item title="Efficiency" name="3">
        <div>
          Simplify the process: keep operating process simple and intuitive;
        </div>
        <div>
          Definite and clear: enunciate your intentions clearly so that the
          users can quickly understand and make decisions;
        </div>
        <div>
          Easy to identify: the interface should be straightforward, which helps
          the users to identify and frees them from memorizing and recalling.
        </div>
      </w-collapse-item>
      <w-collapse-item title="Controllability" name="4">
        <div>
          Decision making: giving advices about operations is acceptable, but do
          not make decisions for the users;
        </div>
        <div>
          Controlled consequences: users should be granted the freedom to
          operate, including canceling, aborting or terminating current
          operation.
        </div>
      </w-collapse-item>
    </w-collapse>
  </div>
</template>

<script setup lang="ts">
import { CircleInfoFilled } from '@win-design-next/icons-vue'
</script>
```

:::

:::demo

```vue
<template>
  <div class="demo-collapse">
    <w-collapse v-model="activeNames" @change="handleChange">
      <w-collapse-item title="Consistency" name="1" :icon="CaretRight">
        <div>
          Consistent with real life: in line with the process and logic of real
          life, and comply with languages and habits that the users are used to;
        </div>
        <div>
          Consistent within interface: all elements should be consistent, such
          as: design style, icons and texts, position of elements, etc.
        </div>
      </w-collapse-item>
      <w-collapse-item title="Feedback" name="2">
        <template #icon="{ isActive }">
          <span class="icon-ele">
            {{ isActive ? 'Expanded' : 'Collapsed' }}
          </span>
        </template>
        <div>
          Operation feedback: enable the users to clearly perceive their
          operations by style updates and interactive effects;
        </div>
        <div>
          Visual feedback: reflect current state by updating or rearranging
          elements of the page.
        </div>
      </w-collapse-item>
      <w-collapse-item title="Efficiency" name="3">
        <div>
          Simplify the process: keep operating process simple and intuitive;
        </div>
        <div>
          Definite and clear: enunciate your intentions clearly so that the
          users can quickly understand and make decisions;
        </div>
        <div>
          Easy to identify: the interface should be straightforward, which helps
          the users to identify and frees them from memorizing and recalling.
        </div>
      </w-collapse-item>
      <w-collapse-item title="Controllability" name="4">
        <div>
          Decision making: giving advices about operations is acceptable, but do
          not make decisions for the users;
        </div>
        <div>
          Controlled consequences: users should be granted the freedom to
          operate, including canceling, aborting or terminating current
          operation.
        </div>
      </w-collapse-item>
    </w-collapse>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { CaretRight } from '@win-design-next/icons-vue'
import type { CollapseModelValue } from 'win-design-next'

const activeNames = ref(['1'])
const handleChange = (val: CollapseModelValue) => {
  console.log(val)
}
</script>

<style scoped>
.icon-ele {
  margin: 0 8px 0 auto;
  color: #2d5afa;
}
</style>
```

:::

### API 文档

### Attributes

| 属性名                | 详情                                                                | 类型                 | 默认值 |
| --------------------- | ------------------------------------------------------------------- | -------------------- | ------ |
| model-value / v-model | 当前活动面板，在手风琴模式下其类型是`string`，在其他模式下是`array` | ^[string] / ^[array] | []     |
| accordion             | 是否手风琴模式                                                      | ^[boolean]           | false  |

### Events

| 事件名 | 说明                                                                    | 类型                                                |
| ------ | ----------------------------------------------------------------------- | --------------------------------------------------- |
| change | 切换当前活动面板，在手风琴模式下其类型是`string`，在其他模式下是`array` | ^[Function]`(activeNames: array \| string) => void` |

### Slots

| 插槽名  | Description    | 子标签        |
| ------- | -------------- | ------------- |
| default | 自定义默认内容 | Collapse Item |

## Collapse Item API

### Attributes

| 属性名   | 说明           | 类型                     | 默认值     |
| -------- | -------------- | ------------------------ | ---------- |
| name     | 唯一标志符     | ^[string] / ^[number]    | —          |
| title    | 面板标题       | ^[string]                | ''         |
| icon     | 折叠项目的图标 | ^[string] / ^[Component] | ArrowRight |
| disabled | 是否禁用       | ^[boolean]               | false      |

### Slot

| 插槽名  | 说明                 | Type                             |
| ------- | -------------------- | -------------------------------- |
| default | Collapse Item 的内容 | —                                |
| title   | Collapse Item 的标题 | —                                |
| icon    | 折叠项目图标的内容   | ^[object]`{ isActive: boolean }` |

---

## Descriptions 描述列表

列表形式展示多个字段。

### 示例

:::demo

```vue
<template>
  <w-switch
    v-model="border"
    class="mb-4"
    active-text="带边框"
    inactive-text="默认"
  />
  <w-descriptions :border="border">
    <w-descriptions-item label="姓名">张三</w-descriptions-item>
    <w-descriptions-item label="性别">男</w-descriptions-item>
    <w-descriptions-item label="手机号">13810241988</w-descriptions-item>
    <w-descriptions-item label="个人档案号"> 202207180236 </w-descriptions-item>
    <w-descriptions-item label="医保类型">本地医保</w-descriptions-item>
    <w-descriptions-item label="建档医生"> 王五 </w-descriptions-item>
    <w-descriptions-item label="家庭住址"
      >安徽省合肥市蜀山区某某社区某某花园234号</w-descriptions-item
    >
  </w-descriptions>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const border = ref(true)
</script>
```

:::

:::demo

```vue
<template>
  <w-radio-group v-model="size">
    <w-radio value="large">Large</w-radio>
    <w-radio value="default">Default</w-radio>
    <w-radio value="small">Small</w-radio>
    <w-radio value="mini">Mini</w-radio>
  </w-radio-group>

  <w-descriptions
    class="margin-top"
    title="With border"
    :column="3"
    :size="size"
  >
    <template #extra>
      <w-button type="primary">操作</w-button>
    </template>
    <w-descriptions-item>
      <template #label>
        <div class="cell-item">
          <w-icon :style="iconStyle">
            <user />
          </w-icon>
          Username
        </div>
      </template>
      kooriookami
    </w-descriptions-item>
    <w-descriptions-item>
      <template #label>
        <div class="cell-item">
          <w-icon :style="iconStyle">
            <Mobile />
          </w-icon>
          Telephone
        </div>
      </template>
      18100000000
    </w-descriptions-item>
    <w-descriptions-item>
      <template #label>
        <div class="cell-item">
          <w-icon :style="iconStyle">
            <location />
          </w-icon>
          Place
        </div>
      </template>
      Suzhou
    </w-descriptions-item>
    <w-descriptions-item>
      <template #label>
        <div class="cell-item">
          <w-icon :style="iconStyle">
            <bell />
          </w-icon>
          Remarks
        </div>
      </template>
      <w-tag size="small">School</w-tag>
    </w-descriptions-item>
    <w-descriptions-item>
      <template #label>
        <div class="cell-item">
          <w-icon :style="iconStyle">
            <Computer />
          </w-icon>
          Address
        </div>
      </template>
      No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province
    </w-descriptions-item>
  </w-descriptions>

  <w-descriptions
    class="margin-top"
    title="Without border"
    :column="3"
    :border="false"
    :size="size"
    :style="blockMargin"
  >
    <template #extra>
      <w-button type="primary">操作</w-button>
    </template>
    <w-descriptions-item label="Username">kooriookami</w-descriptions-item>
    <w-descriptions-item label="Telephone">18100000000</w-descriptions-item>
    <w-descriptions-item label="Place">Suzhou</w-descriptions-item>
    <w-descriptions-item label="Remarks">
      <w-tag size="small">School</w-tag>
    </w-descriptions-item>
    <w-descriptions-item label="Address">
      No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province
    </w-descriptions-item>
  </w-descriptions>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import {
  Bell,
  Computer,
  Location,
  Mobile,
  User,
} from '@win-design-next/icons-vue'

import type { ComponentSize } from 'win-design-next'

const size = ref<ComponentSize>('default')

const iconStyle = computed(() => {
  const marginMap = {
    large: '8px',
    default: '6px',
    small: '4px',
  }
  return {
    marginRight: marginMap[size.value] || marginMap.default,
  }
})
const blockMargin = computed(() => {
  const marginMap = {
    large: '32px',
    default: '28px',
    small: '24px',
  }
  return {
    marginTop: marginMap[size.value] || marginMap.default,
  }
})
</script>

<style scoped>
.w3-descriptions {
  margin-top: 20px;
}
.cell-item {
  display: flex;
  align-items: center;
}
.margin-top {
  margin-top: 20px;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-radio-group v-model="size">
    <w-radio value="large">Large</w-radio>
    <w-radio value="default">Default</w-radio>
    <w-radio value="small">Small</w-radio>
    <w-radio value="mini">Mini</w-radio>
  </w-radio-group>

  <w-descriptions
    title="Vertical list with border"
    direction="vertical"
    :column="4"
    :size="size"
    border
  >
    <w-descriptions-item label="Username">kooriookami</w-descriptions-item>
    <w-descriptions-item label="Telephone">18100000000</w-descriptions-item>
    <w-descriptions-item label="Place" :span="2">Suzhou</w-descriptions-item>
    <w-descriptions-item label="Remarks">
      <w-tag size="small">School</w-tag>
    </w-descriptions-item>
    <w-descriptions-item label="Address">
      No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province
    </w-descriptions-item>
  </w-descriptions>

  <w-descriptions
    title="Vertical list without border"
    :column="4"
    :size="size"
    direction="vertical"
    :style="blockMargin"
  >
    <w-descriptions-item label="Username">kooriookami</w-descriptions-item>
    <w-descriptions-item label="Telephone">18100000000</w-descriptions-item>
    <w-descriptions-item label="Place" :span="2">Suzhou</w-descriptions-item>
    <w-descriptions-item label="Remarks">
      <w-tag size="small">School</w-tag>
    </w-descriptions-item>
    <w-descriptions-item label="Address">
      No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province
    </w-descriptions-item>
  </w-descriptions>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'

import type { ComponentSize } from 'win-design-next'

const size = ref<ComponentSize>('default')

const blockMargin = computed(() => {
  const marginMap = {
    large: '32px',
    default: '28px',
    small: '24px',
  }
  return {
    marginTop: marginMap[size.value] || marginMap.default,
  }
})
</script>

<style scoped>
.w3-descriptions {
  margin-top: 20px;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-descriptions title="Width horizontal list" border>
    <w-descriptions-item :rowspan="2" :width="140" label="Photo" align="center">
      <w-image
        style="width: 100px; height: 100px"
        src="https://cdn.dribbble.com/userupload/9645535/file/original-b7756b0958f420bef5cbf243c947f149.png?resize=752x"
      />
    </w-descriptions-item>
    <w-descriptions-item label="Username">kooriookami</w-descriptions-item>
    <w-descriptions-item label="Telephone">18100000000</w-descriptions-item>
    <w-descriptions-item label="Place">Suzhou</w-descriptions-item>
    <w-descriptions-item label="Remarks">
      <w-tag size="small">School</w-tag>
    </w-descriptions-item>
    <w-descriptions-item label="Address">
      No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province
    </w-descriptions-item>
  </w-descriptions>

  <w-descriptions
    title="Width vertical list"
    direction="vertical"
    border
    style="margin-top: 20px"
  >
    <w-descriptions-item :rowspan="2" :width="140" label="Photo" align="center">
      <w-image
        style="width: 100px; height: 100px"
        src="https://cdn.dribbble.com/userupload/9645535/file/original-b7756b0958f420bef5cbf243c947f149.png?resize=752x"
      />
    </w-descriptions-item>
    <w-descriptions-item label="Username">kooriookami</w-descriptions-item>
    <w-descriptions-item label="Telephone">18100000000</w-descriptions-item>
    <w-descriptions-item label="Place">Suzhou</w-descriptions-item>
    <w-descriptions-item label="Remarks">
      <w-tag size="small">School</w-tag>
    </w-descriptions-item>
    <w-descriptions-item label="Address">
      No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province
    </w-descriptions-item>
  </w-descriptions>
</template>
```

:::

:::demo

```vue
<template>
  <w-descriptions title="Customized style list" :column="3" border>
    <w-descriptions-item
      label="Username"
      label-align="right"
      align="center"
      label-class-name="my-label"
      class-name="my-content"
      width="150px"
    >
      kooriookami
    </w-descriptions-item>
    <w-descriptions-item label="Telephone" label-align="right" align="center">
      18100000000
    </w-descriptions-item>
    <w-descriptions-item label="Place" label-align="right" align="center">
      Suzhou
    </w-descriptions-item>
    <w-descriptions-item label="Remarks" label-align="right" align="center">
      <w-tag size="small">School</w-tag>
    </w-descriptions-item>
    <w-descriptions-item label="Address" label-align="right" align="center">
      No.1188, Wuzhong Avenue, Wuzhong District, Suzhou, Jiangsu Province
    </w-descriptions-item>
  </w-descriptions>
</template>

<style scoped>
:deep(.my-label) {
  background: var(--w3-color-success-plain) !important;
}
:deep(.my-content) {
  background: var(--w3-color-danger-plain);
}
</style>
```

:::

### API 文档

### Attributes

| 属性名      | 说明                            | 类型                                           | 默认       |
| ----------- | ------------------------------- | ---------------------------------------------- | ---------- |
| border      | 是否带有边框                    | ^[boolean]                                     | true       |
| column      | 一行 `Descriptions Item` 的数量 | ^[number]                                      | 3          |
| direction   | 排列的方向                      | ^[enum]`'vertical' \| 'horizontal'`            | horizontal |
| size        | 列表的尺寸                      | ^[enum]`'' \| 'large' \| 'default' \| 'small'` | —          |
| title       | 标题文本，显示在左上方          | ^[string]                                      | ''         |
| extra       | 操作区文本，显示在右上方        | ^[string]                                      | ''         |
| label-width | 每一列的标签宽度                | ^[string] / ^[number]                          | ''         |

### Slots

| 插槽名  | 说明                       | 子标签            |
| ------- | -------------------------- | ----------------- |
| default | 自定义默认内容             | Descriptions Item |
| title   | 自定义标题，显示在左上方   | —                 |
| extra   | 自定义操作区，显示在右上方 | —                 |

## DescriptionsItem API

### Attributes

| 属性名           | 说明                                                                                                                                                 | 类型                                   | 默认 |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- | ---- |
| label            | 标签文本                                                                                                                                             | ^[string]                              | ''   |
| span             | 列的数量                                                                                                                                             | ^[number]                              | 1    |
| rowspan          | 单元格应该跨越的行数                                                                                                                                 | ^[number]                              | 1    |
| width            | 列的宽度，不同行相同列的宽度按最大值设定（如无 `border` ，宽度包含标签与内容）                                                                       | ^[string] / ^[number]                  | ''   |
| min-width        | 列的最小宽度，与 `width` 的区别是 `width` 是固定的，`min-width` 会把剩余宽度按比例分配给设置了 `min-width` 的列（如无 `border`，宽度包含标签与内容） | ^[string] / ^[number]                  | ''   |
| label-width      | 列标签宽，如果未设置，它将与列宽度相同。 比 `Descriptions` 的 `label-width` 优先级高                                                                 | ^[string] / ^[number]                  | ''   |
| align            | 列的内容对齐方式（如无 `border`，对标签和内容均生效）                                                                                                | ^[enum]`'left' \| 'center' \| 'right'` | left |
| label-align      | 列的标签对齐方式，若不设置该项，则使用内容的对齐方式（如无 `border`，请使用 `align` 参数）                                                           | ^[enum]`'left' \| 'center' \| 'right'` | ''   |
| class-name       | 列的内容自定义类名                                                                                                                                   | ^[string]                              | ''   |
| label-class-name | column label custom class name                                                                                                                       | ^[string]                              | ''   |

### Slots

| 插槽名  | 说明           |
| ------- | -------------- |
| default | 自定义默认内容 |
| label   | 自定义标签     |

---

## Image 图片

图片容器，在保留所有原生 img 的特性下，支持懒加载，自定义占位、加载失败等

### 示例

:::demo 可通过`fit`确定图片如何适应到容器框，同原生 [object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit)。

```vue
<template>
  <div class="demo-image">
    <div v-for="fit in fits" :key="fit" class="block">
      <span class="demonstration">{{ fit }}</span>
      <w-image style="width: 100px; height: 100px" :src="url" :fit="fit" />
    </div>
  </div>
</template>

<script lang="ts" setup>
import type { ImageProps } from 'win-design-next'

const fits = [
  'fill',
  'contain',
  'cover',
  'none',
  'scale-down',
] as ImageProps['fit'][]
const url =
  'https://cdn.dribbble.com/users/175710/screenshots/4982767/media/a874e5b7dbbe8bcc649024022fcf908a.png?resize=800x600&vertical=center'
</script>

<style scoped>
.demo-image .block {
  padding: 30px 0;
  text-align: center;
  border-right: solid 1px var(--w3-border-color);
  display: inline-block;
  width: 20%;
  box-sizing: border-box;
  vertical-align: top;
}
.demo-image .block:last-child {
  border-right: none;
}
.demo-image .demonstration {
  display: block;
  color: var(--w3-font-color-third);
  font-size: 14px;
  margin-bottom: 20px;
}
</style>
```

:::

:::demo 可通过`slot = placeholder`可自定义占位内容

```vue
<template>
  <div class="demo-image__placeholder">
    <div class="block">
      <span class="demonstration">Default</span>
      <w-image :src="src" />
    </div>
    <div class="block">
      <span class="demonstration">Custom</span>
      <w-image :src="src">
        <template #placeholder>
          <div class="image-slot">Loading<span class="dot">...</span></div>
        </template>
      </w-image>
    </div>
  </div>
</template>

<script lang="ts" setup>
const src =
  'https://cdn.dribbble.com/users/175710/screenshots/4982767/media/a874e5b7dbbe8bcc649024022fcf908a.png?resize=800x600&vertical=center'
</script>

<style scoped>
.demo-image__placeholder .block {
  padding: 30px 0;
  text-align: center;
  border-right: solid 1px var(--w3-border-color);
  display: inline-block;
  width: 49%;
  box-sizing: border-box;
  vertical-align: top;
}
.demo-image__placeholder .demonstration {
  display: block;
  color: var(--w3-font-color-third);
  font-size: 14px;
  margin-bottom: 20px;
}
.demo-image__placeholder .w3-image {
  padding: 0 5px;
  max-width: 300px;
  max-height: 200px;
}

.demo-image__placeholder.image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--w3-fill-color-light);
  color: var(--w3-font-color-third);
  font-size: 14px;
}
.demo-image__placeholder .dot {
  animation: dot 2s infinite steps(3, start);
  overflow: hidden;
}
</style>
```

:::

:::demo 可通过`slot = error`可自定义加载失败内容

```vue
<template>
  <div class="demo-image__error">
    <div class="block">
      <span class="demonstration">Default</span>
      <w-image />
    </div>
    <div class="block">
      <span class="demonstration">Custom</span>
      <w-image>
        <template #error>
          <div class="image-slot">
            <w-icon><icon-picture /></w-icon>
          </div>
        </template>
      </w-image>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Picture as IconPicture } from '@win-design-next/icons-vue'
</script>

<style scoped>
.demo-image__error .block {
  padding: 30px 0;
  text-align: center;
  border-right: solid 1px var(--w3-border-color);
  display: inline-block;
  width: 49%;
  box-sizing: border-box;
  vertical-align: top;
}
.demo-image__error .demonstration {
  display: block;
  color: var(--w3-font-color-third);
  font-size: 14px;
  margin-bottom: 20px;
}
.demo-image__error .w3-image {
  padding: 0 5px;
  max-width: 300px;
  max-height: 200px;
  width: 100%;
  height: 200px;
}

.demo-image__error .image-slot {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  background: var(--w3-fill-color-light);
  color: var(--w3-font-color-third);
  font-size: 30px;
}
.demo-image__error .image-slot .w3-icon {
  font-size: 30px;
}
</style>
```

:::

:::demo 可通过`lazy`开启懒加载功能， 当图片滚动到可视范围内才会加载。 可通过 `scroll-container` 来设置滚动容器， 若未定义，则为最近一个 overflow 值为 auto 或 scroll 的父元素。

```vue
<template>
  <div class="demo-image__lazy">
    <w-image v-for="url in urls" :key="url" :src="url" lazy />
  </div>
</template>

<script lang="ts" setup>
const urls = [
  'https://cdn.dribbble.com/userupload/9645535/file/original-b7756b0958f420bef5cbf243c947f149.png?resize=752x',
  'https://cdn.dribbble.com/users/175710/screenshots/4807690/media/0c1bfcc19f082b3afc05a6030d6db9d3.png?resize=800x600&vertical=center',
  'https://cdn.dribbble.com/users/175710/screenshots/4982767/media/a874e5b7dbbe8bcc649024022fcf908a.png?resize=800x600&vertical=center',
  'https://cdn.dribbble.com/userupload/9565924/file/original-e46d967fa4c7c5abb6c6f9454db5f165.png?resize=752x',
  'https://cdn.dribbble.com/users/264162/screenshots/16734417/media/282a4351c33576bb1d47b05b59e24a52.png',
]
</script>

<style scoped>
.demo-image__lazy {
  height: 400px;
  overflow-y: auto;
}
.demo-image__lazy .w3-image {
  display: block;
  min-height: 200px;
  margin-bottom: 10px;
}
.demo-image__lazy .w3-image:last-child {
  margin-bottom: 0;
}
</style>
```

:::

:::demo 可通过 `previewSrcList` 开启预览大图的功能。 你可以通过 `initial-index` 初始化第一张预览图片的位置。 默认初始位置为 0。

```vue
<template>
  <div class="demo-image__preview">
    <w-image
      style="width: 100px; height: 100px"
      :src="url"
      :zoom-rate="1.2"
      :max-scale="7"
      :min-scale="0.2"
      :preview-src-list="srcList"
      show-progress
      :initial-index="4"
      fit="cover"
    />
  </div>
</template>

<script lang="ts" setup>
const url =
  'https://cdn.dribbble.com/userupload/9645535/file/original-b7756b0958f420bef5cbf243c947f149.png?resize=752x'
const srcList = [
  'https://cdn.dribbble.com/userupload/9645535/file/original-b7756b0958f420bef5cbf243c947f149.png?resize=752x',
  'https://cdn.dribbble.com/users/175710/screenshots/4807690/media/0c1bfcc19f082b3afc05a6030d6db9d3.png?resize=800x600&vertical=center',
  'https://cdn.dribbble.com/users/175710/screenshots/4982767/media/a874e5b7dbbe8bcc649024022fcf908a.png?resize=800x600&vertical=center',
  'https://cdn.dribbble.com/userupload/9565924/file/original-e46d967fa4c7c5abb6c6f9454db5f165.png?resize=752x',
  'https://cdn.dribbble.com/users/264162/screenshots/16734417/media/282a4351c33576bb1d47b05b59e24a52.png',
]
</script>

<style scoped>
.demo-image__error .image-slot {
  font-size: 30px;
}
.demo-image__error .image-slot .w3-icon {
  font-size: 30px;
}
.demo-image__error .w3-image {
  width: 100%;
  height: 200px;
}
</style>
```

:::

:::demo 允许通过调用 `showPreview` 来触发大图预览。

```vue
<template>
  <div class="demo-image__manually-preview">
    <w-button @click="handleClick">show image preview</w-button>
    <w-image
      ref="imageRef"
      style="width: 100px; height: 100px"
      :src="url"
      :preview-src-list="srcList"
      fit="cover"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

import type { ImageInstance } from 'win-design-next'

const url =
  'https://cdn.dribbble.com/userupload/9645535/file/original-b7756b0958f420bef5cbf243c947f149.png?resize=752x'
const srcList = [
  'https://cdn.dribbble.com/userupload/9645535/file/original-b7756b0958f420bef5cbf243c947f149.png?resize=752x',
  'https://cdn.dribbble.com/users/175710/screenshots/4807690/media/0c1bfcc19f082b3afc05a6030d6db9d3.png?resize=800x600&vertical=center',
  'https://cdn.dribbble.com/users/175710/screenshots/4982767/media/a874e5b7dbbe8bcc649024022fcf908a.png?resize=800x600&vertical=center',
  'https://cdn.dribbble.com/userupload/9565924/file/original-e46d967fa4c7c5abb6c6f9454db5f165.png?resize=752x',
  'https://cdn.dribbble.com/users/264162/screenshots/16734417/media/282a4351c33576bb1d47b05b59e24a52.png',
]

const imageRef = ref<ImageInstance>()
const handleClick = () => {
  imageRef.value!.showPreview()
}
</script>

<style scoped>
.demo-image__manually-preview {
  display: grid;
  gap: 10px;
}
.demo-image__manually-preview .w3-button {
  width: fit-content;
}
</style>
```

:::

:::demo 通过 `slot = toolbar` 自定义工具栏内容

```vue
<template>
  <div class="demo-image__custom-toolbar">
    <w-image
      style="width: 100px; height: 100px"
      :src="url"
      :preview-src-list="srcList"
      fit="cover"
    >
      <template #toolbar="{ actions, prev, next, reset, activeIndex }">
        <w-icon @click="prev"><DArrowLeft /></w-icon>
        <w-icon @click="next"><DArrowRight /></w-icon>
        <w-icon @click="actions('zoomOut')"><ZoomOut /></w-icon>
        <w-icon
          @click="actions('zoomIn', { enableTransition: false, zoomRate: 2 })"
        >
          <ZoomIn />
        </w-icon>
        <w-icon
          @click="
            actions('clockwise', { rotateDeg: 180, enableTransition: false })
          "
        >
          <RefreshRight />
        </w-icon>
        <w-icon @click="actions('anticlockwise')"><RefreshLeft /></w-icon>
        <w-icon @click="reset"><Refresh /></w-icon>
        <w-icon @click="download(activeIndex)"><Download /></w-icon>
      </template>
    </w-image>
  </div>
</template>

<script lang="ts" setup>
import {
  DArrowLeft,
  DArrowRight,
  Download,
  Refresh,
  RefreshLeft,
  RefreshRight,
  ZoomIn,
  ZoomOut,
} from '@win-design-next/icons-vue'
import WIcon from '@win-design-next/components/icon'

const url =
  'https://cdn.dribbble.com/userupload/9645535/file/original-b7756b0958f420bef5cbf243c947f149.png?resize=752x'
const srcList = [
  'https://cdn.dribbble.com/userupload/9645535/file/original-b7756b0958f420bef5cbf243c947f149.png?resize=752x',
  'https://cdn.dribbble.com/users/175710/screenshots/4807690/media/0c1bfcc19f082b3afc05a6030d6db9d3.png?resize=800x600&vertical=center',
  'https://cdn.dribbble.com/users/175710/screenshots/4982767/media/a874e5b7dbbe8bcc649024022fcf908a.png?resize=800x600&vertical=center',
  'https://cdn.dribbble.com/userupload/9565924/file/original-e46d967fa4c7c5abb6c6f9454db5f165.png?resize=752x',
  'https://cdn.dribbble.com/users/264162/screenshots/16734417/media/282a4351c33576bb1d47b05b59e24a52.png',
]

const download = (index: number) => {
  const url = srcList[index]
  const suffix = url.slice(url.lastIndexOf('.'))
  const filename = Date.now() + suffix

  fetch(url)
    .then((response) => response.blob())
    .then((blob) => {
      const blobUrl = URL.createObjectURL(new Blob([blob]))
      const link = document.createElement('a')
      link.href = blobUrl
      link.download = filename
      document.body.appendChild(link)
      link.click()
      URL.revokeObjectURL(blobUrl)
      link.remove()
    })
}
</script>
```

:::

### API 文档

### Attributes

| 属性名                | 说明                                                                                                                      | 类型                                                                    | 默认值 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------- | ------ |
| src                   | 图片源地址，同原生属性一致                                                                                                | ^[string]                                                               | ''     |
| fit                   | 确定图片如何适应容器框，同原生 [object-fit](https://developer.mozilla.org/en-US/docs/Web/CSS/object-fit)                  | ^[enum]`'' \| 'fill' \| 'contain' \| 'cover' \| 'none' \| 'scale-down'` | ''     |
| hide-on-click-modal   | 当开启 preview 功能时，是否可以通过点击遮罩层关闭 preview                                                                 | ^[boolean]                                                              | false  |
| loading               | 浏览器加载图像的策略，和 [浏览器原生](https://developer.mozilla.org/en-US/docs/Web/HTML/Element/img#attr-loading)能力一致 | ^[enum]`'eager' \| 'lazy'`                                              | —      |
| lazy                  | 是否使用懒加载                                                                                                            | ^[boolean]                                                              | false  |
| scroll-container      | 开启懒加载功能后，监听 scroll 事件的容器 默认情况下，开启懒加载功能后，监听 scroll 事件的容器                             | ^[string] / ^[object]`HTMLElement`                                      | —      |
| alt                   | 原生属性 `alt`                                                                                                            | ^[string]                                                               | —      |
| referrerpolicy        | 原生属性 [referrerPolicy](https://developer.mozilla.org/en-US/docs/Web/API/HTMLImageElement/referrerPolicy)。             | ^[string]                                                               | —      |
| crossorigin           | 原生属性 [crossorigin](https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin)                          | ^[enum]`'' \| 'anonymous' \| 'use-credentials'`                         | —      |
| preview-src-list      | 开启图片预览功能                                                                                                          | ^[object]`string[]`                                                     | []     |
| z-index               | 设置图片预览的 z-index                                                                                                    | ^[number]                                                               | —      |
| initial-index         | 初始预览图像索引，小于 `url-list` 的长度                                                                                  | ^[number]                                                               | 0      |
| close-on-press-escape | 是否可以通过按下 ESC 关闭 Image Viewer                                                                                    | ^[boolean]                                                              | true   |
| preview-teleported    | image-viewer 是否插入至 body 元素上。 嵌套的父元素属性会发生修改时应该将此属性设置为 `true`                               | ^[boolean]                                                              | false  |
| infinite              | 是否可以无限循环预览                                                                                                      | ^[boolean]                                                              | true   |
| zoom-rate             | 图像查看器缩放事件的缩放速率。                                                                                            | ^[number]                                                               | 1.2    |
| min-scale             | 图像查看器缩放事件的最小缩放比例                                                                                          | ^[number]                                                               | 0.2    |
| max-scale             | 图像查看器缩放事件的最大缩放比例                                                                                          | ^[number]                                                               | 7      |

### Events

| 事件名 | 说明                                                               | 类型                                 |
| ------ | ------------------------------------------------------------------ | ------------------------------------ |
| load   | 图片加载成功触发                                                   | ^[Function]`(e: Event) => void`      |
| error  | 图片加载失败触发                                                   | ^[Function]`(e: Event) => void`      |
| switch | 切换图像时触发。                                                   | ^[Function]`(index: number) => void` |
| close  | 当点击 X 按钮或者在`hide-on-click-modal`为 true 时点击遮罩层时触发 | ^[Function]`() => void`              |
| show   | 当 Viewer 显示时触发                                               | ^[Function]`() => void`              |

### Slots

| 插槽名      | 说明                                 | 类型                                                                                                                                                                      |
| ----------- | ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| placeholder | 当图像尚未加载时，自定义的占位符内容 | -                                                                                                                                                                         |
| error       | 自定义图像加载失败的内容             | -                                                                                                                                                                         |
| viewer      | 当图像预览时自定义内容               | -                                                                                                                                                                         |
| progress    | 图片预览时自定义进度条内容           | ^[object]`{ activeIndex: number, total: number }`                                                                                                                         |
| toolbar     | 当图像预览时，自定义工具栏内容       | ^[object]`{actions: (action: ImageViewerAction, options?: ImageViewerActionOptions ) => void, prev: ()=> void, next: () => void,reset: () => void, activeIndex: number }` |

### Exposes

| 属性名      | 说明             | 类型                    |
| ----------- | ---------------- | ----------------------- |
| showPreview | 手动打开大图预览 | ^[Function]`() => void` |

## Image Viewer API

### Attributes

| 事件名                | 说明                                                                                     | Type                  | 默认值 |
| --------------------- | ---------------------------------------------------------------------------------------- | --------------------- | ------ |
| url-list              | 用于预览的图片链接列表                                                                   | ^[object]`string[]`   | []     |
| z-index               | 预览时遮罩层的 z-index                                                                   | ^[number] / ^[string] | —      |
| initial-index         | 初始预览图像索引，小于 `url-list` 的长度                                                 | ^[number]             | 0      |
| infinite              | 是否可以无限循环预览                                                                     | ^[boolean]            | true   |
| hide-on-click-modal   | 是否可以通过点击遮罩层关闭预览                                                           | ^[boolean]            | false  |
| teleported            | image 自身是否插入至 body 元素上。 嵌套的父元素属性会发生修改时应该将此属性设置为 `true` | ^[boolean]            | false  |
| zoom-rate             | 图像查看器缩放事件的缩放速率。                                                           | ^[number]             | 1.2    |
| min-scale             | 图像查看器缩放事件的最小缩放比例                                                         | ^[number]             | 0.2    |
| max-scale             | 图像查看器缩放事件的最大缩放比例                                                         | ^[number]             | 7      |
| close-on-press-escape | 是否可以通过按下 ESC 关闭 Image Viewer                                                   | ^[boolean]            | true   |
| show-progress         | 是否显示预览图片的进度条内容                                                             | ^[boolean]            | false  |

### Events

| Name   | 说明                                                               | 类型                                 |
| ------ | ------------------------------------------------------------------ | ------------------------------------ |
| close  | 当点击 X 按钮或者在`hide-on-click-modal`为 true 时点击遮罩层时触发 | ^[Function]`() => void`              |
| switch | 切换图像时触发。                                                   | ^[Function]`(index: number) => void` |
| rotate | 旋转图像时触发。                                                   | ^[Function]`(deg: number) => void`   |

### Exposes

| 名称          | 详情         | 类型                                 |
| ------------- | ------------ | ------------------------------------ |
| setActiveItem | 手动切换图片 | ^[Function]`(index: number) => void` |

## Progress 进度条

用于展示操作进度，告知用户当前状态和预期。

### 示例

:::demo Progress 组件设置 `percentage` 属性即可，表示进度条对应的百分比。 该属性**必填**，并且必须在 `0-100` 的范围内。 你可以通过设置 `format` 来自定义文字显示的格式。

```vue
<template>
  <div class="demo-progress">
    <w-progress :percentage="50" animate />
    <w-progress :percentage="50" :show-text="false" />
    <w-progress :percentage="100" :format="format" />
    <w-progress :percentage="100" status="success" />
    <w-progress :percentage="100" status="warning" />
    <w-progress :percentage="50" status="exception" />
    <w-progress :percentage="30" plain />
    <w-progress :percentage="80" title="进度条标题" />
    <w-progress :percentage="80">
      <template #title>
        这是一个很长的进度条标题、这是一个很长的进度条标题、这是一个很长的进度条标题
      </template>
    </w-progress>
  </div>
</template>

<script lang="ts" setup>
const format = (percentage) => (percentage === 100 ? 'Full' : `${percentage}%`)
</script>

<style scoped>
.demo-progress .w3-progress--line {
  margin-bottom: 24px;
  max-width: 600px;
}
</style>
```

:::

:::demo Progress 组件可通过 `stroke-width` 属性更改进度条的高度，并可通过 `text-inside` 属性来改变进度条内部的文字。

```vue
<template>
  <div class="demo-progress">
    <w-progress :text-inside="true" :stroke-width="20" :percentage="70" />
    <w-progress
      animate
      :text-inside="true"
      :stroke-width="22"
      :percentage="100"
      status="success"
    />
    <w-progress
      :text-inside="true"
      :stroke-width="24"
      :percentage="80"
      status="warning"
    />
    <w-progress
      :text-inside="true"
      :stroke-width="26"
      :percentage="50"
      status="exception"
    />
  </div>
</template>

<style scoped>
.demo-progress .w3-progress--line {
  margin-bottom: 15px;
  max-width: 600px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="demo-progress">
    <w-progress :percentage="percentage" :color="customColor" />

    <w-progress :percentage="percentage" :color="customColorMethod" />

    <w-progress :percentage="percentage" :color="customColors" />
    <w-progress :percentage="percentage" :color="customColors" />
    <div>
      <w-button-group>
        <w-button :icon="Minus" @click="decrease" />
        <w-button :icon="Plus" @click="increase" />
      </w-button-group>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Minus, Plus } from '@win-design-next/icons-vue'

const percentage = ref(20)
const customColor = ref('#2d5afa')

const customColors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 },
]

const customColorMethod = (percentage: number) => {
  if (percentage < 30) {
    return '#909399'
  }
  if (percentage < 70) {
    return '#e6a23c'
  }
  return '#67c23a'
}
const increase = () => {
  percentage.value += 10
  if (percentage.value > 100) {
    percentage.value = 100
  }
}
const decrease = () => {
  percentage.value -= 10
  if (percentage.value < 0) {
    percentage.value = 0
  }
}
</script>

<style scoped>
.demo-progress .w3-progress--line {
  margin-bottom: 15px;
  max-width: 600px;
}
</style>
```

:::

:::demo Progress 组件可通过 `type` 属性来指定使用环形进度条，在环形进度条中，还可以通过 `width` 属性来设置其大小。

```vue
<template>
  <div class="demo-progress">
    <w-progress type="circle" :percentage="0" />
    <w-progress type="circle" :percentage="25" />
    <w-progress type="circle" :percentage="100" status="success" />
    <w-progress type="circle" :percentage="70" status="warning" />
    <w-progress type="circle" :percentage="50" status="exception" />
  </div>
</template>

<style scoped>
.demo-progress .w3-progress--circle {
  margin-right: 15px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="demo-progress">
    <w-progress type="dashboard" :percentage="percentage" :color="colors" />
    <w-progress type="dashboard" :percentage="percentage2" :color="colors" />
    <div>
      <w-button-group>
        <w-button :icon="Minus" @click="decrease" />
        <w-button :icon="Plus" @click="increase" />
      </w-button-group>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { Minus, Plus } from '@win-design-next/icons-vue'

const percentage = ref(10)
const percentage2 = ref(0)

const colors = [
  { color: '#f56c6c', percentage: 20 },
  { color: '#e6a23c', percentage: 40 },
  { color: '#5cb87a', percentage: 60 },
  { color: '#1989fa', percentage: 80 },
  { color: '#6f7ad3', percentage: 100 },
]

const increase = () => {
  percentage.value += 10
  if (percentage.value > 100) {
    percentage.value = 100
  }
}
const decrease = () => {
  percentage.value -= 10
  if (percentage.value < 0) {
    percentage.value = 0
  }
}
onMounted(() => {
  setInterval(() => {
    percentage2.value = (percentage2.value % 100) + 10
  }, 500)
})
</script>

<style scoped>
.demo-progress .w3-progress--line {
  margin-bottom: 15px;
  max-width: 600px;
}
.demo-progress .w3-progress--circle {
  margin-right: 15px;
}
</style>
```

:::

:::demo 通过默认插槽添加自定义内容。

```vue
<template>
  <div class="demo-progress">
    <w-progress :percentage="50">
      <w-button text>Content</w-button>
    </w-progress>
    <w-progress
      :text-inside="true"
      :stroke-width="20"
      :percentage="50"
      status="exception"
    >
      <span>Content</span>
    </w-progress>
    <w-progress type="circle" :percentage="100" status="success">
      <w-button type="success" :icon="Check" circle />
    </w-progress>
    <w-progress type="dashboard" :percentage="80">
      <template #default="{ percentage }">
        <span class="percentage-value">{{ percentage }}%</span>
        <span class="percentage-label">Progressing</span>
      </template>
    </w-progress>
  </div>
</template>

<script lang="ts" setup>
import { Check } from '@win-design-next/icons-vue'
</script>

<style scoped>
.percentage-value {
  display: block;
  margin-top: 10px;
  font-size: 28px;
}
.percentage-label {
  display: block;
  margin-top: 10px;
  font-size: 12px;
}
.demo-progress .w3-progress--line {
  margin-bottom: 15px;
  max-width: 600px;
}
.demo-progress .w3-progress--circle {
  margin-right: 15px;
}
</style>
```

:::

:::demo 使用 `indeterminate` 属性来设置不确定的进度， `duration` 来控制动画持续时间。

```vue
<template>
  <div class="demo-progress">
    <w-progress :percentage="50" :indeterminate="true" />
    <w-progress :percentage="100" :format="format" :indeterminate="true" />
    <w-progress
      :percentage="100"
      status="success"
      :indeterminate="true"
      :duration="5"
    />
    <w-progress
      :percentage="100"
      status="warning"
      :indeterminate="true"
      :duration="1"
    />
    <w-progress :percentage="50" status="exception" :indeterminate="true" />
  </div>
</template>

<script lang="ts" setup>
const format = (percentage) => (percentage === 100 ? 'Full' : `${percentage}%`)
</script>

<style scoped>
.demo-progress .w3-progress--line {
  margin-bottom: 15px;
  max-width: 600px;
}
</style>
```

:::

:::demo 通过设置 `striped` 属性获取条纹进度条。 也可以使用 `striped-flow` 属性来使条纹流动起来。 使用`duration` 属性来控制条纹流动的速度。

```vue
<template>
  <div class="demo-progress">
    <w-progress :percentage="50" :stroke-width="15" striped />
    <w-progress
      :percentage="30"
      :stroke-width="15"
      status="warning"
      striped
      striped-flow
    />
    <w-progress
      :percentage="100"
      :stroke-width="15"
      status="success"
      striped
      striped-flow
      :duration="10"
    />
    <w-progress
      :percentage="percentage"
      :stroke-width="15"
      status="exception"
      striped
      striped-flow
      :duration="duration"
    />
    <w-button-group>
      <w-button :icon="Minus" @click="decrease" />
      <w-button :icon="Plus" @click="increase" />
    </w-button-group>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import { Minus, Plus } from '@win-design-next/icons-vue'

const percentage = ref<number>(70)
const duration = computed(() => Math.floor(percentage.value / 10))

const increase = () => {
  percentage.value += 10
  if (percentage.value > 100) {
    percentage.value = 100
  }
}
const decrease = () => {
  percentage.value -= 10
  if (percentage.value < 0) {
    percentage.value = 0
  }
}
</script>

<style scoped>
.demo-progress .w3-progress--line {
  margin-bottom: 15px;
  max-width: 600px;
}
</style>
```

:::

### API 文档

### 属性

| 参数                   | 说明                                                          | 类型                                                                                                        | 默认值 | Version |
| ---------------------- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- | ------ | ------- |
| percentage ^(required) | percentage                                                    | ^[number]`(0-100)`                                                                                          | 0      |
| type                   | 进度条类型                                                    | ^[enum]`'line' \| 'circle' \| 'dashboard'`                                                                  | line   |
| stroke-width           | 进度条的宽度                                                  | ^[number]                                                                                                   | 6      |
| text-inside            | 进度条显示文字内置在进度条内（仅 `type` 为 'line' 时可用）    | ^[boolean]                                                                                                  | false  |
| status                 | 进度条当前状态                                                | ^[enum]`'success' \| 'exception' \| 'warning'`                                                              | —      |
| indeterminate          | 是否为动画进度条                                              | ^[boolean]                                                                                                  | false  |
| duration               | 控制动画进度条速度和条纹进度条流动速度                        | ^[number]                                                                                                   | 3      |
| color                  | 进度条背景色 （会覆盖 `status` 状态颜色）                     | ^[string] / ^[function]`(percentage: number) => string` / ^[Array]`{ color: string; percentage: number }[]` | ''     |
| width                  | 环形进度条画布宽度（只在 type 为 circle 或 dashboard 时可用） | ^[number]                                                                                                   | 126    |
| show-text              | 是否显示进度条文字内容                                        | ^[boolean]                                                                                                  | true   |
| stroke-linecap         | circle/dashboard 类型路径两端的形状                           | ^[enum]`'butt' \| 'round' \| 'square'`                                                                      | round  |
| format                 | 指定进度条文字内容                                            | ^[Function]`(percentage: number) => string`                                                                 | —      |
| striped                | 在进度条上增加条纹                                            | ^[boolean]                                                                                                  | false  |
| striped-flow           | 让进度条上的条纹流动起来                                      | ^[boolean]                                                                                                  | false  |
| animated               | 是否启用加载动画(仅条形进度条可用)                            | ^[boolean]                                                                                                  | false  | V0.0.9  |
| title                  | 进度条标题                                                    | ^[string]                                                                                                   | -      | V0.0.9  |
| plain                  | 是否为朴素进度条                                              | ^[boolean]                                                                                                  | false  | V0.0.9  |

### Slots

| 名称    | 说明       | 类型                              |
| ------- | ---------- | --------------------------------- |
| default | 自定义内容 | ^[object]`{ percentage: number }` |
| title   | 自定义标题 |                                   |

---

## Result 结果

用于对用户的操作结果或者异常状态做反馈。

### 示例

:::demo

```vue
<template>
  <w-row>
    <w-col :sm="12" :lg="6">
      <w-result
        icon="success"
        title="Success Tip"
        sub-title="请根据提示进行操作"
      >
        <template #extra>
          <w-button type="primary">返回</w-button>
        </template>
      </w-result>
    </w-col>
    <w-col :sm="12" :lg="6">
      <w-result
        icon="warning"
        title="Warning Tip"
        sub-title="请根据提示进行操作"
      >
        <template #extra>
          <w-button type="primary">返回</w-button>
        </template>
      </w-result>
    </w-col>
    <w-col :sm="12" :lg="6">
      <w-result icon="error" title="Error Tip" sub-title="请根据提示进行操作">
        <template #extra>
          <w-button type="primary">返回</w-button>
        </template>
      </w-result>
    </w-col>
    <w-col :sm="12" :lg="6">
      <w-result icon="info" title="Info Tip">
        <template #sub-title>
          <p>Using slot as subtitle</p>
        </template>
        <template #extra>
          <w-button type="primary">返回</w-button>
        </template>
      </w-result>
    </w-col>
  </w-row>
</template>
```

:::

:::demo

```vue
<template>
  <w-result title="404" sub-title="Sorry, request error">
    <template #icon>
      <w-image
        style="width: 200px; height: 200px"
        src="https://cdn.dribbble.com/users/175710/screenshots/4782427/media/a5f9c97e497271e7da2286808ef462f5.png?resize=800x600&vertical=center"
      />
    </template>
    <template #extra>
      <w-button type="primary">返回</w-button>
    </template>
  </w-result>
</template>
```

:::

### API 文档

### Attributes

| 属性名       | 说明             | 类型                                                      | 默认值  |
| --------- | -------------- | ------------------------------------------------------- | ---- |
| title     | result 组件的标题   | ^[string]                                               | ''   |
| sub-title | result 组件的副标题  | ^[string]                                               | ''   |
| icon      | result 组件的图标类型 | ^[enum]`'success' \| 'warning' \| 'info' \| 'error'` | info |

### 插槽

| 名称        | 说明               |
| --------- | ---------------- |
| icon      | icon 内容          |
| title     | result title 的内容 |
| sub-title | sub title 的内容    |
| extra     | 内容额外区域的内容        |

---

## Skeleton 骨架屏

在需要等待加载内容的位置设置一个骨架屏，某些场景下比 Loading 的视觉效果更好。

### 示例

:::demo

```vue
<template>
  <w-skeleton />
  <br />
  <w-skeleton style="--w3-skeleton-circle-size: 100px">
    <template #template>
      <w-skeleton-item variant="circle" />
    </template>
  </w-skeleton>
</template>
```

:::

:::demo

```vue
<template>
  <w-skeleton :rows="5" />
</template>
```

:::

:::demo

```vue
<template>
  <w-skeleton :rows="5" animated />
</template>
```

:::

:::demo

```vue
<template>
  <w-skeleton style="width: 240px">
    <template #template>
      <w-skeleton-item variant="image" style="width: 240px; height: 240px" />
      <div style="padding: 14px">
        <w-skeleton-item variant="p" style="width: 50%" />
        <div
          style="
            display: flex;
            align-items: center;
            justify-items: space-between;
          "
        >
          <w-skeleton-item variant="text" style="margin-right: 16px" />
          <w-skeleton-item variant="text" style="width: 30%" />
        </div>
      </div>
    </template>
  </w-skeleton>
</template>
```

:::

:::demo

```vue
<template>
  <w-space direction="vertical" alignment="flex-start">
    <div>
      <label style="margin-right: 16px">Switch Loading</label>
      <w-switch v-model="loading" />
    </div>
    <w-skeleton style="width: 240px" :loading="loading" animated>
      <template #template>
        <w-skeleton-item variant="image" style="width: 240px; height: 240px" />
        <div style="padding: 14px">
          <w-skeleton-item variant="h3" style="width: 50%" />
          <div
            style="
              display: flex;
              align-items: center;
              justify-items: space-between;
              margin-top: 16px;
              height: 16px;
            "
          >
            <w-skeleton-item variant="text" style="margin-right: 16px" />
            <w-skeleton-item variant="text" style="width: 30%" />
          </div>
        </div>
      </template>
      <template #default>
        <w-card :body-style="{ padding: '0px', marginBottom: '1px' }">
          <img
            src="https://cdn.dribbble.com/users/175710/screenshots/4782427/media/a5f9c97e497271e7da2286808ef462f5.png?resize=800x600&vertical=center"
            class="image"
          />
          <div style="padding: 14px">
            <span>Delicious hamburger</span>
            <div class="bottom card-header">
              <div class="time">{{ currentDate }}</div>
              <w-button text class="button">Operation button</w-button>
            </div>
          </div>
        </w-card>
      </template>
    </w-skeleton>
  </w-space>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const loading = ref(true)
const currentDate = new Date().toDateString()
</script>
```

:::

:::demo

```vue
<template>
  <w-space style="width: 100%" fill>
    <div>
      <w-button @click="setLoading">点击 to reload</w-button>
    </div>
    <w-skeleton
      style="display: flex; gap: 8px"
      :loading="loading"
      animated
      :count="3"
    >
      <template #template>
        <div style="flex: 1">
          <w-skeleton-item variant="image" style="height: 240px" />
          <div style="padding: 14px">
            <w-skeleton-item variant="h3" style="width: 50%" />
            <div
              style="
                display: flex;
                align-items: center;
                justify-items: space-between;
                margin-top: 16px;
                height: 16px;
              "
            >
              <w-skeleton-item variant="text" style="margin-right: 16px" />
              <w-skeleton-item variant="text" style="width: 30%" />
            </div>
          </div>
        </div>
      </template>
      <template #default>
        <w-card
          v-for="item in lists"
          :key="item.name"
          :body-style="{ padding: '0px', marginBottom: '1px' }"
        >
          <img
            :src="item.imgUrl"
            class="image multi-content"
            style="max-width: 100%"
          />
          <div style="padding: 14px">
            <span>{{ item.name }}</span>
            <div class="bottom card-header">
              <div class="time">{{ currentDate }}</div>
              <w-button text class="button">Operation button</w-button>
            </div>
          </div>
        </w-card>
      </template>
    </w-skeleton>
  </w-space>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'

interface ListItem {
  imgUrl: string
  name: string
}

const loading = ref(true)
const lists = ref<ListItem[]>([])
const currentDate = new Date().toDateString()

const setLoading = () => {
  loading.value = true
  setTimeout(() => {
    loading.value = false
  }, 2000)
}

onMounted(() => {
  loading.value = false
  lists.value = [
    {
      imgUrl:
        'https://cdn.dribbble.com/userupload/9645535/file/original-b7756b0958f420bef5cbf243c947f149.png?resize=752x',
      name: 'Deer',
    },
    {
      imgUrl:
        'https://cdn.dribbble.com/users/175710/screenshots/4807690/media/0c1bfcc19f082b3afc05a6030d6db9d3.png?resize=800x600&vertical=center',
      name: 'Horse',
    },
    {
      imgUrl:
        'https://cdn.dribbble.com/users/175710/screenshots/4982767/media/a874e5b7dbbe8bcc649024022fcf908a.png?resize=800x600&vertical=center',
      name: 'Mountain Lion',
    },
  ]
})
</script>
```

:::

:::demo

```vue
<template>
  <w-space direction="vertical" alignment="flex-start">
    <div>
      <label style="margin-right: 16px">Switch Loading</label>
      <w-switch v-model="loading" />
    </div>
    <w-skeleton
      style="width: 240px"
      :loading="loading"
      animated
      :throttle="500"
    >
      <template #template>
        <w-skeleton-item variant="image" style="width: 240px; height: 265px" />
        <div style="padding: 14px">
          <w-skeleton-item variant="h3" style="width: 50%" />
          <div
            style="
              display: flex;
              align-items: center;
              justify-items: space-between;
              margin-top: 16px;
              height: 16px;
            "
          >
            <w-skeleton-item variant="text" style="margin-right: 16px" />
            <w-skeleton-item variant="text" style="width: 30%" />
          </div>
        </div>
      </template>
      <template #default>
        <w-card :body-style="{ padding: '0px', marginBottom: '1px' }">
          <img
            src="https://cdn.dribbble.com/users/175710/screenshots/4782427/media/a5f9c97e497271e7da2286808ef462f5.png?resize=800x600&vertical=center"
            class="image"
          />
          <div style="padding: 14px">
            <span>Delicious hamburger</span>
            <div class="bottom card-header">
              <div class="time">{{ currentDate }}</div>
              <w-button text class="button">operation button</w-button>
            </div>
          </div>
        </w-card>
      </template>
    </w-skeleton>
  </w-space>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const loading = ref(false)
const currentDate = new Date().toDateString()
</script>
```

:::

:::demo

```vue
<template>
  <w-space direction="vertical" alignment="flex-start">
    <div>
      <label style="margin-right: 16px">Switch Loading</label>
      <w-switch v-model="loading" />
    </div>
    <w-skeleton
      style="width: 240px"
      :loading="loading"
      animated
      :throttle="{ leading: 500, initVal: true }"
    >
      <template #template>
        <w-skeleton-item variant="image" style="width: 240px; height: 265px" />
        <div style="padding: 14px">
          <w-skeleton-item variant="h3" style="width: 50%" />
          <div
            style="
              display: flex;
              align-items: center;
              justify-items: space-between;
              margin-top: 16px;
              height: 16px;
            "
          >
            <w-skeleton-item variant="text" style="margin-right: 16px" />
            <w-skeleton-item variant="text" style="width: 30%" />
          </div>
        </div>
      </template>
      <template #default>
        <w-card :body-style="{ padding: '0px', marginBottom: '1px' }">
          <img
            src="https://cdn.dribbble.com/users/175710/screenshots/4782427/media/a5f9c97e497271e7da2286808ef462f5.png?resize=800x600&vertical=center"
            class="image"
          />
          <div style="padding: 14px">
            <span>Delicious hamburger</span>
            <div class="bottom card-header">
              <div class="time">{{ currentDate }}</div>
              <w-button text class="button">operation button</w-button>
            </div>
          </div>
        </w-card>
      </template>
    </w-skeleton>
  </w-space>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const loading = ref(true)
const currentDate = new Date().toDateString()
</script>
```

:::

:::demo

```vue
<template>
  <w-space direction="vertical" alignment="flex-start">
    <div>
      <label style="margin-right: 16px">Switch Loading</label>
      <w-switch v-model="loading" />
    </div>
    <w-skeleton
      style="width: 240px"
      :loading="loading"
      animated
      :throttle="{ leading: 500, trailing: 500, initVal: true }"
    >
      <template #template>
        <w-skeleton-item variant="image" style="width: 240px; height: 265px" />
        <div style="padding: 14px">
          <w-skeleton-item variant="h3" style="width: 50%" />
          <div
            style="
              display: flex;
              align-items: center;
              justify-items: space-between;
              margin-top: 16px;
              height: 16px;
            "
          >
            <w-skeleton-item variant="text" style="margin-right: 16px" />
            <w-skeleton-item variant="text" style="width: 30%" />
          </div>
        </div>
      </template>
      <template #default>
        <w-card :body-style="{ padding: '0px', marginBottom: '1px' }">
          <img
            src="https://cdn.dribbble.com/users/175710/screenshots/4782427/media/a5f9c97e497271e7da2286808ef462f5.png?resize=800x600&vertical=center"
            class="image"
          />
          <div style="padding: 14px">
            <span>Delicious hamburger</span>
            <div class="bottom card-header">
              <div class="time">{{ currentDate }}</div>
              <w-button text class="button">operation button</w-button>
            </div>
          </div>
        </w-card>
      </template>
    </w-skeleton>
  </w-space>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const loading = ref(false)
const currentDate = new Date().toDateString()
</script>
```

:::

### API 文档

### Attributes

| 属性名   | 说明                                                                                                                                                           | 类型                                                                              | 默认值 |
| -------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------ |
| animated | 是否使用动画                                                                                                                                                   | ^[boolean]                                                                        | false  |
| count    | 渲染多少个 template, 建议使用尽可能小的数字                                                                                                                    | ^[number]                                                                         | 1      |
| loading  | 是否显示加载结束后的 DOM 结构                                                                                                                                  | ^[boolean]                                                                        | false  |
| rows     | 骨架屏段落数量                                                                                                                                                 | ^[number]                                                                         | 3      |
| throttle | 渲染延迟（以毫秒为单位） 数字代表延迟显示, 也可以设置为延迟隐藏, 例如 `{ leading: 500, trailing: 500 }` 当需要控制初始加载值时，您可以设置 `{ initVal: true }` | ^[number] / ^[object]`{ leading?: number, trailing?: number, initVal?: boolean }` | 0      |

### Slots

| 插槽名   | 说明                     | 作用域                     |
| -------- | ------------------------ | -------------------------- |
| default  | 真正渲染的 DOM           | ^[object]`$attrs`          |
| template | 渲染 skeleton 模板的内容 | ^[object]`{ key: number }` |

## SkeletonItem API

### Attributes

| 属性名  | 说明                   | 类型                                                                                             | 默认值 |
| ------- | ---------------------- | ------------------------------------------------------------------------------------------------ | ------ |
| variant | 当前渲染 skeleton 类型 | ^[enum]`'p' \| 'text' \| 'h1' \| 'h3' \| 'caption' \| 'button' \| 'image' \| 'circle' \| 'rect'` | text   |

---

## Statistic 统计组件

显示统计数据。

### 示例

:::demo 用于突出某个或某组数字时，如统计数值、金额、排名等，数值和标题前后都可以加icon、单位等元素。 可以使用 [vueuse](https://vueuse.org/core/useTransition/) 实现数值的变化动效

```vue
<template>
  <w-row>
    <w-col :span="6">
      <w-statistic title="Daily active users" :value="268500" />
    </w-col>
    <w-col :span="6">
      <w-statistic :value="138">
        <template #title>
          <div style="display: inline-flex; align-items: center">
            Ratio of men to women
            <w-icon style="margin-left: 4px" :size="12">
              <Male />
            </w-icon>
          </div>
        </template>
        <template #suffix>/100</template>
      </w-statistic>
    </w-col>
    <w-col :span="6">
      <w-statistic title="Total Transactions" :value="outputValue" />
    </w-col>
    <w-col :span="6">
      <w-statistic title="Feedback number" :value="562">
        <template #suffix>
          <w-icon style="vertical-align: -0.125em">
            <BarChart />
          </w-icon>
        </template>
      </w-statistic>
    </w-col>
  </w-row>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useTransition } from '@vueuse/core'
import { BarChart, Male } from '@win-design-next/icons-vue'

const source = ref(0)
const outputValue = useTransition(source, {
  duration: 1500,
})
source.value = 172000
</script>

<style scoped>
.w3-col {
  text-align: center;
}
</style>
```

:::

:::demo 倒计时组件，支持添加其他组件来控制。

```vue
<template>
  <w-row>
    <w-col :span="8">
      <w-countdown title="Start to grab" :value="value" />
    </w-col>
    <w-col :span="8">
      <w-countdown
        title="Remaining VIP time"
        format="HH:mm:ss"
        :value="value1"
      />
      <w-button class="countdown-footer" type="primary" @click="reset">
        Reset
      </w-button>
    </w-col>
    <w-col :span="8">
      <w-countdown format="DD [days] HH:mm:ss" :value="value2">
        <template #title>
          <div style="display: inline-flex; align-items: center">
            <w-icon style="margin-right: 4px" :size="12">
              <Time />
            </w-icon>
            Still to go until next month
          </div>
        </template>
      </w-countdown>
      <div class="countdown-footer">{{ value2.format('YYYY-MM-DD') }}</div>
    </w-col>
  </w-row>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import dayjs from 'dayjs'
import { Time } from '@win-design-next/icons-vue'

const value = ref(Date.now() + 1000 * 60 * 60 * 7)
const value1 = ref(Date.now() + 1000 * 60 * 60 * 24 * 2)
const value2 = ref(dayjs().add(1, 'month').startOf('month'))

function reset() {
  value1.value = Date.now() + 1000 * 60 * 60 * 24 * 2
}
</script>

<style scoped>
.w3-col {
  text-align: center;
}

.countdown-footer {
  margin-top: 8px;
}
</style>
```

:::

:::demo 卡片式用法展示，可以自由组合

```vue
<template>
  <w-row :gutter="16">
    <w-col :span="8">
      <div class="statistic-card">
        <w-statistic :value="98500">
          <template #title>
            <div style="display: inline-flex; align-items: center">
              Daily active users
              <w-tooltip
                effect="dark"
                content="Number of users who logged into the product in one day"
                placement="top"
              >
                <w-icon style="margin-left: 4px" :size="12">
                  <Warning />
                </w-icon>
              </w-tooltip>
            </div>
          </template>
        </w-statistic>
        <div class="statistic-footer">
          <div class="footer-item">
            <span>than yesterday</span>
            <span class="green">
              24%
              <w-icon>
                <CaretTop />
              </w-icon>
            </span>
          </div>
        </div>
      </div>
    </w-col>
    <w-col :span="8">
      <div class="statistic-card">
        <w-statistic :value="693700">
          <template #title>
            <div style="display: inline-flex; align-items: center">
              Monthly Active Users
              <w-tooltip
                effect="dark"
                content="Number of users who logged into the product in one month"
                placement="top"
              >
                <w-icon style="margin-left: 4px" :size="12">
                  <Warning />
                </w-icon>
              </w-tooltip>
            </div>
          </template>
        </w-statistic>
        <div class="statistic-footer">
          <div class="footer-item">
            <span>month on month</span>
            <span class="red">
              12%
              <w-icon>
                <CaretBottom />
              </w-icon>
            </span>
          </div>
        </div>
      </div>
    </w-col>
    <w-col :span="8">
      <div class="statistic-card">
        <w-statistic :value="72000" title="New transactions today">
          <template #title>
            <div style="display: inline-flex; align-items: center">
              New transactions today
            </div>
          </template>
        </w-statistic>
        <div class="statistic-footer">
          <div class="footer-item">
            <span>than yesterday</span>
            <span class="green">
              16%
              <w-icon>
                <CaretTop />
              </w-icon>
            </span>
          </div>
          <div class="footer-item">
            <w-icon :size="14">
              <ArrowRight />
            </w-icon>
          </div>
        </div>
      </div>
    </w-col>
  </w-row>
</template>

<script lang="ts" setup>
import {
  ArrowRight,
  CaretBottom,
  CaretTop,
  Warning,
} from '@win-design-next/icons-vue'
</script>

<style scoped>
:global(h2#card-usage ~ .example .example-showcase) {
  background-color: var(--w3-fill-color) !important;
}

.w3-statistic {
  --w3-statistic-content-font-size: 28px;
}

.statistic-card {
  height: 100%;
  padding: 20px;
  border-radius: 4px;
  background-color: var(--w3-bg-color-overlay);
}

.statistic-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  flex-wrap: wrap;
  font-size: 12px;
  color: var(--w3-font-color-second);
  margin-top: 16px;
}

.statistic-footer .footer-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.statistic-footer .footer-item span:last-child {
  display: inline-flex;
  align-items: center;
  margin-left: 4px;
}

.green {
  color: var(--w3-color-success);
}
.red {
  color: var(--w3-color-error);
}
</style>
```

:::

### API 文档

### Attributes

| Attribute         | 描述       | 类型                                                                    | 默认值 |
| ----------------- | -------- | --------------------------------------------------------------------- | --- |
| value             | 数字内容     | ^[number]                                                             | 0   |
| decimal-separator | 设置小数点符号  | ^[string]                                                             | .   |
| formatter         | 自定义数字格式化 | ^[Function]`(value: number) => string \| number`                  | —   |
| group-separator   | 设置千分位标识符 | ^[string]                                                             | ,   |
| precision         | 数字精度     | ^[number]                                                             | 0   |
| prefix            | 设置数字的前缀  | ^[string]                                                             | —   |
| suffix            | 设置数字的后缀  | ^[string]                                                             | —   |
| title             | 数字标题     | ^[string]                                                             | —   |
| value-style       | 数字样式     | ^[string] / ^[object]`CSSProperties \| CSSProperties[] \| string[]` | —   |

### Slots

| 插槽名    | 详情    |
| ------ | ----- |
| prefix | 数字区之前 |
| suffix | 数字区之后 |
| title  | 数字标题  |

### Exposes

| 名称           | 描述    | 类型                                      |
| ------------ | ----- | --------------------------------------- |
| displayValue | 当前显示值 | ^[object]`Ref<string \| number>` |

## Countdown API

### Attributes

| 属性          | 详情       | 类型                                                                    | 默认值      |
| ----------- | -------- | --------------------------------------------------------------------- | -------- |
| value       | 目标时间     | ^[number] / ^[Dayjs]                                                  | —        |
| format      | 格式化倒计时   | ^[string]                                                             | HH:mm:ss |
| prefix      | 设置倒计时前缀  | ^[string]                                                             | —        |
| suffix      | 设置倒计时的后缀 | ^[string]                                                             | —        |
| title       | 倒计时标题    | ^[string]                                                             | —        |
| value-style | 倒计时值的样式  | ^[string] / ^[object]`CSSProperties \| CSSProperties[] \| string[]` | —        |

### Events

| 方法     | 描述      | 类型                                      |
| ------ | ------- | --------------------------------------- |
| change | 时间差改变事件 | ^[Function]`(value: number) => void` |
| finish | 倒计时结束事件 | ^[Function]`() => void`              |

### Slots

| 事件名    | 描述     |
| ------ | ------ |
| prefix | 倒计时值前缀 |
| suffix | 倒计时后缀  |
| title  | 倒计时标题  |

### Exposes

| 名称           | 详情    | 类型                           |
| ------------ | ----- | ---------------------------- |
| displayValue | 当前显示值 | ^[object]`Ref<string>` |

---

## Status 状态

status/basic

### 示例

:::demo Status 状态组件的基础用法, 提供两种基础样式: 圆形状态和方形状态。

```vue
<template>
  <w-status>默认状态</w-status>
  <w-status type="success">成功状态</w-status>
  <w-status type="warning">警告状态</w-status>
  <w-status type="error">危险状态</w-status>
  <w-status type="danger">危险状态</w-status>
  <w-status type="info">信息状态</w-status>
  <div class="base-space" />
  <w-status :circle="false">默认状态</w-status>
  <w-status type="success" :circle="false">成功状态</w-status>
  <w-status type="warning" :circle="false">警告状态</w-status>
  <w-status type="error" :circle="false">危险状态</w-status>
  <w-status type="danger" :circle="false">危险状态</w-status>
  <w-status type="info" :circle="false">信息状态</w-status>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
</script>

<style lang="scss" scoped>
.base-space {
  margin-bottom: 16px;
}

.w3-status + .w3-status {
  margin-left: 16px;
}
</style>
```

:::

:::demo 默认情况下 icon 和文本颜色不一致, 若想其保持一致, 可以为组件添加 common 属性。如果需要自定义 icon 和文本的颜色，可以使用 icon-color 和 text-color 参数，分别为 icon 和文本设置颜色，需要注意的是设置 icon-color 和 text-color 时 common 和 type 属性均会失效。

```vue
<template>
  <w-status common>默认状态</w-status>
  <w-status type="success" common>成功状态</w-status>
  <w-status type="warning" common>警告状态</w-status>
  <w-status type="error" common>危险状态</w-status>
  <w-status type="info" common>信息状态</w-status>
  <div class="base-space" />
  <w-status icon-color="#2DB7A0" text-color="#60E0CB">水湘青主题</w-status>
  <w-status icon-color="#2996AA" text-color="#39AFC5">石涧蓝</w-status>
  <w-status icon-color="#F24F86" text-color="#FF82AC">芙蓉粉</w-status>
  <w-status icon-color="#722ED1" text-color="#9E6EE1">山梗紫</w-status>
  <w-status icon-color="#B16C3D" text-color="#C57036">檀木棕</w-status>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.base-space {
  margin-bottom: 16px;
}

.w3-status + .w3-status {
  margin-left: 16px;
}
</style>
```

:::

:::demo Status 状态组件提供了不同尺寸 (large / medium / small / mini) 以供选择，默认为 small。

```vue
<template>
  <w-status type="success" size="large">超大</w-status>
  <w-status type="warning" size="medium">大型</w-status>
  <w-status type="warning" size="default">默认</w-status>
  <w-status type="error" size="mini">中型</w-status>
  <div class="base-space" />
  <w-status type="success" size="large" :circle="false">超大</w-status>
  <w-status type="success" size="medium" :circle="false">大型</w-status>
  <w-status type="warning" size="default" :circle="false">默认</w-status>
  <w-status type="error" size="mini" :circle="false">中型</w-status>
</template>

<script lang="ts" setup></script>

<style lang="scss" scoped>
.base-space {
  margin-bottom: 16px;
}

.w3-status + .w3-status {
  margin-left: 16px;
}
</style>
```

:::

### API 文档

### Attributes

| 参数       | 说明                                             | 类型    | 可选值                                                               | 默认值    | Version |
| ---------- | ------------------------------------------------ | ------- | -------------------------------------------------------------------- | --------- | ------- |
| circle     | 是否为圆形前缀标志                               | Boolean | —                                                                    | true      |
| common     | 文本与 icon 同色                                 | Boolean | —                                                                    | false     |
| icon-color | 自定义 icon 颜色（此时 type 与 common 参数失效） | String  | —                                                                    | —         |
| size       | 大小                                             | String  | 'large' \| 'medium' \| 'default' \| 'mini'                           | 'default' |
| text-color | 自定义文本颜色（此时 type 与 common 参数失效）   | String  | —                                                                    | —         |
| type       | 类型                                             | String  | 'primary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'danger' | 'primary' |

---

## Steps 步骤条

引导用户按照流程完成任务的分步导航条， 可根据实际应用场景设定步骤，步骤不得少于 2 步。

### 示例

:::demo 设置 `active` 属性，接受一个 `Number`，表明步骤的 index，从 0 开始。 需要定宽的步骤条时，设置 `space` 属性即可，它接受 `Number`， 单位为 `px`， 如果不设置，则为自适应。 设置 `finish-status` 属性可以改变已经完成的步骤的状态。

```vue
<template>
  <w-title>基础用法</w-title>
  <w-steps
    style="max-width: 600px"
    :active="active"
    finish-status="success"
    :space="200"
  >
    <w-step title="项目核对" />
    <w-step title="费用核对" />
    <w-step title="办理转区" />
  </w-steps>
  <w-divider />
  <w-title>带描述和图标的步骤条</w-title>
  <w-steps style="max-width: 600px" :active="active" finish-status="success">
    <w-step
      title="项目核对"
      :icon="Search"
      description="需要仔细核对费用明细表，确保信息与实际情况一致"
    />
    <w-step
      title="费用核对"
      :icon="Edit"
      description="需要仔细核对费用明细表，确保信息与实际情况一致"
    />
    <w-step
      :icon="Date"
      title="办理转区"
      description="需要仔细核对费用明细表，确保信息与实际情况一致"
    />
  </w-steps>
  <w-divider />
  <w-title>垂直方向</w-title>
  <w-steps
    style="height: 300px"
    direction="vertical"
    :active="active"
    finish-status="success"
  >
    <w-step title="项目核对" :icon="Search" />
    <w-step
      title="费用核对"
      :icon="Edit"
      description="需要仔细核对费用明细表，确保信息与实际情况一致"
    />
    <w-step
      :icon="Date"
      title="办理转区"
      description="需要仔细核对费用明细表，确保信息与实际情况一致"
    />
  </w-steps>
  <w-divider />
  <w-button style="margin-top: 12px" @click="next">Next step</w-button>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Date, Edit, Search } from '@win-design-next/icons-vue'

const active = ref(0)

const next = () => {
  if (active.value++ > 2) active.value = 0
}
</script>
```

:::

:::demo 也可以使用 `title` 具名插槽，可以用 `slot` 的方式来取代属性的设置， 在本文档最后的列表中有所有的插槽可供参考。

```vue
<template>
  <w-steps
    style="max-width: 600px"
    :space="200"
    :active="2"
    finish-status="error"
  >
    <w-step title="项目核对" />
    <w-step title="费用核对" />
    <w-step title="办理转区" />
  </w-steps>
</template>
```

:::

:::demo

```vue
<template>
  <w-steps style="max-width: 600px" :active="1" align-center class="mb-4">
    <w-step title="项目核对" />
    <w-step title="费用核对" />
    <w-step title="办理转区" />
  </w-steps>
  <w-steps style="max-width: 600px" :active="1" align-center>
    <w-step
      title="项目核对"
      :icon="Search"
      description="需要仔细核对费用明细表，确保信息与实际情况一致"
    />
    <w-step
      title="费用核对"
      :icon="Edit"
      description="需要仔细核对费用明细表，确保信息与实际情况一致"
    />
    <w-step
      :icon="Date"
      title="办理转区"
      description="需要仔细核对费用明细表，确保信息与实际情况一致"
    />
  </w-steps>
</template>

<script lang="ts" setup>
import { Date, Edit, Search } from '@win-design-next/icons-vue'
</script>
```

:::

:::demo

```vue
<template>
  <w-steps
    class="mb-4"
    style="max-width: 600px"
    :space="200"
    :active="1"
    simple
  >
    <w-step title="项目核对" />
    <w-step title="费用核对" />
    <w-step title="办理转区" />
  </w-steps>

  <w-steps style="max-width: 600px" :active="1" finish-status="error" simple>
    <w-step title="项目核对" />
    <w-step title="费用核对" />
    <w-step title="办理转区" />
  </w-steps>
</template>
```

:::

### API 文档

### Attributes

| 属性名         | 说明                                                | 类型                                                             | 默认       |
| -------------- | --------------------------------------------------- | ---------------------------------------------------------------- | ---------- |
| space          | 每个 step 的间距，不填写将自适应间距。 支持百分比。 | ^[number] / ^[string]                                            | ''         |
| direction      | 显示方向                                            | ^[enum]`'vertical' \| 'horizontal'`                              | horizontal |
| active         | 设置当前激活步骤                                    | ^[number]                                                        | 0          |
| process-status | 设置当前步骤的状态                                  | ^[enum]`'wait' \| 'process' \| 'finish' \| 'error' \| 'success'` | process    |
| finish-status  | 设置结束步骤的状态                                  | ^[enum]`'wait' \| 'process' \| 'finish' \| 'error' \| 'success'` | finish     |
| align-center   | 进行居中对齐                                        | ^[boolean]                                                       | —          |
| simple         | 是否应用简洁风格                                    | ^[boolean]                                                       | —          |

### Slots

| 插槽名  | 说明     | 子标签 |
| ------- | -------- | ------ |
| default | 默认插槽 | Step   |

## Step API

### Attributes

| 属性名      | 说明                                             | 类型                                                                   | 默认 |
| ----------- | ------------------------------------------------ | ---------------------------------------------------------------------- | ---- |
| title       | 标题                                             | ^[string]                                                              | ''   |
| description | 描述文案                                         | ^[string]                                                              | ''   |
| icon        | Step 组件的自定义图标。 也支持 slot 方式写入     | ^[string] / ^[Component]                                               | —    |
| status      | 设置当前步骤的状态， 不设置则根据 steps 确定状态 | ^[enum]`'' \| 'wait' \| 'process' \| 'finish' \| 'error' \| 'success'` | ''   |

### Slots

| 插槽名      | 说明           |
| ----------- | -------------- |
| icon        | 自定义图标     |
| title       | 自定义标题     |
| description | 自定义描述文案 |

---

## Tag 标签

用于标记和选择。

### 示例

:::demo 由 `type` 属性来选择 tag 的类型。 也可以通过 `color` 属性来自定义背景色。

```vue
<template>
  <div class="mb-4">
    <w-title>默认样式</w-title>
    <div class="flex gap-2">
      <w-tag type="primary" hit>标签 1</w-tag>
      <w-tag type="success">标签 2</w-tag>
      <w-tag type="info">标签 3</w-tag>
      <w-tag type="warning">标签 4</w-tag>
      <w-tag type="danger">标签 5</w-tag>
      <w-tag type="error">标签 5</w-tag>
    </div>
    <w-divider />
  </div>
  <div class="mb-4">
    <w-title
      >Tag 组件提供了三个不同的主题：dark、light 和 plain。 通过设置 effect
      属性来改变主题，默认为 light。</w-title
    >
    <div class="flex gap-2 mb-4">
      <w-tag type="primary" effect="dark">标签 1</w-tag>
      <w-tag type="success" effect="dark">标签 2</w-tag>
      <w-tag type="info" effect="dark">标签 3</w-tag>
      <w-tag type="warning" effect="dark">标签 4</w-tag>
      <w-tag type="danger" effect="dark">标签 5</w-tag>
    </div>
    <div class="flex gap-2">
      <w-tag type="primary" effect="plain">标签 1</w-tag>
      <w-tag type="success" effect="plain">标签 2</w-tag>
      <w-tag type="info" effect="plain">标签 3</w-tag>
      <w-tag type="warning" effect="plain">标签 4</w-tag>
      <w-tag type="danger" effect="plain">标签 5</w-tag>
    </div>
    <w-divider />
  </div>
  <div class="mb-4">
    <w-title>边框描边：hit</w-title>
    <div class="flex gap-2">
      <w-tag type="primary" hit>标签 1</w-tag>
      <w-tag type="success" hit>标签 2</w-tag>
      <w-tag type="info" hit>标签 3</w-tag>
      <w-tag type="warning" hit>标签 4</w-tag>
      <w-tag type="danger" hit>标签 5</w-tag>
    </div>
    <w-divider />
  </div>
  <div class="mb-4">
    <w-title>圆形标签：round</w-title>
    <div class="flex gap-2">
      <w-tag type="primary" round>标签 1</w-tag>
      <w-tag type="success" round>标签 2</w-tag>
      <w-tag type="info" round>标签 3</w-tag>
      <w-tag type="warning" round>标签 4</w-tag>
      <w-tag type="danger" round>标签 5</w-tag>
    </div>
    <w-divider />
  </div>
  <div class="mb-4">
    <w-title>尺寸：large、default、small、mini</w-title>
    <div class="flex gap-2">
      <w-tag type="primary" size="large">标签 1</w-tag>
      <w-tag type="success">标签 2</w-tag>
      <w-tag type="info" size="small">标签 3</w-tag>
      <w-tag type="warning" size="mini">标签 4</w-tag>
    </div>
  </div>
</template>
```

:::

:::demo check-tag 的基础使用方法，check-tag 提供的 API 非常简单。

```vue
<template>
  <div class="mb-4">
    <w-title>默认样式</w-title>
    <div class="flex gap-2">
      <w-check-tag>默认</w-check-tag>
      <w-check-tag type="primary">主要</w-check-tag>
      <w-check-tag type="success">成功</w-check-tag>
    </div>
    <w-divider />
  </div>
  <div class="mb-4">
    <w-title>默认样式</w-title>
    <div class="flex gap-2">
      <w-check-tag :checked="checked" @change="onChange"
        >点我切换试试</w-check-tag
      >
      <w-check-tag :checked="checked1" type="primary" @change="onChange1">
        Tag 1
      </w-check-tag>
      <w-check-tag :checked="checked2" type="success" @change="onChange2">
        Tag 2
      </w-check-tag>
      <w-check-tag :checked="checked3" type="info" @change="onChange3">
        Tag 3
      </w-check-tag>
      <w-check-tag :checked="checked4" type="warning" @change="onChange4">
        Tag 4
      </w-check-tag>
      <w-check-tag :checked="checked5" type="danger" @change="onChange5">
        Tag 5
      </w-check-tag>
      <w-check-tag
        :checked="checked6"
        disabled
        type="success"
        @change="onChange6"
      >
        Tag 6
      </w-check-tag>
    </div>
    <w-divider />
  </div>

  <div class="mb-4">
    <w-title>禁用</w-title>
    <div class="flex gap-2 mb-4">
      <w-check-tag disabled>默认禁用</w-check-tag>
      <w-check-tag type="primary" disabled>主要禁用</w-check-tag>
      <w-check-tag type="success" disabled>成功禁用</w-check-tag>
      <w-check-tag type="danger" disabled>主要禁用</w-check-tag>
      <w-check-tag type="warning" disabled>成功禁用</w-check-tag>
      <w-check-tag type="info" disabled>普通禁用</w-check-tag>
    </div>
    <div class="flex gap-2">
      <w-check-tag checked disabled>选中默认禁用</w-check-tag>
      <w-check-tag checked type="primary" disabled>选中主要禁用</w-check-tag>
      <w-check-tag checked type="success" disabled>选中成功禁用</w-check-tag>
      <w-check-tag checked type="danger" disabled>选中主要禁用</w-check-tag>
      <w-check-tag checked type="warning" disabled>选中成功禁用</w-check-tag>
      <w-check-tag checked type="info" disabled>选中普通禁用</w-check-tag>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const checked = ref(true)
const checked1 = ref(true)
const checked2 = ref(false)
const checked3 = ref(false)
const checked4 = ref(true)
const checked5 = ref(false)
const checked6 = ref(false)

const onChange = (status: boolean) => {
  checked.value = status
}

const onChange1 = (status: boolean) => {
  checked1.value = status
}

const onChange2 = (status: boolean) => {
  checked2.value = status
}

const onChange3 = (status: boolean) => {
  checked3.value = status
}

const onChange4 = (status: boolean) => {
  checked4.value = status
}

const onChange5 = (status: boolean) => {
  checked5.value = status
}

const onChange6 = (status: boolean) => {
  checked6.value = status
}
</script>
```

:::

:::demo 设置 `closable` 属性可以定义一个标签是否可移除。 它接受一个 `Boolean`。 默认的标签移除时会附带渐变动画。 如果不想使用，可以设置 `disable-transitions` 属性，它接受一个 `Boolean`，`true` 为关闭。 当 Tag 被移除时会触发 `close` 事件。

```vue
<template>
  <div class="flex gap-2">
    <w-tag v-for="tag in tags" :key="tag.name" closable :type="tag.type">
      {{ tag.name }}
    </w-tag>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { TagProps } from 'win-design-next'

interface TagsItem {
  name: string
  type: TagProps['type']
}

const tags = ref<TagsItem[]>([
  { name: 'Tag 1', type: 'primary' },
  { name: 'Tag 2', type: 'success' },
  { name: 'Tag 3', type: 'info' },
  { name: 'Tag 4', type: 'warning' },
  { name: 'Tag 5', type: 'danger' },
])
</script>
```

:::

:::demo

```vue
<template>
  <div class="flex gap-2" style="flex-wrap: wrap">
    <w-tag
      v-for="tag in dynamicTags"
      :key="tag"
      closable
      :disable-transitions="false"
      @close="handleClose(tag)"
    >
      {{ tag }}
    </w-tag>
    <w-input
      v-if="inputVisible"
      ref="InputRef"
      v-model="inputValue"
      class="w-20"
      size="small"
      @keyup.enter="handleInputConfirm"
      @blur="handleInputConfirm"
    />
    <w-button v-else class="button-new-tag" size="small" @click="showInput">
      + New Tag
    </w-button>
  </div>
</template>

<script lang="ts" setup>
import { nextTick, ref } from 'vue'
import { WInput } from 'win-design-next'
import type { InputInstance } from 'win-design-next'

const inputValue = ref('')
const dynamicTags = ref(['Tag 1', 'Tag 2', 'Tag 3'])
const inputVisible = ref(false)
const InputRef = ref<InputInstance>()

const handleClose = (tag: string) => {
  dynamicTags.value.splice(dynamicTags.value.indexOf(tag), 1)
}

const showInput = () => {
  inputVisible.value = true
  nextTick(() => {
    InputRef.value!.input!.focus()
  })
}

const handleInputConfirm = () => {
  if (inputValue.value) {
    dynamicTags.value.push(inputValue.value)
  }
  inputVisible.value = false
  inputValue.value = ''
}
</script>
```

:::

### API 文档

### Attributes

| 属性名              | 说明             | 类型                                                                          | 默认    |
| ------------------- | ---------------- | ----------------------------------------------------------------------------- | ------- |
| type                | Tag 的类型       | ^[enum]`'primary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'danger'` | primary |
| closable            | 是否可关闭       | ^[boolean]                                                                    | false   |
| disable-transitions | 是否禁用渐变动画 | ^[boolean]                                                                    | false   |
| hit                 | 是否有边框描边   | ^[boolean]                                                                    | false   |
| color               | 背景色           | ^[string]                                                                     | —       |
| size                | Tag 的尺寸       | ^[enum]`'large' \| 'default' \| 'mini' \| 'small'`                            | —       |
| effect              | Tag 的主题       | ^[enum]`'dark' \| 'light' \| 'plain'`                                         | lighter |
| round               | Tag 是否为圆形   | ^[boolean]                                                                    | false   |

### Events

| 事件名 | 说明                  | Type                                   |
| ------ | --------------------- | -------------------------------------- |
| click  | 点击 Tag 时触发的事件 | ^[Function]`(evt: MouseEvent) => void` |
| close  | 关闭 Tag 时触发的事件 | ^[Function]`(evt: MouseEvent) => void` |

### Slots

| 名称    | 说明           |
| ------- | -------------- |
| default | 自定义默认内容 |

## CheckTag API

### Attributes

| 属性名                    | 说明          | 类型                                                                          | 默认    |
| ------------------------- | ------------- | ----------------------------------------------------------------------------- | ------- |
| checked / v-model:checked | 是否选中      | ^[boolean]                                                                    | false   |
| disabled                  | 是否禁用      | ^[boolean]                                                                    | false   |
| type                      | CheckTag 类型 | ^[enum]`'primary' \| 'success' \| 'info' \| 'warning' \| 'error' \| 'danger'` | primary |

### Events

| 事件名 | 说明                        | 类型                                  |
| ------ | --------------------------- | ------------------------------------- |
| change | 点击 Check Tag 时触发的事件 | ^[Function]`(value: boolean) => void` |

### Slots

| 名称    | 说明           |
| ------- | -------------- |
| default | 自定义默认内容 |

---

## Text

文本的常见操作

### 示例

:::demo 由 `type` 属性来选择 Text 的类型。

```vue
<template>
  <w-text class="mx-1">Default</w-text>
  <w-text class="mx-1" type="primary">Primary</w-text>
  <w-text class="mx-1" type="success">Success</w-text>
  <w-text class="mx-1" type="info">Info</w-text>
  <w-text class="mx-1" type="warning">Warning</w-text>
  <w-text class="mx-1" type="danger">Danger</w-text>
  <w-text class="mx-1" type="error">Error</w-text>
</template>
```

:::

:::demo 使用 `size` 属性配置尺寸，可选的尺寸大小有: `large`, `default` 或 `small`

```vue
<template>
  <w-text class="mx-1" size="large">Large</w-text>
  <w-text class="mx-1">Default</w-text>
  <w-text class="mx-1" size="small">Small</w-text>
</template>
```

:::

:::demo 通过 `truncated` 属性，在文本超过视图或最大宽度设置时展示省略符。 通过 `line-clamp` 属性控制多行的样式

```vue
<template>
  <w-text class="w-150px mb-2" truncated> Self element set width 100px </w-text>
  <w-row class="w-150px mb-2">
    <w-text truncated>Squeezed by parent element</w-text>
  </w-row>
  <w-text line-clamp="2">
    The -webkit-line-clamp CSS property<br />
    allows limiting of the contents of<br />
    a block to the specified number of lines.
  </w-text>
</template>
```

:::

:::demo 使用属性 `tag` 覆盖元素

```vue
<template>
  <w-space direction="vertical">
    <w-text>span</w-text>
    <w-text tag="p">This is a paragraph.</w-text>
    <w-text tag="b">Bold</w-text>
    <w-text tag="i">Italic</w-text>
    <w-text>
      This is
      <w-text tag="sub" size="small">subscript</w-text>
    </w-text>
    <w-text>
      This is
      <w-text tag="sup" size="small">superscript</w-text>
    </w-text>
    <w-text tag="ins">Inserted</w-text>
    <w-text tag="del">Deleted</w-text>
    <w-text tag="mark">Marked</w-text>
  </w-space>
</template>
```

:::

:::demo 混合使用 Text 组件

```vue
<template>
  <w-space direction="vertical">
    <w-text>
      <w-icon>
        <Edit />
      </w-icon>
      Edit
    </w-text>
    <w-row>
      <w-text>Rate</w-text>
      <w-rate class="ml-1" />
    </w-row>
    <w-text>
      This is text mixed icon
      <w-icon>
        <Bell />
      </w-icon>
      and component
      <w-button>Button</w-button>
    </w-text>
  </w-space>
</template>

<script lang="ts" setup>
import { Bell, Edit } from '@win-design-next/icons-vue'
</script>
```

:::

### API 文档

### Attributes

| 属性名     | 描述           | 类型                                                                          | 默认值  |
| ---------- | -------------- | ----------------------------------------------------------------------------- | ------- |
| type       | 类型           | ^[enum]`'primary' \| 'success' \| 'warning' \| 'danger' \| 'error' \| 'info'` | —       |
| size       | 大小           | ^[enum]`'large' \| 'default' \| 'small'`                                      | default |
| truncated  | 显示省略号     | ^[boolean]                                                                    | false   |
| line-clamp | 最大行数       | ^[string] / ^[number]                                                         | —       |
| tag        | 自定义元素标签 | ^[string]                                                                     | span    |

### Slots

| 名称    | 详情     |
| ------- | -------- |
| default | 默认内容 |

---

## Timeline 时间线

可视化地呈现时间流信息。

### 示例

:::demo

```vue
<template>
  <w-timeline style="max-width: 600px">
    <w-timeline-item
      v-for="(activity, index) in activities"
      :key="index"
      :timestamp="activity.timestamp"
    >
      {{ activity.content }}
    </w-timeline-item>
  </w-timeline>
</template>

<script lang="ts" setup>
const activities = [
  {
    content: '申请',
    timestamp: '2025-07-15',
  },
  {
    content: '审阅',
    timestamp: '2025-07-13',
  },
  {
    content: '指派',
    timestamp: '2025-07-11',
  },
]
</script>
```

:::

:::demo

```vue
<template>
  <w-timeline mode="horizontal" class="mt-4">
    <w-timeline-item
      v-for="(activity, index) in activities"
      :key="index"
      :timestamp="activity.timestamp"
    >
      {{ activity.content }}
    </w-timeline-item>
  </w-timeline>
  <w-timeline mode="horizontal" class="mt-12">
    <w-timeline-item
      v-for="(activity, index) in activities"
      :key="index"
      placement="top"
      :timestamp="activity.timestamp"
    >
      {{ activity.content }}
    </w-timeline-item>
  </w-timeline>
  <w-timeline mode="horizontal" class="mt-12">
    <w-timeline-item
      v-for="(activity, index) in activities"
      :key="index"
      placement="header"
      :timestamp="activity.timestamp"
    >
      {{ activity.content }}
    </w-timeline-item>
  </w-timeline>
  <w-timeline mode="horizontal" class="mt-12">
    <w-timeline-item
      v-for="(activity, index) in activities"
      :key="index"
      content-placement="header"
      :timestamp="activity.timestamp"
    >
      {{ activity.content }}
    </w-timeline-item>
  </w-timeline>
</template>

<script lang="ts" setup>
const activities = [
  {
    content: '申请',
    timestamp: '2025-07-15',
  },
  {
    content: '审阅',
    timestamp: '2025-07-13',
  },
  {
    content: '指派',
    timestamp: '2025-07-11',
  },
]
</script>
```

:::

:::demo

```vue
<template>
  <w-timeline style="max-width: 600px">
    <w-timeline-item
      v-for="(activity, index) in activities"
      :key="index"
      :icon="activity.icon"
      :type="activity.type"
      :color="activity.color"
      :size="activity.size"
      :hollow="activity.hollow"
      :timestamp="activity.timestamp"
    >
      {{ activity.content }}
    </w-timeline-item>
  </w-timeline>
</template>

<script lang="ts" setup>
import { OthersFilled } from '@win-design-next/icons-vue'
import type { TimelineItemProps } from 'win-design-next'

interface ActivityType extends Partial<TimelineItemProps> {
  content: string
}

const activities: ActivityType[] = [
  {
    content: 'Custom icon',
    timestamp: '2025-07-12 20:46',
    size: 'large',
    type: 'primary',
    icon: OthersFilled,
  },
  {
    content: 'Custom color',
    timestamp: '2025-07-03 20:46',
    color: '#0bbd87',
  },
  {
    content: 'Custom size',
    timestamp: '2025-07-03 20:46',
    size: 'large',
  },
  {
    content: 'Custom hollow',
    timestamp: '2025-07-03 20:46',
    type: 'error',
    hollow: true,
  },
  {
    content: 'Default node',
    timestamp: '2025-07-03 20:46',
  },
]
</script>
```

:::

:::demo

```vue
<template>
  <w-timeline style="max-width: 600px">
    <w-timeline-item timestamp="2025-07-22 10:42:34" placement="top">
      手术预约成功
      <div class="card-wrapper">
        <span>执行医生: 李力群</span>
        <span>具体时刻: 10:00:56</span>
      </div>
    </w-timeline-item>
    <w-timeline-item timestamp="2025-07-24 10:42:34" placement="top">
      执行手术
      <div class="card-wrapper">
        <span>执行医生: 李力群</span>
        <span>具体时刻: 13:00:08</span>
      </div>
    </w-timeline-item>
    <w-timeline-item timestamp="2025-07-26 10:42:34" placement="top">
      完成手术
      <div class="card-wrapper">
        <span>执行医生: 李力群</span>
        <span>具体时刻: 15:10:23</span>
      </div>
    </w-timeline-item>
  </w-timeline>
</template>
```

:::

:::demo

```vue
<template>
  <w-timeline style="max-width: 600px">
    <w-timeline-item center timestamp="2025-07-01" placement="top">
      <w-card>
        <h6>标题</h6>
        <p>2025-07-01 20:46</p>
      </w-card>
    </w-timeline-item>
    <w-timeline-item center timestamp="2025-07-01" placement="top">
      <w-card>
        <h6>标题</h6>
        <p>2025-07-01 20:46</p>
      </w-card>
    </w-timeline-item>
    <w-timeline-item center timestamp="2025-07-01" placement="top">
      Event start
    </w-timeline-item>
    <w-timeline-item center timestamp="2025-07-01" placement="top">
      Event end
    </w-timeline-item>
  </w-timeline>
</template>
```

:::

### API 文档

### Attributes

| 参数 | 说明 | 类型                                | 默认值   | Version |
| ---- | ---- | ----------------------------------- | -------- | ------- |
| mode | 模式 | ^[enum]`'horizontal' \| 'vertical'` | vertical | V0.0.8  |

### Slots

| 插槽名  | 说明                          | 子标签        |
| ------- | ----------------------------- | ------------- |
| default | timeline 组件的自定义默认内容 | Timeline-Item |

## Timeline-Item API

### Attributes

| 参数              | 说明           | 类型                                                                          | 默认值 | Version |
| ----------------- | -------------- | ----------------------------------------------------------------------------- | ------ | ------- |
| timestamp         | 时间戳         | ^[string]                                                                     | ''     |
| hide-timestamp    | 是否隐藏时间戳 | ^[boolean]                                                                    | false  |
| center            | 是否垂直居中   | ^[boolean]                                                                    | false  |
| placement         | 时间戳位置     | ^[enum]`'top' \| 'header' \| 'bottom'`                                        | bottom |
| type              | 节点类型       | ^[enum]`'primary' \| 'success' \| 'warning' \| 'danger' \| 'error' \| 'info'` | ''     |
| color             | 节点颜色       | ^[enum]`'hsl' \| 'hsv' \| 'hex' \| 'rgb'`                                     | ''     |
| size              | 节点尺寸       | ^[enum]`'normal' \| 'large'`                                                  | normal |
| icon              | 自定义图标     | ^[string] / ^[Component]                                                      | —      |
| hollow            | 是否空心点     | ^[boolean]                                                                    | false  |
| content-placement | 内容位置       | ^[enum]`'' \| 'header'`                                                       | -      | V0.0.8  |

### Slots

| 插槽名  | 说明                                        |
| ------- | ------------------------------------------- |
| default | customize default content for timeline item |
| dot     | customize defined node for timeline item    |

---

## Title 标题

默认 slot 方式或 title 参数的方式都可以展示标题内容。

### 示例

:::demo

```vue
<template>
  <div class="">
    <w-title>默认标题</w-title>
    <w-divider />
    <w-title round>圆角标题</w-title>
    <w-divider />
    <w-title :round="false">
      个人详情
      <template #suf-append>
        <w-button text type="primary" :icon="Search">搜索</w-button>
      </template>
    </w-title>
  </div>
</template>

<script setup lang="ts">
import { Search } from '@win-design-next/icons-vue'
</script>
```

:::

### API 文档

### Attributes

| 参数   | 说明             | 类型    | 可选值 | 默认值   | Version |
| ------ | ---------------- | ------- | ------ | -------- | ------- |
| title  | 标题内容         | String  | —      | —        |
| round  | 是否需要圆角样式 | Boolean | —      | false    |         |
| margin | 间距             | String  | —      | 0 0 16px |         |

### Slot

| 名称       | 说明               |
| ---------- | ------------------ |
| default    | 自定义标题内容     |
| suf-append | 自定义标题后缀内容 |

---

## <WBadge value="beta">Tree V2 虚拟化树形控件</WBadge>

不论你的数据量多大，虚拟树都能毫无压力地处理。

### 示例

:::demo

```vue
<template>
  <w-tree-v2
    style="max-width: 600px"
    :data="data"
    :props="props"
    highlight-current
    :height="208"
  />
</template>

<script lang="ts" setup>
interface Tree {
  id: string
  label: string
  children?: Tree[]
}

const getKey = (prefix: string, id: number) => {
  return `${prefix}-${id}`
}

const createData = (
  maxDeep: number,
  maxChildren: number,
  minNodesNumber: number,
  deep = 1,
  key = '节点'
): Tree[] => {
  let id = 0
  return Array.from({ length: minNodesNumber })
    .fill(deep)
    .map(() => {
      const childrenNumber =
        deep === maxDeep ? 0 : Math.round(Math.random() * maxChildren)
      const nodeKey = getKey(key, ++id)
      return {
        id: nodeKey,
        label: nodeKey,
        children: childrenNumber
          ? createData(maxDeep, maxChildren, childrenNumber, deep + 1, nodeKey)
          : undefined,
      }
    })
}

const props = {
  value: 'id',
  label: 'label',
  children: 'children',
}
const data = createData(4, 30, 40)
</script>
```

:::

:::demo

```vue
<template>
  <w-tree-v2
    style="max-width: 600px"
    :data="data"
    :props="props"
    show-checkbox
    :height="208"
  />
</template>

<script lang="ts" setup>
interface Tree {
  id: string
  label: string
  children?: Tree[]
}

const getKey = (prefix: string, id: number) => {
  return `${prefix}-${id}`
}

const createData = (
  maxDeep: number,
  maxChildren: number,
  minNodesNumber: number,
  deep = 1,
  key = '节点'
): Tree[] => {
  let id = 0
  return Array.from({ length: minNodesNumber })
    .fill(deep)
    .map(() => {
      const childrenNumber =
        deep === maxDeep ? 0 : Math.round(Math.random() * maxChildren)
      const nodeKey = getKey(key, ++id)
      return {
        id: nodeKey,
        label: nodeKey,
        children: childrenNumber
          ? createData(maxDeep, maxChildren, childrenNumber, deep + 1, nodeKey)
          : undefined,
      }
    })
}

const props = {
  value: 'id',
  label: 'label',
  children: 'children',
}
const data = createData(4, 30, 40)
</script>
```

:::

:::demo 在示例中，属性在 defaultProps 中声明了 `disabled`，一些节点被设置为 `disabled：true`。 相应的复选框已禁用，不能点击。

```vue
<template>
  <w-tree-v2
    style="max-width: 600px"
    :data="data"
    :props="props"
    show-checkbox
    :height="208"
  />
</template>

<script lang="ts" setup>
interface Tree {
  id: string
  label: string
  children?: Tree[]
  disabled: boolean
}

const getKey = (prefix: string, id: number) => {
  return `${prefix}-${id}`
}

const createData = (
  maxDeep: number,
  maxChildren: number,
  minNodesNumber: number,
  deep = 1,
  key = '节点'
): Tree[] => {
  let id = 0
  return Array.from({ length: minNodesNumber })
    .fill(deep)
    .map(() => {
      const childrenNumber =
        deep === maxDeep ? 0 : Math.round(Math.random() * maxChildren)
      const nodeKey = getKey(key, ++id)
      return {
        id: nodeKey,
        label: nodeKey,
        children: childrenNumber
          ? createData(maxDeep, maxChildren, childrenNumber, deep + 1, nodeKey)
          : undefined,
        disabled: nodeKey.includes('2'),
      }
    })
}

const props = {
  value: 'id',
  label: 'label',
  children: 'children',
  disabled: 'disabled',
}
const data = createData(4, 30, 40)
</script>
```

:::

:::demo 分别通过 `default-expanded-keys` 和 `default-checked-keys` 设置默认展开和默认选中的节点。

```vue
<template>
  <w-tree-v2
    style="max-width: 600px"
    :data="data"
    :height="208"
    :props="props"
    show-checkbox
    :default-checked-keys="defaultCheckedKeys"
    :default-expanded-keys="defaultExpandedKeys"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

interface Tree {
  id: string
  label: string
  children?: Tree[]
}

const getKey = (prefix: string, id: number) => {
  return `${prefix}-${id}`
}

const createData = (
  maxDeep: number,
  maxChildren: number,
  minNodesNumber: number,
  deep = 1,
  key = '节点'
): Tree[] => {
  let id = 0
  return Array.from({ length: minNodesNumber })
    .fill(deep)
    .map(() => {
      const childrenNumber =
        deep === maxDeep ? 0 : Math.round(Math.random() * maxChildren)
      const nodeKey = getKey(key, ++id)
      return {
        id: nodeKey,
        label: nodeKey,
        children: childrenNumber
          ? createData(maxDeep, maxChildren, childrenNumber, deep + 1, nodeKey)
          : undefined,
      }
    })
}

const props = {
  value: 'id',
  label: 'label',
  children: 'children',
}
const data = createData(4, 30, 40)
const checkedKeys: string[] = []
const expanedKeys: string[] = []
for (const datum of data) {
  const children = datum.children
  if (children) {
    expanedKeys.push(datum.id)
    checkedKeys.push(children[0].id)
    break
  }
}

const defaultCheckedKeys = ref(checkedKeys)
const defaultExpandedKeys = ref(expanedKeys)
</script>
```

:::

:::demo

```vue
<template>
  <w-tree-v2 style="max-width: 600px" :data="data" :props="props" :height="208">
    <template #default="{ node }">
      <span class="prefix" :class="{ 'is-leaf': node.isLeaf }"
        >[WinDesignNext]</span
      >
      <span>{{ node.label }}</span>
    </template>
  </w-tree-v2>
</template>

<script lang="ts" setup>
interface Tree {
  id: string
  label: string
  children?: Tree[]
}

const getKey = (prefix: string, id: number) => {
  return `${prefix}-${id}`
}

const createData = (
  maxDeep: number,
  maxChildren: number,
  minNodesNumber: number,
  deep = 1,
  key = '节点'
): Tree[] => {
  let id = 0
  return Array.from({ length: minNodesNumber })
    .fill(deep)
    .map(() => {
      const childrenNumber =
        deep === maxDeep ? 0 : Math.round(Math.random() * maxChildren)
      const nodeKey = getKey(key, ++id)
      return {
        id: nodeKey,
        label: nodeKey,
        children: childrenNumber
          ? createData(maxDeep, maxChildren, childrenNumber, deep + 1, nodeKey)
          : undefined,
      }
    })
}

const props = {
  value: 'id',
  label: 'label',
  children: 'children',
}
const data = createData(4, 30, 40)
</script>

<style scoped>
.prefix {
  color: var(--w3-color-primary);
  margin-right: 10px;
}
.prefix.is-leaf {
  color: var(--w3-color-success);
}
</style>
```

:::

:::demo

```vue
<template>
  <w-tree-v2
    style="max-width: 600px"
    :data="data"
    show-checkbox
    :expand-on-click-node="false"
    :props="{ class: customNodeClass }"
  />
</template>

<script lang="ts" setup>
import type { TreeNode, TreeNodeData } from 'win-design-next'

interface Tree {
  id?: string
  value?: string
  label?: string
  isPenultimate?: boolean
  children?: Tree[]
}

const customNodeClass = ({ isPenultimate }: TreeNodeData, node: TreeNode) =>
  isPenultimate ? 'is-penultimate' : ''

const data: Tree[] = [
  {
    id: '1',
    label: 'Level one 1',
    children: [
      {
        id: '4',
        label: 'Level two 1-1',
        isPenultimate: true,
        children: [
          {
            id: '9',
            label: 'Level three 1-1-1',
          },
          {
            id: '10',
            label: 'Level three 1-1-2',
          },
        ],
      },
    ],
  },
  {
    id: '2',
    label: 'Level one 2',
    isPenultimate: true,
    children: [
      {
        id: '5',
        label: 'Level two 2-1',
      },
      {
        id: '6',
        label: 'Level two 2-2',
      },
    ],
  },
  {
    id: '3',
    label: 'Level one 3',
    isPenultimate: true,
    children: [
      {
        id: '7',
        label: 'Level two 3-1',
      },
      {
        id: '8',
        label: 'Level two 3-2',
      },
    ],
  },
]
</script>

<style>
.is-penultimate > .w3-tree-node__content {
  color: var(--w3-color-primary);
}
</style>
```

:::

:::demo 在需要对节点进行过滤时，调用 Tree 实例的 `filter` 方法， 参数为关键字。 需要注意的是，此时需要设置 `filter-method`，值为过滤函数。

```vue
<template>
  <w-input
    v-model="query"
    style="width: 240px"
    placeholder="Please enter keyword"
    @input="onQueryChanged"
  />
  <w-tree-v2
    ref="treeRef"
    style="max-width: 600px"
    :data="data"
    :props="props"
    :filter-method="filterMethod"
    :height="208"
  />
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { WTreeV2 } from 'win-design-next'
import type { TreeNodeData } from 'win-design-next/es/components/tree-v2/src/types'

interface Tree {
  id: string
  label: string
  children?: Tree[]
}

const getKey = (prefix: string, id: number) => `${prefix}-${id}`

const createData = (
  maxDeep: number,
  maxChildren: number,
  minNodesNumber: number,
  deep = 1,
  key = '节点'
): Tree[] => {
  let id = 0
  return Array.from({ length: minNodesNumber })
    .fill(deep)
    .map(() => {
      const childrenNumber =
        deep === maxDeep ? 0 : Math.round(Math.random() * maxChildren)
      const nodeKey = getKey(key, ++id)
      return {
        id: nodeKey,
        label: nodeKey,
        children: childrenNumber
          ? createData(maxDeep, maxChildren, childrenNumber, deep + 1, nodeKey)
          : undefined,
      }
    })
}

const query = ref('')
const treeRef = ref<InstanceType<typeof WTreeV2>>()
const data = createData(4, 30, 5)
const props = {
  value: 'id',
  label: 'label',
  children: 'children',
}

const onQueryChanged = (query: string) => {
  treeRef.value!.filter(query)
}
const filterMethod = (query: string, node: TreeNodeData) =>
  node.label!.includes(query)
</script>
```

:::

### API 文档

### Attributes

| 属性名                | 说明                                                                                                           | 类型                        | 默认值 |
| --------------------- | -------------------------------------------------------------------------------------------------------------- | --------------------------- | ------ |
| data                  | 展示数据                                                                                                       | array                       | —      |
| empty-text            | 内容为空的时候展示的文本                                                                                       | string                      | —      |
| props                 | 配置选项，具体看下表                                                                                           | object                      | —      |
| highlight-current     | 是否高亮当前选中节点                                                                                           | boolean                     | false  |
| expand-on-click-node  | 是否在点击节点的时候展开或者收缩节点， 默认值为 true，如果为 false，则只有点箭头图标的时候才会展开或者收缩节点 | boolean                     | true   |
| check-on-click-node   | 是否在点击节点的时候选中节点，默认值为 false，即只有在点击复选框时才会选中节点                                 | boolean                     | false  |
| default-expanded-keys | 默认展开的节点的 key 的数组                                                                                    | array                       | —      |
| show-checkbox         | 节点是否可被选择                                                                                               | boolean                     | false  |
| check-strictly        | 在显示复选框的情况下，是否严格的遵循父子不互相关联的做法，默认为 false                                         | boolean                     | false  |
| default-checked-keys  | 默认勾选的节点的 key 的数组                                                                                    | array                       | —      |
| current-node-key      | 当前选中的节点                                                                                                 | string / number             | —      |
| filter-method         | 对树节点进行筛选时执行的方法，返回 true 表示这个节点可以显示， 返回 `false` 则表示这个节点会被隐藏             | Function(value, data, node) | —      |
| indent                | 相邻级节点间的水平缩进，单位为像素                                                                             | number                      | 16     |
| icon                  | 自定义树节点的图标                                                                                             | `string \| Component`       | —      |
| item-size             | 自定义树节点的高度                                                                                             | number                      | 26     |

### props

| 属性     | 说明                                                     | 类型                                            | 默认值   |
| -------- | -------------------------------------------------------- | ----------------------------------------------- | -------- |
| value    | 每个树节点用来作为唯一标识的属性，在整棵树中应该是唯一的 | string                                          | id       |
| label    | 指定节点标签为节点对象的某个属性值                       | string                                          | label    |
| children | 指定子树为节点对象的某个属性值                           | string                                          | children |
| disabled | 指定节点选择框是否禁用为节点对象的某个属性值             | string                                          | disabled |
| class    | 自定义节点类名                                           | ^[string] / ^[Function]`(data, node) => string` | —        |

### 方法

Tree 内部使用 TreeNode 类型的对象来包装用户传入的数据，用来构造树节点之间的关系。 `Tree` 暴露了以下方法：
| Method | 说明 | 参数 |
| --------------------- | ----------------------------------------------------------- | ------------------------------------------------------------------------ |
| filter | 对树节点进行筛选操作 | `(query: string)` |
| getCheckedNodes | 若节点可被选择（即`show-checkbox`为 `true`），则返回目前被选中的节点所组成的数组 | `(leafOnly: boolean)` |
| getCheckedKeys | 若节点可被选择（即 `show-checkbox` 为 `true`），则返回目前被选中的节点的 key 所组成的数组 | `(leafOnly: boolean)` |
| setCheckedKeys | 通过 keys 设置目前勾选的节点 | `(keys: TreeKey[])` |
| setChecked | 通过 key 设置某个节点的勾选状态 | `(key: TreeKey, checked: boolean)` |
| setExpandedKeys | 设置当前展开的节点 | `(keys: TreeKey[])` |
| getHalfCheckedNodes | 如果节点可用被选中 (`show-checkbox` 为 `true`), 它将返回当前半选中的节点组成的数组 | — |
| getHalfCheckedKeys | 若节点可被选中(`show-checkbox` 为 `true`)，则返回目前半选中的节点的 key 所组成的数组 | — |
| getCurrentKey | 获取当前被选中节点的 key，若没有节点被选中则返回 `undefined` | — |
| getCurrentNode | 获取当前被选中节点的 data，若没有节点被选中则返回 `undefined` | — |
| setCurrentKey | 通过 key 设置某个节点的当前选中状态 | `(key: TreeKey)` |
| getNode | 通过 key 或 data 获取节点 | `(data: TreeKey \| TreeNodeData)` |
| expandNode | 展开指定节点 | `(node: TreeNode)` |
| collapseNode | 折叠指定节点 | `(node: TreeNode)` |
| setData | 当数据量非常庞大的时候，总是使用响应式数据将导致性能表现不佳，所以我们提供一种显式设置的方式来避免此种情况 | `(data: TreeData)` |
| scrollTo | 滚动到给定位置 | `(offset: number)` |
| scrollToNode | 使用给定的滚动策略滚动至指定位置 | `(key: TreeKey, strategy?: auto \| smart \| center \| start \| end)` |

### Events

| 事件名           | 说明                               | 参数                                                                                                                                    |
| ---------------- | ---------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| node-click       | 当节点被点击的时候触发             | `(data: TreeNodeData, node: TreeNode, e: MouseEvent)`                                                                                   |
| node-drop        | 拖放到节点时触发器                 | `(data: TreeNodeData, node: TreeNode, e: DragEvent)`                                                                                    |
| node-contextmenu | 当节点被鼠标右键点击时会触发该事件 | `(e: Event, data: TreeNodeData, node: TreeNode)`                                                                                        |
| check-change     | 节点选中状态发生变化时的回调       | `(data: TreeNodeData, checked: boolean)`                                                                                                |
| check            | 当复选框被点击的时候触发           | `(data: TreeNodeData, info: { checkedKeys: TreeKey[],checkedNodes: TreeData, halfCheckedKeys: TreeKey[], halfCheckedNodes: TreeData,})` |
| current-change   | 当前选中节点变化时触发的事件       | `(data: TreeNodeData, node: TreeNode)`                                                                                                  |
| node-expand      | 节点被展开时触发的事件             | `(data: TreeNodeData, node: TreeNode)`                                                                                                  |
| node-collapse    | 节点被收起时触发的事件             | `(data: TreeNodeData, node: TreeNode)`                                                                                                  |

### Slots

| 名称  | 说明                                                                       |
| ----- | -------------------------------------------------------------------------- |
| -     | 自定义树节点的内容。 作用域参数为 `{ node: TreeNode, data: TreeNodeData }` |
| empty | 当数据为空时自定义的内容                                                   |

---

