/** SKU 综合成本 mock 数据生成 */
import type {
  BatchDetailRow,
  SkuFifoBatchRow,
  SkuFifoStats,
  SkuSummaryRow,
  TrendPoint,
  WarningTag,
  WarningType
} from './types'

/** 演示用 SKU 种子；warnings 不再硬编码，由规则计算（见 computeWarnings） */
interface SkuSeed {
  sku: string
  skuName: string
  category: string
  /** 库存数量（负数代表超卖） */
  stockQty: number
  earliestBatchCost: number | null
  latestBatchCost: number | null
  sellingBatchCost: number | null
  availableBatches: number
  availableDays: number | null
  /**
   * 首批入库距今天数；决定"最早批次入库日期"，用于触发"库存超期 > 180 天"
   * 缺省默认 120（约 4 个月前）
   */
  firstInboundDaysAgo?: number
  /**
   * 最新批次相对上一批次的强制涨幅（百分比，正负均可）；
   * 用于触发"成本异常 > 10%"，缺省时按种子哈希自然波动
   */
  costSurgePercent?: number
}

const SKU_SEEDS: SkuSeed[] = [
  {
    sku: 'A001',
    skuName: '户外水壶-1L 银',
    category: '户外用品',
    stockQty: 1250,
    earliestBatchCost: 35.2,
    latestBatchCost: 38.5,
    sellingBatchCost: 35.2,
    availableBatches: 3,
    availableDays: 33,
    firstInboundDaysAgo: 120
  },
  {
    sku: 'A002',
    skuName: '营地灯-LED 充电款',
    category: '户外用品',
    stockQty: 500,
    earliestBatchCost: 120.8,
    latestBatchCost: 130.0,
    sellingBatchCost: 120.8,
    availableBatches: 2,
    availableDays: 25,
    firstInboundDaysAgo: 90
  },
  {
    sku: 'B385',
    skuName: '收纳盒-多功能折叠',
    category: '家居生活',
    stockQty: 25,
    earliestBatchCost: 43.5,
    latestBatchCost: 45.2,
    sellingBatchCost: 43.5,
    availableBatches: 1,
    availableDays: 62,
    firstInboundDaysAgo: 100
  },
  {
    sku: 'C112',
    skuName: '便携椅-户外折叠',
    category: '户外用品',
    stockQty: -25,
    earliestBatchCost: null,
    latestBatchCost: null,
    sellingBatchCost: null,
    availableBatches: 0,
    availableDays: null
  },
  {
    sku: 'D720',
    skuName: '保温杯-500ml 黑',
    category: '家居生活',
    stockQty: 2400,
    earliestBatchCost: 45.0,
    latestBatchCost: 72.0,
    sellingBatchCost: 52.2,
    availableBatches: 4,
    availableDays: 52,
    firstInboundDaysAgo: 200,
    costSurgePercent: 14
  },
  {
    sku: 'E551',
    skuName: '折叠桌-户外野炊',
    category: '户外用品',
    stockQty: 680,
    earliestBatchCost: 58.2,
    latestBatchCost: 65.4,
    sellingBatchCost: 58.2,
    availableBatches: 2,
    availableDays: 45,
    firstInboundDaysAgo: 80
  },
  {
    sku: 'F889',
    skuName: '登山杖-碳纤维',
    category: '户外用品',
    stockQty: 320,
    earliestBatchCost: 98.8,
    latestBatchCost: 96.5,
    sellingBatchCost: 98.8,
    availableBatches: 2,
    availableDays: 62,
    firstInboundDaysAgo: 220
  },
  {
    sku: 'G220',
    skuName: '收纳袋-旅行多色',
    category: '家居生活',
    stockQty: 60,
    earliestBatchCost: 12.5,
    latestBatchCost: 13.2,
    sellingBatchCost: 12.5,
    availableBatches: 1,
    availableDays: 10,
    firstInboundDaysAgo: 60
  },
  {
    sku: 'H330',
    skuName: '速干毛巾-纤维',
    category: '家居生活',
    stockQty: 880,
    earliestBatchCost: 8.5,
    latestBatchCost: 9.6,
    sellingBatchCost: 8.5,
    availableBatches: 3,
    availableDays: 38,
    firstInboundDaysAgo: 75
  },
  {
    sku: 'I440',
    skuName: '帐篷防潮垫-双人',
    category: '户外用品',
    stockQty: 150,
    earliestBatchCost: 65.0,
    latestBatchCost: 78.5,
    sellingBatchCost: 70.2,
    availableBatches: 2,
    availableDays: 28,
    firstInboundDaysAgo: 150,
    costSurgePercent: 12
  }
]

