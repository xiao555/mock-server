<template lang="pug">
  .api-block
    .header(@click='toggleContent')
      h3
        span.http-method(:class='[ api.method.toLowerCase() ]') {{ api.method }}
        span.url {{ api.url }}
    .content(ref='content' :class='[ showContent ? "show" : "" ]')
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
                code {{ JSON.stringify(api.expectData) }}
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
          div(v-if='responseData' v-highlight)
            pre
              code {{ JSON.stringify(responseData, null, 2) }}
</template>

<script>
export default {
  props: {
    api: {
      type: Object,
      require,
    },
  },
  data () {
    return {
      showContent: false,
      pathArr: [],
      paramsList: [],
      responseData: '',
      reqData: '',
    }
  },
  methods: {
    toggleContent () {
      this.showContent = !this.showContent
      if (this.showContent) {
        this.updateContentHeight()
      } else {
        this.updateContentHeight('0px')
      }
    },
    tryIt () {
      this.responseData = ''
      let path = this.pathArr.length ? this.pathArr.map(_ => _.value).join('/') : this.api.url.split('?')[0]
      let param = this.paramsList.reduce((res, cur) => {
        res.push(`${cur.label}=${cur.value}`)
        return res
      }, []).join('&')
      if (['post', 'patch'].includes(this.api.method.toLowerCase())) {
        axios[this.api.method.toLowerCase()](`${path}${param ? `?${param}` : ''}`, JSON.parse(this.reqData || '{}'))
          .then(res => {
            this.responseData = res.data
            this.$nextTick(() => this.updateContentHeight())
          }).catch(error => {
            this.responseData = `${error.response.status} ${error.response.statusText}`
            this.$nextTick(() => this.updateContentHeight())
          })
      } else {
        axios[this.api.method.toLowerCase()](`${path}${param ? `?${param}` : ''}`)
          .then(res => {
            this.responseData = res.data
            this.$nextTick(() => this.updateContentHeight())
          }).catch(error => {
            this.responseData = `${error.response.status} ${error.response.statusText}`
            this.$nextTick(() => this.updateContentHeight())
          })
      }
    },
    updateContentHeight (height) {
      this.$refs.content.style.height = height || this.$refs.container.scrollHeight + 'px'
    }
  },
  created() {
    let [path, query] = this.api.url.split('?')
    if (path.includes("*")) {
      this.pathArr = path.split('/').filter(_ => _ !== '').map(item => ({
        text: item,
        value: item,
      }))
    }
    if (query) {
      query.split('&').forEach(_ => {
        let [label, value] = _.split('=')
        this.paramsList.push({
          label,
          value,
          refer: value,
        })
      })
    }
  },
}
</script>

<style lang="scss" scoped>
.api-block {
  width: 80%;
  max-width: 800px;
  margin: 10px auto;
  border: solid 1px #ebebeb;
  .header {
    display: flex;
    flex: 1;
    justify-content: start;
    cursor: pointer;
    padding-left: 10px;
    padding-right: 10px;
    &:hover {
      background-color: #f9fafc;
    }
    .http-method {
      display: inline-block;
      margin-right: 10px;
      border-radius: 4px;
      width: 80px;
      text-align: center;
      &.get {
        background-color: rgba(64, 158, 255, 0.1);
        border: 1px solid rgba(64, 158, 255, 0.2);
        color: #409EFF;
      }
      &.put {
        background-color: rgba(103, 194, 58, 0.1);
        border-color: rgba(103, 194, 58, 0.2);
        color: #67c23a;
      }
      &.post {
        background-color: rgba(230, 162, 60, 0.1);
        border-color: rgba(230, 162, 60, 0.2);
        color: #e6a23c;
      }
      &.patch {
        background-color: rgba(144, 147, 153, 0.1);
        border-color: rgba(144, 147, 153, 0.2);
        color: #909399;
      }
      &.delete {
        background-color: rgba(245, 108, 108, 0.1);
        border-color: rgba(245, 108, 108, 0.2);
        color: #f56c6c;
      }
    }
    .url {
      cursor: pointer;
      &:hover {
        text-decoration-line: underline;
      }
    }
  }
  .content {
    height: 0;
    overflow: hidden;
    transition: height .2s;
    background-color: #fafafa;
    padding-left: 10px;
    padding-right: 10px;
    .expect-data {
      overflow: hidden;
    }
    .params {
      label {
        display: inline-block;
        width: 100px;
        margin-right: 10px;
      }
      input {
        margin-right: 10px;
      }
    }
  }
}
</style>

