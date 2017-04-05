const fs = require('fs')
const pretty = require('depmap-errors')
const isEmpty = require('lodash.isEmpty')

module.exports = function (depmap, opts, updateOnce=false) {
  const compiler = opts.compiler ? opts.compiler : require('depmap-diff')

  for (let key in depmap) {
    let obj = depmap[key]
    let stats = fs.statSync(obj.filename)

    if (!obj['lastUpdated'] && !updateOnce) {
      obj['lastUpdated'] = stats.mtime.getTime()
    } else if (obj['lastUpdated'] !== stats.mtime.getTime() || updateOnce) {
      var dep = {}
      dep[key] = obj.dependencies
      // obj.onUpdate() // TODO add compilation by fn

      if (!isEmpty(obj.directDependents)) { // Compile DirectDependents (templates)
        for (let direct of obj.directDependents)
          compiler(depmap[direct].filename, opts)
      } else compiler(obj.filename, opts) // Compile File
      obj['lastUpdated'] = stats.mtime.getTime()
    }
  }
}
