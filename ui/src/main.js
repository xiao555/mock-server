import Vue from 'vue'
import App from './App.vue'
import hljs from 'highlightjs'
import 'highlightjs/styles/github.css'

Vue.config.productionTip = false

hljs.configure({useBR: false});

Vue.directive('highlight',function (el) {
  let blocks = el.querySelectorAll('pre code');
  blocks.forEach((block)=>{
    hljs.highlightBlock(block)
  })
})

new Vue({
  render: h => h(App),
}).$mount('#app')
