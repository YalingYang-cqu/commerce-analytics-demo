<template>
  <div class="app-layout" :class="{ 'app-layout--micro-sub': isMicroSubApp }">
    <aside v-if="!isMicroSubApp" class="app-sidebar">
      <ArtSidebarMenu />
    </aside>

    <main id="app-main">
      <div v-if="!isMicroSubApp" class="app-header">
        <ArtHeaderBar />
      </div>
      <div class="app-content">
        <ArtPageContent />
      </div>
    </main>

    <div class="app-global">
      <ArtGlobalComponent />
    </div>
  </div>
</template>

<script setup lang="ts">
  defineOptions({ name: 'AppLayout' })

  /** 作为京东 micro-app 子应用嵌入时隐藏基座式侧栏/顶栏 */
  const isMicroSubApp = computed(() => {
    if (typeof window === 'undefined') return false
    const w = window as Window & { __MICRO_APP_ENVIRONMENT__?: unknown }
    return Boolean(w.__MICRO_APP_ENVIRONMENT__)
  })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
