const fs = require('fs')
const dependents = require('./dependents.js')
const pretty = require('depmap-errors')
const isEmpty = require('lodash.isEmpty')

module.exports = function (depmap, opts) {
  const compiler = opts.compiler ? opts.compiler : require('depmap-diff')
  depmap = dependents(depmap)

  Object.keys(depmap).forEach(key => {
    let obj = depmap[key]
    let stats = fs.statSync(obj.filename)

    if (!obj['lastUpdated']) {
      obj['lastUpdated'] = stats.mtime.getTime()
    } else if (obj['lastUpdated'] !== stats.mtime.getTime()) {
      var dep = {}
      dep[key] = obj.dependencies
      // obj.onUpdate() // TODO add compilation by fn

      if (!isEmpty(obj.directDependents)) { // Compile DirectDependents (templates)
        for (let direct of obj.directDependents)
          compiler(depmap[direct].filename, opts)
      } else compiler(obj.filename, opts) // Compile File
      obj['lastUpdated'] = stats.mtime.getTime()
    }
  })
}
