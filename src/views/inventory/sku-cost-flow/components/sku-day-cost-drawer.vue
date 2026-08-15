<!-- SKU 当日成本抽屉：成本瀑布 + 期末结存的批次构成（= 下一次出库的 FIFO 顺序） -->
<template>
  <!-- 瀑布拆到采购 / 物流两段后 520 放不下，加宽到 720 -->
  <ElDrawer v-model="visible" :size="720" :destroy-on-close="true" @closed="onClosed">
    <template #header>
      <div class="drawer-title">
        <span class="title-text">SKU 当日成本</span>
        <span class="title-code">{{ detail?.row.msku || detail?.row.localSku }}</span>
      </div>
    </template>

    <div v-loading="loading" class="drawer-body">
      <template v-if="detail">
        <div class="head-grid">
          <div><span class="k">日期</span>{{ detail.row.invDate }}</div>
          <div><span class="k">仓库</span>{{ detail.row.warehouseName }}</div>
          <div><span class="k">本地SKU</span>{{ detail.row.localSku }}</div>
          <div>
            <span class="k">属性</span>
            {{ INV_ATTR_MAP[detail.row.invAttr]?.label || '-' }}
          </div>
          <div>
            <span class="k">期末结存</span>
            <b>{{ formatInt(detail.row.closingQty) }}</b> 件
          </div>
          <div>
            <span class="k">期末总成本</span>
            <b>{{ formatMoney(closingAmount) }}</b>
          </div>
        </div>

        <div class="seg">
          <div class="seg-title">
            成本瀑布
            <span class="seg-note"
              >期初结存 + 本期出入库 = 期末结存，hover 查看采购 / 物流构成</span
            >
            <div class="wf-mode-seg">
              <button type="button" :class="{ active: wfMode === 'cost' }" @click="wfMode = 'cost'">
                成本
              </button>
              <button type="button" :class="{ active: wfMode === 'qty' }" @click="wfMode = 'qty'">
                数量
              </button>
            </div>
          </div>
          <div ref="wfChartRef" class="wf-chart"></div>
        </div>

        <div class="seg">
          <div class="seg-title">
            期末结存的批次构成
            <span class="seg-note">按入仓日期升序 —— 下一次出库就按这个顺序消耗</span>
          </div>
          <ArtTable
            :data="detail.batches"
            row-key="batchId"
            :autoHeight="true"
            :columns="batchColumns"
            :pagination="undefined"
            :show-table-header="false"
            size="small"
            empty-text="该 SKU 在该仓无在仓批次"
          >
            <template #batchNo="{ row }">
              <span class="mono">{{ row.batchNo }}</span>
            </template>
            <template #operation="{ row }">
              <ElButton type="primary" link size="small" @click="emit('open-batch', row)">
                批次台账
              </ElButton>
            </template>
          </ArtTable>
        </div>

        <div class="seg">
          <div class="seg-title">
            近 30 天趋势
            <ElSelect
              v-model="trendKeys"
              multiple
              collapse-tags
              collapse-tags-tooltip
              size="small"
              placeholder="选择对比指标"
              class="trend-picker"
              :multiple-limit="TREND_LIMIT"
            >
              <ElOptionGroup v-for="group in TREND_GROUPS" :key="group.label" :label="group.label">
                <ElOption
                  v-for="item in group.items"
                  :key="item.key"
                  :label="item.label"
                  :value="item.key"
                />
              </ElOptionGroup>
            </ElSelect>
          </div>
          <LineChart
            :metrics="trendMetrics"
            :x-axis="trendDates"
            mode="normalized"
            height="200px"
            @remove="removeTrendMetric"
          />
        </div>
      </template>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'
  import { ElButton, ElDrawer, ElOption, ElOptionGroup, ElSelect } from 'element-plus'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import LineChart from '@/components/core/charts-comp/line-chart.vue'
  import { echarts, type EChartsOption } from '@/utils/echarts'
  import type { ColumnOption } from '@/types/component'
  import { skuDayCost } from '@/api/inventory/sku-cost-flow'
  import { INV_ATTR_MAP } from '../../utils/dict'
  import { formatInt, formatMoney } from '../../utils/format'
  import { idCol, metricCol } from '../columns/shared'
  import type { FlowRow } from '../utils/types'

  defineOptions({ name: 'SkuDayCostDrawer' })

  const props = defineProps<{ rowKey?: string }>()
  const emit = defineEmits<{ 'open-batch': [row: { batchId: string }] }>()
  const visible = defineModel<boolean>('visible', { default: false })

  interface WaterfallStep {
    key: string
    label: string
    qty: number
    purchase: number
    logistics: number
    amount: number
  }
  interface DayCostDetail {
    row: FlowRow
    waterfall: WaterfallStep[]
    batches: Array<Record<string, any>>
    /** 每个点带期初期末与六类业务的数量、成本，指标由下拉自选 */
    trend: Array<Record<string, any> & { date: string }>
  }

  const loading = ref(false)
  const detail = ref<DayCostDetail | null>(null)

  const closingAmount = computed(() =>
    detail.value
      ? Math.round(
          (detail.value.row.closingPurchaseAmount + detail.value.row.closingLogisticsAmount) * 100
        ) / 100
      : 0
  )

  /** 采购与物流可能一正一负（退货冲回），占比按绝对值算 */
  const percentOf = (step: WaterfallStep, part: 'purchase' | 'logistics') => {
    const base = Math.abs(step.purchase) + Math.abs(step.logistics)
    if (!base) return ''
    return `（${Math.round((Math.abs(step[part]) / base) * 1000) / 10}%）`
  }

  /* ---------------- 成本瀑布 ---------------- */

  /** 期初 / 期末是水位柱，中间六类业务是增减柱 */
  const isLevelStep = (key: string) => key === 'opening' || key === 'closing'

  const WF_OPENING_COLOR = '#4f46e5'
  const WF_CLOSING_COLOR = '#16a34a'
  const WF_UP_COLOR = '#22c55e'
  const WF_DOWN_COLOR = '#ef4444'
  /** 金额极小时柱高不足 1px，用最小柱高兜底可见性 */
  const WF_BAR_MIN_HEIGHT = 1

  const wfMode = ref<'cost' | 'qty'>('cost')
  const wfChartRef = ref<HTMLElement | null>(null)
  let wfChart: echarts.ECharts | null = null
  let wfResizeObserver: ResizeObserver | null = null

  const wfValueOf = (step: WaterfallStep) => (wfMode.value === 'cost' ? step.amount : step.qty)

  /** 柱顶标签取紧凑写法，8 根柱并排时完整金额放不下，精确值走 tooltip */
  const wfCompact = (value: number) => {
    const sign = value < 0 ? '-' : ''
    const abs = Math.abs(value)
    if (wfMode.value === 'qty') return `${sign}${formatInt(abs)}`
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`
    return `${sign}$${abs.toFixed(abs < 10 ? 2 : 0)}`
  }

  /** 0 值柱连同最小柱高一起隐藏，否则空白档位会冒出一小块色 */
  const wfBarItem = (value: number, color: string) => ({
    value,
    itemStyle: { color: value === 0 ? 'transparent' : color }
  })

  const buildWaterfallOption = (): EChartsOption => {
    const steps = detail.value?.waterfall || []
    const names = steps.map((step) => step.label)
    // base 为透明垫脚柱，delta 画增减，level 画期初 / 期末水位
    const base: number[] = []
    const delta: Array<ReturnType<typeof wfBarItem>> = []
    const level: Array<ReturnType<typeof wfBarItem>> = []
    let run = 0

    steps.forEach((step) => {
      const value = wfValueOf(step)
      if (isLevelStep(step.key)) {
        base.push(0)
        delta.push(wfBarItem(0, 'transparent'))
        level.push(wfBarItem(value, step.key === 'opening' ? WF_OPENING_COLOR : WF_CLOSING_COLOR))
        run = value
        return
      }
      level.push(wfBarItem(0, 'transparent'))
      if (value >= 0) {
        base.push(run)
        delta.push(wfBarItem(value, WF_UP_COLOR))
        run = Math.round((run + value) * 100) / 100
      } else {
        run = Math.round((run + value) * 100) / 100
        base.push(run)
        delta.push(wfBarItem(-value, WF_DOWN_COLOR))
      }
    })

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const step = steps[params?.[0]?.dataIndex ?? 0]
          if (!step) return ''
          return [
            `<b>${step.label}</b>`,
            `数量：${formatInt(step.qty)} 件`,
            `采购成本：${formatMoney(step.purchase)} ${percentOf(step, 'purchase')}`,
            `物流成本：${formatMoney(step.logistics)} ${percentOf(step, 'logistics')}`,
            `总成本：${formatMoney(step.amount)}`
          ].join('<br/>')
        }
      },
      grid: { left: 6, right: 12, top: 24, bottom: 4, containLabel: true },
      xAxis: {
        type: 'category',
        data: names,
        axisLabel: { color: '#8590a6', fontSize: 10, interval: 0, rotate: 30 },
        axisLine: { lineStyle: { color: '#e6e9f0' } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          color: '#8590a6',
          fontSize: 10,
          formatter: (value: number) =>
            Math.abs(value) >= 1000 ? `${(value / 1000).toFixed(1)}k` : String(value)
        },
        splitLine: { lineStyle: { color: '#eef1f6' } }
      },
      series: [
        {
          type: 'bar',
          stack: 'wf',
          silent: true,
          itemStyle: { color: 'transparent' },
          data: base,
          barMaxWidth: 26
        },
        {
          type: 'bar',
          stack: 'wf',
          barMaxWidth: 26,
          barMinHeight: WF_BAR_MIN_HEIGHT,
          itemStyle: { borderRadius: [2, 2, 0, 0] },
          data: delta,
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            color: '#1f2533',
            formatter: (p: any) => {
              const step = steps[p.dataIndex]
              if (!step || isLevelStep(step.key)) return ''
              const value = wfValueOf(step)
              return value ? wfCompact(value) : ''
            }
          }
        },
        {
          type: 'bar',
          stack: 'wf',
          barMaxWidth: 26,
          barMinHeight: WF_BAR_MIN_HEIGHT,
          itemStyle: { borderRadius: [2, 2, 0, 0] },
          data: level,
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            fontWeight: 600,
            color: '#1f2533',
            formatter: (p: any) => {
              const step = steps[p.dataIndex]
              if (!step || !isLevelStep(step.key)) return ''
              return wfCompact(wfValueOf(step))
            }
          }
        }
      ]
    }
  }

  const renderWaterfall = () => {
    if (!wfChartRef.value || !detail.value) return
    if (!wfChart) {
      wfChart = echarts.init(wfChartRef.value)
      // 抽屉展开动画期间容器宽度还在变，靠 observer 补一次尺寸，避免图挂成 0 宽
      wfResizeObserver = new ResizeObserver(() => wfChart?.resize())
      wfResizeObserver.observe(wfChartRef.value)
    }
    wfChart.setOption(buildWaterfallOption(), true)
    wfChart.resize()
  }

  const disposeWaterfall = () => {
    wfResizeObserver?.disconnect()
    wfResizeObserver = null
    wfChart?.dispose()
    wfChart = null
  }

  onBeforeUnmount(disposeWaterfall)

  // 抽屉 destroy-on-close，容器每次重建，只能等 DOM 就绪后再挂图
  watch([detail, wfMode], () => {
    if (!detail.value) {
      disposeWaterfall()
      return
    }
    nextTick(() => requestAnimationFrame(renderWaterfall))
  })

  const batchColumns: ColumnOption[] = [
    idCol('batchNo', { width: 180, slot: 'batchNo', label: '批次号' }),
    idCol('inboundDate', { width: 110, label: '入仓日期' }),
    metricCol('balanceQty', 'qty', { label: '结存数量' }),
    metricCol('purchasePrice', 'cost', { label: '采购单价' }),
    metricCol('logisticsPrice', 'cost', { label: '物流单价' }),
    metricCol('balanceTotalAmount', 'cost', { label: '结存金额' }),
    {
      prop: 'operation',
      label: '操作',
      width: 100,
      fixed: 'right',
      align: 'left',
      useSlot: true,
      slotName: 'operation'
    }
  ]

  /* ---------------- 趋势指标 ---------------- */

  interface TrendItem {
    key: string
    label: string
    format: 'number' | 'money'
  }

  const BIZ_TREND: Array<{ prefix: string; label: string }> = [
    { prefix: 'receipt', label: '货件入库' },
    { prefix: 'saleOut', label: '销售出库' },
    { prefix: 'saleReturn', label: '销售退货' },
    { prefix: 'removal', label: '移除出库' },
    { prefix: 'stocktake', label: '库存盘点' },
    { prefix: 'otherAdjust', label: '其他调整' }
  ]

  const TREND_GROUPS: Array<{ label: string; items: TrendItem[] }> = [
    {
      label: '数量',
      items: [
        { key: 'openingQty', label: '期初结存数量', format: 'number' },
        { key: 'closingQty', label: '期末结存数量', format: 'number' },
        ...BIZ_TREND.map(
          (b): TrendItem => ({ key: `${b.prefix}Qty`, label: `${b.label}数量`, format: 'number' })
        )
      ]
    },
    {
      label: '成本',
      items: [
        { key: 'openingAmount', label: '期初结存总成本', format: 'money' },
        { key: 'closingAmount', label: '期末结存总成本', format: 'money' },
        ...BIZ_TREND.map(
          (b): TrendItem => ({ key: `${b.prefix}Amount`, label: `${b.label}成本`, format: 'money' })
        )
      ]
    }
  ]

  const TREND_ITEM_MAP = new Map(
    TREND_GROUPS.flatMap((g) => g.items).map((item) => [item.key, item])
  )
  /** 超过 6 条线归一化图就没法看了 */
  const TREND_LIMIT = 6
  const TREND_COLORS = ['#5B8FF9', '#22C55E', '#FFAE1F', '#a855f7', '#ea580c', '#13DEB9']

  const trendKeys = ref<string[]>(['closingQty', 'closingAmount'])

  const trendDates = computed(() => (detail.value?.trend || []).map((t) => t.date))
  const trendMetrics = computed(() =>
    trendKeys.value.map((key, idx) => {
      const item = TREND_ITEM_MAP.get(key)
      return {
        key,
        label: item?.label || key,
        format: (item?.format || 'number') as 'number' | 'money',
        color: TREND_COLORS[idx % TREND_COLORS.length],
        data: (detail.value?.trend || []).map((t) => Number(t[key]) || 0)
      }
    })
  )

  const removeTrendMetric = (key: string) => {
    trendKeys.value = trendKeys.value.filter((k) => k !== key)
  }

  const load = async () => {
    if (!props.rowKey || !visible.value) return
    loading.value = true
    try {
      const res: any = await skuDayCost({ rowKey: props.rowKey })
      detail.value = res?.data || null
    } finally {
      loading.value = false
    }
  }

  const onClosed = () => {
    detail.value = null
  }

  watch([() => props.rowKey, visible], load, { immediate: true })
</script>

<style lang="scss" scoped>
  .drawer-title {
    display: flex;
    gap: 8px;
    align-items: center;

    .title-text {
      font-size: 15px;
      font-weight: 600;
      color: var(--art-text-gray-800);
    }

    .title-code {
      font-family: SFMono-Regular, Consolas, monospace;
      color: var(--art-text-gray-600);
    }
  }

  .drawer-body {
    min-height: 200px;

    .head-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 6px 12px;
      padding: 10px 12px;
      margin-bottom: 16px;
      background: var(--art-bg-color);
      border-radius: calc(var(--custom-radius) / 2 + 2px);

      .k {
        display: inline-block;
        width: 70px;
        color: var(--art-text-gray-500);
      }
    }

    .seg {
      margin-bottom: 18px;
    }

    .seg-title {
      display: flex;
      gap: 8px;
      align-items: baseline;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--art-text-gray-800);
    }

    .seg-note {
      font-weight: 400;
      color: var(--art-text-gray-500);
    }

    .wf-chart {
      height: 250px;
      padding: 8px 4px 0;
      background: linear-gradient(180deg, #fbfdff 0%, #f4f7ff 100%);
      border: 1px solid var(--art-border-color);
      border-radius: calc(var(--custom-radius) / 2 + 2px);
    }

    .wf-mode-seg {
      display: inline-flex;
      padding: 2px;
      margin-left: auto;
      background: #f4f6fb;
      border: 1px solid #dce3ef;
      border-radius: 7px;

      button {
        height: 22px;
        padding: 0 10px;
        font-size: 12px;
        font-weight: 400;
        color: #5f6877;
        cursor: pointer;
        background: transparent;
        border: 0;
        border-radius: 5px;

        &.active {
          font-weight: 500;
          color: var(--el-color-primary);
          background: #fff;
          box-shadow: 0 1px 3px rgb(15 23 42 / 8%);
        }
      }
    }

    .trend-picker {
      width: 230px;
      margin-left: auto;
      font-weight: 400;
    }

    .mono {
      font-family: SFMono-Regular, Consolas, monospace;
    }
  }
</style>
