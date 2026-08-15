/**
 * SC 订单利润页（finance/sc-profit）Mock 数据生成器。
 *
 * 返回的都是「真实接口 data 字段」对应的负载，由 handlers 统一包裹成 { code, msg, data }。
 *
 * 一致性设计：所有视图都由同一份「订单原子数据」聚合而来，不各自造数。
 *   订单（date × 商品 × 序号）
 *     ├─ 按日期桶聚合 → 看板明细行 / 趋势序列 / 经营诊断
 *     ├─ 按商品聚合   → 父ASIN / ASIN / MSKU / SPU 明细行
 *     ├─ 原样列出     → 订单明细行
 *     └─ 全量聚合     → 指标卡 / 合计行 / 费用下钻
 * 由此保证：指标卡数值 = 合计行 = 明细行之和；卡片计数 = 点击后明细条数；
 * 费用下钻各三级项之和 = 单元格金额。
 *
 * 与后端契约一致的两处约定：
 * 1. 比率类（利润率 / 环比 / ACoS 等）以比率返回（0.0324），由前端 ×100 展示；
 * 2. 支出类金额为负数，收入类为正数，前端不再取绝对值。
 */
import dayjs from 'dayjs'
import { DIM_LAYOUT, META_MAP, toDimType } from '@/views/finance/sc-profit/metrics'
import { FIELD_META } from '@/views/finance/sc-profit/columns/shared'
import { FIELD_DRILLDOWN } from '@/views/finance/sc-profit/columns/drilldown'

const round2 = (n: number): number => Math.round(n * 100) / 100
const round4 = (n: number): number => Math.round(n * 10000) / 10000
const safeDiv = (a: number, b: number): number => (b ? a / b : 0)

/** 稳定 hash：同一 key 每次生成同一份数据，翻页 / 切 Tab / 重查都不跳变 */
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) h = Math.imul(h ^ str.charCodeAt(i), 16777619)
  return h >>> 0
}

const rand = (key: string): number => (hash(key) % 100000) / 100000

/** 以 1 为中心的稳定抖动系数 */
const jitter = (key: string, spread = 0.3): number => 1 - spread / 2 + rand(key) * spread

/* =========================================================================
 * 维度种子
 * =======================================================================*/

interface ProfitSeed {
  parentAsin: string
  asin: string
  msku: string
  spu: string
  spuName: string
  category: string
  brand: string
  store: string
  shopId: number
  owner: string
  country: string
  /** 目标利润率（比率）：让亏损 / 低毛利 / 正常 / 高毛利四档都有样本 */
  targetMargin: number
}

const SEEDS: ProfitSeed[] = [
  { parentAsin: 'B0CP1PARENT', asin: 'B0CP1AAAA1', msku: 'MK-CASE-001-US', spu: 'MK-CASE-SPU', spuName: '透明防摔壳系列', category: '3C 配件', brand: 'MK', store: 'US-Store-A', shopId: 101, owner: '张三', country: 'US', targetMargin: 0.058 },
  { parentAsin: 'B0CP1PARENT', asin: 'B0CP1AAAA2', msku: 'MK-CASE-002-US', spu: 'MK-CASE-SPU', spuName: '透明防摔壳系列', category: '3C 配件', brand: 'MK', store: 'US-Store-A', shopId: 101, owner: '张三', country: 'US', targetMargin: -0.042 },
  { parentAsin: 'B0CP2PARENT', asin: 'B0CP2BBBB1', msku: 'MK-CABLE-002-US', spu: 'MK-CABLE-SPU', spuName: '快充数据线系列', category: '3C 配件', brand: '兴源', store: 'US-Store-B', shopId: 102, owner: '李四', country: 'US', targetMargin: 0.235 },
  { parentAsin: 'B0CP2PARENT', asin: 'B0CP2BBBB2', msku: 'MK-CABLE-003-US', spu: 'MK-CABLE-SPU', spuName: '快充数据线系列', category: '3C 配件', brand: '兴源', store: 'US-Store-B', shopId: 102, owner: '李四', country: 'US', targetMargin: 0.126 },
  { parentAsin: 'B0CP3PARENT', asin: 'B0CP3CCCC1', msku: 'MK-CHARGER-003-US', spu: 'MK-CHARGER-SPU', spuName: 'PD快充头系列', category: '3C 配件', brand: '优品', store: 'US-Store-A', shopId: 101, owner: '王五', country: 'US', targetMargin: 0.031 },
  { parentAsin: 'B0CP4PARENT', asin: 'B0CP4DDDD1', msku: 'MK-STAND-004-US', spu: 'MK-STAND-SPU', spuName: '桌面支架系列', category: '家居生活', brand: '恒达', store: 'US-Store-B', shopId: 102, owner: '赵六', country: 'US', targetMargin: 0.284 },
  { parentAsin: 'B0CP5PARENT', asin: 'B0CP5EEEE1', msku: 'MK-PAD-005-US', spu: 'MK-PAD-SPU', spuName: '鼠标垫套装系列', category: '家居生活', brand: '联创', store: 'US-Store-A', shopId: 101, owner: '陈七', country: 'US', targetMargin: 0.092 },
  { parentAsin: 'B0CP6PARENT', asin: 'B0CP6FFFF1', msku: 'MK-HUB-006-US', spu: 'MK-HUB-SPU', spuName: 'Type-C扩展坞系列', category: '3C 配件', brand: 'MK', store: 'US-VC-Main', shopId: 103, owner: '刘八', country: 'US', targetMargin: 0.163 },
  { parentAsin: 'B0CP7PARENT', asin: 'B0CP7GGGG1', msku: 'MK-SCREEN-007-US', spu: 'MK-SCREEN-SPU', spuName: '钢化膜系列', category: '3C 配件', brand: '精工', store: 'US-Store-B', shopId: 102, owner: '张三', country: 'US', targetMargin: -0.078 },
  { parentAsin: 'B0CP8PARENT', asin: 'B0CP8HHHH1', msku: 'MK-POWER-008-US', spu: 'MK-POWER-SPU', spuName: '移动电源系列', category: '户外用品', brand: '恒达', store: 'US-Store-A', shopId: 101, owner: '李四', country: 'US', targetMargin: 0.205 },
  { parentAsin: 'B0CP9PARENT', asin: 'B0CP9IIII1', msku: 'MK-LAMP-009-US', spu: 'MK-LAMP-SPU', spuName: '露营灯系列', category: '户外用品', brand: '优品', store: 'US-Store-B', shopId: 102, owner: '王五', country: 'US', targetMargin: 0.019 },
  { parentAsin: 'B0CPAPARENT', asin: 'B0CPAJJJJ1', msku: 'MK-BOTTLE-010-US', spu: 'MK-BOTTLE-SPU', spuName: '保温杯系列', category: '户外用品', brand: '联创', store: 'US-VC-Main', shopId: 103, owner: '赵六', country: 'US', targetMargin: 0.118 }
]

