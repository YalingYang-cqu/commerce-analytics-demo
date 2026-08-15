/**
 * 采购合同模板 API
 * 根据 src/specs/purchase/api/caigouhetong_api.md
 */
import request from '@/utils/http'

// API 基础路径
const BASE_URL = '/pms/purchase-contract-template'

// ==================== 类型定义 ====================

/** 采购合同模板查询参数 */
export interface ContractTemplateQueryParams {
  currentPage: number
  pageSize: number
  hasCount?: boolean
  orderBy?: string
  templateName?: string
  supplierIds?: number[]
  createTimeFrom?: string
  createTimeTo?: string
  updateTimeFrom?: string
  updateTimeTo?: string
}

/** 采购合同模板VO */
export interface ContractTemplateVO {
  id: number
  templateName: string
  supplierIds: number[]
  supplierNames: string[]
  attachmentName: string
  attachmentPath: string
  attachmentUrl: string
  createBy: number
  createByName: string
  createTime: string
  updateBy: number
  updateByName: string
  updateTime: string
}

/** 保存采购合同模板请求参数 */
export interface SaveContractTemplateParams {
  id?: number
  templateName: string
  supplierIds: number[]
  supplierNames?: string[]
  attachmentName: string
  attachmentPath: string
}

/** 模板校验结果VO */
export interface TemplateValidationResult {
  success: boolean
  errorMessage?: string
  foundVariables: string[]
  invalidVariables: string[]
  productRowIndex: number
  productVariableRowDetail?: string
}

// ==================== API 函数 ====================

/**
 * 获取采购合同模板列表
 */
export function getContractTemplateList(params: ContractTemplateQueryParams) {
  return request
    .post<any>({
      url: `${BASE_URL}/list`,
      data: params
    })
    .then((response) => {
      const data = response?.data || response
      return {
        records: (data?.records || []) as ContractTemplateVO[],
        total: data?.total || 0,
        current: data?.current || params.currentPage,
        size: data?.size || params.pageSize
      }
    })
}

/**
 * 获取采购合同模板详情
 */
export function getContractTemplateDetail(id: number) {
  return request
    .get<any>({
      url: `${BASE_URL}/detail/${id}`
    })
    .then((response) => {
      const data = response?.data || response
      return data as ContractTemplateVO
    })
}

/**
 * 保存采购合同模板（新增/编辑）
 */
export function saveContractTemplate(params: SaveContractTemplateParams) {
  return request
    .post<any>({
      url: `${BASE_URL}/save`,
      data: params,
      showSuccessMessage: true
    })
    .then((response) => {
      return response?.data || response
    })
}

/**
 * 删除采购合同模板
 */
export function deleteContractTemplate(id: number) {
  return request.del<void>({
    url: `${BASE_URL}/delete/${id}`,
    showSuccessMessage: true
  })
}

/**
 * 检查模板名称是否存在
 * @param templateName 模板名称
 * @param excludeId 排除的ID（编辑时使用）
 */
export function checkTemplateNameExists(templateName: string, excludeId?: number) {
  return request
    .get<any>({
      url: `${BASE_URL}/check-name-exists`,
      params: { templateName, excludeId }
    })
    .then((response) => {
      return (response?.data ?? response) as boolean
    })
}

/**
 * 获取已被其他模板关联的供应商ID列表
 * @param excludeTemplateId 排除的模板ID
 */
export function getLinkedSupplierIds(excludeTemplateId?: number) {
  return request
    .get<any>({
      url: `${BASE_URL}/linked-supplier-ids`,
      params: excludeTemplateId ? { excludeTemplateId } : {}
    })
    .then((response) => {
      return (response?.data || []) as number[]
    })
}

/**
 * 测试模板（根据ID）
 */
export function testTemplate(id: number) {
  return request
    .get<any>({
      url: `${BASE_URL}/test/${id}`
    })
    .then((response) => {
      return (response?.data || response) as TemplateValidationResult
    })
}

/**
 * 测试模板（根据附件路径）
 */
export function testTemplateByPath(attachmentPath: string) {
  return request
    .get<any>({
      url: `${BASE_URL}/test-by-path`,
      params: { attachmentPath }
    })
    .then((response) => {
      return (response?.data || response) as TemplateValidationResult
    })
}

/**
 * 获取合同模板字段列表（用于填充字段）
 */
export function getContractTemplateFieldList() {
  return request
    .get<any>({
      url: `${BASE_URL}/field-list`
    })
    .then((response) => {
      return (response?.data || response) as Array<{ fieldName: string; fieldDesc: string }>
    })
}
