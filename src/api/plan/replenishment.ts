/**
 * 补货需求单 API
 * @author Claude Code
 * @date 2026-01-06
 * @updated 2026-01-09 - 对接真实API (MCP规范)
 */

import type { Api } from '@/typings/api'
import request from '@/utils/http'

// API 基础路径 (根据MCP规范)
const BASE_URL = '/pms/replenishment-request'

/**
 * 获取补货需求单列表
 * @param params 查询参数
 * @returns 补货需求单列表
 */
export function getReplenishmentList(params: Api.Replenishment.QueryParam) {
  return request
    .post<any>({
      url: `${BASE_URL}/list`,
      data: params
    })
    .then((response) => {
      // 响应结构: { code: 200, data: { records, total, ... }, msg, success }
      const data = response?.data || response
      return {
        records: data?.records || [],
        total: data?.total || 0,
        current: data?.current || params.currentPage,
        size: data?.size || params.pageSize,
        pages: data?.pages || 0
      } as Api.Replenishment.ListResponse
    })
}

/**
 * 获取各状态数量统计
 * @param params 查询参数
 * @returns 各状态数量
 */
export function getStatusCount(params: Api.Replenishment.QueryParam) {
  return request
    .post<any>({
      url: `${BASE_URL}/status-count`,
      data: params
    })
    .then((response) => {
      // 响应结构: { code: 200, data: { draftCount, ... }, msg, success }
      const data = response?.data || response
      return {
        draftCount: data?.draftCount || 0,
        pendingApprovalCount: data?.pendingApprovalCount || 0,
        pendingPurchaseCount: data?.pendingPurchaseCount || 0,
        purchasingCount: data?.purchasingCount || 0,
        completedCount: data?.completedCount || 0,
        rejectedCount: data?.rejectedCount || 0,
        cancelledCount: data?.cancelledCount || 0,
        totalCount: data?.totalCount || 0
      } as Api.Replenishment.StatusCount
    })
}

/**
 * 获取补货需求单产品级列表(用于展开视图)
 * 注意：API返回的是单据级数据，需要在前端转换为产品级
 * @param params 查询参数
 * @returns 列表数据
 */
export function getProductLevelList(params: Api.Replenishment.QueryParam) {
  return request
    .post<any>({
      url: `${BASE_URL}/list`,
      data: params
    })
    .then((response) => {
      // 响应结构: { code: 200, data: { records, total, ... }, msg, success }
      const data = response?.data || response
      return {
        records: data?.records || [],
        total: data?.total || 0,
        current: data?.current || params.currentPage,
        size: data?.size || params.pageSize,
        pages: data?.pages || 0
      } as Api.Replenishment.ListResponse
    })
}

/**
 * 获取补货需求单详情
 * @param id 补货需求单ID
 * @returns 补货需求单详情
 */
export function getReplenishmentDetail(id: number) {
  return request
    .get<any>({
      url: `${BASE_URL}/detail/${id}`
    })
    .then((response) => {
      // 响应可能有多种结构:
      // 1. axios response: { data: { code, data, msg, success } }
      // 2. 已解包: { code, data, msg, success }
      // 3. 完全解包: { ...detail }
      let result = response?.data || response
      // 如果结果仍有 code 和 data 属性, 需要再提取 data
      if (result && typeof result === 'object' && 'code' in result && 'data' in result) {
        result = result.data
      }
      return result
    })
}

/**
 * 保存补货需求单 (新建或更新)
 * @param data 保存参数
 * @returns 保存结果(包含ID)
 */
export function saveReplenishment(data: Api.Replenishment.SaveParams) {
  return request.post<number>({
    url: `${BASE_URL}/save`,
    data
  })
}

/**
 * 创建补货需求单 (兼容旧接口)
 * @param data 创建参数
 * @returns 创建结果(包含新ID)
 */
export function createReplenishment(data: Api.Replenishment.CreateParams) {
  return saveReplenishment(data as Api.Replenishment.SaveParams).then((id) => ({ id }))
}

/**
 * 更新补货需求单 (兼容旧接口)
 * @param data 更新参数
 */
export function updateReplenishment(data: Api.Replenishment.UpdateParams) {
  return saveReplenishment(data as Api.Replenishment.SaveParams).then(() => undefined)
}

/**
 * 删除补货需求单
 * @param ids 补货需求单ID列表
 */
