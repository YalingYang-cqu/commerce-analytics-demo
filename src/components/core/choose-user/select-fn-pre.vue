<template>
  <ElSelect
    v-model="select"
    placeholder="Select"
    style="width: 115px"
    @change="onChange"
    size="small"
  >
    <template v-for="item in list" :key="item.key">
      <ElOption :label="item.label" :value="item.value" />
    </template>
  </ElSelect>
</template>
<script setup lang="ts">
  import { ref } from 'vue'
  defineOptions({ name: 'inputSelectPre' })
  const select = ref(2)
  const emit = defineEmits<{
    change: [value: number]
  }>()

  const onChange = () => {
    emit('change', select.value)
  }
  interface Props {
    /** 下拉项列表 */
    list: { value: number; label: string }[]
  }

  const { list } = defineProps<Props>()
</script>
