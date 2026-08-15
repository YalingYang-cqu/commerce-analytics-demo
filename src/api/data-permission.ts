/*
 * Portfolio demo
 * @Date: 2025-12-04 16:44:49
 * Company-specific metadata removed
 * @LastEditTime: 2026-02-08 13:42:57
 * @FilePath: src/api/data-permission.ts
 * @Description: 这是默认设置,请设置`customMade`, 打开koroFileHeader查看配置 进行设置: https://github.com/OBKoro1/koro1FileHeader/wiki/%E9%85%8D%E7%BD%AE
 */
import request from '@/utils/http'
import { Api } from '@/types/api/data-permission'

/**
 * 查询数据权限规则列表
 * POST /basic/dataPermission/group/list
 * 用于按条件（名称、成员、分页、排序）获取权限组基础信息列表
 */
export function fetchDataPermGroupList(params: Api.DataPermission.GroupListParams) {
  const USE_MOCK =
    import.meta.env.MODE === 'development' && import.meta.env.VITE_USE_MOCK === 'true'
  if (USE_MOCK) {
    return import('@/mock/user-manage').then((mockApi) => {
      return mockApi.mockFetchDataPermGroupList(params).then((data: any) => ({
        code: 200,
        msg: 'success',
        data: {
          list: data,
          total: data.length,
          current: params.currentPage || 1,
          size: params.pageSize || 20
        }
      }))
    })
  }
  return request.post<Api.DataPermission.PageDto<Api.DataPermission.PermGroupBaseDto>>({
    url: '/basic/dataPermission/group/list',
    data: params
  })
}

/**
 * 新增数据权限规则
 * PUSH /apis/basic/dataPermission/group/save
 * 作用：创建权限组，支持传入成员列表（userList / 更新已存在的权限组基础信息与成员列表
 */
export function saveDataPermGroup(
  data: Partial<Api.DataPermission.PermGroupBaseDto> & { userList?: number[] }
) {
  return request.put<Api.DataPermission.PermGroupBaseDto>({
    url: '/apis/basic/dataPermission/group/saveOrUpdateBase',
    data
  })
}

/**
 * 编辑数据权限规则
 * POST /apis/basic/dataPermission/group/edit
 * 作用：更新已存在的权限组基础信息与成员列表
 */
export function editDataPermGroup(
  data: Partial<Api.DataPermission.PermGroupBaseDto> & { id: number; userList?: number[] }
) {
  return request.post<Api.DataPermission.PermGroupBaseDto>({
    url: '/apis/basic/dataPermission/group/edit',
    data
  })
}

/**
 * 删除数据权限规则
 * GET /apis/basic/dataPermission/group/delete/{id}
 * 作用：按 ID 删除权限组（不可恢复）
 */
export function deleteDataPermGroup(id: number) {
  return request.del<Record<string, any>>({
    url: `/apis/basic/dataPermission/group/deleteBase/${id}`
  })
}

/**
 * 获取数据权限规则详情
 * GET /apis/basic/dataPermission/group/detail/{id}
 * 作用：获取单个权限组完整信息
 */
export function getDataPermGroupDetail(id: number) {
  return request.get<Api.DataPermission.PermGroupBaseDto>({
    url: `/apis/basic/dataPermission/group/detail/${id}`
  })
}

/**
 * 切换数据权限规则状态
 * POST /apis/basic/dataPermission/group/status
 * 作用：启用/禁用权限组（status: 1启用，0禁用）
 */
export function toggleDataPermGroupStatus(id: number, status: number) {
  return request.post<Record<string, any>>({
    url: '/apis/basic/dataPermission/group/status',
    data: { id, status }
  })
}

/**
 * 查看权限组成员
 * POST /basic/dataPermission/group/user/${groupBaseId}
 * 作用:根据权限组基础 ID 查询该权限组下的成员用户 ID 列表
 * @param {number} groupBaseId - 权限组基础ID
 * @returns {Promise<number[]>} 用户ID列表
 */
export function fetchGroupMembers(groupBaseId: number) {
  return request.post<number[]>({
    url: `/apis/basic/dataPermission/group/user/${groupBaseId}`,
    data: { groupBaseId }
  })
}

/**
 * 保存权限组成员配置
 * PUT /basic/dataPermission/group/saveOrUpdateUserByGroupBaseId
 * 作用:根据用户 ID 为其分配或更新所属的权限组。
 */
