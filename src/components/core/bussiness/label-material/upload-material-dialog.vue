<template>
  <ElDialog
    v-model="dialogVisible"
    title="上传资料"
    width="600px"
    :close-on-click-modal="false"
    @close="handleClose"
    append-to-body
  >
    <ElForm ref="formRef" :model="formData" :rules="rules" label-width="100px">
      <ElFormItem label="标签类型" prop="labelType" required>
        <ElSelect v-model="formData.labelType" placeholder="请选择标签类型" style="width: 100%">
          <ElOption label="FNSKU条码" value="FNSKU条码" />
          <ElOption label="透明计划码" value="透明计划码" />
          <ElOption label="箱唛" value="箱唛" />
          <ElOption label="其他" value="其他" />
        </ElSelect>
      </ElFormItem>

      <ElFormItem label="留言内容" prop="content">
        <ElInput
          v-model="formData.content"
          type="textarea"
          :rows="4"
          placeholder="请输入留言内容"
        />
      </ElFormItem>

      <ElFormItem label="文件" prop="file" required>
        <FileUpload
          v-model="formData.file"
          :max-count="1"
          button-text="上传附件"
          list-type="text"
        />
      </ElFormItem>
    </ElForm>

    <template #footer>
      <ElButton @click="handleClose">取消</ElButton>
      <ElButton type="primary" @click="handleConfirm">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, nextTick } from 'vue'
  import {
    ElDialog,
    ElForm,
    ElFormItem,
    ElSelect,
    ElOption,
    ElInput,
    ElButton,
    ElMessage
  } from 'element-plus'
  import type { FormInstance, FormRules } from 'element-plus'
  import FileUpload from '@/components/core/upload-custom/index.vue'

  interface Props {
    modelValue: boolean
  }

  interface Emits {
    (e: 'update:modelValue', value: boolean): void
    (e: 'confirm', data: { labelType: string; content: string; file: any[] }): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const dialogVisible = ref(false)
  const formRef = ref<FormInstance>()
  /** 弹窗刚打开，此期间不触发表单校验（避免打开即显示“请上传文件”） */
  const isJustOpened = ref(false)

  const formData = reactive({
    labelType: '',
    content: '',
    file: [] as any[]
  })

  const rules: FormRules = {
    labelType: [{ required: true, message: '请选择标签类型', trigger: 'change' }],
    file: [
      {
        required: true,
        validator: (rule, value, callback) => {
          if (!value || value.length === 0) {
            callback(new Error('请上传文件'))
          } else {
            // 检查是否有文件正在上传中
            const uploadingFile = value.find((f: any) => f.status === 'uploading')
            if (uploadingFile) {
              callback(new Error('文件上传中，请稍候...'))
            } else {
              // 检查是否有文件上传失败
              const failedFile = value.find((f: any) => f.status === 'fail')
              if (failedFile) {
                callback(new Error('文件上传失败，请重新上传'))
              } else {
                // 检查文件是否有有效的url（上传完成）
                const validFile = value.find((f: any) => f.url && !f.url.startsWith('blob:'))
                if (!validFile) {
                  callback(new Error('请等待文件上传完成'))
                } else {
                  callback()
                }
              }
            }
          }
        },
        trigger: 'change'
      }
    ]
  }

  // 监听 modelValue 变化
  watch(
    () => props.modelValue,
    (val) => {
      dialogVisible.value = val
      if (val) {
        isJustOpened.value = true
        resetForm()
        nextTick(() => {
          isJustOpened.value = false
        })
      }
    }
  )

  // 监听 dialogVisible 变化，同步到父组件
  watch(dialogVisible, (val) => {
    emit('update:modelValue', val)
  })

  // 上传或移除附件时，触发表单对 file 的校验（弹窗刚打开时不触发）
  watch(
    () => formData.file,
    () => {
      if (isJustOpened.value) return
      nextTick(() => {
        formRef.value?.validateField('file')
      })
    },
    { deep: true }
  )

  // 重置表单
  const resetForm = () => {
    formData.labelType = ''
    formData.content = ''
    formData.file = []
    formRef.value?.clearValidate()
  }

  // 关闭弹窗
  const handleClose = () => {
    dialogVisible.value = false
    resetForm()
  }

  // 确认提交
  const handleConfirm = async () => {
    if (!formRef.value) return

    // 额外检查：确保没有文件正在上传
    const uploadingFile = formData.file.find((f: any) => f.status === 'uploading')
    if (uploadingFile) {
      ElMessage.warning('文件上传中，请稍候...')
      return
    }

    try {
      await formRef.value.validate()

      emit('confirm', {
        labelType: formData.labelType,
        content: formData.content,
        file: formData.file
      })

      handleClose()
      // ElMessage.success('上传成功')
    } catch (error) {
      console.error('表单验证失败:', error)
    }
  }
</script>

<style lang="scss" scoped>
  :deep(.el-form-item__label) {
    &::before {
      content: '';
    }
  }

  :deep(.el-form-item.is-required .el-form-item__label) {
    &::before {
      margin-right: 4px;
      color: #f56c6c;
      content: '*';
    }
  }
</style>
