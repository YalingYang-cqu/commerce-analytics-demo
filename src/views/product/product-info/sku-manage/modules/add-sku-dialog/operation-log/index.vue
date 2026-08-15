<template>
  <div class="operation-log">
    <ElTable :data="tableData" border stripe style="width: 100%" v-loading="loading">
      <ElTableColumn label="时间" prop="createTime" width="160" />
      <ElTableColumn label="操作人" prop="updaterName" width="100" />
      <ElTableColumn label="板块" prop="module" width="100" />
      <ElTableColumn label="操作类型" prop="operateType" width="100" />
      <ElTableColumn label="详情" prop="operateContent" min-width="300" show-overflow-tooltip />
    </ElTable>

    <div class="pagination-wrapper">
      <ElPagination
        v-model:current-page="pagination.currentPage"
        v-model:page-size="pagination.pageSize"
        :page-sizes="[10, 20, 50, 100]"
        :total="pagination.total"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="handleSizeChange"
        @current-change="handleCurrentChange"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch } from 'vue'
  import { ElTable, ElTableColumn, ElPagination } from 'element-plus'
  import { getOptLog } from '@/api/system-manage'

  interface Props {
    sku?: string
  }

  interface OperationLogItem {
    createBy?: number
    createTime?: string
    id?: number
    module?: string
    operateContent?: string
    operateType?: string
    relationCode?: string
    relationType?: string
    updateBy?: number
    updateTime?: string
    updaterName?: string
  }

  const props = defineProps<Props>()

  const loading = ref(false)
  const tableData = ref<OperationLogItem[]>([])
  const pagination = reactive({
    currentPage: 1,
    pageSize: 20,
    total: 0
  })

  const loadOperationLog = async () => {
    if (!props.sku) return

    loading.value = true
    try {
      const res: any = await getOptLog({
        currentPage: pagination.currentPage,
        pageSize: pagination.pageSize,
        hasCount: true,
        logKey: 'PRODUCT_SKU@',
        // relationCode: props.sku,
        orderBy: 'create_time desc'
      })

      if (res?.data) {
        tableData.value = res.data.dtoList || []
        pagination.total = res.data.total || 0
      }
    } catch (error) {
      console.error('加载操作日志失败:', error)
      tableData.value = []
      pagination.total = 0
    } finally {
      loading.value = false
    }
  }

  const handleSizeChange = (pageSize: number) => {
    pagination.pageSize = pageSize
    pagination.currentPage = 1
    loadOperationLog()
  }

  const handleCurrentChange = (currentPage: number) => {
    pagination.currentPage = currentPage
    loadOperationLog()
  }

  // 监听 SKU 变化，重新加载日志
  watch(
    () => props.sku,
    (newSku) => {
      if (newSku) {
        pagination.currentPage = 1
        loadOperationLog()
      }
    },
    { immediate: true }
  )
</script>

<style lang="scss" scoped>
  .operation-log {
    padding: 20px;

    .pagination-wrapper {
      display: flex;
      justify-content: flex-end;
      margin-top: 16px;
    }
  }
</style>
