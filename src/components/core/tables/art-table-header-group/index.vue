<!-- 表格头部，包含表格大小、刷新、全屏、列设置、其他设置 -->
<template>
  <div class="table-header" id="art-table-header">
    <div class="left">
      <slot name="left"></slot>
    </div>
    <div class="right">
      <slot name="right"></slot>
      <div
        v-if="showSearchBar != null"
        class="btn"
        @click="search"
        :class="{ active: showSearchBar }"
      >
        <i class="iconfont-sys">&#xe6cb;</i>
      </div>
      <!-- 刷新 -->
      <div
        v-if="shouldShow('refresh')"
        class="btn"
        @click="refresh"
        :class="{ loading: loading && isManualRefresh }"
      >
        <i class="iconfont-sys">&#xe615;</i>
      </div>
      <!-- 导出：传入 exportAuth 时需有对应权限才显示 -->
      <div
        v-if="shouldShow('down') && (exportAuth ? hasAuth(exportAuth) : true)"
        class="btn"
        @click="exportAction"
      >
        <span :class="{ loading: true }" class="btn" v-if="downLoading">
          <el-icon><Loading /></el-icon
        ></span>

        <i class="iconfont-custom" v-else>&#xe665;</i>
      </div>
      <MkTableFilterDrag
        v-if="shouldShow('columnsNew')"
        :setting="tableSettingState"
        :defaultSetting="defaultTableSetting"
        :tableName="tableName"
        :groups="groups"
        :checkbox-columns="checkboxColumns"
        @draggableChange="handleDraggableChange"
      />
      <!-- 表格区域全屏 -->
      <div
        v-if="shouldShow('fullscreen')"
        class="btn"
        role="button"
        tabindex="0"
        :title="isFullScreen ? '退出全屏（Esc）' : '全屏查看'"
        :aria-label="isFullScreen ? '退出全屏' : '全屏查看'"
        :class="{ active: isFullScreen }"
        @click="toggleFullScreen"
        @keydown.enter.space.prevent="toggleFullScreen"
      >
        <i v-if="isFullScreen" class="iconfont-sys">&#xe62d;</i>
        <i v-else class="iconfont-sys">&#xe8ce;</i>
      </div>
      <!-- 其他设置 -->
      <ElPopover v-if="shouldShow('settings')" placement="bottom" trigger="click">
        <template #reference>
          <div class="btn">
            <i class="iconfont-sys" style="font-size: 17px">&#xe72b;</i>
          </div>
        </template>
        <div>
          <ElCheckbox v-if="showZebra" v-model="isZebra" :value="true">{{
            t('table.zebra')
          }}</ElCheckbox>
          <ElCheckbox v-if="showBorder" v-model="isBorder" :value="true">{{
            t('table.border')
          }}</ElCheckbox>
          <ElCheckbox v-if="showHeaderBackground" v-model="isHeaderBackground" :value="true">{{
            t('table.headerBackground')
          }}</ElCheckbox>
        </div>
      </ElPopover>
    </div>
  </div>
</template>

