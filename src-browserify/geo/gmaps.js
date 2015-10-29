module.exports = {
  gmaps: {
    PointView: require('./gmaps/gmaps-point-view'),
    PathView: require('./gmaps/gmaps-path-view')
  },
  GoogleMapsMapView: require('./gmaps/gmaps-map-view'),
  GMapsTiledLayerView: require('./gmaps/gmaps-tiled-layer-view'),
  GMapsCartoDBLayerView: require('./gmaps/gmaps-cartodb-layer-view'),
  CartoDBLayerGMaps: require('./gmaps/cartodb-layer-gmaps'),
  GMapsLayerView: require('./gmaps/gmaps-layer-view'),
  CartoDBLayerGroupGMaps: require('./gmaps/cartodb-layer-group-gmaps'),
  GMapsPlainLayerView: require('./gmaps/gmaps-plain-layer-view'),
  GMapsBaseLayerView: require('./gmaps/gmaps-base-layer-view'),
  CartoDBNamedMapGMaps: require('./gmaps/cartodb-named-map-gmaps'),
  GMapsCartoDBLayerGroupView: require('./gmaps/gmaps-cartodb-layer-group-view'),
  GMapsCartoDBNamedMapView: require('./gmaps/gmaps-cartodb-named-map-view')
};
