// Creates cdb object, mutated in the entry file cartodb.js
// Used to avoid circular dependencies
var cdb = window.cdb = window.cartodb;

// Might be set in different bundles (e.g. cartodb.js vs. torque), avoid overriding it once set
if (!cdb) {
  cdb = window.cdb = window.cartodb = {};
  if (!window.JST) window.JST = {};
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
  cdb.geo.ui.Widget = {};
  cdb.geo.ui.Widget.List = {};
  cdb.geo.ui.Widget.Category = {};
  cdb.geo.ui.Widget.Histogram = {};
  cdb.geo.ui.Widget.Formula =

  cdb.ui = {};
  cdb.ui.common = {};

  cdb.vis = {};

  cdb.windshaft = {};
  cdb.windshaft.filters = {};
}

module.exports = cdb;
