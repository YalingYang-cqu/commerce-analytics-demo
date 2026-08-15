<template>
  <div class="compliance-info-detail">
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">合规认证</span>
      </div>

      <div class="compliance-table-wrapper">
        <ElTable
          :data="certificationList"
          border
          stripe
          style="width: 100%"
          :empty-text="'暂无合规认证信息'"
        >
          <ElTableColumn type="index" label="序号" width="60" align="center" />
          <ElTableColumn label="认证类型" min-width="120" prop="certificationType">
            <template #default="{ row }">
              <ElTooltip
                :content="(row.certificationType && String(row.certificationType).trim()) || '-'"
                placement="top"
                effect="dark"
              >
                <span class="cell-ellipsis">{{ row.certificationType || '-' }}</span>
              </ElTooltip>
            </template>
          </ElTableColumn>
          <ElTableColumn
            label="认证机构"
            min-width="150"
            prop="certificationAgency"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{
                row.certificationAgency
                  ? row.certificationAgency.length > 50
                    ? row.certificationAgency.slice(0, 50) + '...'
                    : row.certificationAgency
                  : '-'
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="国家" min-width="120" prop="country">
            <template #default="{ row }">
              {{ formatComplianceCountries(row.country) }}
            </template>
          </ElTableColumn>
          <ElTableColumn
            label="申请公司"
            min-width="150"
            prop="applicantCompany"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{
                row.applicantCompany
                  ? row.applicantCompany.length > 50
                    ? row.applicantCompany.slice(0, 50) + '...'
                    : row.applicantCompany
                  : '-'
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="测试时间" min-width="120" prop="testDate">
            <template #default="{ row }">
              {{ row.testDate || '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="发布时间" min-width="120" prop="issueDate">
            <template #default="{ row }">
              {{ row.issueDate || '-' }}
            </template>
          </ElTableColumn>
          <ElTableColumn
            label="证书编号"
            min-width="150"
            prop="certificateNumber"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              {{
                row.certificateNumber
                  ? row.certificateNumber.length > 50
                    ? row.certificateNumber.slice(0, 50) + '...'
                    : row.certificateNumber
                  : '-'
              }}
            </template>
          </ElTableColumn>
          <ElTableColumn label="附件" min-width="200" prop="attachment">
            <template #default="{ row }">
              <div v-if="row.attachment" class="attachment-list">
                <template v-if="Array.isArray(parseAttachment(row.attachment))">
                  <div
                    v-for="(file, index) in parseAttachment(row.attachment)"
                    :key="index"
                    class="attachment-item"
                  >
                    <span class="attachment-link-wrap">
                      <ElIcon
                        class="attachment-download-icon"
                        title="下载"
                        @click.stop.prevent="handleDownload(file)"
                      >
                        <Download />
                      </ElIcon>
                      <button
                        type="button"
                        class="attachment-name-btn"
                        title="查看"
                        @click.prevent.stop="handlePreview(file)"
                      >
                        {{ file.name }}
                      </button>
                    </span>
                  </div>
                </template>
                <template v-else>
                  <span class="attachment-link-wrap">
                    <ElIcon
                      class="attachment-download-icon"
                      title="下载"
                      @click.stop.prevent="handleDownloadText(row.attachment)"
                    >
                      <Download />
                    </ElIcon>
                    <span
                      class="attachment-name-btn attachment-name-text"
                      @click.stop.prevent="handleDownloadText(row.attachment)"
                    >
                      {{ row.attachment }}
                    </span>
                  </span>
                </template>
              </div>
              <span v-else>-</span>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </div>

    <!-- 附件预览弹窗：在页面内打开，避免被服务器 Content-Disposition 触发下载 -->
    <ElDialog
      v-model="previewVisible"
      :title="previewFileName"
      width="80%"
      align-center
      append-to-body
      class="attachment-preview-dialog"
      @closed="previewUrl = ''"
    >
      <div v-if="previewUrl" class="preview-content">
        <ElImage
          v-if="isImageFile(previewFileName)"
          :src="previewUrl"
          fit="contain"
          style="max-width: 100%; max-height: 70vh"
        />
        <iframe v-else :src="previewUrl" class="preview-iframe" title="附件预览" />
      </div>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, onMounted } from 'vue'
  import {
    ElTable,
    ElTableColumn,
    ElTooltip,
    ElIcon,
    ElMessage,
    ElDialog,
    ElImage
  } from 'element-plus'
  import { Download } from '@element-plus/icons-vue'
  import { getOssSignatureUrl } from '@/utils/ali-oss'
  import { pubCountryList } from '@/utils'
  import { normalizeComplianceCountryToCodes } from '@/utils/compliance-country'

  const previewVisible = ref(false)
  const previewUrl = ref('')
  const previewFileName = ref('')

  const isImageFile = (name: string): boolean => {
    if (!name) return false
    const lower = name.toLowerCase()
    return ['.jpg', '.jpeg', '.png', '.gif', '.bmp', '.webp'].some((ext) => lower.endsWith(ext))
  }

  interface Props {
    modelValue: any
  }

  interface AttachmentFile {
    name: string
    url?: string
    id?: number
  }

  const props = defineProps<Props>()

  const countryList = ref<Array<{ value?: string; name?: string; label?: string }>>([])

  const getCountryLabel = (raw: string | number | undefined | null): string => {
    if (raw === undefined || raw === null || String(raw).trim() === '') return '-'
    const value = String(raw).trim()
    const upper = value.length <= 3 ? value.toUpperCase() : value
    const item = countryList.value.find((c) => {
      const v = String(c.value ?? '').trim()
      const code = String((c as { code?: string }).code ?? '').trim()
      const n = String(c.name ?? '').trim()
      const l = String(c.label ?? '').trim()
      if (v === value || n === value || l === value) return true
      if (value.length <= 3 && v && v.toUpperCase() === upper) return true
      if (value.length <= 3 && code && code.toUpperCase() === upper) return true
      return false
    })
    if (item) {
      return item.label || item.name || value
    }
    return value
  }

  /** 多国家展示（兼容逗号分隔、JSON 数组、单值） */
  const formatComplianceCountries = (raw: unknown): string => {
    const codes = normalizeComplianceCountryToCodes(raw)
    if (codes.length === 0) return '-'
    return codes.map((c) => getCountryLabel(c)).join('、')
  }

  onMounted(async () => {
    try {
      countryList.value = (await pubCountryList()) || []
    } catch {
      countryList.value = []
    }
  })

  // Computed property to get certification list from modelValue
  const certificationList = computed(() => {
    // If modelValue is an array, use it directly
    if (Array.isArray(props.modelValue)) {
      return props.modelValue
    }
    // If modelValue has certificationList property
    if (props.modelValue?.certificationList) {
      return props.modelValue.certificationList
    }
    return []
  })

  // Parse attachment string to file objects
  const parseAttachment = (
    attachment: string | AttachmentFile[] | null
  ): AttachmentFile[] | string => {
    if (!attachment) return ''

    // If it's already an array, return it
    if (Array.isArray(attachment)) {
      return attachment
    }

    // If it's a string, try to parse it
    if (typeof attachment === 'string') {
      // Try to parse as JSON first
      try {
        const parsed = JSON.parse(attachment)
        if (Array.isArray(parsed)) {
          return parsed
        }
      } catch {
        // Not JSON, check if it contains multiple files separated by comma
        if (attachment.includes(',')) {
          return attachment.split(',').map((name) => ({
            name: name.trim()
          }))
        }
      }
      // Return as-is if it's just a simple string
      return attachment
    }

    return ''
  }

  // 获取附件可访问 URL（兼容多种后端字段）
  const getFileUrl = (file: AttachmentFile): string => {
    const f = file as unknown as Record<string, string | undefined>
    return f.url || f.rawUrl || f.picsUrl || f.fileUrl || f.attachmentUrl || ''
  }

  // 查看/预览文件：在弹窗内打开，避免被服务器强制下载
  const handlePreview = async (file: AttachmentFile) => {
    const fileUrl = getFileUrl(file)
    if (!fileUrl) {
      ElMessage.warning(`文件 "${file.name}" 暂无预览链接`)
      return
    }
    try {
      let url = fileUrl
      if (url.includes('.aliyuncs.com') || url.includes('oss-')) {
        url = await getOssSignatureUrl(url)
      }
      previewFileName.value = file.name
      previewUrl.value = url
      previewVisible.value = true
    } catch (error: any) {
      console.error('获取预览链接失败:', error)
      ElMessage.error('预览失败，请稍后重试')
    }
  }

  // Handle file download
  const handleDownload = async (file: AttachmentFile) => {
    try {
      let downloadUrl = getFileUrl(file)

      if (!downloadUrl) {
        ElMessage.warning(`文件 "${file.name}" 暂无下载链接`)
        return
      }

      // If it's an OSS file, generate signed URL
      if (downloadUrl.includes('.aliyuncs.com') || downloadUrl.includes('oss-')) {
        try {
          downloadUrl = await getOssSignatureUrl(downloadUrl)
        } catch (error) {
          console.error('生成下载URL失败:', error)
          ElMessage.error('生成下载链接失败')
          return
        }
      }

      // Try to download using fetch (handles CORS)
      try {
        const response = await fetch(downloadUrl)
        if (!response.ok) {
          throw new Error('下载失败')
        }
        const blob = await response.blob()
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url
        link.download = file.name
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        // Release URL
        setTimeout(() => {
          window.URL.revokeObjectURL(url)
        }, 100)
        ElMessage.success('文件下载成功')
      } catch (error) {
        // If fetch fails, try opening in new tab
        console.warn('使用fetch下载失败，尝试直接打开链接:', error)
        window.open(downloadUrl, '_blank')
      }
    } catch (error: any) {
      console.error('下载文件失败:', error)
      ElMessage.error('下载文件失败，请稍后重试')
    }
  }

  // Handle text download (for simple string attachments without URL)
  const handleDownloadText = (text: string) => {
    ElMessage.warning(`文件 "${text}" 暂无下载链接`)
  }
</script>

<style lang="scss" scoped>
  .compliance-info-detail {
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

      .compliance-table-wrapper {
        margin-top: 16px;

        /* 认证类型等长文本：超出省略，悬停 tooltip 显示完整内容 */
        .cell-ellipsis {
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          vertical-align: bottom;
        }

        /* 认证机构/申请公司/证书编号 限制展示 50 字，防止内容溢出错位 */
        :deep(.el-table .cell) {
          white-space: nowrap;
        }

        .attachment-list {
          display: flex;
          flex-direction: column;
          gap: 4px;

          .attachment-item {
            display: flex;
            align-items: center;
          }

          .attachment-link-wrap {
            display: inline-flex;
            gap: 4px;
            align-items: center;
          }

          .attachment-download-icon {
            flex-shrink: 0;
            color: var(--el-color-primary);
            cursor: pointer;

            &:hover {
              color: var(--el-color-primary-light-3);
            }
          }

          .attachment-name-btn {
            padding: 0;
            margin: 0;
            font: inherit;
            color: var(--el-color-primary);
            text-align: left;
            text-decoration: underline;
            cursor: pointer;
            background: none;
            border: none;

            &:hover {
              color: var(--el-color-primary-light-3);
            }

            &.attachment-name-text {
              display: inline;
            }
          }
        }
      }
    }
  }

  .attachment-preview-dialog {
    .preview-content {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 400px;
    }

    .preview-iframe {
      width: 100%;
      height: 70vh;
      border: none;
    }
  }
</style>
