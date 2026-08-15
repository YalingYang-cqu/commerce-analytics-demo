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
        @reset="handleReset"
        @search="handleSearch"
      >
        <template #regions="{ item, modelValue }">
          <MkSelect
            v-model="modelValue[item.key]"
            :multiple="true"
            :clearable="true"
            :options="countryList"
            :label-value="item.labelValue || { name: 'label', value: 'value' }"
            :placeholder="item.props?.placeholder || '请选择'"
            :always-filter-input="item.alwaysFilterInput"
            width="100%"
            @change="handleRegionsChange"
          />
        </template>
      </ArtSearchBar>
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
            v-if="row.imageUrl"
            :src="row.imageUrl"
            :preview-src-list="[row.imageUrl]"
            fit="cover"
            :preview-teleported="true"
            style="width: 50px; height: 50px; border-radius: 4px"
          />
        </template>

        <!-- 销售SKU/ASIN -->
        <template #name="{ row }">
          <div>
            <div>{{ row.productType === 1 ? row.sellerSku : row.msku }}</div>
            <div>{{ row.asin || '' }}</div>
          </div>
        </template>
        <template #productType="{ row }">
          <div>
            <div>{{ row.productType === 1 ? 'Amazon SC' : 'Amazon VC' }}</div>
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
                    【{{ product.productType === 1 ? product.sellerSku : product.msku }} /
                    {{ product.asin }}】 /
                    {{ product.productType === 1 ? 'Amazon SC' : 'Amazon VC' }} /
                    {{ product.storeName }} / {{ product.area }} / {{ product.region }}
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
  import MkSelect from '@/components/core/others/mk-select/index.vue'
  import { useTable } from '@/composables/useTable'
  import type { ColumnOption } from '@/types'
  import { pubCountryList, pubStoreListN } from '@/utils'
  import { searchUnassociatedProducts } from '@/api/product/sku'

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
    productId: string | number
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm', products: Product[]): void
  }

  const props = withDefaults(defineProps<Props>(), {
    selectedProductIds: () => [],
    productId: String
  })
  // 搜索表单
  const searchForm = reactive({
    searchType: 'seller_sku', // 复合搜索的搜索类型
    searchContent: '', // 复合搜索的搜索值
    productType: 1,
    regions: [] as string[],
    sellerIds: [] as string[]
  })

  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (val) => emit('update:modelValue', val)
  })

  const tableRef = ref()
  const selectedProducts = ref<any[]>([])
  const countryList = ref<any[]>([])

  const storeList = ref<any[]>([])
  // 搜索项配置 - 使用计算属性以便响应式更新
  const searchItems = computed(() => [
    // 输入框类型的复合搜索
    {
      key: 'searchContent',
      label: '',
      compositeSearch: true,
      selectOptions: [
        { label: '销售SKU', value: 'seller_sku' },
        { label: 'ASIN', value: 'asin' }
      ],
      selectKey: 'searchType', // select 的值存储在 searchType
      selectWidth: '100px',
      inputType: 'input',
      placeholder: '搜索内容',
      width: '280px'
    },
    {
      label: '',
      key: 'regions',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      width: '140px',
      labelValue: { name: 'label', value: 'value' },
      props: {
        placeholder: '国家',
        options: countryList.value,
        clearable: true
      }
    },
    {
      label: '',
      key: 'sellerIds',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      width: '140px',
      labelValue: { name: 'label', value: 'value' },
      props: {
        placeholder: '店铺',
        options: storeList.value,
        clearable: true
      }
    },
    {
      label: '',
      key: 'productType',
      type: 'select',
      width: '140px',
      props: {
        placeholder: '平台',
        options: [
          { label: 'Amazon SC', value: 1 },
          { label: 'Amazon VC', value: 2 }
        ]
        // clearable: true
      }
    }
  ])

  // 生成选中产品的复合键
  // productType === 1: REGION_SELLERID_asin_sellerSku
  // productType === 2: REGION_ASIN_msku
  const generateSelectedProductId = (item: any): string | null => {
    const region = item.region || ''
    if (!region) return null

    if (item.productType === 1) {
      // productType === 1: REGION_SELLERID_asin_sellerSku
      const sellerId = item.sellerId || item.accountId || ''
      const asin = item.asin || ''
      const sellerSku = item.sellerSku || ''
      if (!sellerId || !asin || !sellerSku) return null
      return `${region}_${sellerId}_${asin}_${sellerSku}_${item.fnSku}`
    } else if (item.productType === 2) {
      // productType === 2: REGION_ASIN_msku
      const asin = item.asin || ''
      const msku = item.msku || ''
      if (!asin || !msku) return null
      return `${region}_${asin}_${msku}`
    }
    return null
  }

  // 列配置工厂函数
  const columnsFactory = (): ColumnOption<Product>[] => [
    {
      type: 'selection',
      width: 55,
      reserveSelection: true,
      selectable: (row: Product) => {
        // 使用复合键来判断是否已选中
        const selectedId = generateSelectedProductId(row)
        if (!selectedId) return false
        return !props.selectedProductIds.includes(selectedId)
      }
    },
    {
      prop: 'image',
      label: '图片',
      width: 100,
      align: 'center',
      useSlot: true
    },
    {
      prop: 'name',
      label: '销售SKU/ASIN',
      minWidth: 200,
      useSlot: true
    },
    {
      prop: 'productType',
      label: '平台',
      minWidth: 150,
      useSlot: true
    },
    {
      prop: 'storeName',
      label: '店铺',
      minWidth: 150
    },
    {
      prop: 'area',
      label: '区域',
      minWidth: 150
    },
    {
      prop: 'region',
      label: '国家',
      minWidth: 150
    }
  ]

  // 使用 useTable
  const {
    data,
    loading,
    pagination,
    searchParams,
    columns,
    handleSizeChange,
    handleCurrentChange,
    getData,
    resetSearchParams
  } = useTable({
    core: {
      apiFn: (params: any) => {
        console.log(params, 'paramsparams')
        // 请求前参数处理：将 searchType 和 searchContent 合并为 searchDto
        const requestParams = { ...params }

        if (requestParams.productType === 2 && requestParams.searchType === 'seller_sku') {
          requestParams.searchType = 'msku'
        }
        console.log(requestParams, 'requestParamsrequestParams')
        return searchUnassociatedProducts(requestParams)
      },
      tableKey: 'addSpu',
      apiParams: {
        searchType: 'seller_sku',
        currentPage: 1,
        pageSize: 20,
        productType: 1,
        productId: props.productId
      },
      immediate: false, // 不立即加载，等弹窗打开时再加载
      columnsFactory
    },
    hooks: {
      resetFormCallback: () => {
        // 重置搜索参数已在 resetSearchParams 中处理
      }
    }

    //
  })

  const fetchStoreList = async (regions?: string[]) => {
    const params: Record<string, any> = { status: null }
    if (regions && regions.length > 0) {
      params.countryCodes = regions
    } else {
      params.countryCodes = null
    }
    storeList.value = await pubStoreListN(params, 'sellerId')
  }

  const handleRegionsChange = async () => {
    const newRegions = (searchForm.regions || []) as string[]
    await fetchStoreList(newRegions)
    searchForm.sellerIds = []
    Object.assign(searchParams, searchForm)
    getData()
  }

  // 处理重置事件
  const handleReset = async () => {
    // 重置搜索表单中的 productType 为默认值 1
    searchForm.productType = 1
    // 调用 useTable 的重置方法
    await resetSearchParams()
  }

  // 处理搜索事件
  const handleSearch = () => {
    // 构建搜索参数
    const params: any = searchForm
    Object.assign(searchParams, params)
    getData()
  }
  // 获取行的类名（用于置灰已选择的产品）
  const getRowClassName = ({ row }: { row: Product }) => {
    // 使用复合键来判断是否已选中
    const selectedId = generateSelectedProductId(row)
    if (selectedId && props.selectedProductIds.includes(selectedId)) {
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
  watch(dialogVisible, async (val) => {
    if (val) {
      selectedProducts.value = []
      countryList.value = await pubCountryList()
      await fetchStoreList()
      getData()
      // 清空表格选择
      nextTick(() => {
        tableRef.value?.clearSelection()
      })
    } else {
      // 弹窗关闭时重置查询条件
      searchForm.searchType = 'seller_sku'
      searchForm.searchContent = ''
      searchForm.productType = 1
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
