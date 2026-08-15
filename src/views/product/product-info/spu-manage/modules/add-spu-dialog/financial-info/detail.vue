<template>
  <div class="financial-info-detail">
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">财务信息</span>
      </div>
      <ElRow :gutter="20">
        <ElCol :span="6">
          <ElFormItem label="采购主体:" prop="purchaseOrganizationName">
            {{ displayData.purchaseOrganizationName || '-' }}
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="报关主体:" prop="customsOrganizationName">
            {{ displayData.customsOrganizationName || '-' }}
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="境外收货人:" prop="saleOrganizationName">
            {{ displayData.saleOrganizationName || '-' }}
          </ElFormItem>
        </ElCol>
        <ElCol :span="6">
          <ElFormItem label="财务负责人:" prop="financeUserNames">
            {{ displayData.financeUserIdNames || '-' }}
          </ElFormItem>
        </ElCol>
      </ElRow>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'

  interface Props {
    displayData?: any
  }

  const props = defineProps<Props>()
  const displayData = computed(() => props.displayData || {})
  console.log(displayData.value, 'displayDatadisplayData')
</script>

<style lang="scss" scoped>
  .financial-info-detail {
    margin-top: 8px;

    .section {
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

      .info-list {
        display: flex;
        flex-direction: column;
        gap: 16px;

        .info-item {
          display: flex;
          align-items: flex-start;
          min-height: 28px;

          .info-label {
            flex-shrink: 0;
            min-width: 100px;
            margin-right: 8px;
            font-size: 12px;
            color: var(--el-text-color-regular);
          }

          .info-value {
            flex: 1;
            font-size: 12px;
            color: var(--el-text-color-primary);
          }
        }
      }
    }
  }
</style>
