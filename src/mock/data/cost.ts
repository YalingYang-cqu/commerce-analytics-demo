/**
 * 采购 / 物流 / SKU 成本三页的 Mock 数据生成器。
 *
 * 返回的都是「真实接口 data 字段」对应的负载（raw 结构），页面自身的 mapApiRow 会再映射，
 * 因此这里必须与页面消费的字段严格对齐（字段名来自各页 index.vue / mock-*.ts）。
 */
import dayjs from 'dayjs'
import { getPeriodLabelsFromQueryParams as purchasePeriodLabels } from '@/views/purchase/batch-cost/utils/period'
import { getPeriodLabelsFromQueryParams as logisticsPeriodLabels } from '@/views/logistics/batch-cost/utils/period'

const round2 = (n: number) => Math.round(n * 100) / 100

/** 稳定 hash，保证同一 key 每次生成一致的数据 */
function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function paginate<T>(list: T[], current: number, size: number) {
  const start = (current - 1) * size
  return list.slice(start, start + size)
}

function includesText(haystack: string | undefined, needle: unknown): boolean {
  if (!needle) return true
  return String(haystack ?? '')
    .toLowerCase()
    .includes(String(needle).toLowerCase())
}

/* =========================================================================
 * 采购批次成本
 * =======================================================================*/

interface CostSeed {
  sku: string
  spu: string
  skuName: string
  spuName: string
  manager: string
  suppliers: string[]
  baseUnit: number
  baseQty: number
}

const PURCHASE_SEEDS: CostSeed[] = [
  { sku: 'MK-CASE-001', spu: 'MK-CASE-SPU', skuName: '透明防摔壳-6.1寸', spuName: '透明防摔壳系列', manager: '张三', suppliers: ['兴源电子', '华强北科技'], baseUnit: 23.89, baseQty: 320 },
  { sku: 'MK-CABLE-002', spu: 'MK-CABLE-SPU', skuName: '快充数据线-1.5m', spuName: '快充数据线系列', manager: '李四', suppliers: ['深圳优品', '东莞智造'], baseUnit: 7.69, baseQty: 1200 },
  { sku: 'MK-CHARGER-003', spu: 'MK-CHARGER-SPU', skuName: 'PD快充头-30W', spuName: 'PD快充头系列', manager: '王五', suppliers: ['广州恒达', '兴源电子'], baseUnit: 18.5, baseQty: 580 },
  { sku: 'MK-STAND-004', spu: 'MK-STAND-SPU', skuName: '桌面支架-铝合金', spuName: '桌面支架系列', manager: '赵六', suppliers: ['惠州联创'], baseUnit: 32.0, baseQty: 210 },
  { sku: 'MK-PAD-005', spu: 'MK-PAD-SPU', skuName: '鼠标垫-大号', spuName: '鼠标垫套装系列', manager: '陈七', suppliers: ['佛山精工', '深圳优品'], baseUnit: 5.28, baseQty: 2500 },
  { sku: 'MK-HUB-006', spu: 'MK-HUB-SPU', skuName: 'Type-C扩展坞-7合1', spuName: 'Type-C扩展坞系列', manager: '刘八', suppliers: ['华强北科技', '东莞智造'], baseUnit: 45.6, baseQty: 150 },
  { sku: 'MK-SCREEN-007', spu: 'MK-SCREEN-SPU', skuName: '钢化膜-高清', spuName: '钢化膜系列', manager: '张三', suppliers: ['兴源电子'], baseUnit: 3.15, baseQty: 4800 },
  { sku: 'MK-POWER-008', spu: 'MK-POWER-SPU', skuName: '移动电源-20000mAh', spuName: '移动电源系列', manager: '李四', suppliers: ['广州恒达', '惠州联创'], baseUnit: 62.3, baseQty: 95 }
]

/** 依据统计指标换算单元格值 */
function metricValue(seed: CostSeed, factor: number, metric: string): number {
  const unit = round2(seed.baseUnit * factor)
  if (metric === 'quantity') return Math.round(seed.baseQty * factor)
  if (metric === 'totalPrice' || metric === 'totalLogisticsCost') return round2(unit * seed.baseQty)
  return unit
}

function buildPeriodDetails(seed: CostSeed, labels: string[], metric: string) {
  // labels 从新到旧；构造从旧到新的系数波动
  const h = hash(seed.sku)
  let prev: number | null = null
  // 反转成从旧到新，逐期计算环比后再映射回原顺序
  const chrono = [...labels].reverse().map((label, i) => {
    const factor = 0.9 + ((h + i * 13) % 20) / 100
    const value = metricValue(seed, factor, metric)
    const ringRatio = prev !== null && prev !== 0 ? round2(((value - prev) / prev) * 100) : null
    prev = value
    return { label, value, ringRatio }
  })
  const byLabel = new Map(chrono.map((d) => [d.label, d]))
  return labels.map((label) => byLabel.get(label)!)
}