export function deleteReplenishment(ids: number[]) {
  return request.post<void>({
    url: `${BASE_URL}/delete`,
    data: ids,
    showSuccessMessage: true
  })
}

/**
 * 批量删除补货需求单
 * @param ids 补货需求单ID列表
 */
export function batchDeleteReplenishment(ids: number[]) {
  return deleteReplenishment(ids)
}

/**
 * 提交审批
 * @param id 补货需求单ID
 */
export function submitReplenishment(id: number) {
  return request.post<void>({
    url: `${BASE_URL}/submit`,
    data: [id]
  })
}

/**
 * 批量提交审批
 * @param ids 补货需求单ID列表
 */
export function batchSubmitReplenishment(ids: number[]) {
  return request.post<void>({
    url: `${BASE_URL}/submit`,
    data: ids
    // showSuccessMessage: true
  })
}

/**
 * 撤回提交
 * @param id 补货需求单ID
 * @param showMessage 是否显示成功消息（批量调用时设为false）
 */
export function recallReplenishment(id: number, showMessage = true) {
  return request.get<void>({
    url: `${BASE_URL}/cancelSubmit/${id}`,
    showSuccessMessage: showMessage
  })
}

/**
 * 批量撤回提交（接口只支持单个操作，前端使用Promise.all批量调用）
 * @param ids 补货需求单ID列表
 */
export function batchRecallReplenishment(ids: number[]) {
  // 批量撤回需要逐个调用，不显示单个成功消息
  return Promise.all(ids.map((id) => recallReplenishment(id, false)))
}

/**
 * 作废补货需求单
 * @param id 补货需求单ID
 */
export function voidReplenishment(id: number) {
  return request.post<void>({
    url: `${BASE_URL}/cancel`,
    data: [id],
    showSuccessMessage: true
  })
}

/**
 * 批量作废补货需求单
 * @param ids 补货需求单ID列表
 */
export function batchVoidReplenishment(ids: number[]) {
  return request.post<void>({
    url: `${BASE_URL}/cancel`,
    data: ids,
    showSuccessMessage: true
  })
}

/**
 * 生成采购订单 (该功能在采购订单模块)
 * @param id 补货需求单ID
 * @returns 采购订单ID列表
 */
export function generatePurchaseOrder(id: number) {
  return request.post<{ purchaseOrderIds: number[] }>({
    url: '/purchase-order/generate',
    data: { replenishmentRequestIds: [id] },
    showSuccessMessage: true
  })
}

/**
 * 导出补货需求单
 * @param params 查询参数
 * @returns Excel文件Blob
 */
export function exportReplenishment(params: Api.Replenishment.QueryParam) {
  return request.post<Blob>({
    url: `${BASE_URL}/export`,
    data: { ...params, pageSize: -1 },
    responseType: 'blob'
  })
}

/**
 * 更新标签资料
 * @param data 更新参数
 */
export function updateLabel(data: Api.Replenishment.UpdateLabelParams) {
  return request.post<void>({
    url: `${BASE_URL}/updateLabel`,
    data,
    showSuccessMessage: true
  })
}

/**
 * 获取操作日志 (从详情的statusFlowVos获取)
 * @param id 补货需求单ID
 * @returns 操作日志列表
 */
export function getOperationLog(id: number) {
  return getReplenishmentDetail(id).then((detail) => {
    return (detail.statusFlowVos || []).map((flow, index) => ({
      id: index + 1,
      requirementId: detail.id,
      operationType: flow.statusName || '',
      operatorId: flow.operatorId || 0,
      operatorName: flow.operatorName || '',
      operationTime: flow.operateTime || '',
      remark: flow.remark || ''
    }))
  })
}

/**
 * 快捷更新备注 (通过save接口)
 * @param id 补货需求单ID
 * @param documentRemark 单据备注内容
 */
export function updateRemark(id: number, documentRemark: string) {
  return getReplenishmentDetail(id)
    .then((detail) => {
      return saveReplenishment({
        id,
        reason: detail.reason,
        documentRemark,
        responsiblePersonIds: detail.responsiblePersonIds,
        attachments: detail.attachments,
        items: buildItemsFromDetail(detail.items)
      })
    })
    .then(() => undefined)
}

/**
 * 快捷更新单据负责人 (使用专用接口，任何状态都可调用)
 * @param id 补货需求单ID
 * @param responsiblePersonIds 负责人ID列表
 */
