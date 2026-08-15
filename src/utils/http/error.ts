import { AxiosError } from 'axios'
import { ApiStatus } from './status'
import { $t } from '@/locales'

// 错误响应接口
export interface ErrorResponse {
  code: number
  msg: string
  data?: unknown
}

// 错误日志数据接口
export interface ErrorLogData {
  code: number
  message: string
  data?: unknown
  timestamp: string
  url?: string
  method?: string
  stack?: string
}

// 自定义 HttpError 类
export class HttpError extends Error {
  public readonly code: number
  public readonly data?: unknown
  public readonly timestamp: string
  public readonly url?: string
  public readonly method?: string
  /** 错误消息是否已由 HTTP 层展示，用于避免业务层重复提示 */
  public messageShown?: boolean

  constructor(
    message: string,
    code: number,
    options?: {
      data?: unknown
      url?: string
      method?: string
    }
  ) {
    super(message)
    this.name = 'HttpError'
    this.code = code
    this.data = options?.data
    this.timestamp = new Date().toISOString()
    this.url = options?.url
    this.method = options?.method
  }

  public toLogData(): ErrorLogData {
    return {
      code: this.code,
      message: this.message,
      data: this.data,
      timestamp: this.timestamp,
      url: this.url,
      method: this.method,
      stack: this.stack
    }
  }
}

/**
 * 获取错误消息
 * @param status 错误状态码
 * @returns 错误消息
 */
const getErrorMessage = (status: number): string => {
  const errorMap: Record<number, string> = {
    [ApiStatus.unauthorized]: 'httpMsg.unauthorized',
    [ApiStatus.forbidden]: 'httpMsg.forbidden',
    [ApiStatus.notFound]: 'httpMsg.notFound',
    [ApiStatus.methodNotAllowed]: 'httpMsg.methodNotAllowed',
    [ApiStatus.requestTimeout]: 'httpMsg.requestTimeout',
    [ApiStatus.internalServerError]: 'httpMsg.internalServerError',
    [ApiStatus.badGateway]: 'httpMsg.badGateway',
    [ApiStatus.serviceUnavailable]: 'httpMsg.serviceUnavailable',
    [ApiStatus.gatewayTimeout]: 'httpMsg.gatewayTimeout'
  }

  return $t(errorMap[status] || 'httpMsg.internalServerError')
}

/**
 * 处理错误
 * @param error 错误对象
 * @returns 错误对象
 */
export function handleError(error: AxiosError<ErrorResponse>): never {
  // 处理取消的请求
  if (error.code === 'ERR_CANCELED') {
    console.warn('Request cancelled:', error.message)
    throw new HttpError($t('httpMsg.requestCancelled'), ApiStatus.error)
  }

  const statusCode = error.response?.status
  const errorMessage = error.response?.data?.msg || error.message
  const requestConfig = error.config

  // 处理网络错误
  if (!error.response) {
    throw new HttpError($t('httpMsg.networkError'), ApiStatus.error, {
      url: requestConfig?.url,
      method: requestConfig?.method?.toUpperCase()
    })
  }

  // 处理 HTTP 状态码错误
  const message = statusCode
    ? getErrorMessage(statusCode)
    : errorMessage || $t('httpMsg.requestFailed')
  throw new HttpError(message, statusCode || ApiStatus.error, {
    data: error.response.data,
    url: requestConfig?.url,
    method: requestConfig?.method?.toUpperCase()
  })
}

// HTTP错误日志计数器（防止开发环境日志刷屏导致DevTools卡死）
declare global {
  interface Window {
    __httpErrorCount__?: number
    __httpErrorTimer__?: NodeJS.Timeout
  }
}

/**
 * 显示错误消息
 * @param error 错误对象
 * @param showMessage 是否显示错误消息
 */
export function showError(error: HttpError, showMessage: boolean = true): void {
  if (showMessage) {
    ElMessage.error(error.message)
    error.messageShown = true
  }
  // 记录错误日志（开发环境限制日志数量，防止DevTools卡死）
  const isDev = import.meta.env.DEV
  if (!isDev) {
    console.error('[HTTP Error]', error.toLogData())
  } else {
    // 开发环境：限制错误日志数量和频率
    window.__httpErrorCount__ = window.__httpErrorCount__ || 0
    if (window.__httpErrorCount__ < 50) {
      console.error('[HTTP Error]', error.toLogData())
      window.__httpErrorCount__++

      // 5秒后重置计数器
      if (window.__httpErrorTimer__) clearTimeout(window.__httpErrorTimer__)
      window.__httpErrorTimer__ = setTimeout(() => {
        window.__httpErrorCount__ = 0
      }, 5000)
    } else if (window.__httpErrorCount__ === 50) {
      console.warn('[HTTP Error] 错误日志过多，已暂停输出。5秒后恢复。')
      window.__httpErrorCount__++
    }
  }
}

/**
 * 显示成功消息
 * @param message 成功消息
 * @param showMessage 是否显示消息
 */
export function showSuccess(message: string, showMessage: boolean = true): void {
  if (showMessage) {
    ElMessage.success(message)
  }
}

/**
 * 判断是否为 HttpError 类型
 * @param error 错误对象
 * @returns 是否为 HttpError 类型
 */
export const isHttpError = (error: unknown): error is HttpError => {
  return error instanceof HttpError
}
