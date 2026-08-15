<template>
  <div ref="rootRef" class="multi-dimension-table sale-detail-list">
    <div class="section-tabs">
      <div class="section-tab active">销售明细</div>
      <span v-if="channel === 'vc'" class="section-note">仅统计space1p平台数据</span>
    </div>

    <!-- 表格头部工具栏：与采购批次成本同款 ArtTableHeader（刷新/列设置标准组件 + #left 维度/指标/周期） -->
    <!-- key 绑定 columnTableName：渠道/维度切换时重挂载，使列设置面板按当前 tableName 重新拉取服务端列习惯并重建，
         避免面板停留在上一个 Tab 的状态（出现「面板勾了趋势分析但表格没有该列」的分歧） -->
    <ArtTableHeader
      :key="columnTableName"
      v-model:columns="columnChecks"
      :loading="loading"
      layout="refresh,columnsNew"
      :tableName="columnTableName"
      :updateColumn="noop"
      :resetColumns="noop"
      @refresh="emit('refresh')"
    >
      <template #left>
        <div class="toolbar-left">
          <ElSpace>
            <span class="sub-title">维度</span>
            <ElRadioGroup v-model="dimension" size="small">
              <ElRadioButton v-for="item in dimensionOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </ElRadioButton>
            </ElRadioGroup>
          </ElSpace>
          <ElSpace>
            <span class="sub-title">指标</span>
            <ElRadioGroup v-model="metric" size="small">
              <ElRadioButton v-for="item in metricOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </ElRadioButton>
            </ElRadioGroup>
          </ElSpace>
          <ElSpace>
            <span class="sub-title">周期</span>
            <ElRadioGroup v-model="period" size="small">
              <ElRadioButton v-for="item in periodOptions" :key="item.value" :value="item.value">
                {{ item.label }}
              </ElRadioButton>
            </ElRadioGroup>
          </ElSpace>
          <ElSpace>
            <span class="sub-title">自定义</span>
            <CompactDateRangePicker
              v-if="period === 'day'"
              v-model="dateRange"
              :max-date="siteTodayText"
              :disabled-date="siteDisabledDate"
            />
            <PeriodWeekRangePicker
              v-else-if="period === 'week'"
              v-model="dateRange"
              :max-range="7"
              start-placeholder="开始周"
              end-placeholder="结束周"
              :date-picker-props="{ disabledDate: siteDisabledDate }"
            />
            <ElDatePicker
              v-else
              v-model="monthRangeModel"
              type="monthrange"
              size="small"
              unlink-panels
              value-format="YYYY-MM-DD"
              format="YYYY-MM"
              range-separator="至"
              start-placeholder="开始月"
              end-placeholder="结束月"
              class="detail-month-range"
              :disabled-date="siteDisabledDate"
              @change="onMonthRangeChange"
            />
          </ElSpace>
          <ElInput
            v-model="keyword"
            size="small"
            class="detail-search"
            placeholder="输入ASIN/父ASIN/销售SKU/SPU/SKU中文品名搜索"
            clearable
          >
            <template #prefix>
              <ElIcon><Search /></ElIcon>
            </template>
          </ElInput>
        </div>
      </template>
      <template #afterRefresh>
        <div
          class="header-btn"
          :class="{ 'is-disabled': !canExport }"
          :title="canExport ? '导出' : '无导出权限'"
          @click="canExport && emit('export')"
        >
          <i class="iconfont-custom">&#xe665;</i>
        </div>
      </template>
      <template #right>
        <span class="notice" tabindex="0">
          <InfoFilled class="notice-icon" />
          <span>销量统计规则说明</span>
          <span class="notice-popover">
            <strong>销量统计规则</strong>
            订单只统计FBA渠道订单<br />订单量/销量不统计取消状态的订单，换货订单合并到下单时间当天的1单，销售额只统计买家付款的订单
          </span>
        </span>
      </template>
    </ArtTableHeader>

    <ElCard shadow="never" class="art-table-card">
      <div v-if="errorText" class="state-box error">
        <span>{{ errorText }}</span>
        <button type="button" @click="emit('refresh')">重新加载</button>
      </div>

      <ArtTable
        v-else
        ref="tableRef"
        :data="displayRows"
        :columns="artColumns"
        :column-checks="tableColumnChecks"
        row-key="_rowId"
        :border="false"
        :tree-props="treeProps"
        :loading="loading"
        :pagination="pagination"
        :show-table-header="false"
        :height="detailTableHeight"
        :tableKey="columnTableName"
        :row-class-name="artRowClass"
        :show-summary="hasSummary"
        :summary-method="summaryMethod"
        class="sale-detail-table"
        empty-text="暂无数据"
        @sort-change="onSortChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <template #expand="{ row }">
          <button
            v-if="row.hasChildren"
            class="expand-toggle"
            type="button"
            title="展开/收起店铺明细"
            @click="toggleExpand(row)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        </template>

        <template #img="{ row }">
          <div class="thumb" :class="row._isChild ? 'thumb-child' : ''">
            <img
              v-if="row.img && !brokenImgIds.has(String(row._rowId))"
              :src="String(row.img)"
              alt=""
              loading="lazy"
              @error="onImgError(row)"
            />
            <span v-else class="no-img" title="暂无图片">
              <svg
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="none"
                stroke="currentColor"
                stroke-width="1.6"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-4.5-4.5L7 20" />
                <path d="m3 3 18 18" />
              </svg>
              <span class="no-img-text">无图</span>
            </span>
          </div>
        </template>

        <template #analyze="{ row }">
          <button class="analyze-link" type="button" title="分析" @click="emit('analyze', row)">
            <svg
              width="13"
              height="13"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M3 3v18h18" />
              <path d="m7 14 4-4 4 4 6-6" />
            </svg>
          </button>
        </template>

        <template #asin="{ row }">
          <a
            v-if="row.asin"
            class="asin-link"
            :href="asinDetailUrl(row)"
            target="_blank"
            rel="noopener noreferrer"
            >{{ row.asin }}</a
          >
          <span v-else>-</span>
        </template>

        <template #trend="{ row }">
          <button class="trend-pill" type="button" @click="emit('trend', row)">
            <svg viewBox="0 0 96 32" class="trend-spark">
              <path class="area" :d="sparkArea(row)" />
              <path class="line" :d="sparkLine(row)" />
            </svg>
            <span>详情 ›</span>
          </button>
        </template>

        <template #growth="{ row }">
          <span :class="growthClass(row.growth)">{{ formatCell(row.growth, 'growth') }}</span>
        </template>
      </ArtTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
  import dayjs from 'dayjs'
  import isoWeek from 'dayjs/plugin/isoWeek'
  import { InfoFilled, Search } from '@element-plus/icons-vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import PeriodWeekRangePicker from '@/components/core/others/period-week-range-picker/index.vue'
  import CompactDateRangePicker from './compact-date-range-picker.vue'
  import type { ColumnOption } from '@/types'
  import type {
    DynamicColumn,
    OptionItem,
    SalesChannel,
    SalesDetailRow,
    SalesDimension,
    SalesMetric,
    SalesPeriod,
    TableColumnItem
  } from './sales-types'
  import { formatMetricDisplay as formatCell } from '../metric-format'
  import {
    clipDateRangeToSiteToday,
    createSiteDisabledDate,
    defaultDayRangeForSite,
    defaultMonthRangeForSite,
    defaultWeekRangeForSite,
    getSitesTodayText
  } from '../../utils/site-date'
  import { ensureSiteLabelMap, formatSiteLabel } from '../../utils/site-label'

  defineOptions({ name: 'MultiDimensionTable' })

  dayjs.extend(isoWeek)

  const toDateText = (value: dayjs.Dayjs) => value.format('YYYY-MM-DD')

  const siteTodayText = computed(() => getSitesTodayText(props.siteCodes))
  const siteDisabledDate = computed(() => createSiteDisabledDate(props.siteCodes))

  const defaultDayRange = (): [string, string] => defaultDayRangeForSite(props.siteCodes)
  const defaultWeekRange = (): [string, string] => defaultWeekRangeForSite(props.siteCodes)
  const defaultMonthRange = (): [string, string] => defaultMonthRangeForSite(props.siteCodes)

  const clipDateRange = () => {
    dateRange.value = clipDateRangeToSiteToday(dateRange.value, props.siteCodes)
    if (period.value === 'month') syncMonthRangeModel(dateRange.value)
  }

  const monthRangeModel = ref<[string, string] | null>(null)

  const syncMonthRangeModel = (range: [string, string]) => {
    if (range?.[0] && range?.[1]) {
      monthRangeModel.value = [range[0], range[1]]
    } else {
      monthRangeModel.value = null
    }
  }

  const onMonthRangeChange = (value: [string, string] | null) => {
    if (!value?.[0] || !value?.[1]) return
    dateRange.value = [
      toDateText(dayjs(value[0]).startOf('month')),
      toDateText(dayjs(value[1]).endOf('month'))
    ]
  }

  const props = defineProps<{
    loading: boolean
    errorText: string
    total: number
    rows: SalesDetailRow[]
    summary: SalesDetailRow
    dynamicColumns: DynamicColumn[]
    columns: TableColumnItem[]
    /** PRD 默认展示列 key 列表，服务端列习惯回写时强制合并，避免默认列丢失 */
    defaultColumnKeys: string[]
    noticeHtml: string
    lastRefreshedAt: string
    canExport: boolean
    metricOptions: OptionItem<SalesMetric>[]
    dimensionOptions: OptionItem<SalesDimension>[]
    channel: SalesChannel
    /** 顶部筛选站点（用于日期锚定与禁选未来日） */
    siteCodes: string[]
  }>()

  const emit = defineEmits<{
    (e: 'refresh'): void
    (e: 'export'): void
    (e: 'analyze', row: SalesDetailRow): void
    (e: 'trend', row: SalesDetailRow): void
  }>()

  const dimension = defineModel<SalesDimension>('dimension', { required: true })
  const metric = defineModel<SalesMetric>('metric', { required: true })
  const period = defineModel<SalesPeriod>('period', { required: true })
  const dateRange = defineModel<[string, string]>('dateRange', { required: true })
  const keyword = defineModel<string>('keyword', { required: true })
  const pageNo = defineModel<number>('pageNo', { required: true })
  const pageSize = defineModel<number>('pageSize', { required: true })
  const visibleColumnKeys = defineModel<string[]>('visibleColumnKeys', { required: true })
  const sortField = defineModel<string | undefined>('sortField')
  const sortOrder = defineModel<'asc' | 'desc' | undefined>('sortOrder')

  /** 关闭 ElTable 自动树形：展开子行由本组件 displayRows 扁平化处理，避免 children 触发树形重复渲染 */
  const treeProps = { children: '__noChildren__', hasChildren: '__noHasChildren__' }
  const noop = () => {}

  /**
   * 销售统计明细统一保留固定展开列，是否显示展开按钮由每行 children/hasChildren 决定。
   * VC 已由后端补齐 children 结构，前端展开交互需与 SC 保持一致。
   */
  const supportsRowExpand = computed(() => true)

  /** 结构性展开列：固定首列，不参与列设置面板/拖拽/服务端列习惯（对齐原型 scrow-expand-cell） */
  const EXPAND_COLUMN: TableColumnItem = {
    key: 'expand',
    label: '展开',
    width: 38,
    frozen: true,
    readonly: true
  }

  const periodOptions: OptionItem<SalesPeriod>[] = [
    { label: '日', value: 'day' },
    { label: '周', value: 'week' },
    { label: '月', value: 'month' }
  ]

  /**
   * ArtTable/ArtTableHeader 习惯存储 key（服务端列习惯 / 列宽 / pageSize），按渠道+维度隔离。
   * v5：列顺序按 PRD 逐行读法修正后 bump 版本号。需与 index.vue columnStorageKey 保持一致。
   */
  const columnTableName = computed(
    () => `sale-statics-detail-v8-${props.channel}-${dimension.value}`
  )

  /** 当前维度允许的静态列（展开列由组件本地注入，不来自 props.columns） */
  const availableStaticColumns = computed(() => {
    const dataCols = props.columns.filter((col) => col.key !== 'expand')
    return supportsRowExpand.value ? [EXPAND_COLUMN, ...dataCols] : dataCols
  })

  /**
   * 列显隐/排序模型：与采购批次成本一致，走 ArtTableHeader v-model:columns（columnChecks）+ ArtTable :column-checks。
   * 内部展开列(expand)默认勾选；其余列按 visibleColumnKeys 顺序与显隐生成，回写仅用于持久化与维度切换重建。
   */
  const columnChecks = ref<ColumnOption[]>([])

  /** 合并服务端/用户勾选与 PRD 默认列，并按当前维度列顺序归一化 */
  const mergeWithDefaultColumnKeys = (keys: string[]) => {
    const protoOrder = props.columns.map((col) => col.key).filter((key) => key !== 'expand')
    const allowed = new Set(protoOrder)
    const required = new Set(props.defaultColumnKeys.filter((key) => allowed.has(key)))
    const merged = new Set(keys.filter((key) => allowed.has(key) && key !== 'expand'))
    required.forEach((key) => merged.add(key))
    return protoOrder.filter((key) => merged.has(key))
  }

  const buildColumnChecks = (): ColumnOption[] => {
    const cols = availableStaticColumns.value
    const colMap = new Map(cols.map((col) => [col.key, col]))
    const visibleSet = new Set(visibleColumnKeys.value)
    // 原型预设顺序（props.columns 已按 dimensionColumnConfig.order 排好）
    const protoOrder = cols.map((col) => col.key).filter((key) => key !== 'expand')
    // 可见列按 visibleColumnKeys 当前顺序（承载用户主动拖拽产生的排序）
    const visibleOrdered = visibleColumnKeys.value.filter(
      (key) => colMap.has(key) && key !== 'expand'
    )
    // 合并：遍历原型顺序，可见槽位按拖拽顺序回填、隐藏列保持在原型位置 →
    // 「勾选/取消」只切显隐不挪动位置；「用户拖拽」时可见列顺序仍以拖拽结果为准
    // 注意：columnChecks 不含结构性「展开」列——展开列由 tableColumnChecks 固定注入首列，
    // 不参与列设置面板勾选/拖拽与服务端列习惯，避免被重排导致「展开列有时不显示/跑到其他位置」
    let vi = 0
    const merged = protoOrder.map((key) =>
      visibleSet.has(key) ? (visibleOrdered[vi++] ?? key) : key
    )
    return merged.map((key) => {
      const col = colMap.get(key) as TableColumnItem
      const checked = visibleSet.has(key) || !!col.readonly
      return {
        prop: key,
        label: col.label || key,
        width: col.width,
        // 不按 col.frozen 设 fixed：列的左固定统一由 artColumns 的动态 frozenKeys（可见前5列）负责渲染。
        // 若此处给 pasin/asin 等设 fixed，MkTableFilterDrag.repartitionFixedColumns 会把这些列强行
        // 重排到最左，导致非 pasin 维度下维度列（如「分类」）被 pasin 顶到后面 → 列序错乱。
        fixed: undefined,
        checked
      } as ColumnOption
    })
  }

  /**
   * 维度/渠道切换、或 visibleColumnKeys 变化（含服务端列习惯通过 ArtTableHeader 回填 columnChecks
   * 后再同步到 visibleColumnKeys）时重建 columnChecks，使「列设置面板勾选 / 表格渲染 /
   * visibleColumnKeys 持久化」三者始终一致。
   * 重建是「由 visibleColumnKeys 派生」，配合下方回写的值相等判断天然防死循环。
   */
  watch(
    [() => props.columns, dimension, () => props.channel, visibleColumnKeys],
    () => {
      columnChecks.value = buildColumnChecks()
    },
    { immediate: true, deep: true }
  )

  /**
   * columnChecks 变化（勾选 / 拖拽排序 / 服务端列习惯恢复）→ 回写 visibleColumnKeys（剔除结构性 expand 列）。
   * 仅当 keys 真正变化时才写，避免与上面的重建相互触发导致死循环；同时修复
   * 「服务端恢复了趋势分析列但 visibleColumnKeys 未同步、切维度后列消失」的问题。
   */
  watch(
    columnChecks,
    (checks) => {
      // 服务端列习惯可能带回 expand，立即剔除，避免与 tableColumnChecks 首列注入重复/错位
      const stripped = checks.filter((item) => String(item.prop) !== 'expand')
      if (stripped.length !== checks.length) {
        columnChecks.value = stripped
        return
      }
      const keys = mergeWithDefaultColumnKeys(
        stripped.filter((item) => item.checked !== false).map((item) => String(item.prop))
      )
      const cur = visibleColumnKeys.value
      if (keys.length !== cur.length || keys.some((key, idx) => key !== cur[idx])) {
        visibleColumnKeys.value = keys
      }
    },
    { deep: true }
  )

  /**
   * 传给 ArtTable 的列勾选：在数据列前固定注入结构性「展开」列（仅支持展开的维度），
   * 该列始终展示、固定首列、checked=true，且不进入 columnChecks（=不进入列设置面板/拖拽/服务端列习惯），
   * 从根本上避免「展开列有时不显示、切维度后跑到其他位置」的问题（PRD 原型：展开列为锚点列，不参与列配置）。
   */
  const tableColumnChecks = computed<ColumnOption[]>(() => {
    const dataChecks = columnChecks.value.filter((item) => String(item.prop) !== 'expand')
    if (!supportsRowExpand.value) return dataChecks
    return [
      {
        prop: 'expand',
        label: '展开',
        width: EXPAND_COLUMN.width,
        fixed: 'left',
        checked: true
      } as ColumnOption,
      ...dataChecks
    ]
  })

  /** 各静态列 key → 期望宽度，用于估算表格总宽（决定是否需要冻结/横向滚动） */
  const staticWidthMap = computed<Map<string, number>>(() => {
    const map = new Map<string, number>()
    availableStaticColumns.value.forEach((col) => map.set(col.key, col.width || 100))
    return map
  })

  /**
   * 估算「所有可见列」的期望总宽（静态列 min-width + 动态日期列固定宽度）。
   * 与 artColumns 的列宽策略保持一致（趋势列≥150、图标/冻结列取自身宽、其余取 min-width）。
   */
  const estimatedColumnsWidth = computed<number>(() => {
    let total = 0
    const widthOf = staticWidthMap.value
    tableColumnChecks.value
      .filter((item) => item.checked !== false)
      .forEach((item) => {
        const key = String(item.prop)
        total += key === 'trend' ? Math.max(widthOf.get(key) || 118, 150) : widthOf.get(key) || 100
      })
    // 动态日期列固定宽度（与 artColumns 里 dyn 列 width 默认值一致）
    total += props.dynamicColumns.length * 100
    return total
  })

  /**
   * 是否需要冻结前 5 列：仅当所有列的期望总宽超过容器可用宽度（会横向滚动）时才冻结。
   * 列少、放得下时不冻结——此时冻结列用固定宽度会导致「只有非冻结列被撑开、其余列窄+中间空档」，
   * 不冻结则所有非日期静态列统一走 min-width，由 ElTable 均匀分配剩余宽度、把表撑满。
   */
  const shouldFreeze = computed<boolean>(
    () => containerWidth.value > 0 && estimatedColumnsWidth.value > containerWidth.value
  )

  /**
   * 动态冻结「当前维度可见的前 5 列」（PRD 11.8 规则1，含首列展开箭头列）：
   * 取 tableColumnChecks（已按显隐+顺序）中已勾选列的前 5 个 key。
   * 不再按固定 key(frozen) 冻结，保证所有维度默认列不同也一致冻结前 5 列。
   * 列少（放得下、无需横向滚动）时不冻结，让所有非日期静态列自适应撑满。
   */
  const frozenKeys = computed<Set<string>>(() => {
    if (!shouldFreeze.value) return new Set<string>()
    const visibleOrdered = tableColumnChecks.value
      .filter((item) => item.checked !== false)
      .map((item) => String(item.prop))
    return new Set(visibleOrdered.slice(0, 5))
  })

  /** 需要插槽渲染的列 */
  const SLOT_COLUMNS = new Set(['expand', 'img', 'analyze', 'trend', 'asin', 'growth'])
  /** 静态可排序列（小计/近7日均值/涨幅），动态日期列均可排序 */
  const SORTABLE_STATIC_KEYS = new Set(['avg7', 'growth', 'subtotal'])
  const isSortableColumn = (key: string) => SORTABLE_STATIC_KEYS.has(key) || key.startsWith('p_')
  /** 需要数值格式化的静态列 */
  const NUMERIC_STATIC_KEYS = new Set(['avg7', 'subtotal'])
  const CENTER_KEYS = new Set(['expand', 'img', 'analyze', 'trend'])
  /** 结构性图标列：宽度固定，不参与「列少撑满」的 min-width 分配（否则窄图标列会被拉伸） */
  const FIXED_WIDTH_STATIC_KEYS = new Set(['expand', 'img', 'analyze'])

  /** 列表头信息气泡（近7日均值 / 较前7日涨幅口径说明） */
  const HEADER_TIPS: Record<string, string> = {
    avg7: '最近7日的平均值，不包括当天',
    growth: '（站点昨日数据 - 近7日均值）/ 近7日均值'
  }

  /** 日粒度日期列表头去掉年份：仅匹配「YYYY-MM-DD」，周/月等其它标签原样返回 */
  const stripDateYear = (label?: string): string => {
    if (!label) return ''
    const matched = /^\d{4}-(\d{2}-\d{2})$/.exec(label)
    return matched ? matched[1] : label
  }

  /** ArtTable 列配置：全部可用静态列（按 columnChecks 显隐/排序由 ArtTable 处理）+ 动态日期列 */
  const artColumns = computed<ColumnOption[]>(() => {
    const statics: ColumnOption[] = availableStaticColumns.value.map((col) => {
      const c: Record<string, any> = {
        prop: col.key,
        label: col.key === 'expand' ? '' : col.label,
        align: col.align || (CENTER_KEYS.has(col.key) ? 'center' : 'left'),
        fixed: frozenKeys.value.has(col.key) ? 'left' : undefined,
        showOverflowTooltip: false
      }
      // 列宽策略（PRD 渲染要求：列少时非日期列撑满整个表宽）：
      //  - 趋势列固定较宽；
      //  - 结构图标列(展开/图片/分析) 与 冻结列(可见前5列) 固定宽度：
      //    固定列用 min-width 会让 ElTable 主表与左固定层宽度算不一致导致错位；
      //  - 其余所有静态列（父ASIN/ASIN/SPU/店铺/小计/近7日均值/涨幅…）统一用 min-width 作为最小宽度，
      //    列过少、总宽不足容器时，ElTable 会把剩余宽度按各列 min-width 比例分配、把表格撑满；
      //    动态日期列不在此列（保持固定宽度、列多时横向滚动）。
      if (col.key === 'trend') {
        c.width = Math.max(col.width || 118, 150)
      } else if (FIXED_WIDTH_STATIC_KEYS.has(col.key) || frozenKeys.value.has(col.key)) {
        c.width = col.width || undefined
      } else {
        c.minWidth = col.width || 100
      }
      if (SLOT_COLUMNS.has(col.key)) {
        c.useSlot = true
        c.slotName = col.key
      }
      // 表头信息气泡：与 useSlot(#default) 互不冲突，headerTip 走 ArtTable 的 #header 分支
      if (HEADER_TIPS[col.key]) c.headerTip = HEADER_TIPS[col.key]
      // 趋势列内容（走势图+详情）较宽，单元格需不换行、可溢出显示
      if (col.key === 'trend') c.className = 'mk-cell-trend'
      if (isSortableColumn(col.key)) c.sortable = 'custom'
      // 小计/近7日均值跟随当前指标格式（金额两位小数等），与日期列一致
      if (NUMERIC_STATIC_KEYS.has(col.key)) {
        c.formatter = (row: SalesDetailRow) => formatCell(row[col.key], metric.value)
      }
      if (col.key === 'site') {
        c.formatter = (row: SalesDetailRow) => formatSiteLabel(row.site)
      }
      return c as ColumnOption
    })
    const dyn: ColumnOption[] = props.dynamicColumns.map((col) => {
      const c: Record<string, any> = {
        prop: col.key,
        // 日期列（日粒度）表头去掉年份：2026-06-16 → 06-16；周/月列标签不匹配该格式，保持原样
        label: stripDateYear(col.label),
        // 日期列需容纳「06-16」+ 排序箭头，过窄会把 caret 挤到第二行导致表头换行
        width: col.width || 100,
        align: 'right',
        sortable: 'custom',
        showOverflowTooltip: false,
        formatter: (row: SalesDetailRow) => formatCell(row[col.key], metric.value)
      }
      return c as ColumnOption
    })
    return [...statics, ...dyn]
  })

  const hasSummary = computed(() => !!(props.summary && Object.keys(props.summary).length))

  /** 合计行（#9）：每个日期列全量汇总，小计/均值/涨幅汇总，其余首列显示「合计」 */
  const summaryMethod = ({ columns }: { columns: { property?: string }[] }) => {
    let labelPlaced = false
    return columns.map((column) => {
      const prop = String(column.property || '')
      if (prop === 'expand') return ''
      if (prop.startsWith('p_')) return formatCell(props.summary?.[prop], metric.value)
      if (NUMERIC_STATIC_KEYS.has(prop)) {
        return formatCell(props.summary?.[prop], metric.value)
      }
      if (prop === 'growth') {
        return formatCell(props.summary?.[prop], 'growth')
      }
      if (!labelPlaced) {
        labelPlaced = true
        return '合计'
      }
      return ''
    })
  }

  const onSortChange = ({
    prop,
    order
  }: {
    prop: string
    order: 'ascending' | 'descending' | null
  }) => {
    if (!prop) return
    if (!order) {
      sortField.value = undefined
      sortOrder.value = undefined
    } else {
      sortField.value = prop
      sortOrder.value = order === 'ascending' ? 'asc' : 'desc'
    }
    pageNo.value = 1
    emit('refresh')
  }

  watch([dimension, () => props.channel], () => {
    expandedParents.value = new Set()
  })

  /** 分页：与采购批次成本一致，使用 ArtTable 内置分页 */
  const pagination = computed(() => ({
    currentPage: pageNo.value,
    pageSize: pageSize.value,
    total: props.total
  }))
  const handleSizeChange = (val: number) => {
    pageSize.value = val
  }
  const handleCurrentChange = (val: number) => {
    pageNo.value = val
  }

  watch(period, (next, prev) => {
    if (next === prev) return
    if (next === 'week') {
      dateRange.value = defaultWeekRange()
    } else if (next === 'month') {
      dateRange.value = defaultMonthRange()
      syncMonthRangeModel(dateRange.value)
    } else if (next === 'day') {
      dateRange.value = defaultDayRange()
    }
  })

  watch(
    () => [...props.siteCodes],
    () => {
      clipDateRange()
    },
    { deep: true }
  )

  watch(
    dateRange,
    (range) => {
      if (period.value === 'month') syncMonthRangeModel(range)
    },
    { deep: true }
  )

  /**
   * 表格高度自适应：本组件嵌在「实时概况/趋势」可折叠区域下方，页面整体为内容流式高度。
   * 表格高度按「视口底部 - 表格顶部」计算，使表格向下沾满到视口底部并启用内部滚动；
   * 表格顶部是稳定参照（表格向下增长不会改变其顶部），因此不会产生高度自反馈。
   * 监听窗口尺寸与页面容器尺寸变化（实时概况/趋势展开收起会改变表格顶部）后重算。
   */
  const rootRef = ref<HTMLElement>()
  const detailTableHeight = ref(360)
  // 表格容器可用宽度：用于判断「列是否放得下」，进而决定是否冻结前 5 列（见 frozenKeys）
  const containerWidth = ref(0)
  let pageResizeObserver: ResizeObserver | null = null
  const PAGER_RESERVE = 45
  const SAFE_MARGIN = 8

  const recalcTableHeight = () => {
    const root = rootRef.value
    if (!root) return
    const tableEl = root.querySelector('.sale-detail-table') as HTMLElement | null
    if (!tableEl) return
    const top = tableEl.getBoundingClientRect().top
    const next = Math.max(Math.floor(window.innerHeight - top - PAGER_RESERVE - SAFE_MARGIN), 220)
    // 与当前值差异极小时不更新，避免 ResizeObserver 反复触发
    if (Math.abs(next - detailTableHeight.value) > 1) {
      detailTableHeight.value = next
    }
    const width = tableEl.clientWidth
    if (width && Math.abs(width - containerWidth.value) > 1) {
      containerWidth.value = width
    }
  }

  const observePage = () => {
    const root = rootRef.value
    if (!root) return
    const pageEl = (root.closest('.art-full-height') as HTMLElement | null) || document.body
    pageResizeObserver?.disconnect()
    pageResizeObserver = new ResizeObserver(() => recalcTableHeight())
    pageResizeObserver.observe(pageEl)
  }

  onMounted(() => {
    void ensureSiteLabelMap()
    clipDateRange()
    if (period.value === 'month') syncMonthRangeModel(dateRange.value)
    nextTick(() => {
      observePage()
      recalcTableHeight()
    })
    window.addEventListener('resize', recalcTableHeight)
  })

  onUnmounted(() => {
    pageResizeObserver?.disconnect()
    pageResizeObserver = null
    window.removeEventListener('resize', recalcTableHeight)
  })

  // 错误态/加载完成后表格 DOM 可能重建，重算一次高度
  watch([() => props.errorText, () => props.loading], () => {
    nextTick(recalcTableHeight)
  })

  watch([dimension, metric, period, dateRange, keyword, pageSize], () => {
    pageNo.value = 1
    emit('refresh')
  })
  watch(pageNo, () => emit('refresh'))

  const rowKey = (row: SalesDetailRow) =>
    String(row.dimKey || row.asin || row.pasin || row.sku || Math.random())

  type DisplayRow = SalesDetailRow & {
    _rowId: string
    _parentId?: string
    _isChild?: boolean
    hasChildren?: boolean
    children?: SalesDetailRow[]
  }

  const expandedParents = ref<Set<string>>(new Set())

  const sortChildRows = (children: SalesDetailRow[]) => {
    const metricKey = metric.value
    return [...children].sort((a, b) => {
      const av = Number(a.subtotal ?? a[metricKey as keyof SalesDetailRow] ?? 0)
      const bv = Number(b.subtotal ?? b[metricKey as keyof SalesDetailRow] ?? 0)
      return bv - av
    })
  }

  watch(
    () => props.rows,
    () => {
      expandedParents.value = new Set()
    }
  )

  const resolveRowChildren = (row: SalesDetailRow): SalesDetailRow[] => {
    const raw = row.children
    return Array.isArray(raw) ? (raw as SalesDetailRow[]) : []
  }

  const rowHasChildren = (row: SalesDetailRow, children: SalesDetailRow[]) => {
    const flagged =
      row.hasChildren === true ||
      row.hasChildren === 1 ||
      row.hasChildren === '1' ||
      row.hasChildren === 'true'
    return flagged ? children.length > 0 : children.length > 1
  }

  const displayRows = computed<DisplayRow[]>(() => {
    const result: DisplayRow[] = []
    for (const row of props.rows) {
      const parentId = String(row.dimKey || rowKey(row))
      const children = resolveRowChildren(row)
      const hasChildren = rowHasChildren(row, children)
      // 剥离 children，避免 ElTable 把它当作树形数据自动渲染
      const { children: _omitParentChildren, ...parentRest } = row as Record<string, unknown>
      result.push({
        ...(parentRest as SalesDetailRow),
        _rowId: parentId,
        hasChildren
      } as DisplayRow)
      if (hasChildren && expandedParents.value.has(parentId)) {
        sortChildRows(children).forEach((child, index) => {
          const { children: _omitChildChildren, ...childRest } = child as Record<string, unknown>
          result.push({
            // 子行保留各自主图（店铺子行=店铺级图，SPU 子行=SPU 级图）
            ...(childRest as SalesDetailRow),
            // 子行行号用序号兜底，保证唯一（SPU 子行同店铺、店铺子行同维度键时不冲突）
            _rowId: `${parentId}::c${index}`,
            _parentId: parentId,
            _isChild: true
          } as DisplayRow)
        })
      }
    }
    return result
  })

  const toggleExpand = (row: DisplayRow) => {
    const id = row._rowId
    const next = new Set(expandedParents.value)
    if (next.has(id)) next.delete(id)
    else next.add(id)
    expandedParents.value = next
  }

  const artRowClass = ({ row }: { row: DisplayRow }) => {
    if (row._isChild) return 'scrow-child'
    if (row.hasChildren) {
      return expandedParents.value.has(row._rowId)
        ? 'scrow-parent open has-children'
        : 'scrow-parent has-children'
    }
    return 'scrow-parent'
  }

  /** 站点 → 亚马逊域名后缀（未知站点回退 com，对应模板 https://www.amazon.com/dp/{asin}） */
  const AMAZON_DOMAIN: Record<string, string> = {
    US: 'com',
    CA: 'ca',
    MX: 'com.mx',
    BR: 'com.br',
    UK: 'co.uk',
    GB: 'co.uk',
    DE: 'de',
    FR: 'fr',
    IT: 'it',
    ES: 'es',
    NL: 'nl',
    SE: 'se',
    PL: 'pl',
    BE: 'com.be',
    TR: 'com.tr',
    JP: 'co.jp',
    AU: 'com.au',
    SG: 'sg',
    AE: 'ae',
    SA: 'sa',
    IN: 'in'
  }
  const asinDetailUrl = (row: SalesDetailRow) => {
    const asin = String(row.asin || '').trim()
    const site = String(row.site || '')
      .trim()
      .toUpperCase()
    const domain = AMAZON_DOMAIN[site] || 'com'
    return `https://www.amazon.${domain}/dp/${asin}`
  }

  const growthClass = (value: unknown) => {
    const num = Number(value)
    if (Number.isNaN(num)) return ''
    return num >= 0 ? 'growth-up' : 'growth-down'
  }

  /** 加载失败的图片行 id（坏链回退到「无图」占位，避免浏览器默认裂图） */
  const brokenImgIds = ref<Set<string>>(new Set())
  const onImgError = (row: SalesDetailRow) => {
    const id = String(row._rowId ?? '')
    if (id && !brokenImgIds.value.has(id)) {
      brokenImgIds.value = new Set(brokenImgIds.value).add(id)
    }
  }
  const sparkValues = (row: SalesDetailRow) => {
    const keys = props.dynamicColumns.slice(0, 7).map((col) => col.key)
    const values = keys.map((key) => Number(row[key]) || 0)
    return values.length ? values : [3, 6, 5, 8, 6, 10, 9]
  }
  const sparkPoints = (row: SalesDetailRow) => {
    const values = sparkValues(row)
    const max = Math.max(...values, 1)
    const min = Math.min(...values, 0)
    const range = max - min || 1
    return values.map((value, index) => {
      const x = 4 + index * (88 / Math.max(values.length - 1, 1))
      const y = 26 - ((value - min) / range) * 20
      return [x, y]
    })
  }
  const sparkLine = (row: SalesDetailRow) =>
    sparkPoints(row)
      .map(([x, y], index) => `${index ? 'L' : 'M'}${x.toFixed(1)} ${y.toFixed(1)}`)
      .join(' ')
  const sparkArea = (row: SalesDetailRow) => `${sparkLine(row)} L92 30 L4 30 Z`
