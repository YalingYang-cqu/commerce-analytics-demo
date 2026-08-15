import request from '@/utils/http'

// 产品分类树
export function categoryPageList(params: any) {
  return request.post({
    url: `/basic/productCategory/tree`,
    params
  })
}
//新增
export function saveCategory(params: any) {
  return request.post({
    url: `/basic/productCategory/save`,
    params
  })
}
//导出
export function exportCategory(params: any) {
  return request.exportPost({
    url: `/basic/productCategory/export`,
    params
  })
}
//编辑
export function editCategory(params: any) {
  return request.post({
    url: `/basic/productCategory/update`,
    params
  })
}
//删除
export function deleteCategory(params: any) {
  return request.get({
    url: `/basic/productCategory/delete/${params.id}`
  })
}
