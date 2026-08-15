import axios, { AxiosRequestConfig, AxiosResponse, InternalAxiosRequestConfig } from 'axios'
import { useUserStore } from '@/store/modules/user'
import { ApiStatus } from './status'
import { HttpError, handleError, showError, showSuccess } from './error'
import { $t } from '@/locales'
import Cookies from 'js-cookie'
/** 请求配置常量 */
const REQUEST_TIMEOUT = 15000
const LOGOUT_DELAY = 500
const MAX_RETRIES = 0
const RETRY_DELAY = 1000
const UNAUTHORIZED_DEBOUNCE_TIME = 3000

/** 401防抖状态 */
let isUnauthorizedErrorShown = false
let unauthorizedTimer: NodeJS.Timeout | null = null

/** 递归处理数据，去除字符串类型值的首尾空格 */
function trimStringValues(data: any): any {
  if (data === null || data === undefined) {
    return data
  }

  // 字符串类型，去除首尾空格
  if (typeof data === 'string') {
    return data.trim()
  }

  // 数组类型，递归处理每个元素
  if (Array.isArray(data)) {
    return data.map((item) => trimStringValues(item))
  }

  // 对象类型，递归处理每个属性
  if (typeof data === 'object') {
    const trimmed: any = {}
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        trimmed[key] = trimStringValues(data[key])
      }
    }
    return trimmed
  }

  // 其他类型直接返回
  return data
}

/** 扩展 AxiosRequestConfig */
interface ExtendedAxiosRequestConfig extends AxiosRequestConfig {
  showErrorMessage?: boolean
  showSuccessMessage?: boolean
}

const { VITE_API_URL, VITE_API_URL_APP, VITE_WITH_CREDENTIALS, MODE } = import.meta.env
const isDev = MODE === 'development'
/** 是否运行在 micro-app 主应用内：有该标志=主应用嵌入，无=独立运行 */
const isMicroApp = !!(window as unknown as { __MICRO_APP_ENVIRONMENT__?: unknown })
  .__MICRO_APP_ENVIRONMENT__
/** 生产环境 baseURL：主应用嵌入用 VITE_API_URL，独立运行用 VITE_API_URL_APP */
const prodBaseURL = isMicroApp ? `${VITE_API_URL}/api/` : `${VITE_API_URL_APP}/api/`
/** Axios实例 */
const axiosInstance = axios.create({
  timeout: REQUEST_TIMEOUT,
  baseURL: isDev ? '/' : prodBaseURL,
  withCredentials: VITE_WITH_CREDENTIALS === 'true',
  validateStatus: (status) => status >= 200 && status < 300,
  transformResponse: [
    (data, headers) => {
      const contentType = headers['content-type']
      if (contentType?.includes('application/json')) {
        try {
          return JSON.parse(data)
        } catch {
          return data
        }
      }
      return data
    }
  ]
})

/** 请求拦截器 */
axiosInstance.interceptors.request.use(
  (request: InternalAxiosRequestConfig) => {
    const { accessToken } = useUserStore()
    if (accessToken) request.headers.set('Authorization', accessToken)
    const url: string | undefined = request.url
    let newUrl: string | undefined = url // 默认使用原始 URL，避免生产环境 URL 被清空
    if (isDev) {
      const nowProxy: any = Cookies.get(`${window.location.port}proxy`)?.split(',')
      // nowProxy 数组 第一个是system， 第二个是/basic ，第三个是/oss-service
      if (url && url.indexOf('/apis') > -1) {
        newUrl = `${url}`
      } else if (url && url.indexOf('/system') > -1) {
        // 业务
        newUrl = `${nowProxy[0]}${url}`
      } else if (url && url.indexOf('/basic') > -1) {
        // 业务
        newUrl = `${nowProxy[1]}${url}`
      } else if (url && url.indexOf('/oss-service') > -1) {
        newUrl = `${nowProxy[2]}${url}`
      } else if (url && url.indexOf('/pms') > -1) {
        // 业务
        newUrl = `${nowProxy[3]}${url}`
      } else if (url && url.indexOf('/tms') > -1) {
        // 业务
        newUrl = `${nowProxy[4]}${url}`
      } else if (url && url.indexOf('/wms') > -1) {
        // 业务
        newUrl = `${nowProxy[5]}${url}`
      } else if (url && url.indexOf('/ims') > -1) {
        // IMS：库存/入出库单等（Cookie 第 7 段；旧环境仅 6 段时回退 WMS 前缀）
        const imsPrefix = nowProxy?.[6] ?? nowProxy?.[5]
        newUrl = imsPrefix ? `${imsPrefix}${url}` : url
      } else {
        // 其他
        newUrl = url
      }
      // else if (url && url.indexOf('/old-service') > -1) {
      //   const newU: string = url.replace('/old-service','/api/system')
      //   alert(newU)
      //   newUrl = `${nowProxy[2]}${newU}`
      // }
    } else {
      newUrl = url?.replace('/apis', '')
    }
    // 处理请求数据：去除字符串类型值的首尾空格
    if (request.data && !(request.data instanceof FormData)) {
      request.data = trimStringValues(request.data)
    }
    if (request.data && !(request.data instanceof FormData) && !request.headers['Content-Type']) {
      request.headers.set('Content-Type', 'application/json')
      request.data = JSON.stringify(request.data)
    }
    request.url = newUrl
    return request
  },
  (error) => {
    showError(createHttpError($t('httpMsg.requestConfigError'), ApiStatus.error))
    return Promise.reject(error)
  }
)

