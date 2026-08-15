<template>
  <div class="batch-balance-page art-full-height" v-auth="'inventory:batchBalance:view'">
    <div class="batch-table-section">
      <!-- ① 筛选区：全屏时保留 -->
      <ArtSearchBar
        v-model="searchForm"
        :items="searchItems"
        :showSearch="false"
        @reset="handleReset"
        @search="handleSearch"
      >
        <template #keyword="{ modelValue }">
          <div class="keyword-item">
            <ElSelect v-model="modelValue.keywordType" size="small" style="width: 132px">
              <ElOption
                v-for="opt in KEYWORD_OPTIONS"
                :key="opt.value"
                :label="opt.label"
                :value="opt.value"
              />
            </ElSelect>
            <ElInput
              v-model="modelValue.keyword"
              size="small"
              placeholder="支持模糊搜索"
              clearable
              @keyup.enter="handleSearch"
              @clear="handleSearch"
            >
              <template #suffix>
                <ElIcon style="cursor: pointer" @click="handleSearch"><Search /></ElIcon>
              </template>
            </ElInput>
          </div>
        </template>
      </ArtSearchBar>

      <!-- ② 跑批与对平状态条 -->
      <ElAlert class="status-bar" :type="statusType" :closable="false" show-icon>
        <template #title>
          <div class="status-line">
            <span>
              数据截至 {{ status.dataDate }}（站点时间） ·
              {{ status.jobFinished ? '昨日跑批已完成' : '跑批进行中，数据可能变动' }} ·
              {{ status.reconciled ? '三层对平通过' : '三层对平未通过，当日不允许过账' }}
            </span>
            <ElLink
              v-if="status.exceptionCount"
              type="danger"
              :underline="false"
              @click="toggleException"
            >
              {{ onlyException ? '取消筛选异常批次' : `异常批次 ${status.exceptionCount} 个 →` }}
            </ElLink>
          </div>
        </template>
      </ElAlert>

      <!-- ③ 核心指标 -->
      <div class="metric-zone art-custom-card">
        <div class="metric-head">
          <span class="metric-title">批次结存总览</span>
          <div class="metric-actions">
            <span class="metric-tip">
              指标不随 Tab 收窄；库存日期取选中范围的最新日，未选时取最新快照
            </span>
            <CardSetting
              v-model="cardLayout"
              :groups="CARD_GROUPS"
              name="inventory-batch-balance-v5"
              title="配置指标"
              :max-total="8"
              :width="520"
              dense
            />
          </div>
        </div>
        <CardItems
          variant="sc-zone"
          :groups="CARD_GROUPS"
          :layout="cardLayout"
          :clickable-keys="CLICKABLE_CARDS"
          :filter-active-keys="overAgeFilterActive ? ['overAgeQty'] : []"
          @card-click="onCardClick"
        >
          <template #value="{ metric }">
            <span class="metric-value">{{ metricText(metric.key) }}</span>
          </template>
          <template #default="{ metric }">
            <div v-if="metric.key === 'balanceTotalAmount'" class="metric-detail-grid">
              <div class="metric-detail-item">
                <span><i class="metric-dot purchase"></i>采购</span>
                <b>{{ formatMoney(metrics.balancePurchaseAmount) }}</b>
                <em>{{ formatPercent(metrics.balancePurchaseRate) }}</em>
              </div>
              <div class="metric-detail-item">
                <span><i class="metric-dot logistics"></i>物流</span>
                <b>{{ formatMoney(metrics.balanceLogisticsAmount) }}</b>
                <em>{{ formatPercent(metrics.balanceLogisticsRate) }}</em>
              </div>
            </div>

            <div v-else-if="metric.key === 'balanceQty'" class="metric-detail-grid">
              <div class="metric-detail-item">
                <span><i class="metric-dot good"></i>良品</span>
                <b>{{ formatInt(metrics.goodQty) }} 件</b>
                <em>{{ formatPercent(metrics.goodRate) }}</em>
              </div>
              <div class="metric-detail-item">
                <span><i class="metric-dot defective"></i>次品</span>
                <b>{{ formatInt(metrics.defectiveQty) }} 件</b>
                <em>{{ formatPercent(metrics.defectiveRate) }}</em>
              </div>
            </div>

            <div v-else-if="metric.key === 'overAgeQty'" class="metric-detail-grid">
              <div class="metric-detail-item">
                <span><i class="metric-dot good"></i>良品</span>
                <b>{{ formatInt(metrics.overAgeGoodQty) }} 件</b>
                <em>{{ formatPercent(metrics.overAgeGoodRate) }}</em>
              </div>
              <div class="metric-detail-item">
                <span><i class="metric-dot defective"></i>次品</span>
                <b>{{ formatInt(metrics.overAgeDefectiveQty) }} 件</b>
                <em>{{ formatPercent(metrics.overAgeDefectiveRate) }}</em>
              </div>
            </div>

            <div v-else-if="metric.key === 'outboundConsumedQty'" class="metric-detail-grid">
              <div class="metric-detail-item">
                <span><i class="metric-dot good"></i>良品</span>
                <b>{{ formatInt(metrics.goodOutboundConsumedQty) }} 件</b>
                <em>{{ formatPercent(metrics.goodOutboundConsumedRate) }}</em>
              </div>
              <div class="metric-detail-item">
                <span><i class="metric-dot defective"></i>次品</span>
                <b>{{ formatInt(metrics.defectiveOutboundConsumedQty) }} 件</b>
                <em>{{ formatPercent(metrics.defectiveOutboundConsumedRate) }}</em>
              </div>
            </div>

            <div v-else-if="metric.key === 'inboundQty'" class="metric-detail-grid">
              <div class="metric-detail-item">
                <span><i class="metric-dot good"></i>良品</span>
                <b>{{ formatInt(metrics.goodInboundQty) }} 件</b>
                <em>{{ formatPercent(metrics.goodInboundRate) }}</em>
              </div>
              <div class="metric-detail-item">
                <span><i class="metric-dot defective"></i>次品</span>
                <b>{{ formatInt(metrics.defectiveInboundQty) }} 件</b>
                <em>{{ formatPercent(metrics.defectiveInboundRate) }}</em>
              </div>
            </div>

            <div v-else-if="metric.key === 'outboundConsumedAmount'" class="metric-detail-grid">
              <div class="metric-detail-item">
                <span><i class="metric-dot good"></i>良品</span>
                <b>{{ formatMoney(metrics.goodOutboundConsumedAmount) }}</b>
                <em>{{ formatPercent(metrics.goodOutboundConsumedAmountRate) }}</em>
              </div>
              <div class="metric-detail-item">
                <span><i class="metric-dot defective"></i>次品</span>
                <b>{{ formatMoney(metrics.defectiveOutboundConsumedAmount) }}</b>
                <em>{{ formatPercent(metrics.defectiveOutboundConsumedAmountRate) }}</em>
              </div>
            </div>

            <div v-else-if="metric.key === 'inboundAmount'" class="metric-detail-grid">
              <div class="metric-detail-item">
                <span><i class="metric-dot good"></i>良品</span>
                <b>{{ formatMoney(metrics.goodInboundAmount) }}</b>
                <em>{{ formatPercent(metrics.goodInboundAmountRate) }}</em>
              </div>
              <div class="metric-detail-item">
                <span><i class="metric-dot defective"></i>次品</span>
                <b>{{ formatMoney(metrics.defectiveInboundAmount) }}</b>
                <em>{{ formatPercent(metrics.defectiveInboundAmountRate) }}</em>
              </div>
            </div>

            <div v-else-if="metric.key === 'avgGoodAgeDays'" class="age-distribution">
              <div class="age-bar" aria-label="良品库龄结存数量占比">
                <span
                  v-for="segment in goodAgeSegments"
                  :key="segment.key"
                  :class="`age-${segment.key}`"
                  :style="{ width: `${segment.rate}%` }"
                  :title="`${segment.label}：${formatInt(segment.qty)} 件（${formatPercent(segment.rate)}）`"
                ></span>
              </div>
              <div class="age-legend">
                <div v-for="segment in goodAgeSegments" :key="segment.key">
                  <span><i :class="`metric-dot age-${segment.key}`"></i>{{ segment.label }}</span>
                  <b>
                    <strong>{{ formatCompactInt(segment.qty) }} 件</strong>
                    <em>{{ formatPercent(segment.rate) }}</em>
                  </b>
                </div>
              </div>
            </div>
          </template>
        </CardItems>
      </div>

      <!-- ④ 主表：维度 Tab + 工具条与表格同卡 -->
      <ElCard shadow="never" class="art-table-card">
        <ArtTableHeaderGroup
          v-model:columns="columnChecks"
          :key="`${view}-${activeTab}`"
          :loading="loading"
          layout="refresh,down,columnsNew,fullscreen"
          full-class="batch-table-section"
          :tableName="currentTableName"
          :groups="BATCH_COLUMN_GROUPS"
          :checkbox-columns="3"
          :updateColumn="updateColumn"
          :resetColumns="resetColumns"
          :exportApi="exportHandler"
          :exportParams="searchParams"
          :asyncExport="true"
          exportAuth="inventory:batchBalance:export"
          @refresh="handleRefresh"
        >
          <template #left>
            <ElSpace :size="12" alignment="center">
              <!-- 视图粒度：默认按本地SKU+仓库汇总；批次明细可切换回原始粒度 -->
              <span class="toolbar-label-group">
                <span class="toolbar-label">
                  <ElIcon class="toolbar-label-icon"><Grid /></ElIcon>
                  视图
                </span>
                <ElRadioGroup v-model="view" size="small" class="dim-seg">
                  <ElRadioButton value="summary">按本地SKU+仓库</ElRadioButton>
                  <ElRadioButton value="batch">批次明细</ElRadioButton>
                </ElRadioGroup>
              </span>
              <!-- 维度：在仓 / 在途 / 已耗尽 -->
              <ElRadioGroup v-model="activeTab" size="small" class="dim-seg">
                <ElRadioButton v-for="tab in TABS" :key="tab.name" :value="tab.name">
                  {{ tab.label }}
                </ElRadioButton>
              </ElRadioGroup>
              <ElSelect
                v-if="activeTab !== 'inTransit'"
                v-model="consumeStatus"
                size="small"
                style="width: 120px"
                placeholder="消耗状态"
                @change="handleSearch"
              >
                <ElOption label="全部消耗状态" value="" />
                <ElOption label="待消耗" value="PENDING" />
                <ElOption label="消耗中" value="CONSUMING" />
              </ElSelect>
              <ElSelect
                v-model="costStatus"
                size="small"
                style="width: 130px"
                placeholder="成本状态"
                @change="handleSearch"
              >
                <ElOption label="全部成本状态" value="" />
                <ElOption label="成本已确定" value="CONFIRMED" />
                <ElOption label="含暂估" value="ESTIMATED" />
                <ElOption label="待补录成本" value="MISSING" />
              </ElSelect>
              <span class="count-text">{{ countText }}</span>
            </ElSpace>
          </template>
        </ArtTableHeaderGroup>

        <!-- 包一层撑满剩余高度：表格容器的高度按百分比算，需要一个已定高的父级 -->
        <div class="table-body">
          <ArtTableGroup
            :loading="loading"
            :data="data"
            :row-key="view === 'summary' ? 'rowKey' : 'batchId'"
            :columns="columns"
            :column-checks="columnChecks"
            :groups="BATCH_COLUMN_GROUPS"
            :pagination="pagination"
            tableKey="inventory-batch-balance"
            :expand-row-keys="view === 'summary' ? expandedRowKeys : []"
            :row-class-name="rowClassName"
            :show-summary="true"
            summary-position="top"
            :summary-method="summaryMethod"
            @expand-change="handleExpandChange"
            @pagination:size-change="handleSizeChange"
            @pagination:current-change="handleCurrentChange"
            @sort-change="handleSortChange"
          >
            <template #expand="{ row }">
              <BatchGroupExpand
                v-if="view === 'summary' && expandedRowKeys.includes(row.rowKey)"
                :group-row="row"
                :tab="activeTab"
                :query="expandQuery"
                @collapse="collapseExpand(row)"
                @open-ledger="openLedger"
              />
            </template>
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

            <template #platform="{ row }">
              {{ row.platform ? platformLabel(row.platform) : view === 'summary' ? '多平台' : '-' }}
            </template>

            <template #warehouse="{ row }">
              <div class="two-line">
                <span>{{ row.warehouseName }}</span>
                <span class="sub">{{ row.warehouseCode }}</span>
              </div>
            </template>

            <template #overAgeQty="{ row }">
              <span :class="{ 'warn-text': (row.overAgeQty ?? 0) > 0 }">
                {{ formatInt(row.overAgeQty ?? 0) }}
              </span>
            </template>

            <template #exceptionBatchCnt="{ row }">
              <span :class="{ 'danger-text': (row.exceptionBatchCnt ?? 0) > 0 }">
                {{ formatInt(row.exceptionBatchCnt ?? 0) }}
              </span>
            </template>

            <template #availableBatchCnt="{ row }">
              <ElTag
                v-if="(row.availableBatchCnt ?? 0) > 0"
                type="success"
                effect="light"
                size="small"
                disable-transitions
              >
                {{ formatInt(row.availableBatchCnt) }} 批
              </ElTag>
              <span v-else class="muted">0</span>
            </template>

            <template #consumingBatchCost="{ row }">
              <button
                v-if="canCostDrill(row, 'consumingBatchCost')"
                type="button"
                class="drill-cell"
                @click="onCostDrillClick(row, 'consumingBatchCost', $event)"
              >
                <ElTag
                  type="warning"
                  effect="plain"
                  size="small"
                  disable-transitions
                  class="cost-tag"
                >
                  {{ formatByMeta(FIELD_META.consumingBatchCost, row.consumingBatchCost) }}
                </ElTag>
                <ElIcon class="chev"><ArrowDown /></ElIcon>
              </button>
              <span v-else-if="row.consumingBatchCost != null" class="drill-cell is-static">
                <ElTag
                  type="warning"
                  effect="plain"
                  size="small"
                  disable-transitions
                  class="cost-tag"
                >
                  {{ formatByMeta(FIELD_META.consumingBatchCost, row.consumingBatchCost) }}
                </ElTag>
                <span class="chev-slot" aria-hidden="true"></span>
              </span>
              <span v-else class="muted">-</span>
            </template>

            <!-- 成本列：主值 + ▾，浮层拆采购 / 物流及占比 -->
            <template #costDrill="{ row, prop }">
              <button
                v-if="canCostDrill(row, prop)"
                type="button"
                class="drill-cell"
                :class="{
                  bold: prop === 'balanceTotalAmount',
                  'danger-text': prop === 'balanceTotalAmount' && hasBalanceException(row)
                }"
                @click="onCostDrillClick(row, prop, $event)"
              >
                <span class="drill-value">
                  <ElTooltip
                    v-if="prop === 'balanceTotalAmount' && hasBalanceException(row)"
                    :content="balanceExceptionTip(row)"
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
                  'danger-text': prop === 'balanceTotalAmount' && hasBalanceException(row)
                }"
              >
                <span class="drill-value" :class="{ muted: row[prop] == null || row[prop] === '' }">
                  <ElTooltip
                    v-if="prop === 'balanceTotalAmount' && hasBalanceException(row)"
                    :content="balanceExceptionTip(row)"
                    placement="top"
                  >
                    <ElIcon><WarningFilled /></ElIcon>
                  </ElTooltip>
                  {{
                    row[prop] == null || row[prop] === ''
                      ? '-'
                      : formatCostDrillValue(prop, row[prop])
                  }}
                </span>
                <span class="chev-slot" aria-hidden="true"></span>
              </span>
            </template>

            <template #stockStatus="{ row }">
              <ElTag
                size="small"
                :type="STOCK_STATUS_MAP[row.stockStatus]?.type"
                disable-transitions
              >
                {{ STOCK_STATUS_MAP[row.stockStatus]?.label }}
              </ElTag>
            </template>

            <template #consumeStatus="{ row }">
              <ElTag
                size="small"
                :type="CONSUME_STATUS_MAP[row.consumeStatus]?.type"
                disable-transitions
              >
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

            <template #dash="{ row, prop }">
              <span :class="{ muted: !row[prop] }">{{ row[prop] || '-' }}</span>
            </template>

            <!-- 无成本溯源的批次类型整组显示 -，hover 说明取价规则 -->
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

            <!-- 消耗流水已并入批次台账，操作列只保留台账入口（仅批次明细视图） -->
            <template #operation="{ row }">
              <ElButton type="primary" link size="small" @click.stop="openLedger(row)">
                批次台账
              </ElButton>
            </template>
          </ArtTableGroup>
        </div>
      </ElCard>
    </div>

    <!-- ⑤ 批次台账抽屉 -->
    <BatchLedgerDrawer v-model:visible="ledgerVisible" :batch-id="ledgerBatchId" />

    <!-- 成本列三级下钻浮层：采购 / 物流及占比 -->
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
  import { computed, defineAsyncComponent, onMounted, ref, watch, type CSSProperties } from 'vue'
  import {
    ElAlert,
    ElButton,
    ElCard,
    ElIcon,
    ElInput,
    ElLink,
    ElOption,
    ElRadioButton,
    ElRadioGroup,
    ElSelect,
    ElSpace,
    ElTag,
    ElTooltip
  } from 'element-plus'
  import { ArrowDown, Grid, Search, WarningFilled } from '@element-plus/icons-vue'
  import { onClickOutside } from '@vueuse/core'
  import dayjs from 'dayjs'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import ArtTableGroup from '@/components/core/tables/art-table-group/index.vue'
  import ArtTableHeaderGroup from '@/components/core/tables/art-table-header-group/index.vue'
  import CardItems from '@/components/core/charts-comp/card-setting-all/items.vue'
  import CardSetting from '@/components/core/charts-comp/card-setting-all/setting.vue'
  import {
    buildDefaultLayout,
    type CardGroup,
    type CardMetric
  } from '@/components/core/charts-comp/types'
  import { useTable } from '@/composables/useTable'
  import {
    batchBalanceExport,
    batchBalanceGroupList,
    batchBalanceList,
    batchBalanceSummary,
    batchFilterOptions
  } from '@/api/inventory/batch-balance'
  import {
    AGE_WARN_DAYS,
    BATCH_TYPES,
    BATCH_TYPE_MAP,
    CONSUME_STATUS_MAP,
    INV_ATTR_MAP,
    INV_ATTR_OPTIONS,
    PLATFORM_OPTIONS,
    STOCK_STATUS_MAP,
    TRANSIT_WARN_DAYS
  } from '../utils/dict'
  import { INVENTORY_DATE_SHORTCUTS } from '../utils/date-shortcuts'
  import { formatByMeta, formatInt, formatMoney, formatPercent, formatPrice } from '../utils/format'
  import { buildBatchColumns, buildSummaryColumns } from './columns'
  import {
    canCostDrill,
    costDrillFmtOf,
    costDrillLabelOf,
    getCostDrillRows,
    type CostDrillRow
  } from './columns/cost-drill'
  import { BATCH_COLUMN_GROUPS, FIELD_META } from './columns/shared'
  import type {
    BatchBalanceView,
    BatchMetrics,
    BatchRow,
    BatchStatus,
    BatchTab,
    SkuWarehouseSummaryRow
  } from './utils/types'

  defineOptions({ name: 'InventoryBatchBalance' })

  const BatchLedgerDrawer = defineAsyncComponent(
    () => import('./components/batch-ledger-drawer.vue')
  )
  const BatchGroupExpand = defineAsyncComponent(() => import('./components/batch-group-expand.vue'))

  /* ---------------- 视图 + 维度 Tab ---------------- */

  const view = ref<BatchBalanceView>('summary')
  const expandedRowKeys = ref<string[]>([])

  const TABS: { name: BatchTab; label: string }[] = [
    { name: 'inStock', label: '在仓' },
    { name: 'inTransit', label: '在途' },
    { name: 'exhausted', label: '已耗尽 / 已关闭' },
    { name: 'all', label: '全部' }
  ]
  const activeTab = ref<BatchTab>('inStock')

  /** 列偏好按 视图×Tab 分开存；汇总新增可售/消耗/最近成本列后升 v2 */
  const currentTableName = computed(() =>
    view.value === 'summary'
      ? `inventory-batch-balance-summary-${activeTab.value}-v3`
      : `inventory-batch-balance-${activeTab.value}-v4`
  )

  /* ---------------- 筛选 ---------------- */

  const KEYWORD_OPTIONS = [
    { label: '批次号', value: 'batchNo' },
    { label: '批次内部ID', value: 'batchId' },
    { label: '本地SKU', value: 'localSku' },
    { label: 'MSKU', value: 'msku' },
    // 后四项落在消耗流水上：批次命中 = 它的流水里有命中行
    { label: '业务编号', value: 'bizNo' },
    { label: '库存流水编号', value: 'invFlowNo' },
    { label: '成本流水编号', value: 'costFlowNo' },
    { label: '关联平台单据', value: 'platformDocNo' }
  ]

  const defaultSearchForm = () => ({
    companyId: 'C001',
    platform: '',
    storeIdList: [] as string[],
    warehouseCodeList: [] as string[],
    batchTypeList: [] as string[],
    invAttr: '',
    dateType: 'inventoryDate',
    dateRange: [] as string[],
    keyword: '',
    keywordType: 'batchNo',
    hasEstimated: '',
    ageRange: ''
  })
  const searchForm = ref(defaultSearchForm())

  /** 工具条上的两个状态筛选：与筛选区分工，避免同一字段两个入口 */
  const consumeStatus = ref('')
  const costStatus = ref('')
  const onlyException = ref(false)

  const storeOptions = ref<{ value: string; label: string }[]>([])
  const warehouseOptions = ref<{ value: string; label: string; platform: string }[]>([])

  const platformLabel = (value: string) =>
    PLATFORM_OPTIONS.find((p) => p.value === value)?.label || value

  const searchItems = computed(() => {
    const isTransit = activeTab.value === 'inTransit'
    return [
      {
        key: 'companyId',
        label: '',
        type: 'select',
        placeholder: '公司主体',
        width: '150px',
        // 单选下拉走 v-bind="props"，placeholder 必须放进 props，写在外层会被忽略
        props: {
          options: [
            { value: 'C001', label: '深圳迈科电子' },
            { value: 'C002', label: '香港迈科国际' }
          ],
          placeholder: '公司主体',
          clearable: false
        }
      },
      {
        key: 'dateRange',
        label: '',
        type: 'daterange',
        width: '360px',
        compositeSearch: true,
        selectKey: 'dateType',
        selectWidth: '112px',
        selectOptions: [
          { label: '库存日期', value: 'inventoryDate' },
          { label: '入仓日期', value: 'inboundDate' },
          { label: '发货日期', value: 'shipDate' }
        ],
        inputType: 'daterange',
        placeholder: '开始日期,结束日期',
        clearable: true,
        datePickerProps: {
          valueFormat: 'YYYY-MM-DD',
          unlinkPanels: true,
          shortcuts: INVENTORY_DATE_SHORTCUTS,
          disabledDate: (date: Date) => date.getTime() > dayjs().endOf('day').valueOf()
        }
      },
      {
        key: 'platform',
        label: '',
        type: 'select',
        placeholder: '平台',
        width: '140px',
        props: { options: PLATFORM_OPTIONS, placeholder: '平台', clearable: true }
      },
      {
        key: 'storeIdList',
        label: '',
        type: 'select',
        selectMultiple: true,
        alwaysFilterInput: true,
        placeholder: '店铺',
        width: '160px',
        labelValue: { name: 'label', value: 'value' },
        props: { options: storeOptions.value, clearable: true }
      },
      {
        key: 'warehouseCodeList',
        label: '',
        type: 'select',
        selectMultiple: true,
        placeholder: '仓库',
        width: '180px',
        labelValue: { name: 'label', value: 'value' },
        props: { options: filteredWarehouses.value, clearable: true }
      },
      {
        key: 'batchTypeList',
        label: '',
        type: 'select',
        selectMultiple: true,
        placeholder: '批次类型',
        width: '170px',
        labelValue: { name: 'label', value: 'value' },
        props: {
          options: BATCH_TYPES.map((t) => ({ value: t.value, label: `${t.value} ${t.label}` })),
          clearable: true
        }
      },
      {
        key: 'invAttr',
        label: '',
        type: 'select',
        placeholder: '库存属性',
        width: '120px',
        props: { options: INV_ATTR_OPTIONS, placeholder: '库存属性', clearable: true }
      },
      { key: 'keyword', label: '', type: 'input', width: '300px' },
      {
        key: 'hasEstimated',
        label: '',
        type: 'select',
        placeholder: '是否含暂估',
        width: '140px',
        overflow: true,
        props: {
          options: [
            { value: '', label: '全部' },
            { value: 'Y', label: '含暂估' },
            { value: 'N', label: '不含暂估' }
          ],
          placeholder: '是否含暂估',
          clearable: true
        }
      },
      {
        key: 'ageRange',
        label: '',
        type: 'select',
        placeholder: isTransit ? '在途天数' : '库龄区间',
        width: '140px',
        overflow: true,
        props: {
          options: isTransit
            ? [
                { value: '', label: '全部' },
                { value: '0-30', label: '30 天内' },
                { value: '30-45', label: '30-45 天' },
                { value: '45-', label: '超 45 天' }
              ]
            : [
                { value: '', label: '全部' },
                { value: '0-30', label: '30 天内' },
                { value: '31-60', label: '31-60 天' },
                { value: '61-90', label: '61-90 天' },
                { value: '90-', label: '超 90 天' }
              ],
          placeholder: isTransit ? '在途天数' : '库龄区间',
          clearable: true
        }
      }
    ]
  })

  /** 仓库选项随平台联动 */
  const filteredWarehouses = computed(() =>
    searchForm.value.platform
      ? warehouseOptions.value.filter((w) => w.platform === searchForm.value.platform)
      : warehouseOptions.value
  )

  /* ---------------- 指标卡 ---------------- */

  const CARD_GROUPS: CardGroup[] = [
    {
      key: 'batch',
      title: '批次结存',
      max: 8,
      items: [
        {
          key: 'balanceTotalAmount',
          label: '结存总成本',
          format: 'money',
          tooltip: '口径日结存采购金额 + 结存物流金额；副指标展示金额构成及占比',
          defaultSelected: true
        },
        {
          key: 'balanceQty',
          label: '结存数量',
          format: 'number',
          tooltip: '库存日期选范围时取最新日的日终结存；未选日期时取系统最新快照',
          defaultSelected: true
        },
        {
          key: 'overAgeQty',
          label: '超 90 天结存',
          format: 'number',
          tooltip: '口径日库龄 > 90 天、结存数量 > 0 的在仓批次；点击可筛选对应批次',
          defaultSelected: true
        },
        {
          key: 'avgGoodAgeDays',
          label: '良品平均库龄',
          format: 'float',
          tooltip: '∑（口径日 − 入仓日期）× 良品结存数量 ÷ 良品结存数量',
          defaultSelected: true
        },
        {
          key: 'outboundConsumedQty',
          label: '出库消耗数量',
          format: 'number',
          tooltip: '截至口径日已签收数量 − 结存数量，按良品、次品分开统计',
          defaultSelected: true
        },
        {
          key: 'inboundQty',
          label: '入库数量',
          format: 'number',
          tooltip: '截至口径日已签收入仓的累计数量，按良品、次品分开统计',
          defaultSelected: true
        },
        {
          key: 'outboundConsumedAmount',
          label: '出库消耗金额',
          format: 'money',
          tooltip: '截至口径日已出库消耗数量 × 批次单位总成本',
          defaultSelected: true
        },
        {
          key: 'inboundAmount',
          label: '入库金额',
          format: 'money',
          tooltip: '截至口径日已签收入仓数量 × 批次单位总成本',
          defaultSelected: true
        }
      ]
    }
  ]
  const CLICKABLE_CARDS = ['overAgeQty']

  const cardLayout = ref(buildDefaultLayout(CARD_GROUPS))

  const metrics = ref<BatchMetrics>({
    balanceQty: 0,
    balanceTotalAmount: 0,
    balancePurchaseAmount: 0,
    balancePurchaseRate: 0,
    balanceLogisticsAmount: 0,
    balanceLogisticsRate: 0,
    goodQty: 0,
    goodRate: 0,
    defectiveQty: 0,
    defectiveRate: 0,
    overAgeQty: 0,
    overAgeGoodQty: 0,
    overAgeGoodRate: 0,
    overAgeDefectiveQty: 0,
    overAgeDefectiveRate: 0,
    avgGoodAgeDays: 0,
    goodAge0To30Qty: 0,
    goodAge0To30Rate: 0,
    goodAge31To60Qty: 0,
    goodAge31To60Rate: 0,
    goodAge61To90Qty: 0,
    goodAge61To90Rate: 0,
    goodAgeOver90Qty: 0,
    goodAgeOver90Rate: 0,
    outboundConsumedQty: 0,
    goodOutboundConsumedQty: 0,
    goodOutboundConsumedRate: 0,
    defectiveOutboundConsumedQty: 0,
    defectiveOutboundConsumedRate: 0,
    inboundQty: 0,
    goodInboundQty: 0,
    goodInboundRate: 0,
    defectiveInboundQty: 0,
    defectiveInboundRate: 0,
    outboundConsumedAmount: 0,
    goodOutboundConsumedAmount: 0,
    goodOutboundConsumedAmountRate: 0,
    defectiveOutboundConsumedAmount: 0,
    defectiveOutboundConsumedAmountRate: 0,
    inboundAmount: 0,
    goodInboundAmount: 0,
    goodInboundAmountRate: 0,
    defectiveInboundAmount: 0,
    defectiveInboundAmountRate: 0
  })
  const totals = ref<Record<string, number>>({})
  const status = ref<BatchStatus>({
    dataDate: dayjs().format('YYYY-MM-DD'),
    jobFinished: true,
    reconciled: true,
    exceptionCount: 0
  })

  const statusType = computed(() => {
    if (!status.value.reconciled) return 'error'
    if (!status.value.jobFinished) return 'warning'
    return 'info'
  })

  const metricText = (key: string) => {
    const value = (metrics.value as unknown as Record<string, number>)[key] ?? 0
    if (key === 'avgGoodAgeDays') return `${value.toFixed(1)} 天`
    if (key.endsWith('Amount')) return formatMoney(value)
    return `${formatInt(value)} 件`
  }

  const goodAgeSegments = computed(() => [
    {
      key: 'fresh',
      label: '0-30',
      qty: metrics.value.goodAge0To30Qty,
      rate: metrics.value.goodAge0To30Rate
    },
    {
      key: 'normal',
      label: '31-60',
      qty: metrics.value.goodAge31To60Qty,
      rate: metrics.value.goodAge31To60Rate
    },
    {
      key: 'attention',
      label: '61-90',
      qty: metrics.value.goodAge61To90Qty,
      rate: metrics.value.goodAge61To90Rate
    },
    {
      key: 'overdue',
      label: '>90',
      qty: metrics.value.goodAgeOver90Qty,
      rate: metrics.value.goodAgeOver90Rate
    }
  ])

  const formatCompactInt = (value: number) => {
    if (value >= 10000) return `${(value / 10000).toFixed(1)}万`
    if (value >= 1000) return `${(value / 1000).toFixed(1)}千`
    return formatInt(value)
  }

  const overAgeFilterActive = computed(() => searchForm.value.ageRange === '90-')

  const onCardClick = (metric: CardMetric) => {
    if (metric.key !== 'overAgeQty') return
    searchForm.value.ageRange = overAgeFilterActive.value ? '' : '90-'
    if (activeTab.value === 'inStock') handleSearch()
    else activeTab.value = 'inStock'
  }

  /* ---------------- 表格 ---------------- */

  const columnsFactory = computed(() =>
    view.value === 'summary'
      ? buildSummaryColumns(activeTab.value)
      : buildBatchColumns(activeTab.value)
  )

  const buildApiParams = (params: Record<string, any>) => ({
    ...params,
    tab: activeTab.value,
    consumeStatusList: consumeStatus.value ? [consumeStatus.value] : [],
    costStatus: costStatus.value,
    onlyException: onlyException.value
  })

  /** 展开面板沿用当前筛选，但去掉分页与排序，由面板自行限定 SKU+仓 */
  const expandQuery = computed(() => {
    const apiParams = buildApiParams({ ...searchForm.value }) as Record<string, any>
    const {
      currentPage: _c,
      pageSize: _p,
      sortProp: _sp,
      sortOrder: _so,
      localSku: _ls,
      warehouseCode: _wc,
      ...rest
    } = apiParams
    return rest
  })

  /** 派生列在这里补齐：已消耗 = −（签收 − 结存）、单位总成本、库龄、在途天数 */
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

  const listApi = async (params: Record<string, any>) => {
    const apiParams = buildApiParams(params)
    const res: any =
      view.value === 'summary'
        ? await batchBalanceGroupList(apiParams)
        : await batchBalanceList(apiParams)
    const records =
      view.value === 'summary'
        ? ((res?.data?.records || []) as SkuWarehouseSummaryRow[])
        : ((res?.data?.records || []).map(mapRow) as BatchRow[])
    return {
      records,
      total: res?.data?.total || 0,
      current: res?.data?.current || params.currentPage,
      size: res?.data?.size || params.pageSize
    }
  }

  const exportHandler = (params: Record<string, any>) => batchBalanceExport(buildApiParams(params))

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    refreshData,
    resetSearchParams: resetTableSearch,
    searchParams,
    handleSizeChange,
    handleCurrentChange,
    updateColumn,
    resetColumns
  } = useTable({
    core: {
      apiFn: listApi,
      immediate: true,
      columnsFactory,
      tableKey: 'inventory-batch-balance',
      tableName: currentTableName.value,
      apiParams: {
        ...defaultSearchForm(),
        currentPage: 1,
        pageSize: 20
      }
    },
    transform: {
      responseAdapter: (response: { records?: any[]; total?: number }) => ({
        records: response?.records ?? [],
        total: response?.total ?? 0
      })
    },
    hooks: {
      resetFormCallback: () => {
        searchForm.value = defaultSearchForm()
        consumeStatus.value = ''
        costStatus.value = ''
        onlyException.value = false
      }
    }
  })

  const loadSummary = async () => {
    const res: any = await batchBalanceSummary(buildApiParams({ ...searchForm.value }))
    const payload = res?.data
    if (!payload) return
    metrics.value = payload.metrics
    totals.value = payload.totals
    status.value = payload.status
  }

  const countText = computed(() => {
    const t = totals.value
    if (view.value === 'summary') {
      const groupCnt = pagination.total || 0
      if (activeTab.value === 'inTransit') {
        return `共 ${formatInt(groupCnt)} 组 SKU×仓，${formatInt(t.batchCnt || 0)} 个批次，在途发货 ${formatInt(t.shippedQty || 0)} 件`
      }
      return `共 ${formatInt(groupCnt)} 组 SKU×仓，${formatInt(t.batchCnt || 0)} 个批次，结存 ${formatInt(t.balanceQty || 0)} 件`
    }
    if (activeTab.value === 'inTransit') {
      return `共 ${formatInt(t.batchCnt || 0)} 个批次，在途发货 ${formatInt(t.shippedQty || 0)} 件`
    }
    return `共 ${formatInt(t.batchCnt || 0)} 个批次，结存 ${formatInt(t.balanceQty || 0)} 件`
  })

  /** 合计行取全量汇总接口，不是当前页求和；单价 / 加权单价不可加总 */
  const NON_SUM_PROPS = new Set([
    'avgUnitCost',
    'consumingBatchCost',
    'latestPurchaseLogisticsCost',
    'purchasePrice',
    'logisticsPrice',
    'unitTotalCost'
  ])
  const summaryMethod = ({ columns: cols }: { columns: any[] }) => {
    return cols.map((col: any, index: number) => {
      if (index === 0 || col.type === 'expand') return index === 0 ? '合计' : ''
      const prop = col.property as string
      if (!prop || prop === 'operation' || NON_SUM_PROPS.has(prop)) return '-'
      if (prop === 'batchCnt') return formatInt(totals.value.batchCnt || 0)
      if (!(prop in totals.value)) return '-'
      return formatByMeta(FIELD_META[prop], totals.value[prop])
    })
  }

  const rowClassName = ({ row }: { row: BatchRow | SkuWarehouseSummaryRow }) => {
    const cls: string[] = []
    if (view.value === 'summary') {
      const summary = row as SkuWarehouseSummaryRow
      if (summary.exceptionBatchCnt > 0) cls.push('row-exception')
      if (expandedRowKeys.value.includes(summary.rowKey)) cls.push('row-expanded')
      return cls.join(' ')
    }
    const batch = row as BatchRow
    if (batch.batchType === 'PV') cls.push('row-estimated')
    if (batch.exceptionFlag) cls.push('row-exception')
    return cls.join(' ')
  }

  /* ---------------- 成本三级下钻浮层 ---------------- */

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
    const fmt = costDrillFmtOf(prop) || FIELD_META[prop]?.fmt
    if (fmt === 'price') return formatPrice(value)
    return formatMoney(value)
  }

  const hasBalanceException = (row: any) =>
    view.value === 'batch' ? !!row.exceptionFlag : (row.exceptionBatchCnt || 0) > 0

  const balanceExceptionTip = (row: any) =>
    view.value === 'batch'
      ? '结存数量为 0 时金额必须为 0，请检查未分摊金额或舍入尾差'
      : `组内有 ${row.exceptionBatchCnt} 个异常批次`

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

  watch([view, activeTab], closeCostDrill)

  /* ---------------- 交互 ---------------- */

  const handleSearch = () => {
    expandedRowKeys.value = []
    Object.assign(searchParams, searchForm.value)
    getData()
    loadSummary()
  }
  const handleReset = async () => {
    await resetTableSearch()
    loadSummary()
  }
  const handleRefresh = () => {
    refreshData()
    loadSummary()
  }

  const toggleException = () => {
    onlyException.value = !onlyException.value
    handleSearch()
  }

  const handleSortChange = ({
    prop,
    order
  }: {
    prop: string | null
    order: 'ascending' | 'descending' | null
  }) => {
    const sp = searchParams as Record<string, unknown>
    sp.sortProp = prop && order ? prop : undefined
    sp.sortOrder = prop && order ? order : undefined
    getData()
  }

  const ledgerVisible = ref(false)
  const ledgerBatchId = ref<string>()
  const openLedger = (row: BatchRow) => {
    ledgerBatchId.value = row.batchId
    ledgerVisible.value = true
  }

  const handleExpandChange = (
    row: SkuWarehouseSummaryRow,
    expandedOrRows: boolean | SkuWarehouseSummaryRow[]
  ) => {
    if (view.value !== 'summary') return
    const open = Array.isArray(expandedOrRows)
      ? expandedOrRows.some((r) => r.rowKey === row.rowKey)
      : !!expandedOrRows
    expandedRowKeys.value = open
      ? [...new Set([...expandedRowKeys.value, row.rowKey])]
      : expandedRowKeys.value.filter((k) => k !== row.rowKey)
  }

  const collapseExpand = (row: SkuWarehouseSummaryRow) => {
    expandedRowKeys.value = expandedRowKeys.value.filter((k) => k !== row.rowKey)
  }

  /* ---------------- 生命周期 ---------------- */

  /**
   * 列顺序按 columnChecks 渲染，而 useTableColumns 在列集变化时会沿用上一份顺序、
   * 把新列追加到末尾。视图 / Tab 切换换的是整套列，必须重置回工厂顺序，
   * 否则两套列集互相污染，表头顺序会越切越乱。重置后表头重挂载会再拉一次服务端列偏好。
   */
  const resetColumnOrder = () => resetColumns?.()

  watch(view, () => {
    expandedRowKeys.value = []
    resetColumnOrder()
    const sp = searchParams as Record<string, unknown>
    sp.sortProp = undefined
    sp.sortOrder = undefined
    if (pagination.currentPage !== 1) handleCurrentChange(1)
    else getData()
  })

  watch(activeTab, () => {
    expandedRowKeys.value = []
    resetColumnOrder()
    const sp = searchParams as Record<string, unknown>
    sp.tab = activeTab.value
    sp.sortProp = undefined
    sp.sortOrder = undefined
    if (pagination.currentPage !== 1) handleCurrentChange(1)
    else getData()
    loadSummary()
  })

  onMounted(async () => {
    const res: any = await batchFilterOptions()
    const options = res?.data
    if (options) {
      storeOptions.value = options.stores || []
      warehouseOptions.value = options.warehouses || []
    }
    loadSummary()
  })
