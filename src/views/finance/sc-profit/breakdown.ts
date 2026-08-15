export interface BreakdownItem {
  name: string
  amount: number
}

export interface WaterfallStep {
  name: string
  value: number
  total?: boolean
}

const amount = (row: Record<string, any>, key: string): number => Number(row[key] || 0)

/** 平台支出展示顺序与 PRD V1.5 一致。 */
export const buildPlatformExpenseItems = (row: Record<string, any>): BreakdownItem[] => [
  { name: '平台佣金', amount: amount(row, 'referral') },
  { name: 'FBA配送费', amount: amount(row, 'fba') },
  { name: '促销折扣', amount: amount(row, 'promoDiscount') },
  { name: '退货退款', amount: amount(row, 'refundTotal') },
  { name: '广告费用', amount: amount(row, 'ad') },
  { name: '推广费', amount: amount(row, 'promoFee') },
  { name: '测评费用', amount: amount(row, 'testFee') },
  { name: '仓储费', amount: amount(row, 'storageFee') },
  { name: 'FBA操作费', amount: amount(row, 'fbaFulfillmentFee') },
  { name: '平台其他费用', amount: amount(row, 'platformOtherFee') }
]

export const buildCostFactors = (row: Record<string, any>): BreakdownItem[] => [
  ...buildPlatformExpenseItems(row).map((item) => ({ ...item })),
  { name: '采购成本', amount: amount(row, 'purchase') },
  { name: '头程成本', amount: amount(row, 'head') }
]

/** 15 根瀑布柱：平台收入 + 10 项平台支出 + 2 项库存成本 + 其他收入 + 利润。 */
export const buildWaterfallSteps = (row: Record<string, any>): WaterfallStep[] => {
  const platformIncome = amount(row, 'sales') + amount(row, 'buyerShipping')
  const platformOtherIncome = amount(row, 'fbaInventoryReimbursement') + amount(row, 'otherIncome')
  return [
    { name: '平台收入', value: platformIncome, total: true },
    ...buildPlatformExpenseItems(row).map((item) => ({
      name: item.name,
      value: item.amount
    })),
    { name: '采购成本', value: -Math.abs(amount(row, 'purchase')) },
    { name: '头程成本', value: -Math.abs(amount(row, 'head')) },
    { name: '平台其他收入', value: platformOtherIncome },
    { name: '利润额', value: amount(row, 'profit'), total: true }
  ]
}
