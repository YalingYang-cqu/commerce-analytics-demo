/**
 * Mock 路由解析器（纯函数，便于单测）。
 *
 * 输入：请求 url + 合并后的参数（query + body）。
 * 输出：业务负载对象（不含 code/msg 包裹）；未匹配返回 undefined。
 *
 * 匹配基于 url 的「路径片段包含」，因此对开发环境代理前缀（如 /api1/ims/...）天然兼容。
 * 顺序敏感：更具体的路由（如 .../export）必须排在其上级路由之前。
 */
import * as system from './data/system'
import * as cost from './data/cost'
import * as sales from './data/sales'
import * as profit from './data/profit'
import * as inventory from './data/inventory-cost'

type Handler = (params: Record<string, any>) => unknown

let taskSeq = 90000
/** 异步导出：返回一个自增的下载任务 ID（下载中心据此获取结果） */
const exportTask: Handler = () => ++taskSeq

const routes: Array<[RegExp, Handler]> = [
  // ---------------- 启动链路 ----------------
  [/\/system\/sys-dict\/getDictCache/, system.dictCache],
  [/\/system\/sys-role\/get-user-permission/, system.permission],
  [/\/system\/sys-user\/getAllUserInfo/, system.allUserInfo],
  [/\/system\/sys-user\/getHabits/, system.userHabits],
  [/\/system\/sys-user\/saveUserHabits/, system.ok],
  [/\/system\/export-task\/page/, system.exportTaskPage],

  // ---------------- 公共下拉 ----------------
  [/\/basic\/productBrand\/page/, system.brandPage],
  [/\/basic\/productCategory\/tree/, system.categoryTree],
  [/\/basic\/StoreManage\/getAllStoreInfo/, system.storeAll],
  [/\/system\/dropdown\/all-country/, system.allCountry],
  [/\/system\/dropdown\/currency/, system.currencyList],
  [/\/basic\/currency\/listEnabled/, system.currencyList],
  [/\/logistics\/logisticsChannel|\/logistics-channel/, system.logisticsChannelPage],
  [/company\/(page|getCompanyList)|companyPageList/, system.companyPage],
  [/warehouse.*page|warehousePageAll/, system.warehousePage],

  // ---------------- 采购批次成本 ----------------
  [/\/ims\/cost\/purchase\/order-details\/export/, exportTask],
  [/\/ims\/cost\/purchase\/export/, exportTask],
  [/\/ims\/cost\/purchase\/overview/, cost.purchaseOverview],
  [/\/ims\/cost\/purchase\/filter-options/, cost.purchaseFilterOptions],
  [/\/ims\/cost\/purchase\/order-details/, cost.purchaseOrderDetails],
  [/\/ims\/cost\/purchase\/price-history/, cost.purchasePriceHistory],
  [/\/ims\/cost\/purchase\/trend-analysis/, cost.purchaseTrendAnalysis],

  // ---------------- 物流批次成本 ----------------
  [/\/ims\/cost\/logistics\/batch-details\/export/, exportTask],
  [/\/ims\/cost\/logistics\/export/, exportTask],
  [/\/ims\/cost\/logistics\/overview/, cost.logisticsOverview],
  [/\/ims\/cost\/logistics\/filter-options/, cost.logisticsFilterOptions],
  [/\/ims\/cost\/logistics\/batch-details/, cost.logisticsBatchDetails],
  [/\/ims\/cost\/logistics\/price-history/, cost.logisticsPriceHistory],
  [/\/ims\/cost\/logistics\/trend-analysis/, cost.logisticsTrendAnalysis],

  // ---------------- SKU 综合成本 ----------------
  [/\/ims\/cost\/sku\/batches\/export/, exportTask],
  [/\/ims\/cost\/sku\/export/, exportTask],
  [/\/ims\/cost\/sku\/overview/, cost.skuOverview],
  [/\/ims\/cost\/sku\/batches/, cost.skuBatches],
  [/\/ims\/cost\/sku\/filter-options/, cost.skuFilterOptions],
  [/\/ims\/cost\/sku\/fifo-details/, cost.skuFifoDetails],
  [/\/ims\/cost\/sku\/trend-analysis/, cost.skuTrendAnalysis],

  // ---------------- 成本中心 · 批次结存 ----------------
  [/\/ims\/inventory\/batch\/consume-flow\/export/, exportTask],
  [/\/ims\/inventory\/batch\/export/, exportTask],
  [/\/ims\/inventory\/batch\/balance-group/, inventory.batchBalanceGroup],
  [/\/ims\/inventory\/batch\/balance/, inventory.batchBalance],
  [/\/ims\/inventory\/batch\/summary/, inventory.batchSummary],
  [/\/ims\/inventory\/batch\/consume-flow/, inventory.batchConsumeFlow],
  [/\/ims\/inventory\/batch\/ledger/, inventory.batchLedger],
  [/\/ims\/inventory\/batch\/filter-options/, inventory.batchFilterOptions],

  // ---------------- 成本中心 · 库存成本流水 ----------------
  [/\/ims\/inventory\/cost-flow\/inv-detail\/export/, exportTask],
  [/\/ims\/inventory\/cost-flow\/export/, exportTask],
  [/\/ims\/inventory\/cost-flow\/list/, inventory.costFlowList],
  [/\/ims\/inventory\/cost-flow\/summary/, inventory.costFlowSummary],
  [/\/ims\/inventory\/cost-flow\/trend/, inventory.costFlowTrend],
  [/\/ims\/inventory\/cost-flow\/inv-detail/, inventory.invFlowDetail],
  [/\/ims\/inventory\/cost-flow\/cost-detail/, inventory.costFlowDetail],
  [/\/ims\/inventory\/cost-flow\/sku-day/, inventory.skuDayCost],
  [/\/ims\/inventory\/cost-flow\/filter-options/, inventory.costFlowFilterOptions],

  // ---------------- 销量统计 ----------------
  [/\/ims\/sales\/statistics\/export/, exportTask],
  [/\/ims\/sales\/statistics\/overview/, sales.salesOverview],
  [/\/ims\/sales\/statistics\/detail/, sales.salesDetail],
  [/\/ims\/sales\/statistics\/trend/, sales.salesTrend],
  [/\/ims\/sales\/statistics\/metric-pool/, sales.salesMetricPool],

  // ---------------- ASIN 看板 ----------------
  [/\/ims\/sales\/asin\/daily-statistics\/export/, exportTask],
  [/\/ims\/sales\/asin\/daily-statistics/, sales.asinDailyStatistics],
  [/\/ims\/sales\/asin\/hour-summary\/export/, exportTask],
  [/\/ims\/sales\/asin\/hour-summary/, sales.asinHourSummary],
  [/\/ims\/sales\/asin\/hour-compare\/export/, exportTask],
  [/\/ims\/sales\/asin\/hour-compare/, sales.asinHourCompare],

  // ---------------- SC 订单利润 ----------------
  [/\/ims\/sc-profit\/export/, exportTask],
  [/\/ims\/sc-profit\/dashboard-overview/, profit.dashboardOverview],
  [/\/ims\/sc-profit\/metric-pool/, profit.metricPool],
  [/\/ims\/sc-profit\/metrics/, profit.metrics],
  [/\/ims\/sc-profit\/trend/, profit.trend],
  [/\/ims\/sc-profit\/diagnosis/, profit.diagnosis],
  [/\/ims\/sc-profit\/profit-status-count/, profit.profitStatusCount],
  [/\/ims\/sc-profit\/fee-drilldown/, profit.feeDrilldown],
  [/\/ims\/sc-profit\/fee-rules/, profit.feeRules],
  [/\/ims\/sc-profit\/breakdown/, profit.breakdown],
  [/\/ims\/sc-profit\/store-options/, profit.storeOptions],
  [/\/ims\/sc-profit\/filter-options/, profit.filterOptions],
  [/\/ims\/sc-profit\/detail/, profit.detail]
]

/** 解析 url + 参数，返回业务负载；未命中返回 undefined */
export function resolveMock(url: string, params: Record<string, any> = {}): unknown | undefined {
  for (const [matcher, handler] of routes) {
    if (matcher.test(url)) {
      return handler(params)
    }
  }
  return undefined
}

/** 是否存在匹配的 Mock 路由 */
export function hasMock(url: string): boolean {
  return routes.some(([matcher]) => matcher.test(url))
}
