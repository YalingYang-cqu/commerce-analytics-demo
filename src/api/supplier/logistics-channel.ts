import request from '@/utils/http'
import type { Api } from '@/typings/api'

// ==================== 接口路径配置 ====================
// 供应商协同接口前缀
const BASE_URL = `/tms/clb-sys-openapi/tms-logistics-channel`

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

  return {
    id: item.id,
    channelName: item.channelName || '',
    estimatedDays: item.totalAgingDays || 0,
    status: item.status as Api.LogisticsChannel.Status,
    statusName: STATUS_NAME_MAP[item.status] || '未知',
    description: item.channelDesc || '',
    methodCount: item.transportPlanList?.length || 0,
    methodNames,
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
      methodCode: '',
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

  // 搜索内容
  if (params.keyword) {
    requestParams.searchValue = params.keyword
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

/** 导出物流渠道 */
export const exportLogisticsChannel = async (
  params: Api.LogisticsChannel.QueryParams
): Promise<Blob> => {
  const requestParams: any = {
    currentPage: 1,
    pageSize: -1,
    hasCount: false
  }

  // 搜索内容
  if (params.keyword) {
    requestParams.searchValue = params.keyword
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

  return await request.post({
    url: `${BASE_URL}/export`,
    data: requestParams,
    responseType: 'blob'
  })
}
