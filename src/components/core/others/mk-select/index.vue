<template>
  <el-select
    class="mk-select"
    v-model="selectValue"
    :multiple="multiple"
    :clearable="clearable"
    :collapse-tags="multiple"
    :placeholder="placeholder"
    :disabled="disabled"
    popper-class="mk-select-dropdown"
    :style="{ width: typeof widthComputed === 'number' ? widthComputed + 'px' : widthComputed }"
    @change="handleChange"
    @clear="handleClear"
    @remove-tag="removeTag"
    @visible-change="visibleChange"
    size="small"
  >
    <el-input
      v-if="filterable && (alwaysFilterInput || options.length > 8)"
      class="mk-select-input"
      size="small"
      clearable
      v-model="inputValue"
      placeholder="搜索内容"
      @input="inputChange"
    />

    <template v-if="filteredOptionList && filteredOptionList.length">
      <!-- 多选模式 -->
      <template v-if="multiple">
        <!-- 多选才有全选按钮 -->
        <el-option value="" label="全选" class="mk-select-option" disabled>
          <el-checkbox
            size="small"
            v-model="checkAll"
            :indeterminate="isIndeterminate"
            @change="checkAllChange"
          >
            全选
          </el-checkbox>
        </el-option>

        <el-checkbox-group v-model="checkArr" @change="checkedChange">
          <el-option
            class="mk-select-option"
            v-for="item in filteredOptionList"
            :key="item[labelValue.value]"
            :label="item[labelValue.name]"
            :value="item[labelValue.value]"
          >
            <el-checkbox
              size="small"
              :value="item[labelValue.name]"
              :label="item[labelValue.name]"
              :disabled="item.disabled"
            />
          </el-option>
        </el-checkbox-group>
      </template>
      <!-- 单选模式 -->
      <template v-else>
        <el-option
          class="mk-select-option"
          v-for="item in filteredOptionList"
          :key="item[labelValue.value]"
          :label="item[labelValue.name]"
          :value="item[labelValue.value]"
          :disabled="item.disabled"
        >
          {{ item[labelValue.name] }}
        </el-option>
      </template>
    </template>

    <template v-else>
      <el-option value="" label="" class="mk-select-option" disabled> 暂无数据 </el-option>
    </template>
  </el-select>
</template>

