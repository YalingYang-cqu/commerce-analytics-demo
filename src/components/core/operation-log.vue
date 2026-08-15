<template>
  <div class="operation-log">
    <div class="section-header" v-if="showBar">
      <span class="section-title-bar"></span>
      <span class="section-title">操作日志</span>
    </div>
    <ArtTable
      :loading="loading"
      :data="data"
      :columns="columns"
      :pagination="pagination"
      @pagination:size-change="handleSizeChange"
      @pagination:current-change="handleCurrentChange"
      border
      stripe
      tableKey="log"
    >
      <template #operateContent="{ row }">
        <pre :style="preStyle">{{ row.operateContent }}</pre>
      </template>
    </ArtTable>
  </div>
</template>

<script setup lang="ts">
  import { watch } from 'vue'
  import { getOptLog } from '@/api/system-manage'
  import { useTable } from '@/composables/useTable'

  interface Props {
    spuId?: string
    sku?: string
    showBar?: boolean
    params?: any
    showMoudle?: boolean
    visible?: boolean
    from?: string
  }

  const props = withDefaults(defineProps<Props>(), {
    spuId: '',
    sku: '',
    showBar: true,
    params: {},
    showMoudle: false,
    visible: false,
    from: 'normal'
  })
  const preStyle: any = {
    marginBottom: 0,
    fontFamily: 'Arial, Helvetica, sans-serif',
    whiteSpace: 'pre-wrap',
    fontSize: '12px',
    color: 'rgba(0, 0, 0, 0.85)'
  }
  // 列配置工厂函数
  const columnsFactory = () => [
    {
      prop: 'createTime',
      label: '时间',
      width: 180,
      align: 'center'
    },
    {
      prop: 'updaterName',
      label: '操作人',
      width: 120,
      align: 'center'
    },
    {
      prop: 'module',
      label: '板块',
      width: 80,
      align: 'center',
      hide: !props.showMoudle
    },
    {
      prop: 'operateType',
      label: '操作类型',
      width: 80,
      align: 'center'
    },
    {
      prop: 'operateContent',
      label: '详情',
      useSlot: true
    }
  ]

  const {
    searchParams,
    data,
    getData,
    loading,
    pagination,
    columns,
    handleSizeChange,
    handleCurrentChange,
    updateColumn
  } = useTable({
    core: {
      apiFn: getOptLog,
      immediate: false,
      columnsFactory,
      apiParams: {
        currentPage: 1,
        pageSize: 20,
        ...props.params
      }
    }
  })

  // 监听 showMoudle 变化，动态更新板块列的 hide 属性
  watch(
    () => props.showMoudle,
    (show) => {
      updateColumn('module', { hide: !show })
    },
    { immediate: true }
  )
  // 弹窗
  watch(
    () => [props.params, props.visible],
    (newVal, oldVal) => {
      if (JSON.stringify(newVal) !== JSON.stringify(oldVal) && newVal[1]) {
        Object.assign(searchParams, newVal[0])
        getData()
      }
    },
    { immediate: true }
  )
  // watch(
  //   () => props.params,
  //   (newVal) => {
  //     if (typeof props.visible !== 'boolean') {
  //       Object.assign(searchParams, newVal)
  //       getData()
  //     }
  //   },
  //   { immediate: true }
  // )
  // // 每次组件挂载时都重新调用接口
  // onMounted(() => {
  //   fetchData()
  // })

  // // 如果组件在 keep-alive 中，每次激活时也重新调用接口
  // onActivated(() => {
  //   fetchData()
  // })
  const reget = () => {
    getData()
  }
  defineExpose({
    reget
  })
</script>

<style lang="scss" scoped>
  .operation-log {
    width: 100%;
    height: 100%;
  }

  .section-header {
    display: flex;
    align-items: center;
    margin-bottom: 16px;
  }

  .section-title-bar {
    display: inline-block;
    flex-shrink: 0;
    width: 4px;
    height: 16px;
    margin-right: 8px;
    background-color: #409eff;
  }

  .section-title {
    font-size: 14px;
    font-weight: 500;
    line-height: 1;
    color: #303133;
  }
</style>
