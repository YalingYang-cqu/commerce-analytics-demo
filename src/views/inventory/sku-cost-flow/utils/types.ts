/** 聚合维度 Tab */
export type FlowDim = 'msku' | 'localSku' | 'asin' | 'warehouse' | 'store'

/** 数量 / 成本 口径 */
export type FlowMeasure = 'qty' | 'cost'

/** 六类业务组前缀 */
export const BIZ_GROUPS = [
  'receipt',
  'saleOut',
  'saleReturn',
  'removal',
  'stocktake',
  'otherAdjust'
] as const
export type BizGroup = (typeof BIZ_GROUPS)[number]

/** 主表行：一行 = 某 SKU 某一天，从期初到期末 */
export interface FlowRow {
  rowKey: string
  invDate: string
  companyName: string
  platform: string
  storeName: string
  siteName: string
  warehouseCode: string
  warehouseName: string
  msku: string
  localSku: string
  skuName: string
  asin: string
  fnsku: string
  invAttr: string
  openingQty: number
  openingPurchaseAmount: number
  openingLogisticsAmount: number
  openingTotalAmount: number
  closingQty: number
  closingPurchaseAmount: number
  closingLogisticsAmount: number
  closingTotalAmount: number
  diffQty: number
  diffAmount: number
  hasEstimated: boolean
  exceptionReason: string
  genMode: string
  /** 六类业务：{biz}Qty / {biz}PurchaseAmount / {biz}LogisticsAmount / {biz}TotalAmount */
  [key: string]: any
}

/** 一级展开：平台库存流水事件 */
export interface InvFlowRow {
  invFlowNo: string
  invDate: string
  docTime: string
  bizType: string
  ioType: string
  bizNo: string
  ioDirection: 'IN' | 'OUT'
  invAttr: string
  msku: string
  warehouseCode: string
  changeQty: number
  beforeQty: number
  afterQty: number
  reportSource: string
  reportBatchNo: string
  genMode: string
  exceptionReason: string
  costSplitCount: number
}

/** 二级展开：成本流水（按批次拆行） */
export interface CostFlowRow {
  costFlowNo: string
  seqNo: number
  batchId: string
  batchNo: string
  batchType: string
  changeQty: number
  changePurchasePrice: number
  changeLogisticsPrice: number
  changePurchaseAmount: number
  changeLogisticsAmount: number
  changeTotalAmount: number
  mskuWarehouseQty: number
  mskuWarehousePurchaseAmount: number
  mskuWarehouseLogisticsAmount: number
  pricingMethod: string
  costSource: string
  isEstimated: boolean
  version: 'NORMAL' | 'REVERSED' | 'RECALC'
}

export interface FlowMetrics {
  [key: string]: number
  openingQty: number
  openingAmount: number
  openingPurchaseAmount: number
  openingLogisticsAmount: number
  openingGoodAmount: number
  openingDefectiveAmount: number
  openingGoodQty: number
  openingDefectiveQty: number
  closingQty: number
  closingAmount: number
  closingPurchaseAmount: number
  closingLogisticsAmount: number
  closingGoodAmount: number
  closingDefectiveAmount: number
  closingGoodQty: number
  closingDefectiveQty: number
  inboundFlowQty: number
  inboundFlowAmount: number
  inboundGoodQty: number
  inboundDefectiveQty: number
  receiptInboundQty: number
  receiptInboundAmount: number
  returnInboundQty: number
  returnInboundAmount: number
  adjustmentInboundQty: number
  adjustmentInboundAmount: number
  outboundFlowQty: number
  outboundFlowAmount: number
  outboundGoodQty: number
  outboundDefectiveQty: number
  saleOutboundQty: number
  saleOutboundAmount: number
  removalOutboundQty: number
  removalOutboundAmount: number
  adjustmentOutboundQty: number
  adjustmentOutboundAmount: number
  netChangeQty: number
  netChangeAmount: number
  goodNetChangeQty: number
  goodNetChangeAmount: number
  defectiveNetChangeQty: number
  defectiveNetChangeAmount: number
  diffQty: number
  diffAmount: number
}

export interface FlowStatus {
  dataDate: string
  eventSplitBalanced: boolean
  batchBalanced: boolean
  warehouseBalanced: boolean
  unbalancedCount: number
  monthlyReconciled: boolean
}
