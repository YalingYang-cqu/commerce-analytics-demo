/**
 * 物流运单 API - 业务系统端
 * @author Claude Code
 * @date 2026-01-16
 */

import type { Api } from '@/typings/api'
import request from '@/utils/http'

// API 基础路径
const BASE_URL = '/tms/tms-waybill'

/**
 * 分页查询物流运单
 */
/** 物流中心编码：接口可能返回 string / string[] / JSON 数组字符串，统一为「, 」分隔的纯文本（供列表 {{ }} 展示，避免结构原样输出） */
function normalizeLogisticsCenterCodeForList(raw: unknown): string {
  if (raw == null || raw === '') return ''
  if (Array.isArray(raw)) {
    return (raw as unknown[])
      .map((x) => String(x).trim())
      .filter(Boolean)
      .join(', ')
  }
  const s = String(raw).trim()
  if (s.startsWith('[') && s.endsWith(']')) {
    try {
      const parsed = JSON.parse(s) as unknown
      if (Array.isArray(parsed)) {
        return parsed
          .map((x) => String(x).trim())
          .filter(Boolean)
          .join(', ')
      }
    } catch {
      /* 非 JSON 则按原字符串展示 */
    }
  }
  return s
}

/**
 * 将列表项中的数组字段转为展示用字符串（与接口 TmsWaybillPageRespVo 对齐）
 */
function normalizeWaybillListItem(item: any): Api.Waybill.ListItem {
  if (!item) return item
  const normalized = { ...item }
  // shipmentId、referenceId 接口返回 array，统一转为逗号分隔字符串便于展示
  if (Array.isArray(normalized.shipmentId)) {
    normalized.shipmentId = (normalized.shipmentId as string[]).filter(Boolean).join(', ')
  }
  if (Array.isArray(normalized.referenceId)) {
    normalized.referenceId = (normalized.referenceId as string[]).filter(Boolean).join(', ')
  }
  const lcRaw =
    normalized.logisticsCenterCode ?? (normalized as Record<string, unknown>).logistics_center_code
  normalized.logisticsCenterCode = normalizeLogisticsCenterCodeForList(lcRaw)
  return normalized as Api.Waybill.ListItem
}

