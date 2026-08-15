<!-- 分批次明细展开面板：展开时懒加载 + 按 SKU 缓存 -->
<template>
  <div class="batch-cost-expand-panel" v-loading="loading">
    <div class="panel-header">
      <div class="panel-header__main">
        <span class="panel-title-tag">物流运单明细</span>
        <span class="product-code">{{ productCode }}</span>
        <span class="panel-subtitle">· 按物流运单展示</span>
      </div>
      <ElButton type="primary" link @click.stop="handleCollapse">收起</ElButton>
    </div>

    <div v-if="summary" class="summary-cards">
      <ElCard shadow="never" class="summary-stat-card">
        <div class="stat-card__label">总批次</div>
        <div class="stat-card__value">
          <span class="stat-card__num stat-card__num--primary">{{ summary.batchCount }}</span>
          <span class="stat-card__unit">批</span>
        </div>
      </ElCard>

      <ElCard shadow="never" class="summary-stat-card">
        <div class="stat-card__label">总发货量</div>
        <div class="stat-card__value">
          <span class="stat-card__num">{{ summary.totalShipQty.toLocaleString() }}</span>
          <span class="stat-card__unit">件</span>
        </div>
      </ElCard>

      <ElCard shadow="never" class="summary-stat-card">
        <div class="stat-card__label">
          <TableHeaderTip label="总计费重" tip="所有运单毛重合计（kg）" />
        </div>
        <div class="stat-card__value">
          <span class="stat-card__num">{{ formatWeight(summary.totalWeight) }}</span>
          <span class="stat-card__unit">kg</span>
        </div>
      </ElCard>

      <ElCard shadow="never" class="summary-metric-card">
        <div class="metric-card__label">
          <TableHeaderTip label="头程总成本" tip="选定周期内头程总成本（含运费、税费等）" />
        </div>
        <div class="metric-card__value metric-card__value--primary">
          ¥{{ formatMoney(summary.totalFirstLegCost) }}
        </div>
        <div class="metric-card__divider" />
        <div class="metric-card__breakdown">
          <div
            v-for="(item, idx) in summary.amountByChannel"
            :key="item.name"
            class="breakdown-item"
          >
            <span
              :class="
                getChannelTagClass(
                  getChannelTagIndexByName(item.name, summary.amountByChannel, idx),
                  item.name
                )
              "
            >
              {{ formatChannelShortName(item.name) }}
            </span>
            <span class="breakdown-amount">¥{{ formatMoney(item.amount) }}</span>
            <span class="breakdown-meta">{{ formatAmountPercent(item.amount) }}%</span>
          </div>
        </div>
      </ElCard>

      <ElCard shadow="never" class="summary-metric-card">
        <div class="metric-card__label">
          <TableHeaderTip label="加权平均单价" tip="总头程成本 ÷ 总发货量" />
        </div>
        <div class="metric-card__value">¥{{ formatMoney(summary.weightedAvgUnitPrice) }}</div>
        <div class="metric-card__divider" />
        <div class="metric-card__breakdown">
          <div v-for="(item, idx) in summary.avgByChannel" :key="item.name" class="breakdown-item">
            <span
              :class="
                getChannelTagClass(
                  getChannelTagIndexByName(item.name, summary.amountByChannel, idx),
                  item.name
                )
              "
            >
              {{ formatChannelShortName(item.name) }}
            </span>
            <span class="breakdown-amount">¥{{ formatMoney(item.avg) }}</span>
            <span class="breakdown-meta">{{ item.qty.toLocaleString() }}件</span>
          </div>
        </div>
      </ElCard>
    </div>

    <ArtSearchBar
      v-model="detailSearchForm"
      :items="detailSearchItems"
      :showSearch="false"
      @reset="handleDetailReset"
      @search="handleDetailSearch"
    />
    <ArtTableHeader
      v-model:columns="columnChecks"
      :loading="loading"
      tableName="batch-cost-expand-detail"
      @refresh="loadData"
      layout="refresh,down,columnsNew"
      :updateColumn="updateColumn"
      :resetColumns="resetColumns"
      :exportApi="logisticsBatchDetailExportHandler"
      :exportParams="buildQuery"
      exportAuth="logistics:batchCost:detailExport"
    >
      <template #left>
        <div class="detail-list-title">
          <span class="detail-list-title__bar" />
          <span class="detail-list-title__text">明细列表</span>
        </div>
      </template>
    </ArtTableHeader>

    <ElCard shadow="never" class="detail-table-card">
      <ArtTable
        :loading="loading"
        :data="tableData"
        row-key="id"
        :autoHeight="true"
        :columns="columns"
        :column-checks="columnChecks"
        :pagination="pagination"
        :show-table-header="false"
        size="small"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <template #index="{ $index }">
          {{ $index + 1 }}
        </template>
        <template #waybillNo="{ row }">
          <ElLink type="primary" :underline="false" @click="goWaybillDetail(row)">
            {{ row.waybillNo }}
          </ElLink>
        </template>
        <template #sku="{ row }">
          <div class="sku-cell">
            <span class="sku-cell__code">{{ row.sku || '-' }}</span>
            <span class="sku-cell__name">{{ row.skuName || '-' }}</span>
          </div>
        </template>
        <template #shipmentNo="{ row }">
          <ElLink type="primary" :underline="false">{{ row.shipmentNo }}</ElLink>
        </template>
        <template #purchaseOrderNo="{ row }">
          <ElLink type="primary" :underline="false">{{ row.purchaseOrderNo }}</ElLink>
        </template>
        <template #transportPlanName="{ row }">
          <span
            :class="
              getChannelTagClass(
                getChannelTagIndexByName(row.transportPlanName, summary?.amountByChannel ?? [], 0),
                row.transportPlanName
              )
            "
          >
            {{ formatChannelShortName(row.transportPlanName) }}
          </span>
        </template>
        <template #actualSignTime="{ row }">
          {{ row.actualSignTime || '' }}
        </template>
        <template #statusName="{ row }">
          <ElTag :type="getStatusTagType(row.statusName)" size="small">
            {{ row.statusName }}
          </ElTag>
        </template>
        <template #volume="{ row }">{{ row.volume }}</template>
        <template #grossWeight="{ row }">{{ formatWeight(row.grossWeight) }}</template>
        <template #unitFirstLegCost="{ row }"
          >¥{{ formatMoney(row.unitFirstLegCost)
          }}<span v-if="row.costType === 'estimate'" class="price-estimate-tag"
            >（预估）</span
          ></template
        >
        <template #totalFirstLegCost="{ row }">
          <span class="amount-highlight">¥{{ formatAmount(row.totalFirstLegCost) }}</span
          ><span v-if="row.costType === 'estimate'" class="price-estimate-tag">（预估）</span>
        </template>
        <template #transportMode="{ row }">
          {{ pubFilter(dictData['transport_method'], row?.transportMode) || '' }}
        </template>
        <template #billingMethod="{ row }">
          {{ BILLING_METHOD_MAP[row?.billingMethod] || '' }}
        </template>
      </ArtTable>
      <div v-if="summary" class="panel-footer">
        <span>
          共 {{ summary.batchCount }} 条 · 总数量 {{ summary.totalShipQty.toLocaleString() }} 件 ·
          总成本 ¥{{ formatAmount(summary.totalFirstLegCost) }}
        </span>
        <span class="panel-footer__hint">*数据按发货日期倒序排列</span>
      </div>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { computed, reactive, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElButton, ElCard, ElLink, ElTag } from 'element-plus'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import TableHeaderTip from '@/components/core/tables/table-header-tip/index.vue'
  import { useTable } from '@/composables/useTable'
  import type { BatchCostRow, DimensionType } from '../utils/mock-data'
  import {
    fetchBatchOrderDetail,
    type BatchOrderDetailRow,
    type BatchOrderDetailSummary
  } from '../utils/mock-batch-detail'
  import { logisticsCostBatchDetailsExport } from '@/api/logistics/batch-cost'

  interface SearchSelectOption {
    label: string
    value: string | number
  }
  import {
    formatChannelShortName,
    getChannelTagClass,
    getChannelTagIndexByName
  } from '../utils/channel-tag'
  import { divide, mul, pubFilter } from '@/utils/common-util'
  import { useDictStore } from '@/store/modules/dict'

  defineOptions({ name: 'BatchCostExpandPanel' })
  const { dictData } = useDictStore()
  const props = withDefaults(
    defineProps<{
      productRow: BatchCostRow
      /** 统计维度：与主列表一致（sku | spu） */
      dimension: DimensionType
      /** 与主列表一致，来自 pubGetchannelList */
      channelOptions?: SearchSelectOption[]
      /** 与主列表一致，物流状态 */
      statusOptions?: SearchSelectOption[]
      /** 主列表当前出货时间范围 */
      dateRange?: [string, string]
    }>(),
    {
      channelOptions: () => [],
      statusOptions: () => [],
      dateRange: undefined
    }
  )

  const emit = defineEmits<{
    collapse: [row: BatchCostRow]
  }>()

  const handleCollapse = () => {
    emit('collapse', props.productRow)
  }

  const router = useRouter()
  const summary = ref<BatchOrderDetailSummary | null>(null)

  const productCode = computed(() =>
    props.dimension === 'sku' ? props.productRow.sku : props.productRow.spu
  )

  const defaultDetailSearchForm = () => ({
    dateSearchType: 'shipTime',
    dateSearchValue: [] as string[],
    logisticsChannelIdList: [] as (string | number)[],
    transportStatusList: [] as string[]
  })

  const detailSearchForm = reactive(defaultDetailSearchForm())

  /** 搜索项与 batch-cost/index.vue 保持一致 */
  const detailSearchItems = computed(() => [
    {
      key: 'dateSearchValue',
      label: '',
      compositeSearch: true,
      selectOptions: [{ label: '出货时间', value: 'shipTime' }],
      selectKey: 'dateSearchType',
      selectWidth: '120px',
      inputType: 'daterange',
      placeholder: '开始日期,结束日期',
      width: '320px',
      datePickerProps: {
        valueFormat: 'YYYY-MM-DD'
      }
    },
    {
      key: 'logisticsChannelIdList',
      label: '',
      type: 'select',
      selectMultiple: true,
      placeholder: '物流渠道',
      width: '150px',
      alwaysFilterInput: true,
      props: {
        options: props.channelOptions,
        clearable: true,
        filterable: true,
        placeholder: '物流渠道'
      }
    },
    {
      key: 'transportStatusList',
      label: '',
      type: 'select',
      selectMultiple: true,
      placeholder: '物流状态',
      width: '150px',
      alwaysFilterInput: true,
      props: {
        options: props.statusOptions,
        clearable: true,
        filterable: true,
        placeholder: '物流状态'
      }
    }
  ])
  /** 计费方式映射（支持大小写） */
  const BILLING_METHOD_MAP: Record<string, string> = {
    WEIGHT: '按重量',
    VOLUME: '按体积',
    WEIGHT_VOLUME_MAX: '体积重和实重取大',
    weight: '按重量',
    volume: '按体积',
    weight_volume_max: '体积重和实重取大'
  }
  const detailColumns = [
    { prop: 'index', label: '#', width: 50, align: 'center', useSlot: true },
    { prop: 'waybillNo', label: '物流运单号', minWidth: 100, useSlot: true },
    { prop: 'sku', label: 'SKU', minWidth: 150, useSlot: true, hide: props.dimension !== 'spu' },
    { prop: 'shipTime', label: '出货时间', minWidth: 110 },
    { prop: 'shipmentNo', label: '货件号', minWidth: 130, useSlot: true },
    { prop: 'purchaseOrderNo', label: '采购订单号', minWidth: 130, useSlot: true },
    { prop: 'logisticsProviderCode', label: '物流商', minWidth: 88 },
    { prop: 'transportPlanName', label: '物流渠道', minWidth: 100, useSlot: true },
    { prop: 'expectedArrivalTime', label: '预计到达时间', minWidth: 110 },
    { prop: 'actualSignTime', label: '实际签收时间', minWidth: 110, useSlot: true },
    { prop: 'statusName', label: '物流状态', minWidth: 88, align: 'center', useSlot: true },
    { prop: 'shipQty', label: '发货数量', minWidth: 88, align: 'right' },
    { prop: 'volume', label: '总体积( m³)', minWidth: 96, align: 'right', useSlot: true },
    { prop: 'grossWeight', label: '总毛重(kg)', minWidth: 96, align: 'right', useSlot: true },
    {
      prop: 'unitFirstLegCost',
      label: '单个头程成本',
      minWidth: 160,
      align: 'right',
      useSlot: true
    },
    {
      prop: 'totalFirstLegCost',
      label: '头程总成本',
      minWidth: 170,
      align: 'right',
      useSlot: true,
      headerTip: '发货数量 × 单个头程成本'
    },
    { prop: 'sourceWarehouseName', label: '调出仓库', minWidth: 100 },
    { prop: 'destWarehouseName', label: '调入仓库', minWidth: 100 },
    { prop: 'gzNo', label: '物流跟踪号', minWidth: 100, checked: false },
    { prop: 'billingMethod', label: '实际计费方式', minWidth: 100, useSlot: true, checked: false },
    { prop: 'transportMode', label: '运输方式', minWidth: 100, useSlot: true, checked: false },
    { prop: 'logisticsPlanName', label: '物流方案', minWidth: 100, checked: false }
  ]

  /** 金额展示：有几位小数就展示几位（不补零、不强制两位），保留千分位分组 */
  function formatMoney(val: number) {
    const decimals = (String(val).split('.')[1] || '').length
    return val.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  function formatAmount(val: number) {
    return formatMoney(val)
  }

  function formatWeight(val: number) {
    const decimals = (String(val).split('.')[1] || '').length
    return val.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  function formatAmountPercent(amount: number) {
    const total = summary.value?.totalFirstLegCost ?? 0
    if (!total) return 0
    return Math.round(mul(divide(amount, total), 100))
  }

  function getStatusTagType(
    status: string
  ): 'primary' | 'success' | 'warning' | 'info' | undefined {
    if (status === '已发货') return 'primary'
    if (status === '已到达') return 'success'
    if (status === '待签收') return 'warning'
    if (status === '已签收') return 'info'
    return undefined
  }

  // function getStatusTagClass(status: number) {
  //   if (status === 4) return 'status-tag--pending'
  //   return ''
  // }

  function buildQuery() {
    const channelNames =
      detailSearchForm.logisticsChannelIdList?.length > 0
        ? props.channelOptions
            .filter((o) => detailSearchForm.logisticsChannelIdList.includes(o.value))
            .map((o) => o.label)
        : undefined
    const query = {
      channelNames,
      transportStatusList: detailSearchForm.transportStatusList,
      shipTimeFrom: props.dateRange?.[0] ?? null,
      shipTimeTo: props.dateRange?.[1] ?? null
    }
    if (
      detailSearchForm.dateSearchType === 'shipTime' &&
      detailSearchForm.dateSearchValue?.length
    ) {
      query.shipTimeFrom = detailSearchForm.dateSearchValue[0] || null
      query.shipTimeTo = detailSearchForm.dateSearchValue[1] || null
    }
    return query
  }

  const columnsFactory = () => detailColumns

  const {
    data: tableData,
    loading,
    columns,
    columnChecks,
    getData,
    updateColumn,
    resetColumns,
    pagination,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: async (params: any) => {
        const res = await fetchBatchOrderDetail(props.productRow, {
          ...buildQuery(),
          dimension: props.dimension,
          current: params?.currentPage,
          size: params?.pageSize
        })
        summary.value = res.summary
        return res
      },
      apiParams: { pageSize: 20 },
      immediate: false,
      columnsFactory,
      tableKey: 'batch-cost-expand-detail',
      tableName: 'batch-cost-expand-detail'
    },
    transform: {
      responseAdapter: (res: any) => ({
        records: res?.records ?? [],
        total: res?.total ?? 0
      })
    },
    performance: {
      // 查询条件来自外部 reactive，不进入请求参数，关闭缓存避免取到旧数据
      enableCache: false
    }
  })

  const loadData = () => {
    getData()
  }

  const logisticsBatchDetailExportHandler = (query: ReturnType<typeof buildQuery>) =>
    logisticsCostBatchDetailsExport({
      dimension: props.dimension,
      code: productCode.value,
      currentPage: 1,
      pageSize: 500,
      shipTimeStart: query.shipTimeFrom || '2026-04-01',
      shipTimeEnd: query.shipTimeTo || '2026-06-30',
      logisticsChannelNameList: query.channelNames || [],
      statusList: query.transportStatusList ?? []
    })

  const handleDetailSearch = () => {
    loadData()
  }

  const handleDetailReset = () => {
    Object.assign(detailSearchForm, defaultDetailSearchForm())
    loadData()
  }

  function goWaybillDetail(row: BatchOrderDetailRow) {
    router.push({
      name: 'WaybillDetail',
      query: { id: String(row.waybillId) }
    })
  }

  watch(
    () => props.productRow.id,
    () => {
      loadData()
    },
    { immediate: true }
  )
