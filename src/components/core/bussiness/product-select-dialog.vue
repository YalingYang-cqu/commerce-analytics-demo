<template>
  <ElDialog
    v-model="dialogVisible"
    title="添加产品"
    width="1200"
    :close-on-click-modal="false"
    @close="handleClose"
  >
    <div class="product-select-dialog">
      <ArtSearchBar
        v-model="searchForm"
        :items="searchItems"
        :showSearch="false"
        @reset="onResetClick"
        @search="handleSearch"
      />

      <ArtTable
        ref="tableRef"
        :loading="loading"
        :data="data as any"
        :columns="columns"
        :column-checks="columnChecks"
        :pagination="pagination"
        row-key="sku"
        :row-class-name="getRowClassName"
        class="product-select-table"
        style="height: 70vh"
        :show-pagination="true"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
      >
        <template #pic="{ row }">
          <ElImage
            v-if="row.productSkuBasicVo?.picUrl"
            :src="getUrl(row.productSkuBasicVo.picUrl)"
            :preview-src-list="[getUrl(row.productSkuBasicVo.picUrl)]"
            :preview-teleported="true"
            fit="cover"
            style="width: 50px; height: 50px; border-radius: 4px"
          />
          <div v-else class="image-placeholder">
            <ElIcon :size="40">
              <Picture />
            </ElIcon>
          </div>
        </template>
        <template #skuName="{ row }">
          <div>{{ row.productSkuBasicVo?.sku || '-' }}</div>
          <div class="sub-text">{{ row.productSkuBasicVo?.productChineseName || '-' }}</div>
        </template>
        <template #spuName="{ row }">
          <div>{{ row.productSkuBasicVo?.spu || '-' }}</div>
          <div class="sub-text">{{ row.productSkuBasicVo?.spuName || '-' }}</div>
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
                  <div
                    v-for="product in selectedProducts"
                    :key="product.skuId"
                    class="selected-item"
                  >
                    {{ product.productSkuBasicVo?.sku || product.sku }} /
                    {{
                      product.productSkuBasicVo?.productChineseName || product.chineseProductName
                    }}
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
  import { ArrowDown, Picture } from '@element-plus/icons-vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import { useTable } from '@/composables/useTable'
  import { categoryPageList } from '@/api/basic/category'
  import { brandPageList } from '@/api/basic/brand'
  import { querySelectSkus } from '@/api/purchase/order'
  import { getUuid } from '@/utils'
  import { getUrl } from '@/utils/common-util'

  interface ProductSelectItem {
    skuId: number
    sku: string
    chineseProductName: string
    imageUrl?: string
    spu?: string
    chineseStyleName?: string
    materialCode?: string
    categoryPath?: string
    brandName?: string
    dataStatus: number
    dataStatusName: string
    productSkuBasicVo?: any
  }

  interface Props {
    modelValue: boolean
    existingProductIds?: string[]
    api?: any
    params: any
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm', products: ProductSelectItem[]): void
  }

  const props = withDefaults(defineProps<Props>(), {
    existingProductIds: () => [],
    params: () => ({})
  })

  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.modelValue,
    set: (value) => emit('update:modelValue', value)
  })

  const searchForm = reactive({
    searchType: 'sku',
    searchValue: '',
    category: [] as number[],
    brandIdList: [] as number[]
  })

  const categoryOptions = ref<any[]>([])
  const brandOptions = ref<Array<{ label: string; value: number }>>([])

  const searchItems = computed(() => [
    {
      key: 'searchValue',
      label: '',
      type: 'input',
      compositeSearch: true,
      selectOptions: [
        { label: 'SKU', value: 'sku' },
        { label: '中文品名', value: 'productChineseName' },
        { label: 'SPU', value: 'spu' },
        { label: '中文款名', value: 'spuName' },
        { label: '物料编码', value: 'materialCode' }
      ],
      selectKey: 'searchType',
      selectWidth: '120px',
      inputType: 'input' as const,
      placeholder: '搜索内容',
      width: '280px'
    },
    {
      key: 'category',
      label: '',
      type: 'cascader',
      placeholder: '分类',
      width: '200px',
      props: {
        placeholder: '分类',
        clearable: true,
        filterable: true,
        props: {
          multiple: true,
          children: 'children',
          label: 'categoryName',
          value: 'id',
          emitPath: false
        },
        options: categoryOptions.value
      }
    },
    {
      key: 'brandIdList',
      label: '',
      type: 'select',
      placeholder: '品牌',
      width: '150px',
      selectMultiple: true,
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      props: {
        options: brandOptions.value,
        clearable: true,
        placeholder: '品牌'
      }
    }
  ])

  const existingIdsSet = computed(() => new Set(props.existingProductIds || []))

  function transformRecord(v: any) {
    const purchase = v.productPurchaseBasicVo || {}
    let purchaserId: number | undefined
    if (purchase.purchaseOwnerUsers) {
      try {
        const users =
          typeof purchase.purchaseOwnerUsers === 'string'
            ? JSON.parse(purchase.purchaseOwnerUsers)
            : purchase.purchaseOwnerUsers
        if (Array.isArray(users) && users.length > 0) purchaserId = users[0]
      } catch {
        // ignore
      }
    }
    if (!purchaserId && v.productSkuBasicVo?.productOwnerUsers) {
      try {
        const users =
          typeof v.productSkuBasicVo.productOwnerUsers === 'string'
            ? JSON.parse(v.productSkuBasicVo.productOwnerUsers)
            : v.productSkuBasicVo?.productOwnerUsers
        if (Array.isArray(users) && users.length > 0) purchaserId = users[0]
      } catch {
        // ignore
      }
    }
    const purchaserName =
      purchase?.purchaseOwnerUserNames || v?.productSkuBasicVo?.productOwnerUserNames || ''
    return {
      ...v,
      tempId: getUuid(),
      skuId: v?.productSkuBasicVo?.id,
      productBasicId: v?.productSkuBasicVo?.id,
      spuId: v?.productSkuBasicVo?.spuId,
      sku: v?.productSkuBasicVo?.sku || '',
      chineseProductName: v?.productSkuBasicVo?.productChineseName || '',
      imageUrl: v?.productSkuBasicVo?.picUrl,
      picUrl: v?.productSkuBasicVo?.picUrl || '',
      spu: v?.productSkuBasicVo?.spu || '',
      chineseStyleName: v?.productSkuBasicVo?.spuName,
      materialCode: v?.productSkuBasicVo?.materialCode || '',
      categoryPath: v?.productSkuBasicVo?.categoryName || '',
      categoryId: v?.productSkuBasicVo?.categoryId,
      brandName: v?.productSkuBasicVo?.brandName || '',
      brandId: v?.productSkuBasicVo?.brandId,
      quantityPerBox: v?.productSkuBasicVo?.boxNum || 0,
      purchaserId,
      purchaserName,
      unit: v?.productSkuBasicVo?.unit || '',
      purchaseOrganizationId: v?.productFinanceInfoVo?.purchaseOrganizationId ?? null,
      purchaseOrganizationName: v?.productFinanceInfoVo?.purchaseOrganizationName || '',
      purchaseOrganizationAddress: v?.productFinanceInfoVo?.purchaseOrganizationAddress || '',
      currency: v?.productPurchaseBasicVo?.currency || '',
      productSupplierQuotationVo: v?.productPurchaseBasicVo?.productSupplierQuotationVo || []
    }
  }

  const columnsFactory = () => [
    {
      type: 'selection',
      width: 55,
      selectable: (row: any) => !existingIdsSet.value.has(row.productSkuBasicVo?.sku || row.sku)
    },
    {
      prop: 'pic',
      label: '图片',
      width: 80,
      align: 'center',
      useSlot: true
    },
    {
      prop: 'skuName',
      label: 'SKU/中文品名',
      minWidth: 180,
      useSlot: true
    },
    {
      prop: 'spuName',
      label: 'SPU/中文款名',
      minWidth: 180,
      useSlot: true
    },
    { prop: 'materialCode', label: '物料编码', width: 120 },
    { prop: 'categoryPath', label: '分类', minWidth: 150, showOverflowTooltip: true },
    { prop: 'brandName', label: '品牌', width: 100 }
  ]

  const {
    data,
    loading,
    columns,
    columnChecks,
    pagination,
    getData,
    resetSearchParams,
    searchParams,
    handleSizeChange,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: async (params: any) => {
        const apiParams: any = {
          currentPage: params.currentPage,
          pageSize: params.pageSize,
          categoryIdList: params.category || [],
          brandIdList: params.brandIdList || [],
          isProcurementOrder: 1,
          ...props.params
        }
        if (params.searchValue) {
          apiParams.searchDto = {
            searchType: params.searchType || '',
            searchValue: params.searchValue
          }
        }
        const result: any = props.api
          ? await props.api(apiParams)
          : await querySelectSkus(apiParams)
        return result
      },
      apiParams: {
        ...searchForm,
        currentPage: 1,
        pageSize: 20
      },
      immediate: false,
      columnsFactory,
      tableKey: 'product-select-dialog'
    },
    transform: {
      responseAdapter: (res: any) => ({
        records: res?.data?.records ?? [],
        total: res?.data?.total ?? 0
      }),
      dataTransformer: (list: any[]) => list.map(transformRecord)
    },
    performance: {
      enableCache: false
    },
    hooks: {
      resetFormCallback: () => {
        searchForm.searchType = 'sku'
        searchForm.searchValue = ''
        searchForm.category = []
        searchForm.brandIdList = []
      }
    }
  })

  const tableRef = ref<InstanceType<typeof ArtTable>>()
  const selectedProducts = ref<any[]>([])

  /** 关闭弹窗时：只改 searchForm 不会生效，列表请求用的是 useTable 的 searchParams */
  function resetDialogSearchState() {
    searchForm.searchType = 'sku'
    searchForm.searchValue = ''
    searchForm.category = []
    searchForm.brandIdList = []
    if ('searchDto' in searchForm) delete (searchForm as Record<string, unknown>).searchDto

    const sp = searchParams as Record<string, unknown>
    sp.searchType = 'sku'
    sp.searchValue = ''
    sp.category = []
    sp.brandIdList = []
    delete sp.searchDto
    sp.currentPage = 1
    void handleCurrentChange(1)
  }

  const getRowClassName = ({ row }: { row: any }) =>
    existingIdsSet.value.has(row.productSkuBasicVo?.sku || row.sku) ? 'is-disabled' : ''

  function handleSelectionChange(selection: any[]) {
    selectedProducts.value = selection
  }

  function handleSearch() {
    Object.assign(searchParams, searchForm)
    ;(searchParams as any).currentPage = 1
    getData()
  }

  async function onResetClick() {
    await resetSearchParams()
  }

  async function loadOptions() {
    try {
      const categoryRes: any = await categoryPageList({ status: '1' })
      if (categoryRes?.data) categoryOptions.value = categoryRes.data || []

      const brandRes: any = await brandPageList({ currentPage: 1, pageSize: -1, brandStatus: 1 })
      if (brandRes?.data?.records) {
        brandOptions.value = brandRes.data.records.map((brand: any) => ({
          label: brand.brandName,
          value: brand.id
        }))
      }
    } catch (e) {
      console.error('加载选项数据失败:', e)
    }
  }

  function handleConfirm() {
    if (selectedProducts.value.length === 0) {
      ElMessage.warning('请选择商品')
      return
    }
    emit('confirm', selectedProducts.value)
    handleClose()
  }

  function handleClose() {
    dialogVisible.value = false
  }

  watch(dialogVisible, async (val) => {
    if (val) {
      await loadOptions()
      await getData()
      nextTick(() => {
        tableRef.value?.clearSelection?.()
        selectedProducts.value = []
      })
    } else {
      resetDialogSearchState()
    }
  })
</script>

<style lang="scss" scoped>
  .product-select-dialog {
    .sub-text {
      font-size: 12px;
      color: #909399;
    }

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

  :deep(.el-table__body-wrapper) {
    .el-table__row.is-disabled {
      color: rgb(0 0 0 / 50%);
      cursor: not-allowed;
      background-color: #f5f7fa !important;

      td {
        color: rgb(0 0 0 / 50%);
      }

      .el-checkbox .el-checkbox__input {
        cursor: not-allowed;

        .el-checkbox__inner {
          cursor: not-allowed;
          background-color: #f5f7fa;
          border-color: #dcdfe6;
        }
      }
    }
  }
</style>
