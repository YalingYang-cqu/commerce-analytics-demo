import { computed } from 'vue'
import { storeToRefs } from 'pinia'
import { store } from '@/store'
import { useUserStore } from '@/store/modules/user'
import { getPermission } from '@/api/system-manage'

/**
 * 用法：
 * const { hasAuth } = useAuth()
 * hasAuth('add') // 检查是否拥有新增权限
 * 注意：必须在 setup 或 app.use(pinia) 之后调用，不可在模块顶层调用 useUserStore
 */
export const useAuth = () => {
  const userStore = useUserStore(store)
  const { info } = storeToRefs(userStore)

  // 使用 computed 来响应式地获取权限列表
  const permissionList = computed(() => {
    return info.value?.userFuncPermission?.permissionList || []
  })

  // 异步获取权限（如果需要）
  const fetchPermissions = async () => {
    const needFetch = !info.value || Object.keys(info.value).length === 0
    const { accessToken } = useUserStore(store)
    if (needFetch) {
      if (localStorage.getItem('userInfo') && accessToken) {
        const dataC: any = JSON.parse(localStorage.getItem('userInfo') as string)
        const res = await getPermission({ userId: dataC.userId })
        dataC.userFuncPermission = res.data
        userStore.setUserInfo(dataC)
        localStorage.setItem('userInfo', JSON.stringify(dataC))
      }
    }
  }

  // 立即尝试获取权限（不阻塞）
  fetchPermissions()

  /**
   * 检查是否拥有权限。支持与 v-auth 一致的语法：
   * - 单个: hasAuth('plan:replenishment:edit')
   * - 或逻辑: hasAuth('edit|submit|delete') 任一有即 true
   * - 与逻辑: hasAuth('edit&submit') 全部有才 true
   */
  const hasAuth = (auth: string): boolean => {
    const list = permissionList.value
    if (!auth || !list?.length) return false
    if (auth.includes('|')) {
      const permissions = auth.split('|').map((p) => p.trim())
      return permissions.some((permission) => list.some((item: string) => item === permission))
    }
    if (auth.includes('&')) {
      const permissions = auth.split('&').map((p) => p.trim())
      return permissions.every((permission) => list.some((item: string) => item === permission))
    }
    return list.some((item: string) => item === auth)
  }

  return {
    hasAuth
  }
}
