/**
 * 业务类型列的三级下钻（交互对齐 SC 订单利润的费用 ▾ 浮层）
 * 浮层里展开的是该一级业务类型下的**二级出入库类型**，取当前口径的值：
 * 数量口径给件数，成本口径给总成本，末行是回到父列的合计。
 */
import { BIZ_GROUPS, type BizGroup } from '../utils/types'
import { BIZ_GROUP_LABEL, SUB_TYPE_FIELDS } from './shared'

export interface DrillRow {
  label: string
  value: number
  /** 占父列的比例 */
  percent?: number
  /** 合计行：加粗并画上分隔线 */
  total?: boolean
}

export type DrillKind = 'qty' | 'cost'

interface DrillParent {
  biz: BizGroup
  kind: DrillKind
}

/** 父列 prop → 业务类型 + 口径。只有配了二级出入库类型的业务才进这张表 */
const DRILL_PARENTS = new Map<string, DrillParent>()
BIZ_GROUPS.forEach((biz) => {
  if (!SUB_TYPE_FIELDS[biz]?.length) return
  DRILL_PARENTS.set(`${biz}Qty`, { biz, kind: 'qty' })
  DRILL_PARENTS.set(`${biz}TotalAmount`, { biz, kind: 'cost' })
})

export const drillKindOf = (prop: string): DrillKind | null => DRILL_PARENTS.get(prop)?.kind ?? null

/** 下钻浮层标题用的父列名。六类业务合成一个分组后，分组标题已经认不出是哪一类了 */
export const drillParentLabel = (prop: string): string => {
  const parent = DRILL_PARENTS.get(prop)
  return parent ? BIZ_GROUP_LABEL[parent.biz] : ''
}

/**
 * 取二级出入库类型明细。全为 0 时返回空，由调用方隐藏 ▾，
 * 避免出现一个点开全是 0 的空浮层。
 */
export function getDrillRows(row: Record<string, any>, prop: string): DrillRow[] {
  const parent = DRILL_PARENTS.get(prop)
  if (!parent) return []
  const items = SUB_TYPE_FIELDS[parent.biz] || []
  const values = items.map((item) => ({
    label: item.label,
    value: Number(row?.[parent.kind === 'qty' ? item.qty : item.amount]) || 0
  }))
  if (values.every((v) => !v.value)) return []

  // 子类可能一正一负（调差签收、盘点出库…），占比用绝对值算才有意义
  const base = values.reduce((s, v) => s + Math.abs(v.value), 0)
  const rows: DrillRow[] = values.map((v) => ({
    ...v,
    percent: base ? Math.round((Math.abs(v.value) / base) * 1000) / 10 : 0
  }))
  rows.push({
    label: '合计',
    value: values.reduce((s, v) => s + v.value, 0),
    total: true
  })
  return rows
}

/** 该格是否值得给 ▾ */
export const canDrill = (row: Record<string, any>, prop: string): boolean =>
  getDrillRows(row, prop).length > 0
