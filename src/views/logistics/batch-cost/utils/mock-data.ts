import dayjs from 'dayjs'
import type { PeriodType } from './period'
import { getChartPeriodLabels, getRecentPeriodLabels } from './period'

export type DimensionType = 'sku' | 'spu'
export type MetricType = 'unitCost' | 'quantity' | 'totalPrice'

export interface LatestCostItem {
  channelName: string
  price: number
  change: number
  changeDate: string
}

export interface PeriodCell {
  value: number | null
  ringRatio: number | null
}

export interface TrendPoint {
  label: string
  value: number | null
}

export interface BatchCostRow {
  id: string
  imageUrl: string
  sku: string
  spu: string
  logisticsManager: string
  /** 用于「最新头程成本」列排序（取各渠道展示价中的最小值） */
  latestCostPrice: number
  latestCosts: LatestCostItem[]
  trendData: TrendPoint[]
  periodDetails: Record<string, PeriodCell>
}

/** 固定演示商品（与设计稿风格一致） */
interface MockProductSeed {
  sku: string
  spu: string
  spuName: string
  logisticsManager: string
  imageSeed: string
  /** 含税单价基准（元） */
  baseUnitCost: number
  /** 月发货量基准（用于数量/总价指标） */
  baseQuantity: number
  latestCosts: Array<{
    channelName: string
    price: number
    change: number
    daysAgo: number
  }>
  /** 近 7 期单价系数（从旧到新，共 7 项；null 表示该期无数据） */
  monthlyCostFactors?: (number | null)[]
}

const FIXED_MOCK_PRODUCTS: MockProductSeed[] = [
  {
    sku: 'MK-CASE-001',
    spu: 'MK-CASE-SPU',
    spuName: '透明防摔壳系列',
    logisticsManager: '余玲玲',
    imageSeed: 'mkcase001',
    baseUnitCost: 23.89,
    baseQuantity: 320,
    latestCosts: [
      { channelName: '空运', price: 23.89, change: -1.2, daysAgo: 3 },
      { channelName: '美森正班', price: 25.6, change: 1.8, daysAgo: 18 },
      { channelName: '盐田普船', price: 12.96, change: -0.5, daysAgo: 9 },
      { channelName: '慢船', price: 8.35, change: 2.1, daysAgo: 22 }
    ],
    monthlyCostFactors: [1.12, 1.08, 1.05, 1.02, 0.98, 0.95, 0.92]
  },
  {
    sku: 'MK-CABLE-002',
    spu: 'MK-CABLE-SPU',
    spuName: '快充数据线系列',
    logisticsManager: '李四',
    imageSeed: 'mkcable002',
    baseUnitCost: 7.69,
    baseQuantity: 1200,
    latestCosts: [
      { channelName: '慢船', price: 7.69, change: -0.8, daysAgo: 5 },
      { channelName: '盐田普船', price: 9.75, change: 2.1, daysAgo: 22 }
    ],
    monthlyCostFactors: [1.05, 1.03, 1.0, 0.99, 0.97, 0.96, 0.94]
  },
  {
    sku: 'MK-CHARGER-003',
    spu: 'MK-CHARGER-SPU',
    spuName: 'PD 快充头系列',
    logisticsManager: '王五',
    imageSeed: 'mkcharger003',
    baseUnitCost: 18.5,
    baseQuantity: 580,
    latestCosts: [
      { channelName: '空运', price: 18.5, change: 0.5, daysAgo: 7 },
      { channelName: '快船', price: 19.2, change: -1.5, daysAgo: 15 }
    ],
    monthlyCostFactors: [0.96, 0.97, 0.98, 1.0, 1.01, 1.02, 1.04]
  },
  {
    sku: 'MK-STAND-004',
    spu: 'MK-STAND-SPU',
    spuName: '桌面支架系列',
    logisticsManager: '赵六',
    imageSeed: 'mkstand004',
    baseUnitCost: 32.0,
    baseQuantity: 210,
    latestCosts: [{ channelName: '美森正班', price: 32.0, change: -2.3, daysAgo: 4 }],
    monthlyCostFactors: [1.08, 1.06, 1.04, 1.02, 1.0, 0.99, 0.97]
  },
  {
    sku: 'MK-PAD-005',
    spu: 'MK-PAD-SPU',
    spuName: '鼠标垫套装系列',
    logisticsManager: '陈七',
    imageSeed: 'mkpad005',
    baseUnitCost: 5.28,
    baseQuantity: 2500,
    latestCosts: [
      { channelName: '普船', price: 5.28, change: 0.3, daysAgo: 6 },
      { channelName: '慢船', price: 5.55, change: 1.1, daysAgo: 20 }
    ],
    monthlyCostFactors: [1.02, 1.01, 1.0, 0.99, 0.98, 0.97, 0.96]
  },
  {
    sku: 'MK-HUB-006',
    spu: 'MK-HUB-SPU',
    spuName: 'Type-C 扩展坞系列',
    logisticsManager: '刘八',
    imageSeed: 'mkhub006',
    baseUnitCost: 45.6,
    baseQuantity: 150,
    latestCosts: [
      { channelName: '空运', price: 45.6, change: 3.2, daysAgo: 2 },
      { channelName: '美森正班', price: 42.8, change: -1.6, daysAgo: 25 }
    ],
    monthlyCostFactors: [0.94, 0.95, 0.96, 0.98, 1.0, 1.03, 1.06]
  },
  {
    sku: 'MK-SCREEN-007',
    spu: 'MK-SCREEN-SPU',
    spuName: '钢化膜系列',
    logisticsManager: '张三',
    imageSeed: 'mkscreen007',
    baseUnitCost: 3.15,
    baseQuantity: 4800,
    latestCosts: [{ channelName: '慢船', price: 3.15, change: -0.5, daysAgo: 8 }],
    monthlyCostFactors: [1.0, 0.99, 0.98, 0.97, 0.96, 0.95, null]
  },
  {
    sku: 'MK-POWER-008',
    spu: 'MK-POWER-SPU',
    spuName: '移动电源系列',
    logisticsManager: '李四',
    imageSeed: 'mkpower008',
    baseUnitCost: 62.3,
    baseQuantity: 95,
    latestCosts: [
      { channelName: '快船', price: 62.3, change: -4.1, daysAgo: 10 },
      { channelName: '盐田普船', price: 65.0, change: 2.4, daysAgo: 28 }
    ],
    monthlyCostFactors: [1.1, 1.07, 1.04, 1.01, 0.99, 0.97, 0.95]
  }
]

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function metricValue(baseUnitCost: number, baseQuantity: number, metric: MetricType): number {
  if (metric === 'quantity') return baseQuantity
  if (metric === 'totalPrice') return round2(baseUnitCost * baseQuantity)
  return baseUnitCost
}

