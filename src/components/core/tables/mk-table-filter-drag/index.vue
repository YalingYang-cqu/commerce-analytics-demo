/* eslint-disable */
<template>
  <el-popover
    placement="bottom"
    trigger="click"
    :width="805"
    v-model:visible="visible"
    popper-class="filter-popover"
  >
    <div class="colSetting">
      <div v-if="hasSetChild" class="filter-content">
        <template v-for="setItem in localSetting" :key="getPropKey(setItem.prop)">
          <div v-if="!setItem.showCheck" class="set-title">
            <el-checkbox
              class="filter-checkbox"
              :label="` ${setItem.columnName || setItem.name}`"
              v-model="setItem.showCol"
              :disabled="setItem.cannotHidden"
              @change="fnChangeChild(setItem)"
            />
          </div>
          <el-checkbox
            v-for="chileItem in (setItem.columnChildren || []).filter((itm) => !itm.showCheck)"
            :key="`${getPropKey(chileItem.prop)}${setItem.name}`"
            class="filter-checkbox"
            :label="` ${chileItem.columnName || chileItem.name}`"
            v-model="chileItem.showCol"
            :disabled="chileItem.cannotHidden"
            @change="fnChangeChild(setItem, chileItem)"
          />
        </template>
      </div>
      <div v-else class="filter-content">
        <template v-for="item in localSetting" :key="getPropKey(item.prop)">
          <el-checkbox
            v-if="!item.showCheck"
            class="filter-checkbox"
            :label="item.columnName || item.name"
            v-model="item.showCol"
            :disabled="item.cannotHidden"
            @change="fnChangeChild(item)"
          />
        </template>
      </div>

      <div v-if="isSort" class="draggable-root">
        <div class="draggable-search">
          <el-input
            v-model="draggableInput"
            class="draggable-search-input"
            clearable
            placeholder="请输入搜索内容"
            @input="inputChange"
          >
            <template #suffix>
              <el-icon @click="handleSearchClick"><Search /></el-icon>
            </template>
          </el-input>
        </div>
        <div>
          <draggable
            v-if="!hasSetChild"
            :key="`flat-${draggableAreaKey}`"
            v-model="draggableList"
            :item-key="getItemKey"
            class="list-group draggable-parent"
            tag="ul"
            @update="updateList"
          >
            <template v-for="(item, index) in draggableList" :key="getPropKey(item.prop)">
              <li
                v-if="item.showCol && !item.showCheck"
                class="draggable-item"
                :style="{ width: `${draggableWidth}px` }"
              >
                <el-icon><Menu /></el-icon>
                <span class="content">
                  <span
                    v-for="keyItem in item.name?.split('') || []"
                    :key="keyItem"
                    :style="{
                      color:
                        draggableInput && item.name && draggableInput.includes(keyItem)
                          ? '#425eff'
                          : ''
                    }"
                    >{{ keyItem }}</span
                  >
                </span>
                <span class="fun-list" :style="{ left: !item.fixed ? '96%' : '86%' }">
                  <i class="iconfont icon-qingchu" style="width: 18px" @click="clearShow(item)"></i>
                  <i
                    v-if="index > 0"
                    class="iconfont icon-arrow_xiangshangzhiding"
                    style="width: 18px"
                    title="置顶"
                    @click="topPing(item, index)"
                  ></i>
                  <i
                    v-if="!item.fixed"
                    class="iconfont icon-xuanfu-guding"
                    style="width: 18px"
                    title="固定"
                    @click="regularItem(item, index)"
                  ></i>
                </span>
                <span class="fun-list-show">
                  <i
                    v-if="item.fixed"
                    class="iconfont icon-quxiaoguding"
                    title="取消固定"
                    @click="cancelRegularItem(item, index)"
                  ></i>
                </span>
              </li>
            </template>
          </draggable>

          <draggable
            v-else
            :key="`nested-${draggableAreaKey}`"
            v-model="draggableList"
            :item-key="getItemKey"
            class="list-group draggable-parent"
            tag="ul"
            @update="updateList"
          >
            <template v-for="(item, index) in draggableList" :key="getPropKey(item.prop)">
              <el-collapse :model-value="getPropKey(item.prop)" accordion>
                <el-collapse-item
                  v-if="item && item.showCol && !item.showCheck"
                  :name="getPropKey(item.prop)"
                >
                  <template #title>
                    <li class="draggable-item" :style="{ width: `${draggableWidth}px` }">
                      <el-icon><Menu /></el-icon>
                      <span class="content">
                        <span
                          v-for="keyItem in item.name?.split('') || []"
                          :key="keyItem"
                          :style="{
                            color:
                              draggableInput && item.name && draggableInput.includes(keyItem)
                                ? '#425eff'
                                : ''
                          }"
                          >{{ keyItem }}</span
                        >
                      </span>
                      <span class="fun-list" :style="{ left: !item.fixed ? '96%' : '86%' }">
                        <i
                          class="iconfont icon-qingchu"
                          style="width: 18px"
                          @click="clearShow(item)"
                        ></i>
                        <i
                          v-if="index > 0"
                          class="iconfont icon-arrow_xiangshangzhiding"
                          style="width: 18px"
                          title="置顶"
                          @click="topPing(item, index)"
                        ></i>
                        <i
                          v-if="!item.fixed"
                          class="iconfont icon-xuanfu-guding"
                          style="width: 18px"
                          title="固定"
                          @click="regularItem(item, index)"
                        ></i>
                      </span>
                      <span class="fun-list-show">
                        <i
                          v-if="item.fixed"
                          class="iconfont icon-quxiaoguding"
                          title="取消固定"
                          @click="cancelRegularItem(item, index)"
                        ></i>
                      </span>
                    </li>
                  </template>
                  <div v-if="item.columnChildren">
                    <draggable
                      v-model="item.columnChildren"
                      :item-key="getItemKey"
                      @update="updateListItem($event, item)"
                    >
                      <template
                        v-for="(itm, idx) in item.columnChildren"
                        :key="getPropKey(itm.prop)"
                      >
                        <li
                          v-show="itm && itm.showCol && !itm.showCheck"
                          class="draggable-item-children"
                        >
                          <span class="content">
                            <span
                              v-for="keyitm in itm.name?.split('') || []"
                              :key="keyitm"
                              :style="{
                                color:
                                  draggableInput && itm.name && draggableInput.includes(keyitm)
                                    ? '#425eff'
                                    : ''
                              }"
                              >{{ keyitm }}</span
                            >
                          </span>
                          <span class="fun-list" :style="{ left: !itm.fixed ? '96%' : '86%' }">
                            <i
                              class="iconfont icon-qingchu"
                              style="width: 18px"
                              @click="clearShowItem(itm, idx)"
                            ></i>
                            <i
                              v-if="idx > 0"
                              class="iconfont icon-arrow_xiangshangzhiding"
                              style="width: 18px"
                              title="置顶"
                              @click="topPingItem(itm, idx, item)"
                            ></i>
                          </span>
                        </li>
                      </template>
                    </draggable>
                  </div>
                </el-collapse-item>
              </el-collapse>
            </template>
          </draggable>
        </div>
      </div>
    </div>
    <div class="filter-btnBox">
      <div>
        <el-button size="small" @click="handleReset">恢复默认</el-button>
      </div>
      <div>
        <el-button size="small" @click="visible = false">取消</el-button>
        <el-button type="primary" size="small" @click="fnSave">确定</el-button>
      </div>
    </div>
    <template #reference>
      <div class="btn"><i class="iconfont-custom">&#xe657;</i> </div>
    </template>
  </el-popover>
