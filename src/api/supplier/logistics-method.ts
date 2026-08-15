/**
 * 供应商协同端 - 物流方案 API
 * 接口前缀: /tms/clb-sys-openapi/tms-transport-plan/
 *
 * 注意: 协同端接口与业务系统接口一致，只是前缀不同
 * 所有接口复用 logistics/logistics-method.ts 中的函数，传入 isSupplier = true
 */

import type { Api } from '@/typings/api'
import {
  getLogisticsMethodList as _getLogisticsMethodList,
  getLogisticsMethodDetail as _getLogisticsMethodDetail,
  saveLogisticsMethod as _saveLogisticsMethod,
  deleteLogisticsMethod as _deleteLogisticsMethod,
  updateLogisticsMethodStatus as _updateLogisticsMethodStatus,
  exportLogisticsMethod as _exportLogisticsMethod
} from '@/api/logistics/logistics-method'

/** 获取物流方案列表（供应商协同端） */
export const getLogisticsMethodList = (
  params: Api.LogisticsMethod.QueryParams
): Promise<{ data: Api.Common.PaginatedResponse<Api.LogisticsMethod.ListItem> }> => {
  return _getLogisticsMethodList(params, true)
}

/** 获取物流方案详情（供应商协同端） */
export const getLogisticsMethodDetail = (id: number): Promise<Api.LogisticsMethod.Detail> => {
  return _getLogisticsMethodDetail(id, true)
}

/** 保存物流方案（供应商协同端） */
export const saveLogisticsMethod = (
  data: Api.LogisticsMethod.SaveParams
): Promise<{ id: number; success: boolean }> => {
  return _saveLogisticsMethod(data, true)
}

/** 删除物流方案（供应商协同端） */
export const deleteLogisticsMethod = (ids: number[]): Promise<void> => {
  return _deleteLogisticsMethod(ids, true)
}

/** 更新物流方案状态（供应商协同端） */
export const updateLogisticsMethodStatus = (id: number, status: number): Promise<void> => {
  return _updateLogisticsMethodStatus(id, status, true)
}

/** 导出物流方案（供应商协同端） */
export const exportLogisticsMethod = (params: Api.LogisticsMethod.QueryParams): Promise<Blob> => {
  return _exportLogisticsMethod(params, true)
}
