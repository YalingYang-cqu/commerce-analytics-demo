/**
 * Mock 模式下的权限种子。
 *
 * 作用：
 * 1. 菜单过滤（前端控制模式 processFrontendMenu 用 permissionList 当作 roles）——
 *    必须包含目标菜单及其父级的 meta.roles，菜单才会显示。
 * 2. v-auth 指令——页面根节点与操作按钮的权限码，缺失会被指令移除 DOM。
 *
 * 因此这里同时列出「菜单角色码」与「元素权限码」，覆盖采购/物流/SKU/销量/SC订单利润等核心页面。
 */

/** 菜单角色码（对应各 router/modules 的 meta.roles，父级 + 子级都要有） */
const MENU_ROLES: string[] = [
  // 采购管理
  'purchase',
  'purchase:batchCost',
  // 物流管理（父级 roles 为子权限集合，含任一即显示）
  'logistics:batchCost',
  'logistics:provider',
  'logistics:method',
  'logistics:channel',
  'logistics:waybill',
  'logistics:inquiry',
  'logistics:customs-template',
  'logistics:customs-declaration',
  // 成本中心
  'inventory',
  'inventory:batchBalance',
  'inventory:skuCostFlow',
  // 财务/成本
  'finance',
  'finance:skuCost',
  'finance:scProfit',
  // 销量统计（sale.ts 与 sale-analysis.ts 两套模块都指向同一页面，均放行）
  'sale',
  'sale:saleStatics',
  'saleAnalysis',
  'saleAnalysis:saleStatics'
]

/** 元素权限码（v-auth / exportAuth） */
const ELEMENT_PERMISSIONS: string[] = [
  // 采购批次成本
  'purchase:batchCost:view',
  'purchase:batchCost:export',
  'purchase:batchCost:detailExport',
  // 物流批次成本
  'logistics:batchCost:view',
  'logistics:batchCost:export',
  'logistics:batchCost:detailExport',
  // 批次结存
  'inventory:batchBalance:view',
  'inventory:batchBalance:export',
  'inventory:batchBalance:detailExport',
  'inventory:batchBalance:ledger',
  // 库存成本流水
  'inventory:skuCostFlow:view',
  'inventory:skuCostFlow:export',
  'inventory:skuCostFlow:detailExport',
  'inventory:skuCostFlow:recheck',
  // SKU 综合成本
  'finance:skuCost:view',
  'finance:skuCost:export',
  'finance:skuCost:batchDetailExport',
  'finance:skuCost:costDetailExport',
  // SC 订单利润
  'finance:scProfit:view',
  'finance:scProfit:export',
  'finance:scProfit:review',
  'finance:scProfit:saveScenario',
  // 销量统计
  'sale:saleStatics:view',
  'sale:saleStatics:export',
  'saleAnalysis:saleStatics:view',
  'saleAnalysis:saleStatics:export'
]

/** 合并去重后的完整权限列表 */
export const mockPermissionList: string[] = [...new Set([...MENU_ROLES, ...ELEMENT_PERMISSIONS])]

/** 用户功能权限结构（与后端 get-user-permission 返回对齐：permissionList 字段） */
export const mockUserFuncPermission = {
  permissionList: mockPermissionList
}

/** Mock 登录用户信息（前端控制模式自动登录时注入） */
export const mockUserInfo = {
  userId: 0,
  userName: '本地联调',
  realName: '本地联调',
  avatar: '',
  userFuncPermission: mockUserFuncPermission
}

/** Mock 模式下的伪 Token（仅用于让字典/权限等依赖 token 的启动逻辑得以触发） */
export const MOCK_ACCESS_TOKEN = 'mock-access-token'
