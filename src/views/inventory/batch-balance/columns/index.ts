/**
 * 批次结存列集：
 * - 批次明细：四个维度 Tab 共用一个工厂，靠 tab 增删列
 * - 按本地SKU+仓库汇总：展开下钻到组内批次
 * 消耗流水已并入批次台账抽屉，明细主表不再提供展开行。
 */
import type { ColumnOption } from '@/types/component'
import type { BatchTab } from '../utils/types'
import { idCol, metricCol } from './shared'

export function buildBatchColumns(tab: BatchTab): ColumnOption[] {
  const isTransit = tab === 'inTransit'
  const isExhausted = tab === 'exhausted'

  // 左固定列连续排在最前，否则 ElTable 把 fixed 列提前渲染后，分组彩条会与列错位。
  const cols: ColumnOption[] = [
    idCol('batchNo', {
      fixed: 'left',
      group: 'basic',
      width: 168,
      slot: 'batchNo',
      hideInSetting: true
    }),
    idCol('localSku', {
      fixed: 'left',
      group: 'basic',
      width: 152,
      slot: 'localSku',
      hideInSetting: true
    }),
    idCol('batchType', {
      group: 'basic',
      width: 110,
      checked: false,
      fixed: false,
      slot: 'batchType'
    }),
    idCol('invAttr', { group: 'basic', width: 88, fixed: false, slot: 'invAttr' }),
    idCol('batchId', { group: 'basic', width: 108, checked: false, fixed: false }),
    idCol('companyName', { group: 'owner', width: 150, checked: false, fixed: false }),
    idCol('platform', {
      group: 'owner',
      width: 88,
      checked: true,
      fixed: false,
      slot: 'platform'
    }),
    idCol('warehouseName', { group: 'owner', width: 148, fixed: false, slot: 'warehouse' }),
    idCol('msku', { group: 'owner', width: 155, checked: false, fixed: false, slot: 'dash' }),
    idCol('asin', { group: 'owner', width: 120, checked: false, fixed: false, slot: 'dash' })
  ]

  cols.push(metricCol('shippedQty', 'qty', { width: 100 }))

  if (!isTransit) {
    cols.push(
      metricCol('receivedQty', 'qty', { width: 100 }),
      metricCol('consumedQty', 'qty', { checked: true, width: 104 }),
      metricCol('balanceQty', 'qty', { width: 106, className: 'is-emphasis-column' })
    )
  }

  cols.push(
    metricCol('purchasePrice', 'cost', { width: 110 }),
    metricCol('logisticsPrice', 'cost', { width: 110 }),
    metricCol('unitTotalCost', 'cost', { width: 116 })
  )

  if (!isTransit) {
    cols.push(
      metricCol('balanceTotalAmount', 'cost', { slot: 'costDrill', width: 118 }),
      metricCol('balancePurchaseAmount', 'cost', { checked: false, width: 128 }),
      metricCol('balanceLogisticsAmount', 'cost', { checked: false, width: 128 }),
      metricCol('consumedAmount', 'cost', { checked: isExhausted, width: 116 })
    )
  }

  cols.push(idCol('shipTime', { group: 'time', width: 120, checked: isTransit, fixed: false }))
  if (!isTransit) {
    cols.push(
      idCol('inboundDate', { group: 'time', width: 130, fixed: false }),
      idCol('lastConsumeDate', {
        group: 'time',
        width: 118,
        checked: true,
        fixed: false
      })
    )
  }

  cols.push(
    idCol('parentBatchNo', {
      group: 'trace',
      width: 190,
      checked: false,
      fixed: false,
      slot: 'trace'
    }),
    idCol('rootBatchNo', {
      group: 'trace',
      width: 190,
      checked: false,
      fixed: false,
      slot: 'trace'
    }),
    idCol('platformDocNo', {
      group: 'trace',
      width: 150,
      checked: isTransit,
      fixed: false,
      slot: 'trace'
    }),
    idCol('purchaseDetailId', {
      group: 'trace',
      width: 130,
      checked: false,
      fixed: false,
      slot: 'trace'
    }),
    idCol('logisticsDetailId', {
      group: 'trace',
      width: 130,
      checked: false,
      fixed: false,
      slot: 'trace'
    })
  )

  // 状态列放在最后（操作列之前）
  cols.push(
    idCol('stockStatus', {
      group: 'status',
      width: 92,
      checked: tab === 'all',
      fixed: false,
      slot: 'stockStatus'
    })
  )
  if (!isTransit) {
    cols.push(
      idCol('consumeStatus', { group: 'status', width: 100, fixed: false, slot: 'consumeStatus' }),
      metricCol('ageDays', 'status', { checked: !isExhausted, slot: 'ageDays', width: 106 })
    )
  } else {
    cols.push(metricCol('transitDays', 'status', { slot: 'transitDays', width: 106 }))
  }

  cols.push({
    prop: 'operation',
    label: '操作',
    width: 86,
    fixed: 'right',
    align: 'left',
    checked: true,
    hideInSetting: true,
    useSlot: true,
    slotName: 'operation'
  })

  return cols
}

