import { AppRouteRecord } from '@/types/router'
import { router } from '@/router'
import { useLingxingSso } from '@/composables/useLingxingSso'

// 打开外部链接
export const openExternalLink = (link: string) => {
  window.open(link, '_blank')
}

/**
 * 外部操作处理器映射表
 * 根据 externalHandler 名称调用相应的处理函数
 */
const externalActionHandlers: Record<string, () => Promise<boolean>> = {
  lingxingSso: async () => {
    const { handleLingxingSsoLogin } = useLingxingSso()
    return await handleLingxingSsoLogin()
  }
}

/**
 * 菜单跳转
 * @param item 菜单项
 * @param jumpToFirst 是否跳转到第一个子菜单
 * @returns
 */
export const handleMenuJump = async (item: AppRouteRecord, jumpToFirst: boolean = false) => {
  console.log(item, ' item item item')

  // 处理外部操作（不跳转路由）
  const { isExternalAction, externalHandler } = item.meta
  if (isExternalAction && externalHandler) {
    const handler = externalActionHandlers[externalHandler]
    if (handler) {
      await handler()
      return
    }
    console.warn(`未找到外部操作处理器: ${externalHandler}`)
  }

  // 处理外部链接
  const { link, isIframe } = item.meta
  if (link && !isIframe) {
    return openExternalLink(link)
  }

  // 如果不需要跳转到第一个子菜单，或者没有子菜单，直接跳转当前路径
  if (!jumpToFirst || !item.children?.length) {
    return router.push(item.path)
  }

  // 递归查找第一个可见的叶子节点菜单
  const findFirstLeafMenu = (items: AppRouteRecord[]): AppRouteRecord => {
    for (const child of items) {
      if (!child.meta.isHide) {
        return child.children?.length ? findFirstLeafMenu(child.children) : child
      }
    }
    return items[0]
  }

  const firstChild = findFirstLeafMenu(item.children)

  // 如果第一个子菜单是外部链接则打开新窗口
  if (firstChild.meta?.link) {
    return openExternalLink(firstChild.meta.link)
  }

  // 跳转到子菜单路径
  router.push(firstChild.path)
}
