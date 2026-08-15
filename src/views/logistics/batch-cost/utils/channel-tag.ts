/**
 * 物流渠道名称标签 / 图表配色：10 色色板（无红色）。
 * 指定渠道固定取色，其余渠道按名称哈希取一个稳定颜色（同名同色）。
 * 色板与 styles/channel-tag-vars.scss 的 c1~c10 一一对应。
 */
export type ChannelTagThemeKey = `c${number}`

export interface ChannelColor {
  /** 文字色（标签文字用） */
  color: string
  /** 背景色（标签背景用） */
  background: string
  /** 边框色（标签边框用） */
  border: string
  /** 图表色（柱状图/折线图/环形图用） */
  chart: string
}

/** c1~c10 色板，顺序与 channel-tag-vars.scss 保持一致 */
const PALETTE: ChannelColor[] = [
  { color: '#0369a1', background: '#e0f2fe', border: '#bae6fd', chart: '#38bdf8' }, // c1 蓝
  { color: '#15803d', background: '#dcfce7', border: '#bbf7d0', chart: '#4ade80' }, // c2 绿
  { color: '#c2410c', background: '#fff7ed', border: '#fed7aa', chart: '#fb923c' }, // c3 橙
  { color: '#7e22ce', background: '#f3e8ff', border: '#e9d5ff', chart: '#c084fc' }, // c4 紫
  { color: '#0f766e', background: '#ccfbf1', border: '#99f6e4', chart: '#2dd4bf' }, // c5 青
  { color: '#4338ca', background: '#e0e7ff', border: '#c7d2fe', chart: '#818cf8' }, // c6 靛
  { color: '#be185d', background: '#fce7f3', border: '#fbcfe8', chart: '#f472b6' }, // c7 粉
  { color: '#0e7490', background: '#cffafe', border: '#a5f3fc', chart: '#22d3ee' }, // c8 蓝绿
  { color: '#4d7c0f', background: '#ecfccb', border: '#d9f99d', chart: '#a3e635' }, // c9 黄绿
  { color: '#a16207', background: '#fef9c3', border: '#fde68a', chart: '#facc15' } // c10 琥珀黄
]

const PALETTE_SIZE = PALETTE.length

/** 指定渠道固定色（值为色板下标 0-based） */
const CHANNEL_THEME_INDEX: Record<string, number> = {
  海运普船: 0, // c1
  美森正班: 1, // c2
  合德快船: 2, // c3
  空派: 3, // c4
  快递: 4, // c5
  AGL: 5 // c6
}

/** 名称哈希 → 稳定取色（同名同色），用于未指定的渠道 */
function hashThemeIndex(channelName: string): number {
  const seed = channelName || ''
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  return Math.abs(hash) % PALETTE_SIZE
}

/** 渠道名 → 色板下标：指定渠道固定，其余按名称哈希随机（稳定） */
function resolveThemeIndex(channelName: string): number {
  const name = (channelName || '').trim()
  const fixed = CHANNEL_THEME_INDEX[name]
  return fixed != null ? fixed : hashThemeIndex(name)
}

/** 根据物流渠道名得到标签 class 后缀（c1~c10），index 已废弃仅作兼容占位 */
export function getChannelTagThemeKey(_index: number, channelName: string): ChannelTagThemeKey {
  return `c${resolveThemeIndex(channelName) + 1}` as ChannelTagThemeKey
}

export function getChannelTagClass(index: number, channelName: string): string {
  return `channel-tag channel-tag--${getChannelTagThemeKey(index, channelName)}`
}

/** 渠道完整配色（color/background/border） */
export function getChannelColor(channelName: string): ChannelColor {
  return PALETTE[resolveThemeIndex(channelName)]
}

/** 柱状图取色：用专门的图表色 */
export function getChannelBarColor(channelName: string): string {
  return getChannelColor(channelName).chart
}

/** 折线图取色：用专门的图表色 */
export function getChannelLineColor(channelName: string): string {
  return getChannelColor(channelName).chart
}

export function getChannelTagIndexByName(
  channelName: string,
  list: { name: string }[],
  fallbackIndex = 0
): number {
  const idx = list.findIndex((item) => item.name === channelName)
  return idx >= 0 ? idx : fallbackIndex
}

export function formatChannelShortName(name: string): string {
  const trimmed = (name || '').trim()
  if (!trimmed) return ''
  return trimmed.length <= 4 ? trimmed : trimmed.slice(0, 2)
}
