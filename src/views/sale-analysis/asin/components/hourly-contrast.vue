<!-- 产品分时对比：多日期按小时对比销量，美国/中国双行表头，支持 时段累计/单位小时/涨幅/广告费用、对比设置、图形 -->
<template>
  <ElCard shadow="never" class="contrast-card">
    <ArtTableHeader
      v-model:columns="columnChecks"
      :loading="loading"
      layout="refresh,down"
      tableName="sale-analysis-asin-hourly-contrast"
      :updateColumn="updateColumn"
      :resetColumns="resetColumns"
      :export-api="asinHourCompareExport"
      :export-params="exportParams"
      :async-export="true"
      @refresh="refreshData"
    >
      <template #left>
        <div class="contrast-title">
          <span class="title-text">产品分时销量对比</span>
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
      <template #right>
        <div class="contrast-tools">
          <ElButton @click="openSettingDialog">对比设置</ElButton>
          <!-- <ElRadioGroup v-model="viewType" size="small">
            <ElRadioButton value="table">表格</ElRadioButton>
            <ElRadioButton value="chart">图形</ElRadioButton>
          </ElRadioGroup> -->
        </div>
      </template>
    </ArtTableHeader>

    <div v-show="expanded" class="contrast-body">
      <div v-if="viewType === 'table'" class="contrast-checks">
        <ElRadioGroup v-model="valueMode" size="small">
          <ElRadio value="hour">单位小时</ElRadio>
          <ElRadio value="total">时段累计</ElRadio>
        </ElRadioGroup>
        <ElCheckbox v-model="checkedGrowth" size="small">涨幅</ElCheckbox>
        <ElCheckbox v-model="checkedCost" size="small">广告费用</ElCheckbox>
      </div>
      <ArtTable
        v-if="viewType === 'table'"
        :data="displayRows"
        :columns="columns"
        :column-checks="columnChecks"
        :loading="loading"
        :border="false"
        row-key="key"
        :auto-height="true"
        :show-table-header="false"
        :header-cell-style="{ background: '#f7f8fa' }"
      >
        <template #dateCell="{ row }">
          <div class="date-cell">
            <span>{{ row.dateStr }}</span>
            <span v-if="row.mode === 'total'" class="date-sub">时段累计</span>
          </div>
        </template>
        <template #totalCell="{ row }">
          <el-space wrap>
            <span>{{ numStr(row.total) }}</span>
            <span v-if="checkedCost" class="cell-cost">${{ numStr(row.totalCost) }}</span>
            <span
              v-if="checkedGrowth && !row.isBaseline && diff(row.baseTotal, row.total) !== 0"
              class="growth-tag"
              :class="growthCls(diff(row.baseTotal, row.total))"
            >
              {{ growthText(diff(row.baseTotal, row.total)) }}
            </span></el-space
          >
        </template>
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
            <el-space wrap>
              <span>{{ numStr(row.values?.[hourIndex(prop)]) }}</span>
              <span v-if="checkedCost" class="cell-cost"
                >${{ numStr(row.costs?.[hourIndex(prop)]) }}</span
              >
              <span
                v-if="
                  checkedGrowth &&
                  !row.isBaseline &&
                  row.baseValues &&
                  diff(row.baseValues?.[hourIndex(prop)], row.values?.[hourIndex(prop)]) !== 0
                "
                class="growth-tag"
                :class="
                  growthCls(diff(row.baseValues?.[hourIndex(prop)], row.values?.[hourIndex(prop)]))
                "
              >
                {{
                  growthText(diff(row.baseValues?.[hourIndex(prop)], row.values?.[hourIndex(prop)]))
                }}
              </span>
            </el-space>
          </div>
        </template>
      </ArtTable>

      <HourLineChart v-else :categories="US_HOURS" :series="chartSeries" height="420px" />
    </div>

    <!-- 对比设置 -->
    <CompareSettingDialog
      v-model="settingVisible"
      :dates="compareDates"
      :end-date="endDate"
      @confirm="onConfirmSetting"
    />
  </ElCard>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { ArrowUp } from '@element-plus/icons-vue'
  import type { ColumnOption } from '@/types/component'
  import { useTable } from '@/composables/useTable'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import HourLineChart from './hour-line-chart.vue'
  import CompareSettingDialog from './compare-setting-dialog.vue'
  import {
    US_HOURS,
    cnHour,
    genRecentDates,
    voToContrastRows,
    type ContrastDate,
    type ContrastRow
  } from '../utils/hourly-mock'
  import {
    asinHourCompare,
    asinHourCompareExport,
    type AsinBoardType,
    type AsinHourCompareVo
  } from '@/api/sale/asin'
  import { sub, mul, divide, add } from '@/utils/common-util'

  defineOptions({ name: 'HourlyContrast' })

  /** 转为安全数字：null/undefined/NaN 一律按 0 处理，避免 Decimal 抛错 */
  const safeNum = (n: unknown): number => {
    const v = Number(n)
    return Number.isFinite(v) ? v : 0
  }
  /** 四舍五入到2位：decimal.js 运算精确，先 ×100 取整再 ÷100 */
  const round2 = (n: number): number =>
    Number(divide(Math.round(Number(mul(safeNum(n), 100))), 100))
  /** 数值串：整数原样、带小数的补足2位（均含千分位） */
  const numStr = (n: number): string => {
    const r = round2(n)
    return Number.isInteger(r)
      ? r.toLocaleString('en-US')
      : r.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }
  /** 差值（基准-当前）：减法用 sub */
  const diff = (a: number, b: number): number => Number(sub(safeNum(a), safeNum(b)))

  /** 逐项累加，得到「截至每个小时」的累计序列（金额用 add 保证精度） */
  const cumSum = (arr: number[]): number[] => {
    let acc = 0
    return arr.map((v) => {
      acc = Number(add(acc, v))
      return acc
    })
  }

  /** 涨幅展示：正数红色（up）、负数绿色（down）；带小数四舍五入保留2位 */
  const growthText = (v: number) => `${v > 0 ? '↑' : '↓'}${numStr(Math.abs(v))}`
  const growthCls = (v: number) => (v > 0 ? 'up' : 'down')

  interface Props {
    /** 「今日」基准日期（所选时间段的结束日期） */
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

  // 勾选项
  // 取值口径：单位小时 / 时段累计 单选，默认单位小时
  const valueMode = ref<'hour' | 'total'>('hour')
  const checkedSingle = computed(() => valueMode.value === 'hour')
  const checkedTotal = computed(() => valueMode.value === 'total')
  const checkedGrowth = ref(false)
  const checkedCost = ref(false)

  // 对比日期（默认最近 8 天）
  const compareDates = ref<ContrastDate[]>(genRecentDates(props.endDate, 8))

  /** 列：日期 | 累计 | 时区(美国/中国) | 00~23（双行表头） */
  const columnsFactory = computed<ColumnOption[]>(() => [
    {
      prop: 'dateStr',
      label: '',
      width: 90,
      fixed: 'left',
      align: 'center',
      useSlot: true,
      slotName: 'dateCell'
    },
    {
      prop: '__zone',
      label: '时区',
      width: 150,
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

  const { data, columns, columnChecks, loading, refreshData, updateColumn, resetColumns } =
    useTable({
      core: {
        // 调用后端分时对比，按单位口径取销量（可加，前端再求累计）；返回数组由默认适配器处理
        apiFn: async () => {
          const dates = compareDates.value
          // if (!props.asin || !props.endDate || !dates.length) return [] as ContrastRow[]
          const res: any = await asinHourCompare({
            boardType: props.boardType,
            asin: props.asin,
            dateEnd: props.endDate,
            compareDates: dates.map((d) => d.date),
            mode: 'unit',
            showAdCost: true,
            searchMode: props.searchMode,
            site: props.site?.length ? props.site : undefined,
            shopIds: props.shopIds?.length ? props.shopIds : undefined
          })
          console.log(
            voToContrastRows((res?.data || {}) as AsinHourCompareVo, dates),
            'voToContrastRows((res?.data || {}) as AsinHourCompareVo, dates)voToContrastRows((res?.data || {}) as AsinHourCompareVo, dates)'
          )
          return voToContrastRows((res?.data || {}) as AsinHourCompareVo, dates)
        },
        immediate: true,
        columnsFactory,
        tableKey: 'sale-analysis-asin-hourly-contrast',
        tableName: 'sale-analysis-asin-hourly-contrast'
      }
    })

  // 导出参数：与查询入参一致（异步导出，返回任务ID，进度/下载见下载中心）
  const exportParams = () => ({
    boardType: props.boardType,
    asin: props.asin,
    dateEnd: props.endDate,
    compareDates: compareDates.value.map((d) => d.date),
    mode: 'unit' as 'unit' | 'cumulative',
    showAdCost: true,
    searchMode: props.searchMode,
    site: props.site?.length ? props.site : undefined,
    shopIds: props.shopIds?.length ? props.shopIds : undefined
  })

  /** 从列 prop（h_idx）解析小时下标 */
  const hourIndex = (prop?: string) => Number(String(prop).replace('h_', ''))

  interface DisplayRow {
    key: string
    dateStr: string
    mode: 'hour' | 'total'
    isBaseline: boolean
    values: number[]
    costs: number[]
    total: number
    totalCost: number
    baseValues: number[] | null
    baseTotal: number
  }

  const makeRow = (r: ContrastRow, mode: 'hour' | 'total', base?: ContrastRow): DisplayRow => {
    // 上游数据可能缺字段，统一兜底为数组，避免 cumSum / 下标访问崩溃
    const rHours = r.hours ?? []
    const rCumulative = r.cumulative ?? []
    const rCosts = r.costs ?? []
    const values = mode === 'hour' ? rHours : rCumulative
    const baseValues = base
      ? mode === 'hour'
        ? (base.hours ?? [])
        : (base.cumulative ?? [])
      : null
    // 广告费用：单位小时展示当小时花费，时段累计展示截至当前小时的累计花费
    const cumCosts = cumSum(rCosts)
    const costs = mode === 'hour' ? rCosts : cumCosts
    return {
      key: `${r.date}-${mode}`,
      dateStr: r.dateStr,
      mode,
      isBaseline: !!base && r.date === base.date,
      values,
      costs,
      total: rCumulative[rCumulative.length - 1] ?? 0,
      totalCost: cumCosts[cumCosts.length - 1] ?? 0,
      baseValues,
      baseTotal: base?.cumulative?.[base.cumulative.length - 1] ?? 0
    }
  }

  /** 展示行：单位小时在前，时段累计在后 */
  const displayRows = computed<DisplayRow[]>(() => {
    const rows = data.value as ContrastRow[]
    const base = rows[0]
    const out: DisplayRow[] = []
    if (checkedSingle.value) rows.forEach((r) => out.push(makeRow(r, 'hour', base)))
    if (checkedTotal.value) rows.forEach((r) => out.push(makeRow(r, 'total', base)))
    return out
  })

  /** 图形：每个对比日期一条折线（销量） */
  const chartSeries = computed(() =>
    (data.value as ContrastRow[]).map((r) => ({ name: r.dateStr, data: r.hours }))
  )

  // ===== 对比设置弹窗 =====
  const settingVisible = ref(false)
  const openSettingDialog = () => {
    settingVisible.value = true
  }

  /** 弹窗确定：回写对比日期并刷新 */
  const onConfirmSetting = (dates: ContrastDate[]) => {
    compareDates.value = dates
    refreshData()
  }

  // 合并为单个 watch：同一次条件变更只回调一次，避免重复请求。
  // 截止日期真正变化时才重置对比日期为最近 8 天，其余条件变化仅刷新。
  watch(
    () => [props.endDate, props.asin, props.boardType, props.searchMode, props.site, props.shopIds],
    ([endDate], [prevEndDate]) => {
      if (endDate !== prevEndDate) {
        compareDates.value = genRecentDates(props.endDate, 8)
      }
      refreshData()
    }
  )
</script>

<style lang="scss" scoped>
  .contrast-card {
    margin-top: 12px;

    :deep(.el-card__body) {
      padding: 12px 16px;
    }

    :deep(.art-table.no-border th.el-table__cell .cell) {
      border-right: 0 solid #ebeef5 !important;
    }

    // 提高一级权重（插入 .el-table），确保灰底胜过 ArtTable 组件内的 `background:#fff !important`
    :deep(.art-table.no-border .el-table th.el-table__cell) {
      background-color: #f7f8fa !important;
      border-color: #f7f8fa !important;
      border-bottom: 1px solid #ebeef5 !important;
    }

    :deep(.art-table.no-border tr td) {
      border-right-color: transparent !important;
      border-left-color: transparent !important;
    }
  }

  .contrast-body {
    padding-top: 8px;
    border-top: 1px solid #ebeef5;
  }

  // :deep(.art-table.no-border tr > td:first-child) {
  //   border-right-color: #ebeef5 !important;
  //   // border-left-color: transparent !important;
  // }
  // :deep(.art-table.no-border th:first-child) {
  //   border-right-color: #ebeef5 !important;
  // }
  // :deep(.el-table--small .el-table__cell) {
  //   padding: 5px 0 !important;
  // }
  // :deep(.el-table--small .el-table__cell) {
  //   padding: 5px 0 !important;
  // }
  :deep(.el-table--small .cell) {
    padding: 0 !important;
  }

  .contrast-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 12px;
  }

  .contrast-title {
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

  // 单位小时/时段累计/涨幅/广告费用：位于表格上方，统一水平对齐
  .contrast-checks {
    display: flex;
    gap: 14px;
    align-items: center;
    padding: 4px 0 10px;

    :deep(.el-checkbox) {
      margin-right: 0;
    }
  }

  .contrast-tools {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  // 美国/中国 双行表头
  :deep(.th-zone) {
    line-height: 32px;

    & > div:first-child {
      border-bottom: 1px solid #ebeef5 !important;
    }
  }

  // 日期列：日期与「时段累计」分两行展示
  .date-cell {
    display: flex;
    flex-direction: column;
    align-items: center;
    line-height: 1.3;

    .date-sub {
      font-size: 12px;
      color: var(--art-gray-500);
    }
  }

  .cell-stack {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    justify-content: center;
  }

  .cell-cost {
    font-size: 11px;
    color: var(--el-color-danger);
  }

  :deep(.growth-tag) {
    font-size: 11px;

    // 涨幅配色：正数红色、负数绿色
    &.up {
      color: var(--el-color-danger);
    }

    &.down {
      color: var(--el-color-success);
    }
  }
</style>
