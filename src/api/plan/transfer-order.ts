import request from '@/utils/http'

// 调拨单分页列表
export function getTransferOrders(params: any) {
  return request.post({
    url: `/wms/transfer-orders/page`,
    data: params
  })
}
// 获取各状态数量统计
export function getTransferStatusCount(params: any) {
  return request.post({
    url: `/wms/transfer-orders/statusCount`,
    data: params
  })
}
// 收货
export function pickup(params: any) {
  return request.post({
    url: `/wms/transfer-orders/pickup`,
    data: params
  })
}
// 结束收货
export function completed(params: any) {
  return request.post({
    url: `/wms/transfer-orders/changeStatusBatch/completed`,
    data: params
  })
}
// 异步导出调拨单
export function exportTransfer(params: any) {
  return request.post({
    url: `/wms/transfer-orders/export`,
    data: params
  })
}
// 详情
export function transferDetail(params: any) {
  return request.post({
    url: `/wms/transfer-orders/detail`,
    data: params
  })
}
// 更新负责人
export function responsiblePersonsUpdate(params: any) {
  return request.put({
    url: `/wms/transfer-orders/responsible-persons`,
    data: params
  })
}
// 明细行更新标签资料
export function updateItemLabelMaterial(params: any) {
  return request.post({
    url: `/wms/transfer-orders/updateItemLabelMaterial`,
    data: params
  })
}
