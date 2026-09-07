## 设计稿标准尺寸
- **标准尺寸**: 1920 × 1080px
- **最小适配尺寸**: 1366 × 768px

## 字体规范
- **基础字号**: 14px
- **小字**: 12px
- **标题**: 16px

## 主题色

### 基础主题色
- **主题色**: `#2d5afa`

### CSS 变量定义

```css
:root {
  color-scheme: light;

  --w3-color-primary: #2d5afa;
  --w3-color-primary-active-bg: #c9d6fb;
  --w3-color-primary-hover: #5175f4;
  --w3-color-primary-press: #1d39c4;
  --w3-color-primary-plain: #eaeefe;
  --w3-color-primary-light: rgba(45, 90, 250, .2);
  --w3-color-primary-lighter: rgba(45, 90, 250, .1);
  --w3-color-primary-dark-2: #2448c8;

  --w3-color-success: #00ab44;
  --w3-color-success-hover: #08c955;
  --w3-color-success-press: #186c3a;
  --w3-color-success-plain: #e8f6ee;
  --w3-color-success-light: rgba(0, 171, 68, .2);
  --w3-color-success-lighter: rgba(0, 171, 68, .1);
  --w3-color-success-dark-2: rgb(0, 136.8, 54.4);

  --w3-color-warning: #ff8c00;
  --w3-color-warning-hover: #ffac48;
  --w3-color-warning-press: #db5b03;
  --w3-color-warning-plain: #fff0df;
  --w3-color-warning-light: rgba(255, 140, 0, .2);
  --w3-color-warning-lighter: rgba(255, 140, 0, .1);
  --w3-color-warning-dark-2: #cc7000;

  --w3-color-danger: #ec0000;
  --w3-color-danger-hover: #ff5555;
  --w3-color-danger-press: #b61e1e;
  --w3-color-danger-plain: #ffe7e7;
  --w3-color-danger-light: rgba(236, 0, 0, .2);
  --w3-color-danger-lighter: rgba(236, 0, 0, .1);
  --w3-color-danger-dark-2: rgb(188.8, 0, 0);

  --w3-color-error: #ec0000;
  --w3-color-error-hover: #ff5555;
  --w3-color-error-press: #b61e1e;
  --w3-color-error-plain: #ffe7e7;
  --w3-color-error-light: rgba(236, 0, 0, .2);
  --w3-color-error-lighter: rgba(236, 0, 0, .1);
  --w3-color-error-dark-2: rgb(188.8, 0, 0);

  --w3-color-info: #999999;
  --w3-color-info-hover: #b1b1b1;
  --w3-color-info-press: #7d7d7d;
  --w3-color-info-plain: #f4f3f3;
  --w3-color-info-light: rgba(153, 153, 153, .2);
  --w3-color-info-lighter: rgba(153, 153, 153, .1);
  --w3-color-info-dark-2: rgb(122.4, 122.4, 122.4);

  --w3-bg-color: #ffffff;
  --w3-bg-color-page: var(--w3-color-primary-plain);
  --w3-bg-color-overlay: #ffffff;
  --w3-bg-color-active-bg: var(--w3-color-primary-active-bg);
  --w3-bg-color-light: #eef2fd;
  --w3-bg-color-lighter: #f5f7fa;

  --w3-font-color-normal: #000000;
  --w3-font-color-second: #666666;
  --w3-font-color-third: #999999;
  --w3-font-color-placeholder: #999999;
  --w3-font-color-disabled: #999999;
  --w3-font-color-dark-disabled: #000000;

  --w3-border-color: #c9c9c9;
  --w3-border-color-light: #e9e9e9;
  --w3-border-color-lighter: #f0f0f0;
  --w3-border-color-focus: rgba(45, 90, 250, .1);
  --w3-border-color-dark: #bababa;

  --w3-fill-color: #c9c9c9;
  --w3-fill-color-light: #e9e9e9;
  --w3-fill-color-lighter: #fafafa;
  --w3-fill-color-blank: #ffffff;
  --w3-fill-color-extra-light: #f5f7fa;

  --w3-box-shadow: 0px 2px 12px 0 rgba(0, 0, 0, .1);
  --w3-box-shadow-light: 0px 0px 12px rgba(0, 0, 0, .1);
  --w3-box-shadow-lighter: 0px 0px 6px rgba(0, 0, 0, .1);
  --w3-box-shadow-dark: 2px 0 4px 0 rgba(0, 0, 0, .2);

  --w3-disabled-bg-color: var(--w3-fill-color-light);
  --w3-disabled-font-color-light: var(--w3-font-color-disabled);
  --w3-disabled-font-color: var(--w3-font-color-dark-disabled);
  --w3-disabled-border-color: var(--w3-border-color);

  --w3-overlay-color: rgba(0, 0, 0, .8);
  --w3-overlay-color-light: rgba(0, 0, 0, .7);
  --w3-overlay-color-lighter: rgba(0, 0, 0, .5);

  --w3-mask-color: rgba(255, 255, 255, .9);
  --w3-mask-color-extra-light: rgba(255, 255, 255, .3);

  --w3-border-width: 1px;
  --w3-border-style: solid;
  --w3-border-color-hover: var(--w3-color-primary);
  --w3-border: var(--w3-border-width) var(--w3-border-style) var(--w3-border-color);

  --w3-svg-monochrome-grey: var(--w3-border-color);
}
```

## 组件库
- **使用的组件库**: win-design-next

## 间距规范
间距要求：`16px` `12px` `8px` `4px`

---


# 快速开始

:::warning

如果你发现部分组件 `v-model` 绑定的值失效，请检查是否开启了`兼容模式（compat）`。在兼容模式下，需要将 `v-model` 改写为 `v-model:model-value`。
:::

## 🧀 完整引入

```ts [main.ts]
import { createApp } from 'vue'
import WinDesignNext from 'win-design-next'
import 'win-design-next/dist/index.css'
import App from './App.vue'

const app = createApp(App)

app.use(WinDesignNext)
app.mount('#app')
```

### Volar 支持

如果您使用 Volar，请在 `tsconfig.json` 中通过 `compilerOptions.type` 指定全局组件类型。

```json [tsconfig.json]
{
  "compilerOptions": {
    // ...
    "types": ["win-design-next/global"]
  }
}
```

## 全局配置

在引入 WinDesignNext 时，可以传入一个包含 `size` 和 `zIndex` 属性的全局配置对象。 `size` 用于设置表单组件的默认尺寸，`zIndex` 用于设置弹出组件的层级，`zIndex` 的默认值为 `2000`。

完整引入：

```ts [main.ts]
import { createApp } from 'vue'
import WinDesignNext from 'win-design-next'
import App from './App.vue'

const app = createApp(App)
app.use(WinDesignNext, { size: 'small', zIndex: 3000 })
```

按需引入:

```vue [App.vue]
<template>
  <w-config-provider :size="size" :z-index="zIndex">
    <app />
  </w-config-provider>
</template>

<script>
import { defineComponent } from 'vue'
import { WConfigProvider } from 'win-design-next'

export default defineComponent({
  components: {
    WConfigProvider,
  },
  setup() {
    return {
      zIndex: 3000,
      size: 'small',
    }
  },
})
</script>
```

## 开始使用

