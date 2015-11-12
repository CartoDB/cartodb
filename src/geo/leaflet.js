module.exports = {
  LeafletLayerView: require('./leaflet/leaflet-layer-view'),

  LeafletPlainLayerView: require('./leaflet/leaflet-plain-layer-view'),
  LeafletTiledLayerView: require('./leaflet/leaflet-tiled-layer-view'),
  LeafletGmapsTiledLayerView: require('./leaflet/leaflet-gmaps-tiled-layer-view'),
  LeafletWMSLayerView: require('./leaflet/leaflet-wms-layer-view'),

  LeafletCartoDBLayerGroupView: require('./leaflet/leaflet-cartodb-layer-group-view'),
  LeafletCartoDBNamedMapView: require('./leaflet/leaflet-cartodb-layer-group-view'),

  leaflet: {
    PointView: require('./leaflet/leaflet-point-view'),
    PathView: require('./leaflet/leaflet-path-view')
  },

  LeafletMapView: require('./leaflet/leaflet-map-view')
};
