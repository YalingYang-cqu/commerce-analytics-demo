/**
 * 调拨单模块 API (基于 wms 服务)
 * 接口文档: diaobo.api.md
 * @updated 2026-01-22 - 严格按照API文档实现
 */

import request from '@/utils/http'

// ==================== 类型定义 ====================

/** 附件类型 */
export interface AttachmentVo {
  name: string
  uid: string
  url: string
}

/** 状态统计类型 */
export interface StatusCountVo {
  count: number
  status: number
  statusName: string
}

/** 调拨单列表项类型 */
export interface TransferOrderListVo {
  attachments?: AttachmentVo[]
  createTime: string
  creatorName: string
  destWarehouseName: string
  id: number
  inquiryNo?: string
  logisticsChannelName?: string
  logisticsProviderName?: string
  plannedShippingTime?: string
  responsiblePersonIds?: number[]
  responsiblePersonNames?: string[]
  shippingPlanBatchNo?: string
  shippingPlanNo?: string
  sourceWarehouseName: string
  status: number
  statusName: string
  totalBoxes: number
  totalReceivedQty: number
  totalShippedQty: number
  totalTransferQty: number
  transferOrderNo: string
  transportMethod?: string
}

/** 调拨单明细项类型 */
export interface TransferOrderItemVo {
  asin?: string
  associatedShipments?: any[]
  boxGrossWeight?: number
  boxHeight?: number
  boxLength?: number
  boxWidth?: number
  brandName?: string
  categoryName?: string
  fnsku?: string
  id: number
  imageUrl?: string
  labelMaterial?: AttachmentVo[]
  materialCode?: string
  numberOfBoxes?: number
  platform?: string
  productRemark?: string
  quantityPerBox?: number
  receivedQty: number
  region?: string
  salesSku?: string
  shippedQty: number
  skuCode: string
  skuId: number
  skuName: string
  spuCode?: string
  spuName?: string
  storeName?: string
  totalVolume?: number
  totalWeight?: number
  transferOrderId: number
  transferQty: number
}

/** 调拨单日志类型 */
export interface TransferOrderLogVo {
  id: number
  operationDetail: string
  operationSource: number
  operationSourceName: string
  operationTime: string
  operationType: string
  operationTypeName: string
  operatorName: string
}

/** 调拨单详情类型 */
export interface TransferOrderDetailVo {
  actualArrivalTime?: string
  actualShippingTime?: string
  attachments?: AttachmentVo[]
  cancelReason?: string
  cancelTime?: string
  cancelUserName?: string
  completeTime?: string
  completeUserName?: string
  createOrderTime?: string
  createOrderUserName?: string
  createTime: string
  creatorName: string
  destEntityName?: string
  destWarehouseId: number
  destWarehouseName: string
  documentRemark?: string
  estimatedArrivalTime?: string
  id: number
  inquiryNo?: string
  isFbaWarehouse?: boolean
  items: TransferOrderItemVo[]
  logisticsChannelName?: string
  logisticsProviderName?: string
  logs?: TransferOrderLogVo[]
  plannedShippingTime?: string
  readyToShipTime?: string
  receiptTime?: string
  receiptUserName?: string
  responsiblePersonIds?: number[]
  responsiblePersonNames?: string[]
  shippedTime?: string
  shippingPlanBatchNo?: string
  shippingPlanItemId?: number
  shippingPlanNo?: string
  sourceEntityName?: string
  sourceWarehouseId: number
  sourceWarehouseName: string
  status: number
  statusName: string
  supplierShippingOrderNo?: string
  totalBoxes: number
  totalReceivedQty: number
  totalShippedQty: number
  totalTransferQty: number
  totalVolume?: number
  totalWeight?: number
  transferOrderNo: string
  transportMethod?: string
}

/** 查询参数类型 */
export interface TransferOrderQueryParams {
  createTimeEnd?: string
  createTimeStart?: string
  destWarehouseId?: number
  logisticsChannelId?: number
  logisticsProviderId?: number
  pageNum?: number
  pageSize?: number
  responsiblePersonId?: number
  shippingPlanNo?: string
  sourceWarehouseId?: number
  status?: number
  transferOrderNo?: string
  transportMethod?: string
}

// ==================== 列表相关 ====================

/**
 * 分页查询调拨单列表
 * GET /wms/api/v1/transfer-orders
 */
export function getTransferList(params: TransferOrderQueryParams) {
  return request
    .get<any>({
      url: '/wms/api/v1/transfer-orders',
      params
    })
    .then((response) => {
      // 响应结构: { code: 200, data: { current, pages, records, size, total }, msg, success }
      const data = response?.data || response
      return {
        records: (data?.records || []) as TransferOrderListVo[],
        total: data?.total || 0,
        current: data?.current || params.pageNum || 1,
        size: data?.size || params.pageSize || 20,
        pages: data?.pages || 0
      }
    })
}