function buildLatestCosts(seed: CostSeed, metric: string, channelKey: 'supplierName' | 'channelName') {
  const h = hash(seed.sku)
  return seed.suppliers.map((name, i) => {
    const factor = 0.95 + ((h + i * 7) % 12) / 100
    const price =
      channelKey === 'supplierName'
        ? metricValue(seed, factor, metric)
        : round2(seed.baseUnit * 0.2 * factor)
    const change = round2((((h + i * 5) % 9) - 4) * 0.4)
    return {
      [channelKey]: name,
      price,
      change,
      changeDate: dayjs().subtract((i + 1) * 4, 'day').format('YYYY-MM-DD'),
      costType: 'actual'
    }
  })
}

/** 仅按商品维度（sku/skuName/spu/spuName）过滤，不涉及负责人（采购/物流负责人口径不同） */
function filterSeedsByProduct(params: Record<string, any>): CostSeed[] {
  let list = [...PURCHASE_SEEDS]
  if (params.skuCode) list = list.filter((s) => includesText(s.sku, params.skuCode))
  if (params.skuName) list = list.filter((s) => includesText(s.skuName, params.skuName))
  if (params.spuCode) list = list.filter((s) => includesText(s.spu, params.spuCode))
  if (params.spuName) list = list.filter((s) => includesText(s.spuName, params.spuName))
  return list
}

/** 采购口径过滤：商品字段 + 采购负责人 */
function filterSeeds(params: Record<string, any>): CostSeed[] {
  let list = filterSeedsByProduct(params)
  const managers: string[] = params.purchaseManagerNameList || []
  if (managers.length) list = list.filter((s) => managers.includes(s.manager))
  return list
}

export function purchaseOverview(params: Record<string, any>) {
  const current = Number(params.currentPage ?? params.current ?? 1)
  const size = Number(params.pageSize ?? params.size ?? 20)
  const metric = params.metric || 'unitCost'
  const labels = purchasePeriodLabels(params, params.period || 'month')
  const all = filterSeeds(params).map((seed) => ({
    id: `purchase-${seed.sku}`,
    imageUrl: `https://picsum.photos/seed/${seed.sku}/80/80`,
    sku: seed.sku,
    spu: seed.spu,
    skuName: seed.skuName,
    spuName: seed.spuName,
    purchaseManager: JSON.stringify([seed.manager]),
    latestCosts: buildLatestCosts(seed, metric, 'supplierName'),
    periodDetails: buildPeriodDetails(seed, labels, metric)
  }))
  return { records: paginate(all, current, size), total: all.length, current, size }
}

export function purchaseFilterOptions() {
  const suppliers = [...new Set(PURCHASE_SEEDS.flatMap((s) => s.suppliers))]
  return {
    suppliers: suppliers.map((name, i) => ({ id: i + 1, name })),
    purchaseManagers: [...new Set(PURCHASE_SEEDS.map((s) => s.manager))],
    brands: ['MK', '兴源', '优品'].map((name, i) => ({ id: i + 1, name })),
    categories: ['3C 配件', '户外用品', '家居生活'].map((name, i) => ({ id: i + 1, name }))
  }
}

function findSeed(code: string): CostSeed | undefined {
  return PURCHASE_SEEDS.find((s) => s.sku === code || s.spu === code)
}

