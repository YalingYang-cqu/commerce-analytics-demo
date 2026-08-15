<template>
  <div class="mkTable" ref="containerRef">
    <div class="border-first" :style="{ left: firstColumnWidth }" v-if="showFirstBorder"></div>

    <ElTable
      :class="[
        'art-table',
        {
          'mk-table-summary': showSummary,
          'mk-table-overX': !overX,
          'mk-table-noOverX': overX,
          'mk-table-Border': isBorder,
          'mk-table-BgTh': isBgTh,
          'mk-table-scrollBar': overX
        }
      ]"
      :border="isBorder"
      :ref="tableRef"
      :id="tableRef"
      :data="tableData"
      :default-expand-all="defaultExpandAll"
      :height="dataTableHeight"
      @sort-change="sortCb"
      @selection-change="fnCheckedTable"
      @select="fnSelectTable"
      @select-all="selectAll"
      @expand-change="fnChangeExpand"
      @header-dragend="headerDragend"
      @row-click="fnRowClick"
      @row-dblclick="fnRowdbClick"
      @cell-mouse-enter="fnCellMouseEnter"
      @cell-mouse-leave="fnCellMouseLeave"
      :row-class-name="rowClassName"
      :tree-props="treeProps"
      :cell-style="cellStyle"
      :header-cell-class-name="headerCellClassName"
      :header-row-style="headerRowStyle"
      :row-key="rowKey"
      :show-summary="showSummary"
      :span-method="spanMethod"
      :summary-method="summaryMethodOther ? fnCountSumTotal : countSumTotal"
    >
      <!-- 展开列 -->
      <el-table-column type="expand" v-if="showExpand">
        <template #default="props">
          <slot name="expandChild" :scope="props.row"></slot>
        </template>
      </el-table-column>

      <!-- 选择列 -->
      <el-table-column
        type="selection"
        :reserve-selection="true"
        v-if="showSelection"
        :selectable="fnSelectable"
        width="55"
        fixed="left"
      />

      <!-- 动态列 -->
      <template v-for="(item, i) in filteredTableSetting" :key="`${item.prop}${i}`">
        <!-- 不需要插槽的列 -->
        <el-table-column
          v-if="item.isNotSlot"
          :render-header="renderHeader"
          :sortable="item.sortable ? 'custom' : false"
          :fixed="item.fixed"
          :width="item.width"
          :prop="item.prop"
          :min-width="item.minWidth"
          :type="item.type"
          :label="item.name"
          :show-overflow-tooltip="item.showOverflowTooltip"
        >
          <template #default="scope">
            <div v-if="!item.canWrap" class="can-wrap">
              {{ formatCellData(scope.row, item.prop) }}
            </div>
            <div v-else>{{ formatCellData(scope.row, item.prop) }}</div>
          </template>
        </el-table-column>

        <!-- 需要插槽的列 -->
        <el-table-column
          v-else
          :render-header="renderHeader"
          :sortable="item.sortable ? 'custom' : false"
          :fixed="item.fixed"
          :resizable="item.resizable"
          :width="item.width"
          :prop="item.prop"
          :align="item.align"
          :min-width="item.minWidth"
          :label="item.name"
          :type="item.type"
          :show-overflow-tooltip="item.showOverflowTooltip"
        >
          <template #header="scope">
            <slot :name="`${item.prop}_header_column`" :scope="scope">
              <el-tooltip
                class="tooltip-theader"
                popper-class="tool-popover-theader"
                effect="dark"
                placement="top"
                v-if="item.titleDesc"
              >
                <template #content>
                  <div v-html="item.titleDesc"></div>
                </template>
                <span style="cursor: pointer">{{ item.name }}</span>
              </el-tooltip>
              <span v-else>{{ item.name }}</span>
            </slot>
          </template>

          <template #default="scope">
            <slot :name="item.prop" :scope="scope">
              <div v-if="!item.canWrap" class="can-wrap">
                {{ formatCellData(scope.row, item.prop) }}
              </div>
              <div v-else>{{ formatCellData(scope.row, item.prop) }}</div>
            </slot>
          </template>
        </el-table-column>
      </template>

      <!-- 空状态 -->
      <template #empty>
        <img class="table-noData" src="@/assets/img/public/table_noData.svg" />
        <div class="table-noData-note">暂无数据</div>
      </template>
    </ElTable>
  </div>