/**
 * 获取各状态数量统计
 * GET /wms/api/v1/transfer-orders/status-count
 */
export function getTransferStatusCount(params?: TransferOrderQueryParams) {
  return request
    .get<any>({
      url: '/wms/api/v1/transfer-orders/status-count',
      params
    })
    .then((response) => {
      // 响应结构: { code: 200, data: [{ count, status, statusName }], msg, success }
      const data = response?.data || response
      return (Array.isArray(data) ? data : []) as StatusCountVo[]
    })
}

/**
 * 导出调拨单
 * POST /wms/api/v1/transfer-orders/export
 */
export function exportTransfer(params: TransferOrderQueryParams) {
  return request.exportPost<Blob>({
    url: '/wms/api/v1/transfer-orders/export',
    data: params
  })
}

// ==================== 详情相关 ====================

/**
 * 获取调拨单详情
 * GET /wms/api/v1/transfer-orders/{id}
 */
export function getTransferDetail(id: number) {
  return request
    .get<any>({
      url: `/wms/api/v1/transfer-orders/${id}`
    })
    .then((response) => {
      // 响应结构: { code: 200, data: TransferOrderDetailVo, msg, success }
      const data = response?.data || response
      return data as TransferOrderDetailVo
    })
}

// ==================== 操作相关 ====================

/**
 * 作废调拨单
 * POST /wms/api/v1/transfer-orders/{id}/cancel
 */
export function cancelTransfer(id: number, reason: string) {
  return request.post<any>({
    url: `/wms/api/v1/transfer-orders/${id}/cancel`,
    data: {
      reason,
      transferOrderId: id
    }
  })
}

/**
 * 批量作废调拨单（循环调用单个作废接口）
 */
export async function batchCancelTransfer(ids: number[], reason: string) {
  const results = await Promise.all(ids.map((id) => cancelTransfer(id, reason)))
  return results
}

/**
 * 确认收货
 * POST /wms/api/v1/transfer-orders/{id}/confirm-receipt
 */
export function confirmReceipt(id: number, items: Array<{ itemId: number; receivedQty: number }>) {
  return request.post<any>({
    url: `/wms/api/v1/transfer-orders/${id}/confirm-receipt`,
    data: {
      transferOrderId: id,
      items
    }
  })
}

/**
 * 批量收货
 * POST /wms/api/v1/transfer-orders/batch-receipt
 */
export function batchReceipt(transferOrderIds: number[]) {
  return request.post<any>({
    url: '/wms/api/v1/transfer-orders/batch-receipt',
    data: { transferOrderIds }
  })
}

/**
 * 结束收货
 * POST /wms/api/v1/transfer-orders/{id}/end-receipt
 */
export function endReceipt(id: number) {
  return request.post<any>({
    url: `/wms/api/v1/transfer-orders/${id}/end-receipt`
  })
}

/**
 * 批量结束收货（循环调用单个结束收货接口）
 */
export async function batchEndReceipt(ids: number[]) {
  const results = await Promise.all(ids.map((id) => endReceipt(id)))
  return results
}

/**
 * 更新负责人
 * PUT /wms/api/v1/transfer-orders/{id}/responsible-persons
 */
export function updateResponsiblePersons(id: number, responsiblePersonIds: number[]) {
  return request.put<any>({
    url: `/wms/api/v1/transfer-orders/${id}/responsible-persons`,
    data: {
      transferOrderId: id,
      responsiblePersonIds
    }
  })
}

/**
 * 上传附件
 * POST /wms/api/v1/transfer-orders/{id}/attachments
 */
export function uploadAttachments(id: number, attachmentJson: string) {
  return request.post<any>({
    url: `/wms/api/v1/transfer-orders/${id}/attachments`,
    data: attachmentJson
  })
}

/**
 * 删除附件
 * DELETE /wms/api/v1/transfer-orders/{id}/attachments
 */
export function deleteAttachment(id: number, attachmentUrl: string) {
  return request.del<any>({
    url: `/wms/api/v1/transfer-orders/${id}/attachments`,
    params: { attachmentUrl }
  })
}

/**
 * 从发货计划生成调拨单
 * POST /wms/api/v1/transfer-orders/generate
 */
export function generateTransferOrder(params: {
  batchIds: number[]
  documentRemark?: string
  responsiblePersonIds?: number[]
}) {
  return request
    .post<any>({
      url: '/wms/api/v1/transfer-orders/generate',
      data: params
    })
    .then((response) => {
      const data = response?.data || response
      return (Array.isArray(data) ? data : []) as number[]
    })
}