/** 采购订单明细 */
export function purchaseOrderDetails(params: Record<string, any>) {
  const seed = findSeed(params.code) || PURCHASE_SEEDS[0]
  const current = Number(params.currentPage ?? 1)
  const size = Number(params.pageSize ?? 20)
  const count = 8
  const records = Array.from({ length: count }, (_, i) => {
    const unitEx = round2(seed.baseUnit * 0.88 * (1 + (i % 3) * 0.03))
    const taxRate = 0.13
    const qty = 100 + ((hash(seed.sku) + i * 17) % 200)
    return {
      purchaseOrderNo: `PO2026${String(1000 + i)}`,
      sku: seed.sku,
      skuName: seed.skuName,
      orderReceiveTime: dayjs().subtract(i * 6, 'day').format('YYYY-MM-DD'),
      supplierName: seed.suppliers[i % seed.suppliers.length],
      orderStatus: ['已完成', '交货中', '待交货'][i % 3],
      purchaseQty: qty,
      deliveredQty: qty,
      pendingQty: 0,
      unitPriceExcludingTax: unitEx,
      taxRate,
      unitPriceIncludingTax: round2(unitEx * (1 + taxRate)),
      totalAmountExcludingTax: round2(unitEx * qty),
      taxAmount: round2(unitEx * qty * taxRate),
      totalAmount: round2(unitEx * qty * (1 + taxRate)),
      isOverdue: false,
      completeTime: dayjs().subtract(i * 6 - 2, 'day').format('YYYY-MM-DD'),
      expectDeliveryDate: dayjs().subtract(i * 6 - 3, 'day').format('YYYY-MM-DD'),
      itemDeliveryRate: 1,
      daysOverdue: 0,
      purchaseManager: JSON.stringify([seed.manager])
    }
  })
  const totalAmount = round2(records.reduce((s, r) => s + r.totalAmount, 0))
  const totalQty = records.reduce((s, r) => s + r.purchaseQty, 0)
  const supplierMap = new Map<string, { amount: number; qty: number }>()
  records.forEach((r) => {
    const cur = supplierMap.get(r.supplierName) || { amount: 0, qty: 0 }
    cur.amount += r.totalAmount
    cur.qty += r.purchaseQty
    supplierMap.set(r.supplierName, cur)
  })
  return {
    summary: {
      orderCount: records.length,
      purchaseQty: totalQty,
      deliveredQty: totalQty,
      totalAmount,
      weightedUnitPrice: totalQty ? round2(totalAmount / totalQty) : 0,
      supplierBreakdowns: [...supplierMap.entries()].map(([supplierName, v]) => ({
        supplierName,
        actualAmount: round2(v.amount),
        quantity: v.qty,
        weightedUnitPrice: v.qty ? round2(v.amount / v.qty) : 0
      }))
    },
    records: paginate(records, current, size),
    total: records.length
  }
}

/** 采购价格历史 */
export function purchasePriceHistory(params: Record<string, any>) {
  const seed = findSeed(params.code) || PURCHASE_SEEDS[0]
  const h = hash(seed.sku)
  const supplierHistories = seed.suppliers.map((supplierName, si) => {
    const versionCount = 5
    const prices: number[] = []
    let base = seed.baseUnit * (0.9 + si * 0.05)
    for (let i = 0; i < versionCount; i++) {
      base = round2(base * (0.97 + ((h + i * 7) % 8) / 100))
      prices.push(base)
    }
    const records = prices.map((price, i) => ({
      version: `v${i + 1}`,
      price,
      change: i === 0 ? null : round2(price - prices[i - 1]),
      effectiveDate: dayjs().subtract((versionCount - i) * 28, 'day').format('YYYY-MM-DD'),
      costType: 'actual'
    }))
    return {
      supplierName,
      latestPrice: prices[prices.length - 1],
      latestDate: records[records.length - 1].effectiveDate,
      records,
      maxPrice: Math.max(...prices),
      minPrice: Math.min(...prices),
      avgPrice: round2(prices.reduce((s, p) => s + p, 0) / prices.length)
    }
  })
  return { code: seed.sku, purchaseManager: seed.manager, supplierHistories }
}

/** 采购趋势分析 */
export function purchaseTrendAnalysis(params: Record<string, any>) {
  const seed = findSeed(params.code) || PURCHASE_SEEDS[0]
  const period = params.period || 'month'
  const labels = purchasePeriodLabels(params, period)
  const chrono = [...labels].reverse()
  const h = hash(seed.sku)
  const unitCost: number[] = []
  const quantity: number[] = []
  const totalPrice: number[] = []
  chrono.forEach((_, i) => {
    const factor = 0.9 + ((h + i * 11) % 20) / 100
    const u = round2(seed.baseUnit * factor)
    const q = Math.round(seed.baseQty * factor)
    unitCost.push(u)
    quantity.push(q)
    totalPrice.push(round2(u * q))
  })
  const metricList: string[] = params.metricList || ['unitCost']
  const supplierNames: string[] = params.supplierNameList?.length ? params.supplierNameList : seed.suppliers
  const compareSeries = supplierNames.flatMap((supplierName, si) =>
    metricList.map((metric) => ({
      supplierName,
      metric,
      values: chrono.map((_, i) => {
        const f = 0.85 + ((h + si * 5 + i * 3) % 22) / 100
        if (metric === 'quantity') return Math.round((seed.baseQty / supplierNames.length) * f)
        if (metric === 'totalPrice') return round2(seed.baseUnit * (seed.baseQty / supplierNames.length) * f)
        return round2(seed.baseUnit * f)
      })
    }))
  )
  const totalAmount = totalPrice.reduce((s, v) => s + v, 0)
  const supplierShares = seed.suppliers.map((supplierName, si) => {
    const ratio = round2(1 / seed.suppliers.length + (((h + si) % 5) - 2) / 100)
    return { supplierName, ratio, totalPrice: round2(totalAmount * ratio) }
  })
  const lastQ = quantity[quantity.length - 1] || 0
  const lastP = totalPrice[totalPrice.length - 1] || 0
  const prevP = totalPrice[totalPrice.length - 2] || 0
  return {
    code: seed.sku,
    periodLabels: chrono,
    series: { unitCost, quantity, totalPrice },
    compareSeries,
    supplierShares,
    kpis: {
      currentQuantity: lastQ,
      currentTotalPrice: lastP,
      currentUnitCost: unitCost[unitCost.length - 1] || 0,
      totalPriceRingRatio: prevP ? round2((lastP - prevP) / prevP) : null,
      dominantSupplierName: seed.suppliers[0],
      dominantSupplierRatio: supplierShares[0]?.ratio || 0
    }
  }
}

