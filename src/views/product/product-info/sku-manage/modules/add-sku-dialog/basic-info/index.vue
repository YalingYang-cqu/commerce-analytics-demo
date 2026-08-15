<template>
  <div class="basic-info">
    <!-- 基本信息 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">基本信息</span>
      </div>
      <ElForm ref="formRef" :model="formData" :rules="rules" label-width="90px" class="basic-form">
        <ElRow :gutter="20">
          <ElCol :span="6">
            <ElFormItem label="分类:" prop="categoryId" required>
              <ElCascader
                v-model="formData.categoryId"
                placeholder="请选择"
                :options="categoryOptions"
                :props="cascaderProps"
                filterable
                clearable
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="品牌:" prop="brandId" required>
              <MkSelect
                v-model="formData.brandId"
                placeholder="请选择"
                :options="brandOptionsNormalized"
                :label-value="{ name: 'label', value: 'value' }"
                filterable
                clearable
                :always-filter-input="true"
                width="100%"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="材质:" prop="material">
              <ElInput
                v-model="formData.material"
                placeholder="请输入"
                maxlength="50"
                show-word-limit
                clearable
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="用途:" prop="purpose">
              <ElInput
                v-model="formData.purpose"
                placeholder="请输入"
                maxlength="200"
                show-word-limit
                clearable
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="单位:" prop="unit" required>
              <MkSelect
                v-model="formData.unit"
                placeholder="请选择"
                :options="unitOptions"
                :label-value="{ name: 'label', value: 'value' }"
                filterable
                clearable
                :always-filter-input="true"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="规格描述:" prop="specificationDescription">
              <ElInput
                v-model="formData.specificationDescription"
                type="textarea"
                :rows="1"
                placeholder="请输入"
                maxlength="500"
                show-word-limit
                clearable
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="状态:" prop="productStatus">
              <MkSelect
                v-model="formData.productStatus"
                placeholder="请选择"
                :options="productStatusOptions"
                :label-value="{ name: 'label', value: 'value' }"
                filterable
                clearable
                :always-filter-input="true"
                width="100%"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="开发人:" prop="productDeveloperUserList">
              <MkSelect
                v-model="formData.productDeveloperUserList"
                placeholder="请选择"
                :options="userOptions"
                :label-value="{ name: 'label', value: 'value' }"
                filterable
                clearable
                multiple
                collapse-tags
                collapse-tags-tooltip
                :always-filter-input="true"
                width="100%"
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="6">
            <ElFormItem label="产品负责人:" prop="productOwnerUserList">
              <MkSelect
                v-model="formData.productOwnerUserList"
                placeholder="请选择"
                :options="userOptions"
                :label-value="{ name: 'label', value: 'value' }"
                filterable
                clearable
                multiple
                collapse-tags
                collapse-tags-tooltip
                :always-filter-input="true"
                width="100%"
              />
            </ElFormItem>
          </ElCol>
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
              />
            </ElFormItem>
          </ElCol>
          <ElCol :span="18">
            <ElFormItem label="附件:">
              <FileUpload
                v-model="formData.attachments"
                :max-count="5"
                :max-size="200 * 1024 * 1024"
                accept=".docx,.doc,.pdf,.txt,.xlsx,.xls,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.bmp,.gif,.zip,.rar,.7z,.ico,.svg"
                list-type="text"
              >
                <template #trigger>
                  <ElButton type="primary" link :icon="Upload">上传附件</ElButton>
                </template>
              </FileUpload>
            </ElFormItem>
          </ElCol>
        </ElRow>
      </ElForm>
    </div>

    <!-- 规格信息 -->
    <div class="section spec-section">
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
      <div class="spec-content-wrapper">
        <ElTabs v-model="specUnit" class="spec-tabs">
          <ElTabPane label="公制" name="metric">
            <ElForm :model="formData.specs.metric" label-width="100px">
              <ElRow :gutter="20">
                <ElCol :span="6">
                  <ElFormItem label="单品净重:">
                    <div class="input-with-unit no-space">
                      <ElInputNumber
                        v-model="formData.specs.metric.productNetWeight"
                        placeholder="请输入"
                        :min="0"
                        :precision="4"
                        :max="999999999"
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
                  <ElFormItem label="单品毛重:">
                    <div class="input-with-unit no-space">
                      <ElInputNumber
                        v-model="formData.specs.metric.productGrossWeight"
                        placeholder="请输入"
                        :min="0"
                        :precision="4"
                        :max="999999999"
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
                      <ElInputNumber
                        v-model="formData.specs.metric.productLength"
                        placeholder="长"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('singleItem', 'metric')"
                      />
                      <ElInputNumber
                        v-model="formData.specs.metric.productWidth"
                        placeholder="宽"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('singleItem', 'metric')"
                      />
                      <ElInputNumber
                        v-model="formData.specs.metric.productHeight"
                        placeholder="高"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('singleItem', 'metric')"
                      />
                      <span class="unit">cm</span>
                    </div>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="包装尺寸:">
                    <div class="dimension-inputs">
                      <ElInputNumber
                        v-model="formData.specs.metric.productPackageLength"
                        placeholder="长"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('package', 'metric')"
                      />
                      <ElInputNumber
                        v-model="formData.specs.metric.productPackageWidth"
                        placeholder="宽"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('package', 'metric')"
                      />
                      <ElInputNumber
                        v-model="formData.specs.metric.productPackageHeight"
                        placeholder="高"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('package', 'metric')"
                      />
                      <span class="unit">cm</span>
                    </div>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="单箱净重:">
                    <div class="input-with-unit no-space">
                      <ElInputNumber
                        v-model="formData.specs.metric.boxNetWeight"
                        placeholder="请输入"
                        :min="0"
                        :precision="4"
                        :max="999999999"
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
                  <ElFormItem label="单箱毛重:">
                    <div class="input-with-unit no-space">
                      <ElInputNumber
                        v-model="formData.specs.metric.boxGrossWeight"
                        placeholder="请输入"
                        :min="0"
                        :precision="4"
                        :max="999999999"
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
                  <ElFormItem label="单箱数量:">
                    <div class="input-with-unit">
                      <ElInputNumber
                        v-model="formData.specs.metric.boxNum"
                        placeholder="请输入"
                        :min="0"
                        :precision="0"
                        :max="999999999"
                        :controls="false"
                      />
                      <span class="unit">pcs</span>
                    </div>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="单箱尺寸:">
                    <div class="dimension-inputs">
                      <ElInputNumber
                        v-model="formData.specs.metric.boxLength"
                        placeholder="长"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('singleBox', 'metric')"
                      />
                      <ElInputNumber
                        v-model="formData.specs.metric.boxWidth"
                        placeholder="宽"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('singleBox', 'metric')"
                      />
                      <ElInputNumber
                        v-model="formData.specs.metric.boxHeight"
                        placeholder="高"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('singleBox', 'metric')"
                      />
                      <span class="unit">cm</span>
                    </div>
                  </ElFormItem>
                </ElCol>
              </ElRow>
            </ElForm>
          </ElTabPane>
          <ElTabPane label="英制" name="imperial">
            <ElForm :model="formData.specs.imperial" label-width="100px">
              <ElRow :gutter="20">
                <ElCol :span="6">
                  <ElFormItem label="单品净重:">
                    <div class="input-with-unit">
                      <ElInputNumber
                        v-model="formData.specs.imperial.productNetWeightLb"
                        placeholder="请输入"
                        :min="0"
                        :precision="4"
                        :max="999999999"
                        :controls="false"
                        @change="handleWeightChange('productNetWeightLb', 'imperial', 'metric')"
                      />
                      <span class="unit">lb</span>
                    </div>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="单品毛重:">
                    <div class="input-with-unit">
                      <ElInputNumber
                        v-model="formData.specs.imperial.productGrossWeightLb"
                        placeholder="请输入"
                        :min="0"
                        :precision="4"
                        :max="999999999"
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
                      <ElInputNumber
                        v-model="formData.specs.imperial.productLengthInch"
                        placeholder="长"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('singleItem', 'imperial')"
                      />
                      <ElInputNumber
                        v-model="formData.specs.imperial.productWidthInch"
                        placeholder="宽"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('singleItem', 'imperial')"
                      />
                      <ElInputNumber
                        v-model="formData.specs.imperial.productHeightInch"
                        placeholder="高"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('singleItem', 'imperial')"
                      />
                      <span class="unit">inch</span>
                    </div>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="包装尺寸:">
                    <div class="dimension-inputs">
                      <ElInputNumber
                        v-model="formData.specs.imperial.productPackageLengthInch"
                        placeholder="长"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('package', 'imperial')"
                      />
                      <ElInputNumber
                        v-model="formData.specs.imperial.productPackageWidthInch"
                        placeholder="宽"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('package', 'imperial')"
                      />
                      <ElInputNumber
                        v-model="formData.specs.imperial.productPackageHeightInch"
                        placeholder="高"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('package', 'imperial')"
                      />
                      <span class="unit">inch</span>
                    </div>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="单箱净重:">
                    <div class="input-with-unit">
                      <ElInputNumber
                        v-model="formData.specs.imperial.boxNetWeightLb"
                        placeholder="请输入"
                        :min="0"
                        :precision="4"
                        :max="999999999"
                        :controls="false"
                        @change="handleWeightChange('boxNetWeightLb', 'imperial', 'metric')"
                      />
                      <span class="unit">lb</span>
                    </div>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="单箱毛重:">
                    <div class="input-with-unit">
                      <ElInputNumber
                        v-model="formData.specs.imperial.boxGrossWeightLb"
                        placeholder="请输入"
                        :min="0"
                        :precision="4"
                        :max="999999999"
                        :controls="false"
                        @change="handleWeightChange('boxGrossWeightLb', 'imperial', 'metric')"
                      />
                      <span class="unit">lb</span>
                    </div>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="单箱数量:">
                    <div class="input-with-unit">
                      <ElInputNumber
                        v-model="formData.specs.imperial.boxNum"
                        placeholder="请输入"
                        :min="0"
                        :precision="0"
                        :max="999999999"
                        :controls="false"
                      />
                      <span class="unit">pcs</span>
                    </div>
                  </ElFormItem>
                </ElCol>
                <ElCol :span="6">
                  <ElFormItem label="单箱尺寸:">
                    <div class="dimension-inputs">
                      <ElInputNumber
                        v-model="formData.specs.imperial.boxLengthInch"
                        placeholder="长"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('singleBox', 'imperial')"
                      />
                      <ElInputNumber
                        v-model="formData.specs.imperial.boxWidthInch"
                        placeholder="宽"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('singleBox', 'imperial')"
                      />
                      <ElInputNumber
                        v-model="formData.specs.imperial.boxHeightInch"
                        placeholder="高"
                        :min="0"
                        :precision="2"
                        :max="999999999"
                        :controls="false"
                        @change="handleDimensionChange('singleBox', 'imperial')"
                      />
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
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, computed } from 'vue'
  import {
    ElForm,
    ElFormItem,
    ElInput,
    ElInputNumber,
    ElSelect,
    ElOption,
    ElCascader,
    ElButton,
    ElRow,
    ElCol,
    ElTabs,
    ElTabPane,
    type FormInstance,
    type FormRules
  } from 'element-plus'
  import { Upload } from '@element-plus/icons-vue'
  import FileUpload from '@/components/core/upload-custom-attachments/index.vue'
  import MkSelect from '@/components/core/others/mk-select/index.vue'
  import { useDictStore } from '@/store/modules/dict'

  /** 字段与控件说明（与产品资料-SKU功能说明一致）
   * - 分类：级联选择，数据源=父组件 categoryOptions（接口 categoryPageList 树形）
   * - 品牌：下拉，数据源=父组件 brandOptions（接口 brandPageList）
   * - 单位（计量单位）：下拉，数据源=字典 spuUnit，必填
   * - 状态：下拉，数据源=字典 productStatus
   * - 开发人/产品负责人：多选下拉，数据源=父组件 userOptions（接口 getAllUserInfo）
   * - 材质/用途：输入框，最多50字符
   */

  interface Props {
    modelValue: any
    categoryOptions?: any[]
    brandOptions?: any[]
    userOptions?: any[]
  }

  interface Emits {
    (e: 'update:modelValue', value: any): void
  }

  const props = withDefaults(defineProps<Props>(), {
    categoryOptions: () => [],
    brandOptions: () => [],
    userOptions: () => []
  })

  const emit = defineEmits<Emits>()

  const formRef = ref<FormInstance>()
  const specUnit = ref<'metric' | 'imperial'>('metric')
  const isConverting = ref(false) // 防止转换时的循环更新

  const { dictData } = useDictStore()

  /** 统一选项 value 类型：接口常返回 number（如 productStatus=0、brandId=1），字典/接口可能为 string，导致 ElSelect 不匹配而显示数字 */
  const normalizeOptionValue = (v: any) => {
    if (v === null || v === undefined || v === '') return v
    const n = Number(v)
    return Number.isNaN(n) ? v : n
  }

  // 单位（计量单位）：数据源=字典 spuUnit，与列表展示一致；value 统一为数字或原值以便与表单匹配
  const unitOptions = computed(() =>
    (dictData?.spuUnit ?? []).map((opt: any) => ({
      ...opt,
      value: normalizeOptionValue(opt.value),
      label: opt.label ?? opt.dictItemName ?? opt.name ?? ''
    }))
  )
  // 状态：数据源=字典 productStatus；value 统一为 number，与接口返回的 productStatus(0/1/2/3) 一致
  const productStatusOptions = computed(() =>
    (dictData?.productStatus ?? []).map((opt: any) => ({
      ...opt,
      value: normalizeOptionValue(opt.value),
      label: opt.label ?? opt.dictItemName ?? ''
    }))
  )
  // 品牌：父组件传入，value 统一为 number 以便与 brandId 匹配显示文案
  const brandOptionsNormalized = computed(() =>
    (props.brandOptions ?? []).map((opt: any) => ({
      ...opt,
      value: normalizeOptionValue(opt.value),
      label: opt.label ?? opt.name ?? ''
    }))
  )

  // 表单数据
  const formData = reactive({
    id: null,
    categoryId: null,
    categoryName: null,
    brandId: null,
    brandName: null,
    material: null,
    purpose: null,
    unit: null,
    specificationDescription: '',
    productRemark: '',
    productStatus: null,
    productDeveloperUserList: [],
    productOwnerUserList: [],
    attachments: [],
    /** 规格单位制：0-公制，1-英制，用于保存前端切换的公制/英制 Tab 选择 */
    specUnitSystem: 0 as 0 | 1,
    // 重量单位
    weightUnits: {
      productNetWeightUnit: 'g',
      productGrossWeightUnit: 'g',
      boxNetWeightUnit: 'g',
      boxGrossWeightUnit: 'g'
    },
    // 规格信息
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
        productPackageLengthInch: null as number | null,
        productPackageWidthInch: null as number | null,
        productPackageHeightInch: null as number | null,
        boxNetWeightLb: null as number | null,
        boxGrossWeightLb: null as number | null,
        boxNum: null as number | null,
        boxLengthInch: null as number | null,
        boxWidthInch: null as number | null,
        boxHeightInch: null as number | null
      }
    }
  })

  // 级联选择器配置
  const cascaderProps = {
    // emitPath: false,
    // checkStrictly: false,
    // children: 'children',
    // label: 'categoryName',
    // value: 'id'
    emitPath: false,
    checkStrictly: true,
    children: 'children',
    label: 'categoryName',
    value: 'id'
  }

  // 表单验证规则（与产品资料-SKU功能说明字段说明一致：分类、品牌、计量单位必填）
  const rules: FormRules = {
    categoryId: [{ required: true, message: '请选择分类', trigger: 'change' }],
    brandId: [{ required: true, message: '请选择品牌', trigger: 'change' }],
    unit: [{ required: true, message: '请选择单位（计量单位）', trigger: 'change' }],
    material: [{ max: 50, message: '材质最大长度为50个字符', trigger: 'blur' }],
    purpose: [{ max: 200, message: '用途最大长度为200个字符', trigger: 'blur' }],
    specificationDescription: [
      { max: 500, message: '规格描述最大长度为500个字符', trigger: 'blur' }
    ],
    productRemark: [{ max: 100, message: '产品备注最大长度为100个字符', trigger: 'blur' }]
  }

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

    // 字段名映射
    const getFieldName = (system: 'metric' | 'imperial', fieldName: string) => {
      if (fieldName === 'productNetWeight' && system === 'imperial') return 'productNetWeightLb'
      if (fieldName === 'productNetWeightLb' && system === 'metric') return 'productNetWeight'
      if (fieldName === 'productGrossWeight' && system === 'imperial') return 'productGrossWeightLb'
      if (fieldName === 'productGrossWeightLb' && system === 'metric') return 'productGrossWeight'
      if (fieldName === 'boxNetWeight' && system === 'imperial') return 'boxNetWeightLb'
      if (fieldName === 'boxNetWeightLb' && system === 'metric') return 'boxNetWeight'
      if (fieldName === 'boxGrossWeight' && system === 'imperial') return 'boxGrossWeightLb'
      if (fieldName === 'boxGrossWeightLb' && system === 'metric') return 'boxGrossWeight'
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
  const handleUnitChangeWithOldValue = (field: string, newValue: 'g' | 'kg') => {
    const oldValue: 'g' | 'kg' = newValue === 'g' ? 'kg' : 'g'
    handleUnitChange(field, oldValue, newValue)
  }

  // 处理单位切换
  const handleUnitChange = (field: string, oldValue: 'g' | 'kg', newValue: 'g' | 'kg') => {
    if (isConverting.value) return

    const getMetricField = (fieldName: string) => {
      if (fieldName === 'productNetWeightLb') return 'productNetWeight'
      if (fieldName === 'productGrossWeightLb') return 'productGrossWeight'
      if (fieldName === 'boxNetWeightLb') return 'boxNetWeight'
      if (fieldName === 'boxGrossWeightLb') return 'boxGrossWeight'
      return fieldName
    }
    const getImperialField = (fieldName: string) => {
      if (fieldName === 'productNetWeight') return 'productNetWeightLb'
      if (fieldName === 'productGrossWeight') return 'productGrossWeightLb'
      if (fieldName === 'boxNetWeight') return 'boxNetWeightLb'
      if (fieldName === 'boxGrossWeight') return 'boxGrossWeightLb'
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

  // 监听分类选择,自动提取分类名称
  watch(
    () => formData.categoryId,
    (newCategoryId) => {
      if (newCategoryId) {
        // 递归查找分类名称
        const findCategoryName = (categories: any[], id: any): string | null => {
          for (const category of categories) {
            if (String(category.id) === String(id)) {
              return category.categoryName
            }
            if (category.children && category.children.length > 0) {
              const found = findCategoryName(category.children, id)
              if (found) return found
            }
          }
          return null
        }
        const categoryName = findCategoryName(props.categoryOptions, newCategoryId)
        if (categoryName) {
          formData.categoryName = categoryName
        }
      } else {
        formData.categoryName = null
      }
    }
  )

  // 监听品牌选择,自动提取品牌名称
  watch(
    () => formData.brandId,
    (newBrandId) => {
      if (newBrandId) {
        const brand = props.brandOptions.find(
          (b: any) => normalizeOptionValue(b.value) === normalizeOptionValue(newBrandId)
        )
        if (brand) {
          formData.brandName = brand.label
        }
      } else {
        formData.brandName = null
      }
    }
  )

  // 标记是否正在加载数据（防止加载时触发emit）
  const isLoadingData = ref(false)

  /** 分类树节点查找（id 与接口可能 string/number 不一致，级联必须能对上 options 里的 value） */
  function findCategoryNodeById(categories: any[] | undefined, id: any): any | null {
    if (id === null || id === undefined || id === '' || !categories?.length) return null
    for (const c of categories) {
      if (String(c.id) === String(id)) return c
      if (c.children?.length) {
        const hit = findCategoryNodeById(c.children, id)
        if (hit) return hit
      }
    }
    return null
  }

  /** 按详情展示路径「父 / 子」在树中解析叶子 id（仅当 categoryId 在树中不存在时兜底） */
  function findLeafIdByCategoryNamePath(categories: any[] | undefined, fullName: string): any {
    if (!fullName?.trim() || !categories?.length) return null
    const parts = fullName
      .split(/\s*\/\s*/)
      .map((s) => s.trim())
      .filter(Boolean)
    if (!parts.length) return null
    let level = categories
    let lastId: any = null
    for (const part of parts) {
      const node = level.find((n: any) => (n.categoryName || '').trim() === part)
      if (!node) return null
      lastId = node.id
      level = node.children || []
    }
    return lastId
  }

  /** 使 ElCascader 能回显：对齐树节点 id 类型，或在树中缺 id 时用 categoryName 路径解析 */
  const syncCategoryIdForCascader = () => {
    const opts = props.categoryOptions
    if (!opts?.length) return
    const cid = formData.categoryId
    const cname = formData.categoryName
    if (cid !== null && cid !== undefined && cid !== '') {
      const node = findCategoryNodeById(opts, cid)
      if (node) {
        formData.categoryId = node.id
        return
      }
    }
    if (cname && String(cname).trim()) {
      const leafId = findLeafIdByCategoryNamePath(opts, String(cname))
      if (leafId !== null && leafId !== undefined && leafId !== '') {
        const node = findCategoryNodeById(opts, leafId)
        formData.categoryId = node ? node.id : leafId
      }
    }
  }

  // 重置表单数据为初始值
  const resetFormData = () => {
    formData.id = null
    formData.categoryId = null
    formData.categoryName = null
    formData.brandId = null
    formData.brandName = null
    formData.material = null
    formData.purpose = null
    formData.unit = null
    formData.specificationDescription = ''
    formData.productRemark = ''
    formData.productStatus = null
    formData.productDeveloperUserList = []
    formData.productOwnerUserList = []
    formData.attachments = []
    formData.specUnitSystem = 0
    specUnit.value = 'metric'
    formData.weightUnits.productNetWeightUnit = 'g'
    formData.weightUnits.productGrossWeightUnit = 'g'
    formData.weightUnits.boxNetWeightUnit = 'g'
    formData.weightUnits.boxGrossWeightUnit = 'g'
    formData.specs.metric.productNetWeight = null
    formData.specs.metric.productGrossWeight = null
    formData.specs.metric.productLength = null
    formData.specs.metric.productWidth = null
    formData.specs.metric.productHeight = null
    formData.specs.metric.productPackageLength = null
    formData.specs.metric.productPackageWidth = null
    formData.specs.metric.productPackageHeight = null
    formData.specs.metric.boxNetWeight = null
    formData.specs.metric.boxGrossWeight = null
    formData.specs.metric.boxNum = null
    formData.specs.metric.boxLength = null
    formData.specs.metric.boxWidth = null
    formData.specs.metric.boxHeight = null
    formData.specs.imperial.productNetWeightLb = null
    formData.specs.imperial.productGrossWeightLb = null
    formData.specs.imperial.productLengthInch = null
    formData.specs.imperial.productWidthInch = null
    formData.specs.imperial.productHeightInch = null
    formData.specs.imperial.productPackageLengthInch = null
    formData.specs.imperial.productPackageWidthInch = null
    formData.specs.imperial.productPackageHeightInch = null
    formData.specs.imperial.boxNetWeightLb = null
    formData.specs.imperial.boxGrossWeightLb = null
    formData.specs.imperial.boxNum = null
    formData.specs.imperial.boxLengthInch = null
    formData.specs.imperial.boxWidthInch = null
    formData.specs.imperial.boxHeightInch = null
  }

  // 监听外部数据变化（优先执行，放在前面）
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal && Object.keys(newVal).length > 0) {
        // 有数据时，标记开始加载数据
        isLoadingData.value = true

        // 分类 id 保持接口原始类型，由 syncCategoryIdForCascader 与树节点对齐（强转 number 会与树里 string id 不一致导致级联空白）
        formData.id = newVal.id
        const catId = newVal.categoryId
        formData.categoryId = catId !== null && catId !== undefined && catId !== '' ? catId : null
        formData.categoryName = newVal.categoryName
        formData.brandId = newVal.brandId
        formData.brandName = newVal.brandName
        formData.material = newVal.material
        formData.purpose = newVal.purpose
        formData.unit = newVal.unit
        formData.specificationDescription =
          newVal.specificationDescription != null && newVal.specificationDescription !== undefined
            ? String(newVal.specificationDescription)
            : ''
        formData.productRemark =
          newVal.productRemark != null && newVal.productRemark !== undefined
            ? String(newVal.productRemark).slice(0, 100)
            : ''
        formData.productStatus = newVal.productStatus
        formData.productDeveloperUserList = newVal.productDeveloperUserList || []
        formData.productOwnerUserList = newVal.productOwnerUserList || []
        formData.attachments = newVal.attachments || []

        // 规格单位制：0-公制，1-英制；回显时根据接口值默认选对应 Tab（兼容后端返回 number 或 string）
        const specUnitVal = Number(newVal.specUnitSystem)
        formData.specUnitSystem = specUnitVal === 1 ? 1 : 0
        specUnit.value = formData.specUnitSystem === 1 ? 'imperial' : 'metric'

        // 重量单位映射
        formData.weightUnits.productNetWeightUnit = newVal.productNetWeightUnit || 'g'
        formData.weightUnits.productGrossWeightUnit = newVal.productGrossWeightUnit || 'g'
        formData.weightUnits.boxNetWeightUnit = newVal.boxNetWeightUnit || 'g'
        formData.weightUnits.boxGrossWeightUnit = newVal.boxGrossWeightUnit || 'g'

        // 规格信息 - 公制
        formData.specs.metric.productNetWeight = newVal.productNetWeight
        formData.specs.metric.productGrossWeight = newVal.productGrossWeight
        formData.specs.metric.productLength = newVal.productLength
        formData.specs.metric.productWidth = newVal.productWidth
        formData.specs.metric.productHeight = newVal.productHeight
        formData.specs.metric.productPackageLength = newVal.productPackageLength
        formData.specs.metric.productPackageWidth = newVal.productPackageWidth
        formData.specs.metric.productPackageHeight = newVal.productPackageHeight
        formData.specs.metric.boxNetWeight = newVal.boxNetWeight
        formData.specs.metric.boxGrossWeight = newVal.boxGrossWeight
        formData.specs.metric.boxNum = newVal.boxNum
        formData.specs.metric.boxLength = newVal.boxLength
        formData.specs.metric.boxWidth = newVal.boxWidth
        formData.specs.metric.boxHeight = newVal.boxHeight

        // 规格信息 - 英制
        formData.specs.imperial.productNetWeightLb = newVal.productNetWeightLb
        formData.specs.imperial.productGrossWeightLb = newVal.productGrossWeightLb
        formData.specs.imperial.productLengthInch = newVal.productLengthInch
        formData.specs.imperial.productWidthInch = newVal.productWidthInch
        formData.specs.imperial.productHeightInch = newVal.productHeightInch
        formData.specs.imperial.productPackageLengthInch = newVal.productPackageLengthInch
        formData.specs.imperial.productPackageWidthInch = newVal.productPackageWidthInch
        formData.specs.imperial.productPackageHeightInch = newVal.productPackageHeightInch
        formData.specs.imperial.boxNetWeightLb = newVal.boxNetWeightLb
        formData.specs.imperial.boxGrossWeightLb = newVal.boxGrossWeightLb
        formData.specs.imperial.boxNum = newVal.boxNum
        formData.specs.imperial.boxLengthInch = newVal.boxLengthInch
        formData.specs.imperial.boxWidthInch = newVal.boxWidthInch
        formData.specs.imperial.boxHeightInch = newVal.boxHeightInch

        // 对齐分类级联回显（须在解除 isLoadingData 前完成，避免多余 emit）
        nextTick(() => {
          syncCategoryIdForCascader()
          isLoadingData.value = false
          formRef.value?.clearValidate(['categoryId', 'brandId', 'unit'])
        })
      } else {
        // 空对象或 undefined 时，重置为初始值
        resetFormData()
      }
    },
    { immediate: true, deep: true }
  )

  // 分类树晚于详情到达时（如刷新下拉），再尝试回显级联
  watch(
    () => props.categoryOptions,
    () => {
      if (!props.modelValue || Object.keys(props.modelValue).length === 0) return
      const loading = isLoadingData.value
      isLoadingData.value = true
      syncCategoryIdForCascader()
      nextTick(() => {
        isLoadingData.value = loading
      })
    }
  )

  // 监听表单数据变化，转换为平铺格式后emit
  watch(
    () => formData,
    (newVal) => {
      // 如果正在加载数据，不触发emit
      if (isLoadingData.value) {
        return
      }

      // 将嵌套的specs结构转换为平铺格式
      const flatData = {
        ...newVal,
        // 删除嵌套结构
        specs: undefined,
        weightUnits: undefined,
        // 重量单位
        productNetWeightUnit: newVal.weightUnits.productNetWeightUnit,
        productGrossWeightUnit: newVal.weightUnits.productGrossWeightUnit,
        boxNetWeightUnit: newVal.weightUnits.boxNetWeightUnit,
        boxGrossWeightUnit: newVal.weightUnits.boxGrossWeightUnit,
        // 公制规格
        productNetWeight: newVal.specs.metric.productNetWeight,
        productGrossWeight: newVal.specs.metric.productGrossWeight,
        productLength: newVal.specs.metric.productLength,
        productWidth: newVal.specs.metric.productWidth,
        productHeight: newVal.specs.metric.productHeight,
        productPackageLength: newVal.specs.metric.productPackageLength,
        productPackageWidth: newVal.specs.metric.productPackageWidth,
        productPackageHeight: newVal.specs.metric.productPackageHeight,
        boxNetWeight: newVal.specs.metric.boxNetWeight,
        boxGrossWeight: newVal.specs.metric.boxGrossWeight,
        boxNum: newVal.specs.metric.boxNum,
        boxLength: newVal.specs.metric.boxLength,
        boxWidth: newVal.specs.metric.boxWidth,
        boxHeight: newVal.specs.metric.boxHeight,
        // 英制规格
        productNetWeightLb: newVal.specs.imperial.productNetWeightLb,
        productGrossWeightLb: newVal.specs.imperial.productGrossWeightLb,
        productLengthInch: newVal.specs.imperial.productLengthInch,
        productWidthInch: newVal.specs.imperial.productWidthInch,
        productHeightInch: newVal.specs.imperial.productHeightInch,
        productPackageLengthInch: newVal.specs.imperial.productPackageLengthInch,
        productPackageWidthInch: newVal.specs.imperial.productPackageWidthInch,
        productPackageHeightInch: newVal.specs.imperial.productPackageHeightInch,
        boxNetWeightLb: newVal.specs.imperial.boxNetWeightLb,
        boxGrossWeightLb: newVal.specs.imperial.boxGrossWeightLb,
        boxLengthInch: newVal.specs.imperial.boxLengthInch,
        boxWidthInch: newVal.specs.imperial.boxWidthInch,
        boxHeightInch: newVal.specs.imperial.boxHeightInch
      }

      emit('update:modelValue', flatData)
    },
    { deep: true }
  )

  // 用户切换公制/英制 Tab 时，同步写入 specUnitSystem（0-公制，1-英制）供提交使用
  watch(specUnit, (v) => {
    formData.specUnitSystem = v === 'imperial' ? 1 : 0
  })

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

  // 暴露验证方法
  const validate = () => {
    return formRef.value?.validate()
  }

  defineExpose({
    validate,
    formData
  })
