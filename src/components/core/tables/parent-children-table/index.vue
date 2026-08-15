<!-- 表格组件 -->
<!-- 支持：el-table 全部属性、事件、插槽，同官方文档写法 -->
<!-- 扩展功能：分页组件、渲染自定义列、loading、表格全局边框、斑马纹、表格尺寸、表头背景配置 -->
<!-- 获取 ref：默认暴露了 elTableRef 外部通过 ref.value.elTableRef 可以调用 el-table 方法 -->
<template>
  <div
    class="art-table p-table"
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
        headerCellStyle,
        data: flatTableData,
        spanMethod: handleSpanMethod,
        rowClassName: handleRowClassName
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
                  <TableHeaderTip
                    v-if="childCol.headerTip"
                    :label="String(childCol.label ?? '')"
                    :tip="childCol.headerTip"
                  />
                  <template v-else>{{ childCol.label }}</template>
                </slot>
              </template>
              <template v-else-if="childCol.headerTip && childCol.prop" #header>
                <TableHeaderTip :label="String(childCol.label ?? '')" :tip="childCol.headerTip" />
              </template>
              <template v-if="childCol.useSlot && childCol.prop" #default="slotScope">
                <slot
                  :name="childCol.slotName || childCol.prop"
                  v-bind="{
                    ...slotScope,
                    prop: childCol.prop,
                    value: childCol.prop ? slotScope.row[childCol.prop] : undefined,
                    row: slotScope.row
                  }"
                />
              </template>
            </ElTableColumn>
          </template>
        </ElTableColumn>
        <!-- 渲染勾选列 -->
        <ElTableColumn
          v-else-if="col.type === 'selection'"
          prop="selection"
          :width="col.width || 55"
          :fixed="col.fixed"
          align="center"
          class-name="parent-children-table-selection-column"
        >
          <template #header>
            <ElCheckbox
              :model-value="isAllSelected"
              :indeterminate="isIndeterminate"
              @change="handleSelectAll"
            />
          </template>
          <template #default="{ row }">
            <ElCheckbox
              :model-value="isRowSelected(row)"
              @change="(val) => handleRowSelect(row, val)"
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
            <component :is="col.formatter ? col.formatter(row) : null" />
          </template>
        </ElTableColumn>

        <!-- 渲染普通列 -->
        <ElTableColumn v-else v-bind="cleanColumnProps(col)">
          <template v-if="col.useHeaderSlot && col.prop" #header="headerScope">
            <slot
              :name="col.headerSlotName || `${col.prop}-header`"
              v-bind="{ ...headerScope, prop: col.prop, label: col.label }"
            >
              <TableHeaderTip
                v-if="col.headerTip"
                :label="String(col.label ?? '')"
                :tip="col.headerTip"
              />
              <template v-else>{{ col.label }}</template>
            </slot>
          </template>
          <template v-else-if="col.headerTip && col.prop" #header>
            <TableHeaderTip :label="String(col.label ?? '')" :tip="col.headerTip" />
          </template>
          <template v-if="col.prop" #default="slotScope">
            <!-- 如果是 firstColumn，且是父行，使用固定的 parentRow 插槽 -->
            <template v-if="isFirstColumn(col.prop) && slotScope.row._isParent">
              <div class="parent-info" :class="{ simple: !!customClass }">
                <slot
                  name="parentRow"
                  v-bind="{
                    ...slotScope,
                    prop: col.prop,
                    value: slotScope.row[col.prop],
                    row: slotScope.row,
                    isParent: slotScope.row._isParent
                  }"
                />
              </div>
            </template>
            <!-- 如果使用了插槽，使用普通插槽 -->
            <template v-else-if="col.useSlot">
              <slot
                :name="col.slotName || col.prop"
                v-bind="{
                  ...slotScope,
                  prop: col.prop,
                  value: col.prop ? slotScope.row[col.prop] : undefined,
                  row: slotScope.row
                }"
              />
            </template>
            <!-- 其他情况显示默认值 -->
            <template v-else>
              {{ slotScope.row[col.prop] }}
            </template>
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
  import type { ElTable, TableProps, CheckboxValueType } from 'element-plus'
  import { ElCheckbox } from 'element-plus'
  import { storeToRefs } from 'pinia'
  import { useRoute } from 'vue-router'
  import { ColumnOption } from '@/types'
  import { useTableStore } from '@/store/modules/table'
  import { useCommon } from '@/composables/useCommon'
  import { useElementSize, useWindowSize } from '@vueuse/core'
  import { getUuid } from '@/utils'
  import { getHabitsApi, saveUserHabitsApi } from '@/api/system-manage'
  import { getColumnKey, normalizeColumnKey } from '@/composables/useTableColumns'
  import TableHeaderTip from '@/components/core/tables/table-header-tip/index.vue'

  defineOptions({ name: 'PurchaseOrderTable' })

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

  /** 分页配置接口 */
  interface PaginationConfig {
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

  /** PurchaseOrderTable 组件的 Props 接口 */
  interface PurchaseOrderTableProps extends Omit<TableProps<Record<string, any>>, 'data'> {
    /** 加载状态 */
    loading?: boolean
    /** 列渲染配置 */
    columns?: ColumnOption[]
    /** 列显示控制 */
    columnChecks?: Array<{ prop: string; checked: boolean; [key: string]: any }>
    /** 表格数据 */
    data?: any[]
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
    /** 表格唯一标识，用于 localStorage 存储 pageSize，未传入时使用路由 path */
    tableKey?: string
    /** 表格名称，与列设置一致；列宽习惯 key 为 ${tableName}${path}_w */
    tableName?: string
    /** 是否开启列宽记忆（拖拽列宽保存到接口，刷新后恢复），依赖 tableName/tableKey 与 path 作为习惯 key */
    habitColumnWidth?: boolean
    childrenKey?: string
    /** 自定义样式类名，当传入非空值时启用 simple 布局 */
    customClass?: string | boolean
  }

  const props = withDefaults(defineProps<PurchaseOrderTableProps>(), {
    columns: () => [],
    columnChecks: () => [],
    data: () => [],
    fit: true,
    showHeader: true,
    stripe: undefined,
    border: true,
    size: undefined,
    emptyHeight: '100%',
    emptyText: '暂无数据',
    showTableHeader: true,
    rowKey: 'tempId',
    habitColumnWidth: true,
    childrenKey: 'children',
    customClass: ''
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

    // 计算分页器偏移量（仅在显示分页器时计算）
    const paginationOffset =
      showPagination.value && paginationHeight.value > 0
        ? paginationHeight.value + PAGINATION_SPACING.value
        : 0

    if (!props.showTableHeader) {
      // 没有表格头部时，只考虑分页器高度
      offset = paginationOffset
    } else {
      // 有表格头部时，动态计算表格头部高度 + 分页器高度 + 间距
      const headerHeight = tableHeaderHeight.value || DEFAULT_TABLE_HEADER_HEIGHT
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
      return Math.max(availableHeight + 34, 300)
    }

    // 如果无法计算，使用容器高度（100%）
    return '100%'
  })

  // 表格高度逻辑（保持向后兼容）
  const height = computed(() => {
    const h = computedTableHeight.value
    // 如果是数字，直接返回；如果是字符串，也直接返回
    return h
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

  // 扁平化后的表格数据
  interface FlatRowData extends Record<string, any> {
    _isParent?: boolean
    _parentIndex?: number
    _childrenCount?: number
    _originalParent?: Record<string, any>
  }

  // 将带 children 的数据扁平化
  // 注意：所有子行默认全部展开显示，不需要折叠/展开功能
  const flatTableData = computed<FlatRowData[]>(() => {
    const data = props.data || []
    if (!data.length) return []

    const result: FlatRowData[] = []

    data.forEach((parentRow) => {
      const children = parentRow[props?.childrenKey] || []
      // 父行的 id，如果不存在则使用 uuid 作为后备
      const parentId = parentRow.id ?? getUuid()

      // 添加父行
      const parentFlatRow: FlatRowData = {
        ...parentRow,
        tempId: parentId,
        _isParent: true,
        _parentIndex: result.length,
        _childrenCount: children.length || 1, // 至少为1，避免合并问题
        _originalParent: parentRow
      }
      result.push(parentFlatRow)

      // 添加所有子行（默认全部展开）
      if (children.length > 0) {
        children.forEach((childRow: any) => {
          // 子行的 id，如果不存在则使用 uuid 作为后备
          const childId = childRow.id ?? getUuid()
          // 子行的 rowKey 格式：父行id__子行id
          const childRowKey = `${parentId}__${childId}`

          const childFlatRow: FlatRowData = {
            ...childRow,
            tempId: childRowKey,
            _isParent: false,
            _parentIndex: result.length - 1,
            _childrenCount: 0,
            _originalParent: parentRow
          }
          result.push(childFlatRow)
        })
      } else {
        // 如果没有子行，添加一个空的子行占位
        const emptyChildRow: FlatRowData = {
          _isParent: false,
          _parentIndex: result.length - 1,
          _childrenCount: 0,
          tempId: `${parentId}__${getUuid()}`,
          _originalParent: parentRow
        }
        result.push(emptyChildRow)
      }
    })

    return result
  })

  // 获取可见的列：按 columnChecks 的顺序重排，再按 checked 过滤；key 与 useTableColumns 的 getColumnKey 一致（勾选列为 __selection__）以保证勾选列能匹配并随拖拽实时排序
  const visibleColumns = computed(() => {
    const cols = props.columns || []
    if (!props.columnChecks || props.columnChecks.length === 0) {
      return cols
    }
    const colByKey = new Map<string, ColumnOption<any>>()
    cols.forEach((col: any) => {
      const key = getColumnKey(col) ?? col.label ?? col.type
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
        if (col.type === 'selection' || checked) ordered.push(col)
        colByKey.delete(key)
      }
    })
    cols.forEach((col: any) => {
      const key = getColumnKey(col) ?? col.label ?? col.type
      if (key != null && colByKey.has(String(key))) ordered.push(col)
    })
    return ordered
  })

  // 列宽习惯：key 使用 ${tableName}${path}_w，与 art-table 一致；未传 tableName 时用 ${path}_w
  const habitKey = computed(() => {
    const path = String(route.path).replace(/\//g, '_')
    const name = props.tableName ?? props.tableKey
    return name ? `${name}${path}_w` : `${path}_w`
  })
  const columnWidthOverrides = ref<Record<string, number>>({})
  const displayColumns = computed<ColumnOption[]>(() => {
    if (!props.habitColumnWidth || Object.keys(columnWidthOverrides.value).length === 0) {
      return visibleColumns.value
    }
    const overrides = columnWidthOverrides.value
    return visibleColumns.value.map((col) => {
      const propKey = getColumnKey(col) ?? (col as any).prop
      const hasOverride = !!propKey && overrides[propKey] != null
      const width = hasOverride ? overrides[propKey] : col.width
      if (col.children && Array.isArray(col.children) && col.children.length > 0) {
        const children = col.children.map((child) => {
          const ckey = getColumnKey(child) ?? child.prop
          const co = !!ckey && overrides[ckey] != null
          return { ...child, width: co && ckey ? overrides[ckey] : child.width }
        })
        return { ...col, width, children }
      }
      return hasOverride || width !== col.width ? { ...col, width } : col
    })
  })

  // 计算除选择列和操作列外的列数量（用于 firstColumn 合并）
  const normalColumnsCount = computed(() => {
    return visibleColumns.value.filter(
      (col) => col.type !== 'selection' && col.prop !== 'operation'
    ).length
  })
  // 组件内部自动计算第一列（从可见列中找第一个非 selection 和 非 operation 的列）
  // 当 columnChecks 变化时，会自动重新计算
  const safeFirstColumn = computed(() => {
    const firstVisibleCol = visibleColumns.value.find(
      (col) => col.type !== 'selection' && col.prop !== 'operation'
    )
    return firstVisibleCol?.prop || 'image'
  })

  // 判断是否为第一列（firstColumn），排除勾选列
  const isFirstColumn = (prop: string) => {
    // 确保 firstColumn 不会是 selection 类型
    if (prop === 'selection' || prop === undefined) {
      return false
    }
    return prop === safeFirstColumn.value
  }

  // 处理单元格合并
  const handleSpanMethod = ({
    row,
    column
  }: {
    row: FlatRowData
    column: any
    rowIndex?: number
    columnIndex?: number
  }) => {
    // 选择列：父行和子行都正常显示（不合并），子行的 checkbox 通过 CSS 隐藏
    const columnProp = column?.property || column?.prop
    if (column?.type === 'selection' || columnProp === 'selection') {
      return {
        rowspan: 1,
        colspan: 1
      }
    }

    const isOperationColumn = columnProp === 'operation'
    const isFirstCol = isFirstColumn(columnProp)

    // 如果是父行
    if (row._isParent) {
      // 第一列：合并除操作列外的所有列（只合并列，不合并行）
      if (isFirstCol) {
        // 计算需要合并的列数（不包括选择列和操作列）
        return {
          rowspan: 1,
          colspan: normalColumnsCount.value
        }
      }

      // 操作列：正常显示
      if (isOperationColumn) {
        return {
          rowspan: 1,
          colspan: 1
        }
      }

      // 其他列（子行列）：父行隐藏
      return {
        rowspan: 0,
        colspan: 0
      }
    } else {
      // 如果是子行
      // 子行的所有列（包括操作列）都正常显示
      // 操作列在子行显示为空单元格
      return {
        rowspan: 1,
        colspan: 1
      }
    }
  }

  // 处理行样式类名
  const handleRowClassName = ({ row }: { row: FlatRowData }) => {
    return row._isParent ? 'parent-row' : 'child-row'
  }

  // 清理列属性，移除插槽相关的自定义属性，确保它们不会被 ElTableColumn 错误解释
  const cleanColumnProps = (col: ColumnOption) => {
    const columnProps = { ...col }
    // 删除自定义的插槽控制属性
    delete columnProps.useHeaderSlot
    delete columnProps.headerSlotName
    delete columnProps.headerTip
    delete columnProps.useSlot
    delete columnProps.slotName
    return columnProps
  }

  // 清理多级表头列属性，删除 children（因为子列在模板中手动渲染）
  const cleanColumnPropsWithChildren = (col: ColumnOption) => {
    const columnProps = { ...col }
    // 删除自定义的插槽控制属性
    delete columnProps.useHeaderSlot
    delete columnProps.headerSlotName
    delete columnProps.headerTip
    delete columnProps.useSlot
    delete columnProps.slotName
    // 删除 children，因为子列在模板中手动渲染
    delete columnProps.children
    return columnProps
  }

  // 获取实际的 storage key
  const storageKey = computed(() => {
    const key = props.tableKey || route.path
    return `art-table-pageSize-${key}`
  })

  // 列宽拖拽结束：更新记忆并保存到接口；Element Plus 第二参为 delta 不是 oldWidth
  const headerDragend = (newWidth: number, _delta: number, column: any) => {
    if (!props.habitColumnWidth || !column) return
    const prop = column.property ?? column.prop
    if (prop == null || newWidth == null || !Number.isFinite(Number(newWidth))) return
    // const minW = Number(column.minWidth) || 80
    // const w = Math.max(minW, Number(newWidth))
    const w = Number(newWidth)
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

  // ========== 自定义 Selection 功能（参照 ArtTable，解决 reserveSelection 跨页勾选问题） ==========
  // 说明：
  // - 仅维护“父行”的选中状态（子行 checkbox 由 CSS 隐藏，且不参与选择）
  // - selection-change 始终返回“所有已选父行”（包括跨页的），与 ElTable 原生行为不同

  // 存储跨页选中的 rowKey 值（仅父行）
  const selectedRowKeys = ref<Set<string | number>>(new Set())
  // 存储所有选中的父行数据（用于 selection-change 返回所有选中行）
  const selectedRowsMap = ref<Map<string | number, FlatRowData>>(new Map())
  // 存储所有曾经出现过的父行 rowKey（用于判断数据是否真的被删除）
  const allSeenRowKeys = ref<Set<string | number>>(new Set())

  // 获取行的唯一标识（与 ElTable 的 row-key 语义对齐）
  const getRowKey = (row: any): string | number | undefined => {
    const rk: any = (props as any).rowKey
    if (typeof rk === 'function') {
      try {
        return rk(row)
      } catch {
        // ignore
      }
    }
    const keyField = rk || 'id'
    return row?.[keyField] ?? row?.tempId ?? row?.id
  }

  // 获取当前页的所有“父行”（扁平化后的父行数据，包含 tempId）
  const getCurrentPageParentRows = (): FlatRowData[] => {
    return (flatTableData.value || []).filter((row) => row?._isParent)
  }

  // 判断行是否被选中（仅父行）
  const isRowSelected = (row: FlatRowData): boolean => {
    if (!row?._isParent) return false
    const key = getRowKey(row)
    if (key === undefined) return false
    return selectedRowKeys.value.has(key)
  }

  // 处理行选中/取消选中（仅父行）
  const handleRowSelect = (row: FlatRowData, val: CheckboxValueType) => {
    if (!row?._isParent) return
    const key = getRowKey(row)
    if (key === undefined) return

    const selected = val === true
    if (selected) {
      selectedRowKeys.value.add(key)
      selectedRowsMap.value.set(key, row)
    } else {
      selectedRowKeys.value.delete(key)
      selectedRowsMap.value.delete(key)
    }

    emit('selection-change', Array.from(selectedRowsMap.value.values()))
  }

  // 判断当前页是否全选（仅父行）
  const isCurrentPageAllSelected = computed(() => {
    const currentRows = getCurrentPageParentRows()
    if (currentRows.length === 0) return false
    return currentRows.every((row) => isRowSelected(row))
  })

  // 判断是否有跨页选中的数据（选中的父行不在当前页）
  const hasCrossPageSelected = computed(() => {
    if (selectedRowKeys.value.size === 0) return false
    const currentPageKeys = new Set(
      getCurrentPageParentRows()
        .map((row) => getRowKey(row))
        .filter((k): k is string | number => k !== undefined)
    )
    for (const key of selectedRowKeys.value) {
      if (!currentPageKeys.has(key)) return true
    }
    return false
  })

  // 判断当前页是否部分选中（仅父行）
  const isCurrentPagePartiallySelected = computed(() => {
    const currentRows = getCurrentPageParentRows()
    if (currentRows.length === 0) return false
    const selectedCount = currentRows.filter((row) => isRowSelected(row)).length
    return selectedCount > 0 && selectedCount < currentRows.length
  })

  // 全选状态（只要当前页父行全选就显示全选，不管是否有跨页选中）
  const isAllSelected = computed(() => isCurrentPageAllSelected.value)

  // 半选状态（当前页不是全选，但其他页存在勾选或当前页部分勾选时显示半选）
  const isIndeterminate = computed(() => {
    const currentRows = getCurrentPageParentRows()
    if (currentRows.length === 0) return false
    if (isCurrentPageAllSelected.value) return false
    if (hasCrossPageSelected.value) return true
    if (isCurrentPagePartiallySelected.value) return true
    return false
  })

  // 处理全选/取消全选（仅当前页父行）
  const handleSelectAll = (val: CheckboxValueType) => {
    const selected = val === true
    const currentRows = getCurrentPageParentRows()
    currentRows.forEach((row) => {
      const key = getRowKey(row)
      if (key === undefined) return
      if (selected) {
        selectedRowKeys.value.add(key)
        selectedRowsMap.value.set(key, row)
      } else {
        selectedRowKeys.value.delete(key)
        selectedRowsMap.value.delete(key)
      }
    })
    emit('selection-change', Array.from(selectedRowsMap.value.values()))
  }

  // 获取所有选中的父行数据（包括跨页的）
  const getSelectedRows = (): FlatRowData[] => {
    return Array.from(selectedRowsMap.value.values())
  }

  // 获取所有选中的父行 rowKey（包括跨页的）
  const getSelectedRowKeys = (): (string | number)[] => {
    return Array.from(selectedRowKeys.value)
  }

  // 清空所有选中
  const clearSelection = () => {
    selectedRowKeys.value.clear()
    selectedRowsMap.value.clear()
    emit('selection-change', [])
  }

  // 设置选中状态（只接受父行；如果传入子行会被忽略）
  const setSelection = (rows: any[]) => {
    selectedRowKeys.value.clear()
    selectedRowsMap.value.clear()
    ;(rows || []).forEach((row: any) => {
      if (row && row._isParent === false) return
      const key = getRowKey(row)
      if (key === undefined) return
      selectedRowKeys.value.add(key)
      selectedRowsMap.value.set(key, row)
    })
    emit('selection-change', Array.from(selectedRowsMap.value.values()))
  }

  // 切换行选中状态（仅父行）
  const toggleRowSelection = (row: FlatRowData) => {
    if (!row?._isParent) return
    const key = getRowKey(row)
    if (key === undefined) return

    if (selectedRowKeys.value.has(key)) {
      selectedRowKeys.value.delete(key)
      selectedRowsMap.value.delete(key)
    } else {
      selectedRowKeys.value.add(key)
      selectedRowsMap.value.set(key, row)
    }
    emit('selection-change', Array.from(selectedRowsMap.value.values()))
  }

  // 监听数据变化：更新选中行引用，并清理被删除的数据选中状态（参照 ArtTable）
  watch(
    () => flatTableData.value,
    (newFlat) => {
      const parentRows = (newFlat || []).filter((row) => row?._isParent)
      if (parentRows.length === 0) return

      const currentPageKeys = new Set<string | number>()
      parentRows.forEach((row) => {
        const key = getRowKey(row)
        if (key === undefined) return
        currentPageKeys.add(key)
        allSeenRowKeys.value.add(key)
      })

      const keysToRemove: (string | number)[] = []
      selectedRowKeys.value.forEach((key) => {
        if (!currentPageKeys.has(key) && !allSeenRowKeys.value.has(key)) {
          keysToRemove.push(key)
        }
      })

      if (keysToRemove.length > 0) {
        keysToRemove.forEach((key) => {
          selectedRowKeys.value.delete(key)
          selectedRowsMap.value.delete(key)
        })
        emit('selection-change', Array.from(selectedRowsMap.value.values()))
      }

      // 更新当前页数据的引用（如果数据对象发生变化）
      parentRows.forEach((row) => {
        const key = getRowKey(row)
        if (key === undefined) return
        if (selectedRowKeys.value.has(key)) {
          selectedRowsMap.value.set(key, row)
        }
      })
    }
  )

  const emit = defineEmits<{
    (e: 'pagination:size-change', val: number): void
    (e: 'pagination:current-change', val: number): void
    (e: 'selection-change', selection: any[]): void
  }>()

  // 表格头部默认高度常量
  const DEFAULT_TABLE_HEADER_HEIGHT = 44
  // 分页器与表格之间的间距常量（计算属性，响应 showTableHeader 变化）
  const PAGINATION_SPACING = computed(() => (props.showTableHeader ? 6 : 15))
  // 表格头部与表格之间的间距常量
  const TABLE_HEADER_SPACING = 14

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

  // 组件挂载后查找表格头部并初始化容器偏移量
  onMounted(() => {
    nextTick(() => {
      observeTableHeader()
      updateContainerTopOffset()
    })
    if (props.habitColumnWidth && (props.columns || []).length > 0) {
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

  // 组件卸载时清理 ResizeObserver
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
    getSelectedRows,
    getSelectedRowKeys,
    clearSelection,
    setSelection,
    toggleRowSelection
  })
</script>

<style lang="scss" scoped>
  @use '@/components/core/tables/art-table/style';

  .art-table {
    &.p-table {
      & > div {
        margin-top: 0;
      }

      :deep(th.el-table__cell) {
        padding: 6px 0;
        background: #fff !important;
        border-color: #fff;
        border-top: 1px solid #ebeef5 !important;
        border-bottom: 1px solid #ebeef5;

        .cell {
          border-right: 1px solid #ebeef5;
        }
      }

      :deep(
        .el-table.is-scrolling-left.el-table--border
          .el-table-fixed-column--left.is-last-column.el-table__cell
      ) {
        border-right: 1px solid transparent;
      }

      :deep(th.parent-children-table-selection-column) {
        .cell {
          border-right: 1px solid #fff;
        }
      }

      :deep(th.parent-children-table-selection-column + th .cell) {
        border-left: 1px solid #ebeef5;
      }
    }

    :deep(.el-form-item--default) {
      .el-form-item__content {
        text-align: left !important;
      }
    }

    :deep(tr td) {
      border-right-color: #fff;
      border-left-color: #fff;
    }

    .parent-info {
      box-sizing: border-box;
      display: flex;
      flex-wrap: nowrap;
      gap: 12px;
      align-items: center;

      /* 宽屏时把各块分散到整行；总宽度超出时仍单行并由 overflow-x 横向滚动 */
      justify-content: space-between;
      width: 100%;
      min-width: 0;
      max-width: 100%;
      overflow: auto hidden;
      font-size: 12px;
      line-height: 1.5;
      color: #606266;

      &.simple {
        gap: 12px;
      }

      > * {
        flex-shrink: 0;
        white-space: nowrap;
      }

      :deep(.el-form-item--default) {
        margin-bottom: 0 !important;
      }

      :deep(.el-form-item) {
        flex-wrap: nowrap;
        margin-bottom: 0 !important;
        white-space: nowrap;
      }

      :deep(.el-form-item__label),
      :deep(.el-form-item__content) {
        white-space: nowrap;
      }

      :deep(.el-form-item__content) {
        font-size: 12px !important;
        color: #303133 !important;
      }
    }

    td {
      .cell {
        display: flex;
        align-items: center;

        .el-upload-list.is-disabled {
          margin-top: -15px !important;
        }
      }
    }

    :deep(.parent-row) {
      background-color: var(--el-fill-color-lighter);

      .el-table__expand-icon {
        display: none !important;
      }

      td {
        padding: 8px 0;

        .cell {
          display: block;
          min-width: 0;
          overflow-x: hidden;
        }
      }
    }

    :deep(.el-table__expand-icon) {
      display: none;
    }

    :deep(.child-row) {
      background-color: var(--art-main-bg-color);
    }

    :deep(.el-table-fixed-column--right) {
      .cell {
        div {
          display: flex;
          align-items: center;
        }
      }
    }

    :deep(.el-table__body) {
      .parent-row:hover > td {
        background-color: var(--el-fill-color-light) !important;
      }

      .child-row:hover > td {
        background-color: var(--el-fill-color-lighter) !important;
      }

      // 子行的选择列隐藏 checkbox
      .child-row .el-checkbox {
        display: none;
      }

      // 确保子行选择列仍然有正确的宽度和布局
      .child-row .el-table__cell:first-child {
        padding: 0;
        text-align: center;
      }
    }
  }
</style>