/* =========================================================================
 * 物流批次成本（结构与采购基本一致，供应商 → 渠道）
 * =======================================================================*/

const LOGISTICS_CHANNELS = ['海运普船', '海运快船', '空运', '美森快线']
const LOGISTICS_MANAGERS = ['物流负责人A', '物流负责人B', '物流负责人C']
const LOGISTICS_PROVIDERS = ['递四方', '燕文物流', '云途物流']
/** 物流状态码 ↔ 名称，与页面 mock-batch-detail.ts 的 STATUS_LIST 保持一致（过滤按数字码，展示用名称） */
const LOGISTICS_STATUS_DEFS = [
  { code: 2, name: '运输中' },
  { code: 1, name: '已发货' },
  { code: 3, name: '已签收' },
  { code: 4, name: '待签收' }
]

/** 稳定取得某 SKU/SPU 在种子表中的绝对索引，保证各物流接口的渠道/负责人口径一致 */
function seedIndex(code: string | undefined): number {
  if (!code) return 0
  const i = PURCHASE_SEEDS.findIndex((s) => s.sku === code || s.spu === code)
  return i < 0 ? 0 : i
}

/** 依据种子索引推导该商品的物流渠道集合（各接口共用，保证 channelName 对齐） */
function logisticsChannelsForSeed(idx: number): string[] {
  return [
    LOGISTICS_CHANNELS[idx % LOGISTICS_CHANNELS.length],
    LOGISTICS_CHANNELS[(idx + 1) % LOGISTICS_CHANNELS.length]
  ]
}

function logisticsManagerForSeed(idx: number): string {
  return LOGISTICS_MANAGERS[idx % LOGISTICS_MANAGERS.length]
}

export function logisticsOverview(params: Record<string, any>) {
  const current = Number(params.currentPage ?? params.current ?? 1)
  const size = Number(params.pageSize ?? params.size ?? 20)
  const metric = params.metric || 'unitLogisticsCost'
  const labels = logisticsPeriodLabels(params, params.period || 'month')
  let all = filterSeedsByProduct(params).map((seed) => {
    const idx = seedIndex(seed.sku)
    const chSeed: CostSeed = {
      ...seed,
      manager: logisticsManagerForSeed(idx),
      suppliers: logisticsChannelsForSeed(idx),
      baseUnit: round2(seed.baseUnit * 0.2)
    }
    return {
      id: `logistics-${seed.sku}`,
      imageUrl: `https://picsum.photos/seed/${seed.sku}-lg/80/80`,
      sku: seed.sku,
      spu: seed.spu,
      skuName: seed.skuName,
      spuName: seed.spuName,
      logisticsManager: chSeed.manager,
      latestCosts: buildLatestCosts(chSeed, metric, 'channelName'),
      periodDetails: buildPeriodDetails(chSeed, labels, metric)
    }
  })
  // 物流负责人过滤：需在映射出 logisticsManager 后再过滤
  const managerFilter: string[] = params.logisticsManagerNameList || []
  if (managerFilter.length) all = all.filter((r) => managerFilter.includes(r.logisticsManager))
  return { records: paginate(all, current, size), total: all.length, current, size }
}

export function logisticsFilterOptions() {
  return {
    logisticsChannels: LOGISTICS_CHANNELS.map((name, i) => ({ id: i + 1, name })),
    logisticsManagers: LOGISTICS_MANAGERS.map((name, i) => ({ id: i + 1, name })),
    brands: ['MK', '兴源', '优品'].map((name, i) => ({ id: i + 1, name })),
    categories: ['3C 配件', '户外用品', '家居生活'].map((name, i) => ({ id: i + 1, name }))
  }
}

/**
 * 物流批次明细（运单维度）。字段严格对齐页面映射器
 * src/views/logistics/batch-cost/utils/mock-batch-detail.ts 消费的接口字段。
 */
