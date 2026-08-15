<!-- ASIN 利润测算抽屉：交互/内容对齐 dataDemo/订单利润(1).html openAsinScenario -->
<template>
  <ElDrawer
    v-model="visible"
    size="620px"
    direction="rtl"
    :with-header="false"
    class="asd-drawer"
    append-to-body
    destroy-on-close
  >
    <div v-if="base" class="asd-inner">
      <div class="asd-head">
        <div class="asd-thumb">
          <ElImage
            v-if="getUrl(base.imgChar)"
            :src="getUrl(base.imgChar)"
            :preview-src-list="[getUrl(base.imgChar)]"
            :preview-teleported="true"
            fit="cover"
            class="asd-thumb-img"
            @click.stop
          />
          <ElIcon v-else class="asd-thumb-ph"><Picture /></ElIcon>
        </div>
        <div class="asd-head-text">
          <div class="asd-title">ASIN 利润测算</div>
          <div class="asd-sub">
            <a
              class="asd-amazon-link"
              :href="amazonAsinUrl"
              target="_blank"
              rel="noopener noreferrer"
              title="打开亚马逊商品页"
            >
              {{ base.asin }}
            </a>
            · 当前筛选区间· {{ intFmt(base.orderCount) }} 单
          </div>
        </div>
        <button type="button" class="asd-x" title="关闭" @click="visible = false">
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

      <div class="asd-body">
        <div class="scenario-note">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 16v-4M12 8h.01" />
          </svg>
          <div>
            基准取当前筛选日期区间内该 ASIN
            的汇总表现。这里先只测广告投入和订单量变化，售价、退款率、促销等默认保持不变。
          </div>
        </div>

        <div class="scenario-kpis">
          <div class="scenario-kpi">
            <div class="k">基准订单</div>
            <div class="v">{{ intFmt(base.orderCount) }}</div>
            <div class="s">{{ intFmt(base.qty) }} 件</div>
          </div>
          <div class="scenario-kpi">
            <div class="k">基准利润</div>
            <div class="v">{{ money(base.profit) }}</div>
            <div class="s">利润率 {{ pct(base.margin) }}</div>
          </div>
          <div class="scenario-kpi">
            <div class="k">单均广告</div>
            <div class="v">{{ money(base.unitAd) }}</div>
            <div class="s">广告费用 {{ money(base.ad) }}</div>
          </div>
          <div class="scenario-kpi">
            <div class="k">单个利润</div>
            <div class="v">{{ money(base.unitProfit) }}</div>
            <div class="s">不含广告贡献 {{ money(base.contribution) }}</div>
          </div>
        </div>

        <div class="scenario-sandbox">
          <div class="asd-sec">测算参数</div>
          <div class="scenario-controls">
            <label class="scenario-field">
              <span>新单均广告费用</span>
              <ElInputNumber
                v-model="nextAd"
                :min="0"
                :step="0.1"
                :precision="2"
                :controls="false"
                class="asd-input"
              />
            </label>
            <label class="scenario-field">
              <span>预计订单数</span>
              <ElInputNumber
                v-model="nextOrders"
                :min="0"
                :step="1"
                :precision="0"
                :controls="false"
                class="asd-input"
                @change="onOrdersChange"
              />
            </label>
            <label class="scenario-field">
              <span>订单增长率 %</span>
              <ElInputNumber
                v-model="growth"
                :step="1"
                :precision="1"
                :controls="false"
                class="asd-input"
                @change="onGrowthChange"
              />
            </label>
          </div>

          <div class="asd-sec">测算结果</div>
          <div class="scenario-alert">以下为模拟测算结果，不代表实际利润</div>
          <div class="scenario-results">
            <div class="scenario-result em">
              <div class="k">预计利润</div>
              <div class="v" :class="result.nextProfit >= 0 ? 'pos' : 'neg'">
                {{ money(result.nextProfit) }}
              </div>
              <div class="s">{{ result.risk }}</div>
            </div>
            <div class="scenario-result">
              <div class="k">利润增量</div>
              <div class="v" :class="result.delta >= 0 ? 'pos' : 'neg'">
                {{ result.delta >= 0 ? '+' : '' }}{{ money(result.delta) }}
              </div>
              <div class="s">对比{{ base.period }}基准 {{ money(base.profit) }}</div>
            </div>
            <div class="scenario-result">
              <div class="k">预计利润率</div>
              <div class="v">{{ pct(result.nextMargin) }}</div>
              <div class="s">按单均销售额 {{ money(base.unitSales) }} 估算</div>
            </div>
            <div class="scenario-result">
              <div class="k">盈亏平衡广告</div>
              <div class="v">{{ money(result.breakevenAd) }}</div>
              <div class="s">单均广告费用高于该值，单个利润转负</div>
            </div>
          </div>
          <div class="scenario-formula">
            <b>计算口径：</b>不含广告单均贡献 = 原单个利润 {{ money(base.unitProfit) }} +
            原单均广告费用 {{ money(base.unitAd) }} = {{ money(base.contribution) }}
            <br />
            新单均利润 = {{ money(base.contribution) }} - {{ money(nextAd) }} =
            <b>{{ money(result.nextUnitProfit) }}</b>
            <br />
            新总利润 = （基准订单销量 {{ intFmt(base.qty) }} ÷ 基准订单数
            {{ intFmt(base.orderCount) }} × 预计订单数 {{ intFmt(nextOrders) }}）件 ×
            {{ money(result.nextUnitProfit) }} =
            <b>{{ money(result.nextProfit) }}</b>
            <br />
            盈亏平衡单个广告 = 不含广告单个贡献 = <b>{{ money(result.breakevenAd) }}</b>
            <br />
            <template v-if="Number.isFinite(result.keepProfitOrders)">
              如果要维持原利润，至少需要
              <b>{{ intFmt(result.keepProfitOrders) }}</b> 单。
            </template>
            <template v-else>当前单均利润为负，无法靠增加订单维持原利润。</template>
          </div>
        </div>
      </div>

      <div class="asd-foot">
        <ElButton @click="visible = false">关闭</ElButton>
        <!-- <ElButton v-auth="'finance:scProfit:saveScenario'" type="primary" @click="onSave">
          保存测算
        </ElButton> -->
      </div>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { ElButton, ElDrawer, ElImage, ElInputNumber, ElIcon } from 'element-plus'
  import { Picture } from '@element-plus/icons-vue'
  import { getUrl } from '@/utils/common-util'
  import { add, sub, mul, divide } from '@/utils/dataprocess'
  import { formatMoney } from '../currency'
  import { formatPercent } from '../presentation'

  defineOptions({ name: 'AsinScenarioDrawer' })

  export interface AsinScenarioBase {
    asin: string
    /** 站点代码，用于拼亚马逊域名，缺省 US → amazon.com */
    site?: string
    imgChar: string
    period: string
    orderCount: number
    qty: number
    profit: number
    margin: number
    ad: number
    unitAd: number
    unitProfit: number
    unitSales: number
    contribution: number
  }

  const AMAZON_DOMAIN: Record<string, string> = {
    US: 'com',
    CA: 'ca',
    MX: 'com.mx',
    UK: 'co.uk',
    GB: 'co.uk',
    DE: 'de',
    FR: 'fr',
    IT: 'it',
    ES: 'es',
    JP: 'co.jp',
    AU: 'com.au'
  }

  const props = defineProps<{
    modelValue: boolean
    /** 由行数据推导的测算基准；为空则不渲染内容 */
    base: AsinScenarioBase | null
  }>()

  const emit = defineEmits<{ (e: 'update:modelValue', v: boolean): void }>()

  const visible = computed({
    get: () => props.modelValue,
    set: (v) => emit('update:modelValue', v)
  })

  const nextAd = ref(0)
  const nextOrders = ref(0)
  const growth = ref(0)
  /** 避免订单数 / 增长率互相 watch 时循环 */
  let syncing = false

  // 金额格式化随当前币种符号（$/¥）；数值由后端按 exchange_rate 换算
  const money = (v: number): string => formatMoney(v)
  const pct = (v: number): string => formatPercent(Number(v || 0))
  const intFmt = (v: number): string => Math.round(v || 0).toLocaleString('en-US')
  /** 四舍五入到分：让口径行「件数 × 单个利润 = 总利润」所见即所得地相等 */
  const r2 = (v: number): number => Number((Number(v) || 0).toFixed(2))

  /** 对齐 demo amazonLink：https://www.amazon.{domain}/dp/{asin} */
  const amazonAsinUrl = computed(() => {
    const asin = String(props.base?.asin || '').trim()
    const site = String(props.base?.site || 'US')
      .trim()
      .toUpperCase()
    const domain = AMAZON_DOMAIN[site] || 'com'
    return `https://www.amazon.${domain}/dp/${encodeURIComponent(asin)}`
  })

  watch(
    () => [visible.value, props.base] as const,
    ([open, b]) => {
      if (!open || !b) return
      nextAd.value = +b.unitAd.toFixed(2)
      nextOrders.value = Math.round(b.orderCount)
      growth.value = 0
    }
  )

  const onOrdersChange = (): void => {
    if (!props.base || syncing) return
    syncing = true
    const baseN = props.base.orderCount || 0
    growth.value = baseN ? +mul(sub(divide(nextOrders.value, baseN), 1), 100).toFixed(2) : 0
    syncing = false
  }

  const onGrowthChange = (): void => {
    if (!props.base || syncing) return
    syncing = true
    nextOrders.value = Math.max(
      0,
      Math.round(mul(props.base.orderCount, add(1, divide(growth.value, 100))))
    )
    syncing = false
  }

  const result = computed(() => {
    const b = props.base
    if (!b) {
      return {
        nextUnitProfit: 0,
        nextProfit: 0,
        delta: 0,
        nextMargin: 0,
        breakevenAd: 0,
        keepProfitOrders: Infinity as number,
        nextTotalQty: 0,
        risk: ''
      }
    }
    // 每单件数 = 基准件数 / 基准订单数；预计总件数 = 每单件数 × 预计订单数
    const perOrderQty = divide(b.qty, b.orderCount)
    const nextTotalQty = r2(mul(perOrderQty, nextOrders.value))
    // 新单个利润(按件) = 不含广告单个贡献 - 新单个广告；四舍五入到分，保证与总利润所见即所得
    const nextUnitProfit = r2(sub(b.contribution, nextAd.value))
    // 新总利润 = 预计总件数 × 新单个利润
    const nextProfit = r2(mul(nextTotalQty, nextUnitProfit))
    const delta = sub(nextProfit, b.profit)
    const nextSales = mul(nextOrders.value, b.unitSales)
    const nextMargin = nextSales ? mul(divide(nextProfit, nextSales), 100) : 0
    const breakevenAd = b.contribution
    // 维持原利润所需订单数：原利润 = 每单件数 × 订单数 × 新单个利润
    const keepProfitOrders =
      nextUnitProfit > 0
        ? Math.ceil(divide(b.profit, mul(perOrderQty, nextUnitProfit)))
        : Number.POSITIVE_INFINITY
    const risk =
      nextUnitProfit <= 0
        ? '单个利润已小于等于 0，件数越多亏损越大'
        : delta >= 0
          ? '该假设下利润增长'
          : '该假设下利润下降'
    return {
      nextUnitProfit,
      nextProfit,
      delta,
      nextMargin,
      breakevenAd,
      keepProfitOrders,
      nextTotalQty,
      risk
    }
  })

  // const onSave = (): void => {
  //   ElMessage.success('测算方案已保存（演示）')
  // }
