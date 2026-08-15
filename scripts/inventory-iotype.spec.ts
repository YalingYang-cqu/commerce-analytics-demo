import { test, expect } from 'vitest'
import { costFlowList, invFlowDetail } from '../src/mock/data/inventory-cost'
import { BIZ_IO_TREE, IO_TYPE_PARENT } from '../src/views/inventory/utils/dict'

const rows = (costFlowList({ currentPage: 1, pageSize: 100 }) as any).records as any[]

const BIZ_FIELD: Record<string, string> = {
  RECEIPT: 'receiptQty',
  SALE_OUT: 'saleOutQty',
  SALE_RETURN: 'saleReturnQty',
  REMOVAL: 'removalQty',
  STOCKTAKE: 'stocktakeQty',
  OTHER_ADJUST: 'otherAdjustQty'
}

/** 二级出入库类型 → 主表上对应的拆分字段（没有拆分字段的子类不参与逐项核对） */
const SUB_FIELD: Record<string, string> = {
  RECEIPT_FIRST: 'receiptFirstQty',
  RECEIPT_DIFF: 'receiptDiffQty',
  RECEIPT_SUPPLEMENT: 'receiptSupplementQty',
  RECEIPT_NO_SOURCE: 'receiptNoSourceQty',
  SALE_RETURN_SOURCED: 'saleReturnSourcedQty',
  SALE_RETURN_UNSOURCED: 'saleReturnUnsourcedQty',
  STOCKTAKE_IN: 'stocktakeInQty',
  STOCKTAKE_OUT: 'stocktakeOutQty',
  OTHER_ADJUST_IN: 'otherAdjustInQty',
  OTHER_ADJUST_OUT: 'otherAdjustOutQty'
}

test('每条库存流水都挂在字典里的二级出入库类型上', () => {
  rows.forEach((row) => {
    const flows = (invFlowDetail({ rowKey: row.rowKey }) as any).records as any[]
    flows.forEach((f) => {
      expect(IO_TYPE_PARENT[f.ioType], `未知二级类型 ${f.ioType}`).toBe(f.bizType)
    })
  })
})

test('一级与二级的数量都能和主表对上', () => {
  rows.forEach((row) => {
    const flows = (invFlowDetail({ rowKey: row.rowKey }) as any).records as any[]
    const byBiz = new Map<string, number>()
    const bySub = new Map<string, number>()
    flows.forEach((f) => {
      byBiz.set(f.bizType, (byBiz.get(f.bizType) || 0) + f.changeQty)
      bySub.set(f.ioType, (bySub.get(f.ioType) || 0) + f.changeQty)
    })
    Object.entries(BIZ_FIELD).forEach(([biz, field]) => {
      expect(byBiz.get(biz) || 0, `${row.rowKey} ${biz}`).toBe(row[field])
    })
    Object.entries(SUB_FIELD).forEach(([code, field]) => {
      expect(bySub.get(code) || 0, `${row.rowKey} ${code}`).toBe(row[field])
    })
    const net = flows.reduce((s, f) => s + f.changeQty, 0)
    expect(row.openingQty + net, `${row.rowKey} 期初+变动=期末`).toBe(row.closingQty)
  })
})

test('按二级出入库类型筛选时明细只留选中的类型', () => {
  const receiptChildren = BIZ_IO_TREE.find((n) => n.value === 'RECEIPT')!.children.map(
    (c) => c.value
  )
  const target = rows.find(
    (r) => (invFlowDetail({ rowKey: r.rowKey }) as any).records.length > 2 && r.receiptQty !== 0
  )
  expect(target).toBeTruthy()

  const filtered = (invFlowDetail({ rowKey: target.rowKey, ioTypeList: ['RECEIPT_FIRST'] }) as any)
    .records as any[]
  expect(filtered.length).toBeGreaterThan(0)
  expect(filtered.every((f) => f.ioType === 'RECEIPT_FIRST')).toBe(true)

  const byParent = (invFlowDetail({ rowKey: target.rowKey, ioTypeList: receiptChildren }) as any)
    .records as any[]
  expect(byParent.every((f) => f.bizType === 'RECEIPT')).toBe(true)
  expect(byParent.reduce((s, f) => s + f.changeQty, 0)).toBe(target.receiptQty)
})