</script>

<style lang="scss" scoped>
  .batch-balance-page {
    .batch-table-section {
      display: flex;
      flex: 1;
      flex-direction: column;
      min-height: 0;

      &.el-full-screen {
        .status-bar,
        .metric-zone {
          display: none;
        }
      }
    }

    /* 维度切换：与工具条同高，放在最前 */
    .dim-seg {
      :deep(.el-radio-button__inner) {
        padding: 5px 10px;
      }
    }

    .toolbar-label-group {
      display: inline-flex;
      gap: 6px;
      align-items: center;
    }

    .toolbar-label {
      display: inline-flex;
      gap: 4px;
      align-items: center;
      font-size: 12px;
      line-height: 1;
      color: var(--art-text-gray-600);
      white-space: nowrap;

      .toolbar-label-icon {
        font-size: 14px;
        color: var(--art-text-gray-500);
      }
    }

    .status-bar {
      margin-bottom: 8px;

      .status-line {
        display: flex;
        align-items: center;
        justify-content: space-between;
        width: 100%;
        font-size: 12px;
      }
    }

    .metric-zone {
      padding: 10px 12px;
      margin-bottom: 8px;

      .metric-head {
        display: flex;
        align-items: center;
        justify-content: space-between;
        margin-bottom: 6px;
      }

      .metric-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--art-text-gray-800);
      }

      .metric-actions {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .metric-tip {
        font-size: 11px;
        line-height: 1.2;
        color: var(--art-text-gray-500);
      }

      .metric-value {
        font-size: 18px;
        font-weight: 650;
        line-height: 1.2;
        color: var(--art-text-gray-800);
      }

      :deep(.card-items .ci-flat-row > .kpi-card) {
        flex: 0 0 calc(11.9% - 10.5px);
        max-width: calc(11.9% - 10.5px);
        min-height: 112px;
        padding: 8px 9px;
      }

      :deep(.card-items .ci-flat-row > .kpi-card:has(.age-distribution)) {
        flex-basis: calc(16.6667% - 10px);
        max-width: calc(16.6667% - 10px);
      }

      :deep(.card-items .ci-flat-row) {
        flex-wrap: nowrap;
        gap: 12px;
        padding-bottom: 1px;
        overflow-x: auto;
      }

      .metric-detail-grid {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 3px;
      }

      .metric-detail-item {
        display: grid;
        grid-template-columns: minmax(26px, 1fr) minmax(0, auto) 36px;
        gap: 3px;
        align-items: center;
        min-width: 0;

        span {
          overflow: hidden;
          font-size: 10px;
          color: var(--art-text-gray-500);
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        b {
          overflow: hidden;
          font-size: 11px;
          font-weight: 600;
          color: var(--art-text-gray-800);
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        em {
          font-size: 10px;
          font-style: normal;
          color: var(--art-text-gray-500);
          text-align: right;
        }
      }

      .metric-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        margin-right: 4px;
        vertical-align: 1px;
        background: #94a3b8;
        border-radius: 50%;

        &.purchase,
        &.good,
        &.age-fresh {
          background: #22c55e;
        }

        &.logistics,
        &.age-normal {
          background: #5b8ff9;
        }

        &.defective,
        &.age-attention {
          background: #f59e0b;
        }

        &.age-overdue {
          background: #ef4444;
        }
      }

      .age-bar {
        display: flex;
        height: 7px;
        overflow: hidden;
        background: var(--el-fill-color-light);
        border-radius: 4px;

        span {
          min-width: 0;

          &.age-fresh {
            background: #22c55e;
          }

          &.age-normal {
            background: #5b8ff9;
          }

          &.age-attention {
            background: #f59e0b;
          }

          &.age-overdue {
            background: #ef4444;
          }
        }
      }

      .age-legend {
        display: grid;
        grid-template-columns: repeat(4, minmax(0, 1fr));
        gap: 4px;
        margin-top: 5px;

        div {
          display: flex;
          flex-direction: column;
          min-width: 0;
        }

        span {
          overflow: hidden;
          font-size: 9px;
          color: var(--art-text-gray-500);
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        b {
          display: flex;
          flex-direction: column;
          overflow: hidden;
          font-size: 9px;
          font-weight: 600;
          color: var(--art-text-gray-800);

          strong,
          em {
            overflow: hidden;
            font-size: inherit;
            font-style: normal;
            font-weight: inherit;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          em {
            color: var(--art-text-gray-500);
          }
        }
      }

      @media (width <= 1440px) {
        :deep(.card-items .ci-flat-row > .kpi-card) {
          flex-basis: 138px;
          max-width: 138px;
        }

        :deep(.card-items .ci-flat-row > .kpi-card:has(.age-distribution)) {
          flex-basis: 220px;
          max-width: 220px;
        }
      }
    }

    /* 工具条与主表同卡：卡内自上而下排工具条、表格 */
    .art-table-card {
      :deep(.el-card__body) {
        display: flex;
        flex-direction: column;
        padding: 10px 12px;
      }

      :deep(.table-header) {
        margin-bottom: 8px;
      }

      .table-body {
        flex: 1;
        min-height: 0;
      }
    }

    :deep(.el-table) {
      font-size: 12px;

      th.el-table__cell {
        padding: 6px 0;
        font-size: 12px;
        font-weight: 600;
        color: var(--art-text-gray-700);
      }

      td.el-table__cell {
        padding: 6px 0;
      }

      .cell {
        padding: 0 7px;
        line-height: 18px;
      }

      .el-table__footer-wrapper td.el-table__cell .cell {
        font-weight: 600;
        color: var(--art-text-gray-800);
      }

      /* 结存数量等强调列：表头 / 单元格 / 合计行统一加粗 */
      th.el-table__cell.is-emphasis-column .cell,
      td.el-table__cell.is-emphasis-column .cell {
        font-weight: 700;
        color: var(--art-text-gray-900);
      }

      .el-table__footer-wrapper td.el-table__cell.is-emphasis-column .cell {
        font-weight: 700;
      }
    }

    .keyword-item {
      display: flex;
      width: 100%;

      :deep(.el-input) {
        flex: 1;
        margin-left: -1px;
      }
    }

    .count-text {
      font-size: 11px;
      line-height: 1.2;
      color: var(--art-text-gray-600);
      white-space: nowrap;
    }

    .two-line {
      display: flex;
      flex-direction: column;
      line-height: 1.35;

      .sub {
        color: var(--art-text-gray-500);
        transform: scale(0.92);
        transform-origin: left center;
      }
    }

    .mono {
      font-family: SFMono-Regular, Consolas, monospace;
    }

    .muted {
      color: var(--art-text-gray-400);
    }

    .bold {
      font-weight: 600;
    }

    .warn-text {
      color: var(--el-color-warning);
    }

    .danger-text {
      display: inline-flex;
      gap: 2px;
      align-items: center;
      color: var(--el-color-danger);
    }

    .type-tag {
      color: #fff;
      border: none;
    }

    .cost-tag {
      font-variant-numeric: tabular-nums;
    }

    /* 数值 + ▾：有无箭头时数字右边缘对齐 */
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

      .drill-value {
        display: inline-flex;
        gap: 2px;
        align-items: center;
        font-variant-numeric: tabular-nums;
      }

      .chev {
        font-size: 10px;
        color: var(--art-text-gray-400);
      }

      .chev-slot {
        width: 10px;
      }
    }

    :deep(.el-table__row.row-estimated) {
      background: var(--art-bg-danger, rgb(255 77 79 / 6%));
    }

    :deep(.el-table__row.row-exception td) {
      background: rgb(255 77 79 / 6%);
    }
  }

  /* 浮层挂 body，但仍属本组件模板，可用 scoped */
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
