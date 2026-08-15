<template>
  <div class="logistics-info-edit">
    <ElForm
      ref="formRef"
      :model="localData"
      :rules="logisticsFormRules"
      label-width="120px"
      class="logistics-form"
    >
      <!-- 报关信息：标题固定，仅内容区横向滚动 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title-bar"></span>
          <span class="section-title">报关信息</span>
        </div>
        <div class="section-content section-scroll">
          <ElRow :gutter="24">
            <ElCol :span="6">
              <ElFormItem label="中文报关名:" prop="customsName">
                <ElInput
                  v-model="localData.customsName"
                  :maxlength="50"
                  show-word-limit
                  placeholder="请输入"
                  clearable
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="英文报关名:" prop="englishCustomsName">
                <ElInput
                  v-model="localData.englishCustomsName"
                  placeholder="请输入"
                  :maxlength="50"
                  show-word-limit
                  clearable
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="报关HSCODE:" prop="customsHsCode">
                <div class="hscode-input-wrapper">
                  <ElInput
                    v-model="localData.customsHsCode"
                    placeholder="仅支持数字、字母"
                    title="仅支持数字、字母，最多10位"
                    clearable
                    maxlength="10"
                    show-word-limit
                    @update:model-value="
                      (val) => {
                        localData.customsHsCode = (val ?? '')
                          .replace(/[^a-zA-Z0-9]/g, '')
                          .slice(0, 10)
                      }
                    "
                  />
                  <div class="hscode-icon-btn" @click="handleSearchHscode('customs')">
                    <span
                      class="hscode-icon"
                      style="display: flex; align-items: center; justify-content: center"
                    >
                      <svg
                        t="1769171767963"
                        class="icon"
                        viewBox="0 0 1024 1024"
                        version="1.1"
                        xmlns="http://www.w3.org/2000/svg"
                        p-id="8708"
                        width="28"
                        height="28"
                      >
                        <path
                          d="M863.6 924.1h-696c-34.9 0-63.4-28.4-63.4-63.4v-696c0-34.9 28.4-63.4 63.4-63.4h290.5c12.4 0 22.4 10 22.4 22.4s-10 22.4-22.4 22.4H167.6c-10.2 0-18.5 8.3-18.5 18.5v696.1c0 10.2 8.3 18.5 18.5 18.5h696.1c10.2 0 18.5-8.3 18.5-18.5V540.6c0-12.4 10-22.4 22.4-22.4 12.4 0 22.4 10 22.4 22.4v320.2c0 34.9-28.4 63.3-63.4 63.3z"
                          fill="#1296db"
                          p-id="8709"
                        ></path>
                        <path
                          d="M897.6 352.3c-11 0-20-8.9-20-20v-189H688.5c-11 0-20-8.9-20-20s8.9-20 20-20h209.1c11 0 20 8.9 20 20v209.1c0 11-9 19.9-20 19.9z"
                          p-id="8710"
                          fill="#1296db"
                        ></path>
                        <path
                          d="M483.4 556.5c-5.1 0-10.2-2-14.1-5.9-7.8-7.8-7.8-20.5 0-28.3l411.5-411.5c7.8-7.8 20.5-7.8 28.3 0 7.8 7.8 7.8 20.5 0 28.3L497.5 550.6c-3.9 3.9-9 5.9-14.1 5.9z"
                          p-id="8711"
                          fill="#1296db"
                        ></path>
                      </svg>
                    </span>
                  </div>
                </div>
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="报关单价:" prop="customsPrice">
                <div class="price-input-group">
                  <ElInputNumber
                    v-model="localData.customsPrice"
                    placeholder="正数,10位整数4位小数"
                    title="正数, 整数位最多10位，小数4位"
                    :min="0"
                    :precision="4"
                    :max="9999999999.9999"
                    :controls="false"
                    style="flex: 1"
                  />
                  <MkSelect
                    v-model="localData.customsPriceCurrency"
                    placeholder="币种"
                    :options="currencyOptions"
                    :label-value="{ name: 'label', value: 'value' }"
                    filterable
                    clearable
                    :always-filter-input="true"
                    style="width: 68px; min-width: 68px"
                  />
                </div>
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="24">
            <ElCol :span="6">
              <ElFormItem label="报关材质:" prop="customsMaterial">
                <ElInput
                  v-model="localData.customsMaterial"
                  placeholder="请输入"
                  maxlength="50"
                  show-word-limit
                  clearable
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="报关用途:" prop="customsUsage">
                <ElInput
                  v-model="localData.customsUsage"
                  placeholder="请输入"
                  maxlength="50"
                  show-word-limit
                  clearable
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="货物属性:" prop="cargoAttributes">
                <MkSelect
                  v-model="localData.cargoAttributes"
                  placeholder="请选择"
                  :options="cargoAttributesOptions"
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
              <ElFormItem label="报关单位:" prop="customsUnit">
                <MkSelect
                  v-model="localData.customsUnit"
                  placeholder="请选择"
                  :options="customsUnitOptions"
                  :label-value="{ name: 'label', value: 'value' }"
                  filterable
                  clearable
                  :always-filter-input="true"
                  width="100%"
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="24">
            <ElCol :span="6">
              <ElFormItem label="报关型号:" prop="customsModel">
                <ElInput
                  v-model="localData.customsModel"
                  placeholder="请输入"
                  maxlength="50"
                  show-word-limit
                  clearable
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="品牌类型:" prop="brandType">
                <MkSelect
                  v-model="localData.brandType"
                  placeholder="请选择"
                  :options="brandTypeOptions"
                  :label-value="{ name: 'label', value: 'value' }"
                  filterable
                  clearable
                  :always-filter-input="true"
                  width="100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="原产地（地区）:" prop="originCountry">
                <MkSelect
                  v-model="localData.originCountry"
                  placeholder="请选择"
                  :options="originCountryOptions"
                  :label-value="{ name: 'label', value: 'value' }"
                  filterable
                  clearable
                  :always-filter-input="true"
                  width="100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="境内货源地:" prop="domesticCity">
                <ElInput
                  v-model="localData.domesticCity"
                  placeholder="请输入"
                  maxlength="50"
                  show-word-limit
                  clearable
                />
              </ElFormItem>
            </ElCol>
          </ElRow>
          <ElRow :gutter="24">
            <ElCol :span="6">
              <ElFormItem label="出口享惠情况:" prop="outletBenefits">
                <MkSelect
                  v-model="localData.outletBenefits"
                  placeholder="请选择"
                  :options="outletBenefitsOptions"
                  :label-value="{ name: 'label', value: 'value' }"
                  filterable
                  clearable
                  :always-filter-input="true"
                  width="100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="征免:" prop="exemptionTax">
                <ElInput
                  v-model="localData.exemptionTax"
                  placeholder="请输入"
                  maxlength="50"
                  show-word-limit
                  clearable
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="其他申报要素:" prop="otherDeclarationElements">
                <ElInput
                  v-model="localData.otherDeclarationElements"
                  placeholder="请输入"
                  maxlength="50"
                  show-word-limit
                  clearable
                />
              </ElFormItem>
            </ElCol>
            <!-- 增加一个是否包税字段，包税为是，不包税为否 -->
            <ElCol :span="6">
              <ElFormItem label="是否包税:" prop="isTaxIncluded">
                <MkSelect
                  v-model="localData.isTaxIncluded"
                  placeholder="请选择"
                  :options="isTaxFreeOptions"
                  :label-value="{ name: 'label', value: 'value' }"
                  filterable
                  clearable
                  :always-filter-input="true"
                  width="100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="报关方式:" prop="customsDeclarationMethod">
                <MkSelect
                  v-model="localData.customsDeclarationMethod"
                  placeholder="请选择"
                  :options="customsDeclarationMethodOptions"
                  :label-value="{ name: 'label', value: 'value' }"
                  filterable
                  clearable
                  :always-filter-input="true"
                  width="100%"
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="物流负责人:" prop="logisticsUserList">
                <MkSelect
                  v-model="localData.logisticsUserList"
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
          </ElRow>
        </div>
      </div>

      <!-- 清关信息：标题固定，仅内容区横向滚动 -->
      <div class="section">
        <div class="section-header">
          <span class="section-title-bar"></span>
          <span class="section-title">清关信息</span>
        </div>
        <div class="section-content section-scroll">
          <ElRow :gutter="24">
            <ElCol :span="6">
              <ElFormItem label="清关HSCODE:" prop="customsClearanceCode">
                <ElInput
                  v-model="localData.customsClearanceCode"
                  placeholder="仅支持数字、字母"
                  title="仅支持数字、字母，最多10位"
                  clearable
                  maxlength="10"
                  show-word-limit
                  @update:model-value="
                    (val) => {
                      localData.customsClearanceCode = (val ?? '')
                        .replace(/[^a-zA-Z0-9]/g, '')
                        .slice(0, 10)
                    }
                  "
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="清关单价:" prop="customsClearPrice">
                <div class="price-input-group">
                  <ElInputNumber
                    v-model="localData.customsClearPrice"
                    placeholder="正数,10位整数4位小数"
                    title="正数，整数位最多10位，小数4位"
                    :min="0"
                    :precision="4"
                    :max="9999999999.9999"
                    :controls="false"
                    style="flex: 1"
                  />
                  <MkSelect
                    v-model="localData.customsClearPriceCurrency"
                    placeholder="币种"
                    :options="currencyOptions"
                    :label-value="{ name: 'label', value: 'value' }"
                    filterable
                    clearable
                    :always-filter-input="true"
                    style="width: 68px; min-width: 68px"
                  />
                </div>
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="清关型号:" prop="customsClearModel">
                <ElInput
                  v-model="localData.customsClearModel"
                  placeholder="请输入"
                  maxlength="50"
                  show-word-limit
                  clearable
                />
              </ElFormItem>
            </ElCol>
            <ElCol :span="6">
              <ElFormItem label="清关税率:" prop="customsClearTaxRate">
                <ElInputNumber
                  v-model="localData.customsClearTaxRate"
                  placeholder="请输入"
                  :min="0"
                  :max="100"
                  :precision="2"
                  :controls="false"
                  style="width: 100%"
                >
                  <!-- <template #append>%</template> -->
                  <template #suffix>%</template>
                </ElInputNumber>
              </ElFormItem>
            </ElCol>
          </ElRow>
        </div>
      </div>
    </ElForm>
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, computed, onMounted } from 'vue'
  import {
    ElForm,
    ElFormItem,
    ElRow,
    ElCol,
    ElInput,
    ElInputNumber,
    // ElSelect,
    // ElOption,
    // ElButton,
    // ElMessage,
    type FormInstance,
    type FormRules
  } from 'element-plus'
  // import { TopRight } from '@element-plus/icons-vue'
  import MkSelect from '@/components/core/others/mk-select/index.vue'
  import { useDictStore } from '@/store/modules/dict'
  import { getEnabledCurrencyList } from '@/api/basic/currency'

  // 货物属性选项（与说明一致：写死选项）
  const cargoAttributesOptions = [
    { label: '普货', value: '普货' },
    { label: '带磁', value: '带磁' },
    { label: '带电', value: '带电' },
    { label: '纯电池', value: '纯电池' },
    { label: '粉末', value: '粉末' },
    { label: '液体', value: '液体' },
    { label: '纺织品', value: '纺织品' },
    { label: '食品', value: '食品' },
    { label: '其他', value: '其他' }
  ]
  // 品牌类型、原产地、出口享惠（写死选项，供 MkSelect 面板内搜索）
  const brandTypeOptions = [
    { label: '无品牌', value: '无品牌' },
    { label: '境内自主品牌', value: '境内自主品牌' },
    { label: '境内收购品牌', value: '境内收购品牌' },
    { label: '境外品牌（贴牌生产）', value: '境外品牌（贴牌生产）' },
    { label: '境外品牌（其他）', value: '境外品牌（其他）' }
  ]
  const originCountryOptions = [
    { label: '美国', value: '美国' },
    { label: '加拿大', value: '加拿大' },
    { label: '墨西哥', value: '墨西哥' },
    { label: '德国', value: '德国' },
    { label: '英国', value: '英国' },
    { label: '中国', value: '中国' }
  ]
  const outletBenefitsOptions = [
    { label: '不享惠', value: '不享惠' },
    { label: '享惠', value: '享惠' },
    { label: '不确定享惠情况', value: '不确定享惠情况' }
  ]

  /** 字段与控件说明
   * - 报关单位：下拉，数据源=字典 spuUnit（与基础信息单位一致）
   * - 报关HSCODE/清关HSCODE：输入框，最多10字符
   * - 币种：下拉，数据源=币种接口 listEnabled，下拉显示币种编码
   * - 货物属性/品牌类型/原产地/征免/出口享惠等：当前为写死选项；若后端有对应字典可改为字典
   * - 物流负责人：多选，数据源=父组件 userOptions
   */

  interface Props {
    modelValue: any
    userOptions?: Array<{ label: string; value: string | number }>
  }

  const isTaxFreeOptions = [
    { label: '是', value: 1 },
    { label: '否', value: 0 }
  ]
  const customsDeclarationMethodOptions = [
    { label: '自主报关', value: 0 },
    { label: '供应商报关', value: 1 },
    { label: '供应商买单报关', value: 2 }
  ]

  interface LogisticsInfo {
    isTaxIncluded: number | null
    customsDeclarationMethod: number | null
    // 报关信息
    customsName: string
    englishCustomsName: string
    customsHsCode: string
    customsPrice: number | null
    customsPriceCurrency: string
    customsMaterial: string
    customsUsage: string
    cargoAttributes: string[]
    customsUnit: string
    customsModel: string
    brandType: string
    originCountry: string
    domesticCity: string
    outletBenefits: string
    exemptionTax: string
    otherDeclarationElements: string
    logisticsUserList: Array<string | number>
    // 清关信息
    customsClearanceCode: string
    customsClearPrice: number | null
    customsClearPriceCurrency: string
    customsClearModel: string
    customsClearTaxRate: number | null
  }

  const props = withDefaults(defineProps<Props>(), {
    userOptions: () => []
  })

  const emit = defineEmits(['update:modelValue'])

  const formRef = ref<FormInstance>()

  const normalizeBinarySelectValue = (value: any): 0 | 1 | null => {
    if (value === true || value === 1 || value === '1') return 1
    if (value === false || value === 0 || value === '0') return 0
    return null
  }

  const normalizeNullableNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null
    const n = Number(value)
    return Number.isFinite(n) ? n : null
  }

  // 与产品说明图一致：中文/英文报关名禁止空格及特殊字符（无字数限制）；报关/清关HSCODE 仅数字、字母，最多10位
  const logisticsFormRules: FormRules = {
    customsHsCode: [
      { max: 10, message: '报关HSCODE最多10个字符', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z0-9]*$/,
        message: '仅支持数字、字母',
        trigger: 'blur'
      }
    ],
    customsClearanceCode: [
      { max: 10, message: '清关HSCODE最多10个字符', trigger: 'blur' },
      {
        pattern: /^[a-zA-Z0-9]*$/,
        message: '仅支持数字、字母',
        trigger: 'blur'
      }
    ]
  }

  const { dictData } = useDictStore()
  const customsUnitOptions = computed(() =>
    (dictData?.spuUnit ?? []).map((opt: any) => ({
      label: opt.label ?? opt.dictItemName ?? opt.name ?? '',
      value: opt.value ?? opt.dictItemCode ?? opt.code
    }))
  )

  // 币种选项：来自币种接口，下拉显示币种编码
  const currencyOptions = ref<{ label: string; value: string }[]>([])
  /** 弹窗打开时由父组件调用，重新拉取币种列表以感知其他功能的变更 */
  const refreshCurrency = async () => {
    try {
      const list = await getEnabledCurrencyList()
      currencyOptions.value = (list ?? [])
        .map((item: any) => ({
          label: item.currencyCode || '',
          value: item.currencyCode || ''
        }))
        .filter((opt: { value: string }) => opt.value)
    } catch (_) {
      console.log(_)
      currencyOptions.value = []
    }
  }
  onMounted(() => {
    refreshCurrency()
  })

  // 初始化本地数据
  const localData = reactive<LogisticsInfo>({
    customsName: '',
    englishCustomsName: '',
    isTaxIncluded: null,
    customsDeclarationMethod: null,
    customsHsCode: '',
    customsPrice: null,
    customsPriceCurrency: 'CNY',
    customsMaterial: '',
    customsUsage: '',
    cargoAttributes: [],
    customsUnit: '',
    customsModel: '',
    brandType: '',
    originCountry: '',
    domesticCity: '',
    outletBenefits: '',
    exemptionTax: '',
    otherDeclarationElements: '',
    logisticsUserList: [],
    customsClearanceCode: '',
    customsClearPrice: null,
    customsClearPriceCurrency: 'CNY',
    customsClearModel: '',
    customsClearTaxRate: null
  })

  // 监听 props.modelValue 变化，同步到 localData
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal && Object.keys(newVal).length > 0) {
        // 有数据时，合并到 localData
        Object.assign(localData, {
          ...newVal,
          isTaxIncluded: normalizeBinarySelectValue(newVal.isTaxIncluded),
          customsDeclarationMethod: normalizeNullableNumber(newVal.customsDeclarationMethod)
        })
      } else {
        // 空对象或 undefined 时，重置为初始值
        Object.assign(localData, {
          customsName: '',
          englishCustomsName: '',
          isTaxIncluded: null,
          customsDeclarationMethod: null,
          customsHsCode: '',
          customsPrice: null,
          customsPriceCurrency: 'CNY',
          customsMaterial: '',
          customsUsage: '',
          cargoAttributes: [],
          customsUnit: '',
          customsModel: '',
          brandType: '',
          originCountry: '',
          domesticCity: '',
          outletBenefits: '',
          exemptionTax: '',
          otherDeclarationElements: '',
          logisticsUserList: [],
          customsClearanceCode: '',
          customsClearPrice: null,
          customsClearPriceCurrency: 'CNY',
          customsClearModel: '',
          customsClearTaxRate: null
        })
      }
    },
    { immediate: true, deep: true }
  )

  // 监听 localData 变化，同步到父组件
  watch(
    localData,
    (newVal) => {
      emit('update:modelValue', { ...newVal })
    },
    { deep: true }
  )

  // 搜索HSCODE
  const handleSearchHscode = (type: 'customs' | 'clearance') => {
    // ElMessage.info(`搜索${type === 'customs' ? '报关' : '清关'}HSCODE功能开发中`)
    // 跳转报关的网站并且把内容带过去
    console.log(type)
    window.open(`https://www.hsbianma.com/search?keywords=${localData.customsHsCode}`, '_blank')
  }

  // 表单验证
  const validate = async () => {
    if (!formRef.value) return false
    return formRef.value.validate()
  }

  // 暴露验证方法
  defineExpose({
    validate,
    localData,
    refreshCurrency
  })
