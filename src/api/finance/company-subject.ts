import request from '@/utils/http'

// 公司主体分页列表
export function companyPageList(params: any) {
  return request.post({
    url: `/basic/companySubject/page`,
    params
  })
}

// 新增公司主体
export function saveCompany(params: any) {
  return request.post({
    url: `/basic/companySubject/save`,
    params
  })
}

// 编辑公司主体
export function editCompany(params: any) {
  return request.post({
    url: `/basic/companySubject/update`,
    params
  })
}

// 删除公司主体
export function deleteCompany(params: any) {
  return request.post({
    url: `/basic/companySubject/deleteBatch`,
    params
  })
}

// 获取公司主体信息
export function getByIdCompany(id: number | string) {
  return request.get({
    url: `/basic/companySubject/getById/${id}`
  })
}

// 导出公司主体
export function exportCompany(params: any) {
  return request.exportPost({
    url: `/basic/companySubject/export`,
    params
  })
}
// 撤回
export function cancelSubmit(params: any) {
  return request.get({
    url: `/basic/companySubject/cancelSubmit/${params.id}`,
    params
  })
}
