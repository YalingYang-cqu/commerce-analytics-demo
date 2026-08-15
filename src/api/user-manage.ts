/*
 * Portfolio demo
 * @Date: 2025-01-XX
 * @Description: 用户管理相关接口
 */
import request from '@/utils/http'

// Mock 数据导入（开发环境使用）
// 默认在开发环境启用Mock，可通过 VITE_USE_MOCK=false 禁用
const USE_MOCK =
  import.meta.env.MODE === 'development' &&
  (import.meta.env.VITE_USE_MOCK === 'true' || import.meta.env.VITE_USE_MOCK === undefined)

// 开发环境提示
if (USE_MOCK && import.meta.env.MODE === 'development') {
  console.log('✅ Mock 数据已启用 - 用户管理接口将使用模拟数据')
}

/**
 * 用户列表查询参数
 */
export interface UserListParams {
  currentPage?: number
  pageSize?: number
  userName?: string
  realName?: string
  userPhone?: string
  userEmail?: string
  roleIds?: (string | number)[]
  statusList?: (string | number)[]
  createTimeStart?: string
  createTimeEnd?: string
  updateTimeStart?: string
  updateTimeEnd?: string
  orderBy?: string
  order?: 'asc' | 'desc'
}

/**
 * 用户数据项接口
 */
export interface UserItem {
  id: number | string
  userName: string
  userPhone: string
  userGender: string
  userEmail?: string
  status: number | string
  deptId?: number
  deptName?: string
  roleIds?: number[] | string[]
  roleNames?: string
  createTime?: string
  updateTime?: string
  realName?: string
  avatar?: string
}

/**
 * 新增/编辑用户参数
 */
export interface UserFormData {
  id?: number | string
  userName: string
  realName?: string
  userPhone: string
  userGender?: string
  userEmail?: string
  userRoles?: string[] | number[]
  roleIds?: string[] | number[]
  deptId?: number
  deptIds?: number[] | string[]
  position?: string
  employeeNo?: string
  dataPermGroupIds?: number[] | string[]
  password?: string
  forceChangePassword?: boolean
  status?: number
}

/**
 * 查询用户列表（新接口）
 * POST /system/user/getUserList
 */
export interface GetUserListParams {
  account?: string
  createTimeFrom?: string
  createTimeTo?: string
  currentPage?: number
  email?: string
  hasCount?: boolean
  orderBy?: string
  pageSize?: number
  roleIdList?: number[]
  updateTimeFrom?: string
  updateTimeTo?: string
  userName?: string
  userStateList?: number[]
}

export interface GetUserListResponseItem {
  account: string
  createTime: string
  dataPermGroup: string
  dept: string
  deptLeader: string
  email: string
  feishuId: string
  id: number
  lingxingId: string
  phoneNum: string
  post: string
  role: string
  status: number
  updateTime: string
  userName: string
  userNum: string
}

export function getUserListAPI(params: GetUserListParams) {
  return request.post<{
    count: GetUserListResponseItem
    dtoList: GetUserListResponseItem[]
    total: number
  }>({
    url: '/system/user/getUserList',
    data: params
  })
}

/**
 * 查询用户列表（旧接口，保留兼容性）
 * POST /system/user/list
 */
export function fetchUserList(params: UserListParams) {
  if (USE_MOCK) {
    return import('@/mock/user-manage').then((mockApi) => {
      return mockApi.mockFetchUserList(params).then((data: any) => {
        // Mock 数据需要模拟 request.post 的返回格式
        // request.post 返回的是 res.data，即 { code, msg, data }
        // 但 useTable 的 responseAdapter 接收的是整个响应对象
        return {
          code: 200,
          msg: 'success',
          data
        }
      })
    })
  }
  return request.post<{
    records: UserItem[]
    total: number
    current: number
    size: number
  }>({
    url: '/system/user/list',
    data: params
  })
}

