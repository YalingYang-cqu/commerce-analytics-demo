/** 外部系统入口；作品集 Demo 中禁用真实跳转。 */
import { ref } from 'vue'
import { ElMessage } from 'element-plus'

export function useLingxingSso() {
  const loading = ref(false)

  const handleLingxingSsoLogin = async () => {
    ElMessage.info('本地演示版未启用外部系统登录')
    return false
  }

  return {
    loading,
    handleLingxingSsoLogin
  }
}
