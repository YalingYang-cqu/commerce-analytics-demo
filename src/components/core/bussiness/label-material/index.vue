<template>
  <!-- 标签资料图标 -->
  <el-icon class="label-style" @click="handleOpenDialog">
    <Tickets />
  </el-icon>

  <!-- 标签资料弹窗 -->
  <ElDialog
    v-model="dialogVisible"
    title="标签资料"
    width="1200px"
    :close-on-click-modal="false"
    @close="handleClose"
    append-to-body
  >
    <div class="label-material-dialog">
      <!-- 上传资料按钮 -->
      <div class="upload-section" v-if="!readonly && showHandle">
        <ElButton @click="handleUpload"> 上传资料 </ElButton>
      </div>

      <!-- 表格 -->
      <ElTable :data="tableData" border style="width: 100%">
        <ElTableColumn prop="labelType" label="标签类型" min-width="120" />
        <ElTableColumn prop="content" label="留言内容" min-width="150" />
        <ElTableColumn prop="labelName" label="名称" min-width="150" />
        <ElTableColumn prop="uploadTime" label="上传时间" min-width="180" />
        <ElTableColumn prop="operatingEnd" label="操作端" min-width="100" />
        <ElTableColumn prop="operatingByName" label="操作人" min-width="100" />
        <ElTableColumn label="操作" :width="readonly ? 120 : 180" align="center" fixed="right">
          <template #default="{ row, $index }">
            <span class="action-link" @click="handleView(row)">查看</span>
            <span class="action-link" @click="handleDownload(row)">下载</span>
            <span v-if="!readonly && showHandle" class="action-link" @click="handleDelete($index)"
              >删除</span
            >
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </ElDialog>

  <!-- 上传资料弹窗 -->
  <UploadMaterialDialog v-model="uploadDialogVisible" @confirm="handleUploadConfirm" />
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import {
    ElDialog,
    ElButton,
    ElIcon,
    ElTable,
    ElTableColumn,
    ElMessage,
    ElMessageBox
  } from 'element-plus'
  import { Tickets } from '@element-plus/icons-vue'
  import UploadMaterialDialog from './upload-material-dialog.vue'
  import { fileLinkToStreamDownload } from '@/utils/common-util'
  import dayjs from 'dayjs'

  interface Props {
    currentRow: any // 行数据，用于获取关联的标签资料
    readonly?: boolean
    showHandle?: boolean
    rowId?: string | number
  }

  // 标签资料数据结构（与API保持一致）
  interface LabelMaterialItem {
    labelType: string // 标签类型
    content?: string // 留言内容
    labelName: string // 文件名称
    labelUrl?: string // 文件URL
    uploadTime?: string // 上传时间
    operatingEnd: string // 操作端
    operatingByName: string // 操作人名称
    operatingBy?: any // 操作人ID（内部使用）
  }

  interface Emits {
    (
      e: 'updateLabelAction',
      data: { id: any; labelMaterial: LabelMaterialItem[]; updateTimeAction: any }
    ): void
  }

  const props = withDefaults(defineProps<Props>(), {
    currentRow: undefined,
    readonly: false,
    showHandle: true,
    rowId: 'id'
  })

  const emit = defineEmits<Emits>()

  const dialogVisible = ref(false)
  const uploadDialogVisible = ref(false)

  // 表格数据
  const tableData = ref<LabelMaterialItem[]>([])

  // 打开弹窗
  const handleOpenDialog = () => {
    dialogVisible.value = true
  }

  // 监听弹窗打开：必须拷贝一份，避免多行共享同一数组引用导致“第二行覆盖第一行”
  watch(
    () => dialogVisible.value,
    (newVal) => {
      if (newVal) {
        const raw = props?.currentRow?.labelMaterial
        if (raw && Array.isArray(raw) && raw.length > 0) {
          tableData.value = raw.map((item: any) => ({ ...item }))
        } else {
          tableData.value = []
        }
      }
    }
  )

  // 关闭弹窗
  const handleClose = () => {
    dialogVisible.value = false
  }

  // 上传资料
  const handleUpload = () => {
    uploadDialogVisible.value = true
  }
  const updateTimeAction = (dataC: string) => {
    tableData.value = tableData.value?.map((v: any) => ({
      ...v,
      uploadTime: dayjs(v.uploadTime ?? dataC).format('YYYY-MM-DD HH:mm:ss')
    }))
    // eslint-disable-next-line vue/no-mutating-props
    props.currentRow.labelMaterial = [...tableData.value]
  }
  // 上传资料确认
  const handleUploadConfirm = async (data: { labelType: string; content: string; file: any[] }) => {
    const userInfo: any = localStorage.getItem('userInfo')
    const userId = JSON.parse(userInfo).userId
    const userName = JSON.parse(userInfo).userName
    const newItem: LabelMaterialItem = {
      labelType: data.labelType,
      content: data.content,
      labelName: data.file[0]?.name || '未命名文件',
      labelUrl: data.file[0]?.url,
      operatingBy: userId,
      operatingEnd: '业务端',
      operatingByName: userName
    }
    tableData.value.push(newItem)

    // 始终同步到 currentRow，确保父组件（如 single.vue）的表格行能拿到最新数据

    if (props.currentRow && typeof props.currentRow === 'object') {
      // eslint-disable-next-line vue/no-mutating-props
      props.currentRow.labelMaterial = [...tableData.value]
    }

    // 触发 updateLabelAction 事件（供父组件做 API 等处理）
    // 新增模式下行无 id，用 productSkuId 标识，否则查找会命中第一行导致“第一个被最后一个覆盖”
    const rowId =
      props.currentRow?.[props?.rowId] ??
      props.currentRow?.id ??
      props.currentRow?.productSkuId ??
      props.currentRow?.skuId
    emit('updateLabelAction', {
      id: rowId,
      labelMaterial: tableData.value,
      updateTimeAction
    })
  }

  // 获取文件扩展名
  const getFileExtension = (labelName: string): string => {
    if (!labelName) return ''
    const lastDotIndex = labelName.lastIndexOf('.')
    if (lastDotIndex === -1) return ''
    return labelName.substring(lastDotIndex + 1).toLowerCase()
  }

  // 判断文件是否支持查看（在新页面打开）
  const isViewableFile = (labelName: string): boolean => {
    const extension = getFileExtension(labelName)
    const viewableExtensions = [
      'docx',
      'doc',
      'pdf',
      'txt',
      'xlsx',
      'xls',
      'csv',
      'ppt',
      'pptx',
      'jpg',
      'jpeg',
      'png',
      'bmp',
      'gif'
    ]
    return viewableExtensions.includes(extension)
  }

  // 判断是否为图片文件
  const isImageFile = (labelName: string): boolean => {
    const extension = getFileExtension(labelName)
    return ['jpg', 'jpeg', 'png', 'bmp', 'gif'].includes(extension)
  }

  // 判断是否为 Office 文档
  const isOfficeFile = (labelName: string): boolean => {
    const extension = getFileExtension(labelName)
    return ['docx', 'doc', 'xlsx', 'xls', 'ppt', 'pptx'].includes(extension)
  }

  // 判断是否为文本文件
  const isTextFile = (labelName: string): boolean => {
    const extension = getFileExtension(labelName)
    return ['txt', 'csv'].includes(extension)
  }

  // 使用 Office Online Viewer 预览 Office 文档
  const openWithOfficeViewer = (labelUrl: string) => {
    // Office Online Viewer 需要公开可访问的 URL
    const viewerUrl = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(labelUrl)}`
    window.open(viewerUrl, '_blank')
  }

  // 打开文本文件（解决编码乱码问题）
  const openTextFile = async (labelUrl: string, labelName: string) => {
    try {
      // 获取文件内容
      const response = await fetch(labelUrl)
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      // 获取 ArrayBuffer
      const arrayBuffer = await response.arrayBuffer()

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
        ElMessage.warning(
          '文件可能不是 UTF-8 编码，如果显示乱码，请使用下载功能后使用支持 GBK 编码的编辑器打开。'
        )
      }

      // 转义 HTML 特殊字符
      const escapedText = text
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;')

      // 创建 HTML 内容
      const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${labelName}</title>
  <style>
    body {
      font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
      font-size: 14px;
      line-height: 1.6;
      padding: 20px;
      background-color: #fff;
      color: #333;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  </style>
</head>
<body>${escapedText}</body>
</html>
      `

      // 创建 Blob 并打开
      const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
      const blobUrl = URL.createObjectURL(blob)
      const newWindow = window.open(blobUrl, '_blank')

      if (newWindow) {
        // 清理 URL 对象
        setTimeout(() => {
          URL.revokeObjectURL(blobUrl)
        }, 100)
      } else {
        throw new Error('无法打开新窗口')
      }
    } catch (error) {
      console.error('打开文本文件失败:', error)
      // 如果打开失败，尝试直接下载
      await downloadFile(labelUrl, labelName)
    }
  }

  // 打开图片文件（使用 HTML 页面包装，避免被下载）
  const openImageFile = (labelUrl: string, labelName: string) => {
    // 创建包含图片的 HTML 页面
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${labelName}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      background-color: #f5f5f5;
      padding: 20px;
    }
    img {
      max-width: 100%;
      max-height: 100vh;
      object-fit: contain;
      box-shadow: 0 2px 8px rgba(0,0,0,0.1);
    }
  </style>
