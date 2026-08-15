import { getDictCache } from '@/api/system-manage'
import { defineStore } from 'pinia'
import { ref } from 'vue'

// 字典
export const useDictStore = defineStore('dictStore', () => {
  const dictData: any = ref({})
  const getDictData = async () => {
    try {
      const data: any = await getDictCache()
      const dataC: any = {}
      data?.data?.forEach((item: any) => {
        if (item.status === 1) {
          const itemList = item.itemList.filter((v: any) => v.status === 1)
          dataC[item.dictCode] = itemList?.map((v: any) => ({
            value: v.dictItemCode,
            label: v.dictItemName,
            data: v
          }))
        }
      })
      dictData.value = JSON.parse(JSON.stringify(dataC))
    } catch (error) {
      console.error('获取字典失败:', error)
    }
  }

  return {
    dictData,
    getDictData
  }
})
