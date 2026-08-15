/*
 * @Description: 物流商资料 Mock 数据
 * 用于前端开发和联调
 */

import type { Api } from '@/typings/api'

// 模拟物流商数据
let mockLogisticsList: Api.Logistics.LogisticsListDto[] = [
  {
    id: 1,
    logisticsCode: 'LOG001',
    logisticsFullName: '顺丰速运有限公司',
    logisticsShortName: '顺丰',
    cooperationStatus: '正常合作',
    changeStatus: '已生效',
    mobile: '13800138000',
    email: 'sf@sf-express.com',
    logisticsNames: '张三,李四',
    logisticsWarehouse: '深圳仓',
    feishuGroup: '顺丰对接群',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00',
    updateBy: '管理员',
    contactNames: '王五'
  },
  {
    id: 2,
    logisticsCode: 'LOG002',
    logisticsFullName: '圆通速递股份有限公司',
    logisticsShortName: '圆通',
    cooperationStatus: '正常合作',
    changeStatus: '已生效',
    mobile: '13800138001',
    email: 'yt@yuantong.com',
    logisticsNames: '赵六',
    logisticsWarehouse: '上海仓',
    feishuGroup: '圆通对接群',
    createTime: '2024-01-02 10:00:00',
    updateTime: '2024-01-02 10:00:00',
    updateBy: '管理员',
    contactNames: '钱七'
  },
  {
    id: 3,
    logisticsCode: 'LOG003',
    logisticsFullName: '中通快递股份有限公司',
    logisticsShortName: '中通',
    cooperationStatus: '暂停合作',
    changeStatus: '待审批',
    mobile: '13800138002',
    email: 'zt@zto.com',
    logisticsNames: '孙八',
    logisticsWarehouse: '北京仓',
    feishuGroup: '中通对接群',
    createTime: '2024-01-03 10:00:00',
    updateTime: '2024-01-03 10:00:00',
    updateBy: '管理员',
    contactNames: '周九'
  },
  {
    id: 4,
    logisticsCode: 'LOG004',
    logisticsFullName: '申通快递股份有限公司',
    logisticsShortName: '申通',
    cooperationStatus: '潜在物流商',
    changeStatus: '草稿',
    mobile: '13800138003',
    email: 'st@sto.cn',
    logisticsNames: '吴十',
    logisticsWarehouse: '广州仓',
    feishuGroup: '申通对接群',
    createTime: '2024-01-04 10:00:00',
    updateTime: '2024-01-04 10:00:00',
    updateBy: '管理员',
    contactNames: '郑一'
  },
  {
    id: 5,
    logisticsCode: 'LOG005',
    logisticsFullName: '韵达速递有限公司',
    logisticsShortName: '韵达',
    cooperationStatus: '正常合作',
    changeStatus: '已驳回',
    mobile: '13800138004',
    email: 'yd@yunda.com',
    logisticsNames: '王二',
    logisticsWarehouse: '杭州仓',
    feishuGroup: '韵达对接群',
    createTime: '2024-01-05 10:00:00',
    updateTime: '2024-01-05 10:00:00',
    updateBy: '管理员',
    contactNames: '李三'
  }
]

/**
 * Mock 查询物流商列表
 */
export function mockFetchLogisticsList(params: Api.Logistics.LogisticsQueryParam) {
  return new Promise<{
    records: Api.Logistics.LogisticsListDto[]
    total: number
    current: number
    size: number
  }>((resolve) => {
    setTimeout(() => {
      let filteredList = mockLogisticsList.filter((logistics) => {
        const matchesLogisticsCode = params.logisticsCode
          ? logistics.logisticsCode.includes(params.logisticsCode)
          : true
        const matchesLogisticsFullName = params.logisticsFullName
          ? logistics.logisticsFullName.includes(params.logisticsFullName)
          : true
        const matchesLogisticsShortName = params.logisticsShortName
          ? logistics.logisticsShortName.includes(params.logisticsShortName)
          : true
        const matchesCooperationStatusList =
          params.cooperationStatusList && params.cooperationStatusList.length > 0
            ? params.cooperationStatusList.includes(logistics.cooperationStatus || '')
            : true
        const matchesChangeStatusList =
          params.changeStatusList && params.changeStatusList.length > 0
            ? params.changeStatusList.includes(
                (logistics as any).changeStatus || (logistics as any).approvalStatus || ''
              )
            : true

        return (
          matchesLogisticsCode &&
          matchesLogisticsFullName &&
          matchesLogisticsShortName &&
          matchesCooperationStatusList &&
          matchesChangeStatusList
        )
      })

      // 排序
      if (params.orderBy && params.order) {
        filteredList = filteredList.sort((a: any, b: any) => {
          const aVal = (a as any)[params.orderBy!]
          const bVal = (b as any)[params.orderBy!]
          if (params.order === 'desc') {
            return bVal > aVal ? 1 : -1
          }
          return aVal > bVal ? 1 : -1
        })
      }

      // 分页
      const currentPage = params.currentPage || 1
      const pageSize = params.pageSize || 20
      const start = (currentPage - 1) * pageSize
      const end = start + pageSize
      const paginatedList = filteredList.slice(start, end)

      resolve({
        records: paginatedList,
        total: filteredList.length,
        current: currentPage,
        size: pageSize
      })
    }, 300) // 模拟网络延迟
  })
}

