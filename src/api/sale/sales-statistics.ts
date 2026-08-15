import request from '@/utils/http'

export type SalesChannel = 'combined' | 'sc' | 'vc'
export type SalesDimension =
  | 'pasin'
  | 'asin'
  | 'spu'
  | 'sku'
  | 'category'
  | 'brand'
  | 'shop'
  | 'owner'
  | 'site'
export type SalesMetric =
  | 'sales'
  | 'revenue'
  | 'order'
  | 'return'
  | 'naturalSales'
  | 'adSales'
  | 'offSiteSales'
  | 'naturalRevenue'
  | 'adRevenue'
  | 'adOrder'
  | 'naturalOrder'
  | 'returnRate'
  | 'conversionRate'
  | 'naturalSalesRatio'
  | 'adSalesRatio'
  | 'adOrderRatio'
  | 'naturalOrderRatio'
  | 'adCostRatio'
  | 'adCost'
  | 'acos'
  | 'roas'
  | 'ctr'
  | 'adConversionRate'
  | 'cpc'
  | 'cpa'
  | 'cpo'
  | 'adImpressions'
  | 'adClicks'
  | 'pageViews'
  | 'sessions'
  | 'customerPrice'
  | 'asp'
export type SalesPeriod = 'day' | 'week' | 'month'

export interface SalesBaseFilter {
  channel: SalesChannel
  site?: string[]
  shopIds?: number[]
  brandIds?: number[]
  categoryIds?: number[]
  ownerIds?: number[]
  productStatus?: string[]
  // keyword/日期为「销售明细」专属条件，不属于公共筛选：
  // 实时概况(overview)与趋势(trend)不再传，仅明细查询传。故此处置为可选。
  keyword?: string
  dateStart?: string
  dateEnd?: string
}

// 实时概况：仅公共筛选，日期由后端按服务器「今天」自算，前端不传起止日期/关键词
export type SalesOverviewQuery = SalesBaseFilter

export interface MetricCard {
  metric: string
  label: string
  value: number | string | null
  wowRate?: number | string | null
  scValue?: number | string | null
  vcValue?: number | string | null
  scRatio?: number | string | null
  vcRatio?: number | string | null
  yoyRate?: number | string | null
  yesterdayValue?: number | string | null
  last7Value?: number | string | null
}

export interface SalesOverview {
  channel: SalesChannel
  dateStart: string
  dateEnd: string
  salesMetrics: MetricCard[]
  adMetrics: MetricCard[]
}

