<template>
  <div class="purchase-info-detail">
    <!-- 基本信息 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">基本信息</span>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">采购参考交期:</div>
          <div class="detail-value">
            {{
              modelValue?.referenceDeliveryDays != null
                ? modelValue.referenceDeliveryDays + ' 天'
                : '-'
            }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">采购参考成本:</div>
          <div class="detail-value">
            {{
              modelValue?.referenceCost != null
                ? modelValue.referenceCost + ' ' + (modelValue?.currency || 'CNY')
                : '-'
            }}
          </div>
        </div>

        <div class="detail-item">
          <div class="detail-label">采购负责人:</div>
          <div class="detail-value">{{ modelValue?.purchaseUsers || '-' }}</div>
        </div>
        <div class="detail-item full-width">
          <div class="detail-label">采购备注:</div>
          <div class="detail-value">{{ modelValue?.purchaseRemark || '-' }}</div>
        </div>
      </div>
    </div>

    <!-- 供应商报价 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">供应商报价</span>
      </div>

      <div class="supplier-table-wrapper">
        <ElTable
          :data="modelValue?.supplierQuotes || []"
          border
          stripe
          style="width: 100%"
          :empty-text="'暂无供应商报价'"
        >
          <ElTableColumn type="index" label="序号" width="60" align="center" />
          <ElTableColumn label="供应商名称" min-width="180" prop="supplierName">
            <template #default="{ row }">
              {{ row.supplierName || '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="供应商编码" min-width="150" prop="supplierCode">
            <template #default="{ row }">
              {{ row.supplierCode || '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="是否含税" width="120" align="center">
            <template #default="{ row }">
              <ElTag :type="row.isIncludeTax ? 'success' : 'info'">
                {{ row.isTax ? '是' : '否' }}
              </ElTag>
            </template>
          </ElTableColumn>
          <ElTableColumn label="税率" width="120" align="center">
            <template #default="{ row }">
              {{ row.taxRate != null ? row.taxRate + '%' : '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="不含税单价" width="160" align="right" show-overflow-tooltip>
            <template #default="{ row }">
              {{ formatUnitPrice(row) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="含税单价" width="160" align="right" show-overflow-tooltip>
            <template #default="{ row }">
              {{ formatTaxIncludedPrice(row) }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="交期" width="140" align="center" show-overflow-tooltip>
            <template #default="{ row }">
              {{ row.deliveryDays != null ? row.deliveryDays + ' 天' : '-' }}
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ElTable, ElTableColumn, ElTag } from 'element-plus'

  interface Props {
    modelValue: any
  }

  defineProps<Props>()

  /** 安全格式化单价：数字用 toFixed，字符串仅当含 * 时原样显示，否则转字符串并追加币种 */
  function formatUnitPrice(row: { unitPrice?: string | number | null; currency?: string }) {
    const { unitPrice, currency = 'CNY' } = row
    if (unitPrice == null) return '-'
    if (typeof unitPrice === 'number')
      return currency == 'CNY' ? '￥' + unitPrice.toFixed(4) : '$' + unitPrice.toFixed(4)
    if (typeof unitPrice === 'string' && unitPrice.includes('*')) return unitPrice
    return (currency ? currency + ' ' : '') == 'CNY '
      ? '￥' + String(unitPrice)
      : '$' + String(unitPrice)
  }
  /** 安全格式化含税单价：数字用 toFixed，字符串仅当含 * 时原样显示，否则转字符串并追加币种 */
  function formatTaxIncludedPrice(row: {
    taxInclusivePrice?: string | number | null
    currency?: string
  }) {
    const { taxInclusivePrice, currency = 'CNY' } = row
    if (taxInclusivePrice == null) return '-'
    if (typeof taxInclusivePrice === 'number')
      return currency == 'CNY'
        ? '￥' + taxInclusivePrice.toFixed(4)
        : '$' + taxInclusivePrice.toFixed(4)
    if (typeof taxInclusivePrice === 'string' && taxInclusivePrice.includes('*'))
      return taxInclusivePrice
    return (currency ? currency + ' ' : '') == 'CNY '
      ? '￥' + String(taxInclusivePrice)
      : '$' + String(taxInclusivePrice)
  }
</script>

<style lang="scss" scoped>
  .purchase-info-detail {
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

      .supplier-table-wrapper {
        margin-top: 16px;

        /* 防止表格单元格内容换行导致行高不一致、列错位 */
        :deep(.el-table) {
          .el-table__body .cell {
            white-space: nowrap;
          }
        }
      }
    }
  }
</style>