/**
 * Mock 获取物流商详情
 */
export function mockGetLogisticsDetail(logisticsId: string | number) {
  return new Promise<Api.Logistics.LogisticsItem>((resolve, reject) => {
    setTimeout(() => {
      const logistics = mockLogisticsList.find((l) => String(l.id) === String(logisticsId))
      if (logistics) {
        const logisticsDetail: Api.Logistics.LogisticsItem = {
          logisticsId: logistics.id,
          logisticsCode: logistics.logisticsCode,
          logisticsName: logistics.logisticsFullName,
          shortName: logistics.logisticsShortName,
          cooperationStatus: logistics.cooperationStatus,
          logisticsWarehouse: logistics.logisticsWarehouse,
          feishuGroup: logistics.feishuGroup,
          contactName: logistics.contactNames || '',
          contactPhone: logistics.mobile || '',
          contactEmail: logistics.email || '',
          status: true,
          createTime: logistics.createTime || ''
        }
        resolve(logisticsDetail)
      } else {
        reject(new Error('物流商不存在'))
      }
    }, 200)
  })
}

/**
 * Mock 新增物流商
 */
export function mockAddLogistics(data: Api.Logistics.LogisticsCreateParams) {
  return new Promise<Record<string, any>>((resolve, reject) => {
    setTimeout(() => {
      // 检查编码是否重复
      if (mockLogisticsList.some((l) => l.logisticsCode === data.logisticsCode)) {
        reject(new Error('物流商编码已存在'))
        return
      }

      const newId = Math.max(...mockLogisticsList.map((l) => Number(l.id)), 0) + 1
      const newLogistics: Api.Logistics.LogisticsListDto = {
        id: newId,
        logisticsCode: data.logisticsCode,
        logisticsFullName: data.logisticsName,
        logisticsShortName: data.shortName || '',
        cooperationStatus: data.cooperationStatus || '潜在',
        mobile: data.contactPhone || '',
        email: data.contactEmail || '',
        logisticsNames: '',
        logisticsWarehouse: data.logisticsWarehouse || '',
        feishuGroup: data.feishuGroup || '',
        createTime: new Date().toISOString(),
        updateTime: new Date().toISOString(),
        updateBy: '当前用户',
        contactNames: data.contactName || ''
      }
      mockLogisticsList.push(newLogistics)
      resolve({ code: 200, msg: '新增成功', data: newLogistics })
    }, 300)
  })
}

/**
 * Mock 更新物流商
 */
export function mockUpdateLogistics(data: Api.Logistics.LogisticsUpdateParams) {
  return new Promise<Record<string, any>>((resolve, reject) => {
    setTimeout(() => {
      const index = mockLogisticsList.findIndex((l) => String(l.id) === String(data.logisticsId))
      if (index !== -1) {
        // 检查编码是否重复（排除当前物流商）
        if (
          mockLogisticsList.some((l, i) => l.logisticsCode === data.logisticsCode && i !== index)
        ) {
          reject(new Error('物流商编码已存在'))
          return
        }

        mockLogisticsList[index] = {
          ...mockLogisticsList[index],
          logisticsCode: data.logisticsCode || mockLogisticsList[index].logisticsCode,
          logisticsFullName: data.logisticsName || mockLogisticsList[index].logisticsFullName,
          logisticsShortName: data.shortName || mockLogisticsList[index].logisticsShortName,
          cooperationStatus: data.cooperationStatus || mockLogisticsList[index].cooperationStatus,
          mobile: data.contactPhone || mockLogisticsList[index].mobile,
          email: data.contactEmail || mockLogisticsList[index].email,
          logisticsWarehouse:
            data.logisticsWarehouse || mockLogisticsList[index].logisticsWarehouse,
          feishuGroup: data.feishuGroup || mockLogisticsList[index].feishuGroup,
          updateTime: new Date().toISOString(),
          updateBy: '当前用户',
          contactNames: data.contactName || mockLogisticsList[index].contactNames
        }
        resolve({ code: 200, msg: '更新成功', data: mockLogisticsList[index] })
      } else {
        reject(new Error('物流商不存在'))
      }
    }, 300)
  })
}

