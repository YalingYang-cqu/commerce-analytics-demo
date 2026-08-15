import request from '@/utils/http'

/** 出库单详情（编辑回显） */
export function warehouseOutDetail(id: string | number) {
  return request.post<any>({
    url: `/ims/ims-outbound-order/detail`,
    data: { id }
  })
}

/** 出库单分页列表 */
export function warehouseOutPage(params: any) {
  return request.post({
    url: `/ims/ims-outbound-order/page`,
    data: params
  })
}

/** 各状态数量统计 */
export function warehouseOutStatusCount(params: any) {
  return request.post({
    url: `/ims/ims-outbound-order/statusCount`,
    data: params
  })
}

/** 提交（草稿 → 待出库） */
export function warehouseOutSubmit(ids: (string | number)[]) {
  return request.post({
    url: `/ims/ims-outbound-order/submit`,
    data: { ids }
  })
}

/** 撤回（待出库 → 草稿） */
export function warehouseOutRecall(ids: (string | number)[]) {
  return request.post({
    url: `/ims/ims-outbound-order/withdraw`,
    data: { ids }
  })
}

/** 删除（仅草稿） */
export function warehouseOutDelete(ids: (string | number)[]) {
  return request.post({
    url: `/ims/ims-outbound-order/delete`,
    data: { ids }
  })
}

/** 作废（待出库 → 已作废） */
export function warehouseOutInvalidate(ids: (string | number)[]) {
  return request.post({
    url: `/ims/ims-outbound-order/void`,
    data: { ids }
  })
}

/** 确认出库（待出库 → 已完成） */
export function warehouseOutConfirm(ids: (string | number)[]) {
  return request.post({
    url: `/ims/ims-outbound-order/confirm`,
    data: { ids }
  })
}

/** 编辑单据负责人 */
export function warehouseOutEditFields(params: {
  id: string | number
  documentManagerIds?: (string | number)[]
}) {
  return request.post({
    url: `/ims/ims-outbound-order/owner/edit`,
    data: {
      orderId: params.id,
      ownerIdList: (params.documentManagerIds ?? []).map((x) => Number(x))
    }
  })
}

/** 异步导出 */
export function exportWarehouseOut(params: any) {
  return request.post({
    url: `/ims/ims-outbound-order/export`,
    data: params
  })
}

/** 新增出库单 */
export function warehouseOutSave(params: any) {
  return request.post({
    url: `/ims/ims-outbound-order/save`,
    data: params
  })
}

/** 编辑出库单 */
export function warehouseOutEdit(params: any) {
  return request.post({
    url: `/ims/ims-outbound-order/edit`,
    data: params
  })
}

/** 工作流进度 */
export function warehouseOutProgress(params: { id?: number; outboundOrderNo?: string }) {
  return request.post({
    url: `/ims/ims-outbound-order/progress`,
    data: params
  })
}

/** 出库单选产品：指定仓库+主体实时库存分页（含 availableQty） */
const OUTBOUND_PRODUCT_SEARCH_TYPE: Record<string, string> = {
  sku: 'sku',
  productChineseName: 'chineseName',
  spu: 'sku',
  spuName: 'chineseName',
  materialCode: 'sku',
  sellerSku: 'sellerSku',
  fnSku: 'fnSku',
  asin: 'asin'
}

/**
 * 与「添加产品」弹窗参数对齐：合并 warehouseId、companySubjectId 及分页/筛选后 POST `{ vo }`
 * 返回 `{ records, total }` 供 `sale-sku-select-dialog` 使用
 */
export function outboundOrderProductsSearch(raw: Record<string, any>) {
  const warehouseId = Number(raw.warehouseId)
  if (!Number.isFinite(warehouseId) || warehouseId <= 0) {
    return Promise.resolve({
      records: [],
      total: 0,
      current: raw.currentPage,
      size: raw.pageSize ?? 20
    })
  }
  const companySubjectId = Number(raw.companySubjectId) || 0
  const searchValue = String(raw.searchValue ?? '').trim()
  const searchTypeKey = String(raw.searchType || 'sku')
  const searchType = searchValue ? OUTBOUND_PRODUCT_SEARCH_TYPE[searchTypeKey] || 'sku' : ''

  const vo: Record<string, any> = {
    warehouseId,
    companySubjectId,
    currentPage: raw.currentPage,
    pageSize: raw.pageSize ?? 20,
    hasCount: raw.hasCount ?? true,
    orderBy: raw.orderBy || '',
    keyword: '',
    localSku: '',
    sellerId: '',
    sellerSku: '',
    region: raw.region || '',
    productType: raw.productType != null && raw.productType !== '' ? Number(raw.productType) : 0,
    searchType,
    searchValue: searchValue || ''
  }

  if (Array.isArray(raw.storeIdList) && raw.storeIdList.length) {
    vo.sellerId = String(raw.storeIdList[0])
  }

  return request
    .post<any>({
      url: `/ims/ims-outbound-order/products/search`,
      data: vo
    })
    .then((response: any) => {
      const page = response?.data ?? response
      return {
        records: (page?.dtoList || []) as any[],
        total: page?.total ?? 0,
        current: raw.currentPage,
        size: raw.pageSize ?? 20
      }
    })
}
