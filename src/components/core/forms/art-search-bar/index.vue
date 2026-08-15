<!-- 表格搜索组件 -->
<!-- 支持常用表单组件、自定义组件、插槽、校验、隐藏表单项 -->
<!-- 写法同 ElementPlus 官方文档组件，把属性写在 props 里面就可以了 -->
<template>
  <section class="art-search-bar art-custom-card" :class="{ 'is-expanded': isExpanded }">
    <ElForm
      ref="formRef"
      :model="modelValue"
      :label-position="labelPosition"
      v-bind="{ ...$attrs }"
    >
      <ElSpace
        class="search-form-space"
        :size="gutter"
        wrap
        :style="{ width: '100%' }"
        alignment="flex-start"
      >
        <template v-for="item in firstRowFormItems" :key="item.key">
          <div class="form-item-wrapper" :style="{ width: getItemWidth(item) }">
            <ElFormItem
              :label="item.label"
              :prop="item.key"
              :label-width="item.label ? item.labelWidth || labelWidth : undefined"
            >
              <slot :name="item.key" :item="item" :modelValue="modelValue">
                <!-- 复合搜索 -->
                <template v-if="item.compositeSearch">
                  <div class="composite-search-wrapper">
                    <ElSelect
                      v-model="modelValue[item.selectKey || `${item.key}Type`]"
                      :style="{ width: item.selectWidth || '100px' }"
                      size="small"
                      :placeholder="item.props?.selectPlaceholder || '请选择'"
                      @change="handleCompositeSelectChange(item)"
                    >
                      <ElOption
                        v-for="option in item.selectOptions"
                        :key="option.value"
                        :label="option.label"
                        :value="option.value"
                      />
                    </ElSelect>
                    <ElInput
                      v-if="item.inputType === 'input'"
                      v-model="modelValue[item.key]"
                      size="small"
                      :placeholder="item.placeholder || '请输入'"
                      clearable
                      style="flex: 1; margin-left: -1px"
                      @blur="handleCompositeInputBlur(item)"
                      @clear="handleCompositeInputClear(item)"
                    >
                      <template #suffix>
                        <el-icon @click="handleCompositeInputBlur(item)" style="cursor: pointer">
                          <Search />
                        </el-icon>
                      </template>
                    </ElInput>
                    <ElDatePicker
                      v-else-if="
                        item.inputType === 'daterange' || item.inputType === 'datetimerange'
                      "
                      v-model="modelValue[item.key]"
                      :type="
                        item.pickerType ||
                        (item.inputType === 'datetimerange' ? 'datetimerange' : 'daterange')
                      "
                      size="small"
                      :start-placeholder="item?.placeholder?.split(',')?.[0] || '开始日期'"
                      :end-placeholder="item?.placeholder?.split(',')?.[1] || '结束日期'"
                      :clearable="item.clearable"
                      style="flex: 1; margin-left: -1px"
                      v-bind="item.datePickerProps || {}"
                      @change="handleCompositeDateChange(item)"
                      @clear="handleCompositeDateClear(item)"
                    />
                  </div>
                </template>
                <!-- 多选下拉（使用 MkSelect） -->
                <template v-else-if="item.selectMultiple && item.type === 'select'">
                  <MkSelect
                    v-model="modelValue[item.key]"
                    :multiple="true"
                    :disabled="getProps(item)?.disabled === true"
                    :clearable="getProps(item)?.clearable !== false"
                    :options="getProps(item)?.options || []"
                    :label-value="item.labelValue || { name: 'label', value: 'value' }"
                    :placeholder="item.placeholder || getProps(item)?.placeholder || '请选择'"
                    :always-filter-input="item.alwaysFilterInput"
                    :width="'100%'"
                    @change="handleMultipleSelectChange(item)"
                  />
                  <!-- @tag-change="handleMultipleSelectChange(item)" -->
                </template>
                <!-- 单选下拉且需下拉内顶部搜索（使用 MkSelect） -->
                <template v-else-if="item.type === 'select' && getProps(item)?.dropdownSearch">
                  <MkSelect
                    v-model="modelValue[item.key]"
                    :multiple="false"
                    :clearable="getProps(item)?.clearable !== false"
                    :options="getProps(item)?.options || []"
                    :label-value="item.labelValue || { name: 'label', value: 'value' }"
                    :placeholder="item.placeholder || getProps(item)?.placeholder || '请选择'"
                    :filterable="true"
                    :always-filter-input="true"
                    :width="'100%'"
                    @change="handleSearch"
                  />
                </template>
                <!-- 普通表单项 -->
                <component
                  v-else
                  :is="getComponent(item)"
                  v-model="modelValue[item.key]"
                  v-bind="getProps(item)"
                  @blur="item.trigger === 'blur' ? handleSearch() : undefined"
                  @change="
                    item.trigger === 'change' ||
                    ['select', 'daterange', 'datetimerange', 'cascader'].includes(item.type)
                      ? handleSearch()
                      : undefined
                  "
                  @clear="handleSearch"
                  size="small"
                  style="width: 100%"
                >
                  <!-- <template #header>
                    <el-checkbox
                      v-model="checkAll"
                      :indeterminate="indeterminate"
                      @change="handleCheckAll"
                    >
                      All
                    </el-checkbox>
                  </template> -->
                  <!-- 下拉选择 -->
                  <template v-if="item.type === 'select' && getProps(item)?.options">
                    <ElOption
                      v-for="option in getProps(item).options"
                      v-bind="option"
                      :key="option.value"
                    />
                  </template>

                  <!-- 复选框组 -->
                  <template v-if="item.type === 'checkboxgroup' && getProps(item)?.options">
                    <ElCheckbox
                      v-for="option in getProps(item).options"
                      v-bind="option"
                      :key="option.value"
                    />
                  </template>

                  <!-- 单选框组 -->
                  <template v-if="item.type === 'radiogroup' && getProps(item)?.options">
                    <ElRadio
                      v-for="option in getProps(item).options"
                      v-bind="option"
                      :key="option.value"
                    />
                  </template>
                  <!-- 动态插槽支持 -->
                  <template
                    v-for="(slotFn, slotName) in getSlots(item)"
                    :key="slotName"
                    #[slotName]
                  >
                    <component :is="slotFn" size="small" />
                  </template>
                </component>
              </slot>
            </ElFormItem>
          </div>
        </template>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <!-- 过滤器浮窗按钮 -->
          <ElPopover
            v-if="hasOverflowItems"
            :visible="popoverVisible"
            placement="bottom-end"
            :width="400"
            popper-class="art-search-bar-popover"
          >
            <template #reference>
              <ElButton
                :icon="Filter"
                class="filter-popover-btn"
                :class="{ 'is-active': popoverVisible }"
                size="small"
                @click="handleFilterButtonClick"
              />
            </template>
            <div class="popover-form-content">
              <ElForm :model="modelValue" :label-position="labelPosition" :label-width="labelWidth">
                <!-- 浮窗内的表单项不绑定自动搜索事件，只有点击确定按钮时才触发搜索 -->
                <ElFormItem
                  v-for="item in overflowFormItems"
                  :key="item.key"
                  :label="item.label"
                  :prop="item.key"
                  :label-width="item.label ? item.labelWidth || labelWidth : undefined"
                >
                  <slot :name="item.key" :item="item" :modelValue="modelValue">
                    <!-- 复合搜索（浮窗内不自动搜索） -->
                    <template v-if="item.compositeSearch">
                      <div class="composite-search-wrapper">
                        <ElSelect
                          v-model="modelValue[item.selectKey || `${item.key}Type`]"
                          :style="{ width: item.selectWidth || '100px' }"
                          size="small"
                          :placeholder="item.props?.selectPlaceholder || '请选择'"
                        >
                          <ElOption
                            v-for="option in item.selectOptions"
                            :key="option.value"
                            :label="option.label"
                            :value="option.value"
                          />
                        </ElSelect>
                        <ElInput
                          v-if="item.inputType === 'input'"
                          v-model="modelValue[item.key]"
                          size="small"
                          :placeholder="item.placeholder || '请输入'"
                          clearable
                          style="flex: 1; margin-left: -1px"
                        />
                        <ElDatePicker
                          v-else-if="
                            item.inputType === 'daterange' || item.inputType === 'datetimerange'
                          "
                          v-model="modelValue[item.key]"
                          :type="
                            item.pickerType ||
                            (item.inputType === 'datetimerange' ? 'datetimerange' : 'daterange')
                          "
                          size="small"
                          clearable
                          style="flex: 1; margin-left: -1px"
                          v-bind="item.datePickerProps || {}"
                        />
                      </div>
                    </template>
                    <!-- 多选下拉（使用 MkSelect，浮窗内不自动搜索） -->
                    <template v-else-if="item.selectMultiple && item.type === 'select'">
                      <MkSelect
                        v-model="modelValue[item.key]"
                        :multiple="true"
                        :clearable="getProps(item)?.clearable !== false"
                        :options="getProps(item)?.options || []"
                        :label-value="item.labelValue || { name: 'label', value: 'value' }"
                        :placeholder="item.placeholder || getProps(item)?.placeholder || '请选择'"
                        :always-filter-input="item.alwaysFilterInput"
                        :width="'100%'"
                      />
                    </template>
                    <!-- 单选下拉且需下拉内顶部搜索（使用 MkSelect） -->
                    <template v-else-if="item.type === 'select' && getProps(item)?.dropdownSearch">
                      <MkSelect
                        v-model="modelValue[item.key]"
                        :multiple="false"
                        :clearable="getProps(item)?.clearable !== false"
                        :options="getProps(item)?.options || []"
                        :label-value="item.labelValue || { name: 'label', value: 'value' }"
                        :placeholder="item.placeholder || getProps(item)?.placeholder || '请选择'"
                        :filterable="true"
                        :always-filter-input="true"
                        :width="'100%'"
                      />
                    </template>
                    <!-- 普通表单项 -->
                    <component
                      v-else
                      :is="getComponent(item)"
                      v-model="modelValue[item.key]"
                      v-bind="getProps(item)"
                      size="small"
                      style="width: 100%"
                    >
                      <!-- <template #header>
                        <el-checkbox
                          v-model="checkAll"
                          :indeterminate="indeterminate"
                          @change="handleCheckAll"
                        >
                          All
                        </el-checkbox>
                      </template> -->
                      <!-- 下拉选择 -->
                      <template v-if="item.type === 'select' && getProps(item)?.options">
                        <ElOption
                          v-for="option in getProps(item).options"
                          v-bind="option"
                          :key="option.value"
                        />
                      </template>

                      <!-- 复选框组 -->
                      <template v-if="item.type === 'checkboxgroup' && getProps(item)?.options">
                        <ElCheckbox
                          v-for="option in getProps(item).options"
                          v-bind="option"
                          :key="option.value"
                        />
                      </template>

                      <!-- 单选框组 -->
                      <template v-if="item.type === 'radiogroup' && getProps(item)?.options">
                        <ElRadio
                          v-for="option in getProps(item).options"
                          v-bind="option"
                          :key="option.value"
                        />
                      </template>
                      <!-- 动态插槽支持 -->
                      <template
                        v-for="(slotFn, slotName) in getSlots(item)"
                        :key="slotName"
                        #[slotName]
                      >
                        <component :is="slotFn" size="small" />
                      </template>
                    </component>
                  </slot>
                </ElFormItem>
              </ElForm>
              <div class="popover-footer">
                <ElButton size="small" @click="handlePopoverCancel">取消</ElButton>
                <ElButton type="primary" size="small" @click="handlePopoverConfirm">
                  搜索
                </ElButton>
              </div>
            </div>
          </ElPopover>
          <ElButton v-if="showReset" class="reset-button" @click="handleReset" v-ripple>
            {{ t('table.searchBar.reset') }}
          </ElButton>
          <ElButton
            v-if="showSearch"
            type="primary"
            class="search-button"
            @click="handleSearch"
            v-ripple
            :disabled="disabledSearch"
          >
            {{ t('table.searchBar.search') }}
          </ElButton>
        </div>
      </ElSpace>
    </ElForm>
  </section>
