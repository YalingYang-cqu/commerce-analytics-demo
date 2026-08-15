import { AppRouteRecord } from '@/types/router'

export const warehouseRoutes: AppRouteRecord = {
  path: '/warehouse',
  name: 'Warehouse',
  component: '/index/index',
  meta: {
    title: '仓库管理',
    icon: '&#xe616;',
    roles: ['warehouse']
  },
  children: [
    {
      path: 'inventory',
      name: 'inventory',
      component: '/warehouse/inventory',
      meta: {
        title: '仓库资料',
        keepAlive: true,
        roles: ['warehouse:info']
      }
    },
    {
      path: 'transfer-order',
      name: 'TransferOrder',
      component: '/plan/transfer-order',
      meta: {
        title: '调拨单',
        keepAlive: true,
        roles: ['warehouse:transferOrder']
      }
    },
    {
      path: 'transfer-order/detail',
      name: 'TransferOrderDetail',
      component: '/plan/transfer-order/detail',
      meta: {
        title: '调拨单详情',
        keepAlive: false,
        isHide: true
      }
    },
    {
      path: 'inventory-details',
      name: 'InventoryDetail',
      component: '/warehouse/inventory-details',
      meta: {
        title: '库存明细',
        keepAlive: true,
        roles: ['warehouse:details']
      }
    },
    {
      path: 'inventory-flow',
      name: 'InventoryFlow',
      component: '/warehouse/inventory-flow',
      meta: {
        title: '库存流水',
        keepAlive: true,
        roles: ['warehouse:inventoryFlow']
      }
    },
    {
      path: 'real-time-inventory',
      name: 'RealTimeInventory',
      component: '/warehouse/real-time-inventory',
      meta: {
        title: '实时业务库存',
        keepAlive: true,
        roles: ['warehouse:realtime']
      }
    },
    {
      path: 'warehouse-in',
      name: 'WarehouseIn',
      component: '/warehouse/warehouse-in',
      meta: {
        title: '入库单',
        roles: ['warehouse:in'],
        keepAlive: true
      }
    },
    {
      path: 'warehouse-in/add',
      name: 'WarehouseInAdd',
      component: '/warehouse/warehouse-in/add',
      meta: {
        title: '添加入库单',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'warehouse-in/edit',
      name: 'WarehouseInEdit',
      component: '/warehouse/warehouse-in/edit',
      meta: {
        title: '编辑入库单',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'warehouse-in/detail',
      name: 'WarehouseInDetail',
      component: '/warehouse/warehouse-in/detail',
      meta: {
        title: '入库单详情',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'warehouse-out',
      name: 'WarehouseOut',
      component: '/warehouse/warehouse-out',
      meta: {
        title: '出库单',
        keepAlive: true,
        roles: ['warehouse:out']
      }
    },
    {
      path: 'warehouse-out/add',
      name: 'WarehouseOutAdd',
      component: '/warehouse/warehouse-out/add',
      meta: {
        title: '添加出库单',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'warehouse-out/edit',
      name: 'WarehouseOutEdit',
      component: '/warehouse/warehouse-out/edit',
      meta: {
        title: '编辑出库单',
        keepAlive: true,
        isHide: true
      }
    },
    {
      path: 'warehouse-out/detail',
      name: 'WarehouseOutDetail',
      component: '/warehouse/warehouse-out/detail',
      meta: {
        title: '出库单详情',
        keepAlive: true,
        isHide: true
      }
    }
    // {
    //   path: 'adjust-order',
    //   name: 'AdjustOrder',
    //   component: '/warehouse/adjust-order',
    //   meta: {
    //     title: '调整单',
    //     keepAlive: true
    //   }
    // },
    // {
    //   path: 'adjust-order/add',
    //   name: 'AdjustOrderAdd',
    //   component: '/warehouse/adjust-order/add',
    //   meta: {
    //     title: '添加调整单',
    //     keepAlive: true,
    //     isHide: true
    //   }
    // },
    // {
    //   path: 'adjust-order/edit',
    //   name: 'AdjustOrderEdit',
    //   component: '/warehouse/adjust-order/edit',
    //   meta: {
    //     title: '编辑调整单',
    //     keepAlive: true,
    //     isHide: true
    //   }
    // },
    // {
    //   path: 'adjust-order/detail',
    //   name: 'AdjustOrderDetail',
    //   component: '/warehouse/adjust-order/detail',
    //   meta: {
    //     title: '调整单详情',
    //     keepAlive: true,
    //     isHide: true
    //   }
    // }
  ]
}
