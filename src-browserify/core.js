var _ = require('underscore');
var BackboneIsch = require('backbone-isch');
var Mustache = require('mustache');
var reqwest = require('reqwest');
var util = require('./core/util');
var Profiler = require('./core/profiler');
var setupTiles = require('./api/tiles');
var setupLoader = require('./core/loader');
var setup_Promise = require('./api/core-lib/_promise');
var setupSubLayerBase = require('./geo/sub-layer/sub-layer-base');
var setupHttpSubLayer = require('./geo/sub-layer/http-sub-layer');
var setupCartoDBSubLayer = require('./geo/sub-layer/cartodb-sub-layer');
var setupSubLayerFactory = require('./geo/sub-layer/sub-layer-factory');
var setupMapBase = require('./geo/layer-definition/map-base');
var setupLayerDefinition = require('./geo/layer-definition/layer-definition');
var setupNamedMap = require('./geo/layer-definition/named-map');
var setupStaticImage = require('./vis/image/static-image');
var setupImage = require('./vis/image');
var setupSQL = require('./api/sql');

var cdb = {};
cdb.VERSION = "3.15.8";
cdb.DEBUG = false;
cdb.CARTOCSS_VERSIONS = {
  '2.0.0': '',
  '2.1.0': ''
};
cdb.CARTOCSS_DEFAULT_VERSION = '2.1.1';
cdb.config = {};

var Loader = setupLoader(cdb);

var BackboneEvents = window.Backbone ? window.Backbone.Events : BackboneIsch.Events
var _Promise = setup_Promise(BackboneEvents);

cdb.core = {};
cdb.core.Profiler = Profiler;
cdb.core.util = util;
cdb.core.Loader = Loader;

var globalJQuery = window.$ || window.jQuery;

var SubLayerBase = setupSubLayerBase(BackboneEvents);
var HttpSubLayer = setupHttpSubLayer(SubLayerBase);
var BackboneModel = window.Backbone ? window.Backbone.Model : null;
var CartoDBSubLayer = setupCartoDBSubLayer(SubLayerBase, BackboneModel);
var SubLayerFactory = setupSubLayerFactory(CartoDBSubLayer, HttpSubLayer);
var MapBase = setupMapBase(SubLayerFactory, {
  jQueryAjax: globalJQuery ? globalJQuery.ajax : undefined,
  reqwestCompat: reqwest.compat
});
var LayerDefinition = setupLayerDefinition(MapBase, cdb.CARTOCSS_DEFAULT_VERSION);
var NamedMap = setupNamedMap(MapBase, SubLayerFactory);
var StaticImage = setupStaticImage(Loader, LayerDefinition, MapBase, NamedMap);
cdb.Image = setupImage(StaticImage);

cdb.Tiles = setupTiles(LayerDefinition, reqwest.compat);

var SQL = setupSQL(_Promise, {
  jQuery: globalJQuery,
  reqwest: reqwest // used as fallback in case jQuery is not loaded
});
cdb.SQL = SQL;

cdb.vis = {};
cdb.vis.Loader = Loader;

cdb._Promise = _Promise;

if (typeof window !== 'undefined') {
  window.cartodb = cdb;

  if (!window.JST) window.JST = {};
  if (!window._) window._ = _;
  if (!window.Backbone) window.Backbone = BackboneIsch;
  if (!window.Mustache) window.Mustache = Mustache;

  // required by api/sql at global namespace at runtime
  window.reqwest = reqwest
}

module.exports = cdb;
