<!-- 分批次明细展开面板：展开时懒加载 + 按 SKU 缓存 -->
<template>
  <div class="batch-cost-expand-panel" v-loading="loading">
    <div class="panel-header">
      <div class="panel-header__main">
        <span class="panel-title-tag">采购订单明细</span>
        <span class="product-code">{{ productCode }}</span>
        <span class="panel-subtitle">· 按采购订单展示</span>
      </div>
      <ElButton type="primary" link @click.stop="handleCollapse">收起</ElButton>
    </div>

    <div v-if="summary" class="summary-cards">
      <ElCard shadow="never" class="summary-stat-card">
        <div class="stat-card__label">总订单数</div>
        <div class="stat-card__value">
          <span class="stat-card__num stat-card__num--primary">{{ summary.orderCount }}</span>
          <span class="stat-card__unit">单</span>
        </div>
      </ElCard>

      <ElCard shadow="never" class="summary-stat-card">
        <div class="stat-card__label">总采购量</div>
        <div class="stat-card__value">
          <span class="stat-card__num">{{ summary.totalPurchaseQty.toLocaleString() }}</span>
          <span class="stat-card__unit">件</span>
        </div>
      </ElCard>

      <ElCard shadow="never" class="summary-stat-card">
        <div class="stat-card__label">总已交货量</div>
        <div class="stat-card__value">
          <span class="stat-card__num">{{ summary.totalInboundQty.toLocaleString() }}</span>
          <span class="stat-card__unit">件</span>
        </div>
      </ElCard>

      <ElCard shadow="never" class="summary-metric-card">
        <div class="metric-card__label">
          <TableHeaderTip label="总采购额（含税）" tip="选定周期内已交货的含税采购总额" />
        </div>
        <div class="metric-card__value metric-card__value--primary">
          ¥{{ formatMoney(summary.totalAmountIncludingTax) }}
        </div>
        <div class="metric-card__divider" />
        <div class="metric-card__breakdown">
          <div
            v-for="(item, idx) in summary.amountBySupplier"
            :key="item.name"
            class="breakdown-item"
          >
            <span
              :class="
                getSupplierTagClass(
                  getSupplierTagIndexByName(item.name, summary.amountBySupplier, idx),
                  item.name
                )
              "
            >
              {{ formatSupplierShortName(item.name) }}
            </span>
            <span class="breakdown-amount">¥{{ formatMoney(item.amount) }}</span>
            <span class="breakdown-meta">{{ formatAmountPercent(item.amount) }}%</span>
          </div>
        </div>
      </ElCard>

      <ElCard shadow="never" class="summary-metric-card">
        <div class="metric-card__label">
          <TableHeaderTip label="加权均价（含税）" tip="已交货含税总额 ÷ 总已交货数量" />
        </div>
        <div class="metric-card__value">¥{{ formatMoney(summary.weightedAvgPrice) }}</div>
        <div class="metric-card__divider" />
        <div class="metric-card__breakdown">
          <div v-for="(item, idx) in summary.avgBySupplier" :key="item.name" class="breakdown-item">
            <span
              :class="
                getSupplierTagClass(
                  getSupplierTagIndexByName(item.name, summary.amountBySupplier, idx),
                  item.name
                )
              "
            >
              {{ formatSupplierShortName(item.name) }}
            </span>
            <span class="breakdown-amount">¥{{ formatMoney(item.avg) }}</span>
            <span class="breakdown-meta">{{ item.qty.toLocaleString() }}件</span>
          </div>
        </div>
      </ElCard>
    </div>

    <div class="mt10">
      <ArtSearchBar
        v-model="detailSearchForm"
        :items="detailSearchItems"
        :showSearch="false"
        @reset="handleDetailReset"
        @search="handleDetailSearch"
      />
    </div>
    <ArtTableHeader
      v-model:columns="columnChecks"
      :loading="loading"
      tableName="purchase-batch-cost-expand-detail"
      @refresh="loadData"
      layout="refresh,down,columnsNew"
      :updateColumn="updateColumn"
      :resetColumns="resetColumns"
      :exportApi="purchaseOrderDetailExportHandler"
      :exportParams="buildQuery"
      exportAuth="purchase:batchCost:detailExport"
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
        :columns="columns"
        :column-checks="columnChecks"
        :pagination="pagination"
        :show-table-header="false"
        size="small"
        :autoHeight="true"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <template #index="{ $index }">
          {{ $index + 1 }}
        </template>
        <template #orderNo="{ row }">
          <ElLink type="primary" :underline="false" @click="goPurchaseOrderDetail(row)">
            {{ row.orderNo }}
          </ElLink>
        </template>
        <template #sku="{ row }">
          <div class="sku-cell">
            <span class="sku-cell__code">{{ row.sku || '-' }}</span>
            <span class="sku-cell__name">{{ row.skuName || '-' }}</span>
          </div>
        </template>
        <template #statusName="{ row }">
          <ElTag :type="getStatusTagType(row.status)" size="small">{{ row.statusName }}</ElTag>
        </template>
        <template #inboundQty="{ row }">
          {{ row.inboundQty.toLocaleString() }}
        </template>
        <template #pendingQty="{ row }">
          <span :class="{ 'qty-zero': row.pendingQty === 0 }">{{ row.pendingQty }}</span>
        </template>
        <template #unitPriceExcludingTax="{ row }">
          ¥{{ formatMoney(row.unitPriceExcludingTax) }}
        </template>
        <template #taxRate="{ row }">{{ row.taxRate }}%</template>
        <template #unitPriceIncludingTax="{ row }">
          <span class="price-highlight">¥{{ formatMoney(row.unitPriceIncludingTax) }}</span>
        </template>
        <template #amountExcludingTax="{ row }">
          ¥{{ formatAmount(row.amountExcludingTax) }}
        </template>
        <template #taxAmount="{ row }">¥{{ formatMoney(row.taxAmount) }}</template>
        <template #amountIncludingTax="{ row }">
          <span class="amount-highlight">¥{{ formatMoney(row.amountIncludingTax) }}</span>
        </template>
        <template #isOverdue="{ row }">{{ row.isOverdue ? '是' : '否' }}</template>
        <template #overdueDays="{ row }">{{ row.overdueDays }}</template>
      </ArtTable>
      <div v-if="summary" class="panel-footer">
        <span>
          共 {{ summary.orderCount }} 条，采购已交总量
          {{ summary.totalInboundQty.toLocaleString() }} 件，含税总额 ¥{{
            formatAmount(summary.totalAmountIncludingTax)
          }}
        </span>
        <span class="panel-footer__hint">* 数据按提单日期倒序排列</span>
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
  import { purchaseCostOrderDetailsExport } from '@/api/purchase/batch-cost'

  interface SearchSelectOption {
    label: string
    value: string | number
  }
  import {
    formatSupplierShortName,
    getSupplierTagClass,
    getSupplierTagIndexByName
  } from '../utils/supplier-tag'
  import { divide, mul } from '@/utils/common-util'

  defineOptions({ name: 'BatchCostExpandPanel' })

  const props = withDefaults(
    defineProps<{
      productRow: BatchCostRow
      /** 统计维度：与主列表一致（sku | spu） */
      dimension: DimensionType
      /** 与主列表一致，来自 pubGetSupplierList */
      supplierOptions?: SearchSelectOption[]
      /** 与主列表一致，采购状态 */
      statusOptions?: SearchSelectOption[]
      /** 主列表当前接单时间范围 */
      dateRange?: [string, string]
    }>(),
    {
      supplierOptions: () => [],
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
    dateSearchType: 'orderTime',
    dateSearchValue: [] as string[],
    supplierIdList: [] as (string | number)[],
    statusList: [] as (string | number)[]
  })

  const detailSearchForm = reactive(defaultDetailSearchForm())

  /** 搜索项与 batch-cost/index.vue 保持一致 */
  const detailSearchItems = computed(() => [
    {
      key: 'dateSearchValue',
      label: '',
      compositeSearch: true,
      selectOptions: [{ label: '接单时间', value: 'orderTime' }],
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
      key: 'supplierIdList',
      label: '',
      type: 'select',
      selectMultiple: true,
      placeholder: '供应商',
      width: '150px',
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      props: {
        options: props.supplierOptions,
        clearable: true
      }
    },
    {
      key: 'statusList',
      label: '',
      type: 'select',
      selectMultiple: true,
      placeholder: '采购状态',
      width: '140px',
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      props: {
        options: props.statusOptions,
        clearable: true
      }
    }
  ])

  const detailColumns = [
    { prop: 'index', label: '#', width: 50, align: 'center', useSlot: true },
    { prop: 'orderNo', label: '采购订单号', minWidth: 150, useSlot: true },
    { prop: 'sku', label: 'SKU', minWidth: 150, useSlot: true, hide: props.dimension !== 'spu' },
    { prop: 'orderTime', label: '接单时间', minWidth: 110 },
    { prop: 'supplierName', label: '供应商名称', minWidth: 100 },
    { prop: 'statusName', label: '采购单状态', minWidth: 96, align: 'center', useSlot: true },
    { prop: 'purchaseQty', label: '采购数量', minWidth: 88, align: 'right' },
    { prop: 'inboundQty', label: '已交货量', minWidth: 88, align: 'right', useSlot: true },
    {
      prop: 'pendingQty',
      label: '待交货量',
      minWidth: 88,
      align: 'right',
      useSlot: true,
      headerTip: '采购数量 - 已交货量'
    },
    {
      prop: 'unitPriceExcludingTax',
      label: '不含税单价',
      minWidth: 110,
      align: 'right',
      useSlot: true
    },
    { prop: 'taxRate', label: '税率', minWidth: 64, align: 'right', useSlot: true },
    {
      prop: 'unitPriceIncludingTax',
      label: '含税单价',
      minWidth: 110,
      align: 'right',
      useSlot: true,
      headerTip: '不含税单价 ×（1 + 税率）'
    },
    {
      prop: 'amountExcludingTax',
      label: '不含税金额',
      minWidth: 120,
      align: 'right',
      useSlot: true,
      headerTip: '已交货量 × 不含税单价'
    },
    { prop: 'taxAmount', label: '税额', minWidth: 120, align: 'right', useSlot: true },
    {
      prop: 'amountIncludingTax',
      label: '含税金额',
      minWidth: 140,
      align: 'right',
      useSlot: true,
      headerTip: '已交货量 × 含税单价'
    },
    {
      prop: 'isOverdue',
      label: '是否超期',
      minWidth: 80,
      align: 'right',
      useSlot: true,
      checked: false
    },
    {
      prop: 'overdueDays',
      label: '超期天数',
      minWidth: 100,
      align: 'right',
      useSlot: true,
      headerTip: '超过预计交付时间的自然天数'
    },
    { prop: 'purchaseManagerName', label: '采购负责人', minWidth: 96 },
    { prop: 'deliveryDate', label: '交付时间', minWidth: 96, checked: false },
    { prop: 'completeTime', label: '完成时间', minWidth: 96, checked: false },
    { prop: 'expectDeliveryDate', label: '预计交付时间', minWidth: 96, checked: false },
    {
      prop: 'itemDeliveryRate',
      label: 'SKU交付率',
      minWidth: 110,
      headerTip: '已交货量 ÷ 采购数量',
      checked: false
    }
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

  function formatAmountPercent(amount: number) {
    const total = summary.value?.totalAmountIncludingTax ?? 0
    if (!total) return 0
    return Math.round(mul(divide(amount, total), 100))
  }

  function getStatusTagType(status: number) {
    if (status === 6) return 'success'
    if (status === 5) return 'warning'
    if (status === 4) return 'info'
    return 'info'
  }

  /** 把 select 选中的 value(id) 翻译成 label(name) —— 后端期望名称数组 */
  function idsToLabels(
    ids: (string | number)[] | undefined,
    options: SearchSelectOption[]
  ): string[] {
    if (!ids?.length) return []
    return options.filter((o) => ids.includes(o.value)).map((o) => o.label)
  }

  function buildQuery() {
    const query = {
      supplierNameList: idsToLabels(detailSearchForm.supplierIdList, props.supplierOptions),
      orderStatusList: idsToLabels(detailSearchForm.statusList, props.statusOptions),
      orderTimeFrom: props.dateRange?.[0] ?? null,
      orderTimeTo: props.dateRange?.[1] ?? null
    }
    if (
      detailSearchForm.dateSearchType === 'orderTime' &&
      detailSearchForm.dateSearchValue?.length
    ) {
      query.orderTimeFrom = detailSearchForm.dateSearchValue[0] || null
      query.orderTimeTo = detailSearchForm.dateSearchValue[1] || null
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
          pageSize: params?.pageSize
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

  const purchaseOrderDetailExportHandler = (query: ReturnType<typeof buildQuery>) =>
    purchaseCostOrderDetailsExport({
      ...query,
      dimension: props.dimension,
      code: productCode.value,
      orderReceiveTimeStart: query.orderTimeFrom || '2026-04-01',
      orderReceiveTimeEnd: query.orderTimeTo || '2026-06-30',
      supplierNameList: query.supplierNameList ?? [],
      orderStatusList: query.orderStatusList ?? []
    })

  const handleDetailSearch = () => {
    loadData()
  }

  const handleDetailReset = () => {
    Object.assign(detailSearchForm, defaultDetailSearchForm())
    loadData()
  }

  function goPurchaseOrderDetail(row: BatchOrderDetailRow) {
    router.push({
      name: 'PurchaseOrderDetail',
      query: { purchaseId: String(row.purchaseOrderId) }
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

  .mt10 {
    margin-top: 18px;
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
    margin-bottom: 8px;
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
    min-width: 190px;
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
    // line-height: 1.2;
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
    // line-height: 1.2;
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
    font-size: 11px;
    color: var(--el-text-color-placeholder);
  }

  .qty-zero {
    color: var(--el-color-success);
  }

  .price-highlight {
    font-weight: 600;
    color: var(--el-color-primary);
  }

  .amount-highlight {
    font-weight: 600;
    color: #f56c6c;
  }
</style>

<style lang="scss">
  @use '../styles/supplier-tag';
</style>
