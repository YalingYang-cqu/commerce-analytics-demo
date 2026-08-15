<!-- 利润拆解抽屉：交互/内容对齐 dataDemo/订单利润(1).html openDrawer / openDashboardDrawer -->
<template>
  <ElDrawer
    v-model="visible"
    size="520px"
    direction="rtl"
    :with-header="false"
    class="pbd-drawer"
    append-to-body
    destroy-on-close
  >
    <div v-if="row" class="pbd-inner">
      <div class="pbd-head">
        <div class="pbd-thumb" :class="thumbClass">
          <template v-if="isProduct">
            <ElImage
              v-if="getUrl(row.image)"
              :src="getUrl(row.image)"
              :preview-src-list="[getUrl(row.image)]"
              :preview-teleported="true"
              fit="cover"
              class="pbd-thumb-img"
              @click.stop
            />
            <ElIcon v-else class="pbd-thumb-ph"><Picture /></ElIcon>
          </template>
          <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
            <template v-if="isOrder">
              <path d="M6 2h9l3 3v15l-2.5-1.6L13 20l-2.5-1.6L8 20l-2-1.5V2Z" />
              <path d="M9 7h6M9 11h6M9 15h4" />
            </template>
            <template v-else>
              <rect x="3" y="4" width="18" height="17" rx="2" />
              <path d="M8 2v4M16 2v4M3 10h18" />
            </template>
          </svg>
        </div>
        <div class="pbd-head-text">
          <div class="pbd-title">{{ headTitle }}</div>
          <div class="pbd-sub">
            {{ headSub }}
            <span v-if="isOrder && orderStatusText" class="pbd-status" :class="orderStatusClass">{{
              orderStatusText
            }}</span>
          </div>
        </div>
        <button type="button" class="pbd-x" title="关闭" @click="visible = false">
          <svg
            viewBox="0 0 24 24"
            width="16"
            height="16"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div class="pbd-body">
        <!-- 汇总行 / 看板日期行：时间段概况（字段：统计日期/粒度/订单数/发货量/销售额/利润） -->
        <template v-if="isPeriodView">
          <div class="pbd-sec">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            {{ overviewSectionTitle }}
          </div>
          <div class="info-grid">
            <div class="it">
              <div class="k">统计日期</div>
              <div class="v" :title="periodDateLabel">{{ periodDateLabel }}</div>
            </div>
            <div class="it">
              <div class="k">统计粒度</div>
              <div class="v">{{ grainLabel }}</div>
            </div>
            <div class="it">
              <div class="k">订单数</div>
              <div class="v">{{ intFmt(periodOrderCount) }} 单</div>
            </div>
            <div class="it">
              <div class="k">发货量</div>
              <div class="v">{{ intFmt(periodShipQty) }} 件</div>
            </div>
            <div class="it">
              <div class="k">销售额</div>
              <div class="v">{{ money(Number(row.sales || 0)) }}</div>
            </div>
            <div class="it">
              <div class="k">利润额 / 利润率</div>
              <div class="v">
                {{ money(Number(row.profit || 0)) }} · {{ pct(Number(row.margin || 0)) }}
              </div>
            </div>
          </div>
          <div class="pbd-sec">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m3 17 6-6 4 4 8-8" />
            </svg>
            {{ breakdownSectionTitle }}
          </div>
        </template>

        <!-- 订单：订单信息 + 商品行（非汇总） -->
        <template v-else-if="isOrder">
          <div class="pbd-sec">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10" />
              <path d="M12 16v-4M12 8h.01" />
            </svg>
            订单信息
          </div>
          <div class="info-grid">
            <div class="it"
              ><div class="k">订单号</div
              ><div class="v" :title="row.orderNo">{{ row.orderNo }}</div></div
            >
            <div class="it"
              ><div class="k">币种</div><div class="v">{{ row.currency || 'USD' }}</div></div
            >
            <div class="it"
              ><div class="k">下单时间</div><div class="v">{{ row.orderTime || '-' }}</div></div
            >
            <div class="it"
              ><div class="k">付款时间</div><div class="v">{{ row.payTime || '-' }}</div></div
            >
            <div class="it">
              <div class="k">店铺 / 站点</div>
              <div class="v">{{ row.store || '-' }} · {{ row.country || row.site || '-' }}</div>
            </div>
            <div class="it">
              <div class="k">商品款数 / 件数</div>
              <div class="v">{{ orderLines.length }} 款 · {{ intFmt(row.qty || 0) }} 件</div>
            </div>
          </div>
          <div class="pbd-sec">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4Z" />
              <path d="M3 6h18" />
              <path d="M16 10a4 4 0 0 1-8 0" />
            </svg>
            订单商品 · {{ orderLines.length }}款 / {{ intFmt(row.qty || 0) }}件
          </div>
          <div class="line-items">
            <div
              v-for="it in orderLines"
              :key="it.key"
              class="line-item"
              :class="{ loss: it.profit < 0 }"
            >
              <div class="sku-thumb">
                <ElImage
                  v-if="getUrl(it.image)"
                  :src="getUrl(it.image)"
                  :preview-src-list="[getUrl(it.image)]"
                  :preview-teleported="true"
                  fit="cover"
                  class="sku-thumb-img"
                  @click.stop
                />
                <ElIcon v-else class="sku-thumb-ph"><Picture /></ElIcon>
              </div>
              <div class="li-main">
                <div class="li-t">{{ it.sku }}</div>
                <div class="li-s">{{ it.asin }} · {{ it.cat }}</div>
              </div>
              <div class="li-q">
                {{ it.qty }} 件 × {{ currencySymbol() }}{{ it.price.toFixed(2) }}
                <b :class="it.profit >= 0 ? 'pos' : 'neg'">{{ money(it.profit) }}</b>
              </div>
            </div>
          </div>
          <div class="pbd-sec">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12h8M12 8v8" />
            </svg>
            单个利润
          </div>
          <div class="unit-grid">
            <div v-for="u in unitCards" :key="u.k" class="unit-card">
              <TableHeaderTip class="k" :label="u.k" :tip="u.tip" />
              <div class="v">{{ u.v == null ? '—' : money(u.v) }}</div>
            </div>
          </div>
          <div class="pbd-sec">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m3 17 6-6 4 4 8-8" />
            </svg>
            订单收支拆解
          </div>
          <div class="cost-source-note">
            <b>库存成本来源</b>
            <span>{{ inventoryCostNote }}</span>
          </div>
        </template>

        <!-- 产品维度 -->
        <template v-else>
          <div class="pbd-sec">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="9" />
              <path d="M8 12h8M12 8v8" />
            </svg>
            单个利润
          </div>
          <div class="unit-grid">
            <div v-for="u in unitCards" :key="u.k" class="unit-card">
              <TableHeaderTip class="k" :label="u.k" :tip="u.tip" />
              <div class="v">{{ u.v == null ? '—' : money(u.v) }}</div>
            </div>
          </div>
          <div class="pbd-sec">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="m3 17 6-6 4 4 8-8" />
            </svg>
            利润额公式拆解
          </div>
        </template>

        <!-- 收支公式（各 Tab 共用） -->
        <div class="formula-list">
          <div
            v-for="(f, i) in formulaRows"
            :key="i"
            class="formula-row"
            :class="{ total: f.total }"
          >
            <div class="ic" :class="f.sign">{{
              f.sign === 'plus' ? '+' : f.sign === 'minus' ? '-' : '='
            }}</div>
            <div class="nm">
              {{ f.name }}
              <small>{{ f.sub }}{{ f.rateText }}</small>
            </div>
            <div class="vl" :style="{ color: formulaValueColor(f) }">
              {{ money(f.value) }}
            </div>
          </div>
        </div>

        <div class="pbd-sec">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="6" y1="20" x2="6" y2="14" />
            <line x1="12" y1="20" x2="12" y2="4" />
            <line x1="18" y1="20" x2="18" y2="10" />
          </svg>
          费用瀑布 · 平台收入到利润额
        </div>
        <div ref="chartRef" class="pbd-chart"></div>

        <div class="pbd-sec">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M3 3v18h18" />
            <path d="m19 9-5 5-4-4-3 3" />
          </svg>
          成本占比排行
        </div>
        <div class="factor-list">
          <div class="factor-row head">
            <div class="rank">排名</div>
            <div>成本项</div>
            <div class="val">金额</div>
            <div class="rate">占总成本</div>
          </div>
          <div v-for="(item, i) in costFactors" :key="item.name" class="factor-row">
            <div class="rank">#{{ i + 1 }}</div>
            <div class="txt">
              <b>{{ item.name }}</b>
              <span>{{ item.group }}</span>
            </div>
            <div class="val">{{ money(item.amount) }}</div>
            <div class="rate">{{ pct(item.rate) }}</div>
          </div>
        </div>
      </div>

      <div class="pbd-foot">
        <ElButton @click="visible = false">关闭</ElButton>
        <!-- <ElButton
          v-if="!isPeriodView"
          v-auth="'finance:scProfit:review'"
          type="primary"
          @click="onReview"
        >
          加入复盘
        </ElButton> -->
      </div>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, nextTick, ref, watch, onBeforeUnmount } from 'vue'
  import { ElButton, ElDrawer, ElImage, ElIcon } from 'element-plus'
  import { Picture } from '@element-plus/icons-vue'
  import { getUrl } from '@/utils/common-util'
  import { echarts, type EChartsOption } from '@/utils/echarts'
  import { add, mul, divide } from '@/utils/dataprocess'
  import { formatMoney, currencySymbol } from '../currency'
  import { formatPercent, getOrderStatusTagClass } from '../presentation'
  import {
    buildCostFactors as buildCostFactorItems,
    buildPlatformExpenseItems,
    buildWaterfallSteps
  } from '../breakdown'
  import { FIELD_TIP, type ProfitDetailTab } from '../columns'
  import TableHeaderTip from '@/components/core/tables/table-header-tip/index.vue'

  defineOptions({ name: 'ProfitBreakdownDrawer' })

  const props = withDefaults(
    defineProps<{
      modelValue: boolean
      row: Record<string, any> | null
      activeTab?: string
      dateGrain?: string
      /** 顶部筛选日期区间，汇总行「统计日期」回退用 */
      dateRange?: string[]
    }>(),
    { activeTab: 'dashboard', dateGrain: 'day', dateRange: () => [] }
  )

  const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })

  const tab = computed(() => (props.activeTab || 'dashboard') as ProfitDetailTab)
  /** 表格汇总行（各 Tab 通用） */
  const isSummaryRow = computed(() => props.row?._level === 'summary')
  /**
   * 时间段型拆解：看板任意行 + 任意 Tab 的汇总行。
   * 展示「统计日期/粒度/订单数/发货量/销售额/利润」后接 收支→瀑布→成本占比。
   */
  const isPeriodView = computed(() => tab.value === 'dashboard' || isSummaryRow.value)
  const isOrder = computed(() => !isSummaryRow.value && tab.value === 'order')
  const isProduct = computed(() => !isPeriodView.value && !isOrder.value)

  const grainLabel = computed(() => {
    const g = props.dateGrain || 'day'
    return g === 'week' ? '按周' : g === 'month' ? '按月' : '按日'
  })

  /** 统计日期：行 date（看板日/周/月）优先；汇总行用筛选区间 */
  const periodDateLabel = computed(() => {
    const r = props.row
    if (!r) return '-'
    if (r.date && String(r.date) !== '汇总') return String(r.date)
    const range = props.dateRange || []
    const start = range[0] || ''
    const end = range[1] || start
    if (start && end) return start === end ? start : `${start} ~ ${end}`
    return '-'
  })

  /** 订单数：优先 _count（adaptDetail/mapRow），回退 orderCount */
  const periodOrderCount = computed(() => {
    const r = props.row || {}
    return Math.max(0, Number(r._count ?? r.orderCount) || 0)
  })

  /** 发货量：优先 shipQty（订单状态为已发货的销量），缺省回退 qty */
  const periodShipQty = computed(() => {
    const r = props.row || {}
    if (r.shipQty != null && r.shipQty !== '') return Math.max(0, Number(r.shipQty) || 0)
    return Math.max(0, Number(r.qty) || 0)
  })

  const overviewSectionTitle = computed(() =>
    isSummaryRow.value && tab.value !== 'dashboard' ? '汇总概况' : '日期汇总概况'
  )
  const breakdownSectionTitle = computed(() =>
    isSummaryRow.value && tab.value !== 'dashboard' ? '收支拆解' : '日期汇总收支拆解'
  )

  // 金额格式化随当前币种符号（$/¥）；数值由后端按 exchange_rate 换算
  const money = (v: number): string => formatMoney(v)
  const pct = (v: number): string => formatPercent(Number(v || 0))
  const intFmt = (v: number): string => Math.round(v || 0).toLocaleString('en-US')

  const PRODUCT_TITLES: Record<string, string> = {
    parentAsin: '父ASIN利润拆解',
    asin: 'ASIN利润拆解',
    msku: 'MSKU利润拆解',
    spu: 'SPU利润拆解'
  }

  const headTitle = computed(() => {
    const r = props.row
    if (!r) return ''
    if (isPeriodView.value) return periodDateLabel.value || '汇总'
    if (isOrder.value) return r.orderNo || '订单'
    const key = tab.value
    const obj = key === 'msku' ? r.msku : r[key] || r.msku || r.spu || r.asin || r.parentAsin || '-'
    return `${PRODUCT_TITLES[key] || '利润拆解'} · ${obj}`
  })

  const headSub = computed(() => {
    const r = props.row
    if (!r) return ''
    if (isPeriodView.value) {
      return `${grainLabel.value} · 订单利润 · ${intFmt(periodOrderCount.value)} 单 · ${intFmt(periodShipQty.value)} 件`
    }
    if (isOrder.value) {
      return `${r.orderTime || '-'} · ${r.country || r.site || 'US'} · ${r.store || '-'}`
    }
    return `${r.asin || '-'} · ${r.country || r.site || 'US'} · ${r.store || '-'}`
  })

  const thumbClass = computed(() => (isProduct.value ? 'is-sku' : 'is-icon'))

  /** 订单状态标签文案：优先后端中文名，其次原始状态字段 */
  const orderStatusText = computed(() => {
    const r = props.row
    const s = r?.orderStatusName ?? r?.orderStatus
    return s == null || s === '' ? '' : String(s)
  })
  /** 状态 Tag：完成绿、进行中蓝、待处理橙、失败红、未知灰。 */
  const orderStatusClass = computed(() => getOrderStatusTagClass(orderStatusText.value))

  const breakdownParts = computed(() => {
    const r = props.row || {}
    const platformIncome = add(r.sales || 0, r.buyerShipping || 0)
    const platformExpense = buildPlatformExpenseItems(r).reduce(
      (total, item) => add(total, item.amount),
      0
    )
    const inventoryCost = add(r.purchase || 0, r.head || 0)
    const platformOtherIncome = add(r.fbaInventoryReimbursement || 0, r.otherIncome || 0)
    return {
      platformIncome,
      platformExpense,
      inventoryCost,
      platformOtherIncome,
      profit: r.profit || 0
    }
  })

  const rateText = (val: number): string => {
    const sales = Number(props.row?.sales || 0)
    if (!sales) return ''
    return ` · 占销售额 ${pct(mul(divide(Math.abs(val), sales), 100))}`
  }

  const formulaRows = computed(() => {
    const p = breakdownParts.value
    const r = props.row || {}
    return [
      {
        sign: 'plus' as const,
        name: '平台收入',
        sub: '销售额 + 买家运费',
        value: p.platformIncome,
        neg: false,
        rateText: rateText(p.platformIncome)
      },
      {
        sign: 'minus' as const,
        name: '平台支出',
        sub: '平台佣金、FBA配送费、退货退款、广告、推广、测评、仓储、FBA操作、平台其他费用',
        value: p.platformExpense,
        neg: true,
        rateText: rateText(p.platformExpense)
      },
      {
        sign: 'minus' as const,
        name: '库存成本',
        sub: '采购成本 + 头程成本',
        value: p.inventoryCost,
        neg: true,
        rateText: rateText(p.inventoryCost)
      },
      {
        sign: 'plus' as const,
        name: '平台其他收入',
        sub: 'FBA库存赔偿 + 其他收入',
        value: p.platformOtherIncome,
        neg: false,
        rateText: rateText(p.platformOtherIncome)
      },
      {
        sign: 'equal' as const,
        name: '利润额',
        sub: `利润率 ${pct(r.margin || 0)}`,
        value: p.profit,
        neg: false,
        rateText: '',
        total: true
      }
    ]
  })

  /** 公式行金额取色：负数红、零灰、正数蓝；合计行返回 undefined 沿用 .total 的绿色样式 */
  const formulaValueColor = (f: { value: number; total?: boolean }): string | undefined => {
    if (f.value < 0) return '#ef4444'
    if (f.total) return undefined
    return f.value === 0 ? '#8590a6' : '#2e5cff'
  }

  /**
   * 单个利润卡片（口径与 PRD / 用户公式一致）：
   * 综合售价 = sales ÷ qty
   * 单个净利 = profit ÷ qty
   * 单个广告费用 = ad ÷ qty
   * 单个促销费用 = promoFee ÷ qty
   * 优先用后端已算好的 unit* 字段，缺省再现场除。
   */
  const unitCards = computed(() => {
    const r = props.row || {}
    const qty = Number(r.qty)
    const safeQty = qty > 0 ? qty : null
    const sales = Number(r.sales || 0)
    const profit = Number(r.profit || 0)
    const ad = Number(r.ad || 0)
    const promoFee = Number(r.promoFee || 0)
    const div = (n: number): number | null => (safeQty == null ? null : n / safeQty)
    const pickOrDiv = (key: string, raw: number): number | null => {
      const v = r[key]
      if (v != null && v !== '') return Number(v)
      return div(raw)
    }
    // 气泡文案与明细表同名列共用 FIELD_TIP，口径只维护一份
    return [
      { k: '综合售价', tip: FIELD_TIP.unitPrice, v: pickOrDiv('unitPrice', sales) },
      { k: '单个净利', tip: FIELD_TIP.unitNetProfit, v: pickOrDiv('unitNetProfit', profit) },
      // 与列表一致：保留数据库/接口原始正负号
      { k: '单个广告费用', tip: FIELD_TIP.unitAd, v: pickOrDiv('unitAd', ad) },
      { k: '单个促销费用', tip: FIELD_TIP.unitPromoFee, v: pickOrDiv('unitPromoFee', promoFee) }
    ]
  })

  const costFactors = computed(() => {
    const r = props.row || {}
    const items = buildCostFactorItems(r)
      .map((item) => ({
        ...item,
        group: item.name === '采购成本' || item.name === '头程成本' ? '库存成本' : '平台支出'
      }))
      .filter((x) => Math.abs(x.amount) > 0.005)
      .sort((a, b) => Math.abs(b.amount) - Math.abs(a.amount))
    const total = items.reduce((s, x) => add(s, Math.abs(x.amount)), 0) || 1
    return items.map((x) => ({ ...x, rate: mul(divide(Math.abs(x.amount), total), 100) }))
  })

  /** 订单商品行：有子行=多明细；无子行=当前行即唯一明细（禁止再按件数拆成假的多款） */
  const orderLines = computed(() => {
    const r = props.row || {}
    const kids = (r._children as Record<string, any>[] | undefined) || []
    if (kids.length) {
      return kids.map((c, i) => {
        const qty = Math.max(0, Number(c.qty) || 0)
        const sales = Number(c.sales || 0)
        return {
          key: `c-${i}-${c.msku || c.asin || i}`,
          sku: c.msku || '-',
          asin: c.asin || r.asin || '-',
          cat: c.category || r.category || '-',
          char: String(c.category || c.msku || '商').slice(0, 1),
          image: c.image || r.image || '',
          qty,
          price: qty ? sales / qty : 0,
          profit: Number(c.profit) || 0
        }
      })
    }
    const qty = Math.max(0, Number(r.qty) || 0)
    const sales = Number(r.sales || 0)
    return [
      {
        key: `self-${r.orderNo || r.msku || 'row'}`,
        sku: r.msku || '-',
        asin: r.asin || '-',
        cat: r.category || '-',
        char: String(r.category || r.msku || '商').slice(0, 1),
        image: r.image || '',
        qty,
        price: qty ? sales / qty : 0,
        profit: Number(r.profit) || 0
      }
    ]
  })

  /** 本期库存成本未接入宽表（procurement/logistics 为 null）→ 不展示假批次号 */
  const inventoryCostNote = computed(() => {
    const r = props.row || {}
    const purchase = r.purchase
    const head = r.head
    const hasCost =
      (purchase != null && purchase !== '' && Number(purchase) !== 0) ||
      (head != null && head !== '' && Number(head) !== 0)
    if (!hasCost) return '本期未接入库存成本'
    return '来自订单行采购/头程成本汇总'
  })

  const chartRef = ref<HTMLElement | null>(null)
  let chart: echarts.ECharts | null = null

  /** 瀑布柱配色：收入（起始柱「平台收入」与中途正项「平台其他收入」）/ 支出成本 / 利润额 */
  const WF_INCOME_COLOR = '#4f46e5'
  const WF_EXPENSE_COLOR = '#ef4444'
  const WF_PROFIT_COLOR = '#16a34a'
  /** 金额极小时柱高不足 1px，用 barMinHeight 兜底可见性 */
  const WF_BAR_MIN_HEIGHT = 1

  /**
   * 柱数据项：金额为 0 时置为透明。
   * barMinHeight 对 0 值同样会留出最小高度，若不透明，本该空白的位置会出现小色块。
   */
  const wfBarItem = (value: number, color: string) => ({
    value,
    itemStyle: { color: value === 0 ? 'transparent' : color }
  })

  const buildWaterfallOption = (): EChartsOption => {
    const r = props.row || {}
    // 费用字段后端已带符号（支出为负）；瀑布直接累加，勿再取反
    const wf: Array<{ name: string; v: number; total?: boolean }> = buildWaterfallSteps(r).map(
      (item) => ({ name: item.name, v: item.value, total: item.total })
    )
    const cats = wf.map((s) => s.name)
    // 结果柱（末位「利润额」）用绿色，与收支公式里的利润额文字色一致；起始柱「平台收入」保持蓝紫
    const profitIndex = wf.length - 1
    // 单笔订单金额量级小（几十~几百），k 缩写会丢掉有效数字，纵轴与柱顶标签改显原值
    const rawScale = isOrder.value
    let run = 0
    const base: number[] = []
    const drop: number[] = []
    const tot: number[] = []
    // 柱高不做取整：订单维度单项费用常不足 1 元（如 $0.06），取整会直接归零导致色块消失
    wf.forEach((s) => {
      if (s.total) {
        base.push(0)
        drop.push(0)
        tot.push(s.v)
        run = s.v
      } else if (s.v >= 0) {
        // 正项（其他收入）：柱从当前水位向上涨
        base.push(run)
        drop.push(s.v)
        tot.push(0)
        run = add(run, s.v)
      } else {
        // 负项（支出/成本）：柱从当前水位向下掉
        run = add(run, s.v)
        base.push(run)
        drop.push(-s.v)
        tot.push(0)
      }
    })
    return {
      tooltip: {
        trigger: 'axis',
        axisPointer: { type: 'shadow' },
        formatter: (params: any) => {
          const idx = params?.[0]?.dataIndex ?? 0
          const item = wf[idx]
          const displayValue = item.v
          return `${cats[idx]}<br/><b>${money(displayValue)}</b>`
        }
      },
      grid: { left: 6, right: 12, top: 16, bottom: 4, containLabel: true },
      xAxis: {
        type: 'category',
        data: cats,
        axisLabel: { color: '#8590a6', fontSize: 10, interval: 0, rotate: 34 },
        axisLine: { lineStyle: { color: '#e6e9f0' } },
        axisTick: { show: false }
      },
      yAxis: {
        type: 'value',
        axisLabel: {
          formatter: (v: number) =>
            !rawScale && Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v),
          color: '#8590a6',
          fontSize: 10
        },
        splitLine: { lineStyle: { color: '#eef1f6' } }
      },
      series: [
        {
          type: 'bar',
          stack: 'wf',
          silent: true,
          itemStyle: { color: 'transparent' },
          data: base,
          barMaxWidth: 24
        },
        {
          type: 'bar',
          stack: 'wf',
          itemStyle: { borderRadius: [2, 2, 0, 0] },
          barMinHeight: WF_BAR_MIN_HEIGHT,
          // 中途柱默认红（支出/成本）；正项（平台其他收入）改用收入色，与起始柱一致
          data: drop.map((v, i) =>
            wfBarItem(v, !wf[i].total && wf[i].v >= 0 ? WF_INCOME_COLOR : WF_EXPENSE_COLOR)
          ),
          barMaxWidth: 24
        },
        {
          type: 'bar',
          stack: 'wf',
          itemStyle: { borderRadius: [2, 2, 0, 0] },
          barMinHeight: WF_BAR_MIN_HEIGHT,
          data: tot.map((v, i) =>
            wfBarItem(v, i === profitIndex ? WF_PROFIT_COLOR : WF_INCOME_COLOR)
          ),
          barMaxWidth: 24,
          label: {
            show: true,
            position: 'top',
            fontSize: 10,
            color: '#1f2533',
            // p.value 仅结果柱（平台收入/利润额）非 0，其余柱不显示标签
            formatter: (p: any) => {
              if (!p.value) return ''
              const raw = wf[p.dataIndex]?.v ?? p.value
              return rawScale ? money(raw) : `${(raw / 1000).toFixed(1)}k`
            }
          }
        }
      ]
    }
  }

  const renderChart = (): void => {
    if (!chartRef.value || !props.row) return
    if (!chart) chart = echarts.init(chartRef.value)
    chart.setOption(buildWaterfallOption(), true)
    nextTick(() => chart?.resize())
  }

  const disposeChart = (): void => {
    chart?.dispose()
    chart = null
  }

  watch(
    () => [visible.value, props.row] as const,
    ([open]) => {
      if (!open) {
        disposeChart()
        return
      }
      nextTick(() => {
        requestAnimationFrame(() => renderChart())
      })
    }
  )

  // const onReview = (): void => {
  //   ElMessage.success('已加入利润复盘清单（演示）')
  // }

  onBeforeUnmount(disposeChart)
