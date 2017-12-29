let Mock = require('../../')

let app = new Mock({
  config: {
    api: {
      'GET /api/users/all': '[{"name":"tom"},{"name":"jerry"}]',
      'GET /api/users/?name=tom': '{"name":"tom","age":18}',
      'GET /api/users/?name=*': '{"name":"jerry","age":18}'
    }
  }
})

app.run()