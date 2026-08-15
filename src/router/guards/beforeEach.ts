import type { Router, RouteLocationNormalized, NavigationGuardNext } from 'vue-router'
import { ref, nextTick } from 'vue'
import NProgress from 'nprogress'
import { store } from '@/store'
import { useSettingStore } from '@/store/modules/setting'
import { useUserStore } from '@/store/modules/user'
import { useMenuStore } from '@/store/modules/menu'
import { setWorktab } from '@/utils/navigation'
import { setPageTitle } from '../utils/utils'
import { fetchGetMenuList } from '@/api/system-manage'
import { registerDynamicRoutes } from '../utils/registerRoutes'
import { AppRouteRecord } from '@/types/router'
import { RoutesAlias } from '../routesAlias'
import { menuDataToRouter } from '../utils/menuToRouter'
import { asyncRoutes } from '../routes/asyncRoutes'
import { staticRoutes } from '../routes/staticRoutes'
import { loadingService } from '@/utils/ui'
import { useCommon } from '@/composables/useCommon'
import { useWorktabStore } from '@/store/modules/worktab'
// import { fetchGetUserInfo } from '@/api/auth'
import { getPermission } from '@/api/system-manage'
import { ApiStatus } from '@/utils/http/status'
import { HttpError, isHttpError } from '@/utils/http/error'
import { MOCK_ENABLED } from '@/mock/config'

// 是否已注册动态路由
const isRouteRegistered = ref(false)

// 跟踪是否需要关闭 loading
const pendingLoading = ref(false)

/**
 * 设置路由全局前置守卫
 */
export function setupBeforeEachGuard(router: Router): void {
  router.beforeEach(
    async (
      to: RouteLocationNormalized,
      from: RouteLocationNormalized,
      next: NavigationGuardNext
    ) => {
      try {
        await handleRouteGuard(to, from, next, router)
      } catch (error) {
        console.error('路由守卫处理失败:', error)
        next({ name: 'Exception500' })
      }
    }
  )

  // 设置后置守卫以关闭 loading 和进度条
  setupAfterEachGuard(router)
}

/**
 * 设置路由全局后置守卫
 */
function setupAfterEachGuard(router: Router): void {
  router.afterEach(() => {
    // 关闭进度条
    const settingStore = useSettingStore(store)
    if (settingStore.showNprogress) {
      NProgress.done()
    }

    // 关闭 loading 效果
    if (pendingLoading.value) {
      nextTick(() => {
        loadingService.hideLoading()
        pendingLoading.value = false
      })
    }
  })
}

/**
 * 处理路由守卫逻辑
 */
async function handleRouteGuard(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
  router: Router
): Promise<void> {
  const settingStore = useSettingStore(store)
  const userStore = useUserStore(store)

  // 处理进度条
  if (settingStore.showNprogress) {
    NProgress.start()
  }

  // 处理登录状态
  if (!(await handleLoginStatus(to, userStore, next))) {
    return
  }

  // 处理动态路由注册
  if (!isRouteRegistered.value && userStore.isLogin) {
    await handleDynamicRoutes(to, from, next, router)
    return
  }

  // 处理根路径跳转到首页
  if (userStore.isLogin && isRouteRegistered.value && handleRootPathRedirect(to, next)) {
    return
  }

  // 处理已知的匹配路由
  if (to.matched.length > 0) {
    setWorktab(to)
    setPageTitle(to)
    next()
    return
  }

  // 未匹配到路由，跳转到 404
  next({ name: 'Exception404' })
}

/**
 * 处理登录状态
 */
