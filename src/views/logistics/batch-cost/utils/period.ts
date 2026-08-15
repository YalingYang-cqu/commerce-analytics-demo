import dayjs from 'dayjs'
import customParseFormat from 'dayjs/plugin/customParseFormat'
import isoWeek from 'dayjs/plugin/isoWeek'
import quarterOfYear from 'dayjs/plugin/quarterOfYear'

dayjs.extend(customParseFormat)
dayjs.extend(isoWeek)
dayjs.extend(quarterOfYear)

/** 统计周期 */
export type PeriodType = 'day' | 'week' | 'month' | 'quarter' | 'year'

export const PERIOD_OPTIONS: { label: string; value: PeriodType }[] = [
  { label: '日', value: 'day' },
  { label: '周', value: 'week' },
  { label: '月', value: 'month' },
  { label: '季度', value: 'quarter' },
  { label: '年', value: 'year' }
]

/** 将 YYYY-MM-DD 转为接口出货时间起止传参（随统计周期） */
export function formatDateSearchApiValue(dateStr: string, period: PeriodType): string {
  const d = dayjs(dateStr)
  if (!d.isValid()) return dateStr
  switch (period) {
    case 'day':
      return d.format('YYYY-M-D')
    case 'week':
      return `${d.isoWeekYear()}-W${String(d.isoWeek()).padStart(2, '0')}`
    case 'month':
      return d.format('YYYY-MM')
    case 'quarter':
      return `${d.year()}-Q${d.quarter()}`
    case 'year':
      return d.format('YYYY')
    default:
      return d.format('YYYY-MM-DD')
  }
}

/** 将日期格式化为对应周期的展示标签 */
export function formatPeriodLabel(date: dayjs.Dayjs, period: PeriodType): string {
  switch (period) {
    case 'day':
      return date.format('YYYY-MM-DD')
    case 'week':
      return `${date.isoWeekYear()}-W${String(date.isoWeek()).padStart(2, '0')}`
    case 'month':
      return date.format('YYYY-MM')
    case 'quarter':
      return `${date.year()}-Q${date.quarter()}`
    case 'year':
      return date.format('YYYY')
    default:
      return date.format('YYYY-MM')
  }
}

/** 周期起始边界（用于区间遍历） */
function alignPeriodStart(date: dayjs.Dayjs, period: PeriodType): dayjs.Dayjs {
  switch (period) {
    case 'day':
      return date.startOf('day')
    case 'week':
      return date.startOf('isoWeek')
    case 'month':
      return date.startOf('month')
    case 'quarter':
      return date.startOf('quarter')
    case 'year':
      return date.startOf('year')
    default:
      return date.startOf('month')
  }
}

/** 获取当前周期往前偏移 n 个周期的 dayjs 实例 */
function shiftPeriod(base: dayjs.Dayjs, period: PeriodType, offset: number): dayjs.Dayjs {
  switch (period) {
    case 'day':
      return base.subtract(offset, 'day')
    case 'week':
      return base.subtract(offset, 'week')
    case 'month':
      return base.subtract(offset, 'month')
    case 'quarter':
      return base.subtract(offset, 'quarter')
    case 'year':
      return base.subtract(offset, 'year')
    default:
      return base.subtract(offset, 'month')
  }
}

/**
 * 获取最近 count 个周期标签（从新到旧，与成本明细列顺序一致）
 * 例（月）：['2026-05', '2026-04', ..., '2025-11']
 */
export function getRecentPeriodLabels(
  period: PeriodType = 'month',
  count = 7,
  baseDate?: dayjs.Dayjs
): string[] {
  const base = baseDate ?? dayjs()
  const labels: string[] = []
  for (let i = 0; i < count; i++) {
    labels.push(formatPeriodLabel(shiftPeriod(base, period, i), period))
  }
  return labels
}

