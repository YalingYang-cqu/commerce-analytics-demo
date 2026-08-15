<template>
  <el-link type="primary" @click.stop="onClick">
    <div>{{ spuCode }}</div>
  </el-link>
</template>

<script setup lang="ts">
  import { useDetailDialog } from '@/composables/useDetailDialog'

  interface Props {
    spuCode: string
    spuId: string | number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ (e: 'click', payload: { spuId: string | number }): void }>()

  const { openSpuDetail } = useDetailDialog()

  const onClick = () => {
    emit('click', { spuId: props.spuId })
    openSpuDetail(props.spuId)
  }
</script>