export interface SalesDetailQuery extends SalesBaseFilter {
  // 明细自带日期/关键词（公共筛选之外的明细专属条件），均为必填
  dateStart: string
  dateEnd: string
  dimension: SalesDimension
  metric: SalesMetric
  period: SalesPeriod
  columns?: string[]
  pageNo?: number
  pageSize?: number
  hasCount?: boolean
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

export interface DynamicColumn {
  key: string
  label: string
  subLabel?: string
  dateStart?: string
  dateEnd?: string
}

export interface SalesDetailRow {
  [key: string]: unknown
  hasChildren?: boolean
  children?: SalesDetailRow[]
  isChildRow?: boolean
}

export interface SalesDetail {
  total: number
  columns: string[]
  dynamicColumns: DynamicColumn[]
  rows: SalesDetailRow[]
  summary: SalesDetailRow
}

export interface SalesTrendQuery extends SalesBaseFilter {
  /** 粒度 day/week/month */
  granularity: SalesPeriod
  /** 时间范围预设 d7/d14/d30/thisM/lastM/ytd（传入时后端按服务器今天覆盖起止日期） */
  range?: string
  /** 对比指标码集合（为空后端默认 销量/自然销量/广告销量） */
  metrics?: string[]
}

export interface SalesTrendSeries {
  metric: string
  label: string
  /** 各周期桶原值（缺数据桶：数量型 0、比率型 null）。「原值」模式用此 */
  values: Array<number | null>
  /** 各周期桶归一化值（后端按本指标 min/max 缩放到 0~100，缺值 null）。「归一化」模式用此 */
  normalizedValues: Array<number | null>
}

export interface SalesTrend {
  channel: SalesChannel
  granularity: SalesPeriod
  dateStart: string
  dateEnd: string
  columns: DynamicColumn[]
  series: SalesTrendSeries[]
}

export interface SalesMetricOption {
  metric: string
  label: string
}

export interface SalesTrendMetricPool {
  channel: SalesChannel
  salesMetrics: SalesMetricOption[]
  adMetrics: SalesMetricOption[]
}

export type AsinBoardType = 'asin' | 'scasin' | 'vcasin'
export type AsinSearchMode = 'asin' | 'pasin'
export type AsinHourMode = 'unit' | 'cumulative'

export interface AsinDailyStatisticsQuery {
  boardType: AsinBoardType
  asin: string
  searchMode: AsinSearchMode
  site?: string[]
  shopIds?: number[]
  dateStart: string
  dateEnd: string
  grain: SalesPeriod
  columns?: string[]
  showGrowth?: boolean
}

export interface SalesMetricsValue {
  [key: string]: number | string | null | undefined
}

export interface AsinPeriodMetric {
  bucket: string
  label: string
  metrics: SalesMetricsValue
  growth?: Record<string, number | string | null>
  weekInfo?: {
    weekLabel?: string
    monthWeekLabel?: string
    dateStart?: string
    dateEnd?: string
  }
}

export interface AsinDailyStatistics {
  asin: string
  grain: SalesPeriod
  periods: AsinPeriodMetric[]
}

export interface AsinHourSummaryQuery {
  boardType: AsinBoardType
  asin: string
  dateEnd: string
  mode: AsinHourMode
  showGrowth?: boolean
  columns?: string[]
}

export interface AsinHourMetric {
  hour: number
  metrics: SalesMetricsValue
  growth?: Record<string, number | string | null>
}

export interface AsinHourSummary {
  asin: string
  statDate: string
  mode: AsinHourMode
  hours: AsinHourMetric[]
}

export interface AsinHourCompareQuery {
  boardType: AsinBoardType
  asin: string
  dateEnd: string
  compareDates: string[]
  mode: AsinHourMode
  showGrowth?: boolean
  showAdCost?: boolean
}

export interface AsinHourCompare {
  asin: string
  statDate: string
  mode: AsinHourMode
  dates: Array<{
    date: string
    hours: AsinHourMetric[]
  }>
}

const BASE = '/ims/sales/statistics'
const ASIN_BASE = '/ims/sales/asin'

/**
 * 销量统计聚合接口超时（ms）。
 * 这些接口基于 DWS 日宽表做多维聚合，数据范围大时单次查询可达数秒，
 * 故覆盖全局默认 15s，避免大范围查询被前端提前判定为超时。
 */
const SALES_REQUEST_TIMEOUT = 60000

const unwrap = <T>(res: T | { data?: T }): T => {
  if (res && typeof res === 'object' && 'data' in res) {
    return (res as { data?: T }).data as T
  }
  return res as T
}

export function fetchSalesOverview(data: SalesOverviewQuery) {
  return request
    .post<SalesOverview>({
      url: `${BASE}/overview`,
      data,
      timeout: SALES_REQUEST_TIMEOUT
    })
    .then(unwrap<SalesOverview>)
}

export function fetchSalesDetail(data: SalesDetailQuery) {
  return request
    .post<SalesDetail>({
      url: `${BASE}/detail`,
      data,
      timeout: SALES_REQUEST_TIMEOUT
    })
    .then(unwrap<SalesDetail>)
}

export function fetchSalesTrend(data: SalesTrendQuery) {
  return request
    .post<SalesTrend>({
      url: `${BASE}/trend`,
      data,
      timeout: SALES_REQUEST_TIMEOUT
    })
    .then(unwrap<SalesTrend>)
}

export function fetchSalesTrendMetricPool(channel: SalesChannel = 'combined') {
  return request
    .get<SalesTrendMetricPool>({
      url: `${BASE}/metric-pool`,
      params: { channel },
      timeout: SALES_REQUEST_TIMEOUT
    })
    .then(unwrap<SalesTrendMetricPool>)
}

export function createSalesDetailExport(data: SalesDetailQuery) {
  return request
    .post<number>({
      url: `${BASE}/export`,
      data,
      showSuccessMessage: false,
      timeout: SALES_REQUEST_TIMEOUT
    })
    .then(unwrap<number>)
}

export function fetchAsinDailyStatistics(data: AsinDailyStatisticsQuery) {
  return request
    .post<AsinDailyStatistics>({
      url: `${ASIN_BASE}/daily-statistics`,
      data,
      timeout: SALES_REQUEST_TIMEOUT
    })
    .then(unwrap<AsinDailyStatistics>)
}

export function fetchAsinHourSummary(data: AsinHourSummaryQuery) {
  return request
    .post<AsinHourSummary>({
      url: `${ASIN_BASE}/hour-summary`,
      data,
      timeout: SALES_REQUEST_TIMEOUT
    })
    .then(unwrap<AsinHourSummary>)
}

export function fetchAsinHourCompare(data: AsinHourCompareQuery) {
  return request
    .post<AsinHourCompare>({
      url: `${ASIN_BASE}/hour-compare`,
      data,
      timeout: SALES_REQUEST_TIMEOUT
    })
    .then(unwrap<AsinHourCompare>)
}
