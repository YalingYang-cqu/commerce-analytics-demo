// 产品分时（汇总统计 / 对比）数据结构与「后端 VO → 前端行」转换
// 汇总：转置表（指标为行、小时为列）；对比：多日期按小时对比销量

import type { AsinHourSummaryVo, AsinHourCompareVo, SalesAdMetrics } from '@/api/sale/asin'

/** 美国小时标签：00 ~ 23（共 24 个，作为表头/分时主轴） */
export const US_HOURS: string[] = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))

/** 美国 → 中国 时区偏移（演示用固定 +15 小时） */
export const TIMEZONE_OFFSET = 15

/** 根据美国小时下标推算对应中国小时标签 */
export const cnHour = (usIndex: number): string =>
  String((usIndex + TIMEZONE_OFFSET) % 24).padStart(2, '0')

const rand = (min: number, max: number) => Math.round(min + Math.random() * (max - min))
const round2 = (n: number) => Math.round(n * 100) / 100
const safeDiv = (a: number, b: number) => (b ? a / b : 0)

/** ===================== 产品分时汇总统计（转置：指标为行、小时为列） ===================== */

/** 指标类型，决定单元格格式化方式 */
export type IndicatorType = 'int' | 'percent' | 'money' | 'decimal'

/** 汇总统计指标定义 */
export interface SummaryIndicator {
  key: string
  label: string
  type: IndicatorType
  /** 是否可累计（决定「时段累计」与汇总列求和） */
  additive: boolean
}

/** 指标行（与截图一致） */
export const SUMMARY_INDICATORS: SummaryIndicator[] = [
  { key: 'totalOrders', label: '总订单', type: 'int', additive: true },
  { key: 'normalOrders', label: '自然订单', type: 'int', additive: true },
  { key: 'advertOrders', label: '广告订单', type: 'int', additive: true },
  { key: 'normalRatio', label: '自然占比', type: 'percent', additive: false },
  { key: 'advertRatio', label: '广告占比', type: 'percent', additive: false },
  { key: 'cost', label: '花费', type: 'money', additive: true },
  { key: 'acos', label: 'ACOS', type: 'percent', additive: false },
  { key: 'cpc', label: 'CPC', type: 'decimal', additive: false },
  { key: 'ctr', label: 'CTR', type: 'percent', additive: false },
  { key: 'cr', label: '广告转化率', type: 'percent', additive: false },
  { key: 'impressions', label: '展示量', type: 'int', additive: true },
  { key: 'clicks', label: '点击量', type: 'int', additive: true }
]

/** 单个小时的原始可加字段 */
interface HourRaw {
  normalOrders: number
  advertOrders: number
  impressions: number
  clicks: number
  cost: number
}

/** 由原始可加字段推导一组完整指标 */
const deriveIndicators = (raw: HourRaw): Record<string, number> => {
  const totalOrders = raw.normalOrders + raw.advertOrders
  return {
    totalOrders,
    normalOrders: raw.normalOrders,
    advertOrders: raw.advertOrders,
    normalRatio: round2(safeDiv(raw.normalOrders, totalOrders) * 100),
    advertRatio: round2(safeDiv(raw.advertOrders, totalOrders) * 100),
    cpc: round2(safeDiv(raw.cost, raw.clicks)),
    impressions: raw.impressions,
    clicks: raw.clicks,
    ctr: round2(safeDiv(raw.clicks, raw.impressions) * 100),
    cr: round2(safeDiv(totalOrders, raw.clicks) * 100),
    cost: round2(raw.cost),
    acos: round2(safeDiv(raw.cost, raw.advertOrders * 25) * 100)
  }
}

/** 单元格：当前值 + 截至当前小时累计 + 较上一小时涨幅 */
export interface SummaryCell {
  value: number | null
  cumulative: number | null
  growth: number
  /** 该小时接口未返回任何数据（区别于真实 0），用于表格留空展示 */
  empty?: boolean
}

/** 汇总统计矩阵：每个指标对应 24 个小时单元格 + 汇总列 */
export interface SummaryMatrix {
  /** 汇总列（各指标合计/再推导） */
  total: Record<string, number>
  /** 指标 key -> 24 小时单元格 */
  cells: Record<string, SummaryCell[]>
}

