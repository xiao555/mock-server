const allowMethods = ['get', 'put', 'post', 'patch', 'delete'] // 支持的请求方法

let methodRule = allowMethods.reduce((obj, method) => {
  obj[`${method.toUpperCase()} /test/methods/`] = `methods/${method}.json`
  return obj
}, {})

// 测试用例
let queryConfig = [
  { method: "GET", path: "/test/query/", query: { name: "tom", age: "18" }, file: 'query', type: 'tom-all' },
  { method: "GET", path: "/test/query/", query: { name: "tom" }, file: 'query', type: 'tom-name' },
  { method: "GET", path: "/test/query/", query: {}, file: 'query', type: 'no-query' },
], regExpConfig = [
  { method: "GET", path: "/test/regexp/", query: { name: "/^A.*\\^$/", age: "/^\\d+$/" }, file: 'regexp', type: 'user' },
  { method: "GET", path: "/test/regexp/", query: { name: "jerry", age: "/^\\d+$/" }, file: 'regexp', type: 'jerry' },
], RESTfulConfig = [
  { method: "GET", path: "/test/restful/api/user/tom", query: {}, file: 'restful', type: 'jack', testPath: ["/test/restful/api/user/tom"] },
  { method: "GET", path: "/test/restful/api/user/*", query: {}, file: 'restful', type: 'user', testPath: ["/test/restful/api/user/obama"] },
  { method: "GET", path: "/test/restful/api/**/tom", query: {}, file: 'restful', type: 'rose', testPath: ["/test/restful/api/car/belong/tom", "/test/restful/api/tom"] },
  { method: "GET", path: "/test/restful/api/user/", query: {}, file: 'restful', type: 'users', testPath: ["/test/restful/api/user/"] },
]

/**
 * 序列化请求参数
 * @param {Object} query - 请求参数对象
 */
function stringifyQuery(query) {
  let keys = Object.keys(query)
  if (!keys.length) return ''
  return '?' + keys.map(key => {
    return `${key}=${query[key]}`
  }).join('&')
}

let api = Object.assign(methodRule, [...queryConfig, ...regExpConfig, ...RESTfulConfig].reduce((obj, cf) => {
  obj[`${cf.method} ${cf.path}${stringifyQuery(cf.query)}`] = `${cf.file}/${cf.type}.json`
  return obj
}, {}))
// mock data storage directory
exports.dataFile = './data'
/**
 * KEY: '{METHOD} {router}'
 * VALUE: path relative to the dataFile
 */
exports.api = api