const STORES = [
  { id: 101, name: 'US-Store-A', countryCode: 'US', countryName: '美国' },
  { id: 102, name: 'US-Store-B', countryCode: 'US', countryName: '美国' },
  { id: 103, name: 'US-VC-Main', countryCode: 'US', countryName: '美国' },
  { id: 201, name: 'UK-Store-A', countryCode: 'UK', countryName: '英国' },
  { id: 202, name: 'UK-Store-B', countryCode: 'UK', countryName: '英国' },
  { id: 301, name: 'DE-Store-A', countryCode: 'DE', countryName: '德国' },
  { id: 401, name: 'JP-Store-A', countryCode: 'JP', countryName: '日本' }
]

const CATEGORIES = [
  { id: 1, name: '3C 配件' },
  { id: 2, name: '户外用品' },
  { id: 3, name: '家居生活' }
]

const BRANDS = [
  { id: 11, name: 'MK' },
  { id: 12, name: '兴源' },
  { id: 13, name: '优品' },
  { id: 14, name: '恒达' },
  { id: 15, name: '联创' },
  { id: 16, name: '精工' }
]

/* =========================================================================
 * 订单原子
 * =======================================================================*/

const EXPENSE_KEYS = [
  'referral',
  'fba',
  'promoDiscount',
  'refundTotal',
  'ad',
  'promoFee',
  'testFee',
  'storageFee',
  'fbaFulfillmentFee',
  'platformOtherFee'
] as const
const INVENTORY_COST_KEYS = ['purchase', 'head'] as const
const OTHER_INCOME_KEYS = ['fbaInventoryReimbursement', 'otherIncome'] as const

/** 可直接相加的原子字段（其余指标都由这些字段推导） */
const PRIMITIVE_KEYS = [
  'sales',
  'buyerShipping',
  'qty',
  'shipQty',
  'orderCount',
  ...EXPENSE_KEYS,
  ...INVENTORY_COST_KEYS,
  ...OTHER_INCOME_KEYS
] as const

type Primitives = Record<string, number>

/** FIELD_META.base 视为「30 天 × 全部商品」的总量 */
const DAYS_IN_BASE = 30
const NOMINAL_ORDERS_PER_SEED_DAY = 11
const ORDER_SCALE = 1 / (DAYS_IN_BASE * SEEDS.length * NOMINAL_ORDERS_PER_SEED_DAY)

const fieldBase = (key: string): number => Number(FIELD_META[key]?.base ?? 0)

const SEED_WEIGHTS = SEEDS.map((seed) => 0.6 + rand(`seedw|${seed.asin}`) * 0.9)

function emptyPrimitives(): Primitives {
  const p: Primitives = {}
  PRIMITIVE_KEYS.forEach((key) => {
    p[key] = 0
  })
  return p
}

function addPrimitives(target: Primitives, src: Primitives): void {
  PRIMITIVE_KEYS.forEach((key) => {
    target[key] += Number(src[key]) || 0
  })
}

interface OrderRecord extends Primitives {
  [key: string]: any
  orderNo: string
  date: string
  seedIdx: number
  offsite: boolean
  shipped: boolean
  settled: boolean
  /** 多明细订单的行项目（金额精确等分，合计等于订单本身） */
  items: Primitives[]
}

/** 生成单笔订单：先造收入与费用，再用采购成本反推出目标利润率 */
function buildOrder(date: string, seedIdx: number, index: number): OrderRecord {
  const seed = SEEDS[seedIdx]
  const orderNo = `112-${1000000 + (hash(`no1|${date}|${seedIdx}|${index}`) % 8999999)}-${1000000 + (hash(`no2|${date}|${seedIdx}|${index}`) % 8999999)}`
  const key = `${date}|${seed.asin}|${index}`
  const weight = ORDER_SCALE * (0.75 + rand(`dayw|${date}`) * 0.5) * SEED_WEIGHTS[seedIdx]

  const p = emptyPrimitives()
  p.sales = round2(fieldBase('sales') * weight * jitter(`${key}|sales`, 0.5))
  p.buyerShipping = round2(fieldBase('buyerShipping') * weight * jitter(`${key}|ship`, 0.8))
  p.qty = Math.max(1, Math.round(fieldBase('qty') * weight * jitter(`${key}|qty`, 0.5)))

  EXPENSE_KEYS.forEach((field) => {
    const base = fieldBase(field)
    p[field] = base === 0 ? 0 : -round2(base * weight * jitter(`${key}|${field}`, 0.45))
  })
  p.head = -round2(fieldBase('head') * weight * jitter(`${key}|head`, 0.25))
  OTHER_INCOME_KEYS.forEach((field) => {
    p[field] = round2(fieldBase(field) * weight * jitter(`${key}|${field}`, 0.8))
  })

  // 采购成本反推：让本单利润率落在该商品的目标区间，四个利润档位都能出样本
  const targetMargin = seed.targetMargin + (rand(`${key}|margin`) - 0.5) * 0.07
  const beforePurchase =
    p.sales +
    p.buyerShipping +
    EXPENSE_KEYS.reduce((acc, field) => acc + p[field], 0) +
    p.head +
    OTHER_INCOME_KEYS.reduce((acc, field) => acc + p[field], 0)
  p.purchase = round2(round2(p.sales * targetMargin) - beforePurchase)

  const shipped = hash(`shipped|${orderNo}`) % 29 !== 0
  const offsite = hash(`offsite|${orderNo}`) % 7 === 0
  const settled = hash(`settled|${orderNo}`) % 5 !== 0
  p.shipQty = shipped ? p.qty : 0
  p.orderCount = 1

  // 约 1/3 的订单拆成两条行项目，金额精确等分（末条吸收尾差）
  const lineCount = hash(`lines|${orderNo}`) % 3 === 0 ? 2 : 1
  const items =
    lineCount === 1
      ? [{ ...p }]
      : splitPrimitives(p, [0.45 + rand(`${key}|l0`) * 0.3, 0.45 + rand(`${key}|l1`) * 0.3])

  return { ...p, orderNo, date, seedIdx, offsite, shipped, settled, items }
}

