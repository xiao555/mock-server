const compose = require('koa-compose')
const convert = require('koa-convert')
const helmet = require('koa-helmet')
const cors = require('koa-cors')
const bodyParser = require('koa-bodyparser')

module.exports = () => {
  return compose([
    helmet(), // reset HTTP headers (e.g. remove x-powered-by)
    convert(cors()),
    convert(bodyParser())
  ])
}
