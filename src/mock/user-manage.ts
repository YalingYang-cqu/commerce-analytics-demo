/*
 * @Description: 用户管理 Mock 数据
 * 用于前端开发和联调
 */

import type { UserListParams, UserItem, UserFormData } from '@/api/user-manage'

// 模拟用户数据
let mockUserList: UserItem[] = [
  {
    id: 1,
    userName: 'admin',
    realName: '管理员',
    userPhone: '13800138000',
    userEmail: 'admin@example.com',
    userGender: '1',
    status: 1,
    deptId: 1,
    deptName: '技术部',
    roleIds: [1, 2],
    roleNames: '超级管理员,系统管理员',
    position: '技术总监',
    employeeNo: 'EMP001',
    createTime: '2024-01-01 10:00:00',
    updateTime: '2024-01-01 10:00:00'
  },
  {
    id: 2,
    userName: 'zhangsan',
    realName: '张三',
    userPhone: '13800138001',
    userEmail: 'zhangsan@example.com',
    userGender: '1',
    status: 1,
    deptId: 2,
    deptName: '产品部',
    roleIds: [3],
    roleNames: '产品经理',
    position: '高级产品经理',
    employeeNo: 'EMP002',
    createTime: '2024-01-02 10:00:00',
    updateTime: '2024-01-02 10:00:00'
  },
  {
    id: 3,
    userName: 'lisi',
    realName: '李四',
    userPhone: '13800138002',
    userEmail: 'lisi@example.com',
    userGender: '0',
    status: 1,
    deptId: 1,
    deptName: '技术部',
    roleIds: [4],
    roleNames: '开发工程师',
    position: '高级开发工程师',
    employeeNo: 'EMP003',
    createTime: '2024-01-03 10:00:00',
    updateTime: '2024-01-03 10:00:00'
  },
  {
    id: 4,
    userName: 'wangwu',
    realName: '王五',
    userPhone: '13800138003',
    userEmail: 'wangwu@example.com',
    userGender: '1',
    status: 0,
    deptId: 3,
    deptName: '运营部',
    roleIds: [5],
    roleNames: '运营专员',
    position: '运营经理',
    employeeNo: 'EMP004',
    createTime: '2024-01-04 10:00:00',
    updateTime: '2024-01-04 10:00:00'
  },
  {
    id: 5,
    userName: 'zhaoliu',
    realName: '赵六',
    userPhone: '13800138004',
    userEmail: 'zhaoliu@example.com',
    userGender: '0',
    status: 1,
    deptId: 4,
    deptName: '财务部',
    roleIds: [6],
    roleNames: '财务专员',
    position: '财务经理',
    employeeNo: 'EMP005',
    createTime: '2024-01-05 10:00:00',
    updateTime: '2024-01-05 10:00:00'
  }
]

// 模拟角色列表
const mockRoleList = [
  { id: 1, roleName: '超级管理员', roleCode: 'SUPER_ADMIN' },
  { id: 2, roleName: '系统管理员', roleCode: 'ADMIN' },
  { id: 3, roleName: '产品经理', roleCode: 'PRODUCT_MANAGER' },
  { id: 4, roleName: '开发工程师', roleCode: 'DEVELOPER' },
  { id: 5, roleName: '运营专员', roleCode: 'OPERATOR' },
  { id: 6, roleName: '财务专员', roleCode: 'FINANCE' },
  { id: 7, roleName: '测试工程师', roleCode: 'TESTER' },
  { id: 8, roleName: 'UI设计师', roleCode: 'DESIGNER' }
]

// 模拟部门列表
const mockDeptList = [
  { id: 1, name: '技术部', parentId: 0, status: 1 },
  { id: 2, name: '产品部', parentId: 0, status: 1 },
  { id: 3, name: '运营部', parentId: 0, status: 1 },
  { id: 4, name: '财务部', parentId: 0, status: 1 },
  { id: 5, name: '人事部', parentId: 0, status: 1 },
  { id: 6, name: '市场部', parentId: 0, status: 0 }
]

