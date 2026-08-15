/** SC 订单利润「订单来源」固定选项与默认值。 */
export const ORDER_SOURCE_ALL = 'all'
export const ORDER_SOURCE_EXCLUDE_OFFSITE_AND_REPLACEMENT = 'excludeOffsiteAndReplacement'
export const ORDER_SOURCE_OFFSITE_ONLY = 'offsiteOnly'

export const ORDER_SOURCE_OPTIONS = [
  { label: '全部订单', value: ORDER_SOURCE_ALL },
  { label: '不含站外订单和替换单', value: ORDER_SOURCE_EXCLUDE_OFFSITE_AND_REPLACEMENT },
  { label: '仅站外订单', value: ORDER_SOURCE_OFFSITE_ONLY }
] as const

/** 订单维度默认「全部订单」，其余维度默认「不含站外订单和替换单」。 */
export const defaultOrderSourceForTab = (tab?: string): string =>
  tab === 'order' ? ORDER_SOURCE_ALL : ORDER_SOURCE_EXCLUDE_OFFSITE_AND_REPLACEMENT
