// Definitions shared in the cdb object for all bundles.
// Extracted from the older src/cartodb.js file (entry file prior to browserify)
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
cdb.geo.ui = {};
cdb.geo.geocoder = {};
cdb.ui = {};
cdb.ui.common = {};
cdb.vis = {};
cdb.decorators = {};

cdb.core.Profiler = require('cdb.core.Profiler');
cdb.core.util = require('cdb.core.util');
cdb.core.Loader = cdb.vis.Loader = require('./core/loader');

cdb.Image = require('./vis/image')
cdb.SQL = require('./api/sql');

if (!window.JST) window.JST = {};
window.cdb = window.cartodb = cdb;

module.exports = cdb;
