<template>
  <ElDialog
    v-model="dialogVisible"
    title="添加产品"
    width="1000"
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
        row-key="id"
        :row-class-name="getRowClassName"
        class="sale-sku-table"
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
  import { getSelectableProducts } from '@/api/plan/shipping'
  import { pubStoreList } from '@/utils'
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
    /** 已选产品 id 列表，这些行将置灰且不可选 */
    existingProductIds?: (string | number)[]
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
    storeIdList: [] as (string | number)[]
  })

  const storeList = ref<Array<{ label: string; value: string | number }>>([])

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
      key: 'storeIdList',
      label: '',
      type: 'select',
      placeholder: '店铺',
      width: '180px',
      selectMultiple: true,
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      props: {
        options: storeList.value,
        clearable: true,
        placeholder: '店铺'
      }
    }
  ])

  const existingIdsSet = computed(
    () => new Set((props.existingProductIds || []).map((id) => String(id)))
  )
  const getRowId = (row: any) => String(row.id ?? row.skuId ?? row.productSkuBasicVo?.id ?? '')

  /** 将 getSelectableProducts 返回的 ProductSelectVo 转为表格展示结构（兼容 productSkuBasicVo 的模板） */
  function transformRecord(v: any) {
    const sku = v.localSku ?? v.sku ?? ''
    const productChineseName = v.localSkuChineseName ?? v.productChineseName ?? ''
    const salesSku = v.productType === 1 ? v.sellerSku : v.msku
    return {
      ...v,
      skuId: v.skuId ?? v.localSkuId ?? v.id,
      sku,
      chineseProductName: productChineseName,
      imageUrl: v.imageUrl,
      picUrl: v.imageUrl || '',
      spu: v.spu ?? v.spuCode ?? '',
      chineseStyleName: v.spuName ?? '',
      storeName: v.storeName ?? '',
      salesSku: salesSku ?? v.sellerSku ?? v.msku ?? '',
      availableQty: v.availableQty,
      productSkuBasicVo: {
        id: v.skuId ?? v.localSkuId ?? v.id,
        sku,
        productChineseName,
        picUrl: v.imageUrl || '',
        spu: v.spu ?? v.spuCode ?? '',
        spuName: v.spuName ?? ''
      }
    }
  }

  const columnsFactory = () => [
    {
      type: 'selection',
      width: 55,
      selectable: (row: any) => !existingIdsSet.value.has(getRowId(row))
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
    { prop: 'storeName', label: '店铺', minWidth: 140 },
    { prop: 'salesSku', label: '销售SKU', minWidth: 140 },
    { prop: 'availableQty', label: '可用量', minWidth: 100 }
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
          keyword: params.searchValue ? String(params.searchValue).trim() : undefined,
          storeIdList: params.storeIdList,
          ...props.params
        }
        const result: any = props.api
          ? await props.api(apiParams)
          : await getSelectableProducts(apiParams)
        return result
      },
      apiParams: {
        ...searchForm,
        currentPage: 1,
        pageSize: 20
      },
      immediate: false,
      columnsFactory,
      tableKey: 'sale-sku-select-dialog'
    },
    transform: {
      responseAdapter: (res: any) => ({
        records: res?.records ?? [],
        total: res?.total ?? 0
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
        searchForm.storeIdList = []
      }
    }
  })

  const tableRef = ref<InstanceType<typeof ArtTable>>()
  const selectedProducts = ref<any[]>([])

  const getRowClassName = ({ row }: { row: any }) =>
    existingIdsSet.value.has(getRowId(row)) ? 'is-disabled' : ''

  function handleSelectionChange(selection: any[]) {
    selectedProducts.value = selection.filter((row) => !existingIdsSet.value.has(getRowId(row)))
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
      const storeRes: any = await pubStoreList({ status: null }).catch(() => [])
      const list = storeRes?.data ?? storeRes ?? []
      storeList.value = Array.isArray(list)
        ? list.map((s: any) => ({
            label: s.storeName ?? s.label ?? s.name ?? '',
            value: s.id ?? s.value
          }))
        : []
    } catch (e) {
      console.error('加载店铺列表失败:', e)
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
      searchForm.searchType = 'sku'
      searchForm.searchValue = ''
      searchForm.storeIdList = []
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
