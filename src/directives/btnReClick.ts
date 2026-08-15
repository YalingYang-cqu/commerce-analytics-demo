import type { App, Directive, DirectiveBinding } from 'vue'

/**
 * 防重复点击指令
 * 用于防止按钮在短时间内被重复点击
 * 用法：
 * <el-button v-btnReClick>按钮</el-button>
 * <el-button v-btnReClick="2000">按钮（2秒内不可重复点击）</el-button>
 */
const btnReClickDirective: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    let isClicking = false
    const delay = binding.value || 1000 // 默认1秒内不允许重复点击

    const handleClick = (event: MouseEvent) => {
      if (isClicking) {
        // 如果正在处理点击，阻止事件
        event.preventDefault()
        event.stopPropagation()
        return false
      }

      // 标记为正在点击
      isClicking = true

      // 设置定时器，在指定时间后允许再次点击
      setTimeout(() => {
        isClicking = false
      }, delay)

      // 允许事件继续传播，执行原始的点击处理
      return true
    }

    // 保存处理函数到元素上，以便在卸载时移除
    ;(el as any).__btnReClickHandler = handleClick

    // 添加点击事件监听器
    el.addEventListener('click', handleClick, true) // 使用捕获阶段，确保先执行
  },
  unmounted(el: HTMLElement) {
    // 移除事件监听器
    const handler = (el as any).__btnReClickHandler
    if (handler) {
      el.removeEventListener('click', handler, true)
      delete (el as any).__btnReClickHandler
    }
  }
}

export function setupBtnReClickDirective(app: App): void {
  app.directive('btnReClick', btnReClickDirective)
}
