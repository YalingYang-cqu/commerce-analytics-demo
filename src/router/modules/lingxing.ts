/*
 * Portfolio demo
 * @Date: 2026-01-07 14:22:31
 * Company-specific metadata removed
 * @LastEditTime: 2026-01-12 14:11:45
 * @FilePath: src/router/modules/lingxing.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import { AppRouteRecord } from '@/types/router'

export const lingxingRoutes: AppRouteRecord = {
  path: '/external-system',
  name: 'ExternalSystem',
  component: '/index/index',
  meta: {
    title: '外部系统',
    icon: '&#xe603;',
    isExternalAction: true,
    externalHandler: 'lingxingSso',
    isHide: true,
    order: 9999, // 设置一个很大的排序值，确保始终在最后
    roles: ['external-system']
  },
  children: [
    {
      path: 'login',
      name: 'ExternalSystemLogin',
      component: '/system/external-login',
      meta: {
        title: '外部系统登录',
        isExternalAction: true,
        externalHandler: 'lingxingSso',
        isHide: true,
        order: 9999, // 设置一个很大的排序值，确保始终在最后
        roles: ['external-system:login']
      }
    }
  ]
}
