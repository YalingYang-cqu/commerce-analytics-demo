<!-- 按批次明细表：图片/SKU/品名/FIFO批次号/入库日期/数量/成本/较上批次/构成/单据来源/状态 -->
<template>
  <ElTable :data="data" stripe :border="false" class="batch-detail-table">
    <ElTableColumn label="图片" width="72" fixed="left">
      <template #default="{ row }">
        <ElImage
          v-if="row.imageUrl"
          :src="row.imageUrl"
          fit="cover"
          style="width: 48px; height: 48px; border-radius: 4px"
          :preview-src-list="[row.imageUrl]"
          :preview-teleported="true"
        />
        <div v-else class="image-placeholder">
          <ElIcon><Picture /></ElIcon>
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn label="SKU" prop="sku" min-width="100" fixed="left">
      <template #default="{ row }">
        <ElLink type="primary" :underline="false">{{ row.sku }}</ElLink>
      </template>
    </ElTableColumn>
    <ElTableColumn label="中文品名" prop="skuName" min-width="140" />
    <ElTableColumn label="FIFO 批次号" prop="fifoBatchNo" min-width="200">
      <template #default="{ row }">
        <ElLink type="primary" :underline="false">{{ row.fifoBatchNo }}</ElLink>
      </template>
    </ElTableColumn>
    <ElTableColumn label="入库日期" prop="inboundDate" width="110" />
    <ElTableColumn label="入库数量" prop="inboundQty" width="100" align="right">
      <template #default="{ row }">{{ row.inboundQty.toLocaleString() }}</template>
    </ElTableColumn>
    <ElTableColumn label="当前剩余数量" prop="remainingQty" width="120" align="right">
      <template #default="{ row }">
        <span class="bold-text">{{ row.remainingQty.toLocaleString() }}</span>
      </template>
    </ElTableColumn>
    <ElTableColumn label="采购成本" prop="purchaseCost" width="100" align="right">
      <template #default="{ row }">¥{{ formatMoney(row.purchaseCost) }}</template>
    </ElTableColumn>
    <ElTableColumn label="头程成本(分摊)" prop="freightCost" width="130" align="right">
      <template #default="{ row }">¥{{ formatMoney(row.freightCost) }}</template>
    </ElTableColumn>
    <ElTableColumn label="单位综合成本" prop="unitTotalCost" width="120" align="right">
      <template #default="{ row }">
        <span class="primary-text">¥{{ formatMoney(row.unitTotalCost) }}</span>
      </template>
    </ElTableColumn>
    <ElTableColumn label="较上批次" width="100" align="center">
      <template #default="{ row }">
        <span v-if="row.changeRatio == null" class="flat">—</span>
        <span v-else-if="row.changeRatio === 0" class="flat">0.0%</span>
        <span v-else :class="row.changeRatio > 0 ? 'up' : 'down'">
          {{ row.changeRatio > 0 ? '↑' : '↓' }} {{ Math.abs(row.changeRatio) }}%
        </span>
      </template>
    </ElTableColumn>
    <ElTableColumn label="成本构成" min-width="180">
      <template #default="{ row }">
        <div class="cost-bar">
          <div
            class="cost-bar__segment cost-bar__segment--purchase"
            :style="{ width: `${getCostBarPercent(row).purchase}%` }"
          />
          <div
            class="cost-bar__segment cost-bar__segment--freight"
            :style="{ width: `${getCostBarPercent(row).freight}%` }"
          />
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn label="单据来源" min-width="220">
      <template #default="{ row }">
        <div class="source-cell">
          <ElLink type="primary" :underline="false">{{ row.sourcePoNo }}</ElLink>
          <span class="source-arrow">→</span>
          <ElLink type="primary" :underline="false">{{ row.sourceInboundNo }}</ElLink>
        </div>
      </template>
    </ElTableColumn>
    <ElTableColumn label="状态" width="140">
      <template #default="{ row }">
        <div class="status-cell">
          <ElTag :type="statusType(row.status)" size="small" disable-transitions>
            ● {{ statusLabel(row.status) }}
          </ElTag>
          <span v-if="['partial'].includes(row.status) && row.soldPercent != null" class="sold-tag">
            已耗 {{ row.soldPercent }}%
          </span>
        </div>
      </template>
    </ElTableColumn>
  </ElTable>
</template>

<script setup lang="ts">
  import { ElIcon, ElImage, ElLink, ElTable, ElTableColumn, ElTag } from 'element-plus'
  import { Picture } from '@element-plus/icons-vue'
  import { formatMoney } from '../utils/mock-data'
  import type { BatchDetailRow } from '../utils/types'
  import { add, divide, mul } from '@/utils/common-util'

  defineProps<{ data: BatchDetailRow[] }>()

  const statusLabel = (s: BatchDetailRow['status']) => {
    if (s === 'consuming') return '消耗中'
    if (s === 'pending') return '待消耗'
    return '已消耗'
  }
  const statusType = (s: BatchDetailRow['status']): 'success' | 'primary' | 'info' => {
    if (s === 'consuming') return 'success'
    if (s === 'pending') return 'primary'
    return 'info'
  }
  const getCostBarPercent = (row: BatchDetailRow) => {
    const total = add(row.costBreakdown.purchase, row.costBreakdown.freight)
    if (total <= 0) return { purchase: 0, freight: 0 }
    return {
      purchase: mul(divide(row.costBreakdown.purchase, total), 100),
      freight: mul(divide(row.costBreakdown.freight, total), 100)
    }
  }
</script>

<style lang="scss" scoped>
  .batch-detail-table {
    .image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      color: var(--el-text-color-placeholder);
      background: var(--el-fill-color-light);
      border-radius: 4px;
    }

    .primary-text {
      font-weight: 800;
      color: var(--el-color-primary);
    }

    .bold-text {
      font-weight: 800;
    }

    .up {
      color: #f56c6c;
    }

    .down {
      color: #67c23a;
    }

    .flat {
      color: #909399;
    }

    .cost-bar {
      display: flex;
      width: 100%;
      max-width: 180px;
      height: 8px;
      overflow: hidden;
      background: var(--el-fill-color);
      border-radius: 4px;

      &__segment {
        height: 100%;

        &--purchase {
          background: #409eff;
        }

        &--freight {
          background: #f7ba2a;
        }
      }
    }

    .source-cell {
      display: flex;
      gap: 4px;
      align-items: center;
      font-size: 12px;

      .source-arrow {
        color: var(--el-text-color-placeholder);
      }
    }

    .status-cell {
      display: flex;
      gap: 4px;
      align-items: center;

      .sold-tag {
        color: #67c23a;
      }
    }
  }
</style>
