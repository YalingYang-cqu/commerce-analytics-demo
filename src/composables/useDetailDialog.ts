/**
 * 全局 SKU/SPU 详情弹窗：单例状态 + 打开方法，多行表格下不重复挂载弹窗、不重复请求选项。
 * 弹窗由 DetailDialogProvider 统一挂载，链接组件只触发 open。
 */
import { reactive, nextTick } from 'vue'
import { ElMessage } from 'element-plus'
import { useAuth } from '@/composables/useAuth'
import { pubBrandList, pubCategoryList, pubGetUserList } from '@/utils'

const skuState = reactive({
  visible: false,
  initData: {} as { id?: string | number; handleType?: string },
  /** 与 AddSkuDialog 的 from 一致：'sku' 显示编辑/复制等；全局链接打开默认 'link' 仅查看 */
  dialogFrom: 'link' as string
})

const spuState = reactive({
  visible: false,
  initData: {} as { id?: string | number; handleType?: string; dialogTitle?: string }
})

const skuOptions = reactive({
  categoryList: [] as any[],
  brandList: [] as any[],
  userList: [] as any[]
})

let cachedCategory: any[] | null = null
let cachedBrand: any[] | null = null
let cachedUser: any[] | null = null

async function loadSkuOptionsOnce() {
  if (cachedCategory !== null && cachedBrand !== null && cachedUser !== null) {
    skuOptions.categoryList = cachedCategory
    skuOptions.brandList = cachedBrand
    skuOptions.userList = cachedUser
    return
  }
  const [cat, brand, user] = await Promise.all([
    pubCategoryList(),
    pubBrandList(),
    pubGetUserList()
  ])
  cachedCategory = cat
  cachedBrand = brand
  cachedUser = user
  skuOptions.categoryList = cat
  skuOptions.brandList = brand
  skuOptions.userList = user
}

const SKU_VIEW_AUTHS = [
  'product:sku:basic:view',
  'product:sku:purchase:view',
  'product:sku:logistics:view',
  'product:sku:finance:view',
  'product:sku:listingRelation:view',
  'product:sku:pic:view',
  'product:sku:certification:view'
] as const

const SPU_VIEW_AUTHS = [
  'product:spu:basic:view',
  'product:spu:skus:view',
  'product:spu:finance:view',
  'product:spu:certification:view'
] as const

export function useDetailDialog() {
  const { hasAuth } = useAuth()

  function openSkuDetail(skuId: string | number, options?: { from?: string }) {
    try {
      const hasAny = SKU_VIEW_AUTHS.some((code) => hasAuth(code))
      if (!hasAny) {
        ElMessage.warning('无查看权限！')
        return
      }
      // 先写入 initData，再在下一帧打开 visible，避免子组件 watch(visible) 读到旧的 initData
      skuState.initData = { id: skuId, handleType: 'detail' }
      skuState.dialogFrom = options?.from ?? 'link'
      void nextTick(() => {
        skuState.visible = true
      })
      void loadSkuOptionsOnce()
    } catch (e) {
      console.log(e, 111)
    }
  }

  function openSpuDetail(spuId: string | number) {
    const hasAny = SPU_VIEW_AUTHS.some((code) => hasAuth(code))
    if (!hasAny) {
      ElMessage.warning('无查看权限！')
      return
    }
    spuState.initData = { handleType: 'detail', id: spuId, dialogTitle: 'SPU详情' }
    void nextTick(() => {
      spuState.visible = true
    })
  }

  /** 确保 SKU 弹框所需的下拉选项已加载（用于页面内嵌弹框先加载再打开） */
  function ensureSkuOptionsLoaded() {
    return loadSkuOptionsOnce()
  }

  return {
    skuState,
    spuState,
    skuOptions,
    openSkuDetail,
    openSpuDetail,
    ensureSkuOptionsLoaded
  }
}