</script>

<style lang="scss">
  .pbd-drawer {
    .el-drawer__body {
      padding: 0;
      overflow: hidden;
    }
  }
</style>

<style lang="scss" scoped>
  .pbd-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
  }

  .pbd-head {
    position: relative;
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 18px 48px 18px 20px;
    border-bottom: 1px solid #e6e9f0;
  }

  .pbd-thumb {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    overflow: hidden;
    color: #4f63d2;
    // background: linear-gradient(135deg, #eef2ff, #e0e7ff);
    // border: 1px solid #dfe5f5;
    border-radius: 8px;

    &.is-sku {
      font-size: 14px;
      font-weight: 700;
    }

    svg {
      width: 22px;
      height: 22px;
    }
  }

  .pbd-thumb-img {
    width: 100%;
    height: 100%;
    cursor: zoom-in;
  }

  .pbd-thumb-ph {
    font-size: 18px;
    color: #4f63d2;
  }

  .pbd-title {
    font-size: 15px;
    font-weight: 700;
    color: #1f2937;
  }

  .pbd-sub {
    margin-top: 4px;
    font-size: 12px;
    color: #8590a6;
  }

  /* 订单状态标签（跟在店铺之后） */
  .pbd-status {
    display: inline-block;
    padding: 1px 8px;
    margin-left: 6px;
    font-size: 11px;
    font-weight: 600;
    line-height: 18px;
    border-radius: 10px;

    &.is-done {
      color: #0f9f6e;
      background: #e6f7ef;
    }

    &.is-progress {
      color: #2e5cff;
      background: #eef2ff;
    }

    &.is-pending {
      color: #b86e00;
      background: #fff4d6;
    }

    &.is-danger {
      color: #e5484d;
      background: #fdecec;
    }

    &.is-default {
      color: #64748b;
      background: #eef1f6;
    }
  }

  .pbd-x {
    position: absolute;
    top: 14px;
    right: 16px;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 30px;
    height: 30px;
    color: #8590a6;
    cursor: pointer;
    background: #fff;
    border: 1px solid #e6e9f0;
    border-radius: 7px;

    &:hover {
      color: #2e5cff;
      border-color: #2e5cff;
    }
  }

  .pbd-body {
    flex: 1;
    padding: 14px 20px 18px;
    overflow: auto;
  }

  .pbd-sec {
    display: flex;
    gap: 7px;
    align-items: center;
    margin: 13px 0 8px;
    font-size: 13px;
    font-weight: 700;
    color: #1f2937;

    &:first-child {
      margin-top: 0;
    }

    /* 对齐 demo .section-title svg */
    svg {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      color: #2e5cff;
    }
  }

  .info-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 9px 18px;
    padding: 13px 15px;
    background: #f7f9fc;
    border: 1px solid #e6e9f0;
    border-radius: 10px;

    .it {
      min-width: 0;
    }

    .k {
      font-size: 11px;
      color: #8590a6;
    }

    .v {
      padding-top: 4px;
      overflow: hidden;
      font-size: 12px;
      font-weight: 600;
      color: #1f2937;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  }

  .unit-grid {
    display: grid;
    grid-auto-columns: 1fr;
    grid-auto-flow: column;
    gap: 6px;
  }

  .unit-card {
    padding: 7px 8px;
    background: #f8fbff;
    border: 1px solid #dce7fb;
    border-radius: 7px;

    .k {
      font-size: 11px;
      color: #8590a6;
    }

    .v {
      padding-top: 4px;
      margin-top: 2px;
      font-size: 12px;
      font-weight: 600;
      color: #1f2937;
    }
  }

  .cost-source-note {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 8px 10px;
    margin: 2px 0 8px;
    font-size: 11.5px;
    line-height: 1.55;
    color: #5b6478;
    background: #fbfcff;
    border: 1px dashed #d8dee8;
    border-radius: 9px;

    b {
      color: #1f2937;
      white-space: nowrap;
    }
  }

  .formula-list {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  .formula-row {
    display: flex;
    gap: 11px;
    align-items: center;
    padding: 7px 10px;
    border-radius: 8px;

    &:nth-child(odd) {
      background: #f7f9fc;
    }

    &.total {
      margin-top: 6px;
      background: #e8f7ee;

      .vl {
        font-size: 15px;
        color: #16a34a;
      }
    }

    .ic {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 28px;
      height: 28px;
      font-size: 14px;
      font-weight: 800;
      border-radius: 8px;

      &.plus {
        color: #16a34a;
        background: #e8f7ee;
      }

      &.minus {
        color: #ef4444;
        background: #fdecec;
      }

      &.equal {
        color: #334155;
        background: #e5f5f0;
      }
    }

    .nm {
      display: flex;
      flex: 1;
      flex-direction: column;
      font-size: 12.5px;

      small {
        margin-top: 1px;
        font-size: 10.5px;
        line-height: 18px;
        color: #8590a6;
      }
    }

    .vl {
      font-size: 13px;
      font-weight: 600;
      font-variant-numeric: tabular-nums;
    }
  }

  .pbd-chart {
    width: 100%;
    height: 220px;
  }

  .factor-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .factor-row {
    display: grid;
    grid-template-columns: 24px minmax(0, 1fr) 82px 52px;
    gap: 8px;
    align-items: center;
    padding: 7px 9px;
    background: #f7f9fc;
    border: 1px solid #e6e9f0;
    border-radius: 7px;

    &.head {
      font-size: 11px;
      font-weight: 600;
      color: #8590a6;
      background: #fff;
      border-style: dashed;
    }

    .rank {
      font-size: 11.5px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: #8590a6;
    }

    .txt {
      min-width: 0;
      font-size: 11.5px;
      color: #5b6478;

      b {
        display: block;
        font-size: 12px;
        color: #1f2937;
      }

      span {
        display: block;
        overflow: hidden;
        font-size: 10.5px;
        color: #8590a6;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
    }

    .val,
    .rate {
      font-size: 12px;
      font-weight: 700;
      font-variant-numeric: tabular-nums;
      color: #1f2937;
      text-align: right;
    }

    .rate {
      font-size: 11.5px;
      color: #8590a6;
    }
  }

  .line-items {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .line-item {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 10px 12px;
    background: #fbfcff;
    border: 1px solid #e6e9f0;
    border-radius: 10px;

    &.loss {
      background: #fff7f7;
      border-color: #f5d0d0;
    }

    .sku-thumb {
      display: flex;
      flex-shrink: 0;
      align-items: center;
      justify-content: center;
      width: 42px;
      height: 42px;
      overflow: hidden;
      font-size: 13px;
      font-weight: 700;
      color: #4f63d2;
      background: linear-gradient(135deg, #eef2ff, #e0e7ff);
      border: 1px solid #dfe5f5;
      border-radius: 8px;
    }

    .sku-thumb-img {
      width: 100%;
      height: 100%;
      cursor: zoom-in;
    }

    .sku-thumb-ph {
      font-size: 16px;
      color: #4f63d2;
    }

    .li-main {
      flex: 1;
      min-width: 0;
    }

    .li-t {
      font-size: 12.5px;
      font-weight: 700;
      color: #1f2937;
    }

    .li-s {
      margin-top: 2px;
      font-size: 11px;
      color: #8590a6;
    }

    .li-q {
      font-size: 11.5px;
      color: #5b6478;
      text-align: right;

      b {
        display: block;
        margin-top: 2px;
        font-variant-numeric: tabular-nums;

        &.pos {
          color: #1f2937;
        }

        &.neg {
          color: #c0392f;
        }
      }
    }
  }

  .pbd-foot {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 14px 20px;
    border-top: 1px solid #e6e9f0;
  }
</style>
