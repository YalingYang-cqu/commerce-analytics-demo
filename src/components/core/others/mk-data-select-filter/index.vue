<template>
  <el-popover
    placement="bottom"
    :width="300"
    trigger="click"
    v-model:visible="visible"
    @hide="handleClosePopover"
  >
    <div v-for="item in selectArr" :key="item" class="select-row">
      <div class="select-row-txt">{{ selectTxt[item] }}：</div>
      <mk-select
        class="select-row-select"
        v-model="selectValue[`${item}Value`]"
        :ref="setSelectRef"
        :placeholder="`请选择${selectTxt[item]}`"
        :options="selectList[`${item}List`]"
        :multiple="multipleArr.includes(item)"
        :label-value="setLabelValue(item)"
        @tag-change="handleTagChange($event, item)"
      />
    </div>
    <slot />
    <template #reference>
      <el-button
        :icon="Filter"
        style="width: 32px; padding: 0; color: #909399"
        :class="{ 'icon-btn-active-filter': visible }"
      />
    </template>
  </el-popover>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'
  import { ElButton, ElPopover } from 'element-plus'
  import { Filter } from '@element-plus/icons-vue'

  // 假设这些API函数已经转换为TypeScript版本
  import {
    dropdownChargerApi,
    searchCategoryTreeApi,
    searchBrandListApi,
    getCompanyListApi,
    dropdownProjectApi,
    dropdownGroupList
  } from '@/api/system-manage'

  // Types
  interface SelectOption {
    name: string
    value: string | number
    [key: string]: any
  }

  interface ApiResponse {
    data: any
  }

  interface AdsGroupParams {
    country?: Array<{ value: string }>
    store?: Array<{ sellerId: string }>
    activity?: Array<{ value: string }>
  }

  interface Props {
    selectArr?: string[]
    multipleArr?: string[]
    adsGroupParams?: AdsGroupParams
  }

  interface Emits {
    (e: 'closeFilter'): void
    (e: 'tagChange', value: Record<string, any>): void
  }

  // Props
  const props = withDefaults(defineProps<Props>(), {
    selectArr: () => ['person', 'category', 'brand', 'subject'],
    multipleArr: () => ['person', 'category', 'brand', 'subject'],
    adsGroupParams: () => ({})
  })

  // Emits
  const emit = defineEmits<Emits>()

  // Refs
  const visible = ref<boolean>(false)
  const selectList = ref<Record<string, SelectOption[]>>({})
  const selectValue = ref<Record<string, any>>({})
  const selectRefs = ref<Record<string, any>>({})

  // Constants
  const selectTxt: Record<string, string> = {
    person: '业务负责人',
    category: '分类',
    brand: '品牌',
    subject: '核算主体',
    project: '项目',
    putType: '投放类型',
    putTypeDetail: '投放类型',
    adsGroup: '广告组',
    saleStatus: '状态'
  }

  // Methods
  /** 设置选择器引用 */
  const setSelectRef = (el: any, key: string) => {
    if (el) {
      selectRefs.value[key] = el
    }
  }

  /** 关闭弹出框 */
  const handleClosePopover = (): void => {
    emit('closeFilter')
  }

  /** 重置数据 */
  const resetValue = (): void => {
    props.selectArr.forEach((item) => {
      selectValue.value[`${item}Value`] = []
      selectRefs.value[item]?.clearSelect?.()
    })
  }

  /** 投放类型数据 */
  const getPutTypeList = (): Promise<ApiResponse> => {
    return Promise.resolve({
      data: [
        { name: '自动', value: 'auto' },
        { name: '手动', value: 'manual' }
      ]
    })
  }

  /** 投放类型精确数据 */
  const getPutTypeDetaiList = (): Promise<ApiResponse> => {
    return Promise.resolve({
      data: [
        { name: '自动投放', value: '自动投放' },
        { name: '关键词投放', value: '关键词投放' },
        { name: '商品投放', value: '商品投放' }
      ]
    })
  }

  /** 销售状态列表 */
  const getSaleStatusList = (): Promise<ApiResponse> => {
    const data = [
      { name: '全部状态', value: '' },
      { name: '新品待售', value: '1' },
      { name: '正常在售', value: '2' },
      { name: '清货', value: '3' },
      { name: '清货下架', value: '4' },
      { name: '停售', value: '0' }
    ].filter((item) => {
      if (props.multipleArr.includes('saleStatus')) return item.value
      return true
    })

    return Promise.resolve({ data })
  }

  /** 获取广告组下拉列表 */
  const getADsGroupList = (type?: string): Promise<any> | void => {
    if (
      !props.selectArr.includes('adsGroup') ||
      !props.adsGroupParams?.country?.length ||
      !props.adsGroupParams?.store?.length ||
      !props.adsGroupParams?.activity?.length
    ) {
      if (type === 'reset' && selectList.value.adsGroupList && selectValue.value.adsGroupValue) {
        selectList.value.adsGroupList = []
        selectValue.value.adsGroupValue = []
      } else {
        return Promise.resolve({ data: [] })
      }
    } else {
      const campaignIdList = props.adsGroupParams.activity!.map((i) => i.value)
      const accountIdList = props.adsGroupParams.store!.map((i) => i.sellerId)
      const country = props.adsGroupParams.country![0].value

      if (type === 'reset') {
        dropdownGroupList({ campaignIdList, accountIdList, country }).then(
          ({ data }: { data: any }) => {
            selectList.value.adsGroupList = data
          }
        )
      } else {
        return dropdownGroupList({ campaignIdList, accountIdList, country })
      }
    }
  }

  /** 初始化数据 */
  const initData = (): void => {
    props.selectArr.forEach((item) => {
      selectList.value[`${item}List`] = []
      selectValue.value[`${item}Value`] = []
    })
  }

  /** 标签变化处理 */
  const handleTagChange = (val: any[], type: string): void => {
    if (type === 'saleStatus' && !props.multipleArr.includes('saleStatus')) {
      selectValue.value.saleStatusValue = val[0]
    }

    const result: Record<string, any> = {}
    props.selectArr.forEach((item) => {
      if (selectValue.value[`${item}Value`]?.length) {
        if (item === 'adsGroup') {
          const allFlag =
            selectValue.value[`${item}Value`].length === selectList.value[`${item}List`]?.length
          result[`${item}Value`] = allFlag ? [] : selectValue.value[`${item}Value`]
        } else {
          result[`${item}Value`] = selectValue.value[`${item}Value`]
        }
      }
    })

    emit('tagChange', result)
  }

  /** 设置标签值 */
  const setLabelValue = (key: string): { name: string; value: string } => {
    const valObj = {
      name: 'name',
      value: 'value'
    }

    switch (key) {
      case 'category':
        valObj.name = 'categoryName'
        break
      case 'brand':
        valObj.value = 'id'
        break
      default:
        break
    }

    return valObj
  }

  /** 获取选项列表 */
  const getOptionList = (): void => {
    const apiObj: Record<string, () => Promise<ApiResponse>> = {
      person: dropdownChargerApi,
      category: searchCategoryTreeApi,
      brand: searchBrandListApi,
      subject: getCompanyListApi,
      project: dropdownProjectApi,
      putType: getPutTypeList,
      putTypeDetail: getPutTypeDetaiList,
      adsGroup: getADsGroupList as () => Promise<ApiResponse>,
      saleStatus: getSaleStatusList
    }

    const apiArr = props.selectArr.map((item) => apiObj[item]())
    Promise.all(apiArr).then((responses) => {
      responses.forEach(({ data }, index) => {
        const key = props.selectArr[index]
        switch (key) {
          case 'person':
          case 'project':
            selectList.value[`${key}List`] = data.dtoList
            break
          case 'category': {
            const optionData: SelectOption[] = []
            const parseArray = (arr: any[]) => {
              arr.forEach((item) => {
                optionData.push(item.data)
                if (item.children?.length) {
                  parseArray(item.children)
                }
              })
            }
            parseArray(data)
            selectList.value.categoryList = optionData
            break
          }
          case 'adsGroup':
            selectList.value[`${key}List`] = data
            break
          case 'subject':
            selectList.value[`${key}List`] = data.map((item: any) => ({
              ...item,
              value: item.id
            }))
            break
          default:
            selectList.value[`${key}List`] = data
            break
        }
      })

      if (props.selectArr.includes('saleStatus') && !props.multipleArr.includes('saleStatus')) {
        selectValue.value.saleStatusValue = ''
      }
    })
  }

  // Watchers
  watch(
    () => props.adsGroupParams,
    () => {
      getADsGroupList('reset')
    },
    { deep: true }
  )

  // Lifecycle
  onMounted(() => {
    initData()
    getOptionList()
  })

  // Expose methods
  defineExpose({
    resetValue
  })
</script>

<style lang="scss" scoped>
  .select-row {
    display: flex;
    align-items: center;
    justify-content: space-around;
    margin-bottom: 15px;

    &-txt {
      width: 85px;
      text-align: right;
      white-space: nowrap;
    }

    &-select {
      width: 160px !important;

      :deep(.el-input__inner) {
        border-top: none;
        border-right: none;
        border-left: none;
      }
    }
  }

  .el-button.icon-btn-active-filter {
    border-color: #425eff;

    &:focus,
    &:hover {
      background: none;
    }

    :deep(.el-icon) {
      color: #425eff;
    }
  }
</style>
