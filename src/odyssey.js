var cdb = window.cdb;
if (!cdb) {
  throw new Error('cartodb.js is required to have been loaded before this one');
}

var O = require('odyssey');
cdb.moduleLoad('odyssey', O);
