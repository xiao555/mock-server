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

var ignore = ['node_modules', '.git'];

/**
 * Ignored files.
 *
 * @api private
 * @param {string} path
 * @return {boolean}
 */
function ignored (path) {
  return !~ignore.indexOf(path);
}

/**
 * Determine whether the two objects match
 *   Judge the total number of attributes, not equal return false
 *   Traverse each property in the source to determine whether the target has the same attributes
 *      If it does not exist, return false
 *      If it exists, determine the type of value
 *        If the value is an object, call 'matchObject' to determine if it matches
 *        If the value is an array, call 'matchArray' to determine if it matches
 *        If it is other, directly determine whether the same by '=='
 * @param  {[type]} source - config object
 * @param  {[type]} target - request object
 * @return {[type]}
 */
exports.matchObject = function matchObject (source, target) {
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
    } else if (source[key] != target[key] && source[key] != '*') {
      
        let match = false  
        if (/\/.*\//.test(source[key])) {
          let reg
          source[key].replace(/^\/(.*)\/$/, (match, p1) => {
            reg = new RegExp(p1)
          })
          if (reg.test(target[key])) match = true
        }
        if (!match) return false
    };
  }
  return true
}

/**
 * Determine whether the two arrays match
 * Traverse the source array of each item to determine the target array exists.
 *
 * @param  {[type]} source - config array
 * @param  {[type]} target - request array
 * @return {[type]}
 */
function matchArray (source, target) {
  for (let i = target.length - 1; i >= 0; i--) {
    if (source.indexOf(target[i]) == -1 && source.indexOf('*') == -1) {
      return false
    }
  }
  return true
}

/**
 * Determine whether the two path match
 * @param {Array} confPath - config path array
 * @param {Array} reqPath - request path array
 */
exports.matchPath = function matchPath (confPath, reqPath) {
  let i = confPath.length - 1,
    j = reqPath.length - 1
  
  while (i >= 0 && j >= 0) {
    let curToMatch = confPath[i]
    if (curToMatch == '*') {
      i--, j--
    } else if (curToMatch == '**') {
      let nextToMatch = confPath[--i]
      while (reqPath[j] != nextToMatch && j >= 0) --j
    } else {
      if (reqPath[j] === curToMatch) i--, j--
      else return false
    }
  }
  
  return i == -1 && j == -1
}

/**
 * Returns the data type of the specified variable.
 *
 * @param  {Any} data
 * @return {string}
 */
function getType (data) {
  return Object.prototype.toString.call(data).slice(8, -1);
}

/**
 * Watch the given `files` for changes
 * and invoke `fn(file)` on modification.
 *
 * @api private
 * @param {Array} files
 * @param {Function} fn
 */
exports.watch =  function (files, fn) {
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
 * @param {string} path 基础的文件路径
 * @param {array} exts 支持的扩展名
 * @return {string} 完整的文件路径
 */
exports.getFullPathOfFile = function getFullPathOfFile(path, exts = []) {
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
 * @api private
 * @param {string} dir
 * @param {string[]} [ext=['.js']]
 * @param {Array} [ret=[]]
 * @return {Array}
 */
exports.files = function (dir, ext, ret) {
  ret = ret || [];
  ext = ext || ['js']

  var re = new RegExp(`\\.${ext.length ? ext.join('|') : '.*'}$`)

  readdirSync(dir)
    .filter(ignored)
    .forEach(function (path) {
      path = join(dir, path);
      if (lstatSync(path).isDirectory()) {
        exports.files(path, ext, ret)
      } else if (path.match(re)) {
        ret.push(path);
      }
    });

  return ret;
};

/**
 * 解析请求参数，返回Map
 * @param {string} query - 请求参数
 * @param {object} - {
 *   param1: value1,
 *   param2: value2,
 * }
 */
exports.parseQuery = function parseQuery(query) {
  query = query.split('?')[1] || query
  return query.split('&').reduce((obj, param) => {
    let [key, value] = param.split('=')
    obj[key] = value
    return obj
  }, {})
}

/**
 * 读取文件
 * @param {string} file - 文件路径
 * @returns {object} {
 *   header: {},
 *   body: Response Data,
 * }
 */
exports.readFile = function readFile(file) {
  file = exports.getFullPathOfFile(file, ['.json', '.js', '.txt'])

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