<template lang="pug">
  #app
    Header
    main
      nav-tabs.nav-tabs(:options='navTabsOptions' @toggle-tab='')
      file-explorer(v-if='activedTab === "导入"' @select-file='selectFile')
      //- api-block(v-else v-for='(api, index) in apiList' :api='api' :key='index')
</template>

<script>
import Header from '~/components/Header.vue'
import NavTabs from '~/components/NavTabs.vue'
import FileExplorer from '~/components/file-explorer/FileExplorer'
import ApiBlock from '~/components/ApiBlock'

export default {
  name: 'app',
  components: { 
    Header,
    NavTabs,
    FileExplorer,
    ApiBlock
  },
  data () {
    return {
      filePath: '',
      activedTab: '导入',
      navTabsOptions: [
        '导入',
        '文档',
      ]
    }
  },
  methods: {
    toggleTab (tab) {
      this.activedTab = tab
    },
    selectFile (filePath) {
      this.filePath = filePath
      this.activedTab = '文档'
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

.btn
  display inline-block
  vertical-align middle
  border none
  position relative
  font-size 14px
  line-height 16px
  height 32px
  outline 0
  cursor pointer
</style>
