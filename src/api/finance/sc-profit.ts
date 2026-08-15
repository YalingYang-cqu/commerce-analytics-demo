import request from '@/utils/http'
import type { OrderProfitBaseFilter } from './sc-profit-types'
import { toBackendTab } from './sc-profit-filter'

export { resolveOrderProfitDateRange } from './sc-profit-date-range'
export type { OrderProfitBaseFilter } from './sc-profit-types'
export {
  buildOrderProfitFilter,
  resolveOrderProfitDateType,
  resolveOrderProfitGranularity,
  toBackendTab
} from './sc-profit-filter'

/** 报表聚合允许短时数据库抖动；正常性能目标仍由后端保证在 15 秒内。 */
const SC_PROFIT_REQUEST_TIMEOUT = 60000

/**
 * SC 订单利润统计接口（对接后端 OrderProfitController，外部路径 /ims/sc-profit/**）。
 *
 * 契约方向：以前端 field key 为准（后端 code / 明细行 key 已对齐）。
 * - 指标卡键：profit/margin/sales/qty/shipQty/dailyProfit/dailyMargin/avgOrder/
 *   unitProfitAmount/unitProfitRate/unitAd/unitPromoFee/各费用（含独立 testFee）/
 *   风险(lossCount/lossAmount/...)。
 * - 明细行身份键：image/parentAsin/asin/msku/spu/category/brand/store/country/owner/
 *   orderNo/orderTime/payTime/shipTime/settleTime/settlementNo/date（层级子行经 adapter 转 _children）。
 * - 广告归因组（adSales/adQty/organicQty/offsiteQty/adQtyRate/adAcos）本期后端不返回 → 前端显示「—」。
 * - 币种本期仅 USD；库存成本（purchase/head/totalCost）本期为 null。
 */

/** 明细查询入参 */
export interface OrderProfitDetailQuery extends OrderProfitBaseFilter {
  /** 页签/维度 dashboard/parentAsin/asin/sku/spu/order（前端 msku 需转 sku） */
  tab: string
  granularity?: string
  columns?: string[]
  pageNo?: number
  pageSize?: number
  hasCount?: boolean
  sortField?: string
  sortOrder?: string
  withChildren?: boolean
}

/** 趋势查询入参 */
export interface OrderProfitTrendQuery extends OrderProfitBaseFilter {
  tab?: string
  metrics?: string[]
  granularity?: string
  range?: string
}

// ===================== 出参 =====================

export interface OrderProfitMetricCard {
  metric: string
  label: string
  fmt: string
  value: number | null
  wowRate: number | null
  clickable?: boolean
  filterCode?: string
}

export interface OrderProfitMetricsResult {
  tab: string
  currency: string
  cards: OrderProfitMetricCard[]
}

export interface OrderProfitOption {
  value: string
  label: string
  fmt?: string
}

export interface OrderProfitMetricPool {
  tab: string
  defaultMetrics: string[]
  metrics: OrderProfitOption[]
}

export interface WeekInfo {
  weekYear?: number
  weekNo?: number
  weekLabel?: string
  dateStart?: string
  dateEnd?: string
  monthWeekLabel?: string
}

export interface DynamicColumn {
  key: string
  label: string
  subLabel?: string
  dateStart?: string
  dateEnd?: string
  weekInfo?: WeekInfo
}

export interface OrderProfitTrendSeries {
  metric: string
  label: string
  fmt: string
  values: Array<number | null>
  normalizedValues: Array<number | null>
}

export interface OrderProfitTrend {
  granularity: string
  dateStart: string
  dateEnd: string
  columns: DynamicColumn[]
  series: OrderProfitTrendSeries[]
}

export interface OrderProfitDiagnosisItem {
  metric: string
  label: string
  fmt: string
  prevValue: number | null
  currValue: number | null
  changeRate: number | null
}

export interface OrderProfitDiagnosis {
  prevRange: string
  currRange: string
  items: OrderProfitDiagnosisItem[]
}

export interface OrderProfitDashboardOverview {
  metrics: OrderProfitMetricsResult
  trend: OrderProfitTrend
  diagnosis: OrderProfitDiagnosis
}

