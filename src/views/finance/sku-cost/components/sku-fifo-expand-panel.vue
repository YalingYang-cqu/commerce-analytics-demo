<!-- 按 SKU 汇总-展开行：FIFO 流水明细面板（统计卡片 + ArtSearchBar + ArtTable） -->
<template>
  <div class="sku-fifo-expand-panel" v-loading="loading">
    <div>
      <div class="panel-header">
        <div class="panel-header__main">
          <ElTag type="primary" class="panel-title-tag" disable-transitions>FIFO 流水明细</ElTag>
          <span class="product-code">{{ productRow.sku }}</span>
          <span class="panel-subtitle">{{ productRow.skuName }}</span>
        </div>
        <ElButton type="primary" link @click.stop="handleCollapse">收起</ElButton>
      </div>

      <!-- 顶部统计卡片 -->
      <div class="summary-cards">
        <div class="summary-card">
          <div class="card-label">在售批次</div>
          <div class="card-value">
            <span class="num primary">{{ stats.activeBatches }}</span>
            <span class="unit">个</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-label">累计入库</div>
          <div class="card-value">
            <span class="num">{{ stats.cumulativeInbound.toLocaleString() }}</span>
            <span class="unit">件</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-label">剩余库存</div>
          <div class="card-value">
            <span class="num">{{ stats.remainingStock.toLocaleString() }}</span>
            <span class="unit">件</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-label">
            <TableHeaderTip label="库存价值" tip="Σ（当前剩余库存 × 单位综合成本）" />
          </div>
          <div class="card-value">
            <span class="num">¥{{ formatMoney(stats.stockValue) }}</span>
          </div>
        </div>
        <div class="summary-card">
          <div class="card-label">
            <TableHeaderTip
              label="加权综合成本"
              tip="Σ（当前剩余库存 × 单位综合成本）÷ Σ 当前剩余库存"
            />
          </div>
          <div class="card-value">
            <span class="num">¥{{ formatMoney(stats.weightedAvgCost) }}</span>
            <span class="unit">/件</span>
          </div>
        </div>
      </div>

      <!-- 二级筛选区 -->
      <ArtSearchBar
        v-model="searchForm"
        :items="searchItems"
        :showSearch="false"
        @reset="handleReset"
        @search="handleSearch"
      />

      <!-- FIFO 批次列表头：左侧标题 + 右侧 刷新/列设置 -->
      <ArtTableHeader
        v-model:columns="columnChecks"
        :loading="loading"
        tableName="finance-sku-fifo-expand"
        layout="refresh,down,columnsNew"
        :updateColumn="updateColumn"
        :resetColumns="resetColumns"
        :exportApi="skuFifoExportHandler"
        :exportParams="searchParams"
        @refresh="refreshData"
        exportAuth="finance:skuCost:costDetailExport"
      >
        <template #left>
          <div class="batch-list-title">
            <span class="batch-list-title__bar" />
            <span class="batch-list-title__text">FIFO 批次列表</span>
          </div>
        </template>
      </ArtTableHeader>

      <!-- FIFO 批次表格 -->
      <div>
        <ArtTable
          :loading="loading"
          :data="data"
          row-key="id"
          :autoHeight="true"
          :columns="columns"
          :columnChecks="columnChecks"
          :pagination="undefined"
          :show-table-header="false"
          size="small"
        >
          <template #fifoBatchNo="{ row }">
            <ElLink type="primary" :underline="false">{{ row.fifoBatchNo }}</ElLink>
          </template>
          <template #inboundQty="{ row }">{{ row.inboundQty.toLocaleString() }}</template>
          <template #remainingQty="{ row }">
            <span class="primary-text">{{ row.remainingQty.toLocaleString() }}</span>
          </template>
          <template #purchaseCost="{ row }">¥{{ formatMoney(row.purchaseCost) }}</template>
          <template #freightCost="{ row }"
            >¥{{ formatMoney(row.freightCost)
            }}<span v-if="row.costType === 'estimate'" class="price-estimate-tag"
              >（预估）</span
            ></template
          >
          <template #unitTotalCost="{ row }">
            <span class="primary-text">¥{{ formatMoney(row.unitTotalCost) }}</span>
          </template>
          <template #changeRatio="{ row }">
            <span v-if="row.changeRatio == null" class="flat">—</span>
            <span v-else-if="row.changeRatio === 0" class="flat">0.0%</span>
            <span v-else :class="row.changeRatio > 0 ? 'up' : 'down'">
              {{ row.changeRatio > 0 ? '↑' : '↓' }}
              {{ Math.abs(row.changeRatio) }}%
            </span>
          </template>
          <template #costBreakdown="{ row }">
            <div class="cost-bar">
              <el-tooltip
                :content="`采购：${getCostPct(row.costBreakdown).purchase.toFixed(2)}%`"
                placement="top"
                effect="light"
              >
                <div
                  class="cost-bar__segment cost-bar__segment--purchase"
                  :style="{ width: `${getCostPct(row.costBreakdown).purchase}%` }"
                />
              </el-tooltip>
              <el-tooltip
                :content="`头程：${getCostPct(row.costBreakdown).freight.toFixed(2)}%`"
                placement="top"
                effect="light"
              >
                <div
                  class="cost-bar__segment cost-bar__segment--freight"
                  :style="{ width: `${getCostPct(row.costBreakdown).freight}%` }"
                />
              </el-tooltip>
            </div>
          </template>
          <template #source="{ row }">
            <div class="source-cell">
              <ElLink type="primary" :underline="false">{{ row.sourcePoNo }}</ElLink>
              <span class="source-arrow">→</span>
              <ElLink type="primary" :underline="false">{{ row.sourceInboundNo }}</ElLink>
            </div>
          </template>
          <template #status="{ row }">
            <div class="status-cell">
              <ElTag :type="statusTagType(row.status)" size="small" disable-transitions>
                ● {{ row.statusLabel }}
              </ElTag>
              <span
                v-if="['consuming'].includes(row.status) && row.soldPercent != null"
                class="sold-tag"
              >
                已耗 {{ row.soldPercent }}%
              </span>
            </div>
          </template>
        </ArtTable>
        <span class="batch-list-title__meta">
          共 {{ stats.activeBatches }} 批；剩余
          {{ stats.remainingStock.toLocaleString() }} 件；库存价值
          <span class="primary-text">¥{{ formatMoney(stats.stockValue) }}</span>
        </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { ElButton, ElLink, ElTag } from 'element-plus'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import TableHeaderTip from '@/components/core/tables/table-header-tip/index.vue'
  import { useTable } from '@/composables/useTable'
  import { formatMoney } from '../utils/mock-data'
  import type { BatchDetailRow, SkuFifoBatchRow, SkuFifoStats, SkuSummaryRow } from '../utils/types'
  import { skuCostBatchesExport, skuCostFifoDetails } from '@/api/finance/sku-cost'
  import { add, divide, mul } from '@/utils/common-util'

  defineOptions({ name: 'SkuFifoExpandPanel' })

  const props = defineProps<{ productRow: SkuSummaryRow }>()
  const emit = defineEmits<{ (e: 'collapse'): void }>()

  /** 顶部统计卡片：与表格筛选无关，整 SKU 维度展示 */
  const stats = ref<SkuFifoStats>({
    activeBatches: 0,
    cumulativeInbound: 0,
    remainingStock: 0,
    stockValue: 0,
    weightedAvgCost: 0
  })

  /** 默认搜索表单 */
  const defaultSearchForm = () => ({
    /** 复合搜索：日期类型字段名（当前只有"入库日期"一种） */
    inboundDateType: 'inboundDate',
    /** 复合搜索：日期范围值 [from, to] */
    inboundDateRange: [] as string[],
    /** 批次状态多选：consuming / pending / consumed */
    status: [] as Array<SkuFifoBatchRow['status']>
  })
  const searchForm = ref(defaultSearchForm())

  /** ArtSearchBar 配置 */
  const searchItems = computed(() => [
    {
      key: 'inboundDateRange',
      label: '',
      compositeSearch: true,
      selectOptions: [{ label: '入库日期', value: 'inboundDate' }],
      selectKey: 'inboundDateType',
      selectWidth: '120px',
      inputType: 'daterange',
      placeholder: '开始日期,结束日期',
      width: '320px',
      datePickerProps: {
        type: 'daterange',
        valueFormat: 'YYYY-MM-DD',
        startPlaceholder: '开始日期',
        endPlaceholder: '结束日期',
        clearable: true
      }
    },
    {
      key: 'status',
      label: '',
      type: 'select',
      selectMultiple: true,
      placeholder: '批次状态',
      width: '160px',
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      props: {
        clearable: true,
        options: [
          { label: '已耗尽', value: 'consumed' },
          { label: '消耗中', value: 'consuming' },
          { label: '待消耗', value: 'pending' }
        ]
      }
    }
  ])

  /** ArtTable 列配置工厂 */
  const columnsFactory = () => [
    { prop: 'fifoBatchNo', label: 'FIFO 批次号', minWidth: 180, useSlot: true },
    { prop: 'inboundDate', label: '入库日期', width: 110 },
    { prop: 'inboundQty', label: '入库数量', width: 100, align: 'right', useSlot: true },
    {
      prop: 'remainingQty',
      label: '当前剩余数量',
      width: 120,
      align: 'right',
      useSlot: true,
      headerTip: '该批次未被消耗的数量'
    },
    { prop: 'purchaseCost', label: '采购成本', width: 100, align: 'right', useSlot: true },
    {
      prop: 'freightCost',
      label: '头程成本(分摊)',
      width: 150,
      align: 'right',
      useSlot: true
    },
    {
      prop: 'unitTotalCost',
      label: '单位综合成本',
      width: 120,
      align: 'right',
      useSlot: true,
      headerTip: '采购成本 + 头程分摊成本'
    },
    {
      prop: 'changeRatio',
      label: '较上批次',
      width: 100,
      align: 'center',
      useSlot: true,
      headerTip: '本批次与前一批次的成本差值'
    },
    {
      prop: 'costBreakdown',
      label: '成本构成',
      minWidth: 200,
      useSlot: true,
      headerTip: '蓝=采购占比，橙=头程占比'
    },
    { prop: 'source', label: '单据来源', minWidth: 220, useSlot: true },
    {
      prop: 'status',
      label: '状态',
      width: 180,
      useSlot: true,
      headerTip:
        '状态流转：待消耗 (active) → 消耗中 (partial) → 已耗尽 (cleared)\nactive（待消耗）：等待消耗，剩余数量 = 入库总量\npartial（消耗中）：正在消耗，0 ＜ 剩余数量 ＜ 入库总量\ncleared（已耗尽）：全部消耗完成，剩余数量 = 0'
    }
  ]

  const mapApiStatus = (status: string): BatchDetailRow['status'] => {
    if (status === 'partial') return 'consuming'
    if (status === 'active') return 'pending'
    return 'consumed'
  }

  const mapStatusToApi = (status: string) => {
    if (status === 'consuming') return 'partial'
    if (status === 'pending') return 'active'
    return 'cleared'
  }

  const mapApiBatch = (row: any): SkuFifoBatchRow => ({
    id: `${row.sku}-${row.batchSeq}`,
    imageUrl: row.imageUrl || '',
    sku: row.sku,
    skuName: row.skuName || '',
    fifoBatchNo: row.fifoBatchNo,
    inboundDate: row.batchDate,
    inboundQty: row.batchQty || 0,
    remainingQty: row.remainQty || 0,
    purchaseCost: row.unitPurchaseCost || 0,
    freightCost: row.unitLogisticsCost || 0,
    costType: row.costType,
    unitTotalCost: row.unitTotalCost || 0,
    changeRatio:
      typeof row.costDeltaPctVsPrev != 'number' ? null : mul(row.costDeltaPctVsPrev, 100),
    costBreakdown: {
      purchase: row.unitPurchaseCost || 0,
      freight: row.unitLogisticsCost || 0
    },
    sourcePoNo: row.poNo || '',
    sourceInboundNo: row.waybillNo || '',
    sourceType: 'purchase',
    status: mapApiStatus(row.status),
    soldPercent: typeof row.consumedPercent != 'number' ? undefined : mul(row.consumedPercent, 100),
    statusLabel: row.status === 'partial' ? `消耗中` : row.status === 'active' ? '待消耗' : '已耗尽'
  })

  /** 接口：按 props.productRow.sku 取批次 + 服务端式筛选 */
  const fetchBatchList = async (params: Record<string, any>) => {
    const sku = props.productRow.sku
    const statusList: string[] = Array.isArray(params.status) ? params.status : []
    const res: any = await skuCostFifoDetails({
      skuCode: sku,
      statusList: statusList.map(mapStatusToApi)
    })
    const payload = res.data || {}
    const summary = payload.summary || {}
    stats.value = {
      activeBatches: summary.inStockBatchCount || 0,
      cumulativeInbound: summary.totalInQty || 0,
      remainingStock: summary.currentStockQty || 0,
      stockValue: summary.stockValue || 0,
      weightedAvgCost: summary.weightedAvgCost || 0
    }
    let list = (payload.records || []).map(mapApiBatch)

    if (params.inboundDateRange?.[0] && params.inboundDateRange?.[1]) {
      const [from, to] = params.inboundDateRange
      list = list.filter((b) => b.inboundDate >= from && b.inboundDate <= to)
    }
    return { records: list, total: list.length }
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    searchParams,
    fetchData: getData,
    refreshData,
    resetSearchParams,
    updateColumn,
    resetColumns
  } = useTable({
    core: {
      apiFn: fetchBatchList,
      immediate: false,
      columnsFactory,
      tableKey: 'finance-sku-fifo-expand',
      tableName: 'finance-sku-fifo-expand',
      apiParams: { ...defaultSearchForm() }
    },
    transform: {
      // fetchBatchList 已返回 { records, total } 标准结构，
      // 绕开 defaultResponseAdapter 对 response.data 的强依赖
      responseAdapter: (res: any) => res
    },
    hooks: {
      resetFormCallback: () => {
        searchForm.value = defaultSearchForm()
      }
    }
  })

  const handleSearch = () => {
    Object.assign(searchParams, searchForm.value)
    getData()
  }
  const skuFifoExportHandler = (params: Record<string, any>) =>
    skuCostBatchesExport({
      currentPage: 1,
      pageSize: 500,
      skuCodeList: [props.productRow.sku],
      statusList: (params.status || []).map(mapStatusToApi),
      batchDateStart: params.inboundDateRange?.[0] || undefined,
      batchDateEnd: params.inboundDateRange?.[1] || undefined,
      sortBy: 'batchSeq',
      sortOrder: 'asc'
    })
  const handleReset = () => resetSearchParams()
  const handleCollapse = () => emit('collapse')

  /** SKU 切换：重新拉取（不重置筛选条件） */
  watch(
    () => props.productRow.sku,
    (sku) => {
      if (sku) getData()
    },
    { immediate: true }
  )

  /** 成本构成横向比例 */
  const getCostPct = (b: { purchase: number; freight: number }) => {
    const total = add(b.purchase, b.freight)
    return {
      purchase: total > 0 ? mul(divide(b.purchase, total), 100) : 0,
      freight: total > 0 ? mul(divide(b.freight, total), 100) : 0
    }
  }

  /** 状态标签颜色映射 */
  const statusTagType = (s: SkuFifoBatchRow['status']) =>
    s === 'consuming' ? 'success' : s === 'pending' ? 'primary' : 'info'