/**
 * Mock 删除物流商
 */
export function mockDeleteLogistics(logisticsId: string | number) {
  return new Promise<Record<string, any>>((resolve, reject) => {
    setTimeout(() => {
      const initialLength = mockLogisticsList.length
      mockLogisticsList = mockLogisticsList.filter((l) => String(l.id) !== String(logisticsId))
      if (mockLogisticsList.length < initialLength) {
        resolve({ code: 200, msg: '删除成功' })
      } else {
        reject(new Error('物流商不存在'))
      }
    }, 300)
  })
}

/**
 * Mock 批量删除物流商
 */
export function mockBatchDeleteLogistics(logisticsIds: (string | number)[]) {
  return new Promise<Record<string, any>>((resolve) => {
    setTimeout(() => {
      const initialLength = mockLogisticsList.length
      mockLogisticsList = mockLogisticsList.filter(
        (l) => !logisticsIds.map(String).includes(String(l.id))
      )
      const deletedCount = initialLength - mockLogisticsList.length
      resolve({ code: 200, msg: `成功删除 ${deletedCount} 条物流商` })
    }, 300)
  })
}

/**
 * Mock 操作日志数据
 */
const mockOperationLogs: Api.Logistics.OperationLogItem[] = [
  {
    id: 1,
    operationTime: '2020/10/10 7:07',
    operator: '李云',
    operationType: '撤回',
    description: '物流商【DEMO-LOG-001】撤回审批，审批单号【DEMO-APR-001】'
  },
  {
    id: 2,
    operationTime: '2020/10/10 7:07',
    operator: '李云',
    operationType: '提交',
    description: '物流商【DEMO-LOG-001】提交审批，审批单号【DEMO-APR-001】'
  },
  {
    id: 3,
    operationTime: '2020/10/10 7:07',
    operator: '李云',
    operationType: '编辑',
    description: '物流商全称:【SDF39276 → SDF39276】'
  },
  {
    id: 4,
    operationTime: '2020/10/10 7:07',
    operator: '李云',
    operationType: '编辑',
    description:
      '删除联系方式;联系人类型:负责人;联系人:李云;手机号:123456;邮箱:12345u98@ 联系地址:XXXXXX,'
  },
  {
    id: 5,
    operationTime: '2020/10/10 7:07',
    operator: '李云',
    operationType: '编辑',
    description: '变更联系方式'
  },
  {
    id: 6,
    operationTime: '2020/10/10 7:07',
    operator: '李云',
    operationType: '编辑',
    description:
      '新增联系方式;联系人类型:负责人;联系人:李云;手机号:123456;邮箱:12345u98@ 联系地址:XXXXXX,'
  },
  {
    id: 7,
    operationTime: '2020/10/10 7:07',
    operator: '李云',
    operationType: '发起变更',
    description: '物流商【DEMO-LOG-001】发起变更，变更为“草稿”状态。'
  },
  {
    id: 8,
    operationTime: '2020/10/10 7:07',
    operator: '系统',
    operationType: '审批通过',
    description: '物流商【DEMO-LOG-001】审批通过，变更为“已生效”状态。'
  },
  {
    id: 9,
    operationTime: '2020/10/10 7:07',
    operator: '李云',
    operationType: '提交',
    description: '物流商【DEMO-LOG-001】提交审批，审批单号【DEMO-APR-001】'
  },
  {
    id: 10,
    operationTime: '2020/10/10 7:07',
    operator: '李云',
    operationType: '创建',
    description: '创建物流商资料，物流商编码【DEMO-LOG-001】'
  }
]

/**
 * Mock 查询物流商操作日志
 */
export function mockFetchLogisticsOperationLog(params: Api.Logistics.OperationLogQueryParam) {
  return new Promise<{
    records: Api.Logistics.OperationLogItem[]
    total: number
    current: number
    size: number
  }>((resolve) => {
    setTimeout(() => {
      // 分页
      const currentPage = params.currentPage || 1
      const pageSize = params.pageSize || 20
      const start = (currentPage - 1) * pageSize
      const end = start + pageSize
      const paginatedList = mockOperationLogs.slice(start, end)

      resolve({
        records: paginatedList,
        total: mockOperationLogs.length,
        current: currentPage,
        size: pageSize
      })
    }, 300)
  })
}

