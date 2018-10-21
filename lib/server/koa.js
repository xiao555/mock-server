const Koa = require('koa')
const chalk = require('chalk')
const koaMockMiddleware = require('../middleware').koaMockMiddleware
const cors = require('@koa/cors')
const log = require('../utils/log')

class MockServer {
  constructor (options) {
    this.options = options || {}
    this.app = new Koa()
  }

  /**
   * Set custom port
   *
   * @param {number} port - custom port
   * @memberof MockServer
   */
  setPort (port) {
    if (port > 65535 || port < 5000) {
      throw new Error(`Invalid Port: ${port}`)
    }
    this.options.port = port
  }

  /**
   * Set custom config
   *
   * @param {object|string} config - custom config object or file path
   * @memberof MockServer
   */
  setConfig (config) {
    this.options.config = config
  }

  /**
   * Start node server
   *
   * @returns - Koa instance
   * @memberof MockServer
   */
  run () {
    // Timer
    this.app.use(async (ctx, next) => {
      const start = new Date()
      await next()
      const ms = new Date() - start
      const message = `${ctx.method} ${decodeURIComponent(ctx.url)} ${ctx.status} - ${ms}ms`
      ctx.status === 200 && log.info(`${chalk.white(message)}`)
    })

    // Application middleware
    this.app.use(cors())
    this.app.use(koaMockMiddleware(this.options))

    let port = this.options.port || 8008
    this.app.listen(port, () => log.info(`${chalk.white(`server started on port ${port}`)}`))
    return this.app
  }
}

module.exports = MockServer
