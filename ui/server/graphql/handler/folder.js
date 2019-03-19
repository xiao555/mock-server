const fs = require('fs')
const path = require('path')
const cwd = require('./cwd')
const { isMockConfig } = require('./file')

const isDirectory = file => {
  if (!fs.existsSync(file)) return false
  try {
    return fs.statSync(file).isDirectory()
  } catch (error) {
    return false
  }
}

const generateFolder = file => {
  return {
    name: path.basename(file),
    path: file
  }
}

const listChildren = file => {
  const files = fs.readdirSync(file, 'utf8')
  return files
    .map(file => {
      const fullPath = path.join(cwd.get(), file)
      return {
        path: fullPath,
        name: file
      }
    })
    .filter(file => isDirectory(file.path) || isMockConfig(file.path))
}

const getCurrent = () => {
  const base = cwd.get()
  return generateFolder(base)
}

const open = file => {
  cwd.set(file)
  return generateFolder(cwd.get())
}

const openParent = file => {
  const newFile = path.dirname(file)
  cwd.set(newFile)
  return generateFolder(cwd.get())
}

module.exports = {
  isDirectory,
  listChildren,
  getCurrent,
  open,
  openParent
}