/** 明细行（动态字段：身份键 + 指标 code→value + children 子行） */
export type OrderProfitRow = Record<string, any>

export interface OrderProfitDetail {
  currency: string
  total: number
  columns: string[]
  dynamicColumns: DynamicColumn[]
  rows: OrderProfitRow[]
  summary: OrderProfitRow
}

export interface OrderProfitStatusCount {
  all: number
  loss: number
  low: number
  normal: number
  high: number
}

export interface OrderProfitBreakdownCell {
  key: string
  label: string
  amount: number | null
  ratio: number | null
}

export interface OrderProfitBreakdownItem {
  frontCaliberL2: string
  wideColumn: string
  amount: number | null
  expandable?: boolean
  incomeExpenseFlag?: number
}

export interface OrderProfitBreakdownGroup {
  categoryL1: string
  subtotal: number | null
  items: OrderProfitBreakdownItem[]
}

export interface OrderProfitWaterfallBar {
  label: string
  value: number | null
  type: string
}

export interface OrderProfitBreakdown {
  title: string
  currency: string
  profit: number | null
  margin: number | null
  sales: number | null
  qty: number | null
  unitCards: OrderProfitBreakdownCell[]
  incomeExpense: OrderProfitBreakdownGroup[]
  waterfall: OrderProfitWaterfallBar[]
  costRatio: OrderProfitBreakdownCell[]
}

export interface OrderProfitFeeDrilldownItem {
  feeItemL3: string
  amount: number | null
  incomeExpenseFlag?: number
}

export interface OrderProfitFeeDrilldown {
  frontCaliberL2: string
  wideColumn: string
  total: number | null
  expandable?: boolean
  items: OrderProfitFeeDrilldownItem[]
}

export interface OrderProfitFeeRule {
  feeName: string
  allocRule: string
  timeRule: string
}

export interface OrderProfitFeeRules {
  rules: OrderProfitFeeRule[]
}

/** 店铺下拉选项（受账号数据权限过滤，含 countryCode 供站点联动） */
export interface OrderProfitStoreOption {
  id: number
  name: string
  countryCode: string
  countryName?: string
}

// ===================== 接口 =====================

/** 核心指标条（按页签返回全量指标目录 + 值/环比/点击联动） */
export async function orderProfitMetrics(
  params: OrderProfitBaseFilter & { tab: string }
): Promise<OrderProfitMetricsResult> {
  const res: any = await request.post<OrderProfitMetricsResult>({
    url: `/ims/sc-profit/metrics`,
    params: { ...params, tab: toBackendTab(params.tab) },
    timeout: SC_PROFIT_REQUEST_TIMEOUT
  })
  return res?.data
}

/** 看板首屏组合查询：指标、趋势和诊断共用一次后端日快照。 */
export async function orderProfitDashboardOverview(
  params: OrderProfitTrendQuery
): Promise<OrderProfitDashboardOverview> {
  const res: any = await request.post<OrderProfitDashboardOverview>({
    url: `/ims/sc-profit/dashboard-overview`,
    params: { ...params, tab: 'dashboard' },
    timeout: SC_PROFIT_REQUEST_TIMEOUT
  })
  return res?.data
}

/** 趋势「添加指标」指标池（按页签） */
export async function orderProfitMetricPool(tab: string): Promise<OrderProfitMetricPool> {
  const res: any = await request.get<OrderProfitMetricPool>({
    url: `/ims/sc-profit/metric-pool`,
    params: { tab: toBackendTab(tab) }
  })
  return res?.data
}

/** 趋势分析（≤4 指标，日/周/月，连续时间轴 + 归一化） */
export async function orderProfitTrend(params: OrderProfitTrendQuery): Promise<OrderProfitTrend> {
  const res: any = await request.post<OrderProfitTrend>({
    url: `/ims/sc-profit/trend`,
    params: { ...params, tab: params.tab ? toBackendTab(params.tab) : params.tab },
    timeout: SC_PROFIT_REQUEST_TIMEOUT
  })
  return res?.data
}

