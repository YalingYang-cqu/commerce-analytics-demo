<!-- 按本地SKU+仓库汇总 · 展开行：组内批次明细 -->
<template>
  <div class="batch-group-expand" v-loading="loading">
    <div class="panel-header">
      <div class="panel-header__main">
        <ElTag type="primary" disable-transitions>组内批次</ElTag>
        <span class="mono">{{ groupRow.localSku }}</span>
        <span class="muted">{{ groupRow.skuName }}</span>
        <span class="sep">·</span>
        <span>{{ groupRow.warehouseName }}</span>
        <span class="muted">({{ groupRow.warehouseCode }})</span>
        <span class="count">共 {{ formatInt(groupRow.batchCnt) }} 个批次</span>
      </div>
      <ElButton type="primary" link @click.stop="emit('collapse')">收起</ElButton>
    </div>

    <ArtTable
      :loading="loading"
      :data="rows"
      row-key="batchId"
      :autoHeight="true"
      :columns="columns"
      :pagination="undefined"
      :show-table-header="false"
      size="small"
      tableKey="inventory-batch-group-expand"
    >
      <template #batchNo="{ row }">
        <span v-if="row.batchNo" class="mono">{{ row.batchNo }}</span>
        <span v-else class="muted">在途待生成</span>
      </template>
      <template #batchType="{ row }">
        <ElTooltip :content="BATCH_TYPE_MAP.get(row.batchType)?.tip" placement="top">
          <ElTag
            size="small"
            effect="light"
            disable-transitions
            :color="BATCH_TYPE_MAP.get(row.batchType)?.color"
            class="type-tag"
          >
            {{ row.batchType }} {{ BATCH_TYPE_MAP.get(row.batchType)?.label }}
          </ElTag>
        </ElTooltip>
      </template>
      <template #localSku="{ row }">
        <div class="two-line">
          <span>{{ row.localSku }}</span>
          <span class="sub">{{ row.skuName }}</span>
        </div>
      </template>
      <template #invAttr="{ row }">
        <ElTag size="small" :type="INV_ATTR_MAP[row.invAttr]?.type" disable-transitions>
          {{ INV_ATTR_MAP[row.invAttr]?.label || '-' }}
        </ElTag>
      </template>
      <template #platform="{ row }">{{ platformLabel(row.platform) }}</template>
      <template #warehouse="{ row }">
        <div class="two-line">
          <span>{{ row.warehouseName }}</span>
          <span class="sub">{{ row.warehouseCode }}</span>
        </div>
      </template>
      <template #stockStatus="{ row }">
        <ElTag size="small" :type="STOCK_STATUS_MAP[row.stockStatus]?.type" disable-transitions>
          {{ STOCK_STATUS_MAP[row.stockStatus]?.label }}
        </ElTag>
      </template>
      <template #consumeStatus="{ row }">
        <ElTag size="small" :type="CONSUME_STATUS_MAP[row.consumeStatus]?.type" disable-transitions>
          {{ CONSUME_STATUS_MAP[row.consumeStatus]?.label }}
        </ElTag>
      </template>
      <template #ageDays="{ row }">
        <span :class="{ 'warn-text': (row.ageDays ?? 0) > AGE_WARN_DAYS }">
          {{ row.ageDays === null ? '-' : formatInt(row.ageDays) }}
        </span>
      </template>
      <template #transitDays="{ row }">
        <span :class="{ 'danger-text': (row.transitDays ?? 0) > TRANSIT_WARN_DAYS }">
          {{ row.transitDays === null ? '-' : formatInt(row.transitDays) }}
        </span>
      </template>
      <template #costDrill="{ row, prop }">
        <button
          v-if="canCostDrill(row, prop)"
          type="button"
          class="drill-cell"
          :class="{
            bold: prop === 'balanceTotalAmount',
            'danger-text': prop === 'balanceTotalAmount' && row.exceptionFlag
          }"
          @click="onCostDrillClick(row, prop, $event)"
        >
          <span class="drill-value">
            <ElTooltip
              v-if="prop === 'balanceTotalAmount' && row.exceptionFlag"
              content="结存数量为 0 时金额必须为 0，请检查未分摊金额或舍入尾差"
              placement="top"
            >
              <ElIcon><WarningFilled /></ElIcon>
            </ElTooltip>
            {{ formatCostDrillValue(prop, row[prop]) }}
          </span>
          <ElIcon class="chev"><ArrowDown /></ElIcon>
        </button>
        <span
          v-else
          class="drill-cell is-static"
          :class="{
            bold: prop === 'balanceTotalAmount',
            'danger-text': prop === 'balanceTotalAmount' && row.exceptionFlag
          }"
        >
          <span class="drill-value" :class="{ muted: row[prop] == null || row[prop] === '' }">
            <ElTooltip
              v-if="prop === 'balanceTotalAmount' && row.exceptionFlag"
              content="结存数量为 0 时金额必须为 0，请检查未分摊金额或舍入尾差"
              placement="top"
            >
              <ElIcon><WarningFilled /></ElIcon>
            </ElTooltip>
            {{
              row[prop] == null || row[prop] === '' ? '-' : formatCostDrillValue(prop, row[prop])
            }}
          </span>
          <span class="chev-slot" aria-hidden="true"></span>
        </span>
      </template>
      <template #dash="{ row, prop }">
        <span :class="{ muted: !row[prop] }">{{ row[prop] || '-' }}</span>
      </template>
      <template #trace="{ row, prop }">
        <ElTooltip
          v-if="!BATCH_TYPE_MAP.get(row.batchType)?.traceable"
          content="该批次类型的单价为加权或兜底取价，批次表不保存成本溯源"
          placement="top"
        >
          <span class="muted">-</span>
        </ElTooltip>
        <span v-else class="mono">{{ row[prop] || '-' }}</span>
      </template>
      <template #operation="{ row }">
        <ElButton type="primary" link size="small" @click.stop="emit('open-ledger', row)">
          批次台账
        </ElButton>
      </template>
    </ArtTable>

    <Teleport to="body">
      <div
        v-if="costDrillOpen"
        ref="costDrillPopperRef"
        class="batch-cost-drill-pop"
        :style="costDrillPopperStyle"
      >
        <div class="batch-cost-drill-pop__title">{{ costDrillTitle }}</div>
        <div
          v-for="(item, idx) in costDrillItems"
          :key="idx"
          class="batch-cost-drill-pop__row"
          :class="{ 'is-total': item.total }"
        >
          <span class="k">{{ item.label }}</span>
          <span v-if="item.percent !== undefined" class="p">{{ item.percent }}%</span>
          <span class="v" :class="{ 'minus-text': item.value < 0 }">
            {{ formatCostDrillValue(costDrillProp, item.value) }}
          </span>
        </div>
      </div>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch, type CSSProperties } from 'vue'
  import { ElButton, ElIcon, ElTag, ElTooltip } from 'element-plus'
  import { ArrowDown, WarningFilled } from '@element-plus/icons-vue'
  import { onClickOutside } from '@vueuse/core'
  import dayjs from 'dayjs'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import { batchBalanceList } from '@/api/inventory/batch-balance'
  import {
    AGE_WARN_DAYS,
    BATCH_TYPE_MAP,
    CONSUME_STATUS_MAP,
    INV_ATTR_MAP,
    PLATFORM_OPTIONS,
    STOCK_STATUS_MAP,
    TRANSIT_WARN_DAYS
  } from '../../utils/dict'
  import { formatInt, formatMoney, formatPrice } from '../../utils/format'
  import { buildBatchColumns } from '../columns'
  import {
    canCostDrill,
    costDrillFmtOf,
    costDrillLabelOf,
    getCostDrillRows,
    type CostDrillRow
  } from '../columns/cost-drill'
  import type { BatchRow, BatchTab, SkuWarehouseSummaryRow } from '../utils/types'

  defineOptions({ name: 'BatchGroupExpand' })

  const props = defineProps<{
    groupRow: SkuWarehouseSummaryRow
    tab: BatchTab
    query: Record<string, any>
  }>()

  const emit = defineEmits<{
    (e: 'collapse'): void
    (e: 'open-ledger', row: BatchRow): void
  }>()

  const loading = ref(false)
  const rows = ref<BatchRow[]>([])

  /** 与「批次明细」主表共用同一个列工厂，字段、顺序及各生命周期 Tab 的增删规则完全一致。 */
  const columns = computed(() =>
    buildBatchColumns(props.tab).filter((column) => column.checked !== false)
  )

  const platformLabel = (value: string) =>
    PLATFORM_OPTIONS.find((item) => item.value === value)?.label || value || '-'

  const mapRow = (row: any): BatchRow => {
    const consumedQty = -(row.receivedQty - row.balanceQty)
    const unitTotalCost = Math.round((row.purchasePrice + row.logisticsPrice) * 1e6) / 1e6
    return {
      ...row,
      consumedQty,
      unitTotalCost,
      balanceTotalAmount:
        Math.round((row.balancePurchaseAmount + row.balanceLogisticsAmount) * 100) / 100,
      consumedAmount: Math.round(consumedQty * unitTotalCost * 100) / 100,
      ageDays: row.inboundDate
        ? dayjs(row.snapshotDate || dayjs().format('YYYY-MM-DD')).diff(
            dayjs(row.inboundDate),
            'day'
          )
        : null,
      transitDays:
        row.stockStatus === 'IN_TRANSIT'
          ? dayjs(row.snapshotDate || dayjs().format('YYYY-MM-DD')).diff(dayjs(row.shipTime), 'day')
          : null
    }
  }

  const load = async () => {
    loading.value = true
    try {
      const res: any = await batchBalanceList({
        ...props.query,
        tab: props.tab,
        localSku: props.groupRow.localSku,
        warehouseCode: props.groupRow.warehouseCode,
        currentPage: 1,
        pageSize: 200,
        sortProp: props.tab === 'inTransit' ? 'shipTime' : 'inboundDate',
        sortOrder: 'ascending'
      })
      rows.value = (res?.data?.records || []).map(mapRow)
    } finally {
      loading.value = false
    }
  }

  watch(
    () => [props.groupRow.rowKey, props.tab, props.query],
    () => {
      closeCostDrill()
      load()
    },
    { deep: true }
  )

  /* ---------------- 成本三级下钻 ---------------- */

  const COST_DRILL_POP_WIDTH = 236
  const costDrillOpen = ref(false)
  const costDrillProp = ref('')
  const costDrillItems = ref<CostDrillRow[]>([])
  const costDrillAnchorEl = ref<HTMLElement | null>(null)
  const costDrillPopperRef = ref<HTMLElement | null>(null)
  const costDrillPopperStyle = ref<CSSProperties>({})

  const costDrillTitle = computed(() => {
    const prop = costDrillProp.value
    if (!prop) return ''
    const fmt = costDrillFmtOf(prop)
    const measure = fmt === 'price' ? '单位成本' : '总成本'
    return `${costDrillLabelOf(prop)} · ${measure}`
  })

  const formatCostDrillValue = (prop: string, value: number) => {
    const fmt = costDrillFmtOf(prop)
    if (fmt === 'price') return formatPrice(value)
    return formatMoney(value)
  }

  const closeCostDrill = () => {
    costDrillOpen.value = false
    costDrillAnchorEl.value = null
  }

  const openCostDrill = (row: Record<string, any>, prop: string, anchor: HTMLElement) => {
    if (costDrillOpen.value && costDrillAnchorEl.value === anchor) {
      closeCostDrill()
      return
    }
    const rect = anchor.getBoundingClientRect()
    costDrillProp.value = prop
    costDrillItems.value = getCostDrillRows(row, prop)
    costDrillAnchorEl.value = anchor
    costDrillPopperStyle.value = {
      top: `${rect.bottom + 6}px`,
      left: `${Math.max(8, Math.min(rect.right - COST_DRILL_POP_WIDTH, window.innerWidth - COST_DRILL_POP_WIDTH - 8))}px`,
      width: `${COST_DRILL_POP_WIDTH}px`
    }
    costDrillOpen.value = true
  }

  const onCostDrillClick = (row: Record<string, any>, prop: string, e: MouseEvent) => {
    e.stopPropagation()
    const el = e.currentTarget as HTMLElement | null
    if (el) openCostDrill(row, prop, el)
  }

  onClickOutside(costDrillPopperRef, (e) => {
    if ((e.target as HTMLElement | null)?.closest?.('.drill-cell')) return
    closeCostDrill()
  })

  onMounted(load)
