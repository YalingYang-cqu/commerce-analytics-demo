import request from '@/utils/http'
import type { Api } from '@/typings/api'
import { fetchGetLogisticsList } from '@/api/logistics'

// ==================== 接口路径配置 ====================
// API 前缀（用于代理转发）
// 业务系统接口前缀
const BASE_URL = `/tms/tms-transport-plan`
// 供应商协同接口前缀
const SUPPLIER_BASE_URL = `/tms/clb-sys-openapi/tms-transport-plan`

// ==================== 字段映射工具函数 ====================

/** 运输方式映射：API值与前端值一致 */
const transportModeMap: Record<string, Api.LogisticsMethod.TransportMethod> = {
  SEA_FCL: 'SEA_FCL',
  SEA_LCL: 'SEA_LCL',
  AIR: 'AIR',
  EXPRESS: 'EXPRESS',
  TRUCK: 'TRUCK',
  RAIL: 'RAIL',
  MULTI: 'MULTI'
}

/** 运输方式映射：前端 -> API（值一致） */
const transportModeReverseMap: Record<string, string> = {
  SEA_FCL: 'SEA_FCL',
  SEA_LCL: 'SEA_LCL',
  AIR: 'AIR',
  EXPRESS: 'EXPRESS',
  TRUCK: 'TRUCK',
  RAIL: 'RAIL',
  MULTI: 'MULTI'
}

/** 运输方式名称映射 */
const transportModeNameMap: Record<string, string> = {
  SEA_FCL: '海运整柜',
  SEA_LCL: '海运拼柜',
  AIR: '空运',
  EXPRESS: '快递',
  TRUCK: '卡航',
  RAIL: '铁路',
  MULTI: '多式联运'
}

/** 货物属性映射：中文 -> API */
const cargoTypeReverseMap: Record<string, string> = {
  普货: 'GENERAL',
  带磁: 'MAGNETIC',
  带电: 'WITH_BATTERY',
  /** 与「带电」同枚举，兼容下拉/历史数据里的括号文案 */
  '带电（内电）': 'WITH_BATTERY',
  '带电(内电)': 'WITH_BATTERY',
  纯电池: 'PURE_BATTERY',
  粉末: 'POWDER',
  液体: 'LIQUID',
  纺织品: 'TEXTILE',
  食品: 'FOOD',
  其他: 'OTHER'
}

/** 货物属性映射：API -> 中文 */
const cargoTypeNameMap: Record<string, string> = {
  GENERAL: '普货',
  MAGNETIC: '带磁',
  WITH_BATTERY: '带电',
  PURE_BATTERY: '纯电池',
  POWDER: '粉末',
  LIQUID: '液体',
  TEXTILE: '纺织品',
  FOOD: '食品',
  OTHER: '其他'
}

/** 将 API 返回的货物属性转为列表展示文案（英文码转中文，多项用英文逗号分隔） */
const transformCargoTypesToChinese = (cargoTypes: string | string[] | undefined): string => {
  if (cargoTypes == null || cargoTypes === '') return ''

  const toLabels = (parts: string[]) =>
    parts
      .map((t) => String(t).trim())
      .filter(Boolean)
      .map((type) => cargoTypeNameMap[type] || type)

  if (Array.isArray(cargoTypes)) {
    return toLabels(cargoTypes as string[]).join(',')
  }

  const s = String(cargoTypes).trim()
  // 后端偶发 JSON 字符串：["普货","带磁"] 或 ["GENERAL","MAGNETIC"]
  if (s.startsWith('[') && s.endsWith(']')) {
    try {
      const parsed = JSON.parse(s) as unknown
      if (Array.isArray(parsed)) {
        return toLabels(parsed as string[]).join(',')
      }
    } catch {
      /* 非合法 JSON 则走下方分隔逻辑 */
    }
  }

  return toLabels(s.split(/[;,，]/)).join(',')
}

/** 将中文货物属性转换为API需要的英文 */
const transformCargoTypeToApi = (cargoType: string): string => {
  const t = String(cargoType).trim()
  if (!t) return t
  if (cargoTypeNameMap[t]) return t
  return cargoTypeReverseMap[t] || t
}

