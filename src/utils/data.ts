import { brandPageList } from '@/api/basic/brand'
import { categoryPageList } from '@/api/basic/category'
import { companyPageList } from '@/api/finance/company-subject'
import { fetchGetLogisticsList } from '@/api/logistics'
import { getLogisticsChannelList } from '@/api/logistics/logistics-channel'
import { warehousePageAll } from '@/api/logistics/warehouse'
import { ElMessage } from 'element-plus'
import { fetchGetSupplierAll, fetchGetSupplierDetail } from '@/api/supplier'
import {
  dropdownAllCountry,
  dropdownCurrencyApiN,
  getAllStoreInfo,
  getContinents,
  listByCountryCode
} from '@/api/system-manage'
import { getAllUserInfo } from '@/api/userInfo'

// 获取uuid
export const getUuid = () => {
  const s = []
  const hexDigits = '0123456789abcdef'
  for (let i = 0; i < 36; i++) {
    s[i] = hexDigits.substr(Math.floor(Math.random() * 0x10), 1)
  }
  s[14] = '4' // bits 12-15 of the time_hi_and_version field to 0010
  s[19] = hexDigits.substr((s[19] & 0x3) | 0x8, 1) // bits 6-7 of the clock_seq_hi_and_reserved to 01
  s[8] = s[13] = s[18] = s[23] = '-'

  const uuid = s.join('')
  return uuid
}
// 获取采购主体下拉
export const pubGetMainList = async function (
  params: any = { approveStatusList: [2], status: 1 },
  valueKey: string | undefined = 'id'
) {
  const res: any = await companyPageList({ currentPage: 1, pageSize: -1, ...params })
  const newArray = res?.data?.records.map((v: any) => ({
    value: v[valueKey],
    label: v.name,
    data: v
  }))
  return newArray
}
// 获取供应商下拉
export const pubGetSupplierList = async function (
  params?: any,
  valueKey: string | undefined = 'id'
) {
  const res: any = await fetchGetSupplierAll({
    currentPage: 1,
    pageSize: -1,
    approvalStatusList: [2],
    ...params
  })
  const newArray = res?.data?.dtoList.map((v: any) => ({
    value: v[valueKey],
    label: `${v.supplierFullName} (${v.supplierCode})`,
    data: v
  }))
  return newArray
}
// 获取用户下拉
export const pubGetUserList = async function (
  userStateList: number[] = [1],
  valueKey: string | undefined = 'id'
) {
  const res: any = await getAllUserInfo({ userStateList })
  const newArray =
    res?.data?.map((v: any) => ({ value: v[valueKey], label: v.userName, data: v })) || []
  return userStateList
    ? newArray?.filter((v: any) => userStateList.includes(v.data.status))
    : newArray
}
// 获取品牌下拉
export const pubBrandList = async function (params?: any, valueKey: string | undefined = 'id') {
  const res: any = await brandPageList({ currentPage: 1, pageSize: -1, brandStatus: 1, ...params })
  const newArray =
    res?.data?.records?.map((v: any) => ({ value: v[valueKey], label: v.brandName })) || []
  return newArray
}
// 获取分类下拉
export const pubCategoryList = async function (params?: any) {
  const res: any = await categoryPageList({
    status: '1',
    ...params
  })
  const newArray = res?.data || []
  return newArray
}
// 获取店铺下拉
export const pubStoreList = async function (params?: any, valueKey: string | undefined = 'id') {
  const res: any = await getAllStoreInfo({
    status: 1,
    currentPage: 1,
    pageSize: -1,
    ...params
  })
  const newArray =
    res?.data?.dtoList?.map((v: any) => ({ value: v[valueKey], label: v.storeName, data: v })) || []
  return newArray
}
// 获取店铺下拉
export const pubStoreListN = async function (params?: any, valueKey: string | undefined = 'id') {
  const res: any = await listByCountryCode({
    status: 1,
    currentPage: 1,
    pageSize: -1,
    ...params
  })
  const newArray = res?.data?.map((v: any) => ({ value: v[valueKey], label: v.storeName })) || []
  console.log(newArray, 'newArraynewArray')
  return newArray
}
// 获取所有国家（兼容多种接口返回格式：按洲对象、按洲数组）
export const pubCountryList = async () => {
  try {
    const res: any = await dropdownAllCountry()
    const raw = res?.data ?? res ?? {}
    const allCountries: Array<{
      label: string
      value: string
      regionCode?: string
      code?: string
      name: string
    }> = []

    const pushCountry = (country: any, regionCode?: string) => {
      const name = country?.countryName ?? country?.countryCn ?? country?.name ?? ''
      const value = country?.shortCountryName ?? country?.code ?? String(country?.id ?? '')
      if (!name && !value) return
      allCountries.push({
        label: name || value,
        value: value || name,
        regionCode,
        code: country?.shortCountryName ?? country?.code,
        name: name || value
      })
    }

    // 格式1：res.data 为数组（按洲列表 [{ continentEn, countries: [...] }]）
    if (Array.isArray(raw)) {
      raw.forEach((region: any) => {
        const regionCode = region?.continentEn ?? region?.regionCode ?? ''
        const countries = region?.countries ?? region?.list ?? []
        if (Array.isArray(countries)) {
          countries.forEach((country: any) => pushCountry(country, regionCode))
        }
      })
      return allCountries
    }

    // 格式2：res.data 为对象（按洲 key -> 国家数组 { "EU": [...], "NA": [...] }）
    if (typeof raw === 'object') {
      Object.keys(raw).forEach((regionCode) => {
        const countries = raw[regionCode]
        if (Array.isArray(countries)) {
          countries.forEach((country: any) => pushCountry(country, regionCode))
        }
      })
    }

    // 若 all-country 返回数量过少，改用七大洲接口拉全量（与 SPU/物流等一致，避免下拉不全）
    if (allCountries.length < 30) {
      try {
        const continentsRes: any = await getContinents()
        const continents = Array.isArray(continentsRes?.data)
          ? continentsRes.data
          : Array.isArray(continentsRes)
            ? continentsRes
            : []
        allCountries.length = 0
        continents.forEach((region: any) => {
          const regionCode = region?.continentEn ?? region?.regionCode ?? ''
          const countries = region?.countries ?? []
          if (Array.isArray(countries)) {
            countries.forEach((country: any) => pushCountry(country, regionCode))
          }
        })
      } catch (e2) {
        console.log(e2)
      }
    }

    return allCountries
  } catch (e) {
    console.log(e)
    return []
  }
}
// 获取仓库下拉
export const pubWarehouseList = async function (params?: any, valueKey: string | undefined = 'id') {
  const res: any = await warehousePageAll({
    currentPage: 1,
    pageSize: -1,
    ...params,
    enableStatus: 1
  })
  const rawList =
    res?.data?.dtoList ?? res?.data?.records ?? (Array.isArray(res?.data) ? res.data : null) ?? []
  const list = Array.isArray(rawList) ? rawList : []
  const vk = valueKey ?? 'id'
  const newArray = list.map((v: any, idx: number) => {
    const value = v[vk] ?? v.id ?? v.code ?? v.warehouseId
    const label =
      v.warehouseName ??
      v.name ??
      v.shortName ??
      v.warehouseCode ??
      (value != null && value !== '' ? String(value) : `仓库${idx + 1}`)
    return {
      value,
      label,
      data: v
    }
  })
  return newArray
}
// 币种下拉
export const pubCurrencyList = async function () {
  const res: any = await dropdownCurrencyApiN()
  const newArray = res?.data.map((v: any) => ({
    ...v,
    value: v.currencyCode,
    label: v.currencyCode
  }))
  return newArray
}
// 供应商详情（采购订单/更新单等通过此方法调用，失败时在此统一提示一次，因 API 已关闭 showErrorMessage）
export const pubSupplierDetail = async (supplierId: any) => {
  try {
    const res: any = await fetchGetSupplierDetail(supplierId)
    const data = res?.data

    // 获取默认联系人信息
    const defaultContact =
      data?.concatItems?.find((c: any) => c.isDefault === 1) || data?.concatItems?.[0]

    // 获取默认收款账户信息
    const defaultPayment =
      data?.paymentItems?.find((p: any) => p.isDefault === 1) || data?.paymentItems?.[0]

    // 映射 API 响应到 SupplierItem 格式
    const detail: any = {
      ...data,
      supplierId,
      supplierCode: data.supplierCode,
      supplierName: data.supplierFullName,
      shortName: data.supplierShortName,
      supplierAddress: data.companyAddress || '',
      contactPerson: defaultContact?.contactName || '',
      contactPhone: defaultContact?.mobile || '',
      contactEmail: defaultContact?.email || '',
      bankName: defaultPayment?.bankName || '',
      bankAccountName: defaultPayment?.bankAccountName || '',
      bankAccountNumber: defaultPayment?.bankAccount || '',
      taxNumber: data.unifiedSocialCreditCode || '',
      paymentTermDays: data.paymentPeriod,
      attachments: data.attachment
        ? data.attachment.split(',').map((url: string) => ({
            name: url.split('/').pop() || '',
            url: url,
            type: '',
            size: 0
          }))
        : [],
      cooperationStatus: data.cooperationStatus || '',
      feishuGroup: data.feishuGroup || '',
      status: !data.isDeleted,
      createTime: data.createTime || '',
      purchaser: data.purchasers,
      warehouseId: data?.warehouseList?.[0]?.id,
      warehouseName: data?.warehouseList?.[0]?.warehouseName,
      warehouseAddress: data?.warehouseList?.[0]?.address
    }
    return detail
  } catch (error: any) {
    ElMessage.error(error?.message || '获取供应商详情失败')
    return null
  }
}

