<!-- 卡片设置：点击齿轮在下方弹出配置面板；按分组勾选指标、组内拖拽排序、每组限制最大可选量；确定保存用户习惯 -->
<template>
  <el-popover
    v-model:visible="visible"
    :width="width"
    placement="bottom-end"
    trigger="click"
    popper-class="card-setting-popover"
  >
    <template #reference>
      <div class="cs-gear" :class="{ 'is-active': visible }" :title="title">
        <el-icon><Setting /></el-icon>
      </div>
    </template>

    <div class="cs-panel">
      <div class="cs-body">
        <div v-for="g in groups" :key="g.key" class="cs-group">
          <!-- 分组标题：共 N 个 · 已选 x/max（已满给出提示） -->
          <div class="cs-group-head">
            <span class="cs-group-title">{{ g.title }}</span>
            <span class="cs-group-meta"
              >· 共 {{ g.items.length }} 个 · 已选 {{ countOf(g) }}/{{ maxOf(g) }}</span
            >
            <span v-if="isFull(g)" class="cs-group-full">已满，请先取消一项</span>
          </div>

          <!-- 组内拖拽排序：已满时未选项禁用勾选，但仍可拖拽 -->
          <draggable
            v-model="draftLists[g.key]"
            :item-key="itemKey"
            tag="div"
            class="cs-grid"
            :animation="160"
            ghost-class="cs-opt-ghost"
          >
            <template v-for="m in draftLists[g.key]" :key="m.key">
              <div class="cs-opt" :class="{ 'is-disabled': isDisabled(g, m.key) }">
                <el-checkbox
                  :model-value="isChecked(m.key)"
                  :disabled="isDisabled(g, m.key)"
                  @change="(v: CheckboxValueType) => toggle(g, m.key, Boolean(v))"
                >
                  {{ m.label }}
                </el-checkbox>
              </div>
            </template>
          </draggable>
        </div>
        <div v-if="!groups.length" class="cs-empty">暂无可配置指标</div>
      </div>

      <div class="cs-foot">
        <div class="cs-foot-summary">
          <span v-for="g in groups" :key="g.key" class="cs-foot-item">
            {{ shortTitle(g.title) }} <b>{{ countOf(g) }}</b
            >/{{ maxOf(g) }}
          </span>
        </div>
        <div class="cs-foot-btns">
          <el-button size="small" @click="resetDefault">恢复默认</el-button>
          <el-button size="small" @click="visible = false">取消</el-button>
          <el-button type="primary" size="small" :loading="saving" @click="onConfirm"
            >确定</el-button
          >
        </div>
      </div>
    </div>
  </el-popover>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElMessage, type CheckboxValueType } from 'element-plus'
  import { Setting } from '@element-plus/icons-vue'
  import { VueDraggableNext as draggable } from 'vue-draggable-next'
  import { saveUserHabitsApi, getHabitsApi } from '@/api/system-manage'
  import {
    type CardGroup,
    type CardMetric,
    type CardLayoutState,
    buildDefaultLayout,
    mergeLayout
  } from '../types'

  defineOptions({ name: 'CardSetting' })

  interface Props {
    /** 指标分组配置（含 max / format / tooltip / defaultSelected） */
    groups: CardGroup[]
    /** 习惯存储名（与路由组合成唯一 key） */
    name: string
    /** 未配置 max 时的兜底最大可选量 */
    defaultMax?: number
    /** 面板宽度 */
    width?: number
    /** 标题（齿轮 hover 提示） */
    title?: string
    /** 是否自动从接口加载习惯 */
    autoLoad?: boolean
  }

  const props = withDefaults(defineProps<Props>(), {
    defaultMax: 5,
    width: 560,
    title: '指标设置',
    autoLoad: true
  })

  /** 对外的布局结果（供 items.vue 消费） */
  const model = defineModel<CardLayoutState>({ default: () => ({ orders: {}, selected: [] }) })
  const visible = ref(false)
  const saving = ref(false)

  const route = useRoute()
  const habitKey = (): string => `${props.name}${route.path.replace(/\//g, '_')}`

  // ===== 弹层内草稿：组内有序列表 + 选中集合（确定才提交到 model） =====
  const draftLists = ref<Record<string, CardMetric[]>>({})
  const draftSelected = ref<string[]>([])

  const itemKey = (m: CardMetric): string => m.key

  /** 用布局回填草稿 */
  const loadDraft = (layout: CardLayoutState): void => {
    const lists: Record<string, CardMetric[]> = {}
    props.groups.forEach((g) => {
      const byKey = new Map(g.items.map((i) => [i.key, i]))
      const order = layout.orders[g.key] || g.items.map((i) => i.key)
      lists[g.key] = order.map((k) => byKey.get(k)).filter((m): m is CardMetric => !!m)
    })
    draftLists.value = lists
    draftSelected.value = [...layout.selected]
  }

  /** 由草稿构建布局 */
  const buildLayout = (): CardLayoutState => ({
    orders: Object.fromEntries(
      props.groups.map((g) => [g.key, (draftLists.value[g.key] || []).map((i) => i.key)])
    ),
    selected: [...draftSelected.value]
  })

  // ===== 计算/操作 =====
  const maxOf = (g: CardGroup): number => g.max ?? props.defaultMax
  const countOf = (g: CardGroup): number =>
    g.items.reduce((n, i) => (draftSelected.value.includes(i.key) ? n + 1 : n), 0)
  const isFull = (g: CardGroup): boolean => countOf(g) >= maxOf(g)
  const isChecked = (key: string): boolean => draftSelected.value.includes(key)
  const isDisabled = (g: CardGroup, key: string): boolean => !isChecked(key) && isFull(g)
  const shortTitle = (t: string): string => t.replace(/指标$/, '')

  const toggle = (g: CardGroup, key: string, checked: boolean): void => {
    if (checked) {
      if (isFull(g)) {
        ElMessage.warning(`${g.title}最多可选 ${maxOf(g)} 个`)
        return
      }
      if (!draftSelected.value.includes(key)) draftSelected.value.push(key)
    } else {
      draftSelected.value = draftSelected.value.filter((k) => k !== key)
    }
  }

  /** 恢复默认：草稿回到初始顺序与勾选（确定后才持久化） */
  const resetDefault = (): void => loadDraft(buildDefaultLayout(props.groups))

  /** 确定：提交草稿到 model 并保存习惯 */
  const onConfirm = async (): Promise<void> => {
    const layout = buildLayout()
    model.value = layout
    hasSavedHabit.value = true
    saving.value = true
    try {
      const res: any = await saveUserHabitsApi({
        key: habitKey(),
        habits: JSON.stringify(layout)
      })
      if (res?.code === 200) ElMessage.success('保存成功')
      else ElMessage.error('保存失败')
    } catch {
      ElMessage.error('保存失败')
    } finally {
      saving.value = false
      visible.value = false
    }
  }

  /** 是否已加载到「已保存习惯」：为 true 时不再用默认覆盖（避免冲掉用户习惯） */
  const hasSavedHabit = ref(false)

  /** 加载习惯：有保存用保存的，否则用默认 */
  const loadHabits = async (): Promise<void> => {
    let layout = buildDefaultLayout(props.groups)
    hasSavedHabit.value = false
    if (props.autoLoad) {
      try {
        const res: any = await getHabitsApi(habitKey())
        if (res?.code === 200 && res?.data) {
          layout = mergeLayout(props.groups, JSON.parse(res.data))
          hasSavedHabit.value = true
        }
      } catch {
        /* 读取失败用默认 */
      }
    }
    model.value = layout
    loadDraft(layout)
  }

  /**
   * 指标池异步补齐修正：分组指标由接口异步返回，onMounted 时 props.groups 可能仍是切换前渠道的旧池，
   * 导致按 defaultSelected 计算的默认漏选当前渠道独有指标。仅在「未加载到已保存习惯」时，
   * 待分组变化（池补齐）后按最新分组重算默认，弹层打开中则不打扰用户草稿。
   */
  watch(
    () => props.groups,
    () => {
      if (hasSavedHabit.value || visible.value) return
      const layout = buildDefaultLayout(props.groups)
      model.value = layout
      loadDraft(layout)
    },
    { deep: true }
  )

  // 打开弹层时用当前已提交布局回填草稿（取消即丢弃草稿改动）
  watch(visible, (v) => {
    if (v) loadDraft(model.value)
  })

  // 同步初始化草稿，避免弹层首次渲染时拖拽列表为空
  loadDraft(buildDefaultLayout(props.groups))

  onMounted(loadHabits)
