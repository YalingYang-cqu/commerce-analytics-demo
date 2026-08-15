<!-- Sc 订单利润·明细表：用法对齐 sale-analysis/asin/daily-board-table
     ArtTableHeaderGroup(列设置) + ArtTableGroup(分组彩条)，列通过 group 字段归属分组。
     列配置按 Tab 从 ../columns 引入（看板原样抽离；产品/订单对齐 demo）。造假数据 + 日期下钻。 -->
<template>
  <ElCard shadow="never" class="dt-card">
    <ArtTableHeaderGroup
      v-model:columns="columnChecks"
      layout="refresh,down,columnsNew"
      :tableName="tableName"
      :groups="columnGroups"
      :checkbox-columns="3"
      :loading="loading"
      exportAuth="finance:scProfit:export"
      :export-api="exportWithLimitGuard"
      :export-params="exportParams"
      :async-export="true"
      @refresh="onRefresh"
    >
      <template #left>
        <div class="dt-toolbar-left">
          <!-- 费用分摊：打开口径说明抽屉 -->
          <button type="button" class="dt-alloc-btn" @click="allocOpen = true">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 11l3 3L22 4" />
              <path d="M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11" />
            </svg>
            费用分摊
            <svg class="cv" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>
          <!-- 订单 tab：结算状态 / 利润状态筛选（对齐 demo tool-select） -->
          <template v-if="isOrderTab">
            <ElSelect
              v-model="settlement"
              class="dt-tool-select"
              size="small"
              title="结算状态筛选"
              @change="syncSearchAndReload"
            >
              <ElOption
                v-for="o in settlementOptions"
                :key="o.value"
                :label="o.label"
                :value="o.value"
              />
            </ElSelect>
            <!-- 利润状态：自定义下拉，选项右侧显示数量（对齐 demo / 设计图） -->
            <div ref="profitStatusWrapRef" class="profit-status-wrap">
              <button
                type="button"
                class="profit-status-btn"
                :class="{ active: profitMenuOpen }"
                title="利润状态筛选"
                @click="profitMenuOpen = !profitMenuOpen"
              >
                {{ PROFIT_STATUS_LABEL[profitStatus] || PROFIT_STATUS_LABEL.all }}
              </button>
              <div class="profit-status-menu" :class="{ open: profitMenuOpen }">
                <button
                  v-for="o in profitStatusOptions"
                  :key="o.value"
                  type="button"
                  class="profit-status-option"
                  :class="{ active: profitStatus === o.value }"
                  @click="onProfitStatusSelect(o.value)"
                >
                  <span>{{ o.label }}</span>
                  <span class="cnt">{{ formatCount(profitStatusCounts[o.value] || 0) }}</span>
                </button>
              </div>
            </div>
          </template>
          <!-- msg：口径提示（样式对齐 demo order-detail-note；默认文案随 tab，可通过 #msg 覆盖） -->
          <!-- <span class="dt-msg">
            <slot name="msg">{{ defaultMsg }}</slot>
          </span> -->
          <!-- 非订单：卡片筛选用标签展示；订单：筛选名并入 dt-tt-meta（对齐 demo ttCount） -->
          <span v-if="filterLabel && !isOrderTab" class="dt-filter-tag">
            已筛选：{{ filterLabel }}
            <i class="dt-filter-close" title="取消筛选" @click="emit('clear-filter')">×</i>
          </span>
          <!-- 订单 tab：维度/口径/指标卡筛选/排序说明（对齐 demo ttCount） -->
          <span v-if="isOrderTab" class="dt-tt-meta">{{ orderMetaText }}</span>
        </div>
      </template>
    </ArtTableHeaderGroup>

    <AllocationDrawer v-model="allocOpen" />

    <ArtTableGroup
      ref="tableRef"
      :data="data"
      :columns="columns"
      :column-checks="columnChecks"
      :groups="columnGroups"
      row-key="_key"
      :tree-props="{ children: '_children' }"
      :indent="0"
      :loading="loading"
      :border="true"
      :pagination="pagination"
      :scroll-page-to-top-on-page-change="false"
      :show-table-header="false"
      :auto-height="!fillViewport"
      :tableName="tableName"
      :row-class-name="rowClass"
      show-summary
      summary-position="top"
      :summary-method="summaryMethod"
      empty-text="暂无数据"
      class="dt-table"
      :height="tableHeight"
      :default-sort="defaultTableSort"
      @expand-change="onExpandChange"
      @sort-change="handleSortChange"
      @pagination:size-change="onSizeChange"
      @pagination:current-change="onCurrentChange"
    >
      <!-- 树展开列（看板=日期 / 产品=图片首列 / 订单=订单号）
           子行：图片列 / 订单号列均加 L 折线；订单号子行不重复展示订单号，避免像多条独立订单 -->
      <template #treeCell="{ row, prop }">
        <span
          class="dt-date-cell"
          :class="{
            'is-child': row._isChild,
            'is-img': prop === 'image',
            'is-orderno': prop === 'orderNo'
          }"
        >
          <!-- 父行始终占 18px 展开槽；多明细订单显示层级展开图标 -->
          <span v-if="!row._isChild" class="dt-expand-slot">
            <button
              v-if="row._children?.length"
              class="expand-toggle"
              type="button"
              :class="{ open: expandedKeys.has(row._key) }"
              title="展开明细"
              @click.stop="toggleExpand(row)"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
                <path d="m9 6 6 6-6 6" />
              </svg>
            </button>
          </span>
          <!-- 子行层级折线：仅图片列（订单号列不画折线） -->
          <i
            v-else-if="row._isChild && prop === 'image'"
            class="dt-tree-elbow"
            aria-hidden="true"
          />
          <ElImage
            v-if="prop === 'image' && getUrl(row.image)"
            :src="getUrl(row.image)"
            :preview-src-list="[getUrl(row.image)]"
            :preview-teleported="true"
            fit="cover"
            class="dt-img"
            :class="{ 'is-sm': row._isChild }"
            @click.stop
          />
          <span
            v-else-if="prop === 'image'"
            class="dt-img-ph"
            :class="{ 'is-sm': row._isChild }"
            title="图片"
          >
            <ElIcon><Picture /></ElIcon>
          </span>
          <span v-else class="dt-date">{{ row[prop] ?? EMPTY }}</span>
        </span>
      </template>

      <!-- 维度/基础信息文本列；ASIN 点击跳转亚马逊商品页（对齐 demo amazonLink） -->
      <template #text="{ row, prop }">
        <ElImage
          v-if="prop === 'image' && getUrl(row.image)"
          :src="getUrl(row.image)"
          :preview-src-list="[getUrl(row.image)]"
          :preview-teleported="true"
          fit="cover"
          class="dt-img"
          @click.stop
        />
        <span v-else-if="prop === 'image'" class="dt-img-ph" title="图片">
          <ElIcon><Picture /></ElIcon>
        </span>
        <a
          v-else-if="prop === 'asin' && row.asin"
          class="dt-amazon-link"
          :href="amazonAsinUrl(row)"
          target="_blank"
          rel="noopener noreferrer"
          title="打开亚马逊商品页"
          @click.stop
        >
          {{ row.asin }}
        </a>
        <!-- SPU 列：编码在上、SPU 名称在下（对齐设计图） -->
        <span v-else-if="prop === 'spu'" class="dt-code-name">
          <span class="dt-code">{{ row.spu ?? EMPTY }}</span>
          <span v-if="row.spuName" class="dt-name" :title="row.spuName">{{ row.spuName }}</span>
        </span>
        <span v-else class="dt-text">{{ row[prop] ?? EMPTY }}</span>
      </template>

      <!-- ASIN Tab：ASIN 链接 + 测算（对齐 demo .asin-action / .scenario-btn） -->
      <template #asinAction="{ row }">
        <span class="dt-asin-action">
          <a
            v-if="row.asin"
            class="dt-amazon-link"
            :href="amazonAsinUrl(row)"
            target="_blank"
            rel="noopener noreferrer"
            title="打开亚马逊商品页"
            @click.stop
          >
            {{ row.asin }}
          </a>
          <span v-else class="dt-text">{{ EMPTY }}</span>
          <button
            v-if="row.asin && row._level !== 'summary'"
            type="button"
            class="dt-scenario-btn"
            title="ASIN 利润测算"
            @click.stop="openAsinScenario(row)"
          >
            测算
          </button>
        </span>
      </template>

      <!-- 通用数值单元格；费用下钻仅渲染按钮，明细由页级共享浮层点击时挂载 -->
      <template #cell="{ row, prop }">
        <button
          v-if="canDrill(row, prop)"
          type="button"
          class="dt-cost-drill"
          :class="cellClass(prop, row[prop])"
          @click="onDrillClick(row, prop, $event)"
        >
          <span class="dt-cost-value">{{ cellText(prop, row[prop]) }}</span>
          <ElIcon class="chev"><ArrowDown /></ElIcon>
        </button>
        <span v-else-if="isDrilldownProp(prop)" class="dt-cost-static">
          <span class="dt-cost-value" :class="cellClass(prop, row[prop])">{{
            cellText(prop, row[prop])
          }}</span>
          <span class="dt-cost-chev-placeholder" aria-hidden="true"></span>
        </span>
        <span v-else :class="cellClass(prop, row[prop])">{{ cellText(prop, row[prop]) }}</span>
      </template>

      <!-- 利润率：按阈值三档着色（≥20% 绿 / 8%~20% 黄 / <8% 红） -->
      <template #margin="{ row }">
        <span class="dt-rate-pill" :class="marginTier(row.margin)">
          {{ cellText('margin', row.margin) }}
        </span>
      </template>

      <!-- 广告销量占比 / 广告 ACoS：绿红标签 -->
      <template #rateTag="{ row, prop }">
        <span v-if="row[prop] === null || row[prop] === undefined" class="dt-cell dt-muted">{{
          EMPTY
        }}</span>
        <span v-else class="dt-rate-pill" :class="rateTagTier(prop, row[prop])">
          {{ cellText(prop, row[prop]) }}
        </span>
      </template>

      <!-- 利润详情：拆解标签（样式对齐 demo .detail-link） -->
      <template #trend="{ row }">
        <button
          type="button"
          class="dt-detail-link"
          title="查看费用详情与趋势"
          @click="openProfitDrawer(row)"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="9" />
            <path d="M12 7v5l3 2" />
          </svg>
          拆解
        </button>
      </template>
    </ArtTableGroup>

    <ProfitBreakdownDrawer
      v-model="profitDrawerOpen"
      :row="profitDrawerRow"
      :active-tab="activeTab"
      :date-grain="String(searchForm?.dateGrain || 'day')"
      :date-range="(searchForm?.dateRange as string[]) || []"
    />

    <AsinScenarioDrawer v-model="scenarioOpen" :base="scenarioBase" />

    <!-- 全表共用费用明细浮层：仅打开时挂载 DOM -->
    <Teleport to="body">
      <div
        v-if="drillOpen"
        ref="drillPopperRef"
        class="dt-cost-popper dt-cost-popper-shared"
        :style="drillPopperStyle"
      >
        <div class="dt-cost-pop">
          <div v-if="drillLoading" class="dt-cost-pop-loading">
            <ElIcon class="is-loading"><Loading /></ElIcon>
            <span>查询中...</span>
          </div>
          <template v-else>
            <div
              v-for="(item, idx) in drillItems"
              :key="idx"
              class="dt-cost-pop-row"
              :class="{ total: item.total }"
            >
              <span class="k">{{ item.label }}</span>
              <span class="v">{{ formatDrillValue(drillProp, item.value) }}</span>
            </div>
          </template>
        </div>
      </div>
    </Teleport>
  </ElCard>
