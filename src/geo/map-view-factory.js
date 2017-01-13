/* global google */
var cdb = require('cdb');

var MapViewFactory = function () {};

MapViewFactory.prototype.createMapView = function (provider, visModel, mapModel, layerGroupModel) {
  var MapViewClass;

  if (provider === 'leaflet') {
    MapViewClass = cdb.geo.LeafletMapView;
  } else if (provider === 'googlemaps') {
    if (typeof (google) !== 'undefined' && typeof (google.maps) !== 'undefined') {
      MapViewClass = cdb.geo.GoogleMapsMapView;
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
