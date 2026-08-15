<template>
  <div class="sku-manage-page art-full-height">
    <!-- 搜索栏 -->
    <ArtSearchBar
      v-model="searchForm"
      :items="searchItems"
      :showSearch="false"
      @reset="resetSearchParams"
      @search="handleSearch"
    />
    <!-- 表格头部 -->
    <ArtTableHeader
      v-model:columns="columnChecks"
      :loading="loading"
      layout="refresh,down,columnsNew"
      @refresh="refreshData"
      export-auth="product:sku:common:export"
      :updateColumn="updateColumn"
      :resetColumns="resetColumns"
      :exportApi="exportSku"
      :exportParams="exportRequestParams"
      :asyncExport="true"
      tableName="sku1"
    >
      <template #left>
        <ElSpace wrap>
          <ElButton type="primary" @click="handleAddSKU" v-ripple v-auth="'product:sku:common:add'"
            >添加SKU</ElButton
          >
          <ElButton @click="handleSetResponsible" v-ripple v-auth="'product:sku:common:setLeader'"
            >设置负责人
          </ElButton>
          <ElButton @click="handleBatchDelete" v-ripple v-auth="'product:sku:common:delete'"
            >删除</ElButton
          >
          <ElButton @click="toPage">跳转到主应用</ElButton>
          <span v-if="selectedRows.length > 0" class="selected-count">
            已选{{ selectedRows.length }}条信息
          </span>
        </ElSpace>
      </template>
    </ArtTableHeader>

    <ElCard shadow="never" class="art-table-card">
      <!-- 表格 -->
      <ArtTable
        ref="tableRef"
        :loading="loading"
        :data="data"
        :pagination="pagination"
        row-key="id"
        :columns="columns"
        :columnChecks="columnChecks"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
        tableKey="sku"
      >
        <!-- SKU 列：点击弹出 SKU 详情 -->
        <template #sku="{ row }">
          <el-link
            v-if="hasAuth('product:sku:common:list')"
            type="primary"
            class="sku-link"
            :underline="false"
            @click="handleDetail(row)"
          >
            {{ row.sku || '-' }}
          </el-link>
          <span v-else>{{ row.sku || '-' }}</span>
        </template>

        <!-- 图片列 -->
        <template #image="{ row }">
          <ElImage
            v-if="row.image && getUrl(row.image)"
            :src="getUrl(row.image)"
            :preview-src-list="[getUrl(row.image)]"
            :preview-teleported="true"
            fit="cover"
            style="width: 60px; height: 60px; border-radius: 4px"
          />
          <div v-else class="image-placeholder">
            <ElIcon :size="40">
              <Picture />
            </ElIcon>
          </div>
        </template>

        <!-- 中文品名/英文品名列 -->
        <template #productName="{ row }">
          <div>
            <div>{{ row.chineseProductName || '-' }}</div>
            <div style="font-size: 12px; color: #909399">{{ row.englishProductName || '-' }}</div>
          </div>
        </template>

        <!-- SPU 列：点击弹出 SPU 详情（spuId 含 basic.spuId / record.spuId / record.productSpuId 回填） -->
        <template #spu="{ row }">
          <SpuCodeLink v-if="row.spu && row.spuId" :spu-code="row.spu" :spu-id="row.spuId" />
          <span v-else>{{ row.spu || '-' }}</span>
        </template>
        <!-- 中文款名/英文款名列 -->
        <template #styleName="{ row }">
          <div>
            <div>{{ row.chineseStyleName || '-' }}</div>
            <div style="font-size: 12px; color: #909399">{{ row.englishStyleName || '-' }}</div>
          </div>
        </template>

        <!-- 状态列 -->
        <template #productStatus="{ row }">
          <ElTag :type="getStatusType(row.productStatus)">{{ row.productStatus }}</ElTag>
        </template>
        <!-- 附件列 -->
        <template #attachs="{ row }">
          <FileUpload
            :model-value="row.attachs ? JSON.parse(row.attachs) : row.attachs"
            :disabled="true"
            list-type="text"
            class="detail-file-upload"
          />
        </template>
        <!-- 单品净重 -->
        <template #productNetWeight="{ row }">
          <div>
            <div>{{
              row.productNetWeight
                ? row.productNetWeight.toFixed(4) + `${row.productNetWeightUnit}`
                : ''
            }}</div>
          </div>
        </template>
        <!-- 单品毛重 -->
        <template #productGrossWeight="{ row }">
          <div>
            <div>{{
              row.productGrossWeight
                ? row.productGrossWeight.toFixed(4) + row.productGrossWeightUnit
                : ''
            }}</div>
          </div>
        </template>

        <!-- 单品尺寸 -->
        <template #productSize="{ row }">
          <div>
            <div>{{
              row.productLength || row.productWidth || row.productHeight
                ? `${row.productLength?.toFixed(2) || '-'} * ${row.productWidth?.toFixed(2) || '-'} * ${row.productHeight?.toFixed(2) || '-'}cm`
                : ''
            }}</div>
          </div>
        </template>
        <!-- 包装尺寸 -->
        <template #productPackageSize="{ row }">
          <div>
            <div>{{
              row.productPackageLength || row.productPackageWidth || row.productPackageHeight
                ? `${row.productPackageLength?.toFixed(2) || '-'} * ${row.productPackageWidth?.toFixed(2) || '-'} * ${row.productPackageHeight?.toFixed(2) || '-'}cm`
                : ''
            }}</div>
          </div>
        </template>
        <!-- 单箱净重 -->
        <template #boxNetWeight="{ row }">
          <div>
            <div>{{
              row.boxNetWeight ? row.boxNetWeight.toFixed(4) + row.boxNetWeightUnit : ''
            }}</div>
          </div>
        </template>
        <!-- 单箱毛重 -->
        <template #boxGrossWeight="{ row }">
          <div>
            <div>{{
              row.boxGrossWeight ? row.boxGrossWeight.toFixed(4) + row.boxGrossWeightUnit : ''
            }}</div>
          </div>
        </template>
        <!-- 单箱尺寸 -->
        <template #boxSize="{ row }">
          <div>
            <div>{{
              row.boxLength || row.boxWidth || row.boxHeight
                ? `${row.boxLength?.toFixed(2) || '-'} * ${row.boxWidth?.toFixed(2) || '-'} * ${row.boxHeight?.toFixed(2) || '-'}cm`
                : ''
            }}</div>
          </div>
        </template>
        <template #referenceDeliveryDays="{ row }">
          <div>
            {{
              row.referenceDeliveryDays != null && row.referenceDeliveryDays !== ''
                ? `${row.referenceDeliveryDays}天`
                : ''
            }}
          </div>
        </template>
        <!-- 采购参考成本 -->
        <template #referenceCost="{ row }">
          <div>
            {{
              row.referenceCost != null && row.referenceCost !== ''
                ? `${row.referenceCost}${row.referenceCostCurrency ? ' ' + row.referenceCostCurrency : ''}`
                : '-'
            }}
          </div>
        </template>
        <!-- 报价供应商-是否含税 -->
        <template #firstQuoteIsTax="{ row }">
          {{
            row.firstQuoteIsTax !== null && row.firstQuoteIsTax !== undefined
              ? row.firstQuoteIsTax
                ? '是'
                : '否'
              : '-'
          }}
        </template>
        <!-- 报关方式 -->
        <template #customsDeclarationMethod="{ row }">
          {{ getCustomsDeclarationMethod(row.customsDeclarationMethod) }}
        </template>
        <!-- 是否包税 -->
        <template #isTaxIncluded="{ row }">
          {{
            row.isTaxIncluded !== null && row.isTaxIncluded !== undefined
              ? row.isTaxIncluded
                ? '是'
                : '否'
              : '-'
          }}
        </template>
        <!-- 报价供应商-税率 -->
        <template #firstQuoteTaxRate="{ row }">
          {{
            row.firstQuoteTaxRate != null && row.firstQuoteTaxRate !== ''
              ? `${row.firstQuoteTaxRate}%`
              : '-'
          }}
        </template>
        <!-- 报价供应商-不含税单价（后端可能脱敏返回 ***，避免 Number 转成 NaN） -->
        <template #firstQuoteUnitPrice="{ row }">
          {{ formatFirstQuoteUnitPrice(row) }}
        </template>
        <template #taxInclusivePrice="{ row }">
          {{ formatTaxInclusivePrice(row) }}
        </template>

        <!-- 报价供应商-交期 -->
        <template #firstQuoteDeliveryDays="{ row }">
          {{
            row.firstQuoteDeliveryDays != null && row.firstQuoteDeliveryDays !== ''
              ? `${row.firstQuoteDeliveryDays}天`
              : '-'
          }}
        </template>
        <!-- 报关单价 -->
        <template #customsPrice="{ row }">
          {{
            row.customsPrice != null && row.customsPrice !== ''
              ? `${Number(row.customsPrice).toFixed(4)}${row.customsPriceCurrency ? ' ' + row.customsPriceCurrency : ''}`
              : '-'
          }}
        </template>
        <!-- 清关单价 -->
        <template #customsClearPrice="{ row }">
          {{
            row.customsClearPrice != null && row.customsClearPrice !== ''
              ? `${Number(row.customsClearPrice).toFixed(4)}${row.customsClearPriceCurrency ? ' ' + row.customsClearPriceCurrency : ''}`
              : '-'
          }}
        </template>
        <!-- 清关税率 -->
        <template #customsClearTaxRate="{ row }">
          {{
            row.customsClearTaxRate != null && row.customsClearTaxRate !== ''
              ? `${row.customsClearTaxRate}%`
              : '-'
          }}
        </template>

        <!-- 关联销售SKU列 -->
        <template #relatedSalesSku="{ row }">
          <ElPopover
            v-if="hasRelatedSalesSku(row)"
            placement="top"
            :width="900"
            trigger="hover"
            :popper-style="{ padding: '12px' }"
          >
            <template #reference>
              <div class="related-sales-sku-cell">
                <span class="sales-sku-text">{{ getFirstSalesSku(row) }}</span>
                <ElIcon class="arrow-icon">
                  <ArrowDown />
                </ElIcon>
              </div>
            </template>
            <div class="sales-sku-popover-content">
              <div class="popover-title">关联销售SKU</div>
              <ElTable
                :data="getSalesSkuList(row)"
                border
                stripe
                size="small"
                style="width: 100%"
                :max-height="300"
              >
                <ElTableColumn label="销售SKU" min-width="120" prop="salesSkuDisplay" />
                <ElTableColumn prop="asin" label="ASIN" min-width="120" />
                <ElTableColumn prop="platform" label="平台" min-width="90" />
                <ElTableColumn prop="storeName" label="店铺" min-width="120" />
                <ElTableColumn prop="area" label="区域" min-width="90" />
                <ElTableColumn prop="region" label="国家" min-width="90" />
                <ElTableColumn prop="salesEntity" label="境外收货人" min-width="120" />
                <ElTableColumn prop="salesManagerNamesStr" label="销售负责人" min-width="120" />
              </ElTable>
            </div>
          </ElPopover>
          <span v-else>{{ getFirstSalesSku(row) || '-' }}</span>
        </template>
        <!-- 单位列 -->
        <template #unit="{ row }">
          {{ pubFilter(dictData['spuUnit'], row.unit) }}
        </template>
        <!-- 报关单位列（按 spuUnit 字典转译成中文） -->
        <template #customsUnit="{ row }">
          {{ pubFilter(dictData['spuUnit'], row.customsUnit) || '-' }}
        </template>
        <!-- 操作列 -->
        <template #operation="{ row }">
          <ElButton
            type="primary"
            link
            size="small"
            @click="handleDetail(row)"
            v-auth="
              'product:sku:purchase:view|product:sku:logistics:view|product:sku:finance:view|product:sku:listingRelation:view|product:sku:pic:view|product:sku:certification:view'
            "
            >详情
          </ElButton>
          <ElDropdown
            @command="(cmd) => handleOperation(cmd, row)"
            :teleported="true"
            placement="bottom-end"
          >
            <ElButton
              type="primary"
              link
              size="small"
              v-auth="
                'product:sku:common:delete|product:sku:common:copy|product:sku:basic:edit|product:sku:purchase:edit|product:sku:logistics:edit|product:sku:finance:edit|product:sku:listingRelation:edit|product:sku:pic:edit|product:sku:certification:edit'
              "
            >
              操作
              <ElIcon class="el-icon--right">
                <ArrowDown />
              </ElIcon>
            </ElButton>
            <template #dropdown>
              <ElDropdownMenu>
                <ElDropdownItem command="delete" v-if="hasAuth('product:sku:common:delete')"
                  >删除</ElDropdownItem
                >
                <ElDropdownItem command="copy" v-if="hasAuth('product:sku:common:copy')"
                  >复制</ElDropdownItem
                >
                <ElDropdownItem command="editCommon" v-if="hasAuth('product:sku:basic:edit')">
                  <div class="dropdown-item-with-status">
                    <span>编辑通用信息</span>
                    <ElTag
                      :type="getApprovalStatusType(row._skuData?.productSkuBasicVo?.approveStatus)"
                      size="small"
                      class="status-tag"
                    >
                      {{ getApprovalStatusText(row._skuData?.productSkuBasicVo?.approveStatus) }}
                    </ElTag>
                  </div>
                </ElDropdownItem>
                <ElDropdownItem command="editBasic" v-if="hasAuth('product:sku:basic:edit')">
                  <div class="dropdown-item-with-status">
                    <span>编辑基本信息</span>
                    <ElTag
                      :type="getApprovalStatusType(row._skuData?.productSkuBasicVo?.approveStatus)"
                      size="small"
                      class="status-tag"
                    >
                      {{ getApprovalStatusText(row._skuData?.productSkuBasicVo?.approveStatus) }}
                    </ElTag>
                  </div>
                </ElDropdownItem>
                <ElDropdownItem command="editPurchase" v-if="hasAuth('product:sku:purchase:edit')">
                  <div class="dropdown-item-with-status">
                    <span>编辑采购信息</span>
                    <ElTag
                      :type="
                        getApprovalStatusType(
                          row._skuData?.productSkuBasicVo?.purchaseApproveStatus
                        )
                      "
                      size="small"
                      class="status-tag"
                    >
                      {{
                        getApprovalStatusText(
                          row._skuData?.productSkuBasicVo?.purchaseApproveStatus
                        )
                      }}
                    </ElTag>
                  </div>
                </ElDropdownItem>
                <ElDropdownItem
                  command="editLogistics"
                  v-if="hasAuth('product:sku:logistics:edit')"
                >
                  <div class="dropdown-item-with-status">
                    <span>编辑物流信息</span>
                    <ElTag
                      :type="
                        getApprovalStatusType(
                          row._skuData?.productSkuBasicVo?.logisticsInfoApproveStatus
                        )
                      "
                      size="small"
                      class="status-tag"
                    >
                      {{
                        getApprovalStatusText(
                          row._skuData?.productSkuBasicVo?.logisticsInfoApproveStatus
                        )
                      }}
                    </ElTag>
                  </div>
                </ElDropdownItem>
                <ElDropdownItem command="editFinance" v-if="hasAuth('product:sku:finance:edit')">
                  <div class="dropdown-item-with-status">
                    <span>编辑财务信息</span>
                    <ElTag
                      :type="
                        getApprovalStatusType(
                          row._skuData?.productSkuBasicVo?.financeInfoApproveStatus
                        )
                      "
                      size="small"
                      class="status-tag"
                    >
                      {{
                        getApprovalStatusText(
                          row._skuData?.productSkuBasicVo?.financeInfoApproveStatus
                        )
                      }}
                    </ElTag>
                  </div>
                </ElDropdownItem>
                <ElDropdownItem
                  command="editSales"
                  v-if="hasAuth('product:sku:listingRelation:edit')"
                >
                  <div class="dropdown-item-with-status">
                    <span>编辑关联销售SKU</span>
                    <ElTag
                      :type="
                        getApprovalStatusType(
                          row._skuData?.productSkuBasicVo?.listingRelationApproveStatus
                        )
                      "
                      size="small"
                      class="status-tag"
                    >
                      {{
                        getApprovalStatusText(
                          row._skuData?.productSkuBasicVo?.listingRelationApproveStatus
                        )
                      }}
                    </ElTag>
                  </div>
                </ElDropdownItem>
                <ElDropdownItem command="editImage" v-if="hasAuth('product:sku:pic:edit')">
                  <div class="dropdown-item-with-status">
                    <span>编辑图片信息</span>
                    <ElTag
                      :type="
                        getApprovalStatusType(row._skuData?.productSkuBasicVo?.picApproveStatus)
                      "
                      size="small"
                      class="status-tag"
                    >
                      {{ getApprovalStatusText(row._skuData?.productSkuBasicVo?.picApproveStatus) }}
                    </ElTag>
                  </div>
                </ElDropdownItem>
                <ElDropdownItem
                  command="editCompliance"
                  v-if="hasAuth('product:sku:certification:edit')"
                >
                  <div class="dropdown-item-with-status">
                    <span>编辑合规信息</span>
                    <ElTag
                      :type="
                        getApprovalStatusType(
                          row._skuData?.productSkuBasicVo?.certificationApproveStatus
                        )
                      "
                      size="small"
                      class="status-tag"
                    >
                      {{
                        getApprovalStatusText(
                          row._skuData?.productSkuBasicVo?.certificationApproveStatus
                        )
                      }}
                    </ElTag>
                  </div>
                </ElDropdownItem>
              </ElDropdownMenu>
            </template>
          </ElDropdown>
        </template>
      </ArtTable>
    </ElCard>

    <!-- 设置负责人弹窗 -->
    <SetResponsiblePerson
      v-model:visible="setResponsibleVisible"
      :selected-items="selectedRows"
      @submit="handleSetResponsibleSubmit"
    />

    <!-- 添加/编辑SKU弹窗 -->
    <AddSkuDialog
      v-model:visible="addSkuVisible"
      :init-data="initData"
      :category-options="categoryAll"
      :brand-options="brandAll"
      :user-options="userAll"
      from="sku"
      @submit="handleAddSkuSubmit"
      @copy="handleCopyFromDialog"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, reactive, watch } from 'vue'
  import {
    ElButton,
    ElSpace,
    ElCard,
    ElTag,
    ElImage,
    ElIcon,
    ElMessage,
    ElMessageBox,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem,
    ElPopover,
    ElTable,
    ElTableColumn
  } from 'element-plus'
  import { Picture, ArrowDown } from '@element-plus/icons-vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import { useTable } from '@/composables/useTable'
  import SetResponsiblePerson from './modules/set-responsible-person.vue'
  import AddSkuDialog from './modules/add-sku-dialog/index.vue'
  import SpuCodeLink from '@/components/core/bussiness/spu-code-link.vue'
  import { batchDeleteSku, skuPageList, exportSku } from '@/api/product/sku'
  import type { SkuItem } from '@/types/api/sku'
  import { labelProps } from '../index.vue'
  import { useAuth } from '@/composables/useAuth'
  import { pubFilter } from '@/utils/common-util'
  import { useDictStore } from '@/store/modules/dict'
  import FileUpload from '@/components/core/upload-custom/index.vue'
  import { isHttpError } from '@/utils/http/error'
  import { navigateToMainAppPage } from '@/utils/navigation'

  defineOptions({ name: 'SKUManage' })

  /** 接口错误若已由 HTTP 层展示过则不再重复弹窗 */
  const shouldShowError = (error: any) => !error?.messageShown

  interface Props {
    userAll?: any[]
    brandAll?: labelProps[]
    categoryAll?: any[]
    openSku?: string // 从外部传入的要搜索的 sku
  }

  const { hasAuth } = useAuth()

  const props = withDefaults(defineProps<Props>(), {
    userAll: () => [],
    brandAll: () => [],
    categoryAll: () => [],
    openSku: undefined
  })

  const emit = defineEmits<{ (e: 'refreshOptions'): void }>()
  // 表格引用
  const tableRef = ref()
  const selectedRows = ref<SkuItem[]>([])
  const setResponsibleVisible = ref(false)
  const addSkuVisible = ref(false)
  const initData = ref({})

  // 搜索表单
  const searchForm = reactive({
    searchType: 'sku', // 复合搜索的搜索类型
    searchValue: '', // 复合搜索的搜索值
    categoryIdList: [],
    brandIdList: [],
    productStatusList: [],
    productDeveloperUserIds: [],
    productManagerUserIds: [],
    purchaseManagerUserIds: [],
    logisticsManagerUserIds: [],
    financeManagerUserIds: [],
    dateSearchValue: '',
    dateSearchKey: 'createTimeRange'
  })

  // 处理搜索事件
  const handleSearch = () => {
    const params: any = { ...searchForm }

    // 根据选择的日期类型设置对应的日期范围字段
    if (searchForm?.dateSearchValue && searchForm?.dateSearchValue?.length === 2) {
      if (searchForm.dateSearchKey === 'createTimeRange') {
        params.createTimeStart = searchForm.dateSearchValue[0] + ' 00:00:00'
        params.createTimeEnd = searchForm.dateSearchValue[1] + ' 23:59:59'
        params.updateTimeStart = null
        params.updateTimeEnd = null
      } else if (searchForm.dateSearchKey === 'updateTimeRange') {
        params.updateTimeStart = searchForm.dateSearchValue[0] + ' 00:00:00'
        params.updateTimeEnd = searchForm.dateSearchValue[1] + ' 23:59:59'
        params.createTimeStart = null
        params.createTimeEnd = null
      }
    } else {
      params.createTimeStart = ''
      params.createTimeEnd = ''
      params.updateTimeStart = ''
      params.updateTimeEnd = ''
    }

    Object.assign(searchParams, params)
    getData()
  }

  // 搜索项配置
  const searchItems = computed(() => [
    // 输入框类型的复合搜索
    {
      key: 'searchValue',
      label: '',
      compositeSearch: true,
      selectOptions: [
        { label: 'SKU', value: 'sku' },
        { label: '中文品名', value: 'productChineseName ' },
        { label: '英文品名', value: 'productEnglishName' },
        { label: 'SPU', value: 'spu' },
        { label: '款名', value: 'spuName' },
        { label: '物料编码', value: 'materialCode' }
      ],
      selectKey: 'searchType',
      selectWidth: '100px',
      inputType: 'input',
      placeholder: '搜索内容',
      width: '280px'
    },
    {
      label: '',
      key: 'categoryIdList',
      type: 'cascader',
      width: '280px',
      props: {
        placeholder: '分类',
        clearable: true,
        filterable: true,
        props: {
          multiple: true,
          children: 'children',
          label: 'categoryName',
          value: 'id',
          emitPath: false
        },
        options: props.categoryAll
      }
    },
    {
      key: 'brandIdList',
      label: '',
      type: 'select',
      selectMultiple: true,
      width: '140px',
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      placeholder: '品牌',
      props: {
        options: props.brandAll,
        clearable: true
      }
    },
    {
      key: 'productStatusList',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      placeholder: '状态',
      width: '140px',
      props: {
        options: [
          { label: '开发中', value: 0 },
          { label: '在售', value: 1 },
          { label: '清仓', value: 2 },
          { label: '停售', value: 3 }
        ],
        clearable: true
      }
    },
    {
      key: 'productDeveloperUserIds',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      placeholder: '开发人',
      width: '140px',
      props: {
        options: props.userAll,
        clearable: true
      }
    },
    {
      key: 'productManagerUserIds',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      placeholder: '产品负责人',
      width: '140px',
      props: {
        options: props.userAll,
        clearable: true
      }
    },
    {
      key: 'purchaseManagerUserIds',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      placeholder: '采购负责人',
      width: '140px',
      props: {
        options: props.userAll,
        clearable: true
      }
    },
    {
      key: 'logisticsManagerUserIds',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      placeholder: '物流负责人',
      width: '140px',
      props: {
        options: props.userAll,
        clearable: true
      }
    },
    {
      key: 'financeManagerUserIds',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      placeholder: '财务负责人',
      width: '140px',
      props: {
        options: props.userAll,
        clearable: true
      }
    },
    // 日期范围类型的复合搜索
    {
      key: 'dateSearchValue',
      label: '',
      compositeSearch: true,
      selectOptions: [
        { label: '创建时间', value: 'createTimeRange' },
        { label: '最近更新时间', value: 'updateTimeRange' }
      ],
      width: '350px',
      selectKey: 'dateSearchKey',
      selectWidth: '130px',
      inputType: 'daterange',
      placeholder: '开始日期,结束日期',
      datePickerProps: {
        valueFormat: 'YYYY-MM-DD',
        rangeSeparator: '→'
      }
    }
  ])

  const getUrl = (dataC: any) => {
    if (!dataC) return ''
    try {
      const parsed = JSON.parse(dataC)
      return parsed?.url || parsed?.[0]?.url || ''
    } catch (error) {
      console.warn('Failed to parse image URL:', error)
      return dataC || ''
    }
  }

  /** 从财务VO提取表格列所需字段（采购/报关/境外收货人、财务负责人） */
  const getFinanceFields = (finance: any) => {
    if (!finance || typeof finance !== 'object') {
      return {
        purchaseOrganizationName: '',
        customsOrganizationName: '',
        saleOrganizationName: '',
        financeOwnerUsers: ''
      }
    }
    return {
      purchaseOrganizationName: finance.purchaseOrganizationName ?? '',
      customsOrganizationName: finance.customsOrganizationName ?? '',
      saleOrganizationName: finance.saleOrganizationName ?? '',
      financeOwnerUsers: finance.financeUsers ?? ''
    }
  }

  /** 从物流VO提取表格列所需字段（报关/清关/物流负责人） */
  const getLogisticsFields = (logistics: any) => {
    if (!logistics || typeof logistics !== 'object') {
      return {
        customsName: '',
        englishCustomsName: '',
        customsHsCode: '',
        customsPrice: null,
        customsPriceCurrency: '',
        customsMaterial: '',
        customsUsage: '',
        productAttr: '',
        customsUnit: '',
        customsModel: '',
        brandType: '',
        originCountry: '',
        domesticCity: '',
        exemptionTax: '',
        outletBenefits: '',
        otherDeclarationElements: '',
        logisticsUser: '',
        customsClearanceCode: '',
        customsClearPrice: null,
        customsClearPriceCurrency: '',
        customsClearModel: '',
        customsClearTaxRate: null
      }
    }
    const cargoAttr = logistics.cargoAttributes
    const productAttrStr = Array.isArray(cargoAttr)
      ? cargoAttr.join(',')
      : (logistics.productAttr ?? '')
    return {
      customsName: logistics.customsName ?? '',
      englishCustomsName: logistics.englishCustomsName ?? '',
      customsHsCode: logistics.customsHsCode ?? '',
      customsPrice: logistics.customsPrice ?? null,
      customsPriceCurrency: logistics.customsPriceCurrency ?? '',
      customsMaterial: logistics.customsMaterial ?? '',
      customsUsage: logistics.customsUsage ?? '',
      productAttr: productAttrStr,
      customsUnit: logistics.customsUnit ?? '',
      customsModel: logistics.customsModel ?? '',
      brandType: logistics.brandType ?? '',
      originCountry: logistics.originCountry ?? '',
      domesticCity: logistics.domesticCity ?? '',
      exemptionTax: logistics.exemptionTax ?? '',
      outletBenefits: logistics.outletBenefits ?? '',
      otherDeclarationElements: logistics.otherDeclarationElements ?? '',
      logisticsUser: logistics.logisticsPrincipalName ?? logistics.logisticsUser ?? '',
      customsDeclarationMethod: logistics.customsDeclarationMethod ?? '',
      isTaxIncluded: logistics.isTaxIncluded ?? null,
      customsClearanceCode: logistics.customsClearanceCode ?? '',
      customsClearPrice: logistics.customsClearPrice ?? null,
      customsClearPriceCurrency: logistics.customsClearPriceCurrency ?? '',
      customsClearModel: logistics.customsClearModel ?? '',
      customsClearTaxRate: logistics.customsClearTaxRate ?? null
    }
  }

  /** 从供应商报价第一条提取表格列所需字段（productSupplierQuotationVo 第一条） */
  /** 格式化首条报价不含税单价：数字用 toFixed(4)，后端脱敏如 *** 则原样显示，避免 NaN */
  const formatFirstQuoteUnitPrice = (row: {
    firstQuoteUnitPrice?: string | number | null
    firstQuoteCurrency?: string
  }) => {
    const val = row.firstQuoteUnitPrice
    if (val == null || val === '') return '-'
    const num = Number(val)
    const suffix = row.firstQuoteCurrency ? ' ' + row.firstQuoteCurrency : ''
    return Number.isFinite(num) ? num.toFixed(4) + suffix : String(val) + suffix
  }
  const formatTaxInclusivePrice = (row: {
    taxInclusivePrice?: string | number | null
    firstQuoteCurrency?: string
  }) => {
    const val = row.taxInclusivePrice
    if (val == null || val === '') return '-'
    const num = Number(val)
    const suffix = row.firstQuoteCurrency ? ' ' + row.firstQuoteCurrency : ''
    return Number.isFinite(num) ? num.toFixed(4) + suffix : String(val) + suffix
  }

  const getFirstQuoteFields = (first: any) => {
    if (!first) {
      return {
        firstQuoteSupplierName: '',
        firstQuoteSupplierCode: '',
        firstQuoteIsTax: null,
        firstQuoteTaxRate: null,
        firstQuoteUnitPrice: null,
        taxInclusivePrice: null,
        firstQuoteCurrency: '',
        firstQuoteDeliveryDays: null
      }
    }
    const isTax = first.isTax ?? first.isIncludeTax
    return {
      firstQuoteSupplierName: first.supplierName ?? '',
      firstQuoteSupplierCode: first.supplierCode ?? '',
      firstQuoteIsTax: isTax,
      firstQuoteTaxRate: first.taxRate ?? null,
      firstQuoteUnitPrice: first.unitPrice ?? null,
      taxInclusivePrice: first.taxInclusivePrice ?? null,
      firstQuoteCurrency: first.currency ?? '',
      firstQuoteDeliveryDays: first.deliveryDays ?? null
    }
  }
  const toPage = () =>
    navigateToMainAppPage('/product/brand', {
      query: { highlight: '1' }
    })
  // 列配置工厂函数
  const columnsFactory = () => [
    {
      type: 'selection',
      width: 55,
      fixed: 'left',
      align: 'center'
    },
    {
      prop: 'image',
      label: '图片',
      width: 100,
      align: 'center',
      useSlot: true
    },
    {
      prop: 'sku',
      label: 'SKU',
      minWidth: 120,
      sortable: true,
      useSlot: true
    },
    {
      prop: 'productName',
      label: '中文品名/英文品名',
      minWidth: 200,
      useSlot: true
    },
    {
      prop: 'spu',
      label: 'SPU',
      minWidth: 120,
      useSlot: true
    },
    {
      prop: 'styleName',
      label: '中文款名/英文款名',
      minWidth: 180,
      useSlot: true
    },
    { prop: 'materialCode', label: '物料编码', minWidth: 150 },
    // {
    //   prop: 'attribute',
    //   label: '属性',
    //   minWidth: 120,
    //   hide: !hasAuth('product:sku:basic')
    // },
    {
      prop: 'category',
      label: '分类',
      minWidth: 150,
      sortable: true,
      hide: !hasAuth('product:sku:basic')
    },
    {
      prop: 'brand',
      label: '品牌',
      minWidth: 120,
      sortable: true,
      hide: !hasAuth('product:sku:basic')
    },
    { prop: 'material', label: '材质', minWidth: 100, hide: !hasAuth('product:sku:basic') },
    { prop: 'purpose', label: '用途', minWidth: 120, hide: !hasAuth('product:sku:basic') },
    {
      prop: 'unit',
      label: '单位',
      minWidth: 120,
      hide: !hasAuth('product:sku:basic'),
      useSlot: true
    },
    // 规格描述
    {
      prop: 'specificationDescription',
      label: '规格描述',
      minWidth: 160,
      hide: !hasAuth('product:sku:basic')
    },
    {
      prop: 'productStatus',
      label: '状态',
      width: 100,
      align: 'center',
      sortable: true,
      useSlot: true,
      hide: !hasAuth('product:sku:basic')
    },
    { prop: 'developmentUsers', label: '开发人', width: 120, hide: !hasAuth('product:sku:basic') },
    {
      prop: 'productOwnerUsers',
      label: '产品负责人',
      width: 120,
      hide: !hasAuth('product:sku:basic')
    },
    // 产品备注
    {
      prop: 'productRemark',
      label: '产品备注',
      minWidth: 160,
      hide: !hasAuth('product:sku:basic')
    },
    {
      prop: 'attachs',
      label: '附件',
      minWidth: 160,
      useSlot: true,
      hide: !hasAuth('product:sku:basic')
    },
    {
      prop: 'productNetWeight',
      label: '单品净重',
      minWidth: 100,
      useSlot: true,
      useHeaderSlot: true,
      hide: !hasAuth('product:sku:basic')
    },
    {
      prop: 'productGrossWeight',
      label: '单品毛重',
      minWidth: 100,
      useSlot: true,
      useHeaderSlot: true,
      hide: !hasAuth('product:sku:basic')
    },
    {
      prop: 'productSize',
      label: '单品尺寸',
      minWidth: 200,
      useSlot: true,
      useHeaderSlot: true,
      hide: !hasAuth('product:sku:basic')
    },
    {
      prop: 'productPackageSize',
      label: '包装尺寸',
      minWidth: 200,
      useSlot: true,
      useHeaderSlot: true,
      hide: !hasAuth('product:sku:basic')
    },
    {
      prop: 'boxNetWeight',
      label: '单箱净重',
      minWidth: 100,
      useSlot: true,
      useHeaderSlot: true,
      hide: !hasAuth('product:sku:basic')
    },
    {
      prop: 'boxGrossWeight',
      label: '单箱毛重',
      minWidth: 100,
      useSlot: true,
      useHeaderSlot: true,
      hide: !hasAuth('product:sku:basic')
    },
    {
      prop: 'boxNum',
      label: '单箱数量（pcs）',
      minWidth: 120,
      hide: !hasAuth('product:sku:basic')
    },
    {
      prop: 'boxSize',
      label: '单箱尺寸',
      minWidth: 200,
      useSlot: true,
      useHeaderSlot: true,
      hide: !hasAuth('product:sku:basic')
    },
    {
      prop: 'referenceDeliveryDays',
      label: '采购参考交期',
      minWidth: 100,
      useSlot: true,
      hide: !hasAuth('product:sku:purchase')
    },
    {
      prop: 'referenceCost',
      label: '采购参考成本',
      minWidth: 120,
      useSlot: true,
      hide: !hasAuth('product:sku:purchase')
    },
    {
      prop: 'purchasUsers',
      label: '采购负责人',
      minWidth: 120,
      hide: !hasAuth('product:sku:purchase')
    },
    {
      prop: 'purchaseRemark',
      label: '采购备注',
      minWidth: 140,
      hide: !hasAuth('product:sku:purchase')
    },
    {
      prop: 'firstQuoteSupplierName',
      label: '供应商',
      minWidth: 120,
      hide: !hasAuth('product:sku:purchase')
    },
    {
      prop: 'firstQuoteSupplierCode',
      label: '供应商编码',
      minWidth: 120,
      hide: !hasAuth('product:sku:purchase')
    },
    {
      prop: 'firstQuoteIsTax',
      label: '是否含税',
      minWidth: 90,
      useSlot: true,
      hide: !hasAuth('product:sku:purchase')
    },
    {
      prop: 'firstQuoteTaxRate',
      label: '税率',
      minWidth: 90,
      useSlot: true,
      hide: !hasAuth('product:sku:purchase')
    },
    {
      prop: 'firstQuoteUnitPrice',
      label: '不含税单价',
      minWidth: 120,
      useSlot: true,
      hide: !hasAuth('product:sku:purchase')
    },
    {
      prop: 'taxInclusivePrice',
      label: '含税单价',
      minWidth: 120,
      useSlot: true,
      hide: !hasAuth('product:sku:purchase')
    },
    {
      prop: 'firstQuoteDeliveryDays',
      label: '交期',
      minWidth: 80,
      useSlot: true,
      hide: !hasAuth('product:sku:purchase')
    },
    {
      prop: 'customsName',
      label: '中文报关名',
      minWidth: 120,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'englishCustomsName',
      label: '英文报关名',
      minWidth: 120,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'customsHsCode',
      label: '报关HSCODE',
      minWidth: 110,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'customsPrice',
      label: '报关单价',
      minWidth: 110,
      useSlot: true,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'customsMaterial',
      label: '报关材质',
      minWidth: 100,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'customsUsage',
      label: '报关用途',
      minWidth: 100,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'productAttr',
      label: '货物属性',
      minWidth: 100,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'customsUnit',
      label: '报关单位',
      minWidth: 90,
      useSlot: true,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'customsModel',
      label: '报关型号',
      minWidth: 100,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'brandType',
      label: '品牌类型',
      minWidth: 90,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'originCountry',
      label: '原产地（地区）',
      minWidth: 110,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'domesticCity',
      label: '境内货源地',
      minWidth: 110,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'exemptionTax',
      label: '出口享惠情况',
      minWidth: 120,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'outletBenefits',
      label: '征免',
      minWidth: 80,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'otherDeclarationElements',
      label: '其他申报要素',
      minWidth: 120,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'logisticsUser',
      label: '物流负责人',
      minWidth: 110,
      hide: !hasAuth('product:sku:logistics')
    },
    // 报关方式
    {
      prop: 'customsDeclarationMethod',
      label: '报关方式',
      minWidth: 90,
      useSlot: true,
      hide: !hasAuth('product:sku:logistics')
    },
    // 是否包税
    {
      prop: 'isTaxIncluded',
      label: '是否包税',
      minWidth: 90,
      useSlot: true,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'customsClearanceCode',
      label: '清关HSCODE',
      minWidth: 110,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'customsClearPrice',
      label: '清关单价',
      minWidth: 100,
      useSlot: true,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'customsClearModel',
      label: '清关型号',
      minWidth: 100,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'customsClearTaxRate',
      label: '清关税率',
      minWidth: 90,
      useSlot: true,
      hide: !hasAuth('product:sku:logistics')
    },
    {
      prop: 'purchaseOrganizationName',
      label: '采购主体',
      minWidth: 120,
      hide: !hasAuth('product:sku:finance')
    },
    {
      prop: 'customsOrganizationName',
      label: '报关主体',
      minWidth: 120,
      hide: !hasAuth('product:sku:finance')
    },
    {
      prop: 'saleOrganizationName',
      label: '境外收货人',
      minWidth: 120,
      hide: !hasAuth('product:sku:finance')
    },
    {
      prop: 'financeOwnerUsers',
      label: '财务负责人',
      minWidth: 110,
      hide: !hasAuth('product:sku:finance')
    },
    {
      prop: 'relatedSalesSku',
      label: '关联销售SKU',
      minWidth: 150,
      useSlot: true,
      align: 'center',
      hide: !hasAuth('product:sku:listingRelation')
    },
    { prop: 'createTime', label: '创建时间', width: 170, sortable: true },
    { prop: 'updateTime', label: '最近更新时间', width: 170, sortable: true },
    { prop: 'updateUser', label: '更新人', width: 120 },
    { prop: 'operation', label: '操作', width: 100, fixed: 'right', align: 'center', useSlot: true }
  ]

  const {
    data,
    loading,
    pagination,
    columns,
    columnChecks,
    resetColumns,
    updateColumn,
    getData,
    refreshData: refreshTableData,
    handleSizeChange,
    resetSearchParams,
    searchParams,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: (params: any) => {
        // 请求前参数处理：将 searchType 和 searchValue 合并为 searchDto
        const requestParams = { ...params }
        if (requestParams.searchValue) {
          requestParams.searchDto = {
            searchType: requestParams.searchType || '',
            searchValue: requestParams.searchValue
          }
        }
        // 删除原始的
        delete requestParams.searchType
        delete requestParams.searchValue
        delete requestParams.dateSearchKey
        delete requestParams.dateSearchValue
        return skuPageList(requestParams)
      },
      immediate: true,
      columnsFactory,
      apiParams: {
        ...searchForm,
        hasCount: true,
        currentPage: 1,
        pageSize: 20,
        // 需求：默认按创建时间排序，最近创建的排前面
        orderBy: 'createTime',
        sortOrder: 'desc'
      }
    },
    transform: {
      // 将SKU数据转换为显示格式
      dataTransformer: (skuRecords: any[]) => {
        return skuRecords.map((record) => {
          const basic = record.productSkuBasicVo || {}
          return {
            ...basic,
            id: basic.id,
            image: basic.picUrl,
            sku: basic.sku,
            chineseProductName: basic.productChineseName,
            englishProductName: basic.productEnglishName,
            spu: basic.spu,
            spuId: basic.spuId ?? record.spuId ?? record.productSpuId,
            // 款名（中文/英文）
            chineseStyleName: basic.spuName || '',
            unit: basic.unit,
            specificationDescription: basic.specificationDescription ?? '',
            attachs: basic.attachs,
            englishStyleName: basic.spuEnName || '',
            materialCode: basic.materialCode,
            // 属性信息
            attribute: basic.attribute || basic.attributeValue || '',
            category: basic.categoryName,
            categoryId: basic.categoryId,
            brand: basic.brandName,
            brandId: basic.brandId,
            // 材质和用途
            material: basic.material || '',
            purpose: basic.purpose || '',
            productStatus:
              basic.productStatus === 0
                ? '开发中'
                : basic.productStatus === 1
                  ? '在售'
                  : basic.productStatus === 2
                    ? '清仓'
                    : '停售',
            productRemark: basic.productRemark ?? '',
            developmentUsers: basic.productDeveloperUserNames,
            productOwnerUsers: basic.productOwnerUserNames,
            createTime: basic.createTimeStr || basic.createTime,
            updateTime: basic.updateTimeStr || basic.updateTime,
            updateUser: basic.updateName,
            // 保留完整的SKU数据用于详情和编辑
            _skuData: record,
            // 保留关联销售SKU数据
            productListingRelationVo: record.productListingRelationVo || [],
            // 采购信息（来自 productPurchaseBasicVo）
            referenceDeliveryDays: record.productPurchaseBasicVo?.referenceDeliveryDays,
            referenceCost: record.productPurchaseBasicVo?.referenceCost,
            referenceCostCurrency: record.productPurchaseBasicVo?.currency,
            purchasUsers: record.productPurchaseBasicVo?.purchaseUsers ?? '', // 采购负责人展示名
            purchaseRemark: record.productPurchaseBasicVo?.purchaseRemark ?? '',
            // 供应商报价第一条（productSupplierQuotationVo 或兼容旧字段）
            ...getFirstQuoteFields(
              record.productSupplierQuotationVo?.[0] ??
                record.skuSupplierQuotationListVo?.[0] ??
                record.productPurchaseBasicVo?.skuSupplierQuotationListVo?.[0] ??
                record.productPurchaseBasicVo?.productSupplierQuotationVo?.[0] ??
                null
            ),
            // 物流/报关信息（来自 productLogisticsInfoVo）
            ...getLogisticsFields(record.productLogisticsInfoVo ?? {}),
            // 财务信息（来自 productFinanceVo）
            ...getFinanceFields(record.productFinanceInfoVo ?? {})
          }
        })
      }
    }
  })

  // 导出参数与列表查询参数保持一致：使用与 apiFn 相同的 searchDto 转换，避免导出与查询传参不一致
  const exportRequestParams = computed(() => {
    const p = { ...searchParams } as Record<string, unknown>
    if (p.searchValue) {
      p.searchDto = {
        searchType: p.searchType || '',
        searchValue: p.searchValue
      }
    }
    delete p.searchType
    delete p.searchValue
    delete p.dateSearchKey
    delete p.dateSearchValue
    return { ...p, currentPage: 1, pageSize: -1 }
  })

  // 获取状态类型
  const getStatusType = (status: string) => {
    const statusMap: Record<string, any> = {
      在售: 'success',
      开发中: 'primary',
      清仓: 'warning',
      停售: 'danger'
    }
    return statusMap[status] || 'info'
  }

  // 获取审批状态文本
  const getApprovalStatusText = (status: number | undefined) => {
    if (status === undefined || status === null) return '-'
    const statusMap: Record<number, string> = {
      0: '草稿',
      1: '审批中',
      2: '审批通过',
      3: '审批驳回'
    }
    return statusMap[status] || '-'
  }

  // 获取审批状态类型
  const getApprovalStatusType = (status: number | undefined) => {
    if (status === undefined || status === null) return 'info'
    const typeMap: Record<number, any> = {
      0: 'info', // 草稿
      1: 'warning', // 审批中
      2: 'success', // 审批通过
      3: 'danger' // 审批驳回
    }
    return typeMap[status] || 'info'
  }

  // 处理添加SKU
  const handleAddSKU = () => {
    initData.value = { handleType: 'add' }
    addSkuVisible.value = true
  }

  // 处理设置负责人
  const handleSetResponsible = () => {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请勾选数据')
      return
    }
    // 校验所选 SKU 相关板块的数据状态是否为「已生效」(approveStatus === 2)
    const notEffectiveRows = selectedRows.value.filter((row) => {
      const approveStatus = row._skuData?.productSkuBasicVo?.approveStatus
      return approveStatus !== 2
    })
    if (notEffectiveRows.length > 0) {
      ElMessage.warning('请选择"已生效"的产品')
      return
    }
    setResponsibleVisible.value = true
  }

  // 处理批量删除
  const handleBatchDelete = () => {
    if (selectedRows.value.length === 0) {
      ElMessage({
        type: 'warning',
        message: '请勾选数据',
        duration: 3000
      })
      return
    }

    ElMessageBox.confirm('删除后数据不可恢复！', '批量删除？', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const idsToDelete = selectedRows.value.map((item) => item.id!)
          for (const id of idsToDelete) {
            const res = await batchDeleteSku([id])
            // 接口返回为 axios response，需用 res.data.data 判断；后端在「有关联下游」时返回 data: true 且不删除，成功删除时返回 data: null
            const hasDownstream = res?.data?.data === true
            if (hasDownstream) {
              ElMessage.error('已关联下游单据，不支持删除')
              return
            }
          }
          selectedRows.value = []
          tableRef.value.clearSelection()
          await refreshTableData()
          ElMessage.success('删除成功')
        } catch (error: any) {
          console.error('批量删除失败:', error)
          if (shouldShowError(error) && !isHttpError(error)) {
            ElMessage.error('删除失败')
          }
        }
      })
      .catch(() => {
        // 取消删除
      })
  }

  // 处理详情
  const handleDetail = (row: SkuItem) => {
    console.log('查看详情', row)
    initData.value = { ...row, handleType: 'detail' }
    addSkuVisible.value = true
  }

  // 处理操作菜单
  const handleOperation = (command: string, row: SkuItem) => {
    console.log('操作命令:', command, '行数据:', row)

    switch (command) {
      case 'delete':
        handleSingleDelete(row)
        break
      case 'copy':
        handleCopy(row)
        break
      case 'editCommon':
        handleEditSection(row, 'common', '编辑通用信息')
        break
      case 'editBasic':
        handleEditSection(row, 'basic', '编辑基本信息')
        break
      case 'editPurchase':
        handleEditSection(row, 'purchase', '编辑采购信息')
        break
      case 'editLogistics':
        handleEditSection(row, 'logistics', '编辑物流信息')
        break
      case 'editFinance':
        handleEditSection(row, 'finance', '编辑财务信息')
        break
      case 'editSales':
        handleEditSection(row, 'sales', '编辑关联销售SKU')
        break
      case 'editImage':
        handleEditSection(row, 'image', '编辑图片信息')
        break
      case 'editCompliance':
        handleEditSection(row, 'compliance', '编辑合规信息')
        break
      default:
        console.warn('未知操作:', command)
    }
  }

  // 获取报关方式
  const getCustomsDeclarationMethod = (customsDeclarationMethod: number) => {
    // 0: '自主报关', 1: '供应商报关', 2: '供应商买单报关'
    const customsDeclarationMethodMap: Record<number, string> = {
      0: '自主报关',
      1: '供应商报关',
      2: '供应商买单报关'
    }
    return customsDeclarationMethodMap[customsDeclarationMethod] || '-'
  }

  // 处理单个删除
  const handleSingleDelete = (row: SkuItem) => {
    ElMessageBox.confirm('删除后数据不可恢复！', '确认删除？', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning'
    })
      .then(async () => {
        try {
          const res = await batchDeleteSku([row.id!])
          // 接口返回为 axios response，后端在「有关联下游」时返回 data: true，成功删除时返回 data: null
          const hasDownstream = res?.data?.data === true
          if (hasDownstream) {
            ElMessage.error('已关联下游单据，不支持删除')
            return
          }
          // 当前端判断为可删除时，上面一次调用已执行删除，无需再调
          selectedRows.value = selectedRows.value.filter((item) => item.id !== row.id)
          // 刷新列表数据
          await refreshTableData()
          ElMessage.success('删除成功')
        } catch (error: any) {
          console.error('删除失败:', error)
          if (shouldShowError(error) && !isHttpError(error)) {
            ElMessage.error('删除失败')
          }
        }
      })
      .catch(() => {
        // 取消删除
      })
  }
  const { dictData } = useDictStore()
  // 处理复制
  const handleCopy = (row: SkuItem) => {
    console.log('复制SKU', row)
    initData.value = { id: row.id, handleType: 'copy' }
    addSkuVisible.value = true
  }

  // 处理从对话框触发的复制
  const handleCopyFromDialog = (id: string | number) => {
    console.log('从对话框复制SKU', id)
    initData.value = { id, handleType: 'copy' }
    addSkuVisible.value = true
  }

  // 处理编辑板块
  const handleEditSection = (row: SkuItem, section: string, title: string) => {
    console.log(`${title}`, row, '板块:', section)
    const editTypeMap: Record<string, string> = {
      common: 'editCommon',
      basic: 'editBasic',
      purchase: 'editPurchase',
      logistics: 'editLogistics',
      finance: 'editFinance',
      sales: 'editSales',
      image: 'editImage',
      compliance: 'editCompliance'
    }
    initData.value = { ...row, handleType: 'edit', editType: editTypeMap[section] }
    addSkuVisible.value = true
  }

  // 处理选择变化
  const handleSelectionChange = (selection: SkuItem[]) => {
    selectedRows.value = selection
  }

  // 刷新数据
  const refreshData = async () => {
    await refreshTableData()
  }

  // 处理设置负责人提交
  const handleSetResponsibleSubmit = (data: any) => {
    console.log('设置负责人', data)
    ElMessage.success('设置成功')
    setResponsibleVisible.value = false
    tableRef.value.clearSelection()
    getData()
  }

  // 处理添加/编辑SKU提交
  const handleAddSkuSubmit = (data: any) => {
    console.log('提交SKU数据', data)
    ElMessage.success('操作成功')
    addSkuVisible.value = false
    getData()
  }

  // 获取第一条销售SKU
  const getFirstSalesSku = (row: any) => {
    const relationList = row.productListingRelationVo || []
    if (relationList.length > 0 && relationList[0]) {
      return relationList[0].sellerSku || ''
    }
    return ''
  }

  // 判断是否有关联销售SKU数据（用于显示悬浮框标识）
  const hasRelatedSalesSku = (row: any) => {
    const relationList = row.productListingRelationVo || []
    return relationList && relationList.length > 0
  }

  // 获取关联销售SKU列表数据（供弹窗表格展示：序号、销售SKU、ASIN、平台、店铺、区域、国家、境外收货人、销售负责人）
  const getSalesSkuList = (row: any) => {
    const relationList = row.productListingRelationVo || []
    return relationList.map((item: any) => ({
      salesSkuDisplay: item.sellerSku || '-',
      asin: item.asin ?? '-',
      platform: item.platform ?? '-',
      storeName: item.storeName ?? '-',
      area: item.area ?? '-',
      region: item.region ?? '-',
      salesEntity: item.salesEntity ?? '-',
      salesManagerNamesStr: item.salesManagerNamesStr ?? '-'
    }))
  }

  watch(
    () => addSkuVisible.value,
    async (newVal, oldVal) => {
      console.log('[Watch] addSkuVisible changed:', { oldVal, newVal })
      // 弹窗打开时请求父组件刷新下拉数据（分类/品牌/用户等），避免其他功能修改后此处仍用旧缓存
      if (newVal === true) {
        emit('refreshOptions')
      }
      // 当弹窗从打开变为关闭时刷新数据
      if (oldVal === true && newVal === false) {
        console.log('[Watch] 弹窗关闭，开始刷新数据...')
        try {
          console.log('[Watch] Calling refreshTableData()...')
          await refreshTableData() // 使用 refreshData 强制刷新
          console.log('[Watch] refreshTableData completed successfully')
        } catch (error) {
          console.error('[Watch] refreshTableData error:', error)
        }
        console.log('[Watch] 数据刷新完成')
      }
    }
  )

  // 标记是否需要在搜索完成后打开详情（只在导航触发时设为 true，打开后立即设为 false）
  const pendingOpenDetail = ref(false)

  // 打开第一条数据的详情
  const openFirstRowDetail = () => {
    if (pendingOpenDetail.value && data.value && data.value.length > 0) {
      const firstRow = data.value[0]
      console.log('[SKU] Opening detail for first row:', firstRow)
      initData.value = { ...firstRow, handleType: 'detail' }
      addSkuVisible.value = true
      // 打开后立即重置标记，防止关闭弹窗刷新数据时重复打开
      pendingOpenDetail.value = false
    }
  }

  // 监听外部传入的 openSku，自动设置搜索条件并搜索
  watch(
    () => props.openSku,
    (newSku, oldSku) => {
      // 只有当 openSku 实际变化时才触发（新的导航）
      if (newSku && newSku !== oldSku) {
        console.log('[SKU] openSku changed:', newSku)
        // 设置搜索类型为 SKU，搜索值为传入的 sku
        searchForm.searchType = 'sku'
        searchForm.searchValue = newSku
        // 标记需要在搜索完成后打开详情
        pendingOpenDetail.value = true
        // 触发搜索
        handleSearch()
      }
    },
    { immediate: true }
  )

  // 监听 loading 状态变化
  watch(
    () => loading.value,
    (isLoading) => {
      // 当 loading 变为 false 且有待打开的详情时
      if (!isLoading && pendingOpenDetail.value) {
        // 使用 setTimeout 确保数据已经更新
        setTimeout(() => {
          openFirstRowDetail()
        }, 100)
      }
    }
  )
