import request from '@/utils/http'

/** 实时库存-SC FBA 分页 */
export function realTimeInventoryScFbaPage(params: any) {
  return request.post({
    url: `/ims/scfba/inventory/page/sku`,
    data: params
  })
}
/** 导出 SC FBA */
export function exportRealTimeInventoryScFba(params: any) {
  return request.post({
    url: `/ims/scfba/inventory/export`,
    data: params
  })
}

/** 实时库存-供应商仓 分页 */
export function realTimeInventorySupplierPage(params: any) {
  return request.post({
    url: `/ims/ims-inventory/supplier-warehouse/page`,
    data: params
  })
}

/** 导出供应商仓 */
export function exportRealTimeInventorySupplier(params: any) {
  return request.post({
    url: `/ims/ims-inventory/supplier-warehouse/export`,
    data: params
  })
}

/** 实时库存-VC FBA 分页(数据来源第三方系统) */
export function realTimeInventoryVcFbaPage(params: any) {
  return request.post({
    url: `/ims/vc-fba/inventory/page`,
    data: params
  })
}

/** 导出 VC FBA */
export function exportRealTimeInventoryVcFba(params: any) {
  return request.post({
    url: `/ims/vc-fba/inventory/export`,
    data: params
  })
}

/** 实时库存-三方仓 分页 */
export function realTimeInventoryThirdPartyPage(params: any) {
  return request.post({
    url: `/ims/ims-inventory/third-party-warehouse/page`,
    data: params
  })
}

/** 导出三方仓 */
export function exportRealTimeInventoryThirdParty(params: any) {
  return request.post({
    url: `/ims/ims-inventory/third-party-warehouse/export`,
    data: params
  })
}
