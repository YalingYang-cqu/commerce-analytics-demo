import { AppRouteRecord } from '@/types/router'

export const resultRoutes: AppRouteRecord = {
  path: '/result',
  name: 'Result',
  component: '/index/index',
  meta: {
    title: 'menus.result.title',
    icon: '&#xe67f;'
  },
  children: [
    {
      path: 'success',
      name: 'ResultSuccess',
      component: '/result/success',
      meta: {
        title: 'menus.result.success',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'fail',
      name: 'ResultFail',
      component: '/result/fail',
      meta: {
        title: 'menus.result.fail',
        keepAlive: true,
        isHide: true
      }
    }
  ]
}
