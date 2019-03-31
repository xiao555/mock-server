const path = require('path')

const hiddenPrefix = '.'

const isHidden = file => {
  return path.basename(file).charAt(0) === hiddenPrefix
}

module.exports = {
  isHidden
}
