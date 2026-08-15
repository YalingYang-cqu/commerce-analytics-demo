import { AppRouteRecord } from '@/types/router'

export const saleRoutes: AppRouteRecord = {
  path: '/sale',
  name: 'SALE',
  component: '/index/index',
  meta: {
    title: '销售管理',
    icon: '&#xe9ef;',
    roles: ['sale']
  },
  children: [
    // {
    //   path: 'goods-manage',
    //   name: 'GOODS',
    //   component: '/sale/goods',
    //   meta: {
    //     title: '商品管理',
    //     keepAlive: true,
    //     roles: ['sale:goods']
    //   }
    // },
    {
      path: 'sale-statics',
      name: 'saleStatics',
      component: '/sale-analysis/sale-statics',
      meta: {
        title: '销量统计',
        keepAlive: true,
        roles: ['sale:saleStatics']
      }
    }
    // {
    //   path: 'asin',
    //   name: 'asinView',
    //   component: '/sale-analysis/asin',
    //   meta: {
    //     title: 'ASIN看板',
    //     keepAlive: true,
    //     roles: ['sale:asin']
    //   }
    // }
  ]
}
