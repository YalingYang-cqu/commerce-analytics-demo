// charts-comp 共享类型与工具：metric-setting / line-chart / 业务页面共用，保证配色与格式化一致

/** 数值格式类型 */
export type MetricFormat = 'number' | 'percent' | 'money' | 'float'

/** 单个指标定义 */
export interface MetricItem {
  /** 唯一标识 */
  key: string
  /** 显示名称 */
  label: string
  /** 数值格式（默认 number） */
  format?: MetricFormat
  /** 自定义格式化（优先级高于 format） */
  formatter?: (value: number) => string
}

/** 指标分组 */
export interface MetricGroup {
  key: string
  title: string
  items: MetricItem[]
}

/** 已解析的图表指标（含颜色与对齐 xAxis 的数据） */
export interface ChartMetric extends MetricItem {
  /** 线条颜色 */
  color: string
  /** 与 xAxis 对齐的原始数值序列（「原值」模式绘制、行尾标签/tooltip 始终取此真实值） */
  data: number[]
  /**
   * 与 xAxis 对齐的归一化序列（0~100，通常由后端按本指标 min/max 缩放得到）。
   * 「归一化」模式优先使用；未提供时组件回退为前端 Min-Max 计算。
   */
  normalized?: number[]
  /** 折线线型；相同数值的多序列可通过虚实线区分。 */
  lineType?: 'solid' | 'dashed' | 'dotted'
}

/** 分段选择项（粒度 / 时间范围 / 模式 等） */
export interface SegOption<T = string> {
  label: string
  value: T
}

/** 图表展示模式：归一化 / 原值 */
export type ChartMode = 'normalized' | 'raw'

/** 默认配色：按「选中顺序」一一对应（两个组件共用同一套，颜色才一致） */
export const DEFAULT_METRIC_PALETTE = [
  '#5B8FF9',
  '#22C55E',
  '#FF9F1C',
  '#F5497B',
  '#9254DE',
  '#13C2C2',
  '#FACC15',
  '#3B82F6'
]

/** 按选中顺序取颜色 */
export const resolveMetricColor = (
  index: number,
  palette: string[] = DEFAULT_METRIC_PALETTE
): string => palette[index % palette.length] ?? DEFAULT_METRIC_PALETTE[0]

/** 在分组里按 key 查找指标 */
export const findMetric = (groups: MetricGroup[], key: string): MetricItem | undefined => {
  for (const g of groups) {
    const m = g.items.find((i) => i.key === key)
    if (m) return m
  }
  return undefined
}

/** 统一数值格式化 */
export const formatValue = (value: number, format: MetricFormat = 'number'): string => {
  if (value === null || value === undefined || Number.isNaN(value)) return '-'
  switch (format) {
    case 'percent':
      return `${value.toFixed(2)}%`
    case 'money':
      return `$${value.toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
      })}`
    case 'float':
      return value.toFixed(2)
    case 'number':
    default:
      return Math.round(value).toLocaleString('en-US')
  }
}

/** 指标取值格式化（formatter 优先，其次 format） */
export const formatMetric = (metric: MetricItem, value: number): string =>
  metric.formatter ? metric.formatter(value) : formatValue(value, metric.format)

// ========== card-setting（卡片配置/展示）相关类型与工具 ==========

/** 卡片指标：在指标基础上增加问号提示与默认选中 */
export interface CardMetric extends MetricItem {
  /** 卡片问号图标的悬浮提示文案 */
  tooltip?: string
  /** 是否默认选中 */
  defaultSelected?: boolean
}

/** 卡片指标分组（含该组最大可选量） */
export interface CardGroup {
  key: string
  title: string
  /** 该组最大可选量（不传则不限制） */
  max?: number
  /** 分组色点颜色（配置面板分组标题左侧圆点；不传则不显示色点） */
  color?: string
  items: CardMetric[]
}

/** 用户对卡片的布局配置：每组内指标顺序 + 选中集合（即保存/读取的习惯结构） */
export interface CardLayoutState {
  /** 分组 key -> 该组内全部指标 key 的顺序 */
  orders: Record<string, string[]>
  /** 选中的指标 key（全局唯一） */
  selected: string[]
}

