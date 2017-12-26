# Mock Server

一个轻量化的本地mock服务器

## Example

### 创建配置文件

```javascript
// config.js
// 数据目录
exports.dataFile = '../{YOUDATAFOLDER}'
/**
 * KEY: '{METHOD} {router}'
 * VALUE: 数据文件路径，相对于dataFile
 */
exports.api = {
  // GET all user
  'GET /api/users/all': 'all_users.json',
  // GET user named 'tom'
  'GET /api/users/?name=tom': 'users/tom.json',
  // GET user whatever the name is
  'GET /api/users/?name=*': 'users/example.json',
}
```

所以你的数据目录应该是这样：

```shell
- dataFile
  - all_user.json
  - users
    - tom.json
    - example.json
```

### 开启服务:

#### 1. 命令行接口(全局安装)

```shell
mock -w -c config.js
```

当你访问 `http://localhost:8008/api/users/all` 的时候, 你会得到 `all_user.json`.
访问 `http://localhost:8008/api/users//?name=tom` 会得到  `users/tom.json`
`http://localhost:8008/api/users//?name=jerry` 会得到 `users/example.json`

具体例子可见`example/custom-config`

#### 2. 创建启动文件(Module)

```javascript
// mock.js
const path = require('path')
let Mock = require('../../')

let app = new Mock({
  config: path.join(__dirname, './mock/config'), // 配置文件
  port: 8009,                     // 自定义端口
  watch: true,                    // 观察模式，监听配置文件改动自动应用
  log: path.join(__dirname, './mock/log') // 请求信息以log形式输出
})

app.run()
```

```shell
node mock.js
```

具体例子可见`example/without-cli/`

## Install

### CLI

```bash
// Install
npm install -g cf-mock-server

// CLI
Usage: mock [options] <file ...>


Options:

  -V, --version        output the version number
  -p, --port <port>    Define the mock server started port, default is 8008
  -w, --watch          Listen to the file changes and restart the service
  -c, --config <file>  Custom profiles, default is mock/config.js
  -l, --log            Record the log and save to "mock/log/" and named {date}.log
  -L, --Log <path>     Record the log and save to <path>, default "mock/log/" and named {date}.log
  -h, --help           output usage information
```

### Module

```shell
// Install
npm install cf-mock-server --save-dev
```

## Configuration

配置文件可以是JS,也可以是JSON，JS方便给API添加注释，JSON不能加注释

JS:

```javascript
// example/default/mock/config.js
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
```

JSON:

```json
// example/custom-config/config.json
{
  "dataFile": "./data",
  "api": {
    "GET /api/users/all": "all_users.json",
    "GET /api/users/?name=tom": "users/tom.json",
    "GET /api/users/?name=*": "users/example.json"
  }
}
```

## Features

### 1. 监听配置文件改变自动应用

CLI: 添加 `-w/--watch` 参数
Module: 传入`{ watch: true }`

### 2. 记录日志

CLI: 添加 `-L/ -l` 参数
Module: 传入`{ log: \PATHTOSAVELOG\ }`

### 3. API优先匹配

1. 优先匹配，匹配到一个后，后面的不会再去匹配
1. 不带参数的只能匹配到不带参数的
1. 带参数的请求只要配置项的参数都能匹配到，如果不全也算匹配成功，例如请求'/user/?name=tom&age=18' 也会匹配 '/user/?name=tom'
1. 参数会变化的值可以用`*`占位，不会去计算值是否相等

例如Config：

```json
{
  "/user": "all.json",
  "/user/?name=tom&age=18": "tom.json",
  "/user/?name=tom": "a.json",
  "/user/?name=*": "b.json"
}
```

访问 `/user/?name=tom` 会匹配到 `tom.json`, 访问 `/user/?name=*` 会匹配到 `b.json`

## LICENSE

MIT