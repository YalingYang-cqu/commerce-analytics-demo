<template>
  <div class="associated-products">
    <!-- 变体属性 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">变体属性</span>
      </div>
      <ElForm
        ref="variantAttributesFormRef"
        :model="{ variantAttributes: formData.variantAttributes }"
        :rules="variantAttributesFormRules"
        label-width="0"
        class="variant-attributes-form"
      >
        <ElFormItem prop="variantAttributes" class="table-form-item-wrapper">
          <ElTable :data="formData.variantAttributes" border size="small">
            <ElTableColumn prop="index" label="序号" width="80" align="center">
              <template #default="{ $index }">
                {{ $index + 1 }}
              </template>
            </ElTableColumn>
            <ElTableColumn prop="attributeId" label="属性" min-width="150">
              <template #header>
                <span class="red">*</span>
                属性
              </template>
              <template #default="{ row, $index }">
                <ElFormItem
                  :prop="`variantAttributes.${$index}.attribute`"
                  :rules="variantAttributeRules.attribute"
                  class="table-form-item"
                >
                  <ElSelect v-model="row.attribute" placeholder="请选择" clearable>
                    <ElOption
                      :label="item.attributeName"
                      :value="item.id"
                      v-for="item in propertyAll"
                      :key="item.id"
                      :disabled="isAttributeDisabled(item.id, $index)"
                    />
                  </ElSelect>
                </ElFormItem>
              </template>
            </ElTableColumn>
            <ElTableColumn prop="attributeValues" label="属性值" min-width="200">
              <template #header>
                <span class="red">*</span>
                属性值
              </template>
              <template #default="{ row, $index }">
                <ElFormItem
                  :prop="`variantAttributes.${$index}.attributeValues`"
                  :rules="variantAttributeRules.attributeValues"
                  class="table-form-item"
                >
                  <ElCheckboxGroup v-model="row.attributeValues">
                    <ElCheckbox
                      v-for="value in getAttributeValues(row.attribute)"
                      :key="value.value"
                      :label="value.value"
                    >
                      {{ value.label }}{{ value.value }}
                    </ElCheckbox>
                  </ElCheckboxGroup>
                </ElFormItem>
              </template>
            </ElTableColumn>
            <ElTableColumn label="操作" width="100" align="center">
              <template #default="{ $index }">
                <ElButton type="danger" link size="small" @click="removeAttribute($index)">
                  移除
                </ElButton>
              </template>
            </ElTableColumn>
          </ElTable>
        </ElFormItem>
      </ElForm>
      <div class="add-btn-wrapper">
        <span class="add-btn" @click="addAttribute"> + </span>
      </div>
    </div>

    <!-- 包含产品 -->
    <div class="section">
      <div class="section-header">
        <span class="section-title-bar"></span>
        <span class="section-title">包含产品</span>
      </div>
      <div class="product-buttons">
        <ElButton class="product-button" @click="handleOpenProductDialog"> 关联已有产品 </ElButton>
        <ElButton
          class="product-button"
          :disabled="!canGenerateProducts"
          @click="handleAutoGenerateClick"
        >
          自动生成产品
        </ElButton>
        <ElCheckbox
          v-model="formData.skuInfoFlag"
          class="apply-checkbox"
          :true-value="1"
          :false-value="0"
        >
          应用相关信息至新生成SKU
        </ElCheckbox>
      </div>
      <div class="product-content">
        <ElForm
          ref="productsFormRef"
          :model="{ products: formData.existingProducts }"
          :rules="productsFormRules"
          label-width="0"
          class="products-form"
        >
          <ElFormItem prop="products" class="table-form-item-wrapper">
            <ElTable
              :data="formData.existingProducts"
              border
              class="product-table"
              size="small"
              :row-class-name="getProductRowClassName"
              row-key="tempId"
            >
              <ElTableColumn prop="index" label="序号" width="80" align="center">
                <template #default="{ $index }">
                  {{ $index + 1 }}
                </template>
              </ElTableColumn>
              <!-- <ElTableColumn prop="id" label="ID" min-width="150">
                <template #default="{ row, $index }">
                  {{ row.id }}
                </template>
              </ElTableColumn>
              <ElTableColumn prop="tempId" label="tempId" min-width="150">
                <template #default="{ row, $index }">
                  {{ row.tempId }}
                </template>
              </ElTableColumn> -->
              <ElTableColumn prop="sku" label="SKU" min-width="150">
                <template #header>
                  <span class="red">*</span>
                  SKU
                </template>
                <template #default="{ row, $index }">
                  <ElFormItem
                    :prop="`products.${$index}.sku`"
                    :rules="productRules.sku"
                    class="table-form-item"
                  >
                    <ElInput
                      v-model="row.sku"
                      placeholder="请输入"
                      clearable
                      :disabled="!!(row.id || row.productId)"
                    />
                  </ElFormItem>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="productChineseName" label="中文品名" min-width="150">
                <template #header>
                  <span class="red">*</span>
                  中文品名
                </template>
                <template #default="{ row, $index }">
                  <ElFormItem
                    :prop="`products.${$index}.productChineseName`"
                    :rules="productRules.productChineseName"
                    class="table-form-item"
                  >
                    <ElInput
                      v-model="row.productChineseName"
                      placeholder="请输入"
                      clearable
                      :disabled="!!(row.id || row.productId)"
                    />
                  </ElFormItem>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="productEnglishName" label="英文品名" min-width="150">
                <template #header>
                  <span class="red">*</span>
                  英文品名
                </template>
                <template #default="{ row, $index }">
                  <ElFormItem
                    :prop="`products.${$index}.productEnglishName`"
                    :rules="productRules.productEnglishName"
                    class="table-form-item"
                  >
                    <ElInput
                      v-model="row.productEnglishName"
                      placeholder="请输入"
                      clearable
                      :disabled="!!(row.id || row.productId)"
                    />
                  </ElFormItem>
                </template>
              </ElTableColumn>
              <ElTableColumn prop="materialCode" label="物料编码" min-width="150">
                <template #header>
                  <span class="red">*</span>
                  物料编码
                </template>
                <template #default="{ row, $index }">
                  <ElFormItem
                    :prop="`products.${$index}.materialCode`"
                    :rules="productRules.materialCode"
                    class="table-form-item"
                  >
                    <ElInput
                      v-model="row.materialCode"
                      placeholder="请输入"
                      clearable
                      :disabled="!!(row.id || row.productId)"
                    />
                  </ElFormItem>
                </template>
              </ElTableColumn>
              <!-- 动态属性列 -->
              <ElTableColumn
                v-for="attr in validVariantAttributes"
                :key="attr.attribute"
                :prop="`attribute_${attr.attribute}`"
                label="属性"
                min-width="150"
              >
                <template #default="{ row }">
                  <ElSelect
                    v-model="row[`attribute_${attr.attribute}`]"
                    :placeholder="`请选择${getAttributeName(attr.attribute) || attr.attribute}`"
                    clearable
                  >
                    <ElOption
                      v-for="value in attr.attributeValues"
                      :key="value"
                      :label="getAttributeLabel(attr.attribute, value)"
                      :value="value"
                    />
                  </ElSelect>
                </template>
              </ElTableColumn>
              <ElTableColumn label="操作" width="100" align="center">
                <template #default="{ $index }">
                  <ElButton type="danger" link size="small" @click="removeProduct($index)">
                    移除
                  </ElButton>
                </template>
              </ElTableColumn>
            </ElTable>
          </ElFormItem>
        </ElForm>
        <div class="add-btn-wrapper">
          <span class="add-btn" @click="addProduct"> + </span>
        </div>
      </div>
    </div>

    <!-- 产品选择弹窗 -->
    <AddProductDialog
      :productSpuId="productSpuId"
      v-model="addProductDialogVisible"
      :selected-product-ids="selectedProductIds"
      @confirm="handleProductDialogConfirm"
    />
  </div>
