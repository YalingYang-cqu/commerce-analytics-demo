<template>
  <div style="display: flex; align-items: center">
    <!-- 预览图 -->
    <el-image
      :class="isAvater ? 'isBorRadius' : ''"
      :src="imageUrl"
      :style="{ width: imgWidth + 'px', height: imgHeight + 'px' }"
      class="marR10"
      :preview-src-list="imageUrlArr"
    >
      <template #error>
        <img v-if="isAvater" src="@/assets/svg/man.svg" alt="" class="staff-header" />
      </template>
    </el-image>

    <!-- 选择图片 -->
    <el-upload
      action="string"
      list-type="picture"
      :auto-upload="false"
      :show-file-list="false"
      accept="image/jpeg,image/jpg,image/png"
      :on-change="handleCrop"
    >
      <el-button size="small" type="primary">上传</el-button>
    </el-upload>

    <!-- 剪裁组件弹窗（Element Plus 使用 v-model 绑定） -->
    <el-dialog
      v-model="cropperModel"
      :append-to-body="true"
      width="1100px"
      :before-close="beforeClose"
    >
      <cropper
        ref="vueCropperRef"
        :img-file="file"
        :is-avater="isAvater"
        v-bind="$attrs"
        @upload="FnSingleUpload"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, nextTick } from 'vue'
  import type { UploadFile } from 'element-plus'
  import cropper from './cropper.vue'

  interface Props {
    isAvater?: boolean
    imgWidth?: number
    imgHeight?: number
    targetUrl?: string
    initUrl?: string | string[]
  }

  const props = withDefaults(defineProps<Props>(), {
    isAvater: false,
    imgWidth: 420,
    imgHeight: 220,
    targetUrl: '',
    initUrl: ''
  })

  const emit = defineEmits<{
    FnUploadPage: [data: Blob | string]
  }>()

  const vueCropperRef = ref<InstanceType<typeof cropper> | null>(null)
  const file = ref<UploadFile | null>(null)
  const imageUrl = ref<string>('')
  const cropperModel = ref(false)
  const imageUrlArr = ref<string[]>([])

  // 监听并初始化图片
  watch(
    () => props.initUrl,
    (val) => {
      console.log(val, 'props.initUrlprops.initUrlprops.initUrl')
      imageUrlArr.value = []
      if (!val) {
        imageUrl.value = ''
        return
      }

      if (typeof val === 'string') {
        imageUrl.value = val
        imageUrlArr.value.push(val)
      } else if (Array.isArray(val)) {
        imageUrlArr.value = val
        imageUrl.value = val[0] || ''
      }
    },
    { immediate: true }
  )

  // 更新裁剪组件
  watch(
    () => file.value,
    async () => {
      await nextTick()
      if (vueCropperRef.value && vueCropperRef.value.Update) {
        vueCropperRef.value.Update()
      }
    },
    { deep: true }
  )

  /** ***************** single 单图情况 ******************/
  const beforeClose = () => {
    cropperModel.value = false
  }

  const handleCrop = (uploadFile: UploadFile) => {
    console.log(uploadFile, 'uploadFileuploadFile')
    // 选择图片后弹出裁剪框
    cropperModel.value = true
    file.value = uploadFile
    // 确保文件对象包含 url 或 raw
    if (!uploadFile.url && uploadFile.raw) {
      // 如果只有 raw，创建临时 URL
      file.value = {
        ...uploadFile,
        url: URL.createObjectURL(uploadFile.raw)
      }
    }
  }

  const FnSingleUpload = (data: Blob | string) => {
    // 裁剪完成回调，向父组件透传数据
    cropperModel.value = false
    if (typeof data === 'string') {
      imageUrl.value = data
    } else if (data instanceof Blob) {
      // 如果是 Blob，创建 URL 用于预览
      imageUrl.value = URL.createObjectURL(data)
    }
    emit('FnUploadPage', data)
  }
</script>

<style scoped>
  .marR10 {
    margin-right: 10px;
  }

  .isBorRadius {
    margin-right: 10px;
    border-radius: 50% !important;
  }

  .avatar-uploader :deep(.el-upload) {
    position: relative;
    overflow: hidden;
    cursor: pointer;
    border: 1px dashed #d9d9d9;
    border-radius: 6px;
  }

  .avatar-uploader :deep(.el-upload:hover) {
    border-color: #409eff;
  }

  .avatar-uploader-icon {
    color: #8c939d;
    text-align: center;
  }

  .avatar {
    display: block;
  }

  .reupload {
    position: absolute;
    top: 50%;
    left: 50%;
    display: none;
    color: #fff;
    background-color: #000;
    border-radius: 50%;
    opacity: 0.6;
    transform: translate(-50%, -50%);
  }

  #upload-icon {
    position: absolute;
    top: 50%;
    left: 50%;
    display: none;
    transform: translate(-50%, -50%);
  }
</style>
