/** 库存成本流水列字典：六类业务组的列由前缀 + 后缀拼装，避免手写 30 多个字段 */
import { IO_TYPE_LABEL } from '../../utils/dict'
import { createColumnFactories, type FieldMeta } from '../../utils/format'
import { BIZ_GROUPS, type BizGroup } from '../utils/types'

export interface ColumnGroupItem {
  key: string
  title: string
  color: string
}

/** 六类业务合成一条彩条：业务名已经写在表头上了，分组条再拆六段就是同一行字读两遍 */
export const BIZ_GROUP_KEY = 'biz'

export const FLOW_COLUMN_GROUPS: ColumnGroupItem[] = [
  { key: 'basic', title: '基础信息', color: '#fff' },
  { key: 'opening', title: '期初', color: '#6b7280' },
  { key: BIZ_GROUP_KEY, title: '本期业务变动', color: '#5D87FF' },
  { key: 'closing', title: '期末', color: '#ef4444' },
  { key: 'check', title: '校验', color: '#14b8a6' }
]

export const BIZ_GROUP_LABEL: Record<BizGroup, string> = {
  receipt: '货件入库',
  saleOut: '销售出库',
  saleReturn: '销售退货',
  removal: '移除出库',
  stocktake: '库存盘点',
  otherAdjust: '其他调整'
}

export interface SubTypeItem {
  /** 二级出入库类型编码，与 BIZ_IO_TREE、流水明细的 ioType 同一套 */
  code: string
  label: string
  /** 数量口径字段 */
  qty: string
  /** 成本口径字段（总成本，与一级的总成本同口径） */
  amount: string
}

const subType = (code: string, qty: string, amount: string): SubTypeItem => ({
  code,
  label: IO_TYPE_LABEL[code] || code,
  qty,
  amount
})

/**
 * 一级业务类型下的二级出入库类型。**不再作为列出现**，只在单元格 ▾ 的下钻浮层里展开，
 * 否则打开六类业务的子类会一口气多出十来列。
 * 销售出库、移除出库在库存流水层有二级类型（见 BIZ_IO_TREE），但汇总表没有拆分字段，不给 ▾。
 */
export const SUB_TYPE_FIELDS: Partial<Record<BizGroup, SubTypeItem[]>> = {
  receipt: [
    subType('RECEIPT_FIRST', 'receiptFirstQty', 'receiptFirstAmount'),
    subType('RECEIPT_DIFF', 'receiptDiffQty', 'receiptDiffAmount'),
    subType('RECEIPT_SUPPLEMENT', 'receiptSupplementQty', 'receiptSupplementAmount'),
    subType('RECEIPT_NO_SOURCE', 'receiptNoSourceQty', 'receiptNoSourceAmount')
  ],
  saleReturn: [
    subType('SALE_RETURN_SOURCED', 'saleReturnSourcedQty', 'saleReturnSourcedAmount'),
    subType('SALE_RETURN_UNSOURCED', 'saleReturnUnsourcedQty', 'saleReturnUnsourcedAmount')
  ],
  stocktake: [
    subType('STOCKTAKE_IN', 'stocktakeInQty', 'stocktakeInAmount'),
    subType('STOCKTAKE_OUT', 'stocktakeOutQty', 'stocktakeOutAmount')
  ],
  otherAdjust: [
    subType('OTHER_ADJUST_IN', 'otherAdjustInQty', 'otherAdjustInAmount'),
    subType('OTHER_ADJUST_OUT', 'otherAdjustOutQty', 'otherAdjustOutAmount')
  ]
}

const BASE_LABEL: Record<string, string> = {
  invDate: '库存日期',
  storeName: '店铺',
  siteName: '站点',
  warehouseName: '仓库',
  msku: 'MSKU',
  localSku: '本地SKU',
  asin: 'ASIN',
  fnsku: 'FNSKU',
  invAttr: '库存属性',
  genMode: '生成方式',
  openingQty: '期初数量',
  openingPurchaseAmount: '期初采购成本',
  openingLogisticsAmount: '期初物流成本',
  openingTotalAmount: '期初总成本',
  closingQty: '期末数量',
  closingPurchaseAmount: '期末采购成本',
  closingLogisticsAmount: '期末物流成本',
  closingTotalAmount: '期末总成本',
  diffQty: '勾稽差异（数量）',
  diffAmount: '勾稽差异（金额）'
}