<script lang="ts" setup>
  import { computed, ref, watch, onMounted, onUnmounted } from 'vue'
  import { storeToRefs } from 'pinia'
  import { store } from '@/store'
  import { useTableStore } from '@/store/modules/table'
  import { useI18n } from 'vue-i18n'
  import type { ColumnOption } from '@/types/component'
  import { getColumnKey, normalizeColumnKey } from '@/composables/useTableColumns'
  import { pubBlobDownLoad } from '@/utils/common-util'
  import { Loading } from '@element-plus/icons-vue'
  import { TableSettingItem } from '@/views/purchase/supplier/index.vue'
  import { useAuth } from '@/composables/useAuth'
  import { ElMessageBox } from 'element-plus'
  import { useRouter } from 'vue-router'
  import MkTableFilterDrag from './mk-table-filter-drag/index.vue'
  import { navigateToMainAppPage } from '@/utils/navigation'

  const router = useRouter()
  defineOptions({ name: 'ArtTableHeaderGroup' })
  const { hasAuth } = useAuth()

  /** 分组定义 */
  interface GroupOption {
    key: string
    title: string
    color?: string
  }

  const { t } = useI18n()
  interface Props {
    /** 斑马纹 */
    showZebra?: boolean
    /** 边框 */
    showBorder?: boolean
    /** 表头背景 */
    showHeaderBackground?: boolean
    /** 全屏 class */
    fullClass?: string
    /** 组件布局，子组件名用逗号分隔 */
    layout?: string
    /** 加载中 */
    loading?: boolean
    /** 搜索栏显示状态 */
    showSearchBar?: boolean
    updateColumn?: any
    resetColumns?: (() => void) | undefined
    exportApi?: any
    exportParams?: any
    tableName?: any
    exportAuth?: any
    asyncExport?: boolean
    /** 分组定义，透传给分组列设置弹窗 */
    groups?: GroupOption[]
    /** 列设置弹窗左侧勾选区列数：2 或 3，默认 2 */
    checkboxColumns?: 2 | 3
  }

  const props = withDefaults(defineProps<Props>(), {
    showZebra: true,
    showBorder: true,
    showHeaderBackground: true,
    fullClass: 'art-page-view',
    layout: 'search,refresh,size,fullscreen,columns',
    showSearchBar: undefined,
    updateColumn: undefined,
    resetColumns: undefined,
    tableName: undefined,
    groups: () => [],
    checkboxColumns: 2
  })
  const columns = defineModel<ColumnOption[]>('columns', {
    required: false,
    default: () => []
  })

  const emit = defineEmits<{
    (e: 'refresh'): void
    (e: 'search'): void
    (e: 'update:showSearchBar', value: boolean): void
  }>()

  const tableStore = useTableStore(store)
  const { isZebra, isBorder, isHeaderBackground } = storeToRefs(tableStore)

  /** 解析 layout 属性，转换为数组 */
  const layoutItems = computed(() => {
    return props.layout.split(',').map((item) => item.trim())
  })

  /**
   * 检查组件是否应该显示
   * @param componentName 组件名称
   * @returns 是否显示
   */
  const shouldShow = (componentName: string) => {
    return layoutItems.value.includes(componentName)
  }

  /**
   * 拖拽移动事件处理 - 防止固定列位置改变
   * @param evt move事件对象
   * @returns 是否允许移动
   */

  /** 搜索事件处理 */
  const search = () => {
    // 切换搜索栏显示状态
    emit('update:showSearchBar', !props.showSearchBar)
    emit('search')
  }

  /** 刷新事件处理 */
  const refresh = () => {
    isManualRefresh.value = true
    emit('refresh')
  }
  const downLoading = ref<boolean>(false)
  const exportAction = async () => {
    downLoading.value = true
    if (props.exportApi) {
      // 确保 exportParams 正确传递，如果是 computed 则解包
      const params =
        typeof props.exportParams === 'function'
          ? props.exportParams()
          : props.exportParams || { currentPage: 1, pageSize: 10000 }
      try {
        const res = await props.exportApi(params)
        downLoading.value = false
        if (!props?.asyncExport) {
          pubBlobDownLoad(res)
        } else {
          ElMessageBox.confirm('<span style="font-size: 14px">任务创建成功!</span>', '提示', {
            confirmButtonText: '跳转到下载中心',
            cancelButtonText: '关闭',
            type: 'success',
            dangerouslyUseHTMLString: true
          })
            .then(() => {
              // 独立运行（非 micro-app 子应用）走本应用路由，否则跳主应用下载中心
              if (window.__MICRO_APP_ENVIRONMENT__) {
                navigateToMainAppPage('/download-center')
              } else {
                router.push('/download-center')
              }
            })
            .catch(() => {
              // 取消删除
            })
        }
      } catch (e) {
        console.log(e)
        downLoading.value = false
      }
    }
  }
  /**
   * 表格大小变化处理
   * @param command 表格大小枚举值
   */
  // const handleTableSizeChange = (command: TableSizeEnum) => {
  //   useTableStore().setTableSize(command)
  // }

  /** 是否手动点击刷新 */
  const isManualRefresh = ref(false)

  /** 加载中 */
  const isFullScreen = ref(false)

  /** 保存原始的 overflow 样式，用于退出全屏时恢复 */
  const originalOverflow = ref('')

  /**
   * 切换全屏状态
   * 进入全屏时会隐藏页面滚动条，退出时恢复原状态
   */
  const toggleFullScreen = () => {
    const el = document.querySelector(`.${props.fullClass}`)
    if (!el) return

    isFullScreen.value = !isFullScreen.value

    if (isFullScreen.value) {
      // 进入全屏：保存原始样式并隐藏滚动条
      originalOverflow.value = document.body.style.overflow
      document.body.style.overflow = 'hidden'
      el.classList.add('el-full-screen')
      tableStore.setIsFullScreen(true)
    } else {
      // 退出全屏：恢复原始样式
      document.body.style.overflow = originalOverflow.value
      el.classList.remove('el-full-screen')
      tableStore.setIsFullScreen(false)
    }
  }

  /**
   * ESC键退出全屏的事件处理器
   * 需要保存引用以便在组件卸载时正确移除监听器
   */
  const handleEscapeKey = (e: KeyboardEvent) => {
    if (e.key === 'Escape' && isFullScreen.value) {
      toggleFullScreen()
    }
  }

  /** 组件挂载时注册全局事件监听器 */
  onMounted(() => {
    document.addEventListener('keydown', handleEscapeKey)
  })

  /** 组件卸载时清理资源 */
  onUnmounted(() => {
    // 移除事件监听器
    document.removeEventListener('keydown', handleEscapeKey)

    // 如果组件在全屏状态下被卸载，恢复页面滚动状态
    if (isFullScreen.value) {
      document.body.style.overflow = originalOverflow.value
      const el = document.querySelector(`.${props.fullClass}`)
      if (el) {
        el.classList.remove('el-full-screen')
      }
      tableStore.setIsFullScreen(false)
    }
  })
  // 自定义列2
  const tableSettingState = ref<TableSettingItem[]>([])
  const buildSettingFromColumns = (cols: any[]): TableSettingItem[] =>
    (cols || []).map((c: any) => {
      // 列定义写 checked:false 时默认不勾选（不显示），其余默认勾选
      const visible = c.checked !== false
      return {
        prop: getColumnKey(c) ?? c.prop ?? c.label,
        name: c.label ?? c.name,
        group: c.group,
        width: c.width,
        minWidth: c.minWidth,
        fixed: c.fixed,
        sortable: !!c.sortable,
        showOverflowTooltip: false,
        isNotSlot: c.prop !== 'operation',
        showCol: visible,
        // 供 MkTableFilterDrag 「恢复默认」时还原默认勾选状态
        defaultShowCol: visible
      }
    })
  // watch(
  //   () => columns.value,
  //   (newCols) => {
  //     tableSettingState.value = buildSettingFromColumns(newCols || [])
  //   },
  //   { immediate: true }
  // )
  /** 可进入列配置的列：排除 hide / hideInSetting */
  const getSettingColumns = (cols: any[] | undefined) =>
    (cols || []).filter((v: any) => !v.hide && !v.hideInSetting)

  const initialCols = getSettingColumns(columns.value)
  tableSettingState.value = buildSettingFromColumns(initialCols)
  /** 初始列配置（含顺序），用于「恢复默认」时还原排序 */
  const defaultTableSetting = ref(JSON.parse(JSON.stringify(tableSettingState.value)))
  // 列异步加载时，首次有列数据时写入默认配置与表头状态，保证恢复默认有正确顺序
  watch(
    () => getSettingColumns(columns.value),
    (filtered) => {
      if (filtered.length > 0) {
        if (defaultTableSetting.value.length === 0) {
          defaultTableSetting.value = buildSettingFromColumns(filtered)
        }
        if (tableSettingState.value.length === 0) {
          tableSettingState.value = buildSettingFromColumns(filtered)
        }
      }
    },
    { immediate: true }
  )
  // const handleShowItemChange = (event: any) => {
  //   const resetList = event?.resetList
  //   if (Array.isArray(resetList) && resetList.length > 0) {
  //     tableSettingState.value = resetList as TableSettingItem[]
  //     const colByKey = new Map<string, ColumnOption<any>>()
  //     columns.value?.forEach((col: any) => {
  //       const key = getColumnKey(col) ?? col.prop ?? col.label ?? col.type
  //       if (key != null) colByKey.set(String(key), col)
  //     })
  //     const ordered: ColumnOption<any>[] = []
  //     resetList.forEach((item: any) => {
  //       const rawKey = item.prop ?? item.name
  //       if (rawKey == null) return
  //       const key = normalizeColumnKey(rawKey) ?? String(rawKey)
  //       const col = colByKey.get(key)
  //       if (col) {
  //         ordered.push({
  //           ...col,
  //           checked: !!item.showCol,
  //           ...(item.width != null && { width: item.width }),
  //           ...(item.fixed != null && { fixed: item.fixed })
  //         })
  //         colByKey.delete(key)
  //       }
  //     })
  //     columns.value?.forEach((col: any) => {
  //       const key = getColumnKey(col) ?? col.prop ?? col.label ?? col.type
  //       if (key != null && colByKey.has(String(key))) ordered.push({ ...col })
  //     })
  //     columns.value = ordered
  //     return
  //   }
  //   const p = event?.pItem
  //   if (!p) return
  //   const pKey = normalizeColumnKey(p.prop) ?? p.prop
  //   const idx = tableSettingState.value.findIndex(
  //     (i) => (normalizeColumnKey(i.prop) ?? i.prop) === pKey
  //   )
  //   if (idx !== -1) tableSettingState.value[idx].showCol = !!p.showCol
  //   columns.value = tableSettingState.value.map((v: any) => ({ ...v, checked: v.showCol }))
  // }

  const handleDraggableChange = (event: any) => {
    const list = event?.list
    if (!Array.isArray(list) || !list.length) return
    tableSettingState.value = list as TableSettingItem[]
    // 按 list 的新顺序重排原有列，使用 getColumnKey 与 ArtTable/baseColumns 保持一致，保证列顺序实时生效
    const colByKey = new Map<string, ColumnOption<any>>()
    columns.value?.forEach((col: any) => {
      const key = getColumnKey(col) ?? col.prop ?? col.label ?? col.type
      if (key != null) colByKey.set(String(key), col)
    })
    const ordered: ColumnOption<any>[] = []
    list.forEach((item: any) => {
      const rawKey = item.prop ?? item.name
      if (rawKey == null) return
      const key = normalizeColumnKey(rawKey) ?? String(rawKey)
      const col = colByKey.get(key)
      if (col) {
        ordered.push({
          ...col,
          checked: !!item.showCol,
          ...(item.width != null && { width: item.width }),
          ...(item.fixed != null && { fixed: item.fixed })
        })
        colByKey.delete(key)
      }
    })
    // 未在 list 中的列（如 hide / hideInSetting）按原顺序追加到末尾
    columns.value?.forEach((col: any) => {
      const key = getColumnKey(col) ?? col.prop ?? col.label ?? col.type
      if (key != null && colByKey.has(String(key))) ordered.push({ ...col })
    })
    columns.value = ordered
  }
