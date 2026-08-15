/**
 * 成本中心两个板块的 Mock 数据生成器：
 * - 板块一「批次结存」：批次台账 + 每个批次的消耗流水
 * - 板块二「平台库存成本流水」：每日 SKU 期初/各业务变动/期末 + 两级展开（库存流水 → 成本流水）
 *
 * 两个板块共用同一套仓库 / SKU 种子，保证「批次结存」与「期末结存的批次构成」讲的是同一个故事。
 * 所有数据由 hash 派生，同一入参每次返回一致；金额链路按「期初 + 各业务变动 = 期末」严格闭合，
 * 只在个别刻意构造的行上打破，用于演示对平失败的红色态。
 */
import dayjs from 'dayjs'

const round2 = (n: number) => Math.round(n * 100) / 100
const round6 = (n: number) => Math.round(n * 1e6) / 1e6

/** 稳定 hash，保证同一 key 每次生成一致的数据 */
function hash(str: string): number {
  let h = 0
  for (let i = 0; i < str.length; i++) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

function paginate<T>(list: T[], current: number, size: number): T[] {
  const start = (current - 1) * size
  return list.slice(start, start + size)
}

function includesText(haystack: unknown, needle: unknown): boolean {
  if (!needle) return true
  return String(haystack ?? '')
    .toLowerCase()
    .includes(String(needle).toLowerCase())
}

function inRange(value: string | undefined, range: unknown): boolean {
  const arr = Array.isArray(range) ? range : []
  if (!arr.length || !value) return true
  const [start, end] = arr
  if (start && dayjs(value).isBefore(dayjs(start), 'day')) return false
  if (end && dayjs(value).isAfter(dayjs(end), 'day')) return false
  return true
}

function hitList(value: unknown, list: unknown): boolean {
  const arr = Array.isArray(list) ? list : []
  if (!arr.length) return true
  return arr.includes(value as never)
}

/** 站点时间口径下的「今天」；Mock 固定用本地日期即可 */
const TODAY = dayjs().startOf('day')
const day = (offset: number) => TODAY.add(offset, 'day').format('YYYY-MM-DD')

/* =========================================================================
 * 基础维度
 * =======================================================================*/

export const COMPANIES = [
  { value: 'C001', label: '深圳迈科电子有限公司' },
  { value: 'C002', label: '香港迈科国际有限公司' }
]

export const PLATFORMS = [
  { value: 'FBA', label: '亚马逊 FBA' },
  { value: 'OVERSEA', label: '海外仓' },
  { value: 'VC', label: 'VC 虚拟仓' }
]

interface WarehouseSeed {
  code: string
  name: string
  platform: string
  site: string
  store: string
}

/** 站点中文名。CN 站在亚马逊后台就显示 CN，不译 */
const SITE_LABEL: Record<string, string> = {
  US: '美国',
  CA: '加拿大',
  IN: '印度',
  CN: 'CN'
}

/**
 * FBA 仓不是运营中心（ONT8 / LGB8 那种），而是「店铺 + 站点」一个仓：
 * 同一店铺在一个站点的 FBA 库存合并在一个仓里核算，仓名即 店铺名 + 站点仓。
 */
const fbaWarehouse = (store: string, storeCode: string, site: string): WarehouseSeed => ({
  code: `FBA-${storeCode}-${site}`,
  name: `${store}${SITE_LABEL[site] || site}仓`,
  platform: 'FBA',
  site,
  store
})

const WAREHOUSES: WarehouseSeed[] = [
  fbaWarehouse('full-sports-US', 'FSUS', 'US'),
  fbaWarehouse('full-sports-CA', 'FSCA', 'CA'),
  fbaWarehouse('Luckymore-store', 'LMS', 'CA'),
  fbaWarehouse('Full sports', 'FS', 'IN'),
  fbaWarehouse('Hilife Direct', 'HLD', 'IN'),
  fbaWarehouse('Mkeke', 'MKEKE', 'CN'),
  // 非 FBA 仓沿用仓库自己的名称，与店铺无关
  {
    code: 'OVS-US-LA01',
    name: '美西海外仓LA01',
    platform: 'OVERSEA',
    site: 'US',
    store: 'full-sports-US'
  },
  { code: 'VC-US-PO', name: 'VC虚拟仓-PO', platform: 'VC', site: 'US', store: 'Mkeke VC' }
]

interface SkuSeed {
  localSku: string
  skuName: string
  mskus: string[]
  asin: string
  fnsku: string
  purchasePrice: number
  logisticsPrice: number
  baseQty: number
}

const SKUS: SkuSeed[] = [
  {
    localSku: 'MK-CASE-001',
    skuName: '透明防摔壳-6.1寸',
    mskus: ['MK-CASE-001-US', 'MK-CASE-001-US-FBM'],
    asin: 'B0CASE00001',
    fnsku: 'X001CASE01',
    purchasePrice: 23.89,
    logisticsPrice: 6.42,
    baseQty: 320
  },
  {
    localSku: 'MK-CABLE-002',
    skuName: '快充数据线-1.5m',
    mskus: ['MK-CABLE-002-US'],
    asin: 'B0CABLE0002',
    fnsku: 'X002CABL02',
    purchasePrice: 7.69,
    logisticsPrice: 2.15,
    baseQty: 1200
  },
  {
    localSku: 'MK-CHARGER-003',
    skuName: 'PD快充头-30W',
    mskus: ['MK-CHARGER-003-US', 'MK-CHARGER-003-CA'],
    asin: 'B0CHRG00003',
    fnsku: 'X003CHRG03',
    purchasePrice: 18.5,
    logisticsPrice: 4.88,
    baseQty: 580
  },
  {
    localSku: 'MK-STAND-004',
    skuName: '桌面支架-铝合金',
    mskus: ['MK-STAND-004-US'],
    asin: 'B0STAND0004',
    fnsku: 'X004STND04',
    purchasePrice: 32.0,
    logisticsPrice: 9.6,
    baseQty: 210
  },
  {
    localSku: 'MK-PAD-005',
    skuName: '鼠标垫-大号',
    mskus: ['MK-PAD-005-US'],
    asin: 'B0PAD000005',
    fnsku: 'X005PAD005',
    purchasePrice: 5.28,
    logisticsPrice: 1.72,
    baseQty: 2500
  },
  {
    localSku: 'MK-HUB-006',
    skuName: 'Type-C扩展坞-7合1',
    mskus: ['MK-HUB-006-US', 'MK-HUB-006-IN'],
    asin: 'B0HUB000006',
    fnsku: 'X006HUB006',
    purchasePrice: 45.6,
    logisticsPrice: 11.2,
    baseQty: 150
  },
  {
    localSku: 'MK-SCREEN-007',
    skuName: '钢化膜-高清',
    mskus: ['MK-SCREEN-007-US'],
    asin: 'B0SCRN00007',
    fnsku: 'X007SCRN07',
    purchasePrice: 3.15,
    logisticsPrice: 0.86,
    baseQty: 4800
  },
  {
    localSku: 'MK-POWER-008',
    skuName: '移动电源-20000mAh',
    mskus: ['MK-POWER-008-US'],
    asin: 'B0PWR000008',
    fnsku: 'X008PWR008',
    purchasePrice: 62.3,
    logisticsPrice: 15.4,
    baseQty: 95
  }
]

/** 批次类型：BT 采购物流 / DT 调拨派生 / RB 退回入库 / AB 调整入库 / NB 无源签收 / PV 负库存暂估 */
type BatchType = 'BT' | 'DT' | 'RB' | 'AB' | 'NB' | 'PV'

/** 有成本溯源的批次类型：只有这两类才保留采购 / 物流明细 ID */
const TRACEABLE_TYPES: BatchType[] = ['BT', 'DT']

/* =========================================================================
 * 板块一：批次结存
 * =======================================================================*/

export interface BatchRaw {
  batchId: string
  batchNo: string
  batchType: BatchType
  companyId: string
  companyName: string
  platform: string
  storeName: string
  siteName: string
  warehouseCode: string
  warehouseName: string
  localSku: string
  skuName: string
  msku: string
  asin: string
  invAttr: 'GOOD' | 'DEFECTIVE'
  stockStatus: 'IN_TRANSIT' | 'IN_STOCK' | 'CLOSED'
  consumeStatus: 'PENDING' | 'CONSUMING' | 'EXHAUSTED'
  shippedQty: number
  receivedQty: number
  balanceQty: number
  purchasePrice: number
  logisticsPrice: number
  balancePurchaseAmount: number
  balanceLogisticsAmount: number
  shipTime: string
  inboundDate: string
  lastConsumeDate: string
  parentBatchNo: string
  rootBatchNo: string
  platformDocNo: string
  purchaseDetailId: string
  logisticsDetailId: string
  isEstimated: boolean
  /** 结存为 0 但金额不为 0 等需要标红的异常 */
  exceptionFlag: boolean
  /** 库存日期口径下的日终快照日期 */
  snapshotDate?: string
}

function pickBatchType(h: number, index: number): BatchType {
  const slot = (h + index) % 12
  if (slot < 6) return 'BT'
  if (slot < 8) return 'DT'
  if (slot < 9) return 'RB'
  if (slot < 10) return 'AB'
  if (slot < 11) return 'NB'
  return 'PV'
}

function buildBatches(): BatchRaw[] {
  const list: BatchRaw[] = []
  let seq = 0
  WAREHOUSES.forEach((wh) => {
    SKUS.forEach((sku) => {
      const total = 3 + (hash(`${wh.code}${sku.localSku}`) % 2)
      for (let k = 0; k < total; k++) {
        seq += 1
        const key = `${wh.code}-${sku.localSku}-${k}`
        const h = hash(key)
        const batchType = pickBatchType(h, k)
        // 越靠后的 k 越新：k=0 最老（多已耗尽），最后一个多为在途
        const isTransit = k === total - 1 && (h % 3 === 0 || batchType === 'BT')
        // 覆盖 0-30 / 31-60 / 61-90 / 超90 天四个库龄区间，用于验证库龄分布与超龄下钻。
        const shipOffset = -(130 - k * 30 + (h % 9))
        const inboundOffset = shipOffset + 22 + (h % 6)
        const shippedQty = Math.round(sku.baseQty * (0.4 + (h % 40) / 100))
        const receivedQty = isTransit ? 0 : Math.max(1, shippedQty - (h % 5))
        const exhausted = !isTransit && k === 0 && h % 4 !== 0
        const balanceQty = isTransit
          ? 0
          : exhausted
            ? 0
            : Math.max(1, Math.round(receivedQty * (0.15 + (h % 55) / 100)))
        const purchasePrice = round6(sku.purchasePrice * (0.92 + (h % 17) / 100))
        const logisticsPrice = round6(sku.logisticsPrice * (0.9 + (h % 21) / 100))
        // 演示用异常：某个已耗尽批次留下未分摊的采购尾差
        const exceptionFlag = exhausted && h % 7 === 0
        const invAttr: BatchRaw['invAttr'] = h % 9 === 0 ? 'DEFECTIVE' : 'GOOD'
        const mskuIdx = h % sku.mskus.length
        const noSource = !TRACEABLE_TYPES.includes(batchType)
        const batchNo = isTransit
          ? ''
          : `${batchType}${dayjs(day(inboundOffset)).format('YYYYMMDD')}${String(seq).padStart(4, '0')}`

        list.push({
          batchId: `BI${String(100000 + seq)}`,
          batchNo,
          batchType,
          companyId: 'C001',
          companyName: '深圳迈科电子有限公司',
          platform: wh.platform,
          storeName: wh.store,
          siteName: wh.site,
          warehouseCode: wh.code,
          warehouseName: wh.name,
          localSku: sku.localSku,
          skuName: sku.skuName,
          // 无源批次可能跨 MSKU 聚合，MSKU / ASIN 置空
          msku: noSource ? '' : sku.mskus[mskuIdx],
          asin: noSource ? '' : sku.asin,
          invAttr,
          stockStatus: isTransit ? 'IN_TRANSIT' : exhausted ? 'CLOSED' : 'IN_STOCK',
          consumeStatus: isTransit
            ? 'PENDING'
            : exhausted
              ? 'EXHAUSTED'
              : balanceQty === receivedQty
                ? 'PENDING'
                : 'CONSUMING',
          shippedQty,
          receivedQty,
          balanceQty,
          purchasePrice,
          logisticsPrice,
          balancePurchaseAmount: exceptionFlag ? 0.35 : round2(balanceQty * purchasePrice),
          balanceLogisticsAmount: round2(balanceQty * logisticsPrice),
          shipTime: day(shipOffset),
          inboundDate: isTransit ? '' : day(inboundOffset),
          lastConsumeDate:
            isTransit || balanceQty === receivedQty ? '' : day(inboundOffset + 12 + (h % 20)),
          parentBatchNo:
            batchType === 'DT'
              ? `BT${dayjs(day(shipOffset)).format('YYYYMMDD')}${String(seq + 500).padStart(4, '0')}`
              : '',
          rootBatchNo:
            batchType === 'DT'
              ? `BT${dayjs(day(shipOffset - 30)).format('YYYYMMDD')}${String(seq + 900).padStart(4, '0')}`
              : '',
          platformDocNo:
            batchType === 'BT' || batchType === 'DT'
              ? `FBA15${String(h % 100000).padStart(5, '0')}`
              : '',
          purchaseDetailId: noSource ? '' : `PD${String(h % 900000).padStart(6, '0')}`,
          logisticsDetailId: noSource ? '' : `LD${String((h * 3) % 900000).padStart(6, '0')}`,
          isEstimated: batchType === 'PV' || batchType === 'NB',
          exceptionFlag
        })
      }
    })
  })
  return list
}

const BATCHES = buildBatches()
const BATCH_INDEX = new Map(BATCHES.map((b) => [b.batchId, b]))

/** 业务类型字典（两个板块共用） */
export const BIZ_TYPES = [
  { value: 'RECEIPT', label: '货件入库' },
  { value: 'SALE_OUT', label: '销售出库' },
  { value: 'SALE_RETURN', label: '销售退货' },
  { value: 'REMOVAL', label: '移除出库' },
  { value: 'STOCKTAKE', label: '库存盘点' },
  { value: 'OTHER_ADJUST', label: '其他调整' }
]

/** ioType 一律给二级出入库类型的编码，中文名由前端字典 BIZ_IO_TREE 统一翻译 */
const CONSUME_BIZ = [
  { bizType: 'SALE_OUT', ioType: 'SALE_OUT_SHIP', pricing: 'FIFO', source: '批次原值' },
  { bizType: 'SALE_OUT', ioType: 'SALE_OUT_SHIP', pricing: 'FIFO', source: '批次原值' },
  { bizType: 'REMOVAL', ioType: 'REMOVAL_DISPOSE', pricing: 'FIFO', source: '批次原值' },
  { bizType: 'STOCKTAKE', ioType: 'STOCKTAKE_OUT', pricing: 'FIFO', source: '批次原值' },
  { bizType: 'OTHER_ADJUST', ioType: 'OTHER_ADJUST_OUT', pricing: 'FIFO', source: '批次原值' }
]

export interface BatchConsumeRaw {
  costFlowNo: string
  invFlowNo: string
  invDate: string
  docTime: string
  bizType: string
  ioType: string
  bizNo: string
  msku: string
  changeQty: number
  changePurchasePrice: number
  changeLogisticsPrice: number
  changePurchaseAmount: number
  changeLogisticsAmount: number
  pricingMethod: string
  costSource: string
  isEstimated: boolean
}

/** 单批次消耗流水：所有行数量之和 = 签收数量 − 结存数量 */
function buildConsumeFlow(batch: BatchRaw): BatchConsumeRaw[] {
  const consumed = batch.receivedQty - batch.balanceQty
  if (batch.stockStatus === 'IN_TRANSIT' || consumed <= 0) return []
  const h = hash(batch.batchId)
  const rows: BatchConsumeRaw[] = []
  const count = 3 + (h % 5)
  let left = consumed
  for (let i = 0; i < count; i++) {
    const isLast = i === count - 1
    const part = isLast
      ? left
      : Math.max(1, Math.round((consumed / count) * (0.6 + ((h + i * 7) % 80) / 100)))
    const qty = Math.min(left, part)
    if (qty <= 0) break
    left -= qty
    const biz = CONSUME_BIZ[(h + i) % CONSUME_BIZ.length]
    const dateStr = dayjs(batch.inboundDate)
      .add(3 + i * (2 + (h % 5)), 'day')
      .format('YYYY-MM-DD')
    const invDate = dayjs(dateStr).isAfter(TODAY) ? TODAY.format('YYYY-MM-DD') : dateStr
    rows.push({
      costFlowNo: `CF${dayjs(invDate).format('YYYYMMDD')}${String((h + i * 13) % 100000).padStart(5, '0')}`,
      invFlowNo: `IF${dayjs(invDate).format('YYYYMMDD')}${String((h + i * 29) % 100000).padStart(5, '0')}`,
      invDate,
      docTime: `${invDate} ${String(8 + (i % 12)).padStart(2, '0')}:${String((h + i * 11) % 60).padStart(2, '0')}:00`,
      bizType: biz.bizType,
      ioType: biz.ioType,
      bizNo:
        biz.bizType === 'SALE_OUT'
          ? `112-${String(1000000 + ((h + i * 37) % 8999999))}-${String(((h + i) % 9000000) + 1000000)}`
          : `ADJ${String((h + i * 17) % 900000).padStart(6, '0')}`,
      msku: batch.msku || SKUS.find((s) => s.localSku === batch.localSku)?.mskus[0] || '',
      changeQty: -qty,
      changePurchasePrice: batch.purchasePrice,
      changeLogisticsPrice: batch.logisticsPrice,
      changePurchaseAmount: -round2(qty * batch.purchasePrice),
      changeLogisticsAmount: -round2(qty * batch.logisticsPrice),
      pricingMethod: biz.pricing,
      costSource: batch.isEstimated ? '暂估价' : biz.source,
      isEstimated: batch.isEstimated
    })
  }
  return rows.sort((a, b) => (a.docTime < b.docTime ? -1 : 1))
}

/** Tab → 库存 / 消耗状态过滤 */
function filterByTab(list: BatchRaw[], tab: string): BatchRaw[] {
  if (tab === 'inStock') {
    return list.filter((b) => b.stockStatus === 'IN_STOCK' && b.consumeStatus !== 'EXHAUSTED')
  }
  if (tab === 'inTransit') return list.filter((b) => b.stockStatus === 'IN_TRANSIT')
  if (tab === 'exhausted') {
    return list.filter((b) => b.consumeStatus === 'EXHAUSTED' || b.stockStatus === 'CLOSED')
  }
  return list
}

/** 库存日期选范围时取最新日；不选则取系统最新可用日期 */
function resolveBatchSnapshotDate(params: Record<string, any>): string {
  const range = Array.isArray(params.dateRange) ? params.dateRange : []
  const selected = params.dateType === 'inventoryDate' ? range[1] || range[0] : ''
  if (!selected) return TODAY.format('YYYY-MM-DD')
  return dayjs(selected).isAfter(TODAY, 'day')
    ? TODAY.format('YYYY-MM-DD')
    : dayjs(selected).format('YYYY-MM-DD')
}

/**
 * 由当前批次状态 + 消耗流水回溯某个库存日期的日终快照。
 * 真实接口应读批次日快照表，Mock 用同一批原子数据还原，保证 KPI 与列表自洽。
 */
function materializeBatchAtDate(batch: BatchRaw, snapshotDate: string): BatchRaw | null {
  const asOf = dayjs(snapshotDate)
  if (dayjs(batch.shipTime).isAfter(asOf, 'day')) return null

  const hasArrived = !!batch.inboundDate && !dayjs(batch.inboundDate).isAfter(asOf, 'day')
  if (!hasArrived) {
    return {
      ...batch,
      batchNo: '',
      stockStatus: 'IN_TRANSIT',
      consumeStatus: 'PENDING',
      receivedQty: 0,
      balanceQty: 0,
      balancePurchaseAmount: 0,
      balanceLogisticsAmount: 0,
      inboundDate: '',
      lastConsumeDate: '',
      exceptionFlag: false,
      snapshotDate
    }
  }

  const consumedRows = buildConsumeFlow(batch).filter(
    (row) => !dayjs(row.invDate).isAfter(asOf, 'day')
  )
  const consumedQty = consumedRows.reduce((total, row) => total + Math.abs(row.changeQty), 0)
  const balanceQty = batch.receivedQty - consumedQty
  const isLatest = snapshotDate === TODAY.format('YYYY-MM-DD')
  const exhausted = balanceQty === 0

  return {
    ...batch,
    stockStatus: exhausted ? 'CLOSED' : 'IN_STOCK',
    consumeStatus: exhausted ? 'EXHAUSTED' : consumedQty > 0 ? 'CONSUMING' : 'PENDING',
    balanceQty,
    balancePurchaseAmount: isLatest
      ? batch.balancePurchaseAmount
      : round2(balanceQty * batch.purchasePrice),
    balanceLogisticsAmount: isLatest
      ? batch.balanceLogisticsAmount
      : round2(balanceQty * batch.logisticsPrice),
    lastConsumeDate: consumedRows.at(-1)?.invDate || '',
    exceptionFlag: isLatest ? batch.exceptionFlag : false,
    snapshotDate
  }
}

function hitAgeRange(ageDays: number | null, range: unknown): boolean {
  if (!range) return true
  if (ageDays === null || ageDays < 0) return false
  if (range === '0-30') return ageDays <= 30
  if (range === '31-60') return ageDays >= 31 && ageDays <= 60
  if (range === '61-90') return ageDays >= 61 && ageDays <= 90
  if (range === '90-') return ageDays > 90
  if (range === '30-45') return ageDays >= 30 && ageDays <= 45
  if (range === '45-') return ageDays > 45
  return true
}

function filterBatches(params: Record<string, any>): BatchRaw[] {
  const snapshotDate = resolveBatchSnapshotDate(params)
  let list = BATCHES.map((batch) => materializeBatchAtDate(batch, snapshotDate)).filter(
    (batch): batch is BatchRaw => !!batch
  )
  list = filterByTab(list, params.tab || 'all')
  if (params.platform) list = list.filter((b) => b.platform === params.platform)
  if (params.localSku) list = list.filter((b) => b.localSku === params.localSku)
  if (params.warehouseCode) list = list.filter((b) => b.warehouseCode === params.warehouseCode)
  list = list.filter((b) => hitList(b.storeName, params.storeIdList))
  list = list.filter((b) => hitList(b.warehouseCode, params.warehouseCodeList))
  list = list.filter((b) => hitList(b.batchType, params.batchTypeList))
  list = list.filter((b) => hitList(b.consumeStatus, params.consumeStatusList))
  if (params.invAttr) list = list.filter((b) => b.invAttr === params.invAttr)
  if (params.hasEstimated === 'Y') list = list.filter((b) => b.isEstimated)
  if (params.hasEstimated === 'N') list = list.filter((b) => !b.isEstimated)
  if (params.onlyException) list = list.filter((b) => b.exceptionFlag)
  if (params.costStatus === 'CONFIRMED') list = list.filter((b) => !b.isEstimated)
  if (params.costStatus === 'ESTIMATED') list = list.filter((b) => b.isEstimated)
  if (params.costStatus === 'MISSING') list = list.filter((b) => b.purchasePrice === 0)
  if (params.dateType === 'inboundDate') {
    list = list.filter((b) => inRange(b.inboundDate, params.dateRange))
  }
  if (params.dateType === 'shipDate') {
    list = list.filter((b) => inRange(b.shipTime, params.dateRange))
  }
  list = list.filter((b) => {
    const baseDate = params.tab === 'inTransit' ? b.shipTime : b.inboundDate
    const ageDays = baseDate ? dayjs(snapshotDate).diff(dayjs(baseDate), 'day') : null
    return hitAgeRange(ageDays, params.ageRange)
  })
  const keyword = params.keyword
  if (keyword) {
    const type = params.keywordType || 'batchNo'
    list = list.filter((b) => {
      if (type === 'batchNo') return includesText(b.batchNo, keyword)
      if (type === 'batchId') return includesText(b.batchId, keyword)
      if (type === 'localSku')
        return includesText(b.localSku, keyword) || includesText(b.skuName, keyword)
      if (type === 'msku') return includesText(b.msku, keyword)
      if (type === 'platformDocNo') return includesText(b.platformDocNo, keyword)
      // 单号类关键字落在消耗流水上：批次命中 = 它的流水里有命中行
      if (type === 'bizNo' || type === 'invFlowNo' || type === 'costFlowNo') {
        return buildConsumeFlow(b).some((f) =>
          includesText(f[type as 'bizNo' | 'invFlowNo' | 'costFlowNo'], keyword)
        )
      }
      return true
    })
  }
  return list
}

function sortBatches(list: BatchRaw[], params: Record<string, any>): BatchRaw[] {
  const tab = params.tab || 'all'
  const prop: string =
    params.sortProp ||
    (tab === 'inTransit' ? 'shipTime' : tab === 'exhausted' ? 'lastConsumeDate' : 'inboundDate')
  const asc = params.sortOrder ? params.sortOrder === 'ascending' : tab === 'inStock'
  return [...list].sort((a, b) => {
    const av = (a as unknown as Record<string, any>)[prop]
    const bv = (b as unknown as Record<string, any>)[prop]
    if (typeof av === 'number' && typeof bv === 'number') return asc ? av - bv : bv - av
    return asc
      ? String(av ?? '').localeCompare(String(bv ?? ''))
      : String(bv ?? '').localeCompare(String(av ?? ''))
  })
}

/** 批次结存主表 */
export const batchBalance = (params: Record<string, any>) => {
  const current = Number(params.currentPage) || 1
  const size = Number(params.pageSize) || 20
  const list = sortBatches(filterBatches(params), params)
  return {
    records: paginate(list, current, size),
    total: list.length,
    current,
    size
  }
}

/** 按本地SKU + 仓库汇总主表 */
export const batchBalanceGroup = (params: Record<string, any>) => {
  const current = Number(params.currentPage) || 1
  const size = Number(params.pageSize) || 20
  const snapshotDate = resolveBatchSnapshotDate(params)
  const snapshotDay = dayjs(snapshotDate)
  const batches = filterBatches(params)

  type GroupAgg = {
    localSku: string
    skuName: string
    warehouseCode: string
    warehouseName: string
    companyName: string
    platforms: Set<string>
    batchCnt: number
    availableBatchCnt: number
    estimatedBatchCnt: number
    exceptionBatchCnt: number
    shippedQty: number
    receivedQty: number
    consumedQty: number
    balanceQty: number
    goodQty: number
    defectiveQty: number
    balancePurchaseAmount: number
    balanceLogisticsAmount: number
    costWeightQty: number
    costWeightAmount: number
    costWeightPurchase: number
    costWeightLogistics: number
    overAgeQty: number
    inboundDates: string[]
    /** FIFO 头：消耗中且入仓最早 */
    consumingBatch: {
      inboundDate: string
      unitCost: number
      purchasePrice: number
      logisticsPrice: number
    } | null
    /** 最近入仓批次 */
    latestBatch: {
      inboundDate: string
      unitCost: number
      purchasePrice: number
      logisticsPrice: number
    } | null
  }

  const groups = new Map<string, GroupAgg>()

  batches.forEach((b) => {
    const key = `${b.localSku}|${b.warehouseCode}`
    let g = groups.get(key)
    if (!g) {
      g = {
        localSku: b.localSku,
        skuName: b.skuName,
        warehouseCode: b.warehouseCode,
        warehouseName: b.warehouseName,
        companyName: b.companyName,
        platforms: new Set(),
        batchCnt: 0,
        availableBatchCnt: 0,
        estimatedBatchCnt: 0,
        exceptionBatchCnt: 0,
        shippedQty: 0,
        receivedQty: 0,
        consumedQty: 0,
        balanceQty: 0,
        goodQty: 0,
        defectiveQty: 0,
        balancePurchaseAmount: 0,
        balanceLogisticsAmount: 0,
        costWeightQty: 0,
        costWeightAmount: 0,
        costWeightPurchase: 0,
        costWeightLogistics: 0,
        overAgeQty: 0,
        inboundDates: [],
        consumingBatch: null,
        latestBatch: null
      }
      groups.set(key, g)
    }
    const unitCost = Math.round((b.purchasePrice + b.logisticsPrice) * 1e6) / 1e6
    const consumedQty = -(Math.max(0, b.receivedQty - b.balanceQty))
    g.platforms.add(b.platform)
    g.batchCnt += 1
    if (b.balanceQty > 0) g.availableBatchCnt += 1
    if (b.isEstimated) g.estimatedBatchCnt += 1
    if (b.exceptionFlag) g.exceptionBatchCnt += 1
    g.shippedQty += b.shippedQty
    g.receivedQty += b.receivedQty
    g.consumedQty += consumedQty
    g.balanceQty += b.balanceQty
    if (b.invAttr === 'GOOD') g.goodQty += b.balanceQty
    else g.defectiveQty += b.balanceQty
    g.balancePurchaseAmount = round2(g.balancePurchaseAmount + b.balancePurchaseAmount)
    g.balanceLogisticsAmount = round2(g.balanceLogisticsAmount + b.balanceLogisticsAmount)
    const weightQty = b.balanceQty > 0 ? b.balanceQty : b.receivedQty
    if (weightQty > 0) {
      g.costWeightQty += weightQty
      g.costWeightAmount += weightQty * unitCost
      g.costWeightPurchase += weightQty * b.purchasePrice
      g.costWeightLogistics += weightQty * b.logisticsPrice
    }
    if (b.inboundDate) {
      g.inboundDates.push(b.inboundDate)
      const age = snapshotDay.diff(dayjs(b.inboundDate), 'day')
      if (b.balanceQty > 0 && age > 90) g.overAgeQty += b.balanceQty
      if (
        b.consumeStatus === 'CONSUMING' &&
        (!g.consumingBatch || b.inboundDate < g.consumingBatch.inboundDate)
      ) {
        g.consumingBatch = {
          inboundDate: b.inboundDate,
          unitCost,
          purchasePrice: b.purchasePrice,
          logisticsPrice: b.logisticsPrice
        }
      }
      if (!g.latestBatch || b.inboundDate > g.latestBatch.inboundDate) {
        g.latestBatch = {
          inboundDate: b.inboundDate,
          unitCost,
          purchasePrice: b.purchasePrice,
          logisticsPrice: b.logisticsPrice
        }
      }
    }
  })

  let list = [...groups.entries()].map(([rowKey, g]) => {
    const inboundSorted = [...g.inboundDates].sort()
    return {
      rowKey,
      localSku: g.localSku,
      skuName: g.skuName,
      warehouseCode: g.warehouseCode,
      warehouseName: g.warehouseName,
      companyName: g.companyName,
      platform: g.platforms.size === 1 ? [...g.platforms][0] : '',
      batchCnt: g.batchCnt,
      availableBatchCnt: g.availableBatchCnt,
      estimatedBatchCnt: g.estimatedBatchCnt,
      exceptionBatchCnt: g.exceptionBatchCnt,
      shippedQty: g.shippedQty,
      receivedQty: g.receivedQty,
      consumedQty: g.consumedQty,
      balanceQty: g.balanceQty,
      goodQty: g.goodQty,
      defectiveQty: g.defectiveQty,
      balancePurchaseAmount: g.balancePurchaseAmount,
      balanceLogisticsAmount: g.balanceLogisticsAmount,
      balanceTotalAmount: round2(g.balancePurchaseAmount + g.balanceLogisticsAmount),
      avgUnitCost: g.costWeightQty
        ? Math.round((g.costWeightAmount / g.costWeightQty) * 1e6) / 1e6
        : 0,
      avgPurchaseUnitCost: g.costWeightQty
        ? Math.round((g.costWeightPurchase / g.costWeightQty) * 1e6) / 1e6
        : 0,
      avgLogisticsUnitCost: g.costWeightQty
        ? Math.round((g.costWeightLogistics / g.costWeightQty) * 1e6) / 1e6
        : 0,
      consumingBatchCost: g.consumingBatch?.unitCost ?? null,
      consumingPurchasePrice: g.consumingBatch?.purchasePrice ?? null,
      consumingLogisticsPrice: g.consumingBatch?.logisticsPrice ?? null,
      latestPurchaseLogisticsCost: g.latestBatch?.unitCost ?? null,
      latestPurchasePrice: g.latestBatch?.purchasePrice ?? null,
      latestLogisticsPrice: g.latestBatch?.logisticsPrice ?? null,
      overAgeQty: g.overAgeQty,
      earliestInboundDate: inboundSorted[0] || '',
      latestInboundDate: inboundSorted[inboundSorted.length - 1] || '',
      snapshotDate
    }
  })

  const prop: string = params.sortProp || (params.tab === 'inTransit' ? 'shippedQty' : 'balanceQty')
  const asc = params.sortOrder === 'ascending'
  list = list.sort((a, b) => {
    const av = (a as Record<string, any>)[prop]
    const bv = (b as Record<string, any>)[prop]
    if (typeof av === 'number' && typeof bv === 'number') return asc ? av - bv : bv - av
    return asc
      ? String(av ?? '').localeCompare(String(bv ?? ''))
      : String(bv ?? '').localeCompare(String(av ?? ''))
  })

  return {
    records: paginate(list, current, size),
    total: list.length,
    current,
    size
  }
}

/** 指标卡 + 合计行：口径不随 Tab 收窄，始终按筛选条件统计全量批次 */
export const batchSummary = (params: Record<string, any>) => {
  const snapshotDate = resolveBatchSnapshotDate(params)
  const snapshotDay = dayjs(snapshotDate)
  const all = filterBatches({ ...params, tab: 'all' })
  const inStock = filterByTab(all, 'inStock')
  const scoped = filterByTab(all, params.tab || 'all')

  const sum = (list: BatchRaw[], pick: (b: BatchRaw) => number) =>
    round2(list.reduce((acc, b) => acc + pick(b), 0))

  const positiveStock = inStock.filter((b) => b.balanceQty > 0)
  const goodStock = positiveStock.filter((b) => b.invAttr === 'GOOD')
  const defectiveStock = positiveStock.filter((b) => b.invAttr === 'DEFECTIVE')
  const balanceQty = sum(positiveStock, (b) => b.balanceQty)
  const balancePurchaseAmount = sum(all, (b) => b.balancePurchaseAmount)
  const balanceLogisticsAmount = sum(all, (b) => b.balanceLogisticsAmount)
  const balanceTotalAmount = round2(balancePurchaseAmount + balanceLogisticsAmount)
  const purchaseRate = balanceTotalAmount
    ? round2((balancePurchaseAmount / balanceTotalAmount) * 100)
    : 0
  const logisticsRate = balanceTotalAmount
    ? round2((balanceLogisticsAmount / balanceTotalAmount) * 100)
    : 0
  const goodQty = sum(goodStock, (b) => b.balanceQty)
  const defectiveQty = sum(defectiveStock, (b) => b.balanceQty)
  const rate = (value: number, total: number) => (total ? round2((value / total) * 100) : 0)
  const ageOf = (batch: BatchRaw) => snapshotDay.diff(dayjs(batch.inboundDate), 'day')
  const overAgeGood = goodStock.filter((b) => ageOf(b) > 90)
  const overAgeDefective = defectiveStock.filter((b) => ageOf(b) > 90)
  const overAgeGoodQty = sum(overAgeGood, (b) => b.balanceQty)
  const overAgeDefectiveQty = sum(overAgeDefective, (b) => b.balanceQty)
  const overAgeQty = overAgeGoodQty + overAgeDefectiveQty
  const goodAgeWeighted = goodStock.reduce((acc, b) => acc + b.balanceQty * ageOf(b), 0)
  const goodAge0To30Qty = sum(
    goodStock.filter((b) => ageOf(b) <= 30),
    (b) => b.balanceQty
  )
  const goodAge31To60Qty = sum(
    goodStock.filter((b) => ageOf(b) >= 31 && ageOf(b) <= 60),
    (b) => b.balanceQty
  )
  const goodAge61To90Qty = sum(
    goodStock.filter((b) => ageOf(b) >= 61 && ageOf(b) <= 90),
    (b) => b.balanceQty
  )
  const goodAgeOver90Qty = overAgeGoodQty
  const arrived = all.filter((b) => b.stockStatus !== 'IN_TRANSIT' && b.receivedQty > 0)
  const goodArrived = arrived.filter((b) => b.invAttr === 'GOOD')
  const defectiveArrived = arrived.filter((b) => b.invAttr === 'DEFECTIVE')
  const inboundQty = sum(arrived, (b) => b.receivedQty)
  const goodInboundQty = sum(goodArrived, (b) => b.receivedQty)
  const defectiveInboundQty = sum(defectiveArrived, (b) => b.receivedQty)
  const consumedOf = (batch: BatchRaw) => Math.max(0, batch.receivedQty - batch.balanceQty)
  const outboundConsumedQty = sum(arrived, consumedOf)
  const goodOutboundConsumedQty = sum(goodArrived, consumedOf)
  const defectiveOutboundConsumedQty = sum(defectiveArrived, consumedOf)
  const unitCostOf = (batch: BatchRaw) => batch.purchasePrice + batch.logisticsPrice
  const goodInboundAmount = sum(goodArrived, (b) => b.receivedQty * unitCostOf(b))
  const defectiveInboundAmount = sum(defectiveArrived, (b) => b.receivedQty * unitCostOf(b))
  const inboundAmount = round2(goodInboundAmount + defectiveInboundAmount)
  const goodOutboundConsumedAmount = sum(goodArrived, (b) => consumedOf(b) * unitCostOf(b))
  const defectiveOutboundConsumedAmount = sum(
    defectiveArrived,
    (b) => consumedOf(b) * unitCostOf(b)
  )
  const outboundConsumedAmount = round2(
    goodOutboundConsumedAmount + defectiveOutboundConsumedAmount
  )

  return {
    metrics: {
      balanceQty,
      balanceTotalAmount,
      balancePurchaseAmount,
      balancePurchaseRate: purchaseRate,
      balanceLogisticsAmount,
      balanceLogisticsRate: logisticsRate,
      goodQty,
      goodRate: rate(goodQty, balanceQty),
      defectiveQty,
      defectiveRate: rate(defectiveQty, balanceQty),
      overAgeQty,
      overAgeGoodQty,
      overAgeGoodRate: rate(overAgeGoodQty, overAgeQty),
      overAgeDefectiveQty,
      overAgeDefectiveRate: rate(overAgeDefectiveQty, overAgeQty),
      avgGoodAgeDays: goodQty ? round2(goodAgeWeighted / goodQty) : 0,
      goodAge0To30Qty,
      goodAge0To30Rate: rate(goodAge0To30Qty, goodQty),
      goodAge31To60Qty,
      goodAge31To60Rate: rate(goodAge31To60Qty, goodQty),
      goodAge61To90Qty,
      goodAge61To90Rate: rate(goodAge61To90Qty, goodQty),
      goodAgeOver90Qty,
      goodAgeOver90Rate: rate(goodAgeOver90Qty, goodQty),
      outboundConsumedQty,
      goodOutboundConsumedQty,
      goodOutboundConsumedRate: rate(goodOutboundConsumedQty, outboundConsumedQty),
      defectiveOutboundConsumedQty,
      defectiveOutboundConsumedRate: rate(defectiveOutboundConsumedQty, outboundConsumedQty),
      inboundQty,
      goodInboundQty,
      goodInboundRate: rate(goodInboundQty, inboundQty),
      defectiveInboundQty,
      defectiveInboundRate: rate(defectiveInboundQty, inboundQty),
      outboundConsumedAmount,
      goodOutboundConsumedAmount,
      goodOutboundConsumedAmountRate: rate(goodOutboundConsumedAmount, outboundConsumedAmount),
      defectiveOutboundConsumedAmount,
      defectiveOutboundConsumedAmountRate: rate(
        defectiveOutboundConsumedAmount,
        outboundConsumedAmount
      ),
      inboundAmount,
      goodInboundAmount,
      goodInboundAmountRate: rate(goodInboundAmount, inboundAmount),
      defectiveInboundAmount,
      defectiveInboundAmountRate: rate(defectiveInboundAmount, inboundAmount)
    },
    /** 合计行：按当前 Tab 的范围统计 */
    totals: {
      batchCnt: scoped.length,
      shippedQty: scoped.reduce((acc, b) => acc + b.shippedQty, 0),
      receivedQty: scoped.reduce((acc, b) => acc + b.receivedQty, 0),
      consumedQty: scoped.reduce((acc, b) => acc - (b.receivedQty - b.balanceQty), 0),
      balanceQty: scoped.reduce((acc, b) => acc + b.balanceQty, 0),
      balancePurchaseAmount: sum(scoped, (b) => b.balancePurchaseAmount),
      balanceLogisticsAmount: sum(scoped, (b) => b.balanceLogisticsAmount),
      balanceTotalAmount: sum(scoped, (b) => b.balancePurchaseAmount + b.balanceLogisticsAmount),
      consumedAmount: sum(
        scoped,
        (b) => -(b.receivedQty - b.balanceQty) * (b.purchasePrice + b.logisticsPrice)
      )
    },
    /** 状态条：跑批与三层对平。异常批次单独计数，不等同于对平失败 */
    status: {
      dataDate: snapshotDate,
      jobFinished: true,
      reconciled: true,
      exceptionCount: all.filter((b) => b.exceptionFlag).length
    }
  }
}

/** 单批次消耗流水（抽屉第三段）：先按全量算累计结存，再分页返回 */
export const batchConsumeFlow = (params: Record<string, any>) => {
  const batch = BATCH_INDEX.get(params.batchId)
  if (!batch) return { records: [], total: 0, current: 1, size: 20 }
  let rows = buildConsumeFlow(batch)
  if (params.bizType) rows = rows.filter((r) => r.bizType === params.bizType)
  rows = rows.filter((r) => inRange(r.invDate, params.invDateRange))

  // 累计结存必须在分页前按时间顺序推完，否则翻页后本页起算点会错
  let runningQty = batch.receivedQty
  let runningAmount = round2(batch.receivedQty * (batch.purchasePrice + batch.logisticsPrice))
  rows = rows.map((row) => {
    runningQty += row.changeQty
    runningAmount = round2(runningAmount + row.changePurchaseAmount + row.changeLogisticsAmount)
    return {
      ...row,
      batchRunningQty: runningQty,
      batchRunningAmount: runningAmount
    }
  })

  const current = Number(params.currentPage) || 1
  const size = Number(params.pageSize) || 20
  return {
    records: paginate(rows, current, size),
    total: rows.length,
    current,
    size
  }
}

/** 批次台账：概览 + 对平瀑布 + 溯源链 */
export const batchLedger = (params: Record<string, any>) => {
  const batch = BATCH_INDEX.get(params.batchId)
  if (!batch) return null
  const rows = buildConsumeFlow(batch)
  const byBiz = new Map<string, { qty: number; purchase: number; logistics: number }>()
  rows.forEach((r) => {
    const cur = byBiz.get(r.bizType) || { qty: 0, purchase: 0, logistics: 0 }
    cur.qty += r.changeQty
    cur.purchase += r.changePurchaseAmount
    cur.logistics += r.changeLogisticsAmount
    byBiz.set(r.bizType, cur)
  })
  const openingQty = batch.receivedQty
  const openingPurchase = round2(openingQty * batch.purchasePrice)
  const openingLogistics = round2(openingQty * batch.logisticsPrice)
  const steps = [
    {
      key: 'opening',
      label: '期初（首次入库）',
      sign: '',
      qty: openingQty,
      purchaseAmount: openingPurchase,
      logisticsAmount: openingLogistics
    },
    ...BIZ_TYPES.filter((t) => byBiz.has(t.value)).map((t) => {
      const v = byBiz.get(t.value)!
      return {
        key: t.value,
        label: t.label,
        sign: v.qty < 0 ? '−' : '+',
        qty: v.qty,
        purchaseAmount: round2(v.purchase),
        logisticsAmount: round2(v.logistics)
      }
    })
  ]
  const derivedQty = steps.reduce((acc, s) => acc + s.qty, 0)
  const derivedPurchase = round2(steps.reduce((acc, s) => acc + s.purchaseAmount, 0))
  const derivedLogistics = round2(steps.reduce((acc, s) => acc + s.logisticsAmount, 0))
  return {
    batch,
    reconcile: {
      steps,
      derived: {
        qty: derivedQty,
        purchaseAmount: derivedPurchase,
        logisticsAmount: derivedLogistics
      },
      actual: {
        qty: batch.balanceQty,
        purchaseAmount: batch.balancePurchaseAmount,
        logisticsAmount: batch.balanceLogisticsAmount
      },
      balanced:
        derivedQty === batch.balanceQty &&
        Math.abs(derivedPurchase - batch.balancePurchaseAmount) < 0.01 &&
        Math.abs(derivedLogistics - batch.balanceLogisticsAmount) < 0.01
    },
    trace:
      batch.batchType === 'DT'
        ? { chain: [batch.rootBatchNo, batch.parentBatchNo, batch.batchNo].filter(Boolean) }
        : {
            chain: [],
            note:
              batch.batchType === 'RB'
                ? '退回入库批次：单价取原销售出库订单的回冲单价'
                : batch.batchType === 'PV'
                  ? '负库存暂估批次：单价取前一日同属性日终结存加权单价'
                  : '该批次类型的单价为加权或兜底取价，批次表不保存成本溯源'
          }
  }
}

export const batchFilterOptions = () => ({
  companies: COMPANIES,
  platforms: PLATFORMS,
  stores: [...new Set(WAREHOUSES.map((w) => w.store))].map((s) => ({ value: s, label: s })),
  warehouses: WAREHOUSES.map((w) => ({
    value: w.code,
    label: `${w.code} ${w.name}`,
    platform: w.platform
  })),
  sites: [...new Set(WAREHOUSES.map((w) => w.site))].map((s) => ({ value: s, label: s }))
})

/* =========================================================================
 * 板块二：平台库存成本流水
 * =======================================================================*/

/** 生成窗口：近 45 天 */
const FLOW_DAYS = 45

export interface FlowRaw {
  rowKey: string
  invDate: string
  companyName: string
  platform: string
  storeName: string
  siteName: string
  warehouseCode: string
  warehouseName: string
  msku: string
  localSku: string
  skuName: string
  asin: string
  fnsku: string
  invAttr: 'GOOD' | 'DEFECTIVE'
  openingQty: number
  openingPurchaseAmount: number
  openingLogisticsAmount: number
  // 六类业务：净数量 + 进出方向拆分（三级下钻用）+ 采购/物流两段成本
  receiptQty: number
  receiptInQty: number
  receiptOutQty: number
  receiptPurchaseAmount: number
  receiptLogisticsAmount: number
  /** 二级出入库类型：数量与成本成对出现，各子类之和等于所属一级业务 */
  receiptFirstQty: number
  receiptDiffQty: number
  receiptSupplementQty: number
  receiptNoSourceQty: number
  receiptFirstAmount: number
  receiptDiffAmount: number
  receiptSupplementAmount: number
  receiptNoSourceAmount: number
  saleOutQty: number
  saleOutInQty: number
  saleOutOutQty: number
  saleOutPurchaseAmount: number
  saleOutLogisticsAmount: number
  saleReturnQty: number
  saleReturnInQty: number
  saleReturnOutQty: number
  /** 能匹配到原订单的为有源，匹配不上的为无源 */
  saleReturnSourcedQty: number
  saleReturnUnsourcedQty: number
  saleReturnSourcedAmount: number
  saleReturnUnsourcedAmount: number
  saleReturnPurchaseAmount: number
  saleReturnLogisticsAmount: number
  removalQty: number
  removalInQty: number
  removalOutQty: number
  removalPurchaseAmount: number
  removalLogisticsAmount: number
  stocktakeQty: number
  stocktakePurchaseAmount: number
  stocktakeLogisticsAmount: number
  stocktakeInQty: number
  stocktakeOutQty: number
  stocktakeInAmount: number
  stocktakeOutAmount: number
  otherAdjustQty: number
  otherAdjustInQty: number
  otherAdjustOutQty: number
  otherAdjustInAmount: number
  otherAdjustOutAmount: number
  otherAdjustPurchaseAmount: number
  otherAdjustLogisticsAmount: number
  closingQty: number
  closingPurchaseAmount: number
  closingLogisticsAmount: number
  diffQty: number
  diffAmount: number
  hasEstimated: boolean
  exceptionReason: string
  genMode: string
}

interface SeriesKey {
  wh: WarehouseSeed
  sku: SkuSeed
  msku: string
  invAttr: 'GOOD' | 'DEFECTIVE'
}

function buildSeriesKeys(): SeriesKey[] {
  const keys: SeriesKey[] = []
  WAREHOUSES.forEach((wh) => {
    SKUS.forEach((sku) => {
      sku.mskus.forEach((msku) => {
        keys.push({ wh, sku, msku, invAttr: 'GOOD' })
        if (hash(`${wh.code}${msku}`) % 4 === 0) {
          keys.push({ wh, sku, msku, invAttr: 'DEFECTIVE' })
        }
      })
    })
  })
  return keys
}

/** 按日推进一个 (仓库 + MSKU + 属性) 序列，期初随上一日期末滚动 */
function buildSeries(key: SeriesKey): FlowRaw[] {
  const { wh, sku, msku, invAttr } = key
  const seed = hash(`${wh.code}${msku}${invAttr}`)
  const pp = round6(sku.purchasePrice * (0.95 + (seed % 11) / 100))
  const lp = round6(sku.logisticsPrice * (0.95 + (seed % 13) / 100))
  const rows: FlowRaw[] = []

  let openingQty = Math.round(sku.baseQty * (0.3 + (seed % 50) / 100))
  let openingPurchase = round2(openingQty * pp)
  let openingLogistics = round2(openingQty * lp)

  for (let i = FLOW_DAYS - 1; i >= 0; i--) {
    const invDate = day(-i)
    const h = hash(`${wh.code}${msku}${invAttr}${invDate}`)

    // 入库：约每 6 天一次货件签收
    const hasReceipt = h % 6 === 0
    const receiptBase = hasReceipt ? Math.round(sku.baseQty * (0.15 + (h % 25) / 100)) : 0
    const receiptFirstQty = hasReceipt ? Math.round(receiptBase * 0.82) : 0
    // 调差签收可正可负：少收要冲回，货件入库这一类因此也会有出库方向
    const receiptDiffQty = hasReceipt ? (h % 3 === 0 ? -1 : 1) * Math.round(receiptBase * 0.08) : 0
    const receiptSupplementQty = hasReceipt ? Math.round(receiptBase * 0.06) : 0
    const receiptNoSourceQty = hasReceipt
      ? receiptBase - receiptFirstQty - Math.abs(receiptDiffQty) - receiptSupplementQty
      : 0
    const receiptQty = receiptFirstQty + receiptDiffQty + receiptSupplementQty + receiptNoSourceQty

    // 出库：日常销售
    const wantSaleOut = Math.round(sku.baseQty * (0.01 + (h % 9) / 300))
    const removalQty = h % 17 === 0 ? -Math.round(sku.baseQty * 0.01) - 1 : 0
    const saleReturnQty = h % 11 === 0 ? Math.round(sku.baseQty * 0.004) + 1 : 0
    // 退货报告匹配不上原订单的算无源，占少数；两者计价规则不同，必须能分开看
    const saleReturnUnsourcedQty =
      saleReturnQty && h % 33 === 0 ? Math.max(1, Math.round(saleReturnQty * 0.3)) : 0
    const saleReturnSourcedQty = saleReturnQty - saleReturnUnsourcedQty
    const stocktakeInQty = h % 23 === 0 ? Math.round(sku.baseQty * 0.003) + 1 : 0
    const stocktakeOutQty = h % 19 === 0 ? -(Math.round(sku.baseQty * 0.003) + 1) : 0
    const stocktakeQty = stocktakeInQty + stocktakeOutQty
    // 其他调整只在每月 2 日跑批产生（归属上月最后一天的差额），同一天可能既有补入也有冲出
    const isAdjustDay = dayjs(invDate).date() === 2
    const otherAdjustInQty = isAdjustDay && h % 2 === 0 ? 3 : 0
    const otherAdjustOutQty = isAdjustDay && h % 2 !== 0 ? -2 : 0
    const otherAdjustQty = otherAdjustInQty + otherAdjustOutQty

    // 不允许把库存打穿：先算可出库上限
    const available = openingQty + receiptQty + saleReturnQty + stocktakeInQty
    const saleOutQty = -Math.min(wantSaleOut, Math.max(0, available - 1))

    const qtyOf = (q: number) => ({
      purchase: round2(q * pp),
      logistics: round2(q * lp)
    })
    /** 二级出入库类型的成本：单价同一级 */
    const subAmount = (q: number) => {
      const a = qtyOf(q)
      return round2(a.purchase + a.logistics)
    }
    /** 有二级类型的一级业务，成本由子类逐条累加得到，浮层里的合计才不会跟单元格差分 */
    const sumOf = (parts: number[]) =>
      parts.reduce(
        (acc, q) => {
          const a = qtyOf(q)
          return {
            purchase: round2(acc.purchase + a.purchase),
            logistics: round2(acc.logistics + a.logistics)
          }
        },
        { purchase: 0, logistics: 0 }
      )

    const receipt = sumOf([
      receiptFirstQty,
      receiptDiffQty,
      receiptSupplementQty,
      receiptNoSourceQty
    ])
    const saleOut = qtyOf(saleOutQty)
    const saleReturn = sumOf([saleReturnSourcedQty, saleReturnUnsourcedQty])
    const removal = qtyOf(removalQty)
    const stocktake = sumOf([stocktakeInQty, stocktakeOutQty])
    const otherAdjust = sumOf([otherAdjustInQty, otherAdjustOutQty])

    const netQty =
      receiptQty + saleOutQty + saleReturnQty + removalQty + stocktakeQty + otherAdjustQty
    const netPurchase = round2(
      receipt.purchase +
        saleOut.purchase +
        saleReturn.purchase +
        removal.purchase +
        stocktake.purchase +
        otherAdjust.purchase
    )
    const netLogistics = round2(
      receipt.logistics +
        saleOut.logistics +
        saleReturn.logistics +
        removal.logistics +
        stocktake.logistics +
        otherAdjust.logistics
    )

    let closingQty = openingQty + netQty
    let closingPurchase = round2(openingPurchase + netPurchase)
    const closingLogistics = round2(openingLogistics + netLogistics)

    // 刻意构造的对平失败行：让最近第 3 天的个别 SKU 期末与推导值不一致
    const forceUnbalanced = i === 2 && seed % 29 === 0
    if (forceUnbalanced) {
      closingQty += 2
      closingPurchase = round2(closingPurchase + 2 * pp)
    }

    const diffQty = openingQty + netQty - closingQty
    const diffAmount = round2(
      openingPurchase +
        openingLogistics +
        netPurchase +
        netLogistics -
        (closingPurchase + closingLogistics)
    )

    rows.push({
      rowKey: `${invDate}|${wh.code}|${msku}|${invAttr}`,
      invDate,
      companyName: '深圳迈科电子有限公司',
      platform: wh.platform,
      storeName: wh.store,
      siteName: wh.site,
      warehouseCode: wh.code,
      warehouseName: wh.name,
      msku,
      localSku: sku.localSku,
      skuName: sku.skuName,
      asin: sku.asin,
      fnsku: sku.fnsku,
      invAttr,
      openingQty,
      openingPurchaseAmount: openingPurchase,
      openingLogisticsAmount: openingLogistics,
      receiptQty,
      receiptInQty:
        receiptFirstQty + receiptSupplementQty + receiptNoSourceQty + Math.max(receiptDiffQty, 0),
      receiptOutQty: Math.min(receiptDiffQty, 0),
      receiptPurchaseAmount: receipt.purchase,
      receiptLogisticsAmount: receipt.logistics,
      receiptFirstQty,
      receiptDiffQty,
      receiptSupplementQty,
      receiptNoSourceQty,
      receiptFirstAmount: subAmount(receiptFirstQty),
      receiptDiffAmount: subAmount(receiptDiffQty),
      receiptSupplementAmount: subAmount(receiptSupplementQty),
      receiptNoSourceAmount: subAmount(receiptNoSourceQty),
      saleOutQty,
      saleOutInQty: 0,
      saleOutOutQty: saleOutQty,
      saleOutPurchaseAmount: saleOut.purchase,
      saleOutLogisticsAmount: saleOut.logistics,
      saleReturnQty,
      saleReturnInQty: saleReturnQty,
      saleReturnOutQty: 0,
      saleReturnSourcedQty,
      saleReturnUnsourcedQty,
      saleReturnSourcedAmount: subAmount(saleReturnSourcedQty),
      saleReturnUnsourcedAmount: subAmount(saleReturnUnsourcedQty),
      saleReturnPurchaseAmount: saleReturn.purchase,
      saleReturnLogisticsAmount: saleReturn.logistics,
      removalQty,
      removalInQty: 0,
      removalOutQty: removalQty,
      removalPurchaseAmount: removal.purchase,
      removalLogisticsAmount: removal.logistics,
      stocktakeQty,
      stocktakePurchaseAmount: stocktake.purchase,
      stocktakeLogisticsAmount: stocktake.logistics,
      stocktakeInQty,
      stocktakeOutQty,
      stocktakeInAmount: subAmount(stocktakeInQty),
      stocktakeOutAmount: subAmount(stocktakeOutQty),
      otherAdjustQty,
      otherAdjustInQty,
      otherAdjustOutQty,
      otherAdjustInAmount: subAmount(otherAdjustInQty),
      otherAdjustOutAmount: subAmount(otherAdjustOutQty),
      otherAdjustPurchaseAmount: otherAdjust.purchase,
      otherAdjustLogisticsAmount: otherAdjust.logistics,
      closingQty,
      closingPurchaseAmount: closingPurchase,
      closingLogisticsAmount: closingLogistics,
      diffQty,
      diffAmount,
      hasEstimated: h % 31 === 0,
      exceptionReason: forceUnbalanced
        ? '期末结存与推导值不一致，疑似报告漏拉'
        : h % 37 === 0
          ? 'MSKU 未匹配到本地 SKU，已按店铺兜底映射'
          : '',
      genMode: h % 5 === 0 ? 'AGGREGATE' : h % 13 === 0 ? 'SYSTEM_DIFF' : 'DETAIL'
    })

    openingQty = closingQty
    openingPurchase = closingPurchase
    openingLogistics = closingLogistics
  }
  return rows
}

const FLOW_ROWS: FlowRaw[] = buildSeriesKeys().flatMap((key) => buildSeries(key))
const FLOW_INDEX = new Map(FLOW_ROWS.map((r) => [r.rowKey, r]))
const FLOW_VIEW_INDEX = new Map<string, FlowRaw>()

/** 主表聚合维度 */
type FlowDim = 'msku' | 'localSku' | 'asin' | 'warehouse' | 'store'
type FlowDateGrain = 'day' | 'week' | 'month'

function flowPeriodOf(invDate: string, grain: FlowDateGrain): string {
  if (grain === 'month') return dayjs(invDate).format('YYYY-MM')
  if (grain === 'week') {
    const date = dayjs(invDate)
    const monday = date.subtract((date.day() + 6) % 7, 'day')
    return monday.format('YYYY-MM-DD')
  }
  return invDate
}

function dimKeyOf(row: FlowRaw, dim: FlowDim, period = row.invDate): string {
  if (dim === 'localSku') return `${period}|${row.warehouseCode}|${row.localSku}|${row.invAttr}`
  if (dim === 'asin') return `${period}|${row.warehouseCode}|${row.asin}|${row.invAttr}`
  if (dim === 'warehouse') return `${period}|${row.warehouseCode}|${row.invAttr}`
  if (dim === 'store') return `${period}|${row.storeName}|${row.invAttr}`
  return `${period}|${row.warehouseCode}|${row.msku}|${row.invAttr}`
}

const SUM_FIELDS: (keyof FlowRaw)[] = [
  'openingQty',
  'openingPurchaseAmount',
  'openingLogisticsAmount',
  'receiptQty',
  'receiptInQty',
  'receiptOutQty',
  'receiptPurchaseAmount',
  'receiptLogisticsAmount',
  'receiptFirstQty',
  'receiptDiffQty',
  'receiptSupplementQty',
  'receiptNoSourceQty',
  'receiptFirstAmount',
  'receiptDiffAmount',
  'receiptSupplementAmount',
  'receiptNoSourceAmount',
  'saleOutQty',
  'saleOutInQty',
  'saleOutOutQty',
  'saleOutPurchaseAmount',
  'saleOutLogisticsAmount',
  'saleReturnQty',
  'saleReturnInQty',
  'saleReturnOutQty',
  'saleReturnSourcedQty',
  'saleReturnUnsourcedQty',
  'saleReturnSourcedAmount',
  'saleReturnUnsourcedAmount',
  'saleReturnPurchaseAmount',
  'saleReturnLogisticsAmount',
  'removalQty',
  'removalInQty',
  'removalOutQty',
  'removalPurchaseAmount',
  'removalLogisticsAmount',
  'stocktakeQty',
  'stocktakePurchaseAmount',
  'stocktakeLogisticsAmount',
  'stocktakeInQty',
  'stocktakeOutQty',
  'stocktakeInAmount',
  'stocktakeOutAmount',
  'otherAdjustQty',
  'otherAdjustInQty',
  'otherAdjustOutQty',
  'otherAdjustInAmount',
  'otherAdjustOutAmount',
  'otherAdjustPurchaseAmount',
  'otherAdjustLogisticsAmount',
  'closingQty',
  'closingPurchaseAmount',
  'closingLogisticsAmount',
  'diffQty',
  'diffAmount'
]

const OPENING_FIELDS = new Set<keyof FlowRaw>([
  'openingQty',
  'openingPurchaseAmount',
  'openingLogisticsAmount'
])
const CLOSING_FIELDS = new Set<keyof FlowRaw>([
  'closingQty',
  'closingPurchaseAmount',
  'closingLogisticsAmount'
])

/**
 * 按日 / 周 / 月聚合主表。
 * 期间业务变动取区间合计；期初只取期间首日期初，期末只取期间末日期末。
 */
function aggregate(rows: FlowRaw[], dim: FlowDim, dateGrain: FlowDateGrain = 'day'): FlowRaw[] {
  const groups = new Map<string, FlowRaw[]>()
  rows.forEach((row) => {
    const period = flowPeriodOf(row.invDate, dateGrain)
    const key = dimKeyOf(row, dim, period)
    const group = groups.get(key) || []
    group.push(row)
    groups.set(key, group)
  })

  return [...groups.entries()].map(([key, group]) => {
    const dates = [...new Set(group.map((row) => row.invDate))].sort()
    const firstDate = dates[0]
    const lastDate = dates[dates.length - 1]
    const firstRows = group.filter((row) => row.invDate === firstDate)
    const lastRows = group.filter((row) => row.invDate === lastDate)
    const period = flowPeriodOf(firstDate, dateGrain)
    const result: FlowRaw = {
      ...group[0],
      rowKey: key,
      invDate: period,
      msku:
        dim === 'localSku' || dim === 'asin'
          ? ''
          : dim === 'warehouse'
            ? '全仓合计'
            : dim === 'store'
              ? '全店合计'
              : group[0].msku,
      localSku: dim === 'asin' || dim === 'warehouse' || dim === 'store' ? '' : group[0].localSku,
      hasEstimated: group.some((row) => row.hasEstimated),
      exceptionReason: group.find((row) => row.exceptionReason)?.exceptionReason || ''
    }

    SUM_FIELDS.forEach((field) => {
      const source = OPENING_FIELDS.has(field)
        ? firstRows
        : CLOSING_FIELDS.has(field)
          ? lastRows
          : group
      ;(result as unknown as Record<string, number>)[field as string] = round2(
        source.reduce(
          (total, row) =>
            total + Number((row as unknown as Record<string, number>)[field as string] || 0),
          0
        )
      )
    })
    return result
  })
}

function filterFlow(params: Record<string, any>): FlowRaw[] {
  let list = [...FLOW_ROWS]
  const range =
    Array.isArray(params.invDateRange) && params.invDateRange.length
      ? params.invDateRange
      : [day(-6), day(0)]
  list = list.filter((r) => inRange(r.invDate, range))
  if (params.platform) list = list.filter((r) => r.platform === params.platform)
  list = list.filter((r) => hitList(r.storeName, params.storeIdList))
  list = list.filter((r) => hitList(r.siteName, params.siteList))
  list = list.filter((r) => hitList(r.warehouseCode, params.warehouseCodeList))
  if (params.invAttr) list = list.filter((r) => r.invAttr === params.invAttr)
  if (params.genMode) list = list.filter((r) => r.genMode === params.genMode)
  if (params.hasException === 'Y') list = list.filter((r) => !!r.exceptionReason)
  if (params.exceptionType === 'unbalanced')
    list = list.filter((r) => r.diffQty !== 0 || Math.abs(r.diffAmount) >= 0.01)
  if (params.exceptionType === 'estimated') list = list.filter((r) => r.hasEstimated)
  if (params.exceptionType === 'exception') list = list.filter((r) => !!r.exceptionReason)
  const keyword = params.keyword
  if (keyword) {
    const type = params.keywordType || 'msku'
    if (type === 'batchNo' || type === 'platformDocNo') {
      const scope = batchScope(type, keyword)
      list = list.filter((r) => scope.has(`${r.warehouseCode}|${r.localSku}`))
    } else {
      list = list.filter((r) => {
        if (type === 'msku') return includesText(r.msku, keyword)
        if (type === 'localSku')
          return includesText(r.localSku, keyword) || includesText(r.skuName, keyword)
        if (type === 'asin') return includesText(r.asin, keyword)
        if (type === 'fnsku') return includesText(r.fnsku, keyword)
        if (type === 'bizNo' || type === 'invFlowNo' || type === 'costFlowNo') {
          return flowChildHit(r, type, keyword)
        }
        return true
      })
    }
  }
  const cardFilter = String(params.flowCardFilter || '')
  if (cardFilter) {
    const dates = [...new Set(list.map((row) => row.invDate))].sort()
    const firstDate = dates[0]
    const lastDate = dates[dates.length - 1]
    if (cardFilter === 'openingStock') {
      list = list.filter((row) => row.invDate === firstDate && row.openingQty > 0)
    } else if (cardFilter === 'closingStock') {
      list = list.filter((row) => row.invDate === lastDate && row.closingQty > 0)
    } else if (cardFilter === 'inbound') {
      list = list.filter(
        (row) =>
          row.receiptInQty + row.saleReturnInQty + row.stocktakeInQty + row.otherAdjustInQty !== 0
      )
    } else if (cardFilter === 'outbound') {
      list = list.filter(
        (row) =>
          row.receiptOutQty +
            row.saleOutOutQty +
            row.removalOutQty +
            row.stocktakeOutQty +
            row.otherAdjustOutQty !==
          0
      )
    } else if (cardFilter === 'changed') {
      list = list.filter(
        (row) =>
          row.receiptQty +
            row.saleOutQty +
            row.saleReturnQty +
            row.removalQty +
            row.stocktakeQty +
            row.otherAdjustQty !==
          0
      )
    }
  }
  return list
}

/**
 * 单号类关键字落在两级展开上：主表行命中 = 它当天的库存流水（或流水拆出的成本流水）里有命中行。
 * 成本流水编号 = `CF` + 库存流水编号去掉 `IF` 前缀 + 两位拆行序号，所以前缀能对上就算命中，
 * 用户贴完整编号或只贴前半段都能搜到。
 */
function flowChildHit(row: FlowRaw, type: string, keyword: string): boolean {
  const flows = buildInvFlow(row)
  if (type === 'bizNo') return flows.some((f) => includesText(f.bizNo, keyword))
  if (type === 'invFlowNo') return flows.some((f) => includesText(f.invFlowNo, keyword))
  const key = String(keyword).toUpperCase()
  return flows.some((f) => {
    const prefix = `CF${f.invFlowNo.slice(2)}`
    return prefix.includes(key) || key.startsWith(prefix)
  })
}

/** 批次号 / 关联平台单据不在主表行上：先用批次圈出「仓库 + 本地SKU」范围，再筛流水行 */
function batchScope(type: string, keyword: string): Set<string> {
  const scope = new Set<string>()
  BATCHES.forEach((b) => {
    const value = type === 'batchNo' ? b.batchNo : b.platformDocNo
    if (value && includesText(value, keyword)) scope.add(`${b.warehouseCode}|${b.localSku}`)
  })
  return scope
}

/** 主表分页 */
export const costFlowList = (params: Record<string, any>) => {
  const current = Number(params.currentPage) || 1
  const size = Number(params.pageSize) || 20
  const dim = (params.dim || 'msku') as FlowDim
  const dateGrain = (params.dateGrain || 'day') as FlowDateGrain
  const rows = aggregate(filterFlow(params), dim, dateGrain)
  rows.forEach((row) => FLOW_VIEW_INDEX.set(row.rowKey, row))
  const prop: string = params.sortProp || 'invDate'
  const asc = params.sortOrder === 'ascending'
  rows.sort((a, b) => {
    const av = (a as unknown as Record<string, any>)[prop]
    const bv = (b as unknown as Record<string, any>)[prop]
    if (typeof av === 'number' && typeof bv === 'number') return asc ? av - bv : bv - av
    const cmp = String(bv ?? '').localeCompare(String(av ?? ''))
    return asc ? -cmp : cmp
  })
  return { records: paginate(rows, current, size), total: rows.length, current, size }
}

/** 指标卡 + 合计行 + 三层对平状态 */
export const costFlowSummary = (params: Record<string, any>) => {
  const rows = filterFlow(params)
  const sum = (pick: (r: FlowRaw) => number) => round2(rows.reduce((acc, r) => acc + pick(r), 0))
  // 期初 / 期末不能逐行相加：取范围内首日期初与末日期末
  const dates = [...new Set(rows.map((r) => r.invDate))].sort()
  const firstDate = dates[0]
  const lastDate = dates[dates.length - 1]
  const firstRows = rows.filter((r) => r.invDate === firstDate)
  const lastRows = rows.filter((r) => r.invDate === lastDate)
  const openingQty = firstRows.reduce((acc, r) => acc + r.openingQty, 0)
  const openingPurchaseAmount = round2(
    firstRows.reduce((acc, r) => acc + r.openingPurchaseAmount, 0)
  )
  const openingLogisticsAmount = round2(
    firstRows.reduce((acc, r) => acc + r.openingLogisticsAmount, 0)
  )
  const openingAmount = round2(openingPurchaseAmount + openingLogisticsAmount)
  const closingQty = lastRows.reduce((acc, r) => acc + r.closingQty, 0)
  const closingPurchaseAmount = round2(
    lastRows.reduce((acc, r) => acc + r.closingPurchaseAmount, 0)
  )
  const closingLogisticsAmount = round2(
    lastRows.reduce((acc, r) => acc + r.closingLogisticsAmount, 0)
  )
  const closingAmount = round2(closingPurchaseAmount + closingLogisticsAmount)
  const unbalanced = rows.filter((r) => r.diffQty !== 0 || Math.abs(r.diffAmount) >= 0.01)

  const sumPositive = (pick: (r: FlowRaw) => number) => sum((r) => Math.max(0, pick(r)))
  const sumNegativeAbs = (pick: (r: FlowRaw) => number) =>
    Math.abs(sum((r) => Math.min(0, pick(r))))
  const sumPositiveFor = (target: FlowRaw[], pick: (r: FlowRaw) => number) =>
    round2(target.reduce((acc, row) => acc + Math.max(0, pick(row)), 0))
  const sumNegativeAbsFor = (target: FlowRaw[], pick: (r: FlowRaw) => number) =>
    Math.abs(round2(target.reduce((acc, row) => acc + Math.min(0, pick(row)), 0)))
  const goodRows = rows.filter((r) => r.invAttr === 'GOOD')
  const defectiveRows = rows.filter((r) => r.invAttr === 'DEFECTIVE')
  const openingGoodRows = firstRows.filter((r) => r.invAttr === 'GOOD')
  const openingDefectiveRows = firstRows.filter((r) => r.invAttr === 'DEFECTIVE')
  const closingGoodRows = lastRows.filter((r) => r.invAttr === 'GOOD')
  const closingDefectiveRows = lastRows.filter((r) => r.invAttr === 'DEFECTIVE')
  const qtySum = (target: FlowRaw[], field: keyof FlowRaw) =>
    target.reduce((acc, row) => acc + Number(row[field] || 0), 0)
  const amountSum = (target: FlowRaw[], prefix: 'opening' | 'closing') =>
    round2(
      target.reduce(
        (acc, row) =>
          acc +
          Number(row[`${prefix}PurchaseAmount`] || 0) +
          Number(row[`${prefix}LogisticsAmount`] || 0),
        0
      )
    )
  const openingGoodAmount = amountSum(openingGoodRows, 'opening')
  const openingDefectiveAmount = amountSum(openingDefectiveRows, 'opening')
  const closingGoodAmount = amountSum(closingGoodRows, 'closing')
  const closingDefectiveAmount = amountSum(closingDefectiveRows, 'closing')

  const receiptInboundQty = sumPositive(
    (r) => r.receiptFirstQty + r.receiptDiffQty + r.receiptSupplementQty + r.receiptNoSourceQty
  )
  const receiptInboundAmount = sumPositive(
    (r) =>
      r.receiptFirstAmount +
      r.receiptDiffAmount +
      r.receiptSupplementAmount +
      r.receiptNoSourceAmount
  )
  const returnInboundQty = sumPositive((r) => r.saleReturnInQty)
  const returnInboundAmount = sumPositive(
    (r) => r.saleReturnPurchaseAmount + r.saleReturnLogisticsAmount
  )
  const adjustmentInboundQty = sumPositive((r) => r.stocktakeInQty + r.otherAdjustInQty)
  const adjustmentInboundAmount = sumPositive((r) => r.stocktakeInAmount + r.otherAdjustInAmount)
  const inboundFlowQty = receiptInboundQty + returnInboundQty + adjustmentInboundQty
  const inboundFlowAmount = round2(
    receiptInboundAmount + returnInboundAmount + adjustmentInboundAmount
  )
  const inboundQtyFor = (target: FlowRaw[]) =>
    sumPositiveFor(
      target,
      (r) => r.receiptFirstQty + r.receiptDiffQty + r.receiptSupplementQty + r.receiptNoSourceQty
    ) +
    sumPositiveFor(target, (r) => r.saleReturnInQty) +
    sumPositiveFor(target, (r) => r.stocktakeInQty + r.otherAdjustInQty)
  const inboundGoodQty = inboundQtyFor(goodRows)
  const inboundDefectiveQty = inboundQtyFor(defectiveRows)

  const saleOutboundQty = sumNegativeAbs((r) => r.saleOutOutQty)
  const saleOutboundAmount = sumNegativeAbs(
    (r) => r.saleOutPurchaseAmount + r.saleOutLogisticsAmount
  )
  const removalOutboundQty = sumNegativeAbs((r) => r.removalOutQty)
  const removalOutboundAmount = sumNegativeAbs(
    (r) => r.removalPurchaseAmount + r.removalLogisticsAmount
  )
  const adjustmentOutboundQty = sumNegativeAbs(
    (r) => r.receiptOutQty + r.stocktakeOutQty + r.otherAdjustOutQty
  )
  const adjustmentOutboundAmount = sumNegativeAbs(
    (r) =>
      Math.min(0, r.receiptFirstAmount) +
      Math.min(0, r.receiptDiffAmount) +
      Math.min(0, r.receiptSupplementAmount) +
      Math.min(0, r.receiptNoSourceAmount) +
      r.stocktakeOutAmount +
      r.otherAdjustOutAmount
  )
  const outboundFlowQty = saleOutboundQty + removalOutboundQty + adjustmentOutboundQty
  const outboundFlowAmount = round2(
    saleOutboundAmount + removalOutboundAmount + adjustmentOutboundAmount
  )
  const outboundQtyFor = (target: FlowRaw[]) =>
    sumNegativeAbsFor(target, (r) => r.saleOutOutQty) +
    sumNegativeAbsFor(target, (r) => r.removalOutQty) +
    sumNegativeAbsFor(target, (r) => r.receiptOutQty + r.stocktakeOutQty + r.otherAdjustOutQty)
  const outboundGoodQty = outboundQtyFor(goodRows)
  const outboundDefectiveQty = outboundQtyFor(defectiveRows)

  const openingGoodQty = qtySum(openingGoodRows, 'openingQty')
  const openingDefectiveQty = qtySum(openingDefectiveRows, 'openingQty')
  const closingGoodQty = qtySum(closingGoodRows, 'closingQty')
  const closingDefectiveQty = qtySum(closingDefectiveRows, 'closingQty')
  const goodNetChangeQty = closingGoodQty - openingGoodQty
  const defectiveNetChangeQty = closingDefectiveQty - openingDefectiveQty
  const goodNetChangeAmount = round2(
    amountSum(closingGoodRows, 'closing') - amountSum(openingGoodRows, 'opening')
  )
  const defectiveNetChangeAmount = round2(
    amountSum(closingDefectiveRows, 'closing') - amountSum(openingDefectiveRows, 'opening')
  )

  return {
    metrics: {
      openingQty,
      openingAmount,
      openingPurchaseAmount,
      openingLogisticsAmount,
      openingGoodAmount,
      openingDefectiveAmount,
      openingGoodQty,
      openingDefectiveQty,
      closingQty,
      closingAmount,
      closingPurchaseAmount,
      closingLogisticsAmount,
      closingGoodAmount,
      closingDefectiveAmount,
      closingGoodQty,
      closingDefectiveQty,
      inboundFlowQty,
      inboundFlowAmount,
      inboundGoodQty,
      inboundDefectiveQty,
      receiptInboundQty,
      receiptInboundAmount,
      returnInboundQty,
      returnInboundAmount,
      adjustmentInboundQty,
      adjustmentInboundAmount,
      outboundFlowQty,
      outboundFlowAmount,
      outboundGoodQty,
      outboundDefectiveQty,
      saleOutboundQty,
      saleOutboundAmount,
      removalOutboundQty,
      removalOutboundAmount,
      adjustmentOutboundQty,
      adjustmentOutboundAmount,
      netChangeQty: closingQty - openingQty,
      netChangeAmount: round2(closingAmount - openingAmount),
      goodNetChangeQty,
      goodNetChangeAmount,
      defectiveNetChangeQty,
      defectiveNetChangeAmount,
      diffQty: unbalanced.reduce((acc, row) => acc + Math.abs(row.diffQty), 0),
      diffAmount: round2(unbalanced.reduce((acc, row) => acc + Math.abs(row.diffAmount), 0))
    },
    totals: {
      openingQty,
      openingPurchaseAmount,
      openingLogisticsAmount,
      receiptQty: sum((r) => r.receiptQty),
      receiptInQty: sum((r) => r.receiptInQty),
      receiptOutQty: sum((r) => r.receiptOutQty),
      receiptFirstQty: sum((r) => r.receiptFirstQty),
      receiptDiffQty: sum((r) => r.receiptDiffQty),
      receiptSupplementQty: sum((r) => r.receiptSupplementQty),
      receiptNoSourceQty: sum((r) => r.receiptNoSourceQty),
      receiptFirstAmount: sum((r) => r.receiptFirstAmount),
      receiptDiffAmount: sum((r) => r.receiptDiffAmount),
      receiptSupplementAmount: sum((r) => r.receiptSupplementAmount),
      receiptNoSourceAmount: sum((r) => r.receiptNoSourceAmount),
      receiptPurchaseAmount: sum((r) => r.receiptPurchaseAmount),
      receiptLogisticsAmount: sum((r) => r.receiptLogisticsAmount),
      saleOutQty: sum((r) => r.saleOutQty),
      saleOutInQty: 0,
      saleOutOutQty: sum((r) => r.saleOutOutQty),
      saleOutPurchaseAmount: sum((r) => r.saleOutPurchaseAmount),
      saleOutLogisticsAmount: sum((r) => r.saleOutLogisticsAmount),
      saleReturnQty: sum((r) => r.saleReturnQty),
      saleReturnInQty: sum((r) => r.saleReturnInQty),
      saleReturnOutQty: 0,
      saleReturnSourcedQty: sum((r) => r.saleReturnSourcedQty),
      saleReturnUnsourcedQty: sum((r) => r.saleReturnUnsourcedQty),
      saleReturnSourcedAmount: sum((r) => r.saleReturnSourcedAmount),
      saleReturnUnsourcedAmount: sum((r) => r.saleReturnUnsourcedAmount),
      saleReturnPurchaseAmount: sum((r) => r.saleReturnPurchaseAmount),
      saleReturnLogisticsAmount: sum((r) => r.saleReturnLogisticsAmount),
      removalQty: sum((r) => r.removalQty),
      removalInQty: 0,
      removalOutQty: sum((r) => r.removalOutQty),
      removalPurchaseAmount: sum((r) => r.removalPurchaseAmount),
      removalLogisticsAmount: sum((r) => r.removalLogisticsAmount),
      stocktakeQty: sum((r) => r.stocktakeQty),
      stocktakeInQty: sum((r) => r.stocktakeInQty),
      stocktakeOutQty: sum((r) => r.stocktakeOutQty),
      stocktakeInAmount: sum((r) => r.stocktakeInAmount),
      stocktakeOutAmount: sum((r) => r.stocktakeOutAmount),
      stocktakePurchaseAmount: sum((r) => r.stocktakePurchaseAmount),
      stocktakeLogisticsAmount: sum((r) => r.stocktakeLogisticsAmount),
      otherAdjustQty: sum((r) => r.otherAdjustQty),
      otherAdjustInQty: sum((r) => r.otherAdjustInQty),
      otherAdjustOutQty: sum((r) => r.otherAdjustOutQty),
      otherAdjustInAmount: sum((r) => r.otherAdjustInAmount),
      otherAdjustOutAmount: sum((r) => r.otherAdjustOutAmount),
      otherAdjustPurchaseAmount: sum((r) => r.otherAdjustPurchaseAmount),
      otherAdjustLogisticsAmount: sum((r) => r.otherAdjustLogisticsAmount),
      closingQty,
      closingPurchaseAmount,
      closingLogisticsAmount,
      diffQty: sum((r) => r.diffQty),
      diffAmount: sum((r) => r.diffAmount)
    },
    status: {
      dataDate: TODAY.format('YYYY-MM-DD'),
      eventSplitBalanced: true,
      batchBalanced: BATCHES.every((b) => !b.exceptionFlag),
      warehouseBalanced: unbalanced.length === 0,
      unbalancedCount: unbalanced.length,
      monthlyReconciled: TODAY.date() >= 2
    }
  }
}

/** 主表指标趋势：按库存日期聚合，数量/金额共用同一组业务指标键 */
export const costFlowTrend = (params: Record<string, any>) => {
  const rawRows = filterFlow(params)
  const dateGrain = (params.dateGrain || 'day') as FlowDateGrain
  const rows = dateGrain === 'day' ? rawRows : aggregate(rawRows, 'warehouse', dateGrain)
  const bases = [
    'opening',
    'receipt',
    'saleOut',
    'saleReturn',
    'removal',
    'stocktake',
    'otherAdjust',
    'closing'
  ]
  const allowed = new Set(bases.flatMap((base) => [`${base}Qty`, `${base}Amount`]))
  const requested = Array.isArray(params.metrics)
    ? params.metrics.filter((key: string) => allowed.has(key))
    : ['openingQty', 'receiptQty', 'saleOutAmount']
  const xAxis = [...new Set(rows.map((row) => row.invDate))].sort()

  const valueOf = (row: FlowRaw, metric: string): number => {
    if (metric.endsWith('Qty')) return Number(row[metric as keyof FlowRaw] || 0)
    const base = metric.replace(/Amount$/, '')
    return (
      Number(row[`${base}PurchaseAmount` as keyof FlowRaw] || 0) +
      Number(row[`${base}LogisticsAmount` as keyof FlowRaw] || 0)
    )
  }

  return {
    xAxis,
    series: requested.map((metric: string) => ({
      metric,
      values: xAxis.map((date) =>
        round2(
          rows
            .filter((row) => row.invDate === date)
            .reduce((total, row) => total + valueOf(row, metric), 0)
        )
      )
    }))
  }
}

/* ---------------- 一级展开：当日库存流水明细 ---------------- */

export interface InvFlowRaw {
  invFlowNo: string
  invDate: string
  docTime: string
  bizType: string
  ioType: string
  bizNo: string
  ioDirection: 'IN' | 'OUT'
  invAttr: string
  msku: string
  warehouseCode: string
  changeQty: number
  beforeQty: number
  afterQty: number
  reportSource: string
  reportBatchNo: string
  genMode: string
  exceptionReason: string
  costSplitCount: number
}

/**
 * 每条流水都落到一个二级出入库类型上（编码与前端 BIZ_IO_TREE 一致）。
 * 一级业务的净额 = 它各二级类型之和，主表单元格 ▾ 下钻与这里的明细因此天然对得上。
 */
function buildInvFlow(row: FlowRaw): InvFlowRaw[] {
  const h = hash(row.rowKey)
  const events: Array<{ bizType: string; qty: number; count: number; ioType: string }> = []
  const push = (bizType: string, qty: number, count: number, ioType: string) => {
    if (qty !== 0) events.push({ bizType, qty, count, ioType })
  }
  push('RECEIPT', row.receiptFirstQty, 2, 'RECEIPT_FIRST')
  push('RECEIPT', row.receiptDiffQty, 1, 'RECEIPT_DIFF')
  push('RECEIPT', row.receiptSupplementQty, 1, 'RECEIPT_SUPPLEMENT')
  push('RECEIPT', row.receiptNoSourceQty, 1, 'RECEIPT_NO_SOURCE')
  // 销售退货：能匹配到原订单的有源退货，与匹配不上的无源退货计价规则不同
  push('SALE_RETURN', row.saleReturnSourcedQty, 1, 'SALE_RETURN_SOURCED')
  push('SALE_RETURN', row.saleReturnUnsourcedQty, 1, 'SALE_RETURN_UNSOURCED')
  if (row.stocktakeInQty) push('STOCKTAKE', row.stocktakeInQty, 1, 'STOCKTAKE_IN')
  push(
    'SALE_OUT',
    row.saleOutQty,
    3 + (h % 4),
    row.saleOutQty > 0 ? 'SALE_OUT_REVERSE' : 'SALE_OUT_SHIP'
  )
  push('REMOVAL', row.removalQty, 1, row.removalQty > 0 ? 'REMOVAL_WITHDRAW' : 'REMOVAL_DISPOSE')
  if (row.stocktakeOutQty) push('STOCKTAKE', row.stocktakeOutQty, 1, 'STOCKTAKE_OUT')
  if (row.otherAdjustInQty) push('OTHER_ADJUST', row.otherAdjustInQty, 1, 'OTHER_ADJUST_IN')
  if (row.otherAdjustOutQty) push('OTHER_ADJUST', row.otherAdjustOutQty, 1, 'OTHER_ADJUST_OUT')

  const rows: InvFlowRaw[] = []
  let running = row.openingQty
  let seq = 0
  events.forEach((ev) => {
    const parts = Math.max(1, ev.count)
    let left = ev.qty
    for (let i = 0; i < parts; i++) {
      const isLast = i === parts - 1
      const raw = Math.trunc(ev.qty / parts)
      const qty = isLast ? left : raw || (ev.qty > 0 ? 1 : -1)
      if (qty === 0) continue
      left -= qty
      seq += 1
      const before = running
      running += qty
      const isIn = qty > 0
      const hh = hash(`${row.rowKey}${ev.bizType}${i}`)
      rows.push({
        invFlowNo: `IF${dayjs(row.invDate).format('YYYYMMDD')}${String(hash(row.rowKey) % 10000).padStart(4, '0')}${String(seq).padStart(3, '0')}`,
        invDate: row.invDate,
        // 分类账明细多数没有日内时间，统一 00:00:00 并在页面提示
        docTime:
          ev.bizType === 'SALE_OUT'
            ? `${row.invDate} ${String(6 + (hh % 16)).padStart(2, '0')}:${String(hh % 60).padStart(2, '0')}:00`
            : `${row.invDate} 00:00:00`,
        bizType: ev.bizType,
        ioType: ev.ioType,
        bizNo:
          ev.bizType === 'SALE_OUT' || ev.ioType === 'SALE_RETURN_SOURCED'
            ? `112-${String(1000000 + (hh % 8999999))}-${String(1000000 + ((hh * 7) % 8999999))}`
            : ev.ioType === 'SALE_RETURN_UNSOURCED'
              ? '' // 无源退货就是匹配不到原订单，业务编号必然为空
              : ev.bizType === 'RECEIPT'
                ? `FBA15${String(hh % 100000).padStart(5, '0')}`
                : `ADJ${String(hh % 900000).padStart(6, '0')}`,
        ioDirection: isIn ? 'IN' : 'OUT',
        invAttr: row.invAttr,
        msku: row.msku,
        warehouseCode: row.warehouseCode,
        changeQty: qty,
        beforeQty: before,
        afterQty: running,
        reportSource:
          ev.bizType === 'SALE_OUT'
            ? '分类账明细视图'
            : ev.bizType === 'RECEIPT'
              ? '分类账汇总视图'
              : '配送/退货报告',
        reportBatchNo: `RPT${dayjs(row.invDate).format('YYYYMMDD')}${String(hh % 900).padStart(3, '0')}`,
        genMode: row.genMode,
        exceptionReason:
          row.exceptionReason && ev.bizType === 'SALE_OUT' ? row.exceptionReason : '',
        costSplitCount: isIn ? 1 : 1 + (hh % 3)
      })
    }
  })
  return rows
}

export const invFlowDetail = (params: Record<string, any>) => {
  const row = FLOW_INDEX.get(params.rowKey) || FLOW_VIEW_INDEX.get(params.rowKey)
  if (!row) return { records: [], total: 0 }
  let rows = buildInvFlow(row)
  // 顶部业务类型筛选勾到二级时，明细只留选中的出入库类型
  const ioTypes = Array.isArray(params.ioTypeList) ? params.ioTypeList : []
  if (ioTypes.length) rows = rows.filter((r) => ioTypes.includes(r.ioType))
  return { records: rows, total: rows.length }
}

/* ---------------- 二级展开：成本流水明细（按批次拆行） ---------------- */

export interface CostFlowRaw {
  costFlowNo: string
  seqNo: number
  batchId: string
  batchNo: string
  batchType: string
  changeQty: number
  changePurchasePrice: number
  changeLogisticsPrice: number
  changePurchaseAmount: number
  changeLogisticsAmount: number
  changeTotalAmount: number
  mskuWarehouseQty: number
  mskuWarehousePurchaseAmount: number
  mskuWarehouseLogisticsAmount: number
  pricingMethod: string
  costSource: string
  isEstimated: boolean
  version: 'NORMAL' | 'REVERSED' | 'RECALC'
}

/**
 * 按 FIFO 把一条库存流水拆到批次上。
 * Mock 侧无法只凭 invFlowNo 反推事件，因此由页面把该条流水的关键字段一并传入（真实接口只需 invFlowNo）。
 */
export const costFlowDetail = (params: Record<string, any>) => {
  const invFlowNo = String(params.invFlowNo || '')
  const changeQty = Number(params.changeQty || 0)
  const warehouseCode = String(params.warehouseCode || '')
  const localSku = String(params.localSku || '')
  const splitCount = Math.max(1, Number(params.costSplitCount || 1))
  const h = hash(invFlowNo)

  // 该仓该 SKU 的在仓批次，按入仓日期升序 —— 就是 FIFO 消耗顺序
  const candidates = BATCHES.filter(
    (b) => b.warehouseCode === warehouseCode && (!localSku || b.localSku === localSku) && b.batchNo
  ).sort((a, b) => (a.inboundDate < b.inboundDate ? -1 : 1))
  const pool = candidates.length ? candidates : BATCHES.slice(0, 3)

  const rows: CostFlowRaw[] = []
  let left = changeQty
  const runningQty = Number(params.afterQty || 0)
  for (let i = 0; i < splitCount; i++) {
    const batch = pool[(h + i) % pool.length]
    const isLast = i === splitCount - 1
    const raw = Math.trunc(changeQty / splitCount)
    const qty = isLast ? left : raw || (changeQty > 0 ? 1 : -1)
    if (qty === 0) continue
    left -= qty
    const purchase = round2(qty * batch.purchasePrice)
    const logistics = round2(qty * batch.logisticsPrice)
    rows.push({
      costFlowNo: `CF${invFlowNo.slice(2)}${String(i + 1).padStart(2, '0')}`,
      seqNo: i + 1,
      batchId: batch.batchId,
      batchNo: batch.batchNo,
      batchType: batch.batchType,
      changeQty: qty,
      changePurchasePrice: batch.purchasePrice,
      changeLogisticsPrice: batch.logisticsPrice,
      changePurchaseAmount: purchase,
      changeLogisticsAmount: logistics,
      changeTotalAmount: round2(purchase + logistics),
      mskuWarehouseQty: runningQty,
      mskuWarehousePurchaseAmount: round2(runningQty * batch.purchasePrice),
      mskuWarehouseLogisticsAmount: round2(runningQty * batch.logisticsPrice),
      pricingMethod: changeQty > 0 ? '批次指定' : 'FIFO',
      costSource: batch.isEstimated
        ? '暂估价'
        : changeQty > 0
          ? '批次原值'
          : ['批次原值', '原订单回冲价', '前一日结存均价'][(h + i) % 3],
      isEstimated: batch.isEstimated,
      version: h % 41 === 0 && i === 0 ? 'RECALC' : 'NORMAL'
    })
  }

  const qtySum = rows.reduce((acc, r) => acc + r.changeQty, 0)
  return {
    records: rows,
    total: rows.length,
    check: {
      costQty: qtySum,
      invQty: changeQty,
      balanced: qtySum === changeQty
    }
  }
}

/* ---------------- SKU 当日成本抽屉 ---------------- */

/** 瀑布每一档都拆到采购 / 物流两段，前端算占比 */
const waterfallStep = (
  key: string,
  label: string,
  qty: number,
  purchase: number,
  logistics: number
) => ({
  key,
  label,
  qty,
  purchase: round2(purchase),
  logistics: round2(logistics),
  amount: round2(purchase + logistics)
})

export const skuDayCost = (params: Record<string, any>) => {
  const row = FLOW_INDEX.get(params.rowKey) || FLOW_VIEW_INDEX.get(params.rowKey)
  if (!row) return null
  const waterfall = [
    waterfallStep(
      'opening',
      '期初结存',
      row.openingQty,
      row.openingPurchaseAmount,
      row.openingLogisticsAmount
    ),
    waterfallStep(
      'RECEIPT',
      '货件入库',
      row.receiptQty,
      row.receiptPurchaseAmount,
      row.receiptLogisticsAmount
    ),
    waterfallStep(
      'SALE_OUT',
      '销售出库',
      row.saleOutQty,
      row.saleOutPurchaseAmount,
      row.saleOutLogisticsAmount
    ),
    waterfallStep(
      'SALE_RETURN',
      '销售退货',
      row.saleReturnQty,
      row.saleReturnPurchaseAmount,
      row.saleReturnLogisticsAmount
    ),
    waterfallStep(
      'REMOVAL',
      '移除出库',
      row.removalQty,
      row.removalPurchaseAmount,
      row.removalLogisticsAmount
    ),
    waterfallStep(
      'STOCKTAKE',
      '库存盘点',
      row.stocktakeQty,
      row.stocktakePurchaseAmount,
      row.stocktakeLogisticsAmount
    ),
    waterfallStep(
      'OTHER_ADJUST',
      '其他调整',
      row.otherAdjustQty,
      row.otherAdjustPurchaseAmount,
      row.otherAdjustLogisticsAmount
    ),
    waterfallStep(
      'closing',
      '期末结存',
      row.closingQty,
      row.closingPurchaseAmount,
      row.closingLogisticsAmount
    )
  ]
  const batches = BATCHES.filter(
    (b) =>
      b.warehouseCode === row.warehouseCode &&
      b.localSku === row.localSku &&
      b.stockStatus === 'IN_STOCK' &&
      b.balanceQty > 0
  )
    .sort((a, b) => (a.inboundDate < b.inboundDate ? -1 : 1))
    .map((b) => ({
      batchId: b.batchId,
      batchNo: b.batchNo,
      batchType: b.batchType,
      inboundDate: b.inboundDate,
      balanceQty: b.balanceQty,
      purchasePrice: b.purchasePrice,
      logisticsPrice: b.logisticsPrice,
      balanceTotalAmount: round2(b.balancePurchaseAmount + b.balanceLogisticsAmount)
    }))

  // 近 30 天趋势：期初期末 + 六类业务，数量与成本都给，前端自己挑指标
  const trend = FLOW_ROWS.filter(
    (r) => r.warehouseCode === row.warehouseCode && r.msku === row.msku && r.invAttr === row.invAttr
  )
    .filter((r) => !dayjs(r.invDate).isAfter(dayjs(row.invDate)))
    .slice(-30)
    .map((r) => {
      const point: Record<string, any> = {
        date: r.invDate,
        openingQty: r.openingQty,
        openingAmount: round2(r.openingPurchaseAmount + r.openingLogisticsAmount),
        closingQty: r.closingQty,
        closingAmount: round2(r.closingPurchaseAmount + r.closingLogisticsAmount)
      }
      ;(
        ['receipt', 'saleOut', 'saleReturn', 'removal', 'stocktake', 'otherAdjust'] as const
      ).forEach((biz) => {
        point[`${biz}Qty`] = r[`${biz}Qty`]
        point[`${biz}Amount`] = round2(r[`${biz}PurchaseAmount`] + r[`${biz}LogisticsAmount`])
      })
      return point
    })

  return { row, waterfall, batches, trend }
}

export const costFlowFilterOptions = () => ({
  ...batchFilterOptions(),
  bizTypes: BIZ_TYPES,
  genModes: [
    { value: 'DETAIL', label: '报告明细' },
    { value: 'AGGREGATE', label: '报告聚合' },
    { value: 'SYSTEM_DIFF', label: '系统轧差' }
  ]
})
