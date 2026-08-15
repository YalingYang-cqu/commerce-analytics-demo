<template>
  <div class="image-info-edit">
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">产品图片</span>
      </div>

      <div class="image-upload-wrapper">
        <div class="image-list-container">
          <!-- 与 SPU 一致：使用 upload-custom 组件 -->
          <FileUpload
            v-model="localData.picList"
            :max-count="10"
            :max-size="10 * 1024 * 1024"
            accept=".jpg,.jpeg,.png,.gif,.bmp"
            list-type="picture-card"
          >
            <template #trigger>
              <div class="upload-trigger">
                <el-icon><Plus /></el-icon>
                <div class="upload-text">上传图片</div>
              </div>
            </template>
          </FileUpload>
        </div>

        <!-- 图片统计信息 -->
        <div class="image-count-info">
          已上传{{ localData.picList?.length || 0 }}/10张
          (支持JPG\PNG\BMP\GIF格式,图片大小不能超过10M)
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, nextTick } from 'vue'
  import { Plus } from '@element-plus/icons-vue'
  import { ElMessage } from 'element-plus'
  import FileUpload from '@/components/core/upload-custom/index.vue'
  import { uploadFeishuApprovalFile } from '@/api/system-manage'
  // import { updatePicList } from '@/api/product/sku'

  interface Props {
    modelValue: any
    productId?: number
  }

  interface PicItem {
    id?: number
    url: string
    /** OSS 原始地址，提交时优先使用，避免 url 为 blob 时无法保存 */
    rawUrl?: string
    approveStatus?: number
    productId?: number
    feishuFileCode?: string
    uid?: number | string
    name?: string
    status?: string
  }

  interface ImageInfo {
    picList: PicItem[]
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue'])

  // 标记是否正在从props同步数据
  const isUpdatingFromProps = ref(false)

  // Track original pic IDs for deletion detection
  const originalPicIds = ref<number[]>([])

  // Track which images are being processed for Feishu upload
  const processingFeishu = ref<Set<number | string>>(new Set())

  // 初始化本地数据
  const localData = reactive<ImageInfo>({
    picList: []
  })

  // 监听 props.modelValue 变化，同步到 localData
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal && newVal.picList) {
        isUpdatingFromProps.value = true
        localData.picList = newVal.picList.map((item: any) => ({
          id: item.id,
          url: item.url || item.picsUrl || '',
          rawUrl: item.rawUrl,
          approveStatus: item.approveStatus || 0,
          productId: item.productId,
          feishuFileCode: item.feishuFileCode || '',
          uid: item.uid,
          name: item.name,
          status: item.status
        }))
        // Track original IDs
        originalPicIds.value = newVal.picList.map((item: any) => item.id).filter((id: any) => id)

        nextTick(() => {
          isUpdatingFromProps.value = false
        })
      }
    },
    { immediate: true, deep: true }
  )

  // Process Feishu upload for new images（upload-custom 无 upload-success，由下方 watch picList 触发）
  const processFeishuUpload = async (pic: PicItem) => {
    // Skip if already has feishuFileCode (with actual content) or already processing
    if (
      (pic.feishuFileCode && pic.feishuFileCode.trim()) ||
      !pic.uid ||
      (pic.uid && processingFeishu.value.has(pic.uid))
    ) {
      return
    }

    // Skip if no valid url
    if (!pic.url) return

    // Skip blob URLs - wait for OSS upload to complete
    if (pic.url.startsWith('blob:')) return

    // Skip if not a valid HTTP/HTTPS URL (OSS upload not complete)
    if (!pic.url.startsWith('http://') && !pic.url.startsWith('https://')) return

    // Skip if has ID (existing image)
    if (pic.id) return

    processingFeishu.value.add(pic.uid)

    try {
      // Fetch the image file from OSS URL
      const response = await fetch(pic.url)
      const blob = await response.blob()
      const fileName = pic.url.split('/').pop() || 'image.jpg'
      const file = new File([blob], fileName, { type: blob.type })

      // Upload to Feishu
      const feishuResponse: any = await uploadFeishuApprovalFile(file, 'image')
      const feishuFileCode = feishuResponse?.data || feishuResponse?.result?.data || ''

      if (feishuFileCode) {
        // Update the pic with feishuFileCode
        const picIndex = localData.picList.findIndex((p) => p.uid === pic.uid)
        if (picIndex > -1) {
          localData.picList[picIndex].feishuFileCode = feishuFileCode
        }
      }
    } catch (error: any) {
      console.error('Failed to upload to Feishu:', error)
      ElMessage.error('飞书上传失败: ' + (error?.message || '未知错误'))
    } finally {
      processingFeishu.value.delete(pic.uid)
    }
  }

  // 监听 localData.picList 变化：处理飞书上传 + 同步父组件（upload-custom 无 upload-success，在此统一处理）
  watch(
    () => localData.picList,
    async (newVal) => {
      if (isUpdatingFromProps.value) return

      for (const pic of newVal) {
        await processFeishuUpload(pic)
      }

      if (!isUpdatingFromProps.value) {
        emit('update:modelValue', { ...localData })
      }
    },
    { deep: true }
  )

  // Submit method to update pic list with add/edit/delete logic
  const submitPicList = async (submitFlag: boolean = false) => {
    if (!props.productId) {
      ElMessage.error('产品ID不能为空')
      return false
    }

    try {
      // Separate pics into add/edit/delete
      const addPicDtoList: any[] = []
      const editPicDtoList: any[] = []
      const deletePicDtoList: number[] = []
      const originPicList = JSON.parse(JSON.stringify(localData.picList))
      console.log(`[originPicList]: `, originPicList)

      localData.picList.forEach((pic) => {
        const picDto = {
          picsUrl: pic.rawUrl || pic.url, // 提交用 OSS 地址（rawUrl），避免 url 为 blob 时无法保存
          feishuFileCode: pic.feishuFileCode || '',
          approveStatus: pic.approveStatus || 0,
          productId: props.productId
        }
        console.log(`[picDto Item]: `, picDto, pic)

        if (pic.id) {
          // Has ID - edit
          editPicDtoList.push({
            id: pic.id,
            ...picDto
          })
        } else {
          // No ID - add
          addPicDtoList.push(picDto)
        }
      })
      console.log(`[editPicDtoList, addPicDtoList]: `, editPicDtoList, addPicDtoList)

      // Find deleted pics
      const currentPicIds = localData.picList.map((p) => p.id).filter((id) => id)
      deletePicDtoList.push(...originalPicIds.value.filter((id) => !currentPicIds.includes(id)))

      // const toUpdatePicObj = {
      //   productId: props.productId,
      //   addPicDtoList,
      //   editPicDtoList,
      //   deletePicDtoList,
      //   submitFlag
      // }
      // alert(JSON.stringify(toUpdatePicObj))
      // Call API
      // await updatePicList(toUpdatePicObj)
      console.log(submitFlag)

      ElMessage.success('图片保存成功')
      return true
    } catch (error: any) {
      console.error('Failed to update pic list:', error)
      ElMessage.error('保存图片失败: ' + (error?.message || '未知错误'))
      return false
    }
  }

  // 表单验证
  const validate = async () => {
    return true
  }

  // 暴露验证方法和本地数据
  defineExpose({
    validate,
    formData: localData,
    submitPicList
  })