/** 把一组金额按权重精确拆分：各份之和严格等于原值 */
function splitAmount(total: number, weights: number[]): number[] {
  const weightSum = weights.reduce((acc, w) => acc + w, 0) || 1
  const parts = weights.map((w) => round2((total * w) / weightSum))
  const drift = round2(total - parts.reduce((acc, v) => acc + v, 0))
  if (parts.length) parts[parts.length - 1] = round2(parts[parts.length - 1] + drift)
  return parts
}

/** 整数拆分：每份至少 1，合计严格等于原值 */
function splitCount(total: number, weights: number[]): number[] {
  const n = weights.length
  if (total <= n) return weights.map(() => Math.max(1, Math.floor(total / n)))
  const weightSum = weights.reduce((acc, w) => acc + w, 0) || 1
  const parts = weights.map((w) => Math.max(1, Math.round((total * w) / weightSum)))
  let drift = total - parts.reduce((acc, v) => acc + v, 0)
  let cursor = 0
  while (drift !== 0) {
    const step = drift > 0 ? 1 : -1
    if (parts[cursor] + step >= 1) {
      parts[cursor] += step
      drift -= step
    }
    cursor = (cursor + 1) % n
  }
  return parts
}

function splitPrimitives(p: Primitives, weights: number[]): Primitives[] {
  const out: Primitives[] = weights.map(() => emptyPrimitives())
  PRIMITIVE_KEYS.forEach((field) => {
    if (field === 'orderCount') return
    const parts =
      field === 'qty' || field === 'shipQty'
        ? splitCount(p[field], weights)
        : splitAmount(p[field], weights)
    parts.forEach((value, i) => {
      out[i][field] = value
    })
  })
  // 未发货订单的行项目发货量同为 0
  if (!p.shipQty) out.forEach((item) => (item.shipQty = 0))
  return out
}

/* =========================================================================
 * 按天缓存
 * =======================================================================*/

const ORDER_CACHE_MAX_DAYS = 60
const dayOrdersCache = new Map<string, OrderRecord[]>()

function dayOrders(date: string): OrderRecord[] {
  const cached = dayOrdersCache.get(date)
  if (cached) return cached
  const list: OrderRecord[] = []
  SEEDS.forEach((_, seedIdx) => {
    const count = 9 + (hash(`k|${date}|${seedIdx}`) % 5)
    for (let i = 0; i < count; i++) list.push(buildOrder(date, seedIdx, i))
  })
  if (dayOrdersCache.size >= ORDER_CACHE_MAX_DAYS) {
    const oldest = dayOrdersCache.keys().next().value
    if (oldest) dayOrdersCache.delete(oldest)
  }
  dayOrdersCache.set(date, list)
  return list
}

const ORDER_SOURCE_ALL = 'all'
const ORDER_SOURCE_OFFSITE_ONLY = 'offsiteOnly'
const ORDER_SOURCE_EXCLUDE_OFFSITE = 'excludeOffsiteAndReplacement'

const matchOrderSource = (order: OrderRecord, orderSource?: string): boolean => {
  if (orderSource === ORDER_SOURCE_OFFSITE_ONLY) return order.offsite
  if (orderSource === ORDER_SOURCE_EXCLUDE_OFFSITE) return !order.offsite
  return true
}

/** 每天按商品预聚合（订单来源维度缓存），看板 / 商品页签据此聚合，避免逐单展开 */
const dayAggCache = new Map<string, Primitives[]>()

function dayAggBySeed(date: string, orderSource?: string): Primitives[] {
  const source = orderSource || ORDER_SOURCE_ALL
  const cacheKey = `${date}|${source}`
  const cached = dayAggCache.get(cacheKey)
  if (cached) return cached
  const agg = SEEDS.map(() => emptyPrimitives())
  dayOrders(date).forEach((order) => {
    if (!matchOrderSource(order, source)) return
    addPrimitives(agg[order.seedIdx], order)
  })
  dayAggCache.set(cacheKey, agg)
  return agg
}

/* =========================================================================
 * 时间桶
 * =======================================================================*/

interface Bucket {
  key: string
  label: string
  dateStart: string
  dateEnd: string
}

type Unit = 'day' | 'week' | 'month'

const toUnit = (granularity?: string): Unit =>
  granularity === 'week' ? 'week' : granularity === 'month' ? 'month' : 'day'

const MAX_DAYS = 400

/** 展开区间内的每一天 */
function eachDate(dateStart?: string, dateEnd?: string): string[] {
  const end = dateEnd ? dayjs(dateEnd) : dayjs()
  const start = dateStart ? dayjs(dateStart) : end.subtract(29, 'day')
  const days: string[] = []
  let cursor = start.startOf('day')
  while (days.length < MAX_DAYS && !cursor.isAfter(end, 'day')) {
    days.push(cursor.format('YYYY-MM-DD'))
    cursor = cursor.add(1, 'day')
  }
  return days.length ? days : [end.format('YYYY-MM-DD')]
}

const bucketLabel = (unit: Unit, start: dayjs.Dayjs, end: dayjs.Dayjs): string => {
  if (unit === 'day') return start.format('YYYY-MM-DD')
  if (unit === 'month') return start.format('YYYY-MM')
  return `${start.format('MM-DD')}~${end.format('MM-DD')}`
}

/** 按粒度切分筛选区间；边界桶按区间裁剪 */
function buildBuckets(dateStart?: string, dateEnd?: string, granularity?: string): Bucket[] {
  const unit = toUnit(granularity)
  const days = eachDate(dateStart, dateEnd)
  const first = dayjs(days[0])
  const last = dayjs(days[days.length - 1])
  const list: Bucket[] = []
  let cursor = first.startOf(unit)
  while (list.length < MAX_DAYS && !cursor.isAfter(last, unit)) {
    const rawEnd = cursor.endOf(unit)
    const bStart = cursor.isBefore(first, 'day') ? first : cursor
    const bEnd = rawEnd.isAfter(last, 'day') ? last : rawEnd
    list.push({
      key: cursor.format('YYYY-MM-DD'),
      label: bucketLabel(unit, bStart, bEnd),
      dateStart: bStart.format('YYYY-MM-DD'),
      dateEnd: bEnd.format('YYYY-MM-DD')
    })
    cursor = cursor.add(1, unit)
  }
  return list
}

/** 周 / 月父桶内部的下钻子桶（周→日、月→周） */
const childBuckets = (bucket: Bucket, unit: Unit): Bucket[] =>
  unit === 'day' ? [] : buildBuckets(bucket.dateStart, bucket.dateEnd, unit === 'week' ? 'day' : 'week')

/* =========================================================================
 * 聚合与派生
 * =======================================================================*/

