<template>
  <!--
    多语转译：承载「医疗文书双语转译审核系统 v4.0」静态交互原型。
    原型为自包含 HTML（public/i18n/medical-bilingual-audit-v4.html），
    通过 iframe 全高度嵌入，交互（患者切换/语言生成/编辑留痕/审核锁定/日志）与源页面完全一致。
    高度口径：视口 - 顶栏58px - el-main 上下内边距48px。
  -->
  <div class="i18n-translate-embed">
    <iframe
      class="i18n-translate-frame"
      src="/i18n/medical-bilingual-audit-v4.html"
      title="国际患者双语转译审核系统 v4.0"
    ></iframe>
  </div>
</template>

<script setup lang="ts">
// 纯静态承载页：无逻辑。原型内部自带状态管理（原生 JS）。
</script>

<style scoped>
.i18n-translate-embed {
  /* 抵消 el-main 的 24px 内边距，让原型三栏布局横向铺满 */
  margin: -24px;
  height: calc(100vh - 58px);
  background: #f5f5f5;
}

.i18n-translate-frame {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}
</style>
