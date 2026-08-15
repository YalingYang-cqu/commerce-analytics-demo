/**
 * 成本中心两个板块共用的数值格式与列工厂底座。
 *
 * 与 `finance/sc-profit/columns/shared.ts` 同一套思路：列只声明 `prop`，
 * 呈现（小数位、千分位、着色、对齐）全部由 FieldMeta 决定，避免每列写插槽。
 * 相比 sc-profit 多一个 `price` 类型：采购/物流单价要保留 6 位小数，2 位会把尾差抹掉。
 */
import type { ColumnOption } from '@/types/component'

export const EMPTY = '-'

/** 数值列右内边距类，保证小数点对齐（与 sc-profit 同名类共用样式） */
export const NUM_PAD_CLASS = 'dt-num-pad'

export type FieldFmt = 'int' | 'money' | 'price' | 'percent' | 'text' | 'date' | 'tag'

export interface FieldMeta {
  fmt: FieldFmt
  /** cost 恒定成本色 / auto 负数标红 / none 不着色 */
  color?: 'cost' | 'auto' | 'none'
  /** 整数/金额是否强制带正负号（正数前缀 +） */
  signed?: boolean
}

/** 币种符号：成本中心统一按公司主体本位币展示，Mock 阶段固定 $ */
const CURRENCY = '$'

export const formatInt = (v: number, signed = false): string => {
  if (!Number.isFinite(v)) return EMPTY
  const n = Math.round(v)
  const body = Math.abs(n).toLocaleString('en-US')
  if (n < 0) return `-${body}`
  if (signed && n > 0) return `+${body}`
  return body
}

export const formatMoney = (v: number, signed = false): string => {
  if (!Number.isFinite(v)) return EMPTY
  const body = `${CURRENCY}${Math.abs(v).toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`
  if (v < 0) return `-${body}`
  if (signed && v > 0) return `+${body}`
  return body
}

/** 单价：6 位小数，不带千分位（避免与金额列混淆） */
export const formatPrice = (v: number): string => (Number.isFinite(v) ? v.toFixed(6) : EMPTY)

export const formatPercent = (v: number): string =>
  Number.isFinite(v) ? `${v.toFixed(2)}%` : EMPTY

/** 按 FieldMeta 渲染纯文本（供 ElTable formatter 使用） */
export const formatByMeta = (meta: FieldMeta | undefined, val: any): string => {
  if (val === null || val === undefined || val === '') return EMPTY
  if (!meta) return String(val)
  switch (meta.fmt) {
    case 'int':
      return formatInt(Number(val), !!meta.signed)
    case 'money':
      return formatMoney(Number(val), !!meta.signed)
    case 'price':
      return formatPrice(Number(val))
    case 'percent':
      return formatPercent(Number(val))
    default:
      return String(val)
  }
}

/** 数值列的着色 class（负数红 / 成本恒定色） */
export const valueClass = (meta: FieldMeta | undefined, val: any): string => {
  if (!meta || meta.color === 'none' || val === null || val === undefined) return ''
  if (meta.color === 'cost') return 'inv-cost-text'
  if (meta.color === 'auto') return Number(val) < 0 ? 'inv-minus-text' : ''
  return ''
}

/** 按中文表头估算列宽：max(110, 字数×14 + 24)，带气泡再补一个问号 icon */
export const minWidthByLabel = (label: string, hasTip = false): number =>
  Math.max(110, Array.from(label || '').length * 14 + 24) + (hasTip ? 18 : 0)

interface ColumnFactoryDeps {
  labels: Record<string, string>
  tips: Record<string, string>
  metas: Record<string, FieldMeta>
  /** 支持接口排序的列 */
  sortable?: Set<string>
}

/** 生成一对列工厂：数值列（右对齐 + formatter）与维度列（左对齐 + 插槽） */
export function createColumnFactories(deps: ColumnFactoryDeps) {
  const { labels, tips, metas, sortable } = deps

  const metricCol = (
    prop: string,
    group: string,
    opts: {
      checked?: boolean
      width?: number
      slot?: string
      label?: string
      className?: string
    } = {}
  ): ColumnOption => {
    const label = opts.label || labels[prop] || prop
    const tip = tips[prop]
    const meta = metas[prop]
    const base: ColumnOption = {
      prop,
      label,
      group,
      ...(tip ? { headerTip: tip } : {}),
      minWidth: opts.width || minWidthByLabel(label, !!tip),
      align: 'right',
      checked: opts.checked !== false,
      sortable: (sortable?.has(prop) ? 'custom' : false) as ColumnOption['sortable']
    }
    // 强调列：body / header 同步挂 class，避免只加粗单元格看起来不完整
    const emphasis = opts.className?.includes('is-emphasis-column')
    const className = [NUM_PAD_CLASS, opts.className].filter(Boolean).join(' ')
    if (opts.slot) {
      return {
        ...base,
        className,
        ...(emphasis ? { labelClassName: 'is-emphasis-column' } : {}),
        useSlot: true,
        slotName: opts.slot
      }
    }
    return {
      ...base,
      className: ['dt-cell', className].filter(Boolean).join(' '),
      ...(emphasis ? { labelClassName: 'is-emphasis-column' } : {}),
      formatter: (row: any) => formatByMeta(meta, row?.[prop])
    }
  }

  const idCol = (
    prop: string,
    opts: {
      group?: string
      checked?: boolean
      width?: number
      fixed?: boolean | 'left' | 'right'
      hideInSetting?: boolean
      slot?: string
      label?: string
      /** 单元格点击复制（ArtTable 内置） */
      copy?: boolean
    } = {}
  ): ColumnOption => {
    const label = opts.label || labels[prop] || prop
    const tip = tips[prop]
    return {
      prop,
      label,
      group: opts.group,
      ...(tip ? { headerTip: tip } : {}),
      minWidth: opts.width || minWidthByLabel(label, !!tip),
      align: 'left',
      ...(opts.fixed ? { fixed: opts.fixed } : {}),
      checked: opts.checked !== false,
      hideInSetting: opts.hideInSetting,
      sortable: (sortable?.has(prop) ? 'custom' : false) as ColumnOption['sortable'],
      ...(opts.copy ? { copy: true } : {}),
      ...(opts.slot ? { useSlot: true, slotName: opts.slot } : {})
    }
  }

  return { metricCol, idCol }
}
