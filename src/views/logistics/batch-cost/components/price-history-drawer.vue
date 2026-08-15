<!-- 历史头程价格抽屉 -->
<template>
  <ElDrawer
    v-model="drawerVisible"
    :size="900"
    :with-header="false"
    destroy-on-close
    class="price-history-drawer"
    @closed="handleClosed"
  >
    <div ref="exportRef" class="drawer-export-area" :class="{ 'is-exporting': exporting }">
      <div class="drawer-header">
        <div class="drawer-header__main">
          <h3 class="drawer-title">
            {{ headerProductCode }}
            <span class="drawer-title__sep">·</span>
            历史头程价格
          </h3>
          <p v-if="historyData" class="drawer-subtitle">
            {{ historyData.logisticsManager }}
            <span class="drawer-subtitle__sep">·</span>
            共 {{ historyData.totalRecordCount }} 条价格记录
          </p>
        </div>
        <ElButton class="drawer-close" text @click="drawerVisible = false">
          <ElIcon :size="18"><Close /></ElIcon>
        </ElButton>
      </div>

      <div v-loading="loading" class="drawer-body">
        <template v-if="historyData?.suppliers.length">
          <PriceHistorySupplierCard
            v-for="(supplier, idx) in historyData.suppliers"
            :key="supplier.channelName"
            :supplier="supplier"
            :supplier-index="idx"
            :chart-color="getChannelBarColor(supplier.channelName)"
          />
        </template>
        <ElEmpty v-else-if="!loading" description="暂无价格记录" />
      </div>
    </div>

    <template #footer>
      <div class="drawer-footer">
        <ElButton
          :loading="exporting"
          :disabled="!historyData?.suppliers.length"
          @click="handleExport"
        >
          导出
        </ElButton>
        <ElButton type="primary" @click="drawerVisible = false">完成</ElButton>
      </div>
    </template>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref, watch } from 'vue'
  import dayjs from 'dayjs'
  import { Close } from '@element-plus/icons-vue'
  import { ElButton, ElDrawer, ElEmpty, ElIcon, ElMessage } from 'element-plus'
  import PriceHistorySupplierCard from './price-history-supplier-card.vue'
  import type { BatchCostRow, DimensionType } from '../utils/mock-data'
  import { exportElementToPng } from '../utils/export-element-image'
  import { fetchPriceHistory, type PriceHistoryResult } from '../utils/mock-price-history'
  import { getChannelBarColor } from '../utils/channel-tag'

  defineOptions({ name: 'PriceHistoryDrawer' })

  const props = defineProps<{
    visible: boolean
    productRow: BatchCostRow | null
    dimension: DimensionType
  }>()

  const emit = defineEmits<{
    'update:visible': [value: boolean]
  }>()

  const loading = ref(false)
  const exporting = ref(false)
  const exportRef = ref<HTMLElement | null>(null)
  const historyData = ref<PriceHistoryResult | null>(null)

  const drawerVisible = computed({
    get: () => props.visible,
    set: (val) => emit('update:visible', val)
  })

  const headerProductCode = computed(
    () => historyData.value?.productCode || props.productRow?.sku || '—'
  )

  async function loadHistory() {
    if (!props.productRow) return
    loading.value = true
    try {
      historyData.value = await fetchPriceHistory(props.productRow, props.dimension)
    } finally {
      loading.value = false
    }
  }

  function handleClosed() {
    historyData.value = null
  }

  async function handleExport() {
    if (!exportRef.value || !historyData.value?.suppliers.length) {
      ElMessage.warning('暂无可导出内容')
      return
    }

    if (loading.value) {
      ElMessage.warning('数据加载中，请稍后再导出')
      return
    }

    exporting.value = true
    try {
      await nextTick()
      await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))
      // 等待 ECharts 完成绘制，避免截到空白图表
      await new Promise((resolve) => setTimeout(resolve, 300))

      const code = historyData.value.productCode || 'price-history'
      const filename = `${code}-历史头程价格-${dayjs().format('YYYYMMDD-HHmmss')}.png`
      await exportElementToPng(exportRef.value, { filename, scale: 2 })
      ElMessage.success('图片已导出')
    } catch (error) {
      console.error('[price-history] export image failed:', error)
      ElMessage.error('导出图片失败，请稍后重试')
    } finally {
      exporting.value = false
    }
  }

  watch(
    () => [props.visible, props.productRow?.id, props.dimension] as const,
    ([visible]) => {
      if (visible && props.productRow) {
        loadHistory()
      }
    }
  )
</script>

<style lang="scss">
  .price-history-drawer {
    .el-drawer__body {
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
    }

    .el-drawer__footer {
      padding: 12px 20px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }
</style>

<style lang="scss" scoped>
  .drawer-header {
    display: flex;
    gap: 12px;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid var(--el-border-color-lighter);
  }

  .drawer-header__main {
    display: flex;
    flex-wrap: wrap;
    gap: 4px 12px;
    align-items: baseline;
    min-width: 0;
  }

  .drawer-title {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    line-height: 1.4;
    color: var(--el-text-color-primary);

    &__sep {
      margin: 0 4px;
      font-weight: 400;
      color: var(--el-text-color-secondary);
    }
  }

  .drawer-subtitle {
    margin: 0;
    font-size: 13px;
    color: var(--el-text-color-secondary);

    &__sep {
      margin: 0 4px;
    }
  }

  .drawer-close {
    flex-shrink: 0;
    padding: 4px;
    color: var(--el-text-color-secondary);
  }

  .drawer-export-area {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-height: 0;
    overflow: hidden;

    &.is-exporting .drawer-body {
      overflow: visible;
    }
  }

  .drawer-body {
    flex: 1;
    padding: 16px 20px;
    overflow-y: auto;

    :deep(.channel-price-card) {
      margin-bottom: 18px;

      &:last-child {
        margin-bottom: 0;
      }
    }
  }

  .drawer-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
