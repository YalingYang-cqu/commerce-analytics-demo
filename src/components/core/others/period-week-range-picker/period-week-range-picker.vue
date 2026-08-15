<template>
  <ElDatePicker
    :model-value="modelValue"
    type="daterange"
    size="small"
    clearable
    unlink-panels
    show-week-number
    value-format="YYYY-MM-DD"
    format="YYYY-MM-DD"
    :start-placeholder="startPlaceholder"
    :end-placeholder="endPlaceholder"
    class="period-week-range-picker"
    @update:model-value="onUpdate"
    @change="onChange"
    @clear="onClear"
  />
</template>

<script setup lang="ts">
  import { normalizeWeekDateRange } from '../utils/period'

  defineProps<{
    modelValue?: string[]
    startPlaceholder?: string
    endPlaceholder?: string
  }>()

  const emit = defineEmits<{
    'update:modelValue': [value: string[]]
    change: [value: string[]]
    clear: []
  }>()

  const onUpdate = (value: string[] | null) => {
    const next = value?.length === 2 ? normalizeWeekDateRange(value) : []
    emit('update:modelValue', next)
  }

  const onChange = (value: string[] | null) => {
    const next = value?.length === 2 ? normalizeWeekDateRange(value) : []
    emit('change', next)
  }

  const onClear = () => {
    emit('update:modelValue', [])
    emit('clear')
  }
</script>

<style scoped lang="scss">
  .period-week-range-picker {
    flex: 1;
    width: 100% !important;
    margin-left: -1px;
  }
</style>
