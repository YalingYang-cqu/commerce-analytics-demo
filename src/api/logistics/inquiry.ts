/**
 * 询价单 API - 业务系统端
 * @author Claude Code
 * @date 2026-01-19
 */

import type { Api } from '@/typings/api'
import request from '@/utils/http'

// API 基础路径
const BASE_URL = '/tms/tms-inquiry'

/**
 * 获取物流中心编码列表（FBA货件的目的物流中心编码，去重）
 */
export function getFulfillmentCenterIds(): Promise<string[]> {
  return request
    .get<any>({
      url: `${BASE_URL}/fulfillment-center-ids`
    })
    .then((res) => {
      const data = res?.data ?? res
      return Array.isArray(data) ? data : []
    })
}

/**
 * 列表接口可能用不同字段承载报价子表，统一为 quotationList，避免前端读不到子行
 */
function normalizeInquiryListRecord(row: any): Api.Inquiry.ListItem {
  const raw =
    row?.quotationList ??
    row?.quoteList ??
    row?.quotes ??
    row?.tmsQuotationList ??
    row?.tmsQuotations
  let quotationList = Array.isArray(raw) ? [...raw] : []
  // 个别接口把报价放在 items 里（且带报价单号），与货物行区分：有报价单号才并入
  if (quotationList.length === 0 && Array.isArray(row?.items)) {
    const fromItems = row.items.filter(
      (x: any) =>
        x &&
        ((x.quotationNo != null && String(x.quotationNo) !== '') ||
          (x.quoteNo != null && String(x.quoteNo) !== ''))
    )
    if (fromItems.length) quotationList = fromItems
  }
  return { ...row, quotationList } as Api.Inquiry.ListItem
}

/**
 * 分页查询询价单
 */
export function getInquiryList(params: Api.Inquiry.QueryParams) {
  return request
    .post<any>({
      url: `${BASE_URL}/page`,
      data: params
    })
    .then((response) => {
      const data = response?.data || response
      const rawRecords = data?.records || []
      const records = rawRecords.map((row: any) => normalizeInquiryListRecord(row))
      const total = data?.total || 0

      return {
        records,
        total,
        count: data?.count || null,
        current: params.currentPage,
        size: params.pageSize
      } as Api.Common.PaginatedResponse<Api.Inquiry.ListItem>
    })
}

/**
 * 按状态统计数量(用于TAB数量展示)
 */
export function getStatusCount(params: Partial<Api.Inquiry.QueryParams>) {
  return request
    .post<any>({
      url: `${BASE_URL}/statusCount`,
      data: params
    })
    .then((response) => {
      const data = response?.data || response
      const statusCount = (data || []) as Api.Inquiry.StatusCount[]

      return statusCount
    })
}

/**
 * 获取询价单详情
 */
export function getInquiryDetail(params: { id: number }) {
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

      return result as Api.Inquiry.Detail
    })
}

/**
 * 发起询价(待发布 -> 询价中)
 */
export function publishInquiry(ids: number[]) {
  return request.post<boolean>({
    url: `${BASE_URL}/publish`,
    data: { idList: ids },
    showSuccessMessage: false
  })
}

/**
 * 重新发起询价(已取消/已过期 -> 生成新询价单)
 */
export function republishInquiry(ids: number[]) {
  return request.post<boolean>({
    url: `${BASE_URL}/resubmit`,
    data: { idList: ids },
    showSuccessMessage: false
  })
}

/**
 * 取消询价单(询价中/待确认 -> 已取消)
 */
export function cancelInquiry(ids: number[], remark?: string) {
  return request.post<boolean>({
    url: `${BASE_URL}/cancel`,
    data: { idList: ids, cancelReason: remark },
    showSuccessMessage: false
  })
}

/**
 * 批量删除询价单(仅待发布可删除)
 */
export function deleteInquiry(ids: number[]) {
  return request.post<boolean>({
    url: `${BASE_URL}/batchDelete`,
    data: { idList: ids },
    showSuccessMessage: false
  })
}

/**
 * 确认选择(选中某个报价单，询价单状态变为已完成)
 */
