/**
 * 销量统计页（sale-analysis/sale-statics）Mock 数据。
 *
 * 依据 src/api/sale/sales-statistics.ts 中的 TS 接口生成；这些接口经过 unwrap 只取 data，
 * 因此生成器返回的即为最终业务对象。
 */
import dayjs from 'dayjs'

const round2 = (n: number) => Math.round(n * 100) / 100
const rand = (seed: number) => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

/** 概况指标卡池（销量维度） */
const SALES_METRIC_DEFS: Array<{ metric: string; label: string; base: number }> = [
  { metric: 'sales', label: '销量', base: 12800 },
  { metric: 'revenue', label: '销售额', base: 458000 },
  { metric: 'order', label: '订单量', base: 9600 },
  { metric: 'naturalSales', label: '自然销量', base: 7200 },
  { metric: 'adSales', label: '广告销量', base: 4100 },
  { metric: 'return', label: '退货量', base: 320 }
]

/** 概况指标卡池（广告维度） */
const AD_METRIC_DEFS: Array<{ metric: string; label: string; base: number }> = [
  { metric: 'adCost', label: '广告花费', base: 68000 },
  { metric: 'acos', label: 'ACOS', base: 0.18 },
  { metric: 'roas', label: 'ROAS', base: 5.4 },
  { metric: 'adImpressions', label: '广告曝光', base: 1250000 },
  { metric: 'adClicks', label: '广告点击', base: 32000 },
  { metric: 'cpc', label: 'CPC', base: 2.1 }
]

function buildMetricCard(def: { metric: string; label: string; base: number }, i: number) {
  const v = round2(def.base * (0.9 + rand(i + 1) * 0.2))
  const sc = round2(v * 0.6)
  const vc = round2(v - sc)
  return {
    metric: def.metric,
    label: def.label,
    value: v,
    wowRate: round2((rand(i + 2) - 0.5) * 0.3),
    yoyRate: round2((rand(i + 3) - 0.5) * 0.4),
    scValue: sc,
    vcValue: vc,
    scRatio: round2(sc / v),
    vcRatio: round2(vc / v),
    yesterdayValue: round2(v / 30),
    last7Value: round2((v / 30) * 7)
  }
}

export function salesOverview(params: Record<string, any>) {
  const channel = params.channel || 'combined'
  const today = dayjs()
  return {
    channel,
    dateStart: today.format('YYYY-MM-DD'),
    dateEnd: today.format('YYYY-MM-DD'),
    salesMetrics: SALES_METRIC_DEFS.map(buildMetricCard),
    adMetrics: AD_METRIC_DEFS.map((d, i) => buildMetricCard(d, i + 100))
  }
}

export function salesMetricPool(params: Record<string, any>) {
  const channel = params.channel || 'combined'
  return {
    channel,
    salesMetrics: SALES_METRIC_DEFS.map((d) => ({ metric: d.metric, label: d.label })),
    adMetrics: AD_METRIC_DEFS.map((d) => ({ metric: d.metric, label: d.label }))
  }
}

function periodBuckets(granularity: string, count = 7) {
  const unit = granularity === 'day' ? 'day' : granularity === 'week' ? 'week' : 'month'
  return Array.from({ length: count }, (_, i) => {
    const d = dayjs().subtract(count - 1 - i, unit)
    const fmt =
      unit === 'day' ? 'YYYY-MM-DD' : unit === 'week' ? 'GGGG-[W]WW' : 'YYYY-MM'
    return {
      key: `p${i}`,
      label: d.format(fmt),
      subLabel: '',
      dateStart: d.startOf(unit).format('YYYY-MM-DD'),
      dateEnd: d.endOf(unit).format('YYYY-MM-DD')
    }
  })
}

