<template>
  <!--
    showCol: true,已勾选
    cannotHidden: true, 禁止点击；
    showCheck: false, 默认显示
    defaultShowCol: true, 初始化默认值
  -->
  <el-popover
    placement="bottom"
    width="500"
    trigger="click"
    v-model="visible"
    popper-class="filter-popover"
  >
    <!-- 二级-->
    <div class="filter-content" v-if="hasSetChild">
      <template v-for="(setItem, index) in setting">
        <div class="set-title" v-if="!setItem.showCheck" :key="index">
          <el-checkbox
            class="filter-checkbox"
            :label="` ${setItem.columnName || setItem.name}`"
            v-model="setItem.showCol"
            @change="fnChangeFa(setItem)"
            :disabled="setItem.cannotHidden"
          />
          <!--{{ setItem.name }}-->
        </div>
        <el-checkbox
          @change="fnChangeChild(setItem)"
          v-for="chileItem in (setItem.columnChildren || []).filter((item) => !item.showCheck)"
          :key="chileItem.key + setItem.name"
          class="filter-checkbox"
          :label="` ${chileItem.columnName || chileItem.name}`"
          v-model="chileItem.showCol"
          :disabled="chileItem.cannotHidden"
        />
      </template>
    </div>
    <!-- 一级-->
    <div class="filter-content" v-else>
      <template v-for="item in setting">
        <el-checkbox
          :key="item.key"
          v-if="!item.showCheck"
          class="filter-checkbox"
          :label="item.columnName || item.name"
          v-model="item.showCol"
          :disabled="item.cannotHidden"
        />
      </template>
    </div>
    <div class="filter-btnBox">
      <div>
        <el-button size="small" @click="btnFilterReset">恢复默认</el-button>
      </div>

      <div>
        <el-button size="small" @click="visible = false">取消</el-button>
        <el-button type="primary" size="small" @click="fnSave">确定</el-button>
      </div>
    </div>
    <template v-slot:reference>
      <el-button class="icon-btn">
        <i class="mk-iconfont mkIcon-configuration color-Gray"></i>
      </el-button>
    </template>
  </el-popover>
</template>
<script lang="ts" setup>
  import { ref, onMounted } from 'vue'
  import { useRoute } from 'vue-router'
  import { saveUserHabitsApi, getHabitsApi } from '@/api/system-manage'
  import { ElMessage } from 'element-plus'

  interface tableColumn {
    key: string
    name: string
    columnName?: string
    showCol?: boolean
    showCheck?: boolean
    cannotHidden?: boolean
    defaultShowCol?: boolean
    columnChildren?: tableColumn[]
  }

  interface tableProps {
    setting: tableColumn[]
    tableName: string
    hasSetChild: boolean
  }

  const props = withDefaults(defineProps<tableProps>(), {
    setting: () => [],
    tableName: '',
    hasSetChild: false
  })

  //  数据定义
  const visible = ref(false)
  const loadingHabits = ref(false)

  // 回调集
  const emit = defineEmits<{
    change: [setting: tableColumn[]]
  }>()

  // 获取路由实例
  const route = useRoute()

  const fnGetHabits = (): any => {
    if (loadingHabits.value) return
    loadingHabits.value = true
    const path = route.path.replace(/\//g, '_')
    getHabitsApi(`${props.tableName}${path}`)
      .then((res: any) => {
        if (res.code == 200) {
          let dataArr: any = JSON.parse(res.data) || []
          if (dataArr.length > 0) {
            dataArr.forEach((item: any, index: number) => {
              /*一级*/
              const colObj = props.setting.find((setItem) => setItem.key === item.key)
              if (colObj) {
                colObj.showCol = item.showCol
              }

              /*二级*/
              if (item.columnChildren) {
                item.columnChildren.forEach((child: any) => {
                  const colObj2 = props.setting[index]?.columnChildren?.find(
                    (setChildItem) => setChildItem.key === child.key
                  )
                  if (colObj2) {
                    colObj2.showCol = child.showCol
                  }
                })
              }
            })
          }
        }
        loadingHabits.value = false
        emit('change', props.setting)
      })
      .catch(() => {
        loadingHabits.value = false
      })
  }

  // 重置默认展示的列
  const btnFilterReset = () => {
    props.setting.forEach((i) => {
      if (i.defaultShowCol != undefined) {
        i.showCol = i.defaultShowCol
      }

      if (i.columnChildren && i.columnChildren.length) {
        i.columnChildren.forEach((child) => {
          if (child.defaultShowCol != undefined) {
            child.showCol = child.defaultShowCol
          }
        })
      }
    })
    emit('change', props.setting)
  }

  // 一级选项
  const fnChangeFa = (fa: tableColumn) => {
    fa.columnChildren?.forEach((item) => {
      if (fa.showCol != undefined) {
        item.showCol = fa.showCol
      }
    })
  }

  // 二级选项
  const fnChangeChild = (fa: tableColumn) => {
    const childCheck = fa.columnChildren?.map((i: tableColumn) => i.showCol).filter(Boolean)
    if (childCheck?.length == 0) {
      fa.showCol = false
    } else {
      fa.showCol = true
    }
  }

  // 保存
  const fnSave = () => {
    const path = route.path.replace(/\//g, '_')
    let settingArr = []
    if (props.hasSetChild) {
      settingArr = props.setting
    } else {
      settingArr = props.setting?.filter((item) => !item.showCheck)
    }
    saveUserHabitsApi({
      key: `${props.tableName}${path}`,
      habits: JSON.stringify(settingArr)
    }).then((res: any) => {
      if (res.code == 200) {
        ElMessage({
          message: '保存成功',
          type: 'success'
        })
      }
    })
  }

  onMounted((): void => {
    if (props.setting.length) {
      fnGetHabits()
    }
  })
</script>
<style lang="scss" scoped>
  .set-title {
    width: 100%;
    padding-bottom: 6px;
    margin: 10px auto 0;
    border-top: solid 1px #e4e7ed !important;
    border-bottom: dashed 1px #e4e7ed !important;

    &:first-of-type {
      margin-top: 0;
      border-top: 0;
    }
  }

  .filter-popover {
    padding: 0;

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
      max-width: 100% !important;
      max-height: 300px;
      padding-bottom: 16px;
      overflow-y: auto;
    }

    .filter-btnBox {
      display: flex;
      justify-content: space-between;
      padding: 16px;
      //text-align: right;
      //margin: 0;
      border-top: solid 1px #e4e7ed;
    }
  }

  .setting-filter {
    position: relative;
    display: inline-block;
    margin-left: 15px;
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
