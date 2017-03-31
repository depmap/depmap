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
    let meta = path.parse(file)
    meta.ext = meta.ext.substring(1)
    map[meta.name] = {
      filename: file,
      dependsOn: [],
      onUpdate: diff
    }

    if (typeof opts.load[meta.ext] !== 'undefined') {
      map[meta.name].dependsOn = opts.load[meta.ext].parse(file, meta)
    } else {
      throw new Error(`Loader not found for ${meta.ext}`)
    }
  }

  return map
}

// function compilationType (opts, ext,  deps, file) {
//   return new Promise((resolve, reject) => {
//     opts.compiler[ext](path.join(process.cwd(), file))
//       .then(out => {
//         fs.writeFile(path.join(opts.output, path.parse(file).base), output, err => {
//           if (err) reject(err)
//           resolve()
//         })
//       })
//   })
// }

class ConfigError extends Error {
  constructor(...args) {
    super(...args)
    Object.defineProperty(this, 'name', {
      value: this.constructor.name
    })
    Error.captureStackTrace(this, this.constructor)
  }
}
