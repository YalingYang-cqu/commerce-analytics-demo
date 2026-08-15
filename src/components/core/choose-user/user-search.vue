<template>
  <ArtSearchBar
    v-model="formData"
    :items="formItems"
    :showReset="false"
    :showSearch="false"
    @search="handleSearch"
  />
</template>

<script setup lang="ts">
  import SelectFnPre from './select-fn-pre.vue'
  import { Search } from '@element-plus/icons-vue'
  import { ElButton } from 'element-plus'

  interface Emits {
    (e: 'update:modelValue', value: Record<string, any>): void
    (e: 'search', params: Record<string, any>): void
    (e: 'reset'): void
  }

  const emit = defineEmits<Emits>()

  const formData = ref<Record<string, any>>({})
  const selectData = ref<number>(2)

  // 表单配置
  const formItems = computed(() => [
    {
      label: '',
      key: 'searchValue',
      type: 'input',
      width: 200,
      props: {
        clearable: true,
        size: 'small',
        placeholder: '搜索内容'
      },
      trigger: 'blur',
      slots: {
        prepend: () =>
          h(SelectFnPre, {
            list: [
              {
                value: 2,
                label: '用户名'
              },
              {
                value: 1,
                label: '真实姓名'
              },
              {
                value: 3,
                label: '手机号'
              }
              // {
              //   value: 4,
              //   label: '邮箱'
              // }
            ],
            onChange: (item: number) => selectChange(item)
          }),
        append: () =>
          h(
            ElButton,
            {
              icon: Search,
              size: 'small'
            },
            () => ''
          )
      }
    }
  ])

  async function handleSearch(): Promise<void> {
    // await searchBarRef.value.validate()
    formData.value = {
      ...formData.value,
      searchType: selectData.value
    }
    emit('search', formData.value)
  }
  // 选择修改
  const selectChange = (item: number): void => {
    selectData.value = item
    handleSearch()
  }
</script>

<style lang="scss" scoped>
  :deep(.el-input-group__append, .el-input-group__prepend) {
    background-color: #fff !important;
  }

  :deep(.el-input-group__prepend) {
    background-color: #fff !important;
  }
</style>
