<template>
  <div class="financial-info">
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">财务信息</span>
      </div>
      <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
        <ElRow :gutter="20">
          <ElCol :span="6">
            <ElFormItem label="采购主体:" prop="purchaseOrganizationId">
              <ElSelect
                v-model="formData.purchaseOrganizationId"
                placeholder="请输入"
                filterable
                clearable
                @change="handlePurchaseOrganizationChange"
              >
                <ElOption
                  :label="item.name"
                  :value="item.id"
                  v-for="item in companyAll?.filter((v: any) => v.companyType.includes(1))"
                  :key="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="报关主体:" prop="customsOrganizationId">
              <ElSelect
                v-model="formData.customsOrganizationId"
                placeholder="请输入"
                filterable
                clearable
                @change="handleCustomsOrganizationChange"
              >
                <ElOption
                  :label="item.name"
                  :value="item.id"
                  v-for="item in companyAll?.filter((v: any) => v.companyType.includes(2))"
                  :key="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="境外收货人:" prop="saleOrganizationId">
              <ElSelect
                v-model="formData.saleOrganizationId"
                placeholder="请输入"
                filterable
                clearable
                @change="handleSaleOrganizationChange"
              >
                <ElOption
                  :label="item.name"
                  :value="item.id"
                  v-for="item in companyAll?.filter((v: any) => v.companyType.includes(3))"
                  :key="item.id"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="财务负责人:" prop="financeUserIds">
              <MkSelect
                v-model="formData.financeUserIds"
                :options="userAll"
                :label-value="{ name: 'label', value: 'value' }"
                placeholder="请选择"
                :filterable="true"
                :alwaysFilterInput="true"
                :multiple="true"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, inject } from 'vue'
  import {
    ElForm,
    ElFormItem,
    ElSelect,
    ElOption,
    ElRow,
    ElCol,
    type FormInstance,
    type FormRules
  } from 'element-plus'

  interface Props {
    modelValue: any
  }

  interface Emits {
    (e: 'update:modelValue', value: any): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()

  const formData = reactive({
    purchaseOrganizationId: '',
    purchaseOrganizationName: '',
    customsOrganizationId: '',
    customsOrganizationName: '',
    saleOrganizationId: '',
    saleOrganizationName: '',
    financeUserIds: ''
  })
  const rules: FormRules = {
    // purchaseOrganizationId: [{ required: true, message: '请选择采购主体', trigger: 'change' }],
    // customsOrganizationId: [{ required: true, message: '请选择报关主体', trigger: 'change' }],
    // saleOrganizationId: [{ required: true, message: '请选择境外收货人', trigger: 'change' }],
    // financeUserIds: [{ required: true, message: '请选择财务负责人', trigger: 'change' }]
  }
  const basicData: any = inject('basicData')
  const userAll = ref(basicData.userAll)
  const companyAll = ref(basicData.companyAll)

  // 处理采购主体变化
  const handlePurchaseOrganizationChange = (value: string) => {
    if (value) {
      const selectedItem = companyAll.value.find((item: any) => item.id === value)
      formData.purchaseOrganizationName = selectedItem?.name || ''
    } else {
      formData.purchaseOrganizationName = ''
    }
  }

  // 处理报关主体变化
  const handleCustomsOrganizationChange = (value: string) => {
    if (value) {
      const selectedItem = companyAll.value.find((item: any) => item.id === value)
      formData.customsOrganizationName = selectedItem?.name || ''
    } else {
      formData.customsOrganizationName = ''
    }
  }

  // 处理境外收货人变化
  const handleSaleOrganizationChange = (value: string) => {
    if (value) {
      const selectedItem = companyAll.value.find((item: any) => item.id === value)
      formData.saleOrganizationName = selectedItem?.name || ''
    } else {
      formData.saleOrganizationName = ''
    }
  }

  // 验证表单

  const validate = async () => {
    if (!formRef.value) return true
    try {
      await formRef.value.validate()
      return true
    } catch (error) {
      console.error('财务信息验证失败:', error)
      return false
    }
  }

  // 清除验证
  const clearValidate = () => {
    formRef.value?.clearValidate()
  }

  // 监听数据变化
  watch(
    formData,
    (newVal) => {
      emit('update:modelValue', newVal)
    },
    { deep: true }
  )

  // 监听外部数据变化
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        Object.assign(formData, newVal)
        // 如果外部数据只有 id 没有 name，根据 id 查找对应的 name
        if (formData.purchaseOrganizationId && !formData.purchaseOrganizationName) {
          const item = companyAll.value.find(
            (item: any) => item.id === formData.purchaseOrganizationId
          )
          if (item) {
            formData.purchaseOrganizationName = item.name
          }
        }
        if (formData.customsOrganizationId && !formData.customsOrganizationName) {
          const item = companyAll.value.find(
            (item: any) => item.id === formData.customsOrganizationId
          )
          if (item) {
            formData.customsOrganizationName = item.name
          }
        }
        if (formData.saleOrganizationId && !formData.saleOrganizationName) {
          const item = companyAll.value.find((item: any) => item.id === formData.saleOrganizationId)
          if (item) {
            formData.saleOrganizationName = item.name
          }
        }
      }
    },
    { deep: true, immediate: true }
  )

  defineExpose({
    validate,
    clearValidate
  })
</script>

<style lang="scss" scoped>
  .financial-info {
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
    }
  }
</style>