</template>

<script setup lang="ts">
  import { ref, reactive, watch, computed, inject } from 'vue'
  import {
    ElTable,
    ElTableColumn,
    ElButton,
    ElSelect,
    ElOption,
    ElCheckboxGroup,
    ElCheckbox,
    ElInput,
    ElMessage,
    ElMessageBox,
    ElForm,
    ElFormItem,
    type FormRules,
    type FormInstance
  } from 'element-plus'
  import AddProductDialog from './add-product-dialog.vue'
  import { getUuid } from '@/utils'

  interface Props {
    modelValue: any
    spu?: string
    spuName?: string
    spuEnName?: string
    productSpuId?: string
  }

  interface Emits {
    (e: 'update:modelValue', value: any): void
  }
  const basicData: any = inject('basicData')
  const propertyAll = ref(basicData.propertyAll)
  const props = defineProps<Props>()
  const emit = defineEmits<Emits>()

  const productTab = ref('existing')
  const addProductDialogVisible = ref(false)

  // 表单引用
  const productsFormRef = ref<FormInstance>()
  const variantAttributesFormRef = ref<FormInstance>()

  // 产品表单校验规则（用于表格内的FormItem）
  const productRules = {
    sku: [
      { required: true, message: '请输入SKU', trigger: ['blur', 'change'] },
      { max: 50, message: 'SKU最大长度为50个字符', trigger: ['blur', 'change'] },
      {
        pattern: /^[a-zA-Z0-9_.-]+$/,
        message: '仅支持数字、字母、下划线（_）、连字符（-）、英文点（.），禁止空格和其他特殊字符',
        trigger: ['blur', 'change']
      }
    ],
    productChineseName: [
      { required: true, message: '请输入中文品名', trigger: ['blur', 'change'] },
      { max: 50, message: '中文品名最大长度为50个字符', trigger: ['blur', 'change'] },
      {
        pattern: /^[\u4e00-\u9fa5a-zA-Z0-9_.-]+$/,
        message:
          '仅支持汉字、数字、字母、下划线（_）、连字符（-）、英文点（.），禁止空格和其他特殊字符',
        trigger: ['blur', 'change']
      }
    ],
    productEnglishName: [
      { required: true, message: '请输入英文品名', trigger: ['blur', 'change'] },
      { max: 50, message: '英文品名最大长度为50个字符', trigger: ['blur', 'change'] },
      {
        pattern: /^[a-zA-Z0-9_.-]+$/,
        message: '仅支持数字、字母、下划线（_）、连字符（-）、英文点（.），禁止空格和其他特殊字符',
        trigger: ['blur', 'change']
      }
    ],
    materialCode: [
      { required: true, message: '请输入物料编码', trigger: ['blur', 'change'] },
      { max: 20, message: '物料编码最大长度为20个字符', trigger: ['blur', 'change'] },
      {
        pattern: /^[a-zA-Z0-9_.-]+$/,
        message: '仅支持数字、字母、下划线（_）、连字符（-）、英文点（.），禁止空格和其他特殊字符',
        trigger: ['blur', 'change']
      }
    ]
  }

  // 变体属性表单校验规则（用于表格内的FormItem）
  const variantAttributeRules = {
    attribute: [{ required: true, message: '请选择属性', trigger: ['blur', 'change'] }],
    attributeValues: [
      {
        required: true,
        type: 'array',
        min: 1,
        message: '请至少选择一个属性值',
        trigger: ['blur', 'change']
      }
    ]
  }

  // 外层表单校验规则（用于包裹表格的ElFormItem）
  const productsFormRules: FormRules = {
    // products: [
    //   {
    //     type: 'array',
    //     required: true,
    //     message: '请至少添加一个产品',
    //     trigger: ['change', 'blur']
    //   },
    //   {
    //     validator: (rule, value, callback) => {
    //       if (!value || value.length === 0) {
    //         callback(new Error('请至少添加一个产品'))
    //         return
    //       }
    //       callback()
    //     },
    //     trigger: ['change', 'blur']
    //   }
    // ]
  }

  // 变体属性外层表单校验规则（用于包裹表格的ElFormItem）
  const variantAttributesFormRules: FormRules = {
    variantAttributes: [
      {
        type: 'array',
        required: true,
        message: '请至少添加一个变体属性',
        trigger: ['change', 'blur']
      },
      {
        validator: (rule, value, callback) => {
          if (!value || value.length === 0) {
            callback(new Error('请至少添加一个变体属性'))
            return
          }
          callback()
        },
        trigger: ['change', 'blur']
      }
    ]
  }

  // 获取有效的变体属性（已选择属性且至少有一个属性值）
  const validVariantAttributes = computed(() => {
    return formData.variantAttributes.filter(
      (attr) => attr.attribute && attr.attributeValues && attr.attributeValues.length > 0
    )
  })

  // 检查是否可以生成产品
  const canGenerateProducts = computed(() => {
    if (!props.spu || !props.spuName || !props.spuEnName) {
      console.log(1)
      return false
    }
    // 检查是否有变体属性且都选择了属性值
    if (validVariantAttributes.value.length === 0) {
      console.log(2)
      return false
    }
    for (const attr of validVariantAttributes.value) {
      if (!attr.attribute || !attr.attributeValues || attr.attributeValues.length === 0) {
        return false
      }
      console.log(3)
    }
    return true
  })

  const formData = reactive({
    variantAttributes: [],
    skuInfoFlag: 0,
    existingProducts: [] as Array<{
      sku: string
      productChineseName: string
      productEnglishName: string
      materialCode: string
      isFromDialog?: boolean // 标记是否来自弹窗选择
      productId?: string // 产品ID，用于标识已选择的产品
      [key: string]: any // 用于动态属性字段
      tempId: string
    }>,
    autoGeneratedProducts: [] as any[]
  })

  // 已被其他行选中的属性在下拉中禁用（当前行已选中的保持可选）
  const isAttributeDisabled = (attributeId: string | number, currentIndex: number): boolean => {
    const list = formData.variantAttributes || []
    return list.some(
      (attr: any, index: number) =>
        index !== currentIndex &&
        attr.attribute != null &&
        String(attr.attribute) === String(attributeId)
    )
  }

  // 根据属性id获取属性名称
  const getAttributeName = (attributeId: string | number | null | undefined): string => {
    if (!attributeId) return ''
    const property = propertyAll.value.find((item) => item.id === attributeId)
    return property?.attributeName || ''
  }

  // 根据属性id从propertyAll中获取属性值选项
  const getAttributeValues = (attributeId: string | number | null | undefined) => {
    if (!attributeId) return []
    const property = propertyAll.value.find((item) => item.id === attributeId)
    if (!property || !property.itemList || property.itemList.length === 0) return []
    return property.itemList.map((item) => ({
      label: item.attributeValue,
      value: item.attributeCode
    }))
  }

  // 根据属性id和属性值code获取label
  const getAttributeLabel = (attributeId: string | number, value: string): string => {
    if (!attributeId || !value) return value
    const property = propertyAll.value.find((item) => item.id === attributeId)
    if (!property || !property.itemList) return value
    const item = property.itemList.find((item) => item.attributeCode === value)
    return item?.attributeValue || value
  }

  // 添加属性
  const addAttribute = () => {
    formData.variantAttributes.push({
      attribute: '',
      attributeValues: []
    })
  }

  // 移除属性
  const removeAttribute = (index: number) => {
    formData.variantAttributes.splice(index, 1)
  }

  // 添加产品
  const addProduct = () => {
    const newProduct: any = {
      sku: '',
      productChineseName: '',
      productEnglishName: '',
      materialCode: '',
      tempId: getUuid()
    }
    // 为每个有效的变体属性添加动态字段
    validVariantAttributes.value.forEach((attr) => {
      newProduct[`attribute_${attr.attribute}`] = ''
    })
    formData.existingProducts.push(newProduct)
  }

  // 移除产品
  const removeProduct = (index: number) => {
    formData.existingProducts.splice(index, 1)
  }

  // 获取已选择的产品ID列表（用于弹窗中置灰）
  const selectedProductIds = computed(() => {
    return formData.existingProducts
      .filter((product) => product.isFromDialog && product.productId)
      .map((product) => product.productId!)
  })

  // 获取产品表格行的类名（用于置灰从弹窗添加的产品）
  const getProductRowClassName = ({ row }: { row: any }) => {
    if (row.isFromDialog) {
      return 'is-from-dialog'
    }
    return ''
  }

  // 打开产品选择弹窗
  const handleOpenProductDialog = () => {
    productTab.value = 'existing'
    addProductDialogVisible.value = true
  }

  // 处理产品选择弹窗确认
  const handleProductDialogConfirm = (products: any[]) => {
    // 过滤掉已存在的产品（根据SKU判断）
    const existingSkus = formData.existingProducts.map((p) => p.sku)
    const newProducts = products.filter((p) => !existingSkus.includes(p.sku))

    // 将选择的产品添加到表格中，标记为来自弹窗
    newProducts.forEach((product) => {
      const newProduct: any = {
        ...product,
        isFromDialog: true, // 标记为来自弹窗
        productId: product.id, // 保存产品ID
        tempId: getUuid()
      }

      // 为每个有效的变体属性添加动态字段
      validVariantAttributes.value.forEach((attr) => {
        newProduct[`attribute_${attr.attribute}`] = ''
      })

      formData.existingProducts.push(newProduct)
    })

    if (newProducts.length > 0) {
      ElMessage.success(`成功添加${newProducts.length}个产品`)
    } else {
      ElMessage.warning('所选产品已存在，未添加重复产品')
    }
  }

  // 生成笛卡尔积组合
  const generateCartesianProduct = (arrays: any[][]): any[][] => {
    if (arrays.length === 0) return [[]]
    if (arrays.length === 1) return arrays[0].map((item) => [item])

    const [first, ...rest] = arrays
    const restCombinations = generateCartesianProduct(rest)
    const result: any[][] = []

    for (const item of first) {
      for (const combination of restCombinations) {
        result.push([item, ...combination])
      }
    }

    return result
  }

  // 自动生成产品（根据变体属性）
  const generateProducts = () => {
    if (!props.spu || !props.spuName || !props.spuEnName) {
      return
    }

    if (validVariantAttributes.value.length === 0) {
      return
    }

    // 构建属性值的数组数组，用于生成笛卡尔积
    const attributeValueArrays: Array<Array<{ attribute: string; value: string; label: string }>> =
      []
    console.log(
      validVariantAttributes.value,
      'validVariantAttributes.valuevalidVariantAttributes.value'
    )

    for (const attr of validVariantAttributes.value) {
      const values = attr.attributeValues.map((val: string) => ({
        attribute: attr.attribute,
        value: val,
        label: getAttributeLabel(attr.attribute, val)
      }))
      attributeValueArrays.push(values)
    }

    // 生成所有组合
    const combinations = generateCartesianProduct(attributeValueArrays)

    // 转换为产品数据
    const products = combinations.map((combination) => {
      // SKU: SPU-属性值1-属性值2-...
      const skuParts = [props.spu, ...combination.map((item) => item.value)]
      const sku = skuParts.join('-')

      // 中文品名: 中文款名-属性值中文1-属性值中文2-...
      const chineseParts = [props.spuName, ...combination.map((item) => item.label)]
      const productChineseName = chineseParts.join('-')

      // 英文品名: 英文款名-属性值英文1-属性值英文2-...
      const englishParts = [props.spuEnName, ...combination.map((item) => item.value)]
      const productEnglishName = englishParts.join('-')

      // 创建产品对象，包含动态属性字段
      const product: any = {
        sku,
        productChineseName,
        productEnglishName,
        materialCode: ''
      }
      // 为每个属性设置对应的值
      combination.forEach((item) => {
        product[`attribute_${item.attribute}`] = item.value
      })

      return product
    })

    formData.existingProducts = products?.map((v: any) => ({ ...v, tempId: getUuid() }))
    productTab.value = 'existing'
  }

  // 处理自动生成按钮点击
  const handleAutoGenerateClick = async () => {
    if (!canGenerateProducts.value) {
      ElMessage.warning('请先完善SPU、中文款名、英文款名和属性值信息')
      return
    }

    try {
      await ElMessageBox.confirm('自动生成产品将覆盖当前表格数据，是否继续？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      })
      generateProducts()
      //   ElMessage.success('产品生成成功')
    } catch {
      // 用户取消操作
    }
  }

  // 验证表单
  const validate = async () => {
    // 验证变体属性
    // if (formData.variantAttributes.length === 0) {
    //   ElMessage.warning('请至少添加一个变体属性')
    //   return false
    // }

    // for (let i = 0; i < formData.variantAttributes.length; i++) {
    //   const attr = formData.variantAttributes[i]
    //   if (!attr.attribute) {
    //     ElMessage.warning(`第${i + 1}行变体属性：请选择属性`)
    //     return false
    //   }
    //   if (!attr.attributeValues || attr.attributeValues.length === 0) {
    //     ElMessage.warning(`第${i + 1}行变体属性：请至少选择一个属性值`)
    //     return false
    //   }
    // }

    // 验证已有产品
    if (productTab.value === 'existing') {
      if (!productsFormRef.value) {
        ElMessage.warning('表单未初始化')
        return false
      }

      try {
        await productsFormRef.value.validate()
      } catch {
        // 验证失败，表单会自动显示错误信息
        // ElMessage.warning('请检查产品表单输入')
        return false
      }
    }

    return true
  }

  // 清除验证
  const clearValidate = () => {
    if (variantAttributesFormRef.value) {
      variantAttributesFormRef.value.clearValidate()
    }
    if (productsFormRef.value) {
      productsFormRef.value.clearValidate()
    }
  }

  // 监听数据变化
  watch(
    formData,
    (newVal) => {
      emit('update:modelValue', newVal)
    },
    { deep: true }
  )

  // 监听外部数据变化
  watch(
    () => props.modelValue,
    (newVal) => {
      if (newVal) {
        Object.assign(formData, newVal)
      }
    },
    { deep: true, immediate: true }
  )

  // 监听变体属性变化，当属性列改变时实时更新动态列并清理无效数据
  watch(
    () => formData.variantAttributes,
    (newAttributes, oldAttributes) => {
      console.log(oldAttributes, 'oldAttributesoldAttributes')
      console.log(newAttributes, 'newAttributesnewAttributesnewAttributes')
      if (!oldAttributes) return

      // 当属性列改变时，如果属性被清空或改变，清空对应的属性值
      newAttributes.forEach((newAttr, index) => {
        const oldAttr = oldAttributes[index]
        // 如果属性列的值发生变化（包括从有值变为空，或从一个值变为另一个值）
        if (oldAttr && oldAttr.attribute !== newAttr.attribute) {
          // 清空属性值
          newAttr.attributeValues = []
        }

        // 检查属性值的变化：如果某个属性值被取消选中
        if (oldAttr && oldAttr.attribute === newAttr.attribute) {
          const oldValues = oldAttr.attributeValues || []
          const newValues = newAttr.attributeValues || []
          // 找出被取消选中的值（在旧值中存在但在新值中不存在）
          const removedValues = oldValues.filter((val: string) => !newValues.includes(val))

          // 如果属性值被取消选中，需要清理产品数据中使用该值的记录
          if (removedValues.length > 0 && newAttr.attribute) {
            const attributeKey = `attribute_${newAttr.attribute}`
            formData.existingProducts.forEach((product) => {
              // 如果产品的该属性值等于被取消的值，则置空
              if (product[attributeKey] && removedValues.includes(product[attributeKey])) {
                product[attributeKey] = ''
              }
            })
          }
        }
      })

      // 获取当前有效的属性名称列表
      const validAttributeKeys = validVariantAttributes.value.map(
        (attr) => `attribute_${attr.attribute}`
      )

      // 遍历所有产品，清理无效的属性字段
      formData.existingProducts.forEach((product) => {
        // 获取产品中所有以 attribute_ 开头的字段
        const productKeys = Object.keys(product).filter((key) => key.startsWith('attribute_'))
        // 删除不在有效属性列表中的字段
        productKeys.forEach((key) => {
          if (!validAttributeKeys.includes(key)) {
            delete product[key]
          }
        })

        // 检查有效属性字段的值是否在当前可选值列表中
        validVariantAttributes.value.forEach((attr) => {
          const attributeKey = `attribute_${attr.attribute}`
          const productValue = product[attributeKey]
          // 如果产品有值，但该值不在当前可选值列表中，则置空
          if (productValue && !attr.attributeValues.includes(productValue)) {
            product[attributeKey] = ''
          }
        })
      })
    },
    { deep: true }
  )

  // 注意：移除自动切换时的生成逻辑，改为点击按钮时手动触发

  defineExpose({
    validate,
    clearValidate
  })
</script>

<style lang="scss" scoped>
  .associated-products {
    margin-top: 8px;

    .red {
      color: red;
    }

    .section {
      margin-bottom: 30px;

      .section-header {
        display: flex;
        align-items: center;
        margin-bottom: 16px;

        .section-title-bar {
          width: 4px;
          height: 16px;
          margin-right: 8px;
          background-color: #5d87ff;
        }

        .section-title {
          font-size: 14px;
          font-weight: 500;
          color: var(--el-text-color-primary);
        }
      }
    }

    .attribute-tags {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
    }

    .product-buttons {
      display: flex;
      gap: 12px;
      align-items: center;
      margin-bottom: 16px;

      // .product-button {
      //   border: 1px solid var(--el-border-color);
      //   background-color: var(--el-bg-color);
      //   color: var(--el-text-color-primary);

      //   &.el-button--primary {
      //     border-color: var(--el-color-primary);
      //     background-color: var(--el-color-primary);
      //     color: var(--el-color-white);
      //   }

      //   &.is-plain {
      //     border-color: var(--el-border-color);
      //     background-color: var(--el-bg-color);
      //     color: var(--el-text-color-primary);
      //   }
      // }

      .apply-checkbox {
        margin-left: auto;
      }
    }

    .variant-attributes-form {
      .table-form-item-wrapper {
        margin-bottom: 0;

        :deep(.el-form-item__content) {
          margin-left: 0 !important;
        }
      }

      :deep(.el-table__body-wrapper) {
        .el-table__row {
          .el-table__cell {
            padding: 8px 0;
            vertical-align: top;
          }
        }
      }

      .table-form-item {
        width: 100%;
        margin-bottom: 0;

        :deep(.el-form-item__error) {
          position: static;
          display: block;
          padding-top: 4px;
          font-size: 12px;
          line-height: 1.2;
          color: var(--el-color-error);
        }

        :deep(.el-form-item__content) {
          width: 100%;
          margin-left: 0 !important;
        }

        :deep(.el-select) {
          width: 100%;
        }

        // 当FormItem有错误时，ElSelect显示红色边框
        &.is-error {
          :deep(.el-select .el-select__wrapper) {
            box-shadow: 0 0 0 1px var(--el-color-error) inset;
          }

          :deep(.el-select__placeholder) {
            color: var(--el-text-color-placeholder);
          }
        }
      }

      // 当FormItem有错误时，添加错误样式类
      :deep(.el-form-item.is-error) {
        .el-select {
          .el-select__wrapper {
            box-shadow: 0 0 0 1px var(--el-color-error) inset !important;
          }

          &.is-focused .el-select__wrapper {
            box-shadow: 0 0 0 1px var(--el-color-error) inset !important;
          }
        }
      }
    }

    .product-content {
      padding-top: 0;

      .products-form {
        .table-form-item-wrapper {
          margin-bottom: 0;

          :deep(.el-form-item__content) {
            margin-left: 0 !important;
          }
        }

        .product-table {
          :deep(.el-table__body-wrapper) {
            .el-table__row {
              .el-table__cell {
                padding: 8px 0;
                vertical-align: top;
              }

              // 从弹窗添加的产品置灰样式
              //   &.is-from-dialog {
              //     background-color: #f5f7fa;

              //     .el-table__cell {
              //       background-color: #f5f7fa;
              //     }

              //     .el-input.is-disabled .el-input__wrapper {
              //       background-color: #f5f7fa;
              //       cursor: not-allowed;
              //     }

              //     .el-select.is-disabled .el-select__wrapper {
              //       background-color: #f5f7fa;
              //       cursor: not-allowed;
              //     }
              //   }
            }
          }
        }

        .table-form-item {
          margin-bottom: 0;

          :deep(.el-form-item__error) {
            position: static;
            padding-top: 4px;
            font-size: 12px;
            line-height: 1.2;
            color: var(--el-color-error);
          }

          :deep(.el-form-item__content) {
            margin-left: 0 !important;
          }

          :deep(.el-input__wrapper) {
            &.is-error {
              box-shadow: 0 0 0 1px var(--el-color-error) inset;
            }
          }
        }
      }
    }

    .auto-generate-info {
      padding: 20px 0;
    }

    .add-btn-wrapper {
      display: flex;
      align-items: center;
      justify-content: flex-start;
      padding: 4px 8px;
      border: 1px solid #ebeef5;
      border-top-width: 0;

      .add-btn {
        padding: 4px 8px;
        color: #5d87ff;
        cursor: pointer;
        border: 1px solid #5d87ff;
        border-radius: 2px;
      }
    }
  }
</style>
