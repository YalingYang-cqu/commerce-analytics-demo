<!-- 卡片展示：不分组，所有已选指标平铺为单行（可换行），每张卡片宽度 = 12.5% 减去间隔（一行 8 个） -->
<template>
  <div class="card-items" :class="{ 'is-sc-zone': variant === 'sc-zone' }">
    <div class="ci-flat-row">
      <!-- sc-zone：plain div，对齐原型 HTML -->
      <template v-if="variant === 'sc-zone'">
        <div
          v-for="c in visibleCards"
          :key="c.metric.key"
          class="kpi-card"
          :class="{
            'is-active': showActive(c.metric.key) && !showFilterActive(c.metric.key),
            'is-filter-active': showFilterActive(c.metric.key),
            'is-static': !isClickable(c.metric.key)
          }"
          @click="onCardClick(c.metric)"
        >
          <span v-if="activeBadge && showActive(c.metric.key)" class="ci-active-badge">{{
            activeBadge
          }}</span>
          <div class="kpi-head">
            <slot name="header" :metric="c.metric" :group="c.group">
              <TableHeaderTip
                v-if="c.metric.tooltip"
                class="kpi-label"
                :label="c.metric.label"
                :tip="c.metric.tooltip"
              />
              <span v-else class="kpi-label" :title="c.metric.label">{{ c.metric.label }}</span>
            </slot>
          </div>
          <div v-if="$slots.value" class="kpi-val-row">
            <slot name="value" :metric="c.metric" :group="c.group" />
          </div>
          <div class="kpi-split">
            <slot :metric="c.metric" :group="c.group">
              <span class="ci-card-placeholder">-</span>
            </slot>
          </div>
        </div>
      </template>
      <!-- default：el-card 通用模式 -->
      <template v-else>
        <el-card
          v-for="c in visibleCards"
          :key="c.metric.key"
          class="ci-card kpi-card"
          :class="{
            'is-active': showActive(c.metric.key) && !showFilterActive(c.metric.key),
            'is-filter-active': showFilterActive(c.metric.key),
            'is-static': !isClickable(c.metric.key)
          }"
          :shadow="isClickable(c.metric.key) ? 'hover' : 'never'"
          @click="onCardClick(c.metric)"
        >
          <span v-if="activeBadge && showActive(c.metric.key)" class="ci-active-badge">{{
            activeBadge
          }}</span>
          <template #header>
            <div class="ci-card-head kpi-head">
              <slot name="header" :metric="c.metric" :group="c.group">
                <TableHeaderTip
                  v-if="c.metric.tooltip"
                  class="ci-card-label"
                  :label="c.metric.label"
                  :tip="c.metric.tooltip"
                />
                <span v-else class="ci-card-label" :title="c.metric.label">{{
                  c.metric.label
                }}</span>
              </slot>
            </div>
            <div v-if="$slots.value" class="ci-card-value kpi-val-row">
              <slot name="value" :metric="c.metric" :group="c.group" />
            </div>
          </template>
          <div class="ci-card-body kpi-split">
            <slot :metric="c.metric" :group="c.group">
              <span class="ci-card-placeholder">-</span>
            </slot>
          </div>
        </el-card>
      </template>

      <div v-if="!visibleCards.length" class="ci-empty">暂无展示指标，请点击设置选择</div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import TableHeaderTip from '@/components/core/tables/table-header-tip/index.vue'
  import {
    type CardGroup,
    type CardMetric,
    type CardLayoutState,
    resolveVisibleCards
  } from '../types'

  defineOptions({ name: 'CardItems' })

  interface Props {
    groups: CardGroup[]
    layout: CardLayoutState
    activeKey?: string
    activeKeys?: string[]
    /** sc-zone：销量统计实时概况（对齐原型 HTML）；default：通用自适应 */
    variant?: 'default' | 'sc-zone'
    /** 选中(active)卡片右上角徽标文案（如「趋势」）；为空则不显示 */
    activeBadge?: string
    /** 卡片是否可点击选择；false 时无点击/悬浮态且不高亮选中 */
    clickable?: boolean
    /** 仅这些 key 可点击（优先于 clickable，用于订单维度只放开明细筛选卡片） */
    clickableKeys?: string[]
    /** 处于明细筛选选中态的卡片 key：显示红色筛选态(而非蓝色对比态)且不显示徽标 */
    filterActiveKeys?: string[]
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: 'default',
    clickable: true
  })

  /** 单卡是否可点击：给了 clickableKeys 则按白名单，否则回退到 clickable 开关 */
  const isClickable = (key: string): boolean =>
    props.clickableKeys ? props.clickableKeys.includes(key) : props.clickable

  /** 是否处于明细筛选选中态（红色，优先于蓝色对比态） */
  const showFilterActive = (key: string): boolean =>
    isClickable(key) && !!props.filterActiveKeys?.includes(key)

  const isCardActive = (key: string): boolean => {
    if (props.activeKeys?.length) return props.activeKeys.includes(key)
    return props.activeKey === key
  }
  /** 不可点击时不展示选中态（避免误导：无法选择却显示高亮/徽标） */
  const showActive = (key: string): boolean => isClickable(key) && isCardActive(key)

  const emit = defineEmits<{
    (e: 'card-click', metric: CardMetric): void
    (e: 'update:activeKey', key: string): void
  }>()

  /** 不分组：把各组已选指标拍平为单一卡片列表（保留所属分组，供插槽使用） */
  const visibleCards = computed<{ metric: CardMetric; group: CardGroup }[]>(() =>
    resolveVisibleCards(props.groups, props.layout).flatMap((rg) =>
      rg.items.map((metric) => ({ metric, group: rg.group }))
    )
  )

  const onCardClick = (m: CardMetric): void => {
    if (!isClickable(m.key)) return
    emit('card-click', m)
    emit('update:activeKey', m.key)
  }

  defineExpose({ visibleCards })
