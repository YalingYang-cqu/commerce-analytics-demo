<template>
  <div class="date-picker-component">
    <slot name="title" />
    <el-date-picker
      v-model="startWeek"
      style="width: 120px"
      type="week"
      format="yyyy 第 WW 周"
      value-format="YYYY-MM-DD"
      placeholder="开始周"
      :picker-options="pickerOptionsStart"
      @focus="saveInitialTime"
      @change="handleDateChange"
    />
    <span class="text">至</span>
    <el-date-picker
      v-model="endWeek"
      style="width: 120px"
      type="week"
      format="yyyy 第 WW 周"
      value-format="YYYY-MM-DD"
      placeholder="结束周"
      :picker-options="pickerOptionsEnd"
      @focus="saveInitialTime"
      @change="handleDateChange"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, computed, onMounted } from 'vue'
  import { ElMessage } from 'element-plus'
  import dayjs from 'dayjs'

  interface Props {
    /** 父组件传入的时间范围 */
    modelValue?: string[]
    /** 是否限制时间范围不超过90天 */
    timeThan90?: boolean
  }

  interface Emits {
    /** 更新模型值事件 */
    (e: 'update:modelValue', value: string[]): void
    /** 时间变化事件 */
    (e: 'change', value: string[]): void
  }

  // Picker options 类型定义
  interface PickerOptions {
    disabledDate?: (time: Date) => boolean
  }

  // Props
  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    timeThan90: false
  })

  // Emits
  const emit = defineEmits<Emits>()

  // Refs
  const startWeek = ref<string>('')
  const endWeek = ref<string>('')
  const initTime = ref<string[]>([])
  const pickerOptionsStart = ref<PickerOptions>({})
  const pickerOptionsEnd = ref<PickerOptions>({})

  // Computed
  const monthTime = computed({
    get: () => props.modelValue,
    set: (value) => {
      emit('update:modelValue', value || [])
      emit('change', value || [])
    }
  })

  // Watchers
  watch(
    () => props.modelValue,
    (newValue) => {
      if (newValue && newValue.length === 2) {
        startWeek.value = newValue[0]
        endWeek.value = newValue[1]
      } else {
        startWeek.value = ''
        endWeek.value = ''
      }
    },
    { immediate: true }
  )

  // Methods
  /** 清空时间选择 */
  const clearTime = (): void => {
    startWeek.value = ''
    endWeek.value = ''
    handleDateChange()
  }

  /** 保存初始时间（对应原代码的 fnFocusTime） */
  const saveInitialTime = (): void => {
    initTime.value = [startWeek.value, endWeek.value]
  }

  /** 处理日期变化 */
  const handleDateChange = (): void => {
    const currentTime = [startWeek.value, endWeek.value]
    if (currentTime[0] && currentTime[1]) {
      const startVal = dayjs(currentTime[0]).valueOf()
      const endVal = dayjs(currentTime[1]).valueOf()
      const time90 = 3600 * 1000 * 24 * 90
      if (props.timeThan90 && endVal - startVal > time90) {
        ElMessage.error('选择的时间段不能超过90天')
        monthTime.value = []
        // 恢复为初始时间
        startWeek.value = initTime.value[0] || ''
        endWeek.value = initTime.value[1] || ''
      } else {
        monthTime.value = currentTime
      }
    } else {
      monthTime.value = currentTime.filter(Boolean)
    }
  }

  /** 设置选择器选项 */
  const setPickerOptions = (): void => {
    pickerOptionsStart.value = {
      disabledDate: (time: Date) => {
        if (endWeek.value) {
          const endDate = dayjs(endWeek.value).valueOf()
          return time.getTime() > endDate
        }
        return false
      }
    }

    pickerOptionsEnd.value = {
      disabledDate: (time: Date) => {
        if (startWeek.value) {
          const startDate = dayjs(startWeek.value).valueOf()
          const weekDate = time.getTime() + 2 * 24 * 3600 * 1000
          return weekDate <= startDate
        }
        return false
      }
    }
  }

  // Lifecycle
  onMounted(() => {
    setPickerOptions()
  })

  // 暴露方法给模板引用
  defineExpose({
    clearTime
  })
</script>
<style lang="scss" scoped>
  .date-picker-component {
    display: flex;
    align-items: center;
    height: 32px;
    border: 1px solid #dddfe3;

    .text {
      margin: 0 4px;
    }

    :deep(.el-input--suffix .el-input__inner) {
      padding-right: 14px !important;
      padding-left: 24px !important;
    }
  }

  .day-title {
    height: 32px;
    padding: 0 18px 0 16px;
    margin-right: -2px;
    line-height: 32px;
    color: #606266;
    border: solid 1px #dddfe3;
    border-right: 0;
    border-radius: 2px;
  }

  :deep(.el-picker-panel__shortcut) {
    line-height: 32px;

    &:hover {
      color: #fff;
      background-color: #425eff;
    }
  }

  :deep(.el-date-table td:not(.disabled) span) {
    border: solid 1px rgb(255 255 255 / 0%);
    border-radius: 2px;

    &:hover {
      border: solid 1px #425eff;
    }
  }

  .public-datePicker .el-icon-date {
    position: absolute;
    right: 2px;
  }

  :deep(.el-date-editor .el-range__close-icon) {
    width: 36px !important;
    margin-right: 10px !important;
  }
</style>
