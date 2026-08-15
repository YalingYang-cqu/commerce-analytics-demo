import request from '@/utils/http'

export function skuCostOverview(params: any) {
  return request.post({
    url: `/ims/cost/sku/overview`,
    params
  })
}

export function skuCostBatches(params: any) {
  return request.post({
    url: `/ims/cost/sku/batches`,
    params
  })
}

export function skuCostFilterOptions(params?: any) {
  return request.get({
    url: `/ims/cost/sku/filter-options`,
    params
  })
}

export function skuCostFifoDetails(params: any) {
  return request.get({
    url: `/ims/cost/sku/fifo-details`,
    params
  })
}

export function skuCostTrendAnalysis(params: any) {
  return request.post({
    url: `/ims/cost/sku/trend-analysis`,
    params
  })
}

// 异步导出：返回导出任务 taskId，由「下载中心」获取结果
export function skuCostOverviewExport(params: any) {
  return request.post({
    url: `/ims/cost/sku/export`,
    params
  })
}

// 异步导出：返回导出任务 taskId，由「下载中心」获取结果
export function skuCostBatchesExport(params: any) {
  return request.post({
    url: `/ims/cost/sku/batches/export`,
    params
  })
}
