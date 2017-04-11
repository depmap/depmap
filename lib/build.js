const fs = require('fs')
const path = require('path')
const process = require('process')
const globber = require('glob')
const merge = require('lodash.merge')
const isEmpty = require('lodash.isEmpty')
const trueType = require('typeof')
const pretty = require('depmap-errors')
const diff = require('depmap-diff')

const defaults = {
  path: process.cwd(),
  output: '',
  ignore: [],
  load: {},
  glob: { ignore: [] }
}

module.exports = (opts) => {
  opts = setupOpts(opts)
  const files = globber.sync(opts.path, opts.glob)
  const map = getMap(files, opts)
  return [ map, opts ]
}

function setupOpts (opts) {
  opts = merge({}, defaults, opts)
  opts.glob.ignore = opts.glob.ignore.concat(opts.ignore)

  // TODO check for installed loaders from package.json
  // TODO if no loaders found, suggest loaders based on filetypes
  let loadType = trueType(opts.load)
  if (loadType !== 'object') {
    throw new ConfigError(`load TypeError, Unexpected ${loadType}`)
  } else if (isEmpty(opts.load)) {
    console.log('error:', opts)
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

function getMap (files, opts) {
  const map = {}
  const promises = []

  for (let key in files) {
    let file = files[key]
    if (!fs.lstatSync(file).isDirectory()) {
      let meta = path.parse(file)
      meta.ext = meta.ext.substring(1)
      key = `${meta.ext}_${meta.name.trim()}`
      let compiler = diff
      if (opts.onUpdate) compiler = opts.onUpdate[meta.ext] ? opts.onUpdate[meta.ext] : compiler
      map[key] = {
        filename: file,
        dependsOn: [],
        onUpdate: compiler
      }

      if (typeof opts.load[meta.ext] !== 'undefined') {
        map[key].dependsOn = opts.load[meta.ext].parse(file, meta)
      } else {
        // TODO check if opts.load[meta.ext.substring(1)] exists
        // if not, check if it wasn't properly named by iterating over
        // opts.load[iterator].meta.ext
        for (let loader in opts.load) {
          let pos = opts.load[loader].meta.ext.indexOf(meta.ext)
          if (pos > -1) map[key].dependsOn = opts.load[loader].parse(file, meta)
          // TODO Tie in compiler to loader to pass to diff
        }
        if (typeof opts.load[meta.ext] !== 'undefined') throw new Error(`Loader not found for ${meta.ext}`)
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
