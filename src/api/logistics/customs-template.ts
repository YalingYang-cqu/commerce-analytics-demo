/**
 * 报关资料模版 API (TMS)
 * 后端模块：TMS 报关资料模版
 */
import request from '@/utils/http'

const BASE_URL = '/tms/customs-document-template'

// ==================== 类型 ====================

export interface CustomsTemplateQueryParams {
  currentPage: number
  pageSize: number
  hasCount?: boolean
  orderBy?: string
  templateName?: string
  /** 境内发货人ID列表（多选筛选） */
  domesticShipperIds?: number[]
  /** 境外收货人ID列表（多选筛选） */
  overseasConsigneeIds?: number[]
  createTimeFrom?: string
  createTimeTo?: string
  updateTimeFrom?: string
  updateTimeTo?: string
}

export interface CustomsTemplateVO {
  id: number
  templateName: string
  /** 境内发货人ID列表 */
  domesticShipperIds?: number[]
  /** 境内发货人名称（多个用逗号分隔或数组） */
  domesticShipperNames?: string[]
  /** @deprecated 兼容旧接口单值 */
  domesticShipperId?: number
  domesticShipperName?: string
  /** 境外收货人ID列表 */
  overseasConsigneeIds?: number[]
  /** 境外收货人名称（多个用逗号分隔或数组） */
  overseasConsigneeNames?: string[]
  /** @deprecated 兼容旧接口单值 */
  overseasConsigneeId?: number
  overseasConsigneeName?: string
  attachmentName?: string
  attachmentPath?: string
  attachmentUrl?: string
  createBy?: number
  createByName?: string
  createTime?: string
  updateBy?: number
  updateByName?: string
  updateTime?: string
}

export interface CustomsTemplateSaveParams {
  id?: number
  templateName: string
  /** 境内发货人ID列表 */
  domesticShipperIds: number[]
  /** 境内发货人名称列表（与ID顺序一致） */
  domesticShipperNames?: string[]
  /** 境外收货人ID列表 */
  overseasConsigneeIds: number[]
  /** 境外收货人名称列表（与ID顺序一致） */
  overseasConsigneeNames?: string[]
  attachmentName: string
  attachmentPath: string
}

export interface TemplateTestResult {
  success: boolean
  errorMessage?: string
  foundVariables?: string[]
  invalidVariables?: string[]
  productRowIndex?: number
  productVariableRowDetail?: string
}

/** 发货人-收货人组合对 */
export interface ShipperConsigneePair {
  domesticShipperId?: number
  overseasConsigneeId?: number
}

// ==================== API ====================

/** 分页查询报关资料模版列表 */
export function getCustomsTemplatePage(params: CustomsTemplateQueryParams) {
  return request
    .post<any>({
      url: `${BASE_URL}/list`,
      data: params
    })
    .then((res) => {
      const data = res?.data ?? res
      return {
        records: (data?.records ?? []) as CustomsTemplateVO[],
        total: data?.total ?? 0,
        current: data?.current ?? params.currentPage,
        size: data?.size ?? params.pageSize
      }
    })
}

/** 报关资料模版详情 */
export function getCustomsTemplateDetail(id: number) {
  return request
    .get<any>({
      url: `${BASE_URL}/detail/${id}`
    })
    .then((res) => {
      const data = res?.data ?? res
      return data as CustomsTemplateVO
    })
}

/** 保存报关资料模版（新增/编辑） */
export function saveCustomsTemplate(params: CustomsTemplateSaveParams) {
  return request.post<any>({
    url: `${BASE_URL}/save`,
    data: params,
    showSuccessMessage: true
  })
}

/** 删除报关资料模版 */
export function deleteCustomsTemplate(id: number) {
  return request.del<any>({
    url: `${BASE_URL}/delete/${id}`,
    showSuccessMessage: true
  })
}

/** 检查模版名称是否存在 */
export function checkTemplateNameExists(templateName: string, excludeId?: number) {
  return request
    .get<any>({
      url: `${BASE_URL}/check-name-exists`,
      params: { templateName, excludeId }
    })
    .then((res) => (res?.data ?? res) as boolean)
}

/** 获取已被其他模版关联的发货人-收货人组合对列表 */
export function getLinkedShipperConsigneePairs(excludeTemplateId?: number) {
  return request
    .get<any>({
      url: `${BASE_URL}/linked-pairs`,
      params: excludeTemplateId != null ? { excludeTemplateId } : {}
    })
    .then((res) => (res?.data ?? res ?? []) as ShipperConsigneePair[])
}

/** 测试模版（按模版ID） */
export function testCustomsTemplate(id: number) {
  return request
    .get<any>({
      url: `${BASE_URL}/test/${id}`
    })
    .then((res) => (res?.data ?? res) as TemplateTestResult)
}

/** 根据附件路径测试模版 */
export function testCustomsTemplateByPath(attachmentPath: string) {
  return request
    .get<any>({
      url: `${BASE_URL}/test-by-path`,
      params: { attachmentPath }
    })
    .then((res) => (res?.data ?? res) as TemplateTestResult)
}
