module.exports = dependents

function dependents (depmap) {
  setDirectDependents(depmap) // TODO this mutates

  // Build dependency tree
  Object.keys(depmap).forEach(key => {
    depmap[key].dependencies = setDependents(depmap, key)
    depmap[key].dependencies = normalizeDependents(depmap[key].dependencies, [])
  })

  // Delete directDependents
  Object.keys(depmap).forEach(key => {
    let obj = depmap[key]
    if (!obj.directDependents) delete obj.directDependents
    if (!obj.dependsOn) delete depmap[key].dependsOn
  })

  return depmap
}

function setDirectDependents (depmap) {
  // Create empty arrays
  Object.keys(depmap).forEach(key => {
    let obj = depmap[key]

    obj.directDependents = []
    if (obj.dependsOn) {
      for (let dependency of obj.dependsOn) {
        depmap[dependency].directDependents.push(key)
      }
    }
  })

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
