/** 成本中心两个板块共用的枚举与配色（对齐《库存成本流转业务方案》第四章批次类型定义） */

export type BatchType = 'BT' | 'DT' | 'RB' | 'AB' | 'NB' | 'PV'

export interface BatchTypeMeta {
  value: BatchType
  label: string
  color: string
  /** 是否保留采购 / 物流成本溯源 */
  traceable: boolean
  tip: string
}

export const BATCH_TYPES: BatchTypeMeta[] = [
  {
    value: 'BT',
    label: '采购物流批次',
    color: '#5D87FF',
    traceable: true,
    tip: '头程物流发货生成，单价来自采购明细与物流明细'
  },
  {
    value: 'DT',
    label: '调拨派生批次',
    color: '#13DEB9',
    traceable: true,
    tip: '调拨出库派生，继承父批次单价，保留父/根批次'
  },
  {
    value: 'RB',
    label: '退回入库批次',
    color: '#ea580c',
    traceable: false,
    tip: '买家退货 / 移除退回生成，单价取原订单回冲价'
  },
  {
    value: 'AB',
    label: '调整入库批次',
    color: '#a855f7',
    traceable: false,
    tip: '盘盈等调整入库生成，单价取前一日同属性结存加权单价'
  },
  {
    value: 'NB',
    label: '无源签收批次',
    color: '#FFAE1F',
    traceable: false,
    tip: '有签收无发货来源，单价按兜底规则取值'
  },
  {
    value: 'PV',
    label: '负库存暂估批次',
    color: '#FF4D4F',
    traceable: false,
    tip: '负库存兜底暂估，成本确定后需重算'
  }
]

export const BATCH_TYPE_MAP = new Map(BATCH_TYPES.map((t) => [t.value, t]))

export const STOCK_STATUS_MAP: Record<
  string,
  { label: string; type: 'info' | 'primary' | 'success' | 'warning' | 'danger' }
> = {
  IN_TRANSIT: { label: '在途', type: 'info' },
  IN_STOCK: { label: '在仓', type: 'primary' },
  CLOSED: { label: '已关闭', type: 'info' }
}

export const CONSUME_STATUS_MAP: Record<
  string,
  { label: string; type: 'info' | 'primary' | 'success' | 'warning' | 'danger' }
> = {
  PENDING: { label: '待消耗', type: 'info' },
  CONSUMING: { label: '消耗中', type: 'warning' },
  EXHAUSTED: { label: '已耗尽', type: 'success' }
}

export const INV_ATTR_MAP: Record<string, { label: string; type: 'success' | 'danger' }> = {
  GOOD: { label: '良品', type: 'success' },
  DEFECTIVE: { label: '次品', type: 'danger' }
}

export const BIZ_TYPE_MAP: Record<string, string> = {
  RECEIPT: '货件入库',
  SALE_OUT: '销售出库',
  SALE_RETURN: '销售退货',
  REMOVAL: '移除出库',
  STOCKTAKE: '库存盘点',
  OTHER_ADJUST: '其他调整'
}

export interface BizIoNode {
  value: string
  label: string
  children: { value: string; label: string }[]
}

/**
 * 一级业务类型 → 二级出入库类型。**全站唯一一份**：业务类型筛选的两级勾选、
 * 流水明细「一级-二级」的取值、单元格 ▾ 下钻的子类都从这里取，
 * 否则筛选里能选到的类型和明细里显示的类型会对不上。
 */
export const BIZ_IO_TREE: BizIoNode[] = [
  {
    value: 'RECEIPT',
    label: '货件入库',
    children: [
      { value: 'RECEIPT_FIRST', label: '首次签收' },
      { value: 'RECEIPT_DIFF', label: '调差签收' },
      { value: 'RECEIPT_SUPPLEMENT', label: '补签调整' },
      { value: 'RECEIPT_NO_SOURCE', label: '无源签收' }
    ]
  },
  {
    value: 'SALE_OUT',
    label: '销售出库',
    children: [
      { value: 'SALE_OUT_SHIP', label: '销售发货出库' },
      { value: 'SALE_OUT_REVERSE', label: '销售出库冲回' }
    ]
  },
  {
    value: 'SALE_RETURN',
    label: '销售退货',
    children: [
      { value: 'SALE_RETURN_SOURCED', label: 'FBA有源销售退货' },
      { value: 'SALE_RETURN_UNSOURCED', label: 'FBA无源销售退货' }
    ]
  },
  {
    value: 'REMOVAL',
    label: '移除出库',
    children: [
      { value: 'REMOVAL_DISPOSE', label: '移除弃置出库' },
      { value: 'REMOVAL_WITHDRAW', label: '移除撤回' }
    ]
  },
  {
    value: 'STOCKTAKE',
    label: '库存盘点',
    children: [
      { value: 'STOCKTAKE_IN', label: '盘点入库' },
      { value: 'STOCKTAKE_OUT', label: '盘点出库' }
    ]
  },
  {
    value: 'OTHER_ADJUST',
    label: '其他调整',
    children: [
      { value: 'OTHER_ADJUST_IN', label: '其他调整入库' },
      { value: 'OTHER_ADJUST_OUT', label: '其他调整出库' }
    ]
  }
]

export const IO_TYPE_LABEL: Record<string, string> = Object.fromEntries(
  BIZ_IO_TREE.flatMap((node) => node.children.map((child) => [child.value, child.label]))
)

/** 二级出入库类型 → 所属一级业务类型 */
export const IO_TYPE_PARENT: Record<string, string> = Object.fromEntries(
  BIZ_IO_TREE.flatMap((node) => node.children.map((child) => [child.value, node.value]))
)

/** 流水明细里业务类型列的取值：一级-二级，如「货件入库-首次签收」 */
export const bizIoText = (bizType: string, ioType?: string): string => {
  const first = BIZ_TYPE_MAP[bizType] || bizType
  const second = ioType ? IO_TYPE_LABEL[ioType] || ioType : ''
  return second ? `${first}-${second}` : first
}

export const GEN_MODE_MAP: Record<string, { label: string; type: 'info' | 'warning' | 'success' }> =
  {
    DETAIL: { label: '报告明细', type: 'success' },
    AGGREGATE: { label: '报告聚合', type: 'info' },
    SYSTEM_DIFF: { label: '系统轧差', type: 'warning' }
  }

export const PLATFORM_OPTIONS = [
  { value: '', label: '全部平台' },
  { value: 'FBA', label: '亚马逊 FBA' },
  { value: 'OVERSEA', label: '海外仓' },
  { value: 'VC', label: 'VC 虚拟仓' }
]

export const INV_ATTR_OPTIONS = [
  { value: '', label: '全部属性' },
  { value: 'GOOD', label: '良品' },
  { value: 'DEFECTIVE', label: '次品' }
]

/** 库龄 / 在途天数预警阈值（天） */
export const AGE_WARN_DAYS = 90
export const TRANSIT_WARN_DAYS = 45
