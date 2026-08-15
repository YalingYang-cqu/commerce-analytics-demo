import { describe, expect, it } from 'vitest'
import { buildDetailColumns } from './columns'
import { isSortableProp } from './columns/shared'

describe('sc-profit configurable column sorting', () => {
  it('enables custom sort on unit/expense config columns from image 2', () => {
    const cols = buildDetailColumns('parentAsin')
    const byProp = Object.fromEntries(cols.map((c) => [c.prop, c]))

    for (const prop of [
      'unitPrice',
      'unitNetProfit',
      'unitAd',
      'unitPromoFee',
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
      'platformOtherFee'
    ]) {
      expect(isSortableProp(prop), prop).toBe(true)
      expect(byProp[prop]?.sortable, prop).toBe('custom')
    }
  })

  it('keeps interactive and unbacked ad-attribution columns non-sortable', () => {
    expect(isSortableProp('trend')).toBe(false)
    expect(isSortableProp('image')).toBe(false)
    expect(isSortableProp('adSales')).toBe(false)
    expect(isSortableProp('adAcos')).toBe(false)
  })
})
