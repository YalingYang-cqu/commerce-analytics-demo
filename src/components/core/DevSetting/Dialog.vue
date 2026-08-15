<template>
  <el-dialog
    v-model="visible"
    title="开发配置"
    width="700px"
    :before-close="handleClose"
    destroy-on-close
  >
    <el-tabs v-model="activeTab" type="border-card">
      <el-tab-pane label="联调代理" name="proxy">
        <div v-for="(item, index) in proxyData" :key="item.key" class="check-token-body">
          <div
            :style="{
              marginBottom: '10px',
              fontSize: '14px',
              paddingTop: index === 0 ? 0 : '22px'
            }"
            >{{ item.name }}</div
          >
          <div class="check-token-body-nav">
            <el-space wrap>
              <el-button
                v-for="x in item.list"
                :key="x.api"
                :type="nowProxy[index] === x.api ? 'primary' : 'default'"
                @click="selectedKey(index, x.api)"
              >
                {{ x.title }}
              </el-button>
            </el-space>
          </div>
        </div>
      </el-tab-pane>
    </el-tabs>
    <template #footer>
      <el-button @click="handleClose">取消</el-button>
      <el-button type="primary" @click="handleSuccess">确定</el-button>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
  import { ref, reactive } from 'vue'
  import Cookies from 'js-cookie'

  interface ProxyItem {
    title: string
    api: string
  }

  interface ProxyDataItem {
    name: string
    key: string
    list: ProxyItem[]
  }

  const visible = ref(false)
  const activeTab = ref('proxy')
  const nowProxy = ref<string[]>([])
  const items: any = [
    { title: '测试环境', api: '/testapi' },
    { title: 'uat环境', api: '/uatapi' },
    { title: '本地', api: '/api1' }
  ]
  const proxyData: ProxyDataItem[] = reactive([
    {
      name: 'System服务',
      key: 'system',
      list: items
    },
    {
      name: 'Basic服务',
      key: 'basic',
      list: items
    },
    {
      name: 'OSS服务',
      key: 'oss',
      list: items
    },
    {
      name: 'PMS服务',
      key: 'pms',
      list: items
    },
    {
      name: 'TMS服务',
      key: 'tms',
      list: items
    },
    {
      name: 'WMS服务',
      key: 'wms',
      list: items
    },
    {
      name: 'IMS服务',
      key: 'ims',
      list: items
    }
    // {
    //   name: '旧服务',
    //   key: 'old',
    //   list: items
    // }
    // {
    //   name: '旧服务',
    //   key: 'old',
    //   list: [
    //     { title: '测试环境', api: '/oldapi' },
    //     { title: 'uat环境', api: '/oldapi' }
    //   ]
    // }
  ])

  const open = () => {
    visible.value = true
    const cookieValue = Cookies.get(`${window.location.port}proxy`) || ''
    console.log(cookieValue)
    nowProxy.value = cookieValue ? cookieValue.split(',') : []
  }

  const handleClose = () => {
    visible.value = false
  }

  const handleSuccess = () => {
    Cookies.set(`${window.location.port}proxy`, nowProxy.value.join(','))
    setTimeout(() => {
      visible.value = false
      location.reload()
    }, 500)
  }

  const selectedKey = (index: number, api: string) => {
    const cookiesKey = [...nowProxy.value]
    cookiesKey[index] = api
    nowProxy.value = cookiesKey
  }

  defineExpose({
    open
  })
</script>

<style lang="scss">
  .check-token-body {
    .check-token-body-title {
      padding-top: 15px;
      font-size: 14px;
      line-height: 32px;
    }
  }
</style>
