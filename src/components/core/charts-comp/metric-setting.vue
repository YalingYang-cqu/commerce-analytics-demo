<!-- 添加指标：点击按钮在下方弹出配置面板，按分组勾选指标，选中按顺序分配颜色，支持最大可选个数 -->
<template>
  <div class="metric-setting">
    <el-popover
      v-model:visible="visible"
      :width="width"
      placement="bottom-end"
      trigger="click"
      popper-class="metric-setting-popover"
    >
      <template #reference>
        <div class="ms-add-btn" :class="{ 'is-active': visible }">
          <el-icon><Plus /></el-icon>
          <span>{{ buttonText }}</span>
        </div>
      </template>

      <div class="ms-panel">
        <div class="ms-head">
          <span class="ms-title">{{ title }}（最多 {{ max }} 个）</span>
          <span class="ms-count">已选 {{ selected.length }}/{{ max }}</span>
        </div>
        <div class="ms-body">
          <template v-for="g in groups" :key="g.key">
            <div class="ms-group-title">{{ g.title }}</div>
            <div class="ms-grid">
              <div
                v-for="m in g.items"
                :key="m.key"
                class="ms-item"
                :class="{ 'is-active': isSelected(m.key), 'is-disabled': isDisabled(m.key) }"
                :style="{ '--dot': colorOf(m.key) }"
                @click="toggle(m.key)"
              >
                <span class="ms-dot"></span>
                <span class="ms-label" :title="m.label">{{ m.label }}</span>
              </div>
            </div>
          </template>
          <div v-if="!groups.length" class="ms-empty">暂无可选指标</div>
        </div>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Plus } from '@element-plus/icons-vue'
  import { type MetricGroup, DEFAULT_METRIC_PALETTE, resolveMetricColor } from './types'

  defineOptions({ name: 'MetricSetting' })

  interface Props {
    /** 指标分组配置 */
    groups: MetricGroup[]
    /** 最大可选个数 */
    max?: number
    /** 配色（按选中顺序分配，需与图表共用同一套以保证颜色一致） */
    palette?: string[]
    /** 触发按钮文案 */
    buttonText?: string
    /** 面板标题 */
    title?: string
    /** 面板宽度 */
    width?: number
  }

  const props = withDefaults(defineProps<Props>(), {
    max: 4,
    palette: () => DEFAULT_METRIC_PALETTE,
    buttonText: '添加指标',
    title: '选择对比指标',
    width: 460
  })

  /** 选中指标 key（有序，顺序即配色顺序） */
  const selected = defineModel<string[]>({ default: () => [] })
  const visible = defineModel<boolean>('visible', { default: false })

  const isSelected = (key: string): boolean => selected.value.includes(key)
  const isDisabled = (key: string): boolean =>
    !isSelected(key) && selected.value.length >= props.max

  /**
   * 指标 → 颜色 的稳定映射：首次选中时分配一个未占用颜色，选中期间固定不变，
   * 移除某指标不影响其余指标颜色（移除项颜色回收，供后续新增复用）。
   */
  const colorMap = ref<Record<string, string>>({})
  watch(
    selected,
    (keys) => {
      const map: Record<string, string> = {}
      keys.forEach((k) => {
        if (colorMap.value[k]) map[k] = colorMap.value[k]
      })
      const used = new Set(Object.values(map))
      keys.forEach((k) => {
        if (map[k]) return
        const free =
          props.palette.find((c) => !used.has(c)) ?? resolveMetricColor(used.size, props.palette)
        map[k] = free
        used.add(free)
      })
      colorMap.value = map
    },
    { immediate: true, deep: true }
  )

  /** 选中项颜色（按 key 固定）；未选中给灰色占位 */
  const colorOf = (key: string): string => colorMap.value[key] ?? '#dcdfe6'

  const toggle = (key: string): void => {
    if (isSelected(key)) {
      selected.value = selected.value.filter((k) => k !== key)
      return
    }
    if (selected.value.length >= props.max) {
      ElMessage.warning(`最多可选 ${props.max} 个指标`)
      return
    }
    selected.value = [...selected.value, key]
  }

  // 暴露给父级（可选）
  const count = computed(() => selected.value.length)
  defineExpose({ count })
</script>

<style lang="scss" scoped>
  .metric-setting {
    display: inline-flex;
  }

  .ms-add-btn {
    display: inline-flex;
    gap: 4px;
    align-items: center;
    height: 28px;
    padding: 0 12px;
    font-size: 13px;
    color: var(--el-color-primary);
    cursor: pointer;
    background: var(--el-color-primary-light-9);
    border: 1px solid var(--el-color-primary-light-5);
    border-radius: 6px;
    transition: all 0.2s;

    &:hover,
    &.is-active {
      background: var(--el-color-primary-light-8);
      border-color: var(--el-color-primary);
    }
  }
</style>

<style lang="scss">
  // popover 内容在 body 下，使用全局样式
  .metric-setting-popover.el-popover.el-popper {
    padding: 0;

    .ms-head {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-bottom: 1px solid var(--el-border-color-lighter);

      .ms-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--art-gray-900, #303133);
      }

      .ms-count {
        font-size: 12px;
        color: var(--art-gray-500, #909399);
      }
    }

    .ms-body {
      max-height: 360px;
      padding: 8px 16px 14px;
      overflow-y: auto;
    }

    .ms-group-title {
      padding: 10px 0 6px;
      font-size: 12px;
      color: var(--art-gray-500, #909399);
    }

    .ms-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    .ms-item {
      display: flex;
      gap: 6px;
      align-items: center;
      height: 30px;
      padding: 0 10px;
      cursor: pointer;
      background: var(--el-fill-color-light);
      border: 1px solid transparent;
      border-radius: 6px;
      transition: all 0.2s;

      .ms-dot {
        flex: 0 0 auto;
        width: 8px;
        height: 8px;
        background: var(--dot);
        border-radius: 50%;
      }

      .ms-label {
        overflow: hidden;
        font-size: 13px;
        color: var(--art-gray-700, #606266);
        text-overflow: ellipsis;
        white-space: nowrap;
      }

      &:hover {
        background: var(--el-color-primary-light-9);
      }

      &.is-active {
        background: var(--el-color-primary-light-9);
        border-color: var(--dot);

        .ms-label {
          font-weight: 600;
          color: var(--dot);
        }
      }

      &.is-disabled {
        cursor: not-allowed;
        opacity: 0.45;

        &:hover {
          background: var(--el-fill-color-light);
        }
      }
    }

    .ms-empty {
      padding: 24px 0;
      font-size: 13px;
      color: var(--art-gray-500, #909399);
      text-align: center;
    }
  }
</style>
