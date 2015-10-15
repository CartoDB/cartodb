(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else context[name] = definition()
})('cartodb', this, function() {
  var cdb = {};
  cdb.VERSION = "3.15.8";
  cdb.DEBUG = false;
  cdb.CARTOCSS_VERSIONS = {
    '2.0.0': '',
    '2.1.0': ''
  };
  cdb.CARTOCSS_DEFAULT_VERSION = '2.1.1';

  cdb.config = {};
  cdb.core = {
    Profiler: require('./core/profiler'),
    util: require('./core/util')
  };
  cdb.image = {};
  cdb.geo = {};
  cdb.geo.ui = {};
  cdb.geo.geocoder = {};
  cdb.ui = {};
  cdb.ui.common = {};
  cdb.vis = {};
  cdb.decorators = {};
  cdb._Promise = require('./api/core-lib/_promise');

  if (typeof window !== 'undefined') {
    window.cartodb = cdb;
    window.JST = window.JST || {};
    window._ = window._ || require('./api/core-lib/underscore-isch');
    window.Backbone = {
      Events: require('./api/core-lib/backbone-events-isch')
    }
  }

  return cdb;
});
