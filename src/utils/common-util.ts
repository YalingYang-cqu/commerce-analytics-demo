import { saveAs } from 'file-saver'
import { Decimal } from 'decimal.js'
import { round } from 'lodash'
// 通过blob导出，后端命名文件
export const pubBlobDownLoad = async function (res: any, fileName?: string, callBack?: any) {
  // 导出失败的错误信息
  const type = res?.headers?.['content-type']
  if (type?.indexOf('application/json') > -1) {
    const file: any = new FileReader()
    file.readAsText(res.data, 'utf-8')
    file.onload = function () {
      const obj: any = JSON.parse(file.result)
      if (obj.code == 200) {
        ElMessage.success(obj?.msg)
        if (callBack) callBack(true)
      } else {
        console.log('obj', obj)
        ElMessage.error(obj?.msg)
        if (callBack) callBack(false)
      }
    }
    // 导出成功
  } else {
    const blob = new Blob([res.data || res], {
      type: 'application/vnd.ms-excel;charset=UTF-8'
    })
    let fileNameNew: any = fileName || '导出文件'
    const fileData = res?.headers?.['content-disposition']
    if (fileData) {
      fileNameNew = decodeURIComponent(
        decodeURIComponent(fileData.split(';')[1].split(`*=utf-8''`)[1])
      )
    }
    saveAs(blob, fileNameNew)
    if (callBack) callBack(false)
  }
}
// 通过blob导出，前端命名文件
export const FnDownloadFile = (data: any, name: string) => {
  const blob = new Blob([data])
  // 创建一个新的url，此url指向新建的Blob对象
  const url = window.URL.createObjectURL(blob)
  // 创建a标签，并隐藏改a标签
  const link = document.createElement('a')
  link.style.display = 'none'
  // a标签的href属性指定下载链接
  link.href = url
  //setAttribute() 方法添加指定的属性，并为其赋指定的值。
  link.setAttribute('download', name + '.xlsx')
  document.body.appendChild(link)
  link.click()
}

// 通过链接下载文件
export const downloadByUrl = (url: string, name: string) => {
  const a = document.createElement('a')
  a.href = url
  a.target = '_blank'
  a.download = name.slice(0, name.lastIndexOf('.'))
  a.click()
}

// 通过链接下载文件,转为blob,pdf等不打开新页面
export const fileLinkToStreamDownload = (url: string, name: string) => {
  // 参数验证
  if (!url || typeof url !== 'string') {
    console.error('fileLinkToStreamDownload: URL 参数无效', url)
    throw new Error('文件URL无效')
  }

  if (!name || typeof name !== 'string') {
    console.error('fileLinkToStreamDownload: 文件名参数无效', name)
    throw new Error('文件名无效')
  }

  // 验证 URL 格式
  let validUrl: string
  try {
    // 如果是相对路径，尝试转换为绝对路径
    if (!url.startsWith('http://') && !url.startsWith('https://') && !url.startsWith('blob:')) {
      // 相对路径，需要基于当前域名
      validUrl = new URL(url, window.location.origin).toString()
    } else {
      // 验证绝对 URL
      new URL(url)
      validUrl = url
    }
  } catch (e) {
    console.error('fileLinkToStreamDownload: URL 格式错误', url, e)
    throw new Error('文件URL格式不正确')
  }

  // 处理文件名：如果包含路径，只取文件名部分；保留扩展名
  let fileName = name
  if (fileName.includes('/')) {
    fileName = fileName.substring(fileName.lastIndexOf('/') + 1)
  }
  // 如果文件名没有扩展名，尝试从 URL 中提取
  if (!fileName.includes('.')) {
    const urlMatch = validUrl.match(/\.([a-zA-Z0-9]+)(\?|$)/)
    if (urlMatch) {
      fileName = `${fileName}.${urlMatch[1]}`
    }
  }

  return new Promise<void>((resolve, reject) => {
    try {
      const xhr = new XMLHttpRequest()
      xhr.open('GET', validUrl, true)
      xhr.responseType = 'blob'

      xhr.onload = function () {
        if (this.status === 200) {
          try {
            const blob = this.response
            if (!blob || blob.size === 0) {
              reject(new Error('下载的文件为空'))
              return
            }

            const blobUrl = URL.createObjectURL(blob)
            const a = document.createElement('a')
            a.href = blobUrl
            a.download = fileName
            a.style.display = 'none'
            document.body.appendChild(a)
            a.click()

            // 清理
            setTimeout(() => {
              document.body.removeChild(a)
              URL.revokeObjectURL(blobUrl)
            }, 100)

            resolve()
          } catch (error) {
            console.error('fileLinkToStreamDownload: 处理下载失败', error)
            reject(error)
          }
        } else {
          const error = new Error(`下载失败，状态码: ${this.status}`)
          console.error('fileLinkToStreamDownload: HTTP 错误', this.status, this.statusText)
          reject(error)
        }
      }

      xhr.onerror = function () {
        const error = new Error('网络错误，无法下载文件')
        console.error('fileLinkToStreamDownload: 网络错误', error)
        reject(error)
      }

      xhr.onabort = function () {
        const error = new Error('下载已取消')
        console.warn('fileLinkToStreamDownload: 下载已取消')
        reject(error)
      }

      xhr.ontimeout = function () {
        const error = new Error('下载超时')
        console.error('fileLinkToStreamDownload: 下载超时')
        reject(error)
      }

      // 设置超时时间（30秒）
      xhr.timeout = 30000

      xhr.send()
    } catch (e: any) {
      console.error('fileLinkToStreamDownload: 异常', e)
      reject(e)
    }
  })
}

