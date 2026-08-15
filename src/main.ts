import App from './App.vue'
import { createApp } from 'vue'
import { initStore } from './store'                 // Store
import { initRouter } from './router'               // Router
import language from './locales'                    // 国际化
import VxeUI from 'vxe-pc-ui'                       //  虚拟表格
import 'vxe-pc-ui/lib/style.css'
import VxeUITable from 'vxe-table'
import 'vxe-table/lib/style.css'
import VxeUIPluginRenderElement from '@vxe-ui/plugin-render-element'// 扩展插件
import '@vxe-ui/plugin-render-element/dist/style.css'           
import '@styles/reset.scss'                         // 重置HTML样式
import '@styles/app.scss'                           // 全局样式
import '@styles/el-ui.scss'                         // 优化 Element 样式
import '@styles/mobile.scss'                        // 移动端样式优化
import '@styles/change.scss'                        // 主题切换过渡优化
import '@styles/theme-animation.scss'               // 主题切换动画
import '@styles/el-dark.scss'                       // Element 暗黑主题
import '@styles/dark.scss'                          // 系统主题
import '@styles/vxeTable.scss'                      // 虚拟列表样式
import '@icons/system/iconfont.css'                 // 系统图标
import '@icons/custom/iconfont.css'                 // 自定义图标
import '@icons/iconfont/iconfont.css'                 // 自定义图标
import '@icons/icon/iconfont.css'                   // 自定义图标
import '@utils/sys/console.ts'                      // 控制台输出内容
import './assets/styles/_ele-override.scss'
import { setupGlobDirectives } from './directives'
import { setupErrorHandle } from './utils/sys/error-handle'
import { MOCK_ENABLED } from './mock/config'

// 仅在生产环境禁用console方法，开发环境保留用于调试
const isDev = import.meta.env.DEV

document.addEventListener(
  'touchstart',
  function () {},
  { passive: false }
)

async function bootstrap() {
  // 在路由初始化前安装本地 Mock，保证 Demo 不依赖后端服务。
  if (MOCK_ENABLED) {
    const [{ installMockAdapter }, { axiosInstance }] = await Promise.all([
      import('./mock/adapter'),
      import('./utils/http')
    ])
    installMockAdapter(axiosInstance)
  }

  const app = createApp(App)

  // 开发环境启用Vue DevTools
  // @ts-expect-error - devtools is not defined in the AppConfig type
  app.config.devtools = isDev

  initStore(app)
  initRouter(app)
  setupGlobDirectives(app)
  setupErrorHandle(app)
  VxeUI.use(VxeUIPluginRenderElement)
  app.use(language).use(VxeUI).use(VxeUITable)
  app.mount('#app')
}

bootstrap().catch((err) => {
  console.error('[bootstrap] 应用初始化失败：', err)
})