</template>

<script setup lang="ts">
  import {
    computed,
    ref,
    watch,
    onMounted,
    onBeforeUnmount,
    nextTick,
    h,
    type VNode,
    type CSSProperties
  } from 'vue'
  import { onClickOutside, useWindowSize } from '@vueuse/core'
  import { ElCard, ElSelect, ElOption, ElIcon, ElImage, ElMessage } from 'element-plus'
  import { ArrowDown, Loading, Picture } from '@element-plus/icons-vue'
  import { getUrl } from '@/utils/common-util'
  import { add, mul, divide } from '@/utils/dataprocess'
  import { useTable } from '@/composables/useTable'
  import ArtTableGroup from '@/components/core/tables/art-table-group/index.vue'
  import ArtTableHeaderGroup from '@/components/core/tables/art-table-header-group/index.vue'
  import AllocationDrawer from './allocation-drawer.vue'
  import ProfitBreakdownDrawer from './profit-breakdown-drawer.vue'
  import AsinScenarioDrawer, { type AsinScenarioBase } from './asin-scenario-drawer.vue'
  import { renderSummaryDrillCell } from './summary-cells'
  import type { DimType } from '../metrics'
  import {
    FIELD_META,
    FIELD_LABEL,
    buildDetailColumns,
    getColumnGroups,
    normalizeDetailTab,
    summaryLabelProp,
    isDrilldownProp,
    resolveDrillParent,
    type DrillRow
  } from '../columns'
  import {
    orderProfitDetail,
    orderProfitStatusCount,
    orderProfitFeeDrilldown,
    orderProfitExport,
    buildOrderProfitFilter,
    resolveOrderProfitGranularity,
    type OrderProfitBaseFilter,
    type OrderProfitDetailQuery,
    type OrderProfitFeeDrilldown
  } from '@/api/finance/sc-profit'
  import { formatMoney } from '../currency'
  import { resolveDetailPageRecords } from '../pagination'
  import { formatPercent, resolveMetricProfitStatus, toDisplayAmount } from '../presentation'
  import { resolveDefaultDetailSort } from '../sorting'
  import {
    assertOrderProfitExportWithinLimit,
    buildOrderProfitExportQuery,
    ORDER_PROFIT_EXPORT_MAX_ROWS
  } from '../export'

  defineOptions({ name: 'ProfitDetailTable' })

  const props = withDefaults(
    defineProps<{
      /** 顶部搜索条件（含 dateRange / dateGrain / keyword 等），作为查询条件 */
      searchForm: Record<string, any>
      /** 当前维度：dashboard / product / order */
      dimType: DimType
      /** 顶部 Tab（看板/父ASIN/ASIN/MSKU/SPU/订单），用于列配置与 msg */
      activeTab?: string
      /** 经营总览是否展开（产品 Tab 收起时表格撑满剩余视口） */
      overviewOpen?: boolean
      /** 卡片明细筛选 key（''=未筛选），作为查询条件 */
      filterKey?: string
    }>(),
    { activeTab: 'dashboard', overviewOpen: true, filterKey: '' }
  )

  const emit = defineEmits<{ (e: 'clear-filter'): void }>()

  /** 当前明细 Tab（列配置按 Tab 区分） */
  const detailTab = computed(() => normalizeDetailTab(props.activeTab))
  /**
   * 列设置持久化维度：看板 / 订单各自独立；父ASIN·ASIN·MSKU·SPU 归一为 product 共享一套。
   * 与顶部指标卡配置 CardSetting（finance-sc-profit-${dimType}）保持一致；服务端习惯仅存可配置列，
   * 四个产品 tab 可配置列集合相同，isInSync 通过后即共享显隐/顺序。
   */
  const persistTab = computed(() =>
    detailTab.value === 'dashboard'
      ? 'dashboard'
      : detailTab.value === 'order'
        ? 'order'
        : 'product'
  )
  /** 持久化 key：产品四 tab 共享（product），看板/订单独立 */
  const tableName = computed(() => `finance-sc-profit-detail-${persistTab.value}`)
  /** 费用分摊抽屉 */
  const allocOpen = ref(false)

  /** msg 默认文案（对齐 demo orderDetailNote） */
  const PRODUCT_TABS = new Set(['parentAsin', 'asin', 'msku', 'spu'])
  const isOrderTab = computed(() => props.activeTab === 'order')
  const isProductTab = computed(() => PRODUCT_TABS.has(props.activeTab || ''))
  /** 默认排序箭头与真实请求保持一致。 */
  const defaultTableSort = computed(() => {
    const sort = resolveDefaultDetailSort(detailTab.value)
    return sort.sortField
      ? {
          prop: sort.sortField,
          order: sort.sortOrder === 'asc' ? ('ascending' as const) : ('descending' as const)
        }
      : undefined
  })
  /**
   * 撑满剩余视口（经 height 传入）：
   * - 订单 Tab：始终
   * - 看板 / 父ASIN/ASIN/MSKU/SPU：overview 收起时
   */
  const fillViewport = computed(
    () =>
      isOrderTab.value ||
      ((props.activeTab === 'dashboard' || isProductTab.value) && !props.overviewOpen)
  )
  // const defaultMsg = computed(() => {
  //   if (props.activeTab === 'dashboard') {
  //     return '经营总览默认近30天，趋势用于判断规模、利润和效率变化'
  //   }
  //   if (PRODUCT_TABS.has(props.activeTab)) {
  //     return '对象诊断页：上方看趋势，下方用于对象对比、排序和利润拆解'
  //   }
  //   if (isOrderTab.value) {
  //     return '指标卡仅筛选下方订单明细'
  //   }
  //   return ''
  // })

  // ============ 订单 tab 筛选（对齐 demo settlementFilter / profitStatusFilter） ============
  const SETTLEMENT_LABEL: Record<string, string> = {
    all: '全部结算状态',
    unsettled: '未结算订单',
    settled: '已结算订单'
  }
  const PROFIT_STATUS_ORDER = ['all', 'loss', 'low', 'normal', 'high'] as const
  const PROFIT_STATUS_LABEL: Record<string, string> = {
    all: '全部利润状态',
    loss: '亏损订单',
    low: '低毛利订单',
    normal: '正常盈利订单',
    high: '高毛利订单'
  }
  const settlementOptions = Object.entries(SETTLEMENT_LABEL).map(([value, label]) => ({
    value,
    label
  }))
  const profitStatusOptions = PROFIT_STATUS_ORDER.map((value) => ({
    value,
    label: PROFIT_STATUS_LABEL[value]
  }))
  const settlement = ref('all')
  const profitStatus = ref('all')
  const profitMenuOpen = ref(false)
  const profitStatusWrapRef = ref<HTMLElement | null>(null)
  onClickOutside(profitStatusWrapRef, () => {
    profitMenuOpen.value = false
  })

  /** 利润状态各档计数（订单 Tab 下拉右侧数量），由 profit-status-count 接口填充 */
  const profitStatusCounts = ref<Record<string, number>>({
    all: 0,
    loss: 0,
    low: 0,
    normal: 0,
    high: 0
  })
  const formatCount = (n: number): string => n.toLocaleString('en-US')

  /** 指标卡筛选展示名（订单三卡 / 看板·对象待处理项） */
  const filterLabelMap: Record<string, string> = {
    lossOrderCount: '亏损订单',
    offsiteOrderCount: '站外订单',
    unshippedOrderCount: '未发货订单',
    pendingAction: '风险项'
  }
  const filterLabel = computed(() => (props.filterKey ? filterLabelMap[props.filterKey] || '' : ''))

  // ============ 列配置分组（列本身由 useTable.columnsFactory 管理） ============
  const columnGroups = computed(() => getColumnGroups(detailTab.value))

  // ============ 数值格式化（金额不加颜色；空值用 -） ============
  const EMPTY = '-'

  /**
   * 费用下钻：轻量判断是否显示 ▾（不预计算明细行）
   * 明细 DOM 由全表唯一浮层在点击时挂载，避免每格 ElPopover 实例爆炸
   */
  const canDrill = (row: Record<string, any>, prop: string): boolean => {
    if (!isDrilldownProp(prop)) return false
    return Math.abs(Number(row[resolveDrillParent(prop)]) || 0) >= 0.005
  }

  const DRILL_POPPER_W = 280
  const drillOpen = ref(false)
  const drillLoading = ref(false)
  const drillProp = ref('')
  const drillItems = ref<DrillRow[]>([])
  const drillAnchorEl = ref<HTMLElement | null>(null)
  const drillPopperRef = ref<HTMLElement | null>(null)
  const drillPopperStyle = ref<CSSProperties>({})
  const DRILL_CACHE_TTL = 2 * 60 * 1000
  const DRILL_CACHE_MAX = 100
  const drillCache = new Map<string, { expiresAt: number; data: OrderProfitFeeDrilldown }>()
  const drillPending = new Map<string, Promise<OrderProfitFeeDrilldown>>()
  let drillRequestSeq = 0

  const closeDrill = (): void => {
    drillRequestSeq += 1
    if (!drillOpen.value) return
    drillOpen.value = false
    drillLoading.value = false
    drillItems.value = []
    drillProp.value = ''
    drillAnchorEl.value = null
  }

  /** 相同筛选与对象的费用下钻短时复用，并合并快速重复点击产生的并发请求。 */
  const loadFeeDrilldown = async (
    params: Parameters<typeof orderProfitFeeDrilldown>[0]
  ): Promise<OrderProfitFeeDrilldown> => {
    const key = JSON.stringify(params)
    const now = Date.now()
    const cached = drillCache.get(key)
    if (cached && cached.expiresAt > now) return cached.data
    if (cached) drillCache.delete(key)
    const pending = drillPending.get(key)
    if (pending) return pending

    const request = orderProfitFeeDrilldown(params)
    drillPending.set(key, request)
    try {
      const data = await request
      if (drillCache.size >= DRILL_CACHE_MAX) {
        const oldestKey = drillCache.keys().next().value
        if (oldestKey) drillCache.delete(oldestKey)
      }
      drillCache.set(key, { expiresAt: now + DRILL_CACHE_TTL, data })
      return data
    } finally {
      drillPending.delete(key)
    }
  }

  const positionDrillPopper = (anchor: HTMLElement): void => {
    const rect = anchor.getBoundingClientRect()
    const width = DRILL_POPPER_W
    let left = Math.min(Math.max(8, rect.left), window.innerWidth - width - 8)
    const below = rect.bottom + 6
    const approxH = 260
    const flipUp = below + approxH > window.innerHeight && rect.top > approxH
    drillPopperStyle.value = flipUp
      ? {
          position: 'fixed',
          left: `${left}px`,
          top: `${rect.top - 6}px`,
          width: `${width}px`,
          transform: 'translateY(-100%)',
          zIndex: 3000
        }
      : {
          position: 'fixed',
          left: `${left}px`,
          top: `${below}px`,
          width: `${width}px`,
          zIndex: 3000
        }
  }

  /** 前端费用列 → 后端二级宽表列名（OrderProfitServiceImpl WIDE_TO_L2） */
  const PROP_WIDE_COLUMN: Record<string, string> = {
    refundTotal: 'refund',
    promoFee: 'promo_fee',
    ad: 'ad_cost',
    storageFee: 'storage_fee',
    fbaFulfillmentFee: 'fba_ops_fee',
    platformOtherFee: 'platform_other_fee',
    fbaInventoryReimbursement: 'fba_reimbursement',
    otherIncome: 'other_income'
  }

  /** 下钻定位对象维度键：合计行/看板为空(整体聚合)，其余取行 dimKey */
  const drillDimValue = (row: Record<string, any>): string | undefined => {
    if (row._level === 'summary' || detailTab.value === 'dashboard') return undefined
    const v = row.dimKey ?? row.orderNo ?? row.asin ?? row.msku ?? row.spu
    return v == null ? undefined : String(v)
  }

  const openDrill = async (
    row: Record<string, any>,
    prop: string,
    anchor: HTMLElement
  ): Promise<void> => {
    if (drillOpen.value && drillAnchorEl.value === anchor && drillProp.value === prop) {
      closeDrill()
      return
    }
    const parent = resolveDrillParent(prop)
    const wideColumn = PROP_WIDE_COLUMN[parent]
    if (!wideColumn) {
      closeDrill()
      return
    }
    // 单个* 列：三级金额同样除以销量
    const isUnit = resolveDrillParent(prop) !== prop
    const divisor = isUnit ? Math.max(1, Number(row.qty) || 1) : 1
    // 与列表同口径：带上结算状态 / 指标卡联动 / 利润状态，避免列值与下钻弹窗互相矛盾
    const requestFilter = toSharedFilter()
    // 看板行已经携带实际桶边界；按该日/周/月裁剪，避免错误扫描整个顶部筛选周期。
    if (detailTab.value === 'dashboard' && row._level !== 'summary') {
      requestFilter.dateStart = row.dateStart || requestFilter.dateStart
      requestFilter.dateEnd = row.dateEnd || requestFilter.dateEnd
    }
    const requestSeq = ++drillRequestSeq
    // 先按 loading 态开浮层，避免等接口期间点击无反馈
    drillProp.value = prop
    drillItems.value = []
    drillAnchorEl.value = anchor
    drillLoading.value = true
    positionDrillPopper(anchor)
    drillOpen.value = true
    try {
      const res = await loadFeeDrilldown({
        ...requestFilter,
        tab: detailTab.value,
        dimValue: drillDimValue(row),
        wideColumn
      })
      if (requestSeq !== drillRequestSeq) return
      const items: DrillRow[] = (res?.items || [])
        .map((it) => ({ label: it.feeItemL3, value: divide(Number(it.amount) || 0, divisor) }))
        .filter((x) => Math.abs(x.value) > 0.005 && x.label !== '合计')
      if (!items.length) {
        closeDrill()
        return
      }
      drillItems.value = items
      drillLoading.value = false
    } catch {
      if (requestSeq !== drillRequestSeq) return
      closeDrill()
    }
  }

  const onDrillClick = (row: Record<string, any>, prop: string, e: MouseEvent): void => {
    e.stopPropagation()
    const el = (e.currentTarget as HTMLElement) || null
    if (!el) return
    openDrill(row, prop, el)
  }

  // 点另一个下钻按钮时由 onDrillClick 接管，避免 outside 先关再开被冲掉
  onClickOutside(drillPopperRef, (e) => {
    const t = e.target as HTMLElement | null
    if (t?.closest?.('.dt-cost-drill')) return
    closeDrill()
  })

  const onDrillRepositionClose = (): void => closeDrill()

  /** 下钻金额：原样展示接口数组里的正负号，前端只做币种格式化。 */
  const formatDrillValue = (_prop: string, val: number): string => formatMoney(val)

  // 金额格式化随当前币种符号（$/¥）；数值由后端按 exchange_rate 换算
  const money = (v: number): string => formatMoney(v)
  const intFmt = (v: number): string => Math.round(v).toLocaleString('en-US')
  const pct = (v: number): string => formatPercent(v)
  const wowFmt = (v: number | null): string =>
    v === null || v === undefined ? EMPTY : formatPercent(v, { showPlus: true })

  const cellText = (prop: string, val: any): string => {
    const f = FIELD_META[prop]
    if (!f) return val ?? EMPTY
    if (val === null || val === undefined) return EMPTY
    switch (f.fmt) {
      case 'money':
        return money(toDisplayAmount(prop, Number(val)))
      case 'percent':
        return pct(Number(val))
      case 'int':
        return intFmt(Number(val))
      case 'wow':
        return wowFmt(val === null ? null : Number(val))
      default:
        return String(val)
    }
  }

  /** 金额不加颜色；仅环比保留涨跌色 */
  const cellClass = (prop: string, val: any): string => {
    const f = FIELD_META[prop]
    if (!f) return 'dt-cell'
    if (f.color === 'wow') {
      if (val === null || val === undefined) return 'dt-cell dt-muted'
      return `dt-cell ${Number(val) >= 0 ? 'dt-up' : 'dt-down'}`
    }
    return 'dt-cell'
  }

  /** 利润率标签档位：≥20% 绿 / [8%,20%) 黄 / <8% 红 */
  const marginTier = (val: any): string => {
    if (val === null || val === undefined || Number.isNaN(Number(val))) return 'is-empty'
    const n = Number(val)
    if (n >= 20) return 'is-high'
    if (n >= 8) return 'is-mid'
    return 'is-low'
  }

  /**
   * 广告比率标签：
   * - 广告销量占比(adQtyRate)：>0 绿，≤0 红
   * - 广告 ACoS(adAcos)：≥0 红，<0 绿
   */
  const rateTagTier = (prop: string, val: any): string => {
    if (val === null || val === undefined || Number.isNaN(Number(val))) return 'is-empty'
    const n = Number(val)
    if (prop === 'adQtyRate') return n > 0 ? 'is-high' : 'is-low'
    if (prop === 'adAcos') return n < 0 ? 'is-high' : 'is-low'
    return 'is-empty'
  }

  /** 利润拆解抽屉 */
  const profitDrawerOpen = ref(false)
  const profitDrawerRow = ref<Record<string, any> | null>(null)
  const openProfitDrawer = (row: Record<string, any>): void => {
    profitDrawerRow.value = row
    profitDrawerOpen.value = true
  }

  /** 汇总行拆解：带上 _level=summary；统计日期取当前筛选区间（订单/产品汇总无单日 date） */
  const openSummaryProfitDrawer = (sum: Record<string, any>): void => {
    const range = (props.searchForm?.dateRange as string[]) || []
    const start = range[0] || ''
    const end = range[1] || start
    const dateLabel =
      sum.date && sum.date !== '汇总'
        ? String(sum.date)
        : start && end
          ? start === end
            ? start
            : `${start} ~ ${end}`
          : '汇总'
    openProfitDrawer({
      ...sum,
      _level: 'summary',
      date: dateLabel,
      // 兜底订单数：adaptDetail 已写 _count，此处再对齐一次防旧缓存
      _count: Number(sum._count ?? sum.orderCount) || 0
    })
  }

  /** 站点 → 亚马逊域名（未知回退 com，对齐 demo https://www.amazon.com/dp/{asin}） */
  const AMAZON_DOMAIN: Record<string, string> = {
    US: 'com',
    CA: 'ca',
    MX: 'com.mx',
    UK: 'co.uk',
    GB: 'co.uk',
    DE: 'de',
    FR: 'fr',
    IT: 'it',
    ES: 'es',
    JP: 'co.jp',
    AU: 'com.au'
  }
  const amazonAsinUrl = (row: Record<string, any>): string => {
    const asin = String(row.asin || '').trim()
    const site = String(row.country || row.site || 'US')
      .trim()
      .toUpperCase()
    const domain = AMAZON_DOMAIN[site] || 'com'
    return `https://www.amazon.${domain}/dp/${encodeURIComponent(asin)}`
  }

  /** ASIN 利润测算抽屉（对齐 demo openAsinScenario） */
  const scenarioOpen = ref(false)
  const scenarioBase = ref<AsinScenarioBase | null>(null)
  const buildAsinScenarioBase = (row: Record<string, any>): AsinScenarioBase | null => {
    const asin = String(row.asin || '').trim()
    if (!asin) return null
    const ad = Math.abs(Number(row.ad) || 0)
    const profit = Number(row.profit) || 0
    const sales = Math.abs(Number(row.sales) || 0)
    const qty = Math.max(0, Number(row.qty) || 0)
    // 基准订单数取后端真实 orderCount（adaptDetail 映射为 _count），不伪造；仅除法时防零
    const orderCount = row.orderCount
    const unitAd = Math.abs(Number(row.unitAd) || 0)
    const unitProfit = row.unitNetProfit
    const unitSales = divide(sales, orderCount)
    // 测算基准区间 = 顶部“下单时间”日期范围（如 2026-05-28 ～ 2026-06-24）；缺省回退文案
    const dr = props.searchForm?.dateRange
    const period = Array.isArray(dr) && dr[0] && dr[1] ? `${dr[0]} ～ ${dr[1]}` : '当前筛选区间'
    return {
      asin,
      site: String(row.country || row.site || 'US'),
      imgChar: row.image,
      period,
      orderCount,
      qty,
      profit,
      margin: Number(row.margin) || mul(divide(profit, sales), 100),
      ad,
      unitAd,
      unitProfit,
      unitSales,
      contribution: add(unitProfit, unitAd)
    }
  }
  const openAsinScenario = (row: Record<string, any>): void => {
    const base = buildAsinScenarioBase(row)
    if (!base) return
    scenarioBase.value = base
    scenarioOpen.value = true
  }

  // ============ 真实数据：detail 两步法分页(层级子行) + profit-status-count ============
  /** 合计行独立于列表 data（show-summary 使用，不塞进 records） */
  const summaryRow = ref<Record<string, any> | null>(null)
  /** 树展开 key（查询重载时清空） */
  const expandedKeys = ref<Set<string>>(new Set())

  /** 明细筛选卡 key → 订单指标卡联动 code（后端 metricCardFilter，仅订单 Tab） */
  const FILTER_CARD_CODE: Record<string, string> = {
    lossOrderCount: 'loss',
    offsiteOrderCount: 'offsite',
    unshippedOrderCount: 'unshipped'
  }

  /** 当前工具条筛选态（供列表 / 计数 / 导出共用） */
  const currentParams = (): Record<string, any> => ({
    ...props.searchForm,
    filterKey: props.filterKey || '',
    settlement: settlement.value,
    profitStatus: profitStatus.value
  })

  /**
   * 由查询参数组装后端明细入参。
   * forCount：利润状态计数不带 profitStatus（各档独立计数）。
   */
  const toDetailQuery = (
    params: Record<string, any>,
    opts: { forCount?: boolean } = {}
  ): OrderProfitDetailQuery => {
    const q: OrderProfitDetailQuery = {
      ...buildOrderProfitFilter(params),
      tab: detailTab.value,
      granularity: resolveOrderProfitGranularity(params),
      pageNo: Math.max(1, Number(params.currentPage) || 1),
      pageSize: Math.max(1, Number(params.pageSize) || 20),
      hasCount: true,
      withChildren: true
    }
    if (isOrderTab.value) {
      // 订单来源(orderSource)由顶部搜索栏下拉决定，透传后端（默认 all=不过滤）；
      // 不再强制 all，否则「不含站外/仅站外」在订单 Tab 失效。站外指标卡走 metricCardFilter。
      if (params.settlement && params.settlement !== 'all') q.settleStatus = params.settlement
      const code = FILTER_CARD_CODE[params.filterKey as string]
      if (code) q.metricCardFilter = code
    }
    const metricProfitStatus = resolveMetricProfitStatus(params.filterKey)
    if (!opts.forCount && metricProfitStatus) {
      q.profitStatus = metricProfitStatus
    } else if (!opts.forCount && params.profitStatus && params.profitStatus !== 'all') {
      q.profitStatus = params.profitStatus
    }
    // 排序：透传列头排序（handleSortChange 写入 searchParams），计数查询不需要
    if (!opts.forCount && params.sortField) {
      q.sortField = String(params.sortField)
      q.sortOrder = params.sortOrder === 'asc' ? 'asc' : 'desc'
    }
    return q
  }

  /** 下钻/拆解与列表共享的筛选口径（不含分页、排序、列配置） */
  const toSharedFilter = (): OrderProfitBaseFilter => {
    const q = toDetailQuery(currentParams())
    return {
      dateStart: q.dateStart,
      dateEnd: q.dateEnd,
      site: q.site,
      shopIds: q.shopIds,
      brandIds: q.brandIds,
      categoryIds: q.categoryIds,
      spuIds: q.spuIds,
      spuCodes: q.spuCodes,
      ownerIds: q.ownerIds,
      productStatus: q.productStatus,
      fulfillmentChannel: q.fulfillmentChannel,
      orderSource: q.orderSource,
      currency: q.currency,
      dateType: q.dateType,
      searchType: q.searchType,
      keyword: q.keyword,
      settleStatus: q.settleStatus,
      orderStatus: q.orderStatus,
      metricCardFilter: q.metricCardFilter,
      profitStatus: q.profitStatus
    }
  }

  /** 导出入参：与表格当前可见列完全一致（含顺序） */
  const exportParams = (): OrderProfitDetailQuery =>
    // 必须用 useTable 算出的 columns（已按 checked&&!hide + 固定列重排），
    // 不能用 columnChecks：后者未过滤 hide，且顺序与表格展示不一致。
    buildOrderProfitExportQuery(toDetailQuery(currentParams()), columns.value || [])

  /** 明细列表：返回 { records, total }，汇总行副作用写入 summaryRow */
  const fetchDetailList = async (params: Record<string, any>) => {
    const page = await orderProfitDetail(toDetailQuery(params))
    summaryRow.value = page.summary
    return {
      records: resolveDetailPageRecords(
        detailTab.value,
        page.records,
        params.currentPage,
        params.pageSize
      ),
      total: page.total,
      current: params.currentPage,
      size: params.pageSize
    }
  }

  /** 利润状态计数（订单 Tab 下拉右侧数量）；非订单 Tab 不展示 */
  const fetchStatusCounts = async (): Promise<void> => {
    if (!isOrderTab.value) return
    try {
      const c = await orderProfitStatusCount(toDetailQuery(currentParams(), { forCount: true }))
      profitStatusCounts.value = {
        all: Number(c.all) || 0,
        loss: Number(c.loss) || 0,
        low: Number(c.low) || 0,
        normal: Number(c.normal) || 0,
        high: Number(c.high) || 0
      }
    } catch {
      profitStatusCounts.value = { all: 0, loss: 0, low: 0, normal: 0, high: 0 }
    }
  }

  const {
    data,
    loading,
    pagination,
    columns,
    columnChecks,
    searchParams,
    getData,
    refreshData,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: fetchDetailList,
      immediate: true,
      columnsFactory: () => buildDetailColumns(detailTab.value),
      // pageSize 缓存亦按持久化维度归一（产品四 tab 共享），与列设置 key 保持一致
      tableKey: `finance-sc-profit-detail-${persistTab.value}`,
      tableName: tableName.value,
      apiParams: {
        ...props.searchForm,
        filterKey: props.filterKey || '',
        settlement: settlement.value,
        profitStatus: profitStatus.value,
        ...resolveDefaultDetailSort(detailTab.value),
        currentPage: 1,
        pageSize: 20
      }
    },
    transform: {
      responseAdapter: (response: {
        records?: Record<string, any>[]
        total?: number
        current?: number
        size?: number
      }) => ({
        records: response?.records ?? [],
        total: response?.total ?? 0,
        current: response?.current,
        size: response?.size
      })
    },
    performance: {
      // 汇总行靠请求副作用写入；禁用缓存避免命中时 summary 不更新
      enableCache: false
    }
  })

  /** 超过阈值不建异步任务，避免订单 Tab 大导出卡在处理中。 */
  const exportWithLimitGuard = async (params: OrderProfitDetailQuery): Promise<number> => {
    try {
      assertOrderProfitExportWithinLimit(pagination.total)
    } catch (e: any) {
      ElMessage.warning(
        e?.message || `导出数据超过${ORDER_PROFIT_EXPORT_MAX_ROWS}行，请缩小筛选范围后重试`
      )
      return Promise.reject(e)
    }
    return orderProfitExport(params)
  }

  /** 同步查询条件并重新拉第一页（保留当前 sortField/sortOrder） */
  const syncSearchAndReload = (): void => {
    closeDrill()
    expandedKeys.value = new Set()
    Object.assign(searchParams, {
      ...props.searchForm,
      filterKey: props.filterKey || '',
      settlement: settlement.value,
      profitStatus: profitStatus.value
    })
    getData()
    fetchStatusCounts()
  }

  /**
   * 父组件切换页签时 searchForm 与 detailTab 会在同一轮同时变化。
   * 短防抖合并同一轮变化和快速连续切换，避免为用户已经离开的页签启动重聚合。
   */
  let syncReloadTimer: ReturnType<typeof setTimeout> | null = null
  const scheduleSyncSearchAndReload = (): void => {
    if (syncReloadTimer) clearTimeout(syncReloadTimer)
    syncReloadTimer = setTimeout(() => {
      syncReloadTimer = null
      syncSearchAndReload()
    }, 250)
  }

  /** 列排序：写入查询参数后重新拉数（对齐 sku-cost 可售天数） */
  const handleSortChange = ({
    prop,
    order
  }: {
    prop: string | null
    order: 'ascending' | 'descending' | null
  }): void => {
    const sp = searchParams as Record<string, unknown>
    if (prop && order) {
      sp.sortField = prop
      sp.sortOrder = order === 'ascending' ? 'asc' : 'desc'
    } else {
      Object.assign(sp, resolveDefaultDetailSort(detailTab.value))
    }
    closeDrill()
    getData()
  }

  /**
   * 订单 tab 维度说明（对齐 demo ttCount）：排序文案随 sortField/sortOrder 同步
   * 例：按下单时间降序 / 按结算时间升序
   */
  const orderMetaText = computed(() => {
    const settle = SETTLEMENT_LABEL[settlement.value] || SETTLEMENT_LABEL.all
    const profitExtra =
      profitStatus.value !== 'all'
        ? ` · ${PROFIT_STATUS_LABEL[profitStatus.value] || profitStatus.value}`
        : ''
    const cardFilterExtra = filterLabel.value ? ` · ${filterLabel.value}` : ''
    const sp = searchParams as Record<string, unknown>
    const sortField = String(sp.sortField || 'orderTime')
    const sortLabel = FIELD_LABEL[sortField] || sortField
    const sortDir = String(sp.sortOrder || 'desc') === 'asc' ? '升序' : '降序'
    return `· 订单维度 · 仅控制明细表 · ${settle}${profitExtra}${cardFilterExtra} · 按${sortLabel}${sortDir}`
  })

  const onRefresh = (): void => {
    closeDrill()
    expandedKeys.value = new Set()
    refreshData()
    fetchStatusCounts()
  }

  /**
   * 重置本地筛选态（PRD F-04：重置清除结算状态/利润状态/排序）。
   * 仅清本地 ref，实际 reload 交由 index.vue 重置 searchForm 触发的 watch 统一执行，避免重复请求。
   */
  const resetLocal = (): void => {
    settlement.value = 'all'
    profitStatus.value = 'all'
    profitMenuOpen.value = false
    const sp = searchParams as Record<string, unknown>
    Object.assign(sp, resolveDefaultDetailSort(detailTab.value))
  }

  /** 主动清空明细展示（重置等场景仍可用；searchType 切换不再调用）。 */
  const clearResults = (): void => {
    closeDrill()
    expandedKeys.value = new Set()
    data.value = []
    pagination.total = 0
    summaryRow.value = null
    profitStatusCounts.value = { all: 0, loss: 0, low: 0, normal: 0, high: 0 }
  }
  defineExpose({ resetLocal, clearResults, syncSearchAndReload })

  const onProfitStatusSelect = (val: string): void => {
    profitStatus.value = val
    profitMenuOpen.value = false
    syncSearchAndReload()
  }

  /** 汇总行比率标签：内联色值，避免 footer 里 h() 节点吃不到 scoped 样式 */
  const PILL_INLINE: Record<string, Record<string, string>> = {
    'is-high': { color: '#16a34a', background: '#e6f7ec' },
    'is-mid': { color: '#f59e0b', background: '#fff5e0' },
    'is-low': { color: '#ef4444', background: '#fde8e8' },
    'is-empty': { color: '#9ca3af', background: 'transparent' }
  }
  const summaryRatePill = (prop: string, val: any): VNode | string => {
    if (val === null || val === undefined) return EMPTY
    const tier = prop === 'margin' ? marginTier(val) : rateTagTier(prop, val)
    const isEmpty = tier === 'is-empty'
    return h(
      'span',
      {
        class: ['dt-rate-pill', tier],
        style: {
          padding: isEmpty ? '0' : '1px 8px',
          fontSize: '11px',
          fontWeight: 600,
          borderRadius: '20px',
          ...(PILL_INLINE[tier] || PILL_INLINE['is-empty'])
        }
      },
      cellText(prop, val)
    )
  }

  /** 汇总行费用下钻：复用与数据行同构的单元格 */
  const summaryDrillCell = (sum: Record<string, any>, prop: string): VNode =>
    renderSummaryDrillCell({
      text: cellText(prop, sum[prop]),
      drillable: canDrill(sum, prop),
      onDrill: (anchor) => openDrill(sum, prop, anchor)
    })

  /** 汇总行利润详情·拆解（与数据行同一按钮，打开拆解抽屉） */
  const summaryTrendCell = (sum: Record<string, any>): VNode =>
    h(
      'button',
      {
        type: 'button',
        class: 'dt-detail-link',
        title: '查看费用详情与趋势',
        onClick: (e: MouseEvent) => {
          e.stopPropagation()
          openSummaryProfitDrawer(sum)
        }
      },
      [
        h(
          'svg',
          {
            viewBox: '0 0 24 24',
            fill: 'none',
            stroke: 'currentColor',
            'stroke-width': '2',
            style: { width: '12px', height: '12px' }
          },
          [h('circle', { cx: '12', cy: '12', r: '9' }), h('path', { d: 'M12 7v5l3 2' })]
        ),
        '拆解'
      ]
    )

  /** ElTable 合计行：取全量汇总数据格式化（非当前页求和）；比率色标签 + 费用下拉明细 */
  const summaryMethod = ({ columns }: { columns: any[] }): Array<string | VNode> => {
    const sum = summaryRow.value
    const labelProp = summaryLabelProp(detailTab.value)
    const textProps = new Set([
      'date',
      'image',
      'parentAsin',
      'asin',
      'msku',
      'spu',
      'category',
      'brand',
      'store',
      'owner',
      'country',
      'currency',
      'orderNo',
      'orderTime',
      'payTime',
      'shipTime',
      'settleTime',
      'settlementNo'
    ])
    return columns.map((col) => {
      const prop = col.property as string | undefined
      if (!prop) return ''
      if (prop === labelProp) return '汇总'
      if (prop === 'trend') return sum ? summaryTrendCell(sum) : ''
      if (prop === 'image' && prop !== labelProp) return ''
      if (textProps.has(prop)) return EMPTY
      if (!sum) return EMPTY
      if (prop === 'margin' || prop === 'adQtyRate' || prop === 'adAcos') {
        return summaryRatePill(prop, sum[prop])
      }
      if (isDrilldownProp(prop)) return summaryDrillCell(sum, prop)
      return cellText(prop, sum[prop])
    })
  }

  const rowClass = ({ row }: { row: Record<string, any> }): string => {
    const cls: string[] = []
    if (row._isChild) cls.push('dt-row-child')
    if (row._children?.length && expandedKeys.value.has(row._key)) cls.push('dt-row-open')
    // 利润额 < 0：亏损行浅红底
    if (Number(row.profit) < 0) cls.push('dt-row-loss')
    return cls.join(' ')
  }

  // ============ 树形展开：自定义图标，隐藏默认箭头 ============
  const tableRef = ref<InstanceType<typeof ArtTableGroup> | null>(null)

  const toggleExpand = (row: Record<string, any>): void => {
    tableRef.value?.elTableRef?.toggleRowExpansion(row)
  }

  /** Element Plus 树节点展开：第二参为 boolean（expanded） */
  const onExpandChange = (row: Record<string, any>, expanded: boolean): void => {
    const next = new Set(expandedKeys.value)
    if (expanded) next.add(row._key)
    else next.delete(row._key)
    expandedKeys.value = next
  }

  // ============ 撑满视口高度：剩余视口 - 分组条 - 分页器，经 height 传入 ============
  const DEFAULT_TABLE_H = 360
  const FALLBACK_PAGINATION_H = 48
  const TABLE_PAGINATION_GAP = 15
  const VIEWPORT_SAFE = 8
  const { height: windowHeight } = useWindowSize()
  const fillTableHeight = ref(DEFAULT_TABLE_H)

  /** 撑满视口时用动态高度；否则固定 360 */
  const tableHeight = computed(() => (fillViewport.value ? fillTableHeight.value : DEFAULT_TABLE_H))

  const calcFillTableHeight = (): void => {
    if (!fillViewport.value) return
    nextTick(() => {
      const root = (tableRef.value as any)?.$el as HTMLElement | undefined
      if (!root) return
      const top = root.getBoundingClientRect().top
      const pagEl = root.querySelector('.pagination') as HTMLElement | null
      const pagH = pagEl?.getBoundingClientRect().height || FALLBACK_PAGINATION_H
      const barEl = root.querySelector('.atg-group-bar') as HTMLElement | null
      const barH = barEl?.getBoundingClientRect().height || 0
      // ElTable 高度 = 视口底边 - 表格容器顶 - 分组条 - 分页器 - 间距
      const next = Math.floor(
        windowHeight.value - top - barH - pagH - TABLE_PAGINATION_GAP - VIEWPORT_SAFE
      )
      fillTableHeight.value = Math.max(280, next)
    })
  }

  const onSizeChange = async (val: number): Promise<void> => {
    closeDrill()
    await handleSizeChange(val)
    calcFillTableHeight()
  }
  const onCurrentChange = async (val: number): Promise<void> => {
    closeDrill()
    await handleCurrentChange(val)
  }

  /**
   * 明细只保留 filterKey 这一条自动刷新通道：点指标卡筛选只改 filterKey，父级不会 reload。
   * 筛选栏的其余变化（含不参与自动重查的 searchType / keyword）都由父级 reload 经
   * syncSearchAndReload 显式同步，若此处再监听整个 searchForm 会对同一次操作重复发请求。
   */
  watch(
    () => props.filterKey || '',
    () => scheduleSyncSearchAndReload()
  )

  watch(detailTab, () => {
    Object.assign(
      searchParams as Record<string, unknown>,
      resolveDefaultDetailSort(detailTab.value)
    )
    scheduleSyncSearchAndReload()
  })

  watch([fillViewport, windowHeight, () => pagination.total], () => calcFillTableHeight())

  // 请求结束后重算撑满高度（loading 由 useTable 管理）
  watch(loading, (v) => {
    if (!v) nextTick(() => calcFillTableHeight())
  })

  // overview 收起后趋势区卸载，等布局稳定再量高
  watch(
    () => props.overviewOpen,
    () => {
      closeDrill()
      nextTick(() => {
        requestAnimationFrame(() => calcFillTableHeight())
      })
    }
  )

  onMounted(() => {
    window.addEventListener('scroll', onDrillRepositionClose, true)
    window.addEventListener('resize', onDrillRepositionClose)
    // 首屏列表由 useTable immediate 拉取；订单 Tab 首屏补拉利润状态计数
    calcFillTableHeight()
    fetchStatusCounts()
  })

  onBeforeUnmount(() => {
    if (syncReloadTimer) clearTimeout(syncReloadTimer)
    window.removeEventListener('scroll', onDrillRepositionClose, true)
    window.removeEventListener('resize', onDrillRepositionClose)
    closeDrill()
    drillCache.clear()
    drillPending.clear()
  })
