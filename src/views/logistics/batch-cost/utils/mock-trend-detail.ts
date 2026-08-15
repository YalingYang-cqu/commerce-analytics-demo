/* eslint-disable @typescript-eslint/no-unused-vars */
import type { BatchCostRow, DimensionType, MetricType } from './mock-data'
import { findMockProductBySku } from './mock-data'
import { getChartPeriodLabels } from './period'
import { logisticsCostTrendAnalysis } from '@/api/logistics/batch-cost'

export type TrendDetailMetricKey = MetricType

export interface SupplierMonthMetrics {
  quantity: number
  totalPrice: number
  /** 单件成本：null 表示该渠道当月无数据（图表需断点，不可当 0 处理） */
  unitCost: number | null
}

export interface TrendDetailMonth {
  label: string
  suppliers: Record<string, SupplierMonthMetrics>
  total: SupplierMonthMetrics
}

export interface TrendDetailSummary {
  totalQuantity: number
  totalAmount: number
  weightedAvgPrice: number
  amountRingRatio: number | null
  dominantChannel: { name: string; ratio: number }
  channelCount: number
}

export interface TrendDetailData {
  productCode: string
  logisticsManager: string
  suppliers: string[]
  months: TrendDetailMonth[]
  summary: TrendDetailSummary
  /** 总体渠道占比（来自接口 channelShares），供右侧环形图「近12个月」总体分布直接渲染 */
  channelShares?: { name: string; amount: number; ratio: number }[]
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function hashSeed(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function buildMonthsForProduct(
  sku: string,
  baseUnitCost: number,
  baseQuantity: number,
  channelNames: string[]
): TrendDetailMonth[] {
  const labels = getChartPeriodLabels('month', 12)
  const seed = hashSeed(sku)

  return labels.map((label, monthIdx) => {
    const suppliers: Record<string, SupplierMonthMetrics> = {}
    let totalQty = 0
    let totalAmount = 0

    channelNames.forEach((name, supIdx) => {
      const factor = 0.88 + ((seed + monthIdx * 3 + supIdx * 7) % 24) / 100
      const qty = Math.round(
        baseQuantity * (0.06 + supIdx * 0.02) * factor * (1 + (monthIdx % 4) * 0.05)
      )
      const unitCost = round2(baseUnitCost * (0.92 + ((seed + supIdx) % 18) / 100) * factor)
      const totalPrice = round2(unitCost * qty)
      suppliers[name] = { quantity: qty, totalPrice, unitCost }
      totalQty += qty
      totalAmount += totalPrice
    })

    const unitCost = totalQty > 0 ? round2(totalAmount / totalQty) : 0
    return {
      label,
      suppliers,
      total: { quantity: totalQty, totalPrice: round2(totalAmount), unitCost }
    }
  })
}

function calcSummary(months: TrendDetailMonth[], suppliers: string[]): TrendDetailSummary {
  const totalQuantity = months.reduce((s, m) => s + m.total.quantity, 0)
  const totalAmount = round2(months.reduce((s, m) => s + m.total.totalPrice, 0))
  const weightedAvgPrice = totalQuantity > 0 ? round2(totalAmount / totalQuantity) : 0

  const amountByChannel = new Map<string, number>()
  months.forEach((m) => {
    suppliers.forEach((name) => {
      const amt = m.suppliers[name]?.totalPrice ?? 0
      amountByChannel.set(name, (amountByChannel.get(name) || 0) + amt)
    })
  })

  let dominantName = suppliers[0] || '—'
  let dominantAmount = 0
  amountByChannel.forEach((amt, name) => {
    if (amt > dominantAmount) {
      dominantAmount = amt
      dominantName = name
    }
  })
  const dominantRatio = totalAmount > 0 ? round2((dominantAmount / totalAmount) * 100) : 0

  const lastMonth = months[months.length - 1]
  const prevMonth = months[months.length - 2]
  let amountRingRatio: number | null = null
  if (lastMonth && prevMonth && prevMonth.total.totalPrice !== 0) {
    amountRingRatio = round2(
      ((lastMonth.total.totalPrice - prevMonth.total.totalPrice) / prevMonth.total.totalPrice) * 100
    )
  }

  return {
    totalQuantity,
    totalAmount,
    weightedAvgPrice,
    amountRingRatio,
    dominantChannel: { name: dominantName, ratio: dominantRatio },
    channelCount: suppliers.length
  }
}

export interface TrendDetailQuery {
  /** 统计周期，取页面查询的 period */
  period: string
  /** 出货时间起，取页面查询的 shipTimeStart */
  shipTimeStart: string | null
  /** 出货时间止，取页面查询的 shipTimeEnd */
  shipTimeEnd: string | null
}

/**
 * 由「总览」响应构建右侧概览数据（汇总卡 + 占比环图 + 点月份分布）。
 * 单次请求即可，不依赖 compareSeries（每渠道每月按 channelShares 占比拆分总量得到）。
 */
function buildOverview(
  totalData: any,
  code: string,
  product: BatchCostRow,
  uniqueSuppliers: string[]
): TrendDetailData {
  const labels: string[] = totalData.periodLabels || []
  const shares = totalData.channelShares || []
  const shareMap = new Map<string, number>(
    shares.map((item: any) => [item.channelName, item.ratio || 0])
  )
  const quantitySeries = totalData.series?.quantity || []
  const amountSeries = totalData.series?.totalLogisticsCost || []
  const unitSeries = totalData.series?.unitLogisticsCost || []
  const months: TrendDetailMonth[] = labels.map((label, index) => {
    const suppliers: Record<string, SupplierMonthMetrics> = {}
    let totalQty = 0
    let totalAmount = 0
    uniqueSuppliers.forEach((name) => {
      const ratio = shareMap.get(name) || (uniqueSuppliers.length ? 1 / uniqueSuppliers.length : 0)
      const quantity = Math.round((quantitySeries[index] || 0) * ratio)
      const totalPrice = round2((amountSeries[index] || 0) * ratio)
      const unitCost = unitSeries[index] ?? null
      suppliers[name] = { quantity, totalPrice, unitCost }
      totalQty += quantity
      totalAmount += totalPrice
    })
    return {
      label,
      suppliers,
      total: {
        quantity: quantitySeries[index] || totalQty,
        totalPrice: amountSeries[index] || round2(totalAmount),
        unitCost: unitSeries[index] || 0
      }
    }
  })

  // 总体渠道占比：直接取接口 channelShares 的总成本，环形图「近12个月」用它渲染
  const shareTotal =
    shares.reduce((s: number, item: any) => s + (item.totalLogisticsCost || 0), 0) || 1
  const channelShares = shares
    .map((item: any) => {
      const amount = round2(item.totalLogisticsCost || 0)
      return {
        name: item.channelName,
        amount,
        ratio: round2((amount / shareTotal) * 100)
      }
    })
    .filter((item: { amount: number }) => item.amount > 0)
    .sort((a: { amount: number }, b: { amount: number }) => b.amount - a.amount)

  return {
    productCode: code,
    logisticsManager: product.logisticsManager,
    suppliers: uniqueSuppliers,
    months,
    channelShares,
    summary: {
      totalQuantity: totalData.kpis?.currentQuantity || 0,
      totalAmount: totalData.kpis?.currentTotalLogisticsCost || 0,
      weightedAvgPrice: totalData.kpis?.currentUnitLogisticsCost || 0,
      amountRingRatio:
        totalData.kpis?.totalLogisticsCostRingRatio == null
          ? null
          : round2(totalData.kpis.totalLogisticsCostRingRatio * 100),
      dominantChannel: {
        name: totalData.kpis?.dominantChannelName || uniqueSuppliers[0] || '—',
        ratio: round2((totalData.kpis?.dominantChannelRatio || 0) * 100)
      },
      channelCount: uniqueSuppliers.length
    }
  }
}

/** 指标键 → 接口字段名 */
const METRIC_API_KEY: Record<TrendDetailMetricKey, string> = {
  unitCost: 'unitLogisticsCost',
  quantity: 'quantity',
  totalPrice: 'totalLogisticsCost'
}

export interface TrendChartQuery extends TrendDetailQuery {
  /** 物流渠道列表：["全部"] 或具体渠道名数组（长度=1 取 series，>1 取 compareSeries） */
  channels: string[]
  /** 选中的指标键 */
  metricKeys: TrendDetailMetricKey[]
}

/**
 * 由趋势响应构建左侧主图数据。
 * channels 长度=1（"全部"或单渠道）取 series 聚合；长度>1 取 compareSeries 按渠道对比。
 * 返回 TrendDetailData（仅供主图用，summary 为占位）。
 */
function buildChartData(
  data: any,
  channels: string[],
  metricKeys: TrendDetailMetricKey[],
  code: string,
  logisticsManager: string
): TrendDetailData {
  const labels: string[] = data.periodLabels || []
  const seriesObj = data.series || {}
  const useCompare = channels.length > 1
  const getSeries = (key: string): Array<number | null> => seriesObj[key] || []

  const months: TrendDetailMonth[] = labels.map((label, index) => {
    const suppliers: Record<string, SupplierMonthMetrics> = {}
    if (useCompare) {
      // 多渠道：取 compareSeries（多渠道仅在单指标场景出现）
      const metricKey = metricKeys[0] ?? 'unitCost'
      const apiKey = METRIC_API_KEY[metricKey]
      const compareList: any[] = data.compareSeries || []
      channels.forEach((name) => {
        const item = compareList.find(
          (c) => c.channelName === name && (c.metric ? c.metric === apiKey : true)
        )
        const v = (item?.values || [])[index]
        suppliers[name] = {
          quantity: metricKey === 'quantity' ? (v ?? 0) : 0,
          totalPrice: metricKey === 'totalPrice' ? (v ?? 0) : 0,
          unitCost: metricKey === 'unitCost' ? (v ?? null) : null
        }
      })
    } else {
      // 单渠道/全部：取 series 聚合
      const name = channels[0] ?? '全部'
      suppliers[name] = {
        quantity: getSeries('quantity')[index] ?? 0,
        totalPrice: getSeries('totalLogisticsCost')[index] ?? 0,
        unitCost: getSeries('unitLogisticsCost')[index] ?? null
      }
    }
    return {
      label,
      suppliers,
      total: {
        quantity: getSeries('quantity')[index] ?? 0,
        totalPrice: getSeries('totalLogisticsCost')[index] ?? 0,
        unitCost: getSeries('unitLogisticsCost')[index] ?? null
      }
    }
  })

  const suppliers = useCompare ? [...channels] : [channels[0] ?? '全部']
  return {
    productCode: data.code || code,
    logisticsManager,
    suppliers,
    months,
    summary: {
      totalQuantity: 0,
      totalAmount: 0,
      weightedAvgPrice: 0,
      amountRingRatio: null,
      dominantChannel: { name: suppliers[0] || '—', ratio: 0 },
      channelCount: suppliers.length
    }
  }
}

/**
 * 打开弹窗：单次请求（channels=[] 全量、全指标），同时构建：
 *  - 右侧概览（汇总卡 + 占比环图 + 点月份分布）
 *  - 左侧默认主图（"全部"聚合单价线）
 */
export async function fetchTrendInit(
  product: BatchCostRow,
  dimension: DimensionType,
  query: TrendDetailQuery
): Promise<{ overview: TrendDetailData; chart: TrendDetailData }> {
  const code = dimension === 'sku' ? product.sku : product.spu
  const channelNames = product.latestCosts.map((c) => c.channelName)
  const uniqueSuppliers = [...new Set(channelNames)]
  const res: any = await logisticsCostTrendAnalysis({
    dimension,
    code,
    period: query.period,
    shipTimeStart: query.shipTimeStart,
    shipTimeEnd: query.shipTimeEnd,
    metricList: ['unitLogisticsCost'],
    logisticsChannelNameList: []
  })
  const data = res.data || {}
  return {
    overview: buildOverview(data, code, product, uniqueSuppliers),
    chart: buildChartData(data, ['全部'], ['unitCost'], code, product.logisticsManager)
  }
}

/**
 * 左侧主图数据：单次请求（渠道/指标变化时调用）。
 * channels 长度=1 取 series 聚合；长度>1 取 compareSeries 按渠道对比。
 */
export async function fetchTrendChart(
  product: BatchCostRow,
  dimension: DimensionType,
  query: TrendChartQuery
): Promise<TrendDetailData> {
  const code = dimension === 'sku' ? product.sku : product.spu
  const metricList = query.metricKeys.map((k) => METRIC_API_KEY[k])
  const res: any = await logisticsCostTrendAnalysis({
    dimension,
    code,
    period: query.period,
    shipTimeStart: query.shipTimeStart,
    shipTimeEnd: query.shipTimeEnd,
    metricList,
    logisticsChannelNameList: query.channels
  })
  return buildChartData(
    res.data || {},
    query.channels,
    query.metricKeys,
    code,
    product.logisticsManager
  )
}

/** 按月份或 12 个月汇总物流渠道头程成本占比 */
export function getSupplierAmountDistribution(
  data: TrendDetailData,
  monthLabel: string | null
): { name: string; amount: number; ratio: number }[] {
  const { suppliers, months, summary } = data

  // 总体分布（未选月份）：优先用接口 channelShares，避免依赖按月拆分的 totalPrice
  if (!monthLabel && data.channelShares?.length) {
    return data.channelShares
  }

  const amountMap = new Map<string, number>()

  if (monthLabel) {
    const month = months.find((m) => m.label === monthLabel)
    if (!month) return []
    suppliers.forEach((name) => {
      amountMap.set(name, month.suppliers[name]?.totalPrice ?? 0)
    })
  } else {
    months.forEach((m) => {
      suppliers.forEach((name) => {
        amountMap.set(name, (amountMap.get(name) || 0) + (m.suppliers[name]?.totalPrice ?? 0))
      })
    })
  }

  const total = [...amountMap.values()].reduce((s, v) => s + v, 0) || summary.totalAmount || 1
  return suppliers
    .map((name) => {
      const amount = round2(amountMap.get(name) || 0)
      return {
        name,
        amount,
        ratio: round2((amount / total) * 100)
      }
    })
    .filter((item) => item.amount > 0)
    .sort((a, b) => b.amount - a.amount)
}

export const TREND_METRIC_OPTIONS: { key: TrendDetailMetricKey; label: string; color: string }[] = [
  { key: 'unitCost', label: '单个头程成本', color: '#9254de' },
  { key: 'quantity', label: '发货数量', color: '#5b8ff9' },
  { key: 'totalPrice', label: '头程总成本', color: '#5ad8a6' }
]
