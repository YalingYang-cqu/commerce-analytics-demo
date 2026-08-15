/**
 * 发货计划 API
 * @author Claude Code
 * @date 2026-01-16
 * @description 对接真实API endpoints (根据 fahuo.api.md 文档)
 */

import request from '@/utils/http'

// API 基础路径
const BASE_URL = '/wms/shipping-plan-batch'

/** ===== 类型定义 ===== */

// 附件类型
export interface AttachmentItem {
  name: string
  uid: string
  url: string
}

// 标签资料类型
export interface LabelMaterialItem {
  fileName?: string
  fileUrl?: string
  labelType?: string
  messageContent?: string
  operatingEnd?: string
  operatorName?: string
  uploadTime?: string
}

// 关联订单类型（采购订单/货件/调拨单共用，调拨单详情跳转需 orderId）
export interface AssociatedOrder {
  associatedQty?: number
  itemId?: number
  orderNo?: string
  /** 关联单 id，用于跳转详情（如调拨单 orderId） */
  orderId?: number
}

// 发货计划批次保存DTO
export interface ShippingPlanBatchSaveDto {
  id?: number
  applicationReason: string
  attachments?: AttachmentItem[]
  destinationWarehouseId: number
  documentRemark?: string
  responsiblePersonIds?: number[]
  shippingWarehouseId: number
}

// 发货计划批次明细保存DTO
export interface ShippingPlanBatchItemUpsertDto {
  id?: number
  skuId: number
  skuCode?: string
  skuName?: string
  spuId?: number
  spuCode?: string
  spuName?: string
  materialCode?: string
  categoryId?: number
  categoryName?: string
  brandId?: number
  brandName?: string
  storeId?: number | null
  storeName?: string
  sellerId?: string | null
  platform?: string
  region?: string // 区域，如 US、UK、DE 等
  salesSku?: string
  fnsku?: string
  asin?: string
  plannedShippingQty: number
  quantityPerBox?: number
  numberOfBoxes?: number
  transportMethod: string
  logisticsChannelId: number
  logisticsChannelName?: string
  plannedShippingTime: string
  plannedShippingWeek?: string
  estimatedArrivalTime: string
  availableQty?: number
  boxGrossWeight?: number
  boxLength?: number
  boxWidth?: number
  boxHeight?: number
  totalWeight?: number
  totalVolume?: number
  labelMaterial?: LabelMaterialItem[]
  productRemark?: string
}

// 发货计划批次暂存/提交DTO
export interface ShippingPlanBatchUpsertDto {
  id?: number
  applicationReason?: string
  attachments?: AttachmentItem[]
  destinationWarehouseId: number
  destWarehouseType?: number // 目的仓库类型：2-三方仓 3-FBA仓
  documentRemark?: string
  responsiblePersonIds?: number[]
  shippingWarehouseId?: number
  items?: ShippingPlanBatchItemUpsertDto[]
}

// 发货计划批次查询参数
export interface ShippingPlanBatchQueryDto {
  currentPage: number
  pageSize?: number
  hasCount?: boolean
  orderBy?: string
  planStatus?: number // 计划状态: 0草稿 10待处理 20发货中 30已完成 40已作废
  // 文本搜索参数（模糊搜索）
  batchNo?: string // 发货计划批次号
  planNo?: string // 计划编号
  purchaseOrderNo?: string // 采购订单号
  shipmentId?: string // 货件编号
  transferOrderNo?: string // 调拨单号
  skuCode?: string // SKU编码
  skuName?: string // 中文品名
  spuCode?: string // SPU编码
  spuName?: string // 中文款名
  materialCode?: string // 物料编码
  documentRemark?: string // 批次备注
  productRemark?: string // 产品备注
  // 支持多选（数组参数）
  shippingWarehouseIds?: number[]
  destinationWarehouseIds?: number[]
  responsiblePersonIds?: number[]
  storeIds?: number[]
  categoryIds?: number[]
  brandIds?: number[]
  transportMethods?: string[]
  logisticsChannelIds?: number[]
  // 兼容单选（旧参数，保留但建议使用数组参数）
  shippingWarehouseId?: number
  destinationWarehouseId?: number
  responsiblePersonId?: number
  storeId?: number
  transportMethod?: string
  logisticsChannelId?: number
  // 日期筛选参数
  createTimeStart?: string
  createTimeEnd?: string
  updateTimeStart?: string
  updateTimeEnd?: string
  plannedShippingTimeStart?: string
  plannedShippingTimeEnd?: string
  estimatedArrivalTimeStart?: string
  estimatedArrivalTimeEnd?: string
}

