// Creates cdb object, mutated in the entry file cartodb.js
// Used to avoid circular dependencies
var cdb = {};

// Might be set in different bundles (e.g. cartodb.js vs. torque), avoid overriding it once set
cdb.VERSION = "3.15.8";
cdb.DEBUG = false;
cdb.CARTOCSS_DEFAULT_VERSION = '2.1.1';
cdb.CARTOCSS_VERSIONS = {
  '2.0.0': '',
  '2.1.0': ''
};

cdb.config = {};
cdb.core = {};
cdb.decorators = {};
cdb.image = {};

cdb.geo = {};
cdb.geo.common = {};
cdb.geo.geocoder = {};
cdb.geo.ui = {};

cdb.ui = {};
cdb.ui.common = {};

cdb.vis = {};

cdb.windshaft = {};
cdb.windshaft.filters = {};

module.exports = cdb;