</script>

<style lang="scss" scoped>
  .logistics-info-edit {
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
      }

      // 按模块滚动：仅内容区横向滚动，标题不移动
      .section-content.section-scroll {
        overflow: auto visible;
        -webkit-overflow-scrolling: touch;

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

        :deep(.el-row) {
          min-width: 1450px !important;
          padding-right: 80px !important;

          .el-col {
            padding: 0 20px;
          }
        }
      }
    }

    .logistics-form {
      :deep(.el-input-group__append) {
        padding: 0;

        .el-select {
          margin: -1px;

          .el-input__wrapper {
            border-radius: 0;
            box-shadow: none;
          }
        }

        .el-button {
          margin: 0;
        }
      }

      .price-input-group {
        display: flex;
        gap: 0;
        align-items: center;
        width: 100%;

        :deep(.el-input-number) {
          .el-input__wrapper {
            border-top-right-radius: 0;
            border-bottom-right-radius: 0;
          }
        }

        :deep(.el-select) {
          .el-input__wrapper {
            border-left: 0;
            border-top-left-radius: 0;
            border-bottom-left-radius: 0;
          }
        }
      }

      // HSCODE输入框和图标分开显示
      .hscode-input-wrapper {
        display: flex;
        gap: 8px;
        align-items: center;
        width: 100%;

        .hscode-icon-btn {
          display: flex;
          flex-shrink: 0;
          align-items: center;
          justify-content: center;
          padding: 0;
          cursor: pointer;
          background: none;
          border: none;
          transition: opacity 0.3s;

          &:hover {
            opacity: 0.8;
          }

          .el-icon {
            font-size: 18px;
            color: #1d39c4;
          }
        }
      }
    }
  }
</style>
