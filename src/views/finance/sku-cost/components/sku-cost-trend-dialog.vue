<!-- SKU 综合成本趋势分析弹窗：4卡片 + 周期/日期/指标筛选 + 折线柱状混合主图 + 环形图 -->
<template>
  <ElDialog
    v-model="dialogVisible"
    width="1250px"
    align-center
    destroy-on-close
    :show-close="false"
    class="sku-cost-trend-dialog"
    @closed="handleClosed"
  >
    <template #header>
      <div class="dialog-header">
        <h3 class="dialog-title">
          {{ headerSku }}
          <span class="dialog-title__sep">·</span>
          综合成本趋势分析
        </h3>
        <ElButton class="dialog-close" text @click="dialogVisible = false">
          <ElIcon :size="18"><Close /></ElIcon>
        </ElButton>
      </div>
    </template>

    <div ref="exportRef" class="dialog-body" :class="{ 'is-exporting': exporting }">
      <div v-loading="loading" class="dialog-body__inner">
        <template v-if="trendData">
          <!-- 顶部 4 卡片 -->
          <div class="summary-cards">
            <div class="summary-card summary-card--blue">
              <div class="summary-card__label">累计入库数量</div>
              <div class="summary-card__value">
                {{ trendData.summary.cumulativeInbound.toLocaleString() }}
                <span class="unit">件</span>
              </div>
              <div class="summary-card__sub">所有 FIFO 批次入库总量</div>
            </div>
            <div class="summary-card summary-card--green">
              <div class="summary-card__label">当前在库数量</div>
              <div class="summary-card__value">
                {{ trendData.summary.remainingStock.toLocaleString() }}
                <span class="unit">件</span>
              </div>
              <div class="summary-card__sub">当前在库 FIFO 批次剩余合计</div>
            </div>
            <div class="summary-card summary-card--orange">
              <div class="summary-card__label">当前库存价值</div>
              <div class="summary-card__value">
                ¥{{ formatMoney(trendData.summary.stockValue) }}
              </div>
              <div class="summary-card__sub">在库数量 × 采购批次成本</div>
            </div>
            <div class="summary-card summary-card--gray">
              <div class="summary-card__label">加权综合成本</div>
              <div class="summary-card__value">
                ¥{{ formatMoney(trendData.summary.weightedAvgCost) }}
                <span class="unit">/件</span>
              </div>
              <div class="summary-card__sub">按在库数量加权的单位综合成本</div>
            </div>
          </div>

          <!-- 周期 + 自定义日期 -->
          <div class="toolbar-line">
            <span class="toolbar-label">周期</span>
            <ElRadioGroup v-model="period" size="small">
              <ElRadioButton value="day">日</ElRadioButton>
              <ElRadioButton value="week">周</ElRadioButton>
              <ElRadioButton value="month">月</ElRadioButton>
            </ElRadioGroup>

            <span class="toolbar-label">自定义</span>
            <div v-if="period === 'day'">
              <ElDatePicker
                v-model="dateRange"
                type="daterange"
                value-format="YYYY-MM-DD"
                start-placeholder="开始日期"
                end-placeholder="结束日期"
                clearable
                style="width: 200px"
                :disabled-date="standardDisabledDate"
                @calendar-change="handleRangeCalendarChange"
                @visible-change="handleRangeVisibleChange"
              />
            </div>
            <div style="width: 200px" v-else-if="period === 'week'">
              <PeriodWeekRangePicker
                v-model="dateRange"
                start-placeholder="开始周"
                end-placeholder="结束周"
                :max-range="currentMaxRange"
              />
            </div>

            <div v-else>
              <ElDatePicker
                v-model="dateRange"
                type="monthrange"
                value-format="YYYY-MM-DD"
                format="YYYY-MM"
                start-placeholder="开始月份"
                end-placeholder="结束月份"
                clearable
                style="width: 200px"
                :disabled-date="standardDisabledDate"
                @calendar-change="handleRangeCalendarChange"
                @visible-change="handleRangeVisibleChange"
              />
            </div>
          </div>

          <!-- 指标多选 -->
          <div class="toolbar-line">
            <span class="toolbar-label">
              指标
              <span class="toolbar-hint">(可多选)</span>
            </span>
            <ElCheckboxGroup v-model="selectedMetrics" class="metric-checks">
              <ElCheckbox v-for="item in TREND_METRIC_OPTIONS" :key="item.key" :label="item.key">
                <span class="metric-dot" :style="{ background: item.color }" />
                {{ item.label }}
              </ElCheckbox>
            </ElCheckboxGroup>
          </div>

          <!-- 主图 + 环形图 -->
          <div class="chart-row">
            <div class="chart-main">
              <div ref="mainChartRef" class="chart-main__inner" />
              <ElEmpty
                v-if="!selectedMetrics.length"
                description="请至少选择一个指标"
                class="chart-main__empty"
              />
            </div>
            <div class="chart-side">
              <div class="chart-side__title">在库批次占比</div>
              <div class="chart-side__subtitle">{{ donutSubtitle }}</div>
              <div v-loading="donutLoading" ref="donutChartRef" class="chart-side__donut" />
              <ul class="donut-legend">
                <li v-for="(item, idx) in activeDonut.donutItems" :key="item.batchNo">
                  <span class="dot" :style="{ background: getBatchColor(idx) }" />
                  <span class="no">{{ item.shortNo }}</span>
                  <span class="status">{{ item.statusLabel }}</span>
                  <span class="amount">¥{{ formatMoney(item.amount) }}</span>
                  <span class="ratio">{{ item.ratio }}%</span>
                </li>
              </ul>
            </div>
          </div>
        </template>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <ElButton :loading="exporting" :disabled="!trendData" @click="handleExport">
          导出图片
        </ElButton>
        <ElButton type="primary" @click="dialogVisible = false">关闭</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import {
    ElButton,
    ElCheckbox,
    ElCheckboxGroup,
    ElDatePicker,
    ElDialog,
    ElEmpty,
    ElIcon,
    ElMessage,
    ElRadioButton,
    ElRadioGroup
  } from 'element-plus'
  import { Close } from '@element-plus/icons-vue'
  import dayjs from 'dayjs'
  import PeriodWeekRangePicker from '@/components/core/others/period-week-range-picker/index.vue'
  import { useChart } from '@/composables/useChart'
  import { exportElementToPng } from '@/views/logistics/batch-cost/utils/export-element-image'
  import {
    fetchSkuTrendDetail,
    // fetchSkuBatchSharesAt,
    getDefaultRange,
    TREND_METRIC_OPTIONS,
    type DonutItem,
    type TrendDetailData,
    type TrendMetricKey,
    type TrendPeriod
  } from '../utils/trend-detail-mock'
  import type { SkuSummaryRow } from '../utils/types'

  defineOptions({ name: 'SkuCostTrendDialog' })

  const props = defineProps<{
    visible: boolean
    productRow: SkuSummaryRow | null
  }>()
  const emit = defineEmits<{ 'update:visible': [value: boolean] }>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const headerSku = computed(() => props.productRow?.sku || '—')

  const loading = ref(false)
  const exporting = ref(false)
  const exportRef = ref<HTMLElement | null>(null)
  const trendData = ref<TrendDetailData | null>(null)

  const period = ref<TrendPeriod>('month')
  const dateRange = ref<string[]>([])
  const selectedMetrics = ref<TrendMetricKey[]>(['unitCost'])

  /** 选中的 x 轴时间点（null 表示展示整段时间汇总占比） */
  const selectedPoint = ref<string | null>(null)
  /** 选中时间点对应的在库批次占比（方案A：点击时按该时间点重新请求） */
  const pointDonut = ref<{ donutItems: DonutItem[]; skuTotal: number } | null>(null)
  /** 点击时间点查询占比的加载态 */
  const donutLoading = ref(false)

  /** 当前环形图数据源：选中时间点时用该点数据，否则用整段汇总 */
  const activeDonut = computed<{ donutItems: DonutItem[]; skuTotal: number }>(() => {
    if (selectedPoint.value && pointDonut.value) return pointDonut.value
    if (trendData.value) {
      return { donutItems: trendData.value.donutItems, skuTotal: trendData.value.skuTotal }
    }
    return { donutItems: [], skuTotal: 0 }
  })

  /** 环形图副标题：选中时间点时显示该时间点 */
  const donutSubtitle = computed(() =>
    selectedPoint.value
      ? `${selectedPoint.value} 在库批次占比`
      : '按 SKU 总成本统计（数量×单位综合成本）'
  )

  /** 各周期最大搜索跨度（含起点的周期数）：日30 / 周16 / 月12 */
  const MAX_RANGE_BY_PERIOD: Record<TrendPeriod, number> = {
    day: 30,
    week: 16,
    month: 12
  }
  const currentMaxRange = computed(() => MAX_RANGE_BY_PERIOD[period.value] ?? 0)

  /** 标准选择器（日/月）选定起点后的锚点，用于超范围置灰 */
  const rangePickStart = ref<Date | null>(null)

  /** 距锚点超出最大跨度的日期置灰；无锚点时不限制 */
  const standardDisabledDate = (time: Date) => {
    const max = currentMaxRange.value
    if (!max || !rangePickStart.value) return false
    const unit = period.value === 'month' ? 'month' : 'day'
    const diff = Math.abs(dayjs(time).diff(dayjs(rangePickStart.value), unit))
    return diff > max - 1
  }

  /** 选中第一个端点时记录锚点，选满或清空时重置 */
  const handleRangeCalendarChange = (val: [Date, Date | null] | null) => {
    rangePickStart.value = val?.[0] && !val?.[1] ? val[0] : null
  }

  /** 面板关闭时重置锚点，避免下次打开沿用旧锚点 */
  const handleRangeVisibleChange = (visible: boolean) => {
    if (!visible) rangePickStart.value = null
  }

  /** 主图 / 环形图 chart 实例 */
  const mainChart = useChart()
  const mainChartRef = mainChart.chartRef
  const donutChart = useChart()
  const donutChartRef = donutChart.chartRef

  /** 周期变化时，自动重置默认日期范围 */
  watch(period, (p) => {
    dateRange.value = getDefaultRange(p)
  })

  /** 指标至少 1 个 */
  watch(selectedMetrics, (list) => {
    if (!list.length) selectedMetrics.value = ['unitCost']
  })

  async function loadData() {
    if (!props.productRow) return
    if (!dateRange.value?.[0] || !dateRange.value?.[1]) {
      dateRange.value = getDefaultRange(period.value)
    }
    // 重新拉取整段数据时，x 轴时间点会变化，清空已选时间点回到整段汇总
    selectedPoint.value = null
    pointDonut.value = null
    loading.value = true
    try {
      trendData.value = await fetchSkuTrendDetail(props.productRow.sku, period.value, [
        dateRange.value[0],
        dateRange.value[1]
      ])
      await nextTick()
      renderMainChart()
      renderDonutChart()
    } finally {
      loading.value = false
    }
  }

  /** 主图：折线 + 柱状混合（柱状占用左 y 轴 1 数量；金额占用左 y 轴 0） */
  function renderMainChart() {
    if (!trendData.value || !selectedMetrics.value.length) {
      mainChart.getChartInstance()?.clear()
      return
    }
    const labels = trendData.value.points.map((p) => p.label)
    const hasQty = selectedMetrics.value.includes('stockQty')
    const hasMoney = selectedMetrics.value.some((k) => k !== 'stockQty')
    /** 任意柱状指标存在时，xAxis 需要 boundaryGap，让柱子两侧有空隙 */
    const hasBar = selectedMetrics.value.some(
      (k) => TREND_METRIC_OPTIONS.find((m) => m.key === k)?.chartType === 'bar'
    )

    const seriesUnitByName = new Map<string, 'money' | 'qty'>()

    const series = selectedMetrics.value.map((key) => {
      const meta = TREND_METRIC_OPTIONS.find((m) => m.key === key)!
      const values = trendData.value!.points.map((p) => p.metrics[key] ?? null)
      seriesUnitByName.set(meta.label, meta.unit)
      return {
        name: meta.label,
        type: meta.chartType,
        yAxisIndex: meta.unit === 'qty' ? 1 : 0,
        smooth: meta.chartType === 'line',
        symbol: 'circle',
        symbolSize: 5,
        showSymbol: true,
        itemStyle: { color: meta.color },
        lineStyle: meta.chartType === 'line' ? { width: 2 } : undefined,
        areaStyle:
          meta.chartType === 'line' && selectedMetrics.value.length === 1
            ? { color: `${meta.color}33` }
            : undefined,
        barMaxWidth: 18,
        data: values
      }
    })

    const yAxis: any[] = []
    if (hasMoney) {
      yAxis.push({
        type: 'value',
        name: '金额(¥)',
        position: 'right',
        nameTextStyle: { color: '#999' },
        axisLabel: { formatter: (v: number) => `¥${v}` },
        splitLine: { lineStyle: { type: 'dashed', color: '#eee' } }
      })
    } else {
      yAxis.push({ type: 'value', show: false })
    }
    if (hasQty) {
      yAxis.push({
        type: 'value',
        name: '数量(件)',
        position: 'left',
        nameTextStyle: { color: '#999' },
        splitLine: { show: false }
      })
    } else {
      yAxis.push({ type: 'value', show: false })
    }

    const option = {
      grid: { left: 60, right: 50, top: 36, bottom: 56 },
      tooltip: {
        trigger: 'axis',
        formatter: (params: unknown) => {
          const arr = Array.isArray(params) ? params : []
          if (!arr.length) return ''
          const lines: string[] = [String(arr[0].axisValueLabel ?? arr[0].axisValue ?? '')]
          arr.forEach((p: any) => {
            const v = p.value
            const unit = seriesUnitByName.get(p.seriesName)
            let text: string
            if (v === null || v === undefined || Number.isNaN(v)) {
              text = '-'
            } else if (unit === 'money') {
              text = `¥${Number(v)}`
            } else {
              text = Number(v).toLocaleString('zh-CN')
            }
            lines.push(`${p.marker} ${p.seriesName}：${text}`)
          })
          return lines.join('<br/>')
        }
      },
      legend: { bottom: 0, icon: 'circle' },
      xAxis: {
        type: 'category',
        data: labels,
        boundaryGap: hasBar,
        // 开启坐标轴标签点击事件：点击 x 轴时间点可查询该时间点的在库批次占比
        // triggerEvent: true,
        axisLine: { lineStyle: { color: '#ddd' } },
        axisLabel: {
          color: '#666',
          formatter: (value: string) => (value === selectedPoint.value ? `{hl|${value}}` : value),
          rich: { hl: { color: '#409eff', fontWeight: 'bold' } }
        }
      },
      yAxis,
      series
    }

    const inst = mainChart.getChartInstance()
    if (inst) inst.setOption(option, { notMerge: true })
    else mainChart.initChart(option as any)
    // nextTick(bindMainChartClick)
  }

  /** 绑定主图 x 轴时间点点击（仅响应坐标轴标签，不响应折线/柱子数据点） */
  // function bindMainChartClick() {
  //   const inst = mainChart.getChartInstance()
  //   if (!inst) return
  //   inst.off('click')
  //   inst.on('click', (params: { componentType?: string; targetType?: string; value?: unknown }) => {
  //     if (params.componentType !== 'xAxis' || params.targetType !== 'axisLabel') return
  //     const label = String(params.value ?? '')
  //     if (label) handlePointClick(label)
  //   })
  // }

  /** 点击 x 轴时间点：高亮该点并查询其在库批次占比；再次点击同一点取消 */
  // async function handlePointClick(label: string) {
  //   if (!trendData.value || !props.productRow) return
  //   if (selectedPoint.value === label) {
  //     selectedPoint.value = null
  //     pointDonut.value = null
  //     renderMainChart()
  //     renderDonutChart()
  //     return
  //   }
  //   selectedPoint.value = label
  //   renderMainChart()
  //   donutLoading.value = true
  //   try {
  //     pointDonut.value = await fetchSkuBatchSharesAt(props.productRow.sku, period.value, label)
  //   } catch (error) {
  //     console.error('[sku-cost-trend] fetch point batch shares failed:', error)
  //     pointDonut.value = { donutItems: [], skuTotal: 0 }
  //   } finally {
  //     donutLoading.value = false
  //   }
  //   renderDonutChart()
  // }

  /** 环形图：在库批次占比 */
  function renderDonutChart() {
    if (!trendData.value) return
    const { donutItems: items, skuTotal } = activeDonut.value
    const option = {
      animation: false,
      tooltip: { trigger: 'item', formatter: '{b}: ¥{c} ({d}%)' },
      legend: { show: false },
      series: [
        {
          type: 'pie',
          radius: ['58%', '78%'],
          center: ['50%', '50%'],
          avoidLabelOverlap: true,
          label: {
            position: 'outside',
            formatter: (p: any) => `${p.data.shortNo} ${p.data.ratio}%`,
            color: '#666',
            fontSize: 12
          },
          labelLine: { length: 10, length2: 6 },
          data: items.map((it, idx) => ({
            name: it.batchNo,
            value: it.amount,
            shortNo: it.shortNo,
            ratio: it.ratio,
            itemStyle: { color: getBatchColor(idx) }
          }))
        }
      ],
      graphic: [
        {
          type: 'text',
          left: 'center',
          top: '42%',
          style: { text: 'SKU总成本', fill: '#94a3b8', fontSize: 12, textAlign: 'center' }
        },
        {
          type: 'text',
          left: 'center',
          top: '52%',
          style: {
            text: `¥${formatMoney(skuTotal)}`,
            fill: '#0f172a',
            fontSize: 16,
            fontWeight: 'bold',
            textAlign: 'center'
          }
        }
      ]
    }
    const inst = donutChart.getChartInstance()
    if (inst) {
      inst.setOption(option, { notMerge: true })
    } else {
      // 首次渲染后在 nextTick 再应用一次，确保弹窗布局稳定后中心文字（graphic）正确定位
      donutChart.initChart(option as any)
      nextTick(() => donutChart.getChartInstance()?.setOption(option, { notMerge: true }))
    }
  }

  /** 批次调色板：环形图每个批次独立一种颜色（与状态无关），优先取这 10 色（中间色），超出后随机取色 */
  const BATCH_PALETTE = [
    '#38bdf8',
    '#4ade80',
    '#fb923c',
    '#c084fc',
    '#2dd4bf',
    '#818cf8',
    '#f472b6',
    '#22d3ee',
    '#a3e635',
    '#facc15'
  ]
  function getBatchColor(index: number): string {
    if (index < BATCH_PALETTE.length) return BATCH_PALETTE[index]
    // 超出 10 色后按"黄金角"分配色相，颜色随机分散且同 index 稳定（避免重渲染闪烁）
    const hue = (index * 137.508) % 360
    return `hsl(${hue.toFixed(0)}, 65%, 55%)`
  }

  /** 金额展示：有几位小数就展示几位（不补零、不强制两位），保留千分位分组 */
  function formatMoney(val: number): string {
    const decimals = (String(val).split('.')[1] || '').length
    return val.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  function resetState() {
    period.value = 'month'
    dateRange.value = getDefaultRange('month')
    selectedMetrics.value = ['unitCost']
    selectedPoint.value = null
    pointDonut.value = null
  }

  function handleClosed() {
    // 释放图表实例，避免下次打开时复用绑定到已销毁 DOM 的僵尸实例导致不渲染
    mainChart.releaseChart()
    donutChart.releaseChart()
    trendData.value = null
    resetState()
  }

  async function handleExport() {
    if (!exportRef.value || !trendData.value) {
      ElMessage.warning('暂无可导出内容')
      return
    }
    if (loading.value) {
      ElMessage.warning('数据加载中，请稍后再导出')
      return
    }
    exporting.value = true
    try {
      // 等待布局稳定，确保 ECharts canvas 已绘制完成
      await nextTick()
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
      await new Promise((resolve) => setTimeout(resolve, 1000))
      const code = headerSku.value === '—' ? 'SKU' : headerSku.value
      const filename = `${code}-综合成本趋势分析-${dayjs().format('YYYYMMDD-HHmmss')}.png`
      await exportElementToPng(exportRef.value, { filename, scale: 2 })
      ElMessage.success('图片已导出')
    } catch (error) {
      console.error('[sku-cost-trend] export image failed:', error)
      ElMessage.error('导出图片失败，请稍后重试')
    } finally {
      exporting.value = false
    }
  }

  /** 弹窗打开 或 周期/范围/SKU 变化 时拉数据 */
  watch(
    () => [props.visible, props.productRow?.id, period.value, dateRange.value] as const,
    ([visible]) => {
      if (visible && props.productRow) loadData()
    },
    { deep: true }
  )

  /** 指标变化时只重绘主图，无需重拉数据 */
  watch(selectedMetrics, () => {
    if (trendData.value) renderMainChart()
  })
</script>

<style lang="scss">
  .sku-cost-trend-dialog {
    border-radius: 8px;

    .el-dialog__header {
      padding: 16px 20px;
      margin-right: 0;
      background: #fff;
      border-bottom: 1px solid #ebeef5;
    }

    .el-dialog__body {
      padding: 0 !important;
      background: #f5f7fa;
    }

    .dialog-header {
      display: flex;
      align-items: center;
      justify-content: space-between;

      .dialog-title {
        margin: 0;
        font-size: 16px;
        font-weight: 600;
        color: #333;

        &__sep {
          margin: 0 6px;
          color: #ccc;
        }
      }
    }

    .dialog-body {
      padding: 16px 20px;
    }

    /* 导出图片时：el-date-picker 默认用 box-shadow 描边，html2canvas 渲染会发虚/错位，
         这里临时换成真实 1px 浅灰实线，导出图边框更清晰。
         注：input 文字的垂直居中无法靠 CSS 解决（html2canvas 对 input 的已知 bug），
         已在 export-element-image.ts 的 onclone 里把 input 替换为 span 处理 */
    .dialog-body.is-exporting {
      .el-input__wrapper {
        border: 1px solid #dcdfe6 !important;
        box-shadow: none !important;
      }

      /* 分隔符是 span，不受 input bug 影响，用 flex 让其文字上下居中 */
      .el-range-separator {
        display: inline-flex !important;
        align-items: center !important;
        height: 100% !important;
        line-height: normal !important;
      }

      /* html2canvas 把 flex 子项当成 inline-block 按基线对齐，导致"指标"标题与
           checkbox 行错位。给这些子项加 vertical-align:middle，让其按中线对齐
           （平时 flex 布局忽略 vertical-align，无副作用） */
      .toolbar-label,
      .metric-checks,
      .metric-dot {
        vertical-align: middle !important;
      }

      /* html2canvas 对 flex 居中支持弱，会把 checkbox 方框顶对齐（显得偏上）。
           导出时改用 inline-block + vertical-align:middle，让方框与文字居中对齐 */
      .el-checkbox {
        display: inline-block !important;
        vertical-align: middle !important;
        transform: translateY(8px);
      }

      .el-checkbox__input,
      .el-checkbox__label {
        display: inline-block !important;
        vertical-align: middle !important;
      }

      .el-checkbox__label {
        line-height: normal !important;
      }

      /* 对号默认用旋转 45° 的边框绘制，html2canvas 对 transform 支持差会让对号偏上。
           导出时（仅勾选态）改用真实 ✓ 字符 + 行高居中，不依赖 transform */
      .el-checkbox__input.is-checked .el-checkbox__inner::after {
        inset: 0 !important;
        width: auto !important;
        height: auto !important;
        margin: 0 !important;
        font-size: 11px !important;
        line-height: 14px !important;
        color: #fff !important;
        text-align: center !important;
        content: '✓' !important;
        border: 0 !important;
        transform: none !important;
        // width: 3px;
        // height: 8px;
        // margin: auto;
        // border: 2px solid white;
        // border-left: 0;
        // border-top: 0;
        // transform: translate(-45%, -60%) rotate(45deg) scale(0.86) !important;
        // transform-origin: center;
      }
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(4, minmax(0, 1fr));
      gap: 12px;
      margin-bottom: 16px;

      .summary-card {
        padding: 14px 16px;
        background: #fff;
        border-radius: 8px;

        &__label {
          margin-bottom: 6px;
          font-size: 12px;
          color: #999;
        }

        &__value {
          font-size: 22px;
          font-weight: 600;
          line-height: 1.2;
          color: #333;

          .unit {
            margin-left: 4px;
            font-size: 12px;
            color: #999;
          }
        }

        &__sub {
          margin-top: 6px;
          font-size: 12px;
          color: #999;
        }

        &--blue {
          background: linear-gradient(135deg, #eef2ff 0%, #fff 100%);
        }

        &--green {
          background: linear-gradient(135deg, #ecfdf5 0%, #fff 100%);
        }

        &--orange {
          background: linear-gradient(135deg, #fff7ed 0%, #fff 100%);
        }

        &--gray {
          background: linear-gradient(135deg, #f3f4f6 0%, #fff 100%);
        }
      }
    }

    .toolbar-line {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
      padding: 8px 0;

      .toolbar-label {
        font-size: 12px;
        color: #666;

        .toolbar-hint {
          margin-left: 2px;
          color: #999;
        }
      }

      .metric-checks {
        display: flex;
        flex-wrap: wrap;
        gap: 16px;

        .metric-dot {
          display: inline-block;
          width: 8px;
          height: 8px;
          margin-right: 4px;
          vertical-align: middle;
          border-radius: 50%;
        }
      }
    }

    .chart-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 430px;
      gap: 16px;
      margin-top: 8px;

      .chart-main {
        position: relative;
        padding: 12px;
        background: #fff;
        border-radius: 8px;

        &__inner {
          width: 100%;
          height: 360px;
        }

        &__empty {
          position: absolute;
          inset: 0;
          background: rgb(255 255 255 / 90%);
        }
      }

      .chart-side {
        display: flex;
        flex-direction: column;
        padding: 12px;
        background: #fff;
        border-radius: 8px;

        &__title {
          font-size: 14px;
          font-weight: 600;
          color: #333;
        }

        &__subtitle {
          margin-top: 2px;
          margin-bottom: 4px;
          font-size: 12px;
          color: #999;
        }

        &__donut {
          width: 100%;
          height: 240px;
        }
      }

      .donut-legend {
        padding: 8px 4px 0;
        margin: 0;
        list-style: none;
        border-top: 1px dashed #eee;

        li {
          display: grid;
          grid-template-columns: 14px 30px 50px minmax(0, 1fr) 50px;
          gap: 8px;
          align-items: center;
          padding: 4px 0;
          font-size: 12px;
          color: #333;

          .dot {
            width: 10px;
            height: 10px;
            border-radius: 2px;
          }

          .no {
            font-weight: 600;
            color: #666;
          }

          .status {
            color: #999;
          }

          .amount {
            justify-self: end;
            font-weight: 500;
          }

          .ratio {
            justify-self: end;
            color: #666;
          }
        }
      }
    }

    .dialog-footer {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
    }

    .dialog-close {
      width: 32px;
      height: 32px;
      padding: 0;
    }
  }
</style>
