import request from '@/utils/http'
import { normalizeQueryRangeStartEnd } from '@/utils/datetime-range'

/** 将多选 ID 转为数字数组（无效项丢弃） */
function toIntIdList(list: unknown): number[] {
  if (!Array.isArray(list) || list.length === 0) return []
  return list.map((x) => Number(x)).filter((n) => Number.isFinite(n))
}

/** 库存流水-产品：searchType 与接口枚举对齐（见 InventoryFlowPageSearchVo） */
const FLOW_PRODUCT_SEARCH: Record<string, string> = {
  sku: 'SKU',
  spu: 'SPU',
  salesSku: 'SALES_SKU',
  businessDocumentNo: 'BUSINESS_ORDER_NO',
  executeDocumentNo: 'EXECUTE_ORDER_NO'
}

/** 库存流水-批次：searchType 与接口枚举对齐 */
const FLOW_BATCH_SEARCH: Record<string, string> = {
  batchNo: 'BATCH_NO',
  sku: 'SKU',
  spu: 'SPU',
  salesSku: 'SALES_SKU',
  businessDocumentNo: 'BUSINESS_ORDER_NO',
  executeDocumentNo: 'EXECUTE_ORDER_NO'
}

/**
 * 组装 IMS 普通库存流水查询 vo（POST body: { vo }）
 */
export function buildImsInventoryFlowVo(raw: Record<string, any>, mode: 'product' | 'batch') {
  const searchTypeKey = String(raw.searchType || (mode === 'batch' ? 'batchNo' : 'sku'))
  const searchValue = String(raw.searchValue ?? '').trim()
  const map = mode === 'product' ? FLOW_PRODUCT_SEARCH : FLOW_BATCH_SEARCH
  const searchType = searchValue
    ? map[searchTypeKey] || (mode === 'product' ? 'SKU' : 'BATCH_NO')
    : ''

  let orderTimeStart = raw.orderTimeStart || ''
  let orderTimeEnd = raw.orderTimeEnd || ''
  if (
    !orderTimeStart &&
    raw.documentTimeRange &&
    Array.isArray(raw.documentTimeRange) &&
    raw.documentTimeRange.length === 2
  ) {
    orderTimeStart = raw.documentTimeRange[0]
    orderTimeEnd = raw.documentTimeRange[1]
  }

  if (orderTimeStart && orderTimeEnd) {
    ;[orderTimeStart, orderTimeEnd] = normalizeQueryRangeStartEnd(
      String(orderTimeStart),
      String(orderTimeEnd)
    )
  }

  const businessType =
    Array.isArray(raw.businessTypeList) && raw.businessTypeList.length
      ? String(raw.businessTypeList[0])
      : raw.businessType || ''

  return {
    currentPage: raw.currentPage,
    pageSize: raw.pageSize,
    hasCount: raw.hasCount ?? true,
    orderBy: raw.orderBy || 'orderTime desc',
    searchType,
    searchValue,
    businessType,
    warehouseIds: toIntIdList(raw.warehouseIdList),
    companySubjectIds: toIntIdList(raw.companySubjectIdList),
    storeIds: Array.isArray(raw.storeIdList) ? raw.storeIdList.map((x: any) => String(x)) : [],
    brandIds: toIntIdList(raw.brandIdList),
    categoryIds: toIntIdList(raw.categoryIdList),
    orderTimeStart,
    orderTimeEnd
  }
}