export function logisticsBatchDetails(params: Record<string, any>) {
  const idx = seedIndex(params.code)
  const seed = PURCHASE_SEEDS[idx]
  const channels = logisticsChannelsForSeed(idx)
  const current = Number(params.currentPage ?? 1)
  const size = Number(params.pageSize ?? 50)
  const h = hash(seed.sku + 'lg')
  let records = Array.from({ length: 8 }, (_, i) => {
    const channel = channels[i % channels.length]
    const shipped = 100 + ((h + i * 23) % 400)
    const unit = round2(seed.baseUnit * 0.2 * (0.9 + ((h + i * 7) % 15) / 100))
    const weight = round2(shipped * (0.3 + ((h + i) % 5) / 10))
    const shipDate = dayjs().subtract((i + 1) * 5, 'day').format('YYYY-MM-DD')
    const statusDef = LOGISTICS_STATUS_DEFS[i % LOGISTICS_STATUS_DEFS.length]
    const signed = statusDef.code === 3
    return {
      waybillNo: `IB2026${String(10000 + i)}`,
      sku: seed.sku,
      skuName: seed.skuName,
      shipTime: shipDate,
      shipmentNo: `FBA15K${String(1000 + i)}`,
      purchaseOrderNo: `PO2026${String(2000 + i)}`,
      logisticsProviderName: LOGISTICS_PROVIDERS[i % LOGISTICS_PROVIDERS.length],
      logisticsChannelName: channel,
      expectedArrivalTime: dayjs(shipDate).add(20, 'day').format('YYYY-MM-DD'),
      signTime: signed ? dayjs(shipDate).add(22, 'day').format('YYYY-MM-DD') : null,
      // status 返回展示名（页面映射器将其填入 statusName 直接展示）；statusCode 供数字口径过滤
      status: statusDef.name,
      statusCode: statusDef.code,
      shippedQty: shipped,
      totalVolume: round2(weight * 0.006),
      totalWeight: weight,
      unitLogisticsCost: unit,
      totalLogisticsCost: round2(unit * shipped),
      costType: 'actual',
      fromWarehouseName: ['深圳前置仓', '义乌集货仓'][i % 2],
      toWarehouseName: ['US-East(FBA)', 'US-West(FBA)'][i % 2],
      billingMethod: ['按重计费', '按体积计费'][i % 2],
      transportMode: channel.includes('空') ? '空运' : '海运',
      logisticsPlanName: `${channel}方案`
    }
  })
  const channelFilter: string[] = params.logisticsChannelNameList || []
  if (channelFilter.length) records = records.filter((r) => channelFilter.includes(r.logisticsChannelName))
  // statusList 由 UI 传入数字码（1/2/3/4）；兼容字符串码，统一按数字比对
  const statusFilter: Array<string | number> = params.statusList || []
  if (statusFilter.length) {
    const wanted = new Set(statusFilter.map((s) => Number(s)))
    records = records.filter((r) => wanted.has(r.statusCode))
  }

  const shippedTotal = records.reduce((s, r) => s + r.shippedQty, 0)
  const weightTotal = round2(records.reduce((s, r) => s + r.totalWeight, 0))
  const amountTotal = round2(records.reduce((s, r) => s + r.totalLogisticsCost, 0))
  const channelMap = new Map<string, { amount: number; qty: number }>()
  records.forEach((r) => {
    const cur = channelMap.get(r.logisticsChannelName) || { amount: 0, qty: 0 }
    cur.amount += r.totalLogisticsCost
    cur.qty += r.shippedQty
    channelMap.set(r.logisticsChannelName, cur)
  })
  return {
    summary: {
      batchCount: records.length,
      shippedQty: shippedTotal,
      chargeWeight: weightTotal,
      totalLogisticsCost: amountTotal,
      weightedUnitLogisticsCost: shippedTotal ? round2(amountTotal / shippedTotal) : 0,
      channelBreakdowns: [...channelMap.entries()].map(([channelName, v]) => ({
        channelName,
        amount: round2(v.amount),
        quantity: v.qty,
        weightedUnitLogisticsCost: v.qty ? round2(v.amount / v.qty) : 0
      }))
    },
    records: paginate(records, current, size),
    total: records.length
  }
}

/**
 * 物流头程价格历史（渠道维度）。字段对齐
 * src/views/logistics/batch-cost/utils/mock-price-history.ts：channelHistories[].{...}
 */
