import request from '@/utils/http'
import { AppRouteRecord } from '@/types/router'
import { RoleForm } from '@/views/account-center/personal-center.vue'
import { Api } from '@/typings/api'

// 获取用户列表
// export function fetchGetUserList(params: Api.SystemManage.UserSearchParams) {
//   return request.get<Api.SystemManage.UserList>({
//     url: '/api/user/list',
//     params
//   })
// }

// // 获取角色列表
// export function fetchGetRoleList(params: Api.SystemManage.RoleSearchParams) {
//   return request.get<Api.SystemManage.RoleList>({
//     url: '/api/role/list',
//     params
//   })
// }

// // 获取角色用户列表
// export function fetchGetRoleUserList(params: Api.SystemManage.RoleSearchParams) {
//   return request.get<Api.SystemManage.RoleList>({
//     url: '/api/role/list',
//     params
//   })
// }

// // 获取菜单列表
export function fetchGetMenuList() {
  return request.get<AppRouteRecord[]>({
    url: '/api/system/menus/simple'
  })
}

// 获取字典列表
export function fetchDictList(params: Api.SystemManage.DictSearchParams) {
  return request.post<Api.SystemManage.DictList>({
    url: '/system/sys-dict/page',
    params
  })
}
// 新增字典列表
export function saveDictList(params: Api.SystemManage.DictListItem) {
  return request.post<Api.SystemManage.DictList>({
    url: '/system/sys-dict/save',
    params
  })
}
// 编辑字典列表
export function editDictList(params: Api.SystemManage.DictListItem) {
  return request.post<Api.SystemManage.DictList>({
    url: '/system/sys-dict/edit',
    params
  })
}
// 删除字典
export function deleteDict(params: Api.SystemManage.DictListItem) {
  return request.get<Api.SystemManage.DictList>({
    url: `/system/sys-dict/delete/${params.dictCode}`
  })
}

// 获取字典项列表
export function fetchDictItemList(params: Api.SystemManage.DictSearchParams) {
  return request.get<Api.SystemManage.DictList>({
    url: `/system/sys-dict/getByDictCode/${params.dictCode}`
  })
}
// 新增字典项
export function saveDictItem(params: Api.SystemManage.DictListItem) {
  return request.post<Api.SystemManage.DictList>({
    url: '/system/sys-dict/save-detail',
    params
  })
}
// 编辑字典项
export function editDictItem(params: Api.SystemManage.DictListItem) {
  return request.post<Api.SystemManage.DictList>({
    url: '/system/sys-dict/edit-detail',
    params
  })
}
// 删除字典
export function deleteDictItem(params: Api.SystemManage.DictListItem) {
  return request.get<Api.SystemManage.DictList>({
    url: `/system/sys-dict/delete-item/${params.id}`
  })
}
// 获取字典
export function getDictCache() {
  return request.get({
    url: `/system/sys-dict/getDictCache`
  })
}
// *获取oss令牌*/
export function getOssSts() {
  return request.post({
    url: '/system/oss/getSts'
  })
}
/* 编辑用户 */
export function updateSelfApi(params: any) {
  return request.put<RoleForm>({
    url: '/system/user/updateSelf',
    params
  })
}

/* 获取用户习惯 */
export function getHabitsApi(params: string) {
  return request.get({
    url: `/system/sys-user/getHabits/${params}`
  })
}

/* 保存用户习惯 */
export function saveUserHabitsApi(data: Api.SystemManage.userHabits) {
  return request.put({
    url: '/system/sys-user/saveUserHabits',
    data
  })
}

/* 获取店铺下拉 */
export function dropdownAccountApi(data: Api.SystemManage.requestCountyParam) {
  return request.post<Api.SystemManage.responseSellerList>({
    url: 'common-business/dropdown/account',
    data
  })
}

/* 获取店铺下拉 */
export function dropdownCampaignList(data: Api.SystemManage.requestCurrencyList) {
  return request.post({
    url: 'common-business/dropdown/project',
    data
  })
}

/* 获取店铺下拉 */
export function dropdownGroupList(data: Api.SystemManage.requestAdvGroupList) {
  return request.post({
    url: 'common-business/dropdown/getGroupList',
    data
  })
}

/**
 * 发送下载请求， 调用下载中心接口
 * */
export function sendDownLoadCommand(data: Api.SystemManage.sendDownLoadCommand) {
  return request.post<Record<string, string | number>>({
    url: '/mq/mqcommon/sendDownLoadCommand',
    data
  })
}

/**
 * 下拉 - 项目品牌
 * */
export function dropdownChargerApi() {
  return request.post<Record<string, string | number>>({
    url: '/apis/basic/supplier/list',
    params: {}
  })
}

/**
 * 查询 - 分类
 */
export function searchCategoryTreeApi() {
  return request.post<Record<string, any>>({
    url: 'product/category/searchCategoryTree',
    data: {}
  })
}

/**
 * 查询 - 品牌
 */
