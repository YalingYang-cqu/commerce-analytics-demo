/**
 * 历史：支出字段曾取绝对值展示「金额规模」。
 * 现口径：列表/指标卡/趋势与数据库一致，原样保留正负号（推广费等支出为负）。
 * 保留空集合以便旧引用不报错；勿再往集合里加字段做 abs。
 */
export const ABSOLUTE_AMOUNT_FIELDS = new Set<string>()

/** 展示层原样使用接口数值，不做绝对值转换。 */
export const toDisplayAmount = (_field: string, value: number): number => value

/** SC 利润页面统一百分比展示：固定两位小数，可选正数前置加号。 */
export const formatPercent = (value: number, options: { showPlus?: boolean } = {}): string => {
  const prefix = options.showPlus && value >= 0 ? '+' : ''
  return `${prefix}${value.toFixed(2)}%`
}

export type OrderStatusTagClass =
  | 'is-done'
  | 'is-progress'
  | 'is-pending'
  | 'is-danger'
  | 'is-default'

/**
 * 订单状态展示语义：
 * - 完成/送达：绿
 * - 已发货/运输中：蓝
 * - 待处理/未发货：橙
 * - 取消/失败/异常：红
 * - 未识别：灰
 */
export const getOrderStatusTagClass = (status?: string | null): OrderStatusTagClass => {
  const value = String(status || '').trim()
  if (!value) return 'is-default'
  if (/送达|完成|已收货|delivered|completed|complete/i.test(value)) return 'is-done'
  if (/待处理|待付款|未发货|待确认|等待|pending|unshipped|invoice.?unconfirmed/i.test(value)) {
    return 'is-pending'
  }
  if (/部分发货|已发货|运输|配送|待收|在途|partially.?shipped|shipped|in.?transit/i.test(value)) {
    return 'is-progress'
  }
  if (
    /取消|退款|退货|作废|异常|拒收|失败|无法履约|cancel|refund|return|fail|unfulfillable/i.test(
      value
    )
  ) {
    return 'is-danger'
  }
  return 'is-default'
}

/** 将旧的单选值和新的多选值统一为店铺 ID 数组。 */
export const normalizeShopIds = (value: unknown): number[] => {
  const values = Array.isArray(value) ? value : value === '' || value == null ? [] : [value]
  return values.map((item) => Number(item)).filter((item) => Number.isFinite(item))
}

/** 站点切换后仅保留仍属于当前候选集的已选店铺。 */
export const pruneShopIds = (selected: unknown, validIds: Iterable<number>): number[] => {
  const valid = new Set(validIds)
  return normalizeShopIds(selected).filter((id) => valid.has(id))
}

export type CardPrimaryAction = 'trend' | 'detail'

/** 卡片主体交互：订单卡筛明细；看板/对象卡加入趋势（待处理项底部链接另行筛明细）。 */
export const resolveCardPrimaryAction = (
  activeTab: string,
  _metricKey: string
): CardPrimaryAction => (activeTab === 'order' ? 'detail' : 'trend')

/** 待处理项底部链接对应明细风险筛选。 */
export const isPendingActionFilter = (key: string): boolean => key === 'pendingAction'

/** 指标卡筛选 → 后端利润状态。 */
export const resolveMetricProfitStatus = (key: string): string | undefined =>
  isPendingActionFilter(key) ? 'risk' : undefined

/**
 * 趋势空值处理：
 * - 全部为空表示数据源未接入，返回空序列，避免展示假 0 线；
 * - 部分空桶按 0 补齐连续时间轴；
 * - 金额类原样保留接口正负号。
 */
export const toTrendDisplaySeries = (
  key: string,
  values: Array<number | null | undefined>
): number[] => {
  const hasData = values.some((value) => value != null && Number.isFinite(Number(value)))
  if (!hasData) return []
  return values.map((value) => toDisplayAmount(key, value == null ? 0 : Number(value)))
}

/** 计数趋势的平均值允许小数，避免 1/30 被整数格式化为 0。 */
export const formatTrendCountAverage = (value: number): string => {
  if (value !== 0 && Math.abs(value) < 0.01) return value > 0 ? '<0.01' : '>-0.01'
  return value.toLocaleString('en-US', { maximumFractionDigits: 2 })
}

/** 多条趋势按选中顺序循环使用实线/虚线/点线，重合时仍可辨认。 */
export const resolveTrendLineType = (index: number): 'solid' | 'dashed' | 'dotted' => {
  const types = ['solid', 'dashed', 'dotted'] as const
  return types[index % types.length]
}

/** 待处理项逐桶等于亏损对象数与低毛利对象数之和。 */
export const buildPendingActionTrend = (loss: number[], lowMargin: number[]): number[] => {
  const length = Math.max(loss.length, lowMargin.length)
  return Array.from(
    { length },
    (_, index) => Number(loss[index] || 0) + Number(lowMargin[index] || 0)
  )
}