/** 折线图 x 轴使用的时间正序（从旧到新） */
export function getChartPeriodLabels(period: PeriodType = 'month', count = 7): string[] {
  return [...getRecentPeriodLabels(period, count)].reverse()
}

/**
 * 按出货时间等自定义起止日期，生成区间内各周期列标签（从新到旧）
 * @param from YYYY-MM-DD
 * @param to YYYY-MM-DD
 */
export function getPeriodLabelsInDateRange(
  period: PeriodType,
  from: string,
  to: string,
  maxCount = 366
): string[] {
  const rangeStart = alignPeriodStart(dayjs(from), period)
  let cursor = alignPeriodStart(dayjs(to), period)
  if (!rangeStart.isValid() || !cursor.isValid() || cursor.isBefore(rangeStart)) {
    return []
  }

  const labels: string[] = []
  while (labels.length < maxCount) {
    labels.push(formatPeriodLabel(cursor, period))
    if (cursor.isSame(rangeStart)) break
    cursor = shiftPeriod(cursor, period, 1)
    if (cursor.isBefore(rangeStart)) break
  }
  return labels
}

/** 根据搜索栏出货时间与日期范围解析成本明细列标签 */
export function getPeriodLabelsFromDateSearch(
  period: PeriodType,
  dateSearchType: string,
  dateSearchValue: string[],
  activeDateType = 'shipTime'
): string[] {
  const [from, to] = dateSearchValue
  if (dateSearchType === activeDateType && from && to) {
    const labels = getPeriodLabelsInDateRange(period, from, to)
    if (labels.length) return labels
  }
  return getRecentPeriodLabels(period, 7)
}

/** 从列表查询参数解析日期范围并生成周期列标签 */
export function getPeriodLabelsFromQueryParams(
  params: Record<string, unknown>,
  period: PeriodType = 'month',
  activeDateType = 'shipTime'
): string[] {
  const dateSearchType = (params.dateSearchType as string) || activeDateType
  const dateSearchValue = params.dateSearchValue as string[] | undefined
  if (dateSearchValue?.[0] && dateSearchValue?.[1]) {
    return getPeriodLabelsFromDateSearch(period, dateSearchType, dateSearchValue, activeDateType)
  }
  const start = params[`${dateSearchType}Start`] as string | undefined
  const end = params[`${dateSearchType}End`] as string | undefined
  if (start && end) {
    const [from, to] = apiDateRangeToIsoDates(start, end, period)
    if (from && to) {
      return getPeriodLabelsFromDateSearch(period, dateSearchType, [from, to], activeDateType)
    }
  }
  const from = params[`${dateSearchType}From`] as string | undefined
  const to = params[`${dateSearchType}To`] as string | undefined
  if (from && to) {
    return getPeriodLabelsFromDateSearch(
      period,
      dateSearchType,
      [from.slice(0, 10), to.slice(0, 10)],
      activeDateType
    )
  }
  return getRecentPeriodLabels(period, 7)
}

/** 接口周期字符串 → 区间起止 YYYY-MM-DD（供列标签等内部计算） */
export function apiDateRangeToIsoDates(
  start: string,
  end: string,
  period: PeriodType
): [string, string] | [null, null] {
  const parseOne = (value: string, boundary: 'start' | 'end') => {
    const d = dayjs(value)
    if (d.isValid() && /^\d{4}-\d{2}-\d{2}/.test(value)) {
      return boundary === 'start' ? d.startOf('day') : d.endOf('day')
    }
    switch (period) {
      case 'day': {
        const parsed = dayjs(value.replace(/-/g, '/'))
        return parsed.isValid()
          ? boundary === 'start'
            ? parsed.startOf('day')
            : parsed.endOf('day')
          : null
      }
      case 'week': {
        const w = dayjs(value, 'GGGG-[W]WW', true)
        if (!w.isValid()) return null
        return boundary === 'start' ? w.startOf('isoWeek') : w.endOf('isoWeek')
      }
      case 'month': {
        const base = dayjs(value, 'YYYY-MM', true)
        if (!base.isValid()) return null
        return boundary === 'start' ? base.startOf('month') : base.endOf('month')
      }
      case 'quarter': {
        const base = dayjs(value, 'YYYY-[Q]Q', true)
        if (!base.isValid()) return null
        return boundary === 'start' ? base.startOf('quarter') : base.endOf('quarter')
      }
      case 'year': {
        const m = value.match(/^(\d{4})$/)
        if (!m) return null
        const base = dayjs(`${m[1]}-01-01`)
        return boundary === 'start' ? base.startOf('year') : base.endOf('year')
      }
      default:
        return null
    }
  }
  const from = parseOne(start, 'start')
  const to = parseOne(end, 'end')
  if (!from?.isValid() || !to?.isValid()) return [null, null]
  return [from.format('YYYY-MM-DD'), to.format('YYYY-MM-DD')]
}