export function logisticsPriceHistory(params: Record<string, any>) {
  const idx = seedIndex(params.code)
  const seed = PURCHASE_SEEDS[idx]
  const channels = logisticsChannelsForSeed(idx)
  const h = hash(seed.sku + 'lgph')
  const channelHistories = channels.map((channelName, ci) => {
    const versionCount = 5
    const prices: number[] = []
    let base = seed.baseUnit * 0.2 * (0.9 + ci * 0.05)
    for (let i = 0; i < versionCount; i++) {
      base = round2(base * (0.95 + ((h + i * 7) % 9) / 100))
      prices.push(base)
    }
    const records = prices.map((price, i) => ({
      version: `v${i + 1}`,
      price,
      change: i === 0 ? null : round2(price - prices[i - 1]),
      effectiveDate: dayjs().subtract((versionCount - i) * 28, 'day').format('YYYY-MM-DD'),
      costType: 'actual'
    }))
    return {
      channelName,
      latestPrice: prices[prices.length - 1],
      latestDate: records[records.length - 1].effectiveDate,
      records,
      maxPrice: Math.max(...prices),
      minPrice: Math.min(...prices),
      avgPrice: round2(prices.reduce((s, p) => s + p, 0) / prices.length)
    }
  })
  return { code: seed.sku, logisticsManager: logisticsManagerForSeed(idx), channelHistories }
}

/**
 * 物流趋势分析（渠道维度）。字段对齐
 * src/views/logistics/batch-cost/utils/mock-trend-detail.ts：
 * series.{unitLogisticsCost,quantity,totalLogisticsCost}、channelShares、compareSeries[].channelName、kpis.*Logistics*。
 */
export function logisticsTrendAnalysis(params: Record<string, any>) {
  const idx = seedIndex(params.code)
  const seed = PURCHASE_SEEDS[idx]
  const period = params.period || 'month'
  const labels = logisticsPeriodLabels(params, period)
  const chrono = [...labels].reverse()
  const h = hash(seed.sku + 'lgtr')
  const unitLogisticsCost: number[] = []
  const quantity: number[] = []
  const totalLogisticsCost: number[] = []
  chrono.forEach((_, i) => {
    const factor = 0.9 + ((h + i * 11) % 20) / 100
    const u = round2(seed.baseUnit * 0.2 * factor)
    const q = Math.round(seed.baseQty * factor)
    unitLogisticsCost.push(u)
    quantity.push(q)
    totalLogisticsCost.push(round2(u * q))
  })
  const channels = logisticsChannelsForSeed(idx)
  const metricList: string[] = params.metricList || ['unitLogisticsCost']
  const channelNames: string[] = params.logisticsChannelNameList?.length
    ? params.logisticsChannelNameList
    : channels
  const compareSeries = channelNames.flatMap((channelName, si) =>
    metricList.map((metric) => ({
      channelName,
      metric,
      values: chrono.map((_, i) => {
        const f = 0.85 + ((h + si * 5 + i * 3) % 22) / 100
        if (metric === 'quantity') return Math.round((seed.baseQty / channelNames.length) * f)
        if (metric === 'totalLogisticsCost') {
          return round2(seed.baseUnit * 0.2 * (seed.baseQty / channelNames.length) * f)
        }
        return round2(seed.baseUnit * 0.2 * f)
      })
    }))
  )
  const totalAmount = totalLogisticsCost.reduce((s, v) => s + v, 0)
  const channelShares = channels.map((channelName, si) => {
    const ratio = round2(1 / channels.length + (((h + si) % 5) - 2) / 100)
    return { channelName, ratio, totalLogisticsCost: round2(totalAmount * ratio) }
  })
  const lastQ = quantity[quantity.length - 1] || 0
  const lastP = totalLogisticsCost[totalLogisticsCost.length - 1] || 0
  const prevP = totalLogisticsCost[totalLogisticsCost.length - 2] || 0
  return {
    code: seed.sku,
    periodLabels: chrono,
    series: { unitLogisticsCost, quantity, totalLogisticsCost },
    compareSeries,
    channelShares,
    kpis: {
      currentQuantity: lastQ,
      currentTotalLogisticsCost: lastP,
      currentUnitLogisticsCost: unitLogisticsCost[unitLogisticsCost.length - 1] || 0,
      totalLogisticsCostRingRatio: prevP ? round2((lastP - prevP) / prevP) : null,
      dominantChannelName: channels[0],
      dominantChannelRatio: channelShares[0]?.ratio || 0
    }
  }
}

/* =========================================================================
 * SKU 综合成本
 * =======================================================================*/

interface SkuSeed {
  sku: string
  skuName: string
  category: string
  stockQty: number
  earliest: number | null
  latest: number | null
  selling: number | null
  batches: number
  daysOfSupply: number | null
  dailyAvg: number | null
  alertType?: 'turnover' | 'oversold' | 'cost' | 'expire'
  alertDeltaPct?: number
}

