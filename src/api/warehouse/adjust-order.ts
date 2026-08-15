import request from '@/utils/http'

/** 调整单详情（编辑回显） */
export function adjustOrderDetail(id: string | number) {
  return request.post<any>({
    url: `/basic/adjust-order/detail`,
    data: { id }
  })
}

/** 调整单分页列表 */
export function adjustOrderPage(params: any) {
  return request.post({
    url: `/basic/adjust-order/page`,
    data: params
  })
}

/** 各状态数量统计 */
export function adjustOrderStatusCount(params: any) {
  return request.post({
    url: `/basic/adjust-order/status-count`,
    data: params
  })
}

/** 提交（草稿 → 待调整） */
export function adjustOrderSubmit(ids: (string | number)[]) {
  return request.post({
    url: `/basic/adjust-order/submit`,
    data: ids
  })
}

/** 撤回（待调整 → 草稿） */
export function adjustOrderRecall(ids: (string | number)[]) {
  return request.post({
    url: `/basic/adjust-order/recall`,
    data: ids
  })
}

/** 删除（仅草稿） */
export function adjustOrderDelete(ids: (string | number)[]) {
  return request.post({
    url: `/basic/adjust-order/delete`,
    data: ids
  })
}

/** 作废（待调整 → 已作废） */
export function adjustOrderInvalidate(ids: (string | number)[]) {
  return request.post({
    url: `/basic/adjust-order/invalidate`,
    data: ids
  })
}

/** 确认调整（待调整 → 已完成） */
export function adjustOrderConfirmAdjust(ids: (string | number)[]) {
  return request.post({
    url: `/basic/adjust-order/confirm-adjust`,
    data: ids
  })
}

/** 更新调整单部分字段（如单据负责人） */
export function adjustOrderEditFields(params: {
  id: string | number
  documentManagerIds?: (string | number)[]
  documentManagerNames?: string[]
}) {
  return request.put({
    url: `/basic/adjust-order/update/${params.id}`,
    data: params
  })
}
