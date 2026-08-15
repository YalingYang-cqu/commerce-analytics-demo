<!-- 布局内容 -->
<template>
  <div class="layout-content" :class="{ 'no-basic-layout': isFullPage }" :style="containerStyle">
    <!-- 节日滚动 -->
    <ArtFestivalTextScroll v-if="!isFullPage" />

    <RouterView v-if="isRefresh" v-slot="{ Component, route }" :style="contentStyle">
      <!-- 路由信息调试 -->
      <div v-if="isOpenRouteInfo === 'true'" class="route-info">
        router meta：{{ route.meta }}
      </div>

      <!-- 单 Transition 包裹，避免 keepAlive / 非 keepAlive 双分支切换时页面不更新 -->
      <Transition :name="showTransitionMask ? '' : actualTransition" mode="out-in" appear>
        <KeepAlive v-if="route.meta.keepAlive && Component" :max="10" :exclude="keepAliveExclude">
          <component
            class="art-page-view"
            :is="Component"
            :key="route.path + JSON.stringify(route.query)"
          />
        </KeepAlive>
        <component v-else-if="Component" class="art-page-view" :is="Component" :key="route.path" />
      </Transition>
    </RouterView>
    <!-- 全屏页面切换过渡遮罩（用于提升页面切换视觉体验） -->
    <Teleport to="body">
      <div v-show="showTransitionMask" class="full-page-mask" />
    </Teleport>
  </div>
</template>
<script setup lang="ts">
  import '@/assets/styles/transition.scss'
  import type { CSSProperties } from 'vue'
  import { useRoute } from 'vue-router'
  import { useCommon } from '@/composables/useCommon'
  import { useSettingStore } from '@/store/modules/setting'
  import { useWorktabStore } from '@/store/modules/worktab'

  defineOptions({ name: 'ArtPageContent' })

  const route = useRoute()
  const { containerMinHeight } = useCommon()
  const { pageTransition, containerWidth, refresh } = storeToRefs(useSettingStore())
  const { keepAliveExclude } = storeToRefs(useWorktabStore())

  const isRefresh = shallowRef(true)
  const isOpenRouteInfo = import.meta.env.VITE_OPEN_ROUTE_INFO
  const showTransitionMask = ref(false)

  /** micro-app 子应用：关闭路由级 Transition，减少嵌套沙箱内的重绘与闪烁 */
  const isMicroSubApp = computed(() => {
    if (typeof window === 'undefined') return false
    const w = window as Window & { __MICRO_APP_ENVIRONMENT__?: unknown }
    return Boolean(w.__MICRO_APP_ENVIRONMENT__)
  })

  // 检查当前路由是否需要使用无基础布局模式
  const isFullPage = computed(() => route.matched.some((r) => r.meta?.isFullPage))
  const prevIsFullPage = ref(isFullPage.value)

  // 切换动画名称：从全屏返回时不使用动画；子应用下始终无动画
  const actualTransition = computed(() => {
    if (isMicroSubApp.value) return ''
    return prevIsFullPage.value && !isFullPage.value ? '' : pageTransition.value
  })

  // 监听全屏状态变化，显示过渡遮罩（子应用下不使用遮罩）
  watch(isFullPage, (val, oldVal) => {
    if (val !== oldVal) {
      if (!isMicroSubApp.value) {
        showTransitionMask.value = true
        setTimeout(() => {
          showTransitionMask.value = false
        }, 50)
      }

      nextTick(() => {
        prevIsFullPage.value = val
      })
    }
  })

  const containerStyle = computed((): CSSProperties => {
    if (isFullPage.value) {
      return {
        position: 'fixed',
        top: 0,
        left: 0,
        width: '100%',
        height: '100vh',
        zIndex: 2500,
        background: 'var(--art-bg-color)'
      }
    }
    // 子应用（非独立运行）下铺满宽度，避免被容器宽度设置（如 1200px）限制
    if (isMicroSubApp.value) {
      return {
        width: '100%',
        maxWidth: '100%'
      }
    }
    return {
      maxWidth: containerWidth.value
    }
  })

  const contentStyle = computed(
    (): CSSProperties => ({
      minHeight: containerMinHeight.value
    })
  )

  const reload = () => {
    isRefresh.value = false
    nextTick(() => {
      isRefresh.value = true
    })
  }

  watch(refresh, reload, { flush: 'post' })
</script>

<style lang="scss" scoped>
  .layout-content {
    &.no-basic-layout {
      overflow: auto;
    }
  }

  .route-info {
    padding: 6px 8px;
    margin-bottom: 12px;
    font-size: 14px;
    color: var(--art-gray-600);
    background: var(--art-gray-200);
    border: 1px solid var(--art-border-dashed-color);
    border-radius: 6px;
  }

  .full-page-mask {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 2000;
    width: 100vw;
    height: 100vh;
    pointer-events: none;
    background-color: var(--art-main-bg-color);
  }
</style>