</template>
<script setup lang="ts">
  import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
  import { ElTable } from 'element-plus'
  import { useWindowSize } from '@vueuse/core'

  // 定义列属性
  export interface tableColumn {
    // 列字段名
    prop: string
    // 列名称
    name: string
    // 是否显示列
    showCol?: boolean
    // 是否-控制显示
    isNotSlot?: boolean
    // 字段排序
    sortable?: boolean
    // 列位置
    fixed?: boolean | string
    resizable?: boolean
    // 列宽
    width?: string | number
    // 列最小宽度
    minWidth?: string | number
    // 列类型
    type?: string
    // 表头位置
    align?: string
    showOverflowTooltip?: boolean
    // 列描述
    titleDesc?: string
    canWrap?: boolean
    // 字段值转换函数
    dataFormat?: (value: any, currency?: string) => string
  }

  interface tableProps {
    isBorder?: boolean
    isBgTh?: boolean
    summaryMethodOther?: boolean
    tableData: any[]
    tableSetting: tableColumn[]
    defaultExpandAll?: boolean
    showSummary?: boolean
    showExpand?: boolean
    showSelection?: boolean
    summaryTotal?: Record<string, any>
    currency?: string
    tableHeight?: number | string
    treeProps?: Record<string, any>
    cellStyle?: Record<string, any> | (({ row, column, rowIndex, columnIndex }: any) => any)
    rowClassName?: string | (({ row, rowIndex }: any) => string)
    headerCellClassName?: string | (({ row, column, rowIndex, columnIndex }: any) => string)
    headerRowStyle?: Record<string, any>
    headerCellStyle?: Record<string, any>
    rowKey?: string | ((row: any) => any)
    fnCountSumTotal?: (param: any) => string[]
    spanMethod?: (param: any) => number[] | { rowspan: number; colspan: number } | undefined
    fnSelectable?: (row: any, index: number) => boolean
    renderHeader?: (data: any) => any
    showFirstBorder?: boolean
    classPlaceholder?: string[] | undefined
  }

  // 对外参数
  const props = withDefaults(defineProps<tableProps>(), {
    isBorder: true,
    isBgTh: false,
    summaryMethodOther: false,
    tableData: () => [],
    tableSetting: () => [],
    defaultExpandAll: true,
    showSummary: false,
    showExpand: false,
    showSelection: false,
    summaryTotal: () => ({}),
    currency: '',
    tableHeight: 0,
    treeProps: () => ({}),
    cellStyle: () => ({}),
    rowClassName: '',
    headerCellClassName: '',
    headerRowStyle: () => ({}),
    headerCellStyle: () => ({}),
    rowKey: '',
    fnCountSumTotal: () => [],
    spanMethod: () => undefined,
    fnSelectable: () => true,
    renderHeader: undefined,
    showFirstBorder: false,
    classPlaceholder: undefined
  })

  // 回调
  const emit = defineEmits<{
    fnBtnHeader: [item: tableColumn]
    fnChangeExpand: []
    fnCheckedTable: [data: any[]]
    fnRowClick: [row: any, column: any, event: Event]
    fnRowdbClick: [row: any, column: any, event: Event]
    fnSelectTable: [data: any, val: any]
    cellMouseEnter: [row: any, column: any, cell: any, event: Event]
    cellMouseLeave: [row: any, column: any, cell: any, event: Event]
    selectAll: [data: any[]]
    sortTableCb: [sortStr?: string]
  }>()

  // 值定义
  // 列表初始化高度
  const dataTableHeight = ref(720)
  const tableRef = ref(`elTable-${Date.now()}`)
  const overX = ref(false)
  // 表格实例
  const tableInstance = ref<InstanceType<typeof ElTable>>()
  // 容器引用
  const containerRef = ref<HTMLElement>()
  // 窗口尺寸
  const { height: windowHeight } = useWindowSize()
  // 容器顶部到视口顶部的初始距离（用于计算表格高度）
  const containerTopOffset = ref(0)

  // 计算属性
  const firstColumnWidth = computed(() => {
    if (props.tableSetting.length && props.tableSetting[0].width) {
      return `${props.tableSetting[0].width}px`
    }
    return '0px'
  })

  // 过滤 - 是否显示的列
  const filteredTableSetting = computed(() => {
    return props.tableSetting.filter((i: tableColumn) => i.showCol !== false)
  })
  // 动态计算列表高度
  const getTableHeight = () => {
    const appContent = document.querySelector('.app-content') as HTMLElement
    let tableHeight: number = 0
    tableHeight = appContent?.offsetHeight || dataTableHeight.value
    tableHeight = tableHeight - 216
    if (props.showSummary && !props.summaryMethodOther) {
      return tableHeight - 40 > 240 ? tableHeight - 40 : 240
    }
    return tableHeight > 240 ? tableHeight : 240
  }
  onMounted(() => {
    dataTableHeight.value = getTableHeight()
  })

  const fnTableDoLayout = () => {
    nextTick(() => {
      tableInstance.value?.doLayout()
    })
  }

  const toggleRowSelection = (rows: any[]) => {
    rows.forEach((rowItem) => {
      const foundRow = props.tableData.find((tdItem) => {
        if (tdItem.word === rowItem.word && tdItem.wordType === rowItem.wordType) {
          return rowItem
        }
      })
      if (foundRow) {
        tableInstance.value!.toggleRowSelection(foundRow, true)
      }
    })
  }

  const ADToggleRowSelection = (rows: any[]) => {
    if (rows && tableInstance?.value) {
      rows.forEach((rowItem) => {
        const foundRow = props.tableData.filter((tdItem) => tdItem.campaignId == rowItem.campaignId)
        if (foundRow) {
          tableInstance?.value!.toggleRowExpansion(foundRow, true)
        }
      })
    }
  }

  const fnToggleRowSelection = (row: any[]) => {
    if (row && tableInstance.value) {
      row.forEach((rowItem) => {
        const foundRow = props.tableData.find((tdItem) => tdItem['asin'] == rowItem['asin'])
        if (foundRow) {
          tableInstance.value!.toggleRowSelection(foundRow, true)
        }
      })
    }
  }

  const productToggleRowSelection = (rows: any[]) => {
    if (tableInstance.value) {
      tableInstance.value.toggleRowSelection(rows, true)
    }
  }

  const clearSelection = () => {
    tableInstance.value?.clearSelection()
  }

  // 列表 - 调整列宽
  const headerDragend = (newWidth: number, oldWidth: number, column: any) => {
    if (newWidth < column.minWidth) {
      column.width = column.minWidth
    } else {
      column.width = newWidth
    }
    const tableColumn = props.tableSetting.find((i) => i.prop === column.property)
    if (tableColumn) {
      tableColumn.width = column.width
    }
  }

  // 行展开/关闭
  const fnChangeExpand = () => {
    emit('fnChangeExpand')
  }

  const clearSort = () => {
    tableInstance.value!.clearSort()
  }

  watch(
    () => props.tableData,
    () => {
      // 数据变化可能影响分页显示与容器布局，重新计算高度
      nextTick(() => {
        updateContainerTopOffset()
        FnSetTableHeight()
      })
    }
  )

  const fnCheckedTable = (data: any[]) => {
    emit('fnCheckedTable', data)
  }

  const fnRowClick = (row: any, column: any, event: Event) => {
    emit('fnRowClick', row, column, event)
  }

  const fnRowdbClick = (row: any, column: any, event: Event) => {
    emit('fnRowdbClick', row, column, event)
  }

  const fnSelectTable = (data: any, val: any) => {
    emit('fnSelectTable', data, val)
  }

  const fnCellMouseEnter = (row: any, column: any, cell: any, event: Event) => {
    emit('cellMouseEnter', row, column, cell, event)
  }

  const fnCellMouseLeave = (row: any, column: any, cell: any, event: Event) => {
    emit('cellMouseLeave', row, column, cell, event)
  }

  const selectAll = (data: any[]) => {
    emit('selectAll', data)
  }

  // 更新容器顶部偏移量
  const updateContainerTopOffset = () => {
    if (containerRef.value) {
      containerTopOffset.value = containerRef.value.getBoundingClientRect().top
    } else if (tableInstance.value?.$el) {
      const tableEl = tableInstance.value.$el as HTMLElement
      containerTopOffset.value = tableEl.getBoundingClientRect().top
    }
  }

  const FnSetTableHeight = () => {
    nextTick(() => {
      // 如果传入了 tableHeight，直接使用
      if (props.tableHeight) {
        dataTableHeight.value = Number(props.tableHeight)
        return
      }

      const tableEl = tableInstance.value?.$el as HTMLElement | undefined
      if (!tableEl) return

      // 方法1: 优先使用父容器（table-wrapper）的实际高度
      const parentEl = tableEl.parentElement
      if (parentEl) {
        const parentHeight = parentEl.clientHeight
        if (parentHeight > 0) {
          // 查找分页器，如果存在则减去分页器高度
          const containerEl = parentEl.parentElement // table-container
          if (containerEl) {
            const paginationEl = containerEl.querySelector(
              '.table-pagination'
            ) as HTMLElement | null
            if (paginationEl) {
              const paginationRect = paginationEl.getBoundingClientRect()
              const paginationStyle = window.getComputedStyle(paginationEl)
              const paginationMarginTop = parseInt(paginationStyle.marginTop || '0') || 0
              const paginationPaddingTop = parseInt(paginationStyle.paddingTop || '0') || 0
              const paginationPaddingBottom = parseInt(paginationStyle.paddingBottom || '0') || 0
              const paginationHeight = Math.round(
                paginationRect.height +
                  paginationMarginTop +
                  paginationPaddingTop +
                  paginationPaddingBottom || 0
              )
              const availableHeight = parentHeight - paginationHeight
              if (availableHeight > 0) {
                dataTableHeight.value = Math.max(availableHeight, 240)
                return
              }
            }
          }
          // 如果没有找到分页器，直接使用父容器高度
          dataTableHeight.value = Math.max(parentHeight, 240)
          return
        }
      }

      // 方法2: 使用窗口高度动态计算（优化后的方案）
      const viewportH = windowHeight.value || window.innerHeight
      const topOffset = containerTopOffset.value || tableEl.getBoundingClientRect().top

      const calcPaginationHeight = (): number => {
        if (!parentEl) return 0
        const pg = parentEl.querySelector('.table-pagination') as HTMLElement | null
        if (!pg) return 0
        const rect = pg.getBoundingClientRect()
        const style = window.getComputedStyle(pg)
        const mt = parseInt(style.marginTop || '0') || 0
        const mb = parseInt(style.marginBottom || '0') || 0
        const h = Math.round(rect.height) || pg.offsetHeight || 0
        return h + mt + mb
      }

      const paginationH = calcPaginationHeight()
      const cardEl = tableEl.closest('.art-table-card') as HTMLElement | null
      const cardStyle = cardEl ? window.getComputedStyle(cardEl) : undefined
      const cardPaddingBottom = cardStyle ? parseInt(cardStyle.paddingBottom || '0') || 0 : 0
      const scrollBarH = document.body.scrollWidth > window.innerWidth ? 16 : 0
      const reserved = 8 + cardPaddingBottom + scrollBarH

      // 优先以卡片底部为边界，确保不与分页器重叠
      const cardBottom = cardEl ? cardEl.getBoundingClientRect().bottom : viewportH
      const boundaryH = Math.min(viewportH, cardBottom)
      const computedH = Math.floor(boundaryH - topOffset - paginationH - reserved)
      dataTableHeight.value = computedH > 240 ? computedH : 240
    })
  }

  const sortCb = (el: any) => {
    if (!el.order) {
      emit('sortTableCb')
    } else {
      const sortStr = `${el.prop} ${el.order === 'ascending' ? 'asc' : 'desc'}`
      emit('sortTableCb', sortStr)
    }
  }

  const countSumTotal = (): string[] => {
    if (!props.showSummary) return filteredTableSetting.value.map(() => '-')

    return filteredTableSetting.value.map((i, j) => {
      if (j === 0) {
        return '合计'
      } else {
        if (i.dataFormat) {
          return i.dataFormat(props.summaryTotal[i.prop], props.currency)
        }
        return props.summaryTotal[i.prop] || ''
      }
    })
  }

  const camelToSnake = (key: string): string => {
    return key.replace(/[A-Z]/g, (m) => `_${m.toLowerCase()}`)
  }

  const trySynonyms = (row: Record<string, any>, key: string): any => {
    const map: Record<string, string[]> = {
      supplierFullName: ['supplierName'],
      supplierShortName: ['shortName'],
      createTime: ['create_time'],
      updateTime: ['update_time'],
      supplierCode: ['supplier_code'],
      supplierWarehouse: ['supplier_warehouse'],
      feishuGroup: ['feishu_group'],
      auditorNames: ['auditor_names'],
      supplierNames: ['purchaserNames', 'supplier_names'],
      email: ['mail', 'email_address'],
      mobile: ['phone', 'mobilePhone']
    }
    const list = (map[key] || []).concat([camelToSnake(key)])
    for (const k of list) {
      if (row[k] !== undefined && row[k] !== null) return row[k]
    }
    return undefined
  }

  const formatCellData = (row: any, cellKey: string): string => {
    const setObj = props.tableSetting?.find((i) => i.prop === cellKey)
    const val = row?.[cellKey] ?? trySynonyms(row || {}, cellKey)
    return setObj?.dataFormat ? setObj.dataFormat(val, props.currency) : (val ?? '')
  }

  // 监听窗口大小变化，重新计算表格高度和容器偏移量
  watch(windowHeight, () => {
    nextTick(() => {
      updateContainerTopOffset()
      FnSetTableHeight()
    })
  })

  onMounted(() => {
    // 初始化容器偏移量
    nextTick(() => {
      updateContainerTopOffset()
      FnSetTableHeight()
    })

    const handleResion = () => {
      updateContainerTopOffset()
      FnSetTableHeight()
    }

    window.addEventListener('resize', handleResion)

    const tableBody = tableInstance.value?.$el.querySelector('.el-table_body')

    if (tableBody) {
      const observer = new MutationObserver((records: any) => {
        const clientW = parseInt(records[0].target.style.width)
        const showW = tableInstance.value?.$el.offsetWidth || 0
        overX.value = clientW <= showW
      })

      observer.observe(tableBody, {
        attributes: true,
        attributeOldValue: true
      })

      onUnmounted(() => {
        // 页面卸载时，停止浏览器窗口的变化
        observer.disconnect()
        window.removeEventListener('resize', handleResion)
      })
    }

    // 监听父容器尺寸变化（搜索栏/分页显示隐藏会改变布局）
    const parentEl = tableInstance.value?.$el.parentElement
    if (parentEl) {
      const resizeObserver = new ResizeObserver(() => {
        nextTick(() => {
          updateContainerTopOffset()
          FnSetTableHeight()
        })
      })
      resizeObserver.observe(parentEl)
      onUnmounted(() => {
        resizeObserver.disconnect()
      })

      // 监控父容器样式变化（例如 margin-top 影响位置）
      const styleObserver = new MutationObserver(() => {
        nextTick(() => {
          updateContainerTopOffset()
          FnSetTableHeight()
        })
      })
      styleObserver.observe(parentEl, { attributes: true, attributeFilter: ['style'] })
      onUnmounted(() => {
        styleObserver.disconnect()
      })
    }
  })
  watch(() => props.tableHeight, FnSetTableHeight)
  watch(
    () => props.summaryTotal,
    () => {
      nextTick(() => {
        tableInstance.value?.doLayout()
      })
    }
  )

  // 对外暴露的方法及变量
  defineExpose({
    fnTableDoLayout,
    toggleRowSelection,
    ADToggleRowSelection,
    fnToggleRowSelection,
    productToggleRowSelection,
    clearSelection,
    clearSort,
    tableInstance
  })