</script>

<style lang="scss" scoped>
  .batch-cost-expand-panel {
    padding: 12px 16px 26px;
    background: #fff;
  }

  :deep(.table-header) {
    margin-bottom: 4px !important;
  }

  :deep(.art-search-bar) {
    margin-bottom: 4px !important;
  }

  .panel-header {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .panel-header__main {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    min-width: 0;
  }

  .panel-title-tag {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    padding: 2px 8px;
    font-size: 12px;
    font-weight: 500;
    line-height: 20px;
    color: #fff;
    white-space: nowrap;
    background-color: var(--el-color-primary);
    border-radius: 4px;
  }

  .product-code {
    font-size: 14px;
    font-weight: 600;
    line-height: 22px;
    color: var(--el-text-color-primary);
    word-break: break-all;
  }

  .panel-subtitle {
    font-size: 13px;
    line-height: 22px;
    color: var(--el-text-color-secondary);
    white-space: nowrap;
  }

  .summary-cards {
    display: flex;
    gap: 0;
    align-items: stretch;
    margin-bottom: 12px;
  }

  .summary-stat-card,
  .summary-metric-card {
    border: 1px solid var(--el-border-color-lighter);
    border-right-width: 0;
    border-radius: 0;

    :deep(.el-card__body) {
      padding: 12px;
    }
  }

  .summary-stat-card {
    flex: 0 0 auto;
    min-width: 208px;
  }

  .summary-metric-card {
    flex: 1;
    min-width: 0;
  }

  .stat-card__label,
  .metric-card__label {
    margin-bottom: 6px;
    font-size: 12px;
    line-height: 1.4;
    color: var(--el-text-color-secondary);
  }

  .stat-card__value {
    display: flex;
    gap: 4px;
    align-items: baseline;
  }

  .stat-card__num {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--el-text-color-primary);

    &--primary {
      color: var(--el-color-primary);
    }
  }

  .stat-card__unit {
    font-size: 13px;
    color: var(--el-text-color-secondary);
  }

  .metric-card__value {
    font-size: 16px;
    font-weight: 600;
    line-height: 1.2;
    color: var(--el-text-color-primary);

    &--primary {
      color: var(--el-color-primary);
    }
  }

  .metric-card__divider {
    margin: 10px 0 12px;
    border-top: 1px dashed var(--el-border-color);
  }

  .metric-card__breakdown {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 6px 12px;
  }

  .breakdown-item {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 6px;
    align-items: center;
    min-width: 0;
    font-size: 12px;
    line-height: 18px;
  }

  .breakdown-amount {
    font-weight: 500;
    color: var(--el-text-color-primary);
    white-space: nowrap;
  }

  .breakdown-meta {
    font-size: 12px;
    color: var(--el-text-color-placeholder);
    white-space: nowrap;
  }

  .detail-list-title {
    display: flex;
    align-items: center;

    &__bar {
      flex-shrink: 0;
      width: 3px;
      height: 14px;
      margin-right: 8px;
      background-color: var(--el-color-primary);
      border-radius: 2px;
    }

    &__text {
      font-size: 14px;
      font-weight: 600;
      line-height: 22px;
      color: var(--el-text-color-primary);
    }
  }

  .detail-table-card {
    border: 1px solid var(--el-border-color-lighter);

    :deep(.el-card__body) {
      padding: 0 0 8px;
    }
  }

  .panel-footer {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    justify-content: space-between;
    padding: 8px 12px 0;
    font-size: 12px;
    color: var(--el-text-color-secondary);
  }

  .panel-footer__hint {
    margin-left: auto;
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  // .status-tag--pending {
  //   color: #909399;
  //   background-color: #f4f4f5;
  //   border-color: #e9e9eb;
  // }

  .amount-highlight {
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .price-estimate-tag {
    margin-left: 2px;
    font-weight: 400;
    color: #aaa;
  }

  .sku-cell {
    display: flex;
    flex-direction: column;
    line-height: 18px;

    &__code {
      color: var(--el-text-color-primary);
    }

    &__name {
      color: var(--el-text-color-secondary);
    }
  }
</style>

<style lang="scss">
  @use '../styles/channel-tag';
</style>
