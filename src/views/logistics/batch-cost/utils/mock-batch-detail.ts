/* eslint-disable @typescript-eslint/no-unused-vars */
import type { BatchCostRow, DimensionType } from './mock-data'
import { logisticsCostBatchDetails } from '@/api/logistics/batch-cost'

export interface BatchOrderDetailRow {
  id: string
  waybillId: number
  waybillNo: string
  /** SPU 维度下展示的具体 SKU 编码 */
  sku?: string
  /** SPU 维度下展示的具体 SKU 名称 */
  skuName?: string
  shipTime: string
  shipmentNo: string
  purchaseOrderNo: string
  logisticsProviderCode: string
  transportPlanName: string
  expectedArrivalTime: string
  actualSignTime: string | null
  status: number
  statusName: string
  shipQty: number
  volume: number
  grossWeight: number
  unitFirstLegCost: number
  totalFirstLegCost: number
  sourceWarehouseName: string
  destWarehouseName: string
  /** 成本类型：estimate 表示预估（单个/总头程成本后展示“（预估）”） */
  costType?: string
}

export interface ChannelAmountItem {
  name: string
  amount: number
}

export interface ChannelAvgItem {
  name: string
  qty: number
  avg: number
}

export interface BatchOrderDetailSummary {
  batchCount: number
  totalShipQty: number
  totalWeight: number
  totalFirstLegCost: number
  weightedAvgUnitPrice: number
  amountByChannel: ChannelAmountItem[]
  avgByChannel: ChannelAvgItem[]
}

export interface BatchOrderDetailResult {
  productCode: string
  summary: BatchOrderDetailSummary
  records: BatchOrderDetailRow[]
  total: number
}

export interface BatchOrderDetailQuery {
  sku?: string
  spu?: string
  shipTimeFrom?: string | null
  shipTimeTo?: string | null
  channelNames?: string[]
  transportStatusList?: string[]
  current?: number
  size?: number
  /** 统计维度：与主列表一致（sku | spu），决定 code 取 sku 还是 spu */
  dimension?: DimensionType
}

const STATUS_LIST = [
  { status: 2, name: '运输中' },
  { status: 1, name: '已发货' },
  { status: 4, name: '待签收' },
  { status: 3, name: '已签收' }
]

