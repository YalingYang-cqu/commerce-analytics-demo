<!--
  两级复选下拉：左列一级类型（带全选、仅筛选此项），右列该一级下的二级类型。
  勾一级 = 勾它全部二级，绑定值统一是**二级（叶子）值数组**，
  调用方需要一级时按 options 自己反推，避免出现「勾了一级但叶子对不上」的两套真相。
  面板里的勾选是草稿，点「确定」才回写 v-model 并触发 change。
-->
<template>
  <ElPopover
    v-model:visible="visible"
    :width="panelWidth"
    placement="bottom-start"
    trigger="click"
    :show-arrow="false"
    :disabled="disabled"
    popper-class="mk-cascade-select-popper"
  >
    <template #reference>
      <div
        class="mk-cascade-select"
        :class="{ 'is-active': visible, 'is-disabled': disabled }"
        :style="{ width: typeof width === 'number' ? `${width}px` : width }"
      >
        <span v-if="displayText" class="mk-cascade-select__text" :title="displayText">
          {{ displayText }}
        </span>
        <span v-else class="mk-cascade-select__placeholder">{{ placeholder }}</span>
        <ElIcon
          v-if="clearable && modelValue.length && !disabled"
          class="mk-cascade-select__clear"
          @click.stop="handleClear"
        >
          <CircleClose />
        </ElIcon>
        <ElIcon v-else class="mk-cascade-select__arrow" :class="{ 'is-open': visible }">
          <ArrowDown />
        </ElIcon>
      </div>
    </template>

    <div class="cascade-panel">
      <div class="cascade-cols">
        <div class="cascade-col cascade-col--parent">
          <div class="cascade-row cascade-row--all">
            <ElCheckbox
              :model-value="allChecked"
              :indeterminate="allIndeterminate"
              @change="toggleAll"
            >
              全选
            </ElCheckbox>
          </div>
          <div
            v-for="node in options"
            :key="node.value"
            class="cascade-row cascade-row--parent"
            :class="{ 'is-active': activeValue === node.value }"
            @mouseenter="activeValue = node.value"
            @click="activeValue = node.value"
          >
            <ElCheckbox
              :model-value="parentChecked(node)"
              :indeterminate="parentIndeterminate(node)"
              @change="(checked: any) => toggleParent(node, !!checked)"
            >
              {{ node.label }}
            </ElCheckbox>
            <span class="cascade-only" @click.stop="onlyThis(node)">仅筛选此项</span>
            <ElIcon class="cascade-arrow"><ArrowRight /></ElIcon>
          </div>
        </div>

        <div class="cascade-col cascade-col--child">
          <div v-for="child in activeChildren" :key="child.value" class="cascade-row">
            <ElCheckbox
              :model-value="draft.includes(child.value)"
              @change="(checked: any) => toggleChild(child.value, !!checked)"
            >
              {{ child.label }}
            </ElCheckbox>
          </div>
        </div>
      </div>

      <div class="cascade-foot">
        <ElButton size="small" @click="handleCancel">取消</ElButton>
        <ElButton size="small" type="primary" @click="handleConfirm">确定</ElButton>
      </div>
    </div>
  </ElPopover>
</template>

