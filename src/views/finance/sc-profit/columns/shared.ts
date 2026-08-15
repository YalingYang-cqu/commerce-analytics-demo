import type { ColumnOption } from '@/types/component'
import type { FieldMeta } from './types'
import { isDrilldownProp } from './drilldown'
import { formatMoney } from '../currency'
import { formatPercent, toDisplayAmount } from '../presentation'

/** 字段中文名（列设置 / 表头） */
export const FIELD_LABEL: Record<string, string> = {
  date: '日期',
  image: '图片',
  parentAsin: '父ASIN',
  asin: 'ASIN',
  msku: 'MSKU',
  spu: 'SPU',
  category: '分类',
  brand: '品牌',
  store: '店铺',
  owner: '负责人',
  country: '国家',
  currency: '币种',
  orderNo: '订单号',
  orderTime: '下单时间',
  payTime: '付款时间',
  shipTime: '发货时间',
  settleTime: '结算时间',
  settlementNo: 'Settlement ID',
  salesWoW: '销售额环比',
  profitWoW: '利润额环比',
  marginChange: '利润率变化',
  profit: '利润额',
  margin: '利润率',
  trend: '利润详情',
  unitPrice: '综合售价',
  unitNetProfit: '单个净利',
  unitAd: '单个广告费用',
  unitPromoFee: '单个促销费用',
  sales: '销售额',
  buyerShipping: '买家运费',
  qty: '销量',
  referral: '平台佣金',
  fba: 'FBA配送费',
  promoDiscount: '促销折扣',
  refundTotal: '退货退款',
  ad: '广告费用',
  promoFee: '推广费',
  testFee: '测评费用',
  storageFee: '仓储费',
  fbaFulfillmentFee: 'FBA操作费',
  platformOtherFee: '平台其他费用',
  unitFba: '单个FBA配送费',
  unitReferral: '单个平台佣金',
  unitPromoDiscount: '单个促销折扣',
  unitRefundTotal: '单个退货退款',
  unitAdSpend: '单个广告费用',
  unitStorageFee: '单个仓储费',
  unitFbaFulfillmentFee: '单个FBA操作费',
  unitPlatformOtherFee: '单个平台其他费用',
  purchase: '采购成本',
  head: '头程成本',
  totalCost: '综合成本',
  unitPurchase: '单个采购成本',
  unitHead: '单个头程成本',
  unitTotalCost: '单个综合成本',
  fbaInventoryReimbursement: 'FBA库存赔偿',
  otherIncome: '其他收入',
  unitFbaInventoryReimbursement: '单个FBA库存赔偿',
  unitOtherIncome: '单个其他收入',
  adSales: '广告销售额',
  adQty: '广告销量',
  organicQty: '自然销量',
  offsiteQty: '站外销量',
  adQtyRate: '广告销量占比',
  adAcos: '广告 ACoS'
}

/**
 * 字段表头气泡文案（口径说明）。
 * 命中的列由表格组件渲染「标签 + 问号 icon + Tooltip」，无需再写 `#xxx-header` 插槽；
 * 利润拆解抽屉的单个利润卡片复用同一份文案，保证两处口径一致。
 */
export const FIELD_TIP: Record<string, string> = {
  unitPrice: '销售额 ÷ 销量',
  unitNetProfit: '利润额 ÷ 销量',
  unitAd: '广告费用 ÷ 销量',
  unitPromoFee: '促销费用 ÷ 销量'
}