// 发货计划批次列表项VO
export interface ShippingPlanBatchListVo {
  id: number
  batchNo: string
  status: number // 原status字段，兼容保留
  planStatus: number // 计划状态: 0草稿 10待处理 20发货中 30已完成 40已作废
  statusDesc: string
  approveStatus?: number
  approveStatusDesc?: string
  applicationReason?: string
  documentRemark?: string
  shippingWarehouseId?: number
  shippingWarehouseName?: string
  destinationWarehouseId?: number
  destinationWarehouseName?: string
  /** 物流中心编码（Destination Fulfillment Center ID），FBA 目的仓时可能有 */
  destinationFulfillmentCenterId?: string
  destWarehouseType?: number // 目的仓库类型：2-三方仓 3-FBA仓
  responsiblePersonIds?: number[] // 单据负责人ID列表
  responsiblePersonNames?: string[] // 单据负责人名称列表
  creatorId?: number
  createTime?: string
  updateTime?: string
  submitTime?: string
  approveTime?: string
  totalWeight?: number
  totalVolume?: number
  items?: ShippingPlanBatchItemListVo[]
}

// 发货计划批次明细VO
export interface ShippingPlanBatchItemListVo {
  id: number
  batchId?: number
  planNo?: string
  skuId?: number
  skuCode?: string
  skuName?: string
  spuId?: number
  spuCode?: string
  spuName?: string
  materialCode?: string
  categoryId?: number
  categoryName?: string
  brandId?: number
  brandName?: string
  storeId?: number
  storeName?: string
  sellerId?: string
  platform?: string
  region?: string
  salesSku?: string
  fnsku?: string
  asin?: string
  plannedShippingQty?: number
  /** 实际出货量 */
  actualShippedQty?: number
  availableQty?: number
  quantityPerBox?: number
  numberOfBoxes?: number
  transportMethod?: string
  logisticsChannelId?: number
  logisticsChannelName?: string
  plannedShippingTime?: string
  plannedShippingWeek?: string
  estimatedArrivalTime?: string
  boxGrossWeight?: number
  boxGrossWeightLb?: number
  boxLength?: number
  boxLengthInch?: number
  boxWidth?: number
  boxWidthInch?: number
  boxHeight?: number
  boxHeightInch?: number
  totalWeight?: number
  totalVolume?: number
  labelMaterial?: LabelMaterialItem[]
  productRemark?: string
  associatedPurchaseOrders?: AssociatedOrder[]
  associatedShipments?: AssociatedOrder[]
  associatedTransferOrders?: AssociatedOrder[]
}

// 发货计划批次详情VO
// 时间线步骤
export interface TimelineStepVo {
  name: string
  status: 'completed' | 'active' | 'pending' // completed=已完成, active=当前, pending=未开始
  step: number
  time?: string
  userId?: number
  userName?: string
  remark?: string
}

export interface ShippingPlanBatchDetailVo extends ShippingPlanBatchListVo {
  responsiblePersonIds?: number[]
  attachments?: AttachmentItem[]
  timeline?: TimelineStepVo[]
}

// 仓库VO（目的仓库列表接口返回 destWarehouseType，不返回 warehouseType）
export interface WarehouseVo {
  id: number
  warehouseCode?: string
  warehouseName: string
  /** 目的仓库类型：2-三方仓 3-FBA仓（接口返回字段名为 destWarehouseType） */
  destWarehouseType?: number
  address?: string
  enableStatus?: number
}

/** 渠道关联的物流方案（用于按方案 transportMode 与运输方式联动） */
export interface LogisticsChannelPlanVo {
  id?: number
  planName?: string
  transportMode?: string
}

// 物流渠道VO
export interface LogisticsChannelVo {
  id: number
  channelName: string
  providerId?: number
  providerName?: string
  /** 兼容：部分列表接口可能只返回单一运输方式 */
  transportMethod?: string
  transitTime?: number
  enableStatus?: number
  /** 关联物流方案列表（方案上带 transportMode，用于客户端过滤渠道/构建运输方式下拉） */
  transportPlanList?: LogisticsChannelPlanVo[]
}

