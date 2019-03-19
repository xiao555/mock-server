const fs = require('fs')
const path = require('path')

let cwd = process.cwd()

function normalize(value) {
  if (value.length === 1) return value
  const lastChar = value.charAt(value.length - 1)
  if (lastChar === path.sep) {
    value = value.substr(0, value.length - 1)
  }
  return value
}

module.exports = {
  get: () => cwd,
  set: path => {
    path = normalize(path)
    if (!fs.existsSync(path)) return
    cwd = path
    try {
      process.chdir(path)
    } catch (err) {}
  }
}
