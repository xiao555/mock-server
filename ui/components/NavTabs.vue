<template lang="pug">
.tabs
  .content
    button(type='button' v-for='item in options' @click='$emit("toggle-tab", item)') {{ item }}
</template>

<script>
export default {
  props: {
    options: Array,
  }
}
</script>

<style lang="stylus" scoped>
.tabs
  margin-bottom 20px
.content
  max-width 1200px
  text-align center
  margin 0 auto
  button
    margin 0 10px
    padding 0 18px
    line-height 16px
</style>