// 模拟数据权限组列表
const mockDataPermGroupList = [
  { id: 1, groupName: '全部数据权限', groupDesc: '可查看所有数据' },
  { id: 2, groupName: '部门数据权限', groupDesc: '仅可查看本部门数据' },
  { id: 3, groupName: '个人数据权限', groupDesc: '仅可查看个人数据' },
  { id: 4, groupName: '自定义权限组1', groupDesc: '自定义权限范围' },
  { id: 5, groupName: '自定义权限组2', groupDesc: '自定义权限范围' }
]

// 生成唯一ID
let nextUserId = 6

/**
 * Mock 用户列表查询
 */
export function mockFetchUserList(params: UserListParams) {
  return new Promise<{
    records: UserItem[]
    total: number
    current: number
    size: number
  }>((resolve) => {
    setTimeout(() => {
      let filteredList = [...mockUserList]

      // 按用户名过滤
      if (params.userName) {
        filteredList = filteredList.filter((user) =>
          user.userName.toLowerCase().includes(params.userName!.toLowerCase())
        )
      }

      // 按真实姓名过滤
      if (params.realName) {
        filteredList = filteredList.filter((user) =>
          user.realName?.toLowerCase().includes(params.realName!.toLowerCase())
        )
      }

      // 按手机号过滤
      if (params.userPhone) {
        filteredList = filteredList.filter((user) => user.userPhone.includes(params.userPhone!))
      }

      // 按邮箱过滤
      if (params.userEmail) {
        filteredList = filteredList.filter((user) =>
          user.userEmail?.toLowerCase().includes(params.userEmail!.toLowerCase())
        )
      }

      // 按角色过滤
      if (params.roleIds && params.roleIds.length > 0) {
        filteredList = filteredList.filter((user) =>
          params.roleIds!.some((roleId) => user.roleIds?.includes(Number(roleId)))
        )
      }

      // 按状态过滤
      if (params.statusList && params.statusList.length > 0) {
        filteredList = filteredList.filter((user) =>
          params.statusList!.includes(String(user.status))
        )
      }

      // 按创建时间过滤
      if (params.createTimeStart) {
        filteredList = filteredList.filter(
          (user) => user.createTime && user.createTime >= params.createTimeStart!
        )
      }
      if (params.createTimeEnd) {
        filteredList = filteredList.filter(
          (user) => user.createTime && user.createTime <= params.createTimeEnd!
        )
      }

      // 排序
      if (params.orderBy) {
        filteredList.sort((a, b) => {
          const aVal = (a as any)[params.orderBy!]
          const bVal = (b as any)[params.orderBy!]
          if (params.order === 'desc') {
            return bVal > aVal ? 1 : -1
          }
          return aVal > bVal ? 1 : -1
        })
      }

      // 分页
      const currentPage = params.currentPage || 1
      const pageSize = params.pageSize || 20
      const start = (currentPage - 1) * pageSize
      const end = start + pageSize
      const paginatedList = filteredList.slice(start, end)

      resolve({
        records: paginatedList,
        total: filteredList.length,
        current: currentPage,
        size: pageSize
      })
    }, 300) // 模拟网络延迟
  })
}

/**
 * Mock 获取用户详情
 */
export function mockGetUserDetail(userId: string | number) {
  return new Promise<UserItem>((resolve, reject) => {
    setTimeout(() => {
      const user = mockUserList.find((u) => String(u.id) === String(userId))
      if (user) {
        // 返回完整用户信息，包括数据权限组
        const userDetail = {
          ...user,
          deptIds: user.deptId ? [user.deptId] : [],
          dataPermGroupIds: [1, 2] // 模拟数据权限组
        }
        resolve(userDetail as UserItem)
      } else {
        reject(new Error('用户不存在'))
      }
    }, 200)
  })
}

/**
 * Mock 新增用户
 */
