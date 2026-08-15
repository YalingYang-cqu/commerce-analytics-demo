import type { ColumnOption } from '@/types/component'
import type { OrderProfitDetailQuery } from '@/api/finance/sc-profit'

export const ORDER_PROFIT_EXPORT_MAX_ROWS = 20000

/** 图片、趋势及操作列只有页面交互含义，不进入 Excel。 */
const NON_EXPORTABLE_PROPS = new Set(['image', 'trend', 'analysis', 'analyze', 'breakdown'])

/** 按页面当前可见顺序生成导出字段。 */
export const resolveExportColumns = (columns: ColumnOption[]): string[] =>
  columns
    .filter(
      (column) => column.checked !== false && !(column as ColumnOption & { hide?: boolean }).hide
    )
    .map((column) => column.prop)
    .filter((prop): prop is string => Boolean(prop) && !NON_EXPORTABLE_PROPS.has(prop as string))

/** 保留页面筛选/排序，只替换导出专属的分页、层级与列参数。 */
export const buildOrderProfitExportQuery = (
  query: OrderProfitDetailQuery,
  columns: ColumnOption[]
): OrderProfitDetailQuery => ({
  ...query,
  pageNo: 1,
  pageSize: ORDER_PROFIT_EXPORT_MAX_ROWS,
  hasCount: false,
  withChildren: false,
  columns: resolveExportColumns(columns)
})

/**
 * 导出前行数门禁：超过阈值直接抛错，避免创建永远跑不完的异步任务。
 * @returns 通过时返回 true（便于单测断言）
 */
export const assertOrderProfitExportWithinLimit = (total: number): true => {
  const n = Number(total) || 0
  if (n > ORDER_PROFIT_EXPORT_MAX_ROWS) {
    throw new Error(`导出数据超过${ORDER_PROFIT_EXPORT_MAX_ROWS}行，请缩小筛选范围后重试`)
  }
  return true
}
