var cdb = require('cdb-proxy').get();

// TODO better to extract this if-check to bundles' entry-file?
if (typeof cdb.L !== 'undefined') {
  // "old" order maintained from src/cartodb.js
  // old leaflet_base.js
  cdb.geo.LeafetLayerView = require('./geo/leaflet/leaflet-layer-view');

  // old leaflet_<concept>.js (<concept> matches the name for each)
  cdb.geo.LeafletPlainLayerView = require('./geo/leaflet/leaflet-plain-layer-view');
  cdb.geo.LeafletTiledLayerView = require('./geo/leaflet/leaflet-tiled-layer-view');
  cdb.geo.LeafletGmapsTiledLayerView = require('./geo/leaflet/leaflet-gmaps-tiled-layer-view');
  cdb.geo.LeafletWMSLayerView = require('./geo/leaflet/leaflet-wms-layer-view');

  // old leaflet_cartodb_layergroup.js
  L.CartoDBGroupLayerBase = require('./geo/leaflet/leaflet-cartodb-group-layer-base')
  L.CartoDBGroupLayer = require('./geo/leaflet/leaflet-cartodb-group-layer');
  L.NamedMap = require('./geo/leaflet/leaflet-named-map');
  cdb.geo.LeafletCartoDBLayerGroupView = require('./geo/leaflet/leaflet-cartodb-layer-group-view');
  cdb.geo.LeafletCartoDBNamedMapView = require('./geo/leaflet/leaflet-cartodb-named-map-view');

  // old leaflet_cartodb_layer.js
  L.CartoDBLayer = require('./geo/leaflet/leaflet-cartodb-layer');
  cdb.geo.LeafletLayerCartoDBView = require('./geo/leaflet/leaflet-layer-cartodb-view');

  // old leaflet.geometry.js
  cdb.geo.leaflet = {
    PointView: require('./geo/leaflet/leaflet-point-view'),
    PathView: require('./geo/leaflet/leaflet-path-view')
  };

  // old leaflet.js
  cdb.geo.LeafletMapView = require('./geo/leaflet/leaflet-map-view');
}
