import { ref, computed, watch, watchEffect } from 'vue'
import { useRoute } from 'vue-router'
import { $t } from '@/locales'
import type { ColumnOption } from '@/types/component'

/**
 * 特殊列类型
 */
const SPECIAL_COLUMNS: Record<string, { prop: string; label: string }> = {
  selection: { prop: '__selection__', label: $t('table.column.selection') },
  expand: { prop: '__expand__', label: $t('table.column.expand') },
  index: { prop: '__index__', label: $t('table.column.index') }
}

/**
 * 将 prop（可能为数组，如 ['address','city']）规范为字符串 key，用于列唯一标识与匹配
 */
export const normalizeColumnKey = (prop: string | string[] | undefined): string | undefined => {
  if (prop == null) return undefined
  if (Array.isArray(prop)) return prop.length ? prop.join('.') : undefined
  return String(prop)
}

/**
 * 获取列的唯一标识（始终为字符串，prop 为数组时转为 'a.b.c'）
 */
export const getColumnKey = <T>(col: ColumnOption<T>): string | undefined => {
  const special = col.type && SPECIAL_COLUMNS[col.type as keyof typeof SPECIAL_COLUMNS]
  if (special) return special.prop
  const key = normalizeColumnKey((col as any).prop)
  if (key != null) return key
  if (col.label != null) return String(col.label)
  if (col.type != null) return String(col.type)
  return undefined
}

/**
 * 获取列的检查状态（保证每列都有 label，避免列配置中出现“无标签”项）
 */
export const getColumnChecks = <T>(columns: ColumnOption<T>[]) =>
  columns.map((col) => {
    const special = col.type && SPECIAL_COLUMNS[col.type]
    if (special) {
      return {
        ...col,
        prop: special.prop,
        label: special.label || (col.label as string) || special.prop,
        checked: !col.hide
      }
    }
    const label = (col.label as string) || (col.prop as string) || '列'
    // 可见性由 columns 计算的 checked && !hide 共同决定；勿因 hide 把 checked 置 false，
    // 否则 Tab 等场景 hide 从 true→false 后仍会沿用 false，列永远不出现。
    return { ...col, label, checked: col.checked ?? true }
  })

/**
 * 规范化列顺序：勾选列(__selection__)置顶，固定右侧列置底，避免排序错乱
 */
function normalizeColumnOrder<T>(cols: ColumnOption<T>[]): ColumnOption<T>[] {
  if (!cols?.length) return cols
  const keyOf = (c: ColumnOption<T>) => getColumnKey(c) ?? (c as any).prop
  const selectionKey = '__selection__'
  const left: ColumnOption<T>[] = []
  const middle: ColumnOption<T>[] = []
  const right: ColumnOption<T>[] = []
  cols.forEach((c) => {
    const key = keyOf(c)
    if (key === selectionKey) left.push(c)
    else if ((c as any).fixed === 'right') right.push(c)
    else middle.push(c)
  })
  return [...left, ...middle, ...right]
}

/**
 * 动态列配置接口
 */
export interface DynamicColumnConfig<T = any> {
  /**
   * 新增列
   * @param column 列配置
   * @param index 可选的插入位置，默认末尾
   */
  addColumn: (column: ColumnOption<T>, index?: number) => void
  /**
   * 删除列
   * @param prop 列的唯一标识或标识数组
   */
  removeColumn: (prop: string | string[]) => void
  /**
   * 切换列显示状态
   * @param prop 列的唯一标识
   * @param visible 可选的显示状态，默认取反
   */
  toggleColumn: (prop: string, visible?: boolean) => void

  /**
   * 更新列
   * @param prop 列的唯一标识
   * @param updates 列配置更新
   */
  updateColumn: (prop: string, updates: Partial<ColumnOption<T>>) => void
  /**
   * 批量更新列
   * @param updates 列更新配置
   */
  batchUpdateColumns: (updates: Array<{ prop: string; updates: Partial<ColumnOption<T>> }>) => void
  /**
   * 重新排序列
   * @param fromIndex 源索引
   * @param toIndex 目标索引
   */
  reorderColumns: (fromIndex: number, toIndex: number) => void
  /**
   * 获取列配置
   * @param prop 列的唯一标识
   * @returns 列配置
   */
  getColumnConfig: (prop: string) => ColumnOption<T> | undefined
  /**
   * 获取所有列配置
   * @returns 所有列配置
   */
  getAllColumns: () => ColumnOption<T>[]
  /**
   * 重置所有列
   */
  resetColumns: () => void
}

