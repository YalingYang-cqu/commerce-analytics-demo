<template>
  <div class="logistics-info-detail">
    <!-- 报关信息 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">报关信息</span>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">中文报关名:</div>
          <div class="detail-value">{{ modelValue?.customsName || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">英文报关名:</div>
          <div class="detail-value">{{ modelValue?.englishCustomsName || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">报关HSCODE:</div>
          <div class="detail-value">{{ modelValue?.customsHsCode || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">报关单价:</div>
          <div class="detail-value">
            {{ modelValue?.customsPrice || '-' }}
            {{ modelValue?.customsPrice ? modelValue.customsPriceCurrency : '' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">报关材质:</div>
          <div class="detail-value">{{ modelValue?.customsMaterial || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">报关用途:</div>
          <div class="detail-value">{{ modelValue?.customsUsage || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">货物属性:</div>
          <div class="detail-value">
            {{ modelValue?.cargoAttributes?.join('、') || '-' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">报关单位:</div>
          <div class="detail-value">
            {{ pubFilter(dictData['spuUnit'], modelValue?.customsUnit) || '-' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">报关型号:</div>
          <div class="detail-value">{{ modelValue?.customsModel || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">品牌类型:</div>
          <div class="detail-value">{{ modelValue?.brandType || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">原产地:</div>
          <div class="detail-value">{{ modelValue?.originCountry || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">境内货源地:</div>
          <div class="detail-value">{{ modelValue?.domesticCity || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">出口享惠情况:</div>
          <div class="detail-value">{{ modelValue?.outletBenefits || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">征免:</div>
          <div class="detail-value">{{ modelValue?.exemptionTax || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">其他申报要素:</div>
          <div class="detail-value">{{ modelValue?.otherDeclarationElements || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">是否包税:</div>
          <div class="detail-value">
            {{ isTaxIncludedLabel(modelValue?.isTaxIncluded) || '-' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">报关方式:</div>
          <div class="detail-value">
            {{ customsDeclarationMethodLabel(modelValue?.customsDeclarationMethod) }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">物流负责人:</div>
          <div class="detail-value">{{ modelValue?.logisticsUser || '-' }}</div>
        </div>
      </div>
    </div>

    <!-- 清关信息 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">清关信息</span>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">清关HSCODE:</div>
          <div class="detail-value">{{ modelValue?.customsClearanceCode || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">清关单价:</div>
          <div class="detail-value">
            {{ modelValue?.customsClearPrice || '-' }}
            {{ modelValue?.customsClearPrice ? modelValue.customsClearPriceCurrency : '' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">清关型号:</div>
          <div class="detail-value">{{ modelValue?.customsClearModel || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">清关税率:</div>
          <div class="detail-value">
            {{
              modelValue?.customsClearTaxRate != null ? modelValue.customsClearTaxRate + '%' : '-'
            }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { useDictStore } from '@/store/modules/dict'
  import { pubFilter } from '@/utils/common-util'

  interface Props {
    modelValue: any
  }

  defineProps<Props>()
  const { dictData } = useDictStore()

  const customsDeclarationMethodOptions = [
    { label: '自主报关', value: 0 },
    { label: '供应商报关', value: 1 },
    { label: '供应商买单报关', value: 2 }
  ]
  /** 是否包税展示（选项内联，避免运行时对未定义常量的引用） */
  const isTaxIncludedLabel = (value: unknown) => {
    const options = [
      { label: '包税', value: 1 },
      { label: '不包税', value: 0 }
    ]
    const row = options.find((item) => item.value == value)
    return row?.label ?? ''
  }
  const customsDeclarationMethodLabel = (value: any) => {
    return customsDeclarationMethodOptions.find((item: any) => item.value == value)?.label || '-'
  }
</script>

<style lang="scss" scoped>
  .logistics-info-detail {
    padding: 20px;

    .section {
      margin-bottom: 30px;

      &:last-child {
        margin-bottom: 0;
      }

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

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(3, 1fr);
        gap: 16px 20px;

        .detail-item {
          display: flex;
          align-items: flex-start;

          &.full-width {
            grid-column: 1 / -1;
          }

          .detail-label {
            flex-shrink: 0;
            min-width: 120px;
            font-size: 14px;
            color: var(--el-text-color-secondary);
          }

          .detail-value {
            font-size: 14px;
            color: var(--el-text-color-primary);
            word-break: break-all;
          }
        }
      }
    }
  }
</style>
