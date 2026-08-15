<!-- 季度范围选择（双年面板 Q1–Q4，输出季度起止 YYYY-MM-DD） -->
<template>
  <ElPopover
    v-model:visible="panelVisible"
    class="period-quarter-range-picker"
    placement="bottom-start"
    :width="520"
    trigger="click"
    popper-class="period-quarter-range-popper"
    @show="onPanelShow"
  >
    <template #reference>
      <div
        class="period-quarter-range-trigger el-date-editor el-date-editor--daterange el-input--small"
        :class="{ 'is-active': panelVisible }"
      >
        <ElIcon class="el-input__icon"><Calendar /></ElIcon>
        <span class="el-range-input" :class="{ 'is-placeholder': !displayStart }">{{
          displayStart || startPlaceholder
        }}</span>
        <span class="el-range-separator"> - </span>
        <span class="el-range-input" :class="{ 'is-placeholder': !displayEnd }">{{
          displayEnd || endPlaceholder
        }}</span>
        <ElIcon
          v-if="clearable && modelValue?.length === 2"
          class="el-input__icon el-range__close-icon"
          @click.stop="handleClear"
        >
          <CircleClose />
        </ElIcon>
      </div>
    </template>

    <div class="period-quarter-panel">
      <div v-for="(year, colIdx) in panelYears" :key="year" class="period-quarter-panel__col">
        <div class="period-quarter-panel__header">
          <ElButton
            v-if="colIdx === 0"
            link
            :icon="DArrowLeft"
            class="period-quarter-panel__nav"
            @click="shiftPanelYear(-1)"
          />
          <span class="period-quarter-panel__year">{{ year }}年</span>
          <ElButton
            v-if="colIdx === 1"
            link
            :icon="DArrowRight"
            class="period-quarter-panel__nav"
            @click="shiftPanelYear(1)"
          />
        </div>
        <div class="period-quarter-panel__quarters">
          <button
            v-for="q in 4"
            :key="`${year}-${q}`"
            type="button"
            class="period-quarter-panel__q"
            :class="getQuarterCellClass(year, q)"
            :disabled="isQuarterDisabled(year, q)"
            @click="onPickQuarter(year, q)"
          >
            Q{{ q }}
          </button>
        </div>
      </div>
    </div>
  </ElPopover>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import dayjs from 'dayjs'
  import quarterOfYear from 'dayjs/plugin/quarterOfYear'
  import { Calendar, CircleClose, DArrowLeft, DArrowRight } from '@element-plus/icons-vue'

  dayjs.extend(quarterOfYear)

  interface QuarterPoint {
    year: number
    quarter: number
  }

  interface Props {
    modelValue?: string[]
    clearable?: boolean
    startPlaceholder?: string
    endPlaceholder?: string
    /** 最大可选跨度（季度数），选定起点后超出部分置灰；0/未传表示不限制 */
    maxRange?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    clearable: true,
    startPlaceholder: '开始季度',
    endPlaceholder: '结束季度',
    maxRange: 0
  })

  const emit = defineEmits<{
    'update:modelValue': [value: string[]]
    change: [value: string[]]
  }>()

  const panelVisible = ref(false)
  const panelBaseYear = ref(dayjs().year())
  const rangeStart = ref<QuarterPoint | null>(null)
  const rangeEnd = ref<QuarterPoint | null>(null)
  const pickingEnd = ref(false)

  const panelYears = computed(() => [panelBaseYear.value, panelBaseYear.value + 1])

  const formatQuarterLabel = (point: QuarterPoint | null) => {
    if (!point) return ''
    return `${point.year}-Q${point.quarter}`
  }

  const displayStart = computed(() => formatQuarterLabel(rangeStart.value))
  const displayEnd = computed(() => formatQuarterLabel(rangeEnd.value))

  const quarterOrder = (a: QuarterPoint, b: QuarterPoint) => {
    if (a.year !== b.year) return a.year - b.year
    return a.quarter - b.quarter
  }

  const parseDateToQuarter = (dateStr?: string): QuarterPoint | null => {
    if (!dateStr) return null
    const d = dayjs(dateStr)
    if (!d.isValid()) return null
    return { year: d.year(), quarter: d.quarter() }
  }

  const syncFromModel = (val?: string[]) => {
    if (val?.[0] && val?.[1]) {
      const startQ = parseDateToQuarter(val[0])
      const endQ = parseDateToQuarter(val[1])
      if (startQ && endQ && quarterOrder(startQ, endQ) > 0) {
        rangeStart.value = endQ
        rangeEnd.value = startQ
      } else {
        rangeStart.value = startQ
        rangeEnd.value = endQ
      }
      pickingEnd.value = false
      if (rangeStart.value) {
        panelBaseYear.value = rangeStart.value.year
      }
    } else {
      rangeStart.value = null
      rangeEnd.value = null
      pickingEnd.value = false
    }
  }

  watch(
    () => props.modelValue,
    (val) => syncFromModel(val),
    { immediate: true, deep: true }
  )

  const quarterToDateRange = (start: QuarterPoint, end: QuarterPoint): string[] => {
    const orderedStart = quarterOrder(start, end) <= 0 ? start : end
    const orderedEnd = quarterOrder(start, end) <= 0 ? end : start
    return [
      dayjs()
        .year(orderedStart.year)
        .quarter(orderedStart.quarter)
        .startOf('quarter')
        .format('YYYY-MM-DD'),
      dayjs()
        .year(orderedEnd.year)
        .quarter(orderedEnd.quarter)
        .endOf('quarter')
        .format('YYYY-MM-DD')
    ]
  }

  const emitValue = (value: string[]) => {
    emit('update:modelValue', value)
    emit('change', value)
  }

  const onPanelShow = () => {
    if (rangeStart.value) {
      panelBaseYear.value = rangeStart.value.year
    } else {
      panelBaseYear.value = dayjs().year()
    }
  }

  const shiftPanelYear = (delta: number) => {
    panelBaseYear.value += delta
  }

  const isQuarterInRange = (year: number, quarter: number) => {
    if (!rangeStart.value || !rangeEnd.value) return false
    const cur: QuarterPoint = { year, quarter }
    return quarterOrder(cur, rangeStart.value) >= 0 && quarterOrder(cur, rangeEnd.value) <= 0
  }

  /** 选定起点后，距起点超出最大跨度的季度置灰 */
  const isQuarterDisabled = (year: number, quarter: number) => {
    if (!props.maxRange || !pickingEnd.value || !rangeStart.value) return false
    const diff = Math.abs(
      year * 4 + quarter - (rangeStart.value.year * 4 + rangeStart.value.quarter)
    )
    return diff > props.maxRange - 1
  }

  const getQuarterCellClass = (year: number, quarter: number) => {
    const classes: string[] = []
    if (
      rangeStart.value &&
      rangeStart.value.year === year &&
      rangeStart.value.quarter === quarter
    ) {
      classes.push('is-start')
    }
    if (rangeEnd.value && rangeEnd.value.year === year && rangeEnd.value.quarter === quarter) {
      classes.push('is-end')
    }
    if (isQuarterInRange(year, quarter)) {
      classes.push('in-range')
    }
    if (isQuarterDisabled(year, quarter)) {
      classes.push('is-disabled')
    }
    return classes
  }

  const onPickQuarter = (year: number, quarter: number) => {
    if (isQuarterDisabled(year, quarter)) return
    const picked: QuarterPoint = { year, quarter }
    if (!pickingEnd.value || !rangeStart.value) {
      rangeStart.value = picked
      rangeEnd.value = null
      pickingEnd.value = true
      return
    }
    rangeEnd.value = picked
    pickingEnd.value = false
    emitValue(quarterToDateRange(rangeStart.value, rangeEnd.value))
    panelVisible.value = false
  }

  const handleClear = () => {
    rangeStart.value = null
    rangeEnd.value = null
    pickingEnd.value = false
    emitValue([])
  }
