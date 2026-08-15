<!-- 周区间双月面板 -->
<template>
  <div
    class="el-picker-panel el-date-range-picker period-week-range-panel-inner"
    @mouseleave="onMouseLeave"
  >
    <div class="el-picker-panel__body-wrapper">
      <div class="el-picker-panel__body">
        <div class="el-date-range-picker__content is-left">
          <div class="el-date-range-picker__header">
            <button
              type="button"
              class="el-picker-panel__icon-btn d-arrow-left"
              @click="leftPrevYear"
            >
              <ElIcon><DArrowLeft /></ElIcon>
            </button>
            <button
              type="button"
              class="el-picker-panel__icon-btn arrow-left"
              @click="leftPrevMonth"
            >
              <ElIcon><ArrowLeft /></ElIcon>
            </button>
            <span role="button" class="el-date-range-picker__header-label">{{ leftLabel }}</span>
            <template v-if="!unlinkPanels">
              <button
                type="button"
                class="el-picker-panel__icon-btn arrow-right"
                @click="leftNextMonth"
              >
                <ElIcon><ArrowRight /></ElIcon>
              </button>
              <button
                type="button"
                class="el-picker-panel__icon-btn d-arrow-right"
                @click="leftNextYear"
              >
                <ElIcon><DArrowRight /></ElIcon>
              </button>
            </template>
          </div>
          <div class="el-picker-panel__content">
            <table class="el-date-table__header" cellspacing="0" cellpadding="0">
              <thead>
                <tr>
                  <th></th>
                  <th v-for="label in weekHeadLabels" :key="label">{{ label }}</th>
                </tr>
              </thead>
            </table>
            <WeekTable
              :year="leftYear"
              :month="leftMonth"
              :min-date="minDate"
              :max-date="maxDate"
              :range-state="rangeState"
              :hover-date="hoverDate"
              :first-day-of-week="firstDayOfWeek"
              :disabled-date="tableDisabledDate"
              @pick="onPick"
            />
          </div>
        </div>

        <div class="el-date-range-picker__content is-right">
          <div class="el-date-range-picker__header">
            <template v-if="unlinkPanels">
              <button
                type="button"
                class="el-picker-panel__icon-btn d-arrow-left"
                @click="rightPrevYear"
              >
                <ElIcon><DArrowLeft /></ElIcon>
              </button>
              <button
                type="button"
                class="el-picker-panel__icon-btn arrow-left"
                @click="rightPrevMonth"
              >
                <ElIcon><ArrowLeft /></ElIcon>
              </button>
            </template>
            <span role="button" class="el-date-range-picker__header-label">{{ rightLabel }}</span>
            <button
              type="button"
              class="el-picker-panel__icon-btn arrow-right"
              @click="rightNextMonth"
            >
              <ElIcon><ArrowRight /></ElIcon>
            </button>
            <button
              type="button"
              class="el-picker-panel__icon-btn d-arrow-right"
              @click="rightNextYear"
            >
              <ElIcon><DArrowRight /></ElIcon>
            </button>
          </div>
          <div class="el-picker-panel__content">
            <table class="el-date-table__header" cellspacing="0" cellpadding="0">
              <thead>
                <tr>
                  <th></th>
                  <th v-for="label in weekHeadLabels" :key="'r-' + label">{{ label }}</th>
                </tr>
              </thead>
            </table>
            <WeekTable
              :year="rightYear"
              :month="rightMonth"
              :min-date="minDate"
              :max-date="maxDate"
              :range-state="rangeState"
              :hover-date="hoverDate"
              :first-day-of-week="firstDayOfWeek"
              :disabled-date="tableDisabledDate"
              @pick="onPick"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import dayjs from 'dayjs'
  import isoWeek from 'dayjs/plugin/isoWeek'
  import { ArrowLeft, ArrowRight, DArrowLeft, DArrowRight } from '@element-plus/icons-vue'

  dayjs.extend(isoWeek)
  import WeekTable, { type WeekRangeState } from './week-table.vue'
  import {
    getWeekHeadLabels,
    getWeekStart,
    isWeekBefore,
    nextMonth,
    nextYear,
    prevMonth,
    prevYear
  } from './utils'

  const props = withDefaults(
    defineProps<{
      modelValue?: Date[]
      unlinkPanels?: boolean
      disabledDate?: (date: Date) => boolean
      firstDayOfWeek?: number
      /** 最大可选跨度（周数），选定起点后超出部分置灰；0 表示不限制 */
      maxRange?: number
    }>(),
    {
      modelValue: () => [],
      unlinkPanels: true,
      firstDayOfWeek: 1,
      maxRange: 0
    }
  )

  const emit = defineEmits<{
    pick: [dates: Date[]]
  }>()

  const leftDate = ref(new Date())
  const rightDate = ref(dayjs().add(1, 'month').toDate())
  const minDate = ref<Date | null>(null)
  const maxDate = ref<Date | null>(null)
  const hoverDate = ref<Date | null>(null)

  const rangeState = computed<WeekRangeState>(() => ({
    selecting: picking.value,
    startDate: minDate.value,
    endDate: maxDate.value
  }))

  const picking = ref(false)

  const weekHeadLabels = computed(() => getWeekHeadLabels(props.firstDayOfWeek))

  /**
   * 传给周历表的置灰函数：外部 disabledDate + 选中起点后的最大跨度限制
   * 依赖 picking/minDate 变化返回新函数引用，确保周历重新计算置灰
   */
  const tableDisabledDate = computed<(date: Date) => boolean>(() => {
    const ext = props.disabledDate
    const max = props.maxRange
    const anchor = picking.value ? minDate.value : null
    return (date: Date) => {
      if (ext?.(date)) return true
      if (max && anchor) {
        const weeks = Math.abs(dayjs(getWeekStart(date)).diff(dayjs(getWeekStart(anchor)), 'week'))
        return weeks > max - 1
      }
      return false
    }
  })

  const leftYear = computed(() => leftDate.value.getFullYear())
  const leftMonth = computed(() => leftDate.value.getMonth())
  const rightYear = computed(() => rightDate.value.getFullYear())
  const rightMonth = computed(() => rightDate.value.getMonth())

  const leftLabel = computed(() => `${leftYear.value} 年 ${leftMonth.value + 1} 月`)
  const rightLabel = computed(() => `${rightYear.value} 年 ${rightMonth.value + 1} 月`)

  const syncPanelsFromValue = (val?: Date[]) => {
    if (val?.[0] && val?.[1]) {
      minDate.value = getWeekStart(val[0])
      maxDate.value = getWeekStart(val[1])
      picking.value = false
      leftDate.value = new Date(minDate.value)
      rightDate.value = dayjs(minDate.value).add(1, 'month').toDate()
    } else {
      minDate.value = null
      maxDate.value = null
      picking.value = false
    }
  }

  watch(
    () => props.modelValue,
    (val) => syncPanelsFromValue(val),
    { immediate: true, deep: true }
  )

  const leftPrevYear = () => {
    leftDate.value = prevYear(leftDate.value)
    if (!props.unlinkPanels) rightDate.value = nextMonth(leftDate.value)
  }
  const leftNextYear = () => {
    leftDate.value = nextYear(leftDate.value)
    if (!props.unlinkPanels) rightDate.value = nextMonth(leftDate.value)
  }
  const leftPrevMonth = () => {
    leftDate.value = prevMonth(leftDate.value)
    if (!props.unlinkPanels) rightDate.value = nextMonth(leftDate.value)
  }
  const leftNextMonth = () => {
    leftDate.value = nextMonth(leftDate.value)
    if (!props.unlinkPanels) rightDate.value = nextMonth(leftDate.value)
  }

  const rightPrevYear = () => {
    rightDate.value = prevYear(rightDate.value)
  }
  const rightNextYear = () => {
    rightDate.value = nextYear(rightDate.value)
  }
  const rightPrevMonth = () => {
    rightDate.value = prevMonth(rightDate.value)
  }
  const rightNextMonth = () => {
    rightDate.value = nextMonth(rightDate.value)
  }

  const onPick = (date: Date) => {
    const weekStart = getWeekStart(date)
    if (!picking.value || !minDate.value) {
      minDate.value = weekStart
      maxDate.value = null
      picking.value = true
      return
    }
    maxDate.value = weekStart
    picking.value = false
    const start = minDate.value
    const end = maxDate.value
    if (isWeekBefore(end, start)) {
      emit('pick', [end, start])
    } else {
      emit('pick', [start, end])
    }
  }

  const onMouseLeave = () => {
    hoverDate.value = null
  }

  const resetView = () => {
    syncPanelsFromValue(props.modelValue)
    if (!props.modelValue?.length) {
      const now = new Date()
      leftDate.value = now
      rightDate.value = dayjs(now).add(1, 'month').toDate()
    }
  }

  defineExpose({ resetView })
</script>