// 获取币种symbol
export const getCurrencySymbol = (currencyCode: any, currencyList?: any[]): string => {
  if (!currencyCode) {
    return '¥'
  }
  if (currencyList && currencyList.length > 0) {
    const currency = currencyList.find((c: any) => c.value === currencyCode)

    if (currency) {
      const symbol = currency.symbol || '¥'
      return symbol
    }
  }
  return '¥'
}
// 获取币种名称
export const getCurrencyName = (currencyCode: string, currencyList?: any[]) => {
  if (!currencyCode) return '-'
  if (currencyList && currencyList.length > 0) {
    const currency = currencyList.find((c: any) => c.value === currencyCode)
    return currency?.name || currencyCode
  }
  return currencyCode
}
// 物流渠道
export const pubGetLogisticsChannel = async function (
  params?: any,
  valueKey: string | undefined = 'id'
) {
  const res: any = await getLogisticsChannelList({
    statusList: [1],
    currentPage: 1,
    pageSize: -1,
    ...params
  })
  const newArray =
    res?.data?.records?.map((v: any) => ({ value: v[valueKey], label: v.channelName })) || []
  return newArray
}
// 物流商
export const pubGetLogistics = async function (params?: any, valueKey: string | undefined = 'id') {
  const res: any = await fetchGetLogisticsList({
    cooperationStatusList: [2],
    currentPage: 1,
    pageSize: -1,
    ...params
  })
  const newArray =
    res?.data?.records?.map((v: any) => ({ value: v[valueKey], label: v.fullName })) || []
  return newArray
}
