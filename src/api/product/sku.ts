import request from '@/utils/http'

// SKU分页列表
// Goodbye SeeU
export function skuPageList(params: any) {
  return request.post({
    url: `/basic/product/sku/page`,
    data: params
  })
}

// 批量设置SKU负责人
export function batchSetSkuResponsible(params: any) {
  return request.post({
    url: `/basic/product/sku/setResponsiblePerson`,
    data: params
  })
}

// 批量删除SKU
export function batchDeleteSku(params: any) {
  return request.post({
    url: `/basic/product/sku/deleteBatch`,
    data: params
  })
}

// 获取SKU详情
export function getSkuDetail(id: string | number) {
  return request.get({
    url: `/basic/product/sku/${id}`
  })
}

// 校验SKU是否关联下游单据
export function checkSkuDownstreamRelation(id: string | number) {
  return request.get({
    url: `/basic/product/sku/checkDownstream/${id}`
  })
}

// 新增-暂存-提交产品SKU
export function addSku(params: any) {
  return request.post({
    url: `/basic/product/sku`,
    data: params
  })
}

// 根据产品Id查询基础信息
export function getProductSkuBasic(id: string | number, options?: { silent?: boolean }) {
  return request.get({
    url: `/basic/product/sku/getProductSkuBasic/${id}`,
    showErrorMessage: options?.silent ? false : undefined
  })
}

// 根据产品ID查询采购信息
export function getSkuPurchaseBasic(productId: string | number, options?: { silent?: boolean }) {
  return request.get({
    url: `/basic/product/sku/purchaseBasic/${productId}`,
    showErrorMessage: options?.silent ? false : undefined
  })
}

// 根据产品ID查询物流信息
export function getSkuLogisticsInfo(productId: string | number, options?: { silent?: boolean }) {
  return request.get({
    url: `/basic/product/sku/logisticsInfo/${productId}`,
    showErrorMessage: options?.silent ? false : undefined
  })
}

// 根据产品ID查询财务信息
export function getSkuFinanceInfo(productId: string | number, options?: { silent?: boolean }) {
  return request.get({
    url: `/basic/product/sku/financeInfo/${productId}`,
    showErrorMessage: options?.silent ? false : undefined
  })
}

// 根据产品ID查询图片信息列表
export function getSkuPicList(productId: string | number, options?: { silent?: boolean }) {
  return request.get({
    url: `/basic/product/sku/picList/${productId}`,
    showErrorMessage: options?.silent ? false : undefined
  })
}

// 根据产品ID查询合规认证列表
export function getSkuCertificationList(
  productId: string | number,
  options?: { silent?: boolean }
) {
  return request.get({
    url: `/basic/product/sku/certificationList/${productId}`,
    showErrorMessage: options?.silent ? false : undefined
  })
}

/** 异步导出 SKU（创建下载中心任务，参数与列表查询一致，含 pageSize: -1） */
export function exportSku(params: any) {
  return request.post({
    url: `/basic/product/sku/export`,
    data: params
  })
}

// 编辑基础信息
export function updateProductSkuBasic(params: any) {
  return request.post({
    url: `/basic/product/sku/updateProductSkuBasic`,
    data: params
  })
}

// 新增or编辑-采购信息
export function updatePurchaseBasic(params: any) {
  return request.post({
    url: `/basic/product/sku/updatePurchaseBasic`,
    data: params
  })
}

// 新增or编辑-物流信息
export function updateLogisticsInfo(params: any) {
  return request.post({
    url: `/basic/product/sku/updateLogisticsInfo`,
    data: params
  })
}

// 新增or编辑-财务信息
export function updateFinanceInfo(params: any) {
  return request.post({
    url: `/basic/product/sku/updateFinanceInfo`,
    data: params
  })
}

// 新增or编辑-关联销售SKU信息
export function updateListingRelation(params: any) {
  return request.post({
    url: `/basic/product/sku/updateListingRelation`,
    data: {
      submitFlag: params.associateLocalSkuDto.submitFlag,
      associateLocalSkuDto: params.associateLocalSkuDto
    }
  })
}

// 编辑图片信息列表
export function updatePicList(params: any) {
  return request.post({
    url: `/basic/product/sku/updatePicList`,
    data: params
  })
}

// 编辑合规认证列表
export function updateCertificationList(params: any) {
  return request.post({
    url: `/basic/product/sku/updateCertificationList`,
    data: params
  })
}

// 撤回提交
export function cancelSubmit(params: { productId: number; type: number }) {
  return request.post({
    url: `/basic/product/sku/cancelSubmit`,
    data: params
  })
}
// 获取销售SKU
export function searchUnassociatedProducts(params: { productId: number; type: number }) {
  return request.post({
    url: `/basic/amazon/product/searchUnassociatedProducts`,
    data: params
  })
}

// 根据产品ID查询关联销售SKU信息
export function getSkuListingRelation(params: any, options?: { silent?: boolean }) {
  return request.post({
    url: `/basic/product/sku/listingRelation`,
    params,
    showErrorMessage: options?.silent ? false : undefined
  })
}
