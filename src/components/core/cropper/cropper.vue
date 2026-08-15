<template>
  <div>
    <div class="cropper-content">
      <!-- 剪裁框 -->
      <div class="cropper">
        <VueCropper
          ref="cropperRef"
          :img="option.img"
          :outputSize="option.outputSize"
          :outputType="option.outputType"
          :info="true"
          :full="option.full"
          :canMove="option.canMove"
          :canMoveBox="option.canMoveBox"
          :original="option.original"
          :autoCrop="option.autoCrop"
          :autoCropWidth="option.autoCropWidth"
          :autoCropHeight="option.autoCropHeight"
          :fixedBox="option.fixedBox"
          :fixed="option.fixed"
          :fixedNumber="option.fixedNumber"
          :enlarge="option.enlarge"
          :maxImgSize="option.maxImgSize"
          @realTime="realTime"
        />
      </div>
      <!-- 预览框 -->
      <div
        class="show-preview"
        :style="{
          width: '500px',
          height: '400px',
          overflow: 'hidden',
          margin: '0 25px',
          display: 'flex',
          alignItems: 'center'
        }"
      >
        <div :style="previews.div" class="preview" :class="isAvater ? 'isBorRadius' : ''">
          <img :src="previews.url" :style="previews.img" />
        </div>
      </div>
    </div>
    <div class="footer-btn">
      <!-- 缩放旋转按钮 -->
      <div class="scope-btn">
        <el-button type="primary" :icon="ZoomIn" @click="changeScale(1)" />
        <el-button type="primary" :icon="ZoomOut" @click="changeScale(-1)" />
        <el-button type="primary" @click="rotateLeft"> 逆时针旋转 </el-button>
        <el-button type="primary" @click="rotateRight"> 顺时针旋转 </el-button>
      </div>
      <!-- 确认上传按钮 -->
      <div class="upload-btn">
        <el-button type="primary" :disabled="isDisabled" @click="uploadImg('blob')">
          上传
        </el-button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, onMounted, onBeforeUnmount, useAttrs } from 'vue'
  import { VueCropper } from 'vue-cropper'
  import { ZoomIn, ZoomOut } from '@element-plus/icons-vue'
  import type { UploadFile } from 'element-plus'
  import 'vue-cropper/dist/index.css'

  interface CropperOption {
    img: string | Blob | File | null
    outputSize: number
    outputType: string
    full: boolean
    canMove: boolean
    original: boolean
    canMoveBox: boolean
    autoCrop: boolean
    autoCropWidth: number | string
    autoCropHeight: number | string
    fixedBox: boolean
    fixed: boolean
    fixedNumber: [number, number]
    enlarge: number | string
    maxImgSize: number | string
  }

  interface PreviewData {
    div?: {
      width?: string
      height?: string
      [key: string]: any
    }
    img?: {
      width?: string
      height?: string
      transform?: string
      [key: string]: any
    }
    url?: string
  }

  interface Props {
    imgFile?: UploadFile | UploadFile[] | Record<string, any>
    isAvater?: boolean
    autoCropWidth?: number | string
    autoCropHeight?: number | string
    fixedNumber?: [number, number]
    fixed?: boolean
    maxImgSize?: number | string
  }

  const props = withDefaults(defineProps<Props>(), {
    imgFile: () => ({}),
    isAvater: false,
    fixed: false,
    maxImgSize: 2000
  })

  const emit = defineEmits<{
    upload: [data: Blob | string]
  }>()

  const attrs = useAttrs()
  const cropperRef = ref<InstanceType<typeof VueCropper> | null>(null)

  const previews = reactive<PreviewData>({})
  const isDisabled = ref(false)

  const option = reactive<CropperOption>({
    img: '', // 裁剪图片的地址
    outputSize: 1, // 裁剪生成图片的质量 (0-1)
    full: false, // 是否输出原图比例的截图
    outputType: 'png', // 裁剪生成图片的格式
    canMove: true, // 上传图片是否可以移动
    original: false, // 上传图片按照原始比例渲染
    canMoveBox: true, // 截图框能否拖动
    autoCrop: true, // 是否默认生成截图框
    autoCropWidth: 220, // 默认生成截图框宽度
    autoCropHeight: 160, // 默认生成截图框高度
    fixedBox: false, // 固定截图框大小 不允许改变
    fixed: props.fixed, // 是否开启固定宽高比
    fixedNumber: props.fixedNumber || [1, 1], // 截图框比例
    enlarge: 1, // 图片根据截图框输出比例倍数
    maxImgSize: props.maxImgSize || 2000 // 可以压缩图片宽高
  })

  // 兼容旧项目通过 $attrs 透传 autoCropWidth / autoCropHeight 的方式
  onMounted(() => {
    if (attrs.autoCropWidth) {
      option.autoCropWidth = attrs.autoCropWidth as number | string
    }
    if (attrs.autoCropHeight) {
      option.autoCropHeight = attrs.autoCropHeight as number | string
    }
    if (props.autoCropWidth) {
      option.autoCropWidth = props.autoCropWidth
    }
    if (props.autoCropHeight) {
      option.autoCropHeight = props.autoCropHeight
    }
    if (props.fixedNumber) {
      option.fixedNumber = props.fixedNumber
    }
    if (props.fixed !== undefined) {
      option.fixed = props.fixed
    }
  })

  // 监听 imgFile 变化
  watch(
    () => props.imgFile,
    (newVal) => {
      console.log(newVal, 'newValnewValnewVal')
      if (newVal && typeof newVal === 'object') {
        if ('url' in newVal) {
          option.img = (newVal as { url: string }).url
        } else if ('raw' in newVal) {
          // 处理 UploadFile 的 raw 属性（File 对象）
          option.img = (newVal as UploadFile).raw || ''
        }
      } else if (typeof newVal === 'string') {
        option.img = newVal
      }
    },
    { immediate: true, deep: true }
  )

  // 保持与旧逻辑一致，移动端缩放时禁止默认滚动行为
  const handleTouchMove = (e: TouchEvent) => {
    e.preventDefault()
  }

  onMounted(() => {
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
  })

  onBeforeUnmount(() => {
    window.removeEventListener('touchmove', handleTouchMove)
  })

  const changeScale = (num: number = 1) => {
    // 图片缩放
    if (cropperRef.value && typeof cropperRef.value.changeScale === 'function') {
      cropperRef.value.changeScale(num)
    }
  }

  const rotateLeft = () => {
    // 向左旋转
    if (cropperRef.value && typeof cropperRef.value.rotateLeft === 'function') {
      cropperRef.value.rotateLeft()
    }
  }

  const rotateRight = () => {
    // 向右旋转
    if (cropperRef.value && typeof cropperRef.value.rotateRight === 'function') {
      cropperRef.value.rotateRight()
    }
  }

  const Update = () => {
    // 供父组件在 imgFile 变化时手动调用，保持旧接口
    if (props.imgFile && typeof props.imgFile === 'object') {
      if ('url' in props.imgFile) {
        option.img = (props.imgFile as { url: string }).url
      } else if ('raw' in props.imgFile) {
        option.img = (props.imgFile as UploadFile).raw || ''
      }
    } else if (typeof props.imgFile === 'string') {
      option.img = props.imgFile
    }
  }

  const realTime = (data: PreviewData) => {
    // 实时预览
    Object.assign(previews, data)
  }

  const uploadImg = (type: 'blob' | 'base64') => {
    // 将剪裁好的图片回传给父组件
    isDisabled.value = true
    if (!cropperRef.value) {
      isDisabled.value = false
      return
    }

    if (type === 'blob') {
      if (typeof cropperRef.value.getCropBlob === 'function') {
        cropperRef.value.getCropBlob((data: Blob) => {
          emit('upload', data)
          isDisabled.value = false
        })
      } else {
        isDisabled.value = false
      }
    } else {
      if (typeof cropperRef.value.getCropData === 'function') {
        cropperRef.value.getCropData((data: string) => {
          emit('upload', data)
          isDisabled.value = false
        })
      } else {
        isDisabled.value = false
      }
    }
  }

  // 暴露方法供父组件调用
  defineExpose({
    Update
  })