const SKU_SEEDS: SkuSeed[] = [
  { sku: 'A001', skuName: '户外水壶-1L 银', category: '户外用品', stockQty: 1250, earliest: 35.2, latest: 38.5, selling: 35.2, batches: 3, daysOfSupply: 33, dailyAvg: 38 },
  { sku: 'A002', skuName: '营地灯-LED 充电款', category: '户外用品', stockQty: 500, earliest: 120.8, latest: 130.0, selling: 120.8, batches: 2, daysOfSupply: 25, dailyAvg: 20 },
  { sku: 'B385', skuName: '收纳盒-多功能折叠', category: '家居生活', stockQty: 25, earliest: 43.5, latest: 45.2, selling: 43.5, batches: 1, daysOfSupply: 62, dailyAvg: 0.4, alertType: 'turnover' },
  { sku: 'C112', skuName: '便携椅-户外折叠', category: '户外用品', stockQty: -25, earliest: null, latest: null, selling: null, batches: 0, daysOfSupply: null, dailyAvg: 12, alertType: 'oversold' },
  { sku: 'D720', skuName: '保温杯-500ml 黑', category: '家居生活', stockQty: 2400, earliest: 45.0, latest: 72.0, selling: 52.2, batches: 4, daysOfSupply: 52, dailyAvg: 46, alertType: 'cost', alertDeltaPct: 0.14 },
  { sku: 'E551', skuName: '折叠桌-户外野炊', category: '户外用品', stockQty: 680, earliest: 58.2, latest: 65.4, selling: 58.2, batches: 2, daysOfSupply: 45, dailyAvg: 15 },
  { sku: 'F889', skuName: '登山杖-碳纤维', category: '户外用品', stockQty: 320, earliest: 98.8, latest: 96.5, selling: 98.8, batches: 2, daysOfSupply: 62, dailyAvg: 5, alertType: 'expire' },
  { sku: 'G220', skuName: '收纳袋-旅行多色', category: '家居生活', stockQty: 60, earliest: 12.5, latest: 13.2, selling: 12.5, batches: 1, daysOfSupply: 10, dailyAvg: 6 },
  { sku: 'H330', skuName: '速干毛巾-纤维', category: '家居生活', stockQty: 880, earliest: 8.5, latest: 9.6, selling: 8.5, batches: 3, daysOfSupply: 38, dailyAvg: 23 },
  { sku: 'I440', skuName: '帐篷防潮垫-双人', category: '户外用品', stockQty: 150, earliest: 65.0, latest: 78.5, selling: 70.2, batches: 2, daysOfSupply: 28, dailyAvg: 5, alertType: 'cost', alertDeltaPct: 0.12 }
]

function filterSkuSeeds(params: Record<string, any>): SkuSeed[] {
  let list = [...SKU_SEEDS]
  const skuCodes: string[] = params.skuCodeList || []
  if (skuCodes.length) {
    list = list.filter((s) => skuCodes.some((code) => includesText(s.sku, code)))
  }
  const cats: string[] = params.categoryNameList || []
  if (cats.length) list = list.filter((s) => cats.includes(s.category))
  const alerts: string[] = params.alertTypeList || []
  if (alerts.length) list = list.filter((s) => (s.alertType ? alerts.includes(s.alertType) : alerts.includes('normal')))
  return list
}

export function skuOverview(params: Record<string, any>) {
  const current = Number(params.currentPage ?? 1)
  const size = Number(params.pageSize ?? 20)
  const all = filterSkuSeeds(params).map((s) => ({
    sku: s.sku,
    imageUrl: `https://picsum.photos/seed/${s.sku}/80/80`,
    skuName: s.skuName,
    categoryName: s.category,
    stockQty: s.stockQty,
    earliestBatchCost: s.earliest,
    latestBatchCost: s.latest,
    sellingBatchCost: s.selling,
    inStockBatchCount: s.batches,
    dailyAvgSales: s.dailyAvg,
    daysOfSupply: s.daysOfSupply,
    alertType: s.alertType || null,
    alertDeltaPct: s.alertDeltaPct ?? null
  }))
  return { records: paginate(all, current, size), total: all.length, current, size }
}

