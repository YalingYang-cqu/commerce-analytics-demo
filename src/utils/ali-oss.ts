import { getOssSts } from '@/api/system-manage'
import { fileLinkToStreamDownload } from '@/utils/common-util'

const env = import.meta.env
const { VITE_FLAG, VITE_OSS_BUCKETNAME, VITE_OSS_REGIONID } = env
const bucketName = VITE_OSS_BUCKETNAME || 'demo-assets'
const ossUrl = `https://${bucketName}.oss-cn-shenzhen.aliyuncs.com/`

/** 运行时获取 OSS 构造函数（由 CDN 注入到 window.OSS），避免模块加载时 CDN 未就绪导致 "is not a constructor" */
function getOSSConstructor(): new (opts: any) => any {
  if (typeof window === 'undefined') return null as any
  const OSSClass = (window as any).OSS
  if (!OSSClass || typeof OSSClass !== 'function') {
    throw new Error(
      'OSS SDK 未加载，请刷新页面后重试。若仍失败，请检查网络或联系管理员；线上环境建议将 aliyun-oss-sdk 部署到自有静态资源或使用可访问的 CDN。'
    )
  }
  return OSSClass
}

const ossUpload = function (filename: string, file: Blob, fileFolder = 'webImg', isUseDate = true) {
  console.log(VITE_FLAG)
  console.log(bucketName)
  return new Promise((resolve, reject) => {
    getOssSts()
      .then((res: any) => {
        const OSS = getOSSConstructor()
        const ossUtil = new OSS({
          region: VITE_OSS_REGIONID || 'oss-cn-shenzhen',
          // 阿里云主账号AccessKey拥有所有API的访问权限，风险很高。
          accessKeyId: res.data.credentials.accessKeyId,
          accessKeySecret: res.data.credentials.accessKeySecret,
          stsToken: res.data.credentials.securityToken,

          // secure: true,
          // endpoint: "oss-cn-shenzhen.aliyuncs.com",

          /* Bucket 名称由环境变量提供；本地 Demo 不执行真实上传。 */
          bucket: bucketName
        })

        console.log(bucketName)

        const datetime = new Date()
        const year: string = datetime.getFullYear() + ''
        const month =
          datetime.getMonth() + 1 < 10 ? '0' + (datetime.getMonth() + 1) : datetime.getMonth() + 1
        const date = datetime.getDate() < 10 ? '0' + datetime.getDate() : datetime.getDate()
        const day = year + month + date

        // 文件夹名称 + 文件
        /* ossUtil.multipartUpload */
        ossUtil
          .put(
            isUseDate ? `${fileFolder}/${day}/${filename}` : `${fileFolder}/${filename}`,
            file,
            {}
          )
          .then((res: any) => {
            console.log(res)
            resolve(res)
          })
          .catch((e: any) => reject(e))
      })
      .catch((e) => reject(e))
  })
}

/** STS 签名后走 Blob 下载，不再 window.open，避免弹新标签页 */
const ossDownLoad = async (ossfile: any, filename: string): Promise<void> => {
  const res: any = await getOssSts()
  const OSS = getOSSConstructor()
  const ossUtil = new OSS({
    region: VITE_OSS_REGIONID || 'oss-cn-shenzhen',
    accessKeyId: res.data.credentials.accessKeyId,
    accessKeySecret: res.data.credentials.accessKeySecret,
    stsToken: res.data.credentials.securityToken,
    bucket: bucketName
  })
  const response = {
    'content-disposition': `attachment; filename=${encodeURIComponent(filename)}`
  }
  const url = ossUtil.signatureUrl(ossfile, { response })
  try {
    await fileLinkToStreamDownload(url, filename)
  } catch {
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.style.display = 'none'
    document.body.appendChild(a)
    a.click()
    setTimeout(() => document.body.removeChild(a), 0)
  }
}

/**
 * 判断是否为阿里云 OSS 已带临时鉴权参数的 URL（后端直出签名链）。
 * 此类链接不应再经 getOssSignatureUrl 换签：去掉 query 后用前端 STS 签名易与真实 bucket 不一致，导致 403 / 预览失败。
 */