/** 最近 count 个周期对应的起止日期（用于出货时间默认筛选） */
export function getRecentPeriodDateRange(
  period: PeriodType = 'month',
  count = 7,
  baseDate?: dayjs.Dayjs
): [string, string] {
  const base = baseDate ?? dayjs()
  const oldest = shiftPeriod(base, period, count - 1)

  switch (period) {
    case 'day':
      return [oldest.format('YYYY-MM-DD'), base.format('YYYY-MM-DD')]
    case 'week':
      return [
        oldest.startOf('isoWeek').format('YYYY-MM-DD'),
        base.endOf('isoWeek').format('YYYY-MM-DD')
      ]
    case 'month':
      return [
        oldest.startOf('month').format('YYYY-MM-DD'),
        base.endOf('month').format('YYYY-MM-DD')
      ]
    case 'quarter':
      return [
        oldest.startOf('quarter').format('YYYY-MM-DD'),
        base.endOf('quarter').format('YYYY-MM-DD')
      ]
    case 'year':
      return [oldest.startOf('year').format('YYYY-MM-DD'), base.endOf('year').format('YYYY-MM-DD')]
    default:
      return [
        oldest.startOf('month').format('YYYY-MM-DD'),
        base.endOf('month').format('YYYY-MM-DD')
      ]
  }
}

/** 默认查询最近 count 个周期的日期范围 */
export function getDefaultDateSearchValue(period: PeriodType = 'month', count = 7): string[] {
  const [from, to] = getRecentPeriodDateRange(period, count)
  return [from, to]
}

/** 出货时间选择器配置（随统计周期变化） */
export function getPeriodDatePickerConfig(period: PeriodType): {
  inputType: 'daterange' | 'datetimerange'
  datePickerProps: Record<string, unknown>
} {
  switch (period) {
    case 'month':
      return {
        inputType: 'daterange',
        datePickerProps: {
          type: 'monthrange',
          valueFormat: 'YYYY-MM-DD',
          format: 'YYYY-MM'
        }
      }
    case 'quarter':
      return {
        inputType: 'daterange',
        datePickerProps: {}
      }
    case 'week':
      return {
        inputType: 'daterange',
        datePickerProps: {
          unlinkPanels: true
        }
      }
    case 'year':
      return {
        inputType: 'daterange',
        datePickerProps: {
          type: 'yearrange',
          valueFormat: 'YYYY-MM-DD',
          format: 'YYYY'
        }
      }
    default:
      return {
        inputType: 'daterange',
        datePickerProps: {
          type: 'daterange',
          valueFormat: 'YYYY-MM-DD',
          format: 'YYYY-MM-DD'
        }
      }
  }
}

export function getPeriodDateSearchPlaceholder(period: PeriodType): string {
  switch (period) {
    case 'month':
      return '开始月份,结束月份'
    case 'quarter':
      return '开始季度,结束季度'
    case 'year':
      return '开始年份,结束年份'
    case 'week':
      return '开始周,结束周'
    default:
      return '开始日期,结束日期'
  }
}
