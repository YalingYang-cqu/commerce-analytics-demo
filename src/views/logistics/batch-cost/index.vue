<template>
  <div class="batch-cost-page art-full-height" v-auth="'logistics:batchCost:view'">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :showSearch="false"
      @reset="resetSearchParams"
      @search="handleSearch"
    >
      <template v-if="isCustomPeriodDatePicker" #dateSearchValue="{ modelValue: form }">
        <div class="composite-search-wrapper composite-period-date">
          <ElSelect
            v-model="form.dateSearchType"
            :style="{ width: '120px' }"
            size="small"
            placeholder="请选择"
          >
            <ElOption label="出货时间" value="shipTime" />
          </ElSelect>
          <PeriodWeekRangePicker
            v-if="searchForm.period === 'week'"
            v-model="form.dateSearchValue"
            :start-placeholder="periodDatePlaceholders[0]"
            :end-placeholder="periodDatePlaceholders[1]"
            :date-picker-props="periodDatePickerConfig.datePickerProps"
            :max-range="currentMaxRange"
            @change="handlePeriodDateChange"
          />
          <PeriodQuarterRangePicker
            v-else-if="searchForm.period === 'quarter'"
            v-model="form.dateSearchValue"
            :start-placeholder="periodDatePlaceholders[0]"
            :end-placeholder="periodDatePlaceholders[1]"
            :max-range="currentMaxRange"
            @change="handlePeriodDateChange"
          />
        </div>
      </template>
    </ArtSearchBar>

    <!-- 表格头部工具栏 -->
    <ArtTableHeader
      v-model:columns="columnChecks"
      :loading="loading"
      layout="refresh,down,columnsNew"
      tableName="logistics-batch-cost"
      @refresh="refreshData"
      :updateColumn="updateColumn"
      :resetColumns="resetColumns"
      :exportApi="logisticsCostExportHandler"
      :exportParams="searchParams"
      :asyncExport="true"
      exportAuth="logistics:batchCost:export"
    >
      <template #left>
        <div class="toolbar-left">
          <ElSpace>
            <span class="sub-title"><i class="iconfont-custom">&#xe629;</i>维度</span>
            <ElRadioGroup v-model="searchForm.dimension" size="small">
              <ElRadioButton value="sku">SKU</ElRadioButton>
              <ElRadioButton value="spu">SPU</ElRadioButton>
            </ElRadioGroup>
          </ElSpace>
          <ElSpace>
            <span class="sub-title"><i class="iconfont-custom">&#xe609;</i>指标</span>
            <ElRadioGroup v-model="searchForm.metric" size="small" class="toolbar-metric">
              <ElRadioButton value="unitCost">
                <TableHeaderTip label="单个头程成本" tip="头程总成本 ÷ 发货数量" />
              </ElRadioButton>
              <ElRadioButton value="quantity">
                <TableHeaderTip label="发货数量" tip="选定周期内发货总件数" />
              </ElRadioButton>
              <ElRadioButton value="totalPrice">
                <TableHeaderTip label="头程总成本" tip="选定周期内头程总成本（含运费、税费等）" />
              </ElRadioButton>
            </ElRadioGroup>
          </ElSpace>
          <ElSpace>
            <span class="sub-title"><i class="iconfont-custom">&#xe89e;</i>周期</span>
            <ElRadioGroup v-model="searchForm.period" size="small" class="toolbar-period">
              <ElRadioButton v-for="item in PERIOD_OPTIONS" :key="item.value" :value="item.value">
                {{ item.label }}
              </ElRadioButton>
            </ElRadioGroup>
          </ElSpace>
          <ElSpace>
            <span class="sub-title"><i class="iconfont-custom">&#xe625;</i>显示</span>
            <span class="range-section">
              <ElSwitch
                :model-value="showRingRatio"
                @update:model-value="handleRingRatioChange"
                size="small"
                active-text="环比"
                inactive-text="环比"
              />
              <TableHeaderTip label="" tip="自动跳过空值周期，取上一个有效数据周期进行计算" />
            </span>
          </ElSpace>
        </div>
      </template>
    </ArtTableHeader>

    <ElCard shadow="never" class="art-table-card">
      <ElAlert
        class="cost-tip-alert"
        type="warning"
        :closable="false"
        show-icon
        title="头程成本按物流出货时间统计，优先展示实际成本；实际成本暂未核算完时，暂采用预估成本展示。"
      />

      <ArtTable
        ref="tableRef"
        :loading="loading"
        :data="data"
        row-key="id"
        :border="false"
        :columns="columns"
        :columnChecks="columnChecks"
        :pagination="pagination"
        :expand-row-keys="expandedRowKeys"
        tableKey="logistics-batch-cost"
        class="batch-cost-table"
        :row-class-name="getExpandRowClassName"
        @expand-change="handleExpandChange"
        @sort-change="handleSortChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <template #expand="{ row }">
          <BatchCostExpandPanel
            v-if="expandedRowKeys.includes(row.id)"
            :product-row="row"
            :dimension="searchForm.dimension"
            :channel-options="channelOptions"
            :status-options="transportStatusOptions"
            :date-range="detailDateRange"
            @collapse="handleCollapseRow"
          />
        </template>
        <!-- 图片 -->
        <template #image="{ row }">
          <ElImage
            v-if="row.imageUrl"
            :src="row.imageUrl"
            fit="cover"
            style="width: 48px; height: 48px; border-radius: 4px"
            :preview-src-list="[row.imageUrl]"
            :preview-teleported="true"
          />
          <div v-else class="image-placeholder">
            <ElIcon><Picture /></ElIcon>
          </div>
        </template>

        <!-- SKU / SPU -->
        <template #productCode="{ row }">
          <span class="product-code">{{ searchForm.dimension === 'sku' ? row.sku : row.spu }}</span>
          <span class="grey-font">{{
            searchForm.dimension === 'sku' ? (row.skuName ?? '-') : (row.spuName ?? '-')
          }}</span>
        </template>

        <!-- 物流负责人 -->
        <template #logisticsManager="{ row }">
          <span>{{ row.logisticsManager }}</span>
        </template>

        <!-- 最新头程成本 -->
        <template #latestCost="{ row }">
          <div class="latest-cost-cell">
            <div class="latest-cost-grid">
              <template v-for="(item, idx) in row.latestCosts" :key="idx">
                <span :class="getChannelTagClass(idx, item.channelName)">{{
                  item.channelName
                }}</span>
                <span class="price">
                  ¥{{ item?.price ?? '-'
                  }}<span class="price-estimate-tag" v-if="item.costType === 'estimate'"
                    >(预估)</span
                  >
                </span>
                <span class="change" :class="getChangeStateClass(item.change)">
                  <template v-if="isChangeFlat(item.change)">—</template>
                  <template v-else>
                    <span class="arrow">{{ item.change > 0 ? '↑' : '↓' }}</span>
                    {{ formatChange(item.change) }}
                  </template>
                </span>
                <span class="date">{{ item.changeDate }}</span>
              </template>
            </div>
            <ElLink
              type="primary"
              :underline="false"
              class="history-link"
              @click="openPriceHistory(row)"
            >
              查看完整价格历史
              <ElIcon class="link-arrow"><ArrowRight /></ElIcon>
            </ElLink>
          </div>
        </template>

        <!-- 趋势分析 -->
        <template #trend="{ row }">
          <div class="trend-cell">
            <CostTrendMiniChart :data="row.trendData" :metric="searchForm.metric" />
            <ElLink
              type="primary"
              :underline="false"
              class="trend-detail-link"
              @click="openTrendDetail(row)"
            >
              详情
              <ElIcon class="link-arrow"><ArrowRight /></ElIcon>
            </ElLink>
          </div>
        </template>

        <!-- 成本明细 - 分批次明细入口 -->
        <template #batchDetail="{ row }">
          <ElLink
            type="primary"
            :underline="false"
            class="batch-detail-link"
            @click="handleBatchDetail(row)"
          >
            分批次明细
            <ElIcon
              class="batch-detail-arrow"
              :class="{ 'is-expanded': expandedRowKeys.includes(row.id) }"
            >
              <ArrowRight />
            </ElIcon>
          </ElLink>
        </template>

        <!-- 成本明细 - 动态周期列 -->
        <template #periodCell="{ row, prop }">
          <PeriodCostCell
            :cell="getPeriodCell(row, prop)"
            :metric="searchForm.metric"
            :show-ring-ratio="showRingRatio"
          />
        </template>
      </ArtTable>
    </ElCard>

    <PriceHistoryDrawer
      v-model:visible="priceHistoryVisible"
      :product-row="priceHistoryRow"
      :dimension="searchForm.dimension"
    />

    <CostTrendDetailDialog
      v-model:visible="trendDetailVisible"
      :product-row="trendDetailRow"
      :dimension="searchForm.dimension"
      :period="trendDetailQuery.period"
      :ship-time-start="trendDetailQuery.shipTimeStart"
      :ship-time-end="trendDetailQuery.shipTimeEnd"
    />
  </div>