// 商品选择VO（亚马逊商品列表视图对象，字段与暂存/提交接口明细一致以便带回列表行）
export interface ProductSelectVo {
  id: number
  sellerSku?: string
  fnSku?: string
  asin?: string
  parentAsin?: string
  msku?: string // MSKU（VC商品）
  ssku?: string // SSKU（VC商品）
  localSkuId?: number
  /** SKU 主键（与 localSkuId 可能一致，接口若返回则用） */
  skuId?: number
  localSku?: string
  localSkuChineseName?: string
  internalSkuCode?: string
  storeName?: string
  sellerId?: string
  platform?: string
  region?: string
  area?: string
  brandId?: number
  brandName?: string
  categoryId?: number
  categoryName?: string
  /** SPU 主键（暂存/提交接口必带） */
  spuId?: number
  /** SPU 编码（searchProducts 接口返回字段名为 spu，对应暂存/提交的 spuCode） */
  spuCode?: string
  /** searchProducts 接口返回的 SPU 编码字段名（与 spuCode 同义，优先用此带回列表） */
  spu?: string
  /** SPU/中文款名（暂存/提交接口必带） */
  spuName?: string
  imageUrl?: string
  productType?: number
  productName?: string // 商品名称（VC）
  productTitle?: string // 商品标题
  approvalStatus?: number
  approvalStatusName?: string
  associationStatus?: number
  associationStatusName?: string
  boxLengthInch?: number
  boxWidthInch?: number
  boxHeightInch?: number
  boxGrossWeightLb?: number
  /** 单箱毛重 kg（接口若返回则用，否则由 boxGrossWeightLb 换算） */
  boxGrossWeight?: number
  /** 单箱长 cm（接口若返回则用，否则由 boxLengthInch 换算） */
  boxLength?: number
  /** 单箱宽 cm */
  boxWidth?: number
  /** 单箱高 cm */
  boxHeight?: number
  fulfillmentChannel?: string // 配送渠道（FBA/FBM）
  salesEntity?: string // 销售主体
  salesManagerIds?: string
  salesManagerNames?: string[]
  salesManagerNamesStr?: string
}

/** sum-by-sku 接口中单条采购单可锁定量明细 */
export interface SkuLockableQtyDetailItemVo {
  orderNo?: string
  lockableQty?: number
}

// SKU可锁定量汇总VO（含按采购订单拆分明细）
export interface SkuLockableQtySummaryVo {
  skuCode: string
  totalLockableQty: number
  details?: SkuLockableQtyDetailItemVo[]
}

// 亚马逊货件VO
export interface AmazonShipmentListVo {
  shipmentId: string
  shipmentName?: string
  shipmentStatus?: string
  destinationFulfillmentCenterId?: string
  seller?: string
  sellerId?: string
  region?: string
  referenceId?: string
  isSta?: number
  isClosed?: number
  createTime?: string
  updateTime?: string
  workingTime?: string
  shippedTime?: string
  receivingTime?: string
  closedTime?: string
  staPlanName?: string
  staShipmentId?: string
  staShipmentDate?: string
  items?: AmazonShipmentItemListVo[]
}

// 亚马逊货件明细VO
export interface AmazonShipmentItemListVo {
  id?: number
  shipmentId?: string
  msku?: string
  sku?: string
  skuCode?: string
  skuName?: string
  fnsku?: string
  asin?: string
  parentAsin?: string
  quantityShipped?: number
  quantityReceived?: number
  quantityShippedLocal?: number
  initQuantityShipped?: number
  discrepancy?: number
  quantityInCase?: number
  prepOwner?: string
  prepInstruction?: string
  prepDetails?: string
  prepLabelOwner?: string
  releaseDate?: string
  expiration?: string
  createdAt?: string
  updatedAt?: string
}

// 批次已关联货件信息VO
export interface ShippingPlanBatchItemAssociatedShipmentVo {
  id: number
  planNo?: string
  skuCode?: string
  skuName?: string
  msku?: string
  region?: string
  storeId?: number
  plannedShippingQty?: number
  associatedShipments?: AssociatedOrder[]
  availableShipments?: AmazonShipmentListVo[]
}

/** ===== API 函数 ===== */

/**
 * 分页查询批次列表（包含明细）
 */
export function getShippingList(params: ShippingPlanBatchQueryDto) {
  return request
    .post<any>({
      url: `${BASE_URL}/list`,
      data: params
    })
    .then((response) => {
      const data = response?.data || response
      return {
        records: data?.dtoList || [],
        total: data?.total || 0,
        current: params.currentPage,
        size: params.pageSize || 20,
        // 状态统计
        draftCount: data?.draftCount || 0,
        pendingCount: data?.pendingCount || 0,
        shippingCount: data?.shippingCount || 0,
        finishedCount: data?.finishedCount || 0,
        canceledCount: data?.canceledCount || 0
      }
    })
}

