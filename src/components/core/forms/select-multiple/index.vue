<template>
  <el-popover
    placement="bottom-start"
    :width="popoverWidth"
    trigger="click"
    v-model:visible="visible"
    popper-class="select-multiple-popover"
    @hide="handlePopoverHide"
  >
    <template #reference>
      <el-select
        v-model="selectDisplayValue"
        :placeholder="placeholder"
        clearable
        @clear="handleClear"
        class="select-multiple-input"
        popper-class="select-multiple-input-select"
        :popper-append-to-body="false"
        @visible-change="handleSelectVisibleChange"
      >
        <el-option v-if="selectDisplayText" :label="selectDisplayText" value="__display_text__" />
      </el-select>
    </template>

    <!-- 搜索框 -->
    <el-input
      v-model="searchText"
      placeholder="搜索内容"
      clearable
      class="select-multiple-search"
      @input="handleSearch"
    />

    <!-- 选项列表 -->
    <div class="select-multiple-options">
      <!-- 全选 -->
      <div class="select-multiple-option">
        <el-checkbox
          v-model="checkAll"
          :indeterminate="isIndeterminate"
          @change="handleCheckAllChange"
        >
          选择全部
        </el-checkbox>
      </div>

      <!-- 选项 -->
      <el-checkbox-group v-model="selectedValues" @change="handleSelectionChange">
        <div
          v-for="option in filteredOptions"
          :key="getOptionValue(option)"
          class="select-multiple-option"
        >
          <el-checkbox :value="getOptionValue(option)">
            {{ getOptionLabel(option) }}
          </el-checkbox>
        </div>
      </el-checkbox-group>
    </div>

    <!-- 操作按钮 -->
    <div class="select-multiple-actions">
      <el-button size="small" @click="handleCancel">取消</el-button>
      <el-button type="primary" size="small" @click="handleConfirm">确定</el-button>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
  import { ref, computed, watch } from 'vue'
  import {
    ElPopover,
    ElInput,
    ElSelect,
    ElOption,
    ElCheckbox,
    ElCheckboxGroup,
    ElButton
  } from 'element-plus'
  import { CheckboxValueType } from 'element-plus'

  defineOptions({ name: 'SelectMultiple' })

  // 选项类型
  interface SelectOption {
    label?: string
    value: string | number
    [key: string]: any
  }

  // Props
  interface Props {
    /** 绑定值 */
    modelValue?: (string | number)[]
    /** 选项列表 */
    options?: SelectOption[]
    /** 占位符 */
    placeholder?: string
    /** 标签字段名 */
    labelKey?: string
    /** 值字段名 */
    valueKey?: string
    /** 弹窗宽度 */
    popoverWidth?: number | string
  }

  const props = withDefaults(defineProps<Props>(), {
    modelValue: () => [],
    options: () => [],
    placeholder: '请选择',
    labelKey: 'label',
    valueKey: 'value',
    popoverWidth: 240
  })

  // Emits
  interface Emits {
    (e: 'update:modelValue', value: (string | number)[]): void
    (e: 'confirm', value: (string | number)[]): void
    (e: 'change', value: (string | number)[]): void
  }

  const emit = defineEmits<Emits>()

  // 响应式数据
  const visible = ref(false)
  const searchText = ref('')
  const selectDisplayValue = ref<string | number>('') // ElSelect 的显示值
  const selectedValues = ref<(string | number)[]>([])
  const tempSelectedValues = ref<(string | number)[]>([]) // 临时选中的值，用于取消操作

  // 计算属性
  const filteredOptions = computed(() => {
    if (!searchText.value) {
      return props.options
    }
    return props.options.filter((option) => {
      const label = getOptionLabel(option)
      return label.toLowerCase().includes(searchText.value.toLowerCase())
    })
  })

  const checkAll = computed({
    get: () => {
      if (filteredOptions.value.length === 0) return false
      return filteredOptions.value.every((option) =>
        selectedValues.value.includes(getOptionValue(option))
      )
    },
    set: (val: boolean) => {
      if (val) {
        selectedValues.value = [
          ...new Set([
            ...selectedValues.value,
            ...filteredOptions.value.map((option) => getOptionValue(option))
          ])
        ]
      } else {
        // 取消全选时，只取消当前过滤后的选项
        const filteredValues = filteredOptions.value.map((option) => getOptionValue(option))
        selectedValues.value = selectedValues.value.filter((val) => !filteredValues.includes(val))
      }
    }
  })

  const isIndeterminate = computed(() => {
    const checkedCount = filteredOptions.value.filter((option) =>
      selectedValues.value.includes(getOptionValue(option))
    ).length
    return checkedCount > 0 && checkedCount < filteredOptions.value.length
  })

  // 计算 ElSelect 的显示文本
  const selectDisplayText = computed(() => {
    if (selectedValues.value.length === 0) {
      return ''
    }
    if (selectedValues.value.length === props.options.length) {
      return '已全选'
    }
    if (selectedValues.value.length <= 3) {
      return selectedValues.value
        .map((val) => {
          const option = props.options.find((opt) => getOptionValue(opt) === val)
          return option ? getOptionLabel(option) : String(val)
        })
        .join('、')
    }
    return `已选${selectedValues.value.length}项`
  })

  // 监听显示文本变化，更新 ElSelect 的值
  watch(
    selectDisplayText,
    (newVal) => {
      // 使用一个虚拟值来显示文本，但不实际选择任何选项
      if (newVal) {
        // 创建一个临时选项用于显示
        selectDisplayValue.value = '__display_text__' as any
      } else {
        selectDisplayValue.value = ''
      }
    },
    { immediate: true }
  )

  // 方法
  const getOptionLabel = (option: SelectOption): string => {
    if (typeof option === 'string' || typeof option === 'number') {
      return String(option)
    }
    return option[props.labelKey] ?? String(option[props.valueKey] ?? '')
  }

  const getOptionValue = (option: SelectOption): string | number => {
    if (typeof option === 'string' || typeof option === 'number') {
      return option
    }
    return option[props.valueKey] ?? ''
  }

  const handleSearch = () => {
    // 搜索时保持选中状态
  }

  const handleCheckAllChange = (val: CheckboxValueType) => {
    checkAll.value = val as boolean
  }

  const handleSelectionChange = () => {
    // 选择变化时的处理
  }

  const handleConfirm = () => {
    // 确认选择
    emit('update:modelValue', [...selectedValues.value])
    emit('confirm', [...selectedValues.value])
    emit('change', [...selectedValues.value])
    visible.value = false
    searchText.value = ''
    // 更新显示值
    selectDisplayValue.value = selectDisplayText.value ? ('__display_text__' as any) : ''
  }

  const handleCancel = () => {
    // 取消选择，恢复临时值
    selectedValues.value = [...tempSelectedValues.value]
    visible.value = false
    searchText.value = ''
    // 更新显示值
    selectDisplayValue.value = selectDisplayText.value ? ('__display_text__' as any) : ''
  }

  const handleClear = () => {
    selectedValues.value = []
    tempSelectedValues.value = []
    selectDisplayValue.value = ''
    emit('update:modelValue', [])
    emit('change', [])
  }

  const handleSelectVisibleChange = (val: boolean) => {
    // 阻止 ElSelect 的下拉菜单显示，使用我们的 popover
    if (val) {
      // 阻止默认行为，打开我们的 popover
      visible.value = true
    }
  }

  const handlePopoverHide = () => {
    // 弹窗关闭时，如果没有确认，恢复临时值
    if (visible.value === false) {
      selectedValues.value = [...tempSelectedValues.value]
      searchText.value = ''
      selectDisplayValue.value = selectDisplayText.value ? ('__display_text__' as any) : ''
    }
  }

  // 监听弹窗打开，保存当前选中值作为临时值
  watch(visible, (newVal) => {
    if (newVal) {
      tempSelectedValues.value = [...selectedValues.value]
    }
  })

  // 监听外部值变化
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        selectedValues.value = [...newVal]
        tempSelectedValues.value = [...newVal]
      } else {
        selectedValues.value = []
        tempSelectedValues.value = []
      }
      // 更新显示值
      selectDisplayValue.value = selectDisplayText.value ? ('__display_text__' as any) : ''
    },
    { immediate: true, deep: true }
  )
</script>

<style lang="scss" scoped>
  .select-multiple-input {
    width: 100%;

    :deep(.el-input__inner) {
      cursor: pointer;
    }

    :deep(.el-input__suffix) {
      cursor: pointer;
    }
  }

  // 隐藏 ElSelect 的下拉菜单
  :deep(.select-multiple-input-select) {
    display: none !important;
  }

  :deep(.select-multiple-popover) {
    padding: 12px;

    .select-multiple-search {
      margin-bottom: 12px;

      :deep(.el-input__inner) {
        border-bottom: 1px solid var(--el-border-color-light);
        border-radius: 0;
      }
    }

    .select-multiple-options {
      max-height: 240px;
      margin-bottom: 12px;
      overflow-y: auto;

      .select-multiple-option {
        padding: 8px 0;
        line-height: 1.5;

        &:first-child {
          padding-bottom: 8px;
          margin-bottom: 4px;
          border-bottom: 1px solid var(--el-border-color-lighter);
        }

        :deep(.el-checkbox) {
          width: 100%;

          .el-checkbox__label {
            width: 100%;
            padding-left: 8px;
          }
        }
      }
    }

    .select-multiple-actions {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding-top: 12px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }
</style>
