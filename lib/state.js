const fs = require('fs')
const path = require('path')

module.exports = depmap => {
  let cacheDir = path.join(process.cwd(), '.cache')
  let cache = path.join(cacheDir, 'depmap.json')

  if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir)
  fs.writeFileSync(cache, JSON.stringify(depmap, null, '  '), 'utf8')
}