/** 由原子字段推导出全部展示指标（比率一律以比率返回） */
function finalize(p: Primitives): Record<string, any> {
  const row: Record<string, any> = {}
  PRIMITIVE_KEYS.forEach((key) => {
    row[key] = key === 'qty' || key === 'shipQty' || key === 'orderCount' ? Math.round(p[key]) : round2(p[key])
  })
  row.totalCost = round2(row.purchase + row.head)
  row.profit = round2(
    row.sales +
      row.buyerShipping +
      EXPENSE_KEYS.reduce((acc, key) => acc + row[key], 0) +
      row.purchase +
      row.head +
      OTHER_INCOME_KEYS.reduce((acc, key) => acc + row[key], 0)
  )
  row.margin = round4(safeDiv(row.profit, row.sales))

  row.unitPrice = round2(safeDiv(row.sales, row.qty))
  row.unitNetProfit = round2(safeDiv(row.profit, row.qty))
  row.unitAd = round2(safeDiv(row.ad, row.qty))
  row.unitPromoFee = round2(safeDiv(row.promoFee, row.qty))
  row.unitFba = round2(safeDiv(row.fba, row.qty))
  row.unitReferral = round2(safeDiv(row.referral, row.qty))
  row.unitPromoDiscount = round2(safeDiv(row.promoDiscount, row.qty))
  row.unitRefundTotal = round2(safeDiv(row.refundTotal, row.qty))
  row.unitAdSpend = round2(safeDiv(row.ad, row.qty))
  row.unitStorageFee = round2(safeDiv(row.storageFee, row.qty))
  row.unitFbaFulfillmentFee = round2(safeDiv(row.fbaFulfillmentFee, row.qty))
  row.unitPlatformOtherFee = round2(safeDiv(row.platformOtherFee, row.qty))
  row.unitPurchase = round2(safeDiv(row.purchase, row.qty))
  row.unitHead = round2(safeDiv(row.head, row.qty))
  row.unitTotalCost = round2(safeDiv(row.totalCost, row.qty))
  row.unitFbaInventoryReimbursement = round2(safeDiv(row.fbaInventoryReimbursement, row.qty))
  row.unitOtherIncome = round2(safeDiv(row.otherIncome, row.qty))

  // 广告归因本期后端不返回，前端显示「—」
  row.adSales = null
  row.adQty = null
  row.organicQty = null
  row.offsiteQty = null
  row.adQtyRate = null
  row.adAcos = null
  return row
}

const sumPrimitives = (list: Primitives[]): Primitives => {
  const total = emptyPrimitives()
  list.forEach((item) => addPrimitives(total, item))
  return total
}

/* =========================================================================
 * 筛选
 * =======================================================================*/

/** 关键词匹配的商品字段（订单号在订单层单独处理） */
const SEED_SEARCH_FIELD: Record<string, keyof ProfitSeed> = {
  asin: 'asin',
  pasin: 'parentAsin',
  msku: 'msku',
  spu: 'spu',
  name: 'spuName'
}

/** 当前筛选条件下可见的商品下标 */
function visibleSeedIndexes(params: Record<string, any>): number[] {
  const shopIds: number[] = params.shopIds || []
  const categoryIds: number[] = params.categoryIds || []
  const brandIds: number[] = params.brandIds || []
  const spuCodes: string[] = params.spuCodes || []
  const categoryNames = new Set(
    CATEGORIES.filter((item) => categoryIds.includes(item.id)).map((item) => item.name)
  )
  const brandNames = new Set(BRANDS.filter((item) => brandIds.includes(item.id)).map((item) => item.name))
  const keyword = String(params.keyword || '').trim().toLowerCase()
  const seedField = SEED_SEARCH_FIELD[String(params.searchType || 'asin')]

  return SEEDS.map((_, index) => index).filter((index) => {
    const seed = SEEDS[index]
    if (shopIds.length && !shopIds.includes(seed.shopId)) return false
    if (categoryNames.size && !categoryNames.has(seed.category)) return false
    if (brandNames.size && !brandNames.has(seed.brand)) return false
    if (spuCodes.length && !spuCodes.includes(seed.spu)) return false
    if (keyword && seedField) {
      return String(seed[seedField]).toLowerCase().includes(keyword)
    }
    return true
  })
}

/** 订单号关键词（仅订单 Tab 的 searchType=orderNo 生效） */
function matchOrderKeyword(order: OrderRecord, params: Record<string, any>): boolean {
  const keyword = String(params.keyword || '').trim().toLowerCase()
  if (!keyword || String(params.searchType) !== 'orderNo') return true
  return order.orderNo.toLowerCase().includes(keyword)
}

/** 利润状态分档（与页面下拉一致；margin 为比率） */
const profitTier = (row: Record<string, any>): 'loss' | 'low' | 'normal' | 'high' => {
  if (Number(row.profit) < 0) return 'loss'
  const margin = Number(row.margin) || 0
  if (margin < 0.08) return 'low'
  if (margin < 0.2) return 'normal'
  return 'high'
}

function filterProfitStatus<T extends Record<string, any>>(rows: T[], status?: string): T[] {
  if (!status || status === 'all') return rows
  if (status === 'risk') return rows.filter((row) => ['loss', 'low'].includes(profitTier(row)))
  return rows.filter((row) => profitTier(row) === status)
}

/* =========================================================================
 * 各页签明细行
 * =======================================================================*/

/** 看板：按时间桶一行，周 / 月桶带下钻子行，环比对比上一桶 */
function buildDashboardRows(params: Record<string, any>): Record<string, any>[] {
  const unit = toUnit(params.granularity)
  const buckets = buildBuckets(params.dateStart, params.dateEnd, params.granularity)
  const seedIdx = visibleSeedIndexes(params)

  const aggregateRange = (start: string, end: string): Primitives =>
    sumPrimitives(
      eachDate(start, end).flatMap((date) => {
        const bySeed = dayAggBySeed(date, params.orderSource)
        return seedIdx.map((index) => bySeed[index])
      })
    )

  const rows = buckets.map((bucket) => ({
    ...finalize(aggregateRange(bucket.dateStart, bucket.dateEnd)),
    dimKey: bucket.key,
    date: bucket.label,
    dateStart: bucket.dateStart,
    dateEnd: bucket.dateEnd,
    _bucket: bucket
  }))

  // 环比：与上一个时间桶比较，首桶无对比对象
  rows.forEach((row, index) => {
    const prev = rows[index - 1]
    if (!prev) {
      row.salesWoW = null
      row.profitWoW = null
      row.marginChange = null
      return
    }
    row.salesWoW = prev.sales ? round4(safeDiv(row.sales - prev.sales, Math.abs(prev.sales))) : null
    row.profitWoW = prev.profit
      ? round4(safeDiv(row.profit - prev.profit, Math.abs(prev.profit)))
      : null
    row.marginChange = round4(row.margin - prev.margin)
  })

  rows.forEach((row) => {
    const children = childBuckets(row._bucket, unit)
    if (children.length > 1) {
      row.children = children.map((child) => ({
        ...finalize(aggregateRange(child.dateStart, child.dateEnd)),
        dimKey: child.key,
        childKey: child.key,
        date: child.label,
        dateStart: child.dateStart,
        dateEnd: child.dateEnd,
        salesWoW: null,
        profitWoW: null,
        marginChange: null
      }))
      row.hasChildren = true
    }
    delete row._bucket
  })
  return rows
}

