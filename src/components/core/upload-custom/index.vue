<template>
  <div class="file-upload-wrapper">
    <ElUpload
      ref="uploadRef"
      v-model:file-list="internalFileList"
      :auto-upload="autoUpload"
      :limit="maxCount"
      :on-exceed="handleExceed"
      :on-change="handleChange"
      :on-remove="handleRemove"
      :on-preview="handleFileClick"
      :accept="accept"
      :disabled="disabled"
      :multiple="multiple"
      :list-type="listType"
      class="file-upload"
    >
      <template #trigger>
        <slot name="trigger">
          <ElButton
            :type="buttonType"
            :icon="buttonIcon"
            :disabled="disabled"
            :loading="isUploading"
            link
          >
            {{ isUploading ? '文件上传中' : buttonText }}
          </ElButton>
        </slot>
      </template>
    </ElUpload>

    <!-- 文件预览弹窗 -->
    <ElDialog
      v-if="showPreview"
      v-model="previewVisible"
      :width="previewDialogWidth"
      align-center
      append-to-body
      class="preview-dialog"
    >
      <template #header>
        <div class="dialog-header">
          <span>{{ previewFileName }}</span>
          <div
            :style="{ cursor: 'pointer', marginRight: '5px' }"
            @click="downloadFile"
            v-if="previewFileUrl && (isImage(previewFile) || isTextFile(previewFile))"
            class="header-download-btn"
          >
            <i class="iconfont-custom">&#xe665;</i>
          </div>
        </div>
      </template>
      <div class="preview-content">
        <!-- 图片预览 -->
        <div v-if="isImage(previewFile)" class="image-preview-wrapper">
          <ElImage :src="previewFileUrl" fit="contain" style="max-width: 100%; max-height: 70vh" />
        </div>
        <!-- PDF预览 -->
        <iframe
          v-else-if="isPdf(previewFile)"
          :src="previewFileUrl"
          style="width: 100%; height: 70vh; border: none"
        />
        <!-- Office文档预览 -->
        <div v-else-if="isOfficeFile(previewFile)" class="office-preview">
          <div v-if="officePreviewUrl && !officePreviewError" class="office-preview-wrapper">
            <div v-if="officePreviewUrl" class="office-preview-tip">
              <ElAlert type="info" :closable="false" show-icon style="margin-bottom: 12px">
                <template #default>
                  <span>如果预览失败，可能是文件未公开访问或需要权限验证，您可以</span>
                  <ElButton
                    v-if="previewFileUrl"
                    type="primary"
                    link
                    size="small"
                    style="padding: 0 4px; vertical-align: baseline"
                    @click="downloadFile"
                  >
                    下载文件
                  </ElButton>
                  <span>查看</span>
                </template>
              </ElAlert>
            </div>
            <iframe
              :src="officePreviewUrl"
              style="width: 100%; height: 70vh; border: none"
              @error="handleOfficePreviewError"
              @load="handleOfficePreviewLoad"
            />
          </div>
          <div v-else class="preview-placeholder">
            <ElIcon :size="64"><Document /></ElIcon>
            <p v-if="!officePreviewUrl">文件需要先上传才能预览</p>
            <p v-else>文件预览失败，可能是文件未公开或需要权限验证</p>
            <p class="file-name">{{ previewFileName }}</p>
            <ElButton
              v-if="previewFileUrl"
              type="primary"
              style="margin-top: 16px"
              @click="downloadFile"
            >
              下载文件
            </ElButton>
          </div>
        </div>
        <!-- 文本文件预览 -->
        <div v-else-if="isTextFile(previewFile)" class="text-preview">
          <pre v-if="textContent">{{ textContent }}</pre>
          <div v-else class="loading-text">正在加载文件内容...</div>
        </div>
        <!-- 其他文件类型 - 尝试在iframe中打开或提供下载 -->
        <div v-else class="other-file-preview">
          <iframe
            v-if="previewFileUrl"
            :src="previewFileUrl"
            style="width: 100%; height: 70vh; border: none"
            @error="handleIframeError"
          />
          <div v-if="iframeError" class="preview-placeholder">
            <ElIcon :size="64"><Document /></ElIcon>
            <p>该文件类型无法在浏览器中预览</p>
            <p class="file-name">{{ previewFileName }}</p>
            <ElButton
              v-if="previewFileUrl"
              type="primary"
              style="margin-top: 16px"
              @click="downloadFile"
            >
              下载文件
            </ElButton>
          </div>
        </div>
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, watch, nextTick } from 'vue'
  import { ElUpload, ElButton, ElDialog, ElImage, ElIcon, ElMessage, ElAlert } from 'element-plus'
  import { Upload, Document } from '@element-plus/icons-vue'
  import type { UploadFile } from 'element-plus'
  import { ossUpload, getOssSignatureUrl } from '@/utils/ali-oss'

  interface Props {
    modelValue: any[]
    /** 最大上传数量 */
    maxCount?: number
    /** 最大文件大小（字节），默认200MB */
    maxSize?: number
    /** 接受的文件类型，例如：'.jpg,.png,.pdf' */
    accept?: string
    /** 是否禁用 */
    disabled?: boolean
    /** OSS上传文件夹 */
    fileFolder?: string
    /** 文件列表展示类型：'text' | 'picture' | 'picture-card' */
    listType?: 'text' | 'picture' | 'picture-card'
    /** 是否自动上传，默认false */
    autoUpload?: boolean
    /** 上传按钮文本 */
    buttonText?: string
    /** 上传按钮类型 */
    buttonType?: 'primary' | 'success' | 'warning' | 'danger' | 'info' | 'text'
    /** 上传按钮图标 */
    buttonIcon?: any
    /** 是否显示预览功能 */
    showPreview?: boolean
    /** 预览弹窗宽度 */
    previewDialogWidth?: string
    multiple?: boolean
    showMsg?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    maxCount: 5,
    maxSize: 200 * 1024 * 1024, // 200MB
    accept:
      '.docx,.doc,.pdf,.txt,.xlsx,.xls,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.bmp,.gif,.zip,.rar,.7z,.ico,.svg',
    disabled: false,
    fileFolder: 'webImg',
    listType: 'text',
    autoUpload: false,
    buttonText: '上传附件',
    buttonType: 'primary',
    buttonIcon: Upload,
    showPreview: true,
    previewDialogWidth: '80%',
    multiple: false,
    showMsg: false
  })

  const emit = defineEmits<{
    'update:modelValue': [files: any[]]
  }>()

  const uploadRef = ref()
  const previewVisible = ref(false)
  const previewFile = ref<UploadFile | null>(null)
  const previewFileUrl = ref('')
  const previewFileName = ref('')
  const textContent = ref('')
  const iframeError = ref(false)
  const officePreviewUrl = ref('')
  const officePreviewError = ref(false)

  // ElUpload 使用完整列表（含上传中）；对父组件 v-model 仅同步上传成功的项
  const internalFileList = ref<any[]>([])
  let syncFromParent = false

  const isSuccessForModel = (f: any) => {
    if (!f) return false
    if (f.status === 'fail' || f.status === 'ready' || f.status === 'uploading') return false
    if (f.status === 'success') return true
    if (f.url && !f.raw) return true
    return false
  }

  watch(
    () => props.modelValue,
    (v) => {
      const incoming = v || []
      const pending = internalFileList.value.filter(
        (f: any) => f.status === 'ready' || f.status === 'uploading'
      )
      syncFromParent = true
      internalFileList.value = [...incoming, ...pending]
      nextTick(() => {
        syncFromParent = false
      })
    },
    { deep: true, immediate: true }
  )

  watch(
    internalFileList,
    () => {
      if (syncFromParent) return
      emit('update:modelValue', internalFileList.value.filter(isSuccessForModel))
    },
    { deep: true }
  )

  /** OSS 上传进行中的任务数，用于触发按钮 loading（多文件并发时累加） */
  const uploadPendingCount = ref(0)
  const isUploading = computed(() => uploadPendingCount.value > 0)

  const imageExtensions = ['.jpg', '.jpeg', '.png', '.bmp', '.gif']

  // 判断是否为图片（支持用户要求的图像文件类型）
  const isImage = (file: UploadFile | null): boolean => {
    if (!file) return false
    const fileName = file.name?.toLowerCase() || ''
    if (imageExtensions.some((type) => fileName.endsWith(type))) return true
    // 若 name 无扩展名（如接口返回的 name 为 "image" 或 OSS key），再根据 url 判断
    const urlPath = (file.url || (file as any).rawUrl || '').toString().toLowerCase()
    if (imageExtensions.some((type) => urlPath.includes(type))) return true
    // 若 accept 仅包含图片类型（如 SKU 主图只接受 .jpg,.jpeg,.png），则视为图片，点击应预览而非下载
    const acceptList = (props.accept || '').split(',').map((s) => s.trim().toLowerCase())
    const onlyImages =
      acceptList.length > 0 &&
      acceptList.every((ext) => imageExtensions.some((e) => ext === e || ext.endsWith(e)))
    if (onlyImages && (file.url || (file as any).rawUrl)) return true
    return false
  }

  // 判断是否为PDF
  const isPdf = (file: UploadFile | null): boolean => {
    if (!file) return false
    const fileName = file.name?.toLowerCase() || ''
    return fileName.endsWith('.pdf')
  }

  // 判断是否为Office文档（支持用户要求的文档文件类型）
  const isOfficeFile = (file: UploadFile | null): boolean => {
    if (!file) return false
    const officeTypes = ['.docx', '.doc', '.xlsx', '.xls', '.ppt', '.pptx']
    const fileName = file.name?.toLowerCase() || ''
    return officeTypes.some((type) => fileName.endsWith(type))
  }

  // 判断是否为文本文件（支持用户要求的文档文件类型）
  const isTextFile = (file: UploadFile | null): boolean => {
    if (!file) return false
    const textTypes = ['.txt', '.csv']
    const fileName = file.name?.toLowerCase() || ''
    return textTypes.some((type) => fileName.endsWith(type))
  }

  // 判断文件是否支持预览
  const isPreviewable = (file: UploadFile | null): boolean => {
    if (!file) return false
    return isImage(file) || isPdf(file) || isOfficeFile(file) || isTextFile(file)
  }

  // 获取文件URL用于预览
  const getPreviewUrl = (file: UploadFile): string => {
    if (file.url) {
      return file.url
    }
    if (file.raw) {
      return URL.createObjectURL(file.raw)
    }
    return ''
  }

  // 获取可用于预览的URL（如果是OSS文件，生成签名URL）
  const getAccessiblePreviewUrl = async (file: UploadFile): Promise<string> => {
    const fileUrl = getPreviewUrl(file)
    if (!fileUrl) return ''

    // 如果是本地文件（blob URL），直接返回
    if (fileUrl.startsWith('blob:')) {
      return fileUrl
    }
    // 如果是OSS文件，生成签名URL以确保可以访问
    if (fileUrl.includes('.aliyuncs.com') || fileUrl.includes('oss-')) {
      try {
        const signedUrl = await getOssSignatureUrl(fileUrl, 3600) // 1小时有效期
        return signedUrl
      } catch (error) {
        console.error('生成OSS签名URL失败:', error)
        // 如果生成失败，返回原始URL
        return fileUrl
      }
    }

    // 其他情况直接返回原始URL
    return fileUrl
  }

  // 获取Office文档的在线预览URL
  const getOfficePreviewUrl = async (file: UploadFile | null): Promise<string> => {
    if (!file) return ''

    try {
      const fileUrl = await getAccessiblePreviewUrl(file)

      if (!fileUrl) {
        console.warn('无法获取文件URL')
        return ''
      }

      // 使用Microsoft Office Online Viewer
      // 注意：如果文件是本地文件（blob URL），需要先上传到服务器才能预览
      if (fileUrl.startsWith('blob:')) {
        // 如果是本地文件，提示需要先上传
        console.warn('本地文件无法使用Office Online Viewer预览')
        return ''
      }

      // 确保URL是完整的HTTP/HTTPS URL
      if (!fileUrl.startsWith('http://') && !fileUrl.startsWith('https://')) {
        console.warn('文件URL格式不正确:', fileUrl)
        return ''
      }

      // 使用Microsoft Office Online Viewer（使用签名URL确保可以访问）
      // 注意：Office Online Viewer 要求使用 HTTPS 协议的URL
      // 如果签名URL是 HTTP，需要转换为 HTTPS（如果OSS支持）
      let finalUrl = fileUrl
      if (fileUrl.startsWith('http://')) {
        // 尝试将 HTTP 转换为 HTTPS（大多数OSS都支持）
        finalUrl = fileUrl.replace('http://', 'https://')
      }

      // Office Online Viewer 的 src 参数需要对整个URL进行编码
      // 这是标准做法，Office Online Viewer 会自动解码URL
      const officeUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(finalUrl)}`
      return officeUrl
    } catch (error) {
      console.error('生成Office预览URL失败:', error)
      return ''
    }
  }

  // Office预览错误处理
  const handleOfficePreviewError = () => {
    officePreviewError.value = true
  }

  // Office预览加载处理（用于检测加载失败）
  const handleOfficePreviewLoad = (event: Event) => {
    const iframe = event.target as HTMLIFrameElement
    try {
      // 尝试访问 iframe 内容来判断是否加载成功
      const iframeDoc = iframe.contentDocument || iframe.contentWindow?.document
      if (iframeDoc) {
        // 如果能访问内容，检查是否包含错误信息
        const bodyText = iframeDoc.body?.innerText || iframeDoc.body?.textContent || ''
        if (
          bodyText.includes('File not found') ||
          bodyText.includes('not valid') ||
          bodyText.includes('not publicly accessible') ||
          bodyText.includes('无法访问') ||
          bodyText.includes('文件未找到')
        ) {
          officePreviewError.value = true
          return
        }
      } else {
        // 跨域情况，无法直接判断，使用超时检测
        setTimeout(() => {
          try {
            // 再次尝试访问 iframe 内容
            const doc = iframe.contentDocument || iframe.contentWindow?.document
            if (doc) {
              const bodyText = doc.body?.innerText || doc.body?.textContent || ''
              if (
                bodyText.includes('File not found') ||
                bodyText.includes('not valid') ||
                bodyText.includes('not publicly accessible')
              ) {
                officePreviewError.value = true
              }
            } else {
              // 如果 iframe 高度为 0 或很小，可能是加载失败
              if (iframe.offsetHeight < 100) {
                officePreviewError.value = true
              }
            }
          } catch {
            // 跨域错误，无法判断，但可以检查 iframe 高度
            if (iframe.offsetHeight < 100) {
              officePreviewError.value = true
            }
          }
        }, 3000)
      }
    } catch {
      // 跨域错误，无法判断内容，使用超时检测
      setTimeout(() => {
        if (iframe.offsetHeight < 100) {
          officePreviewError.value = true
        }
      }, 3000)
    }
  }

  // 读取文本文件内容（支持多种编码，解决乱码问题）
  const readTextFile = async (file: UploadFile): Promise<string> => {
    let arrayBuffer: ArrayBuffer

    if (file.raw) {
      // 本地文件：读取为 ArrayBuffer
      arrayBuffer = await file.raw.arrayBuffer()
    } else if (file.url) {
      // 远程文件：如果是OSS文件，使用签名URL获取内容
      let fileUrl = file.url
      if (fileUrl.includes('.aliyuncs.com') || fileUrl.includes('oss-')) {
        fileUrl = await getOssSignatureUrl(fileUrl, 3600)
      }
      const response = await fetch(fileUrl)
      if (!response.ok) {
        throw new Error('获取文件内容失败')
      }
      arrayBuffer = await response.arrayBuffer()
    } else {
      throw new Error('无法读取文件')
    }

    // 尝试多种编码方式解析
    // 注意：浏览器原生只支持 UTF-8，GBK/GB2312 需要额外库支持
    // 这里先尝试 UTF-8，如果失败则使用非严格模式
    let text = ''
    try {
      // 优先尝试 UTF-8 严格模式
      const decoder = new TextDecoder('utf-8', { fatal: true })
      text = decoder.decode(arrayBuffer)
    } catch {
      // UTF-8 严格模式失败，使用非严格模式（可能显示乱码）
      const decoder = new TextDecoder('utf-8', { fatal: false })
      text = decoder.decode(arrayBuffer)
      // 提示用户如果显示乱码，可能是编码问题
      ElMessage.warning(
        '文件可能不是 UTF-8 编码，如果显示乱码，请使用下载功能后使用支持 GBK 编码的编辑器打开。'
      )
    }

    return text
  }

  // iframe加载错误处理
  const handleIframeError = () => {
    iframeError.value = true
  }

  // 下载文件（从预览弹窗）
  const downloadFile = async () => {
    if (!previewFileUrl.value || !previewFileName.value) {
      ElMessage.warning('无法获取文件信息，下载失败')
      return
    }

    try {
      let downloadUrl = previewFileUrl.value

      // 如果是本地文件（blob URL），直接下载
      if (downloadUrl.startsWith('blob:')) {
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = previewFileName.value
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        ElMessage.success('文件下载成功')
        return
      }

      // 对于远程文件（包括OSS文件，已经生成签名URL）
      // 使用 fetch 下载以确保可以处理跨域和下载文件名
      try {
        const response = await fetch(downloadUrl)
        if (!response.ok) {
          throw new Error(`下载失败: ${response.status}`)
        }
        const blob = await response.blob()

        // 创建下载链接
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = previewFileName.value
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()

        // 清理
        setTimeout(() => {
          document.body.removeChild(link)
          window.URL.revokeObjectURL(url)
        }, 100)

        ElMessage.success('文件下载成功')
      } catch (fetchError: any) {
        console.error('使用fetch下载失败:', fetchError)
        // 如果fetch失败（可能是CORS问题），尝试直接打开链接下载
        // 对于OSS签名URL，可以在URL后添加 response-content-disposition 参数
        let finalDownloadUrl = downloadUrl
        if (downloadUrl.includes('.aliyuncs.com') || downloadUrl.includes('oss-')) {
          // OSS文件，添加下载参数
          const urlObj = new URL(downloadUrl)
          urlObj.searchParams.set(
            'response-content-disposition',
            `attachment; filename="${encodeURIComponent(previewFileName.value)}"`
          )
          finalDownloadUrl = urlObj.toString()
        }
        // 创建隐藏的a标签触发下载
        const link = document.createElement('a')
        link.href = finalDownloadUrl
        link.download = previewFileName.value
        link.target = '_blank'
        link.style.display = 'none'
        document.body.appendChild(link)
        link.click()
        setTimeout(() => {
          document.body.removeChild(link)
        }, 100)
        ElMessage.success('文件下载已开始')
      }
    } catch (error: any) {
      console.error('下载文件失败:', error)
      ElMessage.error(error?.message || '下载文件失败，请稍后重试')
    }
  }

  // 通用下载文件函数
  const downloadFileByFile = async (file: UploadFile, fileName: string) => {
    if (!file) return

    try {
      // 获取文件URL
      let downloadUrl = file.url || ''
      if (!downloadUrl && file.raw) {
        downloadUrl = URL.createObjectURL(file.raw)
      }
      if (!downloadUrl) {
        ElMessage.error('文件URL不存在，无法下载')
        return
      }

      // 如果是OSS文件，生成签名URL用于下载
      if (downloadUrl.includes('.aliyuncs.com') || downloadUrl.includes('oss-')) {
        try {
          downloadUrl = await getOssSignatureUrl(downloadUrl, 3600)
        } catch (error) {
          console.error('生成下载URL失败:', error)
          ElMessage.error('生成下载链接失败')
          return
        }
      }

      // 如果是本地文件（blob URL），直接下载
      if (downloadUrl.startsWith('blob:')) {
        const link = document.createElement('a')
        link.href = downloadUrl
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        ElMessage.success('文件下载成功')
        return
      }

      // 对于远程文件，使用fetch下载（处理跨域问题）
      try {
        const response = await fetch(downloadUrl)
        if (!response.ok) {
          throw new Error('下载失败')
        }
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = fileName
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        // 释放URL
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 100)
        ElMessage.success('文件下载成功')
      } catch (error) {
        // 如果fetch失败，尝试直接打开链接
        console.warn('使用fetch下载失败，尝试直接打开链接:', error)
        window.open(downloadUrl, '_blank')
      }
    } catch (error: any) {
      console.error('下载文件失败:', error)
      ElMessage.error('下载文件失败，请稍后重试')
    }
  }

  // 处理文件点击事件（预览或下载）
  const handleFileClick = async (file: UploadFile) => {
    // Office文件和PDF文件使用新窗口打开预览
    if (isOfficeFile(file) || isPdf(file)) {
      try {
        // 获取文件URL
        const fileUrl = getPreviewUrl(file)

        // 如果是blob URL（本地文件，未上传），无法在新窗口预览
        if (fileUrl.startsWith('blob:')) {
          ElMessage.warning('文件需要先上传才能预览，请等待上传完成')
          // 如果文件正在上传或已上传失败，提示用户
          if (file.status === 'uploading') {
            ElMessage.info('文件正在上传中，请稍候...')
          } else if (file.status === 'fail') {
            ElMessage.error('文件上传失败，无法预览')
          } else {
            // 对于未上传的文件，直接下载
            // await downloadFileByFile(file, file.name || '')
          }
          return
        }

        // 获取可访问的预览URL（如果是OSS文件，会生成签名URL）
        let previewUrl = await getAccessiblePreviewUrl(file)

        // 如果是Office文件，使用Office Online Viewer
        if (isOfficeFile(file)) {
          const officeUrl = await getOfficePreviewUrl(file)
          if (officeUrl) {
            previewUrl = officeUrl
          } else {
            // 如果无法生成Office预览URL，使用原始URL
            if (!previewUrl) {
              previewUrl = fileUrl
            }
          }
        }
        console.log(previewUrl, 'previewUrlpreviewUrl')
        if (previewUrl && !previewUrl.startsWith('blob:')) {
          window.open(previewUrl, '_blank')
        } else {
          ElMessage.warning('无法获取文件预览链接，请确保文件已上传')
        }
      } catch (error: any) {
        console.error('打开文件预览失败:', error)
        ElMessage.error('打开文件预览失败，请稍后重试')
      }
      return
    }

    // 其他文件类型（图片、文本文件）使用弹窗预览
    if (props.showPreview && isPreviewable(file)) {
      await handlePreview(file)
    } else {
      // 否则直接下载
      await downloadFileByFile(file, file.name || '')
    }
  }

  // 文件选择变化处理（当 auto-upload 为 false 时使用此方法）
  const handleChange = (uploadFile: UploadFile) => {
    // 只处理新添加的文件（status 为 ready 或 uploading）
    if (uploadFile.status === 'ready' || uploadFile.status === 'uploading') {
      const file = uploadFile.raw
      if (!file) return

      // 检查文件数量（在添加新文件前，检查已有文件数量）
      const currentFileCount = internalFileList.value.filter(
        (item) => item.uid !== uploadFile.uid
      ).length
      if (currentFileCount >= props.maxCount) {
        ElMessage.error(`最多只能上传 ${props.maxCount} 个文件`)
        nextTick(() => removeInvalidFile(uploadFile))
        return
      }

      // 检查文件大小
      if (file.size > props.maxSize) {
        ElMessage.error(`文件大小不能超过 ${props.maxSize / 1024 / 1024}MB`)
        nextTick(() => removeInvalidFile(uploadFile))
        return
      }

      // 检查文件类型
      const fileName = file.name.toLowerCase()
      const acceptedTypes = props.accept.split(',').map((type) => type.trim().toLowerCase())
      const fileExtension = '.' + fileName.split('.').pop()?.toLowerCase()

      if (!acceptedTypes.includes(fileExtension)) {
        ElMessage.error(
          `不支持的文件类型，请上传允许的${props?.accept.replaceAll('.', '')}文件格式的文档`
        )
        nextTick(() => removeInvalidFile(uploadFile))
        return
      }

      // 如果是图片，创建预览URL
      if (isImage(uploadFile) && !uploadFile.url) {
        uploadFile.url = URL.createObjectURL(file)
      }

      // 设置状态为上传中
      uploadFile.status = 'uploading'
      // 上传到OSS
      uploadToOss(uploadFile, file)
    }
  }

  // 上传文件到OSS
  const uploadToOss = async (uploadFile: UploadFile, file: File) => {
    uploadPendingCount.value++
    ossUpload(uploadFile.name, file)
      .then((res: any) => {
        if (res.res.status === 200) {
          // 上传成功：先更新为 OSS URL，再在 nextTick 后释放 blob，避免 img 仍引用 blob 时被 revoke 导致 ERR_FILE_NOT_FOUND
          uploadFile.status = 'success'
          const oldBlobUrl =
            uploadFile.url && String(uploadFile.url).startsWith('blob:') ? uploadFile.url : null
          uploadFile.url = res.url
          // 更新 fileList - 通过创建新数组来触发响应式更新，避免直接修改导致响应式问题
          const currentList = internalFileList.value || []
          // 更新现有文件或添加新文件（使用 uploadFile.uid，因为 File 对象没有 uid 属性）
          const fileIndex = currentList.findIndex((item: any) => item.uid === uploadFile.uid)
          if (fileIndex > -1) {
            // 如果已存在，更新现有文件
            const updatedList = currentList.map((item: any, index: number) =>
              index === fileIndex
                ? {
                    ...item,
                    name: uploadFile.name || file.name,
                    url: res.url,
                    status: 'success',
                    uid: uploadFile.uid
                  }
                : item
            )
            internalFileList.value = updatedList
          } else {
            // 如果不存在，添加新文件
            const newFile = {
              name: uploadFile.name || file.name,
              url: res.url,
              status: 'success',
              uid: uploadFile.uid
            }
            internalFileList.value = [...currentList, newFile]
          }
          if (oldBlobUrl) {
            nextTick(() => {
              URL.revokeObjectURL(oldBlobUrl)
            })
          }
          if (props?.showMsg) {
            ElMessage.success('文件上传成功')
          }
        } else {
          // 上传失败，移除文件
          uploadFile.status = 'fail'
          ElMessage.error('文件上传失败')
          // 延迟移除失败的文件，确保状态更新后再移除
          setTimeout(() => {
            removeFailedFile(uploadFile)
          }, 100)
        }
      })
      .catch((error: any) => {
        // 上传出错，移除文件
        uploadFile.status = 'fail'
        console.error('OSS上传失败:', error)
        ElMessage.error(error?.message || '文件上传失败')
        // 延迟移除失败的文件，确保状态更新后再移除
        setTimeout(() => {
          removeFailedFile(uploadFile)
        }, 100)
      })
      .finally(() => {
        uploadPendingCount.value = Math.max(0, uploadPendingCount.value - 1)
      })
    // this.form.templateAccessory.push(this.GLOBAL.ossUrl + res.name);
    // try {
    //   // 生成唯一文件名
    //   const fileExtension = file.name.split('.').pop()?.toLowerCase() || ''
    //   const timestamp = Date.now()
    //   const randomStr = Math.random().toString(36).substring(2, 8)
    //   const filename = `${timestamp}_${randomStr}.${fileExtension}`

    //   // 调用ossUpload上传
    //   const res: any = await ossUpload(filename, file, props.fileFolder, true)

    //   if (res && res.res && res.res.status === 200) {
    //     // 上传成功
    //     uploadFile.status = 'success'
    //     uploadFile.url = ossUrl + res.name
    //     console.log(res, 'resresresres')
    //     uploadFile.response = res
    //     ElMessage.success('文件上传成功')
    //   } else {
    //     // 上传失败
    //     uploadFile.status = 'fail'
    //     ElMessage.error('文件上传失败')
    //   }
    // } catch (error: any) {
    //   // 上传出错
    //   uploadFile.status = 'fail'
    //   ElMessage.error(error?.message || '文件上传失败')
    //   console.error('OSS上传失败:', error)
    // } finally {
    //   // 更新文件列表以触发UI更新
    //   internalFileList.value = [...internalFileList.value]
    // }
  }

  // 移除校验失败的文件（从 ElUpload 和 fileList 中移除）
  const removeInvalidFile = (uploadFile: UploadFile) => {
    try {
      // 通过 ElUpload 的 handleRemove 移除，确保从组件内部列表清除
      uploadRef.value?.handleRemove?.(uploadFile)
    } catch {
      // 若 handleRemove 失败，则直接从 fileList 中移除
      const index = internalFileList.value.findIndex((item) => item.uid === uploadFile.uid)
      if (index > -1) {
        const newList = internalFileList.value.filter((item) => item.uid !== uploadFile.uid)
        internalFileList.value = newList
      }
    }
  }

  // 文件数量超出限制
  const handleExceed = () => {
    ElMessage.warning(`最多只能上传 ${props.maxCount} 个文件`)
  }

  // 移除失败的文件（内部方法）
  const removeFailedFile = (file: UploadFile) => {
    if (!file || !file.uid) {
      console.warn('无法移除文件：文件或文件uid不存在')
      return
    }

    // 从 fileList 中移除
    const index = internalFileList.value.findIndex((item) => item.uid === file.uid)
    if (index > -1) {
      // 如果是本地创建的URL，需要释放
      const fileItem = internalFileList.value[index]
      if (fileItem?.url && fileItem.url.startsWith('blob:')) {
        URL.revokeObjectURL(fileItem.url)
      }
      internalFileList.value.splice(index, 1)
      internalFileList.value = [...internalFileList.value]
    }

    // 同时从 uploadRef 中移除
    if (uploadRef.value) {
      try {
        const uploadFiles = uploadRef.value.fileList || []
        const uploadIndex = uploadFiles.findIndex((item: UploadFile) => item.uid === file.uid)
        if (uploadIndex > -1) {
          uploadFiles.splice(uploadIndex, 1)
        }
      } catch (error) {
        console.error('从 uploadRef 移除文件失败:', error)
      }
    }
  }

  // 删除文件
  const handleRemove = (file: UploadFile) => {
    const index = internalFileList.value.findIndex((item) => item.uid === file.uid)
    if (index > -1) {
      // 如果是本地创建的URL，需要释放
      if (file.url && file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url)
      }
      // 创建新数组并触发更新，确保父组件的 watch 能捕获变化
      const newFileList = internalFileList.value.filter((item) => item.uid !== file.uid)
      internalFileList.value = newFileList
    }
  }

  // 预览文件
  const handlePreview = async (file: UploadFile) => {
    previewFile.value = file
    previewFileName.value = file.name || ''
    textContent.value = ''
    iframeError.value = false
    officePreviewError.value = false
    officePreviewUrl.value = ''
    previewVisible.value = true

    try {
      // 如果是Office文件，需要特殊处理
      if (isOfficeFile(file)) {
        try {
          // 获取可访问的预览URL（如果是OSS文件，会生成签名URL）
          previewFileUrl.value = await getAccessiblePreviewUrl(file)

          // 生成Office预览URL
          officePreviewUrl.value = await getOfficePreviewUrl(file)

          // 如果无法预览（本地文件或生成失败），显示提示
          if (!officePreviewUrl.value) {
            officePreviewError.value = true
            ElMessage.warning('Office文档预览失败，请确保文件已上传到服务器')
          }
        } catch (error: any) {
          console.error('处理Office文件预览失败:', error)
          officePreviewError.value = true
          ElMessage.error('获取Office预览链接失败')
        }
      } else {
        // 其他文件类型，获取可访问的预览URL
        previewFileUrl.value = await getAccessiblePreviewUrl(file)
      }

      // 如果是文本文件，读取内容
      if (isTextFile(file)) {
        try {
          textContent.value = await readTextFile(file)
        } catch (error: any) {
          console.error('读取文本文件失败:', error)
          ElMessage.error('读取文件内容失败')
          textContent.value = '读取文件内容失败'
        }
      }
    } catch (error: any) {
      console.error('获取预览URL失败:', error)
      ElMessage.error('获取预览链接失败，请稍后重试')
      previewFileUrl.value = getPreviewUrl(file) // 使用原始URL作为备选
    }
  }

  // 监听预览弹窗关闭，释放URL
  watch(previewVisible, (visible) => {
    if (!visible) {
      if (previewFileUrl.value && previewFileUrl.value.startsWith('blob:')) {
        URL.revokeObjectURL(previewFileUrl.value)
      }
      // 重置状态
      textContent.value = ''
      iframeError.value = false
      officePreviewError.value = false
      officePreviewUrl.value = ''
      previewFile.value = null
      previewFileUrl.value = ''
      previewFileName.value = ''
    }
  })
</script>

<style lang="scss" scoped>
  .file-upload-wrapper {
    width: 100%;

    .file-upload {
      width: 100%;
    }

    // 隐藏进度条，改在文件名侧展示「上传中」环形图标（见 .is-uploading / .is-ready）
    :deep(.el-upload-list__item) {
      .el-progress {
        display: none !important;
      }
    }

    @keyframes upload-custom-spin {
      to {
        transform: rotate(360deg);
      }
    }

    :deep(.el-upload-list__item.is-uploading .el-upload-list__item-file-name),
    :deep(.el-upload-list__item.is-ready .el-upload-list__item-file-name) {
      display: inline-flex;
      align-items: center;

      &::before {
        box-sizing: border-box;
        flex-shrink: 0;
        width: 14px;
        height: 14px;
        margin-right: 6px;
        content: '';
        border: 2px solid var(--el-color-primary-light-7);
        border-top-color: var(--el-color-primary);
        border-radius: 50%;
        animation: upload-custom-spin 0.75s linear infinite;
      }
    }
  }
</style>

<style lang="scss">
  .preview-dialog {
    .header-download-btn {
      float: right;
    }

    .preview-content {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;

      .image-preview-wrapper {
        position: relative;
        display: flex;
        align-items: center;
        justify-content: center;
        width: 100%;
      }

      .text-preview {
        position: relative;
        width: 100%;
        height: 70vh;
        padding: 16px;
        overflow: auto;
        background: #f5f5f5;
        border-radius: 4px;

        pre {
          padding: 0;
          margin: 0;
          font-family: 'Courier New', Courier, monospace;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          word-wrap: break-word;
          white-space: pre-wrap;
        }

        .loading-text {
          padding: 20px;
          color: #909399;
          text-align: center;
        }
      }

      .other-file-preview {
        width: 100%;
        height: 70vh;
      }

      .preview-placeholder {
        color: #909399;
        text-align: center;

        .file-name {
          margin-top: 16px;
          font-size: 14px;
        }
      }
    }
  }
</style>
