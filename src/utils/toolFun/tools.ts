/**
 * 基本工具函数集合
 */
import dayjs from 'dayjs'
import timezone from 'dayjs/plugin/timezone'
import utc from 'dayjs/plugin/utc'
import isoWeek from 'dayjs/plugin/isoWeek'
import { ElNotification } from 'element-plus'
import type { NotificationParams } from 'element-plus'
import { sendDownLoadCommand } from '@/api/system-manage'

// 扩展 dayjs 插件
dayjs.extend(utc)
dayjs.extend(timezone)
dayjs.extend(isoWeek)

interface HourParseResult {
  timeEndFormat: string
  isLastDay: boolean
}

interface TimezoneMap {
  [key: string]: string
}

// 时区映射表
const TIMEZONE_MAP: TimezoneMap = {
  US: 'America/Los_Angeles',
  CA: 'America/Toronto',
  MX: 'America/Mexico_City',
  UK: 'Europe/London',
  FR: 'Europe/Paris',
  JP: 'Asia/Tokyo',
  CN: 'Asia/Shanghai',
  DE: 'Europe/Berlin',
  IT: 'Europe/Rome'
}

/**
 * 千位分节法，小数点左起，每3个字符用逗号隔开
 * @param num - 需要格式化的数字
 * @returns 格式化后的字符串
 */
export const numberSpilt = (num: number | string = 0): string => {
  const [leftNumString, rightNumString] = `${num}`.split('.')
  const formatLeft = leftNumString.replace(/(\d)(?=(?:\d{3})+$)/g, '$1,')
  return [formatLeft, rightNumString].filter(Boolean).join('.')
}

/**
 * 时区映射 --> 日期
 * 根据时间，返回对应时区的日期
 * @param zone - 时区代码
 * @param date - 需转化的日期
 * @param format - 日期格式
 * @returns 时区日期字符串
 */
export const dateForTimezone = (
  zone: string = 'CN',
  date: Date | string | number = new Date(),
  format: string = 'YYYY-MM-DD'
): string => {
  const timezone = TIMEZONE_MAP[zone] || 'Asia/Shanghai'
  return dayjs(date).tz(timezone).format(format)
}

/**
 * 获取两地时差
 * @param origin - 起始时区
 * @param destination - 目标时区
 * @returns 时差（小时）
 */
export const getJetLag = (origin: string, destination: string): number => {
  const regionTime = parseInt(dateForTimezone(origin, new Date(), 'Z'), 10)
  const cnTime = parseInt(dateForTimezone(destination, new Date(), 'Z'), 10)
  return cnTime - regionTime
}

/**
 * 获取周开始日期
 * @param date - 当前时间或者需要计算的日期
 * @param zone - 计算日期往前/后的周数
 * @returns 周开始日期字符串
 */
export const getWeekStartDate = (
  date: Date | string | number = new Date(),
  zone: number = 0
): string => {
  const startDate = dayjs(date).startOf('week').toDate()
  // 加上需要往前或者往后的周数的时间戳
  const targetDate = dayjs(startDate).add(zone, 'week').valueOf()
  return dateStringFormat(targetDate)
}

/**
 * 检查是否为有效日期
 * @param date - 需要检查的日期
 * @returns 是否为有效日期
 */
export const isDate = (date: any): boolean => {
  if (date === null || date === undefined) return false
  if (isNaN(dayjs(date).valueOf())) return false
  if (Array.isArray(date)) return false
  return true
}

/**
 * 获取日期对应的周数
 * @param src - 源日期
 * @returns 周数
 */
export const getWeekNumber = (src: Date | string | number): number | null => {
  if (!isDate(src)) return null
  return dayjs(src).isoWeek()
}

/**
 * 获取日期所对应的周标识
 * @param date - 日期
 * @returns 周标识字符串 (如: 2023W05)
 */
export const dateToWeeks = (date: Date | string | number = new Date()): string => {
  const week = getWeekNumber(date)
  const dateYear = dayjs(date).year()
  return `${dateYear}W${week?.toString().padStart(2, '0') || '00'}`
}

/**
 * 时间格式转化
 * @param dateTime - 时间戳或日期对象
 * @param format - 目标格式
 * @returns 格式化后的日期字符串
 */
export const dateStringFormat = (
  dateTime: Date | string | number,
  format: string = 'YYYY-MM-DD'
): string => {
  return dayjs(dateTime).format(format)
}

/**
 * 小时时间转换
 * @param zone - 时区
 * @param date - 日期
 * @param format - 格式
 * @returns 转换结果
 */