</script>

<style lang="scss" scoped>
  .multi-dimension-table {
    overflow: visible;
    background: #fff;
    border: 1px solid #e3e8f2;
    border-radius: 4px;

    :deep(.art-table-card) {
      border: 0;
      box-shadow: none;

      .el-card__body {
        padding: 8px 12px 4px;
      }
    }

    /* ArtTableHeader：左侧工具栏内部换行，右侧操作按钮保持靠右（与采购批次成本一致） */
    :deep(#art-table-header) {
      padding: 12px 16px 0;
      margin-bottom: 8px;

      .left {
        flex: 1 1 auto;
        min-width: 0;
      }

      .right {
        flex: 0 0 auto;
        align-items: flex-start;
      }
    }
  }

  .section-tabs {
    display: flex;
    gap: 12px;
    align-items: center;
    height: 38px;
    padding: 0 12px;
    border-bottom: 1px solid #edf1f7;
  }

  .section-tab {
    display: flex;
    align-items: center;
    height: 100%;
    font-size: 14px;
    font-weight: 700;
    color: #111827;
    border-bottom: 2px solid #2f6bff;
  }

  .section-note {
    font-size: 12px;
    color: var(--art-gray-500);
  }

  .toolbar-left {
    display: flex;
    flex-wrap: wrap;
    gap: 10px 16px;
    align-items: center;
  }

  .sub-title {
    padding-right: 2px;
    font-size: 12px;
    color: #8590a6;
    white-space: nowrap;
  }

  .detail-search {
    width: 300px;
  }

  @media (width <= 1400px) {
    .detail-search {
      width: 220px;
    }
  }

  .notice-icon {
    width: 14px;
    height: 14px;
  }

  .notice {
    position: relative;
    display: inline-flex;
    flex-shrink: 0;
    gap: 5px;
    align-items: center;
    height: 28px;
    padding: 0 8px;
    font-size: 12px;
    font-weight: 600;
    color: #3154d4;
    white-space: nowrap;
    cursor: help;
    background: transparent;
    border: 1px solid transparent;
    border-radius: 6px;

    .notice-icon {
      color: #3154d4;
    }

    &:hover,
    &:focus-within {
      background: #f5f7ff;
      border-color: #d8e3ff;
    }

    &:hover .notice-popover,
    &:focus-within .notice-popover {
      display: block;
    }
  }

  .notice-popover {
    position: absolute;
    top: calc(100% + 7px);
    right: 0;
    z-index: 80;
    display: none;
    width: 260px;
    padding: 14px 16px;
    font-size: 12px;
    font-weight: 400;
    line-height: 1.65;
    color: #667085;
    text-align: left;
    white-space: normal;
    background: #fff;
    border: 1px solid #dce3ef;
    border-radius: 6px;
    box-shadow: 0 10px 28px rgb(15 23 42 / 14%);

    strong {
      display: block;
      margin-bottom: 8px;
      font-size: 13px;
      color: #111827;
    }
  }

  /* 导出按钮：与 ArtTableHeader 内置 .btn 视觉一致（置于 #right 插槽） */
  .header-btn {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-left: 8px;
    color: var(--art-gray-700);
    cursor: pointer;
    background-color: rgba(var(--art-gray-200-rgb), 0.8);
    border-radius: 6px;
    transition: all 0.3s;

    i {
      font-size: 16px;
      color: var(--art-gray-700);
    }

    &:hover {
      background-color: rgba(var(--art-gray-300-rgb), 0.75);

      i {
        color: var(--art-gray-800);
      }
    }

    &.is-disabled {
      cursor: not-allowed;
      opacity: 0.5;
    }
  }

  /* 表格视觉：弱化竖向边框，仅保留行分隔线 */
  .sale-detail-table {
    :deep(.el-table__cell) {
      padding: 6px 0;
    }

    :deep(thead th.el-table__cell) {
      font-size: 12px;
      font-weight: 500;
      color: #667085;
    }

    /* 表头单行显示：日期列「2026-06-16」+ 排序箭头不再换行，避免与固定列错位 */
    :deep(thead th.el-table__cell .cell) {
      white-space: nowrap;
    }

    :deep(.el-table__body td.el-table__cell) {
      font-size: 12.5px;
      color: #273142;
    }

    :deep(.el-table__footer-wrapper td.el-table__cell) {
      font-weight: 700;
      color: #273142;
      background: #fbfcff;
    }
  }

  .detail-month-range {
    width: 240px;

    :deep(.el-range-input) {
      font-size: 12px;
    }
  }

  /* 行内单元格自定义内容 */
  .thumb {
    display: inline-flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 42px;
    height: 42px;
    overflow: hidden;
    background: #f3f4f6;
    border: 1px solid #e5e7eb;
    border-radius: 8px;

    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
    }

    /* 无图/坏链占位：中性灰底 + 无图图标 + 文字，明确区别于真实产品图 */
    .no-img {
      display: inline-flex;
      flex-direction: column;
      gap: 1px;
      align-items: center;
      justify-content: center;
      width: 100%;
      height: 100%;
      color: #c0c4cc;
    }

    .no-img-text {
      font-size: 10px;
      line-height: 1;
      transform: scale(0.92);
    }

    &.thumb-child {
      width: 34px;
      height: 34px;

      .no-img svg {
        width: 15px;
        height: 15px;
      }

      .no-img-text {
        font-size: 9px;
        transform: scale(0.85);
      }
    }
  }

  .asin-link {
    color: #2f6bff;
    cursor: pointer;
  }

  .analyze-link {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 24px;
    height: 24px;
    padding: 0;
    color: #2e5cff;
    cursor: pointer;
    background: rgb(46 92 255 / 8%);
    border: 0;
    border-radius: 5px;
    transition: all 0.15s;

    &:hover {
      color: #fff;
      background: #2e5cff;
    }
  }

  .trend-pill {
    display: inline-flex;
    flex-shrink: 0;
    gap: 6px;
    align-items: center;
    padding: 3px 6px 3px 4px;
    font-size: 12px;
    color: #2f6bff;
    white-space: nowrap;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 4px;

    span {
      flex-shrink: 0;
    }

    &:hover {
      background: #eef4ff;
    }
  }

  /* 趋势列单元格：内容较宽，不换行、可溢出，居中显示 */
  :deep(.mk-cell-trend .cell) {
    display: flex;
    justify-content: center;
    padding: 0 4px;
    overflow: visible;
    white-space: nowrap;
  }

  .trend-spark {
    flex-shrink: 0;
    width: 64px;
    height: 28px;

    .line {
      fill: none;
      stroke: #2f6bff;
      stroke-linecap: round;
      stroke-linejoin: round;
      stroke-width: 1.6;
    }

    .area {
      opacity: 0.1;
      fill: #2f6bff;
    }
  }

  .expand-toggle {
    display: inline-flex;
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
  }

  :deep(.scrow-parent.open) .expand-toggle {
    color: #fff;
    background: #2e5cff;
    border-color: #2e5cff;

    svg {
      transform: rotate(90deg);
    }
  }

  :deep(.scrow-child) {
    background: linear-gradient(90deg, #fafbff, #fff);

    td.el-table__cell {
      color: #4b5563;
    }
  }

  .growth-up {
    color: #0f9f6e;
  }

  .growth-down {
    color: #e5484d;
  }

  .state-box {
    display: flex;
    gap: 10px;
    align-items: center;
    justify-content: center;
    min-height: 180px;
    color: #b42318;
    background: #fff7f7;

    button {
      height: 28px;
      padding: 0 10px;
      color: #b42318;
      cursor: pointer;
      background: #fff;
      border: 1px solid #f4b8b8;
      border-radius: 6px;
    }
  }
</style>
