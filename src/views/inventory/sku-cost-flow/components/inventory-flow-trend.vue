<template>
  <div class="inventory-flow-trend" v-loading="loading">
    <LineChart
      :metrics="chartMetrics"
      :x-axis="xAxis"
      :mode="mode"
      :raw-min-zero="false"
      :loading="loading"
      height="216px"
      title="库存指标趋势"
      inline-header
      @remove="removeMetric"
    >
      <template #toolbar>
        <div class="trend-mode-seg">
          <button type="button" :class="{ active: mode === 'raw' }" @click="mode = 'raw'">
            原值
          </button>
          <button
            type="button"
            :class="{ active: mode === 'normalized' }"
            @click="mode = 'normalized'"
          >
            归一化
          </button>
        </div>
      </template>
    </LineChart>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import LineChart from '@/components/core/charts-comp/line-chart.vue'
  import {
    DEFAULT_METRIC_PALETTE,
    type ChartMetric,
    type ChartMode
  } from '@/components/core/charts-comp/types'
  import { skuCostFlowTrend } from '@/api/inventory/sku-cost-flow'
  import { formatInt, formatMoney } from '../../utils/format'
  import { TREND_OPTION_MAP } from '../utils/trend'

  defineOptions({ name: 'InventoryFlowTrend' })

  const props = defineProps<{
    params: Record<string, any>
  }>()

  /** 对比指标由指标卡的「配置指标」面板选择，这里只负责取数与渲染 */
  const selectedKeys = defineModel<string[]>('metrics', { required: true })

  const loading = ref(false)
  const mode = ref<ChartMode>('normalized')
  const xAxis = ref<string[]>([])
  const seriesMap = ref<Record<string, number[]>>({})
  let requestSeq = 0

  const removeMetric = (key: string) => {
    if (selectedKeys.value.length <= 1) {
      ElMessage.warning('趋势图至少保留 1 个指标')
      return
    }
    selectedKeys.value = selectedKeys.value.filter((item) => item !== key)
  }

  const loadTrend = async () => {
    if (!selectedKeys.value.length) return
    const seq = ++requestSeq
    loading.value = true
    try {
      const res: any = await skuCostFlowTrend({
        ...props.params,
        metrics: selectedKeys.value
      })
      if (seq !== requestSeq) return
      const payload = res?.data || {}
      xAxis.value = payload.xAxis || []
      seriesMap.value = Object.fromEntries(
        (payload.series || []).map((series: { metric: string; values: number[] }) => [
          series.metric,
          series.values || []
        ])
      )
    } finally {
      if (seq === requestSeq) loading.value = false
    }
  }

  const chartMetrics = computed<ChartMetric[]>(() =>
    selectedKeys.value.map((key, index) => {
      const option = TREND_OPTION_MAP.get(key)
      const isAmount = option?.format === 'amount'
      return {
        key,
        label: option?.label || key,
        color: DEFAULT_METRIC_PALETTE[index % DEFAULT_METRIC_PALETTE.length],
        lineType: index === 1 ? 'dashed' : index === 2 ? 'dotted' : 'solid',
        format: isAmount ? 'money' : 'number',
        formatter: isAmount
          ? (value: number) => formatMoney(value)
          : (value: number) => `${formatInt(value)} 件`,
        data: seriesMap.value[key] || []
      }
    })
  )

  watch(selectedKeys, loadTrend, { deep: true })
  watch(
    () => props.params,
    () => loadTrend(),
    { deep: true }
  )

  // 收起时父级用 v-if 卸载，展开即重新挂载取数
  onMounted(loadTrend)
</script>

<style scoped lang="scss">
  .inventory-flow-trend {
    padding-top: 8px;
    margin-top: 10px;
    border-top: 1px solid var(--el-border-color-lighter);
  }

  .trend-mode-seg {
    display: inline-flex;
    padding: 2px;
    background: #f4f6fb;
    border: 1px solid #dce3ef;
    border-radius: 7px;

    button {
      height: 24px;
      padding: 0 10px;
      font-size: 12px;
      color: #5f6877;
      cursor: pointer;
      background: transparent;
      border: 0;
      border-radius: 5px;

      &.active {
        color: var(--el-color-primary);
        background: #fff;
        box-shadow: 0 1px 3px rgb(15 23 42 / 8%);
      }
    }
  }
</style>