// ========== 仓库模拟数据 ==========

// 模拟用户列表（用于负责人筛选）
export const mockUsers = [
  { id: 1, name: '李强' },
  { id: 2, name: '王芳' },
  { id: 3, name: '张伟' },
  { id: 4, name: '刘洋' },
  { id: 5, name: '陈敏' }
]

// 模拟供应商列表
export const mockSuppliers = [
  { id: 1, name: '鑫创集团', code: 'SUP001' },
  { id: 2, name: '百利达供应商', code: 'SUP002' },
  { id: 3, name: '华泰集团', code: 'SUP003' },
  { id: 4, name: '天成商贸', code: 'SUP004' }
]

// 模拟店铺列表（用于平台仓筛选）
export const mockStores = [
  { id: 1001, name: '旗舰店', platform: 'Amazon', marketplace: 'US' },
  { id: 1002, name: '海外专营店', platform: 'Amazon', marketplace: 'UK' },
  { id: 1003, name: '欧洲店', platform: 'Amazon', marketplace: 'DE' },
  { id: 1004, name: '日本店', platform: 'Amazon', marketplace: 'JP' },
  { id: 1005, name: '澳洲店', platform: 'Amazon', marketplace: 'AU' }
]

// 模拟仓库数据
let mockWarehouseList: Api.SystemManage.WarehouseResponse[] = [
  {
    id: 1,
    warehouseCode: 'YH123456',
    warehouseName: '鑫创集团供应商仓',
    warehouseType: 1,
    warehouseTypeName: '供应商仓',
    enableStatus: 1,
    enableStatusName: '启用',
    principalName: '李强',
    contactName: '李强',
    contactPhone: '13800000000',
    contactEmail: 'demo@example.com',
    supplierId: 1,
    supplierName: '鑫创集团',
    supplierCode: 'SUP001',
    address: '示例市示例区',
    province: '广东省',
    city: '深圳市',
    area: '龙华区',
    country: '中国',
    postCode: '518000',
    createTime: '2025-11-07 18:18:10',
    createTimeStr: '2025-11-07',
    updateTime: '2025-11-08 10:20:30',
    updateTimeStr: '2025-11-08',
    creatorId: 1,
    creatorName: '管理员',
    updateId: 1,
    updateName: '管理员',
    isDeleted: 0,
    hasInventory: false,
    hasTransactions: false,
    hasRelatedDocuments: false
  },
  {
    id: 2,
    warehouseCode: 'SF789012',
    warehouseName: '百利达供应商仓',
    warehouseType: 1,
    warehouseTypeName: '供应商仓',
    enableStatus: 1,
    enableStatusName: '启用',
    principalName: '王芳',
    contactName: '王芳',
    contactPhone: '13912345678',
    contactEmail: 'wangfang@example.com',
    supplierId: 2,
    supplierName: '百利达供应商',
    supplierCode: 'SUP002',
    address: '广东省广州市天河区',
    province: '广东省',
    city: '广州市',
    area: '天河区',
    country: '中国',
    postCode: '510000',
    createTime: '2025-10-15 09:30:00',
    createTimeStr: '2025-10-15',
    updateTime: '2025-10-20 14:25:00',
    updateTimeStr: '2025-10-20',
    creatorId: 2,
    creatorName: '张伟',
    updateId: 2,
    updateName: '张伟',
    isDeleted: 0,
    hasInventory: true,
    hasTransactions: false,
    hasRelatedDocuments: false
  },
  {
    id: 3,
    warehouseCode: 'WHFBA0001',
    warehouseName: 'Amazon.FBA-US-旗舰店',
    warehouseType: 3,
    warehouseTypeName: '平台仓',
    enableStatus: 1,
    enableStatusName: '启用',
    principalName: '张伟,李强',
    contactName: '张伟',
    contactPhone: '13800138000',
    contactEmail: 'zhangwei@example.com',
    accountId: 1001,
    accountName: '旗舰店',
    platform: 'Amazon',
    marketplace: 'US',
    platformWarehouseType: 'Amazon.FBA',
    address: '',
    province: '',
    city: '',
    area: '',
    country: 'US',
    postCode: '',
    createTime: '2025-09-01 08:00:00',
    createTimeStr: '2025-09-01',
    updateTime: '2025-09-15 16:45:00',
    updateTimeStr: '2025-09-15',
    creatorId: 1,
    creatorName: '系统',
    updateId: 3,
    updateName: '刘洋',
    isDeleted: 0,
    hasInventory: false,
    hasTransactions: false,
    hasRelatedDocuments: false
  },
  {
    id: 4,
    warehouseCode: 'WHTPW0001',
    warehouseName: '上海三方仓',
    warehouseType: 2,
    warehouseTypeName: '三方仓',
    enableStatus: 1,
    enableStatusName: '启用',
    principalName: '刘洋',
    contactName: '刘洋',
    contactPhone: '13711112222',
    contactEmail: 'liuyang@example.com',
    address: '上海市浦东新区',
    province: '上海市',
    city: '上海市',
    area: '浦东新区',
    country: '中国',
    postCode: '200000',
    createTime: '2025-08-20 10:15:00',
    createTimeStr: '2025-08-20',
    updateTime: '2025-09-10 11:30:00',
    updateTimeStr: '2025-09-10',
    creatorId: 4,
    creatorName: '刘洋',
    updateId: 4,
    updateName: '刘洋',
    isDeleted: 0,
    hasInventory: false,
    hasTransactions: true,
    hasRelatedDocuments: false
  },
  {
    id: 5,
    warehouseCode: 'YH567890',
    warehouseName: '华泰集团供应商仓',
    warehouseType: 1,
    warehouseTypeName: '供应商仓',
    enableStatus: 0,
    enableStatusName: '禁用',
    principalName: '陈敏',
    contactName: '陈敏',
    contactPhone: '13566667777',
    contactEmail: 'chenmin@example.com',
    supplierId: 3,
    supplierName: '华泰集团',
    supplierCode: 'SUP003',
    address: '浙江省杭州市西湖区',
    province: '浙江省',
    city: '杭州市',
    area: '西湖区',
    country: '中国',
    postCode: '310000',
    createTime: '2025-07-10 14:20:00',
    createTimeStr: '2025-07-10',
    updateTime: '2025-08-05 09:10:00',
    updateTimeStr: '2025-08-05',
    creatorId: 5,
    creatorName: '陈敏',
    updateId: 5,
    updateName: '陈敏',
    isDeleted: 0,
    hasInventory: true,
    hasTransactions: true,
    hasRelatedDocuments: true
  },
  {
    id: 6,
    warehouseCode: 'WHFBA0002',
    warehouseName: 'Amazon.FBA-UK-海外专营店',
    warehouseType: 3,
    warehouseTypeName: '平台仓',
    enableStatus: 1,
    enableStatusName: '启用',
    principalName: '王芳',
    contactName: '王芳',
    contactPhone: '13912345678',
    contactEmail: 'wangfang@example.com',
    accountId: 1002,
    accountName: '海外专营店',
    platform: 'Amazon',
    marketplace: 'UK',
    platformWarehouseType: 'Amazon.FBA',
    address: '',
    province: '',
    city: '',
    area: '',
    country: 'UK',
    postCode: '',
    createTime: '2025-08-15 10:00:00',
    createTimeStr: '2025-08-15',
    updateTime: '2025-09-01 12:00:00',
    updateTimeStr: '2025-09-01',
    creatorId: 1,
    creatorName: '系统',
    updateId: 2,
    updateName: '王芳',
    isDeleted: 0,
    hasInventory: false,
    hasTransactions: false,
    hasRelatedDocuments: false
  },
  {
    id: 7,
    warehouseCode: 'WHFBA0003',
    warehouseName: 'Amazon.FBA-DE-欧洲店',
    warehouseType: 3,
    warehouseTypeName: '平台仓',
    enableStatus: 0,
    enableStatusName: '禁用',
    principalName: '陈敏,刘洋',
    contactName: '陈敏',
    contactPhone: '13566667777',
    contactEmail: 'chenmin@example.com',
    accountId: 1003,
    accountName: '欧洲店',
    platform: 'Amazon',
    marketplace: 'DE',
    platformWarehouseType: 'Amazon.FBA',
    address: '',
    province: '',
    city: '',
    area: '',
    country: 'DE',
    postCode: '',
    createTime: '2025-07-20 14:30:00',
    createTimeStr: '2025-07-20',
    updateTime: '2025-08-25 09:15:00',
    updateTimeStr: '2025-08-25',
    creatorId: 1,
    creatorName: '系统',
    updateId: 5,
    updateName: '陈敏',
    isDeleted: 0,
    hasInventory: false,
    hasTransactions: false,
    hasRelatedDocuments: false
  }
]

