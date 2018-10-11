const koa = require('koa')
const koaMockMiddleware = require('../lib/middleware').koaMockMiddleware
const should = require('should')
const supertest = require('supertest')
const join = require('path').join

const app = new koa()

app.use((ctx, next) => {
  if (ctx.path === '/customMiddleware/before') {
    ctx.body === 'customMiddleware/before'
  }
  next()
})

app.use(koaMockMiddleware({
  config: join(__dirname, './config.js')
}))

app.use((ctx, next) => {
  if (ctx.path === '/customMiddleware/after') {
    ctx.body === 'customMiddleware/after'
  }
  next()
})

let server = app.listen()
let request = supertest(server)

describe('Test koa middleware', () => {
  it('测试之前的中间件已经发送了一个响应头', () => {
    request.get('/customMiddleware/before').expect(200, 'customMiddleware/before')
  })
  
  it('测试之后的中间件已经发送了一个响应头', () => {
    request.get('/customMiddleware/after').expect(200, 'customMiddleware/after')
  })
  
  it('测试其他的中间件未发送响应头', () => {
    request.get('/test/methods/').expect(200, { method: 'get' })
  })
})


