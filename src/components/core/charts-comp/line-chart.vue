<!-- 指标趋势对比折线图：支持粒度/时间范围/归一化-原值模式切换、选中指标 chips、行尾标签显示数值 -->
<template>
  <div class="line-chart-comp">
    <!-- 内联头部：标题 + 指标 chips + 工具栏(原值/归一化) 同处一行（inlineHeader=true 时启用） -->
    <div v-if="inlineHeader" class="lcc-inline-head">
      <span class="lcc-title lcc-title--inline"
        ><slot name="title">{{ title }}</slot></span
      >
      <div v-if="showChips" class="lcc-chips lcc-chips--inline">
        <span
          v-for="m in metrics"
          :key="m.key"
          class="lcc-chip"
          :class="{ 'is-hidden': isHidden(m.key) }"
          :style="chipStyle(m.color)"
          :title="isHidden(m.key) ? '点击显示' : '点击隐藏'"
          @click="toggleHidden(m.key)"
        >
          <span class="lcc-chip-dot"></span>
          <span class="lcc-chip-label">{{ m.label }}</span>
          <el-icon class="lcc-chip-close" @click.stop="emit('remove', m.key)"><Close /></el-icon>
        </span>
        <span v-if="!metrics.length" class="lcc-empty-tip">请添加对比指标</span>
      </div>
      <div v-if="$slots.toolbar" class="lcc-inline-tools">
        <slot name="toolbar" :mode="mode" />
      </div>
    </div>

    <!-- 默认布局：工具栏行 + chips 行（各页面原有表现保持不变） -->
    <template v-else>
      <!-- 工具栏行：由父级通过插槽注入 -->
      <div v-if="$slots.toolbar" class="lcc-controls">
        <slot name="toolbar" :mode="mode" />
      </div>

      <!-- 选中指标 chips：点击切换该指标在图表中的显示/隐藏（位于图表边框上方） -->
      <div v-if="showChips" class="lcc-chips">
        <span
          v-for="m in metrics"
          :key="m.key"
          class="lcc-chip"
          :class="{ 'is-hidden': isHidden(m.key) }"
          :style="chipStyle(m.color)"
          :title="isHidden(m.key) ? '点击显示' : '点击隐藏'"
          @click="toggleHidden(m.key)"
        >
          <span class="lcc-chip-dot"></span>
          <span class="lcc-chip-label">{{ m.label }}</span>
          <el-icon class="lcc-chip-close" @click.stop="emit('remove', m.key)"><Close /></el-icon>
        </span>
        <span v-if="!metrics.length" class="lcc-empty-tip">请添加对比指标</span>
      </div>
    </template>

    <!-- 图表容器（带边框+渐变背景）：非内联时标题行（标题左 + 文案右）在指标下方、图表上方 -->
    <div class="lcc-chart-wrap" :style="{ background }">
      <div v-if="!inlineHeader" class="lcc-header">
        <div class="lcc-title">
          <slot name="title">{{ title }}</slot>
        </div>
        <div class="lcc-extra">
          <slot name="extra" />
        </div>
      </div>
      <div ref="chartRef" class="lcc-chart" :style="{ height }" v-loading="loading"></div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { Close } from '@element-plus/icons-vue'
  import type { EChartsOption } from '@/utils/echarts'
  import { hexToRgba } from '@/utils/ui'
  import { useChartComponent } from '@/composables/useChart'
  import { type ChartMetric, type ChartMode, formatMetric } from './types'

  defineOptions({ name: 'LineChartComp' })

  interface Props {
    /** 已解析的指标（含颜色与数据） */
    metrics: ChartMetric[]
    /** X 轴标签（如日期） */
    xAxis: string[]
    /** 标题 */
    title?: string
    /** 高度 */
    height?: string
    /** 加载中 */
    loading?: boolean
    /** 展示模式：归一化 / 原值（影响 Y 轴与曲线缩放，行尾标签始终显示原值） */
    mode?: ChartMode
    /** 卡片背景色 */
    background?: string
    /** X 轴标签显示间隔：传 0 强制显示全部标签；不传则按 ECharts 自动抽稀 */
    xLabelInterval?: number
    /** X 轴标签旋转角度（度），默认 0 不旋转 */
    xLabelRotate?: number
    /** 是否显示选中指标 chips（默认显示） */
    showChips?: boolean
    /** 内联头部：标题 + chips + 工具栏同处一行（默认 false，保持各页面原布局） */
    inlineHeader?: boolean
    /** 是否显示行尾数值标签（默认显示；关闭后 X 轴铺满，无右侧留白） */
    showEndLabel?: boolean
    /** 是否显示图表顶部居中图例（默认不显示） */
    legend?: boolean
    /** 是否显示每个节点的圆点（默认不显示） */
    showSymbols?: boolean
    /** 是否显示折线下方区域阴影（默认不显示） */
    showArea?: boolean
    /** 原值模式的坐标轴是否强制从 0 开始；含负值的利润图应关闭 */
    rawMinZero?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    title: '指标趋势对比',
    height: '280px',
    loading: false,
    mode: 'normalized',
    background: 'linear-gradient(180deg, #fbfdff 0%, #f4f7ff 100%)',
    xLabelRotate: 0,
    showChips: true,
    inlineHeader: false,
    showEndLabel: true,
    legend: false,
    showSymbols: false,
    showArea: false,
    rawMinZero: true
  })

  const emit = defineEmits<{
    (e: 'remove', key: string): void
  }>()

  /**
   * 出现过的指标 key（首次出现顺序）。用于保持 series 槽位稳定：
   * 即便某指标被移除/隐藏，仍以空数据占位，series 数量只增不减，
   * 避免 ECharts setOption 合并时残留旧曲线（删除一条线导致其余线串色/残留）。
   */
  const knownOrder = ref<string[]>([])

  /** 临时隐藏的指标 key（仅影响图表曲线显示，不从选中里移除） */
  const hidden = ref<Set<string>>(new Set())
  const isHidden = (key: string): boolean => hidden.value.has(key)
  const toggleHidden = (key: string): void => {
    const next = new Set(hidden.value)
    if (next.has(key)) next.delete(key)
    else next.add(key)
    hidden.value = next
  }

  /** chip 背景/边框按指标色淡化 */
  const chipStyle = (color: string) => ({
    '--c': color,
    background: hexToRgba(color, 0.1).rgba,
    borderColor: hexToRgba(color, 0.28).rgba
  })

  // ========== 数据计算辅助 ==========
  const lastValue = (data: number[]): number => {
    for (let i = data.length - 1; i >= 0; i--) {
      const v = data[i]
      if (v != null && !Number.isNaN(v)) return v
    }
    return 0
  }

  /**
   * 归一化：Min-Max 映射到 0~100（PRD 10.4）：归一化值 = (当日值 - 最小值) / (最大值 - 最小值) * 100%。
   * 区间内最小值→0%、最大值→100%，消除各指标单位/量级差异，用于多曲线同轴对比趋势。
   * 原值模式直接返回原值；归一化模式优先使用后端下发的 normalized（口径一致、避免前后端二次归一化偏差），
   * 未提供时回退前端 Min-Max（min/max 按各指标当前展示区间独立计算；空值按 0% 处理；全平区间置 0% 避免除零）。
   */
  /** 归一化数组（与当前模式无关）：优先后端 normalized，否则前端 Min-Max 到 0~100 */
  const normalizedData = (m: ChartMetric): number[] => {
    if (m.normalized && m.normalized.length) return m.normalized
    let mn = Infinity
    let mx = -Infinity
    m.data.forEach((v) => {
      if (v != null && !Number.isNaN(v)) {
        if (v < mn) mn = v
        if (v > mx) mx = v
      }
    })
    if (mx === -Infinity) return m.data.map(() => 0)
    const range = mx - mn
    return m.data.map((v) => {
      if (v == null || Number.isNaN(v)) return 0
      return range ? +(((v - mn) / range) * 100).toFixed(2) : 0
    })
  }

  const toPlotData = (m: ChartMetric): number[] => {
    if (props.mode !== 'normalized') return m.data
    return normalizedData(m)
  }

  const {
    chartRef,
    getAxisLineStyle,
    getAxisLabelStyle,
    getAxisTickStyle,
    getSplitLineStyle,
    getTooltipStyle
  } = useChartComponent({
    props,
    checkEmpty: () => !props.metrics.length || !props.xAxis.length,
    watchSources: [
      () => props.metrics,
      () => props.xAxis,
      () => props.mode,
      () => props.showSymbols,
      () => props.showArea,
      () => hidden.value
    ],
    generateOptions: (): EChartsOption => {
      const isNorm = props.mode === 'normalized'
      // 累积出现过的 key（保持 series 槽位稳定，避免合并残留）
      props.metrics.forEach((m) => {
        if (!knownOrder.value.includes(m.key)) knownOrder.value.push(m.key)
      })
      const orderedKeys = knownOrder.value
      const byKey = new Map<string, ChartMetric>(props.metrics.map((m) => [m.key, m]))
      // 行尾标签数值（始终显示原值）
      const endText = new Map<string, string>()
      props.metrics.forEach((m) => endText.set(m.key, formatMetric(m, lastValue(m.data))))

      // Y 轴规则：
      //  - 归一化：单一左侧百分比轴(0~100%)。
      //  - 原值：按选中指标实际存在的数据类型决定——只有一种类型时仅显示 1 条轴并放左侧；
      //    两种类型都有时显示 2 条轴（左=百分比轴，右=数值轴），百分比类走左轴、数值类走右轴。
      //  - 数据类型：百分比类(format=percent) vs 数值类(件数/金额美元/倍数，共用一条数值轴)。
      const isPercentMetric = (m?: ChartMetric): boolean => m?.format === 'percent'
      const hasPercent = props.metrics.some(isPercentMetric)
      const hasNumeric = props.metrics.some((m) => !isPercentMetric(m))
      const dualAxis = !isNorm && hasPercent && hasNumeric
      // 左轴类型：归一化 或 存在百分比类指标 → 百分比轴；仅数值类 → 数值轴
      const leftIsPercent = isNorm || hasPercent
      const percentLabel = { ...getAxisLabelStyle(true), fontSize: 12, formatter: '{value}%' }
      const numberLabel = { ...getAxisLabelStyle(true), fontSize: 12, formatter: '{value}' }
      // 图表实例复用 setOption「合并」更新，切换模式时轴的数量/刻度会变；为避免归一化的 max:100
      // 残留到原值数值轴（把大数量级曲线压到 100 封顶），此处固定输出 2 个轴并对每个可变字段显式赋值，
      // max 自适应用 null 显式覆盖（合并模式下 undefined 会被忽略、保留旧值）。
      const AUTO_MAX = null as unknown as number
      const AUTO_MIN = null as unknown as number
      const yAxis: EChartsOption['yAxis'] = [
        {
          // 左轴：单轴场景下唯一的轴（百分比或数值）；双轴场景下为百分比轴。归一化固定 0~100%，原值自适应。
          type: 'value',
          position: 'left',
          show: true,
          min: isNorm || props.rawMinZero ? 0 : AUTO_MIN,
          max: isNorm ? 100 : AUTO_MAX,
          axisLabel: leftIsPercent ? percentLabel : numberLabel,
          axisLine: getAxisLineStyle(false),
          splitLine: getSplitLineStyle(true)
        },
        {
          // 右轴：仅原值且同时存在数值/百分比两类指标时显示的数值轴；刻度置于图外右侧，避免与 X 轴/行尾标签重叠
          type: 'value',
          position: 'right',
          show: dualAxis,
          min: props.rawMinZero ? 0 : AUTO_MIN,
          max: AUTO_MAX,
          axisLabel: numberLabel,
          axisLine: getAxisLineStyle(false),
          axisTick: { show: false },
          splitLine: { show: false }
        }
      ]
      // 双轴时数值类走右轴(1)、百分比类走左轴(0)；单轴/归一化统一左轴(0)
      const axisIndexFor = (m?: ChartMetric): number => (dualAxis && !isPercentMetric(m) ? 1 : 0)

      return {
        grid: {
          top: props.legend ? 44 : 24,
          left: 8,
          // 行尾标签需右侧留白；关闭后 X 轴铺满边框
          right: props.showEndLabel ? 120 : 24,
          bottom: props.xLabelRotate ? 24 : 8,
          containLabel: true
        },
        ...(props.legend
          ? {
              legend: {
                show: true,
                top: 8,
                type: 'scroll',
                icon: 'roundRect',
                itemWidth: 16,
                itemHeight: 4,
                itemGap: 16,
                textStyle: { color: '#5f6877', fontSize: 12 },
                // 仅展示当前选中指标（按 metrics 顺序），排除 knownOrder 里的空占位 series，
                // 避免出现指标 key（如 sales）残留图例；顺序与 metrics 一致（最新在末尾→渲染在最右）
                data: props.metrics.map((m) => m.label)
              }
            }
          : {}),
        tooltip: {
          ...getTooltipStyle('axis'),
          formatter: (params: any) => {
            const ps = Array.isArray(params) ? params : [params]
            if (!ps.length) return ''
            const idx = ps[0].dataIndex
            const head = `<div style="margin-bottom:6px;font-weight:600">${props.xAxis[idx] ?? ''}</div>`
            const rows = ps
              .map((p: any) => {
                const m = byKey.get(orderedKeys[p.seriesIndex])
                const raw = m ? m.data[idx] : p.value
                const val = m ? formatMetric(m, raw) : raw
                // 归一化值：与模式无关，始终展示（浮窗同时给出原值+归一化，便于对比）
                const nv = m ? normalizedData(m)[idx] : undefined
                const normText =
                  nv == null || Number.isNaN(nv)
                    ? ''
                    : `<span style="margin-left:12px;color:#9aa3b2">归一化 ${nv.toFixed(1)}</span>`
                return `<div style="display:flex;align-items:center;gap:6px;line-height:20px">
                  <span style="width:8px;height:8px;border-radius:50%;background:${p.color}"></span>
                  <span style="flex:1">${p.seriesName}</span>
                  <b style="margin-left:16px">${val}</b>
                  ${normText}
                </div>`
              })
              .join('')
            return head + rows
          }
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: props.xAxis,
          axisTick: getAxisTickStyle(),
          axisLine: getAxisLineStyle(true),
          axisLabel: {
            ...getAxisLabelStyle(true),
            fontSize: 12,
            rotate: props.xLabelRotate,
            ...(props.xLabelInterval !== undefined ? { interval: props.xLabelInterval } : {})
          }
        },
        yAxis,
        series: orderedKeys.map((key) => {
          const m = byKey.get(key)
          // 已移除（不在当前选中）或被隐藏 → 空数据占位（不画曲线、不显示行尾标签）
          const blank = !m || hidden.value.has(key)
          const color = m?.color ?? 'transparent'
          return {
            name: m?.label ?? key,
            type: 'line',
            smooth: true,
            symbol: 'circle',
            symbolSize: 6,
            showSymbol: props.showSymbols,
            showAllSymbol: props.showSymbols,
            yAxisIndex: axisIndexFor(m),
            data: blank || !m ? [] : toPlotData(m),
            lineStyle: { width: 1.5, color, type: m?.lineType ?? 'solid' },
            itemStyle: { color },
            areaStyle:
              !blank && props.showArea
                ? {
                    color: {
                      type: 'linear',
                      x: 0,
                      y: 0,
                      x2: 0,
                      y2: 1,
                      colorStops: [
                        { offset: 0, color: hexToRgba(color, 0.2).rgba },
                        { offset: 1, color: hexToRgba(color, 0.04).rgba }
                      ]
                    }
                  }
                : undefined,
            emphasis: { focus: 'series' },
            // 末端标签带边框（紧凑版）：小内边距+细边框，占位尽量小，
            // 配合 moveOverlap: 'shiftY' 让多指标在末端收拢时能上下错开、降低重叠概率。
            labelLayout: { moveOverlap: 'shiftY', hideOverlap: false },
            endLabel: {
              show: !blank && props.showEndLabel,
              color,
              fontSize: 12,
              distance: 8,
              backgroundColor: `${color}1A`,
              borderColor: color,
              borderWidth: 0.5,
              borderRadius: 4,
              padding: [2, 5],
              formatter: () => `${m?.label ?? ''}  ${endText.get(key) ?? ''}`
            }
          }
        })
      }
    }
  })
