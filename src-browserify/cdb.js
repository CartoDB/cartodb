// Creates cdb object, mutated in the entry file cartodb.js
// Used to avoid circular dependencies
var cdb = {};
cdb.VERSION = "3.15.8";
cdb.DEBUG = false;
cdb.CARTOCSS_DEFAULT_VERSION = '2.1.1';
cdb.CARTOCSS_VERSIONS = {
  '2.0.0': '',
  '2.1.0': ''
};

cdb.config = {};
cdb.core = {};
cdb.image = {};
cdb.geo = {};
cdb.geo.common = {};
cdb.geo.ui = {};
cdb.geo.geocoder = {};
cdb.ui = {};
cdb.ui.common = {};
cdb.vis = {};
cdb.decorators = {};

if (!window.JST) window.JST = {};
window.cdb = window.cartodb = cdb;

module.exports = cdb;
