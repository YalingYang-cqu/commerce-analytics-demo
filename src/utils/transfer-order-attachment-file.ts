/**
 * 调拨单附件：后端仅使用 fileName 存「展示文件名-完整文件 URL」
 *（以 `http://` 或 `https://` 作为 URL 起点解析，避免文件名中含 `-` 歧义）
 */

export function encodeTransferOrderAttachmentStoredFileName(
  displayFileName: string,
  fileUrl: string
): string {
  const name = (displayFileName ?? '').trim()
  const url = (fileUrl ?? '').trim()
  if (!url) return name
  return `${name}-${url}`
}

export function parseTransferOrderAttachmentStoredFileName(stored: string): {
  displayName: string
  fileUrl: string
} {
  const s = stored ?? ''
  const idx = s.search(/https?:\/\//i)
  if (idx === -1) {
    return { displayName: s.trim(), fileUrl: '' }
  }
  const fileUrl = s.slice(idx).trim()
  let displayName = s.slice(0, idx).replace(/-+$/, '').trim()
  if (!displayName) {
    try {
      const path = new URL(fileUrl).pathname
      const base = path.split('/').filter(Boolean).pop() || ''
      displayName = decodeURIComponent(base) || '附件'
    } catch {
      displayName = '附件'
    }
  }
  return { displayName, fileUrl }
}
