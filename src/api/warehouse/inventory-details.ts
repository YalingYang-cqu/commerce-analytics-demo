import request from '@/utils/http'

/**
 * 库存明细-SCFBA产品库存分页列表
 */
export function inventoryProductPageF(params: any) {
  return request.post({
    url: `/ims/scfba/inventory/detail/product/list`,
    data: params
  })
}
/** 导出-SCFBA产品库存 */
export function inventoryProducExportF(params: any) {
  return request.post({
    url: `/ims/scfba/inventory/detail/product/export`,
    data: params
  })
}
/**
 * 库存明细--SCFBA批次库存分页列表
 */
export function inventoryBatchPageF(params: any) {
  return request.post({
    url: `/ims/scfba/inventory/detail/batch/list`,
    data: params
  })
}
/** 导出-SCFBA批次库存 */
export function inventoryBatchExportF(params: any) {
  return request.post({
    url: `/ims/scfba/inventory/detail/batch/export`,
    data: params
  })
}
/**
 * 库存明细-本地产品库存分页列表
 */
export function inventoryProductPageS(params: any) {
  return request.post({
    url: `/ims/ims-inventory/detail/page`,
    data: params
  })
}
/** 导出-本地产品库存 */
export function inventoryProducExportS(params: any) {
  return request.post({
    url: `/ims/ims-inventory/detail/export`,
    data: params
  })
}
/**
 * 库存明细-本地批次库存分页列表
 */
export function inventoryBatchPageS(params: any) {
  return request.post({
    url: `/ims/ims-inventory/batch-detail/page`,
    data: params
  })
}
/** 导出-本地批次库存 */
export function inventoryBatchExportS(params: any) {
  return request.post({
    url: `/ims/ims-inventory/batch-detail/export`,
    data: params
  })
}
/**
 * 库存明细-三方仓产品库存分页列表
 */
export function inventoryProductPageThirdParty(params: any) {
  return request.post({
    url: `/ims/ims-inventory/third-party/detail/page`,
    data: params
  })
}
/** 导出-三方仓产品库存 */
export function inventoryProducExportThirdParty(params: any) {
  return request.post({
    url: `/ims/ims-inventory/third-party/detail/export`,
    data: params
  })
}
/**
 * 库存明细-三方仓批次库存分页列表
 */
export function inventoryBatchPageThirdParty(params: any) {
  return request.post({
    url: `/ims/ims-inventory/third-party/batch-detail/page`,
    data: params
  })
}
/** 导出-三方仓批次库存 */
export function inventoryBatchExportThirdParty(params: any) {
  return request.post({
    url: `/ims/ims-inventory/third-party/batch-detail/export`,
    data: params
  })
}
/**
 * 在库锁定量-关联单据列表（出库单锁定占用）
 */
export function getInventoryLockedList(params: {
  companySubjectId: string | number
  inventoryAttribute: number
  productBasicId: string | number
  salesSku: string
  storeId: string | number
  warehouseId: string | number
}) {
  return request.post<{
    items: Array<{ orderNo: string; orderId: string; qty: number }>
    totalQty: number
  }>({
    url: `/ims/ims-inventory/locked-qty/detail`,
    data: params
  })
}

/**
 * 调拨在途量-关联单据列表（调拨单待收货）

 */
export function getInventoryTransferInTransitList(params: {
  companySubjectId: string | number
  inventoryAttribute: number
  productBasicId: string | number
  salesSku: string
  storeId: string | number
  warehouseId: string | number
}) {
  return request.post<{
    items: Array<{ orderNo: string; orderId: string; qty: number }>
    totalQty: number
  }>({
    url: `/ims/ims-inventory/transfer-transit-qty/detail`,
    data: params
  })
}
