/** 指标趋势对比的可选指标：与主表业务类型列同源，数量、金额各一组 */

export interface TrendOption {
  key: string
  label: string
  format: 'qty' | 'amount'
}

const TREND_BASE_OPTIONS = [
  { key: 'opening', label: '期初' },
  { key: 'receipt', label: '货件入库' },
  { key: 'saleOut', label: '销售出库' },
  { key: 'saleReturn', label: '销售退货' },
  { key: 'removal', label: '移除出库' },
  { key: 'stocktake', label: '库存盘点' },
  { key: 'otherAdjust', label: '其他调整' },
  { key: 'closing', label: '期末' }
] as const

export const TREND_OPTION_GROUPS: { label: string; options: TrendOption[] }[] = [
  {
    label: '数量指标',
    options: TREND_BASE_OPTIONS.map((option) => ({
      key: `${option.key}Qty`,
      label: `${option.label}数量`,
      format: 'qty'
    }))
  },
  {
    label: '金额指标',
    options: TREND_BASE_OPTIONS.map((option) => ({
      key: `${option.key}Amount`,
      label: `${option.label}金额`,
      format: 'amount'
    }))
  }
]

export const TREND_OPTION_MAP = new Map(
  TREND_OPTION_GROUPS.flatMap((group) => group.options).map((option) => [option.key, option])
)

/** 同屏最多对比的指标数，超过后曲线难以辨识 */
export const MAX_TREND_METRICS = 4

export const DEFAULT_TREND_METRICS = ['openingQty', 'receiptQty', 'saleOutAmount']
