<!-- 卡片展示：sc-zone 模式对齐原型 sc-zones-row + kpi-grid.sc-zone；default 模式为通用自适应网格 -->
<template>
  <div class="card-items" :class="{ 'is-sc-zone': variant === 'sc-zone' }">
    <div class="sc-zones-row">
      <template v-for="(rg, gi) in visibleGroups" :key="rg.group.key">
        <section class="sc-zone-col">
          <div class="kpi-grid" :class="{ 'sc-zone': variant === 'sc-zone' }">
            <!-- sc-zone：plain div，对齐原型 HTML -->
            <template v-if="variant === 'sc-zone'">
              <div
                v-for="m in rg.items"
                :key="m.key"
                class="kpi-card"
                :class="{ 'is-active': isCardActive(m.key) }"
                @click="onCardClick(m)"
              >
                <div class="kpi-head">
                  <slot name="header" :metric="m" :group="rg.group">
                    <TableHeaderTip
                      v-if="m.tooltip"
                      class="kpi-label"
                      :label="m.label"
                      :tip="m.tooltip"
                    />
                    <span v-else class="kpi-label" :title="m.label">{{ m.label }}</span>
                  </slot>
                </div>
                <div v-if="$slots.value" class="kpi-val-row">
                  <slot name="value" :metric="m" :group="rg.group" />
                </div>
                <div class="kpi-split">
                  <slot :metric="m" :group="rg.group">
                    <span class="ci-card-placeholder">-</span>
                  </slot>
                </div>
              </div>
            </template>
            <!-- default：el-card 通用模式 -->
            <template v-else>
              <el-card
                v-for="m in rg.items"
                :key="m.key"
                class="ci-card kpi-card"
                :class="{ 'is-active': isCardActive(m.key) }"
                shadow="hover"
                @click="onCardClick(m)"
              >
                <template #header>
                  <div class="ci-card-head kpi-head">
                    <slot name="header" :metric="m" :group="rg.group">
                      <TableHeaderTip
                        v-if="m.tooltip"
                        class="ci-card-label"
                        :label="m.label"
                        :tip="m.tooltip"
                      />
                      <span v-else class="ci-card-label" :title="m.label">{{ m.label }}</span>
                    </slot>
                  </div>
                  <div v-if="$slots.value" class="ci-card-value kpi-val-row">
                    <slot name="value" :metric="m" :group="rg.group" />
                  </div>
                </template>
                <div class="ci-card-body kpi-split">
                  <slot :metric="m" :group="rg.group">
                    <span class="ci-card-placeholder">-</span>
                  </slot>
                </div>
              </el-card>
            </template>
          </div>
        </section>
        <div
          v-if="variant !== 'sc-zone' && gi < visibleGroups.length - 1"
          class="sc-zone-sep"
          aria-hidden="true"
        ></div>
      </template>

      <div v-if="!visibleGroups.length" class="ci-empty">暂无展示指标，请点击设置选择</div>
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
  }

  const props = withDefaults(defineProps<Props>(), {
    variant: 'default'
  })

  const isCardActive = (key: string): boolean => {
    if (props.activeKeys?.length) return props.activeKeys.includes(key)
    return props.activeKey === key
  }

  const emit = defineEmits<{
    (e: 'card-click', metric: CardMetric): void
    (e: 'update:activeKey', key: string): void
  }>()

  const visibleGroups = computed(() => resolveVisibleCards(props.groups, props.layout))

  const onCardClick = (m: CardMetric): void => {
    emit('card-click', m)
    emit('update:activeKey', m.key)
  }

  defineExpose({ visibleGroups })
</script>

<style lang="scss" scoped>
  .card-items {
    container-type: inline-size;
    width: 100%;
  }

  /* ---------- default 模式 ---------- */
  .card-items:not(.is-sc-zone) .sc-zones-row {
    display: flex;
    gap: 24px;
    align-items: stretch;
    width: 100%;
  }

  .sc-zone-col {
    flex: 1 1 0;
    min-width: 0;
  }

  .card-items:not(.is-sc-zone) .kpi-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
    gap: 5px;
  }

  .sc-zone-sep {
    position: relative;
    flex: 0 0 2px;
    align-self: stretch;
    background: linear-gradient(
      180deg,
      transparent 0%,
      var(--el-border-color) 12%,
      var(--el-border-color-dark) 50%,
      var(--el-border-color) 88%,
      transparent 100%
    );
    border-radius: 2px;

    &::after {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 6px;
      height: 6px;
      content: '';
      background: var(--el-bg-color);
      border: 1.5px solid var(--el-border-color-dark);
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }
  }

  .ci-card {
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
      border-color: var(--el-color-primary-light-5);
    }
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

  @container (max-width: 680px) {
    .card-items:not(.is-sc-zone) .sc-zones-row {
      flex-direction: column;
      gap: 12px;
    }

    .card-items:not(.is-sc-zone) .sc-zone-sep {
      display: none;
    }
  }

  /* ---------- sc-zone 模式（对齐原型 HTML 396-504 行） ---------- */
  .card-items.is-sc-zone .sc-zones-row {
    position: relative;
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 24px;
    margin-bottom: 0;

    &::before {
      position: absolute;
      top: -2px;
      bottom: -2px;
      left: 50%;
      width: 2px;
      pointer-events: none;
      content: '';
      background: linear-gradient(
        180deg,
        transparent 0%,
        #cbd5e1 12%,
        #94a3b8 50%,
        #cbd5e1 88%,
        transparent 100%
      );
      border-radius: 2px;
      transform: translateX(-50%);
    }

    &::after {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 6px;
      height: 6px;
      pointer-events: none;
      content: '';
      background: #fff;
      border: 1.5px solid #94a3b8;
      border-radius: 50%;
      transform: translate(-50%, -50%);
    }
  }

  .card-items.is-sc-zone .sc-zone-col {
    min-width: 0;
    padding: 0;
    background: transparent;
    border: 0;
  }

  .card-items.is-sc-zone .kpi-grid.sc-zone {
    display: flex;
    flex-wrap: nowrap;
    gap: 5px;
    margin-bottom: 0;
  }

  .card-items.is-sc-zone .kpi-grid.sc-zone .kpi-card {
    flex: 1 1 0;
    min-width: 0;
  }

  .card-items.is-sc-zone .kpi-card {
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

    /* 原型：指标单行 5 列，禁止自动换行 */
    .card-items.is-sc-zone .kpi-grid.sc-zone {
      display: flex;
      flex-wrap: nowrap;
      gap: 5px;
    }

    .card-items.is-sc-zone .kpi-grid.sc-zone .kpi-card {
      flex: 1 1 0;
      min-width: 0;
    }
  }

  @media (width <= 900px) {
    .card-items.is-sc-zone .sc-zones-row {
      grid-template-columns: 1fr;
      gap: 10px;

      &::before,
      &::after {
        display: none;
      }
    }

    .card-items.is-sc-zone .kpi-grid.sc-zone {
      display: flex;
      flex-wrap: nowrap;
    }
  }
</style>
