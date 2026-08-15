/* eslint-disable @typescript-eslint/no-unused-vars */
import dayjs from 'dayjs'
import type { BatchCostRow, DimensionType } from './mock-data'
import { purchaseCostOrderDetails } from '@/api/purchase/batch-cost'

export interface BatchOrderDetailRow {
  id: string
  purchaseOrderId: number
  orderNo: string
  /** SPU 维度下展示的具体 SKU 编码 */
  sku?: string
  /** SPU 维度下展示的具体 SKU 名称 */
  skuName?: string
  orderTime: string
  supplierName: string
  warehouseName: string
  status: number
  statusName: string
  purchaseQty: number
  inboundQty: number
  pendingQty: number
  unitPriceExcludingTax: number
  taxRate: number
  unitPriceIncludingTax: number
  amountExcludingTax: number
  taxAmount: number
  amountIncludingTax: number
  overdueDays: number
  purchaseManagerName: string
}

export interface SupplierAmountItem {
  name: string
  amount: number
}

export interface SupplierAvgItem {
  name: string
  qty: number
  avg: number
}

export interface BatchOrderDetailSummary {
  orderCount: number
  totalPurchaseQty: number
  totalInboundQty: number
  totalAmountIncludingTax: number
  weightedAvgPrice: number
  amountBySupplier: SupplierAmountItem[]
  avgBySupplier: SupplierAvgItem[]
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
  orderTimeFrom?: string | null
  orderTimeTo?: string | null
  /** 后端按名称过滤的供应商列表 */
  supplierNameList?: string[]
  /** 后端按名称过滤的采购单状态列表，如 ['已完成','交货中'] */
  orderStatusList?: string[]
  /** @deprecated 保留以兼容本地 mock filterRecords，不再用于请求 */
  supplierIdList?: (string | number)[]
  /** @deprecated 保留以兼容本地 mock filterRecords，不再用于请求 */
  statusList?: (string | number)[]
  current?: number
  size?: number
  pageSize?: number
  /** 统计维度：与主列表一致（sku | spu），决定 code 取 sku 还是 spu */
  dimension?: DimensionType
}

const SUPPLIERS = ['联恒制造', '兴源电子', '华强北科技', '深圳优品', '东莞智造', '广州恒达']
const WAREHOUSES = ['深圳总仓', '东莞仓', '惠州仓', '广州仓']
const STATUS_LIST = [
  { status: 6, name: '已完成' },
  { status: 5, name: '交货中' },
  { status: 4, name: '待交货' }
]

/** 演示用固定订单号（与设计稿一致） */
const DEMO_ORDER_NOS = [
  'PO202305190002',
  'PO202305190003',
  'PO202305190004',
  'PO202305190005',
  'PO202305190006',
  'PO202305190007',
  'PO202305190008',
  'PO202305190009'
]

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function buildOrdersForProduct(product: BatchCostRow): BatchOrderDetailRow[] {
  const seed = product.sku.length
  const count = 8
  const rows: BatchOrderDetailRow[] = []

  for (let i = 0; i < count; i++) {
    const purchaseQty = [183, 120, 95, 210, 88, 156, 142, 188][i] ?? 100
    const inboundQty = purchaseQty
    const pendingQty = 0
    const unitEx = round2(11 + (i % 3) * 0.5)
    const taxRate = 13
    const unitIn = round2(unitEx * (1 + taxRate / 100))
    const amountEx = round2(unitEx * purchaseQty)
    const taxAmount = round2(amountEx * (taxRate / 100))
    const amountIn = round2(amountEx + taxAmount)
    const statusItem = STATUS_LIST[0]

    rows.push({
      id: `${product.id}-order-${i}`,
      purchaseOrderId: 10000 + seed * 10 + i,
      orderNo: DEMO_ORDER_NOS[i] || `PO20230519${String(i + 1).padStart(4, '0')}`,
      orderTime: dayjs('2023-05-18').subtract(i, 'day').format('YYYY-MM-DD'),
      supplierName: SUPPLIERS[0],
      warehouseName: WAREHOUSES[(seed + i) % WAREHOUSES.length],
      status: statusItem.status,
      statusName: statusItem.name,
      purchaseQty,
      inboundQty,
      pendingQty,
      unitPriceExcludingTax: unitEx,
      taxRate,
      unitPriceIncludingTax: unitIn,
      amountExcludingTax: amountEx,
      taxAmount,
      amountIncludingTax: amountIn,
      overdueDays: 0,
      purchaseManagerName: '陈青桐'
    })
  }
  return rows
}

