import request from '@/utils/http'
// 采购变更单列表
export function getChangeOrderList(params: any) {
  return request.post({
    url: `/pms/purchase-change-order/list`,
    params
  })
}

// 采购变更单状态统计（后端接收 param 或 param1，用 data 传 body 并包裹为 param 避免 500 Parameter 'scope' not found）
export function getChangeOrderStatusCount(params: any) {
  return request.post({
    url: `/pms/purchase-change-order/status-count`,
    data: { param: params }
  })
}
// 导出
export function exportChangeOrder(params: any) {
  return request.post({
    url: `/pms/purchase-change-order/export`,
    params
  })
}
// 批量提交采购变更单
export function batchSubmitChangeOrder(ids: number[]) {
  return request.post({
    url: `/pms/purchase-change-order/submit`,
    params: ids
  })
}

// 批量撤回审批
export function batchWithdrawChangeOrder(ids: number[]) {
  return request.post({
    url: `/pms/purchase-change-order/cancelSubmit`,
    params: ids
  })
}

// 批量删除采购变更单
export function batchDeleteChangeOrder(ids: number[]) {
  return request.post({
    url: `/pms/purchase-change-order/delete`,
    params: ids
  })
}

// 批量作废采购变更单
export function batchVoidChangeOrder(ids: number[]) {
  return request.post({
    url: `/pms/purchase-change-order/cancel`,
    params: ids
  })
}
// 保存/编辑变更单
export function saveChangeOrder(ids: number[]) {
  return request.post({
    url: `/pms/purchase-change-order/save`,
    params: ids
  })
}
// 保存提交变更单
export function submitChangeOrder(params: any) {
  return request.post({
    url: `/pms/purchase-change-order/save-and-submit`,
    params: params
  })
}

// 变更单详情
export function changeOrderDetail(params: any) {
  return request.get({
    url: `/pms/purchase-change-order/detail/${params.id}`
  })
}
// 采购变更单详情(全字段)
export function changeOrderDetailF(params: any) {
  return request.get({
    url: `/pms/purchase-change-order/detail-full/${params.id}`
  })
}
// 根据业务编号查询采购合同列表
export function getUpdateContracts(params: any) {
  return request.get({
    url: `/pms/purchase-change-order/contracts/business/${params.businessNo}`
  })
}
// 撤回合同
export function withdrawContract(params: any) {
  return request.post({
    url: `/pms/purchase-change-order/contracts/withdraw/${params.contractId}`
  })
}
// 根据合同ID推送采购合同
export function pushContract(params: any) {
  return request.post({
    url: `/pms/purchase-change-order/contracts/push/${params.contractId}`
  })
}
// 重新生成采购合同
export function createContract(params: any) {
  return request.post({
    url: `/pms/purchase-change-order/generate-contract/${params.orderId}/${params.contractId}`
  })
}

// 更新采购合同文件
export function updateContractFile(params: { contractId: number; fileUrl: string }) {
  return request.post({
    url: `/pms/purchase-change-order/contracts/update-excel/${params.contractId}`,
    params: { contractId: params.contractId, excelFilePath: params.fileUrl }
  })
}
// 根据业务编号查询采购合同列表
export function getContracts(params: any) {
  return request.get({
    url: `/pms/purchase-change-order/contracts/business/${params.businessNo}`
  })
}
// 更新变更采购订单
export function editFields(params: any) {
  return request.put({
    url: `/pms/purchase-change-order/update/${params.id}`,
    params
  })
}
