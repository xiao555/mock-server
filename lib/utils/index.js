/** 
 * The fs.watch API is not 100% consistent across platforms, and is unavailable in some situations.
 * The recursive option is only supported on macOS and Windows.
 * https://nodejs.org/api/fs.html#fs_caveats
 */
const watchFile = require('node-watch')
const chalk = require('chalk')
const exists = require('fs').existsSync
const glob = require('glob')
const statSync = require('fs').statSync
const readdirSync = require('fs').readdirSync
const path = require('path')
const join = path.join
const lstatSync = require('fs').lstatSync
const readFileSync = require('fs').readFileSync
const $crlf = require('crlf-normalize')
const MockServerError = require('./error')

/**
 * Ignored directories.
 */
const ignore = ['node_modules', '.git'];

/**
 * Ignored files.
 * 
 * @param {string} path
 * @return {boolean}
 */
function ignored (path) {
  return !~ignore.indexOf(path);
}

/**
 * Returns the data type of the specified variable
 * 
 * @param  {any} data
 * @return {string}
 */
function getType (data) {
  return Object.prototype.toString.call(data).slice(8, -1);
}

/**
 * 判断请求的参数数组是否匹配配置的参数数组
 * 若配置的参数数组存在统配符，则返回true，否则遍历请求的参数数组，判断配置的参数数组是否包含每一项
 * 
 * @param  {array} source - 配置的参数数组
 * @param  {array} target - 请求的参数数组
 * @return {boolean}
 */
function matchArray (source, target) {
  if (source.includes('*')) return true
  for (let i = target.length - 1; i >= 0; i--) {
    if (!source.includes(target[i])) {
      return false
    }
  }
  return true
}

/**
 * 判断请求的参数对象是否匹配配置的参数对象
 * 遍历配置的请求对象属性，如果是Object，则再对两个对象该属性进行matchObject, 如果是数组, 则进行matchArray,
 * 如果是其他类型则分三种匹配情况，两个值相等, 配置对象该属性是通配符‘*’, 配置对象该属性是正则表达式
 * 
 * @param  {object} source - 配置的参数对象
 * @param  {object} target - 请求的参数对象
 * @return {boolean}
 */
function matchObject (source, target) {
  for (let key in source){
    let type = getType(source[key])
    if (type === "Object") {
      if (getType(target[key]) !== "Object") return false
      if (!matchObject(source[key], target[key])) {
        return false
      }
    } else if (type === "Array") {
      if (getType(target[key]) !== "Array") return false
      if (!matchArray(source[key], target[key])) {
        return false
      }
    } else {
      if (source[key] == target[key] || (source[key] === '*' && target.hasOwnProperty(key))) {
        continue
      } else if (/\/.*\//.test(source[key])) {
        let reg
        source[key].replace(/^\/(.*)\/$/, (match, p1) => {
          reg = new RegExp(p1)
        })
        if (!reg.test(target[key])) return false
      } else {
        return false
      }
    }
  }
  return true
}

/**
 * 判断请求的路径是否匹配配置的路径
 * 
 * @param {array} confPathArr - 配置的路径每一项组成的数组
 * @param {array} reqPathArr - 请求的路径每一项组成的数组
 */
function matchPath (confPathArr, reqPathArr) {
  let i = confPathArr.length - 1, j = reqPathArr.length - 1
  
  while (i >= 0 && j >= 0) {
    let curToMatch = confPathArr[i]
    if (curToMatch == '*') {
      i--, j--
    } else if (curToMatch == '**') {
      let nextToMatch = confPathArr[--i]
      while (reqPathArr[j] != nextToMatch && j >= 0) --j
    } else {
      if (reqPathArr[j] === curToMatch) i--, j--
      else return false
    }
  }
  
  return i == -1 && j == -1
}

/**
 * Watch the given `files` for changes
 * and invoke `fn(file)` on modification.
 * 
 * @param {array} files
 * @param {function} fn
 */
function watch (files, fn) {
  files.forEach(function (file) {
    let watcher = watchFile(file, { recursive: true })
    watcher.on('change', (evt, name) => {
      fn(file, watcher)
    })
    watcher.on('error', (err) => {throw new MockServerError(err)})
  })
}

/**
 * 获取完整的文件路径
 * 
 * @param {string} path 基础的文件路径
 * @param {array} exts 支持的扩展名
 * @return {string} 完整的文件路径
 */
function getFullPathOfFile (path, exts = []) {
  let files = [];
  if (!exists(path)) {
    const matchExt = exts.find(ext => exists(`${path}${ext}`))
    if (matchExt) {
      path += matchExt
    } else {
      files = glob.sync(path); // support '/**/*'
      if (!files.length) {
        throw new MockServerError(`cannot resolve path (or pattern): ${chalk.white(path)}`);
      }
      path = files[0]
    }
  }

  let stat = statSync(path)
  if (stat.isFile()) {
    return path
  }
  if (stat.isDirectory()) {
    return getFullPathOfFile(join(path, 'index'), exts)
  }
};

/**
 * Lookup files in the given `dir`.
 * 
 * @param {string} dir
 * @param {string[]} [ext=['.js']]
 * @param {array} [ret=[]]
 * @return {array}
 */
function files (dir, ext, ret) {
  ret = ret || [];
  ext = ext || ['js']

  var re = new RegExp(`\\.${ext.length ? ext.join('|') : '.*'}$`)

  readdirSync(dir)
    .filter(ignored)
    .forEach(function (path) {
      path = join(dir, path);
      if (lstatSync(path).isDirectory()) {
        files(path, ext, ret)
      } else if (path.match(re)) {
        ret.push(path);
      }
    });

  return ret;
};

/**
 * 解析请求参数，返回Map
 * 
 * @param {string} query - 请求参数
 * @param {object} - {
 *   param1: value1,
 *   param2: value2,
 * }
 */
function parseQuery (query) {
  query = query.split('?')[1] || query
  return query.split('&').reduce((obj, param) => {
    let [key, value] = param.split('=')
    if (obj.hasOwnProperty(key)) {
      if (Array.isArray(obj[key])) {
        obj[key].push(value)
      } else {
        obj[key] = [obj[key], value]
      }
    } else {
      obj[key] = value
    }
    return obj
  }, {})
}

/**
 * 读取文件
 * 
 * @param {string} file - 文件路径
 * @returns {object} {
 *   header: {},
 *   body: Response Data,
 * }
 */
function readFile (file) {
  file = getFullPathOfFile(file, ['.json', '.js', '.txt'])

  let ext = path.extname(file)
  let content = readFileSync(file, 'utf-8')
  switch (ext) {
    case '.json':
      return {
        header: {},
        body: JSON.parse(content)
      }
    case '.txt':
      let [header, body] = $crlf.crlf(content, $crlf.LF).split('\n\n')
      return {
        header: header.split('\n').reduce((obj, item) => {
          if (!item.includes(': ')) return obj
          let [key, value] = item.split(': ')
          obj[key] = value
          return obj
        }, {}),
        body: JSON.parse(body)
      }
    case '.js':
      delete require.cache[file] // TODO NEED DELETE CACHE?
      return require(file)
    default:
      return content
  }
}

module.exports = {
  matchObject,
  matchPath,
  watch,
  getFullPathOfFile,
  files,
  parseQuery,
  readFile
}