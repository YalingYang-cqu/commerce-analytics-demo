import request from '@/utils/http'

/** TMS 承运商列表项 */
export interface TmsCarrierItem {
  id: number
  name: string
  code?: string
  carrierType: string
  level: number
  parentId: number
  parentName?: string
  fullName?: string
  status: number
  sort?: number
  createTime?: string
  updateTime?: string
}

/** 承运商级联选项（用于 el-cascader） */
export interface CarrierCascaderOption {
  label: string
  value: string
  children?: CarrierCascaderOption[]
}

const CARRIER_LIST_URL = '/tms/tms/carrier/list'

/**
 * 分页查询承运商列表
 * @param carrierType 承运商类型：HEAD-头程, TAIL-尾程
 * @param status 状态：1-启用, 0-禁用，不传则查全部
 */
export async function getCarrierList(params: {
  carrierType: 'HEAD' | 'TAIL'
  current?: number
  size?: number
  status?: number
  keyword?: string
  level?: number
  parentId?: number
}) {
  const res = await request.get<{
    data?: {
      records?: TmsCarrierItem[]
      total?: number
      current?: number
      pages?: number
      size?: number
    }
  }>({
    url: CARRIER_LIST_URL,
    params: {
      carrierType: params.carrierType,
      current: params.current ?? 1,
      size: params.size ?? 9999,
      status: params.status ?? 1,
      keyword: params.keyword,
      level: params.level,
      parentId: params.parentId
    }
  })
  const records = res?.data?.records ?? []
  return records as TmsCarrierItem[]
}

/**
 * 将承运商列表转换为级联选择器格式（一级/二级）
 * 提交时取二级名称（value）
 */
export function transformCarrierToCascader(records: TmsCarrierItem[]): CarrierCascaderOption[] {
  const level1 = records.filter((r) => r.level === 1 || r.parentId === 0)
  const level2 = records.filter((r) => r.level === 2 && r.parentId !== 0)

  return level1.map((p) => {
    const children = level2
      .filter((c) => c.parentId === p.id)
      .sort((a, b) => (a.sort ?? 0) - (b.sort ?? 0))
      .map((c) => ({
        label: c.name,
        value: c.name
      }))
    return {
      label: p.name,
      value: p.name,
      children: children.length > 0 ? children : undefined
    }
  })
}

/**
 * 获取头程承运商级联选项（一次性加载全部启用数据）
 */
export async function getHeadCarrierCascaderOptions(): Promise<CarrierCascaderOption[]> {
  const records = await getCarrierList({ carrierType: 'HEAD', status: 1 })
  return transformCarrierToCascader(records)
}

/**
 * 获取尾程承运商级联选项（一次性加载全部启用数据）
 */
export async function getTailCarrierCascaderOptions(): Promise<CarrierCascaderOption[]> {
  const records = await getCarrierList({ carrierType: 'TAIL', status: 1 })
  return transformCarrierToCascader(records)
}

/**
 * 根据叶子节点 value 在级联选项中查找完整路径，用于编辑回显
 * @returns 路径数组 [一级value, 二级value]，未找到则返回 [leafValue]
 */
export function findCarrierPath(
  options: CarrierCascaderOption[],
  leafValue: string
): string[] {
  for (const p of options) {
    if (p.children) {
      const found = p.children.find((c) => c.value === leafValue)
      if (found) return [p.value, found.value]
    }
  }
  return leafValue ? [leafValue] : []
}