</template>

<script setup lang="ts">
  import {
    computed,
    ref,
    reactive,
    watch,
    onMounted,
    nextTick,
    defineComponent,
    defineAsyncComponent,
    h
  } from 'vue'
  import dayjs from 'dayjs'
  import { ArrowRight, Picture } from '@element-plus/icons-vue'
  import {
    ElAlert,
    ElCard,
    ElIcon,
    ElImage,
    ElLink,
    ElOption,
    ElRadioButton,
    ElRadioGroup,
    ElSelect,
    ElSwitch
  } from 'element-plus'
  import PeriodQuarterRangePicker from '@/components/core/others/period-quarter-range-picker/index.vue'
  import PeriodWeekRangePicker from '@/components/core/others/period-week-range-picker/index.vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import TableHeaderTip from '@/components/core/tables/table-header-tip/index.vue'
  import { useTable } from '@/composables/useTable'
  import { pubWarehouseList } from '@/utils'
  import CostTrendMiniChart from './components/cost-trend-mini-chart.vue'
  import PriceHistoryDrawer from './components/price-history-drawer.vue'
  import CostTrendDetailDialog from './components/cost-trend-detail-dialog.vue'

  const BatchCostExpandPanel = defineAsyncComponent(
    () => import('./components/batch-cost-expand-panel.vue')
  )
  import {
    formatMetricValue,
    type BatchCostRow,
    type DimensionType,
    type MetricType,
    type PeriodCell
  } from './utils/mock-data'
  import {
    apiDateRangeToIsoDates,
    formatDateSearchApiValue,
    getDefaultDateSearchValue,
    getPeriodDatePickerConfig,
    getPeriodDateSearchPlaceholder,
    getPeriodLabelsFromDateSearch,
    PERIOD_OPTIONS,
    type PeriodType
  } from './utils/period'
  import { getChannelTagClass } from './utils/channel-tag'
  import {
    logisticsCostExport,
    logisticsCostFilterOptions,
    logisticsCostPageList
  } from '@/api/logistics/batch-cost'

  defineOptions({ name: 'LogisticsBatchCost' })

  interface SelectOption {
    value: string | number
    label: string
    data?: Record<string, any>
  }

  /** 物流运输状态（与物流运单 transportStatusList 一致） */
  const TRANSPORT_STATUS_MAP: Record<string, string> = {
    已发货: '已发货',
    已到达: '已到达',
    待签收: '待签收',
    已签收: '已签收'
  }

  const transportStatusOptions = computed<SelectOption[]>(() =>
    Object.entries(TRANSPORT_STATUS_MAP).map(([value, label]) => ({ label, value }))
  )

  const providerOptions = ref<SelectOption[]>([])
  const channelOptions = ref<SelectOption[]>([])
  const transportPlanOptions = ref<SelectOption[]>([])
  const userList = ref<SelectOption[]>([])
  const warehouseList = ref<SelectOption[]>([])
  const isFrontendMode = import.meta.env.VITE_ACCESS_MODE === 'frontend'

  const defaultSearchForm = () => {
    const period = 'month' as PeriodType
    return {
      searchType: 'skuCode',
      searchValue: '',
      dateSearchType: 'shipTime',
      dateSearchValue: getDefaultDateSearchValue(period, 7),
      logisticsProviderIdList: [] as number[],
      logisticsChannelIdList: [] as number[],
      transportPlanIdList: [] as number[],
      logisticsManagerIdList: [] as (string | number)[],
      transportStatusList: [] as string[],
      sourceWarehouseIdList: [] as (string | number)[],
      destWarehouseIdList: [] as (string | number)[],
      /** 统计维度：sku | spu */
      dimension: 'sku' as DimensionType,
      /** 指标：单个头程成本 | 发货数量 | 头程总成本 */
      metric: 'unitCost' as MetricType,
      /** 统计周期 */
      period
    }
  }

  /** 加载筛选项（与物流运单一致） */
  const loadFilterOptions = async () => {
    try {
      const costOptions = await logisticsCostFilterOptions()
      const costData = (costOptions as any)?.data || {}
      if (Array.isArray(costData.logisticsManagers)) {
        userList.value = costData.logisticsManagers.map((item: any) => ({
          label: item.name,
          value: item.name
        }))
      }
      if (Array.isArray(costData.logisticsChannels)) {
        channelOptions.value = costData.logisticsChannels.map((item: any) => ({
          label: item.name,
          value: item.name
        }))
      }
      providerOptions.value = []
      transportPlanOptions.value = []
    } catch (error) {
      console.error('加载物流筛选项失败:', error)
    }
  }

  onMounted(async () => {
    if (isFrontendMode) {
      await loadFilterOptions()
      warehouseList.value = []
      return
    }
    const [warehouseRes] = await Promise.allSettled([pubWarehouseList(), loadFilterOptions()])
    warehouseList.value = warehouseRes.status === 'fulfilled' ? warehouseRes.value : []
  })

  /** 成本明细单元格 */
  const PeriodCostCell = defineComponent({
    name: 'PeriodCostCell',
    props: {
      cell: { type: Object as () => PeriodCell | null, default: null },
      metric: { type: String as () => MetricType, default: 'unitCost' },
      showRingRatio: { type: Boolean, default: true }
    },
    setup(props) {
      return () => {
        const cell = props.cell
        if (!cell?.value && cell?.value !== 0) {
          return h('span', { class: 'period-empty' }, '—')
        }
        const children = [
          h('div', { class: 'period-value' }, formatMetricValue(cell.value, props.metric))
        ]
        if (props.showRingRatio && cell.ringRatio !== null && cell.ringRatio !== undefined) {
          const isUp = cell.ringRatio >= 0
          children.push(
            h('div', { class: ['period-ratio', isUp ? 'is-up' : 'is-down'] }, [
              h('i', {
                class: 'iconfont-custom arrow-icon',
                innerHTML: isUp ? '&#xe608;' : '&#xe60b;'
              }),
              `${Math.abs(cell.ringRatio)}%`
            ])
          )
        }
        return h('div', { class: 'period-cell' }, children)
      }
    }
  })

  const showRingRatio = ref(false)
  const handleRingRatioChange = (value: boolean | string | number) => {
    showRingRatio.value = Boolean(value)
  }
  const tableRef = ref<{
    elTableRef?: { toggleRowExpansion: (row: unknown, expanded?: boolean) => void }
  }>()
  /** 已展开行 id，支持多行同时展开（非手风琴） */
  const expandedRowKeys = ref<string[]>([])

  const priceHistoryVisible = ref(false)
  const priceHistoryRow = ref<BatchCostRow | null>(null)

  const openPriceHistory = (row: BatchCostRow) => {
    priceHistoryRow.value = row
    priceHistoryVisible.value = true
  }

  const trendDetailVisible = ref(false)
  const trendDetailRow = ref<BatchCostRow | null>(null)

  const openTrendDetail = (row: BatchCostRow) => {
    trendDetailRow.value = row
    trendDetailVisible.value = true
  }
  function formatChange(change: number) {
    return Math.abs(change)
  }

  /** 最新头程成本-涨跌幅：0 或 null/undefined 视为持平 */
  const isChangeFlat = (change: number | null | undefined) => {
    return change == null || change === 0
  }
  const getChangeStateClass = (change: number | null | undefined) => {
    if (isChangeFlat(change)) return 'is-flat'
    return (change as number) > 0 ? 'is-up' : 'is-down'
  }
  const searchForm = reactive(defaultSearchForm())

  /** 出货时间最大搜索跨度（含起点的周期格子数）：年不限制 */
  const MAX_RANGE_BY_PERIOD: Record<PeriodType, number> = {
    day: 30,
    week: 16,
    month: 12,
    quarter: 8,
    year: 0
  }

  /** 标准日期选择器（日/月/年）按周期对应的 dayjs 跨度单位 */
  const STANDARD_PERIOD_UNIT: Partial<Record<PeriodType, 'day' | 'month' | 'year'>> = {
    day: 'day',
    month: 'month',
    year: 'year'
  }

  const currentMaxRange = computed(() => MAX_RANGE_BY_PERIOD[searchForm.period] ?? 0)

  /** 标准选择器选定起点后的锚点（用于超范围置灰） */
  const rangePickStart = ref<Date | null>(null)

  /** 距锚点超出最大跨度的日期置灰；max=0 或无锚点时不限制 */
  const standardDisabledDate = (time: Date) => {
    const max = currentMaxRange.value
    const unit = STANDARD_PERIOD_UNIT[searchForm.period]
    if (!max || !unit || !rangePickStart.value) return false
    const diff = Math.abs(dayjs(time).diff(dayjs(rangePickStart.value), unit))
    return diff > max - 1
  }

  /** 选中第一个端点时记录锚点，选满或清空时重置 */
  const handleRangeCalendarChange = (val: [Date, Date | null] | null) => {
    rangePickStart.value = val?.[0] && !val?.[1] ? val[0] : null
  }

  /** 面板关闭时重置锚点，避免下次打开沿用旧锚点 */
  const handleRangeVisibleChange = (visible: boolean) => {
    if (!visible) rangePickStart.value = null
  }

  const periodDatePickerConfig = computed(() => {
    const base = getPeriodDatePickerConfig(searchForm.period)
    // 周/季度走自定义选择器，置灰由其自身 maxRange 处理
    if (!STANDARD_PERIOD_UNIT[searchForm.period]) return base
    return {
      ...base,
      datePickerProps: {
        ...base.datePickerProps,
        disabledDate: standardDisabledDate,
        onCalendarChange: handleRangeCalendarChange,
        onVisibleChange: handleRangeVisibleChange
      }
    }
  })

  const isCustomPeriodDatePicker = computed(() => ['week', 'quarter'].includes(searchForm.period))

  const periodDatePlaceholders = computed(() => {
    const parts = getPeriodDateSearchPlaceholder(searchForm.period).split(',')
    return [parts[0] || '开始', parts[1] || '结束']
  })

  // 搜索项配置（参照物流运单）
  const searchItems = computed(() => [
    {
      key: 'searchValue',
      label: '',
      compositeSearch: true,
      selectOptions: [
        // { label: '物流运单号', value: 'trackingNo' },
        // { label: '采购订单号', value: 'purchaseOrderNo' },
        { label: 'SKU', value: 'skuCode' },
        { label: '中文品名', value: 'skuName' },
        { label: 'SPU', value: 'spuCode' },
        { label: '中文款名', value: 'spuName' }
        // { label: '货件号', value: 'shipmentNo' }
      ],
      selectKey: 'searchType',
      selectWidth: '120px',
      inputType: 'input',
      placeholder: '搜索内容',
      width: '280px'
    },
    {
      key: 'dateSearchValue',
      label: '',
      compositeSearch: true,
      selectOptions: [
        { label: '出货时间', value: 'shipTime' }
        // { label: '创建时间', value: 'createTime' },
        // { label: '最近更新时间', value: 'updateTime' },
        // { label: '接单时间', value: 'orderReceiveTime' },
        // { label: '期望交货时间', value: 'expectDeliveryDate' }
      ],
      selectKey: 'dateSearchType',
      selectWidth: '120px',
      inputType: periodDatePickerConfig.value.inputType,
      placeholder: getPeriodDateSearchPlaceholder(searchForm.period),
      width: '320px',
      datePickerProps: periodDatePickerConfig.value.datePickerProps
    },
    // {
    //   key: 'logisticsProviderIdList',
    //   label: '',
    //   type: 'select',
    //   placeholder: '物流商',
    //   width: '150px',
    //   selectMultiple: true,
    //   alwaysFilterInput: true,
    //   props: {
    //     options: providerOptions.value,
    //     clearable: true,
    //     filterable: true,
    //     placeholder: '物流商'
    //   }
    // },
    // {
    //   key: 'logisticsChannelIdList',
    //   label: '',
    //   type: 'select',
    //   placeholder: '物流渠道',
    //   width: '150px',
    //   selectMultiple: true,
    //   alwaysFilterInput: true,
    //   props: {
    //     options: channelOptions.value,
    //     clearable: true,
    //     filterable: true,
    //     placeholder: '物流渠道'
    //   }
    // },
    // {
    //   key: 'transportPlanIdList',
    //   label: '',
    //   type: 'select',
    //   placeholder: '物流方案',
    //   width: '150px',
    //   selectMultiple: true,
    //   alwaysFilterInput: true,
    //   props: {
    //     options: transportPlanOptions.value,
    //     clearable: true,
    //     filterable: true,
    //     placeholder: '物流方案'
    //   }
    // },
    {
      key: 'logisticsManagerIdList',
      label: '',
      type: 'select',
      selectMultiple: true,
      placeholder: '物流负责人',
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      props: {
        options: userList.value,
        clearable: true
      }
    }
    // {
    //   key: 'transportStatusList',
    //   label: '',
    //   type: 'select',
    //   placeholder: '物流状态',
    //   width: '150px',
    //   selectMultiple: true,
    //   alwaysFilterInput: true,
    //   props: {
    //     options: transportStatusOptions.value,
    //     clearable: true,
    //     filterable: true,
    //     placeholder: '物流状态'
    //   }
    // },
    // {
    //   key: 'sourceWarehouseIdList',
    //   label: '',
    //   type: 'select',
    //   selectMultiple: true,
    //   placeholder: '调出仓库',
    //   width: '150px',
    //   alwaysFilterInput: true,
    //   labelValue: { name: 'label', value: 'value' },
    //   props: {
    //     options: warehouseList.value?.filter((v: SelectOption) => v.data?.warehouseType === 1) ?? [],
    //     clearable: true
    //   }
    // },
    // {
    //   key: 'destWarehouseIdList',
    //   label: '',
    //   type: 'select',
    //   selectMultiple: true,
    //   placeholder: '调入仓库',
    //   width: '150px',
    //   alwaysFilterInput: true,
    //   labelValue: { name: 'label', value: 'value' },
    //   props: {
    //     options:
    //       warehouseList.value?.filter((v: SelectOption) => [2, 3].includes(v.data?.warehouseType)) ??
    //       [],
    //     clearable: true
    //   }
    // }
  ])

  const periodLabels = computed(() =>
    getPeriodLabelsFromDateSearch(
      searchForm.period,
      searchForm.dateSearchType,
      searchForm.dateSearchValue
    )
  )

  const detailDateRange = computed<[string, string] | undefined>(() => {
    if (searchForm.dateSearchType !== 'shipTime') return undefined
    const [startRaw, endRaw] = searchForm.dateSearchValue
    if (!startRaw || !endRaw) return undefined
    const start = formatDateSearchApiValue(startRaw, searchForm.period)
    const end = formatDateSearchApiValue(endRaw, searchForm.period)
    const [from, to] = apiDateRangeToIsoDates(start, end, searchForm.period)
    return from && to ? [from, to] : [startRaw, endRaw]
  })

  /** 趋势分析弹窗的查询参数：与页面查询的 period / shipTimeStart / shipTimeEnd 保持一致 */
  const trendDetailQuery = computed(() => {
    const period = searchForm.period
    const isShipTime = searchForm.dateSearchType === 'shipTime'
    const [startRaw, endRaw] = searchForm.dateSearchValue || []
    return {
      period,
      shipTimeStart: isShipTime && startRaw ? formatDateSearchApiValue(startRaw, period) : null,
      shipTimeEnd: isShipTime && endRaw ? formatDateSearchApiValue(endRaw, period) : null
    }
  })

  const periodColumnProp = (label: string) => `period__${label.replace(/[^a-zA-Z0-9]/g, '_')}`

  const parsePeriodLabelFromProp = (prop?: string): string => {
    if (!prop?.startsWith('period__')) return ''
    const encoded = prop.slice('period__'.length)
    const matched = periodLabels.value.find((l) => l.replace(/[^a-zA-Z0-9]/g, '_') === encoded)
    return matched ?? ''
  }

  const getPeriodCell = (row: BatchCostRow, prop?: string): PeriodCell | null => {
    const label = parsePeriodLabelFromProp(prop)
    if (!label) return null
    return row.periodDetails[label] ?? null
  }

  const columnsFactory = computed(() => {
    const periodChildren = periodLabels.value.map((label) => ({
      prop: periodColumnProp(label),
      label,
      minWidth: 100,
      align: 'center',
      useSlot: true,
      slotName: 'periodCell'
    }))

    return [
      {
        type: 'expand',
        width: 1,
        fixed: 'left',
        className: 'batch-cost-expand-col'
      },
      {
        prop: 'image',
        label: '图片',
        width: 72,
        fixed: 'left',
        useSlot: true
      },
      {
        prop: 'productCode',
        label: searchForm.dimension === 'sku' ? 'SKU' : 'SPU',
        minWidth: 100,
        fixed: 'left',
        useSlot: true
      },
      {
        prop: 'logisticsManager',
        label: '物流负责人',
        minWidth: 100,
        useSlot: true
      },
      {
        prop: 'latestCostPrice',
        label: '最新头程成本',
        minWidth: 320,
        useSlot: true,
        slotName: 'latestCost',
        sortable: 'custom'
      },
      {
        prop: 'trend',
        label: '趋势分析',
        minWidth: 160,
        useSlot: true,
        align: 'center'
      },
      {
        prop: 'batchDetail',
        label: '成本明细',
        align: 'center',
        useSlot: true,
        minWidth: 120
      },
      ...periodChildren
    ]
  })

  interface ApiPeriodDetail {
    label: string
    value: number | null
    ringRatio: number | null
  }
  interface ApiLatestCost {
    channelName: string
    price: number
    change: number | null
    changeDate: string
  }
  interface ApiRecord {
    id: string
    imageUrl: string
    sku: string
    spu: string
    skuName?: string
    spuName?: string
    logisticsManager: string
    latestCosts: ApiLatestCost[]
    periodDetails: ApiPeriodDetail[]
  }

  const mapMetricToApi = (metric: MetricType) => {
    if (metric === 'unitCost') return 'unitLogisticsCost'
    if (metric === 'totalPrice') return 'totalLogisticsCost'
    return metric
  }

  const mapApiRow = (api: ApiRecord): BatchCostRow => {
    const periodDetails: Record<string, PeriodCell> = {}
    const sortedDetails = [...(api.periodDetails ?? [])].sort((a, b) =>
      a.label.localeCompare(b.label)
    )
    sortedDetails.forEach((d) => {
      periodDetails[d.label] = { value: d.value, ringRatio: d.ringRatio }
    })
    const latestCosts = (api.latestCosts ?? []).map((c) => ({
      channelName: c.channelName,
      price: c.price,
      change: Number(c.change ?? 0),
      changeDate: c.changeDate,
      costType: c.costType
    }))
    const prices = latestCosts.map((c) => c.price)
    return {
      ...api,
      id: api.id,
      imageUrl: api.imageUrl ?? '',
      sku: api.sku ?? '',
      spu: api.spu ?? '',
      logisticsManager: api.logisticsManager ?? '',
      latestCostPrice: prices.length ? Math.min(...prices) : 0,
      latestCosts,
      trendData: sortedDetails.map((d) => ({ label: d.label, value: d.value })),
      periodDetails
    }
  }

  const fetchCostOverview = async (params: Record<string, any>) => {
    const current = Number(params.currentPage ?? params.current ?? params.page ?? 1)
    const size = Number(params.pageSize ?? params.size ?? 20)
    const res: any = await logisticsCostPageList(params)
    const records = (res.data.records ?? []).map(mapApiRow)
    return {
      records,
      total: res.data.total ?? 0,
      current: res.data.current ?? current,
      size: res.data.size ?? size
    }
  }

  const CONTENT_SEARCH_KEYS = [
    // 'trackingNo',
    // 'purchaseOrderNo',
    'skuCode',
    'skuName',
    'spuCode',
    'spuName'
    // 'shipmentNo'
  ]

  const DATE_SEARCH_KEYS = [
    'shipTime',
    'createTime',
    'updateTime',
    'orderReceiveTime',
    'expectDeliveryDate'
  ]

  /** 将维度/指标/周期写入查询参数 */
  const appendAnalysisParams = (params: Record<string, any>) => {
    params.dimension = searchForm.dimension
    params.metric = mapMetricToApi(searchForm.metric)
    params.period = searchForm.period
    params.logisticsManagerNameList = params.logisticsManagerIdList
    params.logisticsChannelNameList = params.logisticsChannelIdList
    return params
  }

  /** 映射出货时间到接口参数（*Start/*End，格式随统计周期） */
  const applyDateSearchParams = (params: Record<string, any>) => {
    const dateType = params.dateSearchType ?? searchForm.dateSearchType
    const dateValue = params.dateSearchValue ?? searchForm.dateSearchValue
    const period = (params.period ?? searchForm.period) as PeriodType

    DATE_SEARCH_KEYS.forEach((key) => {
      params[`${key}From`] = null
      params[`${key}To`] = null
      if (key !== dateType) {
        params[`${key}Start`] = null
        params[`${key}End`] = null
      } else {
        params[`${key}Start`] = dateValue?.[0]
          ? formatDateSearchApiValue(dateValue[0], period)
          : null
        params[`${key}End`] = dateValue?.[1] ? formatDateSearchApiValue(dateValue[1], period) : null
      }
    })
  }

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
      apiFn: async (params: any) => {
        CONTENT_SEARCH_KEYS.forEach((key) => {
          params[key] = key === params.searchType ? params.searchValue : null
        })
        applyDateSearchParams(params)
        appendAnalysisParams(params)
        return fetchCostOverview(params)
      },
      immediate: true,
      columnsFactory,
      tableKey: 'logistics-batch-cost',
      tableName: 'logistics-batch-cost',
      apiParams: {
        ...defaultSearchForm(),
        currentPage: 1,
        pageSize: 20
      }
    },
    transform: {
      /** mock 直接返回 { records, total }，避免 defaultResponseAdapter 访问 response.data 报错 */
      responseAdapter: (response: { records?: BatchCostRow[]; total?: number }) => ({
        records: response?.records ?? [],
        total: response?.total ?? 0
      })
    },
    hooks: {
      resetFormCallback: () => {
        Object.assign(searchForm, defaultSearchForm())
      }
    }
  })

  /** 周/季度出货时间变更后触发搜索 */
  const handlePeriodDateChange = () => {
    handleSearch()
  }

  /** 处理搜索（复合搜索字段映射，参照物流运单） */
  const handleSearch = () => {
    const params: Record<string, any> = { ...searchForm }
    CONTENT_SEARCH_KEYS.forEach((key) => {
      params[key] = key === searchForm.searchType ? searchForm.searchValue : null
    })
    applyDateSearchParams(params)
    appendAnalysisParams(params)
    Object.assign(searchParams, params)
    // 重新查询时收起所有已展开的行，避免新结果集中保留陈旧/无效的展开状态
    expandedRowKeys.value = []
    getData()
  }

  const logisticsCostExportHandler = (rawParams: Record<string, any>) => {
    const params: Record<string, any> = { ...rawParams }
    CONTENT_SEARCH_KEYS.forEach((key) => {
      params[key] = key === params.searchType ? params.searchValue : null
    })
    applyDateSearchParams(params)
    appendAnalysisParams(params)
    return logisticsCostExport(params)
  }

  const resetSearchParams = async () => {
    await resetTableSearch()
  }

  /** 最新头程成本列排序 */
  const handleSortChange = ({
    prop,
    order
  }: {
    prop: string | null
    order: 'ascending' | 'descending' | null
  }) => {
    if (prop === 'latestCostPrice' && order) {
      ;(searchParams as Record<string, unknown>).sortField = 'latestCostPrice'
      ;(searchParams as Record<string, unknown>).sortOrder = order === 'ascending' ? 'asc' : 'desc'
    } else {
      ;(searchParams as Record<string, unknown>).sortField = undefined
      ;(searchParams as Record<string, unknown>).sortOrder = undefined
    }
    getData()
  }

  /** 统计周期变更：出货时间选择器类型 + 默认最近 7 个周期 */
  watch(
    () => searchForm.period,
    (period, oldPeriod) => {
      searchForm.dateSearchValue = [...getDefaultDateSearchValue(period, 7)]
      if (oldPeriod !== undefined) {
        handleSearch()
      }
    }
  )

  /** 工具栏切换维度/指标时刷新 */
  watch(
    () => [searchForm.dimension, searchForm.metric] as const,
    () => {
      appendAnalysisParams(searchParams as Record<string, any>)
      // 重新查询时收起所有已展开的行，避免新结果集中保留陈旧/无效的展开状态
      expandedRowKeys.value = []
      getData()
    }
  )

  const getTableRowById = (rowId: string) => data.value.find((r) => r.id === rowId)

  const toggleRowExpand = (row: BatchCostRow, expanded: boolean) => {
    const tableRow = getTableRowById(row.id) ?? row
    tableRef.value?.elTableRef?.toggleRowExpansion?.(tableRow, expanded)
  }

  const handleExpandChange = (row: BatchCostRow, expanded: boolean) => {
    if (expanded) {
      if (!expandedRowKeys.value.includes(row.id)) {
        expandedRowKeys.value = [...expandedRowKeys.value, row.id]
      }
    } else {
      expandedRowKeys.value = expandedRowKeys.value.filter((id) => id !== row.id)
    }
  }

  /** 点击分批次明细：展开 / 再次点击收起 */
  const handleBatchDetail = (row: BatchCostRow) => {
    if (expandedRowKeys.value.includes(row.id)) {
      handleCollapseRow(row)
      return
    }
    expandedRowKeys.value = [...expandedRowKeys.value, row.id]
    nextTick(() => toggleRowExpand(row, true))
  }

  /** 点击收起：收起当前 SKU 对应行 */
  const handleCollapseRow = (row: BatchCostRow) => {
    if (!expandedRowKeys.value.includes(row.id)) return
    expandedRowKeys.value = expandedRowKeys.value.filter((id) => id !== row.id)
    nextTick(() => {
      toggleRowExpand(row, false)
    })
  }

  const getExpandRowClassName = ({ row }: { row: BatchCostRow }) => {
    return expandedRowKeys.value.includes(row.id) ? 'batch-cost-row-expanded' : ''
  }
