import request from '@/utils/http'

// 获取所有角色
export function getAllRole() {
  return request.get({
    url: `/system/sys-role/get-all-role`
  })
}
// 添加角色
export function addRole(params: any) {
  return request.post({
    url: `/system/sys-role/add-role`,
    params
  })
}

// 编辑角色
export function editRole(params: any) {
  return request.post({
    url: `/system/sys-role/edit-role`,
    params
  })
}
// 删除角色
export function deleteRole(id: string) {
  return request.get({
    url: `/system/sys-role/remove-role/${id}`
  })
}
// 分配用户
export function addUser(params: any) {
  return request.post({
    url: `/system/sys-role/add-user`,
    params
  })
}
// 删除用户
export function removeUser(params: any) {
  return request.post({
    url: `/system/sys-role/remove-user`,
    params
  })
}
// 用户列表
export function getMemberList(params: any) {
  return request.post({
    url: `/system/sys-role/member-list`,
    params
  })
}
// 添加权限
export function addRolePermission(params: any) {
  return request.post({
    url: `/system/sys-role/add-role-permission`,
    params
  })
}
// 获取功能权限
export function getRolePermission(roleId: string | undefined) {
  return request.get({
    url: `/system/sys-role/get-role-permission/${roleId}`
  })
}
// 获取数据权限
export function getFieldPermission(roleId: string) {
  return request.post({
    url: `/system/sys-role/get-field-permission/${roleId}`
  })
}
// 添加数据权限
export function addFieldPermission(params: any) {
  return request.post({
    url: `/system/sys-role/add-field-permission`,
    params
  })
}
