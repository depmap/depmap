const fs = require('fs')
const dependents = require('./dependents.js')

module.exports = function (depmap, opts) {
  depmap = dependents(depmap)

  Object.keys(depmap).forEach(function (key) {
    let obj = depmap[key]
    fs.stat(obj.filename, (err, stats) => {
      if (!obj['lastUpdated']) {
        obj['lastUpdated'] = stats.mtime.getTime()
      } else if (obj['lastUpdated'] !== stats.mtime.getTime()) {
        // TODO
        if (obj.onUpdate != null) {
          var dep = {}
          dep[key] = obj.dependencies
          obj.onUpdate(dep, obj.filename)
        }

        obj['lastUpdated'] = stats.mtime.getTime()
      }
    })
  })
}
