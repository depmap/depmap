const fs = require('fs')
const dependents = require('./dependents.js')
const diff = require('depmap-diff')
const pretty = require('depmap-errors')

module.exports = function (depmap, opts) {
  depmap = dependents(depmap)

  Object.keys(depmap).forEach(function (key) {
    let obj = depmap[key]
    let stats = fs.statSync(obj.filename)

    if (!obj['lastUpdated']) {
      obj['lastUpdated'] = stats.mtime.getTime()
    } else if (obj['lastUpdated'] !== stats.mtime.getTime()) {
      // TODO
      if (obj.onUpdate != null) {
        var dep = {}
        dep[key] = obj.dependencies
        obj.onUpdate(diff(dep, obj.filename, opts.load))
      }

      obj['lastUpdated'] = stats.mtime.getTime()
    }
  })
}
