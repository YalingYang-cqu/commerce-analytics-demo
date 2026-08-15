declare module '*.vue' {
  import type { componentOptions } from 'vue'
  const componentOptions: componentOptions<any>
  export default componentOptions
}

/// <reference types="vite/client" />

/** 京东 micro-app 在子应用沙箱内注入的全局变量（配合末尾 export {} 使 declare global 在 .vue 中生效） */
declare global {
  interface Window {
    /** 与基座 `<micro-app baseroute="/app1">` 对齐 */
    __MICRO_APP_BASE_ROUTE__?: string
    /** 子应用环境下存在，用于与独立运行区分 */
    __MICRO_APP_ENVIRONMENT__?: string
    __MICRO_APP_NAME__?: string
    /** micro-app 提供的真实 window，子应用内需改地址时可优先使用 */
    rawWindow?: Window
  }
}

export {}