/** 表单可接货物属性：支持多选数组或逗号拼接字符串，转为去重后的 API 枚举码数组 */
const normalizeCargoTypesForSave = (cargoAttribute: string | string[] | undefined): string[] => {
  if (cargoAttribute == null || cargoAttribute === '') return []
  const parts: string[] = Array.isArray(cargoAttribute)
    ? cargoAttribute.map((x) => String(x).trim()).filter(Boolean)
    : String(cargoAttribute)
        .split(/[,，;；]/)
        .map((s) => s.trim())
        .filter(Boolean)
  const codes = parts.map((p) => transformCargoTypeToApi(p)).filter(Boolean)
  return Array.from(new Set(codes))
}

/** 计费方式名称映射 */
const billingTypeNameMap: Record<string, string> = {
  WEIGHT: '按重量(KG)',
  VOLUME: '按体积(CBM)'
}

/** 计重规则映射：API值与前端值一致 */
const weightRuleMap: Record<string, string> = {
  TICKET: 'TICKET',
  BOX: 'BOX'
}

/** 计重规则映射：前端 -> API（值一致） */
const weightRuleReverseMap: Record<string, string> = {
  TICKET: 'TICKET',
  BOX: 'BOX'
}

/** 计重规则名称映射 */
const weightRuleNameMap: Record<string, string> = {
  TICKET: '按整票计费重取值',
  BOX: '按单箱计费重取值'
}

/** 进位规则映射：API值与前端值一致 */
const roundingRuleMap: Record<string, string> = {
  CEIL_1: 'CEIL_1',
  CEIL_0_5: 'CEIL_0_5',
  ROUND_2: 'ROUND_2',
  CEIL_0_01: 'CEIL_0_01',
  CEIL_0_001: 'CEIL_0_001'
}

/** 进位规则映射：前端 -> API（值一致） */
const roundingRuleReverseMap: Record<string, string> = {
  CEIL_1: 'CEIL_1',
  CEIL_0_5: 'CEIL_0_5',
  ROUND_2: 'ROUND_2',
  CEIL_0_01: 'CEIL_0_01',
  CEIL_0_001: 'CEIL_0_001'
}

/** 进位规则名称映射 */
const roundingRuleNameMap: Record<string, string> = {
  CEIL_1: '向上舍入1',
  CEIL_0_5: '向上舍入0.5',
  ROUND_2: '保留两位小数',
  CEIL_0_01: '向上舍入0.01',
  CEIL_0_001: '向上舍入0.001'
}

/** 状态名称映射 */
const statusNameMap: Record<number, string> = {
  0: '禁用',
  1: '启用'
}

// ==================== 响应数据转换 ====================

