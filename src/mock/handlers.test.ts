import { describe, it, expect } from 'vitest'
import { resolveMock, hasMock } from './handlers'

describe('mock handlers 路由解析', () => {
  it('未匹配的接口返回 undefined', () => {
    expect(resolveMock('/api1/not/exist')).toBeUndefined()
    expect(hasMock('/api1/not/exist')).toBe(false)
  })

  it('采购概况：分页 + 期间列 + 记录结构', () => {
    const res: any = resolveMock('/api1/ims/cost/purchase/overview', {
      currentPage: 1,
      pageSize: 3,
      period: 'month',
      metric: 'unitCost'
    })
    expect(res.total).toBeGreaterThan(0)
    expect(res.records.length).toBe(3)
    const row = res.records[0]
    expect(row).toHaveProperty('sku')
    expect(row).toHaveProperty('latestCosts')
    expect(Array.isArray(row.periodDetails)).toBe(true)
    expect(row.periodDetails[0]).toHaveProperty('label')
    expect(row.periodDetails[0]).toHaveProperty('value')
    // purchaseManager 为 JSON 字符串数组
    expect(() => JSON.parse(row.purchaseManager)).not.toThrow()
  })

  it('采购概况：按 SKU 过滤', () => {
    const res: any = resolveMock('/ims/cost/purchase/overview', {
      currentPage: 1,
      pageSize: 20,
      skuCode: 'MK-CASE-001'
    })
    expect(res.records.every((r: any) => r.sku.includes('MK-CASE-001'))).toBe(true)
  })

  it('采购筛选项结构', () => {
    const res: any = resolveMock('/ims/cost/purchase/filter-options', {})
    expect(Array.isArray(res.suppliers)).toBe(true)
    expect(Array.isArray(res.purchaseManagers)).toBe(true)
  })

  it('物流概况：渠道口径 latestCosts.channelName', () => {
    const res: any = resolveMock('/ims/cost/logistics/overview', {
      currentPage: 1,
      pageSize: 5,
      period: 'month',
      metric: 'unitLogisticsCost'
    })
    expect(res.records[0].latestCosts[0]).toHaveProperty('channelName')
    expect(res.records[0]).toHaveProperty('logisticsManager')
  })

  it('物流批次明细：运单字段与渠道汇总对齐页面映射器', () => {
    const res: any = resolveMock('/ims/cost/logistics/batch-details', {
      code: 'MK-CASE-001',
      currentPage: 1,
      pageSize: 50
    })
    const row = res.records[0]
    // 页面 mock-batch-detail.ts 消费的关键字段
    ;['waybillNo', 'logisticsChannelName', 'shippedQty', 'unitLogisticsCost', 'totalLogisticsCost', 'shipTime'].forEach(
      (f) => expect(row).toHaveProperty(f)
    )
    // 不应再出现采购口径字段
    expect(row).not.toHaveProperty('supplierName')
    expect(res.summary).toHaveProperty('weightedUnitLogisticsCost')
    expect(res.summary.channelBreakdowns[0]).toHaveProperty('channelName')
  })

  it('物流批次明细：按渠道过滤生效', () => {
    const all: any = resolveMock('/ims/cost/logistics/batch-details', { code: 'MK-CASE-001' })
    const channel = all.records[0].logisticsChannelName
    const filtered: any = resolveMock('/ims/cost/logistics/batch-details', {
      code: 'MK-CASE-001',
      logisticsChannelNameList: [channel]
    })
    expect(filtered.records.every((r: any) => r.logisticsChannelName === channel)).toBe(true)
  })

  it('物流批次明细：按数字状态码（3=已签收）过滤生效', () => {
    const filtered: any = resolveMock('/ims/cost/logistics/batch-details', {
      code: 'MK-CASE-001',
      statusList: [3]
    })
    expect(filtered.records.length).toBeGreaterThan(0)
    expect(filtered.records.every((r: any) => r.statusCode === 3 && r.status === '已签收')).toBe(true)
    // 已签收应有签收时间
    expect(filtered.records.every((r: any) => r.signTime)).toBe(true)
  })

  it('物流概况：按物流负责人过滤生效（非采购负责人口径）', () => {
    const all: any = resolveMock('/ims/cost/logistics/overview', { pageSize: 20 })
    const mgr = all.records[0].logisticsManager
    expect(['物流负责人A', '物流负责人B', '物流负责人C']).toContain(mgr)
    const filtered: any = resolveMock('/ims/cost/logistics/overview', {
      pageSize: 20,
      logisticsManagerNameList: [mgr]
    })
    expect(filtered.records.length).toBeGreaterThan(0)
    expect(filtered.records.every((r: any) => r.logisticsManager === mgr)).toBe(true)
    // 传入采购负责人不应误命中（口径隔离）
    const byPurchaseMgr: any = resolveMock('/ims/cost/logistics/overview', {
      pageSize: 20,
      logisticsManagerNameList: ['张三']
    })
    expect(byPurchaseMgr.records.length).toBe(0)
  })

  it('物流价格历史：channelHistories 渠道口径', () => {
    const res: any = resolveMock('/ims/cost/logistics/price-history', { code: 'MK-CASE-001' })
    expect(Array.isArray(res.channelHistories)).toBe(true)
    expect(res.channelHistories[0]).toHaveProperty('channelName')
    expect(res.channelHistories[0].records[0]).toHaveProperty('effectiveDate')
    expect(res).toHaveProperty('logisticsManager')
  })

  it('物流趋势分析：series/channelShares/compareSeries 均为渠道口径', () => {
    const res: any = resolveMock('/ims/cost/logistics/trend-analysis', {
      code: 'MK-CASE-001',
      period: 'month',
      metricList: ['unitLogisticsCost', 'quantity']
    })
    expect(res.series).toHaveProperty('unitLogisticsCost')
    expect(res.series).toHaveProperty('totalLogisticsCost')
    expect(res.channelShares[0]).toHaveProperty('channelName')
    expect(res.compareSeries[0]).toHaveProperty('channelName')
    expect(res.kpis).toHaveProperty('currentUnitLogisticsCost')
    // 概况 latestCosts 的渠道名应与趋势 channelShares 渠道名一致（口径对齐）
    const ov: any = resolveMock('/ims/cost/logistics/overview', { pageSize: 20 })
    const ovRow = ov.records.find((r: any) => r.sku === 'MK-CASE-001')
    const ovChannels = ovRow.latestCosts.map((c: any) => c.channelName).sort()
    const trendChannels = res.channelShares.map((c: any) => c.channelName).sort()
    expect(trendChannels).toEqual(ovChannels)
  })

  it('ASIN 日统计：确定性（同一请求两次结果一致）', () => {
    const a = JSON.stringify(resolveMock('/ims/sales/asin/daily-statistics', { asin: 'B08XYZ', grain: 'day' }))
    const b = JSON.stringify(resolveMock('/ims/sales/asin/daily-statistics', { asin: 'B08XYZ', grain: 'day' }))
    expect(a).toBe(b)
  })

  it('SKU 概况：含 alertType 字段', () => {
    const res: any = resolveMock('/ims/cost/sku/overview', { currentPage: 1, pageSize: 20 })
    expect(res.records.length).toBeGreaterThan(0)
    expect(res.records[0]).toHaveProperty('inStockBatchCount')
    expect(res.records.some((r: any) => r.alertType)).toBe(true)
  })

  it('SKU fifo 明细：summary + records', () => {
    const res: any = resolveMock('/ims/cost/sku/fifo-details', { skuCode: 'A001' })
    expect(res.summary).toHaveProperty('weightedAvgCost')
    expect(res.records[0]).toHaveProperty('fifoBatchNo')
  })

  it('销量概况：销量/广告指标卡', () => {
    const res: any = resolveMock('/ims/sales/statistics/overview', { channel: 'combined' })
    expect(res.salesMetrics.length).toBeGreaterThan(0)
    expect(res.adMetrics.length).toBeGreaterThan(0)
    expect(res.salesMetrics[0]).toHaveProperty('value')
  })

  it('销量趋势：series + normalizedValues', () => {
    const res: any = resolveMock('/ims/sales/statistics/trend', {
      channel: 'combined',
      granularity: 'day'
    })
    expect(res.columns.length).toBeGreaterThan(0)
    expect(res.series[0].values.length).toBe(res.columns.length)
    expect(res.series[0].normalizedValues.length).toBe(res.columns.length)
  })

  it('导出接口返回递增任务 ID', () => {
    const a = resolveMock('/ims/cost/purchase/export', {}) as number
    const b = resolveMock('/ims/cost/sku/batches/export', {}) as number
    expect(typeof a).toBe('number')
    expect(b).toBeGreaterThan(a)
  })

  it('导出优先于上级路由匹配（order-details/export 不落到 order-details）', () => {
    const res = resolveMock('/ims/cost/purchase/order-details/export', {})
    expect(typeof res).toBe('number')
  })
})
