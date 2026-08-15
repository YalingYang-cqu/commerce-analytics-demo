import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'

dayjs.extend(isoWeek)

const WEEKS_ZH = ['日', '一', '二', '三', '四', '五', '六']

/** 周一为一周起始时，表头顺序 */
export function getWeekHeadLabels(firstDayOfWeek = 1): string[] {
  const labels: string[] = []
  for (let i = 0; i < 7; i++) {
    labels.push(WEEKS_ZH[(firstDayOfWeek + i) % 7])
  }
  return labels
}

export function clearTime(time: Date | string | number): number {
  return dayjs(time).startOf('day').valueOf()
}

export function isDate(val: unknown): val is Date {
  return val instanceof Date && !Number.isNaN(val.getTime())
}

export function prevYear(date: Date): Date {
  return dayjs(date).subtract(1, 'year').toDate()
}

export function nextYear(date: Date): Date {
  return dayjs(date).add(1, 'year').toDate()
}

export function prevMonth(date: Date): Date {
  return dayjs(date).subtract(1, 'month').toDate()
}

export function nextMonth(date: Date): Date {
  return dayjs(date).add(1, 'month').toDate()
}

export function nextDate(date: Date, days: number): Date {
  return dayjs(date).add(days, 'day').toDate()
}

/** 展示：2026-26周 */
export function formatWeekDisplay(date: Date | string): string {
  const d = dayjs(date)
  if (!d.isValid()) return ''
  return `${d.isoWeekYear()}-${String(d.isoWeek()).padStart(2, '0')}周`
}

/** 归一化为 ISO 周起止日期 */
export function normalizeIsoWeekRange(minDate: Date, maxDate: Date): [string, string] {
  let start = dayjs(minDate).startOf('isoWeek')
  let end = dayjs(maxDate).endOf('isoWeek')
  if (start.isAfter(end)) {
    const tmp = start
    start = dayjs(maxDate).startOf('isoWeek')
    end = tmp.endOf('isoWeek')
  }
  return [start.format('YYYY-MM-DD'), end.format('YYYY-MM-DD')]
}

export function getWeekStart(date: Date | string): Date {
  return dayjs(date).startOf('isoWeek').toDate()
}

export function isSameWeek(a: Date | string, b: Date | string): boolean {
  const da = dayjs(a)
  const db = dayjs(b)
  return da.isoWeekYear() === db.isoWeekYear() && da.isoWeek() === db.isoWeek()
}

export function isWeekBefore(a: Date | string, b: Date | string): boolean {
  const da = dayjs(a).startOf('isoWeek')
  const db = dayjs(b).startOf('isoWeek')
  return da.isBefore(db)
}

export interface CalendarCell {
  type: 'normal' | 'today' | 'prev-month' | 'next-month'
  text: number
  date: Date
  timestamp: number
  disabled: boolean
}

/** 生成某月日历格（含前后月补齐，按周行排列） */
export function buildMonthRows(
  year: number,
  month: number,
  firstDayOfWeek: number,
  disabledDate?: (date: Date) => boolean
): CalendarCell[][] {
  const firstOfMonth = dayjs().year(year).month(month).date(1)
  const startOffset = (firstOfMonth.day() - firstDayOfWeek + 7) % 7
  const startDate = firstOfMonth.subtract(startOffset, 'day')
  const rows: CalendarCell[][] = []
  const todayTs = clearTime(new Date())

  for (let row = 0; row < 6; row++) {
    const cells: CalendarCell[] = []
    for (let col = 0; col < 7; col++) {
      const d = startDate.add(row * 7 + col, 'day')
      const date = d.toDate()
      const ts = clearTime(date)
      let type: CalendarCell['type'] = 'normal'
      if (d.month() !== month) {
        type = d.isBefore(firstOfMonth) ? 'prev-month' : 'next-month'
      } else if (ts === todayTs) {
        type = 'today'
      }
      cells.push({
        type,
        text: d.date(),
        date,
        timestamp: ts,
        disabled: disabledDate?.(date) ?? false
      })
    }
    rows.push(cells)
  }
  return rows
}

export function getIsoWeekNumber(date: Date): number {
  return dayjs(date).isoWeek()
}
