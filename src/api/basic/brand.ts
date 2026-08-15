import request from '@/utils/http'

//品牌分页
export function brandPageList(params: any) {
  return request.get({
    url: `/basic/productBrand/page`,
    params
  })
}
//新增
export function saveBrand(params: any) {
  return request.post({
    url: `/basic/productBrand/save`,
    params
  })
}
//导出
export function exportBrand(params: any) {
  return request.exportPost({
    url: `/basic/productBrand/export`,
    params
  })
}
//编辑
export function editBrand(params: any) {
  return request.post({
    url: `/basic/productBrand/update`,
    params
  })
}
//删除
export function deleteBrand(params: any) {
  return request.del({
    url: `/basic/productBrand/deleteBatch`,
    data: params.ids
  })
}
