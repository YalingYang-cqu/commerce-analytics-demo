<!-- 销售明细行「趋势分析」弹框（对齐原型）：
  - 每小时趋势：多日按小时对比（复用 asinHourCompare），顶部日期可多选 + 仅最新/全选/清空，默认选最新日；
  - 近7/14/30天、近3个月、本年：按粒度切换（复用 asinDailyStatistics）；
  数据源统一走 /ims/sales/asin/**，按该行 asin/父ASIN 维度查询。 -->
<template>
  <ElDialog
    v-model="visible"
    width="1180px"
    top="5vh"
    class="sales-trend-dialog"
    append-to-body
    destroy-on-close
    :close-on-click-modal="false"
  >
    <template #header>
      <div class="trend-dialog-title">
        <TrendCharts class="title-icon" />
        <span>趋势分析</span>
        <span class="title-code">{{ asin }}</span>
      </div>
    </template>

    <div ref="exportRef" class="trend-dialog-body">
      <!-- 信息条 -->
      <div class="trend-info">
        <div class="info-left">
          <span class="info-item"
            >商品：<b>{{ asin }}</b
            ><template v-if="productName"> · {{ productName }}</template></span
          >
          <span class="info-divider"></span>
          <span class="info-item"
            >维度：<b>{{ dimText }}</b></span
          >
          <span class="info-divider"></span>
          <span class="info-item"
            >统计周期：<b>{{ periodText }}</b></span
          >
        </div>
        <span class="info-note">{{ noteText }}</span>
      </div>

      <!-- 选择日期（仅每小时趋势） -->
      <div v-if="activeView === 'hour'" class="trend-dates">
        <span class="dates-label">选择日期</span>
        <div class="dates-chips">
          <button
            v-for="d in last7"
            :key="d"
            type="button"
            class="date-chip"
            :class="{ active: selectedDates.includes(d) }"
            @click="toggleDate(d)"
          >
            <span class="chip-radio"></span>
            <span>{{ mdOf(d) }}</span>
            <span v-if="d === baseDate" class="chip-latest">最新</span>
          </button>
        </div>
        <div class="dates-ops">
          <button type="button" @click="onlyLatest">仅最新</button>
          <button type="button" @click="selectAll">全选</button>
          <button type="button" @click="clearAll">清空</button>
        </div>
      </div>

      <!-- 展示图切换 -->
      <div class="trend-views">
        <span class="views-label">展示图</span>
        <div class="seg">
          <button
            v-for="item in viewOptions"
            :key="item.value"
            type="button"
            :class="{ active: activeView === item.value }"
            @click="activeView = item.value"
          >
            {{ item.label }}
          </button>
        </div>
      </div>

      <!-- 趋势图 -->
      <LineChart
        :metrics="metrics"
        :x-axis="xAxis"
        :loading="loading"
        mode="raw"
        height="300px"
        legend
        :show-chips="false"
        :show-end-label="false"
        :show-symbols="activeView !== 'hour'"
        :show-area="activeView !== 'hour'"
        :x-label-interval="xLabelInterval"
        :x-label-rotate="xLabelRotate"
        background="linear-gradient(180deg, #fbfdff 0%, #f4f7ff 100%)"
        @remove="onRemoveMetric"
      >
        <template #title>{{ metricLabel }}</template>
      </LineChart>
    </div>

    <template #footer>
      <ElButton :loading="exporting" :disabled="loading" @click="handleExport">
        <ElIcon v-if="!exporting" class="btn-icon"><Download /></ElIcon>导出图表
      </ElButton>
      <ElButton type="primary" @click="visible = false">完成</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { TrendCharts, Download } from '@element-plus/icons-vue'
  import LineChart from '@/components/core/charts-comp/line-chart.vue'
  import type { ChartMetric, MetricFormat } from '@/components/core/charts-comp/types'
  import { exportElementToPng } from '@/views/purchase/batch-cost/utils/export-element-image'
  import {
    asinHourCompare,
    asinDailyStatistics,
    type AsinBoardType,
    type AsinGrain
  } from '@/api/sale/asin'
  import type { SalesMetric } from '@/api/sale/sales-statistics'
  import { getSitesTodayText } from '../../utils/site-date'

  defineOptions({ name: 'InlineTrendChart' })

  const visible = defineModel<boolean>({ default: false })

  const props = withDefaults(
    defineProps<{
      /** 当前行 asin / 父ASIN 值 */
      asin: string
      /** 检索方式：asin / pasin */
      searchMode: 'asin' | 'pasin'
      /** 看板类型：asin/scasin/vcasin（由渠道映射） */
      boardType: AsinBoardType
      /** 站点筛选 */
      site?: string[]
      /** 店铺 id 筛选 */
      shopIds?: number[]
      /** 商品中文名（信息条展示） */
      productName?: string
      /** 当前指标 key：sales/revenue/order/return */
      metricKey: SalesMetric
      /** 当前指标显示名 */
      metricLabel: string
      /** 统计周期结束日（作为「今日/最新」基准） */
      dateEnd: string
    }>(),
    {
      site: () => [],
      shopIds: () => [],
      productName: '',
      metricLabel: '销量',
      dateEnd: ''
    }
  )

  type TrendView = 'hour' | 'd7' | 'd14' | 'd30' | 'm3' | 'ytd'

  const DAILY_VIEWS: { label: string; value: TrendView }[] = [
    { label: '近7天趋势', value: 'd7' },
    { label: '近14天趋势', value: 'd14' },
    { label: '近30天趋势', value: 'd30' },
    { label: '近3个月趋势', value: 'm3' },
    { label: '本年趋势', value: 'ytd' }
  ]
  /**
   * 每小时趋势可用性：
   * - SC（scasin）：始终支持（含退货量）。
   * - 综合(asin) / VC(vcasin)：支持，但「退货量」指标下无每小时数据，故不提供每小时趋势及选择日期行。
   */
  const supportsHour = computed(() =>
    props.boardType === 'scasin' ? true : props.metricKey !== 'return'
  )
  const viewOptions = computed<{ label: string; value: TrendView }[]>(() =>
    supportsHour.value ? [{ label: '每小时趋势', value: 'hour' }, ...DAILY_VIEWS] : DAILY_VIEWS
  )

  /** 指标 key → asin VO metrics 字段（看板趋势仅支持这 4 个指标，其余走 field 兜底） */
  const METRIC_FIELD: Partial<Record<SalesMetric, string>> = {
    sales: 'totalSalesQty',
    revenue: 'totalSalesAmt',
    order: 'totalOrderQty',
    return: 'returnQty'
  }
  /** 每小时 x 轴：00:00 ~ 23:00 */
  const HOURS = Array.from({ length: 24 }, (_, i) => `${String(i).padStart(2, '0')}:00`)
  /** 对比日期配色：最近 7 日按时间升序，最新一天（末位）为橙色，与原型一致 */
  const DATE_COLORS = ['#5B8FF9', '#22C55E', '#13C2C2', '#9254DE', '#F5497B', '#3B82F6', '#FF9F1C']

  const activeView = ref<TrendView>('hour')
  const selectedDates = ref<string[]>([])
  /** 每小时趋势锚点 = 今天（最近7天独立于页面日期筛选，规格 11.10-3） */
  const baseDate = ref('')
  const metrics = ref<ChartMetric[]>([])
  const xAxis = ref<string[]>([])
  const loading = ref(false)
  /** 导出图片：截取弹框内容（信息条 + 选择日期 + 展示图 + 趋势图） */
  const exportRef = ref<HTMLElement | null>(null)
  const exporting = ref(false)

  const pad = (n: number) => String(n).padStart(2, '0')
  const fmtDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
  const mdOf = (s: string) => (s ? s.slice(5) : '')
  /** 日粒度 x 轴标签去年份：2026-07-01 → 07-01（过宽会导致边缘标签被裁切/只显示部分）；周/月等其它标签原样返回 */
  const stripDateYear = (label?: string): string => {
    if (!label) return ''
    const matched = /^\d{4}-(\d{2}-\d{2})$/.exec(label)
    return matched ? matched[1] : label
  }
  const addDays = (s: string, delta: number) => {
    const d = new Date(`${s}T00:00:00`)
    d.setDate(d.getDate() + delta)
    return fmtDate(d)
  }
  const addMonths = (s: string, delta: number) => {
    const d = new Date(`${s}T00:00:00`)
    d.setMonth(d.getMonth() + delta)
    return fmtDate(d)
  }
  const num = (v: unknown) => {
    const n = Number(v)
    return Number.isFinite(n) ? n : 0
  }

  const metricFormat = computed<MetricFormat>(() =>
    props.metricKey === 'revenue' ? 'money' : 'number'
  )
  const field = computed(() => METRIC_FIELD[props.metricKey] ?? 'totalSalesQty')

  /** 最近 7 日（升序，末位 = 今天） */
  const last7 = computed<string[]>(() => {
    if (!baseDate.value) return []
    const arr: string[] = []
    for (let i = 6; i >= 0; i--) arr.push(addDays(baseDate.value, -i))
    return arr
  })

  const dateColor = (date: string) => DATE_COLORS[last7.value.indexOf(date)] ?? '#5B8FF9'
  const chipLabel = (date: string) => `${mdOf(date)}${date === baseDate.value ? ' · 最新' : ''}`

  /** 非每小时视图的粒度与起始日 */
  const dailyRange = (): { grain: AsinGrain; dateStart: string } => {
    const end = props.dateEnd
    switch (activeView.value) {
      case 'd7':
        return { grain: 'day', dateStart: addDays(end, -6) }
      case 'd14':
        return { grain: 'day', dateStart: addDays(end, -13) }
      case 'd30':
        return { grain: 'day', dateStart: addDays(end, -29) }
      case 'm3':
        return { grain: 'week', dateStart: addMonths(end, -3) }
      case 'ytd':
        return { grain: 'month', dateStart: `${end.slice(0, 4)}-01-01` }
      default:
        return { grain: 'day', dateStart: addDays(end, -6) }
    }
  }

  const VIEW_DIM: Record<TrendView, string> = {
    hour: '近7日 · 每小时',
    d7: '近7天 · 按日',
    d14: '近14天 · 按日',
    d30: '近30天 · 按日',
    m3: '近3个月 · 按周',
    ytd: '本年 · 按月'
  }
  const dimText = computed(() => VIEW_DIM[activeView.value])
  const periodText = computed(() => {
    if (!props.dateEnd) return ''
    if (activeView.value === 'hour') return `${last7.value[0] || ''} ~ ${baseDate.value}`
    return `${dailyRange().dateStart} ~ ${props.dateEnd}`
  })
  const noteText = computed(() =>
    activeView.value === 'hour'
      ? `曲线图展示每个小时的${props.metricLabel}分布，可勾选日期对比（支持多选）`
      : `曲线图展示${props.metricLabel}按周期的变化趋势`
  )

  /**
   * x 轴标签自适应：
   * - 每小时趋势：固定 24 个标签，斜放 40° 且全部显示。
   * - 日/周/月趋势：日期较多（>10）时斜放 45° 避免水平重叠（近30天亦可全部显示，含最新日期）；
   *   仅在极端密集（>40 个）时按 interval 抽稀（隔个显示），tooltip 仍可看完整日期。
   */
  const xLabelRotate = computed<number>(() =>
    activeView.value === 'hour' ? 40 : xAxis.value.length > 10 ? 45 : 0
  )
  const xLabelInterval = computed<number>(() => {
    if (activeView.value === 'hour') return 0
    const n = xAxis.value.length
    if (n <= 40) return 0
    return Math.ceil(n / 40) - 1
  })

  const commonQuery = () => ({
    boardType: props.boardType,
    asin: props.asin,
    searchMode: props.searchMode,
    site: props.site?.length ? props.site : undefined,
    shopIds: props.shopIds?.length ? props.shopIds : undefined
  })

  /** 每小时趋势：多日多曲线 */
  const loadHour = async () => {
    xAxis.value = HOURS
    if (!props.asin || !selectedDates.value.length) {
      metrics.value = []
      return
    }
    loading.value = true
    try {
      const res: any = await asinHourCompare({
        ...commonQuery(),
        dateEnd: baseDate.value,
        compareDates: [...selectedDates.value].sort(),
        mode: 'unit'
      })
      const series: any[] = res?.data?.series || []
      const byDate = new Map<string, any[]>(series.map((s) => [s.date, s.hours || []]))
      // 按时间升序排列已选日期，保证配色/图例稳定
      const ordered = last7.value.filter((d) => selectedDates.value.includes(d))
      metrics.value = ordered.map((date) => {
        const hours = byDate.get(date) || []
        const data = Array.from({ length: 24 }, (_, h) =>
          num(hours.find((x) => x.hour === h)?.metrics?.[field.value])
        )
        return {
          key: date,
          label: chipLabel(date),
          color: dateColor(date),
          format: metricFormat.value,
          data
        }
      })
    } finally {
      loading.value = false
    }
  }

  /** 近7/14/30天、近3个月、本年：按粒度单曲线 */
  const loadDaily = async () => {
    if (!props.asin) {
      metrics.value = []
      xAxis.value = []
      return
    }
    const { grain, dateStart } = dailyRange()
    loading.value = true
    try {
      const res: any = await asinDailyStatistics({
        ...commonQuery(),
        dateStart,
        dateEnd: props.dateEnd,
        grain
      })
      const rawPeriods: any[] = res?.data?.periods || []
      const buildMetric = (xs: string[], data: number[]) => {
        xAxis.value = xs
        metrics.value = [
          {
            key: props.metricKey,
            label: props.metricLabel,
            color: '#FF9F1C',
            format: metricFormat.value,
            data
          }
        ]
      }
      if (grain === 'day') {
        // 后端只返回有数据的日期（不补空日，见 SalesAdAsinServiceImpl），
        // 近7/14/30天需按请求区间补齐缺失日期，缺失日销量按 0，保证展示完整天数（旧→新，左→右）。
        const valueByDate = new Map<string, number>()
        rawPeriods.forEach((p) => {
          if (p.bucket) valueByDate.set(String(p.bucket), num(p.metrics?.[field.value]))
        })
        const days: string[] = []
        let cur = dateStart
        for (let i = 0; i < 400 && cur <= props.dateEnd; i++) {
          days.push(cur)
          if (cur === props.dateEnd) break
          cur = addDays(cur, 1)
        }
        buildMetric(
          days.map((d) => stripDateYear(d)),
          days.map((d) => valueByDate.get(d) ?? 0)
        )
      } else {
        // 周/月：后端 periods 可能倒序（最新在前），按 bucket 升序保证旧→新、左→右
        const periods = [...rawPeriods].sort((a, b) =>
          String(a.bucket || a.label).localeCompare(String(b.bucket || b.label))
        )
        buildMetric(
          periods.map((p) => stripDateYear(p.label || p.bucket)),
          periods.map((p) => num(p.metrics?.[field.value]))
        )
      }
    } finally {
      loading.value = false
    }
  }

  const load = () => (activeView.value === 'hour' ? loadHour() : loadDaily())

  const toggleDate = (d: string) => {
    const set = new Set(selectedDates.value)
    if (set.has(d)) set.delete(d)
    else set.add(d)
    selectedDates.value = [...set]
  }
  const onlyLatest = () => {
    selectedDates.value = baseDate.value ? [baseDate.value] : []
  }
  const selectAll = () => {
    selectedDates.value = [...last7.value]
  }
  // 清空后回退到默认（最新日期），避免图表「暂无数据」
  const clearAll = () => {
    selectedDates.value = baseDate.value ? [baseDate.value] : []
  }

  /** 图例 chip 关闭 → 每小时视图下取消该日期勾选 */
  const onRemoveMetric = (key: string) => {
    if (activeView.value === 'hour') {
      selectedDates.value = selectedDates.value.filter((d) => d !== key)
    }
  }

  /** 导出文件名时间戳：YYYYMMDD-HHmmss */
  const exportStamp = () => {
    const d = new Date()
    return `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(
      d.getMinutes()
    )}${pad(d.getSeconds())}`
  }

  // 导出图片：参考采购成本趋势分析弹框，基于 html2canvas 把弹框内容截成 PNG 下载
  const handleExport = async () => {
    if (!exportRef.value) {
      ElMessage.warning('暂无可导出内容')
      return
    }
    if (loading.value) {
      ElMessage.warning('数据加载中，请稍后再导出')
      return
    }
    exporting.value = true
    try {
      await nextTick()
      await new Promise((r) => requestAnimationFrame(() => r(undefined)))
      await new Promise((r) => setTimeout(r, 300))
      const code = props.asin && props.asin !== 'undefined' ? `${props.asin}-` : ''
      await exportElementToPng(exportRef.value, {
        filename: `${code}趋势分析-${exportStamp()}.png`,
        scale: 2
      })
      ElMessage.success('图片已导出')
    } catch (e) {
      console.error(e)
      ElMessage.error('导出图片失败')
    } finally {
      exporting.value = false
    }
  }

  watch(visible, (v) => {
    if (!v) return
    baseDate.value = props.dateEnd || getSitesTodayText(props.site?.length ? props.site : undefined)
    // 支持每小时则默认「每小时趋势」，否则（综合/VC 退货量）落到「近7天趋势」
    activeView.value = supportsHour.value ? 'hour' : 'd7'
    selectedDates.value = baseDate.value ? [baseDate.value] : []
    nextTick(load)
  })
  watch(activeView, (v) => {
    if (!visible.value) return
    // 切到每小时趋势若无选中日期，回退到最新日期
    if (v === 'hour' && !selectedDates.value.length) {
      selectedDates.value = baseDate.value ? [baseDate.value] : []
    }
    load()
  })
  watch(
    selectedDates,
    () => {
      if (visible.value && activeView.value === 'hour') load()
    },
    { deep: true }
  )
  watch(
    () => [props.metricKey, props.asin],
    () => {
      if (!visible.value) return
      // 切到「退货量」后综合/VC 不再支持每小时趋势：从 hour 回退到近7天（由 activeView watch 触发 load）
      if (!supportsHour.value && activeView.value === 'hour') {
        activeView.value = 'd7'
        return
      }
      if (activeView.value === 'hour') {
        selectedDates.value = baseDate.value ? [baseDate.value] : []
      }
      load()
    }
  )