export function searchBrandListApi() {
  return request.post<Record<string, string | number>>({
    url: 'product/brand/searchBrandList',
    data: {}
  })
}

/**
 * 查询 - 核算主体
 */
export function getCompanyListApi(params: Api.SystemManage.CompanyList) {
  return request.get<Api.SystemManage.CompanyListResponse>({
    url: '/system/company/getCompanyList',
    params
  })
}

/**
 * 查询-币种
 * */
export function dropdownProjectApi() {
  return request.get<Record<string, string | number>>({
    url: '/common-business/dropdown/project',
    params: {}
  })
}
export function dropdownCurrencyApi() {
  return request.get<Record<string, string | number>>({
    url: '/system/dropdown/currency',
    params: {}
  })
}
export function dropdownCurrencyApiN() {
  return request.get<Record<string, string | number>>({
    url: '/basic/currency/listEnabled',
    params: {}
  })
}
// 查询国家
export function dropdownCountry() {
  return request.get<Record<string, string | number>>({
    url: '/system/dropdown/country',
    params: {}
  })
}
// 操作日志
export function getOptLog(data: any) {
  return request.post<Record<string, any>>({
    url: '/system/sys-dict/getOptLog',
    data
  })
}
// 获取权限
export function getPermission(params: any) {
  return request.get<Record<string, any>>({
    url: `/system/sys-role/get-user-permission/${params.userId}`
  })
}
// 查询所有国家
export function dropdownAllCountry() {
  return request.get<Record<string, string | number>>({
    url: '/system/dropdown/all-country',
    params: {}
  })
}

/** 中国行政区划 DTO（省/市/区） */
export interface ChinaRegionDTO {
  id: number
  level: number
  name: string
  parentId: number
  sort?: number
}

/** 获取中国省份/直辖市/自治区（一级） */
export function getChinaRegionProvinces() {
  return request.get<ChinaRegionDTO[]>({
    url: '/system/dropdown/china-region/provinces'
  })
}

/** 根据父级ID获取下级行政区划（省->市，市->区） */
export function getChinaRegionChildren(parentId: number) {
  return request.get<ChinaRegionDTO[]>({
    url: `/system/dropdown/china-region/children/${parentId}`
  })
}

/** 根据ID获取行政区划详情（用于回显） */
export function getChinaRegionById(id: number) {
  return request.get<ChinaRegionDTO>({
    url: `/system/dropdown/china-region/${id}`
  })
}

/** 洲下国家项（用于七大洲接口） */
export interface CountrySelectionResp {
  id?: number
  countryCn?: string
  countryName?: string
  shortCountryName?: string
  continentCn?: string
  continentEn?: string
  moneyCode?: string
  symbol?: string
}

/** 七大洲项（含该洲下国家列表） */
export interface ContinentDTO {
  continentCn: string
  continentEn: string
  countries: CountrySelectionResp[]
}

/** 获取七大洲列表（用于洲/国家二级联动第一级） */
export function getContinents() {
  return request.get<ContinentDTO[]>({
    url: '/system/dropdown/continents'
  })
}

/** 根据洲英文名获取该洲下国家列表（用于洲/国家二级联动第二级） */
export function getCountriesByContinent(continentEn: string) {
  return request.get<CountrySelectionResp[]>({
    url: `/system/dropdown/continents/${encodeURIComponent(continentEn)}/countries`
  })
}

/**
 * 飞书审批文件上传
 * @param file - 文件对象
 * @param fileType - 文件类型: image, attachment, attachmentV2
 * @returns { code, data, msg, success }，其中 data 为飞书文件 code
 */
export function uploadFeishuApprovalFile(file: File, fileType: string = 'image') {
  const formData = new FormData()
  formData.append('file', file)
  formData.append('fileType', fileType)

  return request.post<{ code: number; data: string; msg: string; success: boolean }>({
    url: '/system/feishu/uploadApprovalFile',
    data: formData,
    headers: {
      'Content-Type': 'multipart/form-data'
    }
  })
}
// 获取店铺
export function getAllStoreInfo(data: any) {
  return request.post<Record<string, any>>({
    url: '/basic/StoreManage/getAllStoreInfo',
    data
  })
}
// 获取店铺根据国家编码
export function listByCountryCode(data: any) {
  return request.post<Record<string, any>>({
    url: '/basic/amazon/product/stores/listByCountryCodes',
    data
  })
}
// 飞书群信息接口
export interface ChatInfoDTO {
  avatar: string
  chatId: string
  description: string
  external: boolean
  name: string
  ownerId: string
  ownerIdType: string
  tenantKey: string
}

// 获取所有飞书群列表
export function getFeishuChatList() {
  return request.get<ChatInfoDTO[]>({
    url: '/system/feishu/chat/list'
  })
}
// 异步任务
export function getExportTask(params: any) {
  return request.post<Record<string, any>>({
    url: `/system/export-task/page`,
    params
  })
}
