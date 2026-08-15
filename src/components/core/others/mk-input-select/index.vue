<template>
  <div class="public-selInp">
    <!-- showOption:true; 默认不设置=显示 -->
    <el-select class="mk-select" v-model="searchArr.searchTypeSel" placeholder="请选择">
      <el-option
        v-for="(item, index) in filteredSearchTypeArr"
        :key="index"
        :value="item[labelValue.value]"
        :label="item[labelValue.label]"
      />
    </el-select>
    <el-input
      v-model.trim="searchArr.searchTypeInp"
      placeholder="请输入内容"
      autocomplete="off"
      clearable
      @change="handleCheckedSelInp"
      @blur="handleBlur"
      @input="handleInput"
      @clear="handleCheckedSelInp"
    >
      <template #suffix>
        <el-icon @click="handleCheckedSelInp" style="order: 2">
          <Search />
        </el-icon>
      </template>
    </el-input>
  </div>
</template>

<script setup lang="ts">
  import { ref, computed, onMounted, watch } from 'vue'
  import { Search } from '@element-plus/icons-vue'

  interface SearchTypeItem {
    [key: string]: any
    label?: string
    value?: string
    showOption?: boolean
  }

  interface LabelValue {
    label: string
    value: string
  }

  interface SearchArr {
    searchTypeSel: string
    searchTypeInp: string
  }

  interface SelInpForm {
    [key: string]: string
  }

  // Props
  interface Props {
    searchTypeArr?: SearchTypeItem[]
    defaultSearchType?: string
    isInput?: boolean
    labelValue?: LabelValue
    selInpClearFlag?: boolean | string
  }

  const props = withDefaults(defineProps<Props>(), {
    searchTypeArr: () => [],
    defaultSearchType: '',
    isInput: false,
    labelValue: () => ({
      label: '',
      value: ''
    }),
    selInpClearFlag: false
  })

  const searchArr = ref<SearchArr>({
    searchTypeInp: '',
    searchTypeSel: ''
  })

  interface Emits {
    (e: 'fnCheckedSelInp', SelInpForm: SelInpForm, searchTypeSel: string): void
  }

  // Emits
  const emits = defineEmits<Emits>()

  // Computed
  const filteredSearchTypeArr = computed(() =>
    props.searchTypeArr.filter((item) => !item.showOption)
  )

  // methods
  const handleResetInpSel = (): void => {
    searchArr.value.searchTypeInp = ''
    searchArr.value.searchTypeSel = props.defaultSearchType
  }
  const handleCheckedSelInp = (): void => {
    const selInpForm: SelInpForm = {}
    props.searchTypeArr.forEach((item) => {
      if (item[props.labelValue.value] === searchArr.value.searchTypeSel) {
        selInpForm[item[props.labelValue.value]] = searchArr.value.searchTypeInp
      } else {
        selInpForm[item[props.labelValue.value]] = ''
      }
    })
    emits('fnCheckedSelInp', selInpForm, searchArr.value.searchTypeSel)
  }

  const handleInput = (val: string): void => {
    if (!val && props.isInput) {
      handleCheckedSelInp()
    }
  }

  const handleBlur = (): void => {
    if (searchArr.value.searchTypeInp) {
      handleCheckedSelInp()
    }
  }

  // Lifecycle
  onMounted(() => {
    searchArr.value.searchTypeSel = props.defaultSearchType
  })

  // Watchers
  watch(
    () => props.defaultSearchType,
    (val: string) => {
      searchArr.value.searchTypeSel = val
    }
  )

  watch(
    () => props.selInpClearFlag,
    () => {
      handleResetInpSel()
    }
  )

  // Expose methods
  defineExpose({
    handleResetInpSel
  })
</script>

