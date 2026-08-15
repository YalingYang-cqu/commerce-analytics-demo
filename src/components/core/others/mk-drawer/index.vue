<template>
  <el-drawer
    :model-value="modelValue"
    :direction="direction"
    :append-to-body="appendToBody"
    :modal-append-to-body="modalAppendToBody"
    :destroy-on-close="destroyOnClose"
    :modal="modal"
    :size="height"
    :title="title"
    custom-class="mk-drawer-contain"
    class="mk-drawer"
    :data-draw-index="drawerIndex"
    ref="mkDrawer"
    @open="handleOpen"
    @close="handleClose"
    @closed="handleClosed"
  >
    <div
      class="drawer-body"
      :style="{
        height: `calc(100% - ${showFooter ? '60px' : '0px'})`
      }"
    >
      <slot />
    </div>
    <div class="drawer-footer" v-if="showFooter">
      <slot name="footer" />
    </div>
  </el-drawer>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'

  interface Props {
    /** 抽屉方向 */
    direction?: 'rtl' | 'ltr' | 'ttb' | 'btt'
    /** 是否附加到 body */
    appendToBody?: boolean
    /** 遮罩层是否附加到 body */
    modalAppendToBody?: boolean
    /** 关闭时是否销毁 */
    destroyOnClose?: boolean
    /** 是否显示抽屉 */
    modelValue?: boolean
    /** 是否显示遮罩层 */
    modal?: boolean
    /** 是否展示底部 */
    showFooter?: boolean
    /** 大小 */
    size?: string | number
    /** 标题 */
    title?: string
    /** 层级，数字越大越底层，默认第一层 */
    dialogLevel?: number
    /** 层级, 拥有的最大层级 */
    maxLevel?: number
  }

  interface Emits {
    /** 打开事件 */
    (e: 'open'): void
    /** 关闭事件 */
    (e: 'close'): void
    /** 关闭后事件 */
    (e: 'closed'): void
    /** 更新显示状态 */
    (e: 'update:modelValue', value: boolean): void
  }

  // Props
  const props = withDefaults(defineProps<Props>(), {
    direction: 'btt',
    appendToBody: false,
    modalAppendToBody: false,
    destroyOnClose: true,
    modelValue: false,
    modal: false,
    showFooter: false,
    size: '',
    title: '',
    dialogLevel: 1,
    maxLevel: 1
  })

  // Emits
  const emit = defineEmits<Emits>()

  // Refs
  const height = ref<string>('0px')
  const drawerIndex = ref<number>(Date.now())
  const mkDrawer = ref()

  // Watchers
  watch(
    () => props.dialogLevel,
    () => {
      initPage()
    }
  )

  // Lifecycle
  onMounted(() => {
    if (props.modelValue) {
      initPage()
    }
  })

  // Methods
  /** 初始化页面布局 */
  const initPage = (): void => {
    const drawerElement = mkDrawer.value?.$el?.querySelector?.('.mk-drawer-contain')
    if (!drawerElement) return

    const { dialogLevel, maxLevel } = props
    const levelOffset = (dialogLevel - 1) * 12
    drawerElement.style.left = `${levelOffset}px`
    drawerElement.style.right = `${levelOffset}px`
    drawerElement.style.width = `calc(100% - ${levelOffset * 2}px)`
    drawerElement.style.height = `calc(100% - ${24 + (maxLevel - dialogLevel + 1) * 24}px)`
  }

  /** 处理打开事件 */
  const handleOpen = (): void => {
    initPage()
    emit('open')
  }

  /** 处理关闭事件 */
  const handleClose = (): void => {
    emit('close')
    emit('update:modelValue', false)
  }

  /** 处理关闭后事件 */
  const handleClosed = (): void => {
    initPage()
    emit('closed')
  }

  // 暴露方法给模板引用
  defineExpose({
    initPage
  })
</script>

<style lang="scss" scoped>
  .mk-drawer {
    top: 50px;
    background: rgb(0 0 0 / 40%);

    :deep(.mk-drawer-contain) {
      border-radius: 12px 12px 0 0;
      box-shadow: none;

      .el-drawer__header {
        height: 48px;
        padding: 12px 16px;
        margin: 0;
        font-size: 16px;
        font-weight: 500;
        color: #303133;
        box-shadow: 0 1px 0 #dddfe3;

        .el-icon-close {
          position: fixed;
          top: 61px;
          right: 11px;
          font-size: 18px;
          font-weight: 500;
          color: #fff;
        }
      }
    }
  }

  .drawer-body {
    padding: 16px 16px 0;
    overflow: auto;
  }

  .drawer-footer {
    position: absolute;
    bottom: 0;
    left: 0;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 100%;
    height: 60px;
    box-shadow: inset 0 1px 0 #f0f0f0;
  }
</style>