</script>

<style lang="scss">
  .asd-drawer {
    .el-drawer__body {
      padding: 0;
      overflow: hidden;
    }
  }
</style>

<style lang="scss" scoped>
  .asd-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
    background: #fff;
  }

  .asd-head {
    position: relative;
    display: flex;
    gap: 12px;
    align-items: center;
    padding: 18px 48px 18px 20px;
    border-bottom: 1px solid #e6e9f0;
  }

  .asd-thumb {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: center;
    width: 46px;
    height: 46px;
    overflow: hidden;
    font-size: 14px;
    font-weight: 700;
    color: #4f63d2;
    // background: linear-gradient(135deg, #eef2ff, #e0e7ff);
    // border: 1px solid #dfe5f5;
    border-radius: 8px;
  }

  .asd-thumb-img {
    width: 100%;
    height: 100%;
    cursor: zoom-in;
  }

  .asd-thumb-ph {
    font-size: 18px;
    color: #4f63d2;
  }

  .asd-title {
    font-size: 15px;
    font-weight: 700;
    color: #1f2937;
  }

  .asd-sub {
    margin-top: 3px;
    font-size: 12px;
    color: #8590a6;
  }

  .asd-amazon-link {
    font-family: ui-monospace, 'SF Mono', monospace;
    font-weight: 500;
    color: #2e5cff;
    text-decoration: none;
    cursor: pointer;

    &:hover {
      text-decoration: underline;
    }
  }

  .asd-x {
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

  .asd-body {
    flex: 1;
    padding: 18px 20px;
    overflow: auto;
  }

  .scenario-note {
    display: flex;
    gap: 8px;
    align-items: flex-start;
    padding: 10px 12px;
    margin-bottom: 12px;
    font-size: 12px;
    line-height: 1.5;
    color: #5b6478;
    background: #f5f8ff;
    border: 1px solid #dce7fb;
    border-radius: 10px;

    svg {
      flex-shrink: 0;
      width: 16px;
      height: 16px;
      margin-top: 1px;
      color: #2e5cff;
    }
  }

  .scenario-kpis {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 8px;
    margin-bottom: 14px;
  }

  .scenario-kpi {
    padding: 10px 11px;
    background: #fff;
    border: 1px solid #e6e9f0;
    border-radius: 9px;

    .k {
      font-size: 11px;
      color: #8590a6;
    }

    .v {
      margin-top: 4px;
      font-size: 16px;
      font-weight: 800;
      font-variant-numeric: tabular-nums;
      color: #1f2937;
    }

    .s {
      margin-top: 3px;
      font-size: 10.5px;
      color: #8590a6;
    }
  }

  .scenario-sandbox {
    padding: 12px;
    margin-top: 12px;
    background: #fffbeb;
    border: 1px dashed #f4c76b;
    border-radius: 14px;
  }

  .asd-sec {
    margin: 4px 0 10px;
    font-size: 13px;
    font-weight: 700;
    color: #1f2937;
  }

  .scenario-controls {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 10px;
    margin-bottom: 12px;
  }

  .scenario-field {
    display: flex;
    flex-direction: column;
    gap: 6px;
    padding: 10px 11px;
    background: #fff;
    border: 1px solid #e6e9f0;
    border-radius: 9px;

    span {
      font-size: 11.5px;
      font-weight: 700;
      color: #5b6478;
    }
  }

  .asd-input {
    width: 100%;

    :deep(.el-input__inner) {
      font-weight: 700;
      font-variant-numeric: tabular-nums;
    }
  }

  .scenario-alert {
    display: flex;
    gap: 7px;
    align-items: center;
    padding: 9px 11px;
    margin: 6px 0 10px;
    font-size: 12px;
    font-weight: 700;
    color: #8a5a00;
    background: #fff7d6;
    border: 1px solid #f2d27a;
    border-radius: 9px;

    &::before {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 16px;
      height: 16px;
      font-size: 11px;
      font-weight: 800;
      color: #fff;
      content: '!';
      background: #f59e0b;
      border-radius: 50%;
    }
  }

  .scenario-results {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
    margin: 10px 0 14px;
  }

  .scenario-result {
    padding: 12px;
    background: #fffdf3;
    border: 1px dashed #e8c66f;
    border-radius: 10px;

    &.em {
      background: linear-gradient(135deg, #fff8d9, #fffdf3);
      border-color: #dfb74f;
    }

    .k {
      font-size: 11px;
      color: #8590a6;
    }

    .v {
      margin-top: 4px;
      font-size: 20px;
      font-weight: 900;
      font-variant-numeric: tabular-nums;
      color: #1f2937;

      &.pos {
        color: #16a34a;
      }

      &.neg {
        color: #ef4444;
      }
    }

    .s {
      margin-top: 4px;
      font-size: 11px;
      color: #5b6478;
    }
  }

  .scenario-formula {
    padding: 10px 12px;
    font-size: 12px;
    line-height: 1.65;
    color: #5b6478;
    background: #fbfcfe;
    border: 1px dashed #d0d7e3;
    border-radius: 10px;

    b {
      color: #1f2937;
    }
  }

  .asd-foot {
    display: flex;
    gap: 10px;
    justify-content: flex-end;
    padding: 14px 20px;
    border-top: 1px solid #e6e9f0;
  }

  @media (width <= 900px) {
    .scenario-kpis,
    .scenario-controls,
    .scenario-results {
      grid-template-columns: 1fr 1fr;
    }
  }
</style>
