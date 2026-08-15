// Sc 订单利润：指标配置中心。集中维护「指标定义 / 各维度目录 / 卡片展示规则」，便于后续增删指标。
// 页面(index.vue)只负责造假数据与响应式装配，所有静态配置与纯函数放这里。
import { type CardGroup, type MetricFormat, formatValue } from '@/components/core/charts-comp/types'
import { mul, divide } from '@/utils/dataprocess'
import { formatMoney } from './currency'
import { formatPercent, toDisplayAmount } from './presentation'

/** 单个指标的静态定义 */
export interface MetricMeta {
  key: string
  label: string
  group: 'core' | 'unit' | 'cost' | 'risk'
  format: MetricFormat
  tooltip: string
  /** 造假基准值 */
  base: number
  defaultSelected?: boolean
}

/** 指标定义总表（造假 base / 格式 / 口径提示） */
export const METRIC_META: MetricMeta[] = [
  // 利润核心
  {
    key: 'profit',
    label: '利润额',
    group: 'core',
    format: 'money',
    base: 16721.07,
    tooltip: '平台收入-平台支出-库存成本+平台其他收入',
    defaultSelected: true
  },
  {
    key: 'margin',
    label: '利润率',
    group: 'core',
    format: 'percent',
    base: 3.24,
    tooltip: '利润额 ÷ 销售额',
    defaultSelected: true
  },
  {
    key: 'sales',
    label: '销售额',
    group: 'core',
    format: 'money',
    base: 516349.74,
    tooltip: '当前筛选范围内订单商品成交金额汇总',
    defaultSelected: true
  },
  {
    key: 'qty',
    label: '销量',
    group: 'core',
    format: 'number',
    base: 14748,
    tooltip: '当前筛选范围内订单商品件数汇总',
    defaultSelected: true
  },
  {
    key: 'shipQty',
    label: '发货量',
    group: 'core',
    format: 'number',
    base: 14210,
    tooltip: '订单状态为已发货的商品件数'
  },
  {
    key: 'dailyProfit',
    label: '日均利润',
    group: 'core',
    format: 'money',
    base: 557.37,
    tooltip: '利润额 ÷ 当前筛选日期天数'
  },
  {
    key: 'dailyMargin',
    label: '日均利润率',
    group: 'core',
    format: 'percent',
    base: 3.2,
    tooltip: '日均利润 ÷ 日均销售额'
  },
  {
    key: 'avgOrder',
    label: '客单价',
    group: 'core',
    format: 'money',
    base: 35.02,
    tooltip: '销售额 ÷ 销量'
  },
  // 单个利润
  {
    key: 'unitProfitAmount',
    label: '单个净利',
    group: 'unit',
    format: 'money',
    base: 1.13,
    tooltip: '利润额 ÷ 销量'
  },
  {
    key: 'unitProfitRate',
    label: '单个利润率',
    group: 'unit',
    format: 'percent',
    base: 3.2,
    tooltip: '单个净利 ÷ 综合售价'
  },
  {
    key: 'unitAd',
    label: '单个广告费用',
    group: 'unit',
    format: 'money',
    base: 3.73,
    tooltip: '广告费用 ÷ 销量'
  },
  {
    key: 'unitPromoFee',
    label: '单个促销费用',
    group: 'unit',
    format: 'money',
    base: 0.77,
    tooltip: '推广费 ÷ 销量（推广费不含测评费用）'
  },
  // 费用成本
  {
    key: 'referral',
    label: '平台佣金',
    group: 'cost',
    format: 'money',
    base: 77452.3,
    tooltip: '平台按销售额收取的佣金汇总'
  },
  {
    key: 'fba',
    label: 'FBA配送费',
    group: 'cost',
    format: 'money',
    base: 61980.12,
    tooltip: '平台配送费汇总'
  },
  {
    key: 'promoDiscount',
    label: '促销折扣',
    group: 'cost',
    format: 'money',
    base: 5320.4,
    tooltip: '订单促销折扣汇总'
  },
  {
    key: 'refundTotal',
    label: '退货退款',
    group: 'cost',
    format: 'money',
    base: 8930.55,
    tooltip: '商品退货退款及退货相关成本'
  },
  {
    key: 'ad',
    label: '广告费用',
    group: 'cost',
    format: 'money',
    base: 55058.61,
    tooltip: '当前筛选范围内广告投入金额',
    defaultSelected: true
  },
  {
    key: 'promoFee',
    label: '推广费',
    group: 'cost',
    format: 'money',
    base: 6210,
    tooltip: '促销折扣 + 站内促销费用（不含测评费用）'
  },
  {
    key: 'testFee',
    label: '测评费用',
    group: 'cost',
    format: 'money',
    base: 0,
    tooltip: 'Vine 评价计划费用'
  },
  {
    key: 'storageFee',
    label: '仓储费',
    group: 'cost',
    format: 'money',
    base: 4230.18,
    tooltip: '月度仓储费 + 长期仓储费 + 入库配置费 + FBA销毁费 + 合作承运费'
  },
  {
    key: 'fbaFulfillmentFee',
    label: 'FBA操作费',
    group: 'cost',
    format: 'money',
    base: 3120.44,
    tooltip: 'FBA销毁费 + FBA移除费 + FBA标签服务费 + 合作承运费等操作费用'
  },
  {
    key: 'platformOtherFee',
    label: '平台其他费用',
    group: 'cost',
    format: 'money',
    base: 2140.9,
    tooltip: '订阅费 + VINE + 优质服务费 + 透明计划标签 + 清算调整，并扣除清算收入和FBA库存赔偿'
  },
  {
    key: 'purchase',
    label: '采购成本',
    group: 'cost',
    format: 'money',
    base: 180020.55,
    tooltip: 'SKU采购成本按销量归集'
  },
  {
    key: 'head',
    label: '头程成本',
    group: 'cost',
    format: 'money',
    base: 35255.65,
    tooltip: '头程物流成本按SKU或销量分摊'
  },
  {
    key: 'totalCost',
    label: '综合成本',
    group: 'cost',
    format: 'money',
    base: 215255.65,
    tooltip: '采购成本 + 头程成本',
    defaultSelected: true
  },
  // 风险诊断
  {
    key: 'lossCount',
    label: '亏损对象数',
    group: 'risk',
    format: 'number',
    base: 8,
    tooltip: '利润额小于 0 的统计对象数量',
    defaultSelected: true
  },
  {
    key: 'lossAmount',
    label: '亏损额',
    group: 'risk',
    format: 'money',
    base: -1281.23,
    tooltip: '亏损对象的利润额合计'
  },
  {
    key: 'lowMarginCount',
    label: '低毛利对象',
    group: 'risk',
    format: 'number',
    base: 18,
    tooltip: '利润率在 0% - 8% 的统计对象数量'
  },
  {
    key: 'pendingAction',
    label: '待处理项',
    group: 'risk',
    format: 'number',
    base: 26,
    tooltip: '亏损对象数 + 低毛利对象数',
    defaultSelected: true
  },
  // ===== 订单维度专属指标（今日订单监控 / 异常排查），对齐 demo =====
  {
    key: 'todayOrderCount',
    label: '订单量',
    group: 'core',
    format: 'number',
    base: 572,
    tooltip: '按下单时间统计的订单总数'
  },
  {
    key: 'todayQty',
    label: '销量',
    group: 'core',
    format: 'number',
    base: 712,
    tooltip: '订单商品件数汇总，用于识别一单多件影响'
  },
  {
    key: 'todaySales',
    label: '销售额',
    group: 'core',
    format: 'money',
    base: 25358.38,
    tooltip: '订单商品成交金额汇总'
  },
  {
    key: 'estimatedProfit',
    label: '预估利润额',
    group: 'core',
    format: 'money',
    base: 899.26,
    tooltip: '订单按当前成本和费用归集规则计算的预估利润'
  },
  {
    key: 'estimatedMargin',
    label: '预估利润率',
    group: 'core',
    format: 'percent',
    base: 3.5,
    tooltip: '预估利润额 ÷ 销售额'
  },
  {
    key: 'lossOrderCount',
    label: '亏损订单数',
    group: 'risk',
    format: 'number',
    base: 241,
    tooltip: '当前明细范围内利润额小于 0 的订单数，点击后只筛选明细表'
  },

  {
    key: 'offsiteOrderCount',
    label: '站外订单量',
    group: 'risk',
    format: 'number',
    base: 102,
    tooltip: '站外订单量 · 数据口径说明'
  },
  {
    key: 'unshippedOrderCount',
    label: '未发货订单量',
    group: 'risk',
    format: 'number',
    base: 5,
    tooltip: '订单中尚未产生发货时间的订单数，点击后只筛选明细表'
  }
]

