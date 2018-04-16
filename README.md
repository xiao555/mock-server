# Mock Server

一个轻量化的本地mock服务器

[![](https://travis-ci.org/xiao555/mock-server.svg?branch=master)](https://travis-ci.org/xiao555/mock-server)
[![Coverage Status](https://coveralls.io/repos/github/xiao555/mock-server/badge.svg?branch=master)](https://coveralls.io/github/xiao555/mock-server?branch=master)
[![npm](https://img.shields.io/npm/dt/cf-mock-server.svg)](https://www.npmjs.com/package/cf-mock-server)
[![npm](https://img.shields.io/npm/v/cf-mock-server.svg)](https://www.npmjs.com/package/cf-mock-server)
[![node version](https://img.shields.io/badge/node.js-%3E=_7.10.1-green.svg)](http://nodejs.org/download/)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/xiao555/mock-server/blob/master/LICENSE)

![](https://xiao555.netlify.com/mock-server.png)

## 3分钟创建你的Mock Server

```javascript
// index.js
let Mock = require('cf-mock-server')

let app = new Mock({
  config: {
    api: {
      'GET /api/users/all': '[{"name":"tom"},{"name":"jerry"}]',
      'GET /api/users/?name=tom': '{"name":"tom","age":18}',
      'GET /api/users/?name=/^A.*\\^$/': '{"name":"jack","age":18}',
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

## 搭配Vue-cli项目

``` javascript
// config/index.js
dev: {
    env: require('./dev.env'),
    port: 8080,
    autoOpenBrowser: true,
    assetsSubDirectory: 'static',
    assetsPublicPath: '/',
    proxyTable: {
      '/home': {
        target: 'http://127.0.0.1:8008',
        changeOrigin: true,
        pathRewrite: {
          '^/home': '/home'
        }
      },
      '/api': {
        target: 'http://127.0.0.1:8008',
        changeOrigin: true,
        pathRewrite: {
          '^/api': '/api'
        }
      }
    },
```

## Features

### 1. 热重载路由

CLI: 添加 `-w/--watch` 参数
Module: 传入`{ watch: true }`

### 2. 支持访问静态资源

因为配置项目代理的时候可能会影响到静态资源的访问，所以在mock server中加入静态资源访问，只需要提供静态资源的路径即可

``` javascript
// js
exports.staticFile = '../static'

// json
{
  "staticFile": "../static"
}
```

### 3. 支持自定义Response Headers

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

### 4. 参数支持正则表达式

```javascript
exports.api = {
  'GET /api/users/?name=/^A.*\\^$/': 'users/example.json',
}
```
将会匹配A开头/结尾的参数值, 注意这里的`\\`，因为是通过`new RegExp({String})`来创建RegExp对象的，所以需要两个`\`使`{String}`里有一个`\`

### 5. 可省略扩展名

会自动匹配*.json或者*.txt
```javascript
exports.api = {
  // GET all user
  'GET /users/all': 'all_users',
  'GET /users/all?name=sam': 'users/example'
}
```

### 6. RESTful API支持任意匹配，跨级任意匹配

``` javascript
exports.api = {
  'GET /api/v1/users/tom': 'users/tom.json',
  'GET /api/v1/users/*': 'users/example',
  'GET /api/v1/*/tom': 'users/tom.json',
  'GET /api/**/tom': 'users/tom.json',
}

// * 匹配任意字符串
// ** 匹配任意长度 /*/*/*/...
```

### 7. 数据文件支持 json, js, txt

``` javascript
module.exports = {
  "name": "jerry",
  "age": 18 // age
}
```

### 8. 支持扩展请求参数

可以任意扩展参数，只要config定义的参数规则匹配即可命中，注意有优先级
``` javascript
exports.api = {
  'GET /test/query/?name=tom&age=18': 'users/tom.json',
  'GET /test/query/?name=tom': 'users/example'
}

// /test/query/?name=tom&age=18&school=xidian => users/tom.json
// /test/query/?name=tom&school=xidian => users/example
```

## LICENSE

MIT
