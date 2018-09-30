const chalk = require('chalk')

module.exports = {
  error: (message) => {
    console.log(`${chalk.red(`[MOCK] ${message}`)}`)
  },
  info: (message) => {
    console.log(`${chalk.green(`[MOCK] ${message}`)}`)
  },
  warning: (message) => {
    console.log(`${chalk.yellow(`[MOCK] ${message}`)}`)
  }
}