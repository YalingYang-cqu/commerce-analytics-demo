import { describe, expect, it } from 'vitest'
import { resolveOrderProfitDateRange } from './sc-profit-date-range'

describe('SC订单利润按月日期区间', () => {
  it('monthrange 两端落成月初时，扩成月初～月末', () => {
    // Element Plus monthrange 选 2026-06～2026-06 → 两端都是 06-01
    expect(resolveOrderProfitDateRange(['2026-06-01', '2026-06-01'], 'month')).toEqual({
      dateStart: '2026-06-01',
      dateEnd: '2026-06-30'
    })
    expect(resolveOrderProfitDateRange(['2026-01-01', '2026-02-01'], 'month')).toEqual({
      dateStart: '2026-01-01',
      dateEnd: '2026-02-28'
    })
  })

  it('日/周粒度不改写区间', () => {
    expect(resolveOrderProfitDateRange(['2026-06-01', '2026-06-01'], 'day')).toEqual({
      dateStart: '2026-06-01',
      dateEnd: '2026-06-01'
    })
    expect(resolveOrderProfitDateRange(['2026-06-02', '2026-06-08'], 'week')).toEqual({
      dateStart: '2026-06-02',
      dateEnd: '2026-06-08'
    })
  })
})
