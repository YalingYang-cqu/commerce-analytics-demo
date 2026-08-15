import { AppRouteRecord } from '@/types/router'

export const purchaseRoutes: AppRouteRecord = {
  path: '/purchase',
  name: 'Purchase',
  component: '/index/index',
  meta: {
    title: '采购管理',
    icon: '&#xe602;',
    roles: ['purchase']
  },
  children: [
    {
      path: 'batch-cost',
      name: 'PurchaseBatchCost',
      component: '/purchase/batch-cost',
      meta: {
        title: '采购批次成本',
        keepAlive: true,
        roles: ['purchase:batchCost']
      }
    }
  ]
}
