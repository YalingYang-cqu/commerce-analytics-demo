/*
 * Portfolio demo
 * @Date: 2025-12-05 18:23:51
 * Company-specific metadata removed
 * @LastEditTime: 2025-12-09 10:01:25
 * @FilePath: src/api/login.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from '@/utils/http'

/**
 * 获取公钥
 */
export function getPubkeyApi() {
  return request.get<Record<string, string | number>>({
    url: '/apis/system/pubkey',
    method: 'get'
  })
}

/**
 * 用户登录
 */
export function LoginInApi(data: { account: string; password: string; systemType: string }) {
  return request.post<Record<string, string | number>>({
    url: '/apis/system/login',
    method: 'post',
    data
  })
}

/**
 * 刷新用户信息
 */
export function flushUserApi(data: { account: string }) {
  return request.get<Record<string, string | number>>({
    url: 'system/user/flushUser',
    method: 'post',
    data
  })
}

/**
 * TK刷新用户信息
 */
export function tKflushUserApi(params: { account: string }) {
  return request.get<Record<string, string | number>>({
    url: '/tiktok/power/flushUserTk',
    method: 'get',
    params
  })
}

/**
 * 忘记密码 - 验证账号
 */
export function pwdRetreiveAccountApi(data: { param: string }) {
  return request.get<Record<string, string | number>>({
    url: '/system/pwd/retreive/account',
    method: 'post',
    data
  })
}

/**
 * 忘记密码 - 发送验证码
 */
export function pwdRetreiveCodeApi(data: FormData) {
  return request.post<Record<string, string | number>>({
    url: '/system/pwd/retreive/code',
    method: 'post',
    data,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 忘记密码 - 重置密码
 */
export function pwdRetreiveResetApi(data: { account: string; code: string; password: string }) {
  return request.post<Record<string, string | number>>({
    url: '/system/pwd/retreive/reset',
    method: 'post',
    data
  })
}

/**
 * 飞书扫码登录
 */
export function feishuCodeLoginApi(data: { code: string }) {
  return request.post<Record<string, string | number>>({
    url: '/system/openapi/third/login',
    method: 'get',
    data
  })
}
