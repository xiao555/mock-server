<template lang="pug">
.file-explorer
  .toolbar
    button.btn(type='button' @click='openParentFolder')
      i.fa.fa-angle-up
    .path-edit(v-if='editingPath')
      input.path-input(
        ref='pathInput'
        v-model='editedPath'
        @keyup.esc='editingPath = false'
        @keyup.enter='submitPathEdit()')
    .current-path(v-else @dblclick='openPathEdit()')
      .path-value
        .path-part(v-for='(item, index) in slicePath(cwdPath)' :key='index')
          button.btn.path-folder(@click="openFolder(item.path)")
            template(v-if='item.name') {{ item.name }}
            i.fa.fa-folder(v-else)
      button.btn.edit-path-button(@click='openPathEdit()')
        i.fa.fa-pencil
  .folders

</template>

<script>

const isDirectory = file => {
  if (!fs.existsSync(file)) return false
  try {
    return fs.statSync(file).isDirectory()
  } catch (error) {
    return false
  }
}

const isMockConfig = file => {
  if (!fs.existsSync(file) || fs.extname(file) !== '.js') return false
  let config = require(file)
  return !!config.api
}

export default {
  data () {
    return {
      editingPath: false,
      editedPath: '',
      cwdPath: CWD,
      children: []
    }
  },
  watch: {
    'cwdPath': 'listChildren'
  },
  methods: {
    async openPathEdit () {
      this.editedPath = this.cwdPath
      this.editingPath = true
      await this.$nextTick()
      this.$refs.pathInput.focus()
    },
    async listChildren () {
      const files = await fs.readdir(this.cwdPath, 'utf-8')
      this.children = files.map(file => {
        const path = p.join(this.cwdPath, file)
        return {
          path: path,
          name: file,
        }
      }).filter(file => isDirectory(file.path) || isMockConfig(file.path))
    },
    submitPathEdit () {
      this.openFolder(this.editedPath)
    },
    openFolder (path) {
      this.cwdPath = path
      this.editingPath = false
    },
    openParentFolder (path) {
      this.cwdPath = p.dirname(this.cwdPath)
    },
    slicePath (path) {
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
  },
  created () {
    this.listChildren()
  }
}
</script>

<style lang="stylus" scoped>
.file-explorer
  max-width 1200px
  width 100%
  margin 0 auto
  .toolbar
    display flex
    justify-content space-between
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
      .path-part, 
      .edit-path-button
        flex auto 0 0
        border-left 1px solid #fff
</style>