/**
 * 优先 XHR 拉取 Blob 触发下载（可自定义文件名）；失败时回退为新窗口打开直链（规避 OSS 未配置浏览器 CORS 时 XHR 失败）。
 */
export const downloadFileWithFallback = async (url: string, name: string): Promise<void> => {
  try {
    await fileLinkToStreamDownload(url, name)
  } catch (e) {
    console.warn('downloadFileWithFallback: 流式下载失败，已改为新窗口打开', e)
    window.open(url, '_blank', 'noopener,noreferrer')
  }
}
/**
 * 将级联结构的数据拉平为扁平数组
 * @param treeData 树形数据数组
 * @param childrenKey 子节点字段名，默认为 'children'
 * @param keepChildren 是否保留 children 属性，默认为 false
 * @returns 扁平化后的数组
 *
 * @example
 * // 使用示例：
 * const flatData = flattenTree(data.value)
 * // 或者保留 children 属性：
 * const flatDataWithChildren = flattenTree(data.value, 'children', true)
 */

export const flattenTree = <T extends Record<string, any>>(
  treeData: T[],
  childrenKey: string = 'children',
  keepChildren: boolean = false
): T[] => {
  const result: T[] = []

  const traverse = (items: T[]) => {
    items.forEach((item) => {
      // 创建新对象，避免修改原数据
      const flatItem = { ...item }

      // 如果不需要保留 children，则删除它
      if (!keepChildren && childrenKey in flatItem) {
        delete flatItem[childrenKey]
      }

      result.push(flatItem)

      // 递归处理子节点
      if (item[childrenKey] && Array.isArray(item[childrenKey]) && item[childrenKey].length > 0) {
        traverse(item[childrenKey] as T[])
      }
    })
  }

  traverse(treeData)
  return result
}
/* 数据字典里的数据过滤显示 */
export const pubFilter = function (data: any, key: any | number) {
  if (!data) return
  const text = data?.find((c: any) => c.value === String(key))?.label
  if (!text?.length) return
  return text
}
/**
 * 比较初始数据和当前数据，返回新增、编辑、删除的数据
 * @param initialList 初始数据数组
 * @param currentList 当前数据数组
 * @returns 返回包含 addList、editList、deleteList 的对象
 */
