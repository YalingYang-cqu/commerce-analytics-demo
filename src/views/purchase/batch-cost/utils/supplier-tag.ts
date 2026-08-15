/**
 * 供应商名称标签 / 图表配色：10 色色板（无红色）。
 * 按行内序号取色：第 1 个供应商取 c1，第 2 个取 c2，依次类推，超出 10 个后循环。
 * 色板与 styles/supplier-tag.scss 的 c1~c10 一一对应。
 */
export type SupplierTagThemeKey = `c${number}`

export interface SupplierColor {
  /** 文字色（标签文字用） */
  color: string
  /** 背景色（标签背景用） */
  background: string
  /** 边框色（标签边框用） */
  border: string
  /** 图表色（柱状图/折线图/环形图用，取中间色） */
  chart: string
}

/** c1~c10 色板，顺序与 styles/supplier-tag.scss 保持一致 */
export const SUPPLIER_PALETTE: SupplierColor[] = [
  { color: '#c2410c', background: '#fff7ed', border: '#fed7aa', chart: '#fb923c' }, // c1 橙（与 c3 交换）
  { color: '#15803d', background: '#dcfce7', border: '#bbf7d0', chart: '#4ade80' }, // c2 绿
  { color: '#0369a1', background: '#e0f2fe', border: '#bae6fd', chart: '#38bdf8' }, // c3 蓝（与 c1 交换）
  { color: '#7e22ce', background: '#f3e8ff', border: '#e9d5ff', chart: '#c084fc' }, // c4 紫
  { color: '#0f766e', background: '#ccfbf1', border: '#99f6e4', chart: '#2dd4bf' }, // c5 青
  { color: '#4338ca', background: '#e0e7ff', border: '#c7d2fe', chart: '#818cf8' }, // c6 靛
  { color: '#be185d', background: '#fce7f3', border: '#fbcfe8', chart: '#f472b6' }, // c7 粉
  { color: '#0e7490', background: '#cffafe', border: '#a5f3fc', chart: '#22d3ee' }, // c8 蓝绿
  { color: '#4d7c0f', background: '#ecfccb', border: '#d9f99d', chart: '#a3e635' }, // c9 黄绿
  { color: '#a16207', background: '#fef9c3', border: '#fde68a', chart: '#facc15' } // c10 琥珀黄
]

const PALETTE_SIZE = SUPPLIER_PALETTE.length

/** 行内序号 → 色板下标（循环取色） */
function resolveThemeIndex(index: number): number {
  const safe = Number.isFinite(index) && index >= 0 ? Math.floor(index) : 0
  return safe % PALETTE_SIZE
}

/** 根据行内序号得到标签 class 后缀（c1~c10），supplierName 仅作兼容占位 */
export function getSupplierTagThemeKey(index: number, _supplierName?: string): SupplierTagThemeKey {
  return `c${resolveThemeIndex(index) + 1}` as SupplierTagThemeKey
}

export function getSupplierTagClass(index: number, supplierName?: string): string {
  return `supplier-tag supplier-tag--${getSupplierTagThemeKey(index, supplierName)}`
}

/** 行内序号 → 完整配色 */
export function getSupplierColor(index: number): SupplierColor {
  return SUPPLIER_PALETTE[resolveThemeIndex(index)]
}

/** 图表取色（柱状图/折线图/环形图）：取色板中间色 */
export function getSupplierChartColor(index: number): string {
  return getSupplierColor(index).chart
}

export function getSupplierTagIndexByName(
  supplierName: string,
  list: { name: string }[],
  fallbackIndex = 0
): number {
  const idx = list.findIndex((item) => item.name === supplierName)
  return idx >= 0 ? idx : fallbackIndex
}

/**
 * 供应商标签显示名：返回去空格后的完整名称
 * UI 侧通过 .supplier-tag 的 max-width + text-overflow:ellipsis 兜底过长情况
 */
export function formatSupplierShortName(name: string): string {
  return (name || '').trim()
}
