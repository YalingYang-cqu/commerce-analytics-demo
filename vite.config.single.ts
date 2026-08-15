/**
 * 单文件（single HTML）构建配置
 * 产出：dist-single/index.html —— 所有 JS/CSS/字体/图片全部内联，可直接双击离线打开
 */
import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'
import { fileURLToPath } from 'url'
import Components from 'unplugin-vue-components/vite'
import AutoImport from 'unplugin-auto-import/vite'
import ElementPlus from 'unplugin-element-plus/vite'
import { ElementPlusResolver } from 'unplugin-vue-components/resolvers'

/** 离线单文件：移除依赖 CDN 的外链脚本，并替换标题 */
function offlineIndexHtml() {
  return {
    name: 'offline-index-html',
    transformIndexHtml(html: string) {
      return html
        .replace(/<script[^>]*aliyun-oss-sdk[^>]*><\/script>/g, '')
        .replace(/<title>[\s\S]*?<\/title>/, '<title>成本中心 · 批次结存 / 库存成本流水</title>')
    }
  }
}

export default ({ mode }: { mode: string }) => {
  const root = process.cwd()
  const env = loadEnv(mode, root)
  const { VITE_VERSION } = env

  return defineConfig({
    define: {
      __APP_VERSION__: JSON.stringify(VITE_VERSION)
    },
    base: './',
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@views': resolvePath('src/views'),
        '@imgs': resolvePath('src/assets/img'),
        '@icons': resolvePath('src/assets/icons'),
        '@utils': resolvePath('src/utils'),
        '@stores': resolvePath('src/store'),
        '@plugins': resolvePath('src/plugins'),
        '@styles': resolvePath('src/assets/styles')
      }
    },
    build: {
      target: 'es2020',
      outDir: 'dist-single',
      emptyOutDir: true,
      cssCodeSplit: false,
      chunkSizeWarningLimit: 100000,
      assetsInlineLimit: 1024 * 1024 * 100,
      minify: 'terser',
      terserOptions: {
        compress: { drop_console: true, drop_debugger: true }
      },
      dynamicImportVarsOptions: {
        warnOnError: true,
        exclude: [],
        include: ['src/views/**/*.vue']
      },
      rollupOptions: {
        output: { inlineDynamicImports: true }
      }
    },
    plugins: [
      offlineIndexHtml(),
      vue(),
      AutoImport({
        imports: ['vue', 'vue-router', 'pinia', '@vueuse/core'],
        dts: 'src/types/auto-imports.d.ts',
        resolvers: [ElementPlusResolver()]
      }),
      Components({
        dts: 'src/types/components.d.ts',
        resolvers: [ElementPlusResolver()]
      }),
      ElementPlus({ useSource: true })
    ],
    css: {
      preprocessorOptions: {
        scss: {
          additionalData: `
            @use "@styles/el-light.scss" as *; 
            @use "@styles/variables.scss" as *; 
            @use "@styles/mixin.scss" as *;
          `
        }
      },
      postcss: {
        plugins: [
          {
            postcssPlugin: 'internal:charset-removal',
            AtRule: {
              charset: (atRule) => {
                if (atRule.name === 'charset') {
                  atRule.remove()
                }
              }
            }
          }
        ]
      }
    }
  })
}

function resolvePath(paths: string) {
  return path.resolve(__dirname, paths)
}
