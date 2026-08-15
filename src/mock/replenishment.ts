/*
 * @Description: 补货需求单 Mock 数据
 * 用于前端开发和联调
 * @author Claude Code
 * @date 2026-01-06
 */

import type { Api } from '@/typings/api'

// 状态名称映射
const STATUS_NAME_MAP: Record<number, string> = {
  0: '草稿',
  1: '待审批',
  2: '待采购',
  3: '已驳回',
  4: '已作废',
  5: '已完成'
}

// 资料状态名称映射
const DATA_STATUS_NAME_MAP: Record<number, string> = {
  0: '草稿',
  1: '待审批',
  2: '已生效',
  3: '已驳回'
}

// 模拟补货需求单数据
let mockReplenishmentList: Api.Replenishment.ListItem[] = [
  {
    id: 1,
    requirementNo: 'PP2601060001',
    applyReason: '春节备货，预计销量增加，需提前补充库存',
    status: 2,
    statusName: '待采购',
    productCount: 5,
    totalQuantity: 2000,
    ownerNames: '张三,李四',
    creatorName: '张三',
    createTime: '2026-01-01 10:00:00',
    updateTime: '2026-01-02 14:30:00'
  },
  {
    id: 2,
    requirementNo: 'PP2601060002',
    applyReason: '库存不足，需紧急补货',
    status: 0,
    statusName: '草稿',
    productCount: 3,
    totalQuantity: 500,
    ownerNames: '王五',
    creatorName: '王五',
    createTime: '2026-01-02 09:15:00'
  },
  {
    id: 3,
    requirementNo: 'PP2601060003',
    applyReason: '新品上市备货，预计需求量大',
    status: 1,
    statusName: '待审批',
    productCount: 8,
    totalQuantity: 3000,
    ownerNames: '赵六,张三',
    creatorName: '赵六',
    createTime: '2026-01-03 11:20:00',
    updateTime: '2026-01-03 15:45:00'
  },
  {
    id: 4,
    requirementNo: 'PP2601050004',
    applyReason: '双十一活动备货',
    status: 3,
    statusName: '已驳回',
    productCount: 6,
    totalQuantity: 1500,
    ownerNames: '孙八',
    creatorName: '孙八',
    createTime: '2026-01-05 13:00:00',
    updateTime: '2026-01-05 16:20:00'
  },
  {
    id: 5,
    requirementNo: 'PP2601040005',
    applyReason: '老客户补货需求',
    status: 4,
    statusName: '已作废',
    productCount: 4,
    totalQuantity: 800,
    ownerNames: '李四',
    creatorName: '李四',
    createTime: '2026-01-04 14:30:00',
    updateTime: '2026-01-04 17:10:00'
  },
  {
    id: 6,
    requirementNo: 'PP2601030006',
    applyReason: '促销活动补货',
    status: 5,
    statusName: '已完成',
    productCount: 10,
    totalQuantity: 5000,
    ownerNames: '张三,王五,李四',
    creatorName: '张三',
    createTime: '2026-01-03 08:00:00',
    updateTime: '2026-01-03 18:30:00'
  },
  {
    id: 7,
    requirementNo: 'PP2601020007',
    applyReason: '季节性商品备货',
    status: 0,
    statusName: '草稿',
    productCount: 7,
    totalQuantity: 1200,
    ownerNames: '赵六',
    creatorName: '赵六',
    createTime: '2026-01-02 15:45:00'
  },
  {
    id: 8,
    requirementNo: 'PP2601010008',
    applyReason: '渠道拓展需求',
    status: 1,
    statusName: '待审批',
    productCount: 9,
    totalQuantity: 2500,
    ownerNames: '孙八,李四',
    creatorName: '孙八',
    createTime: '2026-01-01 16:00:00',
    updateTime: '2026-01-02 10:20:00'
  },
  {
    id: 9,
    requirementNo: 'PP2512310009',
    applyReason: '年终清仓补货',
    status: 2,
    statusName: '待采购',
    productCount: 12,
    totalQuantity: 3500,
    ownerNames: '张三,赵六',
    creatorName: '张三',
    createTime: '2025-12-31 09:00:00',
    updateTime: '2026-01-02 11:00:00'
  },
  {
    id: 10,
    requirementNo: 'PP2512300010',
    applyReason: '测试单据 - 单产品大批量',
    status: 0,
    statusName: '草稿',
    productCount: 1,
    totalQuantity: 10000,
    ownerNames: '王五',
    creatorName: '王五',
    createTime: '2025-12-30 14:00:00'
  },
  {
    id: 11,
    requirementNo: 'PP2601060011',
    applyReason: '多品类混合补货需求，涉及服装、鞋类、配件等多个类目',
    status: 1,
    statusName: '待审批',
    productCount: 25,
    totalQuantity: 8000,
    ownerNames: '张三,李四,王五',
    creatorName: '张三',
    createTime: '2026-01-06 08:30:00',
    updateTime: '2026-01-06 09:15:00'
  },
  {
    id: 12,
    requirementNo: 'PP2601050012',
    applyReason: '紧急补货需求',
    status: 3,
    statusName: '已驳回',
    productCount: 5,
    totalQuantity: 1000,
    ownerNames: '王五',
    creatorName: '王五',
    createTime: '2025-12-30 14:20:00',
    updateTime: '2025-12-30 18:50:00'
  }
]

