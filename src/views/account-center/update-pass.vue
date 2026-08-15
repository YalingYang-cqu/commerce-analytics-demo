<template>
  <div class="account-box">
    <ElForm ref="formRef" :model="formData" :rules="rules" class="account-form" label-width="120px">
      <div>
        <h4 class="account-subTitle">修改密码</h4>
        <div class="account-tip"
          >安全性高的密码可以使账号更安全，建议您定期更换，设置一个包含字母，符号或数组中至少两项，且长度在6-20位的密码。</div
        >
      </div>
      <ElFormItem label="原密码" prop="oldPassword" v-if="isPeople">
        <ElInput
          v-model.trim="formData.oldPassword"
          type="password"
          show-password
          autocomplete="off"
          placeholder="请输入原密码"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="新密码" prop="newPassword">
        <ElInput
          v-model.trim="formData.newPassword"
          type="password"
          show-password
          autocomplete="off"
          placeholder="请输入新密码"
          clearable
        />
      </ElFormItem>
      <ElFormItem label="确认密码" prop="confirmPassword">
        <ElInput
          v-model.trim="formData.confirmPassword"
          type="password"
          show-password
          autocomplete="off"
          placeholder="请确认密码"
          clearable
        />
      </ElFormItem>
      <ElFormItem>
        <ElButton type="primary" :loading="loading" @click="handleSubmit">确定</ElButton>
      </ElFormItem>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref, computed } from 'vue'
  import {
    ElForm,
    ElFormItem,
    ElInput,
    ElButton,
    ElMessage,
    type FormInstance,
    type FormRules
  } from 'element-plus'
  import { fetchUpdatePassword } from '@/api/auth'

  defineOptions({
    name: 'UpdatePass'
  })

  interface Props {
    isPeople?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    isPeople: true
  })

  const emit = defineEmits<{
    (e: 'FnSubmitPass', data: { oldPassword: string; newPassword: string }): void
  }>()

  const formRef = ref<FormInstance>()
  const loading = ref(false)

  const formData = reactive({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  })

  // 验证原密码
  const validateOldPassword = (_rule: any, value: string, callback: (error?: Error) => void) => {
    if (value === '') {
      callback(new Error('原密码不能为空'))
    } else if (value.length < 6) {
      callback(new Error('密码不能少于6位数'))
    } else if (value.length > 20) {
      callback(new Error('密码不能超过20位数'))
    } else {
      callback()
    }
  }

  // 验证新密码
  const validateNewPassword = (_rule: any, value: string, callback: (error?: Error) => void) => {
    if (value === '') {
      callback(new Error('新密码不能为空'))
    } else if (value.length < 6) {
      callback(new Error('密码不能少于6位数'))
    } else if (value.length > 20) {
      callback(new Error('密码不能超过20位数'))
    } else if (value === formData.oldPassword) {
      callback(new Error('新密码不能与原密码相同'))
    } else {
      callback()
    }
  }

  // 验证确认密码
  const validateConfirmPassword = (
    _rule: any,
    value: string,
    callback: (error?: Error) => void
  ) => {
    if (value === '') {
      callback(new Error('请再次输入密码'))
    } else if (value.length < 6) {
      callback(new Error('密码不能少于6位数'))
    } else if (value.length > 20) {
      callback(new Error('密码不能超过20位数'))
    } else if (value !== formData.newPassword) {
      callback(new Error('两次输入密码不一致!'))
    } else {
      callback()
    }
  }

  const rules = computed<FormRules>(() => {
    const baseRules: FormRules = {
      newPassword: [
        {
          validator: validateNewPassword,
          trigger: 'blur'
        }
      ],
      confirmPassword: [
        {
          validator: validateConfirmPassword,
          trigger: 'blur'
        }
      ]
    }

    if (props.isPeople) {
      baseRules.oldPassword = [
        {
          validator: validateOldPassword,
          trigger: 'blur'
        }
      ]
    }

    return baseRules
  })

  // 提交表单
  const handleSubmit = async () => {
    if (!formRef.value) return

    try {
      // 表单验证
      const valid = await formRef.value.validate()
      if (!valid) return

      loading.value = true

      const submitData = {
        oldPassword: formData.oldPassword,
        newPassword: formData.newPassword
      }

      // 调用 API 更新密码
      await fetchUpdatePassword(submitData)

      ElMessage.success('密码修改成功！')

      // 重置表单
      formRef.value.resetFields()

      // 触发自定义事件
      emit('FnSubmitPass', submitData)
    } catch (error) {
      console.error('[UpdatePassword] Error:', error)
      // 错误信息已在 HTTP 拦截器中处理
    } finally {
      loading.value = false
    }
  }
</script>

<style lang="scss" scoped>
  .account-box {
    width: 1080px;
    margin: 0 auto;
    background-color: #f5f7fa;

    .account-form {
      width: 400px;
      padding: 60px 0;
      margin: 0 auto;

      .account-subTitle {
        margin-bottom: 8px;
        font-size: 14px;
        font-weight: 600;
      }

      .account-tip {
        margin: 12px 0;
        font-size: 12px;
      }
    }
  }
</style>
