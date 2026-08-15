<template>
  <div class="art-page-header">
    <div class="header-left">
      <slot></slot>
    </div>
    <div class="header-right">
      <slot name="right"></slot>
      <ElIcon class="close-icon" @click="handleClose" v-if="!hideClose">
        <Close />
      </ElIcon>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { router } from '@/router'
  import { useWorktabStore } from '@/store/modules/worktab'
  import { Close } from '@element-plus/icons-vue'
  import { ElIcon } from 'element-plus'

  defineOptions({ name: 'ArtPageHeader' })

  const route = useRoute()
  const worktabStore = useWorktabStore()
  const props = defineProps<{ redirectName: string; hideClose?: boolean }>()
  // 关闭页面（关闭当前标签页）
  const handleClose = () => {
    const currentPath = route.path
    // 先跳转到目标路由，避免 removeTab 自动激活前一个标签
    router.push({ name: props.redirectName }).then(() => {
      // 跳转完成后再关闭原标签页
      worktabStore.removeTab(currentPath)
    })
  }
</script>

<style lang="scss" scoped>
  .art-page-header {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    background: #fff;
    border-bottom: 1px solid #e4e7ed;

    .header-left {
      flex: 1;
    }

    .header-right {
      display: flex;
      gap: 12px;
      align-items: center;
    }

    .close-icon {
      font-size: 20px;
      color: rgb(0 0 0 / 60%);
      cursor: pointer;
      transition: color 0.3s;

      &:hover {
        color: rgb(0 0 0 / 80%);
      }
    }
  }
</style>
