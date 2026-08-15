<!-- 头程成本趋势分析弹窗 -->
<template>
  <ElDialog
    v-model="dialogVisible"
    width="1200px"
    align-center
    destroy-on-close
    :show-close="false"
    class="cost-trend-detail-dialog"
    @closed="handleClosed"
  >
    <template #header>
      <div class="dialog-header">
        <div>
          <h3 class="dialog-title">
            {{ headerProductCode }}
            <span class="dialog-title__sep">·</span>
            头程成本趋势分析
          </h3>
        </div>
        <ElButton class="dialog-close" text @click="dialogVisible = false">
          <ElIcon :size="18"><Close /></ElIcon>
        </ElButton>
      </div>
    </template>

    <div ref="exportRef" class="dialog-body" :class="{ 'is-exporting': exporting }">
      <div v-loading="loading" class="dialog-body__inner">
        <template v-if="trendData">
          <div class="summary-cards">
            <div class="summary-card summary-card--blue">
              <div class="summary-card__label">
                <TableHeaderTip label="当月发货量" tip="本月的总发货数量" />
              </div>
              <div class="summary-card__value">
                {{ trendData.summary.totalQuantity.toLocaleString() }}
                <span class="unit">件</span>
              </div>
              <div class="summary-card__sub">
                {{ dayjs().format('YYYY-MM') }}
              </div>
            </div>
            <div class="summary-card summary-card--green">
              <div class="summary-card__label">
                <TableHeaderTip label="总头程成本" tip="本月的头程总费用" />
              </div>
              <div class="summary-card__value">
                ¥{{ formatMoney(trendData.summary.totalAmount) }}
              </div>
              <div
                v-if="trendData.summary.amountRingRatio != null"
                class="summary-card__sub"
                :class="trendData.summary.amountRingRatio >= 0 ? 'is-up' : 'is-down'"
              >
                较上月
                {{ trendData.summary.amountRingRatio >= 0 ? '↑' : '↓' }}
                {{ Math.abs(trendData.summary.amountRingRatio) }}%
              </div>
            </div>
            <div class="summary-card summary-card--purple">
              <div class="summary-card__label">
                <TableHeaderTip label="当月单件成本" tip="当月头程成本 ÷ 当月发货量" />
              </div>
              <div class="summary-card__value">
                ¥{{ formatMoney(trendData.summary.weightedAvgPrice) }}
                <span class="unit">/件</span>
              </div>
              <div class="summary-card__sub">单个头程成本</div>
            </div>
            <div class="summary-card summary-card--gray">
              <div class="summary-card__label">
                <TableHeaderTip label="主导渠道" tip="当月发货数量占比最高的物流渠道" />
              </div>
              <div class="summary-card__value summary-card__value--sm">
                {{ formatChannelShortName(trendData.summary.dominantChannel.name) }}
                <span class="summary-card__sub">
                  {{ trendData.summary.dominantChannel.ratio }}%</span
                >
              </div>
              <div class="summary-card__sub"
                >按发货数量统计 · {{ trendData.summary.channelCount }} 个渠道</div
              >
            </div>
          </div>

          <div class="toolbar">
            <div class="toolbar-block toolbar-block--supplier">
              <span class="toolbar-label">
                物流渠道
                <span v-if="supplierMultiMode" class="toolbar-hint">(可多选)</span>
              </span>
              <div class="channel-tabs">
                <button
                  type="button"
                  class="channel-pill"
                  :class="{ 'is-active': isSupplierAll }"
                  @click="selectSupplierAll"
                >
                  全部
                </button>
                <button
                  v-for="name in trendData.suppliers"
                  :key="name"
                  type="button"
                  class="channel-pill"
                  :class="{ 'is-active': isSupplierActive(name) }"
                  @click="toggleSupplier(name)"
                >
                  {{ formatChannelShortName(name) }}
                </button>
              </div>
            </div>
            <div class="toolbar-block toolbar-block--metric">
              <span class="toolbar-label">指标 (可多选)</span>
              <ElCheckboxGroup v-model="selectedMetrics" class="metric-checks">
                <ElCheckbox v-for="item in TREND_METRIC_OPTIONS" :key="item.key" :label="item.key">
                  <span class="metric-icon" :style="{ background: item.color }" />
                  {{ item.label }}
                </ElCheckbox>
              </ElCheckboxGroup>
            </div>
          </div>

          <div class="chart-row">
            <div v-loading="chartLoading" class="chart-main">
              <CostTrendDetailMainChart
                v-if="selectedMetrics.length"
                :data="chartData"
                :metrics="selectedMetrics"
                :channel-selection="channelSelection"
                :selected-month="selectedMonth"
                @month-click="handleMonthClick"
              />
              <ElEmpty v-else description="请至少选择一个指标" />
            </div>
            <div class="chart-side">
              <div class="chart-side__title">物流渠道占比</div>
              <div class="chart-side__subtitle">{{ donutSubtitle }}</div>
              <CostTrendDetailDonutChart :items="donutItems" :center-amount="donutCenterAmount" />
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
  import dayjs from 'dayjs'
  import { Close } from '@element-plus/icons-vue'
  import {
    ElButton,
    ElCheckbox,
    ElCheckboxGroup,
    ElDialog,
    ElEmpty,
    ElIcon,
    ElMessage
  } from 'element-plus'
  import CostTrendDetailMainChart from './cost-trend-detail-main-chart.vue'
  import CostTrendDetailDonutChart from './cost-trend-detail-donut-chart.vue'
  import type { BatchCostRow, DimensionType } from '../utils/mock-data'
  import { exportElementToPng } from '../utils/export-element-image'
  import {
    fetchTrendChart,
    fetchTrendInit,
    getSupplierAmountDistribution,
    TREND_METRIC_OPTIONS,
    type TrendDetailData,
    type TrendDetailMetricKey
  } from '../utils/mock-trend-detail'
  import type { channelSelection as ChannelSelection } from '../utils/trend-detail-chart'
  import { formatChannelShortName } from '../utils/channel-tag'
  import TableHeaderTip from '@/components/core/tables/table-header-tip/index.vue'
  import { add } from '@/utils/common-util'

  defineOptions({ name: 'CostTrendDetailDialog' })

  const props = defineProps<{
    visible: boolean
    productRow: BatchCostRow | null
    dimension: DimensionType
    /** 统计周期，取页面查询的 period */
    period: string
    /** 出货时间起，取页面查询的 shipTimeStart */
    shipTimeStart: string | null
    /** 出货时间止，取页面查询的 shipTimeEnd */
    shipTimeEnd: string | null
  }>()

  const emit = defineEmits<{
    'update:visible': [value: boolean]
  }>()

  const loading = ref(false)
  const exporting = ref(false)
  const exportRef = ref<HTMLElement | null>(null)
  const trendData = ref<TrendDetailData | null>(null)
  const selectedMetrics = ref<TrendDetailMetricKey[]>(['unitCost'])
  const channelSelection = ref<ChannelSelection>('all')
  const selectedMonth = ref<string | null>(null)
  /** 左侧主图数据：随渠道/指标变化重新请求 */
  const chartData = ref<TrendDetailData | null>(null)
  const chartLoading = ref(false)

  /** 物流渠道列表（接口入参）：全部 → []（后端按全部处理），否则为已选渠道数组 */
  const channelListForApi = computed(() =>
    channelSelection.value === 'all' ? [] : channelSelection.value
  )

  const dialogVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const headerProductCode = computed(
    () => trendData.value?.productCode || props.productRow?.sku || '—'
  )

  const supplierMultiMode = computed(() => selectedMetrics.value.length === 1)

  const isSupplierAll = computed(() => channelSelection.value === 'all')

  const donutItems = computed(() => {
    if (!trendData.value) return []
    return getSupplierAmountDistribution(trendData.value, selectedMonth.value)
  })

  const donutCenterAmount = computed(() => {
    if (!donutItems.value.length) return 0
    return donutItems.value.reduce((s, i) => add(s, i.amount), 0)
  })

  const donutSubtitle = computed(() => {
    if (selectedMonth.value) {
      return `${selectedMonth.value} 头程成本分布`
    }
    return '近12个月头程成本分布'
  })

  /** 金额展示：有几位小数就展示几位（不补零、不强制两位），保留千分位分组 */
  function formatMoney(val: number) {
    const decimals = (String(val).split('.')[1] || '').length
    return val.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  function isSupplierActive(name: string) {
    if (channelSelection.value === 'all') return false
    return channelSelection.value.includes(name)
  }

  function selectSupplierAll() {
    channelSelection.value = 'all'
  }

  function toggleSupplier(name: string) {
    if (supplierMultiMode.value) {
      if (channelSelection.value === 'all') {
        channelSelection.value = [name]
        return
      }
      const list = [...channelSelection.value]
      const idx = list.indexOf(name)
      if (idx >= 0) {
        list.splice(idx, 1)
        channelSelection.value = list.length ? list : 'all'
      } else {
        channelSelection.value = [...list, name]
      }
      return
    }
    channelSelection.value = [name]
  }

  function handleMonthClick(month: string) {
    selectedMonth.value = selectedMonth.value === month ? null : month
  }

  // 标记首次初始化是否完成：未完成时，metrics/channel 的变化不触发额外请求（避免打开时多查一次）
  const chartReady = ref(false)

  /** 打开弹窗：单次请求，同时填充右侧概览 + 左侧默认主图 */
  async function loadInit() {
    if (!props.productRow) return
    loading.value = true
    chartLoading.value = true
    chartReady.value = false
    try {
      const { overview, chart } = await fetchTrendInit(props.productRow, props.dimension, {
        period: props.period,
        shipTimeStart: props.shipTimeStart,
        shipTimeEnd: props.shipTimeEnd
      })
      trendData.value = overview
      chartData.value = chart
    } finally {
      loading.value = false
      chartLoading.value = false
      chartReady.value = true
    }
  }

  /** 左侧主图：单次请求，渠道数=1 取 series，>1 取 compareSeries */
  async function loadChart() {
    if (!props.productRow || !selectedMetrics.value.length) return
    chartLoading.value = true
    try {
      chartData.value = await fetchTrendChart(props.productRow, props.dimension, {
        period: props.period,
        shipTimeStart: props.shipTimeStart,
        shipTimeEnd: props.shipTimeEnd,
        channels: channelListForApi.value,
        metricKeys: selectedMetrics.value
      })
    } finally {
      chartLoading.value = false
    }
  }

  function resetState() {
    selectedMetrics.value = ['unitCost']
    channelSelection.value = 'all'
    selectedMonth.value = null
  }

  function handleClosed() {
    trendData.value = null
    chartData.value = null
    chartReady.value = false
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
      await nextTick()
      await new Promise((r) => requestAnimationFrame(() => r(undefined)))
      await new Promise((r) => setTimeout(r, 300))
      const code = trendData.value.productCode || 'trend'
      await exportElementToPng(exportRef.value, {
        filename: `${code}-头程成本趋势分析-${dayjs().format('YYYYMMDD-HHmmss')}.png`,
        scale: 2
      })
      ElMessage.success('图片已导出')
    } catch (e) {
      console.error(e)
      ElMessage.error('导出图片失败')
    } finally {
      exporting.value = false
    }
  }

  watch(selectedMetrics, (metrics) => {
    if (!metrics.length) {
      selectedMetrics.value = ['unitCost']
      return
    }
    if (metrics.length >= 2) {
      if (channelSelection.value !== 'all' && channelSelection.value.length > 1) {
        channelSelection.value = 'all'
      }
    }
  })

  // 打开弹窗：单次请求，填充右侧概览 + 左侧默认主图
  watch(
    () => [props.visible, props.productRow?.id, props.dimension] as const,
    ([visible]) => {
      if (visible && props.productRow) {
        resetState()
        loadInit()
      }
    }
  )

  // 渠道/指标变化时仅重新请求左侧主图（初始化完成后才生效，避免打开时重复请求）
  watch(
    () => [selectedMetrics.value.slice(), channelSelection.value] as const,
    () => {
      if (props.visible && props.productRow && chartReady.value) loadChart()
    },
    { deep: true }
  )
