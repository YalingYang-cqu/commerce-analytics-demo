import { describe, expect, it } from 'vitest'
import {
  buildOrderProfitFilter,
  resolveOrderProfitDateType,
  resolveOrderProfitGranularity
} from './sc-profit-filter'

describe('buildOrderProfitFilter', () => {
  it('订单结算时间：dateType=settlement，granularity 仍为 day', () => {
    const form = {
      dateRange: ['2026-06-01', '2026-06-30'],
      dateGrain: 'settlement',
      searchType: 'asin',
      keyword: ' B0TEST ',
      orderSource: 'all',
      site: 'US',
      currency: 'USD'
    }
    expect(resolveOrderProfitDateType(form)).toBe('settlement')
    expect(resolveOrderProfitGranularity(form)).toBe('day')
    expect(buildOrderProfitFilter(form)).toMatchObject({
      dateStart: '2026-06-01',
      dateEnd: '2026-06-30',
      dateType: 'settlement',
      searchType: 'asin',
      keyword: 'B0TEST',
      orderSource: 'all'
    })
  })

  it('无 keyword 时不传 searchType', () => {
    const filter = buildOrderProfitFilter({
      dateRange: ['2026-06-01', '2026-06-30'],
      dateGrain: 'day',
      searchType: 'msku',
      keyword: '  '
    })
    expect(filter.searchType).toBeUndefined()
    expect(filter.keyword).toBeUndefined()
    expect(filter.dateType).toBe('order')
  })
})
