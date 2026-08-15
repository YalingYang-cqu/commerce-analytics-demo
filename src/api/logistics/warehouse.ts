/*
 * Portfolio demo
 * @Date: 2025-12-21 22:26:04
 * Company-specific metadata removed
 * @LastEditTime: 2026-02-10 14:03:30
 * @FilePath: src/api/logistics/warehouse.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from '@/utils/http'

// 仓库分页列表
export function warehousePageList(params: any) {
  return request.post({
    url: `/basic/warehouseInfo/page`,
    data: params
  })
}
// 仓库所有
export function warehousePageAll(params: any) {
  return request.post({
    url: `/basic/warehouseInfo/pageAll`,
    data: params
  })
}

// 新增仓库
export function saveWarehouse(data: any) {
  return request.post({
    url: `/basic/warehouseInfo/save`,
    data
  })
}

// 编辑仓库
export function editWarehouse(data: any) {
  return request.post({
    url: `/basic/warehouseInfo/update`,
    data
  })
}

// 删除仓库
export function deleteWarehouse(params: any) {
  return request.get({
    url: `/basic/warehouseInfo/delete/${params.id}`
  })
}

// 获取仓库详情
export function getWarehouseById(id: number | string) {
  return request.get({
    url: `/basic/warehouseInfo/getById/${id}`
  })
}

// 改变仓库状态
export function changeWarehouseStatus(params: any) {
  return request.post({
    url: `/basic/warehouseInfo/statusChange`,
    params
  })
}

// 导出仓库
export function exportWarehouse(params: any) {
  return request.exportPost({
    url: `/basic/warehouseInfo/export`,
    params
  })
}

// 获取供应商信息
export function getSupplierInfo(params: any) {
  return request.get({
    url: `/basic/warehouseInfo/getSupplierInfo`,
    params
  })
}
