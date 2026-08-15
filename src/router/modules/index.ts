import { AppRouteRecord } from '@/types/router'
import { resultRoutes } from './result'
import { exceptionRoutes } from './exception'
// import { iframeRoutes } from './frame'
import { userCenterRoutes } from './userCenter'
import { purchaseRoutes } from './purchase'
import { logisticsRoutes } from './logistics'
import { financeRoutes } from './finance'
import { inventoryRoutes } from './inventory'
import { downloadCenterRoutes } from './download-center'
import { saleRoutes } from './sale'
// import { lingxingRoutes } from './lingxing'
/**
 * 导出所有模块化路由
 * 一级侧边栏顺序：产品、销售、计划、采购、仓库、物流、财务、基础；其后为隐藏/辅助模块；领星固定最后（meta.order + menuStore 排序）
 */
export const routeModules: AppRouteRecord[] = [
  purchaseRoutes,
  logisticsRoutes,
  inventoryRoutes,
  financeRoutes,
  resultRoutes,
  exceptionRoutes,
  downloadCenterRoutes,
  userCenterRoutes,
  saleRoutes
  // lingxingRoutes
]
