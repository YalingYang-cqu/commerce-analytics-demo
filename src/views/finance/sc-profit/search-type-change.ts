/**
 * 切换复合搜索左侧 searchType 时的列表/指标处理策略。
 *
 * 约定：切换类型本身不请求、不清空；点搜索图标或回车后再查。
 * （keyword 为空时 searchType 本就不参与 SQL；有 keyword 时也等用户显式搜索。）
 */
export type SearchTypeChangeAction = 'noop' | 'clear' | 'reload'

export const resolveSearchTypeChangeAction = (_keyword?: string | null): SearchTypeChangeAction =>
  'noop'
