<!-- 按 SKU 汇总表：图片/SKU/品名/分类/库存/批次成本/预警/趋势/成本明细，点击"查看明细"行内展开 FIFO 面板 -->
<template>
  <ElTable
    ref="tableRef"
    :data="data"
    row-key="id"
    :border="false"
    stripe
    class="sku-summary-table"
    :expand-row-keys="expandedRowKeys"
    @expand-change="handleExpandChange"
  >
    <ElTableColumn type="expand" width="1" class-name="sku-summary-expand-col">
      <template #default="{ row }">
        <SkuFifoExpandPanel
          v-if="expandedRowKeys.includes(row.id)"
          :product-row="row"
          @collapse="handleCollapseRow(row)"
        />
      </template>
    </ElTableColumn>

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
          <ElIcon>
            <Picture />
          </ElIcon>
        </div>
      </template>
    </ElTableColumn>

    <ElTableColumn label="SKU" prop="sku" min-width="120" fixed="left">
      <template #default="{ row }">
        <ElLink type="primary" :underline="false">{{ row.sku }}</ElLink>
      </template>
    </ElTableColumn>

    <ElTableColumn label="SKU中文品名" prop="skuName" min-width="160" />

    <ElTableColumn label="分类" prop="category" min-width="100">
      <template #default="{ row }">
        <ElTag type="success" effect="plain" disable-transitions>{{ row.category }}</ElTag>
      </template>
    </ElTableColumn>

    <ElTableColumn label="库存数量" prop="stockQty" min-width="100" align="right">
      <template #default="{ row }">
        <span :class="{ 'negative-stock': row.stockQty < 0 }">
          {{ row.stockQty.toLocaleString() }}
        </span>
      </template>
    </ElTableColumn>

    <ElTableColumn label="最早批次成本" min-width="120" align="right">
      <template #default="{ row }">{{
        row.earliestBatchCost == null ? '—' : `¥${formatMoney(row.earliestBatchCost)}`
      }}</template>
    </ElTableColumn>

    <ElTableColumn label="最近批次成本" min-width="120" align="right">
      <template #default="{ row }">{{
        row.latestBatchCost == null ? '—' : `¥${formatMoney(row.latestBatchCost)}`
      }}</template>
    </ElTableColumn>

    <ElTableColumn label="在售批次成本" min-width="130" align="right">
      <template #default="{ row }">
        <ElTag
          v-if="row.sellingBatchCost != null"
          type="primary"
          effect="light"
          disable-transitions
          class="selling-cost-tag"
        >
          ★¥{{ formatMoney(row.sellingBatchCost) }}
        </ElTag>
        <span v-else>—</span>
      </template>
    </ElTableColumn>

    <ElTableColumn label="可售批次" min-width="100" align="center">
      <template #default="{ row }">
        <ElTag v-if="row.availableBatches > 0" type="info" effect="plain" disable-transitions>
          {{ row.availableBatches }} 批次
        </ElTag>
        <ElTag v-else type="danger" effect="plain" disable-transitions>无可用</ElTag>
      </template>
    </ElTableColumn>

    <ElTableColumn label="可售天数" prop="availableDays" min-width="90" align="center">
      <template #default="{ row }">{{
        row.availableDays == null ? '—' : `${row.availableDays} 天`
      }}</template>
    </ElTableColumn>

    <ElTableColumn label="预警" min-width="140">
      <template #default="{ row }">
        <div v-if="row.warnings.length" class="warning-cell">
          <ElTag
            v-for="w in row.warnings"
            :key="w.label"
            :type="warningTagType(w.type)"
            size="small"
            disable-transitions
            :effect="['turnover', 'overdue'].includes(w.type) ? 'light' : undefined"
          >
            ● {{ w.label }}
          </ElTag>
        </div>
        <span v-else class="placeholder-text">—</span>
      </template>
    </ElTableColumn>

    <ElTableColumn label="趋势分析" min-width="160" align="center">
      <template #default="{ row }">
        <div class="trend-cell">
          <TrendSpark :data="row.trendData" />
          <ElLink type="primary" :underline="false" class="trend-link">详情 ></ElLink>
        </div>
      </template>
    </ElTableColumn>

    <ElTableColumn label="成本明细" min-width="120" align="center" fixed="right">
      <template #default="{ row }">
        <ElLink type="primary" :underline="false" class="detail-link" @click="toggleExpand(row)">
          {{ expandedRowKeys.includes(row.id) ? '收起明细 <' : '查看明细 >' }}
        </ElLink>
      </template>
    </ElTableColumn>
  </ElTable>
