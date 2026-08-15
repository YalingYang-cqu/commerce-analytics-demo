<!-- 单物流渠道历史价格卡片 -->
<template>
  <ElCard shadow="never" class="channel-price-card" :style="accentVars">
    <div class="channel-price-card__head">
      <div class="channel-price-card__head-left">
        <span
          :class="getChannelTagClass(supplierIndex, supplier.channelName)"
          :title="supplier.channelName"
        >
          {{ formatChannelShortName(supplier.channelName) }}
        </span>
        <span class="latest-info">
          最新
          <strong>¥{{ formatMoney(supplier.latestPrice) }}</strong>
          <span class="latest-info__date">{{ supplier.latestDate }}</span>
        </span>
      </div>
      <span class="version-count">{{ supplier.versions.length }} 个版本</span>
    </div>

    <div class="channel-price-card__body">
      <div class="version-tables" :class="{ 'is-split': isSplit }">
        <ArtTable
          v-for="(group, gi) in versionGroups"
          :key="gi"
          class="version-table-col"
          :data="group"
          :columns="versionColumns"
          :pagination="undefined"
          :show-table-header="false"
          :auto-height="true"
          :border="false"
          :stripe="false"
          row-key="version"
          size="small"
        >
          <template #version="{ row }">
            <ElLink type="primary" :underline="false">{{ row.version }}</ElLink>
          </template>
          <template #price="{ row }">
            <span class="col-price"
              >¥{{ formatMoney(row.price)
              }}<span class="price-estimate-tag" v-if="row.costType === 'estimate'"
                >(预估)</span
              ></span
            >
          </template>
          <template #change="{ row }">
            <span
              v-if="row.change !== null && row.change !== 0"
              class="price-change"
              :class="row.change > 0 ? 'is-up' : 'is-down'"
            >
              <span class="arrow-icon">{{ row.change > 0 ? '↑' : '↓' }}</span>
              {{ formatChange(row.change) }}
            </span>
            <span v-else class="price-change is-flat">—</span>
          </template>
          <template #effectiveDate="{ row }">
            <span class="col-date">{{ row.effectiveDate }}</span>
          </template>
        </ArtTable>
      </div>

      <div class="chart-stats">
        <PriceHistoryBarChart :versions="supplier.versions" :color="chartColor" />
        <ul class="stats-list">
          <li>
            <span class="stats-label">最高</span>
            <span class="stats-value">¥{{ formatMoney(supplier.stats.max) }}</span>
          </li>
          <li>
            <span class="stats-label">最低</span>
            <span class="stats-value">¥{{ formatMoney(supplier.stats.min) }}</span>
          </li>
          <li>
            <span class="stats-label">均价</span>
            <span class="stats-value is-avg">¥{{ formatMoney(supplier.stats.avg) }}</span>
          </li>
        </ul>
      </div>
    </div>
  </ElCard>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { ElCard, ElLink } from 'element-plus'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import PriceHistoryBarChart from './price-history-bar-chart.vue'
  import type { ChannelPriceHistory } from '../utils/mock-price-history'
  import { formatChannelShortName, getChannelTagClass } from '../utils/channel-tag'

  defineOptions({ name: 'PriceHistorySupplierCard' })

  const props = defineProps<{
    supplier: ChannelPriceHistory
    supplierIndex: number
    chartColor: string
  }>()

  /**
   * 把十六进制色与白/黑按比例混合，返回 rgb() 字符串。
   * 不用 CSS color-mix()：html2canvas 1.4.1 无法解析它，会导致导出图片失败。
   */
  function mixColor(hex: string, ratio: number, mixWith: 'white' | 'black'): string {
    const m = /^#?([\da-f]{6})$/i.exec(hex.trim())
    if (!m) return hex
    const int = parseInt(m[1], 16)
    const r = (int >> 16) & 255
    const g = (int >> 8) & 255
    const b = int & 255
    const base = mixWith === 'white' ? 255 : 0
    const mix = (c: number) => Math.round(c * ratio + base * (1 - ratio))
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
  }

  /** 由主题色派生的一组颜色变量，注入卡片根节点供样式复用 */
  const accentVars = computed(() => ({
    '--card-accent': props.chartColor,
    '--card-accent-soft': mixColor(props.chartColor, 0.12, 'white'),
    '--card-accent-faint': mixColor(props.chartColor, 0.03, 'white'),
    '--card-accent-pill-bg': mixColor(props.chartColor, 0.16, 'white'),
    '--card-accent-pill-text': mixColor(props.chartColor, 0.7, 'black'),
    '--card-accent-strong': mixColor(props.chartColor, 0.75, 'black')
  }))

  const versionColumns = [
    { prop: 'version', label: '版本', minWidth: 60, useSlot: true },
    { prop: 'price', label: '价格', minWidth: 100, useSlot: true },
    { prop: 'change', label: '变化', minWidth: 80, useSlot: true },
    { prop: 'effectiveDate', label: '生效日期', minWidth: 100, useSlot: true }
  ]

  /** 版本数超过该阈值时，列表从中间对半切为左右两列展示 */
  const SPLIT_THRESHOLD = 5

  /** 待渲染的版本分组：1 组（单列）或 2 组（左右两列，左列填满再右列） */
  const versionGroups = computed(() => {
    const list = props.supplier.versions
    if (list.length <= SPLIT_THRESHOLD) return [list]
    const half = Math.ceil(list.length / 2)
    return [list.slice(0, half), list.slice(half)]
  })

  const isSplit = computed(() => versionGroups.value.length > 1)

  /** 金额展示：有几位小数就展示几位（不补零、不强制两位），保留千分位分组 */
  function formatMoney(val: number) {
    const decimals = (String(val).split('.')[1] || '').length
    return val.toLocaleString('zh-CN', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    })
  }

  function formatChange(change: number) {
    return Math.abs(change)
  }