export const hourParse = (
  zone: string = 'US',
  date: Date | string | number = new Date(),
  format: string = 'HH'
): HourParseResult => {
  const utcStartDay = dateForTimezone(zone, date, 'YYYY-MM-DD')
  // 两个日期比对
  const timeEnd = dayjs(date).valueOf() - parseInt(utcStartDay, 10) * 60 * 60 * 1000
  const timeEndFormat = dayjs(timeEnd).format(format)
  const isLastDay = dayjs(date).format('YYYY-MM-DD') === dayjs(timeEnd).format('YYYY-MM-DD')
  return {
    timeEndFormat,
    isLastDay
  }
}

/**
 * 调用下载接口去下载中心
 * @param implName - 下载具象，询问后台，一般是下载接口名字
 * @param param - 下载请求的参数
 * @param timeScope - 时间范围，下载内容的时间范围
 * @param fileName - 下载文件名
 */
export const toDownloadCenter = async (
  implName: string,
  param: Record<string, any>,
  timeScope: string,
  fileName: string
): Promise<void> => {
  try {
    const userInfoStr = localStorage.getItem('userInfoObj')
    const account = localStorage.getItem('account')
    if (!userInfoStr || !account) {
      throw new Error('用户信息不存在')
    }
    const userInfo = JSON.parse(userInfoStr)
    const { userName: accountName, userId } = userInfo
    // 模拟 API 调用 - 替换为实际实现
    const res = await sendDownLoadCommand({
      account,
      userId,
      name: fileName,
      timeScope,
      topic: `${accountName}_${userId}`,
      param: JSON.stringify(param),
      implName
    })
    if (res.code === 200) {
      ElNotification({
        title: '导出文件准备中',
        dangerouslyUseHTMLString: true,
        message:
          '准备工作会在后台进行，你可以选择进行其他操作或稍后前往<a style="color: #425eff;" href="./#/Download/Center" target="_blank">下载中心</a>查看。',
        type: 'warning',
        duration: 5000,
        customClass: 'el-mes-zindex'
      } as NotificationParams)
    }
  } catch (error) {
    console.error('下载中心调用失败:', error)
    ElNotification({
      title: '导出失败',
      message: '导出请求发送失败，请稍后重试',
      type: 'error'
    })
  }
}

/**
 * 检查数据类型
 * @param any - 任意值
 * @returns 数据类型字符串
 */
export const checkType = (any: any): string => {
  return Object.prototype.toString.call(any).slice(8, -1)
}

/**
 * 深克隆
 * @param any - 需要克隆的值
 * @returns 克隆后的值
 */
export const deepClone = <T>(any: T): T[] => {
  const type = checkType(any)
  if (type === 'Object') {
    const o = {} as any
    for (const key in any as any) {
      o[key] = deepClone((any as any)[key])
    }
    return o
  } else if (type === 'Array') {
    const arr = [] as T[]
    for (let i = 0; i < (any as any).length; i++) {
      arr[i] = deepClone((any as any)[i]) as T
    }
    return arr
  } else if (type === 'Function') {
    return new Function(`return ${(any as any).toString()}`) as any
  } else if (type === 'Date') {
    return new Date((any as Date).valueOf()) as any
  } else if (type === 'RegExp') {
    return new RegExp(any as any) as any
  } else if (type === 'Map') {
    const m = new Map()
    ;(any as Map<any, any>).forEach((v, k) => {
      m.set(k, deepClone(v))
    })
    return m as any
  } else if (type === 'Set') {
    const s = new Set()
    for (const val of (any as Set<any>).values()) {
      s.add(deepClone(val))
    }
    return s as any
  }
  return any as T[]
}

/**
 * 初始化设置开始日期和结束日期
 * @param zone - 时区
 * @param days - 天数间隔
 * @returns 日期范围数组
 */
export const dateInit = (zone: string = 'US', days: number = 15): string[] => {
  const utcStartDay = dateForTimezone(zone)
  const utcEndDay = dayjs(utcStartDay)
    .subtract(days - 1, 'day')
    .format('YYYY-MM-DD')
  return [utcEndDay, utcStartDay]
}

// 默认导出
export default {
  numberSpilt,
  dateForTimezone,
  toDownloadCenter,
  deepClone,
  dateInit,
  hourParse,
  dateStringFormat,
  getJetLag,
  getWeekStartDate,
  dateToWeeks,
  getWeekNumber,
  checkType,
  isDate
}
