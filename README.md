# Mock Server

一个轻量化的本地mock服务器

[![](https://travis-ci.org/xiao555/mock-server.svg?branch=master)](https://travis-ci.org/xiao555/mock-server)
[![npm](https://img.shields.io/npm/dt/cf-mock-server.svg)](https://www.npmjs.com/package/cf-mock-server)
[![npm](https://img.shields.io/npm/v/cf-mock-server.svg)](https://www.npmjs.com/package/cf-mock-server)
[![node version](https://img.shields.io/badge/node.js-%3E=_7.10.1-green.svg?style=flat-square)](http://nodejs.org/download/)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/xiao555/mock-server/blob/master/LICENSE)

## 3分钟创建你的Mock Server

```javascript
// index.js
let Mock = require('cf-mock-server')

let app = new Mock({
  config: {
    api: {
      'GET /api/users/all': '[{"name":"tom"},{"name":"jerry"}]',
      'GET /api/users/?name=tom': '{"name":"tom","age":18}',
      'GET /api/users/?name=/^A.*\\^$/': '{"name":"jack","age":18}'
      'GET /api/users/?name=*': '{"name":"rose","age":18}'
    }
  }
})

app.run()
```
安装依赖并执行：
```
npm i cf-mock-server --save-dev

node index.js
```

浏览器访问 `http://localhost:8008/api/users/all`, 即可得到`[{"name":"tom"},{"name":"jerry"}]`

## More Example

### 创建配置文件

```javascript
// config.js
// 数据目录
exports.dataFile = '../{YOUDATAFOLDER}'
// 静态资源
exports.staticFile = '../static'
/**
 * KEY: '{METHOD} {router}'
 * VALUE: 数据文件路径，相对于dataFile
 */
exports.api = {
  // GET all user
  'GET /api/users/all': 'all_users.txt',
  // GET user named 'tom'
  'GET /api/users/?name=tom': 'users/tom.json',
  // GET user whatever the name is
  'GET /api/users/?name=/^A.*\\^$/': 'users/example.json',
}
```

所以你的数据目录应该是这样：

```shell
- dataFile
  - all_user.txt
  - users
    - tom.json
    - example.json
- static
  - image
    - hello.jpg
  - audio
    - scan-ok.ogg
```

### 开启服务:

#### 1. 命令行接口(全局安装)

```shell
mock -w -c config.js
```

数据的访问:
访问 `http://localhost:8008/api/users/all` 会得到 `all_user.json`
访问 `http://localhost:8008/api/users//?name=tom` 会得到  `users/tom.json`
访问 `http://localhost:8008/api/users//?name=jerry` 会得到 `users/example.json`

静态资源的访问：
`http://localhost:8008/image/hello.jpg`
`http://localhost:8008/audio/scan-ok.ogg`

具体例子可见`example/default`

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
// static
exports.staticFile = '../static'
/**
 * KEY: '{METHOD} {router}'
 * VALUE: path relative to the dataFile
 */
exports.api = {
  // GET all user
  'GET /api/users/all': 'all_users.txt',
  // GET user named 'tom'
  'GET /api/users/?name=tom': 'users/tom.json',
  // GET user whatever the name is
  'GET /api/users/?name=/^A.*\\^$/': 'users/example.json',
}
```

JSON:

```json
// example/custom-config/config.json
{
  "dataFile": "./data",
  "staticFile": "../static",
  "api": {
    "GET /api/users/all": "all_users.txt",
    "GET /api/users/?name=tom": "users/tom.json",
    "GET /api/users/?name=/^A.*\\^$/": "users/example.json"
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
1. 参数数组中的某些值也可以用`*`占位，例如`name=tom&&name=jerry&&name=*` 可以被 `name=tom&&name=jerry&&name=obama` 匹配到

例如Config：

```json
{
  "/user": "all.json",
  "/user/?name=tom&age=18": "tom.json",
  "/user/?name=tom": "a.json",
  "/user/?name=*": "b.json"
}
```

访问 `/user/?name=tom` 会匹配到 `tom.json`, 访问 `/user/?name=jerry` 会匹配到 `b.json`

### 4. 支持访问静态资源

因为配置项目代理的时候可能会影响到静态资源的访问，所以在mock server中加入静态资源访问，只需要提供静态资源的路径即可

``` javascript
// js
exports.staticFile = '../static'

// json
{
  "staticFile": "../static"
}
```

### 5. 支持自定义Response Headers

自定义响应头，需要数据文件改成txt，格式如下：

``` bash
HTTP/1.1 200 OK # Will ignore this line
Date: Wed, 26 Apr 2017 09:32:13 GMT
Content-Length: 1823
Cache-Control: max-age=0, must-revalidate
Content-Type: application/json
X-Resource-Count: 3 # custom header

[
  {
    "name": "tom"
  },
  {
    "name": "jerry"
  }
]
```

### 6. 参数支持正则表达式匹配

```javascript
exports.api = {
  'GET /api/users/?name=/^A.*\\^$/': 'users/example.json',
}
```
将会匹配A开头/结尾的参数值, 注意这里的`\\`，因为是通过`new RegExp({String})`来创建RegExp对象的，所以需要两个`\`使`{String}`里有一个`\`

## LICENSE

MIT