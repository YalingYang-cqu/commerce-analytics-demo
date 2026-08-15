<template>
  <div class="batch-cost-page art-full-height" v-auth="'purchase:batchCost:view'">
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
            <ElOption label="接单时间" value="orderReceiveTime" />
          </ElSelect>
          <PeriodWeekRangePicker
            v-if="searchForm.period === 'week'"
            v-model="form.dateSearchValue"
            :start-placeholder="periodDatePlaceholders[0]"
            :end-placeholder="periodDatePlaceholders[1]"
            :date-picker-props="periodDatePickerConfig.datePickerProps"
            :max-range="ORDER_TIME_MAX_RANGE.week"
            @change="handlePeriodDateChange"
          />
          <PeriodQuarterRangePicker
            v-else-if="searchForm.period === 'quarter'"
            v-model="form.dateSearchValue"
            :start-placeholder="periodDatePlaceholders[0]"
            :end-placeholder="periodDatePlaceholders[1]"
            :max-range="ORDER_TIME_MAX_RANGE.quarter"
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
      tableName="purchase-batch-cost"
      @refresh="refreshData"
      :updateColumn="updateColumn"
      :resetColumns="resetColumns"
      :exportApi="purchaseCostExportHandler"
      :exportParams="searchParams"
      :asyncExport="true"
      exportAuth="purchase:batchCost:export"
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
                <TableHeaderTip label="单个采购成本" tip="已交货含税总额 ÷ 总已交货数" />
              </ElRadioButton>
              <ElRadioButton value="quantity">
                <TableHeaderTip label="已交货量" tip="选定周期内已交货总件数" />
              </ElRadioButton>
              <ElRadioButton value="totalPrice">
                <TableHeaderTip label="采购总价" tip="选定周期内已交货的含税总额" />
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
          <ElSpace class="range-section">
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
        title="采购成本按采购接单时间统计，默认显示含税单价"
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
        tableKey="purchase-batch-cost"
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
            :supplier-options="supplierList"
            :status-options="PURCHASE_STATUS_OPTIONS"
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

        <!-- 采购负责人 -->
        <template #purchaseManager="{ row }">
          <span>{{ row.purchaseManager }}</span>
        </template>

        <!-- 最新采购成本 -->
        <template #latestCost="{ row }">
          <div class="latest-cost-cell">
            <div class="latest-cost-grid">
              <template v-for="(item, idx) in row.latestCosts" :key="idx">
                <span :class="getSupplierTagClass(idx, item.supplierName)">{{
                  item.supplierName
                }}</span>
                <span class="price">
                  {{ typeof item?.price === 'number' ? `¥${item.price}` : `—` }}
                  <!-- <template v-else-if="typeof item?.estimateUnitCost === 'number'"
                    >¥{{ item.estimateUnitCost
                    }}<span class="price-estimate-tag">(预估)</span></template
                  > -->
                  <!-- <template v-else>—</template> -->
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
            <CostTrendMiniChart
              v-if="hasTrendData(row)"
              :data="row.trendData"
              :metric="searchForm.metric"
            />
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
      :order-receive-time-start="trendDetailQuery.orderReceiveTimeStart"
      :order-receive-time-end="trendDetailQuery.orderReceiveTimeEnd"
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
  import {
    pubBrandList,
    pubCategoryList,
    pubGetMainList,
    pubGetUserList,
    pubWarehouseList
  } from '@/utils'
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
    isBeyondOrderTimeRange,
    ORDER_TIME_MAX_RANGE,
    PERIOD_OPTIONS,
    type PeriodType
  } from './utils/period'
  import { getSupplierTagClass } from './utils/supplier-tag'
  import {
    purchaseCostExport,
    purchaseCostFilterOptions,
    purchaseCostPageList
  } from '@/api/purchase/batch-cost.js'

  defineOptions({ name: 'PurchaseBatchCost' })

  interface SelectOption {
    value: string | number
    label: string
    data?: Record<string, any>
  }

  /** 采购状态（与采购订单状态一致） */
  const PURCHASE_STATUS_OPTIONS: SelectOption[] = [
    // { label: '待下单', value: 1 },
    // { label: '待接单', value: 2 },
    // { label: '待签署', value: 3 },
    { label: '待交货', value: 4 },
    { label: '交货中', value: 5 },
    { label: '已完成', value: 6 }
    // { label: '已拒绝', value: 7 },
    // { label: '已作废', value: 8 }
  ]

  const mainList = ref<SelectOption[]>([])
  const supplierList = ref<SelectOption[]>([])
  const userList = ref<SelectOption[]>([])
  const brandList = ref<SelectOption[]>([])
  const categoryList = ref<any[]>([])
  const warehouseList = ref<SelectOption[]>([])
  const isFrontendMode = import.meta.env.VITE_ACCESS_MODE === 'frontend'

  const defaultSearchForm = () => {
    const period = 'month' as PeriodType
    return {
      searchType: 'skuCode',
      searchValue: '',
      dateSearchType: 'orderReceiveTime',
      dateSearchValue: getDefaultDateSearchValue(period, 7),
      purchasingEntityIdList: [] as (string | number)[],
      supplierIdList: [] as (string | number)[],
      purchaseManagerIdList: [] as (string | number)[],
      brandIdList: [] as (string | number)[],
      statusList: [] as (string | number)[],
      warehouseIdList: [] as (string | number)[],
      categoryIdList: [] as (string | number)[],
      /** 统计维度：sku | spu */
      dimension: 'sku' as DimensionType,
      /** 指标：单个采购成本 | 采购数量 | 采购总价 */
      metric: 'unitCost' as MetricType,
      /** 统计周期 */
      period
    }
  }

  /** filter-options 的 suppliers 兼容 string / {id,name} 两种返回形态 */
  const mapFilterSuppliers = (list: any[]): SelectOption[] =>
    (list || []).map((item: any) =>
      typeof item === 'string'
        ? { label: item, value: item }
        : { label: item.name, value: item.id ?? item.name }
    )

  onMounted(async () => {
    if (isFrontendMode) {
      const costOptions = await purchaseCostFilterOptions()
      const data = (costOptions as any)?.data || {}
      supplierList.value = mapFilterSuppliers(data.suppliers)
      userList.value = (data.purchaseManagers || []).map((name: string) => ({
        label: name,
        value: name
      }))
      brandList.value = (data.brands || []).map((item: any) => ({
        label: item.name,
        value: item.id
      }))
      categoryList.value = (data.categories || []).map((item: any) => ({
        id: item.id,
        categoryName: item.name
      }))
      return
    }
    const [mainRes, userRes, brandRes, categoryRes, warehouseRes, costOptionsRes] =
      await Promise.allSettled([
        pubGetMainList({}),
        pubGetUserList([0, 1]),
        pubBrandList({ brandStatus: null }),
        pubCategoryList({ status: null }),
        pubWarehouseList({ warehouseType: 1 }),
        purchaseCostFilterOptions()
      ])
    mainList.value = mainRes.status === 'fulfilled' ? mainRes.value : []
    userList.value = userRes.status === 'fulfilled' ? userRes.value : []
    brandList.value = brandRes.status === 'fulfilled' ? brandRes.value : []
    categoryList.value = categoryRes.status === 'fulfilled' ? categoryRes.value : []
    warehouseList.value = warehouseRes.status === 'fulfilled' ? warehouseRes.value : []
    if (costOptionsRes.status === 'fulfilled') {
      const data = (costOptionsRes.value as any)?.data || {}
      supplierList.value = mapFilterSuppliers(data.suppliers)
      userList.value = (data.purchaseManagers || []).map((name: string) => ({
        label: name,
        value: name
      }))
      brandList.value = (data.brands || []).map((item: any) => ({
        label: item.name,
        value: item.id
      }))
      categoryList.value = (data.categories || []).map((item: any) => ({
        id: item.id,
        categoryName: item.name
      }))
    }
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
          const ratio = cell.ringRatio
          const isFlat = ratio === 0 || !ratio
          const stateClass = isFlat ? 'is-flat' : ratio > 0 ? 'is-up' : 'is-down'
          children.push(
            h('div', { class: ['period-ratio', stateClass] }, [
              isFlat
                ? h('span', { class: 'flat-icon' }, '—')
                : h('i', {
                    class: 'iconfont-custom arrow-icon',
                    innerHTML: ratio > 0 ? '&#xe608;' : '&#xe60b;'
                  }),
              `${Math.abs(ratio)}%`
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

  const searchForm = reactive(defaultSearchForm())

  const periodDatePickerConfig = computed(() => getPeriodDatePickerConfig(searchForm.period))

  /**
   * 接单时间最大搜索范围：选定一端后另一端超出最大跨度的选项置灰
   * 原生选择器（日/月/年）通过 calendar-change 记录锚点 + disabledDate 置灰
   */
  const orderTimeAnchor = ref<Date | null>(null)

  const orderTimeDisabledDate = (date: Date): boolean =>
    isBeyondOrderTimeRange(date, orderTimeAnchor.value, searchForm.period)

  /** 首次点击 [start, null] 记录锚点；选满 [start, end] 清空锚点以便自由重选 */
  const handleOrderTimeCalendarChange = (dates: [Date, Date | null]) => {
    const [start, end] = dates || []
    orderTimeAnchor.value = end ? null : (start ?? null)
  }

  /** 原生接单时间选择器配置：合并周期配置与跨度置灰 */
  const orderTimeDatePickerProps = computed(() => ({
    ...periodDatePickerConfig.value.datePickerProps,
    disabledDate: orderTimeDisabledDate,
    onCalendarChange: handleOrderTimeCalendarChange
  }))

  const isCustomPeriodDatePicker = computed(() => ['week', 'quarter'].includes(searchForm.period))

  const periodDatePlaceholders = computed(() => {
    const parts = getPeriodDateSearchPlaceholder(searchForm.period).split(',')
    return [parts[0] || '开始', parts[1] || '结束']
  })

  // 搜索项配置（参照采购订单）
  const searchItems = computed(() => [
    {
      key: 'searchValue',
      label: '',
      compositeSearch: true,
      selectOptions: [
        { label: 'SKU', value: 'skuCode' },
        { label: '中文品名', value: 'skuName' },
        { label: 'SPU', value: 'spuCode' },
        { label: '中文款名', value: 'spuName' }
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
      selectOptions: [{ label: '接单时间', value: 'orderReceiveTime' }],
      selectKey: 'dateSearchType',
      selectWidth: '120px',
      inputType: periodDatePickerConfig.value.inputType,
      placeholder: getPeriodDateSearchPlaceholder(searchForm.period),
      width: '320px',
      datePickerProps: orderTimeDatePickerProps.value
    },
    // {
    //   key: 'purchasingEntityIdList',
    //   label: '',
    //   type: 'select',
    //   selectMultiple: true,
    //   placeholder: '采购主体',
    //   width: '150px',
    //   alwaysFilterInput: true,
    //   labelValue: { name: 'label', value: 'value' },
    //   props: {
    //     options: mainList.value,
    //     clearable: true
    //   }
    // },
    // {
    //   key: 'supplierIdList',
    //   label: '',
    //   type: 'select',
    //   selectMultiple: true,
    //   placeholder: '供应商',
    //   width: '150px',
    //   alwaysFilterInput: true,
    //   labelValue: { name: 'label', value: 'value' },
    //   props: {
    //     options: supplierList.value,
    //     clearable: true
    //   }
    // },
    {
      key: 'purchaseManagerIdList',
      label: '',
      type: 'select',
      selectMultiple: true,
      placeholder: '采购负责人',
      width: '140px',
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      props: {
        options: userList.value,
        clearable: true
      }
    },
    // {
    //   key: 'statusList',
    //   label: '',
    //   type: 'select',
    //   selectMultiple: true,
    //   placeholder: '采购状态',
    //   width: '140px',
    //   alwaysFilterInput: true,
    //   labelValue: { name: 'label', value: 'value' },
    //   props: {
    //     options: PURCHASE_STATUS_OPTIONS,
    //     clearable: true
    //   }
    // },
    // {
    //   key: 'warehouseIdList',
    //   label: '',
    //   type: 'select',
    //   selectMultiple: true,
    //   placeholder: '供应商仓库',
    //   width: '150px',
    //   alwaysFilterInput: true,
    //   labelValue: { name: 'label', value: 'value' },
    //   props: {
    //     options: warehouseList.value,
    //     clearable: true
    //   }
    // },
    {
      key: 'categoryIdList',
      label: '',
      type: 'select',
      selectMultiple: true,
      placeholder: '分类',
      width: '160px',
      alwaysFilterInput: true,
      labelValue: { name: 'categoryName', value: 'id' },
      props: { options: categoryList.value, clearable: true }
    },
    {
      key: 'brandIdList',
      label: '',
      type: 'select',
      selectMultiple: true,
      placeholder: '品牌',
      width: '140px',
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      props: {
        options: brandList.value,
        clearable: true
      }
    }
  ])

  const periodLabels = computed(() =>
    getPeriodLabelsFromDateSearch(
      searchForm.period,
      searchForm.dateSearchType,
      searchForm.dateSearchValue
    )
  )

  function formatChange(change: number) {
    return Math.abs(change)
  }
  const detailDateRange = computed<[string, string] | undefined>(() => {
    if (searchForm.dateSearchType !== 'orderReceiveTime') return undefined
    const [startRaw, endRaw] = searchForm.dateSearchValue
    if (!startRaw || !endRaw) return undefined
    const start = formatDateSearchApiValue(startRaw, searchForm.period)
    const end = formatDateSearchApiValue(endRaw, searchForm.period)
    const [from, to] = apiDateRangeToIsoDates(start, end, searchForm.period)
    return from && to ? [from, to] : [startRaw, endRaw]
  })

  /** 趋势分析弹窗的查询参数：与页面查询的 period / orderReceiveTimeStart / orderReceiveTimeEnd 保持一致 */
  const trendDetailQuery = computed(() => {
    const period = searchForm.period
    const isOrderReceiveTime = searchForm.dateSearchType === 'orderReceiveTime'
    const [startRaw, endRaw] = searchForm.dateSearchValue || []
    return {
      period,
      orderReceiveTimeStart:
        isOrderReceiveTime && startRaw ? formatDateSearchApiValue(startRaw, period) : null,
      orderReceiveTimeEnd:
        isOrderReceiveTime && endRaw ? formatDateSearchApiValue(endRaw, period) : null
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
        prop: 'purchaseManager',
        label: '采购负责人',
        minWidth: 100,
        useSlot: true
      },
      {
        prop: 'latestCostPrice',
        label: '最新采购成本',
        width: 350,
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

  /** 接口原始记录结构（与后端实际返回保持一致，前端再适配为 BatchCostRow） */
  interface ApiPeriodDetail {
    label: string
    value: number | null
    ringRatio: number | null
  }
  interface ApiLatestCost {
    supplierName: string
    price: number
    change: number | null
    changeDate: string
  }
  interface ApiRecord {
    id: string
    imageUrl: string
    sku: string
    spu: string
    /** 后端给的是 JSON 字符串，例如 '["负责人A"]' */
    purchaseManager: string
    latestCosts: ApiLatestCost[]
    periodDetails: ApiPeriodDetail[]
  }

  /** JSON 字符串数组 → "负责人A、负责人B"，解析失败时原样返回 */
  const formatPurchaseManager = (raw: unknown): string => {
    if (raw == null) return ''
    if (Array.isArray(raw)) return raw.join('、')
    if (typeof raw !== 'string') return String(raw)
    const trimmed = raw.trim()
    if (!trimmed.startsWith('[')) return trimmed
    try {
      const parsed = JSON.parse(trimmed)
      return Array.isArray(parsed) ? parsed.join('、') : trimmed
    } catch {
      return trimmed
    }
  }

  /** 接口原始记录 → 表格行模型 */
  const mapApiRow = (api: ApiRecord): BatchCostRow => {
    const periodDetails: Record<string, PeriodCell> = {}
    const sortedDetails = [...(api.periodDetails ?? [])].sort((a, b) =>
      a.label.localeCompare(b.label)
    )
    sortedDetails.forEach((d) => {
      periodDetails[d.label] = { value: d.value, ringRatio: d.ringRatio }
    })

    const latestCosts = (api.latestCosts ?? []).map((c) => ({
      ...c,
      supplierName: c.supplierName,
      price: c.price,
      change: Number(c.change ?? 0),
      changeDate: c.changeDate
    }))

    const prices = latestCosts.map((c) => c.price)
    const latestCostPrice = prices.length ? Math.min(...prices) : 0

    return {
      ...api,
      id: api.id,
      imageUrl: api.imageUrl ?? '',
      sku: api.sku ?? '',
      spu: api.spu ?? '',
      purchaseManager: formatPurchaseManager(api.purchaseManager),
      latestCostPrice,
      latestCosts,
      trendData: sortedDetails.map((d) => ({ label: d.label, value: d.value })),
      periodDetails
    }
  }

  const fetchCostOverview = async (params: Record<string, unknown>) => {
    const current = Number(params.currentPage ?? params.current ?? params.page ?? 1)
    const size = Number(params.pageSize ?? params.size ?? 20)
    const res: any = await purchaseCostPageList(params)
    const records = (res.data.records ?? []).map(mapApiRow)
    return {
      records,
      total: res.data.total ?? 0,
      current: res.data.current ?? current,
      size: res.data.size ?? size
    }
  }

  const CONTENT_SEARCH_KEYS = ['skuCode', 'skuName', 'spuCode', 'spuName']

  const DATE_SEARCH_KEYS = ['orderReceiveTime']

  /** 将维度/指标/周期写入查询参数 */
  const appendAnalysisParams = (params: Record<string, any>) => {
    params.dimension = searchForm.dimension
    params.metric = searchForm.metric
    params.period = searchForm.period
    params.purchaseManagerNameList = params.purchaseManagerIdList
    return params
  }

  /** 映射接单时间到接口参数（字段名 *Start/*End，格式随统计周期） */
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
      tableKey: 'purchase-batch-cost',
      tableName: 'purchase-batch-cost',
      apiParams: {
        ...defaultSearchForm(),
        currentPage: 1,
        pageSize: 20
      }
    },
    transform: {
      /** 接口直接返回 { records, total }，不经过项目拦截器的 data 解包 */
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

  /** 周/季度接单时间变更后触发搜索 */
  const handlePeriodDateChange = () => {
    handleSearch()
  }

  /** 处理搜索（复合搜索字段映射，参照采购订单） */
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

  const purchaseCostExportHandler = (rawParams: Record<string, any>) => {
    const params: Record<string, any> = { ...rawParams }
    CONTENT_SEARCH_KEYS.forEach((key) => {
      params[key] = key === params.searchType ? params.searchValue : null
    })
    applyDateSearchParams(params)
    appendAnalysisParams(params)
    return purchaseCostExport(params)
  }

  const resetSearchParams = async () => {
    await resetTableSearch()
  }

  /** 最新采购成本列排序 */
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

  /** 统计周期变更：下单时间选择器类型 + 默认最近 7 个周期 */
  watch(
    () => searchForm.period,
    (period, oldPeriod) => {
      orderTimeAnchor.value = null
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

  /** 趋势数据是否有效：存在且至少一个非空值；无数据时不渲染迷你图（避免显示“暂无数据”占位） */
  const hasTrendData = (row: BatchCostRow) => {
    return !!row.trendData?.some((d) => d.value !== null && d.value !== undefined)
  }

  /** 最新采购成本-涨跌幅：0 或 null/undefined 视为持平 */
  const isChangeFlat = (change: number | null | undefined) => {
    return change == null || change === 0
  }
  const getChangeStateClass = (change: number | null | undefined) => {
    if (isChangeFlat(change)) return 'is-flat'
    return (change as number) > 0 ? 'is-up' : 'is-down'
  }
</script>

<style lang="scss" scoped>
  .batch-cost-page {
    .toolbar-left {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
      align-items: center;
    }

    .grey-font {
      display: block;
      color: #909399;
    }

    :deep(.el-radio-button--small) {
      .el-radio-button__inner {
        padding: 8px 12px;
      }
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
      margin-bottom: 12px;
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

      /* 五等分布局：供应商 3 份，价格 / 涨跌 / 日期各 1 份 */
      .latest-cost-grid {
        display: grid;
        grid-template-columns: minmax(0, 2.5fr) minmax(0, 1.5fr) minmax(0, 1fr) minmax(0, 1.5fr);
        gap: 10px 12px;
        align-items: center;
        width: 100%;
        margin-top: 8px;
      }

      .supplier-tag {
        display: inline-block;
        justify-self: start;
        max-width: 100%;
        padding: 0 8px;
        overflow: hidden;
        font-size: 12px;
        line-height: 18px;
        text-overflow: ellipsis;
        white-space: nowrap;
        border: 1px solid transparent;
        border-radius: 4px;

        /* 10 色色板（无红色），与 utils/supplier-tag.ts 的 c1~c10 对应，按行内序号取色 */
        &--c1 {
          color: #c2410c;
          background-color: #fff7ed;
          border-color: #fed7aa;
        }

        &--c2 {
          color: #15803d;
          background-color: #dcfce7;
          border-color: #bbf7d0;
        }

        &--c3 {
          color: #0369a1;
          background-color: #e0f2fe;
          border-color: #bae6fd;
        }

        &--c4 {
          color: #7e22ce;
          background-color: #f3e8ff;
          border-color: #e9d5ff;
        }

        &--c5 {
          color: #0f766e;
          background-color: #ccfbf1;
          border-color: #99f6e4;
        }

        &--c6 {
          color: #4338ca;
          background-color: #e0e7ff;
          border-color: #c7d2fe;
        }

        &--c7 {
          color: #be185d;
          background-color: #fce7f3;
          border-color: #fbcfe8;
        }

        &--c8 {
          color: #0e7490;
          background-color: #cffafe;
          border-color: #a5f3fc;
        }

        &--c9 {
          color: #4d7c0f;
          background-color: #ecfccb;
          border-color: #d9f99d;
        }

        &--c10 {
          color: #a16207;
          background-color: #fef9c3;
          border-color: #fde68a;
        }
      }

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

        &.is-flat {
          color: #909399;

          .flat-icon {
            display: inline-block;
            font-size: 12px;
            line-height: 1;
          }
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
