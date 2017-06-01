const fs = require('fs')
const path = require('path')

module.exports = (depmap, opts) => {
  if (!opts.cliArgs.stateless) {
    let dir = opts.cache && opts.cache.path ? opts.cache.path : '.cache'
    let cacheDir = path.join(process.cwd(), dir)
    let cache = path.join(cacheDir, 'depmap.json')

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir)
    fs.writeFileSync(cache, JSON.stringify(depmap, null, '  '), 'utf8')
    opts.logger.info('Saved depmap')
  }
}
