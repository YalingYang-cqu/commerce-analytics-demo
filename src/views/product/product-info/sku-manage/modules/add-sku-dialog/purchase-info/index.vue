<template>
  <div class="purchase-info">
    <!-- 基本信息：标题固定，仅内容区横向滚动 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">基本信息</span>
      </div>
      <div class="section-content section-scroll">
        <ElForm ref="formRef" :model="formData" :rules="rules" label-width="120px">
          <ElRow :gutter="20">
            <ElCol :span="8">
              <ElFormItem label="采购参考交期:">
                <ElInputNumber
                  v-model="formData.referenceDeliveryDays"
                  placeholder="请输入"
                  :min="0"
                  :precision="0"
                  :controls="false"
                  style="width: 100%"
                >
                  <!-- <template #append>天</template> -->
                  <template #suffix>天</template>
                </ElInputNumber>
              </ElFormItem>
            </ElCol>

            <ElCol :span="8">
              <ElFormItem label="采购参考成本:">
                <div class="input-with-select">
                  <ElInputNumber
                    v-model="formData.referenceCost"
                    placeholder="请输入"
                    :min="0"
                    :precision="4"
                    :controls="false"
                    style="flex: 1"
                  />
                  <MkSelect
                    v-model="formData.currency"
                    placeholder="币种"
                    :options="currencyOptions"
                    :label-value="{ name: 'label', value: 'value' }"
                    filterable
                    clearable
                    :always-filter-input="true"
                    style="width: 68px; min-width: 68px"
                  />
                </div>
              </ElFormItem>
            </ElCol>

            <ElCol :span="8">
              <ElFormItem label="采购负责人:">
                <MkSelect
                  v-model="formData.purchaseUserList"
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

            <ElCol :span="24">
              <ElFormItem label="采购备注:">
                <ElInput
                  v-model="formData.purchaseRemark"
                  type="textarea"
                  :rows="3"
                  placeholder="请输入采购备注"
                  maxlength="500"
                  show-word-limit
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
        </ElForm>
      </div>
    </div>

    <!-- 供应商报价：标题固定，仅内容区横向滚动 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">供应商报价</span>
        <ElButton
          type="primary"
          link
          :icon="Plus"
          @click="handleAddSupplier"
          style="margin-left: auto"
        >
          添加供应商
        </ElButton>
      </div>

      <div class="section-content section-scroll">
        <div class="supplier-table-wrapper">
          <ElTable :data="formData.supplierQuotes" border stripe style="width: 100%">
            <ElTableColumn type="index" label="序号" width="60" align="center" />
            <ElTableColumn label="供应商名称" min-width="180" prop="supplierName">
              <template #default="{ row, $index }">
                <MkSelect
                  v-model="row.supplierId"
                  placeholder="请选择"
                  :options="getSupplierOptionsForRow($index)"
                  :label-value="{ name: 'label', value: 'value' }"
                  filterable
                  clearable
                  :always-filter-input="true"
                  style="width: 100%"
                  @change="(val: string | number) => handleSupplierChange(val, $index)"
                />
              </template>
            </ElTableColumn>
            <ElTableColumn label="供应商编码" min-width="100" prop="supplierCode">
              <template #default="{ row }">
                <span>{{ row.supplierCode || getSupplierCode(row.supplierId) || '-' }}</span>
              </template>
            </ElTableColumn>
            <ElTableColumn label="是否含税" width="120" align="center">
              <template #default="{ row }">
                <ElSwitch v-model="row.isTax" @change="handleIsTaxChange(row)" />
              </template>
            </ElTableColumn>
            <ElTableColumn label="税率" width="130">
              <template #default="{ row }">
                <ElInputNumber
                  v-model="row.taxRate"
                  placeholder="请输入"
                  :min="0"
                  :max="100"
                  :precision="2"
                  :controls="false"
                  style="width: 100%"
                  :disabled="!row.isTax"
                  @change="handlePriceInput(row)"
                >
                  <template #suffix>%</template>
                </ElInputNumber>
              </template>
            </ElTableColumn>
            <ElTableColumn label="不含税单价" width="220">
              <template #default="{ row }">
                <div class="price-input-group">
                  <ElInputNumber
                    v-model="row.unitPrice"
                    placeholder="请输入"
                    :min="0"
                    :precision="4"
                    :controls="false"
                    style="flex: 1"
                    @change="handlePriceInput(row)"
                  />
                  <MkSelect
                    v-model="row.currency"
                    placeholder="币种"
                    :options="currencyOptions"
                    :label-value="{ name: 'label', value: 'value' }"
                    filterable
                    clearable
                    :always-filter-input="true"
                    style="width: 68px; min-width: 68px; margin-left: 4px"
                  />
                </div>
              </template>
            </ElTableColumn>
            <!-- 增加一个含税单价-taxInclusivePrice ， 公式: 含税单价 = 不含税单价 * (1 + 税率) -->
            <ElTableColumn label="含税单价" width="220">
              <template #default="{ row }">
                <div class="price-input-group">
                  <ElInputNumber
                    v-model="row.taxInclusivePrice"
                    placeholder="请输入"
                    :min="0"
                    :precision="4"
                    :controls="false"
                    style="flex: 1"
                    disabled
                  />
                  <MkSelect
                    v-model="row.currency"
                    placeholder="币种"
                    :options="currencyOptions"
                    :label-value="{ name: 'label', value: 'value' }"
                    filterable
                    clearable
                    disabled
                    :always-filter-input="true"
                    style="width: 68px; min-width: 68px"
                  />
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="交期" width="160">
              <template #default="{ row, $index }">
                <div class="delivery-input-group">
                  <ElInputNumber
                    v-model="row.deliveryDays"
                    placeholder="请输入"
                    :min="0"
                    :max="999999999"
                    :precision="0"
                    :controls="false"
                    style="width: 120px; min-width: 120px"
                    @input="handleDeliveryDaysInput(row.deliveryDays, $index)"
                  />
                  <span style="margin-left: 4px">天</span>
                </div>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="80" align="center" fixed="right">
              <template #default="{ $index }">
                <ElButton type="danger" link :icon="Delete" @click="handleDeleteSupplier($index)">
                  移除
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, onMounted } from 'vue'
  import {
    ElForm,
    ElFormItem,
    ElInput,
    ElInputNumber,
    ElButton,
    ElTable,
    ElTableColumn,
    ElSwitch,
    ElRow,
    ElCol,
    ElMessage,
    type FormInstance,
    type FormRules
  } from 'element-plus'
  import { Plus, Delete } from '@element-plus/icons-vue'
  import MkSelect from '@/components/core/others/mk-select/index.vue'
  import { fetchAllSupplierList } from '@/api/supplier'
  import { getEnabledCurrencyList } from '@/api/basic/currency'

  interface SupplierQuote {
    supplierId: string | number
    supplierName: string
    supplierCode: string
    isTax: boolean
    taxRate: number | null
    unitPrice: number | null
    currency: string
    deliveryDays: number | null
  }

  interface Props {
    modelValue: any
    userOptions?: any[]
  }

  interface Emits {
    (e: 'update:modelValue', value: any): void
  }

  const props = withDefaults(defineProps<Props>(), {
    userOptions: () => []
  })

  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()

  // 表单数据
  const formData = reactive({
    currency: 'CNY',
    referenceCost: null,
    referenceDeliveryDays: null,
    purchaseRemark: '',
    purchaseUserList: [],
    supplierQuotes: [] as SupplierQuote[]
  })

  // 供应商选项
  const supplierOptions = ref([])
  // 币种选项（来自已启用币种接口）
  const currencyOptions = ref<{ label: string; value: string }[]>([])

  const getSupplierCode = (supplierId: string | number | null | undefined) => {
    if (supplierId == null) return undefined
    return supplierOptions.value.find((s) => s.id == supplierId || s.value == supplierId)?.code
  }

  /** 同一 SKU 不能重复选择同一供应商：返回当前行可选的供应商列表（排除已被其他行选中的，当前行已选保留以便回显） */
  const getSupplierOptionsForRow = (rowIndex: number) => {
    const list = formData.supplierQuotes as any[]
    const usedByOthers = list
      .map((row, idx) => (idx !== rowIndex ? row.supplierId : null))
      .filter((id) => id != null && id !== '')
    const currentRowSupplierId = (list[rowIndex] as any)?.supplierId
    if (usedByOthers.length === 0) return supplierOptions.value
    return supplierOptions.value.filter((opt: any) => {
      const id = opt.value ?? opt.id
      const usedByOther = usedByOthers.some((u) => u == id)
      const isCurrentRowSelection =
        currentRowSupplierId != null &&
        (currentRowSupplierId == id || String(currentRowSupplierId) === String(id))
      return !usedByOther || isCurrentRowSelection
    })
  }

  /** 将 isTax / isIncludeTax 统一为 boolean，避免编辑时 ElSwitch 因 0/1 显示为关闭 */
  const normalizeIsTax = (row: any): boolean => {
    const v = row.isTax ?? row.isIncludeTax
    return v === true || v === 1 || v === '1'
  }

  // 表单验证规则
  const rules: FormRules = {
    supplierQuotes: [
      {
        required: true,
        validator: (rule, value, callback) => {
          if (!value || value.length === 0) {
            callback(new Error('请至少添加一个供应商报价'))
          } else {
            callback()
          }
        },
        trigger: 'change'
      },
      {
        validator: (rule, value, callback) => {
          if (!value || !Array.isArray(value)) {
            callback()
            return
          }
          const ids = value
            .map((row: any) => row.supplierId)
            .filter((id: any) => id != null && id !== '')
          const set = new Set(ids.map((id: any) => String(id)))
          if (set.size < ids.length) {
            callback(new Error('同一 SKU 不能重复选择同一供应商，请检查供应商报价列表'))
          } else {
            callback()
          }
        },
        trigger: 'change'
      }
    ]
  }

  // 添加供应商
  const handleAddSupplier = () => {
    formData.supplierQuotes.push({
      supplierId: '',
      supplierName: '',
      supplierCode: '',
      isTax: true,
      taxRate: null,
      unitPrice: null,
      currency: 'CNY',
      deliveryDays: null
    })
  }

  // 删除供应商
  const handleDeleteSupplier = (index: number) => {
    formData.supplierQuotes.splice(index, 1)
    ElMessage.success('移除成功')
  }

  // 供应商选择变化（同一 SKU 不能重复选同一供应商）
  const handleSupplierChange = (supplierId: string | number, index: number) => {
    if (supplierId == null || supplierId === '') {
      const row = formData.supplierQuotes[index] as any
      row.supplierName = ''
      row.supplierCode = ''
      return
    }
    const usedElsewhere = (formData.supplierQuotes as any[]).some(
      (row, idx) =>
        idx !== index &&
        (row.supplierId == supplierId || String(row.supplierId) === String(supplierId))
    )
    if (usedElsewhere) {
      const row = formData.supplierQuotes[index] as any
      row.supplierId = ''
      row.supplierName = ''
      row.supplierCode = ''
      ElMessage.warning('同一 SKU 不能重复选择同一供应商')
      return
    }
    const supplier = supplierOptions.value.find(
      (s: any) => s.value == supplierId || s.id == supplierId
    )
    if (supplier) {
      // formData.supplierQuotes[index].supplierName = supplier.label
      formData.supplierQuotes[index].supplierName = ''
      formData.supplierQuotes[index].supplierCode = supplier.code
    }
  }

  // 限制交期输入为最多9位数字
  const handleDeliveryDaysInput = (value: number | null, index: number) => {
    if (value !== null && value !== undefined) {
      const valueStr = String(value)
      if (valueStr.length > 9) {
        // 截取前9位
        formData.supplierQuotes[index].deliveryDays = Number(valueStr.slice(0, 9))
      }
    }
  }

  const loadCurrencyOptions = async () => {
    try {
      const currencyList = await getEnabledCurrencyList()
      currencyOptions.value = (currencyList ?? [])
        .map((item: any) => ({
          label: item.currencyCode || '',
          value: item.currencyCode || ''
        }))
        .filter((opt: { value: string }) => opt.value)
    } catch (_) {
      console.log(_)
      currencyOptions.value = []
    }
  }

  onMounted(async () => {
    const [supplierRes, currencyList] = await Promise.all([
      fetchAllSupplierList({ pageSize: 1000 }),
      getEnabledCurrencyList()
    ])
    const supplierList = supplierRes.data?.dtoList ?? []
    supplierOptions.value = supplierList.map((supplier: any) => ({
      id: supplier.id,
      label: `${supplier.supplierFullName} (${supplier.supplierCode})`,
      value: supplier.id,
      code: supplier.supplierCode
    }))
    // 供应商列表加载完成后，为已有报价行补全 supplierCode（解决暂存回显时接口未返回编码导致列为空）
    formData.supplierQuotes?.forEach((row: any) => {
      if (!row.supplierCode && row.supplierId != null) {
        const code = getSupplierCode(row.supplierId)
        if (code) row.supplierCode = code
      }
    })
    currencyOptions.value = (currencyList ?? [])
      .map((item: any) => ({
        label: item.currencyCode || '',
        value: item.currencyCode || ''
      }))
      .filter((opt: { value: string }) => opt.value)
  })
  // 实时监听不含税单价或税率变化，计算含税单价
  const handlePriceInput = (row: any) => {
    row.taxInclusivePrice =
      row.unitPrice != null ? row.unitPrice * (1 + (row.taxRate || 0) / 100) + 1e-12 : null
  }

  const handleIsTaxChange = (row: any) => {
    row.taxRate = row.isTax ? row.taxRate : null
    handlePriceInput(row)
  }
  // 监听表单数据变化
  watch(
    () => formData,
    (newVal) => {
      emit('update:modelValue', newVal)
    },
    { deep: true }
  )

  // 监听外部数据变化
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal && Object.keys(newVal).length > 0) {
        // 有数据时，合并到 formData
        Object.assign(formData, newVal)
        // 确保 supplierQuotes 是数组
        if (!formData.supplierQuotes || !Array.isArray(formData.supplierQuotes)) {
          formData.supplierQuotes = []
        } else {
          // 归一化每行的 isTax 为 boolean，避免 API 返回 isIncludeTax:1 时编辑态 ElSwitch 显示为关闭
          formData.supplierQuotes.forEach((row: any) => {
            row.isTax = normalizeIsTax(row)
            // 暂存回显时若接口未返回 supplierCode，则从供应商选项中补全，避免供应商编码列为空
            if (!row.supplierCode && row.supplierId != null) {
              const code = getSupplierCode(row.supplierId)
              if (code) row.supplierCode = code
            }
          })
        }
      } else {
        // 空对象或 undefined 时，重置为初始值
        formData.currency = 'CNY'
        formData.referenceCost = null
        formData.referenceDeliveryDays = null
        formData.purchaseRemark = ''
        formData.purchaseUserList = []
        formData.supplierQuotes = []
      }
    },
    { immediate: true, deep: true }
  )

  // 暴露验证方法
  const validate = () => {
    return formRef.value?.validate()
  }

  defineExpose({
    validate,
    formData,
    /** 弹窗打开时由父组件调用，重新拉取币种列表以感知其他功能的变更 */
    refreshCurrency: loadCurrencyOptions
  })
</script>

<style lang="scss" scoped>
  .purchase-info {
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
          min-width: 1200px !important;
          padding-right: 80px !important;

          .el-col {
            padding: 0 20px;
          }
        }
      }

      .input-with-select {
        display: flex;
        align-items: center;
        width: 100%;
      }

      .supplier-table-wrapper {
        :deep(.el-table) {
          .el-input-number {
            width: 100%;

            .el-input__wrapper {
              padding: 1px 11px;
            }
          }

          .price-input-group {
            display: flex;
            align-items: center;
          }

          .delivery-input-group {
            display: flex;
            align-items: center;
          }
        }
      }
    }
  }

  // Supplier dropdown option styling
  .supplier-option {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    width: 400px;

    .supplier-name,
    .supplier-code {
      overflow: hidden;
      font-size: 14px;
      color: var(--el-text-color-primary);
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .supplier-code {
      text-align: left;
    }
  }
</style>