export function mockAddUser(data: UserFormData) {
  return new Promise<{ id: number; msg: string }>((resolve, reject) => {
    setTimeout(() => {
      // 检查用户名是否已存在
      const existsUser = mockUserList.find((u) => u.userName === data.userName)
      if (existsUser) {
        reject(new Error('用户名已存在'))
        return
      }

      // 检查真实姓名是否已存在（如果需要）
      if (data.realName) {
        const existsRealName = mockUserList.find((u) => u.realName === data.realName)
        if (existsRealName) {
          reject(new Error('真实姓名已存在'))
          return
        }
      }

      // 创建新用户
      const newUser: UserItem = {
        id: nextUserId++,
        userName: data.userName,
        realName: data.realName || '',
        userPhone: data.userPhone,
        userEmail: data.userEmail || '',
        userGender: data.userGender || '0',
        status: data.status || 1,
        deptId:
          Array.isArray(data.deptIds) && data.deptIds.length > 0
            ? Number(data.deptIds[0])
            : data.deptId,
        deptName:
          mockDeptList.find(
            (d) =>
              d.id ===
              (Array.isArray(data.deptIds) && data.deptIds.length > 0
                ? Number(data.deptIds[0])
                : data.deptId)
          )?.name || '',
        roleIds: (data.roleIds || data.userRoles || []).map((id) => Number(id)),
        roleNames: (data.roleIds || data.userRoles || [])
          .map((id) => {
            const role = mockRoleList.find((r) => String(r.id) === String(id))
            return role?.roleName || ''
          })
          .filter(Boolean)
          .join(','),
        position: data.position || '',
        employeeNo: data.employeeNo || '',
        createTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-'),
        updateTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      }

      mockUserList.push(newUser)

      resolve({
        id: newUser.id,
        msg: '添加成功'
      })
    }, 500)
  })
}

/**
 * Mock 更新用户
 */
export function mockUpdateUser(data: UserFormData) {
  return new Promise<{ msg: string }>((resolve, reject) => {
    setTimeout(() => {
      if (!data.id) {
        reject(new Error('用户ID不存在'))
        return
      }

      const userIndex = mockUserList.findIndex((u) => String(u.id) === String(data.id))
      if (userIndex === -1) {
        reject(new Error('用户不存在'))
        return
      }

      // 检查用户名是否被其他用户使用
      if (data.userName) {
        const existsUser = mockUserList.find(
          (u) => u.userName === data.userName && String(u.id) !== String(data.id)
        )
        if (existsUser) {
          reject(new Error('用户名已存在'))
          return
        }
      }

      // 检查真实姓名是否被其他用户使用
      if (data.realName) {
        const existsRealName = mockUserList.find(
          (u) => u.realName === data.realName && String(u.id) !== String(data.id)
        )
        if (existsRealName) {
          reject(new Error('真实姓名已存在'))
          return
        }
      }

      // 更新用户信息
      const user = mockUserList[userIndex]
      mockUserList[userIndex] = {
        ...user,
        userName: data.userName || user.userName,
        realName: data.realName || user.realName,
        userPhone: data.userPhone || user.userPhone,
        userEmail: data.userEmail !== undefined ? data.userEmail : user.userEmail,
        userGender: data.userGender || user.userGender,
        status: data.status !== undefined ? data.status : user.status,
        deptId:
          Array.isArray(data.deptIds) && data.deptIds.length > 0
            ? Number(data.deptIds[0])
            : data.deptId || user.deptId,
        deptName:
          mockDeptList.find(
            (d) =>
              d.id ===
              (Array.isArray(data.deptIds) && data.deptIds.length > 0
                ? Number(data.deptIds[0])
                : data.deptId || user.deptId)
          )?.name || user.deptName,
        roleIds: (data.roleIds || data.userRoles || user.roleIds || []).map((id) => Number(id)),
        roleNames: (data.roleIds || data.userRoles || user.roleIds || [])
          .map((id) => {
            const role = mockRoleList.find((r) => String(r.id) === String(id))
            return role?.roleName || ''
          })
          .filter(Boolean)
          .join(','),
        position: data.position !== undefined ? data.position : user.position,
        employeeNo: data.employeeNo !== undefined ? data.employeeNo : user.employeeNo,
        updateTime: new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
      }

      resolve({
        msg: '更新成功'
      })
    }, 500)
  })
}

/**
 * Mock 删除用户
 */
