const Koa = require('koa')
const router = require('./router')
const middleware = require('./middleware')
const fs = require('fs')
const path = require('path')
const utils = require('./utils')
const koaStatic = require('koa-static')
const log = require('./utils/log')


/**
 * Expose `Mock`.
 */

exports = module.exports = Mock;

/**
 * Expose internals.
 */

exports.utils = utils;

/**
 * Set up Mock
 */
function Mock (options) {
  options = options || {}
  this.file = '';
  this.options = options
  this.app = new Koa()
  this.config = {}
  this.router = null
}

/**
 * Set custom port
 */
Mock.prototype.setPort = function (port) {
  if (port > 65535 || port < 5000) {
    throw new Error('Invalid Port!')
  }
  this.options.port = port
}

/**
 * Get config object from file which ext is 'js' or 'json'
 */
Mock.prototype.getConfig = function () {
  // 直接传入配置的情况
  if (typeof this.options.config == 'object') return this.config = this.options.config
  // 传入配置文件路径，如果没有扩展名找到并完善路径
  this.file = this.file || this.options.config
  if (!path.extname(this.file)) {
    this.file = utils.completeFiles(this.file)
  }
  // 对json或js的配置文件处理不同
  if (path.extname(this.file) == 'json') {
    this.config = JSON.parse(fs.readFileSync(this.file, 'utf-8'))
  } else {
    this.config = require(this.file)
  }
  // 获取数据目录的绝对路径
  this.config.dataFile = path.resolve(path.dirname(this.file), this.config.dataFile)
  // 是否有静态文件配置
  this.config.staticFile && (this.options.static = path.resolve(path.dirname(this.file), this.config.staticFile))
}

/**
 * Create router function with config object
 */
Mock.prototype.createRouter = function () {
  this.router = router(this.config)
}

/**
 * Start server
 */
Mock.prototype.startApp = function () {

  // Collect request and response information
  this.app.use(async (ctx, next) => {
    const start = new Date();
    await next();
    const ms = new Date() - start;
    const message = `${ctx.method} ${decodeURIComponent(ctx.url)} ${ctx.status} - ${ms}ms`
    log[ctx.status == 200 ? 'info': 'warn'](message)
  });

  // Application middleware
  this.app.use(middleware())
  this.options.static && this.app.use(koaStatic(this.options.static))

  // Application router
  this.app.use(async (ctx, next) => {
    await this.router(ctx, next)
  })

  let port = this.options.port || 8008
  this.app.listen(port, () => log.info(`Server started on port ${port}`))
}

Mock.prototype.watchFile = function () {
  log.debug('>> Watch mode')
  utils.watch([this.file], () => {
    log.debug('File changed!')
    delete require.cache[this.file];
    this.rerun();
  });
}

/**
 * Application new config
 */
Mock.prototype.rerun = function () {
  this.getConfig()
  this.createRouter()
}

/**
 * Run main process
 */
Mock.prototype.run = function () {
  this.getConfig()
  this.createRouter()
  if (this.options.watch) {
    this.watchFile()
  }
  if (this.options.port) {
    this.setPort(this.options.port)
  }
  this.startApp()
  return this.app
}
