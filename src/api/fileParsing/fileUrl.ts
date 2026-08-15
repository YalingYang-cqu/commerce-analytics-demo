/*
 * Portfolio demo
 * @Date: 2025-12-16 10:52:23
 * Company-specific metadata removed
 * @LastEditTime: 2026-01-26 10:58:16
 * @FilePath: src/api/fileParsing/fileUrl.ts
 * @Description: OnlyOffice 文件服务器配置
 */
import axios from 'axios'

const env = import.meta.env
const isProduction = env.MODE === 'production'
// Vite 项目使用 VITE_ 前缀的环境变量
// 清理环境变量值，去除可能的注释和空白字符
const cleanEnvValue = (value: string | undefined): string | undefined => {
  if (!value) return value
  // 去除首尾空白
  let cleaned = value.trim()
  // 如果值以 http:// 或 https:// 开头，说明是 URL
  // 需要区分 URL 中的 // 和注释的 //
  if (cleaned.startsWith('http://') || cleaned.startsWith('https://')) {
    // 使用正则表达式匹配完整的 URL，直到遇到空格和注释
    // 匹配模式：http://或https://开头，后面跟任意非空白字符，直到遇到空格+//或行尾
    const urlMatch = cleaned.match(/^(https?:\/\/[^\s]+)/)
    if (urlMatch && urlMatch[1]) {
      cleaned = urlMatch[1].trim()
    } else {
      // 如果没有匹配到完整URL，尝试查找第一个空格
      const spaceIndex = cleaned.indexOf(' ')
      if (spaceIndex !== -1) {
        cleaned = cleaned.substring(0, spaceIndex).trim()
      }
    }
  } else {
    // 如果不是 URL，使用原来的逻辑
    const commentIndex = cleaned.indexOf('//')
    if (commentIndex !== -1) {
      cleaned = cleaned.substring(0, commentIndex).trim()
    }
  }

  // 验证清理后的值是否是有效的 URL
  if (cleaned && (cleaned.startsWith('http://') || cleaned.startsWith('https://'))) {
    // 确保 URL 完整（至少包含协议和主机）
    if (cleaned.length <= 7 || cleaned === 'http://' || cleaned === 'https://') {
      console.warn('[OnlyOffice baseUrl] 清理后的 URL 不完整:', cleaned, '原始值:', value)
      return undefined
    }
  }

  return cleaned || undefined
}

const rawOfficeServer = env.VITE_OFFICE_SERVER || env.VUE_APP_OFFICE_SERVER
const cleanedOfficeServer = cleanEnvValue(rawOfficeServer)

// 调试日志
console.log('[OnlyOffice baseUrl] 原始环境变量值:', rawOfficeServer)
console.log('[OnlyOffice baseUrl] 清理后的值:', cleanedOfficeServer)

export const baseUrl = isProduction
  ? '/office'
  : cleanedOfficeServer || '/office'

console.log('[OnlyOffice baseUrl] 最终使用的 baseUrl:', baseUrl)

export async function urlToFile(url: string, fileName: string) {
  let finalUrl: string
  // 已是完整 URL 时直接使用，避免开发环境下被错误改成相对路径后请求到前端导致拿到 index.html
  if (url.startsWith('http://') || url.startsWith('https://')) {
    finalUrl = url
    console.log(11)
  } else if (url.startsWith('/') && !isProduction && baseUrl) {
    // 开发环境：OnlyOffice 可能返回相对路径如 /cache/xxx，必须拼成文档服务完整 URL 再请求，
    // 否则 axios.get('/cache/xxx') 会请求到当前前端 origin，返回 SPA 的 index.html
    const origin = baseUrl.replace(/\/office\/?$/, '').replace(/\/$/, '')
    finalUrl = origin + url
    console.log(22)
  } else {
    finalUrl = url
  }
  console.log('urlToFile - 原始URL:', url)
  console.log('urlToFile - 最终URL:', finalUrl)
  try {
    const response = await axios.get(finalUrl, { responseType: 'blob' })
    const blob: Blob = response.data
    const file: File = new File([blob], fileName, { type: blob.type })
    return file
  } catch (error: any) {
    console.error('urlToFile - 下载文件失败:', error)
    throw new Error(`下载文件失败: ${error?.message || '未知错误'}`)
  }
}
