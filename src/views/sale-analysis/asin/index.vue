<!-- ASIN看板：演示 art-table-group（彩色分组表头）与 art-table-header-group（分组列设置）能力 -->
<template>
  <div
    class="asin-board art-full-height"
    :style="{
      // 51px = 基座（微前端宿主）固定顶栏高度(45) + 额外下移(6)：Tab 露在顶栏下方。
      // 96px = Tab 吸顶位(51) + Tab 自身高度(45)：搜索栏再往下贴在 Tab 之下。
      // 独立运行/嵌入(无顶栏无 Tab)时均取 0。若宿主顶栏高度变化，改这两个数即可。
      '--asin-tab-top': embedded ? '0px' : '50px',
      '--asin-search-top': embedded ? '0px' : '95px'
    }"
  >
    <!-- 顶部看板切换（嵌入模式由父组件指定类型，隐藏内部 Tab） -->
    <!-- 用普通 div 承载 sticky：直接贴在 ElTabs 组件根上，会被其内部 overflow:hidden 影响导致吸顶失效 -->
    <div v-if="!embedded" class="board-tabs-sticky">
      <ElTabs v-model="activeTab" class="board-tabs">
        <ElTabPane v-for="t in boardTabs" :key="t.value" :label="t.label" :name="t.value" />
      </ElTabs>
    </div>

    <!--
      看板面板：搜索栏 + 日销售统计 + 分时汇总 + 分时对比。
      KeepAlive + 按 activeTab 的 :key：每个 Tab 一个独立实例并被缓存，
      首次进入才创建，切走保留、切回恢复，三个看板查询条件互不影响。
    -->
    <KeepAlive>
      <BoardPanel :key="panelKey" :active-tab="activeTab" :default-query="mergedDefaultQuery" />
    </KeepAlive>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { useRoute } from 'vue-router'
  import BoardPanel, { type BoardDefaultQuery } from './components/board-panel.vue'
  import type { AsinBoardType } from '@/api/sale/asin'
  import { ASIN_BOARD_TABS, BOARD_TYPE_TO_TAB } from './board-tabs'

  defineOptions({ name: 'asinView' })

  /** 顶部看板 Tab */
  const boardTabs = ref([...ASIN_BOARD_TABS])

  /**
   * embedded：作为子组件嵌入时隐藏内部看板 Tab（看板类型由父组件指定）；
   * boardType：嵌入时固定的看板类型；
   * defaultQuery：父组件带入的查询条件，作为搜索栏初始值（透传给 BoardPanel）。
   */
  const props = withDefaults(
    defineProps<{
      embedded?: boolean
      boardType?: AsinBoardType
      defaultQuery?: BoardDefaultQuery
    }>(),
    { embedded: false }
  )

  const route = useRoute()

  /** 看板类型 -> 内部 Tab 值（见 board-tabs.ts） */

  const parseCsvQuery = (raw: unknown): string[] | undefined => {
    if (raw === undefined || raw === null || raw === '') return undefined
    if (Array.isArray(raw)) return raw.map(String).filter(Boolean)
    return String(raw)
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean)
  }

  /** 销量统计等页面通过路由 query 带入的查询条件 */
  const routeDefaultQuery = computed((): BoardDefaultQuery | undefined => {
    const q = route.query
    const keyword = String(q.keyword || q.asin || '').trim()
    if (!keyword) return undefined

    const dateStart = String(q.dateStart || '').trim()
    const dateEnd = String(q.dateEnd || '').trim()
    const periodType = String(q.periodType || 'day')
    const searchType = String(q.searchType || 'asin')

    return {
      keyword,
      searchType,
      site: parseCsvQuery(q.site),
      shop: parseCsvQuery(q.shop),
      dateRange: dateStart && dateEnd ? [dateStart, dateEnd] : undefined,
      periodType: periodType === 'week' || periodType === 'month' ? periodType : 'day'
    }
  })

  const routeBoardType = computed((): AsinBoardType | undefined => {
    const boardType = route.query.boardType
    if (boardType === 'asin' || boardType === 'scasin' || boardType === 'vcasin') {
      return boardType
    }
    return undefined
  })

  const mergedDefaultQuery = computed(() => ({
    ...props.defaultQuery,
    ...routeDefaultQuery.value
  }))

  const resolvedBoardType = computed(() => props.boardType || routeBoardType.value)

  const activeTab = ref(
    resolvedBoardType.value ? BOARD_TYPE_TO_TAB[resolvedBoardType.value] : 'all'
  )

  watch(resolvedBoardType, (boardType) => {
    if (boardType) activeTab.value = BOARD_TYPE_TO_TAB[boardType]
  })

  /** 查询条件变化时重挂载面板，确保搜索栏与数据同步（嵌入 props / 路由 query 均适用） */
  const panelKey = computed(() => {
    const query = mergedDefaultQuery.value
    if (!query?.keyword) return activeTab.value
    return [
      activeTab.value,
      query.keyword,
      query.searchType,
      query.dateRange?.join('~') || '',
      query.shop?.join(',') || '',
      query.site?.join(',') || '',
      query.periodType || 'day'
    ].join('|')
  })

  // const addTab = () => {
  //   const newTabName = `11`
  //   boardTabs.value.push({
  //     value: 'New Tab',
  //     label: newTabName
  //   })
  //   activeTab.value = newTabName
  // }
  // const removeTab = (targetName: TabPaneName) => {
  //   const tabs = boardTabs.value
  //   let activeName = activeTab.value
  //   if (activeName === targetName) {
  //     tabs.forEach((tab, index) => {
  //       if (tab.value === targetName) {
  //         const nextTab = tabs[index + 1] || tabs[index - 1]
  //         if (nextTab) {
  //           activeName = nextTab.value
  //         }
  //       }
  //     })
  //   }

  //   activeTab.value = activeName
  //   boardTabs.value = tabs.filter((tab) => tab.value !== targetName)
  // }
</script>

<style lang="scss" scoped>
  .asin-board {
    display: flex;
    flex-direction: column;
    padding-bottom: 20px;
    // padding: 12px 16px;
    // 注意：这里不能设 overflow（auto/hidden/scroll）。
    // 本页真正滚动的是外层容器（子应用模式下为基座，独立运行时为 #app-main），
    // 若此处设 overflow 会“抢占”sticky 的滚动上下文，导致 Tab/搜索栏无法吸顶。
  }

  // Tab 吸顶容器：吸顶到基座固定顶栏之下（top 由 --asin-tab-top 提供）。
  // padding-bottom 加大：让背景向下多延伸，盖住与搜索栏之间的缝隙（多出的部分被更高层级的搜索栏遮住）。
  // z-index 比搜索栏低，重叠处由搜索栏覆盖，避免透出滚动内容。
  .board-tabs-sticky {
    position: sticky;
    top: var(--asin-tab-top, 0);
    z-index: 19;
    padding-bottom: 20px;
    background-color: var(--art-main-bg-color);
  }

  .board-tabs {
    // 覆盖 el-tabs 默认样式，与原有看板 Tab 风格一致
    :deep(.el-tabs__header) {
      margin: 0;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    :deep(.el-tabs__nav-wrap) {
      &::after {
        display: none;
      }
    }

    :deep(.el-tabs__item) {
      height: 32px;
      padding: 0 24px;
      font-size: 14px;
      line-height: 32px;
      color: var(--art-gray-700);

      &:hover {
        color: var(--el-color-primary);
      }

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