function calcSummary(records: BatchOrderDetailRow[]): BatchOrderDetailSummary {
  const totalPurchaseQty = records.reduce((s, r) => s + r.purchaseQty, 0)
  const totalInboundQty = records.reduce((s, r) => s + r.inboundQty, 0)
  const totalAmountIncludingTax = round2(records.reduce((s, r) => s + r.amountIncludingTax, 0))
  const weightedAvgPrice =
    totalPurchaseQty > 0 ? round2(totalAmountIncludingTax / totalPurchaseQty) : 0

  const amountMap = new Map<string, number>()
  const qtyMap = new Map<string, number>()
  records.forEach((r) => {
    amountMap.set(r.supplierName, (amountMap.get(r.supplierName) || 0) + r.amountIncludingTax)
    qtyMap.set(r.supplierName, (qtyMap.get(r.supplierName) || 0) + r.purchaseQty)
  })

  const amountBySupplier = [...amountMap.entries()].map(([name, amount]) => ({
    name,
    amount: round2(amount)
  }))
  const avgBySupplier = [...qtyMap.entries()].map(([name, qty]) => ({
    name,
    qty,
    avg: qty > 0 ? round2((amountMap.get(name) || 0) / qty) : 0
  }))

  return {
    orderCount: records.length,
    totalPurchaseQty,
    totalInboundQty,
    totalAmountIncludingTax,
    weightedAvgPrice,
    amountBySupplier,
    avgBySupplier
  }
}

function filterRecords(
  records: BatchOrderDetailRow[],
  query: BatchOrderDetailQuery
): BatchOrderDetailRow[] {
  return records.filter((row) => {
    if (query.statusList?.length && !query.statusList.includes(row.status)) {
      return false
    }
    if (query.supplierIdList?.length) {
      // mock：供应商 id 与名称下标对应
      const idx = SUPPLIERS.indexOf(row.supplierName)
      if (idx >= 0 && !query.supplierIdList.includes(String(idx + 1))) {
        return false
      }
    }
    if (query.orderTimeFrom && row.orderTime < query.orderTimeFrom) return false
    if (query.orderTimeTo && row.orderTime > query.orderTimeTo) return false
    return true
  })
}

/** 模拟接口：按 SKU 查询采购订单明细（带内存缓存） */
const detailCache = new Map<string, BatchOrderDetailRow[]>()

export async function fetchBatchOrderDetail(
  product: BatchCostRow,
  query: BatchOrderDetailQuery = {}
): Promise<BatchOrderDetailResult> {
  console.log(query, 'queryquery')
  const current = query.current ?? 1
  const size = query.pageSize ?? 20
  const dimension = query.dimension ?? 'sku'
  const code = dimension === 'sku' ? product.sku : product.spu
  const res: any = await purchaseCostOrderDetails({
    dimension,
    code,
    currentPage: current,
    pageSize: size,
    orderReceiveTimeStart: query.orderTimeFrom || '2026-04-01',
    orderReceiveTimeEnd: query.orderTimeTo || '2026-06-30',
    supplierNameList: query.supplierNameList ?? [],
    orderStatusList: query.orderStatusList ?? []
  })
  const data = res.data || {}
  const summaryData = data.summary || {}
  const records = (data.records || []).map((row: any, index: number) => ({
    id: `${product.id}-order-${index}`,
    purchaseOrderId: index + 1,
    orderNo: row.purchaseOrderNo || '',
    sku: row.sku || '',
    skuName: row.skuName || '',
    orderTime: row.orderReceiveTime || '',
    supplierName: row.supplierName || '',
    warehouseName: '',
    status: row.orderStatus === '已完成' ? 6 : row.orderStatus === '交货中' ? 5 : 4,
    statusName: row.orderStatus || '',
    purchaseQty: row.purchaseQty || 0,
    inboundQty: row.deliveredQty || 0,
    pendingQty: row.pendingQty || 0,
    unitPriceExcludingTax: row.unitPriceExcludingTax || 0,
    taxRate: row.taxRate ?? null,
    unitPriceIncludingTax: row.unitPriceIncludingTax || 0,
    amountExcludingTax: row.totalAmountExcludingTax || 0,
    taxAmount: row.taxAmount || 0,
    amountIncludingTax: row.totalAmount || 0,
    isOverdue: row.isOverdue,
    deliveryDate: row.completeTime,
    completeTime: row.completeTime,
    expectDeliveryDate: row.expectDeliveryDate,
    itemDeliveryRate:
      typeof row.itemDeliveryRate === 'number' ? `${row.itemDeliveryRate * 100}%` : '',
    overdueDays: row.daysOverdue || 0,
    purchaseManagerName: Array.isArray(row.purchaseManager)
      ? row.purchaseManager.join('、')
      : JSON.parse(row.purchaseManager).join('、') || ''
  }))
  return {
    productCode: product.sku,
    summary: {
      orderCount: summaryData.orderCount || 0,
      totalPurchaseQty: summaryData.purchaseQty || 0,
      totalInboundQty: summaryData.deliveredQty || 0,
      totalAmountIncludingTax: summaryData.totalAmount || 0,
      weightedAvgPrice: summaryData.weightedUnitPrice || 0,
      amountBySupplier: (summaryData.supplierBreakdowns || []).map((item: any) => ({
        name: item.supplierName,
        amount: item.actualAmount || item.deliveredCostAmount || item.amount || 0
      })),
      avgBySupplier: (summaryData.supplierBreakdowns || []).map((item: any) => ({
        name: item.supplierName,
        qty: item.quantity || 0,
        avg: item.weightedUnitPrice || 0
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

export const BATCH_DETAIL_SUPPLIER_OPTIONS = SUPPLIERS.map((name, i) => ({
  label: name,
  value: String(i + 1)
}))