</template>

<script setup lang="ts">
  import { ref, watch, onMounted, nextTick } from 'vue'
  import { useRoute } from 'vue-router'
  import { ElMessage } from 'element-plus'
  import { Search, Menu } from '@element-plus/icons-vue'
  import { VueDraggableNext as draggable } from 'vue-draggable-next'
  import { saveUserHabitsApi, getHabitsApi } from '@/api/system-manage'
  import { normalizeColumnKey } from '@/composables/useTableColumns'

  /** 列唯一 key（prop 可能为数组，统一为字符串便于比较与 :key） */
  const getPropKey = (p: string | string[] | undefined): string =>
    normalizeColumnKey(p) ?? (p != null ? String(p) : '')
  /** draggable item-key：prop 为数组时也返回稳定字符串 */
  const getItemKey = (item: TableColumn): string => getPropKey(item.prop) || String(item.name ?? '')

  /** 操作列固定时使用 el-table 右固定 */
  const isOperationColumn = (col: TableColumn): boolean => {
    const k = getPropKey(col.prop)
    return k === 'operation' || (col.name || col.columnName || '') === '操作'
  }
  const isRightFixedColumn = (col: TableColumn): boolean => col.fixed === 'right'
  const isLeftFixedColumn = (col: TableColumn | undefined): boolean =>
    !!col && (col.fixed === true || col.fixed === 'left')
  const isAnyFixed = (col: TableColumn): boolean =>
    col.fixed === true || col.fixed === 'left' || col.fixed === 'right'

  /** 左固定 | 中间 | 右固定（操作列历史 fixed:true 改为 right） */
  const repartitionFixedColumns = (source: TableColumn[]): TableColumn[] => {
    const val = JSON.parse(JSON.stringify(source)) as TableColumn[]
    const leftFixed: TableColumn[] = []
    const rightFixed: TableColumn[] = []
    for (let i = val.length - 1; i >= 0; i--) {
      const col = val[i]
      if (!col.fixed) continue
      val.splice(i, 1)
      if (col.fixed === 'right' || (isOperationColumn(col) && col.fixed === true)) {
        if (isOperationColumn(col) && col.fixed === true) col.fixed = 'right'
        rightFixed.unshift(col)
      } else {
        leftFixed.unshift(col)
      }
    }
    return [...leftFixed, ...val, ...rightFixed]
  }

  export interface TableColumn {
    prop: string
    name: string
    columnName?: string
    showCol?: boolean
    showCheck?: boolean
    cannotHidden?: boolean
    defaultShowCol?: boolean
    fixed?: boolean | 'left' | 'right'
    width?: string | number
    minWidth?: string | number
    columnChildren?: TableColumn[]
  }

  interface Props {
    setting: TableColumn[]
    /** 默认列配置（含初始顺序），恢复默认时优先使用，未传则用 setting */
    defaultSetting?: TableColumn[]
    tableName: string
    hasSetChild?: boolean
    isSort?: boolean
  }

  interface DraggableChangeEvent {
    list: TableColumn[]
    oldIndex?: number | null
    newIndex?: number | null
    item?: TableColumn | null | undefined
  }

  interface ShowItemChangeEvent {
    resetList?: TableColumn[] | null
    pItem?: TableColumn | null
    item?: TableColumn | null
  }

  interface DragUpdateEvent {
    oldIndex: number
    newIndex: number
  }

  const props = withDefaults(defineProps<Props>(), {
    setting: () => [],
    defaultSetting: () => [],
    tableName: '',
    hasSetChild: false,
    isSort: false
  })

  const emit = defineEmits<{
    (e: 'showItemChange', event: ShowItemChangeEvent): void
    (e: 'draggableChange', event: DraggableChangeEvent): void
  }>()

  const route = useRoute()

  const visible = ref(false)
  const loadingHabits = ref(false)
  const draggableList = ref<TableColumn[]>([])
  const localSetting = ref<TableColumn[]>([])
  const draggableInput = ref('')
  const draggableWidth = ref(90)
  /** 拖拽区域 key，每次排序后自增以强制重新渲染拖拽区域 */
  const draggableAreaKey = ref(0)

  const inputChange = (val: string): void => {
    const list = JSON.parse(JSON.stringify(draggableList.value))
    for (let i = 0; i < list.length; i++) {
      const item = list[i]
      if (item.name && item.name.includes(val)) {
        ulScroll(i)
        break
      }
    }
  }

  const handleSearchClick = (): void => {
    inputChange(draggableInput.value)
  }

  const ulScroll = (idx: number): void => {
    const ulDom = document.querySelector('.list-group.draggable-parent')
    const liList = ulDom?.getElementsByTagName('li') || []
    if (liList.length > 0 && idx < liList.length) {
      const targetDom = liList[idx]
      ulDom?.scrollTo({
        top: (targetDom?.offsetTop || 0) - 33,
        behavior: 'smooth'
      })
    }
  }

  const cancelRegularItem = (obj: TableColumn, index: number, parentObj?: TableColumn): void => {
    const wasRightFixed = isRightFixedColumn(obj) || (isOperationColumn(obj) && obj.fixed === true)
    obj.fixed = false
    obj.width = 0
    let list: TableColumn[] = []
    if (props.hasSetChild && !obj.columnChildren) {
      if (obj.columnChildren && Array.isArray(obj.columnChildren)) {
        ;((obj.columnChildren || []) as TableColumn[]).forEach((item) => {
          item.fixed = false
        })
        list = JSON.parse(JSON.stringify(draggableList.value))
      } else {
        list = JSON.parse(JSON.stringify(parentObj?.columnChildren || []))
      }
    } else {
      list = JSON.parse(JSON.stringify(draggableList.value))
    }
    list.splice(index, 1)
    if (wasRightFixed) {
      const insertAt = list.findIndex(
        (c) => isRightFixedColumn(c) || (isOperationColumn(c) && !!c.fixed)
      )
      list.splice(insertAt === -1 ? list.length : insertAt, 0, obj)
    } else {
      let newIndex = 0
      list.forEach((item, idx) => {
        if (!isAnyFixed(item) && (isLeftFixedColumn(list[idx - 1]) || idx === 0)) {
          newIndex = idx
        }
      })
      list.splice(newIndex, 0, obj)
    }
    if (props.hasSetChild && !obj.columnChildren && parentObj) {
      parentObj.columnChildren = list
    }
    draggableList.value = list
    resetWidth()
    emit('draggableChange', {
      list: draggableList.value,
      oldIndex: index,
      newIndex: index,
      item: obj
    })
    setFixedTable()
  }

  const setFixedTable = (): void => {
    nextTick(() => {
      setTimeout(() => {
        const fixedTable = document.querySelector('.el-table__fixed')
        const fixedHeight = fixedTable?.clientHeight || 0
        const fixedWidth = fixedTable?.clientWidth || 0
        if (fixedHeight) {
          fixedTable?.setAttribute('style', `width: ${fixedWidth}px; height: ${fixedHeight}px`)
        }
      }, 300)
    })
  }

  const regularItem = (obj: TableColumn, index: number, parentObj?: TableColumn): void => {
    const useRightFixed = isOperationColumn(obj)
    obj.fixed = useRightFixed ? 'right' : true
    let list: TableColumn[] = []
    if (props.hasSetChild && !obj.columnChildren) {
      list = JSON.parse(JSON.stringify(parentObj?.columnChildren || []))
    } else {
      list = JSON.parse(JSON.stringify(draggableList.value || []))
    }
    list.splice(index, 1)
    if (useRightFixed) {
      list.push(obj)
    } else {
      let newIndex = 0
      list.forEach((item, idx) => {
        if (!isAnyFixed(item) && (isLeftFixedColumn(list[idx - 1]) || idx === 0)) {
          newIndex = idx
        }
      })
      list.splice(newIndex, 0, obj)
    }
    if (props.hasSetChild) {
      if (obj.columnChildren && Array.isArray(obj.columnChildren)) {
        obj.columnChildren.forEach((item) => {
          item.fixed = true
          obj.width = obj.width
            ? Number(obj.width) + Number(item.minWidth || 0)
            : Number(item.minWidth || 0)
        })
        draggableList.value = list
      } else if (parentObj) {
        if (!parentObj.fixed) {
          parentObj.fixed = true
        }
        parentObj.columnChildren = list
        parentObj.columnChildren?.forEach((item) => {
          if (item && item.fixed) {
            parentObj.width = parentObj.width
              ? Number(parentObj.width) + Number(item.minWidth || 0)
              : Number(item.minWidth || 0)
          }
        })
      }
    } else {
      draggableList.value = list
    }
    resetWidth()
    emit('draggableChange', { list: draggableList.value, oldIndex: index, newIndex: 0, item: obj })
    setFixedTable()
  }

  const topPingItem = (obj: TableColumn, objIdx: number, parentObj: TableColumn): void => {
    parentObj.columnChildren?.splice(objIdx, 1)
    parentObj.columnChildren?.unshift(obj)
    resetWidth()
    emit('draggableChange', { list: draggableList.value, oldIndex: objIdx, newIndex: 0, item: obj })
  }

  const topPing = (item: TableColumn, index: number): void => {
    const list = JSON.parse(JSON.stringify(draggableList.value))
    list.splice(index, 1)
    let newIndex = 0
    if (isRightFixedColumn(item)) {
      newIndex = list.length
    } else if (!isAnyFixed(item)) {
      list.forEach((itm: TableColumn, idx: number) => {
        if (!isAnyFixed(itm) && (isLeftFixedColumn(list[idx - 1]) || idx === 0)) {
          newIndex = idx
        }
      })
    }
    list.splice(newIndex, 0, item)
    draggableList.value = list
    resetWidth()
    emit('draggableChange', {
      list: draggableList.value,
      oldIndex: index,
      newIndex: index - 1,
      item
    })
  }

  const clearShow = (obj: TableColumn): void => {
    const objKey = getPropKey(obj.prop)
    localSetting.value.forEach((item) => {
      if (getPropKey(item.prop) === objKey && item.name === obj.name) {
        item.showCol = false
        fnChangeChild(item)
      }
    })
  }

  const clearShowItem = (itm: TableColumn, idx: number): void => {
    itm.showCol = false
    resetWidth()
    emit('draggableChange', { list: draggableList.value, oldIndex: idx, newIndex: idx, item: itm })
  }

  const updateListItem = (obj: DragUpdateEvent, item: TableColumn): void => {
    const itemKey = getPropKey(item.prop)
    draggableList.value.forEach((itm) => {
      if (
        getPropKey(itm.prop) === itemKey &&
        item.columnChildren &&
        Array.isArray(item.columnChildren)
      ) {
        const oldIndex = obj.oldIndex
        const newIndex = obj.newIndex
        const targetObj = item.columnChildren[oldIndex]
        item.columnChildren.splice(oldIndex, 1)
        item.columnChildren.splice(newIndex, 0, targetObj)
        resetWidth()
        emit('draggableChange', {
          list: draggableList.value,
          oldIndex: null,
          newIndex: null,
          item: targetObj
        })
        nextTick(() => {
          draggableAreaKey.value++
        })
      }
    })
  }

  const updateList = (obj: DragUpdateEvent): void => {
    const oldIndex = obj.oldIndex
    const newIndex = obj.newIndex
    resetWidth()
    emit('draggableChange', {
      list: draggableList.value,
      oldIndex,
      newIndex,
      item: draggableList.value[newIndex]
    })
    setFixedTable()
    nextTick(() => {
      draggableAreaKey.value++
    })
  }

  const fnChangeChild = (fa: TableColumn, row?: TableColumn): void => {
    if (!row) {
      emit('showItemChange', { resetList: null, pItem: fa, item: null })
      const faKey = getPropKey(fa.prop)
      draggableList.value.forEach((item) => {
        if (getPropKey(item.prop) === faKey) {
          item.showCol = fa.showCol
        }
      })
      return
    }
    const childCheck =
      fa.columnChildren && Array.isArray(fa.columnChildren)
        ? fa.columnChildren.map((i) => i.showCol).filter(Boolean)
        : []
    fa.showCol = childCheck.length === 0 ? false : true
    emit('showItemChange', { resetList: null, pItem: fa, item: row })
  }

  // const getStorageKey = (): string =>
  //   `table_columns_${props.tableName}${route.path.replace(/\//g, '_')}`

  const fnSave = async (): Promise<void> => {
    const path = route.path.replace(/\//g, '_')
    const settingArr = {
      showCols: localSetting.value?.filter((item) => !item.showCheck),
      draggableList: draggableList.value
    }
    try {
      const res: any = await saveUserHabitsApi({
        key: `${props.tableName}${path}`,
        habits: JSON.stringify(settingArr)
      })
      if (res.code === 200) {
        try {
          // localStorage.setItem(getStorageKey(), JSON.stringify(settingArr))
        } catch {
          /* ignore */
        }
        ElMessage.success('保存成功！')
        visible.value = false
      }
    } catch {
      ElMessage.error('保存失败')
    }
  }

  /**
   * 服务端 draggableList 与当前表头列是否一致（可配置列：非 showCheck 的项）。
   * 不一致时说明前端已增删列，应忽略服务端顺序，使用当前 setting 作为默认。
   */
  const isDraggableListInSync = (objList: TableColumn[]): boolean => {
    if (!objList?.length) return false
    if (props.hasSetChild) return true
    const localCols = localSetting.value.filter((c) => !c.showCheck)
    const localKeys = localCols.map((c) => getPropKey(c.prop)).filter(Boolean)
    const serverKeys = objList.map((c) => getPropKey(c.prop)).filter(Boolean)
    if (localKeys.length !== serverKeys.length) return false
    const setLocal = new Set(localKeys)
    const setServer = new Set(serverKeys)
    if (setLocal.size !== setServer.size) return false
    if (setServer.size !== serverKeys.length) return false
    for (const k of setLocal) {
      if (!setServer.has(k)) return false
    }
    return true
  }

  const fnGetHabits = async (): Promise<void> => {
    if (loadingHabits.value) return
    loadingHabits.value = true
    const path = route.path.replace(/\//g, '_')
    try {
      const res: any = await getHabitsApi(`${props.tableName}${path}`)
      if (res.code === 200) {
        const dataObj = JSON.parse(res.data)
        const dataArr = dataObj?.showCols as TableColumn[] | undefined
        if (dataArr && dataArr.length > 0) {
          dataArr.forEach((item, index) => {
            const itemKey = getPropKey(item.prop)
            const colObj = localSetting.value.find(
              (setItem) => getPropKey(setItem.prop) === itemKey
            )
            if (colObj) colObj.showCol = item.showCol
            if (item.columnChildren) {
              item.columnChildren.forEach((child) => {
                const childKey = getPropKey(child.prop)
                const colObj2 = localSetting.value[index]?.columnChildren?.find(
                  (setChildItem) => getPropKey(setChildItem.prop) === childKey
                )
                if (colObj2) colObj2.showCol = child.showCol
              })
            }
          })
        }
        emit('showItemChange', {
          resetList: JSON.parse(JSON.stringify(localSetting.value)),
          pItem: null,
          item: null
        })
        getDraggerableList(dataObj?.draggableList)
        // try {
        //   localStorage.setItem(
        //     // getStorageKey(),
        //     JSON.stringify({
        //       showCols: dataArr,
        //       draggableList: dataObj?.draggableList
        //     })
        //   )
        // } catch {
        //   /* ignore */
        // }
      }
    } catch (e: any) {
      if (e?.code !== 401) ElMessage.error('加载失败')
    }
    loadingHabits.value = false
  }

  const getDraggerableList = (objList?: TableColumn[] | null): void => {
    if (!objList || objList?.length === 0) {
      draggableList.value = JSON.parse(JSON.stringify(localSetting.value))
      return
    }
    if (!isDraggableListInSync(objList)) {
      draggableList.value = JSON.parse(JSON.stringify(localSetting.value))
      resetWidth()
      emit('draggableChange', {
        list: draggableList.value,
        oldIndex: null,
        newIndex: null,
        item: null
      })
      return
    }
    draggableList.value = props.hasSetChild
      ? JSON.parse(JSON.stringify(objList))
      : repartitionFixedColumns(objList)
    resetWidth()
    emit('draggableChange', {
      list: draggableList.value,
      oldIndex: null,
      newIndex: null,
      item: null
    })
  }

  const resetWidth = (): void => {
    draggableList.value.forEach((item) => {
      const itemKey = getPropKey(item.prop)
      const obj = localSetting.value.filter((n) => getPropKey(n.prop) === itemKey)
      if (!obj || obj.length === 0) return
      item.width = obj[0].width
    })
    let max = draggableWidth.value
    draggableList.value.forEach((item) => {
      const itemWidth = (item?.name?.length || 0) * 14 + 80
      if (itemWidth > max) max = itemWidth
    })
    draggableWidth.value = max
  }

  /** 获取“原有”列配置：优先 defaultSetting（初始顺序），否则 setting，用于恢复默认 */
  const getOriginalColumnsConfig = (): TableColumn[] => {
    const source =
      props.defaultSetting && props.defaultSetting.length > 0
        ? props.defaultSetting
        : props.setting || []
    return JSON.parse(JSON.stringify(source)) as TableColumn[]
  }

  /** 表格恢复默认：仅还原本地显隐、顺序、固定，不调用保存接口；需点「确定」后再保存 */
  const handleReset = (): void => {
    const defaultConfig = getOriginalColumnsConfig()
    defaultConfig.forEach((col) => {
      col.showCol = col.defaultShowCol !== undefined ? col.defaultShowCol : true
      if (col.columnChildren?.length) {
        col.columnChildren.forEach((child) => {
          child.showCol = child.defaultShowCol !== undefined ? child.defaultShowCol : true
        })
      }
      col.fixed = col.fixed ?? false
      if (col.columnChildren?.length) {
        col.columnChildren.forEach((child) => {
          child.fixed = child.fixed ?? false
        })
      }
    })
    const ordered = props.hasSetChild
      ? defaultConfig
      : repartitionFixedColumns(JSON.parse(JSON.stringify(defaultConfig)))
    localSetting.value = ordered
    draggableList.value = JSON.parse(JSON.stringify(ordered))
    resetWidth()
    emit('draggableChange', {
      list: draggableList.value,
      oldIndex: null,
      newIndex: null,
      item: null
    })
    emit('showItemChange', { resetList: localSetting.value, pItem: null, item: null })
  }

  watch(
    () => props.setting,
    (val) => {
      try {
        const next = JSON.parse(JSON.stringify(val || []))
        const arr = Array.isArray(next) ? next : []
        const ordered = props.hasSetChild ? arr : repartitionFixedColumns(arr)
        localSetting.value = ordered
        draggableList.value = JSON.parse(JSON.stringify(ordered))
        resetWidth()
      } catch {
        const arr = Array.isArray(val) ? (val as TableColumn[]) : []
        const ordered = props.hasSetChild
          ? arr
          : repartitionFixedColumns(JSON.parse(JSON.stringify(arr)))
        localSetting.value = ordered
        draggableList.value = JSON.parse(JSON.stringify(ordered))
        resetWidth()
      }
    },
    { immediate: true, deep: true }
  )

  watch(
    () => visible.value,
    (v) => {
      if (v) {
        try {
          const next = JSON.parse(JSON.stringify(localSetting.value || []))
          const arr = Array.isArray(next) ? next : []
          draggableList.value = props.hasSetChild ? arr : repartitionFixedColumns(arr)
        } catch {
          const fallback = Array.isArray(localSetting.value)
            ? (localSetting.value as TableColumn[])
            : []
          draggableList.value = props.hasSetChild
            ? fallback
            : repartitionFixedColumns(JSON.parse(JSON.stringify(fallback)))
        }
        nextTick(() => setFixedTable())
      }
    }
  )

  /** 同步从 localStorage 恢复列配置，避免刷新后等待 API 导致列顺序闪烁 */
  // const syncLoadFromCache = (): void => {
  //   try {
  //     const cached = localStorage.getItem(getStorageKey())
  //     if (!cached) return
  //     const data = JSON.parse(cached)
  //     if (!data?.draggableList?.length) return
  //     // 先应用 showCols
  //     const dataArr = data.showCols as TableColumn[] | undefined
  //     if (dataArr?.length) {
  //       dataArr.forEach((item) => {
  //         const colObj = localSetting.value.find((setItem) => setItem.prop === item.prop)
  //         if (colObj) {
  //           colObj.showCol = item.showCol
  //           if (item.columnChildren && colObj.columnChildren) {
  //             item.columnChildren.forEach((child) => {
  //               const colObj2 = colObj.columnChildren?.find(
  //                 (setChildItem) => setChildItem.prop === child.prop
  //               )
  //               if (colObj2) colObj2.showCol = child.showCol
  //             })
  //           }
  //         }
  //       })
  //       emit('showItemChange', {
  //         resetList: JSON.parse(JSON.stringify(localSetting.value)),
  //         pItem: null,
  //         item: null
  //       })
  //     }
  //     getDraggerableList(data.draggableList)
  //   } catch {
  //     /* ignore */
  //   }
  // }

  onMounted(() => {
    if (props.setting.length) {
      // syncLoadFromCache()
      fnGetHabits()
    }
  })
</script>

<style lang="scss">
  .set-title {
    width: 100%;
    padding-bottom: 6px;
    margin: 10px auto 0;
    border-top: solid 1px #e4e7ed !important;
    border-bottom: dashed 1px #e4e7ed !important;

    /* filter-checkbox padding reserved */
    &:first-of-type {
      margin-top: 0;
      border-top: 0;
    }
  }

  .filter-popover {
    padding: 0;

    .colSetting {
      display: flex;
    }

    .filter-checkbox {
      width: 33.33%;
      padding: 0 16px;
      margin-top: 12px;
      margin-right: 0;

      .el-checkbox__label {
        display: inline-block;
        width: 100%;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        vertical-align: middle;
      }
    }

    .filter-content {
      flex-grow: 3;
      max-height: 300px;
      padding-bottom: 16px;
      overflow-y: auto;
    }

    .filter-btnBox {
      display: flex;
      justify-content: space-between;
      padding: 16px;
      border-top: solid 1px #e4e7ed;
    }

    .draggable-root {
      position: relative;
      display: block;
      flex-grow: 2;
      flex-shrink: 1;
      max-height: 300px;
      border-left: 1px solid #dddfe3;

      .draggable-search {
        position: sticky;
        top: 0;
        width: 100%;
        border-left: 0;

        .draggable-search-input {
          border-radius: 0 2px 0 0;
        }
      }

      .draggable-parent {
        width: 100%;
        height: calc(300px - 0.7rem);
        overflow: auto;
      }
    }

    .draggable-search-input {
      :deep(.el-input__inner) {
        &:focus {
          border-color: #dddfe3 !important;
          border-top: 0;
          border-right: 0;
          border-left: 0;
        }
      }
    }
  }

  .setting-filter {
    position: relative;
    display: inline-block;
    margin-left: 15px;
  }

  .fun-list {
    position: absolute;
    left: 86%;
    display: none;
    cursor: pointer;
    transform: translateX(-100%);
  }

  .fun-list-show {
    position: absolute;
    left: 100%;
    display: inline-block;
    cursor: pointer;
    transform: translateX(-150%);
  }

  .draggable-item {
    position: relative;
    width: 170px;
    padding: 3px 0;
    margin-left: 1rem;
    cursor: pointer;

    .content {
      padding-left: 5px;
    }
  }

  .draggable-item-children {
    position: relative;
    width: 170px;
    padding: 1px 0;
    margin-left: 1rem;
    font-size: 13px;
    color: #888;
    cursor: pointer;

    .content {
      padding-left: 1.5rem;
    }
  }

  .draggable-item:hover,
  .draggable-item-children:hover {
    background: #e5eefe;

    .fun-list {
      top: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      height: 100%;
      line-height: 100%;

      .item-hidden {
        display: none;
      }
    }
  }

  .icon-btn {
    box-sizing: border-box;
    display: flex;
    align-items: center;
    justify-content: center;
    width: 32px;
    height: 32px;
    margin-left: 16px;
    border: 1px solid #dddfe3;
    border-radius: 2px;

    .mk-iconfont {
      font-size: 14px;
    }

    &:hover {
      background: none;

      .mk-iconfont {
        color: #8e9fff;
      }
    }
  }
</style>
