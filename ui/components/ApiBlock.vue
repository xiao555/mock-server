<template lang="pug">
  el-collapse-item.api-block
    template(slot='title')
      h3
        el-tag.http-method(:type='httpTag[api.method.toLowerCase()]') {{ api.method }}
        span.url {{ api.url }}
    .content(ref='content')
      .container(ref='container')
        .expect-data
          template(v-if='api.isCustomFunc')
            div(v-highlight)
              pre
                code {{ api.expectData }}
          template(v-else)
            div ExpectData:
            div(v-highlight)
              pre
                code {{ api.expectData }}
        .path(v-if='pathArr.length')
          template(v-for='item in pathArr')
            input(v-if='item.text.includes("*")' type='text' v-model='item.value')
            span(v-else) {{ item.value }}
            | /
        .params(v-if='paramsList.length')
          p Params:
          p(v-for='param in paramsList' :key='param.label')
            label {{ param.label }}
            input(type='text' v-model.trim='param.value')
            span.refer {{ param.refer }}
        .data(v-if='api.isCustomFunc')
          textarea(v-model='reqData')
        .try-it
          button(type='button' @click='tryIt') Try it!
          div(v-loading="loading" v-highlight)
            pre(v-if='responseData')
              code {{ JSON.stringify(responseData, null, 2) }}
</template>

<script>
export default {
  props: {
    api: {
      type: Object,
      default: () => ({}),
      required: true
    }
  },
  data() {
    return {
      httpTag: {
        get: 'success',
        put: 'info',
        post: 'warning',
        patch: 'info',
        delete: 'danger'
      },
      showContent: false,
      pathArr: [],
      paramsList: [],
      responseData: '',
      reqData: '',
      loading: false
    }
  },
  created() {
    const [path, query] = this.api.url.split('?')
    if (path.includes('*')) {
      this.pathArr = path
        .split('/')
        .filter(_ => _ !== '')
        .map(item => ({
          text: item,
          value: item
        }))
    }
    if (query) {
      query.split('&').forEach(_ => {
        const [label, value] = _.split('=')
        this.paramsList.push({
          label,
          value,
          refer: value
        })
      })
    }
  },
  methods: {
    tryIt() {
      this.responseData = ''
      const path = this.pathArr.length
        ? this.pathArr.map(_ => _.value).join('/')
        : this.api.url.split('?')[0]
      const param = this.paramsList
        .reduce((res, cur) => {
          res.push(`${cur.label}=${cur.value}`)
          return res
        }, [])
        .join('&')
      this.loading = true
      if (['post', 'patch'].includes(this.api.method.toLowerCase())) {
        this.$axios[this.api.method.toLowerCase()](
          `${path}${param ? `?${param}` : ''}`,
          JSON.parse(this.reqData || '{}')
        )
          .then(res => {
            this.responseData = res.data
          })
          .catch(error => {
            this.responseData =
              error.response.status + ' ' + error.response.statusText
          })
          .then(() => {
            this.loading = false
          })
      } else {
        this.$axios[this.api.method.toLowerCase()](
          `${path}${param ? `?${param}` : ''}`
        )
          .then(res => {
            this.responseData = res.data
          })
          .catch(error => {
            this.responseData =
              error.response.status + ' ' + error.response.statusText
          })
          .then(() => {
            this.loading = false
          })
      }
    }
  }
}
</script>

<style lang="stylus" scoped>
.api-block
  width 80%
  max-width: 800px
  margin 10px auto
  .http-method
    width 80px
    text-align center
    margin-right 10px
</style>
