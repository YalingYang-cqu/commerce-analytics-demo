/**
 * 调拨单详情 — 附件管理（业务端）
 * 路径相对供应商 OpenAPI：`/wms/clb-sys-openapi/transfer-order/*` → `/wms/transfer-orders/*`
 *
 * 后端仅 `fileName` 存文件信息，格式：`展示文件名-完整URL`（URL 以 http(s):// 起始，见 parse 逻辑）。
 * 新增/编辑提交前由前端合并为上述格式；列表映射后页面用 `fileName` 展示名 + `fileUrl` 访问地址。
 */
import request from '@/utils/http'
import { ossUpload } from '@/utils/ali-oss'
import {
  encodeTransferOrderAttachmentStoredFileName,
  parseTransferOrderAttachmentStoredFileName
} from '@/utils/transfer-order-attachment-file'

const BASE_PATH = '/wms/transfer-orders'

export const TRANSFER_ORDER_ATTACHMENT_MAX_SIZE = 200 * 1024 * 1024
export const TRANSFER_ORDER_ATTACHMENT_ACCEPT =
  '.docx,.doc,.pdf,.txt,.xlsx,.xls,.csv,.ppt,.pptx,.jpg,.jpeg,.png,.bmp,.gif,.zip,.rar,.7z,.ico,.svg'

export const TransferOrderManageAttachmentTypeEnum = {
  CUSTOMS: 'CUSTOMS_DOC',
  PICKUP_VOUCHER: 'PICKUP_PROOF',
  OTHER: 'OTHER'
} as const

export type TransferOrderManageAttachmentType =
  (typeof TransferOrderManageAttachmentTypeEnum)[keyof typeof TransferOrderManageAttachmentTypeEnum]

export const TransferOrderCollaborationPortEnum = {
  BIZ: 'BIZ',
  SUPPLIER: 'SUPPLIER',
  LOGISTICS: 'LOGISTICS'
} as const

export type TransferOrderCollaborationPort =
  (typeof TransferOrderCollaborationPortEnum)[keyof typeof TransferOrderCollaborationPortEnum]

export type TransferOrderAttachmentPushTarget = 'BIZ' | 'LOGISTICS'

export interface TransferOrderAttachmentRespVo {
  attachmentType?: string
  attachmentTypeName?: string
  editable?: boolean
  fileName?: string
  id: number
  message?: string
  operateEnd?: string
  operateEndName?: string
  receiveEnd?: string
  receiveEndName?: string
  status?: string
  statusName?: string
  submitTime?: string
  transferOrderId?: number
  waybillId?: number
  /** 兼容旧数据；正常仅 fileName 内嵌 URL */
  fileUrl?: string
}

export interface TransferOrderManageAttachment {
  id: number | string
  transferOrderId?: number | string
  attachmentType: string
  attachmentTypeName?: string
  /** 接口返回的原始 fileName（合并字段），用于兜底解析下载地址 */
  fileNameStored?: string
  fileName: string
  messageContent?: string
  uploadTime?: string
  operatorPort?: TransferOrderCollaborationPort | string
  receiverPort?: TransferOrderCollaborationPort | string
  operatorPortName?: string
  receiverPortName?: string
  fileUrl?: string
  editable?: boolean
  status?: string
  statusName?: string
  waybillId?: number | string
  canPush?: boolean
  canDelete?: boolean
}

export interface TransferOrderAttachmentEditReqVo {
  id: number
  attachmentType?: string
  fileName?: string
  message?: string
  operateEnd?: string
  receiveEnd?: string
  status?: string
  submitTime?: string
}

export interface TransferOrderAttachmentAddReqVo {
  attachmentType: string
  transferOrderId: number
  fileName?: string
  message?: string
  operateEnd?: string
  receiveEnd?: string
  status?: string
  /** 仅前端上传流程使用，请求体会合并进 fileName 后剔除 */
  fileUrl?: string
}

export interface TransferOrderAttachmentChangeStatusBatchReqVo {
  ids: Array<number | string>
  status: string
}

