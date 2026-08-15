/** 批次结存列字典：表头文案、口径气泡、格式与着色，列定义只引 prop */
import { createColumnFactories, type FieldMeta } from '../../utils/format'

export interface ColumnGroupItem {
  key: string
  title: string
  color: string
}

export const BATCH_COLUMN_GROUPS: ColumnGroupItem[] = [
  { key: 'basic', title: '基础信息', color: '#fff' },
  { key: 'owner', title: '归属', color: '#6b7280' },
  { key: 'status', title: '状态', color: '#38C0FC' },
  { key: 'qty', title: '数量', color: '#22c55e' },
  { key: 'cost', title: '成本', color: '#ef4444' },
  { key: 'time', title: '时间', color: '#ea580c' },
  { key: 'trace', title: '溯源', color: '#14b8a6' }
]

export const FIELD_LABEL: Record<string, string> = {
  batchNo: '批次号',
  batchType: '批次类型',
  localSku: '本地SKU',
  invAttr: '库存属性',
  batchId: '批次内部ID',
  companyName: '公司主体',
  platform: '平台',
  warehouseName: '仓库',
  msku: '销售MSKU',
  asin: 'ASIN',
  stockStatus: '库存状态',
  consumeStatus: '消耗状态',
  ageDays: '库龄（天）',
  transitDays: '在途天数',
  shippedQty: '发货数量',
  receivedQty: '签收数量',
  consumedQty: '已消耗数量',
  balanceQty: '结存数量',
  goodQty: '良品结存',
  defectiveQty: '次品结存',
  purchasePrice: '采购单价',
  logisticsPrice: '物流单价',
  unitTotalCost: '单位总成本',
  avgUnitCost: '加权单位成本',
  balancePurchaseAmount: '结存采购金额',
  balanceLogisticsAmount: '结存物流金额',
  balanceTotalAmount: '结存总成本',
  consumedAmount: '已结转成本',
  batchCnt: '批次数',
  availableBatchCnt: '可售批次数',
  consumingBatchCost: '在售批次成本',
  latestPurchaseLogisticsCost: '最近批次成本',
  estimatedBatchCnt: '含暂估批次',
  exceptionBatchCnt: '异常批次',
  overAgeQty: '超90天结存',
  earliestInboundDate: '最早入仓',
  latestInboundDate: '最近入仓',
  shipTime: '发货时间',
  inboundDate: '入仓日期',
  lastConsumeDate: '最近消耗日期',
  parentBatchNo: '父批次',
  rootBatchNo: '根批次',
  platformDocNo: '平台关联单据',
  purchaseDetailId: '采购明细ID',
  logisticsDetailId: '物流明细ID',
  operation: '操作'
}

