const path = require('path')
const express = require('express')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const { ApolloServer } = require('apollo-server-express')
const match = require('../../lib/middleware/match')
const utils = require('../../lib/utils')
const typeDefs = require('./graphql/type-defs')
const resolvers = require('./graphql/resolves')
const mockOpts = require('./config')
const app = express()

const ALLOW_METHODS = ['GET', 'PUT', 'POST', 'PATCH', 'DELETE'] // 支持的请求方法

const server = new ApolloServer({ typeDefs, resolvers })
server.applyMiddleware({ app })

// Import and Set Nuxt.js options
// eslint-disable-next-line import/order
const config = require('../nuxt.config.js')
config.dev = !(process.env.NODE_ENV === 'production')

async function start() {
  // Init Nuxt.js
  const nuxt = new Nuxt(config)

  const { host, port } = nuxt.options.server

  // Build only in dev mode
  if (config.dev) {
    const builder = new Builder(nuxt)
    await builder.build()
  } else {
    await nuxt.ready()
  }
  app.use((req, res, next) => {
    const options = mockOpts.get()
    if (res.headersSent || !ALLOW_METHODS.includes(req.method) || !options) return next()
    try {
      const value = match(
        options.apiConf,
        req.method,
        req.originalUrl,
        req.path,
        req.query
      )

      if (!value) {
        return next()
      }

      if (typeof value === 'function') {
        let data = ''
        req.on('data', chunk => {
          data += chunk
        })
        req.on('end', () => {
          req.body = data ? JSON.parse(data) : {}
          value(req, res, next)
        })
        return
      }

      if (options.dataFilePath) {
        const { header, body } = utils.readFile(
          path.resolve(options.dataFilePath, value)
        )
        res.set(header)
        res.status(200).send(body)
      } else {
        res.status(200).send(JSON.parse(value))
      }
      res.status = 200
    } catch (error) {
      console.error(error.message)
      next()
    }
  })
  // Give nuxt middleware to express
  app.use(nuxt.render)

  // Listen the server
  app.listen(port, host)
  consola.ready({
    message: `Server listening on http://${host}:${port}`,
    badge: true
  })
}
start()