/**
 * 获取用户详情
 * GET /system/user/detail/{userId}
 */
export function getUserDetail(userId: string | number) {
  if (USE_MOCK) {
    return import('@/mock/user-manage').then((mockApi) => {
      return mockApi.mockGetUserDetail(userId).then((data: any) => ({
        code: 200,
        msg: 'success',
        data
      }))
    })
  }
  return request.get<UserItem>({
    url: `/system/user/detail/${userId}`
  })
}

/**
 * 新增用户
 * POST /system/user/add
 */
export function addUser(data: UserFormData) {
  if (USE_MOCK) {
    return import('@/mock/user-manage').then((mockApi) => {
      return mockApi
        .mockAddUser(data)
        .then((result: any) => ({
          code: 200,
          msg: result.msg || '添加成功',
          data: result
        }))
        .catch((error: Error) => ({
          code: 400,
          msg: error.message || '添加失败',
          data: null
        }))
    })
  }
  return request.post<Record<string, any>>({
    url: '/system/user/addUser',
    data
  })
}

/**
 * 更新用户
 * PUT /system/user/update
 */
export function updateUser(data: UserFormData) {
  if (USE_MOCK) {
    return import('@/mock/user-manage').then((mockApi) => {
      return mockApi
        .mockUpdateUser(data)
        .then((result: any) => ({
          code: 200,
          msg: result.msg || '更新成功',
          data: result
        }))
        .catch((error: Error) => ({
          code: 400,
          msg: error.message || '更新失败',
          data: null
        }))
    })
  }
  return request.post<Record<string, any>>({
    url: '/system/user/updateUser',
    data
  })
}

/**
 * 更新用户
 * PUT /system/user/update
 */
export function updateUserDepts(data: any) {
  return request.put<Record<string, any>>({
    url: '/system/user/addUserDepts',
    data
  })
}

/**
 * 删除用户
 * DELETE /system/user/delete/{userId}
 */
export function deleteUser(userId: string | number) {
  if (USE_MOCK) {
    return import('@/mock/user-manage').then((mockApi) => {
      return mockApi.mockDeleteUser(userId).then((result: any) => ({
        code: 200,
        msg: result.msg || '删除成功',
        data: result
      }))
    })
  }
  return request.del<Record<string, any>>({
    url: `/system/user/delete/${userId}`
  })
}

/**
 * 批量删除用户
 * DELETE /system/user/batchDelete
 */
export function batchDeleteUser(userIds: (string | number)[]) {
  if (USE_MOCK) {
    return import('@/mock/user-manage').then((mockApi) => {
      return mockApi.mockBatchDeleteUser(userIds).then((result: any) => ({
        code: 200,
        msg: result.msg || '批量删除成功',
        data: result
      }))
    })
  }
  return request.del<Record<string, any>>({
    url: '/system/user/batchDelete',
    data: { userIds }
  })
}

/**
 * 更新用户状态
 * PUT /system/user/updateStatus
 */
export function updateUserStatus(userId: string | number, status: string | number) {
  if (USE_MOCK) {
    return import('@/mock/user-manage').then((mockApi) => {
      return mockApi.mockUpdateUserStatus(userId, status).then((result: any) => ({
        code: 200,
        msg: result.msg || '状态更新成功',
        data: result
      }))
    })
  }
  return request.put<Record<string, any>>({
    url: '/system/user/updateStatus',
    data: { userIdList: [userId], status }
  })
}

/**
 * 重置用户密码
 * PUT /system/user/resetPassword
 */
export function resetUserPassword(userId: string | number, password: string) {
  return request.put<Record<string, any>>({
    url: '/system/user/updatePassword',
    data: { id: userId, newPassword: password }
  })
}

/**
 * 获取角色列表（用于用户角色选择）
 * GET /system/role/list
 */