export const FIELD_TIP: Record<string, string> = {
  batchNo: '批次在签收转在仓时生成；在途批次尚无批次号',
  shippedQty: '头程发货数量。批次表不保存「在途数量」，在途 = 发货 − 签收',
  receivedQty: '累计实际签收数量，调差与补签会让它增减',
  consumedQty: '派生列 = −（签收数量 − 结存数量），出库消耗为负',
  balanceQty: '当前仍可被 FIFO 消耗的数量',
  goodQty: '组内库存属性为良品的结存数量合计',
  defectiveQty: '组内库存属性为次品的结存数量合计',
  ageDays: '派生列 = 今日 − 入仓日期，只对在仓批次有意义',
  transitDays: '派生列 = 今日 − 发货时间，超过阈值提示跟进签收',
  balanceTotalAmount: '结存采购金额 + 结存物流金额，结存为 0 时必须为 0；点击 ▾ 查看采购 / 物流及占比',
  avgUnitCost:
    'Σ（结存数量 × 单位总成本）÷ Σ 结存数量；无结存时按签收数量加权；点击 ▾ 查看采购 / 物流及占比',
  consumingBatchCost:
    '当前在售（消耗中）批次的单位总成本 = 采购单价 + 物流单价；组内多条时取最早入仓的 FIFO 头批次；点击 ▾ 查看采购 / 物流及占比',
  latestPurchaseLogisticsCost:
    '组内最近入仓批次的单位总成本 = 采购单价 + 物流单价；在途尚未入仓的批次不参与；点击 ▾ 查看采购 / 物流及占比',
  unitTotalCost: '派生列 = 采购单价 + 物流单价，保留 6 位小数',
  consumedAmount: '派生列 = 已消耗数量 × 单位总成本（与已消耗数量同号，出库为负）',
  batchCnt: '当前筛选条件下，该本地SKU + 仓库的批次数',
  availableBatchCnt: '组内结存数量 > 0 的批次数（可继续被 FIFO 消耗）',
  estimatedBatchCnt: '组内含暂估成本（PV / NB）的批次数',
  exceptionBatchCnt: '组内标红异常批次数',
  overAgeQty: '组内库龄 > 90 天且结存 > 0 的数量合计',
  earliestInboundDate: '组内最早入仓日期（在途批次不含）',
  latestInboundDate: '组内最近入仓日期（在途批次不含）',
  inboundDate: 'FIFO 首要排序字段：同仓同 SKU 同属性内按入仓日期先进先出',
  platformDocNo: '货件号 / 海外仓入库单 / VC 单号，只代表数量事件，不代表成本来源'
}

export const FIELD_META: Record<string, FieldMeta> = {
  shippedQty: { fmt: 'int' },
  receivedQty: { fmt: 'int' },
  consumedQty: { fmt: 'int', signed: true, color: 'auto' },
  balanceQty: { fmt: 'int' },
  goodQty: { fmt: 'int' },
  defectiveQty: { fmt: 'int' },
  batchCnt: { fmt: 'int' },
  availableBatchCnt: { fmt: 'int' },
  estimatedBatchCnt: { fmt: 'int' },
  exceptionBatchCnt: { fmt: 'int' },
  overAgeQty: { fmt: 'int' },
  ageDays: { fmt: 'int' },
  transitDays: { fmt: 'int' },
  purchasePrice: { fmt: 'price', color: 'cost' },
  logisticsPrice: { fmt: 'price', color: 'cost' },
  unitTotalCost: { fmt: 'price', color: 'cost' },
  avgUnitCost: { fmt: 'price', color: 'cost' },
  consumingBatchCost: { fmt: 'price', color: 'cost' },
  latestPurchaseLogisticsCost: { fmt: 'price', color: 'cost' },
  balancePurchaseAmount: { fmt: 'money', color: 'cost' },
  balanceLogisticsAmount: { fmt: 'money', color: 'cost' },
  balanceTotalAmount: { fmt: 'money', color: 'cost' },
  consumedAmount: { fmt: 'money', signed: true, color: 'auto' },
  changeQty: { fmt: 'int', color: 'auto' },
  changePurchasePrice: { fmt: 'price', color: 'cost' },
  changeLogisticsPrice: { fmt: 'price', color: 'cost' },
  changePurchaseAmount: { fmt: 'money', color: 'auto' },
  changeLogisticsAmount: { fmt: 'money', color: 'auto' },
  batchRunningQty: { fmt: 'int' },
  batchRunningAmount: { fmt: 'money', color: 'cost' }
}

/** 走接口排序的列 */
const SORTABLE = new Set([
  'balanceQty',
  'balanceTotalAmount',
  'batchCnt',
  'availableBatchCnt',
  'avgUnitCost',
  'consumingBatchCost',
  'latestPurchaseLogisticsCost',
  'overAgeQty',
  'ageDays',
  'transitDays',
  'inboundDate',
  'shipTime',
  'lastConsumeDate',
  'earliestInboundDate',
  'latestInboundDate'
])

export const { metricCol, idCol } = createColumnFactories({
  labels: FIELD_LABEL,
  tips: FIELD_TIP,
  metas: FIELD_META,
  sortable: SORTABLE
})