</template>

<script setup lang="ts">
  import { nextTick, watch, onMounted, onBeforeUnmount } from 'vue'
  import { Filter } from '@element-plus/icons-vue'
  import { useWindowSize } from '@vueuse/core'
  import { useI18n } from 'vue-i18n'
  import { storeToRefs } from 'pinia'
  import { useSettingStore } from '@/store/modules/setting'
  import { MenuTypeEnum, MenuWidth } from '@/enums/appEnum'
  // import _ from 'lodash'

  import {
    ElCascader,
    ElCheckbox,
    ElCheckboxGroup,
    ElDatePicker,
    ElInput,
    ElInputNumber,
    ElPopover,
    ElRadioGroup,
    ElRate,
    ElSelect,
    ElSlider,
    ElSpace,
    ElSwitch,
    ElTimePicker,
    ElTimeSelect,
    ElTreeSelect,
    type FormInstance
  } from 'element-plus'
  import MkSelect from '@/components/core/others/mk-select/index.vue'
  import { Search } from '@element-plus/icons-vue'
  defineOptions({ name: 'ArtSearchBar' })

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
  const settingStore = useSettingStore()
  const { menuOpen, menuOpenWidth, menuType } = storeToRefs(settingStore)

  const formInstance = useTemplateRef<FormInstance>('formRef')

  // 表单项配置
  export interface SearchFormItem {
    /** 表单项的唯一标识 */
    key: string
    /** 表单项的标签文本 */
    label: string
    /** 表单项标签的宽度，会覆盖 Form 的 labelWidth */
    labelWidth?: string | number
    /** 表单项类型，可以是预定义的字符串类型或自定义组件 */
    type: keyof typeof componentMap | string | (() => VNode)
    /** 是否隐藏该表单项 */
    hidden?: boolean
    /** 是否固定放入更多筛选浮窗 */
    overflow?: boolean
    /** 表单项占据的列宽，基于24格栅格系统 */
    span?: number
    /** 表单项宽度，默认 100px */
    width?: string | number
    /** 选项数据，用于 select、checkbox-group、radio-group 等 */
    options?: Record<string, any>
    /** 传递给表单项组件的属性 */
    props?: Record<string, any>
    /** 表单项的插槽配置 */
    slots?: Record<string, (() => any) | undefined>
    /** 表单项的占位符文本 */
    placeholder?: string
    /** 是否启用复合搜索（前面是 select，后面是 input 或 daterange） */
    compositeSearch?: boolean
    /** 复合搜索中 select 的选项 */
    selectOptions?: Array<{ label: string; value: string | number }>
    /** 复合搜索中 select 对应的 key（用于存储选择的值） */
    selectKey?: string
    /** 复合搜索中 select 的宽度，默认 100px */
    selectWidth?: string | number
    /**
     * 复合搜索左侧 select 变更时是否自动触发 search。
     * 默认 true（有右侧值时刷新）；设为 false 时仅改类型，等输入/点搜索再查。
     */
    selectTriggerSearch?: boolean
    /** 复合搜索中后面的输入类型：'input' | 'daterange' | 'datetimerange'，默认 'input' */
    inputType?: 'input' | 'daterange' | 'datetimerange'
    /** 日期面板类型；用于按日/按月切换时覆盖默认 daterange */
    pickerType?: 'daterange' | 'datetimerange' | 'monthrange'
    /** 复合搜索中日期选择器的配置 */
    datePickerProps?: Record<string, any>
    /** 是否启用多选下拉（使用 MkSelect 组件） */
    selectMultiple?: boolean
    /** 多选下拉的 labelValue 配置 */
    labelValue?: { name: string; value: string }
    /** 多选下拉是否始终显示搜索框 */
    alwaysFilterInput?: boolean
    /** 更多属性配置请参考 ElementPlus 官方文档 */
  }

  // 表单配置
  interface SearchBarProps {
    /** 表单数据 */
    items: SearchFormItem[]
    /** 表单控件间隙 */
    gutter?: number
    /** 展开/收起 */
    isExpand?: boolean
    /** 默认是否展开（仅在 showExpand 为 true 且 isExpand 为 false 时生效） */
    defaultExpanded?: boolean
    /** 表单域标签的位置 */
    labelPosition?: 'left' | 'right' | 'top'
    /** 文字宽度 */
    labelWidth?: string | number
    /** 是否需要展示，收起 */
    showExpand?: boolean
    /** 是否显示重置按钮 */
    showReset?: boolean
    /** 是否显示搜索按钮 */
    showSearch?: boolean
    /** 是否禁用搜索按钮 */
    disabledSearch?: boolean
    /** 表单项默认宽度 */
    defaultItemWidth?: string | number
  }

  const props = withDefaults(defineProps<SearchBarProps>(), {
    items: () => [],
    gutter: 12,
    isExpand: false,
    labelPosition: 'right',
    labelWidth: '0',
    showExpand: true,
    defaultExpanded: false,
    showReset: true,
    showSearch: true,
    disabledSearch: false,
    defaultItemWidth: '200px'
  })

  interface SearchBarEmits {
    reset: []
    search: []
  }

  const emit = defineEmits<SearchBarEmits>()

  const modelValue = defineModel<Record<string, any>>({ default: {} })

  /**
   * 是否展开状态
   */
  const isExpanded = ref(props.defaultExpanded)

  /**
   * 浮窗显示状态
   */
  const popoverVisible = ref(false)

  /**
   * 多选下拉防抖定时器 Map
   */
  const multipleSelectDebounceTimers = new Map<string, ReturnType<typeof setTimeout>>()

  /**
   * 复合搜索输入框上次已搜索过的值（key -> value）。
   * 失焦/点搜索图标时值未变化则不再发请求（如点进输入框未编辑就点向下拉框，
   * 会先 blur 再 change 连发两次查询）。
   */
  const lastSearchedCompositeInput = new Map<string, string>()

  /** 复合搜索输入框当前值（统一成字符串便于比较） */
  const compositeInputValue = (key: string): string => {
    const v = modelValue.value[key]
    return v == null ? '' : String(v)
  }

  /** 以当前值作为「已搜索过」的基线（初始化 / 重置后调用，避免空框点进点出就发请求） */
  const syncCompositeInputBaseline = () => {
    props.items.forEach((item) => {
      if (item.compositeSearch && item.inputType === 'input') {
        lastSearchedCompositeInput.set(item.key, compositeInputValue(item.key))
      }
    })
  }

  const rootProps = [
    'label',
    'labelWidth',
    'key',
    'type',
    'hidden',
    'overflow',
    'span',
    'width',
    'slots'
  ]

  const getProps = (item: SearchFormItem) => {
    if (item.props) return item.props
    const props = { ...item }
    rootProps.forEach((key) => delete (props as Record<string, any>)[key])
    return props
  }

  // 获取插槽
  const getSlots = (item: SearchFormItem) => {
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
  const getComponent = (item: SearchFormItem) => {
    const { type } = item
    if (type && typeof item.type !== 'string') return type
    // type不传递、默认使用 input
    return componentMap[type as keyof typeof componentMap] || componentMap['input']
  }

  /**
   * 获取表单项宽度
   */
  const getItemWidth = (item: SearchFormItem) => {
    return item.width || props.defaultItemWidth
  }

  /**
   * 计算侧边栏实际宽度
   */
  const sidebarWidth = computed(() => {
    // 判断是否显示左侧菜单（LEFT 或 TOP_LEFT 类型）
    const showLeftMenu =
      menuType.value === MenuTypeEnum.LEFT || menuType.value === MenuTypeEnum.TOP_LEFT

    if (!showLeftMenu) {
      return 0
    }

    // 根据菜单展开状态返回对应宽度
    if (menuOpen.value) {
      // 展开状态：使用 menuOpenWidth（数字类型，默认 230）
      return menuOpenWidth.value || 230
    } else {
      // 收起状态：使用 MenuWidth.CLOSE（'70px' 字符串）
      const closeWidthStr = String(MenuWidth.CLOSE)
      return parseFloat(closeWidthStr.replace('px', '')) || 70
    }
  })

  /**
   * 计算第一行能容纳的表单项
   */
  const firstRowFormItems = computed(() => {
    const filteredItems = props.items.filter((item) => !item.hidden)
    if (filteredItems.length === 0) return []
    const inlineItems = filteredItems.filter((item) => !item.overflow)
    // 强制展开模式下直接渲染全部非 overflow 表单项，由 ElSpace.wrap 负责换行。
    if (props.isExpand || isExpanded.value) return inlineItems

    // 获取容器宽度（减去 padding 和侧边栏宽度）
    const baseContainerWidth = width.value > 0 ? width.value - 40 : 1200 // 减去左右 padding，默认值用于 SSR
    const containerWidth = baseContainerWidth - sidebarWidth.value // 减去侧边栏宽度
    let currentWidth = 0
    const result: SearchFormItem[] = []

    // 估算按钮区域宽度（重置按钮 + 搜索按钮 + 过滤器按钮 + 间距）
    const buttonAreaWidth = 300

    for (const item of inlineItems) {
      // 获取表单项宽度
      const itemWidthStr = String(getItemWidth(item))
      const itemWidth = parseFloat(itemWidthStr.replace('px', '')) || 100

      // 估算 label 宽度（如果有 label）
      const labelWidth = item.label
        ? parseFloat(String(item.labelWidth || props.labelWidth).replace('px', '')) || 70
        : 0

      // 表单项总宽度 = label 宽度 + 表单项宽度 + 间距
      const totalItemWidth = labelWidth + itemWidth + (props.gutter || 12)

      // 如果加上这个表单项会超出容器宽度，就停止
      if (currentWidth + totalItemWidth + buttonAreaWidth > containerWidth && result.length > 0) {
        break
      }

      result.push(item)
      currentWidth += totalItemWidth
    }

    return result
  })

  /**
   * 超出第一行的表单项（放入浮窗）
   */
  const overflowFormItems = computed(() => {
    const filteredItems = props.items.filter((item) => !item.hidden)
    const firstRowKeys = new Set(firstRowFormItems.value.map((item) => item.key))
    return filteredItems.filter((item) => item.overflow || !firstRowKeys.has(item.key))
  })

  /**
   * 是否有超出第一行的表单项
   */
  const hasOverflowItems = computed(() => {
    return overflowFormItems.value.length > 0
  })

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
    syncCompositeInputBaseline()

    // 触发 reset 事件
    emit('reset')
  }

  /**
   * 处理搜索事件
   */
  const handleSearch = () => {
    emit('search')
  }

  /**
   * 处理复合搜索 select 变化
   */
  const handleCompositeSelectChange = (item: SearchFormItem) => {
    // 显式关闭：仅切换类型，不主动刷新（如 SC 订单利润 searchType）
    if (item.selectTriggerSearch === false) {
      return
    }
    // 检查是否在浮窗内
    const isInPopover = overflowFormItems.value.some(
      (overflowItem) => overflowItem.key === item.key
    )
    if (isInPopover) {
      // 在浮窗内，不自动搜索
      return
    }

    // 不在浮窗内，检查后面的值是否存在
    const isCompositeRange = item.inputType === 'daterange' || item.inputType === 'datetimerange'
    const hasValue = isCompositeRange
      ? Array.isArray(modelValue.value[item.key]) && modelValue.value[item.key]?.length === 2
      : modelValue.value[item.key] && String(modelValue.value[item.key]).trim()

    // 如果后面的值存在，立即触发搜索
    if (hasValue) {
      handleSearch()
    }
  }

  /**
   * 处理复合搜索输入框失去焦点 / 点击搜索图标：值未变化时不重复发请求
   */
  const handleCompositeInputBlur = (item: SearchFormItem) => {
    // 检查是否在浮窗内
    const isInPopover = overflowFormItems.value.some(
      (overflowItem) => overflowItem.key === item.key
    )
    if (isInPopover) return
    const current = compositeInputValue(item.key)
    if (lastSearchedCompositeInput.get(item.key) === current) return
    lastSearchedCompositeInput.set(item.key, current)
    handleSearch()
  }

  /**
   * 处理复合搜索输入框清空
   */
  const handleCompositeInputClear = (item: SearchFormItem) => {
    // 显式置空对应的值，使用 undefined 确保完全清空
    modelValue.value[item.key] = undefined
    lastSearchedCompositeInput.set(item.key, '')
    // 检查是否在浮窗内
    const isInPopover = overflowFormItems.value.some(
      (overflowItem) => overflowItem.key === item.key
    )
    if (!isInPopover) {
      // 使用 nextTick 确保值变化后再触发搜索
      nextTick(() => {
        handleSearch()
      })
    }
  }

  /**
   * 处理复合搜索日期范围变化
   */
  const handleCompositeDateChange = (item: SearchFormItem) => {
    // 检查是否在浮窗内
    const isInPopover = overflowFormItems.value.some(
      (overflowItem) => overflowItem.key === item.key
    )
    if (!isInPopover) {
      handleSearch()
    }
  }

  /**
   * 处理复合搜索日期范围清空
   */
  const handleCompositeDateClear = (item: SearchFormItem) => {
    // 显式置空对应的值
    modelValue.value[item.key] = null
    // 检查是否在浮窗内
    const isInPopover = overflowFormItems.value.some(
      (overflowItem) => overflowItem.key === item.key
    )
    if (!isInPopover) {
      // 使用 nextTick 确保值变化后再触发搜索
      nextTick(() => {
        handleSearch()
      })
    }
  }

  /**
   * 处理 filter 按钮点击
   */
  const handleFilterButtonClick = () => {
    popoverVisible.value = !popoverVisible.value
  }

  /**
   * 处理浮窗取消
   */
  const handlePopoverCancel = () => {
    popoverVisible.value = false
  }

  /**
   * 处理多选下拉变化
   */
  const handleMultipleSelectChange = (item: SearchFormItem) => {
    // 检查是否在浮窗内
    const isInPopover = overflowFormItems.value.some(
      (overflowItem) => overflowItem.key === item.key
    )
    // 不在浮窗内时，使用防抖触发搜索
    if (!isInPopover) {
      // 清除之前的定时器
      const existingTimer = multipleSelectDebounceTimers.get(item.key)
      if (existingTimer) {
        clearTimeout(existingTimer)
      }
      // 设置新的防抖定时器
      const timer = setTimeout(() => {
        handleSearch()
        multipleSelectDebounceTimers.delete(item.key)
      }, 100) // 100ms 防抖延迟
      multipleSelectDebounceTimers.set(item.key, timer)
    }
  }

  /**
   * 处理浮窗确定
   */
  const handlePopoverConfirm = () => {
    popoverVisible.value = false
    handleSearch()
  }
  // 监听数据变化 - 优化监听器，减少不必要的重新渲染
  // watch(
  //   modelValue,
  //   () => {
  //     _.debounce(handleSearch(), 800)
  //   },
  //   { deep: true }
  // )
  defineExpose({
    ref: formInstance,
    validate: (...args: any[]) => formInstance.value?.validate(...args),
    reset: handleReset
  })

  /**
   * 初始化复合搜索的默认值
   */
  const initCompositeSearchDefaults = () => {
    props.items.forEach((item) => {
      if (item.compositeSearch && item.selectOptions && item.selectOptions.length > 0) {
        const selectKey = item.selectKey || `${item.key}Type`
        // 如果 selectKey 对应的值不存在，设置为第一项的值
        if (
          modelValue.value[selectKey] === undefined ||
          modelValue.value[selectKey] === null ||
          modelValue.value[selectKey] === ''
        ) {
          modelValue.value[selectKey] = item.selectOptions[0].value
        }
      }
    })
  }

  // 监听 items 变化，初始化默认值
  watch(
    () => props.items,
    () => {
      nextTick(() => {
        initCompositeSearchDefaults()
      })
    },
    { immediate: true, deep: true }
  )

  // 组件挂载时初始化
  onMounted(() => {
    initCompositeSearchDefaults()
    syncCompositeInputBaseline()
  })

  // 组件卸载前清理定时器
  onBeforeUnmount(() => {
    multipleSelectDebounceTimers.forEach((timer) => {
      clearTimeout(timer)
    })
    multipleSelectDebounceTimers.clear()
  })

  // 解构 props 以便在模板中直接使用
  const { gutter, labelPosition, labelWidth } = toRefs(props)
