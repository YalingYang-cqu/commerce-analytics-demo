<!-- 费用分摊抽屉：展示 SC 订单利润各费用项的归属/分摊口径（内容对齐订单利润 demo） -->
<template>
  <ElDrawer
    v-model="visible"
    size="980px"
    direction="rtl"
    :with-header="false"
    class="alloc-drawer"
    append-to-body
    destroy-on-close
  >
    <div class="alloc-drawer-inner">
      <!-- 头部 -->
      <div class="alloc-head-bar">
        <div class="alloc-head-left">
          <div class="alloc-thumb">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7">
              <path d="M4 7h16" />
              <path d="M7 4v16" />
              <path d="M17 4v16" />
              <path d="M4 17h16" />
            </svg>
          </div>
          <div>
            <div class="alloc-title">费用分摊</div>
            <div class="alloc-sub">SC订单利润 · 订单维度费用归属与分摊口径</div>
          </div>
        </div>
        <button type="button" class="alloc-x" title="关闭" @click="visible = false">
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

      <!-- 内容 -->
      <div class="alloc-body">
        <div class="alloc-panel">
          <div class="alloc-toolbar">
            <div class="alloc-search">
              <ElInput
                v-model="keyword"
                clearable
                placeholder="搜索费用名称"
                class="alloc-control"
              />
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.3-4.3" />
              </svg>
            </div>
            <ElTooltip placement="bottom-start" :show-after="200">
              <template #content>
                <div class="alloc-tip-html">
                  优先把费用直接归属到
                  <b>订单商品行</b
                  >；无法直接归属时，依次使用广告报告、活动/优惠券报告、仓储报告、货件/移除单等业务单据；涉及退款、赔偿、仓储、广告等非订单直接费用时，按结算日或账单发生日归属，不强行挂回原销售订单。
                </div>
              </template>
              <div class="alloc-tip">分摊原则<span class="q">i</span></div>
            </ElTooltip>
            <ElTooltip placement="bottom-start" :show-after="200">
              <template #content>
                <div class="alloc-tip-html">
                  <b>P1</b> 订单×SKU 直接归属<br />
                  <b>P2</b> MSKU×日按销量/销售额占比分摊<br />
                  <b>P3</b> 关联业务单据→SKU按占比分摊<br />
                  <b>P4</b> 店铺日度池→SKU按日销售额分摊（仓储费按月）<br />
                  <b>P5</b> 不分摊/特殊处理
                </div>
              </template>
              <div class="alloc-tip">优先级<span class="q">i</span></div>
            </ElTooltip>
          </div>

          <div class="alloc-table-wrap">
            <div class="alloc-table">
              <div class="alloc-table-head">
                <div class="alloc-th">费用分类</div>
                <div class="alloc-th">分摊方式</div>
                <div class="alloc-th">规则说明</div>
              </div>
              <template v-for="g in filteredGroups" :key="g.group">
                <div class="alloc-group">{{ g.group }}</div>
                <div v-for="r in g.items" :key="r.field" class="alloc-tr">
                  <div class="alloc-cell alloc-name">
                    {{ r.name }}
                    <span class="alloc-field">{{ r.field }}</span>
                  </div>
                  <div class="alloc-cell">
                    <span class="alloc-method" :class="priorityClass(r.priority)">{{
                      r.method
                    }}</span>
                  </div>
                  <div class="alloc-cell alloc-desc">
                    <div class="alloc-rule">
                      <div class="alloc-rule-tags">
                        <span class="alloc-tag" :class="priorityClass(r.priority)">{{
                          r.priority
                        }}</span>
                        <span v-if="r.fallbackTag" class="alloc-tag warn">{{ r.fallbackTag }}</span>
                        <span v-else-if="r.sales" class="alloc-tag warn">兜底：销售额占比</span>
                        <span v-else class="alloc-tag">优先直接归属</span>
                      </div>
                      <div class="alloc-rule-line">
                        <b>归属维度</b><span>{{ r.dimension }}</span>
                      </div>
                      <div class="alloc-rule-line">
                        <b>数据来源</b><span>{{ r.source }}</span>
                      </div>
                      <div class="alloc-rule-line">
                        <b>分摊逻辑</b><span>{{ r.logic }}</span>
                      </div>
                      <div class="alloc-rule-line">
                        <b>兜底处理</b><span>{{ r.fallback }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </template>
            </div>
            <div v-if="!filteredGroups.length" class="alloc-empty">没有匹配的费用分摊规则</div>
          </div>

          <div class="alloc-summary">
            <span>共 {{ totalCount }} 项费用规则</span>
            <span
              >无法直接归属时，优先使用业务报告或单据；最后才按销售额、销量、件数等权重分摊；特殊项可不分摊或进入待核对</span
            >
          </div>
        </div>
      </div>

      <!-- 底部 -->
      <div class="alloc-foot">
        <ElButton @click="visible = false">关闭</ElButton>
      </div>
    </div>
  </ElDrawer>
</template>

<script setup lang="ts">
  import { computed, ref } from 'vue'
  import { ElDrawer, ElInput, ElTooltip, ElButton } from 'element-plus'

  defineOptions({ name: 'AllocationDrawer' })

  const visible = defineModel<boolean>({ default: false })

  interface AllocItem {
    name: string
    field: string
    method: string
    priority: string
    dimension: string
    source: string
    logic: string
    fallback: string
    sales?: boolean
    fallbackTag?: string
  }

  interface AllocGroup {
    group: string
    items: AllocItem[]
  }

  /** 费用分摊规则（对齐订单利润 demo ALLOCATION_GROUPS） */
  const ALLOCATION_GROUPS: AllocGroup[] = [
    {
      group: '平台收入',
      items: [
        {
          name: '销售额',
          field: 'sales',
          method: '直接归属',
          priority: 'P1',
          dimension: '订单号 × SKU',
          source:
            'Settlement Report：product_sales；finances amount_type=ItemPrice, amount_description=Principal',
          logic: '每笔交易直接带 order_id 和 sku，无需分摊，1:1 落到具体订单商品行。',
          fallback: '缺少商品行时按订单内销售额占比分摊。',
          sales: true
        },
        {
          name: '买家运费',
          field: 'buyerShipping',
          method: '直接归属',
          priority: 'P1',
          dimension: '订单号 × SKU',
          source:
            'Settlement：shipping_credits + gift_wrap_credits；ItemPrice 中 shipping / gift wrap 相关子项',
          logic: '买家配送收入、配送税、礼品包装等随订单直接归属到商品行。',
          fallback: '缺少商品行时按订单内销售额占比分摊。',
          sales: true
        }
      ]
    },
    {
      group: '平台支出',
      items: [
        {
          name: '平台佣金',
          field: 'referral',
          method: '直接归属',
          priority: 'P1',
          dimension: '订单号 × SKU',
          source:
            'Settlement：selling_fees / Commission；finances amount_type=ItemFees, amount_description=Commission',
          logic: '亚马逊按商品类目收取佣金，每笔交易直接对应 order_id + sku，直接落到订单商品行。',
          fallback: '只有订单级金额时按商品销售额占比分摊。',
          sales: true
        },
        {
          name: 'FBA配送费',
          field: 'fba',
          method: '直接归属',
          priority: 'P1',
          dimension: '订单号 × SKU',
          source:
            'Settlement：FBAPerUnitFulfillmentFee / FBAPerOrderFulfillmentFee / FBAWeightBasedFee',
          logic: 'FBA配送费按件或重量计费，每笔发货直接带 order_id + sku，优先按结算明细直接归属。',
          fallback: '只有订单级金额时按件数优先、销售额其次分摊。'
        },
        {
          name: '促销折扣',
          field: 'promoDiscount',
          method: '直接归属',
          priority: 'P1',
          dimension: '订单号 × SKU',
          source: 'Settlement：promotion_amount / PromotionDiscount / ShippingDiscount',
          logic:
            '每笔订单促销金额直接关联具体 SKU，包含商品折扣和 Shipping Discount，随订单商品行归属。',
          fallback: '无法识别商品行时按订单内销售额占比分摊。'
        },
        {
          name: '退货退款',
          field: 'refundTotal',
          method: '结算日归属',
          priority: 'P1/P2',
          dimension: '订单号 × SKU / ASIN × 结算日 / MSKU × 结算日',
          source:
            'Settlement：Refund、DisbursementOnlyRefund、ChargebackRefund、GuaranteeClaimRefund、FBACustomerReturn、CustomerReturnHRREvent',
          logic:
            '商品退货退款带真实销售订单号和 sku/asin 时直接挂对应 MSKU；退货服务费按 ASIN×结算日归属；高退货率商品 FBA 退货处理费无销售订单号时，按 ASIN 匹配 MSKU 后按结算日销售额分摊。',
          fallback: '无法匹配 MSKU 时进入待核对；时间口径按结算日重分，不挂回原订单。',
          sales: true,
          fallbackTag: '兜底：销售额占比'
        },
        {
          name: '广告费用',
          field: 'ad',
          method: '广告报告归因',
          priority: 'P3/P4',
          dimension: '店铺 × 扣款日 → 广告报告 SKU/ASIN → 订单商品行',
          source: 'Settlement：ProductAdsPayment + SP/SB/SD 广告报告',
          logic:
            '先汇总结算广告实付金额，再按广告报告 cost 占比分到 SKU/ASIN/天，并等比缩放到结算实付总额，最后按该 SKU 当天订单销售额占比分摊到订单行；无法归因部分进入待核对或店铺池。',
          fallback:
            '广告报告缺失或 SB/SD 映射不完整时，按店铺日/月度 MSKU 销售额占比分摊，并保留待核对标记。',
          sales: true,
          fallbackTag: '兜底：销售额占比'
        },
        {
          name: '推广费',
          field: 'promoFee',
          method: '活动/优惠券归因',
          priority: 'P3/P4',
          dimension: '活动ID / 优惠券ID / 店铺日度池 → ASIN/MSKU → 订单',
          source:
            'SellerDealPayment、SellerDealComplete、DealPerformanceEvent、DealParticipationEvent、coupon_performance 报告',
          logic:
            '秒杀绩效费按活动 ID 关联 Deals 报告后按参与 ASIN/SKU 销售额分摊；优惠券费用按 coupon_id 关联优惠券报告后按兑换量或 discount_amount 分摊。',
          fallback:
            '无法取得活动/优惠券明细时，按账单所属日该店铺各 MSKU 销售额占比分摊，保留手动调整窗口。',
          sales: true,
          fallbackTag: '兜底：销售额/兑换量'
        },
        {
          name: '测评费用',
          field: 'testFee',
          method: '评价计划归因',
          priority: 'P3/P4',
          dimension: 'Vine Enrollment → ASIN/MSKU → 订单商品行',
          source: 'Vine Enrollment Fee / Vine评价计划费',
          logic:
            '按数仓三级科目“Vine评价计划费”识别测评费用，优先关联对应 ASIN/MSKU，再按归属日订单商品行销售额占比分摊。',
          fallback:
            '无法匹配 ASIN/MSKU 时进入店铺日度池，按当日 MSKU 销售额占比分摊并保留待核对标记。',
          sales: true,
          fallbackTag: '兜底：销售额占比'
        },
        {
          name: '仓储费',
          field: 'storageFee',
          method: '仓储报告归集',
          priority: 'P4',
          dimension: 'FNSKU / 仓库ID / 补货单 → MSKU → 月度/日度 → 订单',
          source:
            '月度仓储费报告、长期仓储费报告、StorageReservationFee、STAR仓储费、AWD补货明细、FBAInboundConvenience',
          logic:
            '月仓按结算入账月匹配报告计费月+1 后分到 FNSKU/MSKU，再按日和订单销售额分摊；长仓按快照月归集；容量预留、STAR等按店铺日度池或仓库/ASIN映射分摊；AWD和入库配置类费用优先按补货单/货件明细件数分摊。',
          fallback:
            '无法映射 FNSKU/MSKU 或货件号为空时，按账单所属日店铺 MSKU 销售额占比分摊；本期净额为 0 的 StorageReservationBilling 不分摊。',
          sales: true,
          fallbackTag: '兜底：销售额/件数'
        },
        {
          name: 'FBA操作费',
          field: 'fbaFulfillmentFee',
          method: '业务单据归属',
          priority: 'P3',
          dimension: '订单号 / 货件ID / 移除单 / SKU → MSKU',
          source:
            'Adjustment/LabmanLabelPurchase、FBAPostInboundTransportation、FBADisposal、FBARemoval、FBAInboundDefect、移除订单报告、入库货件明细',
          logic:
            '标签费用按结算订单号关联原销售订单取 MSKU；合作承运费按 FBA 货件号关联货件明细并按入库件数分摊；弃置费和移除费优先按销售订单号或移除单报告归属；入库缺陷费带 SKU 的直接归属，空 SKU 的按货件 SKU 构成分摊。',
          fallback:
            '货件号、移除单或 SKU 缺失时，按同店铺同结算月同费用类型的明细池兜底；仍无基数则挂店铺级未分摊。',
          sales: true,
          fallbackTag: '兜底：件数/明细池'
        },
        {
          name: '平台其他费用',
          field: 'platformOtherFee',
          method: '直接归属/店铺池',
          priority: 'P1/P4',
          dimension: '订单号 × SKU / 透明计划标签 → ASIN/MSKU / 店铺日度池',
          source:
            'TransparencyLabel fee、AccountManagerFee、SubscriptionFee、other_transaction_fees、regulatory_fee、tax、MCF相关费用',
          logic:
            '其他交易费、订单费用、税费等带 order_id + sku 的费用直接归属；透明计划优先通过标签报告/PDF识别 ASIN/MSKU，无法自动识别时降级为店铺销售额分摊；优质经理服务费、平台月租费按店铺日度池分摊。',
          fallback:
            'MCF多渠道配送服务费按现行口径暂不计入站内订单利润；无订单无 SKU 的店铺级费用按账单所属日销售额占比分摊。',
          sales: true
        }
      ]
    },
    {
      group: '库存成本',
      items: [
        {
          name: '采购成本',
          field: 'purchase',
          method: 'SKU单位成本',
          priority: 'P1',
          dimension: 'SKU → 供应商采购价 → 订单发货数量',
          source: 'ERP采购模块 / 供应商对账单 / dim_sku_cost',
          logic:
            '按 SKU 维度维护标准采购单价，取订单发货时点最近有效价格，乘以订单发货数量得到采购成本。',
          fallback: 'ERP 未提供有效成本时进入成本待处理，不自动按 0 计算。'
        },
        {
          name: '头程成本',
          field: 'head',
          method: 'SKU单件头程',
          priority: 'P1',
          dimension: 'SKU → 头程单价 → 订单发货数量',
          source: '物流服务商账单 / 头程入库记录 / dim_sku_freight',
          logic:
            '头程单价按国际运费、关税、清关等费用除以入库数量计算，乘以订单发货数量归集到订单商品行。',
          fallback: '无单件头程时按重量、体积或采购金额分摊到 SKU；支持批次加权平均。'
        },
        {
          name: '综合成本',
          field: 'totalCost',
          method: '公式汇总',
          priority: 'P5',
          dimension: '订单商品行',
          source: '采购成本 + 头程成本',
          logic:
            '综合成本 = 采购成本 + 头程成本，用于明细表汇总展示和成本率计算。部分业务可拆为商品成本、运输成本、关税成本三个维度独立核算。',
          fallback: 'FBA库存赔偿相关成本在单独页面处理，利润报表不因库存赔偿重复扣减或回加成本。',
          fallbackTag: '特殊：公式汇总'
        }
      ]
    },
    {
      group: '平台其他收入',
      items: [
        {
          name: 'FBA库存赔偿',
          field: 'fbaInventoryReimbursement',
          method: 'MSKU×结算日归属',
          priority: 'P1/P2',
          dimension: '订单号 × SKU / MSKU × 结算日',
          source:
            'REVERSAL_REIMBURSEMENT、MISSING_FROM_INBOUND、FREE_REPLACEMENT_REFUND_ITEMS、CS_ERROR_ITEMS、WAREHOUSE_LOST、WAREHOUSE_DAMAGE、REMOVAL_ORDER_LOST、PAYMENT_RETRACTION_ITEMS 等',
          logic:
            '带真实订单号和 sku/asin 的赔偿直接挂对应 MSKU；只有 sku/asin 的赔偿按结算日匹配 MSKU 后按销量或销售额分摊；赔偿追回按同一 MSKU×结算日逻辑处理。利润报表内不扣减库存成本，库存赔偿数量和成本影响放到独立页面处理。',
          fallback: '无法识别商品时进入待核对；不因库存赔偿在利润报表内重复扣减或回加成本。',
          sales: true,
          fallbackTag: '特殊：不扣成本'
        },
        {
          name: '其他收入',
          field: 'otherIncome',
          method: 'MSKU/店铺池归属',
          priority: 'P1/P4',
          dimension: 'MSKU × 结算日 / 店铺日度池',
          source:
            '清算收入、清算调整、库存所有权转让、MiscellaneousLedgerAdjustment、ServiceFee/FulfillmentAdjustment',
          logic:
            '清算收入按结算表 sku/fnsku 映射到 MSKU 后按结算日归属；费用调整带订单号和 SKU 时直接挂 MSKU；订单调整、仓储费调整、退货配送费收入调整、退款佣金返还等店铺级杂项按店铺日度池分摊。',
          fallback:
            '库存所有权转让按店铺所有 SKU 销售额占比分摊；无 SKU/订单明细的其他收入按发生日店铺销售额占比分摊。',
          sales: true
        }
      ]
    }
  ]

  const keyword = ref('')

  const priorityClass = (priority: string): string => {
    const m = String(priority || '').match(/P[1-5]/)
    return m ? m[0].toLowerCase() : 'p4'
  }

  const filteredGroups = computed<AllocGroup[]>(() => {
    const kw = keyword.value.trim().toLowerCase()
    if (!kw) return ALLOCATION_GROUPS
    return ALLOCATION_GROUPS.map((g) => ({
      group: g.group,
      items: g.items.filter((r) =>
        `${r.name} ${r.field} ${r.method} ${r.logic} ${r.source}`.toLowerCase().includes(kw)
      )
    })).filter((g) => g.items.length > 0)
  })

  const totalCount = computed(() => ALLOCATION_GROUPS.reduce((sum, g) => sum + g.items.length, 0))
</script>

<style lang="scss" scoped>
  .alloc-drawer-inner {
    display: flex;
    flex-direction: column;
    height: 100%;
  }

  .alloc-head-bar {
    display: flex;
    flex-shrink: 0;
    align-items: center;
    justify-content: space-between;
    padding: 16px 20px;
    border-bottom: 1px solid #ebeef5;
  }

  .alloc-head-left {
    display: flex;
    gap: 12px;
    align-items: center;
  }

  .alloc-thumb {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 40px;
    height: 40px;
    color: #2e5cff;
    background: #eef2ff;
    border: 1px solid #d8e3ff;
    border-radius: 10px;

    svg {
      width: 20px;
      height: 20px;
    }
  }

  .alloc-title {
    font-size: 15px;
    font-weight: 700;
    color: #111827;
  }

  .alloc-sub {
    margin-top: 3px;
    font-size: 12px;
    color: #9aa3b2;
  }

  .alloc-x {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: #6b7280;
    cursor: pointer;
    background: transparent;
    border: 0;
    border-radius: 6px;

    &:hover {
      color: #111827;
      background: #f3f4f6;
    }
  }

  .alloc-body {
    flex: 1;
    min-height: 0;
    padding: 14px 18px;
    overflow: auto;
    background: #f7f9fc;
  }

  .alloc-panel {
    display: flex;
    flex-direction: column;
    gap: 10px;
  }

  .alloc-toolbar {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    align-items: center;
  }

  .alloc-search {
    position: relative;

    :deep(.el-input) {
      width: 190px;
    }

    :deep(.el-input__wrapper) {
      height: 32px;
      padding-right: 30px;
      border-radius: 4px;
    }

    > svg {
      position: absolute;
      top: 50%;
      right: 9px;
      width: 14px;
      height: 14px;
      color: #9aa3b2;
      pointer-events: none;
      transform: translateY(-50%);
    }
  }

  .alloc-tip {
    display: inline-flex;
    gap: 6px;
    align-items: center;
    height: 32px;
    padding: 0 10px;
    font-size: 12px;
    font-weight: 600;
    color: #5f6877;
    cursor: help;
    background: #fff;
    border: 1px solid #d8e3ef;
    border-radius: 4px;

    &:hover {
      color: var(--el-color-primary);
      background: #f8fbff;
      border-color: var(--el-color-primary);
    }

    .q {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 14px;
      height: 14px;
      font-size: 9px;
      font-weight: 800;
      line-height: 1;
      color: #6b7280;
      background: #fff;
      border: 1px solid #9ca3af;
      border-radius: 50%;
    }
  }

  .alloc-table-wrap {
    overflow: auto;
    background: #fff;
    border: 1px solid #e5e7eb;
    border-radius: 4px;
  }

  .alloc-table {
    min-width: 850px;
  }

  .alloc-table-head,
  .alloc-tr {
    display: grid;
    grid-template-columns: 150px 130px minmax(500px, 1fr);
    align-items: stretch;
  }

  .alloc-table-head {
    font-size: 12px;
    font-weight: 700;
    color: #111827;
    background: #fff;
    border-bottom: 1px solid #e5e7eb;
  }

  .alloc-th,
  .alloc-cell {
    min-width: 0;
    padding: 9px 11px;
    border-left: 1px solid #e5e7eb;

    &:first-child {
      border-left: 0;
    }
  }

  .alloc-group {
    padding: 7px 11px;
    font-size: 12.5px;
    font-weight: 700;
    color: #111827;
    background: #f2f5fa;
    border-top: 1px solid #e5e7eb;

    &:first-of-type {
      border-top: 0;
    }
  }

  .alloc-tr {
    min-height: 44px;
    font-size: 12px;
    color: #5f6877;
    border-top: 1px solid #e5e7eb;

    &:hover {
      background: #f8fbff;
    }
  }

  .alloc-name {
    display: flex;
    flex-direction: column;
    gap: 4px;
    font-weight: 600;
    color: #111827;
  }

  .alloc-field {
    overflow: hidden;
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    font-size: 11.5px;
    color: #9aa3b2;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .alloc-method {
    display: inline-flex;
    align-items: center;
    padding: 2px 7px;
    font-weight: 600;
    color: #111827;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 4px;

    &.p1 {
      color: #1d4ed8;
      background: #eef7ff;
      border-color: #cfe2ff;
    }

    &.p2 {
      color: #15803d;
      background: #effaf5;
      border-color: #ccebdc;
    }

    &.p3 {
      color: #c2410c;
      background: #fff7ed;
      border-color: #fed7aa;
    }

    &.p4 {
      color: #6d28d9;
      background: #f8f5ff;
      border-color: #ddd6fe;
    }

    &.p5 {
      color: #475569;
      background: #f1f5f9;
      border-color: #dbe3ee;
    }
  }

  .alloc-rule {
    display: flex;
    flex-direction: column;
    gap: 5px;
  }

  .alloc-rule-tags {
    display: flex;
    flex-wrap: wrap;
    gap: 5px;
    align-items: center;
    margin-bottom: 1px;
  }

  .alloc-tag {
    display: inline-flex;
    align-items: center;
    height: 20px;
    padding: 0 7px;
    font-size: 11px;
    font-weight: 600;
    color: #9aa3b2;
    background: #f8fafc;
    border: 1px solid #e5e7eb;
    border-radius: 999px;

    &.p1 {
      color: #1d4ed8;
      background: #eef7ff;
      border-color: #cfe2ff;
    }

    &.p2 {
      color: #15803d;
      background: #effaf5;
      border-color: #ccebdc;
    }

    &.p3 {
      color: #c2410c;
      background: #fff7ed;
      border-color: #fed7aa;
    }

    &.p4 {
      color: #6d28d9;
      background: #f8f5ff;
      border-color: #ddd6fe;
    }

    &.p5 {
      color: #475569;
      background: #f1f5f9;
      border-color: #dbe3ee;
    }

    &.warn {
      color: #c2410c;
      background: #fff7ed;
      border-color: #fed7aa;
    }
  }

  .alloc-rule-line {
    display: grid;
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 8px;
    align-items: start;

    b {
      font-size: 11.5px;
      font-weight: 700;
      color: #111827;
      white-space: nowrap;
    }

    span {
      font-size: 12px;
      line-height: 1.45;
      color: #5f6877;
    }
  }

  .alloc-empty {
    padding: 28px;
    font-size: 12px;
    color: #9aa3b2;
    text-align: center;
    background: #fff;
  }

  .alloc-summary {
    display: flex;
    flex-wrap: wrap;
    gap: 8px;
    font-size: 11.5px;
    color: #9aa3b2;

    span {
      padding: 4px 8px;
      background: #fff;
      border: 1px solid #e5e7eb;
      border-radius: 4px;
    }
  }

  .alloc-foot {
    display: flex;
    flex-shrink: 0;
    justify-content: flex-end;
    padding: 12px 18px;
    background: #fff;
    border-top: 1px solid #ebeef5;
  }
</style>

<style lang="scss">
  /* ElDrawer 挂到 body，需非 scoped */
  .alloc-drawer.el-drawer {
    .el-drawer__body {
      padding: 0;
      overflow: hidden;
    }
  }

  .alloc-tip-html {
    max-width: 360px;
    font-size: 12px;
    line-height: 1.6;

    b {
      font-weight: 700;
    }
  }
</style>
