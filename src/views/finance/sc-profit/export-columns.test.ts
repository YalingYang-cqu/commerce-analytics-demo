import { describe, expect, it } from 'vitest'
import { buildDetailColumns } from './columns'
import {
  ORDER_PROFIT_EXPORT_MAX_ROWS,
  assertOrderProfitExportWithinLimit,
  buildOrderProfitExportQuery,
  resolveExportColumns
} from './export'

describe('SC订单利润导出列对齐列表', () => {
  it('看板按 PRD 默认可见列顺序导出，并跳过趋势列', () => {
    expect(resolveExportColumns(buildDetailColumns('dashboard'))).toEqual([
      'date',
      'salesWoW',
      'profitWoW',
      'marginChange',
      'profit',
      'margin',
      'sales',
      'buyerShipping',
      'qty',
      'referral',
      'fba',
      'promoDiscount',
      'refundTotal',
      'ad',
      'promoFee',
      'testFee',
      'storageFee',
      'fbaFulfillmentFee',
      'platformOtherFee',
      'purchase',
      'head',
      'totalCost',
      'fbaInventoryReimbursement',
      'otherIncome'
    ])
  })

  it('四个商品 Tab 分别按页面当前默认可见字段及顺序导出', () => {
    const commonMetrics = [
      'profit',
      'margin',
      'sales',
      'buyerShipping',
      'qty',
      'referral',
      'fba',
      'promoDiscount',
      'refundTotal',
      'ad',
      'promoFee',
      'testFee',
      'storageFee',
      'fbaFulfillmentFee',
      'platformOtherFee',
      'purchase',
      'head',
      'totalCost',
      'fbaInventoryReimbursement',
      'otherIncome'
    ]
    const unitProfit = ['unitPrice', 'unitNetProfit', 'unitAd', 'unitPromoFee']

    expect(resolveExportColumns(buildDetailColumns('parentAsin'))).toEqual([
      'parentAsin',
      'asin',
      ...commonMetrics.slice(0, 2),
      ...unitProfit,
      ...commonMetrics.slice(2)
    ])
    expect(resolveExportColumns(buildDetailColumns('asin'))).toEqual([
      'asin',
      'parentAsin',
      'msku',
      ...commonMetrics
    ])
    expect(resolveExportColumns(buildDetailColumns('msku'))).toEqual([
      'asin',
      'msku',
      ...commonMetrics
    ])
    expect(resolveExportColumns(buildDetailColumns('spu'))).toEqual([
      'spu',
      'msku',
      ...commonMetrics
    ])
  })

  it('订单 Tab 按页面当前默认可见字段及顺序导出', () => {
    expect(resolveExportColumns(buildDetailColumns('order'))).toEqual([
      'orderNo',
      'asin',
      'msku',
      'orderTime',
      'settleTime',
      'profit',
      'margin',
      'sales',
      'buyerShipping',
      'qty',
      'referral',
      'fba',
      'promoDiscount',
      'refundTotal',
      'ad',
      'promoFee',
      'testFee',
      'storageFee',
      'fbaFulfillmentFee',
      'platformOtherFee',
      'purchase',
      'head',
      'totalCost',
      'fbaInventoryReimbursement',
      'otherIncome'
    ])
  })

  it('用户调整后的显隐和顺序直接决定导出列', () => {
    expect(
      resolveExportColumns([
        { prop: 'margin', checked: true },
        { prop: 'image', checked: true },
        { prop: 'testFee', checked: true },
        { prop: 'trend', checked: true },
        { prop: 'sales', checked: false },
        { prop: 'ad', checked: true, hide: true }
      ] as any)
    ).toEqual(['margin', 'testFee'])
    expect(ORDER_PROFIT_EXPORT_MAX_ROWS).toBe(20000)
  })

  it('商品 Tab 勾选单个平台费用/其他收入后导出包含这些列', () => {
    const cols = buildDetailColumns('asin').map((c) =>
      c.prop === 'unitFba' || c.prop === 'unitOtherIncome' ? { ...c, checked: true } : c
    )
    const exported = resolveExportColumns(cols as any)
    expect(exported).toContain('unitFba')
    expect(exported).toContain('unitOtherIncome')
  })

  it('导出保留页面当前筛选和数据排序，仅重置分页及层级参数', () => {
    const query = buildOrderProfitExportQuery(
      {
        tab: 'order',
        dateStart: '2026-07-10',
        dateEnd: '2026-07-10',
        sortField: 'orderTime',
        sortOrder: 'desc',
        pageNo: 3,
        pageSize: 20,
        withChildren: true
      },
      [
        { prop: 'orderNo', checked: true },
        { prop: 'profit', checked: true }
      ] as any
    )

    expect(query).toMatchObject({
      tab: 'order',
      dateStart: '2026-07-10',
      dateEnd: '2026-07-10',
      sortField: 'orderTime',
      sortOrder: 'desc',
      pageNo: 1,
      pageSize: 20000,
      hasCount: false,
      withChildren: false,
      columns: ['orderNo', 'profit']
    })
  })

  it('导出前超过 20000 行直接拦截', () => {
    expect(() => assertOrderProfitExportWithinLimit(20000)).not.toThrow()
    expect(() => assertOrderProfitExportWithinLimit(20001)).toThrow(
      '导出数据超过20000行，请缩小筛选范围后重试'
    )
  })
})
