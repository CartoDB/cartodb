var MapViewFactory = function () {};

var LeafletMapView = require('./leaflet/leaflet-map-view');
var GoogleMapsMapView;
if (typeof (window.google && window.google.maps) !== 'undefined') {
  GoogleMapsMapView = require('./gmaps/gmaps-map-view');
}

MapViewFactory.prototype.createMapView = function (provider, visModel, mapModel, layerGroupModel) {
  var MapViewClass;

  if (provider === 'leaflet') {
    MapViewClass = LeafletMapView;
  } else if (provider === 'googlemaps') {
    if (GoogleMapsMapView !== undefined) {
      MapViewClass = GoogleMapsMapView;
    } else {
      throw new Error('Google maps library should be included');
    }
  } else {
    throw new Error(provider + ' provider is not supported');
  }

  return new MapViewClass({
    mapModel: mapModel,
    visModel: visModel,
    layerGroupModel: layerGroupModel
  });
};

module.exports = MapViewFactory;
