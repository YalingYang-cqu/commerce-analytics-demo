<!-- 指标趋势对比：折线图(默认插槽) + 右侧「对比指标当前值」+ 底部「运营洞察」。
     数据由父级造假序列计算（对齐 dataDemo/订单利润(1).html 的 trend-stats / opsDiagnosis 逻辑）。 -->
<template>
  <div class="trend-insight">
    <!-- 上部：左折线图 + 右侧对比指标当前值 -->
    <div class="ti-top">
      <div class="ti-chart">
        <slot />
      </div>
      <div class="ti-side" :class="{ 'is-single': sideStats.length === 1 }">
        <div v-for="s in sideStats" :key="s.key" class="ti-stat">
          <div class="ti-stat-k">{{ s.label }}</div>
          <div class="ti-stat-v" :style="{ color: s.color }">{{ s.value }}</div>
          <div class="ti-stat-s">当前筛选{{ grainLabel }}均</div>
        </div>
        <div v-if="!sideStats.length" class="ti-empty">点击上方卡片添加对比指标</div>
      </div>
    </div>

    <!-- 底部：运营洞察（所选区间前后半段对比）；仅「看板」维度展示，数据由父级经营诊断接口预计算 -->
    <div v-if="showOps && cards.length" class="ti-ops">
      <div v-for="(c, i) in cards" :key="i" class="ops-card" :class="c.cls">
        <div class="ico">{{ c.ico }}</div>
        <div class="ops-main">
          <TableHeaderTip class="ops-title" :label="c.title" :tip="c.rule" />
          <div class="d" v-html="c.desc"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { type ChartMetric, formatValue } from '@/components/core/charts-comp/types'
  import TableHeaderTip from '@/components/core/tables/table-header-tip/index.vue'
  import { add, divide } from '@/utils/dataprocess'
  import { formatMoney } from '../currency'
  import type { OpsCard } from '../operations-diagnosis'
  import { formatTrendCountAverage } from '../presentation'

  interface Props {
    /** 对比指标（= 折线图当前选中指标，含各自序列，用于右侧当前均值） */
    metrics: ChartMetric[]
    /** 粒度文案：日 / 周 / 月，用于右侧「当前筛选X均」 */
    grainLabel: string
    /** 运营洞察卡：由父级经营诊断接口预计算传入（仅看板维度非空） */
    opsCards?: OpsCard[]
    /** 是否展示底部运营洞察（仅「看板」维度为 true） */
    showOps?: boolean
  }
  const props = withDefaults(defineProps<Props>(), { showOps: true, opsCards: () => [] })

  const sum = (arr: number[]): number => add(...arr)
  const avg = (arr: number[]): number | null => (arr.length ? divide(sum(arr), arr.length) : null)

  // 右侧：每个对比指标的当前筛选均值
  const sideStats = computed(() =>
    props.metrics.map((m) => {
      const value = avg(m.data || [])
      return {
        key: m.key,
        label: m.label,
        color: m.color,
        // 无数据指标显示占位符；金额随当前币种符号（$/¥），其余按 format
        value:
          value == null
            ? '—'
            : m.format === 'money'
              ? formatMoney(value)
              : m.format === 'number'
                ? formatTrendCountAverage(value)
                : formatValue(value, m.format)
      }
    })
  )

  // 底部：运营洞察卡（父级预计算）
  const cards = computed<OpsCard[]>(() => props.opsCards || [])
</script>

<style lang="scss" scoped>
  .trend-insight {
    display: flex;
    flex-direction: column;
  }

  // 上部：折线图 + 右侧指标当前值（对齐 demo trend-grid-wrap）
  .ti-top {
    display: grid;
    grid-template-columns: minmax(0, 1fr) 200px;
    gap: 12px;
    align-items: stretch;
  }

  .ti-chart {
    min-width: 0;
    // 作为右侧高度基准：撑满 ti-top 行高
    height: 100%;
  }

  // 右侧：高度对齐左侧图；卡片均分 (父高 - gap) / n
  .ti-side {
    display: flex;
    flex-direction: column;
    gap: 8px;
    height: 100%;
    min-height: 0;
  }

  .ti-stat {
    display: flex;
    flex: 1 1 0;
    flex-direction: column;
    justify-content: center;
    min-height: 0;
    padding: 10px 12px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 9px;

    .ti-stat-k {
      font-size: 11px;
      color: var(--art-gray-500);
    }

    .ti-stat-v {
      margin-top: 3px;
      font-size: 16px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
    }

    .ti-stat-s {
      margin-top: 3px;
      font-size: 11px;
      color: var(--art-gray-500);
    }
  }

  // 仅 1 张卡：内容顶对齐
  .ti-side.is-single .ti-stat {
    justify-content: flex-start;
  }

  .ti-empty {
    display: flex;
    flex: 1 1 0;
    align-items: center;
    justify-content: center;
    min-height: 0;
    padding: 18px 12px;
    font-size: 12px;
    color: var(--art-gray-400);
    text-align: center;
    border: 1px dashed var(--el-border-color);
    border-radius: 9px;
  }

  // 底部：运营洞察卡（对齐 demo opsDiagnosis）
  .ti-ops {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 10px;
    margin-top: 12px;
  }

  .ops-card {
    display: flex;
    gap: 9px;
    align-items: flex-start;
    min-width: 0;
    padding: 11px 12px;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 10px;

    .ico {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 26px;
      height: 26px;
      font-size: 13px;
      font-weight: 800;
      border-radius: 8px;
    }

    &.good .ico {
      color: #15803d;
      background: #effaf5;
    }

    &.good .d :deep(b) {
      color: #15803d;
    }

    &.warn .ico {
      color: #dc2626;
      background: #fef2f2;
    }

    &.warn .d :deep(b) {
      color: #dc2626;
    }

    &.info .ico {
      color: #1d4ed8;
      background: #eef7ff;
    }

    .ops-main {
      min-width: 0;
    }

    // 标题 + 说明 tip（复用 TableHeaderTip）
    .ops-title {
      margin-bottom: 3px;
      font-size: 12.5px;
      font-weight: 700;
      color: var(--art-gray-900);

      :deep(.iconfont-custom) {
        font-size: 13px;
        font-weight: 400;
        color: var(--art-gray-400);
        cursor: help;
      }
    }

    .d {
      font-size: 11.5px;
      line-height: 1.45;
      color: var(--art-gray-600);

      :deep(b) {
        font-variant-numeric: tabular-nums;
        color: var(--art-gray-900);
      }
    }
  }

  @media (width <= 1100px) {
    .ti-top {
      grid-template-columns: 1fr;
    }

    .ti-ops {
      grid-template-columns: 1fr;
    }
  }
</style>
