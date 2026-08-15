<!-- 虚拟表格：底层 VxeTable 纵向虚拟滚动；配置与行为对齐 ArtTable（列、分页、跨页勾选、列宽习惯等） -->
<template>
  <div
    ref="containerRef"
    :class="{
      'is-empty': isEmpty,
      'virtual-table-new': true,
      'art-table': true,
      'no-border': !border
    }"
    :style="containerHeight"
  >
    <div ref="tableAreaRef" class="virtual-table-new__table-area">
      <VxeTable
        ref="vxeTableRef"
        v-bind="tableAttrs"
        class="virtual-vxe-table"
        :border="vxeBorder"
        :stripe="stripe"
        :size="vxeSize"
        :show-header="showHeader"
        :data="tableRows"
        :loading="!!loading"
        :height="resolvedVxeHeight"
        :auto-resize="true"
        :column-config="columnConfig"
        :row-config="rowConfig"
        :scroll-y="resolvedScrollY"
        :header-cell-style="resolvedHeaderCellStyle"
        :cell-style="resolvedCellStyle"
        @scroll="handleTableScroll"
        @resizable-change="onResizableChange"
      >
        <template v-for="col in displayColumns" :key="columnLoopKey(col)">
          <VxeColgroup
            v-if="col.children && col.children.length > 0"
            :title="String(col.label ?? '')"
            :fixed="normalizeFixed(col.fixed)"
          >
            <template v-for="child in col.children" :key="columnLoopKey(child)">
              <VxeColumn v-bind="vxeLeafColumnBind(child)" :resizable="isColumnResizable(child)">
                <template v-if="child.useHeaderSlot && child.prop" #header="headerScope">
                  <slot
                    :name="child.headerSlotName || `${child.prop}-header`"
                    v-bind="mapHeaderScope(headerScope, child)"
                  >
                    <TableHeaderTip
                      v-if="child.headerTip"
                      :label="String(child.label ?? '')"
                      :tip="child.headerTip"
                    />
                    <template v-else>{{ child.label }}</template>
                  </slot>
                </template>
                <template v-else-if="child.headerTip && child.prop" #header>
                  <TableHeaderTip :label="String(child.label ?? '')" :tip="child.headerTip" />
                </template>
                <template v-if="child.useSlot && child.prop" #default="slotScope">
                  <slot
                    :name="child.slotName || child.prop"
                    v-bind="mapBodyScope(slotScope, child)"
                  />
                </template>
                <template v-else-if="child.copy && child.prop" #default="slotScope">
                  <div
                    class="cell-copy"
                    :title="`点击复制${child.label}`"
                    @click="handleCopy(child.prop ? String(slotScope.row[child.prop] || '') : '')"
                  >
                    {{ child.prop ? slotScope.row[child.prop] : '' }}
                  </div>
                </template>
                <template v-else-if="child.ellipsis && child.prop" #default="slotScope">
                  <ElTooltip
                    :content="child.prop ? String(slotScope.row[child.prop] || '') : ''"
                    placement="top"
                  >
                    <div class="cell-ellipsis">
                      {{ child.prop ? slotScope.row[child.prop] : '' }}
                    </div>
                  </ElTooltip>
                </template>
              </VxeColumn>
            </template>
          </VxeColgroup>

          <VxeColumn
            v-else-if="col.type === 'selection'"
            :width="colWidth(col)"
            :fixed="normalizeFixed(col.fixed)"
            :title="col.label"
            align="center"
            header-align="center"
            :resizable="false"
          >
            <template #header>
              <div class="vt-cell-center">
                <ElCheckbox
                  :model-value="isAllSelected"
                  :indeterminate="isIndeterminate"
                  @change="(val) => handleSelectAll(!!val, col)"
                />
              </div>
            </template>
            <template #default="{ row }">
              <div class="vt-cell-center">
                <ElCheckbox
                  :model-value="isRowSelected(row)"
                  :disabled="isSelectionDisabled(row, col)"
                  @change="(val) => handleRowSelect(row, !!val)"
                />
              </div>
            </template>
          </VxeColumn>

          <VxeColumn
            v-else-if="col.type === 'globalIndex' || col.type === 'index'"
            :width="colWidth(col)"
            :fixed="normalizeFixed(col.fixed)"
            :title="col.label"
            align="center"
            :resizable="false"
          >
            <template #default="{ rowIndex }">
              <span>{{
                col.type === 'globalIndex' ? getGlobalIndex(rowIndex) : rowIndex + 1
              }}</span>
            </template>
          </VxeColumn>

          <VxeColumn
            v-else-if="col.type === 'expand'"
            v-bind="vxeExpandColumnBind(col)"
            :resizable="false"
          >
            <template #content="{ row }">
              <component v-if="col.formatter" :is="col.formatter(row)" />
              <slot v-else name="expand" :row="row" />
            </template>
          </VxeColumn>

          <VxeColumn v-else v-bind="vxeLeafColumnBind(col)" :resizable="isColumnResizable(col)">
            <template v-if="col.useHeaderSlot && col.prop" #header="headerScope">
              <slot
                :name="col.headerSlotName || `${col.prop}-header`"
                v-bind="mapHeaderScope(headerScope, col)"
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
            <template v-if="col.useSlot && col.prop" #default="slotScope">
              <slot :name="col.slotName || col.prop" v-bind="mapBodyScope(slotScope, col)" />
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
          </VxeColumn>
        </template>

        <template #empty>
          <div v-if="loading"></div>
          <ElEmpty v-else :description="emptyText" :image-size="120" />
        </template>
      </VxeTable>
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

  defineOptions({ name: 'VirtualTableNew', inheritAttrs: false })

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
    scrollY: () => ({ enabled: true, gt: 0 })
  })

  const attrs = useAttrs()
  /** 过滤不应透传给 VxeTable 的属性（含已废弃的树形透传，避免落到 vxe 上） */
  const tableAttrs = computed(() => {
    const raw = { ...(attrs as Record<string, unknown>) }
    delete raw['tree-props']
    delete raw.treeProps
    delete raw['default-expand-all']
    delete raw.defaultExpandAll
    delete raw['tree-virtual-scroll']
    delete raw.treeVirtualScroll
    delete raw.height
    delete raw.scrollY
    delete raw['scroll-y']
    return raw
  })

  const emit = defineEmits<{
    (e: 'pagination:size-change', val: number): void
    (e: 'pagination:current-change', val: number): void
    (e: 'selection-change', rows: any[]): void
  }>()

  const { width, height: windowHeight } = useWindowSize()
  const route = useRoute()
  const vxeTableRef = ref<any>(null)
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

  const rowConfig = computed(() => ({
    keyField: keyField.value,
    isHover: true
  }))

  /**
   * 仅 recalculate：refreshColumn 代价大且易闪烁错位，不再调用。
   */
  let layoutSyncRaf: number | null = null
  const syncFixedLayout = () => {
    if (layoutSyncRaf != null) cancelAnimationFrame(layoutSyncRaf)
    layoutSyncRaf = requestAnimationFrame(() => {
      layoutSyncRaf = null
      nextTick(() => {
        vxeTableRef.value?.recalculate?.()
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

  const tableRows = computed(() => {
    const rows = props.data ?? []
    if (typeof props.rowKey === 'function') {
      const fn = props.rowKey as (row: any) => string | number
      return rows.map((r) => ({ ...r, __rowKey__: fn(r) }))
    }
    return rows
  })

  const estimatedRowHeight = ref(32)
  /** 纵向虚拟滚动：scrollY.enabled 不为 false 时开启 */
  const resolvedScrollY = computed(() => {
    const user = props.scrollY ? { ...props.scrollY } : {}
    const gt = user.gt != null ? Number(user.gt) : 0
    delete (user as { enabled?: boolean }).enabled
    delete (user as { gt?: number }).gt
    const allowVirtual = user.enabled !== false
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
    const rootEl = vxeTableRef.value?.$el as HTMLElement | undefined
    if (!rootEl) return
    const rows = rootEl.querySelectorAll('.vxe-table--body-wrapper .vxe-body--row')
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

  const measureOnScrollThrottled = useThrottleFn(() => {
    measureRenderedRowHeights()
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

  const columnLoopKey = (col: ColumnOption) =>
    `${getColumnKey(col) ?? col.prop ?? col.type ?? col.label ?? ''}`

  const colWidth = (col: ColumnOption) => col.width ?? (col.type === 'selection' ? 55 : undefined)

  /** Element 列 fixed 可为 boolean；vxe 仅接受 left | right | undefined */
  const normalizeFixed = (f: ColumnOption['fixed']): 'left' | 'right' | undefined => {
    if (f === true) return 'left'
    if (f === false || f == null) return undefined
    return f
  }

  const isColumnResizable = (col: ColumnOption) =>
    props.habitColumnWidth && (col as any).resizable !== false && !!(col as any).prop

  const vxeLeafColumnBind = (col: ColumnOption) => {
    const showOverflow = col.ellipsis ? ('ellipsis' as const) : undefined
    return {
      field: col.prop,
      title: col.label,
      width: col.width,
      minWidth: col.minWidth,
      fixed: normalizeFixed(col.fixed),
      align: col.align || 'left',
      headerAlign: col.headerAlign || col.align || 'left',
      sortable: !!col.sortable,
      showOverflow
    }
  }

  const vxeExpandColumnBind = (col: ColumnOption) => ({
    type: 'expand' as const,
    width: col.width || 48,
    fixed: normalizeFixed(col.fixed),
    title: col.label
  })

  const mapHeaderScope = (headerScope: any, col: ColumnOption) => ({
    ...headerScope,
    prop: col.prop,
    label: col.label
  })

  const mapBodyScope = (slotScope: any, col: ColumnOption) => ({
    ...slotScope,
    prop: col.prop,
    value: col.prop ? slotScope.row[col.prop] : undefined,
    $index: slotScope.$rowIndex ?? slotScope.rowIndex
  })

  const getRowKey = (row: any): string | number => {
    if (row && typeof row.__rowKey__ !== 'undefined') return row.__rowKey__
    if (typeof props.rowKey === 'function') {
      return (props.rowKey as (r: any) => string | number)(row)
    }
    return row[props.rowKey as string]
  }

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
      const $table = vxeTableRef.value
      if ($table && typeof ($table as any).scrollTo === 'function') {
        ;($table as any).scrollTo(0, 0)
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
      console.warn('[VirtualTableNew] 列宽习惯保存失败:', err)
    })
  }

  const selectedRowKeys = ref<Set<string | number>>(new Set())
  const selectedRowsMap = ref<Map<string | number, any>>(new Map())
  const allSeenRowKeys = ref<Set<string | number>>(new Set())

  const isRowSelected = (row: any): boolean => selectedRowKeys.value.has(getRowKey(row))

  const handleRowSelect = (row: any, selected: boolean) => {
    const key = getRowKey(row)
    if (selected) {
      selectedRowKeys.value.add(key)
      selectedRowsMap.value.set(key, row)
    } else {
      selectedRowKeys.value.delete(key)
      selectedRowsMap.value.delete(key)
      selectedRowKeys.value = new Set(selectedRowKeys.value)
      selectedRowsMap.value = new Map(selectedRowsMap.value)
    }
    emit('selection-change', Array.from(selectedRowsMap.value.values()))
  }

  const getCurrentPageRows = () => props.data || []

  const isCurrentPageAllSelected = computed(() => {
    const currentRows = getCurrentPageRows()
    if (currentRows.length === 0) return false
    return currentRows.every((row) => isRowSelected(row))
  })

  const hasCrossPageSelected = computed(() => {
    if (selectedRowKeys.value.size === 0) return false
    const currentPageKeys = new Set(getCurrentPageRows().map((row) => getRowKey(row)))
    for (const key of selectedRowKeys.value) {
      if (!currentPageKeys.has(key)) return true
    }
    return false
  })

  const isCurrentPagePartiallySelected = computed(() => {
    const currentRows = getCurrentPageRows()
    if (currentRows.length === 0) return false
    const selectedCount = currentRows.filter((row) => isRowSelected(row)).length
    return selectedCount > 0 && selectedCount < currentRows.length
  })

  const isAllSelected = computed(() => isCurrentPageAllSelected.value)

  const isIndeterminate = computed(() => {
    const currentRows = getCurrentPageRows()
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
      const key = getRowKey(row)
      selectedRowKeys.value.add(key)
      selectedRowsMap.value.set(key, row)
    })
    emit('selection-change', Array.from(selectedRowsMap.value.values()))
  }

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
        measureRenderedRowHeights()
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
      measureRenderedRowHeights()
      syncFixedLayoutDebounced()
    })
  })

  watch(resolvedVxeHeight, () => {
    nextTick(() => {
      measureRenderedRowHeights()
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
        measureRenderedRowHeights()
      })
    }
  })

  onMounted(() => {
    nextTick(() => {
      observeTableHeader()
      updateContainerTopOffset()
      measureRenderedRowHeights()
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
    vxeTableRef,
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
