<template>
  <div class="compliance-info-edit">
    <div class="section">
      <div class="section-header" style="margin-top: 2rem">
        <span class="section-title-bar"></span>
        <span class="section-title">合规认证</span>
        <ElButton
          type="primary"
          size="small"
          :icon="Plus"
          style="margin-left: auto"
          @click="handleAddCertification"
        >
          添加认证
        </ElButton>
      </div>

      <div class="compliance-table-wrapper" style="margin-top: 1.5rem">
        <ElTable :data="localData.certificationList" border stripe style="width: 100%">
          <ElTableColumn type="index" label="序号" width="60" align="center" />
          <ElTableColumn label="认证类型" min-width="150" prop="certificationType">
            <!-- <template #default="{ row }">
              <ElSelect
                v-model="row.certificationType"
                placeholder="请输入"
                clearable
                filterable
                allow-create
                size="small"
                style="width: 100%"
              >
                <ElOption label="CE认证" value="CE认证" />
                <ElOption label="FCC认证" value="FCC认证" />
                <ElOption label="RoHS认证" value="RoHS认证" />
                <ElOption label="FDA认证" value="FDA认证" />
                <ElOption label="UL认证" value="UL认证" />
                <ElOption label="ISO认证" value="ISO认证" />
                <ElOption label="CCC认证" value="CCC认证" />
                <ElOption label="ETL认证" value="ETL认证" />
                <ElOption label="GS认证" value="GS认证" />
                <ElOption label="其他" value="其他" />
              </ElSelect>
            </template> -->
            <template #default="{ row }">
              <ElInput
                v-model="row.certificationType"
                maxlength="50"
                show-word-limit
                placeholder="请输入"
                clearable
                size="small"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn
            label="认证机构"
            min-width="150"
            prop="certificationAgency"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <ElInput
                v-model="row.certificationAgency"
                maxlength="50"
                show-word-limit
                placeholder="请输入"
                clearable
                size="small"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="国家" min-width="200" prop="country">
            <template #default="{ row }">
              <MkSelect
                v-model="row.country"
                multiple
                :options="countryOptions"
                :label-value="{ name: 'label', value: 'value' }"
                placeholder="请选择"
                :filterable="true"
                :alwaysFilterInput="true"
                clearable
                size="small"
                style="width: 100%"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn
            label="申请公司"
            min-width="150"
            prop="applicantCompany"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <ElInput
                v-model="row.applicantCompany"
                maxlength="50"
                show-word-limit
                placeholder="请输入"
                clearable
                size="small"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="测试时间" min-width="150" prop="testDate">
            <template #default="{ row }">
              <ElDatePicker
                v-model="row.testDate"
                type="date"
                placeholder="选择日期"
                size="small"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="发布时间" min-width="150" prop="issueDate">
            <template #default="{ row }">
              <ElDatePicker
                v-model="row.issueDate"
                type="date"
                placeholder="选择日期"
                size="small"
                style="width: 100%"
                value-format="YYYY-MM-DD"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn
            label="证书编号"
            min-width="150"
            prop="certificateNumber"
            show-overflow-tooltip
          >
            <template #default="{ row }">
              <ElInput
                v-model="row.certificateNumber"
                maxlength="50"
                show-word-limit
                placeholder="请输入"
                clearable
                size="small"
              />
            </template>
          </ElTableColumn>
          <ElTableColumn label="附件" min-width="200" prop="attachment">
            <template #default="{ row, $index }">
              <ElButton type="primary" link size="small" @click="handleUploadFile($index)">
                <el-icon><Upload /></el-icon>
                上传附件（最多30个）
              </ElButton>
              <div v-if="row.attachment" class="file-list">
                <template v-if="Array.isArray(parseAttachmentForDisplay(row.attachment))">
                  <ElTag
                    v-for="(file, index) in parseAttachmentForDisplay(row.attachment)"
                    :key="index"
                    size="small"
                    closable
                    style="margin-top: 4px; margin-right: 4px"
                    @close="handleRemoveFile($index, index)"
                  >
                    {{ file.name }}
                  </ElTag>
                </template>
                <template v-else>
                  <ElTag
                    size="small"
                    closable
                    style="margin-top: 4px; margin-right: 4px"
                    @close="handleRemoveFile($index, 0)"
                  >
                    {{ row.attachment }}
                  </ElTag>
                </template>
              </div>
            </template>
          </ElTableColumn>
          <ElTableColumn label="操作" width="80" align="center" fixed="right">
            <template #default="{ $index }">
              <ElButton type="primary" link size="small" @click="handleRemove($index)">
                移除
              </ElButton>
            </template>
          </ElTableColumn>
        </ElTable>
      </div>
    </div>

    <!-- 隐藏的文件上传input -->
    <input
      ref="fileInputRef"
      type="file"
      style="display: none"
      multiple
      @change="handleFileChange"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, onMounted, computed } from 'vue'
  import {
    ElTable,
    ElTableColumn,
    ElButton,
    ElInput,
    ElDatePicker,
    ElTag,
    ElMessage
  } from 'element-plus'
  import MkSelect from '@/components/core/others/mk-select/index.vue'
  import { Plus, Upload } from '@element-plus/icons-vue'
  import { ossUpload } from '@/utils/ali-oss'
  import { pubCountryList } from '@/utils'
  import { normalizeComplianceCountryToCodes } from '@/utils/compliance-country'

  interface Props {
    modelValue: any
  }

  interface CertificationItem {
    id?: number
    certificationType: string
    certificationAgency: string
    /** 国家：多选，值为国家编码/value 数组 */
    country: string[]
    applicantCompany: string
    testDate: string
    issueDate: string
    certificateNumber: string
    attachment: string
    productId?: number
  }

  interface ComplianceInfo {
    certificationList: CertificationItem[]
  }

  const props = defineProps<Props>()
  const emit = defineEmits(['update:modelValue'])

  const fileInputRef = ref<HTMLInputElement>()
  const currentUploadIndex = ref<number>(-1)

  /** 国家下拉选项（从获取国家接口加载） */
  const countryList = ref<{ value?: string; name?: string; label?: string }[]>([])
  const countryOptions = computed(() =>
    countryList.value.map((item) => ({
      label: item.name || item.label || '',
      value: item.value ?? item.name ?? item.label ?? ''
    }))
  )

  const loadCountryList = async () => {
    try {
      countryList.value = (await pubCountryList()) || []
    } catch (e) {
      console.error('获取国家列表失败:', e)
      countryList.value = []
    }
  }

  onMounted(() => {
    loadCountryList()
  })

  // 标记是否正在从props同步数据
  const isUpdatingFromProps = ref(false)

  // 初始化本地数据
  const localData = reactive<ComplianceInfo>({
    certificationList: []
  })

  // 监听 props.modelValue 变化，同步到 localData
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal && newVal.certificationList) {
        isUpdatingFromProps.value = true
        localData.certificationList = newVal.certificationList.map((item: any) => ({
          id: item.id,
          certificationType: item.certificationType || '',
          certificationAgency: (item.certificationAgency || '').slice(0, 50),
          country: normalizeComplianceCountryToCodes(item.country),
          applicantCompany: (item.applicantCompany || '').slice(0, 50),
          testDate: item.testDate || '',
          issueDate: item.issueDate || '',
          certificateNumber: (item.certificateNumber || '').slice(0, 50),
          attachment: item.attachment || '',
          productId: item.productId
        }))
        setTimeout(() => {
          isUpdatingFromProps.value = false
        }, 0)
      }
    },
    { immediate: true, deep: true }
  )

  // 监听 localData 变化，同步到父组件（但避免循环更新）
  watch(
    localData,
    (newVal) => {
      if (!isUpdatingFromProps.value) {
        emit('update:modelValue', { ...newVal })
      }
    },
    { deep: true }
  )

  // 添加认证
  const handleAddCertification = () => {
    localData.certificationList.push({
      certificationType: '',
      certificationAgency: '',
      country: [],
      applicantCompany: '',
      testDate: '',
      issueDate: '',
      certificateNumber: '',
      attachment: ''
    })
  }

  // 移除认证
  const handleRemove = (index: number) => {
    localData.certificationList.splice(index, 1)
    ElMessage.success('移除成功')
  }

  // Parse attachment for display (handles both JSON and string formats)
  const parseAttachmentForDisplay = (attachment: string | null): any[] | string => {
    if (!attachment) return ''

    try {
      const parsed = JSON.parse(attachment)
      if (Array.isArray(parsed)) {
        return parsed
      }
    } catch {
      // Not JSON, return as-is
    }

    return attachment
  }

  /** 单条认证的附件数量上限 */
  const COMPLIANCE_ATTACHMENT_MAX = 30

  // 上传附件
  const handleUploadFile = (index: number) => {
    const certification = localData.certificationList[index]
    let currentCount = 0
    if (certification.attachment) {
      try {
        const parsed = JSON.parse(certification.attachment)
        currentCount = Array.isArray(parsed) ? parsed.length : 1
      } catch {
        if (certification.attachment) currentCount = 1
      }
    }
    if (currentCount >= COMPLIANCE_ATTACHMENT_MAX) {
      ElMessage.warning(`附件最多 ${COMPLIANCE_ATTACHMENT_MAX} 个，当前已满`)
      return
    }
    currentUploadIndex.value = index
    fileInputRef.value?.click()
  }

  // 文件选择变化 - 实际上传到OSS
  const handleFileChange = async (event: Event) => {
    const target = event.target as HTMLInputElement
    const files = target.files
    if (!files || files.length === 0 || currentUploadIndex.value === -1) return

    const certification = localData.certificationList[currentUploadIndex.value]

    try {
      // Parse existing attachments
      let existingAttachments: any[] = []
      if (certification.attachment) {
        try {
          const parsed = JSON.parse(certification.attachment)
          if (Array.isArray(parsed)) {
            existingAttachments = parsed
          }
        } catch {
          // If not JSON, treat as single file name
          if (certification.attachment) {
            existingAttachments = [{ name: certification.attachment }]
          }
        }
      }

      const remain = COMPLIANCE_ATTACHMENT_MAX - existingAttachments.length
      if (remain <= 0) {
        ElMessage.warning(`附件最多 ${COMPLIANCE_ATTACHMENT_MAX} 个，当前已满`)
        target.value = ''
        return
      }
      const filesToUpload = Array.from(files).slice(0, remain)
      if (filesToUpload.length < files.length) {
        ElMessage.warning(
          `仅支持再上传 ${remain} 个附件（单条认证最多 ${COMPLIANCE_ATTACHMENT_MAX} 个），已忽略多余文件`
        )
      }

      ElMessage.info('正在上传文件，请稍候...')

      // Upload files to OSS
      const uploadPromises = filesToUpload.map(async (file) => {
        try {
          const result: any = await ossUpload(file.name, file, 'compliance')
          return {
            name: file.name,
            url: result.url || result.res?.requestUrls?.[0]
          }
        } catch (error) {
          console.error(`上传文件 ${file.name} 失败:`, error)
          throw error
        }
      })

      const uploadedFiles = await Promise.all(uploadPromises)

      // Merge with existing attachments
      const allAttachments = [...existingAttachments, ...uploadedFiles]

      // Store as JSON string
      certification.attachment = JSON.stringify(allAttachments)

      ElMessage.success(`成功上传 ${uploadedFiles.length} 个文件`)
    } catch (error: any) {
      console.error('文件上传失败:', error)
      ElMessage.error(error?.message || '文件上传失败')
    } finally {
      // 清空input以便下次选择相同文件也能触发change事件
      target.value = ''
    }
  }

  // Remove a specific file from attachment
  const handleRemoveFile = (rowIndex: number, fileIndex: number) => {
    const certification = localData.certificationList[rowIndex]
    if (!certification.attachment) return

    try {
      const parsed = JSON.parse(certification.attachment)
      if (Array.isArray(parsed)) {
        parsed.splice(fileIndex, 1)
        certification.attachment = parsed.length > 0 ? JSON.stringify(parsed) : ''
        ElMessage.success('移除成功')
      } else {
        // Single file, just clear it
        certification.attachment = ''
        ElMessage.success('移除成功')
      }
    } catch {
      // Not JSON, just clear the attachment
      certification.attachment = ''
      ElMessage.success('移除成功')
    }
  }

  // 表单验证
  const validate = async () => {
    return true
  }

  // 暴露验证方法和本地数据
  defineExpose({
    validate,
    formData: localData
  })
</script>

<style lang="scss" scoped>
  .compliance-info-edit {
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

        .file-list {
          display: flex;
          flex-wrap: wrap;
        }
      }
    }
  }
</style>
