const express = require('express')
const chalk = require('chalk')
const expressMockMiddleware = require('../middleware').expressMockMiddleware
const log = require('../utils/log')

class MockServer {
  constructor (options) {
    this.options = options || {}
    this.app = express()
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
   * @returns - express instance
   * @memberof MockServer
   */
  run () {
    // Application middleware
    this.app.use(expressMockMiddleware(this.options))

    let port = this.options.port || 8008
    this.app.listen(port, () => log.info(`${chalk.white(`server started on port ${port}`)}`))
    return this.app
  }
}

module.exports = MockServer
