const watchFile = require('fs').watchFile
const debug = require('debug')('mock:watch');
const exists = require('fs').existsSync;
const glob = require('glob');
const statSync = require('fs').statSync;
const readdirSync = require('fs').readdirSync;
const basename = require('path').basename;
const path = require('path');
const join = path.join;
const lstatSync = require('fs').lstatSync;

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
 * @param  {[type]} source - 源对象
 * @param  {[type]} target - 目标对象
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
        return false
    };
  }
  return true
}

/**
 * Determine whether the two arrays match
 * Traverse the source array of each item to determine the target array exists.
 *
 * @param  {[type]} source - 源数组
 * @param  {[type]} target - 目标数组
 * @return {[type]}
 */
exports.matchArray = function matchArray (source, target) {
  for (let i = source.length - 1; i >= 0; i--) {
    if (target.indexOf(source[i]) == -1) {
      return false
    }
  }
  return true
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
  var files = [];
  if (!exists(path)) {
    if (exists(path + '.js')) {
      path += '.js';
    } else if (exists(path + '.json')) {
      path += '.json'
    } else {
      files = glob.sync(path);
      if (!files.length) {
        throw new Error("cannot resolve path (or pattern) '" + path + "'");
      }
      return files[0];
    }
  }

  try {
    var stat = statSync(path);
    if (stat.isFile()) {
      return path;
    }
    if (stat.isDirectory()) {
      return completeFiles(join(path, 'index'))
    }
  } catch (err) {
    // ignore error
    return;
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
  ext = ext || ['js'];

  var re = new RegExp('\\.(' + ext.join('|') + ')$');

  readdirSync(dir)
    .filter(ignored)
    .forEach(function (path) {
      path = join(dir, path);
      if (lstatSync(path).isDirectory()) {
        exports.files(path, ext, ret);
      } else if (path.match(re)) {
        ret.push(path);
      }
    });

  return ret;
};
