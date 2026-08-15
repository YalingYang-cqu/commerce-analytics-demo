<template>
  <div class="image-info-detail">
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">产品图片</span>
      </div>

      <div class="image-gallery">
        <template v-if="modelValue?.picList && modelValue.picList.length">
          <div
            v-for="(image, index) in modelValue.picList"
            :key="image.id || index"
            class="image-item"
          >
            <ElImage
              :src="image.picsUrl"
              :preview-src-list="imageUrls"
              :initial-index="index"
              fit="cover"
              class="image-preview"
            >
              <template #error>
                <div class="image-error">
                  <el-icon><Picture /></el-icon>
                  <span>加载失败</span>
                </div>
              </template>
            </ElImage>
          </div>
        </template>
        <div v-else class="empty-state">
          <el-icon class="empty-icon"><Picture /></el-icon>
          <div class="empty-text">暂无产品图片</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
  import { computed } from 'vue'
  import { ElImage } from 'element-plus'
  import { Picture } from '@element-plus/icons-vue'

  interface Props {
    modelValue: any
  }

  const props = defineProps<Props>()

  // 提取所有图片URL用于预览
  const imageUrls = computed(() => {
    return props.modelValue?.picList?.map((img: any) => img.picsUrl) || []
  })
</script>

<style lang="scss" scoped>
  .image-info-detail {
    padding: 20px;

    .section {
      .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 20px;

        .section-title-bar {
          width: 4px;
          height: 16px;
          margin-right: 8px;
          background-color: var(--el-color-primary);
        }

        .section-title {
          font-size: 16px;
          font-weight: 600;
          color: var(--el-text-color-primary);
        }
      }

      .image-gallery {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(148px, 1fr));
        gap: 16px;

        .image-item {
          width: 148px;
          height: 148px;
          overflow: hidden;
          border: 1px solid var(--el-border-color);
          border-radius: 4px;

          .image-preview {
            width: 100%;
            height: 100%;
            cursor: pointer;
          }

          .image-error {
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            width: 100%;
            height: 100%;
            color: var(--el-text-color-secondary);
            background-color: var(--el-fill-color-light);

            .el-icon {
              margin-bottom: 8px;
              font-size: 32px;
            }

            span {
              font-size: 12px;
            }
          }
        }

        .empty-state {
          display: flex;
          flex-direction: column;
          grid-column: 1 / -1;
          align-items: center;
          justify-content: center;
          padding: 60px 0;
          color: var(--el-text-color-secondary);

          .empty-icon {
            margin-bottom: 16px;
            font-size: 64px;
            opacity: 0.5;
          }

          .empty-text {
            font-size: 14px;
          }
        }
      }
    }
  }
</style>
