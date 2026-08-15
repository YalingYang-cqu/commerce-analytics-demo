<!-- 产品分时汇总统计：转置表（指标为行 × 小时为列），美国/中国双行表头，支持 时段累计/涨幅/图形 -->
<template>
  <ElCard shadow="never" class="hourly-card">
    <ArtTableHeader
      v-model:columns="rowChecks"
      :loading="loading"
      layout="refresh,down,columnsNew"
      tableName="sale-analysis-asin-hourly-summary"
      :updateColumn="updateRowColumn"
      :resetColumns="resetRowColumns"
      :export-api="asinHourSummaryExport"
      :export-params="exportParams"
      :async-export="true"
      @refresh="refreshData"
    >
      <template #left>
        <div class="hourly-title">
          <span class="title-text">产品分时汇总统计</span>
          <ElIcon
            class="toggle"
            :class="{ 'is-collapsed': !expanded }"
            @click="expanded = !expanded"
          >
            <ArrowUp />
          </ElIcon>
          <span class="title-note">统计日期为所选时间段截止日期：{{ endDate || '-' }}</span>
        </div>
      </template>
      <!-- <template #right>
        <ElRadioGroup v-model="viewType" size="small">
          <ElRadioButton value="table">表格</ElRadioButton>
          <ElRadioButton value="chart">图形</ElRadioButton>
        </ElRadioGroup>
      </template> -->
    </ArtTableHeader>

    <div v-show="expanded" class="hourly-body">
      <div v-if="viewType === 'table'" class="hourly-checks">
        <ElRadioGroup v-model="valueMode" size="small">
          <ElRadio value="hour">单位小时</ElRadio>
          <ElRadio value="total">时段累计</ElRadio>
        </ElRadioGroup>
        <ElCheckbox v-model="checkedGrowth" size="small">涨幅</ElCheckbox>
      </div>
      <ArtTable
        v-if="viewType === 'table'"
        :data="displayData"
        :columns="columns"
        :column-checks="columnChecks"
        :loading="loading"
        :border="false"
        row-key="key"
        :auto-height="true"
        :show-table-header="false"
        :header-cell-style="{ background: '#f7f8fa' }"
      >
        <template #labelCell="{ row }">
          <TableHeaderTip
            v-if="rowTip(row.key)"
            :label="String(row.label ?? '')"
            :tip="rowTip(row.key)"
          />
          <span v-else>{{ row.label }}</span>
        </template>
        <template #totalCell="{ row }">{{ totalText(row) }}</template>
        <template #zoneHeader>
          <div class="th-zone">
            <div>美国</div>
            <div class="cn">中国</div>
          </div>
        </template>
        <template #hourHeader="{ prop }">
          <div class="th-zone">
            <div>{{ US_HOURS[hourIndex(prop)] }}</div>
            <div class="cn">{{ cnHour(hourIndex(prop)) }}</div>
          </div>
        </template>
        <template #hourCell="{ row, prop }">
          <div class="cell-stack">
            <span>{{ summaryCellText(row, hourIndex(prop)) }}</span>
            <span
              v-if="
                checkedGrowth &&
                hourIndex(prop) > 0 &&
                !isFutureHour(hourIndex(prop)) &&
                row.cells[hourIndex(prop)]?.growth
              "
              class="growth-tag"
              :class="growthCls(row.cells[hourIndex(prop)].growth)"
            >
              {{ growthText(row.cells[hourIndex(prop)].growth, row.type) }}
            </span>
          </div>
        </template>
      </ArtTable>

      <HourLineChart v-else :categories="US_HOURS" :series="chartSeries" height="420px" />
    </div>
  </ElCard>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ArrowUp } from '@element-plus/icons-vue'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/composables/useTable'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import TableHeaderTip from '@/components/core/tables/table-header-tip/index.vue'
  import HourLineChart from './hour-line-chart.vue'
  import {
    US_HOURS,
    cnHour,
    voToSummaryRows,
    type IndicatorType,
    type SummaryRow
  } from '../utils/hourly-mock'
  import {
    asinHourSummary,
    asinHourSummaryExport,
    type AsinBoardType,
    type AsinHourSummaryVo
  } from '@/api/sale/asin'
  import { mul, divide } from '@/utils/common-util'

  defineOptions({ name: 'HourlySummary' })

  /** 四舍五入到2位：decimal.js 运算精确，先 ×100 取整再 ÷100 */
  const round2 = (n: number): number => Number(divide(Math.round(Number(mul(n, 100))), 100))
  /** 数值串：整数原样、带小数的补足2位（均含千分位） */
  const numStr = (n: number): string => {
    const r = round2(n)
    return Number.isInteger(r)
      ? r.toLocaleString('en-US')
      : r.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  interface Props {
    /** 统计截止日期（所选时间段的结束日期） */
    endDate?: string
    /** ASIN（检索关键词） */
    asin?: string
    /** 看板类型 asin/scasin/vcasin */
    boardType?: AsinBoardType
    /** 检索方式 asin/pasin（由搜索栏统一下发） */
    searchMode?: string
    /** 站点筛选（由搜索栏统一下发） */
    site?: string[]
    /** 店铺 id 筛选（由搜索栏统一下发） */
    shopIds?: number[]
  }
  const props = withDefaults(defineProps<Props>(), {
    endDate: '',
    asin: '',
    boardType: 'asin',
    searchMode: 'asin',
    site: () => [],
    shopIds: () => []
  })

  const expanded = ref(true)
  const viewType = ref<'table' | 'chart'>('table')
  // 取值口径：单位小时（当前值）/ 时段累计（累计值），默认单位小时
  const valueMode = ref<'hour' | 'total'>('hour')
  const checkedTotal = computed(() => valueMode.value === 'total')
  const checkedGrowth = ref(false)

  /**
   * 「指标」列气泡文案：自然占比 / 广告占比 两行按看板取不同口径。
   * key 对应 SUMMARY_INDICATORS 的 normalRatio / advertRatio；未列入的行不显示气泡。
   */
  const summaryTipsByBoard: Record<AsinBoardType, Record<string, string>> = {
    asin: {
      normalRatio: '总自然订单/总订单量',
      advertRatio: '总广告订单/总订单量'
    },
    scasin: {
      normalRatio: '自然订单/订单量',
      advertRatio: '广告订单/订单量'
    },
    vcasin: {
      normalRatio: '自然订单/ 订单量 （VC订单量取VC销量）',
      advertRatio: '广告订单/ 订单量 （VC订单量取VC销量）'
    }
  }
  const rowTip = (key: string): string => summaryTipsByBoard[props.boardType]?.[key] || ''

  /** 列：指标 | 汇总 | 时区(美国/中国) | 00~23（双行表头） */
  const columnsFactory = computed<ColumnOption[]>(() => [
    {
      prop: 'label',
      label: '指标',
      width: 92,
      fixed: 'left',
      align: 'center',
      useSlot: true,
      slotName: 'labelCell'
    },
    // {
    //   prop: '__total',
    //   label: '汇总',
    //   width: 100,
    //   fixed: 'left',
    //   align: 'center',
    //   useSlot: true,
    //   slotName: 'totalCell'
    // },
    {
      prop: '__zone',
      label: '时区',
      width: 130,
      fixed: 'left',
      align: 'left',
      useHeaderSlot: true,
      headerSlotName: 'zoneHeader',
      useSlot: true,
      slotName: 'totalCell'
    },
    ...US_HOURS.map((ush, idx) => ({
      prop: `h_${idx}`,
      label: ush,
      minWidth: 130,
      align: 'left',
      useSlot: true,
      slotName: 'hourCell',
      useHeaderSlot: true,
      headerSlotName: 'hourHeader'
    }))
  ])

  const { data, columns, columnChecks, loading, refreshData } = useTable({
    core: {
      // 调用后端分时汇总，转置成「指标为行」的表格行；返回数组由默认适配器处理
      apiFn: async () => {
        // if (!props.asin || !props.endDate) return [] as SummaryRow[]
        const res: any = await asinHourSummary({
          boardType: props.boardType,
          asin: props.asin,
          dateEnd: props.endDate,
          mode: valueMode.value === 'total' ? 'cumulative' : 'unit',
          searchMode: props.searchMode,
          site: props.site?.length ? props.site : undefined,
          shopIds: props.shopIds?.length ? props.shopIds : undefined
        })
        return voToSummaryRows((res?.data || {}) as AsinHourSummaryVo)
      },
      immediate: true,
      columnsFactory,
      tableKey: 'sale-analysis-asin-hourly-summary',
      tableName: 'sale-analysis-asin-hourly-summary'
    }
  })

  /**
   * 分时汇总指标行 key -> 后端导出指标 code（SalesAdMetric），
   * 与后端 SalesAdAsinHourExportHandler 取值口径一致；未列入的行不导出。
   */
  const SUMMARY_EXPORT_CODE: Record<string, string> = {
    totalOrders: 'order',
    normalOrders: 'naturalOrder',
    advertOrders: 'adOrder',
    normalRatio: 'naturalOrderRatio',
    advertRatio: 'adOrderRatio',
    cpc: 'cpc',
    impressions: 'adImpressions',
    clicks: 'adClicks',
    ctr: 'ctr',
    cr: 'adConversionRate',
    cost: 'adCost',
    acos: 'acos'
  }

  // 导出参数：与查询入参一致 + 当前可见指标行（按显示顺序）。异步导出，返回任务ID，进度/下载见下载中心
  const exportParams = () => ({
    boardType: props.boardType,
    asin: props.asin,
    dateEnd: props.endDate,
    mode: (valueMode.value === 'total' ? 'cumulative' : 'unit') as 'unit' | 'cumulative',
    searchMode: props.searchMode,
    site: props.site?.length ? props.site : undefined,
    shopIds: props.shopIds?.length ? props.shopIds : undefined,
    columns: rowChecks.value
      .filter((c) => c.checked !== false)
      .map((c) => SUMMARY_EXPORT_CODE[(c.prop as string) ?? ''])
      .filter((code): code is string => !!code)
  })

  // 转置表：列设置弹窗控制的是「指标行」显隐，独立于 useTable 的列（小时列）
  const rowChecks = ref<ColumnOption[]>([])
  // 首次拿到数据时，按指标生成行配置（默认全部显示）
  watch(
    data,
    (rows) => {
      const list = rows as SummaryRow[]
      if (rowChecks.value.length === 0 && list?.length) {
        // 展示量(impressions)、点击量(clicks) 默认不展示
        const defaultHidden = ['impressions', 'clicks']
        rowChecks.value = list.map((r) => ({
          prop: r.key,
          label: r.label,
          checked: !defaultHidden.includes(r.key)
        }))
      }
    },
    { immediate: true }
  )

  /** 表头列设置回调：同步指标行配置（含勾选与排序） */
  const updateRowColumn = (cols: ColumnOption[]) => {
    rowChecks.value = cols
  }
  /** 表头「恢复默认」：恢复到默认显隐（展示量/点击量默认不展示） */
  const resetRowColumns = () => {
    const defaultHidden = ['impressions', 'clicks']
    rowChecks.value = rowChecks.value.map((c) => ({
      ...c,
      checked: !defaultHidden.includes(c.prop as string)
    }))
  }

  /** 实际渲染行：按 rowChecks 勾选状态过滤、并保持其拖拽排序 */
  const displayData = computed<SummaryRow[]>(() => {
    const rowMap = new Map((data.value as SummaryRow[]).map((r) => [r.key, r]))
    return rowChecks.value
      .filter((c) => c.checked !== false)
      .map((c) => rowMap.get(c.prop as string))
      .filter((r): r is SummaryRow => !!r)
  })

  /** 从列 prop（h_idx）解析小时下标 */
  const hourIndex = (prop?: string) => Number(String(prop).replace('h_', ''))

  /** 数值格式化（按指标类型）：带小数四舍五入保留2位 */
  const fmt = (v: number | null | undefined, type: IndicatorType): string => {
    if (v === null || v === undefined) return '-'
    const s = numStr(v)
    if (type === 'percent') return `${s}%`
    if (type === 'money') return `$${s}`
    return s
  }

  /** 美国太平洋时区当前「日期/小时」，用于判断哪些小时属于未来（未发生） */
  const usPacificNow = (): { date: string; hour: number } => {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: 'America/Los_Angeles',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      hour12: false
    }).formatToParts(new Date())
    const m: Record<string, string> = {}
    parts.forEach((p) => (m[p.type] = p.value))
    return { date: `${m.year}-${m.month}-${m.day}`, hour: Number(m.hour) % 24 }
  }

  /** 该美国小时是否属于未来（未发生）：截止日期为美国当天且小时超过当前小时时成立 */
  const isFutureHour = (idx: number): boolean => {
    if (!props.endDate) return false
    const now = usPacificNow()
    const end = props.endDate.slice(0, 10)
    if (end < now.date) return false // 截止日期是过去的完整一天，全天已发生
    if (end > now.date) return true // 截止日期整体在未来
    return idx > now.hour // 当天：超过当前小时即未来
  }

  /** 汇总列文本：整天未发生或为空则留空，不显示 0/横杠（与单元格口径一致） */
  const totalText = (row: SummaryRow): string => {
    // isFutureHour(0) 为真表示截止日期整体在未来（当天一个小时都还没发生）
    if (isFutureHour(0)) return ''
    return row.total === null || row.total === undefined ? '' : fmt(row.total, row.type)
  }

  /** 单元格主值：时段累计开关决定取累计或当前值；未来未发生或该小时无数据则留空 */
  const summaryCellText = (row: SummaryRow, idx: number): string => {
    if (isFutureHour(idx)) return ''
    const cell = row.cells?.[idx]
    if (!cell || cell.empty) return ''
    return fmt(checkedTotal.value ? cell.cumulative : cell.value, row.type)
  }

  /** 涨幅展示：正红涨、负绿跌；带小数四舍五入保留2位 */
  const growthText = (v: number, type: IndicatorType) => {
    const sign = v > 0 ? '↑' : '↓'
    const abs = numStr(Math.abs(v))
    if (type === 'percent') return `${sign}${abs}%`
    if (type === 'money') return `${sign}$${abs}`
    return `${sign}${abs}`
  }
  const growthCls = (v: number) => (v > 0 ? 'up' : 'down')

  /** 图形：选取几个核心指标按小时绘制 */
  const chartSeries = computed(() => {
    const pick = ['totalOrders', 'advertOrders', 'clicks']
    return (data.value as SummaryRow[])
      .filter((r) => pick.includes(r.key))
      .map((r) => ({ name: r.label, data: (r.cells || []).map((c) => c.value ?? 0) }))
  })

  // 取值模式(单位/累计)是后端入参，切换需重新请求；ASIN/看板/检索方式/截止日期/站点/店铺变化同样重新加载
  watch(
    () => [
      valueMode.value,
      props.endDate,
      props.asin,
      props.boardType,
      props.searchMode,
      props.site,
      props.shopIds
    ],
    () => refreshData()
  )
