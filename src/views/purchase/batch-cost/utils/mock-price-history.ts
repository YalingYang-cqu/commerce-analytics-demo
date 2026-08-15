/* eslint-disable @typescript-eslint/no-unused-vars */
import dayjs from 'dayjs'
import type { BatchCostRow, DimensionType } from './mock-data'
import { purchaseCostPriceHistory } from '@/api/purchase/batch-cost'

export interface PriceHistoryVersion {
  version: string
  price: number
  /** 相对上一版本的价格变化，首条（最新）为 null */
  change: number | null
  effectiveDate: string
}

export interface SupplierPriceHistory {
  supplierName: string
  latestPrice: number
  latestDate: string
  versions: PriceHistoryVersion[]
  stats: {
    max: number
    min: number
    avg: number
  }
}

export interface PriceHistoryResult {
  productCode: string
  purchaseManager: string
  totalRecordCount: number
  suppliers: SupplierPriceHistory[]
}

function round2(n: number): number {
  return Math.round(n * 100) / 100
}

function calcStats(prices: number[]) {
  if (!prices.length) {
    return { max: 0, min: 0, avg: 0 }
  }
  const max = Math.max(...prices)
  const min = Math.min(...prices)
  const avg = round2(prices.reduce((s, p) => s + p, 0) / prices.length)
  return { max: round2(max), min: round2(min), avg }
}

function buildSupplierVersions(
  supplierName: string,
  latestPrice: number,
  latestDate: string,
  versionCount: number,
  seed: number
): SupplierPriceHistory {
  const prices: number[] = new Array(versionCount).fill(0)
  prices[versionCount - 1] = round2(latestPrice)
  for (let i = versionCount - 2; i >= 0; i--) {
    const drift = 0.88 + ((seed + i * 7) % 12) / 100
    prices[i] = round2(prices[i + 1] * drift)
  }

  const chronological: PriceHistoryVersion[] = prices.map((price, idx) => ({
    version: `v${idx + 1}`,
    price,
    change: idx === 0 ? null : round2(price - prices[idx - 1]),
    effectiveDate: dayjs(latestDate)
      .subtract((versionCount - 1 - idx) * 28 + (seed % 5), 'day')
      .format('YYYY-MM-DD')
  }))

  return {
    supplierName,
    latestPrice: round2(latestPrice),
    latestDate,
    versions: [...chronological].reverse(),
    stats: calcStats(prices)
  }
}

/** 按 SKU/SPU 拉取历史采购价格（mock） */
export async function fetchPriceHistory(
  product: BatchCostRow,
  dimension: DimensionType
): Promise<PriceHistoryResult> {
  const productCode = dimension === 'sku' ? product.sku : product.spu
  const res: any = await purchaseCostPriceHistory({
    dimension,
    code: productCode
  })
  const data = res.data || {}
  const suppliers = (data.supplierHistories || []).map((item: any) => ({
    supplierName: item.supplierName,
    latestPrice: item.latestPrice || 0,
    latestDate: item.latestDate || '',
    versions: (item.records || []).map((record: any) => ({
      version: record.version,
      price: record.price || 0,
      change: Number(record.change ?? 0),
      effectiveDate: record.effectiveDate,
      costType: record.costType
    })),
    stats: {
      max: item.maxPrice || 0,
      min: item.minPrice || 0,
      avg: item.avgPrice || 0
    }
  }))
  const totalRecordCount = suppliers.reduce((s, sup) => s + sup.versions.length, 0)
  return {
    productCode: data.code || productCode,
    purchaseManager: data.purchaseManager || product.purchaseManager,
    totalRecordCount,
    suppliers
  }
}

/** 供应商图表取色：复用标签色板的中间色（与 c1~c10 一一对应） */
export { getSupplierChartColor } from './supplier-tag'
