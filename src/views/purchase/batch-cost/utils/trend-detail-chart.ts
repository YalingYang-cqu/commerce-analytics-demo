import { graphic, type EChartsOption } from '@/utils/echarts'
import type { TrendDetailData, TrendDetailMetricKey } from './mock-trend-detail'
import { TREND_METRIC_OPTIONS } from './mock-trend-detail'
import { getSupplierChartColor } from './mock-price-history'
import { add, divide, mul } from '@/utils/common-util'

export type SupplierSelection = 'all' | string[]

const METRIC_MAP = Object.fromEntries(TREND_METRIC_OPTIONS.map((m) => [m.key, m])) as Record<
  TrendDetailMetricKey,
  (typeof TREND_METRIC_OPTIONS)[number]
>

function barGradient(topColor: string, bottomColor: string) {
  return new graphic.LinearGradient(0, 0, 0, 1, [
    { offset: 0, color: topColor },
    { offset: 1, color: bottomColor }
  ])
}

const METRIC_BAR_STYLE: Record<string, { top: string; bottom: string }> = {
  quantity: { top: '#5b8ff9', bottom: '#c6dafb' },
  totalPrice: { top: '#5ad8a6', bottom: '#bdf0d6' }
}

function resolveSuppliers(selection: SupplierSelection, all: string[]): string[] {
  if (selection === 'all') return all
  return selection.length ? selection : all
}

function getMonthMetricValue(
  data: TrendDetailData,
  monthLabel: string,
  metric: TrendDetailMetricKey,
  suppliers: string[],
  aggregated: boolean
): number | null {
  const month = data.months.find((m) => m.label === monthLabel)
  // 无该月数据：返回 null，让折线断开、柱子不画成 0
  if (!month) return null
  if (aggregated || suppliers.length === data.suppliers.length) {
    return month.total[metric] ?? null
  }
  if (metric === 'unitCost') {
    let amount = 0
    let qty = 0
    suppliers.forEach((name) => {
      const row = month.suppliers[name]
      if (row) {
        amount = add(amount, row.totalPrice)
        qty = add(qty, row.quantity)
      }
    })
    return qty > 0 ? divide(Math.round(mul(divide(amount, qty), 100)), 100) : null
  }
  return suppliers.reduce((s, name) => add(s, month.suppliers[name]?.[metric] ?? 0), 0)
}

/** Tooltip 单位/格式化：金额前加 ¥，数量保持纯数字 */
function formatTooltipValue(metric: TrendDetailMetricKey | undefined, v: number): string {
  if (metric === 'quantity') return v.toLocaleString('zh-CN')
  if (metric === 'totalPrice' || metric === 'unitCost') {
    const decimals = (String(v).split('.')[1] || '').length
    return `¥${v.toLocaleString('zh-CN', { minimumFractionDigits: decimals, maximumFractionDigits: decimals })}`
  }
  return String(v)
}

