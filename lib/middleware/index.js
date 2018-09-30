const fs = require('fs')
const path = require('path')
const parse = require('./parse')
const match = require('./match')
const utils = require('../utils')
const log = require('../utils/log')

const isTest = process.env.NODE_ENV === 'test'
/**
 * 处理错误, 测试环境抛出
 * @param {error} error - 错误
 * @param {string} stage - 发生的阶段
 */
const handleError = (error, stage) => {
  if (isTest) {
    throw error
  } else {
    log.error(`[${stage}] ${error}`)
  }
}

/**
 * 初始化中间件，获取数据文件路径，API配置
 * @param {object} options - 中间件选项
 * @param {string} confFile - 配置文件路径
 * @param {string} dataFilePath - 数据文件路径
 * @param {object} apiConf - API配置
 */
function initMiddleware(options) {
  let config
  if (options.confFile) { // confFile已定义，直接获取文件内容
    if (path.extname(options.confFile) == 'json') {
      config = JSON.parse(fs.readFileSync(options.confFile, 'utf-8'))
    } else {
      config = require(options.confFile)
    }
  } else { // 如果配置是对象，直接读取
    config = options.config
  }
  // 获取数据目录的绝对路径
  if (config.dataFile) {
    options.dataFilePath = path.resolve(path.dirname(options.confFile), config.dataFile)
  }
  options.apiConf = parse(config.api)
}

exports.expressMockMiddleware = (options) => {
  let confFile = typeof options.config === 'object'
    ? null
    : utils.getFullPathOfFile(options.config, ['.js', '.json'])
  try {
    Object.assign(options, {
      confFile, // mock配置文件路径
      dataFilePath: '', // 数据文件基础路径
      apiConf: null, // API配置
    })

    // 监听mock配置文件改动，热更新API配置
    options.confFile && utils.watch([options.confFile], (file) => {
      log.warning(`${file} changed!`)
      delete require.cache[file]
      initMiddleware(options)
    })

    initMiddleware(options)

  } catch (error) {
    handleError(error, 'INIT')
  }

  return async (req, res, next) => {
    try {
      let value = match(
        options.apiConf,
        req.method,
        req.originalUrl,
        req.path,
        req.query
      )

      if (options.dataFilePath) {
        let { header, body } = utils.readFile(path.resolve(options.dataFilePath, value))
        res.set(header)
        res.send(body)
      } else {
        res.send(JSON.parse(value))
      }
      res.status = 200
    } catch (error) {
      await next()
      if (res.status === 404) {
        handleError(error, 'RUNTIME')
      }
    }
  }
}

exports.koaMockMiddleware = (options) => {
  let confFile = typeof options.config === 'object'
    ? null
    : utils.getFullPathOfFile(options.config, ['.js', '.json'])
  try {
    Object.assign(options, {
      confFile, // mock配置文件路径
      dataFilePath: '', // 数据文件基础路径
      apiConf: null, // API配置
    })

    // 监听mock配置文件改动，热更新API配置
    options.confFile && utils.watch([options.confFile], (file) => {
      log.warning(`Config file changed!`)
      delete require.cache[file]
      initMiddleware(options)
    })
    
    initMiddleware(options)

  } catch (error) {
    handleError(error, 'INIT')
  }

  return async (ctx, next) => {
    try {
      let value = match(
        options.apiConf,
        ctx.method,
        ctx.originalUrl,
        ctx.path,
        ctx.query
      )

      if (options.dataFilePath) {
        let { header, body } = utils.readFile(path.resolve(options.dataFilePath, value))
        ctx.set(header)
        ctx.body = body
      } else {
        ctx.body = JSON.parse(value)
      }
    } catch (error) {
      await next()
      if (ctx.status === 404) {
        handleError(error, 'RUNTIME')
      }
    }
  }
}