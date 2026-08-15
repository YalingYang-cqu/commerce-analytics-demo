import type { App, Directive, DirectiveBinding } from 'vue'

const directive: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding) {
    el.style[binding.arg] = binding.value
  }
}

export function setupCustomStyleDirective(app: App): void {
  app.directive('customStyle', directive)
}
