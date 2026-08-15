import { useSettingStore } from '@/store/modules/setting'
import { store } from '@/store'
import { Router } from 'vue-router'
import NProgress from 'nprogress'
import { useCommon } from '@/composables/useCommon'

/** 路由全局后置守卫 */
export function setupAfterEachGuard(router: Router) {
  router.afterEach(() => {
    useCommon().scrollToTop()
    if (useSettingStore(store).showNprogress) NProgress.done()
  })
}
