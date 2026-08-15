/**
 * 主表列集：数量 / 成本两种口径靠增删列实现。
 * ArtTableGroup 只提供分组彩条，不支持折叠列组，因此不要指望在表头里收起某一组。
 */
import type { ColumnOption } from '@/types/component'
import { BIZ_GROUPS, type BizGroup, type FlowDim, type FlowMeasure } from '../utils/types'
import { BIZ_GROUP_KEY, BIZ_GROUP_LABEL, idCol, metricCol } from './shared'

interface BuildOptions {
  measure: FlowMeasure
  dim: FlowDim
  dateGrain?: 'day' | 'week' | 'month'
  /** 勾选了业务类型时只保留对应列组，期初期末恒显示 */
  bizFilter?: string[]
}

/**
 * 一个业务组只占一列：数量口径给净数量，成本口径给总成本。
 * 二级出入库类型收在单元格的 ▾ 三级下钻里，不再作为列；
 * 采购、物流仍保留为可选列，需要独立成列排序或导出时在列设置里勾出来。
 *
 * 表头直接写业务名，具体口径由工具条统一控制。
 */
function bizCols(biz: BizGroup, measure: FlowMeasure): ColumnOption[] {
  const cols: ColumnOption[] = []
  const name = BIZ_GROUP_LABEL[biz]
  // 六类业务同属一个分组，列名必须自带业务名，否则列设置里会出现六个「采购成本」
  if (measure === 'qty') {
    cols.push(metricCol(`${biz}Qty`, BIZ_GROUP_KEY, { slot: 'bizQty', label: name, width: 104 }))
  }
  if (measure === 'cost') {
    cols.push(
      metricCol(`${biz}TotalAmount`, BIZ_GROUP_KEY, {
        slot: 'costDrill',
        label: name,
        width: 118
      }),
      metricCol(`${biz}PurchaseAmount`, BIZ_GROUP_KEY, {
        checked: false,
        label: `${name}采购成本`,
        width: 128
      }),
      metricCol(`${biz}LogisticsAmount`, BIZ_GROUP_KEY, {
        checked: false,
        label: `${name}物流成本`,
        width: 128
      })
    )
  }
  return cols
}

export function buildFlowColumns(opts: BuildOptions): ColumnOption[] {
  const { measure, dim, dateGrain = 'day', bizFilter } = opts
  const showQty = measure === 'qty'
  const showCost = measure === 'cost'

  // 展开列压到 1px 并藏掉箭头：展开由右侧操作列的「明细」触发，表中间不再插一列箭头
  const cols: ColumnOption[] = [
    {
      type: 'expand',
      width: 1,
      fixed: 'left',
      className: 'inv-expand-col',
      hideInSetting: true,
      checked: true
    },
    idCol('invDate', {
      fixed: 'left',
      group: 'basic',
      width: dateGrain === 'week' ? 168 : 100,
      hideInSetting: true,
      slot: 'inventoryPeriod',
      label: dateGrain === 'month' ? '库存月份' : dateGrain === 'week' ? '库存周' : '库存日期'
    }),
    idCol('storeName', { group: 'basic', width: 138, checked: dim === 'store', slot: 'store' }),
    idCol('warehouseName', { group: 'basic', width: 150, fixed: 'left', slot: 'warehouse' })
  ]

  if (dim !== 'warehouse' && dim !== 'store') {
    cols.push(
      idCol(dim === 'asin' ? 'asin' : dim === 'localSku' ? 'localSku' : 'msku', {
        fixed: 'left',
        group: 'basic',
        width: 174,
        hideInSetting: true,
        slot: 'product'
      })
    )
  }
  cols.push(
    idCol('invAttr', { group: 'basic', width: 88, fixed: false, slot: 'invAttr' }),
    idCol('genMode', { group: 'basic', width: 100, checked: false, fixed: false, slot: 'genMode' })
  )

  // 期初：与业务组同构，总成本带 ▾，采购 / 物流默认收起
  const openingLabel = '期初'
  if (showQty) cols.push(metricCol('openingQty', 'opening', { label: openingLabel, width: 104 }))
  if (showCost) {
    cols.push(
      metricCol('openingTotalAmount', 'opening', {
        slot: 'costDrill',
        label: openingLabel,
        width: 118
      }),
      metricCol('openingPurchaseAmount', 'opening', { checked: false, width: 128 }),
      metricCol('openingLogisticsAmount', 'opening', { checked: false, width: 128 })
    )
  }

  // 六类业务
  BIZ_GROUPS.forEach((biz) => {
    if (bizFilter?.length && !bizFilter.includes(biz)) return
    cols.push(...bizCols(biz, measure))
  })

  // 期末
  const closingLabel = '期末'
  if (showQty) {
    cols.push(
      metricCol('closingQty', 'closing', {
        label: closingLabel,
        width: 104,
        className: 'is-emphasis-column'
      })
    )
  }
  if (showCost) {
    cols.push(
      metricCol('closingTotalAmount', 'closing', {
        slot: 'costDrill',
        label: closingLabel,
        width: 118,
        className: 'is-emphasis-column'
      }),
      metricCol('closingPurchaseAmount', 'closing', {
        checked: false,
        width: 128,
        className: 'is-emphasis-column'
      }),
      metricCol('closingLogisticsAmount', 'closing', {
        checked: false,
        width: 128,
        className: 'is-emphasis-column'
      })
    )
  }

  // 数量勾稽差异默认展示，金额差异按需在列设置中打开
  cols.push(
    metricCol('diffQty', 'check', { slot: 'diff', checked: true, width: 120 }),
    metricCol('diffAmount', 'check', { slot: 'diff', checked: false, width: 116 })
  )

  // 展开与抽屉两个入口统一固定在右侧
  cols.push({
    prop: 'operation',
    label: '操作',
    width: 112,
    fixed: 'right',
    align: 'left',
    checked: true,
    hideInSetting: true,
    useSlot: true,
    slotName: 'operation'
  })

  return cols
}
