<!-- 产品日销售统计表：按看板类型（综合/SC/VC）使用各自的列定义与自定义列配置 -->
<!-- 父组件以 :key=boardType 重挂载本组件，保证三看板的列默认值与持久化互不串台 -->
<template>
  <ElCard shadow="never" class="asin-table-card">
    <!-- 标题 + 工具栏 -->
    <ArtTableHeaderGroup
      v-model:columns="columnChecks"
      layout="refresh,down,columnsNew"
      :tableName="tableName"
      :groups="columnGroups"
      :loading="loading"
      :export-api="exportApi"
      :export-params="mergedExportParams"
      :async-export="true"
      @refresh="emit('refresh')"
    >
      <template #left>
        <div class="board-title">
          <span class="title-text"
            >产品日销售统计 <TableHeaderTip label="" :tip="titleTip" class="title-tip"
          /></span>
          <ElIcon
            class="board-toggle"
            :class="{ 'is-collapsed': !tableExpanded }"
            @click="tableExpanded = !tableExpanded"
          >
            <ArrowUp />
          </ElIcon>
          <span class="stat-date">统计日期：{{ statDateText }}</span>
          <ElTooltip
            placement="bottom"
            content="综合 SC + VC 数据，按下单日期聚合；分时统计：2026/05/25 之前为美东时间，之后为美西时间；取消订单不计入。"
          >
            <span class="stat-tip">
              <ElIcon><InfoFilled /></ElIcon>
              数据点：下单日期·类目维度·取消订单不计入
            </span>
          </ElTooltip>
        </div>
      </template>
      <template #right>
        <div class="board-right-tools">
          <ElCheckbox v-model="showGrowth" label="显示涨幅" />
          <ElRadioGroup v-model="periodType" size="small">
            <ElRadioButton value="day">日</ElRadioButton>
            <ElRadioButton value="week">周</ElRadioButton>
            <ElRadioButton value="month">月</ElRadioButton>
          </ElRadioGroup>
        </div>
      </template>
    </ArtTableHeaderGroup>

    <!-- 分组表格 -->
    <ArtTableGroup
      v-show="tableExpanded"
      :data="data"
      :columns="columns"
      :column-checks="columnChecks"
      :groups="columnGroups"
      :loading="loading"
      :border="true"
      row-key="id"
      :autoHeight="true"
      :tableName="tableName"
      class="asin-table"
      :height="310"
    >
      <template #metric="{ row, prop }">
        <div class="metric-cell">
          <span class="metric-value">{{ formatVal(row, prop) }}</span>
          <span
            v-if="
              showGrowth &&
              row.id !== TOTAL_ID &&
              row._growth &&
              row._growth[prop] != null &&
              row._growth[prop] != 0
            "
            class="metric-growth"
            :class="row._growth[prop] > 0 ? 'up' : 'down'"
          >
            {{ row._growth[prop] > 0 ? '↑' : '↓' }}{{ formatGrowth(row._growth[prop]) }}
          </span>
        </div>
      </template>
    </ArtTableGroup>
  </ElCard>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { InfoFilled, ArrowUp } from '@element-plus/icons-vue'
  import type { ColumnOption } from '@/types/component'
  import { useTableColumns } from '@/composables/useTableColumns'
  import ArtTableHeaderGroup from '@/components/core/tables/art-table-header-group/index.vue'
  import ArtTableGroup from '@/components/core/tables/art-table-group/index.vue'
  import TableHeaderTip from '@/components/core/tables/table-header-tip/index.vue'
  import type { AsinBoardType } from '@/api/sale/asin'
  import { mul, divide } from '@/utils/common-util'

  defineOptions({ name: 'DailyBoardTable' })

  const TOTAL_ID = '__total__'

  const props = defineProps<{
    /** 看板类型：综合 asin / SC scasin / VC vcasin */
    boardType: AsinBoardType
    /** 表格数据（含合计行） */
    data: Record<string, any>[]
    /** 加载中 */
    loading?: boolean
    /** 统计日期文案 */
    statDateText?: string
    /** 单元格格式化函数（由父组件提供，复用统一口径） */
    formatVal: (row: Record<string, any>, prop: string) => string
    /** 导出接口（异步导出，返回任务ID） */
    exportApi?: (params: any) => Promise<any>
    /** 导出参数（函数返回当前查询条件，与表格查询一致） */
    exportParams?: () => Record<string, any>
  }>()

  const emit = defineEmits<{ (e: 'refresh'): void }>()

  /** 涨幅展示：带小数的四舍五入保留2位，整数保持整数（先去浮点误差尾数） */
  const formatGrowth = (v: number): string => {
    const raw = Math.abs(parseFloat(Number(v).toPrecision(12)))
    // 严格四舍五入到2位：decimal.js 运算精确，先 ×100 取整再 ÷100
    const n = Number(divide(Math.round(Number(mul(raw, 100))), 100))
    return Number.isInteger(n) ? String(n) : n.toFixed(2)
  }

  /** 显示涨幅（父子双向绑定，父组件据此重新请求带涨幅数据） */
  const showGrowth = defineModel<boolean>('showGrowth', { default: false })
  /** 周期：日/周/月（父子双向绑定，影响搜索栏与日期表头文案） */
  const periodType = defineModel<'day' | 'week' | 'month'>('periodType', { default: 'day' })
  /** 表格展开/收起 */
  const tableExpanded = defineModel<boolean>('tableExpanded', { default: true })

  /** 每个看板独立的持久化 key（与综合/SC/VC 互不影响） */
  const tableName = `sale-asin-board-${props.boardType}`

  /** 标题「产品日销售统计」气泡：各看板口径说明不同 */
  const titleTipMap: Record<AsinBoardType, string> = {
    asin: '综合 SC + VC 数据，按下单日期聚合；分时统计：2026/05/25 之前为美东时间，之后为美西时间；取消订单不计入。',
    scasin:
      '数据源 Seller Central / FBA，换货并入下单当日 1 单；分时统计：2026/05/25 之前为美东时间，之后为美西时间。',
    vcasin:
      '数据来自 Vendor Central 接口，单价/销售额按 PO销售单和DF单统计；分时统计：2026/05/25 之前为美东时间，之后为美西时间。'
  }
  const titleTip = computed(() => titleTipMap[props.boardType] || '')

  /** 分组定义（6 组，三看板通用；列通过 group 字段归属） */
  const columnGroups = [
    { key: 'sales', title: '销量', color: '#5b8ff9' },
    { key: 'ad', title: '广告表现', color: '#f56c6c' },
    { key: 'biz', title: '业务表现', color: '#52c41a' },
    { key: 'order', title: '订单量', color: '#9254de' },
    { key: 'amount', title: '销售额', color: '#fa8c16' },
    { key: 'return', title: '退货情况', color: '#13c2c2' }
  ]

  /** 日期表头文案：随周期变化（日→日期 / 周→周 / 月→月） */
  const periodLabelMap = { day: '日期', week: '周', month: '月' } as const
  const dateColumnLabel = computed(() => periodLabelMap[periodType.value])

  /** 指标列工厂：统一用 #metric 插槽渲染（数值 + 可选涨幅） */
  const metricCol = (prop: string, label: string, group: string, checked = true): ColumnOption => ({
    prop,
    label,
    group,
    minWidth: 130,
    align: 'left',
    checked,
    useSlot: true,
    slotName: 'metric'
  })

  /**
   * 各看板表头气泡文案（prop -> 文案）。同一字段在不同看板口径不同，故按看板分别维护。
   * 仅维护需要说明的列；未列入的列不显示气泡（图片中没有的不加）。
   */
  const asinHeaderTips: Record<string, string> = {
    offsiteSales: 'SC站外销量，指促销id包含Percentage Off的SC订单带来的销量',
    adSalesRatio: '广告销量/总销量',
    naturalSalesRatio: '自然销量/总销量',
    adOrdersRatio: '广告订单量/总订单量（=SC订单量+VC销量）',
    orderAdRatio: '广告订单量/总订单量（=SC订单量+VC销量）',
    adCvr: '（SC+VC广告订单量）÷（SC+VC点击量）',
    adCost: 'SP广告 campaign 的累计花费',
    cpo: '广告花费÷订单量（=SC订单量+VC销量）',
    pageViews: 'SC浏览量page_views+VC浏览量glance_views',
    totalOrders: 'SC订单量+VC订单量（VC订单量取VC销量）'
  }
  const scasinHeaderTips: Record<string, string> = {
    offsiteSales: '指促销id包含Percentage Off的SC订单带来的销量',
    naturalSales: '总销量-广告销量-站外销量',
    ownSkuSales: '取30天同SKU点击归因销量（件）字段',
    otherSkuSales: '取7天其他SKU销量(件)字段',
    sessions: '商品详情页 Sessions数'
  }
  const vcasinHeaderTips: Record<string, string> = {
    cpo: '广告花费÷订单量（VC订单量取VC销量）'
  }

  /** 按 prop 给列注入对应看板的表头气泡（命中才加） */
  const withTips = (cols: ColumnOption[], tips: Record<string, string>): ColumnOption[] =>
    cols.map((c) => (c.prop && tips[c.prop] ? { ...c, headerTip: tips[c.prop] } : c))

  /** 综合看板（asin）：含 SC/VC 拆分 */
  const asinColumns = (dateLabel: string): ColumnOption[] => [
    { prop: 'date', label: dateLabel, width: 120, minWidth: 120, align: 'center', fixed: 'left' },
    // 销量
    metricCol('totalSales', '总销量', 'sales'),
    metricCol('naturalSales', '自然销量', 'sales'),
    metricCol('adSales', '广告销量', 'sales'),
    metricCol('offsiteSales', '站外销量', 'sales'),
    metricCol('scTotalSales', 'SC总销量', 'sales', false),
    metricCol('scAdSales', 'SC广告销量', 'sales', false),
    metricCol('scNaturalSales', 'SC自然销量', 'sales', false),
    metricCol('vcTotalSales', 'VC总销量', 'sales', false),
    metricCol('vcAdSales', 'VC广告销量', 'sales', false),
    metricCol('vcNaturalSales', 'VC自然销量', 'sales', false),
    metricCol('adSalesRatio', '广告销量占比', 'sales'),
    metricCol('naturalSalesRatio', '自然销量占比', 'sales', false),
    // 广告表现
    metricCol('adOrders', '广告订单', 'ad'),
    metricCol('adOrdersRatio', '广告订单占比', 'ad'),
    metricCol('adCost', '广告花费', 'ad'),
    metricCol('adCostRatio', '广告花费占比', 'ad', false),
    metricCol('cpo', 'CPO', 'ad'),
    metricCol('cpa', 'CPA', 'ad'),
    metricCol('cpc', 'CPC', 'ad'),
    metricCol('acos', 'ACOS', 'ad', false),
    metricCol('adCvr', '广告转化率', 'ad'),
    metricCol('scAdCvr', 'SC广告转化率', 'ad', false),
    metricCol('vcAdCvr', 'VC广告转化率', 'ad', false),
    metricCol('impressions', '曝光量', 'ad', false),
    metricCol('clicks', '点击量', 'ad', false),
    metricCol('ctr', 'CTR', 'ad'),
    // 业务表现
    metricCol('pageViews', '浏览量', 'biz'),
    // 订单量
    metricCol('totalOrders', '总订单', 'order'),
    metricCol('adOrderCount', '广告订单', 'order'),
    metricCol('naturalOrders', '自然订单', 'order'),
    metricCol('orderAdRatio', '广告订单占比', 'order'),
    metricCol('naturalOrderRatio', '自然订单占比', 'order', false),
    metricCol('scTotalOrders', 'SC总订单', 'order', false),
    metricCol('scAdOrders', 'SC广告订单', 'order', false),
    metricCol('scNaturalOrders', 'SC自然订单', 'order', false),
    metricCol('scAdOrderRatio', 'SC广告订单占比', 'order', false),
    metricCol('scNaturalOrderRatio', 'SC自然订单占比', 'order', false),
    metricCol('vcTotalOrders', 'VC总订单', 'order', false),
    metricCol('vcAdOrders', 'VC广告订单', 'order', false),
    metricCol('vcNaturalOrders', 'VC自然订单', 'order', false),
    metricCol('vcAdOrderRatio', 'VC广告订单占比', 'order', false),
    metricCol('vcNaturalOrderRatio', 'VC自然订单占比', 'order', false),
    // 销售额（默认全不勾选）
    metricCol('totalAmount', '总销售额', 'amount', false),
    metricCol('adAmount', '总广告销售额', 'amount', false),
    metricCol('scTotalAmount', 'SC总销售额', 'amount', false),
    metricCol('scAdAmount', 'SC广告销售额', 'amount', false),
    metricCol('vcTotalAmount', 'VC总销售额', 'amount', false),
    metricCol('vcAdAmount', 'VC广告销售额', 'amount', false),
    // 退货情况
    metricCol('returnQty', '退货量', 'return', false),
    metricCol('returnRate', '退货率', 'return')
  ]

  /** SCASIN 看板（scasin）：含 本SKU/其他SKU 销量 */
  const scasinColumns = (dateLabel: string): ColumnOption[] => [
    { prop: 'date', label: dateLabel, width: 120, minWidth: 120, align: 'center', fixed: 'left' },
    // 销量
    metricCol('totalSales', '总销量', 'sales'),
    metricCol('naturalSales', '自然销量', 'sales'),
    metricCol('adSales', '广告销量', 'sales'),
    metricCol('offsiteSales', '站外销量', 'sales', false),
    metricCol('adSalesRatio', '广告销量占比', 'sales', false),
    metricCol('naturalSalesRatio', '自然销量占比', 'sales', false),
    // 广告表现
    metricCol('adOrders', '广告订单', 'ad'),
    metricCol('adOrdersRatio', '广告订单占比', 'ad'),
    metricCol('adCost', '广告花费', 'ad'),
    metricCol('adCostRatio', '广告花费占比', 'ad', false),
    metricCol('cpo', 'CPO', 'ad'),
    metricCol('cpa', 'CPA', 'ad'),
    metricCol('cpc', 'CPC', 'ad'),
    metricCol('adCvr', '广告转化率', 'ad'),
    metricCol('acos', 'ACOS', 'ad', false),
    metricCol('impressions', '曝光量', 'ad', false),
    metricCol('clicks', '点击量', 'ad', false),
    metricCol('ctr', 'CTR', 'ad'),
    metricCol('ownSkuSales', '本SKU销量', 'ad', false),
    metricCol('otherSkuSales', '其他SKU销量', 'ad', false),
    // 业务表现
    metricCol('sessions', '访问量', 'biz'),
    metricCol('pageViews', '浏览量', 'biz', false),
    metricCol('cvr', '转化率', 'biz'),
    // 订单量
    metricCol('totalOrders', '总订单', 'order'),
    metricCol('naturalOrders', '自然订单', 'order'),
    metricCol('adOrderCount', '广告订单', 'order'),
    metricCol('naturalOrderRatio', '自然订单占比', 'order', false),
    metricCol('orderAdRatio', '广告订单占比', 'order'),
    // 销售额（默认全不勾选）
    metricCol('totalAmount', '销售额', 'amount', false),
    metricCol('adAmount', '广告销售额', 'amount', false),
    metricCol('naturalAmount', '自然销售额', 'amount', false),
    // 退货情况
    metricCol('returnQty', '退货量', 'return', false),
    metricCol('returnRate', '退货率', 'return')
  ]

  /** VCASIN 看板（vcasin）：纯 VC，无 SC/VC 拆分 */
  const vcasinColumns = (dateLabel: string): ColumnOption[] => [
    { prop: 'date', label: dateLabel, width: 120, minWidth: 120, align: 'center', fixed: 'left' },
    // 销量
    metricCol('totalSales', '总销量', 'sales'),
    metricCol('naturalSales', '自然销量', 'sales'),
    metricCol('adSales', '广告销量', 'sales'),
    metricCol('offsiteSales', '站外销量', 'sales', false),
    metricCol('naturalSalesRatio', '自然销量占比', 'sales', false),
    metricCol('adSalesRatio', '广告销量占比', 'sales', false),
    // 广告表现
    metricCol('adOrders', '广告订单', 'ad'),
    metricCol('adOrdersRatio', '广告订单占比', 'ad'),
    metricCol('adCost', '广告花费', 'ad'),
    metricCol('adCostRatio', '广告花费占比', 'ad', false),
    metricCol('cpo', 'CPO', 'ad'),
    metricCol('cpa', 'CPA', 'ad'),
    metricCol('cpc', 'CPC', 'ad'),
    metricCol('adCvr', '广告转化率', 'ad'),
    metricCol('acos', 'ACOS', 'ad', false),
    metricCol('impressions', '曝光量', 'ad', false),
    metricCol('clicks', '点击量', 'ad', false),
    metricCol('ctr', 'CTR', 'ad'),
    // 业务表现
    metricCol('pageViews', '浏览量', 'biz'),
    // 订单量
    metricCol('totalOrders', '总订单', 'order'),
    metricCol('naturalOrders', '自然订单', 'order'),
    metricCol('adOrderCount', '广告订单', 'order'),
    metricCol('naturalOrderRatio', '自然订单占比', 'order', false),
    metricCol('orderAdRatio', '广告订单占比', 'order', false),
    // 销售额（默认全不勾选）
    metricCol('totalAmount', '销售额', 'amount', false),
    metricCol('adAmount', '广告销售额', 'amount', false),
    metricCol('naturalAmount', '自然销售额', 'amount', false),
    // 退货情况
    metricCol('returnQty', '退货量', 'return', false),
    metricCol('returnRate', '退货率', 'return')
  ]

  /** 按看板类型选用对应列定义，并注入该看板的表头气泡 */
  const buildColumns = (dateLabel: string): ColumnOption[] => {
    if (props.boardType === 'scasin') return withTips(scasinColumns(dateLabel), scasinHeaderTips)
    if (props.boardType === 'vcasin') return withTips(vcasinColumns(dateLabel), vcasinHeaderTips)
    return withTips(asinColumns(dateLabel), asinHeaderTips)
  }

  const { columns, columnChecks } = useTableColumns(
    () => buildColumns(dateColumnLabel.value),
    tableName
  )

  /**
   * 列 prop -> 后端导出指标 code（SalesAdMetric）。
   * 综合看板 SC/VC 拆分列用 sc_/vc_ 前缀，与后端 SalesAdAsinDailyExportHandler 约定一致。
   * 仅维护有后端口径的指标列；date 等无 code 的列不导出。
   */
  const EXPORT_CODE_MAP: Record<string, string> = {
    // 销量
    totalSales: 'sales',
    naturalSales: 'naturalSales',
    adSales: 'adSales',
    offsiteSales: 'offSiteSales',
    scTotalSales: 'sc_sales',
    scAdSales: 'sc_adSales',
    scNaturalSales: 'sc_naturalSales',
    vcTotalSales: 'vc_sales',
    vcAdSales: 'vc_adSales',
    vcNaturalSales: 'vc_naturalSales',
    adSalesRatio: 'adSalesRatio',
    naturalSalesRatio: 'naturalSalesRatio',
    // 广告表现
    adOrders: 'adOrder',
    adOrdersRatio: 'adOrderRatio',
    adCost: 'adCost',
    adCostRatio: 'adCostRatio',
    cpo: 'cpo',
    cpa: 'cpa',
    cpc: 'cpc',
    acos: 'acos',
    adCvr: 'adConversionRate',
    scAdCvr: 'sc_adConversionRate',
    vcAdCvr: 'vc_adConversionRate',
    impressions: 'adImpressions',
    clicks: 'adClicks',
    ctr: 'ctr',
    ownSkuSales: 'adSalesSameSku',
    otherSkuSales: 'adSalesOtherSku',
    // 业务表现
    sessions: 'sessions',
    pageViews: 'pageViews',
    cvr: 'conversionRate',
    // 订单量
    totalOrders: 'order',
    adOrderCount: 'adOrder',
    naturalOrders: 'naturalOrder',
    orderAdRatio: 'adOrderRatio',
    naturalOrderRatio: 'naturalOrderRatio',
    scTotalOrders: 'sc_order',
    scAdOrders: 'sc_adOrder',
    scNaturalOrders: 'sc_naturalOrder',
    scAdOrderRatio: 'sc_adOrderRatio',
    scNaturalOrderRatio: 'sc_naturalOrderRatio',
    vcTotalOrders: 'vc_order',
    vcAdOrders: 'vc_adOrder',
    vcNaturalOrders: 'vc_naturalOrder',
    vcAdOrderRatio: 'vc_adOrderRatio',
    vcNaturalOrderRatio: 'vc_naturalOrderRatio',
    // 销售额
    totalAmount: 'revenue',
    adAmount: 'adRevenue',
    naturalAmount: 'naturalRevenue',
    scTotalAmount: 'sc_revenue',
    scAdAmount: 'sc_adRevenue',
    vcTotalAmount: 'vc_revenue',
    vcAdAmount: 'vc_adRevenue',
    // 退货情况
    returnQty: 'return',
    returnRate: 'returnRate'
  }

  /** 导出参数：在父级查询条件基础上附加「当前可见列」对应的后端指标 code（按显示顺序，含 SC/VC 拆分） */
  const mergedExportParams = () => {
    const base = props.exportParams ? props.exportParams() : {}
    const columnCodes = (columns.value as ColumnOption[])
      .map((c) => EXPORT_CODE_MAP[(c.prop as string) ?? ''])
      .filter((code): code is string => !!code)
    return { ...base, columns: columnCodes }
  }
