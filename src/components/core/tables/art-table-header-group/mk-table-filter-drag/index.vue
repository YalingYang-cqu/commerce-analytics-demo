/* eslint-disable */
<!-- 分组版列设置弹窗：左侧按分组勾选显隐，右侧按分组分区，仅支持同组内拖拽排序 -->
<template>
  <el-popover
    placement="bottom"
    trigger="click"
    :width="popoverWidth"
    v-model:visible="visible"
    popper-class="filter-popover filter-popover-group"
  >
    <div class="colSetting">
      <!-- 左侧：按分组勾选（列数由 checkboxColumns 控制，默认 2） -->
      <div class="filter-content" :class="`filter-cols-${checkboxColumns}`">
        <template v-for="g in checkboxGroups" :key="g.key">
          <div class="set-title">
            <el-checkbox
              class="group-check"
              :model-value="groupCheckState(g).checked"
              :indeterminate="groupCheckState(g).indeterminate"
              @change="(val) => toggleGroup(g, val)"
              size="small"
            />
            <!-- 分组色点：仅当分组带 color 时展示（与右侧拖拽区/表头分组色条一致；"其他信息"无色不显示） -->
            <span v-if="g.color" class="group-dot" :style="{ backgroundColor: g.color }"></span>
            <span class="group-name">{{ g.title }}</span>
          </div>
          <el-checkbox
            v-for="item in g.items"
            :key="getPropKey(item.prop)"
            class="filter-checkbox"
            :label="item.columnName || item.name"
            v-model="item.showCol"
            :disabled="item.cannotHidden"
            @change="onToggle(item)"
            size="small"
          />
        </template>
      </div>

      <!-- 右侧：分组拖拽区（仅同组内排序） -->
      <div class="draggable-root">
        <div class="draggable-search">
          <el-input
            v-model="draggableInput"
            class="draggable-search-input"
            clearable
            placeholder="请输入搜索内容"
          >
            <template #suffix>
              <el-icon><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div class="draggable-parent">
          <template v-for="bucket in buckets" :key="bucket.key">
            <!-- 分组标题（lead 占位组不展示标题） -->
            <div v-if="bucket.isGroup" class="drag-group-title">
              <span class="group-dot" :style="{ backgroundColor: bucket.color }"></span>
              <span>{{ bucket.title }}</span>
            </div>
            <draggable
              v-model="bucket.items"
              :item-key="getItemKey"
              :group="{ name: `cols-${bucket.key}` }"
              :disabled="!bucket.isGroup"
              tag="ul"
              class="list-group"
              handle=".drag-handle"
              @update="onDragChange"
            >
              <template v-for="item in bucket.items" :key="getPropKey(item.prop)">
                <li class="draggable-item">
                  <el-icon class="drag-handle" :class="{ 'drag-handle-disabled': !bucket.isGroup }">
                    <Menu />
                  </el-icon>
                  <span class="content">
                    <span
                      v-for="(keyItem, ki) in (item.name || '').split('')"
                      :key="ki"
                      :style="{
                        color: draggableInput && draggableInput.includes(keyItem) ? '#425eff' : ''
                      }"
                      >{{ keyItem }}</span
                    >
                  </span>
                  <span class="fun-list">
                    <i
                      v-if="bucket.isGroup"
                      class="iconfont icon-arrow_xiangshangzhiding"
                      title="置顶"
                      @click="topPing(item)"
                    ></i>
                    <i
                      v-if="!bucket.isGroup && !item.fixed"
                      class="iconfont icon-xuanfu-guding"
                      title="固定"
                      @click="setItemFixed(item, true)"
                    ></i>
                    <i
                      v-if="!bucket.isGroup && item.fixed"
                      class="iconfont icon-quxiaoguding"
                      title="取消固定"
                      @click="setItemFixed(item, false)"
                    ></i>
                    <i
                      v-if="!item.cannotHidden"
                      class="iconfont icon-qingchu"
                      title="隐藏"
                      @click="clearShow(item)"
                    ></i>
                  </span>
                </li>
              </template>
            </draggable>
          </template>
        </div>
      </div>
    </div>
    <div class="filter-btnBox">
      <div>
        <el-button size="small" @click="handleReset">恢复默认</el-button>
      </div>
      <div>
        <el-button size="small" @click="visible = false">取消</el-button>
        <el-button type="primary" size="small" @click="fnSave">确定</el-button>
      </div>
    </div>
    <template #reference>
      <div class="btn"><i class="iconfont-custom">&#xe657;</i> </div>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, computed } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { Search, Menu } from '@element-plus/icons-vue'
  import { VueDraggableNext as draggable } from 'vue-draggable-next'
  import { saveUserHabitsApi, getHabitsApi } from '@/api/system-manage'
  import { normalizeColumnKey } from '@/composables/useTableColumns'

  /** 列唯一 key（prop 可能为数组，统一为字符串） */
  const getPropKey = (p: string | string[] | undefined): string =>
    normalizeColumnKey(p) ?? (p != null ? String(p) : '')
  const getItemKey = (item: TableColumn): string => getPropKey(item.prop) || String(item.name ?? '')

  export interface TableColumn {
    prop: string
    name: string
    columnName?: string
    /** 所属分组 key */
    group?: string
    showCol?: boolean
    showCheck?: boolean
    cannotHidden?: boolean
    defaultShowCol?: boolean
    fixed?: boolean | 'left' | 'right'
    width?: string | number
    minWidth?: string | number
  }

  export interface GroupOption {
    key: string
    title: string
    color?: string
  }

  interface Bucket {
    key: string
    title?: string
    color?: string
    isGroup: boolean
    items: TableColumn[]
  }

  interface Props {
    setting: TableColumn[]
    defaultSetting?: TableColumn[]
    tableName: string
    groups: GroupOption[]
    /** 左侧勾选区列数：2 或 3，默认 2 */
    checkboxColumns?: 2 | 3
  }

  interface DraggableChangeEvent {
    list: TableColumn[]
  }

  const props = withDefaults(defineProps<Props>(), {
    setting: () => [],
    defaultSetting: () => [],
    tableName: '',
    groups: () => [],
    checkboxColumns: 2
  })

  /** 2 列时弹层更宽，保证每项文案可读；3 列保持紧凑 */
  const popoverWidth = computed(() => (props.checkboxColumns === 3 ? 800 : 780))
  const checkboxColumns = computed(() => (props.checkboxColumns === 3 ? 3 : 2))

  const emit = defineEmits<{
    (e: 'draggableChange', event: DraggableChangeEvent): void
  }>()

  const route = useRoute()
  const visible = ref(false)
  const loadingHabits = ref(false)
  const draggableInput = ref('')
  /** 单一数据源：完整有序列（含隐藏列），分组块按 groups 顺序连续排列 */
  const orderedCols = ref<TableColumn[]>([])
  /** 拖拽分区桶（仅含可见列） */
  const buckets = ref<Bucket[]>([])

  /** 左侧分组勾选项 */
  const checkboxGroups = ref<Array<GroupOption & { items: TableColumn[] }>>([])

  /** 是否为分组内的列 */
  const groupKeySet = () => new Set((props.groups || []).map((g) => g.key))

  /**
   * 规范化：保持列的自然顺序，仅把同一分组的列在「该组首次出现位置」聚拢连续；
   * 最后把固定列排到两端（左固定→最前、右固定→最后），与 el-table 渲染顺序、表格分组色条保持一致
   */
  const canonicalize = (list: TableColumn[]): TableColumn[] => {
    const set = groupKeySet()
    const out: TableColumn[] = []
    const doneGroup = new Set<string>()
    for (const c of list) {
      const g = c.group
      if (!g || !set.has(g)) {
        out.push(c)
      } else if (!doneGroup.has(g)) {
        doneGroup.add(g)
        out.push(...list.filter((x) => x.group === g))
      }
    }
    const left = out.filter((c) => c.fixed === true || c.fixed === 'left')
    const right = out.filter((c) => c.fixed === 'right')
    const center = out.filter((c) => !c.fixed)
    return [...left, ...center, ...right]
  }

  /** 根据 orderedCols 重建左侧勾选分组与右侧拖拽桶 */
  const rebuildView = (): void => {
    const set = groupKeySet()
    // 左侧勾选：分组列 + 未分组列统一归入「其他信息」
    const groupCols = (props.groups || []).map((g) => ({
      ...g,
      items: orderedCols.value.filter((c) => c.group === g.key && !c.showCheck)
    }))
    const otherItems = orderedCols.value.filter(
      (c) => (!c.group || !set.has(c.group)) && !c.showCheck
    )
    checkboxGroups.value = otherItems.length
      ? [...groupCols, { key: '__other__', title: '其他信息', items: otherItems }]
      : groupCols
    // 右侧拖拽桶：按 orderedCols 自然顺序切块（未分组连续段为一桶，分组为一桶，与表格列顺序一致）
    const result: Bucket[] = []
    const cols = orderedCols.value
    let leadIdx = 0
    let i = 0
    while (i < cols.length) {
      const g = cols[i].group
      if (g && set.has(g)) {
        const items: TableColumn[] = []
        while (i < cols.length && cols[i].group === g) {
          if (cols[i].showCol && !cols[i].showCheck) items.push(cols[i])
          i++
        }
        const meta = (props.groups || []).find((x) => x.key === g)
        if (items.length) {
          result.push({ key: g, title: meta?.title, color: meta?.color, isGroup: true, items })
        }
      } else {
        const items: TableColumn[] = []
        while (i < cols.length && (!cols[i].group || !set.has(cols[i].group as string))) {
          if (cols[i].showCol && !cols[i].showCheck) items.push(cols[i])
          i++
        }
        if (items.length) result.push({ key: `__lead_${leadIdx++}__`, isGroup: false, items })
      }
    }
    buckets.value = result
  }

  /** 拖拽后：把组内可见顺序写回 orderedCols（仅同组内排序，未分组列保持原位，隐藏列保持组内原相对位置） */
  const rebuildOrderedFromBuckets = (): void => {
    const set = groupKeySet()
    // 各分组拖拽后的可见列新顺序
    const groupVisOrder = new Map<string, string[]>()
    buckets.value.forEach((b) => {
      if (b.isGroup) {
        groupVisOrder.set(
          b.key,
          b.items.map((c) => getPropKey(c.prop))
        )
      }
    })
    const next: TableColumn[] = []
    const emittedGroup = new Set<string>()
    const cols = orderedCols.value
    cols.forEach((c) => {
      const g = c.group
      if (g && set.has(g)) {
        if (emittedGroup.has(g)) return
        emittedGroup.add(g)
        const groupCols = cols.filter((x) => x.group === g)
        const byKey = new Map(groupCols.map((x) => [getPropKey(x.prop), x]))
        // 可见列按拖拽后的新顺序
        ;(groupVisOrder.get(g) || []).forEach((k) => {
          const col = byKey.get(k)
          if (col) {
            next.push(col)
            byKey.delete(k)
          }
        })
        // 剩余（隐藏列）保持组内原相对顺序
        groupCols.forEach((col) => {
          const k = getPropKey(col.prop)
          if (byKey.has(k)) {
            next.push(col)
            byKey.delete(k)
          }
        })
      } else {
        next.push(c)
      }
    })
    orderedCols.value = next
    emitChange()
  }

  const emitChange = (): void => {
    emit('draggableChange', { list: JSON.parse(JSON.stringify(orderedCols.value)) })
  }

  /** 拖拽变化 */
  const onDragChange = (): void => {
    rebuildOrderedFromBuckets()
  }

  /** 勾选切换 */
  const onToggle = (item: TableColumn): void => {
    const key = getPropKey(item.prop)
    const target = orderedCols.value.find((c) => getPropKey(c.prop) === key)
    if (target) target.showCol = item.showCol
    rebuildView()
    emitChange()
  }

  /** 分组级勾选状态：全选 / 半选 */
  const groupCheckState = (g: {
    items: TableColumn[]
  }): { checked: boolean; indeterminate: boolean } => {
    const items = g.items || []
    const total = items.length
    const checkedCount = items.filter((i) => i.showCol).length
    return {
      checked: total > 0 && checkedCount === total,
      indeterminate: checkedCount > 0 && checkedCount < total
    }
  }

  /** 分组级全选/取消（cannotHidden 列保持显示） */
  const toggleGroup = (g: { items: TableColumn[] }, val: any): void => {
    const keys = new Set((g.items || []).map((i) => getPropKey(i.prop)))
    orderedCols.value.forEach((c) => {
      if (keys.has(getPropKey(c.prop)) && !c.cannotHidden) c.showCol = !!val
    })
    rebuildView()
    emitChange()
  }

  /** 在拖拽列表里隐藏某列 */
  const clearShow = (item: TableColumn): void => {
    const key = getPropKey(item.prop)
    const target = orderedCols.value.find((c) => getPropKey(c.prop) === key)
    if (target) target.showCol = false
    rebuildView()
    emitChange()
  }

  /** 是否左固定列 */
  const isLeftFixed = (c: TableColumn): boolean => c.fixed === true || c.fixed === 'left'

  /** 置顶：未分组列 → 移到固定列之后（列表顶部）；分组列 → 移到所属组内第一位 */
  const topPing = (item: TableColumn): void => {
    const set = groupKeySet()
    const key = getPropKey(item.prop)
    const cols = [...orderedCols.value]
    const idx = cols.findIndex((c) => getPropKey(c.prop) === key)
    if (idx < 0) return
    const target = cols[idx]
    cols.splice(idx, 1)
    let insertAt = 0
    if (target.group && set.has(target.group)) {
      const first = cols.findIndex((c) => c.group === target.group)
      insertAt = first < 0 ? cols.length : first
    } else {
      while (insertAt < cols.length && isLeftFixed(cols[insertAt])) insertAt++
    }
    cols.splice(insertAt, 0, target)
    orderedCols.value = cols
    rebuildView()
    emitChange()
  }

  /**
   * 原始定义顺序索引：getPropKey -> 下标（用于取消固定时回到原处）
   * 必须用 defaultSetting（稳定的初始顺序）；setting 会随操作被回写成当前顺序，不能作为「原处」依据
   */
  const naturalIndexMap = (): Map<string, number> => {
    const src = props.defaultSetting?.length ? props.defaultSetting : props.setting || []
    const m = new Map<string, number>()
    src.forEach((c, i) => m.set(getPropKey(c.prop), i))
    return m
  }

  /** 固定/取消固定（仅未分组列）：固定→移到左固定区末尾；取消→回到原始定义顺序中的位置 */
  const setItemFixed = (item: TableColumn, fixed: boolean): void => {
    const key = getPropKey(item.prop)
    const cols = [...orderedCols.value]
    const idx = cols.findIndex((c) => getPropKey(c.prop) === key)
    if (idx < 0) return
    const target = cols[idx]
    target.fixed = fixed
    cols.splice(idx, 1)
    let insertAt = 0
    if (fixed) {
      while (insertAt < cols.length && isLeftFixed(cols[insertAt])) insertAt++
    } else {
      const orderMap = naturalIndexMap()
      const xOrig = orderMap.get(key) ?? cols.length
      insertAt = cols.length
      for (let i = 0; i < cols.length; i++) {
        if (isLeftFixed(cols[i])) continue
        const oi = orderMap.get(getPropKey(cols[i].prop))
        if (oi != null && oi > xOrig) {
          insertAt = i
          break
        }
      }
    }
    cols.splice(insertAt, 0, target)
    orderedCols.value = cols
    rebuildView()
    emitChange()
  }

  /** 恢复默认 */
  const handleReset = (): void => {
    const source =
      props.defaultSetting && props.defaultSetting.length > 0 ? props.defaultSetting : props.setting
    const def = JSON.parse(JSON.stringify(source)) as TableColumn[]
    def.forEach((c) => {
      c.showCol = c.defaultShowCol !== undefined ? c.defaultShowCol : true
    })
    orderedCols.value = canonicalize(def)
    rebuildView()
    emitChange()
  }

  /** 保存到习惯接口 */
  const fnSave = async (): Promise<void> => {
    const path = route.path.replace(/\//g, '_')
    const settingArr = {
      showCols: orderedCols.value.filter((c) => !c.showCheck),
      draggableList: orderedCols.value
    }
    try {
      const res: any = await saveUserHabitsApi({
        key: `${props.tableName}${path}`,
        habits: JSON.stringify(settingArr)
      })
      if (res.code === 200) {
        ElMessage.success('保存成功！')
        visible.value = false
      }
    } catch {
      ElMessage.error('保存失败')
    }
  }

  /** 加载习惯：仅当列集合一致时应用顺序与显隐 */
  const isInSync = (list?: TableColumn[]): boolean => {
    if (!list?.length) return false
    const localKeys = orderedCols.value.map((c) => getPropKey(c.prop)).filter(Boolean)
    const serverKeys = list.map((c) => getPropKey(c.prop)).filter(Boolean)
    if (localKeys.length !== serverKeys.length) return false
    const setServer = new Set(serverKeys)
    return localKeys.every((k) => setServer.has(k))
  }

  const fnGetHabits = async (): Promise<void> => {
    if (loadingHabits.value) return
    loadingHabits.value = true
    const path = route.path.replace(/\//g, '_')
    try {
      const res: any = await getHabitsApi(`${props.tableName}${path}`)
      if (res?.code === 200 && res?.data) {
        const dataObj = JSON.parse(res.data)
        const saved = dataObj?.draggableList as TableColumn[] | undefined
        if (isInSync(saved)) {
          const byKey = new Map(orderedCols.value.map((c) => [getPropKey(c.prop), c]))
          const merged: TableColumn[] = []
          saved!.forEach((s) => {
            const col = byKey.get(getPropKey(s.prop))
            if (col) {
              col.showCol = s.showCol !== false
              if (s.fixed !== undefined) col.fixed = s.fixed
              merged.push(col)
            }
          })
          orderedCols.value = canonicalize(merged)
          rebuildView()
          emitChange()
        }
      }
    } catch (e: any) {
      if (e?.code !== 401) {
        /* 无习惯数据时忽略 */
      }
    }
    loadingHabits.value = false
  }

  watch(
    () => props.setting,
    (val) => {
      const arr = JSON.parse(JSON.stringify(val || [])) as TableColumn[]
      orderedCols.value = canonicalize(arr)
      rebuildView()
    },
    { immediate: true, deep: true }
  )

  onMounted(() => {
    if (props.setting.length) fnGetHabits()
  })
</script>

<style lang="scss">
  .filter-popover-group {
    padding: 0;

    .colSetting {
      display: flex;
    }

    .set-title {
      box-sizing: border-box;
      display: flex;
      align-items: center;
      width: 100%;
      padding: 10px 16px 6px;
      margin: 6px 0;
      background: #fbfdff;
      border-top: solid 1px #e4e7ed;
      border-bottom: dashed 1px #e4e7ed;

      &:first-of-type {
        margin-top: 0;
        border-top: 0;
      }

      .group-check {
        height: auto;
        margin-right: 8px;
      }

      .group-name {
        font-size: 13px;
        font-weight: 600;
        color: #303133;
      }
    }

    .group-dot {
      display: inline-block;
      width: 8px;
      height: 8px;
      margin-right: 6px;
      border-radius: 2px;
    }

    .filter-checkbox {
      box-sizing: border-box;
      padding: 0 16px;
      padding-bottom: 6px;
      margin-top: 6px;
      margin-right: 0;

      .el-checkbox__label {
        display: inline-block;
        width: 100%;
        overflow: hidden;
        font-size: 14px;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
      }
    }

    .filter-content {
      flex: 1 1 auto;
      min-width: 0;
      max-height: 55vh !important;
      padding-bottom: 16px;
      overflow-y: auto;

      // 默认 2 列；checkboxColumns=3 时切 3 列
      &.filter-cols-2 .filter-checkbox {
        width: 50%;
      }

      // 3 列变体（目前仅 sc订单利润明细表启用）：每行 3 项 + 字号更小，更紧凑、与指标卡配置面板一致
      &.filter-cols-3 {
        .filter-checkbox {
          width: 33.33%;

          .el-checkbox__label {
            font-size: 12px;
          }
        }

        .set-title .group-name {
          font-size: 12px;
        }
      }
    }

    .filter-btnBox {
      display: flex;
      justify-content: space-between;
      padding: 16px;
      border-top: solid 1px #e4e7ed;
    }

    .draggable-root {
      position: relative;
      display: block;
      flex: 0 0 260px;
      width: 220px;
      max-height: 55vh !important;
      border-left: 1px solid #dddfe3;

      .draggable-search {
        position: sticky;
        top: 0;
        z-index: 1;
        width: 100%;
        background: #fff;
      }

      .draggable-parent {
        height: calc(55vh - 34px) !important;
        overflow: auto;
      }
    }

    .drag-group-title {
      display: flex;
      align-items: center;
      padding: 8px 12px 4px;
      font-size: 12px;
      color: rgb(0 0 0 / 50%);
    }

    .list-group {
      padding: 0;
      margin: 0;
      list-style: none;
    }

    .draggable-item {
      position: relative;
      display: flex;
      align-items: center;
      padding: 5px 12px;
      cursor: default;

      .drag-handle {
        margin-right: 6px;
        color: #909399;
        cursor: move;
      }

      .drag-handle-disabled {
        color: #c0c4cc;
        cursor: not-allowed;
      }

      .content {
        flex: 1;
        font-size: 12px;
      }

      .fun-list {
        display: inline-flex;
        gap: 8px;
        cursor: pointer;
        visibility: hidden;

        i {
          color: #909399;
        }
      }

      &:hover {
        background: #e5eefe;

        .fun-list {
          visibility: visible;
        }
      }
    }
  }
</style>
