import { useSettingStore } from '@/store/modules/setting'

/** 基座下发「刷新当前子应用页面」的消息类型（与主应用 charts/index.vue 约定一致） */
export const MICRO_RELOAD_CHILD_TYPE = 'RELOAD_CHILD' as const

type MicroAppInjected = {
  addDataListener?: (cb: (data: unknown) => void, autoTrigger?: boolean) => void
}

type MicroWindow = Window & {
  __MICRO_APP_ENVIRONMENT__?: unknown
  microApp?: MicroAppInjected
}

function isReloadMessage(data: unknown): boolean {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as { type?: unknown }).type === MICRO_RELOAD_CHILD_TYPE
  )
}

/**
 * 子应用监听基座下发的数据。当前仅处理「刷新当前页」：
 * 收到 RELOAD_CHILD 时调用子应用自身的 settingStore.reload()，
 * 与用户在子应用内点刷新按钮效果一致。独立运行（非 micro-app）时不生效。
 */
export function setupMicroAppReceiver(): void {
  if (typeof window === 'undefined') return
  const w = window as MicroWindow
  if (!w.__MICRO_APP_ENVIRONMENT__ || !w.microApp?.addDataListener) return

  w.microApp.addDataListener((data: unknown) => {
    if (isReloadMessage(data)) {
      useSettingStore().reload()
    }
  })
}
