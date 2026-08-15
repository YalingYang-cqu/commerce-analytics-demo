<template>
  <div class="edit-table">
    <ElTable :data="tableData" v-bind="mergedTableProps" class="comp-table">
      <ElTableColumn
        v-if="showIndexColumn"
        prop="index"
        :label="indexColumnLabel"
        :width="indexColumnWidth"
        :align="indexColumnAlign"
      >
        <template #default="{ $index }">
          {{ $index + 1 }}
        </template>
      </ElTableColumn>
      <!-- 通过插槽传入自定义列 -->
      <slot />
      <ElTableColumn
        v-if="showOperationColumn"
        :label="operationColumnLabel"
        :width="operationColumnWidth"
        :align="operationColumnAlign"
        fixed="right"
      >
        <template #default="{ $index }">
          <ElButton type="danger" link size="small" @click="removeRow($index)">
            {{ removeText }}
          </ElButton>
        </template>
      </ElTableColumn>
    </ElTable>
    <div v-if="showAddButton" class="add-btn-wrapper">
      <span class="add-btn" @click="addRow"> + </span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { watch, ref, reactive, computed } from 'vue'
  import {
    ElTable,
    ElTableColumn,
    ElButton,
    type FormInstance,
    type TableProps,
    ElMessage
  } from 'element-plus'

  interface IndexColumnConfig {
    show?: boolean
    label?: string
    width?: string | number
    align?: 'left' | 'center' | 'right'
  }

  interface OperationColumnConfig {
    show?: boolean
    label?: string
    width?: string | number
    align?: 'left' | 'center' | 'right'
  }

  interface Props {
    modelValue: any[]
    defaultRow?: any
    minRows?: number
    removeText?: string
    dataKey?: string
    /** 表格属性配置，支持 ElTable 的所有属性 */
    tableProps?: Partial<TableProps<any>>
    /** 序号列配置 */
    indexColumn?: IndexColumnConfig
    /** 操作列配置 */
    operationColumn?: OperationColumnConfig
    /** 是否显示添加按钮 */
    showAddButton?: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: any[]): void
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    defaultRow: () => ({}),
    minRows: 0,
    removeText: '移除',
    dataKey: 'data',
    tableProps: () => ({}),
    indexColumn: () => ({}),
    operationColumn: () => ({}),
    showAddButton: true
  })

  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()

  // 表格数据
  const tableData = ref<any[]>([])

  // 表单数据（用于表单验证）
  const formData = reactive<Record<string, any>>({})

  // 合并表格属性，默认 border 为 true
  const mergedTableProps = computed(() => ({
    border: true,
    ...props.tableProps
  }))

  // 序号列配置
  const showIndexColumn = computed(() => props.indexColumn?.show !== false)
  const indexColumnLabel = computed(() => props.indexColumn?.label || '序号')
  const indexColumnWidth = computed(() => props.indexColumn?.width || 80)
  const indexColumnAlign = computed(() => props.indexColumn?.align || 'center')

  // 操作列配置
  const showOperationColumn = computed(() => props.operationColumn?.show !== false)
  const operationColumnLabel = computed(() => props.operationColumn?.label || '操作')
  const operationColumnWidth = computed(() => props.operationColumn?.width || 100)
  const operationColumnAlign = computed(() => props.operationColumn?.align || 'center')

  // 初始化数据
  const initData = () => {
    if (!props.modelValue || props.modelValue.length === 0) {
      tableData.value = [JSON.parse(JSON.stringify(props.defaultRow || {}))]
    } else {
      tableData.value = JSON.parse(JSON.stringify(props.modelValue))
    }
    formData[props.dataKey] = tableData.value
  }

  // 添加行
  const addRow = () => {
    const newRow = JSON.parse(JSON.stringify(props.defaultRow || {}))
    tableData.value.push(newRow)
    formData[props.dataKey] = tableData.value
    emit('update:modelValue', [...tableData.value])
  }

  // 移除行
  const removeRow = (index: number) => {
    if (tableData.value.length > props.minRows) {
      tableData.value.splice(index, 1)
      formData[props.dataKey] = tableData.value
      emit('update:modelValue', [...tableData.value])
    } else {
      ElMessage.warning(`至少保留${props.minRows}条数据！`)
    }
  }

  // 验证表单
  const validate = async () => {
    if (!formRef.value) {
      return true
    }
    try {
      await formRef.value.validate()
      return true
    } catch {
      return false
    }
  }

  // 清除验证
  const clearValidate = () => {
    formRef.value?.clearValidate()
  }

  // 初始化
  initData()

  // 监听外部数据变化
  watch(
    () => props.modelValue,
    (newVal) => {
      if (
        newVal &&
        Array.isArray(newVal) &&
        JSON.stringify(newVal) !== JSON.stringify(tableData.value)
      ) {
        tableData.value = JSON.parse(JSON.stringify(newVal))
        formData[props.dataKey] = tableData.value
      }
    },
    { deep: true }
  )

  // 监听内部数据变化
  watch(
    tableData,
    () => {
      formData[props.dataKey] = tableData.value
      emit('update:modelValue', [...tableData.value])
    },
    { deep: true }
  )

  defineExpose({
    validate,
    clearValidate
  })
</script>

<style lang="scss" scoped>
  .edit-table {
    width: 100%;

    :deep(td) {
      vertical-align: top !important;
    }

    .comp-table {
      :deep(.el-table__body-wrapper) {
        .el-table__row {
          .el-table__cell {
            padding: 8px 0;
            vertical-align: top;
          }
        }
      }
    }

    .table-form-item {
      margin-bottom: 0;

      :deep(.el-form-item__error) {
        position: static;
        padding-top: 4px;
        font-size: 12px;
        line-height: 1.2;
        color: var(--el-color-error);
      }

      :deep(.el-form-item__content) {
        margin-left: 0 !important;
      }

      :deep(.el-input__wrapper) {
        &.is-error {
          box-shadow: 0 0 0 1px var(--el-color-error) inset;
        }
      }
    }

    .section {
      .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;

        .section-title-bar {
          width: 4px;
          height: 16px;
          margin-right: 8px;
          background-color: #5d87ff;
        }

        .section-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }
      }
    }

    .attachment-name {
      margin-left: 8px;
      font-size: 12px;
      color: var(--el-text-color-regular);
    }

    .add-btn-wrapper {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding: 4px 8px;
      border: 1px solid #ebeef5;
      border-top-width: 0;

      .add-btn {
        padding: 4px 8px;
        color: #5d87ff;
        cursor: pointer;
        border: 1px solid #5d87ff;
        border-radius: 2px;
      }
    }
  }
</style>
