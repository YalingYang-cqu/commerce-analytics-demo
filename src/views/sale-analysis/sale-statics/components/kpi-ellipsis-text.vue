<template>
  <ElTooltip
    v-model:visible="tipVisible"
    :content="text"
    placement="top"
    :show-after="0"
    trigger="manual"
    popper-class="kpi-ellipsis-tooltip"
  >
    <span ref="rootRef" :class="cellClass" @mouseenter="onMouseEnter" @mouseleave="onMouseLeave">
      {{ text }}
    </span>
  </ElTooltip>
</template>

<script setup lang="ts">
  import { ref } from 'vue'

  defineOptions({ name: 'KpiEllipsisText' })

  const props = defineProps<{
    text: string
    cellClass?: string
  }>()

  const rootRef = ref<HTMLElement>()
  const tipVisible = ref(false)

  const onMouseEnter = () => {
    const el = rootRef.value
    if (!el || props.text === '-' || !props.text) {
      tipVisible.value = false
      return
    }
    tipVisible.value = el.scrollWidth > el.clientWidth + 1
  }

  const onMouseLeave = () => {
    tipVisible.value = false
  }
</script>