</script>

<style lang="scss" scoped>
  .cs-gear {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    color: var(--art-gray-600, #606266);
    cursor: pointer;
    background: var(--el-fill-color-light);
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 6px;
    transition: all 0.2s;

    &:hover,
    &.is-active {
      color: var(--el-color-primary);
      border-color: var(--el-color-primary);
    }
  }
</style>

<style lang="scss">
  // popover 渲染在 body 下，使用全局样式
  .card-setting-popover.el-popover.el-popper {
    padding: 0;

    .cs-body {
      max-height: 420px;
      padding: 6px 16px 4px;
      overflow-y: auto;
    }

    .cs-group {
      padding: 10px 0;

      & + .cs-group {
        border-top: 1px dashed var(--el-border-color-lighter);
      }
    }

    .cs-group-head {
      display: flex;
      gap: 4px;
      align-items: center;
      margin-bottom: 10px;

      .cs-group-title {
        font-size: 13px;
        font-weight: 600;
        color: var(--art-gray-900, #303133);
      }

      .cs-group-meta {
        font-size: 12px;
        color: var(--art-gray-500, #909399);
      }

      .cs-group-full {
        margin-left: 6px;
        font-size: 12px;
        color: var(--el-color-danger);
      }
    }

    .cs-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 5px 16px;
    }

    .cs-opt {
      display: flex;
      align-items: center;
      padding: 0 6px;
      cursor: move;
      border-radius: 6px;
      transition: background 0.15s;

      &:hover {
        background: var(--el-fill-color-light);
      }

      &.is-disabled {
        cursor: move;
      }

      .el-checkbox {
        width: 100%;
        height: 28px;
        margin-right: 0;
      }
    }

    .cs-opt-ghost {
      background: var(--el-color-primary-light-9);
      opacity: 0.6;
    }

    .cs-empty {
      padding: 24px 0;
      font-size: 13px;
      color: var(--art-gray-500, #909399);
      text-align: center;
    }

    .cs-foot {
      display: flex;
      gap: 12px;
      align-items: center;
      justify-content: space-between;
      padding: 10px 16px;
      border-top: 1px solid var(--el-border-color-lighter);
    }

    .cs-foot-summary {
      display: flex;
      flex-wrap: wrap;
      gap: 4px 10px;
      font-size: 12px;
      color: var(--art-gray-500, #909399);

      .cs-foot-item b {
        color: var(--el-color-primary);
      }
    }

    .cs-foot-btns {
      display: flex;
      flex: 0 0 auto;
      gap: 8px;
    }
  }
</style>