export function isOssUrlAlreadyPresigned(fileUrl: string): boolean {
  if (!fileUrl || typeof fileUrl !== 'string') return false
  try {
    const u = new URL(fileUrl)
    const host = u.hostname.toLowerCase()
    const isOssHost = host.includes('aliyuncs.com') || host.includes('oss-')
    if (!isOssHost) return false
    const q = u.search
    if (/[?&]Signature=/i.test(q) || /[?&]X-Oss-Signature=/i.test(q)) return true
    if (
      /[?&]Expires=/i.test(q) &&
      (/[?&]OSSAccessKeyId=/i.test(q) || /[?&]X-Oss-Credential=/i.test(q))
    ) {
      return true
    }
    return false
  } catch {
    return (
      /aliyuncs\.com/i.test(fileUrl) &&
      (/Signature=/i.test(fileUrl) ||
        (/Expires=/i.test(fileUrl) && /OSSAccessKeyId=/i.test(fileUrl)))
    )
  }
}

/**
 * 得到浏览器/OnlyOffice 可直接访问的 OSS 地址：已是后端签名链则原样返回（并尽量统一为 https），否则走 STS 换签。
 */
export async function resolveOssAccessibleUrl(fileUrl: string): Promise<string> {
  if (!fileUrl?.trim()) return fileUrl
  const trimmed = fileUrl.trim()
  if (isOssUrlAlreadyPresigned(trimmed)) {
    return trimmed.startsWith('http://') ? trimmed.replace('http://', 'https://') : trimmed
  }
  if (trimmed.includes('.aliyuncs.com') || trimmed.includes('oss-')) {
    return getOssSignatureUrl(trimmed)
  }
  return trimmed
}

/**
 * 生成OSS文件的签名URL（用于预览和下载）
 * @param fileUrl OSS文件的完整URL或文件路径
 * @param expires 过期时间（秒），默认3600（1小时）
 * @param addWatermark 是否添加水印（默认false，用于预览时保持原始文件）
 * @returns 签名URL
 */
