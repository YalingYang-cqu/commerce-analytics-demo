import type { App } from 'vue'
import { createRouter, createWebHashHistory } from 'vue-router'
import { staticRoutes } from './routes/staticRoutes'
import { configureNProgress } from './utils/utils'
import { setupBeforeEachGuard } from './guards/beforeEach'
import { setupAfterEachGuard } from './guards/afterEach'

/** micro-app 基座通过 baseroute 注入；独立运行时用 Vite 的 BASE_URL（与 VITE_BASE_URL 一致） */
function resolveHashRouterBase(): string {
  const microBase = typeof window !== 'undefined' ? window.__MICRO_APP_BASE_ROUTE__ : undefined
  if (microBase != null && microBase !== '') {
    return microBase
  }
  return import.meta.env.BASE_URL
}

// 创建路由实例
export const router = createRouter({
  history: createWebHashHistory(resolveHashRouterBase()),
  routes: staticRoutes // 静态路由
})

// 初始化路由
export function initRouter(app: App<Element>): void {
  configureNProgress() // 顶部进度条
  setupBeforeEachGuard(router) // 路由前置守卫
  setupAfterEachGuard(router) // 路由后置守卫
  app.use(router)
}

// 主页路径，默认使用菜单第一个有效路径，本地联调可通过 VITE_HOME_PAGE_PATH 指定。
export const HOME_PAGE_PATH = import.meta.env.VITE_HOME_PAGE_PATH || ''
