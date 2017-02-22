const fs = require('fs');
const sleep = require('sleep');

/**
 * TODO
 */
function setDependedBy(depmap) {
  // Create empty arrays
  Object.keys(depmap).forEach(function (key) {
    let obj = depmap[key];
    obj['dependedBy'] = []
  });

  // Fill Arrays
  Object.keys(depmap).forEach(function (key) {
    let obj = depmap[key];
    if(obj.dependsOn) {
      for(let dependency of obj.dependsOn) {
        depmap[dependency].dependedBy.push(key);
      }
    }
  });
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
      //TODO updateTraversal(key);
      console.log('Update: ' + key)
      obj['lastUpdated'] = stats.mtime.getTime();
    }
  });
}

function watch(depmap) {
  setDependedBy(depmap); // TODO this mutates
  console.log(depmap);
  /*
  while(true) {
    update(depmap);
    sleep.msleep(100);
  }
  */
}

// ==========================
// ==========================
// ==========================

function compilePrinter(filename) {
  console.log('Compile ' + filename);
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
  },
  mixin: {
    filename: './src/mixin.html',
    dependsOn: [ 'sub_mixin' ],
  },
  sub_mixin: {
    filename: './src/sub_mixin.html'
  }
});

// =============

// Generates this map:
var dependedBy = {
  'mixin': { // Field in dependedBy in `sub_mixin`... Recusively calculates this
    'home': { // Field in dependedBy in `mixin`
      // Home has no dependedBy
    },
    'about': {
    },
    'template': {
      'home': {
      },
      'about': {
      }
    },
  }
};

// Then gets pruned to this:
var subMixinDependedBy = {
  'mixin': {
    'home': {},
    'about': {},
    'template': {
      //
    },
  }
};

/*
Recursively traverses from in -> out + manages stack of parental dependencies

sub_mixin->minin->home
  [[sub_mixin], ['mixin']]

sub_mixin->mixin->about
  [[sub_mixin], ['mixin']]

sub_mixin->mixin->template->home
  [[sub_mixin], ['mixin'], ['home', 'about', 'template']]
  --> DUPLICATE PRUNE!!

sub_mixin->mixin->template->about
  [[sub_mixin], ['mixin'], ['home', 'about', 'template']]
  --> DUPLICATE PRUNE!!

sub_mixin->mixin->template

sub_mixin.html
└── mixin.html
    ├── about.html      << RECOMPILED >>
    ├── home.html       << RECOMPILED >>
    └── template.html   << RECOMPILED >>
*/
