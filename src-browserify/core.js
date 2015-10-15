(function (name, context, definition) {
  if (typeof module != 'undefined' && module.exports) module.exports = definition()
  else context[name] = definition()
})('cartodb', this, function() {
  var BackboneEventsIsch = require('./api/core-lib/backbone-events-isch');
  var _Promise = require('./api/core-lib/promise');
  var _ = require('./api/core-lib/underscore-isch');

  var cdb = {};
  cdb.VERSION = "3.15.8";
  cdb.DEBUG = false;
  cdb.CARTOCSS_VERSIONS = {
    '2.0.0': '',
    '2.1.0': ''
  };
  cdb.CARTOCSS_DEFAULT_VERSION = '2.1.1';

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
  cdb._Promise = _Promise;

  if (typeof window !== 'undefined') {
    if (typeof window._ === 'undefined') {
      window._ = _;
    }
    window.JST = window.JST || {};
    window.Backbone = {
      Events: BackboneEventsIsch
    }
  }

  return cdb;
});
