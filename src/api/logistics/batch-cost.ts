import request from '@/utils/http'

export function logisticsCostPageList(params: any) {
  return request.post({
    url: `/ims/cost/logistics/overview`,
    params
  })
}

export function logisticsCostFilterOptions(params?: any) {
  return request.get({
    url: `/ims/cost/logistics/filter-options`,
    params
  })
}

export function logisticsCostBatchDetails(params: any) {
  return request.post({
    url: `/ims/cost/logistics/batch-details`,
    params
  })
}

export function logisticsCostPriceHistory(params: any) {
  return request.get({
    url: `/ims/cost/logistics/price-history`,
    params
  })
}

export function logisticsCostTrendAnalysis(params: any) {
  return request.post({
    url: `/ims/cost/logistics/trend-analysis`,
    params
  })
}

// 异步导出：返回导出任务 taskId，由「下载中心」获取结果
export function logisticsCostExport(params: any) {
  return request.post({
    url: `/ims/cost/logistics/export`,
    params
  })
}

// 异步导出：返回导出任务 taskId，由「下载中心」获取结果
export function logisticsCostBatchDetailsExport(params: any) {
  return request.post({
    url: `/ims/cost/logistics/batch-details/export`,
    params
  })
}
