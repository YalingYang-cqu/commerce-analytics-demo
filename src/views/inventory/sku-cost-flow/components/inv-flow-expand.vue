<!-- 一级展开：当日库存流水明细（平台流水层），再展开一层是成本流水按批次拆行 -->
<template>
  <div class="inv-flow-expand" v-loading="loading">
    <div class="panel-header">
      <div class="panel-header__main">
        <ElTag type="primary" class="panel-title-tag" disable-transitions>库存流水明细</ElTag>
        <span class="panel-code">{{ row.invDate }} · {{ row.msku || row.localSku }}</span>
        <span class="panel-subtitle">{{ row.warehouseName }}</span>
        <span class="panel-order">排序固定「同一时点先入库、后出库」，与计价顺序一致</span>
        <ElTag v-if="ioTypeText" size="small" type="warning" disable-transitions>
          已按出入库类型筛选：{{ ioTypeText }}
        </ElTag>
      </div>
      <ElButton type="primary" link @click.stop="emit('collapse', row)">收起</ElButton>
    </div>

    <ArtTable
      ref="tableRef"
      :data="visibleRows"
      row-key="invFlowNo"
      :autoHeight="true"
      :columns="columns"
      :pagination="undefined"
      :show-table-header="false"
      :expand-row-keys="expandedKeys"
      size="small"
      :row-class-name="rowClassName"
      empty-text="当日无库存流水"
      @expand-change="onExpandChange"
    >
      <template #expand="{ row: flow }">
        <CostFlowExpand
          v-if="expandedKeys.includes(flow.invFlowNo)"
          :flow="flow"
          :row="row"
          @open-batch="(batch) => emit('open-batch', batch)"
        />
      </template>

      <template #docTime="{ row: flow }">
        <ElTooltip
          v-if="flow.docTime.endsWith('00:00:00')"
          content="源数据无日内时间，分类账按日聚合"
          placement="top"
        >
          <span class="muted">{{ flow.docTime }}</span>
        </ElTooltip>
        <span v-else>{{ flow.docTime }}</span>
      </template>

      <template #bizType="{ row: flow }">
        <span>{{ bizIoText(flow.bizType, flow.ioType) }}</span>
      </template>

      <template #bizNo="{ row: flow }">
        <ElLink v-if="flow.genMode === 'DETAIL'" type="primary" :underline="false">
          {{ flow.bizNo }}
        </ElLink>
        <ElTooltip v-else content="日聚合与轧差行没有对应的平台单据" placement="top">
          <span class="muted">{{ flow.bizNo }}</span>
        </ElTooltip>
      </template>

      <template #ioDirection="{ row: flow }">
        <ElTag size="small" :type="flow.ioDirection === 'IN' ? 'success' : 'info'">
          {{ flow.ioDirection === 'IN' ? '入库' : '出库' }}
        </ElTag>
      </template>

      <template #genMode="{ row: flow }">
        <ElTag size="small" :type="GEN_MODE_MAP[flow.genMode]?.type" disable-transitions>
          {{ GEN_MODE_MAP[flow.genMode]?.label || flow.genMode }}
        </ElTag>
      </template>

      <template #exceptionReason="{ row: flow }">
        <span v-if="flow.exceptionReason" class="warn-text">{{ flow.exceptionReason }}</span>
        <span v-else class="muted">-</span>
      </template>

      <!-- 拆行数与展开入口合成一列：数字本身就是这一行能展开几条成本流水 -->
      <template #costSplit="{ row: flow }">
        <ElButton type="primary" link size="small" @click.stop="toggleExpand(flow)">
          拆 {{ flow.costSplitCount }} 行
          <ElIcon
            class="op-arrow"
            :class="{ 'is-expanded': expandedKeys.includes(flow.invFlowNo) }"
          >
            <ArrowRight />
          </ElIcon>
        </ElButton>
      </template>
    </ArtTable>

    <div v-if="rows.length > INLINE_LIMIT" class="expand-foot">
      共 {{ rows.length }} 条流水，内嵌只渲染前 {{ INLINE_LIMIT }} 条
      <ElLink type="primary" :underline="false" @click.stop="emit('open-drawer', row)">
        在抽屉中查看全部 →
      </ElLink>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import { ElButton, ElIcon, ElLink, ElTag, ElTooltip } from 'element-plus'
  import { ArrowRight } from '@element-plus/icons-vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import type { ColumnOption } from '@/types/component'
  import { invFlowDetail } from '@/api/inventory/sku-cost-flow'
  import { bizIoText, GEN_MODE_MAP, IO_TYPE_LABEL } from '../../utils/dict'
  import { idCol, metricCol } from '../columns/shared'
  import CostFlowExpand from './cost-flow-expand.vue'
  import type { CostFlowRow, FlowRow, InvFlowRow } from '../utils/types'

  defineOptions({ name: 'InvFlowExpand' })

  const props = withDefaults(
    defineProps<{
      row: FlowRow
      /** 顶部筛选选中的二级出入库类型，为空表示不收窄 */
      ioTypes?: string[]
    }>(),
    { ioTypes: () => [] }
  )
  const emit = defineEmits<{
    collapse: [row: FlowRow]
    'open-drawer': [row: FlowRow]
    'open-batch': [row: CostFlowRow]
  }>()

  /** 单行流水过多时只渲染前 50 条，其余引导到抽屉 */
  const INLINE_LIMIT = 50

  const loading = ref(false)
  const rows = ref<InvFlowRow[]>([])
  const expandedKeys = ref<string[]>([])
  const tableRef = ref<{
    elTableRef?: { toggleRowExpansion: (row: unknown, expanded?: boolean) => void }
  }>()

  const visibleRows = computed(() => rows.value.slice(0, INLINE_LIMIT))

  const ioTypeText = computed(() =>
    props.ioTypes.map((code) => IO_TYPE_LABEL[code] || code).join('、')
  )

  const columns: ColumnOption[] = [
    { type: 'expand', width: 1, fixed: 'left', className: 'inv-expand-col', hideInSetting: true },
    idCol('invFlowNo', { width: 200, label: '库存流水编号', copy: true }),
    idCol('docTime', { width: 160, slot: 'docTime', label: '单据时间' }),
    idCol('bizType', { width: 190, slot: 'bizType', label: '业务类型' }),
    idCol('bizNo', { width: 200, slot: 'bizNo', label: '业务编号' }),
    idCol('ioDirection', { width: 90, slot: 'ioDirection', label: '库存方向' }),
    metricCol('changeQty', 'qty', { label: '变动数量' }),
    metricCol('beforeQty', 'qty', { label: '处理前结存' }),
    metricCol('afterQty', 'qty', { label: '处理后结存' }),
    idCol('reportSource', { width: 140, label: '报告来源' }),
    idCol('reportBatchNo', { width: 150, label: '源报告批次号' }),
    idCol('genMode', { width: 110, slot: 'genMode', label: '数据生成方式' }),
    idCol('exceptionReason', { width: 220, slot: 'exceptionReason', label: '异常原因' }),
    {
      prop: 'costSplitCount',
      label: '成本拆行',
      width: 110,
      fixed: 'right',
      align: 'left',
      useSlot: true,
      slotName: 'costSplit'
    }
  ]

  const rowClassName = ({ row: flow }: { row: InvFlowRow }) =>
    flow.exceptionReason ? 'row-warn' : ''

  const onExpandChange = (flow: InvFlowRow, expanded: boolean) => {
    expandedKeys.value = expanded
      ? [...new Set([...expandedKeys.value, flow.invFlowNo])]
      : expandedKeys.value.filter((key) => key !== flow.invFlowNo)
  }

  const toggleExpand = (flow: InvFlowRow) => {
    const expanded = expandedKeys.value.includes(flow.invFlowNo)
    onExpandChange(flow, !expanded)
    nextTick(() => tableRef.value?.elTableRef?.toggleRowExpansion(flow, !expanded))
  }

  const load = async () => {
    loading.value = true
    try {
      const res: any = await invFlowDetail({
        rowKey: props.row.rowKey,
        ioTypeList: props.ioTypes
      })
      rows.value = res?.data?.records || []
      expandedKeys.value = []
    } finally {
      loading.value = false
    }
  }

  watch([() => props.row?.rowKey, () => props.ioTypes], load, { immediate: true, deep: true })
