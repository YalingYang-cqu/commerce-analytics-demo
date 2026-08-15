/**
 * 供应商关联用户管理 API
 * 对应后端接口模块: ERP system / login controller
 */
import request from '@/utils/http'

// API 基础路径
const BASE_URL = '/system/clbUser'

/**
 * 添加协同系统用户参数
 */
export interface AddClbUserDto {
  /** 用户名 */
  account: string
  /** 归属业务id（物流商id或供应商id） */
  belongingBusinessId: number
  /** 邮箱 */
  email?: string
  /** 密码 */
  password: string
  /** 该账号权限下拥有的业务id（物流商id或供应商id） */
  permissionBusinessIds?: number[]
  /** 手机号 */
  phone?: string
  /** 状态：0-开启，1-禁用 */
  status?: 0 | 1
  /** 账号类型：0-供应商账号，1-物流商账号 */
  type: 0 | 1
  /** 真实姓名 */
  userName: string
}

/**
 * 修改密码参数
 */
export interface ChangePasswordDto {
  /** 确认密码 */
  confirmPassword: string
  /** 新密码 */
  password: string
  /** 用户ID */
  userId: number
}

/**
 * 协同系统用户详情
 */
export interface ClbUserDetail {
  /** 用户ID */
  id: number
  /** 用户名 */
  account: string
  /** 归属业务id（物流商id或供应商id） */
  belongingBusinessId: number
  /** 邮箱 */
  email?: string
  /** 该账号权限下拥有的业务id（物流商id或供应商id） */
  permissionBusinessIds?: number[]
  /** 手机号 */
  phone?: string
  /** 状态：0-开启，1-禁用 */
  status: 0 | 1
  /** 账号类型：0-供应商账号，1-物流商账号 */
  type: 0 | 1
  /** 真实姓名 */
  userName: string
  /** 创建时间 */
  createTime?: string
  /** 更新时间 */
  updateTime?: string
}

/**
 * 添加协同系统用户（供应商/物流商）
 * POST /system/clbUser/add
 */
export function addClbUser(data: AddClbUserDto) {
  return request.post<any>({
    url: `${BASE_URL}/add`,
    data,
    showSuccessMessage: true
  })
}

/**
 * 修改协同系统用户密码
 * POST /system/clbUser/changePassword
 */
export function changeClbUserPassword(data: ChangePasswordDto) {
  return request.post<any>({
    url: `${BASE_URL}/changePassword`,
    data,
    showSuccessMessage: true
  })
}

/**
 * 根据ID查询协同系统用户详情
 * GET /system/clbUser/{id}
 */
export function getClbUserById(id: number) {
  return request.get<ClbUserDetail>({
    url: `${BASE_URL}/${id}`
  })
}

/**
 * 根据归属业务ID查询协同系统用户列表
 * GET /system/clbUser/list/{belongingBusinessId}
 * @param belongingBusinessId 归属业务ID（供应商ID或物流商ID）
 */
export function listClbUserByBelongingBusinessId(belongingBusinessId: number) {
  return request.get<ClbUserDetail[]>({
    url: `${BASE_URL}/list/${belongingBusinessId}`
  })
}

/**
 * 编辑协同系统用户（供应商/物流商）
 * 注意：API文档中未明确显示编辑接口，这里基于新增接口推测
 * 如果后端有专门的编辑接口，请更新此方法
 */
export function editClbUser(data: AddClbUserDto & { id: number }) {
  return request.post<any>({
    url: `${BASE_URL}/edit`,
    data,
    showSuccessMessage: true
  })
}

/**
 * 删除协同系统用户
 * DELETE /system/clbUser/delete/{id}
 */
export function deleteClbUser(id: number) {
  return request.del<any>({
    url: `${BASE_URL}/delete/${id}`,
    showSuccessMessage: true
  })
}

// 用户状态选项
export const USER_STATUS_OPTIONS = [
  { label: '开启', value: 0 },
  { label: '禁用', value: 1 }
]

// 用户类型选项
export const USER_TYPE_OPTIONS = [
  { label: '供应商账号', value: 0 },
  { label: '物流商账号', value: 1 }
]

// 状态映射
export const STATUS_MAP: Record<number, string> = {
  0: '开启',
  1: '禁用'
}

// 类型映射
export const TYPE_MAP: Record<number, string> = {
  0: '供应商账号',
  1: '物流商账号'
}