const productKeyOf = (tab: string, seed: ProfitSeed): string =>
  tab === 'parentAsin'
    ? seed.parentAsin
    : tab === 'spu'
      ? seed.spu
      : tab === 'msku' || tab === 'sku'
        ? seed.msku
        : seed.asin

/** 商品维度（父ASIN / ASIN / MSKU / SPU）：按维度值聚合区间内全部订单 */
function buildProductRows(tab: string, params: Record<string, any>): Record<string, any>[] {
  const dates = eachDate(params.dateStart, params.dateEnd)
  const seedIdx = visibleSeedIndexes(params)
  const perSeed = new Map<number, Primitives>()
  seedIdx.forEach((index) => {
    perSeed.set(
      index,
      sumPrimitives(dates.map((date) => dayAggBySeed(date, params.orderSource)[index]))
    )
  })

  const groups = new Map<string, number[]>()
  seedIdx.forEach((index) => {
    const key = productKeyOf(tab, SEEDS[index])
    groups.set(key, [...(groups.get(key) || []), index])
  })

  const rows: Record<string, any>[] = []
  groups.forEach((members, key) => {
    const head = SEEDS[members[0]]
    const row: Record<string, any> = {
      ...finalize(sumPrimitives(members.map((index) => perSeed.get(index)!))),
      dimKey: key,
      image: '',
      parentAsin: head.parentAsin,
      asin: tab === 'parentAsin' ? members.map((index) => SEEDS[index].asin).join(' / ') : head.asin,
      msku: head.msku,
      spu: head.spu,
      spuName: head.spuName,
      category: head.category,
      brand: head.brand,
      store: head.store,
      owner: head.owner,
      country: head.country,
      currency: params.currency || 'USD'
    }
    if (members.length > 1) {
      row.children = members.map((index) => {
        const member = SEEDS[index]
        return {
          ...finalize(perSeed.get(index)!),
          dimKey: member.asin,
          childKey: member.asin,
          image: '',
          parentAsin: member.parentAsin,
          asin: member.asin,
          msku: member.msku,
          spu: member.spu,
          spuName: member.spuName,
          category: member.category,
          brand: member.brand,
          store: member.store,
          owner: member.owner,
          country: member.country
        }
      })
      row.hasChildren = true
    }
    rows.push(row)
  })
  return rows.sort((a, b) => Number(b.profit) - Number(a.profit))
}

/** 区间内命中筛选的订单原子 */
function collectOrders(params: Record<string, any>): OrderRecord[] {
  const visible = new Set(visibleSeedIndexes(params))
  return eachDate(params.dateStart, params.dateEnd).flatMap((date) =>
    dayOrders(date).filter(
      (order) =>
        visible.has(order.seedIdx) &&
        matchOrderSource(order, params.orderSource) &&
        matchOrderKeyword(order, params)
    )
  )
}

/** 订单明细行：一单一行，多明细订单展开为行项目子行 */
function buildOrderRows(params: Record<string, any>): Record<string, any>[] {
  return collectOrders(params).map((order) => {
    const seed = SEEDS[order.seedIdx]
    const orderAt = dayjs(order.date)
      .add(hash(`h|${order.orderNo}`) % 24, 'hour')
      .add(hash(`m|${order.orderNo}`) % 60, 'minute')
    const shipTime = order.shipped ? orderAt.add(1, 'day').format('YYYY-MM-DD HH:mm:ss') : null
    const settleTime = order.settled ? orderAt.add(9, 'day').format('YYYY-MM-DD') : null
    const identity = {
      asin: seed.asin,
      msku: seed.msku,
      parentAsin: seed.parentAsin,
      spu: seed.spu,
      spuName: seed.spuName,
      category: seed.category,
      brand: seed.brand,
      store: seed.store,
      owner: seed.owner,
      country: seed.country,
      currency: params.currency || 'USD',
      orderTime: orderAt.format('YYYY-MM-DD HH:mm:ss'),
      payTime: orderAt.add(3, 'minute').format('YYYY-MM-DD HH:mm:ss'),
      shipTime,
      settleTime,
      settlementNo: order.settled ? `SET-${20000 + (hash(`s|${order.orderNo}`) % 400)}` : null
    }
    const row: Record<string, any> = {
      ...finalize(order),
      ...identity,
      dimKey: order.orderNo,
      orderNo: order.orderNo,
      salesWoW: null,
      profitWoW: null,
      marginChange: null
    }
    if (order.items.length > 1) {
      row.children = order.items.map((item, index) => ({
        ...finalize(item),
        ...identity,
        dimKey: `${order.orderNo}#${index}`,
        childKey: `${order.orderNo}#${index}`,
        orderNo: order.orderNo,
        salesWoW: null,
        profitWoW: null,
        marginChange: null
      }))
      row.hasChildren = true
    }
    return row
  })
}

/** 订单维度工具条 / 指标卡筛选（与指标卡计数用的是同一批谓词） */
function filterOrderRows(rows: Record<string, any>[], params: Record<string, any>): Record<string, any>[] {
  let list = rows
  if (params.settleStatus === 'settled') list = list.filter((row) => Boolean(row.settleTime))
  if (params.settleStatus === 'unsettled') list = list.filter((row) => !row.settleTime)
  if (params.metricCardFilter === 'loss') list = list.filter((row) => Number(row.profit) < 0)
  if (params.metricCardFilter === 'unshipped') list = list.filter((row) => !row.shipTime)
  if (params.metricCardFilter === 'offsite') {
    list = list.filter((row) => hash(`offsite|${row.orderNo}`) % 7 === 0)
  }
  return list
}

const normalizeTab = (tab?: string): string => (tab === 'sku' ? 'msku' : String(tab || 'dashboard'))

