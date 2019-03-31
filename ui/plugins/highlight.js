import Vue from 'vue'
import hljs from 'highlightjs'
import 'highlightjs/styles/github.css'

hljs.configure({ useBR: false })

Vue.directive('highlight', function(el) {
  const blocks = el.querySelectorAll('pre code')
  blocks.forEach(block => {
    hljs.highlightBlock(block)
  })
})