</script>

<style lang="scss" scoped>
  :deep(.table-size-btn-item) {
    .el-dropdown-menu__item {
      margin-bottom: 3px !important;
    }

    &:last-child {
      .el-dropdown-menu__item {
        margin-bottom: 0 !important;
      }
    }
  }

  :deep(.is-selected) {
    background-color: rgba(var(--art-gray-200-rgb), 0.8) !important;
  }

  .table-header {
    display: flex;
    justify-content: space-between;
    margin-bottom: 14px;

    .left {
      display: flex;
      flex-wrap: wrap;
      gap: 10px 0;
    }

    .right {
      display: flex;
      align-items: center;

      .btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 32px;
        height: 32px;
        margin-left: 8px;
        color: var(--art-gray-700);
        cursor: pointer;
        background-color: rgba(var(--art-gray-200-rgb), 0.8);
        border-radius: 6px;
        transition: color 0.3s;
        transition: all 0.3s;

        i {
          font-size: 16px;
          color: var(--art-gray-700);
          user-select: none;
        }

        &:hover {
          background-color: rgba(var(--art-gray-300-rgb), 0.75);

          i {
            color: var(--art-gray-800);
          }
        }

        &.loading {
          i {
            color: var(--art-gray-600);
            animation: loading-spin 1s linear infinite;
          }
        }

        &.active {
          background-color: var(--el-color-primary);

          i {
            color: #fff;
          }

          &:hover {
            background-color: var(--el-color-primary-light-3);

            i {
              color: #fff;
            }
          }
        }
      }
    }
  }

  :deep(.column-option-sub-title) {
    display: block;
    padding: 6px 0;
    font-size: 12px;
    color: rgb(0 0 0 / 65%);
  }

  :deep(.column-option) {
    display: flex;
    align-items: center;

    .drag-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      height: 18px;
      margin-right: 8px;
      color: var(--art-gray-500);
      cursor: move;

      i {
        font-size: 18px;
      }

      &.disabled {
        color: var(--art-gray-300);
        cursor: default;
      }
    }

    .el-checkbox {
      flex: 1;
      min-width: 0;

      .el-checkbox__label {
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    &.column-option {
      .lock-item {
        visibility: hidden;
      }

      &:hover {
        .lock-item {
          visibility: visible;
        }
      }

      .el-button {
        padding: 8px 10px;
        color: #5d87ff;
      }
    }
  }

  @media (max-width: $device-phone) {
    .table-header {
      flex-direction: column;

      .right {
        display: flex;
        justify-content: flex-end;
        margin-top: 10px;

        .btn {
          margin-right: 10px;
          margin-left: 0;
        }
      }
    }
  }

  @keyframes loading-spin {
    0% {
      transform: rotate(0deg);
    }

    100% {
      transform: rotate(360deg);
    }
  }
</style>