/**
 * Mock 查询仓库列表
 */
export function mockFetchWarehouseList(params: any) {
  return new Promise<{
    records: Api.SystemManage.WarehouseResponse[]
    total: number
    current: number
    size: number
  }>((resolve) => {
    setTimeout(() => {
      let filteredList = [...mockWarehouseList]

      // 仓库类型筛选
      if (params.warehouseType !== undefined && params.warehouseType !== null) {
        filteredList = filteredList.filter((w) => w.warehouseType === params.warehouseType)
      }

      // 状态筛选
      if (params.enableStatus !== undefined && params.enableStatus !== null) {
        filteredList = filteredList.filter((w) => w.enableStatus === params.enableStatus)
      }

      // 负责人筛选
      if (params.principalName) {
        filteredList = filteredList.filter((w) => w.principalName.includes(params.principalName))
      }

      // 店铺筛选（平台仓专用）
      if (params.accountId !== undefined && params.accountId !== null) {
        filteredList = filteredList.filter((w) => w.accountId === params.accountId)
      }

      // 复合搜索处理
      if (params.searchDto && params.searchDto.searchValue) {
        const { searchType, searchValue } = params.searchDto
        filteredList = filteredList.filter((w) => {
          if (searchType === 'warehouseName') {
            return w.warehouseName.includes(searchValue)
          } else if (searchType === 'warehouseCode') {
            return w.warehouseCode.includes(searchValue)
          } else if (searchType === 'principalName') {
            return w.principalName.includes(searchValue)
          } else if (searchType === 'supplierName') {
            return w.supplierName?.includes(searchValue)
          }
          return true
        })
      }

      // 日期范围筛选 - 创建时间
      if (params.createTimeStart && params.createTimeEnd) {
        filteredList = filteredList.filter((w) => {
          const createTime = new Date(w.createTime).getTime()
          const startTime = new Date(params.createTimeStart).getTime()
          const endTime = new Date(params.createTimeEnd).getTime()
          return createTime >= startTime && createTime <= endTime
        })
      }

      // 日期范围筛选 - 更新时间
      if (params.updateTimeStart && params.updateTimeEnd) {
        filteredList = filteredList.filter((w) => {
          const updateTime = new Date(w.updateTime).getTime()
          const startTime = new Date(params.updateTimeStart).getTime()
          const endTime = new Date(params.updateTimeEnd).getTime()
          return updateTime >= startTime && updateTime <= endTime
        })
      }

      // 排序：默认按创建时间倒序
      filteredList.sort((a, b) => {
        return new Date(b.createTime).getTime() - new Date(a.createTime).getTime()
      })

      // 分页
      const currentPage = params.currentPage || 1
      const pageSize = params.pageSize || 20
      const start = (currentPage - 1) * pageSize
      const end = start + pageSize
      const paginatedList = filteredList.slice(start, end)

      resolve({
        records: paginatedList,
        total: filteredList.length,
        current: currentPage,
        size: pageSize
      })
    }, 300)
  })
}