</script>

<style lang="scss">
  .sales-trend-dialog {
    // 弹框随内容自适应高度（配合 top=5vh + 320px 以下图高，整体可落入视口，无需竖直滚动条）
    margin-bottom: 5vh;

    .el-dialog__header {
      padding: 16px 20px 12px;
      margin-right: 0;
      border-bottom: 1px solid #edf0f5;
    }

    .el-dialog__body {
      padding: 14px 20px 6px;
    }

    .el-dialog__footer {
      padding: 10px 20px 16px;
      border-top: 1px solid #edf0f5;
    }
  }
</style>

<style lang="scss" scoped>
  .trend-dialog-title {
    display: flex;
    gap: 8px;
    align-items: center;
    font-size: 16px;
    font-weight: 700;
    color: #111827;

    .title-icon {
      width: 18px;
      color: #2f6bff;
    }

    .title-code {
      margin-left: 6px;
      font-size: 13px;
      font-weight: 500;
      color: #6b7280;
    }
  }

  .trend-dialog-body {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  // 信息条
  .trend-info {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 16px;
    align-items: center;
    justify-content: space-between;
    padding: 10px 14px;
    font-size: 13px;
    color: #5f6877;
    background: #f6f8fc;
    border: 1px solid #eaeefb;
    border-radius: 8px;

    .info-left {
      display: flex;
      flex-wrap: wrap;
      gap: 8px 12px;
      align-items: center;
    }

    .info-item b {
      font-weight: 600;
      color: #1f2937;
    }

    .info-divider {
      width: 1px;
      height: 12px;
      background: #d6ddec;
    }

    .info-note {
      font-size: 12px;
      color: #9aa3b2;
    }
  }

  // 选择日期
  .trend-dates {
    display: flex;
    flex-wrap: wrap;
    gap: 10px;
    align-items: center;

    .dates-label {
      font-size: 13px;
      color: #5f6877;
    }

    .dates-chips {
      display: flex;
      flex: 1;
      flex-wrap: wrap;
      gap: 8px;
    }

    .date-chip {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      height: 30px;
      padding: 0 12px;
      font-size: 13px;
      color: #5f6877;
      cursor: pointer;
      background: #fff;
      border: 1px solid #dce3ef;
      border-radius: 16px;
      transition: all 0.15s;

      .chip-radio {
        width: 12px;
        height: 12px;
        border: 1px solid #c0c8d8;
        border-radius: 50%;
      }

      .chip-latest {
        padding: 0 5px;
        font-size: 11px;
        line-height: 16px;
        color: #fff;
        background: #ff9f1c;
        border-radius: 3px;
      }

      &.active {
        color: #2454e6;
        border-color: #2454e6;

        .chip-radio {
          background: #2454e6;
          border-color: #2454e6;
          box-shadow: inset 0 0 0 2px #fff;
        }
      }
    }

    .dates-ops {
      display: inline-flex;
      gap: 6px;

      button {
        height: 30px;
        padding: 0 12px;
        font-size: 13px;
        color: #5f6877;
        cursor: pointer;
        background: #fff;
        border: 1px solid #dce3ef;
        border-radius: 6px;

        &:hover {
          color: #2454e6;
          border-color: #2454e6;
        }
      }
    }
  }

  // 展示图切换
  .trend-views {
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 8px 0;
    border-top: 1px solid #f0f2f6;

    .views-label {
      font-size: 13px;
      color: #5f6877;
    }
  }

  .seg {
    display: inline-flex;
    padding: 3px;
    background: #f4f6fb;
    border: 1px solid #dce3ef;
    border-radius: 8px;

    button {
      height: 30px;
      padding: 0 14px;
      font-size: 13px;
      color: #5f6877;
      cursor: pointer;
      background: transparent;
      border: 0;
      border-radius: 6px;

      &.active {
        color: #2454e6;
        background: #fff;
        box-shadow: 0 1px 3px rgb(15 23 42 / 8%);
      }
    }
  }

  .btn-icon {
    margin-right: 4px;
    vertical-align: middle;
  }
</style>
