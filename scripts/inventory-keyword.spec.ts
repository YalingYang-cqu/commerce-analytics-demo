import { test, expect } from 'vitest'
import {
  batchBalance,
  batchConsumeFlow,
  costFlowList,
  invFlowDetail,
  costFlowDetail
} from '../src/mock/data/inventory-cost'

const batchBalanceList = batchBalance

test('批次结存：单号类关键字能搜到批次', () => {
  const base: any = batchBalanceList({ tab: 'inStock', currentPage: 1, pageSize: 50 })
  const batch = base.records.find((b: any) => b.balanceQty > 0 && b.receivedQty > b.balanceQty)
  expect(batch).toBeTruthy()

  const flow: any = batchConsumeFlow({ batchId: batch.batchId, pageSize: 5 })
  const first = flow.records[0]
  expect(first).toBeTruthy()

  for (const [keywordType, keyword] of [
    ['batchNo', batch.batchNo],
    ['platformDocNo', batch.platformDocNo || batch.batchNo],
    ['bizNo', first.bizNo],
    ['invFlowNo', first.invFlowNo],
    ['costFlowNo', first.costFlowNo]
  ] as const) {
    if (!keyword) continue
    const res: any = batchBalanceList({ tab: 'all', keywordType, keyword, current: 1, size: 50 })
    expect(res.total, `${keywordType}=${keyword}`).toBeGreaterThan(0)
  }
})

test('SKU 成本流水：单号类关键字能搜到主表行', () => {
  const base: any = costFlowList({ current: 1, size: 50 })
  const row = base.records.find((r: any) => r.saleOutQty !== 0)
  expect(row).toBeTruthy()

  const flows: any = invFlowDetail({ rowKey: row.rowKey })
  const f = flows.records[0]
  expect(f).toBeTruthy()

  const cost: any = costFlowDetail({
    invFlowNo: f.invFlowNo,
    changeQty: f.changeQty,
    afterQty: f.afterQty,
    costSplitCount: f.costSplitCount,
    warehouseCode: row.warehouseCode,
    localSku: row.localSku,
    msku: row.msku,
    invDate: row.invDate
  })

  const cases: Array<[string, string]> = [
    ['msku', row.msku],
    ['invFlowNo', f.invFlowNo],
    ['costFlowNo', cost.records[0]?.costFlowNo],
    ['batchNo', cost.records[0]?.batchNo]
  ]
  if (f.bizNo) cases.push(['bizNo', f.bizNo])

  for (const [keywordType, keyword] of cases) {
    if (!keyword) continue
    const res: any = costFlowList({ keywordType, keyword, current: 1, size: 50 })
    expect(res.total, `${keywordType}=${keyword}`).toBeGreaterThan(0)
  }
})