const COLUMN_CACHE_PREFIX = 'table_columns_'

export function useTableColumns<T = any>(
  columnsFactory:
    | (() => ColumnOption<T>[])
    | (() => ColumnOption<T[]>)
    | { value: ColumnOption<T>[] },
  tableName?: string
): {
  columns: any
  columnChecks: any
} & DynamicColumnConfig<T> {
  // 支持 computed 类型的 columnsFactory
  const getColumns = () => {
    if (typeof columnsFactory === 'function') {
      return columnsFactory()
    } else if (columnsFactory && 'value' in columnsFactory) {
      return columnsFactory.value
    }
    return columnsFactory as ColumnOption<T>[]
  }

  const route = useRoute()
  const dynamicColumns = ref<ColumnOption<T>[]>(getColumns())
  let initialChecks = getColumnChecks(dynamicColumns.value)

  // 初始化时从 localStorage 恢复列配置（与 MkTableFilterDrag 一致的 key）
  if (tableName) {
    try {
      const path = (route?.path || '').replace(/\//g, '_')
      const storageKey = `${COLUMN_CACHE_PREFIX}${tableName}${path}`
      const cached = localStorage.getItem(storageKey)
      if (cached) {
        const data = JSON.parse(cached)
        const savedList = data?.draggableList as
          | Array<{ prop?: string; name?: string; showCol?: boolean }>
          | undefined
        if (savedList?.length) {
          const colByKey = new Map<string, ColumnOption<T>>()
          initialChecks.forEach((col: any) => {
            const key = getColumnKey(col) ?? col.prop ?? col.label ?? col.type
            if (key != null) colByKey.set(String(key), col)
          })
          const ordered: ColumnOption<T>[] = []
          savedList.forEach((item: any) => {
            const rawKey = item.prop ?? item.name
            if (rawKey == null) return
            const key = normalizeColumnKey(rawKey) ?? String(rawKey)
            const col = colByKey.get(key)
            if (col) {
              // 勿用缓存 key 覆盖 col.prop：可能与工厂定义不一致（含数组 prop），并导致表头与单元格错位
              ordered.push({
                ...col,
                checked: item.showCol !== false,
                ...(item.width != null && { width: item.width }),
                ...(item.fixed != null && { fixed: item.fixed })
              } as ColumnOption<T>)
              colByKey.delete(key)
            }
          })
          initialChecks.forEach((col: any) => {
            const key = getColumnKey(col) ?? col.prop ?? col.label ?? col.type
            if (key != null && colByKey.has(String(key))) ordered.push({ ...col })
          })
          // 缓存列集合与当前 columnsFactory 不一致时（如新增「物流中心编码」后旧 draggableList），拒绝采用合并结果
          const factoryKeys = dynamicColumns.value
            .map((c) => getColumnKey(c))
            .filter((k): k is string => k != null)
          const factoryKeySet = new Set(factoryKeys)
          const orderedKeys = ordered
            .map((c) => getColumnKey(c))
            .filter((k): k is string => k != null)
          const orderedKeySet = new Set(orderedKeys)
          const restoredMatchesFactory =
            factoryKeys.length > 0 &&
            factoryKeys.length === orderedKeys.length &&
            orderedKeys.length === orderedKeySet.size &&
            orderedKeys.every((k) => factoryKeySet.has(k))
          if (ordered.length > 0 && restoredMatchesFactory) initialChecks = ordered
        }
      }
    } catch {
      /* ignore */
    }
  }
  // 统一规范化顺序：勾选列置顶、固定右侧列置底，避免排序异常
  initialChecks = normalizeColumnOrder(initialChecks)

  const columnChecks = ref<ColumnOption<T>[]>(initialChecks)

  // 监听 columnsFactory 的变化（当权限等响应式数据变化时，自动更新列配置）
  watchEffect(() => {
    const newColumns = getColumns()
    // 只有当列配置真正发生变化时才更新（避免不必要的更新）
    const currentKeys = dynamicColumns.value.map((c) => getColumnKey(c)).join(',')
    const newKeys = newColumns.map((c) => getColumnKey(c)).join(',')

    // 检查列配置是否发生变化（包括 hide 属性的变化）
    // 比较列的数量、顺序和关键属性（hide、label、prop等）
    const hasChanged =
      currentKeys !== newKeys ||
      dynamicColumns.value.length !== newColumns.length ||
      dynamicColumns.value.some((col, index) => {
        const newCol = newColumns[index]
        if (!newCol) return true
        // 检查关键属性是否变化
        return (
          col.hide !== newCol.hide ||
          col.label !== newCol.label ||
          getColumnKey(col) !== getColumnKey(newCol)
        )
      })

    if (hasChanged) {
      dynamicColumns.value = newColumns
    }
  })

  // 当 dynamicColumns 变动时，重新生成 columnChecks 且保留已存在的 checked 和 fixed 状态
  watch(
    dynamicColumns,
    (newCols) => {
      const checkedMap = new Map(
        columnChecks.value.map((c) => [getColumnKey(c), c.checked ?? true])
      )
      // 优先使用 columnChecks 中的 fixed（用户设置的），其次使用 dynamicColumns 中的 fixed
      const fixedMap = new Map(columnChecks.value.map((c) => [getColumnKey(c), c.fixed]))
      const dynamicFixedMap = new Map(newCols.map((c) => [getColumnKey(c), c.fixed]))
      const newColsMap = new Map(newCols.map((c) => [getColumnKey(c), c]))
      const processedKeys = new Set<string>()
      const newChecks: ColumnOption<T>[] = []

      // 优先按 columnChecks 的现有顺序（用户自定义顺序）排列，保留 checked/fixed
      columnChecks.value.forEach((c) => {
        const key = getColumnKey(c)
        const newCol = newColsMap.get(key)
        if (newCol) {
          processedKeys.add(key)
          const fixed =
            fixedMap.has(key) && fixedMap.get(key) !== undefined
              ? fixedMap.get(key)
              : dynamicFixedMap.get(key)
          const prevHide = !!(c as any).hide
          const nextHide = !!(newCol as any).hide
          let checked = checkedMap.has(key) ? checkedMap.get(key)! : (c.checked ?? true)
          // 列配置 hide 从 true→false（如采购订单 Tab 从待切回待交货）时，曾写入 checked:false；
          // 若仍沿用会导致「已分配量」等列永远不显示，需在可显示时恢复勾选。
          if (prevHide && !nextHide) {
            checked = true
          }
          // 必须用 getColumnChecks 补齐 selection/expand/index 的 prop、label；工厂常只写 type，直接 ...newCol 会丢掉文案
          const [enriched] = getColumnChecks([newCol as ColumnOption<T>])
          newChecks.push({
            ...enriched,
            checked,
            fixed
          })
        }
      })

      // 追加 dynamicColumns 中新增的列（不在 columnChecks 中的）
      newCols.forEach((c) => {
        const key = getColumnKey(c)
        if (!processedKeys.has(key)) {
          const fixed =
            fixedMap.has(key) && fixedMap.get(key) !== undefined
              ? fixedMap.get(key)
              : dynamicFixedMap.get(key)
          const [enriched] = getColumnChecks([c as ColumnOption<T>])
          newChecks.push({
            ...enriched,
            checked: checkedMap.has(key) ? checkedMap.get(key) : enriched.checked,
            fixed
          })
        }
      })

      columnChecks.value = newChecks
    },
    { deep: true }
  )

  // 当前显示列（基于 columnChecks 的 checked 和 hide 属性）
  // 确保固定列按照正确顺序排列：左侧固定列 -> 普通列 -> 右侧固定列
  const columns = computed(() => {
    const colMap = new Map(dynamicColumns.value.map((c) => [getColumnKey(c), c]))
    const originalOrderMap = new Map(
      dynamicColumns.value.map((c, index) => [getColumnKey(c), index])
    )

    // 从 columnChecks 获取可见列，并合并 dynamicColumns 中的配置
    // 优先使用 columnChecks 中的 fixed 属性（用户设置的），其次使用 dynamicColumns 中的
    const visibleColumns = columnChecks.value
      .filter((c) => c.checked && !c.hide)
      .map((c) => {
        const baseCol = colMap.get(getColumnKey(c))
        if (!baseCol) return null
        // 合并配置，优先使用 columnChecks 中的 fixed 属性
        return {
          ...baseCol,
          fixed: c.fixed !== undefined ? c.fixed : baseCol.fixed
        } as ColumnOption<T>
      })
      .filter(Boolean) as ColumnOption<T>[]

    // 按照固定列类型排序：left -> undefined -> right
    // 在同一类型内，保持原始顺序
    return visibleColumns.sort((a, b) => {
      const aFixed = a.fixed === 'left' ? 0 : a.fixed === 'right' ? 2 : 1
      const bFixed = b.fixed === 'left' ? 0 : b.fixed === 'right' ? 2 : 1

      // 如果固定类型相同，保持原始顺序
      if (aFixed === bFixed) {
        const aOrder = originalOrderMap.get(getColumnKey(a)) ?? 0
        const bOrder = originalOrderMap.get(getColumnKey(b)) ?? 0
        return aOrder - bOrder
      }

      return aFixed - bFixed
    })
  })

  // 支持 updater 返回新数组或直接在传入数组上 mutate
  const setDynamicColumns = (updater: (cols: ColumnOption<T>[]) => void | ColumnOption<T>[]) => {
    const copy = [...dynamicColumns.value]
    const result = updater(copy)
    dynamicColumns.value = Array.isArray(result) ? result : copy
  }

  return {
    columns,
    columnChecks,
    addColumn: (column: ColumnOption<T>, index?: number) =>
      setDynamicColumns((cols) => {
        const next = [...cols]
        if (typeof index === 'number' && index >= 0 && index <= next.length) {
          next.splice(index, 0, column)
        } else {
          next.push(column)
        }
        return next
      }),

    removeColumn: (prop: string | string[]) =>
      setDynamicColumns((cols) => {
        const propsToRemove = Array.isArray(prop) ? prop : [prop]
        return cols.filter((c) => !propsToRemove.includes(getColumnKey(c)))
      }),

    updateColumn: (prop: string, updates: Partial<ColumnOption<T>>) =>
      setDynamicColumns((cols) =>
        cols.map((c) => (getColumnKey(c) === prop ? { ...c, ...updates } : c))
      ),

    toggleColumn: (prop: string, visible?: boolean) => {
      const i = columnChecks.value.findIndex((c) => getColumnKey(c) === prop)
      if (i > -1) {
        const next = [...columnChecks.value]
        next[i] = { ...next[i], checked: visible ?? !next[i].checked }
        columnChecks.value = next
      }
    },
    resetColumns: () => {
      // console.log(columnsFactory,'columnsFactorycolumnsFactorycolumnsFactory')
      dynamicColumns.value = getColumns()

      columnChecks.value = getColumnChecks(dynamicColumns.value)
    },

    batchUpdateColumns: (updates) =>
      setDynamicColumns((cols) => {
        const map = new Map(updates.map((u) => [u.prop, u.updates]))
        return cols.map((c) => {
          const key = getColumnKey(c)
          const upd = map.get(key)
          return upd ? { ...c, ...upd } : c
        })
      }),

    reorderColumns: (fromIndex: number, toIndex: number) =>
      setDynamicColumns((cols) => {
        if (
          fromIndex < 0 ||
          fromIndex >= cols.length ||
          toIndex < 0 ||
          toIndex >= cols.length ||
          fromIndex === toIndex
        ) {
          return cols
        }
        const next = [...cols]
        const [moved] = next.splice(fromIndex, 1)
        next.splice(toIndex, 0, moved)
        return next
      }),

    getColumnConfig: (prop: string) => dynamicColumns.value.find((c) => getColumnKey(c) === prop),

    getAllColumns: () => [...dynamicColumns.value]
  }
}
