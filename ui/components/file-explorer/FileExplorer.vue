<template lang="pug">
.file-explorer
  el-row.toolbar(:gutter='10')
    el-col(:span='2')
      el-button(type='primary' icon='el-icon-arrow-up' @click='openParentFolder')
    el-col(:span='22')
      .path-edit(v-if='editingPath')
        el-input.path-input(
          ref='pathInput'
          v-model='editedPath'
          @keyup.native.esc='editingPath = false'
          @keyup.native.enter='submitPathEdit')
      .current-path(v-else @dblclick='openPathEdit()')
        .path-value
          .path-part(v-for='(item, index) in slicePath(folderCurrent.path)' :key='index')
            el-button.path-folder(type='primary' @click="openFolder(item.path)")
              template(v-if='item.name') {{ item.name }}
              i.el-icon-d-arrow-left(v-else)
        el-button(type='primary' icon='el-icon-edit' @click='openPathEdit()')
  .folders
    .el-scrollbar__view.el-select-dropdown__list
      .el-select-dropdown__item(v-for='item in displayChildren' :key='item.name' @click='chooseItem(item)')
        el-row
          el-col(:span='1')
            i.el-icon-document
          el-col(:span='23')
            span {{ item.name }}
            el-tag.tag(type='success' size="mini" v-if='item.isMockConfig') MOCK
</template>

<script>
import FOLDER_CURRENT from '~/apollo/queries/folderCurrent.gql'
import FOLDER_OPEN_PARENT from '~/apollo/mutations/folderOpenParent.gql'
import FOLDER_OPEN from '~/apollo/mutations/folderOpen.gql'

export default {
  apollo: {
    folderCurrent: {
      prefetch: true,
      query: FOLDER_CURRENT
    }
  },
  data() {
    return {
      editingPath: false,
      editedPath: '',
      children: []
    }
  },
  computed: {
    displayChildren() {
      return this.folderCurrent.children.filter(floder => !floder.hidden)
    }
  },
  methods: {
    async openFolder(path) {
      try {
        await this.$apollo.mutate({
          mutation: FOLDER_OPEN,
          variables: { path },
          update: (store, { data: { folderOpen } }) => {
            store.writeQuery({
              query: FOLDER_CURRENT,
              data: { folderCurrent: folderOpen }
            })
            this.editingPath = false
          }
        })
      } catch (err) {
        this.$message.error(err.message)
      }
    },
    async openParentFolder() {
      this.editingPath = false
      try {
        await this.$apollo.mutate({
          mutation: FOLDER_OPEN_PARENT,
          update: (store, { data: { folderOpenParent } }) => {
            store.writeQuery({
              query: FOLDER_CURRENT,
              data: { folderCurrent: folderOpenParent }
            })
          }
        })
      } catch (err) {
        this.$message.error(err.message)
      }
    },
    submitPathEdit() {
      if (this.editedPath === this.folderCurrent.path) {
        this.editingPath = false
        return
      }
      this.openFolder(this.editedPath)
    },
    async openPathEdit() {
      this.editedPath = this.folderCurrent.path
      this.editingPath = true
      await this.$nextTick()
      this.$refs.pathInput.focus()
    },
    chooseItem(item) {
      if (item.isDirectory) {
        this.openFolder(item.path)
      } else {
        this.$emit('choose-file', item.path)
      }
    },
    slicePath(path) {
      const parts = []
      let startIndex = 0
      let index

      const findSeparator = () => {
        index = path.indexOf('/', startIndex)
        if (index === -1) index = path.indexOf('\\', startIndex)
        return index !== -1
      }

      const addPart = index => {
        const folder = path.substring(startIndex, index)
        const slice = path.substring(0, index + 1)
        parts.push({
          name: folder,
          path: slice
        })
      }

      while (findSeparator()) {
        addPart(index)
        startIndex = index + 1
      }

      if (startIndex < path.length) addPart(path.length)

      return parts
    }
  }
}
</script>

<style lang="stylus" scoped>
.file-explorer
  max-width 800px
  width 100%
  height 100%
  overflow hidden
  display flex
  flex-direction column
  margin 0 auto
  .toolbar
    .btn
      background-color rgb(179, 216, 255)
    .path-edit
      flex 100% 1 1
      display flex
      input
        width 100%
    .current-path
      flex 100% 1 1
      display flex
      flex-direction row
      background-color rgb(217, 236, 255)
      .path-value
        flex auto 1 1
        display flex
        flex-direction row
        align-items stretch
        overflow-x auto
      .path-part,
      .edit-path-button
        flex auto 0 0
        border-left 1px solid #fff
  .folders
    height 100%
    overflow-y auto
    .tag
      margin-left 4px
</style>