export function confirmQuote(params: { inquiryId: number; quotationId: number }) {
  return request.post<boolean>({
    url: `${BASE_URL}/confirmSelect`,
    data: params,
    showSuccessMessage: false
  })
}

/**
 * 催报价(给物流商发送催报价通知)
 */
export function urgeQuote(params: { inquiryId: number; quotationId: number }) {
  return request.post<boolean>({
    url: `${BASE_URL}/urgeQuote`,
    data: params,
    showSuccessMessage: false
  })
}

/**
 * 更新单据负责人(任意状态均可编辑，支持多选)
 */
export function updateOwner(params: { id: number; ownerIds: number[] }) {
  return request.post<boolean>({
    url: `${BASE_URL}/updateOwner`,
    data: params,
    showSuccessMessage: false
  })
}

/**
 * 异步导出询价单
 */
export function exportInquiry(params: Api.Inquiry.QueryParams) {
  return request.post<number>({
    url: `${BASE_URL}/export`,
    data: { ...params, pageSize: -1 }
  })
}

/**
 * 保存询价单(新增/编辑)
 */
export function saveInquiry(data: any) {
  return request.post<boolean>({
    url: `${BASE_URL}/save`,
    data,
    showSuccessMessage: false
  })
}

// ==================== 状态名称映射 ====================

/** 询价单状态 */
export const STATUS_MAP: Record<Api.Inquiry.Status, string> = {
  WAIT_PUBLISH: '待发布',
  INQUIRING: '询价中',
  WAIT_CONFIRM: '待确认',
  COMPLETED: '已完成',
  CANCELED: '已取消',
  EXPIRED: '已过期'
}

/** 运输方式映射（支持大写 SEA_FCL 及小写 sea_lcl 等格式） */
export const TRANSPORT_MODE_MAP: Record<string, string> = {
  SEA_FCL: '海运整柜',
  SEA_LCL: '海运拼柜',
  AIR: '空运',
  EXPRESS: '快递',
  TRUCK: '卡航',
  RAIL: '铁路',
  MULTI: '多式联运',
  // 小写/下划线格式（后端可能返回）
  sea_fcl: '海运整柜',
  sea_lcl: '海运拼柜',
  air: '空运',
  express: '快递',
  truck: '卡航',
  rail: '铁路',
  multi: '多式联运'
}

/** 货物类型映射（API code -> 中文，用于货物信息表格） */
export const CARGO_TYPE_MAP: Record<string, string> = {
  GENERAL: '普货',
  MAGNETIC: '带磁',
  WITH_BATTERY: '带电',
  PURE_BATTERY: '纯电池',
  POWDER: '粉末',
  LIQUID: '液体',
  TEXTILE: '纺织品',
  FOOD: '食品',
  OTHER: '其他',
  general: '普货',
  magnetic: '带磁',
  with_battery: '带电',
  pure_battery: '纯电池',
  powder: '粉末',
  liquid: '液体',
  textile: '纺织品',
  food: '食品',
  other: '其他'
}

/** 报价状态映射（支持大小写，与后端返回的报价单状态一致） */
export const QUOTE_STATUS_MAP: Record<string, string> = {
  WAIT_QUOTE: '待报价',
  QUOTED: '已报价',
  EXPIRED: '已失效',
  WAIT_CONFIRM: '待确认',
  CANCELED: '已取消',
  DEADLINE: '已截止',
  SELECTED: '已选中',
  INVALID: '已失效',
  wait_quote: '待报价',
  quoted: '已报价',
  expired: '已失效',
  wait_confirm: '待确认',
  canceled: '已取消',
  deadline: '已截止',
  selected: '已选中',
  invalid: '已失效',
  NOT_SELECTED: '未中标'
}

/** 计费方式映射（支持大小写） */
export const BILLING_METHOD_MAP: Record<string, string> = {
  WEIGHT: '按重量',
  VOLUME: '按体积',
  WEIGHT_VOLUME_MAX: '体积重和实重取大',
  weight: '按重量',
  volume: '按体积',
  weight_volume_max: '体积重和实重取大'
}
