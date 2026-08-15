<template>
  <ElDialog
    v-model="dialogVisible"
    title="添加产品"
    width="1200"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="add-product-dialog">
      <!-- 搜索和筛选区域 -->
      <ArtSearchBar
        v-model="searchForm"
        :items="searchItems"
        :showSearch="false"
        @reset="resetSearchParams"
        @search="handleSearch"
      />
      <br />
      <!-- 产品列表表格 -->
      <ArtTable
        tableKey="addSpu"
        ref="tableRef"
        :loading="loading"
        :data="data"
        :pagination="pagination"
        :columns="columns"
        row-key="id"
        size="small"
        height="400"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
        :row-class-name="getRowClassName"
        style="margin-top: 16px"
      >
        <!-- 图片列 -->
        <template #image="{ row }">
          <ElImage
            v-if="row.picUrl"
            :src="row.picUrl"
            :preview-src-list="[row.picUrl]"
            fit="cover"
            :preview-teleported="true"
            style="width: 50px; height: 50px; border-radius: 4px"
          />
        </template>

        <!-- 中文品名/英文品名列 -->
        <template #name="{ row }">
          <div>
            <div>{{ row.productChineseName || '' }}</div>
            <div>{{ row.productEnglishName || '' }}</div>
          </div>
        </template>
      </ArtTable>
    </div>

    <template #footer>
      <div class="dialog-footer">
        <div class="selected-info">
          <ElDropdown trigger="click">
            <span class="selected-text">
              已选{{ selectedProducts.length }}个商品
              <ElIcon><ArrowDown /></ElIcon>
            </span>
            <template #dropdown>
              <ElDropdownMenu>
                <div class="selected-list">
                  <div v-for="product in selectedProducts" :key="product.id" class="selected-item">
                    {{ product.sku }} - {{ product.productChineseName }}
                  </div>
                </div>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </div>
        <div class="footer-buttons">
          <ElButton @click="handleClose">取消</ElButton>
          <ElButton type="primary" @click="handleConfirm">确定</ElButton>
        </div>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, computed, watch, nextTick } from 'vue'
  import {
    ElDialog,
    ElButton,
    ElImage,
    ElIcon,
    ElDropdown,
    ElDropdownMenu,
    ElMessage
  } from 'element-plus'
  import { ArrowDown } from '@element-plus/icons-vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import { useTable } from '@/composables/useTable'
  import type { ColumnOption } from '@/types'
  import { getSkus } from '@/api/product/spu'

  interface Product {
    id: string
    sku: string
    productChineseName: string
    productEnglishName: string
    materialCode: string
    image?: string
  }

  interface Props {
    modelValue: boolean
    selectedProductIds?: string[] // 已选择的产品ID列表（用于置灰）
    productSpuId: string
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm', products: Product[]): void
  }

  const props = withDefaults(defineProps<Props>(), {
    selectedProductIds: () => [],
    productSpuId: String
  })
  // 搜索表单
  const searchForm = reactive({
    searchType: 'sku', // 复合搜索的搜索类型
    searchValue: '' // 复合搜索的搜索值
  })

  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const tableRef = ref()
  const selectedProducts = ref<Product[]>([])

  // 搜索项配置
  const searchItems = [
    // 输入框类型的复合搜索
    {
      key: 'searchValue',
      label: '',
      compositeSearch: true,
      selectOptions: [
        { label: 'SKU', value: 'sku' },
        { label: '中文品名', value: 'productChineseName' },
        { label: '英文品名', value: 'productEnglishName' },
        { label: '物料编码', value: 'materialCode' }
      ],
      selectKey: 'searchType', // select 的值存储在 searchType
      selectWidth: '100px',
      inputType: 'input',
      placeholder: '搜索内容',
      width: '280px'
    }
  ]

  // 列配置工厂函数
  const columnsFactory = (): ColumnOption<Product>[] => [
    {
      type: 'selection',
      width: 55,
      reserveSelection: true,
      selectable: (row: Product) => !props.selectedProductIds.includes(row.id)
    },
    {
      prop: 'image',
      label: '图片',
      width: 100,
      align: 'center',
      useSlot: true
    },
    {
      prop: 'sku',
      label: 'SKU',
      minWidth: 150
    },
    {
      prop: 'name',
      label: '中文品名/英文品名',
      minWidth: 200,
      useSlot: true
    },
    {
      prop: 'materialCode',
      label: '物料编码',
      minWidth: 150
    }
  ]
  console.log(props.productSpuId, 'props.productSpuIdprops.productSpuId')
  // 使用 useTable
  const {
    data,
    loading,
    pagination,
    searchParams,
    columns,
    handleSizeChange,
    handleCurrentChange,
    fetchData,
    resetSearchParams
  } = useTable({
    core: {
      apiFn: (params: any) => {
        console.log(params, 'paramsparams')
        // 请求前参数处理：将 searchType 和 searchValue 合并为 searchDto
        const requestParams = { ...params }
        if (requestParams.searchValue) {
          requestParams.searchDto = {
            searchType: requestParams.searchType || '',
            searchValue: requestParams.searchValue
          }
        }
        // 删除原始的
        delete requestParams.searchType
        delete requestParams.searchValue
        return getSkus(requestParams)
      },
      tableKey: 'addSpu',
      apiParams: {
        searchType: 'sku',
        isNotRelatedSku: 1,
        currentPage: 1,
        pageSize: 20,
        productSpuId: props.productSpuId === '[object Object]' ? null : props.productSpuId
      },
      immediate: false, // 不立即加载，等弹窗打开时再加载
      columnsFactory
    },
    hooks: {
      resetFormCallback: () => {
        // 重置搜索参数已在 resetSearchParams 中处理
      }
    },
    // 数据处理
    transform: {
      // 自定义响应适配器，处理后端特殊的返回格式
      responseAdapter: (data: any) => {
        const dataC: any = []
        data.data.records.forEach((item: any) => {
          dataC.push(item.productSkuBasicVo)
        })
        return {
          records: dataC,
          total: data.data.total
        }
      }
    }
    //
  })
  // 处理搜索事件
  const handleSearch = () => {
    // 构建搜索参数
    const params: any = searchForm
    Object.assign(searchParams, params)
    fetchData()
  }
  // 获取行的类名（用于置灰已选择的产品）
  const getRowClassName = ({ row }: { row: Product }) => {
    if (props.selectedProductIds.includes(row.id)) {
      return 'is-disabled'
    }
    return ''
  }

  // 处理选择变化
  const handleSelectionChange = (selection: Product[]) => {
    selectedProducts.value = selection
  }

  // 处理确认
  const handleConfirm = () => {
    if (selectedProducts.value.length === 0) {
      ElMessage.warning('请至少选择一个产品')
      return
    }
    console.log(selectedProducts, 111111111)
    emit('confirm', selectedProducts.value)
    handleClose()
  }

  // 处理关闭
  const handleClose = () => {
    dialogVisible.value = false
    selectedProducts.value = []
  }

  // 监听弹窗打开/关闭，重置数据
  watch(dialogVisible, (val) => {
    if (val) {
      selectedProducts.value = []
      // 重置搜索参数
      resetSearchParams()
      // 清空表格选择
      nextTick(() => {
        tableRef.value?.clearSelection()
      })
    } else {
      // 弹窗关闭时重置查询条件
      searchForm.searchType = 'sku'
      searchForm.searchValue = ''
    }
  })
