<template>
  <div ref="chartRef" class="cost-trend-detail-main-chart" />
</template>

<script setup lang="ts">
  import { nextTick, onMounted, watch } from 'vue'
  import { useChart } from '@/composables/useChart'
  import type { TrendDetailData, TrendDetailMetricKey } from '../utils/mock-trend-detail'
  import { buildTrendMainChartOption, type SupplierSelection } from '../utils/trend-detail-chart'

  defineOptions({ name: 'CostTrendDetailMainChart' })

  const props = defineProps<{
    data: TrendDetailData | null
    metrics: TrendDetailMetricKey[]
    supplierSelection: SupplierSelection
    selectedMonth: string | null
    /** 供应商配色基准顺序（与列表标签同序），按 supplierName 取色 */
    supplierOrder?: string[]
  }>()

  const emit = defineEmits<{
    'month-click': [month: string]
  }>()

  const isEmpty = () => !props.data?.months.length || !props.metrics.length

  const { chartRef, getChartInstance, initChart, emptyStateManager } = useChart({
    threshold: 0.05
  })

  function buildOptions() {
    if (!props.data) return null
    return buildTrendMainChartOption({
      data: props.data,
      metrics: props.metrics,
      supplierSelection: props.supplierSelection,
      selectedMonth: props.selectedMonth,
      supplierOrder: props.supplierOrder
    })
  }

  function bindChartClick() {
    const chart = getChartInstance()
    if (!chart || !props.data) return
    chart.off('click')
    // 仅响应 x 轴日期标签点击（不再响应折线/柱子数据点）
    chart.on(
      'click',
      (params: { componentType?: string; targetType?: string; value?: unknown }) => {
        if (params.componentType !== 'xAxis' || params.targetType !== 'axisLabel') return
        const label = String(params.value ?? '')
        if (label) emit('month-click', label)
      }
    )
  }

  /** 全量替换 option，避免取消指标后旧 series 残留 */
  function applyChartOptions() {
    const options = buildOptions()
    if (!options) return

    const chart = getChartInstance()
    if (chart) {
      chart.setOption(options, { notMerge: true })
      bindChartClick()
      return
    }
    initChart(options)
    nextTick(() => {
      getChartInstance()?.setOption(options, { notMerge: true })
      bindChartClick()
    })
  }

  function refreshChart() {
    nextTick(() => {
      if (isEmpty()) {
        getChartInstance()?.clear()
        emptyStateManager.create()
        return
      }
      emptyStateManager.remove()
      applyChartOptions()
    })
  }

  watch(
    () =>
      [
        props.data,
        props.metrics.slice(),
        props.supplierSelection,
        props.selectedMonth,
        props.supplierOrder
      ] as const,
    refreshChart,
    { deep: true }
  )

  onMounted(refreshChart)
</script>

<style scoped>
  .cost-trend-detail-main-chart {
    width: 100%;
    height: 360px;
  }
</style>
