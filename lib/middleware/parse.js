const chalk = require('chalk')
const utils = require('../utils')
const URL_REG = /([^\?]*)(\?[^#]*)?(\#.*)?/ // 分割url的正则 exec: [match, path, query, hash]
const ALLOW_METHODS = ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'] // 支持的请求方法

/**
 * 解析配置项
 * config：{
 *   get: {
 *     ${path1}: {  // 请求路径
 *       default: ${value}, // 没有查询参数
 *       ${SortedQueryKeyJoinedBy&}: { // 查询字段排序后用拼接
 *         ${Query1}: ${value1}, // 配置项的query部分(带?)
 *         ${Query2}: ${value2},
 *         ...
 *       }
 *     },
 *     ${path2}: {...}
 *   },
 *   post: {...},
 *   ...,
 *   path: ['/users/`*`/', '/api/`**`/id/'] // 模糊匹配的路径, 便于匹配定位path
 * }
 * @param {object} config - 存储配置解析结果
 * @param {string} key - `${METHOD} ${PATH}`
 * @param {string} value - json string or file path
 */
const parseConfig = (config, key, value) => {
  let [method, path] = key.trim().split(' ') // ['GET', '/api/users/all']

  if (!method || !path) {
    throw new Error(`wrong format: ${chalk.white(key)}, expect '{METHOD} {PATH}'`)
  }

  method = method.toUpperCase()

  if (!ALLOW_METHODS.includes(method)) {
    throw new Error(`not supported method ${chalk.white(method)} in ${chalk.white(key)}`)
  }

  let [$match, $path, $query, $hash] = URL_REG.exec(path)

  if ($path.indexOf('*') !== -1) { // 模糊匹配的路径加到path里
    config.path.push($path)
  }

  if (!config[method][$path]) {
    config[method][$path] = {}
  }

  let curPathConf = config[method][$path]

  if (!$query) { // 没有query参数
    curPathConf.default = value
  } else {
    let query = utils.parseQuery($query)
    let paramSortStr = Object.keys(query).sort().join('&')

    if (!curPathConf[paramSortStr]) {
      curPathConf[paramSortStr] = {}
    }

    curPathConf[paramSortStr][$query] = value
  }
}

module.exports = (conf) => {
  const config = { // 路由配置
    GET: {},
    PUT: {},
    POST: {},
    PATCH: {},
    DELETE: {},
    path: [] // 模糊匹配的路径
  }

  // 解析配置文件
  for (const key in conf) {
    parseConfig(config, key, conf[key])
  }

  config.path = [...new Set(config.path)]

  return config
}