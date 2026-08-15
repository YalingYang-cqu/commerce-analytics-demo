import request from '@/utils/http'

// spu分页列表
export function spuPageList(params: any) {
  return request.post({
    url: `/basic/product/spu/page`,
    data: params
  })
}
// spu新增
export function addSpu(params: any) {
  return request.post({
    url: `/basic/product/spu`,
    params
  })
}
// 设置负责人
export function setResponsiblePerson(params: any) {
  return request.post({
    url: `/basic/product/spu/setResponsiblePerson`,
    params
  })
}
//删除
export function deleteSpu(params: any) {
  return request.post({
    url: `/basic/product/spu/deleteBatch`,
    params
  })
}
//导出
export function exportSpu(params: any) {
  return request.exportPost({
    url: `/basic/product/spu/export`,
    params
  })
}
// 查询基础信息
export function getBasic(params: any) {
  return request.get({
    url: `/basic/product/spu/getProductSpuBasic/${params.id}`
  })
}
// 查询产品信息
export function getProducts(params: any) {
  return request.get({
    url: `/basic/product/spu/contains/${params.id}`
  })
}
// 查询财务信息
export function getFinance(params: any) {
  return request.get({
    url: `/basic/product/spu/financeInfo/${params.id}`
  })
}
// 查询合规认证
export function getCertification(params: any) {
  return request.get({
    url: `/basic/product/spu/certificationList/${params.id}`
  })
}
// 更新基本信息
export function updateProductSpuBasic(params: any) {
  return request.post({
    url: `/basic/product/spu/updateProductSpuBasic`,
    params
  })
}
// 更新财务信息
export function updateFinanceInfo(params: any) {
  return request.post({
    url: `/basic/product/spu/updateFinanceInfo`,
    params
  })
}
// 编辑合规认证
export function updateCertificationList(params: any) {
  return request.post({
    url: `/basic/product/spu/updateCertificationList`,
    params
  })
}
// 更新产品
export function updateContains(params: any) {
  return request.post({
    url: `/basic/product/spu/updateContains`,
    params
  })
}
// 查询sku
export function getSkus(params: any) {
  return request.post({
    url: `/basic/product/sku/page`,
    params
  })
}