export function buildTrendMainChartOption(params: {
  data: TrendDetailData
  metrics: TrendDetailMetricKey[]
  supplierSelection: SupplierSelection
  selectedMonth: string | null
  /** 供应商配色基准顺序（与列表 index.vue 标签同序），按 supplierName 取色，缺省回退到 data.suppliers */
  supplierOrder?: string[]
}): EChartsOption {
  const { data, metrics, supplierSelection, selectedMonth, supplierOrder } = params
  const monthLabels = data.months.map((m) => m.label)
  const activeSuppliers = resolveSuppliers(supplierSelection, data.suppliers)
  // 按 supplierName 在基准顺序中的位置取色，保证与列表标签颜色一一对应
  const colorOrder = supplierOrder?.length ? supplierOrder : data.suppliers
  const colorIndexOf = (name: string, fallback: number): number => {
    const i = colorOrder.indexOf(name)
    return i >= 0 ? i : fallback
  }
  const singleMetric = metrics.length === 1
  const metric = metrics[0]
  const series: EChartsOption['series'] = []

  /** 仅“全部”时按指标维度展示（图例显示指标名而非各供应商）；选具体供应商仍按供应商名展示 */
  const isAggregatedAll = supplierSelection === 'all'
  /** 堆叠场景：多供应商 + 单指标 + 非单价线 */
  const isStacked = singleMetric && activeSuppliers.length > 1 && metric !== 'unitCost'
  /** seriesName → metric，供 tooltip 按系列各自单位格式化（应对多指标混合场景） */
  const seriesMetricByName = new Map<string, TrendDetailMetricKey>()

  const xAxisLabel: EChartsOption['xAxis'] = {
    type: 'category',
    data: monthLabels,
    // 开启坐标轴标签点击事件：点击 x 轴日期可触发选中并查询对应月份占比
    // triggerEvent: true,
    axisTick: { alignWithLabel: true },
    axisLabel: {
      fontSize: 11,
      color: '#909399',
      formatter: (value: string) => {
        if (value === selectedMonth) {
          return `{hl|${value}}`
        }
        return value
      },
      rich: {
        hl: {
          color: '#409eff',
          fontWeight: 'bold'
        }
      }
    }
  }

  if (singleMetric && activeSuppliers.length > 0 && !isAggregatedAll) {
    if (metric === 'unitCost') {
      activeSuppliers.forEach((name, idx) => {
        seriesMetricByName.set(name, metric)
        series.push({
          name,
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          lineStyle: { width: 2, color: getSupplierChartColor(colorIndexOf(name, idx)) },
          itemStyle: { color: getSupplierChartColor(colorIndexOf(name, idx)) },
          // 无数据的月份传 null：ECharts 会断开该点而非画成 0，避免折线下探到 0 形成假拱线
          data: monthLabels.map(
            (label) => data.months.find((m) => m.label === label)?.suppliers[name]?.unitCost ?? null
          )
        })
      })
    } else {
      activeSuppliers.forEach((name, idx) => {
        seriesMetricByName.set(name, metric)
        series.push({
          name,
          type: 'bar',
          stack: 'supplier',
          yAxisIndex: metric === 'quantity' ? 0 : 1,
          barMaxWidth: 28,
          itemStyle: { color: getSupplierChartColor(colorIndexOf(name, idx)) },
          data: monthLabels.map(
            (label) => data.months.find((m) => m.label === label)?.suppliers[name]?.[metric] ?? 0
          )
        })
      })
    }
  } else if (metrics.length > 0) {
    const aggregated = supplierSelection === 'all' || activeSuppliers.length !== 1
    const focusSuppliers = aggregated ? data.suppliers : activeSuppliers

    metrics.forEach((m) => {
      const meta = METRIC_MAP[m]
      seriesMetricByName.set(meta.label, m)
      if (m === 'unitCost') {
        series.push({
          name: meta.label,
          type: 'line',
          yAxisIndex: 1,
          smooth: true,
          showSymbol: true,
          symbolSize: 6,
          lineStyle: { width: 2, type: 'dashed', color: meta.color },
          itemStyle: { color: meta.color },
          data: monthLabels.map((label) =>
            getMonthMetricValue(data, label, m, focusSuppliers, aggregated)
          )
        })
      } else {
        series.push({
          name: meta.label,
          type: 'bar',
          yAxisIndex: m === 'quantity' ? 0 : 1,
          barMaxWidth: m === 'quantity' ? 22 : 18,
          barGap: m === 'quantity' ? '10%' : '30%',
          itemStyle: {
            color: METRIC_BAR_STYLE[m]
              ? barGradient(METRIC_BAR_STYLE[m].top, METRIC_BAR_STYLE[m].bottom)
              : meta.color
          },
          data: monthLabels.map((label) =>
            getMonthMetricValue(data, label, m, focusSuppliers, aggregated)
          )
        })
      }
    })
  }

  return {
    animation: false,
    legend: {
      bottom: 4,
      left: 'center',
      type: 'scroll',
      itemWidth: 12,
      itemHeight: 8,
      textStyle: { fontSize: 12, color: '#606266' }
    },
    grid: { top: 40, right: 52, bottom: 52, left: 52 },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      formatter: (params: unknown) => {
        const list = Array.isArray(params) ? params : [params]
        if (!list.length) return ''
        const first = list[0] as { axisValueLabel?: string; name?: string }
        const head = first.axisValueLabel ?? first.name ?? ''
        const lines: string[] = [head]
        let total = 0
        list.forEach((raw) => {
          const p = raw as { color?: string; seriesName?: string; value?: number | null }
          // 无数据(null)的渠道当月不显示，避免出现 ¥0.00 的误导
          if (p.value == null) return
          const v = Number(p.value) || 0
          total = add(total, v)
          const m = seriesMetricByName.get(String(p.seriesName)) ?? metric
          lines.push(
            `<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:${p.color};margin-right:6px;"></span>` +
              `${p.seriesName}：${formatTooltipValue(m, v)}`
          )
        })
        if (isStacked) {
          lines.push(
            `<div style="margin-top:6px;padding-top:6px;border-top:1px solid #ebeef5;">` +
              `<span style="color:#909399;">总量：</span>` +
              `<span style="font-weight:600;color:#303133;">${formatTooltipValue(metric, total)}</span>` +
              `</div>`
          )
        }
        return lines.join('<br/>')
      }
    },
    xAxis: xAxisLabel,
    yAxis: [
      {
        type: 'value',
        name: '数量(件)',
        nameTextStyle: { fontSize: 11, color: '#909399' },
        axisLabel: { fontSize: 11, color: '#909399' },
        splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } }
      },
      {
        type: 'value',
        name: '金额(¥)',
        nameTextStyle: { fontSize: 11, color: '#909399' },
        axisLabel: {
          fontSize: 11,
          color: '#909399',
          formatter: (v: number) => String(v)
          // formatter: (v: number) => (v >= 1000 ? `${(v / 1000)}k` : String(v))
        },
        splitLine: { show: false }
      }
    ],
    series
  }
}

