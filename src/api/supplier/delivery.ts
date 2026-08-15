import request from '@/utils/http'
import type { Api } from '@/typings/api'

/**
 * 供应商端发货单模块 API
 */

// ==================== 列表相关 ====================

/**
 * 获取发货单列表
 */
export const getDeliveryList = (params: Api.SupplierDelivery.QueryParams) => {
  return request.post<Api.Common.PaginatedResponse<Api.SupplierDelivery.ListItem>>(
    '/supplier/delivery/page',
    params
  )
}

/**
 * 获取发货单状态统计
 */
export const getDeliveryStatusCount = (params?: Partial<Api.SupplierDelivery.QueryParams>) => {
  return request.post<Record<string, number>>('/supplier/delivery/statusCount', params || {})
}

/**
 * 导出发货单
 */
export const exportDelivery = (params: Api.SupplierDelivery.QueryParams) => {
  return request.post('/supplier/delivery/export', params, { responseType: 'blob' })
}

// ==================== 详情相关 ====================

/**
 * 获取发货单详情
 */
export const getDeliveryDetail = (id: number) => {
  return request.get<Api.SupplierDelivery.Detail>(`/supplier/delivery/detail/${id}`)
}

// ==================== 操作相关 ====================

/**
 * 预约取件
 */
export const bookPickup = (params: Api.SupplierDelivery.BookPickupParams) => {
  return request.post('/supplier/delivery/bookPickup', params)
}

/**
 * 确认发货
 */
export const confirmShip = (params: Api.SupplierDelivery.ConfirmShipParams) => {
  return request.post('/supplier/delivery/confirmShip', params)
}

/**
 * 更新标签资料（仅预览下载，不支持编辑）
 */
export const getDeliveryLabelMaterials = (itemId: number) => {
  return request.get<Api.Transfer.LabelMaterial[]>(`/supplier/delivery/labelMaterials/${itemId}`)
}