/** key -> 指标定义 */
export const META_MAP: Record<string, MetricMeta> = Object.fromEntries(
  METRIC_META.map((m) => [m.key, m])
)

/** 计数类指标（值后缀）：对象类=个、订单类=单 */
export const COUNT_UNIT: Record<string, string> = {
  lossCount: '个',
  lowMarginCount: '个',
  pendingAction: '个',
  lossOrderCount: '单',
  offsiteOrderCount: '单',
  unshippedOrderCount: '单'
}

/** 费用成本组字段（各维度共用），对齐 demo COST_METRIC_FIELDS */
const COST_FIELDS = [
  'referral',
  'fba',
  'promoDiscount',
  'refundTotal',
  'ad',
  'promoFee',
  'testFee',
  'storageFee',
  'fbaFulfillmentFee',
  'platformOtherFee',
  'purchase',
  'head',
  'totalCost'
]

/**
 * 订单维度「明细筛选」卡片（单选）：点击后只筛选下方明细表，指标不联动。
 * 顺序即展示顺序：亏损订单数 → 站外订单数 → 未发货订单数（对齐 demo）。
 */
export const ORDER_FILTER_KEYS = ['lossOrderCount', 'offsiteOrderCount', 'unshippedOrderCount']

/** 维度类型：看板 / 对象(父ASIN·ASIN·MSKU·SPU) / 订单 */
export type DimType = 'dashboard' | 'product' | 'order'