/** 按本地SKU + 仓库汇总列；展开行下钻组内批次明细 */
export function buildSummaryColumns(tab: BatchTab): ColumnOption[] {
  const isTransit = tab === 'inTransit'
  const isExhausted = tab === 'exhausted'

  const cols: ColumnOption[] = [
    {
      type: 'expand',
      width: 46,
      fixed: 'left',
      checked: true,
      hideInSetting: true
    },
    idCol('localSku', {
      fixed: 'left',
      group: 'basic',
      width: 152,
      slot: 'localSku',
      hideInSetting: true
    }),
    idCol('warehouseName', {
      fixed: 'left',
      group: 'owner',
      width: 148,
      slot: 'warehouse',
      hideInSetting: true
    }),
    idCol('platform', {
      group: 'owner',
      width: 88,
      checked: true,
      fixed: false,
      slot: 'platform'
    }),
    idCol('companyName', { group: 'owner', width: 180, checked: false, fixed: false })
  ]

  cols.push(metricCol('shippedQty', 'qty'))

  if (!isTransit) {
    cols.push(
      metricCol('receivedQty', 'qty', { width: 100 }),
      metricCol('consumedQty', 'qty', { checked: true, width: 104 }),
      metricCol('balanceQty', 'qty', { width: 106, className: 'is-emphasis-column' }),
      metricCol('goodQty', 'qty', { width: 106 }),
      metricCol('defectiveQty', 'qty', { checked: false }),
      metricCol('overAgeQty', 'qty', { checked: !isExhausted, slot: 'overAgeQty' })
    )
  }

  if (!isTransit) {
    cols.push(
      metricCol('balanceTotalAmount', 'cost', { slot: 'costDrill' }),
      metricCol('avgUnitCost', 'cost', { slot: 'costDrill' }),
      metricCol('consumingBatchCost', 'cost', {
        checked: !isExhausted,
        slot: 'consumingBatchCost'
      }),
      metricCol('latestPurchaseLogisticsCost', 'cost', {
        slot: 'costDrill'
      }),
      metricCol('balancePurchaseAmount', 'cost', { checked: false }),
      metricCol('balanceLogisticsAmount', 'cost', { checked: false })
    )
  } else {
    cols.push(metricCol('avgUnitCost', 'cost', { slot: 'costDrill' }))
  }

  if (!isTransit) {
    cols.push(
      idCol('earliestInboundDate', { group: 'time', width: 120, fixed: false }),
      idCol('latestInboundDate', {
        group: 'time',
        width: 120,
        checked: !isExhausted,
        fixed: false
      })
    )
  }

  // 状态列放在最后
  cols.push(
    metricCol('batchCnt', 'status', { width: 96 }),
    metricCol('availableBatchCnt', 'status', {
      checked: !isTransit,
      slot: 'availableBatchCnt'
    }),
    metricCol('estimatedBatchCnt', 'status', { checked: false }),
    metricCol('exceptionBatchCnt', 'status', { checked: false, slot: 'exceptionBatchCnt' })
  )

  return cols
}