function buildSkuBatches(seed: SkuSeed) {
  if (seed.batches <= 0) return []
  const h = hash(seed.sku)
  const base = seed.earliest ?? 30
  return Array.from({ length: seed.batches }, (_, i) => {
    const purchase = round2(base * (1 + (((h + i * 31) % 13) - 4) / 100))
    const freight = round2(purchase * 0.15)
    const qty = 200 + ((h + i * 53) % 600)
    const isConsuming = i === 0
    const remain = isConsuming ? Math.floor(qty * 0.4) : qty
    const status = isConsuming ? 'partial' : 'active'
    const date = dayjs().subtract((seed.batches - i) * 35, 'day').format('YYYY-MM-DD')
    return {
      sku: seed.sku,
      batchSeq: i + 1,
      imageUrl: '',
      skuName: seed.skuName,
      fifoBatchNo: `BATCH-${date.replace(/-/g, '')}-0${i + 1}`,
      batchDate: date,
      batchQty: qty,
      remainQty: remain,
      unitPurchaseCost: purchase,
      unitLogisticsCost: freight,
      costType: 'actual',
      unitTotalCost: round2(purchase + freight),
      costDeltaPctVsPrev: i === 0 ? null : round2((((h + i) % 15) - 5) / 100),
      poNo: `PO-7878201${i + 1}`,
      waybillNo: `IB-7877580${i + 5}`,
      status,
      consumedPercent: qty ? round2((qty - remain) / qty) : 0
    }
  })
}

export function skuBatches(params: Record<string, any>) {
  const current = Number(params.currentPage ?? 1)
  const size = Number(params.pageSize ?? 20)
  const all = filterSkuSeeds(params).flatMap((seed) => buildSkuBatches(seed))
  return { records: paginate(all, current, size), total: all.length, current, size }
}

export function skuFilterOptions() {
  return {
    brands: ['MK', '兴源', '优品'].map((name) => ({ name })),
    categories: [...new Set(SKU_SEEDS.map((s) => s.category))].map((name) => ({ name }))
  }
}

export function skuFifoDetails(params: Record<string, any>) {
  const seed = SKU_SEEDS.find((s) => s.sku === params.skuCode) || SKU_SEEDS[0]
  let records = buildSkuBatches(seed)
  const statusList: string[] = params.statusList || []
  if (statusList.length) records = records.filter((r) => statusList.includes(r.status))
  const remaining = records.reduce((s, r) => s + r.remainQty, 0)
  const stockValue = round2(records.reduce((s, r) => s + r.remainQty * r.unitTotalCost, 0))
  const totalIn = records.reduce((s, r) => s + r.batchQty, 0)
  return {
    summary: {
      inStockBatchCount: records.filter((r) => r.status !== 'cleared').length,
      totalInQty: totalIn,
      currentStockQty: remaining,
      stockValue,
      weightedAvgCost: remaining ? round2(stockValue / remaining) : 0
    },
    records,
    total: records.length
  }
}

export function skuTrendAnalysis(params: Record<string, any>) {
  const seed = SKU_SEEDS.find((s) => s.sku === params.skuCode) || SKU_SEEDS[0]
  const h = hash(seed.sku)
  // 依据传入的日期范围生成 7 个周期标签（简单起见按月）
  const period = params.period || 'month'
  const labels = Array.from({ length: 7 }, (_, i) =>
    dayjs()
      .subtract(6 - i, period === 'day' ? 'day' : period === 'week' ? 'week' : 'month')
      .format(period === 'day' ? 'YYYY-MM-DD' : period === 'week' ? 'GGGG-[W]WW' : 'YYYY-MM')
  )
  const base = seed.earliest ?? 30
  const unitTotalCost = labels.map((_, i) => round2(base * 1.15 * (0.95 + ((h + i * 7) % 12) / 100)))
  const unitPurchaseCost = unitTotalCost.map((v) => round2(v / 1.15))
  const unitLogisticsCost = unitTotalCost.map((v, i) => round2(v - unitPurchaseCost[i]))
  const stockQty = labels.map((_, i) => Math.max(0, seed.stockQty - i * 30))
  const stockValue = stockQty.map((q, i) => round2(q * unitTotalCost[i]))
  const batches = buildSkuBatches(seed)
  const totalRemainValue = batches.reduce((s, b) => s + b.remainQty * b.unitTotalCost, 0) || 1
  const batchShares = batches.map((b) => ({
    batchSeq: b.batchSeq,
    fifoBatchNo: b.fifoBatchNo,
    status: b.status,
    batchRemainValue: round2(b.remainQty * b.unitTotalCost),
    ratio: round2((b.remainQty * b.unitTotalCost) / totalRemainValue)
  }))
  return {
    periodLabels: labels,
    series: { unitTotalCost, unitPurchaseCost, unitLogisticsCost, stockQty, stockValue },
    kpis: {
      totalInQty: batches.reduce((s, b) => s + b.batchQty, 0),
      currentStockQty: batches.reduce((s, b) => s + b.remainQty, 0),
      stockValue: round2(totalRemainValue),
      weightedAvgCost: round2(
        totalRemainValue / (batches.reduce((s, b) => s + b.remainQty, 0) || 1)
      )
    },
    batchShares
  }
}
