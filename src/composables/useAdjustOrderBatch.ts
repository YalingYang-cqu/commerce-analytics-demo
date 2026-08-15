import { ElMessage, ElMessageBox } from 'element-plus'
import type { Ref } from 'vue'
import {
  adjustOrderSubmit,
  adjustOrderRecall,
  adjustOrderDelete,
  adjustOrderInvalidate,
  adjustOrderConfirmAdjust
} from '@/api/warehouse/adjust-order'

/** 调整单状态枚举 */
export const ADJUST_ORDER_STATUS = {
  DRAFT: 10,
  PENDING: 20,
  COMPLETED: 60,
  INVALIDATED: 70
} as const

export type AdjustOrderBatchCommand =
  | 'submit'
  | 'recall'
  | 'delete'
  | 'invalidate'
  | 'confirmAdjust'

export interface UseAdjustOrderBatchOptions {
  /** 当前选中的行（父行） */
  selectedRows: Ref<any[]>
  /** 清空勾选 */
  clearSelection: () => void
  /** 刷新列表 */
  getData: (...args: any[]) => Promise<any> | void
  /** 是否使用本地 mock 数据（不调接口，直接改 mockList） */
  useMock?: boolean
  /** mock 模式下的列表数据 Ref，用于提交/撤回/删除/作废/确认调整时直接修改 */
  mockList?: Ref<any[]>
}

/**
 * 调整单批量/单条操作公共逻辑
 * 提供：批量命令分发、提交/撤回/删除/作废/确认调整的二次确认与接口调用（或 mock 写入）
 */
export function useAdjustOrderBatch(options: UseAdjustOrderBatchOptions) {
  const { selectedRows, clearSelection, getData, useMock = false, mockList } = options
  const {
    DRAFT: STATUS_DRAFT,
    PENDING: STATUS_PENDING,
    COMPLETED: STATUS_COMPLETED,
    INVALIDATED: STATUS_INVALIDATED
  } = ADJUST_ORDER_STATUS

  const onSuccess = async () => {
    clearSelection()
    await getData()
  }

  async function doSubmit(rows: any[]) {
    const n = rows.length
    try {
      await ElMessageBox.confirm(
        `共${n}个调整单，确认全部提交？<br/>提交后不可编辑，且状态变更为“待调整”。`,
        '确认提交？',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
      if (useMock && mockList) {
        rows.forEach((r) => (r.status = STATUS_PENDING))
        ElMessage.success('操作成功')
        await onSuccess()
      } else {
        const ids = rows.map((r) => r.id)
        await adjustOrderSubmit(ids)
        ElMessage.success('操作成功')
        await onSuccess()
      }
    } catch (e: any) {
      if (e !== 'cancel') throw e
    }
  }

  async function doRecall(rows: any[]) {
    const n = rows.length
    try {
      await ElMessageBox.confirm(
        `共${n}个调整单，确认全部撤回？<br/>撤回后状态变更为“草稿”。`,
        '确认撤回？',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
      if (useMock && mockList) {
        rows.forEach((r) => (r.status = STATUS_DRAFT))
        ElMessage.success('操作成功')
        await onSuccess()
      } else {
        const ids = rows.map((r) => r.id)
        await adjustOrderRecall(ids)
        ElMessage.success('操作成功')
        await onSuccess()
      }
    } catch (e: any) {
      if (e !== 'cancel') throw e
    }
  }

  async function doDelete(rows: any[]) {
    const n = rows.length
    try {
      await ElMessageBox.confirm(
        `共${n}个调整单，确认全部删除？<br/>删除后数据不可恢复！`,
        '确认删除？',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
      if (useMock && mockList) {
        const ids = new Set(rows.map((r) => r.id))
        mockList.value = mockList.value.filter((item) => !ids.has(item.id))
        ElMessage.success('操作成功')
        await onSuccess()
      } else {
        const ids = rows.map((r) => r.id)
        await adjustOrderDelete(ids)
        ElMessage.success('操作成功')
        await onSuccess()
      }
    } catch (e: any) {
      if (e !== 'cancel') throw e
    }
  }

  async function doInvalidate(rows: any[]) {
    const n = rows.length
    try {
      await ElMessageBox.confirm(
        `共${n}个调整单，确认全部作废？<br/>作废后状态变更为“已作废”。`,
        '确认作废？',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
      if (useMock && mockList) {
        rows.forEach((r) => (r.status = STATUS_INVALIDATED))
        ElMessage.success('操作成功')
        await onSuccess()
      } else {
        const ids = rows.map((r) => r.id)
        await adjustOrderInvalidate(ids)
        ElMessage.success('操作成功')
        await onSuccess()
      }
    } catch (e: any) {
      if (e !== 'cancel') throw e
    }
  }

  async function doConfirmAdjust(rows: any[]) {
    const n = rows.length
    try {
      await ElMessageBox.confirm(
        `共${n}个调整单，确认全部调整？<br/>确认调整后状态变更为“已完成”。`,
        '确认调整？',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
      if (useMock && mockList) {
        rows.forEach((r) => (r.status = STATUS_COMPLETED))
        ElMessage.success('操作成功')
        await onSuccess()
      } else {
        const ids = rows.map((r) => r.id)
        await adjustOrderConfirmAdjust(ids)
        ElMessage.success('操作成功')
        await onSuccess()
      }
    } catch (e: any) {
      if (e !== 'cancel') throw e
    }
  }

  /**
   * 批量操作命令分发：根据 command 校验勾选与状态后执行对应 do* 方法
   * 注意：编辑为单条操作，不在此处理，由页面根据 command === 'edit' 单独处理
   */
  function handleBatchCommand(command: AdjustOrderBatchCommand) {
    if (command === 'submit') {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请勾选数据')
        return
      }
      const list = selectedRows.value.filter((r: any) => r.status === STATUS_DRAFT)
      if (list.length === 0) {
        ElMessage.warning('仅“草稿”状态支持该操作')
        return
      }
      doSubmit(list)
    } else if (command === 'recall') {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请勾选数据')
        return
      }
      const list = selectedRows.value.filter((r: any) => r.status === STATUS_PENDING)
      if (list.length === 0) {
        ElMessage.warning('仅“待调整”状态支持该操作')
        return
      }
      doRecall(list)
    } else if (command === 'delete') {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请勾选数据')
        return
      }
      const list = selectedRows.value.filter((r: any) => r.status === STATUS_DRAFT)
      if (list.length === 0) {
        ElMessage.warning('仅“草稿”状态支持该操作')
        return
      }
      doDelete(list)
    } else if (command === 'invalidate') {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请勾选数据')
        return
      }
      const list = selectedRows.value.filter((r: any) => r.status === STATUS_PENDING)
      if (list.length === 0) {
        ElMessage.warning('仅“待调整”状态支持该操作')
        return
      }
      doInvalidate(list)
    } else if (command === 'confirmAdjust') {
      if (selectedRows.value.length === 0) {
        ElMessage.warning('请勾选数据')
        return
      }
      const list = selectedRows.value.filter((r: any) => r.status === STATUS_PENDING)
      if (list.length === 0) {
        ElMessage.warning('仅“待调整”状态支持该操作')
        return
      }
      doConfirmAdjust(list)
    }
  }

  return {
    handleBatchCommand,
    doSubmit,
    doRecall,
    doDelete,
    doInvalidate,
    doConfirmAdjust
  }
}
