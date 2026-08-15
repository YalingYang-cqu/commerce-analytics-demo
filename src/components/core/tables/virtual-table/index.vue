<template>
  <ElCard :class="cardClass" shadow="never" :style="cardStyle">
    <ArtTableHeader
      :show-search-bar="showSearchBar"
      :layout="headerLayout"
      v-model:columns="headerColumns"
      :update-column="updateColumn"
      :reset-columns="resetColumns"
      :loading="loading"
      :full-class="fullClass"
      @refresh="handleRefresh"
    />
    <VxeTable
      ref="tableRef"
      :border="border"
      :auto-resize="true"
      size="mini"
      :stripe="stripe"
      :keep-source="keepSource"
      :data="tableData"
      :cell-config="resolvedCellConfig"
      :cell-style="resolvedCellStyle"
      :loading="loading"
      :edit-config="editConfig"
      :scroll-y="resolvedScrollY"
      :height="resolvedHeight"
      :row-config="{
        keyField: rowId,
        isHover: highlightHoverRow
      }"
      :header-cell-style="resolvedHeaderCellStyle"
      :class="resolvedTableClass"
      :style="tableStyle"
      @scroll="handleTableScroll"
    >
      <template v-for="col in visibleColumns">
        <VxeColumn
          v-if="col.type && col.type !== 'selection'"
          :type="col.type"
          :width="col.width"
          :fixed="col.fixed"
          :title="col.label"
          :align="col.align || 'left'"
          :header-align="col.headerAlign || col.align || 'left'"
          :key="col.renderKey"
        >
          <template v-if="hasSlot(`header-${col.prop || col.type}`)" #header="scope">
            <slot :name="`header-${col.prop || col.type}`" v-bind="scope" />
          </template>
        </VxeColumn>
        <VxeColumn
          v-else-if="col.type === 'selection'"
          :width="col.width"
          :fixed="col.fixed"
          :title="col.label"
          :align="col.align || 'center'"
          :header-align="col.headerAlign || 'center'"
          :key="col.renderKey"
        >
          <template v-if="hasSlot(`header-${col.prop || col.type}`)" #header="scope">
            <slot :name="`header-${col.prop || col.type}`" v-bind="scope" />
          </template>
          <template v-else #header>
            <ElCheckbox
              :model-value="isAllSelected"
              :indeterminate="isIndeterminateSelection"
              @change="toggleAllSelection"
            />
          </template>
          <template v-if="hasSlot(`cell-${col.prop || col.type}`)" #default="scope">
            <slot :name="`cell-${col.prop || col.type}`" v-bind="scope" />
          </template>
          <template v-else #default="{ row }">
            <ElCheckbox
              :model-value="isRowSelected(row)"
              @change="(val) => toggleRowSelection(row, val)"
            />
          </template>
        </VxeColumn>
        <VxeColumn
          v-else
          :title="col.label"
          :field="col.prop"
          :width="col.width"
          :min-width="col.minWidth"
          :fixed="col.fixed"
          :align="col.align || 'left'"
          :header-align="col.headerAlign || col.align || 'left'"
          :edit-render="col.editable ? {} : undefined"
          :key="col.renderKey"
        >
          <template v-if="hasSlot(`header-${col.prop || col.type}`)" #header="scope">
            <slot :name="`header-${col.prop || col.type}`" v-bind="scope" />
          </template>
          <template v-if="hasSlot(`cell-${col.prop}`)" #default="scope">
            <slot :name="`cell-${col.prop}`" v-bind="scope" />
          </template>
          <template v-else #default="{ row }">
            <span>{{ row[col.prop] }}</span>
          </template>
          <template v-if="col.editable" #edit="scope">
            <template v-if="hasSlot(`edit-${col.prop}`)">
              <slot :name="`edit-${col.prop}`" v-bind="scope" />
            </template>
            <ElInput v-else v-model="scope.row[col.prop]" />
          </template>
        </VxeColumn>
      </template>
    </VxeTable>
  </ElCard>
