import { describe, expect, it } from 'vitest'
import type { VNode } from 'vue'
import type { ColumnOption } from '@/types/component'
import { buildDetailColumns, isDrilldownProp, type ProfitDetailTab } from './columns'
import { NUM_PAD_CLASS } from './columns/shared'
import { renderSummaryDrillCell } from './components/summary-cells'

const TABS: ProfitDetailTab[] = ['dashboard', 'parentAsin', 'asin', 'msku', 'spu', 'order']

/**
 * 数值列的 ▾ 槽位来源二选一：
 * - 下钻列：单元格内 grid 自带 10px 箭头槽
 * - 非下钻列：td 补 NUM_PAD_CLASS，用等宽 padding 顶掉同样的槽
 * 两者缺一，同组列的数字右边缘就会错开。
 */
const hasChevSlot = (col: ColumnOption): boolean =>
  isDrilldownProp(col.prop) ||
  String(col.className || '')
    .split(/\s+/)
    .includes(NUM_PAD_CLASS)

describe('数值列箭头槽位', () => {
  it.each(TABS)('%s tab 的右对齐数值列全部预留箭头槽', (tab) => {
    const missing = buildDetailColumns(tab)
      .filter((col) => col.align === 'right')
      .filter((col) => !hasChevSlot(col))
      .map((col) => col.prop)

    expect(missing).toEqual([])
  })

  it('平台支出组内下钻列与非下钻列槽位一致', () => {
    const cols = buildDetailColumns('order')
    const pick = (prop: string) => cols.find((col) => col.prop === prop)!

    // promoFee/ad 有下钻、testFee 仍无三级（用 dt-num-pad），三者必须落在同一条右边缘上
    expect(hasChevSlot(pick('promoFee'))).toBe(true)
    expect(hasChevSlot(pick('testFee'))).toBe(true)
    expect(hasChevSlot(pick('ad'))).toBe(true)
    expect(isDrilldownProp('ad')).toBe(true)
    expect(isDrilldownProp('testFee')).toBe(false)
  })
})

const childClasses = (node: VNode): string[] =>
  (node.children as VNode[]).map((child) => String((child.props as any)?.class ?? ''))

describe('合计行下钻单元格', () => {
  it('合计行把箭头槽写成内联栅格，避免 scoped 样式未透入 footer 时右偏', () => {
    const drillable = renderSummaryDrillCell({ text: '$8.19', drillable: true })
    const plain = renderSummaryDrillCell({ text: '$0.00', drillable: false })

    for (const cell of [drillable, plain]) {
      expect((cell.props as any).style).toMatchObject({
        display: 'inline-grid',
        gridTemplateColumns: 'auto 10px',
        columnGap: '4px'
      })
    }
  })

  it('可下钻时渲染 ▾', () => {
    const cell = renderSummaryDrillCell({ text: '$8.19', drillable: true })

    expect(cell.type).toBe('button')
    expect(childClasses(cell)).toContain('el-icon chev')
  })

  it('金额为 0 不可下钻时仍留住 ▾ 槽', () => {
    const cell = renderSummaryDrillCell({ text: '$0.00', drillable: false })

    expect(childClasses(cell)).toContain('dt-cost-chev-placeholder')
  })

  it('两种状态用同一套栅格容器，数字节点位置一致', () => {
    const drillable = renderSummaryDrillCell({ text: '$8.19', drillable: true })
    const plain = renderSummaryDrillCell({ text: '$0.00', drillable: false })

    expect(String((drillable.props as any).class)).toBe('dt-cost-drill')
    expect(String((plain.props as any).class)).toBe('dt-cost-static')
    expect(childClasses(drillable)[0]).toBe('dt-cost-value')
    expect(childClasses(plain)[0]).toBe('dt-cost-value')
  })
})