/** 按页签构造全量明细行（未分页；已应用全部筛选） */
function buildRows(params: Record<string, any>): Record<string, any>[] {
  const tab = normalizeTab(params.tab)
  if (tab === 'dashboard') {
    return filterProfitStatus(buildDashboardRows(params), params.profitStatus)
  }
  if (tab === 'order') {
    return filterProfitStatus(filterOrderRows(buildOrderRows(params), params), params.profitStatus)
  }
  return filterProfitStatus(buildProductRows(tab, params), params.profitStatus)
}

function sortRows(rows: Record<string, any>[], params: Record<string, any>): Record<string, any>[] {
  const field = params.sortField
  if (!field) return rows
  const dir = params.sortOrder === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = a[field]
    const bv = b[field]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') return (av - bv) * dir
    return String(av).localeCompare(String(bv)) * dir
  })
}

/* =========================================================================
 * 指标计算
 * =======================================================================*/

interface MetricContext {
  /** 区间聚合（与合计行同源） */
  total: Record<string, any>
  /** 该页签的明细行实体，风险类指标按它计数，保证「卡片数 = 筛选后条数」 */
  rows: Record<string, any>[]
  days: number
}

function buildMetricContext(params: Record<string, any>, rows?: Record<string, any>[]): MetricContext {
  const tab = normalizeTab(params.tab)
  const dates = eachDate(params.dateStart, params.dateEnd)
  const seedIdx = visibleSeedIndexes(params)
  const entities = rows ?? buildRows({ ...params, profitStatus: 'all' })

  // 订单 Tab 的合计需要跟随订单号关键词等订单级筛选，故直接由明细行汇总
  const total =
    tab === 'order'
      ? finalize(
          sumPrimitives(
            entities.map((row) => {
              const p = emptyPrimitives()
              PRIMITIVE_KEYS.forEach((key) => (p[key] = Number(row[key]) || 0))
              return p
            })
          )
        )
      : finalize(
          sumPrimitives(
            dates.flatMap((date) => {
              const bySeed = dayAggBySeed(date, params.orderSource)
              return seedIdx.map((index) => bySeed[index])
            })
          )
        )

  return { total, rows: entities, days: dates.length }
}

/** 单个指标取值（percent 一律返回比率，前端 ×100 展示） */
function metricValue(key: string, ctx: MetricContext): number | null {
  const t = ctx.total
  const lossRows = ctx.rows.filter((row) => profitTier(row) === 'loss')
  const lowRows = ctx.rows.filter((row) => profitTier(row) === 'low')

  switch (key) {
    case 'profit':
    case 'estimatedProfit':
      return t.profit
    case 'margin':
    case 'dailyMargin':
    case 'unitProfitRate':
    case 'estimatedMargin':
      return t.margin
    case 'sales':
    case 'todaySales':
      return t.sales
    case 'qty':
    case 'todayQty':
      return t.qty
    case 'shipQty':
      return t.shipQty
    case 'dailyProfit':
      return round2(safeDiv(t.profit, ctx.days))
    case 'avgOrder':
      return round2(safeDiv(t.sales, t.qty))
    case 'unitProfitAmount':
      return t.unitNetProfit
    case 'unitAd':
      return t.unitAd
    case 'unitPromoFee':
      return t.unitPromoFee
    case 'todayOrderCount':
      return ctx.rows.length
    case 'lossCount':
      return lossRows.length
    case 'lossAmount':
      return round2(lossRows.reduce((acc, row) => acc + Number(row.profit || 0), 0))
    case 'lowMarginCount':
      return lowRows.length
    case 'pendingAction':
      return lossRows.length + lowRows.length
    case 'lossOrderCount':
      return lossRows.length
    case 'offsiteOrderCount':
      return ctx.rows.filter((row) => hash(`offsite|${row.orderNo}`) % 7 === 0).length
    case 'unshippedOrderCount':
      return ctx.rows.filter((row) => !row.shipTime).length
    default:
      return t[key] == null ? null : Number(t[key])
  }
}

/* =========================================================================
 * 对外接口
 * =======================================================================*/

/** 明细：看板返回全量（前端自行切片），其余维度后端分页 */
export function detail(params: Record<string, any>) {
  const tab = normalizeTab(params.tab)
  const all = sortRows(buildRows(params), params)
  const pageNo = Math.max(1, Number(params.pageNo) || 1)
  const pageSize = Math.max(1, Number(params.pageSize) || 20)
  const paged = tab === 'dashboard' ? all : all.slice((pageNo - 1) * pageSize, pageNo * pageSize)
  const rows =
    params.withChildren === false
      ? paged.map(({ children, hasChildren, ...rest }) => rest)
      : paged
  return {
    currency: params.currency || 'USD',
    total: all.length,
    columns: params.columns || [],
    dynamicColumns: [],
    rows,
    summary: all.length ? buildMetricContext(params, all).total : {}
  }
}

/** 利润状态计数（订单 Tab 下拉右侧数量；不含 profitStatus 自身） */
export function profitStatusCount(params: Record<string, any>) {
  const rows = buildRows({ ...params, profitStatus: 'all' })
  const counts = { all: rows.length, loss: 0, low: 0, normal: 0, high: 0 }
  rows.forEach((row) => {
    counts[profitTier(row)] += 1
  })
  return counts
}

/** 核心指标条：按页签返回该维度的全量指标目录 + 值 / 环比 */
export function metrics(params: Record<string, any>) {
  const tab = normalizeTab(params.tab)
  const dim = toDimType(tab)
  const ctx = buildMetricContext(params)
  const seedKey = `${tab}|${params.dateStart}|${params.dateEnd}|${params.orderSource}`
  const cards = DIM_LAYOUT[dim].groups
    .flatMap((group) => group.fields)
    .map((key) => {
      const meta = META_MAP[key]
      return {
        metric: key,
        label: meta?.label || key,
        fmt: meta?.format || 'number',
        value: metricValue(key, ctx),
        wowRate: round4((rand(`${seedKey}|${key}|wow`) - 0.45) * 0.4)
      }
    })
  return { tab: params.tab || tab, currency: params.currency || 'USD', cards }
}