</template>

<script setup>
  import { computed, ref, useSlots, watch, onMounted, onBeforeUnmount, nextTick } from 'vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'

  const props = defineProps({
    columns: {
      type: Array,
      required: true
    },
    initialColumns: {
      type: Array,
      default: null
    },
    data: {
      type: Array,
      default: () => []
    },
    loading: {
      type: Boolean,
      default: false
    },
    height: {
      type: [Number, String],
      default: 680
    },
    border: {
      type: [Boolean, String],
      default: 'full'
    },
    stripe: {
      type: Boolean,
      default: false
    },
    headerBackground: {
      type: Boolean,
      default: false
    },
    rowId: {
      type: String,
      default: 'rowKey'
    },
    cardClass: {
      type: [String, Array, Object],
      default: 'art-table-card'
    },
    cardStyle: {
      type: Object,
      default: () => ({
        marginTop: '0'
      })
    },
    headerLayout: {
      type: String,
      default: 'refresh,fullscreen,columns,settings'
    },
    showSearchBar: {
      type: [Boolean, null],
      default: null
    },
    fullClass: {
      type: String,
      default: 'art-table-card'
    },
    tableClass: {
      type: [String, Array, Object],
      default: null
    },
    tableStyle: {
      type: Object,
      default: () => ({
        marginTop: '6px'
      })
    },
    cellPadding: {
      type: [Number, String, Object],
      default: () => ({
        padding: '4px 0'
      })
    },
    keepSource: {
      type: Boolean,
      default: true
    },
    highlightHoverRow: {
      type: Boolean,
      default: true
    },
    editConfig: {
      type: Object,
      default: () => ({
        trigger: 'click',
        mode: 'row'
      })
    },
    scrollY: {
      type: Object,
      default: () => ({
        enabled: true,
        gt: 0
      })
    },
    cellStyle: {
      type: Function,
      default: null
    },
    headerCellStyle: {
      type: Function,
      default: null
    },
    defaultSelectedKeys: {
      type: Array,
      default: () => []
    }
  })

  const emit = defineEmits(['update:columns', 'refresh', 'selection-change'])

  const cloneColumns = (source) => {
    if (!Array.isArray(source)) return []
    return source.map((item) => ({ ...item }))
  }

  // 内部维护的列配置，用于列的显示/隐藏控制
  const internalColumns = ref(cloneColumns(props.columns))
  // 渲染版本号，用于强制重新渲染列（当列配置变化时）
  const renderVersion = ref(0)

  // 初始列配置的引用，用于重置列配置到初始状态
  const initialColumnsRef = ref(
    cloneColumns(
      props.initialColumns && props.initialColumns.length ? props.initialColumns : props.columns
    )
  )

  // 监听初始列配置的变化，更新初始列引用
  watch(
    () => props.initialColumns,
    (val) => {
      if (val && val.length) {
        initialColumnsRef.value = cloneColumns(val)
      }
    },
    { deep: true }
  )

  watch(
    () => props.columns,
    (val) => {
      internalColumns.value = cloneColumns(val)
      renderVersion.value++
    },
    { deep: true }
  )

  // 双向绑定的列配置，用于表头组件的列显示控制
  // get: 返回当前内部列配置
  // set: 更新内部列配置，增加渲染版本号，并通知父组件
  const headerColumns = computed({
    get: () => internalColumns.value,
    set: (val) => {
      internalColumns.value = cloneColumns(val)
      renderVersion.value++
      emit('update:columns', cloneColumns(internalColumns.value))
    }
  })

  const computeVisibleColumns = (source) => {
    return source
      .filter((column) => column.checked) // 只显示已勾选的列
      .map((column, index) => ({
        ...column,
        renderKey: `${column.prop || column.type}-${renderVersion.value}-${index}` // 生成唯一键
      }))
  }

  // 计算属性：当前可见的列配置
  const visibleColumns = computed(() => computeVisibleColumns(internalColumns.value))

  const slots = useSlots()
  const hasSlot = (name) => !!(slots && slots[name])

  const handleRefresh = () => {
    emit('refresh')
  }

  const updateColumn = (propOrType, updates) => {
    const index = internalColumns.value.findIndex(
      (c) => (c.prop && c.prop === propOrType) || (c.type && c.type === propOrType)
    )
    if (index > -1) {
      const next = cloneColumns(internalColumns.value)
      next[index] = { ...next[index], ...updates }
      headerColumns.value = next
    }
  }

  const resetColumns = () => {
    headerColumns.value = cloneColumns(initialColumnsRef.value)
  }

  const resolvedTableClass = computed(() => {
    const base = ['virtual-vxe-table']
    if (props.headerBackground) {
      base.push('has-header-background')
    }
    const extra = props.tableClass
    if (Array.isArray(extra)) {
      base.push(...extra)
    } else if (typeof extra === 'string') {
      base.push(extra)
    } else if (extra && typeof extra === 'object') {
      base.push(extra)
    }
    return base
  })

  // 确保高度是数字类型，用于虚拟滚动
  const resolvedHeight = computed(() => {
    if (typeof props.height === 'string') {
      const num = parseInt(props.height, 10)
      return isNaN(num) ? 680 : num
    }
    return props.height || 680
  })

  const resolvedCellConfig = computed(() => {
    const basePadding = {
      height: 32,
      padding: '0 8px'
    }
    if (typeof props.cellPadding === 'number') {
      return {
        padding: {
          ...basePadding,
          height: props.cellPadding
        }
      }
    }
    if (typeof props.cellPadding === 'string') {
      return {
        padding: {
          ...basePadding,
          padding: props.cellPadding
        }
      }
    }
    if (props.cellPadding && typeof props.cellPadding === 'object') {
      return {
        padding: {
          ...basePadding,
          ...props.cellPadding
        }
      }
    }
    return { padding: basePadding }
  })

  const defaultCellStyle = () => ({
    whiteSpace: 'normal',
    wordBreak: 'break-word',
    padding: '4px 0'
  })

  const resolvedCellStyle = computed(() => props.cellStyle || defaultCellStyle)

  const defaultHeaderCellStyle = () => {
    const baseStyle = {
      color: 'var(--el-table-header-text-color)',
      fontWeight: 600,
      padding: '0 8px'
    }
    if (!props.headerBackground) {
      return {
        ...baseStyle,
        backgroundColor: '#fff'
      }
    }
    return {
      ...baseStyle,
      backgroundColor: 'var(--el-fill-color-lighter)'
    }
  }

  const resolvedHeaderCellStyle = computed(() => props.headerCellStyle || defaultHeaderCellStyle)

  const tableData = ref([])
  const selectedRowKeys = ref(new Set())

  // 估算/纠正虚拟行高
  const tableRef = ref(null)
  const estimatedRowHeight = ref(32)

  const resolvedScrollY = computed(() => {
    const base = props.scrollY || {}
    return {
      ...base,
      // vxe 虚拟滚动未加载行的估算高度，后续通过已渲染行纠正
      sItemHeight: estimatedRowHeight.value
    }
  })

  let measureRaf = null
  const cancelMeasure = () => {
    if (measureRaf !== null) {
      cancelAnimationFrame(measureRaf)
      measureRaf = null
    }
  }

  const runMeasure = () => {
    // 从已渲染的行中统计平均高度，用于逐步纠正估算行高
    const rootEl = tableRef.value?.$el
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
      // 使用缓动更新，避免抖动
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

  const handleTableScroll = () => {
    // 滚动过程中持续用可见区行高来修正估算值
    // 避免过于频繁，使用微任务合并
    measureRenderedRowHeights()
  }

  const getRowKey = (row) => row[props.rowId]

  const emitSelectionChange = () => {
    const keys = [...selectedRowKeys.value]
    const rows = tableData.value.filter((row) => selectedRowKeys.value.has(getRowKey(row)))
    emit('selection-change', { keys, rows })
  }

  const rebuildSelectedKeys = () => {
    const availableKeys = new Set(tableData.value.map((row) => row[props.rowId]))
    const nextKeys = new Set([...selectedRowKeys.value].filter((key) => availableKeys.has(key)))
    selectedRowKeys.value = nextKeys
    emitSelectionChange()
  }

  const ensureRowKey = (rows) => {
    const used = new Set()
    let seed = 1
    return rows.map((item) => {
      const cloned = { ...item }
      let key = cloned[props.rowId]
      if (key === undefined || key === null || key === '') {
        key = `__vk-${seed++}`
      }
      while (used.has(key)) {
        key = `__vk-${seed++}`
      }
      cloned[props.rowId] = key
      used.add(key)
      return cloned
    })
  }

  watch(
    () => props.data,
    (rows) => {
      const source = Array.isArray(rows) ? rows : []
      tableData.value = ensureRowKey(source)
      rebuildSelectedKeys()
    },
    { immediate: true, deep: true }
  )

  watch(
    () => props.defaultSelectedKeys,
    (keys) => {
      selectedRowKeys.value = new Set(Array.isArray(keys) ? keys : [])
      rebuildSelectedKeys()
    },
    { immediate: true, deep: true }
  )

  watch(
    tableData,
    () => {
      rebuildSelectedKeys()
    },
    { deep: true }
  )

  onMounted(() => {
    nextTick(() => {
      measureRenderedRowHeights()
    })
  })

  onBeforeUnmount(() => {
    cancelMeasure()
  })

  watch(
    tableData,
    () => {
      nextTick(() => {
        measureRenderedRowHeights()
      })
    },
    { deep: true }
  )

  watch(renderVersion, () => {
    nextTick(() => {
      measureRenderedRowHeights()
    })
  })

  watch(resolvedHeight, () => {
    nextTick(() => {
      measureRenderedRowHeights()
    })
  })

  const toggleRowSelection = (row, checked) => {
    const keys = new Set(selectedRowKeys.value)
    const rowKey = getRowKey(row)
    if (checked) {
      keys.add(rowKey)
    } else {
      keys.delete(rowKey)
    }
    selectedRowKeys.value = keys
    emitSelectionChange()
  }

  const toggleAllSelection = (checked) => {
    if (checked) {
      selectedRowKeys.value = new Set(tableData.value.map((row) => getRowKey(row)))
    } else {
      selectedRowKeys.value = new Set()
    }
    emitSelectionChange()
  }

  const isRowSelected = (row) => selectedRowKeys.value.has(getRowKey(row))

  const isAllSelected = computed(() => {
    return (
      tableData.value.length > 0 &&
      tableData.value.every((row) => selectedRowKeys.value.has(getRowKey(row)))
    )
  })

  const isIndeterminateSelection = computed(() => {
    return selectedRowKeys.value.size > 0 && !isAllSelected.value
  })
</script>

<style scoped>
  /* :deep(.vxe-table--body-inner-wrapper) {
    overflow: auto;
  } */
  :deep(.vxe-cell) {
    height: auto !important;
    padding: 0 8px !important;
    line-height: 24px !important;
    .el-checkbox {
      height: auto !important;
    }
  }
  :deep(.vxe-table--header-inner-wrapper) {
    height: auto !important;
    min-height: 32px !important;
  }
  :deep(.vxe-header--row) {
    th {
      height: auto !important;
    }
    .vxe-cell {
      min-height: 32px !important;
      padding: 0 !important;
      .vxe-header-cell--wrapper {
        min-height: 32px !important;
        line-height: 32px;
      }
    }
  }
  :deep(.virtual-vxe-table .vxe-body--row) {
    transition: background-color 0.2s ease;
    td {
      height: auto !important;
    }
  }

  :deep(.virtual-vxe-table .vxe-body--row.row--hover),
  :deep(.virtual-vxe-table .vxe-body--row:hover) {
    background-color: #f5f7fa !important;
  }
</style>
