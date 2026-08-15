<template>
  <ElDialog
    v-model="dialogVisible"
    title="设置负责人"
    width="500px"
    align-center
    @close="handleClose"
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="110px">
      <!-- SKU显示 -->
      <div class="sku-section">
        <div class="sku-label">为以下{{ selectedItems.length }}个SKU设置负责人:</div>
        <div class="sku-tags">
          <ElTag
            v-for="item in selectedItems"
            :key="item.id"
            closable
            @close="handleRemoveItem(item.id)"
          >
            {{ item.sku }}
          </ElTag>
        </div>
      </div>

      <!-- 更新方式 -->
      <ElFormItem label="更新方式:" prop="updateType">
        <ElRadioGroup v-model="formData.updateType">
          <ElRadio label="覆盖" :value="0">覆盖</ElRadio>
          <ElRadio label="新增" :value="1">新增</ElRadio>
        </ElRadioGroup>
      </ElFormItem>

      <!-- 负责人类型 -->
      <ElFormItem label="负责人类型:" prop="responsiblePersonType">
        <ElSelect v-model="formData.responsiblePersonType" placeholder="请选择" clearable>
          <ElOption
            v-for="type in responsiblePersonTypeOptions"
            :key="type.value"
            :label="type.label"
            :value="type.value"
          />
        </ElSelect>
      </ElFormItem>

      <!-- 负责人 -->
      <ElFormItem label="负责人:" prop="responsiblePersonUserIds">
        <ElSelect
          v-model="formData.responsiblePersonUserIds"
          placeholder="请选择"
          clearable
          filterable
          multiple
          collapse-tags
          collapse-tags-tooltip
        >
          <ElOption
            v-for="user in userAll"
            :key="user.value"
            :label="user.label"
            :value="user.value"
          />
        </ElSelect>
      </ElFormItem>
    </ElForm>

    <template #footer>
      <div class="dialog-footer">
        <ElButton @click="handleClose">取消</ElButton>
        <ElButton type="primary" :loading="loading" @click="handleSubmit">确定</ElButton>
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
  import { batchSetSkuResponsible } from '@/api/product/sku'
  import type { SkuItem } from '@/types/api/sku'
  // import { useDictStore } from '@/store/modules/dict'
  // const { dictData } = useDictStore()
  const basicData: any = inject('basicData')
  const userAll = ref(basicData.userAll)

  interface Props {
    visible: boolean
    selectedItems?: SkuItem[]
  }

  interface Emits {
    (e: 'update:visible', visible: boolean): void
    (e: 'submit', data: any): void
  }

  const loading = ref(false)

  const props = withDefaults(defineProps<Props>(), {
    selectedItems: () => []
  })

  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })

  const formRef = ref<FormInstance>()

  interface FormData {
    updateType: number
    responsiblePersonType: string
    responsiblePersonUserIds: (string | number)[]
  }

  const formData = reactive<FormData>({
    updateType: 0,
    responsiblePersonType: '',
    responsiblePersonUserIds: []
  })

  // 负责人类型选项
  const responsiblePersonTypeOptions = [
    { label: '开发人', value: 0 },
    { label: '产品负责人', value: 1 },
    { label: '采购负责人', value: 2 },
    { label: '物流负责人', value: 3 },
    { label: '财务负责人', value: 4 }
  ]

  // 用户选项（模拟数据，实际应从props或API获取）
  // const userOptions = ref([
  //   { label: '李云', value: 1 },
  //   { label: '张三', value: 2 },
  //   { label: '李四', value: 3 }
  // ])

  // 表单验证规则
  const rules: FormRules<FormData> = {
    updateType: [{ required: true, message: '请选择更新方式', trigger: 'change' }],
    responsiblePersonType: [{ required: true, message: '请选择负责人类型', trigger: 'change' }],
    responsiblePersonUserIds: [{ required: true, message: '请选择负责人', trigger: 'change' }]
  }

  // 移除SKU
  const handleRemoveItem = (id: string | number) => {
    // 这里可以触发事件通知父组件移除SKU
    console.log('移除SKU', id)
  }

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return
    loading.value = true
    try {
      await formRef.value.validate()

      const ids = props.selectedItems.map((item) => item.id!)
      const params = {
        ids,
        updateType: formData.updateType,
        responsiblePersonType: formData.responsiblePersonType,
        responsiblePersonUserIds: formData.responsiblePersonUserIds
      }

      // 调用API
      await batchSetSkuResponsible(params)

      emit('submit', params)
      handleClose()
    } catch (error) {
      console.log('表单验证失败', error)
    } finally {
      loading.value = false
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
        responsiblePersonUserIds: []
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
      max-height: 150px;
      padding: 8px;
      overflow-y: auto;
      background-color: var(--el-fill-color-lighter);
      border-radius: 4px;
    }
  }

  .dialog-footer {
    display: flex;
    gap: 12px;
    justify-content: flex-end;
  }
</style>
