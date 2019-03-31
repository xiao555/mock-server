const path = require('path')
const fs = require('fs-extra')
const mockOpts = require('../../config')
const cwd = require('./cwd')
const { isHidden } = require('./utils')

const isDirectory = file => {
  if (!fs.existsSync(file)) return false
  try {
    return fs.statSync(file).isDirectory()
  } catch (error) {
    return false
  }
}

const isPackage = file => {
  try {
    return fs.existsSync(path.join(file, 'package.json'))
  } catch (e) {
    console.warn(e.message)
  }
  return false
}

const readPackage = file => {
  const pkgFile = path.join(file, 'package.json')
  if (fs.existsSync(pkgFile)) {
    const pkg = fs.readJsonSync(pkgFile)
    return pkg
  }
  return {}
}

const isMockConfig = file => {
  if (!isPackage(file)) return false

  try {
    const pkg = readPackage(file)
    return Object.keys(pkg.devDependencies || {}).includes('cf-mock-server')
  } catch (err) {}
}

const generateFolder = file => {
  return {
    name: path.basename(file),
    path: file
  }
}

const listChildren = file => {
  const files = fs.readdirSync(file, 'utf8')
  return files.map(file => {
    const fullPath = path.join(cwd.get(), file)
    return {
      path: fullPath,
      name: file,
      hidden: isHidden(fullPath),
      isDirectory: isDirectory(fullPath),
      isMockConfig: isMockConfig(fullPath)
    }
  })
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

const getMockConfig = folder => {
  mockOpts.set({
    config: folder
  })
  const { api, dataFilePath } = mockOpts.get()
  const res = []
  for (const key in api) {
    if (api.hasOwnProperty(key)) {
      const value = api[key]
      const isCustomFunc = typeof value === 'function'
      const [method, url] = key.split(' ')
      res.push({
        method,
        url,
        expectData: isCustomFunc
          ? value.toString()
          : JSON.stringify(require(path.join(dataFilePath, value))),
        isCustomFunc
      })
    }
  }
  return res
}

module.exports = {
  isDirectory,
  listChildren,
  getCurrent,
  open,
  openParent,
  getMockConfig
}
