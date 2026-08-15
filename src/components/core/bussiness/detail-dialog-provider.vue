<template>
  <!-- 全局单例：SKU 详情弹窗，多行表格只存在一个实例，选项仅请求一次 -->
  <AddSkuDialog
    v-model:visible="skuState.visible"
    :from="skuState.dialogFrom"
    :init-data="skuState.initData"
    :category-options="skuOptions.categoryList"
    :brand-options="skuOptions.brandList"
    :user-options="skuOptions.userList"
  />
  <!-- 全局单例：SPU 详情弹窗 -->
  <!-- 勿传 from="spu"：AddSPUDialog 在 from===spu 时依赖父页 provide(basicData)，全局弹窗需 from 非 spu 以在组件内 provide -->
  <AddSPUDialog v-model:visible="spuState.visible" :init-data="spuState.initData" />
</template>

<script setup lang="ts">
  import AddSkuDialog from '@views/product/product-info/sku-manage/modules/add-sku-dialog/index.vue'
  import AddSPUDialog from '@views/product/product-info/spu-manage/modules/add-spu-dialog/index.vue'
  import { useDetailDialog } from '@/composables/useDetailDialog'

  const { skuState, spuState, skuOptions } = useDetailDialog()
</script>