/** 数值字段元数据（格式 / 着色 / 造假基准） */
export const FIELD_META: Record<string, FieldMeta> = {
  salesWoW: { fmt: 'wow', color: 'wow' },
  profitWoW: { fmt: 'wow', color: 'wow' },
  marginChange: { fmt: 'wow', color: 'wow' },
  profit: { fmt: 'money', color: 'auto', base: 16721.07 },
  margin: { fmt: 'percent', color: 'auto', base: 3.24 },
  trend: { fmt: 'link' },
  unitPrice: { fmt: 'money', base: 34.99 },
  unitNetProfit: { fmt: 'money', base: 1.13 },
  unitAd: { fmt: 'money', color: 'cost', base: 3.94 },
  unitPromoFee: { fmt: 'money', color: 'cost', base: 0.77 },
  sales: { fmt: 'money', base: 516349.74 },
  buyerShipping: { fmt: 'money', base: 8200 },
  qty: { fmt: 'int', base: 14748 },
  referral: { fmt: 'money', color: 'cost', base: 79013.37 },
  fba: { fmt: 'money', color: 'cost', base: 128460.19 },
  promoDiscount: { fmt: 'money', color: 'cost', base: 6452.22 },
  refundTotal: { fmt: 'money', color: 'cost', base: 5679.84 },
  ad: { fmt: 'money', color: 'cost', base: 58058.61 },
  promoFee: { fmt: 'money', color: 'cost', base: 11373.07 },
  testFee: { fmt: 'money', color: 'cost', base: 0 },
  storageFee: { fmt: 'money', color: 'cost', base: 2810.79 },
  fbaFulfillmentFee: { fmt: 'money', color: 'cost', base: 1118.69 },
  platformOtherFee: { fmt: 'money', color: 'cost', base: 8443.41 },
  unitFba: { fmt: 'money', color: 'cost', base: 8.71 },
  unitReferral: { fmt: 'money', color: 'cost', base: 5.36 },
  unitPromoDiscount: { fmt: 'money', color: 'cost', base: 0.44 },
  unitRefundTotal: { fmt: 'money', color: 'cost', base: 0.39 },
  unitAdSpend: { fmt: 'money', color: 'cost', base: 3.94 },
  unitStorageFee: { fmt: 'money', color: 'cost', base: 0.19 },
  unitFbaFulfillmentFee: { fmt: 'money', color: 'cost', base: 0.08 },
  unitPlatformOtherFee: { fmt: 'money', color: 'cost', base: 0.57 },
  purchase: { fmt: 'money', color: 'cost', base: 188657.72 },
  head: { fmt: 'money', color: 'cost', base: 29597.93 },
  totalCost: { fmt: 'money', color: 'cost', base: 218255.65 },
  unitPurchase: { fmt: 'money', color: 'cost', base: 12.79 },
  unitHead: { fmt: 'money', color: 'cost', base: 2.01 },
  unitTotalCost: { fmt: 'money', color: 'cost', base: 14.8 },
  fbaInventoryReimbursement: { fmt: 'money', base: 347.9 },
  otherIncome: { fmt: 'money', base: 243.25 },
  unitFbaInventoryReimbursement: { fmt: 'money', base: 0.02 },
  unitOtherIncome: { fmt: 'money', base: 0.02 },
  adSales: { fmt: 'money', base: 260000 },
  adQty: { fmt: 'int', base: 7000 },
  organicQty: { fmt: 'int', base: 7748 },
  offsiteQty: { fmt: 'int', base: 520 },
  adQtyRate: { fmt: 'percent', base: 47.46 },
  adAcos: { fmt: 'percent', base: 22.33 }
}

/** 共用字段列表（对齐 demo PRODUCT / DASHBOARD / ORDER layer） */
export const PROFIT_FIELDS = ['profit', 'margin', 'trend'] as const
export const UNIT_PROFIT_FIELDS = ['unitPrice', 'unitNetProfit', 'unitAd', 'unitPromoFee'] as const
export const INCOME_FIELDS = ['sales', 'buyerShipping', 'qty'] as const
export const EXPENSE_FIELDS = [
  'referral',
  'fba',
  'promoDiscount',
  'refundTotal',
  'ad',
  'promoFee',
  'testFee',
  'storageFee',
  'fbaFulfillmentFee',
  'platformOtherFee'
] as const
export const UNIT_EXPENSE_FIELDS = [
  'unitFba',
  'unitReferral',
  'unitPromoDiscount',
  'unitRefundTotal',
  'unitAdSpend',
  'unitStorageFee',
  'unitFbaFulfillmentFee',
  'unitPlatformOtherFee'
] as const
export const COST_FIELDS = ['purchase', 'head', 'totalCost'] as const
export const UNIT_COST_FIELDS = ['unitPurchase', 'unitHead', 'unitTotalCost'] as const
export const OTHER_INCOME_FIELDS = ['fbaInventoryReimbursement', 'otherIncome'] as const
export const UNIT_OTHER_INCOME_FIELDS = [
  'unitFbaInventoryReimbursement',
  'unitOtherIncome'
] as const
export const AD_ATTR_FIELDS = [
  'adSales',
  'adQty',
  'organicQty',
  'offsiteQty',
  'adQtyRate',
  'adAcos'
] as const
export const PRODUCT_BASIC_FIELDS = ['category', 'brand', 'store', 'owner', 'country'] as const

/** 不可排序：交互列 / 链接列 / 尚未接入宽表的广告归因列 */
const NON_SORTABLE_PROPS = new Set([
  'trend',
  'image',
  'analysis',
  'analyze',
  'breakdown',
  'adSales',
  'adQty',
  'organicQty',
  'offsiteQty',
  'adQtyRate',
  'adAcos'
])

/** 时间与日期列（无 FIELD_META 或非数值 fmt） */
const TIME_SORTABLE_PROPS = new Set(['date', 'orderTime', 'payTime', 'shipTime', 'settleTime'])

/** 配置列可排序：数值/环比指标 + 时间列；排除图片/拆解/未接广告归因。 */
export const isSortableProp = (prop: string): boolean => {
  if (!prop || NON_SORTABLE_PROPS.has(prop)) return false
  if (TIME_SORTABLE_PROPS.has(prop)) return true
  const meta = FIELD_META[prop]
  return Boolean(
    meta &&
      (meta.fmt === 'money' || meta.fmt === 'percent' || meta.fmt === 'int' || meta.fmt === 'wow')
  )
}

