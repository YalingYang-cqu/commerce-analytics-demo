<!-- 表格内趋势分析迷你折线图：懒加载 + 销毁，适配多实例场景 -->
<template>
  <div ref="chartRef" class="cost-trend-mini-chart" :style="{ width: width, height: height }"></div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { graphic, type EChartsOption } from '@/utils/echarts'
  import { getCssVar, hexToRgba } from '@/utils/ui'
  import { useChartComponent } from '@/composables/useChart'
  import type { TrendPoint } from '../utils/mock-data'
  import type { MetricType } from '../utils/mock-data'
  import { formatMetricValue } from '../utils/mock-data'

  defineOptions({ name: 'CostTrendMiniChart' })

  interface Props {
    /** 趋势数据（时间正序） */
    data: TrendPoint[]
    /** 指标类型，影响 tooltip 金额格式 */
    metric?: MetricType
    width?: string
    height?: string
    /** 线条颜色 */
    color?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    metric: 'unitCost',
    width: '100px',
    height: '48px',
    color: ''
  })

  const lineColor = computed(() => props.color || getCssVar('--el-color-primary'))

  const isEmptyData = () => {
    return !props.data?.length || props.data.every((d) => d.value === null || d.value === undefined)
  }

  const { chartRef } = useChartComponent({
    props: {
      height: props.height,
      loading: false,
      isEmpty: isEmptyData()
    },
    checkEmpty: isEmptyData,
    watchSources: [() => props.data, () => props.metric, () => props.color],
    chartOptions: { threshold: 0.05 },
    generateOptions: (): EChartsOption => {
      const labels = (props.data ?? []).map((d) => d.label)
      const values = (props.data ?? []).map((d) => d.value ?? null)
      const color = lineColor.value

      return {
        animation: false,
        grid: { top: 4, right: 4, bottom: 4, left: 4 },
        xAxis: {
          type: 'category',
          data: labels,
          show: false,
          boundaryGap: false
        },
        yAxis: {
          type: 'value',
          show: false,
          scale: true
        },
        tooltip: {
          trigger: 'axis',
          confine: true,
          appendToBody: true,
          borderWidth: 0,
          padding: [6, 10],
          textStyle: {
            fontSize: 12
          },
          extraCssText:
            'font-size: 12px; line-height: 1.5; box-shadow: 0 2px 8px rgba(0,0,0,.12); border-radius: 4px;',
          formatter: (params: unknown) => {
            const list = Array.isArray(params) ? params : [params]
            const first = list[0] as { dataIndex?: number; axisValue?: string; value?: number }
            const idx = first?.dataIndex ?? 0
            const label = first?.axisValue ?? labels[idx] ?? ''
            const val = first?.value ?? values[idx]
            if (val === null || val === undefined) return `${label}<br/>—`
            const amount = formatMetricValue(val as number, props.metric)
            return `${label}<br/>${amount}`
          }
        },
        series: [
          {
            type: 'line',
            data: values,
            smooth: true,
            showSymbol: false,
            connectNulls: false,
            lineStyle: { width: 2, color },
            areaStyle: {
              color: new graphic.LinearGradient(0, 0, 0, 1, [
                { offset: 0, color: hexToRgba(color, 0.25).rgba },
                { offset: 1, color: hexToRgba(color, 0.02).rgba }
              ])
            }
          }
        ]
      }
    }
  })
</script>

<style lang="scss" scoped>
  .cost-trend-mini-chart {
    flex-shrink: 0;
  }
</style>
