import request from '@/utils/http'

// 商品分页列表
export function goodsPageList(params: any) {
  return request.post({
    url: `/basic/amazon/product/list`,
    params
  })
}
//导出
export function exportGoods(params: any) {
  return request.exportPost({
    url: `/basic/amazon/product/export`,
    params
  })
}
//关联亚马逊商品与本地SKU
export function associateGoods(params: any) {
  return request.post({
    url: `/basic/amazon/product/associate`,
    params
  })
}
//解除关联亚马逊商品与本地SKU
export function disassociateeGoods(params: any) {
  return request.post({
    url: `/basic/amazon/product/disassociate`,
    params
  })
}
//设置销售负责人
export function setSalesManager(params: any) {
  return request.post({
    url: `/basic/amazon/product/setSalesManager`,
    params
  })
}
//搜索本地SKU
export function searchLocalSku(params: any) {
  return request.get({
    url: `/basic/amazon/product/searchLocalSku`,
    params
  })
}
