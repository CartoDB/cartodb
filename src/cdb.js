// Creates cdb object, mutated in the entry file cartodb.js
// Used to avoid circular dependencies
var cdb = {};

cdb.VERSION = require('../package.json').version;
cdb.DEBUG = false;

cdb.helpers = {};

module.exports = cdb;
