<!-- Sc 订单利润：顶部维度 Tab + 各维度面板（tab-panel.vue）。
     面板内含搜索栏、经营总览、趋势图、明细表；数据来自订单利润接口。 -->
<template>
  <div
    class="sc-profit-page art-full-height"
    v-auth="'finance:scProfit:view'"
    :style="{
      // 45px = 基座固定顶栏高度：Tab 吸顶贴住顶栏底边；96px = 顶栏(45)+间距(6)+Tab(33)+与搜索栏间距(12)
      '--asin-tab-top': '45px',
      '--asin-search-top': '96px'
    }"
  >
    <!-- 顶部维度 Tab（参照 asin 看板）：吸顶 -->
    <div class="profit-tabs-sticky">
      <ElTabs v-model="activeTab" class="profit-tabs">
        <ElTabPane v-for="t in boardTabs" :key="t.value" :label="t.label" :name="t.value" />
      </ElTabs>
    </div>

    <!--
      维度面板：KeepAlive + 按 activeTab 的 :key（参照 asin 看板 board-panel）。
      每个 Tab 一个独立实例并被缓存，首次进入才创建、切走保留、切回恢复：
      搜索条件、指标卡配置、趋势选中、折叠态、明细表本地态与已加载数据各 Tab 互不影响。
    -->
    <KeepAlive>
      <TabPanel :key="activeTab" :tab="activeTab" />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { ElTabs, ElTabPane } from 'element-plus'
  import TabPanel from './components/tab-panel.vue'

  defineOptions({ name: 'ScProfit' })

  // 顶部维度 Tab（参照 asin 看板：看板/父ASIN/ASIN/MSKU/SPU/订单）
  const boardTabs = [
    { label: '看板', value: 'dashboard' },
    { label: '父ASIN', value: 'parentAsin' },
    { label: 'ASIN', value: 'asin' },
    { label: 'MSKU', value: 'msku' },
    { label: 'SPU', value: 'spu' },
    { label: '订单', value: 'order' }
  ]
  const activeTab = ref('dashboard')
</script>

<style lang="scss" scoped>
  .sc-profit-page {
    display: flex;
    flex-direction: column;
    padding-bottom: 20px;
    // 注意：此处不能设 overflow，否则会抢占 sticky 滚动上下文导致 Tab/搜索栏无法吸顶
  }

  // Tab 吸顶容器：吸顶到基座固定顶栏之下（top 由 --asin-tab-top 提供）
  .profit-tabs-sticky {
    position: sticky;
    top: var(--asin-tab-top, 0);
    z-index: 19;
    flex-shrink: 0;
    padding-top: 6px;
    padding-bottom: 20px;
    background-color: var(--art-main-bg-color);
  }

  // 顶部维度 Tab（参照 asin 看板样式）
  .profit-tabs {
    :deep(.el-tabs__header) {
      margin: 0;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    :deep(.el-tabs__nav-wrap)::after {
      display: none;
    }

    :deep(.el-tabs__item) {
      height: 32px;
      padding: 0 24px;
      font-size: 14px;
      line-height: 32px;
      color: var(--art-gray-700);

      &.is-active {
        font-weight: 600;
        color: var(--el-color-primary);
      }
    }

    :deep(.el-tabs__active-bar) {
      height: 2px;
      background-color: var(--el-color-primary);
    }
  }
</style>
