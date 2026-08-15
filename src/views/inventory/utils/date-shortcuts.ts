import dayjs from 'dayjs'

type DateRange = [Date, Date]

const range = (start: dayjs.Dayjs, end: dayjs.Dayjs): DateRange => [
  start.startOf('day').toDate(),
  end.endOf('day').toDate()
]

const mondayOf = (day: dayjs.Dayjs): dayjs.Dayjs =>
  day.startOf('day').subtract((day.day() + 6) % 7, 'day')

/** 成本中心日期范围快捷项，与订单利润页面保持一致。 */
export const INVENTORY_DATE_SHORTCUTS = [
  { text: '今天', value: () => range(dayjs(), dayjs()) },
  { text: '昨天', value: () => range(dayjs().subtract(1, 'day'), dayjs().subtract(1, 'day')) },
  { text: '最近7天', value: () => range(dayjs().subtract(6, 'day'), dayjs()) },
  { text: '最近14天', value: () => range(dayjs().subtract(13, 'day'), dayjs()) },
  { text: '最近30天', value: () => range(dayjs().subtract(29, 'day'), dayjs()) },
  { text: '本周', value: () => range(mondayOf(dayjs()), dayjs()) },
  {
    text: '上周',
    value: () => {
      const start = mondayOf(dayjs()).subtract(1, 'week')
      return range(start, start.add(6, 'day'))
    }
  },
  { text: '最近2周', value: () => range(dayjs().subtract(13, 'day'), dayjs()) },
  { text: '本月', value: () => range(dayjs().startOf('month'), dayjs()) },
  {
    text: '上月',
    value: () =>
      range(
        dayjs().subtract(1, 'month').startOf('month'),
        dayjs().subtract(1, 'month').endOf('month')
      )
  }
]

/** 月范围面板快捷项。 */
export const INVENTORY_MONTH_SHORTCUTS = [
  { text: '本月', value: () => range(dayjs().startOf('month'), dayjs().endOf('month')) },
  {
    text: '上月',
    value: () =>
      range(
        dayjs().subtract(1, 'month').startOf('month'),
        dayjs().subtract(1, 'month').endOf('month')
      )
  },
  {
    text: '最近3月',
    value: () => range(dayjs().subtract(2, 'month').startOf('month'), dayjs().endOf('month'))
  },
  {
    text: '最近6月',
    value: () => range(dayjs().subtract(5, 'month').startOf('month'), dayjs().endOf('month'))
  },
  { text: '今年', value: () => range(dayjs().startOf('year'), dayjs().endOf('month')) }
]
