// Defintions shared for all non-core bundles
var cdb = require('./cdb-common');
cdb._ = require('underscore');
try {
  cdb.L = require('leaflet-proxy').get();
} catch (err) {
}
cdb.Mustache = require('mustache');
require('json2'); // TODO polyfills window.JSON, still necessary with modern browser?

cdb.$ = require('jquery-proxy').get();
cdb.Backbone = require('backbone-proxy').set(require('backbone')).get();

require('./cdb.config');

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

cdb.ui.common.Dialog = require('./ui/common/dialog');
cdb.ui.common.ShareDialog = require('./ui/common/share');

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

cdb.geo.Map = require('./geo/map');
cdb.geo.MapView = require('./geo/map-view');

require('./cdb.geo.leaflet');

cdb.geo.common = {};
cdb.geo.common.CartoDBLogo = require('./geo/cartodb-logo');

cdb.geo.ui.Text = require('./geo/ui/text');
cdb.geo.ui.Annotation = require('./geo/ui/annotation');
cdb.geo.ui.Image = require('./geo/ui/image');
cdb.geo.ui.Share = require('./geo/ui/share');
cdb.geo.ui.Zoom = require('./geo/ui/zoom');
cdb.geo.ui.ZoomInfo = require('./geo/ui/zoom-info');
require('./cdb.geo.ui.legend'); // require all the cdb.geo.ui legend models

cdb.geo.ui.InfowindowModel = require('./geo/ui/infowindow-model');
cdb.geo.ui.Infowindow = require('./geo/ui/infowindow');

cdb.geo.ui.SwitcherItemModel = require('./geo/ui/switcher-item-model');
cdb.geo.ui.SwitcherItems = require('./geo/ui/switcher-items');
cdb.geo.ui.SwitcherItem = require('./geo/ui/switcher-item');
cdb.geo.ui.Switcher = require('./geo/ui/switcher');

cdb.geo.ui.SlidesControllerItem = require('./geo/ui/slides-controller-item');
cdb.geo.ui.SlidesController = require('./geo/ui/slides-controller');
cdb.geo.ui.Header = require('./geo/ui/header');

cdb.geo.ui.Search = require('./geo/ui/search');

module.exports = cdb;