/** 生成产品分时汇总统计矩阵 */
export function genHourMetricMatrix(): SummaryMatrix {
  const raws: HourRaw[] = []
  const hourData: Record<string, number>[] = []
  for (let h = 0; h < 24; h++) {
    const clicks = rand(0, 300)
    const raw: HourRaw = {
      normalOrders: rand(0, 80),
      advertOrders: rand(0, 50),
      impressions: rand(500, 42000),
      clicks,
      cost: round2(rand(0, 450) + Math.random())
    }
    raws.push(raw)
    hourData.push(deriveIndicators(raw))
  }

  // 汇总列：可加字段求和后再推导比率
  const totalRaw: HourRaw = raws.reduce(
    (acc, r) => ({
      normalOrders: acc.normalOrders + r.normalOrders,
      advertOrders: acc.advertOrders + r.advertOrders,
      impressions: acc.impressions + r.impressions,
      clicks: acc.clicks + r.clicks,
      cost: round2(acc.cost + r.cost)
    }),
    { normalOrders: 0, advertOrders: 0, impressions: 0, clicks: 0, cost: 0 }
  )
  const total = deriveIndicators(totalRaw)

  const cells: Record<string, SummaryCell[]> = {}
  SUMMARY_INDICATORS.forEach((ind) => {
    let cum = 0
    cells[ind.key] = hourData.map((rec, idx) => {
      const value = rec[ind.key]
      cum = ind.additive ? round2(cum + value) : value
      const prev = idx > 0 ? hourData[idx - 1][ind.key] : value
      return { value, cumulative: cum, growth: round2(value - prev) }
    })
  })

  return { total, cells }
}

/** 汇总统计行（转置后：一行=一个指标，含汇总值与 24 小时单元格） */
export interface SummaryRow {
  key: string
  label: string
  type: IndicatorType
  total: number | null
  cells: SummaryCell[]
}

/** 生成汇总统计表格行（供 ArtTable/useTable 使用） */
export function genSummaryRows(): SummaryRow[] {
  const m = genHourMetricMatrix()
  return SUMMARY_INDICATORS.map((ind) => ({
    key: ind.key,
    label: ind.label,
    type: ind.type,
    total: m.total[ind.key],
    cells: m.cells[ind.key]
  }))
}

/** ===================== 产品分时对比 ===================== */

/** 参与对比的日期 */
export interface ContrastDate {
  /** YYYY-MM-DD */
  date: string
  /** 展示名：今日 / 上周同日 / 具体日期 */
  dateStr: string
}

/** 单个对比日期的分时数据 */
export interface ContrastRow {
  date: string
  dateStr: string
  /** 每个小时的销量（长度 24） */
  hours: number[]
  /** 每个小时的广告花费（长度 24，$） */
  costs: number[]
  /** 截至每个小时的累计销量（长度 24） */
  cumulative: number[]
}

/** 以 endDate 为「今日」，向前推 count-1 天，生成默认对比日期（最近 count 天） */
export function genRecentDates(endDate: string, count = 8): ContrastDate[] {
  const base = endDate ? new Date(endDate) : new Date()
  const list: ContrastDate[] = []
  for (let i = 0; i < count; i++) {
    const d = new Date(base.getTime() - i * 86400000)
    const dateText = d.toISOString().slice(0, 10)
    let label = dateText
    if (i === 0) label = '今日'
    else if (i === count - 1) label = '上周同日'
    list.push({ date: dateText, dateStr: label })
  }
  return list
}

/** 根据对比日期生成分时对比数据 */
export function genHourContrast(dates: ContrastDate[]): ContrastRow[] {
  return dates.map((d) => {
    let plus = 0
    const hours: number[] = []
    const costs: number[] = []
    const cumulative: number[] = []
    for (let h = 0; h < 24; h++) {
      const orders = rand(0, 35)
      const cost = round2(orders * rand(2, 8) + Math.random())
      plus += orders
      hours.push(orders)
      costs.push(cost)
      cumulative.push(plus)
    }
    return { date: d.date, dateStr: d.dateStr, hours, costs, cumulative }
  })
}

/** ===================== 后端 VO → 前端行 转换 ===================== */

const toNum = (v: unknown): number | null =>
  v === null || v === undefined || v === '' ? null : Number(v)
const ratioFrac = (a: number, b: number): number | null => (b ? a / b : null)

