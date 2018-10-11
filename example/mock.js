const path = require('path')
let Mock = require('../')

let app = new Mock({
  config: path.join(__dirname, './config'),
  port: 8009,
})

app.run()