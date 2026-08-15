/**
 * 产品维度明细列（父ASIN / ASIN / MSKU / SPU）
 * 固定左列 + 共用指标分组；默认勾选对齐设计图 / demo DIM_COLUMN_TEMPLATES
 */
import type { ColumnOption } from '@/types/component'
import type { ColumnGroupItem, ProductDetailTab } from './types'
import {
  // AD_ATTR_FIELDS,
  COST_FIELDS,
  EXPENSE_FIELDS,
  INCOME_FIELDS,
  OTHER_INCOME_FIELDS,
  PRODUCT_BASIC_FIELDS,
  PROFIT_FIELDS,
  UNIT_COST_FIELDS,
  UNIT_EXPENSE_FIELDS,
  UNIT_OTHER_INCOME_FIELDS,
  UNIT_PROFIT_FIELDS,
  idCol,
  metricCols
} from './shared'

export const PRODUCT_COLUMN_GROUPS: ColumnGroupItem[] = [
  { key: 'basic', title: '基础信息', color: '#fff' },
  { key: 'profit', title: '利润', color: '#ef4444' },
  { key: 'unitProfit', title: '单个利润', color: '#0f9f8f' },
  { key: 'income', title: '平台收入', color: '#3b82f6' },
  { key: 'fee', title: '平台支出', color: '#eab308' },
  { key: 'unitFee', title: '单个平台支出', color: '#eab308' },
  { key: 'cost', title: '库存成本', color: '#22c55e' },
  { key: 'unitCost', title: '单个库存成本', color: '#22c55e' },
  { key: 'other', title: '平台其他收入', color: '#6b7280' },
  { key: 'unitOther', title: '单个平台其他收入', color: '#6b7280' }
  // { key: 'adattr', title: '广告归因', color: '#ea580c' }
]

/** 各 tab 固定左列（不进列设置，始终展示） */
const FIXED_LEFT: Record<ProductDetailTab, string[]> = {
  parentAsin: ['image', 'parentAsin', 'asin'],
  asin: ['image', 'asin', 'parentAsin', 'msku'],
  msku: ['image', 'asin', 'msku'],
  spu: ['image', 'spu', 'msku']
}

/**
 * 默认勾选（父ASIN / ASIN / MSKU / SPU 一致）：
 * - 基础信息默认全不勾
 * - 单个利润（综合售价/单个净利/单个广告费用/单个促销费用）默认勾选
 * - 单个支出/成本/其他收入、广告归因默认不勾
 */
const defaultChecked = (prop: string): boolean => {
  if ((PRODUCT_BASIC_FIELDS as readonly string[]).includes(prop)) {
    return false
  }
  // || (AD_ATTR_FIELDS as readonly string[]).includes(prop)
  if (
    (UNIT_EXPENSE_FIELDS as readonly string[]).includes(prop) ||
    (UNIT_COST_FIELDS as readonly string[]).includes(prop) ||
    (UNIT_OTHER_INCOME_FIELDS as readonly string[]).includes(prop)
  ) {
    return false
  }
  return true
}

// const adSlot = (prop: string): string | undefined =>
//   prop === 'adQtyRate' || prop === 'adAcos' ? 'rateTag' : undefined

export function buildProductColumns(tab: ProductDetailTab): ColumnOption[] {
  // 展开图标落在第一列「图片」；ASIN Tab 的 asin 列附带「测算」入口
  const fixed = FIXED_LEFT[tab].map((prop) =>
    idCol(prop, {
      hideInSetting: true,
      tree: prop === 'image',
      width:
        prop === 'image'
          ? 120
          : prop === 'asin' && tab === 'asin'
            ? 200
            : prop === 'msku' || prop === 'spu'
              ? 150
              : 130,
      slot: prop === 'asin' && tab === 'asin' ? 'asinAction' : undefined
    })
  )

  const basic = PRODUCT_BASIC_FIELDS.map((prop) =>
    idCol(prop, {
      group: 'basic',
      fixed: false,
      checked: defaultChecked(prop),
      width: 110
    })
  )

  return [
    ...fixed,
    ...basic,
    ...metricCols(PROFIT_FIELDS, 'profit', {
      slot: (p) => (p === 'margin' ? 'margin' : p === 'trend' ? 'trend' : undefined)
    }),
    // 单个利润：四个 Tab 均默认勾选（metricCols 默认 checked = true）
    ...metricCols(UNIT_PROFIT_FIELDS, 'unitProfit'),
    ...metricCols(INCOME_FIELDS, 'income'),
    ...metricCols(EXPENSE_FIELDS, 'fee'),
    ...metricCols(UNIT_EXPENSE_FIELDS, 'unitFee', { checked: false }),
    ...metricCols(COST_FIELDS, 'cost'),
    ...metricCols(UNIT_COST_FIELDS, 'unitCost', { checked: false }),
    ...metricCols(OTHER_INCOME_FIELDS, 'other'),
    ...metricCols(UNIT_OTHER_INCOME_FIELDS, 'unitOther', { checked: false })
    // ...metricCols(AD_ATTR_FIELDS, 'adattr', { checked: false, slot: adSlot })
  ]
}
