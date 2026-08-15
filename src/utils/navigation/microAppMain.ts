import { EventCenterForMicroApp } from '@micro-zoe/micro-app'
import type { LocationQueryRaw } from 'vue-router'
import { router } from '@/router'

/** micro-app 沙箱内取真实宿主 window（与 store/user getOuterWindow 一致） */
export function getMicroAppOuterWindow(): Window {
  try {
    const win = window as Window & { rawWindow?: Window }
    if (win.rawWindow) return win.rawWindow
    if (window.top && window.top !== window) return window.top
  } catch {
    /* 跨域 iframe 等无法访问 top */
  }
  return window
}

export interface NavigateToMainAppPageOptions {
  /** 发给基座 dispatch 的消息类型，默认 JUMP_TO_MAIN */
  dispatchType?: string
  /**
   * URL query，与 Vue Router 一致；会拼到 hash 上，如 /a/b + { id: '1' } -> #/a/b?id=1
   * 同时会放进 dispatch payload，便于基座 addDataListener 里用 router.replace 还原
   */
  query?: LocationQueryRaw
  /**
   * 额外塞进 dispatch payload 的字段（如 source、meta），不会自动拼进浏览器 hash
   */
  payload?: Record<string, unknown>
}

function normalizePath(path: string): string {
  return path.startsWith('/') ? path : `/${path}`
}

/** 将 LocationQueryRaw 转为 ?a=1&b=2（与常见 hash 路由一致） */
function serializeQueryToSearch(query: LocationQueryRaw): string {
  const sp = new URLSearchParams()
  for (const [key, val] of Object.entries(query)) {
    if (val === undefined || val === null) continue
    if (Array.isArray(val)) {
      for (const item of val) {
        if (item === undefined || item === null) continue
        sp.append(key, String(item))
      }
    } else {
      sp.append(key, String(val))
    }
  }
  const s = sp.toString()
  return s ? `?${s}` : ''
}

/** 得到 hash 内路径段：/product/brand 或 /product/brand?id=1 */
export function buildMainAppHashLocation(path: string, query?: LocationQueryRaw): string {
  const p = normalizePath(path)
  if (!query || Object.keys(query).length === 0) return p
  return `${p}${serializeQueryToSearch(query)}`
}

function toRouterPushTarget(
  pathOnly: string,
  query?: LocationQueryRaw
): string | { path: string; query: LocationQueryRaw } {
  if (query && Object.keys(query).length > 0) {
    return { path: pathOnly, query }
  }
  return pathOnly
}

/**
 * 从 micro-app 子应用跳到主应用 hash 路由；独立运行时走本应用 router.push。
 *
 * @param targetPath 路径，如 `/product/brand`（不要自带 `?`，query 请用第二参数）
 * @param options.query hash 上的查询参数
 * @param options.payload 仅发给基座 dispatch，不写入地址栏
 * @param options.dispatchType 自定义事件类型
 *
 * @example
 * navigateToMainAppPage('/product/brand')
 * navigateToMainAppPage('/product/brand', { query: { id: '1', tab: 'info' } })
 * navigateToMainAppPage('/order/list', { query: { status: '1' }, payload: { from: 'sku' } })
 */
export function navigateToMainAppPage(
  targetPath: string,
  options?: NavigateToMainAppPageOptions
): void {
  const pathOnly = normalizePath(targetPath)
  const query = options?.query
  const hashBody = buildMainAppHashLocation(pathOnly, query)
  const dispatchType = options?.dispatchType ?? 'JUMP_TO_MAIN'
  const w = window as Window & {
    __MICRO_APP_ENVIRONMENT__?: unknown
    __MICRO_APP_NAME__?: string
  }

  const dispatchPayload: Record<string, unknown> = {
    path: pathOnly,
    ...(query && Object.keys(query).length > 0 ? { query } : {}),
    ...(options?.payload ?? {})
  }

  if (w.__MICRO_APP_ENVIRONMENT__) {
    if (w.__MICRO_APP_NAME__) {
      const ec = new EventCenterForMicroApp(w.__MICRO_APP_NAME__)
      ec.dispatch({
        type: dispatchType,
        payload: dispatchPayload
      })
    }
    const outer = getMicroAppOuterWindow()
    if (outer !== window) {
      try {
        outer.location.hash = `#${hashBody}`
      } catch {
        void router.push(toRouterPushTarget(pathOnly, query))
      }
    } else {
      void router.push(toRouterPushTarget(pathOnly, query))
    }
    return
  }
  void router.push(toRouterPushTarget(pathOnly, query))
}