<script setup lang="ts">
  import { ref, watch, computed, inject, nextTick } from 'vue'
  import { CheckboxValueType, formItemContextKey } from 'element-plus'

  // Types
  interface SelectOption {
    [key: string]: any
    name?: string
    value?: string
  }

  interface LabelValue {
    name: string
    value: string
  }

  interface Props {
    modelValue?: string | string[] | number[] | number
    multiple?: boolean
    disabled?: boolean
    clearable?: boolean
    options?: SelectOption[]
    labelValue?: LabelValue
    placeholder?: string
    filterable?: boolean
    allCheck?: boolean
    isBackArray?: boolean
    isChangeCallBack?: boolean
    alwaysFilterInput?: boolean
    width?: number | string
  }

  interface Emits {
    (e: 'update:modelValue', value: string | string[] | number): void
    (e: 'tagChange', value: string | string[] | number): void
    (e: 'change', value: string | string[] | number): void
    (e: 'visible-change', visible: boolean): void
    (e: 'remove-tag', tag: string): void
    (e: 'clear'): void
  }

  // Props
  const props = withDefaults(defineProps<Props>(), {
    modelValue: '',
    multiple: false,
    disabled: false,
    clearable: true,
    options: () => [],
    labelValue: () => ({
      name: 'name',
      value: 'value'
    }),
    placeholder: '请选择',
    filterable: true,
    allCheck: true,
    isBackArray: true,
    isChangeCallBack: true,
    alwaysFilterInput: false,
    width: '240px'
  })

  // Emits
  const emit = defineEmits<Emits>()

  /** 挂载在 ElFormItem 下时再校验；nextTick 保证父表单 v-model 已写入，避免多选勾选后读到空值误判 */
  const formItemCtx = inject(formItemContextKey, undefined) as
    | undefined
    | { validate?: (trigger?: string) => Promise<void> }

  const scheduleFormItemChangeValidate = (): void => {
    nextTick(() => {
      formItemCtx?.validate?.('change').catch(() => {})
    })
  }

  // Reactive data
  const inputValue = ref('')
  const optionList = ref<SelectOption[]>([])
  const checkArr = ref<string[]>([])
  const selectValue = ref<string | string[] | number[] | number>(props.multiple ? [] : '')
  const isIndeterminate = ref(false)
  const checkAll = ref(false)
  const changeFlag = ref(false)
  const isFiltering = ref(false)

  // Computed
  const labelValue = computed(() => props.labelValue)
  const widthComputed = computed(() => props.width)

  // 过滤后的选项列表
  const filteredOptionList = computed(() => {
    if (!isFiltering.value || !inputValue.value) {
      return optionList.value
    }
    return optionList.value.filter((i) =>
      i[props.labelValue.name]?.toLowerCase().includes(inputValue.value.toLowerCase())
    )
  })

  // Methods
  const clearData = (): void => {
    inputValue.value = ''
    optionList.value = []
    checkArr.value = []
    selectValue.value = props.multiple ? [] : ''
    isIndeterminate.value = false
    checkAll.value = false
    changeFlag.value = false
  }

  const clearSelect = (): void => {
    clearData()
    optionList.value = props.options
  }

  /** 多选：外部 v-model / options 变更写入 checkArr 后，与 checkedChange 一致地刷新「全选/半选」（按当前过滤后的列表） */
  const syncCheckAllStateFromCheckArr = (): void => {
    if (!props.multiple) return
    const currentOptions = filteredOptionList.value
    if (currentOptions.length === 0) {
      checkAll.value = false
      isIndeterminate.value = false
      return
    }
    const namesInView = currentOptions.map((i) => i[props.labelValue.name])
    const n = namesInView.filter((name) => checkArr.value.includes(name)).length
    checkAll.value = n === currentOptions.length
    isIndeterminate.value = n > 0 && n < currentOptions.length
  }

  const handleChange = (val: string | string[]): void => {
    changeFlag.value = true
    // 单选模式下，直接更新 selectValue 并触发事件
    if (!props.multiple) {
      selectValue.value = val as string
      if (props.isChangeCallBack) {
        tagChange()
      }
    } else {
      // 多选模式下，过滤掉空字符串（防止"全选"选项被选中）
      if (Array.isArray(val)) {
        const filteredVal = val.filter((v) => v !== '')
        if (filteredVal.length !== val.length) {
          // 如果过滤掉了空字符串，更新 selectValue
          selectValue.value = filteredVal
          return
        }
      }
      // 多选模式下，由 checkedChange 处理，这里不需要调用 tagChange
      // 避免与 checkedChange 重复触发，导致取消勾选被执行两次
    }
  }

  const visibleChange = (isVisible: boolean): void => {
    emit('visible-change', isVisible)
    if (!isVisible) {
      // 关闭下拉框时重置搜索状态
      inputValue.value = ''
      isFiltering.value = false
    }
    if (isVisible || !changeFlag.value) return
    if (changeFlag.value) {
      changeFlag.value = false
    }

    if (!props.isChangeCallBack) {
      tagChange()
    }
  }

  const removeTag = (tag: string): void => {
    const name = props.options.find((i) => i[props.labelValue.value] === tag)?.[
      props.labelValue.name
    ]

    if (name) {
      checkArr.value = checkArr.value.filter((item) => item !== name)
      syncCheckAllStateFromCheckArr()
      tagChange()
      emit('remove-tag', tag)
    }
  }

  const inputChange = (value: string): void => {
    isFiltering.value = !!value
    // 不需要直接修改optionList，使用computed属性过滤
  }

  const checkedChange = (val: CheckboxValueType[]): any => {
    const currentOptions = filteredOptionList.value
    const checkedCount = val.length
    checkAll.value = checkedCount === currentOptions.length && currentOptions.length > 0
    isIndeterminate.value = checkedCount > 0 && checkedCount < currentOptions.length

    // 获取所有已选中的选项名称（包括之前选中的不在当前过滤结果中的选项）
    const allSelectedNames = new Set<string>()
    // 先添加当前选中的
    val.forEach((name) => allSelectedNames.add(String(name)))
    // 再添加之前已选中但不在当前过滤结果中的选项
    const currentSelectedValues = currentOptions
      .filter((i) => val.includes(i[props.labelValue.name]))
      .map((i) => i[props.labelValue.value])
    const previousSelected = (selectValue.value as string[]).filter(
      (v) => v !== '' && !currentSelectedValues.includes(v)
    )
    previousSelected.forEach((value) => {
      const option = props.options.find((i) => i[props.labelValue.value] === value)
      if (option) {
        allSelectedNames.add(option[props.labelValue.name])
      }
    })

    // 从所有选项中获取选中的值，过滤掉空字符串
    selectValue.value = props.options
      .filter((i) => allSelectedNames.has(i[props.labelValue.name]))
      .map((i) => i[props.labelValue.value])
      .filter((v) => v !== '')

    if (props.isChangeCallBack) {
      tagChange()
    } else {
      // 失焦时触发：标记有变更，待下拉关闭时由 visibleChange 调用 tagChange
      changeFlag.value = true
    }
  }

  const checkAllChange = (): any => {
    const currentOptions = filteredOptionList.value
    const currentOptionNames = currentOptions.map((i) => i[props.labelValue.name])
    const currentOptionValues = currentOptions.map((i) => i[props.labelValue.value])

    // 检查当前过滤后的选项是否都已选中
    const allCurrentSelected = currentOptionNames.every((name) => checkArr.value.includes(name))

    // 如果当前所有选项都已选中，则取消全选；否则全选
    const shouldSelectAll = !allCurrentSelected

    if (shouldSelectAll) {
      // 全选：添加当前过滤后的所有选项
      const allSelectedNames = new Set<string>(checkArr.value)
      currentOptionNames.forEach((name) => allSelectedNames.add(name))
      const newCheckArr = Array.from(allSelectedNames)

      // 直接更新 checkArr，el-checkbox-group 应该会自动响应
      checkArr.value = newCheckArr

      // 合并之前已选中的值（selectValue 可能为 '' 时需防御性处理）
      const currentVal = selectValue.value
      const previousSelected = Array.isArray(currentVal)
        ? (currentVal as (string | number)[]).filter(
            (v) => v !== '' && v != null && !currentOptionValues.includes(v)
          )
        : []
      selectValue.value = [...previousSelected, ...currentOptionValues] as (string | number)[]

      // 更新全选状态
      checkAll.value = true
      isIndeterminate.value = false

      // 手动触发 checkedChange 来确保状态同步和触发事件
      checkedChange(newCheckArr as CheckboxValueType[])
    } else {
      // 取消全选：移除当前过滤后的所有选项
      const currentOptionNamesSet = new Set(currentOptionNames)
      const newCheckArr = checkArr.value.filter((name) => !currentOptionNamesSet.has(name))

      // 先更新 checkArr，避免 checkedChange 中的状态计算错误
      checkArr.value = newCheckArr

      // 更新 selectValue，移除当前过滤结果中的所有选项，同时过滤掉空字符串
      const currentVal = selectValue.value
      selectValue.value = Array.isArray(currentVal)
        ? (currentVal as (string | number)[]).filter(
            (v) => v !== '' && v != null && !currentOptionValues.includes(v)
          )
        : []

      // 更新全选状态（必须在调用 checkedChange 之前设置，避免状态被重新计算）
      const finalCheckedCount = newCheckArr.length
      checkAll.value = false
      isIndeterminate.value = finalCheckedCount > 0 && finalCheckedCount < props.options.length

      // 手动触发 checkedChange 来确保状态同步和触发事件
      if (props.isChangeCallBack) {
        tagChange()
      } else {
        changeFlag.value = true
      }
    }
  }

  const handleClear = (): void => {
    selectValue.value = props.multiple ? [] : ''
    checkArr.value = []
    isIndeterminate.value = false
    checkAll.value = false
    // 单选：Element Plus 清除时会先触发 @change(空值)，handleChange 已 tagChange；此处再调会导致父组件重复执行（如重复请求详情）
    if (props.multiple) {
      tagChange()
    }
    emit('clear')
  }

  const tagChange = (): void => {
    let changeValue: string | string[] | number = []

    if (props.multiple) {
      // 多选模式：返回数组
      if (typeof selectValue.value === 'string' && props.isBackArray) {
        changeValue = selectValue.value ? [selectValue.value] : []
      } else {
        changeValue = selectValue.value as string[]
      }
    } else {
      // 单选模式：0 是有效值，不能用 || 判断（0 || '' 会得到 ''）
      const val = selectValue.value
      changeValue = val !== undefined && val !== null && val !== '' ? val : ''
    }

    if (checkAll.value && !props.allCheck && props.multiple) {
      emit('update:modelValue', [])
      emit('tagChange', [])
      emit('change', [])
    } else {
      emit('update:modelValue', changeValue)
      emit('tagChange', changeValue)
      emit('change', changeValue)
    }
    scheduleFormItemChangeValidate()
  }

  // Watchers
  watch(
    () => props.options,
    (val) => {
      if (val?.length > 0 && props.multiple && (props.modelValue as string[])?.length > 0) {
        const defaultArr: string[] = []
        val.forEach((itemList) => {
          ;(props.modelValue as string[]).forEach((itemVal) => {
            if (itemList[props.labelValue.value] === itemVal) {
              defaultArr.push(itemList[props.labelValue.name])
            }
          })
        })
        checkArr.value = defaultArr
        syncCheckAllStateFromCheckArr()
      }
      optionList.value = val || []
    },
    { immediate: true }
  )

  watch(
    () => props.modelValue,
    (val) => {
      // 多选模式下：空值归一为 []；单值（非数组）多为 ElSelect 仅选一项时传入 string/number，需包成数组再写回父级，否则下面会把 selectValue 设成标量，表单项 type:array 校验失败
      if (props.multiple && !Array.isArray(val)) {
        if (val === '' || val == null || val === undefined) {
          selectValue.value = []
          checkArr.value = []
          isIndeterminate.value = false
          checkAll.value = false
          return
        }
        const wrapped = [val] as (string | number)[]
        emit('update:modelValue', wrapped)
        emit('tagChange', wrapped)
        emit('change', wrapped)
        return
      }

      // 多选模式下，过滤掉空字符串
      if (props.multiple && Array.isArray(val)) {
        const valArray = val as (string | number)[]
        const filteredVal = valArray.filter(
          (v: string | number) => v !== '' && v !== null && v !== undefined
        ) as string[]
        if (filteredVal.length !== valArray.length) {
          // 如果过滤掉了空字符串，更新 modelValue
          emit('update:modelValue', filteredVal)
          return
        }
      }

      selectValue.value = props.multiple && !Array.isArray(val) ? [] : val
      if (val && Array.isArray(val) && val.length === 0) {
        selectValue.value = props.multiple ? [] : ''
        checkArr.value = []
        isIndeterminate.value = false
        checkAll.value = false
      } else if (props.multiple && val && Array.isArray(val) && props.options?.length > 0) {
        // 多选模式下，同步 checkArr 以保持复选框状态一致
        const defaultArr: string[] = []
        props.options.forEach((itemList) => {
          ;(val as string[]).forEach((itemVal) => {
            if (itemList[props.labelValue.value] === itemVal) {
              defaultArr.push(itemList[props.labelValue.name])
            }
          })
        })
        checkArr.value = defaultArr
        syncCheckAllStateFromCheckArr()
      }
    },
    { deep: true, immediate: true }
  )

  // Expose methods
  defineExpose({
    selectValue,
    clearData,
    clearSelect
  })
