<!-- 历史价格版本柱状图 -->
<template>
  <div ref="chartRef" class="price-history-bar-chart" />
</template>

<script setup lang="ts">
  import type { EChartsOption } from '@/utils/echarts'
  import { useChartComponent } from '@/composables/useChart'
  import type { PriceHistoryVersion } from '../utils/mock-price-history'

  defineOptions({ name: 'PriceHistoryBarChart' })

  const props = withDefaults(
    defineProps<{
      versions: PriceHistoryVersion[]
      color?: string
      height?: string
    }>(),
    {
      color: '#409eff',
      height: '140px'
    }
  )

  const isEmptyData = () => !props.versions?.length

  const { chartRef } = useChartComponent({
    props: {
      height: props.height,
      loading: false,
      isEmpty: isEmptyData()
    },
    checkEmpty: isEmptyData,
    watchSources: [() => props.versions, () => props.color],
    chartOptions: { threshold: 0.05 },
    generateOptions: (): EChartsOption => {
      const chronological = [...props.versions].reverse()
      const labels = chronological.map((v) => v.version)
      const values = chronological.map((v) => v.price)

      return {
        animation: false,
        grid: { top: 12, right: 8, bottom: 24, left: 40 },
        xAxis: {
          type: 'category',
          data: labels,
          axisLine: { lineStyle: { color: '#dcdfe6' } },
          axisTick: { show: false },
          axisLabel: { color: '#909399', fontSize: 11 }
        },
        yAxis: {
          type: 'value',
          splitLine: { lineStyle: { type: 'dashed', color: '#ebeef5' } },
          axisLabel: {
            color: '#909399',
            fontSize: 11,
            formatter: (val: number) => `¥${val}`
          }
        },
        tooltip: {
          trigger: 'axis',
          confine: true,
          formatter: (params: unknown) => {
            const list = params as { name: string; value: number }[]
            const item = list?.[0]
            if (!item) return ''
            return `${item.name}<br/>¥${Number(item.value)}`
          }
        },
        series: [
          {
            type: 'bar',
            data: values,
            barMaxWidth: 28,
            itemStyle: {
              color: props.color,
              borderRadius: [3, 3, 0, 0]
            }
          }
        ]
      }
    }
  })
</script>

<style scoped>
  .price-history-bar-chart {
    width: 100%;
    height: 180px;
  }
</style>