现在你可以启动项目了。 对于每个组件的用法，请查阅 [对应的独立文档](http://wued.winning-health.com.cn:8088/win-design-next/zh-CN/component/button.html)。

---

# 快速上手

## 📦 安装

:::warning

**WinDesign Next 组件库包发布在公司内部服务器中**, 为了避免每次安装都需要指定 registry 的麻烦, 推荐开发者使用 nrm 对 npm 源进行管理。

:::

```shell
npm config set registry http://172.16.9.57:8081/repository/npm-group/
```

::: code-group

```shell [pnpm]
$ pnpm install win-design-next --registry http://172.16.9.57:8081/repository/npm-group/
```

```shell [yarn]
$ yarn add win-design-next --registry http://172.16.9.57:8081/repository/npm-group/
```

```shell [npm]
$ npm install win-design-next --registry http://172.16.9.57:8081/repository/npm-group/ --save
```

:::

## 🤝 联系我们

大家可以扫描「钉钉二维码」或者「企业微信二维码」加入 WinDesign 交流群，交流有关组件库的问题、意见、需求等，期待大家积极参与、反馈。

<img src="http://wued.winning-health.com.cn:8088/wued-assets/wechat.png" alt="微信图标" width="492" height="350" />

## 兼容性

WinDesign Next 支持最近两个版本的浏览器。

如果您需要支持旧版本的浏览器，请自行添加 [Babel](https://babeljs.io/) 和相应的 Polyfill 。

由于 Vue 3 不再支持 IE11，WinDesign Next 也不再支持 IE 浏览器。

| 版本    | ![Chrome](https://cdn.jsdelivr.net/npm/@browser-logos/chrome/chrome_32x32.png) <br> Chrome | ![IE](https://cdn.jsdelivr.net/npm/@browser-logos/edge/edge_32x32.png) <br> Edge | ![Firefox](https://cdn.jsdelivr.net/npm/@browser-logos/firefox/firefox_32x32.png) <br> Firefox | ![Safari](https://cdn.jsdelivr.net/npm/@browser-logos/safari/safari_32x32.png) <br> Safari |
| ------- | ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| 0.0.7 + | Chrome ≥ 85                                                                                | Edge ≥ 85                                                                        | Firefox ≥ 79                                                                                   | Safari ≥ 14.1                                                                              |

### Sass

[Sass](https://github.com/sass) 的最低支持版本为 `1.79.0`.

如果您的终端提示 `legacy JS API Deprecation Warning`, 您可以配置以下代码在 [vite.config.ts](https://vitejs.dev/config/shared-options.html#css-preprocessoroptions) 中.

```ts{3}
css: {
  preprocessorOptions: {
    scss: { api: 'modern-compiler' },
  }
}
```

如果是通过包管理器安装，并希望配合打包工具使用，请阅读下一节：[快速上手](/zh-CN/component/quickstart)。

---

# Icon 图标

WinDesign Next 提供了一套常用的图标集合。

## 使用图标

- 如果你想像用例一样**直接使用**，你需要[全局注册组件](https://v3.vuejs.org/guide/component-registration.html#global-registration)，才能够直接在项目里使用。

## 安装

### 使用包管理器

::: code-group

```shell [npm]
$ npm install @win-design-next/icons-vue
```

```shell [yarn]
$ yarn add @win-design-next/icons-vue
```

```shell [pnpm]
$ pnpm install @win-design-next/icons-vue
```

:::

### 注册所有图标

您需要从 `@win-design-next/icons-vue` 中导入所有图标并进行全局注册。

```ts
// main.ts

import * as WinDesignNextIconsVue from '@win-design-next/icons-vue'

const app = createApp(App)
for (const [key, component] of Object.entries(WinDesignNextIconsVue)) {
  app.component(key, component)
}
```

### 自动导入

使用 [unplugin-icons](https://github.com/antfu/unplugin-icons) 和 [unplugin-auto-import](https://github.com/antfu/unplugin-auto-import) 从 iconify 中自动导入任何图标集。

## 基础用法

```vue
<!-- 使用 w-icon 为 SVG 图标提供属性 -->
<template>
  <div>
    <w-icon :size="size" :color="color">
      <Search />
    </w-icon>
    <!-- 或者独立使用它，不从父级获取属性 -->
    <Search />
  </div>
</template>
```

<vp-script setup>
import { Search, Loading } from '@win-design-next/icons-vue'
</vp-script>

<WRow>
  <div>
    <WIcon :size="30">
      <Search />
    </WIcon>
    <Search />
  </div>
</WRow>

## 直接使用 SVG 图标

```vue
<template>
  <div style="font-size: 20px">
    <!-- 由于SVG图标默认不携带任何属性 -->
    <!-- 你需要直接提供它们 -->
    <Search style="width: 1em; height: 1em; margin-right: 8px" />
  </div>
</template>
```

<WRow>
  <div style="font-size: 20px;">
    <!-- Since svg icons do not carry any attributes by default -->
    <!-- You need to provide attributes directly -->
    <Search style="width: 1em; height: 1em; margin-right: 8px;" />
  </div>
</WRow>

## 图标分类列表

:::tip

只要你安装了对应的图标包，**就可以在任意版本里使用这些图标**。

:::

### 通用

| 图标名称 | 图标名称 | 图标名称 | 图标名称 | 图标名称 |
|  --- | --- | --- | --- | --- |
| Home | Search | Edit | Delete | Copy |
| Cut | Paste | Drag | Enter | Setting |
| SettingFilled | Download | Date | Time | User |
| CircleLoading | Loading | Others | OthersFilled | OthersVertical |
| Code | Fullscreen | FullscreenExit | Filter | Refresh |
| RefreshRight | RefreshLeft | Reply | Repost | Skin |
| Star | StarFilled |  |  |  |

### 业务

| 图标名称 | 图标名称 | 图标名称 | 图标名称 | 图标名称 |
|  --- | --- | --- | --- | --- |
| BedsideCard | Freeze | Defrost |  |  |

### 方向

| 图标名称 | 图标名称 | 图标名称 | 图标名称 | 图标名称 |
|  --- | --- | --- | --- | --- |
| CaretLeft | CaretRight | CaretTop | CaretBottom | ArrowLeft |
| ArrowUp | ArrowRight | ArrowDown | DArrowLeft | DArrowBottom |
| DArrowRight | DArrowTop | ArrowBottomCircle | ArrowTopCircle | ArrowLeftCircle |
| ArrowRightCircle | ArrowBottomSolid | ArrowTopSolid | ArrowLeftSolid | ArrowRightSolid |
| ArrowLeftRight | ArrowTopBottom | CircleLeft | CircleRight | CircleTop |
| CircleBottom | Back | Bottom | Top | Right |
| BottomLeft | BottomRight | TopLeft | TopRight | Decrease |
| Increase | DirectionRight | DirectionLeft | RightSolid | LeftSolid |
| BottomSolid | TopSolid | DCaret | MoveDown | MoveUp |
| Sort | SortDown | SortUp | Swap | SwapLeft |
| SwapRight | Stretch | Shrink | AtBottom | BackTop |

### 状态

| 图标名称 | 图标名称 | 图标名称 | 图标名称 | 图标名称 |
|  --- | --- | --- | --- | --- |
| Check | CircleCheck | CircleSuccessFilled | Plus | CirclePlus |
| CirclePlusFilled | Minus | CircleMinus | CircleMinusFilled | Close |
| CircleClose | CircleCloseFilled | Qmark | CircleQmark | CircleQmarkFilled |
| Info | CircleInfo | CircleInfoFilled | Warning | CircleWarning |
| CircleErrorFilled | CircleWarningFilled | WarningTriangle |  |  |

### 文档

| 图标名称 | 图标名称 | 图标名称 | 图标名称 | 图标名称 |
|  --- | --- | --- | --- | --- |
| Unfold | Fold | List | ListSolid | ListTimeline |
| ListTree | File | Excel | Folder | FolderO |
| Pdf | Picture | Ppt | Word | ShareFold |
| Text | Template | Qrcode |  |  |

### 图表

| 图标名称 | 图标名称 | 图标名称 | 图标名称 | 图标名称 |
|  --- | --- | --- | --- | --- |
| BarChart | LineChart | PieChart |  |  |

### 媒体

| 图标名称 | 图标名称 | 图标名称 | 图标名称 | 图标名称 |
|  --- | --- | --- | --- | --- |
| Bell | Computer | Mobile | PauseCircle | Play |
| Voice | VoiceOff | Video | TurnOff | Volume |
| Stop | NotificationClose | Telephone |  |  |

### 系统

| 图标名称 | 图标名称 | 图标名称 | 图标名称 | 图标名称 |
|  --- | --- | --- | --- | --- |
| Database | DatabaseException |  |  |  |



## API

### Attributes

| 属性名 | 说明                        | 类型                  | 默认值       |
| ------ | --------------------------- | --------------------- | ------------ |
| color  | svg 的 fill 颜色            | ^[string]             | 继承颜色     |
| size   | SVG 图标的大小，size x size | ^[number] / ^[string] | 继承字体大小 |

### Slots

| 名称    | 说明           |
| ------- | -------------- |
| default | 自定义默认内容 |

---

# Iconi 行业标识

WinDesign Next 提供了一套常用的行业标识集合。

## 使用图标

- 如果你想像用例一样**直接使用**，你需要[全局注册组件](https://v3.vuejs.org/guide/component-registration.html#global-registration)，才能够直接在项目里使用。

## 安装

### 使用包管理器

::: code-group

```shell [npm]
$ npm install @win-design-next/iconi-vue
```

```shell [yarn]
$ yarn add @win-design-next/iconi-vue
```

```shell [pnpm]
$ pnpm install @win-design-next/iconi-vue
```

:::

### 注册所有图标

您需要从 `@win-design-next/iconi-vue` 中导入所有图标并进行全局注册。

```ts
// main.ts

import * as WinDesignNextIconsVue from '@win-design-next/iconi-vue'

const app = createApp(App)
for (const [key, component] of Object.entries(WinDesignNextIconsVue)) {
  app.component(key, component)
}
```

### 自动导入

使用 [unplugin-icons](https://github.com/antfu/unplugin-icons) 和 [unplugin-auto-import](https://github.com/antfu/unplugin-auto-import) 从 iconify 中自动导入任何图标集。

## 基础用法

```vue
<!-- 使用 w-icon 为 SVG 图标提供属性 -->
<template>
  <div>
    <w-icon :size="size">
      <SignZilingyao />
    </w-icon>
    <!-- 或者独立使用它，不从父级获取属性 -->
    <Search />
  </div>
</template>
```

<vp-script setup>
import { SignZilingyao } from '@win-design-next/iconi-vue'
</vp-script>

<WRow>
  <div>
    <WIcon :size="30">
      <SignZilingyao />
    </WIcon>
    <SignZilingyao />
  </div>
</WRow>

## 直接使用 SVG 图标

```vue
<template>
  <div style="font-size: 20px">
    <!-- 由于SVG图标默认不携带任何属性 -->
    <!-- 你需要直接提供它们 -->
    <SignZilingyao style="width: 2em; height: 2em; margin-right: 8px" />
  </div>
</template>
```

<WRow>
  <div style="font-size: 20px;">
    <!-- Since svg icons do not carry any attributes by default -->
    <!-- You need to provide attributes directly -->
    <SignZilingyao style="width: 2em; height: 2em;" />
  </div>
</WRow>

## 图标分类列表

:::tip

只要你安装了对应的图标包，**就可以在任意版本里使用这些图标**。

:::

### 状态戳

| 图标名称 | 图标名称 | 图标名称 | 图标名称 | 图标名称 |
|  --- | --- | --- | --- | --- |
| StampBencizhiliaoPrimaryType2 | StampCaigouwanjieSuccessType2 | StampCaogaoInfoType4 | StampCaogaoPrimaryType2 | StampDaifayaoInfoType3 |
| StampDaipishiInfoType3 | StampDaishenhePrimaryType2 | StampDongjieErrorType2 | StampDuizhangweifuErrorType2 | StampDuizhangzhangfuSuccessType2 |
| StampHulibudaishenheWarningType4 | StampJinrijiedongSuccessType2 | StampKeshidaishenheWarningType4 | StampKeshijieshudaishenheWarningType4 | StampLiuzhuanzhongPrimaryStyle2 |
| StampPishizhongPrimaryType3 | StampShenhebohuiErrorType2 | StampShenhetongguoSuccessType2 | StampShenqianbohuiWarningType2 | StampShenqianzhongPrimaryType2 |
| StampShuyezhongPrimaryType3 | StampTeWarningType5 | StampWeicaijiInfoType3 | StampWeichuliInfoType2 | StampWeiduizhangInfoType2 |
| StampWeihuishouInfoType3 | StampWeilingxieInfoType3 | StampWeiqianshouInfoType3 | StampWeituiyaoInfoType3 | StampWeiwanchengErrorType2 |
| StampWeizhixingInfoType3 | StampWukedayinyizhuErrorType2 | StampWuzhengjianWarningType3 | StampXinjianPrimaryType2 | StampXinjianPrimaryType4 |
| StampYangxingErrorType3 | StampYangxingFirstErrorType3 | StampYangxingFourthErrorType3 | StampYangxingSecondErrorType3 | StampYangxingThirdErrorType3 |
| StampYianpaiPrimaryType4 | StampYibaocunSuccessType2 | StampYibohuiErrorType4 | StampYicaijiSuccessType3 | StampYichafangSuccessType4 |
| StampYifabuErrorType4 | StampYifuheSuccessType2 | StampYiguashiErrorType1 | StampYiguidangSuccessType4 | StampYiguidangWarningType3 |
| StampYiguohaoWarningType2 | StampYihuishouSuccessType3 | StampYihuishouWarningType1 | StampYijiaohaoSuccessType2 | StampYijieshouSuccessType2 |
| StampYijieshouSuccessType4 | StampYijieshuSuccessType3 | StampYijieshuSuccessType4 | StampYijieshudaiquerenWarningType4 | StampYijujueErrorType2 |
| StampYilingxieSuccessType3 | StampYinxingSuccessType3 | StampYiqianshouSuccessType3 | StampYiquerenSuccessType4 | StampYishenheSuccessType2 |
| StampYishenqingSuccessType4 | StampYishenyueSuccessType3 | StampYishenyueSuccessType4 | StampYishuxieSuccessType3 | StampYitianxieSuccessType3 |
| StampYitijiaoSuccessType2 | StampYitijiaoSuccessType4 | StampYiwanchengSuccessType2 | StampYiwanchengSuccessType4 | StampYizantingErrorType3 |
| StampYizhaohuiInfoType4 | StampYizhuxiaoErrorType1 | StampYizuofeiInfoType2 | StampYudongjieWarningType2 | StampZhenliaofanganchuliSuccessType4 |
| StampZhoujiWarningType2 | StampZhoujiWarningType4 | StampZhuizongzhongPrimaryType4 |  |  |

### 物品标识

| 图标名称 | 图标名称 | 图标名称 | 图标名称 | 图标名称 |
|  --- | --- | --- | --- | --- |
| SignZilingyao |  |  |  |  |



## API

### Attributes

| 属性名 | 说明                        | 类型                  | 默认值       |
| ------ | --------------------------- | --------------------- | ------------ |
| size   | SVG 图标的大小，size x size | ^[number] / ^[string] | 继承字体大小 |

### Slots

| 名称    | 说明           |
| ------- | -------------- |
| default | 自定义默认内容 |

---

## 自动补全输入框

根据输入内容提供对应的输入建议。

### 示例

:::demo `fetch-suggestions` 属性是返回建议输入的方法。 在此示例中， `querySearch(queryString, cb)` 方法通过 `cb(data)` 给 Autocomplete 组件返回建议。

```vue
<template>
  <div class="flex gap-4 flex-wrap">
    <div>
      <div class="sub-title my-2 text-sm text-gray-600">
        list suggestions when activated
      </div>
      <w-autocomplete
        v-model="state1"
        :fetch-suggestions="querySearch"
        clearable
        class="inline-input w-50"
        placeholder="请输入"
        @select="handleSelect"
      />
    </div>
    <div>
      <div class="sub-title my-2 text-sm text-gray-600">
        list suggestions on input
      </div>
      <w-autocomplete
        v-model="state2"
        :fetch-suggestions="querySearch"
        :trigger-on-focus="false"
        clearable
        class="inline-input w-50"
        placeholder="请输入"
        @select="handleSelect"
      />
    </div>
    <div>
      <div class="sub-title my-2 text-sm text-gray-600">禁用</div>
      <w-autocomplete
        v-model="state2"
        disabled
        :fetch-suggestions="querySearch"
        :trigger-on-focus="false"
        clearable
        class="inline-input w-50"
        placeholder="请输入"
        @select="handleSelect"
      />
    </div>
    <div>
      <div class="sub-title my-2 text-sm text-gray-600">禁用</div>
      <w-autocomplete
        v-model="state3"
        disabled
        :fetch-suggestions="querySearch"
        clearable
        class="inline-input w-50"
        placeholder="请输入"
        @select="handleSelect"
      />
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'

interface RestaurantItem {
  value: string
  link: string
}

const state1 = ref('')
const state2 = ref('')
const state3 = ref('vue')

const restaurants = ref<RestaurantItem[]>([])
const querySearch = (queryString: string, cb: any) => {
  const results = queryString
    ? restaurants.value.filter(createFilter(queryString))
    : restaurants.value
  // call callback function to return suggestions
  cb(results)
}
const createFilter = (queryString: string) => {
  return (restaurant: RestaurantItem) => {
    return (
      restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
    )
  }
}
const loadAll = () => {
  return [
    { value: 'vue', link: 'https://github.com/vuejs/vue' },
    { value: 'element', link: 'https://github.com/ElemeFE/element' },
    { value: 'cooking', link: 'https://github.com/ElemeFE/cooking' },
    { value: 'mint-ui', link: 'https://github.com/ElemeFE/mint-ui' },
    { value: 'vuex', link: 'https://github.com/vuejs/vuex' },
    { value: 'vue-router', link: 'https://github.com/vuejs/vue-router' },
    { value: 'babel', link: 'https://github.com/babel/babel' },
  ]
}

const handleSelect = (item: Record<string, any>) => {
  console.log(item)
}

onMounted(() => {
  restaurants.value = loadAll()
})
</script>
```

:::

:::demo 使用 `scoped slot` 自定义输入建议。 在这个范围中，你可以使用 `item` 键来访问当前输入建议对象。

```vue
<template>
  <w-autocomplete
    v-model="state"
    :fetch-suggestions="querySearch"
    popper-class="my-autocomplete"
    placeholder="请输入"
    @select="handleSelect"
  >
    <template #suffix>
      <w-icon class="w3-input__icon" @click="handleIconClick">
        <edit />
      </w-icon>
    </template>
    <template #default="{ item }">
      <div class="value">{{ item.value }}</div>
      <span class="link">{{ item.link }}</span>
    </template>
  </w-autocomplete>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'
import { Edit } from '@win-design-next/icons-vue'

interface LinkItem {
  value: string
  link: string
}

const state = ref('')
const links = ref<LinkItem[]>([])

const querySearch = (queryString: string, cb) => {
  const results = queryString
    ? links.value.filter(createFilter(queryString))
    : links.value
  // call callback function to return suggestion objects
  cb(results)
}
const createFilter = (queryString: string) => {
  return (restaurant: LinkItem) => {
    return (
      restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
    )
  }
}
const loadAll = () => {
  return [
    { value: 'vue', link: 'https://github.com/vuejs/vue' },
    { value: 'element', link: 'https://github.com/ElemeFE/element' },
    { value: 'cooking', link: 'https://github.com/ElemeFE/cooking' },
    { value: 'mint-ui', link: 'https://github.com/ElemeFE/mint-ui' },
    { value: 'vuex', link: 'https://github.com/vuejs/vuex' },
    { value: 'vue-router', link: 'https://github.com/vuejs/vue-router' },
    { value: 'babel', link: 'https://github.com/babel/babel' },
  ]
}
const handleSelect = (item: Record<string, any>) => {
  console.log(item)
}

const handleIconClick = (ev: Event) => {
  console.log(ev)
}

onMounted(() => {
  links.value = loadAll()
})
</script>

<style>
.my-autocomplete li {
  line-height: normal;
  padding: 7px;
}
.my-autocomplete li .name {
  text-overflow: ellipsis;
  overflow: hidden;
}
.my-autocomplete li .addr {
  font-size: 12px;
  color: #b4b4b4;
}
.my-autocomplete li .highlighted .addr {
  color: #ddd;
}
</style>
```

:::

:::demo

```vue
<template>
  <w-autocomplete
    v-model="state"
    :fetch-suggestions="querySearchAsync"
    placeholder="请输入"
    @select="handleSelect"
  />
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'

const state = ref('')

interface LinkItem {
  value: string
  link: string
}

const links = ref<LinkItem[]>([])

const loadAll = () => {
  return [
    { value: 'vue', link: 'https://github.com/vuejs/vue' },
    { value: 'element', link: 'https://github.com/ElemeFE/element' },
    { value: 'cooking', link: 'https://github.com/ElemeFE/cooking' },
    { value: 'mint-ui', link: 'https://github.com/ElemeFE/mint-ui' },
    { value: 'vuex', link: 'https://github.com/vuejs/vuex' },
    { value: 'vue-router', link: 'https://github.com/vuejs/vue-router' },
    { value: 'babel', link: 'https://github.com/babel/babel' },
  ]
}

let timeout: ReturnType<typeof setTimeout>
const querySearchAsync = (queryString: string, cb: (arg: any) => void) => {
  const results = queryString
    ? links.value.filter(createFilter(queryString))
    : links.value

  clearTimeout(timeout)
  timeout = setTimeout(() => {
    cb(results)
  }, 3000 * Math.random())
}
const createFilter = (queryString: string) => {
  return (restaurant: LinkItem) => {
    return (
      restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
    )
  }
}

const handleSelect = (item: Record<string, any>) => {
  console.log(item)
}

onMounted(() => {
  links.value = loadAll()
})
</script>
```

:::

:::demo

```vue
<template>
  <div class="flex gap-4">
    <div>
      <div class="sub-title my-2 text-sm text-gray-600">loading icon1</div>
      <w-autocomplete
        v-model="state"
        :fetch-suggestions="querySearchAsync"
        placeholder="请输入"
        @select="handleSelect"
      >
        <template #loading>
          <svg class="circular" viewBox="0 0 50 50">
            <circle class="path" cx="25" cy="25" r="20" fill="none" />
          </svg>
        </template>
      </w-autocomplete>
    </div>
    <div>
      <div class="sub-title my-2 text-sm text-gray-600">loading icon2</div>
      <w-autocomplete
        v-model="state"
        :fetch-suggestions="querySearchAsync"
        placeholder="请输入"
        @select="handleSelect"
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
      </w-autocomplete>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref } from 'vue'

const state = ref('')

interface LinkItem {
  value: string
  link: string
}

const links = ref<LinkItem[]>([])

const loadAll = () => {
  return [
    { value: 'vue', link: 'https://github.com/vuejs/vue' },
    { value: 'element', link: 'https://github.com/ElemeFE/element' },
    { value: 'cooking', link: 'https://github.com/ElemeFE/cooking' },
    { value: 'mint-ui', link: 'https://github.com/ElemeFE/mint-ui' },
    { value: 'vuex', link: 'https://github.com/vuejs/vuex' },
    { value: 'vue-router', link: 'https://github.com/vuejs/vue-router' },
    { value: 'babel', link: 'https://github.com/babel/babel' },
  ]
}

let timeout: ReturnType<typeof setTimeout>
const querySearchAsync = (queryString: string, cb: (arg: any) => void) => {
  const results = queryString
    ? links.value.filter(createFilter(queryString))
    : links.value

  clearTimeout(timeout)
  timeout = setTimeout(() => {
    cb(results)
  }, 5000 * Math.random())
}
const createFilter = (queryString: string) => {
  return (restaurant: LinkItem) => {
    return (
      restaurant.value.toLowerCase().indexOf(queryString.toLowerCase()) === 0
    )
  }
}

const handleSelect = (item: Record<string, any>) => {
  console.log(item)
}

onMounted(() => {
  links.value = loadAll()
})
</script>

<style>
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

### API 文档

### Attributes

| 属性名                | 说明                                                                                         | 类型                                                                                      | 默认值       |
| --------------------- | -------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- | ------------ |
| model-value / v-model | 选中项绑定值                                                                                 | ^[string]                                                                                 | —            |
| placeholder           | 占位文本                                                                                     | ^[string]                                                                                 | —            |
| clearable             | 是否可清空                                                                                   | ^[boolean]                                                                                | false        |
| disabled              | 自动补全组件是否被禁用                                                                       | ^[boolean]                                                                                | false        |
| value-key             | 输入建议对象中用于显示的键名                                                                 | ^[string]                                                                                 | value        |
| debounce              | 获取输入建议的防抖延时，单位为毫秒                                                           | ^[number]                                                                                 | 300          |
| placement             | 菜单弹出位置                                                                                 | ^[enum]`'top' \| 'top- start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end'` | bottom-start |
| fetch-suggestions     | 获取输入建议的方法， 仅当你的输入建议数据 resolve 时，通过调用 `callback(data:[]) ` 来返回它 | ^[Array] / ^[Function]`(queryString: string, callback: callbackfn) => void`               | —            |
| trigger-on-focus      | whether show suggestions when input focus                                                    | ^[boolean]                                                                                | true         |
| select-when-unmatched | 在输入没有任何匹配建议的情况下，按下回车是否触发 `select` 事件                               | ^[boolean]                                                                                | false        |
| name                  | 等价于原生 input `name` 属性                                                                 | ^[string]                                                                                 | —            |
| aria-label ^(a11y)    | 原生 `aria-label`属性                                                                        | ^[string]                                                                                 | —            |
| hide-loading          | 是否隐藏远程加载时的加载图标                                                                 | ^[boolean]                                                                                | false        |
| popper-class          | 下拉列表的类名                                                                               | ^[string]                                                                                 | —            |
| teleported            | 是否将下拉列表元素插入 append-to 指向的元素下                                                | ^[boolean]                                                                                | true         |
| highlight-first-item  | 是否默认高亮远程搜索结果的第一项                                                             | ^[boolean]                                                                                | false        |
| fit-input-width       | 下拉框的宽度是否与输入框相同                                                                 | ^[boolean]                                                                                | false        |

### Events

| 事件名 | 详情                                          | 类型                                                  |
| ------ | --------------------------------------------- | ----------------------------------------------------- |
| blur   | 当选择器的输入框失去焦点时触发                | ^[Function]`(event: FocusEvent) => void`              |
| focus  | 当选择器的输入框获得焦点时触发                | ^[Function]`(event: FocusEvent) => void`              |
| input  | 在 Input 值改变时触发                         | ^[Function]`(value: string \| number) => void`        |
| clear  | 在点击由 `clearable` 属性生成的清空按钮时触发 | ^[Function]`() => void`                               |
| select | 点击选中建议项时触发                          | ^[Function]`(item: typeof modelValue \| any) => void` |
| change | 在 Input 值改变时触发                         | ^[Function]`(value: string \| number) => void`        |

### Slots

| 插槽名  | 描述说明                       | 类型                                     |
| ------- | ------------------------------ | ---------------------------------------- |
| default | 自定义输入建议的内容。         | ^[object]`{ item: Record<string, any> }` |
| prefix  | 输入框头部内容                 | -                                        |
| suffix  | 输入框尾部内容                 | -                                        |
| prepend | 输入框前置内容，在 prefix 之前 | -                                        |
| append  | 输入框后置内容，在 suffix 之后 | -                                        |
| loading | 修改加载区域内容               | -                                        |

### Exposes

| 名称             | 详情                             | 类型                                       |
| ---------------- | -------------------------------- | ------------------------------------------ |
| activated        | 自动补全输入框是否被激活         | ^[object]`Ref<boolean>`                    |
| blur             | 使 input 失去焦点                | ^[Function]`() => void`                    |
| close            | 折叠建议列表                     | ^[Function]`() => void`                    |
| focus            | 使 input 获取焦点                | ^[Function]`() => void`                    |
| handleSelect     | 手动触发选中建议事件             | ^[Function]`(item: any) => promise<void>`  |
| handleKeyEnter   | 手动触发键盘回车事件             | ^[Function]`() => promise<void>`           |
| highlightedIndex | 当前高亮显示选项的索引           | ^[object]`Ref<number>`                     |
| highlight        | 在建议中高亮显示一个项目         | ^[Function]`(itemIndex: number) => void`   |
| inputRef         | w-input 组件实例                 | ^[object]`Ref<WInputInstance>`             |
| loading          | 远程获取提示内容的加载状态指示器 | ^[object]`Ref<boolean>`                    |
| popperRef        | w-tooltip 组件实例               | ^[object]`Ref<WTooltipInstance>`           |
| suggestions      | 获取自动补全结果                 | ^[object]`Ref<record<string, any>>`        |
| getData          | 加载建议列表                     | ^[Function]`(queryString: string) => void` |

---

## 类型声明

<details>
  <summary>Show declarations</summary>

```ts
type CalendarDateType =
  | 'prev-month'
  | 'next-month'
  | 'prev-year'
  | 'next-year'
  | 'today'
```

</details>

---

## 类型声明

<details>
  <summary>显示类型声明</summary>

```ts
type CascaderNodeValue = string | number
type CascaderNodePathValue = CascaderNodeValue[]
type CascaderValue =
  | CascaderNodeValue
  | CascaderNodePathValue
  | (CascaderNodeValue | CascaderNodePathValue)[]

type Resolve = (data: any) => void

type ExpandTrigger = 'click' | 'hover'

type LazyLoad = (node: Node, resolve: Resolve) => void

type isDisabled = (data: CascaderOption, node: Node) => boolean

type isLeaf = (data: CascaderOption, node: Node) => boolean

interface CascaderOption extends Record<string, unknown> {
  label?: string
  value?: CascaderNodeValue
  children?: CascaderOption[]
  disabled?: boolean
  leaf?: boolean
}

interface CascaderProps {
  expandTrigger?: ExpandTrigger
  multiple?: boolean
  checkStrictly?: boolean
  emitPath?: boolean
  lazy?: boolean
  lazyLoad?: LazyLoad
  value?: string
  label?: string
  children?: string
  disabled?: string | isDisabled
  leaf?: string | isLeaf
  hoverThreshold?: number
}

class Node {
  readonly uid: number
  readonly level: number
  readonly value: CascaderNodeValue
  readonly label: string
  readonly pathNodes: Node[]
  readonly pathValues: CascaderNodePathValue
  readonly pathLabels: string[]

  childrenData: ChildrenData
  children: Node[]
  text: string
  loaded: boolean
  /**
   * Is it checked
   *
   * @default false
   */
  checked: boolean
  /**
   * Used to indicate the intermediate state of unchecked and fully checked child nodes
   *
   * @default false
   */
  indeterminate: boolean
  /**
   * Loading Status
   *
   * @default false
   */
  loading: boolean

  // getter
  isDisabled: boolean
  isLeaf: boolean
  valueByOption: CascaderNodeValue | CascaderNodePathValue

  // method
  appendChild(childData: CascaderOption): Node
  calcText(allLevels: boolean, separator: string): string
  broadcast(event: string, ...args: unknown[]): void
  emit(event: string, ...args: unknown[]): void
  onParentCheck(checked: boolean): void
  onChildCheck(): void
  setCheckState(checked: boolean): void
  doCheck(checked: boolean): void
}

Node as CascaderNode
```

</details>

---

## Config Provider 全局配置

Config Provider 被用来提供全局的配置选项，让你的配置能够在全局都能够被访问到。

### 示例

:::demo 使用 theme 属性来提供主题相关配置

```vue
<template>
  <div>
    <w-segmented v-model="value" class="mb-8" :options="options">
      <template #default="scope">
        {{ scope.item.label }}
        <span v-if="scope.item.value">({{ scope.item.value }})</span>
      </template>
    </w-segmented>
    <w-config-provider :theme="value">
      <div class="mb-4">
        <w-button type="primary">主题色</w-button>
        <w-button type="primary" disabled>主题色</w-button>
        <w-button type="primary" plain>主题色</w-button>
        <w-button type="primary" disabled plain>主题色</w-button>
      </div>
      <w-table :data="tableData" border>
        <w-table-column width="200" prop="name" label="药品名称" />
        <w-table-column prop="size" label="规格" />
        <w-table-column prop="count" label="数量" />
        <w-table-column prop="price" label="单价(元)" align="right" />
        <w-table-column prop="total" label="金额(元)" align="right" />
      </w-table>
    </w-config-provider>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref('')

const options = [
  {
    value: '',
    label: '主色蓝',
  },
  {
    value: 'sauce-purple',
    label: '山梗紫',
  },
  {
    value: 'maternity-pink',
    label: '芙蓉粉',
  },
  {
    value: 'innovation-green',
    label: '松柏绿',
  },
  {
    value: 'calendula',
    label: '落栗棕',
  },
]

const tableData = [
  {
    id: '3',
    name: '炔诺酮片',
    size: '625微克/片',
    count: '10',
    unit: '片',
    price: '10.00',
    total: '100.00',
    parentId: '0',
    check: false,
  },
  {
    id: '4',
    name: '扶达胶囊',
    size: '100毫克/粒',
    count: '5',
    unit: '粒',
    price: '12.00',
    total: '60.00',
    parentId: '0',
    check: false,
  },
  {
    id: '5',
    name: '百士欣胶囊',
    size: '10毫克/粒',
    count: '2',
    unit: '粒',
    price: '22.50',
    total: '45.00',
    parentId: '0',
    check: false,
  },
  {
    id: '6',
    name: '别嘌醇片',
    size: '100毫克/片',
    count: '10',
    unit: '片',
    price: '14.50',
    total: '145.00',
    parentId: '0',
    check: false,
  },
  {
    id: '7',
    name: '复方维生素注射液',
    size: '2毫升/支',
    count: '10',
    unit: '支',
    price: '12.73',
    total: '127.30',
    parentId: '1',
    check: true,
  },
  {
    id: '8',
    name: '注射用盐酸多巴胺',
    size: '20毫升/支',
    count: '6',
    unit: '支',
    price: '49.80',
    total: '298.80',
    parentId: '1',
    check: false,
  },
]
</script>
```

:::

:::demo 使用两个属性来提供 i18n 相关配置

```vue
<template>
  <div>
    <w-button mb-2 @click="toggle">切换语言</w-button>
    <br />

    <w-config-provider :locale="locale">
      <w-table mb-1 :data="[]" />
      <w-pagination :total="100" />
    </w-config-provider>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'
import zhCn from 'win-design-next/dist/locale/zh-cn.mjs'
import en from 'win-design-next/dist/locale/en.mjs'

const language = ref('zh-cn')
const locale = computed(() => (language.value === 'zh-cn' ? zhCn : en))

const toggle = () => {
  language.value = language.value === 'zh-cn' ? 'en' : 'zh-cn'
}
</script>
```

:::

:::demo

```vue
<template>
  <div>
    <div class="mb-4 flex items-center gap-8">
      <w-checkbox v-model="config.autoInsertSpace">
        autoInsertSpace
      </w-checkbox>
      <w-config-provider :button="config">
        <w-button>中文</w-button>
      </w-config-provider>
    </div>

    <div class="mb-4 flex items-center gap-8">
      <w-switch
        v-model="config.debounce"
        active-text="开启防抖"
        inactive-text="关闭防抖"
      />
      <w-config-provider :button="config">
        <w-button @click="handleButtonClick">防抖</w-button>
      </w-config-provider>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import { WMessage } from 'win-design-next'

const config = reactive({
  autoInsertSpace: true,
  debounce: true,
  debounceTime: 1000,
})

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
  <div>
    <w-config-provider :message="config">
      <w-button @click="open">OPEN</w-button>
    </w-config-provider>
  </div>
</template>

<script lang="ts" setup>
import { reactive } from 'vue'
import { WMessage } from 'win-design-next'
const config = reactive({
  max: 3,
})
const open = () => {
  WMessage('This is a message.')
}
</script>
```

:::

:::demo

```vue
<template>
  <w-config-provider
    :value-on-clear="() => null"
    :empty-values="[undefined, null]"
  >
    <div class="flex flex-wrap gap-4 items-center">
      <w-select
        v-model="value1"
        clearable
        placeholder="Select"
        style="width: 240px"
        @change="handleChange"
      >
        <w-option
          v-for="item in options"
          :key="item.value"
          :label="item.label"
          :value="item.value"
        />
      </w-select>
      <w-select-v2
        v-model="value2"
        clearable
        placeholder="Select"
        style="width: 240px"
        :options="options"
        :value-on-clear="() => undefined"
        @change="handleChange"
      />
    </div>
  </w-config-provider>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { WMessage } from 'win-design-next'

const value1 = ref('')
const value2 = ref('')
const options = [
  {
    value: '',
    label: 'All',
  },
  {
    value: 'Option1',
    label: 'Option1',
  },
  {
    value: 'Option2',
    label: 'Option2',
  },
  {
    value: 'Option3',
    label: 'Option3',
  },
  {
    value: 'Option4',
    label: 'Option4',
  },
  {
    value: 'Option5',
    label: 'Option5',
  },
]

const handleChange = (value) => {
  if ([undefined, null].includes(value)) {
    WMessage.info(`The clear value is: ${value}`)
  }
}
</script>
```

:::

### API 文档

### Config Provider Attributes

| 属性名                | 说明                                                   | 类型                                                                                                    | 默认值   |
| --------------------- | ------------------------------------------------------ | ------------------------------------------------------------------------------------------------------- | -------- |
| locale                | 翻译文本对象                                           | ^[object]`{name: string, el: TranslatePair}`                                                            | en       |
| size                  | 全局组件大小                                           | ^[enum]`'large' \| 'default' \| 'mini' \| 'small'`                                                      | default  |
| zIndex                | 全局初始化 zIndex 的值                                 | ^[number]                                                                                               | —        |
| namespace             | 全局组件类名称前缀 (需要配合 $namespace 使用)          | ^[string]                                                                                               | w3       |
| button                | 按钮相关配置，[详见下表](#button-attribute)            | ^[object]`{autoInsertSpace?: boolean, debounce?: boolean, debounceTime?: number, winmonitor?: boolean}` | 详见下表 |
| message               | 消息相关配置， [详见下表](#message-attribute)          | ^[object]`{max?: number}`                                                                               | 详见下表 |
| experimental-features | 将要添加的实验阶段的功能，所有功能都是默认设置为 false | ^[object]                                                                                               | —        |
| empty-values          | 输入类组件空值                                         | ^[array]                                                                                                | —        |
| value-on-clear        | 输入类组件清空值                                       | ^[string] / ^[number] / ^[boolean] / ^[Function]                                                        | —        |
| theme                 | 全局主题                                               | ^[enum]`'' \| 'sauce-purple' \| 'calendula' \| 'maternity-pink' \| 'innovation-green'`                  |          |

### Button Attribute

| 参数            | 说明                                                                      | 类型       | 默认值 | Version |
| --------------- | ------------------------------------------------------------------------- | ---------- | ------ | ------- |
| autoInsertSpace | 两个中文字符之间自动插入空格(仅当文本长度为 2 且所有字符均为中文时才生效) | ^[boolean] | false  |
| debounce        | 是否开启防抖                                                              | ^[boolean] | false  | V0.0.7  |
| debounce-time   | 防抖时间                                                                  | ^[number]  | 200    | V0.0.7  |
| winmonitor      | 是否开启按钮点击上报日志                                                  | ^[boolean] | -      | V1.0.2  |

### Message Attribute

| 参数      | 描述                                         | 类型       | 默认值 |
| --------- | -------------------------------------------- | ---------- | ------ |
| max       | 可同时显示的消息最大数量                     | ^[number]  | —      |
| grouping  | 合并内容相同的消息，不支持 VNode 类型的消息  | ^[boolean] | —      |
| duration  | 显示时间，单位为毫秒。 设为 0 则不会自动关闭 | ^[number]  | —      |
| showClose | 是否显示关闭按钮                             | ^[boolean] | —      |
| offset    | Message 距离窗口顶部的偏移量                 | ^[number]  | —      |

### Config Provider Slots

| 名称    | 描述           | Scope                              |
| ------- | -------------- | ---------------------------------- |
| default | 自定义默认内容 | config: 提供全局配置（从顶部继承） |

---

## 类型声明

<details>
  <summary>显示类型声明</summary>

```ts
import type { Options as PopperOptions } from '@popperjs/core'

type TimeLikeType = 'datetime' | 'datetimerange'

type Placement =
  | 'top'
  | 'top-start'
  | 'top-end'
  | 'bottom'
  | 'bottom-start'
  | 'bottom-end'
  | 'left'
  | 'left-start'
  | 'left-end'
  | 'right'
  | 'right-start'
  | 'right-end'
```

</details>

---

## 类型声明

<details>
  <summary>显示类型声明</summary>

```ts
type Arrayable<T> = T | T[]

type FormValidationResult = Promise<boolean>

// ValidateFieldsError: see [async-validator](https://github.com/yiminghe/async-validator/blob/master/src/interface.ts)
type FormValidateCallback = (
  isValid: boolean,
  invalidFields?: ValidateFieldsError
) => Promise<void> | void

// RuleItem: see [async-validator](https://github.com/yiminghe/async-validator/blob/master/src/interface.ts)
interface FormItemRule extends RuleItem {
  trigger?: Arrayable<string>
}

type Primitive = null | undefined | string | number | boolean | symbol | bigint
type BrowserNativeObject = Date | FileList | File | Blob | RegExp
type IsTuple<T extends ReadonlyArray<any>> = number extends T['length']
  ? false
  : true
type ArrayMethodKey = keyof any[]
type TupleKey<T extends ReadonlyArray<any>> = Exclude<keyof T, ArrayMethodKey>
type ArrayKey = number
type PathImpl<K extends string | number, V> = V extends
  | Primitive
  | BrowserNativeObject
  ? `${K}`
  : `${K}` | `${K}.${Path<V>}`
type Path<T> = T extends ReadonlyArray<infer V>
  ? IsTuple<T> extends true
    ? {
        [K in TupleKey<T>]-?: PathImpl<Exclude<K, symbol>, T[K]>
      }[TupleKey<T>]
    : PathImpl<ArrayKey, V>
  : {
      [K in keyof T]-?: PathImpl<Exclude<K, symbol>, T[K]>
    }[keyof T]
type FieldPath<T> = T extends object ? Path<T> : never
// MaybeRef: see [@vueuse/core](https://github.com/vueuse/vueuse/blob/main/packages/shared/utils/types.ts)
// UnwrapRef: see [vue](https://github.com/vuejs/core/blob/main/packages/reactivity/src/ref.ts)
type FormRules<T extends MaybeRef<Record<string, any> | string> = string> =
  Partial<
    Record<
      UnwrapRef<T> extends string ? UnwrapRef<T> : FieldPath<UnwrapRef<T>>,
      Arrayable<FormItemRule>
    >
  >

type FormItemValidateState = typeof formItemValidateStates[number]
type FormItemProps = ExtractPropTypes<typeof formItemProps>

type FormItemContext = FormItemProps & {
  $el: HTMLDivElement | undefined
  size: ComponentSize
  validateState: FormItemValidateState
  isGroup: boolean
  labelId: string
  inputIds: string[]
  hasLabel: boolean
  fieldValue: any
  addInputId: (id: string) => void
  removeInputId: (id: string) => void
  validate: (
    trigger: string,
    callback?: FormValidateCallback
  ) => FormValidationResult
  resetField(): void
  clearValidate(): void
}
```

</details>

---

## 类型声明

<details>
  <summary>显示类型声明</summary>

```ts
type ImageViewerAction = 'zoomIn' | 'zoomOut' | 'clockwise' | 'anticlockwise'
type ImageViewerActionOptions = {
  enableTransition?: boolean
  zoomRate?: number
  rotateDeg?: number
}
```

</details>

---

## Infinite Scroll 无限滚动

滚动至底部时，加载更多数据。

### 示例

:::demo

```vue
<template>
  <ul v-infinite-scroll="load" class="infinite-list" style="overflow: auto">
    <li v-for="i in count" :key="i" class="infinite-list-item">{{ i }}</li>
  </ul>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const count = ref(0)
const load = () => {
  count.value += 2
}
</script>

<style>
.infinite-list {
  height: 300px;
  padding: 0;
  margin: 0;
  list-style: none;
}
.infinite-list .infinite-list-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  background: var(--w3-color-primary-plain);
  margin: 10px;
  color: var(--w3-color-primary);
}
.infinite-list .infinite-list-item + .list-item {
  margin-top: 10px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="infinite-list-wrapper" style="overflow: auto">
    <ul
      v-infinite-scroll="load"
      class="list"
      :infinite-scroll-disabled="disabled"
    >
      <li v-for="i in count" :key="i" class="list-item">{{ i }}</li>
    </ul>
    <p v-if="loading">Loading...</p>
    <p v-if="noMore">No more</p>
  </div>
</template>

<script lang="ts" setup>
import { computed, ref } from 'vue'

const count = ref(10)
const loading = ref(false)
const noMore = computed(() => count.value >= 20)
const disabled = computed(() => loading.value || noMore.value)
const load = () => {
  loading.value = true
  setTimeout(() => {
    count.value += 2
    loading.value = false
  }, 2000)
}
</script>

<style>
.infinite-list-wrapper {
  height: 300px;
  text-align: center;
}
.infinite-list-wrapper .list {
  padding: 0;
  margin: 0;
  list-style: none;
}

.infinite-list-wrapper .list-item {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 50px;
  background: var(--w3-color-danger-plain);
  color: var(--w3-color-danger);
}
.infinite-list-wrapper .list-item + .list-item {
  margin-top: 10px;
}
</style>
```

:::

---

## 常见问题

#### WInput 组件的宽度为什么在设置了 `clearable` 时会发生变化

PS: 由于 WInput 组件没有默认宽度，当显示 clearable 图标时, 组件的宽度将被撑开，可以通过设置固定宽度属性来解决。

```vue
<w-input v-model="input" clearable style="width: 200px" />
```

---

## List 列表

最基础的列表展示，可承载文字、列表、图片、段落，常用于后台数据展示页面。

### 示例

:::demo

```vue
<template>
  <w-radio-group v-model="size">
    <w-radio value="large">Large</w-radio>
    <w-radio value="default">Default</w-radio>
    <w-radio value="small">Small</w-radio>
    <w-radio value="mini">Mini</w-radio>
  </w-radio-group>
  <div class="mb-8 mt-8 flex gap-8">
    <w-switch
      v-model="config.split"
      active-text="Split"
      inactive-text="No split"
    />
    <w-switch
      v-model="config.border"
      active-text="Border"
      inactive-text="No border"
    />
  </div>
  <div class="flex gap-8">
    <w-list
      class="flex-1"
      :size="size"
      :split="config.split"
      :border="config.border"
      footer="footer"
    >
      <template #header>
        <div>Header</div>
      </template>
      <w-list-item>安徽省第二附属医院</w-list-item>
      <w-list-item>安徽省合肥市蜀山区</w-list-item>
      <w-list-item>张生</w-list-item>
      <w-list-item>30岁</w-list-item>
      <w-list-item>男</w-list-item>
    </w-list>
    <w-list
      class="flex-1"
      :size="size"
      :split="config.split"
      :border="config.border"
    >
      <w-list-item>安徽省第二附属医院</w-list-item>
      <w-list-item>安徽省合肥市蜀山区</w-list-item>
      <w-list-item>张生</w-list-item>
      <w-list-item>30岁</w-list-item>
      <w-list-item>男</w-list-item>
    </w-list>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const config = ref({
  split: true,
  border: true,
})

const size = ref('default')
</script>

<style scoped></style>
```

:::

:::demo

```vue
<template>
  <w-list split>
    <template #header>
      <div>会诊</div>
    </template>
    <w-list-item>
      <w-list-item-meta
        avatar="https://avatars.githubusercontent.com/u/37531008?s=40&v=4"
        title="会诊目的"
        description="协助拟定治疗及手术方案  |  需要科室协助帮忙确定本患者的治疗解决方案，辛苦各位主任"
      />
      <template #action>
        <w-button type="primary" text>分享</w-button>
        <w-button type="primary" text>下载</w-button>
      </template>
    </w-list-item>
    <w-list-item>
      <w-list-item-meta
        avatar="https://avatars.githubusercontent.com/u/37531008?s=40&v=4"
        title="会诊目的"
        description="协助拟定治疗及手术方案  |  需要科室协助帮忙确定本患者的治疗解决方案，辛苦各位主任"
      />
      <template #action>
        <w-button type="primary" text>分享</w-button>
        <w-button type="primary" text>下载</w-button>
      </template>
    </w-list-item>
    <w-list-item>
      <w-list-item-meta
        avatar="https://avatars.githubusercontent.com/u/37531008?s=40&v=4"
        title="会诊目的"
        description="协助拟定治疗及手术方案  |  需要科室协助帮忙确定本患者的治疗解决方案，辛苦各位主任"
      />
      <template #action>
        <w-button type="primary" text>分享</w-button>
        <w-button type="primary" text>下载</w-button>
      </template>
    </w-list-item>
  </w-list>
</template>
```

:::

:::demo 斑马纹需要使用者根据逻辑自行配置参数，示例： `<w-list-item stripe></w-list-item>`

```vue
<template>
  <w-list border split>
    <template #header>
      <div>Header</div>
    </template>
    <w-list-item>安徽省第二附属医院</w-list-item>
    <w-list-item stripe>安徽省合肥市蜀山区</w-list-item>
    <w-list-item>张生</w-list-item>
    <w-list-item stripe>30岁</w-list-item>
    <w-list-item>男</w-list-item>
  </w-list>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const config = ref({
  split: true,
  border: true,
})

const size = ref('default')
</script>

<style scoped></style>
```

:::

### API 文档

### 属性

| 参数   | 说明           | 类型    | 可选值                                    | 默认值  | Version |
| ------ | -------------- | ------- | ----------------------------------------- | ------- | ------- |
| size   | 尺寸           | String  | 'large' \| 'default' \| 'small' \| 'mini' | default |
| split  | 是否展示分割线 | Boolean | -                                         | false   |
| border | 是否显示边框   | Boolean | -                                         | false   |
| header | 列表头部       | String  | -                                         | -       |
| footer | 列表尾部       | String  | -                                         | -       |

### Slots

| 名称   | 说明           | Version |
| ------ | -------------- | ------- |
| header | 自定义列表头部 |
| footer | 自定义列表尾部 |

## ListItem API

### 属性

| 参数   | 说明           | 类型    | 可选值 | 默认值 | Version |
| ------ | -------------- | ------- | ------ | ------ | ------- |
| stripe | 是否显示斑马纹 | Boolean | -      | false  |

### Slots

| 名称   | 说明                         | Version |
| ------ | ---------------------------- | ------- |
| action | 列表操作组，位置在卡片最右侧 |

## ListItemMeta API

### 属性

| 参数        | 说明               | 类型             | 可选值                                   | 默认值  | Version |
| ----------- | ------------------ | ---------------- | ---------------------------------------- | ------- | ------- |
| avatar      | 列表元素的图标     | String           | -                                        | -       |
| avatar-size | 列表元素头像的大小 | Number \| String | number \| 'large' \| 'medium' \| 'small' | 'large' |
| title       | 列表元素的标题     | String           | -                                        | -       |
| description | 列表元素的描述内容 | String           | -                                        | -       |

### Slots

| 名称        | 说明                     | Version |
| ----------- | ------------------------ | ------- |
| avatar      | 自定义列表元素的图标     |
| title       | 自定义列表元素的标题     |
| description | 自定义列表元素的描述内容 |

---

## Mention 提及

用于在输入中提及某人或某事。

### 示例

:::demo

```vue
<template>
  <w-mention
    v-model="value"
    :options="options"
    style="width: 320px"
    placeholder="请输入"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const value = ref('@')

const options = ref([
  {
    label: 'Fuphoenixes',
    value: 'Fuphoenixes',
  },
  {
    label: 'kooriookami',
    value: 'kooriookami',
  },
  {
    label: 'Jeremy',
    value: 'Jeremy',
  },
  {
    label: 'btea',
    value: 'btea',
  },
])
</script>
```

:::

:::demo

```vue
<template>
  <w-mention
    v-model="value"
    type="textarea"
    :options="options"
    style="width: 320px"
    placeholder="请输入"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
const value = ref('')

const options = ref([
  {
    label: 'Fuphoenixes',
    value: 'Fuphoenixes',
  },
  {
    label: 'kooriookami',
    value: 'kooriookami',
  },
  {
    label: 'Jeremy',
    value: 'Jeremy',
  },
  {
    label: 'btea',
    value: 'btea',
  },
])
</script>
```

:::

:::demo

```vue
<template>
  <w-mention
    v-model="value"
    :options="options"
    style="width: 320px"
    placeholder="请输入"
  >
    <template #label="{ item }">
      <div style="display: flex; align-items: center">
        <w-avatar :size="24" :src="item.avatar" />
        <span style="margin-left: 6px">{{ item.value }}</span>
      </div>
    </template>
  </w-mention>
</template>

<script setup lang="ts">
import { ref } from 'vue'
const value = ref('')

const options = ref([
  {
    value: 'Fuphoenixes',
    avatar: 'https://avatars.githubusercontent.com/u/27912232',
  },
  {
    value: 'kooriookami',
    avatar: 'https://avatars.githubusercontent.com/u/38392315',
  },
  {
    value: 'Jeremy',
    avatar: 'https://avatars.githubusercontent.com/u/15975785',
  },
  {
    value: 'btea',
    avatar: 'https://avatars.githubusercontent.com/u/24516654',
  },
])
</script>
```

:::

:::demo

```vue
<template>
  <w-mention
    v-model="value"
    :options="options"
    :loading="loading"
    style="width: 320px"
    placeholder="请输入"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import type { MentionOption } from 'win-design-next'

const value = ref('')
const loading = ref(false)
const options = ref<MentionOption[]>([])

let timer: ReturnType<typeof setTimeout>
const handleSearch = (pattern: string) => {
  if (timer) clearTimeout(timer)

  loading.value = true
  timer = setTimeout(() => {
    options.value = ['Fuphoenixes', 'kooriookami', 'Jeremy', 'btea'].map(
      (item) => ({
        label: pattern + item,
        value: pattern + item,
      })
    )
    loading.value = false
  }, 1500)
}

onBeforeUnmount(() => {
  if (timer) clearTimeout(timer)
})
</script>
```

:::

:::demo

```vue
<template>
  <w-mention
    v-model="value"
    :options="options"
    :prefix="['@', '#']"
    style="width: 320px"
    placeholder="input @ to mention people, # to mention tag"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { MentionOption } from 'win-design-next'

const MOCK_DATA: Record<string, string[]> = {
  '@': ['Fuphoenixes', 'kooriookami', 'Jeremy', 'btea'],
  '#': ['1.0', '2.0', '3.0'],
}
const value = ref('')
const options = ref<MentionOption[]>([])

const handleSearch = (_: string, prefix: string) => {
  options.value = (MOCK_DATA[prefix] || []).map((value) => ({
    value,
  }))
}
</script>
```

:::

:::demo

```vue
<template>
  <w-mention
    v-model="value1"
    whole
    :options="options1"
    style="width: 320px"
    placeholder="请输入"
  />
  <w-divider />
  <w-mention
    v-model="value2"
    :options="options2"
    :prefix="['@', '#']"
    whole
    :check-is-whole="checkIsWhole"
    style="width: 320px"
    placeholder="input @ to mention people, # to mention tag"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { MentionOption } from 'win-design-next'

const MOCK_DATA: Record<string, string[]> = {
  '@': ['Fuphoenixes', 'kooriookami', 'Jeremy', 'btea'],
  '#': ['1.0', '2.0', '3.0'],
}
const value1 = ref('')
const value2 = ref('')
const options1 = ref<MentionOption[]>(
  MOCK_DATA['@'].map((value) => ({ value }))
)
const options2 = ref<MentionOption[]>([])

const handleSearch = (_: string, prefix: string) => {
  options2.value = (MOCK_DATA[prefix] || []).map((value) => ({
    value,
  }))
}

const checkIsWhole = (pattern: string, prefix: string) => {
  return (MOCK_DATA[prefix] || []).includes(pattern)
}
</script>
```

:::

:::demo

```vue
<template>
  <w-form
    ref="ruleFormRef"
    style="max-width: 600px"
    :model="ruleForm"
    :rules="rules"
  >
    <w-form-item label="name" prop="name">
      <w-mention v-model="ruleForm.name" :options="options" />
    </w-form-item>
    <w-form-item label="desc" prop="desc">
      <w-mention v-model="ruleForm.desc" type="textarea" :options="options" />
    </w-form-item>
    <w-form-item>
      <w-button type="primary" @click="submitForm(ruleFormRef)">
        Submit
      </w-button>
      <w-button @click="resetForm(ruleFormRef)">Reset</w-button>
    </w-form-item>
  </w-form>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'
import type { FormInstance, FormRules } from 'win-design-next'

interface RuleForm {
  name: string
  desc: string
}
const ruleFormRef = ref<FormInstance>()
const ruleForm = reactive<RuleForm>({
  name: '',
  desc: '',
})

const options = ref([
  {
    label: 'Fuphoenixes',
    value: 'Fuphoenixes',
  },
  {
    label: 'kooriookami',
    value: 'kooriookami',
  },
  {
    label: 'Jeremy',
    value: 'Jeremy',
  },
  {
    label: 'btea',
    value: 'btea',
  },
])

const rules = reactive<FormRules<RuleForm>>({
  name: [{ required: true, message: '请输入 name', trigger: 'blur' }],
  desc: [{ required: true, message: '请输入 desc', trigger: 'blur' }],
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
</script>
```

:::

### API 文档

### Attributes

| 属性名                               | 说明                                                       | 类型                                                                         | 默认值     |
| ------------------------------------ | ---------------------------------------------------------- | ---------------------------------------------------------------------------- | ---------- |
| options                              | 提及选项列表                                               | ^[array]`MentionOption[]`                                                    | `[]`       |
| prefix                               | 触发字段的前缀。 字符串长度必须且只能为 1                  | ^[string] \| ^[array]`string[]`                                              | `'@'`      |
| split                                | 用于拆分提及的字符。 字符串长度必须且只能为 1              | ^[string]                                                                    | `' '`      |
| filter-option                        | 定制筛选器选项逻辑                                         | ^[false] \| ^[Function]`(pattern: string, option: MentionOption) => boolean` | —          |
| placement                            | 设置弹出位置                                               | ^[string]`'bottom' \| 'top'`                                                 | `'bottom'` |
| show-arrow                           | 下拉菜单的内容是否有箭头                                   | ^[boolean]                                                                   | `false`    |
| offset                               | 下拉面板偏移量                                             | ^[number]                                                                    | `0`        |
| whole                                | 当退格键被按下做删除操作时，是否将提及部分作为整体删除     | ^[boolean]                                                                   | `false`    |
| check-is-whole                       | 当退格键被按下做删除操作时，检查是否将提及部分作为整体删除 | ^[Function]`(pattern: string, prefix: string) => boolean`                    | —          |
| loading                              | 提及的下拉面板是否处于加载状态                             | ^[boolean]                                                                   | `false`    |
| model-value / v-model                | 输入值                                                     | ^[string]                                                                    | —          |
| popper-class                         | 自定义浮层类名                                             | ^[string]                                                                    | —          |
| popper-options                       | [popper.js](https://popper.js.org/docs/v2/) 参数           | ^[object] refer to [popper.js doc](https://popper.js.org/docs/v2/)           | —          |
| [input props](./input.md#attributes) | —                                                          | —                                                                            | —          |

### 事件

| 名称                              | 说明                 | 类型                                                         |
| --------------------------------- | -------------------- | ------------------------------------------------------------ |
| search                            | 按下触发字段时触发   | ^[Function]`(pattern: string, prefix: string) => void`       |
| select                            | 当用户选择选项时触发 | ^[Function]`(option: MentionOption, prefix: string) => void` |
| [input events](./input.md#events) | —                    | —                                                            |

### Slots

| 名称                            | 说明                | 类型                                              |
| ------------------------------- | ------------------- | ------------------------------------------------- |
| label                           | 自定义标签内容      | ^[object]`{ item: MentionOption, index: number }` |
| loading                         | 自定义 loading 内容 | —                                                 |
| header                          | 下拉列表顶部的内容  | —                                                 |
| footer                          | 下拉列表底部的内容  | —                                                 |
| [input slots](./input.md#slots) | —                   | —                                                 |

### Exposes

| 名称            | 说明               | 类型                                    |     |
| --------------- | ------------------ | --------------------------------------- | --- |
| input           | w-input 组件实例   | ^[object]`Ref<InputInstance \| null>`   |
| tooltip         | w-tooltip 组件实例 | ^[object]`Ref<TooltipInstance \| null>` |
| dropdownVisible | tooltip 显示状态   | ^[object]`ComputedRef<boolean>`         |

## 类型声明

<details>
  <summary>Show declarations</summary>

```ts
type MentionOption = {
  value: string
  label?: string
  disabled?: boolean
  [key: string]: any
}
```

</details>

---

## 类型声明

<details>
  <summary>显示类型声明</summary>

```ts
/**
 * @param index index of activated menu
 * @param indexPath index path of activated menu
 * @param item the selected menu item
 * @param routerResult result returned by `vue-router` if `router` is enabled
 */
type MenuSelectEvent = (
  index: string,
  indexPath: string[],
  item: MenuItemClicked,
  routerResult?: Promise<void | NavigationFailure>
) => void

/**
 * @param index index of expanded sub-menu
 * @param indexPath index path of expanded sub-menu
 */
type MenuOpenEvent = (index: string, indexPath: string[]) => void

/**
 * @param index index of collapsed sub-menu
 * @param indexPath index path of collapsed sub-menu
 */
type MenuCloseEvent = (index: string, indexPath: string[]) => void

interface MenuItemRegistered {
  index: string
  indexPath: string[]
  active: boolean
}

interface MenuItemClicked {
  index: string
  indexPath: string[]
  route?: RouteLocationRaw
}
```

</details>

---

## Pagination 分页

当数据量过多时，使用分页分解数据。

### 示例

:::demo 设置`layout`，表示需要显示的内容，用逗号分隔，布局元素会依次显示。 分页元素如下： `prev` (上一页按钮), `next` (下一页按钮), `pager` (分页列表), `jumper` (跳转), `total` (总计), `sizes` (每页条数选择) 和 `->` (every element after this symbol will be pulled to the right).

```vue
<template>
  <div class="mb-4">
    <w-title>默认</w-title>
    <w-pagination layout="prev, pager, next" :total="50" />
  </div>
  <w-divider />
  <div class="mb-4">
    <w-title>超过 7 页时</w-title>
    <w-pagination layout="prev, pager, next" :total="1000" />
  </div>
  <w-divider />
  <div class="mb-4">
    <w-title>设置background: false 属性可以去掉分页按钮背景色</w-title>
    <w-pagination
      :background="false"
      layout="prev, pager, next"
      :total="1000"
    />
  </div>
  <w-divider />
  <div class="mb-4">
    <w-title>🎉 无数字分页</w-title>
    <w-pagination
      :background="false"
      layout="prev, fraction, next"
      :total="1000"
    />
  </div>
</template>

<style scoped></style>
```

:::

:::demo 默认情况下，当总页数超过 7 页时，Pagination 会折叠多余的页码按钮。 通过 `pager-count` 属性可以设置最大页码按钮数。

```vue
<template>
  <w-pagination
    :page-size="20"
    :pager-count="11"
    layout="prev, pager, next"
    :total="1000"
  />
</template>
```

:::

:::demo 通过`size`更改大小 这是个 `small`的例子

```vue
<template>
  <w-pagination size="small" layout="prev, pager, next" :total="50" />
  <w-pagination
    size="small"
    :background="false"
    layout="prev, pager, next"
    :total="50"
    class="mt-4"
  />
</template>
```

:::

:::demo

```vue
<template>
  <div>
    <w-switch v-model="value" />
    <hr class="my-4" />
    <w-pagination
      :hide-on-single-page="value"
      :total="5"
      layout="prev, pager, next"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
const value = ref(false)
</script>
```

:::

:::demo 此示例是一个完整的用例。 使用了 `size-change` 和 `current-change` 事件来处理页码大小和当前页变动时候触发的事件。 `page-sizes`接受一个整数类型的数组，数组元素为展示的选择每页显示个数的选项，`[100, 200, 300, 400]` 表示四个选项，每页显示 100 个，200 个，300 个或者 400 个。

```vue
<template>
  <div class="flex items-center mb-4">
    <w-radio-group v-model="size" class="mr-4">
      <w-radio-button value="default">default</w-radio-button>
      <w-radio-button value="large">large</w-radio-button>
      <w-radio-button value="small">small</w-radio-button>
    </w-radio-group>
    <div>
      background:
      <w-switch v-model="background" class="ml-2" />
    </div>
    <div class="ml-4">
      disabled: <w-switch v-model="disabled" class="ml-2" />
    </div>
  </div>

  <hr class="my-4" />

  <div class="demo-pagination-block">
    <div class="demonstration">总条数</div>
    <w-pagination
      v-model:current-page="currentPage1"
      :page-size="100"
      :size="size"
      :disabled="disabled"
      :background="background"
      layout="total, prev, pager, next"
      :total="1000"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
  <div class="demo-pagination-block">
    <div class="demonstration">动态页数</div>
    <w-pagination
      v-model:current-page="currentPage2"
      v-model:page-size="pageSize2"
      :page-sizes="[100, 200, 300, 400]"
      :size="size"
      :disabled="disabled"
      :background="background"
      layout="sizes, prev, pager, next"
      :total="1000"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
  <div class="demo-pagination-block">
    <div class="demonstration">跳转</div>
    <w-pagination
      v-model:current-page="currentPage3"
      v-model:page-size="pageSize3"
      :size="size"
      :disabled="disabled"
      :background="background"
      layout="prev, pager, next, jumper"
      :total="1000"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
  <div class="demo-pagination-block">
    <div class="demonstration">全部配置</div>
    <w-pagination
      v-model:current-page="currentPage4"
      v-model:page-size="pageSize4"
      :page-sizes="[100, 200, 300, 400]"
      :size="size"
      :disabled="disabled"
      :background="background"
      layout="total, sizes, prev, pager, next, jumper"
      :total="400"
      @size-change="handleSizeChange"
      @current-change="handleCurrentChange"
    />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import type { ComponentSize } from 'win-design-next'
const currentPage1 = ref(5)
const currentPage2 = ref(5)
const currentPage3 = ref(5)
const currentPage4 = ref(4)
const pageSize2 = ref(100)
const pageSize3 = ref(100)
const pageSize4 = ref(100)
const size = ref<ComponentSize>('default')
const background = ref(false)
const disabled = ref(false)

const handleSizeChange = (val: number) => {
  console.log(`${val} items per page`)
}
const handleCurrentChange = (val: number) => {
  console.log(`current page: ${val}`)
}
</script>

<style scoped>
.demo-pagination-block + .demo-pagination-block {
  margin-top: 24px;
}
.demo-pagination-block .demonstration {
  margin-bottom: 16px;
}
</style>
```

:::

### API 文档

### 属性

| 属性名                              | 说明                                                                                                                           | 类型                                                                                        | 默认值                               |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------- | ------------------------------------ |
| size                                | 分页大小                                                                                                                       | ^[enum]`'large' \| 'default' \| 'small'`                                                    | 'default'                            |
| background                          | 是否为分页按钮添加背景色                                                                                                       | ^[boolean]                                                                                  | true                                 |
| page-size / v-model:page-size       | 每页显示条目个数                                                                                                               | ^[number]                                                                                   | —                                    |
| default-page-size                   | 每页默认的条目个数，不设置时默认为 10                                                                                          | ^[number]                                                                                   | —                                    |
| total                               | 总条目数                                                                                                                       | ^[number]                                                                                   | —                                    |
| page-count                          | 总页数， `total` 和 `page-count` 设置任意一个就可以达到显示页码的功能；如果要支持 `page-sizes` 的更改，则需要使用 `total` 属性 | ^[number]                                                                                   | —                                    |
| pager-count                         | 设置最大页码按钮数。 页码按钮的数量，当总页数超过该值时会折叠                                                                  | ^[number]`5 \| 7 \| 9 \| 11 \| 13 \| 15 \| 17 \| 19 \| 21`                                  | 7                                    |
| current-page / v-model:current-page | 当前页数                                                                                                                       | ^[number]                                                                                   | —                                    |
| default-current-page                | 当前页数的默认初始值，不设置时默认为 1                                                                                         | ^[number]                                                                                   | —                                    |
| layout                              | 组件布局，子组件名用逗号分隔                                                                                                   | ^[string]`string (consists of sizes, prev, pager, next, fraction, jumper, ->, total, slot)` | prev, pager, next, jumper, ->, total |
| page-sizes                          | 每页显示个数选择器的选项设置                                                                                                   | ^[object]`number[]`                                                                         | [10, 20, 30, 40, 50, 100]            |
| append-size-to                      | 下拉框挂载到哪个 DOM 元素                                                                                                      | ^[string]                                                                                   | —                                    |
| popper-class                        | 每页显示个数选择器的下拉框类名                                                                                                 | ^[string]                                                                                   | ''                                   |
| prev-text                           | 替代图标显示的上一页文字                                                                                                       | ^[string]                                                                                   | ''                                   |
| prev-icon                           | 上一页的图标， 比 `prev-text` 优先级更高                                                                                       | ^[string] / ^[Component]                                                                    | ArrowLeft                            |
| next-text                           | 替代图标显示的下一页文字                                                                                                       | ^[string]                                                                                   | ''                                   |
| next-icon                           | 下一页的图标， 比 `next-text` 优先级更低                                                                                       | ^[string] / ^[Component]                                                                    | ArrowRight                           |
| disabled                            | 是否禁用分页                                                                                                                   | ^[boolean]                                                                                  | false                                |
| teleported                          | 是否将下拉菜单 teleport 至 body                                                                                                | ^[boolean]                                                                                  | true                                 |
| hide-on-single-page                 | 只有一页时是否隐藏                                                                                                             | ^[boolean]                                                                                  | false                                |
| small ^(deprecated)                 | 是否使用小型分页样式                                                                                                           | ^[boolean]                                                                                  | false                                |

:::warning

我们现在会检查一些不合理的用法，如果发现分页器未显示，可以核对是否违反以下情形：

- `total` 和 `page-count` 必须传一个，不然组件无法判断总页数；优先使用 `page-count`;
- 如果传入了 `current-page`，必须监听 `current-page` 变更的事件（`@update:current-page`），否则分页切换不起作用；
- 如果传入了 `page-size`，且布局包含 page-size 选择器（即 `layout` 包含 `sizes`），必须监听 `page-size` 变更的事件（`@update:page-size`），否则分页大小的变化将不起作用。

:::

### 事件

| 名称           | 说明                                     | 类型                                                         |
| -------------- | ---------------------------------------- | ------------------------------------------------------------ |
| size-change    | `page-size` 改变时触发                   | ^[Function]`(value: number) => void`                         |
| current-change | `current-page` 改变时触发                | ^[Function]`(value: number) => void`                         |
| change         | `current-page` 或 `page-size` 更改时触发 | ^[Function]`(currentPage: number, pageSize: number) => void` |
| prev-click     | 用户点击上一页按钮改变当前页时触发       | ^[Function]`(value: number) => void`                         |
| next-click     | 用户点击下一页按钮改变当前页时触发       | ^[Function]`(value: number) => void`                         |

:::warning

以上事件不推荐使用（但由于兼容的原因仍然支持，在以后的版本中将会被删除）；如果要监听 current-page 和 page-size 的改变，使用 `v-model` 双向绑定是个更好的选择。

:::

### 插槽

| 名称    | 说明                                               |
| ------- | -------------------------------------------------- |
| default | 自定义内容 设置文案，需要在 `layout` 中列出 `slot` |

---

## Segmented 分段控制器

用于展示多个选项并允许用户选择其中单个选项。

### 示例

:::demo

```vue
<template>
  <w-title>基础用法：通过 size 设置尺寸</w-title>
  <div class="flex items-start gap-4 mb-4">
    <w-segmented v-model="value" :options="options" size="default" />
  </div>
  <div class="flex items-start gap-4 flex-wrap">
    <w-segmented v-model="value" :options="options" size="small" />
    <w-segmented v-model="value" :options="options" size="mini" />
    <w-segmented v-model="value" :options="options" size="large" />
  </div>
  <w-divider />
  <w-title>禁用状态</w-title>
  <w-segmented v-model="value" :options="options" disabled />
  <w-divider />
  <w-title>Block 分段选择器：设置block为true以适应父元素的宽度</w-title>
  <w-segmented v-model="value" :options="options" block />
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref('一周内')

const options = ['一周内', '一个月内', '三个月内', '六个月内', '一年内']
</script>
```

:::

:::demo

```vue
<template>
  <div>
    <w-segmented
      v-model="size"
      :options="sizeOptions"
      style="margin-bottom: 1rem"
    />
    <br />
    <w-segmented
      v-model="value"
      :options="options"
      direction="vertical"
      :size="size"
    >
      <template #default="scope">
        <div :class="['flex', 'items-center', 'flex-col', 'm-2']">
          <w-icon size="20">
            <component :is="scope.item.icon" />
          </w-icon>
          <div class="mt-2">{{ scope.item.label }}</div>
        </div>
      </template>
    </w-segmented>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Excel, Folder, Pdf, Ppt, Word } from '@win-design-next/icons-vue'
import type { SegmentedProps } from 'win-design-next'

const value = ref('Excel')
const size = ref<SegmentedProps['size']>('default')

const sizeOptions = ['large', 'default', 'small', 'mini']

const options = [
  {
    label: 'Excel',
    value: 'Excel',
    icon: Excel,
  },
  {
    label: 'Folder',
    value: 'Folder',
    icon: Folder,
    disabled: true,
  },
  {
    label: 'Pdf',
    value: 'Pdf',
    icon: Pdf,
  },
  {
    label: 'Ppt',
    value: 'Ppt',
    icon: Ppt,
  },
  {
    label: 'Word',
    value: 'Word',
    icon: Word,
  },
]
</script>
```

:::

:::demo

```vue
<template>
  <div class="custom-style">
    <w-segmented v-model="value" :options="options" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref('Delicacy')

const options = ['Delicacy', 'Desserts&Drinks', 'Fresh foods', 'Supermarket']
</script>

<style scoped>
.custom-style .w3-segmented {
  --w3-segmented-item-selected-color: var(--w3-color-white);
  --w3-segmented-item-selected-bg-color: #2d5afa;
  --w3-border-radius-base: 16px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div>
    <w-segmented v-model="value" :options="options">
      <template #default="scope">
        <div class="flex flex-col items-center gap-2 p-2">
          <w-icon size="20">
            <component :is="scope.item.icon" />
          </w-icon>
          <div>{{ scope.item.label }}</div>
        </div>
      </template>
    </w-segmented>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { Excel, Folder, Pdf, Ppt, Word } from '@win-design-next/icons-vue'

const value = ref('Excel')

const options = [
  {
    label: 'Excel',
    value: 'Excel',
    icon: Excel,
  },
  {
    label: 'Folder',
    value: 'Folder',
    icon: Folder,
  },
  {
    label: 'Pdf',
    value: 'Pdf',
    icon: Pdf,
  },
  {
    label: 'Ppt',
    value: 'Ppt',
    icon: Ppt,
  },
  {
    label: 'Word',
    value: 'Word',
    icon: Word,
    disabled: true,
  },
]
</script>
```

:::

### API 文档

### 属性

| 名称                  | 说明                   | 类型                               | 默认值      |
| --------------------- | ---------------------- | ---------------------------------- | ----------- | 
| model-value / v-model | 绑定值                 | ^[string] / ^[number] / ^[boolean] | —           |
| options               | 选项的数据             | ^[array]`Option[]`                 | []          |
| size                  | 组件大小               | ^[enum]`'' \| 'large' \| 'default' \| 'small' \| 'mini'` | ''  |
| block                 | 撑满父元素宽度         | ^[boolean]                         | —           |
| disabled              | 是否禁用               | ^[boolean]                         | false       |
| validate-event        | 是否触发表单验证       | ^[boolean]                         | true        |
| name                  | 原生 name 属性         | ^[string]                          | —           |
| id                    | 原生 `id` 属性         | ^[string]                          | —           |
| aria-label ^(a11y)    | 原生 `aria-label` 属性 | ^[string]                          | —           |
| direction             | 展示的方向             | ^[enum]`'horizontal' \| 'vertical'`            | 'vertical'` | horizontal   |

### 事件

| 名称   | 说明                                   | 类型                            |
| ------ | -------------------------------------- | ------------------------------- |
| change | 当所选值更改时触发，参数是当前选中的值 | ^[Function]`(val: any) => void` |

### Slots

| 名称    | 说明               | 类型                        |
| ------- | ------------------ | --------------------------- |
| default | 自定义 Option 模板 | ^[object]`{ item: Option }` |

## 类型声明

<details>
  <summary>Show declarations</summary>

```ts
type Option =
  | {
      label: string
      value: string | number | boolean
      disabled?: boolean
      [key: string]: any
    }
  | string
  | number
  | boolean
```

</details>

---

## Slider 滑块

通过拖动滑块在一个固定区间内进行选择

### 示例

:::demo 通过设置绑定值自定义滑块的初始值

```vue
<template>
  <div class="slider-demo-block">
    <span class="demonstration">默认</span>
    <w-slider v-model="value1" />
  </div>
  <div class="slider-demo-block">
    <span class="demonstration">自定义初始值</span>
    <w-slider v-model="value2" />
  </div>
  <div class="slider-demo-block">
    <span class="demonstration">隐藏 Tooltip</span>
    <w-slider v-model="value3" :show-tooltip="false" />
  </div>
  <div class="slider-demo-block">
    <span class="demonstration">格式化 Tooltip</span>
    <w-slider v-model="value4" :format-tooltip="formatTooltip" />
  </div>
  <div class="slider-demo-block">
    <span class="demonstration">禁用</span>
    <w-slider v-model="value5" disabled />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref(0)
const value2 = ref(10)
const value3 = ref(0)
const value4 = ref(0)
const value5 = ref(0)

const formatTooltip = (val: number) => {
  return val / 100
}
</script>

<style scoped>
.slider-demo-block {
  max-width: 600px;
  display: flex;
  align-items: center;
}
.slider-demo-block .w3-slider {
  margin-top: 0;
  margin-left: 12px;
}
.slider-demo-block .demonstration {
  font-size: 14px;
  color: var(--w3-font-color-third);
  line-height: 44px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0;
}
.slider-demo-block .demonstration + .w3-slider {
  flex: 0 0 70%;
}
</style>
```

:::

:::demo 改变`step`的值可以改变步长， 通过设置 `show-stops` 属性可以显示间断点

```vue
<template>
  <div class="slider-demo-block">
    <span class="demonstration">不显示间断点</span>
    <w-slider v-model="value1" :step="10" />
  </div>
  <div class="slider-demo-block">
    <span class="demonstration">显示间断点</span>
    <w-slider v-model="value2" :step="10" show-stops />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref(0)
const value2 = ref(0)
</script>

<style scoped>
.slider-demo-block {
  max-width: 600px;
  display: flex;
  align-items: center;
}
.slider-demo-block .w3-slider {
  margin-top: 0;
  margin-left: 12px;
}
.slider-demo-block .demonstration {
  font-size: 14px;
  color: var(--w3-font-color-third);
  line-height: 44px;
  flex: 1;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  margin-bottom: 0;
}
.slider-demo-block .demonstration + .w3-slider {
  flex: 0 0 70%;
}
</style>
```

:::

:::demo 设置 `show-input` 属性会在右侧显示一个输入框

```vue
<template>
  <div class="slider-demo-block">
    <w-slider v-model="value" show-input />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref(0)
</script>

<style scoped>
.slider-demo-block {
  max-width: 600px;
  display: flex;
  align-items: center;
}
.slider-demo-block .w3-slider {
  margin-top: 0;
  margin-left: 12px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="slider-demo-block">
    <w-slider v-model="value" show-input size="large" />
    <w-slider v-model="value" show-input />
    <w-slider v-model="value" show-input size="small" />
    <w-slider v-model="value" show-input size="mini" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref(0)
</script>

<style scoped>
.slider-demo-block {
  max-width: 600px;
}

.w3-slider {
  margin-top: 20px;
}

.w3-slider:first-child {
  margin-top: 0;
}
</style>
```

:::

:::demo

```vue
<template>
  <div class="slider-demo-block">
    <w-slider v-model="value1" />
  </div>
  <div class="slider-demo-block">
    <w-slider v-model="value2" placement="bottom" />
  </div>
  <div class="slider-demo-block">
    <w-slider v-model="value3" placement="right" />
  </div>
  <div class="slider-demo-block">
    <w-slider v-model="value4" placement="left" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value1 = ref(0)
const value2 = ref(0)
const value3 = ref(0)
const value4 = ref(0)
</script>

<style scoped>
.slider-demo-block {
  max-width: 600px;
  display: flex;
  align-items: center;
}
.slider-demo-block .w3-slider {
  margin-top: 0;
  margin-left: 12px;
}
</style>
```

:::

:::demo 配置 `range` 属性以激活范围选择模式，该属性的绑定值是一个数组，由最小边界值和最大边界值组成。

```vue
<template>
  <div class="slider-demo-block">
    <w-slider v-model="value" range show-stops :max="10" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref([4, 8])
</script>

<style scoped>
.slider-demo-block {
  max-width: 600px;
  display: flex;
  align-items: center;
}
.slider-demo-block .w3-slider {
  margin-top: 0;
  margin-left: 12px;
}
</style>
```

:::

:::demo 配置 `vertical` 属性为 `true` 启用垂直模式。 在垂直模式下，必须设置 `height` 属性。

```vue
<template>
  <div class="slider-demo-block">
    <w-slider v-model="value" vertical height="200px" />
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const value = ref(0)
</script>

<style scoped>
.slider-demo-block {
  max-width: 600px;
  display: flex;
  align-items: center;
}
.slider-demo-block .w3-slider {
  margin-top: 0;
  margin-left: 12px;
}
</style>
```

:::

:::demo 设置 `marks` 属性可以在滑块上显示标记。

```vue
<template>
  <div class="slider-demo-block">
    <w-slider v-model="value" range :marks="marks" />
  </div>
</template>

<script lang="ts" setup>
import { reactive, ref } from 'vue'

import type { CSSProperties } from 'vue'

interface Mark {
  style: CSSProperties
  label: string
}

type Marks = Record<number, Mark | string>

const value = ref([30, 60])
const marks = reactive<Marks>({
  0: '0°C',
  8: '8°C',
  37: '37°C',
  50: {
    style: {
      color: '#2d5afa',
    },
    label: '50%',
  },
})
</script>

<style scoped>
.slider-demo-block {
  max-width: 600px;
  display: flex;
  align-items: center;
}
.slider-demo-block .w3-slider {
  margin-top: 0;
  margin-left: 12px;
}
</style>
```

:::

### API 文档

### 属性

| 属性名                      | 描述                                                                                      | 类型                                                                                                                                                                        | 默认    |
| --------------------------- | ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| model-value / v-model       | 选中项绑定值                                                                              | ^[number] / ^[object]`number[]`                                                                                                                                             | 0       |
| min                         | 最小值                                                                                    | ^[number]                                                                                                                                                                   | 0       |
| max                         | 最大值                                                                                    | ^[number]                                                                                                                                                                   | 100     |
| disabled                    | 是否禁用                                                                                  | ^[boolean]                                                                                                                                                                  | false   |
| step                        | 步长                                                                                      | ^[number]                                                                                                                                                                   | 1       |
| show-input                  | 是否显示输入框，仅在非范围选择时有效                                                      | ^[boolean]                                                                                                                                                                  | false   |
| show-input-controls         | 在显示输入框的情况下，是否显示输入框的控制按钮                                            | ^[boolean]                                                                                                                                                                  | true    |
| size                        | slider 包装器的大小，垂直模式下该属性不可用                                               | ^[enum]`'' \| 'large' \| 'default' \| 'small'`                                                                                                                              | default |
| input-size                  | 输入框的大小，如果设置了 `size` 属性，默认值自动取 `size`                                 | ^[enum]`'' \| 'large' \| 'default' \| 'small'`                                                                                                                              | default |
| show-stops                  | 是否显示间断点                                                                            | ^[boolean]                                                                                                                                                                  | false   |
| show-tooltip                | 是否显示提示信息                                                                          | ^[boolean]                                                                                                                                                                  | true    |
| format-tooltip              | 格式化提示信息                                                                            | ^[Function]`(value: number) => number \| string`                                                                                                                            | —       |
| range                       | 是否开启选择范围                                                                          | ^[boolean]                                                                                                                                                                  | false   |
| vertical                    | 垂直模式                                                                                  | ^[boolean]                                                                                                                                                                  | false   |
| height                      | 滑块高度，垂直模式必填                                                                    | ^[string]                                                                                                                                                                   | —       |
| aria-label ^(a11y)          | 原生 `aria-label`属性                                                                     | ^[string]                                                                                                                                                                   | —       |
| range-start-label           | 当 `range` 为 true 时，屏幕阅读器标签开始的标记                                           | ^[string]                                                                                                                                                                   | —       |
| range-end-label             | 当 `range` 为 true 时，屏幕阅读器标签结尾的标记                                           | ^[string]                                                                                                                                                                   | —       |
| format-value-text           | 显示屏幕阅读器的 `aria-valuenow` 属性的格式                                               | ^[Function]`(value: number) => string`                                                                                                                                      | —       |
| tooltip-class               | tooltip 的自定义类名                                                                      | ^[string]                                                                                                                                                                   | —       |
| placement                   | Tooltip 出现的位置                                                                        | ^[enum]`'top' \| 'top-start' \| 'top-end' \| 'bottom' \| 'bottom-start' \| 'bottom-end' \| 'left' \| 'left-start' \| 'left-end' \| 'right' \| 'right-start' \| 'right-end'` | top     |
| marks                       | 标记， key 的类型必须为 `number` 且取值在闭区间 `[min, max]` 内，每个标记可以单独设置样式 | ^[object]`SliderMarks`                                                                                                                                                      | —       |
| validate-event              | 输入时是否触发表单的校验                                                                  | ^[boolean]                                                                                                                                                                  | true    |
| label ^(a11y) ^(deprecated) | 原生 `aria-label`属性                                                                     | ^[string]                                                                                                                                                                   | —       |

### 事件

| 事件名 | 说明                                               | 类型                                               |
| ------ | -------------------------------------------------- | -------------------------------------------------- |
| change | 值改变时触发（使用鼠标拖曳时，只在松开鼠标后触发） | ^[Function]`(value: Arrayable<number>) => boolean` |
| input  | 数据改变时触发（使用鼠标拖曳时，活动过程实时触发） | ^[Function]`(value: Arrayable<number>) => boolean` |

## 类型声明

<details>
  <summary>显示类型声明</summary>

```ts
type SliderMarks = Record<number, string | { style: CSSProperties; label: any }>
type Arrayable<T> = T | T[]
```

</details>

---

## Type Declarations

<details>
  <summary>显示类型声明</summary>

```ts
interface Sort {
  prop: string
  order: 'ascending' | 'descending'
  init?: any
  silent?: any
}

interface TreeNode {
  expanded?: boolean
  loading?: boolean
  noLazyChildren?: boolean
  indent?: number
  level?: number
  display?: boolean
}
```

</details>

## 常见问题解答（FAQ）

#### 如何在表格中使用图像预览？

```vue{4}
<template>
  <w-table-column width="180">
    <template #default="scope">
      <w-image preview-teleported :preview-src-list="srcList" />
    </template>
  </w-table-column>
</template>
```

#### 当使用 DOM 模板时，为什么列没有渲染？

这是因为 HTML 定义只允许一些特定元素省略关闭标签，最常见的是 `<input>` 和 `<img>`。 对于任意其他元素，如果你省略了关闭标签，原生的 HTML 解析器会认为你从未关闭打开的标签。

详情请参阅 [Vue 文档](https://vuejs.org/guide/essentials/component-basics.html#self-closing-tags)。

---

## Type Declarations

<details>
<summary>显示类型声明</summary>

```ts
type HeaderClassGetter = (param: {
  columns: Column<any>[]
  headerIndex: number
}) => string

type HeaderPropsGetter = (param: {
  columns: Column<any>[]
  headerIndex: number
}) => Record<string, any>

type HeaderCellPropsGetter = (param: {
  columns: Column<any>[]
  column: Column<any>
  columnIndex: number
  headerIndex: number
  style: CSSProperties
}) => Record<string, any>

type RowClassGetter = (param: {
  columns: Column<any>[]
  rowData: any
  rowIndex: number
}) => string

type RowPropsGetter = (param: {
  columns: Column<any>[]
  rowData: any
  rowIndex: number
}) => Record<string, any>

type CellPropsGetter = (param: {
  column: Column<any>
  columns: Column<any>[]
  columnIndex: number
  cellData: any
  rowData: any
  rowIndex: number
}) => void

type DataGetterParams<T> = {
  columns: Column<T>[]
  column: Column<T>
  columnIndex: number
} & RowCommonParams

type DataGetter<T> = (params: DataGetterParams<T>) => T

type CellRenderProps<T> = {
  cellData: T
  column: Column<T>
  columns: Column<T>[]
  columnIndex: number
  rowData: any
  rowIndex: number
}

type HeaderRenderProps<T> = {
  column: Column<T>
  columns: Column<T>[]
  columnIndex: number
  headerIndex: number
}

type ScrollParams = {
  xAxisScrollDir: 'forward' | 'backward'
  scrollLeft: number
  yAxisScrollDir: 'forward' | 'backward'
  scrollTop: number
}

type CellSlotProps<T> = {
  column: Column<T>
  columns: Column<T>[]
  columnIndex: number
  depth: number
  style: CSSProperties
  rowData: any
  rowIndex: number
  isScrolling: boolean
  expandIconProps?:
    | {
        rowData: any
        rowIndex: number
        onExpand: (expand: boolean) => void
      }
    | undefined
}

type HeaderSlotProps = {
  cells: VNode[]
  columns: Column<any>[]
  headerIndex: number
}

type HeaderCellSlotProps = {
  class: string
  columns: Column<any>[]
  column: Column<any>
  columnIndex: number
  headerIndex: number
  style: CSSProperties
  headerCellProps?: any
  sortBy: SortBy
  sortState?: SortState | undefined
  onColumnSorted: (e: MouseEvent) => void
}

type RowCommonParams = {
  rowData: any
  rowIndex: number
}

type RowEventHandlerParams = {
  rowKey: KeyType
  event: Event
} & RowCommonParams

type RowEventHandler = (params: RowEventHandlerParams) => void
type RowEventHandlers = {
  onClick?: RowEventHandler
  onContextmenu?: RowEventHandler
  onDblclick?: RowEventHandler
  onMouseenter?: RowEventHandler
  onMouseleave?: RowEventHandler
}

type RowsRenderedParams = {
  rowCacheStart: number
  rowCacheEnd: number
  rowVisibleStart: number
  rowVisibleEnd: number
}

type RowSlotProps = {
  columns: Column<any>[]
  rowData: any
  columnIndex: number
  rowIndex: number
  data: any
  key: number | string
  isScrolling?: boolean
  style: CSSProperties
}

type RowExpandParams = {
  expanded: boolean
  rowKey: KeyType
} & RowCommonParams

type Data = {
  [key: KeyType]: any
  children?: Array<any>
}

type FixedData = Data

type KeyType = string | number | symbol

type ColumnSortParam<T> = { column: Column<T>; key: KeyType; order: SortOrder }

enum SortOrder {
  ASC = 'asc',
  DESC = 'desc',
}

type SortBy = { key: KeyType; Order: SortOrder }
type SortState = Record<KeyType, SortOrder>
```

</details>

## 常见问题

#### 如何在第一列中渲染带复选框的列表？

由于可以自己定义单元格渲染器，您可以根据示例 [自定义单元格渲染器](#customize-cell-renderer) 代码来渲染 `checkbox`，并自行管理其状态。

---

## Type Declarations

<details>
  <summary>Show declarations</summary>

```ts
import type { h as H, VNode } from 'vue'

type TransferKey = string | number

type TransferDirection = 'left' | 'right'

type TransferDataItem = Record<string, any>

type renderContent = (h: typeof H, option: TransferDataItem) => VNode | VNode[]

interface TransferFormat {
  noChecked?: string
  hasChecked?: string
}

interface TransferPropsAlias {
  label?: string
  key?: string
  disabled?: string
}
```

</details>

---

## 内置过渡动画

WinDesign Next 内应用在部分组件的过渡动画，你也可以直接使用。 在使用之前，请阅读 [官方的过渡组件文档](https://vuejs.org/guide/built-ins/transition.html)。

### 示例

:::demo 提供 `w-fade-in-linear` 和 `w-fade-in` 两种效果。

```vue
<template>
  <div>
    <w-button @click="show = !show">点击</w-button>

    <div style="display: flex; margin-top: 20px; height: 100px">
      <transition name="w3-fade-in-linear">
        <div v-show="show" class="transition-box">.w3-fade-in-linear</div>
      </transition>
      <transition name="w3-fade-in">
        <div v-show="show" class="transition-box">.w3-fade-in</div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const show = ref(true)
</script>

<style>
.transition-box {
  margin-bottom: 10px;
  width: 200px;
  height: 100px;
  border-radius: 4px;
  background-color: #2d5afa;
  text-align: center;
  color: #fff;
  padding: 40px 20px;
  box-sizing: border-box;
  margin-right: 20px;
}
</style>
```

:::

:::demo `w-zoom-in-left`, `w-zoom-in-center`, `w-zoom-in-top` and `w-zoom-in-bottom` are provided.

```vue
<template>
  <div>
    <w-button @click="show = !show">点击</w-button>

    <div style="display: flex; margin-top: 20px; height: 100px">
      <transition name="w3-zoom-in-left">
        <div v-show="show" class="transition-box">.w3-zoom-in-left</div>
      </transition>

      <transition name="w3-zoom-in-center">
        <div v-show="show" class="transition-box">.w3-zoom-in-center</div>
      </transition>

      <transition name="w3-zoom-in-top">
        <div v-show="show" class="transition-box">.w3-zoom-in-top</div>
      </transition>

      <transition name="w3-zoom-in-bottom">
        <div v-show="show" class="transition-box">.w3-zoom-in-bottom</div>
      </transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const show = ref(true)
</script>

<style>
.transition-box {
  margin-bottom: 10px;
  width: 200px;
  height: 100px;
  border-radius: 4px;
  background-color: #2d5afa;
  text-align: center;
  color: #fff;
  padding: 40px 20px;
  box-sizing: border-box;
  margin-right: 20px;
}
</style>
```

:::

:::demo

```vue
<template>
  <div>
    <w-button @click="show = !show">点击</w-button>

    <div style="margin-top: 20px">
      <w-collapse-transition>
        <div v-show="show" style="height: 400px">
          <div class="transition-box">w-collapse-transition</div>
          <div class="transition-box">w-collapse-transition</div>
        </div>
      </w-collapse-transition>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref } from 'vue'

const show = ref(true)
</script>

<style>
.transition-box {
  margin-bottom: 10px;
  width: 200px;
  height: 100px;
  border-radius: 4px;
  background-color: #2d5afa;
  text-align: center;
  color: #fff;
  padding: 40px 20px;
  box-sizing: border-box;
  margin-right: 20px;
}
</style>
```

:::

---

## 类型声明

<details>
  <summary>显示类型声明</summary>

```ts
type CacheOption = {
  value: string | number | boolean | object
  currentLabel: string | number
  isDisabled: boolean
}
```

</details>

---

## 类型声明

<details>
  <summary>显示类型声明</summary>

```ts
type UploadFiles = UploadFile[]

type UploadUserFile = Omit<UploadFile, 'status' | 'uid'> &
  Partial<Pick<UploadFile, 'status' | 'uid'>>

type UploadStatus = 'ready' | 'uploading' | 'success' | 'fail'

type Awaitable<T> = Promise<T> | T

type Mutable<T> = { -readonly [P in keyof T]: T[P] }

interface UploadFile {
  name: string
  percentage?: number
  status: UploadStatus
  size?: number
  response?: unknown
  uid: number
  url?: string
  raw?: UploadRawFile
}

interface UploadProgressEvent extends ProgressEvent {
  percent: number
}

interface UploadRawFile extends File {
  uid: number
}

interface UploadRequestOptions {
  action: string
  method: string
  data: Record<string, string | Blob | [string | Blob, string]>
  filename: string
  file: UploadRawFile
  headers: Headers | Record<string, string | number | null | undefined>
  onError: (evt: UploadAjaxError) => void
  onProgress: (evt: UploadProgressEvent) => void
  onSuccess: (response: any) => void
  withCredentials: boolean
}
```

</details>

---

