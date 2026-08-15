import request from '@/utils/http'

// 获取需求单详情
export function getReplenishmentDetail(params: any) {
  return request.get({
    url: `/pms/replenishment-request/detail/${params.id}`
  })
}
// 获取需求单详情(不脱敏)
export function getReplenishmentDetailFull(params: any) {
  return request.get({
    url: `/pms/replenishment-request/noDesensitizationDetail/${params.id}`
  })
}
// 创建采购单
export function saveSingleOrder(params: any) {
  return request.post({
    url: `/pms/purchase-order/save`,
    params
  })
}
// 采购单列表
export function getOrderList(params: any) {
  return request.post({
    url: `/pms/purchase-order/list`,
    params
  })
}
// 明细行更新标签资料
export function updateLabel(params: any) {
  return request.post({
    url: `/pms/purchase-order/updateItemTag`,
    params
  })
}

/** 采购订单明细行：发货计划锁定分配明细（itemId = purchase_order_item.id） */
export function getPurchaseOrderItemAllocationDetails(itemId: number) {
  return request.get({
    url: `/pms/purchase-order/item/${itemId}/allocation-details`
  })
}
// 各状态数量统计
export function statusCount(params: any) {
  return request.post({
    url: `/pms/purchase-order/status-count`,
    params
  })
}
// 获取采购单详情
export function getOrderDetail(id: number) {
  return request.get({
    url: `/pms/purchase-order/detail/${id}`
  })
}
// 获取采购单详情-不脱敏
export function getOrderFullDetail(id: number) {
  return request.get({
    url: `/pms/purchase-order/detail-full/${id}`
  })
}
// 更新采购单字段
export function updateOrderField(params: any) {
  return request.post({
    url: `/pms/purchase-order/update`,
    params
  })
}

// 撤回
export function withdrawnOrder(ids: number[]) {
  return request.post({
    url: `/pms/purchase-order/withdrawn-order`,
    params: ids
  })
}
// 作废下单
export function cancelOrder(ids: number[]) {
  return request.post({
    url: `/pms/purchase-order/cancel`,
    params: ids
  })
}
// 作废订单
export function voidOrder(ids: number[]) {
  return request.post({
    url: `/pms/purchase-order/void`,
    params: { ids }
  })
}
// 删除订单
export function deleteOrder(ids: number[]) {
  return request.post({
    url: `/pms/purchase-order/delete`,
    params: ids
  })
}
// 下单
export function placeOrder(ids: number[]) {
  return request.post({
    url: `/pms/purchase-order/place-order`,
    params: ids
  })
}
// 批量生成采购单
export function saveBatch(params: any) {
  return request.post({
    url: `/pms/purchase-order/save-batch`,
    params
  })
}

// 根据业务编号查询采购合同列表
export function getContracts(params: any) {
  return request.get({
    url: `/pms/purchase-order/contracts/business/${params.businessNo}`
  })
}

// 根据合同ID推送采购合同
export function pushContract(params: any) {
  return request.post({
    url: `/pms/purchase-order/contracts/push/${params.contractId}`
  })
}
// 撤回采购合同
export function withdrawContract(params: any) {
  return request.post({
    url: `/pms/purchase-order/contracts/withdraw/${params.contractId}`
  })
}
// 重新生成采购合同
export function createContract(params: any) {
  return request.post({
    url: `/pms/purchase-order/generate-contract/${params.orderId}/${params.contractId}`
  })
}

/** 采购上传纸质签章合同并自动推送（内部状态推送失败等场景） */
export function uploadContractsAndPush(
  contractId: number,
  dto: { contractId: number; contractPdfFileUrl: string }
) {
  return request.post<any>({
    url: `/pms/purchase-order/uploadContracts/${contractId}`,
    data: dto,
    showSuccessMessage: false
  })
}

/** 审批供应商上传合同（true-通过，false-退回） */
export function approvalSupplierContract(dto: {
  contractId: number
  explanation?: string
  isApproved: boolean
}) {
  return request.post<any>({
    url: `/pms/purchase-order/approvalSupplierContract`,
    data: dto,
    showSuccessMessage: false
  })
}

// 更新采购合同文件
export function updateContractFile(params: { contractId: number; fileUrl: string }) {
  return request.post({
    url: `/pms/purchase-order/contracts/update-file/${params.contractId}`,
    params: { fileUrl: params.fileUrl }
  })
}

// 更新采购合同Excel文件路径
export function updateContractExcel(params: { contractId: number; excelFilePath: string }) {
  return request.post({
    url: `/pms/purchase-order/contracts/update-excel/${params.contractId}`,
    params: { excelFilePath: params.excelFilePath, contractId: params.contractId }
  })
}
// 查询交货计划列表
export function getDeliveryPlan(params: any) {
  return request.get({
    url: `/pms/purchase-order/delivery-plan/list`,
    params
  })
}
// 导出
export function purchaseOrderExport(params: any) {
  return request.post({
    url: `/pms/purchase-order/export`,
    params
  })
}
// 查看选择的商品
export function querySelectSkus(params: any) {
  return request.post({
    url: `/basic/product/sku/page`,
    params
  })
}
// 更新采购订单
export function editFields(params: any) {
  return request.put({
    url: `/pms/purchase-order/update/${params.id}`,
    params
  })
}
