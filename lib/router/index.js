const Router = require('koa-router')
const compose = require('koa-compose')
const utils = require('../utils')
const fs = require('fs')
const resolve = require('path').resolve
const log = require('../utils/log')

const splitUrl = /([^\?]*)(\?[^#]*)?(\#.*)?/ // 分割url的正则 exec: [match, path, query, hash]

const allowMethods = ['get', 'put', 'post', 'patch', 'delete', 'del'] // 支持的请求方法

/**
 * 解析配置项，结果保存在config里
 * config：{
 *   get: {
 *     ${path1}: {  // 请求路径
 *       default: ${value}, // 没有查询参数
 *       ${SortedQueryKeyJoinedBy&}: { // 查询字段排序后用拼接
 *         ${Query}: ${value}, // 配置项的query部分(带?)
 *       }
 *     },
 *     ${path2}: {...}
 *   },
 *   post: {...}
 * }
 * @param {Object} config - 存储配置解析结果
 * @param {Array} methods - 记录用到的请求方法
 * @param {String} key - `${Method} ${Url}`
 * @param {String} value - json string or file path
 */
function parseConfig(config, methods, key, value) {
  let [method, request] = key.split(' ') // ['GET', '/api/users/all']
  method = method.toLocaleLowerCase()
  methods.push(method)

  if (allowMethods.indexOf(method) == -1) {
    throw new Error(`Not supported method: ${method}`)
    }

  let [$match, $path, $query, $hash] = splitUrl.exec(request)

  if ($path.indexOf('*') !== -1) {
    config.path.push($path)
    }

  if (!config[method].hasOwnProperty($path)) {
    config[method][$path] = {}
  }

  let _pathConfig = config[method][$path]
  if (!$query) { // 没有query参数
    _pathConfig.default = value
  } else {
    let query = utils.parseQuery($query)
    let key = Object.keys(query).sort().join('&')

    if (!_pathConfig[key]) {
      _pathConfig[key] = {}
}

    _pathConfig[key][$query] = value
  }
}
/**
 * 处理请求
 * @param {Object} ctx - 请求上下文
 * @param {Array} config - 请求方式的配置
 * @param {String} dataFile - 数据文件路径
 * @param {Array} paths - 含*的path
 */
function handle(ctx, config, dataFile, paths) {
  let _path = ctx.path,
    _query = ctx.query,
    rule
  
  if (config[_path]) { // 精确匹配path
    rule = config[_path]
  } else { // 模糊匹配path（*/**）
    let target = _path.split('/').filter(p => p !== '')
    for (let i = 0; i < paths.length; i++) {
      let source = paths[i].split('/').filter(p => p !== '')
      if (utils.matchPath(source, target)) {
        rule = config[paths[i]]
        break
      }
    }
  }
  
  if (!rule) { // 没找到path对应的配置
    return ctx.status = 404
  }

  let params = Object.keys(_query)

  if (params.length == 0) { // 没有查询参数，用default
    if (!rule.default) {
      return ctx.status = 404
    }

    return ctx.body = dataFile
      ? utils.readFile(ctx, resolve(dataFile, rule.default))
      : JSON.parse(rule.default)
  } else { // 带查询参数
    let key = Object.keys(_query).sort().join('&')

    if (!rule[key]) {
      return ctx.status = 404
    }
    
    let _querys = Object.keys(rule[key])
    for (let i = 0; i < _querys.length; i++) {
      const source = utils.parseQuery(_querys[i])
      // 判断请求的参数与配置参数是否匹配
      if (utils.matchObject(ctx.query, source)) {
        return ctx.body = dataFile
          ? utils.readFile(ctx, resolve(dataFile, rule[key][_querys[i]]))
          : JSON.parse(rule[key][_querys[i]])
      }
    }
  }
}

/**
 * 构建Router
 * @param {String} dataFile - 数据文件路径
 * @param {Object} api - API 配置
 */
module.exports = ({ dataFile, api }) => {
  const router = new Router()

  const config = { // 路由配置
    get: {},
    put: {},
    post: {},
    patch: {},
    delete: {},
    del: {},
    path: [] // 含*的path
  }

  let methods = []
  // 解析配置文件
  for (const key in api) {
    if (api.hasOwnProperty(key)) {
      parseConfig(config, methods, key, api[key])
    }
  }

  config.path = [...new Set(config.path)]

  // 注册路由
  ;[...new Set(methods)].forEach(method => {
    router[method]('*', ctx => {
      handle(ctx, config[method], dataFile, config.path)
    })
  })

  return compose([
    router.routes(),
    router.allowedMethods()
  ])
}
