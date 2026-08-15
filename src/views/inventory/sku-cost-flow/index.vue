<template>
  <div class="sku-cost-flow-page art-full-height" v-auth="'inventory:skuCostFlow:view'">
    <div class="flow-table-section">
      <!-- ① 筛选区：全屏时保留 -->
      <ArtSearchBar
        v-model="searchForm"
        :items="searchItems"
        :showSearch="false"
        @reset="handleReset"
        @search="handleSearch"
      >
        <template v-if="searchForm.dateGrain === 'week'" #invDateRange="{ modelValue }">
          <div class="inventory-week-range">
            <ElSelect
              v-model="modelValue.dateGrain"
              size="small"
              style="width: 80px"
              @change="handleSearch"
            >
              <ElOption label="按日" value="day" />
              <ElOption label="按周" value="week" />
              <ElOption label="按月" value="month" />
            </ElSelect>
            <PeriodWeekRangePicker
              v-model="modelValue.invDateRange"
              :clearable="false"
              start-placeholder="开始周"
              end-placeholder="结束周"
              :date-picker-props="{
                unlinkPanels: true,
                firstDayOfWeek: 1,
                disabledDate: disabledFutureDate
              }"
              @change="handleSearch"
            />
          </div>
        </template>

        <!-- 业务类型：左选一级、右选二级出入库类型 -->
        <template #ioTypeList="{ modelValue }">
          <MkCascadeSelect
            v-model="modelValue.ioTypeList"
            :options="BIZ_IO_TREE"
            placeholder="业务类型"
            :panel-width="420"
            @change="handleSearch"
          />
        </template>

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

      <!-- ② 三层对平状态条 -->
      <ElAlert class="status-bar" :type="statusType" :closable="false" show-icon>
        <template #title>
          <div class="status-line">
            <span class="status-items">
              <span>数据截至 {{ status.dataDate }}</span>
              <ElLink
                v-for="item in checkItems"
                :key="item.key"
                :type="item.ok ? 'default' : 'danger'"
                :underline="false"
                @click="filterUnbalanced(item.key)"
              >
                {{ item.label }} {{ item.ok ? '✓' : '✗' }}
              </ElLink>
              <ElTag v-if="status.monthlyReconciled" size="small" type="info">
                本月已执行平台期末库存对账
              </ElTag>
            </span>
            <span :class="{ 'danger-text': status.unbalancedCount > 0 }">
              不平记录 {{ status.unbalancedCount }} 条
            </span>
          </div>
        </template>
      </ElAlert>

      <!-- ③ 核心指标 -->
      <div class="metric-zone art-custom-card">
        <div class="metric-head">
          <span class="metric-title">库存与成本流转总览</span>
          <div class="metric-head-tools">
            <button
              type="button"
              class="trend-toggle"
              :class="{ 'is-open': trendOpen }"
              :title="trendOpen ? '收起指标趋势对比' : '展开指标趋势对比'"
              @click="trendOpen = !trendOpen"
            >
              <span>指标趋势对比</span>
              <ElIcon class="trend-arrow"><ArrowDown /></ElIcon>
            </button>
            <CardSetting
              v-model="cardLayout"
              :groups="cardGroups"
              name="inventory-sku-cost-flow-v4"
              title="配置指标"
              :max-total="7"
              :width="520"
              dense
            >
              <!-- 趋势对比指标与指标卡共用一个配置入口，页面上不再单独占一行 -->
              <template #extra>
                <div class="trend-metric-setting">
                  <div class="tms-head">
                    <span class="tms-title">趋势对比指标</span>
                    <span class="tms-tip">最多 {{ MAX_TREND_METRICS }} 个</span>
                  </div>
                  <ElSelect
                    v-model="trendMetricKeys"
                    size="small"
                    multiple
                    collapse-tags
                    collapse-tags-tooltip
                    :max-collapse-tags="2"
                    :multiple-limit="MAX_TREND_METRICS"
                    placeholder="选择对比指标"
                    :teleported="false"
                    @change="onTrendMetricChange"
                  >
                    <ElOptionGroup
                      v-for="group in TREND_OPTION_GROUPS"
                      :key="group.label"
                      :label="group.label"
                    >
                      <ElOption
                        v-for="option in group.options"
                        :key="option.key"
                        :label="option.label"
                        :value="option.key"
                      />
                    </ElOptionGroup>
                  </ElSelect>
                </div>
              </template>
            </CardSetting>
          </div>
        </div>
        <CardItems
          variant="sc-zone"
          :groups="cardGroups"
          :layout="cardLayout"
          :clickable-keys="CLICKABLE_CARDS"
          :filter-active-keys="activeMetricFilterKeys"
          @card-click="onCardClick"
        >
          <template #value="{ metric }">
            <div
              v-if="metric.key === 'closingAmount' || metric.key === 'closingQty'"
              class="metric-value-with-change"
            >
              <span class="metric-value">
                {{
                  metric.key === 'closingAmount'
                    ? formatMoney(metrics.closingAmount)
                    : `${formatInt(metrics.closingQty)} 件`
                }}
              </span>
              <em
                class="metric-change"
                :title="
                  metric.key === 'closingAmount'
                    ? `变动 ${formatSignedMoney(metrics.netChangeAmount)}`
                    : `变动 ${formatSignedQty(metrics.netChangeQty)}`
                "
                :class="{
                  'is-up':
                    metrics[metric.key === 'closingAmount' ? 'netChangeAmount' : 'netChangeQty'] >
                    0,
                  'is-down':
                    metrics[metric.key === 'closingAmount' ? 'netChangeAmount' : 'netChangeQty'] < 0
                }"
              >
                变动
                {{
                  metric.key === 'closingAmount'
                    ? formatSignedMoney(metrics.netChangeAmount)
                    : formatSignedQty(metrics.netChangeQty)
                }}
              </em>
            </div>
            <span
              v-else-if="metric.key === 'inboundFlow' || metric.key === 'outboundFlow'"
              class="metric-value"
            >
              {{ formatInt(metrics[`${metric.key}Qty`]) }} 件
            </span>
            <span v-else-if="metric.key === 'reconciliationException'" class="metric-value">
              {{ formatInt(status.unbalancedCount) }} 条
            </span>
            <span v-else class="metric-value">
              {{
                metric.key.endsWith('Amount')
                  ? formatMoney(metrics[metric.key])
                  : `${formatInt(metrics[metric.key])} 件`
              }}
            </span>
          </template>
          <template #default="{ metric }">
            <div
              v-if="metric.key === 'openingAmount' || metric.key === 'closingAmount'"
              class="metric-detail-grid is-stacked"
            >
              <div class="metric-detail-item is-row">
                <span><i class="metric-dot good"></i>良品</span>
                <b>{{
                  formatCompactMoney(metrics[`${metric.key.replace('Amount', '')}GoodAmount`])
                }}</b>
                <em>
                  {{
                    formatPercent(
                      rateOf(
                        metrics[`${metric.key.replace('Amount', '')}GoodAmount`],
                        metrics[metric.key]
                      )
                    )
                  }}
                </em>
              </div>
              <div class="metric-detail-item is-row">
                <span><i class="metric-dot defective"></i>次品</span>
                <b>{{
                  formatCompactMoney(metrics[`${metric.key.replace('Amount', '')}DefectiveAmount`])
                }}</b>
                <em>
                  {{
                    formatPercent(
                      rateOf(
                        metrics[`${metric.key.replace('Amount', '')}DefectiveAmount`],
                        metrics[metric.key]
                      )
                    )
                  }}
                </em>
              </div>
            </div>

            <div
              v-else-if="metric.key === 'openingQty' || metric.key === 'closingQty'"
              class="metric-detail-grid is-stacked"
            >
              <div class="metric-detail-item is-row">
                <span><i class="metric-dot good"></i>良品</span>
                <b>{{ formatInt(metrics[`${metric.key.replace('Qty', '')}GoodQty`]) }}</b>
                <em>
                  {{
                    formatPercent(
                      rateOf(
                        metrics[`${metric.key.replace('Qty', '')}GoodQty`],
                        metrics[metric.key]
                      )
                    )
                  }}
                </em>
              </div>
              <div class="metric-detail-item is-row">
                <span><i class="metric-dot defective"></i>次品</span>
                <b>{{ formatInt(metrics[`${metric.key.replace('Qty', '')}DefectiveQty`]) }}</b>
                <em>
                  {{
                    formatPercent(
                      rateOf(
                        metrics[`${metric.key.replace('Qty', '')}DefectiveQty`],
                        metrics[metric.key]
                      )
                    )
                  }}
                </em>
              </div>
            </div>

            <div v-else-if="metric.key === 'inboundFlow'" class="metric-detail-grid is-stacked">
              <div class="metric-detail-item is-row">
                <span><i class="metric-dot good"></i>良品</span>
                <b>{{ formatInt(metrics.inboundGoodQty) }}</b>
                <em>{{ formatPercent(rateOf(metrics.inboundGoodQty, metrics.inboundFlowQty)) }}</em>
              </div>
              <div class="metric-detail-item is-row">
                <span><i class="metric-dot defective"></i>次品</span>
                <b>{{ formatInt(metrics.inboundDefectiveQty) }}</b>
                <em>{{
                  formatPercent(rateOf(metrics.inboundDefectiveQty, metrics.inboundFlowQty))
                }}</em>
              </div>
            </div>

            <div v-else-if="metric.key === 'outboundFlow'" class="metric-detail-grid is-stacked">
              <div class="metric-detail-item is-row">
                <span><i class="metric-dot good"></i>良品</span>
                <b>{{ formatInt(metrics.outboundGoodQty) }}</b>
                <em>{{
                  formatPercent(rateOf(metrics.outboundGoodQty, metrics.outboundFlowQty))
                }}</em>
              </div>
              <div class="metric-detail-item is-row">
                <span><i class="metric-dot defective"></i>次品</span>
                <b>{{ formatInt(metrics.outboundDefectiveQty) }}</b>
                <em>{{
                  formatPercent(rateOf(metrics.outboundDefectiveQty, metrics.outboundFlowQty))
                }}</em>
              </div>
            </div>

            <div v-else class="metric-detail-grid is-stacked">
              <div class="metric-detail-item is-row anomaly">
                <span><i class="metric-dot danger"></i>差异数量</span>
                <b>{{ formatInt(metrics.diffQty) }}</b>
              </div>
              <div class="metric-detail-item is-row anomaly">
                <span><i class="metric-dot danger"></i>差异金额</span>
                <b>{{ formatMoney(metrics.diffAmount) }}</b>
              </div>
            </div>
          </template>
        </CardItems>

        <InventoryFlowTrend
          v-if="trendOpen"
          v-model:metrics="trendMetricKeys"
          :params="trendParams"
        />
      </div>

      <!-- ④ 主表：维度 Tab + 工具条与表格同卡 -->
      <ElCard shadow="never" class="art-table-card">
        <ArtTableHeaderGroup
          v-model:columns="columnChecks"
          :key="measure"
          :loading="loading"
          layout="refresh,down,columnsNew,fullscreen"
          full-class="flow-table-section"
          :tableName="currentTableName"
          :groups="FLOW_COLUMN_GROUPS"
          :checkbox-columns="3"
          :updateColumn="updateColumn"
          :resetColumns="resetColumns"
          :exportApi="exportHandler"
          :exportParams="searchParams"
          :asyncExport="true"
          exportAuth="inventory:skuCostFlow:export"
          @refresh="handleRefresh"
        >
          <template #left>
            <ElSpace :size="12" alignment="center">
              <!-- 聚合维度：放在工具条最前，省掉顶部独立 Tab 行 -->
              <ElRadioGroup v-model="activeTab" size="small" class="dim-seg">
                <ElRadioButton v-for="tab in TABS" :key="tab.name" :value="tab.name">
                  {{ tab.label }}
                </ElRadioButton>
              </ElRadioGroup>
              <ElRadioGroup v-model="measure" size="small">
                <ElRadioButton value="qty">数量</ElRadioButton>
                <ElRadioButton value="cost">成本</ElRadioButton>
              </ElRadioGroup>
              <ElSelect
                v-model="exceptionType"
                size="small"
                style="width: 140px"
                placeholder="记录范围"
                @change="handleSearch"
              >
                <ElOption label="全部记录" value="" />
                <ElOption label="仅看不平" value="unbalanced" />
                <ElOption label="仅看含暂估" value="estimated" />
                <ElOption label="仅看异常原因非空" value="exception" />
              </ElSelect>
            </ElSpace>
          </template>
        </ArtTableHeaderGroup>

        <!-- 包一层撑满剩余高度：表格容器的高度按百分比算，需要一个已定高的父级 -->
        <div class="table-body">
          <ArtTableGroup
            ref="tableRef"
            :loading="loading"
            :data="data"
            row-key="rowKey"
            :columns="columns"
            :column-checks="columnChecks"
            :groups="FLOW_COLUMN_GROUPS"
            :pagination="pagination"
            :expand-row-keys="expandedRowKeys"
            tableKey="inventory-sku-cost-flow"
            :show-table-header="false"
            :row-class-name="rowClassName"
            show-summary
            summary-position="top"
            :summary-method="summaryMethod"
            @expand-change="handleExpandChange"
            @pagination:size-change="handleSizeChange"
            @pagination:current-change="handleCurrentChange"
            @sort-change="handleSortChange"
          >
            <template #inventoryPeriod="{ row }">
              {{ formatInventoryPeriod(row.invDate) }}
            </template>

            <template #expand="{ row }">
              <InvFlowExpand
                v-if="expandedRowKeys.includes(row.rowKey)"
                :row="row"
                :io-types="appliedIoTypes"
                @collapse="handleCollapseRow"
                @open-drawer="openSkuDrawer"
                @open-batch="openBatchLedger"
              />
            </template>

            <template #product="{ row }">
              <div class="two-line">
                <span>{{ row.msku || row.localSku || row.asin }}</span>
                <span class="sub">{{ row.localSku }} · {{ row.asin }} · {{ row.fnsku }}</span>
              </div>
            </template>

            <!-- 展开与抽屉两个入口统一收在右侧固定列 -->
            <template #operation="{ row }">
              <div class="op-cell">
                <ElButton
                  type="primary"
                  link
                  size="small"
                  class="op-toggle"
                  title="展开库存流水明细"
                  @click.stop="toggleDetail(row)"
                >
                  <ElIcon
                    class="op-arrow"
                    :class="{ 'is-expanded': expandedRowKeys.includes(row.rowKey) }"
                  >
                    <ArrowRight />
                  </ElIcon>
                </ElButton>
                <ElButton type="primary" link size="small" @click.stop="openSkuDrawer(row)">
                  当日成本
                </ElButton>
              </div>
            </template>

            <template #store="{ row }">
              <div class="two-line">
                <span>{{ row.storeName }}</span>
                <span class="sub">{{ row.siteName }}</span>
              </div>
            </template>

            <template #warehouse="{ row }">
              <div class="two-line">
                <span>{{ row.warehouseName }}</span>
                <span class="sub">{{ row.warehouseCode }}</span>
              </div>
            </template>

            <template #invAttr="{ row }">
              <ElTag size="small" :type="INV_ATTR_MAP[row.invAttr]?.type" disable-transitions>
                {{ INV_ATTR_MAP[row.invAttr]?.label || '-' }}
              </ElTag>
            </template>

            <template #genMode="{ row }">
              <ElTag size="small" :type="GEN_MODE_MAP[row.genMode]?.type" disable-transitions>
                {{ GEN_MODE_MAP[row.genMode]?.label || row.genMode }}
              </ElTag>
            </template>

            <!-- 数量口径：一个业务类型一列，▾ 里拆二级出入库类型 -->
            <template #bizQty="{ row, prop, value }">
              <button
                v-if="canDrill(row, prop)"
                type="button"
                class="drill-cell"
                :class="{ 'minus-text': value < 0 }"
                @click="onDrillClick(row, prop, $event)"
              >
                <span class="drill-value">{{ formatInt(value) }}</span>
                <ElIcon class="chev"><ArrowDown /></ElIcon>
              </button>
              <span v-else class="drill-cell is-static" :class="{ 'minus-text': value < 0 }">
                <span class="drill-value" :class="{ muted: !value }">
                  {{ value ? formatInt(value) : '-' }}
                </span>
                <span class="chev-slot" aria-hidden="true"></span>
              </span>
              <ElTooltip
                v-if="prop === 'otherAdjustQty' && value"
                content="其他调整只在每月 2 日跑批产生，归属上月最后一天"
                placement="top"
              >
                <ElIcon class="tip-icon"><InfoFilled /></ElIcon>
              </ElTooltip>
            </template>

            <!-- 成本口径：只出总成本，▾ 里拆二级出入库类型；期初期末与无二级类型的业务只留空箭头槽 -->
            <template #costDrill="{ row, prop, value }">
              <button
                v-if="canDrill(row, prop)"
                type="button"
                class="drill-cell"
                :class="{ 'minus-text': value < 0 }"
                @click="onDrillClick(row, prop, $event)"
              >
                <span class="drill-value">{{ formatMoney(value) }}</span>
                <ElIcon class="chev"><ArrowDown /></ElIcon>
              </button>
              <span
                v-else
                class="drill-cell is-static"
                :class="{ bold: String(prop).startsWith('closing'), 'minus-text': value < 0 }"
              >
                <span class="drill-value" :class="{ muted: !value }">
                  {{ value ? formatMoney(value) : '-' }}
                </span>
                <span class="chev-slot" aria-hidden="true"></span>
              </span>
            </template>

            <template #diff="{ prop, value }">
              <span v-if="!value" class="ok-text">✓</span>
              <span v-else class="danger-text">
                {{ prop === 'diffQty' ? formatInt(value) : formatMoney(value) }}
              </span>
            </template>
          </ArtTableGroup>
        </div>
      </ElCard>
    </div>

    <!-- 全表共用的三级下钻浮层：只在打开时挂 DOM，避免每格一个 popover 实例 -->
    <Teleport to="body">
      <div v-if="drillOpen" ref="drillPopperRef" class="flow-drill-pop" :style="drillPopperStyle">
        <div class="flow-drill-pop__title">{{ drillTitle }}</div>
        <div
          v-for="(item, idx) in drillItems"
          :key="idx"
          class="flow-drill-pop__row"
          :class="{ 'is-total': item.total }"
        >
          <span class="k">{{ item.label }}</span>
          <span v-if="item.percent !== undefined" class="p">{{ item.percent }}%</span>
          <span class="v" :class="{ 'minus-text': item.value < 0 }">
            {{ drillKind === 'qty' ? formatInt(item.value) : formatMoney(item.value) }}
          </span>
        </div>
      </div>
    </Teleport>

    <!-- ⑨ SKU 当日成本抽屉 + 跨板块拉起的批次台账 -->
    <SkuDayCostDrawer
      v-model:visible="skuDrawerVisible"
      :row-key="skuDrawerRowKey"
      @open-batch="openBatchLedger"
    />
    <BatchLedgerDrawer v-model:visible="batchDrawerVisible" :batch-id="batchDrawerId" />
  </div>