</script>

<style lang="scss">
  .cost-trend-detail-dialog {
    overflow: hidden;
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

    .el-dialog__footer {
      padding: 12px 20px;
      background: #fff;
      border-top: 1px solid #ebeef5;
    }

    /* 导出图片时修正 html2canvas 对 checkbox 的渲染：方框/文字按中线对齐、对号居中
       （html2canvas 的 flex 与 transform 支持弱，会让方框和对号偏上） */
    .dialog-body.is-exporting {
      .toolbar-label,
      .metric-checks,
      .metric-icon {
        vertical-align: middle !important;
      }

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

      /* 对号默认用旋转 45° 边框绘制，html2canvas transform 支持差会偏上；
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
      }
    }
  }
</style>

<style lang="scss" scoped>
  .dialog-header {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
  }

  .dialog-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #303133;

    &__sep {
      margin: 0 6px;
      font-weight: 400;
      color: #909399;
    }
  }

  .dialog-close {
    flex-shrink: 0;
    color: #909399;
  }

  .dialog-body__inner {
    min-height: 400px;
    padding: 16px 20px 20px;
  }

  .summary-cards {
    display: flex;
    gap: 10px;
    margin-bottom: 12px;
  }

  .summary-card {
    flex: 1;
    min-width: 0;
    padding: 14px 16px;
    border-radius: 8px;

    &--blue {
      background: linear-gradient(135deg, #eef5ff 0%, #e8f2ff 100%);
    }

    &--green {
      background: linear-gradient(135deg, #eefaf3 0%, #e8f7ef 100%);
    }

    &--purple {
      background: linear-gradient(135deg, #f3f0ff 0%, #ede9ff 100%);
    }

    &--gray {
      background: linear-gradient(135deg, #f6f7f9 0%, #f0f2f5 100%);
    }

    &__label {
      margin-bottom: 8px;
      font-size: 12px;
      color: #909399;
    }

    &__value {
      font-size: 22px;
      font-weight: 600;
      line-height: 1.25;
      color: #303133;

      &--sm {
        font-size: 18px;
      }

      .unit {
        margin-left: 2px;
        font-size: 14px;
        font-weight: 500;
        color: #606266;
      }
    }

    &__sub {
      margin-top: 8px;
      font-size: 12px;
      line-height: 1.4;
      color: #909399;

      &.is-up {
        color: #f56c6c;
      }

      &.is-down {
        color: #67c23a;
      }
    }
  }

  .toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 12px 24px;
    align-items: flex-start;
    justify-content: space-between;
    padding: 12px 16px;
    margin-bottom: 12px;
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
  }

  .toolbar-block {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 12px;
    align-items: center;
    min-width: 0;

    &--supplier {
      flex: 1;
    }

    &--metric {
      flex-shrink: 0;
    }
  }

  .toolbar-label {
    flex-shrink: 0;
    font-size: 13px;
    font-weight: 500;
    color: #606266;
  }

  .toolbar-hint {
    font-weight: 400;
    color: #909399;
  }

  .channel-tabs {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
  }

  .channel-pill {
    padding: 5px 14px;
    font-size: 13px;
    line-height: 20px;
    color: #606266;
    cursor: pointer;
    background: #f4f4f5;
    border: 1px solid transparent;
    border-radius: 16px;
    transition: all 0.2s;

    &:hover {
      color: #409eff;
      background: #ecf5ff;
    }

    &.is-active {
      color: #409eff;
      background: #ecf5ff;
      border-color: #b3d8ff;
    }
  }

  .metric-checks {
    display: flex;
    flex-wrap: wrap;
    gap: 16px 20px;

    :deep(.el-checkbox) {
      margin-right: 0;
    }

    :deep(.el-checkbox__label) {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      padding-left: 6px;
      font-size: 13px;
      color: #606266;
    }

    .metric-icon {
      display: inline-block;
      flex-shrink: 0;
      width: 10px;
      height: 10px;
      border-radius: 2px;
    }
  }

  .chart-row {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 350px;
    gap: 12px;
    align-items: stretch;
  }

  .chart-main,
  .chart-side {
    background: #fff;
    border: 1px solid #ebeef5;
    border-radius: 8px;
  }

  .chart-main {
    min-height: 380px;
    padding: 12px 8px 4px;
  }

  .chart-side {
    display: flex;
    flex-direction: column;
    padding: 16px 14px 12px;

    &__title {
      font-size: 14px;
      font-weight: 600;
      color: #303133;
    }

    &__subtitle {
      margin: 4px 0;
      font-size: 12px;
      color: #909399;
    }
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
