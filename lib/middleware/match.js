const chalk = require('chalk')
const utils = require('../utils')

/**
 * 匹配API配置，获取数据
 *
 * @param {object} config - API配置
 * @param {string} method - 请求方法
 * @param {string} url - 请求url
 * @param {string} path - 请求path
 * @param {string} query - 请求query
 * @returns - 数据文件路径或JSON字符串
 */
module.exports = (config, method, url, path, query) => {
  if (!config) return null
  // 当前请求方法对应的配置
  let curMethodConf = config[method]
  // 当前请求路径对应的配置 精确匹配
  let curPathConf = curMethodConf[path]
  // 没有命中精确匹配，从config.fuzzyMatchPath里找模糊匹配
  if (!curPathConf) {
    let pathArr = path.split('/').filter(p => p !== '')
    let matchPath = config.fuzzyMatchPath.find(p => utils.matchPath(
      p.split('/').filter(item => item !== ''),
      pathArr
    ))
    if (matchPath) {
      curPathConf = curMethodConf[matchPath]
    }
  }

  if (!curPathConf) {
    throw new MockServerError(`config not found with path: ${chalk.white(path)}`)
  }

  if (Object.keys(query).length === 0) {
    // 请求不带参数, 则当前请求路径对应的配置的default为当前请求匹配的数据
    if (curPathConf.default) {
      return curPathConf.default
    } else {
      throw new MockServerError(`config not found with path: ${chalk.white(path)}`)
    }
  } else {
    // 请求带参数，则找到匹配的匹配的参数配置
    let matchQuery = Object.keys(curPathConf).find(q => q !== 'default' && utils.matchObject(utils.parseQuery(q), query))

    if (!matchQuery) {
      throw new MockServerError(`config not found with query: ${chalk.white(url)}`)
    }

    return curPathConf[matchQuery]
  }
}