/**
 * 获取发货计划批次详情
 */
export function getShippingDetail(id: number) {
  return request
    .get<any>({
      url: `${BASE_URL}/${id}`
    })
    .then((response) => {
      let result = response?.data || response
      if (result && typeof result === 'object' && 'code' in result && 'data' in result) {
        result = result.data
      }
      return result as ShippingPlanBatchDetailVo
    })
}

/**
 * 根据批次号获取发货计划批次详情（用于跳转详情页时通过 batchNo 解析出 id）
 * 接口: GET /wms/shipping-plan-batch/getBatchDetailByNo/{batchNo}
 */
export function getBatchDetailByNo(batchNo: string) {
  return request
    .get<any>({
      url: `${BASE_URL}/getBatchDetailByNo/${encodeURIComponent(batchNo)}`
    })
    .then((response) => {
      let result = response?.data || response
      if (result && typeof result === 'object' && 'code' in result && 'data' in result) {
        result = result.data
      }
      return result as ShippingPlanBatchDetailVo
    })
}

/**
 * 创建发货计划批次
 */
export function createShipping(data: ShippingPlanBatchSaveDto) {
  return request.post<number>({
    url: BASE_URL,
    data,
    showSuccessMessage: true
  })
}

/**
 * 更新发货计划批次
 */
export function updateShipping(id: number, data: ShippingPlanBatchSaveDto) {
  return request.put<number>({
    url: `${BASE_URL}/${id}`,
    data,
    showSuccessMessage: true
  })
}

/**
 * 暂存发货计划批次（首次无批次ID）
 */
export function saveShipping(data: ShippingPlanBatchUpsertDto) {
  return request
    .post<any>({
      url: `${BASE_URL}/save`,
      data,
      showSuccessMessage: true
    })
    .then((response) => {
      const result = response?.data || response
      return typeof result === 'number' ? result : result?.data
    })
}

/**
 * 提交发货计划批次（首次无批次ID）
 */
export function submitShipping(data: ShippingPlanBatchUpsertDto) {
  return request
    .post<any>({
      url: `${BASE_URL}/submit`,
      data,
      showSuccessMessage: true
    })
    .then((response) => {
      const result = response?.data || response
      return typeof result === 'number' ? result : result?.data
    })
}

/**
 * 批量提交发货计划（用于列表页批量操作）
 * 提交参数与暂存/提交接口一致，需传完整批次及明细字段（含 destWarehouseType、明细冗余及箱规等）
 * @param ids 批次ID列表
 * @param destWarehouseTypeMap 可选，列表行上的目的仓库类型兜底（详情接口未返回时使用）
 */
export function batchSubmitShipping(ids: number[], destWarehouseTypeMap?: Record<number, number>) {
  return Promise.all(
    ids.map((id) =>
      getShippingDetail(id).then((detail) => {
        const destWarehouseType = detail.destWarehouseType ?? destWarehouseTypeMap?.[id]
        if (destWarehouseType == null) {
          return Promise.reject(new Error('目的仓库类型不能为空，请确认该发货计划已选择目的仓库'))
        }
        return submitShipping({
          id,
          applicationReason: detail.applicationReason,
          destinationWarehouseId: detail.destinationWarehouseId!,
          destWarehouseType,
          shippingWarehouseId: detail.shippingWarehouseId!,
          documentRemark: detail.documentRemark,
          responsiblePersonIds: detail.responsiblePersonIds,
          attachments: detail.attachments,
          items: detail.items?.map(
            (item): ShippingPlanBatchItemUpsertDto => ({
              id: item.id,
              skuId: item.skuId!,
              skuCode: item.skuCode ?? '',
              skuName: item.skuName ?? '',
              spuId: item.spuId ?? 0,
              spuCode: item.spuCode ?? '',
              spuName: item.spuName ?? '',
              materialCode: item.materialCode ?? '',
              categoryId: item.categoryId ?? 0,
              categoryName: item.categoryName ?? '',
              brandId: item.brandId ?? 0,
              brandName: item.brandName ?? '',
              storeName: item.storeName ?? '',
              sellerId: item.sellerId ?? undefined,
              platform: item.platform ?? '',
              region: item.region ?? '',
              salesSku: item.salesSku ?? '',
              fnsku: item.fnsku ?? '',
              asin: item.asin ?? '',
              plannedShippingQty: item.plannedShippingQty!,
              quantityPerBox: item.quantityPerBox ?? 0,
              numberOfBoxes: item.numberOfBoxes ?? 0,
              transportMethod: item.transportMethod!,
              logisticsChannelId: item.logisticsChannelId!,
              plannedShippingTime: item.plannedShippingTime!,
              plannedShippingWeek: item.plannedShippingWeek ?? '',
              estimatedArrivalTime: item.estimatedArrivalTime!,
              availableQty: item.availableQty ?? 0,
              boxGrossWeight: item.boxGrossWeight ?? 0,
              boxLength: item.boxLength ?? 0,
              boxWidth: item.boxWidth ?? 0,
              boxHeight: item.boxHeight ?? 0,
              totalWeight: item.totalWeight ?? 0,
              totalVolume: item.totalVolume ?? 0,
              labelMaterial: item.labelMaterial,
              productRemark: item.productRemark ?? ''
            })
          )
        })
      })
    )
  )
}

