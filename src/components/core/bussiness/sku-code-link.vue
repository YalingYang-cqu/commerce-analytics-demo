<template>
  <el-link type="primary" @click.stop="onClick">
    <div>{{ skuCode }}</div>
  </el-link>
</template>

<script setup lang="ts">
  import { useDetailDialog } from '@/composables/useDetailDialog'

  interface Props {
    skuCode: string
    skuId: string | number
  }

  const props = defineProps<Props>()
  const emit = defineEmits<{ (e: 'click', payload: { skuId: string | number }): void }>()

  const { openSkuDetail } = useDetailDialog()

  const onClick = () => {
    emit('click', { skuId: props.skuId })
    openSkuDetail(props.skuId)
  }
</script>
