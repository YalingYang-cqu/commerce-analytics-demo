<template>
  <div class="associated-products-detail">
    <!-- 变体属性 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">变体属性</span>
      </div>
      <ElTable :data="displayData.variantAttributes" border size="small" class="detail-table">
        <ElTableColumn prop="index" label="序号" width="80" align="center">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="attribute" label="属性" min-width="150">
          <template #default="{ row }">
            {{ getAttributeName(row.attribute) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="attributeValues" label="属性值" min-width="200">
          <template #default="{ row }">
            {{ formatAttributeValues(row.attribute, row.attributeValues) }}
          </template>
        </ElTableColumn>
      </ElTable>
    </div>

    <!-- 包含产品 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">包含产品</span>
      </div>
      <ElTable :data="displayData.existingProducts" border size="small" class="detail-table">
        <ElTableColumn prop="index" label="序号" width="80" align="center">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="sku" label="SKU" min-width="150">
          <template #default="{ row }">
            {{ row.sku || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="productChineseName" label="中文品名" min-width="150">
          <template #default="{ row }">
            {{ row.productChineseName || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="productEnglishName" label="英文品名" min-width="150">
          <template #default="{ row }">
            {{ row.productEnglishName || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="materialCode" label="物料编码" min-width="150">
          <template #default="{ row }">
            {{ row.materialCode || '-' }}
          </template>
        </ElTableColumn>
        <!-- 动态属性列 -->
        <ElTableColumn
          v-for="attr in validVariantAttributes"
          :key="attr.attribute"
          :prop="`attribute_${attr.attribute}`"
          label="属性"
          min-width="150"
        >
          <template #default="{ row }">
            {{ getAttributeLabel(attr.attribute, row[`attribute_${attr.attribute}`]) || '-' }}
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, inject, ref } from 'vue'
  import { ElTable, ElTableColumn } from 'element-plus'

  interface Props {
    modelValue?: any
  }

  const props = defineProps<Props>()

  // 通过 inject 获取属性数据
  const basicData: any = inject('basicData')
  const propertyAll = ref(basicData.propertyAll)

  // 计算显示数据
  const displayData = computed(() => {
    const data = props.modelValue || {}
    return {
      variantAttributes: data.variantAttributes || [],
      existingProducts: data.existingProducts || []
    }
  })

  // 获取有效的变体属性（已选择属性且至少有一个属性值）
  const validVariantAttributes = computed(() => {
    return displayData.value.variantAttributes.filter(
      (attr: any) => attr.attribute && attr.attributeValues && attr.attributeValues.length > 0
    )
  })

  // 根据属性id获取属性名称
  const getAttributeName = (attributeId: string | number | null | undefined): string => {
    if (!attributeId) return '-'
    const property = propertyAll.value.find((item: any) => item.id === attributeId)
    return property?.attributeName || '-'
  }

  // 根据属性id和属性值code获取label
  const getAttributeLabel = (attributeId: string | number, value: string): string => {
    if (!attributeId || !value) return value
    const property = propertyAll.value.find((item: any) => item.id === attributeId)
    if (!property || !property.itemList) return value
    const item = property.itemList.find((item: any) => item.attributeCode === value)
    return item?.attributeValue || value
  }

  // 格式化属性值显示（用分号分隔）
  const formatAttributeValues = (attribute: string | number, values: string[]): string => {
    if (!values || values.length === 0) return '-'
    return values.map((val) => getAttributeLabel(attribute, val)).join('; ')
  }
</script>

<style lang="scss" scoped>
  .associated-products-detail {
    margin-top: 8px;

    .section {
      margin-bottom: 30px;

      .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;

        .section-title-bar {
          width: 4px;
          height: 16px;
          margin-right: 8px;
          background-color: #5d87ff;
        }

        .section-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }
      }

      .detail-table {
        :deep(.el-table__header) {
          th {
            font-weight: 500;
            color: var(--el-text-color-primary);
            background-color: #f5f7fa;
          }
        }

        :deep(.el-table__body) {
          td {
            color: var(--el-text-color-primary);
          }
        }
      }
    }
  }
</style>
