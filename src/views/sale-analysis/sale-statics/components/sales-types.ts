import type {
  AsinBoardType,
  DynamicColumn,
  MetricCard,
  SalesChannel,
  SalesDetailRow,
  SalesDimension,
  SalesMetric,
  SalesPeriod
} from '@/api/sale/sales-statistics'

export type {
  AsinBoardType,
  DynamicColumn,
  MetricCard,
  SalesChannel,
  SalesDetailRow,
  SalesDimension,
  SalesMetric,
  SalesPeriod
}

export interface OptionItem<T = string | number> {
  label: string
  value: T
}

export interface SalesFilterState {
  site: string[]
  shopIds: number[]
  brandIds: number[]
  categoryIds: number[]
  ownerIds: number[]
  productStatus: string[]
  dateStart: string
  dateEnd: string
  keyword: string
}

export interface TableColumnItem {
  key: string
  label: string
  width?: number
  /** 自适应列：用 min-width 参与剩余宽度分配（大屏填满表格），不固定宽度 */
  flex?: boolean
  fixed?: boolean
  frozen?: boolean
  align?: 'left' | 'center' | 'right'
  defaultVisible?: boolean
  readonly?: boolean
}

export interface DimensionColumnConfig {
  defaults: string[]
  order: string[]
}

export interface TabConfig {
  key: SalesChannel
  title: string
  notice: string
  exportAuth: string
  supportsShop: boolean
  metrics: SalesMetric[]
  dimensions: SalesDimension[]
}