/** SC-FBA 流水：POST body: { queryDto } */
export function buildScFbaInventoryFlowQueryDto(
  raw: Record<string, any>,
  mode: 'product' | 'batch'
) {
  let orderTimeStart = raw.orderTimeStart || ''
  let orderTimeEnd = raw.orderTimeEnd || ''
  if (
    !orderTimeStart &&
    raw.documentTimeRange &&
    Array.isArray(raw.documentTimeRange) &&
    raw.documentTimeRange.length === 2
  ) {
    orderTimeStart = raw.documentTimeRange[0]
    orderTimeEnd = raw.documentTimeRange[1]
  }

  if (orderTimeStart && orderTimeEnd) {
    ;[orderTimeStart, orderTimeEnd] = normalizeQueryRangeStartEnd(
      String(orderTimeStart),
      String(orderTimeEnd)
    )
  }

  const q: Record<string, any> = {
    currentPage: raw.currentPage,
    pageSize: raw.pageSize,
    hasCount: raw.hasCount ?? true,
    orderBy: raw.orderBy || 'orderTime desc',
    warehouseIds: toIntIdList(raw.warehouseIdList),
    companyEntityIds: toIntIdList(raw.companySubjectIdList),
    storeIds: toIntIdList(raw.storeIdList),
    brandIds: toIntIdList(raw.brandIdList),
    categoryIds: toIntIdList(raw.categoryIdList),
    businessTypes: Array.isArray(raw.businessTypeList) ? raw.businessTypeList.map(String) : [],
    orderTimeStart,
    orderTimeEnd,
    batchNo: '',
    businessOrderNo: '',
    salesSku: '',
    skuCode: '',
    skuName: '',
    spuCode: '',
    spuName: ''
  }

  const v = String(raw.searchValue ?? '').trim()
  if (v) {
    const st = String(raw.searchType || (mode === 'batch' ? 'batchNo' : 'sku'))
    if (st === 'sku') q.skuCode = v
    else if (st === 'spu') q.spuCode = v
    else if (st === 'salesSku') q.salesSku = v
    else if (st === 'businessDocumentNo') q.businessOrderNo = v
    else if (st === 'productChineseName') q.skuName = v
    else if (st === 'spuName') q.spuName = v
    else if (st === 'batchNo' && mode === 'batch') q.batchNo = v
  }

  return q
}

/** 库存流水-产品分页 */
export function inventoryFlowProductPage(params: any) {
  return request.post({
    url: `/ims/ims-inventory/flow/page`,
    data: buildImsInventoryFlowVo(params, 'product') as any
  })
}

/** 库存流水-产品异步导出 */
export function inventoryFlowProductExport(params: any) {
  return request.post({
    url: `/ims/ims-inventory/flow/export`,
    data: buildImsInventoryFlowVo(params, 'product')
  })
}

/** 库存流水-批次分页 */
export function inventoryFlowBatchPage(params: any) {
  return request.post({
    url: `/ims/ims-inventory/batch-flow/page`,
    data: buildImsInventoryFlowVo(params, 'batch') as any
  })
}

/** 库存流水-批次异步导出 */
export function inventoryFlowBatchExport(params: any) {
  return request.post({
    url: `/ims/ims-inventory/batch-flow/export`,
    data: buildImsInventoryFlowVo(params, 'batch')
  })
}

/** 三方仓-产品库存流水分页 */
export function inventoryFlowProductThirdPartyPage(params: any) {
  return request.post({
    url: `/ims/ims-inventory/third-party/flow/page`,
    data: buildImsInventoryFlowVo(params, 'product') as any
  })
}

/** 三方仓-产品库存流水异步导出 */
export function inventoryFlowProductThirdPartyExport(params: any) {
  return request.post({
    url: `/ims/ims-inventory/third-party/flow/export`,
    data: buildImsInventoryFlowVo(params, 'product')
  })
}

/** 三方仓-批次库存流水分页 */
export function inventoryFlowBatchThirdPartyPage(params: any) {
  return request.post({
    url: `/ims/ims-inventory/third-party/batch-flow/page`,
    data: buildImsInventoryFlowVo(params, 'batch') as any
  })
}

/** 三方仓-批次库存流水异步导出 */
export function inventoryFlowBatchThirdPartyExport(params: any) {
  return request.post({
    url: `/ims/ims-inventory/third-party/batch-flow/export`,
    data: buildImsInventoryFlowVo(params, 'batch')
  })
}

/** SC-FBA 产品库存流水分页 */
export function inventoryFlowProductScFbaPage(params: any) {
  return request.post({
    url: `/ims/scfba/inventory/flow/product/list`,
    data: buildScFbaInventoryFlowQueryDto(params, 'product')
  })
}

/** SC-FBA 产品库存流水异步导出 */
export function inventoryFlowProductScFbaExport(params: any) {
  return request.post({
    url: `/ims/scfba/inventory/flow/product/export`,
    data: buildScFbaInventoryFlowQueryDto(params, 'product')
  })
}

/** SC-FBA 批次库存流水分页 */
export function inventoryFlowBatchScFbaPage(params: any) {
  return request.post({
    url: `/ims/scfba/inventory/flow/batch/list`,
    data: buildScFbaInventoryFlowQueryDto(params, 'batch') as any
  })
}

/** SC-FBA 批次库存流水异步导出 */
export function inventoryFlowBatchScFbaExport(params: any) {
  return request.post({
    url: `/ims/scfba/inventory/flow/batch/export`,
    data: buildScFbaInventoryFlowQueryDto(params, 'batch') as any
  })
}
