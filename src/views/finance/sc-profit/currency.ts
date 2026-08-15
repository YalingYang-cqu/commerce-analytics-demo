/**
 * SC 订单利润当前展示币种符号（PRD I-F07：切换币种时金额符号同步 $ / ¥）。
 *
 * 模块级单例，仅作用于本页各金额格式化包装（metrics.ts / columns/shared.ts / index.vue 运营洞察）；
 * 不改动全局 formatValue，避免影响其他页面。页面在 reload / 币种变更时调用 setScProfitCurrency 更新，
 * 金额数值由后端按 exchange_rate 换算（CNY），前端仅切符号并原样展示换算后的值。
 */
let symbol = '$'

/** 设置当前币种（CNY→¥，其余→$） */
export const setScProfitCurrency = (cur?: string | null): void => {
  symbol = cur === 'CNY' ? '¥' : '$'
}

/** 当前币种符号 */
export const currencySymbol = (): string => symbol

/** 金额格式化（当前币种符号 + 千分位两位小数；负号置于符号前） */
export const formatMoney = (v: number): string =>
  `${v < 0 ? '-' : ''}${symbol}${Math.abs(v).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
