import type { AsinBoardType } from '@/api/sale/asin'
import type { SalesChannel } from '@/api/sale/sales-statistics'

/** ASIN 看板顶部 Tab（与 asin/index.vue 展示一致） */
export const ASIN_BOARD_TABS = [
  { label: 'ASIN综合看板', value: 'all', boardType: 'asin' as AsinBoardType },
  { label: 'SCASIN看板', value: 'sc', boardType: 'scasin' as AsinBoardType },
  { label: 'VCASIN看板', value: 'vc', boardType: 'vcasin' as AsinBoardType }
] as const

export const CHANNEL_TO_BOARD_TYPE: Record<SalesChannel, AsinBoardType> = {
  combined: 'asin',
  sc: 'scasin',
  vc: 'vcasin'
}

export const BOARD_TYPE_TO_TAB: Record<AsinBoardType, string> = {
  asin: 'all',
  scasin: 'sc',
  vcasin: 'vc'
}

export function boardLabelByChannel(channel: SalesChannel): string {
  const boardType = CHANNEL_TO_BOARD_TYPE[channel]
  return ASIN_BOARD_TABS.find((tab) => tab.boardType === boardType)?.label ?? 'ASIN综合看板'
}
