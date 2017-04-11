const fs = require('fs')
const path = require('path')
const bs = require('browser-sync').create()
const merge = require('lodash.merge')
const isEmpty = require('lodash.isEmpty')

const dependents = require('./dependents.js')
const update = require('./update.js')
const save = require('./state.js')
const cache = path.join(process.cwd(), '.cache/depmap.json')
const defaults = {
  server: 'build',
  files: [ 'build' ]
}

module.exports = function (depmap, opts) {
  if (fs.existsSync(cache)) {
    let previousState = require(cache)
    depmap = merge({}, previousState, depmap)
    console.log('Successfully loaded and merged state')
  }
  depmap = dependents(depmap)
  opts.sleep = opts.sleep || 100
  opts.browsersync = merge({}, defaults, opts.browsersync)

  bs.init(opts.browsersync)
  setInterval(() => { update(depmap, opts) }, opts.sleep)

  process.on('SIGINT', (code) => {
    bs.exit()
    let err = save(depmap)
    if (err) {
      console.error(err)
      process.exit(1)
    }

    console.log('\nSaved depmap')
    process.exit(code || 0)
  })
}