/** @deprecated 保留兼容；新逻辑请用 {@link isSortableProp} */
export const SORTABLE_PROPS = new Set([
  ...TIME_SORTABLE_PROPS,
  ...Object.keys(FIELD_META).filter((prop) => isSortableProp(prop))
])

const EMPTY = '-'
// 金额格式化随当前币种符号（$ / ¥）；数值由后端按 exchange_rate 换算
const money = (v: number): string => formatMoney(v)
const intFmt = (v: number): string => Math.round(v).toLocaleString('en-US')
const pct = (v: number): string => formatPercent(v)
const wowFmt = (v: number | null): string =>
  v === null || v === undefined ? EMPTY : formatPercent(v, { showPlus: true })

/** 指标单元格纯文本（供 ElTable formatter 使用） */
export const formatFieldValue = (prop: string, val: any): string => {
  const f = FIELD_META[prop]
  if (!f) return val ?? EMPTY
  if (val === null || val === undefined) return EMPTY
  switch (f.fmt) {
    case 'money':
      return money(toDisplayAmount(prop, Number(val)))
    case 'percent':
      return pct(Number(val))
    case 'int':
      return intFmt(Number(val))
    case 'wow':
      return wowFmt(val === null ? null : Number(val))
    default:
      return String(val)
  }
}

/**
 * 非下钻数值列补的右内边距类：宽度等于下钻列单元格内的 ▾ 槽（10px 图标 + 4px 间距），
 * 让两类列的数字落在同一条右边缘上。ElTable 的合计行同样会应用 column.className。
 */
export const NUM_PAD_CLASS = 'dt-num-pad'

/** 按中文表头估算列宽：max(118, 字数×14 + 24) */
export const metricMinWidthByLabel = (label: string): number =>
  Math.max(118, Array.from(label || '').length * 14 + 24)

/** 表头问号 icon 占位（icon + 间距）：带气泡的列在估宽时补上，避免表头折行 */
const TIP_ICON_WIDTH = 18

/**
 * 指标列工厂：
 * - 普通金额/数量 → formatter（减少 Vue slot 节点）
 * - 下钻 / 环比着色 / margin / trend / 广告标签 → 保留 useSlot
 */
export const metricCol = (
  prop: string,
  group: string,
  opts: { checked?: boolean; width?: number; slot?: string; label?: string } = {}
): ColumnOption => {
  const explicitSlot =
    opts.slot || (prop === 'margin' ? 'margin' : prop === 'trend' ? 'trend' : undefined)
  const hasChevSlot = isDrilldownProp(prop)
  const needSlot = Boolean(explicitSlot) || hasChevSlot || FIELD_META[prop]?.color === 'wow'
  const label = opts.label || FIELD_LABEL[prop] || prop
  const tip = FIELD_TIP[prop]

  const base: ColumnOption = {
    prop,
    label,
    group,
    ...(tip ? { headerTip: tip } : {}),
    minWidth: opts.width || metricMinWidthByLabel(label) + (tip ? TIP_ICON_WIDTH : 0),
    align: 'right',
    checked: opts.checked !== false,
    // custom：排序走接口参数（对齐 sku-cost 可售天数），不在前端本地排
    sortable: (isSortableProp(prop) ? 'custom' : false) as ColumnOption['sortable']
  }

  if (needSlot) {
    return {
      ...base,
      ...(hasChevSlot ? {} : { className: NUM_PAD_CLASS }),
      useSlot: true,
      slotName: explicitSlot || 'cell'
    }
  }

  return {
    ...base,
    className: `dt-cell ${NUM_PAD_CLASS}`,
    formatter: (row: any) => formatFieldValue(prop, row?.[prop])
  }
}

/** 维度/基础信息列工厂（左对齐；可固定、可树展开） */
export const idCol = (
  prop: string,
  opts: {
    group?: string
    checked?: boolean
    width?: number
    fixed?: boolean | 'left' | 'right'
    hideInSetting?: boolean
    /** 树展开列：用 treeCell 插槽 */
    tree?: boolean
    slot?: string
  } = {}
): ColumnOption => ({
  prop,
  label: FIELD_LABEL[prop] || prop,
  group: opts.group,
  width: opts.width || (prop === 'image' ? 72 : prop === 'orderNo' ? 210 : 140),
  minWidth: opts.width || 100,
  align: 'left',
  fixed: opts.fixed ?? 'left',
  checked: opts.checked !== false,
  hideInSetting: opts.hideInSetting,
  sortable: (isSortableProp(prop) ? 'custom' : false) as ColumnOption['sortable'],
  useSlot: true,
  slotName: opts.slot || (opts.tree ? 'treeCell' : 'text')
})

/** 批量生成指标列 */
export const metricCols = (
  props: readonly string[],
  group: string,
  opts: { checked?: boolean; slot?: (prop: string) => string | undefined } = {}
): ColumnOption[] =>
  props.map((prop) =>
    metricCol(prop, group, {
      checked: opts.checked,
      slot: opts.slot?.(prop),
      width: prop === 'trend' ? 100 : undefined
    })
  )
