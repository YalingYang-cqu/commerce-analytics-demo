/** SKU 综合成本相关类型定义 */

/** 视图维度：按 SKU 汇总 / 按批次明细 */
export type SkuCostView = 'summary' | 'batch'

/** 预警类型
 * - turnover  库存周转：可售天数 > 60 天
 * - abnormal  异常预警：库存数量 < 0（超卖）
 * - costSurge 成本异常：最新批次较上批次涨幅 > 10%
 * - overdue   库存超期：最早批次在库 > 180 天
 */
export type WarningType = 'turnover' | 'abnormal' | 'costSurge' | 'overdue'

/** 预警标签 */
export interface WarningTag {
  type: WarningType
  label: string
}

/** 趋势分析点（与采购批次成本一致） */
export interface TrendPoint {
  label: string
  value: number | null
}

/** 按 SKU 汇总行 */
export interface SkuSummaryRow {
  id: string
  imageUrl: string
  sku: string
  skuName: string
  category: string
  /** 库存数量；负数代表超卖等异常 */
  stockQty: number
  /** 最早批次成本（FIFO 首批） */
  earliestBatchCost: number | null
  /** 最近批次成本 */
  latestBatchCost: number | null
  /** 在售批次成本（当前在消耗的批次成本，会高亮） */
  sellingBatchCost: number | null
  /** 可售批次数 */
  availableBatches: number
  /** 日均销量 */
  dailyAvgSales: number | null
  /** 可售天数 */
  availableDays: number | null
  /** 预警标签集合 */
  warnings: WarningTag[]
  /** 趋势分析 */
  trendData: TrendPoint[]
}

/** 按批次明细行 */
export interface BatchDetailRow {
  id: string
  imageUrl: string
  sku: string
  skuName: string
  /** FIFO 批次号 */
  fifoBatchNo: string
  /** 入库日期 YYYY-MM-DD */
  inboundDate: string
  /** 入库数量 */
  inboundQty: number
  /** 当前剩余数量 */
  remainingQty: number
  /** 采购成本（单价） */
  purchaseCost: number
  /** 头程成本（分摊单价） */
  freightCost: number
  /** 头程成本类型：estimate 表示预估（在头程成本后展示“（预估）”） */
  costType?: string
  /** 单位综合成本 = 采购 + 头程 */
  unitTotalCost: number
  /** 较上批次涨跌（百分比，正负） */
  changeRatio: number | null
  /** 成本构成（采购 / 头程） */
  costBreakdown: { purchase: number; freight: number }
  /** 单据来源（采购订单号 → 入库单号） */
  sourcePoNo: string
  sourceInboundNo: string
  /** 来源类型：采购入库 / 调拨入库 / 退货入库 */
  sourceType: 'purchase' | 'transfer' | 'return'
  /** 批次状态：消耗中 / 待消耗 / 已耗尽 */
  status: 'consuming' | 'pending' | 'consumed'
  /** 已售比例（用于"已售 X%"标签） */
  soldPercent?: number
}

/** FIFO 展开行：单个 SKU 的统计 */
export interface SkuFifoStats {
  /** 在售批次个数 */
  activeBatches: number
  /** 累计入库件数 */
  cumulativeInbound: number
  /** 剩余库存件数 */
  remainingStock: number
  /** 库存价值（元） */
  stockValue: number
  /** 加权综合成本（元/件） */
  weightedAvgCost: number
}

/** FIFO 展开行：单个批次行 */
export interface SkuFifoBatchRow extends BatchDetailRow {
  /** 批次状态标签（用于已售 X% 标签等显示态） */
  statusLabel: string
}
