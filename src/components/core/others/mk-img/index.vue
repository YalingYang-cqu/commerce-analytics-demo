<template>
  <div>
    <el-image
      v-if="src"
      :src="getImageSrc(src)"
      :class="imgClass"
      :preview-src-list="previewSrcList ? [getImageSrc(previewSrcList)] : []"
    >
      <template #error>
        <div class="image-slot">
          <img :src="defaultImg" alt="暂无图片" :class="imgClass" />
        </div>
      </template>
      <template #placeholder>
        <div class="image-slot">
          <i class="el-icon-loading" />
        </div>
      </template>
    </el-image>
    <el-image v-else :src="defaultImg" :class="imgClass" />
  </div>
</template>

<script setup lang="ts">
  // import { computed } from 'vue'
  import noPicPng from '@/assets/img/common/nopic.png'

  // interface Props {
  //   imgClass?: string
  //   src?: string
  //   previewSrcList?: string
  //   imgWidth?: string | number
  // }

  // Props
  // const props = withDefaults(defineProps<Props>(), {
  //   imgClass: 'img-product',
  //   src: '',
  //   previewSrcList: '',
  //   imgWidth: 0
  // })

  // Constants
  const ossUrl = 'https://your-oss-domain.com' // 替换为实际的 OSS URL
  const defaultImg = noPicPng

  // Computed
  /** 获取图片完整路径 */
  const getImageSrc = (url: string): string => {
    if (!url) return ''

    const hasAmazonUrl = url.indexOf('https://m.media-amazon.com') === 0
    const hasOssUrl = url.indexOf(ossUrl) === 0

    return hasAmazonUrl || hasOssUrl ? url : ossUrl + url
  }
</script>

<style scoped lang="scss">
  @mixin imgStyle() {
    :deep(img) {
      width: auto;
      max-width: 100%;
      height: 100%;
    }
  }

  .img-product {
    width: 36px;
    height: 36px;
    text-align: center;

    @include imgStyle();
  }

  .img-auto {
    width: auto;
    max-width: none;
    height: auto;
  }

  .saleInfo-img {
    width: 80px;
    height: 80px;
    margin-right: 10px;

    @include imgStyle();
  }

  .img-Product-assign {
    width: 140px;
    max-width: none;
    height: 140px;

    @include imgStyle();
  }

  .list-img {
    width: 60px;
    max-width: none;
    height: 60px;

    @include imgStyle();
  }

  .img-full {
    width: 100%;
    max-width: none;
    height: 100%;

    @include imgStyle();
  }

  .img-half {
    width: 80%;
    max-width: none;
    height: auto;

    @include imgStyle();
  }
</style>
