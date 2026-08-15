import { defineStore } from 'pinia'
import { ref } from 'vue'
import { AppRouteRecord } from '@/types/router'
import { getFirstMenuPath, getFirstAvailablePath } from '@/utils'
import { HOME_PAGE_PATH } from '@/router'

/**
 * 菜单状态管理
 * 管理应用的菜单列表、首页路径、菜单宽度和动态路由移除函数
 */
export const useMenuStore = defineStore('menuStore', () => {
  /** 首页路径 */
  const homePath = ref(HOME_PAGE_PATH)
  /** 菜单列表 */
  const menuList = ref<AppRouteRecord[]>([])
  /** 菜单宽度 */
  const menuWidth = ref('')
  /** 存储路由移除函数的数组 */
  const removeRouteFns = ref<(() => void)[]>([])

  /**
   * 设置菜单列表
   * @param list 菜单路由记录数组
   */
  const setMenuList = (list: AppRouteRecord[]) => {
    // 外部系统入口始终排在最后
    const sortedList = [...list].sort((a, b) => {
      const aIsExternal = a.path === '/external-system' || a.name === 'ExternalSystem'
      const bIsExternal = b.path === '/external-system' || b.name === 'ExternalSystem'
      if (aIsExternal && !bIsExternal) return 1
      if (!aIsExternal && bIsExternal) return -1
      // 使用order属性排序（如果存在）
      const aOrder = (a.meta?.order as number) ?? 0
      const bOrder = (b.meta?.order as number) ?? 0
      return aOrder - bOrder
    })
    menuList.value = sortedList
    // 优先使用叶子路径，避免将仅有子菜单的父路径（如 /plan）设为首页导致内容区空白；无叶子时用首个可用路径回退
    const firstLeaf = getFirstMenuPath(sortedList)
    setHomePath(HOME_PAGE_PATH || firstLeaf || getFirstAvailablePath(sortedList))
  }

  /**
   * 获取首页路径
   * @returns 首页路径字符串
   */
  const getHomePath = () => homePath.value

  /**
   * 设置主页路径
   * @param path 主页路径
   */
  const setHomePath = (path: string) => {
    homePath.value = path
  }

  /**
   * 添加路由移除函数
   * @param fns 要添加的路由移除函数数组
   */
  const addRemoveRouteFns = (fns: (() => void)[]) => {
    removeRouteFns.value.push(...fns)
  }

  /**
   * 移除所有动态路由
   * 执行所有存储的路由移除函数并清空数组
   */
  const removeAllDynamicRoutes = () => {
    removeRouteFns.value.forEach((fn) => fn())
    removeRouteFns.value = []
  }

  /**
   * 清空路由移除函数数组
   */
  const clearRemoveRouteFns = () => {
    removeRouteFns.value = []
  }

  return {
    menuList,
    menuWidth,
    removeRouteFns,
    setMenuList,
    getHomePath,
    setHomePath,
    addRemoveRouteFns,
    removeAllDynamicRoutes,
    clearRemoveRouteFns
  }
})