export const TransferOrderAttachmentStatusEnum = {
  CLB_UPLOAD: 'CLB_UPLOAD',
  CLB_COMMIT: 'CLB_COMMIT',
  BS_UPLOAD: 'BS_UPLOAD',
  BS_COMMIT: 'BS_COMMIT',
  CLB_W_UPLOAD: 'CLB_W_UPLOAD',
  CLB_W_COMMIT: 'CLB_W_COMMIT',
  DELETED: 'DELETED'
} as const

export type TransferOrderAttachmentStatusCode =
  (typeof TransferOrderAttachmentStatusEnum)[keyof typeof TransferOrderAttachmentStatusEnum]

export const TRANSFER_ORDER_ATTACHMENT_STATUS_LABELS: Record<string, string> = {
  [TransferOrderAttachmentStatusEnum.CLB_UPLOAD]: '物流商协同端已上传',
  [TransferOrderAttachmentStatusEnum.CLB_COMMIT]: '物流商协同端已提交',
  [TransferOrderAttachmentStatusEnum.BS_UPLOAD]: '业务端已上传',
  [TransferOrderAttachmentStatusEnum.BS_COMMIT]: '业务端已提交',
  [TransferOrderAttachmentStatusEnum.CLB_W_UPLOAD]: '供应商协同端已上传',
  [TransferOrderAttachmentStatusEnum.CLB_W_COMMIT]: '供应商协同端已提交',
  [TransferOrderAttachmentStatusEnum.DELETED]: '已删除'
}

export const TRANSFER_ORDER_ATTACHMENT_BATCH_STATUS_DELETE =
  TransferOrderAttachmentStatusEnum.DELETED

/** 业务端新增附件默认 status */
export const TRANSFER_ORDER_ATTACHMENT_ADD_DEFAULT_STATUS =
  TransferOrderAttachmentStatusEnum.BS_UPLOAD

export function transferOrderAttachmentPushTargetToCommitStatus(
  targetPort: 'CLB_COMMIT' | 'CLB_W_COMMIT'
): TransferOrderAttachmentStatusCode {
  return targetPort === 'CLB_COMMIT'
    ? TransferOrderAttachmentStatusEnum.CLB_COMMIT
    : TransferOrderAttachmentStatusEnum.CLB_W_COMMIT
}

export function isTransferOrderAttachmentPushCommittedStatus(status?: string): boolean {
  if (status == null || status === '') return false
  return (
    status === TransferOrderAttachmentStatusEnum.BS_COMMIT ||
    status === TransferOrderAttachmentStatusEnum.CLB_COMMIT ||
    status === TransferOrderAttachmentStatusEnum.CLB_W_COMMIT
  )
}

export function normalizeTransferOrderAttachmentEndCode(code?: string): string | undefined {
  if (code == null || code === '') return undefined
  return code === 'BUSINESS' ? 'BIZ' : code
}

/** 从行数据得到可访问的文件 URL（优先 fileUrl，否则从原始 fileName 字段解析） */
export function resolveTransferOrderManageAttachmentFileUrl(
  row: Pick<TransferOrderManageAttachment, 'fileUrl' | 'fileName' | 'fileNameStored'>
): string {
  const direct = (row.fileUrl ?? '').trim()
  if (direct) return direct
  const raw = (row.fileNameStored ?? '').trim() || (row.fileName ?? '').trim()
  return parseTransferOrderAttachmentStoredFileName(raw).fileUrl.trim()
}

export function mapTransferOrderAttachmentRespToRow(
  vo: TransferOrderAttachmentRespVo
): TransferOrderManageAttachment {
  const editable = vo.editable
  const rawName = vo.fileName ?? ''
  const parsed = parseTransferOrderAttachmentStoredFileName(rawName)
  const fileUrl = (parsed.fileUrl || vo.fileUrl || '').trim()
  return {
    id: vo.id,
    transferOrderId: vo.transferOrderId,
    attachmentType: vo.attachmentType ?? '',
    attachmentTypeName: vo.attachmentTypeName,
    fileNameStored: rawName,
    fileName: parsed.displayName || rawName,
    messageContent: vo.message,
    uploadTime: vo.submitTime,
    operatorPort: normalizeTransferOrderAttachmentEndCode(vo.operateEnd) ?? vo.operateEnd,
    receiverPort: normalizeTransferOrderAttachmentEndCode(vo.receiveEnd) ?? vo.receiveEnd,
    operatorPortName: vo.operateEndName,
    receiverPortName: vo.receiveEndName,
    fileUrl,
    editable,
    status: vo.status,
    statusName: vo.statusName,
    waybillId: vo.waybillId,
    canPush: editable === false ? false : undefined,
    canDelete: editable === false ? false : undefined
  }
}