</script>

<style lang="scss" scoped>
  @use 'sass:list';
  @use './styles/channel-tag-vars' as ctc;

  .batch-cost-page {
    .toolbar-left {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }

    :deep(.el-radio-button--small) {
      .el-radio-button__inner {
        padding: 8px 12px;
      }
    }

    .grey-font {
      display: block;
      color: #909399;
    }

    .sub-title {
      padding-left: 16px;
      font-size: 12px;
      color: #8590a6;

      i {
        padding: 0 6px;
        font-size: 12px;
        color: #2e5cff;
      }
    }

    .range-section {
      display: flex;
      gap: 4px;
      font-size: 12px;
      color: #8590a6;

      :deep(.el-switch__label--left) {
        display: none;
      }
    }

    .toolbar-metric,
    .toolbar-period {
      margin-left: 4px;
    }

    .ring-ratio-label {
      margin-left: 8px;
      font-size: 13px;
      color: var(--el-text-color-regular);
    }

    :deep(.composite-period-date) {
      display: flex;
      width: 100%;

      .el-select .el-select__wrapper {
        border-radius: var(--el-border-radius-base) 0 0 var(--el-border-radius-base);
      }
    }

    .cost-tip-alert {
      width: fit-content;
      max-width: 100%;
      padding: 2px 12px;
      margin: 0 0 8px;
      margin-bottom: 10px;
      background-color: #fffdf5;
      border: 1px solid #fde68a;
      border-radius: 8px;

      :deep(.el-alert__icon) {
        font-size: 14px;
        color: #f0a020;
      }

      :deep(.el-alert__title) {
        font-size: 12px;
        color: var(--el-text-color-regular);
      }
    }

    .image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      color: var(--el-text-color-placeholder);
      background: var(--el-fill-color-light);
      border-radius: 4px;
    }

    .product-code {
      font-weight: 400;
    }

    .latest-cost-cell {
      width: 100%;
      font-size: 12px;
      line-height: 1.6;

      /* 五等分布局：物流渠道 2份，价格 / 涨跌 / 日期各 1 份 */
      .latest-cost-grid {
        display: grid;
        grid-template-columns: minmax(0, 2fr) minmax(0, 2fr) minmax(0, 1fr) minmax(0, 2fr);
        gap: 10px 12px;
        align-items: center;
        width: 100%;
        margin-top: 8px;
      }

      .channel-tag {
        display: inline-block;
        justify-self: start;
        max-width: 100%;
        padding: 0 6px;
        overflow: hidden;
        font-size: 12px;
        line-height: 18px;
        text-overflow: ellipsis;
        white-space: nowrap;
        border: 1px solid transparent;
        border-radius: 4px;

        /* 10 色色板（无红色），与 utils/channel-tag.ts 的 c1~c10 对应 */
        @each $name, $c in ctc.$channel-tag-colors {
          &--#{$name} {
            color: list.nth($c, 1);
            background-color: list.nth($c, 2);
            border-color: list.nth($c, 3);
          }
        }
      }

      // .price {
      //   justify-self: start;
      //   // font-weight: 600;
      //   color: var(--el-text-color-primary);
      //   white-space: nowrap;
      // }
      .price {
        justify-self: start;
        // font-weight: 600;
        color: var(--el-text-color-primary);
        white-space: nowrap;

        .price-estimate-tag {
          margin-left: 2px;
          color: #aaa;
          // display: block;
        }
      }

      .change {
        display: inline-flex;
        gap: 2px;
        align-items: center;
        justify-self: start;
        padding: 0 4px;
        font-size: 12px;
        line-height: 18px;
        white-space: nowrap;
        border-radius: 4px;

        .change-icon {
          font-size: 12px;
          font-style: normal;
          line-height: 1;
        }

        &.is-up {
          color: #f56c6c;
          background-color: #fef0f0;
        }

        &.is-down {
          color: #67c23a;
          background-color: #f0f9eb;
        }

        &.is-flat {
          color: #909399;
          background-color: transparent;
        }
      }

      .date {
        justify-self: end;
        color: var(--el-text-color-secondary);
        white-space: nowrap;
      }

      .history-link {
        margin-top: 10px;
        margin-bottom: 2px;
        font-size: 12px;

        .link-arrow {
          margin-top: -3px;
          margin-left: 3px;
          font-size: 12px;
        }
      }
    }

    .trend-cell {
      display: flex;
      gap: 8px;
      align-items: center;

      .trend-detail-link {
        flex-shrink: 0;
        font-size: 12px;
        white-space: nowrap;

        .link-arrow {
          margin-left: 2px;
          font-size: 12px;
        }
      }
    }

    :deep(.period-cell) {
      text-align: center;

      .period-value {
        font-size: 12px;
        // font-weight: 500;
      }

      .period-ratio {
        display: inline-flex;
        gap: 2px;
        align-items: center;
        justify-content: center;
        margin-top: 2px;
        font-size: 11px;

        .arrow-icon {
          font-size: 12px;
          font-style: normal;
          line-height: 1;
        }

        &.is-up {
          color: #f56c6c;
        }

        &.is-down {
          color: #67c23a;
        }
      }
    }

    :deep(.period-empty) {
      color: var(--el-text-color-placeholder);
    }

    .batch-detail-link {
      font-size: 12px;
      white-space: nowrap;

      .batch-detail-arrow {
        margin-top: -3px;
        margin-left: 3px;
        font-size: 12px;
        transition: transform 0.2s;
      }

      /* 展开时箭头由朝右旋转为朝下 */
      .batch-detail-arrow.is-expanded {
        transform: rotate(90deg);
      }
    }

    :deep(.batch-cost-table) {
      .batch-cost-expand-col {
        padding: 0 !important;
        border-right: none !important;

        .cell {
          padding: 0 !important;
        }

        .el-table__expand-icon {
          display: none;
        }
      }

      .el-table__expanded-cell {
        padding: 8px 12px !important;
        background-color: var(--el-fill-color-light) !important;
      }

      .el-table__expanded-cell:hover {
        background-color: var(--el-fill-color-light) !important;
      }

      tr.batch-cost-row-expanded > td.el-table__cell {
        background-color: var(--el-fill-color-light) !important;
      }

      tr.batch-cost-row-expanded:hover > td.el-table__cell {
        background-color: var(--el-fill-color-light) !important;
      }
    }
  }
</style>