const getOssSignatureUrl = (
  fileUrl: string
  // expires: number = 3600,
  // addWatermark: boolean = false
): Promise<string> => {
  return new Promise((resolve, reject) => {
    getOssSts()
      .then(async (res: any) => {
        // 保存原始URL的协议和域名信息
        let originalProtocol = 'https'
        let originalHost = ''
        let originalDomain = ''
        let endpoint = ''

        // 从完整URL中提取文件路径（去掉域名部分和查询参数）
        let objectName = fileUrl
        if (fileUrl.startsWith('http://') || fileUrl.startsWith('https://')) {
          try {
            // 先去掉查询参数（如果URL已经是签名URL，需要重新生成）
            const urlWithoutQuery = fileUrl.split('?')[0]
            const urlObj = new URL(urlWithoutQuery)

            // 保存原始域名和协议
            originalProtocol = urlObj.protocol.replace(':', '') // 保存协议（http或https）
            originalHost = urlObj.host // 保存原始域名
            originalDomain = `${originalProtocol}://${originalHost}` // 保存完整域名
            // 配置endpoint为原始域名（去掉协议）
            endpoint = originalHost

            // 提取路径部分，去掉开头的斜杠
            let pathname = urlObj.pathname
            if (pathname.startsWith('/')) {
              pathname = pathname.substring(1)
            }

            // pathname已经是URL编码的，需要解码后再使用
            // 因为OSS的signatureUrl方法需要的是原始路径（未编码的）
            objectName = decodeURIComponent(pathname)
          } catch {
            // 如果URL解析失败，尝试使用正则表达式提取
            const match = fileUrl.match(/https?:\/\/([^/]+)\/(.+?)(?:\?|$)/)
            if (match && match[1] && match[2]) {
              originalHost = match[1]
              originalProtocol = fileUrl.startsWith('https://') ? 'https' : 'http'
              originalDomain = `${originalProtocol}://${originalHost}`
              endpoint = originalHost
              objectName = decodeURIComponent(match[2])
            } else {
              reject(new Error('无法解析OSS文件URL: ' + fileUrl))
              return
            }
          }
        } else {
          // 如果不是完整URL，可能是相对路径，直接使用（如果已编码则解码）
          try {
            objectName = decodeURIComponent(fileUrl)
          } catch {
            // 如果解码失败，说明可能已经是原始路径，直接使用
            objectName = fileUrl
          }
        }

        console.log('原始URL:', fileUrl)
        console.log('提取的objectName:', objectName)
        console.log('原始域名:', originalDomain)
        console.log('配置的endpoint:', endpoint)
        // 初始化OSS客户端，使用原始URL的endpoint（如果存在）
        const ossConfig: any = {
          region: VITE_OSS_REGIONID || 'oss-cn-shenzhen',
          accessKeyId: res.data.credentials.accessKeyId,
          accessKeySecret: res.data.credentials.accessKeySecret,
          stsToken: res.data.credentials.securityToken,
          bucket: bucketName,
          authorizationV4: true
        }
        // 如果原始URL有自定义域名，配置endpoint和cname
        if (endpoint) {
          ossConfig.endpoint = endpoint
          ossConfig.cname = true
          console.log('使用自定义endpoint:', endpoint)
        } else {
          ossConfig.cname = true
        }
        const OSS = getOSSConstructor()
        const ossUtil = new OSS(ossConfig)
        // 填写Object完整路径。Object完整路径中不能包含Bucket名称。
        // 生成签名URL，使用标准的signatureUrl方法
        let signedUrl = ossUtil.signatureUrl(objectName, {
          expires: 3600
        })
        console.log('OSS SDK生成的签名URL:', signedUrl)
        // 如果生成的签名URL的域名与原始域名不一致，进行替换
        // 这样可以确保使用原始域名和协议
        if (originalDomain) {
          try {
            const signedUrlObj = new URL(signedUrl)
            const signedProtocol = signedUrlObj.protocol.replace(':', '')
            const signedHost = signedUrlObj.host
            const signedDomain = `${signedProtocol}://${signedHost}`

            console.log('签名URL的域名:', signedDomain)
            console.log('原始域名:', originalDomain)

            // 如果域名不一致，进行替换
            if (signedDomain !== originalDomain) {
              signedUrl = signedUrl.replace(signedDomain, originalDomain)
              console.log('替换域名后的签名URL:', signedUrl)
            } else {
              console.log('域名一致，无需替换')
            }
          } catch (e) {
            console.warn('替换域名失败，使用原始签名URL:', e)
            console.warn('错误详情:', e)
          }
        }

        console.log('最终生成的签名URL:', signedUrl)
        resolve(signedUrl)
      })
      .catch((e) => reject(e))
  })
}
// 定义一个生成签名 URL 的函数
// async function generateSignatureUrl(fileName) {
//   // 获取签名URL
//   const client = await new OSS({
//     // 请填写您的自定义域名。例如http://static.example.com。
//     endpoint: 'http://static.example.com',
//     // 从环境变量中获取访问凭证。运行本代码示例之前，请确保已设置环境变量OSS_ACCESS_KEY_ID和OSS_ACCESS_KEY_SECRET。
//     accessKeyId: process.env.OSS_ACCESS_KEY_ID,
//     accessKeySecret: process.env.OSS_ACCESS_KEY_SECRET,
//     bucket: 'examplebucket',
//     // 填写Bucket所在地域。以华东1（杭州）为例，Region填写为oss-cn-hangzhou。
//     region: 'oss-cn-hangzhou',
//     authorizationV4: true,
//     cname: true
//   });

//   // 生成签名URL，并包含文档处理参数
//   return await client.signatureUrlV4('GET', 3600, {
//     headers: {}, // 请根据实际发送的请求头设置此处的请求头
//     queries: {
//       "x-oss-process": "doc/preview,export_1,print_1/watermark,text_5YaF6YOo6LWE5paZ,size_30,t_60" // 添加文档处理参数
//     }
//   }, fileName);
// }

export { ossUpload, ossDownLoad, ossUrl, getOssSignatureUrl }
