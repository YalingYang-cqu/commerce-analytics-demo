import { AppRouteRecord } from '@/types/router'

export const financeRoutes: AppRouteRecord = {
  path: '/finance',
  name: 'Finance',
  component: '/index/index',
  meta: {
    title: '财务管理',
    icon: '&#xe623;',
    roles: ['finance']
  },
  children: [
    {
      path: 'sku-cost',
      name: 'FinanceSkuCost',
      component: '/finance/sku-cost',
      meta: {
        title: 'SKU综合成本',
        keepAlive: true,
        roles: ['finance:skuCost']
      }
    },
    {
      path: 'sc-profit',
      name: 'ScProfit',
      component: '/finance/sc-profit',
      meta: {
        title: 'SC订单利润',
        keepAlive: true,
        roles: ['finance:scProfit']
      }
    }
  ]
}
