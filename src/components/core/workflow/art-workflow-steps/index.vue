<template>
  <div class="art-workflow-steps">
    <ElSteps :active="currentStepIndex" align-center>
      <ElStep
        v-for="(step, index) in workflowSteps"
        :key="index"
        :title="step.title"
        :status="step.status"
        class="title-style"
      >
        <template #description>
          <div v-if="step.time || step.userName || step.remark" class="step-description">
            <div v-if="step.time || step.userName" class="step-info">
              <span class="step-time">{{
                [step.userName, step.time].filter(Boolean).join('\n')
              }}</span>
            </div>
            <div v-if="step.remark" class="step-remark-container">
              <ElCollapse v-if="step.remark.length > 50" class="remark-collapse">
                <ElCollapseItem name="remark">
                  <template #title>
                    <span class="remark-title">{{
                      step.remark.startsWith('接单说明') ? '接单说明' : '备注'
                    }}</span>
                  </template>
                  <div class="remark-content">{{ step.remark }}</div>
                </ElCollapseItem>
              </ElCollapse>
              <span v-else class="step-remark">{{
                step.remark.startsWith('接单说明') ? step.remark : `备注：${step.remark}`
              }}</span>
            </div>
          </div>
        </template>
      </ElStep>
    </ElSteps>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { ElSteps, ElStep, ElCollapse, ElCollapseItem } from 'element-plus'

  defineOptions({ name: 'ArtWorkflowSteps' })

  interface WorkflowNode {
    /** 创建时间 */
    createTime?: string
    /** 更新时间（优先展示，用于每个状态下的更新时间） */
    updateTime?: string
    /** 流程节点名称 */
    flowNodeName: string
    /** 流程节点状态：0-已完成，1-未完成 */
    flowNodeStatus: number
    /** 用户名（可选） */
    userName?: string
    /** 备注（可选） */
    remark?: string
  }

  interface Props {
    /** 工作流节点数据 */
    nodes?: WorkflowNode[]
  }

  const props = withDefaults(defineProps<Props>(), {
    nodes: () => []
  })

  // 工作流步骤
  const workflowSteps = computed(() => {
    if (!props.nodes || props.nodes.length === 0) {
      return []
    }

    // 找到第一个错误节点（已拒绝、已作废、已取消等）的索引
    const firstErrorNodeIndex = props.nodes.findIndex(
      (node) =>
        node?.flowNodeName?.includes('拒绝') ||
        node?.flowNodeName?.includes('作废') ||
        node?.flowNodeName?.includes('驳回') ||
        node?.flowNodeName?.includes('取消')
    )

    // 如果找到错误节点，只取该节点及其之前的节点，并过滤掉 flowNodeStatus 为 1（未完成）的节点
    const sliced =
      firstErrorNodeIndex !== -1 ? props.nodes.slice(0, firstErrorNodeIndex + 1) : props.nodes
    const nodesToShow =
      firstErrorNodeIndex !== -1 ? sliced.filter((node) => node.flowNodeStatus !== 1) : sliced

    return nodesToShow.map((node) => {
      // flowNodeStatus: 0-已完成，1-未完成
      // Element Plus Steps 的 status: 'success' | 'wait' | 'error' | 'finish' | 'process'
      let status: 'success' | 'wait' | 'error' = 'wait'

      // 判断是否为错误状态节点（已拒绝、已作废、已取消等）
      const isErrorNode =
        node?.flowNodeName?.includes('拒绝') ||
        node?.flowNodeName?.includes('作废') ||
        node?.flowNodeName?.includes('驳回') ||
        node?.flowNodeName?.includes('取消')

      if (node?.flowNodeStatus === 0) {
        // 已完成
        status = isErrorNode ? 'error' : 'success'
      } else if (node?.flowNodeStatus === 1) {
        // 未完成
        status = 'wait'
      }

      const timeRaw = node.updateTime || node.createTime || (node as any).operateTime || ''
      return {
        title: node.flowNodeName,
        status,
        time: timeRaw,
        userName: node.userName || '',
        remark: node.remark || node.description || ''
      }
    })
  })

  // 当前步骤索引（找到第一个未完成的步骤，如果没有则显示最后一个）
  const currentStepIndex = computed(() => {
    const steps = workflowSteps.value
    if (!steps || steps.length === 0) {
      return 0
    }

    // 找到第一个未完成的步骤索引（基于过滤后的步骤）
    const firstUncompletedIndex = steps.findIndex((step) => step.status === 'wait')

    if (firstUncompletedIndex !== -1) {
      return firstUncompletedIndex
    }

    // 如果所有步骤都已完成，返回最后一个步骤的索引
    return steps.length - 1
  })