export function updateOwner(id: number, responsiblePersonIds: number[]) {
  return request.post({
    url: `${BASE_URL}/editResponsiblePerson`,
    data: {
      id,
      responsiblePersonIds
    }
  })
}

/**
 * 快捷更新附件 (通过save接口)
 * @param id 补货需求单ID
 * @param attachments 附件列表
 */
export function updateReplenishmentAttachment(
  id: number,
  attachments: Api.Replenishment.AttachmentItem[]
) {
  return getReplenishmentDetail(id)
    .then((detail) => {
      return saveReplenishment({
        id,
        reason: detail.reason,
        documentRemark: detail.documentRemark,
        responsiblePersonIds: detail.responsiblePersonIds,
        attachments,
        items: buildItemsFromDetail(detail.items)
      })
    })
    .then(() => undefined)
}

/**
 * 从详情数据构建保存所需的 items 参数
 * @param items 详情中的产品明细列表
 */
function buildItemsFromDetail(items?: Api.Replenishment.ItemDetailVo[]) {
  return (
    items?.map((item) => ({
      id: item.id,
      skuId: item.skuId,
      sku: item.sku,
      productChineseName: item.productChineseName,
      spu: item.spu,
      spuName: item.spuName,
      materialCode: item.materialCode,
      brandId: item.brandId,
      brandName: item.brandName,
      categoryId: item.categoryId,
      categoryName: item.categoryName,
      imageUrl: item.imageUrl,
      requestQty: item.requestQty,
      quantityPerBox: item.quantityPerBox,
      numberOfBoxes: item.numberOfBoxes,
      expectDeliveryDate: item.expectDeliveryDate,
      purchaseResponsiblePersonIds: item.purchaseResponsiblePersonIds || [],
      responsiblePersonNames: item.responsiblePersonNames,
      labelMaterial: item.labelMaterial || [],
      remark: item.remark
    })) || []
  )
}

/**
 * 获取可选产品列表(用于产品选择弹窗)
 * 使用现有的SKU分页列表接口 /basic/product/sku/page
 * @param params 查询参数
 * @returns 产品列表
 */