</script>

<style lang="scss" scoped>
  .asin-table-card {
    flex-shrink: 0;

    :deep(.el-card__body) {
      padding: 12px 16px;
    }
  }

  .board-title {
    display: flex;
    gap: 12px;
    align-items: center;

    .title-text {
      font-size: 15px;
      font-weight: 600;
      color: var(--art-gray-900);
    }

    .board-toggle {
      margin-left: -6px;
      font-size: 16px;
      color: var(--art-gray-600);
      cursor: pointer;
      transition: transform 0.2s;

      &:hover {
        color: var(--el-color-primary);
      }

      // 收起时箭头由朝上旋转为朝下
      &.is-collapsed {
        transform: rotate(180deg);
      }
    }

    .stat-date {
      font-size: 12px;
      color: var(--art-gray-600);
    }

    .stat-tip {
      display: inline-flex;
      gap: 6px;
      align-items: center;
      height: 24px;
      min-height: 24px;
      padding: 0 8px;
      font-size: 12px;
      font-weight: 600;
      color: #1d4ed8;
      white-space: nowrap;
      cursor: pointer;
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      border-radius: 4px !important;
      outline: 0;
    }
  }

  .board-right-tools {
    display: flex;
    gap: 12px;
    align-items: center;
    margin-right: 8px;
  }

  .metric-cell {
    display: flex;
    flex-direction: row;
    gap: 6px;
    align-items: center;
    line-height: 1.3;

    .metric-growth {
      font-size: 11px;

      &.up {
        color: var(--el-color-danger);
      }

      &.down {
        color: var(--el-color-success);
      }
    }
  }
</style>
