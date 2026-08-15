/**
 * 合计行数值单元格：ElTable 的 summaryMethod 只能返回 VNode，
 * 结构必须与数据行 #cell 插槽逐字对应（数字 + 固定 10px ▾ 槽），
 * 否则同一列的合计行与明细行数字右边缘会错开。
 */
import { h, type VNode } from 'vue'
import { ArrowDown } from '@element-plus/icons-vue'

/**
 * summaryMethod 返回的 VNode 由 Element Plus footer 内部再次渲染。
 * 栅格尺寸写成内联样式，避免 scoped :deep 样式未透入 footer 时箭头槽坍缩，
 * 导致合计值比明细值靠右约 9px。
 */
const SUMMARY_GRID_STYLE = {
  display: 'inline-grid',
  gridTemplateColumns: 'auto 10px',
  columnGap: '4px',
  placeItems: 'center end'
}

export interface SummaryDrillCellOptions {
  text: string
  /** 金额是否大到可以展开子项；不可下钻时仍要留住 ▾ 槽 */
  drillable: boolean
  onDrill?: (anchor: HTMLElement) => void
}

export function renderSummaryDrillCell({
  text,
  drillable,
  onDrill
}: SummaryDrillCellOptions): VNode {
  const value = h('span', { class: 'dt-cost-value' }, text)

  if (!drillable) {
    return h('span', { class: 'dt-cost-static', style: SUMMARY_GRID_STYLE }, [
      value,
      h('span', { class: 'dt-cost-chev-placeholder', 'aria-hidden': 'true' })
    ])
  }

  return h(
    'button',
    {
      type: 'button',
      class: 'dt-cost-drill',
      style: { ...SUMMARY_GRID_STYLE, fontWeight: 700 },
      onClick: (e: MouseEvent) => {
        e.stopPropagation()
        const el = e.currentTarget as HTMLElement
        if (el) onDrill?.(el)
      }
    },
    // 与数据行 <ElIcon class="chev"> 渲染同构；直接用 <i> 避免引入 element-plus 主包
    [value, h('i', { class: 'el-icon chev' }, [h(ArrowDown)])]
  )
}