export function getSelectableProducts(params: Api.Replenishment.ProductSelectQueryParam) {
  // 转换参数以匹配 /basic/product/sku/page 接口格式
  const requestParams: Record<string, any> = {
    currentPage: params.currentPage,
    pageSize: params.pageSize,
    hasCount: true,
    isReplenishmentRequest: 1 // 新增补货需求单时拉取的SKU
  }

  // 使用 searchDto 结构进行搜索
  // searchType 映射：SKU:sku 中文品名:product_chinese_name SPU:spu 款名:spuName 物料编码:materialCode
  if (params.searchType && params.searchValue) {
    const searchTypeMap: Record<string, string> = {
      sku: 'sku',
      productChineseName: 'productChineseName',
      spu: 'spu',
      chineseStyleName: 'spuName',
      materialCode: 'materialCode'
    }
    requestParams.searchDto = {
      searchType: searchTypeMap[params.searchType] || params.searchType,
      searchValue: params.searchValue
    }
  }

  // 分类ID列表
  if (params.categoryIds && params.categoryIds.length > 0) {
    requestParams.categoryIdList = params.categoryIds
  }
  // 品牌ID列表
  if (params.brandIds && params.brandIds.length > 0) {
    requestParams.brandIdList = params.brandIds
  }
  // 产品状态列表 (资料状态)
  if (params.dataStatusList && params.dataStatusList.length > 0) {
    requestParams.productStatusList = params.dataStatusList
  }

  return request
    .post<any>({
      url: '/basic/product/sku/page',
      data: requestParams
    })
    .then((response) => {
      // 处理响应结构：API返回 {code, data: {records, total, ...}, msg, success}
      // request工具可能返回完整响应或已解包的data
      const responseData = response?.data || response
      const rawRecords = responseData?.records || []

      // 转换响应数据：从 productSkuBasicVo、productPurchaseBasicVo、productFinanceInfoVo 提取字段
      const records = rawRecords.map((record: any) => {
        // 基础数据在 productSkuBasicVo 对象中
        const basic = record.productSkuBasicVo || {}
        // 采购数据在 productPurchaseBasicVo 对象中
        const purchase = record.productPurchaseBasicVo || {}
        // 财务数据在 productFinanceInfoVo 对象中
        const finance = record.productFinanceInfoVo || {}
        const picUrl = parseImageUrl(basic.picUrl)

        // 解析采购负责人 (可能在多个字段中)
        // let purchaserName = ''
        // let purchaserId: any

        // 1. 先尝试从 productPurchaseBasicVo 获取
        // if (purchase.purchaseOwnerUsers) {
        //   try {
        //     const users =
        //       typeof purchase.purchaseOwnerUsers === 'string'
        //         ? JSON.parse(purchase.purchaseOwnerUsers)
        //         : purchase.purchaseOwnerUsers
        //     if (Array.isArray(users) && users.length > 0) {
        //       purchaserId = users
        //     }
        //   } catch {
        //     // ignore parse error
        //   }
        // }

        // 2. 如果没有，尝试从 productSkuBasicVo.productOwnerUsers 获取产品负责人作为备选
        // if (!purchaserId.length && basic.productOwnerUsers) {
        //   try {
        //     const users =
        //       typeof basic.productOwnerUsers === 'string'
        //         ? JSON.parse(basic.productOwnerUsers)
        //         : basic.productOwnerUsers
        //     if (Array.isArray(users) && users.length > 0) {
        //       purchaserId = users[0]
        //     }
        //   } catch {
        //     // ignore parse error
        //   }
        // }

        // 采购负责人名称
        const purchaserName = purchase.purchaseUsers
        const purchaserId = purchase.purchaseOwnerUsers
          ? JSON.parse(purchase.purchaseOwnerUsers)
          : []
        return {
          productSkuId: basic.id || record.id,
          sku: basic.sku || '',
          skuId: basic.id,
          spuId: basic.spuId,
          chineseProductName: basic.productChineseName || '',
          imageUrl: picUrl,
          picUrl: basic.picUrl || '', // 原始图片地址（传给后端）
          spu: basic.spu || '',
          chineseStyleName: basic.spuName || basic.productChineseName || '',
          materialCode: basic.materialCode || '',
          categoryPath: basic.categoryName || '',
          categoryId: basic.categoryId,
          brandName: basic.brandName || '',
          brandId: basic.brandId,
          quantityPerBox: basic.boxNum || 0,
          purchaserId: purchaserId,
          purchaserName: purchaserName,
          dataStatus: basic.approveStatus ?? 2,
          dataStatusName: getDataStatusName(basic.approveStatus ?? 2),
          // 单位
          unit: basic.unit || '',
          // 从 productFinanceInfoVo 获取采购主体信息
          purchaseOrganizationId: finance.purchaseOrganizationId || null,
          purchaseOrganizationName: finance.purchaseOrganizationName || '',
          purchaseOrganizationAddress: finance.purchaseOrganizationAddress || '',
          // 从 productPurchaseBasicVo 获取币种和供应商报价
          currency: purchase.currency || '',
          productSupplierQuotationVo: purchase.productSupplierQuotationVo || [],
          jsonFieldExtension: {
            productSkuInfo: {
              financeInfo: record.productFinanceInfoVo,
              logisticsInfo: record.productLogisticsInfoVo,
              productBaseInfo: basic,
              purchaseInfo: purchase
            }
          }
        }
      })

      return {
        records,
        total: responseData?.total || 0,
        current: responseData?.current || params.currentPage,
        size: responseData?.size || params.pageSize
      }
    })
}

// 辅助函数：解析图片URL (参考SKU页面的getUrl函数)
function parseImageUrl(picUrl: any): string {
  if (!picUrl) return ''
  // picUrl可能是直接URL字符串或JSON格式
  if (typeof picUrl === 'string' && !picUrl.startsWith('[') && !picUrl.startsWith('{')) {
    return picUrl
  }
  try {
    const parsed = JSON.parse(picUrl)
    return parsed?.url || parsed?.[0]?.url || ''
  } catch {
    return picUrl || ''
  }
}

// 辅助函数：获取数据状态名称
function getDataStatusName(status: number): string {
  const statusMap: Record<number, string> = {
    0: '草稿',
    1: '审批中',
    2: '已生效',
    3: '已驳回'
  }
  return statusMap[status] || '已生效'
}
// 撤回提交（异步）
export function cancelSubmit(params: any) {
  return request.post({
    url: `/pms/replenishment-request/cancelSubmit`,
    data: params
  })
}
