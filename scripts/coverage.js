const opn = require('opn')
const path = require('path')

opn(path.join(__dirname, '../coverage/index.html'))
  .then(process.exit(0))
  .catch(e => console.error(e))