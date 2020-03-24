# Mock Server

[![travis-ci](https://travis-ci.org/xiao555/mock-server.svg?branch=master)](https://travis-ci.org/xiao555/mock-server)
[![Coverage Status](https://coveralls.io/repos/github/xiao555/mock-server/badge.svg?branch=master)](https://coveralls.io/github/xiao555/mock-server?branch=master)
[![npm](https://img.shields.io/npm/dt/cf-mock-server.svg)](https://www.npmjs.com/package/cf-mock-server)
[![npm](https://img.shields.io/npm/v/cf-mock-server.svg)](https://www.npmjs.com/package/cf-mock-server)
[![node version](https://img.shields.io/badge/node.js-%3E=_7.10.1-green.svg)](http://nodejs.org/download/)
[![license](https://img.shields.io/github/license/mashape/apistatus.svg)](https://github.com/xiao555/mock-server/blob/master/LICENSE)

一个轻量化的本地mock服务器

## Features

* 支持中间件方式挂载服务，可用于Express和Koa搭建的Node服务
* 支持命令行方式启动服务
* 支持Node启动Express服务作为Mock Server
* 支持监听配置文件和数据文件，修改热更新
* 支持请求参数配置使用正则表达式
* 支持RESTful风格的API, 路径可通过通配符匹配
* 支持自定义函数处理返回结果, 可自定义Response Header, 模拟延迟等

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
  -c, --config <file>  Custom profiles, default is mock/config.js
  -h, --help           output usage information
```

### Module

```shell
// Install
npm install cf-mock-server --save-dev
```

## Usage

### 搭配Vue-cli项目

#### Vue CLI 3

Vue Cli 3 的项目可通过配置vue.config.js将mock服务以中间件的形式挂载到开发服务器上

``` javascript
// mockserver是单独的node服务采用proxy方式
module.exports = {
  devServer: {
    proxy: 'http://localhost:8008', // will proxy all request
  }
}

// 也可以以中间件形式挂载到webpack-dev-server上
const mock = require('cf-mock-server/express-mw')
const path = require('path')

const options = {
  config: path.join(__dirname, './mock'),
  watchs: [path.join(__dirname, './mock')] // 监听mock目录下的所有js文件，热更新
}

module.exports = {
  devServer: {
    clientLogLevel: 'info',
    after: (app) => {
      app.use(mock(options))
    }
  }
}
```

#### Vue CLI 2.x

之前版本的Vue Cli只能单独启动一个mock服务器, 通过配置proxyTable将开发服务器的请求代理到mock服务器

``` javascript
// mock.js
const path = require('path')
let Mock = require('cf-mock-server')

let app = new Mock({
  config: path.join(__dirname, './config'), // 配置文件
  watch: true, // 观察模式，监听配置文件改动自动应用
})

app.run()

// config/index.js
dev: {
  proxyTable: {
    '/api': 'http://127.0.0.1:8008', // will proxy request with '/api' prefix
  },
}
```

### API配置文件

支持JSON和JS格式

```javascript
// config.js
// 数据文件根目录，如果API数据是文件路径则需要配置此项
exports.dataFile = '../{YOUDATAFOLDER}'
/**
 * API配置, 路径支持通配符，参数支持通配符，正则(右斜杠需要两个)和不完全匹配
 * KEY: '{METHOD} {router}'
 * VALUE: JSON字符串或数据文件路径，相对于dataFile, 可省略扩展名
 */
exports.api = {
  'GET /api/users/all': 'all_users',  // only match /api/users/all
  'GET /api/users/all?name=sam': 'users/example', // => /api/users/all?name=sam&age=18
  'GET /api/users/?name=*': 'users/tom.json', // => /api/users/?name={anyone}
  'GET /api/v1/users/tom': 'users/tom.json',// only match /api/v1/users/tom
  'GET /api/v1/users/*': 'users/example', // => /api/v1/users/{anyone}
  'GET /api/v1/*/tom': 'users/tom.json', // => /api/v1/{anyone}/tom
  'GET /api/**/tom': 'users/tom.json', // => /api/({anyone}/)*tom
  'GET /api/users/?name=/^A.*\\^$/': 'users/example', // => /api/users/?name=A{.*}^
  'POST /api/users': (req, res) => { // 自定义函数 API参考 express
    if (req.body.name === 'tom') {
      res.status(200).send({ message: 'Create user success!' })
    }
  },
}
```

### Config

接口对应的结果可以是 JSON字符串，JSON文件路径，JS文件路径甚至是TXT文件路径，也可以是自定义函数处理返回

如果需要配置文件路径，必须设置dataFile字段(数据文件所在的目录), 文件路径写成相对路径即可

```javascript
// index.js
let Mock = require('cf-mock-server')

let app = new Mock({
  config: {
    dataFile: './mockData',
    api: {
      'GET /api/users/all': '[{"name":"tom"},{"name":"jerry"}]',
      'GET /api/users/?name=tom': 'users/tom.json',
      'GET /api/users/?name=/^A.*\\^$/': 'users/tom.js',
      'GET /api/users/?name=*': 'users/tom.txt',
      'POST /api/users': (req, res) => {
        if (req.body.name === 'tom') {
          res.status(200).send({ message: 'Create user success!' })
        }
      },
    }
  },
  watch: true,
})

app.run()
```

### CLI

``` shell
mock -c config.js

// Output
[MOCK] server started on port 8008

// Usage
➜  ~ curl http://localhost:8008/api/users/\?name\=A\^
{"name":"jerry","age":18}%
```

### Mock API

通过`new Mock()`方式可以创建一个Koa服务

##### new Mock(options)

创建Mock实例，可以通过options传API配置和设置端口

``` javascript
let mock = new Mock({
  config: path.join(__dirname, './config'), // Mock API 配置, Object or file path
  port: 8009, // 服务监听的端口号
})
```

##### mock.setPort(port)

设置服务监听的端口

``` javascript
mock.setPort(8009)
```

##### mock.setConfig(config)

设置API配置

``` javascript
mock.setConfig(path.join(__dirname, './config'))

mock.setConfig({ api: { 'GET /api/users/all': '[{"name":"tom"},{"name":"jerry"}]' } })
```

##### mock.run()

启动服务, 并返回koa实例

``` javascript
mock.run()
```

## LICENSE

[MIT](https://opensource.org/licenses/MIT)
