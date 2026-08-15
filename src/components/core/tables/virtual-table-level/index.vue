<!-- 层级列表：VxeGrid + gridOptions（树形参考 https://vxetable.cn/#/demo/tree ）；列/分页/勾选等与 virtual-table-new 对齐 -->
<template>
  <div
    ref="containerRef"
    :class="{
      'is-empty': isEmpty,
      'virtual-table-level': true,
      'art-table': true,
      'no-border': !border
    }"
    :style="containerHeight"
  >
    <div ref="tableAreaRef" class="virtual-table-level__table-area">
      <VxeGrid
        ref="gridRef"
        v-bind="gridOptions"
        class="virtual-level-vxe-grid"
        @scroll="handleTableScroll"
        @resizable-change="onResizableChange"
        @toggle-tree-expand="onTreeExpand"
      >
        <template #vt_sel_header>
          <div class="vt-cell-center">
            <ElCheckbox
              :model-value="isAllSelected"
              :indeterminate="isIndeterminate"
              @change="(val) => handleSelectAll(!!val, selectionColumn)"
            />
          </div>
        </template>
        <template #vt_sel_default="{ row }">
          <div class="vt-cell-center">
            <ElCheckbox
              v-if="!isTreeTableChildRow(row)"
              :model-value="isRowSelected(row)"
              :disabled="isSelectionDisabled(row, selectionColumn)"
              @change="(val) => handleRowSelect(row, !!val)"
            />
          </div>
        </template>

        <template #vt_seq_default="scope">
          <span v-if="hasSeqColumn">{{ seqCellText(scope) }}</span>
        </template>

        <template #vt_expand_default="{ row }">
          <component v-if="expandColumn?.formatter" :is="expandColumn.formatter(row)" />
          <slot v-else name="expand" :row="row" />
        </template>

        <template v-for="meta in gridSlotMetas" :key="meta.key" #[meta.slotName]="slotScope">
          <template v-if="meta.kind === 'header'">
            <slot
              :name="meta.col.headerSlotName || `${meta.col.prop}-header`"
              v-bind="mapHeaderScope(slotScope, meta.col)"
            >
              <TableHeaderTip
                v-if="meta.col.headerTip"
                :label="String(meta.col.label ?? '')"
                :tip="meta.col.headerTip"
              />
              <template v-else>{{ meta.col.label }}</template>
            </slot>
          </template>
          <template v-else-if="meta.kind === 'copy'">
            <div
              class="cell-copy"
              :title="`点击复制${meta.col.label}`"
              @click="
                handleCopy(
                  meta.col.prop ? String(slotScope.row[meta.col.prop as string] || '') : ''
                )
              "
            >
              {{ meta.col.prop ? slotScope.row[meta.col.prop as string] : '' }}
            </div>
          </template>
          <template v-else-if="meta.kind === 'ellipsis'">
            <ElTooltip
              :content="meta.col.prop ? String(slotScope.row[meta.col.prop as string] || '') : ''"
              placement="top"
            >
              <div class="cell-ellipsis">
                {{ meta.col.prop ? slotScope.row[meta.col.prop as string] : '' }}
              </div>
            </ElTooltip>
          </template>
          <template v-else>
            <slot
              :name="meta.col.slotName || meta.col.prop"
              v-bind="mapBodyScope(slotScope, meta.col)"
            />
          </template>
        </template>

        <template #empty>
          <div v-if="loading"></div>
          <ElEmpty v-else :description="emptyText" :image-size="120" />
        </template>
      </VxeGrid>
    </div>

    <div
      v-if="showPagination"
      class="pagination custom-pagination sticky-footer"
      :class="mergedPaginationOptions?.align"
      ref="paginationRef"
    >
      <ElPagination
        v-bind="mergedPaginationOptions"
        :total="pagination?.total"
        :disabled="loading"
        :page-size="pagination?.pageSize"
        :current-page="pagination?.currentPage"
        :page-sizes="[20, 50, 100, 200, 500]"
        size="small"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, nextTick, onMounted, onUnmounted, watch, useAttrs } from 'vue'
  import { ElTooltip, ElCheckbox } from 'element-plus'
  import { storeToRefs } from 'pinia'
  import { useRoute } from 'vue-router'
  import type { ColumnOption } from '@/types'
  import { TableSizeEnum } from '@/enums/formEnum'
  import { useTableStore } from '@/store/modules/table'
  import { useCommon } from '@/composables/useCommon'
  import { useElementSize, useWindowSize, useThrottleFn } from '@vueuse/core'
  import { handleCopy } from '@/utils/common-util'
  import { getHabitsApi, saveUserHabitsApi } from '@/api/system-manage'
  import { getColumnKey, normalizeColumnKey } from '@/composables/useTableColumns'
  import TableHeaderTip from '@/components/core/tables/table-header-tip/index.vue'

  defineOptions({ name: 'VirtualTableLevel', inheritAttrs: false })

  interface PaginationConfig {
    total: number
    currentPage: number
    pageSize: number
  }

  interface PaginationOptions {
    pageSizes?: number[]
    align?: 'left' | 'center' | 'right'
    layout?: string
    background?: boolean
    hideOnSinglePage?: boolean
    size?: 'small' | 'default' | 'large'
    pagerCount?: number
  }

  interface ScrollYConfig {
    enabled?: boolean
    gt?: number
    oSize?: number
    [key: string]: unknown
  }

  /** 与 el-table 的 tree-props 对齐：子节点字段名、懒加载 hasChildren 字段名 */
  interface TreePropsConfig {
    children?: string
    hasChildren?: string
  }

  interface VirtualTableNewProps {
    loading?: boolean
    columns?: ColumnOption[]
    columnChecks?: Array<{ prop: string; checked: boolean; [key: string]: any }>
    pagination?: PaginationConfig
    paginationOptions?: PaginationOptions
    emptyHeight?: string
    emptyText?: string
    showTableHeader?: boolean
    rowKey?: string | ((row: any) => string | number)
    tableKey?: string
    tableName?: string
    habitColumnWidth?: boolean
    autoHeight?: boolean
    data?: any[]
    height?: string | number
    stripe?: boolean
    border?: boolean | string
    size?: 'large' | 'default' | 'small'
    showHeader?: boolean
    headerCellStyle?: Record<string, any> | (() => Record<string, any>)
    cellStyle?: Record<string, any> | ((params: any) => Record<string, any>)
    scrollY?: ScrollYConfig
    /** 树形数据（对齐 ArtTable / el-table 的 tree-props） */
    treeProps?: TreePropsConfig
    /** 是否默认展开全部节点（对齐 el-table default-expand-all） */
    defaultExpandAll?: boolean
    /**
     * 树表是否强制开启纵向虚拟滚动（默认 false）。
     * vxe 4.x 有 treeConfig 时，仅 tree-config.transform 模式才会启用纵向虚拟；为 true 时组件会将嵌套子行拍平并自动加上 transform 所需字段。
     * 树+虚拟在部分场景仍可能错位，默认关闭、靠分页控量；确有需要再设 true。
     */
    treeVirtualScroll?: boolean
  }

  const props = withDefaults(defineProps<VirtualTableNewProps>(), {
    columns: () => [],
    columnChecks: () => [],
    stripe: undefined,
    border: undefined,
    size: undefined,
    emptyHeight: '100%',
    emptyText: '暂无数据',
    showTableHeader: true,
    rowKey: 'id',
    habitColumnWidth: true,
    autoHeight: false,
    showHeader: true,
    data: () => [],
    scrollY: () => ({ enabled: true, gt: 0 }),
    defaultExpandAll: false,
    treeVirtualScroll: true
  })

  const attrs = useAttrs()
  /** 避免把仅给 el-table 的属性透传给 VxeGrid */
  const tableAttrs = computed(() => {
    const raw = { ...(attrs as Record<string, unknown>) }
    delete raw['tree-props']
    delete raw.treeProps
    delete raw['default-expand-all']
    delete raw.defaultExpandAll
    delete raw.height
    delete raw.scrollY
    delete raw['scroll-y']
    delete raw['tree-virtual-scroll']
    delete raw.treeVirtualScroll
    return raw
  })

  const emit = defineEmits<{
    (e: 'pagination:size-change', val: number): void
    (e: 'pagination:current-change', val: number): void
    (e: 'selection-change', rows: any[]): void
  }>()

  const { width, height: windowHeight } = useWindowSize()
  const route = useRoute()
  const gridRef = ref<any>(null)
  const paginationRef = ref<HTMLElement>()
  const containerRef = ref<HTMLElement>()
  /** 仅包裹 VxeTable，用于取像素高度（不含分页），纵向虚拟滚动依赖 */
  const tableAreaRef = ref<HTMLElement>()
  const tableStore = useTableStore()
  const { isBorder, isZebra, tableSize, isFullScreen, isHeaderBackground } = storeToRefs(tableStore)

  const tableHeaderHeight = ref(0)
  const containerTopOffset = ref(0)
  let resizeObserver: ResizeObserver | null = null

  const LAYOUT = {
    MOBILE: 'prev, pager, next, sizes, jumper, total',
    IPAD: 'prev, pager, next, jumper, total',
    DESKTOP: 'total, prev, pager, next, sizes, jumper'
  }

  const layout = computed(() => {
    if (width.value < 768) return LAYOUT.MOBILE
    if (width.value < 1024) return LAYOUT.IPAD
    return LAYOUT.DESKTOP
  })

  const DEFAULT_PAGINATION_OPTIONS: PaginationOptions = {
    pageSizes: [20, 50, 100, 200, 500],
    align: 'right',
    background: true,
    layout: layout.value,
    hideOnSinglePage: false,
    size: 'default',
    pagerCount: width.value > 1200 ? 7 : 5
  }

  const mergedPaginationOptions = computed(() => ({
    ...DEFAULT_PAGINATION_OPTIONS,
    ...props.paginationOptions,
    layout: props.paginationOptions?.layout ?? layout.value,
    pagerCount: props.paginationOptions?.pagerCount ?? (width.value > 1200 ? 7 : 5)
  }))

  const border = computed(() => props.border ?? isBorder.value)
  const stripe = computed(() => props.stripe ?? isZebra.value)

  /** vxe border 与 Element 的 boolean / 字符串并存，用 any 避免类型与运行时配置不一致 */
  const vxeBorder = computed((): any => {
    const b = border.value
    if (b === false) return false
    if (b === true) return 'full'
    if (typeof b === 'string') return b
    return 'full'
  })

  const vxeSize = computed(() => {
    const s = props.size ?? tableSize.value
    const map: Record<string, 'medium' | 'small' | 'mini'> = {
      [TableSizeEnum.LARGE]: 'medium',
      [TableSizeEnum.DEFAULT]: 'small',
      [TableSizeEnum.SMALL]: 'mini'
    }
    return map[String(s)] || 'mini'
  })

  const isEmpty = computed(() => (props.data?.length ?? 0) === 0)
  const { height: paginationHeight } = useElementSize(paginationRef)
  const { height: tableAreaHeight } = useElementSize(tableAreaRef)

  const PAGINATION_SPACING = computed(() => (props.showTableHeader ? 6 : 15))
  const DEFAULT_TABLE_HEADER_HEIGHT = 44
  const TABLE_HEADER_SPACING = 12

  const containerHeight = computed(() => {
    let offset = 0
    if (!props.showTableHeader) {
      offset = paginationHeight.value === 0 ? 0 : paginationHeight.value + PAGINATION_SPACING.value
    } else {
      const headerHeight = tableHeaderHeight.value || DEFAULT_TABLE_HEADER_HEIGHT
      const paginationOffset =
        paginationHeight.value === 0 ? 0 : paginationHeight.value + PAGINATION_SPACING.value
      offset = headerHeight + paginationOffset + TABLE_HEADER_SPACING
    }
    return { height: offset === 0 ? '100%' : `calc(100% - ${offset}px)` }
  })

  const showPagination = computed(() => props.pagination && !isEmpty.value)

  const computedTableHeight = computed(() => {
    if (isFullScreen.value) return '100%'
    if (isEmpty.value && !props.loading) return props.emptyHeight
    if (props.height != null && props.height !== '') return props.height

    if (containerRef.value && windowHeight.value > 0) {
      const topOffset = containerTopOffset.value || containerRef.value.getBoundingClientRect().top
      const headerHeight = props.showTableHeader
        ? (tableHeaderHeight.value || DEFAULT_TABLE_HEADER_HEIGHT) + TABLE_HEADER_SPACING
        : 0
      const paginationOffset = showPagination.value
        ? paginationHeight.value + PAGINATION_SPACING.value
        : 0
      const safeMargin = 20
      const availableHeight =
        windowHeight.value - topOffset - headerHeight - paginationOffset - safeMargin
      return Math.max(availableHeight, 300)
    }
    return '100%'
  })

  const resolvedVxeHeight = computed((): number | undefined => {
    if (props.autoHeight) return undefined

    const h = computedTableHeight.value
    if (typeof h === 'number' && Number.isFinite(h) && h > 0) {
      return Math.floor(h)
    }
    if (typeof h === 'string' && h.includes('px')) {
      const n = parseInt(h, 10)
      if (!Number.isNaN(n) && n > 0) return n
    }

    const areaH = Math.floor(tableAreaHeight.value)
    if (areaH > 1) {
      return Math.max(areaH, 200)
    }

    if (containerRef.value && windowHeight.value > 0) {
      const topOffset = containerTopOffset.value || containerRef.value.getBoundingClientRect().top
      const headerHeight = props.showTableHeader
        ? (tableHeaderHeight.value || DEFAULT_TABLE_HEADER_HEIGHT) + TABLE_HEADER_SPACING
        : 0
      const paginationOffset = showPagination.value
        ? paginationHeight.value + PAGINATION_SPACING.value
        : 0
      const safeMargin = 20
      const availableHeight =
        windowHeight.value - topOffset - headerHeight - paginationOffset - safeMargin
      return Math.max(Math.floor(availableHeight), 300)
    }

    return 480
  })

  const resolvedHeaderCellStyle = computed(() => {
    const base = {
      background: isHeaderBackground.value
        ? 'var(--el-fill-color-lighter)'
        : 'var(--art-main-bg-color)'
    }
    const extra = props.headerCellStyle
    if (typeof extra === 'function') return () => ({ ...base, ...extra() })
    return { ...base, ...(extra || {}) }
  })

  const resolvedCellStyle = computed(() => {
    const def = () => ({
      whiteSpace: 'normal' as const,
      wordBreak: 'break-word' as const,
      padding: '4px 0'
    })
    if (!props.cellStyle) return def
    if (typeof props.cellStyle === 'function') {
      const fn = props.cellStyle
      return (p: any) => ({ ...def(), ...fn(p) })
    }
    const styleObj = props.cellStyle
    return () => ({ ...def(), ...styleObj })
  })

  const keyField = computed(() =>
    typeof props.rowKey === 'function' ? '__rowKey__' : String(props.rowKey || 'id')
  )

  const columnConfig = computed(() => ({
    resizable: props.habitColumnWidth
  }))

  const isTreeEnabled = computed(
    () => !!(props.treeProps && props.treeProps.children && String(props.treeProps.children))
  )

  /**
   * 仅配置了 treeProps 但当前数据无子节点时，仍按「扁表」对待，避免误判为树表而关闭纵向虚拟滚动。
   * 真树数据（存在非空 children）仍默认关虚拟，需开时设 tree-virtual-scroll。
   */
  const hasNestedTreeRows = computed(() => {
    if (!isTreeEnabled.value || !props.treeProps?.children) return false
    const key = String(props.treeProps.children)
    const rows = props.data ?? []
    const limit = Math.min(rows.length, 200)
    for (let i = 0; i < limit; i++) {
      const ch = rows[i]?.[key]
      if (Array.isArray(ch) && ch.length > 0) return true
    }
    return false
  })

  /**
   * vxe-table 4.x：有 treeConfig 时，仅当 tree-config.transform 为 true 才会开启纵向虚拟（见 updateScrollYStatus）。
   * 嵌套 children 需先拍成「带父 id 的扁表」，由 vxe 内部 toArrayTree 再建树。
   */
  const useVxeTreeTransform = computed(
    () =>
      isTreeEnabled.value &&
      props.treeVirtualScroll === true &&
      hasNestedTreeRows.value &&
      !!props.treeProps?.children
  )

  const VT_TREE_PARENT_FIELD = '__vtParentId__'
  const VT_TREE_MAP_CHILDREN = '__vtChildrenMap__'

  function flattenNestedTreeForVxeVirtual(
    roots: any[],
    childrenKey: string,
    getRowId: (row: any) => string | number
  ): any[] {
    const out: any[] = []
    const visit = (row: any, parentId: string | number | null) => {
      const copy = { ...row }
      delete copy[childrenKey]
      copy[VT_TREE_PARENT_FIELD] = parentId
      out.push(copy)
      const children = row[childrenKey]
      if (!Array.isArray(children) || children.length === 0) return
      const pid = getRowId(row)
      for (const c of children) {
        visit(c, pid)
      }
    }
    for (const r of roots) {
      visit(r, null)
    }
    return out
  }

  const rowConfig = computed(() => ({
    keyField: keyField.value,
    /** 树表行 hover 会触发大量重绘，关闭可减轻卡顿 */
    isHover: !isTreeEnabled.value
  }))

  /** vxe 树形：须指定 children 字段；展开图标由带 tree-node 的列渲染（与官网树表一致） */
  const resolvedTreeConfig = computed(() => {
    if (!isTreeEnabled.value || !props.treeProps?.children) return undefined
    const children = props.treeProps.children
    const base: Record<string, any> = {
      children,
      indent: 20,
      expandAll: props.defaultExpandAll === true
    }
    if (props.treeProps.hasChildren) {
      base.hasChild = props.treeProps.hasChildren
    }
    if (useVxeTreeTransform.value) {
      const rowField =
        typeof props.rowKey === 'function' ? '__rowKey__' : String(props.rowKey || 'id')
      return {
        ...base,
        transform: true,
        rowField,
        parentField: VT_TREE_PARENT_FIELD,
        mapChildrenField: VT_TREE_MAP_CHILDREN
      }
    }
    return base
  })

  const colLeafKey = (col: ColumnOption) =>
    String(getColumnKey(col) ?? (col as any).prop ?? (col as any).label ?? '')

  /** 树表下自动把「树展开图标」挂在第一个非特殊列；列上可设 treeNode: true / false 覆盖 */
  const treeNodeColumnKey = computed(() => {
    if (!isTreeEnabled.value) return ''
    const skipTypes = new Set(['selection', 'expand', 'globalIndex', 'index'])
    for (const col of displayColumns.value) {
      if (col.children && col.children.length) {
        for (const child of col.children) {
          if (skipTypes.has(String((child as any).type))) continue
          const k = colLeafKey(child)
          if (k) return k
        }
        continue
      }
      if (skipTypes.has(String((col as any).type))) continue
      const k = colLeafKey(col)
      if (k) return k
    }
    return ''
  })

  const isTreeNodeColumn = (col: ColumnOption) => {
    if (!isTreeEnabled.value) return false
    if ((col as any).treeNode === false) return false
    if ((col as any).treeNode === true) return true
    return colLeafKey(col) === treeNodeColumnKey.value
  }

  /**
   * 仅 recalculate：refreshColumn 代价大且易闪烁错位，不再调用。
   */
  let layoutSyncRaf: number | null = null
  const syncFixedLayout = () => {
    if (layoutSyncRaf != null) cancelAnimationFrame(layoutSyncRaf)
    layoutSyncRaf = requestAnimationFrame(() => {
      layoutSyncRaf = null
      nextTick(() => {
        gridRef.value?.recalculate?.()
      })
    })
  }

  let layoutDebounceTimer: ReturnType<typeof setTimeout> | null = null
  const syncFixedLayoutDebounced = () => {
    if (layoutDebounceTimer != null) clearTimeout(layoutDebounceTimer)
    layoutDebounceTimer = setTimeout(() => {
      layoutDebounceTimer = null
      syncFixedLayout()
    }, 180)
  }

  const onTreeExpand = () => {
    syncFixedLayout()
  }

  const getStableRowIdForTree = (row: any): string | number => {
    if (typeof props.rowKey === 'function') {
      return (props.rowKey as (r: any) => string | number)(row)
    }
    return row[props.rowKey as string]
  }

  const tableRows = computed(() => {
    let rows = props.data ?? []
    if (useVxeTreeTransform.value && props.treeProps?.children) {
      rows = flattenNestedTreeForVxeVirtual(
        rows,
        String(props.treeProps.children),
        getStableRowIdForTree
      )
    }
    if (typeof props.rowKey === 'function') {
      const fn = props.rowKey as (row: any) => string | number
      return rows.map((r) => ({ ...r, __rowKey__: fn(r) }))
    }
    return rows
  })

  const estimatedRowHeight = ref(32)
  /**
   * 纵向虚拟：默认与 virtual-table-new 一致开启；真树且未设 tree-virtual-scroll 时关闭（避免错位）。
   * 设 tree-virtual-scroll 时会走 vxe 的 transform 虚拟树并拍平数据源。
   */
  const resolvedScrollY = computed(() => {
    const user = props.scrollY ? { ...props.scrollY } : {}
    const gt = user.gt != null ? Number(user.gt) : 0
    const scrollEnabledUser = (user as { enabled?: boolean }).enabled
    delete (user as { enabled?: boolean }).enabled
    delete (user as { gt?: number }).gt
    const allowVirtual =
      scrollEnabledUser !== false && (!hasNestedTreeRows.value || props.treeVirtualScroll === true)
    return {
      gt,
      ...user,
      enabled: allowVirtual,
      sItemHeight: estimatedRowHeight.value
    }
  })

  let measureRaf: number | null = null
  const cancelMeasure = () => {
    if (measureRaf != null) {
      cancelAnimationFrame(measureRaf)
      measureRaf = null
    }
  }

  const runMeasure = () => {
    const rootEl = gridRef.value?.$el as HTMLElement | undefined
    if (!rootEl) return
    const rows = rootEl.querySelectorAll(
      '.vxe-table--body-wrapper .vxe-body--row, .vxe-grid--body-wrapper .vxe-body--row'
    )
    if (!rows || rows.length === 0) return
    let total = 0
    let count = 0
    rows.forEach((row) => {
      const h = row.getBoundingClientRect().height
      if (h && Number.isFinite(h)) {
        total += h
        count += 1
      }
    })
    if (count > 0) {
      const avg = Math.max(1, Math.round(total / count))
      estimatedRowHeight.value = Math.round(estimatedRowHeight.value * 0.7 + avg * 0.3)
    }
  }

  const measureRenderedRowHeights = () => {
    cancelMeasure()
    measureRaf = requestAnimationFrame(() => {
      measureRaf = null
      runMeasure()
    })
  }

  /** 滚动时频繁 getBoundingClientRect 会卡顿；仅纵向虚拟开启时纠行高 */
  const measureOnScrollThrottled = useThrottleFn(() => {
    if (resolvedScrollY.value.enabled) {
      measureRenderedRowHeights()
    }
  }, 280)

  const handleTableScroll = () => {
    measureOnScrollThrottled()
  }

  const storageKey = computed(() => {
    const key = props.tableKey || route.path
    return `art-table-pageSize-${key}`
  })

  const habitKey = computed(() => {
    const path = String(route.path).replace(/\//g, '_')
    const name = props.tableName ?? props.tableKey
    return name ? `${name}${path}_w` : `${path}_w`
  })

  const columnWidthOverrides = ref<Record<string, number>>({})

  const baseColumns = computed<ColumnOption[]>(() => {
    const cols = props.columns || []
    if (!props.columnChecks || props.columnChecks.length === 0) return cols
    const colByKey = new Map<string, ColumnOption<any>>()
    cols.forEach((col: any) => {
      const key = getColumnKey(col) ?? col.label ?? col.type
      if (key != null) colByKey.set(String(key), col)
    })
    const ordered: ColumnOption<any>[] = []
    props.columnChecks.forEach((check: any) => {
      const rawKey = check.prop ?? check.name
      if (rawKey === null) return
      const key = normalizeColumnKey(rawKey) ?? String(rawKey)
      const col = colByKey.get(key)
      if (col) {
        const checked = check.checked !== false
        if ((col as any).type === 'selection' || checked) ordered.push(col)
        colByKey.delete(key)
      }
    })
    cols.forEach((col: any) => {
      const key = getColumnKey(col) ?? col.label ?? col.type
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
      const hasOverride: any = !!propKey && overrides[propKey] != null
      const w = hasOverride ? overrides[propKey!] : col.width
      if (col.children && Array.isArray(col.children) && col.children.length > 0) {
        const children = col.children.map((child) => {
          const ckey = getColumnKey(child) ?? child.prop
          const co: any = !!ckey && overrides[ckey] != null
          return { ...child, width: co && ckey ? overrides[ckey] : child.width }
        })
        return { ...col, width: w, children }
      }
      return hasOverride || w !== col.width ? { ...col, width: w } : col
    })
  })

  /** Element 列 fixed 可为 boolean；vxe 仅接受 left | right | undefined */
  const normalizeFixed = (f: ColumnOption['fixed']): 'left' | 'right' | undefined => {
    if (f === true) return 'left'
    if (f === false || f == null) return undefined
    return f
  }

  const isColumnResizable = (col: ColumnOption) =>
    props.habitColumnWidth && (col as any).resizable !== false && !!(col as any).prop

  const mapHeaderScope = (headerScope: any, col: ColumnOption) => ({
    ...headerScope,
    prop: col.prop,
    label: col.label
  })

  const mapBodyScope = (slotScope: any, col: ColumnOption) => ({
    ...slotScope,
    prop: col.prop,
    value: col.prop ? slotScope.row[col.prop as string] : undefined,
    $index: slotScope.$rowIndex ?? slotScope.rowIndex
  })

  const slotKeyForCol = (col: ColumnOption) => {
    const p = col.prop
    if (Array.isArray(p)) return p.join('_').replace(/[^a-zA-Z0-9_]/g, '_')
    return String(p ?? 'c').replace(/[^a-zA-Z0-9_]/g, '_')
  }

  function buildLevelGridColumns(cols: ColumnOption[]): any[] {
    const result: any[] = []
    for (const col of cols) {
      if (col.children?.length) {
        result.push({
          title: col.label,
          fixed: normalizeFixed(col.fixed),
          children: buildLevelGridColumns(col.children)
        })
        continue
      }
      if (col.type === 'selection') {
        result.push({
          field: '__vt_sel__',
          title: col.label || '',
          width: col.width ?? 55,
          fixed: normalizeFixed(col.fixed),
          align: 'center',
          headerAlign: 'center',
          slots: { header: 'vt_sel_header', default: 'vt_sel_default' }
        })
        continue
      }
      if (col.type === 'globalIndex' || col.type === 'index') {
        result.push({
          type: 'seq',
          title: col.label,
          width: col.width,
          fixed: normalizeFixed(col.fixed),
          align: 'center',
          slots: { default: 'vt_seq_default' }
        })
        continue
      }
      if (col.type === 'expand') {
        result.push({
          type: 'expand',
          title: col.label,
          width: col.width || 48,
          fixed: normalizeFixed(col.fixed),
          slots: { content: 'vt_expand_default' }
        })
        continue
      }
      const sk = slotKeyForCol(col)
      const field = Array.isArray(col.prop) ? col.prop.join('.') : col.prop
      const base: Record<string, any> = {
        field,
        title: col.label,
        width: col.width,
        minWidth: col.minWidth,
        fixed: normalizeFixed(col.fixed),
        align: col.align || 'left',
        headerAlign: col.headerAlign || col.align || 'left',
        sortable: !!col.sortable,
        showOverflow: col.ellipsis ? 'ellipsis' : undefined,
        resizable: isColumnResizable(col)
      }
      if (isTreeNodeColumn(col)) {
        base.treeNode = true
      }
      const slots: Record<string, string> = {}
      if ((col.useHeaderSlot && col.prop) || (col.headerTip && col.prop)) {
        slots.header = `vt_head_${sk}`
      }
      if (col.useSlot && col.prop) slots.default = `vt_cell_${sk}`
      else if (col.copy && col.prop) slots.default = `vt_copy_${sk}`
      else if (col.ellipsis && col.prop) slots.default = `vt_ellipsis_${sk}`
      if (Object.keys(slots).length) base.slots = slots
      result.push(base)
    }
    return result
  }

  const columnsForGrid = computed(() => buildLevelGridColumns(displayColumns.value))

  interface GridSlotMeta {
    key: string
    slotName: string
    col: ColumnOption
    kind: 'header' | 'cell' | 'copy' | 'ellipsis'
  }

  function collectGridSlotMetas(cols: ColumnOption[]): GridSlotMeta[] {
    const list: GridSlotMeta[] = []
    const walk = (arr: ColumnOption[]) => {
      arr.forEach((col) => {
        if (col.children?.length) {
          walk(col.children)
          return
        }
        if (
          col.type &&
          ['selection', 'expand', 'globalIndex', 'index'].includes(String(col.type))
        ) {
          return
        }
        const sk = slotKeyForCol(col)
        if ((col.useHeaderSlot && col.prop) || (col.headerTip && col.prop)) {
          list.push({ key: `${sk}_h`, slotName: `vt_head_${sk}`, col, kind: 'header' })
        }
        if (col.useSlot && col.prop) {
          list.push({ key: `${sk}_d`, slotName: `vt_cell_${sk}`, col, kind: 'cell' })
        } else if (col.copy && col.prop) {
          list.push({ key: `${sk}_cp`, slotName: `vt_copy_${sk}`, col, kind: 'copy' })
        } else if (col.ellipsis && col.prop) {
          list.push({ key: `${sk}_el`, slotName: `vt_ellipsis_${sk}`, col, kind: 'ellipsis' })
        }
      })
    }
    walk(cols)
    return list
  }

  const gridSlotMetas = computed(() => collectGridSlotMetas(displayColumns.value))

  const selectionColumn = computed(
    () => displayColumns.value.find((c) => c.type === 'selection') as ColumnOption | undefined
  )

  const expandColumn = computed(
    () => displayColumns.value.find((c) => c.type === 'expand') as ColumnOption | undefined
  )

  const hasSeqColumn = computed(() =>
    displayColumns.value.some((c) => c.type === 'globalIndex' || c.type === 'index')
  )

  const seqCellText = (scope: any) => {
    const col = displayColumns.value.find((c) => c.type === 'globalIndex' || c.type === 'index')
    const rowIndex = scope.$rowIndex ?? scope.rowIndex ?? 0
    if (!col || col.type === 'globalIndex') return getGlobalIndex(rowIndex)
    return rowIndex + 1
  }

  const gridOptions = computed(() => ({
    ...(tableAttrs.value as Record<string, unknown>),
    border: vxeBorder.value,
    stripe: stripe.value,
    size: vxeSize.value,
    loading: !!props.loading,
    height: resolvedVxeHeight.value,
    autoResize: true,
    showHeader: props.showHeader,
    columnConfig: columnConfig.value,
    rowConfig: rowConfig.value,
    treeConfig: resolvedTreeConfig.value,
    scrollY: resolvedScrollY.value,
    headerCellStyle: resolvedHeaderCellStyle.value,
    cellStyle: resolvedCellStyle.value,
    data: tableRows.value,
    columns: columnsForGrid.value,
    emptyText: ' '
  }))

  const getRowKey = (row: any): string | number => {
    if (row && typeof row.__rowKey__ !== 'undefined') return row.__rowKey__
    if (typeof props.rowKey === 'function') {
      return (props.rowKey as (r: any) => string | number)(row)
    }
    return row[props.rowKey as string]
  }

  /** 树表子行：不展示勾选框、不参与全选/勾选逻辑（与 parent-children-table 语义对齐） */
  const isTreeTableChildRow = (row: any): boolean => {
    if (!isTreeEnabled.value || !row) return false
    if (useVxeTreeTransform.value) {
      return row[VT_TREE_PARENT_FIELD] != null
    }
    const roots = props.data ?? []
    const id = getRowKey(row)
    return !roots.some((r) => getRowKey(r) === id)
  }

  const getSelectablePageRows = () => (props.data || []).filter((r) => !isTreeTableChildRow(r))

  const getGlobalIndex = (rowIndex: number) => {
    if (!props.pagination) return rowIndex + 1
    const { currentPage, pageSize } = props.pagination
    return (currentPage - 1) * pageSize + rowIndex + 1
  }

  const handleSizeChange = (val: number) => {
    try {
      localStorage.setItem(storageKey.value, String(val))
    } catch (error) {
      console.warn('保存 pageSize 到 localStorage 失败:', error)
    }
    emit('pagination:size-change', val)
  }

  const handleCurrentChange = (val: number) => {
    emit('pagination:current-change', val)
    scrollToTop()
  }

  const scrollToTop = () => {
    nextTick(() => {
      const $g = gridRef.value
      if ($g && typeof ($g as any).scrollTo === 'function') {
        ;($g as any).scrollTo(0, 0)
      }
      useCommon().scrollToTop()
    })
  }

  const onResizableChange = (params: any) => {
    if (!props.habitColumnWidth) return
    const field = params?.column?.field ?? params?.column?.property
    const resizeWidth = params?.resizeWidth ?? params?.$resizeWidth
    if (field == null || resizeWidth == null || !Number.isFinite(Number(resizeWidth))) return
    const propKey = normalizeColumnKey(field) ?? String(field)
    columnWidthOverrides.value = {
      ...columnWidthOverrides.value,
      [propKey]: Number(resizeWidth)
    }
    saveUserHabitsApi({
      key: habitKey.value,
      habits: JSON.stringify({ columnWidths: { ...columnWidthOverrides.value } })
    }).catch((err) => {
      console.warn('[VirtualTableLevel] 列宽习惯保存失败:', err)
    })
  }

  const selectedRowKeys = ref<Set<string | number>>(new Set())
  const selectedRowsMap = ref<Map<string | number, any>>(new Map())
  const allSeenRowKeys = ref<Set<string | number>>(new Set())

  const isRowSelected = (row: any): boolean => selectedRowKeys.value.has(getRowKey(row))

  const handleRowSelect = (row: any, selected: boolean) => {
    if (isTreeTableChildRow(row)) return
    const key = getRowKey(row)
    if (selected) {
      selectedRowKeys.value.add(key)
      allSeenRowKeys.value.add(key)
      selectedRowsMap.value.set(key, row)
    } else {
      selectedRowKeys.value.delete(key)
      selectedRowsMap.value.delete(key)
      selectedRowKeys.value = new Set(selectedRowKeys.value)
      selectedRowsMap.value = new Map(selectedRowsMap.value)
    }
    emit('selection-change', Array.from(selectedRowsMap.value.values()))
  }

  const isCurrentPageAllSelected = computed(() => {
    const currentRows = getSelectablePageRows()
    if (currentRows.length === 0) return false
    return currentRows.every((row) => isRowSelected(row))
  })

  const hasCrossPageSelected = computed(() => {
    if (selectedRowKeys.value.size === 0) return false
    const currentPageKeys = new Set(getSelectablePageRows().map((row) => getRowKey(row)))
    for (const key of selectedRowKeys.value) {
      if (!currentPageKeys.has(key)) return true
    }
    return false
  })

  const isCurrentPagePartiallySelected = computed(() => {
    const currentRows = getSelectablePageRows()
    if (currentRows.length === 0) return false
    const selectedCount = currentRows.filter((row) => isRowSelected(row)).length
    return selectedCount > 0 && selectedCount < currentRows.length
  })

  const isAllSelected = computed(() => isCurrentPageAllSelected.value)

  const isIndeterminate = computed(() => {
    const currentRows = getSelectablePageRows()
    if (currentRows.length === 0) return false
    if (isCurrentPageAllSelected.value) return false
    if (hasCrossPageSelected.value) return true
    if (isCurrentPagePartiallySelected.value) return true
    return false
  })

  const isSelectionDisabled = (row: any, col: any): boolean => {
    if (typeof col?.selectable !== 'function') return false
    return !col.selectable(row)
  }

  const handleSelectAll = (selected: boolean, col?: any) => {
    const currentRows = getSelectablePageRows()
    currentRows.forEach((row) => {
      if (isTreeTableChildRow(row)) return
      if (selected && isSelectionDisabled(row, col)) return
      const key = getRowKey(row)
      if (selected) {
        selectedRowKeys.value.add(key)
        allSeenRowKeys.value.add(key)
        selectedRowsMap.value.set(key, row)
      } else {
        selectedRowKeys.value.delete(key)
        selectedRowsMap.value.delete(key)
      }
    })
    if (!selected) {
      selectedRowKeys.value = new Set(selectedRowKeys.value)
      selectedRowsMap.value = new Map(selectedRowsMap.value)
    }
    emit('selection-change', Array.from(selectedRowsMap.value.values()))
  }

  const getSelectedRows = (): any[] => Array.from(selectedRowsMap.value.values())

  const getSelectedRowKeys = (): (string | number)[] => Array.from(selectedRowKeys.value)

  const clearSelection = () => {
    selectedRowKeys.value.clear()
    selectedRowsMap.value.clear()
    selectedRowKeys.value = new Set(selectedRowKeys.value)
    selectedRowsMap.value = new Map(selectedRowsMap.value)
    emit('selection-change', [])
  }

  const setSelection = (rows: any[]) => {
    selectedRowKeys.value.clear()
    selectedRowsMap.value.clear()
    rows.forEach((row) => {
      if (isTreeTableChildRow(row)) return
      const key = getRowKey(row)
      selectedRowKeys.value.add(key)
      allSeenRowKeys.value.add(key)
      selectedRowsMap.value.set(key, row)
    })
    emit('selection-change', Array.from(selectedRowsMap.value.values()))
  }

  const toggleRowSelection = (row: any) => {
    if (isTreeTableChildRow(row)) return
    const key = getRowKey(row)
    if (selectedRowKeys.value.has(key)) {
      selectedRowKeys.value.delete(key)
      selectedRowsMap.value.delete(key)
      selectedRowKeys.value = new Set(selectedRowKeys.value)
      selectedRowsMap.value = new Map(selectedRowsMap.value)
    } else {
      selectedRowKeys.value.add(key)
      allSeenRowKeys.value.add(key)
      selectedRowsMap.value.set(key, row)
    }
    emit('selection-change', Array.from(selectedRowsMap.value.values()))
  }

  watch(
    () => props.data,
    (newData) => {
      if (!newData || newData.length === 0) {
        nextTick(() => syncFixedLayoutDebounced())
        return
      }

      const currentPageKeys = new Set<string | number>()
      newData.forEach((row) => {
        const key = getRowKey(row)
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
        selectedRowKeys.value = new Set(selectedRowKeys.value)
        selectedRowsMap.value = new Map(selectedRowsMap.value)
        emit('selection-change', Array.from(selectedRowsMap.value.values()))
      }

      newData.forEach((row) => {
        const key = getRowKey(row)
        if (selectedRowKeys.value.has(key)) {
          selectedRowsMap.value.set(key, row)
        }
      })

      const keysToCleanFromSeen: (string | number)[] = []
      allSeenRowKeys.value.forEach((key) => {
        if (!currentPageKeys.has(key) && !selectedRowKeys.value.has(key)) {
          keysToCleanFromSeen.push(key)
        }
      })
      if (keysToCleanFromSeen.length > 1000) {
        keysToCleanFromSeen.slice(0, 500).forEach((key) => {
          allSeenRowKeys.value.delete(key)
        })
      }

      nextTick(() => {
        if (!isTreeEnabled.value || useVxeTreeTransform.value) measureRenderedRowHeights()
        syncFixedLayoutDebounced()
      })
    },
    { deep: false }
  )

  const observeTableHeader = () => {
    try {
      if (resizeObserver) {
        resizeObserver.disconnect()
        resizeObserver = null
      }
      if (!props.showTableHeader) {
        tableHeaderHeight.value = 0
        return
      }
      const tableHeader = document.getElementById('art-table-header') as HTMLElement
      if (!tableHeader) {
        tableHeaderHeight.value = DEFAULT_TABLE_HEADER_HEIGHT
        return
      }
      tableHeaderHeight.value = tableHeader.offsetHeight
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
      tableHeaderHeight.value = DEFAULT_TABLE_HEADER_HEIGHT
    }
  }

  const updateContainerTopOffset = () => {
    if (containerRef.value) {
      containerTopOffset.value = containerRef.value.getBoundingClientRect().top
    }
  }

  watch([windowHeight, () => props.showTableHeader, () => showPagination.value], () => {
    nextTick(() => {
      updateContainerTopOffset()
      syncFixedLayoutDebounced()
    })
  })

  watch(displayColumns, () => {
    nextTick(() => {
      if (!isTreeEnabled.value || useVxeTreeTransform.value) measureRenderedRowHeights()
      syncFixedLayoutDebounced()
    })
  })

  watch(resolvedVxeHeight, () => {
    nextTick(() => {
      if (!isTreeEnabled.value || useVxeTreeTransform.value) measureRenderedRowHeights()
      syncFixedLayoutDebounced()
    })
  })

  watch(
    () => props.loading,
    (v) => {
      if (v === false) syncFixedLayoutDebounced()
    }
  )

  watch(tableAreaHeight, (nh, oh) => {
    if (nh > 20 && Math.abs(nh - (oh ?? 0)) > 3) {
      nextTick(() => {
        syncFixedLayoutDebounced()
        if (!isTreeEnabled.value || useVxeTreeTransform.value) measureRenderedRowHeights()
      })
    }
  })

  onMounted(() => {
    nextTick(() => {
      observeTableHeader()
      updateContainerTopOffset()
      if (!isTreeEnabled.value || useVxeTreeTransform.value) measureRenderedRowHeights()
      syncFixedLayoutDebounced()
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
              /* ignore */
            }
          }
        })
        .catch(() => {})
    }
  })

  watch(
    [() => props.data, () => props.showTableHeader],
    () => {
      nextTick(() => observeTableHeader())
    },
    { flush: 'post' }
  )

  onUnmounted(() => {
    ;(measureOnScrollThrottled as { cancel?: () => void }).cancel?.()
    if (layoutDebounceTimer != null) {
      clearTimeout(layoutDebounceTimer)
      layoutDebounceTimer = null
    }
    if (layoutSyncRaf != null) {
      cancelAnimationFrame(layoutSyncRaf)
      layoutSyncRaf = null
    }
    if (resizeObserver) {
      resizeObserver.disconnect()
      resizeObserver = null
    }
    cancelMeasure()
    selectedRowKeys.value.clear()
    selectedRowsMap.value.clear()
  })

  defineExpose({
    scrollToTop,
    gridRef,
    /** 与 virtual-table-new 对齐：底层实例别名 */
    vxeTableRef: gridRef,
    getSelectedRows,
    getSelectedRowKeys,
    clearSelection,
    setSelection,
    toggleRowSelection
  })
</script>

<style lang="scss" scoped>
  @use './style';
</style>
