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
      if (dataFile) fileData = utils.readFile(ctx, resolve(dataFile, item.data))
      else fileData = JSON.parse(item.data)
      return ctx.body = fileData
    }
  }
  return ctx.status = 404
}

/**
 * 匹配RESTful配置
 * @param {Object} ctx - 请求上下文
 * @param {Array} config - 对应方法的RESTful配置
 */
function handleRESTful (ctx, config, dataFile) {
  
  // 判断请求是否带参数
  let hasParams = Object.keys(ctx.query).length == 0 ? 0 : 1
  if (hasParams) return ctx.body = 'Error: ' + ctx.url
  let _paths = ctx.url.split('&')[0].split('/').filter(e => e !== '')
  let l = _paths.length
  for (let index = 0; index < config.length; index++) {
    const item = config[index];
    let i = j = 0
    let match = 1 // 默认匹配
    while (j < l) {
      if (item.paths[i] == '*') {
        i++
        j++
      } else if (item.paths[i] == '**') {
        if (i == l - 1) break
        else {
          i++
          while (_paths[j] !== item.paths[i] && j < l) {
            j++
          }
          if (item.paths[i] !== _paths[j]) {
            match = 0
            break
          }
        }
      } else {
        if (item.paths[i] !== _paths[j]) {
          match = 0
          break
        }
        i++
        j++
      }
    } // while
    
    if (match) {
      if (dataFile) fileData = utils.readFile(ctx, resolve(dataFile, item.data))
      else fileData = JSON.parse(item.data)
      return ctx.body = fileData
    }
  }
  return ctx.status = 404
}

module.exports = ({ dataFile, api }) => {
  const router = new Router()
  const results = {
    RESTful: {}
  } // 保存配置文件的解析结果
  // 解析配置文件， 按照 path method划分
  for (const key in api) {
    if (api.hasOwnProperty(key)) {
      let method = key.split(' ')[0].toLocaleLowerCase() // 请求方法
      let result = getPathReg.exec(key.split(' ')[1])
      let $PATH = result[1] // 请求路径
      // 不带参数的请求当RESTFful看
      if (key.indexOf('?') === -1) {
        let paths = key.split(' ')[1].split('/').filter(p => p !== '')
        if (!results.RESTful.hasOwnProperty(method)) {
          results.RESTful[method] = []
        }
        results.RESTful[method].push({
          paths: paths,
          data: api[key]
        })
      } else {
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
  }

  // 配置路由
  for (let path in results) {
    if (!results.hasOwnProperty(path)) break
    for (let method in results[path]) {
      if (!results[path].hasOwnProperty(method)) break
      router[method](path, ctx => {
        let data = handle(ctx, results[path][method], dataFile)
        return data
      })
    }
  }

  if (Object.keys(results.RESTful).length !== 0) {
    for (const method in results.RESTful) {
      if (results.RESTful.hasOwnProperty(method)) {
        const elements = results.RESTful[method];
        router[method]('*', ctx => {
          let data = handleRESTful(ctx, elements, dataFile)
        })
      }
    }
  }

  return compose([
    router.routes(),
    router.allowedMethods()
  ])
}
