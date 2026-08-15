import { AppRouteRecord } from '@/types/router'

/** 物流子菜单权限码，用于父级 meta.roles：用户拥有任一即可显示「物流管理」菜单 */
const LOGISTICS_CHILD_ROLES = [
  'logistics:provider',
  'logistics:method',
  'logistics:channel',
  'logistics:waybill',
  'logistics:inquiry',
  'logistics:customs-template',
  'logistics:customs-declaration',
  'logistics:batchCost'
]

export const logisticsRoutes: AppRouteRecord = {
  path: '/logistics',
  name: 'Logistics',
  component: '/index/index',
  meta: {
    title: '物流管理',
    icon: '&#xe75f;',
    roles: LOGISTICS_CHILD_ROLES
  },
  children: [
    {
      path: 'batch-cost',
      name: 'LogisticsBatchCost',
      component: '/logistics/batch-cost',
      meta: {
        title: '头程物流批次成本',
        keepAlive: true,
        roles: ['logistics:batchCost']
      }
    }
  ]
}
