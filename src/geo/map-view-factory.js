var LeafletMapView = require('./leaflet/leaflet-map-view');
var GoogleMapsMapView;
// Check if google maps is defined
if (window.google && window.google.maps) {
  GoogleMapsMapView = require('./gmaps/gmaps-map-view');
}

/**
 * Create a map view.
 */
function MapViewFactory () {

}

MapViewFactory.createMapView = function (provider, visModel) {
  switch (provider) {
    case 'leaflet':
      return _createLeafletMap(visModel);
    case 'googlemaps':
      return _createGoogleMap(visModel);

    default:
      throw new Error(provider + ' provider is not supported');
  }
};

function _createLeafletMap (visModel, mapModel) {
  return new LeafletMapView({
    mapModel: visModel.map,
    engine: visModel.getEngine(),
    layerGroupModel: visModel.getEngine().getLayerGroup()
  });
}

function _createGoogleMap (visModel, mapModel) {
  if (!GoogleMapsMapView) {
    throw new Error('Google maps library should be included');
  }
  return new GoogleMapsMapView({
    mapModel: visModel.map,
    engine: visModel.getEngine(),
    layerGroupModel: visModel.getEngine().getLayerGroup()
  });
}

module.exports = MapViewFactory;
