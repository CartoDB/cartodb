var isLeafletAlreadyLoaded = !!window.L;

var _ = require('underscore');
var L = require('leaflet');
require('mousewheel'); // registers itself to $.event; TODO what's this required for? still relevant for supported browsers?
require('mwheelIntent'); // registers itself to $.event; TODO what's this required for? still relevant for supported browsers?

var cdb = require('cdb');
cdb.Backbone = require('backbone');
cdb.Mustache = require('mustache');
cdb.$ = require('jquery');
cdb._ = _;
cdb.L = L;

if (isLeafletAlreadyLoaded) L.noConflict();
_.extend(L, require('./geo/leaflet-extensions'));
_.extend(cdb.geo, require('./geo/leaflet'));

cdb.Image = require('./vis/image')
cdb.SQL = require('./api/sql');

cdb.config = require('cdb.config');
cdb.log = require('cdb.log');
cdb.errors = require('cdb.errors');
cdb.templates = require('cdb.templates');
cdb.decorators = require('./core/decorators');
cdb.createVis = require('./api/create-vis');
cdb.createLayer = require('./api/create-layer');

// Extracted from vis/vis.js,
// used in libs like torque and odyssey to add themselves here (or so it seems)
cdb.moduleLoad = function(name, mod) {
  cdb[name] = mod;
  cdb.config.modules.add({
    name: name,
    mod: mod
  });
};

cdb.core.Profiler = require('cdb.core.Profiler');
cdb.core.util = require('cdb.core.util');
cdb.core.Loader = cdb.vis.Loader = require('./core/loader');
cdb.core.sanitize = require('./core/sanitize')
cdb.core.Template = require('./core/template');
cdb.core.TemplateList = require('./core/template-list');
cdb.core.Model = require('./core/model');
cdb.core.View = require('./core/view');

cdb.ui.common.Dialog = require('./ui/common/dialog');
cdb.ui.common.ShareDialog = require('./ui/common/share');
cdb.ui.common.Dropdown = require('./ui/common/dropdown');
cdb.ui.common.FullScreen = require('./ui/common/fullscreen');
cdb.ui.common.Notification = require('./ui/common/notification');
cdb.ui.common.Row = require('./ui/common/table/row');
cdb.ui.common.TableData = require('./ui/common/table/table-data');
cdb.ui.common.TableProperties = require('./ui/common/table/table-properties');
cdb.ui.common.RowView = require('./ui/common/table/row-view');
cdb.ui.common.Table = require('./ui/common/table');

cdb.geo.common.CartoDBLogo = require('./geo/cartodb-logo');

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

_.extend(cdb.geo, require('./geo/gmaps'));

// overwrites the _Promise defined from the core bundle
cdb._Promise = require('./api/_promise');

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
cdb.geo.ui.InfoBox = require('./geo/ui/infobox');
cdb.geo.ui.Tooltip = require('./geo/ui/tooltip');

cdb.vis.INFOWINDOW_TEMPLATE = require('./vis/vis/infowindow-template');
cdb.vis.Overlay = require('./vis/vis/overlay');
cdb.vis.Overlays = require('./vis/vis/overlays');
cdb.vis.Layers = require('./vis/vis/layers');
cdb.vis.Vis = require('./vis/vis');
require('./vis/overlays'); // Overlay.register calls
require('./vis/layers'); // Layers.register calls

module.exports = cdb;
