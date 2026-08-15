/** 物流渠道名称标签：前 4 个固定色，超出后从扩展色板按名称哈希取色 */
export type ChannelTagThemeKey = 'theme-0' | 'theme-1' | 'theme-2' | 'theme-3' | `extra-${number}`

const FIXED_THEME_COUNT = 4
const EXTRA_THEME_COUNT = 6

/** 根据行内序号与物流渠道名得到标签 class 后缀 */
export function getChannelTagThemeKey(index: number, channelName: string): ChannelTagThemeKey {
  if (index < FIXED_THEME_COUNT) {
    return `theme-${index}` as ChannelTagThemeKey
  }
  const seed = `${channelName || ''}-${index}`
  let hash = 0
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i)
    hash |= 0
  }
  const extraIndex = Math.abs(hash) % EXTRA_THEME_COUNT
  return `extra-${extraIndex}`
}

export function getChannelTagClass(index: number, channelName: string): string {
  return `channel-tag channel-tag--${getChannelTagThemeKey(index, channelName)}`
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
