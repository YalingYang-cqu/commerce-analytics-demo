import request from '@/utils/http'
import { Api } from '@/typings/api'

/**
 * 用户信息相关API
 */

/**
 * 获取用户列表
 */
export function fetchGetUserList(params: {
  current: number
  size: number
  userName?: string
  userGender?: string
  userPhone?: string
  userEmail?: string
  status?: string
}) {
  return request.get<Record<string, any>>({
    url: '/system/user/list',
    params
  })
}

/**
 * 获取角色列表
 */
export function fetchRoleList() {
  return request.get<Api.SystemManage.RoleListItem[]>({
    url: '/system/role/list'
  })
}

/**
 * 新增用户
 */
export function addUserApi(data: {
  userName: string
  userPhone: string
  userGender: string
  userEmail?: string
  userRoles: string[]
}) {
  return request.post<Record<string, any>>({
    url: '/system/user/add',
    data
  })
}

/**
 * 更新用户
 */
export function updateUserApi(data: {
  id: string
  userName: string
  userPhone: string
  userGender: string
  userEmail?: string
  userRoles: string[]
}) {
  return request.put<Record<string, any>>({
    url: '/system/user/update',
    data
  })
}

/**
 * 删除用户
 */
export function deleteUserApi(userId: string) {
  return request.del<Record<string, any>>({
    url: `/system/user/delete/${userId}`
  })
}

/**
 * 获取用户详情
 */
export function getUserDetailApi(userId: string) {
  return request.get<Api.SystemManage.UserListItem>({
    url: `/system/user/detail/${userId}`
  })
}

/**
 * 批量删除用户
 */
export function batchDeleteUserApi(userIds: string[]) {
  return request.del<Record<string, any>>({
    url: '/system/user/batchDelete',
    data: { userIds }
  })
}

/**
 * 更新用户状态
 */
// export function updateUserStatusApi(userId: string, status: string) {
//   return request.put<Record<string, any>>({
//     url: '/system/user/updateStatus',
//     data: { userId, status }
//   })
// }

/**
 * 获取所有用户信息
 */
export function getAllUserInfo(params?: any) {
  return request.get<
    Array<{
      id: number
      status: number
      userName: string
    }>
  >({
    url: '/system/sys-user/getAllUserInfo',
    params
  })
}