</script>

<style lang="scss" scoped>
  .dt-card {
    margin-top: 12px;

    :deep(.el-card__body) {
      padding: 12px 16px;
    }

    :deep(.table-header) {
      margin-bottom: 0 !important;
    }
  }

  .dt-toolbar-left {
    display: inline-flex;
    gap: 10px;
    align-items: center;
  }

  /* 订单筛选下拉（对齐 demo tool-select） */
  .dt-tool-select {
    width: 148px;

    :deep(.el-select__wrapper) {
      min-height: 31px;
      font-size: 12.5px;
      font-weight: 500;
      box-shadow: 0 0 0 1px #e5e7eb inset;
    }
  }

  /* 利润状态自定义下拉（对齐 demo profit-status-* / 设计图） */
  .profit-status-wrap {
    position: relative;
    display: inline-flex;
  }

  .profit-status-btn {
    position: relative;
    min-width: 148px;
    height: 31px;
    padding: 0 28px 0 11px;
    font-size: 12.5px;
    font-weight: 500;
    color: #5f6877;
    text-align: left;
    cursor: pointer;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 4px;

    &::after {
      position: absolute;
      top: 50%;
      right: 10px;
      width: 6px;
      height: 6px;
      content: '';
      border-right: 1.5px solid #7b8496;
      border-bottom: 1.5px solid #7b8496;
      transform: translateY(-65%) rotate(45deg);
    }

    &:hover,
    &.active {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }

  .profit-status-menu {
    position: absolute;
    top: 36px;
    left: 0;
    z-index: 70;
    display: none;
    width: 210px;
    padding: 5px;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 8px;
    box-shadow: 0 12px 28px -12px rgb(15 23 42 / 22%);

    &.open {
      display: block;
    }
  }

  .profit-status-option {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    width: 100%;
    height: 30px;
    padding: 0 8px;
    font-size: 12.5px;
    color: #5f6877;
    text-align: left;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 6px;

    .cnt {
      font-size: 12px;
      font-weight: 500;
      color: #9aa3b5;
    }

    &:hover {
      color: var(--el-color-primary);
      background: #f5f7ff;
    }

    &.active {
      font-weight: 700;
      color: var(--el-color-primary);
      background: #eef2ff;

      .cnt {
        color: #64748b;
      }
    }
  }

  /* msg 提示条（对齐 demo order-detail-note） */
  .dt-msg {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    height: 31px;
    padding: 0 10px;
    font-size: 12px;
    font-weight: 500;
    color: #64748b;
    white-space: nowrap;
    background: #f8fbff;
    border: 1px solid #dbe7ff;
    border-radius: 4px;

    &::before {
      width: 6px;
      height: 6px;
      content: '';
      background: var(--el-color-primary);
      border-radius: 50%;
      box-shadow: 0 0 0 3px rgb(46 92 255 / 10%);
    }
  }

  /* 订单维度说明（对齐 demo ttCount） */
  .dt-tt-meta {
    font-size: 12px;
    font-weight: 500;
    color: #94a3b8;
    white-space: nowrap;
  }

  /* 费用分摊按钮（对齐 demo tool-pill） */
  .dt-alloc-btn {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    height: 31px;
    padding: 0 11px;
    font-size: 12.5px;
    font-weight: 500;
    color: #5f6877;
    cursor: pointer;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 4px;

    svg {
      width: 14px;
      height: 14px;
    }

    svg:first-child {
      color: #22c55e;
    }

    .cv {
      width: 13px;
      height: 13px;
      color: #9aa3b2;
    }

    &:hover {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }

  .dt-title {
    font-size: 15px;
    font-weight: 600;
    color: var(--art-gray-900);
  }

  .dt-filter-tag {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    height: 22px;
    padding: 0 8px;
    font-size: 12px;
    color: #dc2626;
    background: #fff1f1;
    border: 1px solid #f6c6c6;
    border-radius: 11px;

    .dt-filter-close {
      font-style: normal;
      font-weight: 700;
      cursor: pointer;
    }
  }

  :deep(.dt-cell) {
    font-variant-numeric: tabular-nums;
  }

  :deep(.dt-neg) {
    color: #e5484d;
  }

  :deep(.dt-up) {
    font-weight: 600;
    color: #e5484d;
  }

  :deep(.dt-down) {
    font-weight: 600;
    color: #16a34a;
  }

  :deep(.dt-muted) {
    color: #c0c4cc;
  }

  .dt-date-cell {
    display: inline-flex;
    gap: 7px;
    align-items: center;

    &.is-child:not(.is-img, .is-orderno) {
      padding-left: 25px;
      color: #6b7280;
    }

    &.is-img {
      gap: 12px;
    }

    /* 子行图片列：左侧留出折线位（对齐 demo padding-left:30px） */
    &.is-child.is-img {
      padding-left: 30px;
      color: #6b7280;
    }

    /* 订单子行：订单号与父行左对齐（18px 展开槽 + 7px 间距），颜色继承父行 */
    &.is-child.is-orderno {
      gap: 0;
      // padding-left: 25px;
    }
  }

  /* 子行 L 折线（对齐 demo .scrow-child td.col-img::before） */
  .dt-tree-elbow {
    flex-shrink: 0;
    width: 10px;
    height: 10px;
    margin-top: -2px;
    border-bottom: 1.5px solid #d8dde7;
    border-left: 1.5px solid #d8dde7;
    border-bottom-left-radius: 3px;
  }

  .dt-date {
    padding-left: 10px;
  }

  .dt-text {
    font-size: 12px;
    color: #334155;
  }

  /* SPU 列：编码 + 名称两行（名称超宽省略，hover 显示完整） */
  .dt-code-name {
    display: inline-flex;
    flex-direction: column;
    gap: 2px;
    min-width: 0;

    .dt-code {
      font-size: 12px;
      line-height: 18px;
      color: #334155;
    }

    .dt-name {
      font-size: 12px;
      color: #94a3b8;
    }
  }

  .dt-img,
  .dt-img-ph {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    border-radius: 8px;

    /* 子行缩略图更小（对齐 demo 34px） */
    &.is-sm {
      width: 34px;
      height: 34px;
      border-radius: 6px;
    }
  }

  .dt-img {
    overflow: hidden;
    cursor: zoom-in;
  }

  .dt-img-ph {
    font-size: 16px;
    color: #4f63d2;
    background: linear-gradient(135deg, #eef2ff, #e0e7ff);

    &.is-sm {
      font-size: 14px;
    }
  }

  /* 展开槽：固定 18px，有无箭头都不挤占图片位置 */
  .dt-expand-slot {
    box-sizing: border-box;
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
  }

  /* 自定义展开图标（替换 ElTable 默认树箭头） */
  .expand-toggle {
    box-sizing: border-box;
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 18px;
    height: 18px;
    padding: 0;
    line-height: 0;
    color: #8a94a6;
    cursor: pointer;
    background: transparent;
    border: 1px solid #e4e9f2;
    border-radius: 4px;
    transition: all 0.15s;

    svg {
      width: 9px;
      height: 9px;
      transition: transform 0.2s;
    }

    &:hover {
      color: #2e5cff;
      background: #fff;
      border-color: #2e5cff;
    }

    &.open {
      color: #fff;
      background: #2e5cff;
      border-color: #2e5cff;

      svg {
        transform: rotate(90deg);
      }
    }
  }

  /* 合计行置顶样式（show-summary + summaryPosition=top） */
  .dt-table {
    /* 隐藏 EP 默认树箭头/占位/缩进，避免与自定义展开槽叠宽导致图片错位 */
    :deep(.el-table__expand-icon),
    :deep(.el-table__placeholder),
    :deep(.el-table__indent) {
      display: none !important;
      width: 0 !important;
      min-width: 0 !important;
      padding: 0 !important;
      margin: 0 !important;
    }

    :deep(.el-table__footer-wrapper) {
      td {
        font-weight: 700;
        background: #f8fbff !important;
      }

      .cell {
        font-variant-numeric: tabular-nums;
      }

      /* 汇总行利润率 / 广告占比 / ACoS 色标签 */
      .dt-rate-pill {
        font-weight: 600;
      }
    }
  }

  /* 比率标签：用 :deep，汇总行 h() 渲染的节点也能吃到样式 */
  :deep(.dt-rate-pill) {
    padding: 1px 8px;
    font-size: 11px;
    font-weight: 600;
    border-radius: 20px;

    /* 绿 */
    &.is-high {
      color: #16a34a;
      background: #e6f7ec;
    }

    /* 黄（利润率中间档） */
    &.is-mid {
      color: #f59e0b;
      background: #fff5e0;
    }

    /* 红 */
    &.is-low {
      color: #ef4444;
      background: #fde8e8;
    }

    /* 无数据（-）：纯文本，不加背景/内边距 */
    &.is-empty {
      padding: 0;
      color: #9ca3af;
      background: transparent;
    }
  }

  /* ASIN + 测算（对齐 demo .asin-action / .scenario-btn / .amazon-link） */
  .dt-asin-action {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    min-width: 0;
  }

  .dt-amazon-link {
    font-size: 12px;
    font-weight: 500;
    color: #2e5cff;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  .dt-scenario-btn {
    height: 19px;
    padding: 0 7px;
    font-size: 10.5px;
    font-weight: 700;
    line-height: 17px;
    color: #2e5cff;
    white-space: nowrap;
    cursor: pointer;
    background: #f5f7ff;
    border: 1px solid #cdd9ff;
    border-radius: 999px;

    &:hover {
      color: #fff;
      background: #2e5cff;
      border-color: #2e5cff;
    }
  }

  /* 利润详情·拆解（对齐 demo .detail-link；:deep 覆盖汇总行 h()） */
  :deep(.dt-detail-link) {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    padding: 3px 9px;
    font-size: 12px;
    font-weight: 600;
    color: #2e5cff;
    cursor: pointer;
    background: #fff;
    border: 1px solid #e6e9f0;
    border-radius: 4px;

    svg {
      width: 12px;
      height: 12px;
    }

    &:hover {
      background: #eef2ff;
      border-color: #2e5cff;
    }
  }

  /* 费用明细下拉触发（对齐 demo .cost-drill）；:deep 同时覆盖汇总行 h() */
  :deep(.dt-cost-drill),
  :deep(.dt-cost-static) {
    display: inline-grid;
    grid-template-columns: auto 10px;
    gap: 4px;
    place-items: center end;
    font-variant-numeric: tabular-nums;
  }

  :deep(.dt-cost-value) {
    text-align: right;
  }

  :deep(.dt-cost-chev-placeholder) {
    width: 10px;
    height: 1px;
  }

  /*
   * 无 ▾ 的数值列用等宽右内边距补出同一个槽（10px 图标 + 4px 间距），
   * 否则同组里有下钻和无下钻的列数字右边缘会差 14px。合计行同样应用 column.className。
   */
  :deep(td.dt-num-pad) {
    padding-right: 14px;
  }

  :deep(.dt-cost-drill) {
    padding: 0;
    font: inherit;
    color: inherit;
    cursor: pointer;
    background: transparent;
    border: 0;

    .chev {
      font-size: 8px;
      color: #94a3b8;
      transition: color 0.15s;
    }

    &:hover {
      color: var(--el-color-primary);

      .chev {
        color: var(--el-color-primary);
      }
    }
  }

  /* 明细行需要稳定的横向分隔线；不能依赖主题下接近背景色的默认边框。 */
  .dt-table :deep(.el-table__body td.el-table__cell) {
    border-bottom: 1px solid #dfe4ec !important;
  }

  /* 固定列 td 被 Element 置为 background:inherit，须同时给 tr 上色才能生效 */
  :deep(.dt-row-child) {
    color: #4a5468;
    background: #fbfcfe;

    td {
      color: #4a5468;
      background: #fbfcfe;
    }
  }

  /* 利润额 < 0：亏损行 */
  :deep(.dt-row-loss) {
    background: #fef2f2 !important;

    td {
      background: #fef2f2 !important;
    }
  }
</style>

<!-- 共享浮层 teleported 到 body，需非 scoped -->
<style lang="scss">
  .dt-cost-popper {
    padding: 8px !important;

    .dt-cost-pop {
      min-width: 230px;
    }

    .dt-cost-pop-loading {
      display: flex;
      gap: 6px;
      align-items: center;
      justify-content: center;
      padding: 18px 10px;
      font-size: 12px;
      color: #94a3b8;
    }

    .dt-cost-pop-row {
      display: grid;
      grid-template-columns: minmax(0, 1fr) 92px;
      gap: 12px;
      align-items: center;
      padding: 8px 10px;
      font-size: 12px;
      border-radius: 6px;

      &:hover {
        background: #f8fafc;
      }

      .k {
        color: #94a3b8;
      }

      .v {
        text-align: right;
      }

      &.total {
        margin-top: 4px;
        font-weight: 700;
        border-top: 1px dashed #e6e9f0;

        .k,
        .v {
          font-weight: 700;
          color: #1f2937;
        }
      }
    }
  }

  .dt-cost-popper-shared {
    box-sizing: border-box;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    box-shadow: 0 6px 20px rgb(15 23 42 / 12%);
  }
</style>