</script>

<style lang="scss" scoped>
  .line-chart-comp {
    display: flex;
    flex-direction: column;
    width: 100%;
  }

  .lcc-controls {
    display: flex;
    margin-bottom: 8px;
  }

  // 内联头部：标题 + chips 靠左，工具栏靠右，同处一行
  .lcc-inline-head {
    display: flex;
    flex-wrap: wrap;
    gap: 8px 12px;
    align-items: center;
    margin-bottom: 10px;

    .lcc-title--inline {
      flex: none;
    }

    .lcc-chips--inline {
      flex: 1 1 auto;
      min-height: 0;
      margin: 0;
    }

    .lcc-inline-tools {
      flex: none;
      margin-left: auto;
    }
  }

  // 图表容器：边框 + 渐变背景（参照 trend-chart-wrap）
  .lcc-chart-wrap {
    padding: 8px 12px 6px;
    border: 1px solid #e6ecf8;
    border-radius: 10px;
  }

  // 标题行：位于图表上方（参照 trend-chart-head）
  .lcc-header {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 16px;
    align-items: center;
    justify-content: space-between;
    padding: 0 4px 8px;
  }

  .lcc-extra {
    font-size: 12px;
    color: #9aa3b2;
  }

  .lcc-title {
    font-size: 13px;
    font-weight: 600;
    color: #1f2937;
  }

  .lcc-chips {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
    min-height: 28px;
    margin: 0 0 10px;

    .lcc-chip {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      height: 26px;
      padding: 0 8px 0 10px;
      font-size: 12px;
      color: var(--c);
      cursor: pointer;
      border: 1px solid;
      border-radius: 13px;
      transition: all 0.15s;

      // 隐藏态：降透明度 + 删除线（保留原色，再次点击恢复）
      &.is-hidden {
        text-decoration: line-through;
        opacity: 0.4;
      }

      .lcc-chip-dot {
        width: 8px;
        height: 8px;
        background: var(--c);
        border-radius: 50%;
      }

      .lcc-chip-label {
        font-weight: 500;
      }

      .lcc-chip-close {
        font-size: 13px;
        cursor: pointer;
        opacity: 0.7;

        &:hover {
          opacity: 1;
        }
      }
    }

    .lcc-empty-tip {
      font-size: 13px;
      color: var(--art-gray-400, #c0c4cc);
    }
  }

  .lcc-chart {
    width: 100%;
  }
</style>
