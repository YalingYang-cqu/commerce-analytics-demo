<template>
  <div class="art-full-height">
    <el-tabs v-model="activeName" class="big">
      <el-tab-pane label="SKU" name="sku" v-if="hasAuth('product:sku')" />
      <el-tab-pane label="SPU" name="spu" v-if="hasAuth('product:spu')" />
    </el-tabs>
    <div v-show="activeName === 'sku'" v-auth="'product:sku:common:list'">
      <SkuManage
        :userAll="userAll"
        :brandAll="brandAll"
        :categoryAll="categoryAll"
        :openSku="openSku"
        @refresh-options="refreshSkuDialogOptions"
      />
    </div>
    <div v-show="activeName === 'spu'" v-auth="'product:spu:common:list'">
      <SpuManage :openSpu="openSpu" />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { watch } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElTabs } from 'element-plus'
  import SkuManage from './sku-manage/index.vue'
  import SpuManage from './spu-manage/index.vue'
  import { UserInfoResponse, UserOption } from '@/views/system/dept-manage/index.vue'
  import { getAllUserInfo } from '@/api/basic/dept-manage'
  import { brandPageList } from '@/api/basic/brand'
  import { categoryPageList } from '@/api/basic/category'
  import { properPageList } from '@/api/basic/property'
  import { companyPageList } from '@/api/finance/company-subject'
  import { useAuth } from '@/composables/useAuth'
  import { getAllStoreInfo } from '@/api/system-manage'

  defineOptions({ name: 'ProductInfo' })

  const route = useRoute()

  // 从路由获取要搜索的 sku
  const openSku = computed(() => {
    return route.query.sku as string | undefined
  })

  // 从路由获取要打开详情的 spu
  const openSpu = computed(() => {
    return route.query.spu as string | undefined
  })

  export interface labelProps {
    label: string
    value: string
  }

  const userAll = ref<UserOption[]>([])
  const brandAll = ref<labelProps[]>([])
  const categoryAll = ref<labelProps[]>([])
  const propertyAll = ref<labelProps[]>([])
  const companyAll = ref<labelProps[]>([])
  const storeAll = ref<labelProps[]>([])

  const { hasAuth } = useAuth()
  provide('basicData', {
    userAll,
    categoryAll,
    brandAll,
    propertyAll,
    companyAll,
    storeAll
  })

  // 获取负责人
  const getAllUserInfoAction = async (): Promise<void> => {
    const dataC: any = (await getAllUserInfo()) as UserInfoResponse[]
    userAll.value =
      dataC?.data?.flatMap((v: UserInfoResponse) =>
        v.status === 0 ? [] : [{ value: v.id, label: v.userName }]
      ) || []
  }
  // 获取品牌
  const getBrandPageList = async () => {
    const res: any = await brandPageList({ currentPage: 1, pageSize: -1, brandStatus: 1 })
    brandAll.value =
      res?.data?.records?.map((v: any) => ({ value: v.id, label: v.brandName })) || []
  }
  // 获取店铺
  const getStoreList = async () => {
    const res: any = await getAllStoreInfo({ currentPage: 1, pageSize: -1 })
    storeAll.value =
      res?.data?.dtoList?.map((v: any) => ({ value: v.id, label: v.storeName })) || []
  }
  // 获取分类（含停用，与 SPU 一致；仅启用树会导致历史 SKU 的 categoryId 不在树中，编辑页级联无法回显）
  const getAllTree = async () => {
    const res: any = await categoryPageList({ status: null })
    categoryAll.value = res.data || []
  }
  // 获取属性
  const getProperPage = async () => {
    const res: any = await properPageList({ currentPage: 1, pageSize: -1, status: 1 })
    propertyAll.value = res?.data?.dtoList || []
  }
  // 获取公司主体
  const getCompanySubject = async () => {
    const res: any = await companyPageList({ currentPage: 1, pageSize: -1, status: 1 })
    companyAll.value = res?.data?.records || []
  }
  onActivated(() => {
    getAllUserInfoAction()
    getBrandPageList()
    getAllTree()
    getProperPage()
    getCompanySubject()
    getStoreList()
  })

  // 添加/编辑 SKU 弹框打开时重新拉取下拉数据，避免其他功能修改后仍显示旧缓存
  const refreshSkuDialogOptions = () => {
    getAllUserInfoAction()
    getBrandPageList()
    getAllTree()
  }

  // Tab 名称类型
  type TabName = 'sku' | 'spu'

  // 获取第一个有权限的 tab，考虑路由参数
  const getFirstAvailableTab = (): TabName => {
    // 如果路由中指定了 tab 参数，优先使用
    const tabFromQuery = route.query.tab as string
    if (tabFromQuery === 'spu' && hasAuth('product:spu')) {
      return 'spu'
    }
    if (tabFromQuery === 'sku' && hasAuth('product:sku')) {
      return 'sku'
    }
    // 如果有 openSpu 参数，切换到 spu tab
    if (route.query.spu && hasAuth('product:spu')) {
      return 'spu'
    }
    // 如果有 openSku 参数，切换到 sku tab
    if (route.query.sku && hasAuth('product:sku')) {
      return 'sku'
    }
    // 默认逻辑
    if (hasAuth('product:sku')) {
      return 'sku'
    }
    if (hasAuth('product:spu')) {
      return 'spu'
    }
    return 'sku' // 默认值，理论上不应该到达这里
  }

  const activeName = ref<TabName>(getFirstAvailableTab())

  // 监听权限变化，如果当前选中的 tab 没有权限，则切换到第一个有权限的 tab
  watch(
    () => [hasAuth('product:sku'), hasAuth('product:spu'), activeName.value] as const,
    ([hasSkuAuth, hasSpuAuth, currentTab]) => {
      // 如果当前选中的 tab 没有权限，切换到第一个有权限的 tab
      if (currentTab === 'sku' && !hasSkuAuth) {
        activeName.value = hasSpuAuth ? 'spu' : 'sku'
      } else if (currentTab === 'spu' && !hasSpuAuth) {
        activeName.value = hasSkuAuth ? 'sku' : 'spu'
      }
    },
    { immediate: true }
  )

  // 监听路由变化，切换 tab
  watch(
    () => route.query,
    (newQuery) => {
      if (newQuery.tab === 'spu' && hasAuth('product:spu')) {
        activeName.value = 'spu'
      } else if (newQuery.tab === 'sku' && hasAuth('product:sku')) {
        activeName.value = 'sku'
      } else if (newQuery.spu && hasAuth('product:spu')) {
        activeName.value = 'spu'
      } else if (newQuery.sku && hasAuth('product:sku')) {
        activeName.value = 'sku'
      }
    }
  )
</script>

<style lang="scss" scoped></style>
