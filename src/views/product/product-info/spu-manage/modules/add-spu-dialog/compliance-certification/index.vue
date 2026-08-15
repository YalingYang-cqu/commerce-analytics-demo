<template>
  <div class="compliance-certification">
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">合规认证</span>
      </div>
      <ElForm ref="formRef" :model="formData" :rules="formRules">
        <ElFormItem prop="certifications" :rules="certificationsRule">
          <ElTable :data="formData.certifications" border class="comp-table">
            <ElTableColumn prop="index" label="序号" width="80" align="center">
              <template #default="{ $index }">
                {{ $index + 1 }}
              </template>
            </ElTableColumn>
            <ElTableColumn prop="certificationType" label="认证类型" min-width="150">
              <template #default="{ row, $index }">
                <ElFormItem
                  class="table-form-item"
                  :prop="`certifications[${$index}].certificationType`"
                  :rules="certificationTypeRule"
                  style="margin-bottom: 0"
                >
                  <ElInput v-model="row.certificationType" placeholder="请输入" clearable />
                </ElFormItem>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="certificationAgency" label="认证机构" min-width="150">
              <template #default="{ row, $index }">
                <ElFormItem
                  class="table-form-item"
                  :prop="`certifications[${$index}].certificationAgency`"
                  :rules="certificationAgencyRule"
                >
                  <ElInput v-model="row.certificationAgency" placeholder="请输入" clearable />
                </ElFormItem>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="country" label="国家" min-width="145">
              <template #default="{ row, $index }">
                <ElFormItem
                  :prop="`certifications[${$index}].country`"
                  :rules="countryRule"
                  class="table-form-item"
                >
                  <MkSelect
                    v-model="row.country"
                    multiple
                    :options="countryOptions"
                    :label-value="{ name: 'label', value: 'value' }"
                    placeholder="请选择"
                    :filterable="true"
                    :alwaysFilterInput="true"
                    clearable
                  />
                </ElFormItem>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="applicantCompany" label="申请公司" min-width="150">
              <template #default="{ row, $index }">
                <ElFormItem
                  :prop="`certifications[${$index}].applicantCompany`"
                  :rules="applicantCompanyRule"
                  class="table-form-item"
                >
                  <ElInput v-model="row.applicantCompany" placeholder="请输入" clearable />
                </ElFormItem>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="testDate" label="测试时间" min-width="150">
              <template #default="{ row, $index }">
                <ElFormItem :prop="`certifications[${$index}].testDate`" class="table-form-item">
                  <ElDatePicker
                    v-model="row.testDate"
                    type="date"
                    placeholder="选择日期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </ElFormItem>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="issueDate" label="发布时间" min-width="150">
              <template #default="{ row, $index }">
                <ElFormItem :prop="`certifications[${$index}].issueDate`" class="table-form-item">
                  <ElDatePicker
                    v-model="row.issueDate"
                    type="date"
                    placeholder="选择日期"
                    format="YYYY-MM-DD"
                    value-format="YYYY-MM-DD"
                    style="width: 100%"
                  />
                </ElFormItem>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="certificateNumber" label="证书编号" min-width="150">
              <template #default="{ row, $index }">
                <ElFormItem
                  :prop="`certifications[${$index}].certificateNumber`"
                  :rules="certificateNumberRule"
                  class="table-form-item"
                >
                  <ElInput v-model="row.certificateNumber" placeholder="请输入" clearable />
                </ElFormItem>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="attachment" label="附件" min-width="120">
              <template #default="{ row, $index }">
                <ElFormItem label=" " :prop="`certifications[${$index}].attachment`">
                  <FileUpload v-model="row.attachment" :maxCount="30" :multiple="true" />
                </ElFormItem>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="100" align="center">
              <template #default="{ $index }">
                <ElButton type="danger" link size="small" @click="removeCertification($index)">
                  移除
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElFormItem>
      </ElForm>
      <div class="add-btn-wrapper">
        <span class="add-btn" @click="addCertification"> + </span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive, watch, ref, onMounted, computed } from 'vue'
  import {
    ElTable,
    ElTableColumn,
    ElButton,
    ElInput,
    ElDatePicker,
    ElForm,
    ElFormItem,
    type FormInstance,
    type FormRules
  } from 'element-plus'
  import MkSelect from '@/components/core/others/mk-select/index.vue'
  import FileUpload from '@/components/core/upload-custom/index.vue'
  import { pubCountryList } from '@/utils'
  import { normalizeComplianceCountryToCodes } from '@/utils/compliance-country'

  interface Props {
    modelValue: any
  }

  interface Emits {
    (e: 'update:modelValue', value: any): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()

  /** 防止 props → assign(formData) → emit → props 形成死循环导致页面卡死 */
  const isSyncingFromParent = ref(false)

  const formData = reactive({
    certifications: [
      {
        certificationType: '',
        certificationAgency: '',
        country: [] as string[],
        applicantCompany: '',
        testDate: '',
        issueDate: '',
        certificateNumber: '',
        attachment: []
      }
    ]
  })
  const countryList: any = ref([])
  const countryOptions = computed(() =>
    (countryList.value || []).map((item: any) => ({
      label: item.name || item.label || '',
      value: item.value ?? item.name ?? item.label ?? ''
    }))
  )
  // 获取国家
  const getAllCountry = async () => {
    countryList.value = await pubCountryList()
  }

  // 认证类型校验规则
  const certificationTypeRule = [{ max: 50, message: '最多只能输入50个字符', trigger: 'blur' }]

  // 认证机构校验规则
  const certificationAgencyRule = [{ max: 50, message: '最多只能输入50个字符', trigger: 'blur' }]

  // 国家校验规则（可选字段，无需校验）
  const countryRule: any[] = []

  // 申请公司校验规则
  const applicantCompanyRule = [{ max: 50, message: '最多只能输入50个字符', trigger: 'blur' }]

  // 证书编号校验规则
  const certificateNumberRule = [{ max: 50, message: '最多只能输入50个字符', trigger: 'blur' }]

  // 认证数组整体校验规则
  const certificationsRule = [
    {
      validator: (_, value, callback) => {
        if (!value || value.length === 0) {
          callback()
          return
        }
        callback()
      },
      trigger: 'change'
    }
  ]

  // 表单验证规则
  const formRules = reactive<FormRules>({
    certifications: certificationsRule
  })

  // 添加认证
  const addCertification = () => {
    formData.certifications.push({
      certificationType: '',
      certificationAgency: '',
      country: [],
      applicantCompany: '',
      testDate: '',
      issueDate: '',
      certificateNumber: '',
      attachment: []
    })
  }

  // 移除认证
  const removeCertification = (index: number) => {
    if (formData.certifications.length > 0) {
      formData.certifications.splice(index, 1)
    }
  }

  // 验证表单
  const validate = async () => {
    if (!formRef.value) {
      return true
    }
    try {
      await formRef.value.validate()
      return true
    } catch {
      return false
    }
  }

  // 清除验证
  const clearValidate = () => {
    formRef.value?.clearValidate()
  }

  /** 必须 emit 快照，不能与本地 reactive 共用引用；否则 props.modelValue 与子组件 formData 为同一对象，deep watch 会在每次 push/输入时触发无限递归 */
  const cloneComplianceForEmit = () => JSON.parse(JSON.stringify(formData))

  // 监听本地编辑结果同步到父组件（不在「从父回填」过程中 emit）
  watch(
    formData,
    () => {
      if (isSyncingFromParent.value) return
      emit('update:modelValue', cloneComplianceForEmit())
    },
    { deep: true }
  )

  // 仅在父级替换 compliance 引用时同步（不深监听 props，避免与本地 formData 别名时递归）
  watch(
    () => props.modelValue,
    (newVal) => {
      if (!newVal) return
      isSyncingFromParent.value = true
      const normalized = {
        ...newVal,
        certifications: (newVal.certifications || []).map((row: any) => ({
          ...row,
          country: normalizeComplianceCountryToCodes(row.country)
        }))
      }
      Object.assign(formData, normalized)
      setTimeout(() => {
        isSyncingFromParent.value = false
      }, 0)
    },
    { immediate: true }
  )

  // 初始化国家列表
  onMounted(() => {
    getAllCountry()
  })

  // 监听国家列表变化
  // watch(
  //   () => dropListStore.countryList,
  //   (newVal) => {
  //     if (newVal && newVal.length > 0) {
  //       countryList.value = newVal
  //     }
  //   },
  //   { deep: true }
  // )

  defineExpose({
    validate,
    clearValidate
  })
</script>

<style lang="scss" scoped>
  .compliance-certification {
    margin-top: 8px;

    .comp-table {
      :deep(.el-table__body-wrapper) {
        .el-table__row {
          .el-table__cell {
            padding: 8px 0;
            vertical-align: top;
          }
        }
      }
    }

    .table-form-item {
      margin-bottom: 0;

      :deep(.el-form-item__error) {
        position: static;
        padding-top: 4px;
        font-size: 12px;
        line-height: 1.2;
        color: var(--el-color-error);
      }

      :deep(.el-form-item__content) {
        margin-left: 0 !important;
      }

      :deep(.el-input__wrapper) {
        &.is-error {
          box-shadow: 0 0 0 1px var(--el-color-error) inset;
        }
      }
    }

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

    .add-btn-wrapper {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding: 4px 8px;
      border: 1px solid #ebeef5;
      border-top-width: 0;

      .add-btn {
        padding: 4px 8px;
        color: #5d87ff;
        cursor: pointer;
        border: 1px solid #5d87ff;
        border-radius: 2px;
      }
    }
  }
</style>
