/** SKU 综合成本趋势分析数据适配（弹窗专用） */
import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isoWeek from 'dayjs/plugin/isoWeek'
import type { SkuFifoBatchRow, SkuFifoStats } from './types'
import { skuCostTrendAnalysis } from '@/api/finance/sku-cost'

dayjs.extend(customParseFormat)
dayjs.extend(isoWeek)

/** trend-analysis 默认查询指标集合 */
const TREND_METRIC_LIST = [
  'unitTotalCost',
  'unitPurchaseCost',
  'unitLogisticsCost',
  'stockQty',
  'stockValue'
]

/** 周期类型：日/周/月 */
export type TrendPeriod = 'day' | 'week' | 'month'

/** 5 个可选指标 key（前 4 类金额 + 库存数量） */
export type TrendMetricKey =
  | 'unitCost' // 单位综合成本（金额，折线）
  | 'purchaseCost' // 采购成本（金额，折线）
  | 'freightCost' // 头程成本（金额，折线）
  | 'stockQty' // 库存数量（数量，柱状）
  | 'stockValue' // 库存价值（金额，折线）

export interface TrendMetricOption {
  key: TrendMetricKey
  label: string
  color: string
  /** 'line' | 'bar' */
  chartType: 'line' | 'bar'
  /** 金额 / 数量；用于格式化和 y 轴 */
  unit: 'money' | 'qty'
}

export const TREND_METRIC_OPTIONS: TrendMetricOption[] = [
  { key: 'unitCost', label: '单位综合成本', color: '#7c5cff', chartType: 'line', unit: 'money' },
  { key: 'purchaseCost', label: '采购成本', color: '#4abeff', chartType: 'line', unit: 'money' },
  { key: 'freightCost', label: '头程成本', color: '#ffaf20', chartType: 'line', unit: 'money' },
  { key: 'stockQty', label: '库存数量', color: '#4abeff', chartType: 'bar', unit: 'qty' },
  { key: 'stockValue', label: '库存价值', color: '#14deba', chartType: 'bar', unit: 'money' }
]

/** 单点：某个周期标签对应的所有指标值 */
export interface TrendPoint {
  label: string
  /** key → value，缺失则为 null */
  metrics: Partial<Record<TrendMetricKey, number | null>>
}

/** 在库批次占比图项 */
export interface DonutItem {
  /** 批次号尾段，如 "01" */
  shortNo: string
  /** 完整批次号 */
  batchNo: string
  /** 状态：消耗中 / 待消耗 / 已耗尽 */
  status: SkuFifoBatchRow['status']
  statusLabel: string
  /** 该批次综合金额 = 剩余数量 × 单位综合成本 */
  amount: number
  /** 占整 SKU 总成本比例（百分比，1 位小数） */
  ratio: number
}

export interface TrendDetailData {
  productCode: string
  summary: SkuFifoStats
  /** 主图周期点（按时间正序） */
  points: TrendPoint[]
  /** 环形图：在库批次占比 */
  donutItems: DonutItem[]
  /** 环形中心：SKU 总成本（amount 累加） */
  skuTotal: number
}

const round2 = (n: number) => Math.round(n * 100) / 100

/** 将接口批次状态（partial/active/cleared）映射为前端状态与展示文案 */
function resolveBatchStatus(apiStatus?: string): {
  status: SkuFifoBatchRow['status']
  statusLabel: string
} {
  if (apiStatus === 'partial') return { status: 'consuming', statusLabel: '消耗中' }
  if (apiStatus === 'active') return { status: 'pending', statusLabel: '待消耗' }
  if (apiStatus === 'cleared') return { status: 'consumed', statusLabel: '已耗尽' }
  return { status: 'pending', statusLabel: '在库' }
}

/** 将 YYYY-MM-DD 日期按周期格式化为接口传参：日 YYYY-MM-DD / 月 YYYY-MM / 周 GGGG-Www */
function formatApiDate(dateStr: string, period: TrendPeriod): string {
  const d = dayjs(dateStr)
  if (!d.isValid()) return dateStr
  if (period === 'week') return `${d.isoWeekYear()}-W${String(d.isoWeek()).padStart(2, '0')}`
  if (period === 'month') return d.format('YYYY-MM')
  return d.format('YYYY-MM-DD')
}

/** 默认时间范围：近 7 个周期（日=近7日 / 周=近7周 / 月=近7月，含当前周期） */
export function getDefaultRange(
  period: TrendPeriod,
  baseDate: Date = new Date()
): [string, string] {
  const base = dayjs(baseDate)
  if (period === 'week') {
    return [
      base.subtract(6, 'week').startOf('isoWeek').format('YYYY-MM-DD'),
      base.endOf('isoWeek').format('YYYY-MM-DD')
    ]
  }
  if (period === 'month') {
    return [
      base.subtract(6, 'month').startOf('month').format('YYYY-MM-DD'),
      base.endOf('month').format('YYYY-MM-DD')
    ]
  }
  return [base.subtract(6, 'day').format('YYYY-MM-DD'), base.format('YYYY-MM-DD')]
}

