<template>
  <div class="finance-info-edit">
    <ElForm ref="formRef" :model="localData" label-width="120px" class="finance-form">
      <!-- 基本信息：标题固定，仅内容区横向滚动 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title-bar"></span>
          <span class="section-title">基本信息</span>
        </div>
        <div class="section-content section-scroll">
          <ElRow :gutter="20">
            <ElCol :span="6">
              <ElFormItem label="采购主体:" prop="purchaseOrganizationId">
                <MkSelect
                  v-model="localData.purchaseOrganizationId"
                  placeholder="请选择"
                  :options="(entityOptions || []).filter((v: any) => v.type.includes(1))"
                  :label-value="{ name: 'label', value: 'value' }"
                  filterable
                  clearable
                  :always-filter-input="true"
                  width="100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="报关主体:" prop="customsOrganizationId">
                <MkSelect
                  v-model="localData.customsOrganizationId"
                  placeholder="请选择"
                  :options="(entityOptions || []).filter((v: any) => v.type.includes(2))"
                  :label-value="{ name: 'label', value: 'value' }"
                  filterable
                  clearable
                  :always-filter-input="true"
                  width="100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="境外收货人:" prop="saleOrganizationId">
                <MkSelect
                  v-model="localData.saleOrganizationId"
                  placeholder="请选择"
                  :options="(entityOptions || []).filter((v: any) => v.type.includes(3))"
                  :label-value="{ name: 'label', value: 'value' }"
                  filterable
                  clearable
                  :always-filter-input="true"
                  width="100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="财务负责人:" prop="financeUserList">
                <MkSelect
                  v-model="localData.financeUserList"
                  placeholder="请选择"
                  :options="userOptions"
                  :label-value="{ name: 'label', value: 'value' }"
                  filterable
                  clearable
                  multiple
                  collapse-tags
                  collapse-tags-tooltip
                  :always-filter-input="true"
                  width="100%"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </div>
      </div>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, inject, computed } from 'vue'
  import { ElForm, ElFormItem, ElRow, ElCol, type FormInstance } from 'element-plus'
  import MkSelect from '@/components/core/others/mk-select/index.vue'
  import { useDictStore } from '@/store/modules/dict'

  interface Props {
    modelValue: any
    userOptions?: Array<{ label: string; value: string | number }>
    // entityOptions?: Array<{ label: string; value: string | number }>
  }

  interface FinanceInfo {
    // 基本信息
    purchaseOrganizationId: number | null
    customsOrganizationId: number | null
    saleOrganizationId: number | null
    financeUserList: Array<string | number>
    // 成本信息
    standardCost: number | null
    standardCostCurrency: string
    averageCost: number | null
    averageCostCurrency: string
    latestPurchaseCost: number | null
    latestPurchaseCostCurrency: string
    targetCost: number | null
    targetCostCurrency: string
    // 定价信息
    suggestedRetailPrice: number | null
    suggestedRetailPriceCurrency: string
    minimumSellingPrice: number | null
    minimumSellingPriceCurrency: string
    marketReferencePrice: number | null
    marketReferencePriceCurrency: string
    // 税务信息
    vatRate: number | null
    consumptionTaxRate: number | null
    customsDutyRate: number | null
    taxClassificationCode: string
    // 其他财务信息
    bookValue: number | null
    bookValueCurrency: string
    estimatedProfitMargin: number | null
    remarks: string
  }

  const { dictData } = useDictStore()

  const basicData: any = inject('basicData')
  const companyAll = ref(basicData.companyAll)

  const props = withDefaults(defineProps<Props>(), {
    userOptions: () => []
    // entityOptions: () => [
    //   { label: '深圳公司', value: '1' },
    //   { label: '上海公司', value: '2' },
    //   { label: '北京公司', value: '3' },
    //   { label: '广州公司', value: '4' },
    //   { label: '香港公司', value: '5' }
    // ]
  })

  const emit = defineEmits(['update:modelValue'])

  const formRef = ref<FormInstance>()

  const entityOptions = computed(() =>
    companyAll.value.map((item) => ({
      label: item.name,
      value: item.id,
      type: item.companyType
    }))
  )
  const dictCompanyObj: any = {}
  dictData['companyType'].forEach((company: any) => {
    dictCompanyObj[company['label']] = company['value']
  })

  // 初始化本地数据
  const localData = reactive<FinanceInfo>({
    purchaseOrganizationId: null,
    customsOrganizationId: null,
    saleOrganizationId: null,
    financeUserList: [],
    standardCost: null,
    standardCostCurrency: 'CNY',
    averageCost: null,
    averageCostCurrency: 'CNY',
    latestPurchaseCost: null,
    latestPurchaseCostCurrency: 'CNY',
    targetCost: null,
    targetCostCurrency: 'CNY',
    suggestedRetailPrice: null,
    suggestedRetailPriceCurrency: 'CNY',
    minimumSellingPrice: null,
    minimumSellingPriceCurrency: 'CNY',
    marketReferencePrice: null,
    marketReferencePriceCurrency: 'CNY',
    vatRate: null,
    consumptionTaxRate: null,
    customsDutyRate: null,
    taxClassificationCode: '',
    bookValue: null,
    bookValueCurrency: 'CNY',
    estimatedProfitMargin: null,
    remarks: ''
  })

  // 监听 props.modelValue 变化，同步到 localData
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal && Object.keys(newVal).length > 0) {
        // 有数据时，合并到 localData
        Object.assign(localData, newVal)
      } else {
        // 空对象或 undefined 时，重置为初始值
        Object.assign(localData, {
          purchaseOrganizationId: null,
          customsOrganizationId: null,
          saleOrganizationId: null,
          financeUserList: [],
          standardCost: null,
          standardCostCurrency: 'CNY',
          averageCost: null,
          averageCostCurrency: 'CNY',
          latestPurchaseCost: null,
          latestPurchaseCostCurrency: 'CNY',
          targetCost: null,
          targetCostCurrency: 'CNY',
          suggestedRetailPrice: null,
          suggestedRetailPriceCurrency: 'CNY',
          minimumSellingPrice: null,
          minimumSellingPriceCurrency: 'CNY',
          marketReferencePrice: null,
          marketReferencePriceCurrency: 'CNY',
          vatRate: null,
          consumptionTaxRate: null,
          customsDutyRate: null,
          taxClassificationCode: '',
          bookValue: null,
          bookValueCurrency: 'CNY',
          estimatedProfitMargin: null,
          remarks: ''
        })
      }
    },
    { immediate: true, deep: true }
  )

  // 监听 localData 变化，同步到父组件
  watch(
    localData,
    (newVal) => {
      emit('update:modelValue', { ...newVal })
    },
    { deep: true }
  )

  // 表单验证
  const validate = async () => {
    if (!formRef.value) return false
    return formRef.value.validate()
  }

  // 暴露验证方法
  defineExpose({
    validate,
    localData
  })
</script>

<style lang="scss" scoped>
  .finance-info-edit {
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

      // 按模块滚动：仅内容区横向滚动，标题不移动
      .section-content.section-scroll {
        overflow: auto visible;
        -webkit-overflow-scrolling: touch;

        &::-webkit-scrollbar {
          height: 8px;
        }

        &::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;

          &:hover {
            background: #a8a8a8;
          }
        }

        :deep(.el-row) {
          min-width: 1450px !important;
          padding-right: 80px !important;

          .el-col {
            padding: 0 20px;
          }
        }
      }
    }

    .finance-form {
      :deep(.el-input-group__append) {
        padding: 0;

        .el-select {
          margin: -1px;

          .el-input__wrapper {
            border-radius: 0;
            box-shadow: none;
          }
        }
      }

      .price-input-group {
        display: flex;
        gap: 0;
        align-items: center;
        width: 100%;

        :deep(.el-input-number) {
          .el-input__wrapper {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
          }
        }

        :deep(.el-select) {
          .el-input__wrapper {
            border-left: 0;
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
          }
        }
      }
    }
  }
</style>
