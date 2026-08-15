<template>
  <ElDialog
    v-model="dialogVisible"
    :title="dialogTitle"
    width="90%"
    align-center
    :close-on-click-modal="false"
    @close="handleClose"
    class="add-sku-dialog"
    top="5vh"
    append-to-body
  >
    <div class="add-sku-dialog-wrapper">
      <!-- 顶部SKU信息 -->
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
            <ElForm ref="topFormRef" :model="formData" :rules="topFormRules" label-width="90px">
              <ElRow :gutter="20">
                <ElCol :span="6">
                  <ElFormItem label="SKU:" prop="sku" required>
                    <ElInput
                      v-if="showTopFormEditMode && (handleType === 'add' || handleType === 'copy')"
                      v-model="formData.sku"
                      placeholder="数字/字母/下划线/连字符/英文点"
                      title="仅支持数字、字母、下划线、连字符、英文点，禁止空格及其他特殊字符，最多50字"
                      maxlength="50"
                      show-word-limit
                      clearable
                      @update:model-value="
                        (val) => {
                          formData.sku = (val ?? '').replace(/[^a-zA-Z0-9_.-]/g, '').slice(0, 50)
                        }
                      "
                    />
                    <span v-else class="readonly-text">{{ formData.sku || '-' }}</span>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="中文品名:" prop="chineseProductName" required>
                    <ElInput
                      v-if="showTopFormEditMode"
                      v-model="formData.chineseProductName"
                      placeholder="汉字/数字/字母/下划线/连字符/英文点"
                      title="仅支持汉字、数字、字母、下划线、连字符、英文点，禁止空格及其他特殊字符，最多50字"
                      maxlength="50"
                      show-word-limit
                      clearable
                      @update:model-value="
                        (val) => {
                          formData.chineseProductName = (val ?? '')
                            .replace(/[^\u4e00-\u9fa5a-zA-Z0-9_.-]/g, '')
                            .slice(0, 50)
                        }
                      "
                    />
                    <span v-else class="readonly-text">{{
                      formData.chineseProductName || '-'
                    }}</span>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="英文品名:" prop="englishProductName" required>
                    <ElInput
                      v-if="showTopFormEditMode"
                      v-model="formData.englishProductName"
                      placeholder="数字/字母/下划线/连字符/英文点"
                      title="仅支持数字、字母、下划线、连字符、英文点，禁止空格及其他特殊字符，最多50字"
                      maxlength="50"
                      show-word-limit
                      clearable
                      @update:model-value="
                        (val) => {
                          formData.englishProductName = (val ?? '')
                            .replace(/[^a-zA-Z0-9_.-]/g, '')
                            .slice(0, 50)
                        }
                      "
                    />
                    <span v-else class="readonly-text">{{
                      formData.englishProductName || '-'
                    }}</span>
                  </ElFormItem>
                </ElCol>
              </ElRow>
              <ElRow :gutter="20">
                <ElCol :span="6">
                  <ElFormItem label="SPU:" prop="spuId" required>
                    <MkSelect
                      v-if="showTopFormEditMode"
                      v-model="formData.spuId"
                      :options="spuOptions"
                      :label-value="{ name: 'spu', value: 'value' }"
                      placeholder="请选择"
                      filterable
                      clearable
                      :always-filter-input="true"
                      :loading="spuLoading"
                      width="100%"
                    />
                    <span v-else class="readonly-text">{{ spuName || '-' }}</span>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="物料编码:" prop="materialCode" required>
                    <ElInput
                      v-if="showTopFormEditMode"
                      v-model="formData.materialCode"
                      placeholder="数字/字母/下划线/连字符/英文点"
                      title="仅支持数字、字母、下划线、连字符、英文点，禁止空格及其他特殊字符，最多20字"
                      maxlength="20"
                      show-word-limit
                      clearable
                      @update:model-value="
                        (val) => {
                          formData.materialCode = (val ?? '')
                            .replace(/[^a-zA-Z0-9_.-]/g, '')
                            .slice(0, 20)
                        }
                      "
                    />
                    <span v-else class="readonly-text">{{ formData.materialCode || '-' }}</span>
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
            <!-- 顶部表单编辑按钮 -->
            <!-- 方案 B：editCommon 时顶部仅显示 撤回/编辑，取消/暂存/提交 仅在基础信息 Tab 内 -->
            <div v-if="showTopFormEditButtons" class="top-form-actions">
              <template v-if="editType === 'editCommon' && props.from === 'sku'">
                <ElButton
                  v-if="approvalStatus.basic === 1"
                  type="warning"
                  @click="handleWithdraw('basic', 0)"
                  :loading="loadingStates.withdraw"
                  :disabled="loadingStates.withdraw"
                  >撤回</ElButton
                >
                <ElButton v-else @click="handleTopFormEdit">{{
                  getEditButtonText(approvalStatus.basic)
                }}</ElButton>
              </template>
              <template v-else>
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
                  <ElButton @click="handleTopFormEdit">{{
                    getEditButtonText(approvalStatus.basic)
                  }}</ElButton>
                </template>
              </template>
            </div>
          </div>
        </div>
      </div>

      <div class="handle-section">
        <!-- Tab导航 -->
        <ElTabs v-model="activeTab" class="sku-tabs" :before-leave="handleTabsBeforeLeave">
          <ElTabPane label="基础信息" name="basic" v-if="hasAuth('product:sku:basic')">
            <template #label>
              <span class="tab-label">
                基础信息
                <ElTag
                  v-if="getApprovalStatusInfo(approvalStatus.basic) && props.from === 'sku'"
                  :type="getApprovalStatusInfo(approvalStatus.basic)!.type"
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ getApprovalStatusInfo(approvalStatus.basic)!.text }}
                </ElTag>
              </span>
            </template>
            <div class="tab-content-wrapper">
              <!-- 未编辑：右上角显示 撤回/编辑，提交与编辑平行展示 -->
              <div
                v-auth="'product:sku:basic:edit'"
                v-if="
                  !showBasicEditMode &&
                  (handleType === 'detail' || handleType === 'edit') &&
                  props.from === 'sku'
                "
                class="tab-edit-button"
              >
                <ElButton
                  v-if="approvalStatus.basic === 1"
                  type="warning"
                  @click="handleWithdraw('basic', 0)"
                  :loading="loadingStates.withdraw"
                  :disabled="loadingStates.withdraw"
                >
                  撤回
                </ElButton>
                <template v-else-if="approvalStatus.basic !== 1">
                  <ElButton @click="handleTabEdit('basic')">
                    {{ getEditButtonText(approvalStatus.basic) }}
                  </ElButton>
                  <ElButton
                    v-if="!isApprovedStatus(approvalStatus.basic)"
                    type="primary"
                    v-btnReClick
                    @click="handleTabSave('basic', true)"
                    :loading="loadingStates.basicSave"
                    :disabled="loadingStates.basicSave"
                    >提交</ElButton
                  >
                </template>
              </div>
              <!-- 编辑中：同一位置（右上角）显示 取消/暂存/提交，不放下方 -->
              <div
                v-auth="'product:sku:basic:edit'"
                v-else-if="
                  showBasicEditMode &&
                  basicInfoEditState &&
                  (handleType === 'detail' || handleType === 'edit')
                "
                class="tab-edit-button"
              >
                <ElButton @click="handleTabCancel('basic')" :disabled="loadingStates.basicSave"
                  >取消</ElButton
                >
                <ElButton
                  v-btnReClick
                  @click="handleTabSave('basic', false)"
                  :loading="loadingStates.basicSave"
                  :disabled="loadingStates.basicSave"
                  >暂存</ElButton
                >
                <ElButton
                  type="primary"
                  v-btnReClick
                  @click="handleTabSave('basic', true)"
                  :loading="loadingStates.basicSave"
                  :disabled="loadingStates.basicSave"
                  >提交</ElButton
                >
              </div>
              <div v-if="showBasicEditMode" class="basic-info-edit-wrapper">
                <BasicInfo
                  ref="basicInfoRef"
                  v-model="formData.basicInfo"
                  :category-options="categoryOptions"
                  :brand-options="brandOptions"
                  :user-options="userOptions"
                />
              </div>
              <div v-else class="basic-info-detail-wrapper">
                <BasicInfoDetail :model-value="formData.basicInfo" />
              </div>
            </div>
          </ElTabPane>
          <ElTabPane label="采购信息" name="purchase" v-if="hasAuth('product:sku:purchase')">
            <template #label>
              <span class="tab-label">
                采购信息
                <ElTag
                  v-if="getApprovalStatusInfo(approvalStatus.purchase) && props.from === 'sku'"
                  :type="getApprovalStatusInfo(approvalStatus.purchase)!.type"
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ getApprovalStatusInfo(approvalStatus.purchase)!.text }}
                </ElTag>
              </span>
            </template>
            <div class="tab-content-wrapper">
              <!-- 未编辑：右上角显示 撤回/编辑，提交与编辑平行展示 -->
              <div
                v-auth="'product:sku:purchase:edit'"
                v-if="
                  !showPurchaseEditMode &&
                  (handleType === 'detail' || handleType === 'edit') &&
                  props.from === 'sku'
                "
                class="tab-edit-button"
              >
                <ElButton
                  v-if="approvalStatus.purchase === 1"
                  type="warning"
                  @click="handleWithdraw('purchase', 1)"
                  :loading="loadingStates.withdraw"
                  :disabled="loadingStates.withdraw"
                >
                  撤回
                </ElButton>
                <template v-else-if="approvalStatus.purchase !== 1">
                  <ElButton @click="handleTabEdit('purchase')">
                    {{ getEditButtonText(approvalStatus.purchase) }}
                  </ElButton>
                  <ElButton
                    v-if="!isApprovedStatus(approvalStatus.purchase)"
                    type="primary"
                    v-btnReClick
                    @click="handleTabSave('purchase', true)"
                    :loading="loadingStates.purchaseSave"
                    :disabled="loadingStates.purchaseSave"
                    >提交</ElButton
                  >
                </template>
              </div>
              <!-- 编辑中：同一位置（右上角）显示 取消/暂存/提交 -->
              <div
                v-auth="'product:sku:purchase:edit'"
                v-else-if="
                  showPurchaseEditMode &&
                  purchaseInfoEditState &&
                  (handleType === 'detail' || handleType === 'edit')
                "
                class="tab-edit-button"
              >
                <ElButton
                  @click="handleTabCancel('purchase')"
                  :disabled="loadingStates.purchaseSave"
                  >取消</ElButton
                >
                <ElButton
                  v-btnReClick
                  @click="handleTabSave('purchase', false)"
                  :loading="loadingStates.purchaseSave"
                  :disabled="loadingStates.purchaseSave"
                  >暂存</ElButton
                >
                <ElButton
                  type="primary"
                  v-btnReClick
                  @click="handleTabSave('purchase', true)"
                  :loading="loadingStates.purchaseSave"
                  :disabled="loadingStates.purchaseSave"
                  >提交</ElButton
                >
              </div>
              <div v-if="showPurchaseEditMode" class="purchase-info-edit-wrapper">
                <PurchaseInfo
                  ref="purchaseInfoRef"
                  v-model="formData.purchaseInfo"
                  :user-options="userOptions"
                />
              </div>
              <div v-else class="purchase-info-detail-wrapper">
                <PurchaseInfoDetail :model-value="formData.purchaseInfo" />
              </div>
            </div>
          </ElTabPane>
          <ElTabPane label="物流信息" name="logistics" v-if="hasAuth('product:sku:logistics')">
            <template #label>
              <span class="tab-label">
                物流信息
                <ElTag
                  v-if="getApprovalStatusInfo(approvalStatus.logistics) && props.from === 'sku'"
                  :type="getApprovalStatusInfo(approvalStatus.logistics)!.type"
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ getApprovalStatusInfo(approvalStatus.logistics)!.text }}
                </ElTag>
              </span>
            </template>
            <div class="tab-content-wrapper">
              <!-- 未编辑：右上角显示 撤回/编辑，提交与编辑平行展示 -->
              <div
                v-auth="'product:sku:logistics:edit'"
                v-if="
                  !showLogisticsEditMode &&
                  (handleType === 'detail' || handleType === 'edit') &&
                  props.from === 'sku'
                "
                class="tab-edit-button"
              >
                <ElButton
                  v-if="approvalStatus.logistics === 1"
                  type="warning"
                  @click="handleWithdraw('logistics', 2)"
                  :loading="loadingStates.withdraw"
                  :disabled="loadingStates.withdraw"
                >
                  撤回
                </ElButton>
                <template v-else-if="approvalStatus.logistics !== 1">
                  <ElButton @click="handleTabEdit('logistics')">
                    {{ getEditButtonText(approvalStatus.logistics) }}
                  </ElButton>
                  <ElButton
                    v-if="!isApprovedStatus(approvalStatus.logistics)"
                    type="primary"
                    v-btnReClick
                    @click="handleTabSave('logistics', true)"
                    :loading="loadingStates.logisticsSave"
                    :disabled="loadingStates.logisticsSave"
                    >提交</ElButton
                  >
                </template>
              </div>
              <!-- 编辑中：同一位置（右上角）显示 取消/暂存/提交 -->
              <div
                v-auth="'product:sku:logistics:edit'"
                v-else-if="
                  showLogisticsEditMode &&
                  logisticsInfoEditState &&
                  (handleType === 'detail' || handleType === 'edit')
                "
                class="tab-edit-button"
              >
                <ElButton
                  @click="handleTabCancel('logistics')"
                  :disabled="loadingStates.logisticsSave"
                  >取消</ElButton
                >
                <ElButton
                  v-btnReClick
                  @click="handleTabSave('logistics', false)"
                  :loading="loadingStates.logisticsSave"
                  :disabled="loadingStates.logisticsSave"
                  >暂存</ElButton
                >
                <ElButton
                  type="primary"
                  v-btnReClick
                  @click="handleTabSave('logistics', true)"
                  :loading="loadingStates.logisticsSave"
                  :disabled="loadingStates.logisticsSave"
                  >提交</ElButton
                >
              </div>
              <div v-if="showLogisticsEditMode" class="logistics-info-edit-wrapper">
                <LogisticsInfo
                  ref="logisticsInfoRef"
                  v-model="formData.logisticsInfo"
                  :user-options="userOptions"
                />
              </div>
              <div v-else class="logistics-info-detail-wrapper">
                <LogisticsInfoDetail :model-value="formData.logisticsInfo" />
              </div>
            </div>
          </ElTabPane>
          <ElTabPane label="财务信息" name="finance" v-if="hasAuth('product:sku:finance')">
            <template #label>
              <span class="tab-label">
                财务信息
                <ElTag
                  v-if="getApprovalStatusInfo(approvalStatus.finance) && props.from === 'sku'"
                  :type="getApprovalStatusInfo(approvalStatus.finance)!.type"
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ getApprovalStatusInfo(approvalStatus.finance)!.text }}
                </ElTag>
              </span>
            </template>
            <div class="tab-content-wrapper">
              <!-- 未编辑：右上角显示 撤回/编辑，提交与编辑平行展示 -->
              <div
                v-auth="'product:sku:finance:edit'"
                v-if="
                  !showFinanceEditMode &&
                  (handleType === 'detail' || handleType === 'edit') &&
                  props.from === 'sku'
                "
                class="tab-edit-button"
              >
                <ElButton
                  v-if="approvalStatus.finance === 1"
                  type="warning"
                  @click="handleWithdraw('finance', 3)"
                  :loading="loadingStates.withdraw"
                  :disabled="loadingStates.withdraw"
                >
                  撤回
                </ElButton>
                <template v-else-if="approvalStatus.finance !== 1">
                  <ElButton @click="handleTabEdit('finance')">
                    {{ getEditButtonText(approvalStatus.finance) }}
                  </ElButton>
                  <ElButton
                    v-if="!isApprovedStatus(approvalStatus.finance)"
                    type="primary"
                    v-btnReClick
                    @click="handleTabSave('finance', true)"
                    :loading="loadingStates.financeSave"
                    :disabled="loadingStates.financeSave"
                    >提交</ElButton
                  >
                </template>
              </div>
              <!-- 编辑中：同一位置（右上角）显示 取消/暂存/提交 -->
              <div
                v-auth="'product:sku:finance:edit'"
                v-else-if="
                  showFinanceEditMode &&
                  financeInfoEditState &&
                  (handleType === 'detail' || handleType === 'edit')
                "
                class="tab-edit-button"
              >
                <ElButton @click="handleTabCancel('finance')" :disabled="loadingStates.financeSave"
                  >取消</ElButton
                >
                <ElButton
                  v-btnReClick
                  @click="handleTabSave('finance', false)"
                  :loading="loadingStates.financeSave"
                  :disabled="loadingStates.financeSave"
                  >暂存</ElButton
                >
                <ElButton
                  type="primary"
                  v-btnReClick
                  @click="handleTabSave('finance', true)"
                  :loading="loadingStates.financeSave"
                  :disabled="loadingStates.financeSave"
                  >提交</ElButton
                >
              </div>
              <div v-if="showFinanceEditMode" class="finance-info-edit-wrapper">
                <FinanceInfo
                  ref="financeInfoRef"
                  v-model="formData.financeInfo"
                  :user-options="userOptions"
                />
              </div>
              <div v-else class="finance-info-detail-wrapper">
                <FinanceInfoDetail :model-value="formData.financeInfo" />
              </div>
            </div>
          </ElTabPane>
          <ElTabPane label="关联销售SKU" name="sales" v-if="hasAuth('product:sku:listingRelation')">
            <template #label>
              <span class="tab-label">
                关联销售SKU
                <ElTag
                  v-if="getApprovalStatusInfo(approvalStatus.sales) && props.from === 'sku'"
                  :type="getApprovalStatusInfo(approvalStatus.sales)!.type"
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ getApprovalStatusInfo(approvalStatus.sales)!.text }}
                </ElTag>
              </span>
            </template>
            <div class="tab-content-wrapper">
              <!-- 未编辑：右上角显示 撤回/编辑，提交与编辑平行展示 -->
              <div
                v-auth="'product:sku:listingRelation:edit'"
                v-if="
                  !salesSkuInfoEditState &&
                  (handleType === 'detail' || handleType === 'edit') &&
                  props.from === 'sku'
                "
                class="tab-edit-button"
              >
                <ElButton
                  v-if="approvalStatus.sales === 1"
                  type="warning"
                  @click="handleWithdraw('sales', 4)"
                  :loading="loadingStates.withdraw"
                  :disabled="loadingStates.withdraw"
                >
                  撤回
                </ElButton>
                <template v-else-if="approvalStatus.sales !== 1">
                  <ElButton @click="handleTabEdit('sales')">
                    {{ getEditButtonText(approvalStatus.sales) }}
                  </ElButton>
                  <ElButton
                    v-if="!isApprovedStatus(approvalStatus.sales)"
                    type="primary"
                    v-btnReClick
                    @click="handleTabSave('sales', true)"
                    :loading="loadingStates.salesSave"
                    :disabled="loadingStates.salesSave"
                    >提交</ElButton
                  >
                </template>
              </div>
              <!-- 编辑中：同一位置（右上角）显示 取消/暂存/提交 -->
              <div
                v-auth="'product:sku:listingRelation:edit'"
                v-else-if="
                  salesSkuInfoEditState && (handleType === 'detail' || handleType === 'edit')
                "
                class="tab-edit-button"
              >
                <ElButton @click="handleTabCancel('sales')" :disabled="loadingStates.salesSave"
                  >取消</ElButton
                >
                <ElButton
                  v-btnReClick
                  @click="handleTabSave('sales', false)"
                  :loading="loadingStates.salesSave"
                  :disabled="loadingStates.salesSave"
                  >暂存</ElButton
                >
                <ElButton
                  type="primary"
                  v-btnReClick
                  @click="handleTabSave('sales', true)"
                  :loading="loadingStates.salesSave"
                  :disabled="loadingStates.salesSave"
                  >提交</ElButton
                >
              </div>
              <div class="sales-sku-info-edit-wrapper">
                <SalesSkuInfo
                  ref="salesSkuInfoRef"
                  :approvalStatus="approvalStatus"
                  :showSalesSkuEditMode="
                    salesSkuInfoEditState || handleType === 'add' || handleType === 'copy'
                  "
                  v-model="formData.salesSkuInfo"
                  :productId="formData.id"
                  :user-options="userOptions"
                >
                </SalesSkuInfo>
              </div>
            </div>
          </ElTabPane>
          <ElTabPane label="图片信息" name="image" v-if="hasAuth('product:sku:pic')">
            <template #label>
              <span class="tab-label">
                图片信息
                <ElTag
                  v-if="getApprovalStatusInfo(approvalStatus.image) && props.from === 'sku'"
                  :type="getApprovalStatusInfo(approvalStatus.image)!.type"
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ getApprovalStatusInfo(approvalStatus.image)!.text }}
                </ElTag>
              </span>
            </template>
            <div class="tab-content-wrapper">
              <!-- 未编辑：右上角显示 撤回/编辑，提交与编辑平行展示 -->
              <div
                v-auth="'product:sku:pic:edit'"
                v-if="
                  !showImageEditMode &&
                  (handleType === 'detail' || handleType === 'edit') &&
                  props.from === 'sku'
                "
                class="tab-edit-button"
              >
                <ElButton
                  v-if="approvalStatus.image === 1"
                  type="warning"
                  @click="handleWithdraw('image', 5)"
                  :loading="loadingStates.withdraw"
                  :disabled="loadingStates.withdraw"
                >
                  撤回
                </ElButton>
                <template v-else-if="approvalStatus.image !== 1">
                  <ElButton @click="handleTabEdit('image')">
                    {{ getEditButtonText(approvalStatus.image) }}
                  </ElButton>
                  <ElButton
                    v-if="!isApprovedStatus(approvalStatus.image)"
                    type="primary"
                    v-btnReClick
                    @click="handleTabSave('image', true)"
                    :loading="loadingStates.imageSave"
                    :disabled="loadingStates.imageSave"
                    >提交</ElButton
                  >
                </template>
              </div>
              <!-- 编辑中：同一位置（右上角）显示 取消/暂存/提交 -->
              <div
                v-auth="'product:sku:pic:edit'"
                v-else-if="
                  showImageEditMode &&
                  imageInfoEditState &&
                  (handleType === 'detail' || handleType === 'edit')
                "
                class="tab-edit-button"
              >
                <ElButton @click="handleTabCancel('image')" :disabled="loadingStates.imageSave"
                  >取消</ElButton
                >
                <ElButton
                  v-btnReClick
                  @click="handleTabSave('image', false)"
                  :loading="loadingStates.imageSave"
                  :disabled="loadingStates.imageSave"
                  >暂存</ElButton
                >
                <ElButton
                  type="primary"
                  v-btnReClick
                  @click="handleTabSave('image', true)"
                  :loading="loadingStates.imageSave"
                  :disabled="loadingStates.imageSave"
                  >提交</ElButton
                >
              </div>
              <div v-if="showImageEditMode" class="image-info-edit-wrapper">
                <ImageInfo ref="imageInfoRef" v-model="formData.imageInfo" />
              </div>
              <div v-else class="image-info-detail-wrapper">
                <ImageInfoDetail :model-value="formData.imageInfo" />
              </div>
            </div>
          </ElTabPane>
          <ElTabPane label="合规认证" name="compliance" v-if="hasAuth('product:sku:certification')">
            <template #label>
              <span class="tab-label">
                合规认证
                <ElTag
                  v-if="getApprovalStatusInfo(approvalStatus.compliance) && props.from === 'sku'"
                  :type="getApprovalStatusInfo(approvalStatus.compliance)!.type"
                  size="small"
                  style="margin-left: 8px"
                >
                  {{ getApprovalStatusInfo(approvalStatus.compliance)!.text }}
                </ElTag>
              </span>
            </template>
            <div class="tab-content-wrapper">
              <!-- 未编辑：右上角显示 撤回/编辑，提交与编辑平行展示 -->
              <div
                v-auth="'product:sku:certification:edit'"
                v-if="
                  !showComplianceEditMode &&
                  (handleType === 'detail' || handleType === 'edit') &&
                  props.from === 'sku'
                "
                class="tab-edit-button"
              >
                <ElButton
                  v-if="approvalStatus.compliance === 1"
                  type="warning"
                  @click="handleWithdraw('compliance', 6)"
                  :loading="loadingStates.withdraw"
                  :disabled="loadingStates.withdraw"
                >
                  撤回
                </ElButton>
                <template v-else-if="approvalStatus.compliance !== 1">
                  <ElButton @click="handleTabEdit('compliance')">
                    {{ getEditButtonText(approvalStatus.compliance) }}
                  </ElButton>
                  <ElButton
                    v-if="!isApprovedStatus(approvalStatus.compliance)"
                    type="primary"
                    v-btnReClick
                    @click="handleTabSave('compliance', true)"
                    :loading="loadingStates.complianceSave"
                    :disabled="loadingStates.complianceSave"
                    >提交</ElButton
                  >
                </template>
              </div>
              <!-- 编辑中：同一位置（右上角）显示 取消/暂存/提交 -->
              <div
                v-auth="'product:sku:certification:edit'"
                v-else-if="
                  showComplianceEditMode &&
                  complianceInfoEditState &&
                  (handleType === 'detail' || handleType === 'edit')
                "
                class="tab-edit-button"
              >
                <ElButton
                  @click="handleTabCancel('compliance')"
                  :disabled="loadingStates.complianceSave"
                  >取消</ElButton
                >
                <ElButton
                  v-btnReClick
                  @click="handleTabSave('compliance', false)"
                  :loading="loadingStates.complianceSave"
                  :disabled="loadingStates.complianceSave"
                  >暂存</ElButton
                >
                <ElButton
                  type="primary"
                  v-btnReClick
                  @click="handleTabSave('compliance', true)"
                  :loading="loadingStates.complianceSave"
                  :disabled="loadingStates.complianceSave"
                  >提交</ElButton
                >
              </div>
              <div v-if="showComplianceEditMode" class="compliance-info-edit-wrapper">
                <ComplianceInfo ref="complianceInfoRef" v-model="formData.complianceInfo" />
              </div>
              <div v-else class="compliance-info-detail-wrapper">
                <ComplianceInfoDetail :model-value="formData.complianceInfo" />
              </div>
            </div>
          </ElTabPane>
          <ElTabPane
            label="操作日志"
            name="operation-log"
            v-if="handleType !== 'add' && handleType !== 'copy'"
          >
            <OperationLog
              :visible="dialogVisible"
              :params="{
                logKey: 'PRODUCT_SKU@',
                relationCode: props.initData?.id,
                permKeys: authCodes
              }"
            />
          </ElTabPane>
        </ElTabs>
      </div>
    </div>

    <template #footer>
      <!-- 新增/复制模式：显示取消、暂存、提交 -->
      <div class="dialog-footer" v-if="handleType === 'add' || handleType === 'copy'">
        <ElButton @click="handleClose" :disabled="loadingStates.saveDraft || loadingStates.submit"
          >取消</ElButton
        >
        <ElButton
          @click="handleSaveDraft"
          :loading="loadingStates.saveDraft"
          :disabled="loadingStates.saveDraft || loadingStates.submit"
          >暂存</ElButton
        >
        <ElButton
          type="primary"
          @click="handleSubmit"
          :loading="loadingStates.submit"
          :disabled="loadingStates.saveDraft || loadingStates.submit"
          >提交</ElButton
        >
      </div>
      <!-- 详情模式：关闭始终显示；复制仅 SKU 管理入口（from=sku） -->
      <div class="dialog-footer dialog-footer-center" v-else-if="handleType === 'detail'">
        <ElButton @click="handleClose">关闭</ElButton>
        <ElButton
          v-if="props.from === 'sku' && hasAuth('product:sku:common:copy') && formData.id"
          @click="handleCopy"
        >
          复制
        </ElButton>
      </div>
      <!-- 编辑模式：不显示任何按钮，只能通过右上角X关闭 -->
    </template>
  </ElDialog>

  <!-- Tab 切换确认（编辑态 + 未保存时拦截） -->
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
    ElIcon,
    ElMessage,
    ElRow,
    ElCol,
    ElMessageBox,
    // ElImage,
    type FormInstance,
    type FormRules
  } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import BasicInfo from './basic-info/index.vue'
  import BasicInfoDetail from './basic-info/detail.vue'
  import PurchaseInfo from './purchase-info/index.vue'
  import PurchaseInfoDetail from './purchase-info/detail.vue'
  import LogisticsInfo from './logistics-info/index.vue'
  import LogisticsInfoDetail from './logistics-info/detail.vue'
  import FinanceInfo from './finance-info/index.vue'
  import FinanceInfoDetail from './finance-info/detail.vue'
  import SalesSkuInfo from './sales-sku-info/index.vue'
  import ImageInfo from './image-info/index.vue'
  import ImageInfoDetail from './image-info/detail.vue'
  import ComplianceInfo from './compliance-info/index.vue'
  import ComplianceInfoDetail from './compliance-info/detail.vue'
  import OperationLog from '@/components/core/operation-log.vue'
  import FileUpload from '@/components/core/upload-custom/index.vue'
  import MkSelect from '@/components/core/others/mk-select/index.vue'
  import { spuPageList } from '@/api/product/spu'
  import {
    addSku,
    getProductSkuBasic,
    getSkuPurchaseBasic,
    getSkuLogisticsInfo,
    getSkuFinanceInfo,
    getSkuListingRelation,
    getSkuPicList,
    getSkuCertificationList,
    updateProductSkuBasic,
    updatePurchaseBasic,
    updateLogisticsInfo,
    updateFinanceInfo,
    updateListingRelation,
    updatePicList,
    updateCertificationList,
    cancelSubmit
  } from '@/api/product/sku'
  import { useAuth } from '@/composables/useAuth'
  import { isHttpError } from '@/utils/http/error'
  import { serializeComplianceCountryForApi } from '@/utils/compliance-country'
  import { companyPageList } from '@/api/finance/company-subject'
  import { labelProps } from '../../../index.vue'

  interface Props {
    visible: boolean
    initData: any
    categoryOptions?: any[]
    brandOptions?: any[]
    userOptions?: any[]
    from?: string
  }

  interface Emits {
    (e: 'update:visible', visible: boolean): void
    (e: 'submit', data: any): void
    (e: 'copy', id: string | number): void
  }

  const props = withDefaults(defineProps<Props>(), {
    categoryOptions: () => [],
    brandOptions: () => [],
    userOptions: () => [],
    from: ''
  })
  const { hasAuth } = useAuth()
  const emit = defineEmits<Emits>()

  /** 规格信息数值统一保留4位小数再传给后端，避免浮点误差导致过长小数 */
  const roundTo4 = (v: any): any => {
    if (v == null || typeof v !== 'number') return v
    if (Number.isInteger(v)) return v
    return Math.round(v * 10000) / 10000
  }

  const dialogVisible = computed({
    get: () => props.visible,
    set: (value) => emit('update:visible', value)
  })
  const operationLogRef = ref()
  // 计算所有通过权限检查的权限码（参照 add-spu-dialog）
  const authCodes = computed(() => {
    const codes: string[] = []
    const permissionMap = [
      { code: 'product:sku:basic', name: 'basic' },
      { code: 'product:sku:purchase', name: 'purchase' },
      { code: 'product:sku:logistics', name: 'logistics' },
      { code: 'product:sku:finance', name: 'finance' },
      { code: 'product:sku:listingRelation', name: 'sales' },
      { code: 'product:sku:pic', name: 'image' },
      { code: 'product:sku:certification', name: 'compliance' }
    ]

    permissionMap.forEach(({ code }) => {
      if (hasAuth(code)) {
        codes.push(code)
      }
    })

    return codes
  })

  // 审批状态跟踪
  const approvalStatus = reactive({
    basic: null as number | null, // 基础信息审批状态
    purchase: null as number | null, // 采购信息审批状态
    logistics: null as number | null, // 物流信息审批状态
    finance: null as number | null, // 财务信息审批状态
    sales: null as number | null, // 关联销售SKU审批状态
    image: null as number | null, // 图片信息审批状态
    compliance: null as number | null // 合规认证审批状态
  })

  /** 展示用 SPU 编码：优先下拉已选项；否则用接口回填的 formData.spuName（下拉分页未必含当前 SPU） */
  const spuName = computed(() => {
    const id = formData.spuId
    if (id === '' || id === null || id === undefined) return ''
    const theSPU = spuOptions.value.find((spu: any) => String(spu.value) === String(id))
    return theSPU?.spu ?? formData.spuName ?? ''
  })

  // 处理类型
  const handleType = computed(() => props.initData?.handleType || 'add')
  const editType = computed(() => props.initData?.editType)

  // 对话框标题
  const dialogTitle = computed(() => {
    if (handleType.value === 'add') return '添加SKU'
    if (handleType.value === 'copy') return '复制SKU'
    if (handleType.value === 'detail') return 'SKU详情'
    if (handleType.value === 'edit') {
      const titleMap: Record<string, string> = {
        editCommon: '编辑通用信息',
        editBasic: '编辑基础信息',
        editPurchase: '编辑采购信息',
        editLogistics: '编辑物流信息',
        editFinance: '编辑财务信息',
        editSales: '编辑关联销售SKU',
        editImage: '编辑图片信息',
        editCompliance: '编辑合规认证'
      }
      return titleMap[editType.value || ''] || 'SKU详情'
    }
    return 'SKU详情'
  })

  const activeTab = ref('basic')
  const topFormRef = ref<FormInstance>()
  const basicInfoRef = ref()
  const purchaseInfoRef = ref()
  const logisticsInfoRef = ref()
  const financeInfoRef = ref()
  const salesSkuInfoRef = ref()
  const imageInfoRef = ref()
  const complianceInfoRef = ref()

  // SPU选项和加载状态
  const spuOptions = ref<Array<{ label: string; value: string | number }>>([])
  const spuLoading = ref(false)

  // 提交状态（防止重复提交）
  const submitting = ref(false)
  // 标记是否正在程序主动关闭（避免 @close 事件重复触发确认提示）
  const isProgrammaticClose = ref(false)

  // 各个操作的loading状态
  const loadingStates = reactive({
    topFormSave: false, // 顶部表单保存
    basicSave: false, // 基础信息保存
    purchaseSave: false, // 采购信息保存
    logisticsSave: false, // 物流信息保存
    financeSave: false, // 财务信息保存
    salesSave: false, // 关联销售SKU保存
    imageSave: false, // 图片信息保存
    complianceSave: false, // 合规认证保存
    withdraw: false, // 撤回操作
    saveDraft: false, // 暂存
    submit: false // 提交
  })

  // 顶部表单编辑状态
  const topFormEditState = ref(false)

  // 各模块编辑状态
  const basicInfoEditState = ref(false)
  const purchaseInfoEditState = ref(false)
  const logisticsInfoEditState = ref(false)
  const financeInfoEditState = ref(false)
  const salesSkuInfoEditState = ref(false)
  const imageInfoEditState = ref(false)
  const complianceInfoEditState = ref(false)

  /** Tab 切换拦截：三按钮确认弹窗 */
  const tabSwitchConfirmVisible = ref(false)
  const tabSwitchSaving = ref(false)
  const tabSwitchPending = ref<{
    from: string
    to: string
    resolve: (allow: boolean) => void
  } | null>(null)

  // 保存初始数据
  const initialTopFormData = ref<any>(null)
  const initialBasicInfo = ref<any>(null)
  const initialPurchaseInfo = ref<any>(null)
  const initialLogisticsInfo = ref<any>(null)
  const initialFinanceInfo = ref<any>(null)
  const initialSalesSkuInfo = ref<any>(null)
  const initialImageInfo = ref<any>(null)
  const initialComplianceInfo = ref<any>(null)

  // 表单数据
  const formData = reactive<{
    id?: number
    sku: string
    chineseProductName: string
    englishProductName: string
    spuId: string | number
    spuName: string
    materialCode: string
    image: any[]
    basicInfo: any
    purchaseInfo: any
    logisticsInfo: any
    financeInfo: any
    salesSkuInfo: any
    imageInfo: any
    complianceInfo: any
  }>({
    sku: '',
    chineseProductName: '',
    englishProductName: '',
    spuId: '',
    spuName: '',
    materialCode: '',
    image: [],
    basicInfo: {},
    purchaseInfo: {},
    logisticsInfo: {},
    financeInfo: {},
    salesSkuInfo: { salesSkuList: [] },
    imageInfo: {},
    complianceInfo: {}
  })

  // SPU 变更时同步 formData.spuName；若下拉未命中（分页未含当前 SPU）则保留接口已回填的 spu，避免被清空
  watch(
    () => formData.spuId,
    (newId) => {
      if (newId === '' || newId === null || newId === undefined) {
        formData.spuName = ''
        return
      }
      const theSPU = spuOptions.value.find((spu: any) => String(spu.value) === String(newId))
      if (theSPU?.spu) {
        formData.spuName = theSPU.spu
      }
    },
    { immediate: true }
  )

  /** 将 isTax / isIncludeTax（可能为 0/1 或 boolean）统一为 boolean，供 ElSwitch 正确显示 */
  const normalizeIsTax = (isTax: any, isIncludeTax?: any): boolean => {
    const v = isTax ?? isIncludeTax
    return v === true || v === 1 || v === '1'
  }

  /** 将后端返回的布尔/数字/字符串统一为 0/1（用于下拉回显） */
  const normalizeBinarySelectValue = (value: any): 0 | 1 | null => {
    if (value === true || value === 1 || value === '1') return 1
    if (value === false || value === 0 || value === '0') return 0
    return null
  }

  /** 将枚举值统一为 number（无效时返回 null） */
  const normalizeNullableNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }

  // 检查采购基本信息是否为默认值（忽略currency默认值CNY）
  const isSkuPurchaseBasicDefault = (data: any) => {
    if (!data) return true
    // 检查除了currency之外的其他字段是否都为空/默认值
    const hasReferenceCost =
      data.referenceCost !== null && data.referenceCost !== undefined && data.referenceCost !== ''
    const hasReferenceDeliveryDays =
      data.referenceDeliveryDays !== null &&
      data.referenceDeliveryDays !== undefined &&
      data.referenceDeliveryDays !== ''
    const hasPurchaseUserList =
      Array.isArray(data.purchaseUserList) && data.purchaseUserList.length > 0
    const hasPurchaseRemark =
      data.purchaseRemark !== null &&
      data.purchaseRemark !== undefined &&
      data.purchaseRemark !== ''
    const hasSplitNum =
      data.splitNum !== null && data.splitNum !== undefined && data.splitNum !== ''
    const hasSupplierQuotationList =
      Array.isArray(data.skuSupplierQuotationList) && data.skuSupplierQuotationList.length > 0
    return (
      !hasReferenceCost &&
      !hasReferenceDeliveryDays &&
      !hasPurchaseUserList &&
      !hasPurchaseRemark &&
      !hasSplitNum &&
      !hasSupplierQuotationList
    )
  }

  // 检查物流信息是否为默认值：除 customsClearPriceCurrency 外，若所有值都为 null/undefined/[] 则视为默认，传 null
  const isSkuLogisticsInfoDefault = (data: any) => {
    if (!data) return true
    const fieldsToCheck = [
      'logisticsUserList',
      'isTaxIncluded',
      'customsHsCode',
      'customsName',
      'englishCustomsName',
      'customsMaterial',
      'customsModel',
      'customsUnit',
      'customsPrice',
      'customsPriceCurrency',
      'customsUsage',
      'originCountry',
      'domesticCity',
      'exemptionTax',
      'outletBenefits',
      'customsClearanceCode',
      'customsClearModel',
      'customsClearPrice',
      // 排除 customsClearPriceCurrency：仅该字段有值时仍传 null
      'customsClearTaxRate',
      'otherDeclarationElements',
      'customsDeclarationMethod',
      'productAttr',
      'brandType',
      'logisticsResponsiblePersons'
    ]
    for (const field of fieldsToCheck) {
      const val = data[field]
      if (Array.isArray(val)) {
        if (val.length > 0) return false
      } else if (val !== null && val !== undefined && val !== '') {
        return false
      }
    }
    return true
  }

  // 检查财务信息是否为默认值
  const isSkuFinanceInfoDefault = (data: any) => {
    if (!data) return true
    const fieldsToCheck = [
      'financeUserList',
      'saleOrganizationId',
      'saleOrganizationName',
      'purchaseOrganizationId',
      'purchaseOrganizationName',
      'customsOrganizationId',
      'customsOrganizationName'
    ]
    for (const field of fieldsToCheck) {
      const val = data[field]
      if (Array.isArray(val)) {
        if (val.length > 0) return false
      } else if (val !== null && val !== undefined && val !== '') {
        return false
      }
    }
    return true
  }

  // 检查关联销售SKU是否为默认值
  const isAssociateLocalSkuDtoDefault = (data: any) => {
    if (!data) return true
    const productIdentifiers = data.productIdentifiers
    return !Array.isArray(productIdentifiers) || productIdentifiers.length === 0
  }

  // 检查图片列表是否为默认值
  const isSkuPicListDefault = (data: any[]) => {
    return !Array.isArray(data) || data.length === 0
  }

  // 检查合规认证列表是否为默认值
  const isSkuCertificationListDefault = (data: any[]) => {
    return !Array.isArray(data) || data.length === 0
  }

  // 获取审批状态文本和类型
  const getApprovalStatusInfo = (status: number | null) => {
    if (status === null || status === undefined) return null
    const statusMap: Record<
      number,
      { text: string; type: 'info' | 'warning' | 'success' | 'danger' }
    > = {
      0: { text: '草稿', type: 'info' },
      1: { text: '审批中', type: 'warning' },
      2: { text: '审批通过', type: 'success' },
      3: { text: '审批驳回', type: 'danger' }
    }
    return statusMap[status] || null
  }

  /** 审批通过(2)时按钮显示「发起变更」，否则显示「编辑」。兼容接口返回字符串 "2" */
  const getEditButtonText = (status: number | string | null | undefined): string =>
    Number(status) === 2 ? '发起变更' : '编辑'

  /** 审批通过(2)时不再显示与编辑平级的「提交」按钮 */
  const isApprovedStatus = (s: number | string | null | undefined): boolean => Number(s) === 2

  // 顶部表单验证规则（与文档「通用信息」字段说明一致：长度、字符集、创建时必填）
  const topFormRules: FormRules = {
    sku: [
      { required: true, message: '请输入SKU', trigger: 'blur' },
      { max: 50, message: 'SKU最大长度50个字符', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z0-9_.-]*$/,
        message: '仅支持数字、字母、下划线、连字符、英文点，禁止空格及其他特殊字符',
        trigger: 'blur'
      }
    ],
    chineseProductName: [
      { required: true, message: '请输入中文品名', trigger: 'blur' },
      { max: 50, message: '中文品名最大长度50个字符', trigger: 'blur' },
      {
        pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_.-]*$/,
        message: '仅支持汉字、数字、字母、下划线、连字符、英文点，禁止空格及其他特殊字符',
        trigger: 'blur'
      }
    ],
    englishProductName: [
      { required: true, message: '请输入英文品名', trigger: 'blur' },
      { max: 50, message: '英文品名最大长度50个字符', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z0-9_.-]*$/,
        message: '仅支持数字、字母、下划线、连字符、英文点，禁止空格及其他特殊字符',
        trigger: 'blur'
      }
    ],
    spuId: [
      {
        required: true,
        validator: (_rule: any, value: any, callback: (e?: Error) => void) => {
          if (handleType.value !== 'add' && handleType.value !== 'copy') {
            callback()
            return
          }
          if (value === '' || value === null || value === undefined) {
            callback(new Error('请选择SPU'))
          } else {
            callback()
          }
        },
        trigger: 'change'
      }
    ],
    materialCode: [
      { required: true, message: '请输入物料编码', trigger: 'blur' },
      { max: 20, message: '物料编码最大长度20个字符', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z0-9_.-]*$/,
        message: '仅支持数字、字母、下划线、连字符、英文点，禁止空格及其他特殊字符',
        trigger: 'blur'
      }
    ]
  }

  // 计算是否显示顶部表单编辑模式
  // 注意：顶部信息的编辑状态独立于下面的tab，无论处于哪个tab都应该保持编辑/查看状态
  const showTopFormEditMode = computed(() => {
    if (handleType.value === 'add' || handleType.value === 'copy') {
      return true
    }
    // 基础信息审批中时，顶部信息（通用信息）也不可编辑（基础信息和顶部信息是同一个审批接口）
    if (approvalStatus.basic === 1) {
      return false
    }
    if (handleType.value === 'detail' || handleType.value === 'edit') {
      // 顶部信息的编辑状态独立控制，不受当前tab影响
      return topFormEditState.value
    }
    return true
  })

  // 计算是否显示顶部表单编辑按钮
  // 详情/编辑模式下通用信息由基础信息 Tab 的编辑按钮统一控制，顶部一律不显示编辑/撤回，只保留基础信息 Tab 内的一处编辑
  const showTopFormEditButtons = computed(() => {
    if (handleType.value === 'add' || handleType.value === 'copy') {
      return false
    }
    // 详情、编辑（含 editCommon/editBasic 等）时顶部不显示按钮，由基础信息 Tab 的 撤回/编辑 统一控制
    if (handleType.value === 'detail' || handleType.value === 'edit') {
      return false
    }
    if (approvalStatus.basic === 1) {
      return false
    }
    return true
  })

  // 计算是否显示编辑按钮
  // const showEditButtons = computed(() => {
  //   return handleType.value === 'detail' || handleType.value === 'edit'
  // })

  // 计算基础信息是否编辑模式
  const showBasicEditMode = computed(() => {
    if (handleType.value === 'add' || handleType.value === 'copy') {
      return true
    }
    // 审批中时不允许编辑
    if (approvalStatus.basic === 1) {
      return false
    }
    if (handleType.value === 'edit') {
      // 编辑通用信息时,如果用户点击了编辑按钮，允许进入编辑模式
      if (editType.value === 'editCommon') {
        return basicInfoEditState.value
      }
      if (editType.value === 'editBasic') {
        return basicInfoEditState.value
      }
    }
    // 详情模式或编辑模式下，根据编辑状态决定是否显示编辑模式
    // 如果用户点击了编辑按钮，basicInfoEditState.value 会被设置为 true
    return basicInfoEditState.value
  })

  // 计算采购信息是否编辑模式
  const showPurchaseEditMode = computed(() => {
    if (handleType.value === 'add' || handleType.value === 'copy') {
      return true
    }
    // 审批中时不允许编辑
    if (approvalStatus.purchase === 1) {
      return false
    }
    if (handleType.value === 'edit') {
      // 编辑通用信息时,如果用户点击了编辑按钮，允许进入编辑模式
      if (editType.value === 'editCommon') {
        return purchaseInfoEditState.value
      }
      if (editType.value === 'editPurchase') {
        return purchaseInfoEditState.value
      }
    }
    // 详情模式或编辑模式下，根据编辑状态决定是否显示编辑模式
    return purchaseInfoEditState.value
  })

  // 计算物流信息是否编辑模式
  const showLogisticsEditMode = computed(() => {
    if (handleType.value === 'add' || handleType.value === 'copy') {
      return true
    }
    // 审批中时不允许编辑
    if (approvalStatus.logistics === 1) {
      return false
    }
    if (handleType.value === 'edit') {
      // 编辑通用信息时,如果用户点击了编辑按钮，允许进入编辑模式
      if (editType.value === 'editCommon') {
        return logisticsInfoEditState.value
      }
      if (editType.value === 'editLogistics') {
        return logisticsInfoEditState.value
      }
    }
    // 详情模式或编辑模式下，根据编辑状态决定是否显示编辑模式
    return logisticsInfoEditState.value
  })

  // 计算财务信息是否编辑模式
  const showFinanceEditMode = computed(() => {
    if (handleType.value === 'add' || handleType.value === 'copy') {
      return true
    }
    // 审批中时不允许编辑
    if (approvalStatus.finance === 1) {
      return false
    }
    if (handleType.value === 'edit') {
      // 编辑通用信息时,如果用户点击了编辑按钮，允许进入编辑模式
      if (editType.value === 'editCommon') {
        return financeInfoEditState.value
      }
      if (editType.value === 'editFinance') {
        return financeInfoEditState.value
      }
    }
    // 详情模式或编辑模式下，根据编辑状态决定是否显示编辑模式
    return financeInfoEditState.value
  })

  // 计算关联销售SKU是否编辑模式
  // const showSalesSkuEditMode = computed(() => {
  //   if (handleType.value === 'add' || handleType.value === 'copy') {
  //     return true
  //   }
  //   // 审批中时不允许编辑
  //   if (approvalStatus.sales === 1) {
  //     return false
  //   }
  //   if (handleType.value === 'edit') {
  //     // 编辑通用信息时,关联销售SKU tab为只读
  //     if (editType.value === 'editCommon') {
  //       return false
  //     }
  //     if (editType.value === 'editSales') {
  //       return salesSkuInfoEditState.value
  //     }
  //   }
  //   // 详情模式或编辑模式下，根据编辑状态决定是否显示编辑模式
  //   return salesSkuInfoEditState.value
  // })

  // 计算图片信息是否编辑模式
  const showImageEditMode = computed(() => {
    if (handleType.value === 'add' || handleType.value === 'copy') {
      return true
    }
    // 审批中时不允许编辑
    if (approvalStatus.image === 1) {
      return false
    }
    if (handleType.value === 'edit') {
      // 编辑通用信息时,如果用户点击了编辑按钮，允许进入编辑模式
      if (editType.value === 'editCommon') {
        return imageInfoEditState.value
      }
      if (editType.value === 'editImage') {
        return imageInfoEditState.value
      }
    }
    // 详情模式或编辑模式下，根据编辑状态决定是否显示编辑模式
    return imageInfoEditState.value
  })

  // 计算合规认证是否编辑模式
  const showComplianceEditMode = computed(() => {
    if (handleType.value === 'add' || handleType.value === 'copy') {
      return true
    }
    // 审批中时不允许编辑
    if (approvalStatus.compliance === 1) {
      return false
    }
    if (handleType.value === 'edit') {
      // 编辑通用信息时,如果用户点击了编辑按钮，允许进入编辑模式
      if (editType.value === 'editCommon') {
        return complianceInfoEditState.value
      }
      if (editType.value === 'editCompliance') {
        return complianceInfoEditState.value
      }
    }
    // 详情模式或编辑模式下，根据编辑状态决定是否显示编辑模式
    return complianceInfoEditState.value
  })

  // 当前编辑状态
  // const currentEditState = computed(() => {
  //   if (activeTab.value === 'basic') return basicInfoEditState.value
  //   if (activeTab.value === 'purchase') return purchaseInfoEditState.value
  //   if (activeTab.value === 'logistics') return logisticsInfoEditState.value
  //   if (activeTab.value === 'finance') return financeInfoEditState.value
  //   if (activeTab.value === 'sales') return salesSkuInfoEditState.value
  //   if (activeTab.value === 'image') return imageInfoEditState.value
  //   if (activeTab.value === 'compliance') return complianceInfoEditState.value
  //   return false
  // })

  /** 当前 SKU 的 SPU 若不在下拉里，补一条选项，否则 MkSelect/el-select 有值也无展示 */
  const ensureCurrentSpuInOptions = () => {
    const id = formData.spuId
    if (id === '' || id === null || id === undefined) return
    const displaySpu = String(formData.spuName || '').trim() || String(id)
    if (spuOptions.value.some((o: any) => String(o.value) === String(id))) return
    spuOptions.value = [{ label: displaySpu, value: id, spu: displaySpu }, ...spuOptions.value]
  }

  // 加载所有SPU选项（带缓存机制）
  const loadAllSpuOptions = async () => {
    // 如果已经有数据且正在加载中，直接返回，避免重复请求
    if (spuLoading.value) {
      return
    }
    // 如果已经有数据，直接返回，使用缓存
    if (spuOptions.value.length > 0) {
      ensureCurrentSpuInOptions()
      return
    }
    spuLoading.value = true
    try {
      const res: any = await spuPageList({
        hasCount: true,
        pageSize: -1
      })
      spuOptions.value =
        res?.data?.records?.map((item: any) => ({
          label: item.spuName,
          value: item.id,
          spu: item.spu ?? item.spuCode ?? item.spuName ?? String(item.id)
        })) || []
      ensureCurrentSpuInOptions()
    } catch (error) {
      console.error('加载SPU列表失败:', error)
      spuOptions.value = []
      ensureCurrentSpuInOptions()
    } finally {
      spuLoading.value = false
    }
  }

  // 搜索SPU (保留兼容，但现在直接加载所有)
  // const handleSearchSpu = async (query: string) => {
  //   // MkSelect 会自动处理过滤，所以这里不需要远程搜索
  //   // 只在第一次加载时获取所有选项
  //   if (spuOptions.value.length === 0) {
  //     await loadAllSpuOptions()
  //   }
  // }

  // 顶部表单编辑
  const handleTopFormEdit = () => {
    // 基础信息审批中时，通用信息也不可编辑（基础信息和顶部信息是同一个审批接口）
    if (approvalStatus.basic === 1) {
      return
    }
    topFormEditState.value = true
    // 方案 B：editCommon 下点击「编辑」时，同时进入基础信息编辑
    if (editType.value === 'editCommon') {
      basicInfoEditState.value = true
      initialBasicInfo.value = JSON.parse(JSON.stringify(formData.basicInfo || {}))
    }
    // 保存初始数据
    initialTopFormData.value = {
      sku: formData.sku,
      chineseProductName: formData.chineseProductName,
      englishProductName: formData.englishProductName,
      spuId: formData.spuId,
      spuName: formData.spuName,
      materialCode: formData.materialCode,
      image: [...formData.image]
    }
  }

  // 方案 C：通用信息+基础信息联合取消（仅用于 editCommon）
  const handleCommonBasicCancel = () => {
    if (initialTopFormData.value) {
      Object.assign(formData, initialTopFormData.value)
    }
    if (initialBasicInfo.value) {
      formData.basicInfo = JSON.parse(JSON.stringify(initialBasicInfo.value))
    }
    topFormEditState.value = false
    basicInfoEditState.value = false
  }

  // 顶部表单取消
  const handleTopFormCancel = () => {
    if (initialTopFormData.value) {
      Object.assign(formData, initialTopFormData.value)
    }
    topFormEditState.value = false
  }

  // 顶部表单保存
  const handleTopFormSave = async () => {
    if (!topFormRef.value) return
    if (loadingStates.topFormSave) return
    loadingStates.topFormSave = true
    try {
      await topFormRef.value.validate()
      if (!formData.id) {
        ElMessage.error('缺少产品ID')
        return
      }

      // 合并顶部表单数据和基础信息数据
      const basic = formData.basicInfo || {}

      // 准备图片数据
      let picUrl = ''
      let picUrlObj = {}
      if (formData.image && formData.image.length > 0) {
        // 提交时优先用 rawUrl（持久化 OSS 地址），避免使用会过期的签名 URL
        picUrl =
          formData.image[0].rawUrl || formData.image[0].url || formData.image[0].response || ''
        picUrlObj = {
          name: formData.image[0].name || picUrl.split('/').pop() || 'image',
          url: picUrl
        }
      }

      // 准备请求数据
      const requestData = {
        id: formData.id,
        sku: formData.sku,
        productChineseName: formData.chineseProductName,
        productEnglishName: formData.englishProductName,
        spu: spuName.value || formData.spuName || '',
        spuId: formData.spuId,
        materialCode: formData.materialCode,
        picUrl: picUrl ? JSON.stringify(picUrlObj) : '',
        attachList: formData.image || [],
        submitFlag: false, // 保存不提交审批
        // 基础信息字段
        categoryId: basic.categoryId,
        categoryName: basic.categoryName,
        brandId: basic.brandId,
        brandName: basic.brandName,
        material: basic.material,
        purpose: basic.purpose,
        unit: basic.unit,
        specificationDescription: basic.specificationDescription ?? '',
        productRemark: basic.productRemark ?? '',
        productStatus: basic.productStatus,
        productDeveloperUserList: basic.productDeveloperUserList || [],
        productOwnerUserList: basic.productOwnerUserList || [],
        specUnitSystem: basic.specUnitSystem === 1 ? 1 : 0,
        // 规格尺寸数据（数值统一保留4位小数）
        productSizeUnit: basic.productSizeUnit,
        productLength: roundTo4(basic.productLength),
        productLengthInch: roundTo4(basic.productLengthInch),
        productWidth: roundTo4(basic.productWidth),
        productWidthInch: roundTo4(basic.productWidthInch),
        productHeight: roundTo4(basic.productHeight),
        productHeightInch: roundTo4(basic.productHeightInch),
        productNetWeightUnit: basic.productNetWeightUnit,
        productNetWeight: roundTo4(basic.productNetWeight),
        productNetWeightLb: roundTo4(basic.productNetWeightLb),
        productGrossWeightUnit: basic.productGrossWeightUnit,
        productGrossWeight: roundTo4(basic.productGrossWeight),
        productGrossWeightLb: roundTo4(basic.productGrossWeightLb),
        productPackageSizeUnit: basic.productPackageSizeUnit,
        productPackageLength: roundTo4(basic.productPackageLength),
        productPackageLengthInch: roundTo4(basic.productPackageLengthInch),
        productPackageWidth: roundTo4(basic.productPackageWidth),
        productPackageWidthInch: roundTo4(basic.productPackageWidthInch),
        productPackageHeight: roundTo4(basic.productPackageHeight),
        productPackageHeightInch: roundTo4(basic.productPackageHeightInch),
        boxSizeUnit: basic.boxSizeUnit,
        boxLength: roundTo4(basic.boxLength),
        boxLengthInch: roundTo4(basic.boxLengthInch),
        boxWidth: roundTo4(basic.boxWidth),
        boxWidthInch: roundTo4(basic.boxWidthInch),
        boxHeight: roundTo4(basic.boxHeight),
        boxHeightInch: roundTo4(basic.boxHeightInch),
        boxNetWeightUnit: basic.boxNetWeightUnit,
        boxNetWeight: roundTo4(basic.boxNetWeight),
        boxNetWeightLb: roundTo4(basic.boxNetWeightLb),
        boxGrossWeightUnit: basic.boxGrossWeightUnit,
        boxGrossWeight: roundTo4(basic.boxGrossWeight),
        boxGrossWeightLb: roundTo4(basic.boxGrossWeightLb),
        boxNum: basic.boxNum
      }

      await updateProductSkuBasic(requestData)
      topFormEditState.value = false
      operationLogRef.value?.reget?.()
      // 更新初始数据
      initialTopFormData.value = {
        sku: formData.sku,
        chineseProductName: formData.chineseProductName,
        englishProductName: formData.englishProductName,
        spuId: formData.spuId,
        spuName: formData.spuName,
        materialCode: formData.materialCode,
        image: [...formData.image]
      }
      ElMessage.success('保存成功')
      // 注意：编辑模式下保存不关闭弹窗，不触发submit事件，避免重复提示
    } catch (error: any) {
      console.log('表单验证失败', error)
      console.log('保存失败', error)
      if (shouldShowError(error)) {
        if (error?.errors) {
          ElMessage.error('请完善必填信息')
        } else if (!isHttpError(error)) {
          ElMessage.error('保存失败')
        }
      }
      topFormEditState.value = false
    } finally {
      loadingStates.topFormSave = false
    }
  }

  // 编辑按钮
  // const handleEdit = () => {
  //   if (activeTab.value === 'basic') {
  //     // 审批中时不允许编辑
  //     if (approvalStatus.basic !== 1) {
  //       basicInfoEditState.value = true
  //       initialBasicInfo.value = JSON.parse(JSON.stringify(formData.basicInfo || {}))
  //     }
  //   } else if (activeTab.value === 'purchase') {
  //     // 审批中时不允许编辑
  //     if (approvalStatus.purchase !== 1) {
  //       purchaseInfoEditState.value = true
  //       initialPurchaseInfo.value = JSON.parse(JSON.stringify(formData.purchaseInfo || {}))
  //     }
  //   } else if (activeTab.value === 'logistics') {
  //     // 审批中时不允许编辑
  //     if (approvalStatus.logistics !== 1) {
  //       logisticsInfoEditState.value = true
  //       initialLogisticsInfo.value = JSON.parse(JSON.stringify(formData.logisticsInfo || {}))
  //     }
  //   } else if (activeTab.value === 'finance') {
  //     // 审批中时不允许编辑
  //     if (approvalStatus.finance !== 1) {
  //       financeInfoEditState.value = true
  //       initialFinanceInfo.value = JSON.parse(JSON.stringify(formData.financeInfo || {}))
  //     }
  //   } else if (activeTab.value === 'sales') {
  //     // 审批中时不允许编辑
  //     if (approvalStatus.sales !== 1) {
  //       salesSkuInfoEditState.value = true
  //       initialSalesSkuInfo.value = JSON.parse(JSON.stringify(formData.salesSkuInfo || {}))
  //     }
  //   } else if (activeTab.value === 'image') {
  //     // 审批中时不允许编辑
  //     if (approvalStatus.image !== 1) {
  //       imageInfoEditState.value = true
  //       initialImageInfo.value = JSON.parse(JSON.stringify(formData.imageInfo || {}))
  //     }
  //   } else if (activeTab.value === 'compliance') {
  //     // 审批中时不允许编辑
  //     if (approvalStatus.compliance !== 1) {
  //       complianceInfoEditState.value = true
  //       initialComplianceInfo.value = JSON.parse(JSON.stringify(formData.complianceInfo || {}))
  //     }
  //   }
  // }

  // Tab级别的取消按钮
  const handleTabCancel = (tabName: string) => {
    if (tabName === 'basic') {
      // 详情/编辑下通用信息与基础信息同组，取消需同时恢复顶部+基础信息
      if (handleType.value === 'detail' || handleType.value === 'edit') {
        handleCommonBasicCancel()
        return
      }
      if (initialBasicInfo.value) {
        formData.basicInfo = JSON.parse(JSON.stringify(initialBasicInfo.value))
      }
      basicInfoEditState.value = false
    } else if (tabName === 'purchase') {
      if (initialPurchaseInfo.value) {
        formData.purchaseInfo = JSON.parse(JSON.stringify(initialPurchaseInfo.value))
      }
      purchaseInfoEditState.value = false
    } else if (tabName === 'logistics') {
      if (initialLogisticsInfo.value) {
        formData.logisticsInfo = JSON.parse(JSON.stringify(initialLogisticsInfo.value))
      }
      logisticsInfoEditState.value = false
    } else if (tabName === 'finance') {
      if (initialFinanceInfo.value) {
        formData.financeInfo = JSON.parse(JSON.stringify(initialFinanceInfo.value))
      }
      financeInfoEditState.value = false
    } else if (tabName === 'sales') {
      // 恢复初始数据，即使为空对象也要恢复
      if (initialSalesSkuInfo.value !== null && initialSalesSkuInfo.value !== undefined) {
        formData.salesSkuInfo = JSON.parse(JSON.stringify(initialSalesSkuInfo.value))
      } else {
        // 如果初始值为空，恢复为空对象结构
        formData.salesSkuInfo = { salesSkuList: [] }
      }
      salesSkuInfoEditState.value = false
    } else if (tabName === 'image') {
      if (initialImageInfo.value) {
        formData.imageInfo = JSON.parse(JSON.stringify(initialImageInfo.value))
      }
      imageInfoEditState.value = false
    } else if (tabName === 'compliance') {
      if (initialComplianceInfo.value) {
        formData.complianceInfo = JSON.parse(JSON.stringify(initialComplianceInfo.value))
      }
      complianceInfoEditState.value = false
    }
  }

  // 编辑按钮 - 进入编辑模式
  // editCommon 时：基础信息 Tab 的「编辑」同时控制顶部通用信息，二者一起进入编辑
  const handleTabEdit = (tabName: string) => {
    if (tabName === 'basic') {
      // 审批中时不允许编辑（审批状态为1表示审批中）
      if (approvalStatus.basic !== 1) {
        basicInfoEditState.value = true
        initialBasicInfo.value = JSON.parse(JSON.stringify(formData.basicInfo || {}))
        // 详情/编辑模式下通用信息由基础信息编辑按钮统一控制，点基础信息「编辑」时顶部一并进入编辑
        if (handleType.value === 'detail' || handleType.value === 'edit') {
          topFormEditState.value = true
          initialTopFormData.value = {
            sku: formData.sku,
            chineseProductName: formData.chineseProductName,
            englishProductName: formData.englishProductName,
            spuId: formData.spuId,
            spuName: formData.spuName,
            materialCode: formData.materialCode,
            image: formData.image ? [...formData.image] : []
          }
        }
      }
    } else if (tabName === 'purchase') {
      // 审批中时不允许编辑
      if (approvalStatus.purchase !== 1) {
        purchaseInfoEditState.value = true
        initialPurchaseInfo.value = JSON.parse(JSON.stringify(formData.purchaseInfo || {}))
      }
    } else if (tabName === 'logistics') {
      // 审批中时不允许编辑
      if (approvalStatus.logistics !== 1) {
        logisticsInfoEditState.value = true
        initialLogisticsInfo.value = JSON.parse(JSON.stringify(formData.logisticsInfo || {}))
      }
    } else if (tabName === 'finance') {
      // 审批中时不允许编辑
      if (approvalStatus.finance !== 1) {
        financeInfoEditState.value = true
        initialFinanceInfo.value = JSON.parse(JSON.stringify(formData.financeInfo || {}))
      }
    } else if (tabName === 'sales') {
      // 审批中时不允许编辑
      if (approvalStatus.sales !== 1) {
        salesSkuInfoEditState.value = true
        // 保存初始数据，确保数据结构完整
        const currentData = formData.salesSkuInfo || {}
        initialSalesSkuInfo.value = JSON.parse(
          JSON.stringify({
            salesSkuList: currentData.salesSkuList || []
          })
        )
      }
    } else if (tabName === 'image') {
      // 审批中时不允许编辑
      if (approvalStatus.image !== 1) {
        imageInfoEditState.value = true
        initialImageInfo.value = JSON.parse(JSON.stringify(formData.imageInfo || {}))
      }
    } else if (tabName === 'compliance') {
      // 审批中时不允许编辑
      if (approvalStatus.compliance !== 1) {
        complianceInfoEditState.value = true
        initialComplianceInfo.value = JSON.parse(JSON.stringify(formData.complianceInfo || {}))
      }
    }
  }

  // 撤回提交
  const handleWithdraw = async (tabName: string, type: number) => {
    if (!formData.id) {
      ElMessage.error('缺少产品ID')
      return
    }
    if (loadingStates.withdraw) return // 防止重复点击

    try {
      await ElMessageBox.confirm('确认撤回此模块的审批吗?', '撤回确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })

      loadingStates.withdraw = true
      await cancelSubmit({
        productId: formData.id,
        type: type
      })
      operationLogRef.value?.reget?.()
      ElMessage.success('撤回成功')

      // 重新加载SKU数据
      await loadSkuData(formData.id)

      // 关联销售SKU 撤回后单独再拉一次列表并刷新审批状态，确保按钮从「撤回」变为「编辑/提交」
      if (tabName === 'sales' && formData.id) {
        try {
          const res = await getSkuListingRelation(
            { localSku: formData.id, currentPage: 1, pageSize: 10000 },
            { silent: true }
          )
          // 兼容多种返回结构：res.data 或 res 本身
          const payload = (res?.data ?? res ?? {}) as any
          const salesSkuList = payload.dtoList ?? payload.list ?? []
          formData.salesSkuInfo = {
            salesSkuList: (Array.isArray(salesSkuList) ? salesSkuList : []).map((item: any) => {
              let listingRelationUserList: number[] = []
              if (item.listingRelationOwnerUsers) {
                try {
                  listingRelationUserList = JSON.parse(item.listingRelationOwnerUsers)
                } catch {
                  listingRelationUserList = []
                }
              }
              return {
                ...item,
                id: item.id,
                accountId: item.accountId,
                accountName: item.accountName,
                listingId: item.listingId,
                msku: item.msku,
                sellerSku: item.sellerSku,
                salesSku: item.msku || item.sellerSku,
                marketplace: item.marketplace,
                country: item.country,
                region: item.region || item.country,
                listingRelationUserList,
                asin: item.asin,
                listingRelationOwnerUsersName: item.listingRelationOwnerUsersName || '',
                salesManagerNamesStr:
                  item.listingRelationOwnerUsersName || item.salesManagerNamesStr || '',
                salesEntity: item.salesEntity || item.sellingEntity || '',
                storeName: item.storeName || item.accountName || '',
                area: item.area || item.marketplace || ''
              }
            })
          }
          const salesStatus =
            payload.approveStatus ?? res?.approveStatus ?? payload[0]?.approveStatus ?? null
          // 撤回后必须刷新状态：有返回值用返回值，否则置为草稿(0)，保证按钮从「撤回」变为「编辑」
          approvalStatus.sales = salesStatus !== null && salesStatus !== undefined ? salesStatus : 0
          salesSkuInfoEditState.value = false
        } catch {
          // 静默失败时仍将关联销售SKU置为草稿，保证按钮状态更新
          approvalStatus.sales = 0
          salesSkuInfoEditState.value = false
        }
      }
    } catch (error: any) {
      if (error !== 'cancel' && shouldShowError(error) && !isHttpError(error)) {
        console.error('撤回失败:', error)
        ElMessage.error('撤回失败')
      }
    } finally {
      loadingStates.withdraw = false
    }
  }

  // const basicData: any = inject('basicData')
  // const companyAll = basicData.companyAll
  const companyAll = ref<labelProps[]>([])
  // 获取公司主体
  const getCompanySubject = async () => {
    const res: any = await companyPageList({ currentPage: 1, pageSize: -1, status: 1 })
    companyAll.value = res?.data?.records || []
  }
  /** 接口错误若已由 HTTP 层展示过则不再重复弹窗 */
  const shouldShowError = (error: any) => !error?.messageShown

  const isTabInEditModeForLeaveGuard = (tabName: string): boolean => {
    switch (tabName) {
      case 'basic':
        return basicInfoEditState.value
      case 'purchase':
        return purchaseInfoEditState.value
      case 'logistics':
        return logisticsInfoEditState.value
      case 'finance':
        return financeInfoEditState.value
      case 'sales':
        return salesSkuInfoEditState.value
      case 'image':
        return imageInfoEditState.value
      case 'compliance':
        return complianceInfoEditState.value
      default:
        return false
    }
  }

  const isTopFormSnapshotDirty = (): boolean => {
    if (!topFormEditState.value || !initialTopFormData.value) return false
    const i = initialTopFormData.value
    const imgCur = JSON.stringify(formData.image || [])
    const imgInit = JSON.stringify(i.image || [])
    return (
      formData.sku !== i.sku ||
      formData.chineseProductName !== i.chineseProductName ||
      formData.englishProductName !== i.englishProductName ||
      String(formData.spuId ?? '') !== String(i.spuId ?? '') ||
      (formData.spuName || '') !== (i.spuName || '') ||
      formData.materialCode !== i.materialCode ||
      imgCur !== imgInit
    )
  }

  /** 当前 Tab 相对进入编辑时的快照是否有未保存改动（含基础 Tab 下的顶部通用信息） */
  const isTabDirtyForLeaveGuard = (tabName: string): boolean => {
    if (tabName === 'basic') {
      const basicDirty =
        !!initialBasicInfo.value &&
        basicInfoEditState.value &&
        JSON.stringify(formData.basicInfo || {}) !== JSON.stringify(initialBasicInfo.value)
      return basicDirty || isTopFormSnapshotDirty()
    }
    if (tabName === 'purchase') {
      return (
        !!initialPurchaseInfo.value &&
        purchaseInfoEditState.value &&
        JSON.stringify(formData.purchaseInfo || {}) !== JSON.stringify(initialPurchaseInfo.value)
      )
    }
    if (tabName === 'logistics') {
      return (
        !!initialLogisticsInfo.value &&
        logisticsInfoEditState.value &&
        JSON.stringify(formData.logisticsInfo || {}) !== JSON.stringify(initialLogisticsInfo.value)
      )
    }
    if (tabName === 'finance') {
      return (
        !!initialFinanceInfo.value &&
        financeInfoEditState.value &&
        JSON.stringify(formData.financeInfo || {}) !== JSON.stringify(initialFinanceInfo.value)
      )
    }
    if (tabName === 'sales') {
      const cur = JSON.stringify({ salesSkuList: formData.salesSkuInfo?.salesSkuList || [] })
      const init = JSON.stringify(initialSalesSkuInfo.value || { salesSkuList: [] })
      return salesSkuInfoEditState.value && initialSalesSkuInfo.value != null && cur !== init
    }
    if (tabName === 'image') {
      return (
        !!initialImageInfo.value &&
        imageInfoEditState.value &&
        JSON.stringify(formData.imageInfo || {}) !== JSON.stringify(initialImageInfo.value)
      )
    }
    if (tabName === 'compliance') {
      return (
        !!initialComplianceInfo.value &&
        complianceInfoEditState.value &&
        JSON.stringify(formData.complianceInfo || {}) !==
          JSON.stringify(initialComplianceInfo.value)
      )
    }
    return false
  }

  const shouldGuardSkuTabLeave = (fromTab: string): boolean => {
    if (props.from !== 'sku') return false
    if (!formData.id) return false
    if (handleType.value !== 'detail' && handleType.value !== 'edit') return false
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
      handleTabCancel(from)
    }
    finishTabSwitchPrompt(true)
  }

  const onTabSwitchSaveAndLeave = async () => {
    const from = tabSwitchPending.value?.from
    if (!from) return
    tabSwitchSaving.value = true
    try {
      const ok = await handleTabSave(from, false)
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
    if (!shouldGuardSkuTabLeave(from)) return true
    return new Promise<boolean>((resolve) => {
      tabSwitchPending.value = { from, to: _to, resolve }
      tabSwitchConfirmVisible.value = true
    })
  }

  // Tab级别的保存/提交按钮
  const handleTabSave = async (tabName: string, submitFlag: boolean): Promise<boolean> => {
    if (!formData.id) {
      ElMessage.error('缺少产品ID')
      return false
    }

    const loadingKey = `${tabName}Save` as keyof typeof loadingStates
    if (loadingStates[loadingKey]) return false
    loadingStates[loadingKey] = true // 立即置位，防止连续点击导致重复请求、重复提示

    try {
      if (tabName === 'basic') {
        let basic: Record<string, any>
        if (basicInfoRef.value) {
          if ((handleType.value === 'detail' || handleType.value === 'edit') && topFormRef.value) {
            await topFormRef.value.validate()
          }
          await basicInfoRef.value.validate()
          basic = formData.basicInfo || {}
        } else {
          basic = formData.basicInfo || {}
        }
        console.log(`[formData.image]: `, formData.image)
        console.log(`[basic data for save]: `, basic)

        await updateProductSkuBasic({
          id: formData.id,
          sku: formData.sku,
          productChineseName: formData.chineseProductName,
          productEnglishName: formData.englishProductName,
          spu: spuName.value || '',
          spuId: formData.spuId,
          materialCode: formData.materialCode,
          picUrl:
            formData.image?.[0]?.rawUrl || formData.image?.[0]?.url || formData.image?.[0] || '',
          attachList: basic.attachments || formData.image || [],
          submitFlag, // 使用传入的submitFlag参数
          categoryId: basic.categoryId,
          categoryName: basic.categoryName,
          brandId: basic.brandId,
          brandName: basic.brandName,
          material: basic.material,
          purpose: basic.purpose,
          unit: basic.unit,
          specificationDescription: basic.specificationDescription ?? '',
          productRemark: basic.productRemark ?? '',
          productStatus: basic.productStatus,
          productDeveloperUserList: basic.productDeveloperUserList,
          productOwnerUserList: basic.productOwnerUserList,
          specUnitSystem: basic.specUnitSystem === 1 ? 1 : 0,
          productSizeUnit: basic.productSizeUnit,
          productLength: roundTo4(basic.productLength),
          productLengthInch: roundTo4(basic.productLengthInch),
          productWidth: roundTo4(basic.productWidth),
          productWidthInch: roundTo4(basic.productWidthInch),
          productHeight: roundTo4(basic.productHeight),
          productHeightInch: roundTo4(basic.productHeightInch),
          productNetWeightUnit: basic.productNetWeightUnit,
          productNetWeight: roundTo4(basic.productNetWeight),
          productNetWeightLb: roundTo4(basic.productNetWeightLb),
          productGrossWeightUnit: basic.productGrossWeightUnit,
          productGrossWeight: roundTo4(basic.productGrossWeight),
          productGrossWeightLb: roundTo4(basic.productGrossWeightLb),
          productPackageSizeUnit: basic.productPackageSizeUnit,
          productPackageLength: roundTo4(basic.productPackageLength),
          productPackageLengthInch: roundTo4(basic.productPackageLengthInch),
          productPackageWidth: roundTo4(basic.productPackageWidth),
          productPackageWidthInch: roundTo4(basic.productPackageWidthInch),
          productPackageHeight: roundTo4(basic.productPackageHeight),
          productPackageHeightInch: roundTo4(basic.productPackageHeightInch),
          boxSizeUnit: basic.boxSizeUnit,
          boxLength: roundTo4(basic.boxLength),
          boxLengthInch: roundTo4(basic.boxLengthInch),
          boxWidth: roundTo4(basic.boxWidth),
          boxWidthInch: roundTo4(basic.boxWidthInch),
          boxHeight: roundTo4(basic.boxHeight),
          boxHeightInch: roundTo4(basic.boxHeightInch),
          boxNetWeightUnit: basic.boxNetWeightUnit,
          boxNetWeight: roundTo4(basic.boxNetWeight),
          boxNetWeightLb: roundTo4(basic.boxNetWeightLb),
          boxGrossWeightUnit: basic.boxGrossWeightUnit,
          boxGrossWeight: roundTo4(basic.boxGrossWeight),
          boxGrossWeightLb: roundTo4(basic.boxGrossWeightLb),
          boxNum: basic.boxNum
        })
        operationLogRef.value?.reget?.()
        basicInfoEditState.value = false
        // 详情/编辑下通用信息与基础信息同组编辑，保存/提交成功后顶部一并退出编辑态
        if (handleType.value === 'detail' || handleType.value === 'edit') {
          topFormEditState.value = false
          initialTopFormData.value = {
            sku: formData.sku,
            chineseProductName: formData.chineseProductName,
            englishProductName: formData.englishProductName,
            spuId: formData.spuId,
            spuName: formData.spuName,
            materialCode: formData.materialCode,
            image: formData.image ? [...formData.image] : []
          }
        }
        initialBasicInfo.value = JSON.parse(JSON.stringify(basic))
        ElMessage.success(submitFlag ? '提交成功' : '暂存成功')
        // 注意：编辑模式下保存不关闭弹窗，不触发submit事件，避免重复提示
      } else if (tabName === 'purchase') {
        let purchase: Record<string, any>
        if (purchaseInfoRef.value) {
          await purchaseInfoRef.value.validate()
          purchase = purchaseInfoRef.value.formData || {}
        } else {
          purchase = formData.purchaseInfo || {}
        }

        // 检查采购信息是否有实际数据（忽略currency默认值）
        const hasReferenceCost =
          purchase.referenceCost !== null &&
          purchase.referenceCost !== undefined &&
          purchase.referenceCost !== ''
        const hasReferenceDeliveryDays =
          purchase.referenceDeliveryDays !== null &&
          purchase.referenceDeliveryDays !== undefined &&
          purchase.referenceDeliveryDays !== ''
        const hasPurchaseUserList =
          Array.isArray(purchase.purchaseUserList) && purchase.purchaseUserList.length > 0
        const hasPurchaseRemark =
          purchase.purchaseRemark !== null &&
          purchase.purchaseRemark !== undefined &&
          purchase.purchaseRemark !== ''
        const hasSplitNum =
          purchase.splitNum !== null && purchase.splitNum !== undefined && purchase.splitNum !== ''
        /** 未选供应商的空行不提交后端（避免暂存时报错），也不计入「是否有报价」 */
        const filledSupplierQuotes = (purchase.supplierQuotes || []).filter(
          (item: any) => item.supplierId != null && item.supplierId !== ''
        )
        const hasSupplierQuotes = filledSupplierQuotes.length > 0

        if (
          !hasReferenceCost &&
          !hasReferenceDeliveryDays &&
          !hasPurchaseUserList &&
          !hasPurchaseRemark &&
          !hasSplitNum &&
          !hasSupplierQuotes
        ) {
          ElMessage.warning('请至少填写一项采购信息')
          return false
        }

        const initialList = initialPurchaseInfo.value?.supplierQuotationList || []
        const currentList = filledSupplierQuotes.map((item: any) => {
          const taxNum = Number(item.taxInclusivePrice ?? 0)
          return {
            ...item,
            taxInclusivePrice: Number.isFinite(taxNum) ? Number(taxNum.toFixed(4)) : null
          }
        })

        const addList = currentList.filter((item: any) => !item.id)
        const editList = currentList.filter(
          (item: any) => item.id && initialList.some((init: any) => init.id === item.id)
        )
        const deleteList = initialList
          .filter((init: any) => !currentList.some((curr: any) => curr.id === init.id))
          .map((item: any) => item.id)

        const purchaseObj = {
          productId: formData.id,
          sku: formData.sku,
          skuPurchaseBasic: {
            id: purchase.id,
            productId: formData.id,
            currency: purchase.currency ?? purchase.purchaseReferencePriceCurrency ?? null,
            referenceCost: purchase.referenceCost,
            referenceDeliveryDays: purchase.referenceDeliveryDays,
            purchaseUserList: purchase.purchaseUserList,
            purchaseRemark: purchase.purchaseRemark,
            splitNum: purchase.splitNum,
            skuSupplierQuotationList: currentList
          },
          addSupplierQuotationList: addList,
          editSupplierQuotationList: editList,
          deleteSupplierQuotationList: deleteList,
          submitFlag,
          // 非编辑状态下提交传 outerFlag: true，编辑状态下提交传 outerFlag: false
          outerFlag: !purchaseInfoEditState.value
        }

        await updatePurchaseBasic(purchaseObj)
        operationLogRef.value?.reget?.()
        ElMessage.success(submitFlag ? '提交成功' : '暂存成功')
        purchaseInfoEditState.value = false

        // 更新 formData.purchaseInfo 和 initialPurchaseInfo，包含名称字段以便回显
        // 生成采购负责人名称字符串
        const purchaseUsers =
          purchase.purchaseUserList
            ?.map((userId: string | number) => {
              const user = props.userOptions.find((u: any) => u.value === userId)
              return user?.label || userId
            })
            ?.join('、') || ''

        const updatedPurchaseInfo = {
          ...purchase,
          supplierQuotes: currentList,
          supplierQuotationList: currentList,
          purchaseUsers,
          purchaseOwnerUsers: purchase.purchaseUserList
            ? JSON.stringify(purchase.purchaseUserList)
            : null
        }
        formData.purchaseInfo = { ...updatedPurchaseInfo }
        initialPurchaseInfo.value = JSON.parse(JSON.stringify(updatedPurchaseInfo))
      } else if (tabName === 'logistics') {
        let logistics: Record<string, any>
        if (logisticsInfoRef.value) {
          await logisticsInfoRef.value.validate()
          logistics = logisticsInfoRef.value.localData || {}
        } else {
          logistics = formData.logisticsInfo || {}
        }

        // 检查物流信息是否有实际数据
        const logisticsFieldsToCheck = [
          'logisticsUserList',
          'isTaxIncluded',
          'customsHsCode',
          'customsName',
          'englishCustomsName',
          'customsMaterial',
          'customsModel',
          'customsUnit',
          'customsPrice',
          'customsPriceCurrency',
          'customsUsage',
          'originCountry',
          'domesticCity',
          'exemptionTax',
          'outletBenefits',
          'customsClearanceCode',
          'customsClearModel',
          'customsClearPrice',
          'customsClearPriceCurrency',
          'customsClearTaxRate',
          'otherDeclarationElements',
          'customsDeclarationMethod',
          'productAttr',
          'brandType',
          'logisticsResponsiblePersons'
        ]
        let hasLogisticsData = false
        for (const field of logisticsFieldsToCheck) {
          const val = logistics[field]
          if (Array.isArray(val)) {
            if (val.length > 0) {
              hasLogisticsData = true
              break
            }
          } else if (val !== null && val !== undefined && val !== '') {
            hasLogisticsData = true
            break
          }
        }
        if (!hasLogisticsData) {
          ElMessage.warning('请至少填写一项物流信息')
          return false
        }

        const logisticsInfo = {
          productId: formData.id,
          sku: formData.sku,
          productLogisticsInfoDto: {
            id: logistics.id,
            productId: formData.id,
            logisticsUserList: logistics.logisticsUserList,
            isTaxIncluded: normalizeBinarySelectValue(logistics.isTaxIncluded),
            customsDeclarationMethod: normalizeNullableNumber(logistics.customsDeclarationMethod),
            // logisticsResponsiblePersons: JSON.stringify(logisticsResponsiblePersons),
            customsHsCode: logistics.customsHsCode,
            customsName: logistics.customsName,
            englishCustomsName: logistics.englishCustomsName,
            customsMaterial: logistics.customsMaterial,
            customsModel: logistics.customsModel,
            customsUnit: logistics.customsUnit,
            customsPrice: logistics.customsPrice,
            customsPriceCurrency: logistics.customsPriceCurrency,
            customsUsage: logistics.customsUsage,
            originCountry: logistics.originCountry,
            domesticCity: logistics.domesticCity,
            exemptionTax: logistics.exemptionTax,
            outletBenefits: logistics.outletBenefits,
            customsClearanceCode: logistics.customsClearanceCode,
            customsClearModel: logistics.customsClearModel,
            customsClearPrice: logistics.customsClearPrice,
            customsClearPriceCurrency: logistics.customsClearPriceCurrency,
            customsClearTaxRate: logistics.customsClearTaxRate,
            otherDeclarationElements: logistics.otherDeclarationElements,
            productAttr: logistics.cargoAttributes?.join(','),
            brandType: logistics.brandType
          },
          submitFlag
        }

        await updateLogisticsInfo(logisticsInfo)
        operationLogRef.value?.reget?.()
        ElMessage.success(submitFlag ? '提交成功' : '暂存成功')
        logisticsInfoEditState.value = false

        // 更新 formData.logisticsInfo 和 initialLogisticsInfo，包含名称字段以便回显
        // 生成物流负责人名称字符串
        const logisticsUser =
          logistics.logisticsUserList
            ?.map((userId: string | number) => {
              const user = props.userOptions.find((u: any) => u.value === userId)
              return user?.label || userId
            })
            ?.join('、') || ''

        const updatedLogisticsInfo = {
          ...logistics,
          logisticsUser,
          logisticsOwnerUsers: logistics.logisticsUserList
            ? JSON.stringify(logistics.logisticsUserList)
            : null
        }
        formData.logisticsInfo = { ...updatedLogisticsInfo }
        initialLogisticsInfo.value = JSON.parse(JSON.stringify(updatedLogisticsInfo))
      } else if (tabName === 'finance') {
        let finance: Record<string, any>
        if (financeInfoRef.value) {
          await financeInfoRef.value.validate()
          finance = financeInfoRef.value.localData || {}
        } else {
          finance = formData.financeInfo || {}
        }

        // 检查财务信息是否有实际数据
        const hasFinanceUserList =
          Array.isArray(finance.financeUserList) && finance.financeUserList.length > 0
        const hasSaleOrganizationId =
          finance.saleOrganizationId !== null &&
          finance.saleOrganizationId !== undefined &&
          finance.saleOrganizationId !== ''
        const hasPurchaseOrganizationId =
          finance.purchaseOrganizationId !== null &&
          finance.purchaseOrganizationId !== undefined &&
          finance.purchaseOrganizationId !== ''
        const hasCustomsOrganizationId =
          finance.customsOrganizationId !== null &&
          finance.customsOrganizationId !== undefined &&
          finance.customsOrganizationId !== ''

        if (
          !hasFinanceUserList &&
          !hasSaleOrganizationId &&
          !hasPurchaseOrganizationId &&
          !hasCustomsOrganizationId
        ) {
          ElMessage.warning('请至少填写一项财务信息')
          return false
        }

        // 清空时显式传 null，避免 JSON 省略 undefined 导致后端保留旧值
        const emptyIfNil = (v: any) => (v === null || v === undefined || v === '' ? null : v)
        const purchaseId = emptyIfNil(finance.purchaseOrganizationId)
        const customsId = emptyIfNil(finance.customsOrganizationId)
        const saleId = emptyIfNil(finance.saleOrganizationId)
        const purchaseOrganizationName =
          purchaseId != null
            ? (companyAll.value.find((item) => item.id == purchaseId)?.name ?? null)
            : null
        const customsOrganizationName =
          customsId != null
            ? (companyAll.value.find((item) => item.id == customsId)?.name ?? null)
            : null
        const saleOrganizationName =
          saleId != null ? (companyAll.value.find((item) => item.id == saleId)?.name ?? null) : null
        const financeUserList = Array.isArray(finance.financeUserList)
          ? finance.financeUserList
          : []
        const financeInfo = {
          productId: formData.id,
          sku: formData.sku,
          productFinanceInfoDto: {
            id: finance.id,
            productId: formData.id,
            financeUserList,
            saleOrganizationId: saleId,
            saleOrganizationName,
            purchaseOrganizationId: purchaseId,
            purchaseOrganizationName,
            customsOrganizationId: customsId,
            customsOrganizationName
          },
          submitFlag
        }
        await updateFinanceInfo(financeInfo)
        operationLogRef.value?.reget?.()
        ElMessage.success(submitFlag ? '提交成功' : '暂存成功')
        financeInfoEditState.value = false

        // 更新 formData.financeInfo 和 initialFinanceInfo，包含名称字段以便回显
        const financeUsers =
          financeUserList
            .map((userId: string | number) => {
              const user = props.userOptions.find((u: any) => u.value === userId)
              return user?.label || userId
            })
            .join('、') || ''

        const updatedFinanceInfo = {
          ...finance,
          purchaseOrganizationId: purchaseId,
          purchaseOrganizationName,
          customsOrganizationId: customsId,
          customsOrganizationName,
          saleOrganizationId: saleId,
          saleOrganizationName,
          financeUserList,
          financeUsers,
          financeOwnerUsers: financeUserList.length > 0 ? JSON.stringify(financeUserList) : null
        }
        formData.financeInfo = { ...updatedFinanceInfo }
        initialFinanceInfo.value = JSON.parse(JSON.stringify(updatedFinanceInfo))
      } else if (tabName === 'sales' && salesSkuInfoRef.value) {
        await salesSkuInfoRef.value.validate()
        const salesSku = salesSkuInfoRef.value.localData || {}
        const salesSkuList = salesSku.salesSkuList || []

        // 检查是否有数据，如果为空则不允许提交或暂存
        if (salesSkuList.length === 0) {
          ElMessage.warning('请至少添加一条关联销售SKU数据')
          return false
        }

        const listingRelationDT = {
          associateLocalSkuDto: {
            submitFlag: submitFlag ? true : false,
            localSkuId: formData.id,
            productIdentifiers: salesSkuList
          }
        }
        // const initialList = initialSalesSkuInfo.value?.salesSkuList || []
        // const currentList = salesSku.salesSkuList || []

        // // 使用公共方法比较数据变化
        // const { addList, editList, deleteList } = compareDataChanges(initialList, currentList)
        // const listingRelationDT = {
        //   productId: formData.id,
        //   sku: formData.sku,
        //   addListingRelationList: addList,
        //   editListingRelationList: editList,
        //   deleteListingRelationList: deleteList,
        //   submitFlag
        // }

        // console.log(`[API Request Data]: `, listingRelationDT)
        await updateListingRelation(listingRelationDT)
        approvalStatus.sales = submitFlag ? 1 : 0
        operationLogRef.value?.reget?.()
        ElMessage.success(submitFlag ? '提交成功' : '暂存成功')

        // 重新加载销售SKU数据以获取最新的ID和数据
        // const listingRelationRes: any = await getSkuListingRelation(formData.id)
        // if (listingRelationRes.data) {
        //   // 获取实际的列表数据
        //   const salesSkuList = listingRelationRes.data.dtoList || []
        //   formData.salesSkuInfo = {
        //     salesSkuList
        //   }
        // } else {
        //   // 如果没有数据，确保数据结构正确
        //   formData.salesSkuInfo = {
        //     salesSkuList: []
        //   }
        // }

        // 重置编辑状态和初始值
        salesSkuInfoEditState.value = false
        initialSalesSkuInfo.value = JSON.parse(JSON.stringify(formData.salesSkuInfo || {}))
      } else if (tabName === 'image') {
        let image: Record<string, any>
        if (imageInfoRef.value) {
          await imageInfoRef.value.validate()
          image = imageInfoRef.value.formData || {}
        } else {
          image = formData.imageInfo || {}
        }

        const initialList = initialImageInfo.value?.picList || []
        const currentList = image.picList || []

        // 检查是否有数据，如果为空则不允许提交或暂存
        if (currentList.length === 0) {
          ElMessage.warning('请至少上传一张图片')
          return false
        }

        const addList = currentList
          .filter((item: any) => !item.id)
          .map((item: any) => ({
            picsUrl: item.rawUrl || item.url,
            approveStatus: item.approveStatus || 0,
            productId: formData.id,
            feishuFileCode: item.feishuFileCode || null
          }))

        const editList = currentList
          .filter((item: any) => item.id && initialList.some((init: any) => init.id === item.id))
          .map((item: any) => ({
            id: item.id,
            picsUrl: item.rawUrl || item.url,
            approveStatus: item.approveStatus || 0,
            productId: formData.id,
            feishuFileCode: item.feishuFileCode || null
          }))

        const deleteList = initialList
          .filter((init: any) => !currentList.some((curr: any) => curr.id === init.id))
          .map((item: any) => item.id)

        const picListObj = {
          productId: formData.id,
          addPicDtoList: addList,
          editPicDtoList: editList,
          deletePicDtoList: deleteList,
          submitFlag
        }

        await updatePicList(picListObj)
        operationLogRef.value?.reget?.()
        ElMessage.success(submitFlag ? '提交成功' : '暂存成功')

        // 重新加载图片数据以获取最新的ID和数据
        const picListRes: any = await getSkuPicList(formData.id)
        if (picListRes.data) {
          formData.imageInfo = {
            picList: picListRes.data.map((item: any) => ({
              id: item.id,
              picsUrl: item.picsUrl,
              approveStatus: item.approveStatus
            }))
          }
        }

        // 重置编辑状态和初始值
        imageInfoEditState.value = false
        initialImageInfo.value = JSON.parse(JSON.stringify(formData.imageInfo || {}))
      } else if (tabName === 'compliance') {
        let compliance: Record<string, any>
        if (complianceInfoRef.value) {
          await complianceInfoRef.value.validate()
          compliance = complianceInfoRef.value.formData || {}
        } else {
          compliance = formData.complianceInfo || {}
        }

        const initialList = initialComplianceInfo.value?.certificationList || []
        const currentList = compliance.certificationList || []

        // 检查是否有数据，如果为空则不允许提交或暂存
        if (currentList.length === 0) {
          ElMessage.warning('请至少添加一条合规认证数据')
          return false
        }

        const addList = currentList
          .filter((item: any) => !item.id)
          .map((item: any) => ({
            certificationType: item.certificationType || '',
            certificationAgency: item.certificationAgency || '',
            country: serializeComplianceCountryForApi(item.country),
            applicantCompany: item.applicantCompany || '',
            testDate: item.testDate || '',
            issueDate: item.issueDate || '',
            certificateNumber: item.certificateNumber || '',
            attachment: item.attachment || '',
            productId: formData.id
          }))

        const editList = currentList
          .filter((item: any) => item.id && initialList.some((init: any) => init.id === item.id))
          .map((item: any) => ({
            id: item.id,
            certificationType: item.certificationType || '',
            certificationAgency: item.certificationAgency || '',
            country: serializeComplianceCountryForApi(item.country),
            applicantCompany: item.applicantCompany || '',
            testDate: item.testDate || '',
            issueDate: item.issueDate || '',
            certificateNumber: item.certificateNumber || '',
            attachment: item.attachment || '',
            productId: formData.id
          }))

        const deleteList = initialList
          .filter((init: any) => !currentList.some((curr: any) => curr.id === init.id))
          .map((item: any) => item.id)

        await updateCertificationList({
          productId: formData.id,
          addCertificationDtoList: addList,
          editCertificationDtoList: editList,
          deleteCertificationDtoList: deleteList,
          submitFlag
        })
        operationLogRef.value?.reget?.()
        ElMessage.success(submitFlag ? '提交成功' : '暂存成功')

        // 重新加载合规认证数据以获取最新的ID和数据
        const certificationListRes: any = await getSkuCertificationList(formData.id)
        if (certificationListRes.data) {
          formData.complianceInfo = {
            certificationList: certificationListRes.data.map((item: any) => ({
              id: item.id,
              certificationType: item.certificationType,
              certificationAgency: item.certificationAgency,
              country: item.country,
              applicantCompany: item.applicantCompany,
              testDate: item.testDate,
              issueDate: item.issueDate,
              certificateNumber: item.certificateNumber,
              attachment: item.attachment
            }))
          }
        }

        // 重置编辑状态和初始值
        complianceInfoEditState.value = false
        initialComplianceInfo.value = JSON.parse(JSON.stringify(formData.complianceInfo || {}))
      }

      // 成功后重新加载数据（提交或暂存后后端会更新审批状态，暂存后应回退为草稿，需刷新以展示最新状态）
      if (formData.id) {
        await loadSkuData(formData.id)
      }
      // 注意：编辑模式下保存不关闭弹窗，不触发submit事件，避免重复提示
      return true
    } catch (error: any) {
      console.log(submitFlag ? '提交失败' : '暂存失败', error)
      if (!shouldShowError(error)) {
        // 已由 HTTP 层展示，避免重复弹窗
        return false
      }
      if (error.errors) {
        ElMessage.error('请完善必填信息')
      } else if (!isHttpError(error)) {
        ElMessage.error(error.message || (submitFlag ? '提交失败' : '暂存失败'))
      }
      return false
    } finally {
      loadingStates[loadingKey] = false
    }
  }

  // 暂存草稿
  const handleSaveDraft = async () => {
    if (!topFormRef.value) return
    if (loadingStates.saveDraft || submitting.value) return // 防止重复提交

    loadingStates.saveDraft = true
    submitting.value = true
    try {
      // 顶部表单必填验证
      await topFormRef.value.validate()

      // 构建请求参数
      const requestData = buildRequestData(false)

      // 调用API保存草稿（成功提示由父组件 handleAddSkuSubmit 统一提示「操作成功」）
      await addSku(requestData)
      emit('submit', formData)
      doClose() // 暂存成功后直接关闭，不弹确认提示
    } catch (error: any) {
      console.log('暂存失败', error)
      if (shouldShowError(error)) {
        if (error.errors) {
          ElMessage.error('请完善必填信息')
        } else if (!isHttpError(error)) {
          ElMessage.error(error.message || '暂存失败')
        }
      }
    } finally {
      loadingStates.saveDraft = false
      submitting.value = false
    }
  }

  // 提交
  const handleSubmit = async () => {
    if (!topFormRef.value) return
    if (loadingStates.submit || submitting.value) return // 防止重复提交

    loadingStates.submit = true
    submitting.value = true
    try {
      // 验证所有表单
      await topFormRef.value.validate()

      if (basicInfoRef.value) {
        await basicInfoRef.value.validate()
      }
      if (purchaseInfoRef.value) {
        await purchaseInfoRef.value.validate()
      }
      if (logisticsInfoRef.value) {
        await logisticsInfoRef.value.validate()
      }
      if (financeInfoRef.value) {
        await financeInfoRef.value.validate()
      }
      if (salesSkuInfoRef.value) {
        await salesSkuInfoRef.value.validate()
      }
      if (imageInfoRef.value) {
        await imageInfoRef.value.validate()
      }
      if (complianceInfoRef.value) {
        await complianceInfoRef.value.validate()
      }

      // 构建请求参数
      const requestData = buildRequestData(true)

      // 调用API提交数据（成功提示由父组件 handleAddSkuSubmit 统一提示「操作成功」）
      await addSku(requestData)
      emit('submit', formData)
      doClose() // 提交成功后直接关闭，不弹确认提示
    } catch (error: any) {
      console.log('表单验证失败', error)
      if (shouldShowError(error)) {
        if (error.errors) {
          ElMessage.error('请完善必填信息')
        } else if (!isHttpError(error)) {
          ElMessage.error(error.message || '提交失败')
        }
      }
    } finally {
      loadingStates.submit = false
      submitting.value = false
    }
  }

  // 构建API请求数据
  const buildRequestData = (submitFlag: boolean) => {
    // 获取各个tab的数据
    // BasicInfo 组件通过 v-model 将扁平化数据 emit 到 formData.basicInfo
    // 但在新增模式下，formData.basicInfo 可能还未更新，所以优先使用 ref 的 formData（需要从嵌套结构获取），否则使用 formData.basicInfo
    const basicRefData = basicInfoRef.value?.formData || {}
    const basicFlatData = formData.basicInfo || {}
    // 合并数据：优先使用扁平化数据，如果不存在则从嵌套结构中获取
    const basic = {
      ...basicRefData,
      ...basicFlatData,
      // 规格单位制：0-公制，1-英制
      specUnitSystem: basicFlatData.specUnitSystem ?? basicRefData.specUnitSystem ?? 0,
      // 如果扁平化数据中没有，则从嵌套结构中获取
      productLength:
        basicFlatData.productLength ?? basicRefData.specs?.metric?.productLength ?? null,
      productLengthInch:
        basicFlatData.productLengthInch ?? basicRefData.specs?.imperial?.productLengthInch ?? null,
      productWidth: basicFlatData.productWidth ?? basicRefData.specs?.metric?.productWidth ?? null,
      productWidthInch:
        basicFlatData.productWidthInch ?? basicRefData.specs?.imperial?.productWidthInch ?? null,
      productHeight:
        basicFlatData.productHeight ?? basicRefData.specs?.metric?.productHeight ?? null,
      productHeightInch:
        basicFlatData.productHeightInch ?? basicRefData.specs?.imperial?.productHeightInch ?? null,
      productNetWeight:
        basicFlatData.productNetWeight ?? basicRefData.specs?.metric?.productNetWeight ?? null,
      productNetWeightLb:
        basicFlatData.productNetWeightLb ??
        basicRefData.specs?.imperial?.productNetWeightLb ??
        null,
      productGrossWeight:
        basicFlatData.productGrossWeight ?? basicRefData.specs?.metric?.productGrossWeight ?? null,
      productGrossWeightLb:
        basicFlatData.productGrossWeightLb ??
        basicRefData.specs?.imperial?.productGrossWeightLb ??
        null,
      productPackageLength:
        basicFlatData.productPackageLength ??
        basicRefData.specs?.metric?.productPackageLength ??
        null,
      productPackageLengthInch:
        basicFlatData.productPackageLengthInch ??
        basicRefData.specs?.imperial?.productPackageLengthInch ??
        null,
      productPackageWidth:
        basicFlatData.productPackageWidth ??
        basicRefData.specs?.metric?.productPackageWidth ??
        null,
      productPackageWidthInch:
        basicFlatData.productPackageWidthInch ??
        basicRefData.specs?.imperial?.productPackageWidthInch ??
        null,
      productPackageHeight:
        basicFlatData.productPackageHeight ??
        basicRefData.specs?.metric?.productPackageHeight ??
        null,
      productPackageHeightInch:
        basicFlatData.productPackageHeightInch ??
        basicRefData.specs?.imperial?.productPackageHeightInch ??
        null,
      boxLength: basicFlatData.boxLength ?? basicRefData.specs?.metric?.boxLength ?? null,
      boxLengthInch:
        basicFlatData.boxLengthInch ?? basicRefData.specs?.imperial?.boxLengthInch ?? null,
      boxWidth: basicFlatData.boxWidth ?? basicRefData.specs?.metric?.boxWidth ?? null,
      boxWidthInch:
        basicFlatData.boxWidthInch ?? basicRefData.specs?.imperial?.boxWidthInch ?? null,
      boxHeight: basicFlatData.boxHeight ?? basicRefData.specs?.metric?.boxHeight ?? null,
      boxHeightInch:
        basicFlatData.boxHeightInch ?? basicRefData.specs?.imperial?.boxHeightInch ?? null,
      boxNetWeight: basicFlatData.boxNetWeight ?? basicRefData.specs?.metric?.boxNetWeight ?? null,
      boxNetWeightLb:
        basicFlatData.boxNetWeightLb ?? basicRefData.specs?.imperial?.boxNetWeightLb ?? null,
      boxGrossWeight:
        basicFlatData.boxGrossWeight ?? basicRefData.specs?.metric?.boxGrossWeight ?? null,
      boxGrossWeightLb:
        basicFlatData.boxGrossWeightLb ?? basicRefData.specs?.imperial?.boxGrossWeightLb ?? null,
      boxNum:
        basicFlatData.boxNum ??
        basicRefData.specs?.metric?.boxNum ??
        basicRefData.specs?.imperial?.boxNum ??
        null,
      // 单位字段
      productNetWeightUnit:
        basicFlatData.productNetWeightUnit ||
        basicRefData.weightUnits?.productNetWeightUnit ||
        null,
      productGrossWeightUnit:
        basicFlatData.productGrossWeightUnit ||
        basicRefData.weightUnits?.productGrossWeightUnit ||
        null,
      boxNetWeightUnit:
        basicFlatData.boxNetWeightUnit || basicRefData.weightUnits?.boxNetWeightUnit || null,
      boxGrossWeightUnit:
        basicFlatData.boxGrossWeightUnit || basicRefData.weightUnits?.boxGrossWeightUnit || null
    }
    const purchase = purchaseInfoRef.value?.formData || {}
    // LogisticsInfo 和 FinanceInfo 组件暴露的是 localData，不是 formData
    const logistics = logisticsInfoRef.value?.localData || {}
    const finance = financeInfoRef.value?.localData || {}
    // SalesSkuInfo 组件暴露的是 localData，提交时优先从 ref 取最新，否则用 formData.salesSkuInfo（v-model 同步的），确保关联销售SKU tab 数据会随提交带到后端
    const salesSku = salesSkuInfoRef.value?.localData ||
      formData.salesSkuInfo || { salesSkuList: [] }
    const image = imageInfoRef.value?.formData || {}
    const compliance = complianceInfoRef.value?.formData || {}

    // 复制模式下不传任何 ID，按新建逻辑提交
    const isCopyMode = handleType.value === 'copy'
    const effectiveSkuId = isCopyMode ? null : formData.id || null

    // 构建SKU基础信息
    const skuBasic = {
      id: effectiveSkuId,
      sku: formData.sku,
      productChineseName: formData.chineseProductName,
      productEnglishName: formData.englishProductName,
      spu: spuName.value || formData.spuName || null,
      spuId: formData.spuId || null,
      materialCode: formData.materialCode,
      picUrl:
        formData.image?.[0]?.rawUrl || formData.image?.[0]?.url || formData.image?.[0] || null,
      attachList: basic.attachments || formData.image || [],
      submitFlag: submitFlag,
      // 基础信息tab数据
      categoryId: basic.categoryId || null,
      categoryName: basic.categoryName || null,
      brandId: basic.brandId || null,
      brandName: basic.brandName || null,
      material: basic.material || null,
      purpose: basic.purpose || null,
      unit: basic.unit || null,
      specificationDescription: basic.specificationDescription ?? null,
      productRemark: basic.productRemark ?? null,
      productStatus: basic.productStatus ?? null,
      productDeveloperUserList: basic.productDeveloperUserList || [],
      productOwnerUserList: basic.productOwnerUserList || [],
      specUnitSystem: basic.specUnitSystem === 1 ? 1 : 0,
      // 规格尺寸数据 - 使用合并后的 basic 对象，数值统一保留4位小数
      productSizeUnit:
        basic.productSizeUnit ||
        (basic.productLength != null || basic.productWidth != null || basic.productHeight != null
          ? 'cm'
          : null) ||
        (basic.productLengthInch != null ||
        basic.productWidthInch != null ||
        basic.productHeightInch != null
          ? 'inch'
          : null),
      productLength: roundTo4(basic.productLength) ?? null,
      productLengthInch: roundTo4(basic.productLengthInch) ?? null,
      productWidth: roundTo4(basic.productWidth) ?? null,
      productWidthInch: roundTo4(basic.productWidthInch) ?? null,
      productHeight: roundTo4(basic.productHeight) ?? null,
      productHeightInch: roundTo4(basic.productHeightInch) ?? null,
      productNetWeightUnit: basic.productNetWeightUnit || null,
      productNetWeight: roundTo4(basic.productNetWeight) ?? null,
      productNetWeightLb: roundTo4(basic.productNetWeightLb) ?? null,
      productGrossWeightUnit: basic.productGrossWeightUnit || null,
      productGrossWeight: roundTo4(basic.productGrossWeight) ?? null,
      productGrossWeightLb: roundTo4(basic.productGrossWeightLb) ?? null,
      // 包装尺寸
      productPackageSizeUnit:
        basic.productPackageSizeUnit ||
        (basic.productPackageLength != null ||
        basic.productPackageWidth != null ||
        basic.productPackageHeight != null
          ? 'cm'
          : null) ||
        (basic.productPackageLengthInch != null ||
        basic.productPackageWidthInch != null ||
        basic.productPackageHeightInch != null
          ? 'inch'
          : null),
      productPackageLength: roundTo4(basic.productPackageLength) ?? null,
      productPackageLengthInch: roundTo4(basic.productPackageLengthInch) ?? null,
      productPackageWidth: roundTo4(basic.productPackageWidth) ?? null,
      productPackageWidthInch: roundTo4(basic.productPackageWidthInch) ?? null,
      productPackageHeight: roundTo4(basic.productPackageHeight) ?? null,
      productPackageHeightInch: roundTo4(basic.productPackageHeightInch) ?? null,
      // 箱规
      boxSizeUnit:
        basic.boxSizeUnit ||
        (basic.boxLength != null || basic.boxWidth != null || basic.boxHeight != null
          ? 'cm'
          : null) ||
        (basic.boxLengthInch != null || basic.boxWidthInch != null || basic.boxHeightInch != null
          ? 'inch'
          : null),
      boxLength: roundTo4(basic.boxLength) ?? null,
      boxLengthInch: roundTo4(basic.boxLengthInch) ?? null,
      boxWidth: roundTo4(basic.boxWidth) ?? null,
      boxWidthInch: roundTo4(basic.boxWidthInch) ?? null,
      boxHeight: roundTo4(basic.boxHeight) ?? null,
      boxHeightInch: roundTo4(basic.boxHeightInch) ?? null,
      boxNetWeightUnit: basic.boxNetWeightUnit || null,
      boxNetWeight: roundTo4(basic.boxNetWeight) ?? null,
      boxNetWeightLb: roundTo4(basic.boxNetWeightLb) ?? null,
      boxGrossWeightUnit: basic.boxGrossWeightUnit || null,
      boxGrossWeight: roundTo4(basic.boxGrossWeight) ?? null,
      boxGrossWeightLb: roundTo4(basic.boxGrossWeightLb) ?? null,
      boxNum: basic.boxNum ?? null
    }

    // 构建采购基本信息
    const skuPurchaseBasic = {
      id: isCopyMode ? null : purchase.id || null,
      productId: effectiveSkuId,
      currency: purchase.currency || null,
      referenceCost: purchase.referenceCost || null,
      referenceDeliveryDays: purchase.referenceDeliveryDays || null,
      purchaseUserList: purchase.purchaseUserList || [],
      purchaseRemark: purchase.purchaseRemark || null,
      splitNum: purchase.splitNum || null,
      skuSupplierQuotationList: (purchase.supplierQuotes || [])
        .filter((q: any) => q.supplierId != null && q.supplierId !== '')
        .map((q: any) => {
          if (!isCopyMode) return q
          const rest = { ...(q || {}) }
          delete rest.id
          return rest
        })
    }

    // 构建物流信息
    const skuLogisticsInfo = {
      id: isCopyMode ? null : logistics.id || null,
      productId: effectiveSkuId,
      logisticsUserList: logistics.logisticsUserList || [],
      isTaxIncluded: normalizeBinarySelectValue(logistics.isTaxIncluded),
      customsHsCode: logistics.customsHsCode || null,
      customsName: logistics.customsName || null,
      englishCustomsName: logistics.englishCustomsName || null,
      customsMaterial: logistics.customsMaterial || null,
      customsModel: logistics.customsModel || null,
      customsUnit: logistics.customsUnit || null,
      customsPrice: logistics.customsPrice || null,
      customsPriceCurrency: logistics.customsPriceCurrency || null,
      customsUsage: logistics.customsUsage || null,
      originCountry: logistics.originCountry || null,
      domesticCity: logistics.domesticCity || null,
      exemptionTax: logistics.exemptionTax || null,
      outletBenefits: logistics.outletBenefits || null,
      customsClearanceCode: logistics.customsClearanceCode || null,
      customsClearModel: logistics.customsClearModel || null,
      customsClearPrice: logistics.customsClearPrice || null,
      customsClearPriceCurrency: logistics.customsClearPriceCurrency || null,
      customsClearTaxRate: logistics.customsClearTaxRate || null,
      customsDeclarationMethod: normalizeNullableNumber(logistics.customsDeclarationMethod),
      otherDeclarationElements: logistics.otherDeclarationElements || null,
      productAttr: logistics.cargoAttributes?.join(',') || null,
      brandType: logistics.brandType || null
    }

    // 构建财务信息
    // let financeUserList = [];
    // try {
    //   financeUserList = JSON.parse(finance.financeOwnerUsers)
    // }catch{
    //   financeUserList = [];
    // }
    // 财务主体与负责人：清空时显式传 null/[]，避免后端保留旧值
    const toNull = (v: any) => (v === null || v === undefined || v === '' ? null : v)
    const fPurchaseId = toNull(finance.purchaseOrganizationId)
    const fCustomsId = toNull(finance.customsOrganizationId)
    const fSaleId = toNull(finance.saleOrganizationId)
    const fUserList = Array.isArray(finance.financeUserList) ? finance.financeUserList : []
    const skuFinanceInfo = {
      id: isCopyMode ? null : finance.id || null,
      productId: effectiveSkuId,
      financeUserList: fUserList,
      saleOrganizationId: fSaleId,
      saleOrganizationName: fSaleId != null ? (finance.saleOrganizationName ?? null) : null,
      purchaseOrganizationId: fPurchaseId,
      purchaseOrganizationName:
        fPurchaseId != null ? (finance.purchaseOrganizationName ?? null) : null,
      customsOrganizationId: fCustomsId,
      customsOrganizationName: fCustomsId != null ? (finance.customsOrganizationName ?? null) : null
    }

    // 构建关联销售SKU列表（salesSku 已含 localData 或 formData.salesSkuInfo 回退，保证有关联销售SKU tab 数据）
    const salesSkuList = Array.isArray(salesSku.salesSkuList) ? salesSku.salesSkuList : []
    const associateLocalSkuDto = {
      approvalStatus: submitFlag ? 1 : 0,
      localSkuId: null,
      productIdentifiers: salesSkuList.map((v: any) => ({
        asin: v.asin,
        msku: v.msku,
        productType: v.productType,
        region: v.region,
        sellerId: v.sellerId ?? v.accountId,
        sellerSku: v.sellerSku ?? v.salesSku,
        ssku: v.ssku
      }))
    }
    // console.log('[buildRequestData] salesSku data:', {
    //   salesSku,
    //   salesSkuList,
    //   fromLocalData: salesSkuInfoRef.value?.localData,
    //   fromFormData: formData.salesSkuInfo
    // })
    // const skuListingRelationList = salesSkuList.map((item: any) => ({
    //   productId: formData.id || null,
    //   platform: item.platform || '',
    //   accountId: item.accountId || null,
    //   accountName: item.accountName || '',
    //   listingId: item.listingId || null,
    //   msku: item.msku || item.salesSku || '',
    //   asin: item.asin || '',
    //   marketplace: item.marketplace || '',
    //   country: item.country || '',
    //   sellingEntity: Array.isArray(item.sellingEntity)
    //     ? JSON.stringify(item.sellingEntity)
    //     : item.sellingEntity || '',
    //   listingRelationUserList: Array.isArray(item.listingRelationUserList)
    //     ? item.listingRelationUserList.filter((id: any) => id !== null && id !== undefined)
    //     : []
    // }))
    console.log('[buildRequestData] skuListingRelationList:', salesSkuList)

    // 构建图片信息列表
    // 提交时优先用 rawUrl（OSS 地址），避免 url 为 blob 或过期签名时无法保存；复制模式下不传 id
    const skuPicList = (image.picList || []).map((item: any) => {
      const picsUrl = item?.rawUrl || item?.url || item?.picsUrl || ''
      if (isCopyMode) {
        const rest = { ...(item || {}) }
        delete rest.id
        return { ...rest, picsUrl }
      }
      return { ...item, picsUrl }
    })

    // 构建合规认证列表；复制模式下每条去掉 id
    const skuCertificationList = (compliance.certificationList || []).map((item: any) => {
      const base = !isCopyMode
        ? { ...(item || {}) }
        : (() => {
            const rest = { ...(item || {}) }
            delete rest.id
            return rest
          })()
      return {
        ...base,
        country: serializeComplianceCountryForApi(base.country)
      }
    })

    // 检查各模块数据是否为默认值，如果是则设为null，避免触发审批流程
    const finalSkuPurchaseBasic = isSkuPurchaseBasicDefault(skuPurchaseBasic)
      ? null
      : skuPurchaseBasic
    const finalSkuLogisticsInfo = isSkuLogisticsInfoDefault(skuLogisticsInfo)
      ? null
      : skuLogisticsInfo
    const finalSkuFinanceInfo = isSkuFinanceInfoDefault(skuFinanceInfo) ? null : skuFinanceInfo
    const finalAssociateLocalSkuDto = isAssociateLocalSkuDtoDefault(associateLocalSkuDto)
      ? null
      : associateLocalSkuDto
    const finalSkuPicList = isSkuPicListDefault(skuPicList) ? null : skuPicList
    const finalSkuCertificationList = isSkuCertificationListDefault(skuCertificationList)
      ? null
      : skuCertificationList

    // 新建/提交时：仅填写了基础信息未填写物流信息时，明确告知后端不要将物流模块提交审批，避免物流信息显示「审批中」
    const logisticsInfoSubmitFlag = finalSkuLogisticsInfo != null ? submitFlag : false

    return {
      skuBasic,
      skuPurchaseBasic: finalSkuPurchaseBasic,
      skuLogisticsInfo: finalSkuLogisticsInfo,
      logisticsInfoSubmitFlag,
      skuFinanceInfo: finalSkuFinanceInfo,
      associateLocalSkuDto: finalAssociateLocalSkuDto,
      skuPicList: finalSkuPicList,
      skuCertificationList: finalSkuCertificationList,
      submitFlag
    }
  }

  // 真正关闭弹窗的内部函数
  const doClose = () => {
    console.log('[Dialog] doClose called, closing dialog...')
    isProgrammaticClose.value = true // 标记为程序主动关闭
    dialogVisible.value = false
    console.log('[Dialog] dialogVisible set to false')
    // 重置数据
    nextTick(() => {
      topFormRef.value?.resetFields()
      activeTab.value = 'basic'
      // 重置所有编辑状态
      topFormEditState.value = false
      basicInfoEditState.value = false
      purchaseInfoEditState.value = false
      logisticsInfoEditState.value = false
      financeInfoEditState.value = false
      salesSkuInfoEditState.value = false
      imageInfoEditState.value = false
      complianceInfoEditState.value = false
      // 如果是新增或复制模式，使用 resetFormData 完全清空数据
      if (handleType.value === 'add' || handleType.value === 'copy') {
        resetFormData()
      } else {
        // 其他模式只重置部分字段
        Object.assign(formData, {
          id: undefined,
          sku: '',
          chineseProductName: '',
          englishProductName: '',
          spuId: '',
          spuName: '',
          materialCode: '',
          image: [],
          basicInfo: {},
          purchaseInfo: {
            currency: 'CNY',
            referenceCost: null,
            referenceDeliveryDays: null,
            purchaseRemark: '',
            purchaseUserList: [],
            supplierQuotes: []
          },
          logisticsInfo: {},
          financeInfo: {},
          salesSkuInfo: { salesSkuList: [] },
          imageInfo: { picList: [] },
          complianceInfo: { certificationList: [] }
        })
        // 重置审批状态
        Object.assign(approvalStatus, {
          basic: null,
          purchase: null,
          logistics: null,
          finance: null,
          sales: null,
          image: null,
          compliance: null
        })
      }
      console.log('[Dialog] Dialog data reset complete')
      // 重置程序关闭标志
      isProgrammaticClose.value = false
    })
  }

  // 关闭弹窗（直接关闭，不显示确认提示）
  const handleClose = async () => {
    // 如果是程序主动关闭（如提交成功、暂存成功），直接关闭
    if (isProgrammaticClose.value) {
      isProgrammaticClose.value = false // 重置标志
      return
    }

    // 直接关闭，不需要确认提示
    doClose()
  }

  // 处理复制
  const handleCopy = () => {
    if (!formData.id) {
      ElMessage.warning('无法复制，缺少SKU ID')
      return
    }
    // 保存当前SKU的ID
    const skuId = formData.id
    // 先关闭当前对话框
    doClose()
    // 使用 nextTick 确保在对话框关闭后触发复制事件
    nextTick(() => {
      emit('copy', skuId)
    })
  }

  // 重置表单数据（完全清除缓存）
  const resetFormData = () => {
    // 重置formData中的所有字段
    formData.id = undefined
    formData.sku = ''
    formData.chineseProductName = ''
    formData.englishProductName = ''
    formData.spuId = ''
    formData.spuName = ''
    formData.materialCode = ''
    formData.image = []
    formData.basicInfo = {}
    // 采购信息需要匹配子组件的默认值结构
    formData.purchaseInfo = {
      currency: 'CNY',
      referenceCost: null,
      referenceDeliveryDays: null,
      purchaseRemark: '',
      purchaseUserList: [],
      supplierQuotes: []
    }
    formData.logisticsInfo = {}
    formData.financeInfo = {}
    formData.salesSkuInfo = { salesSkuList: [] }
    formData.imageInfo = { picList: [] }
    formData.complianceInfo = { certificationList: [] }

    // 重置审批状态
    Object.assign(approvalStatus, {
      basic: null,
      purchase: null,
      logistics: null,
      finance: null,
      sales: null,
      image: null,
      compliance: null
    })

    // 重置初始数据引用
    initialTopFormData.value = null
    initialBasicInfo.value = null
    initialPurchaseInfo.value = null
    initialLogisticsInfo.value = null
    initialFinanceInfo.value = null
    initialSalesSkuInfo.value = null
    initialImageInfo.value = null
    initialComplianceInfo.value = null
  }

  // 初始化数据
  const initData = async () => {
    if (props.initData && props.visible) {
      const data = props.initData

      // 先从传入的数据中获取审批状态（如果存在），作为初始值
      // 这样即使API返回的数据有问题，也能从列表页传入的数据中获取正确的审批状态
      if (data?._skuData?.productSkuBasicVo) {
        const basicVo = data._skuData.productSkuBasicVo
        approvalStatus.basic = basicVo.approveStatus ?? null
        approvalStatus.purchase = basicVo.purchaseApproveStatus ?? null
        approvalStatus.logistics = basicVo.logisticsInfoApproveStatus ?? null
        approvalStatus.finance = basicVo.financeInfoApproveStatus ?? null
        approvalStatus.sales = basicVo.listingRelationApproveStatus ?? null
        approvalStatus.image = basicVo.picApproveStatus ?? null
        approvalStatus.compliance = basicVo.certificationApproveStatus ?? null
      }

      // 如果是详情/编辑模式,且有ID,则从API加载完整数据
      // 如果是详情/编辑/复制模式,且有ID,则从API加载完整数据
      if (
        (handleType.value === 'detail' ||
          handleType.value === 'edit' ||
          handleType.value === 'copy') &&
        data.id
      ) {
        try {
          await loadSkuData(data.id)
          // 如果是复制模式,清除唯一标识字段、所有 ID 及审批状态，避免提交时把原 SKU 的 ID 带给后端
          if (handleType.value === 'copy') {
            formData.id = undefined
            formData.sku = ''
            formData.chineseProductName = ''
            formData.englishProductName = ''
            formData.materialCode = ''
            if (formData.purchaseInfo) {
              formData.purchaseInfo.id = undefined
              ;(formData.purchaseInfo.supplierQuotes || []).forEach((r: any) => {
                if (r && 'id' in r) delete r.id
              })
            }
            if (formData.logisticsInfo) formData.logisticsInfo.id = undefined
            if (formData.financeInfo) formData.financeInfo.id = undefined
            if (formData.complianceInfo?.certificationList) {
              formData.complianceInfo.certificationList.forEach((c: any) => {
                if (c && 'id' in c) delete c.id
              })
            }
            // 重置所有审批状态为草稿(0)
            Object.assign(approvalStatus, {
              basic: 0,
              purchase: 0,
              logistics: 0,
              finance: 0,
              sales: 0,
              image: 0,
              compliance: 0
            })
          }
          // 复制/编辑：采购信息中为 *** 的脱敏字段置空，便于重新填写
          if (
            (handleType.value === 'copy' || handleType.value === 'edit') &&
            formData.purchaseInfo
          ) {
            if (formData.purchaseInfo.referenceCost === '***') {
              formData.purchaseInfo.referenceCost = null
            }
            ;(formData.purchaseInfo.supplierQuotes || []).forEach((r: any) => {
              if (r?.supplierName === '***') r.supplierName = ''
              if (r?.unitPrice === '***') r.unitPrice = null
            })
          }
        } catch (error: any) {
          console.error('加载SKU数据失败:', error)
          if (shouldShowError(error) && !isHttpError(error)) {
            const errorMsg = error?.response?.data?.message || error?.message || '加载数据失败'
            ElMessage.error(errorMsg)
          }
        }
      } else {
        // 新增模式，完全重置所有数据，清除缓存
        // 新增模式下不应该使用传入的数据，所有字段都应该是空的（除了代码默认值）
        resetFormData()
      }

      // 根据 handleType 和 editType 设置默认状态
      if (handleType.value === 'add' || handleType.value === 'copy') {
        topFormEditState.value = true
        basicInfoEditState.value = true
      } else if (handleType.value === 'detail') {
        // 详情模式时，重置所有编辑状态为false，确保所有tab都处于只读状态
        topFormEditState.value = false
        basicInfoEditState.value = false
        purchaseInfoEditState.value = false
        logisticsInfoEditState.value = false
        financeInfoEditState.value = false
        salesSkuInfoEditState.value = false
        imageInfoEditState.value = false
        complianceInfoEditState.value = false
      } else if (handleType.value === 'edit') {
        // 先重置所有编辑状态，确保只有当前编辑的tab处于编辑状态
        topFormEditState.value = false
        basicInfoEditState.value = false
        purchaseInfoEditState.value = false
        logisticsInfoEditState.value = false
        financeInfoEditState.value = false
        salesSkuInfoEditState.value = false
        imageInfoEditState.value = false
        complianceInfoEditState.value = false

        if (editType.value === 'editCommon') {
          // 方案 B：通用信息与基础信息同组编辑，打开时同时进入顶部+基础编辑并切到 basic Tab
          activeTab.value = 'basic'
          // 基础信息审批中时，仅进入查看态，不进入编辑（顶部仍显示撤回）
          if (approvalStatus.basic !== 1) {
            topFormEditState.value = true
            basicInfoEditState.value = true
            initialTopFormData.value = {
              sku: formData.sku,
              chineseProductName: formData.chineseProductName,
              englishProductName: formData.englishProductName,
              spuId: formData.spuId,
              spuName: formData.spuName,
              materialCode: formData.materialCode,
              image: [...formData.image]
            }
            initialBasicInfo.value = JSON.parse(JSON.stringify(formData.basicInfo || {}))
          }
        } else if (editType.value === 'editBasic') {
          activeTab.value = 'basic'
          // 审批中时不允许编辑
          if (approvalStatus.basic !== 1) {
            basicInfoEditState.value = true
            initialBasicInfo.value = JSON.parse(JSON.stringify(formData.basicInfo || {}))
          }
        } else if (editType.value === 'editPurchase') {
          activeTab.value = 'purchase'
          // 审批中时不允许编辑
          if (approvalStatus.purchase !== 1) {
            purchaseInfoEditState.value = true
            initialPurchaseInfo.value = JSON.parse(JSON.stringify(formData.purchaseInfo || {}))
          }
        } else if (editType.value === 'editLogistics') {
          activeTab.value = 'logistics'
          // 审批中时不允许编辑
          if (approvalStatus.logistics !== 1) {
            logisticsInfoEditState.value = true
            initialLogisticsInfo.value = JSON.parse(JSON.stringify(formData.logisticsInfo || {}))
          }
        } else if (editType.value === 'editFinance') {
          activeTab.value = 'finance'
          // 审批中时不允许编辑
          if (approvalStatus.finance !== 1) {
            financeInfoEditState.value = true
            initialFinanceInfo.value = JSON.parse(JSON.stringify(formData.financeInfo || {}))
          }
        } else if (editType.value === 'editSales') {
          activeTab.value = 'sales'
          // 审批中时不允许编辑
          if (approvalStatus.sales !== 1) {
            salesSkuInfoEditState.value = true
            initialSalesSkuInfo.value = JSON.parse(JSON.stringify(formData.salesSkuInfo || {}))
          }
        } else if (editType.value === 'editImage') {
          activeTab.value = 'image'
          // 审批中时不允许编辑
          if (approvalStatus.image !== 1) {
            imageInfoEditState.value = true
            initialImageInfo.value = JSON.parse(JSON.stringify(formData.imageInfo || {}))
          }
        } else if (editType.value === 'editCompliance') {
          activeTab.value = 'compliance'
          // 审批中时不允许编辑
          if (approvalStatus.compliance !== 1) {
            complianceInfoEditState.value = true
            initialComplianceInfo.value = JSON.parse(JSON.stringify(formData.complianceInfo || {}))
          }
        }
      }
    }
  }

  // 加载SKU完整数据
  const loadSkuData = async (productId: number) => {
    try {
      // 使用 Promise.allSettled 并行加载所有数据，确保单个接口失败不会影响其他接口
      // 使用 silent: true 静默模式，不显示全局错误提示，由业务层统一处理
      const results = await Promise.allSettled([
        getProductSkuBasic(productId, { silent: true }),
        getSkuPurchaseBasic(productId, { silent: true }),
        getSkuLogisticsInfo(productId, { silent: true }),
        getSkuFinanceInfo(productId, { silent: true }),
        getSkuListingRelation(
          { localSku: productId, currentPage: 1, pageSize: 10000 },
          { silent: true }
        ),
        getSkuPicList(productId, { silent: true }),
        getSkuCertificationList(productId, { silent: true })
      ])

      // 提取结果，失败的接口返回空对象
      const extractResult = (result: PromiseSettledResult<any>, apiName: string) => {
        if (result.status === 'fulfilled') {
          return result.value
        } else {
          console.warn(
            `[loadSkuData] ${apiName} 接口调用失败:`,
            result.reason?.message || result.reason
          )
          return { data: null }
        }
      }

      const basicRes = extractResult(results[0], 'getProductSkuBasic')
      const purchaseRes = extractResult(results[1], 'getSkuPurchaseBasic')
      const logisticsRes = extractResult(results[2], 'getSkuLogisticsInfo')
      const financeRes = extractResult(results[3], 'getSkuFinanceInfo')
      const listingRelationRes =
        handleType.value !== 'copy' ? extractResult(results[4], 'getSkuListingRelation') : []
      const picListRes = extractResult(results[5], 'getSkuPicList')
      const certificationListRes = extractResult(results[6], 'getSkuCertificationList')

      // 检查是否有关键接口失败（基础信息是必须的）
      const failedApis = results.filter((r) => r.status === 'rejected')
      if (failedApis.length > 0) {
        console.warn(`[loadSkuData] 有 ${failedApis.length} 个接口调用失败，部分数据可能不完整`)
      }

      // 如果基础信息加载失败且错误未在 HTTP 层展示过，再提示
      const firstRejected =
        results[0].status === 'rejected' ? (results[0] as PromiseRejectedResult) : null
      if (firstRejected && shouldShowError(firstRejected.reason)) {
        ElMessage.error('基础信息加载失败')
      }

      // 处理基础信息
      if (basicRes.data) {
        const basic = basicRes.data
        // 保存审批状态（如果API返回的值存在，则使用API的值；否则保留之前从传入数据中获取的值）
        if (basic.approveStatus !== null && basic.approveStatus !== undefined) {
          approvalStatus.basic = basic.approveStatus
        }

        let picUrlObj: any = {}
        try {
          picUrlObj = JSON.parse(basic.picUrl || '{}')
        } catch {
          picUrlObj = {}
        }

        formData.id = basic.id
        formData.sku = basic.sku || ''
        formData.chineseProductName = basic.productChineseName || ''
        formData.englishProductName = basic.productEnglishName || ''
        formData.spuId = basic.spuId ?? basic.productSpuId ?? ''
        formData.spuName = (basic.spu || basic.spuCode || '').trim()
        formData.materialCode = basic.materialCode || ''
        ensureCurrentSpuInOptions()
        formData.image =
          picUrlObj?.url || basic.picUrl
            ? [
                {
                  url: picUrlObj?.url || basic.picUrl,
                  name: picUrlObj?.name || picUrlObj?.url?.split('/').pop() || 'image',
                  status: 'success'
                }
              ]
            : []

        let productDeveloperUserList = []
        let productOwnerUserList = []
        let attachs = []
        try {
          productDeveloperUserList = JSON.parse(basic.productDeveloperUsers)
          productOwnerUserList = JSON.parse(basic.productOwnerUsers)
          attachs = JSON.parse(basic.attachs)
        } catch {
          productDeveloperUserList = []
          productOwnerUserList = []
          attachs = []
        }

        // 如果API没有返回用户名称，从ID转换
        let productDeveloperUserNames = basic.productDeveloperUserNames
        if (
          !productDeveloperUserNames &&
          productDeveloperUserList &&
          productDeveloperUserList.length > 0
        ) {
          productDeveloperUserNames = productDeveloperUserList
            .map((userId: string | number) => {
              const user = props.userOptions.find((u: any) => u.value === userId)
              return user?.label || userId
            })
            .join('、')
        }

        let productOwnerUserNames = basic.productOwnerUserNames
        if (!productOwnerUserNames && productOwnerUserList && productOwnerUserList.length > 0) {
          productOwnerUserNames = productOwnerUserList
            .map((userId: string | number) => {
              const user = props.userOptions.find((u: any) => u.value === userId)
              return user?.label || userId
            })
            .join('、')
        }

        // 转换基础信息数据
        formData.basicInfo = {
          id: basic.id,
          categoryId: basic.categoryId,
          categoryName: basic.categoryName,
          brandId: basic.brandId,
          brandName: basic.brandName,
          material: basic.material,
          purpose: basic.purpose,
          unit: basic.unit,
          specificationDescription:
            basic.specificationDescription != null && basic.specificationDescription !== undefined
              ? String(basic.specificationDescription)
              : '',
          productRemark:
            basic.productRemark != null && basic.productRemark !== undefined
              ? String(basic.productRemark).slice(0, 100)
              : '',
          productStatus: basic.productStatus,
          productDeveloperUserList,
          productDeveloperUserNames: productDeveloperUserNames || '',
          productOwnerUserList,
          productOwnerUserNames: productOwnerUserNames || '',
          // 规格单位制：0-公制，1-英制；回显时默认选对应 Tab（兼容后端返回 number 或 string）
          specUnitSystem: Number(basic.specUnitSystem) === 1 ? 1 : 0,
          // 规格尺寸
          productSizeUnit: basic.productSizeUnit,
          productLength: basic.productLength,
          productLengthInch: basic.productLengthInch,
          productWidth: basic.productWidth,
          productWidthInch: basic.productWidthInch,
          productHeight: basic.productHeight,
          productHeightInch: basic.productHeightInch,
          productNetWeightUnit: basic.productNetWeightUnit,
          productNetWeight: basic.productNetWeight,
          productNetWeightLb: basic.productNetWeightLb,
          productGrossWeightUnit: basic.productGrossWeightUnit,
          productGrossWeight: basic.productGrossWeight,
          productGrossWeightLb: basic.productGrossWeightLb,
          // 包装尺寸
          productPackageSizeUnit: basic.productPackageSizeUnit,
          productPackageLength: basic.productPackageLength,
          productPackageLengthInch: basic.productPackageLengthInch,
          productPackageWidth: basic.productPackageWidth,
          productPackageWidthInch: basic.productPackageWidthInch,
          productPackageHeight: basic.productPackageHeight,
          productPackageHeightInch: basic.productPackageHeightInch,
          // 箱规
          boxSizeUnit: basic.boxSizeUnit,
          boxLength: basic.boxLength,
          boxLengthInch: basic.boxLengthInch,
          boxWidth: basic.boxWidth,
          boxWidthInch: basic.boxWidthInch,
          boxHeight: basic.boxHeight,
          boxHeightInch: basic.boxHeightInch,
          boxNetWeightUnit: basic.boxNetWeightUnit,
          boxNetWeight: basic.boxNetWeight,
          boxNetWeightLb: basic.boxNetWeightLb,
          boxGrossWeightUnit: basic.boxGrossWeightUnit,
          boxGrossWeight: basic.boxGrossWeight,
          boxGrossWeightLb: basic.boxGrossWeightLb,
          boxNum: basic.boxNum,
          attachments: attachs
        }
      }

      // 处理采购信息
      if (purchaseRes.data) {
        const purchase = purchaseRes.data.productPurchaseBasicVo || {}
        const supplierList = purchaseRes.data.skuSupplierQuotationListVo || []

        // 保存审批状态（如果API返回的值存在，则使用API的值；否则保留之前从传入数据中获取的值）
        if (purchase.approveStatus !== null && purchase.approveStatus !== undefined) {
          approvalStatus.purchase = purchase.approveStatus
        }

        let purchaseOwnerUserIds: any = []
        try {
          purchaseOwnerUserIds = JSON.parse(purchase.purchaseOwnerUsers)
        } catch {
          purchaseOwnerUserIds = []
        }

        // 如果API没有返回采购负责人名称，从ID转换
        let purchaseUsers = purchase.purchaseUsers
        if (!purchaseUsers && purchaseOwnerUserIds && purchaseOwnerUserIds.length > 0) {
          purchaseUsers = purchaseOwnerUserIds
            .map((userId: string | number) => {
              const user = props.userOptions.find((u: any) => u.value === userId)
              return user?.label || userId
            })
            .join('、')
        }

        formData.purchaseInfo = {
          id: purchase.id,
          currency: purchase.currency || purchase.purchaseReferencePriceCurrency,
          referenceCost: purchase.referenceCost,
          // purchaseReferenceCost: purchase.referenceCost,
          referenceDeliveryDays: purchase.referenceDeliveryDays,
          purchaseUserList: purchaseOwnerUserIds || [], // 需要从其他字段解析
          purchaseUsers: purchaseUsers || '',
          purchaseRemark: purchase.purchaseRemark,
          splitNum: purchase.splitNum,
          supplierQuotes: supplierList.map((item: any) => ({
            id: item.id,
            supplierId: item.supplierId,
            supplierCode: item.supplierCode,
            supplierName: item.supplierName,
            unitPrice: item.unitPrice,
            taxInclusivePrice: item.taxInclusivePrice,
            currency: item.currency,
            isTax: normalizeIsTax(item.isTax, item.isIncludeTax),
            taxRate: item.taxRate,
            deliveryDays: item.deliveryDays,
            isDefault: item.isDefault,
            splitRate: item.splitRate
          })),
          supplierQuotationList: supplierList.map((item: any) => ({
            id: item.id,
            supplierId: item.supplierId,
            supplierCode: item.supplierCode,
            supplierName: item.supplierName,
            unitPrice: item.unitPrice,
            currency: item.currency,
            isTax: normalizeIsTax(item.isTax, item.isIncludeTax),
            taxRate: item.taxRate,
            deliveryDays: item.deliveryDays,
            isDefault: item.isDefault,
            splitRate: item.splitRate
          }))
        }
      }

      // 处理物流信息
      if (logisticsRes.data) {
        const logistics = logisticsRes.data
        // 保存审批状态（如果API返回的值存在，则使用API的值；否则保留之前从传入数据中获取的值）
        if (logistics.approveStatus !== null && logistics.approveStatus !== undefined) {
          approvalStatus.logistics = logistics.approveStatus
        }
        let logisticsUserList = []
        try {
          logisticsUserList = JSON.parse(logistics.logisticsOwnerUsers)
        } catch {
          logisticsUserList = []
        }

        // 如果API没有返回物流负责人名称，从ID转换
        let logisticsUser = logistics.logisticsUser
        if (!logisticsUser && logisticsUserList && logisticsUserList.length > 0) {
          logisticsUser = logisticsUserList
            .map((userId: string | number) => {
              const user = props.userOptions.find((u: any) => u.value === userId)
              return user?.label || userId
            })
            .join('、')
        }

        formData.logisticsInfo = {
          id: logistics.id,
          logisticsUserList,
          logisticsUser: logisticsUser || '',
          customsHsCode: logistics.customsHsCode,
          isTaxIncluded: normalizeBinarySelectValue(logistics.isTaxIncluded),
          customsName: logistics.customsName,
          englishCustomsName: logistics.englishCustomsName,
          customsMaterial: logistics.customsMaterial,
          customsModel: logistics.customsModel,
          customsUnit: logistics.customsUnit,
          customsPrice: logistics.customsPrice,
          customsPriceCurrency: logistics.customsPriceCurrency,
          customsUsage: logistics.customsUsage,
          originCountry: logistics.originCountry,
          domesticCity: logistics.domesticCity,
          exemptionTax: logistics.exemptionTax,
          outletBenefits: logistics.outletBenefits,
          customsClearanceCode: logistics.customsClearanceCode,
          customsClearModel: logistics.customsClearModel,
          customsClearPrice: logistics.customsClearPrice,
          customsClearPriceCurrency: logistics.customsClearPriceCurrency,
          customsClearTaxRate: logistics.customsClearTaxRate,
          customsDeclarationMethod: normalizeNullableNumber(logistics.customsDeclarationMethod),
          otherDeclarationElements: logistics.otherDeclarationElements,
          cargoAttributes: logistics.productAttr?.split(','),
          brandType: logistics.brandType
        }
      }

      // 处理财务信息
      if (financeRes.data) {
        const finance = financeRes.data
        // 保存审批状态（如果API返回的值存在，则使用API的值；否则保留之前从传入数据中获取的值）
        if (finance.approveStatus !== null && finance.approveStatus !== undefined) {
          approvalStatus.finance = finance.approveStatus
        }
        let financeUserList = []
        try {
          financeUserList = JSON.parse(finance.financeOwnerUsers)
        } catch {
          financeUserList = []
        }

        // 如果API没有返回财务负责人名称，从ID转换
        let financeUsers = finance.financeUsers
        if (!financeUsers && financeUserList && financeUserList.length > 0) {
          financeUsers = financeUserList
            .map((userId: string | number) => {
              const user = props.userOptions.find((u: any) => u.value === userId)
              return user?.label || userId
            })
            .join('、')
        }

        // 如果API没有返回主体名称，从ID转换
        let purchaseOrganizationName = finance.purchaseOrganizationName
        if (!purchaseOrganizationName && finance.purchaseOrganizationId) {
          const org = companyAll.value.find(
            (item: any) => item.id == finance.purchaseOrganizationId
          )
          purchaseOrganizationName = org?.name || ''
        }

        let customsOrganizationName = finance.customsOrganizationName
        if (!customsOrganizationName && finance.customsOrganizationId) {
          const org = companyAll.value.find((item: any) => item.id == finance.customsOrganizationId)
          customsOrganizationName = org?.name || ''
        }

        let saleOrganizationName = finance.saleOrganizationName
        if (!saleOrganizationName && finance.saleOrganizationId) {
          const org = companyAll.value.find((item: any) => item.id == finance.saleOrganizationId)
          saleOrganizationName = org?.name || ''
        }

        formData.financeInfo = {
          id: finance.id,
          financeUsers: financeUsers || '',
          financeUserList,
          financeOwnerUsers: finance.financeOwnerUsers,
          saleOrganizationId: finance.saleOrganizationId,
          saleOrganizationName: saleOrganizationName || '',
          purchaseOrganizationId: finance.purchaseOrganizationId,
          purchaseOrganizationName: purchaseOrganizationName || '',
          customsOrganizationId: finance.customsOrganizationId,
          customsOrganizationName: customsOrganizationName || ''
        }
      }

      // 处理关联销售SKU
      if (listingRelationRes.data) {
        // 保存审批状态 (从响应的data对象获取，不是从数组项)
        // 如果API返回的值存在，则使用API的值；否则保留之前从传入数据中获取的值
        const salesStatus =
          listingRelationRes.data.approveStatus ??
          listingRelationRes.approveStatus ??
          listingRelationRes.data[0]?.approveStatus ??
          null
        if (salesStatus !== null && salesStatus !== undefined) {
          approvalStatus.sales = salesStatus
        }

        // 获取实际的列表数据（使用 dtoList 字段，与保存后重新加载保持一致）
        const salesSkuList = listingRelationRes.data.dtoList || []
        formData.salesSkuInfo = {
          salesSkuList: salesSkuList.map((item: any) => {
            let listingRelationUserList = []
            if (item.listingRelationOwnerUsers) {
              try {
                listingRelationUserList = JSON.parse(item.listingRelationOwnerUsers)
              } catch {
                listingRelationUserList = []
              }
            }
            return {
              ...item,
              id: item.id,
              accountId: item.accountId,
              accountName: item.accountName,
              listingId: item.listingId,
              msku: item.msku,
              sellerSku: item.sellerSku,
              salesSku: item.msku || item.sellerSku, // 添加 salesSku 字段
              marketplace: item.marketplace,
              country: item.country,
              region: item.region || item.country, // 表格使用 region 字段
              listingRelationUserList,
              asin: item.asin,
              listingRelationOwnerUsersName: item.listingRelationOwnerUsersName || '',
              salesManagerNamesStr:
                item.listingRelationOwnerUsersName || item.salesManagerNamesStr || '', // 表格使用 salesManagerNamesStr 字段
              salesEntity: item.salesEntity || item.sellingEntity || '', // 表格使用 salesEntity 字段
              storeName: item.storeName || item.accountName || '', // 表格使用 storeName 字段
              area: item.area || item.marketplace || '' // 表格使用 area 字段
            }
          })
        }
      } else {
        // 如果没有数据，确保数据结构正确
        formData.salesSkuInfo = {
          salesSkuList: []
        }
      }

      // 处理图片信息
      if (picListRes.data) {
        // 保存审批状态 (从响应的data对象获取，不是从数组项)
        // 如果API返回的值存在，则使用API的值；否则保留之前从传入数据中获取的值
        const imageStatus =
          picListRes.data.approveStatus ??
          picListRes.approveStatus ??
          picListRes.data[0]?.approveStatus ??
          null
        if (imageStatus !== null && imageStatus !== undefined) {
          approvalStatus.image = imageStatus
        }

        // 获取实际的列表数据
        const picList = Array.isArray(picListRes.data)
          ? picListRes.data
          : picListRes.data.list || []
        formData.imageInfo = {
          picList: picList.map((item: any) => ({
            id: item.id,
            picsUrl: item.picsUrl,
            approveStatus: item.approveStatus,
            feishuFileCode: item.feishuFileCode
          }))
        }
      }

      // 处理合规认证
      if (certificationListRes.data) {
        // 保存审批状态 (从响应的data对象获取，不是从数组项)
        // 如果API返回的值存在，则使用API的值；否则保留之前从传入数据中获取的值
        const complianceStatus =
          certificationListRes.data.approveStatus ??
          certificationListRes.approveStatus ??
          certificationListRes.data[0]?.approveStatus ??
          null
        if (complianceStatus !== null && complianceStatus !== undefined) {
          approvalStatus.compliance = complianceStatus
        }

        // 获取实际的列表数据
        const certificationList = Array.isArray(certificationListRes.data)
          ? certificationListRes.data
          : certificationListRes.data.list || []
        formData.complianceInfo = {
          certificationList: certificationList.map((item: any) => ({
            id: item.id,
            certificationType: item.certificationType,
            certificationAgency: (item.certificationAgency || '').slice(0, 50),
            country: item.country,
            applicantCompany: (item.applicantCompany || '').slice(0, 50),
            testDate: item.testDate,
            issueDate: item.issueDate,
            certificateNumber: (item.certificateNumber || '').slice(0, 50),
            attachment: item.attachment
          }))
        }
      }
    } catch (error) {
      console.error('加载SKU数据失败:', error)
      throw error
    }
  }

  // 监听弹窗显示状态
  watch(
    () => props.visible,
    (visible) => {
      if (visible) {
        nextTick(() => {
          getCompanySubject()
          initData()
          // 在弹窗打开时加载SPU选项（带缓存，避免重复请求）
          loadAllSpuOptions()
          // 弹窗打开时刷新采购/物流中的币种下拉，以感知其他功能对币种的变更
          purchaseInfoRef.value?.refreshCurrency?.()
          logisticsInfoRef.value?.refreshCurrency?.()
        })
      }
    }
  )
</script>

<style lang="scss" scoped>
  .add-sku-dialog {
    :deep(.el-dialog) {
      max-width: 95vw;
    }

    :deep(.el-dialog__body) {
      max-height: 75vh;
      padding: 0;
      overflow-y: auto;
    }

    .add-sku-dialog-wrapper {
      min-width: 1600px;

      .top-section {
        display: flex;
        gap: 20px;
        align-items: center;
        padding: 20px;
        background-color: var(--el-fill-color-lighter);
        border-bottom: 1px solid var(--el-border-color);

        // 与 SPU 一致：在 top-section 层级统一设置上传列表项与触发按钮尺寸（60px）
        :deep(.el-upload-list__item-actions),
        :deep(.el-upload-list__item) {
          width: 60px !important;
          height: 60px !important;
          margin: 0 !important;
          border-radius: 4px;
        }

        .image-upload {
          flex-shrink: 0;

          // 表单项内容：列表与添加按钮同一行展示
          :deep(.el-form-item__content) {
            display: flex;
            flex-wrap: wrap;
            gap: 8px;
            align-items: center;
          }

          :deep(.el-upload--picture-card) {
            width: 60px !important;
            height: 60px !important;
            margin: 0 !important;
            border-radius: 4px;
          }

          :deep(.el-upload-list--picture-card) {
            .el-upload-list__item {
              overflow: hidden;

              .el-upload-list__item-thumbnail {
                width: 100% !important;
                height: 100% !important;
                object-fit: cover !important;
                object-position: center;
                background-color: #fff;
              }
            }
          }

          // 只隐藏「按 Delete 键可删除」文案（在 i.close-tip 中），保留查看/删除图标
          :deep(.el-upload-list__item .el-icon__close-tip),
          :deep(.el-upload-list__item i[class*='close-tip']) {
            display: none;
          }

          // 与 SPU 一致：有图时隐藏上传按钮（同一元素上的 class，用 &.has-upload）
          &.has-upload {
            :deep(.el-upload-list__item.is-ready) {
              width: 60px !important;
              height: 60px !important;
              margin: 0 !important;
            }

            :deep(.el-upload) {
              display: none !important;
            }
          }

          :deep(.el-upload) {
            display: flex;
            align-items: center;
            justify-content: center;
          }

          &.no-upload {
            :deep(.el-upload) {
              display: flex !important;
            }
          }
        }

        .top-form {
          flex: 1;
          min-width: 0;

          :deep(.el-form-item__error) {
            font-size: 11px;
            line-height: 1.2;
          }

          .top-form-header {
            display: flex;
            gap: 16px;
            align-items: flex-start;

            :deep(.el-form) {
              flex: 1;
            }

            .top-form-actions {
              display: flex;
              gap: 8px;
              align-items: flex-start;
            }

            .readonly-text {
              display: inline-block;
              font-size: 14px;
              line-height: 32px;
              color: var(--el-text-color-primary);
              word-break: break-all;
            }
          }
        }
      }

      .handle-section {
        .edit-buttons-wrapper {
          padding: 16px 20px;
          background-color: var(--el-fill-color-light);
          border-bottom: 1px solid var(--el-border-color);

          .header-actions {
            display: flex;
            gap: 8px;
            justify-content: flex-end;
          }
        }

        .sku-tabs {
          padding: 0 20px;

          :deep(.el-tabs__header) {
            margin-bottom: 0;
          }

          :deep(.el-tabs__content) {
            padding: 0;
          }

          :deep(.el-form-item__error) {
            font-size: 11px;
            line-height: 1.2;
          }

          .tab-label {
            display: inline-flex;
            align-items: center;
          }

          .tab-content-wrapper {
            position: relative;
            min-height: 200px;
          }

          .tab-edit-button {
            position: absolute;
            top: 12px;
            right: 0;
            z-index: 10;
            transition: all 0.3s ease;

            :deep(.el-button) {
              box-shadow: 0 2px 4px rgb(0 0 0 / 8%);

              &:hover {
                box-shadow: 0 4px 8px rgb(0 0 0 / 12%);
                transform: translateY(-1px);
              }
            }
          }

          .tab-actions {
            display: flex;
            gap: 12px;
            justify-content: center;
            padding-top: 20px;
            margin-top: 20px;
            border-top: 1px solid var(--el-border-color);
          }

          .tab-readonly-actions {
            display: flex;
            gap: 12px;
            justify-content: flex-end;
            padding-top: 20px;
            margin-top: 20px;
            border-top: 1px solid var(--el-border-color);
          }

          .placeholder-tab {
            padding: 60px 20px;
            font-size: 16px;
            color: var(--el-text-color-secondary);
            text-align: center;
          }
        }
      }
    }

    .dialog-footer {
      display: flex;
      gap: 12px;
      justify-content: flex-end;
    }

    .dialog-footer-center {
      justify-content: center;
    }
  }
</style>
