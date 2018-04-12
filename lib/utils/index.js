const watchFile = require('fs').watchFile
const debug = require('debug')('mock:watch')
const exists = require('fs').existsSync
const glob = require('glob')
const statSync = require('fs').statSync
const readdirSync = require('fs').readdirSync
const path = require('path')
const join = path.join
const lstatSync = require('fs').lstatSync
const readFileSync = require('fs').readFileSync
const $crlf = require('crlf-normalize')

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
 * @param  {[type]} source - request object
 * @param  {[type]} target - config object
 * @return {[type]}
 */
exports.matchObject = function matchObject (source, target) {
  for (let key in source){
    let type = getType(source[key])
    if (type === "Object") {
      if (getType(target[key]) !== "Object") return false
      if (!matchObject(source[key], target[key])) {
          return false
      };
    } else if (type === "Array") {
      if (getType(target[key]) !== "Array") return false
      if (!matchArray(source[key], target[key])) {
          return false
      };
    } else if (source[key] != target[key] && target[key] != '*') {
        let match = false  
        if (/\/.*\//.test(target[key])) {
          let reg
          target[key].replace(/^\/(.*)\/$/, (match, p1) => {
            reg = new RegExp(p1)
          })
          if (reg.test(source[key])) match = true
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
 * @param  {[type]} source - request array
 * @param  {[type]} target - config array
 * @return {[type]}
 */
function matchArray (source, target) {
  for (let i = source.length - 1; i >= 0; i--) {
    if (target.indexOf(source[i]) == -1 && target.indexOf('*') == -1) {
      return false
    }
  }
  return true
}

/**
 * Determine whether the two path match
 * @param {Array} source - config path array
 * @param {Array} target - request path array
 */
exports.matchPath = function matchPath (source, target) {
  let i = source.length - 1,
      j = target.length - 1
  
  while (i >= 0 && j >= 0) {
    let temp = source[i]
    if (temp == '*') {
      i--, j--
    } else if (temp == '**') {
      let to = source[--i]
      while (target[j] != to && j >= 0) --j
    } else {
      if (target[j] === temp) i--, j--
      else return false
    }
  }
  
  return i == -1 && j == -1
}

/**
 * Returns the data type of the specified variable.
 *
 * @param  {Any} data
 * @return {String}
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
  var options = { interval: 100 };
  files.forEach(function (file) {
    debug('file %s', file);
    watchFile(file, options, function (curr, prev) {
      if (prev.mtime < curr.mtime) {
        fn(file);
      }
    });
  });
};

/**
 * Complete file name.
 *
 * @api public
 * @param {string} path Base path to start searching from.
 * @return {string} An string of fullname.
 */
exports.completeFiles =  function completeFiles (path) {
  let files = [];
  if (!exists(path)) {
    if (exists(path + '.js')) {
      path += '.js';
    } else if (exists(path + '.json')) {
      path += '.json'
    } else {
      files = glob.sync(path); // support '/**/*'
      if (!files.length) {
        throw new Error("cannot resolve path (or pattern) '" + path + "'");
      }
      return files[0]
    }
  }

  let stat = statSync(path)
  if (stat.isFile()) {
    return path
  }
  if (stat.isDirectory()) {
    return completeFiles(join(path, 'index'))
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
 * Read File content
 * @param {Object} ctx - context
 * @param {String} file - path of file
 */
exports.readFile = function (ctx, file) {
  if (!exists(file)) {
    if (exists(file + '.json')) {
      file += '.json';
    } else if (exists(file + '.txt')) {
      file += '.txt'
    } else if (exists(file + '.js')) {
      file += '.js'
    } else {
      throw new Error("cannot resolve path (or pattern) '" + file + "'")
    }
  }
  let ext = path.extname(file)
  switch (ext) {
    case '.json': 
      return JSON.parse(readFileSync(file, 'utf-8'))
    case '.txt':
      let content = readFileSync(file, 'utf-8')
      content = $crlf.crlf(content, $crlf.LF).split('\n\n') // 兼容CRLF
      content[0].split('\n').forEach(options => {
        if (options.indexOf('HTTP') !== -1) return
        let items = options.split(': ')
        ctx.set(items[0], items[1])
      })
      return JSON.parse(content[1])
    case '.js':
      let data = require(file)
      delete require.cache[file]
      return JSON.parse(JSON.stringify(data))
    default:
      return null
  }
}

/**
 * 解析请求参数，返回Map
 * {
 *   param1: value1,
 *   param2: value2,
 * }
 * @param {String} query - 请求参数
 */
exports.parseQuery = function parseQuery(query) {
  query = query.split('?')[1] || query
  return query.split('&').reduce((obj, param) => {
    let [key, value] = param.split('=')
    obj[key] = value
    return obj
  }, {})
}