</script>

<style lang="scss" scoped>
  .image-info-edit {
    padding: 20px;

    .section {
      .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;

        .section-title-bar {
          width: 4px;
          height: 16px;
          margin-right: 8px;
          background-color: var(--el-color-primary);
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }

      .image-upload-wrapper {
        .image-list-container {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          margin-bottom: 12px;

          // 统一上传按钮和已上传图片的样式
          :deep(.el-upload-list--picture-card) {
            .el-upload-list__item {
              width: 148px;
              height: 148px;
            }
          }

          :deep(.el-upload--picture-card) {
            width: 148px !important;
            height: 148px !important;
            border: 1px solid #dcdfe6 !important;
            border-style: solid !important;
            border-radius: 6px;
            outline: none !important;
            box-shadow: none !important;

            &:hover {
              border-color: #dcdfe6 !important;
              outline: none !important;
              box-shadow: none !important;
            }

            &:focus {
              border-color: #dcdfe6 !important;
              outline: none !important;
              box-shadow: none !important;
            }

            &:focus-within {
              border-color: #dcdfe6 !important;
              outline: none !important;
              box-shadow: none !important;
            }
          }
        }

        .image-count-info {
          margin-top: 8px;
          font-size: 12px;
          color: #909399;
        }

        .upload-trigger {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;

          .el-icon {
            margin-bottom: 8px;
            font-size: 28px;
            color: var(--el-text-color-secondary);
          }

          .upload-text {
            font-size: 14px;
            color: var(--el-text-color-secondary);
          }
        }
      }
    }
  }
</style>