export function mockDeleteUser(userId: string | number) {
  return new Promise<{ msg: string }>((resolve) => {
    setTimeout(() => {
      mockUserList = mockUserList.filter((u) => String(u.id) !== String(userId))
      resolve({ msg: '删除成功' })
    }, 300)
  })
}

/**
 * Mock 批量删除用户
 */
export function mockBatchDeleteUser(userIds: (string | number)[]) {
  return new Promise<{ msg: string }>((resolve) => {
    setTimeout(() => {
      mockUserList = mockUserList.filter((u) => !userIds.includes(u.id))
      resolve({ msg: '批量删除成功' })
    }, 300)
  })
}

/**
 * Mock 更新用户状态
 */
export function mockUpdateUserStatus(userId: string | number, status: string | number) {
  return new Promise<{ msg: string }>((resolve, reject) => {
    setTimeout(() => {
      const user = mockUserList.find((u) => String(u.id) === String(userId))
      if (user) {
        user.status = Number(status)
        user.updateTime = new Date().toLocaleString('zh-CN', { hour12: false }).replace(/\//g, '-')
        resolve({ msg: '状态更新成功' })
      } else {
        reject(new Error('用户不存在'))
      }
    }, 300)
  })
}

/**
 * Mock 获取角色列表
 */
export function mockFetchRoleList() {
  return new Promise<typeof mockRoleList>((resolve) => {
    setTimeout(() => {
      resolve(mockRoleList)
    }, 200)
  })
}

/**
 * Mock 获取部门列表
 */
export function mockFetchDeptList() {
  return new Promise<typeof mockDeptList>((resolve) => {
    setTimeout(() => {
      // 只返回启用的部门
      const enabledDepts = mockDeptList.filter((d) => d.status === 1)
      resolve(enabledDepts)
    }, 200)
  })
}

/**
 * Mock 获取数据权限组列表
 */
export function mockFetchDataPermGroupList(_params?: {
  currentPage?: number
  pageSize?: number
  hasCount?: boolean
}) {
  console.log(_params)
  return new Promise<typeof mockDataPermGroupList>((resolve) => {
    setTimeout(() => {
      resolve(mockDataPermGroupList)
    }, 200)
  })
}

/**
 * Mock 批量更新用户状态
 */
export function mockBatchUpdateUserStatus(userIds: (string | number)[], status: string | number) {
  return new Promise<{ msg: string }>((resolve) => {
    setTimeout(() => {
      mockUserList.forEach((user) => {
        if (userIds.includes(user.id)) {
          user.status = Number(status)
          user.updateTime = new Date()
            .toLocaleString('zh-CN', { hour12: false })
            .replace(/\//g, '-')
        }
      })
      resolve({ msg: '批量更新状态成功' })
    }, 300)
  })
}

/**
 * Mock 批量分配角色
 */
export function mockBatchAssignRoles(userIds: (string | number)[], roleIds: (string | number)[]) {
  return new Promise<{ msg: string }>((resolve) => {
    setTimeout(() => {
      mockUserList.forEach((user) => {
        if (userIds.includes(user.id)) {
          user.roleIds = roleIds.map((id) => Number(id))
          user.roleNames = roleIds
            .map((id) => {
              const role = mockRoleList.find((r) => String(r.id) === String(id))
              return role?.roleName || ''
            })
            .filter(Boolean)
            .join(',')
          user.updateTime = new Date()
            .toLocaleString('zh-CN', { hour12: false })
            .replace(/\//g, '-')
        }
      })
      resolve({ msg: '批量分配角色成功' })
    }, 300)
  })
}

/**
 * Mock 批量分配部门
 */
export function mockBatchAssignDept(userIds: (string | number)[], deptId: number) {
  return new Promise<{ msg: string }>((resolve) => {
    setTimeout(() => {
      const dept = mockDeptList.find((d) => d.id === deptId)
      mockUserList.forEach((user) => {
        if (userIds.includes(user.id)) {
          user.deptId = deptId
          user.deptName = dept?.name || ''
          user.updateTime = new Date()
            .toLocaleString('zh-CN', { hour12: false })
            .replace(/\//g, '-')
        }
      })
      resolve({ msg: '批量分配部门成功' })
    }, 300)
  })
}
