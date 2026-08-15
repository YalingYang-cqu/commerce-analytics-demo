/**
 * 采购订单等场景：后端 SKU 计量单位多为英文码，列表/详情展示为中文。
 * 未命中映射时原样返回（兼容已是中文或新枚举）。
 */
const PURCHASE_SKU_UNIT_MAP: Record<string, string> = {
  piece: '件',
  item: '件',
  pcs: '件',
  pc: '件',
  unit: '个',
  set: '套',
  box: '箱',
  carton: '箱',
  case: '箱',
  pack: '包',
  bag: '袋',
  bottle: '瓶',
  can: '罐',
  roll: '卷',
  sheet: '张',
  pair: '双',
  dozen: '打',
  kg: '千克',
  kilogram: '千克',
  g: '克',
  gram: '克',
  t: '吨',
  ton: '吨',
  lb: '磅',
  oz: '盎司',
  m: '米',
  meter: '米',
  metre: '米',
  cm: '厘米',
  mm: '毫米',
  km: '千米',
  l: '升',
  liter: '升',
  litre: '升',
  ml: '毫升',
  cbm: '立方米',
  m3: '立方米'
}

export function formatPurchaseSkuUnit(raw: string | number | null | undefined): string {
  if (raw === null || raw === undefined) return '-'
  const s = String(raw).trim()
  if (!s) return '-'
  const key = s.toLowerCase()
  return PURCHASE_SKU_UNIT_MAP[key] ?? s
}
