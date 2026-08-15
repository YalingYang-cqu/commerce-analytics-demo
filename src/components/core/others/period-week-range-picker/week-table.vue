<!-- 周历表：左侧周序号 + 按行选周 -->
<template>
  <table role="grid" class="el-date-table" cellspacing="0" cellpadding="0">
    <tbody>
      <tr v-for="(row, rowIndex) in rows" :key="rowIndex" @click="onRowClick(row)">
        <td class="week" :class="getRowRangeClass(row)" @click.stop="onRowClick(row)">
          {{ getRowWeek(row) }}
        </td>
        <td
          v-for="(cell, colIndex) in row"
          :key="colIndex"
          :class="getCellClass(cell, row)"
          @click.stop="onRowClick(row)"
        >
          <div class="el-date-table-cell">
            <span class="el-date-table-cell__text">{{ cell.text }}</span>
          </div>
        </td>
      </tr>
    </tbody>
  </table>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import dayjs from 'dayjs'
  import isoWeek from 'dayjs/plugin/isoWeek'
  import {
    buildMonthRows,
    getIsoWeekNumber,
    getWeekStart,
    isSameWeek,
    isWeekBefore,
    type CalendarCell
  } from './utils'

  dayjs.extend(isoWeek)

  export interface WeekRangeState {
    selecting: boolean
    startDate: Date | null
    endDate: Date | null
  }

  const props = withDefaults(
    defineProps<{
      year: number
      month: number
      minDate?: Date | null
      maxDate?: Date | null
      rangeState?: WeekRangeState
      hoverDate?: Date | null
      firstDayOfWeek?: number
      disabledDate?: (date: Date) => boolean
    }>(),
    {
      minDate: null,
      maxDate: null,
      rangeState: () => ({ selecting: false, startDate: null, endDate: null }),
      hoverDate: null,
      firstDayOfWeek: 1
    }
  )

  const emit = defineEmits<{
    pick: [date: Date]
  }>()

  const rows = computed(() =>
    buildMonthRows(props.year, props.month, props.firstDayOfWeek, props.disabledDate)
  )

  const getRowWeek = (row: CalendarCell[]) => {
    const anchor = row.find((c) => c.type === 'normal') ?? row[3] ?? row[0]
    return getIsoWeekNumber(anchor.date)
  }

  const getRowWeekStart = (row: CalendarCell[]) => {
    const anchor = row.find((c) => c.type === 'normal') ?? row[0]
    return getWeekStart(anchor.date)
  }

  const isStartWeek = (weekStart: Date) => {
    if (!props.minDate) return false
    return isSameWeek(weekStart, props.minDate)
  }

  const isEndWeek = (weekStart: Date) => {
    if (!props.maxDate) return false
    return isSameWeek(weekStart, getWeekStart(props.maxDate))
  }

  /** 起止周深蓝，中间周浅蓝 */
  const isInRangeWeek = (weekStart: Date) => {
    if (!props.minDate || !props.maxDate) return false
    const rangeEnd = getWeekStart(props.maxDate)
    if (isSameWeek(weekStart, props.minDate) || isSameWeek(weekStart, rangeEnd)) return false
    return !isWeekBefore(weekStart, props.minDate) && isWeekBefore(weekStart, rangeEnd)
  }

  const getRowRangeClass = (row: CalendarCell[]) => {
    const weekStart = getRowWeekStart(row)
    if (isStartWeek(weekStart) && isEndWeek(weekStart)) return 'start-date end-date'
    if (isStartWeek(weekStart)) return 'start-date'
    if (isEndWeek(weekStart)) return 'end-date'
    if (isInRangeWeek(weekStart)) return 'in-range'
    return ''
  }

  const getCellClass = (cell: CalendarCell, row: CalendarCell[]) => {
    const rangeClass = getRowRangeClass(row)
    const classes: string[] = [cell.type]
    if (cell.disabled) classes.push('disabled')
    if (rangeClass) classes.push(rangeClass)
    return classes
  }

  const onRowClick = (row: CalendarCell[]) => {
    const clickable = row.find((c) => !c.disabled)
    if (!clickable) return
    const weekStart = getRowWeekStart(row)
    emit('pick', weekStart)
  }
</script>
