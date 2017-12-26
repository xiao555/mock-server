const log4js = require('log4js')
const path = require('path')

let date = new Date().toISOString().split('T')[0]

module.exports = _path => {
  log4js.configure({
    appenders: {
      default: { type: 'file', filename: path.join(_path, `${date}.log`)}
    },
    categories: { default: { appenders: ['default'], level: 'debug' } }
  })
  
  return log4js.getLogger('Mock')
}