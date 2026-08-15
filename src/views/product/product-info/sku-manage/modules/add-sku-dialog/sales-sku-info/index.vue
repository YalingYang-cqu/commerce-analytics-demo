<template>
  <div class="sales-sku-info-edit">
    <div class="section" style="margin-bottom: 2rem !important">
      <div class="section-header" style="position: relative; top: 2rem !important">
        <span class="section-title-bar"></span>
        <span class="section-title">关联销售SKU</span>
        <ElButton
          size="small"
          style="margin-left: auto"
          @click="showAddProductDialog = true"
          v-if="showSalesSkuEditMode"
        >
          添加商品
        </ElButton>
        <slot></slot>
      </div>
      <div class="sales-sku-table-wrapper" style="position: relative; top: 2rem !important">
        <ElTable :data="localData.salesSkuList" border stripe style="width: 100%">
          <ElTableColumn type="index" label="序号" width="60" align="center" />
          <ElTableColumn label="销售SKU" min-width="150" prop="salesSku">
            <!-- 销售SKU -->
            <template #default="{ row }">
              <div>
                <div>{{ row.productType === 1 ? row.sellerSku : row.msku }}</div>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="ASIN" min-width="120" prop="asin"> </ElTableColumn>
          <ElTableColumn label="平台" min-width="100" prop="platform">
            <!-- 销售SKU -->
            <template #default="{ row }">
              <div>
                <div>{{ row.productType === 1 ? 'Amazon SC' : 'Amazon VC' }}</div>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="店铺" min-width="120" prop="storeName"> </ElTableColumn>
          <ElTableColumn label="区域" min-width="100" prop="area"> </ElTableColumn>
          <ElTableColumn label="国家" min-width="100" prop="region"> </ElTableColumn>
          <ElTableColumn label="境外收货人" min-width="150" prop="salesEntity"> </ElTableColumn>
          <ElTableColumn label="销售负责人" min-width="150" prop="salesManagerNamesStr">
          </ElTableColumn>
          <ElTableColumn
            label="操作"
            width="80"
            align="center"
            fixed="right"
            v-if="showSalesSkuEditMode"
          >
            <template #default="{ $index }">
              <ElButton type="primary" link size="small" @click="handleRemove($index)">
                移除
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </div>

    <!-- 添加商品对话框 -->
    <AddProductDialog
      v-model="showAddProductDialog"
      :productId="props.productId || ''"
      :selectedProductIds="selectedProductIds"
      @confirm="handleProductsSelected"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, computed } from 'vue'
  import { ElTable, ElTableColumn, ElButton } from 'element-plus'
  import AddProductDialog from './add-product-dialog.vue'

  interface Props {
    modelValue: any
    approvalStatus?: any
    productId?: string | number
    showSalesSkuEditMode?: boolean
  }

  interface SalesSkuItem {
    id?: number
    salesSku: string
    msku?: string
    asin: string
    platform: string
    accountName: string
    accountId?: number
    listingId?: number
    marketplace: string
    country: string
    sellingEntity: string | string[]
    listingRelationUserList: number[]
  }

  interface SalesSkuInfo {
    salesSkuList: SalesSkuItem[]
  }

  const props = withDefaults(defineProps<Props>(), {})
  const emit = defineEmits(['update:modelValue'])

  const showAddProductDialog = ref(false)

  // 初始化本地数据
  const localData = reactive<SalesSkuInfo>({
    salesSkuList: []
  })

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

  // 计算已选中的产品ID列表（用于置灰）
  // 使用复合键而不是 id
  const selectedProductIds = computed(() => {
    return localData.salesSkuList
      .map((item) => generateSelectedProductId(item))
      .filter((id): id is string => id !== null && id !== undefined) // 过滤掉空值，并确保类型为string
  })

  // 标记是否正在从props同步数据
  const isUpdatingFromProps = ref(false)

  // 监听 props.modelValue 变化，同步到 localData
  watch(
    () => props.modelValue,
    (newVal) => {
      isUpdatingFromProps.value = true
      if (newVal && newVal.salesSkuList && Array.isArray(newVal.salesSkuList)) {
        // 确保每个项都有正确的数据结构
        localData.salesSkuList = newVal.salesSkuList.map((item: any) => ({
          ...item,
          listingRelationUserList: Array.isArray(item.listingRelationUserList)
            ? item.listingRelationUserList.filter((id: any) => id !== null && id !== undefined)
            : [],
          sellingEntity: item.sellingEntity || ''
        }))
      } else {
        // 如果 newVal 为空或没有 salesSkuList，清空列表
        localData.salesSkuList = []
      }
      // 使用 nextTick 确保在下一个事件循环后重置标记
      setTimeout(() => {
        isUpdatingFromProps.value = false
      }, 0)
    },
    { immediate: true, deep: true }
  )

  // 监听 localData 变化，同步到父组件（但避免循环更新）
  watch(
    localData,
    (newVal) => {
      // 只在非props更新时才触发emit
      if (!isUpdatingFromProps.value) {
        emit('update:modelValue', { ...newVal })
      }
    },
    { deep: true }
  )

  // 处理选中的商品
  const handleProductsSelected = (products: any[]) => {
    // 将选中的商品添加到列表中
    products.forEach((product) => {
      // 获取产品的销售SKU（可能是salesSku、shopSku或sku）
      const productSalesSku = product.salesSku || product.shopSku || product.sku || ''
      // 检查是否已存在相同的销售SKU或相同的id
      const exists = localData.salesSkuList.some((item) => {
        // 通过id匹配
        if (item.id && product.id && String(item.id) === String(product.id)) {
          return true
        }
        // 通过salesSku匹配
        if (item.salesSku && productSalesSku && item.salesSku === productSalesSku) {
          return true
        }
        return false
      })
      if (!exists) {
        // 确保新添加的商品有正确的结构
        localData.salesSkuList.push({
          ...product,
          salesSku: productSalesSku,
          listingRelationUserList: Array.isArray(product.listingRelationUserList)
            ? product.listingRelationUserList
            : [],
          sellingEntity: product.sellingEntity || ''
        })
      }
    })
  }

  // 移除销售SKU
  const handleRemove = (index: number) => {
    localData.salesSkuList.splice(index, 1)
    // ElMessage.success('移除成功')
  }

  // 表单验证
  const validate = async () => {
    // 可以添加自定义验证逻辑
    return true
  }

  // 暴露验证方法
  defineExpose({
    validate,
    localData
  })
</script>

<style lang="scss" scoped>
  .sales-sku-info-edit {
    position: relative;
    padding: 20px;

    .section {
      .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;

        .section-title-bar {
          width: 4px;
          height: 16px;
          margin-right: 8px;
          background-color: var(--el-color-primary);
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }

      .sales-sku-table-wrapper {
        margin-top: 16px;
      }
    }
  }
</style>
