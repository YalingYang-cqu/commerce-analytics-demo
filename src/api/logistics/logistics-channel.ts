import request from '@/utils/http'
import type { Api } from '@/typings/api'

// ==================== 接口路径配置 ====================
const BASE_URL = `/tms/tms-logistics-channel`

// ==================== 状态映射 ====================
const STATUS_NAME_MAP: Record<number, string> = {
  0: '禁用',
  1: '启用'
}

// ==================== 数据转换函数 ====================

/**
 * 将API返回的列表项转换为前端列表项
 */
const transformListItem = (item: any): Api.LogisticsChannel.ListItem => {
  // 处理关联物流方案名称
  const methodNames =
    item.transportPlanList && item.transportPlanList.length > 0
      ? item.transportPlanList.map((p: any) => p.planName).join(',')
      : '-'

  // 处理关联物流方案详情（用于下拉展开显示）
  const methods = (item.transportPlanList || []).map((p: any) => ({
    id: p.id,
    methodName: p.planName || '',
    providerName: p.logisticsProviderName || '',
    transportMode: p.transportMode || ''
  }))

  return {
    id: item.id,
    channelName: item.channelName || '',
    estimatedDays: item.totalAgingDays || 0,
    status: item.status as Api.LogisticsChannel.Status,
    statusName: STATUS_NAME_MAP[item.status] || '未知',
    description: item.channelDesc || '',
    methodCount: item.transportPlanList?.length || 0,
    methodNames,
    methods,
    transportPlanList: item.transportPlanList || [],
    createBy: item.createBy,
    createByName: item.createByName || '-',
    createTime: item.createTime || '',
    updateBy: item.updateBy,
    updateByName: item.updateByName || '-',
    updateTime: item.updateTime || ''
  }
}

/**
 * 将API返回的详情转换为前端详情
 */
const transformDetail = (data: any): Api.LogisticsChannel.Detail => {
  const listItem = transformListItem(data)
  return {
    ...listItem,
    methods: (data.transportPlanList || []).map((p: any) => ({
      id: p.id,
      methodCode: '', // API暂未返回方案编码
      methodName: p.planName || '',
      logisticsProviderName: p.logisticsProviderName || '',
      transportMode: p.transportMode || ''
    }))
  }
}

// ==================== API 函数 ====================

/** 获取物流渠道列表 */
export const getLogisticsChannelList = async (
  params: Api.LogisticsChannel.QueryParams
): Promise<{ data: Api.Common.PaginatedResponse<Api.LogisticsChannel.ListItem> }> => {
  const requestParams: any = {
    currentPage: params.currentPage || 1,
    pageSize: params.pageSize || 20,
    hasCount: true,
    orderBy: 'updateTime desc'
  }

  // 搜索类型和搜索内容（有搜索值时才传）
  if (params.searchValue) {
    requestParams.searchType = params.searchType
    requestParams.searchValue = params.searchValue
  }

  // 状态筛选
  if (params.statusList && params.statusList.length > 0) {
    requestParams.statusList = params.statusList
  }

  // 最近更新时间范围
  if (params.updateTimeStart) {
    requestParams.updateTimeStart = params.updateTimeStart
  }
  if (params.updateTimeEnd) {
    requestParams.updateTimeEnd = params.updateTimeEnd
  }

  const res = await request.post<any>({ url: `${BASE_URL}/page`, data: requestParams })

  // 转换数据
  const data = res.data || res
  const records = (data.dtoList || []).map(transformListItem)

  return {
    data: {
      records,
      total: data.total || 0,
      current: params.currentPage || 1,
      size: params.pageSize || 20
    }
  }
}

/** 获取物流渠道详情 */
export const getLogisticsChannelDetail = async (
  id: number
): Promise<Api.LogisticsChannel.Detail> => {
  const res = await request.post<any>({ url: `${BASE_URL}/detail`, data: { id } })
  const data = res.data || res
  return transformDetail(data)
}

