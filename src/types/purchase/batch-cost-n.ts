/**
 * 采购批次成本（新版）类型定义
 * 完全独立，不与旧 batch-cost 共享任何类型
 */

/** 维度：SKU 或 SPU */
export type BcnDimension = 'sku' | 'spu'

/** 指标：单个采购成本 / 采购数量 / 采购总价 */
export type BcnMetric = 'unitCost' | 'quantity' | 'totalPrice'

/** 周期 */
export type BcnPeriod = 'day' | 'week' | 'month' | 'quarter' | 'year'

/** 主列表搜索表单 */
export interface BcnSearchForm {
  /** SKU/SPU/商品名 关键字 */
  keyword: string
  /** 接单时间范围 [start, end] */
  dateRange: [string, string] | []
  period: BcnPeriod
  buyerIds: (number | string)[]
  categoryIds: (number | string)[]
  brandIds: (number | string)[]
  dimension: BcnDimension
  metric: BcnMetric
  showRingRatio: boolean
}

/** 单个供应商的最新成本条目 */
export interface BcnSupplierLatest {
  supplierId: number | string
  supplierName: string
  price: number
  /** 与上一价的环比百分比，正负有方向 */
  changeRate: number | null
  effectiveDate: string
}

/** 周期列单元格 */
export interface BcnPeriodCell {
  value: number | null
  ringRatio: number | null
}

/** 主列表一行 */
export interface BcnListRow {
  id: string
  productCode: string
  productImage: string
  buyerName: string
  latestCosts: BcnSupplierLatest[]
  trendPoints: Array<{ label: string; value: number | null }>
  /** key = 周期列 label，例如 "2026-05" */
  periodCells: Record<string, BcnPeriodCell>
}

/** 主列表分页响应 */
export interface BcnListPageResp {
  records: BcnListRow[]
  total: number
  /** 接口动态返回周期列 label（从新到旧或从旧到新由后端决定） */
  periodLabels: string[]
}

// ---------- 价格历史 Drawer ----------

export interface BcnPriceVersion {
  version: string
  price: number
  /** 相对上一个版本的变化金额，null 表示首个版本 */
  change: number | null
  effectiveDate: string
}

export interface BcnPriceHistorySupplier {
  supplierId: number | string
  supplierName: string
  latestPrice: number
  latestDate: string
  versions: BcnPriceVersion[]
  stats: {
    max: number
    min: number
    avg: number
  }
}

// ---------- 趋势分析 Dialog ----------

export interface BcnTrendSummary {
  monthQuantity: number
  monthAmount: number
  monthAmountRingRatio: number | null
  monthUnitCost: number
  dominantSupplier: { name: string; ratio: number }
  supplierCount: number
  /** 总成本（用于环形图中心展示） */
  totalCost: number
}

export interface BcnTrendSeries {
  metric: BcnMetric
  supplierId: number | string | 'all'
  supplierName: string
  points: Array<{ label: string; value: number | null }>
}

export interface BcnTrendDonutItem {
  supplierId: number | string
  name: string
  amount: number
}

// ---------- 分批次明细 ExpandPanel ----------

export interface BcnBatchSummary {
  orderCount: number
  totalPurchaseQty: number
  totalInboundQty: number
  totalAmountIncludingTax: number
  weightedAvgPrice: number
  amountBySupplier: Array<{ name: string; amount: number; ratio: number }>
}

export interface BcnBatchOrderItem {
  id: string | number
  orderNo: string
  receiveTime: string
  supplierName: string
  status: string
  purchaseQty: number
  inboundQty: number
  pendingQty: number
  unqualifiedQty: number
  unitPrice: number
  includeTaxUnitPrice: number
  taxRate: number
  amount: number
  amountIncludingTax: number
  buyerName: string
}

export interface BcnBatchOrderQuery {
  current: number
  size: number
  dateRange?: [string, string]
  supplierId?: number | string
  status?: string
}

/** 导出任务返回 */
export interface BcnExportTask {
  taskId: string
}
