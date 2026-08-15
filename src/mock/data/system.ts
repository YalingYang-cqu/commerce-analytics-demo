/**
 * 启动链路与公共下拉的 Mock 数据。
 *
 * 覆盖：字典缓存、用户习惯、导出任务列表、以及各页筛选项用到的公共下拉接口。
 * 所有函数返回「业务负载」（即真实接口 res.data 对应的 data 字段内容），
 * 由 handlers 统一包裹成 { code, msg, data }。
 */
import { mockUserFuncPermission } from '../seed/permission'

/** 字典缓存：结构对齐 dictStore.getDictData 的解析（data 为数组，含 itemList） */
export function dictCache() {
  return [
    {
      dictCode: 'product_status',
      dictName: '产品状态',
      status: 1,
      itemList: [
        { dictItemCode: '0', dictItemName: '开发中', status: 1 },
        { dictItemCode: '1', dictItemName: '在售', status: 1 },
        { dictItemCode: '2', dictItemName: '清仓', status: 1 },
        { dictItemCode: '3', dictItemName: '停售', status: 1 }
      ]
    },
    {
      dictCode: 'purchase_order_status',
      dictName: '采购单状态',
      status: 1,
      itemList: [
        { dictItemCode: '4', dictItemName: '待交货', status: 1 },
        { dictItemCode: '5', dictItemName: '交货中', status: 1 },
        { dictItemCode: '6', dictItemName: '已完成', status: 1 }
      ]
    }
  ]
}

/** 获取权限（get-user-permission）：返回权限结构 */
export function permission() {
  return mockUserFuncPermission
}

/** 用户习惯：返回 null 表示未设置个性化列，页面使用默认列配置 */
export function userHabits() {
  return null
}

/** 保存类操作的通用成功返回 */
export function ok() {
  return true
}

/** 导出任务分页（下载中心）：空列表即可 */
export function exportTaskPage() {
  return { records: [], total: 0, current: 1, size: 20 }
}

/** 品牌下拉（brandPageList → data.records[{id, brandName}]） */
export function brandPage() {
  const brands = ['MK', '兴源', '优品', '恒达', '联创', '精工']
  return {
    records: brands.map((name, i) => ({ id: i + 1, brandName: name, brandStatus: 1 })),
    total: brands.length,
    current: 1,
    size: -1
  }
}

/** 分类下拉（categoryPageList → data[{id, categoryName, children}]） */
export function categoryTree() {
  return [
    { id: 1, categoryName: '3C 配件', status: '1', children: [] },
    { id: 2, categoryName: '户外用品', status: '1', children: [] },
    { id: 3, categoryName: '家居生活', status: '1', children: [] }
  ]
}

/** 店铺下拉（getAllStoreInfo → data.dtoList[{id, storeName}]） */
export function storeAll() {
  const shops = ['US-Store-A', 'US-Store-B', 'US-VC-Main']
  return {
    dtoList: shops.map((name, i) => ({ id: i + 1, storeName: name, status: 1 })),
    total: shops.length
  }
}

/** 用户下拉（getAllUserInfo → data[{id, userName, status}]） */
export function allUserInfo() {
  const users = ['张三', '李四', '王五', '赵六', '陈七']
  return users.map((name, i) => ({ id: i + 1, userName: name, status: 1 }))
}

/** 采购主体（companyPageList → data.records[{id, name}]） */
export function companyPage() {
  const list = ['示例主体 A', '示例主体 B', '示例主体 C']
  return {
    records: list.map((name, i) => ({ id: i + 1, name, status: 1 })),
    total: list.length
  }
}

/** 仓库（warehousePageAll → data.dtoList） */
export function warehousePage() {
  const list = ['深圳总仓', '东莞仓', '美东仓']
  return {
    dtoList: list.map((name, i) => ({ id: i + 1, warehouseName: name, enableStatus: 1 })),
    total: list.length
  }
}

/** 物流渠道（getLogisticsChannelList → data.records[{id, channelName}]） */
export function logisticsChannelPage() {
  const list = ['海运普船', '海运快船', '空运', '美森快线']
  return {
    records: list.map((name, i) => ({ id: i + 1, channelName: name, status: 1 })),
    total: list.length
  }
}

/** 币种（dropdownCurrencyApiN → data[{currencyCode, symbol}]） */
export function currencyList() {
  return [
    { currencyCode: 'CNY', symbol: '¥', name: '人民币' },
    { currencyCode: 'USD', symbol: '$', name: '美元' }
  ]
}

/** 国家（dropdownAllCountry）：仅提供美国，销量页站点锁定美国 */
export function allCountry() {
  return [
    {
      continentEn: 'NA',
      countries: [{ countryName: '美国', shortCountryName: 'US', countryCn: '美国' }]
    }
  ]
}