/** 将 API 列表项响应转换为前端 ListItem */
const transformListItem = (item: any): Api.LogisticsMethod.ListItem => {
  const transportMode = item.transportMode || ''
  const billingType = item.billingType || ''
  const roundingRule = item.roundingRule || ''
  const weightRule = item.weightRule || ''

  return {
    id: item.id,
    methodCode: item.planCode || '',
    methodName: item.planName || '',
    providerId: item.logisticsProviderId || 0,
    providerName: item.logisticsProviderName || '',
    providerShortName: '', // API 中无此字段
    transportMethod: transportModeMap[transportMode] || 'EXPRESS',
    transportMethodName: transportModeNameMap[transportMode] || transportMode,
    channelId: item.channelId ?? undefined,
    channelName: item.channel || '',
    cutoffTime: item.sailingCutoffTime || '',
    firstMileCarrier: item.firstLegCarrier || '',
    lastMileCarrier: item.lastLegCarrier || '',
    originProvince: Array.isArray(item.shipFromPlaces)
      ? item.shipFromPlaces.join(';')
      : item.shipFromPlaces || '',
    originCity: '',
    destinationCountry: Array.isArray(item.destCountryCodes)
      ? item.destCountryCodes.join(';')
      : item.destCountryCodes || '',
    cargoAttribute: transformCargoTypesToChinese(item.cargoTypes || ''), // 转换为中文显示
    includeTax: item.taxIncluded === 1,
    acceptGeneralTrade: item.generalTradeSupported === 1,
    billingMethod: (billingType as Api.LogisticsMethod.BillingMethod) || 'WEIGHT',
    billingMethodName: billingTypeNameMap[billingType] || billingType,
    volumeWeightRatio: item.volumeWeightRatio,
    minBillingVolume: item.minChargeVolume,
    weightingRule: weightRuleMap[weightRule],
    weightingRuleName: weightRuleNameMap[weightRule] || '',
    dimensionalFactor: item.volumeParam,
    minBillingWeight: item.minChargeWeight,
    minPieceBillingWeight: item.minItemChargeWeight,
    roundingRule: roundingRuleMap[roundingRule] || roundingRule || 'UP_1',
    roundingRuleName: roundingRuleNameMap[roundingRule] || roundingRule || '',
    receiveWarehouseTypes: Array.isArray(item.receiveWarehouseTypes)
      ? item.receiveWarehouseTypes
      : [],
    zoneRule: item.zoneRule || '',
    postcodeRange: item.postcodeRange || '',
    fbaWarehouseCodes: Array.isArray(item.fbaWarehouseCodes) ? item.fbaWarehouseCodes : [],
    status: (item.status as Api.LogisticsMethod.Status) || 0,
    statusName: statusNameMap[item.status] || '未知',
    createByName: item.createByName || '',
    createTime: item.createTime || '',
    updateTime: item.updateTime || ''
  }
}

/** 将 API 详情响应转换为前端 Detail */
const transformDetail = (item: any): Api.LogisticsMethod.Detail => {
  return {
    ...transformListItem(item),
    // 详情特有字段
    maxWeight: item.maxWeight,
    maxVolume: item.maxVolume,
    remark: item.remark || '',
    attachments: []
  }
}

// ==================== 请求参数转换 ====================

/** 将前端查询参数转换为 API 请求参数 */
const transformQueryParams = (params: Api.LogisticsMethod.QueryParams): any => {
  const apiParams: any = {
    currentPage: params.currentPage || 1,
    pageSize: params.pageSize || 20,
    hasCount: true
  }

  // 搜索条件（searchType可选值：PLAN_CODE, PLAN_NAME）
  // 只有当 searchValue 有值时才传 searchType 和 searchValue
  if (params.searchValue && params.searchValue.trim()) {
    apiParams.searchType = params.searchType || 'PLAN_CODE'
    apiParams.searchValue = params.searchValue.trim()
  }

  // 状态筛选
  if (params.statusList && params.statusList.length > 0) {
    apiParams.statusList = params.statusList
  }

  // 运输方式
  if (params.transportMethods && params.transportMethods.length > 0) {
    apiParams.transportModeList = params.transportMethods.map(
      (m) => transportModeReverseMap[m] || m
    )
  }

  // 物流渠道ID（多选，与接口文档 channelIdList 一致）
  if (params.channelIds && params.channelIds.length > 0) {
    apiParams.channelIdList = params.channelIds
  }

  // 是否包税
  if (params.includeTaxList && params.includeTaxList.length > 0) {
    apiParams.taxIncludedList = params.includeTaxList.map((v) => (v ? 1 : 0))
  }

  // 是否接一般贸易
  if (params.acceptGeneralTradeList && params.acceptGeneralTradeList.length > 0) {
    apiParams.generalTradeSupportedList = params.acceptGeneralTradeList.map((v) => (v ? 1 : 0))
  }

  // 计费方式
  if (params.billingMethods && params.billingMethods.length > 0) {
    apiParams.billingTypeList = params.billingMethods
  }

  // 发货地
  if (params.originProvinces && params.originProvinces.length > 0) {
    apiParams.shipFromPlaces = params.originProvinces
  }

  // 目的国家
  if (params.destinationCountries && params.destinationCountries.length > 0) {
    apiParams.destCountries = params.destinationCountries
  }

  // 物流商
  if (params.providerIds && params.providerIds.length > 0) {
    apiParams.logisticsProviderIdList = params.providerIds
  }

  // 头程承运商
  if (params.firstMileCarriers && params.firstMileCarriers.length > 0) {
    apiParams.firstLegCarrierList = params.firstMileCarriers
  }

  // 尾程承运商
  if (params.lastMileCarriers && params.lastMileCarriers.length > 0) {
    apiParams.lastLegCarrierList = params.lastMileCarriers
  }

  // 货物属性（筛选项为中文时转为 API 枚举码）
  if (params.cargoAttributes && params.cargoAttributes.length > 0) {
    apiParams.cargoTypes = Array.from(
      new Set(params.cargoAttributes.map((a) => transformCargoTypeToApi(String(a))))
    )
  }

  return apiParams
}

