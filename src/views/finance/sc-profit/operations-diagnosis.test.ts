import { describe, expect, it } from 'vitest'
import type { OrderProfitDiagnosis } from '@/api/finance/sc-profit'
import { buildOpsCards } from './operations-diagnosis'

const diagnosis = (values: Record<string, [number, number]>): OrderProfitDiagnosis => ({
  prevRange: '2026-07-01 ~ 2026-07-05',
  currRange: '2026-07-06 ~ 2026-07-10',
  items: Object.entries(values).map(([metric, [prevValue, currValue]]) => ({
    metric,
    label: metric,
    fmt: 'NUMBER',
    prevValue,
    currValue,
    changeRate: 0
  }))
})

describe('R2 看板经营诊断规则', () => {
  it('利润率非下降时改善并直接展示变化值', () => {
    const [card] = buildOpsCards(diagnosis({ margin: [0.1, 0.12] }))

    expect(card.title).toBe('利润效率改善')
    expect(card.cls).toBe('warn')
    expect(card.desc).toContain('+2.00%')
  })

  it('利润率下降时承压且使用绿色下降状态', () => {
    const [card] = buildOpsCards(diagnosis({ margin: [0.12, 0.1] }))

    expect(card.title).toBe('利润效率承压')
    expect(card.cls).toBe('good')
    expect(card.desc).toContain('-2.00%')
  })

  it('ACoS 上升时提示广告支出压力上升', () => {
    const [, card] = buildOpsCards(diagnosis({ ad: [-20, -30], sales: [100, 100], margin: [0, 0] }))

    expect(card.title).toBe('广告支出压力上升')
    expect(card.cls).toBe('warn')
    expect(card.desc).toContain('ACoS 上升')
  })

  it('ACoS 持平时按相对稳定展示且不写下降', () => {
    const [, card] = buildOpsCards(diagnosis({ ad: [-20, -20], sales: [100, 100], margin: [0, 0] }))

    expect(card.title).toBe('广告投入相对稳定')
    expect(card.cls).toBe('info')
    expect(card.desc).toContain('ACoS 持平')
    expect(card.desc).not.toContain('下降')
  })

  it('有亏损对象时提示数量和亏损金额', () => {
    const [, , card] = buildOpsCards(
      diagnosis({ margin: [0, 0], lossCount: [0, 2], lossAmount: [0, -36.71] })
    )

    expect(card.title).toBe('亏损对象复盘')
    expect(card.cls).toBe('warn')
    expect(card.desc).toContain('2</b> 个亏损对象')
    expect(card.desc).toContain('-$36.71')
    expect(card.desc).toContain('请及时复盘')
  })

  it('无亏损对象时提示暂无明显亏损对象', () => {
    const [, , card] = buildOpsCards(
      diagnosis({ margin: [0, 0], lossCount: [2, 0], lossAmount: [-36.71, 0] })
    )

    expect(card.cls).toBe('good')
    expect(card.desc).toBe('当前期暂无明显亏损对象。')
  })
})