export function buildTransferOrderAttachmentEditBody(
  row: TransferOrderManageAttachment,
  patch: Partial<TransferOrderAttachmentEditReqVo> = {}
): TransferOrderAttachmentEditReqVo {
  const displayName = patch.fileName !== undefined ? String(patch.fileName).trim() : row.fileName
  const url = resolveTransferOrderManageAttachmentFileUrl(row)
  const fileNameForApi =
    url !== '' ? encodeTransferOrderAttachmentStoredFileName(displayName, url) : displayName

  return {
    id: Number(row.id),
    attachmentType: patch.attachmentType ?? row.attachmentType,
    fileName: fileNameForApi,
    message: patch.message ?? row.messageContent,
    operateEnd:
      patch.operateEnd ?? (row.operatorPort != null ? String(row.operatorPort) : undefined),
    receiveEnd:
      patch.receiveEnd ?? (row.receiverPort != null ? String(row.receiverPort) : undefined),
    status: patch.status ?? row.status,
    submitTime: patch.submitTime ?? row.uploadTime
  }
}

function unwrapAttachmentListPayload(data: unknown): TransferOrderAttachmentRespVo[] {
  if (Array.isArray(data)) return data as TransferOrderAttachmentRespVo[]
  if (data && typeof data === 'object' && Array.isArray((data as { dtoList?: unknown }).dtoList)) {
    return (data as { dtoList: TransferOrderAttachmentRespVo[] }).dtoList
  }
  return []
}

export async function getTransferOrderAttachmentList(transferOrderId: number | string) {
  const res = await request.post<{
    code: number
    msg: string
    success?: boolean
    data: TransferOrderAttachmentRespVo[] | { dtoList?: TransferOrderAttachmentRespVo[] }
  }>({
    url: `${BASE_PATH}/attachment/list`,
    data: { id: Number(transferOrderId) }
  })
  const raw = unwrapAttachmentListPayload(res.data)
  return {
    ...res,
    data: raw.map(mapTransferOrderAttachmentRespToRow)
  }
}

export async function editTransferOrderAttachment(vo: TransferOrderAttachmentEditReqVo) {
  return request.post<{ code: number; msg: string; success?: boolean; data: boolean }>({
    url: `${BASE_PATH}/attachment/edit`,
    data: vo
  })
}

/**
 * 新增附件（元数据）
 * POST ${BASE_PATH}/attachment/add
 *
 * 注：后端 `data` 为新创建附件对象 TransferOrderAttachmentRespVo（含 id），
 * 「保存并推送」依赖 data.id 进行后续 changeStatusBatch。
 */
export async function addTransferOrderAttachment(vo: TransferOrderAttachmentAddReqVo) {
  const url = (vo.fileUrl ?? '').trim()
  const display = (vo.fileName ?? '').trim()
  const mergedName =
    url !== '' ? encodeTransferOrderAttachmentStoredFileName(display || '附件', url) : display
  const body = {
    attachmentType: vo.attachmentType,
    businessId: vo.transferOrderId,
    fileName: mergedName,
    message: vo.message,
    operateEnd: vo.operateEnd,
    receiveEnd: vo.receiveEnd,
    status: vo.status ?? TRANSFER_ORDER_ATTACHMENT_ADD_DEFAULT_STATUS
  }
  return request.post<{
    code: number
    msg: string
    success?: boolean
    data: TransferOrderAttachmentRespVo
  }>({
    url: `${BASE_PATH}/attachment/add`,
    data: body
  })
}

