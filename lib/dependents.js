module.exports = dependents

function dependents (depmap) {
  setDirectDependents(depmap) // TODO this mutates

  // Build dependency tree
  for (let key in depmap) {
    depmap[key].dependencies = setDependents(depmap, key)
    depmap[key].dependencies = normalizeDependents(depmap[key].dependencies, [])
  }

  // Delete directDependents
  for (let key in depmap) {
    let obj = depmap[key]
    delete obj.directDependents
    delete obj.dependsOn
  }

  return depmap
}

function setDirectDependents (depmap) {
  for (let key in depmap) depmap[key].directDependents = []

  for (let key in depmap) {
    let obj = depmap[key]

    obj.directDependents = []
    if (obj.dependsOn) {
      for (let dependency of obj.dependsOn) {
        if (!depmap[dependency]) {
          let realName = /(\w+)\_(.*)/g.exec(dependency)
          let parentName = /(\w+)\_(.*)/g.exec(key)
          throw new DepmapError(`Dependency '${realName[2]}.${realName[1]}' not found for '${parentName[2]}.${parentName[1]}'`)
        }
        depmap[dependency].directDependents.push(key)
      }
    }
  }

  return depmap
}

/**
 * Sets the denormalized dependency map to a specific key in the
 * dependency map.
 */
function setDependents (depmap, key) {
  var result = {}
  var obj = depmap[key]

  for (var i = 0; i < obj.directDependents.length; i++) {
    var key = obj.directDependents[i]
    result[key] = setDependents(depmap, key)
  }

  return result
}

function normalizeDependents (dependents, dependentsStack) {
  var result = {}
  dependentsStack.push([])
  var currentArray = dependentsStack[dependentsStack.length - 1]

  Object.keys(dependents).forEach(key => {
    // Update this dependency stack
    if (!keyInDependentsStack(key, dependentsStack)) {
      currentArray.push(key)
    }
  })

  for (var i = 0; i < currentArray.length; i++) {
    var key = currentArray[i]
    result[key] = normalizeDependents(dependents[key], dependentsStack)
  }

  dependentsStack.pop()
  return result
}

function keyInDependentsStack (key, dependentsStack) {
  for (var i = 0; i < dependentsStack.length; i++) {
    var array = dependentsStack[i]
    for (var j = 0; j < array.length; j++) {
      if (key === array[j]) {
        return true
      }
    }
  }

  return false
}
class DepmapError extends Error {
  constructor(...args) {
    super(...args)
    Object.defineProperty(this, 'name', {
      value: this.constructor.name
    })
    Error.captureStackTrace(this, this.constructor)
  }
}