/**
 * Mock 获取仓库详情
 */
export function mockGetWarehouseDetail(warehouseId: string | number) {
  return new Promise<Api.SystemManage.WarehouseResponse>((resolve, reject) => {
    setTimeout(() => {
      const warehouse = mockWarehouseList.find((w) => String(w.id) === String(warehouseId))
      if (warehouse) {
        resolve(warehouse)
      } else {
        reject(new Error('仓库不存在'))
      }
    }, 200)
  })
}

/**
 * Mock 新增仓库
 */
export function mockAddWarehouse(data: any) {
  return new Promise<Record<string, any>>((resolve, reject) => {
    setTimeout(() => {
      // 检查编码是否重复
      if (mockWarehouseList.some((w) => w.warehouseCode === data.warehouseCode)) {
        reject(new Error('仓库编码已存在'))
        return
      }

      const newId = Math.max(...mockWarehouseList.map((w) => Number(w.id)), 0) + 1
      const typeNames: Record<number, string> = { 1: '供应商仓', 2: '三方仓', 3: '平台仓' }
      const newWarehouse: Api.SystemManage.WarehouseResponse = {
        id: newId,
        warehouseCode: data.warehouseCode,
        warehouseName: data.warehouseName,
        warehouseType: data.warehouseType,
        warehouseTypeName: typeNames[data.warehouseType] || '',
        enableStatus: data.enableStatus ?? 1,
        enableStatusName: data.enableStatus === 1 ? '启用' : '禁用',
        principalName: data.principalName || '',
        contactName: data.contactName || '',
        contactPhone: data.contactPhone || '',
        contactEmail: data.contactEmail || '',
        supplierId: data.supplierId,
        supplierName: data.supplierName,
        supplierCode: data.supplierCode,
        accountId: data.accountId,
        accountName: data.accountName,
        platform: data.platform,
        marketplace: data.marketplace,
        platformWarehouseType: data.platformWarehouseType,
        address: data.address || '',
        province: data.province || '',
        city: data.city || '',
        area: data.area || '',
        country: data.country || '中国',
        postCode: data.postCode || '',
        createTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        createTimeStr: new Date().toISOString().substring(0, 10),
        updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
        updateTimeStr: new Date().toISOString().substring(0, 10),
        creatorId: 1,
        creatorName: '当前用户',
        updateId: 1,
        updateName: '当前用户',
        isDeleted: 0,
        hasInventory: false,
        hasTransactions: false,
        hasRelatedDocuments: false
      }
      mockWarehouseList.push(newWarehouse)
      resolve({ code: 200, msg: '新增成功', data: newWarehouse })
    }, 300)
  })
}

