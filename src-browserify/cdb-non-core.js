// Defintions shared for all non-core bundles
var cdb = require('./cdb-common');
cdb._ = require('underscore');
cdb.L = require('leaflet-proxy').get();
cdb.Mustache = require('mustache');
require('json2'); // TODO polyfills window.JSON, still necessary with modern browser?

cdb.$ = require('jquery-proxy').get();
cdb.Backbone = require('backbone-proxy').set(require('backbone')).get();

var Config = require('./core/config');
cdb.config = require('config-proxy').set(new Config()).get();
cdb.config.set({
  cartodb_attributions: "CartoDB <a href='http://cartodb.com/attributions' target='_blank'>attribution</a>",
  cartodb_logo_link: "http://www.cartodb.com"
});

var Log = require('./core/log');
cdb.log = require('log-proxy').set(new Log({tag: 'cdb'})).get();

var ErrorList = require('./core/log/error-list');
cdb.errors = require('errors-proxy').set(new ErrorList()).get();

// These must be set after the proxied requires:
cdb.decorators = require('./core/decorators');
cdb.core.sanitize = require('./core/sanitize')
cdb.core.Template = require('./core/template');
cdb.core.Model = require('./core/model');
cdb.core.View = require('./core/view');

var TemplateList = cdb.core.TemplateList = require('./core/template-list');
cdb.templates = require('templates-proxy').set(new TemplateList()).get();

cdb.geo.geocoder = {};
cdb.geo.geocoder.NOKIA = require('./geo/geocoder/nokia-geocoder');
cdb.geo.geocoder.YAHOO = require('./geo/geocoder/yahoo-geocoder');
cdb.geo.Geometry = require('./geo/geometry');
cdb.geo.Geometries = require('./geo/geometries');

cdb.geo.MapLayer = require('./geo/map/map-layer');
cdb.geo.TileLayer = require('./geo/map/tile-layer');
cdb.geo.GMapsBaseLayer = require('./geo/map/gmaps-base-layer');
cdb.geo.WMSLayer = require('./geo/map/wms-layer');
cdb.geo.PlainLayer = require('./geo/map/plain-layer');
cdb.geo.TorqueLayer = require('./geo/map/torque-layer');
cdb.geo.CartoDBLayer = require('./geo/map/cartodb-layer');
cdb.geo.CartoDBNamedMapLayer = require('./geo/map/cartodb-named-map-layer');
cdb.geo.Layers = require('./geo/map/layers');
cdb.geo.CartoDBGroupLayer = require('./geo/map/cartodb-group-layer');

cdb.geo.ui.InfowindowModel = require('./geo/ui/infowindow-model');
cdb.geo.ui.Infowindow = require('./geo/ui/infowindow');

cdb.geo.Map = require('./geo/map');
cdb.geo.MapView = require('./geo/map-view');

module.exports = cdb;