/** 固定演示数据（与设计稿一致） */
const DEMO_ROWS: Omit<BatchOrderDetailRow, 'id' | 'waybillId'>[] = [
  {
    waybillNo: 'DHL743237072160',
    shipTime: '2026-05-09',
    shipmentNo: 'FBA202605090003',
    purchaseOrderNo: 'PO202605090003',
    logisticsProviderCode: 'LOG005',
    transportPlanName: '空运',
    expectedArrivalTime: '2026-05-20',
    actualSignTime: null,
    status: 2,
    statusName: '运输中',
    shipQty: 112,
    volume: 0.125,
    grossWeight: 46.71,
    unitFirstLegCost: 16.12,
    totalFirstLegCost: 1805,
    sourceWarehouseName: '深圳前置仓',
    destWarehouseName: 'FBA-LAX9'
  },
  {
    waybillNo: 'UPS892104563821',
    shipTime: '2026-05-08',
    shipmentNo: 'FBA202605080002',
    purchaseOrderNo: 'PO202605080002',
    logisticsProviderCode: 'LOG002',
    transportPlanName: '美森正班',
    expectedArrivalTime: '2026-06-02',
    actualSignTime: null,
    status: 1,
    statusName: '已发货',
    shipQty: 331,
    volume: 0.382,
    grossWeight: 128.4,
    unitFirstLegCost: 11.94,
    totalFirstLegCost: 4652,
    sourceWarehouseName: '东莞仓',
    destWarehouseName: 'FBA-ONT8'
  },
  {
    waybillNo: 'FEDEX8839201745',
    shipTime: '2026-05-07',
    shipmentNo: 'FBA202605070001',
    purchaseOrderNo: 'PO202605070001',
    logisticsProviderCode: 'LOG005',
    transportPlanName: '盐田普船',
    expectedArrivalTime: '2026-06-15',
    actualSignTime: null,
    status: 4,
    statusName: '待签收',
    shipQty: 248,
    volume: 0.296,
    grossWeight: 95.2,
    unitFirstLegCost: 12.65,
    totalFirstLegCost: 3137,
    sourceWarehouseName: '深圳前置仓',
    destWarehouseName: 'FBA-SMF3'
  },
  {
    waybillNo: 'MAERSK20260506001',
    shipTime: '2026-05-06',
    shipmentNo: 'FBA202605060004',
    purchaseOrderNo: 'PO202605060004',
    logisticsProviderCode: 'LOG002',
    transportPlanName: '慢船',
    expectedArrivalTime: '2026-06-28',
    actualSignTime: '2026-06-25',
    status: 3,
    statusName: '已签收',
    shipQty: 427,
    volume: 0.512,
    grossWeight: 156.8,
    unitFirstLegCost: 7.69,
    totalFirstLegCost: 4084,
    sourceWarehouseName: '惠州仓',
    destWarehouseName: 'FBA-PHX7'
  },
  {
    waybillNo: 'CAINIAO20260505088',
    shipTime: '2026-05-05',
    shipmentNo: 'FBA202605050005',
    purchaseOrderNo: 'PO202605050005',
    logisticsProviderCode: 'LOG005',
    transportPlanName: '空运',
    expectedArrivalTime: '2026-05-18',
    actualSignTime: '2026-05-17',
    status: 3,
    statusName: '已签收',
    shipQty: 89,
    volume: 0.098,
    grossWeight: 32.5,
    unitFirstLegCost: 15.09,
    totalFirstLegCost: 1343,
    sourceWarehouseName: '深圳前置仓',
    destWarehouseName: 'FBA-LGB8'
  },
  {
    waybillNo: 'DHL743237072161',
    shipTime: '2026-05-04',
    shipmentNo: 'FBA202605040006',
    purchaseOrderNo: 'PO202605040006',
    logisticsProviderCode: 'LOG002',
    transportPlanName: '美森正班',
    expectedArrivalTime: '2026-05-28',
    actualSignTime: null,
    status: 2,
    statusName: '运输中',
    shipQty: 156,
    volume: 0.178,
    grossWeight: 58.3,
    unitFirstLegCost: 17.82,
    totalFirstLegCost: 3278,
    sourceWarehouseName: '东莞仓',
    destWarehouseName: 'FBA-DFW6'
  },
  {
    waybillNo: 'UPS892104563822',
    shipTime: '2026-05-03',
    shipmentNo: 'FBA202605030007',
    purchaseOrderNo: 'PO202605030007',
    logisticsProviderCode: 'LOG005',
    transportPlanName: '盐田普船',
    expectedArrivalTime: '2026-06-10',
    actualSignTime: null,
    status: 1,
    statusName: '已发货',
    shipQty: 198,
    volume: 0.234,
    grossWeight: 72.6,
    unitFirstLegCost: 12.65,
    totalFirstLegCost: 3105,
    sourceWarehouseName: '深圳前置仓',
    destWarehouseName: 'FBA-ATL2'
  },
  {
    waybillNo: 'FEDEX8839201746',
    shipTime: '2026-05-02',
    shipmentNo: 'FBA202605020008',
    purchaseOrderNo: 'PO202605020008',
    logisticsProviderCode: 'LOG002',
    transportPlanName: '慢船',
    expectedArrivalTime: '2026-06-20',
    actualSignTime: null,
    status: 2,
    statusName: '运输中',
    shipQty: 69,
    volume: 0.082,
    grossWeight: 28.4,
    unitFirstLegCost: 8.35,
    totalFirstLegCost: 576,
    sourceWarehouseName: '惠州仓',
    destWarehouseName: 'FBA-SEA6'
  }
]

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function buildOrdersForProduct(product: BatchCostRow): BatchOrderDetailRow[] {
  return DEMO_ROWS.map((row, i) => ({
    ...row,
    id: `${product.id}-wb-${i}`,
    waybillId: 30000 + product.sku.length * 10 + i
  }))
}

function calcSummary(records: BatchOrderDetailRow[]): BatchOrderDetailSummary {
  const totalShipQty = records.reduce((s, r) => s + r.shipQty, 0)
  const totalWeight = round2(records.reduce((s, r) => s + r.grossWeight, 0))
  const totalFirstLegCost = round2(records.reduce((s, r) => s + r.totalFirstLegCost, 0))
  const weightedAvgUnitPrice = totalShipQty > 0 ? round2(totalFirstLegCost / totalShipQty) : 0

  const amountMap = new Map<string, number>()
  const qtyMap = new Map<string, number>()
  records.forEach((r) => {
    amountMap.set(
      r.transportPlanName,
      (amountMap.get(r.transportPlanName) || 0) + r.totalFirstLegCost
    )
    qtyMap.set(r.transportPlanName, (qtyMap.get(r.transportPlanName) || 0) + r.shipQty)
  })

  const amountByChannel = [...amountMap.entries()].map(([name, amount]) => ({
    name,
    amount: round2(amount)
  }))
  const avgByChannel = [...qtyMap.entries()].map(([name, qty]) => ({
    name,
    qty,
    avg: qty > 0 ? round2((amountMap.get(name) || 0) / qty) : 0
  }))

  return {
    batchCount: records.length,
    totalShipQty,
    totalWeight,
    totalFirstLegCost,
    weightedAvgUnitPrice,
    amountByChannel,
    avgByChannel
  }
}

