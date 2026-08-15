<template>
  <div class="sku-cost-page art-full-height" v-auth="'finance:skuCost:view'">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :showSearch="false"
      @reset="handleReset"
      @search="handleSearch"
    >
      <!-- SKU 输入框：尾部放大镜，点击/回车可查询 -->
      <template #sku="{ modelValue }">
        <ElInput
          v-model="modelValue.sku"
          size="small"
          placeholder="支持多 SKU 搜索"
          clearable
          style="width: 100%"
          @keyup.enter="handleSearch"
          @clear="handleSearch"
        >
          <template #suffix>
            <ElIcon style="cursor: pointer" @click="handleSearch">
              <Search />
            </ElIcon>
          </template>
        </ElInput>
      </template>
    </ArtSearchBar>

    <!-- 工具栏：左侧 tab 切换，右侧 刷新/列设置/导出 -->
    <!-- :key="view" 切换视图时重挂载，让 MkTableFilterDrag 按新 tableName 重新拉服务端列设置 -->
    <ArtTableHeader
      v-model:columns="columnChecks"
      :loading="loading"
      layout="refresh,down,columnsNew"
      :tableName="currentTableName"
      :key="view"
      @refresh="refreshData"
      :updateColumn="updateColumn"
      :resetColumns="resetColumns"
      :exportApi="skuCostExportHandler"
      :exportParams="searchParams"
      :asyncExport="true"
      :exportAuth="exportAuth"
    >
      <template #left>
        <ElSpace>
          <span class="sub-title"><i class="iconfont-custom">&#xe6ae;</i>视图</span>
          <ElRadioGroup v-model="view" size="small" class="view-tabs">
            <ElRadioButton value="summary"> 按 SKU 汇总 </ElRadioButton>
            <ElRadioButton value="batch"> 按批次明细 </ElRadioButton>
          </ElRadioGroup>
        </ElSpace>
      </template>
    </ArtTableHeader>

    <ElCard shadow="never" class="art-table-card">
      <!-- 提示 -->
      <ElAlert
        class="tip-alert"
        type="warning"
        :closable="false"
        show-icon
        title="综合成本 = 采购单价 + 物流分摊；FIFO 算法按批次先入先出消耗库存"
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
        tableKey="finance-sku-cost"
        class="sku-cost-table"
        :row-class-name="getExpandRowClassName"
        @expand-change="handleExpandChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
        @sort-change="handleSortChange"
      >
        <!-- 展开行：仅"按 SKU 汇总"视图下生效 -->
        <template #expand="{ row }">
          <SkuFifoExpandPanel
            v-if="view === 'summary' && expandedRowKeys.includes(row.id)"
            :product-row="row"
            @collapse="handleCollapseRow(row)"
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

        <!-- SKU 链接 -->
        <template #skuCell="{ row }">
          <ElLink type="primary" :underline="false">{{ row.sku }}</ElLink>
        </template>

        <!-- 库存数量（负数标红） -->
        <template #stockQtyCell="{ row }">
          <span :class="{ 'negative-stock': row.stockQty < 0 }">
            {{ row.stockQty.toLocaleString() }}
          </span>
        </template>

        <!-- 单价类金额（最早/最近批次成本） -->
        <template #moneyCell="{ row, prop }">
          <span>{{ formatMoneyOrDash(row[prop]) }}</span>
        </template>

        <!-- 在售批次成本（高亮 tag） -->
        <template #sellingBatchCost="{ row }">
          <ElTag
            v-if="row.sellingBatchCost != null"
            type="primary"
            effect="light"
            disable-transitions
            class="selling-cost-tag value-highlight"
          >
            ¥{{ formatMoney(row.sellingBatchCost) }}
          </ElTag>
          <span v-else>—</span>
        </template>

        <!-- 可售批次 -->
        <template #availableBatches="{ row }">
          <ElTag
            v-if="row.availableBatches > 0"
            type="success"
            effect="light"
            disable-transitions
            round
          >
            {{ row.availableBatches }} 批次
          </ElTag>
          <ElTag v-else type="danger" effect="light" disable-transitions round>无可用</ElTag>
        </template>

        <!-- 日均销量 -->
        <template #dailyAvgSalesCell="{ row }">
          <span>{{ row.dailyAvgSales == null ? '—' : row.dailyAvgSales.toLocaleString() }}</span>
        </template>

        <!-- 可售天数 -->
        <template #availableDays="{ row }">
          <span>{{ row.availableDays == null ? '—' : `${row.availableDays} 天` }}</span>
        </template>

        <!-- 预警 -->
        <template #warningCell="{ row }">
          <div v-if="row.warnings?.length" class="warning-cell">
            <ElTag
              v-for="w in row.warnings"
              :key="w.label"
              :type="warningTagType(w.type)"
              size="small"
              disable-transitions
              :class="{ 'turnover-tag': w.type === 'turnover' }"
              :effect="['costSurge', 'overdue'].includes(w.type) ? 'plain' : 'light'"
            >
              ● {{ w.label }}
            </ElTag>
          </div>
          <span v-else class="placeholder-text">—</span>
        </template>

        <!-- 趋势分析 -->
        <template #trendCell="{ row }">
          <div class="trend-cell">
            <ElLink
              type="primary"
              :underline="false"
              class="trend-link"
              @click="openTrendDialog(row)"
            >
              查看详情
              <ElIcon class="trend-arrow"><ArrowRight /></ElIcon>
            </ElLink>
          </div>
        </template>

        <!-- 成本明细 - 展开行入口 -->
        <template #detailEntry="{ row }">
          <ElLink
            type="primary"
            :underline="false"
            class="detail-link"
            @click="handleToggleExpand(row)"
          >
            查看明细
            <ElIcon
              class="detail-arrow"
              :class="{ 'is-expanded': expandedRowKeys.includes(row.id) }"
            >
              <ArrowRight />
            </ElIcon>
          </ElLink>
        </template>

        <!-- 数字千分位 -->
        <template #numberCell="{ row, prop }">
          <span>{{ Number(row[prop] ?? 0).toLocaleString() }}</span>
        </template>

        <!-- 当前剩余数量（高亮） -->
        <template #remainingQtyCell="{ row }">
          <span class="primary-text">{{ row.remainingQty.toLocaleString() }}</span>
        </template>

        <!-- 含 ¥ 的金额 -->
        <template #priceCell="{ row, prop }">
          <span>¥{{ formatMoney(row[prop]) }}</span>
        </template>

        <!-- 单位综合成本（高亮） -->
        <template #unitTotalCostCell="{ row }">
          <span class="primary-text">¥{{ formatMoney(row.unitTotalCost) }}</span>
        </template>

        <!-- 较上批次涨跌 -->
        <template #changeRatioCell="{ row }">
          <span v-if="row.changeRatio == null" class="flat">—</span>
          <span v-else-if="row.changeRatio === 0" class="flat">0.0%</span>
          <span v-else :class="row.changeRatio > 0 ? 'up' : 'down'">
            {{ row.changeRatio > 0 ? '↑' : '↓' }} {{ Math.abs(row.changeRatio) }}%
          </span>
        </template>

        <!-- 成本构成横向比例条 -->
        <template #costBreakdown="{ row }">
          <div class="cost-bar">
            <el-tooltip
              :content="`采购：${getCostBarPercent(row).purchase.toFixed(2)}%`"
              placement="top"
              effect="light"
            >
              <div
                class="cost-bar__segment cost-bar__segment--purchase"
                :style="{ width: `${getCostBarPercent(row).purchase}%` }"
              />
            </el-tooltip>
            <el-tooltip
              :content="`头程：${getCostBarPercent(row).freight.toFixed(2)}%`"
              placement="top"
              effect="light"
            >
              <div
                class="cost-bar__segment cost-bar__segment--freight"
                :style="{ width: `${getCostBarPercent(row).freight}%` }"
              />
            </el-tooltip>
          </div>
        </template>

        <!-- 单据来源 -->
        <template #sourceCell="{ row }">
          <div class="source-cell">
            <ElLink type="primary" :underline="false">{{ row.sourcePoNo }}</ElLink>
            <span class="source-arrow">→</span>
            <ElLink type="primary" :underline="false">{{ row.sourceInboundNo }}</ElLink>
          </div>
        </template>

        <!-- 批次状态 -->
        <template #statusCell="{ row }">
          <div class="status-cell">
            <ElTag :type="statusType(row.status)" size="small" disable-transitions>
              ● {{ statusLabel(row.status) }}
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
    </ElCard>

    <!-- 趋势分析弹窗 -->
    <SkuCostTrendDialog v-model:visible="trendDialogVisible" :product-row="trendDialogRow" />
  </div>
