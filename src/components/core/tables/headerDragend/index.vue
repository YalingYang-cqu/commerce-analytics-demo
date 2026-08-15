<!-- 表格组件 -->
<!-- 支持：el-table 全部属性、事件、插槽，同官方文档写法 -->
<!-- 扩展功能：分页组件、渲染自定义列、loading、表格全局边框、斑马纹、表格尺寸、表头背景配置 -->
<!-- 获取 ref：默认暴露了 elTableRef 外部通过 ref.value.elTableRef 可以调用 el-table 方法 -->
<template>
  <div
    class="art-table"
    :class="{ 'is-empty': isEmpty }"
    :style="containerHeight"
    ref="containerRef"
  >
    <ElTable
      ref="elTableRef"
      v-loading="!!loading"
      v-bind="{
        ...$attrs,
        ...props,
        height,
        stripe,
        border,
        size,
        headerCellStyle
      }"
      @header-dragend="headerDragend"
    >
      <template v-for="col in displayColumns" :key="`${col.prop || col.type || col.label}`">
        <!-- 渲染多级表头（有 children 的列）- Element Plus 会自动处理 children -->
        <ElTableColumn
          v-if="col.children && Array.isArray(col.children) && col.children.length > 0"
          v-bind="cleanColumnPropsWithChildren(col)"
        >
          <!-- 递归渲染子列 -->
          <template v-for="childCol in col.children" :key="childCol.prop || childCol.type">
            <ElTableColumn v-bind="cleanColumnProps(childCol)">
              <template v-if="childCol.useHeaderSlot && childCol.prop" #header="headerScope">
                <slot
                  :name="childCol.headerSlotName || `${childCol.prop}-header`"
                  v-bind="{ ...headerScope, prop: childCol.prop, label: childCol.label }"
                >
                  {{ childCol.label }}
                </slot>
              </template>
              <template v-if="childCol.useSlot && childCol.prop" #default="slotScope">
                <slot
                  :name="childCol.slotName || childCol.prop"
                  v-bind="{
                    ...slotScope,
                    prop: childCol.prop,
                    value: childCol.prop ? slotScope.row[childCol.prop] : undefined
                  }"
                />
              </template>
              <template v-else-if="childCol.copy && childCol.prop" #default="slotScope">
                <div
                  class="cell-copy"
                  :title="`点击复制${childCol.label}`"
                  @click="
                    handleCopy(childCol.prop ? String(slotScope.row[childCol.prop] || '') : '')
                  "
                >
                  {{ childCol.prop ? slotScope.row[childCol.prop] : '' }}
                </div>
              </template>
              <template v-else-if="childCol.ellipsis && childCol.prop" #default="slotScope">
                <ElTooltip
                  :content="childCol.prop ? String(slotScope.row[childCol.prop] || '') : ''"
                  placement="top"
                >
                  <div class="cell-ellipsis">
                    {{ childCol.prop ? slotScope.row[childCol.prop] : '' }}
                  </div>
                </ElTooltip>
              </template>
            </ElTableColumn>
          </template>
        </ElTableColumn>
        <!-- 自定义勾选列（解决 Element Plus reserveSelection 跨页勾选问题） -->
        <ElTableColumn
          v-else-if="col.type === 'selection'"
          :width="col.width || 55"
          :fixed="col.fixed"
          align="center"
          class-name="art-table-column-selection"
        >
          <template #header>
            <ElCheckbox
              :model-value="isAllSelected"
              :indeterminate="isIndeterminate"
              @change="(val) => handleSelectAll(!!val, col)"
            />
          </template>
          <template #default="{ row }">
            <ElCheckbox
              :model-value="isRowSelected(row)"
              :disabled="isSelectionDisabled(row, col)"
              @change="(val) => handleRowSelect(row, !!val)"
            />
          </template>
        </ElTableColumn>
        <!-- 渲染全局序号列 -->
        <ElTableColumn v-else-if="col.type === 'globalIndex'" v-bind="{ ...col }">
          <template #default="{ $index }">
            <span>{{ getGlobalIndex($index) }}</span>
          </template>
        </ElTableColumn>
        <!-- 渲染展开行 -->
        <ElTableColumn v-else-if="col.type === 'expand'" v-bind="cleanColumnProps(col)">
          <template #default="{ row }">
            <component v-if="col.formatter" :is="col.formatter(row)" />
            <slot v-else name="expand" :row="row" />
          </template>
        </ElTableColumn>

        <!-- 渲染普通列 -->
        <ElTableColumn v-else v-bind="cleanColumnProps(col)">
          <template v-if="col.useHeaderSlot && col.prop" #header="headerScope">
            <slot
              :name="col.headerSlotName || `${col.prop}-header`"
              v-bind="{ ...headerScope, prop: col.prop, label: col.label }"
            >
              {{ col.label }}
            </slot>
          </template>
          <template v-if="col.useSlot && col.prop" #default="slotScope">
            <slot
              :name="col.slotName || col.prop"
              v-bind="{
                ...slotScope,
                prop: col.prop,
                value: col.prop ? slotScope.row[col.prop] : undefined
              }"
            />
          </template>
          <template v-else-if="col.copy && col.prop" #default="slotScope">
            <div
              class="cell-copy"
              :title="`点击复制${col.label}`"
              @click="handleCopy(col.prop ? String(slotScope.row[col.prop] || '') : '')"
            >
              {{ col.prop ? slotScope.row[col.prop] : '' }}
            </div>
          </template>
          <template v-else-if="col.ellipsis && col.prop" #default="slotScope">
            <ElTooltip
              :content="col.prop ? String(slotScope.row[col.prop] || '') : ''"
              placement="top"
            >
              <div class="cell-ellipsis">
                {{ col.prop ? slotScope.row[col.prop] : '' }}
              </div>
            </ElTooltip>
          </template>
        </ElTableColumn>
      </template>

      <template v-if="$slots.default" #default><slot /></template>

      <template #empty>
        <div v-if="loading"></div>
        <ElEmpty v-else :description="emptyText" :image-size="120" />
      </template>
    </ElTable>

    <div
      class="pagination custom-pagination sticky-footer"
      v-if="showPagination"
      :class="mergedPaginationOptions?.align"
      ref="paginationRef"
    >
      <ElPagination
        v-bind="mergedPaginationOptions"
        :total="pagination?.total"
        :disabled="loading"
        :page-size="pagination?.pageSize"
        :current-page="pagination?.currentPage"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
        :page-sizes="[20, 50, 100, 200, 500]"
        size="small"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick, onMounted, onUnmounted, watch } from 'vue'
  import type { ElTable, TableProps } from 'element-plus'
  import { ElTooltip, ElCheckbox } from 'element-plus'
  import { storeToRefs } from 'pinia'
  import { useRoute } from 'vue-router'
  import { ColumnOption } from '@/types'
  import { useTableStore } from '@/store/modules/table'
  import { useCommon } from '@/composables/useCommon'
  import { useElementSize, useWindowSize } from '@vueuse/core'
  import { handleCopy } from '@/utils/common-util'
  import { getHabitsApi, saveUserHabitsApi } from '@/api/system-manage'
  import { getColumnKey, normalizeColumnKey } from '@/composables/useTableColumns'

  defineOptions({ name: 'ArtTable' })

  const { width, height: windowHeight } = useWindowSize()
  const route = useRoute()
  const elTableRef = ref<InstanceType<typeof ElTable> | null>(null)
  const paginationRef = ref<HTMLElement>()
  const containerRef = ref<HTMLElement>()
  const tableStore = useTableStore()
  const { isBorder, isZebra, tableSize, isFullScreen, isHeaderBackground } = storeToRefs(tableStore)

  // 动态计算表格头部高度
  const tableHeaderHeight = ref(0)
  // 容器顶部到视口顶部的初始距离（用于计算表格高度）
  const containerTopOffset = ref(0)

  // ResizeObserver 用于监听表格头部高度变化
  let resizeObserver: ResizeObserver | null = null
  console.log('重新渲染')
  /** 分页配置接口 */
  interface PaginationConfig {
    // /** 当前页码 */
    // current?: number
    // /** 每页显示条目个数 */
    // size?: number
    /** 总条目数 */
    total: number
    currentPage: number
    /** 每页显示条目个数 */
    pageSize: number
  }

  /** 分页器配置选项接口 */
  interface PaginationOptions {
    /** 每页显示个数选择器的选项列表 */
    pageSizes?: number[]
    /** 分页器的对齐方式 */
    align?: 'left' | 'center' | 'right'
    /** 分页器的布局 */
    layout?: string
    /** 是否显示分页器背景 */
    background?: boolean
    /** 只有一页时是否隐藏分页器 */
    hideOnSinglePage?: boolean
    /** 分页器的大小 */
    size?: 'small' | 'default' | 'large'
    /** 分页器的页码数量 */
    pagerCount?: number
  }

  /** ArtTable 组件的 Props 接口 */
  interface ArtTableProps extends TableProps<Record<string, any>> {
    /** 加载状态 */
    loading?: boolean
    /** 列渲染配置 */
    columns?: ColumnOption[]
    /** 列显示控制（与 ArtTableHeader v-model:columns 同源时，用于按拖拽顺序与显隐渲染） */
    columnChecks?: Array<{ prop: string; checked: boolean; [key: string]: any }>
    /** 分页状态 */
    pagination?: PaginationConfig
    /** 分页配置 */
    paginationOptions?: PaginationOptions
    /** 空数据表格高度 */
    emptyHeight?: string
    /** 空数据时显示的文本 */
    emptyText?: string
    /** 是否开启 ArtTableHeader，解决表格高度自适应问题 */
    showTableHeader?: boolean
    rowKey?: string
    /** 表格唯一标识，用于 localStorage 存储 pageSize，未传入时使用路由 path */
    tableKey?: string
    /** 表格名称，与列设置一致；列宽习惯 key 为 `${tableName}${path}_w`，未传时用 tableKey 或 path */
    tableName?: string
    /** 是否开启列宽记忆（拖拽列宽保存到接口，刷新后恢复），依赖 tableName/tableKey 与 path 作为习惯 key */
    habitColumnWidth?: boolean
    autoHeight?: boolean
  }

  const props = withDefaults(defineProps<ArtTableProps>(), {
    columns: () => [],
    columnChecks: () => [],
    fit: true,
    showHeader: true,
    stripe: undefined,
    border: undefined,
    size: undefined,
    emptyHeight: '100%',
    emptyText: '暂无数据',
    showTableHeader: true,
    rowKey: 'id',
    habitColumnWidth: true,
    autoHeight: false
  })

  const LAYOUT = {
    MOBILE: 'prev, pager, next, sizes, jumper, total',
    IPAD: 'prev, pager, next, jumper, total',
    DESKTOP: 'total, prev, pager, next, sizes, jumper'
  }

  const layout = computed(() => {
    if (width.value < 768) {
      return LAYOUT.MOBILE
    } else if (width.value < 1024) {
      return LAYOUT.IPAD
    } else {
      return LAYOUT.DESKTOP
    }
  })

  // 默认分页常量
  const DEFAULT_PAGINATION_OPTIONS: PaginationOptions = {
    pageSizes: [20, 50, 100, 200, 500],
    align: 'right',
    background: true,
    layout: layout.value,
    hideOnSinglePage: false,
    size: 'default',
    pagerCount: width.value > 1200 ? 7 : 5
  }

  // 合并分页配置
  const mergedPaginationOptions = computed(() => ({
    ...DEFAULT_PAGINATION_OPTIONS,
    ...props.paginationOptions
  }))

  // 边框 (优先级：props > store)
  const border = computed(() => props.border ?? isBorder.value)
  // 斑马纹
  const stripe = computed(() => props.stripe ?? isZebra.value)
  // 表格尺寸
  const size = computed(() => props.size ?? tableSize.value)
  // 数据是否为空
  const isEmpty = computed(() => props.data?.length === 0)

  const { height: paginationHeight } = useElementSize(paginationRef)

  // 容器高度计算
  const containerHeight = computed(() => {
    let offset = 0
    if (!props.showTableHeader) {
      // 没有表格头部时，只考虑分页器高度
      offset = paginationHeight.value === 0 ? 0 : paginationHeight.value + PAGINATION_SPACING.value
    } else {
      // 有表格头部时，动态计算表格头部高度 + 分页器高度 + 间距
      const headerHeight = tableHeaderHeight.value || DEFAULT_TABLE_HEADER_HEIGHT
      const paginationOffset =
        paginationHeight.value === 0 ? 0 : paginationHeight.value + PAGINATION_SPACING.value
      offset = headerHeight + paginationOffset + TABLE_HEADER_SPACING
    }
    return { height: offset === 0 ? '100%' : `calc(100% - ${offset}px)` }
  })

  // 计算表格可用高度（基于视口高度动态计算）
  const computedTableHeight = computed(() => {
    // 全屏模式下占满全屏
    if (isFullScreen.value) return '100%'
    // 空数据且非加载状态时固定高度
    if (isEmpty.value && !props.loading) return props.emptyHeight
    // 使用传入的高度
    if (props.height) return props.height

    // 动态计算表格高度：视口高度 - 表格顶部到视口顶部的距离 - 分页器高度 - 表格头部高度 - 各种间距
    if (containerRef.value && windowHeight.value > 0) {
      // 使用缓存的容器顶部偏移量，避免滚动时频繁变化
      const topOffset = containerTopOffset.value || containerRef.value.getBoundingClientRect().top

      // 计算需要减去的总高度
      const headerHeight = props.showTableHeader
        ? (tableHeaderHeight.value || DEFAULT_TABLE_HEADER_HEIGHT) + TABLE_HEADER_SPACING
        : 0
      const paginationOffset = showPagination.value
        ? paginationHeight.value + PAGINATION_SPACING.value
        : 0

      // 额外的安全边距（避免紧贴边缘）
      const safeMargin = 20

      // 计算可用高度
      const availableHeight =
        windowHeight.value - topOffset - headerHeight - paginationOffset - safeMargin

      // 确保最小高度，返回数字类型（Element Plus 支持数字类型的高度）
      return Math.max(availableHeight, 300)
    }

    // 如果无法计算，使用容器高度（100%）
    return '100%'
  })

  // 表格高度逻辑（保持向后兼容）
  const height = computed(() => {
    const h = computedTableHeight.value
    // 如果是数字，直接返回；如果是字符串，也直接返回
    return props.autoHeight ? undefined : h
  })

  // 表头背景颜色样式
  const headerCellStyle = computed(() => ({
    background: isHeaderBackground.value
      ? 'var(--el-fill-color-lighter)'
      : 'var(--art-main-bg-color)',
    ...(props.headerCellStyle || {}) // 合并用户传入的样式
  }))

  // 是否显示分页器
  const showPagination = computed(() => props.pagination && !isEmpty.value)

  // 清理列属性，移除插槽相关的自定义属性，确保它们不会被 ElTableColumn 错误解释
  const cleanColumnProps = (col: ColumnOption) => {
    const columnProps = { ...col }
    // 删除自定义的插槽控制属性
    delete columnProps.useHeaderSlot
    delete columnProps.headerSlotName
    delete columnProps.useSlot
    delete columnProps.slotName
    // 处理 copy 属性，添加类名
    if (columnProps.copy === true) {
      const existingClassName = columnProps.cellClassName || ''
      columnProps.cellClassName = existingClassName ? `${existingClassName} cell-copy` : 'cell-copy'
    }
    // 处理 ellipsis 属性，添加类名
    if (columnProps.ellipsis === true) {
      const existingClassName = columnProps.cellClassName || ''
      columnProps.cellClassName = existingClassName
        ? `${existingClassName} cell-ellipsis`
        : 'cell-ellipsis'
    }
    return columnProps
  }

  // 清理多级表头列属性，删除 children（因为子列在模板中手动渲染）
  const cleanColumnPropsWithChildren = (col: ColumnOption) => {
    const columnProps = { ...col }
    // 删除自定义的插槽控制属性
    delete columnProps.useHeaderSlot
    delete columnProps.headerSlotName
    delete columnProps.useSlot
    delete columnProps.slotName
    // 处理 ellipsis 属性（多级表头的父列）
    if (columnProps.ellipsis === true) {
      const existingClassName = columnProps.cellClassName || ''
      columnProps.cellClassName = existingClassName
        ? `${existingClassName} cell-ellipsis`
        : 'cell-ellipsis'
    }
    // 删除 children，因为子列在模板中手动渲染
    delete columnProps.children
    return columnProps
  }

  // 获取实际的 storage key
  const storageKey = computed(() => {
    const key = props.tableKey || route.path
    return `art-table-pageSize-${key}`
  })

  // 列宽习惯：key 使用 ${tableName}${path}_w，与列设置习惯区分；未传 tableName 时用 ${path}_w
  const habitKey = computed(() => {
    const path = String(route.path).replace(/\//g, '_')
    const name = props.tableName ?? props.tableKey
    return name ? `${name}${path}_w` : `${path}_w`
  })
  const columnWidthOverrides = ref<Record<string, number>>({})
  // 有 columnChecks 时按 columnChecks 顺序与显隐得到列；key 统一用 getColumnKey（prop 为数组时规范为 'a.b.c'），保证 prop 为数组的列也能匹配展示
  const baseColumns = computed<ColumnOption[]>(() => {
    const cols = props.columns || []
    if (!props.columnChecks || props.columnChecks.length === 0) return cols
    const colByKey = new Map<string, ColumnOption<any>>()
    cols.forEach((col: any) => {
      const key = getColumnKey(col) ?? (col as any).label ?? (col as any).type
      if (key != null) colByKey.set(String(key), col)
    })
    const ordered: ColumnOption<any>[] = []
    props.columnChecks.forEach((check: any) => {
      const rawKey = check.prop ?? check.name
      if (rawKey == null) return
      const key = normalizeColumnKey(rawKey) ?? String(rawKey)
      const col = colByKey.get(key)
      if (col) {
        const checked = check.checked !== false
        if ((col as any).type === 'selection' || checked) ordered.push(col)
        colByKey.delete(key)
      }
    })
    cols.forEach((col: any) => {
      const key = getColumnKey(col) ?? (col as any).label ?? (col as any).type
      if (key != null && colByKey.has(String(key))) ordered.push(col)
    })
    return ordered
  })
  const displayColumns = computed<ColumnOption[]>(() => {
    if (!props.habitColumnWidth || Object.keys(columnWidthOverrides.value).length === 0) {
      return baseColumns.value
    }
    const overrides = columnWidthOverrides.value
    return baseColumns.value.map((col) => {
      const propKey = getColumnKey(col) ?? (col as any).prop
      const hasOverride = !!propKey && overrides[propKey] != null
      const width = hasOverride && propKey ? overrides[propKey] : col.width
      if (col.children && Array.isArray(col.children) && col.children.length > 0) {
        const children = col.children.map((child: any) => {
          const ckey = getColumnKey(child) ?? child.prop
          const co = !!ckey && overrides[ckey] != null
          return { ...child, width: co && ckey ? overrides[ckey] : child.width }
        })
        return { ...col, width, children }
      }
      return hasOverride || width !== col.width ? { ...col, width } : col
    })
  })

  // 分页大小变化
  const handleSizeChange = (val: number) => {
    // 保存到 localStorage
    try {
      localStorage.setItem(storageKey.value, String(val))
    } catch (error) {
      console.warn('保存 pageSize 到 localStorage 失败:', error)
    }
    emit('pagination:size-change', val)
  }

  // 分页当前页变化
  const handleCurrentChange = (val: number) => {
    emit('pagination:current-change', val)
    scrollToTop() // 页码改变后滚动到表格顶部
  }

  // 滚动表格内容到顶部，并可以联动页面滚动到顶部
  const scrollToTop = () => {
    nextTick(() => {
      elTableRef.value?.setScrollTop(0) // 滚动 ElTable 内部滚动条到顶部
      useCommon().scrollToTop() // 调用公共 composable 滚动页面到顶部
    })
  }

  // 全局序号
  const getGlobalIndex = (index: number) => {
    if (!props.pagination) return index + 1
    const { currentPage, pageSize } = props.pagination
    return (currentPage - 1) * pageSize + index + 1
  }
  // Element Plus header-dragend 参数为 (newWidth, delta, column, event)，第二项是位移量不是 oldWidth
  const headerDragend = (newWidth: number, _delta: number, column: any) => {
    if (!props.habitColumnWidth || !column) return
    const prop = column.property ?? column.prop
    if (prop == null || newWidth == null || !Number.isFinite(Number(newWidth))) return
    const minW = Number(column.minWidth) || 80
    const w = Math.max(minW, Number(newWidth))
    const propKey = normalizeColumnKey(prop) ?? String(prop)
    columnWidthOverrides.value = {
      ...columnWidthOverrides.value,
      [propKey]: w
    }
    saveUserHabitsApi({
      key: habitKey.value,
      habits: JSON.stringify({ columnWidths: { ...columnWidthOverrides.value } })
    }).catch((err) => {
      console.warn('[ArtTable] 列宽习惯保存失败:', err)
    })
  }
  // ========== 自定义 Selection 功能（解决 Element Plus reserveSelection 跨页勾选问题） ==========
  // 问题分析：Element Plus 的 reserveSelection 虽然可以保留跨页选中状态，但 selection-change 事件
  // 只返回当前页的选中行，不包含跨页选中的行，导致无法获取所有选中的数据
  //
  // 解决方案：自定义实现 selection，维护所有选中的行数据（包括跨页的）
  // 每个组件实例都有独立的选中状态，互不干扰

  // 存储跨页选中的 rowKey 值
  const selectedRowKeys = ref<Set<string | number>>(new Set())
  // 存储所有选中的行数据（用于 selection-change 事件返回所有选中的行）
  const selectedRowsMap = ref<Map<string | number, any>>(new Map())
  // 存储所有曾经在当前页出现过的 rowKey（用于判断数据是否真的被删除）
  // 用于区分以下场景：
  // 1. 跨页选中：rowKey 不在当前页，但在 allSeenRowKeys 中 → 保留选中
  // 2. 搜索过滤：rowKey 不在当前页，但在 allSeenRowKeys 中 → 保留选中
  // 3. 分页查询：rowKey 不在当前页，但在 allSeenRowKeys 中 → 保留选中
  // 4. 数据删除：rowKey 不在当前页，且不在 allSeenRowKeys 中 → 清除选中
  const allSeenRowKeys = ref<Set<string | number>>(new Set())

  // 获取行的唯一标识
  const getRowKey = (row: any): string | number => {
    if (typeof props.rowKey === 'function') {
      return (props.rowKey as (row: any) => string | number)(row)
    }
    return row[props.rowKey || 'id']
  }

  // 判断行是否被选中
  const isRowSelected = (row: any): boolean => {
    const key = getRowKey(row)
    return selectedRowKeys.value.has(key)
  }

  // 处理行选中/取消选中
  const handleRowSelect = (row: any, selected: boolean) => {
    const key = getRowKey(row)
    if (selected) {
      selectedRowKeys.value.add(key)
      selectedRowsMap.value.set(key, row)
    } else {
      selectedRowKeys.value.delete(key)
      selectedRowsMap.value.delete(key)
      // Vue 3 对 Set/Map 的原地 delete 可能不触发依赖更新，导致表头半选状态不刷新，此处重新赋值以强制触发
      selectedRowKeys.value = new Set(selectedRowKeys.value)
      selectedRowsMap.value = new Map(selectedRowsMap.value)
    }
    // 触发 selection-change 事件，返回所有选中的行（包括跨页的）
    emit('selection-change', Array.from(selectedRowsMap.value.values()))
  }

  // 获取当前页的所有数据
  const getCurrentPageRows = () => {
    return props.data || []
  }

  // 判断当前页是否全选
  const isCurrentPageAllSelected = computed(() => {
    const currentRows = getCurrentPageRows()
    if (currentRows.length === 0) return false
    return currentRows.every((row) => isRowSelected(row))
  })

  // 判断是否有跨页选中的数据（选中的数据不在当前页）
  const hasCrossPageSelected = computed(() => {
    if (selectedRowKeys.value.size === 0) return false
    const currentPageKeys = new Set(getCurrentPageRows().map((row) => getRowKey(row)))
    // 如果选中的 rowKey 中有不在当前页的，说明有跨页选中
    for (const key of selectedRowKeys.value) {
      if (!currentPageKeys.has(key)) {
        return true
      }
    }
    return false
  })

  // 判断当前页是否有部分选中
  const isCurrentPagePartiallySelected = computed(() => {
    const currentRows = getCurrentPageRows()
    if (currentRows.length === 0) return false
    const selectedCount = currentRows.filter((row) => isRowSelected(row)).length
    return selectedCount > 0 && selectedCount < currentRows.length
  })

  // 全选状态（只要当前页全选就显示全选，不管是否有跨页选中）
  const isAllSelected = computed(() => {
    return isCurrentPageAllSelected.value
  })

  // 半选状态（当前页不是全选，但其他页存在勾选时显示半选）
  const isIndeterminate = computed(() => {
    const currentRows = getCurrentPageRows()
    if (currentRows.length === 0) return false

    // 如果当前页全选，不显示半选（显示全选）
    if (isCurrentPageAllSelected.value) return false

    // 当前页不是全选，但其他页存在勾选，显示半选
    if (hasCrossPageSelected.value) return true

    // 当前页部分选中，显示半选
    if (isCurrentPagePartiallySelected.value) return true

    return false
  })

  // 当前行是否不可勾选（由列的 selectable 决定）
  const isSelectionDisabled = (row: any, col: any): boolean => {
    if (typeof col?.selectable !== 'function') return false
    return !col.selectable(row)
  }

  // 处理全选/取消全选（selectable 为 function 时仅操作可勾选行）
  // 当表头为半选状态时点击表头：视为「取消全选」，避免误触导致多选（如只选 1 个却变成选当前页全部）
  const handleSelectAll = (selected: boolean, col?: any) => {
    const currentRows = getCurrentPageRows()
    currentRows.forEach((row) => {
      if (selected && isSelectionDisabled(row, col)) return
      const key = getRowKey(row)
      if (selected) {
        selectedRowKeys.value.add(key)
        selectedRowsMap.value.set(key, row)
      } else {
        selectedRowKeys.value.delete(key)
        selectedRowsMap.value.delete(key)
      }
    })
    // 取消全选后重新赋值，确保表头勾选状态能正确更新（与 handleRowSelect 一致）
    if (!selected) {
      selectedRowKeys.value = new Set(selectedRowKeys.value)
      selectedRowsMap.value = new Map(selectedRowsMap.value)
    }
    emit('selection-change', Array.from(selectedRowsMap.value.values()))
  }

  // 获取所有选中的行数据（包括跨页的）
  const getSelectedRows = (): any[] => {
    return Array.from(selectedRowsMap.value.values())
  }

  // 获取所有选中的 rowKey（包括跨页的）
  const getSelectedRowKeys = (): (string | number)[] => {
    return Array.from(selectedRowKeys.value)
  }

  // 清空所有选中
  const clearSelection = () => {
    selectedRowKeys.value.clear()
    selectedRowsMap.value.clear()
    selectedRowKeys.value = new Set(selectedRowKeys.value)
    selectedRowsMap.value = new Map(selectedRowsMap.value)
    emit('selection-change', [])
  }

  // 设置选中状态
  const setSelection = (rows: any[]) => {
    selectedRowKeys.value.clear()
    selectedRowsMap.value.clear()
    rows.forEach((row) => {
      const key = getRowKey(row)
      selectedRowKeys.value.add(key)
      selectedRowsMap.value.set(key, row)
    })
    emit('selection-change', Array.from(selectedRowsMap.value.values()))
  }

  // 切换行选中状态
  const toggleRowSelection = (row: any) => {
    const key = getRowKey(row)
    if (selectedRowKeys.value.has(key)) {
      selectedRowKeys.value.delete(key)
      selectedRowsMap.value.delete(key)
      selectedRowKeys.value = new Set(selectedRowKeys.value)
      selectedRowsMap.value = new Map(selectedRowsMap.value)
    } else {
      selectedRowKeys.value.add(key)
      selectedRowsMap.value.set(key, row)
    }
    emit('selection-change', Array.from(selectedRowsMap.value.values()))
  }

  // 监听数据变化，更新 selectedRowsMap 中的数据引用，并清理被删除的数据的选中状态
  // 行为与 Element Plus el-table 的 reserveSelection 一致：
  // - 翻页时不清空勾选（保留跨页选中）
  // - 搜索数据不清除勾选（数据可能在其他页）
  // - 分页查询不清除勾选（数据在其他页）
  // - 删除数据时清除勾选（数据不存在了）
  watch(
    () => props.data,
    (newData) => {
      if (!newData || newData.length === 0) {
        // 数据为空时，保留选中状态，以支持跨页勾选和搜索场景
        return
      }

      // 获取当前页的所有 rowKey
      const currentPageKeys = new Set<string | number>()
      newData.forEach((row) => {
        const key = getRowKey(row)
        currentPageKeys.add(key)
        // 记录所有见过的 rowKey（用于区分跨页选中和数据删除）
        allSeenRowKeys.value.add(key)
      })

      // 检查已选中的 rowKey，判断是否需要清除
      // 策略：只有当 rowKey 不在当前页且从未见过时，才认为是数据被删除了
      // 如果 rowKey 在 allSeenRowKeys 中，说明之前见过，可能是跨页选中或搜索过滤，应该保留
      const keysToRemove: (string | number)[] = []
      selectedRowKeys.value.forEach((key) => {
        // 如果不在当前页数据中，且不在所有见过的 rowKey 中，说明数据被删除了
        // 注意：如果只是不在当前页但在 allSeenRowKeys 中，说明是跨页选中或搜索过滤，应该保留
        if (!currentPageKeys.has(key) && !allSeenRowKeys.value.has(key)) {
          keysToRemove.push(key)
        }
      })

      // 移除被删除的数据的选中状态
      if (keysToRemove.length > 0) {
        keysToRemove.forEach((key) => {
          selectedRowKeys.value.delete(key)
          selectedRowsMap.value.delete(key)
        })
        selectedRowKeys.value = new Set(selectedRowKeys.value)
        selectedRowsMap.value = new Map(selectedRowsMap.value)
        emit('selection-change', Array.from(selectedRowsMap.value.values()))
      }

      // 更新当前页数据的引用（如果数据对象发生变化）
      newData.forEach((row) => {
        const key = getRowKey(row)
        if (selectedRowKeys.value.has(key)) {
          // 更新已选中行的数据引用，确保数据是最新的
          selectedRowsMap.value.set(key, row)
        }
      })

      // 清理 allSeenRowKeys 中不在当前页且不在已选中列表中的 key（避免内存泄漏）
      // 但保留已选中的 key，确保跨页选中功能正常
      // 注意：这里采用保守策略，只清理明显不需要的 key
      const keysToCleanFromSeen: (string | number)[] = []
      allSeenRowKeys.value.forEach((key) => {
        // 如果不在当前页，也不在已选中列表中，说明可能是之前页的数据，可以清理
        // 但为了安全，我们保留已选中的 key，即使它们不在当前页
        if (!currentPageKeys.has(key) && !selectedRowKeys.value.has(key)) {
          keysToCleanFromSeen.push(key)
        }
      })
      // 定期清理，避免 allSeenRowKeys 无限增长
      // 但保留已选中的 key，确保跨页选中功能正常
      if (keysToCleanFromSeen.length > 1000) {
        // 如果积累太多，清理一部分（但保留已选中的）
        keysToCleanFromSeen.slice(0, 500).forEach((key) => {
          allSeenRowKeys.value.delete(key)
        })
      }
    },
    { deep: true }
  )

  const emit = defineEmits<{
    (e: 'pagination:size-change', val: number): void
    (e: 'pagination:current-change', val: number): void
    (e: 'selection-change', rows: any[]): void
  }>()

  // 表格头部默认高度常量
  const DEFAULT_TABLE_HEADER_HEIGHT = 44
  // 分页器与表格之间的间距常量（计算属性，响应 showTableHeader 变化）
  const PAGINATION_SPACING = computed(() => (props.showTableHeader ? 6 : 15))
  // 表格头部与表格之间的间距常量
  const TABLE_HEADER_SPACING = 12

  // 查找并监听表格头部高度变化
  const observeTableHeader = () => {
    try {
      // 清理之前的监听
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }

      // 如果不需要显示表格头部，直接返回
      if (!props.showTableHeader) {
        tableHeaderHeight.value = 0
        return
      }

      // 查找表格头部元素
      const tableHeader = document.getElementById('art-table-header') as HTMLElement
      if (!tableHeader) {
        // 如果找不到表格头部，使用默认高度
        tableHeaderHeight.value = DEFAULT_TABLE_HEADER_HEIGHT
        return
      }

      // 初始化高度
      tableHeaderHeight.value = tableHeader.offsetHeight

      // 创建 ResizeObserver 监听高度变化
      resizeObserver = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.target === tableHeader) {
            tableHeaderHeight.value = entry.contentRect.height
          }
        }
      })

      resizeObserver.observe(tableHeader)
    } catch (error) {
      console.warn('监听表格头部高度失败:', error)
      // 出错时使用默认高度
      tableHeaderHeight.value = DEFAULT_TABLE_HEADER_HEIGHT
    }
  }

  // 更新容器顶部偏移量
  const updateContainerTopOffset = () => {
    if (containerRef.value) {
      containerTopOffset.value = containerRef.value.getBoundingClientRect().top
    }
  }

  // 监听窗口大小变化，重新计算表格高度和容器偏移量
  watch([windowHeight, () => props.showTableHeader, () => showPagination.value], () => {
    // 更新容器偏移量
    nextTick(() => {
      updateContainerTopOffset()
      // 强制重新计算高度
      if (elTableRef.value) {
        elTableRef.value.doLayout()
      }
    })
  })

  // 组件挂载后查找表格头部并初始化容器偏移量；若开启列宽记忆则拉取习惯并应用
  onMounted(() => {
    nextTick(() => {
      observeTableHeader()
      updateContainerTopOffset()
    })
    if (props.habitColumnWidth && props.columns?.length) {
      getHabitsApi(habitKey.value)
        .then((res: any) => {
          if (res?.code === 200 && res?.data) {
            try {
              const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
              if (data?.columnWidths && typeof data.columnWidths === 'object') {
                columnWidthOverrides.value = { ...data.columnWidths }
              }
            } catch {
              // 忽略解析失败
            }
          }
        })
        .catch(() => {})
    }
  })

  // 监听数据变化和表格头部显示状态变化，重新观察表格头部
  watch(
    [() => props.data, () => props.showTableHeader],
    () => {
      nextTick(() => {
        observeTableHeader()
      })
    },
    { flush: 'post' }
  )

  // 组件卸载时清理 ResizeObserver 和选中状态
  onUnmounted(() => {
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    // 清理选中状态（确保组件卸载后不会保留状态）
    selectedRowKeys.value.clear()
    selectedRowsMap.value.clear()
  })

  defineExpose({
    scrollToTop,
    elTableRef,
    // Selection 相关方法（类似 Element Plus 的 API，但返回所有选中的行）
    getSelectedRows, // 获取所有选中的行数据（包括跨页的）- 这是与 Element Plus 的主要区别
    getSelectedRowKeys, // 获取所有选中的 rowKey（包括跨页的）
    clearSelection, // 清空所有选中
    setSelection, // 设置选中状态
    toggleRowSelection // 切换行选中状态
  })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
