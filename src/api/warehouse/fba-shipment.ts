/**
 * FBA货件 API
 * @author Claude Code
 * @date 2026-01-19
 */

import request from '@/utils/http'

// API 基础路径
const BASE_URL = '/wms/fba-shipment'

// ============ 类型定义 ============

/** FBA货件查询参数 */
export interface FbaShipmentQueryDto {
  currentPage: number
  pageSize: number
  hasCount?: boolean
  hasDiscrepancy?: number // 收发差异筛选：0-无差异，1-有差异
  keyword?: string // 关键词搜索（货件编号/Reference ID）
  orderBy?: string
  region?: string // 国家/地区（US/EU等）
  sellerId?: string // 卖家ID（店铺标识）
  shipmentStatus?: string // 货件状态（WORKING/SHIPPED/RECEIVING/CLOSED/CANCELLED/DELETED）
  shippedTimeEnd?: string
  shippedTimeStart?: string
}

/** FBA货件列表项 */
export interface FbaShipmentListVo {
  batchId?: number // 关联发货计划批次ID（用于跳转）
  batchNo?: string // 关联发货计划批次号
  destinationFulfillmentCenterId: string // 物流中心编码
  hasDiscrepancy: number // 是否有差异：0-无差异，1-有差异
  isSta: number // 是否STA货件：0-否，1-是
  items?: FbaShipmentItemVo[] // 商品明细列表
  referenceId: string // Reference ID
  region: string // 国家/地区
  seller: string // 店铺名称
  sellerId: string // 卖家ID
  shipmentId: string // 货件ID（FBA ShipmentId）
  shipmentName: string // 货件名称
  shipmentStatus: string // 货件状态
  shippedTime: string // 发货时间
  staShipmentId: string // STA货件ID（用于装箱明细查询）
  staPlanName: string // STA任务名称
  totalDiscrepancy: number // 收发差异总量
  totalQuantityReceived: number // 已签收总量
  totalQuantityShipped: number // 申报总量
  totalQuantityShippedLocal: number // 已发货总量（本地）
  transferOrderId?: number // 关联调拨单ID（用于跳转）
  transferOrderNo?: string // 关联调拨单号
  updateTime: string // 更新时间
}

/** 异步更新货件任务响应 */
export interface AsyncUpdateShipmentsTaskResp {
  code?: number
  data?: string
  msg?: string
  success?: boolean
}

/** 状态统计 */
export interface FbaShipmentStatusCountVo {
  closedCount: number
  receivingCount: number
  shippedCount: number
  totalCount: number
  workingCount: number
}

/** 分页结果 */
export interface FbaShipmentPageResultVo {
  dtoList: FbaShipmentListVo[]
  statusCount: FbaShipmentStatusCountVo
  total: number
}

/** 货件详情 */
export interface FbaShipmentDetailVo {
  boxes: FbaShipmentBoxVo[]
  deliveryWindow: string // 送达时段
  destinationFulfillmentCenterId: string // 物流中心编码
  documentRemark?: string // 单据备注
  isSta: number // 是否STA货件
  items: FbaShipmentItemVo[]
  referenceId: string
  region: string
  responsiblePersonIds?: number[] // 单据负责人ID列表
  responsiblePersonNames?: string[] // 单据负责人名称列表
  seller: string
  sellerId: string
  shipToAddress: string // 配送地址
  shipmentId: string
  shipmentName: string
  shipmentStatus: string
  shippedTime: string
  shippingMode: string // 配送模式
  shippingSolution: string // 运输方案
  staShipmentId: string // STA货件ID（用于装箱明细查询）
  staPlanName: string
  totalBoxCount: number
  totalVolume: number // 总体积(CBM/m³)
  totalWeight: number // 总重量(KG)
}

/** 编辑货件扩展信息入参（备注、附件、单据负责人） */
export interface FbaShipmentEditDto {
  attachments?: { name?: string; uid?: string; url?: string }[]
  documentRemark?: string
  region: string
  responsiblePersonIds?: number[]
  sellerId: string
  shipmentId: string
}

/** 货件商品明细 */
export interface FbaShipmentItemVo {
  asin: string
  discrepancy: number // 收发差异
  fnsku: string
  imageUrl: string
  labelOwner: string // 标签类型
  msku: string // MSKU（销售SKU）
  packagingType: string // 包装类型
  parentAsin: string
  prepOwner: string // 预处理提供方
  quantityReceived: number // 已签收
  quantityShipped: number // 申报量
  quantityShippedLocal: number // 已发货（本地）
  rowNum: number // 序号
  skuId?: number // 产品 SKU ID，用于打开 SKU 详情
  skuName: string // SKU/中文品名
}

/** 装箱明细 */
export interface FbaShipmentBoxVo {
  asin: string
  boxName: string // 箱号
  dimensions: string // 箱子尺寸(CM)：长*宽*高
  fnsku: string
  imageUrl: string
  labelOwner: string
  msku: string
  parentAsin: string
  prepOwner: string
  quantityInBox: number // 单箱数量
  skuId?: number // 产品 SKU ID，用于打开 SKU 详情
  skuName: string
  weight: number // 箱子毛重(KG)
}