/** 由 Tab value 推导维度类型 */
export const toDimType = (tab: string): DimType =>
  tab === 'dashboard' ? 'dashboard' : tab === 'order' ? 'order' : 'product'

interface DimLayoutDef {
  groups: { key: string; title: string; fields: string[] }[]
  defaults: string[]
}

/** 各维度的指标分组结构 + 默认选中（对齐 demo 与配置图） */
export const DIM_LAYOUT: Record<DimType, DimLayoutDef> = {
  // 看板默认勾选对齐配置图：利润额/利润率/销售额/销量 + 广告费用/综合成本 + 亏损对象数/待处理项
  dashboard: {
    groups: [
      {
        key: 'core',
        title: '利润核心',
        fields: [
          'profit',
          'margin',
          'sales',
          'qty',
          'shipQty',
          'dailyProfit',
          'dailyMargin',
          'avgOrder'
        ]
      },
      { key: 'cost', title: '费用成本', fields: COST_FIELDS },
      {
        key: 'risk',
        title: '风险诊断',
        fields: ['lossCount', 'lossAmount', 'lowMarginCount', 'pendingAction']
      }
    ],
    defaults: ['profit', 'margin', 'sales', 'qty', 'ad', 'totalCost', 'lossCount', 'pendingAction']
  },
  // 父ASIN / ASIN / MSKU / SPU：无客单价，含单个利润组
  product: {
    groups: [
      {
        key: 'core',
        title: '利润核心',
        fields: ['profit', 'margin', 'sales', 'qty', 'shipQty', 'dailyProfit', 'dailyMargin']
      },
      {
        key: 'unit',
        title: '单个利润',
        fields: ['unitProfitAmount', 'unitProfitRate', 'unitAd', 'unitPromoFee']
      },
      { key: 'cost', title: '费用成本', fields: COST_FIELDS },
      {
        key: 'risk',
        title: '风险诊断',
        fields: ['lossCount', 'lossAmount', 'lowMarginCount', 'pendingAction']
      }
    ],
    defaults: [
      'profit',
      'margin',
      'sales',
      'qty',
      'unitProfitAmount',
      'ad',
      'totalCost',
      'lossCount'
    ]
  },
  order: {
    groups: [
      {
        key: 'core',
        title: '今日订单监控',
        fields: ['todayOrderCount', 'todayQty', 'todaySales', 'estimatedProfit', 'estimatedMargin']
      },
      {
        key: 'risk',
        title: '异常排查（点击卡片筛选明细）',
        fields: ORDER_FILTER_KEYS
      },
      { key: 'cost', title: '费用成本', fields: COST_FIELDS }
    ],
    defaults: [
      'todayOrderCount',
      'todayQty',
      'todaySales',
      'estimatedProfit',
      'estimatedMargin',
      ...ORDER_FILTER_KEYS
    ]
  }
}