/** 经营诊断（仅看板，所选区间前后段对比） */
export async function orderProfitDiagnosis(
  params: OrderProfitBaseFilter & { tab: string }
): Promise<OrderProfitDiagnosis> {
  const res: any = await request.post<OrderProfitDiagnosis>({
    url: `/ims/sc-profit/diagnosis`,
    params: { ...params, tab: toBackendTab(params.tab) },
    timeout: SC_PROFIT_REQUEST_TIMEOUT
  })
  return res?.data
}

/** 明细主接口（原始响应；层级子行为 children/hasChildren，前端经 adaptDetail 转换） */
export async function orderProfitDetailRaw(
  params: OrderProfitDetailQuery
): Promise<OrderProfitDetail> {
  const res: any = await request.post<OrderProfitDetail>({
    url: `/ims/sc-profit/detail`,
    params,
    timeout: SC_PROFIT_REQUEST_TIMEOUT
  })
  return res?.data
}

/** 利润状态计数（全部/亏损/低毛利/正常/高毛利） */
export async function orderProfitStatusCount(
  params: OrderProfitDetailQuery
): Promise<OrderProfitStatusCount> {
  const res: any = await request.post<OrderProfitStatusCount>({
    url: `/ims/sc-profit/profit-status-count`,
    params: { ...params, tab: toBackendTab(params.tab) }
  })
  return res?.data
}

/** 利润拆解抽屉（单个利润卡 + 收支拆解 + 瀑布 + 成本占比） */
export async function orderProfitBreakdown(
  params: OrderProfitBaseFilter & { tab: string; dimValue?: string }
): Promise<OrderProfitBreakdown> {
  const res: any = await request.post<OrderProfitBreakdown>({
    url: `/ims/sc-profit/breakdown`,
    params: { ...params, tab: toBackendTab(params.tab) }
  })
  return res?.data
}

/** 费用二级 → 三级下钻（item 长表 + dim 字典 expandable） */
export async function orderProfitFeeDrilldown(
  params: OrderProfitBaseFilter & { tab: string; dimValue?: string; wideColumn: string }
): Promise<OrderProfitFeeDrilldown> {
  const res: any = await request.post<OrderProfitFeeDrilldown>({
    url: `/ims/sc-profit/fee-drilldown`,
    params: { ...params, tab: toBackendTab(params.tab) }
  })
  return res?.data
}

/** 费用分摊规则说明（静态口径） */
export async function orderProfitFeeRules(): Promise<OrderProfitFeeRules> {
  const res: any = await request.get<OrderProfitFeeRules>({ url: `/ims/sc-profit/fee-rules` })
  return res?.data
}

/**
 * 店铺下拉选项（受当前用户账号数据权限过滤，仅返回可见店铺）。
 * site 为空返回全部可见店铺（所有站点）；非空按站点过滤。前端亦可用返回的 countryCode 做客户端联动。
 */
export async function orderProfitStoreOptions(
  params: { site?: string[]; keyword?: string } = {}
): Promise<OrderProfitStoreOption[]> {
  const res: any = await request.post<OrderProfitStoreOption[]>({
    url: `/ims/sc-profit/store-options`,
    params
  })
  return res?.data || []
}

/** 分类/品牌/SPU 联动下拉选项项（id + name；SPU 另含 code=spuCode） */
export interface OrderProfitIdNameOption {
  id: number
  name: string
  /** SPU 编码；下拉 value / 筛选用 */
  code?: string
}

/** 分类/品牌/SPU 联动下拉返回（按 站点+店铺+数据权限，口径=范围内实际有利润数据的商品） */
export interface OrderProfitFilterOptions {
  categories: OrderProfitIdNameOption[]
  brands: OrderProfitIdNameOption[]
  spus: OrderProfitIdNameOption[]
}

/**
 * 分类/品牌/SPU 联动下拉：随 站点(site) + 店铺(shopIds) 变化动态加载。
 * 后端按数据权限过滤，口径为当前范围内利润宽表实际出现过的商品去重。
 */
export async function orderProfitFilterOptions(
  params: { site?: string[]; shopIds?: number[] } = {}
): Promise<OrderProfitFilterOptions> {
  const res: any = await request.post<OrderProfitFilterOptions>({
    url: `/ims/sc-profit/filter-options`,
    params
  })
  return res?.data || { categories: [], brands: [], spus: [] }
}

