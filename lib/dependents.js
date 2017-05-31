module.exports = dependents

function dependents (depmap) {
  setDirectDependents(depmap)

  // Build dependency tree
  for (let file in depmap) {
    depmap[file].dependencies = setDependents(depmap, file)
    depmap[file].dependencies = normalizeDependents(depmap[file].dependencies, [])
  }

  // Delete directDependents
  for (let file in depmap) {
    let obj = depmap[file]
    delete obj.directDependents
    delete obj.dependsOn
  }

  return depmap
}

function setDirectDependents (depmap) {
  for (let file in depmap) depmap[file].directDependents = []

  for (let file in depmap) {
    let obj = depmap[file]

    obj.directDependents = []
    if (obj.dependsOn) {
      for (let dependency of obj.dependsOn) {
        if (!depmap[dependency])
          throw new DepmapError(`Dependency '${dependency}' not found for '${file}'`)

        depmap[dependency].directDependents.push(file)
      }
    }
  }

  return depmap
}

/**
 * Sets the denormalized dependency map to a specific file in the
 * dependency map.
 */
function setDependents (depmap, file) {
  let result = {}
  let obj = depmap[file]

  for (let i = 0; i < obj.directDependents.length; i++) {
    let file = obj.directDependents[i]
    result[file] = setDependents(depmap, file)
  }

  return result
}

function normalizeDependents (dependents, dependentsStack) {
  let result = {}
  dependentsStack.push([])
  let currentArray = dependentsStack[dependentsStack.length - 1]

  Object.keys(dependents).forEach(file => {
    // Update this dependency stack
    if (!fileInDependentsStack(file, dependentsStack)) {
      currentArray.push(file)
    }
  })

  for (let i = 0; i < currentArray.length; i++) {
    let file = currentArray[i]
    result[file] = normalizeDependents(dependents[file], dependentsStack)
  }

  dependentsStack.pop()
  return result
}

function fileInDependentsStack (file, dependentsStack) {
  for (let i = 0; i < dependentsStack.length; i++) {
    let array = dependentsStack[i]

    for (let j = 0; j < array.length; j++) {
      if (file === array[j])
        return true
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
