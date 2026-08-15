/**
 * 物流运单 API - 物流商协同端
 * @author Claude Code
 * @date 2026-01-16
 */

import type { Api } from '@/typings/api'
import request from '@/utils/http'

// API 基础路径 - 协同端增加 clb-sys-openapi 前缀
const BASE_URL = '/tms/clb-sys-openapi/tms-waybill'

/**
 * 分页查询物流运单
 */
export function getWaybillList(params: Api.Waybill.QueryParams) {
  return request
    .post<any>({
      url: `${BASE_URL}/page`,
      data: params
    })
    .then((response) => {
      const data = response?.data || response
      return {
        records: data?.dtoList || [],
        total: data?.total || 0,
        count: data?.count || null,
        current: params.currentPage,
        size: params.pageSize
      } as Api.Common.PaginatedResponse<Api.Waybill.ListItem>
    })
}

/**
 * 按状态统计数量(用于TAB数量展示)
 */
export function getStatusCount(params: Partial<Api.Waybill.QueryParams>) {
  return request
    .post<any>({
      url: `${BASE_URL}/statusCount`,
      data: params
    })
    .then((response) => {
      const data = response?.data || response
      return (data || []) as Api.Waybill.StatusCount[]
    })
}

/**
 * 获取物流运单详情
 */
export function getWaybillDetail(params: { id: number }) {
  return request
    .post<any>({
      url: `${BASE_URL}/detail`,
      data: params
    })
    .then((response) => {
      let result = response?.data || response
      if (result && typeof result === 'object' && 'code' in result && 'data' in result) {
        result = result.data
      }
      return result as Api.Waybill.Detail
    })
}

/**
 * 批量更改物流运单状态
 */
export function changeStatusBatch(params: Api.Waybill.ChangeStatusBatchParams) {
  return request.post<boolean>({
    url: `${BASE_URL}/changeStatusBatch`,
    data: params,
    showSuccessMessage: true
  })
}

/**
 * 确认接单(待接单 -> 预生成)
 */
export function acceptOrder(ids: number[], remark?: string) {
  return changeStatusBatch({
    ids,
    status: 'PRE_GENERATED',
    remark
  })
}

/**
 * 拒绝接单(待接单 -> 已拒绝)
 */
export function rejectOrder(ids: number[], remark?: string) {
  return changeStatusBatch({
    ids,
    status: 'REJECTED',
    remark
  })
}

// 别名导出
export const acceptWaybill = acceptOrder
export const rejectWaybill = rejectOrder

/**
 * 确认揽收(待揽收 -> 待测量)
 */
export function confirmPickup(ids: number[]) {
  return changeStatusBatch({
    ids,
    status: 'WAIT_MEASURE'
  })
}

/**
 * 确认发运(待运输 -> 运输中)
 */
export function confirmShip(ids: number[]) {
  return changeStatusBatch({
    ids,
    status: 'IN_TRANSPORT'
  })
}

/**
 * 确认签收(运输中 -> 已完成)
 */
export function confirmSign(ids: number[]) {
  return changeStatusBatch({
    ids,
    status: 'COMPLETED'
  })
}

// 别名导出
export const completeWaybill = confirmSign

/**
 * 确认测量(待测量 -> 待确认费用)
 */
export function confirmMeasure(ids: number[]) {
  return changeStatusBatch({
    ids,
    status: 'WAIT_CONFIRM_FEE'
  })
}

/**
 * 编辑物流运单
 */
export function editWaybill(data: Partial<Api.Waybill.Detail> & { id: number }) {
  return request.post<boolean>({
    url: `${BASE_URL}/edit`,
    data,
    showSuccessMessage: true
  })
}

/**
 * 编辑地址明细
 */
export function editAddress(data: {
  id: number
  addressType?: 'SHIP_FROM' | 'SHIP_TO'
  country?: string
  state?: string
  city?: string
  district?: string
  detailAddress?: string
  postalCode?: string
  contactName?: string
  contactPhone?: string
  logisticsCenterCode?: string
}) {
  return request.post<boolean>({
    url: `${BASE_URL}/address/edit`,
    data,
    showSuccessMessage: true
  })
}