// 模拟产品SKU数据（用于产品选择）
const mockProductSkuList: Api.Replenishment.ProductSelectItem[] = [
  {
    productSkuId: 101,
    sku: 'HLA-001',
    chineseProductName: '钢化膜透明款',
    imageUrl: 'https://via.placeholder.com/50',
    spu: 'HLA',
    chineseStyleName: '手机保护膜',
    materialCode: 'MAT-001',
    categoryPath: '数码配件/手机配件/保护膜',
    brandName: 'only',
    quantityPerBox: 100,
    purchaserId: 1,
    purchaserName: '采购员A',
    dataStatus: 2,
    dataStatusName: '已生效'
  },
  {
    productSkuId: 102,
    sku: 'PHC-001',
    chineseProductName: '手机壳透明软壳',
    imageUrl: 'https://via.placeholder.com/50',
    spu: 'PHC',
    chineseStyleName: '手机保护壳',
    materialCode: 'MAT-004',
    categoryPath: '数码配件/手机配件/手机壳',
    brandName: 'only',
    quantityPerBox: 100,
    purchaserId: 2,
    purchaserName: '采购员B',
    dataStatus: 2,
    dataStatusName: '已生效'
  },
  {
    productSkuId: 103,
    sku: 'CAB-001',
    chineseProductName: '数据线Type-C快充',
    imageUrl: 'https://via.placeholder.com/50',
    spu: 'CAB',
    chineseStyleName: '充电数据线',
    materialCode: 'MAT-007',
    categoryPath: '数码配件/手机配件/数据线',
    brandName: 'newlife',
    quantityPerBox: 50,
    purchaserId: 1,
    purchaserName: '采购员A',
    dataStatus: 1,
    dataStatusName: '待审批'
  },
  {
    productSkuId: 104,
    sku: 'POW-001',
    chineseProductName: '移动电源10000mAh',
    imageUrl: 'https://via.placeholder.com/50',
    spu: 'POW',
    chineseStyleName: '充电宝',
    materialCode: 'MAT-010',
    categoryPath: '数码配件/手机配件/充电宝',
    brandName: 'newlife',
    quantityPerBox: 20,
    purchaserId: 2,
    purchaserName: '采购员B',
    dataStatus: 2,
    dataStatusName: '已生效'
  },
  {
    productSkuId: 105,
    sku: 'EAR-001',
    chineseProductName: '蓝牙耳机无线款',
    imageUrl: 'https://via.placeholder.com/50',
    spu: 'EAR',
    chineseStyleName: '无线耳机',
    materialCode: 'MAT-015',
    categoryPath: '数码配件/音频设备/耳机',
    brandName: 'only',
    quantityPerBox: 30,
    purchaserId: 1,
    purchaserName: '采购员A',
    dataStatus: 2,
    dataStatusName: '已生效'
  }
]

