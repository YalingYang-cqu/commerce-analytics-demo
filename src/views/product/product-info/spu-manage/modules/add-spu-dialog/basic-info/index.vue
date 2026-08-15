<template>
  <div class="basic-info">
    <!-- 基本信息 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">基本信息</span>
      </div>
      <ElForm ref="formRef" :model="formData" :rules="rules" label-width="90px">
        <ElRow :gutter="20">
          <ElCol :span="6">
            <ElFormItem label="分类:" prop="category">
              <ElCascader
                v-model="formData.category"
                :options="categoryAll"
                :props="{
                  emitPath: false,
                  checkStrictly: true,
                  children: 'children',
                  label: 'categoryName',
                  value: 'id'
                }"
                placeholder="请选择分类"
                filterable
                clearable
                style="width: 100%"
                @change="updateCategoryFields"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="品牌:" prop="brandId">
              <ElSelect
                v-model="formData.brandId"
                placeholder="请输入"
                filterable
                clearable
                @change="updateBrandFields"
              >
                <ElOption
                  :label="item.label"
                  :value="item.value"
                  v-for="item in brandAll"
                  :key="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="单位:" prop="unit">
              <ElSelect v-model="formData.unit" placeholder="请输入" filterable clearable>
                <ElOption
                  :label="item.label"
                  :value="item.value"
                  v-for="item in dictData['spuUnit']"
                  :key="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="状态:" prop="productStatus">
              <ElSelect v-model="formData.productStatus" placeholder="请输入" filterable clearable>
                <ElOption
                  :label="item.label"
                  :value="item.value"
                  v-for="item in dictData['productStatus']"
                  :key="item.value"
                />
              </ElSelect>
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="开发人:" prop="productDeveloperUserList ">
              <MkSelect
                v-model="formData.productDeveloperUserList"
                :options="userAll"
                :label-value="{ name: 'label', value: 'value' }"
                placeholder="请选择"
                :filterable="true"
                :alwaysFilterInput="true"
                :multiple="true"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="产品负责人:" prop="productOwnerUserList">
              <MkSelect
                v-model="formData.productOwnerUserList"
                :options="userAll"
                :label-value="{ name: 'label', value: 'value' }"
                placeholder="请选择"
                :filterable="true"
                :alwaysFilterInput="true"
                :multiple="true"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="分配店铺:" prop="accountIdList">
              <MkSelect
                v-model="formData.accountIdList"
                :options="storeAll"
                :label-value="{ name: 'label', value: 'value' }"
                placeholder="请选择"
                :filterable="true"
                :alwaysFilterInput="true"
                :multiple="true"
              />
            </ElFormItem>
          </ElCol>
        </ElRow>
        <ElRow :gutter="20">
          <ElCol :span="6">
            <ElFormItem label="产品备注:" prop="productRemark">
              <ElInput
                v-model="formData.productRemark"
                type="textarea"
                :rows="1"
                placeholder="请输入"
                maxlength="100"
                show-word-limit
                clearable
                style="width: 89%"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="18">
            <ElFormItem label="附件：" prop="attachList">
              <FileUpload v-model="formData.attachList" />
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
    </div>

    <!-- 规格信息 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">规格信息</span>
        <div class="unit-switcher">
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
      <ElTabs v-model="specUnit" class="spec-tabs">
        <ElTabPane label="公制" name="metric">
          <ElForm
            ref="metricSpecFormRef"
            :model="formData.specs.metric"
            :rules="specRules"
            label-width="100px"
          >
            <ElRow :gutter="20">
              <ElCol :span="6">
                <ElFormItem label="单品净重:" prop="productNetWeight">
                  <div class="input-with-unit no-space">
                    <ElInputNumber
                      v-model="formData.specs.metric.productNetWeight"
                      placeholder="请输入"
                      :min="0"
                      :precision="4"
                      :max="9999999999"
                      :controls="false"
                      @change="handleWeightChange('productNetWeight', 'metric', 'imperial')"
                    />

                    <ElSelect
                      v-model="formData.weightUnits.productNetWeightUnit"
                      class="unit-select"
                      @change="(val) => handleUnitChangeWithOldValue('productNetWeight', val)"
                    >
                      <ElOption label="g" value="g" />
                      <ElOption label="kg" value="kg" />
                    </ElSelect>
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="单品毛重:" prop="productGrossWeight">
                  <div class="input-with-unit no-space">
                    <ElInputNumber
                      v-model="formData.specs.metric.productGrossWeight"
                      placeholder="请输入"
                      :min="0"
                      :precision="4"
                      :max="9999999999"
                      :controls="false"
                      @change="handleWeightChange('productGrossWeight', 'metric', 'imperial')"
                    />
                    <ElSelect
                      v-model="formData.weightUnits.productGrossWeightUnit"
                      class="unit-select"
                      @change="(val) => handleUnitChangeWithOldValue('productGrossWeight', val)"
                    >
                      <ElOption label="g" value="g" />
                      <ElOption label="kg" value="kg" />
                    </ElSelect>
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="单品尺寸:">
                  <div class="dimension-inputs">
                    <ElFormItem prop="productLength" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.metric.productLength"
                        placeholder="长"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('singleItem', 'metric')"
                      />
                    </ElFormItem>
                    <ElFormItem prop="productWidth" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.metric.productWidth"
                        placeholder="宽"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('singleItem', 'metric')"
                      />
                    </ElFormItem>
                    <ElFormItem prop="productHeight" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.metric.productHeight"
                        placeholder="高"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('singleItem', 'metric')"
                      />
                    </ElFormItem>
                    <span class="unit">cm</span>
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="包装尺寸:">
                  <div class="dimension-inputs">
                    <ElFormItem prop="productPackageLength" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.metric.productPackageLength"
                        placeholder="长"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('package', 'metric')"
                      />
                    </ElFormItem>
                    <ElFormItem prop="productPackageWidth" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.metric.productPackageWidth"
                        placeholder="宽"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('package', 'metric')"
                      />
                    </ElFormItem>
                    <ElFormItem prop="productPackageHeight" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.metric.productPackageHeight"
                        placeholder="高"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('package', 'metric')"
                      />
                    </ElFormItem>
                    <span class="unit">cm</span>
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="单箱净重:" prop="boxNetWeight">
                  <div class="input-with-unit no-space">
                    <ElInputNumber
                      v-model="formData.specs.metric.boxNetWeight"
                      placeholder="请输入"
                      :min="0"
                      :precision="4"
                      :max="9999999999"
                      :controls="false"
                      @change="handleWeightChange('boxNetWeight', 'metric', 'imperial')"
                    />
                    <ElSelect
                      v-model="formData.weightUnits.boxNetWeightUnit"
                      class="unit-select"
                      @change="(val) => handleUnitChangeWithOldValue('boxNetWeight', val)"
                    >
                      <ElOption label="g" value="g" />
                      <ElOption label="kg" value="kg" />
                    </ElSelect>
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="单箱毛重:" prop="boxGrossWeight">
                  <div class="input-with-unit no-space">
                    <ElInputNumber
                      v-model="formData.specs.metric.boxGrossWeight"
                      placeholder="请输入"
                      :min="0"
                      :precision="4"
                      :max="9999999999"
                      :controls="false"
                      @change="handleWeightChange('boxGrossWeight', 'metric', 'imperial')"
                    />
                    <ElSelect
                      v-model="formData.weightUnits.boxGrossWeightUnit"
                      class="unit-select"
                      @change="(val) => handleUnitChangeWithOldValue('boxGrossWeight', val)"
                    >
                      <ElOption label="g" value="g" />
                      <ElOption label="kg" value="kg" />
                    </ElSelect>
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="单箱数量:" prop="boxNum">
                  <div class="input-with-unit">
                    <ElInput v-model="formData.specs.metric.boxNum" placeholder="请输入" />
                    <span class="unit">pcs</span>
                  </div>
                </ElFormItem>
              </ElCol>

              <ElCol :span="6">
                <ElFormItem label="单箱尺寸:">
                  <div class="dimension-inputs">
                    <ElFormItem prop="boxLength" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.metric.boxLength"
                        placeholder="长"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('singleBox', 'metric')"
                      />
                    </ElFormItem>
                    <ElFormItem prop="boxWidth" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.metric.boxWidth"
                        placeholder="宽"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('singleBox', 'metric')"
                      />
                    </ElFormItem>
                    <ElFormItem prop="boxHeight" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.metric.boxHeight"
                        placeholder="高"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('singleBox', 'metric')"
                      />
                    </ElFormItem>
                    <span class="unit">cm</span>
                  </div>
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElForm>
        </ElTabPane>
        <ElTabPane label="英制" name="imperial">
          <ElForm
            ref="imperialSpecFormRef"
            :model="formData.specs.imperial"
            :rules="imperialSpecRules"
            label-width="100px"
          >
            <ElRow :gutter="20">
              <ElCol :span="6">
                <ElFormItem label="单品净重:" prop="productNetWeightLb">
                  <div class="input-with-unit">
                    <ElInputNumber
                      v-model="formData.specs.imperial.productNetWeightLb"
                      placeholder="请输入"
                      :min="0"
                      :precision="4"
                      :max="9999999999"
                      :controls="false"
                      @change="handleWeightChange('productNetWeightLb', 'imperial', 'metric')"
                    />
                    <span class="unit">lb</span>
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="单品毛重:" prop="productGrossWeightLb">
                  <div class="input-with-unit">
                    <ElInputNumber
                      v-model="formData.specs.imperial.productGrossWeightLb"
                      placeholder="请输入"
                      :min="0"
                      :precision="4"
                      :max="9999999999"
                      :controls="false"
                      @change="handleWeightChange('productGrossWeightLb', 'imperial', 'metric')"
                    />
                    <span class="unit">lb</span>
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="单品尺寸:">
                  <div class="dimension-inputs">
                    <ElFormItem prop="productLengthInch" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.imperial.productLengthInch"
                        placeholder="长"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('singleItem', 'imperial')"
                      />
                    </ElFormItem>
                    <ElFormItem prop="productWidthInch" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.imperial.productWidthInch"
                        placeholder="宽"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('singleItem', 'imperial')"
                      />
                    </ElFormItem>
                    <ElFormItem prop="productHeightInch" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.imperial.productHeightInch"
                        placeholder="高"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('singleItem', 'imperial')"
                      />
                    </ElFormItem>
                    <span class="unit">inch</span>
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="包装尺寸:">
                  <div class="dimension-inputs">
                    <ElFormItem prop="productPackageLengthInch" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.imperial.productPackageLengthInch"
                        placeholder="长"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('package', 'imperial')"
                      />
                    </ElFormItem>
                    <ElFormItem prop="productPackageWidthInch" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.imperial.productPackageWidthInch"
                        placeholder="宽"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('package', 'imperial')"
                      />
                    </ElFormItem>
                    <ElFormItem prop="productPackageHeightInch" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.imperial.productPackageHeightInch"
                        placeholder="高"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('package', 'imperial')"
                      />
                    </ElFormItem>
                    <span class="unit">inch</span>
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="单箱净重:" prop="boxNetWeightLb">
                  <div class="input-with-unit">
                    <ElInputNumber
                      v-model="formData.specs.imperial.boxNetWeightLb"
                      placeholder="请输入"
                      :min="0"
                      :precision="4"
                      :max="9999999999"
                      :controls="false"
                      @change="handleWeightChange('boxNetWeightLb', 'imperial', 'metric')"
                    />
                    <span class="unit">lb</span>
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="单箱毛重:" prop="boxGrossWeightLb">
                  <div class="input-with-unit">
                    <ElInputNumber
                      v-model="formData.specs.imperial.boxGrossWeightLb"
                      placeholder="请输入"
                      :min="0"
                      :precision="4"
                      :max="9999999999"
                      :controls="false"
                      @change="handleWeightChange('boxGrossWeightLb', 'imperial', 'metric')"
                    />
                    <span class="unit">lb</span>
                  </div>
                </ElFormItem>
              </ElCol>
              <ElCol :span="6">
                <ElFormItem label="单箱数量:" prop="boxNum">
                  <div class="input-with-unit">
                    <ElInput v-model="formData.specs.imperial.boxNum" placeholder="请输入" />
                    <span class="unit">pcs</span>
                  </div>
                </ElFormItem>
              </ElCol>

              <ElCol :span="6">
                <ElFormItem label="单箱尺寸:">
                  <div class="dimension-inputs">
                    <ElFormItem prop="boxLengthInch" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.imperial.boxLengthInch"
                        placeholder="长"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('singleBox', 'imperial')"
                      />
                    </ElFormItem>
                    <ElFormItem prop="boxWidthInch" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.imperial.boxWidthInch"
                        placeholder="宽"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('singleBox', 'imperial')"
                      />
                    </ElFormItem>
                    <ElFormItem prop="boxHeightInch" class="inline-spec-item">
                      <ElInputNumber
                        v-model="formData.specs.imperial.boxHeightInch"
                        placeholder="高"
                        :min="0"
                        :precision="2"
                        :max="9999999999"
                        :controls="false"
                        style="width: 70px"
                        @change="handleDimensionChange('singleBox', 'imperial')"
                      />
                    </ElFormItem>
                    <span class="unit">inch</span>
                  </div>
                </ElFormItem>
              </ElCol>
            </ElRow>
          </ElForm>
        </ElTabPane>
      </ElTabs>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, defineExpose, inject } from 'vue'
  import {
    ElCascader,
    ElForm,
    ElFormItem,
    ElSelect,
    ElOption,
    ElInput,
    ElInputNumber,
    ElRow,
    ElCol,
    ElTabs,
    ElTabPane,
    type FormInstance,
    type FormRules
  } from 'element-plus'
  import FileUpload from '@/components/core/upload-custom/index.vue'
  import { useDictStore } from '@/store/modules/dict'

  interface Props {
    modelValue: any
  }

  interface Emits {
    (e: 'update:modelValue', value: any): void
  }

  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const metricSpecFormRef = ref<FormInstance>()
  const imperialSpecFormRef = ref<FormInstance>()
  const specUnit = ref('metric')

  // 规格信息：必须大于0的校验器
  const positiveValidator = (_rule: any, value: any, callback: (err?: Error) => void) => {
    if (value === null || value === undefined || value === '') {
      callback()
      return
    }
    const num = Number(value)
    if (isNaN(num) || num <= 0) {
      callback(new Error('请输入正数'))
      return
    }
    callback()
  }

  // 单箱数量：必须为正整数
  const positiveIntegerValidator = (_rule: any, value: any, callback: (err?: Error) => void) => {
    if (value === null || value === undefined || value === '') {
      callback()
      return
    }
    const num = Number(value)
    if (isNaN(num) || num <= 0 || !Number.isInteger(num)) {
      callback(new Error('请输入正整数'))
      return
    }
    callback()
  }

  const specRules: FormRules = {
    productNetWeight: [{ validator: positiveValidator, trigger: 'blur' }],
    productGrossWeight: [{ validator: positiveValidator, trigger: 'blur' }],
    productLength: [{ validator: positiveValidator, trigger: 'blur' }],
    productWidth: [{ validator: positiveValidator, trigger: 'blur' }],
    productHeight: [{ validator: positiveValidator, trigger: 'blur' }],
    productPackageLength: [{ validator: positiveValidator, trigger: 'blur' }],
    productPackageWidth: [{ validator: positiveValidator, trigger: 'blur' }],
    productPackageHeight: [{ validator: positiveValidator, trigger: 'blur' }],
    boxNetWeight: [{ validator: positiveValidator, trigger: 'blur' }],
    boxGrossWeight: [{ validator: positiveValidator, trigger: 'blur' }],
    boxNum: [{ validator: positiveIntegerValidator, trigger: 'blur' }],
    boxLength: [{ validator: positiveValidator, trigger: 'blur' }],
    boxWidth: [{ validator: positiveValidator, trigger: 'blur' }],
    boxHeight: [{ validator: positiveValidator, trigger: 'blur' }]
  }

  const imperialSpecRules: FormRules = {
    productNetWeightLb: [{ validator: positiveValidator, trigger: 'blur' }],
    productGrossWeightLb: [{ validator: positiveValidator, trigger: 'blur' }],
    productLengthInch: [{ validator: positiveValidator, trigger: 'blur' }],
    productWidthInch: [{ validator: positiveValidator, trigger: 'blur' }],
    productHeightInch: [{ validator: positiveValidator, trigger: 'blur' }],
    productPackageLengthInch: [{ validator: positiveValidator, trigger: 'blur' }],
    productPackageWidthInch: [{ validator: positiveValidator, trigger: 'blur' }],
    productPackageHeightInch: [{ validator: positiveValidator, trigger: 'blur' }],
    boxNetWeightLb: [{ validator: positiveValidator, trigger: 'blur' }],
    boxGrossWeightLb: [{ validator: positiveValidator, trigger: 'blur' }],
    boxNum: [{ validator: positiveIntegerValidator, trigger: 'blur' }],
    boxLengthInch: [{ validator: positiveValidator, trigger: 'blur' }],
    boxWidthInch: [{ validator: positiveValidator, trigger: 'blur' }],
    boxHeightInch: [{ validator: positiveValidator, trigger: 'blur' }]
  }
  const isConverting = ref(false) // 防止转换时的循环更新
  const { dictData } = useDictStore()
  const basicData: any = inject('basicData')
  const categoryAll = ref(basicData.categoryAll)
  const brandAll = ref(basicData.brandAll)
  const userAll = ref(basicData.userAll)
  const storeAll = ref(basicData.storeAll)

  /**
   * 在树形数据中查找指定 id 的节点
   */
  const findNodeById = (nodes: any[], id: any): any => {
    if (!nodes || !Array.isArray(nodes)) return null
    for (const node of nodes) {
      if (node.id === id) {
        return node
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeById(node.children, id)
        if (found) return found
      }
    }
    return null
  }

  /**
   * 查找从根节点到目标节点的路径
   */
  const findPathToNode = (nodes: any[], targetId: any, path: any[] = []): any[] | null => {
    if (!nodes || !Array.isArray(nodes)) return null
    for (const node of nodes) {
      const currentPath = [...path, node]
      if (node.id === targetId) {
        return currentPath
      }
      if (node.children && node.children.length > 0) {
        const found = findPathToNode(node.children, targetId, currentPath)
        if (found) return found
      }
    }
    return null
  }

  /**
   * 更新分类的 id 和 name（包含上级路径）
   */
  const updateCategoryFields = (categoryId: any) => {
    if (!categoryId) {
      formData.categoryId = ''
      formData.categoryName = ''
      return
    }
    const node = findNodeById(categoryAll.value, categoryId)
    if (node) {
      formData.categoryId = node.id
      // 查找从根到当前节点的路径
      const path = findPathToNode(categoryAll.value, categoryId)
      if (path && path.length > 0) {
        // 构建路径字符串，格式：父级1 / 父级2 / 当前节点
        formData.categoryName = path.map((n) => n.categoryName).join(' / ')
      } else {
        formData.categoryName = node.categoryName
      }
    } else {
      formData.categoryId = categoryId
      formData.categoryName = ''
    }
  }

  /**
   * 更新品牌的 id 和 name
   */
  const updateBrandFields = (brandId: any) => {
    if (!brandId) {
      formData.brandName = ''
      return
    }
    const brand = brandAll.value?.find((item: any) => item.value === brandId)
    if (brand) {
      formData.brandName = brand.label
    } else {
      formData.brandName = ''
    }
  }

  const formData = reactive({
    category: '',
    categoryId: '',
    categoryName: '',
    brandId: '',
    brandName: '',
    material: '',
    purpose: '',
    unit: '',
    productStatus: '',
    productDeveloperUserList: '',
    productOwnerUserList: '',
    accountIdList: '',
    productRemark: '',
    attachList: [] as Array<{ name: string; file: File }>,
    weightUnits: {
      productNetWeightUnit: 'g',
      productGrossWeightUnit: 'g',
      boxNetWeightUnit: 'g',
      boxGrossWeightUnit: 'g'
    },
    specs: {
      metric: {
        productNetWeight: null as number | null,
        productGrossWeight: null as number | null,
        productLength: null as number | null,
        productWidth: null as number | null,
        productHeight: null as number | null,
        productPackageLength: null as number | null,
        productPackageWidth: null as number | null,
        productPackageHeight: null as number | null,
        boxLength: null as number | null,
        boxWidth: null as number | null,
        boxHeight: null as number | null,
        boxNetWeight: null as number | null,
        boxGrossWeight: null as number | null,
        boxNum: null as number | null
      },
      imperial: {
        productNetWeightLb: null as number | null,
        productGrossWeightLb: null as number | null,
        productLengthInch: null as number | null,
        productWidthInch: null as number | null,
        productHeightInch: null as number | null,
        boxNetWeightLb: null as number | null,
        boxGrossWeightLb: null as number | null,
        boxNum: null as number | null,
        productPackageLengthInch: null as number | null,
        productPackageWidthInch: null as number | null,
        productPackageHeightInch: null as number | null,
        boxLengthInch: null as number | null,
        boxWidthInch: null as number | null,
        boxHeightInch: null as number | null
      }
    }
  })

  // 转换常量
  const CONVERSION_RATES = {
    // 重量转换：1g = 0.0022lb, 1kg = 2.2lb
    gToLb: 0.0022,
    kgToLb: 2.2,
    lbToG: 1 / 0.0022,
    lbToKg: 1 / 2.2,
    // 尺寸转换：1cm = 0.394inch
    cmToInch: 0.394,
    inchToCm: 1 / 0.394
  }

  // 重量转换函数
  const convertWeight = (
    value: number | null,
    fromUnit: 'g' | 'kg' | 'lb',
    toUnit: 'g' | 'kg' | 'lb'
  ): number | null => {
    if (value === null || value === undefined) return null

    // 先转换为克
    let grams: number
    if (fromUnit === 'g') {
      grams = value
    } else if (fromUnit === 'kg') {
      grams = value * 1000
    } else {
      // fromUnit === 'lb'
      grams = value * CONVERSION_RATES.lbToG
    }

    // 再转换为目标单位
    if (toUnit === 'g') {
      return grams
    } else if (toUnit === 'kg') {
      return grams / 1000
    } else {
      // toUnit === 'lb'
      return grams * CONVERSION_RATES.gToLb
    }
  }

  // 尺寸转换函数
  const convertDimension = (
    value: number | null,
    fromUnit: 'cm' | 'inch',
    toUnit: 'cm' | 'inch'
  ): number | null => {
    if (value === null || value === undefined) return null

    if (fromUnit === 'cm' && toUnit === 'inch') {
      return value * CONVERSION_RATES.cmToInch
    } else if (fromUnit === 'inch' && toUnit === 'cm') {
      return value * CONVERSION_RATES.inchToCm
    }
    return value
  }

  // 处理重量变化和转换
  const handleWeightChange = (
    field: string,
    fromSystem: 'metric' | 'imperial',
    toSystem: 'metric' | 'imperial'
  ) => {
    if (isConverting.value) return

    // 字段名映射：metric使用productNetWeight/productGrossWeight/boxNetWeight/boxGrossWeight，imperial使用productNetWeightLb/productGrossWeightLb/boxNetWeightLb/boxGrossWeightLb
    const getFieldName = (system: 'metric' | 'imperial', fieldName: string) => {
      if (fieldName === 'productNetWeight' && system === 'imperial') {
        return 'productNetWeightLb'
      }
      if (fieldName === 'productNetWeightLb' && system === 'metric') {
        return 'productNetWeight'
      }
      if (fieldName === 'productGrossWeight' && system === 'imperial') {
        return 'productGrossWeightLb'
      }
      if (fieldName === 'productGrossWeightLb' && system === 'metric') {
        return 'productGrossWeight'
      }
      if (fieldName === 'boxNetWeight' && system === 'imperial') {
        return 'boxNetWeightLb'
      }
      if (fieldName === 'boxNetWeightLb' && system === 'metric') {
        return 'boxNetWeight'
      }
      if (fieldName === 'boxGrossWeight' && system === 'imperial') {
        return 'boxGrossWeightLb'
      }
      if (fieldName === 'boxGrossWeightLb' && system === 'metric') {
        return 'boxGrossWeight'
      }
      return fieldName
    }

    const fromField = getFieldName(fromSystem, field)
    const toField = getFieldName(toSystem, field)

    const value = formData.specs[fromSystem][fromField as keyof typeof formData.specs.metric]
    if (value === null || value === undefined) {
      formData.specs[toSystem][toField as keyof typeof formData.specs.metric] = null
      return
    }

    isConverting.value = true
    try {
      // weightUnits映射：
      // productNetWeight/productNetWeightLb -> productNetWeightUnit
      // productGrossWeight/productGrossWeightLb -> productGrossWeightUnit
      // boxNetWeight/boxNetWeightLb -> boxNetWeightUnit
      // boxGrossWeight/boxGrossWeightLb -> boxGrossWeightUnit
      const getWeightUnitKey = (fieldName: string) => {
        if (fieldName === 'productNetWeight' || fieldName === 'productNetWeightLb') {
          return 'productNetWeightUnit'
        }
        if (fieldName === 'productGrossWeight' || fieldName === 'productGrossWeightLb') {
          return 'productGrossWeightUnit'
        }
        if (fieldName === 'boxNetWeight' || fieldName === 'boxNetWeightLb') {
          return 'boxNetWeightUnit'
        }
        if (fieldName === 'boxGrossWeight' || fieldName === 'boxGrossWeightLb') {
          return 'boxGrossWeightUnit'
        }
        return fieldName
      }
      const weightUnitKey = getWeightUnitKey(field)
      if (fromSystem === 'metric') {
        const currentUnit = formData.weightUnits[
          weightUnitKey as keyof typeof formData.weightUnits
        ] as 'g' | 'kg'
        const converted = convertWeight(value, currentUnit, 'lb')
        formData.specs.imperial[toField as keyof typeof formData.specs.imperial] = converted
      } else {
        const currentUnit = formData.weightUnits[
          weightUnitKey as keyof typeof formData.weightUnits
        ] as 'g' | 'kg'
        const converted = convertWeight(value, 'lb', currentUnit)
        formData.specs.metric[toField as keyof typeof formData.specs.metric] = converted
      }
    } finally {
      isConverting.value = false
    }
  }

  // 处理单位切换（带旧值计算）
  // 注意：当 @change 事件触发时，v-model 已经更新为新值，所以需要从新值推断旧值
  const handleUnitChangeWithOldValue = (field: string, newValue: 'g' | 'kg') => {
    // 如果新值是 'g'，那么旧值一定是 'kg'；如果新值是 'kg'，那么旧值一定是 'g'
    const oldValue: 'g' | 'kg' = newValue === 'g' ? 'kg' : 'g'
    handleUnitChange(field, oldValue, newValue)
  }

  // 处理单位切换
  const handleUnitChange = (field: string, oldValue: 'g' | 'kg', newValue: 'g' | 'kg') => {
    if (isConverting.value) return

    // 字段名映射：metric使用productNetWeight/productGrossWeight/boxNetWeight/boxGrossWeight，imperial使用productNetWeightLb/productGrossWeightLb/boxNetWeightLb/boxGrossWeightLb
    const getMetricField = (fieldName: string) => {
      if (fieldName === 'productNetWeightLb') {
        return 'productNetWeight'
      }
      if (fieldName === 'productGrossWeightLb') {
        return 'productGrossWeight'
      }
      if (fieldName === 'boxNetWeightLb') {
        return 'boxNetWeight'
      }
      if (fieldName === 'boxGrossWeightLb') {
        return 'boxGrossWeight'
      }
      return fieldName
    }
    const getImperialField = (fieldName: string) => {
      if (fieldName === 'productNetWeight') {
        return 'productNetWeightLb'
      }
      if (fieldName === 'productGrossWeight') {
        return 'productGrossWeightLb'
      }
      if (fieldName === 'boxNetWeight') {
        return 'boxNetWeightLb'
      }
      if (fieldName === 'boxGrossWeight') {
        return 'boxGrossWeightLb'
      }
      return fieldName
    }
    const metricField = getMetricField(field)
    const imperialField = getImperialField(field)

    const value = formData.specs.metric[metricField as keyof typeof formData.specs.metric]
    if (value === null || value === undefined) return

    isConverting.value = true
    try {
      // 先转换为克
      let grams: number
      if (oldValue === 'g') {
        grams = value
      } else {
        grams = value * 1000
      }

      // 再转换为新单位
      if (newValue === 'g') {
        formData.specs.metric[metricField as keyof typeof formData.specs.metric] = grams
      } else {
        formData.specs.metric[metricField as keyof typeof formData.specs.metric] = grams / 1000
      }

      // 更新英制单位的值
      const lbValue = grams * CONVERSION_RATES.gToLb
      formData.specs.imperial[imperialField as keyof typeof formData.specs.imperial] = lbValue
    } finally {
      isConverting.value = false
    }
  }

  // 处理尺寸变化和转换
  const handleDimensionChange = (
    prefix: 'singleItem' | 'package' | 'singleBox',
    fromSystem: 'metric' | 'imperial'
  ) => {
    if (isConverting.value) return

    // 字段名映射：
    // singleItem在metric使用productLength/Width/Height，在imperial使用productLengthInch/WidthInch/HeightInch
    // package在metric使用productPackageLength/Width/Height，在imperial使用productPackageLengthInch/WidthInch/HeightInch
    // singleBox在metric使用boxLength/Width/Height，在imperial使用boxLengthInch/WidthInch/HeightInch
    const getFieldName = (
      system: 'metric' | 'imperial',
      fieldType: 'Length' | 'Width' | 'Height'
    ) => {
      if (prefix === 'singleItem') {
        if (system === 'metric') {
          return fieldType === 'Length'
            ? 'productLength'
            : fieldType === 'Width'
              ? 'productWidth'
              : 'productHeight'
        } else {
          return fieldType === 'Length'
            ? 'productLengthInch'
            : fieldType === 'Width'
              ? 'productWidthInch'
              : 'productHeightInch'
        }
      }
      if (prefix === 'package') {
        if (system === 'metric') {
          return fieldType === 'Length'
            ? 'productPackageLength'
            : fieldType === 'Width'
              ? 'productPackageWidth'
              : 'productPackageHeight'
        } else {
          return fieldType === 'Length'
            ? 'productPackageLengthInch'
            : fieldType === 'Width'
              ? 'productPackageWidthInch'
              : 'productPackageHeightInch'
        }
      }
      if (prefix === 'singleBox') {
        if (system === 'metric') {
          return fieldType === 'Length'
            ? 'boxLength'
            : fieldType === 'Width'
              ? 'boxWidth'
              : 'boxHeight'
        } else {
          return fieldType === 'Length'
            ? 'boxLengthInch'
            : fieldType === 'Width'
              ? 'boxWidthInch'
              : 'boxHeightInch'
        }
      }
      return `${prefix}${fieldType}` as keyof typeof formData.specs.metric
    }

    const metricLengthField = getFieldName('metric', 'Length')
    const metricWidthField = getFieldName('metric', 'Width')
    const metricHeightField = getFieldName('metric', 'Height')
    const imperialLengthField = getFieldName('imperial', 'Length')
    const imperialWidthField = getFieldName('imperial', 'Width')
    const imperialHeightField = getFieldName('imperial', 'Height')

    isConverting.value = true
    try {
      if (fromSystem === 'metric') {
        formData.specs.imperial[imperialLengthField as keyof typeof formData.specs.imperial] =
          convertDimension(
            formData.specs.metric[metricLengthField as keyof typeof formData.specs.metric] as
              | number
              | null,
            'cm',
            'inch'
          )
        formData.specs.imperial[imperialWidthField as keyof typeof formData.specs.imperial] =
          convertDimension(
            formData.specs.metric[metricWidthField as keyof typeof formData.specs.metric] as
              | number
              | null,
            'cm',
            'inch'
          )
        formData.specs.imperial[imperialHeightField as keyof typeof formData.specs.imperial] =
          convertDimension(
            formData.specs.metric[metricHeightField as keyof typeof formData.specs.metric] as
              | number
              | null,
            'cm',
            'inch'
          )
      } else {
        formData.specs.metric[metricLengthField as keyof typeof formData.specs.metric] =
          convertDimension(
            formData.specs.imperial[imperialLengthField as keyof typeof formData.specs.imperial] as
              | number
              | null,
            'inch',
            'cm'
          )
        formData.specs.metric[metricWidthField as keyof typeof formData.specs.metric] =
          convertDimension(
            formData.specs.imperial[imperialWidthField as keyof typeof formData.specs.imperial] as
              | number
              | null,
            'inch',
            'cm'
          )
        formData.specs.metric[metricHeightField as keyof typeof formData.specs.metric] =
          convertDimension(
            formData.specs.imperial[imperialHeightField as keyof typeof formData.specs.imperial] as
              | number
              | null,
            'inch',
            'cm'
          )
      }
    } finally {
      isConverting.value = false
    }
  }

  const rules: FormRules = {
    productRemark: [{ max: 100, message: '产品备注最大长度为100个字符', trigger: 'blur' }]
    // category: [{ required: true, message: '请选择分类', trigger: 'change' }],
    // brandId: [{ required: true, message: '请选择品牌', trigger: 'change' }],
    // unit: [{ required: true, message: '请选择单位', trigger: 'change' }],
    // productStatus: [{ required: true, message: '请选择状态', trigger: 'change' }],
    // productDeveloperUserList : [{ required: true, message: '请选择开发人', trigger: 'change' }],
    // productOwnerUserList: [{ required: true, message: '请选择产品负责人', trigger: 'change' }],
    // accountIdList: [{ required: true, message: '请选择分配店铺', trigger: 'change' }]
  }

  // 验证表单
  const validate = async () => {
    try {
      if (formRef.value) {
        await formRef.value.validate()
      }
      if (metricSpecFormRef.value) {
        await metricSpecFormRef.value.validate()
      }
      if (imperialSpecFormRef.value) {
        await imperialSpecFormRef.value.validate()
      }
      return true
    } catch (error) {
      console.error('基础信息验证失败:', error)
      return false
    }
  }

  // 清除验证
  const clearValidate = () => {
    formRef.value?.clearValidate()
    metricSpecFormRef.value?.clearValidate()
    imperialSpecFormRef.value?.clearValidate()
  }

  // 监听数据变化，同步到父组件
  watch(
    formData,
    (newVal) => {
      emit('update:modelValue', newVal)
    },
    { deep: true }
  )

  // 监听外部数据变化
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        Object.assign(formData, newVal)
        // 同步重量单位（如果外部数据中有 weightUnits，确保正确合并）
        if (newVal.weightUnits) {
          Object.assign(formData.weightUnits, newVal.weightUnits)
        }
        // 确保公制单品净重和毛重单位默认为 'g'
        if (!formData.weightUnits.productNetWeightUnit) {
          formData.weightUnits.productNetWeightUnit = 'g'
        }
        if (!formData.weightUnits.productGrossWeightUnit) {
          formData.weightUnits.productGrossWeightUnit = 'g'
        }
        // 如果外部数据中有 category，更新 categoryId 和 categoryName
        if (newVal.category) {
          updateCategoryFields(newVal.category)
        }
        // 如果外部数据中有 brandId，更新 brandName
        if (newVal.brandId) {
          updateBrandFields(newVal.brandId)
        }
      }
    },
    { deep: true, immediate: true }
  )

  // 监听分类变化，自动更新 categoryId 和 categoryName
  watch(
    () => formData.category,
    (newVal) => {
      updateCategoryFields(newVal)
    }
  )

  // 监听品牌变化，自动更新 brandName
  watch(
    () => formData.brandId,
    (newVal) => {
      updateBrandFields(newVal)
    }
  )

  // 同步单箱数量（公制和英制保持一致）
  watch(
    () => formData.specs.metric.boxNum,
    (newVal) => {
      if (!isConverting.value) {
        isConverting.value = true
        formData.specs.imperial.boxNum = newVal
        isConverting.value = false
      }
    }
  )

  watch(
    () => formData.specs.imperial.boxNum,
    (newVal) => {
      if (!isConverting.value) {
        isConverting.value = true
        formData.specs.metric.boxNum = newVal
        isConverting.value = false
      }
    }
  )

  defineExpose({
    validate,
    clearValidate
  })
