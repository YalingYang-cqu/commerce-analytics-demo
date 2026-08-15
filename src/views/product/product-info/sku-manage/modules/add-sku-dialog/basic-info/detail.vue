<template>
  <div class="basic-info-detail">
    <!-- 基本信息 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">基本信息</span>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">分类:</div>
          <div class="detail-value">{{ modelValue?.categoryName || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">品牌:</div>
          <div class="detail-value">{{ modelValue?.brandName || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">材质:</div>
          <div class="detail-value">{{ modelValue?.material || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">用途:</div>
          <div class="detail-value">{{ modelValue?.purpose || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">单位:</div>
          <div class="detail-value">
            {{ pubFilter(dictData['spuUnit'], modelValue.unit) || '-' }}</div
          >
        </div>
        <div class="detail-item">
          <div class="detail-label">规格描述:</div>
          <div class="detail-value detail-value-multiline">
            {{ modelValue?.specificationDescription || '-' }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">状态:</div>
          <div class="detail-value">
            <ElTag
              v-if="modelValue?.productStatus !== null && modelValue?.productStatus !== undefined"
              :type="getStatusType(modelValue.productStatus)"
            >
              {{ getStatusLabel(modelValue.productStatus) }}
            </ElTag>
            <span v-else>-</span>
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">开发人:</div>
          <div class="detail-value">{{ modelValue?.productDeveloperUserNames || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">产品负责人:</div>
          <div class="detail-value">{{ modelValue?.productOwnerUserNames || '-' }}</div>
        </div>
        <div class="detail-item">
          <div class="detail-label">产品备注:</div>
          <div class="detail-value detail-value-multiline">
            {{
              modelValue?.productRemark != null && String(modelValue.productRemark).trim() !== ''
                ? String(modelValue.productRemark)
                : '-'
            }}
          </div>
        </div>
        <div class="detail-item full-width">
          <div class="detail-label">附件:</div>
          <div class="detail-value">
            <template v-if="modelValue?.attachments && modelValue.attachments.length">
              <ElTag
                v-for="(file, index) in modelValue.attachments"
                :key="index"
                style="margin-right: 8px; cursor: pointer"
                @click="handlePreviewFile(file)"
              >
                {{ file.name }}
              </ElTag>
            </template>
            <span v-else>-</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 规格信息 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">规格信息</span>
        <div class="unit-switcher" style="margin-left: 1rem">
          <button
            class="unit-btn"
            :class="{ active: specUnit === 'metric' }"
            @click="specUnit = 'metric'"
          >
            公制
          </button>
          <button
            class="unit-btn"
            :class="{ active: specUnit === 'imperial' }"
            @click="specUnit = 'imperial'"
          >
            英制
          </button>
        </div>
      </div>
      <div class="detail-grid">
        <div class="detail-item">
          <div class="detail-label">单品净重:</div>
          <div class="detail-value">
            {{
              getWeight(
                modelValue?.productNetWeight,
                modelValue?.productNetWeightLb,
                modelValue?.productNetWeightUnit
              )
            }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">单品毛重:</div>
          <div class="detail-value">
            {{
              getWeight(
                modelValue?.productGrossWeight,
                modelValue?.productGrossWeightLb,
                modelValue?.productGrossWeightUnit
              )
            }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">单品尺寸:</div>
          <div class="detail-value">
            {{
              getSize(
                modelValue?.productLength,
                modelValue?.productWidth,
                modelValue?.productHeight,
                modelValue?.productLengthInch,
                modelValue?.productWidthInch,
                modelValue?.productHeightInch
              )
            }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">包装尺寸:</div>
          <div class="detail-value">
            {{
              getSize(
                modelValue?.productPackageLength,
                modelValue?.productPackageWidth,
                modelValue?.productPackageHeight,
                modelValue?.productPackageLengthInch,
                modelValue?.productPackageWidthInch,
                modelValue?.productPackageHeightInch
              )
            }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">单箱净重:</div>
          <div class="detail-value">
            {{
              getWeight(
                modelValue?.boxNetWeight,
                modelValue?.boxNetWeightLb,
                modelValue?.boxNetWeightUnit
              )
            }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">单箱毛重:</div>
          <div class="detail-value">
            {{
              getWeight(
                modelValue?.boxGrossWeight,
                modelValue?.boxGrossWeightLb,
                modelValue?.boxGrossWeightUnit
              )
            }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">单箱数量:</div>
          <div class="detail-value">
            {{
              modelValue?.boxNum !== null && modelValue?.boxNum !== undefined
                ? modelValue.boxNum + ' pcs'
                : '-'
            }}
          </div>
        </div>
        <div class="detail-item">
          <div class="detail-label">单箱尺寸:</div>
          <div class="detail-value">
            {{
              getSize(
                modelValue?.boxLength,
                modelValue?.boxWidth,
                modelValue?.boxHeight,
                modelValue?.boxLengthInch,
                modelValue?.boxWidthInch,
                modelValue?.boxHeightInch
              )
            }}
          </div>
        </div>
      </div>
    </div>

    <!-- 文件预览对话框 -->
    <ElDialog
      v-model="previewDialogVisible"
      :title="previewFileName"
      width="80%"
      top="5vh"
      destroy-on-close
      @close="handleClosePreview"
    >
      <div class="preview-content" v-if="previewDialogVisible">
        <!-- 图片预览 -->
        <div v-if="isImageFile(previewFile)" class="image-preview-wrapper">
          <template v-if="previewFileUrl">
            <ElImage
              :key="previewImageRetryKey"
              :src="previewFileUrl"
              fit="contain"
              style="max-width: 100%; max-height: 70vh"
              :preview-src-list="[previewFileUrl]"
              :initial-index="0"
              preview-teleported
              @error="handlePreviewImageError"
            />
            <div v-if="previewImageLoadFailed" class="preview-failed-tip">
              <p>图片加载失败，可能是链接已过期</p>
              <ElButton type="primary" size="small" @click="retryPreviewImage">重试</ElButton>
            </div>
          </template>
          <div v-else class="preview-failed-tip">
            <p>图片预览链接获取失败，请稍后重试</p>
          </div>
        </div>
        <!-- 文档预览（使用OnlyOffice） -->
        <div v-else-if="isDocumentFile(previewFile)" class="document-preview-wrapper">
          <OnlyOffice v-if="previewFileInfo" :file="previewFileInfo" />
        </div>
        <!-- 不支持预览的文件类型 -->
        <div v-else class="unsupported-preview">
          <ElIcon :size="64"><Document /></ElIcon>
          <p>该文件类型不支持在线预览</p>
          <p class="file-name">{{ previewFileName }}</p>
        </div>
      </div>
      <template #footer>
        <div class="dialog-footer">
          <ElButton @click="previewDialogVisible = false">关闭</ElButton>
        </div>
      </template>
    </ElDialog>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { ElTag, ElDialog, ElButton, ElImage, ElIcon, ElMessage } from 'element-plus'
  import { Document } from '@element-plus/icons-vue'
  import OnlyOffice from '@/components/core/officeOnline/onlyOffice.vue'
  import { getOssSignatureUrl, ossUrl } from '@/utils/ali-oss'
  import { pubFilter } from '@/utils/common-util'
  import { useDictStore } from '@/store/modules/dict'

  interface Props {
    modelValue: any
  }

  const props = defineProps<Props>()
  const { dictData } = useDictStore()
  const specUnit = ref<'metric' | 'imperial'>('metric')

  // 根据后端返回的 specUnitSystem（0-公制，1-英制）回显公制/英制选中状态
  watch(
    () => props.modelValue?.specUnitSystem,
    (val) => {
      const v = Number(val)
      specUnit.value = v === 1 ? 'imperial' : 'metric'
    },
    { immediate: true }
  )

  // 预览相关
  const previewDialogVisible = ref(false)
  const previewFile = ref<any>(null)
  const previewFileUrl = ref('')
  const previewFileName = ref('')
  const previewFileInfo = ref<{ fileName: string; file: string; isEdit: boolean } | null>(null)
  const previewImageLoadFailed = ref(false)
  const previewImageRetryKey = ref(0)

  // 获取状态标签文本
  const getStatusLabel = (status: number) => {
    const statusMap: Record<number, string> = {
      0: '开发中',
      1: '在售',
      2: '清仓',
      3: '停售'
    }
    return statusMap[status] || '-'
  }

  // 获取状态类型
  const getStatusType = (status: number) => {
    const statusMap: Record<number, any> = {
      0: 'info',
      1: 'success',
      2: 'warning',
      3: 'danger'
    }
    return statusMap[status] || 'info'
  }

  // 获取重量显示（公制使用接口返回的单位，无则兜底 g；英制固定 lb）
  const getWeight = (
    metricValue: number | null,
    imperialValue: number | null,
    metricUnit?: string | null
  ) => {
    if (specUnit.value === 'metric') {
      if (metricValue === null || metricValue === undefined) return '-'
      const unit = (metricUnit || 'g').trim() || 'g'
      return `${metricValue} ${unit}`
    }
    if (imperialValue !== null && imperialValue !== undefined) {
      return `${imperialValue} lb`
    }
    return '-'
  }

  // 获取尺寸显示
  const getSize = (
    metricLength: number | null,
    metricWidth: number | null,
    metricHeight: number | null,
    imperialLength: number | null,
    imperialWidth: number | null,
    imperialHeight: number | null
  ) => {
    if (specUnit.value === 'metric') {
      if (metricLength !== null || metricWidth !== null || metricHeight !== null) {
        return `${metricLength || '-'} × ${metricWidth || '-'} × ${metricHeight || '-'} cm`
      }
    } else {
      if (imperialLength !== null || imperialWidth !== null || imperialHeight !== null) {
        return `${imperialLength || '-'} × ${imperialWidth || '-'} × ${imperialHeight || '-'} inch`
      }
    }
    return '-'
  }

  // 判断是否为图片文件
  const isImageFile = (file: any): boolean => {
    if (!file || !file.name) return false
    const imageTypes = ['.jpg', '.jpeg', '.png', '.bmp', '.gif', '.svg', '.webp']
    const fileName = file.name.toLowerCase()
    return imageTypes.some((type) => fileName.endsWith(type))
  }

  // 判断是否为文档文件（支持OnlyOffice预览的文档类型）
  const isDocumentFile = (file: any): boolean => {
    if (!file || !file.name) return false
    const documentTypes = [
      '.doc',
      '.docx',
      '.xls',
      '.xlsx',
      '.ppt',
      '.pptx',
      '.pdf',
      '.txt',
      '.csv'
    ]
    const fileName = file.name.toLowerCase()
    return documentTypes.some((type) => fileName.endsWith(type))
  }

  // 从附件对象中统一获取可用的文件 URL（兼容接口返回的多种字段；暂存后接口可能只返回 path/file）
  const getFileUrlFromAttachment = (file: any): string => {
    if (!file) return ''
    let raw =
      file.url ||
      file.file ||
      file.fileUrl ||
      file.path ||
      file.attachment ||
      file.rawUrl ||
      (file.response && file.response.url) ||
      ''
    if (!raw) return ''
    // 暂存后后端可能只返回 OSS 相对路径（如 webImg/20260210/xxx.png），需补全为完整 URL 再签名
    if (!raw.startsWith('http://') && !raw.startsWith('https://') && !raw.startsWith('blob:')) {
      raw = ossUrl + raw.replace(/^\//, '')
    }
    return raw
  }

  // 处理文件预览
  const handlePreviewFile = async (file: any) => {
    if (!file) return

    previewFile.value = file
    previewFileName.value = file.name || '文件预览'

    const fileUrl = getFileUrlFromAttachment(file)
    if (!fileUrl) {
      console.warn('文件URL不存在，无法预览')
      return
    }

    // 判断文件类型并设置预览
    if (isImageFile(file)) {
      previewImageLoadFailed.value = false
      previewImageRetryKey.value = 0
      // 图片预览：必须使用 OSS 签名 URL，否则浏览器会 403/跨域导致「加载失败」
      try {
        const signedUrl = await getOssSignatureUrl(fileUrl)
        previewFileUrl.value = signedUrl
        previewDialogVisible.value = true
      } catch (error) {
        console.error('获取图片预览URL失败:', error)
        const canUseRaw =
          fileUrl.startsWith('blob:') ||
          (fileUrl.startsWith('http') && fileUrl.includes('Signature='))
        previewFileUrl.value = canUseRaw ? fileUrl : ''
        previewDialogVisible.value = true
        if (!canUseRaw) {
          ElMessage.error('图片预览链接获取失败，请稍后重试')
        }
      }
    } else if (isDocumentFile(file)) {
      // 文档预览：使用OnlyOffice
      try {
        // 获取OSS签名URL用于OnlyOffice
        const signedUrl = await getOssSignatureUrl(fileUrl)
        previewFileInfo.value = {
          fileName: file.name,
          file: signedUrl,
          isEdit: false // 只读模式
        }
        previewDialogVisible.value = true
      } catch (error) {
        console.error('获取文档预览URL失败:', error)
        // 如果获取签名URL失败，尝试直接使用原始URL
        previewFileInfo.value = {
          fileName: file.name,
          file: fileUrl,
          isEdit: false
        }
        previewDialogVisible.value = true
      }
    } else {
      // 不支持预览的文件类型
      previewDialogVisible.value = true
    }
  }

  // 关闭预览
  const handleClosePreview = () => {
    previewDialogVisible.value = false
    previewFile.value = null
    previewFileUrl.value = ''
    previewFileName.value = ''
    previewFileInfo.value = null
    previewImageLoadFailed.value = false
    previewImageRetryKey.value = 0
  }

  // 图片加载失败时重试：重新获取签名 URL（暂存后有时需重新签名）
  const handlePreviewImageError = async () => {
    previewImageLoadFailed.value = true
  }
  const retryPreviewImage = async () => {
    const file = previewFile.value
    if (!file) return
    const fileUrl = getFileUrlFromAttachment(file)
    if (!fileUrl) return
    try {
      const signedUrl = await getOssSignatureUrl(fileUrl)
      previewImageLoadFailed.value = false
      previewFileUrl.value = signedUrl
      previewImageRetryKey.value += 1
    } catch (e) {
      console.error('重试获取图片预览URL失败:', e)
      ElMessage.error('预览链接获取失败，请稍后重试')
    }
  }
</script>

<style lang="scss" scoped>
  .basic-info-detail {
    padding: 20px;

    .section {
      margin-bottom: 30px;

      &:last-child {
        margin-bottom: 0;
      }

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

        .unit-switcher {
          display: flex;
          margin-left: auto;
          overflow: hidden;
          border: 1px solid var(--el-border-color);
          border-radius: 4px;

          .unit-btn {
            padding: 6px 16px;
            font-size: 14px;
            color: var(--el-text-color-regular);
            cursor: pointer;
            background-color: transparent;
            border: none;
            transition: all 0.3s;

            &:not(:last-child) {
              border-right: 1px solid var(--el-border-color);
            }

            &:hover {
              color: var(--el-color-primary);
            }

            &.active {
              color: #fff;
              background-color: var(--el-color-primary);
            }
          }
        }
      }

      .detail-grid {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 16px 20px;

        .detail-item {
          display: flex;
          align-items: flex-start;

          &.full-width {
            grid-column: 1 / -1;
          }

          .detail-label {
            flex-shrink: 0;
            min-width: 90px;
            font-size: 14px;
            color: var(--el-text-color-secondary);
          }

          .detail-value {
            font-size: 14px;
            color: var(--el-text-color-primary);
            word-break: break-all;

            &.detail-value-multiline {
              white-space: pre-wrap;
            }
          }
        }
      }
    }
  }

  .preview-content {
    display: flex;
    align-items: center;
    justify-content: center;
    min-height: 400px;

    .image-preview-wrapper {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 100%;
    }

    .preview-failed-tip {
      padding: 24px;
      color: var(--el-text-color-secondary);
      text-align: center;

      p {
        margin: 0;
        font-size: 14px;
      }
    }

    .document-preview-wrapper {
      width: 100%;
      height: 70vh;
    }

    .unsupported-preview {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 40px;
      color: var(--el-text-color-secondary);

      .file-name {
        margin-top: 16px;
        font-size: 14px;
        color: var(--el-text-color-regular);
      }
    }
  }

  .dialog-footer {
    display: flex;
    justify-content: flex-end;
  }
</style>