// 模拟操作日志
// const mockOperationLogs: Api.Replenishment.OperationLogItem[] = [
//   {
//     id: 1,
//     operationType: '创建',
//     operationContent: '创建补货需求单',
//     operatorName: '张三',
//     operationTime: '2026-01-01 10:00:00'
//   },
//   {
//     id: 2,
//     operationType: '提交审批',
//     operationContent: '提交审批',
//     operatorName: '张三',
//     operationTime: '2026-01-01 10:05:00'
//   },
//   {
//     id: 3,
//     operationType: '审批通过',
//     operationContent: '审批通过',
//     operatorName: '审批人A',
//     operationTime: '2026-01-02 09:30:00'
//   },
//   {
//     id: 4,
//     operationType: '更新备注',
//     operationContent: '更新单据备注：优先处理，急需到货',
//     operatorName: '李四',
//     operationTime: '2026-01-02 14:30:00'
//   }
// ]

/**
 * 生成补货需求单号
 * 规则: PP + YYMMDD + 6位数自增序列（从000001开始）
 */
function generateRequirementNo(): string {
  const today = new Date()
  const year = today.getFullYear().toString().slice(2)
  const month = (today.getMonth() + 1).toString().padStart(2, '0')
  const day = today.getDate().toString().padStart(2, '0')
  const dateStr = `${year}${month}${day}`

  // 获取当天已有单号的最大序号
  const todayPrefix = `PP${dateStr}`
  const todayItems = mockReplenishmentList.filter((item) =>
    item.requirementNo.startsWith(todayPrefix)
  )

  let maxSeq = 0
  todayItems.forEach((item) => {
    const seqStr = item.requirementNo.slice(todayPrefix.length)
    const seq = parseInt(seqStr, 10)
    if (seq > maxSeq) maxSeq = seq
  })

  const newSeq = (maxSeq + 1).toString().padStart(6, '0')
  return `${todayPrefix}${newSeq}`
}

/**
 * Mock 查询补货需求单列表
 */
export function mockFetchReplenishmentList(params: Api.Replenishment.QueryParam) {
  return new Promise<{
    records: Api.Replenishment.ListItem[]
    total: number
    current: number
    size: number
  }>((resolve) => {
    setTimeout(() => {
      let filteredList = mockReplenishmentList.filter((item) => {
        // 关键词搜索
        const matchesKeyword = params.keyword
          ? item.requirementNo.includes(params.keyword) || item.applyReason.includes(params.keyword)
          : true

        // 状态过滤
        const matchesStatus =
          params.statusList && params.statusList.length > 0
            ? params.statusList.includes(item.status)
            : true

        // 创建时间范围
        const matchesCreateTimeFrom = params.createTimeFrom
          ? item.createTime >= params.createTimeFrom
          : true
        const matchesCreateTimeTo = params.createTimeTo
          ? item.createTime <= params.createTimeTo
          : true

        return matchesKeyword && matchesStatus && matchesCreateTimeFrom && matchesCreateTimeTo
      })

      // 排序
      if (params.orderBy) {
        filteredList = filteredList.sort((a: any, b: any) => {
          const aVal = a[params.orderBy!]
          const bVal = b[params.orderBy!]
          // 默认降序
          return bVal > aVal ? 1 : -1
        })
      }

      // 分页
      const currentPage = params.currentPage || 1
      const pageSize = params.pageSize || 20
      const start = (currentPage - 1) * pageSize
      const end = start + pageSize
      const paginatedList = filteredList.slice(start, end)

      const result = {
        records: paginatedList,
        total: filteredList.length,
        current: currentPage,
        size: pageSize
      }
      console.log(
        '🎯 Mock returning:',
        result.total,
        'total records,',
        result.records.length,
        'in current page'
      )
      console.log('📋 First record:', result.records[0])
      resolve(result)
    }, 300) // 模拟网络延迟
  })
}

/**
 * Mock 获取补货需求单详情
 */
