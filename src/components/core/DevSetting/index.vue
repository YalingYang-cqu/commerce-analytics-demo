<template>
  <a @click="handleOpenDialog" class="check-token-trigger">
    <el-icon><Operation /></el-icon>
    <span class="check-token-text">调试</span>
  </a>
  <Dialog ref="dialogRef" />
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { Operation } from '@element-plus/icons-vue'
  import Dialog from './Dialog.vue'

  const dialogRef = ref<InstanceType<typeof Dialog> | null>(null)

  const handleOpenDialog = () => {
    dialogRef.value?.open()
  }
</script>

<style lang="scss" scoped>
  .check-token-trigger {
    display: inline-flex;
    flex-direction: column;
    align-items: center;
    color: inherit;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      color: var(--el-color-primary);
    }
  }

  .check-token-text {
    margin-left: 2px;
  }
</style>