const round2 = (n: number) => Math.round(n * 100) / 100

/** 简易稳定 hash，用于按 sku 派生稳定的"随机"序列，避免每次刷新数据飘 */
function hashCode(s: string): number {
  let h = 0
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function buildTrend(sku: string, base: number | null): TrendPoint[] {
  if (base == null) return []
  const labels = ['2025-12', '2026-01', '2026-02', '2026-03', '2026-04', '2026-05']
  const h = hashCode(sku)
  return labels.map((label, i) => {
    const offset = ((h + i * 17) % 11) - 5
    return { label, value: round2(base * (1 + offset / 100)) }
  })
}

/** 把 Date 格式化成 YYYY-MM-DD（不带时区干扰） */
function formatYmd(d: Date): string {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

/** 计算两日期相差的整天数（today - earlier） */
function diffDays(earlier: Date, later: Date): number {
  const ms = later.getTime() - earlier.getTime()
  return Math.floor(ms / 86_400_000)
}

/** 预警规则映射：(规则 → 标签文案) */
const WARNING_LABEL: Record<WarningType, string> = {
  turnover: '库存周转',
  abnormal: '异常预警',
  costSurge: '成本异常',
  overdue: '库存超期'
}

/**
 * 按 4 条业务规则计算预警标签。
 * 1) 库存周转：可售天数 > 60
 * 2) 异常预警：库存数量 < 0
 * 3) 成本异常：最新批次相对上一批次涨幅 > 10%
 * 4) 库存超期：最早批次在库天数 > 180
 */
function computeWarnings(seed: SkuSeed, batches: SkuFifoBatchRow[]): WarningTag[] {
  const tags: WarningTag[] = []
  if (seed.availableDays != null && seed.availableDays > 60) {
    tags.push({ type: 'turnover', label: WARNING_LABEL.turnover })
  }
  if (seed.stockQty < 0) {
    tags.push({ type: 'abnormal', label: WARNING_LABEL.abnormal })
  }
  if (batches.length >= 2) {
    const last = batches[batches.length - 1]
    if (last.changeRatio != null && last.changeRatio > 10) {
      tags.push({
        type: 'costSurge',
        label: `${WARNING_LABEL.costSurge} +${last.changeRatio.toFixed(0)}%`
      })
    }
  }
  if (batches.length > 0) {
    const earliest = batches[0]
    const ageDays = diffDays(new Date(earliest.inboundDate), new Date())
    if (ageDays > 180) {
      tags.push({ type: 'overdue', label: `${WARNING_LABEL.overdue} ${ageDays}天` })
    }
  }
  return tags
}

export function getSummaryRows(): SkuSummaryRow[] {
  return SKU_SEEDS.map((seed, i) => {
    const batches = buildBatchesForSku(seed)
    return {
      id: `sku-summary-${seed.sku}`,
      imageUrl: '',
      sku: seed.sku,
      skuName: seed.skuName,
      category: seed.category,
      stockQty: seed.stockQty,
      earliestBatchCost: seed.earliestBatchCost,
      latestBatchCost: seed.latestBatchCost,
      sellingBatchCost: seed.sellingBatchCost,
      availableBatches: seed.availableBatches,
      availableDays: seed.availableDays,
      warnings: computeWarnings(seed, batches),
      trendData: buildTrend(seed.sku + i, seed.sellingBatchCost)
    }
  })
}

/** 为单个 SKU 构造 N 条批次行，inboundDate 由 firstInboundDaysAgo 动态计算 */
function buildBatchesForSku(seed: SkuSeed): SkuFifoBatchRow[] {
  if (seed.availableBatches === 0) return []
  const h = hashCode(seed.sku)
  const baseCost = seed.earliestBatchCost ?? 30
  const firstAgo = seed.firstInboundDaysAgo ?? 120
  /** 批次之间间隔约 35 天（首批最早，后续逐渐近今） */
  const stepDays = 35
  const today = new Date()

  const batches: SkuFifoBatchRow[] = []
  for (let i = 0; i < seed.availableBatches; i++) {
    const factor = 1 + (((h + i * 31) % 13) - 4) / 100
    const purchaseCost = round2(baseCost * factor)
    const freightCost = round2(purchaseCost * 0.15)
    let unitTotalCost = round2(purchaseCost + freightCost)

    const inboundQty = 200 + ((h + i * 53) % 600)
    /** availableBatches 表示"在库批次数"；按 FIFO 最旧一批正在消耗（i=0 消耗中），其余待消耗 */
    const isConsuming = i === 0
    const remainingQty = isConsuming ? Math.floor(inboundQty * 0.4) : inboundQty
    const soldPercent =
      inboundQty > 0 ? Math.round(((inboundQty - remainingQty) / inboundQty) * 100) : 0
    const status: BatchDetailRow['status'] = isConsuming ? 'consuming' : 'pending'
    const statusLabel = isConsuming ? '消耗中' : '待消耗'

    const inboundAt = new Date(today)
    inboundAt.setDate(inboundAt.getDate() - (firstAgo - i * stepDays))
    const inboundDate = formatYmd(inboundAt)

    const prev = batches[i - 1]
    /** 末批支持强制涨幅，用于触发成本异常 */
    if (prev && i === seed.availableBatches - 1 && seed.costSurgePercent != null) {
      unitTotalCost = round2(prev.unitTotalCost * (1 + seed.costSurgePercent / 100))
    }
    const changeRatio = prev
      ? round2(((unitTotalCost - prev.unitTotalCost) / prev.unitTotalCost) * 100)
      : null

    /** 来源类型按 (hash + i) 派发，确保同 SKU 内三种类型尽量均衡 */
    const sourceTypes: BatchDetailRow['sourceType'][] = ['purchase', 'transfer', 'return']
    const sourceType = sourceTypes[(h + i) % sourceTypes.length]

    /** 拼接 fifo 批次号；保留与原格式一致的语义（YYYYMMDD-序号） */
    const ymdNoDash = inboundDate.replace(/-/g, '')
    batches.push({
      id: `batch-${seed.sku}-${i}`,
      imageUrl: '',
      sku: seed.sku,
      skuName: seed.skuName,
      fifoBatchNo: `BATCH-${ymdNoDash}-0${i + 1}`,
      inboundDate,
      inboundQty,
      remainingQty,
      purchaseCost,
      freightCost,
      unitTotalCost,
      changeRatio,
      costBreakdown: { purchase: purchaseCost, freight: freightCost },
      sourcePoNo: `PO-7878201${i + 1}-0${i + 1}`,
      sourceInboundNo: `IB-7877580${i + 5}-0${i + 5}`,
      sourceType,
      status,
      soldPercent,
      statusLabel
    })
  }
  return batches
}

export function getBatchDetailRows(): BatchDetailRow[] {
  return SKU_SEEDS.flatMap((seed) => buildBatchesForSku(seed))
}

/** 展开行：按 SKU 查统计 + 批次 */
export function getSkuFifoBatches(sku: string): SkuFifoBatchRow[] {
  const seed = SKU_SEEDS.find((s) => s.sku === sku)
  if (!seed) return []
  return buildBatchesForSku(seed)
}

export function getSkuFifoStats(sku: string): SkuFifoStats {
  const batches = getSkuFifoBatches(sku)
  const cumulativeInbound = batches.reduce((sum, b) => sum + b.inboundQty, 0)
  const remainingStock = batches.reduce((sum, b) => sum + b.remainingQty, 0)
  const stockValue = round2(batches.reduce((sum, b) => sum + b.remainingQty * b.unitTotalCost, 0))
  const weightedAvgCost = remainingStock > 0 ? round2(stockValue / remainingStock) : 0
  return {
    activeBatches: batches.filter((b) => b.status !== 'consumed').length,
    cumulativeInbound,
    remainingStock,
    stockValue,
    weightedAvgCost
  }
}

/** 金额展示：有几位小数就展示几位（不补零、不强制两位），保留千分位分组 */
export function formatMoney(n: number | null | undefined): string {
  if (n == null) return '—'
  const decimals = (String(n).split('.')[1] || '').length
  return n.toLocaleString('zh-CN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  })
}