export function salesTrend(params: Record<string, any>) {
  const channel = params.channel || 'combined'
  const granularity = params.granularity || 'day'
  const cols = periodBuckets(granularity)
  const metrics: string[] = params.metrics?.length
    ? params.metrics
    : ['sales', 'naturalSales', 'adSales']
  const labelMap: Record<string, string> = {
    sales: '销量',
    naturalSales: '自然销量',
    adSales: '广告销量',
    revenue: '销售额',
    order: '订单量'
  }
  const series = metrics.map((metric, mi) => {
    const values = cols.map((_, i) => Math.round(2000 * (0.8 + rand(mi * 10 + i) * 0.6)))
    const max = Math.max(...values, 1)
    const min = Math.min(...values)
    const normalizedValues = values.map((v) =>
      max === min ? 100 : round2(((v - min) / (max - min)) * 100)
    )
    return {
      metric,
      label: labelMap[metric] || metric,
      values,
      normalizedValues
    }
  })
  return {
    channel,
    granularity,
    dateStart: cols[0].dateStart,
    dateEnd: cols[cols.length - 1].dateEnd,
    columns: cols,
    series
  }
}

export function salesDetail(params: Record<string, any>) {
  const dimension = params.dimension || 'asin'
  const metric = params.metric || 'sales'
  const period = params.period || 'day'
  const pageNo = Number(params.pageNo ?? 1)
  const pageSize = Number(params.pageSize ?? 20)
  const dynamicColumns = periodBuckets(period)
  const columns = [dimension, 'name', 'total', ...dynamicColumns.map((c) => c.key)]

  const total = 24
  const allRows = Array.from({ length: total }, (_, i) => {
    const row: Record<string, unknown> = {
      [dimension]: `${dimension.toUpperCase()}-${String(1000 + i)}`,
      name: `示例商品 ${i + 1}`,
      hasChildren: false
    }
    let sum = 0
    dynamicColumns.forEach((c, ci) => {
      const val = Math.round(500 * (0.6 + rand(i * 7 + ci) * 0.8))
      row[c.key] = val
      sum += val
    })
    row.total = sum
    row.metric = metric
    return row
  })

  const start = (pageNo - 1) * pageSize
  const rows = allRows.slice(start, start + pageSize)

  const summary: Record<string, unknown> = { [dimension]: '合计', name: '', total: 0 }
  dynamicColumns.forEach((c) => {
    summary[c.key] = allRows.reduce((s, r) => s + (r[c.key] as number), 0)
  })
  summary.total = allRows.reduce((s, r) => s + (r.total as number), 0)

  return { total, columns, dynamicColumns, rows, summary }
}

/* ===================== ASIN 看板（最小实现，字段兼容两套定义） ===================== */

const EMPTY_METRICS = { totalSalesQty: 0, totalSalesAmt: 0, adCost: 0, adSalesQty: 0 }

export function asinDailyStatistics(params: Record<string, any>) {
  const asin = params.asin || 'B000MOCK'
  const grain = params.grain || 'day'
  // 以 asin 字符码之和为种子，保证同一请求结果稳定（避免刷新抖动）
  const asinSeed = String(asin)
    .split('')
    .reduce((s, ch) => s + ch.charCodeAt(0), 0)
  const periods = periodBuckets(grain).map((c, i) => ({
    bucket: c.label,
    label: c.label,
    weekInfo: {},
    metrics: {
      ...EMPTY_METRICS,
      totalSalesQty: Math.round(200 * (0.7 + rand(asinSeed + i) * 0.6))
    }
  }))
  return { asin, grain, periods }
}

export function asinHourSummary(params: Record<string, any>) {
  const asin = params.asin || 'B000MOCK'
  const hours = Array.from({ length: 24 }, (_, h) => ({
    hour: h,
    metrics: { ...EMPTY_METRICS, totalSalesQty: Math.round(rand(h + 1) * 40) }
  }))
  return {
    asin,
    statDate: dayjs().format('YYYY-MM-DD'),
    mode: params.mode || 'unit',
    hours,
    total: { ...EMPTY_METRICS }
  }
}

export function asinHourCompare(params: Record<string, any>) {
  const asin = params.asin || 'B000MOCK'
  const dates = (params.compareDates?.length ? params.compareDates : [dayjs().format('YYYY-MM-DD')]).map(
    (date: string) => ({
      date,
      hours: Array.from({ length: 24 }, (_, h) => ({
        hour: h,
        metrics: { ...EMPTY_METRICS, totalSalesQty: Math.round(rand(h + 2) * 40) }
      }))
    })
  )
  return { asin, statDate: dayjs().format('YYYY-MM-DD'), mode: params.mode || 'unit', dates, series: dates }
}