/**
 * 指标分组色点（与明细表列分组色条 / PRD 1.7.2 语义对齐）：
 * core=利润红、unit=单个利润青(对齐 product.ts)、cost=费用黄、risk=风险橙。
 */
const METRIC_GROUP_COLORS: Record<string, string> = {
  core: '#ef4444',
  unit: '#0f9f8f',
  cost: '#eab308',
  risk: '#f97316'
}

/** 按维度构建卡片分组（供 CardSetting / CardItems / buildDefaultLayout 使用） */
export const buildMetricGroups = (dim: DimType): CardGroup[] => {
  const def = DIM_LAYOUT[dim]
  const defSet = new Set(def.defaults)
  return def.groups.map((g) => ({
    key: g.key,
    title: g.title,
    color: METRIC_GROUP_COLORS[g.key],
    items: g.fields.map((key) => {
      const m = META_MAP[key]
      return {
        key,
        label: m?.label || key,
        format: m?.format || 'number',
        tooltip: m?.tooltip || '',
        defaultSelected: defSet.has(key)
      }
    })
  }))
}

/** 值是否标红（对齐 demo valDanger：利润率<8、亏损/低毛利/异常单量>0、亏损额/预估利润<0） */
export const isMetricDanger = (key: string, value: number | null | undefined): boolean => {
  if (value == null || Number.isNaN(value)) return false
  if (['margin', 'dailyMargin', 'unitProfitRate', 'estimatedMargin'].includes(key)) return value < 8
  if (
    [
      'lossCount',
      'lowMarginCount',
      'pendingAction',
      'lossOrderCount',
      'offsiteOrderCount',
      'unshippedOrderCount'
    ].includes(key)
  )
    return value > 0
  if (['lossAmount', 'estimatedProfit'].includes(key)) return value < 0
  return false
}

/** 卡片主值格式化（计数类带后缀；金额随币种符号 $/¥；其余按 format） */
export const formatMetricValue = (key: string, value: number | null | undefined): string => {
  if (value == null || Number.isNaN(value)) return '—'
  const unit = COUNT_UNIT[key]
  if (unit) return `${Math.round(value).toLocaleString('en-US')} ${unit}`
  if (META_MAP[key]?.format === 'money') return formatMoney(toDisplayAmount(key, value))
  return formatValue(value, META_MAP[key]?.format)
}

const money = (x: number): string => formatMoney(x)
const pct = (x: number): string => formatPercent(x)
const fmtInt = (x: number): string => Math.round(x).toLocaleString('en-US')

/** 卡片副信息运行时上下文 */
export interface MetricSubCtx {
  /** 各指标当前值 */
  values: Record<string, number>
  /** 各指标环比（-1~1） */
  wow: Record<string, number>
  /** 当前筛选天数 */
  days: number
  /** 当前选中的明细筛选卡片 key（单选，''=未筛选；订单三卡 / 待处理项共用） */
  filterKey?: string
}

/** 订单明细筛选卡片的副信息（选中=已筛选/点击取消，未选=点击筛选 ›） */
const orderFilterSub = (key: string, label: string, filterKey?: string): string => {
  const on = filterKey === key
  return `<span class="s-go">${on ? `已筛选${label}，点击取消筛选` : `点击筛选${label} ›`}</span>`
}

