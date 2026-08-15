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

    <!-- 单图片上传 -->
    <el-upload
      v-else
      class="avatar-uploader"
      action="string"
      list-type="picture"
      :auto-upload="false"
      :show-file-list="false"
      :on-change="handleCrop"
    >
      <template v-if="imageUrl">
        <img
          :src="imageUrl"
          class="avatar"
          ref="singleImgRef"
          :style="{ width: width + 'px', height: height + 'px' }"
          @mouseenter="mouseEnter"
          @mouseleave="mouseLeave"
        />
        <div
          id="upload-icon"
          ref="reuploadRef"
          :style="{ width: '100%' }"
          @mouseenter="mouseEnter"
          @mouseleave="mouseLeave"
        >
          <el-icon
            :style="{
              color: '#2E2E2E',
              fontSize: '25px',
              display: 'inline-block',
              paddingRight: '15px'
            }"
            @click.stop="handlePreviewSingle"
          >
            <ZoomIn />
          </el-icon>
          <el-icon
            :style="{
              color: '#2E2E2E',
              fontSize: '25px',
              display: 'inline-block'
            }"
          >
            <UploadFilled />
          </el-icon>
        </div>
      </template>
      <template v-else>
        <el-icon
          class="avatar-uploader-icon"
          :style="{
            width: width + 'px',
            height: height + 'px',
            lineHeight: height + 'px',
            fontSize: height / 6 + 'px'
          }"
        >
          <Plus />
        </el-icon>
      </template>
      <div
        class="reupload"
        ref="uploadingRef"
        :style="{
          width: reuploadWidth + 'px',
          height: reuploadWidth + 'px',
          lineHeight: reuploadWidth + 'px',
          fontSize: reuploadWidth / 5 + 'px'
        }"
      >
        上传中..
      </div>
      <div
        class="reupload"
        ref="failUploadRef"
        :style="{
          width: reuploadWidth + 'px',
          height: reuploadWidth + 'px',
          lineHeight: reuploadWidth + 'px',
          fontSize: reuploadWidth / 5 + 'px'
        }"
      >
        上传失败
      </div>
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
        ref="vueCropperRef"
        :img-file="file"
        :fixedNumber="fixedNumber"
        @upload="onCropUpload"
      />
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import { Plus, ZoomIn, UploadFilled } from '@element-plus/icons-vue'
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
    multiple: false,
    initUrl: '',
    fixedNumber: () => [1.5, 1],
    width: 178,
    height: 178
  })

  const emit = defineEmits<{
    imgupload: [data: UploadFiles | string]
  }>()

  const vueCropperRef = ref<InstanceType<typeof Cropper> | null>(null)
  const singleImgRef = ref<HTMLImageElement | null>(null)
  const reuploadRef = ref<HTMLDivElement | null>(null)
  const uploadingRef = ref<HTMLDivElement | null>(null)
  const failUploadRef = ref<HTMLDivElement | null>(null)

  const file = ref<UploadFile | null>(null)
  const imageUrl = ref<string>('')
  const dialogImageUrl = ref<string>('')
  const uploadList = ref<UploadFiles>([])
  const dialogVisible = ref(false)
  const cropperModel = ref(false)

  const reuploadWidth = computed(() => props.height * 0.7) // 动态改变"重新上传"大小

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
    dialogImageUrl.value = file.url || ''
    dialogVisible.value = true
  }

  const handleRemove = (file: UploadFile, fileList: UploadFiles) => {
    uploadList.value = fileList
    emit('imgupload', uploadList.value)
  }

  const consoleFL = (uploadFile: UploadFile, fileList: UploadFiles) => {
    cropperModel.value = true
    file.value = uploadFile
    uploadList.value = fileList
  }

  /** **************************** single 单图情况 **************************************/
  const handlePreviewSingle = () => {
    dialogImageUrl.value = file.value?.url || imageUrl.value
    dialogVisible.value = true
  }

  const mouseEnter = () => {
    if (reuploadRef.value) {
      reuploadRef.value.style.display = 'block'
    }
    if (failUploadRef.value && failUploadRef.value.style.display === 'block') {
      failUploadRef.value.style.display = 'none'
    }
    if (singleImgRef.value) {
      singleImgRef.value.style.opacity = '0.6'
    }
  }

  const mouseLeave = () => {
    if (reuploadRef.value) {
      reuploadRef.value.style.display = 'none'
    }
    if (singleImgRef.value) {
      singleImgRef.value.style.opacity = '1'
    }
  }

  const handleCrop = (uploadFile: UploadFile) => {
    cropperModel.value = true
    file.value = uploadFile
  }

  const onCropUpload = (data: Blob | string) => {
    if (props.multiple) {
      if (file.value) {
        const index = uploadList.value.findIndex((f) => f.uid === file.value!.uid)
        if (index !== -1 && typeof data === 'string') {
          uploadList.value[index].url = data
        } else if (index !== -1 && data instanceof Blob) {
          uploadList.value[index].url = URL.createObjectURL(data)
        }
      }
      emit('imgupload', uploadList.value)
    } else {
      if (typeof data === 'string') {
        imageUrl.value = data
      } else if (data instanceof Blob) {
        imageUrl.value = URL.createObjectURL(data)
      }
      emit('imgupload', imageUrl.value)
    }
    cropperModel.value = false
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
