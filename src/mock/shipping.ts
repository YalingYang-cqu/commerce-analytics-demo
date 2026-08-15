// Mock data for shipping module

export const mockShippingList = {
  records: [
    {
      id: 1,
      shippingNo: 'SP2024010001',
      shippingStatus: 0,
      shippingStatusName: '草稿',
      sourceWarehouseId: 1,
      sourceWarehouseName: '深圳仓',
      targetWarehouseId: 3,
      targetWarehouseName: 'FBA美西仓',
      applyReason: '补货需求',
      ownerIds: [1, 2],
      ownerNames: '张三, 李四',
      creatorId: 1,
      creatorName: '张三',
      createTime: '2024-01-01 10:00:00',
      updateTime: '2024-01-01 10:00:00',
      remark: '',
      productCount: 5,
      totalQuantity: 500
    },
    {
      id: 2,
      shippingNo: 'SP2024010002',
      shippingStatus: 1,
      shippingStatusName: '待处理',
      sourceWarehouseId: 1,
      sourceWarehouseName: '深圳仓',
      targetWarehouseId: 4,
      targetWarehouseName: 'FBA美东仓',
      applyReason: '销售旺季备货',
      ownerIds: [1],
      ownerNames: '张三',
      creatorId: 1,
      creatorName: '张三',
      createTime: '2024-01-02 10:00:00',
      updateTime: '2024-01-02 10:00:00',
      remark: '优先处理',
      productCount: 3,
      totalQuantity: 300
    }
  ],
  total: 2,
  current: 1,
  size: 20
}

export const mockProductLevelList = {
  records: [
    {
      id: 1,
      shippingId: 1,
      shippingNo: 'SP2024010001',
      shippingStatus: 0,
      shippingStatusName: '草稿',
      sourceWarehouseName: '深圳仓',
      targetWarehouseName: 'FBA美西仓',
      creatorName: '张三',
      createTime: '2024-01-01 10:00:00',
      productSkuId: 101,
      sku: 'SKU001',
      chineseProductName: '测试产品1',
      spu: 'SPU001',
      chineseSpuName: '测试款1',
      materialCode: 'MAT-001',
      categoryPath: '电子产品/手机配件',
      brandName: '品牌A',
      imageUrl: '',
      planQuantity: 100,
      availableQuantity: 500,
      quantityPerBox: 20,
      boxCount: 5,
      transportType: 'sea',
      transportTypeName: '海运',
      logisticsChannel: 'A',
      logisticsChannelName: '渠道A',
      planShipDate: '2024-01-15',
      estimatedArrivalDate: '2024-02-15',
      boxSize: '50*40*30',
      boxWeight: 15,
      totalWeight: 75,
      totalVolume: 0.3,
      purchaserName: '李四',
      productRemark: ''
    }
  ],
  total: 1,
  current: 1,
  size: 20
}

export const mockShippingDetail = {
  id: 1,
  shippingNo: 'SP2024010001',
  shippingStatus: 0,
  shippingStatusName: '草稿',
  sourceWarehouseId: 1,
  sourceWarehouseName: '深圳仓',
  targetWarehouseId: 3,
  targetWarehouseName: 'FBA美西仓',
  applyReason: '补货需求',
  ownerIds: [1, 2],
  ownerNames: '张三, 李四',
  creatorId: 1,
  creatorName: '张三',
  createTime: '2024-01-01 10:00:00',
  updateTime: '2024-01-01 10:00:00',
  submitTime: '',
  approveTime: '',
  shippingTime: '',
  completeTime: '',
  remark: '',
  attachments: [],
  productItems: [
    {
      id: 1,
      productSkuId: 101,
      sku: 'SKU001',
      chineseProductName: '测试产品1',
      spu: 'SPU001',
      chineseSpuName: '测试款1',
      materialCode: 'MAT-001',
      categoryPath: '电子产品/手机配件',
      brandName: '品牌A',
      imageUrl: '',
      planQuantity: 100,
      availableQuantity: 500,
      quantityPerBox: 20,
      boxCount: 5,
      transportType: 'sea',
      transportTypeName: '海运',
      logisticsChannel: 'A',
      logisticsChannelName: '渠道A',
      planShipDate: '2024-01-15',
      estimatedArrivalDate: '2024-02-15',
      boxSize: '50*40*30',
      boxWeight: 15,
      totalWeight: 75,
      totalVolume: 0.3,
      purchaserName: '李四',
      labelMaterial: null,
      productRemark: ''
    }
  ]
}

export const mockOperationLog = [
  {
    id: 1,
    operationType: 1,
    operationTypeName: '创建',
    operatorId: 1,
    operatorName: '张三',
    operationTime: '2024-01-01 10:00:00',
    remark: '创建了发货计划单'
  }
]

export const mockWarehouseList = [
  { id: 1, warehouseName: '深圳仓', warehouseType: 1, warehouseTypeName: '国内仓' },
  { id: 2, warehouseName: '广州仓', warehouseType: 1, warehouseTypeName: '国内仓' },
  { id: 3, warehouseName: 'FBA美西仓', warehouseType: 2, warehouseTypeName: 'FBA仓' },
  { id: 4, warehouseName: 'FBA美东仓', warehouseType: 2, warehouseTypeName: 'FBA仓' },
  { id: 5, warehouseName: '海外仓A', warehouseType: 3, warehouseTypeName: '海外仓' }
]

export const mockLogisticsChannelList = [
  {
    id: 1,
    channelName: '渠道A',
    channelCode: 'A',
    transportType: 'sea',
    transportTypeName: '海运'
  },
  {
    id: 2,
    channelName: '渠道B',
    channelCode: 'B',
    transportType: 'air',
    transportTypeName: '空运'
  },
  {
    id: 3,
    channelName: '渠道C',
    channelCode: 'C',
    transportType: 'express',
    transportTypeName: '快递'
  }
]

export const mockProductSelectList = {
  records: [
    {
      productSkuId: 101,
      sku: 'SKU001',
      chineseProductName: '测试产品1',
      spu: 'SPU001',
      chineseSpuName: '测试款1',
      materialCode: 'MAT-001',
      categoryPath: '电子产品/手机配件',
      brandName: '品牌A',
      dataStatus: 2,
      dataStatusName: '已生效',
      imageUrl: '',
      availableQuantity: 500,
      quantityPerBox: 20
    },
    {
      productSkuId: 102,
      sku: 'SKU002',
      chineseProductName: '测试产品2',
      spu: 'SPU002',
      chineseSpuName: '测试款2',
      materialCode: 'MAT-002',
      categoryPath: '电子产品/平板配件',
      brandName: '品牌B',
      dataStatus: 2,
      dataStatusName: '已生效',
      imageUrl: '',
      availableQuantity: 300,
      quantityPerBox: 15
    }
  ],
  total: 2,
  current: 1,
  size: 20
}
