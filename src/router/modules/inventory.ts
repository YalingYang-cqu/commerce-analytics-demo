import { AppRouteRecord } from '@/types/router'

/**
 * 成本中心：批次结存（② 批次结存中心） + 库存成本流水（① 平台流水 / ③ 成本流水）
 * 业务口径见《【亚马逊全平台】库存成本流转业务方案》与《成本计算三中心时序图》
 */
export const inventoryRoutes: AppRouteRecord = {
  path: '/inventory',
  name: 'Inventory',
  component: '/index/index',
  meta: {
    title: '成本中心',
    icon: '&#xe6ae;',
    roles: ['inventory']
  },
  children: [
    {
      path: 'batch-balance',
      name: 'InventoryBatchBalance',
      component: '/inventory/batch-balance',
      meta: {
        title: '批次结存',
        keepAlive: true,
        roles: ['inventory:batchBalance']
      }
    },
    {
      path: 'sku-cost-flow',
      name: 'InventorySkuCostFlow',
      component: '/inventory/sku-cost-flow',
      meta: {
        title: '库存成本流水',
        keepAlive: true,
        roles: ['inventory:skuCostFlow']
      }
    }
  ]
}
