<template>
  <div class="art-workflow-steps">
    <ElSteps :active="currentStepIndex" align-center>
      <ElStep
        v-for="(step, index) in workflowSteps"
        :key="index"
        :title="step.title"
        :status="step.status"
      >
        <template #description>
          <div v-if="step.time || step.userName || step.remark" class="step-description">
            <div v-if="step.time || step.userName" class="step-info">
              <span v-if="step.time" class="step-time">{{ step.time }}</span>
              <span v-if="step.userName" class="step-user">{{ step.userName }}</span>
            </div>
            <div v-if="step.remark" class="step-remark-container">
              <ElCollapse v-if="step.remark.length > 50" class="remark-collapse">
                <ElCollapseItem name="remark">
                  <template #title>
                    <span class="remark-title">备注</span>
                  </template>
                  <div class="remark-content">{{ step.remark }}</div>
                </ElCollapseItem>
              </ElCollapse>
              <span v-else class="step-remark">备注：{{ step.remark }}</span>
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

    return props.nodes.map((node) => {
      // flowNodeStatus: 0-已完成，1-未完成
      // Element Plus Steps 的 status: 'success' | 'wait' | 'error' | 'finish' | 'process'
      let status: 'success' | 'wait' | 'error' = 'wait'

      // 判断是否为错误状态节点（已拒绝、已作废等）
      const isErrorNode =
        node.flowNodeName.includes('拒绝') ||
        node.flowNodeName.includes('作废') ||
        node.flowNodeName.includes('驳回')

      if (node.flowNodeStatus === 0) {
        // 已完成
        status = isErrorNode ? 'error' : 'success'
      } else if (node.flowNodeStatus === 1) {
        // 未完成
        status = 'wait'
      }

      return {
        title: node.flowNodeName,
        status,
        time: node.createTime || '',
        userName: node.userName || '',
        remark: node.remark || ''
      }
    })
  })

  // 当前步骤索引（找到第一个未完成的步骤，如果没有则显示最后一个）
  const currentStepIndex = computed(() => {
    if (!props.nodes || props.nodes.length === 0) {
      return 0
    }

    // 找到第一个未完成的步骤索引
    const firstUncompletedIndex = props.nodes.findIndex((node) => node.flowNodeStatus === 1)

    if (firstUncompletedIndex !== -1) {
      return firstUncompletedIndex
    }

    // 如果所有步骤都已完成，返回最后一个步骤的索引
    return props.nodes.length - 1
  })
</script>

<style lang="scss" scoped>
  .art-workflow-steps {
    :deep(.el-steps) {
      .el-step__head {
        .el-step__icon {
          width: 32px;
          height: 32px;
          font-size: 14px;
        }
      }

      .el-step__title {
        font-size: 14px;
        font-weight: 500;
        line-height: 22px;
      }
    }

    .step-description {
      margin-top: 8px;
      text-align: left;

      .step-info {
        display: flex;
        flex-direction: column;
        gap: 4px;
        margin-bottom: 4px;

        .step-time {
          font-size: 12px;
          color: #909399;
        }

        .step-user {
          font-size: 12px;
          color: #606266;
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
            color: #606266;
          }
        }

        .step-remark {
          font-size: 12px;
          line-height: 18px;
          color: #606266;
        }
      }
    }
  }
</style>
