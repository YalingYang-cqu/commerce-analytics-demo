import { AppRouteRecord } from '@/types/router'

export const saleAnalysisRoutes: AppRouteRecord = {
  path: '/sale-analysis',
  name: 'saleAnalysis',
  component: '/index/index',
  meta: {
    title: '销售分析',
    icon: '&#xe637;',
    roles: ['saleAnalysis']
  },
  children: [
    {
      path: 'sale-statics',
      name: 'saleStatics',
      component: '/sale-analysis/sale-statics',
      meta: {
        title: '销量统计',
        keepAlive: true,
        roles: ['saleAnalysis:saleStatics']
      }
    },
    {
      path: 'asin',
      name: 'asinView',
      component: '/sale-analysis/asin',
      meta: {
        title: 'ASIN看板',
        keepAlive: true,
        roles: ['saleAnalysis:asin']
      }
    }
  ]
}
