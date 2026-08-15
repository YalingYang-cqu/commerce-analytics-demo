import { describe, expect, it } from 'vitest'
import { resolveSearchTypeChangeAction } from './search-type-change'

describe('resolveSearchTypeChangeAction', () => {
  it('切换 searchType 一律不请求、不清空（等点击搜索或回车）', () => {
    expect(resolveSearchTypeChangeAction('')).toBe('noop')
    expect(resolveSearchTypeChangeAction('   ')).toBe('noop')
    expect(resolveSearchTypeChangeAction(undefined)).toBe('noop')
    expect(resolveSearchTypeChangeAction('B0XXX')).toBe('noop')
  })
})
