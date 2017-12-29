const Router = require('koa-router')
const compose = require('koa-compose')
const utils = require('../utils')
const fs = require('fs')
const resolve = require('path').resolve

const getPathReg = /([^\?]*)(\?(.*))?(#.*)?/ // 分割url的正则

module.exports = ({ dataFile, api }) => {
  const router = new Router()
  const results = {} // 保存配置文件的解析结果
  // 解析配置文件， 按照 path method划分
  for (const key in api) {
    if (api.hasOwnProperty(key)) {
      let method = key.split(' ')[0].toLocaleLowerCase() // 请求方法
      let result = getPathReg.exec(key.split(' ')[1])
      let $PATH = result[1] // 请求路径
      // 初始化path对应的对象
      if (!results.hasOwnProperty($PATH)) {
        results[$PATH] = {}
      }
      if (!results[$PATH].hasOwnProperty(method)) {
        results[$PATH][method] = []
      }
      results[$PATH][method].push({
        params: result[3], // 请求参数
        hash: result[4], // 请求hash
        data: api[key] // 数据文件
      })
    }
  }

  // 配置路由
  for (let path in results) {
    if (!results.hasOwnProperty(path)) break
    for (let method in results[path]) {
      if (!results[path].hasOwnProperty(method)) break
      router[method](path, ctx => {
        return handle(ctx, results[path][method])
      })
    }
  }

  function handle(ctx, config) {
    // 判断请求是否带参数，默认带
    let hasParams = 1
    if (Object.keys(ctx.query).length == 0) {
      hasParams = 0
    }
    // 找到匹配的配置，返回相应的数据
    for (let key in config) {
      let item = config[key]
      if (!config.hasOwnProperty(key) || (item.params !== undefined) != hasParams) break
      let match = 1 // 默认匹配
      if (item.params !== undefined) {
        // 解析配置参数
        let _params = item['params'].split('&').reduce((pre, cur) => {
          let key = cur.split('=')[0]
          let val = cur.split('=')[1]
          if (pre.hasOwnProperty(key)) {
            Array.isArray(pre[key]) ? pre[key].push(val) : pre[key] = [pre[key], val]
          } else {
            pre[key] = val
          }
          return pre
        }, {})
        // 判断请求的参数与配置参数是否匹配
        if (!utils.matchObject(ctx.query, _params)) {
          match = 0
        }
      }
      if (match) {
        return ctx.body = utils.readFile(ctx, resolve(dataFile, item.data))
      }
    }
    return ctx.status = 404
  }

  return compose([
    router.routes(),
    router.allowedMethods()
  ])
}

