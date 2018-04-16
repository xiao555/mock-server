const should = require('should')
const router = require('../lib/router')
const join = require('path').join
const fs = require('fs')

const allowMethods = ['get', 'put', 'post', 'patch', 'delete', 'del'] // 支持的请求方法

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

let getHandler

describe('Test router', async () => {
  it('根据配置创建路由, 测试支持的各种方法', done => {
    let ctx = new Map(),
        next = () => {},
        res = router({
          "dataFile": join(__dirname, './data'),
          "api": api
        })(ctx, next)

    res.then(() => {
      let methodStack = ctx.router.stack
      methodStack.length.should.be.equal(6)
      methodStack.forEach(layer => {
        layer.methods.should.be.oneOf(['HEAD', 'GET'], ['PUT'], ['POST'], ['PATCH'], ['DELETE'])
        let ctx = { path: '/test/methods/', query: {} },
            method = layer.methods[1] || layer.methods[0]
        layer.stack[0](ctx)
        ctx.body.method.should.be.equal(method.toLowerCase())
        if (method === 'GET') getHandler = layer.stack[0]
      })
      done()
    }).catch(err => console.error(err))
  })

  it('测试带请求参数的匹配', () => {
    queryConfig.forEach(({query, path, type}) => {
      let ctx = { path: path, query: query }
      getHandler(ctx)
      ctx.body.type.should.be.equal(type)
    })
  })
  
  it('测试配置参数包含于查询参数也可命中，先配置先命中', () => {
    let ctx = { path: "/test/query/", query: { name: "tom", age: "18", school: "xidian" } }
    getHandler(ctx)
    ctx.body.type.should.be.equal('tom-all')
    
    ctx = { path: "/test/query/", query: { name: "tom", school: "xidian" } }
    getHandler(ctx)
    ctx.body.type.should.be.equal('tom-name')
  })
  
  it('测试请求参数带正则的匹配', () => {
    regExpConfig.forEach(({query, path, type}) => {
      let ctx = { path: path, query: query }
      getHandler(ctx)
      ctx.body.type.should.be.equal(type)
    })
  })
  
  it('测试RESTful的匹配', () => {
    RESTfulConfig.forEach(({ query, type, testPath}) => {
      testPath.forEach(_path => {
        let ctx = { path: _path, query: query }
        getHandler(ctx)
        ctx.body.type.should.be.equal(type)
      })
    })
  })

  it('根据配置创建路由, 测试直接配置json字符串', done => {
    try {
      let ctx = new Map(),
          next = () => { },
          res = router({
            "api": { 
              "GET /test/json/": '{"type":"json"}',
              "GET /test/json/?name=tom": '{"type":"json"}' 
            }
          })(ctx, next)
      res.then(() => {
        [
          { path: '/test/json/', query: {} }, 
          { path: '/test/json/', query: { name: 'tom' }}
        ].forEach(_ctx => {
          ctx.router.stack[0].stack[0](_ctx)
          _ctx.body.type.should.be.equal('json')
        })
        done()
      }).catch(err => console.error(err))
    } catch (error) {
      return
    }
  })

  it('根据配置创建路由, 测试不支持的方法', () => {
    try {
      router({
        "dataFile": join(__dirname, './data'),
        "api": { "GGGET /test/unsupport-method/": "methods/get.json" }
      }).should.throw()
    } catch (error) {
      return
    }
  })

  it('测试不支持的path, query', () => {
    try {
      let ctx = { path: '/2333/', query: {} }
      getHandler(ctx).should.throw()
    } catch (error) {}

    try {
      let ctx = { path: '/test/query/', query: {school: 'xidian'} }
      getHandler(ctx).should.throw()
    } catch (error) {}
    
    try {
      let ctx = { path: '/test/regexp/', query: {} }
      getHandler(ctx).should.throw()
    } catch (error) {}
  })
})