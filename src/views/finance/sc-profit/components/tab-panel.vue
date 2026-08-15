<!-- Sc 订单利润 · 单个维度 Tab 的完整面板：搜索栏 + 经营总览 + 趋势图 + 明细表。
     由 index.vue 用 KeepAlive + :key=tab 每个 Tab 缓存一个实例，
     因此搜索条件、指标卡配置、趋势选中、折叠态、明细表本地态与已加载数据都各 Tab 独立保留。 -->
<template>
  <div class="profit-tab-panel">
    <!-- 顶部搜索栏：只控制本 Tab 的模块；Tab 之下吸顶 -->
    <div class="profit-search-sticky">
      <SearchFilter v-model="searchForm" :active-tab="tab" @search="reload" @reset="onReset" />
    </div>

    <!-- 经营总览模块 -->
    <div class="overview-module">
      <div class="overview-bar" :class="{ 'is-collapsed': !overviewOpen }">
        <div class="overview-heading">
          <span class="overview-title">{{ overviewTitle }}</span>
          <!-- 箭头向上表示当前模块展开（参照 sale-statics 折叠交互） -->
          <button
            type="button"
            v-if="!isOrder"
            class="overview-collapse-btn"
            :class="{ open: overviewOpen }"
            :title="overviewOpen ? `收起${overviewTitle}` : `展开${overviewTitle}`"
            @click="overviewOpen = !overviewOpen"
          >
            <ArrowDown />
          </button>
          <ElTooltip
            placement="bottom"
            title="口径说明"
            v-if="isDashboard"
            content="本页数据为经营分析口径，基于订单、广告、成本等多数据源计算，非最终财务结算口径。"
          >
            <span class="stat-tip">
              <ElIcon><InfoFilled /></ElIcon>
              经营分析口径 · 非最终财务结算口径
            </span>
          </ElTooltip>
        </div>
        <div class="overview-actions" v-if="!isOrder">
          <CardSetting
            v-model="displayLayout"
            :groups="metricGroups"
            :name="`finance-sc-profit-${dimType}`"
            title="配置指标"
            :max-total="8"
            :width="540"
            dense
          />
        </div>
      </div>

      <!-- 指标卡片：无外层卡片容器，直接平铺 -->
      <div v-show="overviewOpen" class="overview-body" v-loading="loading">
        <CardItems
          variant="sc-zone"
          :groups="metricGroups"
          :layout="displayLayout"
          :active-keys="cardActiveKeys"
          active-badge="趋势"
          :filter-active-keys="filterActiveKeys"
          :clickable-keys="isOrder ? ORDER_FILTER_KEYS : undefined"
          @card-click="onCardClick"
        >
          <template #value="{ metric }">
            <span class="pl-value" :class="{ 'pl-danger': isDanger(metric.key) }">{{
              displayValue(metric.key)
            }}</span>
          </template>
          <template #default="{ metric }">
            <!-- 每个指标各自的副信息（环比/公式/占比/亏损额…），对齐 demo -->
            <span
              class="pl-sub"
              :title="metric.tooltip"
              @click="onSubClick($event, metric)"
              v-html="cardSub(metric.key)"
            ></span>
          </template>
        </CardItems>
      </div>
    </div>

    <!-- 折线图模块：独立卡片容器，与经营总览之间留空隙；右侧对比指标当前值 + 底部运营洞察 -->
    <div v-if="overviewOpen && !isOrder" class="trend-module" v-loading="loading">
      <TrendInsight
        :metrics="trendChartMetrics"
        :grain-label="grainLabel"
        :ops-cards="opsCards"
        :show-ops="isDashboard"
      >
        <!-- 折线图：对比指标 = 选中的卡片 -->
        <LineChart
          :metrics="trendChartMetrics"
          :x-axis="dateLabels"
          :mode="trendMode"
          :raw-min-zero="false"
          :loading="loading"
          title="指标趋势对比"
          inline-header
          @remove="removeTrend"
        >
          <template #toolbar>
            <div class="trend-mode-seg">
              <button
                type="button"
                :class="{ active: trendMode === 'raw' }"
                @click="trendMode = 'raw'"
              >
                原值
              </button>
              <button
                type="button"
                :class="{ active: trendMode === 'normalized' }"
                @click="trendMode = 'normalized'"
              >
                归一化
              </button>
            </div>
          </template>
        </LineChart>
      </TrendInsight>
    </div>

    <!-- 明细表：折线图下方；搜索条件 + 卡片明细筛选为查询条件（含订单 tab）。
         每个 Tab 一个 Panel 实例，明细表的列默认值与持久化天然互不串台 -->
    <ProfitDetailTable
      ref="detailTableRef"
      :search-form="searchForm"
      :dim-type="dimType"
      :active-tab="tab"
      :overview-open="overviewOpen"
      :filter-key="detailFilter"
      @clear-filter="detailFilter = ''"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, reactive, ref, watch, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import { ArrowDown } from '@element-plus/icons-vue'
  import {
    dateRangeDaysAgo,
    defaultWeekRangeForSite,
    defaultMonthRangeForSite
  } from '@/views/sale-analysis/utils/site-date'

  import CardItems from '@/components/core/charts-comp/card-setting-all/items.vue'
  import CardSetting from '@/components/core/charts-comp/card-setting-all/setting.vue'
  import LineChart from '@/components/core/charts-comp/line-chart.vue'
  import TrendInsight from './trend-insight.vue'
  import SearchFilter from './search-filter.vue'
  import ProfitDetailTable from './detail-table.vue'
  import {
    type CardGroup,
    type CardMetric,
    type CardLayoutState,
    type ChartMetric,
    type ChartMode,
    DEFAULT_METRIC_PALETTE,
    buildDefaultLayout
  } from '@/components/core/charts-comp/types'
  import {
    type DimType,
    META_MAP,
    ORDER_FILTER_KEYS,
    toDimType,
    buildMetricGroups,
    isMetricDanger,
    formatMetricValue,
    metricSub
  } from '../metrics'
  import { setScProfitCurrency, formatMoney } from '../currency'
  import {
    buildPendingActionTrend,
    resolveCardPrimaryAction,
    resolveTrendLineType,
    toDisplayAmount,
    toTrendDisplaySeries
  } from '../presentation'
  import { mul } from '@/utils/dataprocess'
  import {
    orderProfitMetrics,
    orderProfitDashboardOverview,
    orderProfitTrend,
    buildOrderProfitFilter,
    resolveOrderProfitGranularity
  } from '@/api/finance/sc-profit'
  import { buildOpsCards, type OpsCard } from '../operations-diagnosis'
  import { defaultOrderSourceForTab } from '../order-source'
  import { defaultSearchTypeForTab } from '../search-type'

  defineOptions({ name: 'ScProfitTabPanel' })

  const props = defineProps<{
    /** 本面板服务的维度 Tab（实例生命周期内不变）：dashboard/parentAsin/asin/msku/spu/order */
    tab: string
  }>()

  const isOrder = computed(() => props.tab === 'order')
  const isDashboard = computed(() => props.tab === 'dashboard')

  // ============ 指标目录（配置集中在 ../metrics.ts） ============
  const dimType = computed<DimType>(() => toDimType(props.tab))
  const metricGroups = computed<CardGroup[]>(() => buildMetricGroups(dimType.value))

  // ============ 搜索栏 ============
  /** 各粒度默认区间（美国时间）：日=近30日、周=近7周、月=近7月 */
  const defaultRangeByGrain = (grain: string): [string, string] => {
    const us = ['US']
    if (grain === 'day') return dateRangeDaysAgo(us, 30)
    if (grain === 'week') return defaultWeekRangeForSite(us)
    return defaultMonthRangeForSite(us)
  }
  /** 订单维度只按下单日统计，默认美国时间近 7 日；其余维度按粒度取默认区间 */
  const defaultRange = (grain: string): [string, string] =>
    isOrder.value ? dateRangeDaysAgo(['US'], 7) : defaultRangeByGrain(grain)
  // 键与 search-filter 绑定项一致：
  // site 为单选标量；shopIds/categoryIds/brandIds/spu(spuCode[]) 为多选数组，
  // currency/orderSource/dateGrain/searchType/keyword 为标量。
  // 订单来源：订单维度默认全部订单，其余维度默认不含站外订单和替换单。
  // 搜索类型：默认对齐各 Tab 自身维度（看板沿用 ASIN、订单为订单号）。
  const defaultForm = () => ({
    site: 'US',
    shopIds: [],
    categoryIds: [],
    brandIds: [],
    spu: [] as string[],
    currency: 'USD',
    orderSource: defaultOrderSourceForTab(props.tab),
    dateGrain: 'day',
    dateRange: defaultRange('day'),
    searchType: defaultSearchTypeForTab(props.tab),
    keyword: ''
  })
  const searchForm = ref<Record<string, any>>(defaultForm())

  // ============ 展示布局 & 趋势选中 ============
  // 模块名随维度变化：看板=经营总览、订单=订单追踪、其余=对象诊断指标
  const overviewTitle = computed<string>(() => {
    if (isOrder.value) return '订单追踪'
    if (isDashboard.value) return '经营总览'
    return '对象诊断指标'
  })
  // 看板/订单维度默认展开，其余维度默认收起
  const overviewOpen = ref(isDashboard.value || isOrder.value)
  const loading = ref(false)
  const trendMode = ref<ChartMode>('normalized')

  const displayLayout = ref<CardLayoutState>(buildDefaultLayout(metricGroups.value))
  /** 趋势对比指标 = 选中(active)的卡片；默认利润额/利润率/销售额（不在展示列表的剔除） */
  const trendKeys = ref<string[]>(
    ['profit', 'margin', 'sales'].filter((k) => displayLayout.value.selected.includes(k))
  )
  /** 趋势图最多同时对比的指标数 */
  const MAX_TREND = 4

  /** 非订单维度保证至少选中 1 个趋势指标：为空时默认选中第一个展示指标 */
  const ensureTrendDefault = (): void => {
    if (isOrder.value) return
    if (trendKeys.value.length > 0) return
    const first = displayLayout.value.selected[0]
    if (first) trendKeys.value = [first]
  }
  ensureTrendDefault()

  /** 点击卡片：在趋势对比集合中切换（至少 1 个、最多 4 个） */
  const toggleTrend = (metric: CardMetric): void => {
    const key = metric.key
    if (trendKeys.value.includes(key)) {
      if (trendKeys.value.length <= 1) {
        ElMessage.warning('趋势图至少保留 1 个指标')
        return
      }
      trendKeys.value = trendKeys.value.filter((k) => k !== key)
    } else {
      if (trendKeys.value.length >= MAX_TREND) {
        ElMessage.warning(`趋势图最多同时展示 ${MAX_TREND} 个指标`)
        return
      }
      trendKeys.value = [...trendKeys.value, key]
    }
  }

  // ============ 明细筛选（单选）：订单三卡=整卡点击 / 看板·对象「待处理项」=文案点击 ============
  /** 当前选中的明细筛选卡片 key（''=未筛选）；订单模块默认不筛选 */
  const detailFilter = ref('')
  /** 明细表组件引用（重置时调用其 resetLocal 清本地筛选态） */
  const detailTableRef = ref<InstanceType<typeof ProfitDetailTable> | null>(null)
  const FILTER_LABEL: Record<string, string> = {
    lossOrderCount: '亏损订单',
    offsiteOrderCount: '站外订单',
    unshippedOrderCount: '未发货订单',
    pendingAction: '风险项'
  }
  /** 明细筛选单选切换（点自身=取消），并由 detailFilter 驱动真实明细查询 */
  const toggleDetailFilter = (metric: CardMetric): void => {
    const on = detailFilter.value === metric.key
    detailFilter.value = on ? '' : metric.key
    const label = FILTER_LABEL[metric.key] || '订单'
    ElMessage.success(on ? `已取消明细表${label}筛选` : `明细表已筛选：${label}`)
  }

  /** 整卡点击：订单三卡=明细单选筛选；其余维度=趋势多选（待处理项筛选走文案链接，见 onSubClick） */
  const onCardClick = (metric: CardMetric): void => {
    if (resolveCardPrimaryAction(props.tab, metric.key) === 'detail') {
      toggleDetailFilter(metric)
    } else toggleTrend(metric)
  }
  /** 副信息点击：命中筛选链接(.s-go)时切换明细筛选并阻止冒泡，避免同时触发整卡趋势多选 */
  const onSubClick = (e: MouseEvent, metric: CardMetric): void => {
    if ((e.target as HTMLElement)?.closest('.s-go')) {
      e.stopPropagation()
      toggleDetailFilter(metric)
    }
  }

  /** 趋势对比高亮(蓝色徽标)：非订单维度=趋势集合 */
  const cardActiveKeys = computed<string[]>(() => (isOrder.value ? [] : trendKeys.value))
  /** 明细筛选高亮(红色)：当前选中的筛选卡 */
  const filterActiveKeys = computed<string[]>(() =>
    detailFilter.value ? [detailFilter.value] : []
  )

  /** 折线图 chip 移除某对比指标（至少保留 1 个） */
  const removeTrend = (key: string): void => {
    if (trendKeys.value.length <= 1) {
      ElMessage.warning('趋势图至少保留 1 个指标')
      return
    }
    trendKeys.value = trendKeys.value.filter((k) => k !== key)
  }

  // 展示指标变化时，裁剪掉已不再展示的趋势指标，避免图表残留；裁剪后若为空则默认选中第一个
  watch(
    () => displayLayout.value.selected,
    (selected) => {
      const set = new Set(selected)
      const next = trendKeys.value.filter((k) => set.has(k))
      if (next.length !== trendKeys.value.length) trendKeys.value = next
      ensureTrendDefault()
    },
    { deep: true }
  )

  // ============ 运行时数据：卡片值/环比(metrics) · 趋势序列(trend) · 运营洞察(diagnosis) ============
  const valueMap = reactive<Record<string, number>>({})
  const wowMap = reactive<Record<string, number>>({})
  const seriesMap = reactive<Record<string, number[]>>({})
  const dateLabels = ref<string[]>([])
  /** 运营洞察卡（仅看板，来自经营诊断接口预计算） */
  const opsCards = ref<OpsCard[]>([])

  const num = (v: unknown): number => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }
  /** 百分比类指标：后端以比率返回(0.0324)，前端卡片/趋势按百分数(3.24)展示与判红 */
  const isPct = (key: string): boolean => META_MAP[key]?.format === 'percent'
  const clearMap = (m: Record<string, unknown>): void => {
    Object.keys(m).forEach((k) => delete m[k])
  }

  const applyMetricsResult = (res: Awaited<ReturnType<typeof orderProfitMetrics>>): void => {
    clearMap(valueMap)
    clearMap(wowMap)
    ;(res?.cards || []).forEach((c) => {
      const key = c.metric
      if (c.value != null) {
        const raw = num(c.value)
        valueMap[key] = isPct(key) ? mul(raw, 100) : raw
      }
      wowMap[key] = c.wowRate == null ? 0 : num(c.wowRate)
    })
  }

  const requestedTrendMetrics = (): string[] => {
    const requestedMetrics = [...trendKeys.value]
    if (requestedMetrics.includes('pendingAction')) {
      if (!requestedMetrics.includes('lossCount')) requestedMetrics.push('lossCount')
      if (!requestedMetrics.includes('lowMarginCount')) requestedMetrics.push('lowMarginCount')
    }
    return requestedMetrics
  }

  let metricsRequestSeq = 0
  let trendRequestSeq = 0
  let dashboardRequestSeq = 0
  let reloadSeq = 0

  const applyTrendResult = (
    res: Awaited<ReturnType<typeof orderProfitTrend>>,
    requestedMetrics: string[]
  ): void => {
    dateLabels.value = (res?.columns || []).map((c) => c.label || c.key)
    clearMap(seriesMap)
    ;(res?.series || []).forEach((s) => {
      const scale = isPct(s.metric)
      const values = (s.values || []).map((v) =>
        v == null ? null : scale ? mul(num(v), 100) : num(v)
      )
      seriesMap[s.metric] = toTrendDisplaySeries(s.metric, values)
    })
    if (
      requestedMetrics.includes('pendingAction') &&
      !(seriesMap.pendingAction || []).length &&
      ((seriesMap.lossCount || []).length || (seriesMap.lowMarginCount || []).length)
    ) {
      seriesMap.pendingAction = buildPendingActionTrend(
        seriesMap.lossCount || [],
        seriesMap.lowMarginCount || []
      )
    }
  }

  /** 核心指标条：填充卡片值/环比。 */
  const fetchMetrics = async (): Promise<void> => {
    const seq = ++metricsRequestSeq
    const params = { ...buildOrderProfitFilter(searchForm.value), tab: props.tab }
    const res = await orderProfitMetrics(params)
    if (seq !== metricsRequestSeq) return
    applyMetricsResult(res)
    opsCards.value = []
  }

  /** 趋势分析：按当前对比指标(≤4) + 粒度拉取，填充横轴与各指标序列（订单维度无趋势，不会调用） */
  const fetchTrend = async (): Promise<void> => {
    const seq = ++trendRequestSeq
    const requestedMetrics = requestedTrendMetrics()
    const res = await orderProfitTrend({
      ...buildOrderProfitFilter(searchForm.value),
      tab: props.tab,
      metrics: requestedMetrics,
      granularity: resolveOrderProfitGranularity(searchForm.value)
    })
    if (seq !== trendRequestSeq) return
    applyTrendResult(res, requestedMetrics)
  }

  /** 看板首屏：指标、趋势、诊断由一个接口返回，避免三个 HTTP 请求各自扫描利润宽表。 */
  const fetchDashboardOverview = async (): Promise<void> => {
    const seq = ++dashboardRequestSeq
    const requestedMetrics = requestedTrendMetrics()
    const res = await orderProfitDashboardOverview({
      ...buildOrderProfitFilter(searchForm.value),
      tab: 'dashboard',
      metrics: requestedMetrics,
      granularity: resolveOrderProfitGranularity(searchForm.value)
    })
    if (seq !== dashboardRequestSeq) return
    applyMetricsResult(res.metrics)
    applyTrendResult(res.trend, requestedMetrics)
    opsCards.value = buildOpsCards(res.diagnosis)
  }

  const reload = async (): Promise<void> => {
    const seq = ++reloadSeq
    loading.value = true
    // 币种符号随筛选切换（$/¥）；金额数值由后端按 exchange_rate 换算（PRD I-F07）
    setScProfitCurrency(searchForm.value.currency)
    // 明细表原先靠 deep watch(searchForm) 刷新；searchType 已排除出自动重查，
    // 故点搜索时必须显式同步明细（含 searchType）。
    detailTableRef.value?.syncSearchAndReload?.()
    try {
      if (isDashboard.value) {
        await fetchDashboardOverview()
      } else {
        // 对象页签的 metrics/detail 都会聚合同一张利润宽表；先完成指标再拉趋势，
        // 避免 metrics + trend + detail 三组重查询同时争抢数据库导致 detail 越过超时线。
        await fetchMetrics()
        if (seq !== reloadSeq || isOrder.value) return
        await fetchTrend()
      }
    } catch (e) {
      console.error('[sc-profit] reload failed', e)
    } finally {
      if (seq === reloadSeq) loading.value = false
    }
  }

  // 整体替换表单会连带触发粒度 watcher，重置时跳过一次避免重复请求
  let skipGrainWatch = false

  const onReset = async (): Promise<void> => {
    const form = defaultForm()
    if (searchForm.value.dateGrain !== form.dateGrain) skipGrainWatch = true
    searchForm.value = form
    // PRD F-04：重置同时清除指标卡筛选态与明细本地筛选（结算/利润状态/排序）
    detailFilter.value = ''
    detailTableRef.value?.resetLocal()
    // ArtSearchBar 重置时会先就地清空旧表单对象再抛 reset，这里换成新对象后需等一次渲染，
    // 否则明细表 syncSearchAndReload 读到的 props.searchForm 仍是被清空的旧对象（日期/站点全丢）
    await nextTick()
    reload()
  }

  // 切换下单时间粒度：默认区间随粒度变化（日=近30日 / 周=近7周 / 月=近7月，美国时间；订单维度恒为近7日）
  watch(
    () => searchForm.value.dateGrain,
    (grain) => {
      if (skipGrainWatch) {
        skipGrainWatch = false
        return
      }
      searchForm.value.dateRange = defaultRange(grain)
      reload()
    }
  )

  // 切换 searchType：不请求、不清空；点搜索图标 / 回车后再查（见 search-type-change.ts）

  // 趋势对比指标(≤4)变化 → 重新拉取趋势序列（仅非订单维度有趋势图）
  watch(
    trendKeys,
    () => {
      if (!isOrder.value) fetchTrend()
    },
    { deep: true }
  )

  // ============ 卡片展示辅助（规则集中在 ../metrics.ts，此处仅注入运行时数据） ============
  const displayValue = (key: string): string => formatMetricValue(key, valueMap[key])
  const isDanger = (key: string): boolean => isMetricDanger(key, valueMap[key])

  // 当前筛选天数（供「日均利润」等按天均摊文案）
  const days = computed(() => {
    const [s, e] = (searchForm.value.dateRange as [string, string]) || []
    if (!s || !e) return Math.max(1, dateLabels.value.length || 30)
    const diff = (new Date(e).getTime() - new Date(s).getTime()) / 86400000
    return Math.max(1, Math.round(diff) + 1)
  })

  const cardSub = (key: string): string =>
    metricSub(key, {
      values: valueMap,
      wow: wowMap,
      days: days.value,
      filterKey: detailFilter.value
    })

  // ============ 折线图 ============
  /** 粒度文案：供趋势右侧「当前筛选X均」使用 */
  const grainLabel = computed<string>(() => {
    const map: Record<string, string> = { day: '日', week: '周', month: '月' }
    return map[String(searchForm.value.dateGrain)] || '日'
  })

  /**
   * 指标 → 调色板槽位：颜色/线型按槽位取值而非数组下标，
   * 这样移除某个指标时其余指标的颜色与线型保持不变；空出的槽位留给后续新增指标。
   */
  const trendColorSlot = ref<Record<string, number>>({})
  watch(
    trendKeys,
    (keys) => {
      const slots: Record<string, number> = {}
      keys.forEach((k) => {
        const prev = trendColorSlot.value[k]
        if (prev != null) slots[k] = prev
      })
      const used = new Set(Object.values(slots))
      keys.forEach((k) => {
        if (slots[k] != null) return
        let i = 0
        while (used.has(i)) i += 1
        slots[k] = i
        used.add(i)
      })
      trendColorSlot.value = slots
    },
    { immediate: true, deep: true }
  )

  const trendChartMetrics = computed<ChartMetric[]>(() =>
    trendKeys.value.map((key) => {
      const meta = META_MAP[key]
      const format = meta?.format || 'number'
      const slot = trendColorSlot.value[key] ?? 0
      return {
        key,
        label: meta?.label || key,
        color: DEFAULT_METRIC_PALETTE[slot % DEFAULT_METRIC_PALETTE.length],
        lineType: resolveTrendLineType(slot),
        format,
        // 金额指标随币种符号（$/¥）：formatter 优先于 format，作用于折线图 tooltip / 行尾标签
        formatter:
          format === 'money'
            ? (value: number) => formatMoney(toDisplayAmount(key, value))
            : undefined,
        data: seriesMap[key] || []
      }
    })
  )

  onMounted(reload)
