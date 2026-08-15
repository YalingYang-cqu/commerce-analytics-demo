import { describe, expect, it } from 'vitest'
import { buildDetailColumns } from './index'
import { FIELD_LABEL, metricCol, metricMinWidthByLabel, UNIT_EXPENSE_FIELDS } from './shared'

describe('metricMinWidthByLabel', () => {
  it('短标签不低于 118', () => {
    expect(metricMinWidthByLabel('销量')).toBe(118)
  })

  it('长中文标签按 字数×14+24', () => {
    expect(metricMinWidthByLabel('单个FBA库存赔偿')).toBe(Math.max(118, 9 * 14 + 24))
    expect(metricMinWidthByLabel('单个平台其他费用')).toBe(Math.max(118, 8 * 14 + 24))
  })

  it('metricCol 默认用标签估算 minWidth', () => {
    const col = metricCol('unitFbaInventoryReimbursement', 'unitOther', { checked: false })
    expect(col.minWidth).toBe(metricMinWidthByLabel(FIELD_LABEL.unitFbaInventoryReimbursement))
  })
})

describe('单个平台费用列仅商品 Tab', () => {
  it('商品 Tab 含 unitFee/unitOther 且默认不勾选', () => {
    const cols = buildDetailColumns('asin')
    const unitFba = cols.find((c) => c.prop === 'unitFba')
    const unitOther = cols.find((c) => c.prop === 'unitOtherIncome')
    expect(unitFba).toMatchObject({ group: 'unitFee', checked: false })
    expect(unitOther).toMatchObject({ group: 'unitOther', checked: false })
    expect(UNIT_EXPENSE_FIELDS.every((p) => cols.some((c) => c.prop === p))).toBe(true)
  })

  it('订单与看板不含单个平台费用/其他收入列', () => {
    for (const tab of ['order', 'dashboard'] as const) {
      const props = buildDetailColumns(tab).map((c) => c.prop)
      expect(props).not.toContain('unitFba')
      expect(props).not.toContain('unitOtherIncome')
      expect(props).not.toContain('unitAdSpend')
    }
  })
})
