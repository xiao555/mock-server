const chalk = require('chalk')

const URL_REG = /([^\?]*)(\?[^#]*)?(\#.*)?/ // 分割url的正则 exec: [match, path, query, hash]

/**
 * 解析配置项
 *
 * @param {object} config - 存储配置解析结果
 * @param {string} key - `${METHOD} ${URL}`
 * @param {string} value - json string or file path
 */
const parseConfig = (config, key, value) => {
  let [method, url] = key.trim().split(' ') // ['GET', '/api/users/all']

  if (!method || !url) {
    throw new MockServerError(`wrong format: ${chalk.white(key)}, expect '{METHOD} {URL}'`)
  }

  method = method.toUpperCase()

  if (!ALLOW_METHODS.includes(method)) {
    throw new MockServerError(`not supported method ${chalk.white(method)} in ${chalk.white(key)}`)
  }

  let [$match, $path, $query, $hash] = URL_REG.exec(url)

  $path = encodeURI($path)

  if ($path.indexOf('*') !== -1) { // 模糊匹配的路径加到fuzzyMatchPath里
    config.fuzzyMatchPath.push($path)
  }

  if (!config[method][$path]) {
    config[method][$path] = {}
  }

  let curPathConf = config[method][$path]

  if (!$query) { // 没有query参数
    curPathConf.default = value
  } else {
    curPathConf[$query] = value
  }
}

/**
 * 解析配置文件
 *
 * @param {object} conf - api配置
 * @returns
 * {
 *   ${ METHOD }: {
 *     ${ PATH }: {
 *       default: ${ value }, // 没有查询参数
 *       ${ QUERY }: ${ value }, // 有查询参数(带?)
 *     },
 *   },
 *   fuzzyMatchPath: ['/users/`*`/', '/api/`**`/id/'] // 模糊匹配的路径, 便于匹配定位path
 * }
 */
module.exports = (conf) => {
  const config = {
    GET: {},
    PUT: {},
    POST: {},
    PATCH: {},
    DELETE: {},
    fuzzyMatchPath: [] // 模糊匹配的路径
  }

  for (const key in conf) {
    parseConfig(config, key, conf[key])
  }

  config.fuzzyMatchPath = [...new Set(config.fuzzyMatchPath)]

  return config
}