/** 生成趋势详情数据 */
export async function fetchSkuTrendDetail(
  sku: string,
  period: TrendPeriod,
  range: [string, string]
): Promise<TrendDetailData> {
  const [fromStr, toStr] = range
  const res: any = await skuCostTrendAnalysis({
    skuCode: sku,
    period,
    dateStart: formatApiDate(fromStr, period),
    dateEnd: formatApiDate(toStr, period),
    metricList: TREND_METRIC_LIST
  })
  const data = res.data || {}
  const labels: string[] = data.periodLabels || []
  const series = data.series || {}
  const points: TrendPoint[] = labels.map((label, i) => ({
    label,
    metrics: {
      unitCost: series.unitTotalCost?.[i] ?? null,
      purchaseCost: series.unitPurchaseCost?.[i] ?? null,
      freightCost: series.unitLogisticsCost?.[i] ?? null,
      stockQty: series.stockQty?.[i] ?? null,
      stockValue: series.stockValue?.[i] ?? null
    }
  }))
  const summaryData = data.kpis || {}
  const summary: SkuFifoStats = {
    activeBatches: data.batchShares?.length || 0,
    cumulativeInbound: summaryData.totalInQty || 0,
    remainingStock: summaryData.currentStockQty || 0,
    stockValue: summaryData.stockValue || 0,
    weightedAvgCost: summaryData.weightedAvgCost || 0
  }
  const { donutItems, skuTotal } = buildDonutFromData(data)
  return {
    productCode: sku,
    summary,
    points,
    donutItems,
    skuTotal
  }
}

/** 从 trend-analysis 返回数据构建环形图项与 SKU 总成本（在库批次占比） */
function buildDonutFromData(data: any): { donutItems: DonutItem[]; skuTotal: number } {
  const donutItems: DonutItem[] = (data?.batchShares || []).map((item: any) => {
    const { status, statusLabel } = resolveBatchStatus(item.status ?? item.batchStatus)
    return {
      shortNo: String(item.batchSeq ?? '').padStart(2, '0'),
      batchNo: item.fifoBatchNo,
      status,
      statusLabel,
      amount: item.batchRemainValue || 0,
      ratio: round2((item.ratio || 0) * 100)
    }
  })
  const skuTotal = round2(donutItems.reduce((s, it) => s + it.amount, 0))
  return { donutItems, skuTotal }
}

/** 将单个周期标签还原为该周期的起止日期 [YYYY-MM-DD, YYYY-MM-DD] */
export function periodLabelToRange(label: string, period: TrendPeriod): [string, string] | null {
  if (!label) return null
  if (period === 'week') {
    // 标签形如 2026-W23 / 2026-W5；dayjs 的 customParseFormat 解析不了 ISO 周 token，
    // 改用 "当年 1 月 4 日所在 ISO 周 + (week-1) 周" 还原（ISO 第 1 周必含 1 月 4 日）
    const m = label.match(/^(\d{4})-W(\d{1,2})$/i)
    if (!m) return null
    const start = dayjs(`${m[1]}-01-04`)
      .startOf('isoWeek')
      .add(Number(m[2]) - 1, 'week')
    if (!start.isValid()) return null
    return [start.format('YYYY-MM-DD'), start.endOf('isoWeek').format('YYYY-MM-DD')]
  }
  if (period === 'month') {
    const m = dayjs(label, 'YYYY-MM', true)
    if (!m.isValid()) return null
    return [m.startOf('month').format('YYYY-MM-DD'), m.endOf('month').format('YYYY-MM-DD')]
  }
  const d = dayjs(label)
  if (!d.isValid()) return null
  return [d.format('YYYY-MM-DD'), d.format('YYYY-MM-DD')]
}

/**
 * 查询单个时间点的在库批次占比（方案A：用该周期的日期范围重新请求接口）
 * @returns 该时间点的环形图项与 SKU 总成本；标签无法解析时返回空
 */
export async function fetchSkuBatchSharesAt(
  sku: string,
  period: TrendPeriod,
  label: string
): Promise<{ donutItems: DonutItem[]; skuTotal: number }> {
  const range = periodLabelToRange(label, period)
  if (!range) return { donutItems: [], skuTotal: 0 }
  const res: any = await skuCostTrendAnalysis({
    skuCode: sku,
    period,
    dateStart: formatApiDate(range[0], period),
    dateEnd: formatApiDate(range[1], period),
    metricList: TREND_METRIC_LIST
  })
  return buildDonutFromData(res.data || {})
}
