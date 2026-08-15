<template>
  <div style="display: inline-block">
    <div v-show="isShowSelect" class="tree-mask" @click="handleTreeMask" />

    <el-popover
      placement="bottom-start"
      :width="width"
      trigger="click"
      v-model:visible="isShowSelect"
      popper-class="treeSel-popover"
      @show="handleOpenPopover"
    >
      <el-input
        ref="refInput"
        v-model="filterText"
        placeholder="搜索内容"
        clearable
        style="margin-bottom: 10px"
      />

      <div class="select-tree-box">
        <el-tree
          ref="treeRef"
          class="common-tree"
          :style="treeStyle"
          :data="dataArr"
          :props="defaultProps"
          :show-checkbox="multiple"
          :node-key="defaultProps.nodeKey"
          :check-strictly="checkStrictly"
          default-expand-all
          :expand-on-click-node="false"
          :check-on-click-node="multiple"
          :highlight-current="true"
          :filter-node-method="filterNode"
          @node-click="handleNodeClick"
          @check-change="handleCheckChange"
        />
      </div>

      <template v-slot:reference>
        <el-select
          ref="selectRef"
          :style="selectStyle"
          :size="size"
          v-model="selectedData"
          :multiple="multiple"
          :clearable="clearable"
          :collapse-tags="collapseTags"
          :disabled="disabled"
          class="mk-tree-select"
          :placeholder="defaultProps.placeholder || '请选择选项'"
          @remove-tag="removeSelectedNodes"
          @clear="removeSelectedNode"
          @change="changeSelectedNodes"
        >
          <el-option
            v-for="item in options"
            :key="item.value"
            :label="item.label"
            :value="item.value"
          />
        </el-select>
      </template>

      <div style="padding-top: 12px; text-align: right">
        <el-button size="small" @click="handleCancel">取消</el-button>
        <el-button type="primary" size="small" @click="handleConfirm"> 确定 </el-button>
      </div>
    </el-popover>
  </div>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, nextTick, computed } from 'vue'
  import type { ElTree, ElSelect, ElInput } from 'element-plus'

  // Types
  interface TreeNode {
    [key: string]: any
    children?: TreeNode[]
  }

  interface TreeSelectProps {
    data: TreeNode[]
    defaultProps?: {
      children?: string
      label?: string
      nodeKey?: string
      placeholder?: string
    }
    multiple?: boolean
    clearable?: boolean
    collapseTags?: boolean
    nodeKey?: string
    checkStrictly?: boolean
    checkedKeys?: string[]
    size?: 'default' | 'small' | 'large' | ''
    width?: number | string
    height?: number
    disabled?: boolean
  }

  interface TreeSelectOption {
    value: string
    label: string
  }

  interface TreeSelectEmits {
    (e: 'popoverHide', checkedIds: string[], checkedData: TreeNode[]): void
    (e: 'change', selectedData: string | string[]): void
  }

  // Props
  const props = withDefaults(defineProps<TreeSelectProps>(), {
    data: () => [],
    defaultProps: () => ({
      children: 'children',
      label: 'name',
      nodeKey: 'value',
      placeholder: ''
    }),
    multiple: true,
    clearable: true,
    collapseTags: true,
    nodeKey: 'id',
    checkStrictly: false,
    checkedKeys: () => [],
    size: 'small',
    width: 200,
    height: 250,
    disabled: false
  })

  // Emits
  const emit = defineEmits<TreeSelectEmits>()

  // Refs
  const filterText = ref('')
  const isShowSelect = ref(false)
  const selectedData = ref<string | string[]>(props.multiple ? [] : '')
  const checkedIds = ref<string[]>([])
  const checkedData = ref<TreeNode[]>([])

  const treeRef = ref<InstanceType<typeof ElTree>>()
  const selectRef = ref<InstanceType<typeof ElSelect>>()
  const refInput = ref<InstanceType<typeof ElInput>>()

  // Computed
  const dataArr = computed<TreeNode[]>(() => {
    const endArr: TreeNode[] = [
      {
        [props.defaultProps.nodeKey || 'value']: 'checkAll1',
        [props.defaultProps.label || 'name']: '选择全部',
        [props.defaultProps.children || 'children']: props.data
      }
    ]
    return endArr
  })

  const treeStyle = computed(() => ({
    width: `${props.width}px`,
    maxHeight: `${props.height}px`
  }))

  const selectStyle = computed(() => ({
    width: `${props.width}px`
  }))

  const options = ref<TreeSelectOption[]>([])

  // Methods
  const handleOpenPopover = (): void => {
    if (props.disabled) {
      isShowSelect.value = false
    }
  }

  const handleCancel = (): void => {
    isShowSelect.value = false
  }

  const handleTreeMask = (): void => {
    isShowSelect.value = false
    handlePopoverHide()
  }

  const handleConfirm = (): void => {
    isShowSelect.value = false
    handlePopoverHide()
  }

  const filterNode = (value: string, data: TreeNode): boolean => {
    if (!value) return true
    const label = data[props.defaultProps.label || 'name']
    return label.toUpperCase().includes(value.toUpperCase())
  }

  const setSelectOption = (node: any): void => {
    const tmpMap: TreeSelectOption = {
      value: node.key,
      label: node.label
    }
    options.value = [tmpMap]
    selectedData.value = node.key
  }

  const checkSelectedNode = (checkedKeys: string[]): void => {
    const item = checkedKeys[0]
    treeRef.value?.setCurrentKey(item)
    const node = treeRef.value?.getNode(item)
    if (node) {
      setSelectOption(node)
    }
  }

  const checkSelectedNodes = (checkeds: string[]): void => {
    treeRef.value?.setCheckedKeys(checkeds)
  }

  const clearSelectedNode = (): void => {
    selectedData.value = ''
    treeRef.value?.setCurrentKey(null)
  }

  const clearSelectedNodes = (): void => {
    const checkedKeys = treeRef.value?.getCheckedKeys() as string[]
    if (checkedKeys) {
      checkedKeys.forEach((key) => {
        treeRef.value?.setChecked(key, false, false)
      })
    }
  }

  const initCheckedData = (): void => {
    if (props.multiple) {
      if (props.checkedKeys.length > 0) {
        checkSelectedNodes(props.checkedKeys)
      } else {
        clearSelectedNodes()
      }
    } else if (props.checkedKeys.length > 0) {
      checkSelectedNode(props.checkedKeys)
    } else {
      clearSelectedNode()
    }
  }

  const handlePopoverHide = (): void => {
    const nodeKey = props.defaultProps.nodeKey || 'value'

    if (props.multiple) {
      const checkedKeys = treeRef.value?.getCheckedKeys() as string[]
      const checkedNodes = treeRef.value?.getCheckedNodes() as TreeNode[]

      checkedIds.value = checkedKeys?.filter((key) => key !== 'checkAll1') || []
      checkedData.value = checkedNodes?.filter((node) => node[nodeKey] !== 'checkAll1') || []
    } else {
      const currentKey = treeRef.value?.getCurrentKey() as string
      const currentNode = treeRef.value?.getCurrentNode() as TreeNode

      checkedIds.value = currentKey && currentKey !== 'checkAll1' ? [currentKey] : []
      checkedData.value = currentNode && currentNode[nodeKey] !== 'checkAll1' ? [currentNode] : []
    }

    emit('popoverHide', checkedIds.value, checkedData.value)
  }

  const handleNodeClick = (data: TreeNode, node: any): void => {
    if (!props.multiple) {
      setSelectOption(node)
      isShowSelect.value = false
      emit('change', selectedData.value as string)
    }
  }

  const handleCheckChange = (): void => {
    if (!props.multiple) return

    const checkedKeys = treeRef.value?.getCheckedKeys() as string[]
    if (checkedKeys) {
      options.value = checkedKeys.map((item) => {
        const node = treeRef.value?.getNode(item)
        return {
          value: String(node?.key || item),
          label: node?.label || item
        }
      })

      selectedData.value = options.value.map((item) => item.value)
    }
  }

  const removeSelectedNodes = (val: string): void => {
    treeRef.value?.setChecked(val, false, false)
    const node = treeRef.value?.getNode(val)

    if (!props.checkStrictly && node?.childNodes && node.childNodes.length > 0) {
      treeToList(node).forEach((item) => {
        if (item.childNodes && item.childNodes.length <= 0) {
          treeRef.value?.setChecked(item, false, false)
        }
      })
      handleCheckChange()
    }

    emit('popoverHide', selectedData.value as string[], [])
  }

  const treeToList = (tree: any): any[] => {
    const queen: any[] = []
    const out: any[] = []
    queen.push(tree)

    while (queen.length) {
      const first = queen.shift()
      if (first.childNodes) {
        queen.push(...first.childNodes)
      }
      out.push(first)
    }
    return out
  }

  const removeSelectedNode = (): void => {
    clearSelectedNode()
    emit('popoverHide', [], [])
  }

  const changeSelectedNodes = (selectedData: string | string[]): void => {
    if (props.multiple && (selectedData as string[]).length <= 0) {
      clearSelectedNodes()
    }
  }

  // Lifecycle
  onMounted(() => {
    initCheckedData()
  })

  // Watchers
  watch(
    () => filterText.value,
    (val: string) => {
      treeRef.value?.filter(val)
    }
  )

  watch(
    () => props.data,
    () => {
      // dataArr is computed, no need to manually update
    },
    { immediate: true }
  )

  watch(
    () => isShowSelect.value,
    (val: boolean) => {
      if (!val) {
        nextTick(() => {
          selectRef.value?.blur()
        })
      }
    }
  )

  watch(
    () => props.checkedKeys,
    (val: string[]) => {
      if (val) {
        initCheckedData()
      }
    },
    { deep: true }
  )
</script>

<style lang="scss" scoped>
  .tree-mask {
    position: fixed;
    top: 0;
    left: 0;
    z-index: 11;
    width: 100%;
    height: 100%;
    opacity: 0;
  }

  .common-tree {
    width: 100% !important;
    overflow: auto;
  }

  .select-tree-box {
    width: 100%;
  }

  .mk-tree-select {
    z-index: 111;
    width: auto;
    min-width: 86px;
    max-width: 235px;

    :deep(.el-select__tags-text) {
      display: inline-block;
      max-width: 94px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    :deep(.el-tag__close.el-icon-close) {
      top: -5px;
      right: -7px;
    }
  }
</style>