/** 趋势分析：逐桶取值，与看板明细行、合计行同源 */
export function trend(params: Record<string, any>) {
  const buckets = buildBuckets(params.dateStart, params.dateEnd, params.granularity)
  const requested: string[] = params.metrics?.length ? params.metrics : ['profit', 'margin', 'sales']
  const tab = normalizeTab(params.tab)

  // 逐桶上下文：风险类指标按「桶内商品对象」计数，趋势曲线才有形状
  const contexts = buckets.map((bucket) => {
    const bucketParams = {
      ...params,
      tab: tab === 'order' ? 'asin' : tab,
      dateStart: bucket.dateStart,
      dateEnd: bucket.dateEnd,
      profitStatus: 'all'
    }
    const rows = tab === 'dashboard' ? buildProductRows('asin', bucketParams) : buildRows(bucketParams)
    return buildMetricContext(bucketParams, rows)
  })

  const series = requested.map((metric) => {
    const meta = META_MAP[metric]
    const values = contexts.map((ctx) => metricValue(metric, ctx))
    const numeric = values.map((v) => Number(v) || 0)
    const max = Math.max(...numeric)
    const min = Math.min(...numeric)
    return {
      metric,
      label: meta?.label || metric,
      fmt: meta?.format || 'number',
      values,
      normalizedValues: numeric.map((v) =>
        max === min ? 100 : round2(((v - min) / (max - min)) * 100)
      )
    }
  })

  return {
    granularity: params.granularity || 'day',
    dateStart: buckets[0]?.dateStart || '',
    dateEnd: buckets[buckets.length - 1]?.dateEnd || '',
    columns: buckets.map((bucket) => ({
      key: bucket.key,
      label: bucket.label,
      dateStart: bucket.dateStart,
      dateEnd: bucket.dateEnd
    })),
    series
  }
}

/** 经营诊断：所选区间前后两段各自聚合后对比 */
export function diagnosis(params: Record<string, any>) {
  const dates = eachDate(params.dateStart, params.dateEnd)
  const mid = Math.max(1, Math.floor(dates.length / 2))
  const prevDates = dates.slice(0, mid)
  const currDates = dates.slice(mid)
  const rangeParams = (list: string[]) => ({
    ...params,
    tab: 'asin',
    dateStart: list[0],
    dateEnd: list[list.length - 1],
    profitStatus: 'all'
  })
  const prevCtx = buildMetricContext(rangeParams(prevDates))
  const currCtx = buildMetricContext(rangeParams(currDates))

  const items = ['margin', 'ad', 'sales', 'lossCount', 'lossAmount'].map((metric) => {
    const meta = META_MAP[metric]
    const prevValue = metricValue(metric, prevCtx)
    const currValue = metricValue(metric, currCtx)
    return {
      metric,
      label: meta?.label || metric,
      fmt: meta?.format || 'number',
      prevValue,
      currValue,
      changeRate: prevValue ? round4(safeDiv(Number(currValue) - Number(prevValue), Math.abs(Number(prevValue)))) : null
    }
  })
  return {
    prevRange: `${prevDates[0]} ~ ${prevDates[prevDates.length - 1]}`,
    currRange: `${currDates[0]} ~ ${currDates[currDates.length - 1]}`,
    items
  }
}

/** 看板首屏：指标 / 趋势 / 诊断共用一次快照 */
export function dashboardOverview(params: Record<string, any>) {
  return {
    metrics: metrics({ ...params, tab: 'dashboard' }),
    trend: trend({ ...params, tab: 'dashboard' }),
    diagnosis: diagnosis(params)
  }
}

/** 趋势「添加指标」指标池 */
export function metricPool(params: Record<string, any>) {
  const tab = normalizeTab(params.tab)
  const layout = DIM_LAYOUT[toDimType(tab)]
  return {
    tab: params.tab || tab,
    defaultMetrics: layout.defaults,
    metrics: layout.groups
      .flatMap((group) => group.fields)
      .map((key) => ({
        value: key,
        label: META_MAP[key]?.label || key,
        fmt: META_MAP[key]?.format || 'number'
      }))
  }
}

/** 后端二级宽表列名 → 前端费用字段（与 detail-table 的 PROP_WIDE_COLUMN 互为反向） */
const WIDE_COLUMN_TO_FIELD: Record<string, string> = {
  refund: 'refundTotal',
  promo_fee: 'promoFee',
  ad_cost: 'ad',
  storage_fee: 'storageFee',
  fba_ops_fee: 'fbaFulfillmentFee',
  platform_other_fee: 'platformOtherFee',
  fba_reimbursement: 'fbaInventoryReimbursement',
  other_income: 'otherIncome'
}

/** 下钻命中的那一行：取值必须与被点击单元格完全一致 */
function drilldownRow(params: Record<string, any>): Record<string, any> {
  const tab = normalizeTab(params.tab)
  const dimValue = params.dimValue == null ? '' : String(params.dimValue)

  if (tab === 'order') {
    // 订单行 / 行项目：orderNo 或 orderNo#index
    const [orderNo, lineIndex] = dimValue.split('#')
    if (orderNo) {
      const hit = collectOrders(params).find((order) => order.orderNo === orderNo)
      if (hit) return finalize(lineIndex == null ? hit : hit.items[Number(lineIndex)] || hit)
    }
    // 合计行：与列表同口径汇总
    const rows = filterProfitStatus(filterOrderRows(buildOrderRows(params), params), params.profitStatus)
    return finalize(
      sumPrimitives(
        rows.map((row) => {
          const p = emptyPrimitives()
          PRIMITIVE_KEYS.forEach((key) => (p[key] = Number(row[key]) || 0))
          return p
        })
      )
    )
  }

  // 看板行已把 dateStart / dateEnd 收窄到所在桶；商品行按 dimValue 命中的商品聚合
  const seedIdx = visibleSeedIndexes(params).filter((index) => {
    if (!dimValue) return true
    const seed = SEEDS[index]
    return [seed.parentAsin, seed.asin, seed.msku, seed.spu].includes(dimValue)
  })
  return finalize(
    sumPrimitives(
      eachDate(params.dateStart, params.dateEnd).flatMap((date) => {
        const bySeed = dayAggBySeed(date, params.orderSource)
        return seedIdx.map((index) => bySeed[index])
      })
    )
  )
}

