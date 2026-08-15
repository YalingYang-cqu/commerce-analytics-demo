<template>
  <el-pagination
    class="mk-pagination"
    :layout="layout"
    :page-sizes="pageSizes"
    :current-page="pageNum"
    :total="total"
    :page-size="pageSize"
    @size-change="handleSizeChange"
    @current-change="handleCurrentChange"
  />
</template>

<script setup lang="ts">
  import { ElPagination } from 'element-plus'

  interface Props {
    layout?: string
    pageNum?: number
    total?: number
    pageSize?: number
    pageSizes?: number[]
  }

  interface Emits {
    (e: 'update:pageSize', value: number): void
    (e: 'update:pageNum', value: number): void
    (e: 'SonSizeChange', value: number): void
    (e: 'SonCurrentChange', value: number): void
  }

  // Props
  withDefaults(defineProps<Props>(), {
    layout: 'total, sizes, prev, pager, next, jumper',
    pageNum: 1,
    total: 0,
    pageSize: 20,
    pageSizes: () => [10, 20, 30, 50, 100]
  })

  // Emits
  const emit = defineEmits<Emits>()

  // Methods
  /** 每页条数变化 */
  const handleSizeChange = (pageSize: number): void => {
    localStorage.setItem('pageSize', pageSize.toString())
    emit('update:pageSize', pageSize)
    emit('SonSizeChange', pageSize)
  }

  /** 当前页码变化 */
  const handleCurrentChange = (pageCurrent: number): void => {
    emit('update:pageNum', pageCurrent)
    emit('SonCurrentChange', pageCurrent)
  }
</script>

<style lang="scss" scoped>
  .mk-pagination {
    display: flex;
    justify-content: flex-end;
    padding: 12px 16px;
    text-align: right;
    background: #fff;
    border: 1px solid #e4e7ed;
    border-radius: 8px;
    // border-top: none;

    :deep(.el-pager li),
    :deep(.btn-next),
    :deep(.btn-prev) {
      min-width: 22px;
      height: 22px;
      margin: 3px 2px 0 0;
      font-size: 12px;
      font-weight: 500;
      line-height: 22px;
      background: #fff;
    }

    :deep(.el-pager) {
      height: 22px;
      line-height: 22px;

      .more::before {
        line-height: 24px;
      }
    }

    :deep(.el-select .el-input) {
      width: 90px;
      margin-right: 120px;
    }

    :deep(.el-pagination__jump) {
      font-size: 14px;
    }

    :deep(span:not([class*='suffix']), .el-pagination__sizes .el-input .el-input__inner) {
      font-size: 12px;
    }

    :deep(.el-pager li:not(.disabled).active),
    :deep(.el-pager li.active) {
      background-color: #425eff;
    }

    :deep(.el-pager li.active),
    :deep(.el-pager li:hover) {
      color: #fff;
      background-color: #425eff;
      border-radius: 2px;
    }

    :deep(.el-pagination__editor.el-input) {
      width: 40px;
    }
  }
</style>
