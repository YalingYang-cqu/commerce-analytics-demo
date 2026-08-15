import request from '@/utils/http'

// 获取所有部门
export function getAllDept(params?: any) {
  return request.get({
    url: '/system/sys-dept/getAllDept',
    params
  })
}
// 获取部门
export function getDept(params: any) {
  return request.get({
    url: '/system/sys-dept/get-dept',
    params
  })
}

// 获取负责人
export function getAllUserInfo() {
  return request.get({
    url: `/system/sys-user/getAllUserInfo`
  })
}

// 添加部门
export function addDept(params: any) {
  return request.post({
    url: `/system/sys-dept/add-dept`,
    params
  })
}
// 设置负责人
export function setLeader(params: any) {
  return request.post({
    url: `/system/sys-dept/set-leader`,
    params
  })
}
// 编辑部门
export function editDept(params: any) {
  return request.post({
    url: `/system/sys-dept/edit-dept`,
    params
  })
}
// 删除部门
export function deleteDept(id: string) {
  return request.get({
    url: `/system/sys-dept/delete-dept/${id}`
  })
}
// 成员列表
export function getMemberList(params: string) {
  return request.post({
    url: `/system/sys-dept/member-list`,
    params
  })
}
// 删除成员
export function deleteMember(params: any) {
  return request.post({
    url: `/system/sys-dept/remove-member`,
    params
  })
}
// 添加成员
export function addMember(params: any) {
  return request.post({
    url: `/system/sys-dept/add-member`,
    params
  })
}
// 分配用户列表
export function getMemberListF(params: any) {
  return request.post({
    url: `/system/sys-dept/get-member-list`,
    params
  })
}
