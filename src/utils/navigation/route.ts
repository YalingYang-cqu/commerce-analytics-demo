/**
 * 路由相关工具函数
 */

import { AppRouteRecord } from '@/types'

// 检查是否为 iframe 路由
export function isIframe(url: string): boolean {
  return url.startsWith('/outside/iframe/')
}

/**
 * 验证菜单项是否有效
 * @param menuItem 菜单项
 * @returns 是否为有效菜单项
 */
const isValidMenuItem = (menuItem: AppRouteRecord): boolean => {
  return !!(menuItem.path && menuItem.path.trim() && !menuItem.meta?.isHide)
}

/**
 * 标准化路径格式
 * @param path 路径
 * @returns 标准化后的路径
 */
const normalizePath = (path: string): string => {
  return path.startsWith('/') ? path : `/${path}`
}

/**
 * 递归获取菜单的第一个有效路径（仅返回叶子或可渲染页面路径，不返回仅有子菜单的父级路径，避免首次登录空白页）
 * @param menuList 菜单列表
 * @returns 第一个有效路径，如果没有找到则返回空字符串
 */
export const getFirstMenuPath = (menuList: AppRouteRecord[]): string => {
  if (!Array.isArray(menuList) || menuList.length === 0) {
    return ''
  }

  for (const menuItem of menuList) {
    if (!isValidMenuItem(menuItem)) {
      continue
    }

    // 如果有子菜单，只返回子菜单中的第一个有效路径，不返回当前父路径
    if (menuItem.children?.length) {
      const childPath = getFirstMenuPath(menuItem.children)
      if (childPath) {
        return childPath
      }
      // 无有效子菜单时跳过该项，继续找下一项，避免将父级路径（如 /plan）设为首页导致内容区空白
      continue
    }

    // 无子菜单或为叶子节点：返回当前菜单项的标准化路径
    return normalizePath(menuItem.path!)
  }

  return ''
}

/**
 * 获取菜单中第一个可用路径（含父级），仅在 getFirstMenuPath 为空时作首页回退，避免首页路径为空
 */
export const getFirstAvailablePath = (menuList: AppRouteRecord[]): string => {
  if (!Array.isArray(menuList) || menuList.length === 0) return ''
  for (const menuItem of menuList) {
    if (!isValidMenuItem(menuItem)) continue
    if (menuItem.children?.length) {
      const childPath = getFirstAvailablePath(menuItem.children)
      if (childPath) return childPath
    }
    return normalizePath(menuItem.path!)
  }
  return ''
}
