import dayjs from 'dayjs'

/**
 * 将搜索栏 dateRange 规范化为后端 dt 可用的闭区间（YYYY-MM-DD）。
 *
 * Element Plus monthrange + valueFormat=YYYY-MM-DD 时，起止都会落成「所选月的 1 号」
 * （选 2026-06～2026-06 → ['2026-06-01','2026-06-01']），导致只查 1 天、结果为空。
 * 按月时扩成月初～月末；日/周保持原值（周选择器已给完整日界）。
 *
 * 后端 `w.dt BETWEEN dateStart AND dateEnd` 用的是 DATE 列，无需时分秒。
 */
export function resolveOrderProfitDateRange(
  dateRange: unknown,
  dateGrain?: string
): { dateStart?: string; dateEnd?: string } {
  const range = Array.isArray(dateRange) ? dateRange : []
  const rawStart = range[0] == null || range[0] === '' ? undefined : String(range[0])
  const rawEnd = range[1] == null || range[1] === '' ? undefined : String(range[1])
  if (!rawStart && !rawEnd) return {}
  if (dateGrain !== 'month') {
    return { dateStart: rawStart, dateEnd: rawEnd }
  }
  return {
    dateStart: rawStart ? dayjs(rawStart).startOf('month').format('YYYY-MM-DD') : undefined,
    dateEnd: rawEnd ? dayjs(rawEnd).endOf('month').format('YYYY-MM-DD') : undefined
  }
}