</script>

<style lang="scss" scoped>
  .art-search-bar {
    padding: 15px 20px 0;
    margin-bottom: 14px;
    background-color: var(--art-main-bg-color);
    border-radius: calc(var(--custom-radius) / 2 + 2px);

    :deep(.el-form-item--default) {
      margin-bottom: 5px !important;
    }

    :deep(label) {
      height: 24px !important;
      line-height: 24px !important;
      color: rgb(0 0 0 / 60%) !important;
      border: 1px solid #dcdfe6;
      border-right-width: 0;
      // background: #fafafa;
      // color: #909399 !important;
      // width: 90px;
      // text-align: right;
      // border: 1px solid #ebeef5;
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

    :deep(.el-range-editor--small.el-input__wrapper) {
      height: var(--el-component-size-small);
      border-top-left-radius: 0;
      border-bottom-left-radius: 0;
    }

    .composite-search-wrapper {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      width: 100%;
      white-space: nowrap;

      :deep(.el-select__wrapper) {
        flex-shrink: 0;
        height: var(--el-component-size-small);
        border-right-width: 0;
        border-top-right-radius: 0;
        border-bottom-right-radius: 0;
      }

      :deep(.el-input__wrapper) {
        flex-shrink: 1;
        min-width: 0;
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }

      :deep(.el-range-editor--small.el-input__wrapper) {
        flex-shrink: 1;
        min-width: 0;
        height: var(--el-component-size-small);
        border-top-left-radius: 0;
        border-bottom-left-radius: 0;
      }
    }

    .search-form-space {
      width: 100%;
      margin-bottom: 12px;

      .form-item-wrapper {
        flex-shrink: 0;
      }

      .action-buttons {
        display: flex;
        flex-shrink: 0;
        gap: 8px;
        align-items: center;
      }

      .filter-popover-btn {
        display: inline-flex;
        align-items: center;
        justify-content: center;
        width: var(--el-component-size-small);
        height: var(--el-component-size-small);
        padding: 0;
        color: #909399;
        border-color: #dcdfe6;
        transition: all 0.2s ease;

        &:hover {
          color: var(--ElColor-primary);
        }

        &.is-active {
          color: var(--ElColor-primary);
          background-color: var(--ElColor-primary-light-9);
        }
      }
    }
  }

  // 浮窗样式
  :deep(.art-search-bar-popover) {
    padding: 0;

    .popover-form-content {
      min-width: 300px;
      padding: 16px;

      .el-form {
        .el-form-item {
          margin-bottom: 16px;

          &:last-child {
            margin-bottom: 0;
          }
        }
      }

      .popover-footer {
        display: flex;
        gap: 8px;
        align-items: center;
        justify-content: flex-end;
        padding-top: 16px;
        margin-top: 16px;
        border-top: 1px solid var(--el-border-color-lighter);
      }
    }
  }

  // 响应式优化
  @media (width <= 768px) {
    .art-search-bar {
      padding: 16px 16px 0;

      .search-form-space {
        .action-buttons {
          flex-wrap: wrap;
          justify-content: center;
        }
      }
    }
  }
</style>
