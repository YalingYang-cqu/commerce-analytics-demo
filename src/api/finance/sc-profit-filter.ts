import { resolveOrderProfitDateRange } from './sc-profit-date-range'
import type { OrderProfitBaseFilter } from './sc-profit-types'

export type { OrderProfitBaseFilter } from './sc-profit-types'

const toArr = <T>(v: T | T[] | undefined | null): T[] | undefined => {
  if (v === undefined || v === null || v === '') return undefined
  const arr = Array.isArray(v) ? v : [v]
  return arr.length ? arr : undefined
}

/** 前端 Tab → 后端页签 code（MSKU 后端为 sku） */
export const toBackendTab = (tab: string): string => (tab === 'msku' ? 'sku' : tab)

/**
 * 订单 Tab 的 dateGrain 复用为时间口径（day=下单 / settlement=结算）；
 * 其它 Tab 的 dateGrain 仍是日/周/月粒度。
 */
export function resolveOrderProfitDateType(form: Record<string, any>): string {
  return form?.dateGrain === 'settlement' ? 'settlement' : 'order'
}

/**
 * 明细/趋势用的周期粒度：订单 Tab 的 settlement 不是周期枚举，固定 day。
 */
export function resolveOrderProfitGranularity(form: Record<string, any>): string {
  const grain = String(form?.dateGrain || 'day')
  return grain === 'settlement' ? 'day' : grain
}

/**
 * 由页面 searchForm 组装后端通用筛选入参。
 * searchForm 由 ArtSearchBar 产出：site/shopIds/categoryIds/brandIds 为数组，
 * spu 为 spuCode 字符串数组，dateRange=[start,end]，
 * dateGrain 在订单 Tab 表示下单/结算口径、其它 Tab 表示日/周/月，
 * currency/orderSource/searchType/keyword 为标量。
 */
export function buildOrderProfitFilter(form: Record<string, any>): OrderProfitBaseFilter {
  const dateType = resolveOrderProfitDateType(form)
  const rangeGrain = dateType === 'settlement' ? 'day' : form?.dateGrain
  const { dateStart, dateEnd } = resolveOrderProfitDateRange(form?.dateRange, rangeGrain)
  const keyword = typeof form?.keyword === 'string' ? form.keyword.trim() : ''
  return {
    dateStart,
    dateEnd,
    dateType,
    site: toArr<string>(form?.site),
    shopIds: toArr<number>(form?.shopIds),
    brandIds: toArr<number>(form?.brandIds),
    categoryIds: toArr<number>(form?.categoryIds),
    spuCodes: toArr<string>(form?.spu ?? form?.spuCodes),
    currency: form?.currency || 'USD',
    orderSource: form?.orderSource || undefined,
    searchType: keyword ? form?.searchType || 'asin' : undefined,
    keyword: keyword || undefined
  }
}
