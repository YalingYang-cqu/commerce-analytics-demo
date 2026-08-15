import { describe, expect, it } from 'vitest'
import {
  DEFAULT_SEARCH_TYPE,
  SEARCH_TYPE_ORDER_NO,
  defaultSearchTypeForTab,
  searchTypeOptionsForTab
} from './search-type'

describe('SC订单利润复合搜索类型', () => {
  it('非订单 Tab：ASIN/父ASIN/MSKU/SPU/中文款名', () => {
    const opts = searchTypeOptionsForTab('asin')
    expect(opts.map((o) => o.value)).toEqual(['asin', 'pasin', 'msku', 'spu', 'name'])
    expect(opts.find((o) => o.value === 'name')?.label).toBe('中文款名')
  })

  it('订单 Tab 额外含订单号；默认 ASIN', () => {
    const values = searchTypeOptionsForTab('order').map((o) => o.value)
    expect(values).toContain(SEARCH_TYPE_ORDER_NO)
    expect(DEFAULT_SEARCH_TYPE).toBe('asin')
  })

  it('默认搜索类型对齐各 Tab 维度', () => {
    expect(defaultSearchTypeForTab('dashboard')).toBe('asin')
    expect(defaultSearchTypeForTab('asin')).toBe('asin')
    expect(defaultSearchTypeForTab('parentAsin')).toBe('pasin')
    expect(defaultSearchTypeForTab('msku')).toBe('msku')
    expect(defaultSearchTypeForTab('spu')).toBe('spu')
    expect(defaultSearchTypeForTab('order')).toBe('orderNo')
    expect(defaultSearchTypeForTab()).toBe('asin')
  })

  it('各 Tab 默认搜索类型必须在该 Tab 的可选项内', () => {
    for (const tab of ['dashboard', 'parentAsin', 'asin', 'msku', 'spu', 'order']) {
      const values = searchTypeOptionsForTab(tab).map((o) => o.value)
      expect(values).toContain(defaultSearchTypeForTab(tab))
    }
  })
})
