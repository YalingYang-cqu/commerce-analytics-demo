<template>
  <div>
    <!-- 多图片上传 -->
    <el-upload
      v-if="multiple"
      action="string"
      list-type="picture-card"
      accept="image/*"
      :on-preview="handlePreview"
      :auto-upload="false"
      :on-remove="handleRemove"
      :on-change="consoleFL"
      :file-list="uploadList"
    >
      <el-icon>
        <Plus />
      </el-icon>
    </el-upload>

    <!-- 多图片预览弹窗 -->
    <el-dialog v-model="dialogVisible" :append-to-body="true">
      <img width="100%" :src="dialogImageUrl" alt="" />
    </el-dialog>

    <!-- 剪裁组件弹窗 -->
    <el-dialog
      v-model="cropperModel"
      :append-to-body="true"
      width="1100px"
      :before-close="beforeClose"
    >
      <Cropper
        :img-file="file"
        ref="vueCropperRef"
        :fixedNumber="fixedNumber"
        @upload="onCropUpload"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, nextTick } from 'vue'
  import { Plus } from '@element-plus/icons-vue'
  import type { UploadFile, UploadFiles } from 'element-plus'
  import Cropper from '../cropper.vue'

  interface Props {
    targetUrl?: string
    multiple?: boolean
    initUrl?: string | string[]
    fixedNumber?: [number, number]
    width?: number
    height?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    targetUrl: () => `${import.meta.env.VITE_API_ROOT || ''}/sys/oss/upload`,
    multiple: true,
    initUrl: '',
    fixedNumber: () => [1.5, 1],
    width: 178,
    height: 178
  })

  const emit = defineEmits<{
    imgupload: [files: UploadFiles]
  }>()

  const vueCropperRef = ref<InstanceType<typeof Cropper> | null>(null)
  const file = ref<UploadFile | null>(null)
  const imageUrl = ref<string>('')
  const dialogImageUrl = ref<string>('')
  const uploadList = ref<UploadFiles>([])
  const dialogVisible = ref(false)
  const cropperModel = ref(false)

  // 监听传入初始化图片
  watch(
    () => props.initUrl,
    (val) => {
      if (!val) return
      if (typeof val === 'string') {
        imageUrl.value = val
      } else {
        uploadList.value = formatImgArr(val)
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

  /** **************************** multiple 多图情况 **************************************/
  const handlePreview = (file: UploadFile) => {
    // 点击进行图片展示
    dialogImageUrl.value = file.url || ''
    dialogVisible.value = true
  }

  const handleRemove = (file: UploadFile, fileList: UploadFiles) => {
    // 删除图片后更新图片文件列表并通知父级变化
    uploadList.value = fileList
    emit('imgupload', uploadList.value)
  }

  const consoleFL = (uploadFile: UploadFile, fileList: UploadFiles) => {
    // 弹出剪裁框，将当前文件设置为文件
    cropperModel.value = true
    file.value = uploadFile
    uploadList.value = fileList
  }

  const onCropUpload = (data: Blob | string) => {
    // 剪裁完成返回的 base64 / Blob，可根据实际业务进行上传
    // 这里简单将当前图片替换为裁剪结果的本地预览
    if (file.value) {
      const index = uploadList.value.findIndex((f) => f.uid === file.value!.uid)
      if (index !== -1 && typeof data === 'string') {
        uploadList.value[index].url = data
      } else if (index !== -1 && data instanceof Blob) {
        uploadList.value[index].url = URL.createObjectURL(data)
      }
    }
    cropperModel.value = false
    emit('imgupload', uploadList.value)
  }

  const formatImgArr = (arr: string[]): UploadFiles => {
    const result: UploadFiles = arr.map((item, index) => {
      if (typeof item === 'string') {
        return {
          url: item,
          uid: `index${index}`,
          name: `image${index}`,
          status: 'success'
        } as UploadFile
      } else {
        return item as UploadFile
      }
    })
    return result
  }

  const beforeClose = () => {
    cropperModel.value = false
  }
</script>

<style scoped>
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
