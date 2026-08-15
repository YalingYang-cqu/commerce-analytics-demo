import { defineStore } from 'pinia'
import { ref } from 'vue'

interface SelectOption {
  value: string
  label?: string
  sellerId?: string
  [key: string]: any
}
export const useDropListStore = defineStore('useDropListStore', () => {
  const countryList = ref<SelectOption[]>([])

  const getCountryList = () => countryList

  const setCountryList = (params: Array<SelectOption>): void => {
    if (!params || params.length == 0) countryList.value = []
    countryList.value = params
  }
  return {
    countryList,
    getCountryList,
    setCountryList
  }
})
