<template>
  <ElDialog
    v-model="dialogVisible"
    :title="computedDialogTitle"
    width="90%"
    append-to-body
    align-center
    @close="handleClose"
    class="add-spu-dialog"
    top="15vh"
  >
    <div class="add-spu-dialog-wrapper" v-loading="loading">
      <!-- 顶部SPU信息 -->
      <div class="top-section">
        <div
          class="image-upload"
          :class="{ 'has-upload': formData.image.length, 'no-upload': !formData.image.length }"
        >
          <ElFormItem label="" prop="image">
            <FileUpload
              :disabled="!showTopFormEditMode"
              v-model="formData.image"
              :max-count="1"
              accept=".jpg,.jpeg,.png"
              list-type="picture-card"
            >
              <template #trigger>
                <el-icon><Plus /></el-icon>
              </template>
            </FileUpload>
          </ElFormItem>
        </div>
        <div class="top-form">
          <div class="top-form-header">
            <ElForm
              ref="topFormRef"
              v-if="showTopFormEditMode"
              :model="formData"
              :rules="topFormRules"
              label-width="90px"
            >
              <ElRow :gutter="20">
                <ElCol :span="6">
                  <ElFormItem label="SPU:" prop="spu" required>
                    <ElInput
                      v-model="formData.spu"
                      :disabled="initData.id && initData.handleType !== 'copy'"
                      placeholder="仅可使用字母/数字/短杠/下划线"
                      clearable
                    />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="中文款名:" prop="spuName" required>
                    <ElInput v-model="formData.spuName" placeholder="请输入" clearable />
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="英文款名:" prop="spuEnName" required>
                    <ElInput v-model="formData.spuEnName" placeholder="请输入" clearable />
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
            <ElForm ref="topFormRef" :model="formData" v-else label-width="90px">
              <ElRow :gutter="20">
                <ElCol :span="6">
                  <ElFormItem label="SPU:" prop="spu" required>
                    <span class="readonly-text">{{ formData.spu || '-' }}</span>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="中文款名:" prop="spuName" required>
                    <span class="readonly-text">{{ formData.spuName || '-' }}</span>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="英文款名:" prop="spuEnName" required>
                    <span class="readonly-text">{{ formData.spuEnName || '-' }}</span>
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
            <!-- 顶部表单编辑按钮 -->
            <div v-if="showTopFormEditButtons && props.from === 'spu'" class="top-form-actions">
              <template v-if="topFormEditState">
                <ElButton @click="handleTopFormCancel" :disabled="loadingStates.topFormSave"
                  >取消</ElButton
                >
                <ElButton
                  type="primary"
                  @click="handleTopFormSave"
                  :loading="loadingStates.topFormSave"
                  :disabled="loadingStates.topFormSave"
                  >保存</ElButton
                >
              </template>
              <template v-else>
                <ElButton @click="handleTopFormEdit" v-auth="'product:spu:basic:edit'"
                  >编辑</ElButton
                >
              </template>
            </div>
          </div>
        </div>
      </div>
      <div class="handle-section">
        <!-- 统一的编辑按钮区域 -->
        <div
          v-if="canShowHandleSection && activeTab !== 'operation-log' && props.from === 'spu'"
          class="edit-buttons-wrapper"
        >
          <div class="header-actions">
            <template v-if="currentEditState">
              <ElButton @click="handleCancel" :disabled="loadingStates.save">取消</ElButton>
              <ElButton
                type="primary"
                @click="() => handleSave()"
                :loading="loadingStates.save"
                :disabled="loadingStates.save"
                >保存</ElButton
              >
            </template>
            <template v-else>
              <ElButton @click="handleEdit">编辑</ElButton>
            </template>
          </div>
        </div>

        <!-- Tab导航 -->
        <ElTabs v-model="activeTab" class="spu-tabs big" :before-leave="handleTabsBeforeLeave">
          <ElTabPane label="基础信息" name="basic" v-if="hasAuth('product:spu:basic')">
            <div
              v-if="showBasicEditMode"
              class="basic-info-edit-wrapper"
              v-auth="'product:spu:basic:edit'"
            >
              <BasicInfo ref="basicInfoRef" v-model="formData.basicInfo" />
            </div>
            <div v-else class="basic-info-detail-wrapper" v-auth="'product:spu:basic:view'">
              <BasicInfoDetail :model-value="formData.basicInfo" />
            </div>
          </ElTabPane>
          <ElTabPane label="包含产品" name="products" v-if="hasAuth('product:spu:skus')">
            <div
              v-if="showProductsEditMode"
              class="products-edit-wrapper"
              v-auth="'product:spu:skus:edit'"
            >
              <AssociatedProducts
                ref="productsRef"
                v-model="formData.products"
                :spu="formData.spu"
                :productSpuId="props.initData?.id"
                :spu-name="formData.spuName"
                :spu-en-name="formData.spuEnName"
              />
            </div>
            <div v-else class="products-detail-wrapper" v-auth="'product:spu:skus:view'">
              <AssociatedProductsDetail :model-value="formData.products" />
            </div>
          </ElTabPane>
          <ElTabPane label="财务信息" name="financial" v-if="hasAuth('product:spu:finance')">
            <div
              v-if="showFinancialEditMode"
              class="financial-edit-wrapper"
              v-auth="'product:spu:finance:edit'"
            >
              <FinancialInfo ref="financialInfoRef" v-model="formData.financialInfo" />
            </div>
            <div v-else class="financial-detail-wrapper" v-auth="'product:spu:finance:view'">
              <FinancialInfoDetail :displayData="displayData" />
            </div>
          </ElTabPane>
          <ElTabPane label="合规认证" name="compliance" v-if="hasAuth('product:spu:certification')">
            <div
              v-if="showComplianceEditMode"
              class="compliance-edit-wrapper"
              v-auth="'product:spu:certification:edit'"
            >
              <ComplianceCertification ref="complianceRef" v-model="formData.compliance" />
            </div>
            <div v-else class="compliance-detail-wrapper" v-auth="'product:spu:certification:view'">
              <ComplianceCertificationDetail :model-value="formData.compliance" />
            </div>
          </ElTabPane>
          <ElTabPane
            label="操作日志"
            name="operation-log"
            v-if="showEditButtons && initData.handleType !== 'copy'"
          >
            <!-- <OperationLog :spu-id="formData.spu" :sku="formData.sku" /> -->
            <OperationLog
              ref="operationLogRef"
              :params="{
                logKey: 'PRODUCT_SPU@',
                relationCode: props.initData?.id,
                permKeys: authCodes
              }"
              :visible="dialogVisible"
            />
          </ElTabPane>
        </ElTabs>
      </div>
    </div>

    <template #footer>
      <div class="dialog-footer" v-if="['add', 'copy', undefined].includes(initData.handleType)">
        <ElButton @click="handleClose" :disabled="loadingStates.submit">取消</ElButton>
        <ElButton
          type="primary"
          @click="handleSubmit"
          :loading="loadingStates.submit"
          :disabled="loadingStates.submit"
          >确定</ElButton
        >
      </div>
      <!-- <div class="dialog-footer right" v-else>
        <ElButton @click="handleClose">关闭</ElButton>
        <ElButton
          v-auth="'product:spu:common:copy'"
          v-if="!['add', 'copy', undefined].includes(initData.handleType)"
          @click="handleCopy"
          >复制</ElButton
        >
      </div> -->
    </template>
  </ElDialog>

  <!-- Tab 切换确认（编辑态 + 有未保存改动时拦截，与 SKU 一致） -->
  <ElDialog
    v-model="tabSwitchConfirmVisible"
    title="确定切换?"
    width="420px"
    append-to-body
    align-center
    :close-on-click-modal="false"
    @closed="onTabSwitchDialogClosed"
  >
    <p style="margin: 0; line-height: 1.6">切换视图后，将不保留当前编辑信息</p>
    <template #footer>
      <ElButton :loading="tabSwitchSaving" @click="onTabSwitchSaveAndLeave">保存并切换</ElButton>
      <ElButton @click="onTabSwitchDialogCancel">取消</ElButton>
      <ElButton type="primary" @click="onTabSwitchDiscard">确定</ElButton>
    </template>
  </ElDialog>

  <!-- 复制弹窗（覆盖在当前弹窗上面）- 只有非嵌套弹窗才渲染复制弹窗，避免递归 -->
  <Teleport to="body">
    <AddSPUDialog
      v-if="!props.isNested"
      v-model:visible="addSPUVisible"
      @submit="handleAddSPUSubmit"
      @close="handleDialogClose"
      :initData="initDataNew"
      :isNested="true"
      class="copy-dialog-overlay"
    />
  </Teleport>
