export interface DetailSort {
  sortField?: string
  sortOrder?: 'asc' | 'desc'
}

/** 各明细 Tab 的默认排序；用户列头排序仍可覆盖此默认值。 */
export const resolveDefaultDetailSort = (tab: string): DetailSort => {
  if (tab === 'dashboard') {
    return { sortField: 'date', sortOrder: 'desc' }
  }
  if (tab === 'order') {
    return { sortField: 'orderTime', sortOrder: 'desc' }
  }
  return { sortField: undefined, sortOrder: undefined }
}