function scaleByMetric(
  unitCost: number,
  baseQuantity: number,
  metric: MetricType,
  factor = 1
): number {
  const cost = round2(unitCost * factor)
  return metricValue(cost, baseQuantity, metric)
}

/** 根据周期类型将月系数映射到当前 7 个周期标签 */
function getFactorsForPeriod(
  period: PeriodType,
  monthlyFactors: (number | null)[],
  labelCount: number
): (number | null)[] {
  const chartLabels = getChartPeriodLabels(period, labelCount)
  if (period === 'month' && monthlyFactors.length >= labelCount) {
    return monthlyFactors.slice(-labelCount)
  }
  // 其它周期：在基准系数上轻微波动
  return chartLabels.map((_, i) => {
    const base = monthlyFactors[monthlyFactors.length - labelCount + i] ?? monthlyFactors[i]
    if (base == null || Number.isNaN(base)) return null
    return round2(base + (period === 'day' ? (i - 3) * 0.002 : (i - 3) * 0.01))
  })
}

function buildPeriodDetailsFromProduct(
  product: MockProductSeed,
  period: PeriodType,
  metric: MetricType,
  columnLabels: string[]
): Record<string, PeriodCell> {
  const labelCount = columnLabels.length || 7
  const chartFactors = getFactorsForPeriod(
    period,
    product.monthlyCostFactors ?? [1, 1, 1, 1, 1, 1, 1],
    labelCount
  )
  // 列从左到右为新→旧，系数数组为旧→新，反转后与列对齐
  const factorsNewToOld = [...chartFactors].reverse()

  const details: Record<string, PeriodCell> = {}
  let prev: number | null = null

  columnLabels.forEach((columnLabel, i) => {
    const factor = factorsNewToOld[i]
    if (factor == null) {
      details[columnLabel] = { value: null, ringRatio: null }
      return
    }
    const value = scaleByMetric(product.baseUnitCost, product.baseQuantity, metric, factor)
    let ringRatio: number | null = null
    if (prev !== null && prev !== 0) {
      ringRatio = round2(((value - prev) / prev) * 100)
    }
    details[columnLabel] = { value, ringRatio }
    prev = value
  })

  return details
}

