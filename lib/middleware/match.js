const chalk = require('chalk')
const utils = require('../utils')

module.exports = (config, reqMethod, reqUrl, reqPath, reqQuery) => {
  let curPathRule // 当前路径对应的规则
  let curMethodRule = config[reqMethod]
  
  if (curMethodRule[reqPath]) { // 精确匹配
    curPathRule = curMethodRule[reqPath]
  } else { // 模糊匹配
    let reqPathArr = reqPath.split('/').filter(p => p !== '')
    let matchPath = config.path.find(p => {
      let confPathArr = p.split('/').filter(item => item !== '')
      return utils.matchPath(confPathArr, reqPathArr)
    })
    matchPath && (curPathRule = curMethodRule[matchPath])
  }

  if (!curPathRule) {
    throw new MockServerError(`config not found with path: ${chalk.white(reqPath)}`)
  }

  const reqQueryKeys = Object.keys(reqQuery)
  let curQueryRule
  let value

  if (reqQueryKeys.length === 0) {
    if (curPathRule.default) {
      value = curQueryRule = curPathRule.default
    } else {
      throw new MockServerError(`config not found with path: ${chalk.white(reqPath)}`)
    }
  } else {
    let reqQuerySortStr = reqQueryKeys.sort().join('&')
    let matchQueryRule; // 匹配的请求规则
    if (curPathRule[reqQuerySortStr]) { // 精确匹配
      curQueryRule = curPathRule[reqQuerySortStr]
    } else {
      // 找到所有请求参数包含于当前请求参数的QueryKeys
      let matchQuerysKeys = Object.keys(curPathRule).filter(q => {
        // 如果不包括某一个请求参数，返回false
        return reqQueryKeys.some(key => !q.includes(key))
      })
      
      // 从这些Keys中找到含有符合请求参数的Query配置的Key
      matchQueryKey = matchQuerysKeys.find(matchQuery => {
        // 从请求规则中找到匹配的
        matchQueryRule = Object.keys(curPathRule[matchQuery]).find(q => utils.matchObject(utils.parseQuery(q), reqQuery))
        return !!matchQueryRule
      })
      
      // 如果有符合规则的key, 当前请求规则为该Key的配置
      if (matchQueryKey) {
        curQueryRule = curPathRule[matchQueryKey]
      }
    }
    if (!curQueryRule) {
      throw new MockServerError(`config not found with query: ${chalk.white(reqUrl)}`)
    }
    
    if (!matchQueryRule) {
      matchQueryRule = Object.keys(curQueryRule).find(q => utils.matchObject(utils.parseQuery(q), reqQuery))
    }
    
    value = curQueryRule[matchQueryRule]
  }

  return value
}