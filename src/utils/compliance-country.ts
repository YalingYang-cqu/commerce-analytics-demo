/**
 * 合规认证「国家」字段：界面多选为 string[]，接口通常为单个字符串（逗号分隔或 JSON 数组字符串）。
 */

/** 将接口/旧数据中的 country 规范为选中国家编码/value 数组 */
export function normalizeComplianceCountryToCodes(raw: unknown): string[] {
  if (raw == null || raw === '') return []
  if (Array.isArray(raw)) {
    return raw.map((x) => String(x).trim()).filter(Boolean)
  }
  if (typeof raw === 'string') {
    const s = raw.trim()
    if (!s) return []
    if (s.startsWith('[')) {
      try {
        const parsed = JSON.parse(s)
        if (Array.isArray(parsed)) {
          return parsed.map((x) => String(x).trim()).filter(Boolean)
        }
      } catch {
        /* 按普通字符串处理 */
      }
    }
    return s
      .split(/[,，;；]/)
      .map((x) => x.trim())
      .filter(Boolean)
  }
  return [String(raw).trim()].filter(Boolean)
}

/** 提交接口：将多选数组序列化为后端期望的字符串（逗号分隔） */
export function serializeComplianceCountryForApi(raw: unknown): string {
  return normalizeComplianceCountryToCodes(raw).join(',')
}