</script>

<style lang="scss" scoped>
  .channel-price-card {
    --card-accent: var(--el-color-primary);

    position: relative;
    overflow: hidden;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 12px;
    box-shadow: 0 2px 8px rgb(31 45 61 / 5%);
    transition:
      box-shadow 0.25s ease,
      border-color 0.25s ease,
      transform 0.25s ease;

    /* 左侧渠道主题色装饰条 */
    // &::before {
    //   position: absolute;
    //   top: 0;
    //   left: 0;
    //   z-index: 1;
    //   width: 3px;
    //   height: 100%;
    //   content: '';
    //   background: var(--card-accent);
    // }

    &:hover {
      border-color: var(--card-accent);
      box-shadow: 0 10px 28px rgb(31 45 61 / 10%);
      transform: translateY(-2px);
    }

    :deep(.el-card__body) {
      padding: 0;
    }

    &__head {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      padding: 14px 16px;
      background: linear-gradient(135deg, var(--card-accent-soft), var(--card-accent-faint));
      border-bottom: 1px solid var(--el-border-color-lighter);
    }

    &__head-left {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      align-items: center;
      min-width: 0;
    }

    .latest-info {
      font-size: 13px;
      color: var(--el-text-color-regular);

      strong {
        margin: 0 6px;
        font-size: 17px;
        font-weight: 700;
        color: var(--el-text-color-primary);
      }

      &__date {
        color: var(--el-text-color-secondary);
      }
    }

    .version-count {
      flex-shrink: 0;
      padding: 2px 10px;
      font-size: 12px;
      font-weight: 500;
      color: var(--card-accent-pill-text);
      background: var(--card-accent-pill-bg);
      border-radius: 999px;
    }

    &__body {
      display: flex;
      flex-direction: column;
      gap: 14px;
      align-items: stretch;
      padding: 14px 16px 16px;
    }
  }

  .version-tables {
    display: flex;
    font-size: 13px;

    /* 超过阈值时左右两列：等分，列间距 14px */
    &.is-split {
      gap: 12px;
    }

    .version-table-col {
      flex: 1;
      min-width: 0;
    }

    /* 行分隔线 + 行悬停高亮 */
    :deep(.el-table__body tr.el-table__row > td.el-table__cell) {
      border-bottom: 1px solid var(--el-border-color-lighter);
      transition: background-color 0.2s ease;
    }

    :deep(.el-table__body tr.el-table__row:last-child > td.el-table__cell) {
      border-bottom: none;
    }

    :deep(.el-table__body tr.el-table__row:hover > td.el-table__cell) {
      background-color: var(--el-fill-color-light);
    }

    .col-price {
      justify-self: start;
      // font-weight: 600;
      color: var(--el-text-color-primary);
      white-space: nowrap;

      .price-estimate-tag {
        margin-left: 4px;
        color: #aaa;
        // display: block;
      }
    }

    .col-date {
      color: var(--el-text-color-secondary);
    }
  }

  .price-change {
    display: inline-flex;
    gap: 2px;
    align-items: center;
    font-size: 12px;

    .arrow-icon {
      font-size: 12px;
      font-style: normal;
    }

    &.is-up {
      color: #f56c6c;
    }

    &.is-down {
      color: #67c23a;
    }

    &.is-flat {
      color: var(--el-text-color-placeholder);
    }
  }

  .chart-stats {
    display: flex;
    gap: 16px;
    align-items: center;
    padding: 12px 14px;
    background: var(--el-fill-color-light);
    border-radius: 10px;

    :deep(.price-history-bar-chart) {
      flex: 1;
      min-width: 0;
    }
  }

  .stats-list {
    flex-shrink: 0;
    width: 180px;
    padding: 0 0 0 14px;
    margin: 0;
    list-style: none;
    border-left: 1px solid var(--el-border-color-lighter);

    li {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 5px 0;
      font-size: 13px;
    }

    .stats-label {
      color: var(--el-text-color-secondary);
    }

    .stats-value {
      font-weight: 600;
      color: var(--el-text-color-primary);

      &.is-avg {
        color: var(--card-accent-strong);
      }
    }
  }

  @media (width <= 768px) {
    .chart-stats {
      flex-direction: column;
      align-items: stretch;
    }

    .stats-list {
      width: 100%;
      padding: 12px 0 0;
      border-top: 1px solid var(--el-border-color-lighter);
      border-left: none;
    }

    /* 窄屏回退为上下单列 */
    .version-tables.is-split {
      flex-direction: column;
    }
  }
</style>

<style lang="scss">
  @use '../styles/channel-tag';
</style>