export function fetchRoleList() {
  if (USE_MOCK) {
    return import('@/mock/user-manage').then((mockApi) => {
      return mockApi.mockFetchRoleList().then((data: any) => ({
        code: 200,
        msg: 'success',
        data
      }))
    })
  }
  return request.get<Array<{ id: number | string; roleName: string; roleCode?: string }>>({
    url: '/system/sys-role/get-all-role'
  })
}

/**
 * 获取部门列表（用于用户部门选择）
 * GET /system/sys-dept/getAllDept
 */
export function fetchDeptList() {
  if (USE_MOCK) {
    return import('@/mock/user-manage').then((mockApi) => {
      return mockApi.mockFetchDeptList().then((data: any) => ({
        code: 200,
        msg: 'success',
        data
      }))
    })
  }
  return request.get<Array<{ id: number; deptName: string; parentId?: number }>>({
    url: '/system/sys-dept/getAllDept'
  })
}

/**
 * 批量更新用户状态
 * PUT /system/user/batchUpdateStatus
 */
export function batchUpdateUserStatus(userIds: (string | number)[], status: string | number) {
  if (USE_MOCK) {
    return import('@/mock/user-manage').then((mockApi) => {
      return mockApi.mockBatchUpdateUserStatus(userIds, status).then((result: any) => ({
        code: 200,
        msg: result.msg || '批量更新状态成功',
        data: result
      }))
    })
  }
  return request.put<Record<string, any>>({
    url: '/system/user/updateStatus',
    data: { userIdList: userIds, status }
  })
}

/**
 * 批量分配角色
 * PUT /system/user/batchAssignRoles
 */
export function batchAssignRoles(userIds: (string | number)[], roleIds: (string | number)[]) {
  if (USE_MOCK) {
    return import('@/mock/user-manage').then((mockApi) => {
      return mockApi.mockBatchAssignRoles(userIds, roleIds).then((result: any) => ({
        code: 200,
        msg: result.msg || '批量分配角色成功',
        data: result
      }))
    })
  }
  return request.put<Record<string, any>>({
    url: '/system/user/addUserRoles',
    data: { userId: userIds, roleIds }
  })
}

/**
 * 批量分配部门
 * PUT /system/user/batchAssignDept
 */
export function batchAssignDept(userIds: (string | number)[], deptId: number) {
  if (USE_MOCK) {
    return import('@/mock/user-manage').then((mockApi) => {
      return mockApi.mockBatchAssignDept(userIds, deptId).then((result: any) => ({
        code: 200,
        msg: result.msg || '批量分配部门成功',
        data: result
      }))
    })
  }
  return request.put<Record<string, any>>({
    url: '/system/user/batchAssignDept',
    data: { userIds, deptId }
  })
}

/**
 * 导出用户列表
 * POST /system/user/export
 */
export function exportUserList(params: UserListParams) {
  return request.post<Blob>({
    url: '/system/user/getUserListExport',
    data: params,
    responseType: 'blob'
  })
}

/**
 * 导入用户
 * POST /system/user/import
 */
export function importUsers(file: File) {
  const formData = new FormData()
  formData.append('file', file)
  return request.post<{
    success: number
    fail: number
    message?: string
  }>({
    url: '/system/user/import',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}

/**
 * 下载导入模板
 * GET /system/user/importTemplate
 */
export function downloadImportTemplate() {
  return request.get<Blob>({
    url: '/system/user/importTemplate',
    responseType: 'blob'
  })
}

/**
 * 领星账号配对
 * POST /system/user/lingxing/pair
 */
export interface LingxingPairParams {
  userId: number
  username: string
}

export function lingxingPairAPI(data: LingxingPairParams) {
  return request.post<Record<string, any>>({
    url: '/system/user/lingxing/pair',
    data
  })
}

/**
 * 领星单点登录（SSO）
 * POST /system/user/lingxing/sso
 */
export function lingxingSSOAPI() {
  return request.post<string>({
    url: '/system/user/lingxing/sso'
  })
}
