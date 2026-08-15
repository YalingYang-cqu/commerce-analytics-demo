<template>
  <div>
    <!-- 单图片上传 -->
    <el-upload
      class="avatar-uploader"
      action="string"
      list-type="picture"
      :auto-upload="false"
      :show-file-list="false"
      :on-change="handleCrop"
    >
      <el-icon class="avatar-uploader-icon" :style="iconStyle">
        <Plus />
      </el-icon>
    </el-upload>
    <div>
      <img v-if="imageUrl" :src="imageUrl" class="avatar" ref="singleImgRef" />
    </div>

    <!-- 剪裁组件弹窗（Element Plus 使用 v-model） -->
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
  import { ref, computed, watch, nextTick } from 'vue'
  import { Plus } from '@element-plus/icons-vue'
  import type { UploadFile, UploadFiles } from 'element-plus'
  import Cropper from '../cropper.vue'

  interface Props {
    targetUrl?: string
    initUrl?: string | string[]
    fixedNumber?: [number, number]
    width?: number
    height?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    targetUrl: '/storage/upload',
    initUrl: '',
    fixedNumber: () => [1, 1],
    width: 178,
    height: 178
  })

  const emit = defineEmits<{
    imgupload: [data: Blob | string]
  }>()

  const vueCropperRef = ref<InstanceType<typeof Cropper> | null>(null)
  const singleImgRef = ref<HTMLImageElement | null>(null)
  const file = ref<UploadFile | null>(null)
  const imageUrl = ref<string>('')
  const uploadList = ref<UploadFiles>([])
  const cropperModel = ref(false)

  const iconStyle = computed(() => ({
    width: `${props.width}px`,
    height: `${props.height}px`,
    lineHeight: `${props.height}px`,
    fontSize: `${props.height / 6}px`
  }))

  // 监听传入初始化图片
  watch(
    () => props.initUrl,
    (val) => {
      if (val) {
        if (typeof val === 'string') {
          imageUrl.value = val
        } else {
          uploadList.value = formatImgArr(val)
        }
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

  /** **************************** single 单图情况 **************************************/
  const beforeClose = () => {
    cropperModel.value = false
  }

  const handleCrop = (uploadFile: UploadFile) => {
    // 点击弹出剪裁框
    cropperModel.value = true
    file.value = uploadFile
  }

  const onCropUpload = (data: Blob | string) => {
    // 剪裁完成后回调
    if (typeof data === 'string') {
      imageUrl.value = data
    } else if (data instanceof Blob) {
      imageUrl.value = URL.createObjectURL(data)
    }
    cropperModel.value = false
    emit('imgupload', data)
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
