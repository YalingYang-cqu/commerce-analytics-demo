import request from '@/utils/http'

/** 批次结存主表分页（批次明细） */
export function batchBalanceList(params: any) {
  return request.post({
    url: `/ims/inventory/batch/balance`,
    params
  })
}

/** 按本地SKU + 仓库汇总分页 */
export function batchBalanceGroupList(params: any) {
  return request.post({
    url: `/ims/inventory/batch/balance-group`,
    params
  })
}

/** 顶部指标 + 合计行（全量口径，不随分页变化） */
export function batchBalanceSummary(params: any) {
  return request.post({
    url: `/ims/inventory/batch/summary`,
    params
  })
}

/** 单批次消耗流水（展开行 / 抽屉第三段） */
export function batchConsumeFlow(params: any) {
  return request.post({
    url: `/ims/inventory/batch/consume-flow`,
    params
  })
}

/** 批次台账（抽屉：概览 + 对平瀑布 + 溯源链） */
export function batchLedger(params: any) {
  return request.get({
    url: `/ims/inventory/batch/ledger`,
    params
  })
}

/** 筛选项下拉（公司主体 / 仓库 / 店铺） */
export function batchFilterOptions(params?: any) {
  return request.get({
    url: `/ims/inventory/batch/filter-options`,
    params
  })
}

// 异步导出：返回导出任务 taskId，由「下载中心」获取结果
export function batchBalanceExport(params: any) {
  return request.post({
    url: `/ims/inventory/batch/export`,
    params
  })
}

// 异步导出：单批次消耗流水
export function batchConsumeFlowExport(params: any) {
  return request.post({
    url: `/ims/inventory/batch/consume-flow/export`,
    params
  })
}
