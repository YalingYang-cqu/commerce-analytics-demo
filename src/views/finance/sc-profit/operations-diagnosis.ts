import type { OrderProfitDiagnosis } from '@/api/finance/sc-profit'
import { divide, mul, sub } from '@/utils/dataprocess'
import { formatMoney } from './currency'
import { formatPercent } from './presentation'

export interface OpsCard {
  cls: 'good' | 'warn' | 'info'
  ico: string
  title: string
  desc: string
  rule: string
}

const num = (value: unknown): number => {
  const parsed = Number(value)
  return Number.isFinite(parsed) ? parsed : 0
}

const pct = (value: number): string => formatPercent(value)

const signedPct = (value: number): string => `${value > 0 ? '+' : ''}${pct(value)}`

const trendClass = (change: number): OpsCard['cls'] =>
  change > 0 ? 'warn' : change < 0 ? 'good' : 'info'

const trendIcon = (change: number): string => (change > 0 ? '↑' : change < 0 ? '↓' : '—')

/**
 * R2 看板经营诊断：
 * 前半段为对比期、后半段为当前期；上升红、下降绿、持平中性。
 */
export const buildOpsCards = (diagnosis: OrderProfitDiagnosis | null | undefined): OpsCard[] => {
  const by: Record<string, { prev: number; curr: number }> = {}
  ;(diagnosis?.items || []).forEach((item) => {
    by[item.metric] = { prev: num(item.prevValue), curr: num(item.currValue) }
  })

  const margin = by.margin || { prev: 0, curr: 0 }
  const prevMargin = mul(margin.prev, 100)
  const currMargin = mul(margin.curr, 100)
  const marginChange = sub(currMargin, prevMargin)

  const ad = by.ad || { prev: 0, curr: 0 }
  const sales = by.sales || { prev: 0, curr: 0 }
  const prevAcos = mul(divide(Math.abs(ad.prev), Math.abs(sales.prev)), 100)
  const currAcos = mul(divide(Math.abs(ad.curr), Math.abs(sales.curr)), 100)
  const acosChange = sub(currAcos, prevAcos)

  const lossCount = (by.lossCount || { curr: 0 }).curr
  const lossAmount = (by.lossAmount || { curr: 0 }).curr

  return [
    {
      cls: trendClass(marginChange),
      ico: trendIcon(marginChange),
      title: marginChange >= 0 ? '利润效率改善' : '利润效率承压',
      desc: `利润率变化 <b>${signedPct(marginChange)}</b>，当前利润率 <b>${pct(currMargin)}</b>。`,
      rule: '利润率变化 ≥ 0：利润效率改善；利润率变化 < 0：利润效率承压。'
    },
    {
      cls: trendClass(acosChange),
      ico: trendIcon(acosChange),
      title: acosChange > 0 ? '广告支出压力上升' : '广告投入相对稳定',
      desc:
        acosChange === 0
          ? `ACoS 持平，当前 ACoS <b>${pct(currAcos)}</b>。`
          : `ACoS ${acosChange > 0 ? '上升' : '下降'} <b>${pct(Math.abs(acosChange))}</b>，当前 ACoS <b>${pct(currAcos)}</b>。`,
      rule: 'ACoS 变化 > 0：广告支出压力上升；ACoS 变化 ≤ 0：广告投入相对稳定。'
    },
    {
      cls: lossCount > 0 ? 'warn' : 'good',
      ico: lossCount > 0 ? '!' : '✓',
      title: '亏损对象复盘',
      desc:
        lossCount > 0
          ? `当前期有 <b>${Math.round(lossCount).toLocaleString('en-US')}</b> 个亏损对象，亏损金额 <b>${formatMoney(lossAmount)}</b>，请及时复盘。`
          : '当前期暂无明显亏损对象。',
      rule: '亏损对象数 > 0：提示复盘亏损对象和亏损金额；亏损对象数 = 0：提示暂无明显亏损对象。'
    }
  ]
}
