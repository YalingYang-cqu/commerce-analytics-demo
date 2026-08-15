import { computed, watch, type Ref } from 'vue'
import type { ColumnOption } from '@/types/component'
import { getColumnKey, useTableColumns } from '@/composables/useTableColumns'
import type { DynamicColumn, SalesChannel, SalesDimension, TableColumnItem } from './sales-types'

const SORTABLE_STATIC_KEYS = new Set(['avg7', 'growth', 'subtotal'])

export const isSalesDetailSortableColumn = (key: string) =>
  SORTABLE_STATIC_KEYS.has(key) || key.startsWith('p_')

type UseSalesDetailTableColumnsOptions = {
  columns: Ref<TableColumnItem[]>
  dynamicColumns: Ref<DynamicColumn[]>
  visibleColumnKeys: Ref<string[]>
  supportsRowExpand: Ref<boolean>
  dimension: Ref<SalesDimension>
  channel: Ref<SalesChannel>
}

const mapStaticColumn = (
  col: TableColumnItem,
  checked: boolean,
  fixed?: boolean | 'left' | 'right'
): ColumnOption => {
  const key = col.key
  const specialSlots = new Set(['expand', 'img', 'analyze', 'trend', 'growth'])
  return {
    prop: key,
    label: col.label,
    width: col.width,
    minWidth: col.width || 88,
    fixed: fixed ? 'left' : col.frozen ? 'left' : undefined,
    align: col.align === 'right' ? 'right' : col.align === 'center' ? 'center' : 'left',
    checked: col.readonly ? true : checked,
    hide: false,
    useSlot: specialSlots.has(key),
    sortable: isSalesDetailSortableColumn(key) ? ('custom' as ColumnOption['sortable']) : false
  }
}

const mapDynamicColumn = (col: DynamicColumn): ColumnOption => ({
  prop: col.key,
  label: col.label,
  minWidth: 78,
  align: 'right',
  checked: true,
  useHeaderSlot: true,
  headerSlotName: `${col.key}-header`,
  sortable: 'custom' as ColumnOption['sortable']
})

export function useSalesDetailTableColumns(options: UseSalesDetailTableColumnsOptions) {
  const tableName = computed(
    () => `sale-statics-detail-v8-${options.channel.value}-${options.dimension.value}`
  )

  const columnsFactory = computed<ColumnOption[]>(() => {
    const colMap = new Map(options.columns.value.map((col) => [col.key, col]))
    const visibleSet = new Set(options.visibleColumnKeys.value)
    const structural = options.supportsRowExpand.value ? ['expand'] : []
    const orderedKeys = [
      ...structural,
      ...options.visibleColumnKeys.value.filter((key) => !structural.includes(key)),
      ...options.columns.value
        .map((col) => col.key)
        .filter((key) => !visibleSet.has(key) && !structural.includes(key))
    ]

    const staticCols = orderedKeys
      .map((key) => {
        const col = colMap.get(key)
        if (!col) return null
        const showCol = col.readonly || visibleSet.has(key) || key === 'expand'
        return mapStaticColumn(col, showCol, key === 'expand' ? 'left' : undefined)
      })
      .filter((col): col is ColumnOption => col != null)

    return [...staticCols, ...options.dynamicColumns.value.map(mapDynamicColumn)]
  })

  const { columns, columnChecks, updateColumn, resetColumns } = useTableColumns(
    columnsFactory,
    tableName.value
  )

  watch(tableName, () => {
    resetColumns()
  })

  watch(
    () => options.dynamicColumns.value,
    () => {
      resetColumns()
    },
    { deep: true }
  )

  let syncingFromVisible = false
  let syncingFromChecks = false

  watch(
    columnChecks,
    (checks) => {
      if (syncingFromVisible) return
      syncingFromChecks = true
      const structural = options.supportsRowExpand.value ? ['expand'] : []
      options.visibleColumnKeys.value = checks
        .filter(
          (item: ColumnOption) =>
            item.checked !== false &&
            item.prop &&
            !structural.includes(String(item.prop)) &&
            !String(item.prop).startsWith('p_')
        )
        .map((item: ColumnOption) => String(item.prop))
      syncingFromChecks = false
    },
    { deep: true }
  )

  watch(
    () => [...options.visibleColumnKeys.value],
    (keys) => {
      if (syncingFromChecks) return
      syncingFromVisible = true
      const keySet = new Set(keys)
      columnChecks.value = columnChecks.value.map((item: ColumnOption) => {
        const prop = getColumnKey(item) ?? item.prop
        if (!prop || String(prop).startsWith('p_') || prop === 'expand') return item
        return { ...item, checked: keySet.has(String(prop)) }
      })
      syncingFromVisible = false
    }
  )

  watch(
    () => options.columns.value,
    () => resetColumns(),
    { deep: true }
  )

  return {
    tableName,
    columns,
    columnChecks,
    updateColumn,
    resetColumns
  }
}
