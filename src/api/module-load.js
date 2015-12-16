var cdb = require('cdb')
var config = require('cdb.config')

module.exports = function (name, mod) {
  cdb[name] = mod
  config.modules.add({
    name: name,
    mod: mod
  })
}
