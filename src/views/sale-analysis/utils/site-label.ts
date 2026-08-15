import { pubCountryList } from '@/utils/data'

/** 常用站点中文名兜底（接口未返回或尚未加载时） */
const SITE_LABEL_FALLBACK: Record<string, string> = {
  US: '美国'
}

let siteLabelMap: Map<string, string> | null = null
let loadingPromise: Promise<void> | null = null

const normalizeSiteCode = (code: string) => code.trim().toUpperCase()

const buildSiteLabelMap = (
  countries: Array<{ label?: string; value?: string; code?: string; name?: string }>
) => {
  const map = new Map<string, string>()
  countries.forEach((item) => {
    const label = item.label || item.name
    if (!label) return
    const keys = [item.value, item.code].filter(Boolean).map((k) => normalizeSiteCode(String(k)))
    keys.forEach((key) => {
      if (!map.has(key)) map.set(key, label)
    })
  })
  Object.entries(SITE_LABEL_FALLBACK).forEach(([code, label]) => {
    if (!map.has(code)) map.set(code, label)
  })
  return map
}

/** 预加载站点代码 → 中文名映射（幂等，可并发调用） */
export const ensureSiteLabelMap = async (): Promise<void> => {
  if (siteLabelMap) return
  if (loadingPromise) return loadingPromise
  loadingPromise = (async () => {
    try {
      const countries = await pubCountryList()
      siteLabelMap = buildSiteLabelMap(countries || [])
    } catch {
      siteLabelMap = buildSiteLabelMap([])
    } finally {
      loadingPromise = null
    }
  })()
  return loadingPromise
}

/** 将站点代码转为中文名；未知代码原样返回 */
export const formatSiteLabel = (raw: string | number | undefined | null): string => {
  if (raw === undefined || raw === null) return ''
  const value = String(raw).trim()
  if (!value) return ''
  const code = normalizeSiteCode(value)
  const fromMap = siteLabelMap?.get(code)
  if (fromMap) return fromMap
  return SITE_LABEL_FALLBACK[code] || value
}