/** 响应拦截器 */
axiosInstance.interceptors.response.use(
  (response: AxiosResponse<Http.BaseResponse>) => {
    if (response?.config?.responseType === 'blob') {
      return response
    } else {
      const { code, msg } = response.data
      if (code === ApiStatus.success) return response
      if (code === ApiStatus.unauthorized) handleUnauthorizedError(msg)
      throw createHttpError(msg || $t('httpMsg.requestFailed'), code)
    }
  },
  (error) => {
    if (error.response?.status === ApiStatus.unauthorized) handleUnauthorizedError()
    return Promise.reject(handleError(error))
  }
)

/** 统一创建HttpError */
function createHttpError(message: string, code: number) {
  return new HttpError(message, code)
}

/** 处理401错误（带防抖） */
function handleUnauthorizedError(message?: string): never {
  const error = createHttpError(message || $t('httpMsg.unauthorized'), ApiStatus.unauthorized)

  if (!isUnauthorizedErrorShown) {
    isUnauthorizedErrorShown = true
    logOut()

    unauthorizedTimer = setTimeout(resetUnauthorizedError, UNAUTHORIZED_DEBOUNCE_TIME)

    showError(error, true)
    throw error
  }

  throw error
}

/** 重置401防抖状态 */
function resetUnauthorizedError() {
  isUnauthorizedErrorShown = false
  if (unauthorizedTimer) clearTimeout(unauthorizedTimer)
  unauthorizedTimer = null
}

/** 退出登录函数 */
function logOut() {
  setTimeout(() => {
    useUserStore().logOut()
  }, LOGOUT_DELAY)
}

/** 是否需要重试 */
function shouldRetry(statusCode: number) {
  return [
    ApiStatus.requestTimeout,
    ApiStatus.internalServerError,
    ApiStatus.badGateway,
    ApiStatus.serviceUnavailable,
    ApiStatus.gatewayTimeout
  ].includes(statusCode)
}

/** 请求重试逻辑 */
async function retryRequest<T>(
  config: ExtendedAxiosRequestConfig,
  retries: number = MAX_RETRIES
): Promise<T> {
  try {
    return await request<T>(config)
  } catch (error) {
    if (retries > 0 && error instanceof HttpError && shouldRetry(error.code)) {
      await delay(RETRY_DELAY)
      return retryRequest<T>(config, retries - 1)
    }
    throw error
  }
}

/** 延迟函数 */
function delay(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/** 请求函数 */
async function request<T = any>(config: ExtendedAxiosRequestConfig): Promise<T> {
  // POST | PUT | PATCH 参数自动填充
  if (
    ['POST', 'PUT', 'PATCH'].includes(config.method?.toUpperCase() || '') &&
    config.params &&
    !config.data
  ) {
    config.data = config.params
    config.params = undefined
  }

  try {
    const res = await axiosInstance.request<Http.BaseResponse<T>>(config)

    // 显示成功消息
    if (config.showSuccessMessage && res.data.msg) {
      showSuccess(res.data.msg)
    }

    return config?.responseType === 'blob' ? (res as T) : (res.data as T)
  } catch (error) {
    if (error instanceof HttpError && error.code !== ApiStatus.unauthorized) {
      const showMsg = config.showErrorMessage !== false
      showError(error, showMsg)
    }
    return Promise.reject(error)
  }
}

/** API方法集合 */
const api = {
  get<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'GET' })
  },
  post<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'POST' })
  },
  put<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'PUT' })
  },
  patch<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'PATCH' })
  },
  del<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, method: 'DELETE' })
  },
  exportGet<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, getResponse: true, responseType: 'blob', method: 'GET' })
  },
  exportPost<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>({ ...config, getResponse: true, responseType: 'blob', method: 'POST' })
  },
  request<T>(config: ExtendedAxiosRequestConfig) {
    return retryRequest<T>(config)
  }
}

/** 暴露底层 axios 实例，供开发环境 Mock 适配器安装使用（生产环境不引用） */
export { axiosInstance }

export default api