/**
 * Mock 更新仓库
 */
export function mockUpdateWarehouse(data: any) {
  return new Promise<Record<string, any>>((resolve, reject) => {
    setTimeout(() => {
      const index = mockWarehouseList.findIndex((w) => String(w.id) === String(data.id))
      if (index !== -1) {
        // 检查编码是否重复（排除当前仓库）
        if (
          mockWarehouseList.some((w, i) => w.warehouseCode === data.warehouseCode && i !== index)
        ) {
          reject(new Error('仓库编码已存在'))
          return
        }

        const typeNames: Record<number, string> = { 1: '供应商仓', 2: '三方仓', 3: '平台仓' }
        mockWarehouseList[index] = {
          ...mockWarehouseList[index],
          warehouseCode: data.warehouseCode || mockWarehouseList[index].warehouseCode,
          warehouseName: data.warehouseName || mockWarehouseList[index].warehouseName,
          warehouseType: data.warehouseType ?? mockWarehouseList[index].warehouseType,
          warehouseTypeName:
            typeNames[data.warehouseType] || mockWarehouseList[index].warehouseTypeName,
          enableStatus: data.enableStatus ?? mockWarehouseList[index].enableStatus,
          enableStatusName: data.enableStatus === 1 ? '启用' : '禁用',
          principalName: data.principalName || mockWarehouseList[index].principalName,
          contactName: data.contactName || mockWarehouseList[index].contactName,
          contactPhone: data.contactPhone || mockWarehouseList[index].contactPhone,
          contactEmail: data.contactEmail || mockWarehouseList[index].contactEmail,
          supplierId: data.supplierId ?? mockWarehouseList[index].supplierId,
          supplierName: data.supplierName || mockWarehouseList[index].supplierName,
          supplierCode: data.supplierCode || mockWarehouseList[index].supplierCode,
          accountId: data.accountId ?? mockWarehouseList[index].accountId,
          accountName: data.accountName || mockWarehouseList[index].accountName,
          platform: data.platform || mockWarehouseList[index].platform,
          marketplace: data.marketplace || mockWarehouseList[index].marketplace,
          platformWarehouseType:
            data.platformWarehouseType || mockWarehouseList[index].platformWarehouseType,
          address: data.address || mockWarehouseList[index].address,
          province: data.province || mockWarehouseList[index].province,
          city: data.city || mockWarehouseList[index].city,
          area: data.area || mockWarehouseList[index].area,
          country: data.country || mockWarehouseList[index].country,
          postCode: data.postCode || mockWarehouseList[index].postCode,
          updateTime: new Date().toISOString().replace('T', ' ').substring(0, 19),
          updateTimeStr: new Date().toISOString().substring(0, 10),
          updateId: 1,
          updateName: '当前用户'
        }
        resolve({ code: 200, msg: '更新成功', data: mockWarehouseList[index] })
      } else {
        reject(new Error('仓库不存在'))
      }
    }, 300)
  })
}

/**
 * Mock 删除仓库（带校验）
 */
