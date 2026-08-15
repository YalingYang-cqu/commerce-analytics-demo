/** 仅日期 YYYY-MM-DD（无时间部分） */
const DAY_ONLY = /^\d{4}-\d{2}-\d{2}$/

/**
 * 仅用于发起接口：表单里用 YYYY-MM-DD 展示时，在此把开始/结束补成 00:00:00 与 23:59:59；已含时分秒则原样。
 */
export function normalizeQueryRangeStartEnd(start: string, end: string): [string, string] {
  const s = (start ?? '').trim()
  const e = (end ?? '').trim()
  if (!s || !e) return [s, e]
  return [DAY_ONLY.test(s) ? `${s} 00:00:00` : s, DAY_ONLY.test(e) ? `${e} 23:59:59` : e]
}
