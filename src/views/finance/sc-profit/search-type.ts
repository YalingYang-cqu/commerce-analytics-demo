/** SC 订单利润复合搜索：searchType 固定选项与默认值。 */
export const SEARCH_TYPE_ASIN = 'asin'
export const SEARCH_TYPE_PASIN = 'pasin'
export const SEARCH_TYPE_MSKU = 'msku'
export const SEARCH_TYPE_SPU = 'spu'
export const SEARCH_TYPE_NAME = 'name'
export const SEARCH_TYPE_ORDER_NO = 'orderNo'

const BASE_SEARCH_TYPE_OPTIONS = [
  { label: 'ASIN', value: SEARCH_TYPE_ASIN },
  { label: '父ASIN', value: SEARCH_TYPE_PASIN },
  { label: 'MSKU', value: SEARCH_TYPE_MSKU },
  { label: 'SPU', value: SEARCH_TYPE_SPU },
  { label: '中文款名', value: SEARCH_TYPE_NAME }
] as const

/** 订单 Tab 额外提供订单号；其它 Tab 仅商品维度。 */
export const searchTypeOptionsForTab = (tab: string) =>
  tab === 'order'
    ? [...BASE_SEARCH_TYPE_OPTIONS, { label: '订单号', value: SEARCH_TYPE_ORDER_NO }]
    : [...BASE_SEARCH_TYPE_OPTIONS]

export const DEFAULT_SEARCH_TYPE = SEARCH_TYPE_ASIN

/** 各 Tab 默认搜索类型：与自身维度对齐（看板无对象维度，沿用 ASIN）。 */
const DEFAULT_SEARCH_TYPE_BY_TAB: Record<string, string> = {
  dashboard: SEARCH_TYPE_ASIN,
  asin: SEARCH_TYPE_ASIN,
  parentAsin: SEARCH_TYPE_PASIN,
  msku: SEARCH_TYPE_MSKU,
  spu: SEARCH_TYPE_SPU,
  order: SEARCH_TYPE_ORDER_NO
}

export const defaultSearchTypeForTab = (tab?: string): string =>
  DEFAULT_SEARCH_TYPE_BY_TAB[tab || ''] || DEFAULT_SEARCH_TYPE
