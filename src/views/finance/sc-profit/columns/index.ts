/**
 * Sc 订单利润·明细表列配置入口
 * 按 activeTab 返回分组色条 + 列定义；看板原样抽离，产品/订单对齐 demo
 */
import type { ColumnOption } from '@/types/component'
import type { ColumnGroupItem, ProfitDetailTab } from './types'
import { buildDashboardColumns, DASHBOARD_COLUMN_GROUPS } from './dashboard'
import { buildProductColumns, PRODUCT_COLUMN_GROUPS } from './product'
import { buildOrderColumns, ORDER_COLUMN_GROUPS } from './order'

export type { ProfitDetailTab, ProductDetailTab, ColumnGroupItem, FieldMeta } from './types'
export { FIELD_META, FIELD_LABEL, FIELD_TIP, formatFieldValue } from './shared'
export {
  isDrilldownProp,
  getDrilldownRows,
  resolveDrillParent,
  DRILLDOWN_INCOME
} from './drilldown'
export type { DrillRow } from './drilldown'

const PRODUCT_TABS = new Set<ProfitDetailTab>(['parentAsin', 'asin', 'msku', 'spu'])

export function normalizeDetailTab(tab?: string): ProfitDetailTab {
  if (tab === 'dashboard' || tab === 'order') return tab
  if (tab === 'parentAsin' || tab === 'asin' || tab === 'msku' || tab === 'spu') return tab
  // demo 里 MSKU 曾用 sku
  if (tab === 'sku') return 'msku'
  return 'dashboard'
}

export function getColumnGroups(tab: ProfitDetailTab): ColumnGroupItem[] {
  if (tab === 'dashboard') return DASHBOARD_COLUMN_GROUPS
  if (tab === 'order') return ORDER_COLUMN_GROUPS
  return PRODUCT_COLUMN_GROUPS
}

export function buildDetailColumns(tab: ProfitDetailTab): ColumnOption[] {
  if (tab === 'dashboard') return buildDashboardColumns()
  if (tab === 'order') return buildOrderColumns()
  if (PRODUCT_TABS.has(tab)) return buildProductColumns(tab)
  return buildDashboardColumns()
}

/** 汇总行首列 prop（写「汇总」文案） */
export function summaryLabelProp(tab: ProfitDetailTab): string {
  if (tab === 'dashboard') return 'date'
  if (tab === 'order') return 'orderNo'
  // 产品维度：展开在图片列，汇总也落在第一列
  return 'image'
}
