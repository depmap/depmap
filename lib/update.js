const fs = require('fs')
const pretty = require('@depmap/errors')
const isEmpty = require('lodash.isempty')

module.exports = function (keys, depmap, opts, singleCompilation=false) {
  if (!Array.isArray(keys)) keys = [keys]
  let updates = []

  for (let key of keys) {
    let obj = depmap[key]
    let file = obj.context.filepath
    let stats = fs.statSync(file)

    if (!obj['lastUpdated'] && !singleCompilation) {
      obj['lastUpdated'] = stats.mtime.getTime()
    } else if (obj['lastUpdated'] !== stats.mtime.getTime() || singleCompilation) {
      var dep = {}
      dep[key] = obj.dependencies

      if (!isEmpty(obj.dependencies)) { // Compile dependencies
        for (let direct in obj.dependencies) {
          obj.onUpdate(depmap[direct], opts, depmap)
          updates.push(direct)
        }
      } else { // Compile File
        obj.onUpdate(obj, opts, depmap)
        updates.push(key)
      }

      obj['lastUpdated'] = stats.mtime.getTime()
    }
  }

  // TODO update depmap with new watchers
  return updates
}