</script>

<style lang="scss" scoped>
  .hourly-card {
    margin-top: 12px;

    :deep(.el-card__body) {
      padding: 12px 16px;
    }

    :deep(.art-table.no-border th.el-table__cell .cell) {
      border-right: 0 solid #ebeef5 !important;
    }

    // 提高一级权重（插入 .el-table），确保灰底胜过 ArtTable 组件内的 `background:#fff !important`
    :deep(.art-table.no-border .el-table th.el-table__cell) {
      padding: 0 !important;
      background-color: #f7f8fa !important;
      border-color: #f7f8fa !important;
      border-bottom: 1px solid #ebeef5 !important;
    }

    :deep(.art-table.no-border tr td) {
      border-right-color: transparent !important;
      border-left-color: transparent !important;
    }

    :deep(.art-table.no-border tr > td:first-child) {
      border-right-color: #ebeef5 !important;
      // border-left-color: transparent !important;
    }

    :deep(.art-table.no-border th:first-child) {
      border-right-color: #ebeef5 !important;
    }
  }

  .hourly-body {
    padding-top: 8px;
    border-top: 1px solid #ebeef5;
  }

  // :deep(.el-table--small .el-table__cell) {
  //   padding: 5px 0 !important;
  // }
  // :deep(.el-table--small .cell) {
  //   padding: 0 !important;
  // }
  .hourly-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .hourly-title {
    display: flex;
    gap: 12px;
    align-items: center;

    .title-text {
      font-size: 15px;
      font-weight: 600;
      color: var(--art-gray-900);
    }

    .toggle {
      margin-left: -4px;
      font-size: 16px;
      color: var(--art-gray-600);
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        color: var(--el-color-primary);
      }

      &.is-collapsed {
        transform: rotate(180deg);
      }
    }

    .title-note {
      font-size: 12px;
      color: var(--art-gray-500);
    }
  }

  // 单位小时/时段累计/涨幅：位于表格上方，统一水平对齐
  .hourly-checks {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 4px 0 10px;

    :deep(.el-checkbox) {
      margin-right: 0;
    }
  }

  // 美国/中国 双行表头
  :deep(.th-zone) {
    line-height: 32px;

    & > div:first-child {
      border-bottom: 1px solid #ebeef5 !important;
    }
  }

  .cell-stack {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    justify-content: center;
  }

  :deep(.growth-tag) {
    font-size: 11px;

    // 涨幅配色：上升红色、下降绿色
    &.up {
      color: var(--el-color-danger);
    }

    &.down {
      color: var(--el-color-success);
    }
  }
</style>