</script>

<style lang="scss" scoped>
  .batch-group-expand {
    padding: 12px 16px 16px;
    background: var(--art-bg-color);

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;
    }

    .panel-header__main {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      font-size: 12px;
      color: var(--art-text-gray-800);
    }

    .mono {
      font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
      font-weight: 600;
    }

    .muted {
      color: var(--art-text-gray-500);
    }

    .sep {
      color: var(--art-text-muted);
    }

    .count {
      color: var(--art-text-gray-600);
    }

    .type-tag {
      color: #1f2937;
      border: none;
    }

    .two-line {
      display: flex;
      flex-direction: column;
      line-height: 1.35;

      .sub {
        color: var(--art-text-gray-500);
      }
    }

    .warn-text {
      font-weight: 600;
      color: rgb(var(--art-warning));
    }

    .danger-text {
      color: rgb(var(--art-danger));
    }

    .bold {
      font-weight: 600;
    }

    .drill-cell {
      display: inline-grid;
      grid-template-columns: auto 10px;
      column-gap: 4px;
      place-items: center end;
      padding: 0;
      font: inherit;
      color: inherit;
      background: none;
      border: 0;

      &:not(.is-static) {
        cursor: pointer;
      }

      &:not(.is-static):hover .drill-value {
        color: var(--el-color-primary);
      }

      .chev {
        font-size: 10px;
        color: var(--art-text-gray-400);
      }

      .chev-slot {
        width: 10px;
      }
    }

    :deep(.el-table) {
      th.el-table__cell.is-emphasis-column .cell,
      td.el-table__cell.is-emphasis-column .cell {
        font-weight: 700;
        color: var(--art-text-gray-900);
      }
    }
  }

  .batch-cost-drill-pop {
    position: fixed;
    z-index: 3000;
    padding: 8px 10px;
    font-size: 12px;
    background: var(--art-main-bg-color);
    border: 1px solid var(--art-border-color);
    border-radius: var(--custom-radius);
    box-shadow: var(--art-box-shadow-xs);

    &__title {
      padding-bottom: 6px;
      margin-bottom: 4px;
      color: var(--art-text-gray-600);
      border-bottom: 1px solid var(--art-border-dashed-color);
    }

    &__row {
      display: grid;
      grid-template-columns: 1fr auto auto;
      column-gap: 8px;
      align-items: center;
      height: 24px;
      color: var(--art-text-gray-700);

      .p {
        color: var(--art-text-gray-400);
      }

      .v {
        font-variant-numeric: tabular-nums;
      }

      .minus-text {
        color: var(--el-color-danger);
      }

      &.is-total {
        padding-top: 4px;
        margin-top: 2px;
        font-weight: 600;
        color: var(--art-text-gray-800);
        border-top: 1px solid var(--art-border-dashed-color);
      }
    }
  }
</style>