</template>

<script setup lang="ts">
  import { computed, defineAsyncComponent, nextTick, onMounted, ref, watch } from 'vue'
  import {
    ElAlert,
    ElCard,
    ElIcon,
    ElImage,
    ElInput,
    ElLink,
    ElRadioButton,
    ElRadioGroup,
    ElTag
  } from 'element-plus'
  import { ArrowRight, Picture, Search } from '@element-plus/icons-vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import { useTable } from '@/composables/useTable'
  import { pubBrandList, pubCategoryList } from '@/utils'
  import { formatMoney } from './utils/mock-data'
  import type { BatchDetailRow, SkuCostView, SkuSummaryRow, WarningType } from './utils/types'
  import {
    skuCostBatches,
    skuCostBatchesExport,
    skuCostFilterOptions,
    skuCostOverview,
    skuCostOverviewExport
  } from '@/api/finance/sku-cost'
  import { add, divide, mul } from '@/utils/common-util'

  defineOptions({ name: 'FinanceSkuCost' })

  const SkuFifoExpandPanel = defineAsyncComponent(
    () => import('./components/sku-fifo-expand-panel.vue')
  )
  const SkuCostTrendDialog = defineAsyncComponent(
    () => import('./components/sku-cost-trend-dialog.vue')
  )

  /** 趋势分析弹窗 */
  const trendDialogVisible = ref(false)
  const trendDialogRow = ref<SkuSummaryRow | null>(null)
  const openTrendDialog = (row: SkuSummaryRow) => {
    trendDialogRow.value = row
    trendDialogVisible.value = true
  }

  /** 当前视图 */
  const view = ref<SkuCostView>('summary')

  /** 展开行 */
  const tableRef = ref<{
    elTableRef?: { toggleRowExpansion: (row: unknown, expanded?: boolean) => void }
  }>()
  const expandedRowKeys = ref<string[]>([])

  const defaultSearchForm = () => ({
    siteList: [] as string[],
    platformList: [] as string[],
    brandIdList: [] as (string | number)[],
    categoryIdList: [] as (string | number)[],
    productStatusList: [] as (string | number)[],
    warningStatusList: [] as string[],
    sku: ''
  })
  const searchForm = ref(defaultSearchForm())
  /** 预警状态（多选）：库存周转 / 异常预警 / 成本异常 / 库存超期 */
  const WARNING_STATUS_OPTIONS = [
    { label: '正常', value: 'normal' },
    { label: '库存周转', value: 'turnover' },
    { label: '异常预警', value: 'abnormal' },
    { label: '成本异常', value: 'costSurge' },
    { label: '库存超期', value: 'overdue' }
  ]

  /** 品牌 / 分类：来自接口 */
  const brandList = ref<{ value: string | number; label: string }[]>([])
  const categoryList = ref<any[]>([])
  const isFrontendMode = import.meta.env.VITE_ACCESS_MODE === 'frontend'

  onMounted(async () => {
    if (isFrontendMode) {
      const costOptions = await skuCostFilterOptions()
      const data = (costOptions as any)?.data || {}
      brandList.value = (data.brands || []).map((item: any) => ({
        label: item.name,
        value: item.name
      }))
      categoryList.value = (data.categories || []).map((item: any) => ({
        id: item.name,
        categoryName: item.name
      }))
      return
    }
    const [brandRes, categoryRes, costOptionsRes] = await Promise.allSettled([
      pubBrandList({ brandStatus: null }),
      pubCategoryList({ status: null }),
      skuCostFilterOptions()
    ])
    brandList.value = brandRes.status === 'fulfilled' ? brandRes.value : []
    categoryList.value = categoryRes.status === 'fulfilled' ? categoryRes.value : []
    if (costOptionsRes.status === 'fulfilled') {
      const data = (costOptionsRes.value as any)?.data || {}
      brandList.value = (data.brands || []).map((item: any) => ({
        label: item.name,
        value: item.name
      }))
      categoryList.value = (data.categories || []).map((item: any) => ({
        id: item.name,
        categoryName: item.name
      }))
    }
  })

  const searchItems = computed(() => [
    // {
    //   key: 'siteList',
    //   label: '',
    //   type: 'select',
    //   selectMultiple: true,
    //   placeholder: '站点',
    //   width: '180px',
    //   alwaysFilterInput: true,
    //   labelValue: { name: 'label', value: 'value' },
    //   props: { options: SITE_OPTIONS, clearable: true }
    // },
    // {
    //   key: 'platformList',
    //   label: '',
    //   type: 'select',
    //   selectMultiple: true,
    //   placeholder: '销售平台',
    //   width: '160px',
    //   alwaysFilterInput: true,
    //   labelValue: { name: 'label', value: 'value' },
    //   props: { options: PLATFORM_OPTIONS, clearable: true }
    // },
    {
      key: 'brandIdList',
      label: '',
      type: 'select',
      selectMultiple: true,
      placeholder: '品牌',
      width: '160px',
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      props: { options: brandList.value, clearable: true }
    },
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
    // {
    //   key: 'productStatusList',
    //   label: '',
    //   type: 'select',
    //   selectMultiple: true,
    //   placeholder: '产品状态',
    //   width: '160px',
    //   alwaysFilterInput: true,
    //   labelValue: { name: 'label', value: 'value' },
    //   props: { options: PRODUCT_STATUS_OPTIONS, clearable: true }
    // },
    {
      key: 'warningStatusList',
      label: '',
      type: 'select',
      selectMultiple: true,
      placeholder: '预警状态',
      width: '160px',
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      props: { options: WARNING_STATUS_OPTIONS, clearable: true },
      // 按批次明细视图下隐藏预警状态筛选
      hidden: view.value === 'batch'
    },
    {
      key: 'sku',
      label: '',
      inputType: 'input',
      placeholder: '支持多 SKU 搜索',
      width: '220px',
      trigger: 'blur'
    }
  ])

  /** 列定义：按 view 切换 */
  const summaryColumns = () => [
    { type: 'expand', width: '50px', fixed: 'left' },
    { prop: 'image', label: '图片', width: 72, fixed: 'left', useSlot: true },
    {
      prop: 'sku',
      label: 'SKU',
      minWidth: 120,
      fixed: 'left',
      useSlot: true,
      slotName: 'skuCell'
    },
    { prop: 'skuName', label: '中文品名', minWidth: 160 },
    { prop: 'category', label: '分类', minWidth: 100 },
    {
      prop: 'stockQty',
      label: '库存数量',
      minWidth: 100,
      align: 'right',
      useSlot: true,
      slotName: 'stockQtyCell',
      headerTip:
        '基于 ERP 系统已有 SKU 映射关系，由本地 SKU 匹配前端销售 SKU，汇总海外仓、SC FBA、1P FBA 全渠道总库存。'
    },
    {
      prop: 'earliestBatchCost',
      label: '最早批次成本',
      minWidth: 120,
      align: 'right',
      useSlot: true,
      slotName: 'moneyCell',
      headerTip: '最早入库且未清的批次单位综合成本'
    },
    {
      prop: 'latestBatchCost',
      label: '最近批次成本',
      minWidth: 120,
      align: 'right',
      useSlot: true,
      slotName: 'moneyCell',
      headerTip: '最新入库批次的单位综合成本'
    },
    {
      prop: 'sellingBatchCost',
      label: '在售批次成本',
      minWidth: 130,
      align: 'right',
      useSlot: true,
      slotName: 'sellingBatchCost',
      headerTip: '当前正在消耗批次的单位综合成本'
    },
    {
      prop: 'availableBatches',
      label: '可售批次',
      minWidth: 100,
      align: 'center',
      useSlot: true,
      slotName: 'availableBatches',
      headerTip: '当前SKU剩余库存数大于0的FIFO批次数量'
    },
    {
      prop: 'dailyAvgSales',
      label: '日均销量',
      minWidth: 100,
      align: 'right',
      useSlot: true,
      slotName: 'dailyAvgSalesCell',
      headerTip:
        '基于 ERP 系统已有 SKU 映射关系，由本地 SKU 匹配前端销售 SKU，汇总统计 SC、VC 销售、VCDF 三类订单近 30 日平均每日销量。'
    },
    {
      prop: 'availableDays',
      label: '可售天数',
      minWidth: 120,
      align: 'center',
      useSlot: true,
      slotName: 'availableDays',
      sortable: 'custom',
      headerTip: '总库存数量 ÷ 近30日日均销量'
    },
    {
      prop: 'warnings',
      label: '预警',
      minWidth: 140,
      useSlot: true,
      slotName: 'warningCell',
      headerTip:
        '库存周转预警：可售天数＞60 天\n超卖预警：库存数量＜0\n成本异常：最新批次成本较上批次涨幅＞10%\n库存超期：最早批次在库时长＞180 天'
    },
    {
      prop: 'trendData',
      label: '趋势分析',
      minWidth: 160,
      align: 'center',
      useSlot: true,
      slotName: 'trendCell'
    },
    {
      prop: 'detail',
      label: '成本明细',
      minWidth: 120,
      align: 'center',
      fixed: 'right',
      useSlot: true,
      slotName: 'detailEntry'
    }
  ]

  const batchColumns = () => [
    { prop: 'image', label: '图片', width: 72, fixed: 'left', useSlot: true },
    {
      prop: 'sku',
      label: 'SKU',
      minWidth: 100,
      fixed: 'left',
      useSlot: true,
      slotName: 'skuCell'
    },
    { prop: 'skuName', label: '中文品名', minWidth: 140 },
    { prop: 'fifoBatchNo', label: 'FIFO 批次号', minWidth: 120 },
    { prop: 'inboundDate', label: '入库日期', width: 110 },
    {
      prop: 'inboundQty',
      label: '入库数量',
      width: 100,
      align: 'right',
      useSlot: true,
      slotName: 'numberCell'
    },
    {
      prop: 'remainingQty',
      label: '当前剩余数量',
      width: 120,
      align: 'right',
      useSlot: true,
      slotName: 'remainingQtyCell',
      headerTip: '该批次未被消耗的数量'
    },
    {
      prop: 'purchaseCost',
      label: '采购成本',
      width: 100,
      align: 'right',
      useSlot: true,
      slotName: 'priceCell'
    },
    {
      prop: 'freightCost',
      label: '头程成本(分摊)',
      width: 130,
      align: 'right',
      useSlot: true,
      slotName: 'priceCell'
    },
    {
      prop: 'unitTotalCost',
      label: '单位综合成本',
      width: 120,
      align: 'right',
      useSlot: true,
      slotName: 'unitTotalCostCell',
      headerTip: '采购成本 + 头程分摊成本'
    },
    {
      prop: 'changeRatio',
      label: '较上批次',
      width: 100,
      align: 'center',
      useSlot: true,
      slotName: 'changeRatioCell',
      headerTip: '本批次与前一批次的成本差值'
    },
    {
      prop: 'costBreakdown',
      label: '成本构成',
      minWidth: 160,
      useSlot: true,
      slotName: 'costBreakdown',
      headerTip: '蓝=采购占比，橙=头程占比'
    },
    {
      prop: 'source',
      label: '单据来源',
      minWidth: 220,
      useSlot: true,
      slotName: 'sourceCell'
    },
    {
      prop: 'status',
      label: '状态',
      width: 180,
      // fixed: 'right',
      useSlot: true,
      slotName: 'statusCell',
      headerTip:
        '状态流转：待消耗 (active) → 消耗中 (partial) → 已耗尽 (cleared)\nactive（待消耗）：等待消耗，剩余数量 = 入库总量\npartial（消耗中）：正在消耗，0 ＜ 剩余数量 ＜ 入库总量\ncleared（已耗尽）：全部消耗完成，剩余数量 = 0'
    }
  ]

  const columnsFactory = computed(() =>
    view.value === 'summary' ? summaryColumns() : batchColumns()
  )

  /** 列设置持久化 key：按视图分别存储，避免两个视图互相覆盖 */
  const currentTableName = computed(() =>
    view.value === 'summary' ? 'finance-sku-cost-summary' : 'finance-sku-cost-batch'
  )
  const exportAuth = computed(() =>
    view.value === 'summary' ? 'finance:skuCost:export' : 'finance:skuCost:batchDetailExport'
  )
  const alertTypeMap: Record<string, string> = {
    turnover: 'turnover',
    abnormal: 'oversold',
    costSurge: 'cost',
    overdue: 'expire'
  }

  const warningTypeMap: Record<string, WarningType> = {
    turnover: 'turnover',
    oversold: 'abnormal',
    cost: 'costSurge',
    expire: 'overdue'
  }

  const mapSummaryRow = (row: any): SkuSummaryRow => {
    const warnings = row.alertType
      ? [
          {
            type: warningTypeMap[row.alertType] || 'abnormal',
            label:
              row.alertType === 'turnover'
                ? '库存周转'
                : row.alertType === 'cost'
                  ? `成本异常${row.alertDeltaPct ? ` +${mul(row.alertDeltaPct, 100)}%` : ''}`
                  : row.alertType === 'expire'
                    ? '库存超期'
                    : '异常预警'
          }
        ]
      : []
    return {
      id: row.sku,
      imageUrl: row.imageUrl || '',
      sku: row.sku,
      skuName: row.skuName || '',
      category: row.categoryName || '',
      stockQty: row.stockQty || 0,
      earliestBatchCost: row.earliestBatchCost,
      latestBatchCost: row.latestBatchCost,
      sellingBatchCost: row.sellingBatchCost,
      availableBatches: row.inStockBatchCount || 0,
      dailyAvgSales: row.dailyAvgSales,
      availableDays: row.daysOfSupply,
      warnings,
      trendData: []
    }
  }

  const mapBatchStatus = (status: string): BatchDetailRow['status'] => {
    if (status === 'partial') return 'consuming'
    if (status === 'active') return 'pending'
    return 'consumed'
  }

  const mapBatchRow = (row: any): BatchDetailRow => ({
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
    unitTotalCost: row.unitTotalCost || 0,
    changeRatio: row.costDeltaPctVsPrev == null ? null : mul(row.costDeltaPctVsPrev, 100),
    costBreakdown: {
      purchase: row.unitPurchaseCost || 0,
      freight: row.unitLogisticsCost || 0
    },
    sourcePoNo: row.poNo || '',
    sourceInboundNo: row.waybillNo || '',
    sourceType: 'purchase',
    status: mapBatchStatus(row.status),
    soldPercent: row.consumedPercent == null ? undefined : Math.round(mul(row.consumedPercent, 100))
  })

  const buildApiParams = (params: Record<string, any>) => {
    const current = Number(params.currentPage ?? params.current ?? params.page ?? 1)
    const pageSize = Number(params.pageSize ?? params.size ?? 20)
    const skuCodes = params.sku
      ? String(params.sku)
          .split(/[,，\s]+/)
          .filter(Boolean)
      : []
    return {
      currentPage: current,
      pageSize,
      skuCodeList: skuCodes,
      brandNameList: params.brandIdList || [],
      categoryNameList: params.categoryIdList || [],
      alertTypeList: (params.warningStatusList || []).map(
        (item: string) => alertTypeMap[item] || item
      ),
      statusList: (params.status || []).map((item: string) =>
        item === 'consuming' ? 'partial' : item === 'pending' ? 'active' : 'cleared'
      ),
      sortBy: params.sortField,
      sortOrder: params.sortOrder || 'desc'
    }
  }

  const costApi = async (params: Record<string, any>) => {
    const apiParams = buildApiParams(params)
    const res: any =
      view.value === 'summary' ? await skuCostOverview(apiParams) : await skuCostBatches(apiParams)
    const rows = res.data?.records || []
    return {
      records: view.value === 'summary' ? rows.map(mapSummaryRow) : rows.map(mapBatchRow),
      total: res.data?.total || 0,
      current: res.data?.current || apiParams.currentPage,
      size: res.data?.size || apiParams.pageSize
    }
  }

  const skuCostExportHandler = (params: Record<string, any>) => {
    const apiParams = buildApiParams(params)
    return view.value === 'summary'
      ? skuCostOverviewExport(apiParams)
      : skuCostBatchesExport(apiParams)
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
      apiFn: costApi,
      immediate: true,
      columnsFactory,
      tableKey: 'finance-sku-cost',
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
      }
    }
  })

  /** 视图切换：列变化由 columnsFactory 自动响应；折叠所有展开行；重新拉一次 */
  watch(view, () => {
    expandedRowKeys.value = []
    getData()
  })

  const handleSearch = () => {
    Object.assign(searchParams, searchForm.value)
    getData()
  }
  const handleReset = async () => {
    await resetTableSearch()
  }

  /** 列排序：当前仅"可售天数"可排序 */
  const handleSortChange = ({
    prop,
    order
  }: {
    prop: string | null
    order: 'ascending' | 'descending' | null
  }) => {
    const sp = searchParams as Record<string, unknown>
    if (prop && order) {
      sp.sortField = prop
      sp.sortOrder = order === 'ascending' ? 'asc' : 'desc'
    } else {
      sp.sortField = undefined
      sp.sortOrder = undefined
    }
    getData()
  }

  /** 展开行交互 */
  const getTableRowById = (rowId: string) =>
    (data.value as Array<SkuSummaryRow & { id: string }>).find((r) => r.id === rowId)

  const toggleRowExpand = (row: SkuSummaryRow, expanded: boolean) => {
    const tableRow = getTableRowById(row.id) ?? row
    tableRef.value?.elTableRef?.toggleRowExpansion?.(tableRow, expanded)
  }
  const handleExpandChange = (row: SkuSummaryRow, expanded: boolean) => {
    if (expanded) {
      if (!expandedRowKeys.value.includes(row.id)) {
        expandedRowKeys.value = [...expandedRowKeys.value, row.id]
      }
    } else {
      expandedRowKeys.value = expandedRowKeys.value.filter((id) => id !== row.id)
    }
  }
  const handleToggleExpand = (row: SkuSummaryRow) => {
    if (expandedRowKeys.value.includes(row.id)) {
      handleCollapseRow(row)
      return
    }
    expandedRowKeys.value = [...expandedRowKeys.value, row.id]
    nextTick(() => toggleRowExpand(row, true))
  }
  const handleCollapseRow = (row: SkuSummaryRow) => {
    if (!expandedRowKeys.value.includes(row.id)) return
    expandedRowKeys.value = expandedRowKeys.value.filter((id) => id !== row.id)
    nextTick(() => toggleRowExpand(row, false))
  }
  const getExpandRowClassName = ({ row }: { row: SkuSummaryRow }) =>
    expandedRowKeys.value.includes(row.id) ? 'sku-cost-row-expanded' : ''

  /** 渲染辅助 */
  const formatMoneyOrDash = (n: number | null | undefined) =>
    n == null ? '—' : `¥${formatMoney(n)}`

  const warningTagType = (type: WarningType): 'danger' | 'warning' | 'info' | 'success' => {
    // 异常预警 / 库存超期 → 红；成本异常 / 库存周转 → 黄
    if (type === 'abnormal' || type === 'overdue') return 'danger'
    if (type === 'costSurge' || type === 'turnover') return 'warning'
    return 'info'
  }

  const statusLabel = (s: BatchDetailRow['status']) =>
    s === 'consuming' ? '消耗中' : s === 'pending' ? '待消耗' : '已消耗'
  const statusType = (s: BatchDetailRow['status']): 'success' | 'primary' | 'info' =>
    s === 'consuming' ? 'success' : s === 'pending' ? 'primary' : 'info'

  const getCostBarPercent = (row: BatchDetailRow) => {
    const total = add(row.costBreakdown.purchase, row.costBreakdown.freight)
    if (total <= 0) return { purchase: 0, freight: 0 }
    return {
      purchase: mul(divide(row.costBreakdown.purchase, total), 100),
      freight: mul(divide(row.costBreakdown.freight, total), 100)
    }
  }
