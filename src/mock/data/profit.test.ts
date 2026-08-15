import { describe, expect, it } from 'vitest'
import { resolveMock } from '../handlers'

const base = {
  dateStart: '2026-07-06',
  dateEnd: '2026-08-04',
  dateType: 'order',
  currency: 'USD',
  site: ['US'],
  orderSource: 'all'
}
const order7 = { ...base, dateStart: '2026-07-29' }

const call = (url: string, params: any): any => resolveMock(url, params)
const sum = (rows: any[], key: string) =>
  Math.round(rows.reduce((acc, r) => acc + (Number(r[key]) || 0), 0) * 100) / 100
const card = (res: any, metric: string) => res.cards.find((c: any) => c.metric === metric).value

describe('sc-profit mock 内部一致性', () => {
  it('看板：明细行合计 = 汇总行 = 指标卡', () => {
    const p = { ...base, tab: 'dashboard', granularity: 'day', pageNo: 1, pageSize: 20, withChildren: true }
    const vo = call('/ims/sc-profit/detail', p)
    const cards = call('/ims/sc-profit/metrics', { ...base, tab: 'dashboard' })
    ;['sales', 'profit', 'qty', 'ad', 'purchase'].forEach((key) => {
      expect(sum(vo.rows, key)).toBeCloseTo(Number(vo.summary[key]), 2)
      expect(Number(vo.summary[key])).toBeCloseTo(Number(card(cards, key === 'purchase' ? 'purchase' : key)), 2)
    })
    // 利润额 = 收入 − 支出 − 库存成本 + 其他收入
    const s = vo.summary
    const expected =
      s.sales +
      s.buyerShipping +
      s.referral + s.fba + s.promoDiscount + s.refundTotal + s.ad + s.promoFee +
      s.testFee + s.storageFee + s.fbaFulfillmentFee + s.platformOtherFee +
      s.purchase + s.head +
      s.fbaInventoryReimbursement + s.otherIncome
    expect(s.profit).toBeCloseTo(expected, 2)
    expect(s.totalCost).toBeCloseTo(s.purchase + s.head, 2)
  })

  it('看板：周粒度子行合计 = 父行', () => {
    const vo = call('/ims/sc-profit/detail', {
      ...base, tab: 'dashboard', granularity: 'week', pageNo: 1, pageSize: 20, withChildren: true
    })
    const parent = vo.rows.find((r: any) => r.children?.length > 1)
    expect(parent).toBeTruthy()
    ;['sales', 'profit', 'qty', 'ad'].forEach((key) => {
      expect(sum(parent.children, key)).toBeCloseTo(Number(parent[key]), 2)
    })
  })

  it('看板：趋势各点之和 = 指标卡利润额', () => {
    const overview = call('/ims/sc-profit/dashboard-overview', {
      ...base, tab: 'dashboard', granularity: 'day', metrics: ['profit', 'sales']
    })
    const profitSeries = overview.trend.series.find((s: any) => s.metric === 'profit')
    expect(sum(profitSeries.values.map((v: number) => ({ v })), 'v')).toBeCloseTo(
      Number(card(overview.metrics, 'profit')), 1
    )
  })

  it('商品维度：父ASIN 子行合计 = 父行，且分页总数一致', () => {
    const p = { ...base, tab: 'parentAsin', pageNo: 1, pageSize: 20, withChildren: true }
    const vo = call('/ims/sc-profit/detail', p)
    const parent = vo.rows.find((r: any) => r.children?.length > 1)
    expect(parent).toBeTruthy()
    ;['sales', 'profit', 'qty'].forEach((key) => {
      expect(sum(parent.children, key)).toBeCloseTo(Number(parent[key]), 2)
    })
    expect(sum(vo.rows, 'profit')).toBeCloseTo(Number(vo.summary.profit), 2)
  })

  it('商品维度：待处理项卡片数 = 风险项筛选后的条数', () => {
    const cards = call('/ims/sc-profit/metrics', { ...base, tab: 'asin' })
    const pending = card(cards, 'pendingAction')
    const loss = card(cards, 'lossCount')
    const low = card(cards, 'lowMarginCount')
    expect(pending).toBe(loss + low)
    const filtered = call('/ims/sc-profit/detail', {
      ...base, tab: 'asin', pageNo: 1, pageSize: 20, profitStatus: 'risk'
    })
    expect(filtered.total).toBe(pending)
    // 亏损额 = 亏损对象利润额合计
    const all = call('/ims/sc-profit/detail', { ...base, tab: 'asin', pageNo: 1, pageSize: 50 })
    const lossRows = all.rows.filter((r: any) => Number(r.profit) < 0)
    expect(lossRows.length).toBe(loss)
    expect(sum(lossRows, 'profit')).toBeCloseTo(card(cards, 'lossAmount'), 2)
  })

  it('订单维度：三张异常卡片数 = 点击后明细条数', () => {
    const cards = call('/ims/sc-profit/metrics', { ...order7, tab: 'order' })
    const total = call('/ims/sc-profit/detail', { ...order7, tab: 'order', pageNo: 1, pageSize: 20 })
    expect(total.total).toBe(card(cards, 'todayOrderCount'))
    expect(Number(total.summary.sales)).toBeCloseTo(card(cards, 'todaySales'), 2)
    expect(Number(total.summary.profit)).toBeCloseTo(card(cards, 'estimatedProfit'), 2)

    const cases: Array<[string, string]> = [
      ['loss', 'lossOrderCount'],
      ['offsite', 'offsiteOrderCount'],
      ['unshipped', 'unshippedOrderCount']
    ]
    cases.forEach(([code, metric]) => {
      const filtered = call('/ims/sc-profit/detail', {
        ...order7, tab: 'order', pageNo: 1, pageSize: 20, metricCardFilter: code
      })
      expect(filtered.total).toBe(card(cards, metric))
    })
  })

  it('订单维度：利润状态分档计数合计 = 全部', () => {
    const counts = call('/ims/sc-profit/profit-status-count', { ...order7, tab: 'order' })
    expect(counts.loss + counts.low + counts.normal + counts.high).toBe(counts.all)
    expect(counts.loss).toBeGreaterThan(0)
    expect(counts.high).toBeGreaterThan(0)
    const filtered = call('/ims/sc-profit/detail', {
      ...order7, tab: 'order', pageNo: 1, pageSize: 20, profitStatus: 'high'
    })
    expect(filtered.total).toBe(counts.high)
  })

  it('费用下钻：三级项合计 = 单元格金额（商品行 / 看板行 / 订单行 / 合计行）', () => {
    const product = call('/ims/sc-profit/detail', { ...base, tab: 'asin', pageNo: 1, pageSize: 20 })
    const row = product.rows[0]
    const drill = call('/ims/sc-profit/fee-drilldown', {
      ...base, tab: 'asin', dimValue: row.dimKey, wideColumn: 'ad_cost'
    })
    expect(sum(drill.items, 'amount')).toBeCloseTo(Number(row.ad), 2)

    // 合计行：dimValue 为空
    const sumDrill = call('/ims/sc-profit/fee-drilldown', { ...base, tab: 'asin', wideColumn: 'ad_cost' })
    expect(sum(sumDrill.items, 'amount')).toBeCloseTo(Number(product.summary.ad), 2)

    // 看板行：前端会把日期收窄到所在桶
    const board = call('/ims/sc-profit/detail', { ...base, tab: 'dashboard', granularity: 'day', pageNo: 1, pageSize: 20 })
    const bucketRow = board.rows[3]
    const boardDrill = call('/ims/sc-profit/fee-drilldown', {
      ...base, tab: 'dashboard', dateStart: bucketRow.dateStart, dateEnd: bucketRow.dateEnd, wideColumn: 'storage_fee'
    })
    expect(sum(boardDrill.items, 'amount')).toBeCloseTo(Number(bucketRow.storageFee), 2)

    // 订单行
    const orders = call('/ims/sc-profit/detail', { ...order7, tab: 'order', pageNo: 1, pageSize: 20 })
    const orderRow = orders.rows[0]
    const orderDrill = call('/ims/sc-profit/fee-drilldown', {
      ...order7, tab: 'order', dimValue: orderRow.dimKey, wideColumn: 'platform_other_fee'
    })
    expect(sum(orderDrill.items, 'amount')).toBeCloseTo(Number(orderRow.platformOtherFee), 2)

    // 每项都要大于前端 0.005 的过滤阈值，否则相加会对不上
    orderDrill.items.forEach((item: any) => expect(Math.abs(item.amount)).toBeGreaterThan(0.005))
  })

  // 与 detail-table.vue 的 PROP_WIDE_COLUMN 一一对应，任一列漏配都会让弹窗合计对不上
  const WIDE_COLUMNS: Array<[string, string]> = [
    ['refund', 'refundTotal'],
    ['promo_fee', 'promoFee'],
    ['ad_cost', 'ad'],
    ['storage_fee', 'storageFee'],
    ['fba_ops_fee', 'fbaFulfillmentFee'],
    ['platform_other_fee', 'platformOtherFee'],
    ['fba_reimbursement', 'fbaInventoryReimbursement'],
    ['other_income', 'otherIncome']
  ]

  /** 复刻 detail-table.openDrill：看板行把日期收窄到所在桶，其余行传 dimKey，汇总行传空 */
  const drillOf = (tab: string, filter: any, row: any, wideColumn: string) => {
    const isBoard = tab === 'dashboard'
    return call('/ims/sc-profit/fee-drilldown', {
      ...filter,
      tab,
      dateStart: isBoard && row.dateStart ? row.dateStart : filter.dateStart,
      dateEnd: isBoard && row.dateEnd ? row.dateEnd : filter.dateEnd,
      dimValue: isBoard || row._summary ? undefined : row.dimKey,
      wideColumn
    })
  }

  it.each([
    ['dashboard', base, 'day'],
    ['parentAsin', base, undefined],
    ['asin', base, undefined],
    ['msku', base, undefined],
    ['spu', base, undefined],
    ['order', order7, undefined]
  ])('费用下钻：%s 页签所有可下钻列的三级项合计 = 单元格金额', (tab, filter, granularity) => {
    const vo = call('/ims/sc-profit/detail', {
      ...filter, tab, granularity, pageNo: 1, pageSize: 20, withChildren: true
    })
    const targets = [
      vo.rows[0],
      vo.rows[Math.min(2, vo.rows.length - 1)],
      vo.rows.find((r: any) => r.children?.length),
      ...(vo.rows.find((r: any) => r.children?.length)?.children || []).slice(0, 1),
      { ...vo.summary, _summary: true }
    ].filter(Boolean)

    targets.forEach((row: any) => {
      WIDE_COLUMNS.forEach(([wideColumn, field]) => {
        const cell = Number(row[field]) || 0
        const drill = drillOf(tab, filter, row, wideColumn)
        if (Math.abs(cell) < 0.005) return
        expect(
          sum(drill.items, 'amount'),
          `${tab} / ${wideColumn} / ${row.dimKey ?? '汇总'}`
        ).toBeCloseTo(cell, 2)
        // 前端会丢弃 |金额| <= 0.005 的项，被丢掉就加不回父级；
        // 「单个*」列还会先除以销量，两种口径都要留得住
        const qty = Math.max(1, Number(row.qty) || 1)
        drill.items.forEach((item: any) => {
          const label = `${tab} / ${wideColumn} / ${item.feeItemL3}`
          expect(Math.abs(item.amount), label).toBeGreaterThan(0.005)
          expect(Math.abs(item.amount) / qty, `${label}（单个口径）`).toBeGreaterThan(0.005)
        })
      })
    })
  })

  it('费用下钻：金额足够时保留全部三级项，不因阈值收敛而只剩一项', () => {
    const vo = call('/ims/sc-profit/detail', { ...base, tab: 'asin', pageNo: 1, pageSize: 20 })
    const drill = call('/ims/sc-profit/fee-drilldown', { ...base, tab: 'asin', wideColumn: 'promo_fee' })
    expect(drill.items.length).toBe(7)
    expect(sum(drill.items, 'amount')).toBeCloseTo(Number(vo.summary.promoFee), 2)
  })

  it('订单多明细：行项目合计 = 订单行', () => {
    const vo = call('/ims/sc-profit/detail', { ...order7, tab: 'order', pageNo: 1, pageSize: 50, withChildren: true })
    const parent = vo.rows.find((r: any) => r.children?.length > 1)
    expect(parent).toBeTruthy()
    ;['sales', 'profit', 'qty', 'ad'].forEach((key) => {
      expect(sum(parent.children, key)).toBeCloseTo(Number(parent[key]), 2)
    })
  })

  it('筛选条件收窄后指标卡与明细同步变化', () => {
    const wide = call('/ims/sc-profit/metrics', { ...base, tab: 'asin' })
    const narrow = call('/ims/sc-profit/metrics', { ...base, tab: 'asin', brandIds: [11] })
    expect(Math.abs(card(narrow, 'sales'))).toBeLessThan(Math.abs(card(wide, 'sales')))
    const vo = call('/ims/sc-profit/detail', { ...base, tab: 'asin', brandIds: [11], pageNo: 1, pageSize: 20 })
    expect(Number(vo.summary.sales)).toBeCloseTo(card(narrow, 'sales'), 2)
    expect(vo.rows.every((r: any) => r.brand === 'MK')).toBe(true)
  })
})
