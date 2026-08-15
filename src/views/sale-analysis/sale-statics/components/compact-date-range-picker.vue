<template>
  <ElPopover
    v-model:visible="panelVisible"
    class="compact-date-range-picker"
    placement="bottom-start"
    :width="646"
    trigger="click"
    popper-class="compact-date-range-popper"
  >
    <template #reference>
      <div class="range-content" :class="{ 'is-active': panelVisible }">
        <ElIcon class="range-icon"><Calendar /></ElIcon>
        <span class="range-date" :class="{ 'is-placeholder': !startText }">
          {{ startText || startPlaceholder }}
        </span>
        <span class="range-sep">{{ rangeSeparator }}</span>
        <span class="range-date" :class="{ 'is-placeholder': !endText }">
          {{ endText || endPlaceholder }}
        </span>
        <ElIcon v-if="clearable && hasValue" class="range-clear" @click.stop="handleClear">
          <CircleClose />
        </ElIcon>
      </div>
    </template>

    <ElDatePickerPanel
      :model-value="innerRange"
      type="daterange"
      :border="false"
      format="YYYY-MM-DD"
      value-format="YYYY-MM-DD"
      :unlink-panels="unlinkPanels"
      :clearable="false"
      :disabled-date="disabledDateFn"
      @update:model-value="onPanelPick"
    />
  </ElPopover>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import dayjs from 'dayjs'
  import { Calendar, CircleClose } from '@element-plus/icons-vue'
  import { ElDatePickerPanel } from 'element-plus'

  defineOptions({ name: 'CompactDateRangePicker' })

  const props = withDefaults(
    defineProps<{
      startPlaceholder?: string
      endPlaceholder?: string
      rangeSeparator?: string
      unlinkPanels?: boolean
      clearable?: boolean
      /** 可选结束日上限（站点今日），超出则禁止选择并自动裁剪 */
      maxDate?: string
      disabledDate?: (date: Date) => boolean
    }>(),
    {
      startPlaceholder: '开始',
      endPlaceholder: '结束',
      rangeSeparator: '至',
      unlinkPanels: true,
      clearable: false,
      maxDate: '',
      disabledDate: undefined
    }
  )

  const model = defineModel<[string, string]>({ required: true })

  const panelVisible = ref(false)
  const innerRange = ref<[string, string]>([...model.value])

  watch(
    model,
    (value) => {
      innerRange.value = [...value]
    },
    { deep: true }
  )

  const startText = computed(() => innerRange.value?.[0] || '')
  const endText = computed(() => innerRange.value?.[1] || '')
  const hasValue = computed(() => Boolean(startText.value && endText.value))

  const disabledDateFn = computed(() => {
    if (props.disabledDate) return props.disabledDate
    if (!props.maxDate) return undefined
    const max = dayjs(props.maxDate).startOf('day').valueOf()
    return (time: Date) => dayjs(time).startOf('day').valueOf() > max
  })

  const applyRange = (start: string, end: string) => {
    const next: [string, string] = [start, end]
    innerRange.value = next
    model.value = next
  }

  const formatPickValue = (value: unknown): [string, string] | null => {
    if (Array.isArray(value) && value.length === 2 && value[0] && value[1]) {
      const start = dayjs(value[0] as string | Date).format('YYYY-MM-DD')
      const end = dayjs(value[1] as string | Date).format('YYYY-MM-DD')
      return [start, end]
    }
    return null
  }

  const clipToMaxDate = (start: string, end: string): [string, string] => {
    const max = props.maxDate
    if (!max) return [start, end]
    let nextEnd = end > max ? max : end
    let nextStart = start > nextEnd ? nextEnd : start
    if (nextStart > max) nextStart = max
    return [nextStart, nextEnd]
  }

  const onPanelPick = (value: unknown) => {
    const next = formatPickValue(value)
    if (!next) return
    const [start, end] = clipToMaxDate(next[0], next[1])
    applyRange(start, end)
    panelVisible.value = false
  }

  const handleClear = () => {
    panelVisible.value = false
  }
</script>

<style scoped lang="scss">
  .compact-date-range-picker {
    display: inline-flex;
    flex: 0 0 auto;
    max-width: 100%;
    vertical-align: middle;
  }

  .range-content {
    display: inline-flex;
    gap: 2px;
    align-items: center;
    height: 30px;
    padding: 0 8px;
    font-size: 12px;
    line-height: 30px;
    color: #1f2937;
    white-space: nowrap;
    cursor: pointer;
    background: #fff;
    border: 1px solid #315cff;
    border-radius: 8px;

    &.is-active {
      border-color: #244bd6;
      box-shadow: 0 0 0 2px rgb(49 92 255 / 12%);
    }
  }

  .range-icon {
    flex: 0 0 auto;
    margin-right: 2px;
    font-size: 14px;
    color: #98a2b3;
  }

  .range-date {
    flex: 0 0 auto;

    &.is-placeholder {
      color: #98a2b3;
    }
  }

  .range-sep {
    flex: 0 0 auto;
    padding: 0 1px;
    color: #667085;
  }

  .range-clear {
    flex: 0 0 auto;
    margin-left: 2px;
    font-size: 14px;
    color: #98a2b3;
    cursor: pointer;

    &:hover {
      color: #667085;
    }
  }
</style>

<style lang="scss">
  .compact-date-range-popper {
    padding: 0 !important;

    .el-picker-panel {
      margin: 0;
    }
  }
</style>
