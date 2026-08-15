import type { BatchType } from '../../utils/dict'

/** 维度 Tab：按批次生命周期切，不是平台 */
export type BatchTab = 'inStock' | 'inTransit' | 'exhausted' | 'all'

/** 主表粒度：按本地SKU+仓库汇总 / 批次明细 */
export type BatchBalanceView = 'summary' | 'batch'

/** 主表行模型：接口原始字段 + 前端派生列 */
export interface BatchRow {
  batchId: string
  batchNo: string
  batchType: BatchType
  companyName: string
  platform: string
  storeName: string
  siteName: string
  warehouseCode: string
  warehouseName: string
  localSku: string
  skuName: string
  msku: string
  asin: string
  invAttr: string
  stockStatus: string
  consumeStatus: string
  shippedQty: number
  receivedQty: number
  balanceQty: number
  purchasePrice: number
  logisticsPrice: number
  balancePurchaseAmount: number
  balanceLogisticsAmount: number
  shipTime: string
  inboundDate: string
  lastConsumeDate: string
  parentBatchNo: string
  rootBatchNo: string
  platformDocNo: string
  purchaseDetailId: string
  logisticsDetailId: string
  isEstimated: boolean
  exceptionFlag: boolean
  /** 当前行对应的库存快照日期；未选库存日期时为最新可用日期 */
  snapshotDate?: string
  /** 派生：−（签收 − 结存），出库消耗为负 */
  consumedQty: number
  /** 派生：采购 + 物流 */
  unitTotalCost: number
  /** 派生：结存采购 + 结存物流 */
  balanceTotalAmount: number
  /** 派生：已结转成本 */
  consumedAmount: number
  /** 派生：今日 − 入仓日期 */
  ageDays: number | null
  /** 派生：今日 − 发货时间，仅在途有意义 */
  transitDays: number | null
}

/** 按本地SKU + 仓库汇总行 */
export interface SkuWarehouseSummaryRow {
  rowKey: string
  localSku: string
  skuName: string
  warehouseCode: string
  warehouseName: string
  companyName: string
  /** 组内平台一致时返回该值，否则为空（前端展示「多平台」） */
  platform: string
  batchCnt: number
  estimatedBatchCnt: number
  exceptionBatchCnt: number
  shippedQty: number
  receivedQty: number
  consumedQty: number
  balanceQty: number
  goodQty: number
  defectiveQty: number
  balancePurchaseAmount: number
  balanceLogisticsAmount: number
  balanceTotalAmount: number
  /** 按结存数量加权的单位总成本 */
  avgUnitCost: number
  /** 加权采购单价 */
  avgPurchaseUnitCost: number
  /** 加权物流单价 */
  avgLogisticsUnitCost: number
  /** 结存数量 > 0 的可售批次数 */
  availableBatchCnt: number
  /** 在售（CONSUMING）批次的单位总成本；组内多条时取 FIFO 最早入仓 */
  consumingBatchCost: number | null
  consumingPurchasePrice: number | null
  consumingLogisticsPrice: number | null
  /** 最近入仓批次的单位总成本（采购单价 + 物流单价） */
  latestPurchaseLogisticsCost: number | null
  latestPurchasePrice: number | null
  latestLogisticsPrice: number | null
  overAgeQty: number
  earliestInboundDate: string
  latestInboundDate: string
  snapshotDate?: string
}

/** 展开行 / 抽屉第三段：单批次消耗流水 */
export interface BatchConsumeRow {
  costFlowNo: string
  invFlowNo: string
  invDate: string
  docTime: string
  bizType: string
  ioType: string
  bizNo: string
  msku: string
  changeQty: number
  changePurchasePrice: number
  changeLogisticsPrice: number
  changePurchaseAmount: number
  changeLogisticsAmount: number
  pricingMethod: string
  costSource: string
  isEstimated: boolean
  /** 派生：批次累计结存数量（按时间顺序推导） */
  batchRunningQty: number
  /** 派生：批次累计结存金额 */
  batchRunningAmount: number
}

/** 指标卡口径 */
export interface BatchMetrics {
  balanceQty: number
  balanceTotalAmount: number
  balancePurchaseAmount: number
  balancePurchaseRate: number
  balanceLogisticsAmount: number
  balanceLogisticsRate: number
  goodQty: number
  goodRate: number
  defectiveQty: number
  defectiveRate: number
  overAgeQty: number
  overAgeGoodQty: number
  overAgeGoodRate: number
  overAgeDefectiveQty: number
  overAgeDefectiveRate: number
  avgGoodAgeDays: number
  goodAge0To30Qty: number
  goodAge0To30Rate: number
  goodAge31To60Qty: number
  goodAge31To60Rate: number
  goodAge61To90Qty: number
  goodAge61To90Rate: number
  goodAgeOver90Qty: number
  goodAgeOver90Rate: number
  outboundConsumedQty: number
  goodOutboundConsumedQty: number
  goodOutboundConsumedRate: number
  defectiveOutboundConsumedQty: number
  defectiveOutboundConsumedRate: number
  inboundQty: number
  goodInboundQty: number
  goodInboundRate: number
  defectiveInboundQty: number
  defectiveInboundRate: number
  outboundConsumedAmount: number
  goodOutboundConsumedAmount: number
  goodOutboundConsumedAmountRate: number
  defectiveOutboundConsumedAmount: number
  defectiveOutboundConsumedAmountRate: number
  inboundAmount: number
  goodInboundAmount: number
  goodInboundAmountRate: number
  defectiveInboundAmount: number
  defectiveInboundAmountRate: number
}

export interface BatchStatus {
  dataDate: string
  jobFinished: boolean
  reconciled: boolean
  exceptionCount: number
}

/** 抽屉第二段：批次变动对平瀑布 */
export interface LedgerStep {
  key: string
  label: string
  sign: string
  qty: number
  purchaseAmount: number
  logisticsAmount: number
}

export interface BatchLedger {
  batch: BatchRow
  reconcile: {
    steps: LedgerStep[]
    derived: { qty: number; purchaseAmount: number; logisticsAmount: number }
    actual: { qty: number; purchaseAmount: number; logisticsAmount: number }
    balanced: boolean
  }
  trace: { chain: string[]; note?: string }
}