export const compareDataChanges = (
  initialList: any[],
  currentList: any[]
): {
  addList: any[]
  editList: any[]
  deleteList: number[]
} => {
  const addList: any[] = [] // 新增的数据（没有id）
  const editList: any[] = [] // 编辑的数据（有id且内容有变化）
  const deleteList: number[] = [] // 删除的数据id数组

  // 获取初始数据中所有带id的记录
  const initialIdMap = new Map()
  initialList.forEach((item: any) => {
    if (item.id) {
      initialIdMap.set(item.id, item)
    }
  })

  // 获取当前数据中所有带id的记录
  const currentIdSet = new Set()
  currentList.forEach((item: any) => {
    if (item.id) {
      currentIdSet.add(item.id)
    }
  })

  // 找出删除的数据（初始有id但当前没有的）
  initialIdMap.forEach((item: any, id: number) => {
    if (!currentIdSet.has(id)) {
      deleteList.push(id)
    }
  })

  // 处理当前数据，区分新增和编辑
  currentList.forEach((item: any) => {
    if (!item.id) {
      // 没有id，是新增的数据
      const newItem = { ...item }
      delete newItem.id
      addList.push(newItem)
    } else {
      editList.push(item)
      // 有id，检查是否有变化
      // const initialItem = initialIdMap.get(item.id)
      // if (initialItem) {
      //   // 比较数据是否有变化（排除id字段）
      //   const hasChanged =
      //     JSON.stringify({ ...item, id: undefined }) !==
      //     JSON.stringify({ ...initialItem, id: undefined })
      //   if (hasChanged) {
      //     editList.push(item)
      //   }
      // }
    }
  })

  return {
    addList,
    editList,
    deleteList
  }
}
// 复制文本到剪贴板
export const handleCopy = async (text: string) => {
  if (!text) return
  try {
    await navigator.clipboard.writeText(text)
    ElMessage.success('复制成功')
  } catch {
    // 降级方案：使用传统的复制方法
    try {
      const textarea = document.createElement('textarea')
      textarea.value = text
      textarea.style.position = 'fixed'
      textarea.style.opacity = '0'
      document.body.appendChild(textarea)
      textarea.select()
      document.execCommand('copy')
      document.body.removeChild(textarea)
      ElMessage.success('复制成功')
    } catch (err) {
      ElMessage.error('复制失败')
      console.error('复制失败:', err)
    }
  }
}
// 编辑表格滚动到第一个验证错误的表单项
export const scrollToFirstError = (errors: any, key: string) => {
  if (!errors || typeof errors !== 'object') return

  // 找到第一个错误的字段
  const firstErrorField = Object.keys(errors)[0]
  if (!firstErrorField) return

  nextTick(() => {
    // 如果是 key 字段（表格为空的情况）
    if (firstErrorField === key) {
      const formItem = document.querySelector(
        '.product-list-form-item .el-form-item__error'
      ) as HTMLElement
      if (formItem) {
        formItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
      }
      return
    }

    // 如果是表格内的字段（格式：productList.${index}.fieldName）
    if (firstErrorField.startsWith(`${key}.`)) {
      const parts = firstErrorField.split('.')
      if (parts.length === 3) {
        const rowIndex = parseInt(parts[1])
        const fieldName = parts[2]

        // 获取表格的滚动容器
        const tableWrapper = document.querySelector(
          '.product-section .el-table__body-wrapper'
        ) as HTMLElement
        if (!tableWrapper) return

        const tableBody = tableWrapper.querySelector('.el-table__body')
        if (!tableBody) return

        const rows = tableBody.querySelectorAll('.el-table__row')
        if (!rows[rowIndex]) return

        const targetRow = rows[rowIndex] as HTMLElement

        // 方法1: 查找包含 is-error 类的表单项（Element Plus 验证失败时会添加此类）
        let errorFormItem = targetRow.querySelector(`.el-form-item.is-error`) as HTMLElement

        // 方法2: 如果找不到，查找错误提示消息，然后找到其父级表单项
        if (!errorFormItem) {
          const errorMessage = targetRow.querySelector('.el-form-item__error') as HTMLElement
          if (errorMessage) {
            errorFormItem = errorMessage.closest('.el-form-item') as HTMLElement
          }
        }

        // 方法3: 如果还是找不到，通过字段名查找对应的单元格
        // 字段名到列索引的映射（排除选择框和序号列，从0开始）
        let errorCell: HTMLElement | null = null
        if (!errorFormItem) {
          const fieldToColumnIndex: Record<string, number> = {
            purchaseQuantity: 3, // 采购量是第4列（选择框0，序号1，图片2，SKU/中文品名3，...）
            quantityPerBox: 4,
            boxCount: 5,
            unitPrice: 6,
            taxRate: 7,
            expectedDeliveryDate: 11,
            productRemark: 12
          }

          const columnIndex = fieldToColumnIndex[fieldName]
          if (columnIndex !== undefined) {
            const cells = targetRow.querySelectorAll('.el-table__cell')
            // 考虑固定列（如果有），但通常选择框和序号是前两列
            // 实际列索引 = columnIndex + 2（选择框和序号）
            const targetCellIndex = columnIndex + 2
            if (cells[targetCellIndex]) {
              errorCell = cells[targetCellIndex] as HTMLElement
              errorFormItem = errorCell.querySelector('.table-form-item') as HTMLElement
            }
          }
        } else {
          // 如果找到了错误表单项，找到它所在的单元格
          errorCell = errorFormItem.closest('.el-table__cell') as HTMLElement
        }

        // 确定要滚动的目标元素：优先使用单元格（包含完整的列），其次使用表单项，最后使用整行
        const targetElement = errorCell || errorFormItem || targetRow

        if (targetElement) {
          // 获取目标元素的位置信息
          const targetRect = targetElement.getBoundingClientRect()
          const wrapperRect = tableWrapper.getBoundingClientRect()

          // 计算垂直滚动：让错误行在容器中间位置
          const currentScrollTop = tableWrapper.scrollTop
          const rowOffsetTop = targetRect.top - wrapperRect.top
          const targetScrollTop =
            currentScrollTop + rowOffsetTop - wrapperRect.height / 2 + targetRect.height / 2

          // 计算水平滚动：让错误列完全可见（从容器左侧开始显示）
          const currentScrollLeft = tableWrapper.scrollLeft
          const columnOffsetLeft = targetRect.left - wrapperRect.left
          const targetScrollLeft = currentScrollLeft + columnOffsetLeft - 20 // 留出20px边距

          // 执行滚动
          tableWrapper.scrollTo({
            top: Math.max(0, targetScrollTop),
            left: Math.max(0, targetScrollLeft),
            behavior: 'smooth'
          })

          // 等待滚动完成后，聚焦输入框并再次检查位置
          setTimeout(() => {
            // 查找输入框
            const input = targetElement.querySelector(
              'input, textarea, .el-date-editor input'
            ) as HTMLInputElement

            if (input) {
              input.focus()

              // 再次检查元素是否完全可见，如果不可见则微调
              const newTargetRect = targetElement.getBoundingClientRect()
              const newWrapperRect = tableWrapper.getBoundingClientRect()

              // 检查是否需要再次调整滚动位置
              if (
                newTargetRect.left < newWrapperRect.left ||
                newTargetRect.right > newWrapperRect.right ||
                newTargetRect.top < newWrapperRect.top ||
                newTargetRect.bottom > newWrapperRect.bottom
              ) {
                const finalScrollTop =
                  tableWrapper.scrollTop +
                  (newTargetRect.top - newWrapperRect.top) -
                  newWrapperRect.height / 2 +
                  newTargetRect.height / 2
                const finalScrollLeft =
                  tableWrapper.scrollLeft + (newTargetRect.left - newWrapperRect.left) - 20

                tableWrapper.scrollTo({
                  top: Math.max(0, finalScrollTop),
                  left: Math.max(0, finalScrollLeft),
                  behavior: 'smooth'
                })
              }
            }
          }, 500)
        }
      }
      return
    }

    // 主表单的错误，查找对应的表单项
    const formItem = document.querySelector(
      `.el-form-item[data-prop="${firstErrorField}"], .el-form-item.is-error`
    ) as HTMLElement
    if (formItem) {
      formItem.scrollIntoView({ behavior: 'smooth', block: 'center' })
      // 尝试聚焦输入框
      const input = formItem.querySelector('input, textarea, select') as HTMLInputElement
      if (input) {
        setTimeout(() => {
          input.focus()
        }, 300)
      }
    }
  })
}

