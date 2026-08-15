<template>
  <div class="cost-trend-detail-donut">
    <div ref="chartRef" class="cost-trend-detail-donut__chart" />
    <ul class="donut-legend">
      <li v-for="(item, idx) in items" :key="item.name">
        <span
          class="dot"
          :style="{ background: getSupplierChartColor(colorIndexOf(item.name, idx)) }"
        />
        <span class="name">{{ formatSupplierShortName(item.name) }}</span>
        <span class="amount">¥{{ formatMoney(item.amount) }}</span>
        <span class="ratio">{{ item.ratio }}%</span>
      </li>
    </ul>
    <p class="donut-tip">点击供应商可在主图筛选 →</p>
  </div>
</template>

<script setup lang="ts">
  import { nextTick, onMounted, watch } from 'vue'
  import { useChart } from '@/composables/useChart'
  import { getSupplierChartColor } from '../utils/mock-price-history'
  import { formatSupplierShortName } from '../utils/supplier-tag'
  import { buildTrendDonutOption } from '../utils/trend-detail-chart'

  defineOptions({ name: 'CostTrendDetailDonutChart' })

  const props = defineProps<{
    items: { name: string; amount: number; ratio: number }[]
    centerAmount: number
    /** 供应商配色基准顺序（与列表标签同序），按 supplierName 取色 */
    supplierOrder?: string[]
  }>()

  const isEmpty = () => !props.items.length

  /** 按 supplierName 在基准顺序中的位置取色，回退到当前渲染序号 */
  const colorIndexOf = (name: string, fallback: number): number => {
    const i = props.supplierOrder?.indexOf(name) ?? -1
    return i >= 0 ? i : fallback
  }

  const { chartRef, getChartInstance, initChart, emptyStateManager } = useChart({
    threshold: 0.05
  })

  function buildOptions() {
    return buildTrendDonutOption({
      items: props.items,
      centerAmount: props.centerAmount,
      supplierOrder: props.supplierOrder
    })
  }

  function applyChartOptions() {
    const options = buildOptions()
    const chart = getChartInstance()
    if (chart) {
      chart.setOption(options, { notMerge: true })
      return
    }
    initChart(options)
    nextTick(() => getChartInstance()?.setOption(options, { notMerge: true }))
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

  watch(() => [props.items, props.centerAmount, props.supplierOrder] as const, refreshChart, {
    deep: true
  })

  onMounted(refreshChart)

  /** 金额展示：有几位小数就展示几位（不补零、不强制两位），保留千分位分组 */
  function formatMoney(val: number) {
    const decimals = (String(val).split('.')[1] || '').length
    return val.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }
</script>

<style lang="scss" scoped>
  .cost-trend-detail-donut {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
  }

  .cost-trend-detail-donut__chart {
    width: 100%;
    height: 270px;
  }

  .donut-legend {
    flex: 1;
    padding: 0;
    margin: 4px 0 0;
    list-style: none;

    li {
      display: grid;
      grid-template-columns: 8px 1fr auto auto;
      gap: 4px 8px;
      align-items: center;
      padding: 8px 0;
      font-size: 12px;
      border-bottom: 1px solid #f0f2f5;

      &:last-child {
        border-bottom: none;
      }
    }

    .dot {
      width: 8px;
      height: 8px;
      border-radius: 50%;
    }

    .name {
      color: #606266;
    }

    .amount {
      font-weight: 500;
      color: #303133;
      text-align: right;
    }

    .ratio {
      min-width: 42px;
      font-size: 12px;
      color: #909399;
      text-align: right;
    }
  }

  .donut-tip {
    margin: 10px 0 0;
    font-size: 12px;
    color: #c0c4cc;
    text-align: center;
  }
</style>
