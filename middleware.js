module.exports = (type) => {
  switch (type) {
    case 'express':
      return require('./lib/middleware/index').expressMockMiddleware
    case 'koa':
      return require('./lib/middleware/index').koaMockMiddleware
    default:
      return require('./lib/middleware/index').expressMockMiddleware
  }
}