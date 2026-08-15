<template>
  <ElConfigProvider size="default" :locale="currentLocale" :z-index="3000">
    <RouterView></RouterView>
    <DetailDialogProvider />
  </ElConfigProvider>
</template>

<script setup lang="ts">
  import { computed, onBeforeMount, onMounted } from 'vue'
  import { storeToRefs } from 'pinia'
  // import { useRoute } from 'vue-router'
  import { useUserStore } from './store/modules/user'
  import zh from 'element-plus/es/locale/lang/zh-cn'
  import en from 'element-plus/es/locale/lang/en'
  import { systemUpgrade } from './utils/sys'

  import { setThemeTransitionClass } from './utils/theme/animation'
  import { setupMicroAppReceiver } from './utils/navigation/microAppReceiver'
  import { checkStorageCompatibility } from './utils/storage'
  import { useDictStore } from './store/modules/dict'
  import DetailDialogProvider from '@/components/core/bussiness/detail-dialog-provider.vue'
  // import { RoutesAlias } from './router/routesAlias'
  import Cookies from 'js-cookie'

  const userStore = useUserStore()
  const { language } = storeToRefs(userStore)
  const dictStore = useDictStore()
  // const route = useRoute()
  const isDev = import.meta.env.MODE === 'development'
  const locales: Record<'zh' | 'en', typeof zh> = {
    zh: zh,
    en: en
  }
  const currentLocale = computed(() => locales[language.value as 'zh' | 'en'])

  onBeforeMount(() => {
    setThemeTransitionClass(true)
    if (isDev && !Cookies.get(`${window.location.port}proxy`)) {
      Cookies.set(`${window.location.port}proxy`, '/api1,/api1,/api1,/api1,/api1,/api1,/api1')
    }
  })
  const getDict = () => {
    const { accessToken } = useUserStore()
    // 如果不是登录页面，获取字典数据
    if (accessToken) {
      dictStore.getDictData()
    } else {
      setTimeout(() => {
        getDict()
      }, 1000)
    }
  }
  onMounted(() => {
    // 检查存储兼容性
    checkStorageCompatibility()
    // 提升暗黑主题下页面刷新视觉体验
    setThemeTransitionClass(false)
    // 系统升级
    systemUpgrade()
    getDict()
    // 监听基座下发的数据（如主应用点刷新 → 刷新当前子应用页面）
    setupMicroAppReceiver()
  })
</script>
