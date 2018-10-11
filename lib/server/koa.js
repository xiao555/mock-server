const Koa = require('koa')
const chalk = require('chalk')
const koaMockMiddleware = require('../middleware').koaMockMiddleware
const cors = require('@koa/cors')
const log = require('../utils/log')

/**
 * Expose `Mock`.
 */

module.exports = Mock;

/**
 * Set up Mock
 */
function Mock (options) {
  options = options || {}
  this.options = options
  this.app = new Koa()
}

/**
 * Set custom port
 */
Mock.prototype.setPort = function (port) {
  if (port > 65535 || port < 5000) {
    throw new Error(`Invalid Port: ${port}`)
  }
  this.options.port = port
}

/**
 * Set custom config
 */
Mock.prototype.setConfig = function (path) {
  this.options.config = path
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
    ctx.status === 200 && log.info(`${chalk.white(message)}`);
  });

  // Application middleware
  this.app.use(cors())
  this.app.use(koaMockMiddleware(this.options))

  let port = this.options.port || 8008
  this.app.listen(port, () => log.info(`${chalk.white(`server started on port ${port}`)}`))
}

/**
 * Run main process
 */
Mock.prototype.run = function () {
  if (this.options.port) {
    this.setPort(this.options.port)
  }
  this.startApp()
  return this.app
}
