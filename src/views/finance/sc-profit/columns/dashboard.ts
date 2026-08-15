/**
 * 看板明细列配置（当前已对齐设计图，原样抽离）
 * 环比变化 / 利润 / 平台收入 / 平台支出 / 库存成本 / 平台其他收入 / 广告归因(默认不勾选)
 */
import type { ColumnOption } from '@/types/component'
import type { ColumnGroupItem } from './types'
import { metricCol } from './shared'

export const DASHBOARD_COLUMN_GROUPS: ColumnGroupItem[] = [
  { key: 'change', title: '环比变化', color: '#fff' },
  { key: 'profit', title: '利润', color: '#ef4444' },
  { key: 'income', title: '平台收入', color: '#3b82f6' },
  { key: 'fee', title: '平台支出', color: '#eab308' },
  { key: 'cost', title: '库存成本', color: '#22c55e' },
  { key: 'other', title: '平台其他收入', color: '#6b7280' }
  // { key: 'adattr', title: '广告归因', color: '#ea580c' }
]

export function buildDashboardColumns(): ColumnOption[] {
  return [
    {
      prop: 'date',
      label: '日期',
      width: 160,
      minWidth: 160,
      align: 'left',
      fixed: 'left',
      // 看板：日期固定展示，不进列配置弹窗
      hideInSetting: true,
      sortable: 'custom' as any,
      useSlot: true,
      slotName: 'treeCell'
    },
    // 环比变化
    metricCol('salesWoW', 'change'),
    metricCol('profitWoW', 'change'),
    metricCol('marginChange', 'change'),
    // 利润
    metricCol('profit', 'profit'),
    metricCol('margin', 'profit', { slot: 'margin' }),
    metricCol('trend', 'profit', { width: 100, slot: 'trend' }),
    // 平台收入
    metricCol('sales', 'income'),
    metricCol('buyerShipping', 'income'),
    metricCol('qty', 'income'),
    // 平台支出
    metricCol('referral', 'fee'),
    metricCol('fba', 'fee'),
    metricCol('promoDiscount', 'fee'),
    metricCol('refundTotal', 'fee'),
    metricCol('ad', 'fee'),
    metricCol('promoFee', 'fee'),
    metricCol('testFee', 'fee'),
    metricCol('storageFee', 'fee'),
    metricCol('fbaFulfillmentFee', 'fee'),
    metricCol('platformOtherFee', 'fee'),
    // 库存成本
    metricCol('purchase', 'cost'),
    metricCol('head', 'cost'),
    metricCol('totalCost', 'cost'),
    // 平台其他收入
    metricCol('fbaInventoryReimbursement', 'other'),
    metricCol('otherIncome', 'other')
    // 广告归因（默认不勾选）
    // metricCol('adSales', 'adattr', { checked: false }),
    // metricCol('adQty', 'adattr', { checked: false }),
    // metricCol('organicQty', 'adattr', { checked: false }),
    // metricCol('offsiteQty', 'adattr', { checked: false }),
    // metricCol('adQtyRate', 'adattr', { checked: false, slot: 'rateTag' }),
    // metricCol('adAcos', 'adattr', { checked: false, slot: 'rateTag' })
  ]
}
