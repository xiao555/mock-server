const path = require('path')
let Mock = require('../../')

let app = new Mock({
  config: path.join(__dirname, './mock/config'),
  watch: true,
  log: path.join(__dirname, './mock/log')
})

app.run()