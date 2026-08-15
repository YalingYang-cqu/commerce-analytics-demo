<!-- Sc 订单利润 顶部筛选栏：封装 ArtSearchBar 的搜索项配置 + 下拉选项接口加载 + 按周复合选择器。
     表单值通过 v-model 双向绑定给父级；search/reset 交由父级触发数据刷新。 -->
<template>
  <ArtSearchBar
    v-model="filterForm"
    :items="searchItems"
    :show-expand="false"
    :show-search="false"
    label-width="auto"
    default-item-width="150px"
    @search="emit('search')"
    @reset="emit('reset')"
  >
    <!-- 按周：粒度下拉 + 周区间选择器（PeriodWeekRangePicker） -->
    <template v-if="filterForm.dateGrain === 'week'" #dateRange="{ modelValue: form }">
      <div class="composite-search-wrapper composite-grain-date">
        <ElSelect v-model="form.dateGrain" :style="{ width: '78px' }" size="small">
          <ElOption
            v-for="o in dateGrainOptions"
            :key="o.value"
            :label="o.label"
            :value="o.value"
          />
        </ElSelect>
        <PeriodWeekRangePicker
          v-model="form.dateRange"
          :clearable="false"
          start-placeholder="开始周"
          end-placeholder="结束周"
          @change="emit('search')"
        />
      </div>
    </template>
  </ArtSearchBar>
</template>

