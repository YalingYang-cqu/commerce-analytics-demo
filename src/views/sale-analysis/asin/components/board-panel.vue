<!-- 看板面板：搜索栏 + 产品日销售统计表 + 分时汇总 + 分时对比（看板类型由父组件通过 activeTab 指定） -->
<template>
  <!-- 搜索栏（滚动时吸顶到 Tab 下方）。外层 div 承载吸顶+灰色背景：
       搜索栏自带的底部外边距区域会露出该灰色，使这条间距也随吸顶固定且不透明，避免透字。 -->
  <div class="asin-search-sticky">
    <ArtSearchBar
      v-model="filterForm"
      :items="searchItems"
      :show-expand="false"
      :show-reset="true"
      :show-search="false"
      label-width="40px"
      default-item-width="180px"
      @search="handleSearch"
      @reset="handleFilterReset"
    >
      <!-- 周维度使用自定义周区间选择器 -->
      <!-- <template v-if="filterForm.periodType === 'week'" #dateRange="{ modelValue: form }">
      <div class="composite-search-wrapper composite-period-date">
        <ElSelect v-model="form.dateType" :style="{ width: '90px' }" size="small">
          <ElOption label="日期" value="date" />
        </ElSelect>
        <PeriodWeekRangePicker
          v-model="form.dateRange"
          start-placeholder="开始周"
          end-placeholder="结束周"
          :date-picker-props="periodDatePickerConfig.datePickerProps"
          @change="handleSearch"
        />
      </div>
    </template> -->
    </ArtSearchBar>
  </div>

  <!-- 产品日销售统计：按看板类型加载各自的列与列设置，:key 保证切看板时重挂载、互不串台 -->
  <DailyBoardTable
    :key="activeTab"
    :board-type="boardTypeMap[activeTab] || 'asin'"
    :data="tableData"
    :loading="loading"
    :stat-date-text="statDateText"
    :format-val="formatVal"
    :export-api="asinDailyStatisticsExport"
    :export-params="dailyExportParams"
    v-model:show-growth="showGrowth"
    v-model:period-type="filterForm.periodType"
    v-model:table-expanded="tableExpanded"
    @refresh="loadData"
  />

  <!-- 产品分时汇总统计（查询条件由搜索栏统一控制：committedQuery） -->
  <HourlySummary
    :end-date="committedQuery.dateRange?.[1]"
    :asin="committedQuery.keyword"
    :search-mode="committedQuery.searchType"
    :site="committedQuery.site"
    :shop-ids="committedShopIds"
    :board-type="boardTypeMap[activeTab] || 'asin'"
  />

  <!-- 产品分时对比（查询条件由搜索栏统一控制：committedQuery） -->
  <HourlyContrast
    :end-date="committedQuery.dateRange?.[1]"
    :asin="committedQuery.keyword"
    :search-mode="committedQuery.searchType"
    :site="committedQuery.site"
    :shop-ids="committedShopIds"
    :board-type="boardTypeMap[activeTab] || 'asin'"
  />
</template>

<script lang="ts">
  /** 嵌入模式下由父组件带入的查询条件默认值 */
  export interface BoardDefaultQuery {
    site?: string[]
    shop?: string[]
    searchType?: string
    keyword?: string
    dateRange?: [string, string]
    periodType?: 'day' | 'week' | 'month'
  }
</script>

