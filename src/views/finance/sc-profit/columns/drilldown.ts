/**
 * 费用/收入列下拉明细（对齐 demo ORDER_FIELD_DRILLDOWN / UNIT_DRILLDOWN_PARENT）
 * 单元格旁 ▾ 展开子项合计
 */

export type DrillItem = [label: string, key: string]

/** 父字段 → 明细项 */
export const FIELD_DRILLDOWN: Record<string, DrillItem[]> = {
  refundTotal: [
    ['商品的退货退款', 'refundCost'],
    ['退货服务费', 'refundReturnFee'],
    ['高退货率商品FBA退货处理费', 'refundHighReturnFee']
  ],
  promoFee: [
    ['秒杀费用 · 基于交易绩效的费用', 'promoDealPerformanceFee'],
    ['秒杀费用 · 交易参与费用', 'promoDealParticipationFee'],
    ['优惠券参与/上架费（固定费用）', 'couponListingFee'],
    ['优惠券兑换绩效费（可变）', 'couponRedemptionFee'],
    ['优惠券兑换绩效费更正', 'couponCorrectionFee'],
    ['优惠券兑换绩效费冲销', 'couponReversalFee'],
    ['卖家优惠券兑换费', 'sellerPoweredCouponFee']
  ],
  /** SelectDB 长表 front_caliber_l2=广告费用 的三级科目；弹窗金额走 /fee-drilldown */
  ad: [
    ['SP广告', 'spAd'],
    ['SB广告', 'sbAd']
  ],
  storageFee: [
    ['月仓储费差异', 'monthlyStorage'],
    ['长期仓储费', 'longStorage'],
    ['入库配置费', 'inboundPlacement'],
    ['仓储容量预留费', 'storageReservationFee'],
    ['STAR仓储费', 'starStorageFee'],
    ['AWD亚马逊仓配网络运输费', 'awdTransportationFee'],
    ['AWD亚马逊仓配网络处理费', 'awdProcessingFee']
  ],
  fbaFulfillmentFee: [
    ['FBA销毁费', 'fbaDisposal'],
    ['FBA移除费', 'fbaRemovalFee'],
    ['FBA标签服务费', 'fbaLabelServiceFee'],
    ['FBA仓储超量费', 'fbaOverageFee'],
    ['计划外服务费', 'unplannedServiceFee'],
    ['入库缺陷费撇销', 'inboundDefectReversal'],
    ['合作承运费', 'partnerCarrier']
  ],
  platformOtherFee: [
    ['透明计划标签', 'transparencyTag'],
    ['优质经理服务费', 'premiumService'],
    ['平台月租金', 'subscription'],
    ['其他交易费用', 'otherTransactionFee'],
    ['其他订单费用', 'otherOrderFee'],
    ['税费', 'taxFee'],
    ['多渠道订单服务费', 'multiChannelFulfillmentFee'],
    ['供应链信用额度返还', 'supplyChainCredit']
  ],
  fbaInventoryReimbursement: [
    ['FBA库存报销 - 客户退货', 'fbaComp'],
    ['FBA库存报销 - 入库丢失', 'fbaInboundLostComp'],
    ['FBA库存报销 - 客户服务问题', 'fbaCustomerServiceComp'],
    ['FBA库存报销 - 仓库丢失', 'fbaWarehouseLostComp'],
    ['FBA库存报销 - 仓库损坏', 'fbaWarehouseDamageComp'],
    ['FBA库存报销 - 出库丢失', 'fbaOutboundLostComp'],
    ['FBA库存报销 - 重新评估', 'fbaReEvaluationComp'],
    ['FBA库存报销 - 其他', 'fbaOtherComp'],
    ['款项追回扣款', 'fbaRecoveryClawback'],
    ['FBA库存报销 - 补偿追回', 'fbaCompRecovery'],
    ['FBA库存报销 - 入库丢失赔付追回扣款', 'fbaInboundLostRecovery'],
    ['FBA费用赔偿（不用扣减成本）', 'fbaFeeReimbursement']
  ],
  otherIncome: [
    ['清算收入', 'clearingIncome'],
    ['清算调整', 'clearingAdjust'],
    ['库存所有权转让(回购)', 'ownershipTransferIncome'],
    ['其他费用', 'miscIncome'],
    ['费用调整', 'feeAdjustmentIncome']
  ]
}

/** 单个* 字段映射到父字段后复用明细 */
export const UNIT_DRILLDOWN_PARENT: Record<string, string> = {
  unitRefundTotal: 'refundTotal',
  unitPromoFee: 'promoFee',
  unitAd: 'ad',
  unitAdSpend: 'ad',
  unitStorageFee: 'storageFee',
  unitFbaFulfillmentFee: 'fbaFulfillmentFee',
  unitPlatformOtherFee: 'platformOtherFee',
  unitFbaInventoryReimbursement: 'fbaInventoryReimbursement',
  unitOtherIncome: 'otherIncome'
}

/** 收入类明细展示为正号（其余为支出负号） */
export const DRILLDOWN_INCOME = new Set(['fbaInventoryReimbursement', 'otherIncome'])

export interface DrillRow {
  label: string
  value: number
  total?: boolean
}

const hashStr = (s: string): number => {
  let h = 2166136261
  for (let i = 0; i < s.length; i++) h = Math.imul(h ^ s.charCodeAt(i), 16777619)
  return h >>> 0
}

/** 是否有下拉明细 */
export const isDrilldownProp = (prop: string): boolean =>
  Boolean(FIELD_DRILLDOWN[prop] || UNIT_DRILLDOWN_PARENT[prop])

/** 解析父字段 */
export const resolveDrillParent = (prop: string): string => UNIT_DRILLDOWN_PARENT[prop] || prop

/**
 * 造假/读取明细行，归一化使合计 ≈ |父字段值|
 * 过滤过小项（对齐 demo > 0.005）
 */
export function getDrilldownRows(row: Record<string, any>, prop: string): DrillRow[] {
  const parentField = resolveDrillParent(prop)
  const items = FIELD_DRILLDOWN[parentField]
  if (!items?.length) return []

  const isUnit = Boolean(UNIT_DRILLDOWN_PARENT[prop])
  const divisor = isUnit ? Math.max(1, Number(row.qty) || 1) : 1
  const base = Math.abs(Number(row[parentField]) || 0)
  if (base < 0.005) return []

  const seedKey = String(row._key || row.orderNo || row.date || 'row')
  let rows: DrillRow[] = items
    .map(([label, key], idx) => {
      let raw: number
      if (row[key] != null && row[key] !== '') {
        raw = Math.abs(Number(row[key]) || 0)
      } else {
        const seed = (hashStr(`${seedKey}|${parentField}|${key}|${idx}`) % 100000) / 100000
        raw = base * (0.08 + seed * 0.28)
      }
      return { label, value: raw / divisor }
    })
    .filter((x) => x.value > 0.005)

  if (!rows.length) return []

  // 归一化到父值，保证合计一致（如图 -$0.15）
  const target = base / divisor
  const sum = rows.reduce((s, x) => s + x.value, 0) || 1
  rows = rows.map((x) => ({ ...x, value: +((x.value / sum) * target).toFixed(2) }))
  const fixed = rows.reduce((s, x) => s + x.value, 0)
  const drift = +(target - fixed).toFixed(2)
  if (rows.length && drift !== 0) {
    rows[rows.length - 1] = {
      ...rows[rows.length - 1],
      value: +(rows[rows.length - 1].value + drift).toFixed(2)
    }
  }

  return rows
}
