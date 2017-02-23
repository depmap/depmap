const fs = require('fs');
const sleep = require('sleep');
const treeify = require('treeify');

/**
 * TODO
 */
function setDirectDependents(depmap) {
  // Create empty arrays
  Object.keys(depmap).forEach(function (key) {
    let obj = depmap[key];
    obj['directDependents'] = []
  });

  // Fill directDependents
  Object.keys(depmap).forEach(function (key) {
    let obj = depmap[key];
    if(obj.dependsOn) {
      for(let dependency of obj.dependsOn) {
        depmap[dependency].directDependents.push(key);
      }
    }
  });
}

/**
 * Sets the denormalized dependency map to a specific key in the
 * dependency map.
 */
function setDependents(depmap, key) {
    var result = {}
    var obj = depmap[key];
    for (var i = 0; i < obj.directDependents.length; i++) {
      var key = obj.directDependents[i];
      result[key] = setDependents(depmap, key);
    }
    return result
}

/**
 * TODO
 */
function normalizeDependents(dependents, dependentsStack) {
  var result = {}
  dependentsStack.push([]);
  var currentArray = dependentsStack[dependentsStack.length - 1];
  Object.keys(dependents).forEach(function (key) {
    // Update this dependency stack
    if(!keyInDependentsStack(key, dependentsStack)) {
      currentArray.push(key);
    }
  });

  for (var i = 0; i < currentArray.length; i++) {
    var key = currentArray[i];
    result[key] = normalizeDependents(dependents[key], dependentsStack);
  }

  dependentsStack.pop();
  return result;
}

/**
 *
 */
function keyInDependentsStack(key, dependentsStack) {
  for (var i = 0; i < dependentsStack.length; i++) {
    var array = dependentsStack[i];
    for (var j = 0; j < array.length; j++) {
      if(key === array[j]) {
        return true
      }
    }
  }
  return false;
}


/**
 * TODO
 */
function update(depmap) {
  Object.keys(depmap).forEach(function (key) {
    let obj = depmap[key];
    let stats = fs.statSync(obj.filename);

    if(!obj['lastUpdated']){
      obj['lastUpdated'] = stats.mtime.getTime();
    } else if(obj['lastUpdated'] !== stats.mtime.getTime()) {
      // TODO
      if(obj.onUpdate != null) {
        var dep = {}
        dep[key] = obj.dependencies;
        obj.onUpdate(dep, obj.filename)
      }

      obj['lastUpdated'] = stats.mtime.getTime();
    }
  });
}

function watch(depmap) {
  setDirectDependents(depmap); // TODO this mutates

  // Build dependency tree
  Object.keys(depmap).forEach(function (key) {
    depmap[key].dependencies = setDependents(depmap, key);
    depmap[key].dependencies = normalizeDependents(depmap[key].dependencies, []);
  });

  // Delete directDependents
  Object.keys(depmap).forEach(function (key) {
    delete depmap[key].directDependents
    delete depmap[key].dependsOn
  })

  // TODO: for demo -- console.log(JSON.stringify(depmap))

  while(true) {
    update(depmap);
    sleep.msleep(100);
  }
}

// ==========================
// ==========================
// ==========================

function compilePrinter(dependencies, filename) {
  console.log(treeify.asTree(dependencies))
}

watch({
  home: {
    filename: './src/home.html',
    dependsOn: [ 'template', 'mixin' ],
    onUpdate: compilePrinter
  },
  about: {
    filename: './src/about.html',
    dependsOn: [ 'template', 'mixin' ],
    onUpdate: compilePrinter
  },
  template: {
    filename: './src/template.html',
    dependsOn: [ 'mixin' ],
    onUpdate: compilePrinter
  },
  mixin: {
    filename: './src/mixin.html',
    dependsOn: [ 'sub_mixin' ],
    onUpdate: compilePrinter
  },
  sub_mixin: {
    filename: './src/sub_mixin.html',
    onUpdate: compilePrinter
  }
});

/*
sub_mixin.html
└── mixin.html
    ├── about.html      << RECOMPILED >>
    ├── home.html       << RECOMPILED >>
    └── template.html   << RECOMPILED >>
*/