<script setup lang="ts">
  import { ref, computed, watch, onMounted } from 'vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  // import PeriodWeekRangePicker from '@/components/core/others/period-week-range-picker/index.vue'
  import DailyBoardTable from './daily-board-table.vue'
  import HourlySummary from './hourly-summary.vue'
  import HourlyContrast from './hourly-contrast.vue'
  import { getPeriodDatePickerConfig } from '@/views/logistics/batch-cost/utils/period'
  import {
    asinDailyStatistics,
    asinDailyStatisticsExport,
    type AsinBoardType,
    type AsinDailyStatVo,
    type AsinPeriodMetric,
    type SalesAdMetrics
  } from '@/api/sale/asin'
  import { add, sub, mul, divide } from '@/utils/common-util'
  import { pubStoreList } from '@/utils'
  import {
    buildSiteDayShortcuts,
    clipDateRangeToSiteToday,
    createSiteDisabledDate,
    dateRangeDaysAgo,
    DEFAULT_SITE
  } from '../../utils/site-date'

  defineOptions({ name: 'BoardPanel' })

  const TOTAL_ID = '__total__'

  /**
   * activeTab：当前看板 Tab（由父组件控制）；
   * defaultQuery：父组件带入的查询条件，作为搜索栏初始值。
   */
  const props = defineProps<{
    activeTab: string
    defaultQuery?: BoardDefaultQuery
  }>()

  /** 站点筛选项：本期固定美国且不可改 */
  const siteOptions = [{ label: '美国', value: DEFAULT_SITE }]
  /** 店铺下拉：来自 pubStoreList 接口（value=店铺id，label=店铺名） */
  const shopOptions = ref<{ label: string; value: number }[]>([])

  /** 默认日期：近 30 天（含站点今日） */
  const recent30 = (sites?: string[]): [string, string] => dateRangeDaysAgo(sites, 30)
  /** 构造搜索表单初始值（嵌入时取父组件带入的默认值） */
  const createFilterForm = () => ({
    site: (props.defaultQuery?.site ?? [DEFAULT_SITE]) as string[],
    shop: (props.defaultQuery?.shop ?? []) as string[],
    searchType: props.defaultQuery?.searchType ?? 'asin',
    // keyword: props.defaultQuery?.keyword ?? 'B0D5RFBB7M',
    keyword: props.defaultQuery?.keyword ?? '',
    dateType: 'date',
    dateRange: (props.defaultQuery?.dateRange ?? recent30(props.defaultQuery?.site)) as [
      string,
      string
    ],
    periodType: (props.defaultQuery?.periodType ?? 'day') as 'day' | 'week' | 'month'
  })
  const filterForm = ref(createFilterForm())
  /**
   * 已确认查询条件：搜索栏的「搜索/重置」才会提交到这里。
   * 三个模块（日销售统计 / 分时汇总 / 分时对比）统一基于它查询，避免输入过程中频繁请求。
   */
  const committedQuery = ref(createFilterForm())
  const statDateText = computed(() => {
    const r = committedQuery.value.dateRange
    return `${r?.[0] ?? '-'} ~ ${r?.[1] ?? '-'}`
  })

  /** committed 店铺 -> 数字 id（分时接口入参口径） */
  const committedShopIds = computed(() =>
    (committedQuery.value.shop || []).map((s) => Number(s)).filter((n) => !Number.isNaN(n))
  )

  /** 搜索栏条件变更（搜索/周区间变化）：提交快照，驱动三个模块重新查询 */
  const handleSearch = (): void => {
    filterForm.value.dateRange = clipDateRangeToSiteToday(
      filterForm.value.dateRange,
      filterForm.value.site,
      30
    )
    committedQuery.value = { ...filterForm.value }
  }

  /** 日维度日期范围快捷选项（锚定站点今日） */
  const dayShortcuts = computed(() => buildSiteDayShortcuts(filterForm.value.site))

  /** ArtSearchBar 配置项 */
  const searchItems = computed(() => [
    {
      key: 'site',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: false,
      labelValue: { name: 'label', value: 'value' },
      width: '180px',
      props: {
        options: siteOptions,
        placeholder: '国家',
        clearable: false,
        disabled: true
      }
    },
    {
      key: 'shop',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      width: '180px',
      props: { options: shopOptions.value, placeholder: '店铺' }
    },
    {
      key: 'keyword',
      label: '',
      compositeSearch: true,
      selectKey: 'searchType',
      selectOptions: [
        { label: '按ASIN搜索', value: 'asin' },
        { label: '按父ASIN搜索', value: 'pasin' }
      ],
      selectWidth: '120px',
      inputType: 'input',
      placeholder: '请输入',
      width: '280px'
    },
    {
      key: 'dateRange',
      label: '',
      compositeSearch: true,
      selectKey: 'dateType',
      selectOptions: [{ label: '日期', value: 'date' }],
      selectWidth: '90px',
      inputType: periodDatePickerConfig.value.inputType,
      width: '330px',
      clearable: false,
      datePickerProps: {
        ...{
          type: 'daterange',
          valueFormat: 'YYYY-MM-DD',
          format: 'YYYY-MM-DD'
        },
        // ...(filterForm.value.periodType === 'week' ? { showWeekNumber: true } : {}),
        ...{
          shortcuts: dayShortcuts.value,
          disabledDate: createSiteDisabledDate(filterForm.value.site)
        }
      }
    }
  ])

  /** 重置筛选 + 提交快照（三个模块据此重新查询） */
  const handleFilterReset = (): void => {
    filterForm.value = createFilterForm()
    committedQuery.value = { ...filterForm.value }
  }

  const lockSiteToUs = () => {
    if (filterForm.value.site.length !== 1 || filterForm.value.site[0] !== DEFAULT_SITE) {
      filterForm.value.site = [DEFAULT_SITE]
    }
  }

  watch(() => [...filterForm.value.site], lockSiteToUs, { immediate: true })

  watch(
    () => [...filterForm.value.site],
    () => {
      lockSiteToUs()
      filterForm.value.dateRange = clipDateRangeToSiteToday(
        filterForm.value.dateRange,
        filterForm.value.site,
        30
      )
    },
    { deep: true }
  )

  onMounted(() => {
    lockSiteToUs()
    filterForm.value.dateRange = clipDateRangeToSiteToday(
      filterForm.value.dateRange,
      filterForm.value.site,
      30
    )
    committedQuery.value = { ...filterForm.value }
    loadShopOptions()
    loadData()
  })
  const showGrowth = ref(false)

  /** 表格展开/收起（默认展开） */
  const tableExpanded = ref(true)

  // ========== 数值格式化 ==========
  const moneyProps = new Set([
    'adCost',
    'totalAmount',
    'adAmount',
    'naturalAmount',
    'scTotalAmount',
    'scAdAmount',
    'vcTotalAmount',
    'vcAdAmount'
  ])
  const decimalProps = new Set(['cpo', 'cpa', 'cpc'])
  const percentProps = new Set([
    'adSalesRatio',
    'naturalSalesRatio',
    'adOrdersRatio',
    'orderAdRatio',
    'adCostRatio',
    'naturalOrderRatio',
    'scAdOrderRatio',
    'scNaturalOrderRatio',
    'vcAdOrderRatio',
    'vcNaturalOrderRatio',
    'adCvr',
    'scAdCvr',
    'vcAdCvr',
    'acos',
    'ctr',
    'cvr',
    'returnRate'
  ])

  const formatVal = (row: Record<string, any>, prop: string): string => {
    const v = row[prop]
    if (v === null || v === undefined || v === '') return '-'
    // 去掉浮点运算误差尾数（如 39.703300000000004 -> 39.7033）
    const raw = parseFloat(Number(v).toPrecision(12))
    // 严格四舍五入到2位：decimal.js 运算精确，先 ×100 取整再 ÷100
    const num = Number(divide(Math.round(Number(mul(raw, 100))), 100))
    // 带小数的保留2位，整数保持整数
    const opts = Number.isInteger(num)
      ? { maximumFractionDigits: 0 }
      : { minimumFractionDigits: 2, maximumFractionDigits: 2 }
    const fmt = num.toLocaleString('en-US', opts)
    if (moneyProps.has(prop)) return `$${fmt}`
    if (decimalProps.has(prop)) return fmt
    if (percentProps.has(prop)) return `${fmt}%`
    return fmt
  }

  // ========== 真实接口数据 ==========
  const loading = ref(false)
  const tableData = ref<Record<string, any>[]>([])

  /** 看板 Tab -> 后端 boardType */
  const boardTypeMap: Record<string, AsinBoardType> = {
    all: 'asin',
    sc: 'scasin',
    vc: 'vcasin'
  }

  /**
   * 列 prop -> 后端 metrics 字段。
   * 后端无对应字段的列（SC/VC 拆分等）不在此表内，统一显示「-」。
   */
  const FIELD_MAP: Record<string, keyof SalesAdMetrics> = {
    totalSales: 'totalSalesQty',
    naturalSales: 'naturalSalesQty',
    adSales: 'adSalesQty',
    offsiteSales: 'offSiteSalesQty',
    ownSkuSales: 'adSalesQtySameSku',
    otherSkuSales: 'adSalesQtyOtherSku',
    adSalesRatio: 'adSalesRatio',
    naturalSalesRatio: 'naturalSalesRatio',
    adOrders: 'adOrderQty',
    adOrdersRatio: 'adOrderRatio',
    adCost: 'adCost',
    adCostRatio: 'adCostRatio',
    cpo: 'cpo',
    cpa: 'cpa',
    cpc: 'cpc',
    adCvr: 'adConversionRate',
    acos: 'acos',
    impressions: 'adImpressions',
    clicks: 'adClicks',
    ctr: 'ctr',
    sessions: 'sessions',
    pageViews: 'pageViews',
    cvr: 'conversionRate',
    totalOrders: 'totalOrderQty',
    naturalOrders: 'naturalOrderQty',
    adOrderCount: 'adOrderQty',
    orderAdRatio: 'adOrderRatio',
    naturalOrderRatio: 'naturalOrderRatio',
    totalAmount: 'totalSalesAmt',
    adAmount: 'adSalesAmt',
    naturalAmount: 'naturalSalesAmt',
    returnQty: 'returnQty',
    returnRate: 'returnRate'
  }

  /**
   * 综合看板 SC/VC 拆分列：列名后缀 -> 后端 metrics 字段。
   * 实际列 prop = sc/vc + 后缀（如 scTotalSales / vcAdOrderRatio），值取 scMetrics / vcMetrics。
   */
  const SC_VC_FIELD_MAP: Record<string, keyof SalesAdMetrics> = {
    TotalSales: 'totalSalesQty',
    AdSales: 'adSalesQty',
    NaturalSales: 'naturalSalesQty',
    AdCvr: 'adConversionRate',
    TotalOrders: 'totalOrderQty',
    AdOrders: 'adOrderQty',
    NaturalOrders: 'naturalOrderQty',
    AdOrderRatio: 'adOrderRatio',
    NaturalOrderRatio: 'naturalOrderRatio',
    TotalAmount: 'totalSalesAmt',
    AdAmount: 'adSalesAmt'
  }

  /** 列 prop -> 后端 growth 编码（与 metrics 字段名不同；无涨幅的列不列入） */
  const GROWTH_MAP: Record<string, string> = {
    totalSales: 'sales',
    naturalSales: 'naturalSales',
    adSales: 'adSales',
    offsiteSales: 'offSiteSales',
    ownSkuSales: 'adSalesSameSku',
    otherSkuSales: 'adSalesOtherSku',
    adSalesRatio: 'adSalesRatio',
    naturalSalesRatio: 'naturalSalesRatio',
    adOrders: 'adOrder',
    adOrdersRatio: 'adOrderRatio',
    adCost: 'adCost',
    adCostRatio: 'adCostRatio',
    cpo: 'cpo',
    cpa: 'cpa',
    cpc: 'cpc',
    adCvr: 'adConversionRate',
    acos: 'acos',
    impressions: 'adImpressions',
    clicks: 'adClicks',
    ctr: 'ctr',
    sessions: 'sessions',
    pageViews: 'pageViews',
    cvr: 'conversionRate',
    totalOrders: 'order',
    naturalOrders: 'naturalOrder',
    adOrderCount: 'adOrder',
    orderAdRatio: 'adOrderRatio',
    naturalOrderRatio: 'naturalOrderRatio',
    totalAmount: 'revenue',
    adAmount: 'adRevenue',
    naturalAmount: 'naturalRevenue',
    returnQty: 'return',
    returnRate: 'returnRate'
  }

  /** 综合看板 SC/VC 拆分列：列名后缀 -> 后端 growth 编码（取 scGrowth / vcGrowth） */
  const SC_VC_GROWTH_MAP: Record<string, string> = {
    TotalSales: 'sales',
    AdSales: 'adSales',
    NaturalSales: 'naturalSales',
    AdCvr: 'adConversionRate',
    TotalOrders: 'order',
    AdOrders: 'adOrder',
    NaturalOrders: 'naturalOrder',
    AdOrderRatio: 'adOrderRatio',
    NaturalOrderRatio: 'naturalOrderRatio',
    TotalAmount: 'revenue',
    AdAmount: 'adRevenue'
  }

  /** 由后缀映射 + 渠道前缀生成「列 prop -> 字段/编码」映射（如 TotalSales -> scTotalSales） */
  const prefixMap = <T,>(prefix: 'sc' | 'vc', base: Record<string, T>): Record<string, T> =>
    Object.fromEntries(Object.entries(base).map(([suffix, v]) => [`${prefix}${suffix}`, v]))

  const SC_FIELD_MAP = prefixMap('sc', SC_VC_FIELD_MAP)
  const VC_FIELD_MAP = prefixMap('vc', SC_VC_FIELD_MAP)
  const SC_GROWTH_MAP = prefixMap('sc', SC_VC_GROWTH_MAP)
  const VC_GROWTH_MAP = prefixMap('vc', SC_VC_GROWTH_MAP)

  /** 比率类后端为小数(0~1)，转百分比展示需 ×100 */
  const toNum = (v: unknown): number | null =>
    v === null || v === undefined || v === '' ? null : Number(v)
  const safeDiv = (a: number, b: number): number | null => (b ? Number(divide(a, b)) : null)

  /** 把一组 metrics 按 propMap 写入行（比率列 ×100），并按 growthMap 把涨幅累加进 g */
  const fillMetrics = (
    row: Record<string, any>,
    metrics: SalesAdMetrics | undefined | null,
    propMap: Record<string, keyof SalesAdMetrics>,
    growth: Record<string, number> | undefined,
    growthMap: Record<string, string>,
    g: Record<string, number>
  ): void => {
    if (metrics) {
      Object.entries(propMap).forEach(([prop, field]) => {
        const raw = toNum(metrics[field])
        row[prop] = raw !== null && percentProps.has(prop) ? Number(mul(raw, 100)) : raw
      })
    }
    if (growth) {
      Object.entries(growthMap).forEach(([prop, code]) => {
        const raw = toNum(growth[code])
        if (raw === null) return
        // 占比/比率列后端为小数(0~1)，涨幅同口径，展示需 ×100；mul 对脱敏值返回 '***'
        const v = percentProps.has(prop) ? mul(raw, 100) : raw
        if (typeof v === 'number') g[prop] = v
      })
    }
  }

  /** 综合看板带 SC/VC 拆分的可选入参 */
  interface BuildRowExtra {
    growth?: Record<string, number>
    scMetrics?: SalesAdMetrics | null
    vcMetrics?: SalesAdMetrics | null
    scGrowth?: Record<string, number>
    vcGrowth?: Record<string, number>
  }

  /** 由 metrics（+可选 SC/VC 拆分）生成一行表格数据 */
  const buildRow = (
    metrics: SalesAdMetrics,
    id: string,
    date: string,
    extra: BuildRowExtra = {}
  ): Record<string, any> => {
    const row: Record<string, any> = { id, date }
    const g: Record<string, number> = {}
    fillMetrics(row, metrics, FIELD_MAP, extra.growth, GROWTH_MAP, g)
    fillMetrics(row, extra.scMetrics, SC_FIELD_MAP, extra.scGrowth, SC_GROWTH_MAP, g)
    fillMetrics(row, extra.vcMetrics, VC_FIELD_MAP, extra.vcGrowth, VC_GROWTH_MAP, g)
    if (extra.growth || extra.scGrowth || extra.vcGrowth) {
      row._growth = g
    }
    return row
  }

  /** 可 SUM 的原子量字段（合计行先汇总原子量，再按口径现算派生指标，与后端铁律一致） */
  const ATOMIC_FIELDS: (keyof SalesAdMetrics)[] = [
    'totalSalesQty',
    'offSiteSalesQty',
    'adSalesQty',
    'adSalesQtySameSku',
    'totalOrderQty',
    'offSiteOrderQty',
    'adOrderQty',
    'totalSalesAmt',
    'offSiteSalesAmt',
    'adSalesAmt',
    'adImpressions',
    'adClicks',
    'adCost',
    'pageViews',
    'sessions',
    'returnQty',
    'shippedQty'
  ]

  /** 汇总一组周期某渠道的原子量（pick 指定取 metrics/scMetrics/vcMetrics） */
  const sumAtomics = (
    periods: AsinDailyStatVo['periods'],
    pick: (p: AsinPeriodMetric) => SalesAdMetrics | undefined | null
  ): SalesAdMetrics => {
    const a: Record<string, number> = {}
    ATOMIC_FIELDS.forEach((f) => {
      a[f] = periods.reduce((acc, p) => Number(add(acc, toNum(pick(p)?.[f]) ?? 0)), 0)
    })
    return a as SalesAdMetrics
  }

  /** 由原子量现算派生指标（口径与后端 SalesAdMetricCalculator 一致，比率为小数 0~1，除零为 null） */
  const calcMetrics = (a: SalesAdMetrics): SalesAdMetrics => {
    const n = (v: unknown): number => toNum(v) ?? 0
    const totalSalesQty = n(a.totalSalesQty)
    const offSiteSalesQty = n(a.offSiteSalesQty)
    const adSalesQty = n(a.adSalesQty)
    const adSalesQtySameSku = n(a.adSalesQtySameSku)
    const totalOrderQty = n(a.totalOrderQty)
    const offSiteOrderQty = n(a.offSiteOrderQty)
    const adOrderQty = n(a.adOrderQty)
    const totalSalesAmt = n(a.totalSalesAmt)
    const offSiteSalesAmt = n(a.offSiteSalesAmt)
    const adSalesAmt = n(a.adSalesAmt)
    const adImpressions = n(a.adImpressions)
    const adClicks = n(a.adClicks)
    const adCost = n(a.adCost)
    const sessions = n(a.sessions)
    const returnQty = n(a.returnQty)
    const naturalSalesQty = Number(sub(Number(sub(totalSalesQty, offSiteSalesQty)), adSalesQty))
    const naturalOrderQty = Number(sub(Number(sub(totalOrderQty, offSiteOrderQty)), adOrderQty))
    return {
      ...a,
      naturalSalesQty,
      naturalOrderQty,
      naturalSalesAmt: Number(sub(Number(sub(totalSalesAmt, offSiteSalesAmt)), adSalesAmt)),
      adSalesQtyOtherSku: Number(sub(adSalesQty, adSalesQtySameSku)),
      naturalSalesRatio: safeDiv(naturalSalesQty, totalSalesQty),
      adSalesRatio: safeDiv(adSalesQty, totalSalesQty),
      adOrderRatio: safeDiv(adOrderQty, totalOrderQty),
      naturalOrderRatio: safeDiv(naturalOrderQty, totalOrderQty),
      adCostRatio: safeDiv(adCost, totalSalesAmt),
      returnRate: safeDiv(returnQty, totalSalesQty),
      conversionRate: safeDiv(totalOrderQty, sessions),
      acos: safeDiv(adCost, adSalesAmt),
      cpc: safeDiv(adCost, adClicks),
      // 合计行 CPO 口径：广告花费 / 总订单；CPA 口径：广告花费 / 广告订单
      cpo: safeDiv(adCost, totalOrderQty),
      cpa: safeDiv(adCost, adOrderQty),
      ctr: safeDiv(adClicks, adImpressions),
      adConversionRate: safeDiv(adOrderQty, adClicks)
    }
  }

  /** 合计行：汇总原子量后现算（综合看板同时汇总 SC/VC 拆分） */
  const buildTotalRow = (periods: AsinDailyStatVo['periods']): Record<string, any> => {
    const combined = calcMetrics(sumAtomics(periods, (p) => p.metrics))
    const isCombined = (boardTypeMap[props.activeTab] || 'asin') === 'asin'
    const extra: BuildRowExtra = isCombined
      ? {
          scMetrics: calcMetrics(sumAtomics(periods, (p) => p.scMetrics)),
          vcMetrics: calcMetrics(sumAtomics(periods, (p) => p.vcMetrics))
        }
      : {}
    return buildRow(combined, TOTAL_ID, '合计', extra)
  }

  /** 加载日销售统计（查询条件取已确认快照 committedQuery；周期 grain 为即时切换，取实时值） */
  const loadData = async (): Promise<void> => {
    const q = committedQuery.value
    const [dateStart, dateEnd] = q.dateRange || []
    // if (!q.keyword || !dateStart || !dateEnd) {
    //   tableData.value = []
    //   return
    // }
    loading.value = true
    try {
      const res: any = await asinDailyStatistics({
        boardType: boardTypeMap[props.activeTab] || 'asin',
        asin: q.keyword,
        searchMode: q.searchType === 'pasin' ? 'pasin' : 'asin',
        site: q.site?.length ? q.site : undefined,
        shopIds: committedShopIds.value.length ? committedShopIds.value : undefined,
        dateStart,
        dateEnd,
        grain: filterForm.value.periodType,
        // 查询固定传 true：始终返回涨幅数据，前端「显示涨幅」仅控制显隐、不再触发请求
        showGrowth: true
      })
      const vo = (res?.data || {}) as AsinDailyStatVo
      const periods = vo.periods || []
      const rows = periods.map((p) =>
        buildRow(p.metrics || {}, p.bucket, p.label, {
          growth: p.growth,
          scMetrics: p.scMetrics,
          vcMetrics: p.vcMetrics,
          scGrowth: p.scGrowth,
          vcGrowth: p.vcGrowth
        })
      )
      tableData.value = periods.length ? [buildTotalRow(periods), ...rows] : []
    } finally {
      loading.value = false
    }
  }

  /** 日销售统计导出参数：与查询入参一致（异步导出，返回任务ID，进度/下载见下载中心） */
  const dailyExportParams = () => {
    const q = committedQuery.value
    const [dateStart, dateEnd] = q.dateRange || []
    return {
      boardType: boardTypeMap[props.activeTab] || 'asin',
      asin: q.keyword,
      searchMode: q.searchType === 'pasin' ? 'pasin' : 'asin',
      site: q.site?.length ? q.site : undefined,
      shopIds: committedShopIds.value.length ? committedShopIds.value : undefined,
      dateStart,
      dateEnd,
      grain: filterForm.value.periodType,
      showGrowth: true
    }
  }

  //   const getRowClassName = ({ row }: { row: Record<string, any> }): string =>
  //     row.id === TOTAL_ID ? 'asin-total-row' : ''

  /** 根据 periodType 动态生成日期选择器配置 */
  const periodDatePickerConfig = computed(() =>
    getPeriodDatePickerConfig(filterForm.value.periodType)
  )

  /**
   * 触发日销售统计重新加载：
   * - committedQuery：搜索栏条件提交（搜索/重置）
   * - filterForm.periodType：周期即时切换
   * - activeTab：看板切换
   * 涨幅开关不在此列，仅前端控制显隐。
   */
  watch(
    () => [committedQuery.value, filterForm.value.periodType, props.activeTab],
    () => {
      loadData()
    }
  )

  /** 加载店铺下拉（pubStoreList：value=店铺id，label=店铺名） */
  const loadShopOptions = async (): Promise<void> => {
    shopOptions.value = await pubStoreList()
  }
