<template>
  <span class="rt-inv-header-tip">
    {{ label }}
    <ElTooltip placement="top">
      <template #content>
        <pre>{{ tip }}</pre>
      </template>
      <i class="iconfont-custom">&#xe6ab;</i>
    </ElTooltip>
  </span>
</template>

<script setup lang="ts">
  import { ElTooltip } from 'element-plus'

  defineProps<{
    label: string
    tip: string
  }>()
</script>

<style lang="scss" scoped>
  .rt-inv-header-tip {
    display: inline-flex;
    gap: 4px;
    align-items: center;

    .tip-icon {
      font-size: 14px;
      color: var(--el-text-color-secondary);
      cursor: help;
    }
  }
</style>
