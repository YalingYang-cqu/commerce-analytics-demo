<template>
  <section class="btn-group">
    <slot name="groupleft"></slot>
    <!-- 刷新按钮 -->
    <!-- <el-button class="icon-btn" @click="btnClick('refresh')" v-btnReClick v-if="showBtnRefresh">
      <i class="mk-iconfont mkIcon-refresh color-Gray" />
    </el-button> -->
    <div class="btn" @click="btnClick('refresh')" v-if="showBtnRefresh" v-btnReClick>
      <i class="iconfont-sys">&#xe615;</i>
    </div>
    <MkTableFilter
      v-if="showBtnConfigure"
      ref="mkTableFilterRef"
      :setting="filterSetting"
      :table-name="tableName"
      :has-set-child="hasSetChild"
    />

    <MkTableFilterDrag
      v-else
      ref="mkTableFilterRef"
      :setting="filterSetting"
      :table-name="tableName"
      :has-set-child="hasSetChild"
      :is-sort="isSort"
      @draggable-change="draggableList"
      @show-item-change="showItemChange"
    />

    <!-- <el-button class="icon-btn" @click="btnClick('download')" v-btnReClick v-if="showExportBtn">
      <i class="mk-iconfont mkIcon-download color-Gray" />
    </el-button> -->
    <div v-btnReClick v-if="showExportBtn" class="btn" @click="btnClick('download')">
      <span :class="{ loading: true }" class="btn" v-if="downLoading">
        <el-icon><Loading /></el-icon
      ></span>

      <i class="iconfont-custom" v-else>&#xe665;</i>
    </div>
    <slot name="groupRight"></slot>
  </section>
</template>

<script setup lang="ts">
  import { ref, computed } from 'vue'
  import { ElMessage } from 'element-plus'
  import { useTableStore } from '@/store/modules/new-table'
  import MkTableFilter from '../mk-table-filter/index.vue'
  import MkTableFilterDrag from './../mk-table-filter-drag/index.vue'
  // 类型定义
  export interface TableColumn {
    key: string
    name: string
    columnName?: string
    showCol?: boolean
    showCheck?: boolean
    cannotHidden?: boolean
    defaultShowCol?: boolean
    columnChildren?: TableColumn[]
  }

  interface Props {
    filterSetting: TableColumn[]
    premiStr?: string
    showBtnRefresh?: boolean
    showBtnConfigure?: boolean
    showBtnDownload?: boolean
    tableName: string
    isSort?: boolean
    hasSetChild?: boolean
  }

  interface DraggableChangeEvent {
    list: TableColumn[]
    oldIndex?: number | null
    newIndex?: number | null
    item?: TableColumn | null | undefined
  }

  interface ShowItemChangeEvent {
    resetList?: TableColumn[] | null
    pItem?: TableColumn | null
    item?: TableColumn | null
  }

  // Props
  const props = withDefaults(defineProps<Props>(), {
    filterSetting: () => [],
    premiStr: '',
    showBtnRefresh: true,
    showBtnConfigure: true,
    showBtnDownload: true,
    isSort: false,
    hasSetChild: false
  })
  const downLoading = ref(false)
  // Emits
  const emit = defineEmits<{
    showItemChange: [event: ShowItemChangeEvent]
    draggableChange: [event: DraggableChangeEvent]
    btnClickCb: [type: string]
  }>()

  // Refs
  const mkTableFilterRef = ref<
    InstanceType<typeof MkTableFilter> | InstanceType<typeof MkTableFilterDrag>
  >()

  // 使用 Pinia store
  const globalStore = useTableStore()

  // Computed
  const showExportBtn = computed(() => {
    if (props.premiStr === '*:*:*') {
      return props.showBtnDownload
    }

    const allPermiArr = globalStore.mensPageBtnPermArr
    const defaultArr = [
      '红人:邀约自动化:邮件-导出',
      '红人:邀约自动化:插件-导出',
      '红人:邀约计划:邮件-按计划-导出',
      '红人:邀约计划:邮件-按红人-导出',
      '红人:邀约计划:插件-按计划-导出',
      '红人:邀约计划:插件-按红人-导出',
      '仓库:仓库列表:FBT平台仓-导出',
      '仓库:仓库列表:本地仓-导出',
      '仓库:仓库列表:海外仓-导出'
    ]
    const authName = defaultArr.includes(props.premiStr) ? props.premiStr : `${props.premiStr}:导出`
    if (allPermiArr?.includes('*:*:*')) return props.showBtnDownload

    return allPermiArr?.includes(authName) && props.showBtnDownload
  })

  // Methods
  const showItemChange = (obj: ShowItemChangeEvent) => {
    emit('showItemChange', obj)
  }

  const draggableList = (obj: DraggableChangeEvent): void => {
    emit('draggableChange', obj)
  }

  const btnClick = (type: string) => {
    emit('btnClickCb', type)
    if (type === 'download') {
      ElMessage.info('正在下载，请耐心等待！')
    }
  }

  const fnGetHabit = () => {
    if (mkTableFilterRef.value && 'fnGetHabits' in mkTableFilterRef.value) {
      mkTableFilterRef.value.fnGetHabits()
    }
  }

  // 暴露方法给父组件
  defineExpose({
    fnGetHabit
  })
</script>

<style lang="scss" scoped>
  .btn-group {
    display: flex;
    justify-content: flex-end;
    margin-bottom: 12px;
  }

  .icon-btn {
    box-sizing: border-box;
    //background: #fff;
    //color: #909399;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-left: 16px;
    border: 1px solid #dddfe3;
    border-radius: 2px;

    .mk-iconfont {
      font-size: 14px;
    }

    &:hover {
      background: none;

      .mk-iconfont {
        color: #8e9fff;
      }
    }
  }
</style>
