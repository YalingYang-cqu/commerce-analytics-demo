import { AppRouteRecord } from '@/types/router'

export const downloadCenterRoutes: AppRouteRecord = {
  path: '/download-center',
  name: 'DownloadCenter',
  component: '/system/download-center',
  meta: {
    title: '下载中心',
    keepAlive: true,
    isHide: true
  }
}
