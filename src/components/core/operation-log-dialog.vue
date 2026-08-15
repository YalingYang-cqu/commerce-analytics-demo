<template>
  <ElDialog
    :model-value="visible"
    @update:model-value="(val) => emit('update:visible', val)"
    title="操作日志"
    width="1100px"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <OperationLog
      :showBar="false"
      :params="params"
      :showMoudle="showMoudle"
      :visible="visible"
      from="dialog"
    />
    <template #footer>
      <ElButton @click="handleClose">关闭</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  // import { watch } from 'vue'
  import { ElDialog } from 'element-plus'

  interface Props {
    visible: boolean
    params?: any
    showMoudle?: boolean
  }

  const { params, visible, showMoudle } = defineProps<Props>()

  const emit = defineEmits(['update:visible'])

  // 关闭弹窗
  const handleClose = () => {
    emit('update:visible', false)
  }
</script>
