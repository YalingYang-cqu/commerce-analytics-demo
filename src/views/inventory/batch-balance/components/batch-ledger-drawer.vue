<!-- 批次台账抽屉：概览 → 批次变动对平 → 消耗流水明细 → 溯源链 -->
<template>
  <ElDrawer
    v-model="visible"
    :size="900"
    :destroy-on-close="true"
    class="batch-ledger-drawer"
    @closed="onClosed"
  >
    <template #header>
      <div class="drawer-title">
        <span class="title-text">批次台账</span>
        <span class="title-code">{{ batch?.batchNo || '在途待生成' }}</span>
        <ElTag v-if="typeMeta" size="small" effect="light" :color="typeMeta.color" class="type-tag">
          {{ typeMeta.value }} {{ typeMeta.label }}
        </ElTag>
        <ElTag v-if="ledger && !ledger.reconcile.balanced" type="danger" size="small"
          >对平异常</ElTag
        >
      </div>
    </template>

    <div v-loading="loading" class="drawer-body">
      <template v-if="batch">
        <!-- 第一段：批次概览 -->
        <ElDescriptions :column="4" border size="small" class="seg">
          <ElDescriptionsItem label="本地SKU">
            {{ batch.localSku }}
            <div class="sub">{{ batch.skuName }}</div>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="仓库">
            {{ batch.warehouseName }}
            <div class="sub">{{ batch.warehouseCode }}</div>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="库存属性">
            {{ INV_ATTR_MAP[batch.invAttr]?.label || '-' }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="状态">
            <ElTag size="small" :type="STOCK_STATUS_MAP[batch.stockStatus]?.type">
              {{ STOCK_STATUS_MAP[batch.stockStatus]?.label }}
            </ElTag>
            <ElTag size="small" class="ml4" :type="CONSUME_STATUS_MAP[batch.consumeStatus]?.type">
              {{ CONSUME_STATUS_MAP[batch.consumeStatus]?.label }}
            </ElTag>
          </ElDescriptionsItem>
          <ElDescriptionsItem label="入仓日期">
            {{ batch.inboundDate || '-' }}
            <span v-if="batch.ageDays !== null" class="sub-inline"
              >库龄 {{ batch.ageDays }} 天</span
            >
          </ElDescriptionsItem>
          <ElDescriptionsItem label="采购单价 / 物流单价">
            {{ formatPrice(batch.purchasePrice) }} / {{ formatPrice(batch.logisticsPrice) }}
          </ElDescriptionsItem>
          <ElDescriptionsItem label="签收数量">{{
            formatInt(batch.receivedQty)
          }}</ElDescriptionsItem>
          <ElDescriptionsItem label="结存数量 / 结存总成本">
            <b>{{ formatInt(batch.balanceQty) }}</b> /
            <b>{{ formatMoney(batch.balanceTotalAmount) }}</b>
          </ElDescriptionsItem>
        </ElDescriptions>

        <!-- 第二段：经营变动瀑布 + 独立核算校验（对平公式②） -->
        <div class="seg">
          <div class="seg-title">
            <span>
              批次变动
              <em class="seg-note">期初 + 本期变动 = 成本流水推导结存</em>
            </span>
            <div class="wf-mode-seg">
              <button
                type="button"
                :class="{ active: waterfallMode === 'cost' }"
                @click="waterfallMode = 'cost'"
              >
                成本
              </button>
              <button
                type="button"
                :class="{ active: waterfallMode === 'qty' }"
                @click="waterfallMode = 'qty'"
              >
                数量
              </button>
            </div>
          </div>
          <div ref="waterfallChartRef" class="waterfall-chart"></div>

          <div class="reconcile-strip" :class="`is-${reconcileLevel}`">
            <div class="reconcile-result">
              <span class="reconcile-icon">{{ reconcileIcon }}</span>
              <div>
                <b>{{ reconcileTitle }}</b>
                <span>{{ reconcileMessage }}</span>
              </div>
            </div>
            <div class="reconcile-values">
              <div>
                <span>流水推导</span>
                <b>{{ reconcileValueText('derived') }}</b>
              </div>
              <div>
                <span>台账结存</span>
                <b>{{ reconcileValueText('actual') }}</b>
              </div>
              <div class="reconcile-diff">
                <span>差异</span>
                <b>{{ reconcileDiffText }}</b>
              </div>
            </div>
          </div>
        </div>

        <!-- 第三段：消耗流水明细（白底卡片） -->
        <div class="seg flow-card">
          <div class="seg-title">
            消耗流水明细
            <div class="seg-filter">
              <ElSelect
                v-model="bizType"
                size="small"
                style="width: 130px"
                placeholder="业务类型"
                @change="handleFlowSearch"
              >
                <ElOption label="全部业务类型" value="" />
                <ElOption
                  v-for="(label, value) in BIZ_TYPE_MAP"
                  :key="value"
                  :label="label"
                  :value="value"
                />
              </ElSelect>
              <ElDatePicker
                v-model="dateRange"
                type="daterange"
                size="small"
                value-format="YYYY-MM-DD"
                start-placeholder="开始"
                end-placeholder="结束"
                style="width: 220px"
                @change="handleFlowSearch"
              />
              <ElButton size="small" @click="onExport">导出</ElButton>
            </div>
          </div>
          <ArtTable
            :loading="flowLoading"
            :data="flowRows"
            row-key="costFlowNo"
            :autoHeight="true"
            :columns="flowColumns"
            :pagination="flowPagination"
            :show-table-header="false"
            size="small"
            table-key="inventory-batch-ledger-flow"
            :empty-text="flowEmptyText"
            @pagination:size-change="handleFlowSizeChange"
            @pagination:current-change="handleFlowCurrentChange"
          >
            <template #costFlowNo="{ row }">
              <span class="mono">{{ row.costFlowNo }}</span>
            </template>
            <template #bizType="{ row }">
              <span>{{ bizIoText(row.bizType, row.ioType) }}</span>
            </template>
            <template #isEstimated="{ row }">
              <ElTag v-if="row.isEstimated" type="warning" size="small" disable-transitions
                >暂估</ElTag
              >
              <span v-else class="muted">-</span>
            </template>
          </ArtTable>
          <!-- 累计对平只在末页有意义：前面页的末行累计还不是最终结存 -->
          <div
            v-if="flowRows.length && isFlowLastPage"
            class="flow-foot"
            :class="{ 'is-bad': !flowBalanced }"
          >
            <ElIcon>
              <component :is="flowBalanced ? CircleCheck : WarningFilled" />
            </ElIcon>
            末行累计结存 {{ formatInt(lastRunningQty) }} 件 / {{ formatMoney(lastRunningAmount) }}
            <template v-if="flowBalanced">= 批次结存表，单批次对平通过</template>
            <template v-else>
              ≠ 批次结存表 {{ formatInt(batch.balanceQty) }} 件 /
              {{ formatMoney(batch.balanceTotalAmount) }}，请核查
            </template>
          </div>
        </div>

        <!-- 第四段：溯源链 -->
        <div class="seg">
          <div class="seg-title">成本溯源</div>
          <div v-if="ledger?.trace.chain?.length" class="trace-chain">
            <template v-for="(node, idx) in ledger.trace.chain" :key="node">
              <ElLink type="primary" :underline="false">{{ node }}</ElLink>
              <span v-if="idx < ledger.trace.chain.length - 1" class="arrow">→</span>
            </template>
          </div>
          <div v-else class="trace-note">{{ ledger?.trace.note }}</div>
          <div v-if="batch.purchaseDetailId" class="trace-note">
            采购明细 {{ batch.purchaseDetailId }} · 物流明细 {{ batch.logisticsDetailId }}
          </div>
        </div>
      </template>
    </div>

    <template #footer>
      <div class="drawer-foot">
        <ElButton v-auth="'inventory:batchBalance:ledger'" type="warning" plain @click="onRecost">
          补录成本
        </ElButton>
        <div>
          <ElButton @click="visible = false">关闭</ElButton>
          <ElButton type="primary" @click="onExport">导出本批次台账</ElButton>
        </div>
      </div>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, nextTick, onBeforeUnmount, reactive, ref, watch } from 'vue'
  import {
    ElButton,
    ElDatePicker,
    ElDescriptions,
    ElDescriptionsItem,
    ElDrawer,
    ElIcon,
    ElLink,
    ElMessage,
    ElMessageBox,
    ElOption,
    ElSelect,
    ElTag
  } from 'element-plus'
  import { CircleCheck, WarningFilled } from '@element-plus/icons-vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import { echarts, type EChartsOption } from '@/utils/echarts'
  import {
    batchConsumeFlow,
    batchConsumeFlowExport,
    batchLedger
  } from '@/api/inventory/batch-balance'
  import {
    BATCH_TYPE_MAP,
    BIZ_TYPE_MAP,
    bizIoText,
    CONSUME_STATUS_MAP,
    INV_ATTR_MAP,
    STOCK_STATUS_MAP
  } from '../../utils/dict'
  import { formatInt, formatMoney, formatPrice } from '../../utils/format'
  import { idCol, metricCol } from '../columns/shared'
  import type { BatchConsumeRow, BatchLedger, BatchRow } from '../utils/types'

  defineOptions({ name: 'BatchLedgerDrawer' })

  const props = defineProps<{ batchId?: string }>()
  const visible = defineModel<boolean>('visible', { default: false })

  const loading = ref(false)
  const flowLoading = ref(false)
  const ledger = ref<BatchLedger | null>(null)
  const flowRows = ref<BatchConsumeRow[]>([])
  const bizType = ref('')
  const dateRange = ref<string[]>([])
  const flowPagination = reactive({
    currentPage: 1,
    pageSize: 20,
    total: 0
  })

  const batch = computed<BatchRow | null>(() => ledger.value?.batch ?? null)
  const typeMeta = computed(() =>
    batch.value ? BATCH_TYPE_MAP.get(batch.value.batchType) : undefined
  )
  const diffQty = computed(
    () => (ledger.value?.reconcile.derived.qty || 0) - (ledger.value?.reconcile.actual.qty || 0)
  )
  const diffAmount = computed(() => {
    const d = ledger.value?.reconcile.derived
    const a = ledger.value?.reconcile.actual
    if (!d || !a) return 0
    return (
      Math.round(
        (d.purchaseAmount + d.logisticsAmount - a.purchaseAmount - a.logisticsAmount) * 100
      ) / 100
    )
  })

  /* ---------------- 批次变动瀑布 / 独立对平校验 ---------------- */

  const waterfallMode = ref<'cost' | 'qty'>('cost')
  const waterfallChartRef = ref<HTMLElement | null>(null)
  let waterfallChart: echarts.ECharts | null = null
  let waterfallResizeObserver: ResizeObserver | null = null

  const totalAmountOf = (value: { purchaseAmount: number; logisticsAmount: number }) =>
    Math.round((value.purchaseAmount + value.logisticsAmount) * 100) / 100

  const waterfallValueOf = (step: {
    qty: number
    purchaseAmount: number
    logisticsAmount: number
  }) => (waterfallMode.value === 'qty' ? step.qty : totalAmountOf(step))

  const compactWaterfallValue = (value: number) => {
    const sign = value < 0 ? '-' : ''
    const abs = Math.abs(value)
    if (waterfallMode.value === 'qty') return `${sign}${formatInt(abs)}`
    if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(1)}k`
    return `${sign}$${abs.toFixed(abs < 10 ? 2 : 0)}`
  }

  const waterfallBarItem = (value: number, color: string) => ({
    value,
    itemStyle: { color: value === 0 ? 'transparent' : color }
  })

  const buildWaterfallOption = (): EChartsOption => {
    const steps = ledger.value?.reconcile.steps || []
    const derived = ledger.value?.reconcile.derived
    if (!derived) return {}

    const categories = [...steps.map((step) => step.label), '推导结存']
    const base: number[] = []
    const delta: Array<ReturnType<typeof waterfallBarItem>> = []
    const level: Array<ReturnType<typeof waterfallBarItem>> = []
    let running = 0

    steps.forEach((step, index) => {
      const value = waterfallValueOf(step)
      if (index === 0) {
        base.push(0)
        delta.push(waterfallBarItem(0, 'transparent'))
        level.push(waterfallBarItem(value, '#4f46e5'))
        running = value
      } else {
        level.push(waterfallBarItem(0, 'transparent'))
        if (value >= 0) {
          base.push(running)
          delta.push(waterfallBarItem(value, '#22c55e'))
          running = Math.round((running + value) * 100) / 100
        } else {
          running = Math.round((running + value) * 100) / 100
          base.push(running)
          delta.push(waterfallBarItem(-value, '#ef4444'))
        }
      }
    })

    const derivedValue = waterfallValueOf(derived)
    base.push(0)
    delta.push(waterfallBarItem(0, 'transparent'))
    level.push(waterfallBarItem(derivedValue, '#16a34a'))

    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const index = params?.[0]?.dataIndex ?? 0
          if (index === steps.length) {
            return [
              '<b>成本流水推导结存</b>',
              `数量：${formatInt(derived.qty)} 件`,
              `采购成本：${formatMoney(derived.purchaseAmount)}`,
              `物流成本：${formatMoney(derived.logisticsAmount)}`,
              `总成本：${formatMoney(totalAmountOf(derived))}`
            ].join('<br/>')
          }
          const step = steps[index]
          if (!step) return ''
          return [
            `<b>${step.label}</b>`,
            `数量：${formatInt(step.qty)} 件`,
            `采购成本：${formatMoney(step.purchaseAmount)}`,
            `物流成本：${formatMoney(step.logisticsAmount)}`,
            `总成本：${formatMoney(totalAmountOf(step))}`
          ].join('<br/>')
        }
      },
      grid: { left: 8, right: 12, top: 24, bottom: 4, containLabel: true },
      xAxis: {
        type: 'category',
        data: categories,
        axisLabel: { color: '#8590a6', fontSize: 10, interval: 0, rotate: 28 },
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
          stack: 'batch-waterfall',
          silent: true,
          itemStyle: { color: 'transparent' },
          data: base,
          barMaxWidth: 28
        },
        {
          type: 'bar',
          stack: 'batch-waterfall',
          barMinHeight: 1,
          barMaxWidth: 28,
          itemStyle: { borderRadius: [2, 2, 0, 0] },
          data: delta,
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            color: '#1f2533',
            formatter: (params: any) => {
              const step = steps[params.dataIndex]
              if (!step || params.dataIndex === 0) return ''
              const value = waterfallValueOf(step)
              return value ? compactWaterfallValue(value) : ''
            }
          }
        },
        {
          type: 'bar',
          stack: 'batch-waterfall',
          barMinHeight: 1,
          barMaxWidth: 28,
          itemStyle: { borderRadius: [2, 2, 0, 0] },
          data: level,
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            fontWeight: 600,
            color: '#1f2533',
            formatter: (params: any) => {
              if (params.dataIndex !== 0 && params.dataIndex !== steps.length) return ''
              const value =
                params.dataIndex === steps.length
                  ? derivedValue
                  : waterfallValueOf(steps[params.dataIndex])
              return compactWaterfallValue(value)
            }
          }
        }
      ]
    }
  }

  const renderWaterfall = () => {
    if (!waterfallChartRef.value || !ledger.value) return
    if (!waterfallChart) {
      waterfallChart = echarts.init(waterfallChartRef.value)
      waterfallResizeObserver = new ResizeObserver(() => waterfallChart?.resize())
      waterfallResizeObserver.observe(waterfallChartRef.value)
    }
    waterfallChart.setOption(buildWaterfallOption(), true)
    waterfallChart.resize()
  }

  const disposeWaterfall = () => {
    waterfallResizeObserver?.disconnect()
    waterfallResizeObserver = null
    waterfallChart?.dispose()
    waterfallChart = null
  }

  const purchaseDiff = computed(
    () =>
      (ledger.value?.reconcile.derived.purchaseAmount || 0) -
      (ledger.value?.reconcile.actual.purchaseAmount || 0)
  )
  const logisticsDiff = computed(
    () =>
      (ledger.value?.reconcile.derived.logisticsAmount || 0) -
      (ledger.value?.reconcile.actual.logisticsAmount || 0)
  )
  /** 数量相等且采购、物流分段差异都不超过 1 分，归为舍入尾差，不升级成核算异常 */
  const reconcileLevel = computed<'ok' | 'tail' | 'error'>(() => {
    if (ledger.value?.reconcile.balanced) return 'ok'
    if (
      diffQty.value === 0 &&
      Math.abs(purchaseDiff.value) <= 0.01 &&
      Math.abs(logisticsDiff.value) <= 0.01
    )
      return 'tail'
    return 'error'
  })
  const reconcileIcon = computed(() =>
    reconcileLevel.value === 'ok' ? '✓' : reconcileLevel.value === 'tail' ? '≈' : '!'
  )
  const reconcileTitle = computed(() =>
    reconcileLevel.value === 'ok'
      ? '批次对平通过'
      : reconcileLevel.value === 'tail'
        ? '存在舍入尾差'
        : '批次对平异常'
  )
  const reconcileMessage = computed(() =>
    reconcileLevel.value === 'ok'
      ? '成本流水推导结果与批次结存一致'
      : reconcileLevel.value === 'tail'
        ? '数量已对平，金额差异在 0.01 容差内'
        : '请核查未分摊金额、暂估冲销或重算任务状态'
  )
  const reconcileValueText = (kind: 'derived' | 'actual') => {
    const value = ledger.value?.reconcile[kind]
    if (!value) return '-'
    return waterfallMode.value === 'qty'
      ? `${formatInt(value.qty)} 件`
      : formatMoney(totalAmountOf(value))
  }
  const reconcileDiffText = computed(() =>
    waterfallMode.value === 'qty' ? `${formatInt(diffQty.value)} 件` : formatMoney(diffAmount.value)
  )

  watch([ledger, waterfallMode], () => {
    if (!ledger.value) {
      disposeWaterfall()
      return
    }
    nextTick(() => requestAnimationFrame(renderWaterfall))
  })
  onBeforeUnmount(disposeWaterfall)

  const flowColumns = [
    idCol('costFlowNo', { width: 180, slot: 'costFlowNo', label: '成本流水编号' }),
    idCol('invDate', { width: 110, label: '库存日期' }),
    idCol('docTime', { width: 160, label: '单据时间' }),
    idCol('bizType', { width: 190, slot: 'bizType', label: '业务类型' }),
    idCol('bizNo', { width: 190, label: '业务编号' }),
    idCol('invFlowNo', { width: 180, label: '来源库存流水编号' }),
    idCol('msku', { width: 160, label: 'MSKU' }),
    metricCol('changeQty', 'qty', { label: '变动数量' }),
    metricCol('changePurchasePrice', 'cost', { label: '采购单价' }),
    metricCol('changeLogisticsPrice', 'cost', { label: '物流单价' }),
    metricCol('changePurchaseAmount', 'cost', { label: '变动采购成本' }),
    metricCol('changeLogisticsAmount', 'cost', { label: '变动物流成本' }),
    metricCol('batchRunningQty', 'qty', { label: '批次累计结存数量' }),
    metricCol('batchRunningAmount', 'cost', { label: '批次累计结存金额' }),
    idCol('pricingMethod', { width: 110, label: '计价方式' }),
    idCol('costSource', { width: 140, label: '成本取值口径' }),
    idCol('isEstimated', { width: 90, slot: 'isEstimated', label: '是否暂估' })
  ]

  /** 累计结存优先用接口已推完的值；缺字段时再退回本页自算（仅首页正确） */
  const withRunning = (list: BatchConsumeRow[]): BatchConsumeRow[] => {
    if (!batch.value) return list
    if (list.some((row) => row.batchRunningQty != null && row.batchRunningAmount != null)) {
      return list
    }
    let qty = batch.value.receivedQty
    const unitTotal =
      Math.round((batch.value.purchasePrice + batch.value.logisticsPrice) * 1e6) / 1e6
    let amount = Math.round(batch.value.receivedQty * unitTotal * 100) / 100
    return list.map((row) => {
      qty += row.changeQty
      amount =
        Math.round((amount + row.changePurchaseAmount + row.changeLogisticsAmount) * 100) / 100
      return { ...row, batchRunningQty: qty, batchRunningAmount: amount }
    })
  }

  const flowEmptyText = computed(() =>
    batch.value?.stockStatus === 'IN_TRANSIT' ? '批次尚未签收，暂无消耗流水' : '该批次暂无消耗流水'
  )
  const isFlowLastPage = computed(() => {
    if (!flowPagination.total) return false
    return flowPagination.currentPage * flowPagination.pageSize >= flowPagination.total
  })
  const lastRunningQty = computed(
    () => flowRows.value.at(-1)?.batchRunningQty ?? batch.value?.balanceQty ?? 0
  )
  const lastRunningAmount = computed(
    () => flowRows.value.at(-1)?.batchRunningAmount ?? batch.value?.balanceTotalAmount ?? 0
  )
  const flowBalanced = computed(
    () =>
      !!batch.value &&
      lastRunningQty.value === batch.value.balanceQty &&
      Math.abs(lastRunningAmount.value - batch.value.balanceTotalAmount) < 0.01
  )

  const loadFlow = async () => {
    if (!props.batchId || !batch.value) return
    flowLoading.value = true
    try {
      const res: any = await batchConsumeFlow({
        batchId: props.batchId,
        bizType: bizType.value,
        invDateRange: dateRange.value,
        currentPage: flowPagination.currentPage,
        pageSize: flowPagination.pageSize
      })
      const payload = res?.data
      flowRows.value = withRunning(payload?.records || [])
      flowPagination.total = payload?.total || 0
      if (payload?.current) flowPagination.currentPage = payload.current
      if (payload?.size) flowPagination.pageSize = payload.size
    } finally {
      flowLoading.value = false
    }
  }

  const handleFlowSearch = () => {
    flowPagination.currentPage = 1
    loadFlow()
  }
  const handleFlowSizeChange = (size: number) => {
    flowPagination.pageSize = size
    flowPagination.currentPage = 1
    loadFlow()
  }
  const handleFlowCurrentChange = (page: number) => {
    flowPagination.currentPage = page
    loadFlow()
  }

  const load = async () => {
    if (!props.batchId || !visible.value) return
    loading.value = true
    try {
      const res: any = await batchLedger({ batchId: props.batchId })
      const data = res?.data
      // 主表的派生列在抽屉里同样需要，这里补齐一次
      ledger.value = data
        ? {
            ...data,
            batch: {
              ...data.batch,
              balanceTotalAmount:
                Math.round(
                  (data.batch.balancePurchaseAmount + data.batch.balanceLogisticsAmount) * 100
                ) / 100,
              ageDays: data.batch.inboundDate
                ? Math.round((Date.now() - new Date(data.batch.inboundDate).getTime()) / 86400000)
                : null
            }
          }
        : null
    } finally {
      loading.value = false
    }
    if (!ledger.value) {
      flowRows.value = []
      flowPagination.total = 0
      flowPagination.currentPage = 1
      return
    }
    flowPagination.currentPage = 1
    await loadFlow()
  }

  const onExport = async () => {
    const res: any = await batchConsumeFlowExport({ batchId: props.batchId })
    ElMessage.success(`导出任务已提交（任务号 ${res?.data ?? '-'}），请到下载中心获取结果`)
  }

  const onRecost = async () => {
    await ElMessageBox.confirm(
      '补录成本将触发从入仓日起的下游全部重算，期间该批次相关流水会短暂不可用。确认继续？',
      '补录成本',
      { type: 'warning' }
    )
    ElMessage.success('已提交重算任务')
  }

  const onClosed = () => {
    disposeWaterfall()
    ledger.value = null
    flowRows.value = []
    bizType.value = ''
    dateRange.value = []
    flowPagination.currentPage = 1
    flowPagination.pageSize = 20
    flowPagination.total = 0
  }

  watch([() => props.batchId, visible], load, { immediate: true })
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

    .type-tag {
      color: #fff;
      border: none;
    }
  }

  .drawer-body {
    min-height: 200px;

    .seg {
      margin-bottom: 18px;
    }

    .flow-card {
      padding: 12px 14px 10px;
      background: #fff;
      border: 1px solid var(--art-border-color);
      border-radius: calc(var(--custom-radius) / 2 + 2px);
      box-shadow: 0 1px 2px rgb(15 23 42 / 4%);
    }

    .seg-title {
      display: flex;
      gap: 10px;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 8px;
      font-size: 13px;
      font-weight: 600;
      color: var(--art-text-gray-800);
    }

    .seg-filter {
      display: flex;
      gap: 8px;
      align-items: center;
    }

    .sub {
      color: var(--art-text-gray-500);
      transform: scale(0.92);
      transform-origin: left center;
    }

    .sub-inline {
      margin-left: 6px;
      color: var(--art-text-gray-500);
    }

    .ml4 {
      margin-left: 4px;
    }

    .seg-note {
      margin-left: 8px;
      font-size: 12px;
      font-style: normal;
      font-weight: 400;
      color: var(--art-text-gray-500);
    }

    .waterfall-chart {
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

    .reconcile-strip {
      display: flex;
      gap: 16px;
      align-items: center;
      justify-content: space-between;
      padding: 10px 12px;
      margin-top: 8px;
      border: 1px solid;
      border-radius: 7px;

      &.is-ok {
        color: #166534;
        background: #f0fdf4;
        border-color: #bbf7d0;
      }

      &.is-tail {
        color: #92400e;
        background: #fffbeb;
        border-color: #fde68a;
      }

      &.is-error {
        color: #b91c1c;
        background: #fff7f7;
        border-color: #fecaca;
      }
    }

    .reconcile-result {
      display: flex;
      gap: 9px;
      align-items: center;
      min-width: 240px;

      > div {
        display: flex;
        flex-direction: column;
      }

      b {
        font-size: 13px;
      }

      span:not(.reconcile-icon) {
        margin-top: 2px;
        font-size: 11px;
        color: var(--art-text-gray-600);
      }
    }

    .reconcile-icon {
      display: inline-flex;
      flex: 0 0 24px;
      align-items: center;
      justify-content: center;
      height: 24px;
      font-size: 14px;
      font-weight: 700;
      border: 1px solid currentcolor;
      border-radius: 50%;
    }

    .reconcile-values {
      display: grid;
      grid-template-columns: repeat(3, minmax(100px, auto));
      gap: 18px;
      font-variant-numeric: tabular-nums;

      div {
        display: flex;
        flex-direction: column;
        text-align: right;
      }

      span {
        font-size: 10px;
        color: var(--art-text-gray-500);
      }

      b {
        margin-top: 2px;
        font-size: 12px;
        color: var(--art-text-gray-800);
      }

      .reconcile-diff b {
        color: currentcolor;
      }
    }

    .trace-chain {
      display: flex;
      gap: 8px;
      align-items: center;

      .arrow {
        color: var(--art-text-gray-400);
      }
    }

    .trace-note {
      color: var(--art-text-gray-600);
    }

    .flow-foot {
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 8px 2px 0;
      font-size: 12px;
      color: var(--el-color-success);

      &.is-bad {
        color: var(--el-color-danger);
      }
    }

    .mono {
      font-family: SFMono-Regular, Consolas, monospace;
    }

    .muted {
      color: var(--art-text-gray-400);
    }
  }

  .drawer-foot {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }
</style>