/** 按汇总指标 key 从一组 metrics 取值（比率为小数，调用方按需 ×100） */
const pickSummary = (key: string, m: SalesAdMetrics): number | null => {
  switch (key) {
    case 'totalOrders':
      return toNum(m.totalOrderQty)
    case 'normalOrders':
      return toNum(m.naturalOrderQty)
    case 'advertOrders':
      return toNum(m.adOrderQty)
    case 'normalRatio':
      return ratioFrac(toNum(m.naturalOrderQty) ?? 0, toNum(m.totalOrderQty) ?? 0)
    case 'advertRatio':
      return toNum(m.adOrderRatio)
    case 'cpc':
      return toNum(m.cpc)
    case 'impressions':
      return toNum(m.adImpressions)
    case 'clicks':
      return toNum(m.adClicks)
    case 'ctr':
      return toNum(m.ctr)
    case 'cr':
      return toNum(m.adConversionRate)
    case 'cost':
      return toNum(m.adCost)
    case 'acos':
      return toNum(m.acos)
    default:
      return null
  }
}

/** 汇总 0-23 小时原子量，重算比率，得到全天汇总 metrics（口径与后端一致） */
// const aggregateMetrics = (list: SalesAdMetrics[]): SalesAdMetrics => {
//   const sum = (f: keyof SalesAdMetrics): number =>
//     list.reduce((acc, m) => acc + (toNum(m[f]) ?? 0), 0)
//   const totalOrderQty = sum('totalOrderQty')
//   const adOrderQty = sum('adOrderQty')
//   const adClicks = sum('adClicks')
//   const adImpressions = sum('adImpressions')
//   const adCost = sum('adCost')
//   const sessions = sum('sessions')
//   const adSalesAmt = sum('adSalesAmt')
//   return {
//     totalOrderQty,
//     naturalOrderQty: sum('naturalOrderQty'),
//     adOrderQty,
//     adClicks,
//     adImpressions,
//     adCost,
//     sessions,
//     adSalesAmt,
//     adOrderRatio: ratioFrac(adOrderQty, totalOrderQty),
//     ctr: ratioFrac(adClicks, adImpressions),
//     adConversionRate: ratioFrac(adOrderQty, adClicks),
//     acos: ratioFrac(adCost, adSalesAmt),
//     cpc: adClicks ? round2(adCost / adClicks) : null
//   }
// }

/** 分时汇总 VO → 转置行（指标为行，含全天汇总值与 24 小时单元格） */
export function voToSummaryRows(vo: AsinHourSummaryVo): SummaryRow[] {
  const hours = vo?.hours || []
  // 保留「该小时是否有数据」的区分：未返回则为 undefined，不再用 {} 兜底
  const byHour = Array.from({ length: 24 }, (_, h) => hours.find((x) => x.hour === h))
  // 「汇总/时区」列优先取接口返回的 total 对象；接口未返回时前端按小时聚合兜底
  const agg = vo?.total ?? {}
  return SUMMARY_INDICATORS.map((ind) => {
    const isPct = ind.type === 'percent'
    const scale = (v: number | null): number | null =>
      v === null ? null : round2(isPct ? v * 100 : v)
    let prev: number | null = null
    const cells: SummaryCell[] = byHour.map((entry) => {
      // 该小时接口未返回数据 → 单元格留空，不填默认值 0
      if (!entry) return { value: null, cumulative: null, growth: 0, empty: true }
      const value = scale(pickSummary(ind.key, entry.metrics || {}))
      const growth = prev === null || value === null ? 0 : round2(value - prev)
      prev = value
      return { value, cumulative: value, growth }
    })
    return {
      key: ind.key,
      label: ind.label,
      type: ind.type,
      total: scale(pickSummary(ind.key, agg)),
      cells
    }
  })
}

/** 分时对比 VO → 各日期分时行（销量可加，按单位口径取值并在前端求累计） */
export function voToContrastRows(vo: AsinHourCompareVo, dates: ContrastDate[]): ContrastRow[] {
  const series = vo?.series || []
  return dates.map((d) => {
    const hourList = series.find((s) => s.date === d.date)?.hours || []
    const byHour: SalesAdMetrics[] = Array.from(
      { length: 24 },
      (_, h) => hourList.find((x) => x.hour === h)?.metrics || {}
    )
    let plus = 0
    const hoursArr: number[] = []
    const costs: number[] = []
    const cumulative: number[] = []
    byHour.forEach((m) => {
      const sales = toNum(m.totalSalesQty) ?? 0
      plus += sales
      hoursArr.push(sales)
      costs.push(round2(toNum(m.adCost) ?? 0))
      cumulative.push(plus)
    })
    return { date: d.date, dateStr: d.dateStr, hours: hoursArr, costs, cumulative }
  })
}
