const fs = require('fs')
const path = require('path')

const isMockConfig = file => {
  if (!fs.existsSync(file) || path.extname(file) !== '.js') return false
  const config = require(file)
  return !!config.api
}

const getFileContent = file => {
  if (!fs.existsSync(file)) return null
  return require(file)
}

module.exports = {
  isMockConfig,
  getFileContent
}
