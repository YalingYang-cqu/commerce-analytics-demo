import request from '@/utils/http'

//获取属性分页
export function properPageList(params: any) {
  return request.post({
    url: `/basic/productAttribute/pageList`,
    params
  })
}
//保存属性
export function saveProperty(params: any) {
  return request.post({
    url: `/basic/productAttribute/save`,
    params
  })
}
//导出
export function exportProperty(params: any) {
  return request.exportPost({
    url: `/basic/productAttribute/export`,
    params
  })
}
//编辑
export function editProperty(params: any) {
  return request.post({
    url: `/basic/productAttribute/edit`,
    params
  })
}
//删除
export function deleteProperty(params: any) {
  return request.get({
    url: `/basic/productAttribute/delete/${params.id}`
  })
}
