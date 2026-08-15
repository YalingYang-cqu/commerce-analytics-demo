<template>
  <!-- onlyoffice展示 -->
  <div class="qualityManual-container">
    <div v-if="show" class="qualityManual-container-office">
      <onlyOfficeBox
        :option="option"
        ref="editorRef"
        @saveSuccess="handleSaveSuccess"
        @changeFile="handleChangeFile"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
  import { ref, onMounted, watch } from 'vue'
  import { useUserStore } from '@/store/modules/user'
  import onlyOfficeBox from './onlyOfficeBox.vue'
  import { ElMessageBox } from 'element-plus'
  defineOptions({ name: 'OnlyOffice' })

  // Props 接口定义
  interface FileInfo {
    fileName: string
    file: string
    isEdit: boolean
  }

  interface Props {
    file?: FileInfo
    addlowEdit?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    file: () => ({
      fileName: '',
      file: '',
      isEdit: false
    }),
    addlowEdit: false
  })

  // Emits 接口定义
  interface Emits {
    (e: 'saveSuccess', data: any): void
    (e: 'changeFile', data: any): void
  }

  const emit = defineEmits<Emits>()

  // 响应式数据
  const editorRef = ref<any>(null)
  const show = ref(false)

  // OnlyOffice 配置选项接口
  interface OnlyOfficeOption {
    url: string
    callbackUrl: string // 关闭弹窗后 回调用callbackurl接口进行保存
    fileType: string // 文件扩展名
    key: string // key 默认置空则不走缓存 always updat
    title: string // 查看或编辑的文档定义所需的文件名，该文件名在下载文档时也将用作文件
    isEdit: boolean // 是否可以编辑: 只能查看，传false
    isDownload: boolean // 是否下载
    lang: string // 语言：zh-CN简体中文/en英文
    isPrint: boolean // 启用导出
    user: {
      id: string
      name: string
      image: string
    }
    token: string
  }

  // 参考vabOnlyOffice组件参数配置
  const option = ref<OnlyOfficeOption>({
    url: '',
    callbackUrl: '', // 关闭弹窗后 回调用callbackurl接口进行保存
    fileType: '', // 文件扩展名
    key: '', // key 默认置空则不走缓存 always updat
    title: '', // 查看或编辑的文档定义所需的文件名，该文件名在下载文档时也将用作文件
    isEdit: false, // 是否可以编辑: 只能查看，传false
    isDownload: true, // 是否下载
    lang: 'zh-CN', // 语言：zh-CN简体中文/en英文
    isPrint: true, // 启用导出
    user: {
      id: '',
      name: '',
      image: ''
    },
    token: ''
  })

  // 获取用户信息
  const getUser = () => {
    const userStore = useUserStore()
    return userStore.getUserInfo
  }

  /** 扩展名交给 OnlyOffice 与 getFileType 使用，须小写且取最后一段（如 a.b.pdf → pdf） */
  const extractExtension = (fileName: string): string => {
    if (!fileName) return ''
    const i = fileName.lastIndexOf('.')
    if (i < 0 || i >= fileName.length - 1) return ''
    return fileName
      .slice(i + 1)
      .toLowerCase()
      .trim()
  }

  // 加载 OnlyOffice
  const loadOnlyOffice = () => {
    const fileName = props.file.fileName
    const fileType = extractExtension(fileName)

    const userStore = useUserStore()
    const userInfo = userStore.getUserInfo

    option.value.key = '' // key 默认置空则不走缓存
    option.value.title = fileName // 该文件名在下载文档时也将用作文件名
    option.value.url = props.file.file // 定义存储原始查看或编辑的文档的绝对URL
    option.value.fileType = fileType // 文件类型
    option.value.isEdit = props.file.isEdit
    option.value.token = userStore.accessToken || ''
    option.value.user.id = `${userInfo?.userId || ''}`
    option.value.user.name = userInfo?.userName || ''
    option.value.user.image = userInfo?.avatar || ''
    show.value = true // 打开onlyOffice窗口
    console.log('编辑word默认配置参数', option.value)
  }

  // 保存成功回调
  const handleSaveSuccess = (data: any) => {
    emit('saveSuccess', data)
  }

  // 文件变更回调
  const handleChangeFile = (data: any) => {
    emit('changeFile', data)
  }

  // 触发保存（下载文档）
  const triggerSave = () => {
    if (editorRef.value && editorRef.value.docEditor) {
      ElMessageBox.confirm(
        '提交前请确保文档已保存，以免修改丢失。<br/>若已保存，可直接点击「确定」完成提交；若有未保存的修改，请先在编辑器中保存文档后再点击「确定」。',
        '提交确认',
        {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
        .then(async () => {
          editorRef.value.docEditor.downloadAs()
        })
        .catch(() => {
          // 取消删除
        })
    } else {
      console.warn('编辑器未就绪，无法保存')
    }
  }

  // 暴露方法给父组件
  defineExpose({
    triggerSave
  })

  // 监听file变化
  watch(
    () => props.file,
    (newFile) => {
      if (newFile && newFile.fileName && newFile.file) {
        show.value = false
        // 延迟一下确保编辑器已销毁
        setTimeout(() => {
          loadOnlyOffice()
        }, 100)
      }
    },
    { deep: true, immediate: false }
  )

  // 组件挂载时初始化
  onMounted(() => {
    getUser()
    if (props.file && props.file.fileName && props.file.file) {
      loadOnlyOffice()
    }
  })
</script>

<style lang="scss" scoped>
  .qualityManual-container {
    width: 100%;
    height: 100%;
    padding: 0 !important;
  }

  .qualityManual-container-office {
    width: 100%;
    height: 100%;
  }
</style>
