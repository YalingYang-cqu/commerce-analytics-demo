<template>
  <div class="public-main">
    <div class="account-box">
      <ElForm
        :model="roleForm"
        class="person-form"
        ref="refRoleForm"
        label-width="120px"
        label-position="left"
        style="width: 500px"
      >
        <ElFormItem label="员工头像">
          <SingleCropper
            :autoCropWidth="100"
            :autoCropHeight="100"
            :imgWidth="100"
            :imgHeight="100"
            :isAvater="true"
            :initUrl="roleForm.photo"
            @FnUploadPage="FnUploadHeader"
          >
          </SingleCropper>
        </ElFormItem>

        <ElFormItem label="登录名" prop="account">
          <ElInput v-model="roleForm.account" disabled></ElInput>
        </ElFormItem>

        <ElFormItem label="姓名" prop="userName">
          <ElInput
            v-model="roleForm.userName"
            autocomplete="off"
            placeholder="请输入姓名"
            disabled
          ></ElInput>
        </ElFormItem>

        <ElFormItem label="手机号码" prop="phoneNum">
          <ElInput v-model="roleForm.phoneNum"></ElInput>
        </ElFormItem>

        <!-- <ElFormItem label="汇报对象" prop="superiorName">
          <ElInput v-model="roleForm.superiorName" autocomplete="off" disabled></ElInput>
        </ElFormItem>

        <ElFormItem label="性别：" prop="sex">
          <el-select v-model="roleForm.sex" disabled>
            <el-option label="男" value="男"></el-option>
            <el-option label="女" value="女"></el-option>
          </el-select>
        </ElFormItem> -->

        <ElFormItem label="邮箱" prop="email">
          <ElInput v-model="roleForm.email" disabled></ElInput>
        </ElFormItem>

        <ElFormItem label="部门" prop="deptName">
          <ElInput v-model="roleForm.deptName" disabled></ElInput>
        </ElFormItem>
        <ElFormItem label="岗位" prop="post">
          <ElInput v-model="roleForm.post" autocomplete="off" placeholder="岗位" disabled></ElInput>
        </ElFormItem>

        <ElFormItem>
          <el-button type="primary" @click="postStaffAdd">提交</el-button>
        </ElFormItem>
      </ElForm>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { reactive, ref, onMounted } from 'vue'
  import type { FormInstance } from 'element-plus'
  import { ElMessage } from 'element-plus'
  import { ossUpload, ossUrl } from '@/utils/ali-oss'
  import { updateSelfApi } from '@/api/system-manage'
  import { useUserStore } from '@/store/modules/user'
  // userSelfInfoApi,
  defineOptions({
    name: 'PersonalInfo'
  })
  const userStore = useUserStore()
  const { info: userInfo } = storeToRefs(userStore)
  console.log(userInfo, 'userInfouserInfouserInfouserInfo')
  export interface RoleForm {
    photo: string
    userId: string
    nickName: string
    userName: string
    account: string
    phoneNum: string
    superiorId: string
    superiorName: string
    sex: string
    email: string
    deptId: number
    deptName: string
    roles: string[]
    postIds: number[]
    post: string
    name?: string
    res?: any
  }

  const roleForm = reactive<RoleForm>({
    photo: '',
    userId: '', // 用户id
    nickName: '', // 姓名
    userName: '',
    account: '',
    phoneNum: '', // 手机号码
    superiorId: '', // 上司
    superiorName: '',
    sex: '', // 性别
    email: '', // 邮箱
    deptId: 0, // 部门
    deptName: '',
    roles: [], // 角色
    postIds: [], // 岗位
    post: ''
  })

  const refRoleForm = ref<FormInstance | null>(null)

  //   const store = useStore()

  const actUserHeader = (photoUrl: string) => {
    console.log(photoUrl, 'photoUrlphotoUrlphotoUrl')
    // return store.dispatch('StoreNavSide/actUserHeader', photoUrl)
  }

  const FnGetUserProfile = async (): Promise<void> => {
    // const res = await userSelfInfoApi()
    // if (res && res.code === 200 && res.data) {
    //   // 保留响应式对象，合并后端数据
    //   Object.assign(roleForm, res.data)
    // }
  }

  const postStaffAdd = (): void => {
    if (!refRoleForm.value) return
    refRoleForm.value.validate(async (valid: boolean) => {
      if (!valid) {
        console.log('error submit!!')
        return false
      }
      const formArr = roleForm
      console.log(formArr)
      const res = await updateSelfApi(roleForm)
      console.log(res)
      if (res && res.code === 200) {
        ElMessage.success('保存成功!')
        actUserHeader(roleForm.photo)
      }
    })
  }

  const FnUploadHeader = (data: string | Blob) => {
    console.log(data)
    const account = `${roleForm.account || ''}${Date.now()}`
    ossUpload('userHeader' + account, data)
      .then((res: RoleForm) => {
        console.log(res)
        if (res && res.res && res.res.status === 200) {
          // ElMessage.success('上传成功！')
          roleForm.photo = ''
          roleForm.photo = ossUrl + res.name
          postStaffAdd()
        }
      })
      .catch((err: unknown) => {
        console.error(err)
      })
  }

  onMounted(() => {
    FnGetUserProfile()
  })
</script>
<style lang="scss">
  .account-box {
    display: flex;
    justify-content: center;
    width: 1080px;
    padding: 24px;
    margin: 0 auto;
    background-color: #f5f7fa;

    .ElInput.is-disabled .ElInput__inner {
      background-color: #f4f4f4;
    }

    .account-form {
      width: 400px;
      padding: 60px 0;
      margin: 0 auto;
    }
  }
</style>
