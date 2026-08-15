import type { ProfitDetailTab } from './columns'

/**
 * 看板接口为保证时间轴、环比和周/月子行完整性，会一次返回全部父行。
 * 其他维度由后端分页，不能再次切片。
 */
export const resolveDetailPageRecords = <T>(
  tab: ProfitDetailTab,
  records: T[],
  currentPage: number,
  pageSize: number
): T[] => {
  if (tab !== 'dashboard') return records

  const safePage = Math.max(1, Number(currentPage) || 1)
  const safeSize = Math.max(1, Number(pageSize) || 20)
  const start = (safePage - 1) * safeSize
  return records.slice(start, start + safeSize)
}