export function mockGetReplenishmentDetail(id: number) {
  return new Promise<Api.Replenishment.Item>((resolve, reject) => {
    setTimeout(() => {
      const item = mockReplenishmentList.find((r) => r.id === id)
      if (item) {
        const detail: Api.Replenishment.Item = {
          id: item.id,
          requirementNo: item.requirementNo,
          applyReason: item.applyReason,
          status: item.status,
          statusName: item.statusName,
          ownerIds: [1, 2], // Mock数据
          ownerNames: item.ownerNames ? item.ownerNames.split(',') : [],
          remark: '优先处理，急需到货',
          attachment: 'https://example.com/file1.pdf,https://example.com/file2.jpg',
          productItems: [
            {
              id: 1,
              productSkuId: 101,
              sku: 'HLA-001',
              chineseProductName: '钢化膜透明款',
              spu: 'HLA',
              chineseStyleName: '手机保护膜',
              materialCode: 'MAT-001',
              categoryPath: '数码配件/手机配件/保护膜',
              brandName: 'only',
              imageUrl: 'https://via.placeholder.com/50',
              requestQuantity: 1000,
              quantityPerBox: 100,
              boxCount: 10,
              expectedDeliveryDate: '2026-02-01',
              purchaserId: 1,
              purchaserName: '采购员A',
              labelMaterial: 'https://example.com/label1.pdf',
              productRemark: '需要特别包装',
              isBoxCountInteger: true
            },
            {
              id: 2,
              productSkuId: 102,
              sku: 'PHC-001',
              chineseProductName: '手机壳透明软壳',
              spu: 'PHC',
              chineseStyleName: '手机保护壳',
              materialCode: 'MAT-004',
              categoryPath: '数码配件/手机配件/手机壳',
              brandName: 'only',
              imageUrl: 'https://via.placeholder.com/50',
              requestQuantity: 850,
              quantityPerBox: 100,
              boxCount: 9,
              expectedDeliveryDate: '2026-02-01',
              purchaserId: 2,
              purchaserName: '采购员B',
              isBoxCountInteger: false // 850 / 100 = 8.5, 向上取整为9
            }
          ],
          creatorId: 1,
          creatorName: item.creatorName,
          createTime: item.createTime,
          updateByName: '李四',
          updateTime: item.updateTime
        }
        resolve(detail)
      } else {
        reject(new Error('补货需求单不存在'))
      }
    }, 200)
  })
}

/**
 * Mock 创建补货需求单
 */
export function mockCreateReplenishment(data: Api.Replenishment.CreateParams) {
  return new Promise<{ id: number }>((resolve) => {
    setTimeout(() => {
      const newId = Math.max(...mockReplenishmentList.map((r) => r.id), 0) + 1
      const requirementNo = generateRequirementNo()

      const newItem: Api.Replenishment.ListItem = {
        id: newId,
        requirementNo,
        applyReason: data.applyReason,
        status: data.status,
        statusName: STATUS_NAME_MAP[data.status],
        productCount: data.productItems.length,
        totalQuantity: data.productItems.reduce((sum, item) => sum + item.requestQuantity, 0),
        ownerNames: data.ownerIds ? data.ownerIds.map((id) => `用户${id}`).join(',') : '',
        creatorName: '当前用户',
        createTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
      }

      mockReplenishmentList.unshift(newItem)
      resolve({ id: newId })
    }, 300)
  })
}

/**
 * Mock 更新补货需求单
 */
export function mockUpdateReplenishment(data: Api.Replenishment.UpdateParams) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const index = mockReplenishmentList.findIndex((r) => r.id === data.id)
      if (index !== -1) {
        mockReplenishmentList[index] = {
          ...mockReplenishmentList[index],
          applyReason: data.applyReason,
          status: data.status,
          statusName: STATUS_NAME_MAP[data.status],
          productCount: data.productItems.length,
          totalQuantity: data.productItems.reduce((sum, item) => sum + item.requestQuantity, 0),
          ownerNames: data.ownerIds ? data.ownerIds.map((id) => `用户${id}`).join(',') : '',
          updateTime: new Date().toISOString().replace('T', ' ').slice(0, 19)
        }
        resolve()
      } else {
        reject(new Error('补货需求单不存在'))
      }
    }, 300)
  })
}

