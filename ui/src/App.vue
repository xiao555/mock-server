<template lang="pug">
  #app
    api-block(v-for='(api, index) in apiList' :api='api' :key='index')
</template>

<script>
import ApiBlock from './components/ApiBlock'
import { api } from '../../test/config.js'
const parse = api => {
  let res = []
  for (const key in api) {
    if (api.hasOwnProperty(key)) {
      const value = api[key];
      let isCustomFunc = typeof value === 'function'
      let [method, url] = key.split(' ')
      res.push({
        method,
        url,
        expectData: isCustomFunc ? value : require(`../../test/data/${value}`),
        isCustomFunc
      })
    }
  }
  return res
}
export default {
  name: 'app',
  components: { ApiBlock },
  data () {
    return {
      apiList: parse(api)
    }
  }
}
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  color: #2c3e50;
  margin-top: 60px;
}
</style>