</script>

<style lang="scss" scoped>
  .period-quarter-range-picker {
    display: inline-flex;
    flex: 1;
    min-width: 0;
    vertical-align: top;

    :deep(.el-popover__reference) {
      display: flex;
      flex: 1;
      width: 100%;
      min-width: 0;
    }
  }

  .period-quarter-range-trigger {
    position: relative;
    box-sizing: border-box;
    display: inline-flex;
    flex: 1;
    align-items: center;
    width: 100%;
    min-width: 0;
    height: var(--el-component-size-small);
    min-height: var(--el-component-size-small);
    padding: 0 24px 0 28px;
    margin-left: -1px;
    cursor: pointer;
    background: var(--el-fill-color-blank);
    border: 1px solid var(--el-border-color);
    border-radius: 0 var(--el-border-radius-base) var(--el-border-radius-base) 0;

    &.is-active {
      border-color: var(--el-color-primary);
    }

    .el-input__icon {
      position: absolute;
      left: 8px;
      font-size: 14px;
      color: var(--el-text-color-placeholder);
    }

    .el-range__close-icon {
      right: 4px;
      left: auto;
      cursor: pointer;

      &:hover {
        color: var(--el-text-color-secondary);
      }
    }

    .el-range-input {
      flex: 1;
      margin-top: 4px;
      overflow: hidden;
      font-size: 12px;
      line-height: calc(var(--el-component-size-small) - 2px);
      color: var(--el-text-color-regular);
      text-align: center;
      text-overflow: ellipsis;
      white-space: nowrap;

      &.is-placeholder {
        color: var(--el-text-color-placeholder);
      }
    }

    .el-range-separator {
      flex: none;
      padding: 0 4px;
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }

  .period-quarter-panel {
    display: flex;
    gap: 16px;
    padding: 8px 4px 12px;

    &__col {
      flex: 1;
      min-width: 0;
    }

    &__header {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 32px;
      margin-bottom: 8px;
    }

    &__year {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-primary);
      text-align: center;
    }

    &__nav {
      flex: none;
      padding: 4px;
      color: var(--el-text-color-secondary);
    }

    &__quarters {
      display: flex;
      gap: 8px;
      justify-content: center;
    }

    &__q {
      flex: 1;
      max-width: 56px;
      height: 36px;
      padding: 0;
      font-size: 13px;
      color: var(--el-text-color-regular);
      cursor: pointer;
      background: transparent;
      border: none;
      border-radius: var(--el-border-radius-base);
      transition: background-color 0.15s;

      &:hover {
        color: var(--el-color-primary);
        background: var(--el-fill-color-light);
      }

      &.in-range {
        color: var(--el-color-primary);
        background: var(--el-color-primary-light-9);
      }

      &.is-start,
      &.is-end {
        color: #fff;
        background: var(--el-color-primary);
      }

      &.is-disabled,
      &:disabled {
        color: var(--el-text-color-disabled);
        cursor: not-allowed;
        background: transparent;

        &:hover {
          color: var(--el-text-color-disabled);
          background: transparent;
        }
      }
    }
  }
</style>

<style lang="scss">
  .period-quarter-range-popper {
    padding: 4px 12px 8px !important;
  }
</style>