// 计算 精度问题（使用 decimal.js 替代 mathjs，避免 Vite/Rollup 构建解析错误）
export const printFn = (value: any) => {
  const precision = 14
  return new Decimal(value || 0).toDecimalPlaces(precision).toNumber()
}

//加法
export const add = (a: number, b: number) => {
  return [String(a), String(b)].includes('***') ? '***' : new Decimal(a).plus(b).toNumber()
}

//减法
export const sub = (a: number, b: number) => {
  return [String(a), String(b)].includes('***') ? '***' : new Decimal(a).minus(b).toNumber()
}

//乘法
export const mul = (a: number, b: number) => {
  return [String(a), String(b)].includes('***') ? '***' : new Decimal(a).times(b).toNumber()
}

//除法
export const divide = (a: number, b: number) => {
  return [String(a), String(b)].includes('***') ? '***' : new Decimal(a).div(b).toNumber()
}
/* 价格显示过滤*/
export const changeNum = function (value: any, isLong?: boolean, num?: number) {
  const newValue = isLong ? value : round(parseFloat(value), num || 2)
  //判断是否有小数点
  const s = newValue.toString().indexOf('.')
  if (s == -1) {
    // 是整数
    return (newValue || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,') + '.00'
  } else {
    // 是小数
    const arr = newValue.toString().split('.')
    if (arr.length > 1 && arr[1].length < 2) {
      // 一位小数
      return (arr[0] || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,') + '.' + arr[1] + '0'
    } else {
      // 两位小数以上
      return (arr[0] || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,') + '.' + arr[1]
    }
  }
}
// 单位元 保留两位小数并带千分位符
// isLong true的时候不强制两位小数，不传或者false强制转成两位小数
// num 需要保留的几位小数点，默认两位
export const priceValue = function (value: any, currency?: string, isLong?: any, num?: number) {
  if (!value) {
    return '0'
  }
  return currency ? currency + changeNum(value, isLong, num) : changeNum(value, isLong, num)
}
// 整数的千分位
export const NumberValue = function (value: number | string) {
  return (value || 0).toString().replace(/(\d)(?=(?:\d{3})+$)/g, '$1,')
}
export const getUrl = (dataC: any) => {
  if (!dataC) return ''
  try {
    const parsed = JSON.parse(dataC)
    return parsed?.url || parsed?.[0]?.url || ''
  } catch (error) {
    console.warn('Failed to parse image URL:', error)
    return dataC || ''
  }
}