export function mockDeleteWarehouse(warehouseId: string | number) {
  return new Promise<Record<string, any>>((resolve, reject) => {
    setTimeout(() => {
      const warehouse = mockWarehouseList.find((w) => String(w.id) === String(warehouseId))
      if (!warehouse) {
        reject(new Error('仓库不存在'))
        return
      }

      // 1. 校验仓库是否已禁用
      if (warehouse.enableStatus === 1) {
        reject(new Error('仓库为启用状态,无法删除'))
        return
      }

      // 2. 校验是否有库存
      if (warehouse.hasInventory) {
        reject(new Error('存在可用量,无法删除'))
        return
      }

      // 3. 校验是否有库存流水
      if (warehouse.hasTransactions) {
        reject(new Error('仓库已有库存流水,无法删除'))
        return
      }

      // 4. 校验是否有关联单据
      if (warehouse.hasRelatedDocuments) {
        reject(new Error('仓库有关联单据,无法删除'))
        return
      }

      // 5. 校验是否有关联供应商（仅供应商仓）
      if (warehouse.warehouseType === 1 && warehouse.supplierId) {
        reject(new Error('仓库有关联供应商,无法删除'))
        return
      }

      // 通过所有校验，执行删除
      const initialLength = mockWarehouseList.length
      mockWarehouseList = mockWarehouseList.filter((w) => String(w.id) !== String(warehouseId))
      if (mockWarehouseList.length < initialLength) {
        resolve({ code: 200, msg: '删除成功' })
      } else {
        reject(new Error('删除失败'))
      }
    }, 300)
  })
}

/**
 * Mock 批量删除仓库（带校验）
 */
export function mockBatchDeleteWarehouse(warehouseIds: (string | number)[]) {
  return new Promise<Record<string, any>>((resolve, reject) => {
    setTimeout(() => {
      const warehouses = mockWarehouseList.filter((w) =>
        warehouseIds.map(String).includes(String(w.id))
      )

      // 依次校验每个仓库
      for (const warehouse of warehouses) {
        // 1. 校验仓库是否已禁用
        if (warehouse.enableStatus === 1) {
          reject(new Error(`仓库【${warehouse.warehouseName}】为启用状态,无法删除`))
          return
        }

        // 2. 校验是否有库存
        if (warehouse.hasInventory) {
          reject(new Error(`仓库【${warehouse.warehouseName}】存在可用量,无法删除`))
          return
        }

        // 3. 校验是否有库存流水
        if (warehouse.hasTransactions) {
          reject(new Error(`仓库【${warehouse.warehouseName}】已有库存流水,无法删除`))
          return
        }

        // 4. 校验是否有关联单据
        if (warehouse.hasRelatedDocuments) {
          reject(new Error(`仓库【${warehouse.warehouseName}】有关联单据,无法删除`))
          return
        }

        // 5. 校验是否有关联供应商（仅供应商仓）
        if (warehouse.warehouseType === 1 && warehouse.supplierId) {
          reject(new Error(`仓库【${warehouse.warehouseName}】有关联供应商,无法删除`))
          return
        }
      }

      // 通过所有校验，执行删除
      const initialLength = mockWarehouseList.length
      mockWarehouseList = mockWarehouseList.filter(
        (w) => !warehouseIds.map(String).includes(String(w.id))
      )
      const deletedCount = initialLength - mockWarehouseList.length
      resolve({ code: 200, msg: `成功删除 ${deletedCount} 条仓库` })
    }, 300)
  })
}

/**
 * Mock 批量启用/禁用仓库
 */
export function mockBatchUpdateWarehouseStatus(
  warehouseIds: (string | number)[],
  enableStatus: number
) {
  return new Promise<Record<string, any>>((resolve, reject) => {
    setTimeout(() => {
      const statusName = enableStatus === 1 ? '启用' : '禁用'
      let updateCount = 0

      warehouseIds.forEach((id) => {
        const index = mockWarehouseList.findIndex((w) => String(w.id) === String(id))
        if (index !== -1) {
          // 校验：只能启用已禁用的仓库，只能禁用已启用的仓库
          if (
            (enableStatus === 1 && mockWarehouseList[index].enableStatus === 0) ||
            (enableStatus === 0 && mockWarehouseList[index].enableStatus === 1)
          ) {
            mockWarehouseList[index].enableStatus = enableStatus
            mockWarehouseList[index].enableStatusName = statusName
            mockWarehouseList[index].updateTime = new Date()
              .toISOString()
              .replace('T', ' ')
              .substring(0, 19)
            mockWarehouseList[index].updateTimeStr = new Date().toISOString().substring(0, 10)
            updateCount++
          }
        }
      })

      if (updateCount > 0) {
        resolve({ code: 200, msg: `成功${statusName} ${updateCount} 条仓库` })
      } else {
        reject(new Error(`仅可${statusName}"已${enableStatus === 1 ? '禁用' : '启用'}"的仓库`))
      }
    }, 300)
  })
}
