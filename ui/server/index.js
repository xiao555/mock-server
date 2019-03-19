const express = require('express')
const consola = require('consola')
const { Nuxt, Builder } = require('nuxt')
const { ApolloServer } = require('apollo-server-express')
const typeDefs = require('./graphql/type-defs')
const resolvers = require('./graphql/resolves')
const app = express()

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
