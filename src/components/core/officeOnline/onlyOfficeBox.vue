<template>
  <div id="w-office"></div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, onBeforeUnmount } from 'vue'
  import { baseUrl } from '@/api/fileParsing/fileUrl'

  defineOptions({ name: 'OnlyOfficeBox' })

  // 声明全局类型
  declare global {
    interface Window {
      DocsAPI?: {
        DocEditor: new (id: string, config: OnlyOfficeConfig) => OnlyOfficeEditor
      }
    }
  }

  // OnlyOffice 编辑器接口
  interface OnlyOfficeEditor {
    destroyEditor(): void
    createConnector?(): any
  }

  // OnlyOffice 配置接口
  interface OnlyOfficeConfig {
    document: {
      fileType: string
      key: string
      title: string
      permissions: {
        edit: boolean
        print: boolean
        download: boolean
        fillForms: boolean
        review: boolean
      }
      url: string
    }
    documentType: string
    editorConfig: {
      callbackUrl?: string
      lang: string
      chat: {
        autosave: boolean
        chat: boolean
        comments: boolean
        help: boolean
        plugins: boolean
      }
      user: {
        id: string
        name: string
        image: string
      }
      customization: {
        autosave: boolean
      }
      mode: string
    }
    events: {
      onAppReady?: () => void
      onDocumentStateChange?: (event: any) => void
      onDownloadAs?: (event: any) => void
    }
    width: string
    height: string
    token?: string
    headers?: Record<string, string>
  }

  // Props 接口定义
  interface OnlyOfficeOption {
    url?: string
    callbackUrl?: string
    fileType?: string
    key?: string
    title?: string
    isEdit?: boolean
    isDownload?: boolean
    lang?: string
    isPrint?: boolean
    user?: {
      id?: string
      name?: string
      image?: string
    }
    token?: string
    model?: string
  }

  interface Props {
    option?: OnlyOfficeOption
  }

  const props = withDefaults(defineProps<Props>(), {
    option: () => ({})
  })

  // Emits 接口定义
  interface Emits {
    (e: 'saveSuccess', data: any): void
    (e: 'changeFile', data: any): void
  }

  const emit = defineEmits<Emits>()

  // 响应式数据
  const doctype = ref<string>('')
  const docEditor = ref<OnlyOfficeEditor | null>(null)
  const loading = ref(false)

  // 加载编辑器 API
  const loadEditorApi = (): Promise<void> => {
    return new Promise((resolve, reject) => {
      // 检查是否已加载
      if (window.DocsAPI) {
        resolve()
        return
      }

      // 检查baseUrl是否配置
      if (!baseUrl) {
        const errorMsg = 'OnlyOffice服务器地址未配置，请检查环境变量 VITE_OFFICE_SERVER'
        console.error(errorMsg)
        alert(errorMsg)
        reject(new Error(errorMsg))
        return
      }

      // 加载编辑器API
      const srcUrl = `${baseUrl}/web-apps/apps/api/documents/api.js`
      console.log('正在加载OnlyOffice API:', srcUrl)

      // 检查是否已经有相同的script标签
      const existingScript = document.querySelector(`script[src="${srcUrl}"]`)
      if (existingScript) {
        // 如果script已存在，等待一段时间后检查DocsAPI是否可用
        const checkInterval = setInterval(() => {
          if (window.DocsAPI) {
            clearInterval(checkInterval)
            resolve()
          }
        }, 100)

        // 10秒后超时
        setTimeout(() => {
          clearInterval(checkInterval)
          if (!window.DocsAPI) {
            const errorMsg = `OnlyOffice API加载超时。请检查服务器地址是否正确: ${srcUrl}`
            console.error(errorMsg)
            alert(errorMsg)
            reject(new Error(errorMsg))
          }
        }, 10000)
        return
      }

      const script = document.createElement('script')
      script.src = srcUrl
      script.async = true

      script.onload = () => {
        // 等待一小段时间确保DocsAPI已初始化
        setTimeout(() => {
          if (window.DocsAPI) {
            console.log('OnlyOffice API加载成功')
            resolve()
          } else {
            const errorMsg = `OnlyOffice API脚本已加载，但DocsAPI未初始化。请检查服务器地址: ${srcUrl}`
            console.error(errorMsg)
            alert(errorMsg)
            reject(new Error(errorMsg))
          }
        }, 100)
      }

      script.onerror = (error) => {
        const errorMsg = `无法加载OnlyOffice API。\n\n可能的原因：\n1. OnlyOffice服务器未启动或无法访问\n2. 服务器地址配置错误: ${srcUrl}\n3. 网络连接问题\n4. CORS跨域问题\n\n请检查环境变量 VITE_OFFICE_SERVER 的配置`
        console.error('Failed to load OnlyOffice API:', error)
        console.error('尝试加载的URL:', srcUrl)
        console.error('当前baseUrl:', baseUrl)
        alert(errorMsg)
        reject(error)
      }

      document.head.appendChild(script)
    })
  }

  // 设置编辑器
  const setEditor = async (option: OnlyOfficeOption) => {
    // setEditor 方法用于初始化编辑器。它接收一个参数 option，包含编辑器的各种配置选项。

    // 确保OnlyOffice API已加载
    if (!window.DocsAPI) {
      console.warn('OnlyOffice API未加载，尝试重新加载...')
      try {
        await loadEditorApi()
      } catch (error) {
        console.error('无法加载OnlyOffice API，无法初始化编辑器:', error)
        return
      }
    }

    if (docEditor.value !== null) {
      docEditor.value.destroyEditor()
      docEditor.value = null
    }
    const extLower = String(option.fileType || '')
      .toLowerCase()
      .trim()
    doctype.value = getFileType(extLower)
    const config: OnlyOfficeConfig = {
      document: {
        fileType: extLower, // 文档类型（小写，与服务端枚举一致）
        key: option.key || '', // 唯一值key
        title: option.title || '', // 指定在编辑器中显示的文件名称
        permissions: {
          // 是否可以编辑: 只能查看，传false
          edit: option.isEdit ?? false,
          print: option.isPrint ?? true,
          download: option.isDownload ?? true,
          fillForms: true, // 是否可以填写表格，如果将mode参数设置为edit，则填写表单仅对文档编辑器可用。 默认值与edit或review参数的值一致。
          review: true // 跟踪变化
        },
        url: option.url || '' // 指定需打开加载文档的URL
      },
      documentType: doctype.value,
      editorConfig: {
        callbackUrl: option.callbackUrl, // 编辑word后保存时回调的地址，这个回调用于后端接收你改变后的数据
        lang: option.lang || 'zh-CN', // 语言设置
        chat: {
          autosave: true, // 是否自动保存
          chat: false,
          comments: false,
          help: false,
          // 是否显示插件
          plugins: false
        },
        user: {
          // 用户信息
          id: option.user?.id || '',
          name: option.user?.name || '',
          image: option.user?.image || ''
        },
        customization: {
          autosave: true
          // // 强制保存
          // forcesave: true,
        },
        // 仅预览须用 view；误用 edit + permissions.edit=false 时 PDF 等易出现壳在、内容区空白
        mode: option.isEdit || option.model === 'edit' ? 'edit' : 'view'
      },
      events: {
        onAppReady: onAppReady, // 调用此方法 应用程序被加载到浏览器中。
        onDocumentStateChange: onDocumentStateChange, // 文档被修改。
        onDownloadAs: onDownloadAs
        // onSubmit:handleSaveDocument
      },
      width: '100%', // 定义浏览器窗口中的文档宽度（默认为 100%）。
      height: '100%', // 定义浏览器窗口中的文档高度（默认为 100%）。
      token: option.token || '', // 安全令牌
      headers: {
        // "Authorization": `Bearer 121222222`
      }
    }
    console.log('---OnlyOffice配置----', config)
    if (window.DocsAPI && window.DocsAPI.DocEditor) {
      try {
        docEditor.value = new window.DocsAPI.DocEditor('w-office', config)
      } catch (error) {
        console.error('初始化OnlyOffice编辑器失败:', error)
        alert(`初始化OnlyOffice编辑器失败: ${error instanceof Error ? error.message : '未知错误'}`)
      }
    } else {
      console.error('OnlyOffice DocsAPI未可用')
      alert('OnlyOffice API未加载，无法初始化编辑器。请检查OnlyOffice服务器是否正常运行。')
    }
  }

  // 文档状态变更回调
  const onDocumentStateChange = (event: any) => {
    console.log('文档被修改', event)
    emit('changeFile', event)
  }

  // 应用就绪回调
  const onAppReady = () => {
    // onAppReady 方法是一个回调函数，当 OnlyOffice 编辑器加载完成后调用
    // connector.value = docEditor.value?.createConnector(); // 创建connector连接器
    // console.log(
    //   docEditor.value,
    //   '+++++++创建connector连接器创建connector连接器创建connector连接器++++++'
    // );
  }

  // 下载回调
  const onDownloadAs = (event: any) => {
    console.log('点击下载', event.data)
    emit('saveSuccess', event.data)
  }

  // 获取文件类型（与 OnlyOffice 约定一致，比较时用统一小写）
  const getFileType = (fileType: string): string => {
    // getFileType 方法用于根据文件类型（fileType）返回对应的文档类型（docType）
    let docType = ''
    const ext = String(fileType || '')
      .toLowerCase()
      .trim()
    const fileTypesDoc = [
      'doc',
      'docm',
      'docx',
      'dot',
      'dotm',
      'dotx',
      'epub',
      'fodt',
      'htm',
      'html',
      'mht',
      'odt',
      'ott',
      'pdf',
      'rtf',
      'txt',
      'djvu',
      'xps',
      'word'
    ]
    const fileTypesCsv = ['csv', 'fods', 'ods', 'ots', 'xls', 'xlsm', 'xlsx', 'xlt', 'xltm', 'xltx']
    const fileTypesPPt = [
      'fodp',
      'odp',
      'otp',
      'pot',
      'potm',
      'potx',
      'pps',
      'ppsm',
      'ppsx',
      'ppt',
      'pptm',
      'pptx'
    ]
    if (fileTypesDoc.includes(ext)) {
      docType = 'word'
    }
    if (fileTypesCsv.includes(ext)) {
      docType = 'cell'
    }
    if (fileTypesPPt.includes(ext)) {
      docType = 'slide'
    }
    return docType
  }

  // 组件挂载时初始化
  onMounted(async () => {
    try {
      loading.value = true
      // 加载编辑器API
      await loadEditorApi()
      loading.value = false

      // 监听 option 变化
      watch(
        () => props.option,
        async (newOption) => {
          console.log('OnlyOffice option变化:', newOption)
          if (newOption && newOption.url) {
            // 确保API已加载后再设置编辑器
            if (!window.DocsAPI) {
              console.warn('OnlyOffice API未加载，尝试重新加载...')
              try {
                await loadEditorApi()
              } catch (error) {
                console.error('无法加载OnlyOffice API:', error)
                return
              }
            }
            setEditor(newOption)
          }
        },
        { immediate: true, deep: true }
      )
    } catch (error) {
      console.error('Failed to initialize editor:', error)
      loading.value = false
      // 错误已在loadEditorApi中处理
    }
  })

  // 暴露方法给父组件
  defineExpose({
    docEditor
  })

  // 组件卸载前清理
  onBeforeUnmount(() => {
    // 检查并销毁文档编辑器实例
    if (docEditor.value !== null) {
      docEditor.value.destroyEditor()
      docEditor.value = null
    }
  })
</script>

<style scoped lang="scss">
  #w-office {
    width: 100%;
    height: 100%;
  }
</style>
