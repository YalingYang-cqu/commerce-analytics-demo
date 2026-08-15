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
        headerCellStyle,
        data: flatTableData,
        spanMethod: handleSpanMethod,
        rowClassName: handleRowClassName
      }"
    >
      <!-- 渲染父行列（在子行列之前，表头不显示标签） -->
      <template v-for="parentCol in parentColumns" :key="`parent-${parentCol.prop}`">
        <ElTableColumn
          :prop="parentCol.prop"
          :label="''"
          :width="parentCol.width"
          :min-width="parentCol.minWidth"
          :fixed="parentCol.fixed"
          :show-overflow-tooltip="false"
          class-name="parent-column"
        >
          <template #default="slotScope">
            <template v-if="slotScope.row._isParent">
              <template v-if="parentCol.useSlot">
                <slot
                  :name="parentCol.slotName || parentCol.prop"
                  v-bind="{
                    ...slotScope,
                    prop: parentCol.prop,
                    value: slotScope.row[parentCol.prop],
                    row: slotScope.row,
                    isParent: slotScope.row._isParent,
                    originalParent: slotScope.row._originalParent
                  }"
                />
              </template>
              <template v-else>
                {{ slotScope.row[parentCol.prop] }}
              </template>
            </template>
          </template>
        </ElTableColumn>
      </template>

      <!-- 渲染子行列（与表头对应） -->
      <template v-for="col in columns" :key="`${col.prop || col.type || col.label}`">
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
            </ElTableColumn>
          </template>
        </ElTableColumn>
        <!--勾选列 -->
        <ElTableColumn
          v-else-if="col.type === 'selection'"
          v-bind="{
            ...cleanColumnProps(col),
            reserveSelection: col.reserveSelection !== undefined ? col.reserveSelection : true
          }"
          :width="col.width || 55"
          :selectable="(row: FlatRowData) => row._isParent === true"
        ></ElTableColumn>
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
  import { storeToRefs } from 'pinia'
  import { useRoute } from 'vue-router'
  import { ColumnOption } from '@/types'
  import { useTableStore } from '@/store/modules/table'
  import { useCommon } from '@/composables/useCommon'
  import { useElementSize, useWindowSize } from '@vueuse/core'

  defineOptions({ name: 'ParentTable' })

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

  /** 父行列配置接口 */
  interface ParentColumnOption {
    /** 列属性名 */
    prop: string
    /** 列标题 */
    label: string
    /** 列宽度 */
    width?: string | number
    /** 最小列宽度 */
    minWidth?: string | number
    /** 固定列 */
    fixed?: boolean | 'left' | 'right'
    /** 是否使用插槽 */
    useSlot?: boolean
    /** 插槽名称 */
    slotName?: string
  }

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

  /** ParentTable 组件的 Props 接口 */
  interface ParentTableProps extends TableProps<Record<string, any>> {
    /** 加载状态 */
    loading?: boolean
    /** 列渲染配置（子行显示的列，与表头对应） */
    columns?: ColumnOption[]
    /** 父行列配置（父行显示的列，不在表头中） */
    parentColumns?: ParentColumnOption[]
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
    /** 子节点字段名，默认为 'children' */
    childrenKey?: string
  }

  const props = withDefaults(defineProps<ParentTableProps>(), {
    columns: () => [],
    parentColumns: () => [],
    fit: true,
    showHeader: true,
    stripe: undefined,
    border: undefined,
    size: undefined,
    emptyHeight: '100%',
    emptyText: '暂无数据',
    showTableHeader: true,
    rowKey: 'id',
    childrenKey: 'children'
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
  // 父行列配置
  const parentColumns = computed(() => props.parentColumns || [])

  // 数据是否为空
  const isEmpty = computed(() => {
    const data = props.data || []
    return data.length === 0
  })

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
      const children = parentRow[props.childrenKey] || []

      // 添加父行
      const parentFlatRow: FlatRowData = {
        ...parentRow,
        _isParent: true,
        _parentIndex: result.length,
        _childrenCount: children.length,
        _originalParent: parentRow
      }
      result.push(parentFlatRow)

      // 添加所有子行（默认全部展开）
      if (children.length > 0) {
        children.forEach((childRow: any) => {
          const childFlatRow: FlatRowData = {
            ...childRow,
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
          _originalParent: parentRow
        }
        result.push(emptyChildRow)
      }
    })

    return result
  })

  // 计算子行列数量（不包括选择列）
  const childColumnsCount = computed(() => {
    return props.columns.filter((col) => col.type !== 'selection').length
  })

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
    // 选择列特殊处理：父行合并，子行隐藏
    if (column?.type === 'selection') {
      if (row._isParent) {
        const childrenCount = row._childrenCount || 1
        return {
          rowspan: childrenCount,
          colspan: 1
        }
      } else {
        return {
          rowspan: 0,
          colspan: 0
        }
      }
    }

    // 获取当前列的 prop（优先使用 column.property，否则使用 columnIndex 判断）
    const columnProp = column?.property || column?.prop
    const parentColIndex = columnProp ? getParentColumnIndex(columnProp) : -1
    const isParentColumn = parentColIndex !== -1

    // 如果是父行
    if (row._isParent) {
      const childrenCount = row._childrenCount || 1

      if (isParentColumn) {
        // 第一个父行列：跨越所有子行列
        if (parentColIndex === 0) {
          return {
            rowspan: childrenCount,
            colspan: childColumnsCount.value + 1 // +1 包括第一个父行列本身
          }
        } else {
          // 其他父行列（如操作列）：只合并行
          return {
            rowspan: childrenCount,
            colspan: 1
          }
        }
      } else {
        // 非父行列（子行列）：隐藏单元格（子行会显示）
        return {
          rowspan: 0,
          colspan: 0
        }
      }
    } else {
      // 如果是子行
      if (isParentColumn) {
        // 父行列：隐藏单元格（父行已显示）
        return {
          rowspan: 0,
          colspan: 0
        }
      }
      // 子行列：正常显示，不合并
      // 第一个父行列跨越了所有子行列，但子行的子行列应该正常显示
      return {
        rowspan: 1,
        colspan: 1
      }
    }
  }

  // 获取父行列的索引
  const getParentColumnIndex = (prop: string): number => {
    if (!prop) return -1
    return props.parentColumns.findIndex((col) => col.prop === prop)
  }

  // 处理行样式类名
  const handleRowClassName = ({ row }: { row: FlatRowData }) => {
    return row._isParent ? 'parent-row' : 'child-row'
  }

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

  // 清理列属性，移除插槽相关的自定义属性，确保它们不会被 ElTableColumn 错误解释
  const cleanColumnProps = (col: ColumnOption) => {
    const columnProps = { ...col }
    // 删除自定义的插槽控制属性
    delete columnProps.useHeaderSlot
    delete columnProps.headerSlotName
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

  const emit = defineEmits<{
    (e: 'pagination:size-change', val: number): void
    (e: 'pagination:current-change', val: number): void
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

  // 组件挂载后查找表格头部并初始化容器偏移量
  onMounted(() => {
    nextTick(() => {
      observeTableHeader()
      updateContainerTopOffset()
    })
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
  })

  defineExpose({
    scrollToTop,
    elTableRef
  })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
