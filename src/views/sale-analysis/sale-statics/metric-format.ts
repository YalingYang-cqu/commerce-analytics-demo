import type { MetricFormat } from '@/components/core/charts-comp/types'

/** 后端返回 0~1 小数的比率类指标（展示时需 ×100 并加 %） */
export const RATE_METRIC_KEYS = new Set([
  'returnRate',
  'conversionRate',
  'naturalSalesRatio',
  'adSalesRatio',
  'adOrderRatio',
  'naturalOrderRatio',
  'adCostRatio',
  'acos',
  'ctr',
  'adConversionRate',
  /** 明细列「较前7日涨幅」，与 wowRate 同为 growthRate 小数 */
  'growth'
])

/** 金额 / 单价类：两位小数，趋势图用 money 格式 */
export const MONEY_METRIC_KEYS = new Set([
  'revenue',
  'naturalRevenue',
  'adRevenue',
  'offSiteRevenue',
  'adCost',
  'cpc',
  'cpa',
  'cpo',
  'customerPrice',
  'asp'
])

/** 倍数类（非百分比）：如 ROAS */
export const FLOAT_METRIC_KEYS = new Set(['roas'])

export const isRateMetric = (key: string): boolean => RATE_METRIC_KEYS.has(key)

export const isMoneyMetric = (key: string): boolean => MONEY_METRIC_KEYS.has(key)

export const resolveMetricFormat = (key: string): MetricFormat => {
  if (isMoneyMetric(key)) return 'money'
  if (isRateMetric(key)) return 'percent'
  if (FLOAT_METRIC_KEYS.has(key)) return 'float'
  return 'number'
}

export const formatMetricDisplay = (value: unknown, key: string): string => {
  if (value === null || value === undefined || value === '') return '-'
  const num = Number(value)
  if (Number.isNaN(num)) return String(value)
  if (isRateMetric(key)) return `${(num * 100).toFixed(2)}%`
  if (isMoneyMetric(key) || FLOAT_METRIC_KEYS.has(key)) {
    return num.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  return num.toLocaleString()
}

/** 趋势图序列：比率指标在绘图前转为百分数刻度（0.05 → 5） */
export const normalizeTrendSeries = (key: string, data: number[]): number[] =>
  isRateMetric(key) ? data.map((item) => item * 100) : data