export function saveGroupMembers(groupBaseId: number, userIdList: number[]) {
  return request.put<Record<string, any>>({
    url: '/apis/basic/dataPermission/group/saveOrUpdateUserByGroupBaseId',
    data: { groupBaseIdList: [groupBaseId], userIdList }
  })
}

/**
 * 查看权限组的权限配置
 * POST /apis/basic/dataPermission/group/config/{groupBaseId}
 * 作用:根据权限组基础 ID 查询该权限组下的权限配置
 */
export function fetchGroupRules(groupBaseId: number) {
  return request.post<any>({
    url: `/apis/basic/dataPermission/group/config/${groupBaseId}`,
    data: { groupBaseId }
  })
}

/**
 * 转换前端权限配置格式为后端期望的格式
 */
function convertConfigToBackendFormat(config: Api.DataPermission.GroupConfigParam): any[] {
  const result: any[] = []

  // 转换店铺权限（ACCOUNT）
  if (config.shopAuth) {
    const { type, shopIdList = [] } = config.shopAuth
    let scopeType = 'ALL_VISIBLE'
    if (type === 'specified') {
      scopeType = 'SPECIFY_VISIBLE'
    } else if (type === 'all') {
      scopeType = 'ALL_VISIBLE'
    }
    result.push({
      permType: 'ACCOUNT',
      resourcesIds: JSON.stringify(shopIdList),
      scopeType
    })
  }

  // 转换产品权限（PRODUCT）
  if (config.productAuth) {
    const { type, productIdList = [], userIdList = [], deptIdList = [] } = config.productAuth
    let scopeType = 'ALL_VISIBLE'
    let resourcesIds = '[]'

    if (type === 'userDept') {
      scopeType = 'OTHER_USER_OWNER_VISIBLE'
      // 将用户ID和部门ID合并（这里需要根据实际后端需求调整）
      // resourcesIds = JSON.stringify([...userIdList, ...deptIdList])
      result.push({
        permType: 'PRODUCT',
        resourcesIds: JSON.stringify(userIdList),
        scopeType: 'OTHER_USER_OWNER_VISIBLE'
      })

      result.push({
        permType: 'PRODUCT',
        resourcesIds: JSON.stringify(deptIdList),
        scopeType: 'OTHER_DEPARTMENT_USER_OWNER_VISIBLE'
      })
    } else {
      if (type === 'all') {
        scopeType = 'ALL_VISIBLE'
      } else if (type === 'owner') {
        scopeType = 'SELF_OWNER_VISIBLE'
      } else if (type === 'specified') {
        scopeType = 'SPECIFY_VISIBLE'
        resourcesIds = JSON.stringify(productIdList)
      } else if (type === 'exclude') {
        scopeType = 'SPECIFY_NOT_VISIBLE'
        resourcesIds = JSON.stringify(productIdList)
      }

      result.push({
        permType: 'PRODUCT',
        resourcesIds,
        scopeType
      })
    }
  }

  // 转换仓库权限（WAREHOUSE）
  if (config.warehouseAuth) {
    const { type, warehouseIdList = [] } = config.warehouseAuth
    let scopeType = 'ALL_VISIBLE'

    if (type === 'all') {
      scopeType = 'ALL_VISIBLE'
    } else if (type === 'owner') {
      scopeType = 'SELF_OWNER_VISIBLE'
    } else if (type === 'specified') {
      scopeType = 'SPECIFY_VISIBLE'
    }

    result.push({
      permType: 'WAREHOUSE',
      resourcesIds: JSON.stringify(warehouseIdList),
      scopeType
    })
  }

  // 转换供应商权限（SUPPLIER）
  if (config.supplierAuth) {
    const { type, supplierIdList = [] } = config.supplierAuth
    let scopeType = 'ALL_VISIBLE'

    if (type === 'all') {
      scopeType = 'ALL_VISIBLE'
    } else if (type === 'owner') {
      scopeType = 'SELF_OWNER_VISIBLE'
    } else if (type === 'specified') {
      scopeType = 'SPECIFY_VISIBLE'
    }

    result.push({
      permType: 'SUPPLIER',
      resourcesIds: JSON.stringify(supplierIdList),
      scopeType
    })
  }

  // 转换单据权限（RECORD）
  if (config.billAuth) {
    const { type, userIdList = [], deptIdList = [] } = config.billAuth
    let scopeType = 'ALL_VISIBLE'

    if (type === 'all') {
      scopeType = 'ALL_VISIBLE'
      result.push({
        permType: 'RECORD',
        resourcesIds: '[]',
        scopeType
      })
    } else if (type === 'owner') {
      scopeType = 'SELF_OWNER_VISIBLE'
      result.push({
        permType: 'RECORD',
        resourcesIds: '[]',
        scopeType
      })
    } else if (type === 'userDept') {
      result.push({
        permType: 'RECORD',
        resourcesIds: JSON.stringify(userIdList),
        scopeType: 'OTHER_USER_OWNER_VISIBLE'
      })
      result.push({
        permType: 'RECORD',
        resourcesIds: JSON.stringify(deptIdList),
        scopeType: 'OTHER_DEPARTMENT_USER_OWNER_VISIBLE'
      })
    }
  }

  return result
}

