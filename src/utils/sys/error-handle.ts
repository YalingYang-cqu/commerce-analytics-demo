import type { App } from 'vue'

/**
 * Vue 运行时错误处理
 */
export function vueErrorHandler(err: unknown, instance: any, info: string) {
  console.error('[VueError]', err, info, instance)
  // 这里可以上报到服务端，比如：
  // reportError({ type: 'vue', err, info })
}

/**
 * 全局脚本错误处理
 * 过滤已知无害错误（如 ResizeObserver，多为 Element Plus 等 UI 库触发）
 */
export function scriptErrorHandler(
  message: Event | string,
  source?: string,
  lineno?: number,
  colno?: number,
  error?: Error
): boolean {
  const msg = typeof message === 'string' ? message : ((message as ErrorEvent)?.message ?? '')
  if (msg.includes('ResizeObserver loop completed with undelivered notifications')) {
    return true
  }
  console.error('[ScriptError]', { message, source, lineno, colno, error })
  // reportError({ type: 'script', message, source, lineno, colno, error })
  return true
}

/**
 * Promise 未捕获错误处理（带防抖，防止错误刷屏卡死DevTools）
 */
let promiseErrorTimer: NodeJS.Timeout | null = null
let promiseErrorCount = 0
export function registerPromiseErrorHandler() {
  window.addEventListener('unhandledrejection', (event) => {
    // 防抖：1秒内最多输出一次Promise错误
    if (promiseErrorTimer) {
      promiseErrorCount++
      return
    }

    console.error('[PromiseError]', event.reason)
    if (promiseErrorCount > 0) {
      console.warn(`[PromiseError] 已忽略 ${promiseErrorCount} 个重复错误`)
      promiseErrorCount = 0
    }

    promiseErrorTimer = setTimeout(() => {
      promiseErrorTimer = null
    }, 1000)

    // reportError({ type: 'promise', reason: event.reason })
  })
}

/**
 * 资源加载错误处理 (img, script, css...)
 */
export function registerResourceErrorHandler() {
  window.addEventListener(
    'error',
    (event: Event) => {
      const target = event.target as HTMLElement
      if (
        target &&
        (target.tagName === 'IMG' || target.tagName === 'SCRIPT' || target.tagName === 'LINK')
      ) {
        console.error('[ResourceError]', {
          tagName: target.tagName,
          src:
            (target as HTMLImageElement).src ||
            (target as HTMLScriptElement).src ||
            (target as HTMLLinkElement).href
        })
        // reportError({ type: 'resource', target })
      }
    },
    true // 捕获阶段才能监听到资源错误
  )
}

/**
 * 安装统一错误处理
 */
export function setupErrorHandle(app: App) {
  app.config.errorHandler = vueErrorHandler
  window.onerror = scriptErrorHandler
  registerPromiseErrorHandler()
  registerResourceErrorHandler()
}