</script>

<style scoped>
  .isBorRadius {
    border-radius: 50%;
  }

  .cropper-content {
    display: flex;
    -webkit-justify-content: flex-end;
    justify-content: flex-end;
  }

  .cropper-content .cropper {
    width: 500px;
    height: 400px;
  }

  .cropper-content .show-preview {
    display: flex;
    -webkit-flex: 1;
    flex: 1;
    -webkit-justify-content: center;
    justify-content: center;
    margin-left: 40px;
    overflow: hidden;
    background: #ccc;
    border: 1px solid #ccc;
  }

  .preview {
    overflow: hidden;
    background: #ccc;
    border: 1px solid #ccc;
  }

  .footer-btn {
    display: flex;
    -webkit-justify-content: flex-end;
    justify-content: flex-end;
    margin-top: 30px;
  }

  .footer-btn .scope-btn {
    display: flex;
    -webkit-justify-content: space-between;
    justify-content: space-between;
    width: 250px;
  }

  .footer-btn .upload-btn {
    display: flex;
    -webkit-flex: 1;
    flex: 1;
    -webkit-justify-content: center;
    justify-content: center;
  }

  .footer-btn .btn {
    -webkit-box-sizing: border-box;
    box-sizing: border-box;
    display: inline-block;
    padding: 8px 15px;
    margin: 0;
    font-size: 12px;
    font-weight: 500;
    line-height: 1;
    color: #fff;
    text-align: center;
    white-space: nowrap;
    -webkit-appearance: none;
    cursor: pointer;
    background-color: #67c23a;
    border-color: #67c23a;
    border-radius: 3px;
    outline: none;
    outline: 0;
    -webkit-transition: 0.1s;
    transition: 0.1s;
  }
</style>

<!--博客地址 https://www.jianshu.com/p/9b4de1c5b9c0 -->
