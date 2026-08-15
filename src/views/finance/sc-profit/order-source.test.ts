import { describe, expect, it } from 'vitest'
import { ORDER_SOURCE_OPTIONS, defaultOrderSourceForTab } from './order-source'

describe('SC订单利润订单来源', () => {
  it('固定三选项：全部 / 不含站外和替换单 / 仅站外', () => {
    expect(ORDER_SOURCE_OPTIONS.map((o) => o.value)).toEqual([
      'all',
      'excludeOffsiteAndReplacement',
      'offsiteOnly'
    ])
    expect(ORDER_SOURCE_OPTIONS[1].label).toBe('不含站外订单和替换单')
  })

  it('仅订单维度默认全部订单，其余默认不含站外订单和替换单', () => {
    expect(defaultOrderSourceForTab('order')).toBe('all')
    expect(defaultOrderSourceForTab('asin')).toBe('excludeOffsiteAndReplacement')
    expect(defaultOrderSourceForTab('dashboard')).toBe('excludeOffsiteAndReplacement')
    expect(defaultOrderSourceForTab('parentAsin')).toBe('excludeOffsiteAndReplacement')
    expect(defaultOrderSourceForTab('msku')).toBe('excludeOffsiteAndReplacement')
    expect(defaultOrderSourceForTab('spu')).toBe('excludeOffsiteAndReplacement')
    expect(defaultOrderSourceForTab()).toBe('excludeOffsiteAndReplacement')
  })
})
