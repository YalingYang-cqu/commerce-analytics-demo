<!-- 周范围选择（参照 web-business MK_UI/date-picker 周区间组件） -->
<template>
  <ElPopover
    v-model:visible="panelVisible"
    class="period-week-range-picker"
    placement="bottom-start"
    :width="646"
    trigger="click"
    popper-class="period-week-range-popper"
    @show="onPanelShow"
    @hide="onPanelHide"
  >
    <template #reference>
      <div
        class="period-week-range-trigger el-date-editor el-date-editor--daterange el-input--small"
        :class="{ 'is-active': panelVisible }"
      >
        <ElIcon class="el-input__icon"><Calendar /></ElIcon>
        <span class="el-range-input" :class="{ 'is-placeholder': !displayStart }">{{
          displayStart || startPlaceholder
        }}</span>
        <span class="el-range-separator">→</span>
        <span class="el-range-input" :class="{ 'is-placeholder': !displayEnd }">{{
          displayEnd || endPlaceholder
        }}</span>
        <ElIcon
          v-if="clearable && innerValue.length === 2"
          class="el-input__icon el-range__close-icon"
          @click.stop="handleClear"
        >
          <CircleClose />
        </ElIcon>
      </div>
    </template>

    <WeekRangePanel
      ref="panelRef"
      :model-value="panelDates"
      :unlink-panels="unlinkPanels"
      :disabled-date="disabledDateFn"
      :max-range="maxRange"
      :first-day-of-week="firstDayOfWeek"
      @pick="onPanelPick"
    />
  </ElPopover>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import dayjs from 'dayjs'
  import isoWeek from 'dayjs/plugin/isoWeek'
  import { Calendar, CircleClose } from '@element-plus/icons-vue'
  import WeekRangePanel from './week-range-panel.vue'
  import { formatWeekDisplay, normalizeIsoWeekRange } from './utils'

  dayjs.extend(isoWeek)

  interface Props {
    modelValue?: string[]
    clearable?: boolean
    startPlaceholder?: string
    endPlaceholder?: string
    datePickerProps?: Record<string, unknown>
    /** 最大可选跨度（周数），选定起点后超出部分置灰；0/未传表示不限制 */
    maxRange?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    clearable: true,
    startPlaceholder: '开始周',
    endPlaceholder: '结束周',
    datePickerProps: () => ({}),
    maxRange: 0
  })

  const emit = defineEmits<{
    'update:modelValue': [value: string[]]
    change: [value: string[]]
  }>()

  const panelVisible = ref(false)
  const panelRef = ref<InstanceType<typeof WeekRangePanel>>()
  const innerValue = ref<string[]>([])

  const unlinkPanels = computed(
    () => (props.datePickerProps?.unlinkPanels as boolean | undefined) !== false
  )

  const firstDayOfWeek = computed(
    () => (props.datePickerProps?.firstDayOfWeek as number | undefined) ?? 1
  )

  const disabledDateFn = computed(
    () => props.datePickerProps?.disabledDate as ((date: Date) => boolean) | undefined
  )

  const displayStart = computed(() =>
    innerValue.value[0] ? formatWeekDisplay(innerValue.value[0]) : ''
  )
  const displayEnd = computed(() =>
    innerValue.value[1] ? formatWeekDisplay(innerValue.value[1]) : ''
  )

  const panelDates = computed(() => {
    if (innerValue.value.length !== 2) return []
    return innerValue.value.map((d) => new Date(d))
  })

  const emitValue = (value: string[]) => {
    emit('update:modelValue', value)
    emit('change', value)
  }

  watch(
    () => props.modelValue,
    (val) => {
      innerValue.value = val?.length === 2 ? [...val] : []
    },
    { immediate: true, deep: true }
  )

  const onPanelShow = () => {
    panelRef.value?.resetView?.()
  }

  const onPanelHide = () => {
    panelRef.value?.resetView?.()
  }

  const onPanelPick = (dates: Date[]) => {
    if (!dates?.[0] || !dates?.[1]) return
    const normalized = normalizeIsoWeekRange(dates[0], dates[1])
    innerValue.value = normalized
    emitValue(normalized)
    panelVisible.value = false
  }

  const handleClear = () => {
    innerValue.value = []
    emitValue([])
  }
</script>

<style lang="scss" scoped>
  .period-week-range-picker {
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

  .period-week-range-trigger {
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
      padding: 0 6px;
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }
  }
</style>

<style lang="scss">
  .period-week-range-popper {
    padding: 0 !important;
    border: none !important;
    box-shadow: var(--el-box-shadow-light) !important;
  }

  .period-week-range-panel-inner {
    position: static !important;
    width: 646px;
    margin: 0;
    border: none;
    box-shadow: none;

    .el-picker-panel__body {
      min-width: 646px;
    }

    .el-date-range-picker__content {
      box-sizing: border-box;
      width: 50%;
      padding: 8px 12px 12px;
    }

    .el-date-range-picker__header {
      display: flex;
      align-items: center;
      height: 28px;
      margin-bottom: 8px;
      line-height: 28px;
    }

    .el-date-range-picker__header-label {
      flex: 1;
      font-size: 14px;
      font-weight: 500;
      color: var(--el-text-color-regular);
      text-align: center;
      cursor: default;
    }

    .el-picker-panel__icon-btn {
      margin-top: 0;
      font-size: 12px;
      color: var(--el-text-color-secondary);
    }

    .el-date-table__header {
      width: 100%;
      margin-bottom: 4px;
      border-collapse: collapse;

      th {
        padding: 4px 0;
        font-size: 12px;
        font-weight: 400;
        color: var(--el-text-color-regular);
        text-align: center;
      }

      th:first-child {
        width: 32px;
      }
    }

    .el-date-table {
      width: 100%;
      border-collapse: collapse;

      td {
        padding: 2px 0;
        text-align: center;
        cursor: pointer;
      }

      td.week {
        width: 32px;
        font-size: 12px;
        color: var(--el-text-color-secondary);
        vertical-align: middle;
        cursor: pointer;
      }

      .el-date-table-cell {
        display: block;
        width: 28px;
        height: 24px;
        margin: 0 auto;
        line-height: 24px;
      }

      .el-date-table-cell__text {
        font-size: 12px;
      }

      td.prev-month,
      td.next-month {
        .el-date-table-cell__text {
          color: var(--el-text-color-placeholder);
        }
      }

      td.today .el-date-table-cell__text {
        font-weight: 700;
        color: var(--el-color-primary);
      }

      td.disabled {
        cursor: not-allowed;

        .el-date-table-cell__text {
          color: var(--el-text-color-disabled);
        }
      }

      /* 中间周：整行浅蓝 */
      td.in-range,
      td.week.in-range {
        background: var(--el-color-primary-light-9) !important;

        .el-date-table-cell__text {
          color: var(--el-color-primary) !important;
        }
      }

      td.week.in-range .el-date-table-cell__text {
        color: var(--el-text-color-regular) !important;
      }

      /* 起止周：整行深蓝（含周序号列） */
      td.start-date,
      td.end-date,
      td.week.start-date,
      td.week.end-date {
        background: var(--el-color-primary) !important;

        .el-date-table-cell__text {
          color: #fff !important;
        }
      }

      tr td.week.start-date {
        border-radius: 4px 0 0 4px;
      }

      tr td.end-date:last-child {
        border-radius: 0 4px 4px 0;
      }
    }
  }
</style>
