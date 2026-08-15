<template>
  <div class="basic-info-detail">
    <!-- 基本信息 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">基本信息</span>
      </div>
      <div class="info-grid">
        <div class="info-item">
          <span class="info-label">分类:</span>
          <span class="info-value">{{ displayData.categoryName || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">品牌:</span>
          <span class="info-value">{{ displayData.brand || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">单位:</span>
          <span class="info-value">{{
            displayData.unit ? pubFilter(dictData['spuUnit'], displayData.unit) : '-'
          }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">状态:</span>
          <span class="info-value">{{ displayData.status || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">开发人:</span>
          <span class="info-value">{{ displayData.developer || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">产品负责人:</span>
          <span class="info-value">{{ displayData.productOwner || '-' }}</span>
        </div>
        <div class="info-item">
          <span class="info-label">分配店铺:</span>
          <span class="info-value">{{ displayData.accountNames || '-' }}</span>
        </div>
        <div class="info-item remark-item">
          <span class="info-label">产品备注:</span>
          <span class="info-value remark-value">{{ displayData.productRemark }}</span>
        </div>
        <div class="info-item attachment-item">
          <span class="info-label">附件:</span>
          <span class="info-value">
            <FileUpload
              :model-value="displayData.attachments"
              :disabled="true"
              list-type="text"
              class="detail-file-upload"
            />
          </span>
        </div>
      </div>
    </div>

    <!-- 规格信息 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">规格信息</span>
        <div class="unit-switcher">
          <button
            class="unit-btn"
            :class="{ active: specUnit === 'metric' }"
            @click="specUnit = 'metric'"
          >
            公制
          </button>
          <button
            class="unit-btn"
            :class="{ active: specUnit === 'imperial' }"
            @click="specUnit = 'imperial'"
          >
            英制
          </button>
        </div>
      </div>
      <div class="spec-content">
        <!-- 公制 -->
        <div v-show="specUnit === 'metric'" class="spec-panel">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">单品净重:</span>
              <span class="info-value">
                {{
                  formatWeight(
                    displayData.specs?.metric?.productNetWeight,
                    'metric',
                    'productNetWeightUnit'
                  )
                }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">单品毛重:</span>
              <span class="info-value">
                {{
                  formatWeight(
                    displayData.specs?.metric?.productGrossWeight,
                    'metric',
                    'productGrossWeightUnit'
                  )
                }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">单品尺寸:</span>
              <span class="info-value">
                {{ formatDimension(displayData.specs?.metric, 'singleItem', 'metric') }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">包装尺寸:</span>
              <span class="info-value">
                {{ formatDimension(displayData.specs?.metric, 'package', 'metric') }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">单箱净重:</span>
              <span class="info-value">
                {{
                  formatWeight(
                    displayData.specs?.metric?.boxNetWeight,
                    'metric',
                    'boxNetWeightUnit'
                  )
                }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">单箱毛重:</span>
              <span class="info-value">
                {{
                  formatWeight(
                    displayData.specs?.metric?.boxGrossWeight,
                    'metric',
                    'boxGrossWeightUnit'
                  )
                }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">单箱数量:</span>
              <span class="info-value"> {{ displayData.specs?.metric?.boxNum || 0 }} pcs </span>
            </div>
            <div class="info-item">
              <span class="info-label">单箱尺寸:</span>
              <span class="info-value">
                {{ formatDimension(displayData.specs?.metric, 'singleBox', 'metric') }}
              </span>
            </div>
          </div>
        </div>
        <!-- 英制 -->
        <div v-show="specUnit === 'imperial'" class="spec-panel">
          <div class="info-grid">
            <div class="info-item">
              <span class="info-label">单品净重:</span>
              <span class="info-value">
                {{ formatWeight(displayData.specs?.imperial?.productNetWeightLb, 'imperial') }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">单品毛重:</span>
              <span class="info-value">
                {{ formatWeight(displayData.specs?.imperial?.productGrossWeightLb, 'imperial') }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">单品尺寸:</span>
              <span class="info-value">
                {{ formatDimension(displayData.specs?.imperial, 'singleItem', 'imperial') }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">包装尺寸:</span>
              <span class="info-value">
                {{ formatDimension(displayData.specs?.imperial, 'package', 'imperial') }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">单箱净重:</span>
              <span class="info-value">
                {{ formatWeight(displayData.specs?.imperial?.boxNetWeightLb, 'imperial') }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">单箱毛重:</span>
              <span class="info-value">
                {{ formatWeight(displayData.specs?.imperial?.boxGrossWeightLb, 'imperial') }}
              </span>
            </div>
            <div class="info-item">
              <span class="info-label">单箱数量:</span>
              <span class="info-value"> {{ displayData.specs?.imperial?.boxNum || 0 }} pcs </span>
            </div>
            <div class="info-item">
              <span class="info-label">单箱尺寸:</span>
              <span class="info-value">
                {{ formatDimension(displayData.specs?.imperial, 'singleBox', 'imperial') }}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, inject } from 'vue'
  import FileUpload from '@/components/core/upload-custom/index.vue'
  import { useDictStore } from '@/store/modules/dict'
  import { pubFilter } from '@/utils/common-util'

  interface Props {
    modelValue?: any
  }

  const props = defineProps<Props>()

  const specUnit = ref<'metric' | 'imperial'>('metric')

  // 通过 inject 获取数据源
  const basicData: any = inject('basicData')
  const categoryAll = ref(basicData.categoryAll)
  const brandAll = ref(basicData.brandAll)
  const userAll = ref(basicData.userAll)
  const storeAll = ref(basicData.storeAll)
  const { dictData } = useDictStore()

  // 在树形数据中查找指定 id 的节点
  const findNodeById = (nodes: any[], id: any): any => {
    if (!nodes || !Array.isArray(nodes)) return null
    for (const node of nodes) {
      if (node.id === id) {
        return node
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeById(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  // 获取分类名称
  const getCategoryName = (categoryId: any): string => {
    if (!categoryId) return '-'
    const node = findNodeById(categoryAll.value, categoryId)
    return node?.categoryName || '-'
  }

  // 获取品牌名称
  const getBrandName = (brandId: any): string => {
    if (!brandId) return '-'
    const brand = brandAll.value?.find((item: any) => item.value === brandId)
    return brand?.label || '-'
  }

  // 获取单位名称
  // const getUnitName = (unitValue: any): string => {
  //   if (!unitValue) return '-'
  //   const unit = dictData['spuUnit']?.find((item: any) => item.value === unitValue)
  //   return unit?.label || '-'
  // }

  // 获取状态名称
  const getStatusName = (statusValue: any): string => {
    if (!statusValue) return '-'
    // 处理数字类型的状态值
    const status = dictData['productStatus']?.find(
      (item: any) => item.value === statusValue || item.value === String(statusValue)
    )
    return status?.label || '-'
  }

  // 获取用户名称
  const getUserName = (userId: any): string => {
    if (!userId) return '-'
    const user = userAll.value?.find((item: any) => item.value === userId)
    return user?.label || '-'
  }

  // 获取店铺名称
  const getStoreName = (storeId: any): string => {
    if (!storeId) return '-'
    const store = storeAll.value?.find((item: any) => item.value === storeId)
    return store?.label || '-'
  }

  // 格式化数组值（用于多选字段）
  const formatArrayValue = (value: any, getLabelFn: (id: any) => string): string => {
    if (!value) return '-'
    if (Array.isArray(value)) {
      if (value.length === 0) return '-'
      return value.map((v) => getLabelFn(v)).join(', ')
    }
    return getLabelFn(value)
  }

  // 计算显示数据
  const displayData = computed(() => {
    const data = props.modelValue || {}
    // 分配店铺：优先使用 accountIdList 动态获取店铺名称，如果没有则使用 accountNames
    const accountNames =
      data.accountIdList && data.accountIdList.length > 0
        ? formatArrayValue(data.accountIdList, getStoreName)
        : data.accountNames || '-'
    const remarkRaw = data.productRemark
    const remarkStr = remarkRaw != null && remarkRaw !== undefined ? String(remarkRaw).trim() : ''
    const productRemark = remarkStr === '' ? '-' : remarkStr

    return {
      accountNames: accountNames,
      productRemark,
      category: getCategoryName(data.category || data.categoryId),
      brand: getBrandName(data.brandId),
      unit: data.unit,
      status: getStatusName(data.productStatus || data.status),
      developer: formatArrayValue(data.productDeveloperUserList || data.developer, getUserName),
      productOwner: formatArrayValue(data.productOwnerUserList || data.productOwner, getUserName),
      assignedStore: formatArrayValue(data.accountIdList || data.assignedStore, (id) => {
        // 分配店铺暂时保留原值，如果后续有数据源可以替换
        return id || '-'
      }),
      attachments: data.attachList || [],
      specs: data.specs || {
        metric: {},
        imperial: {}
      },
      categoryName: data.categoryName,
      weightUnits: data.weightUnits || {
        productNetWeightUnit: 'g',
        productGrossWeightUnit: 'g',
        boxNetWeightUnit: 'g',
        boxGrossWeightUnit: 'g'
      }
    }
  })

  // 格式化重量
  const formatWeight = (
    value: number | null | undefined,
    system: 'metric' | 'imperial',
    field?: string
  ): string => {
    if (value === null || value === undefined || value === 0) {
      if (system === 'metric') {
        const unit =
          field &&
          displayData.value.weightUnits?.[field as keyof typeof displayData.value.weightUnits]
            ? displayData.value.weightUnits[field as keyof typeof displayData.value.weightUnits]
            : 'g'
        return `0.0000 ${unit}`
      }
      return '0.0000 lb'
    }
    const formatted = value.toFixed(4)
    if (system === 'metric') {
      const unit =
        field &&
        displayData.value.weightUnits?.[field as keyof typeof displayData.value.weightUnits]
          ? displayData.value.weightUnits[field as keyof typeof displayData.value.weightUnits]
          : 'g'
      return `${formatted} ${unit}`
    }
    return `${formatted} lb`
  }

  // 格式化尺寸
  const formatDimension = (
    specs: any,
    prefix: 'singleItem' | 'package' | 'singleBox',
    system: 'metric' | 'imperial'
  ): string => {
    if (!specs) return `0.00 x 0.00 x 0.00 ${system === 'metric' ? 'cm' : 'inch'}`

    // 字段名映射：
    // singleItem在metric使用productLength/Width/Height，在imperial使用productLengthInch/WidthInch/HeightInch
    // package在metric使用productPackageLength/Width/Height，在imperial使用productPackageLengthInch/WidthInch/HeightInch
    // singleBox在metric使用boxLength/Width/Height，在imperial使用boxLengthInch/WidthInch/HeightInch
    const getFieldName = (fieldType: 'Length' | 'Width' | 'Height') => {
      if (prefix === 'singleItem') {
        if (system === 'metric') {
          return fieldType === 'Length'
            ? 'productLength'
            : fieldType === 'Width'
              ? 'productWidth'
              : 'productHeight'
        } else {
          return fieldType === 'Length'
            ? 'productLengthInch'
            : fieldType === 'Width'
              ? 'productWidthInch'
              : 'productHeightInch'
        }
      }
      if (prefix === 'package') {
        if (system === 'metric') {
          return fieldType === 'Length'
            ? 'productPackageLength'
            : fieldType === 'Width'
              ? 'productPackageWidth'
              : 'productPackageHeight'
        } else {
          return fieldType === 'Length'
            ? 'productPackageLengthInch'
            : fieldType === 'Width'
              ? 'productPackageWidthInch'
              : 'productPackageHeightInch'
        }
      }
      if (prefix === 'singleBox') {
        if (system === 'metric') {
          return fieldType === 'Length'
            ? 'boxLength'
            : fieldType === 'Width'
              ? 'boxWidth'
              : 'boxHeight'
        } else {
          return fieldType === 'Length'
            ? 'boxLengthInch'
            : fieldType === 'Width'
              ? 'boxWidthInch'
              : 'boxHeightInch'
        }
      }
      return `${prefix}${fieldType}`
    }

    const length = specs[getFieldName('Length')] ?? 0
    const width = specs[getFieldName('Width')] ?? 0
    const height = specs[getFieldName('Height')] ?? 0

    const formatNum = (num: number | null | undefined) => {
      if (num === null || num === undefined) return '0.00'
      return num.toFixed(2)
    }

    return `${formatNum(length)} x ${formatNum(width)} x ${formatNum(height)} ${
      system === 'metric' ? 'cm' : 'inch'
    }`
  }
</script>

<style lang="scss" scoped>
  .basic-info-detail {
    margin-top: 8px;

    .section {
      margin-bottom: 30px;

      .section-header {
        display: flex;
        align-items: center;
        justify-content: flex-start;
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

        .unit-switcher {
          display: flex;
          gap: 0;
          align-items: center;
          margin-left: 14px;

          .unit-btn {
            padding: 6px 20px;
            font-size: 14px;
            line-height: 1.5;
            color: var(--el-text-color-regular);
            cursor: pointer;
            background: transparent;
            border: 1px solid transparent;
            border-color: #ccc;
            border-radius: 4px;
            outline: none;
            transition: all 0.3s;

            &:first-child {
              border-right: none;
              border-top-right-radius: 0;
              border-bottom-right-radius: 0;
            }

            &:last-child {
              border-top-left-radius: 0;
              border-bottom-left-radius: 0;
            }

            &:not(.active) {
              color: var(--el-text-color-regular);
              background-color: #f5f7fa;
            }

            &.active {
              position: relative;
              z-index: 1;
              color: #5d87ff;
              background-color: #fff;
              border-color: #5d87ff;
            }

            &:hover:not(.active) {
              color: #5d87ff;
            }
          }
        }
      }

      .info-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 20px;
        padding: 0;

        .info-item {
          display: flex;
          align-items: flex-start;
          min-height: 32px;

          .info-label {
            flex-shrink: 0;
            // min-width: 90px;
            margin-right: 8px;
            font-size: 14px;
            line-height: 24px;
            color: var(--el-text-color-regular);
          }

          .info-value {
            flex: 1;
            font-size: 14px;
            line-height: 24px;
            color: var(--el-text-color-primary);
          }

          &.remark-item {
            grid-column: 1 / -1;

            .remark-value {
              word-break: break-word;
              white-space: pre-wrap;
            }
          }

          &.attachment-item {
            grid-column: span 1;
            align-items: center;

            .attachment-section {
              display: flex;
              flex-wrap: wrap;
              gap: 8px;
              align-items: center;

              .attachment-link {
                display: inline-flex;
                align-items: center;
                font-size: 14px;
                color: var(--el-text-color-primary);
                cursor: pointer;

                .attachment-icon {
                  margin-right: 4px;
                  font-size: 14px;
                  color: var(--el-text-color-regular);
                }

                &:hover {
                  color: #5d87ff;

                  .attachment-icon {
                    color: #5d87ff;
                  }
                }
              }
            }
          }
        }
      }

      .spec-content {
        padding: 16px 0;

        .spec-panel {
          .info-grid {
            display: grid;
            grid-template-columns: repeat(4, 1fr);
            gap: 20px;
          }
        }
      }
    }
  }
</style>
