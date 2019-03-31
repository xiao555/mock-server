<template lang="pug">
  #app(v-loading.fullscreen.lock='loading')
    Header
    main
      nav-tabs.nav-tabs(:options='navTabsOptions' @toggle-tab='toggleTab')
      .tab-content
        file-explorer(ref='fileExplorer' v-if='activedTab === "导入"' @choose-file='chooseFile')
        el-collapse.api-list(accordion v-else)
          api-block(v-for='(api, index) in apiList' :api='api' :key='index')
</template>

<script>
import Header from '~/components/Header.vue'
import NavTabs from '~/components/NavTabs.vue'
import FileExplorer from '~/components/file-explorer/FileExplorer'
import ApiBlock from '~/components/ApiBlock'
import GET_MOCK_CONFIG from '~/apollo/mutations/getMockConfig.gql'

export default {
  name: 'App',
  components: {
    Header,
    NavTabs,
    FileExplorer,
    ApiBlock
  },
  data() {
    return {
      filePath: '',
      apiList: [],
      activedTab: '导入',
      navTabsOptions: ['导入', '文档'],
      loading: false
    }
  },
  methods: {
    toggleTab(tab) {
      if (tab === '文档' && this.filePath === '') {
        this.$message.error('请选择文件夹')
        return
      }
      this.activedTab = tab
    },
    async chooseFile(path) {
      this.filePath = path
      this.apiList = []
      this.activedTab = '文档'
      this.loading = true
      try {
        await this.$apollo.mutate({
          mutation: GET_MOCK_CONFIG,
          variables: { path },
          update: (store, { data: { getMockConfig } }) => {
            this.apiList = getMockConfig
            this.loading = false
          }
        })
      } catch (err) {
        this.$message.error(err.message)
        this.loading = false
      }
    }
  }
}
</script>

<style lang="stylus">
#app
  font-family 'Avenir', Helvetica, Arial, sans-serif
  -webkit-font-smoothing antialiased
  -moz-osx-font-smoothing grayscale
  color #2c3e50
  overflow hidden
  display flex
  flex-direction column
  height 100vh
main,
.tab-content
  overflow hidden
  display flex
  flex-direction column
  height 100%
  .api-list
    overflow-y auto
  .action-bar
    text-align center
    padding 10px 0
</style>
