<template>
  <el-date-picker
    v-model="searchDate"
    :type="type"
    :class="['date-picker', clearable ? '' : 'no-clear-icon']"
    start-placeholder="开始日期"
    end-placeholder="结束日期"
    :editable="editable"
    :clearable="clearable"
    :disabled="disabled"
    :value-format="valueFormat"
    :picker-options="pickerOptions"
    @change="changeDate"
  />
</template>

<script setup lang="ts">
  import { ref, watch, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import dayjs from 'dayjs'
  import weekOfYear from 'dayjs/plugin/weekOfYear'
  import localeData from 'dayjs/plugin/localeData'
  import UnitFuc from '@/utils/toolFun/tools'

  // 扩展 dayjs 插件
  dayjs.extend(weekOfYear)
  dayjs.extend(localeData)

  // Types
  interface DatePickerProps {
    modelValue?: string | string[]
    region?: string
    type?: any
    valueFormat?: string
    clearable?: boolean
    editable?: boolean
    disabled?: boolean
    dateOptions?: Record<string, any>
    maxRange?: number
    showFuturo?: boolean
  }

  interface PickerShortcut {
    text: string
    onClick: (picker: any) => void
  }

  interface PickerOptions {
    disabledDate?: (time: Date) => boolean
    shortcuts?: PickerShortcut[]
    [key: string]: any
  }

  interface Emits {
    (e: 'update:modelValue', value: string | string[]): void
    (e: 'change', value: string | string[]): void
  }

  // Props
  const props = withDefaults(defineProps<DatePickerProps>(), {
    modelValue: '',
    region: 'US',
    type: 'daterange',
    valueFormat: 'yyyy-MM-dd',
    clearable: false,
    editable: false,
    disabled: false,
    dateOptions: () => ({}),
    maxRange: 0,
    showFuturo: false
  })

  // Emits
  const emit = defineEmits<Emits>()

  // Reactive data
  const searchDate = ref<string | string[]>(props.modelValue)

  // Computed
  const pickerOptions = computed((): PickerOptions => {
    if (Object.keys(props.dateOptions).length) return props.dateOptions

    const timeRegion = props.region
    const showFuturo = props.showFuturo

    // 日期选择器快捷选项
    const shortcuts: PickerShortcut[] = [
      {
        text: '今天',
        onClick(picker) {
          const nowDate = new Date(UnitFuc.dateForTimezone(timeRegion, new Date()))
          picker.$emit('pick', [nowDate, nowDate])
        }
      },
      {
        text: '昨天',
        onClick(picker) {
          const nowDate = dayjs().subtract(1, 'day').toDate()
          picker.$emit('pick', [nowDate, nowDate])
        }
      },
      {
        text: '最近7天',
        onClick(picker) {
          const endDate = new Date()
          const startDate = dayjs().subtract(7, 'day').toDate()
          picker.$emit('pick', [startDate, endDate])
        }
      },
      {
        text: '最近14天',
        onClick(picker) {
          const endDate = new Date()
          const startDate = dayjs().subtract(14, 'day').toDate()
          picker.$emit('pick', [startDate, endDate])
        }
      },
      {
        text: '最近30天',
        onClick(picker) {
          const endDate = new Date()
          const startDate = dayjs().subtract(30, 'day').toDate()
          picker.$emit('pick', [startDate, endDate])
        }
      },
      {
        text: '本周',
        onClick(picker) {
          const startDate = dayjs().startOf('week').toDate()
          const endDate = new Date()
          picker.$emit('pick', [startDate, endDate])
        }
      },
      {
        text: '上周',
        onClick(picker) {
          const startDate = dayjs().subtract(1, 'week').startOf('week').toDate()
          const endDate = dayjs().subtract(1, 'week').endOf('week').toDate()
          picker.$emit('pick', [startDate, endDate])
        }
      },
      {
        text: '最近2周',
        onClick(picker) {
          const startDate = dayjs().subtract(2, 'week').startOf('week').toDate()
          const endDate = new Date()
          picker.$emit('pick', [startDate, endDate])
        }
      },
      {
        text: '本月',
        onClick(picker) {
          const startDate = dayjs().startOf('month').toDate()
          const endDate = new Date()
          picker.$emit('pick', [startDate, endDate])
        }
      },
      {
        text: '上月',
        onClick(picker) {
          const startDate = dayjs().subtract(1, 'month').startOf('month').toDate()
          const endDate = dayjs().subtract(1, 'month').endOf('month').toDate()
          picker.$emit('pick', [startDate, endDate])
        }
      },
      {
        text: '最近2月',
        onClick(picker) {
          const startDate = dayjs().subtract(2, 'month').startOf('month').toDate()
          const endDate = new Date()
          picker.$emit('pick', [startDate, endDate])
        }
      },
      {
        text: '最近6月',
        onClick(picker) {
          const startDate = dayjs().subtract(6, 'month').startOf('month').toDate()
          const endDate = new Date()
          picker.$emit('pick', [startDate, endDate])
        }
      },
      {
        text: '今年',
        onClick(picker) {
          const startDate = dayjs().startOf('year').toDate()
          const endDate = new Date()
          picker.$emit('pick', [startDate, endDate])
        }
      }
    ]

    const dayShortcuts: PickerShortcut[] = [
      {
        text: '今天',
        onClick(picker) {
          const nowDate = new Date()
          picker.$emit('pick', nowDate)
        }
      },
      {
        text: '昨天',
        onClick(picker) {
          const nowDate = dayjs().subtract(1, 'day').toDate()
          picker.$emit('pick', nowDate)
        }
      },
      {
        text: '前天',
        onClick(picker) {
          const nowDate = dayjs().subtract(2, 'day').toDate()
          picker.$emit('pick', nowDate)
        }
      }
    ]

    return {
      disabledDate(time: Date): boolean {
        if (showFuturo) return false
        return time.getTime() > Date.now()
      },
      shortcuts: props.type === 'date' ? dayShortcuts : shortcuts
    }
  })

  // Methods
  const changeDate = (): void => {
    if (props.maxRange && Array.isArray(searchDate.value) && searchDate.value.length === 2) {
      const begin = dayjs(searchDate.value[0]).valueOf()
      const end = dayjs(searchDate.value[1]).valueOf()
      const timeGap = end - begin

      if (timeGap > props.maxRange) {
        ElMessage.error(`时间跨度不能超过${props.maxRange / (1000 * 60 * 60 * 24)}天`)
        const newEnd = begin + props.maxRange
        searchDate.value = [searchDate.value[0], dayjs(newEnd).format('YYYY-MM-DD')]
      }
    }

    emit('update:modelValue', searchDate.value)
    emit('change', searchDate.value)
  }

  // Watchers
  watch(
    () => props.modelValue,
    (val: string | string[]) => {
      searchDate.value = val
    },
    { immediate: true }
  )
</script>

<style scoped lang="scss">
  .date-picker {
    width: 300px;

    :deep(.el-range-editor) {
      height: 34px;
      background: #fff;
      border-color: #dcdfe6;
      border-radius: 4px;
    }

    :deep(.el-date-editor .el-input__wrapper) {
      height: 34px;
      min-height: 34px;
    }

    :deep(.el-range-input) {
      height: 34px;
      line-height: 34px;
    }

    :deep(.el-range-editor.is-active) {
      border-color: #425eff;
      box-shadow: 0 0 0 2px rgb(66 94 255 / 12%);
    }
  }

  .date-picker.no-clear-icon {
    :deep(.el-range__close-icon) {
      display: none;
    }

    :deep(.el-range-input) {
      width: 46%;
    }
  }
</style>
