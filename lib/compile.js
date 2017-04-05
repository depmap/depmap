const sleep = require('sleep')
const dependents = require('./dependents.js')
const update = require('./update.js')

module.exports = function (depmap, opts) {
  depmap = dependents(depmap)
  update(depmap, opts, true)
}