export function buildTrendDonutOption(params: {
  items: { name: string; amount: number; ratio: number }[]
  centerAmount: number
  /** 供应商配色基准顺序（与列表 index.vue 标签同序），按 supplierName 取色 */
  supplierOrder?: string[]
}): EChartsOption {
  const { items, centerAmount, supplierOrder } = params
  const colorIndexOf = (name: string, fallback: number): number => {
    const i = supplierOrder?.indexOf(name) ?? -1
    return i >= 0 ? i : fallback
  }
  return {
    animation: false,
    tooltip: {
      trigger: 'item',
      formatter: (p: { name?: string; value?: number; percent?: number }) =>
        `${p.name}<br/>¥${Number(p.value).toLocaleString('zh-CN', { minimumFractionDigits: 2 })} (${p.percent}%)`
    },
    series: [
      {
        type: 'pie',
        radius: ['52%', '72%'],
        center: ['50%', '46%'],
        avoidLabelOverlap: true,
        label: { show: false },
        labelLine: { show: false },
        data: items.map((item, idx) => ({
          name: item.name,
          value: item.amount,
          itemStyle: { color: getSupplierChartColor(colorIndexOf(item.name, idx)) }
        }))
      }
    ],
    graphic: [
      {
        type: 'text',
        left: 'center',
        top: '38%',
        style: {
          text: '总成本',
          fill: '#909399',
          fontSize: 12,
          textAlign: 'center'
        }
      },
      {
        type: 'text',
        left: 'center',
        top: '44%',
        style: {
          text: `¥${centerAmount}`,
          fill: '#303133',
          fontSize: 16,
          fontWeight: 600,
          textAlign: 'center'
        }
      }
    ]
  }
}