/** 费用二级 → 三级下钻：各三级项之和严格等于父级单元格金额 */
export function feeDrilldown(params: Record<string, any>) {
  const wideColumn = String(params.wideColumn || '')
  const field = WIDE_COLUMN_TO_FIELD[wideColumn] || 'ad'
  const items = FIELD_DRILLDOWN[field] || []
  const row = drilldownRow(params)
  const target = round2(Number(row[field]) || 0)

  if (!items.length || Math.abs(target) < 0.01) {
    return { frontCaliberL2: field, wideColumn, total: target, expandable: false, items: [] }
  }

  const seedKey = `${wideColumn}|${params.tab}|${params.dimValue || 'all'}|${params.dateStart}|${params.dateEnd}`
  const weights = items.map(([, key]) => 0.4 + rand(`${seedKey}|${key}`) * 1.2)

  // 金额小、三级项多时（如订单行的 FBA 库存报销共 12 项）均摊后会有项被前端的 0.005 阈值丢掉，
  // 合计就对不上父级。「单个*」列的弹窗金额还会再除以销量，阈值相应放大。
  // 因此收敛参与拆分的项数，让每一项在两种展示口径下都留得住。
  const floor = 0.005 * Math.max(1, Number(row.qty) || 1) + 0.005
  let count = items.length
  let amounts = splitAmount(target, weights.slice(0, count))
  while (count > 1 && amounts.some((amount) => Math.abs(amount) < floor)) {
    count -= 1
    amounts = splitAmount(target, weights.slice(0, count))
  }

  return {
    frontCaliberL2: field,
    wideColumn,
    total: target,
    expandable: true,
    items: items.slice(0, count).map(([label], index) => ({
      feeItemL3: label,
      amount: amounts[index],
      incomeExpenseFlag: target >= 0 ? 1 : -1
    }))
  }
}

/** 利润拆解抽屉 */
export function breakdown(params: Record<string, any>) {
  const tab = normalizeTab(params.tab)
  const rows = buildRows({ ...params, profitStatus: 'all' })
  const dimValue = params.dimValue == null ? '' : String(params.dimValue)
  const hit = dimValue ? rows.find((row) => String(row.dimKey) === dimValue) : null
  const row = hit || buildMetricContext(params, rows).total

  const cell = (key: string, label: string) => ({
    key,
    label,
    amount: Number(row[key]) || 0,
    ratio: round4(safeDiv(Math.abs(Number(row[key]) || 0), Math.abs(Number(row.sales) || 0)))
  })

  return {
    title: dimValue || '汇总',
    currency: params.currency || 'USD',
    profit: row.profit,
    margin: row.margin,
    sales: row.sales,
    qty: row.qty,
    unitCards: [
      cell('unitPrice', '综合售价'),
      cell('unitNetProfit', '单个净利'),
      cell('unitAd', '单个广告费用'),
      cell('unitPromoFee', '单个促销费用')
    ],
    incomeExpense: [
      {
        categoryL1: '平台收入',
        subtotal: round2(Number(row.sales) + Number(row.buyerShipping)),
        items: [
          { frontCaliberL2: '销售额', wideColumn: 'sales', amount: row.sales, incomeExpenseFlag: 1 },
          { frontCaliberL2: '买家运费', wideColumn: 'buyer_shipping', amount: row.buyerShipping, incomeExpenseFlag: 1 }
        ]
      },
      {
        categoryL1: '平台支出',
        subtotal: round2(EXPENSE_KEYS.reduce((acc, key) => acc + Number(row[key] || 0), 0)),
        items: EXPENSE_KEYS.map((key) => ({
          frontCaliberL2: key,
          wideColumn: key,
          amount: Number(row[key]) || 0,
          expandable: Boolean(FIELD_DRILLDOWN[key]),
          incomeExpenseFlag: -1
        }))
      },
      {
        categoryL1: '库存成本',
        subtotal: row.totalCost,
        items: INVENTORY_COST_KEYS.map((key) => ({
          frontCaliberL2: key,
          wideColumn: key,
          amount: Number(row[key]) || 0,
          incomeExpenseFlag: -1
        }))
      },
      {
        categoryL1: '平台其他收入',
        subtotal: round2(OTHER_INCOME_KEYS.reduce((acc, key) => acc + Number(row[key] || 0), 0)),
        items: OTHER_INCOME_KEYS.map((key) => ({
          frontCaliberL2: key,
          wideColumn: key,
          amount: Number(row[key]) || 0,
          expandable: Boolean(FIELD_DRILLDOWN[key]),
          incomeExpenseFlag: 1
        }))
      }
    ],
    waterfall: [
      { label: '平台收入', value: round2(Number(row.sales) + Number(row.buyerShipping)), type: 'total' },
      ...EXPENSE_KEYS.map((key) => ({ label: key, value: Number(row[key]) || 0, type: 'expense' })),
      { label: '库存成本', value: row.totalCost, type: 'expense' },
      {
        label: '平台其他收入',
        value: round2(OTHER_INCOME_KEYS.reduce((acc, key) => acc + Number(row[key] || 0), 0)),
        type: 'income'
      },
      { label: '利润额', value: row.profit, type: 'total' }
    ],
    costRatio: EXPENSE_KEYS.map((key) => cell(key, key)),
    tab
  }
}

/** 费用分摊规则说明（静态口径） */
export function feeRules() {
  return {
    rules: [
      { feeName: '平台佣金', allocRule: '按订单行实收金额直接归属', timeRule: '按下单日归集' },
      { feeName: 'FBA配送费', allocRule: '按订单行直接归属', timeRule: '按发货日归集' },
      { feeName: '广告费用', allocRule: '按 ASIN 当日销售额占比分摊', timeRule: '按广告发生日归集' },
      { feeName: '仓储费', allocRule: '按 SKU 当月销量占比分摊', timeRule: '按账单所属月归集' },
      { feeName: '平台其他费用', allocRule: '店铺级费用按当日销售额占比分摊', timeRule: '按账单日归集' }
    ]
  }
}

/** 店铺下拉（受账号数据权限过滤；site 为空返回全部） */
export function storeOptions(params: Record<string, any>) {
  const sites: string[] = params.site || []
  const keyword = String(params.keyword || '').trim().toLowerCase()
  return STORES.filter((store) => !sites.length || sites.includes(store.countryCode)).filter(
    (store) => !keyword || store.name.toLowerCase().includes(keyword)
  )
}

/** 分类 / 品牌 / SPU 联动下拉 */
export function filterOptions(params: Record<string, any>) {
  const shopIds: number[] = params.shopIds || []
  const visible = shopIds.length ? SEEDS.filter((seed) => shopIds.includes(seed.shopId)) : SEEDS
  const categoryNames = new Set(visible.map((seed) => seed.category))
  const brandNames = new Set(visible.map((seed) => seed.brand))
  const spuMap = new Map(visible.map((seed) => [seed.spu, seed.spuName]))
  return {
    categories: CATEGORIES.filter((item) => categoryNames.has(item.name)),
    brands: BRANDS.filter((item) => brandNames.has(item.name)),
    spus: [...spuMap.entries()].map(([code, name], index) => ({ id: index + 1, name, code }))
  }
}
