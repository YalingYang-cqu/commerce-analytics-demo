import dayjs from 'dayjs'
import isoWeek from 'dayjs/plugin/isoWeek'
import { dateForTimezone } from '@/utils/toolFun/tools'

dayjs.extend(isoWeek)

export const DEFAULT_SITE = 'US'

/** 规范化站点代码列表；空则回退 US */
export const normalizeSiteCodes = (sites?: string[]): string[] => {
  const codes = (sites?.length ? sites : [DEFAULT_SITE])
    .map((s) => String(s).trim().toUpperCase())
    .filter(Boolean)
  const unique = [...new Set(codes)]
  return unique.length ? unique : [DEFAULT_SITE]
}

/** 主站点（多选时取第一个，用于展示类时间戳） */
export const resolvePrimarySiteCode = (sites?: string[]): string => normalizeSiteCodes(sites)[0]

/**
 * 多站点下的「今日」：取各站点当地日期中的最小值（最保守、避免选到某站点尚未跨入的日期）
 */
export const getSitesTodayText = (sites?: string[]): string => {
  const codes = normalizeSiteCodes(sites)
  return codes.map((code) => dateForTimezone(code)).sort()[0]
}

/** 站点当地当前时间字符串（默认含时分秒） */
export const getSitesNowText = (sites?: string[], format = 'YYYY-MM-DD HH:mm:ss'): string =>
  dateForTimezone(resolvePrimarySiteCode(sites), new Date(), format)

/** 以站点今日为结束日，向前推 days 天（含首尾） */
export const dateRangeDaysAgo = (sites: string[] | undefined, days: number): [string, string] => {
  const end = getSitesTodayText(sites)
  const start = dayjs(end)
    .subtract(days - 1, 'day')
    .format('YYYY-MM-DD')
  return [start, end]
}

/** 将区间结束日裁到站点今日，并保证 start <= end */
export const clipDateRangeToSiteToday = (
  range: [string, string] | undefined,
  sites?: string[],
  fallbackDays = 14
): [string, string] => {
  if (!range?.[0] || !range?.[1]) return dateRangeDaysAgo(sites, fallbackDays)
  const max = getSitesTodayText(sites)
  const end = range[1] > max ? max : range[1]
  const start = range[0] > end ? end : range[0]
  return [start, end]
}

/** 禁止选择晚于站点今日的自然日 */
export const createSiteDisabledDate = (sites?: string[]) => {
  const maxText = getSitesTodayText(sites)
  const max = dayjs(maxText).startOf('day').valueOf()
  return (time: Date) => dayjs(time).startOf('day').valueOf() > max
}

/** 日维度默认近 14 天（含站点今日） */
export const defaultDayRangeForSite = (sites?: string[]): [string, string] =>
  dateRangeDaysAgo(sites, 14)

/** 周维度默认近 7 周，结束日不超过站点今日 */
export const defaultWeekRangeForSite = (sites?: string[]): [string, string] => {
  const endText = getSitesTodayText(sites)
  const end = dayjs(endText)
  const start = end.startOf('isoWeek').subtract(6, 'week')
  return [start.format('YYYY-MM-DD'), endText]
}

/** 月维度默认近 7 个月，结束日不超过站点今日 */
export const defaultMonthRangeForSite = (sites?: string[]): [string, string] => {
  const endText = getSitesTodayText(sites)
  const end = dayjs(endText)
  const start = end.subtract(6, 'month').startOf('month')
  return [start.format('YYYY-MM-DD'), endText]
}

type DayShortcut = { text: string; value: () => [Date, Date] }

/** ASIN 看板 / 搜索栏日期区间快捷项（锚定站点今日） */
export const buildSiteDayShortcuts = (sites?: string[]): DayShortcut[] => {
  const today = getSitesTodayText(sites)
  const d = (offset: number) => dayjs(today).subtract(offset, 'day')
  const range = (start: dayjs.Dayjs, end: dayjs.Dayjs): [Date, Date] => [
    start.startOf('day').toDate(),
    end.endOf('day').toDate()
  ]
  const capEnd = dayjs(today)
  return [
    { text: '今天', value: () => range(capEnd, capEnd) },
    { text: '昨天', value: () => range(d(1), d(1)) },
    { text: '最近7天', value: () => range(d(6), capEnd) },
    { text: '最近14天', value: () => range(d(13), capEnd) },
    { text: '最近30天', value: () => range(d(29), capEnd) },
    { text: '本周', value: () => range(capEnd.startOf('isoWeek'), capEnd) },
    {
      text: '上周',
      value: () =>
        range(
          d(7).startOf('isoWeek'),
          d(7).endOf('isoWeek').isAfter(capEnd) ? capEnd : d(7).endOf('isoWeek')
        )
    },
    { text: '最近2周', value: () => range(d(13), capEnd) },
    { text: '本月', value: () => range(capEnd.startOf('month'), capEnd) },
    {
      text: '上月',
      value: () =>
        range(d(1).subtract(1, 'month').startOf('month'), d(1).subtract(1, 'month').endOf('month'))
    }
  ]
}
