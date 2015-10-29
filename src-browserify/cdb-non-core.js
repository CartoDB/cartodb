// Defintions shared for all non-core bundles
var cdb = require('cdb');
var _ = cdb._ = require('underscore');
cdb.Mustache = require('mustache');
require('json2'); // TODO polyfills window.JSON, still necessary with modern browser?

cdb.$ = require('jquery-proxy').get();
cdb.Backbone = require('backbone-proxy').set(require('backbone')).get();

cdb.config = require('cdb.config');
cdb.log = require('cdb.log');
cdb.errors = require('cdb.errors');
cdb.templates = require('cdb.templates');
cdb.decorators = require('./core/decorators');

cdb.core.sanitize = require('./core/sanitize')
cdb.core.Template = require('./core/template');
cdb.core.TemplateList = require('./core/template-list');
cdb.core.Model = require('./core/model');
cdb.core.View = require('./core/view');

cdb.ui.common.Dialog = require('./ui/common/dialog');
cdb.ui.common.ShareDialog = require('./ui/common/share');
cdb.ui.common.Dropdown = require('./ui/common/dropdown');

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

var L;
try {
  L = require('leaflet-proxy').get();
} catch (err) {
  // e.g. no-leaflet bundle
}
if (L) {
  cdb.L = L;
  _.extend(L, require('./geo/leaflet-extensions'));
  _.extend(cdb.geo, require('./geo/leaflet'));
}

// if google maps is not defined do not load the class
if (typeof(window.google) != 'undefined' && typeof(window.google.maps) != 'undefined') {
  require('google-proxy').set(window.google);
  cdb.geo.GoogleMapsMapView = require('./geo/gmaps/gmaps-map-view');
  cdb.geo.GMapsTiledLayerView = require('./geo/gmaps/gmaps-tiled-layer-view');
  cdb.geo.GMapsCartoDBLayerView = require('./geo/gmaps/gmaps-cartodb-layer-view');
  cdb.geo.CartoDBLayerGMaps = require('./geo/gmaps/cartodb-layer-gmaps');
  cdb.geo.GMapsLayerView = require('./geo/gmaps/gmaps-layer-view');
  cdb.geo.CartoDBLayerGroupGMaps = require('./geo/gmaps/cartodb-layer-group-gmaps');
  cdb.geo.GMapsPlainLayerView = require('./geo/gmaps/gmaps-plain-layer-view');
  cdb.geo.GMapsBaseLayerView = require('./geo/gmaps/gmaps-base-layer-view');
  cdb.geo.CartoDBNamedMapGMaps = require('./geo/gmaps/cartodb-named-map-gmaps');
  cdb.geo.GMapsCartoDBLayerGroupView = require('./geo/gmaps/gmaps-cartodb-layer-group-view');
  cdb.geo.GMapsCartoDBNamedMapView = require('./geo/gmaps/gmaps-cartodb-named-map-view');

  cdb.geo.gmaps = {};
  cdb.geo.gmaps.PointView = require('./geo/gmaps/gmaps-point-view');
  cdb.geo.gmaps.PathView = require('./geo/gmaps/gmaps-path-view');
}

cdb.geo.common = {};
cdb.geo.common.CartoDBLogo = require('./geo/cartodb-logo');

cdb.geo.ui.Text = require('./geo/ui/text');
cdb.geo.ui.Annotation = require('./geo/ui/annotation');
cdb.geo.ui.Image = require('./geo/ui/image');
cdb.geo.ui.Share = require('./geo/ui/share');
cdb.geo.ui.Zoom = require('./geo/ui/zoom');
cdb.geo.ui.ZoomInfo = require('./geo/ui/zoom-info');

// setup expected object structure here, to avoid circular references
_.extend(cdb.geo.ui, require('./geo/ui/legend-exports'));
cdb.geo.ui.Legend = require('./geo/ui/legend');
_.extend(cdb.geo.ui.Legend, require('./geo/ui/legend/legend-view-exports'));

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

cdb.geo.ui.LayerSelector = require('./geo/ui/layer-selector');
cdb.geo.ui.LayerView = require('./geo/ui/layer-view');
cdb.geo.ui.LayerViewFromLayerGroup = require('./geo/ui/layer-view-from-layer-group');

cdb.geo.ui.MobileLayer = require('./geo/ui/mobile-layer');
cdb.geo.ui.Mobile = require('./geo/ui/mobile');
cdb.geo.ui.TilesLoader = require('./geo/ui/tiles-loader');
cdb.geo.ui.TimeSlider = require('./geo/ui/time-slider');
cdb.geo.ui.InfoBox = require('./geo/ui/infobox');

module.exports = cdb;
