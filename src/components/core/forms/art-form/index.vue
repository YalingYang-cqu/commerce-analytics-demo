<!-- 表单组件 -->
<!-- 支持常用表单组件、自定义组件、插槽、校验、隐藏表单项 -->
<!-- 写法同 ElementPlus 官方文档组件，把属性写在 props 里面就可以了 -->
<template>
  <section class="art-form">
    <ElForm
      ref="formRef"
      :model="modelValue"
      :label-position="labelPosition"
      :validate-on-rule-change="false"
      v-bind="{ ...$attrs }"
    >
      <ElRow class="form-row" :gutter="gutter">
        <ElCol
          v-for="entry in formItemsForLayout"
          :key="entry.item.key"
          :xs="entry.xs"
          :sm="entry.sm"
          :md="entry.md"
          :lg="entry.lg"
          :xl="entry.xl"
        >
          <ElFormItem
            v-if="!entry.item.noShow"
            :label="entry.item.label"
            :prop="entry.item.key"
            :label-width="entry.item.label ? entry.item.labelWidth || labelWidth : undefined"
          >
            <slot :name="entry.item.key" :item="entry.item" :modelValue="modelValue">
              <span
                class="item-text"
                v-if="getProps(entry.item)?.disabled || getProps(entry.item)?.readonly"
                >{{ modelValue[entry.item.key] }}</span
              >
              <template v-else>
                <!-- 多选下拉（使用 MkSelect） -->
                <template v-if="entry.item.selectMultiple && entry.item.type === 'select'">
                  <MkSelect
                    v-model="modelValue[entry.item.key]"
                    :multiple="true"
                    :clearable="(getProps(entry.item) as Record<string, any>)?.clearable !== false"
                    :options="getProps(entry.item)?.options || []"
                    :label-value="entry.item.labelValue || { name: 'label', value: 'value' }"
                    :placeholder="
                      entry.item.placeholder || getProps(entry.item)?.placeholder || '请选择'
                    "
                    :always-filter-input="entry.item.alwaysFilterInput"
                    :width="'100%'"
                  />
                </template>
                <!-- 普通表单项 -->
                <component
                  v-else
                  :is="getComponent(entry.item)"
                  v-model="modelValue[entry.item.key]"
                  v-bind="getProps(entry.item)"
                >
                  <!-- 下拉选择 -->
                  <template v-if="entry.item.type === 'select' && getProps(entry.item)?.options">
                    <ElOption
                      v-for="(option, optIdx) in getProps(entry.item).options"
                      v-bind="option"
                      :key="`${entry.item.key}-${optIdx}-${String(option?.value ?? '')}-${option?.label ?? ''}`"
                    />
                  </template>

                  <!-- 复选框组 -->
                  <template
                    v-if="entry.item.type === 'checkboxgroup' && getProps(entry.item)?.options"
                  >
                    <ElCheckbox
                      v-for="option in getProps(entry.item).options"
                      v-bind="option"
                      :key="option.value"
                    />
                  </template>

                  <!-- 单选框组 -->
                  <template
                    v-if="entry.item.type === 'radiogroup' && getProps(entry.item)?.options"
                  >
                    <ElRadio
                      v-for="option in getProps(entry.item).options"
                      v-bind="option"
                      :key="option.value"
                    />
                  </template>

                  <!-- 动态插槽支持 -->
                  <template
                    v-for="(slotFn, slotName) in getSlots(entry.item)"
                    :key="slotName"
                    #[slotName]
                  >
                    <component :is="slotFn" />
                  </template>
                </component>
              </template>
            </slot>
          </ElFormItem>
        </ElCol>
        <ElCol :xs="24" :sm="24" :md="span" :lg="span" :xl="span" class="action-column">
          <div class="action-buttons-wrapper" :style="actionButtonsStyle">
            <div class="form-buttons">
              <ElButton v-if="showReset" class="reset-button" @click="handleReset" v-ripple>
                {{ t('table.form.reset') }}
              </ElButton>
              <ElButton
                v-if="showSubmit"
                type="primary"
                class="submit-button"
                @click="handleSubmit"
                v-ripple
                :disabled="disabledSubmit"
              >
                {{ t('table.form.submit') }}
              </ElButton>
            </div>
          </div>
        </ElCol>
      </ElRow>
    </ElForm>
  </section>
</template>

