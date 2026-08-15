import {
  orderProfitStoreOptions,
  orderProfitFilterOptions,
  type OrderProfitStoreOption,
  type OrderProfitFilterOptions
} from '@/api/finance/sc-profit'

/**
 * 筛选栏下拉选项的短时缓存。
 *
 * 页面 6 个维度 Tab 各持有一个筛选栏实例（见 index.vue 的 KeepAlive 面板），
 * 若不缓存，每个 Tab 首次进入都会重复请求店铺与联动选项。
 * 同一参数在 TTL 内复用结果，并合并并发请求（与明细表费用下钻的缓存策略一致）。
 */
const CACHE_TTL = 2 * 60 * 1000

const cache = new Map<string, { expiresAt: number; data: unknown }>()
const pending = new Map<string, Promise<unknown>>()

const cachedRequest = async <T>(key: string, request: () => Promise<T>): Promise<T> => {
  const now = Date.now()
  const hit = cache.get(key)
  if (hit && hit.expiresAt > now) return hit.data as T
  if (hit) cache.delete(key)
  const inflight = pending.get(key)
  if (inflight) return inflight as Promise<T>

  const task = request()
  pending.set(key, task)
  try {
    const data = await task
    cache.set(key, { expiresAt: Date.now() + CACHE_TTL, data })
    return data
  } finally {
    pending.delete(key)
  }
}

/** 店铺全量（受账号数据权限过滤）：全页面共用一份 */
export const fetchStoreOptions = (): Promise<OrderProfitStoreOption[]> =>
  cachedRequest('stores', () => orderProfitStoreOptions())

/** 分类/品牌/SPU 联动选项：按 站点 + 店铺 组合缓存 */
export const fetchCascadeOptions = (params: {
  site?: string[]
  shopIds?: number[]
}): Promise<OrderProfitFilterOptions> => {
  const site = (params.site || []).join(',')
  const shopIds = (params.shopIds || []).join(',')
  return cachedRequest(`cascade:${site}|${shopIds}`, () => orderProfitFilterOptions(params))
}
