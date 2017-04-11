const fs = require('fs')
const pretty = require('depmap-errors')
const isEmpty = require('lodash.isEmpty')

module.exports = function (depmap, opts, updateOnce=false) {
  let updatedFiles = []

  for (let key in depmap) {
    let obj = depmap[key]
    let stats = fs.statSync(obj.filename)

    if (!obj['lastUpdated'] && !updateOnce) {
      obj['lastUpdated'] = stats.mtime.getTime()
    } else if (obj['lastUpdated'] !== stats.mtime.getTime() || updateOnce) {
      var dep = {}
      dep[key] = obj.dependencies

      if (!isEmpty(obj.dependencies)) { // Compile dependencies
        for (let direct in obj.dependencies) {
          obj.onUpdate(depmap[direct].filename, opts)
          updatedFiles.push(depmap[direct].filename)
        }
      } else {
        obj.onUpdate(obj.filename, opts) // Compile File
        updatedFiles.push(obj.filename)
      }

      obj['lastUpdated'] = stats.mtime.getTime()
    }
  }

  return updatedFiles
}
