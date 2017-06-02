const fs = require('fs')
const path = require('path')
const BS = require('browser-sync')
const merge = require('lodash.merge')
const isEmpty = require('lodash.isempty')
const pretty = require('@depmap/errors')
const Pathwatcher = require('pathwatcher')
const dependents = require('./dependents.js')
const update = require('./update.js')
const save = require('./state.js')

const cache = path.join(process.cwd(), '.cache/depmap.json')
const defaults = {
  server: 'build',
  files: ['build'],
  logPrefix: 'Depmap',
  logFileChanges: false,
  serverName: `depmap-${Math.random()*101|0}`,
  ui: false
}

module.exports = function (depmap, opts, singleCompilation=true) {
  if (fs.existsSync(cache) && !opts.cliArgs.stateless) {
    let previousState = require(cache)
    depmap = merge({}, previousState, depmap)
    opts.logger.info('Merged previous and new state')
  }

  depmap = dependents(depmap)
  if (singleCompilation) {
    let updates = update(Object.keys(depmap), depmap, opts, singleCompilation)
    opts.logger.info(`Files Updated: [${updates.length}]`)

    if (!opts.stateless) save(depmap, opts)
    process.exit(0)
  } else {
    if (opts.debug) opts.browsersync.logLevel = 'debug'
    opts.browsersync = merge({}, defaults, opts.browsersync)
    let bs = BS.create(opts.browsersync.serverName)
    opts.logger.info(`Browsersync instance: ${opts.browsersync.serverName}`)
    update(Object.keys(depmap), depmap, opts, !singleCompilation)

    bs.init(opts.browsersync)
    for (let file of Object.keys(depmap)) {
      // check if file is a collection & parse
      file = file.indexOf('[') > -1 ? file.slice(0, file.indexOf('[')) : file
      Pathwatcher.watch(file, (event, path) => {
        opts.logger.info(`File change ${file}`)
        update(file, depmap, opts, singleCompilation)
      })
    }

    process.stdin.resume()
    process.on('SIGINT', code => {
      Pathwatcher.closeAllWatchers()
      bs.exit()
      if (!opts.stateless) save(depmap, opts)

      process.exit(code || 0)
    })
  }
}
