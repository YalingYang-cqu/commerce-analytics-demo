<!-- 分时折线图：x 轴为小时，可绘制多条系列（汇总/对比通用） -->
<template>
  <div ref="chartRef" class="hour-line-chart" :style="{ height }"></div>
</template>

<script setup lang="ts">
  import { type EChartsOption } from '@/utils/echarts'
  import { useChartComponent, useChartOps } from '@/composables/useChart'

  defineOptions({ name: 'HourLineChart' })

  interface LineSeries {
    name: string
    data: number[]
  }

  interface Props {
    /** x 轴分类（小时标签） */
    categories: string[]
    /** 折线系列 */
    series: LineSeries[]
    height?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    height: '340px'
  })

  const isEmptyData = () =>
    !props.series?.length || props.series.every((s) => !s.data?.some((v) => v != null))

  const { chartRef } = useChartComponent({
    props: {
      height: props.height,
      loading: false,
      isEmpty: isEmptyData()
    },
    checkEmpty: isEmptyData,
    watchSources: [() => props.categories, () => props.series],
    generateOptions: (): EChartsOption => {
      const { colors, fontColor, fontSize } = useChartOps()
      return {
        color: colors,
        grid: { top: 32, right: 16, bottom: 48, left: 8, containLabel: true },
        tooltip: { trigger: 'axis' },
        legend: {
          bottom: 0,
          icon: 'roundRect',
          itemWidth: 12,
          itemHeight: 12,
          textStyle: { color: fontColor, fontSize },
          data: props.series.map((s) => s.name)
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: props.categories,
          axisLabel: { color: fontColor, fontSize },
          axisLine: { lineStyle: { color: '#EDEDED' } },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: fontColor, fontSize },
          axisLine: { show: false },
          splitLine: { lineStyle: { color: '#EDEDED', type: 'dashed' } }
        },
        series: props.series.map((s) => ({
          name: s.name,
          type: 'line',
          smooth: true,
          showSymbol: false,
          data: s.data
        }))
      }
    }
  })
</script>

<style lang="scss" scoped>
  .hour-line-chart {
    width: 100%;
  }
</style>