</script>

<style lang="scss" scoped>
  .art-workflow-steps {
    height: auto;
    min-height: 100px;
    padding: 0 0 20px 20px;
    overflow: visible;

    :deep(.el-steps) {
      display: flex !important;
      flex-direction: row !important;
      width: 100%;
      height: auto;
      min-height: 100px;
      overflow: visible !important;

      .el-step {
        position: relative !important;
        display: flex !important;
        flex-direction: row !important;
        align-items: flex-start !important;
        max-width: 296.5px;
        padding-right: 20px;
        overflow: visible !important;
      }

      .el-step__title {
        padding: 0 8px;
        font-size: 14px;
        font-weight: 500;
        line-height: 32px;
        background: #fff;

        &.is-success {
          // color: #606266 !important;
          color: rgb(0 0 0 / 80%) !important;
        }
      }

      .el-step__head {
        position: relative !important;
        display: flex !important;
        flex-direction: column !important;
        flex-shrink: 0 !important;
        align-items: center !important;
        order: 1 !important;
        width: auto !important;

        .el-step__icon {
          width: 32px;
          height: 32px;
          font-size: 14px;
        }
      }

      .el-step__line {
        display: none !important;
      }

      .el-step__main {
        position: relative !important;
        flex: 0 1 auto !important;
        order: 2 !important;
        min-width: 0;
        max-width: fit-content !important;
        padding-right: 0;
        margin-top: 0 !important;
        margin-left: 0 !important;
        overflow: visible !important;
        text-align: left !important;
        word-wrap: break-word;
        overflow-wrap: break-word;

        .el-step__title {
          position: relative;
          z-index: 1;
          margin-bottom: 4px;
        }

        .el-step__description {
          position: absolute !important;
          top: 100% !important;
          left: 0 !important;
          z-index: 10 !important;
          min-width: 200px !important;
          max-width: 300px !important;
          padding: 0;
          margin-top: 4px !important;
          text-align: left !important;
          word-wrap: break-word !important;
          white-space: normal !important;
          visibility: visible !important;
          opacity: 1 !important;
        }
      }

      .el-step:not(:last-child)::after {
        position: absolute;
        top: 16px;
        left: 80px;
        z-index: 0;
        width: calc(100% - 90px);
        height: 2px;
        pointer-events: none;
        content: '' !important;
        background-color: #e4e7ed;
      }
    }

    .step-description {
      margin-top: 8px;
      text-align: left;

      .step-info {
        margin-bottom: 4px;

        .step-time {
          font-size: 12px;
          line-height: 1.4;
          color: #909399;
          white-space: pre-line;
        }
      }

      .step-remark-container {
        margin-top: 4px;

        .remark-collapse {
          :deep(.el-collapse-item__header) {
            height: auto;
            padding: 0;
            font-size: 12px;
            line-height: 20px;
            color: #909399;
            border: none;

            .remark-title {
              font-size: 12px;
              color: #909399;
            }
          }

          :deep(.el-collapse-item__wrap) {
            border: none;
          }

          :deep(.el-collapse-item__content) {
            padding: 4px 0 0;
            font-size: 12px;
            line-height: 18px;
            color: #909399;
          }
        }

        .step-remark {
          font-size: 12px;
          line-height: 18px;
          color: #909399;
        }
      }
    }

    .el-step:not(:last-child)::after {
      position: absolute;
      top: 16px;
      left: 80px;
      z-index: 0;
      width: calc(100% - 90px);
      height: 2px;
      pointer-events: none;
      content: '' !important;
      background-color: #e4e7ed;
    }
  }
</style>