/**
 * Mock 获取补货需求单详情
 */
export function mockFetchReplenishmentDetail(id: number) {
  return new Promise<Api.Replenishment.Detail>((resolve, reject) => {
    setTimeout(() => {
      const item = mockReplenishmentList.find((r) => r.id === id)
      if (!item) {
        reject(new Error('补货需求单不存在'))
        return
      }

      // 模拟产品明细数据
      const productItems: Api.Replenishment.ProductItem[] = [
        {
          productSkuId: 1,
          sku: 'SKU001',
          chineseProductName: '时尚T恤-白色',
          spu: 'SPU001',
          chineseStyleName: '时尚T恤',
          materialCode: 'MAT001',
          categoryPath: '服装/上装/T恤',
          brandName: '品牌A',
          dataStatus: 2,
          dataStatusName: '已生效',
          purchaserId: 2,
          purchaserName: '李四',
          requestQuantity: 500,
          quantityPerBox: 50,
          boxCount: 10,
          isBoxCountInteger: true,
          expectedDeliveryDate: '2026-02-01',
          remark: '优先发货'
        },
        {
          productSkuId: 2,
          sku: 'SKU002',
          chineseProductName: '运动鞋-黑色',
          spu: 'SPU002',
          chineseStyleName: '运动鞋',
          materialCode: 'MAT002',
          categoryPath: '鞋类/运动鞋',
          brandName: '品牌B',
          dataStatus: 2,
          dataStatusName: '已生效',
          purchaserId: 2,
          purchaserName: '李四',
          requestQuantity: 300,
          quantityPerBox: 30,
          boxCount: 10,
          isBoxCountInteger: true,
          expectedDeliveryDate: '2026-02-05',
          remark: ''
        },
        {
          productSkuId: 3,
          sku: 'SKU003',
          chineseProductName: '牛仔裤-蓝色',
          spu: 'SPU003',
          chineseStyleName: '牛仔裤',
          materialCode: 'MAT003',
          categoryPath: '服装/下装/裤子',
          brandName: '品牌C',
          dataStatus: 1,
          dataStatusName: '待审批',
          purchaserId: 3,
          purchaserName: '王五',
          requestQuantity: 250,
          quantityPerBox: 40,
          boxCount: 7,
          isBoxCountInteger: false,
          expectedDeliveryDate: '2026-02-10',
          remark: '注意尺码配比'
        }
      ]

      // 模拟附件数据
      const attachments: Api.Replenishment.Attachment[] = [
        {
          id: 1,
          fileName: '补货需求说明.pdf',
          fileUrl: '/files/replenishment/1.pdf',
          fileSize: 1024 * 500,
          uploadTime: '2026-01-01 10:30:00'
        },
        {
          id: 2,
          fileName: '产品图片.jpg',
          fileUrl: '/files/replenishment/2.jpg',
          fileSize: 1024 * 200,
          uploadTime: '2026-01-01 11:00:00'
        }
      ]

      const detail: Api.Replenishment.Detail = {
        id: item.id,
        requirementNo: item.requirementNo,
        applyReason: item.applyReason,
        status: item.status,
        statusName: item.statusName,
        ownerIds: [1, 2],
        ownerNames: item.ownerNames || '',
        remark: '请注意发货时间',
        attachmentCount: attachments.length,
        attachments,
        productItems,
        creatorId: 1,
        creatorName: item.creatorName,
        createTime: item.createTime,
        updateTime: item.updateTime
      }

      resolve(detail)
    }, 300)
  })
}

/**
 * Mock 获取操作记录
 */
