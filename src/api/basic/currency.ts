import request from '@/utils/http'

/** 币种信息（与接口响应一致） */
export interface CurrencyItem {
  id?: number
  currencyCode?: string
  currencyName?: string
  symbol?: string
  countryRegion?: string
  remark?: string
}

/** 查询已启用的币种列表 */
export function getEnabledCurrencyList(): Promise<CurrencyItem[]> {
  return request
    .get<{ data?: CurrencyItem[] }>({
      url: '/basic/currency/listEnabled'
    })
    .then((res: any) => res?.data ?? [])
}
