/*
 * Portfolio demo
 * @Date: 2025-01-XX
 * @Description: 数据权限辅助接口 - 用于查询店铺、产品、仓库、供应商等数据
 */
import request from '@/utils/http'

/**
 * 店铺相关接口
 */

/**
 * 店铺数据项接口
 * @property {number} id - 店铺ID
 * @property {string} platform - 平台名称（如：亚马逊SC、亚马逊VC）
 * @property {string} storeName - 店铺名称
 * @property {string} market - 市场（如：北美、欧洲）
 * @property {string} country - 国家（如：美国、英国）
 * @property {string} org - 销售组织
 * @property {string} [accountCode] - 店铺编码（可选）
 */
export interface ShopItem {
  id: number
  platform: string
  storeName: string
  market: string
  country: string
  org: string
  accountCode?: string
}

/**
 * 店铺列表查询参数
 * @property {number} [currentPage] - 当前页码，从1开始
 * @property {number} [pageSize] - 每页条数，-1表示查询全部
 * @property {string} [platform] - 平台筛选条件
 * @property {string} [country] - 国家筛选条件
 * @property {string} [storeName] - 店铺名称模糊搜索
 * @property {string} [accountCode] - 店铺编码筛选
 * @property {boolean} [applyDataPermission] - 为 true 时按当前用户数据权限过滤，用于配置数据权限时的穿梭框
 */
export interface ShopListParams {
  currentPage?: number
  pageSize?: number
  platform?: string
  country?: string
  storeName?: string
  accountCode?: string
  applyDataPermission?: boolean
}

/**
 * 查询店铺列表
 * 用于数据权限配置中选择店铺时加载店铺列表
 * 传入 applyDataPermission: true 时，后端按当前用户数据权限过滤，穿梭框仅展示有权限的店铺
 * @param {ShopListParams} params - 查询参数
 * @returns {Promise} 返回店铺列表和总数
 */
export function fetchShopList(params: ShopListParams) {
  return request.post<ShopItem[]>({
    url: '/apis/basic/StoreManage/getAllStoreInfo',
    data: params
  })
}

/**
 * 批量查询店铺详情
 * 根据店铺ID列表批量获取店铺详细信息，用于权限配置数据回显
 * @param {number[]} ids - 店铺ID数组
 * @returns {Promise<ShopItem[]>} 返回店铺详情数组
 * @example
 * const shops = await fetchShopBatchDetail([1, 2, 3])
 * // 返回ID为1,2,3的店铺详细信息
 */
export function fetchShopBatchDetail(ids: number[]) {
  return request.post<ShopItem[]>({
    url: '/apis/basic/account/batchDetail',
    data: { ids }
  })
}

/**
 * 产品相关接口
 */

/**
 * 产品数据项接口
 * @property {number} id - 产品ID
 * @property {string} sku - SKU编码
 * @property {string} cnName - 中文品名
 * @property {string} spu - SPU编码
 * @property {string} category - 分类/品类
 * @property {string} brand - 品牌
 * @property {string} [productCode] - 产品编码（可选）
 */
export interface ProductItem {
  id: number
  sku: string
  cnName: string
  spu: string
  category: string
  brand: string
  productCode?: string
}

/**
 * 产品列表查询参数
 * @property {number} [currentPage] - 当前页码
 * @property {number} [pageSize] - 每页条数，-1表示查询全部
 * @property {string} [sku] - SKU模糊搜索
 * @property {string} [spu] - SPU模糊搜索
 * @property {string} [category] - 分类筛选
 * @property {string} [brand] - 品牌筛选
 * @property {string} [productCode] - 产品编码筛选
 * @property {boolean} [applyDataPermission] - 为 true 时按当前用户数据权限过滤，用于配置数据权限时的穿梭框
 */
export interface ProductListParams {
  currentPage?: number
  pageSize?: number
  sku?: string
  spu?: string
  category?: string
  brand?: string
  productCode?: string
  applyDataPermission?: boolean
}

/**
 * 查询产品列表
 * 用于数据权限配置中选择产品时加载产品列表
 * 传入 applyDataPermission: true 时，后端按当前用户数据权限过滤，穿梭框仅展示有权限的产品
 * @param {ProductListParams} params - 查询参数
 * @returns {Promise} 返回产品列表和总数
 */
export function fetchProductList(params: ProductListParams) {
  return request.post<{
    dtoList: ProductItem[]
    total: number
  }>({
    url: '/apis/basic/product/sku/page',
    data: params
  })
}

/**
 * 批量查询产品详情
 * 根据产品ID列表批量获取产品详细信息，用于权限配置数据回显
 * @param {number[]} ids - 产品ID数组
 * @returns {Promise<ProductItem[]>} 返回产品详情数组
 */