</script>

<style lang="scss" scoped>
  .basic-info {
    padding: 20px;

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
            color: var(--el-text-color-regular);
            cursor: pointer;
            background: #fff;
            border: 1px solid #d9d9d9;
            transition: all 0.2s;

            &:first-child {
              border-right: none;
              border-radius: 4px 0 0 4px;
            }

            &:last-child {
              border-radius: 0 4px 4px 0;
            }

            &:hover {
              color: var(--el-color-primary);
              border-color: var(--el-color-primary);
            }

            &.active {
              z-index: 1;
              color: var(--el-color-primary);
              background: #e6f4ff;
              border-color: var(--el-color-primary);
            }
          }
        }
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

      // 与上方「开发人」「产品负责人」等列宽一致，不超出列宽、避免内容被遮挡
      .dimension-inputs {
        display: flex;
        flex-wrap: nowrap;
        gap: 0;
        align-items: stretch;
        width: 100%;
        min-width: 0;
        max-width: 100%;

        :deep(.el-input-number) {
          flex: 1;
          min-width: 0; // 允许在列宽内均分，与列长度一致
          margin-right: -1px;

          &:first-child {
            border-radius: 4px 0 0 4px;
          }

          &:last-of-type {
            margin-right: 0;
            border-radius: 0 4px 4px 0;
          }
        }

        .unit {
          flex-shrink: 0;
          align-self: center;
          margin-left: 6px;
          font-size: 14px;
          color: var(--el-text-color-regular);
          white-space: nowrap;
        }
      }

      .basic-form {
        overflow-y: scroll;

        :deep(.el-row) {
          min-width: 1450px !important;
          padding-right: 80px !important;

          .el-col {
            padding: 0 20px;
            // .el-select__wrapper {
            //   width: 60px !important;
            // }
          }
        }
      }

      .spec-tabs {
        overflow: auto visible;

        :deep(.el-tabs__header) {
          display: none;
        }

        :deep(.el-tabs__content) {
          padding: 16px 0;
        }
      }
    }

    // 规格信息部分横向滚动
    .spec-section {
      .spec-content-wrapper {
        overflow: auto visible;
        -webkit-overflow-scrolling: touch;

        // 自定义滚动条样式（可选）
        &::-webkit-scrollbar {
          height: 8px;
        }

        &::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 4px;
        }

        &::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 4px;

          &:hover {
            background: #a8a8a8;
          }
        }

        .spec-tabs {
          min-width: 1400px; // 设置最小宽度，确保在小屏幕上也能正常显示

          :deep(.el-tabs__content) {
            padding-right: 80px !important;
            overflow-y: scroll visible;

            .el-form {
              .el-row {
                .el-col {
                  padding: 0 20px;

                  .el-select__wrapper {
                    width: 60px !important;
                  }
                }
              }
            }
          }
        }
      }
    }

    // 统一基本信息部分所有输入框和选择框的宽度
    .section:first-child {
      :deep(.el-form-item__content) {
        // 统一所有输入框和选择框的宽度，与品牌/状态字段保持一致
        .el-input,
        .el-select,
        .el-cascader,
        .mk-select {
          width: 100% !important;
        }

        // 确保内部包装器也占满宽度
        .el-input__wrapper,
        .el-select__wrapper,
        .el-cascader__wrapper {
          width: 100% !important;
          max-width: 100% !important;
        }
      }
    }
  }
</style>
