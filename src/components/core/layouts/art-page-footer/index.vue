<template>
  <div class="art-page-footer" :style="{ left: `${menuWidth}px` }">
    <ElSpace>
      <slot>
        <ElButton v-if="showCancel" v-auth="cancelAuth" @click="handleCancel">取消</ElButton>
        <ElButton
          v-if="showSave"
          v-auth="saveAuth"
          @click="handleSave"
          :loading="loadingS"
          :disabled="isButtonDisabled"
          >{{ saveText }}</ElButton
        >
        <ElButton
          v-if="showSubmit"
          v-auth="submitAuth"
          type="primary"
          :loading="loading"
          @click="handleSubmit"
          :disabled="isButtonDisabled"
          >{{ confirmText }}</ElButton
        >
      </slot>
    </ElSpace>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { useSettingStore } from '@/store/modules/setting'
  import { storeToRefs } from 'pinia'
  import { MenuWidth, MenuTypeEnum } from '@/enums/appEnum'

  interface Props {
    /** 是否显示取消按钮 */
    showCancel?: boolean
    /** 是否显示暂存按钮 */
    showSave?: boolean
    /** 是否显示提交按钮 */
    showSubmit?: boolean
    /** 提交按钮 loading */
    loading?: boolean
    /** 暂存按钮 loading */
    loadingS?: boolean
    /** 禁用暂存、提交（与 loading 叠加；勿依赖根节点透传 disabled，须显式传入） */
    disabled?: boolean
    confirmText?: string
    /** 左侧保存/暂存按钮文案，默认「暂存」 */
    saveText?: string
    /** 可选：取消按钮权限码（不传则不校验） */
    cancelAuth?: string
    /** 可选：保存/暂存按钮权限码 */
    saveAuth?: string
    /** 可选：提交按钮权限码 */
    submitAuth?: string
  }

  interface Emits {
    (e: 'cancel'): void
    (e: 'save'): void
    (e: 'submit'): void
  }

  const props = withDefaults(defineProps<Props>(), {
    showCancel: true,
    showSave: true,
    showSubmit: true,
    loading: false,
    loadingS: false,
    disabled: false,
    confirmText: '提交',
    saveText: '暂存',
    cancelAuth: undefined,
    saveAuth: undefined,
    submitAuth: undefined
  })

  const isButtonDisabled = computed(() => props.loading || props.loadingS || props.disabled)

  const emit = defineEmits<Emits>()

  // 获取菜单状态
  const settingStore = useSettingStore()
  const { menuOpen, menuOpenWidth, menuType } = storeToRefs(settingStore)

  // 计算菜单宽度（用于调整底部按钮位置）
  const menuWidth = computed(() => {
    // 只有在左侧菜单或顶部左侧菜单时才需要调整
    const isLeftMenu =
      menuType.value === MenuTypeEnum.LEFT || menuType.value === MenuTypeEnum.TOP_LEFT
    if (!isLeftMenu) {
      return 0
    }
    return menuOpen.value ? menuOpenWidth.value : parseInt(MenuWidth.CLOSE)
  })

  // 取消
  const handleCancel = () => {
    emit('cancel')
  }

  // 暂存
  const handleSave = () => {
    emit('save')
  }

  // 提交
  const handleSubmit = () => {
    emit('submit')
  }
</script>

<style lang="scss" scoped>
  .art-page-footer {
    position: fixed;
    right: 0;
    bottom: 0;
    z-index: 100;
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    padding: 16px 24px;
    background: #fff;
    border-top: 1px solid #e4e7ed;
    box-shadow: 0 -2px 8px rgb(0 0 0 / 10%);
    // left 值通过内联样式动态设置
  }
</style>