</script>

<style scoped lang="scss">
  .mk-select {
    min-width: 140px;
    height: 34px;
    line-height: 34px;
    border-radius: 5px;

    :deep(.el-select__tags) {
      display: flex;
      flex-wrap: nowrap;
      align-items: center;
      max-height: 36px;
      overflow: hidden;
    }

    :deep(.el-tag) {
      display: flex;
      align-items: center;

      .el-select__tags-text {
        display: inline-block;
        max-width: 50px;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      .el-tag__close.el-icon-close {
        top: 2px;
      }
    }

    :deep(.el-select__wrapper) {
      height: 34px;
      line-height: 34px;
      border-radius: 5px;
    }

    :deep(.el-input__wrapper) {
      height: 32px !important;
      min-height: 32px !important;
    }

    :deep(.el-input__inner) {
      height: 36px;
      padding-right: 20px;
      padding-left: 8px;
      line-height: 36px;
      background: #fff;
      border-color: #dcdfe6;
      border-radius: 8px;
    }

    :deep(.is-focus .el-input__inner) {
      border-color: #425eff;
      box-shadow: 0 0 0 2px rgb(66 94 255 / 12%);
    }

    :deep(.el-input__suffix) {
      right: 0;
      width: 20px;

      .el-input__icon {
        width: 20px;
      }
    }
  }

  .mk-select-input {
    position: absolute;
    top: 0;
    left: 0;
    z-index: 2;
    padding: 4px 8px 6px;
    font-size: 12px;
    background: #fff;

    :deep(.el-input__wrapper) {
      height: 24px !important;
      min-height: 24px !important;
      padding: 0 4px;
      box-shadow: none;
    }

    :deep(.el-input__inner) {
      height: 24px;
      padding-left: 0;
      font-size: 12px;
      line-height: 24px;
      border: none;
      border-bottom: 1px solid #e4e7ed;
    }

    :deep(.el-input__inner::placeholder) {
      font-size: 12px;
    }

    & + .el-checkbox-group {
      margin-top: 40px;

      .mk-select-option.is-disabled {
        text-align: center;
      }
    }

    & + .mk-select-option {
      margin-top: 40px;

      &.is-disabled {
        text-align: center;
      }
    }
  }

  .mk-select-option {
    padding: 0 8px;

    .el-checkbox {
      width: 100%;
    }

    &.selected::after {
      display: none !important;
    }
  }
</style>

<!-- 弹出层 teleport 到 body，必须非 scoped 才能命中「搜索内容 / 全选 / 选项」 -->
<style lang="scss">
  .mk-select-dropdown {
    font-size: 12px !important;

    .mk-select-input {
      font-size: 12px !important;

      .el-input__wrapper {
        height: 24px !important;
        min-height: 24px !important;
        padding: 0 4px !important;
        box-shadow: none !important;
      }

      .el-input__inner,
      input {
        height: 24px !important;
        font-size: 12px !important;
        line-height: 24px !important;
      }

      .el-input__inner::placeholder,
      input::placeholder {
        font-size: 12px !important;
      }
    }

    .el-select-dropdown__item {
      height: 28px !important;
      font-size: 12px !important;
      line-height: 28px !important;
    }

    .el-checkbox,
    .el-checkbox__label {
      font-size: 12px !important;
    }
  }
</style>
