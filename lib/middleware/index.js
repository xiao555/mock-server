const fs = require('fs')
const path = require('path')
const parse = require('./parse')
const match = require('./match')
const utils = require('../utils')
const log = require('../utils/log')
const MockServerError = require('../utils/error')

// Global Settings
global.MockServerError = MockServerError
global.ALLOW_METHODS = ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'] // 支持的请求方法

const isTest = process.env.NODE_ENV === 'test'

/**
 * 处理错误, 测试环境抛出
 *
 * @param {error} error - 错误
 */
const handleError = (error) => !isTest && log.error(`${error}`)

/**
 * 配置API, 获取数据文件路径，解析请求规则
 *
 * @param {string} options.confFile - 配置文件路径
 * @param {string} options.dataFilePath - 数据文件路径
 * @param {object} options.apiConf - API配置
 */
function handleConfig(options) {
  let config
  if (options.confFile) { // confFile已定义，直接获取文件内容
    try {
      if (path.extname(options.confFile) == 'json') {
        config = JSON.parse(fs.readFileSync(options.confFile, 'utf-8'))
      } else {
        config = require(options.confFile)
      }
    } catch (error) {
      handleError(`Config Parse Faild! ${error}, please fix it!`)
    }
  } else { // 如果配置是对象，直接读取
    config = options.config
  }
  if (config) {
    // 获取数据目录的绝对路径
    if (config.dataFile) {
      options.dataFilePath = path.resolve(path.dirname(options.confFile), config.dataFile)
    }
    options.apiConf = parse(config.api)
  }
}

/**
 * 初始化中间件
 *
 * @param {object} options
 */
function initMiddleware (options) {
  let confFile = typeof options.config === 'object'
    ? null
    : utils.getFullPathOfFile(options.config, ['.js', '.json'])

  Object.assign(options, {
    confFile, // mock配置文件路径
    dataFilePath: '', // 数据文件基础路径
    apiConf: null, // API配置
  })

  // 监听mock配置文件改动，热更新API配置
  options.confFile && utils.watch([options.confFile], (file) => {
    log.warning(`${file} changed!`)
    delete require.cache[file]
    handleConfig(options)
  })

  handleConfig(options)
}

// 测试环境暴露initMiddleware供测试使用
if (isTest) {
  exports.initMiddleware = initMiddleware
}

exports.expressMockMiddleware = (options) => {

  try {
    initMiddleware(options)
  } catch (error) {
    console.log('\n')
    handleError(error)
  }

  return async (req, res, next) => {
    if (res.headersSent || !ALLOW_METHODS.includes(req.method)) return next()
    try {
      let value = match(
        options.apiConf,
        req.method,
        req.originalUrl,
        req.path,
        req.query
      )

      if (!value) {
        return next()
      }

      if (typeof value === 'function') {
        let data = ''
        req.on('data', chunk => {
          data += chunk;
        })
        req.on('end',()=>{
          req.body = !!data ? JSON.parse(data) : {}
          value(req, res)
        })
        return
      }

      if (options.dataFilePath) {
        let { header, body } = utils.readFile(path.resolve(options.dataFilePath, value))
        res.set(header)
        res.status(200).send(body)
      } else {
        res.status(200).send(JSON.parse(value))
      }
      res.status = 200
    } catch (error) {
      handleError(error)
      next()
    }
  }
}

exports.koaMockMiddleware = (options) => {
  try {
    initMiddleware(options)
  } catch (error) {
    handleError(error)
  }

  const isResponsed = ctx => ctx.status !== 404 || ctx.body

  return async (ctx, next) => {
    if (isResponsed(ctx) || !ALLOW_METHODS.includes(ctx.method)) {
      return next()
    }
    try {
      let value = match(
        options.apiConf,
        ctx.method,
        ctx.originalUrl,
        ctx.path,
        ctx.query
      )

      if (!value) {
        await next()
        return
      }

      if (options.dataFilePath) {
        let { header, body } = utils.readFile(path.resolve(options.dataFilePath, value))
        ctx.set(header)
        ctx.body = body
      } else {
        ctx.body = JSON.parse(value)
      }
    } catch (error) {
      await next()
      if (!isResponsed(ctx) ) {
        handleError(error)
      }
    }
  }
}