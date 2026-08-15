<template>
  <div class="compliance-certification-detail">
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">合规认证</span>
      </div>
      <ElTable :data="displayData.certifications" border size="small" class="detail-table">
        <ElTableColumn prop="index" label="序号" width="80" align="center">
          <template #default="{ $index }">
            {{ $index + 1 }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="certificationType" label="认证类型" min-width="150">
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
        <ElTableColumn prop="certificationAgency" label="认证机构" min-width="150">
          <template #default="{ row }">
            {{ row.certificationAgency || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="country" label="国家" min-width="120">
          <template #default="{ row }">
            {{ formatComplianceCountries(row.country) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="applicantCompany" label="申请公司" min-width="150">
          <template #default="{ row }">
            {{ row.applicantCompany || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="testDate" label="测试时间" min-width="150">
          <template #default="{ row }">
            {{ formatDate(row.testDate) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="issueDate" label="发布时间" min-width="150">
          <template #default="{ row }">
            {{ formatDate(row.issueDate) }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="certificateNumber" label="证书编号" min-width="150">
          <template #default="{ row }">
            {{ row.certificateNumber || '-' }}
          </template>
        </ElTableColumn>
        <ElTableColumn prop="attachment" label="附件" min-width="200">
          <template #default="{ row }">
            <FileUpload
              :model-value="getAttachments(row)"
              :disabled="true"
              list-type="text"
              class="detail-file-upload"
            />
          </template>
        </ElTableColumn>
      </ElTable>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref } from 'vue'
  import { ElTable, ElTableColumn, ElTooltip } from 'element-plus'
  import FileUpload from '@/components/core/upload-custom/index.vue'
  import dayjs from 'dayjs'
  import { pubCountryList } from '@/utils'
  import { normalizeComplianceCountryToCodes } from '@/utils/compliance-country'

  interface Props {
    modelValue?: any
  }

  const props = defineProps<Props>()

  const countryList = ref<Array<{ value: string; name?: string; label?: string }>>([])

  // 计算显示数据
  const displayData = computed(() => {
    const data = props.modelValue || {}
    return {
      certifications: data.certifications || []
    }
  })

  const getCountryLabelSingle = (value: string): string => {
    if (!value || !String(value).trim()) return '-'
    const v = String(value).trim()
    const country = countryList.value.find((item) => String(item.value ?? '').trim() === v)
    return country?.name || country?.label || country?.value || v || '-'
  }

  const formatComplianceCountries = (raw: unknown): string => {
    const codes = normalizeComplianceCountryToCodes(raw)
    if (!codes.length) return '-'
    return codes.map((c) => getCountryLabelSingle(c)).join('、')
  }

  // 格式化日期显示（YYYY-MM-DD 转换为 YYYY/MM/DD）
  const formatDate = (date: string): string => {
    if (!date) return '-'
    return dayjs(date).format('YYYY-MM-DD')
  }

  // 处理附件数据，支持 attachment 数组或 attachment 字符串
  const getAttachments = (row: any): any[] => {
    // 优先使用 attachment 数组
    if (row.attachment) {
      // 如果是字符串，尝试解析为 JSON
      if (typeof row.attachment === 'string') {
        try {
          const parsed = JSON.parse(row.attachment)
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
      // 如果已经是数组，直接返回
      if (Array.isArray(row.attachment)) {
        return row.attachment
      }
    }
    // 如果没有 attachment，尝试使用旧的 attachment 字段（兼容旧数据）
    if (row.attachment && typeof row.attachment === 'string') {
      // 尝试解析为 JSON
      try {
        const parsed = JSON.parse(row.attachment)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        // 如果不是 JSON，返回空数组（旧格式不支持）
        return []
      }
    }
    return []
  }

  // 获取国家列表
  const getAllCountry = async () => {
    try {
      countryList.value = await pubCountryList()
    } catch (error) {
      console.error('获取国家列表失败:', error)
      countryList.value = []
    }
  }

  // 初始化国家列表
  onMounted(() => {
    getAllCountry()
  })
</script>

<style lang="scss" scoped>
  .compliance-certification-detail {
    margin-top: 8px;

    .section {
      .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;

        .section-title-bar {
          width: 4px;
          height: 16px;
          margin-right: 8px;
          background-color: #5d87ff;
        }

        .section-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }
      }

      .detail-table {
        .cell-ellipsis {
          display: inline-block;
          max-width: 100%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
          vertical-align: bottom;
        }

        :deep(.el-table__header) {
          th {
            font-weight: 500;
            color: var(--el-text-color-primary);
            background-color: #f5f7fa;
          }
        }

        :deep(.el-table__body) {
          td {
            color: var(--el-text-color-primary);
          }
        }

        .detail-file-upload {
          :deep(.el-upload-list) {
            margin-top: 0;
          }
        }
      }
    }
  }
</style>
