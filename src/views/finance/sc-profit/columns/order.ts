/**
 * 订单维度明细列（对齐 demo ORDER_COLUMN_CONFIG_GROUPS / ORDER_DEFAULT_FIELDS）
 * 固定：订单号 / ASIN / MSKU；配置：订单信息·时间节点·利润·收入·支出·成本·其他收入
 */
import type { ColumnOption } from '@/types/component'
import type { ColumnGroupItem } from './types'
import {
  COST_FIELDS,
  EXPENSE_FIELDS,
  INCOME_FIELDS,
  OTHER_INCOME_FIELDS,
  PROFIT_FIELDS,
  idCol,
  metricCols
} from './shared'

export const ORDER_COLUMN_GROUPS: ColumnGroupItem[] = [
  { key: 'orderInfo', title: '订单信息', color: '#fff' },
  // 时间节点属辅助信息，用中性灰弱化，避免与利润/收入等业务色抢视觉
  { key: 'orderTime', title: '时间节点', color: '#909399' },
  { key: 'profit', title: '利润', color: '#ef4444' },
  { key: 'income', title: '平台收入', color: '#3b82f6' },
  { key: 'fee', title: '平台支出', color: '#eab308' },
  { key: 'cost', title: '库存成本', color: '#22c55e' },
  { key: 'other', title: '平台其他收入', color: '#6b7280' }
]

export function buildOrderColumns(): ColumnOption[] {
  return [
    // 固定左列
    idCol('orderNo', { hideInSetting: true, tree: true, width: 210 }),
    idCol('asin', { hideInSetting: true, width: 120 }),
    idCol('msku', { hideInSetting: true, width: 150 }),
    // 订单信息（列设置内）：国家默认不展示
    idCol('country', {
      group: 'orderInfo',
      fixed: false,
      checked: false,
      width: 90
    }),
    // 时间节点默认：下单/结算时间勾选；付款时间、Settlement ID 不勾选（对齐配置图）
    idCol('orderTime', {
      group: 'orderTime',
      fixed: false,
      checked: true,
      width: 150
    }),
    idCol('payTime', {
      group: 'orderTime',
      fixed: false,
      checked: false,
      width: 150
    }),
    idCol('settleTime', {
      group: 'orderTime',
      fixed: false,
      checked: true,
      width: 150
    }),
    idCol('settlementNo', {
      group: 'orderTime',
      fixed: false,
      checked: false,
      width: 140
    }),
    // 指标组
    ...metricCols(PROFIT_FIELDS, 'profit', {
      slot: (p) => (p === 'margin' ? 'margin' : p === 'trend' ? 'trend' : undefined)
    }),
    ...metricCols(INCOME_FIELDS, 'income'),
    ...metricCols(EXPENSE_FIELDS, 'fee'),
    ...metricCols(COST_FIELDS, 'cost'),
    ...metricCols(OTHER_INCOME_FIELDS, 'other')
  ]
}
