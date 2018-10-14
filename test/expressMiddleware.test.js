const express = require('express')
const expressMockMiddleware = require('../lib/middleware').expressMockMiddleware
const initMiddleware = require('../lib/middleware').initMiddleware
const should = require('should')
const supertest = require('supertest')
const join = require('path').join

/**
 * 初始化服务器
 * @param {object} options - 配置选项
 */
const initServer = (options) => {
  const app = express()
  app.use(expressMockMiddleware(options))
  return app
}

let request

const allowMethods = ['get', 'put', 'post', 'patch', 'delete'] // 支持的请求方法

// 测试用例
let queryConfig = [
  { method: "GET", path: "/test/query/", query: { name: "tom", age: "18" }, file: 'query', type: 'tom-all' },
  { method: "GET", path: "/test/query/", query: { name: "tom" }, file: 'query', type: 'tom-name' },
  { method: "GET", path: "/test/query/", query: {}, file: 'query', type: 'no-query' },
], regExpConfig = [
  { method: "GET", path: "/test/regexp/", query: { name: "/^A.*\\^$/", age: "/^\\d+$/" }, file: 'regexp', type: 'user', example: { name: 'A^', age: 18 } },
  { method: "GET", path: "/test/regexp/", query: { name: "jerry", age: "/^\\d+$/" }, file: 'regexp', type: 'jerry', example: { name: 'jerry', age: 18 } },
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

describe('Test express middleware', () => {
  describe('初始化中间件', () => {
    it('根据测试的配置初始化中间件, 测试支持的各种方法', () => {
      request = supertest(initServer({
        config: join(__dirname, './config.js')
      }).listen())
      return Promise.all([
        ...allowMethods.map(method => request[method]('/test/methods/').expect(200, { method: method })),
        request.options('/test/methods/').expect(404)
      ])
    })

    it('API配置中含有不支持的方法, 抛出not supported method错误', () => 
      should.throws(
        () => initMiddleware({ config: { api: { 'OPTIONS /a': 'test' } } }),
        /^MockServerError: not supported method/
      )
    )

    it('配置文件不存在, 抛出not supported method错误', () => 
      should.throws(
        () => initMiddleware({
          config: join(__dirname, './404.js')
        }),
        /^MockServerError: cannot resolve path \(or pattern\):/
      )
    )

    it('根据配置创建路由, 测试直接配置json字符串', () => {
      let _request
      let testData = [
        { path: '/test/json/', type: 'json' },
        { path: '/test/json/?name=tom', type: 'tom' } 
      ]
      should.doesNotThrow(
        () => _request = supertest(initServer({
          config: {
            "api": {
              "GET /test/json/": '{"type":"json"}',
              "GET /test/json/?name=tom": '{"type":"tom"}'
            }
          }
        }))
      )
      return Promise.all([
        ...testData.map(({path, type}) => _request.get(path).expect(200, { type: type }))
      ])
    })

    it('根据配置创建路由, 测试不支持的方法', () => 
      should.throws(
        () => initMiddleware({
          config: {
            "api": { "GGGET /test/unsupport-method/": "methods/get.json" }
          }
        }),
        /^MockServerError: not supported method/
      )
    )
  })

  describe('请求规则匹配', () => {
    it('测试带请求参数的匹配', () => {
      const testData = [ // 404 data
        '/test/query/?name=jerry&age=18',
        '/test/query/?name=jerry',
        '/test/querytest/?name=tom&age=18',
      ]
      return Promise.all([
        ...queryConfig.map(({ query, path, type }) => request.get(`${path}${stringifyQuery(query)}`).expect({ type: type })),
        ...testData.map(url => request.get(url).expect(404))
      ])
    })

    it('测试配置参数包含于查询参数也可命中，优先匹配次序靠前的', () => {
      const testData = [
        { url: '/test/query/?name=tom&age=18&school=xidian', type: 'tom-all', code: 200 },
        { url: '/test/query/?name=tom&school=xidian', type: 'tom-name', code: 200 },
        { url: '/test/query/?name=jerry&school=xidian', code: 404 },
      ]
      return Promise.all(testData.map(({ url, type, code }) => request.get(url).then(res => {
        res.statusCode.should.be.equal(code)
        code == 200 && res.body.type.should.be.equal(type)
      }))
      )
    })

    it('测试请求参数带正则的匹配', () => 
      Promise.all([
        ...regExpConfig.map(({ path, type, example }) => request.get(`${path}${stringifyQuery(example)}`).expect(200, { type: type })),
        request.get(`/test/regexp/?name=123&age=18`).expect(404)
      ])
    )

    it('测试RESTful的匹配', () => {
      const testData = [
        { url: '/test/restful/user/tom', code: 404 },
      ]
      return Promise.all([
        ...RESTfulConfig.map(({ type, testPath }) => {
          return Promise.all(testPath.map( _path => request.get(_path).expect(200, { type: type })))
        }),
        ...testData.map(({ url, code }) => request.get(url).expect(code))
      ])
    })
  })

  describe('与其他中间件共存', () => {
    const _app = express()

    _app.use((req, res, next) => {
      if (req.path === '/customMiddleware/before') {
        res.status(200).send('customMiddleware/before')
      }
      next()
    })

    _app.use(expressMockMiddleware({
      config: join(__dirname, './config.js')
    }))

    _app.use((req, res, next) => {
      if (req.path === '/customMiddleware/after') {
        res.status(200).send('customMiddleware/after')
      }
      next()
    })

    const _request = supertest(_app.listen())

    it('测试之前的中间件已经发送了一个响应头', () => _request.get('/customMiddleware/before').expect(200, 'customMiddleware/before'))

    it('测试之后的中间件已经发送了一个响应头', () => _request.get('/customMiddleware/after').expect(200, 'customMiddleware/after'))

    it('测试其他的中间件未发送响应头', () => _request.get('/test/methods/').expect(200, { method: 'get' }))

    it('测试不支持的方法', () => _request.options('/test/methods/').expect(404))
  })
})