/** 解析后的可见分组（仅含已选指标，按用户顺序） */
export interface ResolvedCardGroup {
  group: CardGroup
  items: CardMetric[]
}

/** 构建默认布局：保持定义顺序，选中 defaultSelected 的项 */
export const buildDefaultLayout = (groups: CardGroup[]): CardLayoutState => {
  const orders: Record<string, string[]> = {}
  const selected: string[] = []
  groups.forEach((g) => {
    orders[g.key] = g.items.map((i) => i.key)
    g.items.forEach((i) => i.defaultSelected && selected.push(i.key))
  })
  return { orders, selected: [...new Set(selected)] }
}

/**
 * 合并已保存布局：以默认布局为骨架，套用 saved 中仍有效的顺序与选中，
 * 自动过滤已删除的指标；新增指标按默认配置中的相邻位置插入，保证配置升级不丢数据且分组语义不乱序。
 */
export const mergeLayout = (
  groups: CardGroup[],
  saved?: Partial<CardLayoutState> | null
): CardLayoutState => {
  const base = buildDefaultLayout(groups)
  if (!saved) return base
  const orders: Record<string, string[]> = {}
  groups.forEach((g) => {
    const valid = new Set(g.items.map((i) => i.key))
    const savedOrder = (saved.orders?.[g.key] || []).filter((k) => valid.has(k))
    const mergedOrder = [...new Set(savedOrder)]
    const baseOrder = base.orders[g.key]
    baseOrder.forEach((key, baseIndex) => {
      if (mergedOrder.includes(key)) return
      const previous = baseOrder
        .slice(0, baseIndex)
        .reverse()
        .find((candidate) => mergedOrder.includes(candidate))
      if (previous) {
        mergedOrder.splice(mergedOrder.indexOf(previous) + 1, 0, key)
        return
      }
      const next = baseOrder
        .slice(baseIndex + 1)
        .find((candidate) => mergedOrder.includes(candidate))
      if (next) mergedOrder.splice(mergedOrder.indexOf(next), 0, key)
      else mergedOrder.push(key)
    })
    orders[g.key] = mergedOrder
  })
  const allKeys = new Set(groups.flatMap((g) => g.items.map((i) => i.key)))
  // 指标 key -> 所属组 / 组上限，用于对（历史保存或异常）超额选中按组裁剪
  const keyGroup = new Map<string, string>()
  const groupMax = new Map<string, number | undefined>()
  groups.forEach((g) => {
    groupMax.set(g.key, g.max)
    g.items.forEach((i) => keyGroup.set(i.key, g.key))
  })
  // 保持原有选中顺序，剔除失效 key，并保证「每组选中数不超过 g.max」（超出的丢弃）
  const groupCount: Record<string, number> = {}
  const selected: string[] = []
  for (const k of saved.selected ?? base.selected) {
    if (!allKeys.has(k) || selected.includes(k)) continue
    const gk = keyGroup.get(k) as string
    const max = groupMax.get(gk)
    const used = groupCount[gk] || 0
    if (typeof max === 'number' && used >= max) continue
    groupCount[gk] = used + 1
    selected.push(k)
  }
  return { orders, selected }
}

/** 解析可见卡片：按分组顺序 + 组内顺序，返回每组已选指标（空组自动剔除） */
export const resolveVisibleCards = (
  groups: CardGroup[],
  layout: CardLayoutState
): ResolvedCardGroup[] => {
  const sel = new Set(layout.selected || [])
  return groups
    .map((g) => {
      const byKey = new Map(g.items.map((i) => [i.key, i]))
      const order = layout.orders?.[g.key] || g.items.map((i) => i.key)
      const items = order
        .map((k) => byKey.get(k))
        .filter((m): m is CardMetric => !!m && sel.has(m.key))
      return { group: g, items }
    })
    .filter((rg) => rg.items.length > 0)
}
