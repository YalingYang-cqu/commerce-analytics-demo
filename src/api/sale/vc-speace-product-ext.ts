import request from '@/utils/http'

const BASE = '/basic/vc-speace/product-ext'

export type VcSpeaceLabelItem = {
  fileName?: string
  fileUrl?: string
  labelType?: string
  operatorId?: number
  operatorName?: string
  remark?: string
  uploadTime?: string
}

/** 查询标签列表 GET ?asin=&msku= */
export function fetchVcSpeaceLabels(params: { asin: string; msku?: string }) {
  return request.get({
    url: `${BASE}/labels`,
    params
  })
}

/** 删除标签 DELETE ?asin=&index=&msku= */
export function deleteVcSpeaceLabel(params: { asin: string; index: number; msku?: string }) {
  return request.del({
    url: `${BASE}/labels/delete`,
    params
  })
}

export type EditVcSpeaceLabelBody = {
  asin?: string
  fileName?: string
  fileUrl?: string
  index?: number
  labelType?: string
  msku?: string
  remark?: string
}

/** 编辑标签 */
export function editVcSpeaceLabel(data: EditVcSpeaceLabelBody) {
  return request.put({
    url: `${BASE}/labels/edit`,
    data
  })
}

export type UploadVcSpeaceLabelBody = {
  asin?: string
  fileName?: string
  fileUrl?: string
  labelType?: string
  msku?: string
  remark?: string
}

/** 上传标签 */
export function uploadVcSpeaceLabel(data: UploadVcSpeaceLabelBody) {
  return request.post({
    url: `${BASE}/labels/upload`,
    data
  })
}

/** 设置是否贴防伪标 */
export function setVcSpeaceAntiCounterfeitLabel(data: {
  antiCounterfeitLabel?: number
  asin?: string
  msku?: string
}) {
  return request.put({
    url: `${BASE}/setAntiCounterfeitLabel`,
    data
  })
}

/** 设置 UPC 码 */
export function setVcSpeaceUpcCode(data: { asin?: string; msku?: string; upcCode?: string }) {
  return request.put({
    url: `${BASE}/setUpcCode`,
    data
  })
}
