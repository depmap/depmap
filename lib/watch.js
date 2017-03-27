const sleep = require('sleep')
const compile = require('./compile.js')

module.exports = function (depmap, opts) {
  opts.sleep = opts.sleep || 100

  while (true) {
    compile(depmap, opts)
    sleep.msleep(opts.sleep)
  }
}