/**
 * 每个指标卡片的副信息（对齐 demo 经营总览 renderMetrics 的 sub）：
 * 利润额=环比、比率类=公式、费用类=占比/ACoS、风险类=亏损额/数量等，各不相同。
 */
export const metricSub = (key: string, ctx: MetricSubCtx): string => {
  const v = ctx.values
  const sales = Math.abs(v.sales || 0)
  switch (key) {
    case 'profit': {
      const w = v.profit != null ? ctx.wow.profit || 0 : 0
      const up = w >= 0
      // 中国习惯：涨=红(up)、跌=绿(down)
      return `<span class="${up ? 's-up' : 's-down'}">${up ? '▲' : '▼'} 环比 ${formatPercent(mul(w, 100), { showPlus: true })}</span>`
    }
    case 'margin':
      return '利润额 ÷ 销售额'
    case 'sales':
      return '当前筛选口径'
    case 'qty':
      return '订单商品件数'
    case 'shipQty':
      return '订单状态为Shipped的订单商品件数'
    case 'dailyProfit':
      return `按 ${fmtInt(ctx.days)} 天均摊`
    case 'dailyMargin':
      return '日均利润 / 日均销售额'
    case 'avgOrder':
      return '销售额 / 销量'
    case 'unitProfitAmount':
      return '利润额 / 销量'
    case 'unitProfitRate':
      return '单个净利 / 综合售价'
    case 'unitAd':
      return '广告费用 / 销量'
    case 'unitPromoFee':
      return '推广费 / 销量（不含测评）'
    case 'referral':
      return `占销售额 ${pct(mul(divide(Math.abs(v.referral || 0), sales), 100))}`
    case 'fba':
      return `占销售额 ${pct(mul(divide(Math.abs(v.fba || 0), sales), 100))}`
    case 'promoDiscount':
      return '订单促销折扣'
    case 'refundTotal':
      return '退款成本汇总'
    case 'ad':
      return `广告 ACoS ${pct(mul(divide(Math.abs(v.ad || 0), sales), 100))}`
    case 'promoFee':
      return '促销折扣 + 站内促销'
    case 'testFee':
      return 'Vine 评价计划费用'
    case 'storageFee':
      return '月仓储 + 长期仓储 + 入库配置'
    case 'fbaFulfillmentFee':
      return 'FBA销毁 + 合作承运'
    case 'platformOtherFee':
      return `占销售额 ${pct(mul(divide(Math.abs(v.platformOtherFee || 0), sales), 100))}`
    case 'purchase':
      return 'SKU采购成本汇总'
    case 'head':
      return '头程物流成本分摊'
    case 'totalCost':
      return '采购+头程'
    case 'lossCount':
      return `亏损额 <span class="s-neg">${money(v.lossAmount || 0)}</span>`
    case 'lossAmount':
      return `${fmtInt(v.lossCount || 0)} 个亏损对象`
    case 'lowMarginCount':
      return '利润率 0% - 8%'
    case 'pendingAction': {
      const on = ctx.filterKey === 'pendingAction'
      return `<span class="s-go">${on ? '已筛选风险项，点击取消筛选' : '点击只看明细风险项 ›'}</span>`
    }
    // ===== 订单维度 =====
    case 'todayOrderCount':
      return '按下单时间统计'
    case 'todayQty':
      return '订单商品件数'
    case 'todaySales':
      return '成交金额'
    case 'estimatedProfit':
      return '按当前费用口径预估'
    case 'estimatedMargin':
      return '预估利润额 ÷ 销售额'
    case 'lossOrderCount':
      return orderFilterSub(key, '亏损订单', ctx.filterKey)
    case 'offsiteOrderCount':
      return orderFilterSub(key, '站外订单', ctx.filterKey)
    case 'unshippedOrderCount':
      return orderFilterSub(key, '未发货订单', ctx.filterKey)
    default:
      return META_MAP[key]?.tooltip || ''
  }
}