export function mockFetchOperationLog(id: number) {
  return new Promise<Api.Replenishment.OperationLog[]>((resolve) => {
    setTimeout(() => {
      // 根据需求单ID生成对应的操作记录
      const logs: Api.Replenishment.OperationLog[] = [
        {
          id: 1,
          requirementId: id,
          operationType: '创建',
          operatorId: 1,
          operatorName: '张三',
          operationTime: '2026-01-01 10:00:00',
          remark: '创建补货需求单'
        },
        {
          id: 2,
          requirementId: id,
          operationType: '编辑',
          operatorId: 1,
          operatorName: '张三',
          operationTime: '2026-01-01 14:30:00',
          remark: '修改申请理由和产品明细'
        },
        {
          id: 3,
          requirementId: id,
          operationType: '提交审批',
          operatorId: 1,
          operatorName: '张三',
          operationTime: '2026-01-02 09:00:00',
          remark: '提交审批'
        },
        {
          id: 4,
          requirementId: id,
          operationType: '审批通过',
          operatorId: 2,
          operatorName: '李四',
          operationTime: '2026-01-02 14:30:00',
          remark: '审批通过，可以进行采购'
        }
      ]

      resolve(logs)
    }, 300)
  })
}

/**
 * Mock 更新备注
 */
export function mockUpdateRemark(id: number) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const index = mockReplenishmentList.findIndex((r) => r.id === id)
      if (index !== -1) {
        // 实际应该更新详情中的remark字段，这里简化处理
        resolve()
      } else {
        reject(new Error('补货需求单不存在'))
      }
    }, 300)
  })
}

/**
 * Mock 更新负责人
 */
export function mockUpdateOwner(id: number, ownerIds: number[]) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const index = mockReplenishmentList.findIndex((r) => r.id === id)
      if (index !== -1) {
        mockReplenishmentList[index].ownerNames = ownerIds.map((oid) => `用户${oid}`).join(',')
        resolve()
      } else {
        reject(new Error('补货需求单不存在'))
      }
    }, 300)
  })
}

/**
 * Mock 删除补货需求单
 */
export function mockDeleteReplenishment(id: number) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const index = mockReplenishmentList.findIndex((r) => r.id === id)
      if (index !== -1) {
        const item = mockReplenishmentList[index]
        if (item.status !== 0) {
          reject(new Error('仅草稿状态支持删除'))
          return
        }
        mockReplenishmentList.splice(index, 1)
        resolve()
      } else {
        reject(new Error('补货需求单不存在'))
      }
    }, 300)
  })
}

/**
 * Mock 批量删除补货需求单
 */
export function mockBatchDeleteReplenishment(ids: number[]) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      mockReplenishmentList = mockReplenishmentList.filter((r) => !ids.includes(r.id))
      resolve()
    }, 300)
  })
}

/**
 * Mock 提交审批
 */
export function mockSubmitReplenishment(id: number) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const index = mockReplenishmentList.findIndex((r) => r.id === id)
      if (index !== -1) {
        mockReplenishmentList[index].status = 1
        mockReplenishmentList[index].statusName = '待审批'
        mockReplenishmentList[index].updateTime = new Date()
          .toISOString()
          .replace('T', ' ')
          .slice(0, 19)
        resolve()
      } else {
        reject(new Error('补货需求单不存在'))
      }
    }, 300)
  })
}

/**
 * Mock 批量提交审批
 */
export function mockBatchSubmitReplenishment(ids: number[]) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      ids.forEach((id) => {
        const index = mockReplenishmentList.findIndex((r) => r.id === id)
        if (index !== -1) {
          mockReplenishmentList[index].status = 1
          mockReplenishmentList[index].statusName = '待审批'
          mockReplenishmentList[index].updateTime = new Date()
            .toISOString()
            .replace('T', ' ')
            .slice(0, 19)
        }
      })
      resolve()
    }, 300)
  })
}

/**
 * Mock 撤回审批
 */
export function mockRecallReplenishment(id: number) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const index = mockReplenishmentList.findIndex((r) => r.id === id)
      if (index !== -1) {
        mockReplenishmentList[index].status = 0
        mockReplenishmentList[index].statusName = '草稿'
        mockReplenishmentList[index].updateTime = new Date()
          .toISOString()
          .replace('T', ' ')
          .slice(0, 19)
        resolve()
      } else {
        reject(new Error('补货需求单不存在'))
      }
    }, 300)
  })
}