<script setup lang="ts">
  import { computed, onMounted, ref, watch } from 'vue'
  import { ElSelect, ElOption } from 'element-plus'
  import ArtSearchBar, {
    type SearchFormItem
  } from '@/components/core/forms/art-search-bar/index.vue'
  import PeriodWeekRangePicker from '@/components/core/others/period-week-range-picker/index.vue'
  import { fetchStoreOptions, fetchCascadeOptions } from '../filter-options'
  import { buildSiteDayShortcuts } from '@/views/sale-analysis/utils/site-date'
  import { ORDER_SOURCE_OPTIONS } from '../order-source'
  import { searchTypeOptionsForTab } from '../search-type'
  import { normalizeShopIds, pruneShopIds } from '../presentation'

  interface OptionItem<T = string | number> {
    label: string
    value: T
  }

  const props = defineProps<{
    /** 当前维度 Tab：订单维度 keyword 占位含订单号 */
    activeTab: string
  }>()
  const emit = defineEmits<{ search: []; reset: [] }>()
  /** 表单值：父级持有状态，本组件负责渲染与回填 */
  const filterForm = defineModel<Record<string, any>>({ required: true })

  /** 下单时间粒度选项（按日/按周/按月） */
  const grainOptions = [
    { label: '按日', value: 'day' },
    { label: '按周', value: 'week' },
    { label: '按月', value: 'month' }
  ]
  const orderOptions = [
    { label: '下单时间', value: 'day' },
    { label: '结算时间', value: 'settlement' }
  ]
  /** 订单维度只看当天下单，粒度下拉退化为单项（复合搜索项与按周插槽共用） */
  const dateGrainOptions = computed(() =>
    props.activeTab === 'order' ? orderOptions : grainOptions
  )
  /** 日/月原生区间选择器配置（周使用 PeriodWeekRangePicker 自定义组件） */
  const dayPickerProps = { type: 'daterange', valueFormat: 'YYYY-MM-DD', format: 'YYYY-MM-DD' }
  const monthPickerProps = { type: 'monthrange', valueFormat: 'YYYY-MM-DD', format: 'YYYY-MM' }

  /** 日维度快捷项（锚定美国站点今日，对齐 asin board-panel） */
  const dayShortcuts = computed(() => {
    const site = filterForm.value.site
    const sites = Array.isArray(site) ? site : [site || 'US']
    return buildSiteDayShortcuts(sites)
  })

  // ============ 下拉选项 ============
  /** 站点：固定 5 项（全部站点/US/UK/DE/JP），单选，默认 US（见父级 defaultForm） */
  const siteOptions: OptionItem<string>[] = [
    { label: '全部站点', value: '' },
    { label: '美国', value: 'US' },
    { label: 'UK', value: 'UK' },
    { label: 'DE', value: 'DE' },
    { label: 'JP', value: 'JP' }
  ]
  /** 店铺全量（受账号数据权限过滤，含 countryCode），作为按站点客户端过滤的数据源 */
  const allShopOptions = ref<Array<OptionItem<number> & { countryCode: string }>>([])
  /** 店铺当前展示项（按已选站点过滤后的子集；站点空=全部店铺） */
  const shopOptions = ref<OptionItem<number>[]>([])
  /** 分类/品牌/SPU：随 站点+店铺 联动加载（后端按数据权限 + 实际有利润数据的商品去重） */
  const brandOptions = ref<OptionItem<number>[]>([])
  const categoryOptions = ref<OptionItem<number>[]>([])
  /** SPU 下拉：value=spuCode，label=中文款名（同名附带编码区分，并可按编码过滤） */
  const spuOptions = ref<OptionItem<string>[]>([])

  /** 当前站点标量（单选）；'' 或空 = 全部站点 */
  const currentSite = (): string => (filterForm.value.site as string | undefined) || ''
  /** 当前已选店铺（多选）；空数组 = 全部店铺 */
  const currentShopIds = (): number[] => normalizeShopIds(filterForm.value.shopIds)

  /**
   * 按已选站点过滤店铺展示项（站点空=全部）；剔除不属于当前站点的已选店铺。
   * @returns 是否剔除了失效店铺（用于触发一次一致性重查）
   */
  const applyShopFilter = (): boolean => {
    const site = currentSite()
    const filtered = site
      ? allShopOptions.value.filter((o) => o.countryCode === site)
      : allShopOptions.value
    shopOptions.value = filtered.map(({ label, value }) => ({ label, value }))
    const picked = currentShopIds()
    const kept = pruneShopIds(
      picked,
      filtered.map((o) => o.value)
    )
    if (kept.length !== picked.length) {
      filterForm.value.shopIds = kept
      return true
    }
    return false
  }

  /** 多选筛选值剔除：去掉当前选项集合中已不存在的项。@returns 是否发生了剔除 */
  const pruneSelected = <T extends string | number>(
    key: string,
    opts: OptionItem<T>[]
  ): boolean => {
    const picked = (filterForm.value[key] as T[] | undefined) || []
    if (!picked.length) return false
    const valid = new Set(opts.map((o) => o.value))
    const kept = picked.filter((id) => valid.has(id))
    if (kept.length === picked.length) return false
    filterForm.value[key] = kept
    return true
  }

  /**
   * SPU 选项：label 以中文款名为主并附带 spuCode（同名可区分，下拉内可按编码过滤）；
   * value=spuCode，列表筛选按编码检索。
   */
  const buildSpuOptions = (
    spus: Array<{ id: number; name: string; code?: string }>
  ): OptionItem<string>[] =>
    spus
      .filter((s) => s.code)
      .map((s) => {
        const name = (s.name || '').trim()
        const code = String(s.code)
        return { label: name ? `${name}（${code}）` : code, value: code }
      })

  /** 联动请求令牌：仅采纳最新一次响应，避免站点/店铺快速切换产生竞态 */
  let cascadeToken = 0
  /**
   * 按 站点+店铺 拉取 分类/品牌/SPU 联动选项，并清理已失效的已选值。
   * 若清理了失效项，则以一致条件重查一次（覆盖 @change 时用到的旧值）。
   */
  const loadFilterOptions = async (): Promise<void> => {
    const token = ++cascadeToken
    const site = currentSite()
    const shopIds = currentShopIds()
    const res = await fetchCascadeOptions({
      site: site ? [site] : undefined,
      shopIds: shopIds.length ? shopIds : undefined
    })
    if (token !== cascadeToken) return // 已有更新的请求，丢弃过期响应
    categoryOptions.value = (res.categories || []).map((o) => ({ label: o.name, value: o.id }))
    brandOptions.value = (res.brands || []).map((o) => ({ label: o.name, value: o.id }))
    spuOptions.value = buildSpuOptions(res.spus || [])
    let changed = false
    changed = pruneSelected('categoryIds', categoryOptions.value) || changed
    changed = pruneSelected('brandIds', brandOptions.value) || changed
    changed = pruneSelected('spu', spuOptions.value) || changed
    if (changed) emit('search')
  }

  onMounted(async () => {
    // 店铺：SC 订单利润专用接口，后端按当前用户账号数据权限过滤（无权限店铺不返回）
    const shops = await fetchStoreOptions()
    allShopOptions.value = (shops || []).map((s) => ({
      label: s.name,
      value: s.id,
      countryCode: String(s.countryCode || '')
    }))
    // 初始按默认站点（US）过滤店铺；分类/品牌/SPU 按默认 站点+店铺 联动加载（首次不触发重查）
    applyShopFilter()
    await loadFilterOptions()
  })

  // 站点变化 → 过滤店铺；若清空了失效店铺，立即以一致条件重查（不依赖异步 cascade 返回）+ 重拉联动选项
  watch(
    () => currentSite(),
    () => {
      if (applyShopFilter()) emit('search')
      loadFilterOptions()
    }
  )
  // 店铺变化 → 重拉分类/品牌/SPU（令牌保证只采纳最新响应，剔除失效项后一致性重查）
  watch(
    () => currentShopIds().join(','),
    () => loadFilterOptions()
  )

  // ============ 搜索项配置（对齐订单利润 demo 筛选栏） ============
  const searchItems = computed<SearchFormItem[]>(() => [
    {
      // 复合搜索：左侧 searchType + 右侧 keyword（不再用单一 keyword OR 全字段）
      // 切换 searchType 时若已填关键词则立即重查（ArtSearchBar 默认行为）；关键词为空时不发请求
      key: 'keyword',
      label: '',
      compositeSearch: true,
      selectKey: 'searchType',
      selectOptions: searchTypeOptionsForTab(props.activeTab),
      selectWidth: '100px',
      inputType: 'input',
      placeholder: '请输入',
      width: '280px',
      props: { clearable: true }
    },
    {
      // 站点：单选，固定 5 项（全部站点/US/UK/DE/JP）；选站点后联动过滤店铺 + 重拉分类/品牌/SPU
      key: 'site',
      label: '',
      type: 'select',
      selectMultiple: false,
      alwaysFilterInput: false,
      width: '120px',
      props: {
        options: siteOptions,
        placeholder: '全部站点',
        clearable: false,
        filterable: false,
        disabled: true
      }
    },

    {
      key: 'currency',
      label: '',
      type: 'select',
      width: '115px',
      props: {
        placeholder: '币种',
        clearable: false,
        options: [
          { label: 'USD', value: 'USD' },
          { label: 'CNY', value: 'CNY' }
        ]
      }
    },
    {
      key: 'orderSource',
      label: '',
      type: 'select',
      width: '190px',
      props: {
        placeholder: '订单来源',
        clearable: false,
        options: [...ORDER_SOURCE_OPTIONS]
      }
    },
    {
      key: 'dateRange',
      label: props.activeTab === 'order' ? '' : '下单时间',
      type: 'daterange',
      width: '340px',
      compositeSearch: true,
      selectKey: 'dateGrain',
      // 切粒度/时间口径不在此处触发搜索：父级 watch(dateGrain) 会先按新粒度重算默认区间再刷新，
      // 否则这里会抢先用旧区间多查一轮
      selectTriggerSearch: false,
      selectWidth: props.activeTab === 'order' ? '100px' : '78px',
      inputType: 'daterange',
      selectOptions: dateGrainOptions.value,
      // 日=daterange、月=monthrange（周用自定义插槽 PeriodWeekRangePicker）；按日带 shortcuts
      datePickerProps: {
        ...(filterForm.value.dateGrain === 'month' ? monthPickerProps : dayPickerProps),
        clearable: false,
        // 下单时间(day)与结算时间(settlement)都是按日 daterange，共用同一套快捷「固定时间范围」；仅按月/按周(自定义插槽)不挂
        ...(filterForm.value.dateGrain === 'day' || filterForm.value.dateGrain === 'settlement'
          ? { shortcuts: dayShortcuts.value }
          : {})
      }
    },
    {
      // 店铺：多选；只展示当前用户可见且属于所选站点的店铺（空数组=全部店铺）
      key: 'shopIds',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      width: '140px',
      props: {
        options: shopOptions.value,
        placeholder: '店铺',
        clearable: true
        // filterable: false
      }
    },
    {
      key: 'categoryIds',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      width: '130px',
      props: { options: categoryOptions.value, placeholder: '分类', clearable: true }
    },
    {
      key: 'brandIds',
      label: '',
      type: 'select',
      selectMultiple: true,
      alwaysFilterInput: true,
      width: '130px',
      props: { options: brandOptions.value, placeholder: '品牌', clearable: true }
    },
    {
      key: 'spu',
      label: '',
      type: 'select',
      width: '160px',
      props: { placeholder: 'SPU', options: spuOptions.value, clearable: true },
      selectMultiple: true,
      alwaysFilterInput: true
    }
  ])
</script>

<style lang="scss" scoped>
  // 按周复合日期：粒度下拉 + 周区间选择器连体。
  // 用 :global 而非 :deep：该项可能被收进「更多筛选」浮窗，浮窗 teleport 到 body 后祖先链断开。
  :global(.composite-grain-date) {
    display: flex;
    width: 100%;

    .el-select .el-select__wrapper {
      border-radius: var(--el-border-radius-base) 0 0 var(--el-border-radius-base);
    }
  }

  :deep(.art-search-bar label) {
    height: 28px !important;
    line-height: 28px !important;
    border: 0 solid #dcdfe6 !important;
  }
</style>