/** 将前端保存参数转换为 API 请求参数 */
const transformSaveParams = (params: Api.LogisticsMethod.SaveParams): any => {
  const apiParams: any = {
    planName: params.methodName,
    logisticsProviderId: params.providerId,
    logisticsProviderName: params.providerName || '',
    logisticsProviderCode: params.providerCode || '',
    transportMode: transportModeReverseMap[params.transportMethod] || params.transportMethod,
    channel: params.channelName || '',
    channelId: params.channelId != null ? params.channelId : null,
    sailingCutoffTime: params.cutoffTime || '',
    firstLegCarrier: params.firstMileCarrier || '',
    lastLegCarrier: params.lastMileCarrier || '',
    taxIncluded: params.includeTax ? 1 : 0,
    generalTradeSupported: params.acceptGeneralTrade ? 1 : 0,
    billingType: params.billingMethod,
    /** 新建默认启用；编辑须由表单传入 detail.status（勿省略，否则恒为 1） */
    status: params.status ?? 1
  }

  // 编辑时添加 ID
  if (params.id) {
    apiParams.id = params.id
  }

  // 发货地：支持多选数组；兼容单条
  if (params.originProvinces && params.originProvinces.length > 0) {
    apiParams.shipFromPlaces = params.originProvinces
  } else if (params.originProvince) {
    apiParams.shipFromPlaces = [params.originProvince]
  }

  // 目的国家：支持多选数组；兼容单条
  if (params.destinationCountries && params.destinationCountries.length > 0) {
    apiParams.destCountryCodes = params.destinationCountries
  } else if (params.destinationCountry) {
    apiParams.destCountryCodes = [params.destinationCountry]
  }

  // 支持收货仓类型、分区规则（TMS 编辑/保存）
  if (params.receiveWarehouseTypes && params.receiveWarehouseTypes.length > 0) {
    apiParams.receiveWarehouseTypes = params.receiveWarehouseTypes
  }
  if (params.zoneRule) {
    apiParams.zoneRule = params.zoneRule
  }

  // 分区附加字段：与 zoneRule 联动，切换规则时需清空无关项（前端保证，保存时显式传空避免脏数据）
  if (params.zoneRule === 'BY_POSTCODE') {
    apiParams.postcodeRange = (params.postcodeRange || '').trim()
    apiParams.fbaWarehouseCodes = []
  } else if (params.zoneRule === 'BY_FBA_WAREHOUSE') {
    apiParams.postcodeRange = ''
    apiParams.fbaWarehouseCodes =
      params.fbaWarehouseCodes && params.fbaWarehouseCodes.length > 0
        ? [...params.fbaWarehouseCodes]
        : []
  } else {
    apiParams.postcodeRange = ''
    apiParams.fbaWarehouseCodes = []
  }

  // 货物属性：多选数组或逗号串，逐项转为 API 枚举码
  const cargoTypeCodes = normalizeCargoTypesForSave(
    params.cargoAttribute as string | string[] | undefined
  )
  if (cargoTypeCodes.length > 0) {
    apiParams.cargoTypes = cargoTypeCodes
  }

  // 计费方式相关字段
  if (params.billingMethod === 'VOLUME') {
    // 按体积计费
    if (params.volumeWeightRatio !== undefined) {
      apiParams.volumeWeightRatio = params.volumeWeightRatio
    }
    if (params.minBillingVolume !== undefined) {
      apiParams.minChargeVolume = params.minBillingVolume
    }
  } else {
    // 按重量计费
    if (params.weightingRule) {
      apiParams.weightRule = weightRuleReverseMap[params.weightingRule] || params.weightingRule
    }
    if (params.dimensionalFactor !== undefined) {
      apiParams.volumeParam = params.dimensionalFactor
    }
    if (params.minBillingWeight !== undefined) {
      apiParams.minChargeWeight = params.minBillingWeight
    }
    if (params.minPieceBillingWeight !== undefined) {
      apiParams.minItemChargeWeight = params.minPieceBillingWeight
    }
  }

  // 进位规则
  if (params.roundingRule) {
    apiParams.roundingRule = roundingRuleReverseMap[params.roundingRule] || params.roundingRule
  }

  // 最大限制
  if (params.maxWeight !== undefined) {
    apiParams.maxWeight = params.maxWeight
  }
  if (params.maxVolume !== undefined) {
    apiParams.maxVolume = params.maxVolume
  }

  // 备注
  if (params.remark) {
    apiParams.remark = params.remark
  }

  return apiParams
}

