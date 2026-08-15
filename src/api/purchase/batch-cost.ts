import request from '@/utils/http'

export function purchaseCostPageList(params: any) {
  return request.post({
    url: `/ims/cost/purchase/overview`,
    params
  })
}

export function purchaseCostFilterOptions(params?: any) {
  return request.get({
    url: `/ims/cost/purchase/filter-options`,
    params
  })
}

export function purchaseCostOrderDetails(params: any) {
  return request.post({
    url: `/ims/cost/purchase/order-details`,
    params
  })
}

export function purchaseCostPriceHistory(params: any) {
  return request.get({
    url: `/ims/cost/purchase/price-history`,
    params
  })
}

export function purchaseCostTrendAnalysis(params: any) {
  return request.post({
    url: `/ims/cost/purchase/trend-analysis`,
    params
  })
}

// 异步导出：返回导出任务 taskId，由「下载中心」获取结果
export function purchaseCostExport(params: any) {
  return request.post({
    url: `/ims/cost/purchase/export`,
    params
  })
}

// 异步导出：返回导出任务 taskId，由「下载中心」获取结果
export function purchaseCostOrderDetailsExport(params: any) {
  return request.post({
    url: `/ims/cost/purchase/order-details/export`,
    params
  })
}
