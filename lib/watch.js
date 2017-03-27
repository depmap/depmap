const sleep = require('sleep')
const compile = require('./compile.js')

module.exports = function (depmap, opts) {
  while (true) {
    compile(depmap)
    sleep.msleep(opts.sleep || 100)
  }
}
