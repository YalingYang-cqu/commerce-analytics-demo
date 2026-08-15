<template>
  <div class="spu-manage-page art-full-height">
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
      :updateColumn="updateColumn"
      :resetColumns="resetColumns"
      :exportApi="exportSpu"
      tableName="spu1"
      :exportParams="exportRequestParams"
      exportAuth="product:spu:common:export"
    >
      <template #left>
        <ElSpace wrap>
          <ElButton type="primary" @click="handleAddSPU" v-ripple v-auth="'product:spu:common:add'"
            >添加SPU</ElButton
          >
          <ElButton @click="handleSetResponsible" v-ripple v-auth="'product:spu:common:setLeader'"
            >设置负责人</ElButton
          >
          <ElButton @click="handleBatchDelete" v-ripple v-auth="'product:spu:common:delete'"
            >删除</ElButton
          >
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
        :data="flattenTree(data)"
        :pagination="pagination"
        row-key="tempId"
        tableKey="spu"
        :columns="columns"
        :columnChecks="columnChecks"
        @selection-change="handleSelectionChange"
        @pagination:size-change="handleSizeChange"
        @pagination:current-change="handleCurrentChange"
        :tree-props="
          !hasAuth('product:spu:skus')
            ? undefined
            : { children: 'skuList', hasChildren: 'hasChildren' }
        "
        :default-expand-all="false"
      >
        <!-- 图片列 -->
        <template #image="{ row }">
          <div v-if="!isChildRow(row)">
            <ElImage
              v-if="row.picUrl"
              :src="getUrl(row.picUrl)"
              :preview-src-list="[getUrl(row.picUrl)]"
              :preview-teleported="true"
              fit="cover"
              style="width: 60px; height: 60px; border-radius: 4px"
            />
            <div v-else class="image-placeholder">
              <ElIcon :size="40"><Picture /></ElIcon>
            </div>
          </div>
        </template>
        <!-- SPU -->
        <template #spu="{ row }">
          <div v-if="!isChildRow(row)">
            <el-link type="primary" @click.stop="handleDetail(row)">
              <div>{{ row.spu }}</div>
            </el-link>
          </div>
        </template>
        <!-- 中文款名/英文款名列 -->
        <template #styleName="{ row }">
          <div>
            <div>{{ row.spuName || '' }}</div>
            <div style="font-size: 12px; color: #909399">{{ row.spuEnName || '' }}</div>
          </div>
        </template>
        <!-- SKU 列：子行点击打开 SKU 详情弹框（有 skuId 时展示为可点链接） -->
        <template #sku="{ row }">
          <div v-if="isChildRow(row)">
            <SkuCodeLink
              v-if="row.sku && (row.skuId ?? row.id ?? row.productId)"
              :sku-code="row.sku"
              :sku-id="row.skuId ?? row.id ?? row.productId"
            />
            <span v-else>{{ row.sku || '-' }}</span>
          </div>
        </template>
        <!-- 中文品名/英文品名列 -->
        <template #productName="{ row }">
          <div v-if="isChildRow(row)">
            <div>{{ row.productChineseName }}</div>
            <div style="font-size: 12px; color: #909399">{{ row.productEnglishName }}</div>
          </div>
        </template>
        <!-- 物料编码-->
        <template #materialCode="{ row }">
          <div v-if="isChildRow(row)">
            {{ row.materialCode }}
          </div>
        </template>
        <!-- 单位列 -->
        <template #unit="{ row }">
          {{ pubFilter(dictData['spuUnit'], row.unit) }}
        </template>
        <!-- 状态列 -->
        <template #productStatus="{ row }">
          <ElTag
            :type="getStatusType(row.productStatus)"
            v-if="pubFilter(dictData['productStatus'], row.productStatus)"
          >
            {{ pubFilter(dictData['productStatus'], row.productStatus) }}</ElTag
          >
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

        <!-- 单箱毛重表头 -->
        <!-- <template #boxGrossWeight-header>
          <div style="line-height: 1.2">
            <div>单箱毛重</div>
            <div style="font-size: 12px; color: #909399">(公制/英制)</div>
          </div>
        </template> -->
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
        <!-- 操作列 -->
        <template #operation="{ row }">
          <template v-if="!isChildRow(row)">
            <ElButton type="primary" link size="small" @click="handleDetail(row)">详情</ElButton>
            <ElDropdown @command="(cmd) => handleOperation(cmd, row)">
              <ElButton
                type="primary"
                link
                size="small"
                v-auth="
                  'product:spu:common:delete|product:spu:basic:edit|product:spu:skus:edit|product:spu:finance:edit|product:spu:certification:edit'
                "
              >
                操作<ElIcon class="el-icon--right"><ArrowDown /></ElIcon>
              </ElButton>
              <template #dropdown>
                <ElDropdownMenu>
                  <ElDropdownItem command="delete" v-if="hasAuth('product:spu:common:delete')"
                    >删除</ElDropdownItem
                  >
                  <!-- <ElDropdownItem command="copy" v-if="hasAuth('product:spu:common:copy')"
                    >复制</ElDropdownItem
                  > -->
                  <ElDropdownItem command="editCommon" v-if="hasAuth('product:spu:basic:edit')"
                    >编辑通用信息</ElDropdownItem
                  >
                  <ElDropdownItem command="editBasic" v-if="hasAuth('product:spu:basic:edit')"
                    >编辑基础信息</ElDropdownItem
                  >
                  <ElDropdownItem command="editProduct" v-if="hasAuth('product:spu:skus:edit')"
                    >编辑包含产品</ElDropdownItem
                  >
                  <ElDropdownItem command="editFinance" v-if="hasAuth('product:spu:finance:edit')"
                    >编辑财务信息</ElDropdownItem
                  >
                  <ElDropdownItem
                    command="editCert"
                    v-if="hasAuth('product:spu:certification:edit')"
                    >编辑合规认证</ElDropdownItem
                  >
                </ElDropdownMenu>
              </template>
            </ElDropdown>
          </template>
        </template>
      </ArtTable>
    </ElCard>

    <!-- 设置负责人弹窗 -->
    <SetResponsiblePerson
      v-model:visible="setResponsibleVisible"
      :selected-rows="selectedRows"
      @submit="handleSetResponsibleSubmit"
    />

    <!-- 添加SPU弹窗 -->
    <AddSPUDialog
      v-model:visible="addSPUVisible"
      @submit="handleAddSPUSubmit"
      @close="handleDialogClose"
      :initData="initData"
      from="spu"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, reactive, watch } from 'vue'
  import {
    ElButton,
    ElSpace,
    ElCard,
    ElImage,
    ElIcon,
    ElMessage,
    ElMessageBox,
    ElDropdown,
    ElDropdownMenu,
    ElDropdownItem
  } from 'element-plus'
  import { ArrowDown } from '@element-plus/icons-vue'
  import ArtTable from '@/components/core/tables/art-table/index.vue'
  import ArtTableHeader from '@/components/core/tables/art-table-header/index.vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import { useTable } from '@/composables/useTable'
  import SetResponsiblePerson from './modules/set-responsible-person.vue'
  import AddSPUDialog from './modules/add-spu-dialog/index.vue'
  import {
    addSpu,
    deleteSpu,
    exportSpu,
    setResponsiblePerson,
    spuPageList
  } from '@/api/product/spu'
  import { useDictStore } from '@/store/modules/dict'
  import { pubFilter } from '@/utils/common-util'
  import { getUuid, pubBrandList, pubCategoryList, pubGetUserList } from '@/utils'
  import { useAuth } from '@/composables/useAuth'
  import FileUpload from '@/components/core/upload-custom/index.vue'
  import { Picture } from '@element-plus/icons-vue'
  import SkuCodeLink from '@/components/core/bussiness/sku-code-link.vue'

  defineOptions({ name: 'SPUManage' })

  // Props 定义
  interface Props {
    openSpu?: string // 从外部传入的要打开详情的 spu
  }

  const props = withDefaults(defineProps<Props>(), {
    openSpu: undefined
  })

  const { hasAuth } = useAuth()
  // SPU数据类型
  interface SPUItem {
    id?: string | number
    image?: string
    spu: string
    chineseStyleName?: string
    englishStyleName?: string
    sku?: string
    spuName?: string
    spuEnName?: string
    category?: string
    brand?: string
    productStatus: string
    productDeveloperUsers?: string
    productOwnerUserList?: string
    children?: any[] | null
    isChildRow?: boolean
  }
  // 获取状态类型
  const getStatusType = (status: string) => {
    const statusMap: Record<string, any> = {
      1: 'success',
      0: 'primary',
      2: 'warning',
      3: 'danger'
    }
    return statusMap[status] || 'info'
  }
  // 表格引用
  const tableRef = ref()
  const selectedRows = ref<SPUItem[]>([])
  const setResponsibleVisible = ref(false)
  const addSPUVisible = ref(false)
  const initData = ref({})

  // 搜索表单
  const searchForm = reactive({
    searchType: 'spu', // 复合搜索的搜索类型
    searchValue: '', // 复合搜索的搜索值
    categoryIdList: [],
    brandIdList: [],
    productStatusList: [],
    productDeveloperUsers: [],
    productOwnerUsers: [],
    dateSearchValue: '',
    dateSearchKey: 'createTimeRange'
  })
  const { dictData } = useDictStore()
  // 处理搜索事件
  const handleSearch = () => {
    // 构建搜索参数
    const params: any = searchForm
    // 根据选择的日期类型设置对应的日期范围字段
    if (searchForm?.dateSearchValue && searchForm?.dateSearchValue?.length === 2) {
      if (searchForm.dateSearchKey === 'createTimeRange') {
        params.createTimeStart = searchForm.dateSearchValue[0]
        params.createTimeEnd = searchForm.dateSearchValue[1]
        params.updateTimeStart = null
        params.updateTimeEnd = null
      } else if (searchForm.dateSearchKey === 'updateTimeRange') {
        params.updateTimeStart = searchForm.dateSearchValue[0]
        params.updateTimeEnd = searchForm.dateSearchValue[1]
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
    fetchData()
  }
  // 搜索项配置
  const searchItems = computed(() => [
    // 输入框类型的复合搜索
    {
      key: 'searchValue',
      label: '',
      compositeSearch: true,
      selectOptions: [
        { label: 'SPU', value: 'spu' },
        { label: '中文款名', value: 'spuName' },
        { label: '英文款名', value: 'spuEnName' },
        { label: 'SKU', value: 'sku' },
        { label: '中文品名', value: 'productChineseName' },
        { label: '英文品名', value: 'productEnglishName' },
        { label: '物料编码', value: 'materialCode' }
      ],
      selectKey: 'searchType', // select 的值存储在 searchType
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
        options: categoryAll.value
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
        options: brandAll.value,
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
        options: dictData['productStatus'],
        clearable: true
      }
    },
    {
      key: 'productDeveloperUsers',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      placeholder: '开发人',
      width: '140px',
      props: {
        options: userAll.value,
        clearable: true
      }
    },
    {
      key: 'productOwnerUsers',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      placeholder: '产品负责人',
      width: '140px',
      props: {
        options: userAll.value,
        clearable: true
      }
    },
    {
      key: 'financeUserIds',
      label: '',
      type: 'select',
      selectMultiple: true,
      width: '140px',
      alwaysFilterInput: true,
      labelValue: { name: 'label', value: 'value' },
      placeholder: '财务负责人',
      props: {
        options: userAll.value,
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

  // 判断是否为子行（children行）
  const isChildRow = (row: SPUItem) => {
    return !!row.isChildRow
  }
  const getUrl = (dataC: any) => {
    return dataC ? JSON.parse(dataC)?.[0]?.url : ''
  }
  // 列配置工厂函数（使用 computed 使其响应式，当权限变化时自动更新）
  const columnsFactory = computed(() => [
    {
      type: 'selection',
      width: 70,
      selectable: (row: SPUItem) => !isChildRow(row), // 子行不可选择
      fixed: 'left'
    },
    {
      prop: 'image',
      label: '图片',
      width: 100,
      align: 'center',
      useSlot: true,
      hide: !hasAuth('product:spu:common')
    },
    {
      prop: 'spu',
      label: 'SPU',
      minWidth: 120,
      useSlot: true,
      hide: !hasAuth('product:spu:common')
    },
    {
      prop: 'styleName',
      label: '中文款名/英文款名',
      minWidth: 180,
      useSlot: true,
      hide: !hasAuth('product:spu:common')
    },
    {
      prop: 'sku',
      label: 'SKU',
      minWidth: 120,
      useSlot: true,
      hide: !hasAuth('product:spu:skus')
    },
    {
      prop: 'productName',
      label: '中文品名/英文品名',
      minWidth: 180,
      useSlot: true,
      hide: !hasAuth('product:spu:skus')
    },
    {
      prop: 'materialCode',
      label: '物料编码',
      minWidth: 100,
      useSlot: true,
      hide: !hasAuth('product:spu:skus')
    },
    {
      prop: 'categoryName',
      label: '分类',
      minWidth: 150,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'brandName',
      label: '品牌',
      minWidth: 120,
      canWrap: true,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'unit',
      label: '单位',
      minWidth: 60,
      useSlot: true,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'productStatus',
      label: '状态',
      minWidth: 90,
      align: 'center',
      useSlot: true,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'productDeveloperUserNames',
      label: '开发人',
      minWidth: 100,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'productOwnerUserNames',
      label: '产品负责人',
      minWidth: 100,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'accountNames',
      label: '分配店铺',
      minWidth: 100,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'productRemark',
      label: '产品备注',
      minWidth: 160,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'attachs',
      label: '附件',
      minWidth: 160,
      useSlot: true,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'productNetWeight',
      label: '单品净重',
      minWidth: 100,
      useSlot: true,
      useHeaderSlot: true,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'productGrossWeight',
      label: '单品毛重',
      minWidth: 100,
      useSlot: true,
      useHeaderSlot: true,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'productSize',
      label: '单品尺寸',
      minWidth: 200,
      useSlot: true,
      useHeaderSlot: true,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'productPackageSize',
      label: '包装尺寸',
      minWidth: 200,
      useSlot: true,
      useHeaderSlot: true,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'boxNetWeight',
      label: '单箱净重',
      minWidth: 100,
      useSlot: true,
      useHeaderSlot: true,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'boxGrossWeight',
      label: '单箱毛重',
      minWidth: 100,
      useSlot: true,
      useHeaderSlot: true,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'boxNum',
      label: '单箱数量（pcs）',
      minWidth: 120,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: 'boxSize',
      label: '单箱尺寸',
      minWidth: 200,
      useSlot: true,
      useHeaderSlot: true,
      hide: !hasAuth('product:spu:basic')
    },
    {
      prop: ['spuFinanceInfo', 'purchaseOrganizationName'],
      label: '采购主体',
      minWidth: 100,
      hide: !hasAuth('product:spu:finance')
    },
    {
      prop: ['spuFinanceInfo', 'customsOrganizationName'],
      label: '报关主体',
      width: 100,
      hide: !hasAuth('product:spu:finance')
    },
    {
      prop: ['spuFinanceInfo', 'saleOrganizationName'],
      label: '境外收货人',
      minWidth: 100,
      hide: !hasAuth('product:spu:finance')
    },
    {
      prop: ['spuFinanceInfo', 'financeUserIdNames'],
      label: '财务负责人',
      minWidth: 100,
      hide: !hasAuth('product:spu:finance')
    },
    { prop: 'createTime', label: '创建时间', minWidth: 100 },
    { prop: 'updateTime', label: '最近更新时间', minWidth: 100 },
    { prop: 'updateName', label: '更新人', minWidth: 100 },
    { prop: 'operation', label: '操作', width: 100, fixed: 'right', align: 'center', useSlot: true }
  ])
  const flattenTree = (tree: any[]): SPUItem[] => {
    tree.forEach((item: SPUItem) => {
      if (item.children && item.children.length) {
        flattenTree(item.children)
      } else {
        item.children = null
      }
    })
    return tree
  }
  const {
    data,
    loading,
    pagination,
    columns,
    columnChecks,
    resetColumns,
    updateColumn,
    fetchData,
    refreshRemove,
    refreshData: refreshTableData,
    handleSizeChange,
    resetSearchParams,
    searchParams,
    handleCurrentChange
  } = useTable({
    core: {
      apiFn: (params: any) => {
        console.log(params, 'paramsparams')
        // 请求前参数处理：将 searchType 和 searchValue 合并为 searchDto
        const requestParams = { ...params }
        if (requestParams.searchValue) {
          requestParams.searchDto = {
            searchType: requestParams.searchType || '',
            searchValue: requestParams.searchValue
          }
        }
        const skuAbout = ['sku', 'productChineseName', 'productEnglishName', 'materialCode']
        skuAbout.forEach((v: any) => {
          if (v != requestParams.searchType) {
            requestParams[v] = null
          } else {
            requestParams[`${v}Like`] = requestParams.searchValue
            requestParams.searchDto = null
          }
        })
        // 删除原始的
        delete requestParams.searchType
        delete requestParams.searchValue
        delete requestParams.dateSearchKey
        delete requestParams.dateSearchValue
        return spuPageList(requestParams)
      },
      tableKey: 'spu',
      immediate: true,
      columnsFactory,
      apiParams: {
        ...searchForm,
        hasCount: true,
        currentPage: 1,
        pageSize: 20
      }
    },
    // 数据处理
    transform: {
      // 自定义响应适配器，处理后端特殊的返回格式
      responseAdapter: (data: any) => {
        console.log(data, '777777')
        data.data.records.forEach((item: any) => {
          item.tempId = getUuid()
          item.skuList.forEach((v: any) => {
            v.isChildRow = true
            v.tempId = getUuid()
            // 子行（SKU）后端在顶层返回 purchaseOrganizationName/customsOrganizationName/saleOrganizationName，表格列读取 spuFinanceInfo.xxx，此处统一放入 spuFinanceInfo 以便列能展示
            const finance = v.spuFinanceInfo || {}
            v.spuFinanceInfo = {
              ...finance,
              purchaseOrganizationName:
                v.purchaseOrganizationName ?? finance.purchaseOrganizationName,
              customsOrganizationName: v.customsOrganizationName ?? finance.customsOrganizationName,
              saleOrganizationName: v.saleOrganizationName ?? finance.saleOrganizationName,
              financeUserIdNames: v.financeUsers ?? ''
            }
          })
        })
        // const { list, total, pageNum, pageSize } = data
        return {
          records: data.data.records,
          total: data.data.total
        }
      }
    }
  })

  // 导出参数与列表查询参数保持一致：使用与 apiFn 相同的 searchDto / xxxLike 转换，避免导出与查询传参不一致
  const exportRequestParams = computed(() => {
    const p = { ...searchParams } as Record<string, unknown>
    if (p.searchValue) {
      p.searchDto = {
        searchType: p.searchType || '',
        searchValue: p.searchValue
      }
    }
    const skuAbout = ['sku', 'productChineseName', 'productEnglishName', 'materialCode']
    skuAbout.forEach((v: string) => {
      if (v !== p.searchType) {
        p[v] = null
      } else {
        p[`${v}Like`] = p.searchValue
        p.searchDto = null
      }
    })
    delete p.searchType
    delete p.searchValue
    delete p.dateSearchKey
    delete p.dateSearchValue
    return { ...p, currentPage: 1, pageSize: 10000 }
  })

  const userAll: any = ref([])
  const brandAll: any = ref([])
  const categoryAll: any = ref([])
  // 获取负责人
  const getAllUserInfoAction = async (): Promise<void> => {
    userAll.value = await pubGetUserList([0, 1])
  }
  // 获取品牌
  const getBrandPageList = async () => {
    brandAll.value = await pubBrandList({ brandStatus: null })
  }

  // 获取分类
  const getAllTree = async () => {
    categoryAll.value = await pubCategoryList({ status: null })
  }
  onMounted(() => {
    getAllUserInfoAction()
    getBrandPageList()
    getAllTree()
  })
  // 处理添加SPU
  const handleAddSPU = () => {
    initData.value = { handleType: 'add' }
    addSPUVisible.value = true
  }

  // 处理设置负责人
  const handleSetResponsible = () => {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请勾选数据')
      return
    }
    setResponsibleVisible.value = true
  }
  const clearSelection = () => {
    selectedRows.value = []
    tableRef.value.clearSelection()
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
        await deleteSpu(selectedRows.value.map((v: any) => v.id))
        clearSelection()
        refreshRemove() // 刷新数据
        ElMessage.success('操作成功')
        tableRef.value.clearSelection()
      })
      .catch(() => {
        // 取消删除
      })
  }

  // 处理详情
  const handleDetail = (row: SPUItem) => {
    console.log('查看详情', row)
    initData.value = { handleType: 'detail', ...row, dialogTitle: '详情' }
    addSPUVisible.value = true
  }

  // 处理操作
  const handleOperation = (command: string, row: SPUItem) => {
    console.log(command, 'commandcommand')
    if (command === 'delete') {
      ElMessageBox.confirm('删除后数据不可恢复！', '确定删除？', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
        .then(async () => {
          await deleteSpu([row.id])
          refreshRemove() // 刷新数据
        })
        .catch(() => {
          // 取消删除
        })
    } else {
      console.log('编辑', row)
      addSPUVisible.value = true
      initData.value = { ...row, handleType: 'edit', editType: command, dialogTitle: '编辑' }
    }
    // } else if (command === 'copy') {
    //     addSPUVisible.value = true
    //     initData.value = { ...row, handleType: command, dialogTitle: '复制' }
    //   } else {
  }

  // 处理选择变化
  const handleSelectionChange = (selection: SPUItem[]) => {
    selectedRows.value = selection
  }

  // 刷新数据
  const refreshData = async () => {
    await refreshTableData()
    // ElMessage.success('刷新成功')
  }

  // 处理设置负责人提交
  const handleSetResponsibleSubmit = async (data: any) => {
    console.log('设置负责人', data)
    await setResponsiblePerson(data)
    refreshTableData()
    ElMessage.success('操作成功')
    setResponsibleVisible.value = false
    tableRef.value.clearSelection()
  }

  // 处理添加SPU提交
  const handleAddSPUSubmit = async (data: any) => {
    console.log('添加SPU', data)
    await addSpu(data)
    ElMessage.success('操作成功')
    addSPUVisible.value = false
    // 刷新数据
    refreshData()
  }
  // 处理弹窗关闭事件
  const handleDialogClose = (needRefresh: boolean) => {
    // 如果编辑保存过，需要刷新列表数据
    if (needRefresh) {
      refreshData()
    }
  }

  // 标记是否需要在搜索完成后打开详情（只在导航触发时设为 true，打开后立即设为 false）
  const pendingOpenDetail = ref(false)

  // 打开第一条数据的详情
  const openFirstRowDetail = () => {
    if (pendingOpenDetail.value && data.value && data.value.length > 0) {
      const firstRow = data.value[0]
      console.log('[SPU] Opening detail for first row:', firstRow)
      initData.value = { handleType: 'detail', ...firstRow, dialogTitle: '详情' }
      addSPUVisible.value = true
      // 打开后立即重置标记，防止关闭弹窗刷新数据时重复打开
      pendingOpenDetail.value = false
    }
  }

  // 监听外部传入的 openSpu，自动设置搜索条件并搜索
  watch(
    () => props.openSpu,
    (newSpu, oldSpu) => {
      // 只有当 openSpu 实际变化时才触发（新的导航）
      if (newSpu && newSpu !== oldSpu) {
        console.log('[SPU] openSpu changed:', newSpu)
        // 设置搜索类型为 SPU，搜索值为传入的 spu
        searchForm.searchType = 'spu'
        searchForm.searchValue = newSpu
        // 标记需要在搜索完成后打开详情
        pendingOpenDetail.value = true
        // 触发搜索
        handleSearch()
      }
    },
    { immediate: true }
  )

  // 监听 loading 状态变化，搜索完成后自动打开第一条数据的详情
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
  .spu-manage-page {
    :deep(.el-table--small .cell) {
      display: flex;
      align-items: center;
      padding: 0 8px;

      :deep(.el-upload-list__item-actions),
      :deep(.el-upload-list__item) {
        width: 60px !important;
        height: 60px !important;
      }
    }

    // 展开图标不展示在勾选列内：图标 DOM 在第一列，用绝对定位移到第一列右边界外，视觉上只在第二列
    :deep(.el-table__body-wrapper tr td:first-child),
    :deep(.el-table__body-wrapper tr td:first-child .cell) {
      position: relative;
      overflow: visible;
    }

    :deep(.el-table__body-wrapper) {
      tr td:first-child:not(.art-table-column-selection) {
        button {
          margin-right: 10px;
        }

        .el-table__placeholder {
          padding-right: 10px;
        }
      }
    }
    // 除勾选列外的第一列：无勾选列时用 first-child；有勾选列时第一列是勾选列，用「勾选列 + 下一列」
    // :deep(.el-table__body-wrapper tr td:not(.art-table-column-selection):first-child),
    // :deep(.el-table__body-wrapper tr td.art-table-column-selection + td) {
    //   .cell {
    //     padding-left: 32px !important;
    //   }
    // }

    // :deep(.el-table__expand-icon) {
    //   position: absolute;
    //   right: auto;
    //   left: 10px;
    //   z-index: 2;
    //   margin-left: 2px;
    // }

    :deep(td.art-table-column-selection) {
      button {
        margin-right: 5px;
      }

      .el-table__placeholder {
        padding-right: 5px;
      }
    }

    :deep(th.art-table-column-selection) {
      label {
        margin-left: 23px;
      }
    }

    // :deep(.el-table__body-wrapper tr td:nth-child(2) .cell) {
    //   overflow: visible;
    // }

    // :deep(td) {
    //   .el-image,
    //   .image-placeholder {
    //     margin-left: -10px;
    //   }
    // }

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

    // 隐藏子行的复选框
    :deep(.el-table) {
      // 子行（level-1 表示第一级子行）
      .el-table__row.el-table__row--level-1 {
        td:first-child {
          .el-checkbox {
            display: none !important;
          }
        }
      }
    }
  }
</style>