<script setup lang="ts">
  import { computed, ref, watch } from 'vue'
  import { ElButton, ElCheckbox, ElIcon, ElPopover } from 'element-plus'
  import { ArrowDown, ArrowRight, CircleClose } from '@element-plus/icons-vue'

  defineOptions({ name: 'MkCascadeSelect' })

  export interface CascadeLeaf {
    value: string
    label: string
  }

  export interface CascadeNode extends CascadeLeaf {
    children: CascadeLeaf[]
  }

  const props = withDefaults(
    defineProps<{
      /** 选中的二级（叶子）值 */
      modelValue?: string[]
      options?: CascadeNode[]
      placeholder?: string
      /** 触发器宽度 */
      width?: string | number
      /** 面板宽度 */
      panelWidth?: number
      clearable?: boolean
      disabled?: boolean
      /** 触发器上最多平铺几个名称，超出折叠成「等 N 项」 */
      maxTagText?: number
    }>(),
    {
      modelValue: () => [],
      options: () => [],
      placeholder: '请选择',
      width: '100%',
      panelWidth: 400,
      clearable: true,
      disabled: false,
      maxTagText: 2
    }
  )

  const emit = defineEmits<{
    'update:modelValue': [value: string[]]
    change: [value: string[]]
  }>()

  const visible = ref(false)
  const draft = ref<string[]>([])
  const activeValue = ref('')

  const allLeaves = computed(() =>
    props.options.flatMap((node) => node.children.map((c) => c.value))
  )
  const activeChildren = computed(
    () => props.options.find((node) => node.value === activeValue.value)?.children || []
  )

  const allChecked = computed(
    () => allLeaves.value.length > 0 && allLeaves.value.every((v) => draft.value.includes(v))
  )
  const allIndeterminate = computed(() => draft.value.length > 0 && !allChecked.value)

  const parentChecked = (node: CascadeNode) =>
    node.children.length > 0 && node.children.every((c) => draft.value.includes(c.value))
  const parentIndeterminate = (node: CascadeNode) =>
    !parentChecked(node) && node.children.some((c) => draft.value.includes(c.value))

  /** 始终按 options 的顺序回写，避免勾选顺序不同导致同一份选择产生不同的数组 */
  const sortByOptions = (values: string[]) => allLeaves.value.filter((v) => values.includes(v))

  const toggleAll = (checked: any) => {
    draft.value = checked ? [...allLeaves.value] : []
  }

  const toggleParent = (node: CascadeNode, checked: boolean) => {
    const childValues = node.children.map((c) => c.value)
    const rest = draft.value.filter((v) => !childValues.includes(v))
    draft.value = sortByOptions(checked ? [...rest, ...childValues] : rest)
    activeValue.value = node.value
  }

  const toggleChild = (value: string, checked: boolean) => {
    draft.value = sortByOptions(
      checked ? [...draft.value, value] : draft.value.filter((v) => v !== value)
    )
  }

  const onlyThis = (node: CascadeNode) => {
    draft.value = node.children.map((c) => c.value)
    activeValue.value = node.value
  }

  const displayText = computed(() => {
    const selected = props.modelValue
    if (!selected.length) return ''
    if (allLeaves.value.length && allLeaves.value.every((v) => selected.includes(v))) return '全部'
    const names = props.options
      .map((node) => {
        const hit = node.children.filter((c) => selected.includes(c.value))
        if (!hit.length) return ''
        // 一级下只勾了部分二级时带上个数，否则「货件入库」看不出被收窄过
        return hit.length === node.children.length ? node.label : `${node.label}(${hit.length})`
      })
      .filter(Boolean)
    if (names.length <= props.maxTagText) return names.join('、')
    return `${names[0]} 等 ${names.length} 项`
  })

  const handleConfirm = () => {
    const value = [...draft.value]
    emit('update:modelValue', value)
    emit('change', value)
    visible.value = false
  }

  const handleCancel = () => {
    draft.value = [...props.modelValue]
    visible.value = false
  }

  const handleClear = () => {
    draft.value = []
    emit('update:modelValue', [])
    emit('change', [])
  }

  // 打开时以当前值为草稿；关闭（含点外部）时丢弃未确定的改动
  watch(visible, (open) => {
    draft.value = [...props.modelValue]
    if (!open) return
    const firstHit = props.options.find((node) =>
      node.children.some((c) => props.modelValue.includes(c.value))
    )
    activeValue.value = firstHit?.value || props.options[0]?.value || ''
  })

  watch(
    () => props.modelValue,
    (value) => {
      if (!visible.value) draft.value = [...value]
    },
    { deep: true }
  )
</script>

<style lang="scss" scoped>
  /* 触发器：对齐搜索栏里其它下拉的 28px 高度与描边 */
  .mk-cascade-select {
    display: flex;
    align-items: center;
    height: 28px;
    padding: 0 8px;
    line-height: 28px;
    cursor: pointer;
    background: var(--art-main-bg-color);
    border: 1px solid #dcdfe6;
    border-radius: var(--el-border-radius-base);
    transition: border-color 0.2s;

    &:hover,
    &.is-active {
      border-color: var(--el-color-primary);
    }

    &.is-disabled {
      cursor: not-allowed;
      background: var(--el-disabled-bg-color);
    }

    &__text,
    &__placeholder {
      flex: 1;
      overflow: hidden;
      font-size: 12px;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    &__text {
      color: var(--art-text-gray-800);
    }

    &__placeholder {
      color: var(--el-text-color-placeholder);
    }

    &__arrow,
    &__clear {
      font-size: 13px;
      color: var(--el-text-color-placeholder);
      transition: transform 0.2s;
    }

    &__arrow.is-open {
      transform: rotate(180deg);
    }

    &__clear:hover {
      color: var(--el-text-color-secondary);
    }
  }
</style>

<style lang="scss">
  .mk-cascade-select-popper {
    padding: 0 !important;

    .cascade-cols {
      display: flex;
      max-height: 280px;
    }

    .cascade-col {
      flex: 1;
      padding: 6px 0;
      overflow-y: auto;

      &--parent {
        border-right: 1px solid var(--el-border-color-lighter);
      }
    }

    .cascade-row {
      display: flex;
      align-items: center;
      height: 32px;
      padding: 0 10px;

      .el-checkbox {
        flex: 1;
        height: 32px;
        overflow: hidden;

        .el-checkbox__label {
          overflow: hidden;
          font-size: 13px;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }

      &--all {
        border-bottom: 1px solid var(--el-border-color-lighter);
      }

      &--parent {
        cursor: pointer;

        &:hover,
        &.is-active {
          background: var(--el-fill-color-light);
        }

        /* 「仅筛选此项」只在 hover / 选中的那一行露出，平时把位置让给标签 */
        &:hover .cascade-only,
        &.is-active .cascade-only {
          visibility: visible;
        }
      }
    }

    .cascade-only {
      margin-right: 6px;
      font-size: 12px;
      color: var(--el-color-primary);
      visibility: hidden;
    }

    .cascade-arrow {
      font-size: 12px;
      color: var(--el-text-color-placeholder);
    }

    .cascade-foot {
      display: flex;
      gap: 8px;
      justify-content: flex-end;
      padding: 8px 10px;
      border-top: 1px solid var(--el-border-color-lighter);
    }
  }
</style>