export async function changeTransferOrderAttachmentStatusBatch(
  vo: TransferOrderAttachmentChangeStatusBatchReqVo
) {
  return request.post<{ code: number; msg: string; success?: boolean; data: boolean }>({
    url: `${BASE_PATH}/attachment/changeStatusBatch`,
    data: vo
  })
}

/**
 * 上传附件：OSS 上传一次后，按所选接收端逐个调 attachment/add（接口 receiveEnd 为单值）
 *
 * @returns 顶层壳保持与单次 add 一致，同时附加：
 *   - `data.createdIds`：本次按接收端创建出来的所有附件 id（用于「保存并推送」）
 *   - `data.lastResp`：最后一次 add 的原始 data
 */
export async function uploadTransferOrderAttachment(params: {
  transferOrderId: number | string
  file: File
  attachmentType: TransferOrderManageAttachmentType | string
  messageContent?: string
  receiveEnds: string[]
  status?: string
  operateEnd?: string
}): Promise<{
  code: number
  msg: string
  success?: boolean
  data: {
    createdIds: number[]
    lastResp?: TransferOrderAttachmentRespVo
  }
}> {
  const ends = Array.isArray(params.receiveEnds)
    ? [...new Set(params.receiveEnds.filter((x) => x != null && String(x).trim() !== ''))]
    : []
  if (ends.length === 0) {
    throw new Error('请选择接收端')
  }
  const putResult = (await ossUpload(params.file.name, params.file, 'transferOrderAttachment')) as {
    url?: string
  }
  const fileUrl = putResult?.url
  if (!fileUrl) {
    throw new Error('文件上传失败，未返回地址')
  }
  const operateEnd = params.operateEnd ?? TransferOrderCollaborationPortEnum.BIZ
  const createdIds: number[] = []
  let lastRes: Awaited<ReturnType<typeof addTransferOrderAttachment>> | undefined
  for (const receiveEnd of ends) {
    lastRes = await addTransferOrderAttachment({
      transferOrderId: Number(params.transferOrderId),
      attachmentType: params.attachmentType,
      fileName: encodeTransferOrderAttachmentStoredFileName(params.file.name, fileUrl),
      message: params.messageContent,
      operateEnd,
      receiveEnd,
      status: params.status
    })
    const newId = lastRes?.data?.id
    if (newId != null) createdIds.push(Number(newId))
  }
  return {
    code: lastRes?.code ?? 200,
    msg: lastRes?.msg ?? 'success',
    success: lastRes?.success,
    data: { createdIds, lastResp: lastRes?.data }
  }
}

export async function deleteTransferOrderAttachment(id: number | string) {
  return changeTransferOrderAttachmentStatusBatch({
    ids: [id],
    status: TRANSFER_ORDER_ATTACHMENT_BATCH_STATUS_DELETE
  })
}

/** 撤回提交：业务端上传的记录回到 BS_UPLOAD，供应商端回到 CLB_W_UPLOAD */
export async function revokeTransferOrderAttachmentSubmitForRow(
  row: TransferOrderManageAttachment
) {
  const isBiz =
    row.operatorPort === TransferOrderCollaborationPortEnum.BIZ ||
    row.operatorPort === 'BUSINESS' ||
    row.operatorPort === 'BIZ'
  const status = isBiz
    ? TransferOrderAttachmentStatusEnum.BS_UPLOAD
    : TransferOrderAttachmentStatusEnum.CLB_W_UPLOAD
  return changeTransferOrderAttachmentStatusBatch({
    ids: [row.id],
    status
  })
}

/** 推送：业务端上传 → BS_COMMIT；供应商端来源 → CLB_W_COMMIT */
export async function pushTransferOrderAttachmentForRow(row: TransferOrderManageAttachment) {
  const isBiz =
    row.operatorPort === TransferOrderCollaborationPortEnum.BIZ ||
    row.operatorPort === 'BUSINESS' ||
    row.operatorPort === 'BIZ'
  const status = isBiz
    ? TransferOrderAttachmentStatusEnum.BS_COMMIT
    : transferOrderAttachmentPushTargetToCommitStatus('CLB_W_COMMIT')
  return changeTransferOrderAttachmentStatusBatch({
    ids: [row.id],
    status
  })
}