/**
 * Mock 批量撤回审批
 */
export function mockBatchRecallReplenishment(ids: number[]) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      ids.forEach((id) => {
        const index = mockReplenishmentList.findIndex((r) => r.id === id)
        if (index !== -1) {
          mockReplenishmentList[index].status = 0
          mockReplenishmentList[index].statusName = '草稿'
          mockReplenishmentList[index].updateTime = new Date()
            .toISOString()
            .replace('T', ' ')
            .slice(0, 19)
        }
      })
      resolve()
    }, 300)
  })
}

/**
 * Mock 作废补货需求单
 */
export function mockVoidReplenishment(id: number) {
  return new Promise<void>((resolve, reject) => {
    setTimeout(() => {
      const index = mockReplenishmentList.findIndex((r) => r.id === id)
      if (index !== -1) {
        mockReplenishmentList[index].status = 4
        mockReplenishmentList[index].statusName = '已作废'
        mockReplenishmentList[index].updateTime = new Date()
          .toISOString()
          .replace('T', ' ')
          .slice(0, 19)
        resolve()
      } else {
        reject(new Error('补货需求单不存在'))
      }
    }, 300)
  })
}

/**
 * Mock 批量作废补货需求单
 */
export function mockBatchVoidReplenishment(ids: number[]) {
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      ids.forEach((id) => {
        const index = mockReplenishmentList.findIndex((r) => r.id === id)
        if (index !== -1) {
          mockReplenishmentList[index].status = 4
          mockReplenishmentList[index].statusName = '已作废'
          mockReplenishmentList[index].updateTime = new Date()
            .toISOString()
            .replace('T', ' ')
            .slice(0, 19)
        }
      })
      resolve()
    }, 300)
  })
}

/**
 * Mock 生成采购订单
 */
export function mockGeneratePurchaseOrder(id: number) {
  return new Promise<{ poId: number }>((resolve, reject) => {
    setTimeout(() => {
      const index = mockReplenishmentList.findIndex((r) => r.id === id)
      if (index !== -1) {
        mockReplenishmentList[index].status = 5
        mockReplenishmentList[index].statusName = '已完成'
        mockReplenishmentList[index].updateTime = new Date()
          .toISOString()
          .replace('T', ' ')
          .slice(0, 19)
        resolve({ poId: Math.floor(Math.random() * 10000) })
      } else {
        reject(new Error('补货需求单不存在'))
      }
    }, 300)
  })
}

/**
 * Mock 查询补货需求单产品级列表(展开视图)
 */