/** 装箱明细结果 */
export interface FbaShipmentBoxResultVo {
  list: FbaShipmentBoxVo[]
  totalBoxCount: number
  totalVolume: number
  totalWeight: number
}

// ============ API 方法 ============

/**
 * 分页查询货件列表
 * @param params 查询参数
 */
export function getFbaShipmentList(params: FbaShipmentQueryDto) {
  return request
    .post<any>({
      url: `${BASE_URL}/list`,
      data: params
    })
    .then((response) => {
      const data = response?.data || response
      return {
        dtoList: data?.dtoList || [],
        statusCount: data?.statusCount || {
          closedCount: 0,
          receivingCount: 0,
          shippedCount: 0,
          totalCount: 0,
          workingCount: 0
        },
        total: data?.total || 0
      } as FbaShipmentPageResultVo
    })
}

/**
 * 查询货件状态统计
 * @param params 查询参数
 */
export function getFbaShipmentStatusCount(params: FbaShipmentQueryDto) {
  return request
    .post<any>({
      url: `${BASE_URL}/status-count`,
      data: params
    })
    .then((response) => {
      const data = response?.data || response
      return {
        closedCount: data?.closedCount || 0,
        receivingCount: data?.receivingCount || 0,
        shippedCount: data?.shippedCount || 0,
        totalCount: data?.totalCount || 0,
        workingCount: data?.workingCount || 0
      } as FbaShipmentStatusCountVo
    })
}

/**
 * 查询货件详情
 * @param shipmentId 货件ID
 * @param region 国家/地区
 * @param sellerId 卖家ID
 */
export function getFbaShipmentDetail(shipmentId: string, region: string, sellerId: string) {
  return request
    .get<any>({
      url: `${BASE_URL}/${shipmentId}`,
      params: { region, sellerId }
    })
    .then((response) => {
      let result = response?.data || response
      if (result && typeof result === 'object' && 'code' in result && 'data' in result) {
        result = result.data
      }
      return result as FbaShipmentDetailVo
    })
}

/**
 * 查询货件商品明细
 * @param shipmentId 货件ID
 * @param region 国家/地区
 * @param sellerId 卖家ID
 */
export function getFbaShipmentItems(shipmentId: string, region: string, sellerId: string) {
  return request
    .get<any>({
      url: `${BASE_URL}/${shipmentId}/items`,
      params: { region, sellerId }
    })
    .then((response) => {
      const data = response?.data || response
      return (Array.isArray(data) ? data : []) as FbaShipmentItemVo[]
    })
}

/**
 * 查询货件装箱明细
 * @param staShipmentId STA货件ID
 * @param region 国家/地区
 * @param sellerId 卖家ID
 */
export function getFbaShipmentBoxes(staShipmentId: string, region: string, sellerId: string) {
  return request
    .get<any>({
      url: `${BASE_URL}/${staShipmentId}/boxes`,
      params: { region, sellerId }
    })
    .then((response) => {
      const data = response?.data || response
      return {
        list: data?.list || [],
        totalBoxCount: data?.totalBoxCount || 0,
        totalVolume: data?.totalVolume || 0,
        totalWeight: data?.totalWeight || 0
      } as FbaShipmentBoxResultVo
    })
}

/**
 * 导出货件列表
 * @param params 查询参数
 */
export function exportFbaShipmentList(params: FbaShipmentQueryDto) {
  return request.post<Blob>({
    url: `${BASE_URL}/export`,
    data: { ...params, pageSize: -1 },
    responseType: 'blob'
  })
}

/**
 * 导出货件商品明细
 * @param shipmentId 货件ID
 * @param region 国家/地区
 * @param sellerId 卖家ID
 */
export function exportFbaShipmentItems(shipmentId: string, region: string, sellerId: string) {
  return request.get<Blob>({
    url: `${BASE_URL}/${shipmentId}/items/export`,
    params: { region, sellerId },
    responseType: 'blob'
  })
}

/**
 * 异步更新货件，返回 taskId
 */
export function asyncUpdateShipments() {
  return request.post<AsyncUpdateShipmentsTaskResp>({
    url: `${BASE_URL}/asyncUpdateShipments`,
    showSuccessMessage: false
  })
}

/**
 * 查询异步更新货件任务进度
 */
export function getAsyncUpdateShipmentsTask(taskId: string) {
  return request.get<AsyncUpdateShipmentsTaskResp>({
    url: `${BASE_URL}/getAsyncUpdateShipmentsTask/${encodeURIComponent(taskId)}`,
    showSuccessMessage: false
  })
}

/**
 * 编辑货件扩展信息（备注、附件、单据负责人），不存在则自动创建
 */
export function editFbaShipment(data: FbaShipmentEditDto) {
  return request.post<void>({
    url: `${BASE_URL}/edit`,
    data
  })
}
