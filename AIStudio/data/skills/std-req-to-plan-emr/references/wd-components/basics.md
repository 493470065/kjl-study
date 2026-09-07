## 结合 w-icon 使用

`w-icon` 为 raw SVG 图标提供额外的属性, 提供的详细属性请继续阅读。

```vue
<template>
  <w-icon :size="20" color="#409efc" class="no-inherit">
    <Search />
  </w-icon>
  <w-icon class="is-loading">
    <Loading />
  </w-icon>
  <w-icon>
    <Search />
  </w-icon>
  <w-button type="primary">
    <w-icon style="vertical-align: middle">
      <Search />
    </w-icon>
    <span style="vertical-align: middle"> Search </span>
  </w-button>
</template>
```

<WRow>
  <p>
    通过添加额外的类名 <b>is-loading</b>，你的图标就可以在 2 秒内旋转 360 度，当然你也可以自己改写想要的动画。
  </p>
  <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
    <WIcon :size="20" color="#409efc" class="no-inherit">
      <Search />
    </WIcon>
    <WIcon class="is-loading">
      <Loading />
    </WIcon>
    <WIcon>
      <Search />
    </WIcon>
    <WButton type="primary">
      <WIcon style="vertical-align: middle; color: #fff;">
        <Search />
      </WIcon>
      <span style="vertical-align: middle;"> 搜索 </span>
    </WButton>
  </div>
</WRow>

## 图标集合{#icon-collection}

:::tip

只要你安装了 @win-design-next/icons-vue，**就可以在任意版本里使用 SVG 图标**。

**您可以点击图标复制代码。**

:::

## 结合 w-icon 使用

`w-icon` 为 raw SVG 图标提供额外的属性, 提供的详细属性请继续阅读。

```vue
<template>
  <w-icon :size="40" class="no-inherit">
    <SignZilingyao />
  </w-icon>
</template>
```

<WRow>
  <p>
    通过添加额外的类名 <b>is-loading</b>，你的图标就可以在 2 秒内旋转 360 度，当然你也可以自己改写想要的动画。
  </p>
  <div style="display: flex; align-items: center; gap: 12px; width: 100%;">
    <WIcon :size="40" class="no-inherit">
      <SignZilingyao />
    </WIcon>
  </div>
</WRow>

## 图标集合{#icon-collection}

:::tip

只要你安装了 @win-design-next/iconi-vue，**就可以在任意版本里使用 SVG 图标**。

**您可以点击图标复制代码。**

:::

