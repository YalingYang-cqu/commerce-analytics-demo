/**
 * 成本列三级下钻：▾ 浮层拆采购 / 物流及占比（交互对齐库存成本流水）
 */
export interface CostDrillRow {
  label: string
  value: number
  percent?: number
  total?: boolean
}

export type CostDrillFmt = 'money' | 'price'

interface CostDrillParent {
  label: string
  fmt: CostDrillFmt
  purchaseKey: string
  logisticsKey: string
  /** 主值字段；缺省时用采购 + 物流求和 */
  totalKey?: string
}

const COST_DRILL_PARENTS: Record<string, CostDrillParent> = {
  balanceTotalAmount: {
    label: '结存总成本',
    fmt: 'money',
    purchaseKey: 'balancePurchaseAmount',
    logisticsKey: 'balanceLogisticsAmount',
    totalKey: 'balanceTotalAmount'
  },
  avgUnitCost: {
    label: '加权单位成本',
    fmt: 'price',
    purchaseKey: 'avgPurchaseUnitCost',
    logisticsKey: 'avgLogisticsUnitCost',
    totalKey: 'avgUnitCost'
  },
  consumingBatchCost: {
    label: '在售批次成本',
    fmt: 'price',
    purchaseKey: 'consumingPurchasePrice',
    logisticsKey: 'consumingLogisticsPrice',
    totalKey: 'consumingBatchCost'
  },
  latestPurchaseLogisticsCost: {
    label: '最近批次成本',
    fmt: 'price',
    purchaseKey: 'latestPurchasePrice',
    logisticsKey: 'latestLogisticsPrice',
    totalKey: 'latestPurchaseLogisticsCost'
  }
}

export const costDrillFmtOf = (prop: string): CostDrillFmt | null =>
  COST_DRILL_PARENTS[prop]?.fmt ?? null

export const costDrillLabelOf = (prop: string): string => COST_DRILL_PARENTS[prop]?.label || prop

const num = (row: Record<string, any>, key: string): number | null => {
  const v = row?.[key]
  if (v === null || v === undefined || v === '') return null
  const n = Number(v)
  return Number.isFinite(n) ? n : null
}

/** 取采购 / 物流明细；两段都缺或全 0 时返回空，调用方隐藏 ▾ */
export function getCostDrillRows(row: Record<string, any>, prop: string): CostDrillRow[] {
  const parent = COST_DRILL_PARENTS[prop]
  if (!parent) return []

  const purchase = num(row, parent.purchaseKey)
  const logistics = num(row, parent.logisticsKey)
  if (purchase === null && logistics === null) return []

  const p = purchase ?? 0
  const l = logistics ?? 0
  if (!p && !l) return []

  const total =
    parent.totalKey != null && num(row, parent.totalKey) != null
      ? (num(row, parent.totalKey) as number)
      : Math.round((p + l) * 1e6) / 1e6

  const base = Math.abs(p) + Math.abs(l)
  return [
    {
      label: '采购成本',
      value: p,
      percent: base ? Math.round((Math.abs(p) / base) * 1000) / 10 : 0
    },
    {
      label: '物流成本',
      value: l,
      percent: base ? Math.round((Math.abs(l) / base) * 1000) / 10 : 0
    },
    { label: '合计', value: total, total: true }
  ]
}

export const canCostDrill = (row: Record<string, any>, prop: string): boolean =>
  getCostDrillRows(row, prop).length > 0
