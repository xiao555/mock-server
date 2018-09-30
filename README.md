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
* 支持Node启动Koa服务作为Mock Server
* 修改配置文件热重载路由
* 支持自定义Response Header
* 支持请求参数配置使用正则表达式
* 支持请求参数不完全匹配
* 支持通配符路径RESTful风格的API

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

### Node

```javascript
// index.js
let Mock = require('cf-mock-server')

let app = new Mock({
  config: {
    api: {
      'GET /api/users/all': '[{"name":"tom"},{"name":"jerry"}]',
      'GET /api/users/?name=tom': '{"name":"tom","age":18}',
      'GET /api/users/?name=/^A.*\\^$/': '{"name":"jerry","age":18}',
      'GET /api/users/?name=*': '{"name":"rose","age":18}'
    }
  }
})

app.run()

// Output
[MOCK] server started on port 8008

// Usage
➜  ~ curl http://localhost:8008/api/users/\?name\=A\^
{"name":"jerry","age":18}%
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

## Mock API

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

启动服务, 并返回实例

``` javascript
mock.run() 
```

## API Config

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
}
```

## 搭配Vue-cli项目

### Vue CLI 3

``` javascript
module.exports = {
  devServer: {
    proxy: 'http://localhost:8008', // will proxy all request
  }
}
```

### Vue CLI 2.x

``` javascript
// config/index.js
dev: {
  proxyTable: {
    '/api': 'http://127.0.0.1:8008', // will proxy request with '/api' prefix
  },
}
```

## LICENSE

MIT
