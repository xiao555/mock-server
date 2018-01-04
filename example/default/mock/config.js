// config.js
// mock data storage directory
exports.dataFile = '../data'
// exports.staticFile = '../static'
/**
 * KEY: '{METHOD} {router}'
 * VALUE: path relative to the dataFile
 */
exports.api = {
  // GET all user
  'GET /users/all': 'all_users',
  'GET /users/all?name=sam': 'users/example',
  // GET user named 'tom'
  'GET /api/users/?name=tom': 'users/tom.json',
  // GET user whatever the name is
  'GET /api/users/?name=/^A.*\\^$/': 'users/example.json',
}
