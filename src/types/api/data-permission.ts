/*
 * Portfolio demo
 * @Date: 2025-12-04 16:44:41
 * Company-specific metadata removed
 * @LastEditTime: 2025-12-05 14:35:44
 * @FilePath: src/types/api/data-permission.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
/* eslint-disable @typescript-eslint/no-namespace */
export namespace Api {
  export namespace DataPermission {
    export interface GroupListParams {
      currentPage: number
      pageSize: number
      hasCount?: boolean
      name?: string // 规则名称（模糊查询）
      groupDesc?: string // 规则描述（模糊查询）
      orderBy?: string
      userList?: number[]
    }

    export interface PermGroupBaseDto {
      id: number
      groupName: string
      groupDesc?: string
      status?: number
      users?: string
      userList?: number[]
      createBy?: string
      createTime?: string
      updateBy?: string
      updateTime?: string
    }

    export interface PageDto<T> {
      dtoList: T[]
      total: number
      count?: number
      msg?: string
      code?: number
      success?: boolean
    }

    export interface MemberOption {
      id: number
      name: string
    }

    export interface RuleItem {
      id?: number
      groupId: number
      resource: string
      field: string
      operator: string
      value: string
      effect?: string
    }

    // 权限配置相关类型
    export interface GroupConfigDto {
      shopAuth?: ShopAuthDto
      productAuth?: ProductAuthDto
      warehouseAuth?: WarehouseAuthDto
      supplierAuth?: SupplierAuthDto
      billAuth?: BillAuthDto
    }

    export interface GroupConfigParam {
      shopAuth?: ShopAuthDto
      productAuth?: ProductAuthDto
      warehouseAuth?: WarehouseAuthDto
      supplierAuth?: SupplierAuthDto
      billAuth?: BillAuthDto
    }

    // 店铺权限
    export interface ShopAuthDto {
      type?: 'all' | 'specified' // all-全部可见, specified-指定店铺
      shopIdList?: number[]
    }

    // 产品权限
    export interface ProductAuthDto {
      type?: 'all' | 'owner' | 'userDept' | 'specified' | 'exclude'
      // all-全部可见, owner-仅负责产品, userDept-指定用户部门, specified-指定产品, exclude-排除产品
      productIdList?: number[]
      userIdList?: number[]
      deptIdList?: number[]
    }

    // 仓库权限
    export interface WarehouseAuthDto {
      type?: 'all' | 'owner' | 'specified' // all-全部可见, owner-仅负责仓库, specified-指定仓库
      warehouseIdList?: number[]
    }

    // 供应商权限
    export interface SupplierAuthDto {
      type?: 'all' | 'owner' | 'specified' // all-全部可见, owner-仅负责供应商, specified-指定供应商
      supplierIdList?: number[]
    }

    // 单据权限
    export interface BillAuthDto {
      type?: 'all' | 'owner' | 'userDept' // all-全部可见, owner-仅负责单据, userDept-指定用户部门
      userIdList?: number[]
      deptIdList?: number[]
    }
  }
}