<style scoped lang="scss">
  .public-selInp {
    position: relative;
    z-index: 1200;
    display: flex;
    gap: 0;
    align-items: stretch;
    width: 320px;
    min-height: 32px;
    padding: 0;
    overflow: hidden; // 改为 hidden，防止内容溢出
    background: #fff;
    border: 1px solid #dcdfe6;
    border-radius: 5px;

    & > .el-select {
      position: relative;
      z-index: 0;
      display: flex;
      flex-shrink: 0;
      align-items: center;
      min-width: 80px;
      max-width: 120px;
      padding: 0 8px 0 0;
      margin: 0;
      overflow: visible;
      pointer-events: auto;
      background: transparent !important;
      border: 0 !important;

      // 使用伪元素创建分隔线，避免遮挡容器边框
      &::after {
        position: absolute;
        top: 20%;
        right: 0;
        bottom: 20%;
        z-index: 0;
        width: 1px;
        pointer-events: none;
        content: '';
        background-color: #dcdfe6;
      }

      :deep(.el-select__wrapper) {
        width: 100%;
        height: 100%;
        min-height: 32px;
        background: transparent !important;
        border: 0 !important;
        outline: none !important;
        box-shadow: none !important;
      }

      :deep(.is-hovering) {
        border: 0 !important;
        outline: none !important;
        box-shadow: none !important;
      }

      :deep(.el-input__wrapper) {
        background: transparent !important;
        border: 0 !important;
        outline: none !important;
        box-shadow: none !important;
      }

      :deep(.el-select__selected-item) {
        background: transparent !important;
      }
    }

    & > .el-input {
      position: relative;
      z-index: 0;
      display: flex;
      flex: 1;
      align-items: center;
      min-width: 0;
      height: 100%;
      padding: 0;
      overflow: visible;
    }

    :deep(.el-input__wrapper),
    :deep(.el-select .el-input__wrapper) {
      height: 100%;
      min-height: 32px;
      padding: 0 8px 0 0;
      background: transparent !important;
      border: 0 !important;
      border-radius: 0;
      outline: none;
      box-shadow: none !important;
    }

    :deep(.el-select:hover .el-input__wrapper),
    :deep(.el-select .el-input__wrapper:hover),
    :deep(.el-input__wrapper:hover) {
      background: transparent !important;
      border-color: transparent !important;
      outline: none !important;
      box-shadow: none !important;
      box-shadow: inset 0 0 0 1px transparent !important;
    }

    :deep(.el-select .el-input__wrapper:hover),
    :deep(.el-select .el-input__wrapper.is-focus),
    :deep(.el-input__wrapper.is-focus),
    :deep(.el-select .is-focus .el-input__wrapper),
    :deep(.el-select .is-disabled .el-input__wrapper) {
      background: transparent !important;
      border: 0 !important;
      box-shadow: none !important;
    }

    :deep(.el-input__wrapper.is-focus),
    :deep(.el-select .el-input__wrapper.is-focus),
    :deep(.is-focus .el-input__wrapper),
    :deep(.el-select .is-focus .el-input__wrapper) {
      border-color: transparent !important;
      box-shadow: none !important;
    }

    :deep(.is-focus .el-input__wrapper),
    :deep(.el-select .is-focus .el-input__wrapper) {
      border-color: transparent !important;
      box-shadow: none !important;
    }

    :deep(.el-input__inner),
    :deep(.el-select .el-input__inner) {
      width: 100%;
      height: 100%;
      min-height: 32px;
      padding-right: 60px; // 为清除按钮和搜索图标留出空间
      padding-left: 10px;
      line-height: 32px;
      border-width: 0;
    }

    :deep(.el-input__inner::placeholder) {
      color: #9ca3af;
    }

    :deep(.el-input__inner:focus),
    :deep(.el-select .is-focus .el-input__inner) {
      box-shadow: none;
    }

    &:focus-within {
      border-color: #425eff;
      box-shadow: 0 0 0 2px rgb(66 94 255 / 12%);

      // 焦点状态下，确保选择框的分隔线颜色与容器边框一致
      & > .el-select::after {
        background-color: #dcdfe6;
      }

      // 确保选择框及其内部所有元素都不会遮挡边框高亮
      // 使用!important确保样式优先级最高
      & > .el-select {
        z-index: 0 !important;
        background: transparent !important;
        border: 0 !important;
        outline: none !important;
        box-shadow: none !important;

        :deep(.el-select__wrapper) {
          background: transparent !important;
          border: 0 !important;
          outline: none !important;
          box-shadow: none !important;
        }

        :deep(.el-input__wrapper) {
          background: transparent !important;
          border: 0 !important;
          outline: none !important;
          box-shadow: none !important;
        }

        :deep(.el-select__selected-item) {
          background: transparent !important;
        }

        :deep(.el-select__placeholder) {
          background: transparent !important;
        }
      }
    }

    :deep(.el-input__suffix) {
      right: 8px;
      display: flex;
      flex-direction: row-reverse; // 反转顺序：搜索图标在右，清除按钮在左
      gap: 8px;
      align-items: center;
      width: auto;
      padding-left: 4px;

      // 清除按钮样式（应该在左边）
      .el-input__clear {
        order: 2; // 在 row-reverse 下，order: 2 会显示在左边
        width: 16px;
        height: 16px;
        margin-right: 0;
        color: #9ca3af;
        cursor: pointer;

        &:hover {
          color: #425eff;
        }
      }

      // 搜索图标样式（应该在右边）
      .el-icon {
        flex-shrink: 0;
        order: 1; // 在 row-reverse 下，order: 1 会显示在右边
        width: 18px;
        height: 18px;
        color: #9ca3af;
        cursor: pointer;
      }

      .el-icon:hover {
        color: #425eff;
      }
    }

    :deep(.el-select .el-input__suffix) {
      right: 6px;
      display: flex;
      align-items: center;
      width: 20px;
    }
  }

  .set-popover .public-selInp {
    width: auto;
  }
</style>
