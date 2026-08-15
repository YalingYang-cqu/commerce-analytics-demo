<!-- 二级展开：一条库存流水在各批次上的成本拆行（对平公式①） -->
<template>
  <div class="cost-flow-expand" v-loading="loading">
    <ArtTable
      :data="rows"
      row-key="costFlowNo"
      :autoHeight="true"
      :columns="columns"
      :pagination="undefined"
      :show-table-header="false"
      size="small"
      :row-class-name="rowClassName"
      empty-text="暂无成本拆行"
    >
      <template #batch="{ row }">
        <span class="mono">{{ row.batchNo }}</span>
        <ElTag
          size="small"
          effect="light"
          disable-transitions
          class="type-tag"
          :color="BATCH_TYPE_MAP.get(row.batchType)?.color"
        >
          {{ row.batchType }}
        </ElTag>
      </template>
      <template #isEstimated="{ row }">
        <ElTag v-if="row.isEstimated" type="warning" size="small" disable-transitions>暂估</ElTag>
        <span v-else class="muted">-</span>
      </template>
      <template #version="{ row }">
        <ElTag v-if="row.version === 'RECALC'" type="primary" size="small">重算</ElTag>
        <ElTag v-else-if="row.version === 'REVERSED'" type="info" size="small">已红冲</ElTag>
        <span v-else class="muted">正常</span>
      </template>
      <template #operation="{ row }">
        <ElButton type="primary" link size="small" @click.stop="emit('open-batch', row)">
          批次台账
        </ElButton>
      </template>
    </ArtTable>

    <div class="check-bar" :class="{ 'is-bad': !check.balanced }">
      <ElIcon><component :is="check.balanced ? CircleCheck : WarningFilled" /></ElIcon>
      成本明细数量合计 {{ formatInt(check.costQty) }} = 库存流水变动数量
      {{ formatInt(check.invQty) }}
      <span>{{ check.balanced ? '✓ 事件分摊对平' : '✗ 事件分摊未对平，需核查' }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { ElButton, ElIcon, ElTag } from 'element-plus'
  import { CircleCheck, WarningFilled } from '@element-plus/icons-vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import type { ColumnOption } from '@/types/component'
  import { costFlowDetail } from '@/api/inventory/sku-cost-flow'
  import { BATCH_TYPE_MAP } from '../../utils/dict'
  import { formatInt } from '../../utils/format'
  import { idCol, metricCol } from '../columns/shared'
  import type { CostFlowRow, FlowRow, InvFlowRow } from '../utils/types'

  defineOptions({ name: 'CostFlowExpand' })

  const props = defineProps<{ flow: InvFlowRow; row: FlowRow }>()
  const emit = defineEmits<{ 'open-batch': [row: CostFlowRow] }>()

  const loading = ref(false)
  const rows = ref<CostFlowRow[]>([])
  const check = ref({ costQty: 0, invQty: 0, balanced: true })

  const columns: ColumnOption[] = [
    idCol('costFlowNo', { width: 200, label: '成本流水编号' }),
    idCol('seqNo', { width: 80, label: '明细序号' }),
    idCol('batchNo', { width: 210, slot: 'batch', label: '批次号 / 类型' }),
    metricCol('changeQty', 'qty', { label: '变动数量' }),
    metricCol('changePurchasePrice', 'cost', { label: '采购单价' }),
    metricCol('changeLogisticsPrice', 'cost', { label: '物流单价' }),
    metricCol('changePurchaseAmount', 'cost', { label: '变动采购成本' }),
    metricCol('changeLogisticsAmount', 'cost', { label: '变动物流成本' }),
    metricCol('changeTotalAmount', 'cost', { label: '变动总成本' }),
    metricCol('mskuWarehouseQty', 'qty', {
      label: '该MSKU仓库结存',
      width: 150
    }),
    idCol('pricingMethod', { width: 100, label: '计价方式' }),
    idCol('costSource', { width: 140, label: '成本取值口径' }),
    idCol('isEstimated', { width: 90, slot: 'isEstimated', label: '是否暂估' }),
    idCol('version', { width: 90, slot: 'version', label: '版本' }),
    {
      prop: 'operation',
      label: '操作',
      width: 100,
      fixed: 'right',
      align: 'left',
      useSlot: true,
      slotName: 'operation'
    }
  ]

  const rowClassName = ({ row }: { row: CostFlowRow }) => {
    if (row.version === 'REVERSED') return 'row-reversed'
    return row.isEstimated ? 'row-estimated' : ''
  }

  const load = async () => {
    loading.value = true
    try {
      // 真实接口只需 invFlowNo；Mock 侧无法反推事件，故把该条流水的关键字段一并带上
      const res: any = await costFlowDetail({
        invFlowNo: props.flow.invFlowNo,
        changeQty: props.flow.changeQty,
        afterQty: props.flow.afterQty,
        costSplitCount: props.flow.costSplitCount,
        warehouseCode: props.row.warehouseCode,
        localSku: props.row.localSku,
        msku: props.row.msku,
        invDate: props.row.invDate
      })
      rows.value = res?.data?.records || []
      check.value = res?.data?.check || { costQty: 0, invQty: 0, balanced: true }
    } finally {
      loading.value = false
    }
  }

  watch(() => props.flow?.invFlowNo, load, { immediate: true })
</script>

<style lang="scss" scoped>
  .cost-flow-expand {
    padding: 8px 12px 4px;
    background: var(--art-main-bg-color);
    border-radius: calc(var(--custom-radius) / 2 + 2px);

    .mono {
      font-family: SFMono-Regular, Consolas, monospace;
    }

    .type-tag {
      margin-left: 6px;
      color: #fff;
      border: none;
    }

    .muted {
      color: var(--art-text-gray-400);
    }

    .check-bar {
      display: flex;
      gap: 6px;
      align-items: center;
      padding: 8px 4px 6px;
      color: var(--el-color-success);

      &.is-bad {
        color: var(--el-color-danger);
      }
    }

    :deep(.el-table__row.row-estimated td) {
      background: rgb(255 174 31 / 8%);
    }

    :deep(.el-table__row.row-reversed) {
      color: var(--art-text-gray-400);
      text-decoration: line-through;
    }
  }
</style>
