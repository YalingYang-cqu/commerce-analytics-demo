import type { App } from 'vue'
import { setupAuthDirective } from './auth'
import { setupHighlightDirective } from './highlight'
import { setupRippleDirective } from './ripple'
import { setupRolesDirective } from './roles'
import { setupCustomStyleDirective } from './customStyle'
import { setupBtnReClickDirective } from './btnReClick'

export function setupGlobDirectives(app: App) {
  setupAuthDirective(app) // 权限指令
  setupRolesDirective(app) // 角色权限指令
  setupHighlightDirective(app) // 高亮指令
  setupRippleDirective(app) // 水波纹指令
  setupCustomStyleDirective(app) // 樣式指令
  setupBtnReClickDirective(app) // 防重复点击指令
}
