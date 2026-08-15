import request from '@/utils/http'

/** 入库单详情（编辑回显） */
export function warehouseInDetail(id: string | number) {
  return request.post<any>({
    url: `/ims/ims-inbound-order/detail`,
    data: { id }
  })
}

/** 入库单分页列表 */
export function warehouseInPage(params: any) {
  return request.post({
    url: `/ims/ims-inbound-order/page`,
    data: params
  })
}

/** 各状态数量统计 */
export function warehouseInStatusCount(params: any) {
  return request.post({
    url: `/ims/ims-inbound-order/statusCount`,
    data: params
  })
}

/** 提交（草稿 → 待入库） */
export function warehouseInSubmit(ids: (string | number)[]) {
  return request.post({
    url: `/ims/ims-inbound-order/submit`,
    data: { ids }
  })
}

/** 撤回（待入库 → 草稿） */
export function warehouseInRecall(ids: (string | number)[]) {
  return request.post({
    url: `/ims/ims-inbound-order/withdraw`,
    data: { ids }
  })
}

/** 删除（仅草稿） */
export function warehouseInDelete(ids: (string | number)[]) {
  return request.post({
    url: `/ims/ims-inbound-order/delete`,
    data: { ids }
  })
}

/** 作废（待入库 → 已作废） */
export function warehouseInInvalidate(ids: (string | number)[]) {
  return request.post({
    url: `/ims/ims-inbound-order/void`,
    data: { ids }
  })
}

/** 确认入库（待入库 → 已完成） */
export function warehouseInConfirm(ids: (string | number)[]) {
  return request.post({
    url: `/ims/ims-inbound-order/confirm`,
    data: { ids }
  })
}

/** 更新入库单部分字段（如单据负责人） */
export function warehouseInEditFields(params: {
  id: string | number
  documentManagerIds: (string | number)[]
  documentManagerNames?: string[]
}) {
  return request.post({
    url: `/ims/ims-inbound-order/owner/edit`,
    data: {
      orderId: params.id,
      ownerIdList: params.documentManagerIds
    }
  })
}
// 异步导出
export function exportwarehouseIn(params: any) {
  return request.post({
    url: `/ims/ims-inbound-order/export`,
    data: params
  })
}
// 新增入库单
export function warehouseInSave(params: any) {
  return request.post({
    url: `/ims/ims-inbound-order/save`,
    data: params
  })
}
// 编辑入库单
export function warehouseInEdit(params: any) {
  return request.post({
    url: `/ims/ims-inbound-order/edit`,
    data: params
  })
}
// 查询入库单工作流进度
export function warehouseInProgress(params: any) {
  return request.post({
    url: `/ims/ims-inbound-order/progress`,
    data: params
  })
}
