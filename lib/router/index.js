const Router = require('koa-router')
const compose = require('koa-compose')
const utils = require('../utils')
const fs = require('fs')
const resolve = require('path').resolve

const getPathReg = /([^\?]*)(\?(.*))?(#.*)?/ // 分割url的正则

/**
 * 匹配制定配置
 * @param {Object} ctx - 请求上下文
 * @param {Array} config - 对应路径的API配置
 */
function handle(ctx, config, dataFile) {
  // 判断请求是否带参数
  let hasParams = Object.keys(ctx.query).length == 0 ? 0 : 1
  // 找到匹配的配置，返回相应的数据
  for (let i = config.length; i--;) {
    let item = config[i]
    if (!!item.params != hasParams) continue // 带参数的请求只匹配带参数的配置
    let match = 1 // 默认匹配
    if (!!item.params) {
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
      if (dataFile) return ctx.body = utils.readFile(ctx, resolve(dataFile, item.data))
      else return ctx.body = JSON.parse(item.data)
    }
  }
  return ctx.status = 404
}

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
      results[$PATH][method].unshift({
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
        return handle(ctx, results[path][method], dataFile)
      })
    }
  }

  return compose([
    router.routes(),
    router.allowedMethods()
  ])
}