<script setup lang="ts">
  import { useWindowSize } from '@vueuse/core'
  import { useI18n } from 'vue-i18n'
  import {
    ElCascader,
    ElCheckbox,
    ElCheckboxGroup,
    ElDatePicker,
    ElInput,
    ElInputNumber,
    ElRadioGroup,
    ElRate,
    ElSelect,
    ElSlider,
    ElSwitch,
    ElTimePicker,
    ElTimeSelect,
    ElTreeSelect,
    type FormInstance
  } from 'element-plus'
  import MkSelect from '@/components/core/others/mk-select/index.vue'

  defineOptions({ name: 'ArtForm' })

  const componentMap = {
    input: ElInput, // 输入框
    number: ElInputNumber, // 数字输入框
    select: ElSelect, // 选择器
    switch: ElSwitch, // 开关
    checkbox: ElCheckbox, // 复选框
    checkboxgroup: ElCheckboxGroup, // 复选框组
    radiogroup: ElRadioGroup, // 单选框组
    date: ElDatePicker, // 日期选择器
    daterange: ElDatePicker, // 日期范围选择器
    datetime: ElDatePicker, // 日期时间选择器
    datetimerange: ElDatePicker, // 日期时间范围选择器
    rate: ElRate, // 评分
    slider: ElSlider, // 滑块
    cascader: ElCascader, // 级联选择器
    timepicker: ElTimePicker, // 时间选择器
    timeselect: ElTimeSelect, // 时间选择
    treeselect: ElTreeSelect // 树选择器
  }

  const { width } = useWindowSize()
  const { t } = useI18n()
  const isMobile = computed(() => width.value < 500)

  const formInstance = useTemplateRef<FormInstance>('formRef')

  // 表单项配置
  export interface FormItem {
    /** 表单项的唯一标识 */
    key: string
    /** 表单项的标签文本 */
    label: string
    /** 表单项标签的宽度，会覆盖 Form 的 labelWidth */
    labelWidth?: string | number
    /** 表单项类型，可以是预定义的字符串类型或自定义组件 */
    type: keyof typeof componentMap | string | (() => VNode)
    /** 是否隐藏该表单项（隐藏时整个 el-col 都不显示，不占位） */
    hidden?: boolean
    /** 是否隐藏表单项内容（隐藏时 el-col 仍显示并占位，但表单项内容隐藏） */
    noShow?: boolean
    /** 表单项占据的列宽，基于24格栅格系统 */
    span?: number
    /** 选项数据，用于 select、checkbox-group、radio-group 等 */
    options?: Record<string, any>
    /** 传递给表单项组件的属性 */
    props?: Record<string, any>
    /** 表单项的插槽配置 */
    slots?: Record<string, (() => any) | undefined>
    /** 表单项的占位符文本 */
    placeholder?: string
    /** 是否启用多选下拉（使用 MkSelect 组件） */
    selectMultiple?: boolean
    /** 多选下拉的 labelValue 配置 */
    labelValue?: { name: string; value: string }
    /** 多选下拉是否始终显示搜索框 */
    alwaysFilterInput?: boolean
    /** 更多属性配置请参考 ElementPlus 官方文档 */
  }

  // 表单配置
  interface FormProps {
    /** 表单数据 */
    items: FormItem[]
    /** 每列的宽度（基于 24 格布局） */
    span?: number
    /** 表单控件间隙 */
    gutter?: number
    /** 表单域标签的位置 */
    labelPosition?: 'left' | 'right' | 'top'
    /** 文字宽度 */
    labelWidth?: string | number
    /** 按钮靠左对齐限制（表单项小于等于该值时） */
    buttonLeftLimit?: number
    /** 是否显示重置按钮 */
    showReset?: boolean
    /** 是否显示提交按钮 */
    showSubmit?: boolean
    /** 是否禁用提交按钮 */
    disabledSubmit?: boolean
    /**
     * 是否按 24 栅格自适应并在每行末尾自动补满（xs/sm/md/lg/xl 各自独立凑满一行）。
     * 关闭时保持原先固定 xs24/sm12/md8/lg/xl 与 item.span 行为。
     */
    fillRow?: boolean
  }

  const props = withDefaults(defineProps<FormProps>(), {
    items: () => [],
    span: 6,
    gutter: 12,
    labelPosition: 'right',
    labelWidth: '70px',
    buttonLeftLimit: 2,
    showReset: true,
    showSubmit: true,
    disabledSubmit: false,
    fillRow: true
  })

  interface FormEmits {
    reset: []
    submit: []
  }

  const emit = defineEmits<FormEmits>()

  const modelValue = defineModel<Record<string, any>>({ default: {} })

  const rootProps = [
    'label',
    'labelWidth',
    'key',
    'type',
    'hidden',
    'noShow',
    'span',
    'slots',
    'selectMultiple',
    'labelValue',
    'alwaysFilterInput'
  ]

  const getProps = (item: FormItem) => {
    if (item.props) return item.props
    const props = { ...item }
    rootProps.forEach((key) => delete (props as Record<string, any>)[key])
    return props
  }

  // 获取插槽
  const getSlots = (item: FormItem) => {
    if (!item.slots) return {}
    const validSlots: Record<string, () => any> = {}
    Object.entries(item.slots).forEach(([key, slotFn]) => {
      if (slotFn) {
        validSlots[key] = slotFn
      }
    })
    return validSlots
  }

  // 组件
  const getComponent = (item: FormItem) => {
    const { type } = item
    if (type && typeof item.type !== 'string') return type
    // type不传递、默认使用 input
    return componentMap[type as keyof typeof componentMap] || componentMap['input']
  }

  /**
   * 可见的表单项
   */
  const visibleFormItems = computed(() => {
    return props.items.filter((item) => !item.hidden)
  })

  /** 单行目标宽度和为 24：当前行最后一个表单项 span 拉满剩余格，避免行尾留白 */
  function fillRowSpans(items: FormItem[], unitSpan: (item: FormItem) => number): number[] {
    const n = items.length
    const result: number[] = []
    let rowSum = 0
    for (let i = 0; i < n; i++) {
      const item = items[i]
      const s = Math.min(Math.max(1, unitSpan(item)), 24)
      const next = items[i + 1]
      const nextS = next ? Math.min(Math.max(1, unitSpan(next)), 24) : null
      if (rowSum + s > 24) {
        rowSum = 0
      }
      if (nextS === null || rowSum + s + nextS > 24) {
        const fill = 24 - rowSum
        result.push(Math.min(24, Math.max(s, fill)))
        rowSum = 0
      } else {
        result.push(s)
        rowSum += s
      }
    }
    return result
  }

  /**
   * 各断点 span：xs/sm/md 按固定单位；lg/xl 按配置的 item.span 或 props.span，行尾补满 24。
   * fillRow 为 true 时在各自断点内对每行最后一项补满到 24。
   */
  const formItemsForLayout = computed(() => {
    const items = visibleFormItems.value
    const base = props.span
    if (!props.fillRow || items.length === 0) {
      return items.map((item) => ({
        item,
        xs: 8,
        sm: 8,
        md: 6,
        lg: 6,
        xl: Math.min(item.span ?? base, 24)
      }))
    }
    const xsSpans = fillRowSpans(items, () => 8)
    const smSpans = fillRowSpans(items, () => 8)
    const mdSpans = fillRowSpans(items, () => 6)
    const lgSpans = fillRowSpans(items, () => 6)
    const unitSpanLg = (item: FormItem) => Math.min(Math.max(1, item.span ?? base), 24)
    const xlSpans = fillRowSpans(items, unitSpanLg)
    return items.map((item, i) => ({
      item,
      xs: xsSpans[i],
      sm: smSpans[i],
      md: mdSpans[i],
      lg: lgSpans[i],
      xl: xlSpans[i]
    }))
  })

  /**
   * 操作按钮样式
   */
  const actionButtonsStyle = computed(() => ({
    'justify-content': isMobile.value
      ? 'flex-end'
      : props.items.filter((item) => !item.hidden).length <= props.buttonLeftLimit
        ? 'flex-start'
        : 'flex-end'
  }))

  /**
   * 处理重置事件
   */
  const handleReset = () => {
    // 重置表单字段（UI 层）
    formInstance.value?.resetFields()

    // 清空所有表单项值（包含隐藏项）
    Object.assign(
      modelValue.value,
      Object.fromEntries(props.items.map(({ key }) => [key, undefined]))
    )

    // 触发 reset 事件
    emit('reset')
  }

  /**
   * 处理提交事件
   */
  const handleSubmit = () => {
    emit('submit')
  }

  defineExpose({
    ref: formInstance,
    validate: (...args: any[]) => formInstance.value?.validate(...args),
    clearValidate: (...args: any[]) => formInstance.value?.clearValidate(...args),
    validateField: (...args: any[]) => formInstance.value?.validateField(...args),
    reset: handleReset
  })

  // 解构 props 以便在模板中直接使用
  const { span, gutter, labelPosition, labelWidth } = toRefs(props)