/** 亚马逊仓库分页查询入参（与后端 AmazonWarehousePageSearchVo 对齐） */
export type AmazonWarehousePageSearchParams = {
  city?: string
  country?: string
  currentPage: number
  hasCount?: boolean
  orderBy?: string
  pageSize?: number
  province?: string
  warehouseCode?: string
  /** 1-亚马逊仓库 2-海外仓 */
  warehouseType?: number
}

// ==================== API 函数 ====================

/** 分页查询亚马逊仓库（物流方案「按 FBA 仓库地址」分区下拉） */
export const fetchAmazonWarehousePage = (params: AmazonWarehousePageSearchParams) => {
  return request.post({
    url: `${BASE_URL}/amazonWarehouse/page`,
    data: params
  })
}

/** 获取物流方案列表 */
export const getLogisticsMethodList = (
  params: Api.LogisticsMethod.QueryParams,
  isSupplier = false
): Promise<{ data: Api.Common.PaginatedResponse<Api.LogisticsMethod.ListItem> }> => {
  const url = isSupplier ? `${SUPPLIER_BASE_URL}/page` : `${BASE_URL}/page`
  const apiParams = transformQueryParams(params)

  return request.post({ url, data: apiParams }).then((res: any) => {
    const data = res.data || res
    const dtoList = data.dtoList || []

    return {
      data: {
        records: dtoList.map(transformListItem),
        total: data.total || 0,
        current: params.currentPage || 1,
        size: params.pageSize || 20
      }
    }
  })
}

/** 获取物流方案详情 */
export const getLogisticsMethodDetail = (
  id: number,
  isSupplier = false
): Promise<Api.LogisticsMethod.Detail> => {
  const url = isSupplier ? `${SUPPLIER_BASE_URL}/detail` : `${BASE_URL}/detail`

  return request.post({ url, data: { id } }).then((res: any) => {
    const data = res.data || res
    return transformDetail(data)
  })
}

/** 新增物流方案 (批量新增，支持单条) */
export const addLogisticsMethod = (
  data: Api.LogisticsMethod.SaveParams,
  isSupplier = false
): Promise<{ success: boolean }> => {
  const url = isSupplier ? `${SUPPLIER_BASE_URL}/saveBatch` : `${BASE_URL}/saveBatch`
  const apiParams = transformSaveParams(data)

  return request.post({ url, data: { voList: [apiParams] } }).then((res: any) => {
    return { success: res.data === true || res.success === true }
  })
}

/** 编辑物流方案 */
export const updateLogisticsMethod = (
  data: Api.LogisticsMethod.SaveParams,
  isSupplier = false
): Promise<{ success: boolean }> => {
  const url = isSupplier ? `${SUPPLIER_BASE_URL}/edit` : `${BASE_URL}/edit`
  const apiParams = transformSaveParams(data)

  return request.post({ url, data: apiParams }).then((res: any) => {
    return { success: res.data === true || res.success === true }
  })
}

