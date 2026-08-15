<template>
  <el-dialog
    :model-value="modelValue"
    :title="title"
    :before-close="handleClose"
    :class="['mk-dialog', `mk-dialog-${size}`, { 'dialog-show-footer': showFooter }]"
    :append-to-body="appendToBody"
    :destroy-on-close="destroyOnClose"
    :top="top"
  >
    <template #title>
      <slot name="title" />
    </template>

    <slot />

    <template #footer v-if="showFooter">
      <slot name="footer" />
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  // Types
  type DialogSize = 'xLarge' | 'large' | 'big' | 'middle' | 'small' | 'mini' | 'auto'

  interface Props {
    /** 对话框尺寸 */
    size?: DialogSize
    /** 是否显示底部 */
    showFooter?: boolean
    /** 对话框标题 */
    title?: string
    /** 是否显示对话框 */
    modelValue?: boolean
    /** 是否附加到 body */
    appendToBody?: boolean
    /** 关闭时是否销毁 */
    destroyOnClose?: boolean
    /** 顶部距离 */
    top?: string
  }

  interface Emits {
    /** 关闭对话框事件 */
    (e: 'close'): void
    /** 更新显示状态事件 */
    (e: 'update:modelValue', value: boolean): void
  }

  // Props - 使用解构来直接使用 props
  const {
    size = 'big',
    showFooter = false,
    title = '',
    modelValue = false,
    appendToBody = true,
    destroyOnClose = true,
    top = '0'
  } = defineProps<Props>()

  // Emits
  const emit = defineEmits<Emits>()

  // Methods
  const handleClose = (): void => {
    emit('close')
    emit('update:modelValue', false)
  }
</script>

<style lang="scss" scoped>
  .mk-dialog {
    :deep(.el-dialog__header) {
      padding: 12px 20px;
      box-shadow: inset 0 -1px 0 #e4e7ed;

      .el-dialog__title {
        font-size: 16px;
        font-weight: 500;
        line-height: 24px;
        color: #303133;
      }

      .el-dialog__headerbtn {
        top: 5px;
        padding: 10px;
      }
    }

    :deep(.el-dialog) {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 80%;
      height: 80%;
      margin: 0 auto;
      transform: translate(-50%, -50%);

      .el-dialog__body {
        position: relative;
        height: calc(100% - 48px);
        padding: 20px;
        overflow: auto;
      }

      .el-dialog__footer {
        box-shadow: inset 0 1px 0 #f0f0f0;
      }
    }

    &.dialog-show-footer {
      :deep(.el-dialog__body) {
        height: calc(100% - 110px) !important;
      }
    }
  }

  .mk-dialog-big {
    :deep(.el-dialog) {
      max-width: 1320px;
      max-height: 764px;
    }
  }

  .mk-dialog-mini {
    :deep(.el-dialog) {
      max-width: 800px;
      max-height: 600px;
    }
  }

  .mk-dialog-auto {
    :deep(.el-dialog) {
      width: auto;
      height: auto;
    }
  }

  .mk-dialog-xLarge {
    :deep(.el-dialog) {
      max-width: 95vw;
      max-height: 95vh;
    }
  }

  .mk-dialog-large {
    :deep(.el-dialog) {
      max-width: 1392px;
      max-height: 802px;
    }
  }

  .mk-dialog-middle {
    :deep(.el-dialog) {
      max-width: 1024px;
      max-height: 640px;
    }
  }

  .mk-dialog-small {
    :deep(.el-dialog) {
      max-width: 850px;
      max-height: 784px;
    }
  }
</style>