async function handleLoginStatus(
  to: RouteLocationNormalized,
  userStore: ReturnType<typeof useUserStore>,
  next: NavigationGuardNext
): Promise<boolean> {
  if (useCommon().isFrontendMode.value && !userStore.isLogin) {
    userStore.setLoginStatus(true)
    if (MOCK_ENABLED) {
      // Mock 模式：注入带完整权限的用户信息 + 伪 Token，
      // 使菜单可显示、v-auth 元素不被移除、字典等依赖 token 的启动逻辑得以触发。
      // 动态 import 种子，保证生产构建下整条 mock 依赖链被 tree-shaking 剔除。
      const { mockUserInfo, MOCK_ACCESS_TOKEN } = await import('@/mock/seed/permission')
      userStore.setUserInfo(mockUserInfo as any)
      userStore.setToken(MOCK_ACCESS_TOKEN)
      localStorage.setItem('userInfo', JSON.stringify(mockUserInfo))
    } else {
      // 非 Mock 的前端联调：清理可能残留的 Mock userInfo，避免切换模式时干扰真实权限加载
      localStorage.removeItem('userInfo')
      userStore.setUserInfo({ userId: 0, userName: '本地联调' } as any)
    }
  }

  // 检查是否为静态路由（通过路由 name 判断）
  const isStaticRoute = isRouteInStaticRoutes(to.path)

  if (!userStore.isLogin && to.path !== RoutesAlias.Login && !isStaticRoute) {
    userStore.logOut()
    next({ name: 'Login' })
    return false
  }
  return true
}

/**
 * 检查路由是否为静态路由
 */
function isRouteInStaticRoutes(path: string): boolean {
  const checkRoute = (routes: any[], targetPath: string): boolean => {
    return routes.some((route) => {
      // 处理动态路由参数匹配
      const routePath = route.path
      const pattern = routePath.replace(/:[^/]+/g, '[^/]+').replace(/\*/g, '.*')
      const regex = new RegExp(`^${pattern}$`)

      if (regex.test(targetPath)) {
        return true
      }
      if (route.children && route.children.length > 0) {
        return checkRoute(route.children, targetPath)
      }
      return false
    })
  }

  return checkRoute(staticRoutes, path)
}

/**
 * 处理动态路由注册
 */
async function handleDynamicRoutes(
  to: RouteLocationNormalized,
  from: RouteLocationNormalized,
  next: NavigationGuardNext,
  router: Router
): Promise<void> {
  // 如果是登录页，直接放行，不调用 fetchUserInfoIfNeeded
  if (to.path === RoutesAlias.Login) {
    next()
    return
  }

  // 显示 loading 并标记 pending
  pendingLoading.value = true
  loadingService.showLoading()

  try {
    await fetchUserInfoIfNeeded(from, router, to)

    // 从登录页进入时清空工作标签页，避免沿用旧会话的标签导致首次登录显示空白或错误页
    if (from.path === RoutesAlias.Login) {
      useWorktabStore(store).clearAll()
    }

    // 处理根路径跳转
    if (handleRootPathRedirect(to, next)) {
      return
    }

    next({
      path: to.path,
      query: to.query,
      hash: to.hash,
      replace: true
    })
  } catch (error) {
    console.error('动态路由注册失败:', error)
    // 401 错误：axios 拦截器已处理退出登录，取消当前导航即可
    if (isUnauthorizedError(error)) {
      next(false)
      return
    }

    // 其他错误：标记路由已注册（避免无限重试）
    isRouteRegistered.value = true
    next({ name: 'Exception500' })
  }
}

/**
 * 获取菜单数据
 */
async function getMenuData(router: Router, userInfo: any): Promise<void> {
  if (useCommon().isFrontendMode.value) {
    await processFrontendMenu(router, userInfo)
  } else {
    await processBackendMenu(router)
  }
}

/**
 * 处理前端控制模式的菜单逻辑
 */
async function processFrontendMenu(router: Router, userInfo: any): Promise<void> {
  const menuList = asyncRoutes.map((route) => menuDataToRouter(route))
  // const userStore = useUserStore()
  // const roles = userStore.info.roles
  const roles = userInfo?.userFuncPermission?.permissionList
  // if (!roles) {
  //   throw new Error('获取用户角色失败')
  // }

  const filteredMenuList = filterMenuByRoles(menuList, roles)
  await registerAndStoreMenu(router, filteredMenuList)
}

/**
 * 处理后端控制模式的菜单逻辑
 */
async function processBackendMenu(router: Router): Promise<void> {
  const list = await fetchGetMenuList()
  const menuList = list.map((route) => menuDataToRouter(route))
  await registerAndStoreMenu(router, menuList)
}

/**
 * 递归过滤空菜单项
 */
