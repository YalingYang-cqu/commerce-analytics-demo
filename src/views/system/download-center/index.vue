<template>
  <div class="user-page art-full-height">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :showSearch="false"
      @reset="resetSearchParams"
      @search="handleSearch"
    />
    <!-- 表格头部 -->
    <ArtTableHeader
      layout="refresh,columnsNew"
      v-model:columns="columnChecks"
      :loading="loading"
      @refresh="refreshData"
      :updateColumn="updateColumn"
      :resetColumns="resetColumns"
      tableName="dict-manage"
    >
    </ArtTableHeader>
    <ElCard shadow="never">
      <!-- 表格 -->
      <ArtTable
        :loading="loading"
        :data="data"
        :columns="columns"
        :columnChecks="columnChecks"
        :pagination="pagination"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
      </ArtTable>
    </ElCard>
  </div>
</template>

<script setup lang="ts">
  import { useTable } from '@/composables/useTable'
  import { getExportTask } from '@/api/system-manage'
  import { ElTag, ElButton } from 'element-plus'
  import { fileLinkToStreamDownload } from '@/utils/common-util'
  import dayjs from 'dayjs'
  defineOptions({ name: 'DownloadCenter' })

  const searchItems = [
    {
      label: '',
      key: 'status',
      type: 'select',
      props: {
        placeholder: '状态',
        options: [
          {
            value: 0,
            label: '待处理'
          },
          {
            value: 1,
            label: '处理中'
          },
          {
            value: 2,
            label: '已完成'
          },
          {
            value: 3,
            label: '已失败'
          }
        ],
        clearable: true
      },
      trigger: 'change'
    }
  ]

  // 搜索表单
  const searchForm = ref({
    userName: undefined,
    userGender: undefined,
    userPhone: undefined,
    userEmail: undefined,
    status: undefined
  })

  // 状态配置
  const STATUS_CONFIG: any = {
    '0': { type: 'info', text: '待处理' },
    '1': { type: 'primary', text: '处理中' },
    '2': { type: 'success', text: '已完成' },
    '3': { type: 'danger', text: '已失败' }
  } as const

  const getUserStatusConfig = (status: string) => {
    return STATUS_CONFIG[status] || '-'
  }

  const {
    columns,
    columnChecks,
    data,
    loading,
    pagination,
    getData,
    searchParams,
    resetSearchParams,
    handleSizeChange,
    handleCurrentChange,
    refreshData,
    resetColumns,
    updateColumn
  } = useTable({
    // 核心配置
    core: {
      apiFn: async (params: any) => {
        params.pageNum = params.currentPage
        const res = await getExportTask(params)
        return res
      },
      apiParams: {
        ...searchForm.value,
        currentPage: 1,
        exportBusinessPortType: 'business_system',
        pageSize: 20,
        hasCount: true
      },
      columnsFactory: () => [
        {
          prop: 'taskName',
          label: '任务名称',
          width: 280
        },
        {
          prop: 'createTime',
          label: '创建时间',
          width: 180
        },
        {
          prop: 'status',
          label: '状态',
          formatter: (row: any) => {
            const statusConfig = getUserStatusConfig(String(row.status))
            if (statusConfig === '-' || !statusConfig) {
              return '-'
            }
            return h(ElTag, { type: statusConfig.type }, () => statusConfig.text)
          }
        },
        {
          prop: 'completeTime',
          label: '完成时间',
          width: 180
        },
        {
          prop: 'failReason',
          label: '失败原因',
          minWidth: 180
        },
        // {
        //   prop: 'createTime',
        //   label: '创建日期',
        //   sortable: true
        // },
        {
          prop: 'operation',
          label: '操作',
          width: 100,
          fixed: 'right', // 固定列
          align: 'center',

          formatter: (_row: any) =>
            _row.status !== 2
              ? ''
              : h('div', [
                  h(
                    ElButton,
                    {
                      type: 'primary',
                      link: true,
                      size: 'small',
                      onClick: () => {
                        downLoadAction(_row)
                      }
                    },
                    () => '下载'
                  )
                ])
        }
      ]
    }
  })
  // 处理搜索事件
  const handleSearch = () => {
    Object.assign(searchParams, searchForm.value)
    getData()
  }
  const downLoadAction = (_row: any) => {
    const name = `${_row.taskName.replace('导出', '')}-${dayjs(_row.createTime).format('YYYYMMDDHHmmss')}`
    fileLinkToStreamDownload(_row.downloadUrl, name)
  }
  onActivated(() => {
    getData()
  })
</script>

<style lang="scss" scoped>
  .user-page {
    :deep(.user) {
      .avatar {
        width: 40px;
        height: 40px;
        margin-left: 0;
        border-radius: 6px;
      }

      > div {
        margin-left: 10px;

        .user-name {
          font-weight: 500;
          color: var(--art-text-gray-800);
        }
      }
    }
  }
</style>
