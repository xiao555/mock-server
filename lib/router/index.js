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
 *    1. find pathRule - 对应路径的配置
 *    2. find queryRule - 对应查询参数的配置
 *    3. find data - 命中规则对应的data(数据文件路径 or json string)
 *    4. 解析文件或json string并返回
 * @param {Object} ctx - 请求上下文
 * @param {Array} config - 请求方式的配置
 * @param {String} dataFile - 数据文件路径
 * @param {Array} patternPaths - 含*的path
 */
function handle(ctx, config, dataFile, patternPaths) {
  let _path = ctx.path
  let pathRule
  
  if (config[_path]) { // 精确匹配path
    pathRule = config[_path]
  } else { // 模糊匹配path（*/**）
    let target = _path.split('/').filter(p => p !== '')
    for (let i = 0; i < patternPaths.length; i++) {
      let source = patternPaths[i].split('/').filter(p => p !== '')
      if (utils.matchPath(source, target)) {
        pathRule = config[patternPaths[i]]
        break
      }
    }
  }
  
  if (!pathRule) { // 没找到path对应的配置
    return ctx.status = 404
  }

  let queryParams = Object.keys(ctx.query)
  let queryRule
  let data

  if (!queryParams.length && pathRule.default) { // 没有查询参数且有default
    queryRule = 'default'
    data = pathRule.default
  } else {
    // 带查询参数
    let _query = Object.keys(ctx.query).sort().join('&')

    if (pathRule[_query]) { // 查询字段命中精确匹配
      queryRule = pathRule[_query]
    } else {
      let queryFields = Object.keys(pathRule) // 当前path配置中所有的参数配置
      for (let i = 0; i < queryFields.length; i++) {
        const queryFieldArr = queryFields[i].split('&')
        if (!queryFieldArr.filter(param => queryParams.indexOf(param) === -1).length) { // 当前配置参数包含于请求的参数中，命中
          queryRule = pathRule[queryFields[i]]
          break
        }
      }
    }

    let querys = Object.keys(queryRule)
    
    for (let i = 0; i < querys.length; i++) {
      const source = utils.parseQuery(querys[i])
      // 判断请求的参数与配置参数是否匹配
      if (utils.matchObject(source, ctx.query)) {
        data = queryRule[querys[i]]
        break
      }
    }
  }
  
  if (!data) {
    return ctx.status = 404
  }

  return ctx.body = dataFile
    ? utils.readFile(ctx, resolve(dataFile, data))
    : JSON.parse(data)
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
