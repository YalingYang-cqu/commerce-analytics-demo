<template>
  <div class="file-upload-wrapper" :class="{ 'single-mode': singleMode }">
    <ElUpload
      ref="uploadRef"
      v-model:file-list="fileList"
      :auto-upload="autoUpload"
      :limit="maxCount"
      :on-exceed="handleExceed"
      :on-change="handleChange"
      :on-remove="handleRemove"
      :on-preview="handleFileClick"
      :accept="accept"
      :disabled="disabled"
      :list-type="listType"
      class="file-upload"
      :class="{ 'is-hidden': singleMode && fileList.length >= maxCount }"
    >
      <template #trigger>
        <slot name="trigger">
          <ElButton
            v-if="!singleMode || fileList.length === 0"
            :type="buttonType"
            :icon="buttonIcon"
            :disabled="disabled"
            link
          >
            {{ buttonText }}
          </ElButton>
        </slot>
      </template>
    </ElUpload>
    <!-- 文件预览弹窗 -->
    <ElDialog v-if="showPreview" v-model="previewVisible" :width="previewDialogWidth" align-center>
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
  import { ossUpload, ossUrl, getOssSignatureUrl } from '@/utils/ali-oss'

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
    /** 单文件上传模式 - 上传后自动隐藏上传按钮 */
    singleMode?: boolean
    /** 值字段名，用于从文件对象中提取值，默认为整个文件对象 */
    valueField?: string
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
    singleMode: false,
    valueField: undefined
  })

  const emit = defineEmits<{
    'update:modelValue': [files: any[]]
    'upload-success': [file: any]
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

  // 文件列表（双向绑定到 ElUpload，同时同步到父组件）
  const fileList = computed({
    get: () => props.modelValue || [],
    set: (val) => emit('update:modelValue', val || [])
  })

  // 判断是否为图片（支持用户要求的图像文件类型）
  const isImage = (file: UploadFile | null): boolean => {
    if (!file) return false
    const imageTypes = ['.jpg', '.jpeg', '.png', '.bmp', '.gif']
    const fileName = file.name?.toLowerCase() || ''
    return imageTypes.some((type) => fileName.endsWith(type))
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

  // 获取文件URL用于预览（兼容接口返回的 picsUrl、rawUrl、file、attachment 等字段）
  const getPreviewUrl = (file: UploadFile): string => {
    const f = file as UploadFile & { rawUrl?: string; picsUrl?: string; file?: string; attachment?: string }
    if (f.url) return f.url
    if (f.rawUrl) return f.rawUrl
    if (f.picsUrl) return f.picsUrl
    if (f.file) return f.file
    if (f.attachment) return f.attachment
    if (file.raw) return URL.createObjectURL(file.raw)
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

  // 读取文本文件内容
  const readTextFile = async (file: UploadFile): Promise<string> => {
    if (file.raw) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = (e) => {
          resolve((e.target?.result as string) || '')
        }
        reader.onerror = () => {
          reject(new Error('读取文件失败'))
        }
        reader.readAsText(file.raw, 'UTF-8')
      })
    }
    const fileUrl = getPreviewUrl(file)
    if (fileUrl) {
      // 如果是OSS文件，使用签名URL获取内容
      let url = fileUrl
      if (url.includes('.aliyuncs.com') || url.includes('oss-')) {
        url = await getOssSignatureUrl(url, 3600)
      }
      const response = await fetch(url)
      if (!response.ok) {
        throw new Error('获取文件内容失败')
      }
      const text = await response.text()
      return text
    }
    throw new Error('无法读取文件')
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
      // 获取文件URL（兼容 url / rawUrl / picsUrl 等）
      let downloadUrl = getPreviewUrl(file)
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
      const currentFileCount = fileList.value.filter((item) => item.uid !== uploadFile.uid).length
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
        ElMessage.error('不支持的文件类型，请上传允许的xlsx, xls文件格式的文档')
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
    try {
      const res: any = await ossUpload(uploadFile.name, file)

      // OSS SDK put() 可能返回 res.res + res.name，不一定会返回 res.url，需用 ossUrl + name 拼完整地址
      const fileUrl = res?.url || (res?.name ? `${ossUrl}${res.name}` : '') || ''
      const success = res && res.res && res.res.status === 200

      if (success && fileUrl) {
        // 私有 OSS 直链可能 403，缩略图会“加载失败”。用签名 URL 作为展示地址，保证列表和父组件里的图片能正常显示
        let displayUrl = fileUrl
        const isOssUrl =
          (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) &&
          (fileUrl.includes('.aliyuncs.com') || fileUrl.includes('oss-'))
        if (isOssUrl) {
          try {
            displayUrl = await getOssSignatureUrl(fileUrl)
          } catch (e) {
            console.warn('生成 OSS 签名 URL 失败，使用直链:', e)
          }
        }

        const hadBlob =
          uploadFile.url && String(uploadFile.url).startsWith('blob:')
        const oldBlobToRevoke = hadBlob ? (uploadFile.url as string) : null
        // 用 File 新建 blob URL 作为展示，避免 ElUpload 更新列表时 revoke 原 blob 导致「加载失败」；提交时用 rawUrl
        const finalUrl =
          hadBlob && file
            ? URL.createObjectURL(file)
            : hadBlob
              ? (uploadFile.url as string)
              : displayUrl

        uploadFile.status = 'success'
        uploadFile.url = finalUrl

        const index = fileList.value.findIndex((item) => item.uid === uploadFile.uid)

        if (index > -1) {
          fileList.value[index] = {
            ...fileList.value[index],
            name: uploadFile.name,
            url: finalUrl,
            uid: uploadFile.uid,
            id: res.id || res.attachmentId,
            status: 'success',
            rawUrl: fileUrl
          }
        } else {
          fileList.value.push({
            name: uploadFile.name,
            url: finalUrl,
            uid: uploadFile.uid,
            id: res.id || res.attachmentId,
            status: 'success',
            rawUrl: fileUrl
          })
        }

        emit('update:modelValue', [...fileList.value])
        const updatedFile = fileList.value.find((f) => f.uid === uploadFile.uid)
        if (updatedFile) {
          emit('upload-success', updatedFile)
        }
        // 若已用 File 新建了 blob 展示，延迟释放旧 blob，避免重复占用
        if (hadBlob && file && oldBlobToRevoke && oldBlobToRevoke !== finalUrl) {
          setTimeout(() => {
            try {
              URL.revokeObjectURL(oldBlobToRevoke)
            } catch (_) {}
          }, 500)
        }
        ElMessage.success('文件上传成功')
      } else {
        uploadFile.status = 'fail'
        ElMessage.error('文件上传失败')
      }
    } catch (error: any) {
      uploadFile.status = 'fail'
      ElMessage.error(error?.message || '文件上传失败')
      console.error('OSS上传失败:', error)
    }
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
    //   fileList.value = [...fileList.value]
    // }
  }

  // 移除校验失败的文件（从 ElUpload 和 fileList 中移除）
  const removeInvalidFile = (uploadFile: UploadFile) => {
    try {
      // 通过 ElUpload 的 handleRemove 移除，确保从组件内部列表清除
      uploadRef.value?.handleRemove?.(uploadFile)
    } catch {
      // 若 handleRemove 失败，则直接从 fileList 中移除
      const index = fileList.value.findIndex((item) => item.uid === uploadFile.uid)
      if (index > -1) {
        const newList = fileList.value.filter((item) => item.uid !== uploadFile.uid)
        fileList.value = newList
        emit('update:modelValue', newList)
      }
    }
  }

  // 文件数量超出限制
  const handleExceed = () => {
    ElMessage.warning(`最多只能上传 ${props.maxCount} 个文件`)
  }

  // 删除文件
  const handleRemove = (file: UploadFile) => {
    const index = fileList.value.findIndex((item) => item.uid === file.uid)
    if (index > -1) {
      // 如果是本地创建的URL，需要释放
      if (file.url && file.url.startsWith('blob:')) {
        URL.revokeObjectURL(file.url)
      }
      fileList.value.splice(index, 1)
      fileList.value = [...fileList.value]
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
    .file-upload {
      width: 100%;

      // 隐藏 hover 时显示的「按 Delete 键可删除」文案，避免与文件名重叠影响观感
      :deep(.el-upload-list__item .el-icon__close-tip),
      :deep(.el-upload-list__item i[class*='close-tip']) {
        display: none !important;
      }

      // Fix hover issue for picture-card delete button
      :deep(.el-upload-list--picture-card) {
        .el-upload-list__item {
          position: relative;
          overflow: hidden;
          background-color: #fafafa;
          border: 1px solid var(--el-border-color-lighter);

          // Ensure the hover overlay stays visible when hovering over action buttons
          &:hover .el-upload-list__item-actions {
            opacity: 1;
          }

          // 图片缩略图样式
          .el-upload-list__item-thumbnail {
            object-fit: contain;
            background-color: #fff;
          }

          // 图片加载失败时显示占位图标
          &.is-success {
            .el-upload-list__item-thumbnail {
              &:not([src]),
              &[src=''],
              &[src='undefined'],
              &[src='null'] {
                visibility: hidden;
              }
            }

            // 当图片URL为空时显示占位图标
            &:has(.el-upload-list__item-thumbnail:not([src])),
            &:has(.el-upload-list__item-thumbnail[src='']),
            &:has(.el-upload-list__item-thumbnail[src='undefined']),
            &:has(.el-upload-list__item-thumbnail[src='null']) {
              &::before {
                position: absolute;
                top: 50%;
                left: 50%;
                z-index: 1;
                width: 32px;
                height: 32px;
                content: '';
                background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1024 1024' fill='%23c0c4cc'%3E%3Cpath d='M96 896a32 32 0 0 1-32-32V160a32 32 0 0 1 32-32h832a32 32 0 0 1 32 32v704a32 32 0 0 1-32 32H96zm315.52-228.48l-68.928-68.928a32 32 0 0 0-45.248 0L128 768.064h778.688l-242.112-290.56a32 32 0 0 0-49.216 0L458.752 665.408a32 32 0 0 1-47.232 2.112zM256 384a96 96 0 1 0 192 0 96 96 0 0 0-192 0z'/%3E%3C/svg%3E");
                background-repeat: no-repeat;
                background-size: contain;
                transform: translate(-50%, -50%);
              }
            }
          }

          .el-upload-list__item-actions {
            background-color: rgb(0 0 0 / 50%);
            transition: opacity 0.3s;

            // Extend the clickable area to prevent hover breaking
            span {
              padding: 4px;
              margin: 0 2px;
              cursor: pointer;
            }
          }
        }
      }

      // picture-card上传按钮样式
      :deep(.el-upload--picture-card) {
        border-radius: 4px;
        transition: all 0.3s;

        &:hover {
          border-color: var(--el-color-primary);
        }
      }
    }

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

  // Single mode styles - hide trigger when file is uploaded
  .file-upload-wrapper.single-mode {
    :deep(.el-upload-list--picture-card) {
      display: grid;
      grid-template-rows: 1fr;
      grid-template-columns: 1fr;

      // Place all items in the same grid cell to overlap them
      .el-upload-list__item,
      .el-upload--picture-card {
        grid-row: 1;
        grid-column: 1;
      }

      // Uploaded image should be on top
      .el-upload-list__item {
        z-index: 2;
      }

      // Upload trigger should be behind
      .el-upload--picture-card {
        z-index: 1;

        &.is-hidden {
          display: none;
        }
      }
    }
  }
</style>
