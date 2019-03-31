const { handleConfig } = require('../../lib/middleware')
const utils = require('../../lib/utils')
let opts = null

module.exports = {
  get: () => opts,
  set: options => {
    console.log(options)
    const confFile =
      typeof options.config === 'object'
        ? null
        : utils.getFullPathOfFile(options.config, ['.js', '.json'])

    Object.assign(options, {
      confFile, // mock配置文件路径
      dataFilePath: '', // 数据文件基础路径
      apiConf: null // API配置
    })

    // 监听mock配置文件改动，热更新API配置
    options.confFile &&
      utils.watch([options.confFile], file => {
        console.warn(`${file} changed!`)
        delete require.cache[file]
        handleConfig(options)
      })

    handleConfig(options)
    opts = options
  }
}