</head>
<body>
  <img src="${labelUrl.replace(/"/g, '&quot;')}" alt="${labelName.replace(/"/g, '&quot;')}" />
</body>
</html>
    `

    // 创建 Blob 并打开
    const blob = new Blob([htmlContent], { type: 'text/html;charset=utf-8' })
    const blobUrl = URL.createObjectURL(blob)
    const newWindow = window.open(blobUrl, '_blank')

    if (newWindow) {
      // 清理 URL 对象
      setTimeout(() => {
        URL.revokeObjectURL(blobUrl)
      }, 100)
    } else {
      // 如果无法打开新窗口，尝试直接打开图片
      window.open(labelUrl, '_blank')
    }
  }

  // 尝试在新窗口打开文件（如果失败则下载）
  const tryOpenFile = async (labelUrl: string, labelName: string) => {
    try {
      // 对于图片文件，使用特殊方式打开，避免被下载
      if (isImageFile(labelName)) {
        openImageFile(labelUrl, labelName)
        return
      }

      // 对于 PDF，直接打开
      if (getFileExtension(labelName) === 'pdf') {
        window.open(labelUrl, '_blank')
        return
      }

      // 对于其他文件类型，先检查服务器响应头
      const response = await fetch(labelUrl, { method: 'HEAD' })
      const contentDisposition = response.headers.get('content-disposition') || ''

      // 如果服务器设置了强制下载头，则直接下载
      if (contentDisposition.toLowerCase().includes('attachment')) {
        throw new Error('服务器强制下载')
      }

      // 尝试打开
      window.open(labelUrl, '_blank')
    } catch (error) {
      // 如果打开失败，则下载
      console.warn('打开文件失败，改为下载:', error)
      await downloadFile(labelUrl, labelName)
    }
  }

  // 下载文件
  const downloadFile = async (labelUrl: string, labelName: string) => {
    try {
      let downloadFileName = labelName || '下载文件'

      // 如果 labelName 包含路径，只取文件名部分
      if (downloadFileName.includes('/')) {
        downloadFileName = downloadFileName.substring(downloadFileName.lastIndexOf('/') + 1)
      }

      // 如果文件名没有扩展名，尝试从 URL 中提取
      if (!downloadFileName.includes('.')) {
        const urlMatch = labelUrl.match(/\.([a-zA-Z0-9]+)(\?|$)/)
        if (urlMatch) {
          downloadFileName = `${downloadFileName}.${urlMatch[1]}`
        }
      }

      await fileLinkToStreamDownload(labelUrl, downloadFileName)
      ElMessage.success('文件下载成功')
    } catch (error: any) {
      console.error('下载失败:', error)
      ElMessage.error(error?.message || '下载文件失败，请稍后重试')
    }
  }

  // 查看
  const handleView = async (row: LabelMaterialItem) => {
    if (!row.labelUrl) {
      ElMessage.warning('文件地址不存在')
      return
    }

    const fileName = row.labelName || ''

    // 判断文件类型并采用不同的处理方式
    if (isViewableFile(fileName)) {
      // Office 文档：尝试使用 Office Online Viewer，如果失败则下载
      if (isOfficeFile(fileName)) {
        try {
          openWithOfficeViewer(row.labelUrl)
        } catch (error) {
          console.warn('Office 在线预览失败，改为下载:', error)
          await downloadFile(row.labelUrl, fileName)
        }
      } else if (isTextFile(fileName)) {
        // 文本文件（txt、csv）：使用特殊处理解决编码问题
        await openTextFile(row.labelUrl, fileName)
      } else {
        // 其他支持查看的文件类型（图片、PDF），尝试打开
        await tryOpenFile(row.labelUrl, fileName)
      }
    } else {
      // 不支持查看的文件类型，直接下载
      await downloadFile(row.labelUrl, fileName)
    }
  }

  // 下载
  const handleDownload = async (row: LabelMaterialItem) => {
    if (!row.labelUrl) {
      ElMessage.warning('文件地址不存在')
      return
    }

    try {
      let fileName = row.labelName || '下载文件'

      // 如果文件名包含路径，只取文件名部分
      if (fileName.includes('/')) {
        fileName = fileName.substring(fileName.lastIndexOf('/') + 1)
      }

      // 如果文件名没有扩展名，尝试从 URL 中提取
      if (!fileName.includes('.')) {
        const urlMatch = row.labelUrl.match(/\.([a-zA-Z0-9]+)(\?|$)/)
        if (urlMatch) {
          fileName = `${fileName}.${urlMatch[1]}`
        }
      }

      await fileLinkToStreamDownload(row.labelUrl, fileName)
      ElMessage.success('文件下载成功')
    } catch (error: any) {
      console.error('下载失败:', error)
      ElMessage.error(error?.message || '下载文件失败，请稍后重试')
    }
  }

  // 删除
  const handleDelete = (index: number) => {
    const row = tableData.value[index]
    if (!row) return

    ElMessageBox.confirm(`确认删除文件 "${row.labelName}" 吗？`, '提示', {
      confirmButtonText: '确认',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        if (index > -1 && index < tableData.value.length) {
          tableData.value.splice(index, 1)
        }

        // 始终同步到 currentRow
        if (props.currentRow && typeof props.currentRow === 'object') {
          // eslint-disable-next-line vue/no-mutating-props
          props.currentRow.labelMaterial = [...tableData.value]
        }

        // 触发 updateLabelAction 事件（同上，用 productSkuId 兼容新增模式）
        const rowId = props.currentRow?.id ?? props.currentRow?.productSkuId
        emit('updateLabelAction', {
          id: rowId,
          labelMaterial: tableData.value,
          updateTimeAction
        })
      })
      .catch(() => {})
  }
</script>

<style lang="scss" scoped>
  .label-style {
    color: #409eff;
    cursor: pointer;
    transition: color 0.3s;

    &:hover {
      color: #66b1ff;
    }
  }

  .label-material-dialog {
    .upload-section {
      margin-bottom: 16px;
    }

    :deep(.el-table) {
      .el-table__cell {
        padding: 8px 0;
      }
    }

    .action-link {
      margin-right: 12px;
      color: #409eff;
      cursor: pointer;

      &:hover {
        color: #66b1ff;
      }

      &:last-child {
        margin-right: 0;
      }
    }
  }
</style>
