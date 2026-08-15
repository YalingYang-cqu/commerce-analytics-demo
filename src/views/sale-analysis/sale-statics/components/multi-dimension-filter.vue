<template>
  <ArtSearchBar
    v-model="model"
    :items="searchItems"
    :show-expand="false"
    :show-search="false"
    label-width="0"
    default-item-width="150px"
    @search="emit('search')"
    @reset="emit('reset')"
  />
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import ArtSearchBar from '@/components/core/forms/art-search-bar/index.vue'
  import type { SearchFormItem } from '@/components/core/forms/art-search-bar/index.vue'
  import {
    pubBrandList,
    pubCategoryList,
    pubCountryList,
    pubGetUserList,
    pubStoreList
  } from '@/utils'
  import type { OptionItem, SalesFilterState } from './sales-types'
  import { DEFAULT_SITE } from '../../utils/site-date'

  defineOptions({ name: 'MultiDimensionFilter' })

  const props = defineProps<{
    supportsShop: boolean
  }>()

  const model = defineModel<SalesFilterState>({ required: true })
  const emit = defineEmits<{
    (e: 'search'): void
    (e: 'reset'): void
  }>()

  /** 产品状态：对齐 product_basic.product_status（0开发中/1在售/2清仓/3停售），按值升序展示 */
  const statusOptions: OptionItem<string>[] = [
    { label: '开发中', value: '0' },
    { label: '在售', value: '1' },
    { label: '清仓', value: '2' },
    { label: '停售', value: '3' }
  ]

  const siteOptions = ref<OptionItem<string>[]>([{ label: '美国', value: DEFAULT_SITE }])
  const shopOptions = ref<OptionItem<number>[]>([])
  const brandOptions = ref<OptionItem<number>[]>([])
  const categoryOptions = ref<OptionItem<number>[]>([])
  const ownerOptions = ref<OptionItem<number>[]>([])

  const flattenCategories = (
    nodes: Array<{ id: number; categoryName: string; children?: unknown[] }>,
    acc: OptionItem<number>[] = []
  ) => {
    for (const node of nodes) {
      if (node?.id != null) {
        acc.push({ label: node.categoryName, value: node.id })
      }
      const children = node.children as typeof nodes | undefined
      if (children?.length) flattenCategories(children, acc)
    }
    return acc
  }

  const searchItems = computed<SearchFormItem[]>(() => [
    {
      key: 'site',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: false,
      width: '140px',
      props: {
        options: siteOptions.value,
        placeholder: '国家',
        clearable: false,
        disabled: true
      }
    },
    {
      key: 'shopIds',
      label: '',
      type: 'select',
      hidden: !props.supportsShop,
      selectMultiple: true,
      alwaysFilterInput: true,
      width: '160px',
      props: { options: shopOptions.value, placeholder: '店铺', clearable: true }
    },
    {
      key: 'brandIds',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      width: '140px',
      props: { options: brandOptions.value, placeholder: '品牌', clearable: true }
    },
    {
      key: 'categoryIds',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      width: '150px',
      props: { options: categoryOptions.value, placeholder: '分类', clearable: true }
    },
    {
      key: 'ownerIds',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      width: '150px',
      props: { options: ownerOptions.value, placeholder: '销售负责人', clearable: true }
    },
    {
      key: 'productStatus',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      width: '140px',
      props: { options: statusOptions, placeholder: '产品状态', clearable: true }
    }
  ])

  const lockSiteToUs = () => {
    if (model.value.site.length !== 1 || model.value.site[0] !== DEFAULT_SITE) {
      model.value.site = [DEFAULT_SITE]
    }
  }

  watch(() => [...model.value.site], lockSiteToUs, { immediate: true })

  onMounted(async () => {
    lockSiteToUs()
    const [siteRes, shopRes, brandRes, categoryRes, ownerRes] = await Promise.allSettled([
      pubCountryList(),
      pubStoreList({ status: 1 }),
      pubBrandList({ brandStatus: 1 }),
      pubCategoryList({ status: '1' }),
      pubGetUserList([1])
    ])
    const usOption = (siteRes.status === 'fulfilled' ? siteRes.value : []).find(
      (item) => String(item.value).toUpperCase() === DEFAULT_SITE
    ) ?? { label: '美国', value: DEFAULT_SITE }
    siteOptions.value = [usOption]
    shopOptions.value = shopRes.status === 'fulfilled' ? shopRes.value : []
    brandOptions.value = brandRes.status === 'fulfilled' ? brandRes.value : []
    categoryOptions.value =
      categoryRes.status === 'fulfilled' ? flattenCategories(categoryRes.value || []) : []
    ownerOptions.value = ownerRes.status === 'fulfilled' ? ownerRes.value : []
  })
</script>