function buildTrendDataFromProduct(
  product: MockProductSeed,
  period: PeriodType,
  metric: MetricType,
  columnLabels: string[]
): TrendPoint[] {
  const labelCount = columnLabels.length || 7
  const labels = [...columnLabels].reverse()
  const factors = getFactorsForPeriod(
    period,
    product.monthlyCostFactors ?? [1, 1, 1, 1, 1, 1, 1],
    labelCount
  )
  return labels.map((label, i) => {
    const factor = factors[i]
    if (factor == null) return { label, value: null }
    return {
      label,
      value: scaleByMetric(product.baseUnitCost, product.baseQuantity, metric, factor)
    }
  })
}

function buildLatestCostsFromProduct(
  product: MockProductSeed,
  metric: MetricType
): LatestCostItem[] {
  return product.latestCosts.map((item) => ({
    channelName: item.channelName,
    price: scaleByMetric(item.price, product.baseQuantity, metric),
    change: item.change,
    changeDate: dayjs().subtract(item.daysAgo, 'day').format('YYYY-MM-DD')
  }))
}

function calcLatestCostSortPrice(latestCosts: LatestCostItem[]): number {
  if (!latestCosts.length) return 0
  return Math.min(...latestCosts.map((c) => c.price))
}

export function createMockRowFromProduct(
  product: MockProductSeed,
  index: number,
  period: PeriodType,
  metric: MetricType,
  periodColumnLabels?: string[]
): BatchCostRow {
  const latestCosts = buildLatestCostsFromProduct(product, metric)
  const columnLabels = periodColumnLabels?.length
    ? periodColumnLabels
    : getRecentPeriodLabels(period, 7)
  return {
    id: `batch-cost-${product.sku}`,
    imageUrl: `https://picsum.photos/seed/${product.imageSeed}/80/80`,
    sku: product.sku,
    spu: product.spu,
    logisticsManager: product.logisticsManager,
    latestCostPrice: calcLatestCostSortPrice(latestCosts),
    latestCosts,
    trendData: buildTrendDataFromProduct(product, period, metric, columnLabels),
    periodDetails: buildPeriodDetailsFromProduct(product, period, metric, columnLabels)
  }
}

export function createMockRow(
  index: number,
  period: PeriodType,
  metric: MetricType,
  _dimension: DimensionType
): BatchCostRow {
  const product = FIXED_MOCK_PRODUCTS[index % FIXED_MOCK_PRODUCTS.length]
  return createMockRowFromProduct(product, index, period, metric)
}

export function generateMockTableData(
  page: number,
  size: number,
  period: PeriodType,
  metric: MetricType,
  _dimension: DimensionType,
  sort?: { field?: string; order?: 'asc' | 'desc' },
  periodColumnLabels?: string[]
): { records: BatchCostRow[]; total: number } {
  let all = FIXED_MOCK_PRODUCTS.map((product, i) =>
    createMockRowFromProduct(product, i, period, metric, periodColumnLabels)
  )
  if (sort?.field === 'latestCostPrice' && sort.order) {
    const dir = sort.order === 'asc' ? 1 : -1
    all = [...all].sort((a, b) => (a.latestCostPrice - b.latestCostPrice) * dir)
  }
  const total = all.length
  const start = (page - 1) * size
  return { records: all.slice(start, start + size), total }
}

export function findMockProductBySku(sku: string) {
  return FIXED_MOCK_PRODUCTS.find((p) => p.sku === sku)
}

export function formatMetricValue(value: number | null, metric: MetricType): string {
  if (value === null || value === undefined) return '—'
  if (metric === 'quantity') return String(value)
  if (metric === 'totalPrice') {
    const decimals = (String(value).split('.')[1] || '').length
    return `¥${value.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })}`
  }
  return `¥${value}`
}