/** 批量提交发货计划响应 */
export interface BatchSubmitResultVo {
  successCount: number
  totalCount: number
}

/**
 * 批量提交发货计划
 * 接口地址: POST /wms/shipping-plan-batch/batch-submit
 * 仅草稿状态支持提交，提交时校验并关联采购订单，成功后状态变更为待处理并推送到供应商协同系统
 */
export function batchSubmitShippingPlan(batchIds: number[]) {
  return request.post<BatchSubmitResultVo>({
    url: `${BASE_URL}/batch-submit`,
    data: { batchIds },
    showSuccessMessage: true
  })
}

/**
 * 批量删除发货计划明细
 */
export function batchDeleteShippingItems(ids: number[]) {
  return request.del<number>({
    url: `${BASE_URL}/item`,
    data: ids,
    showSuccessMessage: true
  })
}

/**
 * 更新商品明细
 */
export function updateShippingItem(id: number, data: ShippingPlanBatchItemUpsertDto) {
  return request.put<number>({
    url: `${BASE_URL}/item/${id}`,
    data,
    showSuccessMessage: true
  })
}

/**
 * 删除发货计划批次（单个删除，使用批量接口）
 * 仅草稿状态的发货计划支持删除，删除后数据不可恢复
 */
export function deleteShipping(id: number) {
  return batchDeleteShipping([id])
}

/**
 * 批量删除发货计划
 * 仅草稿状态的发货计划支持删除，支持单个或批量删除，删除后数据不可恢复
 * 接口地址: DELETE /wms/shipping-plan-batch/batch
 */
export function batchDeleteShipping(ids: number[]) {
  return request.del<number>({
    url: `${BASE_URL}/batch`,
    data: ids,
    showSuccessMessage: false
  })
}

/**
 * 作废发货计划（仅待处理），支持单个与批量
 * POST /wms/shipping-plan-batch/cancel，application/json，请求体为批次 ID 数组，如 [1,2,3]
 */
export function batchVoidShipping(batchIds: number[]) {
  return request.post({
    url: `${BASE_URL}/cancel`,
    data: batchIds,
    showSuccessMessage: false
  })
}

/** 作废单个发货计划批次 */
export function voidShipping(id: number) {
  return batchVoidShipping([id])
}

/**
 * 查询仓库列表
 */
export function getWarehouseList(params: {
  warehouseTypes?: number[]
  warehouseName?: string
  enableStatus?: number
  currentPage?: number
  pageSize?: number
}) {
  return request
    .post<any>({
      url: `${BASE_URL}/warehouses`,
      data: {
        currentPage: params.currentPage || 1,
        pageSize: params.pageSize || -1,
        warehouseTypes: params.warehouseTypes,
        warehouseName: params.warehouseName,
        enableStatus: params.enableStatus
      }
    })
    .then((response) => {
      const data = response?.data || response
      return (data?.dtoList || []) as WarehouseVo[]
    })
}

/**
 * 查询物流渠道列表
 */
export function getLogisticsChannelList() {
  return request
    .get<any>({
      url: `${BASE_URL}/logistics-channels`
    })
    .then((response) => {
      const data = response?.data || response
      return (Array.isArray(data) ? data : data?.data || []) as LogisticsChannelVo[]
    })
}

/**
 * 分页查询物流渠道列表
 * @param params.transportMode 可选；TMS 若未在契约中支持则勿依赖，否则可能导致空列表。联动筛选应使用返回的 transportPlanList[].transportMode。
 */
