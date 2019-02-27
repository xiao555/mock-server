const path = require('path')
const webpack = require('webpack')
const mock = require('../express-mw')

module.exports = {
  devServer: {
    // 在服务内部的所有其他中间件之后， 执行自定义中间件的功能。
    // https://webpack.js.org/configuration/dev-server/#devserver-after
    after: (app) => {
      app.use(mock({
        config: path.join(__dirname, '../test/config.js')
      }))
    }
  },
  // 调整 webpack 配置
  configureWebpack: {
    plugins: [
      new webpack.ProvidePlugin({
        axios: 'axios'
      })
    ]
  }
}