</template>

<script setup lang="ts">
  import { ref, computed, reactive, watch, nextTick } from 'vue'
  import {
    ElDialog,
    ElForm,
    ElFormItem,
    ElInput,
    ElButton,
    ElTabs,
    ElTabPane,
    // ElUpload,
    ElIcon,
    ElMessage,
    // ElImage,
    type FormInstance,
    type FormRules
  } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import BasicInfo from './basic-info/index.vue'
  import BasicInfoDetail from './basic-info/detail.vue'
  import AssociatedProducts from './associated-products/index.vue'
  import AssociatedProductsDetail from './associated-products/detail.vue'
  import FinancialInfo from './financial-info/index.vue'
  import FinancialInfoDetail from './financial-info/detail.vue'
  import ComplianceCertification from './compliance-certification/index.vue'
  import ComplianceCertificationDetail from './compliance-certification/detail.vue'
  import OperationLog from '@/components/core/operation-log.vue'
  import FileUpload from '@/components/core/upload-custom/index.vue'
  import {
    addSpu,
    getBasic,
    getCertification,
    getFinance,
    getProducts,
    updateCertificationList,
    updateContains,
    updateFinanceInfo,
    updateProductSpuBasic
  } from '@/api/product/spu'
  import { compareDataChanges } from '@/utils/common-util'
  // 导入自身组件用于复制弹窗
  import AddSPUDialog from './index.vue'
  import { useAuth } from '@/composables/useAuth'
  import { getUuid } from '@/utils'
  import {
    normalizeComplianceCountryToCodes,
    serializeComplianceCountryForApi
  } from '@/utils/compliance-country'
  import { getAllUserInfo } from '@/api/userInfo'
  import { brandPageList } from '@/api/basic/brand'
  import { categoryPageList } from '@/api/basic/category'
  import { properPageList } from '@/api/basic/property'
  import { companyPageList } from '@/api/finance/company-subject'
  import { getAllStoreInfo } from '@/api/system-manage'
  import { UserInfoResponse } from '@/views/system/dept-manage/index.vue'
  const { hasAuth } = useAuth()
  interface Props {
    visible: boolean
    initData: any
    isNested?: boolean // 标识是否是嵌套弹窗（复制弹窗）
    from?: string
  }
  const props = defineProps<Props>()
  const userAll = ref([])
  const brandAll = ref([])
  const categoryAll = ref([])
  const propertyAll = ref([])
  const companyAll = ref([])
  const storeAll = ref([])
  if (props.from !== 'spu') {
    provide('basicData', {
      userAll,
      categoryAll,
      brandAll,
      propertyAll,
      companyAll,
      storeAll
    })
  }

  // 获取负责人
  const getAllUserInfoAction = async (): Promise<void> => {
    const dataC: any = await getAllUserInfo()
    userAll.value =
      dataC?.data?.flatMap((v: UserInfoResponse) =>
        v.status === 0 ? [] : [{ value: v.id, label: v.userName }]
      ) || []
  }
  // 获取品牌
  const getBrandPageList = async () => {
    const res: any = await brandPageList({ currentPage: 1, pageSize: -1, brandStatus: 1 })
    brandAll.value =
      res?.data?.records?.map((v: any) => ({ value: v.id, label: v.brandName })) || []
  }
  // 获取店铺
  const getStoreList = async () => {
    const res: any = await getAllStoreInfo({ currentPage: 1, pageSize: -1 })
    storeAll.value =
      res?.data?.dtoList?.map((v: any) => ({ value: v.id, label: v.storeName })) || []
  }
  // 获取分类
  const getAllTree = async () => {
    const res: any = await categoryPageList({ status: '1' })
    categoryAll.value = res.data || []
  }
  // 获取属性
  const getProperPage = async () => {
    const res: any = await properPageList({ currentPage: 1, pageSize: -1, status: 1 })
    propertyAll.value = res?.data?.dtoList || []
  }
  // 获取公司主体
  const getCompanySubject = async () => {
    const res: any = await companyPageList({ currentPage: 1, pageSize: -1, status: 1 })
    companyAll.value = res?.data?.records || []
  }
  onActivated(() => {
    if (props.from !== 'spu') {
      getAllUserInfoAction()
      getBrandPageList()
      getAllTree()
      getProperPage()
      getCompanySubject()
      getStoreList()
    }
  })
  interface Emits {
    (e: 'update:visible', visible: boolean): void
    (e: 'submit', data: any): void
    (e: 'close', needRefresh: boolean): void
  }

  const emit = defineEmits<Emits>()

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })
  const addSPUVisible = ref(false)
  const initDataNew = ref({})
  const activeTab = ref('basic') // 默认值，会在初始化时根据权限更新
  const loading = ref(false)

  // 各个操作的loading状态
  const loadingStates = reactive({
    topFormSave: false, // 顶部表单保存
    save: false, // 统一保存
    submit: false // 提交
  })

  const topFormRef = ref<FormInstance>()
  const basicInfoRef = ref()
  const productsRef = ref()
  const financialInfoRef = ref()
  const complianceRef = ref()
  const operationLogRef = ref()
  // 处理添加SPU提交（复制弹窗的提交）
  const handleAddSPUSubmit = async (data: any) => {
    console.log('添加SPU', data)
    await addSpu(data)
    ElMessage.success('操作成功')
    addSPUVisible.value = false
    // 通知父组件刷新列表
    emit('close', true)
  }
  // 处理弹窗关闭事件（复制弹窗的关闭）
  const handleDialogClose = (needRefresh: boolean) => {
    // 如果编辑保存过，需要刷新列表数据
    if (needRefresh) {
      emit('close', true)
    }
  }
  // 标记是否有保存操作
  const hasSaved = ref(false)
  // 弹窗标题
  const dialogTitle = ref<string>('')

  // 顶部表单编辑状态（用于切换编辑/只读）
  const topFormEditState = ref(false) // 默认只读状态

  // 保存顶部表单的初始数据（用于取消时恢复）
  const initialTopFormData = ref<{
    spu: string
    spuName: string
    spuEnName: string
    image?: any[]
  } | null>(null)

  // 计算是否显示顶部表单编辑模式
  const showTopFormEditMode = computed(() => {
    const handleType = props.initData?.handleType
    // 如果 handleType 为 add、copy 或不存在，始终显示编辑模式
    if (handleType === 'add' || handleType === 'copy' || !handleType) {
      return true
    }
    // detail 或 edit 模式下，根据topFormEditState决定显示编辑还是只读
    if (handleType === 'detail' || handleType === 'edit') {
      return topFormEditState.value
    }
    // 其他情况默认编辑模式
    return true
  })

  // 计算是否显示顶部表单编辑按钮
  const showTopFormEditButtons = computed(() => {
    const handleType = props.initData?.handleType
    // 如果 handleType 为 add、copy 或不存在，不显示编辑按钮
    if (handleType === 'add' || handleType === 'copy' || !handleType) {
      return false
    }
    // 其余情况均展示
    return true
  })

  // 获取第一个有权限的 tab（按照 ElTabPane 的顺序）
  const getFirstAvailableTab = (): string => {
    // 按照 ElTabPane 的顺序定义 tab 列表和对应的权限
    const tabList = [
      { name: 'basic', auth: 'product:spu:basic' },
      { name: 'products', auth: 'product:spu:skus' },
      { name: 'financial', auth: 'product:spu:finance' },
      { name: 'compliance', auth: 'product:spu:certification' }
    ]

    // 遍历找到第一个有权限的 tab
    for (const tab of tabList) {
      if (hasAuth(tab.auth)) {
        return tab.name
      }
    }

    // 如果都没有权限，默认返回 'basic'
    return 'basic'
  }

  // 初始化默认 tab 和编辑状态
  const initDefaultTab = () => {
    const handleType = props.initData?.handleType
    const editType = props.initData?.editType

    // 初始化顶部表单编辑状态
    if (handleType === 'add' || handleType === 'copy' || !handleType) {
      // add 或 copy 模式下，顶部表单为编辑状态，不显示按钮
      topFormEditState.value = true
    } else if (handleType === 'edit' && editType === 'editCommon') {
      // edit 模式下且 editType 为 editCommon 时，顶部表单默认为编辑状态
      topFormEditState.value = true
      // 保存顶部表单初始数据（使用深拷贝）
      initialTopFormData.value = {
        spu: formData.spu || '',
        spuName: formData.spuName || '',
        spuEnName: formData.spuEnName || '',
        image: formData.image ? JSON.parse(JSON.stringify(formData.image)) : []
      }
    } else {
      // edit 或 detail 模式下，顶部表单默认为只读状态
      topFormEditState.value = false
      // 非编辑态清除顶部表单校验，不展示 SPU/中文款名/英文款名 错误信息
      nextTick(() => {
        topFormRef.value?.clearValidate()
      })
      // 保存顶部表单初始数据（使用深拷贝）
      // 注意：如果数据还未加载完成，这里保存的可能是空值
      // 真正的初始化会在 getBasicData 完成后进行
      initialTopFormData.value = {
        spu: formData.spu || '',
        spuName: formData.spuName || '',
        spuEnName: formData.spuEnName || '',
        image: formData.image ? JSON.parse(JSON.stringify(formData.image)) : []
      }
    }

    // 如果是编辑模式，根据 editType 设置默认选中的 tab 和编辑状态
    if (handleType === 'edit') {
      // 先重置所有模块为只读状态
      basicInfoEditState.value = false
      productsEditState.value = false
      financialEditState.value = false
      complianceEditState.value = false

      // 根据 editType 设置默认选中的 tab 和对应的编辑状态
      if (editType === 'editCommon') {
        // editCommon 模式下，只编辑顶部表单，其他模块保持只读
        // 设置 activeTab 为第一个有权限的 tab
        activeTab.value = getFirstAvailableTab()
      } else if (editType === 'editBasic') {
        activeTab.value = 'basic'
        basicInfoEditState.value = true
        // 保存初始数据
        initialBasicInfo.value = JSON.parse(JSON.stringify(formData.basicInfo || {}))
      } else if (editType === 'editProduct') {
        activeTab.value = 'products'
        productsEditState.value = true
        // 保存初始数据
        initialProducts.value = JSON.parse(JSON.stringify(formData.products || {}))
      } else if (editType === 'editFinance') {
        activeTab.value = 'financial'
        financialEditState.value = true
        // 保存初始数据
        initialFinancialInfo.value = JSON.parse(JSON.stringify(formData.financialInfo || {}))
      } else if (editType === 'editCert') {
        activeTab.value = 'compliance'
        complianceEditState.value = true
        // 保存初始数据
        initialCompliance.value = JSON.parse(JSON.stringify(formData.compliance || {}))
      }
    } else if (handleType === 'copy') {
      // copy 模式下，所有模块都为编辑状态（类似 add 模式）
      // 设置 activeTab 为第一个有权限的 tab
      activeTab.value = getFirstAvailableTab()
      basicInfoEditState.value = true
      productsEditState.value = true
      financialEditState.value = true
      complianceEditState.value = true
    } else if (handleType === 'detail') {
      // detail 模式下，所有模块都为只读状态
      // 设置 activeTab 为第一个有权限的 tab
      activeTab.value = getFirstAvailableTab()
      basicInfoEditState.value = false
      productsEditState.value = false
      financialEditState.value = false
      complianceEditState.value = false
    } else {
      // add 模式或其他情况，设置 activeTab 为第一个有权限的 tab
      activeTab.value = getFirstAvailableTab()
    }
  }

  // 判断是否为基础信息编辑模式
  const isBasicEditMode = computed(() => {
    return props.initData?.handleType === 'edit' && props.initData?.editType === 'editBasic'
  })

  // 基础信息编辑状态（用于切换编辑/只读）
  const basicInfoEditState = ref(false) // 默认只读状态

  // 保存基础信息的初始数据（用于取消时恢复）
  const initialBasicInfo = ref<any>(null)

  // 计算是否显示编辑模式
  const showBasicEditMode = computed(() => {
    const handleType = props.initData?.handleType
    // detail 或 edit 模式下，根据basicInfoEditState决定显示编辑还是只读
    if (handleType === 'detail' || handleType === 'edit') {
      return basicInfoEditState.value
    }
    // add 模式或其他情况始终显示编辑组件
    return true
  })

  // 判断是否为产品编辑模式
  const isProductsEditMode = computed(() => {
    return props.initData?.handleType === 'edit' && props.initData?.editType === 'editProduct'
  })

  // 产品编辑状态（用于切换编辑/只读）
  const productsEditState = ref(false) // 默认只读状态

  // 保存产品的初始数据（用于取消时恢复）
  const initialProducts = ref<any>(null)

  // 计算是否显示产品编辑模式
  const showProductsEditMode = computed(() => {
    const handleType = props.initData?.handleType
    // detail 或 edit 模式下，根据productsEditState决定显示编辑还是只读
    if (handleType === 'detail' || handleType === 'edit') {
      return productsEditState.value
    }
    // add 模式或其他情况始终显示编辑组件
    return true
  })

  // 判断是否为财务信息编辑模式
  const isFinancialEditMode = computed(() => {
    return props.initData?.handleType === 'edit' && props.initData?.editType === 'editFinance'
  })

  // 财务信息编辑状态（用于切换编辑/只读）
  const financialEditState = ref(false) // 默认只读状态

  // 保存财务信息的初始数据（用于取消时恢复）
  const initialFinancialInfo = ref<any>(null)

  // 计算是否显示财务信息编辑模式
  const showFinancialEditMode = computed(() => {
    const handleType = props.initData?.handleType
    // detail 或 edit 模式下，根据financialEditState决定显示编辑还是只读
    if (handleType === 'detail' || handleType === 'edit') {
      return financialEditState.value
    }
    // add 模式或其他情况始终显示编辑组件
    return true
  })

  // 判断是否为合规认证编辑模式
  const isComplianceEditMode = computed(() => {
    return props.initData?.handleType === 'edit' && props.initData?.editType === 'editCert'
  })

  // 合规认证编辑状态（用于切换编辑/只读）
  const complianceEditState = ref(false) // 默认只读状态

  // 保存合规认证的初始数据（用于取消时恢复）
  const initialCompliance = ref<any>(null)

  /** Tab 切换拦截（与 SKU 编辑弹窗一致） */
  const tabSwitchConfirmVisible = ref(false)
  const tabSwitchSaving = ref(false)
  const tabSwitchPending = ref<{
    from: string
    to: string
    resolve: (allow: boolean) => void
  } | null>(null)

  // 计算是否显示合规认证编辑模式
  const showComplianceEditMode = computed(() => {
    const handleType = props.initData?.handleType
    // detail 或 edit 模式下，根据complianceEditState决定显示编辑还是只读
    if (handleType === 'detail' || handleType === 'edit') {
      return complianceEditState.value
    }
    // add 模式或其他情况始终显示编辑组件
    return true
  })

  // 计算当前 tab 的编辑状态
  const currentEditState = computed(() => {
    if (activeTab.value === 'basic') return basicInfoEditState.value
    if (activeTab.value === 'products') return productsEditState.value
    if (activeTab.value === 'financial') return financialEditState.value
    if (activeTab.value === 'compliance') return complianceEditState.value
    return false
  })

  // 计算是否显示编辑按钮
  const showEditButtons = computed(() => {
    const handleType = props.initData?.handleType
    // 如果 handleType 为 add、copy 或不存在，不显示编辑按钮
    if (handleType === 'add' || handleType === 'copy' || !handleType) {
      return false
    }
    // 其余情况均展示
    return true
  })

  // 计算当前tab对应的权限码
  const currentTabPermission = computed(() => {
    switch (activeTab.value) {
      case 'basic':
        return 'product:spu:basic:edit'
      case 'products':
        return 'product:spu:skus:edit'
      case 'financial':
        return 'product:spu:finance:edit'
      case 'compliance':
        return 'product:spu:certification:edit'
      default:
        return ''
    }
  })

  // 计算是否显示handle-section（需要同时满足：显示编辑按钮 && 有权限）
  const canShowHandleSection = computed(() => {
    if (!showEditButtons.value) {
      return false
    }
    if (!currentTabPermission.value) {
      return false
    }
    return hasAuth(currentTabPermission.value)
  })

  // 计算所有通过权限检查的权限码
  const authCodes = computed(() => {
    const codes: string[] = []
    const permissionMap = [
      { code: 'product:spu:basic', name: 'basic' },
      { code: 'product:spu:skus', name: 'products' },
      { code: 'product:spu:finance', name: 'financial' },
      { code: 'product:spu:certification', name: 'compliance' }
    ]

    permissionMap.forEach(({ code }) => {
      if (hasAuth(code)) {
        codes.push(code)
      }
    })

    return codes
  })

  interface FormData {
    sku: string
    spu: string
    spuName: string
    materialCode: string
    spuEnName: string
    image?: any[]
    basicInfo: any
    products: any
    financialInfo: any
    compliance: any
  }

  const formData = reactive<FormData>({
    sku: '',
    spu: '',
    spuName: '',
    materialCode: '',
    spuEnName: '',
    image: [],
    basicInfo: {},
    products: {},
    financialInfo: {},
    compliance: {}
  })

  // 顶部表单校验规则（非编辑态不校验，避免展示 SPU/中文款名/英文款名 错误信息）
  const topFormRules = computed<FormRules>(() => {
    return {
      spu: [
        {
          required: true,
          message: '请输入SPU',
          trigger: ['blur', 'change']
        },
        {
          pattern: /^[a-zA-Z0-9_-]+$/,
          message: '仅可使用字母/数字/短杠/下划线',
          trigger: ['blur', 'change']
        },
        { max: 20, message: '中文款名不能超过20个字符', trigger: ['blur', 'change'] }
      ],
      spuName: [
        {
          required: true,
          message: '请输入中文款名',
          trigger: ['blur', 'change']
        },
        { max: 50, message: '中文款名不能超过50个字符', trigger: ['blur', 'change'] }
      ],
      spuEnName: [
        {
          required: true,
          message: '请输入英文款名',
          trigger: ['blur', 'change']
        },
        { max: 50, message: '英文款名不能超过50个字符', trigger: ['blur', 'change'] }
      ]
    }
  })

  // 处理图片上传
  // const handleImageChange = (file: any) => {
  //   const reader = new FileReader()
  //   reader.onload = (e) => {
  //     formData.image = e.target?.result as string
  //   }
  //   reader.readAsDataURL(file.raw)
  // }

  // 判断是否为尺寸类字段（包含 Length、Width、Height）
  const isDimensionField = (key: string): boolean => {
    return /Length|Width|Height/i.test(key)
  }

  // 处理对象中的 number 类型值，尺寸类字段保留2位小数，其他字段保留4位小数
  const formatNumberWithPrecision = (obj: any, parentKey?: string): any => {
    if (obj === null || obj === undefined) {
      return obj
    }
    if (typeof obj === 'number') {
      // 根据字段名判断是否为尺寸类字段
      const isDimension = parentKey ? isDimensionField(parentKey) : false
      const precision = isDimension ? 2 : 4
      return Number(obj.toFixed(precision))
    }
    if (Array.isArray(obj)) {
      return obj.map((item) => formatNumberWithPrecision(item, parentKey))
    }
    if (typeof obj === 'object') {
      const result: any = {}
      for (const key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
          result[key] = formatNumberWithPrecision(obj[key], key)
        }
      }
      return result
    }
    return obj
  }

  // 提交表单
  const handleSubmit = async () => {
    // 验证顶部表单
    if (!topFormRef.value) return
    if (loadingStates.submit) return // 防止重复提交

    try {
      loadingStates.submit = true
      await topFormRef.value.validate()

      // 验证各个tab页，按顺序验证以便定位到具体的错误tab
      // 验证基础信息
      if (basicInfoRef.value?.validate) {
        const basicValid = await basicInfoRef.value.validate()
        if (!basicValid) {
          activeTab.value = 'basic'
          return
        }
      }

      // 验证包含产品
      if (productsRef.value?.validate) {
        const productsValid = await productsRef.value.validate()
        console.log(productsValid, 'productsValidproductsValid')
        if (!productsValid) {
          activeTab.value = 'products'
          return
        }
      }

      // 验证财务信息
      if (financialInfoRef.value?.validate) {
        const financialValid = await financialInfoRef.value.validate()
        if (!financialValid) {
          activeTab.value = 'financial'
          return
        }
      }

      // 验证合规认证
      if (complianceRef.value?.validate) {
        const complianceValid = await complianceRef.value.validate()
        if (!complianceValid) {
          activeTab.value = 'compliance'
          return
        }
      }

      const handleType = props.initData?.handleType
      const isCopy = handleType === 'copy'

      // 处理产品列表数据
      const processedProducts =
        formData?.products?.existingProducts?.map((item: any) => {
          const skuAttributeRelationDtoList: any = []
          Object.entries(item).forEach(([key, value]) => {
            if (key.indexOf('attribute_') > -1) {
              const cur = {
                attributeId: key.split('_')[1],
                attributeValue: value
              }
              skuAttributeRelationDtoList.push(cur)
            }
          })
          const processedItem = {
            ...item,
            skuAttributeRelationDtoList,
            skuInfoFlag: item.id ? 0 : formData.products.skuInfoFlag
          }
          // 如果是复制操作，清除 id 字段
          // if (isCopy) {
          //   delete processedItem.id
          //   delete processedItem.productSpuId
          //   delete processedItem.productBasicId
          // }
          return processedItem
        }) || []

      // 处理 metric 和 imperial 对象中的 number 类型值，尺寸类字段保留2位小数，其他字段保留4位小数
      const formattedMetric = formatNumberWithPrecision(formData?.basicInfo?.specs?.metric)
      const formattedImperial = formatNumberWithPrecision(formData?.basicInfo?.specs?.imperial)

      // 构建基础信息
      const spuBasic: any = {
        ...formData.basicInfo,
        spu: formData.spu,
        spuName: formData.spuName,
        picUrl: formData?.image?.length ? JSON.stringify(formData.image) : '',
        spuEnName: formData.spuEnName,
        productSizeUnit: 'cm',
        productPackageSizeUnit: 'cm',
        ...formattedMetric,
        ...formattedImperial,
        ...(formData.basicInfo.weightUnits || {})
      }
      // 如果是复制操作，清除 id 相关字段
      if (isCopy) {
        delete spuBasic.id
        delete spuBasic.productSpuId
      }

      // 构建财务信息
      const spuFinanceInfo: any = { ...formData.financialInfo }
      // 如果是复制操作，清除 id 字段
      if (isCopy) {
        delete spuFinanceInfo.id
      }

      // 处理合规认证列表
      const spuCertificationList =
        formData?.compliance?.certifications?.map((cert: any) => {
          const row = isCopy
            ? (() => {
                const newCert = { ...cert }
                delete newCert.id
                return newCert
              })()
            : { ...cert }
          return {
            ...row,
            country: serializeComplianceCountryForApi(row.country)
          }
        }) || []

      // 收集所有tab页数据
      const submitData = {
        spuBasic,
        spuFinanceInfo,
        spuCertificationList,
        spuAttributeRelationList: formData?.products?.variantAttributes?.map((v: any) => ({
          attributeId: Number(v.attribute),
          attributeValues: v.attributeValues
        })),
        spuSkuRelationList: processedProducts
      }
      console.log(submitData, 'submitDatasubmitDatasubmitDatasubmitData')
      if (handleType === 'add' || handleType === 'copy' || !handleType) {
        emit('submit', submitData)
      }
    } catch (error: any) {
      console.error('提交失败:', error)
      ElMessage.warning('请检查表单输入')
    } finally {
      loadingStates.submit = false
    }
  }

  // 处理复制按钮点击
  // const handleCopy = () => {
  //   // 检查是否有编辑状态，如果有则复制当前编辑的内容
  //   const hasEditState =
  //     topFormEditState.value ||
  //     basicInfoEditState.value ||
  //     productsEditState.value ||
  //     financialEditState.value ||
  //     complianceEditState.value

  //   // 如果处于编辑状态，使用当前 formData 的内容；否则使用原始数据
  //   if (hasEditState && props.initData?.id) {
  //     // 构建包含当前编辑内容的复制数据
  //     // 深拷贝当前 formData，避免引用问题
  //     const currentFormData = {
  //       spu: formData.spu,
  //       spuName: formData.spuName,
  //       spuEnName: formData.spuEnName,
  //       image: formData.image ? JSON.parse(JSON.stringify(formData.image)) : [],
  //       basicInfo: formData.basicInfo ? JSON.parse(JSON.stringify(formData.basicInfo)) : {},
  //       products: formData.products ? JSON.parse(JSON.stringify(formData.products)) : {},
  //       financialInfo: formData.financialInfo
  //         ? JSON.parse(JSON.stringify(formData.financialInfo))
  //         : {},
  //       compliance: formData.compliance ? JSON.parse(JSON.stringify(formData.compliance)) : {}
  //     }

  //     // 设置复制弹窗的数据，包含当前编辑的内容
  //     initDataNew.value = {
  //       ...props.initData,
  //       handleType: 'copy',
  //       dialogTitle: '复制',
  //       // 传递当前编辑的内容，复制弹窗会使用这些数据
  //       currentFormData: currentFormData
  //     }
  //   } else {
  //     // 没有编辑状态，使用原始数据
  //     initDataNew.value = {
  //       ...props.initData,
  //       handleType: 'copy',
  //       dialogTitle: '复制'
  //     }
  //   }
  //   // 打开复制弹窗（覆盖在当前弹窗上面）
  //   addSPUVisible.value = true
  // }

  // 关闭弹窗
  const handleClose = () => {
    // 通知父组件是否需要刷新列表
    emit('close', hasSaved.value)
    dialogVisible.value = false
    // 重置表单
    nextTick(() => {
      // 重置表单数据
      Object.assign(formData, {
        sku: '',
        spu: '',
        spuName: '',
        materialCode: '',
        spuEnName: '',
        image: [],
        basicInfo: {},
        products: {},
        financialInfo: {},
        compliance: {},
        skuInfoFlag: null
      })
      // 重置所有编辑状态
      topFormEditState.value = false
      basicInfoEditState.value = false
      productsEditState.value = false
      financialEditState.value = false
      complianceEditState.value = false
      // 重置所有初始数据
      initialTopFormData.value = null
      initialBasicInfo.value = null
      initialProducts.value = null
      initialFinancialInfo.value = null
      initialCompliance.value = null
      // 重置tab
      activeTab.value = 'basic'
      // 重置保存标记
      hasSaved.value = false
      // 重置标题
      dialogTitle.value = ''
      // 清除所有表单验证
      topFormRef.value?.clearValidate()
      basicInfoRef.value?.clearValidate?.()
      productsRef.value?.clearValidate?.()
      financialInfoRef.value?.clearValidate?.()
      complianceRef.value?.clearValidate?.()
    })
  }

  // 顶部表单编辑方法
  const handleTopFormEdit = () => {
    const handleType = props.initData?.handleType
    if (handleType === 'edit' || handleType === 'detail') {
      // 每次编辑时都保存当前数据为初始数据（使用深拷贝）
      // 这样可以确保即使之前没有正确初始化，也能保存当前状态
      initialTopFormData.value = {
        spu: formData.spu || '',
        spuName: formData.spuName || '',
        spuEnName: formData.spuEnName || '',
        image: formData.image ? JSON.parse(JSON.stringify(formData.image)) : []
      }
      topFormEditState.value = true
    }
  }

  // 顶部表单取消方法
  const handleTopFormCancel = () => {
    const handleType = props.initData?.handleType
    if (handleType === 'edit' || handleType === 'detail') {
      if (initialTopFormData.value !== null) {
        // 使用深拷贝恢复数据，避免引用问题
        formData.spu = initialTopFormData.value.spu || ''
        formData.spuName = initialTopFormData.value.spuName || ''
        formData.spuEnName = initialTopFormData.value.spuEnName || ''
        formData.image = initialTopFormData.value.image
          ? JSON.parse(JSON.stringify(initialTopFormData.value.image))
          : []
      }
      // 如果 initialTopFormData 为 null，保持当前数据不变，不清空
      topFormRef.value?.clearValidate()
      topFormEditState.value = false
    }
  }

  // 顶部表单保存方法
  const handleTopFormSave = async () => {
    const handleType = props.initData?.handleType
    if (handleType === 'edit' || handleType === 'detail') {
      // 验证顶部表单
      if (!topFormRef.value) return
      if (loadingStates.topFormSave) return // 防止重复点击

      try {
        loadingStates.topFormSave = true
        await topFormRef.value.validate()

        const formattedMetric = formatNumberWithPrecision(formData?.basicInfo?.specs?.metric)
        const formattedImperial = formatNumberWithPrecision(formData?.basicInfo?.specs?.imperial)
        // 保存当前数据为初始数据
        initialTopFormData.value = {
          ...formData.basicInfo,
          spu: formData.spu,
          picUrl: formData?.image?.length ? JSON.stringify(formData.image) : '',
          productSpuId: props.initData.id,
          spuEnName: formData.spuEnName,
          spuName: formData.spuName,
          productSizeUnit: 'cm',
          productPackageSizeUnit: 'cm',
          ...formattedMetric,
          ...formattedImperial,
          ...(formData.basicInfo.weightUnits || {})
        }
        await updateProductSpuBasic(initialTopFormData.value)
        initialBasicInfo.value = JSON.parse(JSON.stringify(formData.basicInfo || {}))
        ElMessage.success('保存成功')
        topFormEditState.value = false
        hasSaved.value = true
        // 刷新操作日志
        operationLogRef.value?.reget?.()
      } catch (error: any) {
        console.error('保存失败:', error)
        // if (error.errors) {
        //   // 表单验证失败，不显示错误消息
        // } else {
        //   ElMessage.error('保存失败')
        // }
      } finally {
        loadingStates.topFormSave = false
      }
    }
  }

  // 统一的编辑方法
  const handleEdit = () => {
    const tab = activeTab.value
    const handleType = props.initData?.handleType

    // 在 edit 或 detail 模式下，所有模块都可以编辑
    if (handleType === 'edit' || handleType === 'detail') {
      if (tab === 'basic') {
        // 每次编辑时都保存当前数据为初始数据（使用深拷贝）
        // 这样可以确保即使之前没有正确初始化，也能保存当前状态
        initialBasicInfo.value = JSON.parse(JSON.stringify(formData.basicInfo || {}))
        basicInfoEditState.value = true
      } else if (tab === 'products') {
        initialProducts.value = JSON.parse(JSON.stringify(formData.products || {}))
        productsEditState.value = true
      } else if (tab === 'financial') {
        initialFinancialInfo.value = JSON.parse(JSON.stringify(formData.financialInfo || {}))
        financialEditState.value = true
      } else if (tab === 'compliance') {
        initialCompliance.value = JSON.parse(JSON.stringify(formData.compliance || {}))
        complianceEditState.value = true
      }
    }
  }

  /** 按 Tab 放弃编辑（Tab 切换「确定」或取消编辑） */
  const cancelTabEdit = (tab: string) => {
    const handleType = props.initData?.handleType
    if (handleType !== 'edit' && handleType !== 'detail') return
    if (tab === 'basic') {
      if (basicInfoEditState.value) {
        if (initialBasicInfo.value !== null) {
          formData.basicInfo = JSON.parse(JSON.stringify(initialBasicInfo.value))
        }
        basicInfoRef.value?.clearValidate?.()
        basicInfoEditState.value = false
      }
      if (topFormEditState.value) {
        handleTopFormCancel()
      }
    } else if (tab === 'products') {
      if (initialProducts.value !== null) {
        formData.products = JSON.parse(JSON.stringify(initialProducts.value))
      }
      productsRef.value?.clearValidate?.()
      productsEditState.value = false
    } else if (tab === 'financial') {
      if (initialFinancialInfo.value !== null) {
        formData.financialInfo = JSON.parse(JSON.stringify(initialFinancialInfo.value))
      }
      financialInfoRef.value?.clearValidate?.()
      financialEditState.value = false
    } else if (tab === 'compliance') {
      if (initialCompliance.value !== null) {
        formData.compliance = JSON.parse(JSON.stringify(initialCompliance.value))
      }
      complianceRef.value?.clearValidate?.()
      complianceEditState.value = false
    }
  }

  const handleCancel = () => {
    cancelTabEdit(activeTab.value)
  }

  /** 保存当前 Tab；tabOverride 仅传 Tab 名字符串（如 Tab 切换弹窗）。勿把点击事件误当作 tabOverride。 */
  const handleSave = async (tabOverride?: string): Promise<boolean> => {
    const tab =
      typeof tabOverride === 'string' && tabOverride.length > 0 ? tabOverride : activeTab.value
    const handleType = props.initData?.handleType
    if (loadingStates.save) return false
    if (handleType !== 'edit' && handleType !== 'detail') return false
    try {
      loadingStates.save = true
      if (tab === 'basic') {
        const formattedMetric = formatNumberWithPrecision(formData?.basicInfo?.specs?.metric)
        const formattedImperial = formatNumberWithPrecision(formData?.basicInfo?.specs?.imperial)
        if (basicInfoRef.value?.validate) {
          const basicValid = await basicInfoRef.value.validate()
          if (!basicValid) return false
        }
        await updateProductSpuBasic({
          ...formData.basicInfo,
          spu: formData.spu,
          picUrl: formData?.image?.length ? JSON.stringify(formData.image) : '',
          productSpuId: props.initData.id,
          spuEnName: formData.spuEnName,
          spuName: formData.spuName,
          productSizeUnit: 'cm',
          productPackageSizeUnit: 'cm',
          ...formattedMetric,
          ...formattedImperial,
          ...(formData.basicInfo.weightUnits || {})
        })
        initialBasicInfo.value = JSON.parse(JSON.stringify(formData.basicInfo || {}))
        ElMessage.success('保存成功')
        basicInfoEditState.value = false
        hasSaved.value = true
        operationLogRef.value?.reget?.()
        return true
      }
      if (tab === 'products') {
        if (productsRef.value?.validate) {
          const productsValid = await productsRef.value.validate()
          if (!productsValid) return false
        }
        formData?.products?.existingProducts?.forEach((item: any) => {
          const skuAttributeRelationDtoList: any = []
          Object.entries(item).forEach(([key, value]) => {
            if (key.indexOf('attribute_') > -1) {
              const cur = {
                attributeId: key.split('_')[1],
                attributeValue: value
              }
              skuAttributeRelationDtoList.push(cur)
            }
          })
          item.skuAttributeRelationDtoList = skuAttributeRelationDtoList
          item.skuInfoFlag = item.id ? 0 : formData.products.skuInfoFlag
        })
        await updateContains({
          spuAttributeRelationList: formData?.products?.variantAttributes?.map((v: any) => ({
            ...v,
            attributeId: Number(v.attribute),
            attributeValues: v.attributeValues
          })),
          spuSkuRelationList: formData?.products?.existingProducts,
          productSpuId: props?.initData.id,
          spu: formData.spu
        })
        initialProducts.value = JSON.parse(JSON.stringify(formData.products || {}))
        ElMessage.success('保存成功')
        productsEditState.value = false
        hasSaved.value = true
        operationLogRef.value?.reget?.()
        return true
      }
      if (tab === 'financial') {
        if (financialInfoRef.value?.validate) {
          const financialValid = await financialInfoRef.value.validate()
          if (!financialValid) return false
        }
        const postData = {
          productFinanceInfoDto: formData.financialInfo,
          productSpuId: props.initData.id,
          spu: formData.spu
        }
        await updateFinanceInfo(postData)
        initialFinancialInfo.value = JSON.parse(JSON.stringify(formData.financialInfo || {}))
        displayData.value = JSON.parse(JSON.stringify(formData.financialInfo || {}))
        ElMessage.success('保存成功')
        financialEditState.value = false
        hasSaved.value = true
        operationLogRef.value?.reget?.()
        return true
      }
      if (tab === 'compliance') {
        if (complianceRef.value?.validate) {
          const complianceValid = await complianceRef.value.validate()
          if (!complianceValid) return false
        }

        const initialCertifications = initialCompliance.value?.certifications || []
        const currentCertifications = formData.compliance?.certifications || []

        const { addList, editList, deleteList } = compareDataChanges(
          initialCertifications,
          currentCertifications
        )

        const mapCertCountryForApi = (row: any) => ({
          ...row,
          country: serializeComplianceCountryForApi(row.country)
        })

        const postData = {
          productSpuId: props.initData.id,
          addCertificationDtoList: addList.map(mapCertCountryForApi),
          editCertificationDtoList: editList.map(mapCertCountryForApi),
          deleteCertificationDtoList: deleteList
        }

        await updateCertificationList(postData)
        initialCompliance.value = JSON.parse(JSON.stringify(formData.compliance || {}))
        ElMessage.success('保存成功')
        complianceEditState.value = false
        hasSaved.value = true
        operationLogRef.value?.reget?.()
        return true
      }
      return false
    } catch (error: any) {
      console.error('保存失败:', error)
      ElMessage.error('保存失败')
      return false
    } finally {
      loadingStates.save = false
    }
  }

  const isTopFormSnapshotDirty = (): boolean => {
    if (!topFormEditState.value || !initialTopFormData.value) return false
    const i = initialTopFormData.value
    const imgCur = JSON.stringify(formData.image || [])
    const imgInit = JSON.stringify(i.image || [])
    return (
      (formData.spu || '') !== (i.spu || '') ||
      (formData.spuName || '') !== (i.spuName || '') ||
      (formData.spuEnName || '') !== (i.spuEnName || '') ||
      imgCur !== imgInit
    )
  }

  const isTabInEditModeForLeaveGuard = (tabName: string): boolean => {
    if (tabName === 'basic') {
      return basicInfoEditState.value || topFormEditState.value
    }
    switch (tabName) {
      case 'products':
        return productsEditState.value
      case 'financial':
        return financialEditState.value
      case 'compliance':
        return complianceEditState.value
      default:
        return false
    }
  }

  const isTabDirtyForLeaveGuard = (tabName: string): boolean => {
    if (tabName === 'basic') {
      const basicDirty =
        !!initialBasicInfo.value &&
        basicInfoEditState.value &&
        JSON.stringify(formData.basicInfo || {}) !== JSON.stringify(initialBasicInfo.value)
      return basicDirty || isTopFormSnapshotDirty()
    }
    if (tabName === 'products') {
      return (
        !!initialProducts.value &&
        productsEditState.value &&
        JSON.stringify(formData.products || {}) !== JSON.stringify(initialProducts.value)
      )
    }
    if (tabName === 'financial') {
      return (
        !!initialFinancialInfo.value &&
        financialEditState.value &&
        JSON.stringify(formData.financialInfo || {}) !== JSON.stringify(initialFinancialInfo.value)
      )
    }
    if (tabName === 'compliance') {
      return (
        !!initialCompliance.value &&
        complianceEditState.value &&
        JSON.stringify(formData.compliance || {}) !== JSON.stringify(initialCompliance.value)
      )
    }
    return false
  }

  const shouldGuardSpuTabLeave = (fromTab: string): boolean => {
    if (props.from !== 'spu') return false
    if (!props.initData?.id) return false
    const ht = props.initData?.handleType
    if (ht !== 'detail' && ht !== 'edit') return false
    if (fromTab === 'operation-log') return false
    if (!isTabInEditModeForLeaveGuard(fromTab)) return false
    if (!isTabDirtyForLeaveGuard(fromTab)) return false
    return true
  }

  const finishTabSwitchPrompt = (allow: boolean) => {
    const p = tabSwitchPending.value
    tabSwitchPending.value = null
    tabSwitchConfirmVisible.value = false
    p?.resolve(allow)
  }

  const onTabSwitchDialogCancel = () => {
    finishTabSwitchPrompt(false)
  }

  const onTabSwitchDiscard = () => {
    const from = tabSwitchPending.value?.from
    if (from) {
      cancelTabEdit(from)
    }
    finishTabSwitchPrompt(true)
  }

  const onTabSwitchSaveAndLeave = async () => {
    const from = tabSwitchPending.value?.from
    if (!from) return
    tabSwitchSaving.value = true
    try {
      const ok = await handleSave(from)
      if (ok) {
        finishTabSwitchPrompt(true)
      }
    } finally {
      tabSwitchSaving.value = false
    }
  }

  const onTabSwitchDialogClosed = () => {
    if (tabSwitchPending.value) {
      const p = tabSwitchPending.value
      tabSwitchPending.value = null
      p.resolve(false)
    }
  }

  const handleTabsBeforeLeave = (newName: string | number, oldName: string | number) => {
    const from = String(oldName)
    const _to = String(newName)
    if (!shouldGuardSpuTabLeave(from)) return true
    return new Promise<boolean>((resolve) => {
      tabSwitchPending.value = { from, to: _to, resolve }
      tabSwitchConfirmVisible.value = true
    })
  }
  // 获取基础信息详情
  const getBasicData = async (id: string) => {
    const res: any = await getBasic({ id })
    const data = res.data || {}
    const handleType = props.initData?.handleType

    // 填充顶部表单数据
    if (data.spu) formData.spu = data.spu
    if (data.spuName) formData.spuName = data.spuName
    if (data.spuEnName) formData.spuEnName = data.spuEnName
    if (data.picUrl) {
      // 将图片URL转换为数组格式
      formData.image = data.picUrl ? JSON.parse(data.picUrl) : []
    }

    // 如果是复制模式，清空SPU、中文款名、英文款名
    if (handleType === 'copy') {
      formData.spu = ''
      formData.spuName = ''
      formData.spuEnName = ''
    }

    // 数据加载完成后，初始化顶部表单的初始数据
    if (handleType === 'edit' || handleType === 'detail') {
      initialTopFormData.value = {
        spu: formData.spu || '',
        spuName: formData.spuName || '',
        spuEnName: formData.spuEnName || '',
        image: formData.image ? JSON.parse(JSON.stringify(formData.image)) : []
      }
    }

    // 填充基础信息
    if (data.spuBasic || data) {
      console.log(JSON.parse(data.attachs), 'JSON.parse(data.attachs)')
      const basicData = data
      formData.basicInfo = {
        category: basicData.categoryId || basicData.category || '',
        categoryId: basicData.categoryId || '',
        categoryName: basicData.categoryName || '',
        brandId: basicData.brandId || '',
        brandName: basicData.brandName || '',
        unit: basicData.unit ?? basicData.unitId ?? '',
        id: basicData.id || '',
        productStatus:
          typeof basicData.productStatus === 'number' ? String(basicData.productStatus) : '',
        productDeveloperUserList: basicData.productDeveloperUsers
          ? JSON.parse(basicData.productDeveloperUsers)
          : [],
        productOwnerUserList: basicData.productOwnerUsers
          ? JSON.parse(basicData.productOwnerUsers)
          : [],
        accountNames: basicData.accountNames,
        accountIdList: basicData.accountIds ? JSON.parse(basicData.accountIds) : [],
        productRemark:
          basicData.productRemark != null && basicData.productRemark !== undefined
            ? String(basicData.productRemark).slice(0, 100)
            : '',
        attachList: basicData.attachs ? JSON.parse(basicData.attachs) : [],
        weightUnits: {
          productNetWeightUnit: basicData.productNetWeightUnit || 'g',
          productGrossWeightUnit: basicData.productGrossWeightUnit || 'g',
          boxNetWeightUnit: basicData.boxNetWeightUnit || 'g',
          boxGrossWeightUnit: basicData.boxGrossWeightUnit || 'g'
        },
        specs: {
          metric: {
            productNetWeight: basicData.productNetWeight || null,
            productGrossWeight: basicData.productGrossWeight || null,
            productLength: basicData.productLength || null,
            productWidth: basicData.productWidth || null,
            productHeight: basicData.productHeight || null,
            productPackageLength: basicData.productPackageLength || null,
            productPackageWidth: basicData.productPackageWidth || null,
            productPackageHeight: basicData.productPackageHeight || null,
            boxLength: basicData.boxLength || null,
            boxWidth: basicData.boxWidth || null,
            boxHeight: basicData.boxHeight || null,
            boxNetWeight: basicData.boxNetWeight || null,
            boxGrossWeight: basicData.boxGrossWeight || null,
            boxNum: basicData.boxNum || null
          },
          imperial: {
            productNetWeightLb: basicData.productNetWeightLb || null,
            productGrossWeightLb: basicData.productGrossWeightLb || null,
            productLengthInch: basicData.productLengthInch || null,
            productWidthInch: basicData.productWidthInch || null,
            productHeightInch: basicData.productHeightInch || null,
            boxNetWeightLb: basicData.boxNetWeightLb || null,
            boxGrossWeightLb: basicData.boxGrossWeightLb || null,
            boxNum: basicData.boxNum || null,
            productPackageLengthInch: basicData.productPackageLengthInch || null,
            productPackageWidthInch: basicData.productPackageWidthInch || null,
            productPackageHeightInch: basicData.productPackageHeightInch || null,
            boxLengthInch: basicData.boxLengthInch || null,
            boxWidthInch: basicData.boxWidthInch || null,
            boxHeightInch: basicData.boxHeightInch || null
          }
        }
      }
    }

    // 数据加载完成后，初始化基础信息的初始数据
    if (handleType === 'edit' || handleType === 'detail') {
      initialBasicInfo.value = JSON.parse(JSON.stringify(formData.basicInfo || {}))
    }
  }
  // 获取产品信息详情
  const getProductData = async (id: string) => {
    try {
      const res: any = await getProducts({ id })
      const data = res.data || {}

      // 处理变体属性：将 spuAttributeRelationVos 转换为 variantAttributes 格式
      const variantAttributes = (data.spuAttributeRelationVos || []).map((item: any) => {
        // 解析 attributeValues 字符串（如 '[m, s]'）为数组
        let attributeValues: string[] = []
        if (item.attributeValues) {
          try {
            // 尝试解析 JSON 数组格式
            if (typeof item.attributeValues === 'string') {
              attributeValues = JSON.parse(item.attributeValues)
            } else if (Array.isArray(item.attributeValues)) {
              attributeValues = item.attributeValues
            }
          } catch {
            // 如果解析失败，尝试手动解析字符串格式
            const str = item.attributeValues.trim()
            if (str.startsWith('[') && str.endsWith(']')) {
              const content = str.slice(1, -1)
              attributeValues = content
                .split(',')
                .map((v: string) => v.trim().replace(/^['"]|['"]$/g, ''))
                .filter((v: string) => v)
            }
          }
        }
        console.log(attributeValues)
        console.log(
          attributeValues?.map((v: any) => ({ ...v, value: String(v.value) })),
          'attributeValues?.map((v: any) => ({ ...v, value: String(v.value) }))'
        )
        return {
          ...item,
          attribute: item.attributeId,
          // attributeValues
          attributeValues: attributeValues?.map((v: any) => String(v))
        }
      })
      // const isCopy = props.initData?.handleType === 'copy'
      // 处理SKU列表：将 productBasicVos 转换为 existingProducts 格式
      const existingProducts = (data.productBasicVos || []).map((skuItem: any) => {
        const product: any = {
          ...skuItem,
          tempId: getUuid(),
          isFromDialog: true,
          productId: skuItem.id
          // isFromDialog: isCopy ? true : false
        }

        // 处理属性关系，将 skuAttributeRelations 转换为动态字段 attribute_${attributeId}
        if (skuItem.skuAttributeRelations && Array.isArray(skuItem.skuAttributeRelations)) {
          skuItem.skuAttributeRelations.forEach((attrRel: any) => {
            if (attrRel.attributeId) {
              product[`attribute_${attrRel.attributeId}`] = attrRel.attributeValue || ''
            }
          })
        }

        return product
      })

      // 填充包含产品数据
      formData.products = {
        variantAttributes: variantAttributes,
        existingProducts: existingProducts,
        skuInfoFlag: data.skuInfoFlag !== undefined ? data.skuInfoFlag : 0
      }

      // 如果是复制模式，清空existingProducts
      const handleType = props.initData?.handleType
      if (handleType === 'copy') {
        formData.products.existingProducts = []
      }

      // 数据加载完成后，初始化产品信息的初始数据
      if (handleType === 'edit' || handleType === 'detail') {
        initialProducts.value = JSON.parse(JSON.stringify(formData.products || {}))
      }
    } catch (error) {
      console.error('获取产品信息失败:', error)
      // 如果获取失败，初始化为空结构
      formData.products = {
        variantAttributes: [],
        existingProducts: [],
        skuInfoFlag: 0
      }
    }
  }
  const displayData = ref({})
  // 获取财务信息详情
  const getFinanceData = async (id: string) => {
    try {
      const res: any = await getFinance({ id })
      const data = res.data || {}
      // 填充财务信息
      if (data) {
        const financeData = data
        formData.financialInfo = {
          purchaseOrganizationId: financeData.purchaseOrganizationId || '',
          purchaseOrganizationName: financeData.purchaseOrganizationName || '',
          customsOrganizationId: financeData.customsOrganizationId || '',
          customsOrganizationName: financeData.customsOrganizationName || '',
          saleOrganizationId: financeData.saleOrganizationId || '',
          saleOrganizationName: financeData.saleOrganizationName || '',
          financeUserIds: financeData.financeOwnerUsers
            ? JSON.parse(financeData.financeOwnerUsers)
            : [],
          financeUserIdNames: financeData.financeUserIdNames || '',
          id: financeData.id
        }
        displayData.value = formData.financialInfo
      }

      // 数据加载完成后，初始化财务信息的初始数据
      const handleType = props.initData?.handleType
      if (handleType === 'edit' || handleType === 'detail') {
        initialFinancialInfo.value = JSON.parse(JSON.stringify(formData.financialInfo || {}))
      }
      console.log(formData.financialInfo, 'formData.financialInfoformData.financialInfo')
    } catch (e) {
      console.log(e)
      console.log(formData.financialInfo, 'formData.financialInfoformData.financialInfo')
    }
  }
  // 获取合规认证信息详情
  const getCertificationData = async (id: string) => {
    const res: any = await getCertification({ id })
    const data = res.data || []

    // 填充合规认证
    if (data?.length) {
      formData.compliance = {
        certifications: data?.map((v: any) => ({
          ...v,
          attachment: v?.attachment?.length ? JSON.parse(v.attachment) : [],
          country: normalizeComplianceCountryToCodes(v.country)
        }))
      }
    } else {
      formData.compliance = {
        certifications: []
      }
    }

    // 数据加载完成后，初始化合规认证的初始数据
    const handleType = props.initData?.handleType
    if (handleType === 'edit' || handleType === 'detail') {
      initialCompliance.value = JSON.parse(JSON.stringify(formData.compliance || {}))
    }
  }

  // 处理initData数据，填充到formData
  const processInitData = async () => {
    if (!props.initData?.id) {
      return
    }

    // 如果是复制模式且有当前编辑的内容，直接使用编辑内容
    if (props.initData?.handleType === 'copy' && props.initData?.currentFormData) {
      const currentData = props.initData.currentFormData
      // 填充顶部表单数据
      if (currentData.spu) formData.spu = currentData.spu
      if (currentData.spuName) formData.spuName = currentData.spuName
      if (currentData.spuEnName) formData.spuEnName = currentData.spuEnName
      if (currentData.image) {
        formData.image = JSON.parse(JSON.stringify(currentData.image))
      }
      // 填充各个模块的数据
      if (currentData.basicInfo) {
        formData.basicInfo = JSON.parse(JSON.stringify(currentData.basicInfo))
      }
      if (currentData.products) {
        formData.products = JSON.parse(JSON.stringify(currentData.products))
      }
      if (currentData.financialInfo) {
        formData.financialInfo = JSON.parse(JSON.stringify(currentData.financialInfo))
      }
      if (currentData.compliance) {
        formData.compliance = JSON.parse(JSON.stringify(currentData.compliance))
      }
      // 复制模式下，清空SPU、中文款名、英文款名和existingProducts
      formData.spu = ''
      formData.spuName = ''
      formData.spuEnName = ''
      if (formData.products) {
        formData.products.existingProducts = []
      }
    } else {
      // 正常模式，从API加载数据
      loading.value = true
      try {
        await Promise.all([
          getBasicData(props.initData?.id),
          getProductData(props.initData?.id),
          getFinanceData(props.initData?.id),
          getCertificationData(props.initData?.id)
        ])
      } finally {
        loading.value = false
      }
    }
  }

  // 计算弹窗标题
  const computedDialogTitle = computed(() => {
    // 如果手动设置了标题（如点击复制），优先使用
    if (dialogTitle.value) {
      return dialogTitle.value
    }
    // 否则使用initData中的dialogTitle，最后默认"添加SPU"
    return props.initData?.dialogTitle || '添加SPU'
  })

  // 监听弹窗显示状态和initData变化
  watch(
    () => props.visible,
    (visible) => {
      if (!visible) {
        handleClose()
      } else {
        // 重置标题为初始值
        dialogTitle.value = ''
        // 编辑，复制，详情
        if (props.initData?.id) {
          processInitData()
        }
        // 初始化默认 tab 和编辑状态
        initDefaultTab()
      }
    },
    { immediate: true }
  )

  // 监听initData变化，重置编辑状态
  watch(
    () => [props.initData?.handleType, props.initData?.editType, props.initData?.id],
    () => {
      // 只在弹窗打开时处理数据
      if (props.visible && props.initData?.id) {
        processInitData()
      }
      // 初始化默认 tab 和编辑状态
      initDefaultTab()
    }
  )

  // 监听 activeTab 变化，切换 tab 时如果进入编辑模式且还没有初始数据，则保存初始数据
  watch(activeTab, () => {
    if (activeTab.value === 'basic' && isBasicEditMode.value && initialBasicInfo.value === null) {
      initialBasicInfo.value = JSON.parse(JSON.stringify(formData.basicInfo || {}))
    } else if (
      activeTab.value === 'products' &&
      isProductsEditMode.value &&
      initialProducts.value === null
    ) {
      initialProducts.value = JSON.parse(JSON.stringify(formData.products || {}))
    } else if (
      activeTab.value === 'financial' &&
      isFinancialEditMode.value &&
      initialFinancialInfo.value === null
    ) {
      initialFinancialInfo.value = JSON.parse(JSON.stringify(formData.financialInfo || {}))
    } else if (
      activeTab.value === 'compliance' &&
      isComplianceEditMode.value &&
      initialCompliance.value === null
    ) {
      initialCompliance.value = JSON.parse(JSON.stringify(formData.compliance || {}))
    }
  })
</script>

<style lang="scss" scoped>
  .add-spu-dialog {
    .add-spu-dialog-wrapper {
      box-sizing: border-box;
      width: 100%;
      min-width: 1600px;
      padding: 30px 24px;
      border: 1px solid #e4e7ed;
      border-radius: 2px;
    }

    .top-section {
      display: flex;
      gap: 20px;
      align-items: center;
      margin-bottom: 20px;

      :deep(.el-upload-list__item-actions),
      :deep(.el-upload-list__item) {
        width: 60px !important;
        height: 60px !important;
      }

      .image-upload {
        .upload-placeholder {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 70px;
          height: 70px;
          color: var(--el-text-color-placeholder);
          cursor: pointer;
          border: 2px dashed var(--el-border-color);
          border-radius: 4px;

          &:hover {
            color: var(--el-color-primary);
            border-color: var(--el-color-primary);
          }
        }

        .upload-preview {
          position: relative;
          width: 70px;
          height: 70px;
          overflow: hidden;
          cursor: pointer;
          border-radius: 4px;

          :deep(.el-image) {
            width: 100%;
            height: 100%;
          }

          .image-overlay {
            position: absolute;
            inset: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            background: rgb(0 0 0 / 50%);
            opacity: 0;
            transition: opacity 0.3s;
          }

          &:hover .image-overlay {
            opacity: 1;
          }
        }
      }

      .top-form {
        position: relative;
        flex: 1;

        .top-form-header {
          display: flex;
          gap: 16px;
          align-items: flex-start;

          .el-form {
            flex: 1;
          }

          .top-form-actions {
            position: absolute;
            top: -25px; // 从 el-dialog-body 顶部开始计算
            right: 5px; // 与 dialog-body 的 padding 保持一致
            z-index: 10;
            display: flex;
            gap: 12px;
          }
        }

        .readonly-text {
          display: inline-block;
          min-height: 28px;
          line-height: 28px;
          color: var(--el-text-color-regular);
          word-break: break-all;
        }

        .form-row {
          display: flex;
          gap: 20px;

          .form-col {
            display: flex;
            flex: 1;
            flex-direction: column;
            gap: 16px;

            &:last-child {
              max-width: 300px;
            }
          }
        }
      }
    }

    .spu-tabs {
      :deep(.el-tabs__content) {
        padding: 4px 0;
      }
    }

    .handle-section {
      position: relative;

      .edit-buttons-wrapper {
        position: absolute;
        top: 55px;
        right: 5px;
        display: flex;
        justify-content: flex-end;

        .header-actions {
          display: flex;
          gap: 12px;
        }
      }
    }

    .dialog-footer {
      display: flex;
      gap: 12px;
      justify-content: center;
    }

    .has-upload {
      :deep(.el-upload-list__item.is-ready) {
        width: 60px !important;
        height: 60px !important;
        margin: 0 !important;
      }

      :deep(.el-upload) {
        display: none !important;
      }
      // :deep(.el-upload-list__item-actions) {
      //   width: 60px !important;
      //   height: 60px !important;
      //   margin: 0 !important;
      // }
    }

    :deep(.el-upload) {
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .no-upload {
      :deep(.el-upload) {
        display: flex !important;
      }
      // :deep(.el-upload-list__item-actions) {
      //   width: 60px !important;
      //   height: 60px !important;
      //   margin: 0 !important;
      // }
    }
  }

  // 复制弹窗覆盖样式（确保覆盖在当前弹窗上面）
  .copy-dialog-overlay {
    :deep(.el-dialog__wrapper) {
      z-index: 3000 !important;
    }
  }
  // 下拉框样式 - 与MkSelect组件保持一致（保持原有样式）
  :deep(.mk-select) {
    height: 28px;
    line-height: 28px;

    .el-select__wrapper {
      height: 28px;
      line-height: 28px;
    }

    .el-input__wrapper {
      height: 28px !important;
      min-height: 28px !important;
      border: 1px solid #dcdfe6;
      box-shadow: none;
    }
  }
</style>
