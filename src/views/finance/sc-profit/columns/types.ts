/** 明细表 Tab（与顶部 ElTabs name 一致） */
export type ProfitDetailTab = 'dashboard' | 'parentAsin' | 'asin' | 'msku' | 'spu' | 'order'

export type ProductDetailTab = Exclude<ProfitDetailTab, 'dashboard' | 'order'>

export interface ColumnGroupItem {
  key: string
  title: string
  color: string
}

export interface FieldMeta {
  fmt: 'money' | 'percent' | 'int' | 'wow' | 'link' | 'text'
  color?: 'cost' | 'auto' | 'wow' | 'none'
  base?: number
}