/** 明细导出（异步，返回下载任务 ID，下载中心查看） */
export async function orderProfitExport(params: OrderProfitDetailQuery): Promise<number> {
  const res: any = await request.post<number>({
    url: `/ims/sc-profit/export`,
    params: { ...params, tab: toBackendTab(params.tab), withChildren: false }
  })
  return res?.data
}

// ===================== 明细响应 adapter =====================

/** 分页明细结果（供 useTable 使用） */
export interface OrderProfitDetailPage {
  records: OrderProfitRow[]
  total: number
  summary: OrderProfitRow | null
  dynamicColumns: DynamicColumn[]
}

const firstChar = (row: OrderProfitRow): string => {
  const s = String(row.category ?? row.msku ?? row.asin ?? '品')
  return s ? s.slice(0, 1) : '品'
}

/**
 * 比率/环比字段：后端以比率返回（利润率 0.0324、环比 0.05、marginChange 为比率差 0.01），
 * 前端明细列 fmt=percent/wow 期望百分数（3.24 / 5.0），统一 ×100。
 */
const RATIO_PCT_KEYS = [
  'margin',
  'unitProfitRate',
  'costRate',
  'dailyMargin',
  'estimatedMargin',
  'adAcos',
  'adQtyRate',
  'salesWoW',
  'profitWoW',
  'marginChange'
]

const scaleRatios = (row: OrderProfitRow): void => {
  RATIO_PCT_KEYS.forEach((k) => {
    if (row[k] != null && row[k] !== '') row[k] = Number(row[k]) * 100
  })
}

/** 递归把后端 children/hasChildren 转为前端树用的 _children/_key/_isChild/_imgChar/_count */
function mapRow(row: OrderProfitRow, parentKey: string, isChild: boolean): OrderProfitRow {
  const selfKey =
    row.dimKey != null && row.dimKey !== ''
      ? String(row.dimKey)
      : String(row.childKey ?? row.orderNo ?? row.asin ?? row.msku ?? Math.random())
  const key = isChild ? `${parentKey}:${selfKey}` : `p:${selfKey}`
  const out: OrderProfitRow = {
    ...row,
    _key: key,
    _isChild: isChild,
    _imgChar: firstChar(row),
    _count: Number(row.orderCount) || 0
  }
  scaleRatios(out)
  const kids = row.children as OrderProfitRow[] | undefined
  if (kids && kids.length) {
    out._children = kids.map((c) => mapRow(c, key, true))
    // 订单多明细：若后端未带回身份字段，兜底用子行列表第一条（主路径已由
    // Display_Maxes 按 order_item_id 取首条，不随列排序变化）
    if (out.orderNo && out._children.length > 0) {
      const first = out._children[0]
      if ((out.asin == null || out.asin === '') && first.asin) out.asin = first.asin
      if ((out.msku == null || out.msku === '') && first.msku) out.msku = first.msku
      if ((out.parentAsin == null || out.parentAsin === '') && first.parentAsin) {
        out.parentAsin = first.parentAsin
      }
    }
  }
  delete out.children
  delete out.hasChildren
  return out
}

/** 明细响应 → useTable 分页结果（children→_children，summary 副作用） */
export function adaptDetail(vo: OrderProfitDetail | null | undefined): OrderProfitDetailPage {
  if (!vo) return { records: [], total: 0, summary: null, dynamicColumns: [] }
  const records = (vo.rows || []).map((row) => mapRow(row, '', false))
  let summary: OrderProfitRow | null = null
  if (vo.summary && Object.keys(vo.summary).length) {
    // 汇总行也补 _count，供拆解抽屉「订单数」读取（与 mapRow 一致）
    summary = {
      ...vo.summary,
      _level: 'summary',
      _count: Number(vo.summary.orderCount) || 0
    }
    scaleRatios(summary)
  }
  return {
    records,
    total: Number(vo.total) || 0,
    summary,
    dynamicColumns: vo.dynamicColumns || []
  }
}

/** 明细两步法：拉取并 adapt 为分页结果 */
export async function orderProfitDetail(
  params: OrderProfitDetailQuery
): Promise<OrderProfitDetailPage> {
  const vo = await orderProfitDetailRaw({ ...params, tab: toBackendTab(params.tab) })
  return adaptDetail(vo)
}
