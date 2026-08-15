import { ElMessage, ElMessageBox } from 'element-plus'
import { cancelOrder, deleteOrder, placeOrder, withdrawnOrder } from '@/api/purchase/order'

/**
 * 采购订单相关公共方法
 */
export function usePurchaseOrder() {
  /**
   * 确认下单处理函数
   * @param orders 订单列表
   * @param options 配置选项
   * @param options.onSuccess 成功回调，接收订单列表参数
   * @param options.onRefresh 刷新数据回调
   * @param options.updateSelectedRows 更新选中列表回调，接收过滤函数参数
   */
  const handleConfirmOrder = async (
    orders: any[],
    options?: {
      onSuccess?: (orders: any[]) => void
      onRefresh?: () => Promise<void>
      updateSelectedRows?: (filterFn: (row: any) => boolean) => void
    },
    isBatch: boolean = false
  ) => {
    const orderCount = orders.length
    const msg = isBatch
      ? `共${orderCount}个采购订单，确认全部下单？\n\n提交后不可编辑，且状态变更为"待接单"。`
      : `提交后不可编辑，且状态变更为"待接单"。`
    try {
      await ElMessageBox.confirm(msg, '确认下单？', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      })

      // 提取订单ID
      const orderIds = orders.map((order) => order.id)

      // 调用API确认下单
      await placeOrder(orderIds)

      // 执行成功回调
      if (options?.onSuccess) {
        options.onSuccess(orders)
      }

      // 更新选中列表，移除已处理的订单
      if (options?.updateSelectedRows) {
        options.updateSelectedRows((row: any) => {
          return !orders.some((order: any) => order.id === row.id)
        })
      }

      // 刷新数据
      if (options?.onRefresh) {
        await options.onRefresh()
      }

      ElMessage.success('操作成功')
    } catch (error: any) {
      // 用户取消操作时不显示错误
      if (error !== 'cancel') {
        console.log(error)
      }
    }
  }

  /**
   * 撤回下单处理函数
   * @param orders 订单列表
   * @param options 配置选项
   * @param options.onSuccess 成功回调，接收订单列表参数
   * @param options.onRefresh 刷新数据回调
   * @param options.updateSelectedRows 更新选中列表回调，接收过滤函数参数
   * @param options.onAfterSuccess 成功后回调（如跳转页面）
   */
  const handleCancelOrder = async (
    orders: any[],
    options?: {
      onSuccess?: (orders: any[]) => void
      onRefresh?: () => Promise<void>
      updateSelectedRows?: (filterFn: (row: any) => boolean) => void
      onAfterSuccess?: () => void
    },
    isBatch: boolean = false
  ) => {
    const orderCount = orders.length
    const msg = isBatch
      ? `共${orderCount}个采购订单，确认全部撤回下单？\n\n撤回后状态变更为"待下单"。`
      : `撤回后状态变更为"待下单"。`
    try {
      await ElMessageBox.confirm(msg, '确认撤回？', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      })

      // 提取订单ID
      const orderIds = orders.map((order) => order.id)

      // 调用API撤回下单
      await withdrawnOrder(orderIds)

      // 执行成功回调
      if (options?.onSuccess) {
        options.onSuccess(orders)
      }

      // 更新选中列表，移除已处理的订单
      if (options?.updateSelectedRows) {
        options.updateSelectedRows((row: any) => {
          return !orders.some((order: any) => order.id === row.id)
        })
      }

      // 刷新数据
      if (options?.onRefresh) {
        await options.onRefresh()
      }

      // 执行后置回调
      if (options?.onAfterSuccess) {
        options.onAfterSuccess()
      }

      ElMessage.success('操作成功')
    } catch (error: any) {
      // 用户取消操作时不显示错误
      if (error !== 'cancel') {
        console.log(error)
      }
    }
  }

  /**
   * 作废订单处理函数
   * @param orders 订单列表
   * @param options 配置选项
   * @param options.onSuccess 成功回调，接收订单列表参数
   * @param options.onRefresh 刷新数据回调
   * @param options.updateSelectedRows 更新选中列表回调，接收过滤函数参数
   * @param options.onAfterSuccess 成功后回调（如跳转页面）
   */
  const handleVoidOrder = async (
    orders: any[],
    options?: {
      onSuccess?: (orders: any[]) => void
      onRefresh?: () => Promise<void>
      updateSelectedRows?: (filterFn: (row: any) => boolean) => void
      onAfterSuccess?: () => void
    },
    isBatch: boolean = false
  ) => {
    const orderCount = orders.length
    const msg = isBatch
      ? `共${orderCount}个采购订单，确认全部作废？\n\n作废后状态变更为"已作废"。`
      : `作废后状态变更为"已作废"`
    try {
      await ElMessageBox.confirm(msg, '确认作废？', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      })

      // 提取订单ID
      const orderIds = orders.map((order) => order.id)

      // 调用API作废订单
      await cancelOrder(orderIds)

      // 执行成功回调
      if (options?.onSuccess) {
        options.onSuccess(orders)
      }

      // 更新选中列表，移除已处理的订单
      if (options?.updateSelectedRows) {
        options.updateSelectedRows((row: any) => {
          return !orders.some((order: any) => order.id === row.id)
        })
      }

      // 刷新数据
      if (options?.onRefresh) {
        await options.onRefresh()
      }

      // 执行后置回调
      if (options?.onAfterSuccess) {
        options.onAfterSuccess()
      }

      ElMessage.success('操作成功')
    } catch (error: any) {
      // 用户取消操作时不显示错误
      if (error !== 'cancel') {
        console.log(error)
      }
    }
  }

  /**
   * 删除订单处理函数
   * @param orders 订单列表
   * @param options 配置选项
   * @param options.onSuccess 成功回调，接收订单列表参数
   * @param options.onRefresh 刷新数据回调
   * @param options.updateSelectedRows 更新选中列表回调，接收过滤函数参数
   * @param options.onAfterSuccess 成功后回调（如跳转页面）
   */
  const handleDeleteOrder = async (
    orders: any[],
    options?: {
      onSuccess?: (orders: any[]) => void
      onRefresh?: () => Promise<void>
      updateSelectedRows?: (filterFn: (row: any) => boolean) => void
      onAfterSuccess?: () => void
    },
    isBatch: boolean = false
  ) => {
    const orderCount = orders.length
    const msg = isBatch
      ? `共${orderCount}个采购订单，确认全部删除？\n\n删除后数据不可恢复！`
      : `删除后数据不可恢复!`
    try {
      await ElMessageBox.confirm(msg, '确认删除？', {
        confirmButtonText: '确认',
        cancelButtonText: '取消',
        type: 'warning',
        dangerouslyUseHTMLString: false
      })

      // 提取订单ID
      const orderIds = orders.map((order) => order.id)

      // 调用API删除订单
      await deleteOrder(orderIds)

      // 执行成功回调
      if (options?.onSuccess) {
        options.onSuccess(orders)
      }

      // 更新选中列表，移除已删除的订单
      if (options?.updateSelectedRows) {
        options.updateSelectedRows((row: any) => {
          return !orders.some((order: any) => order.id === row.id)
        })
      }

      // 刷新数据
      if (options?.onRefresh) {
        await options.onRefresh()
      }

      // 执行后置回调（删除后通常需要跳转）
      if (options?.onAfterSuccess) {
        options.onAfterSuccess()
      }

      ElMessage.success('操作成功')
    } catch (error: any) {
      // 用户取消操作时不显示错误
      if (error !== 'cancel') {
        console.log(error)
      }
    }
  }

  return {
    handleConfirmOrder,
    handleCancelOrder,
    handleVoidOrder,
    handleDeleteOrder
  }
}