</template>

<script setup lang="ts">
  import { defineAsyncComponent, defineComponent, h, nextTick, ref } from 'vue'
  import { ElIcon, ElImage, ElLink, ElTable, ElTableColumn, ElTag } from 'element-plus'
  import { Picture } from '@element-plus/icons-vue'
  import { formatMoney } from '../utils/mock-data'
  import type { SkuSummaryRow, TrendPoint, WarningType } from '../utils/types'

  const SkuFifoExpandPanel = defineAsyncComponent(() => import('./sku-fifo-expand-panel.vue'))

  defineProps<{ data: SkuSummaryRow[] }>()

  const tableRef = ref<InstanceType<typeof ElTable>>()
  const expandedRowKeys = ref<string[]>([])

  const toggleExpand = (row: SkuSummaryRow) => {
    if (expandedRowKeys.value.includes(row.id)) {
      handleCollapseRow(row)
      return
    }
    expandedRowKeys.value = [...expandedRowKeys.value, row.id]
    nextTick(() => tableRef.value?.toggleRowExpansion(row, true))
  }

  const handleExpandChange = (row: SkuSummaryRow, expanded: boolean) => {
    if (expanded) {
      if (!expandedRowKeys.value.includes(row.id)) {
        expandedRowKeys.value = [...expandedRowKeys.value, row.id]
      }
    } else {
      expandedRowKeys.value = expandedRowKeys.value.filter((id) => id !== row.id)
    }
  }

  const handleCollapseRow = (row: SkuSummaryRow) => {
    expandedRowKeys.value = expandedRowKeys.value.filter((id) => id !== row.id)
    nextTick(() => tableRef.value?.toggleRowExpansion(row, false))
  }

  const warningTagType = (type: WarningType): 'danger' | 'warning' | 'info' | 'success' => {
    // 异常预警 / 库存超期 → 红；成本异常 / 库存周转 → 黄
    if (type === 'abnormal' || type === 'overdue') return 'danger'
    if (type === 'costSurge' || type === 'turnover') return 'warning'
    return 'info'
  }

  /** 趋势迷你折线（用纯 SVG 渲染，无外部依赖） */
  const TrendSpark = defineComponent({
    name: 'TrendSpark',
    props: { data: { type: Array as () => TrendPoint[], default: () => [] } },
    setup(p) {
      return () => {
        const points = p.data.filter((d) => d.value != null) as { label: string; value: number }[]
        if (points.length < 2) {
          return h('span', { class: 'spark-empty' }, '—')
        }
        const w = 80
        const h2 = 24
        const min = Math.min(...points.map((d) => d.value))
        const max = Math.max(...points.map((d) => d.value))
        const range = max - min || 1
        const step = w / (points.length - 1)
        const path = points
          .map((d, i) => {
            const x = i * step
            const y = h2 - ((d.value - min) / range) * h2
            return `${i === 0 ? 'M' : 'L'} ${x} ${y}`
          })
          .join(' ')
        return h('svg', { width: w, height: h2, viewBox: `0 0 ${w} ${h2}`, class: 'trend-spark' }, [
          h('path', { d: path, fill: 'none', stroke: '#409eff', 'stroke-width': 1.5 })
        ])
      }
    }
  })
</script>

<style lang="scss" scoped>
  .sku-summary-table {
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

    .negative-stock {
      font-weight: 600;
      color: #f56c6c;
    }

    .selling-cost-tag {
      font-weight: 600;
    }

    .warning-cell {
      display: flex;
      flex-wrap: wrap;
      gap: 4px;
    }

    .placeholder-text {
      color: var(--el-text-color-placeholder);
    }

    .trend-cell {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: center;

      .trend-link {
        font-size: 12px;
      }
    }

    .detail-link {
      font-size: 12px;
    }

    :deep(.sku-summary-expand-col) {
      padding: 0 !important;
      border-right: none !important;

      .cell {
        padding: 0 !important;
      }

      .el-table__expand-icon {
        display: none;
      }
    }

    :deep(.el-table__expanded-cell) {
      padding: 0 !important;
      background-color: var(--el-fill-color-light) !important;
    }

    :deep(.spark-empty) {
      color: var(--el-text-color-placeholder);
    }
  }
</style>