/** 保存物流渠道（新增） */
export const addLogisticsChannel = async (
  data: Api.LogisticsChannel.SaveParams
): Promise<{ id: number }> => {
  const requestParams: any = {
    channelName: data.channelName,
    totalAgingDays: data.estimatedDays,
    status: data.status,
    channelDesc: data.description,
    transportPlanIdList: data.methodIds || []
  }

  // 新增使用 /save 接口，不传 id
  const res = await request.post<any>({ url: `${BASE_URL}/save`, data: requestParams })
  return { id: res?.data?.id || res?.id || 0 }
}

/** 保存物流渠道（编辑） */
export const editLogisticsChannel = async (
  data: Api.LogisticsChannel.SaveParams
): Promise<{ id: number }> => {
  const requestParams: any = {
    id: data.id,
    channelName: data.channelName,
    totalAgingDays: data.estimatedDays,
    status: data.status,
    channelDesc: data.description,
    transportPlanIdList: data.methodIds || []
  }

  await request.post<any>({ url: `${BASE_URL}/edit`, data: requestParams })
  return { id: data.id || 0 }
}

/** 保存物流渠道（新增/编辑通用） */
export const saveLogisticsChannel = async (
  data: Api.LogisticsChannel.SaveParams
): Promise<{ id: number }> => {
  if (data.id) {
    return editLogisticsChannel(data)
  }
  return addLogisticsChannel(data)
}

/** 删除物流渠道 */
export const deleteLogisticsChannel = async (ids: number[]): Promise<void> => {
  await request.post({ url: `${BASE_URL}/deleteBatch`, data: { ids } })
}

/** 导出物流渠道（入参与分页查询一致，PRD：导出当前筛选结果） */
export const exportLogisticsChannel = async (
  params: Api.LogisticsChannel.QueryParams
): Promise<Blob> => {
  const requestParams: any = {
    currentPage: 1,
    pageSize: -1,
    hasCount: false,
    orderBy: 'updateTime desc'
  }

  if (params.searchValue) {
    requestParams.searchType = params.searchType
    requestParams.searchValue = params.searchValue
  }
  if (params.statusList && params.statusList.length > 0) {
    requestParams.statusList = params.statusList
  }
  if (params.updateTimeStart) {
    requestParams.updateTimeStart = params.updateTimeStart
  }
  if (params.updateTimeEnd) {
    requestParams.updateTimeEnd = params.updateTimeEnd
  }

  return await request.post({
    url: `${BASE_URL}/export`,
    data: requestParams,
    responseType: 'blob'
  })
}

/** 获取可关联的物流方案列表 */
export const getAvailableMethods = async (): Promise<
  Array<{
    id: number
    methodCode: string
    methodName: string
    providerName: string
    transportMode: string
  }>
> => {
  // 从物流方案接口获取全部方案
  const res = await request.post<any>({
    url: `/tms/tms-transport-plan/page`,
    data: {
      currentPage: 1,
      pageSize: -1,
      hasCount: false,
      statusList: [1] // 只查询启用状态的方案
    }
  })

  const data = res.data || res
  return (data.dtoList || []).map((item: any) => ({
    id: Number(item.id),
    methodCode: item.planNo || '',
    methodName: item.planName || '',
    providerName: item.logisticsProviderName || '',
    transportMode: item.transportMode || ''
  }))
}

/** 获取全部启用的物流渠道（用于下拉选择） */
export const getAllEnabledLogisticsChannels = async (): Promise<
  Array<{
    id: number
    channelName: string
    estimatedDays: number
  }>
> => {
  const res = await request.post<any>({
    url: `${BASE_URL}/page`,
    data: {
      currentPage: 1,
      pageSize: -1,
      hasCount: false,
      statusList: [1] // 只查询启用状态
    }
  })

  const data = res.data || res
  return (data.dtoList || []).map((item: any) => ({
    id: item.id,
    channelName: item.channelName || '',
    estimatedDays: item.totalAgingDays || 0
  }))
}
