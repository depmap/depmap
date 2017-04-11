const fs = require('fs')
const path = require('path')
const process = require('process')
const merge = require('lodash.merge')
const dependents = require('./dependents.js')
const update = require('./update.js')
const save = require('./state.js')

const cache = path.join(process.cwd(), '.cache/depmap.json')

module.exports = function (depmap, opts) {
  let initialBuild = true
  if (fs.existsSync(cache)) {
    let previousState = require(cache)
    depmap = merge({}, previousState, depmap)
    initialBuild = false
    console.log('Successfully loaded and merged state')
  }

  depmap = dependents(depmap)
  update(depmap, opts, initialBuild)

  save(depmap)
  process.exit(0)
}
