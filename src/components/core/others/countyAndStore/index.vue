<template>
  <div class="select-group">
    <MkSelect
      v-if="selectArr.includes('country')"
      :class="`select-model ${
        multipleArr.includes('country') ? 'countrys-model' : 'country-model'
      }`"
      ref="countryRef"
      :clearable="clearCountry"
      :filterable="false"
      v-model="countryValue"
      :options="countryList"
      placeholder="国家"
      :multiple="multipleArr.includes('country')"
      @tag-change="handleChange($event, 'country')"
    />
    <MkSelect
      v-if="selectArr.includes('store')"
      class="select-model"
      ref="storeRef"
      :clearable="clearStore"
      v-model="storeValue"
      :options="storeList"
      :multiple="multipleArr.includes('store')"
      placeholder="店铺"
      @tag-change="handleChange($event, 'store')"
    />
    <MkSelect
      v-if="selectArr.includes('activity')"
      class="select-model"
      ref="activityRef"
      v-model="activityValue"
      :options="activityList"
      :multiple="multipleArr.includes('activity')"
      placeholder="广告活动"
      @tag-change="handleChange($event, 'activity')"
    />
    <MkSelect
      v-if="selectArr.includes('group')"
      class="select-model"
      ref="groupRef"
      v-model="groupValue"
      :options="groupList"
      :multiple="multipleArr.includes('group')"
      placeholder="广告组"
      @tag-change="handleChange($event, 'group')"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, nextTick } from 'vue'
  import MkSelect from './../mk-select/index.vue'
  import { useDropListStore } from '@/store/modules/componentCofig'
  import { dropdownAccountApi, dropdownCampaignList, dropdownGroupList } from '@/api/system-manage'

  // Types
  interface SelectOption {
    value: string
    label?: string
    sellerId?: string
    [key: string]: any
  }

  interface DefaultValue {
    country?: SelectOption[]
    store?: SelectOption[]
    activity?: SelectOption[]
    group?: SelectOption[]
    countryAllFlag?: boolean
    storeAllFlag?: boolean
    activityAllFlag?: boolean
    groupAllFlag?: boolean
  }

  interface Props {
    selectArr?: string[]
    multipleArr?: string[]
    defaultCountry?: string
    defaultValue?: DefaultValue
    clearStore?: boolean
    clearCountry?: boolean
  }

  interface Emits {
    (e: 'getCountryAndStore', itemObj: DefaultValue): void
  }

  // Props
  const props = withDefaults(defineProps<Props>(), {
    selectArr: () => ['country', 'store', 'activity', 'group'],
    multipleArr: () => ['store', 'activity', 'group'],
    defaultCountry: 'US',
    defaultValue: () => ({}),
    clearStore: true,
    clearCountry: false
  })

  // Emits
  const emit = defineEmits<Emits>()

  // Refs
  const countryRef = ref<InstanceType<typeof MkSelect>>()
  const storeRef = ref<InstanceType<typeof MkSelect>>()
  const activityRef = ref<InstanceType<typeof MkSelect>>()
  const groupRef = ref<InstanceType<typeof MkSelect>>()

  // Reactive data
  const countryValue = ref<string | (string[] | string)>(
    props.multipleArr.includes('country') ? [] : 'US'
  )
  const storeValue = ref<string | string[]>(props.multipleArr.includes('store') ? [] : '')
  const activityValue = ref<string | string[]>(props.multipleArr.includes('activity') ? [] : '')
  const groupValue = ref<string | string[]>(props.multipleArr.includes('group') ? [] : '')

  const countryList = ref<SelectOption[]>([])
  const storeList = ref<SelectOption[]>([])
  const activityList = ref<SelectOption[]>([])
  const groupList = ref<SelectOption[]>([])

  // Methods
  const handleDefaultInit = (): void => {
    const keyArr = Object.keys(props.defaultValue).filter((i) => !i.includes('AllFlag'))
    if (keyArr.length > 0) {
      keyArr.forEach((key) => {
        const defaultValue = props.defaultValue[key as keyof DefaultValue] as SelectOption[]
        if (props.multipleArr.includes(key)) {
          ;(countryValue.value as string[]) = defaultValue.map((item) => item.value)
        } else {
          ;(countryValue.value as string) = defaultValue[0]?.value || ''
        }
        handleInitSelectList(key)
      })
    } else {
      handleGetCountryList()
    }
  }

  const handleInitSelectList = (type: string): void => {
    const list = getListByType(type)
    if (!list || list.length > 0) return

    switch (type) {
      case 'store':
        handleGetStoreList()
        break
      case 'activity': {
        const storeValues = props.defaultValue.store?.map((k) => k.value || k.sellerId) || []
        handleGetAdsActivityList(storeValues as string[])
        handleGetAdsGroupList(storeValues as string[])
        break
      }
      case 'group': {
        const storeValues = props.defaultValue.store?.map((k) => k.value || k.sellerId) || []
        handleGetAdsGroupList(storeValues as string[])
        break
      }
      default:
        break
    }
  }

  const handleResetData = (): void => {
    const savedCountryList = JSON.stringify(countryList.value)

    // Reset reactive data
    countryValue.value = props.multipleArr.includes('country') ? [] : 'US'
    storeValue.value = props.multipleArr.includes('store') ? [] : ''
    activityValue.value = props.multipleArr.includes('activity') ? [] : ''
    groupValue.value = props.multipleArr.includes('group') ? [] : ''

    storeList.value = []
    activityList.value = []
    groupList.value = []

    // Clear select components
    props.selectArr.forEach((type) => {
      const ref = getRefByType(type)
      ref?.value?.clearData?.()
      if (type === 'country' && props.defaultCountry) {
        if (ref?.value) {
          ref.value.selectValue = props.defaultCountry
        }
        handleGetStoreList()
      }
    })

    countryList.value = JSON.parse(savedCountryList)
  }

  const handleChange = (event: string | string[], type: string): void => {
    if (props.multipleArr.includes(type)) {
      ;(countryValue.value as string[] | string) = event || []
    } else {
      ;(countryValue.value as string) = event[0] || ''
    }

    handleClearData(type)

    switch (type) {
      case 'country':
        handleGetStoreList()
        break
      case 'store':
        if (!props.selectArr.includes('store')) {
          handleGetAdsActivityList(storeValue.value as string[])
        } else {
          handleGetAdsActivityList()
        }
        break
      case 'activity':
        if (!props.selectArr.includes('store')) {
          handleGetAdsGroupList(storeValue.value as string[])
        } else {
          handleGetAdsGroupList()
        }
        break
      default:
        break
    }

    handleEmitChooseItem()
  }

  const handleClearData = (type: string): void => {
    const clearMap: Record<string, string[]> = {
      country: ['store', 'activity', 'group'],
      store: ['activity', 'group'],
      activity: ['group']
    }

    const typesToClear = clearMap[type]
    if (!typesToClear) return

    typesToClear.forEach((clearType) => {
      if (props.selectArr.includes(clearType)) {
        if (props.multipleArr.includes(clearType)) {
          ;(countryValue.value as string[]) = []
        } else {
          ;(countryValue.value as string) = ''
        }

        const list = getListByType(clearType)
        if (list) {
          list.length = 0
        }

        const ref = getRefByType(clearType)
        ref?.value?.clearData?.()
      }
    })
  }

  const handleInitParams = (type: string): SelectOption[] => {
    const list = getListByType(type)
    const value = getValueByType(type)

    if (!list) return []

    return list.filter((item) => {
      if (props.multipleArr.includes(type)) {
        return (value as string[]).includes(item.value)
      } else {
        return value === item.value
      }
    })
  }

  const handleEmitChooseItem = (): void => {
    const itemObj: DefaultValue = {
      country: handleInitParams('country'),
      store: handleInitParams('store'),
      activity: handleInitParams('activity'),
      group: handleInitParams('group')
    }

    Object.keys(itemObj).forEach((key) => {
      const typedKey = key as keyof DefaultValue
      const value = itemObj[typedKey] as SelectOption[]

      if (!value || value.length === 0) {
        delete itemObj[typedKey]
      } else if (value.length === getListByType(key)?.length) {
        ;(itemObj as Record<string, any>)[`${key}AllFlag`] = true
      }
    })

    if (!itemObj.country) {
      itemObj.country = [
        {
          value: props.defaultCountry
        }
      ]
    }

    emit('getCountryAndStore', itemObj)
  }

  const handleGetCountryList = async (): Promise<void> => {
    if (!props.selectArr.includes('country')) {
      handleGetStoreList()
      return
    }

    if (countryList.value.length > 0) {
      if (!countryValue.value) {
        countryValue.value = props.defaultCountry
        handleGetStoreList()
        handleEmitChooseItem()
      }
      return
    }

    await nextTick()

    // TODO: Replace with Pinia store
    countryList.value = useDropListStore().countryList

    if (!countryValue.value) {
      countryValue.value = props.defaultCountry
      handleEmitChooseItem()
    }
    handleGetStoreList()
  }

  const handleGetStoreList = async (): Promise<void> => {
    if (!props.selectArr.includes('store')) {
      handleGetAdsActivityList(storeValue.value as string[])
      return
    }

    if (!countryValue.value) return

    let country = countryValue.value
    if (props.multipleArr.includes('country')) {
      country = (countryValue.value as string[]).join(',')
    }

    try {
      const res = await dropdownAccountApi({ country })
      storeList.value = res.data.dtoList
    } catch (error) {
      console.error('获取店铺列表失败:', error)
    }
  }

  const handleGetAdsActivityList = async (sellIds?: string[]): Promise<void> => {
    if (!props.selectArr.includes('activity')) {
      handleGetAdsGroupList(storeValue.value as string[])
      return
    }

    const accountIdList =
      (typeof storeValue.value === 'string' ? [storeValue.value] : (storeValue.value as string[]))
        ?.map((i) => storeList.value.find((j) => j.value === i)?.sellerId)
        .filter(Boolean) || []

    if (accountIdList.length === 0) return

    try {
      const res: any = await dropdownCampaignList({
        accountIdList: (sellIds || accountIdList) as string[],
        country: countryValue.value
      })
      activityList.value = res.data as SelectOption[]
    } catch (error) {
      console.error('获取广告活动列表失败:', error)
    }
  }

  const handleGetAdsGroupList = async (sellIds?: string[]): Promise<void> => {
    if (!props.selectArr.includes('group')) return

    const accountIdList =
      (typeof storeValue.value === 'string' ? [storeValue.value] : (storeValue.value as string[]))
        ?.map((i) => storeList.value.find((j) => j.value === i)?.sellerId)
        .filter(Boolean) || []

    const campaignIdList =
      typeof activityValue.value === 'string'
        ? [activityValue.value]
        : (activityValue.value as string[])

    if (campaignIdList.length === 0) return

    try {
      const res: any = await dropdownGroupList({
        campaignIdList: campaignIdList as string[],
        accountIdList: (sellIds || accountIdList) as string[],
        country: countryValue.value as string
      })
      groupList.value = res.data
    } catch (error) {
      console.error('获取广告组列表失败:', error)
    }
  }

  // Helper functions
  const getListByType = (type: string): SelectOption[] | null => {
    const listMap: Record<string, SelectOption[]> = {
      country: countryList.value,
      store: storeList.value,
      activity: activityList.value,
      group: groupList.value
    }
    return listMap[type] || null
  }

  const getValueByType = (type: string): string | string[] => {
    const valueMap: Record<string, string | string[]> = {
      country: countryValue.value,
      store: storeValue.value,
      activity: activityValue.value,
      group: groupValue.value
    }
    return valueMap[type] || ''
  }

  const getRefByType = (type: string): typeof countryRef | null => {
    const refMap: Record<string, typeof countryRef> = {
      country: countryRef,
      store: storeRef,
      activity: activityRef,
      group: groupRef
    }
    return refMap[type] || null
  }

  // Lifecycle
  onMounted(() => {
    // TODO: Replace with Pinia store
    countryList.value = useDropListStore().countryList

    if (Object.keys(props.defaultValue).length > 0) {
      handleDefaultInit()
      handleResetData()
    }

    if (props.selectArr[0] === 'country') {
      handleGetCountryList()
    } else if (props.selectArr[0] === 'store') {
      countryValue.value = props.defaultCountry
      handleGetStoreList()
    }
  })

  // Watchers
  watch(
    () => props.multipleArr,
    (val, oldVal) => {
      if (val?.length === 0 && oldVal?.length === 0) return

      props.selectArr.forEach((type) => {
        if (val.includes(type)) {
          ;(countryValue.value as string[]) = []
        } else {
          ;(countryValue.value as string) = ''
        }
      })
    },
    { deep: true, immediate: true }
  )

  watch(
    () => props.defaultValue,
    () => {
      nextTick(() => {
        handleDefaultInit()
      })
    },
    { deep: true, immediate: true }
  )
</script>

<style lang="scss" scoped>
  .select-group {
    display: flex;
    align-items: center;

    .select-model + .select-model {
      margin-left: 10px;
    }

    .country-model {
      width: 80px !important;
    }

    .countrys-model {
      width: 120px !important;
    }
  }
</style>
