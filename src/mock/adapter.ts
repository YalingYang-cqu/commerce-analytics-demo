/**
 * 本地 Mock 适配器：在开发 + Mock 模式下替换 axios 的 transport adapter，
 * 使所有请求不发往网络，直接返回本地 Mock 数据（结构与真实后端一致：{ code, msg, data }）。
 *
 * 优点：无需逐个改业务 API 函数；开关关闭时（VITE_USE_MOCK=false）自动回退真实 xhr adapter。
 */
import type { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { hasMock, resolveMock } from './handlers'

/** 模拟网络延迟（ms），便于观察 loading 态 */
const MOCK_LATENCY = 200

/** 合并 query 与 body 参数（body 在请求拦截器中已被 JSON.stringify） */
function readParams(config: InternalAxiosRequestConfig): Record<string, any> {
  let body: Record<string, any> = {}
  if (config.data) {
    try {
      body = typeof config.data === 'string' ? JSON.parse(config.data) : config.data
    } catch {
      body = {}
    }
  }
  return { ...(config.params || {}), ...body }
}

export function installMockAdapter(instance: AxiosInstance): void {
  instance.defaults.adapter = (config: InternalAxiosRequestConfig) => {
    const url = config.url || ''
    const params = readParams(config)
    const matched = hasMock(url)
    const payload = matched ? resolveMock(url, params) : undefined

    const body = matched
      ? { code: 200, msg: 'success', data: payload }
      : { code: 200, msg: 'mock:未匹配接口，已返回空数据', data: { records: [], total: 0 } }

    if (!matched && import.meta.env.MODE === 'development') {
      console.warn('[mock] 未匹配的接口，返回空数据：', url)
    }

    return new Promise<AxiosResponse>((resolve) => {
      setTimeout(() => {
        resolve({
          data:
            config.responseType === 'blob'
              ? (new Blob([JSON.stringify(body)], { type: 'application/json' }) as unknown as any)
              : body,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
          request: {}
        })
      }, MOCK_LATENCY)
    })
  }
}