</template>

<script setup lang="ts">
  import {
    computed,
    defineAsyncComponent,
    h,
    nextTick,
    onBeforeUnmount,
    onMounted,
    ref,
    watch,
    type CSSProperties,
    type VNode
  } from 'vue'
  import { useRoute, useRouter } from 'vue-router'
  import { onClickOutside } from '@vueuse/core'
  import {
    ElAlert,
    ElButton,
    ElCard,
    ElIcon,
    ElInput,
    ElLink,
    ElMessage,
    ElOption,
    ElOptionGroup,
    ElRadioButton,
    ElRadioGroup,
    ElSelect,
    ElSpace,
    ElTag,
    ElTooltip
  } from 'element-plus'
  import { ArrowDown, ArrowRight, InfoFilled, Search } from '@element-plus/icons-vue'
  import dayjs from 'dayjs'
  import ArtSearchBar, {
    type SearchFormItem
  } from '@/components/core/forms/art-search-bar/index.vue'
  import ArtTableGroup from '@/components/core/tables/art-table-group/index.vue'
  import ArtTableHeaderGroup from '@/components/core/tables/art-table-header-group/index.vue'
  import CardItems from '@/components/core/charts-comp/card-setting-all/items.vue'
  import CardSetting from '@/components/core/charts-comp/card-setting-all/setting.vue'
  import PeriodWeekRangePicker from '@/components/core/others/period-week-range-picker/index.vue'
  import {
    buildDefaultLayout,
    type CardGroup,
    type CardMetric
  } from '@/components/core/charts-comp/types'
  import { useTable } from '@/composables/useTable'
  import {
    costFlowFilterOptions,
    skuCostFlowExport,
    skuCostFlowList,
    skuCostFlowSummary
  } from '@/api/inventory/sku-cost-flow'
  import MkCascadeSelect from '@/components/core/others/mk-cascade-select/index.vue'
  import {
    BIZ_IO_TREE,
    GEN_MODE_MAP,
    INV_ATTR_MAP,
    INV_ATTR_OPTIONS,
    PLATFORM_OPTIONS
  } from '../utils/dict'
  import { INVENTORY_DATE_SHORTCUTS, INVENTORY_MONTH_SHORTCUTS } from '../utils/date-shortcuts'
  import { formatByMeta, formatInt, formatMoney, formatPercent } from '../utils/format'
  import { buildFlowColumns } from './columns'
  import {
    canDrill,
    drillKindOf,
    drillParentLabel,
    getDrillRows,
    type DrillKind,
    type DrillRow
  } from './columns/drilldown'
  import { FIELD_LABEL, FIELD_META, FLOW_COLUMN_GROUPS } from './columns/shared'
  import { DEFAULT_TREND_METRICS, MAX_TREND_METRICS, TREND_OPTION_GROUPS } from './utils/trend'
  import type {
    CostFlowRow,
    FlowDim,
    FlowMeasure,
    FlowMetrics,
    FlowRow,
    FlowStatus
  } from './utils/types'

  defineOptions({ name: 'InventorySkuCostFlow' })

  const InvFlowExpand = defineAsyncComponent(() => import('./components/inv-flow-expand.vue'))
  const SkuDayCostDrawer = defineAsyncComponent(
    () => import('./components/sku-day-cost-drawer.vue')
  )
  const BatchLedgerDrawer = defineAsyncComponent(
    () => import('../batch-balance/components/batch-ledger-drawer.vue')
  )
  const InventoryFlowTrend = defineAsyncComponent(
    () => import('./components/inventory-flow-trend.vue')
  )

  const route = useRoute()
  const router = useRouter()
  const disabledFutureDate = (date: Date) => date.getTime() > dayjs().endOf('day').valueOf()

  /* ---------------- 维度 / 口径 ---------------- */

  const TABS: { name: FlowDim; label: string }[] = [
    { name: 'msku', label: 'MSKU' },
    { name: 'localSku', label: '本地SKU' },
    { name: 'asin', label: 'ASIN' },
    { name: 'warehouse', label: '仓库' },
    { name: 'store', label: '店铺' }
  ]
  const activeTab = ref<FlowDim>((route.query.dim as FlowDim) || 'msku')
  const routeMeasure = route.query.measure === 'cost' ? 'cost' : 'qty'
  const measure = ref<FlowMeasure>(routeMeasure)
  const exceptionType = ref('')

  /** 数量、成本口径各存一份列偏好；列结构改动后换名，避免旧偏好覆盖新默认 */
  const currentTableName = computed(() => `inventory-sku-cost-flow-${measure.value}-v4`)

  /* ---------------- 筛选 ---------------- */

  const KEYWORD_OPTIONS = [
    { label: 'MSKU', value: 'msku' },
    { label: '本地SKU', value: 'localSku' },
    { label: 'ASIN', value: 'asin' },
    { label: 'FNSKU', value: 'fnsku' },
    // 后五项落在两级展开上：主表行命中 = 它的库存流水 / 成本流水里有命中行
    { label: '批次号', value: 'batchNo' },
    { label: '业务编号', value: 'bizNo' },
    { label: '库存流水编号', value: 'invFlowNo' },
    { label: '成本流水编号', value: 'costFlowNo' },
    { label: '关联平台单据', value: 'platformDocNo' }
  ]

  const defaultSearchForm = () => ({
    companyId: 'C001',
    platform: 'FBA',
    storeIdList: [] as string[],
    siteList: [] as string[],
    warehouseCodeList: (route.query.warehouse ? [route.query.warehouse] : []) as string[],
    invAttr: '',
    dateGrain: 'day',
    invDateRange: [dayjs().subtract(6, 'day').format('YYYY-MM-DD'), dayjs().format('YYYY-MM-DD')],
    /** 二级出入库类型（叶子值）；勾一级即勾它全部二级 */
    ioTypeList: [] as string[],
    keyword: (route.query.msku || route.query.localSku || '') as string,
    keywordType: route.query.localSku ? 'localSku' : 'msku',
    genMode: '',
    hasException: ''
  })
  const searchForm = ref(defaultSearchForm())

  const storeOptions = ref<{ value: string; label: string }[]>([])
  const siteOptions = ref<{ value: string; label: string }[]>([])
  const warehouseOptions = ref<{ value: string; label: string; platform: string }[]>([])

  const searchItems = computed<SearchFormItem[]>(() => [
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
      key: 'platform',
      label: '',
      type: 'select',
      placeholder: '平台',
      width: '140px',
      props: {
        // 本期仅 SC-FBA 有数据，其余平台置灰
        options: PLATFORM_OPTIONS.map((p) => ({
          ...p,
          disabled: p.value !== '' && p.value !== 'FBA'
        })),
        placeholder: '平台',
        clearable: true
      }
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
      key: 'siteList',
      label: '',
      type: 'select',
      selectMultiple: true,
      placeholder: '站点',
      width: '130px',
      labelValue: { name: 'label', value: 'value' },
      props: { options: siteOptions.value, clearable: true }
    },
    {
      key: 'warehouseCodeList',
      label: '',
      type: 'select',
      selectMultiple: true,
      placeholder: '仓库',
      width: '180px',
      labelValue: { name: 'label', value: 'value' },
      props: { options: warehouseOptions.value, clearable: true }
    },
    {
      key: 'invAttr',
      label: '',
      type: 'select',
      placeholder: '库存属性',
      width: '120px',
      // 选「全部」时良品次品分行显示，不合并
      props: { options: INV_ATTR_OPTIONS, placeholder: '库存属性', clearable: true }
    },
    {
      key: 'invDateRange',
      label: '',
      type: 'daterange',
      width: '250px',
      compositeSearch: true,
      selectKey: 'dateGrain',
      selectWidth: '80px',
      inputType: 'daterange',
      pickerType: searchForm.value.dateGrain === 'month' ? 'monthrange' : 'daterange',
      selectOptions: [
        { label: '按日', value: 'day' },
        { label: '按周', value: 'week' },
        { label: '按月', value: 'month' }
      ],
      datePickerProps: {
        valueFormat: 'YYYY-MM-DD',
        format: searchForm.value.dateGrain === 'month' ? 'YYYY-MM' : 'YYYY-MM-DD',
        unlinkPanels: true,
        shortcuts:
          searchForm.value.dateGrain === 'month'
            ? INVENTORY_MONTH_SHORTCUTS
            : INVENTORY_DATE_SHORTCUTS,
        disabledDate: disabledFutureDate
      },
      placeholder: '开始日期,结束日期'
    },
    // 两级勾选：一级业务类型 + 二级出入库类型，绑定值是二级值，一级由 bizFilter 反推
    { key: 'ioTypeList', label: '', type: 'input', width: '190px' },
    { key: 'keyword', label: '', type: 'input', width: '280px' },
    {
      key: 'genMode',
      label: '',
      type: 'select',
      placeholder: '生成方式',
      width: '140px',
      overflow: true,
      props: {
        options: [
          { value: '', label: '全部' },
          { value: 'DETAIL', label: '报告明细' },
          { value: 'AGGREGATE', label: '报告聚合' },
          { value: 'SYSTEM_DIFF', label: '系统轧差' }
        ],
        placeholder: '生成方式',
        clearable: true
      }
    },
    {
      key: 'hasException',
      label: '',
      type: 'select',
      placeholder: '异常原因',
      width: '140px',
      overflow: true,
      props: {
        options: [
          { value: '', label: '全部' },
          { value: 'Y', label: '仅看异常原因非空' }
        ],
        placeholder: '异常原因',
        clearable: true
      }
    }
  ])

  /**
   * 二级勾选反推一级：主表列组只认一级，二级用于收窄库存流水明细。
   * 只勾了「首次签收」时，货件入库这一列组照常显示，展开面板里只剩首次签收的流水。
   */
  const bizFilter = computed(() => {
    const selected = searchForm.value.ioTypeList || []
    if (!selected.length) return []
    return BIZ_IO_TREE.filter((node) =>
      node.children.some((child) => selected.includes(child.value))
    ).map((node) => bizKeyOf(node.value))
  })

  /** 业务类型字典键 → 列组前缀 */
  function bizKeyOf(dictValue: string): string {
    const map: Record<string, string> = {
      RECEIPT: 'receipt',
      SALE_OUT: 'saleOut',
      SALE_RETURN: 'saleReturn',
      REMOVAL: 'removal',
      STOCKTAKE: 'stocktake',
      OTHER_ADJUST: 'otherAdjust'
    }
    return map[dictValue] || dictValue
  }

  /* ---------------- 指标卡 ---------------- */

  const FLOW_METRICS: CardMetric[] = [
    {
      key: 'openingAmount',
      label: '期初结存总成本',
      tooltip: '取筛选范围首日的期初结存成本；副指标按良品、次品展示成本与占比',
      defaultSelected: true
    },
    {
      key: 'closingAmount',
      label: '期末结存总成本',
      tooltip:
        '取筛选范围末日的期末结存成本，主值旁展示较期初变动；副指标按良品、次品展示成本与占比',
      defaultSelected: true
    },
    {
      key: 'openingQty',
      label: '期初结存数量',
      tooltip: '取筛选范围首日的期初结存件数；点击筛选初日有库存记录的 SKU',
      defaultSelected: true
    },
    {
      key: 'closingQty',
      label: '期末结存数量',
      tooltip: '取筛选范围末日的期末结存件数，主值旁展示较期初变动；点击筛选末日有库存记录的 SKU',
      defaultSelected: true
    },
    {
      key: 'inboundFlow',
      label: '本期入库流转',
      tooltip: '筛选范围内所有入库方向流水数量；副指标按良品、次品展示数量与占比',
      defaultSelected: true
    },
    {
      key: 'outboundFlow',
      label: '本期出库流转',
      tooltip: '筛选范围内所有出库方向流水数量；副指标按良品、次品展示数量与占比',
      defaultSelected: true
    },
    {
      key: 'reconciliationException',
      label: '对平异常',
      tooltip: '数量或金额勾稽不为零的主表记录；点击筛选仅看不平',
      defaultSelected: true
    }
  ]

  const cardGroups = computed<CardGroup[]>(() => [
    { key: 'flow', title: '库存与成本', max: 7, items: FLOW_METRICS }
  ])
  const cardLayout = ref(
    buildDefaultLayout([{ key: 'flow', title: '库存与成本', max: 7, items: FLOW_METRICS }])
  )

  const metrics = ref<FlowMetrics>({
    openingQty: 0,
    openingAmount: 0,
    openingPurchaseAmount: 0,
    openingLogisticsAmount: 0,
    openingGoodAmount: 0,
    openingDefectiveAmount: 0,
    openingGoodQty: 0,
    openingDefectiveQty: 0,
    closingQty: 0,
    closingAmount: 0,
    closingPurchaseAmount: 0,
    closingLogisticsAmount: 0,
    closingGoodAmount: 0,
    closingDefectiveAmount: 0,
    closingGoodQty: 0,
    closingDefectiveQty: 0,
    inboundFlowQty: 0,
    inboundFlowAmount: 0,
    inboundGoodQty: 0,
    inboundDefectiveQty: 0,
    receiptInboundQty: 0,
    receiptInboundAmount: 0,
    returnInboundQty: 0,
    returnInboundAmount: 0,
    adjustmentInboundQty: 0,
    adjustmentInboundAmount: 0,
    outboundFlowQty: 0,
    outboundFlowAmount: 0,
    outboundGoodQty: 0,
    outboundDefectiveQty: 0,
    saleOutboundQty: 0,
    saleOutboundAmount: 0,
    removalOutboundQty: 0,
    removalOutboundAmount: 0,
    adjustmentOutboundQty: 0,
    adjustmentOutboundAmount: 0,
    netChangeQty: 0,
    netChangeAmount: 0,
    goodNetChangeQty: 0,
    goodNetChangeAmount: 0,
    defectiveNetChangeQty: 0,
    defectiveNetChangeAmount: 0,
    diffQty: 0,
    diffAmount: 0
  })
  const totals = ref<Record<string, number>>({})
  const status = ref<FlowStatus>({
    dataDate: dayjs().format('YYYY-MM-DD'),
    eventSplitBalanced: true,
    batchBalanced: true,
    warehouseBalanced: true,
    unbalancedCount: 0,
    monthlyReconciled: false
  })

  const checkItems = computed(() => [
    { key: 'event', label: '事件分摊对平', ok: status.value.eventSplitBalanced },
    { key: 'batch', label: '单批次对平', ok: status.value.batchBalanced },
    { key: 'warehouse', label: '仓库汇总对平', ok: status.value.warehouseBalanced }
  ])
  const statusType = computed(() => (checkItems.value.every((item) => item.ok) ? 'info' : 'error'))

  const rateOf = (part: number, total: number) =>
    total ? (Math.abs(part) / Math.abs(total)) * 100 : 0
  const formatSignedQty = (value: number) => `${value > 0 ? '+' : ''}${formatInt(value)} 件`
  const formatSignedMoney = (value: number) => `${value > 0 ? '+' : ''}${formatMoney(value)}`
  const formatInventoryPeriod = (value: string) => {
    if (searchForm.value.dateGrain !== 'week') return value
    const start = dayjs(value)
    return `${start.format('YYYY-MM-DD')} ~ ${start.add(6, 'day').format('MM-DD')}`
  }
  const formatCompactMoney = (value: number, signed = false) =>
    `${signed && value > 0 ? '+' : value < 0 ? '-' : ''}$${Math.abs(value).toLocaleString('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    })}`

  const CLICKABLE_CARDS = [
    'openingAmount',
    'closingAmount',
    'openingQty',
    'closingQty',
    'inboundFlow',
    'outboundFlow',
    'reconciliationException'
  ]
  const flowCardFilter = ref('')
  const activeCardKey = ref('')
  const activeMetricFilterKeys = computed(() => {
    if (exceptionType.value === 'unbalanced') return ['reconciliationException']
    return activeCardKey.value ? [activeCardKey.value] : []
  })

  /** 趋势图折叠在指标卡里，默认收起，展开才挂载取数 */
  const trendOpen = ref(false)
  const trendMetricKeys = ref<string[]>([...DEFAULT_TREND_METRICS])

  const onTrendMetricChange = (keys: string[]) => {
    if (keys.length) return
    ElMessage.warning('趋势图至少保留 1 个指标')
    trendMetricKeys.value = [DEFAULT_TREND_METRICS[0]]
  }

  /* ---------------- 表格 ---------------- */

  const columnsFactory = computed(() =>
    buildFlowColumns({
      measure: measure.value,
      dim: activeTab.value,
      dateGrain: searchForm.value.dateGrain as 'day' | 'week' | 'month',
      bizFilter: bizFilter.value
    })
  )

  const tableRef = ref<{
    elTableRef?: { toggleRowExpansion: (row: unknown, expanded?: boolean) => void }
  }>()
  const expandedRowKeys = ref<string[]>([])

  const buildApiParams = (params: Record<string, any>, includeDetailFilter = true) => {
    const next = { ...params }
    if (next.dateGrain === 'month' && Array.isArray(next.invDateRange)) {
      next.invDateRange = [
        dayjs(next.invDateRange[0]).startOf('month').format('YYYY-MM-DD'),
        dayjs(next.invDateRange[1]).endOf('month').format('YYYY-MM-DD')
      ]
    }
    if (next.dateGrain === 'week' && Array.isArray(next.invDateRange)) {
      const start = dayjs(next.invDateRange[0])
      const end = dayjs(next.invDateRange[1])
      next.invDateRange = [
        start.subtract((start.day() + 6) % 7, 'day').format('YYYY-MM-DD'),
        end
          .subtract((end.day() + 6) % 7, 'day')
          .add(6, 'day')
          .format('YYYY-MM-DD')
      ]
    }
    return {
      ...next,
      dim: activeTab.value,
      exceptionType: includeDetailFilter ? exceptionType.value : '',
      flowCardFilter: includeDetailFilter ? flowCardFilter.value : ''
    }
  }

  /** 派生列：期初 / 期末 / 六类业务的总成本都在前端合成，接口只给采购与物流两段 */
  const mapRow = (row: any): FlowRow => {
    const sum = (a: number, b: number) => Math.round((a + b) * 100) / 100
    const mapped: Record<string, any> = {
      ...row,
      openingTotalAmount: sum(row.openingPurchaseAmount, row.openingLogisticsAmount),
      closingTotalAmount: sum(row.closingPurchaseAmount, row.closingLogisticsAmount)
    }
    ;['receipt', 'saleOut', 'saleReturn', 'removal', 'stocktake', 'otherAdjust'].forEach((biz) => {
      mapped[`${biz}TotalAmount`] = sum(row[`${biz}PurchaseAmount`], row[`${biz}LogisticsAmount`])
    })
    return mapped as FlowRow
  }

  const listApi = async (params: Record<string, any>) => {
    const res: any = await skuCostFlowList(buildApiParams(params))
    return {
      records: (res?.data?.records || []).map(mapRow) as FlowRow[],
      total: res?.data?.total || 0,
      current: res?.data?.current || params.currentPage,
      size: res?.data?.size || params.pageSize
    }
  }

  const exportHandler = (params: Record<string, any>) =>
    skuCostFlowExport({ ...buildApiParams(params), measure: measure.value })

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
      tableKey: 'inventory-sku-cost-flow',
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
        exceptionType.value = ''
      }
    }
  })

  /** 趋势只跟随已应用的业务筛选，不携带分页、排序和指标卡临时筛选 */
  const trendParams = computed(() => {
    const params = { ...(searchParams as Record<string, any>) }
    delete params.currentPage
    delete params.pageSize
    delete params.sortProp
    delete params.sortOrder
    delete params.flowCardFilter
    return params
  })

  /** 已应用（点过搜索）的二级出入库类型，展开面板按它收窄 */
  const appliedIoTypes = computed<string[]>(
    () => (searchParams as Record<string, any>).ioTypeList || []
  )

  const loadSummary = async () => {
    const res: any = await skuCostFlowSummary(buildApiParams({ ...searchForm.value }, false))
    const payload = res?.data
    if (!payload) return
    metrics.value = payload.metrics
    // 合计行同样要有前端合成的总成本列
    totals.value = mapRow(payload.totals) as unknown as Record<string, number>
    status.value = payload.status
  }

  /** 合计取全量汇总接口；期初期末取范围内首日 / 末日，不是逐行相加 */
  const summaryMethod = ({ columns: cols }: { columns: any[] }) => {
    return cols.map((col: any, index: number) => {
      // 首列是 1px 的隐藏展开列，「合计」得落在第一个看得见的列上
      if (index === 0) return ''
      if (index === 1) return '合计'
      const prop = col.property as string
      if (prop === 'operation') return ''
      if (!prop) return '-'
      if (prop === 'diffQty' || prop === 'diffAmount') {
        return totals.value[prop] ? formatByMeta(FIELD_META[prop], totals.value[prop]) : '✓'
      }
      if (!(prop in totals.value)) return '-'
      const text = formatByMeta(FIELD_META[prop], totals.value[prop])
      // 合计行与明细行同构：明细行留了箭头槽的列，合计行也得留，否则两行数字右边缘会错开
      const slot = columnsFactory.value.find((c: any) => c.prop === prop)?.slotName
      if (slot !== 'bizQty' && slot !== 'costDrill') return text
      return canDrill(totals.value, prop) ? summaryDrillCell(prop, text) : summaryStaticCell(text)
    })
  }

  /* ---------------- 三级下钻浮层 ---------------- */

  const DRILL_POP_WIDTH = 236
  const drillOpen = ref(false)
  const drillProp = ref('')
  const drillKind = ref<DrillKind>('qty')
  const drillItems = ref<DrillRow[]>([])
  const drillAnchorEl = ref<HTMLElement | null>(null)
  const drillPopperRef = ref<HTMLElement | null>(null)
  const drillPopperStyle = ref<CSSProperties>({})

  const drillTitle = computed(() => {
    const prop = drillProp.value
    if (!prop) return ''
    const parent = drillParentLabel(prop)
    const measureWord = drillKind.value === 'qty' ? '数量' : '总成本'
    return parent ? `${parent} · ${measureWord}` : FIELD_LABEL[prop] || prop
  })

  const closeDrill = () => {
    drillOpen.value = false
    drillAnchorEl.value = null
  }

  const openDrill = (row: Record<string, any>, prop: string, anchor: HTMLElement) => {
    if (drillOpen.value && drillAnchorEl.value === anchor) {
      closeDrill()
      return
    }
    const rect = anchor.getBoundingClientRect()
    drillProp.value = prop
    drillKind.value = drillKindOf(prop) || 'qty'
    drillItems.value = getDrillRows(row, prop)
    drillAnchorEl.value = anchor
    drillPopperStyle.value = {
      top: `${rect.bottom + 6}px`,
      left: `${Math.max(8, Math.min(rect.right - DRILL_POP_WIDTH, window.innerWidth - DRILL_POP_WIDTH - 8))}px`,
      width: `${DRILL_POP_WIDTH}px`
    }
    drillOpen.value = true
  }

  const onDrillClick = (row: Record<string, any>, prop: string, e: MouseEvent) => {
    e.stopPropagation()
    const el = e.currentTarget as HTMLElement | null
    if (el) openDrill(row, prop, el)
  }

  /**
   * 合计行只能返回 VNode，且由 ElTable 的 footer 渲染，scoped 样式透不进去，
   * 栅格只能写内联，否则合计值会比明细值右移一个箭头位
   */
  const SUMMARY_CELL_STYLE: CSSProperties = {
    display: 'inline-grid',
    gridTemplateColumns: 'auto 10px',
    columnGap: '4px',
    placeItems: 'center end',
    padding: '0',
    font: 'inherit',
    fontWeight: '700',
    color: 'inherit',
    background: 'none',
    border: '0'
  }

  const summaryDrillCell = (prop: string, text: string): VNode =>
    h(
      'button',
      {
        type: 'button',
        class: 'drill-cell is-summary',
        style: { ...SUMMARY_CELL_STYLE, cursor: 'pointer' },
        onClick: (e: MouseEvent) => {
          e.stopPropagation()
          const el = e.currentTarget as HTMLElement | null
          if (el) openDrill(totals.value, prop, el)
        }
      },
      [
        h('span', text),
        h('i', { class: 'el-icon', style: { fontSize: '10px', opacity: '0.55' } }, [h(ArrowDown)])
      ]
    )

  /** 不可下钻的列：留住箭头槽，保证与明细行右边缘对齐 */
  const summaryStaticCell = (text: string): VNode =>
    h('span', { style: SUMMARY_CELL_STYLE }, [
      h('span', text),
      h('span', { style: { width: '10px' } })
    ])

  // 点另一个 ▾ 时由 onDrillClick 接管开合，这里不能先关掉
  onClickOutside(drillPopperRef, (e) => {
    if ((e.target as HTMLElement | null)?.closest?.('.drill-cell')) return
    closeDrill()
  })

  // 表格横向滚动或换口径后浮层会脱锚，直接关掉
  watch([measure, activeTab], closeDrill)

  const rowClassName = ({ row }: { row: FlowRow }) => {
    const cls: string[] = []
    if (row.diffQty !== 0 || Math.abs(row.diffAmount) >= 0.01) cls.push('row-unbalanced')
    else if (row.exceptionReason) cls.push('row-warn')
    if (row.hasEstimated) cls.push('row-estimated')
    return cls.join(' ')
  }

  /* ---------------- 交互 ---------------- */

  const CARD_FILTER_MAP: Record<string, string> = {
    openingAmount: 'openingStock',
    openingQty: 'openingStock',
    closingAmount: 'closingStock',
    closingQty: 'closingStock',
    inboundFlow: 'inbound',
    outboundFlow: 'outbound'
  }

  const onCardClick = (metric: CardMetric) => {
    const isCancel = activeCardKey.value === metric.key
    activeCardKey.value = isCancel ? '' : metric.key
    flowCardFilter.value = isCancel ? '' : CARD_FILTER_MAP[metric.key] || ''
    exceptionType.value = !isCancel && metric.key === 'reconciliationException' ? 'unbalanced' : ''

    if (!isCancel) {
      if (metric.key.endsWith('Amount')) measure.value = 'cost'
      else if (
        metric.key.endsWith('Qty') ||
        metric.key === 'inboundFlow' ||
        metric.key === 'outboundFlow'
      )
        measure.value = 'qty'
    }

    Object.assign(searchParams, searchForm.value)
    if (pagination.currentPage !== 1) handleCurrentChange(1)
    else getData()
  }

  const handleSearch = () => {
    activeCardKey.value = ''
    flowCardFilter.value = ''
    Object.assign(searchParams, searchForm.value)
    getData()
    loadSummary()
  }
  const handleReset = async () => {
    activeCardKey.value = ''
    flowCardFilter.value = ''
    await resetTableSearch()
    loadSummary()
  }
  const handleRefresh = () => {
    refreshData()
    loadSummary()
  }

  const filterUnbalanced = (key: string) => {
    exceptionType.value = key === 'warehouse' || key === 'event' ? 'unbalanced' : 'estimated'
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

  const handleExpandChange = (row: FlowRow, expanded: boolean) => {
    expandedRowKeys.value = expanded
      ? [...new Set([...expandedRowKeys.value, row.rowKey])]
      : expandedRowKeys.value.filter((key) => key !== row.rowKey)
  }
  const handleCollapseRow = (row: FlowRow) => {
    expandedRowKeys.value = expandedRowKeys.value.filter((key) => key !== row.rowKey)
    nextTick(() => tableRef.value?.elTableRef?.toggleRowExpansion(row, false))
  }
  /** 操作列的「明细」：展开列已隐藏，展开收起都从这里走 */
  const toggleDetail = (row: FlowRow) => {
    if (expandedRowKeys.value.includes(row.rowKey)) {
      handleCollapseRow(row)
      return
    }
    expandedRowKeys.value = [...expandedRowKeys.value, row.rowKey]
    nextTick(() => tableRef.value?.elTableRef?.toggleRowExpansion(row, true))
  }

  const skuDrawerVisible = ref(false)
  const skuDrawerRowKey = ref<string>()
  const openSkuDrawer = (row: FlowRow) => {
    skuDrawerRowKey.value = row.rowKey
    skuDrawerVisible.value = true
  }

  /** 板块二 → 板块一的批次台账：在当前页拉起，关闭后回到原展开位置 */
  const batchDrawerVisible = ref(false)
  const batchDrawerId = ref<string>()
  const openBatchLedger = (row: CostFlowRow | { batchId: string }) => {
    batchDrawerId.value = row.batchId
    batchDrawerVisible.value = true
  }

  /* ---------------- 生命周期 ---------------- */

  /** 口径写进 URL，便于分享；切换不重新请求，只换列集 */
  watch(measure, (val) => {
    router.replace({ query: { ...route.query, measure: val } })
  })

  watch(activeTab, () => {
    expandedRowKeys.value = []
    const sp = searchParams as Record<string, unknown>
    sp.dim = activeTab.value
    if (pagination.currentPage !== 1) handleCurrentChange(1)
    else getData()
    loadSummary()
  })

  onMounted(async () => {
    // 浮层按点击时的坐标定位，页面或表格一滚就脱锚
    window.addEventListener('scroll', closeDrill, true)
    window.addEventListener('resize', closeDrill)
    const res: any = await costFlowFilterOptions()
    const options = res?.data
    if (options) {
      storeOptions.value = options.stores || []
      siteOptions.value = options.sites || []
      warehouseOptions.value = options.warehouses || []
    }
    loadSummary()
  })

  onBeforeUnmount(() => {
    window.removeEventListener('scroll', closeDrill, true)
    window.removeEventListener('resize', closeDrill)
  })
</script>

<style lang="scss" scoped>
  .sku-cost-flow-page {
    .flow-table-section {
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

    /* 维度切换：与数量/成本口径同高，放在工具条最前 */
    .dim-seg {
      :deep(.el-radio-button__inner) {
        padding: 5px 10px;
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

      .status-items {
        display: flex;
        gap: 12px;
        align-items: center;
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

      .metric-head-tools {
        display: flex;
        gap: 10px;
        align-items: center;
      }

      .metric-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--art-text-gray-800);
      }

      .trend-toggle {
        display: inline-flex;
        gap: 4px;
        align-items: center;
        height: 32px;
        padding: 0 10px;
        font-size: 12px;
        color: var(--art-text-gray-600);
        cursor: pointer;
        background: var(--el-fill-color-light);
        border: 1px solid var(--el-border-color-lighter);
        border-radius: 6px;
        transition: all 0.2s;

        &:hover,
        &.is-open {
          color: var(--el-color-primary);
          border-color: var(--el-color-primary);
        }

        .trend-arrow {
          font-size: 12px;
          transition: transform 0.18s;
        }

        &.is-open .trend-arrow {
          transform: rotate(180deg);
        }
      }

      .metric-value {
        font-size: 16px;
        font-weight: 650;
        line-height: 1.2;
        color: var(--art-text-gray-800);
      }

      :deep(.card-items .ci-flat-row) {
        flex-wrap: nowrap;
      }

      :deep(.card-items .ci-flat-row > .kpi-card) {
        flex: 1 1 0;
        max-width: none;
      }

      :deep(.card-items .ci-flat-row > .kpi-card:has(.metric-value-with-change)) {
        flex-grow: 1.7;
      }

      :deep(.card-items .kpi-card) {
        min-height: 112px;
        padding: 7px 8px;
      }

      .metric-value-with-change {
        display: flex;
        gap: 2px;
        align-items: flex-end;
        justify-content: space-between;
        width: 100%;
        min-width: 0;

        .metric-value {
          flex: 1 1 auto;
          min-width: 0;
          overflow: hidden;
          font-size: 16px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        .metric-change {
          flex: 0 0 auto;
          padding-bottom: 1px;
          font-size: 9px;
          font-style: normal;
          line-height: 1.2;
          color: var(--art-text-gray-500);
          white-space: nowrap;

          &.is-up {
            color: #16a34a;
          }

          &.is-down {
            color: #ef4444;
          }
        }
      }

      .metric-detail-grid {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        gap: 5px;

        &.is-stacked {
          grid-template-columns: minmax(0, 1fr);
          gap: 4px;
        }
      }

      .metric-detail-item {
        display: flex;
        flex-direction: column;
        min-width: 0;

        span,
        b,
        em {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        span {
          font-size: 9px;
          color: var(--art-text-gray-500);
        }

        b {
          font-size: 10px;
          font-weight: 600;
          color: var(--art-text-gray-800);
        }

        em {
          font-size: 9px;
          font-style: normal;
          color: var(--art-text-gray-500);
        }

        &.is-row {
          display: grid;
          grid-template-columns: auto minmax(0, 1fr) auto;
          gap: 2px;
          align-items: center;

          b,
          em {
            text-align: right;
          }
        }
      }

      .metric-dot {
        display: inline-block;
        width: 6px;
        height: 6px;
        margin-right: 3px;
        vertical-align: 1px;
        background: #94a3b8;
        border-radius: 50%;

        &.purchase,
        &.good,
        &.receipt,
        &.return {
          background: #22c55e;
        }

        &.logistics,
        &.sale {
          background: #5b8ff9;
        }

        &.defective,
        &.adjust,
        &.removal {
          background: #f59e0b;
        }

        &.danger {
          background: #ef4444;
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

      /* 期末等强调列：表头 / 单元格 / 合计行统一加粗 */
      th.el-table__cell.is-emphasis-column .cell,
      td.el-table__cell.is-emphasis-column .cell,
      td.el-table__cell.is-emphasis-column .drill-value {
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

    :global(.inventory-week-range) {
      display: flex;
      width: 100%;

      .el-select .el-select__wrapper {
        border-radius: var(--el-border-radius-base) 0 0 var(--el-border-radius-base);
      }
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

    .muted {
      color: var(--art-text-gray-400);
    }

    .bold {
      font-weight: 700;
    }

    .ok-text {
      color: var(--art-text-gray-400);
    }

    .minus-text {
      color: var(--el-color-danger);
    }

    .danger-text {
      color: var(--el-color-danger);
    }

    .tip-icon {
      margin-left: 2px;
      color: var(--art-text-gray-400);
    }

    :deep(.el-table__row.row-unbalanced td) {
      background: rgb(255 77 79 / 6%);
    }

    :deep(.el-table__row.row-warn td) {
      background: rgb(255 174 31 / 8%);
    }

    :deep(.el-table__row.row-estimated .cell) {
      font-style: italic;
    }

    /* 展开列压成 1px 的隐形列：展开行内容仍由它渲染，箭头交给操作列 */
    :deep(.inv-expand-col) {
      padding: 0 !important;
      border-right: none !important;

      .cell {
        padding: 0 !important;
      }

      .el-table__expand-icon {
        display: none;
      }
    }

    .op-cell {
      display: flex;
      gap: 10px;
      align-items: center;

      /* 只剩一个箭头，撑出点热区免得难点 */
      .op-toggle {
        padding: 0 2px;
      }

      .op-arrow {
        font-size: 13px;
        transition: transform 0.2s;

        &.is-expanded {
          transform: rotate(90deg);
        }
      }
    }

    /* 数值 + ▾ 用等宽栅格：有无箭头的单元格数字右边缘必须落在同一条线上 */
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
  }

  /* 指标设置弹层渲染在 body 下，样式不能嵌在页面作用域里 */
  .trend-metric-setting {
    .tms-head {
      display: flex;
      gap: 6px;
      align-items: baseline;
      margin-bottom: 6px;
    }

    .tms-title {
      font-size: 12px;
      font-weight: 600;
      color: var(--art-text-gray-800);
    }

    .tms-tip {
      font-size: 11px;
      color: var(--art-text-gray-500);
    }

    :deep(.el-select) {
      width: 100%;
    }
  }

  /* 浮层挂在 body 上，不能写进页面作用域 */
  .flow-drill-pop {
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