</script>

<style lang="scss" scoped>
  .add-product-dialog {
    .image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 50px;
      height: 50px;
      color: #c0c4cc;
      background-color: #f5f7fa;
      border-radius: 4px;
    }
  }

  .dialog-footer {
    display: flex;
    align-items: center;
    justify-content: space-between;

    .selected-info {
      padding: 6px 8px;
      margin-left: 18px;
      border: 1px solid #dcdfe6;
      border-radius: 4px;

      .selected-text {
        display: flex;
        gap: 4px;
        align-items: center;
        font-size: 14px;
        color: var(--el-text-color-regular);
        cursor: pointer;

        &:hover {
          color: var(--el-color-primary);
        }
      }

      .selected-list {
        max-height: 200px;
        padding: 8px 0;
        overflow-y: auto;

        .selected-item {
          padding: 8px 16px;
          font-size: 14px;
          color: var(--el-text-color-regular);

          &:hover {
            background-color: var(--el-fill-color-light);
          }
        }
      }
    }

    .footer-buttons {
      display: flex;
      gap: 12px;
    }
  }

  // 已选择的行置灰样式
  :deep(.el-table__body-wrapper) {
    .el-table__row {
      &.is-disabled {
        color: rgb(0 0 0 / 50%);
        cursor: not-allowed;
        background-color: #f5f7fa !important;

        td {
          color: rgb(0 0 0 / 50%);
        }

        .el-checkbox {
          .el-checkbox__input {
            cursor: not-allowed;

            .el-checkbox__inner {
              cursor: not-allowed;
              background-color: #f5f7fa;
              border-color: #dcdfe6;
            }
          }
        }
      }
    }
  }
</style>
