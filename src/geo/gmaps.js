var gmapsModels = {};

// only add models if google.maps lib is loaded
if (typeof(window.google) != 'undefined' && typeof(window.google.maps) != 'undefined') {
  gmapsModels = {
    gmaps: {
      PointView: require('./gmaps/gmaps-point-view'),
      PathView: require('./gmaps/gmaps-path-view')
    },
    GoogleMapsMapView: require('./gmaps/gmaps-map-view'),
    GMapsTiledLayerView: require('./gmaps/gmaps-tiled-layer-view'),
    GMapsLayerView: require('./gmaps/gmaps-layer-view'),
    GMapsPlainLayerView: require('./gmaps/gmaps-plain-layer-view'),
    GMapsBaseLayerView: require('./gmaps/gmaps-base-layer-view'),
    GMapsCartoDBLayerGroupView: require('./gmaps/gmaps-cartodb-layer-group-view'),
  };
}

module.exports = gmapsModels;
