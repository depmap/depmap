const sleep = require('sleep')
const dependents = require('./dependents.js')

const update = require('./update.js')

module.exports = function (depmap, opts) {
  depmap = dependents(depmap)
  opts.sleep = opts.sleep || 100

  while (true) {
    update(depmap, opts)
    sleep.msleep(opts.sleep)
  }
}
