<template>
  <div
    class="sales-statistics-page art-full-height"
    v-auth="'sale:saleStatics:view'"
    :style="{
      // 45px = 基座（微前端宿主）固定顶栏高度：Tab 吸顶位贴住顶栏底边，避免二者之间透出滚动内容。
      //        「再往下 6px」的视觉间距改用 .board-tabs-sticky 的 padding-top 实现（背景不透明）。
      // 96px = 顶栏(45) + padding-top(6) + Tab 标签高(33) + 与搜索栏间距(12)：搜索栏贴在 Tab 之下。
      '--asin-tab-top': '45px',
      '--asin-search-top': '96px'
    }"
  >
    <!-- 用普通 div 承载 sticky：直接贴在 ElTabs 组件根上会被其内部 overflow:hidden 影响导致吸顶失效 -->
    <div class="board-tabs-sticky">
      <ElTabs v-model="activePaneKey" class="board-tabs">
        <ElTabPane v-for="tab in tabConfigs" :key="tab.key" :label="tab.title" :name="tab.key" />
        <ElTabPane
          v-for="tab in visibleBoardTabList"
          :key="tab.boardType"
          :name="boardPaneName(tab.boardType)"
        >
          <template #label>
            <span class="board-tab-label">{{ tab.label }}</span>
            <ElIcon class="board-tab-close" @click.stop="closeBoardTab(tab.boardType)">
              <Close />
            </ElIcon>
          </template>
        </ElTabPane>
      </ElTabs>
    </div>

    <template v-if="!activeBoardType">
      <!-- 外层 div 承载吸顶+灰色背景：筛选栏自带的底部外边距区域露出该灰色，使这条间距也随吸顶固定且不透明。 -->
      <div class="sales-search-sticky">
        <MultiDimensionFilter
          v-model="filterForm"
          :supports-shop="currentTab.supportsShop"
          @search="reloadAll"
          @reset="resetFilter"
        />
      </div>

      <div class="kpi-config-bar">
        <div class="kpi-config-heading">
          <span class="kpi-zone-title">实时概况</span>
          <button
            type="button"
            class="kpi-collapse-btn"
            :class="{ open: overviewOpen }"
            title="展开实时概况指标"
            @click="overviewOpen = !overviewOpen"
          >
            <ArrowDown />
          </button>
        </div>
        <div class="kpi-config-wrap">
          <button
            type="button"
            class="trend-toggle-btn"
            :class="{ active: trendOpen }"
            title="多指标趋势对比"
            @click="trendOpen = !trendOpen"
          >
            <i class="iconfont-custom arrow-icon">&#xe608;</i>
            <span>趋势分析</span>
            <ArrowDown class="tt-chev" />
          </button>
          <CardSetting
            v-if="overviewCardGroups.some((g) => g.items.length)"
            :key="activeTab"
            v-model="overviewLayout"
            :groups="overviewCardGroups"
            :name="`sales-statistics-overview-v3-${activeTab}`"
            title="配置指标"
            :width="520"
          />
        </div>
      </div>

      <div v-show="overviewOpen" class="overview-cards-wrap" v-loading="overviewLoading">
        <CardItems
          variant="sc-zone"
          :groups="overviewCardGroups"
          :layout="overviewLayout"
          :active-keys="activeTrendMetrics"
          @card-click="onOverviewCardClick"
        >
          <template #value="{ metric }">
            <KpiEllipsisText
              cell-class="kpi-val"
              :text="formatMetricValue(getMetricCard(metric.key)?.value, metric.key)"
            />
            <span
              v-if="activeTab !== 'combined'"
              class="kpi-env"
              :class="envClass(metric.key, getMetricCard(metric.key)?.wowRate)"
            >
              {{ envText(getMetricCard(metric.key)?.wowRate) }}
            </span>
          </template>
          <template #default="{ metric }">
            <template v-if="activeTab === 'combined'">
              <div class="ln">
                <span class="tag sc">SC</span>
                <KpiEllipsisText
                  cell-class="v"
                  :text="formatMetricValue(getMetricCard(metric.key)?.scValue, metric.key)"
                />
                <KpiEllipsisText
                  v-if="!isRateMetric(metric.key)"
                  cell-class="pct"
                  :text="`占比 ${formatRate(getMetricCard(metric.key)?.scRatio)}`"
                />
              </div>
              <div class="ln">
                <span class="tag vc">VC</span>
                <KpiEllipsisText
                  cell-class="v"
                  :text="formatMetricValue(getMetricCard(metric.key)?.vcValue, metric.key)"
                />
                <KpiEllipsisText
                  v-if="!isRateMetric(metric.key)"
                  cell-class="pct"
                  :text="`占比 ${formatRate(getMetricCard(metric.key)?.vcRatio)}`"
                />
              </div>
            </template>
            <template v-else>
              <div class="ln">
                <span class="tag day">昨日</span>
                <KpiEllipsisText
                  cell-class="v"
                  :text="formatMetricValue(getMetricCard(metric.key)?.yesterdayValue, metric.key)"
                />
              </div>
              <div class="ln">
                <span class="tag w7">近7日</span>
                <KpiEllipsisText
                  cell-class="v"
                  :text="formatMetricValue(getMetricCard(metric.key)?.last7Value, metric.key)"
                />
              </div>
            </template>
          </template>
        </CardItems>
      </div>

      <div v-show="trendOpen" class="trend-panel">
        <div class="trend-toolbar">
          <div class="trend-toolbar-left">
            <div class="tc">
              <span class="tc-label">粒度</span>
              <div class="seg trend-seg">
                <button
                  v-for="item in periodOptions"
                  :key="item.value"
                  type="button"
                  :class="{ active: trendPeriod === item.value }"
                  @click="trendPeriod = item.value"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>
            <div class="tc">
              <span class="tc-label">时间范围</span>
              <div class="seg trend-seg">
                <button
                  v-for="item in trendRanges"
                  :key="item.value"
                  type="button"
                  :class="{ active: trendRange === item.value }"
                  @click="trendRange = item.value"
                >
                  {{ item.label }}
                </button>
              </div>
            </div>
            <div class="tc">
              <span class="tc-label">模式</span>
              <div class="seg trend-seg">
                <button
                  type="button"
                  :class="{ active: trendMode === 'normalized' }"
                  @click="trendMode = 'normalized'"
                >
                  归一化
                </button>
                <button
                  type="button"
                  :class="{ active: trendMode === 'raw' }"
                  @click="trendMode = 'raw'"
                >
                  原值
                </button>
              </div>
            </div>
          </div>
          <MetricSetting
            v-model="activeTrendMetrics"
            class="trend-toolbar-add"
            :groups="trendMetricGroups"
            :max="4"
          />
        </div>
        <LineChart
          :metrics="trendChartMetrics"
          :x-axis="trendXAxis"
          :mode="trendMode"
          :loading="trendLoading"
          @remove="removeTrendMetric"
        >
          <template #extra>
            <span class="tch-meta">{{ trendMetaText }}</span>
          </template>
        </LineChart>
      </div>

      <MultiDimensionTable
        v-model:dimension="dimension"
        v-model:metric="metric"
        v-model:period="period"
        v-model:date-range="detailDateRange"
        v-model:keyword="filterForm.keyword"
        v-model:page-no="pageNo"
        v-model:page-size="pageSize"
        v-model:visible-column-keys="visibleColumnKeys"
        v-model:sort-field="detailSortField"
        v-model:sort-order="detailSortOrder"
        :loading="detailLoading"
        :error-text="detailError"
        :total="detailData.total"
        :rows="detailData.rows"
        :summary="detailData.summary"
        :dynamic-columns="detailData.dynamicColumns"
        :columns="availableColumns"
        :default-column-keys="defaultColumnKeys"
        :notice-html="currentTab.notice"
        :last-refreshed-at="lastRefreshedAt"
        :can-export="canExport"
        :metric-options="currentMetricOptions"
        :dimension-options="currentDimensionOptions"
        :channel="activeTab"
        :site-codes="filterForm.site"
        @refresh="loadDetail"
        @export="handleExport"
        @analyze="openAnalysisTab"
        @trend="openInlineTrend"
      />
    </template>

    <BoardPanel
      v-else
      :key="`${activeBoardType}-${boardQueryState[activeBoardType].revision}`"
      :active-tab="BOARD_TYPE_TO_TAB[activeBoardType]"
      :default-query="boardQueryState[activeBoardType].query"
    />

    <InlineTrendChart
      v-model="trendDialogVisible"
      :asin="trendCtx.asin"
      :search-mode="trendCtx.searchMode"
      :board-type="trendCtx.boardType"
      :site="trendCtx.site"
      :shop-ids="trendCtx.shopIds"
      :product-name="trendCtx.productName"
      :metric-key="metric"
      :metric-label="metricLabel"
      :date-end="getSitesTodayText(filterForm.site)"
    />
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, reactive, ref, watch } from 'vue'
  import { useRouter } from 'vue-router'
  import { ElMessage, ElMessageBox } from 'element-plus'
  import { ArrowDown, Close } from '@element-plus/icons-vue'
  import CardItems from '@/components/core/charts-comp/card-setting/items.vue'
  import CardSetting from '@/components/core/charts-comp/card-setting/setting.vue'
  import LineChart from '@/components/core/charts-comp/line-chart.vue'
  import MetricSetting from '@/components/core/charts-comp/metric-setting.vue'
  import type {
    CardGroup,
    CardLayoutState,
    CardMetric,
    ChartMetric,
    ChartMode,
    MetricGroup
  } from '@/components/core/charts-comp/types'
  import { DEFAULT_METRIC_PALETTE, mergeLayout } from '@/components/core/charts-comp/types'
  import { useAuth } from '@/composables/useAuth'
  import { useUserStore } from '@/store/modules/user'
  import {
    createSalesDetailExport,
    fetchSalesDetail,
    fetchSalesOverview,
    fetchSalesTrend,
    fetchSalesTrendMetricPool,
    type AsinBoardType,
    type DynamicColumn,
    type SalesDetail,
    type SalesDetailQuery,
    type SalesMetricOption
  } from '@/api/sale/sales-statistics'
  import { ASIN_BOARD_TABS, BOARD_TYPE_TO_TAB, CHANNEL_TO_BOARD_TYPE } from '../asin/board-tabs'
  import BoardPanel, { type BoardDefaultQuery } from '../asin/components/board-panel.vue'
  import KpiEllipsisText from './components/kpi-ellipsis-text.vue'
  import InlineTrendChart from './components/inline-trend-chart.vue'
  import MultiDimensionFilter from './components/multi-dimension-filter.vue'
  import MultiDimensionTable from './components/multi-dimension-table.vue'
  import {
    clipDateRangeToSiteToday,
    dateRangeDaysAgo,
    getSitesNowText,
    getSitesTodayText
  } from '../utils/site-date'
  import type {
    MetricCard,
    DimensionColumnConfig,
    OptionItem,
    SalesChannel,
    SalesDetailRow,
    SalesDimension,
    SalesFilterState,
    SalesMetric,
    SalesPeriod,
    TableColumnItem,
    TabConfig
  } from './components/sales-types'
  import {
    formatMetricDisplay,
    isRateMetric,
    normalizeTrendSeries,
    resolveMetricFormat
  } from './metric-format'

  defineOptions({ name: 'saleStatics' })

  const { hasAuth } = useAuth()
  const router = useRouter()
  const userStore = useUserStore()

  const tabConfigs: TabConfig[] = [
    {
      key: 'combined',
      title: '综合销量统计',
      exportAuth: 'sale:saleStatics:export',
      supportsShop: false,
      dimensions: ['pasin', 'asin', 'spu', 'sku', 'category', 'brand', 'shop', 'owner', 'site'],
      metrics: ['sales', 'revenue', 'return'],
      notice:
        '<b>综合销量统计</b> 合并 SC + VC 双渠道数据，订单仅统计 <b class="accent">FBA 渠道</b>、不含取消订单；销量按 <b class="accent">下单日期</b> 归集'
    },
    {
      key: 'sc',
      title: 'SC销量统计',
      exportAuth: 'sale:saleStatics:sc:export',
      supportsShop: true,
      dimensions: ['pasin', 'asin', 'spu', 'sku', 'category', 'brand', 'shop', 'owner', 'site'],
      metrics: ['sales', 'revenue', 'order', 'return'],
      notice:
        '<b>SC 销量统计</b> 仅统计 <b class="accent">Seller Central / FBA</b> 渠道订单，已取消订单不计入；换货订单合并为 <b class="accent">下单当天 1 单</b>，销售额仅含买家已付款订单'
    },
    {
      key: 'vc',
      title: 'VC销量统计',
      exportAuth: 'sale:saleStatics:vc:export',
      supportsShop: false,
      dimensions: ['pasin', 'asin', 'spu', 'sku', 'category', 'brand', 'owner', 'site'],
      metrics: ['sales', 'return'],
      notice: '<b>VC 销量统计</b> 仅统计 VC 销售单和 DF 单数据，来源 <b class="accent">1P API</b>'
    }
  ]

  const dimensionOptions: OptionItem<SalesDimension>[] = [
    { label: '父ASIN', value: 'pasin' },
    { label: 'ASIN', value: 'asin' },
    { label: 'SPU', value: 'spu' },
    { label: '销售 SKU', value: 'sku' },
    { label: '分类', value: 'category' },
    { label: '品牌', value: 'brand' },
    { label: '店铺', value: 'shop' },
    { label: '负责人', value: 'owner' },
    { label: '国家', value: 'site' }
  ]
  const metricOptions: OptionItem<SalesMetric>[] = [
    { label: '销量', value: 'sales' },
    { label: '销售额', value: 'revenue' },
    { label: '订单量', value: 'order' },
    { label: '退货量', value: 'return' }
  ]
  const periodOptions: OptionItem<SalesPeriod>[] = [
    { label: '日', value: 'day' },
    { label: '周', value: 'week' },
    { label: '月', value: 'month' }
  ]

  // 列宽统一 +10px（日期列与自适应列 project/shop 除外）以缓解列内容偏挤；自适应列保留原 min-width 参与剩余宽度分配
  const staticColumns: TableColumnItem[] = [
    { key: 'expand', label: '展开', width: 38, frozen: true, readonly: true },
    { key: 'img', label: '图片', width: 64, frozen: true, readonly: true },
    { key: 'analyze', label: '分析', width: 60, frozen: true, align: 'center', readonly: true },
    { key: 'pasin', label: '父ASIN', width: 120, frozen: true, defaultVisible: true },
    { key: 'asin', label: 'ASIN', width: 120, frozen: true, defaultVisible: true },
    { key: 'sku', label: '销售 SKU', width: 120, defaultVisible: false },
    { key: 'name', label: '中文品名', width: 150, defaultVisible: false },
    { key: 'title', label: '标题', width: 230, defaultVisible: false },
    { key: 'project', label: 'SPU', width: 86, flex: true, defaultVisible: true },
    { key: 'category', label: '分类', width: 100, defaultVisible: false },
    { key: 'brand', label: '品牌', width: 92, defaultVisible: false },
    { key: 'shop', label: '店铺', width: 120, flex: true, defaultVisible: true },
    { key: 'site', label: '国家', width: 74, defaultVisible: false },
    { key: 'owner', label: '负责人', width: 94, defaultVisible: false },
    { key: 'trend', label: '趋势分析', width: 118, align: 'center', defaultVisible: false },
    { key: 'avg7', label: '近7日均值', width: 124, align: 'right', defaultVisible: false },
    { key: 'growth', label: '较前7日涨幅', width: 134, align: 'right', defaultVisible: false },
    { key: 'subtotal', label: '小计', width: 92, align: 'right', defaultVisible: true }
  ]

  // PRD 11.6 销售明细字段：SC/VC 分别以原型 6.10.html COLUMN_CONFIGS.sc / .vc 的 dimOrders、dimDefaults 为准
  const SC_DIM_COLUMNS: Record<string, DimensionColumnConfig> = {
    pasin: {
      defaults: ['img', 'analyze', 'pasin', 'asin', 'project', 'shop', 'site', 'subtotal'],
      order: [
        'img',
        'analyze',
        'pasin',
        'asin',
        'name',
        'title',
        'project',
        'category',
        'brand',
        'shop',
        'site',
        'owner',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    asin: {
      defaults: [
        'img',
        'analyze',
        'asin',
        'sku',
        'name',
        'shop',
        'site',
        'avg7',
        'growth',
        'subtotal'
      ],
      order: [
        'img',
        'analyze',
        'asin',
        'sku',
        'name',
        'title',
        'pasin',
        'project',
        'category',
        'brand',
        'shop',
        'site',
        'owner',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    spu: {
      defaults: [
        'img',
        'project',
        'asin',
        'sku',
        'name',
        'shop',
        'site',
        'avg7',
        'growth',
        'subtotal'
      ],
      order: [
        'img',
        'project',
        'asin',
        'name',
        'title',
        'pasin',
        'sku',
        'category',
        'brand',
        'shop',
        'site',
        'owner',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    sku: {
      defaults: ['img', 'asin', 'sku', 'name', 'shop', 'site', 'avg7', 'growth', 'subtotal'],
      order: [
        'img',
        'asin',
        'sku',
        'name',
        'title',
        'pasin',
        'project',
        'category',
        'brand',
        'shop',
        'site',
        'owner',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    category: {
      defaults: [
        'category',
        'asin',
        'sku',
        'project',
        'pasin',
        'shop',
        'site',
        'avg7',
        'growth',
        'subtotal'
      ],
      order: [
        'category',
        'project',
        'asin',
        'sku',
        'name',
        'pasin',
        'brand',
        'shop',
        'site',
        'owner',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    brand: {
      defaults: [
        'brand',
        'asin',
        'sku',
        'project',
        'pasin',
        'shop',
        'site',
        'avg7',
        'growth',
        'subtotal'
      ],
      order: [
        'brand',
        'project',
        'asin',
        'sku',
        'name',
        'pasin',
        'category',
        'shop',
        'site',
        'owner',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    shop: {
      defaults: [
        'shop',
        'asin',
        'sku',
        'project',
        'pasin',
        'brand',
        'site',
        'avg7',
        'growth',
        'subtotal'
      ],
      order: [
        'shop',
        'project',
        'asin',
        'sku',
        'name',
        'pasin',
        'category',
        'brand',
        'site',
        'owner',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    owner: {
      defaults: [
        'owner',
        'asin',
        'sku',
        'project',
        'pasin',
        'brand',
        'shop',
        'site',
        'avg7',
        'growth',
        'subtotal'
      ],
      order: [
        'owner',
        'project',
        'asin',
        'sku',
        'name',
        'pasin',
        'category',
        'brand',
        'shop',
        'site',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    site: {
      defaults: [
        'site',
        'asin',
        'sku',
        'project',
        'pasin',
        'brand',
        'shop',
        'avg7',
        'growth',
        'subtotal'
      ],
      order: [
        'site',
        'project',
        'asin',
        'sku',
        'name',
        'pasin',
        'category',
        'brand',
        'shop',
        'owner',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    }
  }

  const VC_DIM_COLUMNS: Record<string, DimensionColumnConfig> = {
    pasin: {
      defaults: [
        'img',
        'analyze',
        'pasin',
        'asin',
        'name',
        'project',
        'site',
        'avg7',
        'growth',
        'subtotal'
      ],
      order: [
        'img',
        'analyze',
        'pasin',
        'asin',
        'name',
        'project',
        'category',
        'brand',
        'owner',
        'trend',
        'site',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    asin: {
      defaults: [
        'img',
        'analyze',
        'asin',
        'sku',
        'name',
        'pasin',
        'project',
        'site',
        'avg7',
        'growth',
        'subtotal'
      ],
      order: [
        'img',
        'analyze',
        'asin',
        'sku',
        'name',
        'pasin',
        'project',
        'category',
        'brand',
        'owner',
        'trend',
        'site',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    spu: {
      defaults: [
        'img',
        'project',
        'asin',
        'name',
        'pasin',
        'sku',
        'site',
        'avg7',
        'growth',
        'subtotal'
      ],
      order: [
        'img',
        'project',
        'asin',
        'name',
        'pasin',
        'sku',
        'category',
        'brand',
        'site',
        'owner',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    sku: {
      defaults: ['img', 'asin', 'sku', 'name', 'site', 'avg7', 'growth', 'subtotal'],
      order: [
        'img',
        'asin',
        'sku',
        'name',
        'pasin',
        'project',
        'category',
        'brand',
        'site',
        'owner',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    category: {
      defaults: [
        'category',
        'project',
        'asin',
        'sku',
        'pasin',
        'site',
        'avg7',
        'growth',
        'subtotal'
      ],
      order: [
        'category',
        'project',
        'asin',
        'sku',
        'name',
        'pasin',
        'brand',
        'site',
        'owner',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    brand: {
      defaults: ['brand', 'project', 'asin', 'sku', 'pasin', 'site', 'avg7', 'growth', 'subtotal'],
      order: [
        'brand',
        'project',
        'asin',
        'sku',
        'name',
        'pasin',
        'category',
        'site',
        'owner',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    owner: {
      defaults: ['owner', 'project', 'asin', 'sku', 'pasin', 'site', 'avg7', 'growth', 'subtotal'],
      order: [
        'owner',
        'project',
        'asin',
        'sku',
        'name',
        'pasin',
        'category',
        'brand',
        'site',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    },
    site: {
      defaults: ['site', 'project', 'asin', 'sku', 'pasin', 'avg7', 'growth', 'subtotal'],
      order: [
        'site',
        'project',
        'asin',
        'sku',
        'name',
        'pasin',
        'category',
        'brand',
        'owner',
        'trend',
        'avg7',
        'growth',
        'subtotal'
      ]
    }
  }

  const pad = (num: number) => String(num).padStart(2, '0')
  const toDateText = (date: Date) =>
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
  const parseDateText = (text: string): Date => {
    const [y, m, d] = text.split('-').map((item) => Number(item))
    return new Date(y, (m || 1) - 1, d || 1)
  }
  const addCalendarDays = (date: Date, days: number): Date => {
    const next = new Date(date)
    next.setDate(next.getDate() + days)
    return next
  }
  const DEFAULT_SITE = 'US'

  const defaultFilter = (): SalesFilterState => {
    const [dateStart, dateEnd] = dateRangeDaysAgo([DEFAULT_SITE], 14)
    return {
      site: [DEFAULT_SITE],
      shopIds: [],
      brandIds: [],
      categoryIds: [],
      ownerIds: [],
      productStatus: [],
      dateStart,
      dateEnd,
      keyword: ''
    }
  }

  const activeTab = ref<SalesChannel>('combined')
  const filterForm = ref<SalesFilterState>(defaultFilter())
  const detailDateRange = ref<[string, string]>([
    filterForm.value.dateStart,
    filterForm.value.dateEnd
  ])
  const dimension = ref<SalesDimension>('pasin')
  const metric = ref<SalesMetric>('sales')
  const period = ref<SalesPeriod>('day')
  const pageNo = ref(1)
  const pageSize = ref(20)
  const detailSortField = ref<string | undefined>(undefined)
  const detailSortOrder = ref<'asc' | 'desc' | undefined>(undefined)
  const overviewOpen = ref(false)
  const trendOpen = ref(false)
  const overviewLoading = ref(false)
  const detailLoading = ref(false)
  const detailError = ref('')
  const lastRefreshedAt = ref('')
  const overviewData = reactive<{ sales: MetricCard[]; ad: MetricCard[] }>({ sales: [], ad: [] })
  const STRUCTURAL_COLUMN_KEYS = ['expand']
  const filterConfigurableColumnKeys = (keys: string[]) =>
    keys.filter((key) => !STRUCTURAL_COLUMN_KEYS.includes(key))
  const defaultVisibleKeys = () =>
    filterConfigurableColumnKeys(
      getDimensionColumnConfig(activeTab.value, dimension.value).defaults
    )
  const visibleColumnKeys = ref<string[]>(defaultVisibleKeys())
  const detailData = ref<SalesDetail>({
    total: 0,
    columns: [],
    dynamicColumns: [],
    rows: [],
    summary: {}
  })

  const trendMode = ref<ChartMode>('normalized')
  const trendPeriod = ref<SalesPeriod>('day')
  const trendRange = ref('d7')
  const trendRanges = [
    { label: '近7天', value: 'd7' },
    { label: '近14天', value: 'd14' },
    { label: '近30天', value: 'd30' },
    { label: '本月', value: 'thisM' },
    { label: '上月', value: 'lastM' },
    { label: '今年', value: 'ytd' }
  ]
  const activeTrendMetrics = ref<string[]>(['sales', 'naturalSales', 'adSales'])
  const trendLoading = ref(false)
  // 趋势指标池：走趋势自己的接口 /metric-pool，与实时概况 /overview 完全独立，
  // 保证「选择对比指标」弹窗与折线图标签不依赖 overviewData。
  const trendMetricPool = reactive<{ sales: SalesMetricOption[]; ad: SalesMetricOption[] }>({
    sales: [],
    ad: []
  })
  const trendDynamicColumns = ref<DynamicColumn[]>([])
  const trendSeriesMap = reactive<Record<string, { values: number[]; normalized: number[] }>>({})
  const trendDialogVisible = ref(false)
  const trendRow = ref<SalesDetailRow | null>(null)
  /** 趋势分析弹框上下文：由当前行 + 筛选态推导，供 InlineTrendChart 查询 asin 分时/分日数据 */
  const trendCtx = ref<{
    asin: string
    searchMode: 'asin' | 'pasin'
    boardType: AsinBoardType
    site: string[]
    shopIds?: number[]
    productName: string
  }>({
    asin: '',
    searchMode: 'asin',
    boardType: 'asin',
    site: [],
    shopIds: undefined,
    productName: ''
  })

  type BoardQueryState = { query: BoardDefaultQuery; revision: number }
  const createBoardQueryState = (): Record<AsinBoardType, BoardQueryState> => ({
    asin: { query: {}, revision: 0 },
    scasin: { query: {}, revision: 0 },
    vcasin: { query: {}, revision: 0 }
  })
  const boardQueryState = reactive(createBoardQueryState())
  const visibleBoardTypes = ref<Set<AsinBoardType>>(new Set())
  const activeBoardType = ref<AsinBoardType | null>(null)

  const BOARD_PANE_PREFIX = 'board:'

  const boardPaneName = (boardType: AsinBoardType) => `${BOARD_PANE_PREFIX}${boardType}`

  const visibleBoardTabList = computed(() =>
    ASIN_BOARD_TABS.filter((tab) => visibleBoardTypes.value.has(tab.boardType))
  )

  /** 主 Tab + 动态 ASIN Tab 统一由 ElTabs 驱动 */
  const activePaneKey = computed({
    get: () => (activeBoardType.value ? boardPaneName(activeBoardType.value) : activeTab.value),
    set: (key: string | number) => {
      const name = String(key)
      if (name.startsWith(BOARD_PANE_PREFIX)) {
        activeBoardType.value = name.slice(BOARD_PANE_PREFIX.length) as AsinBoardType
        return
      }
      activeBoardType.value = null
      if (activeTab.value !== name) {
        activeTab.value = name as SalesChannel
      }
    }
  })

  type AnalysisDisplayRow = SalesDetailRow & { _isChild?: boolean }

  const currentTab = computed(
    () => tabConfigs.find((tab) => tab.key === activeTab.value) || tabConfigs[0]
  )
  const currentDimensionOptions = computed(() =>
    dimensionOptions.filter((item) => currentTab.value.dimensions.includes(item.value))
  )
  const currentMetricOptions = computed(() =>
    metricOptions.filter((item) => currentTab.value.metrics.includes(item.value))
  )
  const metricLabel = computed(
    () => metricOptions.find((item) => item.value === metric.value)?.label || '销量'
  )
  const canExport = computed(() => {
    const roles = userStore.info?.userFuncPermission?.roleInfoList || []
    const isSuperAdmin =
      userStore.info?.account === 'admin' ||
      userStore.info?.userName === '超级管理员' ||
      roles.some((role) => role.roleName === '超级管理员')
    return isSuperAdmin || hasAuth(currentTab.value.exportAuth)
  })

  const isAnalysisChildRow = (row: SalesDetailRow) =>
    Boolean(row.isChildRow || (row as AnalysisDisplayRow)._isChild)

  const resolveAnalysisShop = (row: SalesDetailRow): string | undefined => {
    // 后端 enrichPasinShopChildren：子行 isChildRow=true，店铺 id 为 storeId（w.store_id）；shop 为店铺名称仅展示
    if (isAnalysisChildRow(row)) {
      const storeId = row.storeId
      if (storeId !== undefined && storeId !== null && storeId !== '') {
        return String(storeId)
      }
    }
    if (currentTab.value.supportsShop && filterForm.value.shopIds.length) {
      return String(filterForm.value.shopIds[0])
    }
    return undefined
  }

  const resolveAnalysisSite = (row: SalesDetailRow): string => {
    const rowSite = String(row.site || '').trim()
    if (rowSite) return rowSite
    if (filterForm.value.site.length) return filterForm.value.site[0]
    return DEFAULT_SITE
  }

  const buildBoardQuery = (
    row: SalesDetailRow,
    keyword: string,
    searchMode: 'asin' | 'pasin'
  ): BoardDefaultQuery => {
    const shop = resolveAnalysisShop(row)
    return {
      keyword,
      searchType: searchMode,
      site: [resolveAnalysisSite(row)],
      shop: shop ? [shop] : undefined,
      dateRange: [detailDateRange.value[0], detailDateRange.value[1]],
      periodType: period.value
    }
  }

  const availableColumns = computed(() => {
    const config = getDimensionColumnConfig(activeTab.value, dimension.value)
    const allowed = new Set(config.order)
    return config.order
      .filter((key) => key !== 'expand')
      .map((key) => staticColumns.find((col) => col.key === key))
      .filter((col): col is TableColumnItem => Boolean(col) && allowed.has(col.key))
      .map((col) =>
        activeTab.value === 'vc' && col.key === 'name' ? { ...col, label: '中文品名' } : col
      )
  })
  /** 当前渠道+维度的 PRD 默认展示列（供子组件合并服务端列习惯，防止默认列被覆盖） */
  const defaultColumnKeys = computed(() =>
    filterConfigurableColumnKeys(
      getDimensionColumnConfig(activeTab.value, dimension.value).defaults
    )
  )
  /** 实时概况广告指标池（与后端 SalesAdStatisticsServiceImpl 一致；销售组需排除，避免同一 key 双组重复渲染） */
  const OVERVIEW_AD_METRIC_KEYS: Record<SalesChannel, readonly string[]> = {
    combined: [
      'adCost',
      'acos',
      'roas',
      'adConversionRate',
      'ctr',
      'cpc',
      'cpa',
      'cpo',
      'adImpressions',
      'adClicks'
    ],
    sc: [
      'adCost',
      'adRevenue',
      'adOrder',
      'acos',
      'roas',
      'adConversionRate',
      'ctr',
      'cpc',
      'cpa',
      'cpo',
      'adImpressions',
      'adClicks'
    ],
    vc: [
      'adCost',
      'acos',
      'roas',
      'adConversionRate',
      'ctr',
      'cpc',
      'cpa',
      'cpo',
      'adImpressions',
      'adClicks'
    ]
  }

  const filterOverviewSalesMetrics = (channel: SalesChannel, metrics: MetricCard[]) => {
    const adKeys = new Set(OVERVIEW_AD_METRIC_KEYS[channel])
    // 综合/VC 销售指标去掉「转化率」(conversionRate)，SC 保留
    const dropSales = channel === 'sc' ? new Set<string>() : new Set(['conversionRate'])
    return metrics.filter((item) => !adKeys.has(item.metric) && !dropSales.has(item.metric))
  }

  const filterOverviewAdMetrics = (channel: SalesChannel, metrics: MetricCard[]) => {
    const adKeys = new Set(OVERVIEW_AD_METRIC_KEYS[channel])
    return metrics.filter((item) => adKeys.has(item.metric))
  }

  /** 实时概况各渠道默认勾选指标（默认展示 4&4，指标仍可手动加至上限 5） */
  const OVERVIEW_DEFAULTS: Record<string, Record<string, string[]>> = {
    combined: {
      sales: ['sales', 'revenue', 'adSales', 'returnRate'],
      ad: ['adCost', 'acos', 'adConversionRate', 'ctr']
    },
    sc: {
      sales: ['sales', 'revenue', 'asp', 'returnRate'],
      ad: ['adCost', 'adRevenue', 'adOrder', 'acos']
    },
    vc: {
      sales: ['sales', 'adSales', 'returnRate', 'return'],
      ad: ['adCost', 'acos', 'adConversionRate', 'ctr']
    }
  }

  const buildChannelDefaultLayout = (
    channel: SalesChannel,
    groups: CardGroup[]
  ): CardLayoutState => {
    const def = OVERVIEW_DEFAULTS[channel] || OVERVIEW_DEFAULTS.combined
    const selected = [...new Set([...def.sales, ...def.ad])]
    const orders = Object.fromEntries(groups.map((g) => [g.key, g.items.map((i) => i.key)]))
    return { orders, selected }
  }

  const overviewLayouts = reactive<Record<SalesChannel, CardLayoutState>>({
    combined: { orders: {}, selected: [] },
    sc: { orders: {}, selected: [] },
    vc: { orders: {}, selected: [] }
  })

  const overviewLayout = computed({
    get: () => overviewLayouts[activeTab.value],
    set: (val) => {
      overviewLayouts[activeTab.value] = val
    }
  })

  const overviewCardGroups = computed<CardGroup[]>(() => {
    const channel = activeTab.value
    const defaults = OVERVIEW_DEFAULTS[channel] || OVERVIEW_DEFAULTS.combined
    const defaultSelected = new Set([...defaults.sales, ...defaults.ad])
    const toCardMetric = (item: MetricCard): CardMetric => ({
      key: item.metric,
      label: displayMetricLabel(item.metric, item.label),
      tooltip: metricTooltip(item.metric, item.label),
      defaultSelected: defaultSelected.has(item.metric)
    })
    return [
      {
        key: 'sales',
        title: '销售指标',
        max: 4,
        items: overviewData.sales.map(toCardMetric)
      },
      {
        key: 'ad',
        title: '广告指标',
        max: 4,
        items: overviewData.ad.map(toCardMetric)
      }
    ]
  })

  const getMetricCard = (key: string): MetricCard | undefined =>
    [...overviewData.sales, ...overviewData.ad].find((item) => item.metric === key)

  const onOverviewCardClick = (metric: CardMetric) => toggleTrendMetric(metric.key)

  const trendMetricGroups = computed<MetricGroup[]>(() => {
    // 主来源 /metric-pool；某组为空时回退 /overview 的同组卡片，避免任一接口异常导致选择器空白。
    const toItems = (pool: SalesMetricOption[], fallback: MetricCard[]): MetricGroup['items'] => {
      const source = pool.length ? pool : fallback || []
      return source
        .filter((item) => item?.metric)
        .map((item) => ({
          key: item.metric,
          label: String(item.label ?? item.metric),
          format: resolveMetricFormat(item.metric)
        }))
    }
    return [
      {
        key: 'sales',
        title: '销售指标',
        items: toItems(trendMetricPool.sales, overviewData.sales)
      },
      { key: 'ad', title: '广告指标', items: toItems(trendMetricPool.ad, overviewData.ad) }
    ]
  })

  // 指标码 → 中文标签映射（供折线图芯片/曲线标签使用）。
  // 主来源：趋势指标池 /metric-pool；兜底：实时概况 /overview 的卡片标签。
  // 两个来源都可能为空/报错（此时对应数组为 []），逐项判空，保证不崩、最终回退到 key。
  const trendMetricLabelMap = computed<Record<string, string>>(() => {
    const map: Record<string, string> = {}
    // 兜底先写入 /overview 标签（指标池缺失时用它）
    ;[...(overviewData.sales || []), ...(overviewData.ad || [])].forEach((item) => {
      if (item?.metric && item?.label) map[item.metric] = String(item.label)
    })
    // 主来源 /metric-pool 覆盖（指标池优先）
    ;[...(trendMetricPool.sales || []), ...(trendMetricPool.ad || [])].forEach((item) => {
      if (item?.metric && item?.label) map[item.metric] = String(item.label)
    })
    return map
  })

  const buildBaseParams = () => {
    const toNumberList = (values: number[]) =>
      values.map((item) => Number(item)).filter((item) => !Number.isNaN(item))
    const normalizeSites = (sites: string[]) =>
      sites.map((item) => String(item).trim().toUpperCase()).filter(Boolean)

    const site = normalizeSites(filterForm.value.site)
    const shopIds = toNumberList(filterForm.value.shopIds)
    const brandIds = toNumberList(filterForm.value.brandIds)
    const categoryIds = toNumberList(filterForm.value.categoryIds)
    const ownerIds = toNumberList(filterForm.value.ownerIds)

    // 仅公共筛选（顶部筛选栏）：渠道/站点/店铺/品牌/分类/负责人/产品状态。
    // 日期与关键词属于「销售明细」专属条件，不在此处，避免污染 实时概况指标/趋势折线图。
    return {
      channel: activeTab.value,
      site: site.length ? site : undefined,
      shopIds: shopIds.length ? shopIds : undefined,
      brandIds: brandIds.length ? brandIds : undefined,
      categoryIds: categoryIds.length ? categoryIds : undefined,
      ownerIds: ownerIds.length ? ownerIds : undefined,
      productStatus: filterForm.value.productStatus.length
        ? filterForm.value.productStatus
        : undefined
    }
  }

  const buildDetailQuery = (): SalesDetailQuery => ({
    ...buildBaseParams(),
    // 明细专属：日期区间 + 关键词搜索
    dateStart: detailDateRange.value[0],
    dateEnd: detailDateRange.value[1],
    keyword: filterForm.value.keyword,
    dimension: dimension.value,
    metric: metric.value,
    period: period.value,
    columns: visibleColumnKeys.value,
    pageNo: pageNo.value,
    pageSize: pageSize.value,
    hasCount: true,
    sortField: detailSortField.value,
    sortOrder: detailSortOrder.value
  })

  function getDimensionColumnConfig(
    channel: SalesChannel,
    dim: SalesDimension
  ): DimensionColumnConfig {
    if (channel === 'vc') {
      return VC_DIM_COLUMNS[dim] || VC_DIM_COLUMNS.pasin
    }
    return SC_DIM_COLUMNS[dim] || SC_DIM_COLUMNS.pasin
  }

  /** 将显隐集合与维度 defaults 合并，并依 config.order 归一化顺序（PRD 默认列不可被习惯缓存漏掉） */
  const normalizeVisibleColumnKeys = (
    channel: SalesChannel,
    dim: SalesDimension,
    keys: string[]
  ) => {
    const config = getDimensionColumnConfig(channel, dim)
    const allowed = new Set(config.order)
    const required = new Set(filterConfigurableColumnKeys(config.defaults))
    const merged = new Set(
      keys.filter((key) => typeof key === 'string' && allowed.has(key) && key !== 'expand')
    )
    required.forEach((key) => merged.add(key))
    return filterConfigurableColumnKeys(config.order.filter((key) => merged.has(key)))
  }

  // v8：VC 列配置对齐 PRD 11.6.2 字段池截图（dimOrders / dimDefaults），bump 版本作废旧列习惯
  const columnStorageKey = (channel: SalesChannel, dim: SalesDimension) =>
    `sale-statics-detail-v8-${channel}-${dim}`

  const loadVisibleColumnKeys = (channel: SalesChannel, dim: SalesDimension) => {
    const config = getDimensionColumnConfig(channel, dim)
    const defaults = filterConfigurableColumnKeys(config.defaults)
    const allowed = new Set(config.order)
    try {
      const stored = JSON.parse(localStorage.getItem(columnStorageKey(channel, dim)) || 'null')
      if (Array.isArray(stored) && stored.length) {
        // 仅取本地存储的「显隐集合」，顺序一律按维度配置 config.order 归一化。
        // 若缓存缺少任一 PRD 默认列（如「国家」），视为过期缓存，回退到 defaults。
        const storedKeys = stored.filter(
          (key): key is string => typeof key === 'string' && allowed.has(key)
        )
        const missingDefault = defaults.some((key) => !storedKeys.includes(key))
        if (missingDefault) return defaults
        return normalizeVisibleColumnKeys(channel, dim, storedKeys)
      }
    } catch {
      return defaults
    }
    return defaults
  }

  const persistVisibleColumnKeys = () => {
    localStorage.setItem(
      columnStorageKey(activeTab.value, dimension.value),
      JSON.stringify(visibleColumnKeys.value)
    )
  }

  const applyDimensionColumns = () => {
    visibleColumnKeys.value = normalizeVisibleColumnKeys(
      activeTab.value,
      dimension.value,
      loadVisibleColumnKeys(activeTab.value, dimension.value)
    )
  }

  /**
   * 实时概况指标气泡文案：同一指标在综合 / SC / VC 三渠道口径不同，故按渠道分别维护。
   * 命中当前渠道优先，未命中再回退到 combined，最后回退到通用说明。
   */
  const METRIC_TOOLTIPS_BY_CHANNEL: Record<SalesChannel, Record<string, string>> = {
    combined: {
      sales: 'SC销量+VC销量',
      revenue: 'SC销售额+VC销售额',
      naturalSales: 'SC自然销量+VC自然销量',
      adSales: 'SC广告销量+VC广告销量',
      returnRate: '（SC+VC退货量）÷（SC+VC总销量）',
      return: 'SC退货量+VC退货量',
      offSiteSales: 'SC站外销量',
      pageViews: 'SC浏览量+VC浏览量',
      naturalSalesRatio: '（SC+VC自然销量）/（SC+VC总销量）',
      adSalesRatio: '（SC+VC广告销量）/（SC+VC总销量）',
      adCost: 'SC广告花费+VC广告花费',
      acos: '广告花费 ÷ 广告销售额',
      roas: '广告销售额 ÷ 广告花费',
      adConversionRate: '（SC+VC广告订单量）÷（SC+VC点击量）',
      ctr: '点击量 ÷ 曝光量',
      cpc: '广告花费 ÷ 点击量',
      cpa: '广告花费 ÷ 广告订单量',
      cpo: '广告花费 ÷ 订单量（=SC订单量+VC销量）',
      adImpressions: 'SC曝光量+VC曝光量',
      adClicks: 'SC点击量+VC点击量'
    },
    sc: {
      sales: '已支付 FBA 订单的销售件数（不含取消、含换货合并）',
      revenue: '剔除已取消订单的成交总金额（不含运费、不含税）',
      order: '剔除已取消状态的订单总数（一单一计、不含取消、换货合并为 1 单）',
      asp: '销售额 ÷ 销量',
      returnRate: '退货量 ÷ 销量（仅统计已确认退货）',
      return: '已确认退货的商品件数',
      returnAmount: '已确认退货对应的销售额',
      naturalSales: '总销量-广告销量-站外销量',
      adSales: 'SP广告归因带来的销售件数',
      offSiteSales: '促销id包含Percentage Off的订单带来的销量',
      naturalSalesRatio: '自然销量 ÷ 销量',
      adSalesRatio: '广告销量 ÷ 销量',
      naturalRevenue: '总销售额-广告销售额-站外销售额',
      adRevenue: 'SP广告归因的销售额',
      sessions: '商品详情页 Sessions数',
      pageViews: '商品详情页 Page_views数',
      naturalConversionRate:
        '自然订单量（=总订单量-广告订单量-站外订单量）÷ 自然点击数（=Session-点击量）',
      conversionRate: '订单量 ÷ 访问量Sessions',
      adCost: 'SP广告 campaign 的累计花费',
      adOrder: '广告归因的订单总数',
      acos: '广告花费 ÷ 广告销售额',
      roas: '广告销售额 ÷ 广告花费',
      adConversionRate: '广告订单量 ÷ 点击量',
      ctr: '点击量 ÷ 曝光量',
      cpc: '广告花费 ÷ 点击量',
      cpa: '广告花费 ÷ 广告订单量',
      cpo: '广告花费 ÷ 总订单量',
      adImpressions: '广告展现次数（Impressions）',
      adClicks: '广告点击次数（Clicks）'
    },
    vc: {
      sales: '已支付 FBA 订单的销售件数（不含取消、含换货合并）',
      revenue: '剔除已取消订单的成交总金额（不含运费、不含税）',
      naturalSales: '总销量-广告销量',
      adSales: 'SP广告归因带来的销售件数',
      returnRate: '退货量 ÷ 销量（仅统计已确认退货）',
      return: '已确认退货的商品件数',
      pageViews: '商品详情页glance_views数',
      naturalSalesRatio: '自然销量 ÷ 销量',
      adSalesRatio: '广告销量 ÷ 销量',
      adCost: 'SP广告 campaign 的累计花费',
      acos: '广告花费 ÷ 广告销售额',
      roas: '广告销售额 ÷ 广告花费',
      adConversionRate: '广告订单量 ÷ 点击量',
      ctr: '点击量 ÷ 曝光量',
      cpc: '广告花费 ÷ 点击量',
      cpa: '广告花费 ÷ 广告订单量',
      cpo: '广告花费 ÷ 总订单量（VC订单量取VC销量）',
      adImpressions: '广告展现次数（Impressions）',
      adClicks: '广告点击次数（Clicks）'
    }
  }
  const metricTooltip = (metricKey: string, label: string) => {
    const channelTips = METRIC_TOOLTIPS_BY_CHANNEL[activeTab.value]
    return (
      channelTips[metricKey] ||
      METRIC_TOOLTIPS_BY_CHANNEL.combined[metricKey] ||
      `${label} · 数据口径说明`
    )
  }
  /** 指标展示名覆盖：与原型保持一致（后端枚举名 → 原型业务名）。 */
  const METRIC_LABEL_OVERRIDE: Record<string, string> = {
    asp: '件单价',
    adOrder: '广告订单量'
  }
  const displayMetricLabel = (metricKey: string, label: string) =>
    METRIC_LABEL_OVERRIDE[metricKey] || label
  /** 负向指标：数值越低越好（上升=变差=红）。其余指标默认越高越好。 */
  const NEGATIVE_METRICS = new Set(['returnRate', 'return', 'acos', 'adCost', 'cpc', 'cpa', 'cpo'])
  /** 语义化涨跌色：变好=绿(up)，变差=红(down)，持平=灰。与原型环比配色一致。 */
  const envClass = (metricKey: string, value: unknown) => {
    const num = Number(value)
    if (value === null || value === undefined || value === '' || Number.isNaN(num) || num === 0)
      return 'flat'
    const better = NEGATIVE_METRICS.has(metricKey) ? num < 0 : num > 0
    return better ? 'up' : 'down'
  }
  const envText = (value: unknown) => {
    const num = Number(value)
    if (value === null || value === undefined || value === '' || Number.isNaN(num)) return '—'
    const arrow = num > 0 ? '↑' : num < 0 ? '↓' : '—'
    return `${arrow}${Math.abs(num * 100).toFixed(2)}%`
  }
  const formatRate = (value: unknown) => {
    if (value === null || value === undefined || value === '') return '-'
    const num = Number(value)
    if (Number.isNaN(num)) return '-'
    return `${(num * 100).toFixed(2)}%`
  }
  const formatMetricValue = (value: unknown, key: string) => formatMetricDisplay(value, key)

  const TREND_PRESET_DAYS: Record<string, number> = { d7: 7, d14: 14, d30: 30 }

  const clipTrendAnchorEnd = (endText: string, sites?: string[]): string => {
    const max = getSitesTodayText(sites ?? filterForm.value.site)
    return endText > max ? max : endText
  }

  /** 趋势图时间范围：近 N 天 = 含首尾共 N 个自然日（与原型 getTrendDates 一致） */
  const resolveTrendDateRange = (
    code: string,
    anchorEnd: string
  ): { dateStart: string; dateEnd: string; label: string; presetDays?: number } => {
    const dateEnd = clipTrendAnchorEnd(anchorEnd)
    const end = parseDateText(dateEnd)
    const presetDays = TREND_PRESET_DAYS[code]
    if (presetDays) {
      return {
        dateStart: toDateText(addCalendarDays(end, -(presetDays - 1))),
        dateEnd,
        label: code === 'd7' ? '近7天' : code === 'd14' ? '近14天' : '近30天',
        presetDays
      }
    }
    switch (code) {
      case 'thisM':
        return {
          dateStart: toDateText(new Date(end.getFullYear(), end.getMonth(), 1)),
          dateEnd,
          label: '本月'
        }
      case 'lastM': {
        const start = new Date(end.getFullYear(), end.getMonth() - 1, 1)
        const last = new Date(end.getFullYear(), end.getMonth(), 0)
        return { dateStart: toDateText(start), dateEnd: toDateText(last), label: '上月' }
      }
      case 'ytd':
        return {
          dateStart: toDateText(new Date(end.getFullYear(), 0, 1)),
          dateEnd,
          label: '今年'
        }
      default:
        return {
          dateStart: toDateText(addCalendarDays(end, -6)),
          dateEnd,
          label: '近7天',
          presetDays: 7
        }
    }
  }

  // 加载趋势指标池（按渠道）。独立于 /overview，供「选择对比指标」与折线图标签使用。
  const loadTrendMetricPool = async () => {
    try {
      const pool = await fetchSalesTrendMetricPool(activeTab.value)
      trendMetricPool.sales = pool?.salesMetrics || []
      trendMetricPool.ad = pool?.adMetrics || []
    } catch {
      trendMetricPool.sales = []
      trendMetricPool.ad = []
    }
  }

  const loadTrendChart = async () => {
    if (!trendOpen.value || !activeTrendMetrics.value.length) {
      trendDynamicColumns.value = []
      Object.keys(trendSeriesMap).forEach((key) => delete trendSeriesMap[key])
      return
    }
    trendLoading.value = true
    // 趋势图为「实时」视图：锚定「美国最新日期」（太平洋时间当天）往回数，与销售明细日期完全解耦。
    // 前端按美国时间算好起止日再传后端，不传 range（后端 range 预设按服务器今天=中国时间会整体偏一天）。
    const anchorEnd = getSitesTodayText(filterForm.value.site)
    const { dateStart, dateEnd } = resolveTrendDateRange(trendRange.value, anchorEnd)
    // 空值→NaN：折线断点、行尾/tooltip 显示「-」（数量型后端已回 0，仅比率型缺值为 null）
    const toNum = (v: number | null | undefined): number => (v == null ? NaN : Number(v))
    try {
      // 趋势专用接口：一次返回所有对比指标序列，含 values(原值) 与 normalizedValues(0~100)，时间轴已按粒度补齐
      const res = await fetchSalesTrend({
        ...buildBaseParams(),
        dateStart,
        dateEnd,
        granularity: trendPeriod.value,
        metrics: [...activeTrendMetrics.value]
      })
      trendDynamicColumns.value = res.columns || []
      const seriesByMetric = new Map((res.series || []).map((item) => [item.metric, item]))
      activeTrendMetrics.value.forEach((metricKey) => {
        const series = seriesByMetric.get(metricKey)
        trendSeriesMap[metricKey] = {
          values: (series?.values || []).map(toNum),
          normalized: (series?.normalizedValues || []).map(toNum)
        }
      })
      Object.keys(trendSeriesMap).forEach((key) => {
        if (!activeTrendMetrics.value.includes(key)) delete trendSeriesMap[key]
      })
    } catch {
      trendDynamicColumns.value = []
      Object.keys(trendSeriesMap).forEach((key) => delete trendSeriesMap[key])
    } finally {
      trendLoading.value = false
    }
  }

  const trendXAxis = computed(() => trendDynamicColumns.value.map((item) => item.label))

  /**
   * 指标 → 颜色 的稳定映射：与 MetricSetting 算法一致，首次选中分配一个未占用颜色，
   * 选中期间固定不变，移除某指标不影响其余指标颜色（移除项颜色回收，供后续新增复用），
   * 避免按下标取色导致移除中间项后后续指标颜色串位。
   */
  const trendColorMap = ref<Record<string, string>>({})
  watch(
    activeTrendMetrics,
    (keys) => {
      const map: Record<string, string> = {}
      keys.forEach((k) => {
        if (trendColorMap.value[k]) map[k] = trendColorMap.value[k]
      })
      const used = new Set(Object.values(map))
      keys.forEach((k) => {
        if (map[k]) return
        const free =
          DEFAULT_METRIC_PALETTE.find((c) => !used.has(c)) ??
          DEFAULT_METRIC_PALETTE[used.size % DEFAULT_METRIC_PALETTE.length]
        map[k] = free
        used.add(free)
      })
      trendColorMap.value = map
    },
    { immediate: true }
  )

  const trendChartMetrics = computed<ChartMetric[]>(() =>
    activeTrendMetrics.value.map((key, index) => {
      const entry = trendSeriesMap[key] || { values: [], normalized: [] }
      return {
        key,
        label: displayMetricLabel(key, trendMetricLabelMap.value[key] || key),
        color:
          trendColorMap.value[key] ?? DEFAULT_METRIC_PALETTE[index % DEFAULT_METRIC_PALETTE.length],
        format: resolveMetricFormat(key),
        // 原值序列：比率类 ×100 转百分数刻度（0.05→5），供「原值」模式与行尾/tooltip 展示真实值
        data: normalizeTrendSeries(key, entry.values),
        // 后端归一化值(0~100)：供「归一化」模式直接绘制，避免前后端二次归一化偏差
        normalized: entry.normalized
      }
    })
  )
  const trendMetaText = computed(() => {
    const anchorEnd = getSitesTodayText(filterForm.value.site)
    const range = resolveTrendDateRange(trendRange.value, anchorEnd)
    const periodLabel = periodOptions.find((item) => item.value === trendPeriod.value)?.label || ''
    const modeLabel = trendMode.value === 'normalized' ? '归一化' : '原值'
    const axisSpan =
      trendDynamicColumns.value.length > 0
        ? `${trendDynamicColumns.value[0]?.label || range.dateStart} ~ ${trendDynamicColumns.value.at(-1)?.label || range.dateEnd}`
        : `${range.dateStart} ~ ${range.dateEnd}`
    return [
      currentTab.value.title,
      range.label,
      axisSpan,
      periodLabel,
      modeLabel,
      `${activeTrendMetrics.value.length} 项指标`
    ].join(' · ')
  })

  const toggleTrendMetric = (metricKey: string) => {
    if (activeTrendMetrics.value.includes(metricKey)) {
      activeTrendMetrics.value = activeTrendMetrics.value.filter((item) => item !== metricKey)
      return
    }
    if (activeTrendMetrics.value.length >= 4) {
      ElMessage.warning('最多选择 4 个对比指标')
      return
    }
    activeTrendMetrics.value = [...activeTrendMetrics.value, metricKey]
  }

  const removeTrendMetric = (metricKey: string) => {
    activeTrendMetrics.value = activeTrendMetrics.value.filter((item) => item !== metricKey)
  }

  const loadOverview = async () => {
    overviewLoading.value = true
    try {
      // 实时概况为「实时」快照：不传日期，由后端按服务器「今天」自算窗口。
      // 与销售明细的日期/关键词完全解耦（明细条件不进 buildBaseParams）。
      const data = await fetchSalesOverview(buildBaseParams())
      overviewData.sales = filterOverviewSalesMetrics(activeTab.value, data?.salesMetrics || [])
      overviewData.ad = filterOverviewAdMetrics(activeTab.value, data?.adMetrics || [])
    } catch {
      overviewData.sales = []
      overviewData.ad = []
    } finally {
      overviewLoading.value = false
    }
  }

  const loadDetail = async () => {
    detailLoading.value = true
    detailError.value = ''
    try {
      const detail = await fetchSalesDetail(buildDetailQuery())
      // 日期列倒序展示：最近日期在前（紧跟「小计」列），行数据按列 key 取值，反转不影响数值
      detail.dynamicColumns = [...(detail.dynamicColumns || [])].reverse()
      // 后端约定：翻页(pageNo>1)返回 total=0，由前端复用首页总数。
      // 若直接覆盖会使分页组件 total 变 0，触发 el-pagination 把当前页 clamp 回第 1 页。
      if (pageNo.value > 1) {
        detail.total = detailData.value.total
      }
      detailData.value = detail
    } catch (error) {
      detailData.value = { total: 0, columns: [], dynamicColumns: [], rows: [], summary: {} }
      detailError.value = error instanceof Error ? error.message : '接口异常，请稍后重试'
    } finally {
      lastRefreshedAt.value = getSitesNowText(filterForm.value.site)
      detailLoading.value = false
    }
  }

  const reloadAll = () => {
    filterForm.value.dateStart = detailDateRange.value[0]
    filterForm.value.dateEnd = detailDateRange.value[1]
    pageNo.value = 1
    loadOverview()
    loadDetail()
    if (trendOpen.value) loadTrendChart()
  }

  const resetFilter = () => {
    filterForm.value = defaultFilter()
    detailDateRange.value = [filterForm.value.dateStart, filterForm.value.dateEnd]
    reloadAll()
  }

  const handleExport = async () => {
    if (!canExport.value) {
      ElMessage.warning('无导出权限')
      return
    }
    if (detailData.value.total > 50000) {
      await ElMessageBox.confirm(
        '当前筛选结果超过 50000 条，导出可能耗时较久，是否继续？',
        '导出提示',
        {
          confirmButtonText: '继续导出',
          cancelButtonText: '取消',
          type: 'warning'
        }
      )
    }
    try {
      const taskId = await createSalesDetailExport(buildDetailQuery())
      ElMessageBox.confirm(`导出任务已创建，任务ID：${taskId}`, '提示', {
        confirmButtonText: '跳转到下载中心',
        cancelButtonText: '关闭',
        type: 'success'
      }).then(() => {
        router.push('/download-center')
      })
    } catch (error) {
      ElMessage.error(error instanceof Error ? error.message : '导出任务创建失败')
    }
  }

  const closeBoardTab = (boardType: AsinBoardType) => {
    const next = new Set(visibleBoardTypes.value)
    next.delete(boardType)
    visibleBoardTypes.value = next
    if (activeBoardType.value !== boardType) return
    const remaining = [...next]
    activeBoardType.value = remaining.length > 0 ? remaining[0] : null
  }

  /** 页面内打开 ASIN 看板 Tab（同级页签，每次点击覆盖查询参数并强制刷新） */
  const openAnalysisTab = (row: SalesDetailRow) => {
    const isChildRow = isAnalysisChildRow(row)
    const rawAsin = String(
      dimension.value === 'pasin' && !isChildRow
        ? row.pasin || row.asin || row.sku
        : row.asin || row.pasin || row.sku
    ).trim()
    if (!rawAsin) {
      ElMessage.warning('当前行缺少 ASIN / 父ASIN，无法打开分析页签')
      return
    }
    const searchMode = dimension.value === 'pasin' && !isChildRow ? 'pasin' : 'asin'
    const boardType = CHANNEL_TO_BOARD_TYPE[activeTab.value]
    visibleBoardTypes.value = new Set([...visibleBoardTypes.value, boardType])
    boardQueryState[boardType] = {
      query: buildBoardQuery(row, rawAsin, searchMode),
      revision: Date.now()
    }
    activeBoardType.value = boardType
  }

  const openInlineTrend = (row: SalesDetailRow) => {
    const isChildRow = isAnalysisChildRow(row)
    const rawAsin = String(
      dimension.value === 'pasin' && !isChildRow
        ? row.pasin || row.asin || row.sku
        : row.asin || row.pasin || row.sku
    ).trim()
    if (!rawAsin) {
      ElMessage.warning('当前行缺少 ASIN / 父ASIN，无法打开趋势分析')
      return
    }
    const searchMode = dimension.value === 'pasin' && !isChildRow ? 'pasin' : 'asin'
    const shop = resolveAnalysisShop(row)
    const shopId = shop ? Number(shop) : NaN
    trendRow.value = row
    trendCtx.value = {
      asin: rawAsin,
      searchMode,
      boardType: CHANNEL_TO_BOARD_TYPE[activeTab.value],
      site: [resolveAnalysisSite(row)],
      shopIds: Number.isFinite(shopId) ? [shopId] : undefined,
      productName: String(row.name || '')
    }
    trendDialogVisible.value = true
  }

  watch(
    () => [overviewData.sales, overviewData.ad, activeTab.value] as const,
    () => {
      const groups = overviewCardGroups.value
      if (!groups.some((g) => g.items.length)) return
      const channel = activeTab.value
      const prev = overviewLayouts[channel]
      const fallback = prev.selected?.length > 0 ? prev : buildChannelDefaultLayout(channel, groups)
      overviewLayouts[channel] = mergeLayout(groups, fallback)
    },
    { deep: true }
  )

  /** 各 Tab（综合/SC/VC）独立的查询态快照：切走时保存、切回时还原 */
  type TabQueryState = {
    filter: SalesFilterState
    dateRange: [string, string]
    dimension: SalesDimension
    metric: SalesMetric
    period: SalesPeriod
    sortField?: string
    sortOrder?: 'asc' | 'desc'
    pageSize: number
  }
  const buildDefaultTabState = (channel: SalesChannel): TabQueryState => {
    const cfg = tabConfigs.find((tab) => tab.key === channel) || tabConfigs[0]
    const filter = defaultFilter()
    return {
      filter,
      dateRange: [filter.dateStart, filter.dateEnd],
      dimension: 'pasin',
      metric: cfg.metrics[0],
      period: 'day',
      sortField: undefined,
      sortOrder: undefined,
      pageSize: 20
    }
  }
  const tabStateStore = reactive<Record<SalesChannel, TabQueryState>>({
    combined: buildDefaultTabState('combined'),
    sc: buildDefaultTabState('sc'),
    vc: buildDefaultTabState('vc')
  })
  const snapshotTabState = (channel: SalesChannel) => {
    tabStateStore[channel] = {
      filter: { ...filterForm.value },
      dateRange: [detailDateRange.value[0], detailDateRange.value[1]],
      dimension: dimension.value,
      metric: metric.value,
      period: period.value,
      sortField: detailSortField.value,
      sortOrder: detailSortOrder.value,
      pageSize: pageSize.value
    }
  }
  const syncDetailDateRange = () => {
    detailDateRange.value = clipDateRangeToSiteToday(
      [detailDateRange.value[0], detailDateRange.value[1]],
      filterForm.value.site
    )
    filterForm.value.dateStart = detailDateRange.value[0]
    filterForm.value.dateEnd = detailDateRange.value[1]
  }

  const restoreTabState = (channel: SalesChannel) => {
    const state = tabStateStore[channel]
    filterForm.value = { ...state.filter }
    detailDateRange.value = [state.dateRange[0], state.dateRange[1]]
    dimension.value = state.dimension
    metric.value = state.metric
    period.value = state.period
    detailSortField.value = state.sortField
    detailSortOrder.value = state.sortOrder
    pageSize.value = state.pageSize
    syncDetailDateRange()
  }

  watch(activeTab, (newTab, oldTab) => {
    // 各 Tab 独立记忆查询条件：先保存旧 Tab 快照，再还原目标 Tab（首次进入为该 Tab 默认）
    if (oldTab && oldTab !== newTab) snapshotTabState(oldTab)
    restoreTabState(newTab)
    if (!currentTab.value.supportsShop) filterForm.value.shopIds = []
    applyDimensionColumns()
    loadTrendMetricPool()
    reloadAll()
    if (trendOpen.value) loadTrendChart()
  })

  watch(dimension, () => {
    applyDimensionColumns()
    pageNo.value = 1
  })

  watch(
    availableColumns,
    (cols) => {
      const allowed = new Set(cols.map((col) => col.key))
      const filtered = visibleColumnKeys.value.filter((key) => allowed.has(key))
      const normalized = normalizeVisibleColumnKeys(activeTab.value, dimension.value, filtered)
      if (
        normalized.length !== visibleColumnKeys.value.length ||
        normalized.some((key, idx) => key !== visibleColumnKeys.value[idx])
      ) {
        visibleColumnKeys.value = normalized
      }
    },
    { immediate: true }
  )

  /** 服务端列习惯回写 visibleColumnKeys 后，补回 PRD 默认列（避免「国家」等被旧习惯覆盖） */
  watch(
    visibleColumnKeys,
    (keys) => {
      const normalized = normalizeVisibleColumnKeys(activeTab.value, dimension.value, keys)
      if (normalized.length !== keys.length || normalized.some((key, idx) => key !== keys[idx])) {
        visibleColumnKeys.value = normalized
        return
      }
      persistVisibleColumnKeys()
    },
    { deep: true }
  )

  watch([trendPeriod, trendRange, trendMode], () => {
    if (trendOpen.value) loadTrendChart()
  })

  watch(activeTrendMetrics, () => {
    if (trendOpen.value) loadTrendChart()
  })

  watch(trendOpen, (open) => {
    if (open) loadTrendChart()
  })

  // 注意：不再监听 filterForm/detailDateRange 自动重载趋势。
  // 趋势与实时概况的重载统一由「查询按钮(reloadAll)/趋势自身控件/切Tab」触发，
  // 从而保证「销售明细」的日期、关键词等搜索条件不会影响实时概况的折线图与指标。

  watch(
    () => [...filterForm.value.site],
    () => {
      syncDetailDateRange()
    },
    { deep: true }
  )

  onMounted(() => {
    applyDimensionColumns()
    syncDetailDateRange()
    loadTrendMetricPool()
    loadOverview()
    loadDetail()
  })
</script>

<style lang="scss" scoped>
  .sales-statistics-page {
    display: flex;
    flex-direction: column;
    padding-bottom: 20px;
    // padding: 12px 16px;
    // 注意：这里不能设 overflow（auto/hidden/scroll）。
    // 本页真正滚动的是外层容器（子应用模式下为基座，独立运行时为 #app-main），
    // 若此处设 overflow 会“抢占”sticky 的滚动上下文，导致 Tab/搜索栏无法吸顶。
  }

  // Tab 吸顶容器：吸顶到基座固定顶栏之下（top 由 --asin-tab-top 提供）。
  // padding-bottom 加大：让背景向下多延伸，盖住与搜索栏之间的缝隙（多出部分被更高层级的搜索栏遮住）。
  .board-tabs-sticky {
    position: sticky;
    top: var(--asin-tab-top, 0);
    z-index: 19;
    flex-shrink: 0;
    // padding-top：吸顶时把标签下移 6px（背景不透明，顺带盖住与顶栏之间的缝，避免顶部透字）
    padding-top: 6px;
    padding-bottom: 20px;
    background-color: var(--art-main-bg-color);
  }

  // 搜索栏吸顶容器：Tab 之下固定，z-index 高于 Tab，重叠处由本容器遮盖，杜绝中间透字。
  // 背景取页面灰：筛选栏卡片自身是白色，其底部外边距区域会露出这层灰，使灰色间距也随吸顶固定且不透明。
  // display:flow-root 建立 BFC，防止内部筛选栏 margin-bottom 塌陷穿出容器。
  .sales-search-sticky {
    position: sticky;
    top: var(--asin-search-top, 45px);
    z-index: 20;
    display: flow-root;
    background-color: var(--art-bg-color);
  }

  .board-tabs {
    flex-shrink: 0;

    :deep(.el-tabs__header) {
      margin: 0;
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    :deep(.el-tabs__nav-wrap) {
      &::after {
        display: none;
      }
    }

    :deep(.el-tabs__item) {
      height: 32px;
      padding: 0 24px;
      font-size: 14px;
      line-height: 32px;
      color: var(--art-gray-700);

      &:hover {
        color: var(--el-color-primary);
      }

      &.is-active {
        font-weight: 600;
        color: var(--el-color-primary);
      }
    }

    :deep(.el-tabs__active-bar) {
      height: 2px;
      background-color: var(--el-color-primary);
    }
  }

  .board-tab-label {
    display: inline-block;
    max-width: 160px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    vertical-align: middle;
  }

  .board-tab-close {
    margin-left: 6px;
    font-size: 14px;
    color: var(--el-text-color-secondary);
    vertical-align: middle;
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  .kpi-config-bar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 10px 12px;
    margin-bottom: 0;
    background: #fff;
    border: 1px solid var(--el-border-color-lighter);
    border-bottom: 0;
    border-radius: 4px 4px 0 0;
  }

  .kpi-config-heading,
  .kpi-config-wrap {
    display: flex;
    gap: 8px;
    align-items: center;
  }

  .kpi-config-wrap :deep(.cs-gear) {
    width: 28px;
    height: 28px;
    color: #475467;
    cursor: pointer;
    background: #fff;
    border: 1px solid #d8dee9;
    border-radius: 4px;

    &:hover,
    &.is-active {
      color: var(--el-color-primary);
      background: #fff;
      border-color: var(--el-color-primary);
    }
  }

  .kpi-zone-title {
    position: relative;
    padding-left: 10px;
    font-size: 15px;
    font-weight: 700;

    &::before {
      position: absolute;
      top: 50%;
      left: 0;
      width: 3px;
      height: 14px;
      content: '';
      background: var(--el-color-primary);
      border-radius: 2px;
      transform: translateY(-50%);
    }
  }

  .kpi-collapse-btn,
  .trend-toggle-btn,
  .btn-icon {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    height: 28px;
    color: #475467;
    cursor: pointer;
    background: #fff;
    border: 1px solid #d8dee9;
    border-radius: 4px;
  }

  .kpi-collapse-btn {
    width: 28px;

    svg {
      width: 14px;
      transition: transform 0.18s;
    }

    &.open svg {
      transform: rotate(180deg);
    }
  }

  .trend-toggle-btn {
    gap: 5px;
    padding: 0 10px;
    font-size: 12px;

    svg {
      width: 14px;
    }

    .arrow-icon {
      font-size: 11px;
    }

    &.active {
      color: var(--el-color-primary);
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary-light-5);

      .tt-chev {
        transform: rotate(180deg);
      }
    }
  }

  .btn {
    height: 28px;
    padding: 0 10px;
    font-size: 12px;
    color: #475467;
    cursor: pointer;
    background: #fff;
    border: 1px solid #d8dee9;
    border-radius: 6px;

    &.btn-primary {
      color: #fff;
      background: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }

  .overview-cards-wrap {
    padding: 12px;
    margin-bottom: 12px;
    background: #fff;
    border: 1px solid var(--el-border-color-lighter);
    border-top: 0;
    border-radius: 0 0 4px 4px;

    /* 主数值：可收缩 + 省略号；环比固定不压缩（对齐原型 448-461 行） */
    :deep(.kpi-val) {
      flex-shrink: 1;
      min-width: 0;
      overflow: hidden;
      font-size: 15px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      line-height: 1.15;
      color: #111827;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :deep(.kpi-env) {
      display: inline-flex;
      flex-shrink: 0;
      gap: 1px;
      align-items: center;
      font-size: 9.5px;
      font-weight: 500;
      font-variant-numeric: tabular-nums;
      line-height: 1;

      &.up {
        color: #0f9f6e;
      }

      &.down {
        color: #e5484d;
      }

      &.flat {
        color: #8a94a6;
      }
    }

    :deep(.kpi-split .ln) {
      display: flex;
      gap: 4px;
      align-items: center;
      min-width: 0;
      font-size: 10px;
      line-height: 1.4;
      color: #667085;
      white-space: nowrap;

      .tag {
        flex-shrink: 0;
        padding: 0 4px;
        font-size: 9px;
        font-weight: 600;
        line-height: 1.5;
        color: inherit;
        background: transparent;
        border-radius: 2px;
      }

      .v {
        min-width: 0;
        overflow: hidden;
        font-weight: 500;
        font-variant-numeric: tabular-nums;
        color: #374151;
        text-overflow: ellipsis;
      }

      .pct {
        flex-shrink: 0;
        margin-left: auto;
        font-size: 10px;
        font-variant-numeric: tabular-nums;
        color: #9aa3b2;
      }
    }
  }

  @media (width <= 1366px) {
    .overview-cards-wrap :deep(.kpi-val) {
      font-size: 14px;
    }
  }

  .rate-up {
    color: #0f9f6e;
  }

  .rate-down {
    color: #e5484d;
  }

  .trend-panel {
    padding: 12px;
    margin-bottom: 12px;
    background: #fff;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
  }

  .trend-toolbar {
    display: flex;
    flex-wrap: nowrap;
    gap: 8px;
    align-items: flex-start;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .trend-toolbar-left {
    display: flex;
    flex: 1 1 auto;
    flex-wrap: wrap;
    gap: 6px 10px;
    align-items: center;
    min-width: 0;
  }

  .trend-toolbar-add {
    flex-shrink: 0;
    align-self: flex-start;
    margin-left: 8px;
  }

  .trend-toolbar .tc {
    display: flex;
    flex-shrink: 0;
    gap: 4px;
    align-items: center;
  }

  .tc-label,
  .tch-meta {
    font-size: 12px;
    color: #667085;
  }

  .seg {
    display: inline-flex;
    padding: 2px;
    background: #f4f6fb;
    border: 1px solid #dce3ef;
    border-radius: 7px;

    button {
      height: 26px;
      padding: 0 9px;
      font-size: 12px;
      color: #5f6877;
      cursor: pointer;
      background: transparent;
      border: 0;
      border-radius: 5px;

      &.active {
        color: var(--el-color-primary);
        background: #fff;
        box-shadow: 0 1px 3px rgb(15 23 42 / 8%);
      }
    }
  }

  :deep(.accent) {
    color: var(--el-color-primary);
  }

  @media (width <= 900px) {
    .overview-cards-wrap {
      padding: 10px;
    }
  }
</style>

<style lang="scss">
  .kpi-ellipsis-tooltip.el-popper {
    max-width: 320px;
    font-size: 12px;
    font-variant-numeric: tabular-nums;
  }
</style>