/**
 * 保存权限组的权限配置
 * PUT /apis/basic/dataPermission/group/saveOrUpdateConfigByGroupBaseId
 * 作用:根据权限组基础 ID 配置或更新该权限组下的权限配置
 */
export function saveGroupRules(groupBaseId: number, config: Api.DataPermission.GroupConfigParam) {
  // 将前端格式转换为后端期望的格式
  const backendConfig = convertConfigToBackendFormat(config)
  return request.put<Record<string, any>>({
    url: `/apis/basic/dataPermission/group/saveOrUpdateConfigByGroupBaseId/${groupBaseId}`,
    data: backendConfig
  })
}

/**
 * 批量分配数据权限组
 * PUT /apis/basic/dataPermission/group/batchAssign
 * 作用：为多个用户批量分配数据权限组，支持覆盖或新增模式
 * @param userIds 用户ID列表
 * @param groupIds 数据权限组ID列表
 * @param updateMethod 更新方式：'overwrite'（覆盖）或 'add'（新增）
 */
export function batchAssignDataPermGroup(
  userIds: number[],
  groupIds: number[]
  // updateMethod: 'overwrite' | 'add' = 'overwrite'
) {
  return request.post<Record<string, any>>({
    url: '/apis/basic/dataPermission/group/saveOrUpdateUserByUserId',
    data: {
      userIdList: userIds,
      groupBaseIdList: groupIds
      // updateMethod: updateMethod === 'overwrite' ? 'overwrite' : 'add'
    }
  })
}

/**
 * 获取用户数据权限配置
 * POST /apis/basic/dataPermission/user/config/{userId}
 * 作用：根据用户ID查询该用户的数据权限配置
 * @param userId 用户ID
 */
export function fetchUserDataPermissionConfig(userId: number) {
  return request.post<any[]>({
    url: `/apis/basic/dataPermission/user/config/${userId}`,
    data: { userId }
  })
}

/**
 * 保存用户数据权限配置
 * PUT /apis/basic/dataPermission/user/saveOrUpdateConfig/{userId}
 * 作用：根据用户ID配置或更新该用户的数据权限配置
 * @param userId 用户ID
 * @param config 权限配置参数（与权限组配置格式相同）
 */
export function saveUserDataPermissionConfig(
  userId: number,
  config: Api.DataPermission.GroupConfigParam
) {
  // 将前端格式转换为后端期望的格式
  const backendConfig = convertConfigToBackendFormat(config)
  return request.put<Record<string, any>>({
    url: `/apis/basic/dataPermission/user/saveOrUpdateConfig/${userId}`,
    data: backendConfig
  })
}

/**
 * 批量保存用户数据权限配置
 * PUT /apis/basic/dataPermission/user/batchSaveOrUpdateConfig
 * 作用：为多个用户批量配置数据权限
 * @param userIds 用户ID列表
 * @param config 权限配置参数（与权限组配置格式相同）
 */
export function batchSaveUserDataPermissionConfig(
  userIds: number[],
  config: Api.DataPermission.GroupConfigParam
) {
  // 将前端格式转换为后端期望的格式
  const backendConfig = convertConfigToBackendFormat(config)
  return request.post<Record<string, any>>({
    url: '/apis/basic/dataPermission/user/saveOrUpdateConfigByUserId',
    data: {
      userIdList: userIds,
      configList: backendConfig
    }
  })
}
