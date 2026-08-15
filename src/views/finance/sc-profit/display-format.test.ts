import { describe, expect, it } from 'vitest'
import { formatFieldValue } from './columns'
import { formatMoney, setScProfitCurrency } from './currency'
import { formatPercent, toDisplayAmount } from './presentation'

describe('SC订单利润页面数值格式', () => {
  it('百分比固定保留两位并增加百分号', () => {
    expect(formatFieldValue('margin', 3.24)).toBe('3.24%')
    expect(formatFieldValue('adAcos', 12.5)).toBe('12.50%')
  })

  it('页面百分比公共格式支持环比正负号', () => {
    expect(formatPercent(12.5)).toBe('12.50%')
    expect(formatPercent(5, { showPlus: true })).toBe('+5.00%')
    expect(formatPercent(-5, { showPlus: true })).toBe('-5.00%')
  })

  it('下钻金额原样保留接口正负号，只做币种格式化', () => {
    setScProfitCurrency('USD')
    expect(formatMoney(2.66)).toBe('$2.66')
    expect(formatMoney(-2.66)).toBe('-$2.66')
    expect(formatMoney(1)).toBe('$1.00')
  })

  it('列表金额与数据库一致：推广费等支出保留负号，不做绝对值', () => {
    setScProfitCurrency('USD')
    expect(toDisplayAmount('promoFee', -113.73)).toBe(-113.73)
    expect(formatFieldValue('promoFee', -113.73)).toBe('-$113.73')
    expect(formatFieldValue('ad', -58.06)).toBe('-$58.06')
    expect(formatFieldValue('storageFee', -3.6)).toBe('-$3.60')
    expect(formatFieldValue('platformOtherFee', 1)).toBe('$1.00')
    expect(formatFieldValue('profit', -96.26)).toBe('-$96.26')
    expect(formatFieldValue('sales', 215.28)).toBe('$215.28')
  })
})
