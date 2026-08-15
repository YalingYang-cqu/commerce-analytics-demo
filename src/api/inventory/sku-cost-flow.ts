import request from '@/utils/http'

/** 平台每日 SKU 库存 / 成本流水主表分页 */
export function skuCostFlowList(params: any) {
  return request.post({
    url: `/ims/inventory/cost-flow/list`,
    params
  })
}

/** 顶部指标 + 合计行（全量口径） */
export function skuCostFlowSummary(params: any) {
  return request.post({
    url: `/ims/inventory/cost-flow/summary`,
    params
  })
}

/** 按库存日期聚合的主表指标趋势 */
export function skuCostFlowTrend(params: any) {
  return request.post({
    url: `/ims/inventory/cost-flow/trend`,
    params
  })
}

/** 一级展开：当日库存流水明细（平台流水层） */
export function invFlowDetail(params: any) {
  return request.post({
    url: `/ims/inventory/cost-flow/inv-detail`,
    params
  })
}

/** 二级展开：成本流水明细（按批次拆行） */
export function costFlowDetail(params: any) {
  return request.post({
    url: `/ims/inventory/cost-flow/cost-detail`,
    params
  })
}

/** SKU 当日成本抽屉：成本瀑布 + 期末批次构成 + 趋势 */
export function skuDayCost(params: any) {
  return request.get({
    url: `/ims/inventory/cost-flow/sku-day`,
    params
  })
}

/** 筛选项下拉 */
export function costFlowFilterOptions(params?: any) {
  return request.get({
    url: `/ims/inventory/cost-flow/filter-options`,
    params
  })
}

// 异步导出：返回导出任务 taskId，由「下载中心」获取结果
export function skuCostFlowExport(params: any) {
  return request.post({
    url: `/ims/inventory/cost-flow/export`,
    params
  })
}

// 异步导出：库存流水明细
export function invFlowDetailExport(params: any) {
  return request.post({
    url: `/ims/inventory/cost-flow/inv-detail/export`,
    params
  })
}