</script>

<style lang="scss" scoped>
  // 搜索栏吸顶容器：Tab 之下固定（--asin-search-top 由父组件 index.vue 提供，嵌入模式为 0）。
  // z-index 高于 Tab：与 Tab 背景重叠处由本容器遮盖，杜绝中间透字。
  // 背景取页面灰：搜索栏卡片自身是白色，其底部外边距区域会露出这层灰，使灰色间距也随吸顶固定且不透明。
  // display:flow-root 建立 BFC，防止内部搜索栏 margin-bottom 塌陷穿出容器。
  .asin-search-sticky {
    position: sticky;
    top: var(--asin-search-top, 45px);
    z-index: 20;
    display: flow-root;
    background-color: var(--art-bg-color);
  }

  // 搜索栏卡片：消除 ArtSearchBar 自带的底部外边距，避免卡片内多余留白
  .asin-search-card {
    margin-bottom: 12px;

    :deep(.el-card__body) {
      padding: 12px 16px 0;
    }

    :deep(.art-search-bar) {
      padding: 0;
      margin-bottom: 0;
    }
  }

  // 周维度自定义周区间选择器：与前置下拉拼接成复合搜索框
  .composite-period-date {
    display: flex;
    width: 100%;

    :deep(.el-select__wrapper) {
      flex-shrink: 0;
      height: var(--el-component-size-small);
      border-right-width: 0;
      border-radius: var(--el-border-radius-base) 0 0 var(--el-border-radius-base);
    }
  }
</style>
