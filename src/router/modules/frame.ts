import { AppRouteRecord } from '@/types/router'

export const iframeRoutes: AppRouteRecord = {
  path: '/frame',
  name: 'Frame',
  meta: {
    title: '外部页面(内嵌)',
    icon: '&#xec7f;',
    roles: ['R_SUPER', 'R_ADMIN']
  },
  component: '/index/index',
  children: [
    {
      path: 'element-plus-inner',
      name: 'elementPlus',
      meta: {
        title: 'elementPlus',
        frameSrc: 'https://element-plus.org/zh-CN/component/icon'
      },
      component: '/iframe/index'
    }
  ]
}