export function getLogisticsChannelPage(params: {
  currentPage: number
  pageSize?: number
  keyword?: string
  statusList?: number[]
  transportMode?: string
}) {
  const data: Record<string, unknown> = {
    currentPage: params.currentPage || 1,
    pageSize: params.pageSize || 20,
    hasCount: true,
    searchValue: params.keyword || undefined,
    statusList: params.statusList || [1] // 默认只查询启用状态
  }
  if (params.transportMode != null && String(params.transportMode).trim() !== '') {
    data.transportMode = params.transportMode
  }
  return request
    .post<any>({
      url: `/tms/tms-logistics-channel/page`,
      data
    })
    .then((response) => {
      const data = response?.data || response
      const records = (data?.dtoList || []).map((item: any) => {
        const transportPlanList: LogisticsChannelPlanVo[] = (
          item.transportPlanList ||
          item.transportPlans ||
          []
        ).map((p: any) => ({
          id: p.id,
          planName: p.planName ?? p.plan_name,
          /** 必须与字典 transport_method.dictItemCode 对齐，供发货计划按运输方式过滤渠道 */
          transportMode: p.transportMode ?? p.transport_mode
        }))
        return {
          id: item.id,
          channelName: item.channelName || '',
          transitTime: item.totalAgingDays || 0,
          enableStatus: item.status,
          transportPlanList
        } as LogisticsChannelVo
      })
      return {
        records,
        total: data?.total || 0,
        current: params.currentPage || 1,
        size: params.pageSize || 20
      }
    })
}

/**
 * 添加商品（查询可选产品列表）
 */
export function getSelectableProducts(params: {
  currentPage: number
  pageSize?: number
  keyword?: string
  region?: string
  sellerId?: string
  sellerSku?: string
  localSku?: string
  productType?: number
}) {
  return request
    .post<any>({
      url: `${BASE_URL}/products/searchProducts`,
      data: params
    })
    .then((response) => {
      const data = response?.data || response
      return {
        records: (data?.dtoList || []) as ProductSelectVo[],
        total: data?.total || 0,
        current: params.currentPage,
        size: params.pageSize || 20
      }
    })
}

/**
 * 查询采购订单可锁定量汇总（按SKU分组求和）
 * @param params.skuCodeList - SKU编码列表
 * @param params.warehouseId - 仓库ID，可选，为空/null则查询所有仓库
 */
export function getLockableQtySumBySku(params: {
  skuCodeList: string[]
  warehouseId?: number | null
}) {
  return request
    .post<any>({
      url: `${BASE_URL}/purchase-orders/lockable-qty/sum-by-sku`,
      data: {
        skuCodeList: params.skuCodeList,
        warehouseId: params.warehouseId ?? null
      }
    })
    .then((response) => {
      const data = response?.data || response
      return (Array.isArray(data) ? data : data?.data || []) as SkuLockableQtySummaryVo[]
    })
}

/**
 * 查询亚马逊货件列表
 */
export function getAmazonShipmentList(params: { msku: string; region: string; sellerId: string }) {
  return request
    .post<any>({
      url: `${BASE_URL}/amazon-shipment/list`,
      data: params
    })
    .then((response) => {
      const data = response?.data || response
      return (Array.isArray(data) ? data : data?.data || []) as AmazonShipmentListVo[]
    })
}

/**
 * 批量查询亚马逊货件列表
 * 传入多个商品信息，合并返回所有匹配的货件（去重）
 */
export interface AmazonShipmentBatchQueryItem {
  itemId: number // 商品明细ID（用于关联返回结果）
  msku: string // MSKU（亚马逊的seller_sku）
  region: string // 国家/地区（如：US、EU等）
  sellerId: string // 卖家ID
}

export function getAmazonShipmentBatchList(items: AmazonShipmentBatchQueryItem[]) {
  return request
    .post<any>({
      url: `${BASE_URL}/amazon-shipment/batch-list`,
      data: { items }
    })
    .then((response) => {
      const data = response?.data || response
      return (Array.isArray(data) ? data : data?.data || []) as AmazonShipmentListVo[]
    })
}

/**
 * 查询批次已关联货件信息（回显）
 */
export function getAssociatedShipments(batchId: number) {
  return request
    .get<any>({
      url: `${BASE_URL}/associate-shipment/${batchId}`
    })
    .then((response) => {
      const data = response?.data || response
      return (
        Array.isArray(data) ? data : data?.data || []
      ) as ShippingPlanBatchItemAssociatedShipmentVo[]
    })
}

