import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useTableStore = defineStore(
  'newTableStore',
  () => {
    // 全局菜单及权限配置
    const mensPageBtnPermArr = ref<string[]>()

    const getMenusPageBtnPermArr = () => {
      return mensPageBtnPermArr.value
    }

    const setMensPageBtnPermArr = (params: string[]) => {
      mensPageBtnPermArr.value = params
    }

    return {
      mensPageBtnPermArr,
      getMenusPageBtnPermArr,
      setMensPageBtnPermArr
    }
  },
  {
    persist: {
      key: 'newTable',
      storage: localStorage
    }
  }
)
