<template>
  <div class="finance-info-detail">
    <!-- 基本信息 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">基本信息</span>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">采购主体:</div>
          <div class="detail-value">{{ modelValue?.purchaseOrganizationName || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">报关主体:</div>
          <div class="detail-value">{{ modelValue?.customsOrganizationName || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">境外收货人:</div>
          <div class="detail-value">{{ modelValue?.saleOrganizationName || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">财务负责人:</div>
          <div class="detail-value">{{ modelValue?.financeUsers || '-' }}</div>
        </div>
      </div>
    </div>

    <!-- 成本信息 -->
    <!-- <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">成本信息</span>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">标准成本:</div>
          <div class="detail-value">
            {{ modelValue?.standardCost || '-' }}
            {{ modelValue?.standardCost ? modelValue.standardCostCurrency : '' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">平均成本:</div>
          <div class="detail-value">
            {{ modelValue?.averageCost || '-' }}
            {{ modelValue?.averageCost ? modelValue.averageCostCurrency : '' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">最新采购成本:</div>
          <div class="detail-value">
            {{ modelValue?.latestPurchaseCost || '-' }}
            {{ modelValue?.latestPurchaseCost ? modelValue.latestPurchaseCostCurrency : '' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">目标成本:</div>
          <div class="detail-value">
            {{ modelValue?.targetCost || '-' }}
            {{ modelValue?.targetCost ? modelValue.targetCostCurrency : '' }}
          </div>
        </div>
      </div>
    </div> -->

    <!-- 定价信息 -->
    <!-- <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">定价信息</span>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">建议零售价:</div>
          <div class="detail-value">
            {{ modelValue?.suggestedRetailPrice || '-' }}
            {{ modelValue?.suggestedRetailPrice ? modelValue.suggestedRetailPriceCurrency : '' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">最低销售价:</div>
          <div class="detail-value">
            {{ modelValue?.minimumSellingPrice || '-' }}
            {{ modelValue?.minimumSellingPrice ? modelValue.minimumSellingPriceCurrency : '' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">市场参考价:</div>
          <div class="detail-value">
            {{ modelValue?.marketReferencePrice || '-' }}
            {{ modelValue?.marketReferencePrice ? modelValue.marketReferencePriceCurrency : '' }}
          </div>
        </div>
      </div>
    </div> -->

    <!-- 税务信息 -->
    <!-- <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">税务信息</span>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">增值税率:</div>
          <div class="detail-value">
            {{ modelValue?.vatRate != null ? modelValue.vatRate + '%' : '-' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">消费税率:</div>
          <div class="detail-value">
            {{ modelValue?.consumptionTaxRate != null ? modelValue.consumptionTaxRate + '%' : '-' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">关税税率:</div>
          <div class="detail-value">
            {{ modelValue?.customsDutyRate != null ? modelValue.customsDutyRate + '%' : '-' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">税收分类编码:</div>
          <div class="detail-value">{{ modelValue?.taxClassificationCode || '-' }}</div>
        </div>
      </div>
    </div> -->

    <!-- 其他财务信息 -->
    <!-- <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">其他财务信息</span>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">账面价值:</div>
          <div class="detail-value">
            {{ modelValue?.bookValue || '-' }}
            {{ modelValue?.bookValue ? modelValue.bookValueCurrency : '' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">预计利润率:</div>
          <div class="detail-value">
            {{
              modelValue?.estimatedProfitMargin != null
                ? modelValue.estimatedProfitMargin + '%'
                : '-'
            }}
          </div>
        </div>
        <div class="detail-item full-width">
          <div class="detail-label">备注:</div>
          <div class="detail-value">{{ modelValue?.remarks || '-' }}</div>
        </div>
      </div>
    </div> -->
  </div>
</template>

<script setup lang="ts">
  interface Props {
    modelValue: any
  }

  defineProps<Props>()
</script>

<style lang="scss" scoped>
  .finance-info-detail {
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
        grid-template-columns: repeat(4, 1fr);
        gap: 16px 20px;

        .detail-item {
          display: flex;
          align-items: flex-start;

          &.full-width {
            grid-column: 1 / -1;
          }

          .detail-label {
            flex-shrink: 0;
            min-width: 110px;
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