function filterRecords(
  records: BatchOrderDetailRow[],
  query: BatchOrderDetailQuery
): BatchOrderDetailRow[] {
  return records.filter((row) => {
    if (query.channelNames?.length && !query.channelNames.includes(row.transportPlanName)) {
      return false
    }
    if (query.shipTimeFrom && row.shipTime < query.shipTimeFrom) return false
    if (query.shipTimeTo && row.shipTime > query.shipTimeTo) return false
    return true
  })
}

const detailCache = new Map<string, BatchOrderDetailRow[]>()

export async function fetchBatchOrderDetail(
  product: BatchCostRow,
  query: BatchOrderDetailQuery = {}
): Promise<BatchOrderDetailResult> {
  const current = query.current ?? 1
  const size = query.size ?? 50
  const dimension = query.dimension ?? 'sku'
  const code = dimension === 'sku' ? product.sku : product.spu
  const res: any = await logisticsCostBatchDetails({
    dimension,
    code,
    currentPage: current,
    pageSize: size,
    shipTimeStart: query.shipTimeFrom || '2026-04-01',
    shipTimeEnd: query.shipTimeTo || '2026-06-30',
    logisticsChannelNameList: query.channelNames || [],
    statusList: query.transportStatusList ?? []
  })
  const data = res.data || {}
  const summaryData = data.summary || {}
  const records = (data.records || []).map((row: any, index: number) => ({
    id: `${product.id}-wb-${index}`,
    waybillId: index + 1,
    waybillNo: row.waybillNo || '',
    sku: row.sku || '',
    skuName: row.skuName || '',
    shipTime: row.shipTime || '',
    shipmentNo: row.shipmentNo || '',
    purchaseOrderNo: row.purchaseOrderNo || '',
    logisticsProviderCode: row.logisticsProviderName || '',
    transportPlanName: row.logisticsChannelName || '',
    expectedArrivalTime: row.expectedArrivalTime || '',
    actualSignTime: row.signTime || null,
    statusName: row.status || '',
    shipQty: row.shippedQty || 0,
    volume: row.totalVolume || 0,
    grossWeight: row.totalWeight || 0,
    unitFirstLegCost: row.unitLogisticsCost || 0,
    totalFirstLegCost: row.totalLogisticsCost || 0,
    costType: row.costType,
    sourceWarehouseName: row.fromWarehouseName || '',
    destWarehouseName: row.toWarehouseName || '',
    billingMethod: row.billingMethod,
    transportMode: row.transportMode,
    logisticsPlanName: row.logisticsPlanName,
    gzNo: row.waybillNo || ''
  }))
  return {
    productCode: product.sku,
    summary: {
      batchCount: summaryData.batchCount || 0,
      totalShipQty: summaryData.shippedQty || 0,
      totalWeight: summaryData.chargeWeight || 0,
      totalFirstLegCost: summaryData.totalLogisticsCost || 0,
      weightedAvgUnitPrice: summaryData.weightedUnitLogisticsCost || 0,
      amountByChannel: (summaryData.channelBreakdowns || []).map((item: any) => ({
        name: item.channelName,
        amount: item.amount || 0
      })),
      avgByChannel: (summaryData.channelBreakdowns || []).map((item: any) => ({
        name: item.channelName,
        qty: item.quantity || 0,
        avg: item.weightedUnitLogisticsCost || 0
      }))
    },
    records,
    total: data.total || 0
  }
}

export const BATCH_DETAIL_STATUS_OPTIONS = STATUS_LIST.map((s) => ({
  label: s.name,
  value: s.status
}))

export const BATCH_DETAIL_CHANNEL_OPTIONS = ['空运', '盐田普船', '慢船', '美森正班'].map(
  (name, i) => ({
    label: name,
    value: String(i + 1)
  })
)