</script>

<style lang="scss" scoped>
  .card-items {
    container-type: inline-size;
    width: 100%;
  }

  /* 不分组：单行平铺，可换行。间隔 12px，每张卡片宽度 = 12.5% - 间隔（一行 8 个） */
  .ci-flat-row {
    display: flex;
    flex-wrap: wrap;
    gap: 12px;
    align-items: stretch;
    width: 100%;
  }

  .ci-flat-row > .kpi-card,
  .ci-flat-row > .ci-card {
    box-sizing: border-box;
    flex: 0 0 calc(12.5% - 12px);
    min-width: 0;
    max-width: calc(12.5% - 12px);
  }

  .ci-card {
    position: relative;
    min-width: 0;
    cursor: pointer;
    border-radius: 7px;
    transition: all 0.2s;

    :deep(.el-card__header) {
      padding: 7px 8px 0;
      border-bottom: none;
    }

    :deep(.el-card__body) {
      padding: 5px 8px 7px;
    }

    &.is-active {
      background: var(--el-color-primary-light-9);
      border-color: var(--el-color-primary);
    }

    /* 订单明细筛选选中态：红边淡红底 */
    &.is-filter-active {
      background: #fff7f7;
      border-color: #ef4444;
    }

    &.is-static {
      cursor: default;
    }
  }

  /* 选中卡片右上角徽标（如「趋势」）：内嵌淡蓝药丸、蓝字 */
  .ci-active-badge {
    position: absolute;
    top: 5px;
    right: 5px;
    z-index: 1;
    padding: 0 7px;
    font-size: 10px;
    font-weight: 600;
    line-height: 16px;
    color: var(--el-color-primary, #2f6bff);
    background: var(--el-color-primary-light-9, #eef3ff);
    border: 1px solid var(--el-color-primary-light-7, #c6d9ff);
    border-radius: 9px;
  }

  .ci-card-head {
    display: flex;
    gap: 3px;
    align-items: center;
    margin-bottom: 3px;

    .ci-card-label {
      overflow: hidden;
      font-size: 11px;
      color: var(--art-gray-600, #909399);
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .ci-card-value {
    min-width: 0;
  }

  .ci-card-body {
    min-width: 0;
    padding-top: 4px;
    border-top: 1px dashed var(--el-border-color-lighter);

    .ci-card-placeholder {
      font-size: 12px;
      font-weight: 600;
      color: var(--art-gray-900, #303133);
    }
  }

  .ci-empty {
    flex: 1;
    padding: 24px 0;
    font-size: 13px;
    color: var(--art-gray-500, #909399);
    text-align: center;
  }

  /* ---------- sc-zone 卡片样式（对齐原型 kpi-card 外观） ---------- */
  .card-items.is-sc-zone .kpi-card {
    position: relative;
    min-width: 0;
    padding: 7px 8px;
    cursor: pointer;
    background: #fff;
    border: 1px solid #e1e8f5;
    border-radius: 7px;
    transition:
      border-color 0.15s,
      box-shadow 0.15s;

    &:hover {
      border-color: #b8caf5;
    }

    &.is-active {
      border-color: #2f6bff;
      box-shadow: 0 0 0 2px rgb(47 107 255 / 10%);
    }

    /* 订单明细筛选选中态：红边淡红底 */
    &.is-filter-active {
      background: #fff7f7;
      border-color: #ef4444;
    }

    &.is-static {
      cursor: default;

      &:hover {
        border-color: #e1e8f5;
      }
    }
  }

  .card-items.is-sc-zone .kpi-head {
    display: flex;
    gap: 3px;
    align-items: center;
    min-width: 0;
    margin-bottom: 3px;
  }

  .card-items.is-sc-zone .kpi-label {
    min-width: 0;
    overflow: hidden;
    font-size: 10.5px;
    font-weight: 500;
    color: #667085;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .card-items.is-sc-zone .kpi-val-row {
    display: flex;
    gap: 5px;
    align-items: baseline;
    min-width: 0;
    margin-bottom: 5px;
    overflow: hidden;
    white-space: nowrap;
  }

  .card-items.is-sc-zone .kpi-split {
    display: flex;
    flex-direction: column;
    gap: 2px;
    padding-top: 4px;
    margin-top: 0;
    border-top: 1px dashed #e8edf3;
  }

  @media (width <= 1366px) {
    .card-items.is-sc-zone .kpi-card {
      padding: 6px 7px;
    }
  }

  @media (width <= 1180px) {
    .card-items.is-sc-zone .kpi-card {
      padding: 6px 7px;
    }
  }
</style>
