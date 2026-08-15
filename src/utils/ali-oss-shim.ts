/**
 * ali-oss 由 CDN 加载，暴露为 window.OSS
 * 避免 bundler 解析 ali-oss/dist/aliyun-oss-sdk.js 报 Expression expected
 */
declare global {
  interface Window {
    OSS?: new (opts: any) => any
  }
}

export default (typeof window !== 'undefined' ? (window as Window).OSS : null) as any
