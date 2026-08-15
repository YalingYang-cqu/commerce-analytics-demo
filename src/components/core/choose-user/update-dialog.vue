<template>
  <ElDialog v-model="dialogVisible" title="分配用户" width="800" align-center>
    <div>
      <UserSearch @search="handleSearch" />
      <ElCard shadow="never">
        <ArtTable
          rowKey="id"
          :loading="loading"
          :data="data"
          ref="tableRef"
          :columns="columns"
          :pagination="pagination"
          size="small"
          height="500"
          @selection-change="handleSelectionChange"
          @pagination:size-change="handleSizeChange"
          @pagination:current-change="handleCurrentChange"
        >
        </ArtTable>
      </ElCard>
    </div>
    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="dialogVisible = false">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">确定</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { useTable } from '@/composables/useTable'
  import { ElTag, ElButton, ElMessage } from 'element-plus'
  import UserSearch from './user-search.vue'
  import { getMemberListF } from '@/api/basic/dept-manage'
  import { personProps } from '@/views/system/dept-manage/modules/person-manage/index.vue'

  interface Props {
    visible: boolean
    params: any
  }
  // 选中的行
  const selectedRows = ref<personProps[]>([])
  const tableRef = ref<ComponentPublicInstance>()
  // 事件处理函数
  const handleSelectionChange = (selection: personProps[]) => {
    selectedRows.value = selection
    console.log('选择变更:', selection)
  }
  /**
   * 搜索处理
   * @param params 参数
   */
  const handleSearch = (params: Record<string, any>) => {
    console.log(params, 'paramsparams')
    console.log(searchParams, 'searchParamssearchParams')
    // console.log(defaultFilter.value, 'defaultFilter.valuedefaultFilter.value')
    // defaultFilter.value = params
    // 搜索参数赋值
    Object.assign(searchParams, params)
    // selectedRows.value = []
    // tableRef.value.clearSelection()
    getData()
  }
  const columnsC: any[] = [
    {
      type: 'selection',
      reserveSelection: true
    },
    {
      prop: 'account',
      label: '用户名'
    },
    {
      prop: 'userName',
      label: '真实姓名'
    },
    {
      prop: 'phoneNum',
      label: '手机号'
    },
    {
      prop: 'status',
      label: '状态',
      formatter: (row: personProps) => {
        return h(ElTag, { type: row.status === 1 ? 'success' : 'danger' }, () =>
          row.status === 1 ? '启用' : '禁用'
        )
      }
    }
  ]
  const {
    data,
    getData,
    columns,
    loading,
    pagination,
    handleSizeChange,
    handleCurrentChange,
    searchParams
  } = useTable({
    core: {
      apiFn: (params) => {
        console.log('🚀 API 请求参数:', params)
        if (params.roleId) {
          delete params.deptId
        }
        return getMemberListF(params)
      },
      apiParams: {
        // ...defaultFilter.value,
        deptId: 1,
        currentPage: 1,
        pageSize: 20,
        hasCount: true
      },
      immediate: false,
      columnsFactory: () => columnsC
    },
    // 数据处理
    transform: {
      // dataTransformer: (records: unknown[]): unknown[] => {
      //   if (!Array.isArray(records)) return []
      //   const dataC: Record<string, any>[] = records.map((item: any) => ({
      //     ...item,
      //     id: getUuid()
      //   }))
      //   return dataC
      // },
      // 自定义响应适配器，处理后端特殊的返回格式
      // responseAdapter: (data) => {
      //   const { list, total, pageNum, pageSize } = data
      //   return {
      //     records: list,
      //     total: total,
      //     current: pageNum,
      //     size: pageSize
      //   }
      // }
    }
  })
  const props = defineProps<Props>()
  const emit = defineEmits<{
    'update:visible': [visible: boolean]
    submit: [data: personProps[]]
  }>()

  // 对话框显示控制
  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  /**
   * 提交表单
   * 验证通过后触发提交事件
   */

  const handleSubmit = async () => {
    if (!selectedRows.value.length) {
      return ElMessage.warning('请选择需要提交的数据')
    }
    emit(
      'submit',
      selectedRows.value.map((v: any) => v.id)
    )
    tableRef?.value?.clearSelection()
  }
  watch(
    () => [props.visible, props.params],
    ([visible]) => {
      if (visible) {
        Object.assign(searchParams, { ...props.params })
        getData()
      } else {
        tableRef?.value?.clearSelection()
      }
    },
    { immediate: true }
  )
</script>
