const path = require('path')
const process = require('process')
const globber = require('glob')
const merge = require('lodash.merge')
const isEmpty = require('lodash.isEmpty')
const trueType = require('typeof')
const pretty = require('depmap-errors')

const defaults = {
  path: process.cwd(),
  output: '',
  ignore: [],
  load: {},
  glob: { ignore: [] }
}

module.exports = async (opts) => {
  opts = merge({}, defaults, opts)

  return await setupOptions(opts)
    .then(getFiles)
    .then(buildMeta.bind(null, opts))
}

function setupOptions (opts) {
  return new Promise((resolve, reject) => {
    opts.glob.ignore = opts.glob.ignore.concat(opts.ignore)
    // TODO check for installed loaders from package.json
    // TODO if no loaders found, suggest loaders based on filetypes
    let loadType = trueType(opts.load)
    if (loadType !== 'object') {
      reject(new ConfigError(`load TypeError, Unexpected ${loadType}`))
    } else if (isEmpty(opts.load)) {
      reject(new ConfigError('load is not set'))
    }

    if (typeof opts.output !== 'string') {
      reject(new ConfigError(`output TypeError, Unexpected ${trueType(opts.output)}`))
    } else if (opts.output === '') {
      opts.output = 'build'
      pretty.warn('ConfigWarning: No output specified, using build/')
    }

    resolve(opts)
  })
}

function getFiles (opts) {
  return new Promise((resolve, reject) => {
    globber(opts.path, opts.glob, (err, files) => {
      if (err) reject(err)
      resolve(files)
    })
  })
}

function buildMeta (opts, files) {
  return new Promise((resolve, reject) => {
    const map = {}
    const promises = []

    for (let key in files) {
      let file = files[key]
      let meta = path.parse(file)
      meta.ext = meta.ext.substring(1)
      map[meta.name] = {
        filename: file,
        dependsOn: [],
        onUpdate: compilationType.bind(null, opts, meta.ext)
      }

      if (typeof opts.load[meta.ext] !== 'undefined') {
        promises.push(
          // TODO check if all deps exist before pushing
          opts.load[meta.ext].parse(file, meta)
            .then(deps => {
              map[meta.name].dependsOn = deps
            })
        )
      } else {
        throw new Error(`Loader not found for ${meta.ext}`)
      }
    }

    Promise.all(promises)
      .then(() => resolve(map))
  })
}

function compilationType (opts, ext,  deps, file) {
  return new Promise((resolve, reject) => {
    opts.compiler[ext](path.join(process.cwd(), file))
      .then(out => {
        fs.writeFile(path.join(opts.output, path.parse(file).base), output, err => {
          if (err) reject(err)
          resolve()
        })
      })
  })
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
