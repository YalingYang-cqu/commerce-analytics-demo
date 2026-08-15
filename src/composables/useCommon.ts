import { getTabConfig } from '@/utils/ui'
import { useSettingStore } from '@/store/modules/setting'
import { useMenuStore } from '@/store/modules/menu'
import { MOCK_ENABLED } from '@/mock/config'

// 通用函数
export function useCommon() {
  const settingStore = useSettingStore()
  const { tabStyle } = storeToRefs(settingStore)

  // 是否是前端控制模式
  const isFrontendMode = computed(() => {
    const mode = import.meta.env.VITE_ACCESS_MODE
    // 未显式配置 VITE_ACCESS_MODE 时（如纯前端 Mock Demo 部署，未注入 .env），
    // 开启 Mock 则默认走前端控制模式，自动登录并使用本地 Mock 数据，避免卡在登录页。
    if (!mode) return MOCK_ENABLED
    return mode === 'frontend'
  })

  // 首页路径
  const homePath = computed(() => useMenuStore().getHomePath())

  // 刷新页面
  const refresh = () => {
    settingStore.reload()
  }

  // 回到顶部
  const scrollToTop = () => {
    const scrollContainer = document.getElementById('app-main')
    if (scrollContainer) {
      scrollContainer.scrollTop = 0
    }
  }

  // 页面最小高度
  const containerMinHeight = computed(() => {
    const { closeHeight } = getTabConfig(tabStyle.value)
    return `calc(100vh - ${closeHeight}px-40px)`
  })

  // 设置容器高度CSS变量
  const setContainerHeightCssVar = () => {
    const height = containerMinHeight.value
    document.documentElement.style.setProperty('--art-full-height', height)
  }

  // 监听容器高度变化并更新CSS变量
  watchEffect(() => {
    setContainerHeightCssVar()
  })

  return {
    isFrontendMode,
    homePath,
    refresh,
    scrollToTop,
    containerMinHeight,
    setContainerHeightCssVar
  }
}
