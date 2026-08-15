<!-- 对比设置弹窗：参照旧项目 tabInfo_contrast 对比设置 -->
<!-- 最近八天 / 自定义时间；两列带边框的日期格；首个「今日」禁用，其余可删；新增对比日期（最多 8） -->
<template>
  <ElDialog
    :model-value="modelValue"
    title="对比设置"
    width="900px"
    append-to-body
    class="compare-setting-dialog"
    @update:model-value="(v: boolean) => emit('update:modelValue', v)"
    @open="onOpen"
  >
    <div class="compare-setting-body">
      <div class="setting-row">
        <span class="setting-label">对比的日期：</span>
        <ElRadioGroup v-model="mode" @change="onModeChange">
          <ElRadio value="recent">最近八天</ElRadio>
          <ElRadio value="custom">自定义时间</ElRadio>
        </ElRadioGroup>
      </div>

      <div class="compare-grid">
        <div v-for="(item, idx) in editDates" :key="idx" class="compare-cell">
          <MkDayPicker
            class="compare-date"
            :date="item.date"
            :date-str="displayLabel(item, idx)"
            :base-date="endDate"
            :disabled="idx === 0"
            @change="(date: string, label: string) => onPick(idx, date, label)"
          />
          <ElIcon v-if="idx !== 0" class="del" @click="removeDate(idx)">
            <Delete />
          </ElIcon>
        </div>

        <div class="compare-cell add-cell">
          <ElButton type="primary" link @click="addDate">
            <ElIcon><Plus /></ElIcon>新增对比日期
          </ElButton>
        </div>
      </div>
    </div>

    <template #footer>
      <ElButton @click="emit('update:modelValue', false)">取消</ElButton>
      <ElButton type="primary" @click="confirm">确定</ElButton>
    </template>
  </ElDialog>
</template>

<script setup lang="ts">
  import { ref } from 'vue'
  import { ElMessage } from 'element-plus'
  import { Delete, Plus } from '@element-plus/icons-vue'
  import { genRecentDates, type ContrastDate } from '../utils/hourly-mock'
  import MkDayPicker from './mk-day-picker.vue'

  defineOptions({ name: 'CompareSettingDialog' })

  interface Props {
    /** 弹窗显隐（v-model） */
    modelValue: boolean
    /** 当前对比日期 */
    dates: ContrastDate[]
    /** 「今日」基准日期 */
    endDate?: string
  }
  const props = withDefaults(defineProps<Props>(), { endDate: '' })

  const emit = defineEmits<{
    'update:modelValue': [v: boolean]
    confirm: [dates: ContrastDate[]]
  }>()

  /** 对比模式：recent 最近八天 / custom 自定义时间 */
  const mode = ref<'recent' | 'custom'>('recent')
  /** 编辑中的对比日期（本地副本，确定时才回写父级） */
  const editDates = ref<ContrastDate[]>([])

  /** 打开弹窗：以传入 dates 初始化，无则取最近八天 */
  const onOpen = () => {
    mode.value = 'recent'
    editDates.value = props.dates.length
      ? props.dates.map((d) => ({ ...d }))
      : genRecentDates(props.endDate, 8)
  }

  /** 切换模式：最近八天→最近八天；自定义时间→默认只留「今日」一格（最多可加至 8 个） */
  const onModeChange = () => {
    editDates.value =
      mode.value === 'recent' ? genRecentDates(props.endDate, 8) : genRecentDates(props.endDate, 1)
  }

  /** 弹窗显示标签：首格固定「今日」，其余按存储标签，缺省用日期 */
  const displayLabel = (item: ContrastDate, idx: number) => {
    if (idx === 0) return '今日'
    return item.dateStr || item.date
  }

  /** 选择回写：快捷→名称标签，日历→日期标签 */
  const onPick = (idx: number, date: string, label: string) => {
    editDates.value[idx] = { date, dateStr: label }
  }

  /** 新增一条对比日期（最多 8 条） */
  const addDate = () => {
    if (editDates.value.length >= 8) {
      ElMessage.error('最多只能添加八个！')
      return
    }
    editDates.value.push({ date: '', dateStr: '' })
  }

  /** 删除指定对比日期 */
  const removeDate = (idx: number) => {
    editDates.value.splice(idx, 1)
  }

  /** 确定：输出最终对比日期并关闭（首格固定「今日」，其余按存储标签，缺省用日期） */
  const confirm = () => {
    const out = editDates.value.map((d, i) => ({
      date: d.date,
      dateStr: i === 0 ? '今日' : d.dateStr || d.date
    }))
    emit('confirm', out)
    emit('update:modelValue', false)
  }
</script>

<style lang="scss" scoped>
  .compare-setting-body {
    padding: 4px 8px;
  }

  .setting-row {
    display: flex;
    align-items: center;
    margin-bottom: 12px;

    .setting-label {
      margin-right: 16px;
      font-size: 13px;
      color: var(--art-gray-700);
    }
  }

  // 两列网格：每格带边框，参照旧项目布局
  .compare-grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 16px;
    padding: 16px;
    border: 1px solid var(--el-border-color-lighter);
    border-radius: 4px;
  }

  .compare-cell {
    display: flex;
    gap: 10px;
    align-items: center;
    padding: 8px 12px;
    border: 1px solid var(--el-border-color);
    border-radius: 4px;

    .compare-date {
      flex: 1;
    }

    .del {
      flex-shrink: 0;
      color: var(--el-text-color-secondary);
      cursor: pointer;

      &:hover {
        color: var(--el-color-danger);
      }
    }

    &.add-cell {
      justify-content: flex-start;
      border-style: dashed;
    }
  }
</style>
