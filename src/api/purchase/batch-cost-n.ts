/**
 * 采购批次成本（新版）API
 * 独立模块，不依赖也不影响 order.ts 等旧接口
 *
 * 切换真实/模拟数据：把 USE_MOCK 改为 false 即可走真实后端
 */
import request from '@/utils/http'
import type {
  BcnSearchForm,
  BcnListPageResp,
  BcnPriceHistorySupplier,
  BcnTrendSummary,
  BcnTrendSeries,
  BcnTrendDonutItem,
  BcnBatchSummary,
  BcnBatchOrderItem,
  BcnBatchOrderQuery,
  BcnExportTask,
  BcnMetric
} from '@/types/purchase/batch-cost-n'
import {
  mockBatchOrders,
  mockBatchSummary,
  mockExport,
  mockPage,
  mockPriceHistory,
  mockTrendDonut,
  mockTrendSeries,
  mockTrendSummary
} from '@/views/purchase/batch-cost-n/utils/mock'

/** 是否启用本地 mock，联调真实后端时改为 false */
const USE_MOCK = true

const PREFIX = '/pms/batch-cost-n'

/** 主列表分页 */
export function bcnPage(params: BcnSearchForm & { current: number; size: number }) {
  if (USE_MOCK) return mockPage(params) as unknown as Promise<BcnListPageResp>
  return request.post<BcnListPageResp>({
    url: `${PREFIX}/page`,
    params
  })
}

/** 主列表导出（异步任务） */
export function bcnExportList(_params: BcnSearchForm) {
  if (USE_MOCK) return mockExport() as unknown as Promise<BcnExportTask>
  return request.post<BcnExportTask>({
    url: `${PREFIX}/export`,
    params: _params
  })
}

/** 完整价格历史（按供应商分组） */
export function bcnPriceHistory(productId: string) {
  if (USE_MOCK) return mockPriceHistory(productId) as unknown as Promise<BcnPriceHistorySupplier[]>
  return request.get<BcnPriceHistorySupplier[]>({
    url: `${PREFIX}/${productId}/price-history`
  })
}

/** 价格历史导出 */
export function bcnExportPriceHistory(productId: string) {
  if (USE_MOCK) return mockExport() as unknown as Promise<BcnExportTask>
  return request.post<BcnExportTask>({
    url: `${PREFIX}/${productId}/price-history/export`
  })
}

/** 趋势分析-顶部汇总卡 */
export function bcnTrendSummary(productId: string) {
  if (USE_MOCK) return mockTrendSummary(productId) as unknown as Promise<BcnTrendSummary>
  return request.get<BcnTrendSummary>({
    url: `${PREFIX}/${productId}/trend/summary`
  })
}

/** 趋势分析-主图序列（多指标 × 多供应商） */
export function bcnTrendSeries(
  productId: string,
  metrics: BcnMetric[],
  supplierIds: (number | string | 'all')[]
) {
  if (USE_MOCK)
    return mockTrendSeries(productId, metrics, supplierIds) as unknown as Promise<BcnTrendSeries[]>
  return request.get<BcnTrendSeries[]>({
    url: `${PREFIX}/${productId}/trend/series`,
    params: { metrics, supplierIds }
  })
}

/** 趋势分析-供应商占比环形图 */
export function bcnTrendDonut(productId: string) {
  if (USE_MOCK) return mockTrendDonut(productId) as unknown as Promise<BcnTrendDonutItem[]>
  return request.get<BcnTrendDonutItem[]>({
    url: `${PREFIX}/${productId}/trend/donut`
  })
}

/** 分批次明细-汇总卡 */
export function bcnBatchSummary(productId: string) {
  if (USE_MOCK) return mockBatchSummary(productId) as unknown as Promise<BcnBatchSummary>
  return request.get<BcnBatchSummary>({
    url: `${PREFIX}/${productId}/batch/summary`
  })
}

/** 分批次明细-订单明细分页 */
export function bcnBatchOrders(productId: string, params: BcnBatchOrderQuery) {
  if (USE_MOCK) {
    return mockBatchOrders(productId, params) as unknown as Promise<{
      records: BcnBatchOrderItem[]
      total: number
    }>
  }
  return request.post<{ records: BcnBatchOrderItem[]; total: number }>({
    url: `${PREFIX}/${productId}/batch/orders`,
    params
  })
}

/** 分批次明细-订单明细导出 */
export function bcnExportBatchOrders(productId: string, _params: BcnBatchOrderQuery) {
  if (USE_MOCK) return mockExport() as unknown as Promise<BcnExportTask>
  return request.post<BcnExportTask>({
    url: `${PREFIX}/${productId}/batch/orders/export`,
    params: _params
  })
}
