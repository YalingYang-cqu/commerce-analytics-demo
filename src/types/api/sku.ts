/**
 * SKU相关类型定义
 */

// SKU状态枚举
export enum SkuStatus {
  DEVELOPING = '开发中',
  ON_SALE = '在售',
  CLEARANCE = '清仓',
  OFF_SALE = '停售'
}

// 负责人类型枚举
export enum ResponsibleType {
  DEVELOPER = '开发人',
  PRODUCT_OWNER = '产品负责人',
  LOGISTICS_OWNER = '物流负责人',
  PURCHASE_OWNER = '采购负责人',
  FINANCE_OWNER = '财务负责人'
}

// 更新方式枚举
export enum UpdateMethod {
  OVERWRITE = '覆盖',
  ADD = '新增'
}

// SKU列表项接口
export interface SkuItem {
  id?: string | number
  image?: string // 图片
  sku: string // SKU编码
  chineseProductName?: string // 中文品名
  englishProductName?: string // 英文品名
  spu?: string // SPU编码
  styleName?: string // 款名
  materialCode?: string // 物料编码
  category?: string // 分类
  categoryId?: string | number // 分类ID
  brand?: string // 品牌
  brandId?: string | number // 品牌ID
  productStatus?: string // 状态
  developmentUsers?: string // 开发人
  productOwnerUsers?: string // 产品负责人
  logisticsOwnerUsers?: string // 物流负责人
  purchaseOwnerUsers?: string // 采购负责人
  financeOwnerUsers?: string // 财务负责人
  createTime?: string // 创建时间
  updateTime?: string // 更新时间
  updateUser?: string // 更新人
  [key: string]: any // 其他字段
}

// SKU搜索表单接口
export interface SkuSearchForm {
  categoryIds?: (string | number)[] // 分类ID列表
  brandIds?: (string | number)[] // 品牌ID列表
  statusList?: string[] // 状态列表
  developmentUserIds?: (string | number)[] // 开发人ID列表
  productOwnerUserIds?: (string | number)[] // 产品负责人ID列表
  purchaseOwnerUserIds?: (string | number)[] // 采购负责人ID列表
  logisticsOwnerUserIds?: (string | number)[] // 物流负责人ID列表
  financeOwnerUserIds?: (string | number)[] // 财务负责人ID列表
  searchType?: string // 搜索类型
  searchValue?: string // 搜索值
  startCreateTime?: string // 创建开始时间
  endCreateTime?: string // 创建结束时间
  startUpdateTime?: string // 更新开始时间
  endUpdateTime?: string // 更新结束时间
}

// SKU分页请求参数接口
export interface SkuPageParams extends SkuSearchForm {
  currentPage: number
  pageSize: number
  hasCount?: boolean
}

// 设置负责人请求参数接口
export interface SetResponsibleParams {
  skuIds: (string | number)[] // SKU ID列表
  updateMethod: string // 更新方式：覆盖或新增
  responsibleType: string // 负责人类型
  userIds: (string | number)[] // 用户ID列表
}

// 批量删除请求参数接口
export interface BatchDeleteParams {
  skuIds: (string | number)[] // SKU ID列表
}
