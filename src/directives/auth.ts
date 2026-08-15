import { getPermission } from '@/api/system-manage'
import { store } from '@/store'
import { useUserStore } from '@/store/modules/user'
import { storeToRefs } from 'pinia'
import { App, Directive, DirectiveBinding, nextTick } from 'vue'

/**
 * 权限指令（后端控制模式可用）
 * 用法：
 * <ElButton v-auth="'add'">单个权限</ElButton>
 * <ElButton v-auth="'add|edit'">或逻辑：add 或 edit 任一存在即显示</ElButton>
 * <ElButton v-auth="'add&edit'">与逻辑：add 和 edit 都存在才显示</ElButton>
 */

interface AuthBinding extends DirectiveBinding {
  value: string
}

async function checkAuthPermission(el: HTMLElement, binding: AuthBinding): Promise<void> {
  const userStore = useUserStore(store)
  const { info } = storeToRefs(userStore)
  const needFetch = !info.value || Object.keys(info.value).length === 0
  const { accessToken } = useUserStore(store)
  let permissionList = info?.value?.userFuncPermission?.permissionList
  if (needFetch) {
    if (localStorage.getItem('userInfo') && accessToken) {
      const dataC: any = JSON.parse(localStorage.getItem('userInfo') as string)
      const res = await getPermission({ userId: dataC.userId })
      dataC.userFuncPermission = res.data
      userStore.setUserInfo(dataC)
      permissionList = res.data?.permissionList
      localStorage.setItem('userInfo', JSON.stringify(dataC))
    }
  }
  // 检查是否有对应的权限标识
  let hasPermission = false
  const permissionValue = binding.value

  // 未配置权限码：不拦截（便于按钮可选绑定 v-auth）
  if (permissionValue === undefined || permissionValue === null || permissionValue === '') {
    return
  }
  if (!permissionList || permissionList.length === 0) {
    hasPermission = false
  } else if (permissionValue.includes('|')) {
    // 或逻辑：只要有一个权限存在即显示
    const permissions = permissionValue.split('|').map((p) => p.trim())
    hasPermission = permissions.some((permission) =>
      permissionList.some((item: string) => item === permission)
    )
  } else if (permissionValue.includes('&')) {
    // 与逻辑：所有权限都存在才显示
    const permissions = permissionValue.split('&').map((p) => p.trim())
    hasPermission = permissions.every((permission) =>
      permissionList.some((item: string) => item === permission)
    )
  } else {
    // 单个权限：原来的逻辑
    hasPermission = permissionList.some((item: string) => item === permissionValue)
  }

  // 如果没有权限，移除元素
  if (!hasPermission) {
    removeElement(el)
  }
}

function removeElement(el: HTMLElement): void {
  // 使用 nextTick 确保 DOM 已经更新完成
  nextTick(() => {
    // 优先使用现代 API el.remove()，如果不存在则使用 removeChild
    if (el.parentNode) {
      // 现代浏览器支持的方法，更可靠
      if (typeof el.remove === 'function') {
        el.remove()
      } else {
        // 降级方案，兼容旧浏览器
        el.parentNode.removeChild(el)
      }
    } else {
      // 如果父节点不存在，尝试隐藏元素
      // 这种情况可能发生在组件根元素还未完全挂载时
      el.style.display = 'none'
    }
  })
}

const authDirective: Directive = {
  mounted: checkAuthPermission,
  updated: checkAuthPermission
}

export function setupAuthDirective(app: App): void {
  app.directive('auth', authDirective)
}
