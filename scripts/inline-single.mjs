/**
 * 将 vite 构建产物（dist-single）合并为一个可离线双击打开的 HTML 文件。
 * 用法：node scripts/inline-single.mjs [outFile]
 */
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distDir = path.join(root, 'dist-single')
const outFile = process.argv[2] || path.join(root, '成本中心-批次结存与库存成本流水.html')

const htmlPath = path.join(distDir, 'index.html')
let html = fs.readFileSync(htmlPath, 'utf8')

const readAsset = (url) => {
  const rel = url.replace(/^\.?\//, '').split('?')[0]
  const file = path.join(distDir, rel)
  if (!fs.existsSync(file)) throw new Error(`missing asset: ${url}`)
  return fs.readFileSync(file, 'utf8')
}

// 内联样式表
html = html.replace(
  /<link[^>]*rel="stylesheet"[^>]*href="([^"]+)"[^>]*>/g,
  (_m, href) => `<style>\n${readAsset(href)}\n</style>`
)

// 内联脚本：保留 module 类型（内联 module 在 file:// 下可正常执行）
html = html.replace(/<script([^>]*)src="([^"]+)"([^>]*)><\/script>/g, (_m, pre, src, post) => {
  if (/^https?:/.test(src)) return ''
  const isModule = /type="module"/.test(pre + post)
  return `<script${isModule ? ' type="module"' : ''}>\n${readAsset(src)}\n</script>`
})

html = html.replace(/<link[^>]*rel="modulepreload"[^>]*>/g, '')

const leftovers = [...html.matchAll(/(?:src|href)="(\.\/assets\/[^"]+)"/g)].map((m) => m[1])
if (leftovers.length) {
  console.warn('⚠️ 仍有未内联的外部引用：', [...new Set(leftovers)].join(', '))
}

fs.writeFileSync(outFile, html)
const mb = (fs.statSync(outFile).size / 1024 / 1024).toFixed(2)
console.log(`✅ 单文件已生成：${outFile} (${mb} MB)`)