/** 关联货件 - 单个货件关联项 */
export interface ShipmentAssociationItem {
  associatedQty: number
  destinationFulfillmentCenterId?: string
  shipmentId: string
  shipmentName?: string
}

/** 关联货件 - 商品与货件关联项 */
export interface ItemShipmentAssociation {
  itemId: number
  shipments: ShipmentAssociationItem[]
}

/** 关联货件请求参数（符合 AssociateShipmentDto 定义） */
export interface AssociateShipmentDto {
  batchId: number
  itemAssociations?: ItemShipmentAssociation[]
  shipmentIds?: string[]
}

/**
 * 关联货件
 * 按接口定义使用 itemAssociations 格式，包含 destinationFulfillmentCenterId 在 shipments 内
 */
export function associateShipment(data: AssociateShipmentDto) {
  return request.post<void>({
    url: `${BASE_URL}/associate-shipment`,
    data,
    showSuccessMessage: true
  })
}

/**
 * 取消关联货件（单个批次）
 * 仅待处理且已关联货件的 FBA 仓发货计划；POST /wms/shipping-plan-batch/disassociate-shipment/{batchId}
 */
export function disassociateBatchShipment(batchId: number) {
  return request.post<void>({
    url: `${BASE_URL}/disassociate-shipment/${batchId}`,
    showSuccessMessage: false
  })
}

/** 生成调拨单结果 */
export interface GenerateTransferOrderResultVo {
  /** 生成的调拨单数量 */
  count: number
  /** 生成的调拨单ID列表 */
  transferOrderIds: number[]
}

/**
 * 根据发货计划明细生成调拨单
 * 海运按计划发货周分组，非海运按计划发货时间分组。FBA仓必须已关联货件
 * @param itemIds 发货计划明细ID列表
 */
export function generateTransferOrders(itemIds: number[]) {
  return request.post<GenerateTransferOrderResultVo>({
    url: `${BASE_URL}/generate-transfer-orders`,
    data: { itemIds },
    showSuccessMessage: false
  })
}

/**
 * 导出发货计划
 */
export function exportShipping(params: ShippingPlanBatchQueryDto) {
  return request.exportPost<Blob>({
    url: `${BASE_URL}/export`,
    data: { ...params, pageSize: -1 }
  })
}

/**
 * 获取操作日志
 * 注意：从详情数据中获取，API文档没有单独的操作日志接口
 */
export function getOperationLog(id: number) {
  return getShippingDetail(id).then((detail) => {
    // 返回空数组，实际需要根据API返回的数据结构调整
    console.warn('getOperationLog: 需要实现实际的获取操作日志接口', detail)
    return []
  })
}

/**
 * 编辑单据负责人与单据备注（共用同一接口）
 * 接口: POST /wms/shipping-plan-batch/editResponsiblePerson
 * @param id 发货计划单ID（批次ID）
 * @param responsiblePersonIds 负责人ID列表
 * @param documentRemark 可选，单据备注（与单据负责人共用此接口时传入）
 */
export function editResponsiblePerson(
  id: number,
  responsiblePersonIds: number[],
  documentRemark?: string
) {
  const uniqueIds = [...new Set(responsiblePersonIds)]
  const data: { id: number; responsiblePersonIds: number[]; documentRemark?: string } = {
    id,
    responsiblePersonIds: uniqueIds
  }
  if (documentRemark !== undefined) {
    data.documentRemark = documentRemark
  }
  return request.post({
    url: `${BASE_URL}/editResponsiblePerson`,
    data
  })
}

/**
 * 快捷更新单据负责人（调用 editResponsiblePerson 接口）
 * @param destWarehouseType 保留参数，兼容详情页调用，接口不需要
 */
export function updateOwner(id: number, responsiblePersonIds: number[]) {
  return editResponsiblePerson(id, responsiblePersonIds)
}

/**
 * 快捷更新单据备注（使用save接口）
 */
export function updateRemark(id: number, documentRemark: string, destWarehouseType: number) {
  return getShippingDetail(id).then((detail) => {
    return saveShipping({
      id,
      applicationReason: detail.applicationReason,
      destinationWarehouseId: detail.destinationWarehouseId!,
      shippingWarehouseId: detail.shippingWarehouseId!,
      documentRemark,
      responsiblePersonIds: detail.responsiblePersonIds,
      attachments: detail.attachments,
      destWarehouseType,
      items: detail.items?.map((item) => ({
        id: item.id,
        skuId: item.skuId!,
        plannedShippingQty: item.plannedShippingQty!,
        transportMethod: item.transportMethod!,
        logisticsChannelId: item.logisticsChannelId!,
        plannedShippingTime: item.plannedShippingTime!,
        estimatedArrivalTime: item.estimatedArrivalTime!
      }))
    })
  })
}

