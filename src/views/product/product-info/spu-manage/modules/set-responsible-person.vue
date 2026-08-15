<template>
  <ElDialog
    v-model="dialogVisible"
    title="设置负责人"
    width="450px"
    align-center
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <!-- SKU显示 -->
      <div class="sku-section">
        <div class="sku-label">为以下{{ selectedRows.length }}个SPU设置负责人:</div>
        <div class="sku-tags">
          <ElTag v-for="item in selectedRows" :key="item.id">
            {{ item.spu }}
          </ElTag>
        </div>
      </div>

      <!-- 更新方式 -->
      <ElFormItem label="更新方式:" prop="updateType">
        <ElRadioGroup v-model="formData.updateType">
          <ElRadio :label="0">覆盖</ElRadio>
          <ElRadio :label="1">新增</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <!-- 负责人类型 -->
      <ElFormItem label="负责人类型:" prop="responsiblePersonType">
        <ElSelect v-model="formData.responsiblePersonType" placeholder="请选择" clearable>
          <ElOption
            v-for="user in dictData['responsiblePersonType']?.filter(
              (v: any) => !['2', '3'].includes(v.value)
            )"
            :key="user.value"
            :label="user.label === '产品开发人' ? '开发人' : user.label"
            :value="user.value"
          />
        </ElSelect>
      </ElFormItem>

      <!-- 负责人 -->
      <ElFormItem label="负责人:" prop="responsiblePersonUserIds">
        <MkSelect
          v-model="formData.responsiblePersonUserIds"
          :options="userAll"
          :label-value="{ name: 'label', value: 'value' }"
          placeholder="请选择"
          :filterable="true"
          :alwaysFilterInput="true"
          :multiple="true"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" @click="handleSubmit">确定</ElButton>
      </div>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, computed, reactive, watch, nextTick } from 'vue'
  import {
    ElDialog,
    ElForm,
    ElFormItem,
    ElSelect,
    ElOption,
    ElRadioGroup,
    ElRadio,
    ElButton,
    ElTag,
    type FormInstance,
    type FormRules
  } from 'element-plus'
  import { useDictStore } from '@/store/modules/dict'

  interface Props {
    visible: boolean
    selectedRows?: any[]
  }

  interface Emits {
    (e: 'update:visible', visible: boolean): void
    (e: 'submit', data: any): void
  }

  const props = withDefaults(defineProps<Props>(), {
    selectedRows: () => []
  })
  const { dictData } = useDictStore()
  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const formRef = ref<FormInstance>()
  const basicData: any = inject('basicData')
  const userAll = ref(basicData.userAll)
  console.log(userAll, 'userAlluserAll')
  interface FormData {
    updateType: number
    responsiblePersonType: string
    responsiblePersonUserIds: string
  }

  const formData = reactive<FormData>({
    updateType: 0,
    responsiblePersonType: '',
    responsiblePersonUserIds: ''
  })

  // 表单验证规则
  const rules: FormRules<FormData> = {
    updateType: [{ required: true, message: '请选择更新方式', trigger: 'change' }],
    responsiblePersonType: [{ required: true, message: '请选择负责人类型', trigger: 'change' }],
    responsiblePersonUserIds: [{ required: true, message: '请选择负责人', trigger: 'change' }]
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      await formRef.value.validate()
      emit('submit', {
        ids: props.selectedRows?.map((v: any) => v.id),
        updateType: formData.updateType,
        responsiblePersonType: formData.responsiblePersonType,
        responsiblePersonUserIds: formData.responsiblePersonUserIds
      })
    } catch (error) {
      console.log('表单验证失败', error)
    }
  }

  // 关闭弹窗
  const handleClose = () => {
    dialogVisible.value = false
    // 重置表单
    nextTick(() => {
      formRef.value?.resetFields()
      Object.assign(formData, {
        updateType: 0,
        responsiblePersonType: '',
        responsiblePersonUserIds: ''
      })
    })
  }
  // 监听 userIds 变化，实时清除校验错误
  watch(
    () => formData.responsiblePersonUserIds,
    () => {
      if (formRef.value) {
        formRef.value.clearValidate('responsiblePersonUserIds')
      }
    }
  )
  // 监听弹窗显示状态
  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        nextTick(() => {
          formRef.value?.clearValidate()
        })
      }
    }
  )
</script>

<style lang="scss" scoped>
  .sku-section {
    margin-bottom: 20px;

    .sku-label {
      margin-bottom: 12px;
      font-size: 14px;
      color: var(--el-text-color-regular);
    }

    .sku-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
