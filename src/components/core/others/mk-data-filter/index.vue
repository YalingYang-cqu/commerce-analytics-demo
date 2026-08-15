<template>
  <el-popover placement="bottom" :width="300" trigger="click" v-model:visible="visible">
    <mk-select-input
      v-for="(item, index) in setting"
      :key="index"
      class="mk-select-input"
      :default-value="defaultValue[item.key]"
      :title="item.name"
      :clear-flag="clearFlag"
      :select-options="item.selectOptions"
      @setting-change="handleSettingChange($event, item)"
    />
    <div class="popover-footer-btn">
      <el-button size="small" type="primary" link @click="handleReset">清空</el-button>
      <div>
        <el-button size="small" @click="visible = false">取消</el-button>
        <el-button type="primary" size="small" @click="handleConfirm">确定</el-button>
      </div>
    </div>
    <template #reference>
      <el-button
        :icon="Filter"
        style="width: 32px; padding: 0; color: #909399"
        :class="{ 'icon-btn-active-filter': visible }"
      />
    </template>
  </el-popover>
</template>

<script setup lang="ts">
  import { ref, watch } from 'vue'
  import { ElButton, ElPopover } from 'element-plus'
  import { Filter } from '@element-plus/icons-vue'

  // Types
  interface FilterSetting {
    key: string
    name: string
    selectOptions: any[]
  }

  interface FilterParams {
    [key: string]: {
      value?: any
      [key: string]: any
    }
  }

  interface Props {
    /** 筛选设置 */
    setting: FilterSetting[]
    /** 默认值 */
    defaultValue: Record<string, any>
  }

  interface Emits {
    /** 获取筛选数据 */
    (e: 'getDataFilterObj', value: FilterParams): void
  }

  // Props
  const props = defineProps<Props>()

  // Emits
  const emit = defineEmits<Emits>()

  // Refs
  const visible = ref<boolean>(false)
  const paramsObj = ref<FilterParams>({})
  const clearFlag = ref<boolean>(false)

  // Watchers
  watch(
    () => props.defaultValue,
    (newValue) => {
      // 当默认值变化时更新参数对象
      paramsObj.value = { ...newValue }
    },
    { deep: true, immediate: true }
  )

  // Methods
  /** 重置筛选 */
  const handleReset = (): void => {
    clearFlag.value = !clearFlag.value
    paramsObj.value = {}
  }

  /** 确认筛选 */
  const handleConfirm = (): void => {
    visible.value = false
    emit('getDataFilterObj', paramsObj.value)
  }

  /** 设置变化 */
  const handleSettingChange = (obj: any, item: FilterSetting): void => {
    const newParams = { ...paramsObj.value }
    if (obj.value) {
      newParams[item.key] = { ...obj }
    } else {
      delete newParams[item.key]
    }
    paramsObj.value = newParams
  }
</script>
<style lang="scss" scoped>
  .mk-select-input {
    margin-bottom: 10px;
  }

  .popover-footer-btn {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  .el-button.icon-btn-active-filter {
    border-color: #425eff;

    &:focus,
    &:hover {
      background: none;
    }

    :deep(.el-icon) {
      color: #425eff;
    }
  }
</style>
