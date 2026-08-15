import { AppRouteRecord } from '@/types/router'

export const userCenterRoutes: AppRouteRecord = {
  path: '/user-center',
  name: 'userCenter',
  component: '/index/index',
  meta: {
    title: '用户中心',
    icon: '&#xe6ae;'
  },
  children: [
    {
      path: 'user-info',
      name: 'userInfo',
      component: '/account-center/personal-center',
      meta: {
        title: '个人信息',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'update-pass',
      name: 'updatePass',
      component: '/account-center/update-pass',
      meta: {
        title: '账户设置',
        keepAlive: true,
        isHide: true
      }
    }
  ]
}
