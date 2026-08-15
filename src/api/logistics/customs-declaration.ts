/**
 * 报关资料管理 API (TMS)
 * 后端模块：TMS 报关资料管理
 *
 * 原型图与后端字段对照（列表/查询）：
 * - 报关资料编号 → declarationNo（与 waybillNo 不同）
 * - 物流商 → logisticsProviderId / logisticsProviderName
 * - 运输方式 → transportMethod / transportMethodName（SEA_FCL/AIR/EXPRESS 等）
 * - 物流渠道 → logisticsChannelId / logisticsChannelName
 * - 物流方案 → transportPlanId / transportPlanName
 * - 境内发货人 → domesticShipperName
 * - 境外收货人 → overseasConsigneeName
 * - 合同编号 → contractNo
 * - 关联物流运单 → waybillNo（展示）、waybillId（跳转详情）
 * - 发货时间 → shipmentTime / shipmentTimeFrom / shipmentTimeTo
 * - 状态 → status / statusName，推送状态 → pushStatus / pushStatusName
 */
import request from '@/utils/http'

const BASE_URL = '/tms/tms/customs-document'

// ==================== 类型 ====================

/** 查询参数：与接口文档一致 */
export interface CustomsDeclarationQueryParams {
  current?: number
  size?: number
  documentNo?: string
  keyword?: string
  waybillNo?: string
  deliveryTimeStart?: string
  deliveryTimeEnd?: string
  status?: string // PENDING-待推送，PUSHED-已推送，FAILURE-生成失败（以后端 status/statusDesc 为准）
  transportMode?: string
  logisticsProviderId?: number
  logisticsChannelId?: number
  transportPlanId?: number
  domesticShipperId?: number
  overseasConsigneeId?: number
  /** 物流跟踪单号（模糊） */
  trackingNo?: string
  /** 货件编号（模糊） */
  shipmentId?: string
  [key: string]: any
}

/** 列表行 VO：与 API 响应字段一致 */
export interface CustomsDeclarationVO {
  id: number
  documentNo?: string
  contractNumber?: string
  domesticShipperId?: number
  domesticShipperName?: string
  overseasConsigneeId?: number
  overseasConsigneeName?: string
  logisticsProviderId?: number
  logisticsProviderName?: string
  logisticsChannelId?: number
  logisticsChannelName?: string
  transportPlanId?: number
  transportPlanName?: string
  transportMode?: string
  waybillIds?: number[]
  waybillNos?: string
  deliveryTime?: string
  pushTime?: string
  status?: string
  statusDesc?: string
  templateId?: number
  totalCartonCount?: number
  totalQuantity?: number
  totalGrossWeight?: number
  totalNetWeight?: number
  totalVolume?: number
  totalCustomsValue?: number
  excelPath?: string
  pdfPath?: string
  createBy?: number
  createTime?: string
  updateBy?: number
  updateTime?: string
  trackingNo?: string[]
  shipmentId?: string[]
  sku?: string[]
  skuId?: number[]
  productChineseName?: string[]
  categoryId?: number[]
  categoryName?: string[]
  transferOrderIds?: number[]
  transferOrderNos?: string[]
  [key: string]: any
}

export interface CustomsDeclarationDetailVO extends CustomsDeclarationVO {
  productList?: any[]
  attachmentName?: string
  attachmentPath?: string
  attachmentUrl?: string
}

// ==================== API ====================

/** 分页查询报关资料列表 */
export function getCustomsDeclarationList(params: any) {
  const apiParams: Record<string, any> = {}
  const p = params || {}
  apiParams.current = p.current ?? p.currentPage ?? 1
  apiParams.size = p.size ?? p.pageSize ?? 20
  if (p.documentNo) apiParams.documentNo = p.documentNo
  if (p.keyword) apiParams.keyword = p.keyword
  if (p.waybillNo) apiParams.waybillNo = p.waybillNo
  if (p.deliveryTimeStart) apiParams.deliveryTimeStart = p.deliveryTimeStart
  if (p.deliveryTimeEnd) apiParams.deliveryTimeEnd = p.deliveryTimeEnd
  if (p.status) apiParams.status = p.status
  if (p.transportMode) apiParams.transportMode = p.transportMode
  if (p.logisticsProviderId) apiParams.logisticsProviderId = p.logisticsProviderId
  if (p.logisticsChannelId) apiParams.logisticsChannelId = p.logisticsChannelId
  if (p.transportPlanId) apiParams.transportPlanId = p.transportPlanId
  if (p.domesticShipperId) apiParams.domesticShipperId = p.domesticShipperId
  if (p.overseasConsigneeId) apiParams.overseasConsigneeId = p.overseasConsigneeId
  if (p.trackingNo) apiParams.trackingNo = p.trackingNo
  if (p.shipmentId) apiParams.shipmentId = p.shipmentId
  return request
    .get<any>({
      url: `${BASE_URL}/list`,
      params: apiParams
    })
    .then((res) => {
      const data = res?.data ?? res
      return {
        records: (data?.records ?? data?.list ?? []) as CustomsDeclarationVO[],
        total: data?.total ?? 0,
        current: data?.current ?? apiParams.current ?? 1,
        size: data?.size ?? apiParams.size ?? 20
      }
    })
}

/** 获取报关资料详情 */
export function getCustomsDeclarationDetail(id: number) {
  return request
    .get<any>({
      url: `${BASE_URL}/detail/${id}`
    })
    .then((res) => {
      const data = res?.data ?? res
      return data as CustomsDeclarationDetailVO
    })
}

/** 推送报关资料（单条）：成功/失败提示由页面用返回 msg 与 HTTP 层统一处理，避免与 request 重复弹窗 */
export function pushCustomsDeclaration(id: number) {
  return request.post<any>({
    url: `${BASE_URL}/push/${id}`,
    showSuccessMessage: false
  })
}

/** 批量推送报关资料 */
export function batchPushCustomsDeclaration(ids: number[]) {
  return request.post<any>({
    url: `${BASE_URL}/batch-push`,
    data: ids,
    showSuccessMessage: false
  })
}

/** 合并报关资料 */
export function mergeCustomsDeclaration(ids: number[]) {
  return request.post<any>({
    url: `${BASE_URL}/merge`,
    data: { ids },
    showSuccessMessage: false
  })
}

/** 填写境外收货人并重新生成报关资料（body） */
export interface RegenerateOverseasConsigneeDto {
  id: number
  overseasConsigneeId?: number
  overseasConsigneeName?: string
}

/** 重新生成报关资料（仅 path id） */
export function regenerateCustomsDeclaration(id: number) {
  return request.post<any>({
    url: `${BASE_URL}/regenerate/${id}`,
    showSuccessMessage: false
  })
}

/** 填写境外收货人并重新生成报关资料 */
export function regenerateCustomsDeclarationOverseasConsignee(dto: RegenerateOverseasConsigneeDto) {
  return request.post<any>({
    url: `${BASE_URL}/regenerate/overseasConsignee`,
    data: dto,
    showSuccessMessage: false
  })
}

/**
 * 更新报关资料文件路径（在线编辑后保存到 OSS 时调用）
 * 若后端接口路径/参数不同，请根据实际 Swagger 调整
 */
export function updateCustomsDeclarationFile(
  id: number,
  params: { excelPath?: string; pdfPath?: string }
) {
  return request.post<any>({
    url: `${BASE_URL}/edit`,
    data: { id, ...params },
    showSuccessMessage: false
  })
}