export function getWaybillList(params: Api.Waybill.QueryParams) {
  return request
    .post<any>({
      url: `${BASE_URL}/page`,
      data: params
    })
    .then((response) => {
      const data = response?.data || response
      const rawList = data?.dtoList || []
      const records = rawList.map(normalizeWaybillListItem)
      return {
        records,
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
 * 根据运单ID查询状态操作记录（按操作时间正序）
 */
export function getWaybillStatusLog(params: { waybillId: number }) {
  return request
    .post<any>({
      url: `${BASE_URL}/statusLog/listByWaybillId`,
      data: params
    })
    .then((response) => {
      const res = response?.data ?? response
      const data = res?.data ?? res
      return (Array.isArray(data) ? data : []) as WaybillStatusLogItem[]
    })
}

/** 状态操作记录项 */
export interface WaybillStatusLogItem {
  id?: number
  waybillId?: number
  operateTime?: string
  operatorId?: number
  operatorName?: string
  remark?: string
  status?: string
  statusName?: string
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
 * 批量变更物流运单状态为【待接单】(确认下单)
 * 待下单 -> 待接单
 */
export function confirmOrder(ids: number[], remark?: string) {
  return request.post<boolean>({
    url: `${BASE_URL}/changeStatusBatch/waitAccept`,
    data: { ids, remark }
  })
}

/**
 * 批量变更物流运单状态为【待运输】(确认费用)
 * 待确认费用 -> 待运输
 */
export function confirmFee(ids: number[], remark?: string) {
  return request.post<boolean>({
    url: `${BASE_URL}/changeStatusBatch/waitTransport`,
    data: { ids, remark }
  })
}

/**
 * 批量变更物流运单状态为【预生成】(确认接单)
 * 待接单 -> 预生成
 */
export function confirmAccept(ids: number[], remark?: string) {
  return request.post<boolean>({
    url: `${BASE_URL}/changeStatusBatch/preGenerated`,
    data: { ids, remark }
  })
}

// ==================== 差异系数配置 API ====================

/**
 * 查询差异系数配置列表
 */
export function getDiffCoefficientList() {
  return request
    .post<any>({
      url: `${BASE_URL}/diffCoefficient/list`
    })
    .then((response) => {
      const data = response?.data || response
      return (data || []) as Api.Waybill.DiffCoefficientItem[]
    })
}

/**
 * 查询差异系数配置详情
 */
export function getDiffCoefficientDetail(id: number) {
  return request
    .post<any>({
      url: `${BASE_URL}/diffCoefficient/detail`,
      data: { id }
    })
    .then((response) => {
      const data = response?.data || response
      return data as Api.Waybill.DiffCoefficientItem
    })
}

/**
 * 新增差异系数配置
 * @param diffCoefficient 差异系数(已经是除以100后的值，如5%传0.05)
 */
export function saveDiffCoefficient(diffCoefficient: number) {
  return request.post<boolean>({
    url: `${BASE_URL}/diffCoefficient/save`,
    data: { diffCoefficient }
  })
}

/**
 * 编辑差异系数配置
 * @param id 配置ID
 * @param diffCoefficient 差异系数(已经是除以100后的值，如5%传0.05)
 */
export function editDiffCoefficient(id: number, diffCoefficient: number) {
  return request.post<boolean>({
    url: `${BASE_URL}/diffCoefficient/edit`,
    data: { id, diffCoefficient }
  })
}

/**
 * 批量删除差异系数配置
 */
export function deleteDiffCoefficientBatch(ids: number[]) {
  return request.post<boolean>({
    url: `${BASE_URL}/diffCoefficient/deleteBatch`,
    data: { ids }
  })
}

/**
 * 取消运单
 * 待下单/待接单/预生成/待揽收 -> 已取消
 */
export function cancelWaybill(ids: number[], remark?: string) {
  return request.post<boolean>({
    url: `${BASE_URL}/changeStatusBatch/cancel`,
    data: { ids, remark }
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
 * 编辑测量数据
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
 * 编辑装箱明细
 */
export function editPackage(data: Api.Waybill.PackageItem & { id: number }) {
  return request.post<boolean>({
    url: `${BASE_URL}/package/edit`,
    data,
    showSuccessMessage: true
  })
}

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
 * 新增附件（返回新创建附件对象，含主键 id）
 * @param data 入参
 * @param options 选项：silent=true 时不弹后端 msg 成功提示（用于"保存并推送"等组合场景）
 */
export function addAttachment(
  data: Api.Waybill.AddAttachmentParams,
  options: { silent?: boolean } = {}
) {
  return request
    .post<any>({
      url: `${BASE_URL}/attachment/add`,
      data,
      showSuccessMessage: !options.silent
    })
    .then((response) => {
      // 项目 request 返回整个 { code, data, msg, success }，统一 unwrap data 字段
      let result = response?.data || response
      if (result && typeof result === 'object' && 'code' in result && 'data' in result) {
        result = result.data
      }
      return result as Api.Waybill.AddAttachmentVo
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
 * @param data 入参
 * @param options 选项：silent=true 时不弹后端 msg 成功提示（用于"保存并推送"等组合场景，由调用方自行 toast）
 */
export function changeAttachmentStatusBatch(
  data: Api.Waybill.ChangeAttachmentStatusParams,
  options: { silent?: boolean } = {}
) {
  return request.post<boolean>({
    url: `${BASE_URL}/attachment/changeStatusBatch`,
    data,
    showSuccessMessage: !options.silent
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

/** 轨迹信息项（接口 getStatusByWaybillId 返回） */
export interface TrackInfoItemDto {
  content?: string
  status?: string
  time?: string
}

/**
 * 根据运单ID查询轨迹信息
 */
export function getTrackByWaybillId(waybillId: number, trackingNo: string) {
  return request
    .post<any>({
      url: `${BASE_URL}/track/getStatusByWaybillId`,
      data: { waybillId, trackingNo }
    })
    .then((response) => {
      const res = response?.data ?? response
      const data = res?.data ?? res
      return (Array.isArray(data) ? data : []) as TrackInfoItemDto[]
    })
}

/**
 * 新增物流运单(用于上游生成-补录)
 */
export function saveWaybill(data: any) {
  return request.post<boolean>({
    url: `${BASE_URL}/save`,
    data,
    showSuccessMessage: true
  })
}

/**
 * 编辑单据负责人
 */
export function editOwner(data: { waybillId: number; ownerIdList: number[] }) {
  return request.post<boolean>({
    url: `${BASE_URL}/owner/edit`,
    data
    // showSuccessMessage: true
  })
}

// ==================== 状态名称映射 ====================

/** 状态名称映射 */
export const STATUS_MAP: Record<Api.Waybill.Status, string> = {
  WAIT_ORDER: '待下单',
  WAIT_ACCEPT: '待接单',
  PRE_GENERATED: '预生成',
  REJECTED: '已拒绝',
  WAIT_PICKUP: '待揽收',
  WAIT_MEASURE: '待测量',
  WAIT_CONFIRM_FEE: '待确认费用',
  WAIT_TRANSPORT: '待运输',
  IN_TRANSPORT: '运输中',
  COMPLETED: '已完成',
  CANCELED: '已取消'
}

/** 运输方式映射（与接口 transportMode 可选值对齐） */
export const TRANSPORT_MODE_MAP: Record<string, string> = {
  sea_fcl: '海运整柜',
  sea_lcl: '海运拼柜',
  air: '空运',
  express: '快递',
  truck: '卡航',
  rail: '铁路',
  multimodal: '多式联运',
  SEA_DELIVERY: '海递',
  TRUCK: '卡航'
}

/** 附件类型映射 */
export const ATTACHMENT_TYPE_MAP: Record<'CUSTOMS_DOC' | 'OTHER', string> = {
  // MARK: '物流唛',
  // PICKUP_PROOF: '提货凭证',
  // DELIVERY_NOTE: '送货单',
  CUSTOMS_DOC: '报关资料',
  // RELEASE_NOTICE: '放行通知单',
  // CUSTOMS_BILL: '报关底单',
  // BILL_OF_LADING: '提单',
  // SIGN_PROOF: '签收凭证',
  OTHER: '其他'
}

/** 操作端映射 */
export const OPERATE_END_MAP: Record<Api.Waybill.OperateEnd, string> = {
  BIZ: '业务系统端',
  SUPPLIER: '供应商协同端',
  LOGISTICS: '物流商协同端'
}

/** 附件状态映射（与接口 changeStatusBatch 的 status 一致） */
export const ATTACHMENT_STATUS_MAP: Record<Api.Waybill.AttachmentStatus, string> = {
  CLB_UPLOAD: '物流商协同端已上传',
  CLB_COMMIT: '物流商协同端已提交',
  BS_UPLOAD: '业务端已上传',
  BS_COMMIT: '业务端已提交',
  CLB_W_UPLOAD: '供应商协同端已上传',
  CLB_W_COMMIT: '供应商协同端已提交',
  DELETED: '已删除'
}

/** 附加费类型映射 */
export const EXTRA_FEE_TYPE_MAP: Record<Api.Waybill.ExtraFeeType, string> = {
  FUEL: '燃油附加费',
  CUSTOMS: '一般贸易报关费',
  PAGE: '续页附加费',
  CLEARANCE: '清关费',
  TAX_ADVANCE: '税金垫付手续费',
  SPECIAL: '特殊产品附加费',
  SINGLE_ITEM_NAME: '单票品名附加费',
  ITEM_NAME: '单件品名附加费',
  SINGLE_ITEM: '单票单件附加费',
  NON_FBA: '非FBA地址附加费',
  REMOTE: '偏远地区附加费',
  OVERSIZE: '超大包裹附加费',
  OTHER: '其他'
}
