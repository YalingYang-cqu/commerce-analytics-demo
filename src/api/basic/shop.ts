import request from '@/utils/http'
// 店铺列表
export function listStore(params: any) {
  return request.post({
    url: `/basic/StoreManage/listStore`,
    params
  })
}
// 删除
export function deleteStore(params: any) {
  return request.get({
    url: `/basic/StoreManage/deleteStore/${params.id}`,
    params
  })
}
// 提交/暂存
export function saveShop(params: any) {
  return request.post({
    url: `/basic/StoreManage/save`,
    params
  })
}
// 获取基本信息
export function getBasic(params: any) {
  return request.get({
    url: `/basic/StoreManage/getStoreBasic/${params.id}`
  })
}
// 获取店铺商业保险信息
export function getStoreBusinessInsurance(params: any) {
  return request.get({
    url: `/basic/StoreManage/getStoreBusinessInsurance/${params.id}`
  })
}
// 获取店铺信用卡信息
export function getStoreCreditCard(params: any) {
  return request.get({
    url: `/basic/StoreManage/getStoreCreditCard/${params.id}`
  })
}
// 获取店铺登录邮箱信息
export function getStoreLoginInfo(params: any) {
  return request.get({
    url: `/basic/StoreManage/getStoreLoginInfo/${params.id}`
  })
}
// 获取店铺登录邮箱信息
export function getStoreReceivingAccount(params: any) {
  return request.get({
    url: `/basic/StoreManage/getStoreReceivingAccount/${params.id}`
  })
}
// 编辑基本信息
export function editStoreBasic(params: any) {
  return request.post({
    url: `/basic/StoreManage/editStoreBasic`,
    params
  })
}
// 编辑商业保险信息
export function editStoreBusinessInsurance(params: any) {
  return request.post({
    url: `/basic/StoreManage/editStoreBusinessInsurance`,
    params
  })
}
// 编辑信用卡信息
export function editStoreCreditCard(params: any) {
  return request.post({
    url: `/basic/StoreManage/editStoreCreditCard`,
    params
  })
}
// 编辑登录信息
export function editStoreLoginInfo(params: any) {
  return request.post({
    url: `/basic/StoreManage/editStoreLoginInfo`,
    params
  })
}
// 编辑收款账户信息
export function editStoreReceivingAccount(params: any) {
  return request.post({
    url: `/basic/StoreManage/editStoreReceivingAccount`,
    params
  })
}
// 导出
export function exportStore(params: any) {
  return request.exportPost({
    url: `/basic/StoreManage/export`,
    params
  })
}
// 访问日志
export function getAccessLog(params: any) {
  return request.post({
    url: `/basic/StoreManage/getAccessLog`,
    params
  })
}
// 撤回
export function revokeApproval(params: any) {
  return request.post({
    url: `/basic/StoreManage/revokeApproval`,
    params
  })
}