</script>

<style lang="scss" scoped>
  .sku-cost-page {
    .view-tabs {
      .tab-icon {
        margin-right: 4px;
        vertical-align: -2px;
      }
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

    .tip-alert {
      width: fit-content;
      max-width: 100%;
      padding: 2px 12px;
      margin: 0 0 8px;
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

    .value-highlight {
      &::before {
        width: 5px;
        height: 5px;
        margin-right: 6px;
        content: '';
        background: #5d87ff;
        border-radius: 50%;
        box-shadow: 0 0 0 3px rgb(46 92 255 / 18%);
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

    .negative-stock {
      font-weight: 600;
      color: #f56c6c;
    }

    .selling-cost-tag {
      font-weight: 600;
    }

    .warning-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;

      /* 库存周转预警：自定义配色 */
      :deep(.el-tag.turnover-tag) {
        color: #4338ca;
        background-color: #f3e8ff;
        border-color: #c7d2fe;

        .el-tag__content {
          color: #4338ca;
        }
      }
    }

    .placeholder-text {
      color: var(--el-text-color-placeholder);
    }

    .trend-cell {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: center;

      .trend-link {
        font-size: 12px;

        .trend-arrow {
          margin-left: 2px;
          font-size: 12px;
        }
      }
    }

    .detail-link {
      font-size: 12px;

      .detail-arrow {
        margin-left: 2px;
        font-size: 12px;
        transition: transform 0.2s;
      }

      /* 展开时箭头由朝右旋转为朝下 */
      .detail-arrow.is-expanded {
        transform: rotate(90deg);
      }
    }

    .primary-text {
      font-weight: 500;
      color: var(--el-color-primary);
    }

    .up {
      color: #f56c6c;
    }

    .down {
      color: #67c23a;
    }

    .flat {
      color: #909399;
    }

    .cost-bar {
      display: flex;
      width: 100%;
      max-width: 180px;
      height: 8px;
      overflow: hidden;
      background: var(--el-fill-color);
      border-radius: 4px;

      &__segment {
        height: 100%;

        &--purchase {
          background: #409eff;
        }

        &--freight {
          background: #f7ba2a;
        }
      }
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

    /* :deep(.sku-cost-table) {
      .sku-cost-expand-col {
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
        padding: 0 !important;
        background-color: var(--el-fill-color-light) !important;
      }

      tr.sku-cost-row-expanded > td.el-table__cell {
        background-color: var(--el-fill-color-light) !important;
      }
    } */

    :deep(.spark-empty) {
      color: var(--el-text-color-placeholder);
    }
  }
</style>