function filterEmptyMenus(menuList: AppRouteRecord[]): AppRouteRecord[] {
  return menuList
    .map((item) => {
      // 如果有子菜单，先递归过滤子菜单
      if (item.children && item.children.length > 0) {
        const filteredChildren = filterEmptyMenus(item.children)
        return {
          ...item,
          children: filteredChildren
        }
      }
      return item
    })
    .filter((item) => {
      // 如果定义了 children 属性（即使是空数组），说明这是一个目录菜单，应该保留
      if ('children' in item) {
        return true
      }

      // 如果有外链或 iframe，保留
      if (item.meta?.isIframe === true || item.meta?.link) {
        return true
      }

      // 如果有有效的 component，保留
      if (item.component && item.component !== '' && item.component !== RoutesAlias.Layout) {
        return true
      }

      // 其他情况过滤掉
      return false
    })
}

/**
 * 注册路由并存储菜单数据
 */
async function registerAndStoreMenu(router: Router, menuList: AppRouteRecord[]): Promise<void> {
  if (!isValidMenuList(menuList)) {
    throw new Error('获取菜单列表失败，请重新登录')
  }
  const menuStore = useMenuStore(store)
  // 递归过滤掉为空的菜单项
  const list = filterEmptyMenus(menuList)
  menuStore.setMenuList(list)
  registerDynamicRoutes(router, list)
  isRouteRegistered.value = true
  useWorktabStore(store).validateWorktabs(router)
}

/**
 * 根据角色过滤菜单
 */
const filterMenuByRoles = (
  menu: AppRouteRecord[],
  roles: string[] | undefined
): AppRouteRecord[] => {
  return menu.reduce((acc: AppRouteRecord[], item) => {
    const itemRoles = item.meta?.roles
    const hasPermission = !itemRoles || !roles || itemRoles.some((role) => roles.includes(role))

    if (hasPermission) {
      const filteredItem = { ...item }
      if (filteredItem.children?.length) {
        filteredItem.children = filterMenuByRoles(filteredItem.children, roles)
      }
      acc.push(filteredItem)
    }

    return acc
  }, [])
}

/**
 * 验证菜单列表是否有效
 */
function isValidMenuList(menuList: AppRouteRecord[]): boolean {
  return Array.isArray(menuList) && menuList.length > 0
}

/**
 * 重置路由相关状态
 */
export function resetRouterState(): void {
  isRouteRegistered.value = false
  const menuStore = useMenuStore(store)
  menuStore.removeAllDynamicRoutes()
  menuStore.setMenuList([])
}

/**
 * 处理根路径跳转到首页
 */
function handleRootPathRedirect(to: RouteLocationNormalized, next: NavigationGuardNext): boolean {
  if (to.path === '/') {
    const { homePath } = useCommon()
    if (homePath.value && homePath.value !== '/') {
      next({ path: homePath.value, replace: true })
      return true
    }
  }
  return false
}

/**
 * 获取用户信息（如果需要）
 * 登录页不请求 getPermission，避免 401
 */
async function fetchUserInfoIfNeeded(
  from: RouteLocationNormalized,
  router: Router,
  to: RouteLocationNormalized
): Promise<void> {
  const userStore = useUserStore(store)
  const isRefresh = from.path === '/'
  const needFetch = isRefresh || !userStore.info || Object.keys(userStore.info).length === 0
  let userInfo: any = userStore.info
  const { accessToken } = useUserStore(store)
  // 仅非登录页时请求权限接口
  if (needFetch && accessToken && to.path !== RoutesAlias.Login) {
    if (localStorage.getItem('userInfo')) {
      const dataC: any = JSON.parse(localStorage.getItem('userInfo') as string)
      const res = await getPermission({ userId: dataC.userId })
      dataC.userFuncPermission = res.data
      userStore.setUserInfo(dataC)
      localStorage.setItem('userInfo', JSON.stringify(dataC))
      userInfo = dataC
    }
  }
  // 获取菜单数据并注册路由
  await getMenuData(router, userInfo)
}

/**
 * 判断是否为未授权错误（401）
 */
function isUnauthorizedError(error: unknown): error is HttpError {
  return isHttpError(error) && error.code === ApiStatus.unauthorized
}