export function fetchProductBatchDetail(ids: number[]) {
  return request.post<ProductItem[]>({
    url: '/basic/product/sku/getBatchProductSkuBasicByIds',
    data: ids
  })
}

/**
 * 仓库相关接口
 */
export interface WarehouseItem {
  id: number
  name: string
  code: string
  type: string
  warehouseCode?: string
}

export interface WarehouseListParams {
  currentPage?: number
  pageSize?: number
  name?: string
  type?: string
  code?: string
  /** 为 true 时按当前用户数据权限过滤，用于配置数据权限时的穿梭框 */
  applyDataPermission?: boolean
}

/**
 * 查询仓库列表
 * GET /apis/basic/warehouseInfo/getAllWarehouseInfo
 * 传入 applyDataPermission: true 时，后端按当前用户数据权限过滤列表
 */
export function fetchWarehouseList(params: WarehouseListParams) {
  return request.get<{
    records: WarehouseItem[]
    total: number
  }>({
    url: '/apis/basic/warehouseInfo/getAllWarehouseInfo',
    params: params
  })
}

/**
 * 批量查询仓库详情
 * POST /apis/basic/warehouse/batchDetail
 */
export function fetchWarehouseBatchDetail(ids: number[]) {
  return request.post<WarehouseItem[]>({
    url: '/apis/basic/warehouse/batchDetail',
    data: { ids }
  })
}

/**
 * 供应商相关接口
 */
export interface SupplierItem {
  id: number
  name: string
  code: string
}

export interface SupplierListParams {
  currentPage?: number
  pageSize?: number
  name?: string
  code?: string
  /** 为 true 时按当前用户数据权限过滤，用于配置数据权限时的穿梭框 */
  applyDataPermission?: boolean
}

/**
 * 查询供应商列表
 * POST /apis/basic/supplier/list
 * 传入 applyDataPermission: true 时，后端按当前用户数据权限过滤，穿梭框仅展示有权限的供应商
 */
export function fetchSupplierListForPermission(params: SupplierListParams) {
  return request.post<{
    dtoList: SupplierItem[]
    total: number
  }>({
    url: '/apis/basic/supplier/list',
    data: params
  })
}

/**
 * 用户相关接口
 */
export interface UserItem {
  id: number
  name: string
  userName?: string
  realName?: string
}

/**
 * 查询用户列表（用于数据权限）
 * 用于成员配置、权限配置中选择用户时加载用户列表
 * @param {Object} params - 查询参数
 * @param {number} [params.currentPage] - 当前页码
 * @param {number} [params.pageSize] - 每页条数，-1表示查询全部
 * @param {string} [params.userName] - 用户名模糊搜索
 * @param {string} [params.realName] - 真实姓名模糊搜索
 * @returns {Promise} 返回用户列表和总数
 */
export function fetchUserListForPermission() {
  return request.get<{
    dtoList: UserItem[]
    total: number
  }>({
    url: '/apis/system/sys-user/getAllUserInfo',
    data: {}
  })
}

/**
 * 批量查询用户详情
 * 根据用户ID列表批量获取用户详细信息，用于权限配置数据回显
 * 主要用于区分用户ID和部门ID（当ID列表混合时）
 * @param {number[]} ids - 用户ID数组
 * @returns {Promise<UserItem[]>} 返回用户详情数组
 */
export function fetchUserBatchDetail(ids: number[]) {
  return request.post<UserItem[]>({
    url: '/apis/basic/user/batchDetail',
    data: { ids }
  })
}

/**
 * 部门相关接口
 */
export interface DeptItem {
  id: number
  name: string
  deptName?: string
  deptCode?: string
}

/**
 * 查询部门列表（用于数据权限）
 * 用于权限配置中选择部门时加载部门列表
 * @param {Object} params - 查询参数
 * @param {number} [params.currentPage] - 当前页码
 * @param {number} [params.pageSize] - 每页条数，-1表示查询全部
 * @param {string} [params.deptName] - 部门名称模糊搜索
 * @returns {Promise} 返回部门列表和总数
 */
export function fetchDeptListForPermission(params: {
  currentPage?: number
  pageSize?: number
  deptName?: string
}) {
  return request.post<{
    dtoList: DeptItem[]
    total: number
  }>({
    url: '/apis/basic/dept/list',
    data: params
  })
}

/**
 * 批量查询部门详情
 * 根据部门ID列表批量获取部门详细信息，用于权限配置数据回显
 * 主要用于区分用户ID和部门ID（当ID列表混合时）
 * @param {number[]} ids - 部门ID数组
 * @returns {Promise<DeptItem[]>} 返回部门详情数组
 */
export function fetchDeptBatchDetail(ids: number[]) {
  return request.post<DeptItem[]>({
    url: '/apis/basic/dept/batchDetail',
    data: { ids }
  })
}