</script>

<style lang="scss" scoped>
  .sku-fifo-expand-panel {
    padding: 12px 16px 16px;
    background: var(--el-fill-color-light);

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 12px;

      &__main {
        display: flex;
        gap: 8px;
        align-items: center;
        font-size: 13px;
      }

      .panel-title-tag {
        margin-right: 4px;
      }

      .product-code {
        font-weight: 600;
        color: var(--el-color-primary);
      }

      .panel-subtitle {
        color: var(--el-text-color-secondary);
      }
    }

    .summary-cards {
      display: grid;
      grid-template-columns: repeat(5, minmax(0, 1fr));

      /* gap: 12px; */
      margin-bottom: 12px;

      .summary-card {
        padding: 12px 14px;
        background: #fff;
        border: 1px solid var(--el-border-color-lighter);

        /* border-radius: 6px; */
        &:not(:last-child) {
          border-right-width: 0;
        }

        .card-label {
          margin-bottom: 6px;
          font-size: 12px;
          color: var(--el-text-color-secondary);
        }

        .card-value {
          display: flex;
          gap: 4px;
          align-items: baseline;
          font-weight: 600;

          .num {
            font-size: 16px;
            color: var(--el-text-color-primary);

            &.primary {
              color: var(--el-color-primary);
            }
          }

          .unit {
            font-size: 12px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }

    .batch-list-title {
      display: flex;
      gap: 8px;
      align-items: center;

      &__bar {
        flex-shrink: 0;
        width: 3px;
        height: 14px;
        background-color: var(--el-color-primary);
        border-radius: 2px;
      }

      &__text {
        font-size: 14px;
        font-weight: 600;
        color: var(--el-text-color-primary);
      }

      &__meta {
        display: block;
        height: 40px;
        padding: 0 10px;
        font-size: 12px;
        line-height: 40px;
        color: var(--el-text-color-secondary);
      }
    }

    .batch-table-card {
      border: 1px solid var(--el-border-color-lighter);

      :deep(.el-card__body) {
        padding: 0 0 8px;
      }
    }

    .price-estimate-tag {
      margin-left: 2px;
      font-weight: 400;
      color: #aaa;
    }

    .primary-text {
      font-weight: 500;
      color: var(--el-color-primary);
    }

    :deep(.up) {
      color: #f56c6c;
    }

    :deep(.down) {
      color: #67c23a;
    }

    :deep(.flat) {
      color: #909399;
    }

    .cost-bar {
      display: flex;
      width: 100%;
      max-width: 200px;
      height: 8px;
      overflow: hidden;
      background: var(--el-fill-color);
      border-radius: 4px;
    }

    .cost-bar__segment {
      height: 100%;
    }

    .cost-bar__segment--purchase {
      background: #409eff;
    }

    .cost-bar__segment--freight {
      background: #f7ba2a;
    }

    .source-cell {
      display: flex;
      gap: 4px;
      align-items: center;
      font-size: 12px;

      .source-arrow {
        color: var(--el-text-color-placeholder);
      }
    }

    .status-cell {
      display: flex;
      gap: 4px;
      align-items: center;

      .sold-tag {
        color: #67c23a;
      }
    }
  }
</style>