/**
 * 快捷更新附件（使用save接口）
 */
export function updateShippingAttachment(id: number, attachments: AttachmentItem[]) {
  return getShippingDetail(id).then((detail) => {
    return saveShipping({
      id,
      applicationReason: detail.applicationReason,
      destinationWarehouseId: detail.destinationWarehouseId!,
      shippingWarehouseId: detail.shippingWarehouseId!,
      documentRemark: detail.documentRemark,
      responsiblePersonIds: detail.responsiblePersonIds,
      attachments,
      items: detail.items?.map((item) => ({
        id: item.id,
        skuId: item.skuId!,
        plannedShippingQty: item.plannedShippingQty!,
        transportMethod: item.transportMethod!,
        logisticsChannelId: item.logisticsChannelId!,
        plannedShippingTime: item.plannedShippingTime!,
        estimatedArrivalTime: item.estimatedArrivalTime!
      }))
    })
  })
}

/**
 * 更新标签资料
 * @param data 更新参数
 */
export function updateLabel(data: { businessId: number; labelMaterial: LabelMaterialItem[] }) {
  return request.post<string>({
    url: `${BASE_URL}/updateLabel`,
    data,
    showSuccessMessage: true
  })
}

// 店铺简单信息VO
export interface StoreSimpleVo {
  sellerId: string
  storeName: string
  platform?: string // SC、VC
}

// 根据SKU和店铺查询产品请求参数
export interface SearchByStoreParams {
  currentPage: number
  pageSize?: number
  hasCount?: boolean
  keyword?: string
  localSku?: string
  orderBy?: string
  productType?: number // 1-SC商品, 2-VC商品
  region?: string
  sellerId?: string
  sellerSku?: string
}

// 交货计划简单信息VO（用于生成发货计划）
export interface DeliveryPlanSimpleVo {
  id: number // 交货计划ID
  deliveryPlanBatch?: string // 交货计划批次
  orderId?: number // 采购订单ID
  skuCode: string // SKU编码
  skuId?: number // SKU ID，用于详情链接
  spuCode?: string // SPU编码
  spuId?: number // SPU ID，用于详情链接
  spuName?: string // SPU中文款名
  productChineseName?: string // 中文品名
  materialCode?: string // 物料编码
  imageUrl?: string // 图片URL
  planQty: number // 计划交货量
  quantityPerBox?: number // 单箱数量
  boxCount?: number // 箱数
  planDeliveryDate?: string // 计划交货日期
  categoryName?: string
  brandName?: string
}

/**
 * 根据ID列表查询交货计划
 * 根据交货计划ID列表查询，提取SKU和计划交货量，用于发货计划添加商品
 * 接口地址: GET /wms/shipping-plan-batch/delivery-plans
 */
export function getDeliveryPlansByIds(ids: number[]) {
  return request
    .get<any>({
      url: `${BASE_URL}/delivery-plans`,
      params: { ids: ids.join(',') }
    })
    .then((response) => {
      const data = response?.data || response
      return (Array.isArray(data) ? data : data?.data || []) as DeliveryPlanSimpleVo[]
    })
}

/**
 * 根据SKU查询关联商品的店铺列表
 * 根据本地SKU查询关联的所有商品，提取店铺ID和名称（去重）
 */
export function getStoresByLocalSku(localSku: string) {
  return request
    .post<any>({
      url: `${BASE_URL}/products/stores`,
      data: {
        currentPage: 1,
        pageSize: -1,
        localSku
      }
    })
    .then((response) => {
      const data = response?.data || response
      return (Array.isArray(data) ? data : data?.data || []) as StoreSimpleVo[]
    })
}

/**
 * 根据SKU和店铺查询商品列表
 * 带出本地SKU信息后，支持选择关联的销售SKU
 */
export function searchProductsByStore(params: SearchByStoreParams) {
  return request
    .post<any>({
      url: `${BASE_URL}/products/searchByStore`,
      data: params
    })
    .then((response) => {
      const data = response?.data || response
      return {
        records: (data?.dtoList || []) as ProductSelectVo[],
        total: data?.total || 0,
        current: params.currentPage,
        size: params.pageSize || 20
      }
    })
}