/** 业务组列：{biz}Qty / {biz}PurchaseAmount / {biz}LogisticsAmount / {biz}TotalAmount */
const bizLabels = (): Record<string, string> => {
  const labels: Record<string, string> = {}
  BIZ_GROUPS.forEach((biz) => {
    labels[`${biz}Qty`] = '数量'
    labels[`${biz}PurchaseAmount`] = '采购成本'
    labels[`${biz}LogisticsAmount`] = '物流成本'
    labels[`${biz}TotalAmount`] = '总成本'
  })
  return labels
}

export const FIELD_LABEL: Record<string, string> = { ...BASE_LABEL, ...bizLabels() }

export const FIELD_TIP: Record<string, string> = {
  openingQty: '合计取筛选范围内首日期初，不是逐行相加',
  closingQty: '合计取筛选范围内末日期末，不是逐行相加',
  otherAdjustQty: '只在每月 2 日跑批产生，归属上月最后一天；非月末日期恒为 0',
  diffQty: '派生列 = 期初 + 各业务变动 − 期末，正常恒为 0',
  diffAmount: '派生列 = 期初金额 + 各业务变动金额 − 期末金额，正常恒为 0',
  genMode: '报告明细 / 报告聚合 / 系统轧差，决定该行是否有平台单据可跳转'
}

const buildMetas = (): Record<string, FieldMeta> => {
  const metas: Record<string, FieldMeta> = {
    openingQty: { fmt: 'int' },
    openingPurchaseAmount: { fmt: 'money', color: 'cost' },
    openingLogisticsAmount: { fmt: 'money', color: 'cost' },
    openingTotalAmount: { fmt: 'money', color: 'cost' },
    closingQty: { fmt: 'int' },
    closingPurchaseAmount: { fmt: 'money', color: 'cost' },
    closingLogisticsAmount: { fmt: 'money', color: 'cost' },
    closingTotalAmount: { fmt: 'money', color: 'cost' },
    diffQty: { fmt: 'int', color: 'auto' },
    diffAmount: { fmt: 'money', color: 'auto' },
    changeQty: { fmt: 'int', color: 'auto' },
    beforeQty: { fmt: 'int' },
    afterQty: { fmt: 'int' },
    changePurchasePrice: { fmt: 'price', color: 'cost' },
    changeLogisticsPrice: { fmt: 'price', color: 'cost' },
    changePurchaseAmount: { fmt: 'money', color: 'auto' },
    changeLogisticsAmount: { fmt: 'money', color: 'auto' },
    changeTotalAmount: { fmt: 'money', color: 'auto' },
    mskuWarehouseQty: { fmt: 'int' },
    mskuWarehousePurchaseAmount: { fmt: 'money', color: 'cost' },
    mskuWarehouseLogisticsAmount: { fmt: 'money', color: 'cost' }
  }
  BIZ_GROUPS.forEach((biz) => {
    metas[`${biz}Qty`] = { fmt: 'int', color: 'auto' }
    metas[`${biz}PurchaseAmount`] = { fmt: 'money', color: 'auto' }
    metas[`${biz}LogisticsAmount`] = { fmt: 'money', color: 'auto' }
    metas[`${biz}TotalAmount`] = { fmt: 'money', color: 'auto' }
  })
  return metas
}

export const FIELD_META: Record<string, FieldMeta> = buildMetas()

const SORTABLE = new Set(['invDate', 'closingQty', 'closingTotalAmount', 'saleOutQty'])

export const { metricCol, idCol } = createColumnFactories({
  labels: FIELD_LABEL,
  tips: FIELD_TIP,
  metas: FIELD_META,
  sortable: SORTABLE
})