</script>

<style lang="scss" scoped>
  // 面板本身不设 overflow / transform：否则会抢占 sticky 滚动上下文导致搜索栏无法吸顶
  .profit-tab-panel {
    display: flex;
    flex-direction: column;
  }

  // 搜索栏吸顶容器：Tab 之下固定（--asin-search-top 由页面根元素提供），
  // z-index 高于 Tab，重叠处遮盖避免透字
  .profit-search-sticky {
    position: sticky;
    top: var(--asin-search-top, 45px);
    z-index: 20;
    display: flow-root;
    background-color: var(--art-bg-color);
  }

  // 按周复合日期：粒度下拉 + 周区间选择器连体
  :deep(.composite-grain-date) {
    display: flex;
    width: 100%;

    .el-select .el-select__wrapper {
      border-radius: var(--el-border-radius-base) 0 0 var(--el-border-radius-base);
    }
  }

  :deep(.art-search-bar label) {
    height: 28px !important;
    line-height: 28px !important;
    border: 0 solid #dcdfe6 !important;
  }

  // 经营总览：卡片无外层容器（透明），仅标题栏 + 卡片平铺
  .overview-module {
    background: transparent;
    border: none;
  }

  .overview-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0 0 10px;

    &.is-collapsed {
      padding-bottom: 0;
    }
  }

  .overview-heading {
    display: inline-flex;
    gap: 8px;
    align-items: center;

    .stat-tip {
      display: inline-block;
      margin-left: -10px;
      font-size: 12px;
      color: var(--art-gray-500);
    }
  }

  .overview-title {
    position: relative;
    padding-left: 10px;
    font-size: 15px;
    font-weight: 700;

    &::before {
      position: absolute;
      top: 50%;
      left: 0;
      width: 3px;
      height: 14px;
      content: '';
      background: var(--el-color-primary);
      border-radius: 2px;
      transform: translateY(-50%);
    }
  }

  // 折叠按钮：展开时箭头向上（旋转 180deg），参照 sale-statics 交互
  .overview-collapse-btn {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 26px;
    height: 26px;
    color: #64748b;
    cursor: pointer;
    background: #fff;
    border: 1px solid #d8e3ff;
    border-radius: 7px;
    transition: 0.15s;

    &:hover {
      color: var(--el-color-primary);
      border-color: #8fb0ff;
    }

    svg {
      width: 14px;
      transition: transform 0.18s;
    }

    &.open {
      color: var(--el-color-primary);
      background: #eef2ff;
      border-color: var(--el-color-primary);

      svg {
        transform: rotate(180deg);
      }
    }
  }

  .overview-body {
    padding: 0;
  }

  // 折线图模块：独立白色卡片容器
  .trend-module {
    padding: 12px;
    margin-top: 12px;
    background: #fff;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
  }

  // 卡片值 + 各指标副信息
  .pl-value {
    font-size: 15px;
    font-weight: 700;
    font-variant-numeric: tabular-nums;
    color: #111827;

    &.pl-danger {
      color: #e5484d;
    }
  }

  .pl-sub {
    display: block;
    overflow: hidden;
    font-size: 10px;
    color: #9aa3b2;
    text-overflow: ellipsis;
    white-space: nowrap;

    // v-html 注入的内联标记，需用 :deep 命中
    :deep(.s-up) {
      font-weight: 600;
      color: #e5484d; // 涨 = 红（中国习惯）
    }

    :deep(.s-down) {
      font-weight: 600;
      color: #0f9f6e; // 跌 = 绿
    }

    :deep(.s-neg) {
      font-weight: 600;
      color: #e5484d;
    }

    :deep(.s-go) {
      font-weight: 600;
      color: var(--el-color-primary);
    }
  }

  // 折线图模式切换段控件
  .trend-mode-seg {
    display: inline-flex;
    padding: 2px;
    background: #f4f6fb;
    border: 1px solid #dce3ef;
    border-radius: 7px;

    button {
      height: 24px;
      padding: 0 10px;
      font-size: 12px;
      color: #5f6877;
      cursor: pointer;
      background: transparent;
      border: 0;
      border-radius: 5px;

      &.active {
        color: var(--el-color-primary);
        background: #fff;
        box-shadow: 0 1px 3px rgb(15 23 42 / 8%);
      }
    }
  }
</style>
