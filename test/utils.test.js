const should = require('should')
const utils = require('../lib/utils')
const join = require('path').join
const fs = require('fs')

describe('Test utils', () => {
  describe('Test matchObject', () => {
    it('两个内容完全一样的对象应该返回true', () => {
      let a = { name: 'xiaoming', age: 18, children: ['1', '2'], car: { age: 2 } }
      let b = { name: 'xiaoming', age: 18, children: ['1', '2'], car: { age: 2 } }
      utils.matchObject(a, b).should.be.true()
    })

    it('带模糊匹配的应该返回true', () => {
      let a = { name: 'xiaoming', age: 18, children: ['1', '2'] }
      let b = { name: '*', age: '*', children: ['*', '2'] }
      utils.matchObject(a, b).should.be.true()
    })

    it('正则匹配的应该返回true', () => {
      let a = { name: 'Aemmmm^', age: 18, children: ['1', '2'] }
      let b = { name: '/^A.*\\^$/', age: '/\\d/', children: ['*', '2'] }
      utils.matchObject(a, b).should.be.true()
    })
    
    it('正则匹配的应该返回false', () => {
      let a = { name: 'Aemmmm', age: 18, children: ['1', '2'] }
      let b = { name: '/^A.*\\^$/', age: '/\\d/', children: ['*', '2'] }
      utils.matchObject(a, b).should.not.be.true()
    })

    it('两个内容不一样的对象应该返回false', () => {
      let a = { name: 'xiaoming', age: 18, children: ['1', '2'] }
      let b = { name: 'xiaoming', age: 18, children: ['2', '3'] }
      utils.matchObject(a, b).should.not.be.true()
      a = { name: 'xiaoming', age: 18, car: { age: 2 } }
      b = { name: 'xiaoming', age: 18, car: { type: 1 } }
      utils.matchObject(a, b).should.not.be.true()
    })
    
    it('类型不一致应该返回false', () => {
      let a = { name: 'xiaoming', age: 18, children: {} }
      let b = { name: 'xiaoming', age: 18, children: 'c' }
      utils.matchObject(a, b).should.not.be.true()
      a = { name: 'xiaoming', age: 18, children: [] }
      b = { name: 'xiaoming', age: 18, children: 'c' }
      utils.matchObject(a, b).should.not.be.true()
    })
  })

  describe('Test matchPath', () => {
    it('相同的path应该返回true', () => {
      utils.matchPath(['api', 'user', 'tom'], ['api', 'user', 'tom']).should.be.true()
    })

    it('带单项模糊匹配的应该返回true', () => {
      utils.matchPath(['api', '*', 'tom'], ['api', 'user', 'tom']).should.be.true()
      utils.matchPath(['api', '*'], ['api', 'user']).should.be.true()
    })

    it('带多项模糊匹配的应该返回true', () => {
      utils.matchPath(['api', '**', 'tom'], ['api', 'user', 'name', 'tom']).should.be.true()
      utils.matchPath(['api', '**', 'tom'], ['api', 'tom']).should.be.true()
    })

    it('不相同的path应该返回false', () => {
      utils.matchPath(['api', 'user', 'tom'], ['api', 'user']).should.not.be.true()
      utils.matchPath(['api', 'user', '*'], ['api', 'user']).should.not.be.true()
      utils.matchPath(['api', '*', 'tom'], ['api', 'user']).should.not.be.true()
      utils.matchPath(['api', '**', 'tom'], ['api', 'jerry']).should.not.be.true()
    })
  })

  describe('Test watch', () => {
    it('测试watch功能', done => {
      let file = join(__dirname, './test-file/log.js'),
        cb = (file, watcher) => { watcher.close(); done() }
      utils.watch([file], cb)
      fs.writeFileSync(file, 'hello, world', 'utf-8')
    })
  })

  describe('Test completeFiles', () => {
    it('补充完整扩展名', () => {
      utils.completeFiles(join(__dirname, './test-file/log'))
        .should.be.equal(join(join(__dirname + '/test-file/log.js')))
      utils.completeFiles(join(__dirname, './test-file/a'))
        .should.be.equal(join(join(__dirname + '/test-file/a.json')))
    })
    it('目录下有index则补充index', () => {
      utils.completeFiles(join(__dirname, './test-file'))
        .should.be.equal(join(__dirname + '/test-file/index.js'))
    })
    it('目录名匹配js扩展', () => {
      utils.completeFiles(join(__dirname, './test-file/**/b.js'))
        .should.be.equal(join(__dirname + '/test-file/files/b.js'))
      utils.completeFiles(join(__dirname, './test-file/*.txt'))
        .should.be.equal(join(__dirname + '/test-file/crlf.txt'))
      utils.completeFiles(join(__dirname, './test-file//*.json'))
        .should.be.equal(join(__dirname + '/test-file/a.json'))
    })
    it('不正确的路径匹配undefind', () => {
      try {
        utils.completeFiles(join(__dirname, './test-file/log/2333/'))
          .should.throw()
      } catch (error) {
        return
      }
    })
  })

  describe('Test files', () => {
    it('获取目录下所有.js文件', () => {
      utils.files(join(__dirname, './test-file/'))
        .should.be.eql([
          join(__dirname + '/test-file/files/b.js'),
          join(__dirname + '/test-file/index.js'),
          join(__dirname + '/test-file/log.js')
        ])
    })

    it('获取目录下所有.txt文件', () => {
      utils.files(join(__dirname, './test-file/'), ['txt'])
        .should.be.eql([
          join(__dirname + '/test-file/crlf.txt'),
          join(__dirname + '/test-file/header.txt')
        ])
    })
    
    it('获取目录下所有文件', () => {
      utils.files(join(__dirname, './test-file/'), [])
        .should.be.eql([
          join(__dirname + '/test-file/a.json'),
          join(__dirname + '/test-file/crlf.txt'),
          join(__dirname + '/test-file/files/a.html'),
          join(__dirname + '/test-file/files/b.js'),
          join(__dirname + '/test-file/header.txt'),
          join(__dirname + '/test-file/index.js'),
          join(__dirname + '/test-file/log.js')
        ])
    })
  })

  describe('Test readFile', () => {
    it('读取index.js文件内容', () => {
      utils.readFile({}, join(__dirname, './test-file/index'))
        .should.be.eql({ name: 'tom' })
    })

    it('读取a.json文件内容', () => {
      utils.readFile({}, join(__dirname, './test-file/a'))
        .should.be.eql({ name: 'tom' })
    })
    
    it('读取header.txt文件内容, 并配置response header', () => {
      let ctx = new Map()
      utils.readFile(ctx, join(__dirname, './test-file/header'))
        .should.be.eql({ name: 'tom' })
      ctx.should.be.eql(new Map([
        ['Date', 'Wed, 26 Apr 2017 09:32:13 GMT'],
        ['Content-Length', '1823'],
        ['Cache-Control', 'max-age=0, must-revalidate'],
        ['Content-Type', 'application/json'],
        ['X-Resource-Count', '3']
      ]))
    })
    
    it('兼容CRLF格式的.txt文件', () => {
      let ctx = new Map()
      utils.readFile(ctx, join(__dirname, './test-file/crlf'))
        .should.be.eql({ name: 'tom' })
      ctx.should.be.eql(new Map([
        ['Date', 'Wed, 26 Apr 2017 09:32:13 GMT'],
        ['Content-Length', '1823'],
        ['Cache-Control', 'max-age=0, must-revalidate'],
        ['Content-Type', 'application/json'],
        ['X-Resource-Count', '3']
      ]))
    })

    it('读取不存在的文件内容', () => {
      try {
        utils.readFile({}, join(__dirname, './test-file/emmmmm'))
          .should.throw()
      } catch (error) {
        return
      }
    })

    it('读取其他扩展名不是[js,json,txt]的文件内容', () => {
      should(utils.readFile({}, join(__dirname, './test-file/files/a.html'))).be.exactly(null)
    })
  })

  describe('Test parseQuery', () => {
    it('解析参数', () => {
      utils.parseQuery('name=tom&age=18')
        .should.be.deepEqual({ name: "tom", age: '18'})
      utils.parseQuery('?name=tom&age=18')
        .should.be.deepEqual({ name: "tom", age: '18'})
    })
  })
})