// 别名导出
export const editAddressDetail = editAddress

/**
 * 编辑测量数据（单条，兼容旧逻辑）
 */
export function editMeasure(data: Api.Waybill.MeasureItem & { id: number }) {
  return request.post<boolean>({
    url: `${BASE_URL}/measure/edit`,
    data,
    showSuccessMessage: true
  })
}

/**
 * 编辑测量数据（列表形式，传数组）
 */
export function editMeasureList(data: { id: number; measureList: Api.Waybill.MeasureItem[] }) {
  return request.post<boolean>({
    url: `${BASE_URL}/measure/edit`,
    data,
    showSuccessMessage: true
  })
}

// 别名导出
export const editMeasureData = editMeasure

/**
 * 编辑费用信息
 */
export function editFee(data: Api.Waybill.FeeItem & { id: number }) {
  return request.post<boolean>({
    url: `${BASE_URL}/fee/edit`,
    data,
    showSuccessMessage: true
  })
}

// 别名导出
export const editFeeInfo = editFee

/**
 * 编辑取件信息
 */
export function editPickup(data: {
  id: number
  pickupStatus?: string
  appointStatus?: string
  appointTime?: string
  contactName?: string
  contactPhone?: string
  contactEmail?: string
  pickupAddress?: string
}) {
  return request.post<boolean>({
    url: `${BASE_URL}/pickup/edit`,
    data,
    showSuccessMessage: true
  })
}

// 别名导出
export const editPickupInfo = editPickup

/**
 * 编辑轨迹信息
 */
export function editTrack(data: {
  id: number
  trackingNo?: string
  carrier?: string
  transportStatus?: string
  expectShipTime?: string
  actualShipTime?: string
  etaTime?: string
  signTime?: string
}) {
  return request.post<boolean>({
    url: `${BASE_URL}/track/edit`,
    data,
    showSuccessMessage: true
  })
}

// 别名导出
export const editTrackInfo = editTrack

/**
 * 新增附件
 */
export function addAttachment(data: Api.Waybill.AddAttachmentParams) {
  return request.post<boolean>({
    url: `${BASE_URL}/attachment/add`,
    data,
    showSuccessMessage: true
  })
}

/**
 * 编辑附件信息
 */
export function editAttachment(data: Api.Waybill.AttachmentItem & { id: number }) {
  return request.post<boolean>({
    url: `${BASE_URL}/attachment/edit`,
    data,
    showSuccessMessage: true
  })
}

/**
 * 批量变更附件状态(撤回/删除等)
 */
export function changeAttachmentStatusBatch(data: Api.Waybill.ChangeAttachmentStatusParams) {
  return request.post<boolean>({
    url: `${BASE_URL}/attachment/changeStatusBatch`,
    data,
    showSuccessMessage: true
  })
}

/**
 * 异步导出物流运单
 */
export function exportWaybill(params: Api.Waybill.QueryParams) {
  return request.post<number>({
    url: `${BASE_URL}/export`,
    data: { ...params, pageSize: -1 }
  })
}

/**
 * 根据运单ID查询状态操作记录（按操作时间正序）
 */
export function getStatusLogList(waybillId: number) {
  return request
    .post<any>({
      url: `${BASE_URL}/statusLog/listByWaybillId`,
      data: { waybillId }
    })
    .then((response) => {
      const data = response?.data || response
      return (data || []) as Api.Waybill.StatusLogItem[]
    })
}

// ==================== 状态名称映射(复用业务系统端) ====================
export {
  STATUS_MAP,
  TRANSPORT_MODE_MAP,
  ATTACHMENT_TYPE_MAP,
  OPERATE_END_MAP,
  ATTACHMENT_STATUS_MAP,
  EXTRA_FEE_TYPE_MAP
} from '@/api/logistics/waybill'
