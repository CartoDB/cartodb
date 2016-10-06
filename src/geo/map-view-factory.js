/* global google */
var cdb = require('cdb');
var LeafletLayerViewFactory = require('./leaflet/leaflet-layer-view-factory');
var LeafletGeometryViewFactory = require('./leaflet/geometries/view-factory');

var GMapsLayerViewFactory = require('./gmaps/gmaps-layer-view-factory');

var MapViewFactory = function () {};

MapViewFactory.prototype.createMapView = function (provider, mapModel, el, layerGroupModel) {
  var MapViewClass;
  var LayerViewFactoryClass;
  var geometryViewFactory;

  if (provider === 'leaflet') {
    MapViewClass = cdb.geo.LeafletMapView;
    LayerViewFactoryClass = LeafletLayerViewFactory;
    geometryViewFactory = LeafletGeometryViewFactory;
  } else if (provider === 'googlemaps') {
    if (typeof (google) !== 'undefined' && typeof (google.maps) !== 'undefined') {
      MapViewClass = cdb.geo.GoogleMapsMapView;
      LayerViewFactoryClass = GMapsLayerViewFactory;
    } else {
      throw new Error('Google maps library should be included');
    }
  } else {
    throw new Error(provider + ' provider is not supported');
  }

  return new MapViewClass({
    el: el,
    map: mapModel,
    layerGroupModel: layerGroupModel,
    layerViewFactory: new LayerViewFactoryClass({
      vector: mapModel.get('vector')
    }),
    geometryViewFactory: geometryViewFactory
  });
};

module.exports = MapViewFactory;
