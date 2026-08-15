<!-- 单日选择器：合并显示「日期 - 标签」，提供 今日/昨日/前日/上周同日 快捷项 -->
<!-- 参照旧项目 mk-datePicker-day(mkDayRange)：覆盖层显示标签，点击打开原生面板 -->
<template>
  <div class="mk-day-picker" :class="{ 'is-disabled': disabled }">
    <div class="day-display" @click="openPicker">
      <span class="day-text">日期 - {{ label }}</span>
      <ElIcon class="day-icon"><Calendar /></ElIcon>
    </div>
    <ElDatePicker
      ref="pickerRef"
      v-model="innerDate"
      type="date"
      placeholder="请选择日期"
      value-format="YYYY-MM-DD"
      :clearable="false"
      :disabled="disabled"
      :shortcuts="shortcuts"
      :disabled-date="disabledDate"
      class="day-native"
      @change="onChange"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import { Calendar } from '@element-plus/icons-vue'

  defineOptions({ name: 'MkDayPicker' })

  interface Props {
    /** 选中日期 YYYY-MM-DD */
    date: string
    /** 显示标签：今日 / 上周同日 / 具体日期 */
    dateStr?: string
    /** 是否禁用 */
    disabled?: boolean
    /** 「今日」基准日期（快捷项与可选范围以此为准） */
    baseDate?: string
  }
  const props = withDefaults(defineProps<Props>(), {
    dateStr: '',
    disabled: false,
    baseDate: ''
  })

  const emit = defineEmits<{ change: [date: string, label: string] }>()

  const pickerRef = ref()
  const innerDate = ref(props.date)
  watch(
    () => props.date,
    (v) => (innerDate.value = v)
  )

  /** 标签：优先显示名称，否则显示日期 */
  const label = computed(() => props.dateStr || props.date || '')

  /** 基准时间（无 baseDate 时取当前） */
  const baseTime = () => (props.baseDate ? new Date(`${props.baseDate}T12:00:00`) : new Date())
  /** 基准日向前推 n 天 */
  const dayBefore = (n: number) => new Date(baseTime().getTime() - n * 86400000)

  /** 本次选择的快捷标签（快捷项点击时写入，change 时读取） */
  let pickedLabel = ''
  const shortcuts = computed(() => [
    { text: '今日', value: () => ((pickedLabel = '今日'), dayBefore(0)) },
    { text: '昨日', value: () => ((pickedLabel = '昨日'), dayBefore(1)) },
    { text: '前日', value: () => ((pickedLabel = '前日'), dayBefore(2)) },
    { text: '上周同日', value: () => ((pickedLabel = '上周同日'), dayBefore(7)) }
  ])

  /** 可选范围：不晚于基准日、不早于 90 天前 */
  const disabledDate = (time: Date) => {
    const base = baseTime()
    base.setHours(0, 0, 0, 0)
    const max = base.getTime()
    const min = max - 90 * 86400000
    const t = new Date(time)
    t.setHours(0, 0, 0, 0)
    return t.getTime() > max || t.getTime() < min
  }

  /** 选择回写：快捷→名称标签，日历→日期标签 */
  const onChange = (val: string) => {
    const labelText = pickedLabel || val
    pickedLabel = ''
    emit('change', val, labelText)
  }

  /** 点击覆盖层打开面板 */
  const openPicker = () => {
    if (props.disabled) return
    const p = pickerRef.value as { focus?: () => void; handleOpen?: () => void } | undefined
    p?.focus?.()
    p?.handleOpen?.()
  }
</script>

<style lang="scss" scoped>
  .mk-day-picker {
    position: relative;
    width: 100%;

    .day-display {
      position: absolute;
      inset: 0;
      z-index: 2;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      padding: 0 8px 0 10px;
      font-size: 13px;
      color: var(--art-gray-700);
      cursor: pointer;
      background: var(--el-fill-color-blank);
      border: 1px solid var(--el-border-color);
      border-radius: 4px;

      .day-icon {
        font-size: 14px;
        color: var(--el-text-color-placeholder);
      }
    }

    .day-native {
      width: 100%;
    }

    &.is-disabled .day-display {
      color: var(--el-text-color-placeholder);
      cursor: not-allowed;
      background: var(--el-fill-color-light);
      border-color: var(--el-border-color-lighter);
    }
  }
</style>
