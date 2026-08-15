import { ElMessage, ElMessageBox } from 'element-plus'
import type { Ref } from 'vue'
import {
  warehouseOutSubmit,
  warehouseOutRecall,
  warehouseOutDelete,
  warehouseOutInvalidate,
  warehouseOutConfirm
} from '@/api/warehouse/warehouse-out'

/** 出库单状态（与 IMS 一致：10 草稿 / 20 待出库 / 30 已完成 / 40 已作废） */
export const WAREHOUSE_OUT_STATUS = {
  DRAFT: 10,
  PENDING: 20,
  COMPLETED: 30,
  INVALIDATED: 40
} as const

export type WarehouseOutBatchCommand =
  | 'submit'
  | 'recall'
  | 'delete'
  | 'invalidate'
  | 'confirmOutbound'

export interface UseWarehouseOutBatchOptions {
  /** 当前选中的行（父行） */
  selectedRows: Ref<any[]>
  /** 清空勾选 */
  clearSelection: () => void
  /** 刷新列表 */
  getData: (...args: any[]) => Promise<any> | void
}

/**
 * 出库单批量/单条操作公共逻辑
 * 提供：批量命令分发、提交/撤回/删除/作废/确认出库的二次确认与接口调用
 */
export function useWarehouseOutBatch(options: UseWarehouseOutBatchOptions) {
  const { selectedRows, clearSelection, getData } = options
  const { DRAFT: STATUS_DRAFT, PENDING: STATUS_PENDING } = WAREHOUSE_OUT_STATUS

  const onSuccess = async () => {
    clearSelection()
    await getData()
  }

  async function doSubmit(rows: any[]) {
    const n = rows.length
    try {
      await ElMessageBox.confirm(
        `共${n}个出库单，确认全部提交？<br/>提交后不可编辑，且状态变更为“待出库”。`,
        '确认提交？',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
      const ids = rows.map((r) => r.id)
      await warehouseOutSubmit(ids)
      ElMessage.success('操作成功')
      await onSuccess()
    } catch (e: any) {
      if (e !== 'cancel') throw e
    }
  }

  async function doRecall(rows: any[]) {
    const n = rows.length
    try {
      await ElMessageBox.confirm(
        `共${n}个出库单，确认全部撤回？<br/>撤回后状态变更为“草稿”。`,
        '确认撤回？',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
      const ids = rows.map((r) => r.id)
      await warehouseOutRecall(ids)
      ElMessage.success('操作成功')
      await onSuccess()
    } catch (e: any) {
      if (e !== 'cancel') throw e
    }
  }

  async function doDelete(rows: any[]) {
    const n = rows.length
    try {
      await ElMessageBox.confirm(
        `共${n}个出库单，确认全部删除？<br/>删除后数据不可恢复！`,
        '确认删除？',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
      const ids = rows.map((r) => r.id)
      await warehouseOutDelete(ids)
      ElMessage.success('操作成功')
      await onSuccess()
    } catch (e: any) {
      if (e !== 'cancel') throw e
    }
  }

  async function doInvalidate(rows: any[]) {
    const n = rows.length
    try {
      await ElMessageBox.confirm(
        `共${n}个出库单，确认全部作废？<br/>作废后状态变更为“已作废”。`,
        '确认作废？',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
      const ids = rows.map((r) => r.id)
      await warehouseOutInvalidate(ids)
      ElMessage.success('操作成功')
      await onSuccess()
    } catch (e: any) {
      if (e !== 'cancel') throw e
    }
  }

  async function doConfirmOutbound(rows: any[]) {
    const n = rows.length
    try {
      await ElMessageBox.confirm(
        `共${n}个出库单，确认全部出库？<br/>确认出库后状态变更为“已完成”。`,
        '确认出库？',
        {
          confirmButtonText: '确认',
          cancelButtonText: '取消',
          type: 'warning',
          dangerouslyUseHTMLString: true
        }
      )
      const ids = rows.map((r) => r.id)
      await warehouseOutConfirm(ids)
      ElMessage.success('操作成功')
      await onSuccess()
    } catch (e: any) {
      if (e !== 'cancel') throw e
    }
  }

  /**
   * 批量操作命令分发：根据 command 校验勾选与状态后执行对应 do* 方法
   */
  function handleBatchCommand(command: WarehouseOutBatchCommand) {
    if (selectedRows.value.length === 0) {
      ElMessage.warning('请勾选数据')
      return
    }
    const rows = selectedRows.value

    if (command === 'submit') {
      if (rows.some((r: any) => r.status !== STATUS_DRAFT)) {
        ElMessage.warning('仅“草稿”状态支持该操作')
        return
      }
      doSubmit(rows)
    } else if (command === 'recall') {
      if (rows.some((r: any) => r.status !== STATUS_PENDING)) {
        ElMessage.warning('仅“待出库”状态支持该操作')
        return
      }
      doRecall(rows)
    } else if (command === 'delete') {
      if (rows.some((r: any) => r.status !== STATUS_DRAFT)) {
        ElMessage.warning('仅“草稿”状态支持该操作')
        return
      }
      doDelete(rows)
    } else if (command === 'invalidate') {
      if (rows.some((r: any) => r.status !== STATUS_PENDING)) {
        ElMessage.warning('仅“待出库”状态支持该操作')
        return
      }
      doInvalidate(rows)
    } else if (command === 'confirmOutbound') {
      if (rows.some((r: any) => r.status !== STATUS_PENDING)) {
        ElMessage.warning('仅“待出库”状态支持该操作')
        return
      }
      doConfirmOutbound(rows)
    }
  }

  return {
    handleBatchCommand,
    doSubmit,
    doRecall,
    doDelete,
    doInvalidate,
    doConfirmOutbound
  }
}