/** 保存物流方案（新增/编辑） */
export const saveLogisticsMethod = (
  data: Api.LogisticsMethod.SaveParams,
  isSupplier = false
): Promise<{ id: number; success: boolean }> => {
  if (data.id) {
    return updateLogisticsMethod(data, isSupplier).then((res) => ({
      id: data.id!,
      success: res.success
    }))
  } else {
    return addLogisticsMethod(data, isSupplier).then((res) => ({
      id: Date.now(), // 新增时 API 不返回 ID
      success: res.success
    }))
  }
}

/** 删除物流方案（批量删除） */
export const deleteLogisticsMethod = (ids: number[], isSupplier = false): Promise<void> => {
  const url = isSupplier ? `${SUPPLIER_BASE_URL}/deleteBatch` : `${BASE_URL}/deleteBatch`

  return request.post({ url, data: { ids } }).then(() => {
    return
  })
}

/** 更新物流方案状态（使用编辑接口，需要传入列表行数据） */
export const updateLogisticsMethodStatus = (
  id: number,
  status: number,
  rowData: Api.LogisticsMethod.ListItem,
  isSupplier = false
): Promise<void> => {
  // 使用 edit 接口更新状态，利用列表行数据中的必填字段，不需要先获取详情
  const url = isSupplier ? `${SUPPLIER_BASE_URL}/edit` : `${BASE_URL}/edit`

  const apiParams: any = {
    id,
    status,
    planName: rowData.methodName,
    logisticsProviderId: rowData.providerId,
    transportMode: transportModeReverseMap[rowData.transportMethod] || rowData.transportMethod,
    channel: rowData.channelName || '',
    channelId: rowData.channelId != null ? rowData.channelId : null,
    billingType: rowData.billingMethod
  }

  return request.post({ url, data: apiParams }).then(() => {
    return
  })
}

/** 导出物流方案 */
export const exportLogisticsMethod = (
  params: Api.LogisticsMethod.QueryParams,
  isSupplier = false
): Promise<Blob> => {
  const url = isSupplier ? `${SUPPLIER_BASE_URL}/export` : `${BASE_URL}/export`
  const apiParams = transformQueryParams(params)

  return request.exportPost({ url, data: apiParams }).then((res: any) => {
    return res as Blob
  })
}

/** 获取物流商列表（下拉选项）- 数据来源于物流商资料的列表，查询所有数据 */
export const getProviderOptions = (
  extraParams?: Record<string, any>
): Promise<Array<{ id: number; shortName: string; fullName: string; code: string }>> => {
  return fetchGetLogisticsList({
    currentPage: 1,
    pageSize: -1,
    ...extraParams
  })
    .then((res: any) => {
      const data = res.data || res
      const list = data.records || []
      return list.map((item: any) => ({
        id: item.id,
        shortName: item.shortName || '', // 物流商公司简称
        fullName: item.fullName || '', // 物流商全称
        code: item.code || '' // 物流商编码
      }))
    })
    .catch(() => {
      // 接口调用失败时返回空数组
      return []
    })
}

/** 获取物流渠道列表（下拉选项） */
export const getChannelOptions = (): Promise<Array<{ id: number; name: string }>> => {
  // TODO: 后端暂未提供此接口，暂用mock数据
  const mockChannels = [
    { id: 1, name: 'UPS' },
    { id: 2, name: 'FedEx' },
    { id: 3, name: 'DHL' },
    { id: 4, name: 'DPD' },
    { id: 5, name: 'GLS' },
    { id: 6, name: 'TNT' },
    { id: 7, name: 'USPS' },
    { id: 8, name: '顺丰' },
    { id: 9, name: '圆通' },
    { id: 10, name: '中通' },
    { id: 11, name: '韵达' },
    { id: 12, name: 'EMS' }
  ]
  return Promise.resolve(mockChannels)
}
