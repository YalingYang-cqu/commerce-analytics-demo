import html2canvas from 'html2canvas'
import { saveAs } from 'file-saver'

export interface ExportElementImageOptions {
  /** 导出文件名（含 .png 后缀） */
  filename: string
  /** 缩放倍数，默认 2 */
  scale?: number
}

/**
 * 内部基于 el-scrollbar / overflow:auto 的容器，截图时需要摊平
 * 否则 scrollHeight 只会是"可视高度"，导致底部内容被裁
 */
const FLATTEN_SELECTORS = [
  '.drawer-body',
  '.dialog-body__inner',
  '.art-table',
  '.el-table',
  '.el-table__inner-wrapper',
  '.el-table__body-wrapper',
  '.el-scrollbar',
  '.el-scrollbar__wrap',
  '.el-scrollbar__view'
].join(',')

interface StyleBackup {
  el: HTMLElement
  overflow: string
  maxHeight: string
  height: string
}

/** 临时把根 + 内部限高/滚动容器置为自适应，返回还原句柄 */
function flattenLiveDom(root: HTMLElement): StyleBackup[] {
  const targets: HTMLElement[] = [root]
  root.querySelectorAll<HTMLElement>(FLATTEN_SELECTORS).forEach((el) => targets.push(el))

  return targets.map((el) => {
    const backup: StyleBackup = {
      el,
      overflow: el.style.overflow,
      maxHeight: el.style.maxHeight,
      height: el.style.height
    }
    el.style.overflow = 'visible'
    el.style.maxHeight = 'none'
    el.style.height = 'auto'
    return backup
  })
}

function restoreLiveDom(backups: StyleBackup[]): void {
  backups.forEach(({ el, overflow, maxHeight, height }) => {
    el.style.overflow = overflow
    el.style.maxHeight = maxHeight
    el.style.height = height
  })
}

/**
 * 将 DOM 节点导出为 PNG 并触发下载（支持内部 ECharts canvas）
 *
 * 关键点：必须先在活动 DOM 上摊平滚动/限高容器，再读 scrollWidth / scrollHeight，
 * 否则 html2canvas 画布尺寸会按"可视高度"计算，超出部分会被裁掉
 */
export async function exportElementToPng(
  element: HTMLElement,
  options: ExportElementImageOptions
): Promise<void> {
  const scale = options.scale ?? 2

  const backups = flattenLiveDom(element)
  try {
    // 等一帧让浏览器完成重新布局，scrollHeight 才能反映真实内容高度
    await new Promise((resolve) => requestAnimationFrame(() => resolve(undefined)))

    const fullWidth = element.scrollWidth
    const fullHeight = element.scrollHeight

    const canvas = await html2canvas(element, {
      backgroundColor: '#ffffff',
      scale,
      useCORS: true,
      logging: false,
      width: fullWidth,
      height: fullHeight,
      windowWidth: fullWidth,
      windowHeight: fullHeight,
      ignoreElements: (el) =>
        el.classList.contains('el-loading-mask') || el.classList.contains('el-loading-spinner'),
      onclone: (clonedDoc) => {
        clonedDoc.querySelectorAll('.el-loading-mask, .el-loading-spinner').forEach((node) => {
          node.parentNode?.removeChild(node)
        })
        // 双保险：克隆侧再摊平一次，防止部分样式被克隆环境重写
        clonedDoc.querySelectorAll(FLATTEN_SELECTORS).forEach((node) => {
          if (node instanceof HTMLElement) {
            node.style.overflow = 'visible'
            node.style.maxHeight = 'none'
            node.style.height = 'auto'
          }
        })
      }
    })

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((b) => resolve(b), 'image/png')
    })

    if (!blob) {
      throw new Error('生成图片失败')
    }

    saveAs(blob, options.filename.endsWith('.png') ? options.filename : `${options.filename}.png`)
  } finally {
    restoreLiveDom(backups)
  }
}
