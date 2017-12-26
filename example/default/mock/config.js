// config.js
// mock data storage directory
exports.dataFile = '../data'
/**
 * KEY: '{METHOD} {router}'
 * VALUE: path relative to the dataFile
 */
exports.api = {
  // GET all user
  'GET /api/users/all': 'all_users.json',
  // GET user named 'tom'
  'GET /api/users/?name=tom': 'users/tom.json',
  // GET user whatever the name is
  'GET /api/users/?name=*': 'users/example.json',
}