</script>

<style lang="scss" scoped>
  .inv-flow-expand {
    padding: 12px 16px 4px;
    background: var(--art-bg-color);
    border-radius: calc(var(--custom-radius) / 2 + 2px);

    .panel-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 10px;

      &__main {
        display: flex;
        gap: 8px;
        align-items: center;
      }

      .panel-code {
        font-weight: 600;
        color: var(--art-text-gray-800);
      }

      .panel-subtitle {
        color: var(--art-text-gray-600);
      }

      .panel-order {
        color: var(--art-text-gray-400);
      }
    }

    .muted {
      color: var(--art-text-gray-400);
    }

    .warn-text {
      color: var(--el-color-warning);
    }

    .expand-foot {
      padding: 8px 2px 10px;
      color: var(--art-text-gray-600);
    }

    :deep(.el-table__row.row-warn td) {
      background: rgb(255 174 31 / 8%);
    }

    /* 展开列压成 1px 的隐形列：展开行内容仍由它渲染，箭头交给操作列 */
    :deep(.inv-expand-col) {
      padding: 0 !important;
      border-right: none !important;

      .cell {
        padding: 0 !important;
      }

      .el-table__expand-icon {
        display: none;
      }
    }

    .op-arrow {
      margin-left: 2px;
      font-size: 12px;
      transition: transform 0.2s;

      &.is-expanded {
        transform: rotate(90deg);
      }
    }
  }
</style>
