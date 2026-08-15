/** 通用筛选入参（对应后端 OrderProfitBaseFilterDto） */
export interface OrderProfitBaseFilter {
  dateStart?: string
  dateEnd?: string
  site?: string[]
  shopIds?: number[]
  brandIds?: number[]
  categoryIds?: number[]
  spuIds?: number[]
  /** SPU 编码列表（下拉筛选按 spuCode） */
  spuCodes?: string[]
  ownerIds?: number[]
  productStatus?: number[]
  fulfillmentChannel?: string
  /** all / excludeOffsiteAndReplacement / offsiteOnly */
  orderSource?: string
  currency?: string
  /**
   * 时间口径：order=下单日 dt（默认）；settlement=结算日 settle_time。
   * 仅订单 Tab 会传 settlement；其它维度恒为 order。
   */
  dateType?: string
  /** 复合搜索类型：asin/pasin/msku/spu/name/orderNo */
  searchType?: string
  /** 复合搜索内容（配合 searchType） */
  keyword?: string
  /** all / unsettled / settled（订单 Tab） */
  settleStatus?: string
  orderStatus?: string
  /** 指标卡点击联动 unshipped/loss/offsite（订单 Tab） */
  metricCardFilter?: string
  /** all/loss/low/risk/normal/high；risk=亏损或低毛利 */
  profitStatus?: string
}