</script>

<style lang="scss" scoped>
  .art-form {
    .form-row {
      display: flex;
      flex-wrap: wrap;
    }

    :deep(.el-select) {
      min-width: auto !important;
    }

    .item-text {
      font-size: 12px;
      line-height: 20px;
    }

    :deep(.el-input.is-disabled .el-input__inner),
    :deep(.el-textarea.is-disabled .el-textarea__inner),
    :deep(.el-input.is-disabled .el-input__wrapper),
    :deep(.el-select__wrapper.is-disabled) {
      color: #606266 !important;
      cursor: default !important;
      background-color: #fff !important;

      .el-select__suffix {
        display: none !important;
      }
    }

    :deep(.el-select__wrapper.is-disabled .el-select__selected-item) {
      font-size: 12px;
      color: #606266 !important;
    }

    :deep(.el-select__selected-item) {
      font-size: 12px;
    }

    :deep(.el-form-item__error) {
      position: static !important;
    }

    :deep(label) {
      color: rgb(0 0 0 / 60%) !important;
    }

    :deep(.file-upload) {
      display: flex;
      flex-wrap: wrap;
    }

    :deep(.el-upload-list) {
      // display: flex;
      align-items: flex-start;
      margin: 0 !important;

      .el-upload-list__item {
        display: inline-block;
        width: 150px;
        margin-bottom: 0 !important;
      }
    }

    :deep(.el-col) {
      position: relative;
      padding: 4px;
      background: #fff;
      border-right: 1px solid #e4e7ed;
      border-bottom: 1px solid #e4e7ed;

      :deep(label) {
        font-size: 14px !important;
      }
    }

    :deep(.el-row) {
      border-top: 1px solid #e4e7ed;
      border-left: 1px solid #e4e7ed;

      .el-col:first-child {
        border-left: none;
      }
    }

    :deep(.el-row:first-child) {
      .el-col {
        border-top: none;
      }
    }

    :deep(.el-form-item) {
      margin-bottom: 0;
    }

    // 去除输入框、选择框等组件的外边框
    :deep(.el-input__wrapper) {
      border: none !important;
      box-shadow: none !important;
    }

    :deep(.el-select__wrapper) {
      border: none !important;
      box-shadow: none !important;
    }

    :deep(.el-textarea__inner) {
      border: none !important;
      box-shadow: none !important;
    }

    :deep(.el-input-number) {
      .el-input__wrapper {
        border: none !important;
        box-shadow: none !important;
      }
    }

    // 下拉框样式 - 与MkSelect组件保持一致
    :deep(.mk-select) {
      min-width: auto !important;
      height: 32px;
      line-height: 32px;

      .el-select__wrapper {
        height: 32px;
        line-height: 32px;
      }

      .el-input__wrapper {
        height: 32px !important;
        min-height: 32px !important;
        border: 1px solid #dcdfe6;
        box-shadow: none;
      }
    }

    .action-column {
      flex: 1;
      max-width: 100%;
      padding: 0 !important;
      border: none !important;

      .action-buttons-wrapper {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: flex-end;
        margin-bottom: 12px;
      }

      .form-buttons {
        display: flex;
        gap: 8px;
      }

      .filter-toggle {
        display: flex;
        align-items: center;
        margin-left: 10px;
        line-height: 32px;
        color: var(--main-color);
        cursor: pointer;
        transition: color 0.2s ease;

        &:hover {
          color: var(--ElColor-primary);
        }

        span {
          font-size: 14px;
          user-select: none;
        }

        .icon-wrapper {
          display: flex;
          align-items: center;
          margin-left: 4px;
          font-size: 14px;
          transition: transform 0.2s ease;
        }
      }
    }
  }

  // 响应式优化
  @media (width <= 768px) {
    .art-form {
      padding: 16px 16px 0;

      .action-column {
        .action-buttons-wrapper {
          flex-direction: column;
          gap: 8px;
          align-items: stretch;

          .form-buttons {
            justify-content: center;
          }

          .filter-toggle {
            justify-content: center;
            margin-left: 0;
          }
        }
      }
    }
  }
</style>
