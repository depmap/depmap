const fs = require('fs')
const path = require('path')
const process = require('process')
const globber = require('glob')
const merge = require('lodash.merge')
const isEmpty = require('lodash.isempty')
const trueType = require('typeof')
const pretty = require('@depmap/errors')
const diff = require('@depmap/diff')

const defaults = {
  path: process.cwd(),
  output: '',
  ignore: [],
  load: {},
  glob: { ignore: [] },
  cache: {
    path: './.cache'
  }
}

module.exports = opts => { opts = setupOpts(opts)
  const files = globber.sync(opts.path, opts.glob)
  let map = getMap(files, opts)
  map = mergeMaps(map, opts.load)
  return [map, opts]
}

function setupOpts(opts) {
  opts = merge({}, defaults, opts)
  opts.glob.ignore = opts.glob.ignore.concat(opts.ignore)

  let loadType = trueType(opts.load)
  if (loadType !== 'object') {
    throw new ConfigError(`load TypeError, Unexpected ${loadType}`)
  } else if (isEmpty(opts.load)) {
    throw new ConfigError('load is not set')
  }

  if (typeof opts.output !== 'string') {
    throw new ConfigError(`output TypeError, Unexpected ${trueType(opts.output)}`)
  } else if (!opts.output || opts.output === '') {
    opts.output = 'build'
    pretty.warn('ConfigWarning: No output specified, using build/')
  }

  return opts
}

function getMap(files, opts) {
  const map = {}
  const promises = []

  for (let file of files) {
    if (!fs.lstatSync(file).isDirectory()) {
      let meta = path.parse(file)

      let compiler = diff
      if (opts.onUpdate)
        compiler = opts.onUpdate[meta.ext] ? opts.onUpdate[meta.ext] : compiler

      map[file] = {
        dependsOn: [],
        onUpdate: compiler,
        context: {
          filepath: file,
          loader: meta.ext,
          key: undefined,
          data: undefined
        }
      }

      if (typeof opts.load[meta.ext] !== 'undefined') {
        map[file].dependsOn = opts.load[meta.ext].parse(file, meta)
      } else {
        // TODO check if opts.load[meta.ext.substring(1)] exists
        // if not, check if it wasn't properly named by iterating over
        // opts.load[iterator].meta.ext
        for (let loader in opts.load) {
          let pos = opts.load[loader].meta.ext.indexOf(meta.ext)
          if (pos > -1 && map[file].dependsOn.length === 0) {
            map[file].dependsOn = opts.load[loader].parse(file, meta)
          }
          // TODO Tie in compiler to loader to pass to diff
        }
        if (typeof opts.load[meta.ext] !== 'undefined') // not found
          throw new Error(`Loader not found for ${meta.ext}`)
      }
    }
  }

  return map
}

function mergeMaps(map, loaders, onUpdate) {
  const maps = []

  for (let loader in loaders)
    if (loaders[loader].map) maps.push(loaders[loader].map)

  for (let minimap in maps) {
    for (let key in maps[minimap]) {
      if (!map[key]) {
        map[key] = maps[minimap][key]
        map[key].onUpdate = map[key].onUpdate !== null ? map[key].onUpdate : diff
      }
    }
  }

  return map
}

class ConfigError extends Error {
  constructor(...args) {
    super(...args)
    Object.defineProperty(this, 'name', {
      value: this.constructor.name
    })
    Error.captureStackTrace(this, this.constructor)
  }
}