</script>

<style lang="scss" scoped>
  .basic-info {
    margin-top: 8px;

    .section {
      margin-bottom: 30px;

      &:last-child {
        margin-bottom: 0;
      }

      .section-header {
        display: flex;
        align-items: center;
        justify-content: flex-start;
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

        .unit-switcher {
          display: flex;
          gap: 0;
          align-items: center;
          margin-left: 14px;

          .unit-btn {
            padding: 6px 20px;
            font-size: 14px;
            line-height: 1.5;
            color: var(--el-text-color-regular);
            cursor: pointer;
            background: transparent;
            border: 1px solid transparent;
            border-color: #ccc;
            border-radius: 4px;
            outline: none;
            transition: all 0.3s;

            &:first-child {
              border-right: none;
              border-top-right-radius: 0;
              border-bottom-right-radius: 0;
            }

            &:last-child {
              border-top-left-radius: 0;
              border-bottom-left-radius: 0;
            }

            &:not(.active) {
              color: var(--el-text-color-regular);
              background-color: #f5f7fa;
            }

            &.active {
              position: relative;
              z-index: 1;
              color: #5d87ff;
              background-color: #fff;
              border-color: #5d87ff;
            }

            &:hover:not(.active) {
              color: #5d87ff;
            }
          }
        }
      }
    }

    :deep(.el-form-item__content) {
      .el-input__wrapper,
      .el-select__wrapper {
        max-width: 240px;
      }
    }

    .attachment-section {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
    }

    .input-with-unit {
      display: flex;
      gap: 8px;
      align-items: center;

      &.no-space {
        gap: 0;

        .el-input:first-child {
          border-right-width: 0;
        }
      }

      .unit {
        min-width: 30px;
        font-size: 14px;
        color: var(--el-text-color-regular);
      }

      .unit-select {
        width: 70px;
        margin-left: -1px;
      }
    }

    .dimension-inputs {
      display: flex;
      gap: 8px;
      align-items: flex-start;

      .unit {
        margin-top: 8px;
        margin-left: 4px;
        font-size: 14px;
        color: var(--el-text-color-regular);
      }

      .inline-spec-item {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        margin-bottom: 0;

        :deep(.el-form-item__content) {
          margin-left: 0 !important;
        }

        :deep(.el-form-item__error) {
          position: absolute;
          top: 100%;
          left: 0;
          padding-top: 2px;
        }
      }
    }

    .spec-tabs {
      /* 规格信息表单项：错误提示在表单项下方（使用 Element Plus 默认定位） */
      :deep(.el-form-item__content) {
        flex-direction: column;
        align-items: flex-start;
      }

      :deep(.el-form-item__error) {
        position: absolute;
        top: 100%;
        left: 0;
      }

      :deep(.el-tabs__header) {
        display: none;
      }

      :deep(.el-tabs__content) {
        padding: 16px 0;
      }
    }
  }
</style>
