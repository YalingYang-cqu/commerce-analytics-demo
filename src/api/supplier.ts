/*
 * Portfolio demo
 * @Date: 2025-12-01 10:03:35
 * Company-specific metadata removed
 * @LastEditTime: 2026-01-27 16:26:00
 * @FilePath: src/api/supplier.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from '@/utils/http'
import { Api } from '@/typings/api'

/**
 * 查询供应商列表（POST）
 * - 路径：`/supplier/list`
 * - 请求体：`Api.Supplier.SupplierQueryParam`
 *   - 支持审批状态、合作状态、创建/更新时间范围、负责人ID列表、编码/名称模糊搜索
 *   - 分页字段：`currentPage`、`pageSize`
 *   - 排序字段：`orderBy`（例如：`createTime desc`）
 * - 返回：标准分页 `Api.Supplier.SupplierList`（内部 `records` 映射后端 `dtoList`，`total` 映射后端 `total`）
 */
export function fetchGetSupplierList(params: Api.Supplier.SupplierQueryParam) {
  return request.post<Api.Supplier.SupplierList>({
    url: '/basic/supplier/list',
    data: params
  })
}
export function fetchGetSupplierAll(params: Api.Supplier.SupplierQueryParam) {
  return request.post<Api.Supplier.SupplierList>({
    url: '/basic/supplier/listAll',
    data: params
  })
}

export function fetchAllSupplierList(params: any) {
  return request.post<any>({
    url: '/basic/supplier/getAllSupplier',
    data: params
  })
}

/**
 * 查询供应商详情（GET）
 * - 入参：`supplierId` 供应商主键ID
 * - 返回：`Api.Supplier.SupplierItem` 编辑/查看所需的完整实体
 * - 失败由调用方提示，避免重复
 */
export function fetchGetSupplierDetail(supplierId: number) {
  return request.get<Api.Supplier.SupplierItem>({
    url: `/apis/basic/supplier/getDetail/${supplierId}`,
    showErrorMessage: false
  })
}

/**
 * 保存供应商（新增）
 * - 路径：`/basic/supplier/save`
 * - 请求方式：POST
 * - 失败由调用方提示，避免与请求层重复
 */
export function saveSupplier(data: any) {
  return request.post<boolean>({
    url: '/apis/basic/supplier/save',
    data,
    showSuccessMessage: false,
    showErrorMessage: false
  })
}

/**
 * 编辑供应商（更新）
 * - 路径：`/basic/supplier/edit`
 * - 请求方式：POST
 * - 需要 contactEditItem 和 paymentAccountEditItem 结构
 * - 失败由调用方提示，避免与请求层重复
 */
export function editSupplier(data: any) {
  return request.post<boolean>({
    url: '/basic/supplier/edit',
    data,
    showSuccessMessage: false,
    showErrorMessage: false
  })
}

export function createSupplier(data: Api.Supplier.SupplierCreateParams) {
  return request.post<void>({
    url: '/purchase/supplier/create',
    data,
    showSuccessMessage: true
  })
}

export function updateSupplier(data: Api.Supplier.SupplierUpdateParams) {
  return request.post<void>({
    url: '/purchase/supplier/update',
    data,
    showSuccessMessage: true
  })
}

/** 删除供应商；成功/失败由调用方统一提示，避免与请求层重复 */
export function deleteSupplier(supplierId: number) {
  return request.get<void>({
    url: `/basic/supplier/remove/${supplierId}`,
    showSuccessMessage: false,
    showErrorMessage: false
  })
}

export function changeSupplierStatus(supplierId: number, enabled: boolean) {
  return request.post<void>({
    url: '/purchase/supplier/change-status',
    data: { supplierId, enabled },
    showSuccessMessage: true
  })
}

/**
 * 提交供应商审批
 * - 路径：`/basic/supplier/submit/{id}`
 * - 请求方式：GET
 * - 响应结构：{ code: 0, msg: "", success: true }
 */
/** 提交供应商审批；失败由调用方提示，避免重复 */
export function submitSupplierApproval(supplierId: number) {
  return request.get<{ code: number; msg: string; success: boolean }>({
    url: `/basic/supplier/submit/${supplierId}`,
    showSuccessMessage: true,
    showErrorMessage: false
  })
}

/**
 * 撤回供应商审批
 * - 路径：`/basic/supplier/cancelSubmit/{id}`
 * - 请求方式：GET
 * - 响应结构：{ code: 0, msg: "", success: true }
 */
/** 撤回供应商审批；失败由调用方提示，避免重复 */
export function recallSupplierApproval(supplierId: number) {
  return request.get<{ code: number; msg: string; success: boolean }>({
    url: `/basic/supplier/cancelSubmit/${supplierId}`,
    showSuccessMessage: true,
    showErrorMessage: false
  })
}

/** 发起供应商变更；失败由调用方提示，避免重复 */
export function initiateSupplierChange(supplierId: number) {
  return request.get<void>({
    url: `/apis/basic/supplier/getDetail/${supplierId}`,
    showSuccessMessage: true,
    showErrorMessage: false
  })
}

/**
 * 查询供应商操作日志
 */
export function fetchSupplierOperationLog(params: {
  currentPage: number
  pageSize: number
  supplierId?: number
}) {
  return request.post<Api.Supplier.OperationLogList>({
    url: '/purchase/supplier/operation-log',
    data: params
  })
}

// 导出供应商列表
export function exportSupplier(params: any) {
  return request.post<Blob>({
    url: `/basic/supplier/export`,
    data: params,
    responseType: 'blob'
  })
}

/**
 * 获取供应商编码（自动生成）
 * - 路径：`/basic/supplier/generateCode`
 * - 请求方式：GET
 * - 返回：`{ code: string }` 格式：SUP+四位数自增流水0001起
 */
export function generateSupplierCode() {
  return request.get<{ code: string }>({
    url: '/apis/basic/supplier/generateCode',
    showSuccessMessage: false
  })
}
