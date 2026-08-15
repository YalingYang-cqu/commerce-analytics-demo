/*
 * @Description: 物流商资料 API
 */
import request from '@/utils/http'

/**
 * 分页查询物流商列表（POST）
 * - 路径：`/basic/logisticsProvider/page`
 * - 请求体：支持审批状态、合作状态、创建/更新时间范围、负责人ID列表、编码/名称模糊搜索、运输方式
 * - 分页字段：`currentPage`、`pageSize`
 * - 排序字段：`orderBy`
 * - 返回：标准分页数据
 */
export function fetchGetLogisticsList(params: any) {
  return request.post<any>({
    url: '/basic/logisticsProvider/page',
    data: params
  })
}

/**
 * 获取物流商详情（GET）
 * - 路径：`/basic/logisticsProvider/{providerId}`
 * - 入参：`providerId` 物流商主键ID
 * - 返回：物流商完整信息
 */
export function fetchGetLogisticsDetail(providerId: number) {
  return request.get<any>({
    url: `/basic/logisticsProvider/${providerId}`
  })
}

/**
 * 新增物流商-暂存-提交（POST）
 * - 路径：`/basic/logisticsProvider/save`
 * - submitFlag: false-暂存, true-提交
 * - 返回：`void`
 */
export function saveLogisticsProvider(data: any) {
  return request.post<void>({
    url: '/basic/logisticsProvider/save',
    data
  })
}

/**
 * 编辑物流商-暂存-提交（POST）
 * - 路径：`/basic/logisticsProvider/update`
 * - submitFlag: false-暂存, true-提交
 * - approveStatus为1时不可编辑
 * - 返回：`void`
 */
export function updateLogisticsProvider(data: any) {
  return request.post<void>({
    url: '/basic/logisticsProvider/update',
    data
  })
}

/**
 * 批量删除物流商（POST）
 * - 路径：`/basic/logisticsProvider/deleteBatch`
 * - 请求体：`ids` 数组
 * - 返回：`void`
 */
export function batchDeleteLogistics(ids: number[]) {
  return request.post<void>({
    url: '/basic/logisticsProvider/deleteBatch',
    data: ids,
    showSuccessMessage: true
  })
}

export function deleteLogistics(id: number) {
  return request.post<void>({
    url: '/basic/logisticsProvider/deleteBatch',
    data: [id],
    showSuccessMessage: true
  })
}

/**
 * 提交物流商（GET）
 * - 路径：`/basic/logisticsProvider/submit/{id}`
 * - 返回：`void`
 */
export function submitLogisticsProvider(id: number) {
  return request.get<void>({
    url: `/basic/logisticsProvider/submit/${id}`,
    showSuccessMessage: true
  })
}

/**
 * 撤回提交（GET）
 * - 路径：`/basic/logisticsProvider/cancelSubmit/{id}`
 * - 返回：`void`
 */
export function cancelSubmitLogistics(id: number) {
  return request.get<void>({
    url: `/basic/logisticsProvider/cancelSubmit/${id}`,
    showSuccessMessage: true
  })
}

/**
 * 导出物流商（POST）
 * - 路径：`/basic/logisticsProvider/export`
 * - 请求体：与分页查询相同的参数
 * - 返回：文件流
 */
export function exportLogisticsProvider(params: any) {
  return request.post<Blob>({
    url: '/basic/logisticsProvider/export',
    data: params,
    responseType: 'blob'
  })
}
