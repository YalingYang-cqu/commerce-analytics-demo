import request from '@/utils/http'

/**
 * ASIN 看板接口（对接后端 SalesAdAsinController，外部路径 /ims/sales/asin/**）。
 * 日销售统计 / 分时汇总 / 分时对比。
 */

/** 看板类型：综合/SC/VC */
export type AsinBoardType = 'asin' | 'scasin' | 'vcasin'
/** 周期 */
export type AsinGrain = 'day' | 'week' | 'month'
/** 分时取值模式：单位 / 累计 */
export type AsinHourMode = 'unit' | 'cumulative'

/** 销量广告指标（原子量回显 + 派生指标；比率类为小数 0~1，分母为 0 时为 null） */
export interface SalesAdMetrics {
  totalSalesQty?: number | null
  offSiteSalesQty?: number | null
  adSalesQty?: number | null
  /** 本SKU广告销量(SC,30d;VC=0) */
  adSalesQtySameSku?: number | null
  totalOrderQty?: number | null
  offSiteOrderQty?: number | null
  adOrderQty?: number | null
  totalSalesAmt?: number | null
  offSiteSalesAmt?: number | null
  adSalesAmt?: number | null
  adImpressions?: number | null
  adClicks?: number | null
  adCost?: number | null
  pageViews?: number | null
  sessions?: number | null
  returnQty?: number | null
  shippedQty?: number | null
  naturalSalesQty?: number | null
  naturalOrderQty?: number | null
  /** 自然销售额(总额-站外额-广告额,可为负) */
  naturalSalesAmt?: number | null
  /** 其他SKU广告销量(广告销量-本SKU,可为负) */
  adSalesQtyOtherSku?: number | null
  naturalSalesRatio?: number | null
  adSalesRatio?: number | null
  adOrderRatio?: number | null
  /** 自然订单占比 */
  naturalOrderRatio?: number | null
  /** 广告花费占比(广告花费/总销售额) */
  adCostRatio?: number | null
  returnRate?: number | null
  conversionRate?: number | null
  acos?: number | null
  roas?: number | null
  cpc?: number | null
  cpa?: number | null
  cpo?: number | null
  ctr?: number | null
  adConversionRate?: number | null
  customerPrice?: number | null
  asp?: number | null
}

/** 周维度信息 */
export interface WeekInfo {
  weekYear?: number
  weekNo?: number
  weekLabel?: string
  dateStart?: string
  dateEnd?: string
  monthWeekLabel?: string
}

/** 周期指标单元（日/周/月） */
export interface AsinPeriodMetric {
  bucket: string
  label: string
  weekInfo?: WeekInfo
  metrics: SalesAdMetrics
  /** SC 渠道指标值（仅综合看板返回，用于 SC* 拆分列） */
  scMetrics?: SalesAdMetrics
  /** VC 渠道指标值（仅综合看板返回，用于 VC* 拆分列） */
  vcMetrics?: SalesAdMetrics
  /** 各指标环比涨幅（metricCode -> 小数涨幅） */
  growth?: Record<string, number>
  /** SC 渠道各指标环比涨幅（仅综合看板） */
  scGrowth?: Record<string, number>
  /** VC 渠道各指标环比涨幅（仅综合看板） */
  vcGrowth?: Record<string, number>
}

/** 分时指标单元（0-23 小时） */
export interface AsinHourMetric {
  hour: number
  metrics: SalesAdMetrics
  growth?: Record<string, number>
}

/** ===================== 入参 ===================== */

/** 产品日销售统计入参 */
export interface AsinDailyStatQuery {
  boardType: AsinBoardType
  asin: string
  /** 检索方式 asin/pasin */
  searchMode: string
  site?: string[]
  shopIds?: number[]
  dateStart: string
  dateEnd: string
  grain: AsinGrain
  columns?: string[]
  showGrowth?: boolean
}

/** 产品分时汇总入参 */
export interface AsinHourSummaryQuery {
  boardType: AsinBoardType
  asin: string
  dateEnd: string
  mode: AsinHourMode
  showGrowth?: boolean
  columns?: string[]
  /** 检索方式 asin/pasin（与日销售统计同口径） */
  searchMode?: string
  /** 站点筛选（与日销售统计同口径） */
  site?: string[]
  /** 店铺 id 筛选（与日销售统计同口径） */
  shopIds?: number[]
}

/** 产品分时对比入参 */
export interface AsinHourCompareQuery {
  boardType: AsinBoardType
  asin: string
  dateEnd: string
  compareDates: string[]
  mode: AsinHourMode
  showGrowth?: boolean
  showAdCost?: boolean
  /** 检索方式 asin/pasin（与日销售统计同口径） */
  searchMode?: string
  /** 站点筛选（与日销售统计同口径） */
  site?: string[]
  /** 店铺 id 筛选（与日销售统计同口径） */
  shopIds?: number[]
}

/** ===================== 出参 ===================== */

/** 日销售统计响应 */
export interface AsinDailyStatVo {
  asin: string
  grain: AsinGrain
  periods: AsinPeriodMetric[]
}

/** 分时汇总响应 */
export interface AsinHourSummaryVo {
  asin: string
  statDate: string
  mode: AsinHourMode
  hours: AsinHourMetric[]
  /** 全天汇总指标（后端直接返回，作为「汇总/时区」列取值） */
  total?: SalesAdMetrics
}

/** 分时对比单日期序列 */
export interface AsinHourCompareSeries {
  date: string
  hours: AsinHourMetric[]
}

/** 分时对比响应 */
export interface AsinHourCompareVo {
  asin: string
  mode: AsinHourMode
  showAdCost?: boolean
  series: AsinHourCompareSeries[]
}

/** ===================== 接口 ===================== */

/** 产品日销售统计（日/周/月，含涨幅） */
export function asinDailyStatistics(params: AsinDailyStatQuery) {
  return request.post<AsinDailyStatVo>({
    url: `/ims/sales/asin/daily-statistics`,
    params
  })
}

/** 产品分时汇总（0-23 小时，单位/累计） */
export function asinHourSummary(params: AsinHourSummaryQuery) {
  return request.post<AsinHourSummaryVo>({
    url: `/ims/sales/asin/hour-summary`,
    params
  })
}

/** 产品分时销量对比（多日期） */
export function asinHourCompare(params: AsinHourCompareQuery) {
  return request.post<AsinHourCompareVo>({
    url: `/ims/sales/asin/hour-compare`,
    params
  })
}
/** 产品日销售统计-导出（异步导出，返回下载任务ID，进度/下载见下载中心） */
export function asinDailyStatisticsExport(params: AsinDailyStatQuery) {
  return request.post<number>({
    url: `/ims/sales/asin/daily-statistics/export`,
    params
  })
}

/** 产品分时汇总-导出（异步导出，返回下载任务ID，进度/下载见下载中心） */
export function asinHourSummaryExport(params: AsinHourSummaryQuery) {
  return request.post<number>({
    url: `/ims/sales/asin/hour-summary/export`,
    params
  })
}

/** 产品分时对比-导出（异步导出，返回下载任务ID，进度/下载见下载中心） */
export function asinHourCompareExport(params: AsinHourCompareQuery) {
  return request.post<number>({
    url: `/ims/sales/asin/hour-compare/export`,
    params
  })
}