export function mockFetchProductLevelList(params: Api.Replenishment.QueryParam) {
  return new Promise<{
    records: Api.Replenishment.ProductLevelListItem[]
    total: number
    current: number
    size: number
  }>((resolve) => {
    setTimeout(() => {
      // 将每个需求单的产品明细展平为独立行
      const productLevelList: Api.Replenishment.ProductLevelListItem[] = []

      mockReplenishmentList.forEach((requirement) => {
        // 为每个需求单模拟2-5个产品
        const productCount = (requirement.id % 3) + 2 // 2-4个产品

        for (let i = 0; i < productCount; i++) {
          const skuId = requirement.id * 100 + i + 1
          const boxQty = [10, 20, 50, 100][i % 4]
          const requestQty = [200, 400, 600, 800, 1000][i % 5]

          productLevelList.push({
            // 产品信息
            id: skuId,
            productSkuId: skuId,
            sku: `PP${requirement.id.toString().padStart(8, '0')}${(i + 1).toString().padStart(2, '0')}`,
            chineseProductName: ['手机保护膜', '手机壳', '数据线', '充电器', '耳机'][i % 5],
            spu: ['HLA', 'PHC', 'DCL', 'CHG', 'EPH'][i % 5],
            chineseStyleName: ['透明款', '硬壳款', 'Type-C款', '快充款', '无线款'][i % 5],
            materialCode: `MAT-${(skuId % 1000).toString().padStart(3, '0')}`,
            categoryPath: [
              '数码配件/手机配件/保护膜',
              '数码配件/手机配件/手机壳',
              '数码配件/数据线',
              '数码配件/充电器',
              '数码配件/耳机'
            ][i % 5],
            brandName: ['only', 'newlife', 'Jack&Jones', 'Vero Moda'][i % 4],
            imageUrl: 'https://via.placeholder.com/50',
            requestQuantity: requestQty,
            quantityPerBox: boxQty,
            boxCount: Math.ceil(requestQty / boxQty),
            expectedDeliveryDate: `2026-0${(i % 2) + 1}-${(((i * 5) % 28) + 1).toString().padStart(2, '0')}`,
            purchaserId: (i % 3) + 1,
            purchaserName: ['采购员A', '采购员B', '采购员C'][i % 3],
            dataStatus: i % 4,
            dataStatusName: DATA_STATUS_NAME_MAP[i % 4],
            labelMaterial: i % 2 === 0 ? 'https://example.com/label.pdf' : undefined,
            remark: i % 3 === 0 ? '备注信息' : undefined,
            isBoxCountInteger: requestQty % boxQty === 0,

            // 需求单信息
            requirementId: requirement.id,
            requirementNo: requirement.requirementNo,
            applyReason: requirement.applyReason,
            requirementStatus: requirement.status,
            requirementStatusName: requirement.statusName,
            ownerNames: requirement.ownerNames,
            creatorName: requirement.creatorName,
            createTime: requirement.createTime,
            updateTime: requirement.updateTime,
            purchasedQuantity: i % 2 === 0 ? Math.floor(requestQty * 0.5) : 0,
            productRemark: i % 3 === 0 ? '需要特别包装' : undefined
          })
        }
      })

      // 过滤
      let filteredList = productLevelList.filter((item) => {
        // 关键词搜索 (需求单号、SKU、品名)
        const matchesKeyword = params.keyword
          ? item.requirementNo.includes(params.keyword) ||
            item.sku.includes(params.keyword) ||
            item.chineseProductName.includes(params.keyword)
          : true

        // 状态过滤
        const matchesStatus =
          params.statusList && params.statusList.length > 0
            ? params.statusList.includes(item.requirementStatus)
            : true

        // 创建时间范围
        const matchesCreateTimeFrom = params.createTimeFrom
          ? item.createTime >= params.createTimeFrom
          : true
        const matchesCreateTimeTo = params.createTimeTo
          ? item.createTime <= params.createTimeTo
          : true

        return matchesKeyword && matchesStatus && matchesCreateTimeFrom && matchesCreateTimeTo
      })

      // 排序
      if (params.orderBy) {
        const [field, order] = params.orderBy.split(' ')
        filteredList = filteredList.sort((a: any, b: any) => {
          const aVal = a[field]
          const bVal = b[field]
          if (order === 'asc') {
            return aVal > bVal ? 1 : -1
          } else {
            return bVal > aVal ? 1 : -1
          }
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
    }, 300)
  })
}

/**
 * Mock 获取可选产品列表
 */
export function mockFetchProductSelectList(params: Api.Replenishment.ProductSelectQueryParam) {
  return new Promise<{
    records: Api.Replenishment.ProductSelectItem[]
    total: number
    current: number
    size: number
  }>((resolve) => {
    setTimeout(() => {
      const filteredList = mockProductSkuList.filter((product) => {
        const matchesSku = params.sku ? product.sku.includes(params.sku) : true
        const matchesName = params.chineseProductName
          ? product.chineseProductName.includes(params.chineseProductName)
          : true
        const matchesSpu = params.spu ? product.spu.includes(params.spu) : true
        const matchesMaterial = params.materialCode
          ? product.materialCode.includes(params.materialCode)
          : true
        const matchesDataStatus =
          params.dataStatusList && params.dataStatusList.length > 0
            ? params.dataStatusList.includes(product.dataStatus)
            : true

        return matchesSku && matchesName && matchesSpu && matchesMaterial && matchesDataStatus
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