</script>

<style lang="scss" scoped>
  .sku-manage-page {
    :deep(.el-table--small .cell) {
      display: flex;
      align-items: center;
      padding: 0 8px;
    }

    .selected-count {
      margin-left: 8px;
      font-size: 14px;
      line-height: 32px;
      color: var(--el-text-color-regular);
    }

    .image-placeholder {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60px;
      height: 60px;
      color: var(--el-text-color-placeholder);
      background-color: var(--el-fill-color-lighter);
      border-radius: 4px;
    }

    .dropdown-item-with-status {
      display: flex;
      gap: 8px;
      align-items: center;
      justify-content: space-between;
      width: 100%;

      .status-tag {
        flex-shrink: 0;
        margin-left: auto;
      }
    }

    // 修复操作按钮点击时的边框问题
    :deep(.el-table__cell) {
      // 修复操作列中的下拉按钮边框
      .el-dropdown {
        .el-button.is-link {
          padding: 0 4px !important;
          border: none !important;

          &:focus,
          &:focus-visible,
          &:active,
          &:hover {
            border-right: none !important;
            border-left: none !important;
            outline: none !important;
            box-shadow: none !important;
          }
        }
      }

      // 修复操作列中所有按钮的边框
      .el-button.is-link {
        border: none !important;

        &:focus,
        &:focus-visible,
        &:active {
          border-right: none !important;
          border-left: none !important;
          outline: none !important;
          box-shadow: none !important;
        }
      }
    }

    // 关联销售SKU列样式
    .related-sales-sku-cell {
      display: inline-flex;
      gap: 4px;
      align-items: center;
      color: #409eff;
      cursor: pointer;
      transition: color 0.2s;

      &:hover {
        color: #66b1ff;
      }

      .sales-sku-text {
        flex: 1;
      }

      .arrow-icon {
        font-size: 12px;
        transition: transform 0.2s;
      }

      &:hover .arrow-icon {
        transform: translateY(1px);
      }
    }

    // SKU 编码可点击样式
    .sku-link {
      color: var(--el-color-primary);
      cursor: pointer;

      &:hover {
        text-decoration: underline;
      }
    }

    // 关联销售SKU悬浮框内容样式
    .sales-sku-popover-content {
      .popover-title {
        padding-bottom: 8px;
        margin-bottom: 12px;
        font-size: 14px;
        font-weight: 500;
        color: #303133;
        border-bottom: 1px solid #ebeef5;
      }
    }
  }
</style>