</script>

<style lang="scss" scoped>
  .mkTable {
    position: relative;

    .border-first {
      position: absolute;
      top: 0;
      z-index: 5;
      width: 1px;
      height: 100%;
      background: #ebeef5;
    }
  }

  .mk-table {
    width: 100%;
    background: #fff;
    border: 1px solid #e4e7ed;

    :deep(.el-table__fixed) {
      height: calc(100% - 8px) !important;

      &::before {
        height: 0;
      }
    }

    :deep(.el-table__fixed-right) {
      height: calc(100% - 8px) !important;
    }

    &.el-table--border::after,
    &.el-table--group::after,
    &::before {
      content: none;
    }

    :deep(th) {
      padding: 0 16px;
      font-size: 12px;
      font-weight: 400;
      color: #323233;
      background-color: #f7f8fa;
      border-right: 0;
      border-bottom-color: #e4e7ed;

      .cell {
        display: flex;
        align-items: center;
        min-width: 80px;
        height: 32px;
        padding: 0;
      }

      &:hover {
        border-right: 1px solid #e4e7ed;
      }
    }

    :deep(td) {
      padding: 0 16px;
      border-right: 0;
      border-bottom: solid 1px #e4e7ed;

      .cell {
        display: flex;
        align-items: center;
        height: 48px;
        padding: 0;
        font-size: 12px;
        line-height: 22px;
        color: #303133;
      }
    }

    .can-wrap {
      display: -webkit-box;
      -webkit-line-clamp: 2;
      -webkit-box-orient: vertical;
      overflow: hidden;
      word-break: break-word;
    }

    :deep(.el-table__fixed-footer-wrapper) {
      height: 32px;

      td.is-right {
        display: flex;
        align-items: center;
        height: 34px;

        .cell {
          height: 32px;
        }
      }
    }

    :deep(.el-table__fixed-footer-wrapper tbody td),
    :deep(.el-table__footer-wrapper td) {
      border-top: none;
      border-bottom: 1px solid #f5f7fa;
    }

    :deep(.el-table__body tr.hover-row > td) {
      background-color: #eff2ff;
    }
  }

  .mk-table-overX {
    &.mk-table-summary {
      :deep(.el-table__body-wrapper),
      :deep(.el-table__fixed-body-wrapper) {
        height: calc(100% - 32px) !important;
        padding-bottom: 32px;
      }

      :deep(.el-table__fixed) {
        height: calc(100% - 8px) !important;
      }

      :deep(.el-table__footer-wrapper) {
        position: relative;
        bottom: 41px;
        display: flex;
        align-items: center;
        height: 34px;
      }

      &.mk-table-scrollBar {
        :deep(.el-table__body-wrapper) {
          height: calc(100% - 25px) !important;
          padding-bottom: 56px;
        }

        :deep(.el-table__fixed) {
          height: calc(100% + 1px) !important;
        }
      }
    }
  }

  .mk-table-noOverX {
    &.mk-table-summary {
      :deep(.el-table__body-wrapper),
      :deep(.el-table__fixed-body-wrapper) {
        height: calc(100% - 32px) !important;
        padding-bottom: 32px;
      }

      :deep(.el-table__fixed) {
        height: calc(100% - 8px) !important;
      }

      :deep(.el-table__footer-wrapper) {
        position: relative;
        bottom: 41px;
        display: flex;
        align-items: center;
        height: 34px;
      }

      &.mk-table-scrollBar {
        :deep(.el-table__body-wrapper) {
          height: calc(100% - 25px) !important;
          padding-bottom: 34px;
        }

        :deep(.el-table__fixed) {
          height: calc(100% + 1px) !important;
        }
      }
    }
  }

  .mk-table-Border {
    :deep(th) {
      display: table-cell !important;
      background-color: #f7f8fa;
      border-right: 1px solid #ebeef5;

      &:nth-last-child(2) {
        border-right: 0;
      }

      .cell {
        height: 36px;
        line-height: initial;
      }
    }

    :deep(td) {
      border-right: 1px solid #ebeef5;

      &:last-child {
        border-right: 0;
      }

      .cell {
        height: 36px;
        line-height: initial;
      }
    }

    :deep(.el-table__fixed-right) {
      height: calc(100% - -1px) !important;
    }
  }

  .mk-table-scrollBar {
    :deep(.el-table__fixed-right) {
      height: 100% !important;
    }
  }

  :deep(.el-table__empty-block) {
    justify-content: flex-start;

    .el-table__empty-text {
      width: 100vw;
      line-height: inherit;

      .table-noData {
        width: 120px;
      }

      .table-noData-note {
        font-size: 14px;
      }
    }
  }
</style>
